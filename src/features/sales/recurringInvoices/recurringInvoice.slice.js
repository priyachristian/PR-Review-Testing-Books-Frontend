import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { recurringInvoiceService } from './recurringInvoice.service';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getRecurringInvoices = createAsyncThunk('recurringInvoice/getRecurringInvoices', recurringInvoiceService.getRecurringInvoices);

const createRecurringInvoices = createAsyncThunk('recurringInvoice/createRecurringInvoices', recurringInvoiceService.createRecurringInvoices);

const updateRecurringInvoices = createAsyncThunk('recurringInvoice/updateRecurringInvoices', recurringInvoiceService.updateRecurringInvoices);

const updateStatus = createAsyncThunk('recurringInvoice/updateStatus', recurringInvoiceService.updateStatus);

const getRecurringInvoicesById = createAsyncThunk('recurringInvoice/getRecurringInvoicesById', recurringInvoiceService.getRecurringInvoicesById);

const createInvoiceFromRecurring = createAsyncThunk('recurringInvoice/createInvoiceFromRecurring', recurringInvoiceService.createInvoiceFromRecurring);

const removeRecurringInvoice = createAsyncThunk('recurringInvoice/removeRecurringInvoice', recurringInvoiceService.removeRecurringInvoice);

export const recurringInvoiceSlice = createSlice({
  name: 'recurringInvoice',
  initialState: {
    recurringInvoices: [],
    recurringInvoice: null,
    pagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
    },
    recurringPersonDrop: null,
    create: null,
    update: null,
    loading: false,
    createInvoice: null,
    submitLoading: false,
    deleteLoading: false,
    createInvoiceLoading: false,
    droploading: false,
    error: null,
  },
  reducers: {
    resetRecurringInvoice: state => {
      state.recurringInvoice = null;
    },
    resetRecurringInvoices: state => {
      state.recurringInvoices = [];
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
      .addCase(getRecurringInvoices.pending, state => {
        state.loading = true;
      })
      .addCase(getRecurringInvoices.fulfilled, (state, action) => {
        state.loading = false;
        state.recurringInvoices = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalResults: action.payload.extras.totalResults,
        };
        state.message = action.payload.message;
      })
      .addCase(getRecurringInvoices.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.recurringInvoices = [];
          state.error = action.error.message;
        }
      })
      .addCase(createRecurringInvoices.pending, state => {
        state.submitLoading = true;
      })
      .addCase(createRecurringInvoices.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.create = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createRecurringInvoices.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updateRecurringInvoices.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updateRecurringInvoices.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.update = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(updateRecurringInvoices.rejected, (state, action) => {
        state.submitLoading = false;
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
      .addCase(getRecurringInvoicesById.pending, state => {
        state.loading = true;
      })
      .addCase(getRecurringInvoicesById.fulfilled, (state, action) => {
        state.loading = false;
        state.recurringInvoice = action.payload?.data;
        state.message = action.payload.message;
      })
      .addCase(getRecurringInvoicesById.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.error = action.error.message;
        }
      })
      .addCase(createInvoiceFromRecurring.pending, state => {
        state.createInvoiceLoading = true;
      })
      .addCase(createInvoiceFromRecurring.fulfilled, (state, action) => {
        state.createInvoiceLoading = false;
        state.createInvoice = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createInvoiceFromRecurring.rejected, (state, action) => {
        state.createInvoiceLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(removeRecurringInvoice.pending, state => {
        state.deleteLoading = true;
      })
      .addCase(removeRecurringInvoice.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(removeRecurringInvoice.rejected, (state, action) => {
        state.deleteLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      });
  },
});

export const recurringInvoiceSliceMethods = {
  getRecurringInvoices,
  createRecurringInvoices,
  updateRecurringInvoices,
  updateStatus,
  getRecurringInvoicesById,
  createInvoiceFromRecurring,
  removeRecurringInvoice,
};

export const { resetRecurringInvoice, resetRecurringInvoices } = recurringInvoiceSlice.actions;
export default recurringInvoiceSlice.reducer;
