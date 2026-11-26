import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { invoiceService } from './invoice.service';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getInvoice = createAsyncThunk('invoice/getInvoice', invoiceService.getInvoice);

const getPendingInvoice = createAsyncThunk('invoice/getPendingInvoice', invoiceService.getPendingInvoice);

const getInvoiceDropdown = createAsyncThunk('invoice/getInvoiceDropdown', invoiceService.getInvoiceDropdown);

const createInvoices = createAsyncThunk('invoice/createInvoices', async (invoiceData, { rejectWithValue }) => {
  try {
    const data = await invoiceService.createInvoices(invoiceData);
    return data;
  } catch (error) {
    console.error('Error in create Invoice thunk:', error);
    return rejectWithValue(error?.response?.data || error || 'Something went wrong');
  }
});

const updateInvoices = createAsyncThunk('invoice/updateInvoices', async ({ invoiceId, invoiceData }, { rejectWithValue }) => {
  try {
    const data = await invoiceService.updateInvoices({ invoiceId, invoiceData });
    return data;
  } catch (error) {
    console.error('Error in update Invoice thunk:', error);
    return rejectWithValue(error?.response?.data || error || 'Something went wrong');
  }
});

const invoiceFileUpload = createAsyncThunk('invoice/invoiceFileUpload', invoiceService.invoiceFileUpload);

const updateStatus = createAsyncThunk('invoice/updateStatus', invoiceService.updateStatus);

const getInvoiceTransport = createAsyncThunk('invoice/getInvoiceTransport', invoiceService.getInvoiceTransport);

const createInvoiceTransport = createAsyncThunk('invoice/createInvoiceTransport', invoiceService.createInvoiceTransport);

const updateInvoiceTransport = createAsyncThunk('invoice/updateInvoiceTransport', invoiceService.updateInvoiceTransport);

const getInvoiceDispatch = createAsyncThunk('invoice/getInvoiceDispatch', invoiceService.getInvoiceDispatch);

const createInvoiceDispatch = createAsyncThunk('invoice/createInvoiceDispatch', invoiceService.createInvoiceDispatch);

const updateInvoiceDispatch = createAsyncThunk('invoice/updateInvoiceDispatch', invoiceService.updateInvoiceDispatch);

const bookingCopyFileUpload = createAsyncThunk('invoice/bookingCopyFileUpload', invoiceService.bookingCopyFileUpload);

const truckGoodsFileUpload = createAsyncThunk('invoice/truckGoodsFileUpload', invoiceService.truckGoodsFileUpload);

const vehicleGoodsFileUpload = createAsyncThunk('invoice/vehicleGoodsFileUpload', invoiceService.vehicleGoodsFileUpload);

const getInvoiceById = createAsyncThunk('invoice/getInvoiceById', invoiceService.getInvoiceById);

const removeInvoice = createAsyncThunk('invoice/removeInvoice', invoiceService.removeInvoice);

const getInvoiceExports = createAsyncThunk('invoice/getInvoiceExports', invoiceService.getInvoiceExports);

const removeDispatchInvoice = createAsyncThunk('invoice/removeDispatchInvoice', invoiceService.removeDispatchInvoice);

const generateEInvoice = createAsyncThunk('invoice/generateEInvoice', async (payload, { rejectWithValue }) => {
  try {
    const data = await invoiceService.generateEInvoice(payload);
    return data;
  } catch (error) {
    console.error('Error in generateEInvoice thunk:', error);
    const message = error?.response?.data?.message || error.message || 'Something went wrong';
    const data = error?.response?.data?.data;
    return rejectWithValue({ message, data });
  }
});

const cancelEInvoice = createAsyncThunk('invoice/cancelEInvoice', invoiceService.cancelEInvoice);

const generateEWayBill = createAsyncThunk('invoice/generateEWayBill', invoiceService.generateEWayBill);

const generateOnlyEWayBill = createAsyncThunk('invoice/generateOnlyEWayBill', async (payload, { rejectWithValue }) => {
  try {
    const data = await invoiceService.generateOnlyEWayBill(payload);
    return data;
  } catch (error) {
    console.error('Error in generateOnlyEWayBill thunk:', error);
    const message = error?.response?.data?.message || error.message || 'Something went wrong';
    const data = error?.response?.data?.data;
    return rejectWithValue({ message, data });
  }
});

