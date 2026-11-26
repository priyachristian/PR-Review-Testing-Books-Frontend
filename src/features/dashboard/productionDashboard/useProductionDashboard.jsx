import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getSummary, getPipeline, getSalesOrderFunnel, getTrend, getTopItems, resetProductionDashboard } from './productionDashboardSlice';

export const useProductionDashboard = () => {
  const dispatch = useDispatch();
  const { summary, summaryLoading, pipeline, pipelineLoading, salesFunnel, salesFunnelLoading, trend, trendLoading, topItems, topItemsLoading } = useSelector(state => state.productionDashboard);

  const fetchSummary = useCallback(payload => dispatch(getSummary(payload)), [dispatch]);
  const fetchPipeline = useCallback(payload => dispatch(getPipeline(payload)), [dispatch]);
  const fetchSalesOrderFunnel = useCallback(payload => dispatch(getSalesOrderFunnel(payload)), [dispatch]);
  const fetchTrend = useCallback(payload => dispatch(getTrend(payload)), [dispatch]);
  const fetchTopItems = useCallback(payload => dispatch(getTopItems(payload)), [dispatch]);
  const reset = useCallback(() => dispatch(resetProductionDashboard()), [dispatch]);

  return {
    summary,
    summaryLoading,
    pipeline,
    pipelineLoading,
    salesFunnel,
    salesFunnelLoading,
    trend,
    trendLoading,
    topItems,
    topItemsLoading,
    fetchSummary,
    fetchPipeline,
    fetchSalesOrderFunnel,
    fetchTrend,
    fetchTopItems,
    reset,
  };
};
