import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { machineSliceMethods, resetMachine as resetMachineAction, resetMachineDropdown as resetMachineDropdownAction, resetMachineDetail as resetMachineDetailAction } from './machine.slice';

export const useMachine = () => {
  const dispatch = useDispatch();
  const { machines, machine, machineDropdown, loading, detailLoading, dropdownLoading, submitLoading, deleteLoading, error, pagination } = useSelector(state => state.machine);

  const getMachines = useCallback(
    async payload => {
      const response = await dispatch(machineSliceMethods.getMachines(payload));
      return response;
    },
    [dispatch]
  );

  const getMachineById = useCallback(
    async payload => {
      const response = await dispatch(machineSliceMethods.getMachineById(payload));
      return response;
    },
    [dispatch]
  );

  const getMachineDropdown = useCallback(
    async payload => {
      const response = await dispatch(machineSliceMethods.getMachineDropdown(payload));
      return response;
    },
    [dispatch]
  );

  const createMachine = useCallback(
    async payload => {
      return await dispatch(machineSliceMethods.createMachine(payload)).unwrap();
    },
    [dispatch]
  );

  const updateMachine = useCallback(
    async payload => {
      return await dispatch(machineSliceMethods.updateMachine(payload)).unwrap();
    },
    [dispatch]
  );

  const deleteMachine = useCallback(
    async machineId => {
      return await dispatch(machineSliceMethods.deleteMachine(machineId)).unwrap();
    },
    [dispatch]
  );

  const updateMachineStatus = useCallback(
    async payload => {
      return await dispatch(machineSliceMethods.updateMachineStatus(payload)).unwrap();
    },
    [dispatch]
  );

  const resetMachine = useCallback(() => dispatch(resetMachineAction()), [dispatch]);

  const resetMachineDropdown = useCallback(() => dispatch(resetMachineDropdownAction()), [dispatch]);

  const resetMachineDetail = useCallback(() => dispatch(resetMachineDetailAction()), [dispatch]);

  return {
    machines,
    machine,
    machineDropdown,
    loading,
    detailLoading,
    dropdownLoading,
    submitLoading,
    deleteLoading,
    error,
    pagination,
    getMachines,
    getMachineById,
    getMachineDropdown,
    createMachine,
    updateMachine,
    deleteMachine,
    updateMachineStatus,
    resetMachine,
    resetMachineDropdown,
    resetMachineDetail,
  };
};
