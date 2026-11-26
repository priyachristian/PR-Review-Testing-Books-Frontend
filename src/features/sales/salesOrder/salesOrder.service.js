import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { buildMultipartPayload } from 'utils/multipartHelper';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { buildDocumentExportRequestConfig } from '@/utils/documentExportQuery';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getSalesOrder = withErrorHandling(async payload => {
  const {
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    search = '',
    orderDate = null,
    startDate = null,
    endDate = null,
    status = '',
    signal,
    sortBy = '',
    division,
    branch,
    tagId,
    customerId,
    appName = '',
    addedBy = '',
    productionOrderStatus = '',
    materialStatus = '',
    withMaterialStatus = false,
    country = '',
    state = '',
    city = '',
    addressType = '',
  } = payload;
  const queryParams = new URLSearchParams({
    page: page,
    limit: limit,
  });
  if (search) {
    queryParams.append('search', search);
  }

  if (sortBy) queryParams.append('sortBy', sortBy);

  if (orderDate) {
    queryParams.append('orderDate', orderDate);
  }
  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }
  if (status) {
    queryParams.append('status', status);
  }
  if (productionOrderStatus) {
    queryParams.append('productionOrderStatus', productionOrderStatus);
  }
  if (materialStatus) {
    queryParams.append('materialStatus', materialStatus);
  }
  if (withMaterialStatus) {
    queryParams.append('withMaterialStatus', true);
  }
  if (division) {
    queryParams.append('divisionId', division);
  }
  if (branch) {
    queryParams.append('branchId', branch);
  }
  if (tagId) {
    queryParams.append('tagId', tagId);
  }
  if (appName) {
    queryParams.append('appName', appName);
  }
  if (addedBy) {
    queryParams.append('addedBy', addedBy);
  }
  if (customerId) {
    queryParams.append('customerId', customerId);
  }
  if (country) queryParams.append('country', country);
  if (state) queryParams.append('state', state);
  if (city) queryParams.append('city', city);
  if (addressType) queryParams.append('addressType', addressType);
  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.SALES.SALES_ORDER.BASE, config);
  return response.data;
}, 'getSalesOrder');

const createSalesOrder = async saleOrderData => {
  try {
    const { formData } = buildMultipartPayload(saleOrderData, 'attachments', 'attachment');
    const response = await axiosConfig.post(API_ROUTES.SALES.SALES_ORDER.CREATE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating sale order :', error);
    throw error;
  }
};

const updateSalesOrder = async (salesId, saleOrderData) => {
  try {
    const { formData, hasFiles } = buildMultipartPayload(saleOrderData, 'attachments', 'attachment');

    if (hasFiles) {
      const response = await axiosConfig.patch(API_ROUTES.SALES.SALES_ORDER.UPDATE(salesId), formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } else {
      const response = await axiosConfig.patch(API_ROUTES.SALES.SALES_ORDER.UPDATE(salesId), saleOrderData, {});
      return response.data;
    }
  } catch (error) {
    console.error('Error update sale order :', error);
    throw error;
  }
};

const salesOrderFileUpload = withErrorHandling(async fileData => {
  const response = await axiosConfig.post(API_ROUTES.FILE.UPLOAD, fileData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}, 'salesOrderFileUpload');

const updateStatus = withErrorHandling(async payload => {
  const { orderId, status } = payload;
  const response = await axiosConfig.patch(API_ROUTES.SALES.SALES_ORDER.UPDATE_SATUS(orderId), { status }, {});
  return response.data;
}, 'updateStatus');

const revertClose = withErrorHandling(async payload => {
  const { orderId } = payload;
  const response = await axiosConfig.patch(API_ROUTES.SALES.SALES_ORDER.REVERT_CLOSE(orderId), {}, {});
  return response.data;
}, 'revertClose');

const getSalesItems = withErrorHandling(async payload => {
  const { signal } = payload;
  const queryParams = new URLSearchParams({});
  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.ALL_MASTER.ITEM_MASTER.GET_ITEM_DROP, config);
  return response.data;
}, 'getSalesItems');

const getSalesOrderDropdown = withErrorHandling(async payload => {
  const { signal } = payload;
  const queryParams = new URLSearchParams({});
  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.SALES.SALES_ORDER.SALES_DROP, config);
  return response.data;
}, 'getSalesOrderDropdown');

const getSalesOrderById = withErrorHandling(async payload => {
  const { orderId, signal } = payload;

  const config = { ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.SALES.SALES_ORDER.GET_BY_ID(orderId), {
    ...config,
  });
  return response.data;
}, 'getSalesOrderById');

const getSalesOrderDropdownForConvert = withErrorHandling(async payload => {
  const { customerId, status, signal } = payload;
  const queryParams = new URLSearchParams({
    customerId: customerId,
    status: status,
  });

  let config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.SALES.SALES_ORDER.GET_SALES_DROPDOWN_CONVERT, config);
  return response.data;
}, 'getSalesOrderDropdownForConvert');

