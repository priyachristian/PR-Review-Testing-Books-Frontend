import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { payemntReceivedService } from './paymentReceived.service';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getPaymentsRecived = createAsyncThunk('paymentReceived/getPaymentsRecived', payemntReceivedService.getPaymentsRecived);

const getPaymentsExports = createAsyncThunk('paymentReceived/getPaymentsExports', payemntReceivedService.getPaymentsExports);

const createPaymentsRecived = createAsyncThunk('paymentReceived/createPaymentsRecived', payemntReceivedService.createPaymentsRecived);

const updatePaymentsRecived = createAsyncThunk('paymentReceived/updatePaymentsRecived', payemntReceivedService.updatePaymentsRecived);

const paymentFileUpload = createAsyncThunk('paymentReceived/paymentFileUpload', payemntReceivedService.paymentFileUpload);

const getPaymentInvoice = createAsyncThunk('paymentReceived/getPaymentInvoice', payemntReceivedService.getPaymentInvoice);

const approvePaymentsRecived = createAsyncThunk('paymentReceived/approvePaymentsRecived', payemntReceivedService.approvePaymentsRecived);

const rejectPaymentsRecived = createAsyncThunk('paymentReceived/rejectPaymentsRecived', payemntReceivedService.rejectPaymentsRecived);

const cancelPaymentsRecived = createAsyncThunk('paymentReceived/cancelPaymentsRecived', payemntReceivedService.cancelPaymentsRecived);

const getPaymentRecivedById = createAsyncThunk('paymentReceived/getPaymentRecivedById', payemntReceivedService.getPaymentRecivedById);

const removePaymentsRecived = createAsyncThunk('paymentReceived/removePaymentsRecived', payemntReceivedService.removePaymentsRecived);

const applyToInvoice = createAsyncThunk('paymentReceived/applyToInvoice', payemntReceivedService.applyToInvoice);

const removeApplyInvoice = createAsyncThunk('paymentReceived/removeApplyInvoice', payemntReceivedService.removeApplyInvoice);

const autoApplyPendingAdvancePayments = createAsyncThunk('paymentReceived/autoApplyPendingAdvancePayments', payemntReceivedService.autoApplyPendingAdvancePayments);

const addRefund = createAsyncThunk('paymentReceived/addRefund', payemntReceivedService.addRefund);

const updateRefund = createAsyncThunk('paymentReceived/updateRefund', payemntReceivedService.updateRefund);

const deleteRefund = createAsyncThunk('paymentReceived/deleteRefund', payemntReceivedService.deleteRefund);

