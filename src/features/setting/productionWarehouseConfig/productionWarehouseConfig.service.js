import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withAbortSignal, withErrorHandling } from '@/utils/serviceHelper';

const getProductionWarehouseConfigs = withErrorHandling(async payload => {
  const { search, signal } = payload || {};
  const params = {};
  if (search) params.search = search;
  const response = await axiosConfig.get(API_ROUTES.PRODUCTION_WAREHOUSE_CONFIG.BASE, { params, ...withAbortSignal(signal) });
  return response.data;
}, 'getProductionWarehouseConfigs');

const getProductionWarehouseConfigDropdown = withErrorHandling(async payload => {
  const { signal } = payload || {};
  const response = await axiosConfig.get(API_ROUTES.PRODUCTION_WAREHOUSE_CONFIG.DROPDOWN, withAbortSignal(signal));
  return response.data;
}, 'getProductionWarehouseConfigDropdown');

const getProductionWarehouseConfigById = withErrorHandling(async payload => {
  const { id, signal } = payload;
  const response = await axiosConfig.get(API_ROUTES.PRODUCTION_WAREHOUSE_CONFIG.GET_BY_ID(id), withAbortSignal(signal));
  return response.data;
}, 'getProductionWarehouseConfigById');

const createProductionWarehouseConfig = async payload => {
  const response = await axiosConfig.post(API_ROUTES.PRODUCTION_WAREHOUSE_CONFIG.CREATE, payload);
  return response.data;
};

const updateProductionWarehouseConfig = async ({ id, data }) => {
  const response = await axiosConfig.patch(API_ROUTES.PRODUCTION_WAREHOUSE_CONFIG.UPDATE(id), data);
  return response.data;
};

const updateProductionWarehouseConfigStatus = withErrorHandling(async ({ id, isActive }) => {
  const response = await axiosConfig.patch(API_ROUTES.PRODUCTION_WAREHOUSE_CONFIG.UPDATE_STATUS(id), { isActive });
  return response.data;
}, 'updateProductionWarehouseConfigStatus');

const deleteProductionWarehouseConfig = withErrorHandling(async ({ id }) => {
  const response = await axiosConfig.delete(API_ROUTES.PRODUCTION_WAREHOUSE_CONFIG.DELETE(id));
  return response.data;
}, 'deleteProductionWarehouseConfig');

export const productionWarehouseConfigService = {
  getProductionWarehouseConfigs,
  getProductionWarehouseConfigDropdown,
  getProductionWarehouseConfigById,
  createProductionWarehouseConfig,
  updateProductionWarehouseConfig,
  updateProductionWarehouseConfigStatus,
  deleteProductionWarehouseConfig,
};
