import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';
import { maintenancePurchaseService } from './maintenancePurchase.service';

const getMaintenancePurchases = createAsyncThunk('maintenancePurchase/getMaintenancePurchases', maintenancePurchaseService.getMaintenancePurchases);

const getMaintenancePurchaseById = createAsyncThunk('maintenancePurchase/getMaintenancePurchaseById', maintenancePurchaseService.getMaintenancePurchaseById);

const createMaintenancePurchase = createAsyncThunk('maintenancePurchase/createMaintenancePurchase', maintenancePurchaseService.createMaintenancePurchase);

const approveMaintenancePurchase = createAsyncThunk('maintenancePurchase/approveMaintenancePurchase', maintenancePurchaseService.approveMaintenancePurchase);

const raiseMaintenancePurchasePo = createAsyncThunk('maintenancePurchase/raiseMaintenancePurchasePo', maintenancePurchaseService.raiseMaintenancePurchasePo);

const receiveMaintenancePurchase = createAsyncThunk('maintenancePurchase/receiveMaintenancePurchase', maintenancePurchaseService.receiveMaintenancePurchase);

const getMaintenancePurchaseDropdown = createAsyncThunk('maintenancePurchase/getMaintenancePurchaseDropdown', maintenancePurchaseService.getMaintenancePurchaseDropdown);

const isCanceled = action => action.error.name === 'CanceledError' || action.error.code === 'ERR_CANCELED' || action.error.message === 'canceled';

const applyReturnedMaintenancePurchase = (state, action) => {
  if (action.payload?.data) {
    state.maintenancePurchase = action.payload.data;
    state.error = null;
  }
};

const initialPagination = {
  page: 1,
  limit: DEFAULT_PAGE_SIZE,
  totalPages: 1,
  totalResults: 0,
  pendingApprovalCount: 0,
  openOrderCount: 0,
  receivedCount: 0,
};

export const maintenancePurchaseSlice = createSlice({
  name: 'maintenancePurchase',
  initialState: {
    maintenancePurchases: [],
    maintenancePurchase: null,
    maintenancePurchaseDropdown: [],
    loading: false,
    detailLoading: false,
    dropdownLoading: false,
    submitLoading: false,
    approveLoading: false,
    raisePoLoading: false,
    receiveLoading: false,
    error: null,
    pagination: initialPagination,
  },
  reducers: {
    resetMaintenancePurchase: state => {
      state.maintenancePurchases = [];
      state.error = null;
      state.pagination = initialPagination;
    },
    resetMaintenancePurchaseDetail: state => {
      state.maintenancePurchase = null;
      state.detailLoading = false;
      state.error = null;
    },
    resetMaintenancePurchaseDropdown: state => {
      state.maintenancePurchaseDropdown = [];
      state.dropdownLoading = false;
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getMaintenancePurchases.pending, state => {
        state.loading = true;
      })
      .addCase(getMaintenancePurchases.fulfilled, (state, action) => {
        state.loading = false;
        state.maintenancePurchases = action.payload?.data || [];
        state.pagination = {
          page: action.payload?.extras?.page ?? 1,
          limit: action.payload?.extras?.limit ?? DEFAULT_PAGE_SIZE,
          totalPages: action.payload?.extras?.totalPages ?? 1,
          totalResults: action.payload?.extras?.totalResults ?? 0,
          pendingApprovalCount: action.payload?.extras?.pendingApprovalCount ?? 0,
          openOrderCount: action.payload?.extras?.openOrderCount ?? 0,
          receivedCount: action.payload?.extras?.receivedCount ?? 0,
        };
      })
      .addCase(getMaintenancePurchases.rejected, (state, action) => {
        if (!isCanceled(action)) {
          state.loading = false;
          state.maintenancePurchases = [];
          state.error = action.error.message;
        }
      })
      .addCase(getMaintenancePurchaseById.pending, state => {
        state.detailLoading = true;
      })
      .addCase(getMaintenancePurchaseById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.maintenancePurchase = action.payload?.data || null;
        state.error = null;
      })
      .addCase(getMaintenancePurchaseById.rejected, (state, action) => {
        if (!isCanceled(action)) {
          state.detailLoading = false;
          state.maintenancePurchase = null;
          state.error = action.error.message;
          Toast.error(action.error.message || 'Unable to load purchase request');
        }
      })
      .addCase(createMaintenancePurchase.pending, state => {
        state.submitLoading = true;
      })
      .addCase(createMaintenancePurchase.fulfilled, (state, action) => {
        state.submitLoading = false;
        Toast.success(action.payload?.message || 'Purchase request created successfully');
      })
      .addCase(createMaintenancePurchase.rejected, (state, action) => {
        state.submitLoading = false;
        state.error = action.error.message;
        Toast.error(action.error.message || 'Failed to create purchase request');
      })
      .addCase(approveMaintenancePurchase.pending, state => {
        state.approveLoading = true;
      })
      .addCase(approveMaintenancePurchase.fulfilled, (state, action) => {
        state.approveLoading = false;
        applyReturnedMaintenancePurchase(state, action);
        Toast.success(action.payload?.message || 'Purchase request approved');
      })
      .addCase(approveMaintenancePurchase.rejected, (state, action) => {
        state.approveLoading = false;
        if (!isCanceled(action)) {
          Toast.error(action.error.message || 'Unable to approve purchase request');
        }
      })
      .addCase(raiseMaintenancePurchasePo.pending, state => {
        state.raisePoLoading = true;
      })
      .addCase(raiseMaintenancePurchasePo.fulfilled, (state, action) => {
        state.raisePoLoading = false;
        applyReturnedMaintenancePurchase(state, action);
        Toast.success(action.payload?.message || 'Purchase order raised');
      })
      .addCase(raiseMaintenancePurchasePo.rejected, (state, action) => {
        state.raisePoLoading = false;
        if (!isCanceled(action)) {
          Toast.error(action.error.message || 'Unable to raise purchase order');
        }
      })
      .addCase(receiveMaintenancePurchase.pending, state => {
        state.receiveLoading = true;
      })
      .addCase(receiveMaintenancePurchase.fulfilled, (state, action) => {
        state.receiveLoading = false;
        applyReturnedMaintenancePurchase(state, action);
        Toast.success(action.payload?.message || 'Goods received');
      })
      .addCase(receiveMaintenancePurchase.rejected, (state, action) => {
        state.receiveLoading = false;
        if (!isCanceled(action)) {
          Toast.error(action.error.message || 'Unable to receive goods');
        }
      })
      .addCase(getMaintenancePurchaseDropdown.pending, state => {
        state.dropdownLoading = true;
      })
      .addCase(getMaintenancePurchaseDropdown.fulfilled, (state, action) => {
        state.dropdownLoading = false;
        state.maintenancePurchaseDropdown = action.payload?.data || [];
      })
      .addCase(getMaintenancePurchaseDropdown.rejected, (state, action) => {
        if (!isCanceled(action)) {
          state.dropdownLoading = false;
          state.maintenancePurchaseDropdown = [];
          state.error = action.error.message;
        }
      });
  },
});

export const maintenancePurchaseSliceMethods = {
  getMaintenancePurchases,
  getMaintenancePurchaseById,
  createMaintenancePurchase,
  approveMaintenancePurchase,
  raiseMaintenancePurchasePo,
  receiveMaintenancePurchase,
  getMaintenancePurchaseDropdown,
};

export const { resetMaintenancePurchase, resetMaintenancePurchaseDetail, resetMaintenancePurchaseDropdown } = maintenancePurchaseSlice.actions;
export default maintenancePurchaseSlice.reducer;
