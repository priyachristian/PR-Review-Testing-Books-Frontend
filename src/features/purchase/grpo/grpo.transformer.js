import { baseTransformer } from '@/utils/tranformer';
import { toApiDate } from '@/utils/util';

const GRPO_DUPLICATE_OMIT_KEYS = ['id', '_id', 'grpoOrderId', 'status', 'createdAt', 'updatedAt', 'purchaseOrders', 'bills', 'convertedTo', 'date', 'dueDate', 'attachments'];

export const getGrpoDocumentDetails = grpo =>
  grpo
    ? {
        grpoOrderId: grpo.grpoOrderId,
        grpoOrderNumber: grpo.grpoOrderNumber,
        vendorName: grpo.customerName,
        vendorDisplayName: grpo?.vendor?.customerDisplayName || grpo?.vendor?.customerName || grpo?.customerId?.customerDisplayName || grpo.customerDisplayName || grpo.customerName,
        grpoDate: grpo.date,
        dueDate: grpo.dueDate,
        total: grpo.total,
        status: grpo.status,
      }
    : null;

/** Strip identity / conversion fields so a duplicate opens as a fresh create. */
export const stripGrpoForDuplicate = grpo => {
  if (!grpo) return grpo;
  const cloneable = { ...grpo };
  GRPO_DUPLICATE_OMIT_KEYS.forEach(key => {
    delete cloneable[key];
  });
  return cloneable;
};

export const GRPOTransformer = (values, grpoData, grpoId, attachments = [], discountConfig) => {
  const finalPurchaseOrders = [];

  grpoData?.purchaseOrders?.forEach(x => {
    finalPurchaseOrders.push({
      purchaseOrderId: x?.purchaseOrderId,
      purchaseOrderNo: x?.purchaseOrderNo,
    });
  });
  return {
    ...baseTransformer(values, false, discountConfig),
    vendor: values.vendor,
    ...(grpoData?.purchaseOrders && { purchaseOrders: finalPurchaseOrders }),
    ...(!grpoId && { grpoOrderId: values.grpoOrderId }),
    date: toApiDate(values.date),
    dueDate: toApiDate(values.dueDate),
    reference: values.reference,
    paymentTermsId: values.paymentTermsId,
    customerNotes: values.customerNotes,
    termsAndConditions: values.termsAndConditions,
    attachments,
    ...(discountConfig?.appliesTo === 'TRANSACTION' && {
      discountConfig: {
        discountValue: parseFloat(values?.discountValue || 0) || 0,
        discountType: values?.discountType || 'PERCENTAGE',
      },
    }),
    addressId: values?.addressId || null,
    ...(values?.customer && { customer: values?.customer }),
    isInventoryEnabled: values?.isInventoryEnabled ?? false,
    exchangeRate: values.exchangeRate,
  };
};
