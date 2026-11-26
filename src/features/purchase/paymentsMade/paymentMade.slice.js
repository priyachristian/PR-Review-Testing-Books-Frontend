import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { paymentMadeService } from './paymentMade.service';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getPaymentsMade = createAsyncThunk('paymentMade/getPaymentsMade', paymentMadeService.getPaymentsMade);

const getPaymentsMadeExports = createAsyncThunk('paymentMade/getPaymentsMadeExports', paymentMadeService.getPaymentsMadeExports);

const createPaymentsMade = createAsyncThunk('paymentMade/createPaymentsMade', paymentMadeService.createPaymentsMade);

const updatePaymentsMade = createAsyncThunk('paymentMade/updatePaymentsMade', paymentMadeService.updatePaymentsMade);

const getPaymentsMadeInvoice = createAsyncThunk('paymentMade/getPaymentsMadeInvoice', paymentMadeService.getPaymentsMadeInvoice);

const approvePaymentsMade = createAsyncThunk('paymentMade/approvePaymentsMade', paymentMadeService.approvePaymentsMade);

const rejectPaymentsMade = createAsyncThunk('paymentMade/rejectPaymentsMade', paymentMadeService.rejectPaymentsMade);

const cancelPaymentsMade = createAsyncThunk('paymentMade/cancelPaymentsMade', paymentMadeService.cancelPaymentsMade);

const getPaymentMadeById = createAsyncThunk('paymentMade/getPaymentMadeById', paymentMadeService.getPaymentMadeById);

const removePaymentMade = createAsyncThunk('paymentMade/removePaymentMade', paymentMadeService.removePaymentMade);

const applyToBill = createAsyncThunk('paymentMade/applyToBill', paymentMadeService.applyToBill);

const removeApplyBill = createAsyncThunk('paymentMade/removeApplyBill', paymentMadeService.removeApplyBill);

const autoApplyPendingAdvancePaymentMade = createAsyncThunk('paymentMade/autoApplyPendingAdvancePaymentMade', paymentMadeService.autoApplyPendingAdvancePaymentMade);

const addRefund = createAsyncThunk('paymentMade/addRefund', paymentMadeService.addRefund);

const updateRefund = createAsyncThunk('paymentMade/updateRefund', paymentMadeService.updateRefund);

const deleteRefund = createAsyncThunk('paymentMade/deleteRefund', paymentMadeService.deleteRefund);

