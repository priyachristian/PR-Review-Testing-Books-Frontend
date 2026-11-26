// Config
import axiosConfig from 'app/axiosConfig';

// Utils
import { API_ROUTES } from '@/utils/apiRoute';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getCustomerOrders = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, search = '', startDate = null, endDate = null, status = '', sortBy = '', signal, division, branch, orderType, sampleCatalogId, customerId } = payload;

  const queryParams = new URLSearchParams({ page, limit });
  if (search) queryParams.append('search', search);
  if (sortBy) queryParams.append('sortBy', sortBy);
  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }
  if (status) queryParams.append('status', status);
  if (orderType) queryParams.append('orderType', orderType);
  if (sampleCatalogId) queryParams.append('sampleCatalogId', sampleCatalogId);
  if (customerId) queryParams.append('customerId', customerId);
  if (division) queryParams.append('divisionId', division);
  if (branch) queryParams.append('branchId', branch);

  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.CUSTOMER_ORDER.BASE, config);
  return response.data;
}, 'getCustomerOrders');

const updateStatus = withErrorHandling(async payload => {
  const { customerOrderId, status, rejectionReason } = payload;
  const response = await axiosConfig.patch(
    API_ROUTES.CUSTOMER_ORDER.UPDATE_STATUS(customerOrderId),
    {
      status,
      ...(rejectionReason ? { rejectionReason } : {}),
    },
    {}
  );
  return response.data;
}, 'updateStatus');

const getCustomerOrderById = withErrorHandling(async payload => {
  const { customerOrderId, branchId, signal } = payload;

  const config = { ...withAbortSignal(signal) };
  if (branchId) {
    config.params = { branchId };
  }

  const response = await axiosConfig.get(API_ROUTES.CUSTOMER_ORDER.GET_BY_ID(customerOrderId), config);
  return response.data;
}, 'getCustomerOrderById');

export const customerOrderService = {
  getCustomerOrders,
  updateStatus,
  getCustomerOrderById,
};
