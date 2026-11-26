import { baseTransformer } from '@/utils/tranformer';
import { toApiDate } from '@/utils/util';

const BILL_DUPLICATE_OMIT_KEYS = [
  'id',
  '_id',
  'billId',
  'status',
  'createdAt',
  'updatedAt',
  'purchaseOrders',
  'grpoIds',
  'grpoId',
  'grpoNo',
  'openingBalanceApplications',
  'billDate',
  'dueDate',
  'attachments',
];

export const getBillDocumentDetails = bill =>
  bill
    ? {
        billId: bill.billId,
        billNumber: bill.billNumber,
        vendorName: bill.customerName,
        vendorDisplayName: bill?.vendor?.customerDisplayName || bill?.vendor?.customerName || bill?.customerId?.customerDisplayName || bill.customerDisplayName || bill.customerName,
        billDate: bill.billDate,
        dueDate: bill.dueDate,
        total: bill.total,
        balanceAmount: bill.balanceAmount,
        status: bill.status,
      }
    : null;

/** Strip identity / conversion fields so a duplicate opens as a fresh create. */
export const stripBillForDuplicate = bill => {
  if (!bill) return bill;
  const cloneable = { ...bill };
  BILL_DUPLICATE_OMIT_KEYS.forEach(key => {
    delete cloneable[key];
  });
  return cloneable;
};

export const billTransformer = (values, billsData, billsId, attachments = [], isSplitWise, discountConfig) => {
  const getBaseValues = baseTransformer(values, isSplitWise, discountConfig);
  const finalPurchaseOrders = [];
  const finalGrpos = [];

  billsData?.purchaseOrders?.forEach(x => {
    finalPurchaseOrders.push({
      purchaseOrderId: x?.purchaseOrderId,
      purchaseOrderNo: x?.purchaseOrderNo,
    });
  });

  billsData?.grpoIds?.forEach(x => {
    finalGrpos.push({
      grpoId: x?.grpoId?._id || x?.grpoId,
      grpoNo: x?.grpoNo,
    });
  });
  return {
    ...getBaseValues,
    vendor: values.vendor,
    ...(billsData?.grpoId && { grpoId: billsData?.grpoId?._id || billsData?.grpoId }),
    ...((billsData?.grpoId || billsData?.grpoNo) && {
      grpoNo: billsData?.grpoId?.grpoOrderId || billsData?.grpoNo,
    }),
    ...(billsData?.purchaseOrders && { purchaseOrders: finalPurchaseOrders }),
    ...(billsData?.grpoIds && { grpoIds: finalGrpos }),
    ...(!billsId && { billId: values.billId }),
    billDate: toApiDate(values.billDate),
    dueDate: toApiDate(values.dueDate),
    paymentTermsId: values.paymentTermsId,
    discount: values.discount,
    termsAndConditions: values.termsAndConditions,
    customerNotes: values.notes,
    attachments,
    ...(!values?.id && !billsId && isSplitWise && getBaseValues?.split && { isSplit: isSplitWise && getBaseValues?.split ? true : false }),
    ...(values?.status && { status: values?.status }),
    ...(discountConfig?.appliesTo === 'TRANSACTION' && {
      discountConfig: {
        discountValue: parseFloat(values?.discountValue || 0) || 0,
        discountType: values?.discountType || 'PERCENTAGE',
      },
    }),
    ...(values?.isSplit && { isSplit: values?.isSplit }),
    addressId: values?.addressId || null,
    ...(values?.customer && { customer: values?.customer }),
    isInventoryEnabled: values?.isInventoryEnabled ?? false,
    exchangeRate: values.exchangeRate,
    tax: values.tax,
  };
};
