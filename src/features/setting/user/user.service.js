import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getUsers = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE } = payload ?? {};
  const response = await axiosConfig.get('/users', { params: { page, limit } });
  return response.data;
}, 'getUsers');

const getUserProfile = withErrorHandling(async payload => {
  const { userId, companyId, signal } = payload ?? {};
  const response = await axiosConfig.get(API_ROUTES.USER.GET_PROFILE(userId), {
    params: { companyId },
    ...withAbortSignal(signal),
  });
  return response.data;
}, 'getUserProfile');

const inviteUser = withErrorHandling(async payload => {
  const response = await axiosConfig.post('/users/invite', payload);
  return response.data;
}, 'inviteUser');

const getUserRole = withErrorHandling(async payload => {
  const { userId } = payload;
  const response = await axiosConfig.get(`users/${userId}/role`);
  return response.data;
}, 'getUserRole');

const saveDefaultConfiguration = withErrorHandling(async payload => {
  const response = await axiosConfig.patch('users/defaultconfiguration', payload);
  return response.data;
}, 'saveDefaultConfiguration');

const getUsersDropdown = withErrorHandling(async payload => {
  const { signal } = payload ?? {};
  const config = { ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.USER.GET_DROPDOWN, config);
  return response.data;
}, 'getUsersDropdown');

const updateUserStatusAndRole = withErrorHandling(async payload => {
  const { id, ...userData } = payload;
  const response = await axiosConfig.put(API_ROUTES.USER.UPDATE_USER_STATUS_AND_ROLE(id), userData);
  return response.data;
}, 'updateUserStatusAndRole');

const deleteCompanyUser = withErrorHandling(async payload => {
  const { id } = payload;
  const response = await axiosConfig.delete(API_ROUTES.USER.DELETE_COMPANY_USER(id));
  return response.data;
}, 'deleteCompanyUser');

export const userService = {
  getUsers,
  getUserProfile,
  inviteUser,
  getUserRole,
  saveDefaultConfiguration,
  getUsersDropdown,
  updateUserStatusAndRole,
  deleteCompanyUser,
};
