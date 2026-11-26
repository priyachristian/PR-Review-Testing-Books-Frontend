import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  priceListSliceMethods,
  resetPriceList as resetPriceListAction,
  resetPriceListList as resetPriceListListAction,
  resetPriceListDrop as resetPriceListDropAction,
} from '@/features/allMaster/priceList/priceList.slice';

export const usePriceList = () => {
  const dispatch = useDispatch();

  const { priceLists, priceList, pagination, loading, submitLoading, deleteLoading, priceListDrop, error } = useSelector(state => state.priceList);

  const getPriceList = useCallback(
    async payload => {
      const response = await dispatch(priceListSliceMethods.getPriceList(payload));
      return response;
    },
    [dispatch]
  );

  const createPriceList = useCallback(
    async priceData => {
      const response = await dispatch(priceListSliceMethods.createPriceList(priceData));
      return response;
    },
    [dispatch]
  );

  const updatePriceList = useCallback(
    async payload => {
      const response = await dispatch(priceListSliceMethods.updatePriceList(payload)).unwrap();
      return response;
    },
    [dispatch]
  );

  const getPriceListById = useCallback(
    async payload => {
      const response = await dispatch(priceListSliceMethods.getPriceListById(payload));
      return response;
    },
    [dispatch]
  );

  const deletePriceData = useCallback(
    async payload => {
      return await dispatch(priceListSliceMethods.deletePriceData(payload)).unwrap();
    },
    [dispatch]
  );

  const resetPriceList = useCallback(() => dispatch(resetPriceListAction()), [dispatch]);
  const resetPriceListList = useCallback(() => dispatch(resetPriceListListAction()), [dispatch]);

  const getPriceListDropdown = useCallback(
    async payload => {
      const response = await dispatch(priceListSliceMethods.getPriceListDropdown(payload));
      return response;
    },
    [dispatch]
  );

  const resetPriceListDrop = useCallback(() => dispatch(resetPriceListDropAction()), [dispatch]);

  return {
    priceLists,
    priceList,
    pagination,
    loading,
    submitLoading,
    deleteLoading,
    priceListDrop,
    error,
    getPriceList,
    createPriceList,
    updatePriceList,
    getPriceListById,
    deletePriceData,
    resetPriceList,
    resetPriceListList,
    getPriceListDropdown,
    resetPriceListDrop,
  };
};
