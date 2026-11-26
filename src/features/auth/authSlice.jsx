import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { authService } from './authService';
import { clearRegisteredToken } from '@/utils/device';
import { isPdfPreviewRoute } from '@/utils/pdfPreviewRoute';

const checktoken = createAsyncThunk('auth/checktoken', async (arg, { rejectWithValue }) => {
  if (isPdfPreviewRoute()) {
    return rejectWithValue({ skipped: true });
  }
  return authService.checktoken();
});

const checktokenResetPassword = createAsyncThunk('auth/checktokenResetPassword', authService.checktokenResetPassword);

const logoutApi = createAsyncThunk('auth/logoutApi', authService.logout);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    email: null,
    accessToken: null,
    refreshToken: null,
    companyId: null,
    inviteData: null,
    tokenCheck: null,
    checktokenReset: null,
    isAuthenticated: false,
    tokenLoading: true,
    verify: null,
    resend: null,
    addorg: null,
    signin: null,
    loading: false,
    verifyloading: false,
    error: null,
    tokenError: null,
    loadingToastId: null,
    isViewOnly: false,
  },
  reducers: {
    logout: state => {
      // Reset all state properties to initial values
      state.email = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.companyId = null;
      state.inviteData = null;
      state.tokenCheck = null;
      state.checktokenReset = null;
      state.isAuthenticated = false;
      state.tokenLoading = false;
      state.verify = null;
      state.resend = null;
      state.addorg = null;
      state.signin = null;
      state.loading = false;
      state.verifyloading = false;
      state.error = null;
      state.tokenError = null;
      state.loadingToastId = null;
      state.message = null;
      localStorage.removeItem('splitSession');
      clearRegisteredToken();
    },
    updateCompany: (state, action) => {
      if (state.signin) {
        state.signin.company = action.payload;
      }
    },
    updateTokens: (state, action) => {
      const { accessToken, refreshToken } = action.payload;
      state.accessToken = accessToken;
      state.refreshToken = refreshToken;
      // Redux Persist will automatically persist these changes
    },
    setIsViewOnly: (state, action) => {
      state.isViewOnly = action.payload;
    },
    updateMaintenanceMode: (state, action) => {
      const { isMaintenanceModeActive, maintenanceModeMessage, activateAt } = action.payload;
      if (state.signin) {
        state.signin.isMaintenanceModeActive = isMaintenanceModeActive;
        state.signin.maintenanceModeMessage = maintenanceModeMessage;
        state.signin.activateAt = activateAt;
      }

      if (state.tokenCheck?.data) {
        state.tokenCheck.data.isMaintenanceModeActive = isMaintenanceModeActive;
        state.tokenCheck.data.maintenanceModeMessage = maintenanceModeMessage;
        state.tokenCheck.data.activateAt = activateAt;
      }
    },
  },
  extraReducers: builder => {
    builder
      .addCase(checktoken.pending, (state, action) => {
        if (!action.meta.arg?.silent) {
          state.tokenLoading = true;
        }
      })
      .addCase(checktoken.fulfilled, (state, action) => {
        state.tokenLoading = false;
        state.signin = action.payload.data;
        state.email = action.payload.data.user.email;
        state.companyId = action.payload.data.company.id;
        state.tokenCheck = action.payload;
        state.isViewOnly =
          action.payload.data?.isViewOnly ||
          (action?.payload?.data?.subscription?.canLoggedIn && action?.payload?.data?.subscription?.status !== 'active' && action?.payload?.data?.subscription?.status !== 'due');
        state.isAuthenticated = true;
      })
      .addCase(checktoken.rejected, (state, action) => {
        state.tokenLoading = false;
        if (action.payload?.skipped) return;
        state.error = action.error.message;
        // state.isAuthenticated = false;
      })
      .addCase(checktokenResetPassword.pending, state => {
        state.tokenLoading = true;
        state.tokenError = null;
      })
      .addCase(checktokenResetPassword.fulfilled, (state, action) => {
        state.tokenLoading = false;
        state.checktokenReset = action.payload;
        state.message = action.payload.message;
        state.tokenError = null;
      })
      .addCase(checktokenResetPassword.rejected, (state, action) => {
        state.tokenLoading = false;
        state.tokenError = action.error.message;
      })
      .addCase(logoutApi.pending, state => {
        state.loading = true;
      })
      .addCase(logoutApi.fulfilled, state => {
        state.loading = false;
        // state.isAuthenticated = false;
      })
      .addCase(logoutApi.rejected, (state, action) => {
        state.loading = false;
        // state.isAuthenticated = false;
        state.tokenError = action.error.message;
        Toast.error(state.tokenError);
      });
  },
});
export const authSliceMethods = {
  checktoken,
  checktokenResetPassword,
  logoutApi,
};
export const { logout, updateCompany, updateTokens, setIsViewOnly, updateMaintenanceMode } = authSlice.actions;
export default authSlice.reducer;
