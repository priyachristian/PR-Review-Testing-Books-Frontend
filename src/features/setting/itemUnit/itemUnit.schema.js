import * as Yup from 'yup';

export const itemUnitValidateSchema = Yup.object({
  name: Yup.string().trim().required('Name is required'),
});
