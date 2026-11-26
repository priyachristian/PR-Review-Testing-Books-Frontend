import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { supportService } from './support.service';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getSupports = createAsyncThunk('support/getSupports', supportService.getSupports);

const createSupport = createAsyncThunk('support/createSupport', supportService.createSupport);

const supportFileUpload = createAsyncThunk('support/supportFileUpload', supportService.supportFileUpload);

const getSupportById = createAsyncThunk('support/getSupportById', supportService.getSupportById);

const sendComment = createAsyncThunk('support/sendComment', supportService.sendComment);

export const supportSlice = createSlice({
  name: 'support',
  initialState: {
    supports: [],
    support: null,
    pagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
    },
    statusCounts: { open: 0, inProgress: 0, resolved: 0, closed: 0 },
    delete: null,
    create: null,
    update: null,
    loading: false,
    submitLoading: false,
    uploading: false,
    error: null,
  },
  reducers: {
    resetSupport: state => {
      state.support = null;
    },
    resetSupports: state => {
      state.supports = [];
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getSupports.pending, state => {
        state.loading = true;
      })
      .addCase(getSupports.fulfilled, (state, action) => {
        state.loading = false;
        state.supports = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalResults: action.payload.extras.totalResults,
        };
        if (action.payload.extras.statusCounts) {
          state.statusCounts = action.payload.extras.statusCounts;
        }
        state.message = action.payload.message;
      })
      .addCase(getSupports.rejected, (state, action) => {
        state.loading = false;
        state.supports = [];
        state.error = action.error.message;
      })
      .addCase(createSupport.pending, state => {
        state.submitLoading = true;
      })
      .addCase(createSupport.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.create = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createSupport.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(supportFileUpload.pending, state => {
        state.uploading = true;
      })
      .addCase(supportFileUpload.fulfilled, state => {
        state.uploading = false;
      })
      .addCase(supportFileUpload.rejected, (state, action) => {
        state.uploading = false;
        state.error = action.error.message;
      })
      .addCase(getSupportById.pending, state => {
        state.loading = true;
      })
      .addCase(getSupportById.fulfilled, (state, action) => {
        state.loading = false;
        state.support = action.payload.data;
      })
      .addCase(getSupportById.rejected, (state, action) => {
        state.loading = false;
        state.support = null;
        state.error = action.error.message;
      })
      .addCase(sendComment.pending, state => {
        state.submitLoading = true;
      })
      .addCase(sendComment.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.comment = action.payload.data;
      })
      .addCase(sendComment.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      });
  },
});
export const { resetSupport, resetSupports } = supportSlice.actions;
export default supportSlice.reducer;
export const supportSliceMethods = {
  getSupports,
  createSupport,
  supportFileUpload,
  getSupportById,
  sendComment,
};
