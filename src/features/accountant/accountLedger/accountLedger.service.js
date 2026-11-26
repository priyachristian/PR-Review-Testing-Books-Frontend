import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const createAccountLedger = withErrorHandling(async payload => {
  const response = await axiosConfig.post(API_ROUTES.ACCOUNTANT.ACCOUNT_LEDGER.CREATE_ACCOUNT_LEDGER, payload, {});
  return response.data;
}, 'createAccountLedger');

const getAccountLedger = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, signal, pagination = true, search } = payload;
  const queryParams = new URLSearchParams({});

  if (pagination) {
    queryParams.append('page', page);
    queryParams.append('limit', limit);
  } else {
    queryParams.append('pagination', false);
  }

  if (search) {
    queryParams.append('search', search);
  }

  let config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.ACCOUNTANT.ACCOUNT_LEDGER.GET_ACCOUNT_LEDGER, config);
  return response.data;
}, 'getAccountLedger');

const getAccountLedgerById = withErrorHandling(async payload => {
  const { accountLedgerId, signal } = payload;
  const queryParams = new URLSearchParams();

  let config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.ACCOUNTANT.ACCOUNT_LEDGER.GET_ACCOUNT_LEDGER_BY_ID(accountLedgerId), config);
  return response.data;
}, 'getAccountLedgerById');

const updateAccountLedger = withErrorHandling(async payload => {
  const { accountLedgerId, accountLedgerData } = payload;
  const response = await axiosConfig.patch(API_ROUTES.ACCOUNTANT.ACCOUNT_LEDGER.UPDATE_ACCOUNT_LEDGER(accountLedgerId), accountLedgerData, {});
  return response.data;
}, 'updateAccountLedger');

const getAccountLedgerDropdown = withErrorHandling(async payload => {
  const { signal } = payload;
  const queryParams = new URLSearchParams({});

  let config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.ACCOUNTANT.ACCOUNT_LEDGER.GET_ACCOUNT_LEDGER_DROPDOWN, config);
  return response.data;
}, 'getAccountLedgerDropdown');

const removeAccountLedger = withErrorHandling(async payload => {
  const { accountLedgerId } = payload;
  const response = await axiosConfig.delete(API_ROUTES.ACCOUNTANT.ACCOUNT_LEDGER.DELETE_ACCOUNT_LEDGER(accountLedgerId), {});
  return response.data;
}, 'removeAccountLedger');

export const accountLedgerService = {
  createAccountLedger,
  getAccountLedger,
  getAccountLedgerById,
  updateAccountLedger,
  getAccountLedgerDropdown,
  removeAccountLedger,
};
