import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getItemBatches = withErrorHandling(async payload => {
  const {
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    search = '',
    sortBy = '',
    signal,
    itemId = '',
    warehouse = '',
    warehouseId = '',
    division = '',
    branch = '',
    sourceType = '',
    startDate = null,
    endDate = null,
  } = payload;

  const queryParams = new URLSearchParams({ page, limit });
  if (search) queryParams.append('search', search);
  if (sortBy) queryParams.append('sortBy', sortBy);
  if (itemId) queryParams.append('itemId', itemId);
  const resolvedWarehouseId = warehouseId || warehouse;
  if (resolvedWarehouseId) queryParams.append('warehouseId', resolvedWarehouseId);
  if (division) queryParams.append('divisionId', division);
  if (branch) queryParams.append('branchId', branch);
  if (sourceType) queryParams.append('sourceType', sourceType);
  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }

  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.INVENTORY.BATCHES.BASE, config);
  return response.data;
}, 'getItemBatches');

const getItemBatchById = withErrorHandling(async payload => {
  const { batchId, signal } = payload;
  const config = { ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.INVENTORY.BATCHES.GET_BY_ID(batchId), config);
  return response.data;
}, 'getItemBatchById');

export const batchesService = {
  getItemBatches,
  getItemBatchById,
};
