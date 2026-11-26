import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { deliveryChallanService } from './deliveryChallan.service';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getDeliveryChallans = createAsyncThunk('deliveryChallan/getDeliveryChallans', deliveryChallanService.getDeliveryChallans);

const createDeliveryChallans = createAsyncThunk('deliveryChallan/createDeliveryChallans', async ({ deliveryChallanData, attachmentFile }, { rejectWithValue }) => {
  try {
    const attachmentFiles = Array.isArray(attachmentFile) ? attachmentFile : attachmentFile ? [attachmentFile] : [];
    const payload = {
      ...deliveryChallanData,
      attachments: [...(deliveryChallanData?.attachments || []), ...attachmentFiles],
    };
    const data = await deliveryChallanService.createDeliveryChallans(payload);
    return data;
  } catch (error) {
    return rejectWithValue(error?.response?.data || error || 'Something went wrong');
  }
});

const updateDeliveryChallans = createAsyncThunk('deliveryChallan/updateDeliveryChallans', async ({ deliveryId, deliveryChallanData, attachmentFile }, { rejectWithValue }) => {
  try {
    const attachmentFiles = Array.isArray(attachmentFile) ? attachmentFile : attachmentFile ? [attachmentFile] : [];
    const payload = {
      ...deliveryChallanData,
      attachments: [...(deliveryChallanData?.attachments || []), ...attachmentFiles],
    };
    const data = await deliveryChallanService.updateDeliveryChallans(deliveryId, payload);
    return data;
  } catch (error) {
    return rejectWithValue(error?.response?.data || error || 'Something went wrong');
  }
});

const deliveryFileUpload = createAsyncThunk('deliveryChallan/deliveryFileUpload', deliveryChallanService.deliveryFileUpload);

const updateStatus = createAsyncThunk('deliveryChallan/updateStatus', deliveryChallanService.updateStatus);

const getDeliveryChallanById = createAsyncThunk('deliveryChallan/getDeliveryChallanById', deliveryChallanService.getDeliveryChallanById);

const getDeliveryChallanDropdownForConvert = createAsyncThunk('deliveryChallan/getDeliveryChallanDropdownForConvert', deliveryChallanService.getDeliveryChallanDropdownForConvert);

const getPendingItemsDeliveryChallan = createAsyncThunk('deliveryChallan/getPendingItemsDeliveryChallan', deliveryChallanService.getPendingItemsDeliveryChallan);

const removeDeliveryChallan = createAsyncThunk('deliveryChallan/removeDeliveryChallan', deliveryChallanService.removeDeliveryChallan);

const getDeliveryChallanExports = createAsyncThunk('deliveryChallan/getDeliveryChallanExports', deliveryChallanService.getDeliveryChallanExports);

