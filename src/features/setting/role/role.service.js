import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling } from '@/utils/serviceHelper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getRoles = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE } = payload ?? {};
  const response = await axiosConfig.get(API_ROUTES.ROLE.BASE, {
    params: { page, limit },
  });
  return response.data;
}, 'getRoles');

const createRole = withErrorHandling(async payload => {
  const response = await axiosConfig.post(API_ROUTES.ROLE.CREATE, payload);
  return response.data;
}, 'createRole');

const updateRole = withErrorHandling(async payload => {
  const { id, ...body } = payload;
  const response = await axiosConfig.patch(API_ROUTES.ROLE.UPDATE(id), body);
  return response.data;
}, 'updateRole');

const deleteRole = withErrorHandling(async payload => {
  const { id } = payload;
  const response = await axiosConfig.delete(API_ROUTES.ROLE.DELETE(id));
  return response.data;
}, 'deleteRole');

const getRoleById = withErrorHandling(async payload => {
  const { id } = payload;
  const response = await axiosConfig.get(API_ROUTES.ROLE.GET_BY_ID(id));
  return response.data;
}, 'getRoleById');

const getRolesDropdown = withErrorHandling(async () => {
  const response = await axiosConfig.get(API_ROUTES.ROLE.GET_ROLES_DROPDOWN);
  return response.data;
}, 'getRolesDropdown');

export const roleService = {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getRoleById,
  getRolesDropdown,
};
