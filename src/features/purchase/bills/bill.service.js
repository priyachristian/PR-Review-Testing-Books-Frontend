import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { buildMultipartPayload } from 'utils/multipartHelper';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { buildDocumentExportRequestConfig } from '@/utils/documentExportQuery';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getBills = withErrorHandling(async payload => {
  const {
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    search = '',
    billDate = null,
    startDate = null,
    endDate = null,
    status = '',
    isSplit = false,
    signal,
    sortBy = '',
    division = '',
    branch = '',
    addedBy = '',
    customerId,
    country = '',
    state = '',
    city = '',
    addressType = '',
  } = payload;
  const queryParams = new URLSearchParams({
    page: page,
    limit: limit,
  });
  if (isSplit) {
    queryParams.append('isSplit', isSplit);
  }
  if (search) {
    queryParams.append('search', search);
  }
  if (sortBy) {
    queryParams.append('sortBy', sortBy);
  }
  if (billDate) {
    queryParams.append('billDate', billDate);
  }
  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }
  if (status) {
    queryParams.append('status', status);
  }
  if (division) {
    queryParams.append('divisionId', division);
  }
  if (branch) {
    queryParams.append('branchId', branch);
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

  const response = await axiosConfig.get(API_ROUTES.PURCHASE.BILL.BASE, config);
  return response.data;
}, 'getBills');

const getPendingBills = withErrorHandling(async payload => {
  const { vendorId, branchId, warehouseId, pagination = false, signal, isAdd = true, isSplit = false } = payload;
  const queryParams = new URLSearchParams({
    pagination: pagination,
    isAdd: isAdd,
  });
  if (isSplit) {
    queryParams.append('isSplit', isSplit);
  }
  if (branchId) {
    queryParams.append('branchId', branchId);
  }
  if (warehouseId) {
    queryParams.append('warehouseId', warehouseId);
  }

  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.PURCHASE.BILL.GET_PENDING_BILLS(vendorId), config);
  return response.data;
}, 'getPendingBills');

const getBillDropdown = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, search = '', signal } = payload || {};
  const queryParams = new URLSearchParams({ page, limit });
  if (search) queryParams.append('search', search);
  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.PURCHASE.BILL.DROPDOWN, config);
  return response.data;
}, 'getBillDropdown');

const createBills = async billsData => {
  try {
    const { formData } = buildMultipartPayload(billsData, 'attachments', 'attachment');
    const response = await axiosConfig.post(API_ROUTES.PURCHASE.BILL.CREATE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating Bills order :', error);
    throw error;
  }
};

const updateBills = async (billsId, billsData) => {
  try {
    const { formData } = buildMultipartPayload(billsData, 'attachments', 'attachment');
    const response = await axiosConfig.patch(API_ROUTES.PURCHASE.BILL.UPDATE(billsId), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error update Bills order :', error);
    throw error;
  }
};

const updateStatus = withErrorHandling(async payload => {
  const { billId, status } = payload;
  const response = await axiosConfig.patch(
    API_ROUTES.PURCHASE.BILL.UPDATE_STATUS(billId),
    {
      status,
    },
    {}
  );
  return response.data;
}, 'updateStatus');

const getBillById = withErrorHandling(async payload => {
  const { billId, signal } = payload;

  let config = { ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.PURCHASE.BILL.GET_BY_ID(billId), {
    ...config,
  });
  return response.data;
}, 'getBillById');

const removeBill = withErrorHandling(async payload => {
  const { billId } = payload;

  const response = await axiosConfig.delete(API_ROUTES.PURCHASE.BILL.REMOVE_BILL(billId), {});
  return response.data;
}, 'removeBill');

const exportBill = withErrorHandling(async payload => {
  const config = buildDocumentExportRequestConfig(payload, {
    dateField: 'billDate',
    extraFields: ['isSplit', 'country', 'state', 'city', 'addressType'],
  });
  const response = await axiosConfig.get(API_ROUTES.PURCHASE.BILL.EXPORT, config);
  return response.data;
}, 'exportBill');

const getPaymentHistory = withErrorHandling(async payload => {
  const { billId } = payload;

  const queryParams = new URLSearchParams({});

  const response = await axiosConfig.get(API_ROUTES.PURCHASE.BILL.GET_PAYMENT_HISTORY(billId), {
    params: queryParams,
  });
  return response.data;
}, 'getPaymentHistory');

const createSplitBill = withErrorHandling(async billsData => {
  const { formData } = buildMultipartPayload(billsData, 'attachments', 'attachment');
  const response = await axiosConfig.post(API_ROUTES.PURCHASE.BILL.CREATE_SPLIT_BILL, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}, 'createSplitBill');

const applyVendorCreditToBill = withErrorHandling(async payload => {
  const { vendorId, branchId, applications, contextBillId } = payload;
  const response = await axiosConfig.post(
    API_ROUTES.PURCHASE.BILL.APPLY_VENDOR_CREDIT_TO_BILL(vendorId),
    { applications, ...(contextBillId ? { contextBillId } : {}) },
    {
      params: { ...(branchId && { branchId }) },
    }
  );
  return response.data;
}, 'applyVendorCreditToBill');

const removeOpeningBalanceApplication = withErrorHandling(async payload => {
  const { billId, applicationId, creditTxnId, applicationScope } = payload;
  const isObToOb = applicationScope === 'opening_balance';
  const url =
    isObToOb && creditTxnId
      ? API_ROUTES.PURCHASE.BILL.REMOVE_OPENING_BALANCE_OB_APPLICATION(creditTxnId, applicationId)
      : API_ROUTES.PURCHASE.BILL.REMOVE_OPENING_BALANCE_APPLICATION(billId, applicationId);
  const response = await axiosConfig.delete(url);
  return response.data;
}, 'removeOpeningBalanceApplication');

const autoMapOpeningBalanceToBills = withErrorHandling(async payload => {
  const { vendorId, branchId, isSplit } = payload;
  const response = await axiosConfig.post(
    API_ROUTES.PURCHASE.BILL.MAP_OB_CREDIT,
    {},
    {
      params: { ...(vendorId && { vendorId }), ...(branchId && { branchId }), ...(typeof isSplit && { isSplit }) },
    }
  );
  return response.data;
}, 'autoMapOpeningBalanceToBills');

export const billsService = {
  getBills,
  getPendingBills,
  getBillDropdown,
  createBills,
  updateBills,
  updateStatus,
  getBillById,
  removeBill,
  exportBill,
  getPaymentHistory,
  createSplitBill,
  applyVendorCreditToBill,
  removeOpeningBalanceApplication,
  autoMapOpeningBalanceToBills,
};
