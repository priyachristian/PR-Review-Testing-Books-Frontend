import * as Yup from 'yup';

export const accountLedgerValidateSchema = autoGenerate =>
  Yup.object({
    ledgerMasterNumber: autoGenerate ? Yup.string().notRequired() : Yup.string().trim().required('Please enter the ledger number'),
    personName: Yup.string().trim().required('Please enter the ledger name'),
    gstinUin: Yup.string()
      .optional()
      .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Please enter a valid GST number'),
  });
