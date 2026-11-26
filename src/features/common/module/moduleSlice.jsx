import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig, { callApiWithCustomBaseURL } from 'app/axiosConfig';
import { buildPermissionPlanMap, flattenPermissionModuleTree, buildFeatureInPlanMap } from '@/utils/routePermissions';

const getModuleList = createAsyncThunk('modules/getModuleList', async () => {
  try {
    const response = await axiosConfig.get(API_ROUTES.MODULE.PERMISSION_TREE);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || 'Something went wrong';
  }
});

const getSettingsFeaturePlan = createAsyncThunk('modules/getSettingsFeaturePlan', async () => {
  try {
    const response = await axiosConfig.get(API_ROUTES.MODULE.SETTINGS_FEATURE_PLAN);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || 'Something went wrong';
  }
});

const getAccessibleModules = createAsyncThunk('modules/getAccessibleModules', async () => {
  try {
    let BASE_URL = import.meta.env.VITE_ACCOUNT_API_URL;
    const response = await callApiWithCustomBaseURL(BASE_URL, 'auth/modules', {
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || error.message || 'Something went wrong';
  }
});

export const moduleSlice = createSlice({
  name: 'modules',
  initialState: {
    modules: [],
    permissionModules: [],
    permissionPlanMap: {},
    featureInPlanMap: {},
    hardHiddenPlanFeatures: [],
    accessibleModules: [],
    loading: false,
    settingsPlanLoaded: false,
    error: null,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(getModuleList.pending, state => {
        state.loading = true;
      })
      .addCase(getModuleList.fulfilled, (state, action) => {
        state.loading = false;
        const moduleTree = action.payload?.data?.moduleTree;
        state.permissionModules = moduleTree;
        state.permissionPlanMap = buildPermissionPlanMap(flattenPermissionModuleTree(moduleTree));
        state.featureInPlanMap = buildFeatureInPlanMap(moduleTree);
      })
      .addCase(getModuleList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(getSettingsFeaturePlan.fulfilled, (state, action) => {
        const featurePlanStatus = action.payload?.data?.featurePlanStatus;
        if (featurePlanStatus) {
          state.featureInPlanMap = { ...state.featureInPlanMap, ...featurePlanStatus };
        }
        state.hardHiddenPlanFeatures = action.payload?.data?.hardHiddenFeatures || [];
        state.settingsPlanLoaded = true;
      })
      .addCase(getSettingsFeaturePlan.rejected, state => {
        state.settingsPlanLoaded = true;
      })
      .addCase(getAccessibleModules.pending, state => {
        state.loading = true;
      })
      .addCase(getAccessibleModules.fulfilled, (state, action) => {
        state.loading = false;
        state.accessibleModules = action.payload?.data || [];
      })
      .addCase(getAccessibleModules.rejected, (state, action) => {
        state.loading = false;
        state.accessibleModules = [];
        state.error = action.error.message;
      });
  },
});
export const moduleSliceMethods = {
  getModuleList,
  getAccessibleModules,
  getSettingsFeaturePlan,
};
export default moduleSlice.reducer;
