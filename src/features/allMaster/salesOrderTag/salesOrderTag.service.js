import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getSalesOrderTag = withErrorHandling(async payload => {
  const { signal, search = '', appName = '', page = 1, limit = DEFAULT_PAGE_SIZE } = payload;

  const queryParams = new URLSearchParams();
  if (search) queryParams.append('search', search);
  if (appName) queryParams.append('appName', appName);
  if (page) queryParams.append('page', page);
  if (limit) queryParams.append('limit', limit);

  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.ALL_MASTER.SALES_ORDER_TAG.BASE, config);
  return response.data;
}, 'getSalesOrderTag');

const createSalesOrderTag = withErrorHandling(async payload => {
  const response = await axiosConfig.post(API_ROUTES.ALL_MASTER.SALES_ORDER_TAG.CREATE, payload, {});
  return response.data;
}, 'createSalesOrderTag');

const updateSalesOrderTag = withErrorHandling(async payload => {
  const { salesOrderTagId, name, color } = payload;
  const response = await axiosConfig.put(API_ROUTES.ALL_MASTER.SALES_ORDER_TAG.UPDATE(salesOrderTagId), { name, color }, {});
  return response.data;
}, 'updateSalesOrderTag');

const deleteSalesOrderTag = withErrorHandling(async payload => {
  const { salesOrderTagId } = payload;
  const response = await axiosConfig.delete(API_ROUTES.ALL_MASTER.SALES_ORDER_TAG.DELETE(salesOrderTagId), {});
  return response.data;
}, 'deleteSalesOrderTag');

const getSalesOrderTagsDropdown = withErrorHandling(async () => {
  const response = await axiosConfig.get(API_ROUTES.ALL_MASTER.SALES_ORDER_TAG.DROPDOWN, {});
  return response.data;
}, 'getSalesOrderTagsDropdown');

export const salesOrderTagService = {
  getSalesOrderTag,
  createSalesOrderTag,
  updateSalesOrderTag,
  deleteSalesOrderTag,
  getSalesOrderTagsDropdown,
};