const getPendingItemsSalesOrder = withErrorHandling(async payload => {
  const { ids, signal } = payload;
  const queryParams = new URLSearchParams({
    id: ids,
  });

  let config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.SALES.SALES_ORDER.GET_PENDING_ITEM_SALES_ORDER, config);
  return response.data;
}, 'getPendingItemsSalesOrder');

const removeSalesOrder = withErrorHandling(async payload => {
  const { salesOrderId } = payload;

  const response = await axiosConfig.delete(API_ROUTES.SALES.SALES_ORDER.REMOVE_SALES_ORDER(salesOrderId), {});
  return response.data;
}, 'removeSalesOrder');

const getSalesOrderWiseAnalysis = withErrorHandling(async payload => {
  const { signal } = payload;
  const queryParams = new URLSearchParams();

  if (payload.startDate && payload.endDate) {
    queryParams.append('startDate', payload.startDate);
    queryParams.append('endDate', payload.endDate);
  }

  if (payload.status) {
    queryParams.append('status', payload.status);
  }

  if (payload.item) {
    queryParams.append('itemId', payload.item);
  }

  if (payload.division) {
    queryParams.append('divisionId', payload.division);
  }

  if (payload.branch) {
    queryParams.append('branchId', payload.branch);
  }

  if (payload.customerId) {
    queryParams.append('customerId', payload.customerId);
  }

  if (payload.isSplit) {
    queryParams.append('isSplit', payload.isSplit);
  }

  if (payload.page && payload.limit) {
    queryParams.append('page', payload.page);
    queryParams.append('limit', payload.limit);
  }

  let config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.SALES.SALES_ORDER.GET_SALES_ORDER_WISE_ANALSIS, config);
  return response.data;
}, 'getSalesOrderWiseAnalysis');

const getCustomerWiseSalesOrderAnalysis = withErrorHandling(async payload => {
  const { signal } = payload;
  const queryParams = new URLSearchParams();

  if (payload.startDate && payload.endDate) {
    queryParams.append('startDate', payload.startDate);
    queryParams.append('endDate', payload.endDate);
  }

  if (payload.status) {
    queryParams.append('status', payload.status);
  }

  if (payload.item) {
    queryParams.append('itemId', payload.item);
  }

  if (payload.division) {
    queryParams.append('divisionId', payload.division);
  }

  if (payload.branch) {
    queryParams.append('branchId', payload.branch);
  }

  if (payload.customerId) {
    queryParams.append('customerId', payload.customerId);
  }

  if (payload.page && payload.limit) {
    queryParams.append('page', payload.page);
    queryParams.append('limit', payload.limit);
  }

  if (payload.sortBy) {
    queryParams.append('sortBy', payload.sortBy);
  }

  let config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.SALES.SALES_ORDER.GET_CUSTOMER_WISE_SALES_ORDER_ANALYSIS, config);
  return response.data;
}, 'getCustomerWiseSalesOrderAnalysis');

