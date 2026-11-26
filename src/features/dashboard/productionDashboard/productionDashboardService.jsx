import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling } from '@/utils/serviceHelper';

const buildParams = filter => {
  const { startDate, endDate, division, branch, groupBy, limit } = filter ?? {};
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (division) params.append('divisionId', division);
  if (branch) params.append('branchId', branch);
  if (groupBy) params.append('groupBy', groupBy);
  if (limit) params.append('limit', limit);
  return params;
};

const getSummary = withErrorHandling(async payload => {
  const response = await axiosConfig.get(API_ROUTES.PRODUCTION_DASHBOARD.SUMMARY, { params: buildParams(payload) });
  return response.data;
}, 'getProductionDashboardSummary');

const getPipeline = withErrorHandling(async payload => {
  const response = await axiosConfig.get(API_ROUTES.PRODUCTION_DASHBOARD.PIPELINE, { params: buildParams(payload) });
  return response.data;
}, 'getProductionDashboardPipeline');

const getSalesOrderFunnel = withErrorHandling(async payload => {
  const response = await axiosConfig.get(API_ROUTES.PRODUCTION_DASHBOARD.SALES_FUNNEL, { params: buildParams(payload) });
  return response.data;
}, 'getProductionDashboardSalesFunnel');

const getTrend = withErrorHandling(async payload => {
  const response = await axiosConfig.get(API_ROUTES.PRODUCTION_DASHBOARD.TREND, { params: buildParams(payload) });
  return response.data;
}, 'getProductionDashboardTrend');

const getTopItems = withErrorHandling(async payload => {
  const response = await axiosConfig.get(API_ROUTES.PRODUCTION_DASHBOARD.TOP_ITEMS, { params: buildParams(payload) });
  return response.data;
}, 'getProductionDashboardTopItems');

export const productionDashboardService = { getSummary, getPipeline, getSalesOrderFunnel, getTrend, getTopItems };
