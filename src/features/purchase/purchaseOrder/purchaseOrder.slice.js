import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { purchaseOrderService } from './purchaseOrder.service';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getPurchaseOrder = createAsyncThunk('purchaseOrder/getPurchaseOrder', purchaseOrderService.getPurchaseOrder);

const createPurchaseOrders = createAsyncThunk('purchaseOrder/createPurchaseOrders', async (purchaseOrderData, { rejectWithValue }) => {
  try {
    const data = await purchaseOrderService.createPurchaseOrders(purchaseOrderData);
    return data;
  } catch (error) {
    console.error('Error in create purchase order thunk:', error);
    return rejectWithValue(error?.response?.data || error || 'Something went wrong');
  }
});

const updatePurchaseOrders = createAsyncThunk('purchaseOrder/updatePurchaseOrders', async ({ purchaseId, purchaseOrderData }, { rejectWithValue }) => {
  try {
    const data = await purchaseOrderService.updatePurchaseOrders({
      purchaseId,
      purchaseOrderData,
    });
    return data;
  } catch (error) {
    console.error('Error in update purchase order thunk:', error);
    return rejectWithValue(error?.response?.data || error || 'Something went wrong');
  }
});

const purchaseOrderFileUpload = createAsyncThunk('purchaseOrder/purchaseOrderFileUpload', purchaseOrderService.purchaseOrderFileUpload);

const updateStatus = createAsyncThunk('purchaseOrder/updateStatus', purchaseOrderService.updateStatus);

const getPurchaseOrderById = createAsyncThunk('purchaseOrder/getPurchaseOrderById', purchaseOrderService.getPurchaseOrderById);

const getPurchaseOrderDropdownforConvert = createAsyncThunk('purchaseOrder/getPurchaseOrderDropdownforConvert', purchaseOrderService.getPurchaseOrderDropdownforConvert);

const getPendingItemsPurchaseOrder = createAsyncThunk('purchaseOrder/getPendingItemsPurchaseOrder', purchaseOrderService.getPendingItemsPurchaseOrder);

const removePurchaseOrder = createAsyncThunk('purchaseOrder/removePurchaseOrder', purchaseOrderService.removePurchaseOrder);

const getPurchaseOrderExports = createAsyncThunk('purchaseOrder/getPurchaseOrderExports', purchaseOrderService.getPurchaseOrderExports);

