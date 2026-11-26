// Redux Toolkit
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

// Components
import Toast from '@/components/ui/common/Toast';

// Services
import { customerOrderService } from './customerOrder.service';

// Utils
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getCustomerOrders = createAsyncThunk('customerOrder/getCustomerOrders', customerOrderService.getCustomerOrders);

const updateStatus = createAsyncThunk('customerOrder/updateStatus', customerOrderService.updateStatus);

const getCustomerOrderById = createAsyncThunk('customerOrder/getCustomerOrderById', customerOrderService.getCustomerOrderById);

export const customerOrderSlice = createSlice({
  name: 'customerOrder',
  initialState: {
    customerOrders: [],
    customerOrder: null,
    pagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
    },
    remove: null,
    loading: false,
    submitLoading: false,
    error: null,
  },
  reducers: {
    resetCustomerOrder: state => {
      state.customerOrder = null;
    },
    resetCustomerOrders: state => {
      state.customerOrders = [];
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
      .addCase(getCustomerOrders.pending, state => {
        state.loading = true;
      })
      .addCase(getCustomerOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.customerOrders = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalResults: action.payload.extras.totalResults,
          totalAmount: action.payload.extras.totalAmount || 0,
          currency: action.payload.extras.currency || null,
        };
        state.message = action.payload.message;
      })
      .addCase(getCustomerOrders.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.customerOrders = [];
          state.error = action.error.message;
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
      .addCase(getCustomerOrderById.pending, state => {
        state.customerOrder = null;
        state.loading = true;
      })
      .addCase(getCustomerOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.customerOrder = action.payload.data;
      })
      .addCase(getCustomerOrderById.rejected, (state, action) => {
        state.customerOrder = null;
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export const customerOrderSliceMethods = {
  getCustomerOrders,
  updateStatus,
  getCustomerOrderById,
};
export const { resetCustomerOrder, resetCustomerOrders } = customerOrderSlice.actions;
export default customerOrderSlice.reducer;
