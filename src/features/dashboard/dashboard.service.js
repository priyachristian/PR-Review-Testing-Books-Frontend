import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';

const getDashboardSummary = withErrorHandling(async payload => {
  const { isSplit = false, startDate, endDate, division, branch } = payload;

  const queryParams = new URLSearchParams({});

  if (isSplit) {
    queryParams.append('isSplit', isSplit);
  }

  if (startDate) {
    queryParams.append('startDate', startDate);
  }

  if (endDate) {
    queryParams.append('endDate', endDate);
  }

  if (division) {
    queryParams.append('divisionId', division);
  }

  if (branch) {
    queryParams.append('branchId', branch);
  }

  const response = await axiosConfig.get(API_ROUTES.DASHBOARD.SUMMARY, {
    params: queryParams,
  });
  return response.data;
}, 'getDashboardSummary');

const getTop5SalesOrder = withErrorHandling(async payload => {
  const { startDate, endDate, division, branch } = payload;
  const queryParams = new URLSearchParams({});

  if (startDate) {
    queryParams.append('startDate', startDate);
  }

  if (endDate) {
    queryParams.append('endDate', endDate);
  }

  if (division) {
    queryParams.append('divisionId', division);
  }

  if (branch) {
    queryParams.append('branchId', branch);
  }

  const response = await axiosConfig.get(API_ROUTES.DASHBOARD.TOP_5_SALES, {
    params: queryParams,
  });
  return response.data;
}, 'getTop5SalesOrder');

const getTop5PurchaseOrder = withErrorHandling(async payload => {
  const { startDate, endDate, division, branch } = payload;
  const queryParams = new URLSearchParams({});

  if (startDate) {
    queryParams.append('startDate', startDate);
  }

  if (endDate) {
    queryParams.append('endDate', endDate);
  }

  if (division) {
    queryParams.append('divisionId', division);
  }

  if (branch) {
    queryParams.append('branchId', branch);
  }

  const response = await axiosConfig.get(API_ROUTES.DASHBOARD.TOP_5_PURCHASE, {
    params: queryParams,
  });
  return response.data;
}, 'getTop5PurchaseOrder');

const getTop5PaymentReceived = withErrorHandling(async payload => {
  const { isSplit, startDate, endDate, division, branch } = payload;
  const queryParams = new URLSearchParams({});

  if (isSplit) {
    queryParams.append('isSplit', isSplit);
  }

  if (startDate) {
    queryParams.append('startDate', startDate);
  }

  if (endDate) {
    queryParams.append('endDate', endDate);
  }

  if (division) {
    queryParams.append('divisionId', division);
  }

  if (branch) {
    queryParams.append('branchId', branch);
  }

  const response = await axiosConfig.get(API_ROUTES.DASHBOARD.TOP_5_PAYMENT_RECEIVED, {
    params: queryParams,
  });
  return response.data;
}, 'getTop5PaymentReceived');

const getTop5PaymentMade = withErrorHandling(async payload => {
  const { isSplit, startDate, endDate, division, branch } = payload;
  const queryParams = new URLSearchParams({});

  if (isSplit) {
    queryParams.append('isSplit', isSplit);
  }

  if (startDate) {
    queryParams.append('startDate', startDate);
  }

  if (endDate) {
    queryParams.append('endDate', endDate);
  }

  if (division) {
    queryParams.append('divisionId', division);
  }

  if (branch) {
    queryParams.append('branchId', branch);
  }

  const response = await axiosConfig.get(API_ROUTES.DASHBOARD.TOP_5_PAYMENT_MADE, {
    params: queryParams,
  });
  return response.data;
}, 'getTop5PaymentMade');

const getTop5Expense = withErrorHandling(async payload => {
  const { startDate, endDate, division, branch } = payload;
  const queryParams = new URLSearchParams({});

  if (startDate) {
    queryParams.append('startDate', startDate);
  }

  if (endDate) {
    queryParams.append('endDate', endDate);
  }

  if (division) {
    queryParams.append('divisionId', division);
  }

  if (branch) {
    queryParams.append('branchId', branch);
  }

  const response = await axiosConfig.get(API_ROUTES.DASHBOARD.TOP_5_EXPENSE, {
    params: queryParams,
  });
  return response.data;
}, 'getTop5Expense');

const getCreditOverview = withErrorHandling(async payload => {
  const { signal, isCustomer, isVendor } = payload;
  const config = { params: { isCustomer, isVendor }, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.DASHBOARD.CREDIT_OVERVIEW, config);
  return response.data;
}, 'getCreditOverview');

const getCreditUtilization = withErrorHandling(async payload => {
  const { page, limit, sortBy, signal, isCustomer, isVendor } = payload;
  const config = { params: { page, limit, sortBy: sortBy || 'utilizationPercent:desc', isCustomer, isVendor }, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.DASHBOARD.CREDIT_UTILIZATION, config);
  return response.data;
}, 'getCreditUtilization');

const getOverLimitCustomers = withErrorHandling(async payload => {
  const { page, limit, sortBy, signal, isCustomer, isVendor } = payload;
  const config = { params: { page, limit, sortBy: sortBy || 'crossedSinceDays:desc', isCustomer, isVendor }, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.DASHBOARD.OVER_LIMIT_CUSTOMERS, config);
  return response.data;
}, 'getOverLimitCustomers');

const getUserWiseSummary = withErrorHandling(async payload => {
  const { startDate, endDate, divisionId, branchId, isSplit } = payload || {};
  const params = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  if (divisionId) params.divisionId = divisionId;
  if (branchId) params.branchId = branchId;
  if (isSplit !== undefined) params.isSplit = isSplit;
  const response = await axiosConfig.get(API_ROUTES.DASHBOARD.USER_WISE_SUMMARY, { params });
  return response.data;
}, 'getUserWiseSummary');

export const dashboardService = {
  getDashboardSummary,
  getTop5SalesOrder,
  getTop5PurchaseOrder,
  getTop5PaymentReceived,
  getTop5PaymentMade,
  getTop5Expense,
  getCreditOverview,
  getCreditUtilization,
  getOverLimitCustomers,
  getUserWiseSummary,
};
