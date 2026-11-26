import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { isCanceledRequestError } from '@/utils/serviceHelper';
import { productionWarehouseConfigService } from './productionWarehouseConfig.service';

const getProductionWarehouseConfigs = createAsyncThunk('productionWarehouseConfig/getAll', productionWarehouseConfigService.getProductionWarehouseConfigs);
const getProductionWarehouseConfigDropdown = createAsyncThunk('productionWarehouseConfig/getDropdown', productionWarehouseConfigService.getProductionWarehouseConfigDropdown);
const getProductionWarehouseConfigById = createAsyncThunk('productionWarehouseConfig/getById', productionWarehouseConfigService.getProductionWarehouseConfigById);

const createProductionWarehouseConfig = createAsyncThunk('productionWarehouseConfig/create', async (payload, { rejectWithValue }) => {
  try {
    return await productionWarehouseConfigService.createProductionWarehouseConfig(payload);
  } catch (error) {
    return rejectWithValue(error?.response?.data || error || 'Something went wrong');
  }
});

const updateProductionWarehouseConfig = createAsyncThunk('productionWarehouseConfig/update', async (payload, { rejectWithValue }) => {
  try {
    return await productionWarehouseConfigService.updateProductionWarehouseConfig(payload);
  } catch (error) {
    return rejectWithValue(error?.response?.data || error || 'Something went wrong');
  }
});

const updateProductionWarehouseConfigStatus = createAsyncThunk('productionWarehouseConfig/updateStatus', productionWarehouseConfigService.updateProductionWarehouseConfigStatus);
const deleteProductionWarehouseConfig = createAsyncThunk('productionWarehouseConfig/delete', productionWarehouseConfigService.deleteProductionWarehouseConfig);

export const productionWarehouseConfigSlice = createSlice({
  name: 'productionWarehouseConfig',
  initialState: {
    configs: [],
    dropdownConfigs: [],
    dropdownLoading: false,
    selectedConfig: null,
    loading: false,
    detailLoading: false,
    submitLoading: false,
    statusLoading: false,
    deleteLoading: false,
    error: null,
  },
  reducers: {
    resetProductionWarehouseConfigs: state => {
      state.configs = [];
      state.selectedConfig = null;
      state.error = null;
    },
    clearSelectedProductionWarehouseConfig: state => {
      state.selectedConfig = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getProductionWarehouseConfigs.pending, state => {
        state.loading = true;
      })
      .addCase(getProductionWarehouseConfigs.fulfilled, (state, action) => {
        state.loading = false;
        state.configs = action.payload?.data || [];
      })
      .addCase(getProductionWarehouseConfigs.rejected, (state, action) => {
        if (isCanceledRequestError(action.error)) return;
        state.loading = false;
        state.configs = [];
        state.error = action.error.message;
        Toast.error(action.error.message || 'Unable to load production warehouse configurations');
      })
      .addCase(getProductionWarehouseConfigDropdown.pending, state => {
        state.dropdownLoading = true;
      })
      .addCase(getProductionWarehouseConfigDropdown.fulfilled, (state, action) => {
        state.dropdownLoading = false;
        state.dropdownConfigs = action.payload?.data || [];
      })
      .addCase(getProductionWarehouseConfigDropdown.rejected, (state, action) => {
        if (isCanceledRequestError(action.error)) return;
        state.dropdownLoading = false;
        state.dropdownConfigs = [];
      })
      .addCase(getProductionWarehouseConfigById.pending, state => {
        state.detailLoading = true;
      })
      .addCase(getProductionWarehouseConfigById.fulfilled, (state, action) => {
        state.detailLoading = false;
        state.selectedConfig = action.payload?.data || null;
      })
      .addCase(getProductionWarehouseConfigById.rejected, (state, action) => {
        if (isCanceledRequestError(action.error)) return;
        state.detailLoading = false;
        state.selectedConfig = null;
        state.error = action.error.message;
      })
      .addCase(createProductionWarehouseConfig.pending, state => {
        state.submitLoading = true;
      })
      .addCase(createProductionWarehouseConfig.fulfilled, (state, action) => {
        state.submitLoading = false;
        if (action.payload?.data) state.configs.unshift(action.payload.data);
        Toast.success(action.payload?.message || 'Production warehouse configuration created successfully');
      })
      .addCase(createProductionWarehouseConfig.rejected, (state, action) => {
        state.submitLoading = false;
        state.error = action.payload?.message || action.error.message;
        Toast.error(state.error || 'Unable to create production warehouse configuration');
      })
      .addCase(updateProductionWarehouseConfig.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updateProductionWarehouseConfig.fulfilled, (state, action) => {
        state.submitLoading = false;
        const updated = action.payload?.data;
        if (updated?._id) state.configs = state.configs.map(config => (config._id === updated._id ? updated : config));
        state.selectedConfig = updated || state.selectedConfig;
        Toast.success(action.payload?.message || 'Production warehouse configuration updated successfully');
      })
      .addCase(updateProductionWarehouseConfig.rejected, (state, action) => {
        state.submitLoading = false;
        state.error = action.payload?.message || action.error.message;
        Toast.error(state.error || 'Unable to update production warehouse configuration');
      })
      .addCase(updateProductionWarehouseConfigStatus.pending, state => {
        state.statusLoading = true;
      })
      .addCase(updateProductionWarehouseConfigStatus.fulfilled, (state, action) => {
        state.statusLoading = false;
        const updated = action.payload?.data;
        if (updated?._id) state.configs = state.configs.map(config => (config._id === updated._id ? updated : config));
        Toast.success(action.payload?.message || 'Configuration status updated successfully');
      })
      .addCase(updateProductionWarehouseConfigStatus.rejected, (state, action) => {
        state.statusLoading = false;
        state.error = action.error.message;
        Toast.error(action.payload?.message || action.error.message || 'Unable to update configuration status');
      })
      .addCase(deleteProductionWarehouseConfig.pending, state => {
        state.deleteLoading = true;
      })
      .addCase(deleteProductionWarehouseConfig.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.configs = state.configs.filter(config => config._id !== action.meta.arg.id);
        Toast.success(action.payload?.message || 'Production warehouse configuration deleted successfully');
      })
      .addCase(deleteProductionWarehouseConfig.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.error.message;
        Toast.error(action.payload?.message || action.error.message || 'Unable to delete configuration');
      });
  },
});

export const productionWarehouseConfigSliceMethods = {
  getProductionWarehouseConfigs,
  getProductionWarehouseConfigDropdown,
  getProductionWarehouseConfigById,
  createProductionWarehouseConfig,
  updateProductionWarehouseConfig,
  updateProductionWarehouseConfigStatus,
  deleteProductionWarehouseConfig,
};

export const { resetProductionWarehouseConfigs, clearSelectedProductionWarehouseConfig } = productionWarehouseConfigSlice.actions;
export default productionWarehouseConfigSlice.reducer;
