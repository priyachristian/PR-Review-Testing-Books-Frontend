import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { moduleConfigService } from './moduleConfigService';

const getModuleConfig = createAsyncThunk('moduleConfig/getModuleConfig', moduleConfigService.getModuleConfig);

const updateModuleConfig = createAsyncThunk('moduleConfig/updateModuleConfig', moduleConfigService.updateModuleConfig);

export const moduleConfigSlice = createSlice({
  name: 'moduleConfig',
  initialState: {
    moduleConfig: null,
    moduleName: null,
    loading: false,
    error: null,
  },
  reducers: {
    resetModuleConfig: state => {
      state.moduleConfig = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getModuleConfig.pending, (state, action) => {
        state.loading = true;
        state.moduleConfig = null;
        state.moduleName = action.meta.arg?.moduleName ?? null;
      })
      .addCase(getModuleConfig.fulfilled, (state, action) => {
        state.loading = false;
        state.moduleConfig = action.payload.data;
        state.moduleName = action.meta.arg?.moduleName ?? null;
      })
      .addCase(getModuleConfig.rejected, (state, action) => {
        state.loading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          // 404 (module has no saved settings yet) resolves to an empty, usable config so the
          // preferences drawer shows an editable form instead of a perpetual spinner.
          state.moduleConfig = {};
          state.error = action.error.message;
        }
      })
      .addCase(updateModuleConfig.pending, state => {
        state.loading = true;
      })
      .addCase(updateModuleConfig.fulfilled, (state, action) => {
        state.loading = false;
        state.moduleConfig = action.payload.data;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(updateModuleConfig.rejected, (state, action) => {
        state.loading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      });
  },
});

export const moduleConfigSliceMethods = {
  getModuleConfig,
  updateModuleConfig,
};
export const { resetModuleConfig } = moduleConfigSlice.actions;
export default moduleConfigSlice.reducer;
