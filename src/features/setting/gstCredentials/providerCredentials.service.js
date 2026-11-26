import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling } from '@/utils/serviceHelper';
import { encryptForTransport, decryptFromTransport } from '@/utils/transportCrypto';

const getAllProviderCredentials = withErrorHandling(async () => {
  const response = await axiosConfig.get(API_ROUTES.THIRD_PARTY_CREDENTIALS.LIST, {});
  return response.data;
}, 'getAllProviderCredentials');

const createProviderCredentials = withErrorHandling(async (platformName, { username, password }) => {
  const payload = await encryptForTransport({ username, password });
  const response = await axiosConfig.post(API_ROUTES.THIRD_PARTY_CREDENTIALS.BASE, { payload }, { params: { platformName } });
  return response.data;
}, 'createProviderCredentials');

const updateProviderCredentials = withErrorHandling(async (platformName, { username, password }) => {
  const payload = await encryptForTransport({ username, ...(password ? { password } : {}) });
  const response = await axiosConfig.put(API_ROUTES.THIRD_PARTY_CREDENTIALS.BASE, { payload }, { params: { platformName } });
  return response.data;
}, 'updateProviderCredentials');

const deleteProviderCredentials = withErrorHandling(async platformName => {
  const response = await axiosConfig.delete(API_ROUTES.THIRD_PARTY_CREDENTIALS.BASE, { params: { platformName } });
  return response.data;
}, 'deleteProviderCredentials');

const revealProviderCredentials = withErrorHandling(async platformName => {
  const response = await axiosConfig.get(API_ROUTES.THIRD_PARTY_CREDENTIALS.REVEAL, { params: { platformName } });
  return decryptFromTransport(response.data?.data?.payload);
}, 'revealProviderCredentials');

export const providerCredentialsService = {
  getAllProviderCredentials,
  createProviderCredentials,
  updateProviderCredentials,
  deleteProviderCredentials,
  revealProviderCredentials,
};
