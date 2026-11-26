import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { incentiveSchemeService } from './incentiveScheme.service';
import { withErrorHandling } from '@/utils/serviceHelper';

const getIncentiveSchemes = createAsyncThunk('incentiveScheme/getIncentiveSchemes', withErrorHandling(incentiveSchemeService.getIncentiveSchemes, 'getIncentiveSchemes'));
const getIncentiveSchemeById = createAsyncThunk('incentiveScheme/getIncentiveSchemeById', withErrorHandling(incentiveSchemeService.getIncentiveSchemeById, 'getIncentiveSchemeById'));
const createIncentiveScheme = createAsyncThunk('incentiveScheme/createIncentiveScheme', withErrorHandling(incentiveSchemeService.createIncentiveScheme, 'createIncentiveScheme'));
const updateIncentiveScheme = createAsyncThunk('incentiveScheme/updateIncentiveScheme', withErrorHandling(incentiveSchemeService.updateIncentiveScheme, 'updateIncentiveScheme'));
const updateIncentiveSchemeStatus = createAsyncThunk(
  'incentiveScheme/updateIncentiveSchemeStatus',
  withErrorHandling(incentiveSchemeService.updateIncentiveSchemeStatus, 'updateIncentiveSchemeStatus')
);
const deleteIncentiveScheme = createAsyncThunk('incentiveScheme/deleteIncentiveScheme', withErrorHandling(incentiveSchemeService.deleteIncentiveScheme, 'deleteIncentiveScheme'));
const getSchemeConsumption = createAsyncThunk('incentiveScheme/getSchemeConsumption', withErrorHandling(incentiveSchemeService.getSchemeConsumption, 'getSchemeConsumption'));
const getSchemeSummary = createAsyncThunk('incentiveScheme/getSchemeSummary', withErrorHandling(incentiveSchemeService.getSchemeSummary, 'getSchemeSummary'));
const getIncentiveLogs = createAsyncThunk('incentiveScheme/getIncentiveLogs', withErrorHandling(incentiveSchemeService.getIncentiveLogs, 'getIncentiveLogs'));
const updateLogStatus = createAsyncThunk('incentiveScheme/updateLogStatus', withErrorHandling(incentiveSchemeService.updateLogStatus, 'updateLogStatus'));
const deleteIncentiveLog = createAsyncThunk('incentiveScheme/deleteIncentiveLog', withErrorHandling(incentiveSchemeService.deleteIncentiveLog, 'deleteIncentiveLog'));
const bulkSettleLogs = createAsyncThunk('incentiveScheme/bulkSettleLogs', withErrorHandling(incentiveSchemeService.bulkSettleLogs, 'bulkSettleLogs'));
const getUserIncentiveSchemes = createAsyncThunk('incentiveScheme/getUserIncentiveSchemes', withErrorHandling(incentiveSchemeService.getUserIncentiveSchemes, 'getUserIncentiveSchemes'));
const getTeamStats = createAsyncThunk('incentiveScheme/getTeamStats', withErrorHandling(incentiveSchemeService.getTeamStats, 'getTeamStats'));
const getUserStatsDetail = createAsyncThunk('incentiveScheme/getUserStatsDetail', withErrorHandling(incentiveSchemeService.getUserStatsDetail, 'getUserStatsDetail'));

const initialState = {
  schemes: [],
  userSchemes: null,
  teamStats: null,
  userStatsDetail: null,
  singleScheme: null,
  summary: null,
  consumption: null,
  logs: [],
  logsPagination: { page: 1, limit: 20, totalPages: 1, totalResults: 0 },
  pagination: { page: 1, limit: 20, totalPages: 1, totalResults: 0 },
  loading: false,
  submitLoading: false,
  error: null,
};

