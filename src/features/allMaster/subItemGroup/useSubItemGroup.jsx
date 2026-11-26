import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { subItemGroupSliceMethods, resetSubItemGroupDrop as resetSubItemGroupDropAction, resetSubItemGroupList as resetSubItemGroupListAction } from './subItemGroup.slice';

export const useSubItemGroup = () => {
  const dispatch = useDispatch();

  const { subItemGroup, subItemGroupDetail, subItemGroupPagination, subItemGroupDrop, subItemGroupDropLoading, loading, droploading, deleteLoading, error } = useSelector(state => state.subItemGroup);

  const getSubItemGroup = useCallback(
    async payload => {
      const response = await dispatch(subItemGroupSliceMethods.getSubItemGroup(payload));
      return response;
    },
    [dispatch]
  );

  const getSubItemGroupById = useCallback(
    async payload => {
      const response = await dispatch(subItemGroupSliceMethods.getSubItemGroupById(payload));
      return response;
    },
    [dispatch]
  );

  const createSubItemGroup = useCallback(
    async subItemGroupDetails => {
      const response = await dispatch(subItemGroupSliceMethods.createSubItemGroup(subItemGroupDetails)).unwrap();
      return response;
    },
    [dispatch]
  );

  const deleteSubItemGroup = useCallback(
    async payload => {
      const response = await dispatch(subItemGroupSliceMethods.deleteSubItemGroup(payload));
      return response;
    },
    [dispatch]
  );

  const updateSubItemGroup = useCallback(
    async payload => {
      const response = await dispatch(subItemGroupSliceMethods.updateSubItemGroup(payload));
      return response;
    },
    [dispatch]
  );

  const getSubItemGroupDropdown = useCallback(
    async payload => {
      const response = await dispatch(subItemGroupSliceMethods.getSubItemGroupDropdown(payload));
      return response;
    },
    [dispatch]
  );

  const resetSubItemGroupDrop = useCallback(() => dispatch(resetSubItemGroupDropAction()), [dispatch]);

  const resetSubItemGroupList = useCallback(() => dispatch(resetSubItemGroupListAction()), [dispatch]);

  return {
    subItemGroup,
    subItemGroupDetail,
    subItemGroupPagination,
    subItemGroupDrop,
    subItemGroupDropLoading,
    loading,
    droploading,
    deleteLoading,
    error,
    getSubItemGroup,
    getSubItemGroupById,
    createSubItemGroup,
    deleteSubItemGroup,
    updateSubItemGroup,
    getSubItemGroupDropdown,
    resetSubItemGroupDrop,
    resetSubItemGroupList,
  };
};
