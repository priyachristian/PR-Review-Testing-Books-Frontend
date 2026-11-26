import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMonthlySummary, fetchMonthlyDetailOrders, fetchMonthlyDetailByItem, resetMonthlyProductionReport, resetDetailOrders, resetDetailByItem } from './monthlyProductionReport.slice';

export const useMonthlyProductionReport = () => {
  const dispatch = useDispatch();
  const { summary, summaryLoading, detailOrders, detailOrdersKpis, detailOrdersPagination, detailOrdersLoading, detailByItem, detailByItemPagination, detailByItemLoading, error } = useSelector(
    state => state.monthlyProductionReport
  );

  const getSummary = useCallback(payload => dispatch(fetchMonthlySummary(payload)), [dispatch]);
  const getDetailOrders = useCallback(payload => dispatch(fetchMonthlyDetailOrders(payload)), [dispatch]);
  const getDetailByItem = useCallback(payload => dispatch(fetchMonthlyDetailByItem(payload)), [dispatch]);
  const resetAll = useCallback(() => dispatch(resetMonthlyProductionReport()), [dispatch]);
  const resetOrders = useCallback(() => dispatch(resetDetailOrders()), [dispatch]);
  const resetByItem = useCallback(() => dispatch(resetDetailByItem()), [dispatch]);

  return {
    summary,
    summaryLoading,
    detailOrders,
    detailOrdersKpis,
    detailOrdersPagination,
    detailOrdersLoading,
    detailByItem,
    detailByItemPagination,
    detailByItemLoading,
    error,
    getSummary,
    getDetailOrders,
    getDetailByItem,
    resetAll,
    resetOrders,
    resetByItem,
  };
};
