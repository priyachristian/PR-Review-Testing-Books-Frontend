import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';

const getModuleEmailConfig = withErrorHandling(async payload => {
  const { signal } = payload ?? {};
  const config = { ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.PROFILE.GET_MODULE_EMAIL_CONFIG, config);
  return response.data;
}, 'getModuleEmailConfig');

const updateModuleEmailConfig = withErrorHandling(async payload => {
  const { moduleEmailConfig, signal } = payload;
  const config = { ...withAbortSignal(signal) };

  const response = await axiosConfig.put(API_ROUTES.PROFILE.UPDATE_MODULE_EMAIL_CONFIG, { moduleEmailConfig }, config);
  return response.data;
}, 'updateModuleEmailConfig');

export const emailPreferencesService = {
  getModuleEmailConfig,
  updateModuleEmailConfig,
};
