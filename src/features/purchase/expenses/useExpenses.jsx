import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { expensesSliceMethods, resetExpenses as resetExpensesAction, resetExpensesList as resetExpensesListAction } from '@/features/purchase/expenses/expense.slice';

export const useExpenses = () => {
  const dispatch = useDispatch();

  const {
    expenses,
    expense,
    expenseFile,
    pagination,
    expenseEmployeeDrop,
    expenseCustomerProjectDrop,
    create,
    update,
    loading,
    submitLoading,
    deleteLoading,
    exportLoading,
    uploading,
    droploading,
    error,
  } = useSelector(state => state.expense);

  const getExpenses = useCallback(
    async payload => {
      return await dispatch(expensesSliceMethods.getExpenses(payload));
    },
    [dispatch]
  );

  const createExpenses = useCallback(
    async expenseData => {
      return await dispatch(expensesSliceMethods.createExpenses(expenseData)).unwrap();
    },
    [dispatch]
  );

  const updateExpenses = useCallback(
    async ({ expenseId, expenseData }) => {
      return await dispatch(expensesSliceMethods.updateExpenses({ expenseId, expenseData })).unwrap();
    },
    [dispatch]
  );

  const expenseFileUpload = useCallback(
    async fileData => {
      return await dispatch(expensesSliceMethods.expenseFileUpload(fileData)).unwrap();
    },
    [dispatch]
  );

  const getExpenseCustomerProject = useCallback(
    async payload => {
      return await dispatch(expensesSliceMethods.getExpenseCustomerProject(payload));
    },
    [dispatch]
  );

  const getExpenseById = useCallback(
    async payload => {
      return await dispatch(expensesSliceMethods.getExpenseById(payload));
    },
    [dispatch]
  );

  const removeExpenses = useCallback(
    async payload => {
      return await dispatch(expensesSliceMethods.removeExpenses(payload)).unwrap();
    },
    [dispatch]
  );

  const getExpenseExports = useCallback(async payload => await dispatch(expensesSliceMethods.getExpenseExports(payload)).unwrap(), [dispatch]);

  const resetExpenses = useCallback(() => dispatch(resetExpensesAction()), [dispatch]);
  const resetExpensesList = useCallback(() => dispatch(resetExpensesListAction()), [dispatch]);

  return {
    expenses,
    expense,
    expenseFile,
    pagination,
    expenseEmployeeDrop,
    expenseCustomerProjectDrop,
    create,
    update,
    loading,
    submitLoading,
    deleteLoading,
    exportLoading,
    uploading,
    droploading,
    error,
    getExpenses,
    createExpenses,
    updateExpenses,
    expenseFileUpload,
    getExpenseCustomerProject,
    getExpenseById,
    removeExpenses,
    getExpenseExports,
    resetExpenses,
    resetExpensesList,
  };
};
