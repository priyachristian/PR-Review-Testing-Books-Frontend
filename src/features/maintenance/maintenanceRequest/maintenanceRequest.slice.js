import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';
import { maintenanceRequestService } from './maintenanceRequest.service';

const getMaintenanceRequests = createAsyncThunk('maintenanceRequest/getMaintenanceRequests', maintenanceRequestService.getMaintenanceRequests);

const getMaintenanceRequestById = createAsyncThunk('maintenanceRequest/getMaintenanceRequestById', maintenanceRequestService.getMaintenanceRequestById);

const createMaintenanceRequest = createAsyncThunk('maintenanceRequest/createMaintenanceRequest', maintenanceRequestService.createMaintenanceRequest);

const approveMaintenanceRequest = createAsyncThunk('maintenanceRequest/approveMaintenanceRequest', maintenanceRequestService.approveMaintenanceRequest);

const rejectMaintenanceRequest = createAsyncThunk('maintenanceRequest/rejectMaintenanceRequest', maintenanceRequestService.rejectMaintenanceRequest);

const assignMaintenanceRequest = createAsyncThunk('maintenanceRequest/assignMaintenanceRequest', maintenanceRequestService.assignMaintenanceRequest);

const startMaintenanceRequestWork = createAsyncThunk('maintenanceRequest/startMaintenanceRequestWork', maintenanceRequestService.startMaintenanceRequestWork);

const completeMaintenanceRequest = createAsyncThunk('maintenanceRequest/completeMaintenanceRequest', maintenanceRequestService.completeMaintenanceRequest);

const closeMaintenanceRequest = createAsyncThunk('maintenanceRequest/closeMaintenanceRequest', maintenanceRequestService.closeMaintenanceRequest);

const requestMaintenanceRequestPart = createAsyncThunk('maintenanceRequest/requestMaintenanceRequestPart', maintenanceRequestService.requestMaintenanceRequestPart);

const getMaintenanceRequestDropdown = createAsyncThunk('maintenanceRequest/getMaintenanceRequestDropdown', maintenanceRequestService.getMaintenanceRequestDropdown);

const isCanceled = action => action.error.name === 'CanceledError' || action.error.code === 'ERR_CANCELED' || action.error.message === 'canceled';

const applyReturnedMaintenanceRequest = (state, action) => {
  if (action.payload?.data) {
    state.maintenanceRequest = action.payload.data;
    state.error = null;
  }
};

const initialPagination = {
  page: 1,
  limit: DEFAULT_PAGE_SIZE,
  totalPages: 1,
  totalResults: 0,
  openRequestCount: 0,
  criticalOpenCount: 0,
  machineStoppedCount: 0,
};

