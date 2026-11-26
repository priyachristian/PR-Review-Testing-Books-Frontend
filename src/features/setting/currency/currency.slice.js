import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { currencyService } from './currency.service';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getCurrencies = createAsyncThunk('currency/getCurrencies', currencyService.getCurrencies);
const createCurrency = createAsyncThunk('currency/createCurrency', currencyService.createCurrency);
const updateCurrency = createAsyncThunk('currency/updateCurrency', currencyService.updateCurrency);
const deleteCurrency = createAsyncThunk('currency/deleteCurrency', currencyService.deleteCurrency);

export const currencySliceMethods = {
  getCurrencies,
  createCurrency,
  updateCurrency,
  deleteCurrency,
};

export const currencySlice = createSlice({
  name: 'currency',
  initialState: {
    currencies: [],
    pagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalResults: 0,
      totalPages: 0,
    },
    loading: false,
    saving: false,
    deletingId: null,
    error: null,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(getCurrencies.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCurrencies.fulfilled, (state, action) => {
        state.loading = false;
        state.currencies = action.payload?.data;
        state.pagination = {
          page: action.payload?.extras?.page ?? 1,
          limit: action.payload?.extras?.limit ?? DEFAULT_PAGE_SIZE,
          totalResults: action.payload?.extras?.totalResults ?? state.currencies.length,
          totalPages: action.payload?.extras?.totalPages ?? 1,
        };
      })
      .addCase(getCurrencies.rejected, (state, action) => {
        state.loading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(createCurrency.pending, state => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createCurrency.fulfilled, (state, action) => {
        state.saving = false;
        Toast.success(action.payload?.message);
      })
      .addCase(createCurrency.rejected, (state, action) => {
        state.saving = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updateCurrency.pending, state => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateCurrency.fulfilled, (state, action) => {
        state.saving = false;
        Toast.success(action.payload?.message);
      })
      .addCase(updateCurrency.rejected, (state, action) => {
        state.saving = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(deleteCurrency.pending, (state, action) => {
        state.deletingId = action.meta.arg?.currencyId || null;
        state.error = null;
      })
      .addCase(deleteCurrency.fulfilled, (state, action) => {
        state.deletingId = null;
        Toast.success(action.payload?.message);
      })
      .addCase(deleteCurrency.rejected, (state, action) => {
        state.deletingId = null;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      });
  },
});

export default currencySlice.reducer;
