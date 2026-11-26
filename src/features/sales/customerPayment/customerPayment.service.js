// Config
import axiosConfig from 'app/axiosConfig';

// Utils
import { API_ROUTES } from '@/utils/apiRoute';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getCustomerPayments = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, search = '', paymentDate = null, startDate = null, endDate = null, status = '', paymentMode = '', customerId = '', sortBy = '', signal } = payload;

  const queryParams = new URLSearchParams({ page, limit });
  if (search) queryParams.append('search', search);
  if (sortBy) queryParams.append('sortBy', sortBy);
  if (paymentDate) queryParams.append('paymentDate', paymentDate);
  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }
  if (status) queryParams.append('status', status);
  if (paymentMode) queryParams.append('paymentMode', paymentMode);
  if (customerId) queryParams.append('customerId', customerId);

  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.CUSTOMER_PAYMENT.BASE, config);
  return response.data;
}, 'getCustomerPayments');

const getCustomerPaymentById = withErrorHandling(async payload => {
  const { customerPaymentId, signal } = payload;
  const response = await axiosConfig.get(API_ROUTES.CUSTOMER_PAYMENT.GET_BY_ID(customerPaymentId), { ...withAbortSignal(signal) });
  return response.data;
}, 'getCustomerPaymentById');

const rejectCustomerPayment = withErrorHandling(async payload => {
  const { customerPaymentId, rejectionReason } = payload;
  const response = await axiosConfig.patch(API_ROUTES.CUSTOMER_PAYMENT.REJECT(customerPaymentId), { rejectionReason }, {});
  return response.data;
}, 'rejectCustomerPayment');

// Links an already-created PaymentReceived back to the customer-submitted payment, marking it
// recorded. The PaymentReceived itself (and its journal) is created by the Payment Received flow.
const recordCustomerPayment = withErrorHandling(async payload => {
  const { customerPaymentId, paymentReceivedId, paymentReceivedNo } = payload;
  const response = await axiosConfig.patch(API_ROUTES.CUSTOMER_PAYMENT.RECORD(customerPaymentId), { paymentReceivedId, paymentReceivedNo }, {});
  return response.data;
}, 'recordCustomerPayment');

export const customerPaymentService = {
  getCustomerPayments,
  getCustomerPaymentById,
  rejectCustomerPayment,
  recordCustomerPayment,
};
