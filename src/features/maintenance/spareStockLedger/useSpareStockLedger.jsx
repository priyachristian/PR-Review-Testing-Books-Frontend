import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { spareStockLedgerSliceMethods, resetSpareStockLedger as resetSpareStockLedgerAction } from './spareStockLedger.slice';

export const useSpareStockLedger = () => {
  const dispatch = useDispatch();
  const { spareStockLedgers, loading, submitLoading, error, pagination } = useSelector(state => state.spareStockLedger);

  const getSpareStockLedgers = useCallback(
    async payload => {
      const response = await dispatch(spareStockLedgerSliceMethods.getSpareStockLedgers(payload));
      return response;
    },
    [dispatch]
  );

  const createAdjustment = useCallback(
    async payload => {
      return await dispatch(spareStockLedgerSliceMethods.createAdjustment(payload)).unwrap();
    },
    [dispatch]
  );

  const resetSpareStockLedger = useCallback(() => dispatch(resetSpareStockLedgerAction()), [dispatch]);

  return {
    spareStockLedgers,
    loading,
    submitLoading,
    error,
    pagination,
    getSpareStockLedgers,
    createAdjustment,
    resetSpareStockLedger,
  };
};
