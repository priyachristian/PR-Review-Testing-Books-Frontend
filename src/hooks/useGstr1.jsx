import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { gstr1SliceMethods, clearGstr1Data as clearGstr1DataAction, selectGstr1Data, selectGstr1Loading, selectGstr1Error } from '@/features/reports/gstr1/gstr1Slice';

/**
 * Custom hook for GSTR-1 operations
 * @returns {Object} GSTR-1 data, loading state, error, and methods
 */
export const useGstr1 = () => {
  const dispatch = useDispatch();

  const data = useSelector(selectGstr1Data);
  const loading = useSelector(selectGstr1Loading);
  const error = useSelector(selectGstr1Error);

  /**
   * Fetch GSTR-1 summary
   * @param {Object} filters - Filter parameters
   */
  const fetchGstr1 = useCallback(
    async filters => {
      return await dispatch(gstr1SliceMethods.fetchGstr1Summary(filters));
    },
    [dispatch]
  );

  /**
   * Clear GSTR-1 data
   */
  const clearGstr1 = useCallback(() => {
    dispatch(clearGstr1DataAction());
  }, [dispatch]);

  return {
    gstr1Data: data,
    loading,
    error,
    fetchGstr1,
    clearGstr1,
  };
};
