import { baseTransformer } from '@/utils/tranformer';
import { toApiDate } from '@/utils/util';

const QUOTE_DUPLICATE_OMIT_KEYS = ['id', '_id', 'quoteId', 'status', 'createdAt', 'updatedAt', 'quoteDate', 'expiryDate', 'attachments'];

export const getQuoteDocumentDetails = quote =>
  quote
    ? {
        quoteId: quote.quoteId,
        quoteNumber: quote.quoteNumber,
        customerName: quote.customerName,
        customerDisplayName: quote?.customerId?.customerDisplayName || quote.customerDisplayName || quote.customerName,
        quoteDate: quote.quoteDate,
        totalAmount: quote.total,
        status: quote.status,
      }
    : null;

/** Strip identity fields so a duplicate opens as a fresh create. */
export const stripQuoteForDuplicate = quote => {
  if (!quote) return quote;
  const cloneable = { ...quote };
  QUOTE_DUPLICATE_OMIT_KEYS.forEach(key => {
    delete cloneable[key];
  });
  return cloneable;
};

export const quoteTransformer = (values, quoteId, quotePDF, discountConfig) => {
  return {
    ...baseTransformer(values, false, discountConfig),
    customerId: values.customerId,
    ...(!quoteId && { quoteId: values.quoteNumber }),
    reference: values.reference,
    quoteDate: toApiDate(values.quoteDate),
    expiryDate: toApiDate(values?.expiryDate),
    subject: values.subject,
    customerNotes: values.customerNotes,
    termsAndConditions: values.termsAndConditions,
    attachments: quotePDF,
    paymentTermsId: values.paymentTermsId,
    priceListId: values?.priceList || null,
    ...(values?.status && { status: values?.status }),
    ...(discountConfig?.appliesTo === 'TRANSACTION' && {
      discountConfig: {
        discountValue: parseFloat(values?.discountValue || 0) || 0,
        discountType: values?.discountType || 'PERCENTAGE',
      },
    }),
    addressId: values?.addressId || null,
    exchangeRate: values.exchangeRate,
  };
};
