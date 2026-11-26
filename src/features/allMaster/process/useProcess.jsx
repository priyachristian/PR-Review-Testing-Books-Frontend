import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { processSliceMethods, resetProcess as resetProcessAction, resetProcessDrop as resetProcessDropAction } from '@/features/allMaster/process/process.slice';

export const useProcess = () => {
  const dispatch = useDispatch();

  const { processes, loading, submitLoading, processDrop, error, pagination } = useSelector(state => state.process);

  const getProcesses = useCallback(
    async payload => {
      const response = await dispatch(processSliceMethods.getProcesses(payload));
      return response;
    },
    [dispatch]
  );

  const addProcess = useCallback(
    async values => {
      const response = await dispatch(processSliceMethods.addProcess(values));
      return response;
    },
    [dispatch]
  );

  const updateProcess = useCallback(
    async processData => {
      const response = await dispatch(processSliceMethods.updateProcess(processData));
      return response;
    },
    [dispatch]
  );

  const deleteProcess = useCallback(
    async payload => {
      return await dispatch(processSliceMethods.deleteProcess(payload)).unwrap();
    },
    [dispatch]
  );

  const resetProcess = useCallback(() => dispatch(resetProcessAction()), [dispatch]);

  const getProcessDropdown = useCallback(
    async payload => {
      const response = await dispatch(processSliceMethods.getProcessDropdown(payload));
      return response;
    },
    [dispatch]
  );

  const resetProcessDrop = useCallback(() => dispatch(resetProcessDropAction()), [dispatch]);

  return {
    processes,
    loading,
    submitLoading,
    processDrop,
    error,
    pagination,
    getProcesses,
    addProcess,
    updateProcess,
    deleteProcess,
    resetProcess,
    getProcessDropdown,
    resetProcessDrop,
  };
};
