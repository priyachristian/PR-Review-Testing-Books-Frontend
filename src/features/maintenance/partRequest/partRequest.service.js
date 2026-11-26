import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getPartRequests = withErrorHandling(async payload => {
  const {
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    pagination = true,
    search = '',
    sortBy = '',
    status = '',
    mrId = '',
    machineId = '',
    sparePartId = '',
    requestedBy = '',
    fromDate = '',
    toDate = '',
    requestedDate = '',
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
  if (mrId) queryParams.append('mrId', mrId);
  if (machineId) queryParams.append('machineId', machineId);
  if (sparePartId) queryParams.append('sparePartId', sparePartId);
  if (requestedBy) queryParams.append('requestedBy', requestedBy);

  const rangeStart = fromDate || requestedDate;
  const rangeEnd = toDate || requestedDate;
  if (rangeStart) queryParams.append('fromDate', rangeStart);
  if (rangeEnd) queryParams.append('toDate', rangeEnd);

  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.MAINTENANCE.PART_REQUEST.BASE, config);
  return response.data;
}, 'getPartRequests');

const approvePartRequest = withErrorHandling(async payload => {
  const { partRequestId, approvedQty, approvalRemark } = payload || {};
  const body = {
    ...(approvedQty != null ? { approvedQty } : {}),
    ...(approvalRemark !== undefined ? { approvalRemark } : {}),
  };
  const response = await axiosConfig.patch(API_ROUTES.MAINTENANCE.PART_REQUEST.APPROVE(partRequestId), body);
  return response.data;
}, 'approvePartRequest');

const issuePartRequest = withErrorHandling(async payload => {
  const { partRequestId, issuedQty } = payload || {};
  const body = {
    ...(issuedQty != null ? { issuedQty } : {}),
  };
  const response = await axiosConfig.patch(API_ROUTES.MAINTENANCE.PART_REQUEST.ISSUE(partRequestId), body);
  return response.data;
}, 'issuePartRequest');

const shortPartRequest = withErrorHandling(async payload => {
  const { partRequestId } = payload || {};
  const response = await axiosConfig.patch(API_ROUTES.MAINTENANCE.PART_REQUEST.SHORT(partRequestId));
  return response.data;
}, 'shortPartRequest');

export const partRequestService = {
  getPartRequests,
  approvePartRequest,
  issuePartRequest,
  shortPartRequest,
};
