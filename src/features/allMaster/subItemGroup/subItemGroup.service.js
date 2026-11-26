import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';

const getSubItemGroup = withErrorHandling(async payload => {
  const { signal, search = '', appName = '' } = payload;
  const queryParams = new URLSearchParams({});

  if (payload?.page && payload?.limit) {
    queryParams.append('page', payload?.page);
    queryParams.append('limit', payload?.limit);
  } else {
    queryParams.append('pagination', false);
  }

  if (search) queryParams.append('search', search);
  if (appName) queryParams.append('appName', appName);
  let config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.ALL_MASTER.SUB_ITEM_GROUP.BASE, config);
  return response.data;
}, 'getSubItemGroup');

const getSubItemGroupById = withErrorHandling(async payload => {
  const { subItemGroupId, signal } = payload;
  let config = { ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.ALL_MASTER.SUB_ITEM_GROUP.GET_BY_ID(subItemGroupId), config);
  return response.data;
}, 'getSubItemGroupById');

const createSubItemGroup = withErrorHandling(async subItemGroupData => {
  const response = await axiosConfig.post(API_ROUTES.ALL_MASTER.SUB_ITEM_GROUP.CREATE, subItemGroupData, {});
  return response.data;
}, 'createSubItemGroup');

const deleteSubItemGroup = withErrorHandling(async payload => {
  const { subItemGroupId } = payload;
  const response = await axiosConfig.delete(API_ROUTES.ALL_MASTER.SUB_ITEM_GROUP.DELETE(subItemGroupId), {});
  return response.data;
}, 'deleteSubItemGroup');

const updateSubItemGroup = withErrorHandling(async payload => {
  const { subItemGroupId, name } = payload;
  const response = await axiosConfig.patch(API_ROUTES.ALL_MASTER.SUB_ITEM_GROUP.UPDATE(subItemGroupId), { name }, {});
  return response.data;
}, 'updateSubItemGroup');

const getSubItemGroupDropdown = withErrorHandling(async (payload = {}) => {
  const { signal } = payload;
  const queryParams = new URLSearchParams({});

  let config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.ALL_MASTER.SUB_ITEM_GROUP.GET_DROPDOWN, config);
  return response.data;
}, 'getSubItemGroupDropdown');

export const subItemGroupService = {
  getSubItemGroup,
  getSubItemGroupById,
  createSubItemGroup,
  deleteSubItemGroup,
  updateSubItemGroup,
  getSubItemGroupDropdown,
};
