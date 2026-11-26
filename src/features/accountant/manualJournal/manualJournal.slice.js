import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { manualJournalService } from './manualJournal.service';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getManualJournal = createAsyncThunk('manualJournal/getManualJournal', manualJournalService.getManualJournal);

const createManualJournal = createAsyncThunk('manualJournal/createManualJournal', manualJournalService.createManualJournal);

const updateManualJournal = createAsyncThunk('manualJournal/updateManualJournal', manualJournalService.updateManualJournal);

const getManualJournalById = createAsyncThunk('manualJournal/getManualJournalById', manualJournalService.getManualJournalById);

const getContactDropdown = createAsyncThunk('manualJournal/getContactDropdown', manualJournalService.getContactDropdown);

const removeManualJournal = createAsyncThunk('manualJournal/removeManualJournal', manualJournalService.removeManualJournal);

export const manualJournalSlice = createSlice({
  name: 'manualJournal',
  initialState: {
    journals: [],
    pagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
    },
    create: null,
    update: null,
    manualJournalFile: null,
    loading: false,
    submitLoading: false,
    deleteLoading: false,
    uploading: false,
    error: null,
    journal: null,
    contactDropdown: [],
  },
  reducers: {
    resetManualJournal: state => {
      state.journal = null;
      state.error = null;
      state.message = null;
      state.loading = false;
    },
    resetManualJournals: state => {
      state.journals = [];
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
      .addCase(getManualJournal.pending, state => {
        state.loading = true;
      })
      .addCase(getManualJournal.fulfilled, (state, action) => {
        state.loading = false;
        state.journals = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalResults: action.payload.extras.totalResults,
        };
        state.message = action.payload.message;
      })
      .addCase(getManualJournal.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.journals = [];
          state.error = action.error.message;
        }
      })
      .addCase(createManualJournal.pending, state => {
        state.submitLoading = true;
      })
      .addCase(createManualJournal.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.create = action.payload.data;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createManualJournal.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updateManualJournal.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updateManualJournal.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.update = action.payload.data;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(updateManualJournal.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getManualJournalById.pending, state => {
        state.loading = true;
      })
      .addCase(getManualJournalById.fulfilled, (state, action) => {
        state.loading = false;
        state.journal = action.payload.data;
      })
      .addCase(getManualJournalById.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.error = action.error.message;
        }
      })
      .addCase(getContactDropdown.pending, state => {
        state.loading = true;
      })
      .addCase(getContactDropdown.fulfilled, (state, action) => {
        state.loading = false;
        state.contactDropdown = action.payload.data.results;
      })
      .addCase(getContactDropdown.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.error = action.error.message;
        }
      })
      .addCase(removeManualJournal.pending, state => {
        state.deleteLoading = true;
      })
      .addCase(removeManualJournal.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.message = action.payload?.message;
        if (state.message) Toast.success(state.message);
      })
      .addCase(removeManualJournal.rejected, (state, action) => {
        state.deleteLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      });
  },
});

export const { resetManualJournal, resetManualJournals } = manualJournalSlice.actions;

export const manualJournalSliceMethods = {
  getManualJournal,
  createManualJournal,
  updateManualJournal,
  getManualJournalById,
  getContactDropdown,
  removeManualJournal,
};
export default manualJournalSlice.reducer;
