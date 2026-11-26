import { useEffect, useMemo } from 'react';

import ApplyDocumentsModal, { useCurrentBranchOnlyToggle } from '@/components/feedback/formModal/ApplyDocumentsModal';
import Toast from '@/components/ui/common/Toast';
import Icons from 'assets/icons/icon';
import { usePaymentMade, creditApplySchema } from '@/features/purchase/paymentsMade';
import { formatAmount } from '@/utils/currency';
import { EXPENSE_ROW_TYPE, OB_TYPE } from 'utils/constants';
import { mergePendingDropWithOb } from 'utils/openingBalanceUtils';

const ApplyToBillModal = ({ modalOpen, onClose, paymentMadeDetails, fetchPaymentMade }) => {
  const { paymentsMadeInvoiceDrop, paymentsMadeOpeningBalance, paymentsMadePendingExpenses, getPaymentsMadeInvoice, droploading, applyBillLoading, applyToBill, clearPaymentMadeInvoiceDrop } =
    usePaymentMade();
  const [currentBranchOnly, setCurrentBranchOnly] = useCurrentBranchOnlyToggle(modalOpen);

  const handleClose = () => {
    clearPaymentMadeInvoiceDrop();
    onClose();
  };

  const paymentBranchId = paymentMadeDetails?.branchId?._id || paymentMadeDetails?.branchId?.id || paymentMadeDetails?.branchId || null;
  const paymentBranchName = paymentMadeDetails?.branchName || paymentMadeDetails?.branchId?.name || '-';

  useEffect(() => {
    if (!modalOpen) return;

    const controller = new AbortController();
    const payload = {
      vendorId: paymentMadeDetails?.vendorId?._id || paymentMadeDetails?.vendorId,
      signal: controller.signal,
      isSplit: paymentMadeDetails?.isSplit,
    };
    if (currentBranchOnly && paymentBranchId) {
      payload.branchId = paymentBranchId;
    }
    getPaymentsMadeInvoice(payload);

    return () => controller.abort();
  }, [modalOpen, currentBranchOnly, paymentBranchId]);

  const combinedPendingBills = useMemo(
    () => mergePendingDropWithOb(paymentsMadeInvoiceDrop, paymentsMadeOpeningBalance, 'bill', paymentsMadePendingExpenses),
    [paymentsMadeInvoiceDrop, paymentsMadeOpeningBalance, paymentsMadePendingExpenses]
  );

  const onFinish = async values => {
    const hasAppliedCredits = values?.invoiceItems?.some(item => !isNaN(item?.amountApplied) && parseFloat(item?.amountApplied) > 0);

    if (!hasAppliedCredits) {
      Toast.warning('Please apply balance to at least one bill before submitting.');
      return;
    }

    let billData = [];
    let openingBalanceData = [];
    let expenseData = [];
    let totalAppliedAmount = 0;
    values?.invoiceItems?.forEach(item => {
      if (!isNaN(item?.amountApplied) && parseFloat(item?.amountApplied) > 0) {
        totalAppliedAmount = totalAppliedAmount + parseFloat(item?.amountApplied || 0);
        if (item?.type === EXPENSE_ROW_TYPE) {
          expenseData.push({
            expenseId: item?._id,
            expenseNo: item?.billId,
            amountApplied: parseFloat(item?.amountApplied),
          });
        } else if (item?.type === OB_TYPE.OPENING_PAYABLE) {
          openingBalanceData.push({
            openingBalanceTransactionId: item?._id || item?.id,
            transactionNo: item?.billId,
            amountApplied: parseFloat(item?.amountApplied) || 0,
          });
        } else {
          billData.push({
            billId: item?._id || item?.id,
            billNo: item?.billId,
            amountApplied: parseFloat(item?.amountApplied) || 0,
          });
        }
      }
    });

    if (totalAppliedAmount > parseFloat(paymentMadeDetails?.availableBalance ?? paymentMadeDetails?.unusedAmount ?? 0)) {
      Toast.warning('Total applied amount exceeds available balance');
      return;
    }

    try {
      await applyToBill({
        paymentId: paymentMadeDetails?._id,
        bills: billData,
        openingBalanceTransactions: openingBalanceData,
        expenses: expenseData,
      });
      if (fetchPaymentMade) fetchPaymentMade();
      handleClose();
    } catch {
      // error already handled in slice
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
          <span className="text-lg font-semibold">Apply Payment Made to Bills</span>
        </div>
      }
      branchLabel={paymentBranchName}
      summaryCards={[
        {
          icon: <Icons.FileTextOutlined className="text-blue-500" />,
          label: 'Payment Made #',
          value: paymentMadeDetails?.paymentMadeId || '-',
        },
        {
          icon: <Icons.WalletOutlined className="text-green-500" />,
          label: 'Available Balance',
          value: formatAmount(paymentMadeDetails?.availableBalance ?? paymentMadeDetails?.unusedAmount ?? 0, true, paymentMadeDetails?.currency),
          valueClassName: 'text-green-600',
        },
        {
          icon: <Icons.UserOutlined className="text-purple-500" />,
          label: 'Vendor Name',
          value: paymentMadeDetails?.vendorId?.customerDisplayName || paymentMadeDetails?.customerDisplayName || '-',
        },
      ]}
      alertMessage='Only bills with "Open", "Partially Paid", or "Overdue" status are available for mapping.'
      currentBranchOnly={currentBranchOnly}
      onCurrentBranchOnlyChange={setCurrentBranchOnly}
      loading={droploading}
      applyLoading={applyBillLoading}
      documentKind="bill"
      items={combinedPendingBills}
      currency={paymentMadeDetails?.currency}
      sectionSubtitle="Select the bills to apply advanced payments made to"
      emptySubtitle="All bills for this vendor have been paid or credited"
      getObSubtitle={item => (item?.type === OB_TYPE.OPENING_PAYABLE ? '(Vendor opening balance)' : null)}
      validationSchema={creditApplySchema}
      onSubmit={onFinish}
    />
  );
};

export default ApplyToBillModal;
