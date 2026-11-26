import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getInventoryLogs = withErrorHandling(async payload => {
  const { signal, ...restPayload } = payload;
  const queryParams = new URLSearchParams({
    page: restPayload.page || 1,
    limit: restPayload.limit || DEFAULT_PAGE_SIZE,
  });

  if (restPayload.search) queryParams.append('search', restPayload.search);
  if (restPayload.sortBy) queryParams.append('sortBy', restPayload.sortBy);
  if (restPayload.branch) queryParams.append('branchId', restPayload.branch);
  if (restPayload.division) queryParams.append('divisionId', restPayload.division);
  if (restPayload.startDate && restPayload.endDate) {
    queryParams.append('startDate', restPayload.startDate);
    queryParams.append('endDate', restPayload.endDate);
  }
  if (restPayload.createdAt) queryParams.append('createdAt', restPayload.createdAt);

  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.INVENTORY.INVENTORY_LOG.BASE, config);
  return response.data;
}, 'getInventoryLogs');

export const inventoryLogsService = {
  getInventoryLogs,
};
