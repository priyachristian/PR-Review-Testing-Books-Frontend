import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getPriceList = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, search = '', pagination = true, signal } = payload;

  const queryParams = new URLSearchParams({
    page: page,
    limit: limit,
  });
  if (!pagination) {
    queryParams.delete('page');
    queryParams.delete('limit');
    queryParams.append('pagination', pagination);
  }
  if (search) queryParams.append('search', search);

  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.ALL_MASTER.PRICE_LIST.BASE, config);
  return response.data;
}, 'getPriceList');

const createPriceList = withErrorHandling(async priceData => {
  const response = await axiosConfig.post(API_ROUTES.ALL_MASTER.PRICE_LIST.CREATE, priceData, {});
  return response.data;
}, 'createPriceList');

const updatePriceList = withErrorHandling(async ({ priceListId, priceData }) => {
  const response = await axiosConfig.patch(API_ROUTES.ALL_MASTER.PRICE_LIST.UPDATE(priceListId), priceData, {});
  return response.data;
}, 'updatePriceList');

const deletePriceData = withErrorHandling(async payload => {
  const { priceListId } = payload;
  const response = await axiosConfig.delete(API_ROUTES.ALL_MASTER.PRICE_LIST.DELETE(priceListId), {});
  return response.data;
}, 'deletePriceData');

const getPriceListById = withErrorHandling(async payload => {
  const { priceListId, signal } = payload;

  let config = { ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.ALL_MASTER.PRICE_LIST.GET_BY_ID(priceListId), {
    ...config,
  });
  return response.data;
}, 'getPriceListById');

const getPriceListDropdown = withErrorHandling(async payload => {
  const { signal } = payload;

  const queryParams = new URLSearchParams({});

  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.ALL_MASTER.PRICE_LIST.PRICE_LIST_DROPDOWN, config);
  return response.data;
}, 'getPriceListDropdown');

export const priceListService = {
  getPriceList,
  createPriceList,
  updatePriceList,
  deletePriceData,
  getPriceListById,
  getPriceListDropdown,
};
