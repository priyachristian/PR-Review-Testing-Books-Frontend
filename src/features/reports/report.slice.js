import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { reportService } from './report.service';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getReports = createAsyncThunk('report/getReports', reportService.getReports);

const getBankLedger = createAsyncThunk('report/getBankLedger', reportService.getBankLedger);

const getPurchaseLedger = createAsyncThunk('report/getPurchaseLedger', reportService.getPurchaseLedger);

const getPurchaseLedgerDetail = createAsyncThunk('report/getPurchaseLedgerDetail', reportService.getPurchaseLedgerDetail);

const getPurchaseLedgerDetailExport = createAsyncThunk('report/getPurchaseLedgerDetailExport', reportService.getPurchaseLedgerDetailExport);

const getSalesLedger = createAsyncThunk('report/getSalesLedger', reportService.getSalesLedger);

const getSalesLedgerDetail = createAsyncThunk('report/getSalesLedgerDetail', reportService.getSalesLedgerDetail);

const getSalesLedgerDetailExport = createAsyncThunk('report/getSalesLedgerDetailExport', reportService.getSalesLedgerDetailExport);

const getCreditorsReport = createAsyncThunk('report/getCreditorsReport', reportService.getCreditorsReport);

const getDebtorsReport = createAsyncThunk('report/getDebtorsReport', reportService.getDebtorsReport);

const getProfitAndLose = createAsyncThunk('report/getProfitAndLose', reportService.getProfitAndLose);

const getCustomerProfitAndLose = createAsyncThunk('report/getCustomerProfitAndLose', reportService.getCustomerProfitAndLose);

const getProfitAndLoseItemWise = createAsyncThunk('report/getProfitAndLoseItemWise', reportService.getProfitAndLoseItemWise);

const getProfitAndLoseItemWiseDetails = createAsyncThunk('report/getProfitAndLoseItemWiseDetails', reportService.getProfitAndLoseItemWiseDetails);

const getProfitAndLoseCustomerMonthWise = createAsyncThunk('report/getProfitAndLoseCustomerMonthWise', reportService.getProfitAndLoseCustomerMonthWise);

const getProfitAndLossBatchItemDetails = createAsyncThunk('report/getProfitAndLossBatchItemDetails', reportService.getProfitAndLossBatchItemDetails);

const getProfitAndLossBatchCustomerDetails = createAsyncThunk('report/getProfitAndLossBatchCustomerDetails', reportService.getProfitAndLossBatchCustomerDetails);

const getProfitAndLossByProductionOrder = createAsyncThunk('report/getProfitAndLossByProductionOrder', reportService.getProfitAndLossByProductionOrder);

const getProfitAndLossByProductionOrderDetails = createAsyncThunk('report/getProfitAndLossByProductionOrderDetails', async (productionOrderData, { rejectWithValue }) => {
  try {
    const data = await reportService.getProfitAndLossByProductionOrderDetails(productionOrderData);
    return data;
  } catch (error) {
    console.error('Error in getProfitAndLossByProductionOrderDetails thunk:', error);
    return rejectWithValue(error?.response?.data?.message || error.message || 'Something went wrong');
  }
});

const getItemAnalytics = createAsyncThunk('report/getItemAnalytics', reportService.getItemAnalytics);

const getAgingReport = createAsyncThunk('report/getAgingReport', reportService.getAgingReport);

const getCustomerAging = createAsyncThunk('report/getCustomerAging', reportService.getCustomerAging);

const getVendorAging = createAsyncThunk('report/getVendorAging', reportService.getVendorAging);

const getCustomerAgingDetails = createAsyncThunk('report/getCustomerAgingDetails', reportService.getCustomerAgingDetails);

const getVendorAgingDetails = createAsyncThunk('report/getVendorAgingDetails', reportService.getVendorAgingDetails);

const getCustomerAgingBucket = createAsyncThunk('report/getCustomerAgingBucket', reportService.getCustomerAgingBucket);

const getVendorAgingBucket = createAsyncThunk('report/getVendorAgingBucket', reportService.getVendorAgingBucket);

const getUpcomingPayments = createAsyncThunk('report/getUpcomingPayments', reportService.getUpcomingPayments);

