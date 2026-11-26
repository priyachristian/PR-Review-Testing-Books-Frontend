import * as Yup from 'yup';
import { BANK_TYPES } from '@/utils/constants';

export const bankValidateSchema = Yup.object({
  accountName: Yup.string().trim().required('Please enter the account name'),
  accountCode: Yup.string()
    .nullable()
    .matches(/^[A-Za-z0-9_-]+$/, {
      message: 'Account code can only include letters, numbers, underscores (_) and hyphens (-)',
      excludeEmptyString: true,
    }),
  currency: Yup.string().required('Please select a currency'),
  accountNumber: Yup.string().when('accountType', {
    is: BANK_TYPES.BANK,
    then: schema => schema.nullable().matches(/^\d{6,18}$/, { message: 'Account number must be 6 to 18 digits', excludeEmptyString: true }),
    otherwise: schema => schema.notRequired(),
  }),
  ifsc: Yup.string().when('accountType', {
    is: BANK_TYPES.BANK,
    then: schema => schema.nullable().matches(/^[A-Z]{4}0[A-Z0-9]{6}$/, { message: 'Please enter a valid IFSC code', excludeEmptyString: true }),
    otherwise: schema => schema.notRequired(),
  }),
  bankName: Yup.string().optional(),
  openingBalance: Yup.number()
    .transform((value, originalValue) => (originalValue === '' || originalValue == null ? undefined : value))
    .typeError('Opening balance must be a number')
    .optional(),
  gstinUin: Yup.string().nullable().optional(),
  branch: Yup.string().max(200, 'Bank branch must not exceed 200 characters').optional(),
});

export const bankTransactionValidateSchema = transactionType =>
  Yup.object({
    counterAccountId: Yup.string().required(transactionType === 'DEPOSIT' ? 'Please select the deposit from account' : 'Please select the withdraw to account'),
    transferAmount: Yup.number().typeError('Amount must be a number').positive('Amount must be a positive number').required('Please enter amount'),
    date: Yup.string().required('Please select date'),
    transactionDescription: Yup.string().required('Please enter description'),
    isCrossCurrency: Yup.boolean(),
    amount: Yup.number()
      .typeError('Amount must be a number')
      .when('isCrossCurrency', {
        is: true,
        then: schema => schema.required('Amount is required').positive('Amount must be a positive number'),
        otherwise: schema => schema.notRequired(),
      }),
    currencyPrice: Yup.number()
      .typeError('Currency Price must be a number')
      .when('isCrossCurrency', {
        is: true,
        then: schema => schema.required('Currency Price (Exchange Rate) is required').positive('Currency Price must be a positive number'),
        otherwise: schema => schema.notRequired(),
      }),
  });

export const bankTransferValidateSchema = Yup.object({
  fromAccountId: Yup.string().required('Please select the from account'),
  toAccountId: Yup.string().required('Please select the to account'),
  date: Yup.string().required('Date is required'),
  transferAmount: Yup.number().typeError('Transfer Amount must be a number').positive('Transfer Amount must be a positive number').required('Transfer Amount is required'),
  isCrossCurrency: Yup.boolean(),
  amount: Yup.number()
    .typeError('Amount must be a number')
    .when('isCrossCurrency', {
      is: true,
      then: schema => schema.required('Amount is required').positive('Amount must be a positivea number'),
      otherwise: schema => schema.notRequired(),
    }),
  currencyPrice: Yup.number()
    .typeError('Currency Price must be a number')
    .when('isCrossCurrency', {
      is: true,
      then: schema => schema.required('Currency Price (Exchange Rate) is required').positive('Currency Price must be a positive number'),
      otherwise: schema => schema.notRequired(),
    }),
});
