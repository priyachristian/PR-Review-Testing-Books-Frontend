import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getWarehouse = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, search = '', sortBy = '', isSplit = false, status = null, signal, divisionId = '', branchId = '' } = payload;
  const queryParams = new URLSearchParams({
    page: page,
    limit: limit,
  });
  if (isSplit) {
    queryParams.append('isSplit', isSplit);
  }
  if (search) queryParams.append('search', search);
  if (sortBy) queryParams.append('sortBy', sortBy);
  if (divisionId) queryParams.append('divisionId', divisionId);
  if (branchId) queryParams.append('branchId', branchId);
  if (status) {
    queryParams.append('status', status);
  }

  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.ALL_MASTER.WAREHOUSE.BASE, config);
  return response.data;
}, 'getWarehouse');

const deleteWarehouse = withErrorHandling(async payload => {
  const { warehouseId } = payload;
  const response = await axiosConfig.delete(API_ROUTES.ALL_MASTER.WAREHOUSE.DELETE(warehouseId), {});
  return response.data;
}, 'deleteWarehouse');

const getBranchDropDown = withErrorHandling(async payload => {
  const { divisionId, signal, isSplit = false } = payload;
  const queryParams = new URLSearchParams({});

  if (divisionId) {
    queryParams.append('divisionId', divisionId);
  }

  if (isSplit) {
    queryParams.append('isSplit', isSplit);
  }
  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.ALL_MASTER.WAREHOUSE.GET_BRANCHES_DROP, config);
  return response.data;
}, 'getBranchDropDown');

const createWarehouse = withErrorHandling(async warehouseData => {
  const response = await axiosConfig.post(API_ROUTES.ALL_MASTER.WAREHOUSE.CREATE, warehouseData, {});
  return response.data;
}, 'createWarehouse');

const updateWarehouse = withErrorHandling(async ({ warehouseId, warehouseData }) => {
  const response = await axiosConfig.put(API_ROUTES.ALL_MASTER.WAREHOUSE.UPDATE(warehouseId), warehouseData, {});
  return response.data;
}, 'updateWarehouse');

const getWarehouseById = withErrorHandling(async payload => {
  const { warehouseId, signal } = payload;

  let config = { ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.ALL_MASTER.WAREHOUSE.GET_BY_ID(warehouseId), config);
  return response.data;
}, 'getWarehouseById');

const toggleWarehouseStatus = withErrorHandling(async payload => {
  const { warehouseId, isActive } = payload;
  const params = { isActive };
  const response = await axiosConfig.put(API_ROUTES.ALL_MASTER.WAREHOUSE.TOGGLE_WAREHOUSE_STATUS(warehouseId), {}, { params });
  return response.data;
}, 'toggleWarehouseStatus');

export const warehouseService = {
  getWarehouse,
  deleteWarehouse,
  getBranchDropDown,
  createWarehouse,
  updateWarehouse,
  getWarehouseById,
  toggleWarehouseStatus,
};