const getItemWiseSalesOrderAnalysis = withErrorHandling(async payload => {
  const { signal } = payload;
  const queryParams = new URLSearchParams();

  if (payload.startDate && payload.endDate) {
    queryParams.append('startDate', payload.startDate);
    queryParams.append('endDate', payload.endDate);
  }

  if (payload.status) {
    queryParams.append('status', payload.status);
  }

  if (payload.item) {
    queryParams.append('itemId', payload.item);
  }

  if (payload.division) {
    queryParams.append('divisionId', payload.division);
  }

  if (payload.branch) {
    queryParams.append('branchId', payload.branch);
  }

  if (payload.customerId) {
    queryParams.append('customerId', payload.customerId);
  }

  if (payload.page && payload.limit) {
    queryParams.append('page', payload.page);
    queryParams.append('limit', payload.limit);
  }

  if (payload.itemType) {
    queryParams.append('itemType', payload.itemType);
  }

  if (payload.itemGroup) {
    queryParams.append('itemGroupId', payload.itemGroup);
  }

  let config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.SALES.SALES_ORDER.GET_ITEM_WISE_SALES_ORDER_ANALYSIS, config);
  return response.data;
}, 'getItemWiseSalesOrderAnalysis');

const getNewVsOldCustomerReport = withErrorHandling(async payload => {
  const { signal, oldPage = 1, oldLimit = 10, newPage = 1, newLimit = 10 } = payload;
  const queryParams = new URLSearchParams();

  if (payload.startDate && payload.endDate) {
    queryParams.append('startDate', payload.startDate);
    queryParams.append('endDate', payload.endDate);
  }

  if (payload.division) {
    queryParams.append('divisionId', payload.division);
  }

  if (payload.branch) {
    queryParams.append('branchId', payload.branch);
  }

  if (payload.customerId) {
    queryParams.append('customerId', payload.customerId);
  }

  let config = { params: queryParams, ...withAbortSignal(signal) };

  if (oldPage && oldLimit) {
    queryParams.append('oldPage', oldPage);
    queryParams.append('oldLimit', oldLimit);
  }
  if (newPage && newLimit) {
    queryParams.append('newPage', newPage);
    queryParams.append('newLimit', newLimit);
  }

  const response = await axiosConfig.get(API_ROUTES.SALES.SALES_ORDER.GET_NEW_VS_OLD_CUSTOMER_REPORT, config);
  return response.data;
}, 'getNewVsOldCustomerReport');

const getNewVsOldCustomerReportModuleData = withErrorHandling(async payload => {
  const { customerId, moduleName, page, limit } = payload;
  const response = await axiosConfig.post(API_ROUTES.SALES.SALES_ORDER.GET_NEW_VS_OLD_CUSTOMER_REPORT_MODULE_DATA, { customerId, moduleName, page, limit });
  return response.data;
}, 'getNewVsOldCustomerReportModuleData');

const convertToProductionOrder = withErrorHandling(async payload => {
  const response = await axiosConfig.post(API_ROUTES.SALES.SALES_ORDER.CONVERT_TO_PRODUCTION_ORDER, payload, {});
  return response.data;
}, 'convertToProductionOrder');

const getSalesOrderExports = withErrorHandling(async payload => {
  const config = buildDocumentExportRequestConfig(payload, { dateField: 'orderDate', extraFields: ['tagId', 'country', 'state', 'city', 'addressType', 'materialStatus'] });
  const response = await axiosConfig.get(API_ROUTES.SALES.SALES_ORDER.EXPORT, config);
  return response.data;
}, 'getSalesOrderExports');

export const salesOrderService = {
  getSalesOrder,
  createSalesOrder,
  updateSalesOrder,
  salesOrderFileUpload,
  updateStatus,
  revertClose,
  getSalesItems,
  getSalesOrderDropdown,
  getSalesOrderById,
  getSalesOrderDropdownForConvert,
  getPendingItemsSalesOrder,
  removeSalesOrder,
  getSalesOrderWiseAnalysis,
  getCustomerWiseSalesOrderAnalysis,
  getItemWiseSalesOrderAnalysis,
  getNewVsOldCustomerReport,
  getNewVsOldCustomerReportModuleData,
  convertToProductionOrder,
  getSalesOrderExports,
};
