import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getDivision = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, search = '', sortBy = '', status = null, signal } = payload;
  const queryParams = new URLSearchParams({
    page: page,
    limit: limit,
  });
  if (search) queryParams.append('search', search);
  if (sortBy) queryParams.append('sortBy', sortBy);
  if (status) {
    queryParams.append('status', status);
  }

  const response = await axiosConfig.get(API_ROUTES.ALL_MASTER.DIVISION.BASE, {
    params: queryParams,
    signal: signal,
  });
  return response.data;
}, 'getDivision');

const deleteDivision = withErrorHandling(async id => {
  const response = await axiosConfig.delete(API_ROUTES.ALL_MASTER.DIVISION.DELETE(id));
  return response.data;
}, 'deleteDivision');

const createDivision = withErrorHandling(async divisionData => {
  const response = await axiosConfig.post(API_ROUTES.ALL_MASTER.DIVISION.CREATE, divisionData);
  return response.data;
}, 'createDivision');

const updateDivision = withErrorHandling(async ({ divisionId, divisionData }) => {
  const response = await axiosConfig.put(API_ROUTES.ALL_MASTER.DIVISION.UPDATE(divisionId), divisionData);
  return response.data;
}, 'updateDivision');

const getDivisionById = withErrorHandling(async payload => {
  const { divisionId, signal } = payload;

  let config = { ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.ALL_MASTER.DIVISION.UPDATE(divisionId), {
    ...config,
  });
  return response.data;
}, 'getDivisionById');

const toggleDivisionStatus = withErrorHandling(async payload => {
  const { divisionId, isActive } = payload;
  const params = { isActive };
  const response = await axiosConfig.put(API_ROUTES.ALL_MASTER.DIVISION.TOGGLE_DIVISION_STATUS(divisionId), {}, { params });
  return response.data;
}, 'toggleDivisionStatus');

export const divisionService = {
  getDivision,
  deleteDivision,
  createDivision,
  updateDivision,
  getDivisionById,
  toggleDivisionStatus,
};
