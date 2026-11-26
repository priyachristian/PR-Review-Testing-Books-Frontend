import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { buildItemMasterMultipartPayload } from 'utils/multipartHelper';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getItems = withErrorHandling(async payload => {
  const {
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    search = '',
    signal,
    sortBy = '',
    itemType = '',
    itemGroup = '',
    status = '',
    category = '',
    appName = '',
    startDate = null,
    endDate = null,
    itemDate = null,
  } = payload;
  const queryParams = new URLSearchParams({
    page: page,
    limit: limit,
  });
  if (search) queryParams.append('search', search);
  if (sortBy) queryParams.append('sortBy', sortBy);
  if (itemType) queryParams.append('itemType', itemType);
  if (itemGroup) queryParams.append('itemGroup', itemGroup);
  if (appName) queryParams.append('appName', appName);
  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }
  if (itemDate) queryParams.append('itemDate', itemDate);
  if (category === 'goods' || category === 'service') {
    queryParams.append('category', category);
  }
  if (status) {
    queryParams.append('status', status);
  }
  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.ALL_MASTER.ITEM_MASTER.BASE, config);
  return response.data;
}, 'getItems');

const getItemsExport = withErrorHandling(async payload => {
  const { search = '', sortBy = '', itemType = '', itemGroup = '', status = '', category = '', startDate, endDate, itemDate, signal, appName = '' } = payload;
  const queryParams = new URLSearchParams({});
  if (search) queryParams.append('search', search);
  if (sortBy) queryParams.append('sortBy', sortBy);
  if (itemType) queryParams.append('itemType', itemType);
  if (itemGroup) queryParams.append('itemGroup', itemGroup);
  if (status) {
    queryParams.append('status', status);
  }
  if (category === 'goods' || category === 'service') {
    queryParams.append('category', category);
  }
  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }
  if (appName) queryParams.append('appName', appName);
  if (itemDate) queryParams.append('itemDate', itemDate);
  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.ALL_MASTER.ITEM_MASTER.EXPORT, config);
  return response.data;
}, 'getItemsExport');

const createItem = withErrorHandling(async itemData => {
  const { formData } = buildItemMasterMultipartPayload(itemData);
  const response = await axiosConfig.post(API_ROUTES.ALL_MASTER.ITEM_MASTER.CREATE, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}, 'createItem');

const updateItemData = withErrorHandling(async ({ itemId, itemData }) => {
  const { formData } = buildItemMasterMultipartPayload(itemData);
  const response = await axiosConfig.put(API_ROUTES.ALL_MASTER.ITEM_MASTER.UPDATE(itemId), formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}, 'updateItemData');

const salesFileUpload = withErrorHandling(async fileData => {
  const response = await axiosConfig.post(API_ROUTES.FILE.UPLOAD, fileData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}, 'salesFileUpload');

const attechmentFileUpload = withErrorHandling(async fileData => {
  const response = await axiosConfig.post(API_ROUTES.FILE.UPLOAD, fileData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}, 'attechmentFileUpload');

const getIQCDrop = withErrorHandling(async payload => {
  const { signal } = payload;
  const queryParams = new URLSearchParams({});
  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.ALL_MASTER.ITEM_MASTER.GET_IQ_DROP, config);
  return response.data;
}, 'getIQCDrop');

const getWarehouseDrop = withErrorHandling(async payload => {
  const { branchId, signal, isSplit = false, includeRejectionWarehouses = false } = payload;
  const queryParams = new URLSearchParams({});
  if (branchId) {
    queryParams.append('branchId', branchId);
  }
  if (isSplit) {
    queryParams.append('isSplit', isSplit);
  }
  // Only the rejection-config settings screen needs the reserved reuse/return/scrap warehouses.
  if (includeRejectionWarehouses) {
    queryParams.append('includeRejectionWarehouses', 'true');
  }
  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.ALL_MASTER.ITEM_MASTER.GET_WAREHOUSE_DROP_DOWN, config);
  return response.data;
}, 'getWarehouseDrop');

const getRecipeDrop = withErrorHandling(async payload => {
  const { signal } = payload;
  const queryParams = new URLSearchParams({});
  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.ALL_MASTER.ITEM_MASTER.GET_RECIPE_DROP, config);
  return response.data;
}, 'getRecipeDrop');

const getItemDrop = withErrorHandling(async payload => {
  const { itemGroup, signal, isService, trackInventory } = payload;
  const queryParams = new URLSearchParams({});
  if (itemGroup) {
    queryParams.append('itemGroup', itemGroup);
  }
  if (isService !== undefined) {
    queryParams.append('isService', isService);
  }
  if (trackInventory !== undefined) {
    queryParams.append('trackInventory', trackInventory);
  }

  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.ALL_MASTER.ITEM_MASTER.GET_ITEM_DROP, config);
  return response.data;
}, 'getItemDrop');

