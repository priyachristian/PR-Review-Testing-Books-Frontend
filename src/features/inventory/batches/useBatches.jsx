import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { batchesSliceMethods, resetBatches as resetBatchesAction, resetBatchById as resetBatchByIdAction } from './batches.slice';

export const useBatches = () => {
  const dispatch = useDispatch();

  const { batches, batchById, pagination, loading, batchLoading } = useSelector(state => state.batches);

  const getItemBatches = useCallback(
    async payload => {
      return await dispatch(batchesSliceMethods.getItemBatches(payload));
    },
    [dispatch]
  );

  const getItemBatchById = useCallback(
    async payload => {
      return await dispatch(batchesSliceMethods.getItemBatchById(payload));
    },
    [dispatch]
  );

  const resetBatches = useCallback(() => dispatch(resetBatchesAction()), [dispatch]);

  const resetBatchById = useCallback(() => dispatch(resetBatchByIdAction()), [dispatch]);

  return {
    batches,
    batchById,
    pagination,
    loading,
    batchLoading,
    getItemBatches,
    getItemBatchById,
    resetBatches,
    resetBatchById,
  };
};
