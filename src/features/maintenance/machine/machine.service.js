import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getMachines = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, pagination = true, search = '', sortBy = '', isActive = '', criticality = '', hasAMC = '', signal } = payload || {};
  const queryParams = new URLSearchParams({
    page,
    limit,
    pagination,
  });
  if (search) queryParams.append('search', search);
  if (sortBy) queryParams.append('sortBy', sortBy);
  if (isActive !== '' && isActive !== null && isActive !== undefined) queryParams.append('isActive', isActive);
  if (criticality) queryParams.append('criticality', criticality);
  if (hasAMC !== '' && hasAMC !== null && hasAMC !== undefined) queryParams.append('hasAMC', hasAMC);

  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.MAINTENANCE.MACHINE.BASE, config);
  return response.data;
}, 'getMachines');

const getMachineDropdown = withErrorHandling(async payload => {
  const { signal } = payload || {};
  const config = { ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.MAINTENANCE.MACHINE.DROPDOWN, config);
  return response.data;
}, 'getMachineDropdown');

const getMachineById = withErrorHandling(async payload => {
  const { machineId, signal } = payload || {};
  const response = await axiosConfig.get(API_ROUTES.MAINTENANCE.MACHINE.GET(machineId), withAbortSignal(signal));
  return response.data;
}, 'getMachineById');

const createMachine = withErrorHandling(async machineData => {
  const response = await axiosConfig.post(API_ROUTES.MAINTENANCE.MACHINE.BASE, machineData);
  return response.data;
}, 'createMachine');

const updateMachine = withErrorHandling(async ({ machineId, machineData }) => {
  const response = await axiosConfig.put(API_ROUTES.MAINTENANCE.MACHINE.UPDATE(machineId), machineData);
  return response.data;
}, 'updateMachine');

const deleteMachine = withErrorHandling(async machineId => {
  const response = await axiosConfig.delete(API_ROUTES.MAINTENANCE.MACHINE.DELETE(machineId));
  return response.data;
}, 'deleteMachine');

const updateMachineStatus = withErrorHandling(async ({ machineId, isActive }) => {
  const response = await axiosConfig.put(API_ROUTES.MAINTENANCE.MACHINE.UPDATE_STATUS(machineId), {}, { params: { isActive } });
  return response.data;
}, 'updateMachineStatus');

export const machineService = {
  getMachines,
  getMachineById,
  getMachineDropdown,
  createMachine,
  updateMachine,
  deleteMachine,
  updateMachineStatus,
};
