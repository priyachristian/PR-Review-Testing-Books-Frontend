import { baseTransformer } from '@/utils/tranformer';
import { dateFormateForBackend } from '@/utils/services';
import { toApiDate } from '@/utils/util';

export const getRecurringBillDocumentDetails = bill =>
  bill
    ? {
        recurringBillId: bill.recurringBillId,
        vendorDisplayName: bill?.vendor?.customerDisplayName || bill?.vendorId?.customerDisplayName || bill?.vendor?.customerName || bill?.vendorId?.customerName,
        status: bill.status,
        totalAmount: bill.total,
      }
    : null;

export const recurringBillTransformer = (values, billsId, billsPDF, discountConfig) => {
  const getBaseValues = baseTransformer(values, false, discountConfig);

  return {
    ...getBaseValues,
    vendorId: values.vendorId,
    profileName: values?.profileName || '',
    ...(!billsId && { recurringBillId: values.recurringBillId }),
    paymentTermsId: values.paymentTermsId,
    termsAndConditions: values.termsAndConditions,
    customerNotes: values.notes,
    attachments: billsPDF,
    repeatEvery: {
      frequency: values?.frequency,
      period: values?.period,
    },
    startDate: toApiDate(values?.startDate),
    endDate: toApiDate(values?.endDate),
    addressId: values?.addressId || null,
    neverExpires: values?.neverExpires || false,
    ...(!billsId && { recurringBillDate: dateFormateForBackend(new Date()) }),
    ...(discountConfig?.appliesTo === 'TRANSACTION' && {
      discountConfig: {
        discountValue: parseFloat(values?.discountValue || 0) || 0,
        discountType: values?.discountType || 'PERCENTAGE',
      },
    }),
    customerId: values?.customerId || null,
    exchangeRate: values.exchangeRate,
    tax: values.tax,
  };
};
