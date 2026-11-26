import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  grpoSliceMethods,
  resetGrpo as resetGrpoAction,
  resetGrpos as resetGrposAction,
  resetGrpoDropForConvert as resetGrpoDropForConvertAction,
  resetPendingItems as resetPendingItemsAction,
} from '@/features/purchase/grpo/grpo.slice';

export const useGRPO = () => {
  const dispatch = useDispatch();

  const {
    grpoOrders,
    grpoOrder,
    pagination,
    grpoAccountDrop,
    create,
    update,
    remove,
    loading,
    submitLoading,
    deleteLoading,
    droploading,
    error,
    grpoDropForConvert,
    pendingItems,
    pendingItemLoading,
    exportLoading,
  } = useSelector(state => state.grpo);

  const getgrpos = useCallback(
    async payload => {
      const response = await dispatch(grpoSliceMethods.getgrpos(payload));
      return response;
    },
    [dispatch]
  );

  const createGrpos = useCallback(
    async data => {
      const response = await dispatch(grpoSliceMethods.createGrpos(data));
      return response;
    },
    [dispatch]
  );

  const updateGrpos = useCallback(
    async ({ grpoId, grpoData }) => {
      const response = await dispatch(grpoSliceMethods.updateGrpos({ grpoId, grpoData }));
      return response;
    },
    [dispatch]
  );

  const updateStatus = useCallback(
    async payload => {
      const response = await dispatch(grpoSliceMethods.updateStatus(payload)).unwrap();
      return response;
    },
    [dispatch]
  );

  const getGrpoById = useCallback(
    async payload => {
      const response = await dispatch(grpoSliceMethods.getGrpoById(payload));
      return response;
    },
    [dispatch]
  );

  const resetGrpo = useCallback(() => dispatch(resetGrpoAction()), [dispatch]);
  const resetGrpos = useCallback(() => dispatch(resetGrposAction()), [dispatch]);
  const removeGrpo = useCallback(
    async payload => {
      const response = await dispatch(grpoSliceMethods.removeGrpo(payload)).unwrap();
      return response;
    },
    [dispatch]
  );

  const getGrpoDropdownForConvert = useCallback(
    async payload => {
      const response = await dispatch(grpoSliceMethods.getGrpoDropdownForConvert(payload)).unwrap();
      return response;
    },
    [dispatch]
  );

  const getPendingItemsGrpo = useCallback(
    async payload => {
      const response = await dispatch(grpoSliceMethods.getPendingItemsGrpo(payload)).unwrap();
      return response;
    },
    [dispatch]
  );

  const resetGrpoDropForConvert = useCallback(() => dispatch(resetGrpoDropForConvertAction()), [dispatch]);
  const resetPendingItems = useCallback(() => dispatch(resetPendingItemsAction()), [dispatch]);

  const getGrpoExports = useCallback(async payload => await dispatch(grpoSliceMethods.getGrpoExports(payload)).unwrap(), [dispatch]);

  return {
    grpoOrders,
    grpoOrder,
    pagination,
    grpoAccountDrop,
    grpoDropForConvert,
    pendingItems,
    pendingItemLoading,
    exportLoading,
    create,
    update,
    remove,
    loading,
    submitLoading,
    deleteLoading,
    droploading,
    error,
    getgrpos,
    createGrpos,
    updateGrpos,
    updateStatus,
    getGrpoById,
    resetGrpo,
    removeGrpo,
    resetGrpos,
    resetGrpoDropForConvert,
    resetPendingItems,
    getGrpoDropdownForConvert,
    getPendingItemsGrpo,
    getGrpoExports,
  };
};
