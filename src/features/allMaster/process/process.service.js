import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getProcesses = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, pagination = true, search = '', sortBy = '', signal } = payload;
  const queryParams = new URLSearchParams({
    page: page,
    limit: limit,
    pagination: pagination,
  });
  if (search) queryParams.append('search', search);
  if (sortBy) queryParams.append('sortBy', sortBy);

  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.ALL_MASTER.PROCESS.BASE, config);
  return response.data;
}, 'getProcesses');

const addProcess = withErrorHandling(async processData => {
  const response = await axiosConfig.post(API_ROUTES.ALL_MASTER.PROCESS.CREATE, processData);
  return response.data;
}, 'addProcess');

const updateProcess = withErrorHandling(async ({ id, name }) => {
  const response = await axiosConfig.patch(API_ROUTES.ALL_MASTER.PROCESS.UPDATE(id), { name }, {});
  return response.data;
}, 'updateProcess');

const getProcessDropdown = withErrorHandling(async () => {
  const response = await axiosConfig.get(API_ROUTES.ALL_MASTER.PROCESS.DROPDOWN);
  return response.data;
}, 'getProcessDropdown');

const deleteProcess = withErrorHandling(async ({ processId }) => {
  const response = await axiosConfig.delete(API_ROUTES.ALL_MASTER.PROCESS.DELETE(processId));
  return response.data;
}, 'deleteProcess');

export const processService = {
  getProcesses,
  addProcess,
  updateProcess,
  getProcessDropdown,
  deleteProcess,
};
