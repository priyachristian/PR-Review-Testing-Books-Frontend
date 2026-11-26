import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { rejectionAnalyticsService } from './rejectionAnalytics.service';

export const fetchRejectionSummary = createAsyncThunk('rejectionAnalytics/fetchSummary', rejectionAnalyticsService.getRejectionSummary);
export const fetchRejectionTrend = createAsyncThunk('rejectionAnalytics/fetchTrend', rejectionAnalyticsService.getRejectionTrend);
export const fetchRejectionByItem = createAsyncThunk('rejectionAnalytics/fetchByItem', rejectionAnalyticsService.getRejectionByItem);
export const fetchRejectionByRawMaterial = createAsyncThunk('rejectionAnalytics/fetchByRawMaterial', rejectionAnalyticsService.getRejectionByRawMaterial);
export const fetchRejectionByProcess = createAsyncThunk('rejectionAnalytics/fetchByProcess', rejectionAnalyticsService.getRejectionByProcess);
export const fetchRejectionByBranch = createAsyncThunk('rejectionAnalytics/fetchByBranch', rejectionAnalyticsService.getRejectionByBranch);
export const fetchItemRejectionReport = createAsyncThunk('rejectionAnalytics/fetchItemRejectionReport', rejectionAnalyticsService.getItemRejectionReport);

const initialState = {
  summary: null,
  summaryLoading: false,

  trend: [],
  trendLoading: false,

  byItem: [],
  byItemLoading: false,
  byItemPagination: { page: 1, limit: 10, totalPages: 1, totalRecords: 0 },

  byRawMaterial: [],
  byRawMaterialLoading: false,
  byRawMaterialPagination: { page: 1, limit: 10, totalPages: 1, totalRecords: 0 },

  byProcess: [],
  byProcessLoading: false,
  byProcessPagination: { page: 1, limit: 10, totalPages: 1, totalRecords: 0 },

  byBranch: [],
  byBranchLoading: false,
  byBranchPagination: { page: 1, limit: 10, totalPages: 1, totalRecords: 0 },

  itemRejectionReport: [],
  itemRejectionReportSummary: {
    totalProductionOrders: 0,
    totalFgRejectedQty: 0,
    totalRawMaterialRejectedQty: 0,
    totalRejectedQty: 0,
    overallRejectionPercentage: 0,
  },
  itemRejectionReportPagination: { page: 1, limit: 15, totalPages: 1, totalResults: 0 },
  itemRejectionReportLoading: false,

  error: null,
};

