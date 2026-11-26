import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { accountLedgerService } from './accountLedger.service';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getAccountLedger = createAsyncThunk('accountLedger/getAccountLedger', accountLedgerService.getAccountLedger);

const createAccountLedger = createAsyncThunk('accountLedger/createAccountLedger', accountLedgerService.createAccountLedger);

const getAccountLedgerById = createAsyncThunk('accountLedger/getAccountLedgerById', accountLedgerService.getAccountLedgerById);

const updateAccountLedger = createAsyncThunk('accountLedger/updateAccountLedger', accountLedgerService.updateAccountLedger);

const getAccountLedgerDropdown = createAsyncThunk('accountLedger/getAccountLedgerDropdown', accountLedgerService.getAccountLedgerDropdown);

const removeAccountLedger = createAsyncThunk('accountLedger/removeAccountLedger', accountLedgerService.removeAccountLedger);

export const accountLedgerSlice = createSlice({
  name: 'accountLedger',
  initialState: {
    accountLedgers: [],
    accountLedger: null,
    accountLedgerDrop: null,
    dropLoading: false,
    pagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
    },
    delete: null,
    create: null,
    update: null,
    loading: false,
    submitLoading: false,
    deleteLoading: false,
    error: null,
  },
  reducers: {
    resetAccountLedger: state => {
      state.accountLedger = null;
    },
    resetAccountLedgers: state => {
      state.accountLedgers = [];
      state.pagination = {
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        totalPages: 1,
        totalResults: 0,
      };
    },
    resetAccountLedgerDrop: state => {
      state.accountLedgerDrop = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(createAccountLedger.pending, state => {
        state.submitLoading = true;
      })
      .addCase(createAccountLedger.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.create = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createAccountLedger.rejected, (state, action) => {
        state.submitLoading = false;
        state.error = action.error.message;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getAccountLedger.pending, state => {
        state.loading = true;
      })
      .addCase(getAccountLedger.fulfilled, (state, action) => {
        state.loading = false;
        state.accountLedgers = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalResults: action.payload.extras.totalResults,
        };
        state.message = action.payload.message;
      })
      .addCase(getAccountLedger.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.accountLedgers = [];
          state.error = action.error.message;
        }
      })
      .addCase(getAccountLedgerById.pending, state => {
        state.loading = true;
      })
      .addCase(getAccountLedgerById.fulfilled, (state, action) => {
        state.loading = false;
        state.accountLedger = action.payload.data;
      })
      .addCase(getAccountLedgerById.rejected, (state, action) => {
        state.loading = false;
        state.accountLedger = null;
        state.error = action.error.message;
      })
      .addCase(updateAccountLedger.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updateAccountLedger.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.update = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(updateAccountLedger.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getAccountLedgerDropdown.pending, state => {
        state.dropLoading = true;
      })
      .addCase(getAccountLedgerDropdown.fulfilled, (state, action) => {
        state.dropLoading = false;
        state.accountLedgerDrop = action.payload.data;
      })
      .addCase(getAccountLedgerDropdown.rejected, state => {
        state.dropLoading = false;
        state.accountLedgerDrop = null;
      })
      .addCase(removeAccountLedger.pending, state => {
        state.deleteLoading = true;
      })
      .addCase(removeAccountLedger.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.delete = action.payload?.data;
        state.message = action.payload?.message;
        if (state.message) Toast.success(state.message);
      })
      .addCase(removeAccountLedger.rejected, (state, action) => {
        state.deleteLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      });
  },
});
export const { resetAccountLedger, resetAccountLedgers, resetAccountLedgerDrop } = accountLedgerSlice.actions;
export default accountLedgerSlice.reducer;
export const accountLedgerSliceMethods = {
  createAccountLedger,
  getAccountLedger,
  getAccountLedgerById,
  updateAccountLedger,
  getAccountLedgerDropdown,
  removeAccountLedger,
};
