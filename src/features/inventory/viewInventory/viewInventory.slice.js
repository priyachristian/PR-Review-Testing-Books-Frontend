import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { viewInventoryService } from './viewInventory.service';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getItemInventoryStock = createAsyncThunk('viewInventory/getItemInventoryStock', viewInventoryService.getItemInventoryStock);

const getItemInventoryDetails = createAsyncThunk('viewInventory/getItemInventoryDetails', viewInventoryService.getItemInventoryDetails);

const getItemInventoryBatches = createAsyncThunk('viewInventory/getItemInventoryBatches', viewInventoryService.getItemInventoryBatches);

const getItemInventoryBatchById = createAsyncThunk('viewInventory/getItemInventoryBatchById', viewInventoryService.getItemInventoryBatchById);

const getInventoryPendingPurchaseOrderQty = createAsyncThunk('viewInventory/getInventoryPendingPurchaseOrderQty', viewInventoryService.getInventoryPendingPurchaseOrderQty);

export const viewInventorySlice = createSlice({
  name: 'viewInventory',
  initialState: {
    inventoryStock: [],
    inventoryStockPagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
      totalStock: 0,
      totalValuation: 0,
      stockStatusCounts: { inRange: 0, belowMinimum: 0, aboveMaximum: 0, noRange: 0 },
    },
    inventoryStockLoading: false,
    itemInventoryDetails: null,
    itemInventoryDetailsLoading: false,
    itemInventoryBatches: [],
    itemInventoryBatchesPagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
    },
    itemInventoryBatchesLoading: false,
    itemInventoryBatch: null,
    itemInventoryBatchLoading: false,
    inventoryPendingPurchaseOrderQty: null,
    inventoryPendingPurchaseOrderQtyLoading: false,
    error: null,
  },
  reducers: {
    resetInventoryStock: state => {
      state.inventoryStock = [];
      state.inventoryStockPagination = {
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        totalPages: 1,
        totalResults: 0,
        totalStock: 0,
        totalValuation: 0,
        stockStatusCounts: { inRange: 0, belowMinimum: 0, aboveMaximum: 0, noRange: 0 },
      };
    },
    resetItemInventoryDetails: state => {
      state.itemInventoryDetails = null;
      state.itemInventoryDetailsLoading = false;
    },
    resetItemInventoryBatches: state => {
      state.itemInventoryBatches = [];
      state.itemInventoryBatchesPagination = {
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        totalPages: 1,
        totalResults: 0,
      };
      state.itemInventoryBatchesLoading = false;
    },
    resetItemInventoryBatch: state => {
      state.itemInventoryBatch = null;
      state.itemInventoryBatchLoading = false;
    },
    resetInventoryPendingPurchaseOrderQty: state => {
      state.inventoryPendingPurchaseOrderQty = null;
      state.inventoryPendingPurchaseOrderQtyLoading = false;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getItemInventoryStock.pending, state => {
        state.inventoryStockLoading = true;
      })
      .addCase(getItemInventoryStock.fulfilled, (state, action) => {
        state.inventoryStockLoading = false;
        state.inventoryStock = action.payload.data || [];
        state.inventoryStockPagination = {
          page: action.payload.extras?.page,
          limit: action.payload.extras?.limit,
          totalPages: action.payload.extras?.totalPages,
          totalResults: action.payload.extras?.totalResults,
          totalStock: action.payload.extras?.totalStock,
          totalValuation: action.payload.extras?.totalValuation,
          stockStatusCounts: action.payload.extras?.stockStatusCounts || { inRange: 0, belowMinimum: 0, aboveMaximum: 0, noRange: 0 },
        };
      })
      .addCase(getItemInventoryStock.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.inventoryStockLoading = false;
          state.inventoryStock = [];
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getItemInventoryDetails.pending, state => {
        state.itemInventoryDetailsLoading = true;
        state.itemInventoryDetails = null;
      })
      .addCase(getItemInventoryDetails.fulfilled, (state, action) => {
        state.itemInventoryDetailsLoading = false;
        state.itemInventoryDetails = action.payload?.data ?? action.payload;
      })
      .addCase(getItemInventoryDetails.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.itemInventoryDetailsLoading = false;
          state.itemInventoryDetails = null;
          state.error = action.error.message;
        }
      })
      .addCase(getItemInventoryBatches.pending, state => {
        state.itemInventoryBatchesLoading = true;
      })
      .addCase(getItemInventoryBatches.fulfilled, (state, action) => {
        state.itemInventoryBatchesLoading = false;
        state.itemInventoryBatches = action.payload.data || [];
        state.itemInventoryBatchesPagination = {
          page: action.payload.extras?.page,
          limit: action.payload.extras?.limit,
          totalPages: action.payload.extras?.totalPages,
          totalResults: action.payload.extras?.totalResults,
        };
      })
      .addCase(getItemInventoryBatches.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.itemInventoryBatchesLoading = false;
          state.itemInventoryBatches = [];
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getItemInventoryBatchById.pending, state => {
        state.itemInventoryBatchLoading = true;
        state.itemInventoryBatch = null;
      })
      .addCase(getItemInventoryBatchById.fulfilled, (state, action) => {
        state.itemInventoryBatchLoading = false;
        state.itemInventoryBatch = action.payload?.data ?? action.payload;
      })
      .addCase(getItemInventoryBatchById.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.itemInventoryBatchLoading = false;
          state.itemInventoryBatch = null;
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getInventoryPendingPurchaseOrderQty.pending, state => {
        state.inventoryPendingPurchaseOrderQtyLoading = true;
        state.inventoryPendingPurchaseOrderQty = null;
      })
      .addCase(getInventoryPendingPurchaseOrderQty.fulfilled, (state, action) => {
        state.inventoryPendingPurchaseOrderQtyLoading = false;
        state.inventoryPendingPurchaseOrderQty = action.payload?.data ?? action.payload;
      })
      .addCase(getInventoryPendingPurchaseOrderQty.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.inventoryPendingPurchaseOrderQtyLoading = false;
          state.inventoryPendingPurchaseOrderQty = null;
          state.error = action.error.message;
        }
      });
  },
});

export const viewInventorySliceMethods = {
  getItemInventoryStock,
  getItemInventoryDetails,
  getItemInventoryBatches,
  getItemInventoryBatchById,
  getInventoryPendingPurchaseOrderQty,
};

export const { resetInventoryStock, resetItemInventoryDetails, resetItemInventoryBatches, resetItemInventoryBatch, resetInventoryPendingPurchaseOrderQty } = viewInventorySlice.actions;
export default viewInventorySlice.reducer;
