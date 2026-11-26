import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { itemGroupService } from './itemGroup.service';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getItemGroup = createAsyncThunk('itemGroup/getItemGroup', itemGroupService.getItemGroup);

const getItemGroupById = createAsyncThunk('itemGroup/getItemGroupById', itemGroupService.getItemGroupById);

const createItemGroup = createAsyncThunk('itemGroup/createItemGroup', itemGroupService.createItemGroup);

const deleteItemGroup = createAsyncThunk('itemGroup/deleteItemGroup', itemGroupService.deleteItemGroup);

const updateItemGroup = createAsyncThunk('itemGroup/updateItemGroup', itemGroupService.updateItemGroup);

const getItemGroupDropdown = createAsyncThunk('itemGroup/getItemGroupDropdown', itemGroupService.getItemGroupDropdown);

export const itemGroupSlice = createSlice({
  name: 'itemGroup',
  initialState: {
    itemGroup: null,
    itemGroupDetail: null,
    itemGroupPagination: { page: 1, limit: DEFAULT_PAGE_SIZE, totalPages: 1, totalResults: 0 },
    itemGroupDrop: null,
    itemGroupDropLoading: false,
    loading: false,
    droploading: false,
    deleteLoading: false,
    error: null,
  },
  reducers: {
    resetItemGroupDrop: state => {
      state.itemGroupDrop = null;
    },
    resetItemGroupList: state => {
      state.itemGroup = null;
      state.itemGroupPagination = {
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        totalPages: 1,
        totalResults: 0,
      };
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getItemGroup.pending, state => {
        state.loading = true;
      })
      .addCase(getItemGroup.fulfilled, (state, action) => {
        state.loading = false;
        state.itemGroup = action.payload.data;
        state.itemGroupPagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalResults: action.payload.extras.totalResults,
          subItemGroupCount: action.payload.extras?.subItemGroupCount,
          hasCRMAccess: !!action.payload.extras?.hasCRMAccess,
        };
        state.message = action.payload.message;
      })
      .addCase(getItemGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(getItemGroupById.pending, state => {
        state.loading = true;
      })
      .addCase(getItemGroupById.fulfilled, (state, action) => {
        state.loading = false;
        state.itemGroupDetail = action.payload.data;
      })
      .addCase(getItemGroupById.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.error = action.error.message;
        }
      })
      .addCase(createItemGroup.pending, state => {
        state.loading = true;
      })
      .addCase(createItemGroup.fulfilled, (state, action) => {
        state.loading = false;
        state.itemGroup = [...(state.itemGroup || []), action.payload.data];
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createItemGroup.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updateItemGroup.pending, state => {
        state.loading = true;
      })
      .addCase(updateItemGroup.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(updateItemGroup.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(deleteItemGroup.pending, state => {
        state.deleteLoading = true;
      })
      .addCase(deleteItemGroup.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.itemGroup = (state.itemGroup || []).filter(item => item.id !== action.meta.arg.itemGroupId);
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(deleteItemGroup.rejected, (state, action) => {
        state.deleteLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getItemGroupDropdown.pending, state => {
        state.droploading = true;
        state.itemGroupDropLoading = true;
      })
      .addCase(getItemGroupDropdown.fulfilled, (state, action) => {
        state.droploading = false;
        state.itemGroupDropLoading = false;
        state.itemGroupDrop = action.payload.data;
      })
      .addCase(getItemGroupDropdown.rejected, state => {
        state.droploading = false;
        state.itemGroupDropLoading = false;
        state.itemGroupDrop = null;
      });
  },
});

export const itemGroupSliceMethods = {
  getItemGroup,
  getItemGroupById,
  createItemGroup,
  deleteItemGroup,
  updateItemGroup,
  getItemGroupDropdown,
};

export const { resetItemGroupDrop, resetItemGroupList } = itemGroupSlice.actions;
export default itemGroupSlice.reducer;
