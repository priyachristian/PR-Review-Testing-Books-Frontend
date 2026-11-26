import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getSalesAnalytics = withErrorHandling(async payload => {
  const { startDate = null, endDate = null, signal } = payload;
  const queryParams = new URLSearchParams({});
  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }

  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.ANALYTICS_ROUTES.SALES.DASHBOARD, config);
  return response.data;
}, 'getSalesAnalytics');

const getTopCustomersOfSalesAnalytics = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, startDate = null, endDate = null, signal, division = null, branch = null, isSplit = false, sortBy = '', item = null, itemGroup = null } = payload;
  const queryParams = new URLSearchParams({
    page: page,
    limit: limit,
  });
  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }
  if (isSplit) {
    queryParams.append('isSplit', isSplit);
  }
  if (division) {
    queryParams.append('divisionId', division);
  }
  if (branch) {
    queryParams.append('branchId', branch);
  }
  if (item) {
    queryParams.append('itemId', item);
  }
  if (itemGroup) {
    queryParams.append('itemGroupId', itemGroup);
  }
  if (sortBy) queryParams.append('sortBy', sortBy);

  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.ANALYTICS_ROUTES.SALES.TOP_CUSTOMERS, config);
  return response.data;
}, 'getTopCustomersOfSalesAnalytics');

const getTopItemsOfSalesAnalytics = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, startDate = null, endDate = null, signal, division = null, branch = null, isSplit = false, sortBy = '', customerId = null, itemGroup = null } = payload;
  const queryParams = new URLSearchParams({
    page: page,
    limit: limit,
  });
  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }
  if (division) {
    queryParams.append('divisionId', division);
  }
  if (branch) {
    queryParams.append('branchId', branch);
  }
  if (customerId) {
    queryParams.append('customerId', customerId);
  }
  if (itemGroup) {
    queryParams.append('itemGroupId', itemGroup);
  }
  if (isSplit) {
    queryParams.append('isSplit', true);
  }
  if (sortBy) queryParams.append('sortBy', sortBy);

  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.ANALYTICS_ROUTES.SALES.TOP_ITEMS, config);
  return response.data;
}, 'getTopItemsOfSalesAnalytics');

const getCustomerWiseBusinessPerformance = withErrorHandling(async payload => {
  const {
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    startDate = null,
    endDate = null,
    signal,
    division = null,
    branch = null,
    customerId = null,
    addedBy = null,
    state = null,
    city = null,
    sortBy = '',
    pagination = true,
  } = payload;

  const queryParams = new URLSearchParams({ page, limit });

  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }
  if (division) queryParams.append('divisionId', division);
  if (branch) queryParams.append('branchId', branch);
  if (customerId) queryParams.append('customerId', customerId);
  if (addedBy) queryParams.append('addedBy', addedBy);
  if (state) queryParams.append('state', state);
  if (city) queryParams.append('city', city);
  if (sortBy) queryParams.append('sortBy', sortBy);
  if (pagination === false) {
    queryParams.set('page', '1');
    queryParams.set('limit', '100000');
  }

  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.ANALYTICS_ROUTES.SALES.CUSTOMER_WISE_BUSINESS_PERFORMANCE, config);
  return response.data;
}, 'getCustomerWiseBusinessPerformance');

const exportCustomerWiseBusinessPerformance = withErrorHandling(async payload => {
  const { startDate = null, endDate = null, signal, division = null, branch = null, customerId = null, addedBy = null, state = null, city = null, sortBy = '', fileName = '' } = payload;

  const queryParams = new URLSearchParams({});

  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }
  if (division) queryParams.append('divisionId', division);
  if (branch) queryParams.append('branchId', branch);
  if (customerId) queryParams.append('customerId', customerId);
  if (addedBy) queryParams.append('addedBy', addedBy);
  if (state) queryParams.append('state', state);
  if (city) queryParams.append('city', city);
  if (sortBy) queryParams.append('sortBy', sortBy);
  if (fileName) queryParams.append('fileName', fileName);

  const config = {
    params: queryParams,
    responseType: 'blob',
    ...withAbortSignal(signal),
  };
  const response = await axiosConfig.get(API_ROUTES.ANALYTICS_ROUTES.SALES.CUSTOMER_WISE_BUSINESS_PERFORMANCE_EXPORT, config);
  return response.data;
}, 'exportCustomerWiseBusinessPerformance');

