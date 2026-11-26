import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  accountLedgerSliceMethods,
  resetAccountLedger as resetAccountLedgerAction,
  resetAccountLedgers as resetAccountLedgersAction,
  resetAccountLedgerDrop as resetAccountLedgerDropAction,
} from '@/features/accountant/accountLedger/accountLedger.slice';

export const useAccountLedger = () => {
  const dispatch = useDispatch();

  const { accountLedgers, accountLedger, pagination, create, update, loading, submitLoading, deleteLoading, dropLoading, accountLedgerDrop, error } = useSelector(state => state.accountLedger);

  const createAccountLedger = useCallback(
    async payload => {
      return await dispatch(accountLedgerSliceMethods.createAccountLedger(payload)).unwrap();
    },
    [dispatch]
  );

  const updateAccountLedger = useCallback(
    async payload => {
      return await dispatch(accountLedgerSliceMethods.updateAccountLedger(payload)).unwrap();
    },
    [dispatch]
  );

  const getAccountLedger = useCallback(
    async payload => {
      return await dispatch(accountLedgerSliceMethods.getAccountLedger(payload));
    },
    [dispatch]
  );

  const getAccountLedgerById = useCallback(
    async payload => {
      return await dispatch(accountLedgerSliceMethods.getAccountLedgerById(payload));
    },
    [dispatch]
  );

  const resetAccountLedger = useCallback(() => dispatch(resetAccountLedgerAction()), [dispatch]);
  const resetAccountLedgers = useCallback(() => dispatch(resetAccountLedgersAction()), [dispatch]);

  const getAccountLedgerDropdown = useCallback(
    async payload => {
      return await dispatch(accountLedgerSliceMethods.getAccountLedgerDropdown(payload));
    },
    [dispatch]
  );

  const resetAccountLedgerDrop = useCallback(() => dispatch(resetAccountLedgerDropAction()), [dispatch]);

  const removeAccountLedger = useCallback(
    async payload => {
      return await dispatch(accountLedgerSliceMethods.removeAccountLedger(payload)).unwrap();
    },
    [dispatch]
  );

  return {
    accountLedgers,
    accountLedger,
    pagination,
    create,
    update,
    loading,
    dropLoading,
    accountLedgerDrop,
    error,
    submitLoading,
    deleteLoading,
    createAccountLedger,
    updateAccountLedger,
    getAccountLedger,
    resetAccountLedger,
    getAccountLedgerById,
    resetAccountLedgers,
    getAccountLedgerDropdown,
    resetAccountLedgerDrop,
    removeAccountLedger,
  };
};
