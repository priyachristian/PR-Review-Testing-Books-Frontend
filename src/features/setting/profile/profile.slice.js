import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { profileService } from './profile.service';

const getProfile = createAsyncThunk('profile/getProfile', profileService.getProfile);

const getCompanyProfileSettings = createAsyncThunk('profile/getCompanyProfileSettings', profileService.getCompanyProfileSettings);

const updateProfile = createAsyncThunk('profile/updateProfile', profileService.updateProfile);

const profileLogo = createAsyncThunk('profile/profileLogo', profileService.profileLogo);

const profileSign = createAsyncThunk('profile/profileSign', profileService.profileSign);

const updateInventoryConfig = createAsyncThunk('profile/updateInventoryConfig', profileService.updateInventoryConfig);

const updateBranchConfig = createAsyncThunk('profile/updateBranchConfig', profileService.updateBranchConfig);

const createSplitSessionPin = createAsyncThunk('profile/createSplitSessionPin', profileService.createSplitSessionPin);

const verifySplitSessionPin = createAsyncThunk('profile/verifySplitSessionPin', profileService.verifySplitSessionPin);

const updateDiscountConfig = createAsyncThunk('profile/updateDiscountConfig', profileService.updateDiscountConfig);

const getProfileAddress = createAsyncThunk('profile/getProfileAddress', profileService.getProfileAddress);

const addProfileAddress = createAsyncThunk('profile/addProfileAddress', profileService.addProfileAddress);

const updateProfileAddress = createAsyncThunk('profile/updateProfileAddress', profileService.updateProfileAddress);

export const getSubscriptionDetail = createAsyncThunk('profile/getSubscriptionDetail', profileService.getSubscriptionDetail);

export const getActiveFeatures = createAsyncThunk('profile/getActiveFeatures', profileService.getActiveFeatures);

const getInventoryConfig = createAsyncThunk('profile/getInventoryConfig', profileService.getInventoryConfig);

const getAutoPayConfig = createAsyncThunk('profile/getAutoPayConfig', profileService.getAutoPayConfig);

const updateAutoPayConfig = createAsyncThunk('profile/updateAutoPayConfig', profileService.updateAutoPayConfig);

const getCreditLimitConfig = createAsyncThunk('profile/getCreditLimitConfig', profileService.getCreditLimitConfig);

const updateCreditLimitConfig = createAsyncThunk('profile/updateCreditLimitConfig', profileService.updateCreditLimitConfig);

const updateRejectionWarehouseConfig = createAsyncThunk('profile/updateRejectionWarehouseConfig', profileService.updateRejectionWarehouseConfig);

const getCompanyCode = createAsyncThunk('profile/getCompanyCode', profileService.getCompanyCode);

const generateCompanyCode = createAsyncThunk('profile/generateCompanyCode', profileService.generateCompanyCode);

