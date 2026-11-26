import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { recurringBillsService } from './recurringBill.service';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getRecurringBills = createAsyncThunk('recurringBills/getRecurringBills', recurringBillsService.getRecurringBills);

const createRecurringBills = createAsyncThunk('recurringBills/createRecurringBills', recurringBillsService.createRecurringBills);

const updateRecurringBills = createAsyncThunk('recurringBills/updateRecurringBills', recurringBillsService.updateRecurringBills);

const updateStatus = createAsyncThunk('recurringBills/updateStatus', recurringBillsService.updateStatus);

const getRecurringBillById = createAsyncThunk('recurringBills/getRecurringBillById', recurringBillsService.getRecurringBillById);

const createBillFromRecurring = createAsyncThunk('recurringBills/createBillFromRecurring', recurringBillsService.createBillFromRecurring);

const removeRecurringBill = createAsyncThunk('recurringBills/removeRecurringBill', recurringBillsService.removeRecurringBill);

export const recurringBillsSlice = createSlice({
  name: 'recurringBills',
  initialState: {
    recurringBills: [],
    recurringBill: null,
    pagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
    },
    nextRecurringBillId: null,
    create: null,
    update: null,
    loading: false,
    submitLoading: false,
    deleteLoading: false,
    createBill: null,
    createBillLoading: false,
    uploading: false,
    droploading: false,
    error: null,
  },
  reducers: {
    resetRecurringBill: state => {
      state.recurringBill = null;
    },
    resetRecurringBills: state => {
      state.recurringBills = [];
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
      .addCase(getRecurringBills.pending, state => {
        state.loading = true;
      })
      .addCase(getRecurringBills.fulfilled, (state, action) => {
        state.loading = false;
        state.recurringBills = action.payload.data;
        state.nextRecurringBillId = action.payload.extras.nextRecurringBillId;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalResults: action.payload.extras.totalResults,
        };
        state.message = action.payload.message;
      })
      .addCase(getRecurringBills.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.recurringBills = [];
          state.error = action.error.message;
        }
      })
      .addCase(createRecurringBills.pending, state => {
        state.submitLoading = true;
      })
      .addCase(createRecurringBills.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.create = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createRecurringBills.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updateRecurringBills.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updateRecurringBills.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.update = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(updateRecurringBills.rejected, (state, action) => {
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
      .addCase(getRecurringBillById.pending, state => {
        state.loading = true;
      })
      .addCase(getRecurringBillById.fulfilled, (state, action) => {
        state.loading = false;
        state.recurringBill = action.payload?.data;
        state.message = action.payload.message;
      })
      .addCase(getRecurringBillById.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.error = action.error.message;
        }
      })
      .addCase(createBillFromRecurring.pending, state => {
        state.createBillLoading = true;
      })
      .addCase(createBillFromRecurring.fulfilled, (state, action) => {
        state.createBillLoading = false;
        state.createBill = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createBillFromRecurring.rejected, (state, action) => {
        state.createBillLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(removeRecurringBill.pending, state => {
        state.deleteLoading = true;
      })
      .addCase(removeRecurringBill.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(removeRecurringBill.rejected, (state, action) => {
        state.deleteLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      });
  },
});
export const recurringBillsSliceMethods = {
  getRecurringBills,
  createRecurringBills,
  updateRecurringBills,
  updateStatus,
  getRecurringBillById,
  createBillFromRecurring,
  removeRecurringBill,
};
export const { resetRecurringBill, resetRecurringBills } = recurringBillsSlice.actions;
export default recurringBillsSlice.reducer;
