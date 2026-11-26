import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { itemGroupSliceMethods, resetItemGroupDrop as resetItemGroupDropAction, resetItemGroupList as resetItemGroupListAction } from './itemGroup.slice';

export const useItemGroup = () => {
  const dispatch = useDispatch();

  const { itemGroup, itemGroupDetail, itemGroupPagination, itemGroupDrop, itemGroupDropLoading, loading, droploading, deleteLoading, error } = useSelector(state => state.itemGroup);

  const getItemGroup = useCallback(
    async payload => {
      const response = await dispatch(itemGroupSliceMethods.getItemGroup(payload));
      return response;
    },
    [dispatch]
  );

  const getItemGroupById = useCallback(
    async payload => {
      const response = await dispatch(itemGroupSliceMethods.getItemGroupById(payload));
      return response;
    },
    [dispatch]
  );

  const createItemGroup = useCallback(
    async itemUnitDetails => {
      const response = await dispatch(itemGroupSliceMethods.createItemGroup(itemUnitDetails)).unwrap();
      return response;
    },
    [dispatch]
  );

  const deleteItemGroup = useCallback(
    async payload => {
      const response = await dispatch(itemGroupSliceMethods.deleteItemGroup(payload));
      return response;
    },
    [dispatch]
  );

  const updateItemGroup = useCallback(
    async payload => {
      const response = await dispatch(itemGroupSliceMethods.updateItemGroup(payload));
      return response;
    },
    [dispatch]
  );

  const getItemGroupDropdown = useCallback(
    async payload => {
      const response = await dispatch(itemGroupSliceMethods.getItemGroupDropdown(payload));
      return response;
    },
    [dispatch]
  );

  const resetItemGroupDrop = useCallback(() => dispatch(resetItemGroupDropAction()), [dispatch]);

  const resetItemGroupList = useCallback(() => dispatch(resetItemGroupListAction()), [dispatch]);

  return {
    itemGroup,
    itemGroupDetail,
    itemGroupPagination,
    itemGroupDrop,
    itemGroupDropLoading,
    loading,
    droploading,
    deleteLoading,
    error,
    getItemGroup,
    getItemGroupById,
    createItemGroup,
    deleteItemGroup,
    updateItemGroup,
    getItemGroupDropdown,
    resetItemGroupDrop,
    resetItemGroupList,
  };
};
