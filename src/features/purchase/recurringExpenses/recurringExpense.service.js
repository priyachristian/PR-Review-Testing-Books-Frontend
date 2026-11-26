import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { buildMultipartPayload } from 'utils/multipartHelper';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getRecurringExpenses = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, signal } = payload;
  const queryParams = new URLSearchParams({
    page: page,
    limit: limit,
  });
  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.PURCHASE.RECURRING_EXPENSE.BASE, config);
  return response.data;
}, 'getRecurringExpenses');

const createRecurringExpenses = withErrorHandling(async recurringExpenseData => {
  const { formData } = buildMultipartPayload(recurringExpenseData, 'receipts', 'attachment');
  const response = await axiosConfig.post(API_ROUTES.PURCHASE.RECURRING_EXPENSE.CREATE, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}, 'createRecurringExpenses');

const updateRecurringExpenses = withErrorHandling(async ({ expenseId, recurringExpenseData }) => {
  const { formData } = buildMultipartPayload(recurringExpenseData, 'receipts', 'attachment');
  const response = await axiosConfig.patch(API_ROUTES.PURCHASE.RECURRING_EXPENSE.UPDATE(expenseId), formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}, 'updateRecurringExpenses');

const getRecurringExpenseCustomerProject = withErrorHandling(async payload => {
  const { customerId, signal } = payload;
  const queryParams = new URLSearchParams({
    customerId: customerId,
  });
  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.PURCHASE.RECURRING_EXPENSE.GET_RECURRING_EXPENSES, config);
  return response.data;
}, 'getRecurringExpenseCustomerProject');

const getRecurringExpenseById = withErrorHandling(async payload => {
  const { recurringExpenseId, signal } = payload;

  let config = { ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.PURCHASE.RECURRING_EXPENSE.GET(recurringExpenseId), { ...config });
  return response.data;
}, 'getRecurringExpenseById');

const updateStatus = withErrorHandling(async payload => {
  const { expenseId, status } = payload;
  const response = await axiosConfig.patch(API_ROUTES.PURCHASE.RECURRING_EXPENSE.UPDATE_STATUS(expenseId), { status }, {});
  return response.data;
}, 'updateStatus');

const removeRecurringExpense = withErrorHandling(async payload => {
  const { expenseId } = payload;
  const response = await axiosConfig.delete(API_ROUTES.PURCHASE.RECURRING_EXPENSE.DELETE(expenseId), {});
  return response.data;
}, 'removeRecurringExpense');

const createExpenseFromRecurring = withErrorHandling(async payload => {
  const { id } = payload;
  const response = await axiosConfig.post(API_ROUTES.PURCHASE.RECURRING_EXPENSE.CREATE_EXPENSE(id));
  return response.data;
}, 'createExpenseFromRecurring');

export const recurringExpenseService = {
  getRecurringExpenses,
  createRecurringExpenses,
  updateRecurringExpenses,
  getRecurringExpenseCustomerProject,
  getRecurringExpenseById,
  updateStatus,
  removeRecurringExpense,
  createExpenseFromRecurring,
};