export const paymentsMadeSlice = createSlice({
  name: 'paymentMade',
  initialState: {
    paymentsMade: [],
    paymentMade: null,
    pagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
      pendingMappingCount: 0,
    },
    paymentsMadeInvoiceDrop: null,
    paymentsMadeOpeningBalance: null,
    paymentsMadePendingExpenses: [],
    nextPaymentMadeId: null,
    create: null,
    remove: null,
    update: null,
    approve: null,
    reject: null,
    cancel: null,
    loading: false,
    submitLoading: false,
    deleteLoading: false,
    droploading: false,
    approveLoading: false,
    rejectLoading: false,
    cancelLoading: false,
    applyBillLoading: false,
    refundLoading: false,
    removeApplyBillLoading: false,
    autoApplyLoading: false,
    exportLoading: false,
    error: null,
  },
  reducers: {
    clearPaymentMadeInvoiceDrop: state => {
      state.paymentsMadeInvoiceDrop = null;
      state.paymentsMadeOpeningBalance = null;
      state.paymentsMadePendingExpenses = [];
    },
    resetPaymentMade: state => {
      state.paymentMade = null;
    },
    resetPaymentsMade: state => {
      state.paymentsMade = [];
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
      .addCase(getPaymentsMade.pending, state => {
        state.loading = true;
      })
      .addCase(getPaymentsMade.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentsMade = action.payload.data;
        state.nextPaymentMadeId = action.payload.extras.nextPaymentMadeId;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalResults: action.payload.extras.totalResults,
          totalAmount: action.payload.extras.totalAmount,
          pendingMappingCount: action.payload.extras.pendingMappingCount || 0,
        };
        state.message = action.payload.message;
      })
      .addCase(getPaymentsMade.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.paymentsMade = [];
          state.error = action.error.message;
        }
      })
      .addCase(getPaymentsMadeExports.pending, state => {
        state.exportLoading = true;
      })
      .addCase(getPaymentsMadeExports.fulfilled, (state, action) => {
        state.exportLoading = false;
        state.message = action.payload.message;
      })
      .addCase(getPaymentsMadeExports.rejected, (state, action) => {
        state.exportLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(createPaymentsMade.pending, state => {
        state.submitLoading = true;
      })
      .addCase(createPaymentsMade.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.create = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createPaymentsMade.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updatePaymentsMade.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updatePaymentsMade.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.update = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(updatePaymentsMade.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getPaymentsMadeInvoice.pending, state => {
        state.droploading = true;
      })
      .addCase(getPaymentsMadeInvoice.fulfilled, (state, action) => {
        state.droploading = false;
        const p = action.payload;
        state.paymentsMadeInvoiceDrop = p?.data?.results ?? [];
        state.paymentsMadeOpeningBalance = p?.data?.openingBalanceTransactions ?? null;
        state.paymentsMadePendingExpenses = p?.data?.pendingExpenses ?? [];
        state.message = p?.message;
      })
      .addCase(getPaymentsMadeInvoice.rejected, (state, action) => {
        state.droploading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
        }
      })
      .addCase(approvePaymentsMade.pending, state => {
        state.approveLoading = true;
      })
      .addCase(approvePaymentsMade.fulfilled, (state, action) => {
        state.approveLoading = false;
        state.approve = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(approvePaymentsMade.rejected, (state, action) => {
        state.approveLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(rejectPaymentsMade.pending, state => {
        state.rejectLoading = true;
      })
      .addCase(rejectPaymentsMade.fulfilled, (state, action) => {
        state.rejectLoading = false;
        state.reject = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(rejectPaymentsMade.rejected, (state, action) => {
        state.rejectLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(cancelPaymentsMade.pending, state => {
        state.cancelLoading = true;
      })
      .addCase(cancelPaymentsMade.fulfilled, (state, action) => {
        state.cancelLoading = false;
        state.cancel = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(cancelPaymentsMade.rejected, (state, action) => {
        state.cancelLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getPaymentMadeById.pending, state => {
        state.loading = true;
      })
      .addCase(getPaymentMadeById.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentMade = action.payload.data;
      })
      .addCase(getPaymentMadeById.rejected, (state, action) => {
        state.loading = false;
        state.paymentMade = null;
        state.error = action.error.message;
      })
      .addCase(removePaymentMade.pending, state => {
        state.deleteLoading = true;
      })
      .addCase(removePaymentMade.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.remove = action.payload.data;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(removePaymentMade.rejected, (state, action) => {
        state.deleteLoading = false;
        state.remove = null;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(applyToBill.pending, state => {
        state.applyBillLoading = true;
      })
      .addCase(applyToBill.fulfilled, (state, action) => {
        state.applyBillLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(applyToBill.rejected, (state, action) => {
        state.applyBillLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(removeApplyBill.pending, state => {
        state.removeApplyBillLoading = true;
      })
      .addCase(removeApplyBill.fulfilled, (state, action) => {
        state.removeApplyBillLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(removeApplyBill.rejected, (state, action) => {
        state.removeApplyBillLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(autoApplyPendingAdvancePaymentMade.pending, state => {
        state.autoApplyLoading = true;
      })
      .addCase(autoApplyPendingAdvancePaymentMade.fulfilled, (state, action) => {
        state.autoApplyLoading = false;
        state.message = action.payload.message;
      })
      .addCase(autoApplyPendingAdvancePaymentMade.rejected, (state, action) => {
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
export const paymentsMadeSliceMethods = {
  getPaymentsMade,
  getPaymentsMadeExports,
  createPaymentsMade,
  updatePaymentsMade,
  getPaymentsMadeInvoice,
  approvePaymentsMade,
  rejectPaymentsMade,
  cancelPaymentsMade,
  getPaymentMadeById,
  removePaymentMade,
  applyToBill,
  removeApplyBill,
  autoApplyPendingAdvancePaymentMade,
  addRefund,
  updateRefund,
  deleteRefund,
};
export const { clearPaymentMadeInvoiceDrop, resetPaymentMade, resetPaymentsMade } = paymentsMadeSlice.actions;
export default paymentsMadeSlice.reducer;
