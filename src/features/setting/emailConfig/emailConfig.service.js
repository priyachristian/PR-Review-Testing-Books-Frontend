import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';

const getEmailConfig = withErrorHandling(async payload => {
  const { signal } = payload ?? {};
  const config = { ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.PROFILE.GET_EMAIL_CONFIG, config);
  return response.data;
}, 'getEmailConfig');

const updateEmailConfig = withErrorHandling(async payload => {
  const { isEmailEnabled, emailConfiguration, signal } = payload;
  const config = { ...withAbortSignal(signal) };

  const response = await axiosConfig.put(
    API_ROUTES.PROFILE.UPDATE_EMAIL_CONFIG,
    {
      isEmailEnabled,
      ...(emailConfiguration ? { emailConfiguration } : {}),
    },
    config
  );
  return response.data;
}, 'updateEmailConfig');

const testEmailConfig = withErrorHandling(async payload => {
  const { smtpHost, smtpPort, secure, username, password, signal } = payload;
  const config = { ...withAbortSignal(signal) };

  const response = await axiosConfig.post(
    API_ROUTES.PROFILE.TEST_EMAIL_CONFIG,
    {
      smtpHost,
      smtpPort: Number(smtpPort),
      secure: Boolean(secure),
      username,
      password,
    },
    config
  );
  return response.data;
}, 'testEmailConfig');

export const emailConfigService = {
  getEmailConfig,
  updateEmailConfig,
  testEmailConfig,
};
