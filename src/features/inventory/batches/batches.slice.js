import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { batchesService } from './batches.service';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getItemBatches = createAsyncThunk('batches/getItemBatches', batchesService.getItemBatches);

const getItemBatchById = createAsyncThunk('batches/getItemBatchById', batchesService.getItemBatchById);

const batchesSlice = createSlice({
  name: 'batches',
  initialState: {
    batches: [],
    batchById: null,
    pagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
    },
    loading: false,
    batchLoading: false,
    error: null,
  },
  reducers: {
    resetBatches: state => {
      state.batches = [];
      state.pagination = {
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        totalPages: 1,
        totalResults: 0,
      };
      state.loading = false;
      state.error = null;
    },
    resetBatchById: state => {
      state.batchById = null;
      state.batchLoading = false;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getItemBatches.pending, state => {
        state.loading = true;
      })
      .addCase(getItemBatches.fulfilled, (state, action) => {
        state.loading = false;
        state.batches = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalResults: action.payload.extras.totalResults,
        };
      })
      .addCase(getItemBatches.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getItemBatchById.pending, state => {
        state.batchLoading = true;
      })
      .addCase(getItemBatchById.fulfilled, (state, action) => {
        state.batchLoading = false;
        state.batchById = action.payload?.data ?? action.payload;
        state.error = null;
      })
      .addCase(getItemBatchById.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.batchLoading = false;
          state.batchById = null;
          state.error = action.error.message;
          Toast.error(state.error);
        }
      });
  },
});

export const { resetBatches, resetBatchById } = batchesSlice.actions;
export default batchesSlice.reducer;

export const batchesSliceMethods = {
  getItemBatches,
  getItemBatchById,
};
