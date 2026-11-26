import axiosConfig from 'app/axiosConfig';
import { API_ROUTES } from '@/utils/apiRoute';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';
import { BANK_TYPES } from '@/utils/constants';

const getBank = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, search = '', accountType = null, pagination = true, signal, sortBy = '', isSplit = false } = payload;
  const queryParams = new URLSearchParams({
    page: page,
    limit: limit,
  });
  if (!pagination) {
    queryParams.delete('page');
    queryParams.delete('limit');
    queryParams.append('pagination', pagination);
  }
  if (search) queryParams.append('search', search);
  if (accountType) queryParams.append('accountType', accountType);
  if (sortBy) queryParams.append('sortBy', sortBy);
  if (isSplit) queryParams.append('isSplit', isSplit);

  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.BANK.BASE, config);
  return response.data;
}, 'getBank');

const createBanking = withErrorHandling(async bankData => {
  const response = await axiosConfig.post(API_ROUTES.BANK.CREATE, bankData, {});
  return response.data;
}, 'createBanking');

const updateBanking = withErrorHandling(async ({ bankId, bankData }) => {
  const response = await axiosConfig.put(API_ROUTES.BANK.UPDATE(bankId), bankData, {});
  return response.data;
}, 'updateBanking');

const getPrimaryBank = withErrorHandling(async payload => {
  const { signal } = payload;
  const queryParams = new URLSearchParams({
    isPrimary: true,
    accountType: BANK_TYPES.BANK,
  });
  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.BANK.BASE, config);
  return response.data;
}, 'getPrimaryBank');

const getBankDropDown = withErrorHandling(async payload => {
  const { accountType, signal, isSplit = false } = payload;
  const queryParams = new URLSearchParams({});

  if (accountType) {
    queryParams.append('accountType', accountType);
  }

  if (isSplit) {
    queryParams.append('isSplit', isSplit);
  }

  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.BANK.BANK_DROPDOWN, config);
  return response.data;
}, 'getBankDropDown');

const bankTransfer = withErrorHandling(async payload => {
  const response = await axiosConfig.post(API_ROUTES.BANK.BANK_TRANSFER, payload);
  return response.data;
}, 'bankTransfer');

const getBankById = withErrorHandling(async payload => {
  const { bankId, signal } = payload;

  let config = { ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.BANK.GET_BY_ID(bankId), {
    ...config,
  });
  return response.data;
}, 'getBankById');

const getBankHistory = withErrorHandling(async payload => {
  const { bankId, signal, ...rest } = payload;
  const config = {
    params: {
      bankId,
      ...rest,
    },
    ...withAbortSignal(signal),
  };
  const response = await axiosConfig.get(API_ROUTES.BANK.GET_BANK_HISTORY, config);
  return response.data;
}, 'getBankHistory');

const createBankTransaction = withErrorHandling(async payload => {
  const response = await axiosConfig.post(API_ROUTES.BANK.CREATE_BANK_TRANSACTION, payload);
  return response.data;
}, 'createBankTransaction');

// List all transactions (no bankId required)
const getAllBankTransactions = withErrorHandling(async payload => {
  const { signal, ...rest } = payload || {};
  const config = { params: rest, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.BANK.GET_BANK_HISTORY, config);
  return response.data;
}, 'getAllBankTransactions');

const approveTransaction = withErrorHandling(async payload => {
  const response = await axiosConfig.post(API_ROUTES.BANK.APPROVE_TRANSACTION, payload);
  return response.data;
}, 'approveTransaction');

const rejectTransaction = withErrorHandling(async payload => {
  const response = await axiosConfig.post(API_ROUTES.BANK.REJECT_TRANSACTION, payload);
  return response.data;
}, 'rejectTransaction');

const cancelTransaction = withErrorHandling(async payload => {
  const response = await axiosConfig.post(API_ROUTES.BANK.CANCEL_TRANSACTION, payload);
  return response.data;
}, 'cancelTransaction');

export const bankingService = {
  getBank,
  createBanking,
  updateBanking,
  getPrimaryBank,
  getBankDropDown,
  bankTransfer,
  getBankById,
  getBankHistory,
  createBankTransaction,
  getAllBankTransactions,
  approveTransaction,
  rejectTransaction,
  cancelTransaction,
};
