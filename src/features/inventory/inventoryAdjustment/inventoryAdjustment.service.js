import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getInventoryAdjustment = withErrorHandling(async payload => {
  const {
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    search = '',
    sortBy = '',
    signal,
    branch = '',
    division = '',
    warehouse = '',
    status = '',
    adjustmentDate = null,
    startDate = null,
    endDate = null,
  } = payload;
  const queryParams = new URLSearchParams({
    page: page,
    limit: limit,
  });
  if (search) queryParams.append('search', search);
  if (sortBy) queryParams.append('sortBy', sortBy);
  if (branch) queryParams.append('branchId', branch);
  if (division) queryParams.append('divisionId', division);
  if (warehouse) queryParams.append('warehouseId', warehouse);
  if (status) queryParams.append('status', status);
  if (adjustmentDate) {
    queryParams.append('adjustmentDate', adjustmentDate);
  }
  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }

  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.INVENTORY.INVENTORY_ADJUSTMENT.BASE, config);
  return response.data;
}, 'getInventoryAdjustment');

const createInventoryAdjustment = withErrorHandling(async inventoryData => {
  const response = await axiosConfig.post(API_ROUTES.INVENTORY.INVENTORY_ADJUSTMENT.CREATE, inventoryData);
  return response.data;
}, 'createInventoryAdjustment');

const updateInventoryAdjustment = withErrorHandling(async ({ inventoryId, inventoryData }) => {
  const response = await axiosConfig.patch(API_ROUTES.INVENTORY.INVENTORY_ADJUSTMENT.UPDATE(inventoryId), inventoryData);
  return response.data;
}, 'updateInventoryAdjustment');

const approveInventoryAdjustment = withErrorHandling(async payload => {
  const { inventoryId } = payload;

  const response = await axiosConfig.patch(API_ROUTES.INVENTORY.INVENTORY_ADJUSTMENT.APPROVED_INVENTORY(inventoryId), {}, {});
  return response.data;
}, 'approveInventoryAdjustment');

const rejectInventoryAdjustment = withErrorHandling(async payload => {
  const { inventoryId } = payload;
  const response = await axiosConfig.patch(API_ROUTES.INVENTORY.INVENTORY_ADJUSTMENT.REJECT_INVENTORY(inventoryId), {}, {});
  return response.data;
}, 'rejectInventoryAdjustment');

const getInventoryAdjustmentById = withErrorHandling(async payload => {
  const { inventoryId, signal } = payload;

  let config = { ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.INVENTORY.INVENTORY_ADJUSTMENT.GET_BY_ID(inventoryId), {
    ...config,
  });
  return response.data;
}, 'getInventoryAdjustmentById');

export const inventoryAdjustmentService = {
  getInventoryAdjustment,
  createInventoryAdjustment,
  updateInventoryAdjustment,
  approveInventoryAdjustment,
  rejectInventoryAdjustment,
  getInventoryAdjustmentById,
};
