import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling } from '@/utils/serviceHelper';

const getDevelopmentUpdate = withErrorHandling(async payload => {
  const response = await axiosConfig.get(API_ROUTES.DEVELOPMENT_UPDATE.GET_DEVELOPMENT_UPDATE, {
    params: payload,
  });
  return response.data;
}, 'getDevelopmentUpdate');

export const developmentUpdateService = {
  getDevelopmentUpdate,
};