const getAllItemDrop = withErrorHandling(async payload => {
  const { signal, isService = null, warehouseId = null, priceListId = null, customerId = null, trackInventory = null, isSellable = null, isPurchasable = null } = payload;
  const queryParams = new URLSearchParams({});

  if (isService !== null) {
    queryParams.append('isService', isService);
  }
  if (warehouseId) {
    queryParams.append('warehouseId', warehouseId);
  }
  if (priceListId) {
    queryParams.append('priceListId', priceListId);
  }
  if (customerId) {
    queryParams.append('customerId', customerId);
  }
  if (trackInventory !== null) {
    queryParams.append('trackInventory', trackInventory);
  }
  if (isSellable !== null) {
    queryParams.append('isSellable', isSellable);
  }
  if (isPurchasable !== null) {
    queryParams.append('isPurchasable', isPurchasable);
  }
  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.ALL_MASTER.ITEM_MASTER.GET_ITEM_DROP, config);
  return response.data;
}, 'getAllItemDrop');

const transferItem = withErrorHandling(async transferData => {
  const response = await axiosConfig.post(API_ROUTES.INVENTORY.INVENTORY_TRANSFER.CREATE, transferData, {});
  return response.data;
}, 'transferItem');

const addItemStock = withErrorHandling(async itemStockData => {
  const response = await axiosConfig.post(API_ROUTES.ALL_MASTER.ITEM_MASTER.ADD_ITEM_STOCK, itemStockData, {});
  return response.data;
}, 'addItemStock');

const addBulkItems = withErrorHandling(async itemData => {
  const { items, increment } = itemData;
  const params = {};
  if (increment !== undefined) params.increment = increment;

  const response = await axiosConfig.post(API_ROUTES.ALL_MASTER.ITEM_MASTER.ITEM_BULK, { items }, { params });
  return response.data;
}, 'addBulkItems');

const verifyBulkItems = withErrorHandling(async itemData => {
  const { items, increment } = itemData;
  const params = {};
  if (increment !== undefined) params.increment = increment;

  const response = await axiosConfig.post(API_ROUTES.ALL_MASTER.ITEM_MASTER.ITEM_VERIFY, { items }, { params });
  return response.data;
}, 'verifyBulkItems');

const addBulkInventory = withErrorHandling(async payload => {
  const body = {
    itemInventory: payload?.itemInventory ?? [],
  };
  const response = await axiosConfig.post(API_ROUTES.ALL_MASTER.ITEM_MASTER.ITEM_INVENTORY_BULK, body);
  return response.data;
}, 'addBulkInventory');

const verifyBulkInventory = withErrorHandling(async payload => {
  const body = {
    itemInventory: payload?.itemInventory ?? [],
  };
  const response = await axiosConfig.post(API_ROUTES.ALL_MASTER.ITEM_MASTER.ITEM_INVENTORY_BULK_VERIFY, body);
  return response.data;
}, 'verifyBulkInventory');

const getItemReport = withErrorHandling(async payload => {
  const { item, page, limit, startDate = null, endDate = null, sortBy = 'asc', warehouse = null, branch = null, division = null, isSplit = false, splitOnly = false, pagination, signal } = payload;

  const queryParams = new URLSearchParams({
    itemId: item,
    page: page,
    sortBy: sortBy,
  });

  if (limit !== undefined && limit !== null) {
    queryParams.append('limit', limit);
  }

  if (pagination === false || pagination === 'false') {
    queryParams.append('pagination', 'false');
  }

  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }
  if (warehouse) {
    queryParams.append('warehouseId', warehouse);
  }
  if (branch) {
    queryParams.append('branchId', branch);
  }
  if (division) {
    queryParams.append('divisionId', division);
  }
  if (isSplit) {
    queryParams.append('isSplit', isSplit);
  }
  if (splitOnly) {
    queryParams.append('splitOnly', splitOnly);
  }

  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.ALL_MASTER.ITEM_MASTER.GET_ITEM_REPORT, config);
  return response.data;
}, 'getItemReport');

const getItemDropWithBom = withErrorHandling(async payload => {
  const { signal } = payload;
  const queryParams = new URLSearchParams({});

  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.ALL_MASTER.ITEM_MASTER.GET_DROP_WITH_BOM, config);
  return response.data;
}, 'getItemDropWithBom');

const fetchInventoryTransferRequest = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, search = '', status = '', signal, division, branch, isProductionOrderReq } = payload;

  const queryParams = new URLSearchParams({
    page: page,
    limit: limit,
  });
  if (search) {
    queryParams.append('search', search);
  }
  if (status) {
    queryParams.append('status', status);
  }
  if (division) {
    queryParams.append('divisionId', division);
  }
  if (branch) {
    queryParams.append('branchId', branch);
  }
  if (isProductionOrderReq !== undefined) {
    queryParams.append('isProductionOrderReq', isProductionOrderReq);
  }
  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.INVENTORY.INVENTORY_TRANSFER.BASE, config);

  return response.data;
}, 'fetchInventoryTransferRequest');

const approveInventoryTransferRequest = withErrorHandling(async payload => {
  const { inventoryTransferId, manPower_inventoryTransfer } = payload;
  const response = await axiosConfig.patch(API_ROUTES.INVENTORY.INVENTORY_TRANSFER.APPROVE(inventoryTransferId), manPower_inventoryTransfer, {});
  return response.data;
}, 'approveInventoryTransferRequest');

