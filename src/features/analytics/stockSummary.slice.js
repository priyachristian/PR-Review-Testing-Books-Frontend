import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { stockSummaryService } from './stockSummary.service';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

export const fetchStockSummary = createAsyncThunk('stockSummary/fetchSummary', stockSummaryService.getStockSummary);
export const fetchDateWiseBreakdown = createAsyncThunk('stockSummary/fetchDateWise', stockSummaryService.getDateWiseBreakdown);

const initialPagination = { page: 1, limit: DEFAULT_PAGE_SIZE, totalPages: 1, totalResults: 0 };

const isCanceled = action => action.error?.name === 'CanceledError' || action.error?.code === 'ERR_CANCELED' || action.error?.message === 'canceled';

const readPaginationExtras = (extras = {}, fallbackLimit = DEFAULT_PAGE_SIZE) => ({
  page: extras.page || 1,
  limit: extras.limit || fallbackLimit,
  totalPages: extras.totalPages || 1,
  totalResults: extras.totalResults || 0,
});

const initialState = {
  summaryRows: [],
  kpis: null,
  pagination: { ...initialPagination },
  loading: false,

  dateWiseRows: [],
  dateWiseOpeningQty: 0,
  dateWisePagination: { ...initialPagination },
  dateWiseLoading: false,

  error: null,
};

const stockSummarySlice = createSlice({
  name: 'stockSummary',
  initialState,
  reducers: {
    resetStockSummary: () => initialState,
    resetDateWise: state => {
      state.dateWiseRows = [];
      state.dateWiseOpeningQty = 0;
      state.dateWisePagination = { ...initialPagination };
      state.dateWiseLoading = false;
    },
  },
  extraReducers: builder => {
    builder.addCase(fetchStockSummary.pending, state => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchStockSummary.fulfilled, (state, action) => {
      state.loading = false;
      state.summaryRows = Array.isArray(action.payload?.data) ? action.payload.data : [];
      const extras = action.payload?.extras || {};
      state.kpis = extras.kpis || null;
      state.pagination = readPaginationExtras(extras, state.pagination.limit);
    });
    builder.addCase(fetchStockSummary.rejected, (state, action) => {
      if (!isCanceled(action)) {
        state.loading = false;
        state.summaryRows = [];
        state.error = action.error.message;
      }
    });

    builder.addCase(fetchDateWiseBreakdown.pending, state => {
      state.dateWiseLoading = true;
      state.error = null;
    });
    builder.addCase(fetchDateWiseBreakdown.fulfilled, (state, action) => {
      state.dateWiseLoading = false;
      state.dateWiseRows = action.payload?.data?.rows || [];
      state.dateWiseOpeningQty = action.payload?.data?.openingQty || 0;
      state.dateWisePagination = readPaginationExtras(action.payload?.extras || {}, state.dateWisePagination.limit);
    });
    builder.addCase(fetchDateWiseBreakdown.rejected, (state, action) => {
      if (!isCanceled(action)) {
        state.dateWiseLoading = false;
        state.dateWiseRows = [];
        state.error = action.error.message;
      }
    });
  },
});

export const { resetStockSummary, resetDateWise } = stockSummarySlice.actions;
export default stockSummarySlice.reducer;
