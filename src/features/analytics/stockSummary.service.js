import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';

const buildConfig = (params, signal) => ({ params, ...withAbortSignal(signal) });

export const getStockSummary = withErrorHandling(async payload => {
  const { fromDate, toDate, branchId, divisionId, warehouseId, itemId, itemGroupId, stockStatus, search, page, limit, sortBy, pagination, isSplit, signal } = payload;
  const params = new URLSearchParams({ fromDate, toDate });
  if (branchId) params.append('branchId', branchId);
  if (divisionId) params.append('divisionId', divisionId);
  if (warehouseId) params.append('warehouseId', warehouseId);
  if (itemId) params.append('itemId', itemId);
  if (itemGroupId) params.append('itemGroupId', itemGroupId);
  if (stockStatus) params.append('stockStatus', stockStatus);
  if (search) params.append('search', search);
  if (page) params.append('page', page);
  if (limit) params.append('limit', limit);
  if (sortBy) params.append('sortBy', sortBy);
  if (pagination !== undefined && pagination !== null) params.append('pagination', pagination);
  if (isSplit) params.append('isSplit', true);
  const res = await axiosConfig.get(API_ROUTES.ANALYTICS_ROUTES.STOCK.SUMMARY, buildConfig(params, signal));
  return res.data;
}, 'getStockSummary');

export const getDateWiseBreakdown = withErrorHandling(async payload => {
  const { fromDate, toDate, itemId, warehouseId, branchId, divisionId, page, limit, pagination, isSplit, signal } = payload;
  const params = new URLSearchParams({ fromDate, toDate, itemId, warehouseId });
  if (branchId) params.append('branchId', branchId);
  if (divisionId) params.append('divisionId', divisionId);
  if (page) params.append('page', page);
  if (limit) params.append('limit', limit);
  if (pagination !== undefined && pagination !== null) params.append('pagination', pagination);
  if (isSplit) params.append('isSplit', true);
  const res = await axiosConfig.get(API_ROUTES.ANALYTICS_ROUTES.STOCK.DATE_WISE, buildConfig(params, signal));
  return res.data;
}, 'getDateWiseBreakdown');

export const stockSummaryService = {
  getStockSummary,
  getDateWiseBreakdown,
};