export const paymentReceivedSlice = createSlice({
  name: 'paymentReceived',
  initialState: {
    paymentsReceived: [],
    paymentReceived: null,
    paymentReceivedFile: null,
    pagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
      pendingMappingCount: 0,
    },
    paymentInvoiceDrop: null,
    paymentInvoiceOpeningBalance: null,
    paymentInvoicePendingExpenses: [],
    nextPaymentNo: null,
    create: null,
    update: null,
    remove: null,
    approve: null,
    reject: null,
    cancel: null,
    loading: false,
    submitLoading: false,
    deleteLoading: false,
    approveLoading: false,
    rejectLoading: false,
    cancelLoading: false,
    uploading: false,
    droploading: false,
    applyInvoiceLoading: false,
    refundLoading: false,
    removeApplyInvoiceLoading: false,
    autoApplyLoading: false,
    exportLoading: false,
    error: null,
  },
  reducers: {
    clearPaymentInvoiceDrop: state => {
      state.paymentInvoiceDrop = null;
      state.paymentInvoiceOpeningBalance = null;
      state.paymentInvoicePendingExpenses = [];
    },
    resetPaymentReceived: state => {
      state.paymentReceived = null;
    },
    resetPaymentsReceived: state => {
      state.paymentsReceived = [];
      state.pagination = {
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        totalPages: 1,
        totalResults: 0,
        pendingMappingCount: 0,
      };
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getPaymentsRecived.pending, state => {
        state.loading = true;
      })
      .addCase(getPaymentsRecived.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentsReceived = action.payload.data;
        state.nextPaymentNo = action.payload.extras.nextPaymentNo;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalResults: action.payload.extras.totalResults,
          totalAmount: action.payload.extras.totalPayment,
          pendingMappingCount: action.payload.extras.pendingMappingCount || 0,
          hasCRMAccess: !!action.payload.extras?.hasCRMAccess,
        };
        state.message = action.payload.message;
      })
      .addCase(getPaymentsRecived.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.paymentsReceived = [];
          state.error = action.error.message;
        }
      })
      .addCase(getPaymentsExports.pending, state => {
        state.exportLoading = true;
      })
      .addCase(getPaymentsExports.fulfilled, (state, action) => {
        state.exportLoading = false;
        state.message = action.payload.message;
      })
      .addCase(getPaymentsExports.rejected, (state, action) => {
        state.exportLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(createPaymentsRecived.pending, state => {
        state.submitLoading = true;
      })
      .addCase(createPaymentsRecived.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.create = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createPaymentsRecived.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updatePaymentsRecived.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updatePaymentsRecived.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.update = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(updatePaymentsRecived.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(paymentFileUpload.pending, state => {
        state.uploading = true;
      })
      .addCase(paymentFileUpload.fulfilled, (state, action) => {
        state.uploading = false;
        state.paymentReceivedFile = action.payload.data.urls;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(paymentFileUpload.rejected, (state, action) => {
        state.uploading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getPaymentInvoice.pending, state => {
        state.droploading = true;
      })
      .addCase(getPaymentInvoice.fulfilled, (state, action) => {
        state.droploading = false;
        const p = action.payload;
        state.paymentInvoiceDrop = p?.data?.results ?? [];
        state.paymentInvoiceOpeningBalance = p?.data?.openingBalanceTransactions ?? null;
        state.paymentInvoicePendingExpenses = p?.data?.pendingExpenses ?? [];
        state.message = p?.message;
      })
      .addCase(getPaymentInvoice.rejected, (state, action) => {
        state.droploading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
        }
      })
      .addCase(approvePaymentsRecived.pending, state => {
        state.approveLoading = true;
      })
      .addCase(approvePaymentsRecived.fulfilled, (state, action) => {
        state.approveLoading = false;
        state.approve = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(approvePaymentsRecived.rejected, (state, action) => {
        state.approveLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(rejectPaymentsRecived.pending, state => {
        state.rejectLoading = true;
      })
      .addCase(rejectPaymentsRecived.fulfilled, (state, action) => {
        state.rejectLoading = false;
        state.reject = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(rejectPaymentsRecived.rejected, (state, action) => {
        state.rejectLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(cancelPaymentsRecived.pending, state => {
        state.cancelLoading = true;
      })
      .addCase(cancelPaymentsRecived.fulfilled, (state, action) => {
        state.cancelLoading = false;
        state.cancel = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(cancelPaymentsRecived.rejected, (state, action) => {
        state.cancelLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getPaymentRecivedById.pending, state => {
        state.loading = true;
      })
      .addCase(getPaymentRecivedById.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentReceived = action.payload.data;
      })
      .addCase(getPaymentRecivedById.rejected, (state, action) => {
        state.loading = false;
        state.paymentReceived = null;
        state.error = action.error.message;
      })
      .addCase(removePaymentsRecived.pending, state => {
        state.deleteLoading = true;
      })
      .addCase(removePaymentsRecived.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.remove = action.payload.data;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(removePaymentsRecived.rejected, (state, action) => {
        state.deleteLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(applyToInvoice.pending, state => {
        state.applyInvoiceLoading = true;
      })
      .addCase(applyToInvoice.fulfilled, (state, action) => {
        state.applyInvoiceLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(applyToInvoice.rejected, (state, action) => {
        state.applyInvoiceLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(removeApplyInvoice.pending, state => {
        state.removeApplyInvoiceLoading = true;
      })
      .addCase(removeApplyInvoice.fulfilled, (state, action) => {
        state.removeApplyInvoiceLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(removeApplyInvoice.rejected, (state, action) => {
        state.removeApplyInvoiceLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(autoApplyPendingAdvancePayments.pending, state => {
        state.autoApplyLoading = true;
      })
      .addCase(autoApplyPendingAdvancePayments.fulfilled, (state, action) => {
        state.autoApplyLoading = false;
        state.message = action.payload.message;
      })
      .addCase(autoApplyPendingAdvancePayments.rejected, (state, action) => {
        state.autoApplyLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
        }
      })
      .addCase(addRefund.pending, state => {
        state.refundLoading = true;
      })
      .addCase(addRefund.fulfilled, (state, action) => {
        state.refundLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(addRefund.rejected, (state, action) => {
        state.refundLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updateRefund.pending, state => {
        state.refundLoading = true;
      })
      .addCase(updateRefund.fulfilled, (state, action) => {
        state.refundLoading = false;
        state.message = action.payload?.message;
        Toast.success(state.message);
      })
      .addCase(updateRefund.rejected, (state, action) => {
        state.refundLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(deleteRefund.pending, state => {
        state.refundLoading = true;
      })
      .addCase(deleteRefund.fulfilled, (state, action) => {
        state.refundLoading = false;
        state.message = action.payload?.message;
        Toast.success(state.message);
      })
      .addCase(deleteRefund.rejected, (state, action) => {
        state.refundLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      });
  },
});
export const paymentReceivedSliceMethods = {
  getPaymentsRecived,
  getPaymentsExports,
  createPaymentsRecived,
  updatePaymentsRecived,
  paymentFileUpload,
  getPaymentInvoice,
  approvePaymentsRecived,
  rejectPaymentsRecived,
  cancelPaymentsRecived,
  getPaymentRecivedById,
  removePaymentsRecived,
  applyToInvoice,
  removeApplyInvoice,
  autoApplyPendingAdvancePayments,
  addRefund,
  updateRefund,
  deleteRefund,
};
export const { clearPaymentInvoiceDrop, resetPaymentReceived, resetPaymentsReceived } = paymentReceivedSlice.actions;
export default paymentReceivedSlice.reducer;
