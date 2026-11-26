import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { incentiveSchemeSliceMethods, resetSingleScheme, resetSchemeList, resetUserSchemes, resetUserStatsDetail } from './incentiveScheme.slice';

export const useIncentiveScheme = () => {
  const dispatch = useDispatch();
  const { schemes, userSchemes, teamStats, userStatsDetail, singleScheme, summary, consumption, logs, logsPagination, pagination, loading, submitLoading, error } = useSelector(
    state => state.incentiveScheme
  );

  const getIncentiveSchemes = useCallback(payload => dispatch(incentiveSchemeSliceMethods.getIncentiveSchemes(payload)), [dispatch]);
  const getIncentiveSchemeById = useCallback(payload => dispatch(incentiveSchemeSliceMethods.getIncentiveSchemeById(payload)), [dispatch]);
  const createIncentiveScheme = useCallback(payload => dispatch(incentiveSchemeSliceMethods.createIncentiveScheme(payload)).unwrap(), [dispatch]);
  const updateIncentiveScheme = useCallback(payload => dispatch(incentiveSchemeSliceMethods.updateIncentiveScheme(payload)).unwrap(), [dispatch]);
  const updateIncentiveSchemeStatus = useCallback(payload => dispatch(incentiveSchemeSliceMethods.updateIncentiveSchemeStatus(payload)).unwrap(), [dispatch]);
  const deleteIncentiveScheme = useCallback(payload => dispatch(incentiveSchemeSliceMethods.deleteIncentiveScheme(payload)).unwrap(), [dispatch]);
  const getSchemeConsumption = useCallback(payload => dispatch(incentiveSchemeSliceMethods.getSchemeConsumption(payload)), [dispatch]);
  const getSchemeSummary = useCallback(() => dispatch(incentiveSchemeSliceMethods.getSchemeSummary()), [dispatch]);
  const getIncentiveLogs = useCallback(payload => dispatch(incentiveSchemeSliceMethods.getIncentiveLogs(payload)), [dispatch]);
  const updateLogStatus = useCallback(payload => dispatch(incentiveSchemeSliceMethods.updateLogStatus(payload)).unwrap(), [dispatch]);
  const deleteIncentiveLog = useCallback(payload => dispatch(incentiveSchemeSliceMethods.deleteIncentiveLog(payload)).unwrap(), [dispatch]);
  const bulkSettleLogs = useCallback(payload => dispatch(incentiveSchemeSliceMethods.bulkSettleLogs(payload)).unwrap(), [dispatch]);
  const getUserIncentiveSchemes = useCallback(payload => dispatch(incentiveSchemeSliceMethods.getUserIncentiveSchemes(payload)), [dispatch]);
  const getTeamStats = useCallback(() => dispatch(incentiveSchemeSliceMethods.getTeamStats()), [dispatch]);
  const getUserStatsDetail = useCallback(() => dispatch(incentiveSchemeSliceMethods.getUserStatsDetail()), [dispatch]);
  const resetScheme = useCallback(() => dispatch(resetSingleScheme()), [dispatch]);
  const resetList = useCallback(() => dispatch(resetSchemeList()), [dispatch]);
  const resetUserSchemeDetail = useCallback(() => dispatch(resetUserSchemes()), [dispatch]);
  const resetUserStatsDetailData = useCallback(() => dispatch(resetUserStatsDetail()), [dispatch]);

  return {
    schemes,
    userSchemes,
    teamStats,
    userStatsDetail,
    singleScheme,
    summary,
    consumption,
    logs,
    logsPagination,
    pagination,
    loading,
    submitLoading,
    error,
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
    resetScheme,
    resetList,
    resetUserSchemes: resetUserSchemeDetail,
    resetUserStatsDetail: resetUserStatsDetailData,
  };
};