const getCustomersWithSingleInvoiceAnalytics = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, signal, division = null, branch = null } = payload;

  const queryParams = new URLSearchParams({ page, limit });

  if (division) {
    queryParams.append('divisionId', division);
  }
  if (branch) {
    queryParams.append('branchId', branch);
  }

  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.ANALYTICS_ROUTES.SALES.CUSTOMERS_WITH_SINGLE_INVOICE, config);
  return response.data;
}, 'getCustomersWithSingleInvoiceAnalytics');

const getPurchaseAnalytics = withErrorHandling(async payload => {
  const { startDate = null, endDate = null, signal } = payload;
  const queryParams = new URLSearchParams({});
  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }

  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.ANALYTICS_ROUTES.PURCHASE.DASHBOARD, config);
  return response.data;
}, 'getPurchaseAnalytics');

const getTopVendorsByAmountPurchaseAnalytics = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, startDate = null, endDate = null, signal, division = null, branch = null } = payload;
  const queryParams = new URLSearchParams({
    page: page,
    limit: limit,
  });
  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }
  if (division) {
    queryParams.append('divisionId', division);
  }
  if (branch) {
    queryParams.append('branchId', branch);
  }

  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.ANALYTICS_ROUTES.PURCHASE.TOP_ORDERS, config);
  return response.data;
}, 'getTopVendorsByAmountPurchaseAnalytics');

const getTopVendorsByRevenuePurchaseAnalytics = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, startDate = null, endDate = null, signal, division = null, branch = null, isSplit = false, sortBy = '' } = payload;
  const queryParams = new URLSearchParams({
    page: page,
    limit: limit,
  });
  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }
  if (isSplit) {
    queryParams.append('isSplit', isSplit);
  }
  if (division) {
    queryParams.append('divisionId', division);
  }
  if (branch) {
    queryParams.append('branchId', branch);
  }
  if (sortBy) queryParams.append('sortBy', sortBy);

  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.ANALYTICS_ROUTES.PURCHASE.TOP_VENDORS, config);
  return response.data;
}, 'getTopVendorsByRevenuePurchaseAnalytics');

const getTopVendorsByItemsPurchaseAnalytics = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, startDate = null, endDate = null, signal, division = null, branch = null, isSplit = false, sortBy = '' } = payload;
  const queryParams = new URLSearchParams({
    page: page,
    limit: limit,
  });
  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }
  if (division) {
    queryParams.append('divisionId', division);
  }
  if (branch) {
    queryParams.append('branchId', branch);
  }
  if (isSplit) {
    queryParams.append('isSplit', true);
  }
  if (sortBy) queryParams.append('sortBy', sortBy);

  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.ANALYTICS_ROUTES.PURCHASE.TOP_ITEMS, config);
  return response.data;
}, 'getTopVendorsByItemsPurchaseAnalytics');

const getPaymentAnalytics = withErrorHandling(async payload => {
  const { startDate = null, endDate = null, signal } = payload;
  const queryParams = new URLSearchParams({});
  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }

  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.ANALYTICS_ROUTES.PAYMENT.BILL_ANALYTICS, config);
  return response.data;
}, 'getPaymentAnalytics');

const getTopCustomerByAmountPaymentReceivedAnalytics = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, startDate = null, endDate = null, signal, division = null, branch = null, isSplit } = payload;
  const queryParams = new URLSearchParams({
    page: page,
    limit: limit,
  });
  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }
  if (division) {
    queryParams.append('divisionId', division);
  }
  if (branch) {
    queryParams.append('branchId', branch);
  }
  if (isSplit) {
    queryParams.append('isSplit', isSplit);
  }

  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.ANALYTICS_ROUTES.PAYMENT.RECEIVED.TOP_CUSTOMERS, config);
  return response.data;
}, 'getTopCustomerByAmountPaymentReceivedAnalytics');

