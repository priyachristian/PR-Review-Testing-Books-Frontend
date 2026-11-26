import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { billsService } from './bill.service';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getBills = createAsyncThunk('bills/getBills', billsService.getBills);

const getPendingBills = createAsyncThunk('bills/getPendingBills', billsService.getPendingBills);

const getBillDropdown = createAsyncThunk('bills/getBillDropdown', billsService.getBillDropdown);

const createBills = createAsyncThunk('bills/createBills', async (billsData, { rejectWithValue }) => {
  try {
    const data = await billsService.createBills(billsData);
    return data;
  } catch (error) {
    console.error('Error in create Bills thunk:', error);
    return rejectWithValue(error?.response?.data || error || 'Something went wrong');
  }
});

const updateBills = createAsyncThunk('bills/updateBills', async ({ billsId, billsData }, { rejectWithValue }) => {
  try {
    const data = await billsService.updateBills(billsId, billsData);
    return data;
  } catch (error) {
    console.error('Error in update Bills thunk:', error);
    return rejectWithValue(error?.response?.data || error || 'Something went wrong');
  }
});

const updateStatus = createAsyncThunk('bills/updateStatus', billsService.updateStatus);

const getBillById = createAsyncThunk('bills/getBillById', billsService.getBillById);

const removeBill = createAsyncThunk('bills/removeBill', billsService.removeBill);

const exportBill = createAsyncThunk('bills/exportBill', billsService.exportBill);

const getPaymentHistory = createAsyncThunk('bills/getPaymentHistory', billsService.getPaymentHistory);

const createSplitBill = createAsyncThunk('bills/createSplitBill', billsService.createSplitBill);
const applyVendorCreditToBill = createAsyncThunk('bills/applyVendorCreditToBill', billsService.applyVendorCreditToBill);

const removeOpeningBalanceApplication = createAsyncThunk('bills/removeOpeningBalanceApplication', billsService.removeOpeningBalanceApplication);

const autoMapOpeningBalanceToBills = createAsyncThunk('bills/autoMapOpeningBalanceToBills', billsService.autoMapOpeningBalanceToBills);

