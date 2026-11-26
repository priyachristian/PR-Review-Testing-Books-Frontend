import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { emailPreferencesService } from './emailPreferences.service';

const getModuleEmailConfig = createAsyncThunk('emailPreferences/getModuleEmailConfig', emailPreferencesService.getModuleEmailConfig);

const updateModuleEmailConfig = createAsyncThunk('emailPreferences/updateModuleEmailConfig', emailPreferencesService.updateModuleEmailConfig);

export const emailPreferencesSliceMethods = {
  getModuleEmailConfig,
  updateModuleEmailConfig,
};

const normalizeModuleEmailConfig = payload => {
  const list = payload?.data;
  if (!Array.isArray(list)) return [];
  return list.map(item => ({
    moduleName: item.moduleName,
    isEnabled: Boolean(item.isEnabled),
    isWhatsAppEnabled: Boolean(item.isWhatsAppEnabled),
  }));
};

export const emailPreferencesSlice = createSlice({
  name: 'emailPreferences',
  initialState: {
    moduleEmailConfig: [],
    loading: false,
    saving: false,
    error: null,
  },
  reducers: {
    resetEmailPreferences: state => {
      state.moduleEmailConfig = [];
      state.loading = false;
      state.saving = false;
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getModuleEmailConfig.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getModuleEmailConfig.fulfilled, (state, action) => {
        state.loading = false;
        state.moduleEmailConfig = normalizeModuleEmailConfig(action.payload);
      })
      .addCase(getModuleEmailConfig.rejected, (state, action) => {
        state.loading = false;

        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.moduleEmailConfig = [];
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updateModuleEmailConfig.pending, state => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateModuleEmailConfig.fulfilled, (state, action) => {
        state.saving = false;
        state.moduleEmailConfig = normalizeModuleEmailConfig(action.payload);
        Toast.success(action.payload?.message || 'Email preferences updated successfully');
      })
      .addCase(updateModuleEmailConfig.rejected, (state, action) => {
        state.saving = false;
        const msg = action.error?.message;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = msg;
          Toast.error(msg || 'Failed to update email preferences');
        }
      });
  },
});

export const { resetEmailPreferences } = emailPreferencesSlice.actions;
export default emailPreferencesSlice.reducer;
