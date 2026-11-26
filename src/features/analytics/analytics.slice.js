import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { analyticsService } from './analytics.service';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getSalesAnalytics = createAsyncThunk('analytics/getSalesAnalytics', analyticsService.getSalesAnalytics);

const getPurchaseAnalytics = createAsyncThunk('analytics/getPurchaseAnalytics', analyticsService.getPurchaseAnalytics);

const getPaymentAnalytics = createAsyncThunk('analytics/getPaymentAnalytics', analyticsService.getPaymentAnalytics);

export const fetchItemGroupAnalytics = createAsyncThunk('analytics/fetchItemGroupAnalytics', analyticsService.fetchItemGroupAnalytics);

export const addItemGroupAnalytics = createAsyncThunk('analytics/addItemGroupAnalytics', analyticsService.addItemGroupAnalytics);

export const updateItemGroupAnalytics = createAsyncThunk('analytics/updateItemGroupAnalytics', analyticsService.updateItemGroupAnalytics);

export const deleteItemGroupAnalytics = createAsyncThunk('analytics/deleteItemGroupAnalytics', analyticsService.deleteItemGroupAnalytics);

export const getRowWiseItemGroupAnalyticsByItemGroup = createAsyncThunk('analytics/getRowWiseItemGroupAnalyticsByItemGroup', analyticsService.getRowWiseItemGroupAnalyticsByItemGroup);

export const fetchSubItemGroupAnalytics = createAsyncThunk('analytics/fetchSubItemGroupAnalytics', analyticsService.fetchSubItemGroupAnalytics);

export const addSubItemGroupAnalytics = createAsyncThunk('analytics/addSubItemGroupAnalytics', analyticsService.addSubItemGroupAnalytics);

export const updateSubItemGroupAnalytics = createAsyncThunk('analytics/updateSubItemGroupAnalytics', analyticsService.updateSubItemGroupAnalytics);

export const deleteSubItemGroupAnalytics = createAsyncThunk('analytics/deleteSubItemGroupAnalytics', analyticsService.deleteSubItemGroupAnalytics);

export const getRowWiseSubItemGroupAnalytics = createAsyncThunk('analytics/getRowWiseSubItemGroupAnalytics', analyticsService.getRowWiseSubItemGroupAnalytics);

const getTopCustomersOfSalesAnalytics = createAsyncThunk('analytics/getTopCustomersOfSalesAnalytics', analyticsService.getTopCustomersOfSalesAnalytics);

const getCustomerWiseBusinessPerformance = createAsyncThunk('analytics/getCustomerWiseBusinessPerformance', analyticsService.getCustomerWiseBusinessPerformance);

const getTopItemsOfSalesAnalytics = createAsyncThunk('analytics/getTopItemsOfSalesAnalytics', analyticsService.getTopItemsOfSalesAnalytics);

const getCustomersWithSingleInvoiceAnalytics = createAsyncThunk('analytics/getCustomersWithSingleInvoiceAnalytics', analyticsService.getCustomersWithSingleInvoiceAnalytics);

const getTopVendorsByAmountPurchaseAnalytics = createAsyncThunk('analytics/getTopVendorsByAmountPurchaseAnalytics', analyticsService.getTopVendorsByAmountPurchaseAnalytics);

const getTopVendorsByRevenuePurchaseAnalytics = createAsyncThunk('analytics/getTopVendorsByRevenuePurchaseAnalytics', analyticsService.getTopVendorsByRevenuePurchaseAnalytics);

const getTopVendorsByItemsPurchaseAnalytics = createAsyncThunk('analytics/getTopVendorsByItemsPurchaseAnalytics', analyticsService.getTopVendorsByItemsPurchaseAnalytics);

const getTopCustomerByAmountPaymentReceivedAnalytics = createAsyncThunk('analytics/getTopCustomerByAmountPaymentReceivedAnalytics', analyticsService.getTopCustomerByAmountPaymentReceivedAnalytics);

const getRecentPaymentReceivedAnalytics = createAsyncThunk('analytics/getRecentPaymentReceivedAnalytics', analyticsService.getRecentPaymentReceivedAnalytics);

const getUpcomingPaymentReceivedByInvoiceAnalytics = createAsyncThunk('analytics/getUpcomingPaymentReceivedByInvoiceAnalytics', analyticsService.getUpcomingPaymentReceivedByInvoiceAnalytics);

