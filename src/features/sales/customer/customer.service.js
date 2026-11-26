import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { buildMultipartPayloadMultipleFields } from 'utils/multipartHelper';
import { ADDRESS_TYPE } from 'utils/constants';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

/** Config for customer file fields: logo (single) + attachments (array). Nested paths supported. */
const CUSTOMER_FILE_FIELDS = [
  { path: 'companyLogo', formFieldName: 'logo', single: true },
  { path: 'otherDetails.document', formFieldName: 'attachment', single: false },
];

const buildCustomerQueryParams = customerData => {
  const queryParams = new URLSearchParams();
  if (customerData?.Role?.isCustomer) queryParams.append('isCustomer', true);
  else if (customerData?.Role?.isVendor) queryParams.append('isVendor', true);
  return queryParams;
};

const createCustomer = withErrorHandling(async customerData => {
  const queryParams = buildCustomerQueryParams(customerData);
  const { formData, hasFiles } = buildMultipartPayloadMultipleFields(customerData, CUSTOMER_FILE_FIELDS);

  if (hasFiles && formData) {
    const response = await axiosConfig.post(API_ROUTES.SALES.CUSTOMER.BASE, formData, {
      params: queryParams,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }
  const response = await axiosConfig.post(API_ROUTES.SALES.CUSTOMER.BASE, customerData, {
    params: queryParams,
  });
  return response.data;
}, 'createCustomer');

const updateCustomerData = withErrorHandling(async ({ customerId, customerData }) => {
  const queryParams = buildCustomerQueryParams(customerData);
  const { formData, hasFiles } = buildMultipartPayloadMultipleFields(customerData, CUSTOMER_FILE_FIELDS);

  if (hasFiles && formData) {
    const response = await axiosConfig.put(API_ROUTES.SALES.CUSTOMER.UPDATE(customerId), formData, {
      params: queryParams,
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }
  const response = await axiosConfig.put(API_ROUTES.SALES.CUSTOMER.UPDATE(customerId), customerData, {
    params: queryParams,
  });
  return response.data;
}, 'updateCustomerData');

const documentUpload = withErrorHandling(async fileData => {
  const response = await axiosConfig.post(API_ROUTES.FILE.UPLOAD, fileData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}, 'documentUpload');

const createBulkCustomers = withErrorHandling(async customerData => {
  const { customers, isCustomer, isVendor, increment } = customerData;
  const params = {};
  if (isCustomer) params.isCustomer = true;
  if (isVendor) params.isVendor = true;
  if (increment !== undefined) params.increment = increment;

  const response = await axiosConfig.post(API_ROUTES.SALES.CUSTOMER.ADD_BULK_CUSTOMER, { customers }, { params });
  return response.data;
}, 'createBulkCustomers');

const verifyBulkCustomers = withErrorHandling(async customerData => {
  const { customers, isCustomer, isVendor, increment } = customerData;
  const params = {};
  if (isCustomer) params.isCustomer = true;
  if (isVendor) params.isVendor = true;
  if (increment !== undefined) params.increment = increment;

  const response = await axiosConfig.post(API_ROUTES.SALES.CUSTOMER.ADD_BULK_CUSTOMER_VERIFY, { customers }, { params });
  return response.data;
}, 'verifyBulkCustomers');

const addBulkOpeningBalance = withErrorHandling(async payload => {
  const response = await axiosConfig.post(API_ROUTES.SALES.CUSTOMER.OPENING_BALANCE_BULK, payload);
  return response.data;
}, 'addBulkOpeningBalance');

const verifyBulkOpeningBalance = withErrorHandling(async payload => {
  const response = await axiosConfig.post(API_ROUTES.SALES.CUSTOMER.OPENING_BALANCE_BULK_VERIFY, payload);
  return response.data;
}, 'verifyBulkOpeningBalance');

const getCustomer = withErrorHandling(async payload => {
  const {
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    search = '',
    country = '',
    state = '',
    city = '',
    appName = '',
    isCustomer = false,
    isVendor = false,
    sortBy = '',
    status = '',
    verificationStatus = '',
    startDate = null,
    endDate = null,
    customerDate = null,
    signal,
  } = payload;
  const queryParams = new URLSearchParams({
    page: page,
    limit: limit,
  });

  if (search) queryParams.append('search', search);
  if (country) queryParams.append('country', country);
  if (state) queryParams.append('state', state);
  if (city) queryParams.append('city', city);
  if (appName) queryParams.append('appName', appName);
  if (isCustomer) queryParams.append('isCustomer', true);
  if (isVendor) queryParams.append('isVendor', true);
  if (sortBy) queryParams.append('sortBy', sortBy);
  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }
  if (customerDate) queryParams.append('customerDate', customerDate);
  if (status) {
    queryParams.append('status', status);
  }
  if (verificationStatus) queryParams.append('verificationStatus', verificationStatus);

  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.SALES.CUSTOMER.BASE, config);
  return response.data;
}, 'getCustomer');

const getCustomerExports = withErrorHandling(async payload => {
  const {
    search = '',
    country = '',
    state = '',
    city = '',
    status = '',
    verificationStatus = '',
    startDate = null,
    endDate = null,
    customerDate = null,
    isCustomer = false,
    appName = '',
    isVendor = false,
    signal,
  } = payload;
  const queryParams = new URLSearchParams({});

  if (search) queryParams.append('search', search);
  if (country) queryParams.append('country', country);
  if (state) queryParams.append('state', state);
  if (city) queryParams.append('city', city);
  if (appName) queryParams.append('appName', appName);
  if (isCustomer) queryParams.append('isCustomer', true);
  if (isVendor) queryParams.append('isVendor', true);
  if (status) {
    queryParams.append('status', status);
  }
  if (verificationStatus) queryParams.append('verificationStatus', verificationStatus);
  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }
  if (customerDate) queryParams.append('customerDate', customerDate);

  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.SALES.CUSTOMER.EXPORT, config);
  return response.data;
}, 'getCustomerExports');

const getCustomerDrop = withErrorHandling(async payload => {
  const { branchId, signal } = payload;
  const queryParams = new URLSearchParams({});

  if (branchId) {
    queryParams.append('branchId', branchId);
  }

  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.SALES.CUSTOMER.GET_CUSTOMER_DROP, config);
  return response.data;
}, 'getCustomerDrop');