const rejectInventoryTransferRequest = withErrorHandling(async payload => {
  const { inventoryTransferId, manPower_inventoryTransfer } = payload;
  const body = manPower_inventoryTransfer ? { manPower_inventoryTransfer } : {};
  const response = await axiosConfig.patch(API_ROUTES.INVENTORY.INVENTORY_TRANSFER.REJECT(inventoryTransferId), body, {});
  return response.data;
}, 'rejectInventoryTransferRequest');

const getInventoryTransferById = withErrorHandling(async payload => {
  const { inventoryTransferId, signal } = payload;
  let config = { ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.INVENTORY.INVENTORY_TRANSFER.GET_BY_ID(inventoryTransferId), config);
  return response.data;
}, 'getInventoryTransferById');

const getItemById = withErrorHandling(async payload => {
  const { itemId, signal } = payload;

  let config = { ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.ALL_MASTER.ITEM_MASTER.GET_BY_ID(itemId), {
    ...config,
  });
  return response.data;
}, 'getItemById');

const getViewItem = withErrorHandling(async payload => {
  const { itemId, signal } = payload;

  const config = { ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.ALL_MASTER.ITEM_MASTER.VIEW_ITEM(itemId), {
    ...config,
  });
  return response.data;
}, 'getViewItem');

const getItemTransactions = withErrorHandling(async payload => {
  const { itemId, type = 'Quote', status = '', customerId = '', vendorId = '', page = 1, limit = DEFAULT_PAGE_SIZE, signal } = payload;

  const queryParams = new URLSearchParams({
    type,
    page: String(page),
    limit: String(limit),
  });
  if (status && status !== 'All') queryParams.append('status', status);
  if (customerId) queryParams.append('customerId', customerId);
  if (vendorId) queryParams.append('vendorId', vendorId);

  const response = await axiosConfig.get(API_ROUTES.ALL_MASTER.ITEM_MASTER.GET_ITEM_TRANSACTIONS(itemId), {
    params: queryParams,
    ...withAbortSignal(signal),
  });
  return response.data;
}, 'getItemTransactions');

const toggleItemStatus = withErrorHandling(async payload => {
  const { itemId, isActive } = payload;
  const params = { isActive };
  const response = await axiosConfig.put(API_ROUTES.ALL_MASTER.ITEM_MASTER.TOGGLE_ITEM_STATUS(itemId), {}, { params });
  return response.data;
}, 'toggleItemStatus');

const getFGBOMItemDrop = withErrorHandling(async payload => {
  const { signal } = payload;
  const queryParams = new URLSearchParams({});
  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.ALL_MASTER.ITEM_MASTER.GET_FGBOM_ITEM_DROP, config);
  return response.data;
}, 'getFGBOMItemDrop');

const getItemAvailableStock = withErrorHandling(async payload => {
  const { signal, itemId = '', warehouseId = '' } = payload;
  const queryParams = new URLSearchParams({});
  if (itemId) queryParams.append('itemId', itemId);
  if (warehouseId) queryParams.append('warehouseId', warehouseId);
  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.ALL_MASTER.ITEM_MASTER.GET_ITEM_AVAILABLE_STOCK, config);
  return response.data;
}, 'getItemAvailableStock');

const getItemsUsedIn = withErrorHandling(async payload => {
  const { itemId, signal } = payload;
  const queryParams = new URLSearchParams({ itemId });
  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.ALL_MASTER.ITEM_MASTER.GET_USED_IN, config);
  return response.data;
}, 'getItemsUsedIn');

const addProductionDataToItem = withErrorHandling(async ({ itemId, productionData }) => {
  const response = await axiosConfig.post(API_ROUTES.ALL_MASTER.ITEM_MASTER.ADD_PRODUCTION_DATA(itemId), productionData);
  return response.data;
}, 'addProductionDataToItem');

const deleteItem = withErrorHandling(async ({ itemId }) => {
  const response = await axiosConfig.delete(API_ROUTES.ALL_MASTER.ITEM_MASTER.DELETE(itemId));
  return response.data;
}, 'deleteItem');

export const itemMasterService = {
  getItems,
  getItemsExport,
  createItem,
  updateItemData,
  salesFileUpload,
  attechmentFileUpload,
  getIQCDrop,
  getWarehouseDrop,
  getRecipeDrop,
  getItemDrop,
  getAllItemDrop,
  transferItem,
  addItemStock,
  addBulkItems,
  verifyBulkItems,
  addBulkInventory,
  verifyBulkInventory,
  getItemReport,
  getItemDropWithBom,
  fetchInventoryTransferRequest,
  approveInventoryTransferRequest,
  rejectInventoryTransferRequest,
  getItemById,
  getViewItem,
  getItemTransactions,
  getFGBOMItemDrop,
  getItemAvailableStock,
  toggleItemStatus,
  getItemsUsedIn,
  addProductionDataToItem,
  getInventoryTransferById,
  deleteItem,
};
