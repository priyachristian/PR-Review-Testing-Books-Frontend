import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { onboardingSliceMethods, resetOnboarding as resetOnboardingAction, resetDataSetupPreview as resetDataSetupPreviewAction } from './onboarding.slice';

export const useOnboarding = () => {
  const dispatch = useDispatch();
  const { status, loading, error, dataSetup, dataSetupLoading, dataSetupRunningKey, dataSetupPreview, dataSetupPreviewLoading } = useSelector(state => state.onboarding);

  const getOnboardingStatus = useCallback(
    async payload => {
      return await dispatch(onboardingSliceMethods.getOnboardingStatus(payload));
    },
    [dispatch]
  );
  const getDataSetupStatus = useCallback(
    async payload => {
      return await dispatch(onboardingSliceMethods.getDataSetupStatus(payload));
    },
    [dispatch]
  );
  const getDataSetupPreview = useCallback(
    async payload => {
      return await dispatch(onboardingSliceMethods.getDataSetupPreview(payload));
    },
    [dispatch]
  );
  const runDataSetup = useCallback(
    async payload => {
      return await dispatch(onboardingSliceMethods.runDataSetup(payload)).unwrap();
    },
    [dispatch]
  );
  const resetOnboarding = useCallback(() => dispatch(resetOnboardingAction()), [dispatch]);
  const resetDataSetupPreview = useCallback(() => dispatch(resetDataSetupPreviewAction()), [dispatch]);

  return {
    status,
    loading,
    error,
    dataSetup,
    dataSetupLoading,
    dataSetupRunningKey,
    dataSetupPreview,
    dataSetupPreviewLoading,
    getOnboardingStatus,
    getDataSetupStatus,
    getDataSetupPreview,
    runDataSetup,
    resetOnboarding,
    resetDataSetupPreview,
  };
};
