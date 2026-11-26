import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { resetSalesOrderTagList as resetSalesOrderTagListAction, salesOrderTagSliceMethods } from '@/features/allMaster/salesOrderTag/salesOrderTag.slice';

export const useSalesOrderTag = () => {
  const dispatch = useDispatch();
  const { salesOrderTags, loading, saveLoading, error, pagination, salesOrderTagsDropdown, dropdownLoading } = useSelector(state => state.salesOrderTag);

  const getSalesOrderTag = useCallback(async payload => await dispatch(salesOrderTagSliceMethods.getSalesOrderTag(payload)), [dispatch]);

  const createSalesOrderTag = useCallback(async payload => await dispatch(salesOrderTagSliceMethods.createSalesOrderTag(payload)).unwrap(), [dispatch]);

  const updateSalesOrderTag = useCallback(async payload => await dispatch(salesOrderTagSliceMethods.updateSalesOrderTag(payload)).unwrap(), [dispatch]);

  const deleteSalesOrderTag = useCallback(async payload => await dispatch(salesOrderTagSliceMethods.deleteSalesOrderTag(payload)), [dispatch]);

  const getSalesOrderTagsDropdown = useCallback(async payload => await dispatch(salesOrderTagSliceMethods.getSalesOrderTagsDropdown(payload)), [dispatch]);

  const resetSalesOrderTagList = useCallback(() => dispatch(resetSalesOrderTagListAction()), [dispatch]);

  return {
    salesOrderTags,
    loading,
    saveLoading,
    error,
    pagination,
    getSalesOrderTag,
    createSalesOrderTag,
    updateSalesOrderTag,
    deleteSalesOrderTag,
    resetSalesOrderTagList,
    salesOrderTagsDropdown,
    getSalesOrderTagsDropdown,
    dropdownLoading,
  };
};