export const deliveryChallanSlice = createSlice({
  name: 'deliveryChallan',
  initialState: {
    deliveryChallans: [],
    deliveryChallan: null,
    deliveryChallanFile: null,
    pagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
    },
    deliveryChallanDropForConvert: null,
    create: null,
    remove: null,
    update: null,
    loading: false,
    submitLoading: false,
    deleteLoading: false,
    submitWithStatusLoading: false,
    uploading: false,
    droploading: false,
    exportLoading: false,
    deliveryChallanExports: [],
    error: null,
  },
  reducers: {
    resetDeliveryChallan: state => {
      state.deliveryChallan = null;
    },
    resetDeliveryChallans: state => {
      state.deliveryChallans = [];
      state.pagination = {
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        totalPages: 1,
        totalResults: 0,
      };
    },
    resetDeliveryChallanDropConvert: state => {
      state.deliveryChallanDropForConvert = null;
    },
    resetPendingItems: state => {
      state.pendingItems = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getDeliveryChallans.pending, state => {
        state.loading = true;
      })
      .addCase(getDeliveryChallans.fulfilled, (state, action) => {
        state.loading = false;
        state.deliveryChallans = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalResults: action.payload.extras.totalResults,
          totalAmount: action.payload.extras.totalDeliveryChallanAmount,
        };
        state.message = action.payload.message;
      })
      .addCase(getDeliveryChallans.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
        }
        state.deliveryChallans = [];
        state.loading = false;
      })
      .addCase(createDeliveryChallans.pending, (state, action) => {
        if (action?.meta?.arg?.status) {
          state.submitWithStatusLoading = true;
        } else {
          state.submitLoading = true;
        }
      })
      .addCase(createDeliveryChallans.fulfilled, (state, action) => {
        if (action?.meta?.arg?.status) {
          state.submitWithStatusLoading = false;
        } else {
          state.submitLoading = false;
        }
        state.create = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createDeliveryChallans.rejected, (state, action) => {
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
      .addCase(updateDeliveryChallans.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updateDeliveryChallans.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.update = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(updateDeliveryChallans.rejected, (state, action) => {
        state.submitLoading = false;
        state.error = action.payload;
        if (!action?.payload?.data?.isCreditLimitError) {
          Toast.error(action?.payload?.message || 'Something went wrong');
        }
      })
      .addCase(deliveryFileUpload.pending, state => {
        state.uploading = true;
      })
      .addCase(deliveryFileUpload.fulfilled, (state, action) => {
        state.uploading = false;
        state.deliveryChallanFile = action.payload.data.urls;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(deliveryFileUpload.rejected, (state, action) => {
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
      .addCase(getDeliveryChallanById.pending, state => {
        state.loading = true;
        state.deliveryChallan = null;
      })
      .addCase(getDeliveryChallanById.fulfilled, (state, action) => {
        state.loading = false;
        state.deliveryChallan = action.payload.data;
      })
      .addCase(getDeliveryChallanById.rejected, (state, action) => {
        state.loading = false;
        state.deliveryChallan = null;
        state.error = action.error.message;
      })
      .addCase(removeDeliveryChallan.pending, state => {
        state.deleteLoading = true;
      })
      .addCase(removeDeliveryChallan.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.remove = action.payload.data;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(removeDeliveryChallan.rejected, (state, action) => {
        state.deleteLoading = false;
        state.remove = null;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getDeliveryChallanExports.pending, state => {
        state.exportLoading = true;
      })
      .addCase(getDeliveryChallanExports.fulfilled, (state, action) => {
        state.exportLoading = false;
        state.deliveryChallanExports = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getDeliveryChallanExports.rejected, (state, action) => {
        state.exportLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
        }
      })
      .addCase(getDeliveryChallanDropdownForConvert.pending, state => {
        state.droploading = true;
      })
      .addCase(getDeliveryChallanDropdownForConvert.fulfilled, (state, action) => {
        state.droploading = false;
        state.deliveryChallanDropForConvert = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getDeliveryChallanDropdownForConvert.rejected, (state, action) => {
        state.droploading = false;
        state.deliveryChallanDropForConvert = null;
        state.error = action.error.message;
      })
      .addCase(getPendingItemsDeliveryChallan.pending, state => {
        state.pendingItemLoading = true;
      })
      .addCase(getPendingItemsDeliveryChallan.fulfilled, (state, action) => {
        state.pendingItemLoading = false;
        state.pendingItems = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getPendingItemsDeliveryChallan.rejected, (state, action) => {
        state.pendingItemLoading = false;
        state.pendingItems = null;
        state.error = action.error.message;
      });
  },
});

export const deliveryChallanSliceMethods = {
  getDeliveryChallans,
  createDeliveryChallans,
  updateDeliveryChallans,
  deliveryFileUpload,
  updateStatus,
  getDeliveryChallanById,
  removeDeliveryChallan,
  getDeliveryChallanDropdownForConvert,
  getPendingItemsDeliveryChallan,
  getDeliveryChallanExports,
};
export const { resetDeliveryChallan, resetDeliveryChallans, resetDeliveryChallanDropConvert, resetPendingItems } = deliveryChallanSlice.actions;
export default deliveryChallanSlice.reducer;
