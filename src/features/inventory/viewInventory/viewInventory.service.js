import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getItemInventoryStock = withErrorHandling(async payload => {
  const {
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    search = '',
    itemId,
    itemType = null,
    itemGroup = null,
    division = null,
    branch = null,
    warehouse = null,
    itemStatus = null,
    stockStatus = null,
    itemIds = null,
    includeZeroInventory = false,
    signal,
  } = payload;
  const queryParams = new URLSearchParams({ page: page, limit: limit });
  if (search) queryParams.append('search', search);
  if (itemId) queryParams.append('itemId', itemId);
  if (itemType) queryParams.append('itemType', itemType);
  if (itemGroup) queryParams.append('itemGroup', itemGroup);
  if (itemIds) queryParams.append('itemIds', Array.isArray(itemIds) ? itemIds.join(',') : itemIds);
  if (division) queryParams.append('divisionId', division);
  if (branch) queryParams.append('branchId', branch);
  if (warehouse) queryParams.append('warehouseId', warehouse);
  if (itemStatus !== undefined && itemStatus !== null && itemStatus !== '') queryParams.append('itemStatus', String(itemStatus));
  if (stockStatus) queryParams.append('stockStatus', stockStatus);
  queryParams.append('includeZeroInventory', String(includeZeroInventory));
  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.INVENTORY.VIEW_INVENTORY.GET_INVENTORY_STOCK, config);
  return response.data;
}, 'getItemInventoryStock');

const exportInventoryStock = withErrorHandling(async payload => {
  const { search = '', itemId, itemType = null, itemGroup = null, division = null, branch = null, warehouse = null, itemStatus = null, includeZeroInventory = false, signal } = payload;
  const queryParams = new URLSearchParams();
  if (search) queryParams.append('search', search);
  if (itemId) queryParams.append('itemId', itemId);
  if (itemType) queryParams.append('itemType', itemType);
  if (itemGroup) queryParams.append('itemGroup', itemGroup);
  if (division) queryParams.append('divisionId', division);
  if (branch) queryParams.append('branchId', branch);
  if (warehouse) queryParams.append('warehouseId', warehouse);
  if (itemStatus !== undefined && itemStatus !== null && itemStatus !== '') queryParams.append('itemStatus', String(itemStatus));
  queryParams.append('includeZeroInventory', String(includeZeroInventory));
  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.INVENTORY.VIEW_INVENTORY.EXPORT_INVENTORY_STOCK, config);
  return response.data;
}, 'exportInventoryStock');

const getItemInventoryDetails = withErrorHandling(async payload => {
  const { itemId, signal } = payload;
  const config = { ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.INVENTORY.VIEW_INVENTORY.GET_ITEM_INVENTORY_DETAILS(itemId), config);
  return response.data;
}, 'getItemInventoryDetails');

const getItemInventoryBatches = withErrorHandling(async payload => {
  const { itemId, page = 1, limit = DEFAULT_PAGE_SIZE, pagination, signal } = payload;
  const queryParams = new URLSearchParams({ page, limit });
  if (pagination !== undefined) queryParams.append('pagination', pagination);
  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.INVENTORY.VIEW_INVENTORY.GET_ITEM_INVENTORY_BATCHES(itemId), config);
  return response.data;
}, 'getItemInventoryBatches');

const getItemInventoryBatchById = withErrorHandling(async payload => {
  const { itemId, batchId, signal } = payload;
  const config = { ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.INVENTORY.VIEW_INVENTORY.GET_ITEM_INVENTORY_BATCH_BY_ID(itemId, batchId), config);
  return response.data;
}, 'getItemInventoryBatchById');

const getInventoryPendingPurchaseOrderQty = withErrorHandling(async payload => {
  const { itemId, signal } = payload;
  const queryParams = new URLSearchParams();
  if (itemId) queryParams.append('itemId', itemId);
  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.INVENTORY.VIEW_INVENTORY.GET_INVENTORY_PENDING_PURCHASE_ORDER_QTY, config);
  return response.data;
}, 'getInventoryPendingPurchaseOrderQty');

export const viewInventoryService = {
  getItemInventoryStock,
  exportInventoryStock,
  getItemInventoryDetails,
  getItemInventoryBatches,
  getItemInventoryBatchById,
  getInventoryPendingPurchaseOrderQty,
};
