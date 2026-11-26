import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { warehouseService } from './warehouse.service';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getWarehouse = createAsyncThunk('warehouse/getWarehouse', async (payload, thunkAPI) => {
  const state = thunkAPI.getState();
  return await warehouseService.getWarehouse({
    ...payload,
    isSplit: state?.common?.isSplitSessionActive ? true : false,
  });
});

const toggleWarehouseStatus = createAsyncThunk('warehouse/toggleWarehouseStatus', warehouseService.toggleWarehouseStatus);

const deleteWarehouse = createAsyncThunk('warehouse/deleteWarehouse', warehouseService.deleteWarehouse);

const getBranchDropDown = createAsyncThunk('warehouse/getBranchDropDown', async (payload, thunkAPI) => {
  const state = thunkAPI.getState();
  return await warehouseService.getBranchDropDown({
    ...payload,
    isSplit: payload?.isSplit ? payload?.isSplit : state?.common?.isSplitSessionActive ? true : false,
  });
});

const createWarehouse = createAsyncThunk('warehouse/createWarehouse', warehouseService.createWarehouse);

const updateWarehouse = createAsyncThunk('warehouse/updateWarehouse', warehouseService.updateWarehouse);

const getWarehouseById = createAsyncThunk('warehouse/getWarehouseById', warehouseService.getWarehouseById);

export const warehouseSlice = createSlice({
  name: 'warehouse',
  initialState: {
    warehouse: [],
    singleWarehouse: null,
    branchDrop: [],
    pagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
    },
    create: null,
    update: null,
    delete: null,
    loading: false,
    submitLoading: false,
    deleteLoading: false,
    droploading: false,
    error: null,
  },
  reducers: {
    resetBranch: state => {
      state.branchDrop = [];
    },
    resetWarehouse: state => {
      state.singleWarehouse = null;
    },
    resetWarehouseList: state => {
      state.warehouse = [];
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
      .addCase(getWarehouse.pending, state => {
        state.loading = true;
      })
      .addCase(getWarehouse.fulfilled, (state, action) => {
        state.loading = false;
        state.warehouse = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalResults: action.payload.extras.totalResults,
        };
        state.message = action.payload.message;
      })
      .addCase(getWarehouse.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.error = action.error.message;
          state.warehouse = [];
        }
      })
      .addCase(deleteWarehouse.pending, state => {
        state.deleteLoading = true;
      })
      .addCase(deleteWarehouse.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.delete = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(deleteWarehouse.rejected, (state, action) => {
        state.deleteLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getBranchDropDown.pending, state => {
        state.droploading = true;
      })
      .addCase(getBranchDropDown.fulfilled, (state, action) => {
        state.droploading = false;
        state.branchDrop = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getBranchDropDown.rejected, (state, action) => {
        state.droploading = false;
        state.branchDrop = [];
        state.error = action.error.message;
      })
      .addCase(createWarehouse.pending, state => {
        state.submitLoading = true;
      })
      .addCase(createWarehouse.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.create = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createWarehouse.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updateWarehouse.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updateWarehouse.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.update = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(updateWarehouse.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getWarehouseById.pending, state => {
        state.loading = true;
      })
      .addCase(getWarehouseById.fulfilled, (state, action) => {
        state.loading = false;
        state.singleWarehouse = action.payload.data;
      })
      .addCase(getWarehouseById.rejected, (state, action) => {
        state.loading = false;
        state.singleWarehouse = null;
        state.error = action.error.message;
      })
      .addCase(toggleWarehouseStatus.pending, state => {
        state.submitLoading = true;
      })
      .addCase(toggleWarehouseStatus.fulfilled, (state, action) => {
        state.submitLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(toggleWarehouseStatus.rejected, (state, action) => {
        state.submitLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      });
  },
});

export const warehouseSliceMethods = {
  getWarehouse,
  deleteWarehouse,
  getBranchDropDown,
  createWarehouse,
  updateWarehouse,
  getWarehouseById,
  toggleWarehouseStatus,
};
export const { resetBranch, resetWarehouse, resetWarehouseList } = warehouseSlice.actions;
export default warehouseSlice.reducer;
