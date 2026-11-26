import * as Yup from 'yup';

export const divisionValidateSchema = Yup.object({
  name: Yup.string().trim().required('Please enter the division name'),
  country: Yup.string().optional().nullable(),
  email: Yup.string()
    .email('Please enter a valid email address')
    .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please enter a valid email address like demo@gmail.com'),
  number: Yup.string()
    .matches(/^\d+$/, 'Phone number should contain only digits')
    .matches(/^[0-9]{10}$/, 'Please enter a valid 10 digit phone number'),
});
