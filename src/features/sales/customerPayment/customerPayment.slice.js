// Redux Toolkit
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

// Components
import Toast from '@/components/ui/common/Toast';

// Services
import { customerPaymentService } from './customerPayment.service';

// Utils
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getCustomerPayments = createAsyncThunk('customerPayment/getCustomerPayments', customerPaymentService.getCustomerPayments);

const getCustomerPaymentById = createAsyncThunk('customerPayment/getCustomerPaymentById', customerPaymentService.getCustomerPaymentById);

const rejectCustomerPayment = createAsyncThunk('customerPayment/rejectCustomerPayment', customerPaymentService.rejectCustomerPayment);

const recordCustomerPayment = createAsyncThunk('customerPayment/recordCustomerPayment', customerPaymentService.recordCustomerPayment);

export const customerPaymentSlice = createSlice({
  name: 'customerPayment',
  initialState: {
    customerPayments: [],
    customerPayment: null,
    pagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
    },
    loading: false,
    submitLoading: false,
    error: null,
  },
  reducers: {
    resetCustomerPayment: state => {
      state.customerPayment = null;
    },
    resetCustomerPayments: state => {
      state.customerPayments = [];
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
      .addCase(getCustomerPayments.pending, state => {
        state.loading = true;
      })
      .addCase(getCustomerPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.customerPayments = action.payload.data;
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
      .addCase(getCustomerPayments.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.customerPayments = [];
          state.error = action.error.message;
        }
      })
      .addCase(getCustomerPaymentById.pending, state => {
        state.customerPayment = null;
        state.loading = true;
      })
      .addCase(getCustomerPaymentById.fulfilled, (state, action) => {
        state.loading = false;
        state.customerPayment = action.payload.data;
      })
      .addCase(getCustomerPaymentById.rejected, (state, action) => {
        state.customerPayment = null;
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(rejectCustomerPayment.pending, state => {
        state.submitLoading = true;
      })
      .addCase(rejectCustomerPayment.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.message = action.payload.message;
        Toast.success(action.payload.message);
      })
      .addCase(rejectCustomerPayment.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(recordCustomerPayment.pending, state => {
        state.submitLoading = true;
      })
      .addCase(recordCustomerPayment.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.message = action.payload.message;
      })
      .addCase(recordCustomerPayment.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      });
  },
});

export const customerPaymentSliceMethods = {
  getCustomerPayments,
  getCustomerPaymentById,
  rejectCustomerPayment,
  recordCustomerPayment,
};
export const { resetCustomerPayment, resetCustomerPayments } = customerPaymentSlice.actions;
export default customerPaymentSlice.reducer;