const getRecentPaymentReceivedAnalytics = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, startDate = null, endDate = null, signal, division = null, branch = null, isSplit } = payload;
  const queryParams = new URLSearchParams({
    page: page,
    limit: limit,
  });
  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }
  if (division) {
    queryParams.append('divisionId', division);
  }
  if (branch) {
    queryParams.append('branchId', branch);
  }
  if (isSplit) {
    queryParams.append('isSplit', isSplit);
  }

  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.ANALYTICS_ROUTES.PAYMENT.RECEIVED.RECENT, config);
  return response.data;
}, 'getRecentPaymentReceivedAnalytics');

const getUpcomingPaymentReceivedByInvoiceAnalytics = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, startDate = null, endDate = null, signal, division = null, branch = null, isSplit } = payload;
  const queryParams = new URLSearchParams({
    page: page,
    limit: limit,
  });
  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }
  if (division) {
    queryParams.append('divisionId', division);
  }
  if (branch) {
    queryParams.append('branchId', branch);
  }
  if (isSplit) {
    queryParams.append('isSplit', isSplit);
  }

  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.ANALYTICS_ROUTES.PAYMENT.RECEIVED.UPCOMING, config);
  return response.data;
}, 'getUpcomingPaymentReceivedByInvoiceAnalytics');

const getOverDueInvoiceAnalytics = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, startDate = null, endDate = null, signal, division = null, branch = null, isSplit } = payload;
  const queryParams = new URLSearchParams({
    page: page,
    limit: limit,
  });
  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }
  if (division) {
    queryParams.append('divisionId', division);
  }
  if (branch) {
    queryParams.append('branchId', branch);
  }
  if (isSplit) {
    queryParams.append('isSplit', isSplit);
  }

  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.ANALYTICS_ROUTES.PAYMENT.RECEIVED.OVERDUE, config);
  return response.data;
}, 'getOverDueInvoiceAnalytics');

const getItemProcessAnalytics = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, startDate = null, endDate = null, signal, itemId = null, process = null, pagination } = payload;
  const queryParams = new URLSearchParams();
  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }
  if (itemId) {
    queryParams.append('itemId', itemId);
  }
  if (process) {
    queryParams.append('process', process);
  }
  if (pagination === false) {
    queryParams.append('pagination', 'false');
  } else {
    queryParams.append('page', page);
    queryParams.append('limit', limit);
  }

  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.ANALYTICS_ROUTES.PRODUCTION.ITEM_PROCESS_ANALYTICS, config);
  return response.data;
}, 'getItemProcessAnalytics');

const getTopVendorsByAmountPaymentMadeAnalytics = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, startDate = null, endDate = null, signal, division = null, branch = null, isSplit } = payload;
  const queryParams = new URLSearchParams({
    page: page,
    limit: limit,
  });
  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }
  if (division) {
    queryParams.append('divisionId', division);
  }
  if (branch) {
    queryParams.append('branchId', branch);
  }
  if (isSplit) {
    queryParams.append('isSplit', isSplit);
  }

  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.ANALYTICS_ROUTES.PAYMENT.MADE.TOP_VENDORS, config);
  return response.data;
}, 'getTopVendorsByAmountPaymentMadeAnalytics');

const getRecentPaymentMadeAnalytics = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, startDate = null, endDate = null, signal, division = null, branch = null, isSplit } = payload;
  const queryParams = new URLSearchParams({
    page: page,
    limit: limit,
  });
  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }
  if (division) {
    queryParams.append('divisionId', division);
  }
  if (branch) {
    queryParams.append('branchId', branch);
  }
  if (isSplit) {
    queryParams.append('isSplit', isSplit);
  }

  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.ANALYTICS_ROUTES.PAYMENT.MADE.RECENT, config);
  return response.data;
}, 'getRecentPaymentMadeAnalytics');

