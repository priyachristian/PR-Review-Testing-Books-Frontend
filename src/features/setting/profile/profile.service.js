import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { buildFileFormData } from '@/utils/multipartHelper';

const getProfile = withErrorHandling(async payload => {
  const { signal } = payload ?? {};
  const config = { ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.PROFILE.GET, config);
  return response.data;
}, 'getProfile');

const getCompanyProfileSettings = withErrorHandling(async payload => {
  const { signal } = payload ?? {};
  const config = { ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.PROFILE.GET_COMPANY_SETTING, config);
  return response.data;
}, 'getCompanyProfileSettings');

const updateProfile = withErrorHandling(async payload => {
  const { profileData } = payload;
  const hasLogoFile = profileData?.companyLogo instanceof File;
  const hasSignFile = profileData?.authorizedSignature instanceof File;
  const hasFiles = hasLogoFile || hasSignFile;

  if (hasFiles) {
    const formData = new FormData();
    const { companyLogo, authorizedSignature, ...rest } = profileData;
    formData.append('JSONString', JSON.stringify(rest));
    if (hasLogoFile) formData.append('companyLogo', companyLogo);
    if (hasSignFile) formData.append('authorizedSignature', authorizedSignature);
    const response = await axiosConfig.put(API_ROUTES.PROFILE.UPDATE, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }
  const response = await axiosConfig.put(API_ROUTES.PROFILE.UPDATE, profileData);
  return response.data;
}, 'updateProfile');

const profileLogo = withErrorHandling(async payload => {
  const formData = buildFileFormData(payload);
  const response = await axiosConfig.post(API_ROUTES.FILE.UPLOAD, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}, 'profileLogo');

const profileSign = withErrorHandling(async payload => {
  const formData = buildFileFormData(payload);
  const response = await axiosConfig.post(API_ROUTES.FILE.UPLOAD, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}, 'profileSign');

const updateInventoryConfig = withErrorHandling(async payload => {
  const { payload: body } = payload;
  const response = await axiosConfig.put(API_ROUTES.PROFILE.UPDATE_INVENTORY, body);
  return response.data;
}, 'updateInventoryConfig');

const updateBranchConfig = withErrorHandling(async payload => {
  const { payload: body } = payload;
  const response = await axiosConfig.put(API_ROUTES.PROFILE.UPDATE_BRANCH_CONFIG, body);
  return response.data;
}, 'updateBranchConfig');

const createSplitSessionPin = withErrorHandling(async payload => {
  const { pinNo } = payload;
  const response = await axiosConfig.get(API_ROUTES.PROFILE.CREATE_SESSION_PIN, {
    params: { pinNo },
  });
  return response.data;
}, 'createSplitSessionPin');

const verifySplitSessionPin = withErrorHandling(async payload => {
  const { pinNo } = payload;
  const response = await axiosConfig.get(API_ROUTES.PROFILE.VERIFY_SESSION_PIN, {
    params: { pinNo },
  });
  return response.data;
}, 'verifySplitSessionPin');

const updateDiscountConfig = withErrorHandling(async payload => {
  const { discountConfig } = payload;
  const response = await axiosConfig.put(API_ROUTES.PROFILE.UPDATE_DISCOUNT_CONFIG, discountConfig);
  return response.data;
}, 'updateDiscountConfig');

const getCreditLimitConfig = withErrorHandling(async payload => {
  const { signal } = payload ?? {};
  const config = { ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.PROFILE.GET_CREDIT_LIMIT_CONFIG, config);
  return response.data;
}, 'getCreditLimitConfig');

const updateCreditLimitConfig = withErrorHandling(async payload => {
  const { creditLimitConfig } = payload;
  const response = await axiosConfig.put(API_ROUTES.PROFILE.UPDATE_CREDIT_LIMIT_CONFIG, creditLimitConfig);
  return response.data;
}, 'updateCreditLimitConfig');

const getProfileAddress = withErrorHandling(async payload => {
  const { signal } = payload ?? {};
  const config = { ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.PROFILE.GET_PROFILE_ADDRESS, config);
  return response.data;
}, 'getProfileAddress');

const addProfileAddress = withErrorHandling(async payload => {
  const response = await axiosConfig.post(API_ROUTES.PROFILE.CREATE_PROFILE_ADDRESS, payload);
  return response.data;
}, 'addProfileAddress');

const updateProfileAddress = withErrorHandling(async payload => {
  const { addressId, ...bodyPayload } = payload;
  const response = await axiosConfig.put(API_ROUTES.PROFILE.UPDATE_PROFILE_ADDRESS(addressId), bodyPayload);
  return response.data;
}, 'updateProfileAddress');

const getSubscriptionDetail = withErrorHandling(async payload => {
  const config = { ...withAbortSignal(payload?.signal) };
  const response = await axiosConfig.get(API_ROUTES.PROFILE.GET_SUBSCRIPTION_DETAILS, config);
  return response.data;
}, 'getSubscriptionDetail');

const getActiveFeatures = withErrorHandling(async payload => {
  const config = { ...withAbortSignal(payload?.signal) };
  const response = await axiosConfig.get(API_ROUTES.PROFILE.GET_ACTIVE_FEATURE, config);
  return response.data;
}, 'getActiveFeatures');

const getInventoryConfig = withErrorHandling(async payload => {
  const config = { ...withAbortSignal(payload?.signal) };
  const response = await axiosConfig.get(API_ROUTES.PROFILE.GET_INVENTORY_CONFIG, config);
  return response.data;
}, 'getInventoryConfig');

const getAutoPayConfig = withErrorHandling(async payload => {
  const config = { ...withAbortSignal(payload?.signal) };
  const response = await axiosConfig.get(API_ROUTES.PROFILE.GET_AUTO_PAY_CONFIG, config);
  return response.data;
}, 'getAutoPayConfig');

const updateAutoPayConfig = withErrorHandling(async payload => {
  const { payload: body } = payload;
  const response = await axiosConfig.put(API_ROUTES.PROFILE.UPDATE_AUTO_PAY_CONFIG, body);
  return response.data;
}, 'updateAutoPayConfig');

const updateRejectionWarehouseConfig = withErrorHandling(async payload => {
  const { payload: body } = payload;
  const response = await axiosConfig.put(API_ROUTES.PROFILE.UPDATE_REJECTION_WAREHOUSE_CONFIG, body);
  return response.data;
}, 'updateRejectionWarehouseConfig');

const getCompanyCode = withErrorHandling(async payload => {
  const config = { ...withAbortSignal(payload?.signal) };
  const response = await axiosConfig.get(API_ROUTES.PROFILE.GET_COMPANY_CODE, config);
  return response.data;
}, 'getCompanyCode');

const generateCompanyCode = withErrorHandling(async () => {
  const response = await axiosConfig.post(API_ROUTES.PROFILE.GENERATE_COMPANY_CODE);
  return response.data;
}, 'generateCompanyCode');

export const profileService = {
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
