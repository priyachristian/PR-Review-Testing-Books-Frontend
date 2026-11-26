import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { whatsappConfigSliceMethods, resetWhatsappConfig as resetWhatsappConfigAction } from '@/features/setting/whatsappConfig/whatsappConfig.slice';

export const useWhatsappConfig = () => {
  const dispatch = useDispatch();

  const { whatsappConfig, loading, saving, error } = useSelector(state => state.whatsappConfig);

  const getWhatsappConfig = useCallback(async payload => await dispatch(whatsappConfigSliceMethods.getWhatsappConfig(payload)), [dispatch]);

  const updateWhatsappConfig = useCallback(payload => dispatch(whatsappConfigSliceMethods.updateWhatsappConfig(payload)), [dispatch]);

  const resetWhatsappConfig = useCallback(() => dispatch(resetWhatsappConfigAction()), [dispatch]);

  return {
    whatsappConfig,
    loading,
    saving,
    error,
    getWhatsappConfig,
    updateWhatsappConfig,
    resetWhatsappConfig,
  };
};
