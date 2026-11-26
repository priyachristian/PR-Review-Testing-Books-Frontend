import { baseTransformer } from '@/utils/tranformer';
import { dateFormateForBackend } from '@/utils/services';
import { toApiDate } from '@/utils/util';

export const getRecurringInvoiceDocumentDetails = invoice =>
  invoice
    ? {
        recurringInvoiceId: invoice.recurringInvoiceId,
        customerDisplayName: invoice?.customerId?.customerDisplayName || invoice.customerDisplayName || invoice.customerName,
        status: invoice.status,
        totalAmount: invoice.total,
      }
    : null;

export const recurringInvoiceTransformer = (values, recurringId, recurringInvoicePDF, discountConfig) => {
  const getBaseValues = baseTransformer(values, false, discountConfig);
  return {
    ...getBaseValues,
    customerId: values.customerId,
    profileName: values?.profileName || '',
    ...(!recurringId && { recurringInvoiceId: values.recurringId }),
    referenceNumber: values.referenceNumber,
    paymentTermsId: values.paymentTermsId,
    subject: values.subject,
    customerNotes: values.customerNotes,
    termsAndConditions: values.termsAndConditions,
    attachments: recurringInvoicePDF,
    priceListId: values?.priceList || null,
    repeatEvery: {
      frequency: values?.frequency,
      period: values?.period,
    },
    startDate: toApiDate(values?.startDate),
    endDate: toApiDate(values?.endDate),
    addressId: values?.addressId || null,
    neverExpires: values?.neverExpires || false,
    ...(!recurringId && { recurringInvoiceDate: dateFormateForBackend(new Date()) }),
    ...(discountConfig?.appliesTo === 'TRANSACTION' && {
      discountConfig: {
        discountValue: parseFloat(values?.discountValue || 0) || 0,
        discountType: values?.discountType || 'PERCENTAGE',
      },
    }),
    exchangeRate: values.exchangeRate,
    tax: values.tax,
  };
};
