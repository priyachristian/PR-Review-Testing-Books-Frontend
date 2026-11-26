import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { supportSliceMethods } from '@/features/homeTab/support/support.slice';

export const useSupport = () => {
  const dispatch = useDispatch();

  const { supports, support, pagination, statusCounts, create, update, loading, submitLoading, uploading, error } = useSelector(state => state.support);

  const getSupports = useCallback(async payload => await dispatch(supportSliceMethods.getSupports(payload)), [dispatch]);

  const createSupport = useCallback(async payload => await dispatch(supportSliceMethods.createSupport(payload)).unwrap(), [dispatch]);

  const supportFileUpload = useCallback(async payload => await dispatch(supportSliceMethods.supportFileUpload(payload)).unwrap(), [dispatch]);

  const getSupportById = useCallback(async payload => await dispatch(supportSliceMethods.getSupportById(payload)), [dispatch]);

  const sendComment = useCallback(async payload => await dispatch(supportSliceMethods.sendComment(payload)).unwrap(), [dispatch]);

  return {
    supports,
    support,
    pagination,
    statusCounts,
    create,
    update,
    loading,
    submitLoading,
    uploading,
    error,
    getSupports,
    createSupport,
    supportFileUpload,
    getSupportById,
    sendComment,
  };
};
