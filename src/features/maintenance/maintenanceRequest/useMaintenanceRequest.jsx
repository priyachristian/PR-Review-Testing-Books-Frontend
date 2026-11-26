import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  maintenanceRequestSliceMethods,
  resetMaintenanceRequest as resetMaintenanceRequestAction,
  resetMaintenanceRequestDetail as resetMaintenanceRequestDetailAction,
  resetMaintenanceRequestDropdown as resetMaintenanceRequestDropdownAction,
} from './maintenanceRequest.slice';

export const useMaintenanceRequest = () => {
  const dispatch = useDispatch();
  const {
    maintenanceRequests,
    maintenanceRequest,
    maintenanceRequestDropdown,
    loading,
    detailLoading,
    dropdownLoading,
    submitLoading,
    approveLoading,
    rejectLoading,
    assignLoading,
    startWorkLoading,
    completeLoading,
    closeLoading,
    requestPartLoading,
    error,
    pagination,
  } = useSelector(state => state.maintenanceRequest);

  const getMaintenanceRequests = useCallback(
    async payload => {
      const response = await dispatch(maintenanceRequestSliceMethods.getMaintenanceRequests(payload));
      return response;
    },
    [dispatch]
  );

  const getMaintenanceRequestById = useCallback(
    async payload => {
      const response = await dispatch(maintenanceRequestSliceMethods.getMaintenanceRequestById(payload));
      return response;
    },
    [dispatch]
  );

  const createMaintenanceRequest = useCallback(
    async payload => {
      return await dispatch(maintenanceRequestSliceMethods.createMaintenanceRequest(payload)).unwrap();
    },
    [dispatch]
  );

  const approveMaintenanceRequest = useCallback(
    async payload => {
      return await dispatch(maintenanceRequestSliceMethods.approveMaintenanceRequest(payload)).unwrap();
    },
    [dispatch]
  );

  const rejectMaintenanceRequest = useCallback(
    async payload => {
      return await dispatch(maintenanceRequestSliceMethods.rejectMaintenanceRequest(payload)).unwrap();
    },
    [dispatch]
  );

  const assignMaintenanceRequest = useCallback(
    async payload => {
      return await dispatch(maintenanceRequestSliceMethods.assignMaintenanceRequest(payload)).unwrap();
    },
    [dispatch]
  );

  const startMaintenanceRequestWork = useCallback(
    async payload => {
      return await dispatch(maintenanceRequestSliceMethods.startMaintenanceRequestWork(payload)).unwrap();
    },
    [dispatch]
  );

  const completeMaintenanceRequest = useCallback(
    async payload => {
      return await dispatch(maintenanceRequestSliceMethods.completeMaintenanceRequest(payload)).unwrap();
    },
    [dispatch]
  );

  const closeMaintenanceRequest = useCallback(
    async payload => {
      return await dispatch(maintenanceRequestSliceMethods.closeMaintenanceRequest(payload)).unwrap();
    },
    [dispatch]
  );

  const requestMaintenanceRequestPart = useCallback(
    async payload => {
      return await dispatch(maintenanceRequestSliceMethods.requestMaintenanceRequestPart(payload)).unwrap();
    },
    [dispatch]
  );

  const getMaintenanceRequestDropdown = useCallback(
    async payload => {
      const response = await dispatch(maintenanceRequestSliceMethods.getMaintenanceRequestDropdown(payload));
      return response;
    },
    [dispatch]
  );

  const resetMaintenanceRequest = useCallback(() => dispatch(resetMaintenanceRequestAction()), [dispatch]);

  const resetMaintenanceRequestDetail = useCallback(() => dispatch(resetMaintenanceRequestDetailAction()), [dispatch]);

  const resetMaintenanceRequestDropdown = useCallback(() => dispatch(resetMaintenanceRequestDropdownAction()), [dispatch]);

  return {
    maintenanceRequests,
    maintenanceRequest,
    maintenanceRequestDropdown,
    loading,
    detailLoading,
    dropdownLoading,
    submitLoading,
    approveLoading,
    rejectLoading,
    assignLoading,
    startWorkLoading,
    completeLoading,
    closeLoading,
    requestPartLoading,
    error,
    pagination,
    getMaintenanceRequests,
    getMaintenanceRequestById,
    createMaintenanceRequest,
    approveMaintenanceRequest,
    rejectMaintenanceRequest,
    assignMaintenanceRequest,
    startMaintenanceRequestWork,
    completeMaintenanceRequest,
    closeMaintenanceRequest,
    requestMaintenanceRequestPart,
    getMaintenanceRequestDropdown,
    resetMaintenanceRequest,
    resetMaintenanceRequestDetail,
    resetMaintenanceRequestDropdown,
  };
};
