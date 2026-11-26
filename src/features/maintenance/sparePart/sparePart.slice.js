import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';
import { sparePartService } from './sparePart.service';

const getSpareParts = createAsyncThunk('sparePart/getSpareParts', sparePartService.getSpareParts);

const getSparePartById = createAsyncThunk('sparePart/getSparePartById', sparePartService.getSparePartById);

const getSparePartDropdown = createAsyncThunk('sparePart/getSparePartDropdown', sparePartService.getSparePartDropdown);

const createSparePart = createAsyncThunk('sparePart/createSparePart', sparePartService.createSparePart);

const updateSparePart = createAsyncThunk('sparePart/updateSparePart', sparePartService.updateSparePart);

const deleteSparePart = createAsyncThunk('sparePart/deleteSparePart', sparePartService.deleteSparePart);

const updateSparePartStatus = createAsyncThunk('sparePart/updateSparePartStatus', sparePartService.updateSparePartStatus);

const isCanceled = action => action.error.name === 'CanceledError' || action.error.code === 'ERR_CANCELED' || action.error.message === 'canceled';

const initialPagination = {
  page: 1,
  limit: DEFAULT_PAGE_SIZE,
  totalPages: 1,
  totalResults: 0,
};

export const sparePartSlice = createSlice({
  name: 'sparePart',
  initialState: {
    spareParts: [],
    sparePart: null,
    sparePartDropdown: [],
    loading: false,
    detailLoading: false,
    dropdownLoading: false,
    submitLoading: false,
    deleteLoading: false,
    error: null,
    pagination: initialPagination,
  },
  reducers: {
    resetSparePart: state => {
      state.spareParts = [];
      state.error = null;
      state.pagination = initialPagination;
    },
    resetSparePartDropdown: state => {
      state.sparePartDropdown = [];
      state.error = null;
    },
    resetSparePartDetail: state => {
      state.sparePart = null;
      state.detailLoading = false;
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getSpareParts.pending, state => {
        state.loading = true;
      })
      .addCase(getSpareParts.fulfilled, (state, action) => {
        state.loading = false;
        state.spareParts = action.payload?.data || [];
        state.pagination = {
          page: action.payload?.extras?.page ?? 1,
          limit: action.payload?.extras?.limit ?? DEFAULT_PAGE_SIZE,
          totalPages: action.payload?.extras?.totalPages ?? 1,
          totalResults: action.payload?.extras?.totalResults ?? 0,
        };
      })
      .addCase(getSpareParts.rejected, (state, action) => {
        if (!isCanceled(action)) {
          state.loading = false;
          state.spareParts = [];
          state.error = action.error.message;
        }
      })
      .addCase(getSparePartById.pending, state => {
        state.detailLoading = true;
      })
      .addCase(getSparePartById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.sparePart = action.payload?.data || null;
      })
      .addCase(getSparePartById.rejected, (state, action) => {
        if (!isCanceled(action)) {
          state.detailLoading = false;
          state.sparePart = null;
          state.error = action.error.message;
          Toast.error(action.error.message || 'Unable to load spare part');
        }
      })
      .addCase(getSparePartDropdown.pending, state => {
        state.dropdownLoading = true;
      })
      .addCase(getSparePartDropdown.fulfilled, (state, action) => {
        state.dropdownLoading = false;
        state.sparePartDropdown = action.payload?.data || [];
      })
      .addCase(getSparePartDropdown.rejected, (state, action) => {
        if (!isCanceled(action)) {
          state.dropdownLoading = false;
          state.sparePartDropdown = [];
          state.error = action.error.message;
        }
      })
      .addCase(createSparePart.pending, state => {
        state.submitLoading = true;
      })
      .addCase(createSparePart.fulfilled, (state, action) => {
        state.submitLoading = false;
        Toast.success(action.payload?.message || 'Spare part created successfully');
      })
      .addCase(createSparePart.rejected, (state, action) => {
        state.submitLoading = false;
        state.error = action.error.message;
        Toast.error(action.error.message || 'Something went wrong');
      })
      .addCase(updateSparePart.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updateSparePart.fulfilled, (state, action) => {
        state.submitLoading = false;
        Toast.success(action.payload?.message || 'Spare part updated successfully');
      })
      .addCase(updateSparePart.rejected, (state, action) => {
        state.submitLoading = false;
        state.error = action.error.message;
        Toast.error(action.error.message || 'Something went wrong');
      })
      .addCase(deleteSparePart.pending, state => {
        state.deleteLoading = true;
      })
      .addCase(deleteSparePart.fulfilled, (state, action) => {
        state.deleteLoading = false;
        Toast.success(action.payload?.message || 'Spare part deleted successfully');
      })
      .addCase(deleteSparePart.rejected, (state, action) => {
        if (!isCanceled(action)) {
          state.deleteLoading = false;
          state.error = action.error.message;
          Toast.error(action.error.message || 'Something went wrong');
        }
      })
      .addCase(updateSparePartStatus.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updateSparePartStatus.fulfilled, (state, action) => {
        state.submitLoading = false;
        Toast.success(action.payload?.message || 'Spare part status updated successfully');
      })
      .addCase(updateSparePartStatus.rejected, (state, action) => {
        if (!isCanceled(action)) {
          state.submitLoading = false;
          state.error = action.error.message;
          Toast.error(action.error.message || 'Something went wrong');
        }
      });
  },
});

export const sparePartSliceMethods = {
  getSpareParts,
  getSparePartById,
  getSparePartDropdown,
  createSparePart,
  updateSparePart,
  deleteSparePart,
  updateSparePartStatus,
};

export const { resetSparePart, resetSparePartDropdown, resetSparePartDetail } = sparePartSlice.actions;
export default sparePartSlice.reducer;
