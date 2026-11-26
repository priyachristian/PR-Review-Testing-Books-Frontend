import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';
import { partRequestService } from './partRequest.service';

const getPartRequests = createAsyncThunk('partRequest/getPartRequests', partRequestService.getPartRequests);
const approvePartRequest = createAsyncThunk('partRequest/approvePartRequest', partRequestService.approvePartRequest);
const issuePartRequest = createAsyncThunk('partRequest/issuePartRequest', partRequestService.issuePartRequest);
const shortPartRequest = createAsyncThunk('partRequest/shortPartRequest', partRequestService.shortPartRequest);

const isCanceled = action => action.error.name === 'CanceledError' || action.error.code === 'ERR_CANCELED' || action.error.message === 'canceled';

const initialStatusCounts = {
  PENDING: 0,
  APPROVED: 0,
  ISSUED: 0,
  SHORT: 0,
  ALL: 0,
};

const initialPagination = {
  page: 1,
  limit: DEFAULT_PAGE_SIZE,
  totalPages: 1,
  totalResults: 0,
  statusCounts: initialStatusCounts,
};

const applyUpdatedPartRequest = (state, action) => {
  const updated = action.payload?.data;
  if (!updated) return;

  const updatedId = String(updated.id || updated._id || '');
  if (!updatedId) return;

  state.partRequests = (state.partRequests || []).map(item => {
    const itemId = String(item?.id || item?._id || '');
    return itemId === updatedId ? updated : item;
  });
};

const withUpdateLoading = (builder, thunk, { successMessage, errorMessage }) => {
  builder
    .addCase(thunk.pending, state => {
      state.updateLoading = true;
    })
    .addCase(thunk.fulfilled, (state, action) => {
      state.updateLoading = false;
      applyUpdatedPartRequest(state, action);
      Toast.success(action.payload?.message || successMessage);
    })
    .addCase(thunk.rejected, (state, action) => {
      state.updateLoading = false;
      if (!isCanceled(action)) {
        Toast.error(action.error.message || errorMessage);
      }
    });
};

export const partRequestSlice = createSlice({
  name: 'partRequest',
  initialState: {
    partRequests: [],
    loading: false,
    updateLoading: false,
    error: null,
    pagination: initialPagination,
  },
  reducers: {
    resetPartRequest: state => {
      state.partRequests = [];
      state.error = null;
      state.pagination = initialPagination;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getPartRequests.pending, state => {
        state.loading = true;
      })
      .addCase(getPartRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.partRequests = action.payload?.data || [];
        state.pagination = {
          page: action.payload?.extras?.page ?? 1,
          limit: action.payload?.extras?.limit ?? DEFAULT_PAGE_SIZE,
          totalPages: action.payload?.extras?.totalPages ?? 1,
          totalResults: action.payload?.extras?.totalResults ?? 0,
          statusCounts: {
            ...initialStatusCounts,
            ...(action.payload?.extras?.statusCounts || {}),
          },
        };
      })
      .addCase(getPartRequests.rejected, (state, action) => {
        if (!isCanceled(action)) {
          state.loading = false;
          state.partRequests = [];
          state.error = action.error.message;
        }
      });

    withUpdateLoading(builder, approvePartRequest, {
      successMessage: 'Part request approved successfully',
      errorMessage: 'Unable to approve part request',
    });
    withUpdateLoading(builder, issuePartRequest, {
      successMessage: 'Part request issued successfully',
      errorMessage: 'Unable to issue part request',
    });
    withUpdateLoading(builder, shortPartRequest, {
      successMessage: 'Part request marked short successfully',
      errorMessage: 'Unable to mark part request short',
    });
  },
});

export const partRequestSliceMethods = {
  getPartRequests,
  approvePartRequest,
  issuePartRequest,
  shortPartRequest,
};

export const { resetPartRequest } = partRequestSlice.actions;
export default partRequestSlice.reducer;
