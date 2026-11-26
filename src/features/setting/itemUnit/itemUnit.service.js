import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getItemUnits = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, isActive, pagination, signal } = payload || {};

  const queryParams = new URLSearchParams({ page, limit });
  if (typeof isActive !== 'undefined') queryParams.append('isActive', isActive);
  if (typeof pagination !== 'undefined') queryParams.append('pagination', pagination);

  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.ITEM_UNIT.BASE, config);
  return response.data;
}, 'getItemUnits');

const createItemUnit = async data => {
  const response = await axiosConfig.post(API_ROUTES.ITEM_UNIT.CREATE, data);
  return response.data;
};

const updateItemUnit = async (id, data) => {
  const response = await axiosConfig.put(API_ROUTES.ITEM_UNIT.UPDATE(id), data);
  return response.data;
};

const getItemUnitsDrop = withErrorHandling(async payload => {
  const { signal } = payload || {};
  const config = { ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.ITEM_UNIT.DROPDOWN, config);
  return response.data;
}, 'getItemUnitsDrop');

export const itemUnitService = {
  getItemUnits,
  createItemUnit,
  updateItemUnit,
  getItemUnitsDrop,
};
