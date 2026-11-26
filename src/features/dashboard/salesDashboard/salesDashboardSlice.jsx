import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { salesDashboardService } from './salesDashboardService';

/**
 * Normalize a paginated response into `{ result, page, limit, totalPages, totalResults }`.
 * Rows live under `data.result` (or `data` itself), while pagination metadata comes in `extras`.
 */
const normalizePaginated = payload => ({
  result: payload?.data?.result || (Array.isArray(payload?.data) ? payload.data : []),
  page: payload?.extras?.page,
  limit: payload?.extras?.limit,
  totalPages: payload?.extras?.totalPages ?? 0,
  totalResults: payload?.extras?.totalResults ?? 0,
});

// ─── Async Thunks ─────────────────────────────────────────────────────────────

const getSummary = createAsyncThunk('salesDashboard/getSummary', salesDashboardService.getSummary);

const getStateWise = createAsyncThunk('salesDashboard/getStateWise', salesDashboardService.getStateWise);

const getCityWise = createAsyncThunk('salesDashboard/getCityWise', salesDashboardService.getCityWise);

const getStateGraph = createAsyncThunk('salesDashboard/getStateGraph', salesDashboardService.getStateGraph);

const getOrderTrend = createAsyncThunk('salesDashboard/getOrderTrend', salesDashboardService.getOrderTrend);

const getOrderStatus = createAsyncThunk('salesDashboard/getOrderStatus', salesDashboardService.getOrderStatus);

const getCustomerWise = createAsyncThunk('salesDashboard/getCustomerWise', salesDashboardService.getCustomerWise);

const getItemWise = createAsyncThunk('salesDashboard/getItemWise', salesDashboardService.getItemWise);

const getCustomers = createAsyncThunk('salesDashboard/getCustomers', salesDashboardService.getCustomers);

const getInactiveCustomers = createAsyncThunk('salesDashboard/getInactiveCustomers', salesDashboardService.getInactiveCustomers);

const getUserDropdown = createAsyncThunk('salesDashboard/getUserDropdown', salesDashboardService.getUserDropdown);

const getNonOrderCustomers = createAsyncThunk('salesDashboard/getNonOrderCustomers', salesDashboardService.getNonOrderCustomers);

const getNonOrderCustomerList = createAsyncThunk('salesDashboard/getNonOrderCustomerList', salesDashboardService.getNonOrderCustomerList);

const getCustomerInvoices = createAsyncThunk('salesDashboard/getCustomerInvoices', salesDashboardService.getCustomerInvoices);

const getItemGroupAnalytics = createAsyncThunk('salesDashboard/getItemGroupAnalytics', salesDashboardService.getItemGroupAnalytics);

const getItemWiseDetails = createAsyncThunk('salesDashboard/getItemWiseDetails', salesDashboardService.getItemWiseDetails);

const getCustomerWiseDetails = createAsyncThunk('salesDashboard/getCustomerWiseDetails', salesDashboardService.getCustomerWiseDetails);

const getStateWiseDetails = createAsyncThunk('salesDashboard/getStateWiseDetails', salesDashboardService.getStateWiseDetails);

// ─── Slice ────────────────────────────────────────────────────────────────────

