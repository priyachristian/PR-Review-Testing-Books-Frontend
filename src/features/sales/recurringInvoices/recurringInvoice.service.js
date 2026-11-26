import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getRecurringInvoices = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, signal, search, recurringInvoiceDate, startDate, endDate, status } = payload;
  const queryParams = new URLSearchParams({
    page: page,
    limit: limit,
  });
  if (search) {
    queryParams.append('search', search);
  }
  if (recurringInvoiceDate) {
    queryParams.append('recurringInvoiceDate', recurringInvoiceDate);
  }
  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }
  if (status) {
    queryParams.append('status', status);
  }
  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.SALES.RECURRING_INVOICE.BASE, config);
  return response.data;
}, 'getRecurringInvoices');

const createRecurringInvoices = withErrorHandling(async recurringInvoiceData => {
  const response = await axiosConfig.post(API_ROUTES.SALES.RECURRING_INVOICE.CREATE, recurringInvoiceData, {});
  return response.data;
}, 'createRecurringInvoices');

const updateRecurringInvoices = withErrorHandling(async ({ recurringId, recurringInvoiceData }) => {
  const response = await axiosConfig.patch(API_ROUTES.SALES.RECURRING_INVOICE.UPDATE(recurringId), recurringInvoiceData, {});
  return response.data;
}, 'updateRecurringInvoices');

const updateStatus = withErrorHandling(async payload => {
  const { recurringId, status } = payload;
  const response = await axiosConfig.patch(API_ROUTES.SALES.RECURRING_INVOICE.UPDATE_STATUS(recurringId), { status }, {});
  return response.data;
}, 'updateStatus');

const getRecurringInvoicesById = withErrorHandling(async payload => {
  const { recurringId, signal } = payload;

  let config = { ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.SALES.RECURRING_INVOICE.GET(recurringId), {
    ...config,
  });
  return response.data;
}, 'getRecurringInvoicesById');

const createInvoiceFromRecurring = withErrorHandling(async payload => {
  const { id } = payload;
  const response = await axiosConfig.post(`${API_ROUTES.SALES.RECURRING_INVOICE.CREATE_INVOICE(id)}`);
  return response.data;
}, 'createInvoiceFromRecurring');

const removeRecurringInvoice = withErrorHandling(async payload => {
  const { recurringId } = payload;
  const response = await axiosConfig.delete(API_ROUTES.SALES.RECURRING_INVOICE.DELETE(recurringId), {});
  return response.data;
}, 'removeRecurringInvoice');

export const recurringInvoiceService = {
  getRecurringInvoices,
  createRecurringInvoices,
  updateRecurringInvoices,
  updateStatus,
  getRecurringInvoicesById,
  createInvoiceFromRecurring,
  removeRecurringInvoice,
};
