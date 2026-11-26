import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { debitNotesService } from './debitNote.service';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getDebitNotes = createAsyncThunk('debitNote/getDebitNotes', debitNotesService.getDebitNotes);

const createDebitNotes = createAsyncThunk('debitNote/createDebitNotes', debitNotesService.createDebitNotes);

const updateDebitNotes = createAsyncThunk('debitNote/updateDebitNotes', debitNotesService.updateDebitNotes);

const applyDebitNote = createAsyncThunk('debitNote/applyDebitNote', debitNotesService.applyDebitNote);

const getDebitNoteById = createAsyncThunk('debitNote/getDebitNoteById', debitNotesService.getDebitNoteById);

const removeDebitNote = createAsyncThunk('debitNote/removeDebitNote', debitNotesService.removeDebitNote);

const removeDebitNoteBillsApplied = createAsyncThunk('debitNote/removeDebitNoteBillsApplied', debitNotesService.removeDebitNoteBillsApplied);

const updateDebitNoteStatus = createAsyncThunk('debitNote/updateDebitNoteStatus', debitNotesService.updateDebitNoteStatus);

const createDebitNoteRefund = createAsyncThunk('debitNote/createDebitNoteRefund', debitNotesService.createDebitNoteRefund);

const deleteDebitNoteRefund = createAsyncThunk('debitNote/deleteDebitNoteRefund', debitNotesService.deleteDebitNoteRefund);

const getDebitNoteExports = createAsyncThunk('debitNote/getDebitNoteExports', debitNotesService.getDebitNoteExports);

export const debitNotesSlice = createSlice({
  name: 'debitNote',
  initialState: {
    debitNotes: [],
    debitNote: null,
    debitNoteFile: null,
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
    debitNoteRefundLoading: false,
    exportLoading: false,
    uploading: false,
    droploading: false,
    error: null,
  },
  reducers: {
    resetDebitNote: state => {
      state.debitNote = null;
    },
    resetDebitNotes: state => {
      state.debitNotes = [];
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
      .addCase(getDebitNotes.pending, state => {
        state.loading = true;
      })
      .addCase(getDebitNotes.fulfilled, (state, action) => {
        state.loading = false;
        state.debitNotes = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalResults: action.payload.extras.totalResults,
          totalAmount: action.payload.extras.totalAmount,
        };
        state.message = action.payload.message;
      })
      .addCase(getDebitNotes.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.debitNotes = [];
          state.error = action.error.message;
        }
      })
      .addCase(createDebitNotes.pending, state => {
        state.submitLoading = true;
      })
      .addCase(createDebitNotes.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.create = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createDebitNotes.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updateDebitNotes.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updateDebitNotes.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.update = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(updateDebitNotes.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(applyDebitNote.pending, state => {
        state.loading = true;
      })
      .addCase(applyDebitNote.fulfilled, (state, action) => {
        state.loading = false;
        state.create = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(applyDebitNote.rejected, (state, action) => {
        state.loading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getDebitNoteById.pending, state => {
        state.loading = true;
      })
      .addCase(getDebitNoteById.fulfilled, (state, action) => {
        state.loading = false;
        state.debitNote = action.payload.data;
      })
      .addCase(getDebitNoteById.rejected, (state, action) => {
        state.loading = false;
        state.debitNote = null;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
        }
      })
      .addCase(removeDebitNote.pending, state => {
        state.deleteLoading = true;
      })
      .addCase(removeDebitNote.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.remove = action.payload?.data;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(removeDebitNote.rejected, (state, action) => {
        state.deleteLoading = false;
        state.remove = null;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(removeDebitNoteBillsApplied.pending, state => {
        state.submitLoading = true;
      })
      .addCase(removeDebitNoteBillsApplied.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.remove = action.payload?.data;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(removeDebitNoteBillsApplied.rejected, (state, action) => {
        state.submitLoading = false;
        state.remove = null;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updateDebitNoteStatus.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updateDebitNoteStatus.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(updateDebitNoteStatus.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(createDebitNoteRefund.pending, state => {
        state.debitNoteRefundLoading = true;
      })
      .addCase(createDebitNoteRefund.fulfilled, (state, action) => {
        state.debitNoteRefundLoading = false;
        state.create = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createDebitNoteRefund.rejected, (state, action) => {
        state.debitNoteRefundLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(deleteDebitNoteRefund.pending, state => {
        state.debitNoteRefundLoading = true;
      })
      .addCase(deleteDebitNoteRefund.fulfilled, (state, action) => {
        state.debitNoteRefundLoading = false;
        state.remove = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(deleteDebitNoteRefund.rejected, (state, action) => {
        state.debitNoteRefundLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getDebitNoteExports.pending, state => {
        state.exportLoading = true;
      })
      .addCase(getDebitNoteExports.fulfilled, (state, action) => {
        state.exportLoading = false;
        state.message = action.payload.message;
      })
      .addCase(getDebitNoteExports.rejected, (state, action) => {
        state.exportLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      });
  },
});
export const debitNotesSliceMethods = {
  getDebitNotes,
  createDebitNotes,
  updateDebitNotes,
  applyDebitNote,
  getDebitNoteById,
  removeDebitNote,
  removeDebitNoteBillsApplied,
  updateDebitNoteStatus,
  createDebitNoteRefund,
  deleteDebitNoteRefund,
  getDebitNoteExports,
};
export const { resetDebitNote, resetDebitNotes } = debitNotesSlice.actions;
export default debitNotesSlice.reducer;
