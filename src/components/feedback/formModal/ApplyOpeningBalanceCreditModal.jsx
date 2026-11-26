import { useEffect, useMemo } from 'react';
import ApplyDocumentsModal, { useCurrentBranchOnlyToggle } from '@/components/feedback/formModal/ApplyDocumentsModal';
import Toast from '@/components/ui/common/Toast';
import Icons from 'assets/icons/icon';
import { usePaymentReceived } from '@/features/sales/paymentsReceived/usePaymentReceived';
import { usePaymentMade } from '@/features/purchase/paymentsMade/usePaymentMade';
import { useInvoice } from '@/features/sales/invoice/useInvoice';
import { useBill } from '@/features/purchase/bills/useBill';
import { OB_TYPE } from 'utils/constants';
import { formatObAmountByType, isOpeningBalanceCreditType, mergePendingDropWithOb, obTxnList } from 'utils/openingBalanceUtils';
import { creditApplySchema } from '@/utils/validationsSchema';

const resolveId = value => value?._id || value?.id || value || null;

const isReceivableOrPayable = type => type === OB_TYPE.OPENING_RECEIVABLE || type === OB_TYPE.OPENING_PAYABLE;

const allocateAcrossCredits = (items, credits, isCustomer) => {
  const pool = credits.map(c => ({
    id: resolveId(c),
    remaining: parseFloat(c?.remainingAmount ?? c?.balanceAmount ?? 0),
  }));

  const applications = [];
  for (const item of items || []) {
    let amount = parseFloat(item?.amountApplied || 0);
    if (!(amount > 0)) continue;

    const isObTarget = isReceivableOrPayable(item?.type);

    for (const credit of pool) {
      if (amount <= 0) break;
      if (!(credit.remaining > 0)) continue;
      const use = Math.min(amount, credit.remaining);
      applications.push({
        openingBalanceTransactionId: credit.id,
        ...(isObTarget ? { targetOpeningBalanceTransactionId: resolveId(item) } : isCustomer ? { invoiceId: resolveId(item) } : { billId: resolveId(item) }),
        amountApplied: use,
      });
      credit.remaining -= use;
      amount -= use;
    }

    if (amount > 0.0001) {
      return { error: 'Total applied amount exceeds available credit.', applications: [] };
    }
  }

  return { applications, error: null };
};