const getUpcomingPaymentMadeByBillsAnalytics = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, startDate = null, endDate = null, signal, division = null, branch = null, isSplit } = payload;
  const queryParams = new URLSearchParams({
    page: page,
    limit: limit,
  });
  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }
  if (division) {
    queryParams.append('divisionId', division);
  }
  if (branch) {
    queryParams.append('branchId', branch);
  }
  if (isSplit) {
    queryParams.append('isSplit', isSplit);
  }

  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.ANALYTICS_ROUTES.PAYMENT.MADE.UPCOMING, config);
  return response.data;
}, 'getUpcomingPaymentMadeByBillsAnalytics');

const getOverDueBillsAnalytics = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, startDate = null, endDate = null, signal, division = null, branch = null, isSplit } = payload;
  const queryParams = new URLSearchParams({
    page: page,
    limit: limit,
  });
  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }
  if (division) {
    queryParams.append('divisionId', division);
  }
  if (branch) {
    queryParams.append('branchId', branch);
  }
  if (isSplit) {
    queryParams.append('isSplit', isSplit);
  }

  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.ANALYTICS_ROUTES.PAYMENT.MADE.OVERDUE, config);
  return response.data;
}, 'getOverDueBillsAnalytics');

const fetchItemGroupAnalytics = withErrorHandling(async payload => {
  const { startDate = null, endDate = null, isSplit = false, division = '', branch = '', signal } = payload;
  const queryParams = new URLSearchParams({});
  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }
  if (division) {
    queryParams.append('divisionId', division);
  }
  if (branch) {
    queryParams.append('branchId', branch);
  }
  if (isSplit) {
    queryParams.append('isSplit', true);
  }

  const response = await axiosConfig.get(API_ROUTES.ANALYTICS_ROUTES.ITEM_GROUP.BASE, {
    params: queryParams,
    signal: signal,
  });
  return response.data;
}, 'fetchItemGroupAnalytics');

const addItemGroupAnalytics = withErrorHandling(async payload => {
  const response = await axiosConfig.post(API_ROUTES.ANALYTICS_ROUTES.ITEM_GROUP.CREATE, payload, {});
  return response.data;
}, 'addItemGroupAnalytics');

const updateItemGroupAnalytics = withErrorHandling(async ({ id, payload }) => {
  const { ...body } = payload;
  const response = await axiosConfig.patch(API_ROUTES.ANALYTICS_ROUTES.ITEM_GROUP.UPDATE(id), body, {});
  return response.data;
}, 'updateItemGroupAnalytics');

const deleteItemGroupAnalytics = withErrorHandling(async payload => {
  const response = await axiosConfig.delete(API_ROUTES.ANALYTICS_ROUTES.ITEM_GROUP.DELETE(payload.itemGroupId), {});
  return response.data;
}, 'deleteItemGroupAnalytics');

const getRowWiseItemGroupAnalyticsByItemGroup = withErrorHandling(async ({ itemGroupId, dateRange, isSplit }) => {
  const queryParams = new URLSearchParams({});

  if (dateRange?.[0] && dateRange?.[1]) {
    queryParams.append('startDate', dateRange?.[0]);
    queryParams.append('endDate', dateRange?.[1]);
  }
  if (isSplit) {
    queryParams.append('isSplit', isSplit);
  }

  const response = await axiosConfig.get(API_ROUTES.ANALYTICS_ROUTES.ITEM_GROUP.BY_GROUP(itemGroupId), {
    params: queryParams,
  });
  return response.data;
}, 'getRowWiseItemGroupAnalyticsByItemGroup');

const fetchSubItemGroupAnalytics = withErrorHandling(async payload => {
  const { startDate = null, endDate = null, isSplit = false, division = '', branch = '', signal } = payload;
  const queryParams = new URLSearchParams({});
  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }
  if (division) {
    queryParams.append('divisionId', division);
  }
  if (branch) {
    queryParams.append('branchId', branch);
  }
  if (isSplit) {
    queryParams.append('isSplit', true);
  }

  const response = await axiosConfig.get(API_ROUTES.ANALYTICS_ROUTES.SUB_ITEM_GROUP.BASE, {
    params: queryParams,
    signal: signal,
  });
  return response.data;
}, 'fetchSubItemGroupAnalytics');

