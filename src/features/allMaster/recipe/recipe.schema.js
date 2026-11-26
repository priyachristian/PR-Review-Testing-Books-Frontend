import * as Yup from 'yup';

export const recipeValidateSchema = Yup.object({
  recipeId: Yup.string().required('Recipe Id is required'),
  name: Yup.string().trim().required('Please input the recipe name!'),
  processes: Yup.array().min(1, 'Please select at least one process!').required('Please select at least one process!'),
  sequenceLocked: Yup.boolean(),
  remarks: Yup.string().required('Please input the remarks!'),
});
