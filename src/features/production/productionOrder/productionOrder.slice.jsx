import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { productionOrderService } from './productionOrder.service';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

export const getProductionOrder = createAsyncThunk('productionOrder/getProductionOrder', productionOrderService.fetchProductionOrder);

export const fetchProductionItem = createAsyncThunk('productionOrder/fetchProductionItem', productionOrderService.fetchProductionItem);

const fetchItemProductionData = createAsyncThunk('productionOrder/fetchItemProductionData', productionOrderService.fetchItemProductionData);

export const createProductionOrder = createAsyncThunk('productionOrder/createProductionOrder', productionOrderService.createProductionOrder);

const updateSubmitProductionOrder = createAsyncThunk('productionOrder/submitProductionOrder', productionOrderService.submitProductionOrder);

export const startProductionProcess = createAsyncThunk('productionOrder/startProductionProcess', productionOrderService.startProductionProcess);

export const endProductionProcess = createAsyncThunk('productionOrder/endProductionProcess', productionOrderService.endProductionProcess);

export const submitProcess = createAsyncThunk('productionOrder/submitProcess', productionOrderService.submitProcess);

export const deleteProcessSubmission = createAsyncThunk('productionOrder/deleteProcessSubmission', productionOrderService.deleteProcessSubmission);

export const editProcessSubmission = createAsyncThunk('productionOrder/editProcessSubmission', productionOrderService.editProcessSubmission);

export const editBomSubmission = createAsyncThunk('productionOrder/editBomSubmission', productionOrderService.editBomSubmission);

export const getMaterialConsumption = createAsyncThunk('productionOrder/getMaterialConsumption', productionOrderService.fetchMaterialConsumption);

export const getScrapRejection = createAsyncThunk('productionOrder/getScrapRejection', productionOrderService.fetchScrapRejection);

export const deleteBomSubmission = createAsyncThunk('productionOrder/deleteBomSubmission', productionOrderService.deleteBomSubmission);

export const productionItemDropRM = createAsyncThunk('productionOrder/productionItemDropRM', productionOrderService.productionItemDrop);

export const productionItemDropScrap = createAsyncThunk('productionOrder/productionItemDropScrap', productionOrderService.productionItemDrop);

export const productionManpowerDrop = createAsyncThunk('productionOrder/productionManpowerDrop', productionOrderService.productionManPowerDrop);

const getProductionSalesOrderDropdown = createAsyncThunk('productionOrder/getProductionSalesOrderDropdown', productionOrderService.getProductionSalesOrderDropdown);

const getProductionOrderById = createAsyncThunk('productionOrder/getProductionOrderById', productionOrderService.fetchProductionOrderById);

const updateProductionOrderStatus = createAsyncThunk('productionOrder/updateProductionOrderStatus', productionOrderService.updateProductionOrderStatus);

const reRaiseTransferRequest = createAsyncThunk('productionOrder/reRaiseTransferRequest', productionOrderService.reRaiseTransferRequest);

const reorderProcesses = createAsyncThunk('productionOrder/reorderProcesses', productionOrderService.reorderProcesses);

