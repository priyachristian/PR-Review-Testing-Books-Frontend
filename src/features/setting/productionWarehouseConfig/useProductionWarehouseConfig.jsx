import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  clearSelectedProductionWarehouseConfig as clearSelectedAction,
  productionWarehouseConfigSliceMethods,
  resetProductionWarehouseConfigs as resetConfigsAction,
} from './productionWarehouseConfig.slice';

export const useProductionWarehouseConfig = () => {
  const dispatch = useDispatch();
  const { configs, dropdownConfigs, dropdownLoading, selectedConfig, loading, detailLoading, submitLoading, statusLoading, deleteLoading, error } = useSelector(
    state => state.productionWarehouseConfig
  );

  const getProductionWarehouseConfigs = useCallback(payload => dispatch(productionWarehouseConfigSliceMethods.getProductionWarehouseConfigs(payload)), [dispatch]);
  const getProductionWarehouseConfigDropdown = useCallback(payload => dispatch(productionWarehouseConfigSliceMethods.getProductionWarehouseConfigDropdown(payload)), [dispatch]);
  const getProductionWarehouseConfigById = useCallback(payload => dispatch(productionWarehouseConfigSliceMethods.getProductionWarehouseConfigById(payload)), [dispatch]);
  const createProductionWarehouseConfig = useCallback(payload => dispatch(productionWarehouseConfigSliceMethods.createProductionWarehouseConfig(payload)).unwrap(), [dispatch]);
  const updateProductionWarehouseConfig = useCallback(payload => dispatch(productionWarehouseConfigSliceMethods.updateProductionWarehouseConfig(payload)).unwrap(), [dispatch]);
  const updateProductionWarehouseConfigStatus = useCallback(payload => dispatch(productionWarehouseConfigSliceMethods.updateProductionWarehouseConfigStatus(payload)).unwrap(), [dispatch]);
  const deleteProductionWarehouseConfig = useCallback(payload => dispatch(productionWarehouseConfigSliceMethods.deleteProductionWarehouseConfig(payload)).unwrap(), [dispatch]);
  const resetProductionWarehouseConfigs = useCallback(() => dispatch(resetConfigsAction()), [dispatch]);
  const clearSelectedProductionWarehouseConfig = useCallback(() => dispatch(clearSelectedAction()), [dispatch]);

  return {
    configs,
    dropdownConfigs,
    dropdownLoading,
    selectedConfig,
    loading,
    detailLoading,
    submitLoading,
    statusLoading,
    deleteLoading,
    error,
    getProductionWarehouseConfigs,
    getProductionWarehouseConfigDropdown,
    getProductionWarehouseConfigById,
    createProductionWarehouseConfig,
    updateProductionWarehouseConfig,
    updateProductionWarehouseConfigStatus,
    deleteProductionWarehouseConfig,
    resetProductionWarehouseConfigs,
    clearSelectedProductionWarehouseConfig,
  };
};
