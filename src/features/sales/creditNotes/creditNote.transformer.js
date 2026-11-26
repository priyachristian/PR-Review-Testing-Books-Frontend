import { baseTransformer } from '@/utils/tranformer';
import { toApiDate } from '@/utils/util';

export const getCreditNoteDocumentDetails = creditNote =>
  creditNote
    ? {
        creditNoteId: creditNote.creditNoteId,
        creditNoteNumber: creditNote.creditNoteNumber,
        customerName: creditNote.customerName,
        customerDisplayName: creditNote?.customerId?.customerDisplayName || creditNote.customerDisplayName || creditNote.customerName,
        creditNoteDate: creditNote.creditNoteDate,
        total: creditNote.total,
        availableBalance: creditNote.availableBalance,
        status: creditNote.status,
        referenceNumber: creditNote.referenceNumber,
      }
    : null;

export const creditNoteTransformer = (values, creditNotesId, attachments = [], isSplitWise = false) => {
  return {
    ...baseTransformer(values, isSplitWise),
    customerId: values.customerId,
    ...(!creditNotesId && { creditNoteId: values.creditNoteId }),
    referenceNumber: values.referenceNumber,
    creditNoteDate: toApiDate(values.creditNoteDate),
    subject: values.subject,
    customerNotes: values.customerNotes,
    termsAndConditions: values.termsAndConditions,
    invoiceId: values?.invoiceId || null,
    invoiceNo: values?.invoiceNo || '',
    type: values?.type,
    addressId: values?.addressId || null,
    attachments,
    isSplit: values?.splitInvoices || false,
    ...(!creditNotesId && values?.rejectionOrderDetails && { rejectionOrderDetails: values.rejectionOrderDetails }),
    exchangeRate: values.exchangeRate,
    tax: values.tax,
  };
};
