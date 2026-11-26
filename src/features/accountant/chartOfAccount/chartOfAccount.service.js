import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { ACCOUNT_DROPDOWN_CATEGORIES } from '@/utils/constants';

const getAccountCategories = withErrorHandling(async payload => {
  const { signal } = payload ?? {};
  const response = await axiosConfig.get(API_ROUTES.ACCOUNTANT.CHART_OF_ACCOUNTS.GET_CATEGORIES, {
    ...withAbortSignal(signal),
  });
  return response.data;
}, 'getAccountCategories');

const createAccount = withErrorHandling(async accountData => {
  const response = await axiosConfig.post(API_ROUTES.ACCOUNTANT.CHART_OF_ACCOUNTS.CREATE_ACCOUNT, accountData);
  return response.data;
}, 'createAccount');

const updateAccount = withErrorHandling(async ({ accountId, accountData }) => {
  const response = await axiosConfig.put(API_ROUTES.ACCOUNTANT.CHART_OF_ACCOUNTS.UPDATE_ACCOUNT(accountId), accountData);
  return response.data;
}, 'updateAccount');

const getAccountsList = withErrorHandling(async payload => {
  const { signal, ...params } = payload ?? {};
  const response = await axiosConfig.get(API_ROUTES.ACCOUNTANT.CHART_OF_ACCOUNTS.GET_ACCOUNTS, {
    params,
    ...withAbortSignal(signal),
  });
  return response.data;
}, 'getAccountsList');

const getAccounts = withErrorHandling(async payload => {
  const { signal, type, ...params } = payload;
  const response = await axiosConfig.get(API_ROUTES.ACCOUNTANT.CHART_OF_ACCOUNTS.GET_ACCOUNT_DROPDOWN, {
    params: { category: ACCOUNT_DROPDOWN_CATEGORIES[type]?.join(','), ...params },
    ...withAbortSignal(signal),
  });
  return response.data;
}, 'getAccounts');

const getAccountLedger = withErrorHandling(async payload => {
  const { accountId, signal, ...params } = payload ?? {};
  const response = await axiosConfig.get(API_ROUTES.ACCOUNTANT.CHART_OF_ACCOUNTS.GET_ACCOUNT_LEDGER(accountId), {
    params,
    ...withAbortSignal(signal),
  });
  return response.data;
}, 'getAccountLedger');

const deleteAccount = withErrorHandling(async payload => {
  const { accountId } = payload;
  const response = await axiosConfig.delete(API_ROUTES.ACCOUNTANT.CHART_OF_ACCOUNTS.DELETE_ACCOUNT(accountId));
  return response.data;
}, 'deleteAccount');

export const accountService = {
  getAccountCategories,
  createAccount,
  updateAccount,
  getAccountsList,
  getAccounts,
  getAccountLedger,
  deleteAccount,
};
