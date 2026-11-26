import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  maintenancePurchaseSliceMethods,
  resetMaintenancePurchase as resetMaintenancePurchaseAction,
  resetMaintenancePurchaseDetail as resetMaintenancePurchaseDetailAction,
  resetMaintenancePurchaseDropdown as resetMaintenancePurchaseDropdownAction,
} from './maintenancePurchase.slice';

export const useMaintenancePurchase = () => {
  const dispatch = useDispatch();
  const {
    maintenancePurchases,
    maintenancePurchase,
    maintenancePurchaseDropdown,
    loading,
    detailLoading,
    dropdownLoading,
    submitLoading,
    approveLoading,
    raisePoLoading,
    receiveLoading,
    error,
    pagination,
  } = useSelector(state => state.maintenancePurchase);

  const getMaintenancePurchases = useCallback(
    async payload => {
      const response = await dispatch(maintenancePurchaseSliceMethods.getMaintenancePurchases(payload));
      return response;
    },
    [dispatch]
  );

  const getMaintenancePurchaseById = useCallback(
    async payload => {
      const response = await dispatch(maintenancePurchaseSliceMethods.getMaintenancePurchaseById(payload));
      return response;
    },
    [dispatch]
  );

  const createMaintenancePurchase = useCallback(
    async payload => {
      return await dispatch(maintenancePurchaseSliceMethods.createMaintenancePurchase(payload)).unwrap();
    },
    [dispatch]
  );

  const approveMaintenancePurchase = useCallback(
    async payload => {
      return await dispatch(maintenancePurchaseSliceMethods.approveMaintenancePurchase(payload)).unwrap();
    },
    [dispatch]
  );

  const raiseMaintenancePurchasePo = useCallback(
    async payload => {
      return await dispatch(maintenancePurchaseSliceMethods.raiseMaintenancePurchasePo(payload)).unwrap();
    },
    [dispatch]
  );

  const receiveMaintenancePurchase = useCallback(
    async payload => {
      return await dispatch(maintenancePurchaseSliceMethods.receiveMaintenancePurchase(payload)).unwrap();
    },
    [dispatch]
  );

  const getMaintenancePurchaseDropdown = useCallback(
    async payload => {
      const response = await dispatch(maintenancePurchaseSliceMethods.getMaintenancePurchaseDropdown(payload));
      return response;
    },
    [dispatch]
  );

  const resetMaintenancePurchase = useCallback(() => dispatch(resetMaintenancePurchaseAction()), [dispatch]);

  const resetMaintenancePurchaseDetail = useCallback(() => dispatch(resetMaintenancePurchaseDetailAction()), [dispatch]);

  const resetMaintenancePurchaseDropdown = useCallback(() => dispatch(resetMaintenancePurchaseDropdownAction()), [dispatch]);

  return {
    maintenancePurchases,
    maintenancePurchase,
    maintenancePurchaseDropdown,
    loading,
    detailLoading,
    dropdownLoading,
    submitLoading,
    approveLoading,
    raisePoLoading,
    receiveLoading,
    error,
    pagination,
    getMaintenancePurchases,
    getMaintenancePurchaseById,
    createMaintenancePurchase,
    approveMaintenancePurchase,
    raiseMaintenancePurchasePo,
    receiveMaintenancePurchase,
    getMaintenancePurchaseDropdown,
    resetMaintenancePurchase,
    resetMaintenancePurchaseDetail,
    resetMaintenancePurchaseDropdown,
  };
};
