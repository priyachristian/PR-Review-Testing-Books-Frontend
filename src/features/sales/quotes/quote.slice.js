import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { quoteService } from './quote.service';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getQuotes = createAsyncThunk('quote/getQuotes', quoteService.getQuotes);

const createQuotes = createAsyncThunk('quote/createQuotes', async (quoteData, { rejectWithValue }) => {
  try {
    const data = await quoteService.createQuotes(quoteData);
    return data;
  } catch (error) {
    return rejectWithValue(error?.response?.data || error || 'Something went wrong');
  }
});

const updateQuotes = createAsyncThunk('quote/updateQuotes', async (payload, { rejectWithValue }) => {
  try {
    const data = await quoteService.updateQuotes(payload);
    return data;
  } catch (error) {
    return rejectWithValue(error?.response?.data || error || 'Something went wrong');
  }
});

const quoteFileUpload = createAsyncThunk('quote/quoteFileUpload', quoteService.quoteFileUpload);

const getQuoteCustomerProject = createAsyncThunk('quote/getQuoteCustomerProject', quoteService.getQuoteCustomerProject);

const updateStatus = createAsyncThunk('quote/updateStatus', quoteService.updateStatus);

const getQuoteById = createAsyncThunk('quote/getQuoteById', quoteService.getQuoteById);

const removeQuote = createAsyncThunk('quote/removeQuote', quoteService.removeQuote);

const getQuoteExports = createAsyncThunk('quote/getQuoteExports', quoteService.getQuoteExports);

export const quoteSlice = createSlice({
  name: 'quote',
  initialState: {
    quotes: [],
    quote: null,
    quoteFile: null,
    pagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
    },
    quotePersonDrop: null,
    quoteCustomerProjectDrop: null,
    create: null,
    remove: null,
    update: null,
    loading: false,
    uploading: false,
    submitLoading: false,
    deleteLoading: false,
    submitWithStatusLoading: false,
    droploading: false,
    exportLoading: false,
    quoteExports: [],
    error: null,
  },
  reducers: {
    resetQuote: state => {
      state.quote = null;
    },
    resetQuotes: state => {
      state.quotes = [];
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
      .addCase(getQuotes.pending, state => {
        state.loading = true;
      })
      .addCase(getQuotes.fulfilled, (state, action) => {
        state.loading = false;
        state.quotes = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalResults: action.payload.extras.totalResults,
          totalAmount: action.payload.extras.totalQuotation,
          hasCRMAccess: !!action.payload.extras?.hasCRMAccess,
        };
        state.message = action.payload.message;
      })
      .addCase(getQuotes.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.quotes = [];
          state.error = action.error.message;
        }
      })
      .addCase(createQuotes.pending, (state, action) => {
        if (action?.meta?.arg?.status) {
          state.submitWithStatusLoading = true;
        } else {
          state.submitLoading = true;
        }
      })
      .addCase(createQuotes.fulfilled, (state, action) => {
        if (action?.meta?.arg?.status) {
          state.submitWithStatusLoading = false;
        } else {
          state.submitLoading = false;
        }
        state.create = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createQuotes.rejected, (state, action) => {
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
      .addCase(updateQuotes.pending, (state, action) => {
        if (action?.meta?.arg?.quoteData?.status) {
          state.submitWithStatusLoading = true;
        } else {
          state.submitLoading = true;
        }
      })
      .addCase(updateQuotes.fulfilled, (state, action) => {
        if (action?.meta?.arg?.quoteData?.status) {
          state.submitWithStatusLoading = false;
        } else {
          state.submitLoading = false;
        }
        state.update = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(updateQuotes.rejected, (state, action) => {
        if (action?.meta?.arg?.quoteData?.status) {
          state.submitWithStatusLoading = false;
        } else {
          state.submitLoading = false;
        }
        state.error = action.payload;
        if (!action?.payload?.data?.isCreditLimitError) {
          Toast.error(action?.payload?.message || 'Something went wrong');
        }
      })
      .addCase(quoteFileUpload.pending, state => {
        state.uploading = true;
      })
      .addCase(quoteFileUpload.fulfilled, (state, action) => {
        state.uploading = false;
        state.quoteFile = action.payload.data.urls;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(quoteFileUpload.rejected, (state, action) => {
        state.uploading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getQuoteCustomerProject.pending, state => {
        state.droploading = true;
      })
      .addCase(getQuoteCustomerProject.fulfilled, (state, action) => {
        state.droploading = false;
        state.quoteCustomerProjectDrop = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getQuoteCustomerProject.rejected, (state, action) => {
        state.droploading = false;
        state.error = action.error.message;
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
      .addCase(getQuoteById.pending, state => {
        state.quote = null;
        state.loading = true;
      })
      .addCase(getQuoteById.fulfilled, (state, action) => {
        state.loading = false;
        state.quote = action.payload.data;
      })
      .addCase(getQuoteById.rejected, (state, action) => {
        state.quote = null;
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(removeQuote.pending, state => {
        state.deleteLoading = true;
      })
      .addCase(removeQuote.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.remove = action.payload.data;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(removeQuote.rejected, (state, action) => {
        state.deleteLoading = false;
        state.remove = null;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getQuoteExports.pending, state => {
        state.exportLoading = true;
      })
      .addCase(getQuoteExports.fulfilled, (state, action) => {
        state.exportLoading = false;
        state.quoteExports = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getQuoteExports.rejected, (state, action) => {
        state.exportLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
        }
      });
  },
});

export const quoteSliceMethods = {
  getQuotes,
  createQuotes,
  updateQuotes,
  getQuoteCustomerProject,
  quoteFileUpload,
  updateStatus,
  getQuoteById,
  removeQuote,
  getQuoteExports,
};
export const { resetQuote, resetQuotes } = quoteSlice.actions;
export default quoteSlice.reducer;
