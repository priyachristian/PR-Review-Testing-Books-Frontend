import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling } from '@/utils/serviceHelper';

/**
 * Build URLSearchParams from a filter object.
 * Strips undefined/null/empty values and maps division→divisionId, branch→branchId.
 */
const buildParams = filter => {
  const { startDate, endDate, division, branch, userId, state, city, customerId, isSplit, page, limit, sortBy, tab } = filter ?? {};

  const params = new URLSearchParams();

  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (division) params.append('divisionId', division);
  if (branch) params.append('branchId', branch);
  if (userId) params.append('userId', userId);
  if (state) params.append('state', state);
  if (city) params.append('city', city);
  if (customerId) params.append('customerId', customerId);
  if (isSplit) params.append('isSplit', isSplit);
  if (page) params.append('page', page);
  if (limit) params.append('limit', limit);
  if (sortBy) params.append('sortBy', sortBy);
  if (tab) params.append('tab', tab);

  return params;
};

const getSummary = withErrorHandling(async payload => {
  const response = await axiosConfig.get(API_ROUTES.SALES_DASHBOARD.SUMMARY, {
    params: buildParams(payload),
  });
  return response.data;
}, 'getSalesDashboardSummary');

const getStateWise = withErrorHandling(async payload => {
  const response = await axiosConfig.get(API_ROUTES.SALES_DASHBOARD.STATE_WISE, {
    params: buildParams(payload),
  });
  return response.data;
}, 'getSalesDashboardStateWise');

const getCityWise = withErrorHandling(async payload => {
  const response = await axiosConfig.get(API_ROUTES.SALES_DASHBOARD.CITY_WISE, {
    params: buildParams(payload),
  });
  return response.data;
}, 'getSalesDashboardCityWise');

const getStateGraph = withErrorHandling(async payload => {
  const response = await axiosConfig.get(API_ROUTES.SALES_DASHBOARD.STATE_GRAPH, {
    params: buildParams(payload),
  });
  return response.data;
}, 'getSalesDashboardStateGraph');

const getOrderTrend = withErrorHandling(async payload => {
  const response = await axiosConfig.get(API_ROUTES.SALES_DASHBOARD.ORDER_TREND_GRAPH, {
    params: buildParams(payload),
  });
  return response.data;
}, 'getSalesDashboardOrderTrend');

const getOrderStatus = withErrorHandling(async payload => {
  const response = await axiosConfig.get(API_ROUTES.SALES_DASHBOARD.ORDER_STATUS_GRAPH, {
    params: buildParams(payload),
  });
  return response.data;
}, 'getSalesDashboardOrderStatus');

const getCustomerWise = withErrorHandling(async payload => {
  const response = await axiosConfig.get(API_ROUTES.SALES_DASHBOARD.CUSTOMER_WISE, {
    params: buildParams(payload),
  });
  return response.data;
}, 'getSalesDashboardCustomerWise');

const getItemWise = withErrorHandling(async payload => {
  const response = await axiosConfig.get(API_ROUTES.SALES_DASHBOARD.ITEM_WISE, {
    params: buildParams(payload),
  });
  return response.data;
}, 'getSalesDashboardItemWise');

const getCustomers = withErrorHandling(async payload => {
  const response = await axiosConfig.get(API_ROUTES.SALES_DASHBOARD.CUSTOMERS, {
    params: buildParams(payload),
  });
  return response.data;
}, 'getSalesDashboardCustomers');

const getInactiveCustomers = withErrorHandling(async payload => {
  const response = await axiosConfig.get(API_ROUTES.SALES_DASHBOARD.INACTIVE_CUSTOMERS, {
    params: buildParams(payload),
  });
  return response.data;
}, 'getSalesDashboardInactiveCustomers');

const getUserDropdown = withErrorHandling(async () => {
  const response = await axiosConfig.get(API_ROUTES.SALES_DASHBOARD.USER_DROPDOWN);
  return response.data;
}, 'getSalesDashboardUserDropdown');

const getNonOrderCustomerList = withErrorHandling(async payload => {
  const response = await axiosConfig.get(API_ROUTES.SALES_DASHBOARD.NON_ORDER_CUSTOMER_LIST, {
    params: buildParams(payload),
  });
  return response.data;
}, 'getSalesDashboardNonOrderCustomerList');

const getNonOrderCustomers = withErrorHandling(async payload => {
  const response = await axiosConfig.get(API_ROUTES.SALES_DASHBOARD.NON_ORDER_CUSTOMERS, {
    params: buildParams(payload),
  });
  return response.data;
}, 'getSalesDashboardNonOrderCustomers');

const getCustomerInvoices = withErrorHandling(async payload => {
  const response = await axiosConfig.get(API_ROUTES.SALES_DASHBOARD.CUSTOMER_INVOICES, {
    params: buildParams(payload),
  });
  return response.data;
}, 'getSalesDashboardCustomerInvoices');

const getItemGroupAnalytics = withErrorHandling(async payload => {
  const response = await axiosConfig.get(API_ROUTES.SALES_DASHBOARD.ITEM_GROUP_ANALYTICS, {
    params: buildParams(payload),
  });
  return response.data;
}, 'getSalesDashboardItemGroupAnalytics');

// Item-wise performance breakdown drawer — GET /sales-dashboard/item-wise/details/:itemId?tab=state|customer
const getItemWiseDetails = withErrorHandling(async payload => {
  const { itemId, ...rest } = payload || {};
  const response = await axiosConfig.get(API_ROUTES.SALES_DASHBOARD.ITEM_WISE_DETAILS(itemId), {
    params: buildParams(rest),
  });
  return response.data;
}, 'getSalesDashboardItemWiseDetails');

// Customer-wise performance breakdown drawer — GET /sales-dashboard/customer-wise/details/:customerId
const getCustomerWiseDetails = withErrorHandling(async payload => {
  const { customerId, ...rest } = payload || {};
  const response = await axiosConfig.get(API_ROUTES.SALES_DASHBOARD.CUSTOMER_WISE_DETAILS(customerId), {
    params: buildParams(rest),
  });
  return response.data;
}, 'getSalesDashboardCustomerWiseDetails');

// State-wise performance breakdown drawer — GET /sales-dashboard/state-wise/details/:stateId?tab=item|customer
const getStateWiseDetails = withErrorHandling(async payload => {
  const { stateId, ...rest } = payload || {};
  const response = await axiosConfig.get(API_ROUTES.SALES_DASHBOARD.STATE_WISE_DETAILS(stateId), {
    params: buildParams(rest),
  });
  return response.data;
}, 'getSalesDashboardStateWiseDetails');

export const salesDashboardService = {
  getSummary,
  getStateWise,
  getStateGraph,
  getOrderTrend,
  getOrderStatus,
  getCustomerWise,
  getItemWise,
  getCityWise,
  getCustomers,
  getInactiveCustomers,
  getNonOrderCustomers,
  getNonOrderCustomerList,
  getUserDropdown,
  getCustomerInvoices,
  getItemGroupAnalytics,
  getItemWiseDetails,
  getCustomerWiseDetails,
  getStateWiseDetails,
};
