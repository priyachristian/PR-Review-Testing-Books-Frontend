import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { inventoryAdjustmentService } from './inventoryAdjustment.service';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getInventoryAdjustment = createAsyncThunk('inventoryAdjustment/getInventoryAdjustment', inventoryAdjustmentService.getInventoryAdjustment);

const createInventoryAdjustment = createAsyncThunk('inventoryAdjustment/createInventoryAdjustment', inventoryAdjustmentService.createInventoryAdjustment);

const updateInventoryAdjustment = createAsyncThunk('inventoryAdjustment/updateInventoryAdjustment', inventoryAdjustmentService.updateInventoryAdjustment);

const approveInventoryAdjustment = createAsyncThunk('inventoryAdjustment/approveInventoryAdjustment', inventoryAdjustmentService.approveInventoryAdjustment);

const rejectInventoryAdjustment = createAsyncThunk('inventoryAdjustment/rejectInventoryAdjustment', inventoryAdjustmentService.rejectInventoryAdjustment);

const getInventoryAdjustmentById = createAsyncThunk('inventoryAdjustment/getInventoryAdjustmentById', inventoryAdjustmentService.getInventoryAdjustmentById);

const inventoryAdjustmentSlice = createSlice({
  name: 'inventoryAdjustment',
  initialState: {
    inventoryAdjustment: [],
    inventoryAdjustmentById: null,
    pagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
    },
    create: null,
    update: null,
    approve: null,
    reject: null,
    loading: false,
    submitLoading: false,
    approveLoading: false,
    rejectLoading: false,
    error: null,
  },
  reducers: {
    resetInventoryAdjustment: state => {
      state.inventoryAdjustment = [];
      state.pagination = {
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        totalPages: 1,
        totalResults: 0,
      };
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder.addCase(getInventoryAdjustment.pending, state => {
      state.loading = true;
      state.inventoryAdjustmentById = null;
    });
    builder.addCase(getInventoryAdjustment.fulfilled, (state, action) => {
      state.loading = false;
      state.inventoryAdjustment = action.payload.data;
      state.pagination = {
        page: action.payload.extras.page,
        limit: action.payload.extras.limit,
        totalPages: action.payload.extras.totalPages,
        totalResults: action.payload.extras.totalResults,
      };
    });
    builder
      .addCase(getInventoryAdjustment.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.error = action.error.message;
        }
      })
      .addCase(createInventoryAdjustment.pending, state => {
        state.submitLoading = true;
      })
      .addCase(createInventoryAdjustment.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.create = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createInventoryAdjustment.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.submitLoading = false;
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updateInventoryAdjustment.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updateInventoryAdjustment.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.update = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(updateInventoryAdjustment.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(approveInventoryAdjustment.pending, state => {
        state.approveLoading = true;
      })
      .addCase(approveInventoryAdjustment.fulfilled, (state, action) => {
        state.approveLoading = false;
        state.approve = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(approveInventoryAdjustment.rejected, (state, action) => {
        state.approveLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(rejectInventoryAdjustment.pending, state => {
        state.rejectLoading = true;
      })
      .addCase(rejectInventoryAdjustment.fulfilled, (state, action) => {
        state.rejectLoading = false;
        state.reject = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(rejectInventoryAdjustment.rejected, (state, action) => {
        state.rejectLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getInventoryAdjustmentById.pending, state => {
        state.loading = true;
        state.inventoryAdjustmentById = null;
      })
      .addCase(getInventoryAdjustmentById.fulfilled, (state, action) => {
        state.loading = false;
        state.inventoryAdjustmentById = action.payload.data;
      })
      .addCase(getInventoryAdjustmentById.rejected, (state, action) => {
        state.loading = false;
        state.inventoryAdjustmentById = null;
        state.error = action.error.message;
      });
  },
});

export const { resetInventoryAdjustment } = inventoryAdjustmentSlice.actions;
export default inventoryAdjustmentSlice.reducer;
export const inventoryAdjustmentSliceMethods = {
  getInventoryAdjustment,
  createInventoryAdjustment,
  updateInventoryAdjustment,
  approveInventoryAdjustment,
  rejectInventoryAdjustment,
  getInventoryAdjustmentById,
};
