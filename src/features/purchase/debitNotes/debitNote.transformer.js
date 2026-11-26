import { baseTransformer } from '@/utils/tranformer';
import { toApiDate } from '@/utils/util';

export const getDebitNoteDocumentDetails = debitNote =>
  debitNote
    ? {
        debitNoteId: debitNote.debitNoteId,
        debitNoteNumber: debitNote.debitNoteNumber,
        vendorName: debitNote.vendorId?.customerName || debitNote.customerName,
        vendorDisplayName:
          debitNote.vendorId?.customerDisplayName || debitNote.vendorId?.customerName || debitNote?.customerId?.customerDisplayName || debitNote.customerDisplayName || debitNote.customerName,
        debitNoteDate: debitNote.debitNoteDate,
        total: debitNote.total,
        availableBalance: debitNote.availableBalance,
        status: debitNote.status,
      }
    : null;

export const debitNoteTransformer = (values, vendorId, vendorPDF, isSplitWise = false) => {
  return {
    ...baseTransformer(values, isSplitWise),
    vendorId: values.vendorId,
    referenceNumber: values.referenceNumber,
    debitNoteDate: toApiDate(values.debitNoteDate),
    type: values?.type,
    ...(!vendorId && { debitNoteId: values.debitNoteId }),
    subject: values.subject,
    notes: values.notes,
    attachments: vendorPDF,
    billId: values?.billId || null,
    billNo: values?.billNo || '',
    addressId: values?.addressId || null,
    ...(values?.customer && { customer: values?.customer }),
    termsAndConditions: values.termsAndConditions,
    isSplit: values?.splitBills || false,
    exchangeRate: values.exchangeRate,
    tax: values.tax,
  };
};
