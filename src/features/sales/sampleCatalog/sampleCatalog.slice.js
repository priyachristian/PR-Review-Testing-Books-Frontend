// Redux Toolkit
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

// Components
import Toast from '@/components/ui/common/Toast';

// Services
import { sampleCatalogService } from './sampleCatalog.service';

// Utils
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';
import { isCanceledRequestError as isCanceled } from '@/utils/serviceHelper';

const getSampleCatalogs = createAsyncThunk('sampleCatalog/getSampleCatalogs', sampleCatalogService.getSampleCatalogs);
const getSampleCatalogById = createAsyncThunk('sampleCatalog/getSampleCatalogById', sampleCatalogService.getSampleCatalogById);
const createSampleCatalog = createAsyncThunk('sampleCatalog/createSampleCatalog', sampleCatalogService.createSampleCatalog);
const updateSampleCatalog = createAsyncThunk('sampleCatalog/updateSampleCatalog', sampleCatalogService.updateSampleCatalog);
const updateSampleCatalogStatus = createAsyncThunk('sampleCatalog/updateSampleCatalogStatus', sampleCatalogService.updateSampleCatalogStatus);

const initialPagination = { page: 1, limit: DEFAULT_PAGE_SIZE, totalPages: 1, totalResults: 0 };

// withErrorHandling throws the backend message as a string, which lands in action.error.message.
const onSubmitRejected = (state, action) => {
  state.submitLoading = false;
  state.error = action.error?.message;
  Toast.error(state.error);
};

export const sampleCatalogSlice = createSlice({
  name: 'sampleCatalog',
  initialState: {
    sampleCatalogs: [],
    sampleCatalog: null,
    pagination: initialPagination,
    loading: false,
    submitLoading: false,
    error: null,
  },
  reducers: {
    resetSampleCatalog: state => {
      state.sampleCatalog = null;
    },
    resetSampleCatalogs: state => {
      state.sampleCatalogs = [];
      state.pagination = initialPagination;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getSampleCatalogs.pending, state => {
        state.loading = true;
      })
      .addCase(getSampleCatalogs.fulfilled, (state, action) => {
        state.loading = false;
        state.sampleCatalogs = action.payload.data;
        state.pagination = {
          page: action.payload.extras?.page,
          limit: action.payload.extras?.limit,
          totalPages: action.payload.extras?.totalPages,
          totalResults: action.payload.extras?.totalResults,
        };
      })
      .addCase(getSampleCatalogs.rejected, (state, action) => {
        if (isCanceled(action.error)) return;
        state.loading = false;
        state.sampleCatalogs = [];
        state.error = action.error.message;
      })
      .addCase(getSampleCatalogById.pending, state => {
        state.sampleCatalog = null;
        state.loading = true;
      })
      .addCase(getSampleCatalogById.fulfilled, (state, action) => {
        state.loading = false;
        state.sampleCatalog = action.payload.data;
      })
      .addCase(getSampleCatalogById.rejected, (state, action) => {
        if (isCanceled(action.error)) return;
        state.loading = false;
        state.sampleCatalog = null;
        state.error = action.error.message;
      })
      .addCase(createSampleCatalog.pending, state => {
        state.submitLoading = true;
      })
      .addCase(createSampleCatalog.fulfilled, (state, action) => {
        state.submitLoading = false;
        // Nothing saved yet; the page asks the user to confirm portal activation.
        if (action.payload.activationRequired) return;
        state.sampleCatalog = action.payload.data;
        Toast.success(action.payload.message);
      })
      .addCase(createSampleCatalog.rejected, onSubmitRejected)
      .addCase(updateSampleCatalog.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updateSampleCatalog.fulfilled, (state, action) => {
        state.submitLoading = false;
        if (action.payload.activationRequired) return;
        state.sampleCatalog = action.payload.data;
        Toast.success(action.payload.message);
      })
      .addCase(updateSampleCatalog.rejected, onSubmitRejected)
      .addCase(updateSampleCatalogStatus.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updateSampleCatalogStatus.fulfilled, (state, action) => {
        state.submitLoading = false;
        if (action.payload.activationRequired) return;
        if (state.sampleCatalog?.id === action.payload.data?.id) {
          state.sampleCatalog.status = action.payload.data.status;
        }
        Toast.success(action.payload.message);
      })
      .addCase(updateSampleCatalogStatus.rejected, onSubmitRejected);
  },
});

export const sampleCatalogSliceMethods = {
  getSampleCatalogs,
  getSampleCatalogById,
  createSampleCatalog,
  updateSampleCatalog,
  updateSampleCatalogStatus,
};
export const { resetSampleCatalog, resetSampleCatalogs } = sampleCatalogSlice.actions;
export default sampleCatalogSlice.reducer;
