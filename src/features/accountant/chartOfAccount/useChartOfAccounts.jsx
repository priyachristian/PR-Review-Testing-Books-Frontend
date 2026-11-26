import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  accountSliceMethods,
  resetAccounts as resetAccountsAction,
  resetAccountDrop as resetAccountDropAction,
  resetAccountLedger as resetAccountLedgerAction,
} from '@/features/accountant/chartOfAccount/chartOfAccount.slice';

export const useChartOfAccounts = () => {
  const dispatch = useDispatch();
  const { categories, accounts, loading, accountDrop, accountLedger, ledgerLoading, submitLoading, deleteLoading, droploading, error, message } = useSelector(state => state.account);

  const getAccountCategories = useCallback(payload => dispatch(accountSliceMethods.getAccountCategories(payload)), [dispatch]);
  const createAccount = useCallback(accountData => dispatch(accountSliceMethods.createAccount(accountData)).unwrap(), [dispatch]);
  const updateAccount = useCallback(payload => dispatch(accountSliceMethods.updateAccount(payload)).unwrap(), [dispatch]);
  const getAccountsList = useCallback(payload => dispatch(accountSliceMethods.getAccountsList(payload)), [dispatch]);
  const getAccounts = useCallback(payload => dispatch(accountSliceMethods.getAccounts(payload)), [dispatch]);
  const resetAccounts = useCallback(() => dispatch(resetAccountsAction()), [dispatch]);
  const deleteAccount = useCallback(payload => dispatch(accountSliceMethods.deleteAccount(payload)).unwrap(), [dispatch]);
  const getAccountLedger = useCallback(payload => dispatch(accountSliceMethods.getAccountLedger(payload)), [dispatch]);
  const resetAccountDrop = useCallback(() => dispatch(resetAccountDropAction()), [dispatch]);
  const resetAccountLedger = useCallback(() => dispatch(resetAccountLedgerAction()), [dispatch]);

  return {
    categories,
    accounts,
    loading,
    accountDrop,
    accountLedger,
    ledgerLoading,
    submitLoading,
    deleteLoading,
    droploading,
    error,
    message,
    getAccountCategories,
    createAccount,
    updateAccount,
    getAccountsList,
    getAccounts,
    getAccountLedger,
    deleteAccount,
    resetAccounts,
    resetAccountDrop,
    resetAccountLedger,
  };
};
