import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';

const buildBaseParams = payload => {
  const { startDate, endDate, branchId, divisionId, itemId, productionManageMethod, page, limit } = payload;
  const params = new URLSearchParams();
  if (startDate && endDate) {
    params.append('startDate', startDate);
    params.append('endDate', endDate);
  }
  if (branchId) params.append('branchId', branchId);
  if (divisionId) params.append('divisionId', divisionId);
  if (itemId) params.append('itemId', itemId);
  if (productionManageMethod) params.append('productionManageMethod', productionManageMethod);
  if (page) params.append('page', page);
  if (limit) params.append('limit', limit);
  return params;
};

const buildTrendParams = payload => {
  const params = buildBaseParams(payload);
  if (payload.groupBy) params.append('groupBy', payload.groupBy);
  return params;
};

const buildConfig = (params, signal) => {
  const config = { params, ...withAbortSignal(signal) };
  return config;
};

export const getRejectionSummary = withErrorHandling(async payload => {
  const res = await axiosConfig.get(API_ROUTES.ANALYTICS_ROUTES.REJECTION.SUMMARY, buildConfig(buildBaseParams(payload), payload.signal));
  return res.data;
}, 'getRejectionSummary');

export const getRejectionTrend = withErrorHandling(async payload => {
  const res = await axiosConfig.get(API_ROUTES.ANALYTICS_ROUTES.REJECTION.TREND, buildConfig(buildTrendParams(payload), payload.signal));
  return res.data;
}, 'getRejectionTrend');

export const getRejectionByItem = withErrorHandling(async payload => {
  const res = await axiosConfig.get(API_ROUTES.ANALYTICS_ROUTES.REJECTION.BY_ITEM, buildConfig(buildBaseParams(payload), payload.signal));
  return res.data;
}, 'getRejectionByItem');

export const getRejectionByRawMaterial = withErrorHandling(async payload => {
  const res = await axiosConfig.get(API_ROUTES.ANALYTICS_ROUTES.REJECTION.BY_RAW_MATERIAL, buildConfig(buildBaseParams(payload), payload.signal));
  return res.data;
}, 'getRejectionByRawMaterial');

export const getRejectionByProcess = withErrorHandling(async payload => {
  const res = await axiosConfig.get(API_ROUTES.ANALYTICS_ROUTES.REJECTION.BY_PROCESS, buildConfig(buildBaseParams(payload), payload.signal));
  return res.data;
}, 'getRejectionByProcess');

export const getRejectionByBranch = withErrorHandling(async payload => {
  const res = await axiosConfig.get(API_ROUTES.ANALYTICS_ROUTES.REJECTION.BY_BRANCH, buildConfig(buildBaseParams(payload), payload.signal));
  return res.data;
}, 'getRejectionByBranch');

export const getItemRejectionReport = withErrorHandling(async payload => {
  const { startDate, endDate, itemId, itemType, page, limit, pagination, signal } = payload;
  const params = new URLSearchParams();

  if (startDate && endDate) {
    params.append('startDate', startDate);
    params.append('endDate', endDate);
  }
  if (itemId) params.append('itemId', itemId);
  if (itemType) params.append('itemType', itemType);

  if (pagination === false) {
    params.append('pagination', 'false');
  } else {
    if (page) params.append('page', page);
    if (limit) params.append('limit', limit);
  }

  const res = await axiosConfig.get(API_ROUTES.ANALYTICS_ROUTES.REJECTION.ITEM_REJECTION_REPORT, buildConfig(params, signal));
  return res.data;
}, 'getItemRejectionReport');

export const rejectionAnalyticsService = {
  getRejectionSummary,
  getRejectionTrend,
  getRejectionByItem,
  getRejectionByRawMaterial,
  getRejectionByProcess,
  getRejectionByBranch,
  getItemRejectionReport,
};
