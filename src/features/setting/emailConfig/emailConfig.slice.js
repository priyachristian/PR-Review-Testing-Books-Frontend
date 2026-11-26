import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { emailConfigService } from './emailConfig.service';

const getEmailConfig = createAsyncThunk('emailConfig/getEmailConfig', emailConfigService.getEmailConfig);

const updateEmailConfig = createAsyncThunk('emailConfig/updateEmailConfig', emailConfigService.updateEmailConfig);

const testEmailConfig = createAsyncThunk('emailConfig/testEmailConfig', emailConfigService.testEmailConfig);

export const emailConfigSliceMethods = {
  getEmailConfig,
  updateEmailConfig,
  testEmailConfig,
};

export const emailConfigSlice = createSlice({
  name: 'emailConfig',
  initialState: {
    isEmailEnabled: false,
    emailConfiguration: null,
    loading: false,
    saving: false,
    testing: false,
    error: null,
  },
  reducers: {
    resetEmailConfig: state => {
      state.isEmailEnabled = false;
      state.emailConfiguration = null;
      state.loading = false;
      state.saving = false;
      state.testing = false;
      state.error = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getEmailConfig.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getEmailConfig.fulfilled, (state, action) => {
        state.loading = false;
        state.isEmailEnabled = Boolean(action.payload?.data?.isEmailEnabled);
        state.emailConfiguration = action.payload?.data?.emailConfiguration || null;
      })
      .addCase(getEmailConfig.rejected, (state, action) => {
        state.loading = false;

        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.emailConfiguration = null;
          state.isEmailEnabled = false;
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updateEmailConfig.pending, state => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateEmailConfig.fulfilled, (state, action) => {
        state.saving = false;
        state.isEmailEnabled = Boolean(action.payload?.data?.isEmailEnabled);
        state.emailConfiguration = action.payload?.data?.emailConfiguration || null;
        Toast.success(action.payload?.message);
      })
      .addCase(updateEmailConfig.rejected, (state, action) => {
        state.saving = false;
        const msg = action.error?.message;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = msg;
          Toast.error(msg);
        }
      })
      .addCase(testEmailConfig.pending, state => {
        state.testing = true;
        state.error = null;
      })
      .addCase(testEmailConfig.fulfilled, (state, action) => {
        state.testing = false;
        Toast.success(action.payload?.message);
      })
      .addCase(testEmailConfig.rejected, (state, action) => {
        state.testing = false;
        const msg = action.error?.message;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = msg;
          Toast.error(msg);
        }
      });
  },
});

export const { resetEmailConfig } = emailConfigSlice.actions;
export default emailConfigSlice.reducer;