export const maintenanceRequestSlice = createSlice({
  name: 'maintenanceRequest',
  initialState: {
    maintenanceRequests: [],
    maintenanceRequest: null,
    maintenanceRequestDropdown: [],
    loading: false,
    detailLoading: false,
    dropdownLoading: false,
    submitLoading: false,
    approveLoading: false,
    rejectLoading: false,
    assignLoading: false,
    startWorkLoading: false,
    completeLoading: false,
    closeLoading: false,
    requestPartLoading: false,
    error: null,
    pagination: initialPagination,
  },
  reducers: {
    resetMaintenanceRequest: state => {
      state.maintenanceRequests = [];
      state.error = null;
      state.pagination = initialPagination;
    },
    resetMaintenanceRequestDetail: state => {
      state.maintenanceRequest = null;
      state.detailLoading = false;
      state.error = null;
    },
    resetMaintenanceRequestDropdown: state => {
      state.maintenanceRequestDropdown = [];
      state.dropdownLoading = false;
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getMaintenanceRequests.pending, state => {
        state.loading = true;
      })
      .addCase(getMaintenanceRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.maintenanceRequests = action.payload?.data || [];
        state.pagination = {
          page: action.payload?.extras?.page ?? 1,
          limit: action.payload?.extras?.limit ?? DEFAULT_PAGE_SIZE,
          totalPages: action.payload?.extras?.totalPages ?? 1,
          totalResults: action.payload?.extras?.totalResults ?? 0,
          openRequestCount: action.payload?.extras?.openRequestCount ?? 0,
          criticalOpenCount: action.payload?.extras?.criticalOpenCount ?? 0,
          machineStoppedCount: action.payload?.extras?.machineStoppedCount ?? 0,
        };
      })
      .addCase(getMaintenanceRequests.rejected, (state, action) => {
        if (!isCanceled(action)) {
          state.loading = false;
          state.maintenanceRequests = [];
          state.error = action.error.message;
        }
      })
      .addCase(getMaintenanceRequestById.pending, state => {
        state.detailLoading = true;
      })
      .addCase(getMaintenanceRequestById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.maintenanceRequest = action.payload?.data || null;
        state.error = null;
      })
      .addCase(getMaintenanceRequestById.rejected, (state, action) => {
        if (!isCanceled(action)) {
          state.detailLoading = false;
          state.maintenanceRequest = null;
          state.error = action.error.message;
          Toast.error(action.error.message || 'Unable to load maintenance request');
        }
      })
      .addCase(createMaintenanceRequest.pending, state => {
        state.submitLoading = true;
      })
      .addCase(createMaintenanceRequest.fulfilled, (state, action) => {
        state.submitLoading = false;
        Toast.success(action.payload?.message || 'Maintenance request raised successfully');
      })
      .addCase(createMaintenanceRequest.rejected, (state, action) => {
        state.submitLoading = false;
        state.error = action.error.message;
        Toast.error(action.error.message || 'Something went wrong');
      })
      .addCase(approveMaintenanceRequest.pending, state => {
        state.approveLoading = true;
      })
      .addCase(approveMaintenanceRequest.fulfilled, (state, action) => {
        state.approveLoading = false;
        applyReturnedMaintenanceRequest(state, action);
        Toast.success(action.payload?.message || 'Maintenance request approved');
      })
      .addCase(approveMaintenanceRequest.rejected, (state, action) => {
        state.approveLoading = false;
        if (!isCanceled(action)) {
          Toast.error(action.error.message || 'Unable to approve maintenance request');
        }
      })
      .addCase(rejectMaintenanceRequest.pending, state => {
        state.rejectLoading = true;
      })
      .addCase(rejectMaintenanceRequest.fulfilled, (state, action) => {
        state.rejectLoading = false;
        applyReturnedMaintenanceRequest(state, action);
        Toast.success(action.payload?.message || 'Maintenance request rejected');
      })
      .addCase(rejectMaintenanceRequest.rejected, (state, action) => {
        state.rejectLoading = false;
        if (!isCanceled(action)) {
          Toast.error(action.error.message || 'Unable to reject maintenance request');
        }
      })
      .addCase(assignMaintenanceRequest.pending, state => {
        state.assignLoading = true;
      })
      .addCase(assignMaintenanceRequest.fulfilled, (state, action) => {
        state.assignLoading = false;
        applyReturnedMaintenanceRequest(state, action);
        Toast.success(action.payload?.message || 'Technician assigned');
      })
      .addCase(assignMaintenanceRequest.rejected, (state, action) => {
        state.assignLoading = false;
        if (!isCanceled(action)) {
          Toast.error(action.error.message || 'Unable to assign technician');
        }
      })
      .addCase(startMaintenanceRequestWork.pending, state => {
        state.startWorkLoading = true;
      })
      .addCase(startMaintenanceRequestWork.fulfilled, (state, action) => {
        state.startWorkLoading = false;
        applyReturnedMaintenanceRequest(state, action);
        Toast.success(action.payload?.message || 'Work started');
      })
      .addCase(startMaintenanceRequestWork.rejected, (state, action) => {
        state.startWorkLoading = false;
        if (!isCanceled(action)) {
          Toast.error(action.error.message || 'Unable to start work');
        }
      })
      .addCase(completeMaintenanceRequest.pending, state => {
        state.completeLoading = true;
      })
      .addCase(completeMaintenanceRequest.fulfilled, (state, action) => {
        state.completeLoading = false;
        applyReturnedMaintenanceRequest(state, action);
        Toast.success(action.payload?.message || 'Maintenance request completed');
      })
      .addCase(completeMaintenanceRequest.rejected, (state, action) => {
        state.completeLoading = false;
        if (!isCanceled(action)) {
          Toast.error(action.error.message || 'Unable to complete maintenance request');
        }
      })
      .addCase(closeMaintenanceRequest.pending, state => {
        state.closeLoading = true;
      })
      .addCase(closeMaintenanceRequest.fulfilled, (state, action) => {
        state.closeLoading = false;
        applyReturnedMaintenanceRequest(state, action);
        Toast.success(action.payload?.message || 'Maintenance request closed');
      })
      .addCase(closeMaintenanceRequest.rejected, (state, action) => {
        state.closeLoading = false;
        if (!isCanceled(action)) {
          Toast.error(action.error.message || 'Unable to close maintenance request');
        }
      })
      .addCase(requestMaintenanceRequestPart.pending, state => {
        state.requestPartLoading = true;
      })
      .addCase(requestMaintenanceRequestPart.fulfilled, (state, action) => {
        state.requestPartLoading = false;
        applyReturnedMaintenanceRequest(state, action);
        Toast.success(action.payload?.message || 'Part requested');
      })
      .addCase(requestMaintenanceRequestPart.rejected, (state, action) => {
        state.requestPartLoading = false;
        if (!isCanceled(action)) {
          Toast.error(action.error.message || 'Unable to request part');
        }
      })
      .addCase(getMaintenanceRequestDropdown.pending, state => {
        state.dropdownLoading = true;
      })
      .addCase(getMaintenanceRequestDropdown.fulfilled, (state, action) => {
        state.dropdownLoading = false;
        state.maintenanceRequestDropdown = action.payload?.data || [];
      })
      .addCase(getMaintenanceRequestDropdown.rejected, (state, action) => {
        if (!isCanceled(action)) {
          state.dropdownLoading = false;
          state.maintenanceRequestDropdown = [];
          state.error = action.error.message;
        }
      });
  },
});

export const maintenanceRequestSliceMethods = {
  getMaintenanceRequests,
  getMaintenanceRequestById,
  createMaintenanceRequest,
  approveMaintenanceRequest,
  rejectMaintenanceRequest,
  assignMaintenanceRequest,
  startMaintenanceRequestWork,
  completeMaintenanceRequest,
  closeMaintenanceRequest,
  requestMaintenanceRequestPart,
  getMaintenanceRequestDropdown,
};

export const { resetMaintenanceRequest, resetMaintenanceRequestDetail, resetMaintenanceRequestDropdown } = maintenanceRequestSlice.actions;
export default maintenanceRequestSlice.reducer;
