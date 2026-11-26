import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  recurringExpenseSliceMethods,
  resetRecurringExpense as resetRecurringExpenseAction,
  resetRecurringExpenses as resetRecurringExpensesAction,
} from '@/features/purchase/recurringExpenses/recurringExpense.slice';

export const useRecurringExpenses = () => {
  const dispatch = useDispatch();

  const { recurringExpenses, recurringExpense, pagination, recurringExpenseCustomerProjectDrop, create, update, loading, submitLoading, deleteLoading, createExpenseLoading, droploading, error } =
    useSelector(state => state.recurringExpense);

  const getRecurringExpenses = useCallback(
    async payload => {
      return await dispatch(recurringExpenseSliceMethods.getRecurringExpenses(payload));
    },
    [dispatch]
  );

  const createRecurringExpenses = useCallback(
    async recurringExpenseData => {
      return await dispatch(recurringExpenseSliceMethods.createRecurringExpenses(recurringExpenseData)).unwrap();
    },
    [dispatch]
  );

  const updateRecurringExpenses = useCallback(
    async ({ expenseId, recurringExpenseData }) => {
      return await dispatch(recurringExpenseSliceMethods.updateRecurringExpenses({ expenseId, recurringExpenseData })).unwrap();
    },
    [dispatch]
  );

  const getRecurringExpenseCustomerProject = useCallback(
    async payload => {
      return await dispatch(recurringExpenseSliceMethods.getRecurringExpenseCustomerProject(payload));
    },
    [dispatch]
  );

  const getRecurringExpenseById = useCallback(
    async payload => {
      return await dispatch(recurringExpenseSliceMethods.getRecurringExpenseById(payload));
    },
    [dispatch]
  );

  const updateStatus = useCallback(
    async payload => {
      return await dispatch(recurringExpenseSliceMethods.updateStatus(payload)).unwrap();
    },
    [dispatch]
  );

  const removeRecurringExpense = useCallback(
    async payload => {
      return await dispatch(recurringExpenseSliceMethods.removeRecurringExpense(payload)).unwrap();
    },
    [dispatch]
  );

  const createExpenseFromRecurring = useCallback(
    async data => {
      return await dispatch(recurringExpenseSliceMethods.createExpenseFromRecurring(data)).unwrap();
    },
    [dispatch]
  );

  const resetRecurringExpense = useCallback(() => dispatch(resetRecurringExpenseAction()), [dispatch]);

  const resetRecurringExpenses = useCallback(() => dispatch(resetRecurringExpensesAction()), [dispatch]);

  return {
    recurringExpenses,
    recurringExpense,
    pagination,
    recurringExpenseCustomerProjectDrop,
    create,
    update,
    loading,
    submitLoading,
    deleteLoading,
    createExpenseLoading,
    droploading,
    error,
    getRecurringExpenses,
    createRecurringExpenses,
    updateRecurringExpenses,
    getRecurringExpenseCustomerProject,
    getRecurringExpenseById,
    updateStatus,
    removeRecurringExpense,
    createExpenseFromRecurring,
    resetRecurringExpense,
    resetRecurringExpenses,
  };
};
