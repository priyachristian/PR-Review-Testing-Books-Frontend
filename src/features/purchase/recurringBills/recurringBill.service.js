import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getRecurringBills = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, signal, startDate, endDate, recurringBillDate, search, status } = payload;
  const queryParams = new URLSearchParams({
    page: page,
    limit: limit,
  });
  if (search) {
    queryParams.append('search', search);
  }
  if (recurringBillDate) {
    queryParams.append('recurringBillDate', recurringBillDate);
  }
  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }
  if (status) {
    queryParams.append('status', status);
  }
  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.PURCHASE.RECURRING_BILL.BASE, config);
  return response.data;
}, 'getRecurringBills');

const createRecurringBills = withErrorHandling(async recurringBillData => {
  const response = await axiosConfig.post(API_ROUTES.PURCHASE.RECURRING_BILL.CREATE, recurringBillData, {});
  return response.data;
}, 'createRecurringBills');

const updateRecurringBills = withErrorHandling(async ({ billsId, recurringBillData }) => {
  const response = await axiosConfig.patch(API_ROUTES.PURCHASE.RECURRING_BILL.UPDATE(billsId), recurringBillData, {});
  return response.data;
}, 'updateRecurringBills');

const updateStatus = withErrorHandling(async payload => {
  const { billsId, status } = payload;
  const response = await axiosConfig.patch(API_ROUTES.PURCHASE.RECURRING_BILL.UPDATE_STATUS(billsId), { status }, {});
  return response.data;
}, 'updateStatus');

const getRecurringBillById = withErrorHandling(async payload => {
  const { recurringBillId, signal } = payload;

  let config = { ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.PURCHASE.RECURRING_BILL.GET(recurringBillId), {
    ...config,
  });
  return response.data;
}, 'getRecurringBillById');

const createBillFromRecurring = withErrorHandling(async payload => {
  const { id } = payload;
  const response = await axiosConfig.post(`${API_ROUTES.PURCHASE.RECURRING_BILL.CREATE_BILL(id)}`);
  return response.data;
}, 'createBillFromRecurring');

const removeRecurringBill = withErrorHandling(async payload => {
  const { billsId } = payload;
  const response = await axiosConfig.delete(API_ROUTES.PURCHASE.RECURRING_BILL.DELETE(billsId), {});
  return response.data;
}, 'removeRecurringBill');

export const recurringBillsService = {
  getRecurringBills,
  createRecurringBills,
  updateRecurringBills,
  updateStatus,
  getRecurringBillById,
  createBillFromRecurring,
  removeRecurringBill,
};
