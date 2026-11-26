import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { bankingSliceMethods, resetBank as resetBankAction, resetBanking as resetBankingAction, resetAllBankTransactions as resetAllBankTransactionsAction } from '@/features/banking/banks/bank.slice';

export const useBank = () => {
  const dispatch = useDispatch();

  const {
    banking,
    bank,
    primaryBank,
    bankDropdown,
    pagination,
    paginationForBankHistory,
    allBankTransactions,
    paginationForAllTransactions,
    bankHistory,
    create,
    update,
    loading,
    droploading,
    bankLoading,
    submitLoading,
    updateBankLoading,
    approveTransactionLoading,
    rejectTransactionLoading,
    cancelTransactionLoading,
    error,
  } = useSelector(state => state.bank);

  const getBank = useCallback(
    async payload => {
      const response = await dispatch(bankingSliceMethods.getBank(payload));
      return response;
    },
    [dispatch]
  );

  const createBanking = useCallback(
    async bankData => {
      const response = await dispatch(bankingSliceMethods.createBanking(bankData)).unwrap();
      return response;
    },
    [dispatch]
  );

  const updateBanking = useCallback(
    async payload => {
      const response = await dispatch(bankingSliceMethods.updateBanking(payload)).unwrap();
      return response;
    },
    [dispatch]
  );

  const getPrimaryBank = useCallback(
    async payload => {
      const response = await dispatch(bankingSliceMethods.getPrimaryBank(payload));
      return response;
    },
    [dispatch]
  );

  const bankTransfer = useCallback(
    async payload => {
      const response = await dispatch(bankingSliceMethods.bankTransfer(payload)).unwrap();
      return response;
    },
    [dispatch]
  );

  const getBankDropDown = useCallback(
    async payload => {
      const response = await dispatch(bankingSliceMethods.getBankDropDown(payload));
      return response;
    },
    [dispatch]
  );

  const getBankById = useCallback(
    async payload => {
      const response = await dispatch(bankingSliceMethods.getBankById(payload)).unwrap();
      return response;
    },
    [dispatch]
  );

  const resetBank = useCallback(() => dispatch(resetBankAction()), [dispatch]);
  const resetBanking = useCallback(() => dispatch(resetBankingAction()), [dispatch]);
  const resetAllBankTransactions = useCallback(() => dispatch(resetAllBankTransactionsAction()), [dispatch]);
  const getBankHistory = useCallback(
    async payload => {
      const response = await dispatch(bankingSliceMethods.getBankHistory(payload));
      return response;
    },
    [dispatch]
  );

  const createBankTransaction = useCallback(
    async payload => {
      const response = await dispatch(bankingSliceMethods.createBankTransaction(payload)).unwrap();
      return response;
    },
    [dispatch]
  );

  const getAllBankTransactions = useCallback(
    async payload => {
      const response = await dispatch(bankingSliceMethods.getAllBankTransactions(payload)).unwrap();
      return response;
    },
    [dispatch]
  );

  const cancelTransaction = useCallback(
    async payload => {
      const response = await dispatch(bankingSliceMethods.cancelTransaction(payload)).unwrap();
      return response;
    },
    [dispatch]
  );

  const approveTransaction = useCallback(
    async payload => {
      const response = await dispatch(bankingSliceMethods.approveTransaction(payload)).unwrap();
      return response;
    },
    [dispatch]
  );

  const rejectTransaction = useCallback(
    async payload => {
      const response = await dispatch(bankingSliceMethods.rejectTransaction(payload)).unwrap();
      return response;
    },
    [dispatch]
  );

  return {
    banking,
    bank,
    primaryBank,
    bankDropdown,
    pagination,
    paginationForBankHistory,
    allBankTransactions,
    paginationForAllTransactions,
    bankHistory,
    create,
    update,
    loading,
    droploading,
    updateBankLoading,
    bankLoading,
    submitLoading,
    approveTransactionLoading,
    rejectTransactionLoading,
    cancelTransactionLoading,
    error,
    getBank,
    createBanking,
    updateBanking,
    getPrimaryBank,
    getBankDropDown,
    bankTransfer,
    getBankById,
    resetBank,
    getBankHistory,
    createBankTransaction,
    getAllBankTransactions,
    approveTransaction,
    rejectTransaction,
    cancelTransaction,
    resetBanking,
    resetAllBankTransactions,
  };
};
