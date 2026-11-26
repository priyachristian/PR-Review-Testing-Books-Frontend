import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { quotationConfigSliceMethods, resetQuotationConfig as resetQuotationConfigAction } from '@/features/setting/quotationConfig/quotationConfig.slice';

export const useQuotationConfig = () => {
  const dispatch = useDispatch();

  const { quotationConfig, quoteCloseReasons, loading, saving, error } = useSelector(state => state.quotationConfig);

  const getQuotationConfig = useCallback(async payload => await dispatch(quotationConfigSliceMethods.getQuotationConfig(payload)), [dispatch]);

  const updateQuotationConfig = useCallback(payload => dispatch(quotationConfigSliceMethods.updateQuotationConfig(payload)), [dispatch]);

  const resetQuotationConfig = useCallback(() => dispatch(resetQuotationConfigAction()), [dispatch]);

  return {
    quotationConfig,
    quoteCloseReasons,
    loading,
    saving,
    error,
    getQuotationConfig,
    updateQuotationConfig,
    resetQuotationConfig,
  };
};
