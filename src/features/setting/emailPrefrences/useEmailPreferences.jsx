import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { emailPreferencesSliceMethods, resetEmailPreferences as resetEmailPreferencesAction } from '@/features/setting/emailPrefrences/emailPreferences.slice';

export const useEmailPreferences = () => {
  const dispatch = useDispatch();

  const { moduleEmailConfig, loading, saving, error } = useSelector(state => state.emailPreferences);

  const getModuleEmailConfig = useCallback(async payload => await dispatch(emailPreferencesSliceMethods.getModuleEmailConfig(payload)), [dispatch]);

  const updateModuleEmailConfig = useCallback(payload => dispatch(emailPreferencesSliceMethods.updateModuleEmailConfig(payload)), [dispatch]);

  const resetEmailPreferences = useCallback(() => dispatch(resetEmailPreferencesAction()), [dispatch]);

  return {
    moduleEmailConfig,
    loading,
    saving,
    error,
    getModuleEmailConfig,
    updateModuleEmailConfig,
    resetEmailPreferences,
  };
};
