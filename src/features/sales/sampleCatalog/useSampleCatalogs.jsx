// React
import { useCallback } from 'react';

// Third Party
import { useDispatch, useSelector } from 'react-redux';

// Redux
import { sampleCatalogSliceMethods, resetSampleCatalog as resetSampleCatalogAction, resetSampleCatalogs as resetSampleCatalogsAction } from '@/features/sales/sampleCatalog/sampleCatalog.slice';

export const useSampleCatalogs = () => {
  const dispatch = useDispatch();
  const { sampleCatalogs, sampleCatalog, pagination, loading, submitLoading, error } = useSelector(state => state.sampleCatalog);

  const getSampleCatalogs = useCallback(payload => dispatch(sampleCatalogSliceMethods.getSampleCatalogs(payload)), [dispatch]);
  const getSampleCatalogById = useCallback(payload => dispatch(sampleCatalogSliceMethods.getSampleCatalogById(payload)), [dispatch]);
  const createSampleCatalog = useCallback(payload => dispatch(sampleCatalogSliceMethods.createSampleCatalog(payload)).unwrap(), [dispatch]);
  const updateSampleCatalog = useCallback(payload => dispatch(sampleCatalogSliceMethods.updateSampleCatalog(payload)).unwrap(), [dispatch]);
  const updateSampleCatalogStatus = useCallback(payload => dispatch(sampleCatalogSliceMethods.updateSampleCatalogStatus(payload)).unwrap(), [dispatch]);
  const resetSampleCatalog = useCallback(() => dispatch(resetSampleCatalogAction()), [dispatch]);
  const resetSampleCatalogs = useCallback(() => dispatch(resetSampleCatalogsAction()), [dispatch]);

  return {
    sampleCatalogs,
    sampleCatalog,
    pagination,
    loading,
    submitLoading,
    error,
    getSampleCatalogs,
    getSampleCatalogById,
    createSampleCatalog,
    updateSampleCatalog,
    updateSampleCatalogStatus,
    resetSampleCatalog,
    resetSampleCatalogs,
  };
};