const getOverDueInvoiceAnalytics = createAsyncThunk('analytics/getOverDueInvoiceAnalytics', analyticsService.getOverDueInvoiceAnalytics);

const getItemProcessAnalytics = createAsyncThunk('analytics/getItemProcessAnalytics', analyticsService.getItemProcessAnalytics);

const getTopVendorsByAmountPaymentMadeAnalytics = createAsyncThunk('analytics/getTopVendorsByAmountPaymentMadeAnalytics', analyticsService.getTopVendorsByAmountPaymentMadeAnalytics);

const getRecentPaymentMadeAnalytics = createAsyncThunk('analytics/getRecentPaymentMadeAnalytics', analyticsService.getRecentPaymentMadeAnalytics);

const getUpcomingPaymentMadeByBillsAnalytics = createAsyncThunk('analytics/getUpcomingPaymentMadeByBillsAnalytics', analyticsService.getUpcomingPaymentMadeByBillsAnalytics);

const getOverDueBillsAnalytics = createAsyncThunk('analytics/getOverDueBillsAnalytics', analyticsService.getOverDueBillsAnalytics);

const getSalesOrderRmAnalytics = createAsyncThunk('analytics/getSalesOrderRmAnalytics', analyticsService.getSalesOrderRmAnalytics);

const getItemWiseRmAnalytics = createAsyncThunk('analytics/getItemWiseRmAnalytics', analyticsService.getItemWiseRmAnalytics);

const getSalesOrderWiseRmAnalytics = createAsyncThunk('analytics/getSalesOrderWiseRmAnalytics', analyticsService.getSalesOrderWiseRmAnalytics);

const getGeneralSalesAnalytics = createAsyncThunk('analytics/getGeneralSalesAnalytics', analyticsService.getGeneralSalesAnalytics);

const createGeneralSalesAnalytics = createAsyncThunk('analytics/createGeneralSalesAnalytics', analyticsService.createGeneralSalesAnalytics);

const getGeneralSalesAnalyticsById = createAsyncThunk('analytics/getGeneralSalesAnalyticsById', analyticsService.getGeneralSalesAnalyticsById);

const updateGeneralSalesAnalytics = createAsyncThunk('analytics/updateGeneralSalesAnalytics', analyticsService.updateGeneralSalesAnalytics);

const deleteGeneralSalesAnalytics = createAsyncThunk('analytics/deleteGeneralSalesAnalytics', analyticsService.deleteGeneralSalesAnalytics);

