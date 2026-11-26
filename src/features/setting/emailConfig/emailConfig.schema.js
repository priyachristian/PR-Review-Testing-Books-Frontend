import * as Yup from 'yup';

export const emailConfigValidateSchema = hasExistingPassword =>
  Yup.object().shape({
    smtpHost: Yup.string().nullable().required('Host name is required'),
    smtpPort: Yup.number()
      .transform(value => (Number.isNaN(value) ? undefined : value))
      .required('Port is required')
      .integer('Port must be a whole number')
      .min(1, 'Port must be between 1 and 65535')
      .max(65535, 'Port must be between 1 and 65535'),
    username: Yup.string().trim().email('Username must be a valid email address').required('Username is required'),
    password: hasExistingPassword
      ? Yup.string().trim().max(200, 'Password must be at most 200 characters')
      : Yup.string().trim().max(200, 'Password must be at most 200 characters').required('Password is required'),
  });
