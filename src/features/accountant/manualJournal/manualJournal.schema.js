import * as Yup from 'yup';

export const manualJournalValidateSchema = autoGenerate => {
  return Yup.object({
    divisionId: Yup.string().required('Please select a division'),
    branchId: Yup.string().required('Please select a branch'),
    warehouseId: Yup.string().nullable().notRequired(),
    manualJournalId: autoGenerate ? Yup.string().notRequired() : Yup.string().required('Please enter the journal number'),
    date: Yup.string().required('Please select a date'),
    notes: Yup.string().required('Please enter notes'),
    currency: Yup.string().required('Please select a currency'),
    journalEntries: Yup.array().of(
      Yup.object().shape({
        accountId: Yup.string().nullable().notRequired(),
        businessAccountLedgerMasterId: Yup.string().nullable().notRequired(),
        debits: Yup.string()
          .nullable()
          .matches(/^\d*\.?\d*$/, 'Please enter a valid debit amount'),
        credits: Yup.string()
          .nullable()
          .matches(/^\d*\.?\d*$/, 'Please enter a valid credit amount'),
        description: Yup.string().trim().nullable().notRequired(),
      })
    ),
  });
};