export const analyticsSlice = createSlice({
  name: 'analytics',
  initialState: {
    salesAnalytics: null,
    topCustomersOfSalesAnalytics: null,
    customerWiseBusinessPerformance: null,
    topItemsOfSalesAnalytics: null,
    customersWithSingleInvoiceAnalytics: null,
    topVendorsByAmountPurchaseAnalytics: null,
    topVendorsByRevenuePurchaseAnalytics: null,
    topVendorsByItemsPurchaseAnalytics: null,
    purchaseAnalytics: null,
    paymentAnalytics: null,
    topCustomerByAmountPaymentReceivedAnalytics: null,
    recentPaymentReceivedAnalytics: null,
    upcomingPaymentReceivedByInvoiceAnalytics: null,
    overDueInvoiceAnalytics: null,
    itemProcessAnalytics: null,
    topVendorsByAmountPaymentMadeAnalytics: null,
    recentPaymentMadeAnalytics: null,
    upcomingPaymentMadeByBillsAnalytics: null,
    overDueBillsAnalytics: null,
    itemGroupAnalytics: null,
    subItemGroupAnalytics: null,
    rowWiseItemGroupAnalytics: null,
    salesOrderRmAnalytics: null,
    itemWiseRmAnalytics: null,
    salesOrderWiseRmAnalytics: null,
    generalSalesAnalyticsList: [],
    generalSalesAnalyticsListLoading: false,
    generalSalesAnalyticsListError: null,
    createGeneralSalesAnalyticsLoading: false,
    createGeneralSalesAnalyticsError: null,
    generalSalesAnalyticsById: null,
    generalSalesAnalyticsByIdLoading: false,
    generalSalesAnalyticsByIdError: null,
    updateGeneralSalesAnalyticsLoading: false,
    deleteGeneralSalesAnalyticsLoading: false,
    message: null,
    loading: false,
    deleteLoading: false,
    updateLoading: false,
    addLoading: false,
    error: null,
    pagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
    },
  },
  reducers: {
    resetSalesAnalytics: state => {
      state.salesAnalytics = null;
    },
    resetPurchaseAnalytics: state => {
      state.purchaseAnalytics = null;
    },
    resetPaymentAnalytics: state => {
      state.paymentAnalytics = null;
    },
    resetItemGroupAnalytics: state => {
      state.itemGroupAnalytics = null;
    },
    resetSubItemGroupAnalytics: state => {
      state.subItemGroupAnalytics = null;
    },
    resetTopCustomersOfSalesAnalytics: state => {
      state.topCustomersOfSalesAnalytics = null;
    },
    resetCustomerWiseBusinessPerformance: state => {
      state.customerWiseBusinessPerformance = null;
    },
    resetTopItemsOfSalesAnalytics: state => {
      state.topItemsOfSalesAnalytics = null;
    },
    resetCustomersWithSingleInvoiceAnalytics: state => {
      state.customersWithSingleInvoiceAnalytics = null;
    },
    resetTopVendorsByAmountPurchaseAnalytics: state => {
      state.topVendorsByAmountPurchaseAnalytics = null;
    },
    resetTopVendorsByRevenuePurchaseAnalytics: state => {
      state.topVendorsByRevenuePurchaseAnalytics = null;
    },
    resetTopVendorsByItemsPurchaseAnalytics: state => {
      state.topVendorsByItemsPurchaseAnalytics = null;
    },
    resetTopCustomerByAmountPaymentReceivedAnalytics: state => {
      state.topCustomerByAmountPaymentReceivedAnalytics = null;
    },
    resetRecentPaymentReceivedAnalytics: state => {
      state.recentPaymentReceivedAnalytics = null;
    },
    resetUpcomingPaymentReceivedByInvoiceAnalytics: state => {
      state.upcomingPaymentReceivedByInvoiceAnalytics = null;
    },
    resetOverDueInvoiceAnalytics: state => {
      state.overDueInvoiceAnalytics = null;
    },
    resetItemProcessAnalytics: state => {
      state.itemProcessAnalytics = null;
    },
    resetTopVendorsByAmountPaymentMadeAnalytics: state => {
      state.topVendorsByAmountPaymentMadeAnalytics = null;
    },
    resetRecentPaymentMadeAnalytics: state => {
      state.recentPaymentMadeAnalytics = null;
    },
    resetUpcomingPaymentMadeByBillsAnalytics: state => {
      state.upcomingPaymentMadeByBillsAnalytics = null;
    },
    resetOverDueBillsAnalytics: state => {
      state.overDueBillsAnalytics = null;
    },
    resetSalesOrderRmAnalytics: state => {
      state.salesOrderRmAnalytics = null;
    },
    resetGeneralSalesAnalyticsList: state => {
      state.generalSalesAnalyticsList = [];
    },
    resetGeneralSalesAnalyticsById: state => {
      state.generalSalesAnalyticsById = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getSalesAnalytics.pending, state => {
        state.loading = true;
      })
      .addCase(getSalesAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.salesAnalytics = action.payload.data;
        state.message = action.payload;
      })
      .addCase(getSalesAnalytics.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.error = action.error.message;
        }
      })
      .addCase(getTopCustomersOfSalesAnalytics.pending, state => {
        state.loading = true;
      })
      .addCase(getTopCustomersOfSalesAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.topCustomersOfSalesAnalytics = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalRecords: action.payload.extras.totalRecords,
        };
        state.message = action.payload;
      })
      .addCase(getTopCustomersOfSalesAnalytics.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.error = action.error.message;
        }
      })
      .addCase(getCustomerWiseBusinessPerformance.pending, state => {
        state.loading = true;
      })
      .addCase(getCustomerWiseBusinessPerformance.fulfilled, (state, action) => {
        state.loading = false;
        state.customerWiseBusinessPerformance = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalRecords: action.payload.extras.totalRecords,
        };
        state.message = action.payload;
      })
      .addCase(getCustomerWiseBusinessPerformance.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.error = action.error.message;
        }
      })
      .addCase(getTopItemsOfSalesAnalytics.pending, state => {
        state.loading = true;
      })
      .addCase(getTopItemsOfSalesAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.topItemsOfSalesAnalytics = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalRecords: action.payload.extras.totalRecords,
        };
        state.message = action.payload;
      })
      .addCase(getTopItemsOfSalesAnalytics.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.error = action.error.message;
        }
      })
      .addCase(getCustomersWithSingleInvoiceAnalytics.pending, state => {
        state.loading = true;
      })
      .addCase(getCustomersWithSingleInvoiceAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.customersWithSingleInvoiceAnalytics = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalRecords: action.payload.extras.totalRecords,
        };
        state.message = action.payload;
      })
      .addCase(getCustomersWithSingleInvoiceAnalytics.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.error = action.error.message;
        }
      })
      .addCase(getPurchaseAnalytics.pending, state => {
        state.loading = true;
      })
      .addCase(getPurchaseAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.purchaseAnalytics = action.payload.data;
        state.message = action.payload;
      })
      .addCase(getPurchaseAnalytics.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.error = action.error.message;
        }
      })
      .addCase(getTopVendorsByItemsPurchaseAnalytics.pending, state => {
        state.loading = true;
      })
      .addCase(getTopVendorsByItemsPurchaseAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.topVendorsByItemsPurchaseAnalytics = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalRecords: action.payload.extras.totalRecords,
        };
        state.message = action.payload;
      })
      .addCase(getTopVendorsByItemsPurchaseAnalytics.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.error = action.error.message;
        }
      })
      .addCase(getTopVendorsByRevenuePurchaseAnalytics.pending, state => {
        state.loading = true;
      })
      .addCase(getTopVendorsByRevenuePurchaseAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.topVendorsByRevenuePurchaseAnalytics = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalRecords: action.payload.extras.totalRecords,
        };
        state.message = action.payload;
      })
      .addCase(getTopVendorsByRevenuePurchaseAnalytics.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.error = action.error.message;
        }
      })
      .addCase(getTopVendorsByAmountPurchaseAnalytics.pending, state => {
        state.loading = true;
      })
      .addCase(getTopVendorsByAmountPurchaseAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.topVendorsByAmountPurchaseAnalytics = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalRecords: action.payload.extras.totalRecords,
        };
        state.message = action.payload;
      })
      .addCase(getTopVendorsByAmountPurchaseAnalytics.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.error = action.error.message;
        }
      })
      .addCase(getPaymentAnalytics.pending, state => {
        state.loading = true;
      })
      .addCase(getPaymentAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentAnalytics = action.payload.data;
        state.message = action.payload;
      })
      .addCase(getPaymentAnalytics.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.error = action.error.message;
        }
      })
      .addCase(getTopCustomerByAmountPaymentReceivedAnalytics.pending, state => {
        state.loading = true;
      })
      .addCase(getTopCustomerByAmountPaymentReceivedAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.topCustomerByAmountPaymentReceivedAnalytics = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalRecords: action.payload.extras.totalRecords,
        };
        state.message = action.payload;
      })
      .addCase(getTopCustomerByAmountPaymentReceivedAnalytics.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.error = action.error.message;
        }
      })
      .addCase(getRecentPaymentReceivedAnalytics.pending, state => {
        state.loading = true;
      })
      .addCase(getRecentPaymentReceivedAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.recentPaymentReceivedAnalytics = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalRecords: action.payload.extras.totalRecords,
          totalAmount: action.payload.extras.totalAmount ?? 0,
        };
        state.message = action.payload;
      })
      .addCase(getRecentPaymentReceivedAnalytics.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.error = action.error.message;
        }
      })
      .addCase(getUpcomingPaymentReceivedByInvoiceAnalytics.pending, state => {
        state.loading = true;
      })
      .addCase(getUpcomingPaymentReceivedByInvoiceAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.upcomingPaymentReceivedByInvoiceAnalytics = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalRecords: action.payload.extras.totalRecords,
        };
        state.message = action.payload;
      })
      .addCase(getUpcomingPaymentReceivedByInvoiceAnalytics.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.error = action.error.message;
        }
      })
      .addCase(getOverDueInvoiceAnalytics.pending, state => {
        state.loading = true;
      })
      .addCase(getOverDueInvoiceAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.overDueInvoiceAnalytics = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalRecords: action.payload.extras.totalRecords,
        };
        state.message = action.payload;
      })
      .addCase(getOverDueInvoiceAnalytics.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.error = action.error.message;
        }
      })
      .addCase(getItemProcessAnalytics.pending, state => {
        state.loading = true;
      })
      .addCase(getItemProcessAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.itemProcessAnalytics = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalRecords: action.payload.extras.totalRecords,
        };
        state.message = action.payload;
      })
      .addCase(getItemProcessAnalytics.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.error = action.error.message;
        }
      })

      .addCase(getTopVendorsByAmountPaymentMadeAnalytics.pending, state => {
        state.loading = true;
      })
      .addCase(getTopVendorsByAmountPaymentMadeAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.topVendorsByAmountPaymentMadeAnalytics = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalRecords: action.payload.extras.totalRecords,
        };
        state.message = action.payload;
      })
      .addCase(getTopVendorsByAmountPaymentMadeAnalytics.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.error = action.error.message;
        }
      })
      .addCase(getRecentPaymentMadeAnalytics.pending, state => {
        state.loading = true;
      })
      .addCase(getRecentPaymentMadeAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.recentPaymentMadeAnalytics = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalRecords: action.payload.extras.totalRecords,
          totalAmount: action.payload.extras.totalAmount ?? 0,
        };
        state.message = action.payload;
      })
      .addCase(getRecentPaymentMadeAnalytics.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.error = action.error.message;
        }
      })
      .addCase(getUpcomingPaymentMadeByBillsAnalytics.pending, state => {
        state.loading = true;
      })
      .addCase(getUpcomingPaymentMadeByBillsAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.upcomingPaymentMadeByBillsAnalytics = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalRecords: action.payload.extras.totalRecords,
        };
        state.message = action.payload;
      })
      .addCase(getUpcomingPaymentMadeByBillsAnalytics.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.error = action.error.message;
        }
      })
      .addCase(getOverDueBillsAnalytics.pending, state => {
        state.loading = true;
      })
      .addCase(getOverDueBillsAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.overDueBillsAnalytics = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalRecords: action.payload.extras.totalRecords,
        };
        state.message = action.payload;
      })
      .addCase(getOverDueBillsAnalytics.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.error = action.error.message;
        }
      })
      .addCase(fetchItemGroupAnalytics.pending, state => {
        state.loading = true;
      })
      .addCase(fetchItemGroupAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.itemGroupAnalytics = action.payload.data;
        state.message = action.payload;
      })
      .addCase(fetchItemGroupAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(addItemGroupAnalytics.pending, state => {
        state.addLoading = true;
      })
      .addCase(addItemGroupAnalytics.fulfilled, (state, action) => {
        state.addLoading = false;
        state.message = action.payload;
        Toast.success('Block created successfully.');
      })
      .addCase(addItemGroupAnalytics.rejected, (state, action) => {
        state.addLoading = false;
        state.error = action.error.message;
      })
      .addCase(updateItemGroupAnalytics.pending, state => {
        state.updateLoading = true;
      })
      .addCase(updateItemGroupAnalytics.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.message = action.payload;
        Toast.success('Block updated successfully.');
      })
      .addCase(updateItemGroupAnalytics.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.error.message;
      })
      .addCase(deleteItemGroupAnalytics.pending, state => {
        state.deleteLoading = true;
      })
      .addCase(deleteItemGroupAnalytics.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.message = action.payload;
      })
      .addCase(deleteItemGroupAnalytics.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.error.message;
      })
      .addCase(getRowWiseItemGroupAnalyticsByItemGroup.fulfilled, (state, action) => {
        state.rowWiseItemGroupAnalytics = action.payload.data;
        state.message = action.payload;
      })
      .addCase(getRowWiseItemGroupAnalyticsByItemGroup.rejected, (state, action) => {
        state.error = action.error.message;
      })
      .addCase(fetchSubItemGroupAnalytics.pending, state => {
        state.loading = true;
      })
      .addCase(fetchSubItemGroupAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.subItemGroupAnalytics = action.payload.data;
        state.message = action.payload;
      })
      .addCase(fetchSubItemGroupAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(addSubItemGroupAnalytics.pending, state => {
        state.addLoading = true;
      })
      .addCase(addSubItemGroupAnalytics.fulfilled, (state, action) => {
        state.addLoading = false;
        state.message = action.payload;
        Toast.success('Block created successfully.');
      })
      .addCase(addSubItemGroupAnalytics.rejected, (state, action) => {
        state.addLoading = false;
        state.error = action.error.message;
      })
      .addCase(updateSubItemGroupAnalytics.pending, state => {
        state.updateLoading = true;
      })
      .addCase(updateSubItemGroupAnalytics.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.message = action.payload;
        Toast.success('Block updated successfully.');
      })
      .addCase(updateSubItemGroupAnalytics.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.error.message;
      })
      .addCase(deleteSubItemGroupAnalytics.pending, state => {
        state.deleteLoading = true;
      })
      .addCase(deleteSubItemGroupAnalytics.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.message = action.payload;
      })
      .addCase(deleteSubItemGroupAnalytics.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.error.message;
      })
      .addCase(getRowWiseSubItemGroupAnalytics.fulfilled, (state, action) => {
        state.rowWiseItemGroupAnalytics = action.payload.data;
        state.message = action.payload;
      })
      .addCase(getRowWiseSubItemGroupAnalytics.rejected, (state, action) => {
        state.error = action.error.message;
      })
      .addCase(getSalesOrderRmAnalytics.pending, state => {
        state.loading = true;
      })
      .addCase(getSalesOrderRmAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.salesOrderRmAnalytics = action.payload.data;
      })
      .addCase(getSalesOrderRmAnalytics.rejected, state => {
        state.loading = false;
        state.salesOrderRmAnalytics = null;
      })
      .addCase(getItemWiseRmAnalytics.pending, state => {
        state.loading = true;
      })
      .addCase(getItemWiseRmAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.itemWiseRmAnalytics = action.payload.data;
      })
      .addCase(getItemWiseRmAnalytics.rejected, state => {
        state.loading = false;
        state.itemWiseRmAnalytics = null;
      })
      .addCase(getSalesOrderWiseRmAnalytics.pending, state => {
        state.loading = true;
      })
      .addCase(getSalesOrderWiseRmAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.salesOrderWiseRmAnalytics = action.payload.data;
      })
      .addCase(getSalesOrderWiseRmAnalytics.rejected, state => {
        state.loading = false;
        state.salesOrderWiseRmAnalytics = null;
      })
      .addCase(getGeneralSalesAnalytics.pending, state => {
        state.generalSalesAnalyticsListLoading = true;
        state.generalSalesAnalyticsListError = null;
      })
      .addCase(getGeneralSalesAnalytics.fulfilled, (state, action) => {
        state.generalSalesAnalyticsListLoading = false;
        state.generalSalesAnalyticsList = action.payload?.data ?? action.payload ?? [];
        state.message = action.payload?.message;
      })
      .addCase(getGeneralSalesAnalytics.rejected, (state, action) => {
        state.generalSalesAnalyticsListLoading = false;
        state.generalSalesAnalyticsListError = action.error.message;
      })
      .addCase(createGeneralSalesAnalytics.pending, state => {
        state.createGeneralSalesAnalyticsLoading = true;
        state.createGeneralSalesAnalyticsError = null;
      })
      .addCase(createGeneralSalesAnalytics.fulfilled, (state, action) => {
        state.createGeneralSalesAnalyticsLoading = false;
        state.message = action.payload?.message;
        Toast.success(action.payload?.message || 'Report created successfully');
      })
      .addCase(createGeneralSalesAnalytics.rejected, (state, action) => {
        state.createGeneralSalesAnalyticsLoading = false;
        state.createGeneralSalesAnalyticsError = action.error.message;
        if (action.error.name !== 'AbortError' && action.error.message !== 'canceled' && action.error.message !== 'CanceledError') {
          Toast.error(action.error.message);
        }
      })
      .addCase(getGeneralSalesAnalyticsById.pending, state => {
        state.generalSalesAnalyticsByIdLoading = true;
        state.generalSalesAnalyticsByIdError = null;
      })
      .addCase(getGeneralSalesAnalyticsById.fulfilled, (state, action) => {
        state.generalSalesAnalyticsByIdLoading = false;
        const payload = action.payload?.data ?? action.payload;
        state.generalSalesAnalyticsById = payload;
        if (action.payload?.extras) {
          state.pagination = {
            page: action.payload.extras.page,
            limit: action.payload.extras.limit,
            totalPages: action.payload.extras.totalPages,
            totalRecords: action.payload.extras.totalRecords,
          };
        }
      })
      .addCase(getGeneralSalesAnalyticsById.rejected, (state, action) => {
        state.generalSalesAnalyticsByIdLoading = false;
        state.generalSalesAnalyticsById = null;
        state.generalSalesAnalyticsByIdError = action.error.message;
      })
      .addCase(updateGeneralSalesAnalytics.pending, state => {
        state.updateGeneralSalesAnalyticsLoading = true;
      })
      .addCase(updateGeneralSalesAnalytics.fulfilled, (state, action) => {
        state.updateGeneralSalesAnalyticsLoading = false;
        state.message = action.payload?.message;
        Toast.success(action.payload?.message || 'Report updated successfully');
      })
      .addCase(updateGeneralSalesAnalytics.rejected, (state, action) => {
        state.updateGeneralSalesAnalyticsLoading = false;
        if (action.error?.name !== 'AbortError' && action.error?.message !== 'canceled' && action.error?.message !== 'CanceledError') {
          Toast.error(action.error?.message);
        }
      })
      .addCase(deleteGeneralSalesAnalytics.pending, state => {
        state.deleteGeneralSalesAnalyticsLoading = true;
      })
      .addCase(deleteGeneralSalesAnalytics.fulfilled, (state, action) => {
        state.deleteGeneralSalesAnalyticsLoading = false;
        state.message = action.payload?.message;
        Toast.success(action.payload?.message || 'Report deleted successfully');
      })
      .addCase(deleteGeneralSalesAnalytics.rejected, (state, action) => {
        state.deleteGeneralSalesAnalyticsLoading = false;
        if (action.error?.name !== 'AbortError' && action.error?.message !== 'canceled' && action.error?.message !== 'CanceledError') {
          Toast.error(action.error?.message);
        }
      });
  },
});

