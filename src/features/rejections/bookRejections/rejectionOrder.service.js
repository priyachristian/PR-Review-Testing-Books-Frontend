import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { buildMultipartPayload } from 'utils/multipartHelper';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getRejectionOrders = withErrorHandling(async payload => {
  const {
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    search = '',
    status = '',
    startDate = null,
    endDate = null,
    sortBy = '',
    division = '',
    branch = '',
    customerId = '',
    addedBy = '',
    signal,
  } = payload || {};

  const queryParams = new URLSearchParams({ page, limit });
  if (search) queryParams.append('search', search);
  if (sortBy) queryParams.append('sortBy', sortBy);
  if (status) queryParams.append('status', status);
  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }
  if (division) queryParams.append('divisionId', division);
  if (branch) queryParams.append('branchId', branch);
  if (customerId) queryParams.append('customerId', customerId);
  if (addedBy) queryParams.append('addedBy', addedBy);

  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.REJECTION.ORDERS.BASE, config);
  return response.data;
}, 'getRejectionOrders');

const createRejectionOrder = async data => {
  const { formData } = buildMultipartPayload(data, 'attachments', 'attachment');
  const response = await axiosConfig.post(API_ROUTES.REJECTION.ORDERS.CREATE, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Workflow steps (count, settle, reasons, recovery, status); booking fields are locked server-side.
const saveRejectionWorkflow = async (rejectionOrderId, data) => {
  const response = await axiosConfig.patch(API_ROUTES.REJECTION.ORDERS.SAVE_WORKFLOW(rejectionOrderId), data);
  return response.data;
};

// Booking edit, accepted by the API only while the order is Pending.
const updateRejectionBooking = async (rejectionOrderId, data) => {
  const { formData, hasFiles } = buildMultipartPayload(data, 'attachments', 'attachment');
  const url = API_ROUTES.REJECTION.ORDERS.UPDATE_BOOKING(rejectionOrderId);
  const response = hasFiles ? await axiosConfig.put(url, formData, { headers: { 'Content-Type': 'multipart/form-data' } }) : await axiosConfig.put(url, data);
  return response.data;
};

const getRejectionOrderById = withErrorHandling(async payload => {
  const { rejectionOrderId, signal } = payload;
  const config = { ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.REJECTION.ORDERS.GET_BY_ID(rejectionOrderId), config);
  return response.data;
}, 'getRejectionOrderById');

const removeRejectionOrder = withErrorHandling(async payload => {
  const { rejectionOrderId } = payload;
  const response = await axiosConfig.delete(API_ROUTES.REJECTION.ORDERS.REMOVE(rejectionOrderId));
  return response.data;
}, 'removeRejectionOrder');

const getRejectionOrderInventory = withErrorHandling(async () => {
  const response = await axiosConfig.get(API_ROUTES.REJECTION.ORDERS.INVENTORY_SUMMARY);
  return response.data;
}, 'getRejectionOrderInventory');

const getRejectionOrderAnalysis = withErrorHandling(async (payload = {}) => {
  const { itemId } = payload;
  const queryParams = new URLSearchParams({});
  if (itemId) queryParams.append('itemId', itemId);
  const response = await axiosConfig.get(API_ROUTES.REJECTION.ORDERS.ANALYSIS_SUMMARY, { params: queryParams });
  return response.data;
}, 'getRejectionOrderAnalysis');

// Single bulk call: returns BOM/price recovery data for every item in the given rejection order.
// Response shape: { data: [{ itemId, isBomBased, components: [{ itemId, name, qtyPerUnit, unitPrice }] }] }
const getRejectionRecoveryBom = withErrorHandling(async payload => {
  const { rejectionOrderId, signal } = payload;
  const config = { ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.REJECTION.ORDERS.RECOVERY_BOM(rejectionOrderId), config);
  return response.data;
}, 'getRejectionRecoveryBom');

const getInvoiceDropdown = withErrorHandling(async payload => {
  const { customerId, page = 1, limit = DEFAULT_PAGE_SIZE, search = '', signal } = payload || {};
  const queryParams = new URLSearchParams({ customerId, page, limit });
  if (search) queryParams.append('search', search);
  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.REJECTION.ORDERS.INVOICE_DROPDOWN, config);
  return response.data;
}, 'getInvoiceDropdown');

export const rejectionOrderService = {
  getRejectionOrders,
  createRejectionOrder,
  saveRejectionWorkflow,
  updateRejectionBooking,
  getRejectionOrderById,
  removeRejectionOrder,
  getRejectionOrderInventory,
  getRejectionOrderAnalysis,
  getRejectionRecoveryBom,
  getInvoiceDropdown,
};
