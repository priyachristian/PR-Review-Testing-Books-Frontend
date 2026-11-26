import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { buildMultipartPayload } from 'utils/multipartHelper';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { buildDocumentExportRequestConfig } from '@/utils/documentExportQuery';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getDeliveryChallans = withErrorHandling(async payload => {
  const {
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    search = '',
    challanDate = null,
    startDate = null,
    endDate = null,
    status = '',
    signal,
    customerId,
    sortBy = '',
    division = '',
    branch = '',
    addedBy = '',
    isSplit = false,
    country = '',
    state = '',
    city = '',
    addressType = '',
  } = payload;
  const queryParams = new URLSearchParams({
    page: page,
    limit: limit,
  });
  if (isSplit) {
    queryParams.append('isSplit', true);
  }
  if (search) {
    queryParams.append('search', search);
  }

  if (sortBy) queryParams.append('sortBy', sortBy);

  if (challanDate) {
    queryParams.append('challanDate', challanDate);
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
  if (customerId) {
    queryParams.append('customerId', customerId);
  }
  if (addedBy) {
    queryParams.append('addedBy', addedBy);
  }
  if (country) queryParams.append('country', country);
  if (state) queryParams.append('state', state);
  if (city) queryParams.append('city', city);
  if (addressType) queryParams.append('addressType', addressType);
  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.SALES.DELIVERY_CHALLANS.BASE, config);
  return response.data;
}, 'getDeliveryChallans');

const createDeliveryChallans = async deliveryChallanData => {
  const { formData } = buildMultipartPayload(deliveryChallanData, 'attachments', 'attachment');
  const response = await axiosConfig.post(API_ROUTES.SALES.DELIVERY_CHALLANS.CREATE, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

const updateDeliveryChallans = async (deliveryId, deliveryChallanData) => {
  const { formData } = buildMultipartPayload(deliveryChallanData, 'attachments', 'attachment');
  const response = await axiosConfig.patch(API_ROUTES.SALES.DELIVERY_CHALLANS.UPDATE(deliveryId), formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

const deliveryFileUpload = withErrorHandling(async fileData => {
  const response = await axiosConfig.post(API_ROUTES.FILE.UPLOAD, fileData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}, 'deliveryFileUpload');

const updateStatus = withErrorHandling(async payload => {
  const { deliveryChallanId, status } = payload;
  const response = await axiosConfig.patch(API_ROUTES.SALES.DELIVERY_CHALLANS.UPDATE_SATUS(deliveryChallanId), { status }, {});
  return response.data;
}, 'updateStatus');

const getDeliveryChallanById = withErrorHandling(async payload => {
  const { deliveryChallanId, signal } = payload;

  const config = { ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.SALES.DELIVERY_CHALLANS.GET_DELIVERY_CHALLAN_BY_ID(deliveryChallanId), { ...config });
  return response.data;
}, 'getDeliveryChallanById');

const getDeliveryChallanDropdownForConvert = withErrorHandling(async payload => {
  const { customerId, signal } = payload;
  const queryParams = new URLSearchParams({
    customerId: customerId,
  });

  let config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.SALES.DELIVERY_CHALLANS.GET_CHALLAN_FROM_SALES_ORDER, config);
  return response.data;
}, 'getDeliveryChallanDropdownForConvert');

const getPendingItemsDeliveryChallan = withErrorHandling(async payload => {
  const { ids, signal } = payload;
  const queryParams = new URLSearchParams({
    challanId: ids,
  });

  let config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.SALES.DELIVERY_CHALLANS.GET_PENDING_ITEM_DELIVERY_CHALLAN, config);
  return response.data;
}, 'getPendingItemsDeliveryChallan');

const removeDeliveryChallan = withErrorHandling(async payload => {
  const { deliveryChallanId } = payload;

  const response = await axiosConfig.delete(API_ROUTES.SALES.DELIVERY_CHALLANS.REMOVE(deliveryChallanId), {});
  return response.data;
}, 'removeDeliveryChallan');

const getDeliveryChallanExports = withErrorHandling(async payload => {
  const config = buildDocumentExportRequestConfig(payload, { dateField: 'challanDate', extraFields: ['country', 'state', 'city', 'addressType'] });
  const response = await axiosConfig.get(API_ROUTES.SALES.DELIVERY_CHALLANS.EXPORT, config);
  return response.data;
}, 'getDeliveryChallanExports');

export const deliveryChallanService = {
  getDeliveryChallans,
  createDeliveryChallans,
  updateDeliveryChallans,
  deliveryFileUpload,
  updateStatus,
  getDeliveryChallanById,
  removeDeliveryChallan,
  getDeliveryChallanDropdownForConvert,
  getPendingItemsDeliveryChallan,
  getDeliveryChallanExports,
};
