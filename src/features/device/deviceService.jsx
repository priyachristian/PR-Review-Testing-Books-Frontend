import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling } from '@/utils/serviceHelper';

const storeDeviceToken = withErrorHandling(async payload => {
  const response = await axiosConfig.post(API_ROUTES.DEVICE.STORE_TOKEN, payload);
  return response.data;
}, 'storeDeviceToken');

export const deviceService = {
  storeDeviceToken,
};
