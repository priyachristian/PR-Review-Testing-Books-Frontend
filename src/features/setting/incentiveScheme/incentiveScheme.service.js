import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';

const getIncentiveSchemes = withErrorHandling(async payload => {
  const { page = 1, limit = 20, status, userId, search, signal } = payload || {};
  const params = new URLSearchParams({ page, limit });
  if (status) params.append('status', status);
  if (userId) params.append('userId', userId);
  if (search) params.append('search', search);
  const config = { params, ...withAbortSignal(signal) };
  const res = await axiosConfig.get(API_ROUTES.INCENTIVE_SCHEME.BASE, config);
  return res.data;
}, 'getIncentiveSchemes');

const getIncentiveSchemeById = withErrorHandling(async ({ schemeId, signal }) => {
  const config = { ...withAbortSignal(signal) };
  const res = await axiosConfig.get(API_ROUTES.INCENTIVE_SCHEME.GET_BY_ID(schemeId), config);
  return res.data;
}, 'getIncentiveSchemeById');

const createIncentiveScheme = withErrorHandling(async data => {
  const res = await axiosConfig.post(API_ROUTES.INCENTIVE_SCHEME.CREATE, data);
  return res.data;
}, 'createIncentiveScheme');

const updateIncentiveScheme = withErrorHandling(async ({ schemeId, data }) => {
  const res = await axiosConfig.patch(API_ROUTES.INCENTIVE_SCHEME.UPDATE(schemeId), data);
  return res.data;
}, 'updateIncentiveScheme');

const updateIncentiveSchemeStatus = withErrorHandling(async ({ schemeId, status }) => {
  const res = await axiosConfig.patch(API_ROUTES.INCENTIVE_SCHEME.UPDATE_STATUS(schemeId), { status });
  return res.data;
}, 'updateIncentiveSchemeStatus');

const deleteIncentiveScheme = withErrorHandling(async ({ schemeId }) => {
  const res = await axiosConfig.delete(API_ROUTES.INCENTIVE_SCHEME.DELETE(schemeId));
  return res.data;
}, 'deleteIncentiveScheme');

const getSchemeConsumption = withErrorHandling(async ({ schemeId }) => {
  const res = await axiosConfig.get(API_ROUTES.INCENTIVE_SCHEME.CONSUMPTION(schemeId));
  return res.data;
}, 'getSchemeConsumption');

const getSchemeSummary = withErrorHandling(async () => {
  const res = await axiosConfig.get(API_ROUTES.INCENTIVE_SCHEME.SUMMARY);
  return res.data;
}, 'getSchemeSummary');

const getIncentiveLogs = withErrorHandling(async payload => {
  const { schemeId, userId, docType, status, page = 1, limit = 20, signal } = payload || {};
  const params = new URLSearchParams({ page, limit });
  if (schemeId) params.append('schemeId', schemeId);
  if (userId) params.append('userId', userId);
  if (docType) params.append('docType', docType);
  if (status) params.append('status', status);
  const config = { params, ...withAbortSignal(signal) };
  const res = await axiosConfig.get(API_ROUTES.INCENTIVE_SCHEME.LOGS, config);
  return res.data;
}, 'getIncentiveLogs');

const updateLogStatus = withErrorHandling(async ({ logId, status }) => {
  const res = await axiosConfig.patch(API_ROUTES.INCENTIVE_SCHEME.UPDATE_LOG(logId), { status });
  return res.data;
}, 'updateLogStatus');

const deleteIncentiveLog = withErrorHandling(async ({ logId }) => {
  const res = await axiosConfig.delete(API_ROUTES.INCENTIVE_SCHEME.UPDATE_LOG(logId));
  return res.data;
}, 'deleteIncentiveLog');

const bulkSettleLogs = withErrorHandling(async ({ schemeId, userId }) => {
  const res = await axiosConfig.post(API_ROUTES.INCENTIVE_SCHEME.BULK_SETTLE, { schemeId, userId });
  return res.data;
}, 'bulkSettleLogs');

const getUserIncentiveSchemes = withErrorHandling(async ({ userId, signal }) => {
  const config = { ...withAbortSignal(signal) };
  const res = await axiosConfig.get(API_ROUTES.INCENTIVE_SCHEME.BY_USER(userId), config);
  return res.data;
}, 'getUserIncentiveSchemes');

const getTeamStats = withErrorHandling(async () => {
  const res = await axiosConfig.get(API_ROUTES.INCENTIVE_SCHEME.TEAM_STATS);
  return res.data;
}, 'getTeamStats');

const getUserStatsDetail = withErrorHandling(async () => {
  const res = await axiosConfig.get(API_ROUTES.INCENTIVE_SCHEME.USER_STATS_DETAIL);
  return res.data;
}, 'getUserStatsDetail');

export const incentiveSchemeService = {
  getIncentiveSchemes,
  getIncentiveSchemeById,
  createIncentiveScheme,
  updateIncentiveScheme,
  updateIncentiveSchemeStatus,
  deleteIncentiveScheme,
  getSchemeConsumption,
  getSchemeSummary,
  getIncentiveLogs,
  updateLogStatus,
  deleteIncentiveLog,
  bulkSettleLogs,
  getUserIncentiveSchemes,
  getTeamStats,
  getUserStatsDetail,
};
