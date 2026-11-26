import * as Yup from 'yup';

export const warehouseValidateSchema = Yup.object({
  divisionName: Yup.string().required('Please select a division'),
  branchName: Yup.string().required('Please select a branch'),
  name: Yup.string().trim().required('Please enter the warehouse name'),
  pinCode: Yup.string()
    .trim()
    .nullable()
    .matches(/^[0-9]{6}$/, { message: 'Please enter a valid 6-digit pin code', excludeEmptyString: true }),
});