const cancelOnlyEWayBill = createAsyncThunk('invoice/cancelOnlyEWayBill', invoiceService.cancelOnlyEWayBill);

const cancelEWayBill = createAsyncThunk('invoice/cancelEWayBill', invoiceService.cancelEWayBill);

const refetchEInvoice = createAsyncThunk('invoice/refetchEInvoice', invoiceService.refetchEInvoice);

const getGstDocumentOptions = createAsyncThunk('invoice/getGstDocumentOptions', invoiceService.getGstDocumentOptions);

const getPaymentHistory = createAsyncThunk('invoice/getPaymentHistory', invoiceService.getPaymentHistory);

const fetchGstinDetails = createAsyncThunk('invoice/fetchGstinDetails', invoiceService.fetchGstinDetails);

const createSplitInvoice = createAsyncThunk('invoice/createSplitInvoice', invoiceService.createSplitInvoice);

const applyCustomerCreditToInvoice = createAsyncThunk('invoice/applyCustomerCreditToInvoice', invoiceService.applyCustomerCreditToInvoice);

const removeOpeningBalanceApplication = createAsyncThunk('invoice/removeOpeningBalanceApplication', invoiceService.removeOpeningBalanceApplication);

const autoMapOpeningBalanceToInvoices = createAsyncThunk('invoice/autoMapOpeningBalanceToInvoices', invoiceService.autoMapOpeningBalanceToInvoices);

