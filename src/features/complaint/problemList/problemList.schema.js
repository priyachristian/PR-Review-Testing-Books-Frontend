import * as Yup from 'yup';

export const addProblemSchema = Yup.object().shape({
  name: Yup.string().trim().required('Please enter what the option should say'),
});

const optionalNonNegativeInteger = fieldLabel =>
  Yup.number()
    .transform((value, originalValue) => (originalValue === '' || originalValue == null ? null : value))
    .nullable()
    .notRequired()
    .typeError(`Please enter numbers only for ${fieldLabel}`)
    .integer(`Please enter a whole number for ${fieldLabel}`)
    .min(0, `${fieldLabel} cannot be negative`);

export const problemDetailSchema = Yup.object().shape({
  name: Yup.string().trim().required('Please enter what the option should say'),
  replyWithinHours: optionalNonNegativeInteger('Reply within (hours)'),
  sortOutWithinDays: optionalNonNegativeInteger('Sort out in (days)'),
});
