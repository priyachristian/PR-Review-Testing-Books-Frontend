import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { buildMultipartPayload } from 'utils/multipartHelper';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { buildDocumentExportRequestConfig } from '@/utils/documentExportQuery';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getPurchaseOrder = withErrorHandling(async payload => {
  const {
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    search = '',
    purchaseOrderDate = null,
    startDate = null,
    endDate = null,
    status = '',
    signal,
    sortBy = '',
    division = '',
    branch = '',
    addedBy = '',
    customerId,
    country = '',
    state = '',
    city = '',
    addressType = '',
  } = payload;
  const queryParams = new URLSearchParams({
    page: page,
    limit: limit,
  });
  if (search) {
    queryParams.append('search', search);
  }
  if (sortBy) {
    queryParams.append('sortBy', sortBy);
  }
  if (purchaseOrderDate) {
    queryParams.append('date', purchaseOrderDate);
  }
  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }
  if (status) {
    queryParams.append('status', status);
  }
  if (division) {
    queryParams.append('divisionId', division);
  }
  if (branch) {
    queryParams.append('branchId', branch);
  }
  if (addedBy) {
    queryParams.append('addedBy', addedBy);
  }
  if (customerId) {
    queryParams.append('customerId', customerId);
  }
  if (country) queryParams.append('country', country);
  if (state) queryParams.append('state', state);
  if (city) queryParams.append('city', city);
  if (addressType) queryParams.append('addressType', addressType);
  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.PURCHASE.PURCHASE_ORDER.BASE, config);
  return response.data;
}, 'getPurchaseOrder');

const createPurchaseOrders = async purchaseOrderData => {
  try {
    const { formData } = buildMultipartPayload(purchaseOrderData, 'attachments', 'attachment');
    const response = await axiosConfig.post(API_ROUTES.PURCHASE.PURCHASE_ORDER.CREATE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error create purchase order :', error);
    throw error;
  }
};

const updatePurchaseOrders = async ({ purchaseId, purchaseOrderData }) => {
  try {
    const { formData } = buildMultipartPayload(purchaseOrderData, 'attachments', 'attachment');
    const response = await axiosConfig.patch(API_ROUTES.PURCHASE.PURCHASE_ORDER.UPDATE(purchaseId), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error update purchase order :', error);
    throw error;
  }
};

const purchaseOrderFileUpload = withErrorHandling(async fileData => {
  const response = await axiosConfig.post(API_ROUTES.FILE.UPLOAD, fileData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}, 'purchaseOrderFileUpload');

const updateStatus = withErrorHandling(async payload => {
  const { purchaseOrderId, status } = payload;
  const response = await axiosConfig.patch(API_ROUTES.PURCHASE.PURCHASE_ORDER.UPDATE_STATUS(purchaseOrderId), { status }, {});
  return response.data;
}, 'updateStatus');

const getPurchaseOrderById = withErrorHandling(async payload => {
  const { purchaseOrderId, signal } = payload;

  let config = { ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.PURCHASE.PURCHASE_ORDER.GET_PURCHASE_ORDER_BY_ID(purchaseOrderId), { ...config });
  return response.data;
}, 'getPurchaseOrderById');

const getPurchaseOrderDropdownforConvert = withErrorHandling(async payload => {
  const { vendor, status, signal } = payload;
  const queryParams = new URLSearchParams({
    vendor: vendor,
    status: status,
  });

  let config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.PURCHASE.PURCHASE_ORDER.GET_PURCHASE_DROPDOWN, config);
  return response.data;
}, 'getPurchaseOrderDropdownforConvert');

const getPendingItemsPurchaseOrder = withErrorHandling(async payload => {
  const { ids, signal } = payload;
  const queryParams = new URLSearchParams({
    id: ids,
  });

  let config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.PURCHASE.PURCHASE_ORDER.GET_PENDING_ITEM_PURCHASE_ORDER, config);
  return response.data;
}, 'getPendingItemsPurchaseOrder');

const getPurchaseOrderExports = withErrorHandling(async payload => {
  const config = buildDocumentExportRequestConfig(payload, {
    dateField: 'purchaseOrderDate',
    dateQueryKey: 'date',
    extraFields: ['country', 'state', 'city', 'addressType'],
  });
  const response = await axiosConfig.get(API_ROUTES.PURCHASE.PURCHASE_ORDER.EXPORT, config);
  return response.data;
}, 'getPurchaseOrderExports');

const removePurchaseOrder = withErrorHandling(async payload => {
  const { purchaseOrderId } = payload;
  const response = await axiosConfig.delete(API_ROUTES.PURCHASE.PURCHASE_ORDER.REMOVE(purchaseOrderId), {});
  return response.data;
}, 'removePurchaseOrder');

export const purchaseOrderService = {
  getPurchaseOrder,
  createPurchaseOrders,
  updatePurchaseOrders,
  purchaseOrderFileUpload,
  updateStatus,
  getPurchaseOrderById,
  getPurchaseOrderDropdownforConvert,
  getPendingItemsPurchaseOrder,
  removePurchaseOrder,
  getPurchaseOrderExports,
};
