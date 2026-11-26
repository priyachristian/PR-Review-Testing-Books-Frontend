import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { bankingService } from './bank.service';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getBank = createAsyncThunk('bank/getBank', async (payload, thunkAPI) => {
  const state = thunkAPI.getState();
  const data = await bankingService.getBank({
    ...payload,
    isSplit: state?.common?.isSplitSessionActive ? true : false,
  });
  return data;
});

const createBanking = createAsyncThunk('bank/createBanking', bankingService.createBanking);

const updateBanking = createAsyncThunk('bank/updateBanking', bankingService.updateBanking);

const getPrimaryBank = createAsyncThunk('bank/getPrimaryBank', bankingService.getPrimaryBank);

const bankTransfer = createAsyncThunk('bank/bankTransfer', bankingService.bankTransfer);

const getBankDropDown = createAsyncThunk('bank/getBankDropDown', async (payload, thunkAPI) => {
  const state = thunkAPI.getState();

  const isSplit = payload?.isSplit ? payload?.isSplit : state?.common?.isSplitSessionActive ? true : false;

  const data = await bankingService.getBankDropDown({
    ...payload,
    ...(isSplit && { isSplit }),
  });
  return data;
});

const getBankById = createAsyncThunk('bank/getBankById', bankingService.getBankById);

const getBankHistory = createAsyncThunk('bank/getBankHistory', bankingService.getBankHistory);

const createBankTransaction = createAsyncThunk('bank/createBankTransaction', bankingService.createBankTransaction);

const getAllBankTransactions = createAsyncThunk('bank/getAllBankTransactions', bankingService.getAllBankTransactions);

const approveTransaction = createAsyncThunk('bank/approveTransaction', bankingService.approveTransaction);

const rejectTransaction = createAsyncThunk('bank/rejectTransaction', bankingService.rejectTransaction);

const cancelTransaction = createAsyncThunk('bank/cancelTransaction', bankingService.cancelTransaction);

export const bankingSlice = createSlice({
  name: 'bank',
  initialState: {
    banking: [],
    bank: null,
    primaryBank: null,
    bankDropdown: [],
    paginationForBankHistory: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
    },
    pagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
    },
    create: null,
    update: null,
    loading: false,
    droploading: false,
    submitLoading: false,
    bankLoading: false,
    updateBankLoading: false,
    approveTransactionLoading: false,
    rejectTransactionLoading: false,
    cancelTransactionLoading: false,
    bankHistory: [],
    allBankTransactions: [],
    paginationForAllTransactions: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
    },
    error: null,
  },
  reducers: {
    resetBank: state => {
      state.bank = null;
    },
    resetBanking: state => {
      state.banking = [];
      state.pagination = {
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        totalPages: 1,
        totalResults: 0,
      };
    },
    resetAllBankTransactions: state => {
      state.allBankTransactions = [];
      state.paginationForAllTransactions = {
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        totalPages: 1,
        totalResults: 0,
      };
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getBank.pending, state => {
        state.loading = true;
      })
      .addCase(getBank.fulfilled, (state, action) => {
        state.loading = false;
        state.banking = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalResults: action.payload.extras.totalResults,
          totalAmount: action.payload.extras.totalOfAvailableBalance,
        };
        state.message = action.payload.message;
      })
      .addCase(getBank.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.error = action.error.message;
        }
      })
      .addCase(createBanking.pending, state => {
        state.submitLoading = true;
      })
      .addCase(createBanking.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.create = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createBanking.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.submitLoading = false;
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updateBanking.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updateBanking.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.update = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(updateBanking.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.submitLoading = false;
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getPrimaryBank.pending, state => {
        state.bankLoading = true;
      })
      .addCase(getPrimaryBank.fulfilled, (state, action) => {
        state.bankLoading = false;
        state.primaryBank = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getPrimaryBank.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.bankLoading = false;
          state.error = action.error.message;
        }
      })
      .addCase(getBankDropDown.pending, state => {
        state.droploading = true;
      })
      .addCase(getBankDropDown.fulfilled, (state, action) => {
        state.droploading = false;
        state.bankDropdown = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getBankDropDown.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.droploading = false;
          state.bankDropdown = [];
          state.error = action.error.message;
        }
      })
      .addCase(bankTransfer.pending, state => {
        state.updateBankLoading = true;
      })
      .addCase(bankTransfer.fulfilled, (state, action) => {
        state.updateBankLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(bankTransfer.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.updateBankLoading = false;
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getBankById.pending, state => {
        state.loading = true;
      })
      .addCase(getBankById.fulfilled, (state, action) => {
        state.loading = false;
        state.bank = action.payload.data;
      })
      .addCase(getBankById.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.bank = null;
          state.error = action.error.message;
        }
      })
      .addCase(getBankHistory.pending, state => {
        state.loading = true;
      })
      .addCase(getBankHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.bankHistory = action.payload.data.results;
        // API returns pagination under data.* for history; extras may be empty
        const p = action.payload?.data || {};
        state.paginationForBankHistory = {
          page: p.page ?? state.paginationForBankHistory.page,
          limit: p.limit ?? state.paginationForBankHistory.limit,
          totalPages: p.totalPages ?? state.paginationForBankHistory.totalPages,
          totalResults: p.totalResults ?? state.paginationForBankHistory.totalResults,
        };
        state.message = action.payload.message;
      })
      .addCase(getBankHistory.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getAllBankTransactions.pending, state => {
        state.loading = true;
      })
      .addCase(getAllBankTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.allBankTransactions = action.payload.data.results;
        const p = action.payload?.data || {};
        state.paginationForAllTransactions = {
          page: p.page ?? state.paginationForAllTransactions.page,
          limit: p.limit ?? state.paginationForAllTransactions.limit,
          totalPages: p.totalPages ?? state.paginationForAllTransactions.totalPages,
          totalResults: p.totalResults ?? state.paginationForAllTransactions.totalResults,
        };
      })
      .addCase(getAllBankTransactions.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(createBankTransaction.pending, state => {
        state.submitLoading = true;
      })
      .addCase(createBankTransaction.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createBankTransaction.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.submitLoading = false;
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(approveTransaction.pending, state => {
        state.approveTransactionLoading = true;
      })
      .addCase(approveTransaction.fulfilled, (state, action) => {
        state.approveTransactionLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(approveTransaction.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.approveTransactionLoading = false;
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(rejectTransaction.pending, state => {
        state.rejectTransactionLoading = true;
      })
      .addCase(rejectTransaction.fulfilled, (state, action) => {
        state.rejectTransactionLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(rejectTransaction.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.rejectTransactionLoading = false;
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(cancelTransaction.pending, state => {
        state.cancelTransactionLoading = true;
      })
      .addCase(cancelTransaction.fulfilled, (state, action) => {
        state.cancelTransactionLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(cancelTransaction.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.cancelTransactionLoading = false;
          state.error = action.error.message;
          Toast.error(state.error);
        }
      });
  },
});
export const bankingSliceMethods = {
  getBank,
  createBanking,
  updateBanking,
  getPrimaryBank,
  getBankDropDown,
  bankTransfer,
  getBankById,
  getBankHistory,
  createBankTransaction,
  getAllBankTransactions,
  approveTransaction,
  rejectTransaction,
  cancelTransaction,
};
export const { resetBank, resetBanking, resetAllBankTransactions } = bankingSlice.actions;
export default bankingSlice.reducer;
