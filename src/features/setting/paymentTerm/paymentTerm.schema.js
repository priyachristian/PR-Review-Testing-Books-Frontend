import * as Yup from 'yup';

export const paymentTermValidateSchema = Yup.object({
  name: Yup.string().trim().required('Name is required'),
  days: Yup.number().typeError('Days must be a number').integer('Days must be a whole number').min(0, 'Days cannot be negative').required('Days is required'),
});
