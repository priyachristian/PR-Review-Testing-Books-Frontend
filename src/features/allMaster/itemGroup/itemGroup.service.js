import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';

const getItemGroup = withErrorHandling(async payload => {
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
  const response = await axiosConfig.get(API_ROUTES.ALL_MASTER.ITEM_GROUP.BASE, config);
  return response.data;
}, 'getItemGroup');

const getItemGroupById = withErrorHandling(async payload => {
  const { itemGroupId, signal } = payload;
  let config = { ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.ALL_MASTER.ITEM_GROUP.GET_BY_ID(itemGroupId), config);
  return response.data;
}, 'getItemGroupById');

const createItemGroup = withErrorHandling(async itemGroupData => {
  const response = await axiosConfig.post(API_ROUTES.ALL_MASTER.ITEM_GROUP.CREATE, itemGroupData, {});
  return response.data;
}, 'createItemGroup');

const deleteItemGroup = withErrorHandling(async payload => {
  const { itemGroupId } = payload;
  const response = await axiosConfig.delete(API_ROUTES.ALL_MASTER.ITEM_GROUP.DELETE(itemGroupId), {});
  return response.data;
}, 'deleteItemGroup');

const updateItemGroup = withErrorHandling(async payload => {
  const { itemGroupId, name } = payload;

  const response = await axiosConfig.patch(API_ROUTES.ALL_MASTER.ITEM_GROUP.UPDATE(itemGroupId), { name }, {});
  return response.data;
}, 'updateItemGroup');

const getItemGroupDropdown = withErrorHandling(async (payload = {}) => {
  const { signal } = payload;
  const queryParams = new URLSearchParams({});

  let config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.ALL_MASTER.ITEM_GROUP.GET_DROPDOWN, config);
  return response.data;
}, 'getItemGroupDropdown');

export const itemGroupService = {
  getItemGroup,
  getItemGroupById,
  createItemGroup,
  deleteItemGroup,
  updateItemGroup,
  getItemGroupDropdown,
};