const addSubItemGroupAnalytics = withErrorHandling(async payload => {
  const response = await axiosConfig.post(API_ROUTES.ANALYTICS_ROUTES.SUB_ITEM_GROUP.CREATE, payload, {});
  return response.data;
}, 'addSubItemGroupAnalytics');

const updateSubItemGroupAnalytics = withErrorHandling(async ({ id, payload }) => {
  const { ...body } = payload;
  const response = await axiosConfig.patch(API_ROUTES.ANALYTICS_ROUTES.SUB_ITEM_GROUP.UPDATE(id), body, {});
  return response.data;
}, 'updateSubItemGroupAnalytics');

const deleteSubItemGroupAnalytics = withErrorHandling(async payload => {
  const response = await axiosConfig.delete(API_ROUTES.ANALYTICS_ROUTES.SUB_ITEM_GROUP.DELETE(payload.itemGroupId), {});
  return response.data;
}, 'deleteSubItemGroupAnalytics');

const getRowWiseSubItemGroupAnalytics = withErrorHandling(async ({ subItemGroupId, dateRange, isSplit }) => {
  const queryParams = new URLSearchParams({});

  if (dateRange?.[0] && dateRange?.[1]) {
    queryParams.append('startDate', dateRange?.[0]);
    queryParams.append('endDate', dateRange?.[1]);
  }
  if (isSplit) {
    queryParams.append('isSplit', isSplit);
  }

  const response = await axiosConfig.get(API_ROUTES.ANALYTICS_ROUTES.SUB_ITEM_GROUP.BY_GROUP(subItemGroupId), {
    params: queryParams,
  });
  return response.data;
}, 'getRowWiseSubItemGroupAnalytics');

const getSalesOrderRmAnalytics = withErrorHandling(async payload => {
  const { item, division, branch, customerId, status } = payload;
  const queryParams = new URLSearchParams({});

  if (item) {
    queryParams.append('itemId', item);
  }
  if (division) {
    queryParams.append('divisionId', division);
  }
  if (branch) {
    queryParams.append('branchId', branch);
  }
  if (customerId) {
    queryParams.append('customerId', customerId);
  }
  if (status) {
    queryParams.append('status', status);
  }

  let config = { params: queryParams };

  const response = await axiosConfig.get(API_ROUTES.ANALYTICS_ROUTES.SALES_ORDER.RM, config);
  return response.data;
}, 'getSalesOrderRmAnalytics');

const getItemWiseRmAnalytics = withErrorHandling(async payload => {
  const { item, division, branch, customerId, status } = payload;
  const queryParams = new URLSearchParams({});

  if (item) {
    queryParams.append('itemId', item);
  }
  if (division) {
    queryParams.append('divisionId', division);
  }
  if (branch) {
    queryParams.append('branchId', branch);
  }
  if (customerId) {
    queryParams.append('customerId', customerId);
  }
  if (status) {
    queryParams.append('status', status);
  }

  let config = { params: queryParams };

  const response = await axiosConfig.get(API_ROUTES.ANALYTICS_ROUTES.SALES_ORDER.ITEM, config);
  return response.data;
}, 'getItemWiseRmAnalytics');

const getSalesOrderWiseRmAnalytics = withErrorHandling(async payload => {
  const { item, division, branch, customerId, status } = payload;
  const queryParams = new URLSearchParams({});

  if (item) {
    queryParams.append('itemId', item);
  }
  if (division) {
    queryParams.append('divisionId', division);
  }
  if (branch) {
    queryParams.append('branchId', branch);
  }
  if (customerId) {
    queryParams.append('customerId', customerId);
  }
  if (status) {
    queryParams.append('status', status);
  }

  let config = { params: queryParams };

  const response = await axiosConfig.get(API_ROUTES.ANALYTICS_ROUTES.SALES_ORDER.SO, config);
  return response.data;
}, 'getSalesOrderWiseRmAnalytics');