export const salesDashboardSlice = createSlice({
  name: 'salesDashboard',
  initialState: {
    summary: null,
    stateWise: null,
    stateGraph: [],
    orderTrend: [],
    orderStatus: [],
    customerWise: null,
    itemWise: null,
    cityWise: null,
    customers: null,
    inactiveCustomers: null,
    userDropdown: [],
    customerInvoices: null,
    nonOrderCustomers: null,
    nonOrderCustomerList: null,
    itemGroupAnalytics: null,
    itemStateBreakdown: null,
    itemCustomerBreakdown: null,
    customerItemBreakdown: null,
    stateItemBreakdown: null,
    stateCustomerBreakdown: null,
    itemDetails: null,
    customerDetails: null,

    summaryLoading: false,
    stateWiseLoading: false,
    stateGraphLoading: false,
    orderTrendLoading: false,
    orderStatusLoading: false,
    customerWiseLoading: false,
    itemWiseLoading: false,
    cityWiseLoading: false,
    customersLoading: false,
    inactiveCustomersLoading: false,
    userDropdownLoading: false,
    customerInvoicesLoading: false,
    nonOrderCustomersLoading: false,
    nonOrderCustomerListLoading: false,
    itemGroupAnalyticsLoading: false,
    itemStateBreakdownLoading: false,
    itemStateBreakdownScrollLoading: false,
    itemCustomerBreakdownLoading: false,
    itemCustomerBreakdownScrollLoading: false,
    customerItemBreakdownLoading: false,
    customerItemBreakdownScrollLoading: false,
    stateItemBreakdownLoading: false,
    stateItemBreakdownScrollLoading: false,
    stateCustomerBreakdownLoading: false,
    stateCustomerBreakdownScrollLoading: false,

    error: null,
  },
  reducers: {
    resetSummary: state => {
      state.summary = null;
    },
    resetStateWise: state => {
      state.stateWise = null;
    },
    resetStateGraph: state => {
      state.stateGraph = [];
    },
    resetOrderTrend: state => {
      state.orderTrend = [];
    },
    resetOrderStatus: state => {
      state.orderStatus = [];
    },
    resetCustomerWise: state => {
      state.customerWise = null;
    },
    resetItemWise: state => {
      state.itemWise = null;
    },
    resetCityWise: state => {
      state.cityWise = null;
    },
    resetCustomers: state => {
      state.customers = null;
      state.inactiveCustomers = null;
    },
    resetCustomerInvoices: state => {
      state.customerInvoices = null;
    },
    resetNonOrderCustomers: state => {
      state.nonOrderCustomers = null;
    },
    resetNonOrderCustomerList: state => {
      state.nonOrderCustomerList = null;
    },
    resetItemStateBreakdown: state => {
      state.itemStateBreakdown = null;
    },
    resetItemCustomerBreakdown: state => {
      state.itemCustomerBreakdown = null;
    },
    resetCustomerItemBreakdown: state => {
      state.customerItemBreakdown = null;
    },
    resetStateItemBreakdown: state => {
      state.stateItemBreakdown = null;
    },
    resetStateCustomerBreakdown: state => {
      state.stateCustomerBreakdown = null;
    },
    resetItemDetails: state => {
      state.itemDetails = null;
    },
    resetCustomerDetails: state => {
      state.customerDetails = null;
    },
    resetAll: state => {
      state.summary = null;
      state.stateWise = null;
      state.stateGraph = [];
      state.orderTrend = [];
      state.orderStatus = [];
      state.customerWise = null;
      state.itemWise = null;
      state.cityWise = null;
      state.customers = null;
      state.inactiveCustomers = null;
      state.customerInvoices = null;
      state.nonOrderCustomers = null;
      state.nonOrderCustomerList = null;
      state.itemGroupAnalytics = null;
      state.itemStateBreakdown = null;
      state.itemCustomerBreakdown = null;
      state.customerItemBreakdown = null;
      state.stateItemBreakdown = null;
      state.stateCustomerBreakdown = null;
      state.itemDetails = null;
      state.customerDetails = null;
    },
  },
  extraReducers: builder => {
    // Summary
    builder
      .addCase(getSummary.pending, state => {
        state.summaryLoading = true;
      })
      .addCase(getSummary.fulfilled, (state, action) => {
        state.summaryLoading = false;
        state.summary = action.payload?.data || null;
      })
      .addCase(getSummary.rejected, state => {
        state.summaryLoading = false;
        state.summary = null;
      });

    // State-wise
    builder
      .addCase(getStateWise.pending, state => {
        state.stateWiseLoading = true;
      })
      .addCase(getStateWise.fulfilled, (state, action) => {
        state.stateWiseLoading = false;
        state.stateWise = normalizePaginated(action.payload);
      })
      .addCase(getStateWise.rejected, state => {
        state.stateWiseLoading = false;
        state.stateWise = null;
      });

    // State-wise graph (all states, non-paginated — drives the Bar + Pie charts)
    builder
      .addCase(getStateGraph.pending, state => {
        state.stateGraphLoading = true;
      })
      .addCase(getStateGraph.fulfilled, (state, action) => {
        state.stateGraphLoading = false;
        state.stateGraph = action.payload?.data?.result || [];
      })
      .addCase(getStateGraph.rejected, state => {
        state.stateGraphLoading = false;
        state.stateGraph = [];
      });

    // Order / Invoice / Payment monthly trend (chart)
    builder
      .addCase(getOrderTrend.pending, state => {
        state.orderTrendLoading = true;
      })
      .addCase(getOrderTrend.fulfilled, (state, action) => {
        state.orderTrendLoading = false;
        state.orderTrend = action.payload?.data?.result || [];
      })
      .addCase(getOrderTrend.rejected, state => {
        state.orderTrendLoading = false;
        state.orderTrend = [];
      });

    // Order status summary (donut chart)
    builder
      .addCase(getOrderStatus.pending, state => {
        state.orderStatusLoading = true;
      })
      .addCase(getOrderStatus.fulfilled, (state, action) => {
        state.orderStatusLoading = false;
        state.orderStatus = action.payload?.data?.result || [];
      })
      .addCase(getOrderStatus.rejected, state => {
        state.orderStatusLoading = false;
        state.orderStatus = [];
      });

    // Item-wise (paginated)
    builder
      .addCase(getItemWise.pending, state => {
        state.itemWiseLoading = true;
      })
      .addCase(getItemWise.fulfilled, (state, action) => {
        state.itemWiseLoading = false;
        state.itemWise = normalizePaginated(action.payload);
      })
      .addCase(getItemWise.rejected, state => {
        state.itemWiseLoading = false;
        state.itemWise = null;
      });

    // Customer-wise (Customer-wise, paginated)
    builder
      .addCase(getCustomerWise.pending, state => {
        state.customerWiseLoading = true;
      })
      .addCase(getCustomerWise.fulfilled, (state, action) => {
        state.customerWiseLoading = false;
        state.customerWise = normalizePaginated(action.payload);
      })
      .addCase(getCustomerWise.rejected, state => {
        state.customerWiseLoading = false;
        state.customerWise = null;
      });

    // City-wise
    builder
      .addCase(getCityWise.pending, state => {
        state.cityWiseLoading = true;
      })
      .addCase(getCityWise.fulfilled, (state, action) => {
        state.cityWiseLoading = false;
        state.cityWise = action.payload?.data || [];
      })
      .addCase(getCityWise.rejected, state => {
        state.cityWiseLoading = false;
        state.cityWise = [];
      });

    // Customers
    builder
      .addCase(getCustomers.pending, state => {
        state.customersLoading = true;
      })
      .addCase(getCustomers.fulfilled, (state, action) => {
        state.customersLoading = false;
        state.customers = action.payload?.data || [];
      })
      .addCase(getCustomers.rejected, state => {
        state.customersLoading = false;
        state.customers = [];
      });

    // Inactive customers
    builder
      .addCase(getInactiveCustomers.pending, state => {
        state.inactiveCustomersLoading = true;
      })
      .addCase(getInactiveCustomers.fulfilled, (state, action) => {
        state.inactiveCustomersLoading = false;
        state.inactiveCustomers = action.payload?.data || [];
      })
      .addCase(getInactiveCustomers.rejected, state => {
        state.inactiveCustomersLoading = false;
        state.inactiveCustomers = [];
      });

    // User dropdown
    builder
      .addCase(getUserDropdown.pending, state => {
        state.userDropdownLoading = true;
      })
      .addCase(getUserDropdown.fulfilled, (state, action) => {
        state.userDropdownLoading = false;
        state.userDropdown = action.payload?.data || [];
      })
      .addCase(getUserDropdown.rejected, state => {
        state.userDropdownLoading = false;
        state.userDropdown = [];
      });

    // Customer invoices
    builder
      .addCase(getCustomerInvoices.pending, state => {
        state.customerInvoicesLoading = true;
      })
      .addCase(getCustomerInvoices.fulfilled, (state, action) => {
        state.customerInvoicesLoading = false;
        state.customerInvoices = action.payload?.data || null;
      })
      .addCase(getCustomerInvoices.rejected, state => {
        state.customerInvoicesLoading = false;
        state.customerInvoices = null;
      });

    // Non-order customers (grouped by state)
    builder
      .addCase(getNonOrderCustomers.pending, state => {
        state.nonOrderCustomersLoading = true;
      })
      .addCase(getNonOrderCustomers.fulfilled, (state, action) => {
        state.nonOrderCustomersLoading = false;
        state.nonOrderCustomers = action.payload?.data || [];
      })
      .addCase(getNonOrderCustomers.rejected, state => {
        state.nonOrderCustomersLoading = false;
        state.nonOrderCustomers = [];
      });

    // Non-order customer list (individual records for a state)
    builder
      .addCase(getNonOrderCustomerList.pending, state => {
        state.nonOrderCustomerListLoading = true;
      })
      .addCase(getNonOrderCustomerList.fulfilled, (state, action) => {
        state.nonOrderCustomerListLoading = false;
        state.nonOrderCustomerList = action.payload?.data || [];
      })
      .addCase(getNonOrderCustomerList.rejected, state => {
        state.nonOrderCustomerListLoading = false;
        state.nonOrderCustomerList = [];
      });

    // Item group analytics
    builder
      .addCase(getItemGroupAnalytics.pending, state => {
        state.itemGroupAnalyticsLoading = true;
      })
      .addCase(getItemGroupAnalytics.fulfilled, (state, action) => {
        state.itemGroupAnalyticsLoading = false;
        state.itemGroupAnalytics = action.payload?.data || null;
      })
      .addCase(getItemGroupAnalytics.rejected, state => {
        state.itemGroupAnalyticsLoading = false;
        state.itemGroupAnalytics = null;
      });

    // Item-wise performance breakdown drawer — single endpoint, tab='state'|'customer' picks which
    // slice of state to update. Infinite scroll: page 1 replaces, page > 1 appends.
    builder
      .addCase(getItemWiseDetails.pending, (state, action) => {
        const { tab, page = 1 } = action.meta.arg || {};
        const scrolling = page > 1;
        if (tab === 'customer') {
          if (scrolling) state.itemCustomerBreakdownScrollLoading = true;
          else state.itemCustomerBreakdownLoading = true;
        } else {
          if (scrolling) state.itemStateBreakdownScrollLoading = true;
          else state.itemStateBreakdownLoading = true;
        }
      })
      .addCase(getItemWiseDetails.fulfilled, (state, action) => {
        const { tab, page: requestedPage = 1 } = action.meta.arg || {};
        const { result, page, totalPages, totalResults } = normalizePaginated(action.payload);
        const resolvedPage = page || requestedPage;
        const isAppend = resolvedPage > 1;
        state.itemDetails = action.payload?.extras?.itemDetails || state.itemDetails;
        if (tab === 'customer') {
          state.itemCustomerBreakdownLoading = false;
          state.itemCustomerBreakdownScrollLoading = false;
          state.itemCustomerBreakdown = {
            rows: isAppend ? [...(state.itemCustomerBreakdown?.rows || []), ...result] : result,
            page: resolvedPage,
            totalPages: totalPages || 0,
            totalResults: totalResults || 0,
          };
        } else {
          state.itemStateBreakdownLoading = false;
          state.itemStateBreakdownScrollLoading = false;
          state.itemStateBreakdown = {
            rows: isAppend ? [...(state.itemStateBreakdown?.rows || []), ...result] : result,
            page: resolvedPage,
            totalPages: totalPages || 0,
            totalResults: totalResults || 0,
          };
        }
      })
      .addCase(getItemWiseDetails.rejected, (state, action) => {
        const { tab } = action.meta.arg || {};
        if (tab === 'customer') {
          state.itemCustomerBreakdownLoading = false;
          state.itemCustomerBreakdownScrollLoading = false;
        } else {
          state.itemStateBreakdownLoading = false;
          state.itemStateBreakdownScrollLoading = false;
        }
      });

    // Customer-wise performance breakdown drawer — item-wise breakdown for a customer.
    // Infinite scroll: page 1 replaces, page > 1 appends.
    builder
      .addCase(getCustomerWiseDetails.pending, (state, action) => {
        if ((action.meta.arg?.page || 1) > 1) state.customerItemBreakdownScrollLoading = true;
        else state.customerItemBreakdownLoading = true;
      })
      .addCase(getCustomerWiseDetails.fulfilled, (state, action) => {
        state.customerItemBreakdownLoading = false;
        state.customerItemBreakdownScrollLoading = false;
        state.customerDetails = action.payload?.extras?.customerDetails || state.customerDetails;
        const { result, page, totalPages, totalResults } = normalizePaginated(action.payload);
        const resolvedPage = page || action.meta.arg?.page || 1;
        const isAppend = resolvedPage > 1;
        state.customerItemBreakdown = {
          rows: isAppend ? [...(state.customerItemBreakdown?.rows || []), ...result] : result,
          page: resolvedPage,
          totalPages: totalPages || 0,
          totalResults: totalResults || 0,
        };
      })
      .addCase(getCustomerWiseDetails.rejected, state => {
        state.customerItemBreakdownLoading = false;
        state.customerItemBreakdownScrollLoading = false;
      });

    // State-wise performance breakdown drawer — single endpoint, tab='item'|'customer' picks which
    // slice of state to update. Infinite scroll: page 1 replaces, page > 1 appends.
    builder
      .addCase(getStateWiseDetails.pending, (state, action) => {
        const { tab, page = 1 } = action.meta.arg || {};
        const scrolling = page > 1;
        if (tab === 'customer') {
          if (scrolling) state.stateCustomerBreakdownScrollLoading = true;
          else state.stateCustomerBreakdownLoading = true;
        } else {
          if (scrolling) state.stateItemBreakdownScrollLoading = true;
          else state.stateItemBreakdownLoading = true;
        }
      })
      .addCase(getStateWiseDetails.fulfilled, (state, action) => {
        const { tab, page: requestedPage = 1 } = action.meta.arg || {};
        const { result, page, totalPages, totalResults } = normalizePaginated(action.payload);
        const resolvedPage = page || requestedPage;
        const isAppend = resolvedPage > 1;
        if (tab === 'customer') {
          state.stateCustomerBreakdownLoading = false;
          state.stateCustomerBreakdownScrollLoading = false;
          state.stateCustomerBreakdown = {
            rows: isAppend ? [...(state.stateCustomerBreakdown?.rows || []), ...result] : result,
            page: resolvedPage,
            totalPages: totalPages || 0,
            totalResults: totalResults || 0,
          };
        } else {
          state.stateItemBreakdownLoading = false;
          state.stateItemBreakdownScrollLoading = false;
          state.stateItemBreakdown = {
            rows: isAppend ? [...(state.stateItemBreakdown?.rows || []), ...result] : result,
            page: resolvedPage,
            totalPages: totalPages || 0,
            totalResults: totalResults || 0,
          };
        }
      })
      .addCase(getStateWiseDetails.rejected, (state, action) => {
        const { tab } = action.meta.arg || {};
        if (tab === 'customer') {
          state.stateCustomerBreakdownLoading = false;
          state.stateCustomerBreakdownScrollLoading = false;
        } else {
          state.stateItemBreakdownLoading = false;
          state.stateItemBreakdownScrollLoading = false;
        }
      });
  },
});

export const {
  resetSummary,
  resetStateWise,
  resetStateGraph,
  resetOrderTrend,
  resetOrderStatus,
  resetCustomerWise,
  resetItemWise,
  resetCityWise,
  resetCustomers,
  resetCustomerInvoices,
  resetNonOrderCustomers,
  resetNonOrderCustomerList,
  resetItemStateBreakdown,
  resetItemCustomerBreakdown,
  resetCustomerItemBreakdown,
  resetStateItemBreakdown,
  resetStateCustomerBreakdown,
  resetItemDetails,
  resetCustomerDetails,
  resetAll,
} = salesDashboardSlice.actions;

export default salesDashboardSlice.reducer;

export const salesDashboardSliceMethods = {
  getSummary,
  getStateWise,
  getStateGraph,
  getOrderTrend,
  getOrderStatus,
  getCustomerWise,
  getItemWise,
  getCityWise,
  getCustomers,
  getInactiveCustomers,
  getNonOrderCustomers,
  getNonOrderCustomerList,
  getUserDropdown,
  getCustomerInvoices,
  getItemGroupAnalytics,
  getItemWiseDetails,
  getCustomerWiseDetails,
  getStateWiseDetails,
};
