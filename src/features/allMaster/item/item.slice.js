import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { itemMasterService } from './item.service';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';
import { isCanceledRequestError } from '@/utils/serviceHelper';

const getItems = createAsyncThunk('itemMaster/getItems', itemMasterService.getItems);

const getItemsExport = createAsyncThunk('itemMaster/getItemsExport', itemMasterService.getItemsExport);

const createItem = createAsyncThunk('itemMaster/createItem', itemMasterService.createItem);

const updateItemData = createAsyncThunk('itemMaster/updateItemData', itemMasterService.updateItemData);

const salesFileUpload = createAsyncThunk('itemMaster/salesFileUpload', itemMasterService.salesFileUpload);

const attechmentFileUpload = createAsyncThunk('itemMaster/attechmentFileUpload', itemMasterService.attechmentFileUpload);

const getIQCDrop = createAsyncThunk('itemMaster/getIQCDrop', itemMasterService.getIQCDrop);

const getWarehouseDrop = createAsyncThunk('itemMaster/getWarehouseDrop', async (payload, thunkAPI) => {
  const state = thunkAPI.getState();
  let finalPayload = {
    ...payload,
    isSplit: payload?.isSplit ? payload?.isSplit : state?.common?.isSplitSessionActive ? true : false,
  };
  return await itemMasterService.getWarehouseDrop(finalPayload);
});

const getRecipeDrop = createAsyncThunk('itemMaster/getRecipeDrop', itemMasterService.getRecipeDrop);

const getItemDrop = createAsyncThunk('itemMaster/getItemDrop', itemMasterService.getItemDrop);

const getAllItemDrop = createAsyncThunk('itemMaster/getAllItemDrop', itemMasterService.getAllItemDrop);

const transferItem = createAsyncThunk('itemMaster/transferItem', itemMasterService.transferItem);

const addItemStock = createAsyncThunk('itemMaster/addItemStock', itemMasterService.addItemStock);

const createBulkItem = createAsyncThunk('itemMaster/createBulkItem', itemMasterService.addBulkItems);

const verifyBulkItem = createAsyncThunk('itemMaster/verifyBulkItem', itemMasterService.verifyBulkItems);

const createBulkInventory = createAsyncThunk('itemMaster/createBulkInventory', itemMasterService.addBulkInventory);

const verifyBulkInventory = createAsyncThunk('itemMaster/verifyBulkInventory', itemMasterService.verifyBulkInventory);

const getItemReport = createAsyncThunk('itemMaster/getItemReport', itemMasterService.getItemReport);

const getItemDropWithBom = createAsyncThunk('itemMaster/getItemDropWithBom', itemMasterService.getItemDropWithBom);

const fetchInventoryTransferRequest = createAsyncThunk('itemMaster/fetchInventoryTransferRequest', itemMasterService.fetchInventoryTransferRequest);

const approveInventoryTransferRequest = createAsyncThunk('itemMaster/approveInventoryTransferRequest', itemMasterService.approveInventoryTransferRequest);

const rejectInventoryTransferRequest = createAsyncThunk('itemMaster/rejectInventoryTransferRequest', itemMasterService.rejectInventoryTransferRequest);

const getInventoryTransferById = createAsyncThunk('itemMaster/getInventoryTransferById', itemMasterService.getInventoryTransferById);

const getItemById = createAsyncThunk('itemMaster/getItemById', itemMasterService.getItemById);

const getViewItem = createAsyncThunk('itemMaster/getViewItem', itemMasterService.getViewItem);

const getItemTransactions = createAsyncThunk('itemMaster/getItemTransactions', itemMasterService.getItemTransactions);

const getFGBOMItemDrop = createAsyncThunk('itemMaster/getFGBOMItemDrop', itemMasterService.getFGBOMItemDrop);

const getItemAvailableStock = createAsyncThunk('itemMaster/getItemAvailableStock', itemMasterService.getItemAvailableStock);

const toggleItemStatus = createAsyncThunk('itemMaster/toggleItemStatus', itemMasterService.toggleItemStatus);

const getItemsUsedIn = createAsyncThunk('itemMaster/getItemsUsedIn', itemMasterService.getItemsUsedIn);

const addProductionDataToItem = createAsyncThunk('itemMaster/addProductionDataToItem', itemMasterService.addProductionDataToItem);

const deleteItem = createAsyncThunk('itemMaster/deleteItem', itemMasterService.deleteItem);

