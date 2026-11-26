import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { rejectionOrderService } from './rejectionOrder.service';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';
import { REJECTION_STATUS } from '@/utils/dropdownEnums';
import { isCanceledRequestError } from '@/utils/serviceHelper';

const getRejectionOrders = createAsyncThunk('rejectionOrder/getRejectionOrders', rejectionOrderService.getRejectionOrders);

const getRejectionOrderInventory = createAsyncThunk('rejectionOrder/getRejectionOrderInventory', rejectionOrderService.getRejectionOrderInventory);

const getRejectionOrderAnalysis = createAsyncThunk('rejectionOrder/getRejectionOrderAnalysis', rejectionOrderService.getRejectionOrderAnalysis);

const createRejectionOrder = createAsyncThunk('rejectionOrder/createRejectionOrder', async (data, { rejectWithValue }) => {
  try {
    return await rejectionOrderService.createRejectionOrder(data);
  } catch (error) {
    return rejectWithValue(error?.response?.data || error || 'Something went wrong');
  }
});

const saveRejectionWorkflow = createAsyncThunk('rejectionOrder/saveRejectionWorkflow', async ({ rejectionOrderId, data }, { rejectWithValue }) => {
  try {
    return await rejectionOrderService.saveRejectionWorkflow(rejectionOrderId, data);
  } catch (error) {
    return rejectWithValue(error?.response?.data || error || 'Something went wrong');
  }
});

const updateRejectionBooking = createAsyncThunk('rejectionOrder/updateRejectionBooking', async ({ rejectionOrderId, data }, { rejectWithValue }) => {
  try {
    return await rejectionOrderService.updateRejectionBooking(rejectionOrderId, data);
  } catch (error) {
    return rejectWithValue(error?.response?.data || error || 'Something went wrong');
  }
});

const getRejectionOrderById = createAsyncThunk('rejectionOrder/getRejectionOrderById', rejectionOrderService.getRejectionOrderById);

const getRejectionRecoveryBom = createAsyncThunk('rejectionOrder/getRejectionRecoveryBom', rejectionOrderService.getRejectionRecoveryBom);

const getInvoiceDropdown = createAsyncThunk('rejectionOrder/getInvoiceDropdown', rejectionOrderService.getInvoiceDropdown);

const removeRejectionOrder = createAsyncThunk('rejectionOrder/removeRejectionOrder', rejectionOrderService.removeRejectionOrder);

const initialPagination = {
  page: 1,
  limit: DEFAULT_PAGE_SIZE,
  totalPages: 1,
  totalResults: 0,
  statusWiseRejectionOrderCount: Object.values(REJECTION_STATUS).reduce((counts, status) => {
    counts[status.key] = 0;
    return counts;
  }, {}),
};