export const profileSlice = createSlice({
  name: 'profile',
  initialState: {
    profile: [],
    companyProfileSettings: {},
    address: null,
    logoFile: null,
    signFile: null,
    create: null,
    update: null,
    loading: false,
    uploading: false,
    droploading: false,
    inventoryConfigLoading: false,
    branchConfigLoading: false,
    sessionPinLoading: false,
    discountConfigLoading: false,
    logoUploading: false,
    signUploading: false,
    error: null,
    subscriptionDetailLoading: false,
    subscriptionDetail: null,
    activeFeatures: null,
    inventoryConfig: null,
    autoPayConfig: null,
    autoPayConfigLoading: false,
    autoPayConfigFetching: false,
    creditLimitConfig: null,
    creditLimitConfigLoading: false,
    rejectionWarehouseConfigLoading: false,
    companyCode: null,
    companyCodeLoading: false,
    companyCodeGenerating: false,
  },
  reducers: {
    resetAddress: state => {
      state.address = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getProfile.pending, state => {
        state.loading = true;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(getCompanyProfileSettings.pending, state => {
        state.loading = true;
      })
      .addCase(getCompanyProfileSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.companyProfileSettings = action.payload.data;
      })
      .addCase(getCompanyProfileSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(updateProfile.pending, state => {
        state.loading = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.update = action.payload;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(profileLogo.pending, state => {
        state.logoUploading = true;
      })
      .addCase(profileLogo.fulfilled, (state, action) => {
        state.logoUploading = false;
        state.logoFile = action.payload.data.urls;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(profileLogo.rejected, (state, action) => {
        state.logoUploading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(profileSign.pending, state => {
        state.signUploading = true;
      })
      .addCase(profileSign.fulfilled, (state, action) => {
        state.signUploading = false;
        state.signFile = action.payload.data.urls;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(profileSign.rejected, (state, action) => {
        state.signUploading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updateInventoryConfig.pending, state => {
        state.inventoryConfigLoading = true;
      })
      .addCase(updateInventoryConfig.fulfilled, (state, action) => {
        state.inventoryConfigLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(updateInventoryConfig.rejected, (state, action) => {
        state.inventoryConfigLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updateBranchConfig.pending, state => {
        state.branchConfigLoading = true;
      })
      .addCase(updateBranchConfig.fulfilled, (state, action) => {
        state.branchConfigLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(updateBranchConfig.rejected, (state, action) => {
        state.branchConfigLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(createSplitSessionPin.pending, state => {
        state.sessionPinLoading = true;
      })
      .addCase(createSplitSessionPin.fulfilled, (state, action) => {
        state.sessionPinLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(createSplitSessionPin.rejected, (state, action) => {
        state.sessionPinLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(verifySplitSessionPin.pending, state => {
        state.sessionPinLoading = true;
      })
      .addCase(verifySplitSessionPin.fulfilled, (state, action) => {
        state.sessionPinLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(verifySplitSessionPin.rejected, (state, action) => {
        state.sessionPinLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updateDiscountConfig.pending, state => {
        state.discountConfigLoading = true;
      })
      .addCase(updateDiscountConfig.fulfilled, (state, action) => {
        state.discountConfigLoading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(updateDiscountConfig.rejected, (state, action) => {
        state.discountConfigLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getProfileAddress.pending, state => {
        state.loading = true;
      })
      .addCase(getProfileAddress.fulfilled, (state, action) => {
        state.loading = false;
        state.address = action.payload.data;
        state.message = action.payload.message;
      })
      .addCase(getProfileAddress.rejected, (state, action) => {
        state.loading = false;
        state.address = null;
        state.error = action.error.message;
      })
      .addCase(addProfileAddress.pending, state => {
        state.loading = true;
      })
      .addCase(addProfileAddress.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(addProfileAddress.rejected, (state, action) => {
        state.loading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updateProfileAddress.pending, state => {
        state.loading = true;
      })
      .addCase(updateProfileAddress.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(updateProfileAddress.rejected, (state, action) => {
        state.loading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getSubscriptionDetail.pending, state => {
        state.subscriptionDetailLoading = true;
      })
      .addCase(getSubscriptionDetail.fulfilled, (state, action) => {
        state.subscriptionDetail = action.payload.data;
        state.subscriptionDetailLoading = false;
      })
      .addCase(getSubscriptionDetail.rejected, (state, action) => {
        state.subscriptionDetailLoading = false;
        state.subscriptionDetail = null;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getActiveFeatures.pending, state => {
        state.loading = true;
      })
      .addCase(getActiveFeatures.fulfilled, (state, action) => {
        state.activeFeatures = action.payload.data;
        state.loading = false;
      })
      .addCase(getActiveFeatures.rejected, state => {
        state.loading = false;
        state.activeFeatures = null;
      })
      .addCase(getInventoryConfig.pending, state => {
        state.inventoryConfigLoading = true;
      })
      .addCase(getInventoryConfig.fulfilled, (state, action) => {
        state.inventoryConfigLoading = false;
        state.inventoryConfig = action.payload.data;
      })
      .addCase(getInventoryConfig.rejected, (state, action) => {
        state.inventoryConfigLoading = false;
        state.inventoryConfig = null;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getCreditLimitConfig.pending, state => {
        state.creditLimitConfigLoading = true;
      })
      .addCase(getCreditLimitConfig.fulfilled, (state, action) => {
        state.creditLimitConfigLoading = false;
        state.creditLimitConfig = action.payload?.data ?? action.payload;
      })
      .addCase(getCreditLimitConfig.rejected, (state, action) => {
        state.creditLimitConfigLoading = false;
        state.creditLimitConfig = null;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updateCreditLimitConfig.pending, state => {
        state.creditLimitConfigLoading = true;
      })
      .addCase(updateCreditLimitConfig.fulfilled, (state, action) => {
        state.creditLimitConfigLoading = false;
        state.creditLimitConfig = action.payload?.data ?? action.payload;
        state.message = action.payload?.message;
        Toast.success(state.message || 'Credit limit configuration updated successfully');
      })
      .addCase(updateCreditLimitConfig.rejected, (state, action) => {
        state.creditLimitConfigLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updateRejectionWarehouseConfig.pending, state => {
        state.rejectionWarehouseConfigLoading = true;
      })
      .addCase(updateRejectionWarehouseConfig.fulfilled, (state, action) => {
        state.rejectionWarehouseConfigLoading = false;
        state.companyProfileSettings = {
          ...state.companyProfileSettings,
          rejectionWarehouseConfig: action.payload?.data,
        };
        Toast.success(action.payload?.message || 'Rejection warehouse configuration saved successfully');
      })
      .addCase(updateRejectionWarehouseConfig.rejected, (state, action) => {
        state.rejectionWarehouseConfigLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getAutoPayConfig.pending, state => {
        state.autoPayConfigFetching = true;
      })
      .addCase(getAutoPayConfig.fulfilled, (state, action) => {
        state.autoPayConfigFetching = false;
        state.autoPayConfig = action.payload.data;
      })
      .addCase(getAutoPayConfig.rejected, (state, action) => {
        state.autoPayConfigFetching = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updateAutoPayConfig.pending, state => {
        state.autoPayConfigLoading = true;
      })
      .addCase(updateAutoPayConfig.fulfilled, (state, action) => {
        state.autoPayConfigLoading = false;
        state.autoPayConfig = action.payload.data;
        state.message = action.payload.message;
        Toast.success(state.message);
      })
      .addCase(updateAutoPayConfig.rejected, (state, action) => {
        state.autoPayConfigLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getCompanyCode.pending, state => {
        state.companyCodeLoading = true;
      })
      .addCase(getCompanyCode.fulfilled, (state, action) => {
        state.companyCodeLoading = false;
        state.companyCode = action.payload?.data?.code ?? null;
      })
      .addCase(getCompanyCode.rejected, state => {
        state.companyCodeLoading = false;
        state.companyCode = null;
      })
      .addCase(generateCompanyCode.pending, state => {
        state.companyCodeGenerating = true;
      })
      .addCase(generateCompanyCode.fulfilled, (state, action) => {
        state.companyCodeGenerating = false;
        state.companyCode = action.payload?.data?.code ?? null;
        Toast.success(action.payload?.message || 'Company code generated successfully');
      })
      .addCase(generateCompanyCode.rejected, (state, action) => {
        state.companyCodeGenerating = false;
        state.error = action.error.message;
        Toast.error(state.error);
      });
  },
});
export const profileSliceMethods = {
  getProfile,
  getCompanyProfileSettings,
  updateProfile,
  profileLogo,
  profileSign,
  updateInventoryConfig,
  updateBranchConfig,
  createSplitSessionPin,
  verifySplitSessionPin,
  updateDiscountConfig,
  getCreditLimitConfig,
  updateCreditLimitConfig,
  getProfileAddress,
  addProfileAddress,
  updateProfileAddress,
  getSubscriptionDetail,
  getActiveFeatures,
  getInventoryConfig,
  getAutoPayConfig,
  updateAutoPayConfig,
  updateRejectionWarehouseConfig,
  getCompanyCode,
  generateCompanyCode,
};
export const { resetAddress } = profileSlice.actions;
export default profileSlice.reducer;
