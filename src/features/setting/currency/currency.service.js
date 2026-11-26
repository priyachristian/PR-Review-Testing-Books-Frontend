import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling } from '@/utils/serviceHelper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getCurrencies = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, pagination = true } = payload || {};
  const response = await axiosConfig.get(API_ROUTES.CURRENCY.BASE, {
    params: { page, limit, pagination },
  });
  return response.data;
}, 'getCurrencies');

const createCurrency = withErrorHandling(async payload => {
  const response = await axiosConfig.post(API_ROUTES.CURRENCY.BASE, payload?.body);
  return response.data;
}, 'createCurrency');

const updateCurrency = withErrorHandling(async payload => {
  const { currencyId, body } = payload;
  const response = await axiosConfig.put(API_ROUTES.CURRENCY.UPDATE(currencyId), body);
  return response.data;
}, 'updateCurrency');

const deleteCurrency = withErrorHandling(async payload => {
  const { currencyId } = payload;
  const response = await axiosConfig.delete(API_ROUTES.CURRENCY.DELETE(currencyId), {});
  return response.data;
}, 'deleteCurrency');

export const currencyService = {
  getCurrencies,
  createCurrency,
  updateCurrency,
  deleteCurrency,
};
