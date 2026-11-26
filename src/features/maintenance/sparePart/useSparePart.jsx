import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  sparePartSliceMethods,
  resetSparePart as resetSparePartAction,
  resetSparePartDropdown as resetSparePartDropdownAction,
  resetSparePartDetail as resetSparePartDetailAction,
} from './sparePart.slice';

export const useSparePart = () => {
  const dispatch = useDispatch();
  const { spareParts, sparePart, sparePartDropdown, loading, detailLoading, dropdownLoading, submitLoading, deleteLoading, error, pagination } = useSelector(state => state.sparePart);

  const getSpareParts = useCallback(
    async payload => {
      const response = await dispatch(sparePartSliceMethods.getSpareParts(payload));
      return response;
    },
    [dispatch]
  );

  const getSparePartById = useCallback(
    async payload => {
      const response = await dispatch(sparePartSliceMethods.getSparePartById(payload));
      return response;
    },
    [dispatch]
  );

  const getSparePartDropdown = useCallback(
    async payload => {
      const response = await dispatch(sparePartSliceMethods.getSparePartDropdown(payload));
      return response;
    },
    [dispatch]
  );

  const createSparePart = useCallback(
    async payload => {
      return await dispatch(sparePartSliceMethods.createSparePart(payload)).unwrap();
    },
    [dispatch]
  );

  const updateSparePart = useCallback(
    async payload => {
      return await dispatch(sparePartSliceMethods.updateSparePart(payload)).unwrap();
    },
    [dispatch]
  );

  const deleteSparePart = useCallback(
    async sparePartId => {
      return await dispatch(sparePartSliceMethods.deleteSparePart(sparePartId)).unwrap();
    },
    [dispatch]
  );

  const updateSparePartStatus = useCallback(
    async payload => {
      return await dispatch(sparePartSliceMethods.updateSparePartStatus(payload)).unwrap();
    },
    [dispatch]
  );

  const resetSparePart = useCallback(() => dispatch(resetSparePartAction()), [dispatch]);

  const resetSparePartDropdown = useCallback(() => dispatch(resetSparePartDropdownAction()), [dispatch]);

  const resetSparePartDetail = useCallback(() => dispatch(resetSparePartDetailAction()), [dispatch]);

  return {
    spareParts,
    sparePart,
    sparePartDropdown,
    loading,
    detailLoading,
    dropdownLoading,
    submitLoading,
    deleteLoading,
    error,
    pagination,
    getSpareParts,
    getSparePartById,
    getSparePartDropdown,
    createSparePart,
    updateSparePart,
    deleteSparePart,
    updateSparePartStatus,
    resetSparePart,
    resetSparePartDropdown,
    resetSparePartDetail,
  };
};
