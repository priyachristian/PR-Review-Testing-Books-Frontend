import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getTaxes = withErrorHandling(async payload => {
  const { type, page = 1, limit = DEFAULT_PAGE_SIZE, signal } = payload;
  const queryParams = new URLSearchParams({ type, page, limit });

  const response = await axiosConfig.get(API_ROUTES.TAX.BASE, { params: queryParams, ...withAbortSignal(signal) });
  return response.data;
}, 'getTaxes');

const getTaxSections = withErrorHandling(async payload => {
  const { type, signal } = payload;
  const response = await axiosConfig.get(API_ROUTES.TAX.SECTIONS, { params: { type }, ...withAbortSignal(signal) });
  return response.data;
}, 'getTaxSections');

const getTaxesDropdown = withErrorHandling(async payload => {
  const { type, date, signal } = payload;
  const response = await axiosConfig.get(API_ROUTES.TAX.DROPDOWN, { params: { type, date }, ...withAbortSignal(signal) });
  return response.data;
}, 'getTaxesDropdown');

const createTax = async data => {
  const response = await axiosConfig.post(API_ROUTES.TAX.BASE, data);
  return response.data;
};

const updateTax = async (id, data) => {
  const response = await axiosConfig.put(API_ROUTES.TAX.BY_ID(id), data);
  return response.data;
};

const updateTaxStatus = withErrorHandling(async payload => {
  const { id, isActive } = payload;
  const response = await axiosConfig.put(API_ROUTES.TAX.UPDATE_STATUS(id), {}, { params: { isActive } });
  return response.data;
}, 'updateTaxStatus');

const removeTax = withErrorHandling(async payload => {
  const response = await axiosConfig.delete(API_ROUTES.TAX.BY_ID(payload.id));
  return response.data;
}, 'removeTax');

export const directTaxService = {
  getTaxes,
  getTaxSections,
  getTaxesDropdown,
  createTax,
  updateTax,
  updateTaxStatus,
  removeTax,
};