const getVendorDrop = withErrorHandling(async payload => {
  const { branchId, signal } = payload;
  const queryParams = new URLSearchParams({});
  if (branchId) {
    queryParams.append('branchId', branchId);
  }
  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.SALES.CUSTOMER.GET_VENDOR_DROP, config);
  return response.data;
}, 'getVendorDrop');

const getCustomerById = withErrorHandling(async payload => {
  const { customerId, signal, isSplit = false } = payload;
  const queryParams = new URLSearchParams({});

  if (isSplit) {
    queryParams.append('isSplit', isSplit);
  }

  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.SALES.CUSTOMER.GET_BY_ID(customerId), config);
  return response.data;
}, 'getCustomerById');

const acceptCustomerVerification = withErrorHandling(async payload => {
  const { customerId } = payload;
  const response = await axiosConfig.patch(API_ROUTES.SALES.CUSTOMER.ACCEPT_VERIFICATION(customerId), {}, { params: { isCustomer: true } });
  return response.data;
}, 'acceptCustomerVerification');

const rejectCustomerVerification = withErrorHandling(async payload => {
  const { customerId } = payload;
  const response = await axiosConfig.patch(API_ROUTES.SALES.CUSTOMER.REJECT_VERIFICATION(customerId), {}, { params: { isCustomer: true } });
  return response.data;
}, 'rejectCustomerVerification');

const getCustomerDropList = withErrorHandling(async payload => {
  const { branchId, signal } = payload;
  const queryParams = new URLSearchParams({});

  if (branchId) {
    queryParams.append('branchId', branchId);
  }

  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.SALES.CUSTOMER.GET_CUSTOMER_LIST, config);
  return response.data;
}, 'getCustomerDropList');

