import * as Yup from 'yup';

export const processValidateSchema = Yup.object({
  name: Yup.string().trim().required('Please input the process name!'),
});
