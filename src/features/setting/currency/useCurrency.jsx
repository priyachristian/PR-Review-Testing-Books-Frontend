import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { currencySliceMethods } from '@/features/setting/currency/currency.slice';

export const useCurrency = () => {
  const dispatch = useDispatch();

  const { currencies, pagination, loading, saving, deletingId, error } = useSelector(state => state.currency);

  const getCurrencies = useCallback(async payload => await dispatch(currencySliceMethods.getCurrencies(payload)), [dispatch]);
  const createCurrency = useCallback(async payload => await dispatch(currencySliceMethods.createCurrency(payload)).unwrap(), [dispatch]);
  const updateCurrency = useCallback(async payload => await dispatch(currencySliceMethods.updateCurrency(payload)).unwrap(), [dispatch]);
  const deleteCurrency = useCallback(async payload => await dispatch(currencySliceMethods.deleteCurrency(payload)).unwrap(), [dispatch]);

  return {
    currencies,
    pagination,
    loading,
    saving,
    deletingId,
    error,
    getCurrencies,
    createCurrency,
    updateCurrency,
    deleteCurrency,
  };
};
