import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { subItemGroupService } from './subItemGroup.service';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getSubItemGroup = createAsyncThunk('subItemGroup/getSubItemGroup', subItemGroupService.getSubItemGroup);

const getSubItemGroupById = createAsyncThunk('subItemGroup/getSubItemGroupById', subItemGroupService.getSubItemGroupById);

const createSubItemGroup = createAsyncThunk('subItemGroup/createSubItemGroup', subItemGroupService.createSubItemGroup);

const deleteSubItemGroup = createAsyncThunk('subItemGroup/deleteSubItemGroup', subItemGroupService.deleteSubItemGroup);

const updateSubItemGroup = createAsyncThunk('subItemGroup/updateSubItemGroup', subItemGroupService.updateSubItemGroup);

const getSubItemGroupDropdown = createAsyncThunk('subItemGroup/getSubItemGroupDropdown', subItemGroupService.getSubItemGroupDropdown);

export const subItemGroupSlice = createSlice({
  name: 'subItemGroup',
  initialState: {
    subItemGroup: null,
    subItemGroupDetail: null,
    subItemGroupPagination: { page: 1, limit: DEFAULT_PAGE_SIZE, totalPages: 1, totalResults: 0 },
    subItemGroupDrop: null,
    subItemGroupDropLoading: false,
    loading: false,
    droploading: false,
    deleteLoading: false,
    error: null,
  },
  reducers: {
    resetSubItemGroupDrop: state => {
      state.subItemGroupDrop = null;
    },
    resetSubItemGroupList: state => {
      state.subItemGroup = null;
      state.subItemGroupPagination = {
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        totalPages: 1,
        totalResults: 0,
      };
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getSubItemGroup.pending, state => {
        state.loading = true;
      })
      .addCase(getSubItemGroup.fulfilled, (state, action) => {
        state.loading = false;
        state.subItemGroup = action.payload.data;
        state.subItemGroupPagination = {
          page: action.payload.extras?.page,
          limit: action.payload.extras?.limit,
          totalPages: action.payload.extras?.totalPages,
          totalResults: action.payload.extras?.totalResults,
          itemGroupCount: action.payload.extras?.itemGroupCount,
        };
        state.message = action.payload.message;
      })
      .addCase(getSubItemGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(getSubItemGroupById.pending, state => {
        state.loading = true;
      })
      .addCase(getSubItemGroupById.fulfilled, (state, action) => {
        state.loading = false;
        state.subItemGroupDetail = action.payload.data;
      })
      .addCase(getSubItemGroupById.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.error = action.error.message;
        }
      })
      .addCase(createSubItemGroup.pending, state => {
        state.loading = true;
      })
      .addCase(createSubItemGroup.fulfilled, (state, action) => {
        state.loading = false;
        state.subItemGroup = [...(state.subItemGroup || []), action.payload.data];
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createSubItemGroup.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updateSubItemGroup.pending, state => {
        state.loading = true;
      })
      .addCase(updateSubItemGroup.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(updateSubItemGroup.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(deleteSubItemGroup.pending, state => {
        state.deleteLoading = true;
      })
      .addCase(deleteSubItemGroup.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.subItemGroup = (state.subItemGroup || []).filter(item => item.id !== action.meta.arg.subItemGroupId);
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(deleteSubItemGroup.rejected, (state, action) => {
        state.deleteLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getSubItemGroupDropdown.pending, state => {
        state.droploading = true;
        state.subItemGroupDropLoading = true;
      })
      .addCase(getSubItemGroupDropdown.fulfilled, (state, action) => {
        state.droploading = false;
        state.subItemGroupDropLoading = false;
        state.subItemGroupDrop = action.payload.data;
      })
      .addCase(getSubItemGroupDropdown.rejected, state => {
        state.droploading = false;
        state.subItemGroupDropLoading = false;
        state.subItemGroupDrop = null;
      });
  },
});

export const subItemGroupSliceMethods = {
  getSubItemGroup,
  getSubItemGroupById,
  createSubItemGroup,
  deleteSubItemGroup,
  updateSubItemGroup,
  getSubItemGroupDropdown,
};

export const { resetSubItemGroupDrop, resetSubItemGroupList } = subItemGroupSlice.actions;
export default subItemGroupSlice.reducer;