const getBalanceSheet = createAsyncThunk('report/getBalanceSheet', reportService.getBalanceSheet);

const getProfitLossSheet = createAsyncThunk('report/getProfitLossSheet', reportService.getProfitLossSheet);

const getDynamicReports = createAsyncThunk('report/getDynamicReports', async payload => {
  try {
    const data = await reportService.getDynamicReports(payload);
    return data;
  } catch (error) {
    console.error('Error in getDynamicReports thunk:', error);
    throw error.response?.data?.message || error.message || 'Something went wrong';
  }
});

const createDynamicReport = createAsyncThunk('report/createDynamicReport', async payload => {
  try {
    const data = await reportService.createDynamicReport(payload);
    return data;
  } catch (error) {
    console.error('Error in createDynamicReport thunk:', error);
    throw error.response?.data?.message || error.message || 'Something went wrong';
  }
});

const getDynamicReportById = createAsyncThunk('report/getDynamicReportById', async payload => {
  try {
    const data = await reportService.getDynamicReportById(payload);
    return data;
  } catch (error) {
    console.error('Error in getDynamicReportById thunk:', error);
    throw error.response?.data?.message || error.message || 'Something went wrong';
  }
});

const updateDynamicReport = createAsyncThunk('report/updateDynamicReport', async ({ id, ...payload }) => {
  try {
    const data = await reportService.updateDynamicReport({ id, ...payload });
    return data;
  } catch (error) {
    console.error('Error in updateDynamicReport thunk:', error);
    throw error.response?.data?.message || error.message || 'Something went wrong';
  }
});

const deleteDynamicReport = createAsyncThunk('report/deleteDynamicReport', async id => {
  try {
    const data = await reportService.deleteDynamicReport(id);
    return data;
  } catch (error) {
    console.error('Error in deleteDynamicReport thunk:', error);
    throw error.response?.data?.message || error.message || 'Something went wrong';
  }
});

