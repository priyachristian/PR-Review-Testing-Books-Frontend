import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateCompany } from 'features/auth/authSlice';
import { profileSliceMethods, resetAddress as resetAddressAction } from '@/features/setting/profile/profile.slice';

export const useProfile = () => {
  const dispatch = useDispatch();

  const {
    profile,
    companyProfileSettings,
    address,
    logoFile,
    signFile,
    create,
    update,
    loading,
    uploading,
    droploading,
    logoUploading,
    signUploading,
    error,
    inventoryConfigLoading,
    branchConfigLoading,
    sessionPinLoading,
    discountConfigLoading,
    subscriptionDetailLoading,
    subscriptionDetail,
    activeFeatures,
    inventoryConfig,
    autoPayConfig,
    autoPayConfigLoading,
    autoPayConfigFetching,
    creditLimitConfig,
    creditLimitConfigLoading,
    rejectionWarehouseConfigLoading,
    companyCode,
    companyCodeLoading,
    companyCodeGenerating,
  } = useSelector(state => state.profile);

  const getProfile = useCallback(async payload => await dispatch(profileSliceMethods.getProfile(payload)), [dispatch]);

  const refreshCompanyProfile = useCallback(
    async (payload = {}) => {
      const result = await dispatch(profileSliceMethods.getProfile(payload));
      const company = result?.payload?.data;
      if (company) {
        dispatch(updateCompany(company));
      }
      return company;
    },
    [dispatch]
  );

  const getCompanyProfileSettings = useCallback(async payload => await dispatch(profileSliceMethods.getCompanyProfileSettings(payload)), [dispatch]);

  const updateProfile = useCallback(async payload => await dispatch(profileSliceMethods.updateProfile(payload)).unwrap(), [dispatch]);

  const profileSign = useCallback(async payload => await dispatch(profileSliceMethods.profileSign(payload)).unwrap(), [dispatch]);

  const profileLogo = useCallback(async payload => await dispatch(profileSliceMethods.profileLogo(payload)).unwrap(), [dispatch]);

  const updateInventoryConfig = useCallback(async payload => await dispatch(profileSliceMethods.updateInventoryConfig(payload)).unwrap(), [dispatch]);

  const updateBranchConfig = useCallback(async payload => await dispatch(profileSliceMethods.updateBranchConfig(payload)).unwrap(), [dispatch]);

  const createSplitSessionPin = useCallback(async payload => await dispatch(profileSliceMethods.createSplitSessionPin(payload)).unwrap(), [dispatch]);

  const verifySplitSessionPin = useCallback(async payload => await dispatch(profileSliceMethods.verifySplitSessionPin(payload)).unwrap(), [dispatch]);

  const updateDiscountConfig = useCallback(async payload => await dispatch(profileSliceMethods.updateDiscountConfig(payload)).unwrap(), [dispatch]);

  const getProfileAddress = useCallback(async payload => await dispatch(profileSliceMethods.getProfileAddress(payload)), [dispatch]);

  const addProfileAddress = useCallback(async payload => await dispatch(profileSliceMethods.addProfileAddress(payload)).unwrap(), [dispatch]);

  const updateProfileAddress = useCallback(async payload => await dispatch(profileSliceMethods.updateProfileAddress(payload)).unwrap(), [dispatch]);

  const resetAddress = useCallback(() => dispatch(resetAddressAction()), [dispatch]);

  const getSubscriptionDetail = useCallback(async payload => await dispatch(profileSliceMethods.getSubscriptionDetail(payload)), [dispatch]);

  const getActiveFeatures = useCallback(async payload => await dispatch(profileSliceMethods.getActiveFeatures(payload)), [dispatch]);

  const getInventoryConfig = useCallback(async payload => await dispatch(profileSliceMethods.getInventoryConfig(payload)), [dispatch]);

  const getAutoPayConfig = useCallback(async payload => await dispatch(profileSliceMethods.getAutoPayConfig(payload)), [dispatch]);

  const updateAutoPayConfig = useCallback(async payload => await dispatch(profileSliceMethods.updateAutoPayConfig(payload)).unwrap(), [dispatch]);

  const getCreditLimitConfig = useCallback(async payload => await dispatch(profileSliceMethods.getCreditLimitConfig(payload)), [dispatch]);

  const updateCreditLimitConfig = useCallback(async payload => await dispatch(profileSliceMethods.updateCreditLimitConfig(payload)).unwrap(), [dispatch]);

  const updateRejectionWarehouseConfig = useCallback(async payload => await dispatch(profileSliceMethods.updateRejectionWarehouseConfig(payload)).unwrap(), [dispatch]);

  const getCompanyCode = useCallback(async payload => await dispatch(profileSliceMethods.getCompanyCode(payload)), [dispatch]);

  const generateCompanyCode = useCallback(async () => await dispatch(profileSliceMethods.generateCompanyCode()).unwrap(), [dispatch]);

  return {
    profile,
    companyProfileSettings,
    address,
    logoFile,
    signFile,
    create,
    update,
    loading,
    uploading,
    droploading,
    inventoryConfigLoading,
    branchConfigLoading,
    sessionPinLoading,
    discountConfigLoading,
    logoUploading,
    signUploading,
    subscriptionDetailLoading,
    subscriptionDetail,
    activeFeatures,
    inventoryConfig,
    autoPayConfig,
    autoPayConfigLoading,
    autoPayConfigFetching,
    creditLimitConfig,
    creditLimitConfigLoading,
    rejectionWarehouseConfigLoading,
    companyCode,
    companyCodeLoading,
    companyCodeGenerating,
    error,
    getProfile,
    refreshCompanyProfile,
    getCompanyProfileSettings,
    updateProfile,
    profileSign,
    profileLogo,
    updateInventoryConfig,
    updateBranchConfig,
    createSplitSessionPin,
    verifySplitSessionPin,
    updateDiscountConfig,
    getProfileAddress,
    addProfileAddress,
    updateProfileAddress,
    resetAddress,
    getSubscriptionDetail,
    getActiveFeatures,
    getInventoryConfig,
    getAutoPayConfig,
    updateAutoPayConfig,
    getCreditLimitConfig,
    updateCreditLimitConfig,
    updateRejectionWarehouseConfig,
    getCompanyCode,
    generateCompanyCode,
  };
};
