import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';

const getOnboardingStatus = withErrorHandling(async payload => {
  const { signal } = payload;
  const config = { ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.ONBOARDING.STATUS, config);
  return response.data;
}, 'getOnboardingStatus');

const getDataSetupStatus = withErrorHandling(async payload => {
  const { signal } = payload;
  const config = { ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.ONBOARDING.DATA_SETUP_STATUS, config);
  return response.data;
}, 'getDataSetupStatus');

const getDataSetupPreview = withErrorHandling(async payload => {
  const { key, signal } = payload;
  const config = { params: { key }, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.ONBOARDING.DATA_SETUP_PREVIEW, config);
  return response.data;
}, 'getDataSetupPreview');

const runDataSetup = withErrorHandling(async payload => {
  const { key, params } = payload;
  const response = await axiosConfig.post(API_ROUTES.ONBOARDING.DATA_SETUP_RUN, { key, params });
  return response.data;
}, 'runDataSetup');

export const onboardingService = {
  getOnboardingStatus,
  getDataSetupStatus,
  getDataSetupPreview,
  runDataSetup,
};
