import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';

const buildGstr1QueryParams = ({ startDate = null, endDate = null, periodType = null, period = null, year = null, branchId = null, divisionId = null, status = null, isFirstReturn = false }) => {
  const queryParams = new URLSearchParams();

  if (startDate) queryParams.append('startDate', startDate);
  if (endDate) queryParams.append('endDate', endDate);
  if (periodType) queryParams.append('periodType', periodType);
  if (period) queryParams.append('period', period);
  if (year) queryParams.append('year', year);
  if (branchId) queryParams.append('branchId', branchId);
  if (divisionId) queryParams.append('divisionId', divisionId);
  if (status) queryParams.append('status', status);
  if (isFirstReturn) queryParams.append('isFirstReturn', isFirstReturn);

  return queryParams;
};

const getGstr1Summary = withErrorHandling(async payload => {
  const { startDate = null, endDate = null, periodType = null, period = null, year = null, branchId = null, divisionId = null, status = null, isFirstReturn = false, signal } = payload ?? {};

  const config = { params: buildGstr1QueryParams({ startDate, endDate, periodType, period, year, branchId, divisionId, status, isFirstReturn }), ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.GSTR1.BASE, config);
  return response.data;
}, 'getGstr1Summary');

const downloadGstr1Excel = withErrorHandling(async payload => {
  const { startDate = null, endDate = null, periodType = null, period = null, year = null, branchId = null, divisionId = null, status = null, isFirstReturn = false } = payload ?? {};

  const response = await axiosConfig.get(API_ROUTES.GSTR1.DOWNLOAD, {
    params: buildGstr1QueryParams({ startDate, endDate, periodType, period, year, branchId, divisionId, status, isFirstReturn }),
    responseType: 'blob',
  });
  return response.data;
}, 'downloadGstr1Excel');

export const gstr1Service = {
  getGstr1Summary,
  downloadGstr1Excel,
};
