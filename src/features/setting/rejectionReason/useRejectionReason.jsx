import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { rejectionReasonSliceMethods, resetRejectionReason as resetRejectionReasonAction } from './rejectionReason.slice';

export const useRejectionReason = () => {
  const dispatch = useDispatch();

  const { rejectionReasons, rejectionReason, pagination, create, update, remove, loading, dropLoading, rejectionReasonsDrop, submitLoading, error } = useSelector(state => state.rejectionReason);

  const getRejectionReasons = useCallback(async payload => await dispatch(rejectionReasonSliceMethods.getRejectionReasons(payload)), [dispatch]);

  const getRejectionReasonsDrop = useCallback(async payload => await dispatch(rejectionReasonSliceMethods.getRejectionReasonsDrop(payload)), [dispatch]);

  const createRejectionReason = useCallback(async data => await dispatch(rejectionReasonSliceMethods.createRejectionReason(data)), [dispatch]);

  const updateRejectionReason = useCallback(async ({ id, data }) => await dispatch(rejectionReasonSliceMethods.updateRejectionReason({ id, data })), [dispatch]);

  const getRejectionReasonById = useCallback(async payload => await dispatch(rejectionReasonSliceMethods.getRejectionReasonById(payload)), [dispatch]);

  const removeRejectionReason = useCallback(async payload => await dispatch(rejectionReasonSliceMethods.removeRejectionReason(payload)), [dispatch]);

  const resetRejectionReason = useCallback(() => dispatch(resetRejectionReasonAction()), [dispatch]);

  return {
    rejectionReasons,
    rejectionReason,
    pagination,
    create,
    update,
    remove,
    loading,
    dropLoading,
    rejectionReasonsDrop,
    submitLoading,
    error,
    getRejectionReasons,
    getRejectionReasonsDrop,
    createRejectionReason,
    updateRejectionReason,
    getRejectionReasonById,
    removeRejectionReason,
    resetRejectionReason,
  };
};
