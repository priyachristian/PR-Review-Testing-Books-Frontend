import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { expensesService } from './expense.service';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getExpenses = createAsyncThunk('expense/getExpenses', expensesService.getExpenses);

const createExpenses = createAsyncThunk('expense/createExpenses', expensesService.createExpenses);

const updateExpenses = createAsyncThunk('expense/updateExpenses', expensesService.updateExpenses);

const expenseFileUpload = createAsyncThunk('expense/expenseFileUpload', expensesService.expenseFileUpload);

const getExpenseCustomerProject = createAsyncThunk('expense/getExpenseCustomerProject', expensesService.getExpenseCustomerProject);

const getExpenseById = createAsyncThunk('expense/getExpenseById', expensesService.getExpenseById);

const removeExpenses = createAsyncThunk('expense/removeExpenses', expensesService.removeExpenses);

const getExpenseExports = createAsyncThunk('expense/getExpenseExports', expensesService.getExpenseExports);

export const expensesSlice = createSlice({
  name: 'expense',
  initialState: {
    expenses: [],
    expense: null,
    expenseFile: null,
    pagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
      totalAmount: 0,
      companyCost: 0,
      recoverableFromParty: 0,
      inputTaxCredit: 0,
    },
    expenseEmployeeDrop: null,
    expenseCustomerProjectDrop: null,
    create: null,
    update: null,
    loading: false,
    submitLoading: false,
    deleteLoading: false,
    exportLoading: false,
    uploading: false,
    droploading: false,
    error: null,
  },
  reducers: {
    resetExpenses: state => {
      state.expense = null;
    },
    resetExpensesList: state => {
      state.expenses = [];
      state.pagination = {
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        totalPages: 1,
        totalResults: 0,
        totalAmount: 0,
        companyCost: 0,
        recoverableFromParty: 0,
        inputTaxCredit: 0,
      };
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getExpenses.pending, state => {
        state.loading = true;
      })
      .addCase(getExpenses.fulfilled, (state, action) => {
        state.loading = false;
        state.expenses = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalResults: action.payload.extras.totalResults,
          totalAmount: action.payload.extras.totalAmount || 0,
          companyCost: action.payload.extras.companyCost || 0,
          recoverableFromParty: action.payload.extras.recoverableFromParty || 0,
          inputTaxCredit: action.payload.extras.inputTaxCredit || 0,
        };
        state.message = action.payload.message;
      })
      .addCase(getExpenses.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.expenses = [];
          state.error = action.error.message;
        }
      })
      .addCase(createExpenses.pending, state => {
        state.submitLoading = true;
      })
      .addCase(createExpenses.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.create = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createExpenses.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updateExpenses.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updateExpenses.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.update = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(updateExpenses.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(expenseFileUpload.pending, state => {
        state.uploading = true;
      })
      .addCase(expenseFileUpload.fulfilled, (state, action) => {
        state.uploading = false;
        state.expenseFile = action.payload.data.urls;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(expenseFileUpload.rejected, (state, action) => {
        state.uploading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getExpenseCustomerProject.pending, state => {
        state.droploading = true;
      })
      .addCase(getExpenseCustomerProject.fulfilled, (state, action) => {
        state.droploading = false;
        state.expenseCustomerProjectDrop = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getExpenseCustomerProject.rejected, (state, action) => {
        state.droploading = false;
        state.error = action.error.message;
      })
      .addCase(getExpenseById.pending, state => {
        state.loading = true;
      })
      .addCase(getExpenseById.fulfilled, (state, action) => {
        state.loading = false;
        state.expense = action.payload.data;
      })
      .addCase(getExpenseById.rejected, (state, action) => {
        state.loading = false;
        state.expense = null;
        state.error = action.error.message;
      })
      .addCase(removeExpenses.pending, state => {
        state.deleteLoading = true;
      })
      .addCase(removeExpenses.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.message = action.payload?.message;
        if (state.message) Toast.success(state.message);
      })
      .addCase(removeExpenses.rejected, (state, action) => {
        state.deleteLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getExpenseExports.pending, state => {
        state.exportLoading = true;
      })
      .addCase(getExpenseExports.fulfilled, (state, action) => {
        state.exportLoading = false;
        state.message = action.payload.message;
      })
      .addCase(getExpenseExports.rejected, (state, action) => {
        state.exportLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      });
  },
});
export const expensesSliceMethods = {
  getExpenses,
  createExpenses,
  updateExpenses,
  expenseFileUpload,
  getExpenseCustomerProject,
  getExpenseById,
  removeExpenses,
  getExpenseExports,
};
export const { resetExpenses, resetExpensesList } = expensesSlice.actions;
export default expensesSlice.reducer;