export const purchaseOrderSlice = createSlice({
  name: 'purchaseOrder',
  initialState: {
    purchaseOrders: [],
    purchaseOrder: null,
    purchaseOrderFile: null,
    pagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
    },
    purchaseOrderDropForConvert: [],
    pendingItems: null,
    remove: null,
    create: null,
    update: null,
    loading: false,
    submitLoading: false,
    deleteLoading: false,
    submitWithStatusLoading: false,
    pendingItemLoading: false,
    uploading: false,
    droploading: false,
    exportLoading: false,
    purchaseOrderExports: [],
    error: null,
  },
  reducers: {
    resetPurchaseOrder: state => {
      state.purchaseOrder = null;
    },
    resetPurchaseOrderDropForConvert: state => {
      state.purchaseOrderDropForConvert = null;
    },
    resetPendingItems: state => {
      state.pendingItems = null;
    },
    resetPurchaseOrders: state => {
      state.purchaseOrders = [];
      state.pagination = {
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        totalPages: 1,
        totalResults: 0,
      };
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getPurchaseOrder.pending, state => {
        state.loading = true;
      })
      .addCase(getPurchaseOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.purchaseOrders = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalResults: action.payload.extras.totalResults,
          totalAmount: action.payload.extras.totalAmount,
        };
        state.message = action.payload.message;
      })
      .addCase(getPurchaseOrder.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.purchaseOrders = [];
          state.error = action.error.message;
        }
      })
      .addCase(createPurchaseOrders.pending, (state, action) => {
        if (action?.meta?.arg?.status) {
          state.submitWithStatusLoading = true;
        } else {
          state.submitLoading = true;
        }
      })
      .addCase(createPurchaseOrders.fulfilled, (state, action) => {
        if (action?.meta?.arg?.status) {
          state.submitWithStatusLoading = false;
        } else {
          state.submitLoading = false;
        }
        state.create = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createPurchaseOrders.rejected, (state, action) => {
        if (action?.meta?.arg?.status) {
          state.submitWithStatusLoading = false;
        } else {
          state.submitLoading = false;
        }
        state.error = action.payload;
        if (!action?.payload?.data?.isCreditLimitError) {
          Toast.error(action?.payload?.message || 'Something went wrong');
        }
      })
      .addCase(updatePurchaseOrders.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updatePurchaseOrders.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.update = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(updatePurchaseOrders.rejected, (state, action) => {
        state.submitLoading = false;
        state.error = action.payload;
        if (!action?.payload?.data?.isCreditLimitError) {
          Toast.error(action?.payload?.message || 'Something went wrong');
        }
      })
      .addCase(purchaseOrderFileUpload.pending, state => {
        state.uploading = true;
      })
      .addCase(purchaseOrderFileUpload.fulfilled, (state, action) => {
        state.uploading = false;
        state.purchaseOrderFile = action.payload.data.urls;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(purchaseOrderFileUpload.rejected, (state, action) => {
        state.uploading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updateStatus.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updateStatus.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.message = action.payload.message;
        Toast.success(action.payload.message);
      })
      .addCase(updateStatus.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getPurchaseOrderById.pending, state => {
        state.loading = true;
      })
      .addCase(getPurchaseOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.purchaseOrder = action.payload.data;
      })
      .addCase(getPurchaseOrderById.rejected, (state, action) => {
        state.loading = false;
        state.purchaseOrder = null;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
        }
      })
      .addCase(getPurchaseOrderDropdownforConvert.pending, state => {
        state.droploading = true;
      })
      .addCase(getPurchaseOrderDropdownforConvert.fulfilled, (state, action) => {
        state.droploading = false;
        state.purchaseOrderDropForConvert = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getPurchaseOrderDropdownforConvert.rejected, (state, action) => {
        state.droploading = false;
        state.purchaseOrderDropForConvert = [];
        state.error = action.error.message;
      })
      .addCase(getPendingItemsPurchaseOrder.pending, state => {
        state.pendingItemLoading = true;
      })
      .addCase(getPendingItemsPurchaseOrder.fulfilled, (state, action) => {
        state.pendingItemLoading = false;
        state.pendingItems = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getPendingItemsPurchaseOrder.rejected, (state, action) => {
        state.pendingItemLoading = false;
        state.pendingItems = null;
        state.error = action.error.message;
      })
      .addCase(removePurchaseOrder.pending, state => {
        state.deleteLoading = true;
      })
      .addCase(removePurchaseOrder.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.remove = action.payload.data;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(removePurchaseOrder.rejected, (state, action) => {
        state.deleteLoading = false;
        state.remove = null;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getPurchaseOrderExports.pending, state => {
        state.exportLoading = true;
      })
      .addCase(getPurchaseOrderExports.fulfilled, (state, action) => {
        state.exportLoading = false;
        state.purchaseOrderExports = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getPurchaseOrderExports.rejected, (state, action) => {
        state.exportLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
        }
      });
  },
});
export const purchaseOrderSliceMethods = {
  getPurchaseOrder,
  createPurchaseOrders,
  updatePurchaseOrders,
  purchaseOrderFileUpload,
  updateStatus,
  getPurchaseOrderById,
  getPurchaseOrderDropdownforConvert,
  getPendingItemsPurchaseOrder,
  removePurchaseOrder,
  getPurchaseOrderExports,
};
export const { resetPurchaseOrder, resetPurchaseOrderDropForConvert, resetPendingItems, resetPurchaseOrders } = purchaseOrderSlice.actions;
export default purchaseOrderSlice.reducer;