export const productionOrderSlice = createSlice({
  name: 'productionOrder',
  initialState: {
    productionOrder: [],
    productionOrderOtherDetails: null,
    productionItem: {},
    pagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
    },
    create: null,
    update: null,
    convert: null,
    startDate: null,
    scrapItemDrop: [],
    RMItemDrop: [],
    manPowerDrop: [],
    salesOrderDrop: [],
    productionOrderById: null,
    itemProductionData: null,
    itemProductionDataLoading: false,
    endDate: null,
    loading: false,
    fetchLoading: false,
    updateLoading: false,
    startLoading: false,
    endLoading: false,
    submitProcessLoading: false,
    deleteSubmissionLoading: false,
    editSubmissionLoading: false,
    materialConsumption: [],
    scrapRejection: null,
    panelLoading: false,
    droploading: false,
    dropLoading: false,
    error: null,
  },
  reducers: {
    resetProductionOrder: state => {
      state.productionOrder = [];
      state.productionOrderOtherDetails = null;
      state.pagination = {
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        totalPages: 1,
        totalResults: 0,
      };
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getProductionOrder.pending, state => {
        state.loading = true;
        state.salesOrderDrop = [];
      })
      .addCase(getProductionOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.productionOrder = action.payload.data;
        state.productionOrderOtherDetails = action.payload.extras?.otherDetails || null;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalResults: action.payload.extras.totalResults,
        };
        state.message = action.payload.message;
      })
      .addCase(getProductionOrder.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.productionOrder = [];
          state.error = action.error.message;
        }
      })
      .addCase(fetchProductionItem.pending, state => {
        state.fetchLoading = true;
      })
      .addCase(fetchProductionItem.fulfilled, (state, action) => {
        state.fetchLoading = false;
        state.productionItem = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(fetchProductionItem.rejected, (state, action) => {
        state.fetchLoading = false;
        state.error = action.error.message;
      })
      .addCase(fetchItemProductionData.pending, state => {
        state.itemProductionDataLoading = true;
        state.itemProductionData = null;
      })
      .addCase(fetchItemProductionData.fulfilled, (state, action) => {
        state.itemProductionDataLoading = false;
        state.itemProductionData = action.payload.data;
      })
      .addCase(fetchItemProductionData.rejected, (state, action) => {
        state.itemProductionDataLoading = false;
        state.itemProductionData = null;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(createProductionOrder.pending, state => {
        state.loading = true;
      })
      .addCase(createProductionOrder.fulfilled, state => {
        state.loading = false;
        Toast.success('Production module created successfully');
      })
      .addCase(createProductionOrder.rejected, (state, action) => {
        state.loading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updateSubmitProductionOrder.pending, state => {
        state.updateLoading = true;
      })
      .addCase(updateSubmitProductionOrder.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.update = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(updateSubmitProductionOrder.rejected, (state, action) => {
        state.updateLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(startProductionProcess.pending, state => {
        state.startLoading = true;
      })
      .addCase(startProductionProcess.fulfilled, (state, action) => {
        state.startLoading = false;
        state.startDate = action.payload.data;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(startProductionProcess.rejected, (state, action) => {
        state.startLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(endProductionProcess.pending, state => {
        state.endLoading = true;
      })
      .addCase(endProductionProcess.fulfilled, (state, action) => {
        state.endLoading = false;
        state.endDate = action.payload.data;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(endProductionProcess.rejected, (state, action) => {
        state.endLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(submitProcess.pending, state => {
        state.submitProcessLoading = true;
      })
      .addCase(submitProcess.fulfilled, (state, action) => {
        state.submitProcessLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(submitProcess.rejected, (state, action) => {
        state.submitProcessLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getMaterialConsumption.pending, state => {
        state.panelLoading = true;
      })
      .addCase(getMaterialConsumption.fulfilled, (state, action) => {
        state.panelLoading = false;
        state.materialConsumption = action.payload.data;
      })
      .addCase(getMaterialConsumption.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.panelLoading = false;
          state.materialConsumption = [];
          state.error = action.error.message;
        }
      })
      .addCase(getScrapRejection.pending, state => {
        state.panelLoading = true;
      })
      .addCase(getScrapRejection.fulfilled, (state, action) => {
        state.panelLoading = false;
        state.scrapRejection = action.payload.data;
      })
      .addCase(getScrapRejection.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.panelLoading = false;
          state.scrapRejection = null;
          state.error = action.error.message;
        }
      })
      .addCase(editBomSubmission.pending, state => {
        state.editSubmissionLoading = true;
      })
      .addCase(editBomSubmission.fulfilled, (state, action) => {
        state.editSubmissionLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(editBomSubmission.rejected, (state, action) => {
        state.editSubmissionLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(editProcessSubmission.pending, state => {
        state.editSubmissionLoading = true;
      })
      .addCase(editProcessSubmission.fulfilled, (state, action) => {
        state.editSubmissionLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(editProcessSubmission.rejected, (state, action) => {
        state.editSubmissionLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(deleteBomSubmission.pending, state => {
        state.deleteSubmissionLoading = true;
      })
      .addCase(deleteBomSubmission.fulfilled, (state, action) => {
        state.deleteSubmissionLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(deleteBomSubmission.rejected, (state, action) => {
        state.deleteSubmissionLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(deleteProcessSubmission.pending, state => {
        state.deleteSubmissionLoading = true;
      })
      .addCase(deleteProcessSubmission.fulfilled, (state, action) => {
        state.deleteSubmissionLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(deleteProcessSubmission.rejected, (state, action) => {
        state.deleteSubmissionLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(productionItemDropScrap.pending, state => {
        state.droploading = true;
      })
      .addCase(productionItemDropScrap.fulfilled, (state, action) => {
        state.droploading = false;
        state.scrapItemDrop = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(productionItemDropScrap.rejected, (state, action) => {
        state.droploading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(productionItemDropRM.pending, state => {
        state.droploading = true;
      })
      .addCase(productionItemDropRM.fulfilled, (state, action) => {
        state.droploading = false;
        state.RMItemDrop = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(productionItemDropRM.rejected, (state, action) => {
        state.droploading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(productionManpowerDrop.pending, state => {
        state.droploading = true;
      })
      .addCase(productionManpowerDrop.fulfilled, (state, action) => {
        state.droploading = false;
        state.manPowerDrop = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(productionManpowerDrop.rejected, (state, action) => {
        state.droploading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getProductionSalesOrderDropdown.pending, state => {
        state.dropLoading = true;
      })
      .addCase(getProductionSalesOrderDropdown.fulfilled, (state, action) => {
        state.dropLoading = false;
        state.salesOrderDrop = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getProductionSalesOrderDropdown.rejected, (state, action) => {
        state.dropLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getProductionOrderById.pending, state => {
        state.loading = true;
      })
      .addCase(getProductionOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.productionOrderById = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getProductionOrderById.rejected, (state, action) => {
        state.loading = false;
        state.productionOrderById = null;
        state.error = action.error.message;
      })
      .addCase(updateProductionOrderStatus.pending, state => {
        state.updateLoading = true;
      })
      .addCase(updateProductionOrderStatus.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.message = action.payload?.message;
        if (state.message) Toast.success(state.message);
      })
      .addCase(updateProductionOrderStatus.rejected, (state, action) => {
        state.updateLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(reRaiseTransferRequest.pending, state => {
        state.updateLoading = true;
      })
      .addCase(reRaiseTransferRequest.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.message = action.payload?.message;
        if (state.message) Toast.success(state.message);
      })
      .addCase(reRaiseTransferRequest.rejected, (state, action) => {
        state.updateLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(reorderProcesses.pending, state => {
        state.updateLoading = true;
      })
      .addCase(reorderProcesses.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.message = action.payload?.message;
        if (state.message) Toast.success(state.message);
      })
      .addCase(reorderProcesses.rejected, (state, action) => {
        state.updateLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      });
  },
});

export const productionOrderSliceMethods = {
  getProductionOrder,
  createProductionOrder,
  fetchProductionItem,
  fetchItemProductionData,
  updateSubmitProductionOrder,
  startProductionProcess,
  endProductionProcess,
  submitProcess,
  deleteProcessSubmission,
  editProcessSubmission,
  editBomSubmission,
  deleteBomSubmission,
  getMaterialConsumption,
  getScrapRejection,
  productionItemDropRM,
  productionItemDropScrap,
  productionManpowerDrop,
  getProductionSalesOrderDropdown,
  getProductionOrderById,
  updateProductionOrderStatus,
  reRaiseTransferRequest,
  reorderProcesses,
};
export const { resetProductionOrder } = productionOrderSlice.actions;

export default productionOrderSlice.reducer;
