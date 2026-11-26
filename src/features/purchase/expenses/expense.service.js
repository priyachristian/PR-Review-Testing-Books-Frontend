import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { buildMultipartPayload } from 'utils/multipartHelper';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { buildDocumentExportRequestConfig } from '@/utils/documentExportQuery';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getExpenses = withErrorHandling(async payload => {
  const {
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    search = '',
    date = null,
    startDate = null,
    endDate = null,
    signal,
    sortBy = '',
    addedBy = '',
    division = '',
    branch = '',
    country = '',
    state = '',
    city = '',
    addressType = '',
    customerId = '',
  } = payload;
  const queryParams = new URLSearchParams({ page: page, limit: limit });
  if (search) {
    queryParams.append('search', search);
  }
  if (sortBy) {
    queryParams.append('sortBy', sortBy);
  }
  if (date) {
    queryParams.append('date', date);
  }
  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }
  if (addedBy) {
    queryParams.append('addedBy', addedBy);
  }
  if (division) {
    queryParams.append('divisionId', division);
  }
  if (branch) {
    queryParams.append('branchId', branch);
  }
  if (customerId) {
    queryParams.append('partyId', customerId);
  }
  if (country) queryParams.append('country', country);
  if (state) queryParams.append('state', state);
  if (city) queryParams.append('city', city);
  if (addressType) queryParams.append('addressType', addressType);
  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.PURCHASE.EXPENSES.BASE, config);
  return response.data;
}, 'getExpenses');

const createExpenses = withErrorHandling(async expenseData => {
  const { formData } = buildMultipartPayload(expenseData, 'receipts', 'attachment');
  const response = await axiosConfig.post(API_ROUTES.PURCHASE.EXPENSES.CREATE, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}, 'createExpenses');

const updateExpenses = withErrorHandling(async ({ expenseId, expenseData }) => {
  const { formData } = buildMultipartPayload(expenseData, 'receipts', 'attachment');
  const response = await axiosConfig.patch(API_ROUTES.PURCHASE.EXPENSES.UPDATE(expenseId), formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}, 'updateExpenses');

const getExpenseCustomerProject = withErrorHandling(async payload => {
  const { customerId, signal } = payload;
  const queryParams = new URLSearchParams({ customerId: customerId });
  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.PURCHASE.EXPENSES.GET_EXPENSE_CUSTOMER_PROJECT, config);
  return response.data;
}, 'getExpenseCustomerProject');

const getExpenseById = withErrorHandling(async payload => {
  const { expenseId, signal } = payload;

  let config = { ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.PURCHASE.EXPENSES.GET_EXPENSE_BY_ID(expenseId), { ...config });
  return response.data;
}, 'getExpenseById');

const removeExpenses = withErrorHandling(async payload => {
  const { expenseId } = payload;
  const response = await axiosConfig.delete(API_ROUTES.PURCHASE.EXPENSES.DELETE(expenseId), {});
  return response.data;
}, 'removeExpenses');

const expenseFileUpload = withErrorHandling(async fileData => {
  const response = await axiosConfig.post(API_ROUTES.FILE.UPLOAD, fileData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}, 'expenseFileUpload');

const getExpenseExports = withErrorHandling(async payload => {
  const config = buildDocumentExportRequestConfig(payload, { dateField: 'date', partyField: 'partyId', extraFields: ['country', 'state', 'city', 'addressType'] });
  const response = await axiosConfig.get(API_ROUTES.PURCHASE.EXPENSES.EXPORT, config);
  return response.data;
}, 'getExpenseExports');

export const expensesService = {
  getExpenses,
  createExpenses,
  updateExpenses,
  getExpenseCustomerProject,
  getExpenseById,
  removeExpenses,
  expenseFileUpload,
  getExpenseExports,
};
