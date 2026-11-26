import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchStockSummary, fetchDateWiseBreakdown, resetStockSummary, resetDateWise } from './stockSummary.slice';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const defaultPagination = { page: 1, limit: DEFAULT_PAGE_SIZE, totalPages: 1, totalResults: 0 };

export const useStockSummary = () => {
  const dispatch = useDispatch();
  const {
    summaryRows = [],
    kpis = null,
    pagination = defaultPagination,
    loading = false,
    dateWiseRows = [],
    dateWiseOpeningQty = 0,
    dateWisePagination = defaultPagination,
    dateWiseLoading = false,
    error = null,
  } = useSelector(state => state.stockSummary) || {};

  const getSummary = useCallback(payload => dispatch(fetchStockSummary(payload)), [dispatch]);
  const getDateWise = useCallback(payload => dispatch(fetchDateWiseBreakdown(payload)), [dispatch]);
  const resetAll = useCallback(() => dispatch(resetStockSummary()), [dispatch]);
  const resetDateWiseData = useCallback(() => dispatch(resetDateWise()), [dispatch]);

  return {
    summaryRows,
    kpis,
    pagination,
    loading,
    dateWiseRows,
    dateWiseOpeningQty,
    dateWisePagination,
    dateWiseLoading,
    error,
    getSummary,
    getDateWise,
    resetAll,
    resetDateWiseData,
  };
};
