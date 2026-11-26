import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { moduleConfigSliceMethods, resetModuleConfig as resetModuleConfigAction } from '@/features/common/moduleConfig/moduleConfigSlice';

export const useModuleConfig = () => {
  const dispatch = useDispatch();

  const { moduleConfig, moduleName, loading, error } = useSelector(state => state.moduleConfig);

  const getModuleConfig = useCallback(async payload => await dispatch(moduleConfigSliceMethods.getModuleConfig(payload)), [dispatch]);

  const updateModuleConfig = useCallback(async payload => await dispatch(moduleConfigSliceMethods.updateModuleConfig(payload)).unwrap(), [dispatch]);

  const resetModuleConfig = useCallback(() => dispatch(resetModuleConfigAction()), [dispatch]);

  return {
    moduleConfig,
    moduleName,
    loading,
    error,
    getModuleConfig,
    updateModuleConfig,
    resetModuleConfig,
  };
};
