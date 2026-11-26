import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { isCanceledRequestError } from '@/utils/serviceHelper';
import { directTaxService } from './directTax.service';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getTaxes = createAsyncThunk('directTax/getTaxes', directTaxService.getTaxes);
const getTaxSections = createAsyncThunk('directTax/getTaxSections', directTaxService.getTaxSections);
const getTaxesDropdown = createAsyncThunk('directTax/getTaxesDropdown', directTaxService.getTaxesDropdown);

const createTax = createAsyncThunk('directTax/createTax', async (data, { rejectWithValue }) => {
  try {
    return await directTaxService.createTax(data);
  } catch (error) {
    return rejectWithValue(error?.response?.data || error || 'Something went wrong');
  }
});

const updateTax = createAsyncThunk('directTax/updateTax', async ({ id, data }, { rejectWithValue }) => {
  try {
    return await directTaxService.updateTax(id, data);
  } catch (error) {
    return rejectWithValue(error?.response?.data || error || 'Something went wrong');
  }
});

const updateTaxStatus = createAsyncThunk('directTax/updateTaxStatus', directTaxService.updateTaxStatus);
const removeTax = createAsyncThunk('directTax/removeTax', directTaxService.removeTax);

export const directTaxSlice = createSlice({
  name: 'directTax',
  initialState: {
    taxes: [],
    pagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
    },
    sections: [],
    taxesDrop: [],
    loading: false,
    droploading: false,
    submitLoading: false,
    error: null,
  },
  reducers: {
    resetTaxSections: state => {
      state.sections = [];
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getTaxes.pending, state => {
        state.loading = true;
      })
      .addCase(getTaxes.fulfilled, (state, action) => {
        state.loading = false;
        state.taxes = action.payload.data;
        state.pagination = {
          page: action.payload.extras?.page,
          limit: action.payload.extras?.limit,
          totalPages: action.payload.extras?.totalPages,
          totalResults: action.payload.extras?.totalResults,
        };
      })
      .addCase(getTaxes.rejected, (state, action) => {
        if (isCanceledRequestError(action.error)) return;
        state.loading = false;
        state.taxes = [];
        state.error = action.error.message;
      })
      .addCase(getTaxSections.pending, state => {
        state.droploading = true;
      })
      .addCase(getTaxSections.fulfilled, (state, action) => {
        state.droploading = false;
        state.sections = action.payload.data;
      })
      .addCase(getTaxSections.rejected, (state, action) => {
        if (isCanceledRequestError(action.error)) return;
        state.droploading = false;
        state.sections = [];
        state.error = action.error.message;
      })
      .addCase(getTaxesDropdown.pending, state => {
        state.droploading = true;
      })
      .addCase(getTaxesDropdown.fulfilled, (state, action) => {
        state.droploading = false;
        state.taxesDrop = action.payload.data;
      })
      .addCase(getTaxesDropdown.rejected, (state, action) => {
        if (isCanceledRequestError(action.error)) return;
        state.droploading = false;
        state.taxesDrop = [];
        state.error = action.error.message;
      })
      .addCase(createTax.pending, state => {
        state.submitLoading = true;
      })
      .addCase(createTax.fulfilled, (state, action) => {
        state.submitLoading = false;
        Toast.success(action.payload.message);
      })
      .addCase(createTax.rejected, (state, action) => {
        state.submitLoading = false;
        state.error = action.payload;
        Toast.error(action?.payload?.message || 'Something went wrong');
      })
      .addCase(updateTax.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updateTax.fulfilled, (state, action) => {
        state.submitLoading = false;
        Toast.success(action.payload.message);
      })
      .addCase(updateTax.rejected, (state, action) => {
        state.submitLoading = false;
        state.error = action.payload;
        Toast.error(action?.payload?.message || 'Something went wrong');
      })
      .addCase(updateTaxStatus.fulfilled, (state, action) => {
        Toast.success(action.payload.message);
      })
      .addCase(updateTaxStatus.rejected, (state, action) => {
        Toast.error(action?.error?.message || 'Something went wrong');
      })
      .addCase(removeTax.fulfilled, (state, action) => {
        Toast.success(action.payload.message);
      })
      .addCase(removeTax.rejected, (state, action) => {
        Toast.error(action?.error?.message || 'Something went wrong');
      });
  },
});

export const directTaxSliceMethods = {
  getTaxes,
  getTaxSections,
  getTaxesDropdown,
  createTax,
  updateTax,
  updateTaxStatus,
  removeTax,
};
export const { resetTaxSections } = directTaxSlice.actions;
export default directTaxSlice.reducer;
