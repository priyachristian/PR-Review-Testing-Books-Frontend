import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';

const getModuleConfig = withErrorHandling(async payload => {
  const { moduleName, signal, customerId = '' } = payload;
  const queryParams = new URLSearchParams();
  if (customerId) queryParams.append('customerId', customerId);
  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.MODULE_CONFIG.BASE(moduleName), config);
  return response.data;
}, 'getModuleConfig');

const updateModuleConfig = withErrorHandling(async payload => {
  const { moduleName, moduleConfig } = payload;
  const response = await axiosConfig.patch(API_ROUTES.MODULE_CONFIG.UPDATE(moduleName), moduleConfig);
  return response.data;
}, 'updateModuleConfig');

export const moduleConfigService = {
  getModuleConfig,
  updateModuleConfig,
};
