import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { recurringBillsSliceMethods, resetRecurringBill as resetRecurringBillAction, resetRecurringBills as resetRecurringBillsAction } from '@/features/purchase/recurringBills/recurringBill.slice';

export const useRecurringBills = () => {
  const dispatch = useDispatch();

  const { recurringBills, recurringBill, pagination, nextRecurringBillId, create, update, loading, submitLoading, deleteLoading, createBill, createBillLoading, uploading, droploading, error } =
    useSelector(state => state.recurringBills);

  const getRecurringBills = useCallback(
    async payload => {
      return await dispatch(recurringBillsSliceMethods.getRecurringBills(payload));
    },
    [dispatch]
  );

  const createRecurringBills = useCallback(
    async recurringBillData => {
      return await dispatch(recurringBillsSliceMethods.createRecurringBills(recurringBillData)).unwrap();
    },
    [dispatch]
  );

  const updateRecurringBills = useCallback(
    async ({ billsId, recurringBillData }) => {
      return await dispatch(recurringBillsSliceMethods.updateRecurringBills({ billsId, recurringBillData })).unwrap();
    },
    [dispatch]
  );

  const updateStatus = useCallback(
    async payload => {
      return await dispatch(recurringBillsSliceMethods.updateStatus(payload)).unwrap();
    },
    [dispatch]
  );

  const getRecurringBillById = useCallback(
    async payload => {
      return await dispatch(recurringBillsSliceMethods.getRecurringBillById(payload)).unwrap();
    },
    [dispatch]
  );

  const resetRecurringBill = useCallback(() => dispatch(resetRecurringBillAction()), [dispatch]);

  const resetRecurringBills = useCallback(() => dispatch(resetRecurringBillsAction()), [dispatch]);

  const createBillFromRecurring = useCallback(
    async data => {
      return await dispatch(recurringBillsSliceMethods.createBillFromRecurring(data)).unwrap();
    },
    [dispatch]
  );

  const removeRecurringBill = useCallback(
    async payload => {
      return await dispatch(recurringBillsSliceMethods.removeRecurringBill(payload)).unwrap();
    },
    [dispatch]
  );

  return {
    recurringBills,
    recurringBill,
    pagination,
    nextRecurringBillId,
    create,
    update,
    loading,
    submitLoading,
    deleteLoading,
    createBill,
    createBillLoading,
    uploading,
    droploading,
    error,
    getRecurringBills,
    createRecurringBills,
    updateRecurringBills,
    updateStatus,
    getRecurringBillById,
    resetRecurringBill,
    resetRecurringBills,
    createBillFromRecurring,
    removeRecurringBill,
  };
};