export const invoiceSlice = createSlice({
  name: 'invoice',
  initialState: {
    invoices: [],
    invoice: null,
    customerPendingInvoice: [],
    compliancePendingCount: { eInvoicePendingCount: 0, eWayBillPendingCount: 0 },
    invoiceFile: null,
    pagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
    },
    invoicePersonDrop: null,
    bookingCopyFile: null,
    truckGoodsFile: null,
    vehicleGoodsFile: null,
    invoiceTransport: [],
    createTransport: null,
    invoiceDispatch: null,
    createLoading: false,
    dispatchLoading: false,
    invoiceDispatchLoading: false,
    dispatchDeleteLoading: false,
    create: null,
    remove: null,
    update: null,
    updateTransport: null,
    loading: false,
    pendingInvoiceLoading: false,
    invoiceDropLoading: false,
    createDispatch: null,
    updateDispatch: null,
    submitLoading: false,
    deleteLoading: false,
    submitWithStatusLoading: false,
    submitEInvoiceLoading: false,
    submitEWayBillLoading: false,
    submitOnlyEWayBillLoading: false,
    cancelEInvoiceLoading: false,
    cancelEWayBillLoading: false,
    cancelOnlyEWayBillLoading: false,
    refetchEInvoiceLoading: false,
    fetchGstinLoading: false,
    uploading: false,
    droploading: false,
    exportLoading: false,
    paymentHistory: null,
    paymentHistoryLoading: false,
    applyCustomerCreditLoading: false,
    autoMapOpeningBalanceLoading: false,
    error: null,
  },
  reducers: {
    clearInvoiceDispatch: state => {
      state.invoiceDispatch = null;
    },

    resetInvoice: state => {
      state.invoice = null;
    },
    resetInvoices: state => {
      state.invoices = [];
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
      .addCase(getInvoice.pending, state => {
        state.loading = true;
      })
      .addCase(getInvoice.fulfilled, (state, action) => {
        state.loading = false;
        state.invoices = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalResults: action.payload.extras.totalResults,
          totalAmount: action.payload.extras.totalInvoiceAmount,
          totalReceived: action.payload.extras.totalReceived,
          totalBalance: action.payload.extras.totalBalance,
        };
        if (action.payload.extras?.eInvoicePendingCount !== undefined) {
          state.compliancePendingCount = {
            eInvoicePendingCount: action.payload.extras.eInvoicePendingCount || 0,
            eWayBillPendingCount: action.payload.extras.eWayBillPendingCount || 0,
          };
        }
        state.message = action.payload.message;
      })
      .addCase(getInvoice.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.invoices = [];
          state.error = action.error.message;
        }
      })
      .addCase(getPendingInvoice.pending, state => {
        state.customerPendingInvoice = [];
        state.pendingInvoiceLoading = true;
      })
      .addCase(getPendingInvoice.fulfilled, (state, action) => {
        state.customerPendingInvoice = action.payload.data?.results;
        state.message = action.payload.message;
        state.pendingInvoiceLoading = false;
      })
      .addCase(getPendingInvoice.rejected, (state, action) => {
        state.customerPendingInvoice = [];
        state.error = action.error.message;
        state.pendingInvoiceLoading = false;
      })
      .addCase(getInvoiceDropdown.pending, state => {
        state.invoiceDropLoading = true;
      })
      .addCase(getInvoiceDropdown.fulfilled, state => {
        state.invoiceDropLoading = false;
      })
      .addCase(getInvoiceDropdown.rejected, state => {
        state.invoiceDropLoading = false;
      })
      .addCase(createInvoices.pending, (state, action) => {
        if (action?.meta?.arg?.status) {
          state.submitWithStatusLoading = true;
        } else {
          state.submitLoading = true;
        }
      })
      .addCase(createInvoices.fulfilled, (state, action) => {
        if (action?.meta?.arg?.status) {
          state.submitWithStatusLoading = false;
        } else {
          state.submitLoading = false;
        }
        state.create = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createInvoices.rejected, (state, action) => {
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
      .addCase(updateInvoices.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updateInvoices.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.update = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(updateInvoices.rejected, (state, action) => {
        state.submitLoading = false;
        state.error = action.payload;
        if (!action?.payload?.data?.isCreditLimitError) {
          Toast.error(action?.payload?.message || 'Something went wrong');
        }
      })
      .addCase(invoiceFileUpload.pending, state => {
        state.uploading = true;
      })
      .addCase(invoiceFileUpload.fulfilled, (state, action) => {
        state.uploading = false;
        state.invoiceFile = action.payload.data.urls;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(invoiceFileUpload.rejected, (state, action) => {
        state.uploading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
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
      .addCase(getInvoiceById.pending, (state, action) => {
        if (!action.meta.arg?.silent) state.loading = true;
      })
      .addCase(getInvoiceById.fulfilled, (state, action) => {
        if (!action.meta.arg?.silent) state.loading = false;
        state.invoice = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getInvoiceById.rejected, (state, action) => {
        if (!action.meta.arg?.silent) state.loading = false;
        if (!action.meta.arg?.silent) state.invoice = null;
        state.error = action.error.message;
      })
      .addCase(getInvoiceTransport.pending, state => {
        state.droploading = true;
      })
      .addCase(getInvoiceTransport.fulfilled, (state, action) => {
        state.droploading = false;
        state.invoiceTransport = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getInvoiceTransport.rejected, (state, action) => {
        state.droploading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(createInvoiceTransport.pending, state => {
        state.createLoading = true;
      })
      .addCase(createInvoiceTransport.fulfilled, (state, action) => {
        state.createLoading = false;
        state.createTransport = action.payload.data;
        state.invoiceTransport.unshift(action.payload.data);
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createInvoiceTransport.rejected, (state, action) => {
        state.createLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updateInvoiceTransport.pending, state => {
        state.createLoading = true;
      })
      .addCase(updateInvoiceTransport.fulfilled, (state, action) => {
        state.createLoading = false;
        state.updateTransport = action.payload;
        const updatedTransport = action.payload.data;
        const index = state.invoiceTransport.findIndex(item => item.id === updatedTransport.id);
        if (index !== -1) {
          state.invoiceTransport[index] = updatedTransport;
        }
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(updateInvoiceTransport.rejected, (state, action) => {
        state.createLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getInvoiceDispatch.pending, state => {
        state.dispatchLoading = true;
      })
      .addCase(getInvoiceDispatch.fulfilled, (state, action) => {
        state.dispatchLoading = false;
        state.invoiceDispatch = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getInvoiceDispatch.rejected, (state, action) => {
        state.dispatchLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(createInvoiceDispatch.pending, state => {
        state.invoiceDispatchLoading = true;
      })
      .addCase(createInvoiceDispatch.fulfilled, (state, action) => {
        state.invoiceDispatchLoading = false;
        state.createDispatch = action.payload.data;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createInvoiceDispatch.rejected, (state, action) => {
        state.invoiceDispatchLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updateInvoiceDispatch.pending, state => {
        state.invoiceDispatchLoading = true;
      })
      .addCase(updateInvoiceDispatch.fulfilled, (state, action) => {
        state.invoiceDispatchLoading = false;
        state.updateDispatch = action.payload.data;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(updateInvoiceDispatch.rejected, (state, action) => {
        state.invoiceDispatchLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(bookingCopyFileUpload.pending, state => {
        state.uploading = true;
      })
      .addCase(bookingCopyFileUpload.fulfilled, (state, action) => {
        state.uploading = false;
        state.bookingCopyFile = action.payload.data.urls;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(bookingCopyFileUpload.rejected, (state, action) => {
        state.uploading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(truckGoodsFileUpload.pending, state => {
        state.uploading = true;
      })
      .addCase(truckGoodsFileUpload.fulfilled, (state, action) => {
        state.uploading = false;
        state.truckGoodsFile = action.payload.data.urls;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(truckGoodsFileUpload.rejected, (state, action) => {
        state.uploading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(vehicleGoodsFileUpload.pending, state => {
        state.uploading = true;
      })
      .addCase(vehicleGoodsFileUpload.fulfilled, (state, action) => {
        state.uploading = false;
        state.vehicleGoodsFile = action.payload.data.urls;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(vehicleGoodsFileUpload.rejected, (state, action) => {
        state.uploading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(removeInvoice.pending, state => {
        state.deleteLoading = true;
      })
      .addCase(removeInvoice.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.remove = action.payload.data;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(removeInvoice.rejected, (state, action) => {
        state.deleteLoading = false;
        state.remove = null;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getInvoiceExports.pending, state => {
        state.exportLoading = true;
      })
      .addCase(getInvoiceExports.fulfilled, (state, action) => {
        state.exportLoading = false;
        state.message = action.payload.message;
      })
      .addCase(getInvoiceExports.rejected, (state, action) => {
        state.exportLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(removeDispatchInvoice.pending, state => {
        state.dispatchDeleteLoading = true;
      })
      .addCase(removeDispatchInvoice.fulfilled, (state, action) => {
        state.dispatchDeleteLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(removeDispatchInvoice.rejected, (state, action) => {
        state.dispatchDeleteLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(generateEInvoice.pending, state => {
        state.submitEInvoiceLoading = true;
      })
      .addCase(generateEInvoice.fulfilled, (state, action) => {
        state.submitEInvoiceLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(generateEInvoice.rejected, (state, action) => {
        state.submitEInvoiceLoading = false;
        state.error = action.payload?.message || action.error.message;
        const errorLines = state?.error.split(',').map((line, index) => <div key={index}>{line.trim()}</div>);
        Toast.error(<div className="text-left">{errorLines}</div>);
      })
      .addCase(cancelEInvoice.pending, state => {
        state.cancelEInvoiceLoading = true;
      })
      .addCase(cancelEInvoice.fulfilled, (state, action) => {
        state.cancelEInvoiceLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(cancelEInvoice.rejected, (state, action) => {
        state.cancelEInvoiceLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(generateEWayBill.pending, state => {
        state.submitEWayBillLoading = true;
      })
      .addCase(generateEWayBill.fulfilled, (state, action) => {
        state.submitEWayBillLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(generateEWayBill.rejected, (state, action) => {
        state.submitEWayBillLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(generateOnlyEWayBill.pending, state => {
        state.submitOnlyEWayBillLoading = true;
      })
      .addCase(generateOnlyEWayBill.fulfilled, (state, action) => {
        state.submitOnlyEWayBillLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(generateOnlyEWayBill.rejected, (state, action) => {
        state.submitOnlyEWayBillLoading = false;
        state.error = action.payload?.message || action.error.message;
        const errorMessage = state.error || 'Something went wrong';
        const errorLines = errorMessage.split(',').map((line, index) => <div key={index}>{line.trim()}</div>);
        Toast.error(<div className="text-left">{errorLines}</div>);
      })
      .addCase(cancelEWayBill.pending, state => {
        state.cancelEWayBillLoading = true;
      })
      .addCase(cancelEWayBill.fulfilled, (state, action) => {
        state.cancelEWayBillLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(cancelEWayBill.rejected, (state, action) => {
        state.cancelEWayBillLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(refetchEInvoice.pending, state => {
        state.refetchEInvoiceLoading = true;
      })
      .addCase(refetchEInvoice.fulfilled, (state, action) => {
        state.refetchEInvoiceLoading = false;
        state.message = action?.payload?.message;
        Toast.success(state.message);
      })
      .addCase(refetchEInvoice.rejected, (state, action) => {
        state.refetchEInvoiceLoading = false;
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
        state.paymentHistory = action?.payload?.data;
      })
      .addCase(getPaymentHistory.rejected, state => {
        state.paymentHistoryLoading = false;
        state.paymentHistory = null;
      })
      .addCase(fetchGstinDetails.pending, state => {
        state.fetchGstinLoading = true;
      })
      .addCase(fetchGstinDetails.fulfilled, state => {
        state.fetchGstinLoading = false;
      })
      .addCase(fetchGstinDetails.rejected, (state, action) => {
        state.fetchGstinLoading = false;
        state.error = action.error.message;
      })
      .addCase(cancelOnlyEWayBill.pending, state => {
        state.cancelOnlyEWayBillLoading = true;
      })
      .addCase(cancelOnlyEWayBill.fulfilled, (state, action) => {
        state.cancelOnlyEWayBillLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(cancelOnlyEWayBill.rejected, (state, action) => {
        state.cancelOnlyEWayBillLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(createSplitInvoice.pending, state => {
        state.submitLoading = true;
      })
      .addCase(createSplitInvoice.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createSplitInvoice.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(applyCustomerCreditToInvoice.pending, state => {
        state.applyCustomerCreditLoading = true;
      })
      .addCase(applyCustomerCreditToInvoice.fulfilled, (state, action) => {
        state.applyCustomerCreditLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(applyCustomerCreditToInvoice.rejected, (state, action) => {
        state.applyCustomerCreditLoading = false;
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
      .addCase(autoMapOpeningBalanceToInvoices.pending, state => {
        state.autoMapOpeningBalanceLoading = true;
      })
      .addCase(autoMapOpeningBalanceToInvoices.fulfilled, (state, action) => {
        state.autoMapOpeningBalanceLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(autoMapOpeningBalanceToInvoices.rejected, (state, action) => {
        state.autoMapOpeningBalanceLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      });
  },
});
export const invoiceSliceMethods = {
  getInvoice,
  getPendingInvoice,
  getInvoiceDropdown,
  createInvoices,
  updateInvoices,
  invoiceFileUpload,
  updateStatus,
  getInvoiceById,
  getInvoiceTransport,
  createInvoiceTransport,
  getInvoiceDispatch,
  createInvoiceDispatch,
  updateInvoiceDispatch,
  bookingCopyFileUpload,
  truckGoodsFileUpload,
  vehicleGoodsFileUpload,
  updateInvoiceTransport,
  removeInvoice,
  getInvoiceExports,
  removeDispatchInvoice,
  generateEInvoice,
  cancelEInvoice,
  generateEWayBill,
  generateOnlyEWayBill,
  cancelEWayBill,
  cancelOnlyEWayBill,
  refetchEInvoice,
  getGstDocumentOptions,
  getPaymentHistory,
  fetchGstinDetails,
  createSplitInvoice,
  applyCustomerCreditToInvoice,
  removeOpeningBalanceApplication,
  autoMapOpeningBalanceToInvoices,
};
export const { clearInvoiceDispatch, resetInvoice, resetInvoices, resetPaymentHistory } = invoiceSlice.actions;
export default invoiceSlice.reducer;
