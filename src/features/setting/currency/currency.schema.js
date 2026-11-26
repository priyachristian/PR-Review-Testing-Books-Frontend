import * as Yup from 'yup';

export const baseCurrencyValidateSchema = Yup.object({
  code: Yup.string().trim().uppercase().max(5, 'Max 5 characters').required('Currency code is required'),
  symbol: Yup.string().trim().max(5, 'Max 5 characters').required('Currency symbol is required'),
  name: Yup.string().trim().required('Currency name is required'),
  decimalPlaces: Yup.number().integer().min(0).max(4).nullable(),
  format: Yup.string().trim().nullable(),
});
