import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { recurringExpenseService } from './recurringExpense.service';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getRecurringExpenses = createAsyncThunk('recurringExpense/getRecurringExpenses', recurringExpenseService.getRecurringExpenses);

const createRecurringExpenses = createAsyncThunk('recurringExpense/createRecurringExpenses', recurringExpenseService.createRecurringExpenses);

const updateRecurringExpenses = createAsyncThunk('recurringExpense/updateRecurringExpenses', recurringExpenseService.updateRecurringExpenses);

const getRecurringExpenseCustomerProject = createAsyncThunk('recurringExpense/getRecurringExpenseCustomerProject', recurringExpenseService.getRecurringExpenseCustomerProject);

const getRecurringExpenseById = createAsyncThunk('recurringExpense/getRecurringExpenseById', recurringExpenseService.getRecurringExpenseById);

const updateStatus = createAsyncThunk('recurringExpense/updateStatus', recurringExpenseService.updateStatus);

const removeRecurringExpense = createAsyncThunk('recurringExpense/removeRecurringExpense', recurringExpenseService.removeRecurringExpense);

const createExpenseFromRecurring = createAsyncThunk('recurringExpense/createExpenseFromRecurring', recurringExpenseService.createExpenseFromRecurring);

export const recurringExpenseSlice = createSlice({
  name: 'recurringExpense',
  initialState: {
    recurringExpenses: [],
    recurringExpense: null,
    pagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
    },
    recurringExpenseCustomerProjectDrop: null,
    create: null,
    update: null,
    loading: false,
    submitLoading: false,
    deleteLoading: false,
    createExpenseLoading: false,
    droploading: false,
    error: null,
  },
  reducers: {
    resetRecurringExpense: state => {
      state.recurringExpense = null;
    },
    resetRecurringExpenses: state => {
      state.recurringExpenses = [];
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
      .addCase(getRecurringExpenses.pending, state => {
        state.loading = true;
      })
      .addCase(getRecurringExpenses.fulfilled, (state, action) => {
        state.loading = false;
        state.recurringExpenses = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalResults: action.payload.extras.totalResults,
        };
        state.message = action.payload.message;
      })
      .addCase(getRecurringExpenses.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.recurringExpenses = [];
          state.error = action.error.message;
        }
      })
      .addCase(createRecurringExpenses.pending, state => {
        state.submitLoading = true;
      })
      .addCase(createRecurringExpenses.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.create = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createRecurringExpenses.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updateRecurringExpenses.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updateRecurringExpenses.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.update = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(updateRecurringExpenses.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getRecurringExpenseCustomerProject.pending, state => {
        state.droploading = true;
      })
      .addCase(getRecurringExpenseCustomerProject.fulfilled, (state, action) => {
        state.droploading = false;
        state.recurringExpenseCustomerProjectDrop = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getRecurringExpenseCustomerProject.rejected, (state, action) => {
        state.droploading = false;
        state.error = action.error.message;
      })
      .addCase(getRecurringExpenseById.pending, state => {
        state.loading = true;
      })
      .addCase(getRecurringExpenseById.fulfilled, (state, action) => {
        state.loading = false;
        state.recurringExpense = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getRecurringExpenseById.rejected, (state, action) => {
        state.loading = false;
        state.recurringExpense = null;
        state.error = action.error.message;
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
      .addCase(removeRecurringExpense.pending, state => {
        state.deleteLoading = true;
      })
      .addCase(removeRecurringExpense.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(removeRecurringExpense.rejected, (state, action) => {
        state.deleteLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(createExpenseFromRecurring.pending, state => {
        state.createExpenseLoading = true;
      })
      .addCase(createExpenseFromRecurring.fulfilled, (state, action) => {
        state.createExpenseLoading = false;
        state.createExpense = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createExpenseFromRecurring.rejected, (state, action) => {
        state.createExpenseLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      });
  },
});
export const recurringExpenseSliceMethods = {
  getRecurringExpenses,
  createRecurringExpenses,
  updateRecurringExpenses,
  getRecurringExpenseCustomerProject,
  getRecurringExpenseById,
  updateStatus,
  removeRecurringExpense,
  createExpenseFromRecurring,
};
export const { resetRecurringExpense, resetRecurringExpenses } = recurringExpenseSlice.actions;
export default recurringExpenseSlice.reducer;
