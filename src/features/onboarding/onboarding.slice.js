import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { onboardingService } from './onboarding.service';
import Toast from '@/components/ui/common/Toast';

const getOnboardingStatus = createAsyncThunk('onboarding/getStatus', onboardingService.getOnboardingStatus);
const getDataSetupStatus = createAsyncThunk('onboarding/getDataSetupStatus', onboardingService.getDataSetupStatus);
const getDataSetupPreview = createAsyncThunk('onboarding/getDataSetupPreview', onboardingService.getDataSetupPreview);
const runDataSetup = createAsyncThunk('onboarding/runDataSetup', onboardingService.runDataSetup);

export const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState: {
    status: null,
    loading: false,
    error: null,
    dataSetup: null,
    dataSetupLoading: false,
    dataSetupRunningKey: null,
    dataSetupPreview: null,
    dataSetupPreviewLoading: false,
  },
  reducers: {
    resetOnboarding: state => {
      state.status = null;
      state.error = null;
    },
    resetDataSetupPreview: state => {
      state.dataSetupPreview = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getOnboardingStatus.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOnboardingStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.status = action.payload.data;
      })
      .addCase(getOnboardingStatus.rejected, (state, action) => {
        state.loading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.status = null;
          state.error = action.error.message || 'Failed to load onboarding';
        }
      })
      .addCase(getDataSetupStatus.pending, state => {
        state.dataSetupLoading = true;
      })
      .addCase(getDataSetupStatus.fulfilled, (state, action) => {
        state.dataSetupLoading = false;
        state.dataSetup = action.payload.data;
      })
      .addCase(getDataSetupStatus.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.dataSetupLoading = false;
          state.dataSetup = null;
        }
      })
      .addCase(getDataSetupPreview.pending, state => {
        state.dataSetupPreviewLoading = true;
      })
      .addCase(getDataSetupPreview.fulfilled, (state, action) => {
        state.dataSetupPreviewLoading = false;
        state.dataSetupPreview = action.payload.data;
      })
      .addCase(getDataSetupPreview.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.dataSetupPreviewLoading = false;
          state.dataSetupPreview = null;
        }
      })
      .addCase(runDataSetup.pending, (state, action) => {
        state.dataSetupRunningKey = action.meta.arg?.key || null;
      })
      .addCase(runDataSetup.fulfilled, (state, action) => {
        state.dataSetupRunningKey = null;
        state.dataSetup = action.payload.data;
        Toast.success(action.payload.message || 'Data setup completed successfully');
      })
      .addCase(runDataSetup.rejected, (state, action) => {
        state.dataSetupRunningKey = null;
        Toast.error(action.error?.message || "We couldn't complete the setup. Please try again or contact support.");
      });
  },
});

export const { resetOnboarding, resetDataSetupPreview } = onboardingSlice.actions;
export default onboardingSlice.reducer;
export const onboardingSliceMethods = {
  getOnboardingStatus,
  getDataSetupStatus,
  getDataSetupPreview,
  runDataSetup,
};
