import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getRejectionReasons = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, search = '', parentReasonId = '', isActive, pagination, signal } = payload || {};

  const queryParams = new URLSearchParams({ page, limit });
  if (search) queryParams.append('search', search);
  if (parentReasonId) queryParams.append('parentReasonId', parentReasonId);
  if (typeof isActive !== 'undefined') queryParams.append('isActive', isActive);
  if (typeof pagination !== 'undefined') queryParams.append('pagination', pagination);

  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.REJECTION.REASONS.BASE, config);
  return response.data;
}, 'getRejectionReasons');

const createRejectionReason = async data => {
  const response = await axiosConfig.post(API_ROUTES.REJECTION.REASONS.CREATE, data);
  return response.data;
};

const updateRejectionReason = async (id, data) => {
  const response = await axiosConfig.patch(API_ROUTES.REJECTION.REASONS.UPDATE(id), data);
  return response.data;
};

const getRejectionReasonById = withErrorHandling(async payload => {
  const { _id, signal } = payload;
  const config = { ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.REJECTION.REASONS.GET_BY_ID(_id), config);
  return response.data;
}, 'getRejectionReasonById');

const getRejectionReasonsDrop = withErrorHandling(async payload => {
  const { signal } = payload || {};
  const config = { params: new URLSearchParams({ pagination: false }), ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.REJECTION.REASONS.BASE, config);
  return response.data;
}, 'getRejectionReasonsDrop');

const removeRejectionReason = withErrorHandling(async payload => {
  const { id } = payload;
  const response = await axiosConfig.delete(API_ROUTES.REJECTION.REASONS.DELETE(id));
  return response.data;
}, 'removeRejectionReason');

export const rejectionReasonService = {
  getRejectionReasons,
  getRejectionReasonsDrop,
  createRejectionReason,
  updateRejectionReason,
  getRejectionReasonById,
  removeRejectionReason,
};
