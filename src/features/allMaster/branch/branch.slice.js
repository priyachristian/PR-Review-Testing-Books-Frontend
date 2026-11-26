import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { branchService } from './branch.service';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getBranch = createAsyncThunk('branch/getBranch', async (payload, thunkAPI) => {
  const state = thunkAPI.getState();
  const isSplit = state?.common?.isSplitSessionActive ? true : false;
  return await branchService.getBranch({ ...payload, isSplit });
});

const getDivDropDown = createAsyncThunk('branch/getDivDropDown', branchService.getDivDropDown);

const deleteBranch = createAsyncThunk('branch/deleteBranch', branchService.deleteBranch);

const createBranch = createAsyncThunk('branch/createBranch', branchService.createBranch);

const updateBranch = createAsyncThunk('branch/updateBranch', branchService.updateBranch);

const getBranchById = createAsyncThunk('branch/getBranchById', branchService.getBranchById);

const getAllBranchDropDown = createAsyncThunk('branch/getAllBranchDropDown', branchService.getAllBranchDropDown);

const toggleBranchStatus = createAsyncThunk('branch/toggleBranchStatus', branchService.toggleBranchStatus);

export const branchSlice = createSlice({
  name: 'branch',
  initialState: {
    branch: [],
    singleBranch: null,
    divDrop: [],
    allBranchDrop: [],
    pagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
    },
    delete: null,
    create: null,
    update: null,
    loading: false,
    submitLoading: false,
    deleteLoading: false,
    droploading: false,
    error: null,
  },
  reducers: {
    resetBranch: state => {
      state.singleBranch = null;
    },
    resetBranchList: state => {
      state.branch = [];
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
      .addCase(getBranch.pending, state => {
        state.loading = true;
      })
      .addCase(getBranch.fulfilled, (state, action) => {
        state.loading = false;
        state.branch = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalResults: action.payload.extras.totalResults,
        };
        state.message = action.payload.message;
      })
      .addCase(getBranch.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.branch = [];
          state.error = action.error.message;
        }
      })
      .addCase(getDivDropDown.pending, state => {
        state.droploading = true;
      })
      .addCase(getDivDropDown.fulfilled, (state, action) => {
        state.droploading = false;
        state.divDrop = action.payload.data.result;
        state.message = action.payload.message;
      })
      .addCase(getDivDropDown.rejected, (state, action) => {
        state.droploading = false;
        state.divDrop = [];
        state.error = action.error.message;
      })
      .addCase(deleteBranch.pending, state => {
        state.deleteLoading = true;
      })
      .addCase(deleteBranch.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.delete = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(deleteBranch.rejected, (state, action) => {
        state.deleteLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(createBranch.pending, state => {
        state.submitLoading = true;
      })
      .addCase(createBranch.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.create = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createBranch.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updateBranch.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updateBranch.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.update = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(updateBranch.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getBranchById.pending, state => {
        state.loading = true;
      })
      .addCase(getBranchById.fulfilled, (state, action) => {
        state.loading = false;
        state.singleBranch = action.payload.data;
      })
      .addCase(getBranchById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(getAllBranchDropDown.pending, state => {
        state.loading = true;
      })
      .addCase(getAllBranchDropDown.fulfilled, (state, action) => {
        state.loading = false;
        state.allBranchDrop = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getAllBranchDropDown.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(toggleBranchStatus.pending, state => {
        state.submitLoading = true;
      })
      .addCase(toggleBranchStatus.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(toggleBranchStatus.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      });
  },
});
export const { resetBranch, resetBranchList } = branchSlice.actions;
export default branchSlice.reducer;
export const branchSliceMethods = {
  getBranch,
  getDivDropDown,
  deleteBranch,
  createBranch,
  updateBranch,
  getBranchById,
  getAllBranchDropDown,
  toggleBranchStatus,
};
