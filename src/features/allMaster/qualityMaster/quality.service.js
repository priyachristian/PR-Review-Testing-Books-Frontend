import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getQuality = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, search = '', sortBy = '', signal } = payload;
  const queryParams = new URLSearchParams({
    page: page,
    limit: limit,
  });
  if (search) queryParams.append('search', search);
  if (sortBy) queryParams.append('sortBy', sortBy);

  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.ALL_MASTER.QUALITY.BASE, config);
  return response.data;
}, 'getQuality');

const createQuality = withErrorHandling(async qualityData => {
  const response = await axiosConfig.post(API_ROUTES.ALL_MASTER.QUALITY.CREATE, qualityData, {});
  return response.data;
}, 'createQuality');

const updateQuality = withErrorHandling(async ({ qualityId, qualityData }) => {
  const response = await axiosConfig.put(API_ROUTES.ALL_MASTER.QUALITY.UPDATE(qualityId), qualityData, {});
  return response.data;
}, 'updateQuality');

const getQualityById = withErrorHandling(async payload => {
  const { qualityId, signal } = payload;

  let config = { ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.ALL_MASTER.QUALITY.GET_QUALITY_BY_ID(qualityId), {
    ...config,
  });
  return response.data;
}, 'getQualityById');

const deleteQuality = withErrorHandling(async ({ qualityId }) => {
  const response = await axiosConfig.delete(API_ROUTES.ALL_MASTER.QUALITY.DELETE(qualityId));
  return response.data;
}, 'deleteQuality');

export const qualityService = { getQuality, createQuality, updateQuality, getQualityById, deleteQuality };
