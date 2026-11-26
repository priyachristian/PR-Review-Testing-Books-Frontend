import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { rejectionReasonService } from './rejectionReason.service';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getRejectionReasons = createAsyncThunk('rejectionReason/getRejectionReasons', rejectionReasonService.getRejectionReasons);
const getRejectionReasonsDrop = createAsyncThunk('rejectionReason/getRejectionReasonsDrop', rejectionReasonService.getRejectionReasonsDrop);

const createRejectionReason = createAsyncThunk('rejectionReason/createRejectionReason', async (data, { rejectWithValue }) => {
  try {
    return await rejectionReasonService.createRejectionReason(data);
  } catch (error) {
    return rejectWithValue(error?.response?.data || error || 'Something went wrong');
  }
});

const updateRejectionReason = createAsyncThunk('rejectionReason/updateRejectionReason', async ({ id, data }, { rejectWithValue }) => {
  try {
    return await rejectionReasonService.updateRejectionReason(id, data);
  } catch (error) {
    return rejectWithValue(error?.response?.data || error || 'Something went wrong');
  }
});

const getRejectionReasonById = createAsyncThunk('rejectionReason/getRejectionReasonById', rejectionReasonService.getRejectionReasonById);

const removeRejectionReason = createAsyncThunk('rejectionReason/removeRejectionReason', rejectionReasonService.removeRejectionReason);

export const rejectionReasonSlice = createSlice({
  name: 'rejectionReason',
  initialState: {
    rejectionReasons: [],
    rejectionReason: null,
    pagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
    },
    create: null,
    update: null,
    remove: null,
    loading: false,
    dropLoading: false,
    rejectionReasonsDrop: [],
    submitLoading: false,
    error: null,
  },
  reducers: {
    resetRejectionReason: state => {
      state.rejectionReason = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getRejectionReasons.pending, state => {
        state.loading = true;
      })
      .addCase(getRejectionReasons.fulfilled, (state, action) => {
        state.loading = false;
        state.rejectionReasons = action.payload.data;
        state.pagination = {
          page: action.payload.extras?.page,
          limit: action.payload.extras?.limit,
          totalPages: action.payload.extras?.totalPages,
          totalResults: action.payload.extras?.totalResults,
        };
      })
      .addCase(getRejectionReasons.rejected, (state, action) => {
        state.loading = false;
        state.rejectionReasons = [];
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED') {
          state.error = action.error.message;
        }
      })
      .addCase(getRejectionReasonsDrop.pending, state => {
        state.dropLoading = true;
      })
      .addCase(getRejectionReasonsDrop.fulfilled, (state, action) => {
        state.dropLoading = false;
        state.rejectionReasonsDrop = action.payload.data || [];
      })
      .addCase(getRejectionReasonsDrop.rejected, (state, action) => {
        state.dropLoading = false;
        state.rejectionReasonsDrop = [];
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED') {
          state.error = action.error.message;
        }
      })
      .addCase(createRejectionReason.pending, state => {
        state.submitLoading = true;
      })
      .addCase(createRejectionReason.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.create = action.payload;
        Toast.success(action.payload.message);
      })
      .addCase(createRejectionReason.rejected, (state, action) => {
        state.submitLoading = false;
        state.error = action.payload;
        Toast.error(action?.payload?.message || 'Something went wrong');
      })
      .addCase(updateRejectionReason.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updateRejectionReason.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.update = action.payload;
        Toast.success(action.payload.message);
      })
      .addCase(updateRejectionReason.rejected, (state, action) => {
        state.submitLoading = false;
        state.error = action.payload;
        Toast.error(action?.payload?.message || 'Something went wrong');
      })
      .addCase(getRejectionReasonById.pending, state => {
        state.loading = true;
      })
      .addCase(getRejectionReasonById.fulfilled, (state, action) => {
        state.loading = false;
        state.rejectionReason = action.payload.data;
      })
      .addCase(getRejectionReasonById.rejected, (state, action) => {
        state.loading = false;
        state.rejectionReason = null;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED') {
          state.error = action.error.message;
        }
      })
      .addCase(removeRejectionReason.fulfilled, (state, action) => {
        state.remove = action.payload.data;
        Toast.success(action.payload.message);
      })
      .addCase(removeRejectionReason.rejected, (state, action) => {
        Toast.error(action?.error?.message || 'Something went wrong');
      });
  },
});

export const rejectionReasonSliceMethods = {
  getRejectionReasons,
  getRejectionReasonsDrop,
  createRejectionReason,
  updateRejectionReason,
  getRejectionReasonById,
  removeRejectionReason,
};
export const { resetRejectionReason } = rejectionReasonSlice.actions;
export default rejectionReasonSlice.reducer;
