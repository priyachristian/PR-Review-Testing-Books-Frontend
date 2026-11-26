import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';

const buildConfig = (params, signal) => ({ params, ...withAbortSignal(signal) });

const appendPaginationParams = (params, { page, limit, pagination }) => {
  if (pagination === false) {
    params.append('pagination', 'false');
    return;
  }
  if (page != null) params.append('page', page);
  if (limit != null) params.append('limit', limit);
};

export const getMonthlySummary = withErrorHandling(async payload => {
  const { year, branchId, divisionId, signal } = payload;
  const params = new URLSearchParams({ year });
  if (branchId) params.append('branchId', branchId);
  if (divisionId) params.append('divisionId', divisionId);
  const res = await axiosConfig.get(API_ROUTES.ANALYTICS_ROUTES.PRODUCTION.MONTHLY_SUMMARY, buildConfig(params, signal));
  return res.data;
}, 'getMonthlySummary');

export const getMonthlyDetailOrders = withErrorHandling(async payload => {
  const { year, month, branchId, divisionId, page, limit, sortBy, pagination, signal } = payload;
  const params = new URLSearchParams({ year, month });
  if (branchId) params.append('branchId', branchId);
  if (divisionId) params.append('divisionId', divisionId);
  if (sortBy) params.append('sortBy', sortBy);
  appendPaginationParams(params, { page, limit, pagination });
  const res = await axiosConfig.get(API_ROUTES.ANALYTICS_ROUTES.PRODUCTION.MONTHLY_DETAIL_ORDERS, buildConfig(params, signal));
  return res.data;
}, 'getMonthlyDetailOrders');

export const getMonthlyDetailByItem = withErrorHandling(async payload => {
  const { year, month, branchId, divisionId, page, limit, pagination, signal } = payload;
  const params = new URLSearchParams({ year, month });
  if (branchId) params.append('branchId', branchId);
  if (divisionId) params.append('divisionId', divisionId);
  appendPaginationParams(params, { page, limit, pagination });
  const res = await axiosConfig.get(API_ROUTES.ANALYTICS_ROUTES.PRODUCTION.MONTHLY_DETAIL_BY_ITEM, buildConfig(params, signal));
  return res.data;
}, 'getMonthlyDetailByItem');

export const monthlyProductionReportService = {
  getMonthlySummary,
  getMonthlyDetailOrders,
  getMonthlyDetailByItem,
};
