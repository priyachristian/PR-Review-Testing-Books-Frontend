import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { creditNoteService } from './creditNote.service';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getCreditNotes = createAsyncThunk('creditNotes/getCreditNotes', creditNoteService.getCreditNotes);

const createCreditNotes = createAsyncThunk('creditNotes/createCreditNotes', creditNoteService.createCreditNotes);

const updateCreditNotes = createAsyncThunk('creditNotes/updateCreditNotes', creditNoteService.updateCreditNotes);

const applyCreditNote = createAsyncThunk('creditNotes/applyCreditNote', creditNoteService.applyCreditNote);

const getCreditNoteById = createAsyncThunk('creditNotes/getCreditNoteById', creditNoteService.getCreditNoteById);

const removeCreditNote = createAsyncThunk('creditNotes/removeCreditNote', creditNoteService.removeCreditNote);

const removeCreditNoteInvoice = createAsyncThunk('creditNotes/removeCreditNoteInvoice', creditNoteService.removeCreditNoteInvoice);

const updateCreditNoteStatus = createAsyncThunk('creditNotes/updateCreditNoteStatus', creditNoteService.updateCreditNoteStatus);

const createCreditNoteRefund = createAsyncThunk('creditNotes/createCreditNoteRefund', creditNoteService.createCreditNoteRefund);

const deleteCreditNoteRefund = createAsyncThunk('creditNotes/deleteCreditNoteRefund', creditNoteService.deleteCreditNoteRefund);

const getCreditNoteExports = createAsyncThunk('creditNotes/getCreditNoteExports', creditNoteService.getCreditNoteExports);

export const creditNotesSlice = createSlice({
  name: 'creditNotes',
  initialState: {
    creditNotes: [],
    creditNote: null,
    pagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
    },
    creditNotePersonDrop: null,
    create: null,
    remove: null,
    update: null,
    loading: false,
    creditNoteRefundLoading: false,
    submitLoading: false,
    deleteLoading: false,
    exportLoading: false,
    error: null,
  },
  reducers: {
    resetCreditNote: state => {
      state.creditNote = null;
    },
    resetCreditNotes: state => {
      state.creditNotes = [];
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
      .addCase(getCreditNotes.pending, state => {
        state.loading = true;
      })
      .addCase(getCreditNotes.fulfilled, (state, action) => {
        state.loading = false;
        state.creditNotes = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalResults: action.payload.extras.totalResults,
          totalAmount: action.payload.extras.totalAmount,
          availableCreditAmount: action.payload.extras.availableCreditAmount,
        };
        state.message = action.payload.message;
      })
      .addCase(getCreditNotes.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.creditNotes = [];
          state.error = action.error.message;
        }
      })
      .addCase(createCreditNotes.pending, state => {
        state.submitLoading = true;
      })
      .addCase(createCreditNotes.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.create = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createCreditNotes.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(applyCreditNote.pending, state => {
        state.loading = true;
      })
      .addCase(applyCreditNote.fulfilled, (state, action) => {
        state.loading = false;
        state.create = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(applyCreditNote.rejected, (state, action) => {
        state.loading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updateCreditNotes.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updateCreditNotes.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.update = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(updateCreditNotes.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getCreditNoteById.pending, state => {
        state.loading = true;
      })
      .addCase(getCreditNoteById.fulfilled, (state, action) => {
        state.loading = false;
        state.creditNote = action.payload.data;
      })
      .addCase(getCreditNoteById.rejected, (state, action) => {
        state.loading = false;
        state.creditNote = null;
        state.error = action.error.message;
      })
      .addCase(removeCreditNote.pending, state => {
        state.deleteLoading = true;
      })
      .addCase(removeCreditNote.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.remove = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(removeCreditNote.rejected, (state, action) => {
        state.deleteLoading = false;
        state.remove = null;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(removeCreditNoteInvoice.pending, state => {
        state.submitLoading = true;
      })
      .addCase(removeCreditNoteInvoice.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.remove = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(removeCreditNoteInvoice.rejected, (state, action) => {
        state.submitLoading = false;
        state.remove = null;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updateCreditNoteStatus.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updateCreditNoteStatus.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(updateCreditNoteStatus.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(createCreditNoteRefund.pending, state => {
        state.creditNoteRefundLoading = true;
      })
      .addCase(createCreditNoteRefund.fulfilled, (state, action) => {
        state.creditNoteRefundLoading = false;
        state.create = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createCreditNoteRefund.rejected, (state, action) => {
        state.creditNoteRefundLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(deleteCreditNoteRefund.pending, state => {
        state.creditNoteRefundLoading = true;
      })
      .addCase(deleteCreditNoteRefund.fulfilled, (state, action) => {
        state.creditNoteRefundLoading = false;
        state.remove = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(deleteCreditNoteRefund.rejected, (state, action) => {
        state.creditNoteRefundLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getCreditNoteExports.pending, state => {
        state.exportLoading = true;
      })
      .addCase(getCreditNoteExports.fulfilled, (state, action) => {
        state.exportLoading = false;
        state.message = action.payload.message;
      })
      .addCase(getCreditNoteExports.rejected, (state, action) => {
        state.exportLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      });
  },
});
export const creditNotesSliceMethods = {
  getCreditNotes,
  createCreditNotes,
  updateCreditNotes,
  applyCreditNote,
  getCreditNoteById,
  removeCreditNote,
  removeCreditNoteInvoice,
  updateCreditNoteStatus,
  createCreditNoteRefund,
  deleteCreditNoteRefund,
  getCreditNoteExports,
};
export const { resetCreditNote, resetCreditNotes } = creditNotesSlice.actions;
export default creditNotesSlice.reducer;
