import { useEffect, useMemo } from 'react';

import ApplyDocumentsModal, { useCurrentBranchOnlyToggle } from '@/components/feedback/formModal/ApplyDocumentsModal';
import Toast from '@/components/ui/common/Toast';
import Icons from 'assets/icons/icon';
import { useBill } from '@/features/purchase/bills/useBill';
import { useDebitNote, creditApplySchema } from '@/features/purchase/debitNotes';
import { formatAmount } from '@/utils/currency';
import { OB_TYPE } from 'utils/constants';
import { mergePendingDropWithOb } from 'utils/openingBalanceUtils';

const ApplyBillModal = ({ modalOpen, onClose, debitNoteDetails, fetchDebitNote }) => {
  const { vendorPendingBills, vendorPendingOpeningBalance, getPendingBills, pendingBillsLoading } = useBill();
  const { applyDebitNote, loading } = useDebitNote();
  const [currentBranchOnly, setCurrentBranchOnly] = useCurrentBranchOnlyToggle(modalOpen);

  const debitBranchId = debitNoteDetails?.branchId?._id || debitNoteDetails?.branchId?.id || debitNoteDetails?.branchId || null;
  const debitBranchName = debitNoteDetails?.branchName || debitNoteDetails?.branchId?.name || '-';

  useEffect(() => {
    if (!modalOpen) return;

    const controller = new AbortController();
    const payload = {
      vendorId: debitNoteDetails?.vendorId?._id || debitNoteDetails?.vendorId,
      signal: controller.signal,
      isAdd: false,
      isSplit: debitNoteDetails?.isSplit,
    };
    if (currentBranchOnly && debitBranchId) {
      payload.branchId = debitBranchId;
    }
    getPendingBills(payload);

    return () => controller.abort();
  }, [modalOpen, currentBranchOnly, debitBranchId]);

  const combinedPendingBills = useMemo(() => mergePendingDropWithOb(vendorPendingBills, vendorPendingOpeningBalance, 'bill'), [vendorPendingBills, vendorPendingOpeningBalance]);

  const onFinish = async values => {
    const hasAppliedCredits = values?.invoiceItems?.some(item => !isNaN(item?.amountApplied) && parseFloat(item?.amountApplied) > 0);

    if (!hasAppliedCredits) {
      Toast.warning('Please apply credits to at least one bill before submitting.');
      return;
    }

    let updatedData = [];
    let totalAppliedAmount = 0;
    values?.invoiceItems?.forEach(item => {
      if (!isNaN(item?.amountApplied) && parseFloat(item?.amountApplied) > 0) {
        totalAppliedAmount = totalAppliedAmount + parseFloat(item?.amountApplied || 0);
        if (item?.type === OB_TYPE.OPENING_PAYABLE) {
          updatedData.push({
            openingBalanceTransactionId: item?._id || item?.id,
            transactionNo: item?.billId,
            amountApplied: parseFloat(item?.amountApplied) || 0,
          });
        } else {
          updatedData.push({
            billId: item?._id || item?.id,
            billNo: item?.billId,
            amountApplied: parseFloat(item?.amountApplied) || 0,
          });
        }
      }
    });

    if (totalAppliedAmount > parseFloat(debitNoteDetails?.availableBalance || 0)) {
      Toast.warning('Total applied amount exceeds available balance');
      return;
    }

    try {
      await applyDebitNote({
        debitNoteId: debitNoteDetails?._id,
        applications: updatedData,
      });
      if (fetchDebitNote) fetchDebitNote();
      onClose();
    } catch {
      // Error toast is already surfaced by withErrorHandling; keep the modal open so the user can retry.
    }
  };

  return (
    <ApplyDocumentsModal
      modalOpen={modalOpen}
      onClose={onClose}
      destroyOnClose
      title={
        <div className="flex items-center space-x-2">
          <Icons.CreditCardOutlined className="text-blue-500 text-lg" />
          <span className="text-lg font-semibold">Apply Credits to Bills</span>
        </div>
      }
      branchLabel={debitBranchName}
      summaryCards={[
        {
          icon: <Icons.FileTextOutlined className="text-blue-500" />,
          label: 'Debit Note #',
          value: debitNoteDetails?.debitNoteId || '-',
        },
        {
          icon: <Icons.WalletOutlined className="text-green-500" />,
          label: 'Available Credits',
          value: formatAmount(debitNoteDetails?.availableBalance || 0, true, debitNoteDetails?.currency),
          valueClassName: 'text-green-600',
        },
        {
          icon: <Icons.UserOutlined className="text-purple-500" />,
          label: 'Vendor Name',
          value: debitNoteDetails?.vendorId?.customerDisplayName || debitNoteDetails?.customerDisplayName || '-',
        },
      ]}
      alertMessage='Only bills with "Open", "Partially Paid", or "Overdue" status are available for mapping.'
      currentBranchOnly={currentBranchOnly}
      onCurrentBranchOnlyChange={setCurrentBranchOnly}
      loading={pendingBillsLoading}
      applyLoading={loading}
      documentKind="bill"
      items={combinedPendingBills}
      initialAmountApplied={0}
      currency={debitNoteDetails?.currency}
      sectionSubtitle="Select the bills to apply credits to"
      emptySubtitle="All bills for this vendor have been paid or credited"
      applyButtonText="Apply Credits"
      clampToBalance
      getObSubtitle={item => (item?.type === OB_TYPE.OPENING_PAYABLE ? '(Vendor opening balance)' : null)}
      validationSchema={creditApplySchema}
      onSubmit={onFinish}
    />
  );
};

export default ApplyBillModal;
