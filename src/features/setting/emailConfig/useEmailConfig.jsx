import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { emailConfigSliceMethods, resetEmailConfig as resetEmailConfigAction } from '@/features/setting/emailConfig/emailConfig.slice';

export const useEmailConfig = () => {
  const dispatch = useDispatch();

  const { isEmailEnabled, emailConfiguration, loading, saving, testing, error } = useSelector(state => state.emailConfig);

  const getEmailConfig = useCallback(async payload => await dispatch(emailConfigSliceMethods.getEmailConfig(payload)), [dispatch]);

  const updateEmailConfig = useCallback(payload => dispatch(emailConfigSliceMethods.updateEmailConfig(payload)), [dispatch]);

  const testEmailConfig = useCallback(payload => dispatch(emailConfigSliceMethods.testEmailConfig(payload)), [dispatch]);

  const resetEmailConfig = useCallback(() => dispatch(resetEmailConfigAction()), [dispatch]);

  return {
    isEmailEnabled,
    emailConfiguration,
    loading,
    saving,
    testing,
    error,
    getEmailConfig,
    updateEmailConfig,
    testEmailConfig,
    resetEmailConfig,
  };
};
