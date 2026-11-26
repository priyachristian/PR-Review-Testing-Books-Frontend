import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchRejectionSummary,
  fetchRejectionTrend,
  fetchRejectionByItem,
  fetchRejectionByRawMaterial,
  fetchRejectionByProcess,
  fetchRejectionByBranch,
  fetchItemRejectionReport,
  resetRejectionAnalytics,
  resetItemRejectionReport,
} from './rejectionAnalytics.slice';

export const useRejectionAnalytics = () => {
  const dispatch = useDispatch();
  const {
    summary,
    summaryLoading,
    trend,
    trendLoading,
    byItem,
    byItemLoading,
    byItemPagination,
    byRawMaterial,
    byRawMaterialLoading,
    byRawMaterialPagination,
    byProcess,
    byProcessLoading,
    byProcessPagination,
    byBranch,
    byBranchLoading,
    byBranchPagination,
    itemRejectionReport,
    itemRejectionReportSummary,
    itemRejectionReportPagination,
    itemRejectionReportLoading,
    error,
  } = useSelector(state => state.rejectionAnalytics);

  const getSummary = useCallback(payload => dispatch(fetchRejectionSummary(payload)), [dispatch]);
  const getTrend = useCallback(payload => dispatch(fetchRejectionTrend(payload)), [dispatch]);
  const getByItem = useCallback(payload => dispatch(fetchRejectionByItem(payload)), [dispatch]);
  const getByRawMaterial = useCallback(payload => dispatch(fetchRejectionByRawMaterial(payload)), [dispatch]);
  const getByProcess = useCallback(payload => dispatch(fetchRejectionByProcess(payload)), [dispatch]);
  const getByBranch = useCallback(payload => dispatch(fetchRejectionByBranch(payload)), [dispatch]);
  const getItemRejectionReport = useCallback(payload => dispatch(fetchItemRejectionReport(payload)), [dispatch]);
  const resetAll = useCallback(() => dispatch(resetRejectionAnalytics()), [dispatch]);
  const resetItemRejectionReportData = useCallback(() => dispatch(resetItemRejectionReport()), [dispatch]);

  return {
    // State
    summary,
    summaryLoading,
    trend,
    trendLoading,
    byItem,
    byItemLoading,
    byItemPagination,
    byRawMaterial,
    byRawMaterialLoading,
    byRawMaterialPagination,
    byProcess,
    byProcessLoading,
    byProcessPagination,
    byBranch,
    byBranchLoading,
    byBranchPagination,
    itemRejectionReport,
    itemRejectionReportSummary,
    itemRejectionReportPagination,
    itemRejectionReportLoading,
    error,
    // Actions
    getSummary,
    getTrend,
    getByItem,
    getByRawMaterial,
    getByProcess,
    getByBranch,
    getItemRejectionReport,
    resetAll,
    resetItemRejectionReportData,
  };
};
