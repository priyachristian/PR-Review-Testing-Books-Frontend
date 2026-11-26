import * as Yup from 'yup';

export const rejectionReasonValidateSchema = Yup.object({
  name: Yup.string().trim().required('Reason name is required'),
  description: Yup.string().trim().nullable(),
  parentReasonId: Yup.string().nullable(),
});
