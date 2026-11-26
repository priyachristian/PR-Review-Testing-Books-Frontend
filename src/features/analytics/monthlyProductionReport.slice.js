import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { monthlyProductionReportService } from './monthlyProductionReport.service';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

export const fetchMonthlySummary = createAsyncThunk('monthlyProductionReport/fetchSummary', monthlyProductionReportService.getMonthlySummary);
export const fetchMonthlyDetailOrders = createAsyncThunk('monthlyProductionReport/fetchDetailOrders', monthlyProductionReportService.getMonthlyDetailOrders);
export const fetchMonthlyDetailByItem = createAsyncThunk('monthlyProductionReport/fetchDetailByItem', monthlyProductionReportService.getMonthlyDetailByItem);

const initialPagination = { page: 1, limit: DEFAULT_PAGE_SIZE, totalPages: 1, totalResults: 0 };

const isCanceled = action => action.error?.name === 'CanceledError' || action.error?.code === 'ERR_CANCELED' || action.error?.message === 'canceled';

const initialState = {
  summary: null,
  summaryLoading: false,

  detailOrders: [],
  detailOrdersKpis: null,
  detailOrdersPagination: { ...initialPagination },
  detailOrdersLoading: false,

  detailByItem: [],
  detailByItemPagination: { ...initialPagination },
  detailByItemLoading: false,

  error: null,
};

const readPaginationExtras = (extras = {}, fallbackLimit = DEFAULT_PAGE_SIZE) => ({
  page: extras.page || 1,
  limit: extras.limit || fallbackLimit,
  totalPages: extras.totalPages || 1,
  totalResults: extras.totalResults || 0,
});

const monthlyProductionReportSlice = createSlice({
  name: 'monthlyProductionReport',
  initialState,
  reducers: {
    resetMonthlyProductionReport: () => initialState,
    resetDetailOrders: state => {
      state.detailOrders = [];
      state.detailOrdersKpis = null;
      state.detailOrdersPagination = { ...initialPagination };
      state.detailOrdersLoading = false;
    },
    resetDetailByItem: state => {
      state.detailByItem = [];
      state.detailByItemPagination = { ...initialPagination };
      state.detailByItemLoading = false;
    },
  },
  extraReducers: builder => {
    builder.addCase(fetchMonthlySummary.pending, state => {
      state.summaryLoading = true;
      state.error = null;
    });
    builder.addCase(fetchMonthlySummary.fulfilled, (state, action) => {
      state.summaryLoading = false;
      state.summary = action.payload?.data || null;
    });
    builder.addCase(fetchMonthlySummary.rejected, (state, action) => {
      if (!isCanceled(action)) {
        state.summaryLoading = false;
        state.error = action.error.message;
      }
    });

    builder.addCase(fetchMonthlyDetailOrders.pending, (state, action) => {
      if (action.meta?.arg?.pagination === false) return;
      state.detailOrdersLoading = true;
      state.error = null;
    });
    builder.addCase(fetchMonthlyDetailOrders.fulfilled, (state, action) => {
      if (action.meta?.arg?.pagination === false) return;
      state.detailOrdersLoading = false;
      state.detailOrders = action.payload?.data || [];
      const extras = action.payload?.extras || {};
      if (extras.kpis) state.detailOrdersKpis = extras.kpis;
      state.detailOrdersPagination = readPaginationExtras(extras, state.detailOrdersPagination.limit);
    });
    builder.addCase(fetchMonthlyDetailOrders.rejected, (state, action) => {
      if (action.meta?.arg?.pagination === false) return;
      if (!isCanceled(action)) {
        state.detailOrdersLoading = false;
        state.detailOrders = [];
        state.error = action.error.message;
      }
    });

    builder.addCase(fetchMonthlyDetailByItem.pending, (state, action) => {
      if (action.meta?.arg?.pagination === false) return;
      state.detailByItemLoading = true;
      state.error = null;
    });
    builder.addCase(fetchMonthlyDetailByItem.fulfilled, (state, action) => {
      if (action.meta?.arg?.pagination === false) return;
      state.detailByItemLoading = false;
      state.detailByItem = action.payload?.data || [];
      const extras = action.payload?.extras || {};
      if (extras.kpis) state.detailOrdersKpis = extras.kpis;
      state.detailByItemPagination = readPaginationExtras(extras, state.detailByItemPagination.limit);
    });
    builder.addCase(fetchMonthlyDetailByItem.rejected, (state, action) => {
      if (action.meta?.arg?.pagination === false) return;
      if (!isCanceled(action)) {
        state.detailByItemLoading = false;
        state.detailByItem = [];
        state.error = action.error.message;
      }
    });
  },
});

export const { resetMonthlyProductionReport, resetDetailOrders, resetDetailByItem } = monthlyProductionReportSlice.actions;
export default monthlyProductionReportSlice.reducer;