export const incentiveSchemeSlice = createSlice({
  name: 'incentiveScheme',
  initialState,
  reducers: {
    resetSingleScheme: state => {
      state.singleScheme = null;
      state.consumption = null;
    },
    resetSchemeList: state => {
      state.schemes = [];
      state.pagination = initialState.pagination;
    },
    resetUserSchemes: state => {
      state.userSchemes = null;
    },
    resetUserStatsDetail: state => {
      state.userStatsDetail = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getIncentiveSchemes.pending, state => {
        state.loading = true;
      })
      .addCase(getIncentiveSchemes.fulfilled, (state, action) => {
        state.loading = false;
        state.schemes = action.payload.data;
        state.pagination = {
          page: action.payload.extras?.page ?? 1,
          limit: action.payload.extras?.limit ?? 20,
          totalPages: action.payload.extras?.totalPages ?? 1,
          totalResults: action.payload.extras?.totalResults ?? 0,
        };
      })
      .addCase(getIncentiveSchemes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      .addCase(getIncentiveSchemeById.pending, state => {
        state.loading = true;
      })
      .addCase(getIncentiveSchemeById.fulfilled, (state, action) => {
        state.loading = false;
        state.singleScheme = action.payload.data;
      })
      .addCase(getIncentiveSchemeById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      .addCase(getSchemeSummary.fulfilled, (state, action) => {
        state.summary = action.payload.data;
      })

      .addCase(getSchemeConsumption.pending, state => {
        state.loading = true;
      })
      .addCase(getSchemeConsumption.fulfilled, (state, action) => {
        state.loading = false;
        state.consumption = action.payload.data;
      })
      .addCase(getSchemeConsumption.rejected, state => {
        state.loading = false;
      })

      .addCase(getIncentiveLogs.pending, state => {
        state.loading = true;
      })
      .addCase(getIncentiveLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.logs = action.payload.data;
        state.logsPagination = {
          page: action.payload.extras?.page ?? 1,
          limit: action.payload.extras?.limit ?? 20,
          totalPages: action.payload.extras?.totalPages ?? 1,
          totalResults: action.payload.extras?.totalResults ?? 0,
        };
      })
      .addCase(getIncentiveLogs.rejected, state => {
        state.loading = false;
      })

      .addCase(createIncentiveScheme.pending, state => {
        state.submitLoading = true;
      })
      .addCase(createIncentiveScheme.fulfilled, state => {
        state.submitLoading = false;
        Toast.success('Incentive scheme created successfully');
      })
      .addCase(createIncentiveScheme.rejected, (state, action) => {
        state.submitLoading = false;
        Toast.error(action.error.message);
      })

      .addCase(updateIncentiveScheme.pending, state => {
        state.submitLoading = true;
      })
      .addCase(updateIncentiveScheme.fulfilled, state => {
        state.submitLoading = false;
        Toast.success('Incentive scheme updated successfully');
      })
      .addCase(updateIncentiveScheme.rejected, (state, action) => {
        state.submitLoading = false;
        Toast.error(action.error.message);
      })

      .addCase(updateIncentiveSchemeStatus.fulfilled, (state, action) => {
        const status = action.payload.data?.status;
        const statusMessages = {
          DRAFT: 'Scheme saved as draft successfully',
          ACTIVE: 'Scheme activated successfully',
          PAUSED: 'Scheme paused successfully',
          ENDED: 'Scheme ended successfully',
        };
        Toast.success(statusMessages[status] || `Scheme ${status?.toLowerCase()} successfully`);
      })
      .addCase(updateIncentiveSchemeStatus.rejected, (state, action) => {
        Toast.error(action.error.message);
      })

      .addCase(deleteIncentiveScheme.fulfilled, () => {
        Toast.success('Scheme deleted successfully');
      })
      .addCase(deleteIncentiveScheme.rejected, (state, action) => {
        Toast.error(action.error.message);
      })

      .addCase(updateLogStatus.fulfilled, () => {
        Toast.success('Log updated successfully');
      })
      .addCase(deleteIncentiveLog.fulfilled, () => {
        Toast.success('Log deleted successfully');
      })
      .addCase(deleteIncentiveLog.rejected, (state, action) => {
        Toast.error(action.error.message);
      })
      .addCase(bulkSettleLogs.fulfilled, () => {
        Toast.success('Incentives settled successfully');
      })
      .addCase(bulkSettleLogs.rejected, (state, action) => {
        Toast.error(action.error.message);
      })

      .addCase(getUserIncentiveSchemes.pending, state => {
        state.loading = true;
      })
      .addCase(getUserIncentiveSchemes.fulfilled, (state, action) => {
        state.loading = false;
        state.userSchemes = action.payload.data;
      })
      .addCase(getUserIncentiveSchemes.rejected, state => {
        state.loading = false;
      })

      .addCase(getTeamStats.pending, state => {
        state.loading = true;
      })
      .addCase(getTeamStats.fulfilled, (state, action) => {
        state.loading = false;
        state.teamStats = action.payload.data;
      })
      .addCase(getTeamStats.rejected, state => {
        state.loading = false;
      })

      .addCase(getUserStatsDetail.pending, state => {
        state.loading = true;
      })
      .addCase(getUserStatsDetail.fulfilled, (state, action) => {
        state.loading = false;
        state.userStatsDetail = action.payload.data;
      })
      .addCase(getUserStatsDetail.rejected, state => {
        state.loading = false;
      });
  },
});

export const { resetSingleScheme, resetSchemeList, resetUserSchemes, resetUserStatsDetail } = incentiveSchemeSlice.actions;
export default incentiveSchemeSlice.reducer;
export const incentiveSchemeSliceMethods = {
  getIncentiveSchemes,
  getIncentiveSchemeById,
  createIncentiveScheme,
  updateIncentiveScheme,
  updateIncentiveSchemeStatus,
  deleteIncentiveScheme,
  getSchemeConsumption,
  getSchemeSummary,
  getIncentiveLogs,
  updateLogStatus,
  deleteIncentiveLog,
  bulkSettleLogs,
  getUserIncentiveSchemes,
  getTeamStats,
  getUserStatsDetail,
};
