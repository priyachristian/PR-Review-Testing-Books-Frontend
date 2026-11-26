import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { qualitySliceMethods, resetQuality as resetQualityAction, resetQualityList as resetQualityListAction } from './quality.slice';

export const useQuality = () => {
  const dispatch = useDispatch();

  const { quality, singleQuality, pagination, create, update, customeTests, loading, submitLoading, deleteLoading, error } = useSelector(state => state.quality);

  const getQuality = useCallback(
    async payload => {
      return await dispatch(qualitySliceMethods.getQuality(payload));
    },
    [dispatch]
  );

  const createQuality = useCallback(
    async qualityData => {
      return await dispatch(qualitySliceMethods.createQuality(qualityData)).unwrap();
    },
    [dispatch]
  );

  const updateQuality = useCallback(
    async ({ qualityId, qualityData }) => {
      return await dispatch(qualitySliceMethods.updateQuality({ qualityId, qualityData })).unwrap();
    },
    [dispatch]
  );

  const getQualityById = useCallback(
    async payload => {
      return await dispatch(qualitySliceMethods.getQualityById(payload)).unwrap();
    },
    [dispatch]
  );

  const deleteQuality = useCallback(
    async payload => {
      return await dispatch(qualitySliceMethods.deleteQuality(payload)).unwrap();
    },
    [dispatch]
  );

  const resetQuality = useCallback(() => dispatch(resetQualityAction()), [dispatch]);
  const resetQualityList = useCallback(() => dispatch(resetQualityListAction()), [dispatch]);
  return {
    quality,
    singleQuality,
    pagination,
    create,
    update,
    customeTests,
    loading,
    submitLoading,
    deleteLoading,
    error,
    getQuality,
    createQuality,
    updateQuality,
    getQualityById,
    deleteQuality,
    resetQuality,
    resetQualityList,
  };
};