export const reportSlice = createSlice({
  name: 'report',
  initialState: {
    reports: [],
    bankLedger: [],
    itemAnalytics: null,
    agingReport: null,
    customerAgingReport: null,
    vendorAgingReport: null,
    customerAgingDetails: null,
    vendorAgingDetails: null,
    bucketData: null,
    bucketLoading: false,
    bucketError: null,
    upcomingPayments: null,
    upcomingPaymentsLoading: false,
    upcomingPaymentsError: null,
    purchaseLedger: null,
    purchaseLedgerDetail: null,
    creditorsReport: null,
    debtorsReport: null,
    salesLedger: null,
    salesLedgerDetail: null,
    profitAndLose: null,
    profitAndLoseCustomerMonthWise: null,
    profitAndLossBatchItemDetails: null,
    profitAndLossBatchCustomerDetails: null,
    profitAndLossByProductionOrder: null,
    profitAndLossByProductionOrderDetails: null,
    balanceSheet: null,
    balanceSheetLoading: false,
    balanceSheetError: null,
    profitLossSheet: null,
    profitLossSheetLoading: false,
    profitLossSheetError: null,

    dynamicReportsList: [],
    dynamicReportsListLoading: false,
    dynamicReportsListError: null,
    createDynamicReportLoading: false,
    createDynamicReportError: null,
    dynamicReportById: null,
    dynamicReportByIdLoading: false,
    dynamicReportByIdError: null,
    updateDynamicReportLoading: false,
    deleteDynamicReportLoading: false,
    detailLoading: false,
    modelLoading: false,
    pagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
      totalRecords: 0,
    },
    salesLedgerDetailPagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
    },
    purchaseLedgerDetailPagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
    },
    customerProfitAndLose: null,
    profitAndLoseItemWise: null,
    profitAndLoseItemWiseDetails: null,
    exportLoading: false,
    loading: false,
    error: null,
  },
  reducers: {
    clearReportsData: state => {
      state.reports = [];
    },
    clearBankData: state => {
      state.bankLedger = [];
      state.pagination = {
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        totalPages: 1,
        totalResults: 0,
        totalRecords: 0,
      };
    },
    clearPurchaseLedger: state => {
      state.purchaseLedger = null;
    },
    clearPurchaseLedgerDetail: state => {
      state.purchaseLedgerDetail = null;
    },
    clearSalesLedger: state => {
      state.salesLedger = null;
    },
    clearSalesLedgerDetail: state => {
      state.salesLedgerDetail = null;
    },
    clearCreditorsReport: state => {
      state.creditorsReport = null;
    },
    clearDebtorsReport: state => {
      state.debtorsReport = null;
    },
    clearProfitAndLose: state => {
      state.profitAndLose = null;
    },
    clearCustomerProfitAndLose: state => {
      state.customerProfitAndLose = null;
    },
    clearProfitAndLoseItemWise: state => {
      state.profitAndLoseItemWise = null;
    },
    clearProfitAndLoseItemWiseDetails: state => {
      state.profitAndLoseItemWiseDetails = null;
    },
    clearProfitAndLoseCustomerMonthWise: state => {
      state.profitAndLoseCustomerMonthWise = null;
    },
    clearProfitAndLossBatchItemDetails: state => {
      state.profitAndLossBatchItemDetails = null;
    },
    clearProfitAndLossBatchCustomerDetails: state => {
      state.profitAndLossBatchCustomerDetails = null;
    },
    clearItemAnalytics: state => {
      state.itemAnalytics = null;
    },
    clearAgingReport: state => {
      state.agingReport = null;
    },
    clearCustomerAgingReport: state => {
      state.customerAgingReport = null;
    },
    clearVendorAgingReport: state => {
      state.vendorAgingReport = null;
    },
    clearCustomerAgingDetails: state => {
      state.customerAgingDetails = null;
    },
    clearVendorAgingDetails: state => {
      state.vendorAgingDetails = null;
    },
    clearBucketData: state => {
      state.bucketData = null;
      state.bucketError = null;
    },
    clearUpcomingPayments: state => {
      state.upcomingPayments = null;
      state.upcomingPaymentsError = null;
    },
    clearBalanceSheet: state => {
      state.balanceSheet = null;
      state.balanceSheetError = null;
    },
    clearProfitLossSheet: state => {
      state.profitLossSheet = null;
      state.profitLossSheetError = null;
    },

    clearDynamicReportsList: state => {
      state.dynamicReportsList = [];
      state.dynamicReportsListError = null;
    },
    clearDynamicReportById: state => {
      state.dynamicReportById = null;
      state.dynamicReportByIdError = null;
    },
    clearPagination: state => {
      state.salesLedgerDetailPagination = {
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        totalPages: 1,
        totalResults: 0,
      };
      state.purchaseLedgerDetailPagination = {
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        totalPages: 1,
        totalResults: 0,
      };
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getReports.pending, state => {
        state.loading = true;
      })
      .addCase(getReports.fulfilled, (state, action) => {
        state.loading = false;
        state.reports = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getReports.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.reports = [];
          state.error = action.error.message;
        }
      })
      .addCase(getBankLedger.pending, state => {
        state.loading = true;
      })
      .addCase(getBankLedger.fulfilled, (state, action) => {
        state.loading = false;
        state.bankLedger = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalResults: action.payload.extras.totalResults,
          closingBalance: action.payload.extras.closingBalance,
          openingBalance: action.payload.extras.openingBalance,
          broughtForward: action.payload.extras.broughtForward,
          carriedOver: action.payload.extras.carriedOver,
          totalIn: action.payload.extras.totalIn,
          totalOut: action.payload.extras.totalOut,
        };
        state.message = action.payload.message;
      })
      .addCase(getBankLedger.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(getPurchaseLedger.pending, state => {
        state.loading = true;
      })
      .addCase(getPurchaseLedger.fulfilled, (state, action) => {
        state.loading = false;
        state.purchaseLedger = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getPurchaseLedger.rejected, (state, action) => {
        // Ignore abort-on-unmount so navigating to detail does not clear shared loading
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.purchaseLedger = null;
          state.error = action.error.message;
        }
      })
      .addCase(getPurchaseLedgerDetail.pending, state => {
        state.loading = true;
      })
      .addCase(getPurchaseLedgerDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.purchaseLedgerDetail = action.payload.data;
        state.purchaseLedgerDetailPagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalResults: action.payload.extras.totalResults,
          broughtForward: action.payload.extras.broughtForward,
          carriedOver: action.payload.extras.carriedOver,
          totalOverall: action.payload.extras.totalOverall,
        };
        state.message = action.payload.message;
      })
      .addCase(getPurchaseLedgerDetail.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.purchaseLedgerDetail = null;
          state.error = action.error.message;
        }
      })
      .addCase(getPurchaseLedgerDetailExport.pending, state => {
        state.exportLoading = true;
      })
      .addCase(getPurchaseLedgerDetailExport.fulfilled, state => {
        state.exportLoading = false;
      })
      .addCase(getPurchaseLedgerDetailExport.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.exportLoading = false;
          state.error = action.error.message;
        }
      })
      .addCase(getSalesLedger.pending, state => {
        state.loading = true;
      })
      .addCase(getSalesLedger.fulfilled, (state, action) => {
        state.loading = false;
        state.salesLedger = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getSalesLedger.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.salesLedger = null;
          state.error = action.error.message;
        }
      })
      .addCase(getSalesLedgerDetail.pending, state => {
        state.loading = true;
      })
      .addCase(getSalesLedgerDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.salesLedgerDetail = action.payload.data;
        state.salesLedgerDetailPagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalResults: action.payload.extras.totalResults,
          broughtForward: action.payload.extras.broughtForward,
          carriedOver: action.payload.extras.carriedOver,
          totalOverall: action.payload.extras.totalOverall,
        };
        state.message = action.payload.message;
      })
      .addCase(getSalesLedgerDetail.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.salesLedgerDetail = null;
          state.error = action.error.message;
        }
      })
      .addCase(getSalesLedgerDetailExport.pending, state => {
        state.exportLoading = true;
      })
      .addCase(getSalesLedgerDetailExport.fulfilled, state => {
        state.exportLoading = false;
      })
      .addCase(getSalesLedgerDetailExport.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.exportLoading = false;
          state.error = action.error.message;
        }
      })
      .addCase(getCreditorsReport.pending, state => {
        state.loading = true;
      })
      .addCase(getCreditorsReport.fulfilled, (state, action) => {
        state.loading = false;
        state.creditorsReport = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getCreditorsReport.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.creditorsReport = null;
          state.error = action.error.message;
        }
      })
      .addCase(getDebtorsReport.pending, state => {
        state.loading = true;
      })
      .addCase(getDebtorsReport.fulfilled, (state, action) => {
        state.loading = false;
        state.debtorsReport = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getDebtorsReport.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.debtorsReport = null;
          state.error = action.error.message;
        }
      })
      .addCase(getProfitAndLose.pending, state => {
        state.loading = true;
      })
      .addCase(getProfitAndLose.fulfilled, (state, action) => {
        state.loading = false;
        state.profitAndLose = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalResults: action.payload.extras.totalResults,
          totalRecords: action.payload.extras.totalRecords,
          summary: action.payload.extras.summary,
        };
        state.message = action.payload.message;
      })
      .addCase(getProfitAndLose.rejected, (state, action) => {
        state.loading = false;
        state.profitAndLose = null;
        state.error = action.error.message;
      })
      .addCase(getCustomerProfitAndLose.pending, state => {
        state.loading = true;
      })
      .addCase(getCustomerProfitAndLose.fulfilled, (state, action) => {
        state.loading = false;
        state.customerProfitAndLose = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalResults: action.payload.extras.totalResults,
          totalRecords: action.payload.extras.totalRecords,
          summary: action.payload.extras.summary,
        };
        state.message = action.payload.message;
      })
      .addCase(getCustomerProfitAndLose.rejected, (state, action) => {
        state.loading = false;
        state.customerProfitAndLose = null;
        state.error = action.error.message;
      })
      .addCase(getProfitAndLoseItemWise.pending, state => {
        state.loading = true;
      })
      .addCase(getProfitAndLoseItemWise.fulfilled, (state, action) => {
        state.loading = false;
        state.profitAndLoseItemWise = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalResults: action.payload.extras.totalResults,
          totalRecords: action.payload.extras.totalRecords,
          summary: action.payload.extras.summary,
        };
        state.message = action.payload.message;
      })
      .addCase(getProfitAndLoseItemWise.rejected, (state, action) => {
        state.loading = false;
        state.profitAndLoseItemWise = null;
        state.error = action.error.message;
      })
      .addCase(getProfitAndLoseItemWiseDetails.pending, state => {
        state.loading = true;
      })
      .addCase(getProfitAndLoseItemWiseDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.profitAndLoseItemWiseDetails = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalResults: action.payload.extras.totalResults,
          totalRecords: action.payload.extras.totalRecords,
          summary: action.payload.extras.summary,
        };
        state.message = action.payload.message;
      })
      .addCase(getProfitAndLoseItemWiseDetails.rejected, (state, action) => {
        state.loading = false;
        state.profitAndLoseItemWiseDetails = null;
        state.error = action.error.message;
      })
      .addCase(getProfitAndLoseCustomerMonthWise.pending, state => {
        state.loading = true;
      })
      .addCase(getProfitAndLoseCustomerMonthWise.fulfilled, (state, action) => {
        state.loading = false;
        state.profitAndLoseCustomerMonthWise = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalResults: action.payload.extras.totalResults,
          totalRecords: action.payload.extras.totalRecords,
          summary: action.payload.extras.summary,
        };
        state.message = action.payload.message;
      })
      .addCase(getProfitAndLoseCustomerMonthWise.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(getProfitAndLossBatchItemDetails.pending, state => {
        state.loading = true;
      })
      .addCase(getProfitAndLossBatchItemDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.profitAndLossBatchItemDetails = action.payload.data;
        state.pagination = {
          summary: action.payload.extras.summary,
        };
        state.message = action.payload.message;
      })
      .addCase(getProfitAndLossBatchItemDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(getProfitAndLossBatchCustomerDetails.pending, state => {
        state.loading = true;
      })
      .addCase(getProfitAndLossBatchCustomerDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.profitAndLossBatchCustomerDetails = action.payload.data;
        state.pagination = {
          summary: action.payload.extras.summary,
        };
        state.message = action.payload.message;
      })
      .addCase(getProfitAndLossBatchCustomerDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(getProfitAndLossByProductionOrder.pending, state => {
        state.modelLoading = true;
      })
      .addCase(getProfitAndLossByProductionOrder.fulfilled, (state, action) => {
        state.modelLoading = false;
        state.profitAndLossByProductionOrder = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getProfitAndLossByProductionOrder.rejected, (state, action) => {
        state.modelLoading = false;
        state.error = action.error.message;
      })
      .addCase(getProfitAndLossByProductionOrderDetails.pending, state => {
        state.detailLoading = true;
        state.profitAndLossByProductionOrderDetails = null;
      })
      .addCase(getProfitAndLossByProductionOrderDetails.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.profitAndLossByProductionOrderDetails = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getProfitAndLossByProductionOrderDetails.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.payload ?? action.error?.message;
      })
      .addCase(getItemAnalytics.pending, state => {
        state.loading = true;
      })
      .addCase(getItemAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.itemAnalytics = action.payload.data.items;
        state.pagination = {
          page: action.payload.data.page,
          limit: action.payload.data.limit,
          totalPages: action.payload.data.totalPages,
          totalRecords: action.payload.data.totalItems,
        };
        state.message = action.payload.message;
      })
      .addCase(getItemAnalytics.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.itemAnalytics = null;
          state.error = action.error.message;
        }
      })
      .addCase(getAgingReport.pending, state => {
        state.loading = true;
      })
      .addCase(getAgingReport.fulfilled, (state, action) => {
        state.loading = false;
        state.agingReport = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getAgingReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(getCustomerAging.pending, state => {
        state.loading = true;
      })
      .addCase(getCustomerAging.fulfilled, (state, action) => {
        state.loading = false;
        state.customerAgingReport = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getCustomerAging.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(getVendorAging.pending, state => {
        state.loading = true;
      })
      .addCase(getVendorAging.fulfilled, (state, action) => {
        state.loading = false;
        state.vendorAgingReport = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getVendorAging.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(getCustomerAgingDetails.pending, state => {
        state.detailLoading = true;
      })
      .addCase(getCustomerAgingDetails.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.customerAgingDetails = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getCustomerAgingDetails.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.error.message;
      })
      .addCase(getVendorAgingDetails.pending, state => {
        state.detailLoading = true;
      })
      .addCase(getVendorAgingDetails.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.vendorAgingDetails = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getVendorAgingDetails.rejected, (state, action) => {
        state.detailLoading = false;
        state.error = action.error.message;
      })
      .addCase(getCustomerAgingBucket.pending, state => {
        state.bucketLoading = true;
        state.bucketError = null;
      })
      .addCase(getCustomerAgingBucket.fulfilled, (state, action) => {
        state.bucketLoading = false;
        state.bucketData = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getCustomerAgingBucket.rejected, (state, action) => {
        state.bucketLoading = false;
        state.bucketError = action.error.message;
        state.bucketData = null;
      })
      .addCase(getVendorAgingBucket.pending, state => {
        state.bucketLoading = true;
        state.bucketError = null;
      })
      .addCase(getVendorAgingBucket.fulfilled, (state, action) => {
        state.bucketLoading = false;
        state.bucketData = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getVendorAgingBucket.rejected, (state, action) => {
        state.bucketLoading = false;
        state.bucketError = action.error.message;
        state.bucketData = null;
      })
      .addCase(getUpcomingPayments.pending, state => {
        state.upcomingPaymentsLoading = true;
        state.upcomingPaymentsError = null;
      })
      .addCase(getUpcomingPayments.fulfilled, (state, action) => {
        state.upcomingPaymentsLoading = false;
        // Handle response structure: action.payload = { data: {...}, code: 1, message: "..." }
        // Extract actual data, fallback to payload if structure is different
        const responseData = action.payload?.data || action.payload;
        state.upcomingPayments = responseData;
        state.message = action.payload?.message;
      })
      .addCase(getUpcomingPayments.rejected, (state, action) => {
        // A canceled request has already been replaced by a newer one that is still loading.
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.upcomingPaymentsLoading = false;
          state.upcomingPaymentsError = action.error.message;
          state.upcomingPayments = null;
        }
      })
      .addCase(getBalanceSheet.pending, state => {
        state.balanceSheetLoading = true;
        state.balanceSheetError = null;
      })
      .addCase(getBalanceSheet.fulfilled, (state, action) => {
        state.balanceSheetLoading = false;
        state.balanceSheet = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getBalanceSheet.rejected, (state, action) => {
        state.balanceSheetLoading = false;
        state.balanceSheet = null;
        state.balanceSheetError = action.error.message;
      })
      .addCase(getProfitLossSheet.pending, state => {
        state.profitLossSheetLoading = true;
        state.profitLossSheetError = null;
      })
      .addCase(getProfitLossSheet.fulfilled, (state, action) => {
        state.profitLossSheetLoading = false;
        state.profitLossSheet = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getProfitLossSheet.rejected, (state, action) => {
        state.profitLossSheetLoading = false;
        state.profitLossSheet = null;
        state.profitLossSheetError = action.error.message;
      })
      .addCase(getDynamicReports.pending, state => {
        state.dynamicReportsListLoading = true;
        state.dynamicReportsListError = null;
      })
      .addCase(getDynamicReports.fulfilled, (state, action) => {
        state.dynamicReportsListLoading = false;
        state.dynamicReportsList = action.payload?.data ?? action.payload ?? [];
        state.message = action.payload?.message;
      })
      .addCase(getDynamicReports.rejected, (state, action) => {
        state.dynamicReportsListLoading = false;
        state.dynamicReportsList = [];
        state.dynamicReportsListError = action.error.message;
      })
      .addCase(createDynamicReport.pending, state => {
        state.createDynamicReportLoading = true;
        state.createDynamicReportError = null;
      })
      .addCase(createDynamicReport.fulfilled, (state, action) => {
        state.createDynamicReportLoading = false;
        if (action.payload?.data) {
          state.dynamicReportsList = [action.payload.data, ...state.dynamicReportsList];
        }
        state.message = action.payload?.message;
      })
      .addCase(createDynamicReport.rejected, (state, action) => {
        state.createDynamicReportLoading = false;
        state.createDynamicReportError = action.error.message;
      })
      .addCase(getDynamicReportById.pending, state => {
        state.dynamicReportByIdLoading = true;
        state.dynamicReportByIdError = null;
      })
      .addCase(getDynamicReportById.fulfilled, (state, action) => {
        state.dynamicReportByIdLoading = false;
        const payload = action.payload?.data ?? action.payload;
        state.dynamicReportById = payload;
        if (action.payload?.extras) {
          state.pagination = {
            page: action.payload.extras.page,
            limit: action.payload.extras.limit,
            totalPages: action.payload.extras.totalPages,
            totalRecords: action.payload.extras.totalRecords,
          };
        }
      })
      .addCase(getDynamicReportById.rejected, (state, action) => {
        state.dynamicReportByIdLoading = false;
        state.dynamicReportById = null;
        state.dynamicReportByIdError = action.error.message;
      })
      .addCase(updateDynamicReport.pending, state => {
        state.updateDynamicReportLoading = true;
      })
      .addCase(updateDynamicReport.fulfilled, (state, action) => {
        state.updateDynamicReportLoading = false;
        const updated = action.payload?.data ?? action.payload;
        if (updated?._id && state.dynamicReportsList?.length) {
          const idx = state.dynamicReportsList.findIndex(r => r._id === updated._id);
          if (idx !== -1) state.dynamicReportsList[idx] = { ...state.dynamicReportsList[idx], ...updated };
        }
      })
      .addCase(updateDynamicReport.rejected, state => {
        state.updateDynamicReportLoading = false;
      })
      .addCase(deleteDynamicReport.pending, state => {
        state.deleteDynamicReportLoading = true;
      })
      .addCase(deleteDynamicReport.fulfilled, (state, action) => {
        state.deleteDynamicReportLoading = false;
        const id = action.meta?.arg;
        if (id && state.dynamicReportsList?.length) {
          state.dynamicReportsList = state.dynamicReportsList.filter(r => r._id !== id);
        }
      })
      .addCase(deleteDynamicReport.rejected, state => {
        state.deleteDynamicReportLoading = false;
      });
  },
});

export const reportSliceMethods = {
  getReports,
  getBankLedger,
  getPurchaseLedger,
  getPurchaseLedgerDetail,
  getPurchaseLedgerDetailExport,
  getSalesLedger,
  getSalesLedgerDetail,
  getSalesLedgerDetailExport,
  getCreditorsReport,
  getDebtorsReport,
  getProfitAndLose,
  getCustomerProfitAndLose,
  getProfitAndLoseItemWise,
  getProfitAndLoseItemWiseDetails,
  getProfitAndLoseCustomerMonthWise,
  getProfitAndLossBatchItemDetails,
  getProfitAndLossBatchCustomerDetails,
  getProfitAndLossByProductionOrder,
  getProfitAndLossByProductionOrderDetails,
  getItemAnalytics,
  getAgingReport,
  getCustomerAging,
  getVendorAging,
  getCustomerAgingDetails,
  getVendorAgingDetails,
  getCustomerAgingBucket,
  getVendorAgingBucket,
  getUpcomingPayments,
  getBalanceSheet,
  getProfitLossSheet,
  getDynamicReports,
  createDynamicReport,
  getDynamicReportById,
  updateDynamicReport,
  deleteDynamicReport,
};
export const {
  clearReportsData,
  clearBankData,
  clearPurchaseLedger,
  clearPurchaseLedgerDetail,
  clearSalesLedger,
  clearSalesLedgerDetail,
  clearCreditorsReport,
  clearDebtorsReport,
  clearProfitAndLose,
  clearCustomerProfitAndLose,
  clearProfitAndLoseItemWise,
  clearProfitAndLoseItemWiseDetails,
  clearProfitAndLoseCustomerMonthWise,
  clearProfitAndLossBatchItemDetails,
  clearProfitAndLossBatchCustomerDetails,
  clearItemAnalytics,
  clearAgingReport,
  clearCustomerAgingReport,
  clearVendorAgingReport,
  clearCustomerAgingDetails,
  clearVendorAgingDetails,
  clearBucketData,
  clearUpcomingPayments,
  clearBalanceSheet,
  clearProfitLossSheet,
  clearDynamicReportsList,
  clearDynamicReportById,
  clearPagination,
} = reportSlice.actions;
export default reportSlice.reducer;
