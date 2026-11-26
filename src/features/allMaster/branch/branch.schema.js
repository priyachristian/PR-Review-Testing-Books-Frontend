import * as Yup from 'yup';

export const branchValidateSchema = Yup.object({
  divisionName: Yup.string().trim().required('Please select a division'),
  branchname: Yup.string().trim().required('Please enter the branch name'),
  country: Yup.string().required('Please select the country'),
  street1: Yup.string().trim().required('Please enter address line 1'),
  street2: Yup.string().trim().required('Please enter address line 2'),
  city: Yup.string().required('Please enter the city'),
  pincode: Yup.string().trim().required('Please enter the PIN code'),
  state: Yup.string().required('Please enter the state'),
  phone: Yup.string()
    .matches(/^\d+$/, 'Phone number should contain only digits')
    .matches(/^[0-9]{10}$/, 'Please enter a valid 10 digit phone number')
    .required('Please enter the phone number'),
  email: Yup.string()
    .email('Please enter a valid email address')
    .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Please enter a valid email address like demo@gmail.com'),
  number: Yup.string()
    .matches(/^\d+$/, 'Phone number should contain only digits')
    .matches(/^[0-9]{10}$/, 'Please enter a valid 10 digit phone number'),
  gstin: Yup.string().trim().required('Please enter the GSTIN number'),
});
