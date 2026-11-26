import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';

const getQuotationConfig = withErrorHandling(async payload => {
  const { signal } = payload ?? {};
  const config = { ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.PROFILE.GET_QUOTATION_CONFIG, config);
  return response.data;
}, 'getQuotationConfig');

const updateQuotationConfig = withErrorHandling(async payload => {
  const { quoteCloseReasons, signal } = payload;
  const config = { ...withAbortSignal(signal) };

  const response = await axiosConfig.patch(API_ROUTES.PROFILE.UPDATE_QUOTATION_CONFIG, { quoteCloseReasons }, config);
  return response.data;
}, 'updateQuotationConfig');

export const quotationConfigService = {
  getQuotationConfig,
  updateQuotationConfig,
};