const getGeneralSalesAnalytics = withErrorHandling(async payload => {
  const { signal } = payload || {};
  const config = signal ? { signal } : {};
  const response = await axiosConfig.get(API_ROUTES.ANALYTICS_ROUTES.GENERAL_SALES.GET_ALL, config);
  return response.data;
}, 'getGeneralSalesAnalytics');

const createGeneralSalesAnalytics = withErrorHandling(async payload => {
  const { ...body } = payload || {};
  const response = await axiosConfig.post(API_ROUTES.ANALYTICS_ROUTES.GENERAL_SALES.CREATE, body);
  return response.data;
}, 'createGeneralSalesAnalytics');

const getGeneralSalesAnalyticsById = withErrorHandling(async payload => {
  const { id, startDate, endDate, page, limit, signal } = payload || {};
  const params = { startDate, endDate, page, limit };
  const config = {
    params: Object.fromEntries(Object.entries(params).filter(([, v]) => v != null)),
    ...withAbortSignal(signal),
  };
  const response = await axiosConfig.get(API_ROUTES.ANALYTICS_ROUTES.GENERAL_SALES.GET_BY_ID(id), config);
  return response.data;
}, 'getGeneralSalesAnalyticsById');

const updateGeneralSalesAnalytics = withErrorHandling(async ({ id, ...payload }) => {
  const response = await axiosConfig.put(API_ROUTES.ANALYTICS_ROUTES.GENERAL_SALES.UPDATE(id), payload);
  return response.data;
}, 'updateGeneralSalesAnalytics');

const deleteGeneralSalesAnalytics = withErrorHandling(async payload => {
  const id = typeof payload === 'string' ? payload : payload?.id;
  const response = await axiosConfig.delete(API_ROUTES.ANALYTICS_ROUTES.GENERAL_SALES.DELETE(id));
  return response.data;
}, 'deleteGeneralSalesAnalytics');

export const analyticsService = {
  getSalesAnalytics,
  getTopCustomersOfSalesAnalytics,
  getTopItemsOfSalesAnalytics,
  getCustomerWiseBusinessPerformance,
  exportCustomerWiseBusinessPerformance,
  getCustomersWithSingleInvoiceAnalytics,
  getPurchaseAnalytics,
  getTopVendorsByAmountPurchaseAnalytics,
  getTopVendorsByRevenuePurchaseAnalytics,
  getTopVendorsByItemsPurchaseAnalytics,
  getPaymentAnalytics,
  getTopCustomerByAmountPaymentReceivedAnalytics,
  getRecentPaymentReceivedAnalytics,
  getUpcomingPaymentReceivedByInvoiceAnalytics,
  getOverDueInvoiceAnalytics,
  getItemProcessAnalytics,
  getTopVendorsByAmountPaymentMadeAnalytics,
  getRecentPaymentMadeAnalytics,
  getUpcomingPaymentMadeByBillsAnalytics,
  getOverDueBillsAnalytics,
  fetchItemGroupAnalytics,
  addItemGroupAnalytics,
  updateItemGroupAnalytics,
  deleteItemGroupAnalytics,
  getRowWiseItemGroupAnalyticsByItemGroup,
  fetchSubItemGroupAnalytics,
  addSubItemGroupAnalytics,
  updateSubItemGroupAnalytics,
  deleteSubItemGroupAnalytics,
  getRowWiseSubItemGroupAnalytics,
  getSalesOrderRmAnalytics,
  getItemWiseRmAnalytics,
  getSalesOrderWiseRmAnalytics,
  getGeneralSalesAnalytics,
  createGeneralSalesAnalytics,
  getGeneralSalesAnalyticsById,
  updateGeneralSalesAnalytics,
  deleteGeneralSalesAnalytics,
};
