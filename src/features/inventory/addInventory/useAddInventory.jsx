import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { inventoryLogsSliceMethods, resetInventoryLogs as resetInventoryLogsAction } from '@/features/inventory/addInventory/addInventory.slice';

export const useAddInventory = () => {
  const dispatch = useDispatch();

  const { inventoryLogs, loading, error } = useSelector(state => state.inventoryLogs);

  const getInventoryLogs = useCallback(
    async payload => {
      return await dispatch(inventoryLogsSliceMethods.getInventoryLogs(payload));
    },
    [dispatch]
  );

  const resetInventoryLogs = useCallback(() => dispatch(resetInventoryLogsAction()), [dispatch]);

  return {
    inventoryLogs,
    loading,
    error,
    getInventoryLogs,
    resetInventoryLogs,
  };
};