export const analyticsSliceMethods = {
  getSalesAnalytics,
  getTopCustomersOfSalesAnalytics,
  getCustomerWiseBusinessPerformance,
  getTopItemsOfSalesAnalytics,
  getCustomersWithSingleInvoiceAnalytics,
  getPurchaseAnalytics,
  getTopVendorsByAmountPurchaseAnalytics,
  getTopVendorsByRevenuePurchaseAnalytics,
  getTopVendorsByItemsPurchaseAnalytics,
  getPaymentAnalytics,
  getTopCustomerByAmountPaymentReceivedAnalytics,
  getRecentPaymentReceivedAnalytics,
  getUpcomingPaymentReceivedByInvoiceAnalytics,
  getOverDueInvoiceAnalytics,
  getItemProcessAnalytics,
  getTopVendorsByAmountPaymentMadeAnalytics,
  getRecentPaymentMadeAnalytics,
  getUpcomingPaymentMadeByBillsAnalytics,
  getOverDueBillsAnalytics,
  fetchItemGroupAnalytics,
  addItemGroupAnalytics,
  updateItemGroupAnalytics,
  deleteItemGroupAnalytics,
  getRowWiseItemGroupAnalyticsByItemGroup,
  fetchSubItemGroupAnalytics,
  addSubItemGroupAnalytics,
  updateSubItemGroupAnalytics,
  deleteSubItemGroupAnalytics,
  getRowWiseSubItemGroupAnalytics,
  getSalesOrderRmAnalytics,
  getItemWiseRmAnalytics,
  getSalesOrderWiseRmAnalytics,
  getGeneralSalesAnalytics,
  createGeneralSalesAnalytics,
  getGeneralSalesAnalyticsById,
  updateGeneralSalesAnalytics,
  deleteGeneralSalesAnalytics,
};