const getVendorDropList = withErrorHandling(async payload => {
  const { branchId, signal } = payload;
  const queryParams = new URLSearchParams({});
  if (branchId) {
    queryParams.append('branchId', branchId);
  }
  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.SALES.CUSTOMER.GET_VENDER_LIST, config);
  return response.data;
}, 'getVendorDropList');

const getAllCustomersDropList = withErrorHandling(async payload => {
  const { signal, branchId } = payload;
  const queryParams = new URLSearchParams({
    pagination: false,
  });

  if (branchId) {
    queryParams.append('branchId', branchId);
  }

  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.SALES.CUSTOMER.GET_ALL_CUSTOMER_DROP_LIST, config);
  return response.data;
}, 'getAllCustomersDropList');

const getPortalCustomers = withErrorHandling(async payload => {
  const { signal } = payload;
  const queryParams = new URLSearchParams({});

  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.SALES.CUSTOMER.GET_PORTAL_CUSTOMERS, config);
  return response.data;
}, 'getPortalCustomers');

const getCustomerBriefDetail = withErrorHandling(async payload => {
  const { customerId, signal } = payload;

  const config = { ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.SALES.CUSTOMER.GET_BRIEF_DETAILS(customerId), {
    ...config,
  });
  return response.data;
}, 'getCustomerBriefDetail');

const getOpeningBalanceTransactionHistory = withErrorHandling(async payload => {
  const { contactId, contactType, signal } = payload;

  const config = { params: { contactType }, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.OPENING_BALANCE_TRANSACTION.OB_HISTORY(contactId), config);
  return response.data;
}, 'getOpeningBalanceTransactionHistory');

const getCustomerAddress = withErrorHandling(async payload => {
  const { signal, customerId, addressType = ADDRESS_TYPE.SHIPPING } = payload;

  const config = { ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.SALES.CUSTOMER.GET_CUSTOMER_ADDRESS, {
    ...config,
    params: { customerId, addressType },
  });
  return response.data;
}, 'getCustomerAddress');

const addCustomerAddress = withErrorHandling(async payload => {
  const { customerId, addressType = ADDRESS_TYPE.SHIPPING, ...bodyPayload } = payload;
  const response = await axiosConfig.post(API_ROUTES.SALES.CUSTOMER.ADD_CUSTOMER_ADDRESS, bodyPayload, {
    params: { customerId, addressType },
  });
  return response.data;
}, 'addCustomerAddress');

const updateCustomerAddress = withErrorHandling(async payload => {
  const { addressId, addressType = ADDRESS_TYPE.SHIPPING, ...bodyPayload } = payload;
  const response = await axiosConfig.put(API_ROUTES.SALES.CUSTOMER.UPDATE_CUSTOMER_ADDRESS(addressId), bodyPayload, {
    params: { addressType },
  });
  return response.data;
}, 'updateCustomerAddress');

const getBusinessPartnerTeam = withErrorHandling(async payload => {
  const { customerId } = payload;
  const response = await axiosConfig.get(API_ROUTES.SALES.CUSTOMER.GET_BUSINESS_PARTNER_TEAM, {
    params: { customerId },
  });
  return response.data;
}, 'getBusinessPartnerTeam');

const createBusinessPartnerTeam = withErrorHandling(async payload => {
  const { customerId, ...body } = payload;
  const response = await axiosConfig.post(API_ROUTES.SALES.CUSTOMER.ADD_BUSINESS_PARTNER_TEAM, body, {
    params: { customerId },
  });
  return response.data;
}, 'createBusinessPartnerTeam');

const updateBusinessPartnerTeam = withErrorHandling(async payload => {
  const { customerId, businessPartnerTeamId, ...body } = payload;
  const response = await axiosConfig.put(API_ROUTES.SALES.CUSTOMER.UPDATE_BUSINESS_PARTNER_TEAM(businessPartnerTeamId), body, {
    params: { customerId },
  });
  return response.data;
}, 'updateBusinessPartnerTeam');

