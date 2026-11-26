import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { salesOrderService } from './salesOrder.service';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getSalesOrder = createAsyncThunk('salesOrder/getSalesOrder', salesOrderService.getSalesOrder);

const createSalesOrder = createAsyncThunk('salesOrder/createSalesOrder', async (saleOrderData, { rejectWithValue }) => {
  try {
    const data = await salesOrderService.createSalesOrder(saleOrderData);
    return data;
  } catch (error) {
    console.error('Error in create sale order thunk:', error);
    return rejectWithValue(error?.response?.data || error || 'Something went wrong');
  }
});

const updateSalesOrder = createAsyncThunk('salesOrder/updateSalesOrder', async ({ salesId, saleOrderData }, { rejectWithValue }) => {
  try {
    const data = await salesOrderService.updateSalesOrder(salesId, saleOrderData);
    return data;
  } catch (error) {
    console.error('Error in update sale order thunk:', error);
    return rejectWithValue(error?.response?.data || error || 'Something went wrong');
  }
});

const salesOrderFileUpload = createAsyncThunk('salesOrder/salesOrderFileUpload', salesOrderService.salesOrderFileUpload);

const updateStatus = createAsyncThunk('salesOrder/updateStatus', salesOrderService.updateStatus);
const revertClose = createAsyncThunk('salesOrder/revertClose', salesOrderService.revertClose);

const getSalesItems = createAsyncThunk('salesOrder/getSalesItems', salesOrderService.getSalesItems);

const getSalesOrderDropdown = createAsyncThunk('salesOrder/getSalesOrderDropdown', salesOrderService.getSalesOrderDropdown);

const getSalesOrderById = createAsyncThunk('salesOrder/getSalesOrderById', salesOrderService.getSalesOrderById);

const getSalesOrderDropdownForConvert = createAsyncThunk('salesOrder/getSalesOrderDropdownForConvert', salesOrderService.getSalesOrderDropdownForConvert);

const getPendingItemsSalesOrder = createAsyncThunk('salesOrder/getPendingItemsSalesOrder', salesOrderService.getPendingItemsSalesOrder);

const removeSalesOrder = createAsyncThunk('salesOrder/removeSalesOrder', salesOrderService.removeSalesOrder);

const getSalesOrderWiseAnalysis = createAsyncThunk('salesOrder/getSalesOrderWiseAnalysis', salesOrderService.getSalesOrderWiseAnalysis);

const getItemWiseSalesOrderAnalysis = createAsyncThunk('salesOrder/getItemWiseSalesOrderAnalysis', salesOrderService.getItemWiseSalesOrderAnalysis);

const getCustomerWiseSalesOrderAnalysis = createAsyncThunk('salesOrder/getCustomerWiseSalesOrderAnalysis', salesOrderService.getCustomerWiseSalesOrderAnalysis);

const getNewVsOldCustomerReport = createAsyncThunk('salesOrder/getNewVsOldCustomerReport', salesOrderService.getNewVsOldCustomerReport);

const getNewVsOldCustomerReportModuleData = createAsyncThunk('salesOrder/getNewVsOldCustomerReportModuleData', salesOrderService.getNewVsOldCustomerReportModuleData);

const convertToProductionOrder = createAsyncThunk('salesOrder/convertToProductionOrder', salesOrderService.convertToProductionOrder);

const getSalesOrderExports = createAsyncThunk('salesOrder/getSalesOrderExports', salesOrderService.getSalesOrderExports);

