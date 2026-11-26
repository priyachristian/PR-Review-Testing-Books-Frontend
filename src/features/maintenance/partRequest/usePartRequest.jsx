import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { partRequestSliceMethods, resetPartRequest as resetPartRequestAction } from './partRequest.slice';

export const usePartRequest = () => {
  const dispatch = useDispatch();
  const { partRequests, loading, updateLoading, error, pagination } = useSelector(state => state.partRequest);

  const getPartRequests = useCallback(
    async payload => {
      const response = await dispatch(partRequestSliceMethods.getPartRequests(payload));
      return response;
    },
    [dispatch]
  );

  const approvePartRequest = useCallback(
    async payload => {
      return await dispatch(partRequestSliceMethods.approvePartRequest(payload)).unwrap();
    },
    [dispatch]
  );

  const issuePartRequest = useCallback(
    async payload => {
      return await dispatch(partRequestSliceMethods.issuePartRequest(payload)).unwrap();
    },
    [dispatch]
  );

  const shortPartRequest = useCallback(
    async payload => {
      return await dispatch(partRequestSliceMethods.shortPartRequest(payload)).unwrap();
    },
    [dispatch]
  );

  const resetPartRequest = useCallback(() => dispatch(resetPartRequestAction()), [dispatch]);

  return {
    partRequests,
    loading,
    updateLoading,
    error,
    pagination,
    getPartRequests,
    approvePartRequest,
    issuePartRequest,
    shortPartRequest,
    resetPartRequest,
  };
};
