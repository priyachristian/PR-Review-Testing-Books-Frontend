import * as Yup from 'yup';

export const providerCredentialsValidateSchema = hasExistingPassword =>
  Yup.object().shape({
    platformName: Yup.string().required('Platform is required'),
    username: Yup.string().trim().max(100, 'Username must be at most 100 characters').required('Portal username is required'),
    password: hasExistingPassword
      ? Yup.string().trim().max(200, 'Password must be at most 200 characters')
      : Yup.string().trim().max(200, 'Password must be at most 200 characters').required('Portal password is required'),
  });
