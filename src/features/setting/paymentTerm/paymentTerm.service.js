import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getPaymentTerms = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, isActive, pagination, signal } = payload || {};

  const queryParams = new URLSearchParams({ page, limit });
  if (typeof isActive !== 'undefined') queryParams.append('isActive', isActive);
  if (typeof pagination !== 'undefined') queryParams.append('pagination', pagination);

  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.PAYMENT_TERM.BASE, config);
  return response.data;
}, 'getPaymentTerms');

const createPaymentTerm = async data => {
  const response = await axiosConfig.post(API_ROUTES.PAYMENT_TERM.CREATE, data);
  return response.data;
};

const updatePaymentTerm = async (id, data) => {
  const response = await axiosConfig.put(API_ROUTES.PAYMENT_TERM.UPDATE(id), data);
  return response.data;
};

const updatePaymentTermStatus = withErrorHandling(async payload => {
  const { id, isActive } = payload;
  const response = await axiosConfig.put(API_ROUTES.PAYMENT_TERM.UPDATE_STATUS(id), {}, { params: { isActive } });
  return response.data;
}, 'updatePaymentTermStatus');

const setDefaultPaymentTerm = withErrorHandling(async payload => {
  const { id } = payload;
  const response = await axiosConfig.put(API_ROUTES.PAYMENT_TERM.SET_DEFAULT(id));
  return response.data;
}, 'setDefaultPaymentTerm');

const getPaymentTermById = withErrorHandling(async payload => {
  const { _id, signal } = payload;
  const config = { ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.PAYMENT_TERM.GET_BY_ID(_id), config);
  return response.data;
}, 'getPaymentTermById');

const getPaymentTermsDrop = withErrorHandling(async payload => {
  const { signal } = payload || {};
  const config = { ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.PAYMENT_TERM.DROPDOWN, config);
  return response.data;
}, 'getPaymentTermsDrop');

const removePaymentTerm = withErrorHandling(async payload => {
  const { id } = payload;
  const response = await axiosConfig.delete(API_ROUTES.PAYMENT_TERM.DELETE(id));
  return response.data;
}, 'removePaymentTerm');

export const paymentTermService = {
  getPaymentTerms,
  createPaymentTerm,
  updatePaymentTerm,
  updatePaymentTermStatus,
  setDefaultPaymentTerm,
  getPaymentTermById,
  getPaymentTermsDrop,
  removePaymentTerm,
};
