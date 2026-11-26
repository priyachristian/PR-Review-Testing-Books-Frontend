import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { isCanceledRequestError } from '@/utils/serviceHelper';
import { accountService } from './chartOfAccount.service';

const getAccountCategories = createAsyncThunk('account/getAccountCategories', accountService.getAccountCategories);
const createAccount = createAsyncThunk('account/createAccount', accountService.createAccount);
const updateAccount = createAsyncThunk('account/updateAccount', accountService.updateAccount);
const getAccountsList = createAsyncThunk('account/getAccountsList', accountService.getAccountsList);
const getAccounts = createAsyncThunk('account/getAccounts', accountService.getAccounts);
const getAccountLedger = createAsyncThunk('account/getAccountLedger', accountService.getAccountLedger);
const deleteAccount = createAsyncThunk('account/deleteAccount', accountService.deleteAccount);

export const accountSlice = createSlice({
  name: 'account',
  initialState: {
    categories: [],
    accounts: [],
    loading: false,
    accountDrop: {},
    accountLedger: null,
    ledgerLoading: false,
    create: null,
    update: null,
    delete: null,
    submitLoading: false,
    deleteLoading: false,
    droploading: false,
    error: null,
    message: null,
  },
  reducers: {
    resetAccounts: state => {
      state.accounts = [];
      state.loading = false;
    },
    resetAccountDrop: state => {
      state.accountDrop = {};
      state.droploading = false;
    },
    resetAccountLedger: state => {
      state.accountLedger = null;
      state.ledgerLoading = false;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getAccountCategories.pending, state => {
        state.droploading = true;
      })
      .addCase(getAccountCategories.fulfilled, (state, action) => {
        state.droploading = false;
        state.categories = action.payload.data;
      })
      .addCase(getAccountCategories.rejected, (state, action) => {
        state.droploading = false;
        if (!isCanceledRequestError(action.error)) {
          state.categories = [];
          state.error = action.error.message;
        }
      })
      .addCase(createAccount.pending, state => {
        state.submitLoading = true;
      })
      .addCase(createAccount.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.create = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createAccount.rejected, (state, action) => {
        state.submitLoading = false;
        if (!isCanceledRequestError(action.error)) {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updateAccount.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updateAccount.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.update = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(updateAccount.rejected, (state, action) => {
        state.submitLoading = false;
        if (!isCanceledRequestError(action.error)) {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getAccountLedger.pending, state => {
        state.ledgerLoading = true;
      })
      .addCase(getAccountLedger.fulfilled, (state, action) => {
        state.ledgerLoading = false;
        state.accountLedger = action.payload.data;
      })
      .addCase(getAccountLedger.rejected, (state, action) => {
        state.ledgerLoading = false;
        if (!isCanceledRequestError(action.error)) {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getAccountsList.pending, state => {
        state.loading = true;
      })
      .addCase(getAccountsList.fulfilled, (state, action) => {
        state.loading = false;
        state.accounts = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getAccountsList.rejected, (state, action) => {
        state.loading = false;
        if (!isCanceledRequestError(action.error)) {
          state.accounts = [];
          state.error = action.error.message;
        }
      })
      .addCase(getAccounts.pending, state => {
        state.droploading = true;
      })
      .addCase(getAccounts.fulfilled, (state, action) => {
        state.droploading = false;
        state.accountDrop[action.meta.arg.type] = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getAccounts.rejected, (state, action) => {
        state.droploading = false;
        if (!isCanceledRequestError(action.error)) {
          state.accountDrop[action.meta.arg.type] = [];
          state.error = action.error.message;
        }
      })
      .addCase(deleteAccount.pending, state => {
        state.deleteLoading = true;
      })
      .addCase(deleteAccount.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.delete = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.deleteLoading = false;
        state.delete = null;
        if (!isCanceledRequestError(action.error)) {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      });
  },
});

export const { resetAccounts, resetAccountDrop, resetAccountLedger } = accountSlice.actions;

export const accountSliceMethods = {
  getAccountCategories,
  createAccount,
  updateAccount,
  getAccountsList,
  getAccounts,
  getAccountLedger,
  deleteAccount,
};

export default accountSlice.reducer;
