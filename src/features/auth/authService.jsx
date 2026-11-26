import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig, { accountApi } from 'app/axiosConfig';
import axios from 'axios';
import { withErrorHandling } from '@/utils/serviceHelper';
import { isPdfPreviewRoute } from '@/utils/pdfPreviewRoute';
import { getOrCreateDeviceId } from '@/utils/device';

const checktoken = withErrorHandling(async () => {
  if (isPdfPreviewRoute()) {
    const error = new Error('Skipped token validation on PDF preview route');
    error.skipAuthRedirect = true;
    throw error;
  }
  const response = await axiosConfig.get(API_ROUTES.AUTH.TOKEN);
  return response.data;
}, 'checktoken');

const checktokenResetPassword = withErrorHandling(async token => {
  const response = await axios.get(`https://books-apis.abss.ai/api/v1/auth/validate-token`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
}, 'checktokenResetPassword');

const refreshToken = withErrorHandling(async refreshTokenPayload => {
  if (isPdfPreviewRoute()) {
    const error = new Error('Skipped token refresh on PDF preview route');
    error.skipAuthRedirect = true;
    throw error;
  }
  const response = await axiosConfig.post(API_ROUTES.AUTH.REFRESH, {
    refreshToken: refreshTokenPayload,
  });
  return response.data;
}, 'refreshToken');

const logout = withErrorHandling(async () => {
  const response = await axiosConfig.post(API_ROUTES.AUTH.LOGOUT, { deviceId: getOrCreateDeviceId() });
  return response.data;
}, 'logout');

const getOrganizations = withErrorHandling(async () => {
  const response = await accountApi.get(API_ROUTES.AUTH.ORGANIZATIONS);
  return response?.data?.data?.organizations || [];
}, 'getOrganizations');

const switchOrganization = withErrorHandling(async companyId => {
  await accountApi.post(API_ROUTES.AUTH.SWITCH_ORGANIZATION, { companyId });
}, 'switchOrganization');

export const authService = {
  checktoken,
  checktokenResetPassword,
  refreshToken,
  logout,
  getOrganizations,
  switchOrganization,
};
