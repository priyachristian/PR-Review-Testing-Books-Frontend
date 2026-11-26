import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { salesOrderTagService } from './salesOrderTag.service';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getSalesOrderTag = createAsyncThunk('salesOrderTag/getSalesOrderTag', salesOrderTagService.getSalesOrderTag);
const createSalesOrderTag = createAsyncThunk('salesOrderTag/createSalesOrderTag', salesOrderTagService.createSalesOrderTag);
const updateSalesOrderTag = createAsyncThunk('salesOrderTag/updateSalesOrderTag', salesOrderTagService.updateSalesOrderTag);
const deleteSalesOrderTag = createAsyncThunk('salesOrderTag/deleteSalesOrderTag', salesOrderTagService.deleteSalesOrderTag);
const getSalesOrderTagsDropdown = createAsyncThunk('salesOrderTag/getSalesOrderTagsDropdown', salesOrderTagService.getSalesOrderTagsDropdown);

export const salesOrderTagSliceMethods = {
  getSalesOrderTag,
  createSalesOrderTag,
  updateSalesOrderTag,
  deleteSalesOrderTag,
  getSalesOrderTagsDropdown,
};

export const salesOrderTagSlice = createSlice({
  name: 'salesOrderTag',
  initialState: {
    salesOrderTags: [],
    loading: false,
    saveLoading: false,
    salesOrderTagsDropdown: [],
    dropdownLoading: false,
    error: null,
    pagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
    },
  },
  reducers: {
    resetSalesOrderTagList: state => {
      state.salesOrderTags = [];
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
      .addCase(getSalesOrderTag.pending, state => {
        state.loading = true;
      })
      .addCase(getSalesOrderTag.fulfilled, (state, action) => {
        state.loading = false;
        state.salesOrderTags = action.payload.data || [];
        state.pagination = {
          page: action.payload.extras?.page || 1,
          limit: action.payload.extras?.limit || DEFAULT_PAGE_SIZE,
          totalPages: action.payload.extras?.totalPages || 1,
          totalResults: action.payload.extras?.totalResults || 0,
          hasCRMAccess: !!action.payload.extras?.hasCRMAccess,
        };
      })
      .addCase(getSalesOrderTag.rejected, (state, action) => {
        state.loading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          state.salesOrderTags = [];
          Toast.error(state.error);
        }
      })
      .addCase(createSalesOrderTag.pending, state => {
        state.saveLoading = true;
      })
      .addCase(createSalesOrderTag.fulfilled, (state, action) => {
        state.saveLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createSalesOrderTag.rejected, (state, action) => {
        state.saveLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updateSalesOrderTag.pending, state => {
        state.saveLoading = true;
      })
      .addCase(updateSalesOrderTag.fulfilled, (state, action) => {
        state.saveLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(updateSalesOrderTag.rejected, (state, action) => {
        state.saveLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(deleteSalesOrderTag.fulfilled, (state, action) => {
        state.salesOrderTags = state.salesOrderTags.filter(item => item.id !== action.meta.arg?.salesOrderTagId);
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(deleteSalesOrderTag.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getSalesOrderTagsDropdown.pending, state => {
        state.dropdownLoading = true;
      })
      .addCase(getSalesOrderTagsDropdown.fulfilled, (state, action) => {
        state.dropdownLoading = false;
        state.salesOrderTagsDropdown = action.payload?.data?.result || action.payload?.data || [];
      })
      .addCase(getSalesOrderTagsDropdown.rejected, (state, action) => {
        state.dropdownLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      });
  },
});

export const { resetSalesOrderTagList } = salesOrderTagSlice.actions;
export default salesOrderTagSlice.reducer;
