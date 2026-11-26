import { baseTransformer } from '@/utils/tranformer';
import { toApiDate } from '@/utils/util';

const PURCHASE_ORDER_DUPLICATE_OMIT_KEYS = ['id', '_id', 'purchaseOrderId', 'status', 'createdAt', 'updatedAt', 'grpos', 'bills', 'convertedTo', 'date', 'attachments'];

export const getPurchaseOrderDocumentDetails = purchaseOrder =>
  purchaseOrder
    ? {
        purchaseOrderId: purchaseOrder.purchaseOrderId,
        purchaseOrderNumber: purchaseOrder.purchaseOrderNumber,
        vendorName: purchaseOrder.customerName,
        vendorDisplayName: purchaseOrder?.customerId?.customerDisplayName || purchaseOrder.customerDisplayName || purchaseOrder.customerName,
        purchaseOrderDate: purchaseOrder.date,
        deliveryDate: purchaseOrder.deliveryDate,
        total: purchaseOrder.total,
        status: purchaseOrder.status,
      }
    : null;

/** Strip identity / conversion fields so a duplicate opens as a fresh create. */
export const stripPurchaseOrderForDuplicate = purchaseOrder => {
  if (!purchaseOrder) return purchaseOrder;
  const cloneable = { ...purchaseOrder };
  PURCHASE_ORDER_DUPLICATE_OMIT_KEYS.forEach(key => {
    delete cloneable[key];
  });
  return cloneable;
};

export const purchaseOrderTransformer = (values, purchaseId, attachments = [], discountConfig) => {
  return {
    ...baseTransformer(values, false, discountConfig),
    vendor: values.vendor,
    ...(!purchaseId && { purchaseOrderId: values.purchaseOrderId }),
    date: toApiDate(values.date),
    deliveryDate: toApiDate(values.deliveryDate),
    reference: values.reference,
    paymentTermsId: values.paymentTermsId,
    customerNotes: values.customerNotes,
    termsAndConditions: values.termsAndConditions,
    attachments,
    ...(values?.status && { status: values?.status }),
    ...(discountConfig?.appliesTo === 'TRANSACTION' && {
      discountConfig: {
        discountValue: parseFloat(values?.discountValue || 0) || 0,
        discountType: values?.discountType || 'PERCENTAGE',
      },
    }),
    addressId: values?.addressId || null,
    ...(values?.customer && { customer: values?.customer }),
    exchangeRate: values.exchangeRate,
  };
};