export const rejectionOrderSlice = createSlice({
  name: 'rejectionOrder',
  initialState: {
    rejectionOrders: [],
    rejectionOrder: null,
    pagination: initialPagination,
    latestListRequestId: null,
    create: null,
    update: null,
    remove: null,
    loading: false,
    submitLoading: false,
    deleteLoading: false,
    inventoryLoading: false,
    analysisLoading: false,
    invoiceDropLoading: false,
    inventoryData: null,
    inventoryExtras: null,
    analysisData: null,
    error: null,
  },
  reducers: {
    resetRejectionOrder: state => {
      state.rejectionOrder = null;
      state.create = null;
    },
    resetRejectionOrders: state => {
      state.rejectionOrders = [];
      state.pagination = { ...initialPagination };
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getRejectionOrders.pending, (state, action) => {
        state.latestListRequestId = action.meta.requestId;
        state.loading = true;
      })
      .addCase(getRejectionOrders.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.latestListRequestId) return;
        state.loading = false;
        state.rejectionOrders = action.payload.data;
        state.pagination = {
          page: action.payload.extras?.page,
          limit: action.payload.extras?.limit,
          totalPages: action.payload.extras?.totalPages,
          totalResults: action.payload.extras?.totalResults,
          statusWiseRejectionOrderCount: action.payload.extras?.statusWiseRejectionOrderCount,
        };
      })
      .addCase(getRejectionOrders.rejected, (state, action) => {
        if (action.meta.requestId !== state.latestListRequestId) return;
        state.loading = false;
        if (isCanceledRequestError(action.error)) return;
        state.rejectionOrders = [];
        state.error = action.error.message;
      })
      .addCase(createRejectionOrder.pending, state => {
        state.submitLoading = true;
      })
      .addCase(createRejectionOrder.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.create = action.payload;
        Toast.success(action.payload.message);
      })
      .addCase(createRejectionOrder.rejected, (state, action) => {
        state.submitLoading = false;
        state.error = action.payload;
        Toast.error(action?.payload?.message || 'Something went wrong');
      })
      .addCase(saveRejectionWorkflow.pending, state => {
        state.submitLoading = true;
      })
      .addCase(saveRejectionWorkflow.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.update = action.payload;
        state.rejectionOrder = action.payload.data;
        Toast.success(action.payload.message);
      })
      .addCase(saveRejectionWorkflow.rejected, (state, action) => {
        state.submitLoading = false;
        state.error = action.payload;
        Toast.error(action?.payload?.message || 'Something went wrong');
      })
      .addCase(updateRejectionBooking.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updateRejectionBooking.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.update = action.payload;
        Toast.success(action.payload.message);
      })
      .addCase(updateRejectionBooking.rejected, (state, action) => {
        state.submitLoading = false;
        state.error = action.payload;
        Toast.error(action?.payload?.message || 'Something went wrong');
      })
      .addCase(getRejectionOrderById.pending, state => {
        state.loading = true;
        state.rejectionOrder = null;
      })
      .addCase(getRejectionOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.rejectionOrder = action.payload.data;
      })
      .addCase(getRejectionOrderById.rejected, (state, action) => {
        state.loading = false;
        state.rejectionOrder = null;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED') {
          state.error = action.error.message;
        }
      })
      .addCase(removeRejectionOrder.pending, state => {
        state.deleteLoading = true;
      })
      .addCase(removeRejectionOrder.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.remove = action.payload.data;
        Toast.success(action.payload.message);
      })
      .addCase(removeRejectionOrder.rejected, (state, action) => {
        state.deleteLoading = false;
        Toast.error(action?.error?.message || 'Something went wrong');
      })
      .addCase(getRejectionOrderInventory.pending, state => {
        state.inventoryLoading = true;
      })
      .addCase(getRejectionOrderInventory.fulfilled, (state, action) => {
        state.inventoryLoading = false;
        state.inventoryData = action.payload.data;
        state.inventoryExtras = action.payload.extras || null;
      })
      .addCase(getRejectionOrderInventory.rejected, state => {
        state.inventoryLoading = false;
        state.inventoryData = null;
        state.inventoryExtras = null;
      })
      .addCase(getRejectionOrderAnalysis.pending, state => {
        state.analysisLoading = true;
      })
      .addCase(getRejectionOrderAnalysis.fulfilled, (state, action) => {
        state.analysisLoading = false;
        state.analysisData = action.payload.data;
      })
      .addCase(getRejectionOrderAnalysis.rejected, state => {
        state.analysisLoading = false;
        state.analysisData = null;
      })
      .addCase(getInvoiceDropdown.pending, state => {
        state.invoiceDropLoading = true;
      })
      .addCase(getInvoiceDropdown.fulfilled, state => {
        state.invoiceDropLoading = false;
      })
      .addCase(getInvoiceDropdown.rejected, state => {
        state.invoiceDropLoading = false;
      });
  },
});

export const rejectionOrderSliceMethods = {
  getRejectionOrders,
  createRejectionOrder,
  saveRejectionWorkflow,
  updateRejectionBooking,
  getRejectionOrderById,
  removeRejectionOrder,
  getRejectionOrderInventory,
  getRejectionOrderAnalysis,
  getRejectionRecoveryBom,
  getInvoiceDropdown,
};
export const { resetRejectionOrder, resetRejectionOrders } = rejectionOrderSlice.actions;
export default rejectionOrderSlice.reducer;
