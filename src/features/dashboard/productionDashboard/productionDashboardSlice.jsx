import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { productionDashboardService } from './productionDashboardService';

const getSummary = createAsyncThunk('productionDashboard/getSummary', productionDashboardService.getSummary);
const getPipeline = createAsyncThunk('productionDashboard/getPipeline', productionDashboardService.getPipeline);
const getSalesOrderFunnel = createAsyncThunk('productionDashboard/getSalesOrderFunnel', productionDashboardService.getSalesOrderFunnel);
const getTrend = createAsyncThunk('productionDashboard/getTrend', productionDashboardService.getTrend);
const getTopItems = createAsyncThunk('productionDashboard/getTopItems', productionDashboardService.getTopItems);

const initialState = {
  summary: null,
  summaryLoading: false,
  pipeline: null,
  pipelineLoading: false,
  salesFunnel: null,
  salesFunnelLoading: false,
  trend: null,
  trendLoading: false,
  topItems: null,
  topItemsLoading: false,
  error: null,
};

export const productionDashboardSlice = createSlice({
  name: 'productionDashboard',
  initialState,
  reducers: {
    resetProductionDashboard: () => initialState,
  },
  extraReducers: builder => {
    builder
      .addCase(getSummary.pending, state => {
        state.summaryLoading = true;
      })
      .addCase(getSummary.fulfilled, (state, action) => {
        state.summaryLoading = false;
        state.summary = action.payload?.data ?? null;
      })
      .addCase(getSummary.rejected, state => {
        state.summaryLoading = false;
        state.summary = null;
      })

      .addCase(getPipeline.pending, state => {
        state.pipelineLoading = true;
      })
      .addCase(getPipeline.fulfilled, (state, action) => {
        state.pipelineLoading = false;
        state.pipeline = action.payload?.data ?? null;
      })
      .addCase(getPipeline.rejected, state => {
        state.pipelineLoading = false;
        state.pipeline = null;
      })

      .addCase(getSalesOrderFunnel.pending, state => {
        state.salesFunnelLoading = true;
      })
      .addCase(getSalesOrderFunnel.fulfilled, (state, action) => {
        state.salesFunnelLoading = false;
        state.salesFunnel = action.payload?.data ?? null;
      })
      .addCase(getSalesOrderFunnel.rejected, state => {
        state.salesFunnelLoading = false;
        state.salesFunnel = null;
      })

      .addCase(getTrend.pending, state => {
        state.trendLoading = true;
      })
      .addCase(getTrend.fulfilled, (state, action) => {
        state.trendLoading = false;
        state.trend = action.payload?.data ?? null;
      })
      .addCase(getTrend.rejected, state => {
        state.trendLoading = false;
        state.trend = null;
      })

      .addCase(getTopItems.pending, state => {
        state.topItemsLoading = true;
      })
      .addCase(getTopItems.fulfilled, (state, action) => {
        state.topItemsLoading = false;
        state.topItems = action.payload?.data ?? null;
      })
      .addCase(getTopItems.rejected, state => {
        state.topItemsLoading = false;
        state.topItems = null;
      });
  },
});

export const { resetProductionDashboard } = productionDashboardSlice.actions;
export { getSummary, getPipeline, getSalesOrderFunnel, getTrend, getTopItems };
export default productionDashboardSlice.reducer;
