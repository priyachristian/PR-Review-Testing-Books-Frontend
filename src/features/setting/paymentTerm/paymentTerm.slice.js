import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { paymentTermService } from './paymentTerm.service';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getPaymentTerms = createAsyncThunk('paymentTerm/getPaymentTerms', paymentTermService.getPaymentTerms);
const getPaymentTermsDrop = createAsyncThunk('paymentTerm/getPaymentTermsDrop', paymentTermService.getPaymentTermsDrop);

const createPaymentTerm = createAsyncThunk('paymentTerm/createPaymentTerm', async (data, { rejectWithValue }) => {
  try {
    return await paymentTermService.createPaymentTerm(data);
  } catch (error) {
    return rejectWithValue(error?.response?.data || error || 'Something went wrong');
  }
});

const updatePaymentTerm = createAsyncThunk('paymentTerm/updatePaymentTerm', async ({ id, data }, { rejectWithValue }) => {
  try {
    return await paymentTermService.updatePaymentTerm(id, data);
  } catch (error) {
    return rejectWithValue(error?.response?.data || error || 'Something went wrong');
  }
});

const updatePaymentTermStatus = createAsyncThunk('paymentTerm/updatePaymentTermStatus', paymentTermService.updatePaymentTermStatus);

const setDefaultPaymentTerm = createAsyncThunk('paymentTerm/setDefaultPaymentTerm', paymentTermService.setDefaultPaymentTerm);

const getPaymentTermById = createAsyncThunk('paymentTerm/getPaymentTermById', paymentTermService.getPaymentTermById);

const removePaymentTerm = createAsyncThunk('paymentTerm/removePaymentTerm', paymentTermService.removePaymentTerm);

export const paymentTermSlice = createSlice({
  name: 'paymentTerm',
  initialState: {
    paymentTerms: [],
    paymentTerm: null,
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
    paymentTermsDrop: [],
    submitLoading: false,
    error: null,
  },
  reducers: {
    resetPaymentTerm: state => {
      state.paymentTerm = null;
    },
    resetPaymentTermsDrop: state => {
      state.paymentTermsDrop = [];
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getPaymentTerms.pending, state => {
        state.loading = true;
      })
      .addCase(getPaymentTerms.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentTerms = action.payload.data;
        state.pagination = {
          page: action.payload.extras?.page,
          limit: action.payload.extras?.limit,
          totalPages: action.payload.extras?.totalPages,
          totalResults: action.payload.extras?.totalResults,
        };
      })
      .addCase(getPaymentTerms.rejected, (state, action) => {
        state.loading = false;
        state.paymentTerms = [];
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED') {
          state.error = action.error.message;
        }
      })
      .addCase(getPaymentTermsDrop.pending, state => {
        state.dropLoading = true;
      })
      .addCase(getPaymentTermsDrop.fulfilled, (state, action) => {
        state.dropLoading = false;
        state.paymentTermsDrop = action.payload.data || [];
      })
      .addCase(getPaymentTermsDrop.rejected, (state, action) => {
        state.dropLoading = false;
        state.paymentTermsDrop = [];
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED') {
          state.error = action.error.message;
        }
      })
      .addCase(createPaymentTerm.pending, state => {
        state.submitLoading = true;
      })
      .addCase(createPaymentTerm.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.create = action.payload;
        Toast.success(action.payload.message);
      })
      .addCase(createPaymentTerm.rejected, (state, action) => {
        state.submitLoading = false;
        state.error = action.payload;
        Toast.error(action?.payload?.message || 'Something went wrong');
      })
      .addCase(updatePaymentTerm.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updatePaymentTerm.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.update = action.payload;
        Toast.success(action.payload.message);
      })
      .addCase(updatePaymentTerm.rejected, (state, action) => {
        state.submitLoading = false;
        state.error = action.payload;
        Toast.error(action?.payload?.message || 'Something went wrong');
      })
      .addCase(updatePaymentTermStatus.fulfilled, (state, action) => {
        state.update = action.payload;
        Toast.success(action.payload.message);
      })
      .addCase(updatePaymentTermStatus.rejected, (state, action) => {
        Toast.error(action?.error?.message || 'Something went wrong');
      })
      .addCase(setDefaultPaymentTerm.fulfilled, (state, action) => {
        state.update = action.payload;
        Toast.success(action.payload.message);
      })
      .addCase(setDefaultPaymentTerm.rejected, (state, action) => {
        Toast.error(action?.error?.message || 'Something went wrong');
      })
      .addCase(getPaymentTermById.pending, state => {
        state.loading = true;
      })
      .addCase(getPaymentTermById.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentTerm = action.payload.data;
      })
      .addCase(getPaymentTermById.rejected, (state, action) => {
        state.loading = false;
        state.paymentTerm = null;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED') {
          state.error = action.error.message;
        }
      })
      .addCase(removePaymentTerm.fulfilled, (state, action) => {
        state.remove = action.payload.data;
        Toast.success(action.payload.message);
      })
      .addCase(removePaymentTerm.rejected, (state, action) => {
        Toast.error(action?.error?.message || 'Something went wrong');
      });
  },
});

export const paymentTermSliceMethods = {
  getPaymentTerms,
  getPaymentTermsDrop,
  createPaymentTerm,
  updatePaymentTerm,
  updatePaymentTermStatus,
  setDefaultPaymentTerm,
  getPaymentTermById,
  removePaymentTerm,
};
export const { resetPaymentTerm, resetPaymentTermsDrop } = paymentTermSlice.actions;
export default paymentTermSlice.reducer;
