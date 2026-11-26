import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';
import { spareStockLedgerService } from './spareStockLedger.service';

const getSpareStockLedgers = createAsyncThunk('spareStockLedger/getSpareStockLedgers', spareStockLedgerService.getSpareStockLedgers);
const createAdjustment = createAsyncThunk('spareStockLedger/createAdjustment', spareStockLedgerService.createAdjustment);

const isCanceled = action => action.error.name === 'CanceledError' || action.error.code === 'ERR_CANCELED' || action.error.message === 'canceled';

const initialPagination = {
  page: 1,
  limit: DEFAULT_PAGE_SIZE,
  totalPages: 1,
  totalResults: 0,
  totalIssuedStock: 0,
  totalReceivedStock: 0,
};

export const spareStockLedgerSlice = createSlice({
  name: 'spareStockLedger',
  initialState: {
    spareStockLedgers: [],
    loading: false,
    submitLoading: false,
    error: null,
    pagination: initialPagination,
  },
  reducers: {
    resetSpareStockLedger: state => {
      state.spareStockLedgers = [];
      state.error = null;
      state.pagination = initialPagination;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getSpareStockLedgers.pending, state => {
        state.loading = true;
      })
      .addCase(getSpareStockLedgers.fulfilled, (state, action) => {
        state.loading = false;
        state.spareStockLedgers = action.payload?.data || [];
        state.pagination = {
          page: action.payload?.extras?.page ?? 1,
          limit: action.payload?.extras?.limit ?? DEFAULT_PAGE_SIZE,
          totalPages: action.payload?.extras?.totalPages ?? 1,
          totalResults: action.payload?.extras?.totalResults ?? 0,
          totalIssuedStock: action.payload?.extras?.totalIssuedStock ?? 0,
          totalReceivedStock: action.payload?.extras?.totalReceivedStock ?? 0,
        };
      })
      .addCase(getSpareStockLedgers.rejected, (state, action) => {
        if (!isCanceled(action)) {
          state.loading = false;
          state.spareStockLedgers = [];
          state.error = action.error.message;
          Toast.error(action.error.message || 'Unable to load spare stock ledger');
        }
      })
      .addCase(createAdjustment.pending, state => {
        state.submitLoading = true;
      })
      .addCase(createAdjustment.fulfilled, (state, action) => {
        state.submitLoading = false;
        Toast.success(action.payload?.message || 'Stock adjusted successfully');
      })
      .addCase(createAdjustment.rejected, (state, action) => {
        state.submitLoading = false;
        if (!isCanceled(action)) {
          Toast.error(action.error.message || 'Unable to adjust stock');
        }
      });
  },
});

export const spareStockLedgerSliceMethods = {
  getSpareStockLedgers,
  createAdjustment,
};

export const { resetSpareStockLedger } = spareStockLedgerSlice.actions;
export default spareStockLedgerSlice.reducer;
