import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getSparePartDropdown = withErrorHandling(async payload => {
  const { signal } = payload || {};
  const config = { ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.MAINTENANCE.SPARE_PART.DROPDOWN, config);
  return response.data;
}, 'getSparePartDropdown');

const getSparePartById = withErrorHandling(async payload => {
  const { sparePartId, signal } = payload || {};
  const response = await axiosConfig.get(API_ROUTES.MAINTENANCE.SPARE_PART.GET(sparePartId), withAbortSignal(signal));
  return response.data;
}, 'getSparePartById');

const createSparePart = withErrorHandling(async sparePartData => {
  const response = await axiosConfig.post(API_ROUTES.MAINTENANCE.SPARE_PART.BASE, sparePartData);
  return response.data;
}, 'createSparePart');

const updateSparePart = withErrorHandling(async ({ sparePartId, sparePartData }) => {
  const response = await axiosConfig.put(API_ROUTES.MAINTENANCE.SPARE_PART.UPDATE(sparePartId), sparePartData);
  return response.data;
}, 'updateSparePart');

const deleteSparePart = withErrorHandling(async sparePartId => {
  const response = await axiosConfig.delete(API_ROUTES.MAINTENANCE.SPARE_PART.DELETE(sparePartId));
  return response.data;
}, 'deleteSparePart');

const updateSparePartStatus = withErrorHandling(async ({ sparePartId, isActive }) => {
  const response = await axiosConfig.put(API_ROUTES.MAINTENANCE.SPARE_PART.UPDATE_STATUS(sparePartId), {}, { params: { isActive } });
  return response.data;
}, 'updateSparePartStatus');

const getSpareParts = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, pagination = true, search = '', sortBy = '', isActive = '', category = '', machineId = '', signal } = payload || {};
  const queryParams = new URLSearchParams({
    page,
    limit,
    pagination,
  });
  if (search) queryParams.append('search', search);
  if (sortBy) queryParams.append('sortBy', sortBy);
  if (isActive !== '' && isActive !== null && isActive !== undefined) queryParams.append('isActive', isActive);
  if (category) queryParams.append('category', category);
  if (machineId) queryParams.append('machineId', machineId);

  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.MAINTENANCE.SPARE_PART.BASE, config);
  return response.data;
}, 'getSpareParts');

export const sparePartService = {
  getSpareParts,
  getSparePartById,
  getSparePartDropdown,
  createSparePart,
  updateSparePart,
  deleteSparePart,
  updateSparePartStatus,
};