const ApplyOpeningBalanceCreditModal = ({ modalOpen, onClose, mode = 'customer', contactDetails = {}, branchId, isSplit, fetchData, contextDocumentId = null }) => {
  const { getPaymentInvoice, paymentInvoiceDrop, paymentInvoiceOpeningBalance, droploading: customerLoading } = usePaymentReceived();
  const { getPaymentsMadeInvoice, paymentsMadeInvoiceDrop, paymentsMadeOpeningBalance, droploading: vendorLoading } = usePaymentMade();
  const { applyCustomerCreditToInvoice, applyCustomerCreditLoading } = useInvoice();
  const { applyVendorCreditToBill, applyVendorCreditLoading } = useBill();
  const [currentBranchOnly, setCurrentBranchOnly] = useCurrentBranchOnlyToggle(modalOpen);

  const isCustomer = mode === 'customer';
  const contactId = resolveId(contactDetails?._id || contactDetails?.id || contactDetails?.customerId);
  const isLoading = isCustomer ? customerLoading : vendorLoading;
  const applyLoading = isCustomer ? applyCustomerCreditLoading : applyVendorCreditLoading;
  const pendingDocs = isCustomer ? paymentInvoiceDrop || [] : paymentsMadeInvoiceDrop || [];

  const currentBranchId = useMemo(() => {
    const fromProp = resolveId(branchId);
    if (fromProp) return fromProp;
    const creditBranch = (contactDetails?.branch || []).find(b => Number(b?.openingBalance || 0) < 0);
    return resolveId(creditBranch?.branchId);
  }, [branchId, contactDetails]);

  const currentBranchName = useMemo(() => {
    const fromContact = (contactDetails?.branch || []).find(b => String(resolveId(b?.branchId)) === String(currentBranchId));
    return fromContact?.branchId?.name || null;
  }, [contactDetails, currentBranchId]);

  useEffect(() => {
    if (!modalOpen || !contactId) return;

    const controller = new AbortController();
    const payload = {
      isSplit,
      forCreditMapping: true,
      isAdd: false,
      signal: controller.signal,
    };

    if (currentBranchOnly && currentBranchId) {
      payload.branchId = currentBranchId;
    }

    if (isCustomer) {
      getPaymentInvoice({ ...payload, customerId: contactId });
    } else {
      getPaymentsMadeInvoice({ ...payload, vendorId: contactId });
    }

    return () => controller.abort();
  }, [modalOpen, contactId, currentBranchId, currentBranchOnly, isCustomer, isSplit, getPaymentInvoice, getPaymentsMadeInvoice]);

  const allObRows = useMemo(() => obTxnList(isCustomer ? paymentInvoiceOpeningBalance : paymentsMadeOpeningBalance), [isCustomer, paymentInvoiceOpeningBalance, paymentsMadeOpeningBalance]);

  const creditList = useMemo(() => allObRows.filter(t => isOpeningBalanceCreditType(t?.type)), [allObRows]);
  const pendingObTargets = useMemo(() => allObRows.filter(t => isReceivableOrPayable(t?.type)), [allObRows]);

  const listData = useMemo(() => mergePendingDropWithOb(pendingDocs, pendingObTargets, isCustomer ? 'invoice' : 'bill'), [pendingDocs, pendingObTargets, isCustomer]);

  const hasCredit = creditList.length > 0;
  const firstCredit = creditList[0] || null;
  const obTypeForDisplay = firstCredit?.type || (isCustomer ? OB_TYPE.CUSTOMER_CREDIT : OB_TYPE.VENDOR_CREDIT);
  const totalOpeningBalance = creditList.reduce((sum, c) => sum + Number(c?.amount || c?.total || 0), 0);
  const remainingBalance = creditList.reduce((sum, c) => sum + Number(c?.remainingAmount || c?.balanceAmount || 0), 0);
  const contactName = contactDetails?.customerDisplayName || contactDetails?.companyName || '-';
  const branchLabel = firstCredit?.branchName || currentBranchName || '-';
  const openingPaymentId = creditList.length > 1 ? `${creditList.length} credits` : firstCredit?.transactionNo || (firstCredit ? `OB-${resolveId(firstCredit)}` : '-');

  const onFinish = async values => {
    if (!hasCredit) {
      Toast.warning('No available credit to apply.');
      return;
    }

    const { applications, error } = allocateAcrossCredits(values?.invoiceItems, creditList, isCustomer);
    if (error) {
      Toast.warning(error);
      return;
    }
    if (!applications.length) {
      Toast.warning(`Please apply credit to at least one ${isCustomer ? 'invoice or opening balance' : 'bill or opening balance'}.`);
      return;
    }

    if (isCustomer) {
      await applyCustomerCreditToInvoice({
        customerId: contactId,
        applications,
        ...(contextDocumentId ? { contextInvoiceId: contextDocumentId } : {}),
      });
    } else {
      await applyVendorCreditToBill({
        vendorId: contactId,
        applications,
        ...(contextDocumentId ? { contextBillId: contextDocumentId } : {}),
      });
    }

    fetchData?.();
    onClose();
  };

  return (
    <ApplyDocumentsModal
      modalOpen={modalOpen}
      onClose={onClose}
      title={
        <div className="flex items-center space-x-2">
          <Icons.CreditCardOutlined className="text-blue-500 text-lg" />
          <span className="text-lg font-semibold">Apply Opening Balance to {isCustomer ? 'Invoices' : 'Bills'}</span>
        </div>
      }
      headerExtra={
        !hasCredit ? (
          <div className="flex gap-4 justify-center items-center text-center py-4 bg-amber-50 rounded-lg border border-amber-200 mt-3 mb-3">
            <Icons.ExclamationCircleOutlined className="text-2xl text-amber-500" />
            <div className="text-left">
              <p className="text-amber-800 font-medium">This {mode} has no opening balance credit available.</p>
            </div>
          </div>
        ) : null
      }
      branchLabel={hasCredit ? branchLabel : null}
      summaryCards={
        hasCredit
          ? [
              {
                icon: <Icons.FileTextOutlined className="text-blue-500" />,
                label: 'Opening Payment #',
                value: openingPaymentId,
              },
              {
                icon: <Icons.UserOutlined className="text-purple-500" />,
                label: isCustomer ? 'Customer Name' : 'Vendor Name',
                value: contactName,
              },
              {
                icon: <Icons.DollarOutlined className="text-blue-500" />,
                label: 'Opening Balance',
                value: formatObAmountByType(totalOpeningBalance, obTypeForDisplay),
              },
              {
                icon: <Icons.WalletOutlined className="text-green-500" />,
                label: 'Remaining Balance',
                value: formatObAmountByType(remainingBalance, obTypeForDisplay),
                valueClassName: 'text-green-600',
              },
            ]
          : []
      }
      alertMessage={
        isCustomer
          ? 'Only invoices with "Sent", "Partially Paid", or "Overdue" status are available for mapping.'
          : 'Only bills with "Open", "Partially Paid", or "Overdue" status are available for mapping.'
      }
      currentBranchOnly={currentBranchOnly}
      onCurrentBranchOnlyChange={setCurrentBranchOnly}
      loading={isLoading}
      applyLoading={applyLoading}
      documentKind={isCustomer ? 'invoice' : 'bill'}
      items={listData}
      initialAmountApplied={0}
      showDueDate={false}
      showTotalAmount={false}
      sectionSubtitle={`Select the ${isCustomer ? 'invoices' : 'bills'} to apply opening balance`}
      applyButtonText={isCustomer ? 'Apply To Invoices' : 'Apply To Bills'}
      submitDisabled={!hasCredit}
      getObSubtitle={item => {
        if (item?.type === OB_TYPE.OPENING_RECEIVABLE) return '(Customer opening balance)';
        if (item?.type === OB_TYPE.OPENING_PAYABLE) return '(Vendor opening balance)';
        return null;
      }}
      validationSchema={creditApplySchema}
      onSubmit={onFinish}
    />
  );
};

export default ApplyOpeningBalanceCreditModal;