const rejectionAnalyticsSlice = createSlice({
  name: 'rejectionAnalytics',
  initialState,
  reducers: {
    resetRejectionAnalytics: () => initialState,
    resetSummary: state => {
      state.summary = null;
    },
    resetTrend: state => {
      state.trend = [];
    },
    resetByItem: state => {
      state.byItem = [];
    },
    resetByRawMaterial: state => {
      state.byRawMaterial = [];
    },
    resetByProcess: state => {
      state.byProcess = [];
    },
    resetByBranch: state => {
      state.byBranch = [];
    },
    resetItemRejectionReport: state => {
      state.itemRejectionReport = [];
      state.itemRejectionReportSummary = initialState.itemRejectionReportSummary;
      state.itemRejectionReportPagination = initialState.itemRejectionReportPagination;
      state.itemRejectionReportLoading = false;
    },
  },
  extraReducers: builder => {
    // Summary
    builder
      .addCase(fetchRejectionSummary.pending, state => {
        state.summaryLoading = true;
        state.error = null;
      })
      .addCase(fetchRejectionSummary.fulfilled, (state, action) => {
        state.summaryLoading = false;
        state.summary = action.payload?.data ?? action.payload ?? null;
      })
      .addCase(fetchRejectionSummary.rejected, (state, action) => {
        state.summaryLoading = false;
        state.error = action.error?.message || 'Failed to fetch rejection summary';
      });

    // Trend
    builder
      .addCase(fetchRejectionTrend.pending, state => {
        state.trendLoading = true;
      })
      .addCase(fetchRejectionTrend.fulfilled, (state, action) => {
        state.trendLoading = false;
        state.trend = action.payload?.data ?? action.payload ?? [];
      })
      .addCase(fetchRejectionTrend.rejected, state => {
        state.trendLoading = false;
      });

    // By Item
    builder
      .addCase(fetchRejectionByItem.pending, state => {
        state.byItemLoading = true;
      })
      .addCase(fetchRejectionByItem.fulfilled, (state, action) => {
        state.byItemLoading = false;
        state.byItem = action.payload?.data ?? action.payload ?? [];
        if (action.payload?.otherDetails) state.byItemPagination = action.payload.otherDetails;
      })
      .addCase(fetchRejectionByItem.rejected, state => {
        state.byItemLoading = false;
      });

    // By Raw Material
    builder
      .addCase(fetchRejectionByRawMaterial.pending, state => {
        state.byRawMaterialLoading = true;
      })
      .addCase(fetchRejectionByRawMaterial.fulfilled, (state, action) => {
        state.byRawMaterialLoading = false;
        state.byRawMaterial = action.payload?.data ?? action.payload ?? [];
        if (action.payload?.otherDetails) state.byRawMaterialPagination = action.payload.otherDetails;
      })
      .addCase(fetchRejectionByRawMaterial.rejected, state => {
        state.byRawMaterialLoading = false;
      });

    // By Process
    builder
      .addCase(fetchRejectionByProcess.pending, state => {
        state.byProcessLoading = true;
      })
      .addCase(fetchRejectionByProcess.fulfilled, (state, action) => {
        state.byProcessLoading = false;
        state.byProcess = action.payload?.data ?? action.payload ?? [];
        if (action.payload?.otherDetails) state.byProcessPagination = action.payload.otherDetails;
      })
      .addCase(fetchRejectionByProcess.rejected, state => {
        state.byProcessLoading = false;
      });

    // By Branch
    builder
      .addCase(fetchRejectionByBranch.pending, state => {
        state.byBranchLoading = true;
      })
      .addCase(fetchRejectionByBranch.fulfilled, (state, action) => {
        state.byBranchLoading = false;
        state.byBranch = action.payload?.data ?? action.payload ?? [];
        if (action.payload?.otherDetails) state.byBranchPagination = action.payload.otherDetails;
      })
      .addCase(fetchRejectionByBranch.rejected, state => {
        state.byBranchLoading = false;
      });

    // Item Rejection Report (item → production orders)
    builder
      .addCase(fetchItemRejectionReport.pending, state => {
        state.itemRejectionReportLoading = true;
        state.error = null;
      })
      .addCase(fetchItemRejectionReport.fulfilled, (state, action) => {
        state.itemRejectionReportLoading = false;
        const data = action.payload?.data ?? {};
        const extras = action.payload?.extras || {};
        state.itemRejectionReport = data.items ?? [];
        state.itemRejectionReportSummary = {
          totalProductionOrders: data.totalProductionOrders ?? 0,
          totalFgRejectedQty: data.totalFgRejectedQty ?? 0,
          totalRawMaterialRejectedQty: data.totalRawMaterialRejectedQty ?? 0,
          totalRejectedQty: data.totalRejectedQty ?? 0,
          overallRejectionPercentage: data.overallRejectionPercentage ?? 0,
        };
        state.itemRejectionReportPagination = {
          page: extras.currentPage ?? 1,
          limit: extras.limit ?? initialState.itemRejectionReportPagination.limit,
          totalPages: extras.totalPages ?? 1,
          totalResults: extras.totalItems ?? 0,
        };
      })
      .addCase(fetchItemRejectionReport.rejected, (state, action) => {
        if (action.error?.name !== 'AbortError' && action.error?.message !== 'canceled' && action.error?.message !== 'CanceledError') {
          state.itemRejectionReportLoading = false;
          state.itemRejectionReport = [];
          state.error = action.error?.message || 'Failed to fetch item rejection report';
        }
      });
  },
});

export const { resetRejectionAnalytics, resetSummary, resetTrend, resetByItem, resetByRawMaterial, resetByProcess, resetByBranch, resetItemRejectionReport } = rejectionAnalyticsSlice.actions;

export default rejectionAnalyticsSlice.reducer;