const deleteBusinessPartnerTeam = withErrorHandling(async payload => {
  const { customerId, businessPartnerTeamId } = payload;
  const response = await axiosConfig.delete(API_ROUTES.SALES.CUSTOMER.DELETE_BUSINESS_PARTNER_TEAM(businessPartnerTeamId), {
    params: { customerId },
  });
  return response.data;
}, 'deleteBusinessPartnerTeam');

const toggleAddressStatus = withErrorHandling(async payload => {
  const { addressId } = payload;
  const response = await axiosConfig.put(API_ROUTES.SALES.CUSTOMER.TOGGLE_ADDRESS_SATUS(addressId), {}, {});
  return response.data;
}, 'toggleAddressStatus');

const resendPortalInvite = withErrorHandling(async payload => {
  const { customerId } = payload;
  const response = await axiosConfig.post(API_ROUTES.SALES.CUSTOMER.RESEND_PORTAL_INVITE(customerId), {}, { params: { isCustomer: true } });
  return response.data;
}, 'resendPortalInvite');

const getCustomerAnalysis360 = withErrorHandling(async payload => {
  const { customerId, isSplit, fy = null, signal } = payload;
  const queryParams = new URLSearchParams();

  if (isSplit) {
    queryParams.append('isSplit', isSplit);
  }

  if (fy) {
    queryParams.append('fy', fy);
  }

  const config = {
    ...withAbortSignal(signal),
    params: queryParams,
  };

  const response = await axiosConfig.get(API_ROUTES.SALES.CUSTOMER.ANALYSIS_360(customerId), config);
  return response.data;
}, 'getCustomerAnalysis360');

const getCustomerCreditDashboard = withErrorHandling(async payload => {
  const { customerId, isSplit, fy = null, signal } = payload;
  const queryParams = new URLSearchParams();

  if (isSplit) {
    queryParams.append('isSplit', isSplit);
  }

  if (fy) {
    queryParams.append('fy', fy);
  }

  const config = {
    ...withAbortSignal(signal),
    params: queryParams,
  };

  const response = await axiosConfig.get(API_ROUTES.SALES.CUSTOMER.CREDIT_DASHBOARD(customerId), config);
  return response.data;
}, 'getCustomerCreditDashboard');

const toggleCustomerStatus = withErrorHandling(async payload => {
  const { customerId, isActive, isCustomer, isVendor } = payload;
  const params = { isActive };
  if (isCustomer !== undefined) params.isCustomer = isCustomer;
  if (isVendor !== undefined) params.isVendor = isVendor;

  const response = await axiosConfig.put(API_ROUTES.SALES.CUSTOMER.TOGGLE_CUSTOMER_STATUS(customerId), {}, { params });
  return response.data;
}, 'toggleCustomerStatus');

const deleteCustomer = withErrorHandling(async payload => {
  const { customerId, isCustomer, isVendor } = payload;
  const params = {};
  if (isCustomer) params.isCustomer = true;
  if (isVendor) params.isVendor = true;

  const response = await axiosConfig.delete(API_ROUTES.SALES.CUSTOMER.DELETE(customerId), { params });
  return response.data;
}, 'deleteCustomer');

export const customerMasterService = {
  createCustomer,
  updateCustomerData,
  documentUpload,
  getCustomer,
  createBulkCustomers,
  verifyBulkCustomers,
  addBulkOpeningBalance,
  verifyBulkOpeningBalance,
  getCustomerDrop,
  getVendorDrop,
  getCustomerExports,
  getCustomerById,
  getCustomerDropList,
  getVendorDropList,
  getAllCustomersDropList,
  getPortalCustomers,
  getCustomerBriefDetail,
  getOpeningBalanceTransactionHistory,
  getCustomerAddress,
  addCustomerAddress,
  updateCustomerAddress,
  getBusinessPartnerTeam,
  createBusinessPartnerTeam,
  updateBusinessPartnerTeam,
  deleteBusinessPartnerTeam,
  getCustomerAnalysis360,
  getCustomerCreditDashboard,
  toggleAddressStatus,
  toggleCustomerStatus,
  resendPortalInvite,
  acceptCustomerVerification,
  rejectCustomerVerification,
  deleteCustomer,
};
