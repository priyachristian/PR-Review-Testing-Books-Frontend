import { useEffect, useMemo } from 'react';

import ApplyDocumentsModal, { useCurrentBranchOnlyToggle } from '@/components/feedback/formModal/ApplyDocumentsModal';
import Toast from '@/components/ui/common/Toast';
import Icons from 'assets/icons/icon';
import { usePaymentReceived, creditApplySchema } from '@/features/sales/paymentsReceived';
import { formatAmount } from '@/utils/currency';
import { EXPENSE_ROW_TYPE, OB_TYPE } from 'utils/constants';
import { mergePendingDropWithOb } from 'utils/openingBalanceUtils';

const ApplyToInvoiceModal = ({ modalOpen, onClose, paymentReceivedDetails, fetchPaymentReceived }) => {
  const { paymentInvoiceDrop, paymentInvoiceOpeningBalance, paymentInvoicePendingExpenses, getPaymentInvoice, droploading, applyInvoiceLoading, applyToInvoice, clearPaymentInvoiceDrop } =
    usePaymentReceived();
  const [currentBranchOnly, setCurrentBranchOnly] = useCurrentBranchOnlyToggle(modalOpen);

  const handleClose = () => {
    clearPaymentInvoiceDrop();
    onClose();
  };

  const paymentBranchId = paymentReceivedDetails?.branchId?._id || paymentReceivedDetails?.branchId?.id || paymentReceivedDetails?.branchId || null;
  const paymentBranchName = paymentReceivedDetails?.branchName || paymentReceivedDetails?.branchId?.name || '-';

  useEffect(() => {
    if (!modalOpen) return;

    const controller = new AbortController();
    const payload = {
      customerId: paymentReceivedDetails?.customerId?._id || paymentReceivedDetails?.customerId,
      signal: controller.signal,
      isSplit: paymentReceivedDetails?.isSplit,
    };
    if (currentBranchOnly && paymentBranchId) {
      payload.branchId = paymentBranchId;
    }
    getPaymentInvoice(payload);

    return () => controller.abort();
  }, [modalOpen, currentBranchOnly, paymentBranchId]);

  const combinedPendingInvoices = useMemo(
    () => mergePendingDropWithOb(paymentInvoiceDrop, paymentInvoiceOpeningBalance, 'invoice', paymentInvoicePendingExpenses),
    [paymentInvoiceDrop, paymentInvoiceOpeningBalance, paymentInvoicePendingExpenses]
  );

  const onFinish = async values => {
    const hasAppliedCredits = values?.invoiceItems?.some(item => !isNaN(item?.amountApplied) && parseFloat(item?.amountApplied) > 0);

    if (!hasAppliedCredits) {
      Toast.warning('Please apply balance to at least one invoice before submitting.');
      return;
    }

    let invoiceData = [];
    let openingBalanceData = [];
    let expenseData = [];
    let totalAppliedAmount = 0;
    values?.invoiceItems?.forEach(item => {
      if (!isNaN(item?.amountApplied) && parseFloat(item?.amountApplied) > 0) {
        totalAppliedAmount = totalAppliedAmount + parseFloat(item?.amountApplied || 0);
        if (item?.type === EXPENSE_ROW_TYPE) {
          expenseData.push({
            expenseId: item?._id,
            expenseNo: item?.invoiceId,
            amountApplied: parseFloat(item?.amountApplied),
          });
        } else if (item?.type === OB_TYPE.OPENING_RECEIVABLE) {
          openingBalanceData.push({
            openingBalanceTransactionId: item?._id || item?.id,
            transactionNo: item?.invoiceId,
            amountApplied: parseFloat(item?.amountApplied) || 0,
          });
        } else {
          invoiceData.push({
            invoiceId: item?._id || item?.id,
            invoiceNo: item?.invoiceId,
            amountApplied: parseFloat(item?.amountApplied) || 0,
          });
        }
      }
    });

    if (totalAppliedAmount > parseFloat(paymentReceivedDetails?.availableBalance ?? paymentReceivedDetails?.unusedAmount ?? 0)) {
      Toast.warning('Total applied amount exceeds available balance');
      return;
    }

    try {
      await applyToInvoice({
        paymentId: paymentReceivedDetails?._id,
        invoices: invoiceData,
        openingBalanceTransactions: openingBalanceData,
        expenses: expenseData,
      });
      if (fetchPaymentReceived) fetchPaymentReceived();
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
          <span className="text-lg font-semibold">Apply Payment Received to Invoices</span>
        </div>
      }
      branchLabel={paymentBranchName}
      summaryCards={[
        {
          icon: <Icons.FileTextOutlined className="text-blue-500" />,
          label: 'Payment Received #',
          value: paymentReceivedDetails?.paymentReceivedId || '-',
        },
        {
          icon: <Icons.WalletOutlined className="text-green-500" />,
          label: 'Available Balance',
          value: formatAmount(paymentReceivedDetails?.availableBalance ?? paymentReceivedDetails?.unusedAmount ?? 0, true, paymentReceivedDetails?.currency),
          valueClassName: 'text-green-600',
        },
        {
          icon: <Icons.UserOutlined className="text-purple-500" />,
          label: 'Customer Name',
          value: paymentReceivedDetails?.customerId?.customerDisplayName || paymentReceivedDetails?.customerDisplayName || '-',
        },
      ]}
      alertMessage='Only invoices with "Sent", "Partially Paid", or "Overdue" status are available for mapping.'
      currentBranchOnly={currentBranchOnly}
      onCurrentBranchOnlyChange={setCurrentBranchOnly}
      loading={droploading}
      applyLoading={applyInvoiceLoading}
      documentKind="invoice"
      items={combinedPendingInvoices}
      currency={paymentReceivedDetails?.currency}
      sectionSubtitle="Select the invoices to apply advanced payments received to"
      emptySubtitle="All invoices for this customer have been paid or credited"
      getObSubtitle={item => (item?.type === OB_TYPE.OPENING_RECEIVABLE ? '(Customer opening balance)' : null)}
      validationSchema={creditApplySchema}
      onSubmit={onFinish}
    />
  );
};

export default ApplyToInvoiceModal;
