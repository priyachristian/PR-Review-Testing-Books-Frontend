import { inventoryAdjustmentSliceMethods, resetInventoryAdjustment as resetInventoryAdjustmentAction } from '@/features/inventory/inventoryAdjustment/inventoryAdjustment.slice';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

export const useInventoryAdjustment = () => {
  const dispatch = useDispatch();

  const { inventoryAdjustment, inventoryAdjustmentById, pagination, loading, submitLoading, approveLoading, rejectLoading } = useSelector(state => state.inventoryAdjustment);

  const getInventoryAdjustment = useCallback(
    async payload => {
      return await dispatch(inventoryAdjustmentSliceMethods.getInventoryAdjustment(payload));
    },
    [dispatch]
  );

  const resetInventoryAdjustment = useCallback(() => dispatch(resetInventoryAdjustmentAction()), [dispatch]);

  const createInventoryAdjustment = useCallback(
    async inventoryData => {
      return await dispatch(inventoryAdjustmentSliceMethods.createInventoryAdjustment(inventoryData)).unwrap();
    },
    [dispatch]
  );

  const updateInventoryAdjustment = useCallback(
    async payload => {
      return await dispatch(inventoryAdjustmentSliceMethods.updateInventoryAdjustment(payload)).unwrap();
    },
    [dispatch]
  );

  const approveInventoryAdjustment = useCallback(
    async payload => {
      return await dispatch(inventoryAdjustmentSliceMethods.approveInventoryAdjustment(payload)).unwrap();
    },
    [dispatch]
  );

  const rejectInventoryAdjustment = useCallback(
    async payload => {
      return await dispatch(inventoryAdjustmentSliceMethods.rejectInventoryAdjustment(payload)).unwrap();
    },
    [dispatch]
  );

  const getInventoryAdjustmentById = useCallback(
    async payload => {
      return await dispatch(inventoryAdjustmentSliceMethods.getInventoryAdjustmentById(payload));
    },
    [dispatch]
  );

  return {
    inventoryAdjustment,
    inventoryAdjustmentById,
    pagination,
    loading,
    submitLoading,
    approveLoading,
    rejectLoading,
    getInventoryAdjustment,
    resetInventoryAdjustment,
    createInventoryAdjustment,
    updateInventoryAdjustment,
    approveInventoryAdjustment,
    rejectInventoryAdjustment,
    getInventoryAdjustmentById,
  };
};
