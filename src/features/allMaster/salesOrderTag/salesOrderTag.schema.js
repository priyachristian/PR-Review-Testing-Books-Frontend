import * as Yup from 'yup';
import { TAG_COLORS } from '@/utils/dropdownEnums';

export const salesOrderTagValidateSchema = Yup.object({
  tagId: Yup.string().trim().required('Tag code is required'),
  name: Yup.string().trim().required('Name is required'),
  color: Yup.string()
    .oneOf(
      TAG_COLORS.map(c => c.value),
      'Please select a valid color'
    )
    .optional(),
});
