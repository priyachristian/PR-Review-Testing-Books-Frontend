import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getMaintenancePurchases = withErrorHandling(async payload => {
  const {
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    pagination = true,
    search = '',
    sortBy = '',
    stage = '',
    linkedMrId = '',
    raisedBy = '',
    fromDate = '',
    toDate = '',
    prDate = '',
    signal,
  } = payload || {};
  const queryParams = new URLSearchParams({
    page,
    limit,
    pagination,
  });
  if (search) queryParams.append('search', search);
  if (sortBy) queryParams.append('sortBy', sortBy);
  if (stage) queryParams.append('stage', stage);
  if (linkedMrId) queryParams.append('linkedMrId', linkedMrId);
  if (raisedBy) queryParams.append('raisedBy', raisedBy);

  const rangeStart = fromDate || prDate;
  const rangeEnd = toDate || prDate;
  if (rangeStart) queryParams.append('fromDate', rangeStart);
  if (rangeEnd) queryParams.append('toDate', rangeEnd);

  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.MAINTENANCE.MAINTENANCE_PURCHASE.BASE, config);
  return response.data;
}, 'getMaintenancePurchases');

const getMaintenancePurchaseById = withErrorHandling(async payload => {
  const { maintenancePurchaseId, signal } = payload || {};
  const response = await axiosConfig.get(API_ROUTES.MAINTENANCE.MAINTENANCE_PURCHASE.GET(maintenancePurchaseId), withAbortSignal(signal));
  return response.data;
}, 'getMaintenancePurchaseById');

const createMaintenancePurchase = withErrorHandling(async purchaseData => {
  const response = await axiosConfig.post(API_ROUTES.MAINTENANCE.MAINTENANCE_PURCHASE.BASE, purchaseData);
  return response.data;
}, 'createMaintenancePurchase');

const approveMaintenancePurchase = withErrorHandling(async payload => {
  const { maintenancePurchaseId, items } = payload || {};
  const response = await axiosConfig.patch(API_ROUTES.MAINTENANCE.MAINTENANCE_PURCHASE.APPROVE(maintenancePurchaseId), { items });
  return response.data;
}, 'approveMaintenancePurchase');

const raiseMaintenancePurchasePo = withErrorHandling(async payload => {
  const { maintenancePurchaseId, vendor, expectedDelivery } = payload || {};
  const response = await axiosConfig.patch(API_ROUTES.MAINTENANCE.MAINTENANCE_PURCHASE.RAISE_PO(maintenancePurchaseId), { vendor, expectedDelivery });
  return response.data;
}, 'raiseMaintenancePurchasePo');

const receiveMaintenancePurchase = withErrorHandling(async payload => {
  const { maintenancePurchaseId, items } = payload || {};
  const response = await axiosConfig.patch(API_ROUTES.MAINTENANCE.MAINTENANCE_PURCHASE.RECEIVE(maintenancePurchaseId), { items });
  return response.data;
}, 'receiveMaintenancePurchase');

const getMaintenancePurchaseDropdown = withErrorHandling(async payload => {
  const { signal } = payload || {};
  const config = { ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.MAINTENANCE.MAINTENANCE_PURCHASE.DROPDOWN, config);
  return response.data;
}, 'getMaintenancePurchaseDropdown');

export const maintenancePurchaseService = {
  getMaintenancePurchases,
  getMaintenancePurchaseById,
  createMaintenancePurchase,
  approveMaintenancePurchase,
  raiseMaintenancePurchasePo,
  receiveMaintenancePurchase,
  getMaintenancePurchaseDropdown,
};
