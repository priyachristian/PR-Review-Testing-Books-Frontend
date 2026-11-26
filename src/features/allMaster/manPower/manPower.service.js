import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getWorker = withErrorHandling(async payload => {
  const { signal, sortBy = '', search = '', page = 1, limit = DEFAULT_PAGE_SIZE } = payload;
  const queryParams = new URLSearchParams();
  if (sortBy) queryParams.append('sortBy', sortBy);
  if (search) queryParams.append('search', search);
  if (page) queryParams.append('page', page);
  if (limit) queryParams.append('limit', limit);
  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.ALL_MASTER.MANPOWER_CONFIG.BASE, config);
  return response.data;
}, 'getWorker');

const getWorkerDropdown = withErrorHandling(async payload => {
  const { signal } = payload;
  const config = { ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.ALL_MASTER.MANPOWER_CONFIG.GET_WORKER_DROPDOWN, config);
  return response.data;
}, 'getWorkerDropdown');

const createWorker = withErrorHandling(async payload => {
  const response = await axiosConfig.post(API_ROUTES.ALL_MASTER.MANPOWER_CONFIG.CREATE, payload, {});
  return response.data;
}, 'createWorker');

const updateWorker = withErrorHandling(async payload => {
  const { id, workerData } = payload;
  const { ...body } = workerData;
  const response = await axiosConfig.put(API_ROUTES.ALL_MASTER.MANPOWER_CONFIG.UPDATE(id), body, {});
  return response.data;
}, 'updateWorker');

const deleteWorker = withErrorHandling(async ({ workerId }) => {
  const response = await axiosConfig.delete(API_ROUTES.ALL_MASTER.MANPOWER_CONFIG.DELETE(workerId));
  return response.data;
}, 'deleteWorker');

export const manPowerConfigService = {
  getWorker,
  getWorkerDropdown,
  createWorker,
  updateWorker,
  deleteWorker,
};
