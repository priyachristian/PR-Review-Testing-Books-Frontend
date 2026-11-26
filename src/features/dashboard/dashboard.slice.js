import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { dashboardService } from './dashboard.service';

const getDashboardSummary = createAsyncThunk('dashboard/getDashboardSummary', dashboardService.getDashboardSummary);

const getTop5SalesOrder = createAsyncThunk('dashboard/getTop5SalesOrder', dashboardService.getTop5SalesOrder);

const getTop5PurchaseOrder = createAsyncThunk('dashboard/getTop5PurchaseOrder', dashboardService.getTop5PurchaseOrder);

const getTop5PaymentReceived = createAsyncThunk('dashboard/getTop5PaymentReceived', dashboardService.getTop5PaymentReceived);

const getTop5PaymentMade = createAsyncThunk('dashboard/getTop5PaymentMade', dashboardService.getTop5PaymentMade);

const getTop5Expense = createAsyncThunk('dashboard/getTop5Expense', dashboardService.getTop5Expense);

const getUserWiseSummary = createAsyncThunk('dashboard/getUserWiseSummary', dashboardService.getUserWiseSummary);

const getCreditOverview = createAsyncThunk('dashboard/getCreditOverview', dashboardService.getCreditOverview);
const getCreditUtilization = createAsyncThunk('dashboard/getCreditUtilization', dashboardService.getCreditUtilization);
const getOverLimitCustomers = createAsyncThunk('dashboard/getOverLimitCustomers', dashboardService.getOverLimitCustomers);

export const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    dashboardSummary: null,
    top5Record: null,
    loading: false,
    summaryLoading: false,
    error: null,
    creditOverview: null,
    creditUtilization: null,
    overLimitCustomers: null,
    creditOverviewLoading: false,
    creditUtilizationLoading: false,
    overLimitCustomersLoading: false,
    userWiseSummary: null,
    userWiseSummaryLoading: false,
  },
  reducers: {
    resetDashboardSummary: state => {
      state.dashboardSummary = null;
    },
    resetTop5Record: state => {
      state.top5Record = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getDashboardSummary.pending, state => {
        state.summaryLoading = true;
      })
      .addCase(getDashboardSummary.fulfilled, (state, action) => {
        state.summaryLoading = false;
        state.dashboardSummary = action.payload.data;
      })
      .addCase(getDashboardSummary.rejected, state => {
        state.summaryLoading = false;
        state.dashboardSummary = null;
      })
      .addCase(getTop5SalesOrder.pending, state => {
        state.loading = true;
      })
      .addCase(getTop5SalesOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.top5Record = action.payload.data;
      })
      .addCase(getTop5SalesOrder.rejected, state => {
        state.loading = false;
        state.top5Record = null;
      })
      .addCase(getTop5PurchaseOrder.pending, state => {
        state.loading = true;
      })
      .addCase(getTop5PurchaseOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.top5Record = action.payload.data;
      })
      .addCase(getTop5PurchaseOrder.rejected, state => {
        state.loading = false;
        state.top5Record = null;
      })
      .addCase(getTop5PaymentReceived.pending, state => {
        state.loading = true;
      })
      .addCase(getTop5PaymentReceived.fulfilled, (state, action) => {
        state.loading = false;
        state.top5Record = action.payload.data;
      })
      .addCase(getTop5PaymentReceived.rejected, state => {
        state.loading = false;
        state.top5Record = null;
      })
      .addCase(getTop5PaymentMade.pending, state => {
        state.loading = true;
      })
      .addCase(getTop5PaymentMade.fulfilled, (state, action) => {
        state.loading = false;
        state.top5Record = action.payload.data;
      })
      .addCase(getTop5PaymentMade.rejected, state => {
        state.loading = false;
        state.top5Record = null;
      })
      .addCase(getTop5Expense.pending, state => {
        state.loading = true;
      })
      .addCase(getTop5Expense.fulfilled, (state, action) => {
        state.loading = false;
        state.top5Record = action.payload.data;
      })
      .addCase(getTop5Expense.rejected, state => {
        state.loading = false;
        state.top5Record = null;
      })
      .addCase(getCreditOverview.pending, state => {
        state.creditOverviewLoading = true;
      })
      .addCase(getCreditOverview.fulfilled, (state, action) => {
        state.creditOverviewLoading = false;
        state.creditOverview = action.payload.data?.creditOverview;
      })
      .addCase(getCreditOverview.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.creditOverviewLoading = false;
          state.creditOverview = null;
        }
      })
      .addCase(getCreditUtilization.pending, state => {
        state.creditUtilizationLoading = true;
      })
      .addCase(getCreditUtilization.fulfilled, (state, action) => {
        state.creditUtilizationLoading = false;
        state.creditUtilization = action.payload;
      })
      .addCase(getCreditUtilization.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.creditUtilizationLoading = false;
          state.creditUtilization = null;
        }
      })
      .addCase(getOverLimitCustomers.pending, state => {
        state.overLimitCustomersLoading = true;
      })
      .addCase(getOverLimitCustomers.fulfilled, (state, action) => {
        state.overLimitCustomersLoading = false;
        state.overLimitCustomers = action.payload;
      })
      .addCase(getOverLimitCustomers.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.overLimitCustomersLoading = false;
          state.overLimitCustomers = null;
        }
      })
      .addCase(getUserWiseSummary.pending, state => {
        state.userWiseSummaryLoading = true;
      })
      .addCase(getUserWiseSummary.fulfilled, (state, action) => {
        state.userWiseSummaryLoading = false;
        state.userWiseSummary = action.payload.data;
      })
      .addCase(getUserWiseSummary.rejected, state => {
        state.userWiseSummaryLoading = false;
      });
  },
});
export const { resetDashboardSummary, resetTop5Record } = dashboardSlice.actions;
export default dashboardSlice.reducer;
export const dashboardSliceMethods = {
  getDashboardSummary,
  getTop5SalesOrder,
  getTop5PurchaseOrder,
  getTop5PaymentReceived,
  getTop5PaymentMade,
  getTop5Expense,
  getCreditOverview,
  getCreditUtilization,
  getOverLimitCustomers,
  getUserWiseSummary,
};
