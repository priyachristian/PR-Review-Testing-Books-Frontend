import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getMaintenanceRequests = withErrorHandling(async payload => {
  const {
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    pagination = true,
    search = '',
    sortBy = '',
    status = '',
    type = '',
    priority = '',
    machineId = '',
    branchId = '',
    raisedBy = '',
    isMachineStopped = '',
    fromDate = '',
    toDate = '',
    requestDate = '',
    signal,
  } = payload || {};
  const queryParams = new URLSearchParams({
    page,
    limit,
    pagination,
  });
  if (search) queryParams.append('search', search);
  if (sortBy) queryParams.append('sortBy', sortBy);
  if (status) queryParams.append('status', status);
  if (type) queryParams.append('type', type);
  if (priority) queryParams.append('priority', priority);
  if (machineId) queryParams.append('machineId', machineId);
  if (branchId) queryParams.append('branchId', branchId);
  if (raisedBy) queryParams.append('raisedBy', raisedBy);
  if (isMachineStopped === true || isMachineStopped === false || isMachineStopped === 'true' || isMachineStopped === 'false') {
    queryParams.append('isMachineStopped', String(isMachineStopped));
  }

  const rangeStart = fromDate || requestDate;
  const rangeEnd = toDate || requestDate;
  if (rangeStart) queryParams.append('fromDate', rangeStart);
  if (rangeEnd) queryParams.append('toDate', rangeEnd);

  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.MAINTENANCE.MAINTENANCE_REQUEST.BASE, config);
  return response.data;
}, 'getMaintenanceRequests');

const getMaintenanceRequestById = withErrorHandling(async payload => {
  const { maintenanceRequestId, signal } = payload || {};
  const response = await axiosConfig.get(API_ROUTES.MAINTENANCE.MAINTENANCE_REQUEST.GET(maintenanceRequestId), withAbortSignal(signal));
  return response.data;
}, 'getMaintenanceRequestById');

const createMaintenanceRequest = withErrorHandling(async maintenanceRequestData => {
  const response = await axiosConfig.post(API_ROUTES.MAINTENANCE.MAINTENANCE_REQUEST.BASE, maintenanceRequestData);
  return response.data;
}, 'createMaintenanceRequest');

const approveMaintenanceRequest = withErrorHandling(async payload => {
  const { maintenanceRequestId, remark } = payload || {};
  const body = remark ? { remark } : {};
  const response = await axiosConfig.patch(API_ROUTES.MAINTENANCE.MAINTENANCE_REQUEST.APPROVE(maintenanceRequestId), body);
  return response.data;
}, 'approveMaintenanceRequest');

const rejectMaintenanceRequest = withErrorHandling(async payload => {
  const { maintenanceRequestId, rejectReason } = payload || {};
  const response = await axiosConfig.patch(API_ROUTES.MAINTENANCE.MAINTENANCE_REQUEST.REJECT(maintenanceRequestId), { rejectReason });
  return response.data;
}, 'rejectMaintenanceRequest');

const assignMaintenanceRequest = withErrorHandling(async payload => {
  const { maintenanceRequestId, ...body } = payload || {};
  const response = await axiosConfig.patch(API_ROUTES.MAINTENANCE.MAINTENANCE_REQUEST.ASSIGN(maintenanceRequestId), body);
  return response.data;
}, 'assignMaintenanceRequest');

const startMaintenanceRequestWork = withErrorHandling(async payload => {
  const { maintenanceRequestId } = payload || {};
  const response = await axiosConfig.patch(API_ROUTES.MAINTENANCE.MAINTENANCE_REQUEST.START_WORK(maintenanceRequestId));
  return response.data;
}, 'startMaintenanceRequestWork');

const completeMaintenanceRequest = withErrorHandling(async payload => {
  const { maintenanceRequestId, ...body } = payload || {};
  const response = await axiosConfig.patch(API_ROUTES.MAINTENANCE.MAINTENANCE_REQUEST.COMPLETE(maintenanceRequestId), body);
  return response.data;
}, 'completeMaintenanceRequest');

const closeMaintenanceRequest = withErrorHandling(async payload => {
  const { maintenanceRequestId, ...body } = payload || {};
  const response = await axiosConfig.patch(API_ROUTES.MAINTENANCE.MAINTENANCE_REQUEST.CLOSE(maintenanceRequestId), body);
  return response.data;
}, 'closeMaintenanceRequest');

const requestMaintenanceRequestPart = withErrorHandling(async payload => {
  const { maintenanceRequestId, sparePartId, requestedQty } = payload || {};
  const response = await axiosConfig.post(API_ROUTES.MAINTENANCE.MAINTENANCE_REQUEST.REQUEST_PART(maintenanceRequestId), { sparePartId, requestedQty });
  return response.data;
}, 'requestMaintenanceRequestPart');

const getMaintenanceRequestDropdown = withErrorHandling(async payload => {
  const { signal } = payload || {};
  const config = { ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.MAINTENANCE.MAINTENANCE_REQUEST.DROPDOWN, config);
  return response.data;
}, 'getMaintenanceRequestDropdown');

export const maintenanceRequestService = {
  getMaintenanceRequests,
  getMaintenanceRequestById,
  createMaintenanceRequest,
  approveMaintenanceRequest,
  rejectMaintenanceRequest,
  assignMaintenanceRequest,
  startMaintenanceRequestWork,
  completeMaintenanceRequest,
  closeMaintenanceRequest,
  requestMaintenanceRequestPart,
  getMaintenanceRequestDropdown,
};
