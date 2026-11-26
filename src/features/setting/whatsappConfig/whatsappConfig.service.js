import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';

const getWhatsappConfig = withErrorHandling(async payload => {
  const { signal } = payload ?? {};
  const config = { ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.PROFILE.GET_ADMIN_SUMMARY_SETTING, config);
  return response.data;
}, 'getWhatsappConfig');

const updateWhatsappConfig = withErrorHandling(async payload => {
  const { whatsapp, signal } = payload;
  const config = { ...withAbortSignal(signal) };

  const response = await axiosConfig.put(API_ROUTES.PROFILE.UPDATE_ADMIN_SUMMARY_SETTING, { whatsapp }, config);
  return response.data;
}, 'updateWhatsappConfig');

export const whatsappConfigService = {
  getWhatsappConfig,
  updateWhatsappConfig,
};