export const {
  resetSalesAnalytics,
  resetPurchaseAnalytics,
  resetPaymentAnalytics,
  resetItemGroupAnalytics,
  resetSubItemGroupAnalytics,
  resetTopCustomersOfSalesAnalytics,
  resetCustomerWiseBusinessPerformance,
  resetTopItemsOfSalesAnalytics,
  resetCustomersWithSingleInvoiceAnalytics,
  resetTopVendorsByAmountPurchaseAnalytics,
  resetTopVendorsByRevenuePurchaseAnalytics,
  resetTopVendorsByItemsPurchaseAnalytics,
  resetTopCustomerByAmountPaymentReceivedAnalytics,
  resetRecentPaymentReceivedAnalytics,
  resetUpcomingPaymentReceivedByInvoiceAnalytics,
  resetOverDueInvoiceAnalytics,
  resetItemProcessAnalytics,
  resetTopVendorsByAmountPaymentMadeAnalytics,
  resetRecentPaymentMadeAnalytics,
  resetUpcomingPaymentMadeByBillsAnalytics,
  resetOverDueBillsAnalytics,
  resetSalesOrderRmAnalytics,
  resetGeneralSalesAnalyticsList,
  resetGeneralSalesAnalyticsById,
} = analyticsSlice.actions;
export default analyticsSlice.reducer;
