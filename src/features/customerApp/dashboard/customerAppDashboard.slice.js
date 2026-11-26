import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { customerAppDashboardService } from './customerAppDashboard.service';

const getDashboardData = createAsyncThunk('customerAppDashboard/getDashboardData', customerAppDashboardService.getDashboardData);

const initialState = {
  stats: { totalOrders: 0, sentOrders: 0, acceptedOrders: 0, completedOrders: 0, pendingApprovals: 0 },
  recentOrders: [],
  recentPayments: [],
  currency: null,
  loading: false,
  error: null,
};

export const customerAppDashboardSlice = createSlice({
  name: 'customerAppDashboard',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(getDashboardData.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getDashboardData.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload.stats;
        state.recentOrders = action.payload.recentOrders;
        state.recentPayments = action.payload.recentPayments;
        state.currency = action.payload.currency;
      })
      .addCase(getDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const customerAppDashboardSliceMethods = { getDashboardData };
export default customerAppDashboardSlice.reducer;