export const billsSlice = createSlice({
  name: 'bills',
  initialState: {
    bills: [],
    bill: null,
    vendorPendingBills: [],
    vendorPendingOpeningBalance: null,
    pagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
    },
    create: null,
    update: null,
    remove: null,
    loading: false,
    submitLoading: false,
    deleteLoading: false,
    pendingBillsLoading: false,
    billDropLoading: false,
    submitWithStatusLoading: false,
    error: null,
    exportLoading: false,
    exportBillData: null,
    paymentHistory: null,
    paymentHistoryLoading: false,
    applyVendorCreditLoading: false,
    removeObApplicationLoading: false,
    autoMapOpeningBalanceLoading: false,
  },
  reducers: {
    resetBill: state => {
      state.bill = null;
    },
    resetBills: state => {
      state.bills = [];
      state.pagination = {
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        totalPages: 1,
        totalResults: 0,
      };
    },
    resetPaymentHistory: state => {
      state.paymentHistory = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getBills.pending, state => {
        state.loading = true;
      })
      .addCase(getBills.fulfilled, (state, action) => {
        state.loading = false;
        state.bills = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalResults: action.payload.extras.totalResults,
          totalAmount: action.payload.extras.totalAmount,
          totalBalance: action.payload.extras.totalBalance,
          totalPaid: action.payload.extras.totalPaid,
        };
        state.message = action.payload.message;
      })
      .addCase(getBills.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.bills = [];
          state.error = action.error.message;
        }
      })
      .addCase(getPendingBills.pending, state => {
        state.vendorPendingBills = [];
        state.vendorPendingOpeningBalance = null;
        state.pendingBillsLoading = true;
      })
      .addCase(getPendingBills.fulfilled, (state, action) => {
        state.vendorPendingBills = action.payload.data?.results;
        state.vendorPendingOpeningBalance = action.payload.data?.openingBalanceTransactions ?? null;
        state.message = action.payload.message;
        state.pendingBillsLoading = false;
      })
      .addCase(getPendingBills.rejected, (state, action) => {
        state.error = action.error.message;
        state.pendingBillsLoading = false;
      })
      .addCase(getBillDropdown.pending, state => {
        state.billDropLoading = true;
      })
      .addCase(getBillDropdown.fulfilled, state => {
        state.billDropLoading = false;
      })
      .addCase(getBillDropdown.rejected, state => {
        state.billDropLoading = false;
      })
      .addCase(createBills.pending, (state, action) => {
        if (action?.meta?.arg?.status) {
          state.submitWithStatusLoading = true;
        } else {
          state.submitLoading = true;
        }
      })
      .addCase(createBills.fulfilled, (state, action) => {
        if (action?.meta?.arg?.status) {
          state.submitWithStatusLoading = false;
        } else {
          state.submitLoading = false;
        }
        state.create = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createBills.rejected, (state, action) => {
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
      .addCase(updateBills.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updateBills.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.update = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(updateBills.rejected, (state, action) => {
        state.submitLoading = false;
        state.error = action.payload;
        if (!action?.payload?.data?.isCreditLimitError) {
          Toast.error(action?.payload?.message || 'Something went wrong');
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
      .addCase(getBillById.pending, state => {
        state.loading = true;
      })
      .addCase(getBillById.fulfilled, (state, action) => {
        state.loading = false;
        state.bill = action.payload.data;
      })
      .addCase(getBillById.rejected, (state, action) => {
        state.loading = false;
        state.bill = null;
        state.error = action.error.message;
      })
      .addCase(removeBill.pending, state => {
        state.deleteLoading = true;
      })
      .addCase(removeBill.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.remove = action.payload.data;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(removeBill.rejected, (state, action) => {
        state.deleteLoading = false;
        state.remove = null;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(exportBill.pending, state => {
        state.exportLoading = true;
      })
      .addCase(exportBill.fulfilled, (state, action) => {
        state.exportLoading = false;
        state.exportBillData = action.payload.data;
      })
      .addCase(exportBill.rejected, (state, action) => {
        state.exportLoading = false;
        state.exportBillData = null;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getPaymentHistory.pending, state => {
        state.paymentHistoryLoading = true;
      })
      .addCase(getPaymentHistory.fulfilled, (state, action) => {
        state.paymentHistoryLoading = false;
        state.paymentHistory = action.payload.data;
      })
      .addCase(getPaymentHistory.rejected, state => {
        state.paymentHistoryLoading = false;
        state.paymentHistory = null;
      })
      .addCase(createSplitBill.pending, state => {
        state.submitLoading = true;
      })
      .addCase(createSplitBill.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createSplitBill.rejected, (state, action) => {
        state.submitLoading = false;
        state.error = action.error.message;
        Toast.error(state.error);
      })
      .addCase(applyVendorCreditToBill.pending, state => {
        state.applyVendorCreditLoading = true;
      })
      .addCase(applyVendorCreditToBill.fulfilled, (state, action) => {
        state.applyVendorCreditLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(applyVendorCreditToBill.rejected, (state, action) => {
        state.applyVendorCreditLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(removeOpeningBalanceApplication.pending, state => {
        state.removeObApplicationLoading = true;
      })
      .addCase(removeOpeningBalanceApplication.fulfilled, (state, action) => {
        state.removeObApplicationLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(removeOpeningBalanceApplication.rejected, (state, action) => {
        state.removeObApplicationLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(autoMapOpeningBalanceToBills.pending, state => {
        state.autoMapOpeningBalanceLoading = true;
      })
      .addCase(autoMapOpeningBalanceToBills.fulfilled, (state, action) => {
        state.autoMapOpeningBalanceLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(autoMapOpeningBalanceToBills.rejected, (state, action) => {
        state.autoMapOpeningBalanceLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      });
  },
});
export const billsSliceMethods = {
  getBills,
  getPendingBills,
  getBillDropdown,
  createBills,
  updateBills,
  updateStatus,
  getBillById,
  removeBill,
  exportBill,
  getPaymentHistory,
  createSplitBill,
  applyVendorCreditToBill,
  removeOpeningBalanceApplication,
  autoMapOpeningBalanceToBills,
};
export const { resetBill, resetBills, resetPaymentHistory } = billsSlice.actions;
export default billsSlice.reducer;
