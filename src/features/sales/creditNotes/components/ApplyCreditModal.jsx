import { useEffect, useMemo } from 'react';

import ApplyDocumentsModal, { useCurrentBranchOnlyToggle } from '@/components/feedback/formModal/ApplyDocumentsModal';
import Toast from '@/components/ui/common/Toast';
import Icons from 'assets/icons/icon';
import { usePaymentReceived } from '@/features/sales/paymentsReceived/usePaymentReceived';
import { useCreditNote, creditApplySchema } from '@/features/sales/creditNotes';
import { formatAmount } from '@/utils/currency';
import { OB_TYPE } from 'utils/constants';
import { mergePendingDropWithOb } from 'utils/openingBalanceUtils';

const ApplyCreditModal = ({ modalOpen, onClose, creditNoteDetails, fetchCreditNotes }) => {
  const { paymentInvoiceDrop, paymentInvoiceOpeningBalance, getPaymentInvoice, droploading, clearPaymentInvoiceDrop } = usePaymentReceived();
  const { loading, applyCreditNote } = useCreditNote();
  const [currentBranchOnly, setCurrentBranchOnly] = useCurrentBranchOnlyToggle(modalOpen);

  const creditBranchId = creditNoteDetails?.branchId?._id || creditNoteDetails?.branchId?.id || creditNoteDetails?.branchId || null;
  const creditBranchName = creditNoteDetails?.branchName || creditNoteDetails?.branchId?.name || '-';

  const handleClose = () => {
    clearPaymentInvoiceDrop?.();
    onClose();
  };

  useEffect(() => {
    if (!modalOpen) return;

    const controller = new AbortController();
    const payload = {
      customerId: creditNoteDetails?.customerId?._id || creditNoteDetails?.customerId,
      signal: controller.signal,
      isAdd: false,
      isSplit: creditNoteDetails?.isSplit,
    };
    if (currentBranchOnly && creditBranchId) {
      payload.branchId = creditBranchId;
    }
    getPaymentInvoice(payload);

    return () => controller.abort();
  }, [modalOpen, currentBranchOnly, creditBranchId]);

  const combinedPendingInvoices = useMemo(() => mergePendingDropWithOb(paymentInvoiceDrop, paymentInvoiceOpeningBalance, 'invoice'), [paymentInvoiceDrop, paymentInvoiceOpeningBalance]);

  const onFinish = async values => {
    const hasAppliedCredits = values?.invoiceItems?.some(item => !isNaN(item?.amountApplied) && parseFloat(item?.amountApplied) > 0);

    if (!hasAppliedCredits) {
      Toast.warning('Please apply credits to at least one invoice before submitting.');
      return;
    }

    let updatedData = [];
    let totalAppliedAmount = 0;
    values?.invoiceItems?.forEach(item => {
      if (!isNaN(item?.amountApplied) && parseFloat(item?.amountApplied) > 0) {
        totalAppliedAmount = totalAppliedAmount + parseFloat(item?.amountApplied || 0);
        if (item?.type === OB_TYPE.OPENING_RECEIVABLE) {
          updatedData.push({
            openingBalanceTransactionId: item?._id || item?.id,
            transactionNo: item?.invoiceId,
            amountApplied: parseFloat(item?.amountApplied) || 0,
          });
        } else {
          updatedData.push({
            invoiceId: item?._id || item?.id,
            invoiceNo: item?.invoiceId,
            amountApplied: parseFloat(item?.amountApplied) || 0,
          });
        }
      }
    });

    if (totalAppliedAmount > parseFloat(creditNoteDetails?.availableBalance || 0)) {
      Toast.warning('Total applied amount exceeds available balance');
      return;
    }

    const data = await applyCreditNote({
      creditNoteId: creditNoteDetails?._id,
      applications: updatedData,
    });

    if (data?.payload) {
      if (fetchCreditNotes) fetchCreditNotes();
      handleClose();
    }
  };

  return (
    <ApplyDocumentsModal
      modalOpen={modalOpen}
      onClose={handleClose}
      destroyOnClose
      title={
        <div className="flex items-center space-x-2">
          <Icons.CreditCardOutlined className="text-blue-500 text-lg" />
          <span className="text-lg font-semibold">Apply Credits to Invoices</span>
        </div>
      }
      branchLabel={creditBranchName}
      summaryCards={[
        {
          icon: <Icons.FileTextOutlined className="text-blue-500" />,
          label: 'Credit Note #',
          value: creditNoteDetails?.creditNoteId || '-',
        },
        {
          icon: <Icons.WalletOutlined className="text-green-500" />,
          label: 'Available Credits',
          value: formatAmount(creditNoteDetails?.availableBalance || 0, true, creditNoteDetails?.currency),
          valueClassName: 'text-green-600',
        },
        {
          icon: <Icons.UserOutlined className="text-purple-500" />,
          label: 'Customer Name',
          value: creditNoteDetails?.customerId?.customerDisplayName || creditNoteDetails?.customerDisplayName || '-',
        },
      ]}
      alertMessage='Only invoices with "Sent", "Partially Paid", or "Overdue" status are available for mapping.'
      currentBranchOnly={currentBranchOnly}
      onCurrentBranchOnlyChange={setCurrentBranchOnly}
      loading={droploading}
      applyLoading={loading}
      documentKind="invoice"
      items={combinedPendingInvoices}
      initialAmountApplied={0}
      currency={creditNoteDetails?.currency}
      sectionSubtitle="Select the invoices to apply credits to"
      emptySubtitle="All invoices for this customer have been paid or credited"
      applyButtonText="Apply Credits"
      clampToBalance
      getObSubtitle={item => (item?.type === OB_TYPE.OPENING_RECEIVABLE ? '(Customer opening balance)' : null)}
      validationSchema={creditApplySchema}
      onSubmit={onFinish}
    />
  );
};

export default ApplyCreditModal;
