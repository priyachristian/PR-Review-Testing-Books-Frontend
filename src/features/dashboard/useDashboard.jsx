import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { dashboardSliceMethods, resetDashboardSummary as resetDashboardSummaryAction, resetTop5Record as resetTop5RecordAction } from '@/features/dashboard/dashboard.slice';

export const useDashboard = () => {
  const dispatch = useDispatch();

  const {
    dashboardSummary,
    top5Record,
    loading,
    summaryLoading,
    error,
    creditOverview,
    creditUtilization,
    overLimitCustomers,
    creditOverviewLoading,
    creditUtilizationLoading,
    overLimitCustomersLoading,
    userWiseSummary,
    userWiseSummaryLoading,
  } = useSelector(state => state.dashboard);

  const getDashboardSummary = useCallback(
    async payload => {
      return await dispatch(dashboardSliceMethods.getDashboardSummary(payload));
    },
    [dispatch]
  );

  const resetDashboardSummary = useCallback(() => dispatch(resetDashboardSummaryAction()), [dispatch]);

  const getTop5SalesOrder = useCallback(
    async payload => {
      return await dispatch(dashboardSliceMethods.getTop5SalesOrder(payload));
    },
    [dispatch]
  );

  const getTop5PurchaseOrder = useCallback(
    async payload => {
      return await dispatch(dashboardSliceMethods.getTop5PurchaseOrder(payload));
    },
    [dispatch]
  );

  const getTop5PaymentReceived = useCallback(
    async payload => {
      return await dispatch(dashboardSliceMethods.getTop5PaymentReceived(payload));
    },
    [dispatch]
  );

  const getTop5PaymentMade = useCallback(
    async payload => {
      return await dispatch(dashboardSliceMethods.getTop5PaymentMade(payload));
    },
    [dispatch]
  );

  const getTop5Expense = useCallback(
    async payload => {
      return await dispatch(dashboardSliceMethods.getTop5Expense(payload));
    },
    [dispatch]
  );

  const getCreditOverview = useCallback(
    async payload => {
      return await dispatch(dashboardSliceMethods.getCreditOverview(payload));
    },
    [dispatch]
  );

  const getCreditUtilization = useCallback(
    async payload => {
      return await dispatch(dashboardSliceMethods.getCreditUtilization(payload));
    },
    [dispatch]
  );

  const getOverLimitCustomers = useCallback(
    async payload => {
      return await dispatch(dashboardSliceMethods.getOverLimitCustomers(payload));
    },
    [dispatch]
  );

  const resetTop5Record = useCallback(() => dispatch(resetTop5RecordAction()), [dispatch]);

  const getUserWiseSummary = useCallback(async payload => dispatch(dashboardSliceMethods.getUserWiseSummary(payload)), [dispatch]);

  return {
    dashboardSummary,
    top5Record,
    loading,
    summaryLoading,
    error,
    getDashboardSummary,
    resetDashboardSummary,
    getTop5SalesOrder,
    getTop5PurchaseOrder,
    getTop5PaymentReceived,
    getTop5PaymentMade,
    getTop5Expense,
    resetTop5Record,
    creditOverview,
    creditUtilization,
    overLimitCustomers,
    creditOverviewLoading,
    creditUtilizationLoading,
    overLimitCustomersLoading,
    getCreditOverview,
    getCreditUtilization,
    getOverLimitCustomers,
    userWiseSummary,
    userWiseSummaryLoading,
    getUserWiseSummary,
  };
};
