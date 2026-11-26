import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { warehouseSliceMethods, resetWarehouse as resetWarehouseAction, resetWarehouseList as resetWarehouseListAction } from '@/features/allMaster/warehouse/warehouse.slice';

export const useWarehouse = () => {
  const dispatch = useDispatch();

  const { warehouse, singleWarehouse, branchDrop, pagination, loading, submitLoading, deleteLoading, droploading } = useSelector(state => state.warehouse);

  const getWarehouse = useCallback(
    async payload => {
      const response = await dispatch(warehouseSliceMethods.getWarehouse(payload));
      return response;
    },
    [dispatch]
  );

  const toggleWarehouseStatus = useCallback(
    async payload => {
      const response = await dispatch(warehouseSliceMethods.toggleWarehouseStatus(payload));
      return response;
    },
    [dispatch]
  );

  const getBranchDropDown = useCallback(
    async payload => {
      const response = await dispatch(warehouseSliceMethods.getBranchDropDown(payload));
      return response;
    },
    [dispatch]
  );

  const deleteWarehouse = useCallback(
    async payload => {
      const response = await dispatch(warehouseSliceMethods.deleteWarehouse(payload)).unwrap();
      return response;
    },
    [dispatch]
  );

  const updateWarehouse = useCallback(
    async payload => {
      const response = await dispatch(warehouseSliceMethods.updateWarehouse(payload)).unwrap();
      return response;
    },
    [dispatch]
  );

  const createWarehouse = useCallback(
    async warehouseData => {
      const response = await dispatch(warehouseSliceMethods.createWarehouse(warehouseData)).unwrap();
      return response;
    },
    [dispatch]
  );

  const getWarehouseById = useCallback(
    async payload => {
      const response = await dispatch(warehouseSliceMethods.getWarehouseById(payload));
      return response;
    },
    [dispatch]
  );

  const resetWarehouse = useCallback(() => dispatch(resetWarehouseAction()), [dispatch]);
  const resetWarehouseList = useCallback(() => dispatch(resetWarehouseListAction()), [dispatch]);
  return {
    warehouse,
    singleWarehouse,
    branchDrop,
    pagination,
    loading,
    submitLoading,
    deleteLoading,
    droploading,
    getWarehouse,
    getBranchDropDown,
    deleteWarehouse,
    updateWarehouse,
    createWarehouse,
    getWarehouseById,
    toggleWarehouseStatus,
    resetWarehouse,
    resetWarehouseList,
  };
};
