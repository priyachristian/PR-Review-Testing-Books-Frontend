import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { manPowerConfigSliceMethods, resetWorkerList as resetWorkerListAction } from '@/features/allMaster/manPower/manPower.slice';

export const useManPowerConfig = () => {
  const dispatch = useDispatch();

  const { worker, workerDropdown, createWorkers, update, saveLoading, loading, dropdownLoading, error, pagination } = useSelector(state => state.manPowerConfig);

  const getWorker = useCallback(async payload => await dispatch(manPowerConfigSliceMethods.getWorker(payload)), [dispatch]);

  const getWorkerDropdown = useCallback(async payload => await dispatch(manPowerConfigSliceMethods.getWorkerDropdown(payload)), [dispatch]);

  const createWorker = useCallback(async workerData => await dispatch(manPowerConfigSliceMethods.createWorker(workerData)).unwrap(), [dispatch]);

  const updateWorker = useCallback(async payload => await dispatch(manPowerConfigSliceMethods.updateWorker(payload)).unwrap(), [dispatch]);

  const deleteWorker = useCallback(async payload => await dispatch(manPowerConfigSliceMethods.deleteWorker(payload)).unwrap(), [dispatch]);

  const resetWorkerList = useCallback(() => dispatch(resetWorkerListAction()), [dispatch]);

  return {
    worker,
    workerDropdown,
    createWorkers,
    loading,
    dropdownLoading,
    error,
    getWorker,
    getWorkerDropdown,
    createWorker,
    updateWorker,
    deleteWorker,
    update,
    saveLoading,
    pagination,
    resetWorkerList,
  };
};
