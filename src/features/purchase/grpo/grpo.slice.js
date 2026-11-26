import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { grpoService } from './grpo.service';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getgrpos = createAsyncThunk('grpoOrder/getgrpos', grpoService.getgrpos);

const createGrpos = createAsyncThunk('grpoOrder/createGrpo', async (purchaseOrderData, { rejectWithValue }) => {
  try {
    const data = await grpoService.createGrpos(purchaseOrderData);
    return data;
  } catch (error) {
    console.error('Error in create grpo thunk:', error);
    return rejectWithValue(error?.response?.data || error || 'Something went wrong');
  }
});

const updateGrpos = createAsyncThunk('grpoOrder/updateGrpo', async ({ grpoId, grpoData }, { rejectWithValue }) => {
  try {
    const data = await grpoService.updateGrpos(grpoId, grpoData);
    return data;
  } catch (error) {
    console.error('Error in update grpo thunk:', error);
    return rejectWithValue(error?.response?.data || error || 'Something went wrong');
  }
});

const updateStatus = createAsyncThunk('grpoOrder/updateStatus', grpoService.updateStatus);

const getGrpoById = createAsyncThunk('grpoOrder/getGrpoById', grpoService.getGrpoById);

const removeGrpo = createAsyncThunk('grpoOrder/removeGrpo', grpoService.removeGrpo);

const getGrpoDropdownForConvert = createAsyncThunk('grpoOrder/getGrpoDropdownForConvert', grpoService.getGrpoDropdownForConvert);

const getPendingItemsGrpo = createAsyncThunk('grpoOrder/getPendingItemsGrpo', grpoService.getPendingItemsGrpo);

const getGrpoExports = createAsyncThunk('grpoOrder/getGrpoExports', grpoService.getGrpoExports);

export const grpoSlice = createSlice({
  name: 'grpo',
  initialState: {
    grpoOrders: [],
    grpoOrder: null,
    pagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
    },
    grpoDropForConvert: [],
    pendingItems: null,
    pendingItemLoading: false,
    create: null,
    update: null,
    remove: null,
    loading: false,
    submitLoading: false,
    deleteLoading: false,
    droploading: false,
    exportLoading: false,
    grpoExports: [],
    error: null,
  },
  reducers: {
    resetGrpo: state => {
      state.grpoOrder = null;
    },
    resetGrpos: state => {
      state.grpoOrders = [];
      state.pagination = {
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        totalPages: 1,
        totalResults: 0,
      };
    },
    resetGrpoDropForConvert: state => {
      state.grpoDropForConvert = [];
    },
    resetPendingItems: state => {
      state.pendingItems = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getgrpos.pending, state => {
        state.loading = true;
      })
      .addCase(getgrpos.fulfilled, (state, action) => {
        state.loading = false;
        state.grpoOrders = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalResults: action.payload.extras.totalResults,
          totalAmount: action.payload.extras.totalAmount,
        };
        state.message = action.payload.message;
      })
      .addCase(getgrpos.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.grpoOrders = [];
          state.error = action.error.message;
        }
      })
      .addCase(createGrpos.pending, state => {
        state.submitLoading = true;
      })
      .addCase(createGrpos.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.create = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createGrpos.rejected, (state, action) => {
        state.submitLoading = false;
        state.error = action.payload;
        if (!action?.payload?.data?.isCreditLimitError) {
          Toast.error(action?.payload?.message || 'Something went wrong');
        }
      })
      .addCase(updateGrpos.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updateGrpos.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.update = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(updateGrpos.rejected, (state, action) => {
        state.submitLoading = false;
        state.error = action.payload;
        if (!action?.payload?.data?.isCreditLimitError) {
          Toast.error(action?.payload?.message || 'Something went wrong');
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
      .addCase(getGrpoById.pending, state => {
        state.loading = true;
      })
      .addCase(getGrpoById.fulfilled, (state, action) => {
        state.loading = false;
        state.grpoOrder = action.payload.data;
      })
      .addCase(getGrpoById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(removeGrpo.pending, state => {
        state.deleteLoading = true;
      })
      .addCase(removeGrpo.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.remove = action.payload.data;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(removeGrpo.rejected, (state, action) => {
        state.deleteLoading = false;
        state.remove = null;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getGrpoDropdownForConvert.pending, state => {
        state.droploading = true;
      })
      .addCase(getGrpoDropdownForConvert.fulfilled, (state, action) => {
        state.droploading = false;
        state.grpoDropForConvert = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getGrpoDropdownForConvert.rejected, (state, action) => {
        state.droploading = false;
        state.error = action.error.message;
      })
      .addCase(getPendingItemsGrpo.pending, state => {
        state.pendingItemLoading = true;
      })
      .addCase(getPendingItemsGrpo.fulfilled, (state, action) => {
        state.pendingItemLoading = false;
        state.pendingItems = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getPendingItemsGrpo.rejected, (state, action) => {
        state.pendingItemLoading = false;
        state.pendingItems = null;
        state.error = action.error.message;
      })
      .addCase(getGrpoExports.pending, state => {
        state.exportLoading = true;
      })
      .addCase(getGrpoExports.fulfilled, (state, action) => {
        state.exportLoading = false;
        state.grpoExports = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getGrpoExports.rejected, (state, action) => {
        state.exportLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
        }
      });
  },
});
export const grpoSliceMethods = {
  getgrpos,
  createGrpos,
  updateGrpos,
  updateStatus,
  getGrpoById,
  removeGrpo,
  getGrpoDropdownForConvert,
  getPendingItemsGrpo,
  getGrpoExports,
};
export const { resetGrpo, resetGrpos, resetGrpoDropForConvert, resetPendingItems } = grpoSlice.actions;
export default grpoSlice.reducer;
