import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getSpareStockLedgers = withErrorHandling(async payload => {
  const {
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    pagination = true,
    search = '',
    sortBy = '',
    sparePartId = '',
    transactionType = '',
    referenceType = '',
    fromDate = '',
    toDate = '',
    date = '',
    signal,
  } = payload || {};
  const queryParams = new URLSearchParams({
    page,
    limit,
    pagination,
  });
  if (search) queryParams.append('search', search);
  if (sortBy) queryParams.append('sortBy', sortBy);
  if (sparePartId) queryParams.append('sparePartId', sparePartId);
  if (transactionType) queryParams.append('transactionType', transactionType);
  if (referenceType) queryParams.append('referenceType', referenceType);

  const rangeStart = fromDate || date;
  const rangeEnd = toDate || date;
  if (rangeStart) queryParams.append('fromDate', rangeStart);
  if (rangeEnd) queryParams.append('toDate', rangeEnd);

  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.MAINTENANCE.SPARE_STOCK_LEDGER.BASE, config);
  return response.data;
}, 'getSpareStockLedgers');

const createAdjustment = withErrorHandling(async payload => {
  const response = await axiosConfig.post(API_ROUTES.MAINTENANCE.SPARE_PART.ADJUSTMENT, payload);
  return response.data;
}, 'createAdjustment');

export const spareStockLedgerService = {
  getSpareStockLedgers,
  createAdjustment,
};