export const itemMasterSlice = createSlice({
  name: 'itemMaster',
  initialState: {
    items: [],
    item: null,
    itemBriefDetail: null,
    viewItemLoading: false,
    itemTransactions: [],
    itemTransactionsLoading: false,
    itemTransactionsPagination: { page: 1, limit: DEFAULT_PAGE_SIZE, totalPages: 1, totalResults: 0 },
    itemTransactionStatuses: ['All'],
    itemTransactionType: null,
    itemExports: [],
    getStockLoading: false,
    itemAvailableStock: null,
    fgBomItemDrop: null,
    FGLoading: false,
    pagination1: { page: 1, limit: DEFAULT_PAGE_SIZE, totalPages: 1, totalResults: 0 },
    pagination: { page: 1, limit: DEFAULT_PAGE_SIZE, totalPages: 1, totalResults: 0 },
    purchasing: null,
    saleData: null,
    inventryData: null,
    productData: null,
    attchData: null,
    attchFile: null,
    create: null,
    update: null,
    file: null,
    salesFile: null,
    attechmentFile: null,
    IQCDrop: null,
    warehouseDrop: null,
    recipeDrop: null,
    itemDrop: null,
    itemDropLoading: false,
    allItemDrop: null,
    allItemDropLoading: false,
    allItemDropRequestId: null,
    itemDropWithBom: null,
    inventoryTransferRequest: null,
    inventoryTransferDetail: null,
    inventoryTransferDetailLoading: false,
    approveInventoryTransfer: null,
    rejectInventoryTransfer: null,
    approveTransferLoading: false,
    rejectTransferLoading: false,
    loading: false,
    submitLoading: false,
    deleteLoading: false,
    uploading: false,
    droploading: false,
    itemHistory: null,
    exportLoading: false,
    itemsUsedIn: [],
    itemsUsedInLoading: false,
    productionDataSubmitLoading: false,
    error: null,
  },
  reducers: {
    addPurchasing: (state, action) => {
      state.purchasing = action.payload;
    },
    addSalesData: (state, action) => {
      state.saleData = action.payload;
    },
    addInventryData: (state, action) => {
      state.inventryData = action.payload;
    },
    addProductionData: (state, action) => {
      state.productData = action.payload;
    },
    addAttechmentData: (state, action) => {
      state.attchData = action.payload;
    },
    addAttechmentFileData: (state, action) => {
      state.attchFile = action.payload;
    },
    resetItemBriefDetail: state => {
      state.itemBriefDetail = null;
    },
    resetItemTransactions: state => {
      state.itemTransactions = [];
      state.itemTransactionsLoading = false;
      state.itemTransactionsPagination = { page: 1, limit: DEFAULT_PAGE_SIZE, totalPages: 1, totalResults: 0 };
      state.itemTransactionStatuses = ['All'];
      state.itemTransactionType = null;
    },
    resetItem: state => {
      state.item = null;
      state.purchasing = null;
      state.saleData = null;
      state.inventryData = null;
      state.productData = null;
      state.attchFile = null;
    },
    clearItemReport: state => {
      state.itemHistory = null;
    },
    resetItems: state => {
      state.items = [];
      state.pagination = {
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        totalPages: 1,
        totalResults: 0,
      };
    },
    resetInventoryTransferRequest: state => {
      state.inventoryTransferRequest = null;
      state.pagination1 = { page: 1, limit: DEFAULT_PAGE_SIZE, totalPages: 1, totalResults: 0 };
    },
    resetInventoryTransferDetail: state => {
      state.inventoryTransferDetail = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getItems.pending, state => {
        state.loading = true;
      })
      .addCase(getItems.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload?.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalResults: action.payload.extras.totalResults,
          hasCRMAccess: !!action.payload.extras?.hasCRMAccess,
        };
        state.message = action.payload.message;
      })
      .addCase(getItems.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.items = [];
          state.error = action.error.message;
        }
      })
      .addCase(getItemsExport.pending, state => {
        state.exportLoading = true;
      })
      .addCase(getItemsExport.fulfilled, (state, action) => {
        state.exportLoading = false;
        state.itemExports = action.payload;
        state.message = action.payload.message;
      })
      .addCase(getItemsExport.rejected, (state, action) => {
        state.exportLoading = false;
        state.error = action.error.message;
      })
      .addCase(createItem.pending, state => {
        state.submitLoading = true;
      })
      .addCase(createItem.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.create = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createItem.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.submitLoading = false;
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(salesFileUpload.pending, state => {
        state.uploading = true;
      })
      .addCase(salesFileUpload.fulfilled, (state, action) => {
        state.uploading = false;
        state.salesFile = action.payload.data.urls;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(salesFileUpload.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.uploading = false;
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(attechmentFileUpload.pending, state => {
        state.uploading = true;
      })
      .addCase(attechmentFileUpload.fulfilled, (state, action) => {
        state.uploading = false;
        state.attechmentFile = action.payload.data.urls;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(attechmentFileUpload.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.uploading = false;
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updateItemData.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updateItemData.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.update = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(updateItemData.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.submitLoading = false;
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getIQCDrop.pending, state => {
        state.droploading = true;
      })
      .addCase(getIQCDrop.fulfilled, (state, action) => {
        state.droploading = false;
        state.IQCDrop = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getIQCDrop.rejected, (state, action) => {
        state.droploading = false;
        state.error = action.error.message;
      })
      .addCase(getWarehouseDrop.pending, state => {
        state.droploading = true;
      })
      .addCase(getWarehouseDrop.fulfilled, (state, action) => {
        state.droploading = false;
        state.warehouseDrop = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getWarehouseDrop.rejected, (state, action) => {
        state.droploading = false;
        state.warehouseDrop = null;
        state.error = action.error.message;
      })
      .addCase(getRecipeDrop.pending, state => {
        state.droploading = true;
      })
      .addCase(getRecipeDrop.fulfilled, (state, action) => {
        state.droploading = false;
        state.recipeDrop = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getRecipeDrop.rejected, (state, action) => {
        state.droploading = false;
        state.error = action.error.message;
      })
      .addCase(getItemDrop.pending, state => {
        state.droploading = true;
        state.itemDropLoading = true;
      })
      .addCase(getItemDrop.fulfilled, (state, action) => {
        state.droploading = false;
        state.itemDropLoading = false;
        state.itemDrop = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getItemDrop.rejected, (state, action) => {
        state.droploading = false;
        state.itemDropLoading = false;
        state.error = action.error.message;
      })
      .addCase(getAllItemDrop.pending, (state, action) => {
        state.allItemDropLoading = true;
        state.allItemDrop = null;
        state.allItemDropRequestId = action.meta.requestId;
      })
      .addCase(getAllItemDrop.fulfilled, (state, action) => {
        if (state.allItemDropRequestId !== action.meta.requestId) return;
        state.allItemDropLoading = false;
        state.allItemDrop = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getAllItemDrop.rejected, (state, action) => {
        if (state.allItemDropRequestId !== action.meta.requestId) return;
        state.allItemDropLoading = false;
        if (action.meta?.aborted || isCanceledRequestError(action.error)) return;
        state.error = action.error.message;
      })
      .addCase(transferItem.pending, state => {
        state.loading = true;
      })
      .addCase(transferItem.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(transferItem.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(addItemStock.pending, state => {
        state.loading = true;
      })
      .addCase(addItemStock.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(addItemStock.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(createBulkItem.pending, state => {
        state.createLoading = true;
      })
      .addCase(createBulkItem.fulfilled, (state, action) => {
        state.createLoading = false;
        state.create = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createBulkItem.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.createLoading = false;
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(createBulkInventory.pending, state => {
        state.createLoading = true;
      })
      .addCase(createBulkInventory.fulfilled, (state, action) => {
        state.createLoading = false;
        state.create = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createBulkInventory.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.createLoading = false;
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getItemReport.pending, state => {
        state.loading = true;
        state.itemHistory = null;
      })
      .addCase(getItemReport.fulfilled, (state, action) => {
        state.loading = false;
        state.itemHistory = action.payload?.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalResults: action.payload.extras.totalResults,
          closingBalance: action.payload.extras.closingBalance,
          openingBalance: action.payload.extras.openingBalance,
          closingAmount: action.payload.extras.closingAmount,
          openingAmount: action.payload.extras.openingAmount,
          broughtForward: action.payload.extras.broughtForward,
          carriedOver: action.payload.extras.carriedOver,
          broughtForwardAmount: action.payload.extras.broughtForwardAmount,
          carriedOverAmount: action.payload.extras.carriedOverAmount,
        };
        state.message = action.payload.message;
      })
      .addCase(getItemReport.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.itemHistory = null;
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getItemDropWithBom.pending, state => {
        state.droploading = true;
      })
      .addCase(getItemDropWithBom.fulfilled, (state, action) => {
        state.droploading = false;
        state.itemDropWithBom = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getItemDropWithBom.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.droploading = false;
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(fetchInventoryTransferRequest.pending, state => {
        state.loading = true;
      })
      .addCase(fetchInventoryTransferRequest.fulfilled, (state, action) => {
        state.loading = false;
        state.inventoryTransferRequest = action.payload.data;
        state.pagination1 = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalResults: action.payload.extras.totalResults,
        };
      })
      .addCase(fetchInventoryTransferRequest.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(approveInventoryTransferRequest.pending, state => {
        state.approveTransferLoading = true;
      })
      .addCase(approveInventoryTransferRequest.fulfilled, (state, action) => {
        state.approveTransferLoading = false;
        state.approveInventoryTransfer = action.payload.data;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(approveInventoryTransferRequest.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.approveTransferLoading = false;
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(rejectInventoryTransferRequest.pending, state => {
        state.rejectTransferLoading = true;
      })
      .addCase(rejectInventoryTransferRequest.fulfilled, (state, action) => {
        state.rejectTransferLoading = false;
        state.rejectInventoryTransfer = action.payload.data;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(rejectInventoryTransferRequest.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.rejectTransferLoading = false;
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getInventoryTransferById.pending, state => {
        state.inventoryTransferDetailLoading = true;
      })
      .addCase(getInventoryTransferById.fulfilled, (state, action) => {
        state.inventoryTransferDetailLoading = false;
        state.inventoryTransferDetail = action.payload?.data;
      })
      .addCase(getInventoryTransferById.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.inventoryTransferDetailLoading = false;
          state.error = action.error.message;
        }
      })
      .addCase(getItemById.pending, state => {
        state.loading = true;
      })
      .addCase(getItemById.fulfilled, (state, action) => {
        state.loading = false;
        state.item = action.payload.data;
      })
      .addCase(getItemById.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.error = action.error.message;
        }
      })
      .addCase(getViewItem.pending, state => {
        state.viewItemLoading = true;
      })
      .addCase(getViewItem.fulfilled, (state, action) => {
        state.viewItemLoading = false;
        state.itemBriefDetail = action.payload.data;
      })
      .addCase(getViewItem.rejected, (state, action) => {
        state.viewItemLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.itemBriefDetail = null;
          state.error = action.error.message;
        }
      })
      .addCase(getItemTransactions.pending, state => {
        state.itemTransactionsLoading = true;
      })
      .addCase(getItemTransactions.fulfilled, (state, action) => {
        state.itemTransactionsLoading = false;
        state.itemTransactions = action.payload?.data || [];
        const extras = action.payload?.extras || {};
        state.itemTransactionsPagination = {
          page: extras.page || 1,
          limit: extras.limit || DEFAULT_PAGE_SIZE,
          totalPages: extras.totalPages || 1,
          totalResults: extras.totalResults || 0,
        };
        state.itemTransactionStatuses = Array.isArray(extras.statuses) && extras.statuses.length ? extras.statuses : ['All'];
        state.itemTransactionType = extras.type || null;
      })
      .addCase(getItemTransactions.rejected, (state, action) => {
        state.itemTransactionsLoading = false;
        if (!isCanceledRequestError(action.error)) {
          state.itemTransactions = [];
          state.error = action.error.message;
        }
      })
      .addCase(getFGBOMItemDrop.pending, state => {
        state.FGLoading = true;
      })
      .addCase(getFGBOMItemDrop.fulfilled, (state, action) => {
        state.FGLoading = false;
        state.fgBomItemDrop = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getFGBOMItemDrop.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.FGLoading = false;
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getItemAvailableStock.pending, state => {
        state.getStockLoading = true;
      })
      .addCase(getItemAvailableStock.fulfilled, (state, action) => {
        state.getStockLoading = false;
        state.itemAvailableStock = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getItemAvailableStock.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.getStockLoading = false;
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(toggleItemStatus.pending, state => {
        state.submitLoading = true;
      })
      .addCase(toggleItemStatus.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(toggleItemStatus.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.submitLoading = false;
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getItemsUsedIn.pending, state => {
        state.itemsUsedInLoading = true;
      })
      .addCase(getItemsUsedIn.fulfilled, (state, action) => {
        state.itemsUsedInLoading = false;
        state.itemsUsedIn = action.payload.data || [];
      })
      .addCase(getItemsUsedIn.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.itemsUsedInLoading = false;
          state.error = action.error.message;
        }
      })
      .addCase(addProductionDataToItem.pending, state => {
        state.productionDataSubmitLoading = true;
      })
      .addCase(addProductionDataToItem.fulfilled, (state, action) => {
        state.productionDataSubmitLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(addProductionDataToItem.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.productionDataSubmitLoading = false;
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(deleteItem.pending, state => {
        state.deleteLoading = true;
      })
      .addCase(deleteItem.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(deleteItem.rejected, (state, action) => {
        state.deleteLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      });
  },
});
export const itemMasterSliceMethods = {
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
  createBulkItem,
  verifyBulkItem,
  createBulkInventory,
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
export const {
  addPurchasing,
  addSalesData,
  addInventryData,
  addProductionData,
  addAttechmentData,
  addAttechmentFileData,
  resetItemBriefDetail,
  resetItemTransactions,
  resetItem,
  clearItemReport,
  resetItems,
  resetInventoryTransferRequest,
  resetInventoryTransferDetail,
} = itemMasterSlice.actions;
export default itemMasterSlice.reducer;