export const saleOrderSliceMethods = {
  getSalesOrder,
  createSalesOrder,
  updateSalesOrder,
  salesOrderFileUpload,
  getSalesItems,
  updateStatus,
  revertClose,
  getSalesOrderDropdown,
  getSalesOrderById,
  getSalesOrderDropdownForConvert,
  getPendingItemsSalesOrder,
  removeSalesOrder,
  getSalesOrderWiseAnalysis,
  getCustomerWiseSalesOrderAnalysis,
  getItemWiseSalesOrderAnalysis,
  getNewVsOldCustomerReport,
  getNewVsOldCustomerReportModuleData,
  convertToProductionOrder,
  getSalesOrderExports,
};
export const salesOrderSlice = createSlice({
  name: 'salesOrder',
  initialState: {
    salesOrders: [],
    salesOrder: null,
    pendingItems: null,
    salesOrderDrop: [],
    salesOrderDropForConvert: [],
    salesOrderFile: null,
    salesOrderWiseAnalysis: [],
    customerWiseSalesOrderAnalysis: [],
    itemWiseSalesOrderAnalysis: [],
    newVsOldCustomerReport: null,
    newVsOldCustomerReportModuleData: null,
    newCustomerPagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
    },
    moduleDataLoading: false,
    oldCustomerPagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
    },
    itemWiseSalesOrderAnalysisPagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
    },
    salesOrderWiseAnalysisPagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
    },
    customerWiseSalesOrderAnalysisPagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
    },
    pagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
    },
    create: null,
    remove: null,
    update: null,
    loading: false,
    submitLoading: false,
    deleteLoading: false,
    convertToProductionLoading: false,
    submitWithStatusLoading: false,
    uploading: false,
    droploading: false,
    pendingItemLoading: false,
    exportLoading: false,
    salesOrderExports: [],
    error: null,
  },
  reducers: {
    resetSalesOrder: state => {
      state.salesOrder = null;
    },
    resetSalesOrderDropConvert: state => {
      state.salesOrderDropForConvert = null;
    },
    resetPendingItems: state => {
      state.pendingItems = null;
    },
    resetSalesOrders: state => {
      state.salesOrders = [];
      state.pagination = {
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        totalPages: 1,
        totalResults: 0,
      };
    },
    resetSalesOrderWiseAnalysis: state => {
      state.salesOrderWiseAnalysis = [];
      state.salesOrderWiseAnalysisPagination = {
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        totalPages: 1,
        totalResults: 0,
      };
    },
    resetCustomerWisePendingOrderAnalysis: state => {
      state.customerWiseSalesOrderAnalysis = [];
      state.customerWiseSalesOrderAnalysisPagination = {
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        totalPages: 1,
        totalResults: 0,
      };
    },
    resetCustomerWiseSalesOrderAnalysis: state => {
      state.newVsOldCustomerReport = null;
      state.newCustomerPagination = {
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        totalPages: 1,
        totalResults: 0,
      };
      state.oldCustomerPagination = {
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        totalPages: 1,
        totalResults: 0,
      };
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getSalesOrder.pending, state => {
        state.loading = true;
      })
      .addCase(getSalesOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.salesOrders = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalResults: action.payload.extras.totalResults,
          totalAmount: action.payload.extras.totalSalesOrderAmount,
          remainingAmount: action.payload.extras.remainingSalesOrderAmount,
          hasCRMAccess: !!action.payload.extras?.hasCRMAccess,
          materialStatusCounts: action.payload.extras?.materialStatusCounts,
        };
        state.message = action.payload.message;
      })
      .addCase(getSalesOrder.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          state.salesOrders = [];
          state.loading = false;
        }
      })
      .addCase(createSalesOrder.pending, (state, action) => {
        if (action?.meta?.arg?.status) {
          state.submitWithStatusLoading = true;
        } else {
          state.submitLoading = true;
        }
      })
      .addCase(createSalesOrder.fulfilled, (state, action) => {
        if (action?.meta?.arg?.status) {
          state.submitWithStatusLoading = false;
        } else {
          state.submitLoading = false;
        }
        state.create = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createSalesOrder.rejected, (state, action) => {
        if (action?.meta?.arg?.status) {
          state.submitWithStatusLoading = false;
        } else {
          state.submitLoading = false;
        }
        state.error = action.payload;
        if (!action?.payload?.data?.isCreditLimitError) {
          Toast.error(action?.payload?.message || 'Something went wrong');
        }
      })
      .addCase(updateSalesOrder.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updateSalesOrder.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.update = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(updateSalesOrder.rejected, (state, action) => {
        state.submitLoading = false;
        state.error = action.payload;
        if (!action?.payload?.data?.isCreditLimitError) {
          Toast.error(action?.payload?.message || 'Something went wrong');
        }
      })
      .addCase(salesOrderFileUpload.pending, state => {
        state.uploading = true;
      })
      .addCase(salesOrderFileUpload.fulfilled, (state, action) => {
        state.uploading = false;
        state.salesOrderFile = action.payload.data.urls;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(salesOrderFileUpload.rejected, (state, action) => {
        state.uploading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updateStatus.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updateStatus.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.message = action.payload.message;
        Toast.success(action.payload.message);
      })
      .addCase(updateStatus.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(revertClose.pending, state => {
        state.submitLoading = true;
      })
      .addCase(revertClose.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.message = action.payload.message;
        Toast.success(action.payload.message);
      })
      .addCase(revertClose.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getSalesItems.rejected, (state, action) => {
        state.droploading = false;
        state.error = action.error.message;
      })
      .addCase(getSalesOrderDropdown.pending, state => {
        state.droploading = true;
      })
      .addCase(getSalesOrderDropdown.fulfilled, (state, action) => {
        state.droploading = false;
        state.salesOrderDrop = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getSalesOrderDropdown.rejected, (state, action) => {
        state.droploading = false;
        state.error = action.error.message;
      })
      .addCase(getSalesOrderById.pending, state => {
        state.loading = true;
      })
      .addCase(getSalesOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.salesOrder = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getSalesOrderById.rejected, (state, action) => {
        state.loading = false;
        state.salesOrder = null;
        state.error = action.error.message;
      })
      .addCase(getSalesOrderDropdownForConvert.pending, state => {
        state.droploading = true;
      })
      .addCase(getSalesOrderDropdownForConvert.fulfilled, (state, action) => {
        state.droploading = false;
        state.salesOrderDropForConvert = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getSalesOrderDropdownForConvert.rejected, (state, action) => {
        state.droploading = false;
        state.salesOrderDropForConvert = null;
        state.error = action.error.message;
      })
      .addCase(getPendingItemsSalesOrder.pending, state => {
        state.pendingItemLoading = true;
      })
      .addCase(getPendingItemsSalesOrder.fulfilled, (state, action) => {
        state.pendingItemLoading = false;
        state.pendingItems = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getPendingItemsSalesOrder.rejected, (state, action) => {
        state.pendingItemLoading = false;
        state.pendingItems = null;
        state.error = action.error.message;
      })
      .addCase(removeSalesOrder.pending, state => {
        state.deleteLoading = true;
      })
      .addCase(removeSalesOrder.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.remove = action.payload.data;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(removeSalesOrder.rejected, (state, action) => {
        state.deleteLoading = false;
        state.remove = null;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getSalesOrderWiseAnalysis.pending, state => {
        state.loading = true;
      })
      .addCase(getSalesOrderWiseAnalysis.fulfilled, (state, action) => {
        state.loading = false;
        state.salesOrderWiseAnalysis = action.payload.data || [];
        state.salesOrderWiseAnalysisPagination = action.payload.extras || {};
        state.message = action.payload.message;
      })
      .addCase(getSalesOrderWiseAnalysis.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.salesOrderWiseAnalysis = null;
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getCustomerWiseSalesOrderAnalysis.pending, state => {
        state.loading = true;
      })
      .addCase(getCustomerWiseSalesOrderAnalysis.fulfilled, (state, action) => {
        state.loading = false;
        state.customerWiseSalesOrderAnalysis = action.payload.data || [];
        state.customerWiseSalesOrderAnalysisPagination = action.payload.extras || {};
        state.message = action.payload.message;
      })
      .addCase(getCustomerWiseSalesOrderAnalysis.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.customerWiseSalesOrderAnalysis = [];
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getItemWiseSalesOrderAnalysis.pending, state => {
        state.loading = true;
      })
      .addCase(getItemWiseSalesOrderAnalysis.fulfilled, (state, action) => {
        state.loading = false;
        state.itemWiseSalesOrderAnalysis = action.payload.data || [];
        state.itemWiseSalesOrderAnalysisPagination = action.payload.extras || {};
        state.message = action.payload.message;
      })
      .addCase(getItemWiseSalesOrderAnalysis.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.itemWiseSalesOrderAnalysis = null;
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getNewVsOldCustomerReport.pending, state => {
        state.loading = true;
      })
      .addCase(getNewVsOldCustomerReport.fulfilled, (state, action) => {
        state.loading = false;
        state.newVsOldCustomerReport = action.payload.data || {};
        state.newCustomerPagination = action.payload.extras?.newCustomerPagination || {};
        state.oldCustomerPagination = action.payload.extras?.oldCustomerPagination || {};
        state.message = action.payload.message;
      })
      .addCase(getNewVsOldCustomerReport.rejected, (state, action) => {
        state.loading = false;
        state.newVsOldCustomerReport = null;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getNewVsOldCustomerReportModuleData.pending, state => {
        state.moduleDataLoading = true;
      })
      .addCase(getNewVsOldCustomerReportModuleData.fulfilled, (state, action) => {
        state.moduleDataLoading = false;
        state.newVsOldCustomerReportModuleData = action.payload ?? null;
        state.message = action.payload?.message;
      })
      .addCase(getNewVsOldCustomerReportModuleData.rejected, (state, action) => {
        state.moduleDataLoading = false;
        state.newVsOldCustomerReportModuleData = null;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(convertToProductionOrder.pending, state => {
        state.convertToProductionLoading = true;
      })
      .addCase(convertToProductionOrder.fulfilled, (state, action) => {
        state.convertToProductionLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(convertToProductionOrder.rejected, (state, action) => {
        state.convertToProductionLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getSalesOrderExports.pending, state => {
        state.exportLoading = true;
      })
      .addCase(getSalesOrderExports.fulfilled, (state, action) => {
        state.exportLoading = false;
        state.salesOrderExports = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getSalesOrderExports.rejected, (state, action) => {
        state.exportLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
        }
      });
  },
});

export const {
  resetSalesOrder,
  resetSalesOrderDropConvert,
  resetPendingItems,
  resetSalesOrders,
  resetSalesOrderWiseAnalysis,
  resetCustomerWisePendingOrderAnalysis,
  resetCustomerWiseSalesOrderAnalysis,
} = salesOrderSlice.actions;
export default salesOrderSlice.reducer;
