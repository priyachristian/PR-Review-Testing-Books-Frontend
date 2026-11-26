import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { buildMultipartPayload } from 'utils/multipartHelper';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getPaymentsMade = withErrorHandling(async payload => {
  const {
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    search = '',
    paymentDate = null,
    startDate = null,
    endDate = null,
    status,
    signal,
    sortBy = '',
    bank,
    isSplit = false,
    isPendingMapping = false,
    paymentMode,
    division = '',
    branch = '',
    addedBy = '',
    customerId,
    country = '',
    state = '',
    city = '',
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
  if (paymentDate) {
    queryParams.append('paymentDate', paymentDate);
  }
  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }
  if (status) {
    queryParams.append('status', status);
  }
  if (bank) {
    queryParams.append('paidThroughAccountId', bank);
  }
  if (paymentMode) {
    queryParams.append('paymentMode', paymentMode);
  }
  if (division) {
    queryParams.append('divisionId', division);
  }
  if (branch) {
    queryParams.append('branchId', branch);
  }
  if (isPendingMapping) {
    queryParams.append('isPendingMapping', true);
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
  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.PURCHASE.PAYMENT_MADE.BASE, config);
  return response.data;
}, 'getPaymentsMade');

const buildPaymentMadeExportConfig = payload => {
  const {
    search = '',
    paymentDate = null,
    startDate = null,
    endDate = null,
    status = '',
    sortBy = '',
    signal,
    bank,
    isSplit = false,
    isPendingMapping = false,
    paymentMode,
    division = '',
    branch = '',
    addedBy = '',
    customerId,
    country = '',
    state = '',
    city = '',
  } = payload;

  const queryParams = new URLSearchParams();
  if (isSplit) {
    queryParams.append('isSplit', isSplit);
  }
  if (search) {
    queryParams.append('search', search);
  }
  if (sortBy) {
    queryParams.append('sortBy', sortBy);
  }
  if (paymentDate) {
    queryParams.append('paymentDate', paymentDate);
  }
  if (startDate && endDate) {
    queryParams.append('startDate', startDate);
    queryParams.append('endDate', endDate);
  }
  if (status) {
    queryParams.append('status', status);
  }
  if (bank) {
    queryParams.append('paidThroughAccountId', bank);
  }
  if (paymentMode) {
    queryParams.append('paymentMode', paymentMode);
  }
  if (division) {
    queryParams.append('divisionId', division);
  }
  if (branch) {
    queryParams.append('branchId', branch);
  }
  if (isPendingMapping) {
    queryParams.append('isPendingMapping', true);
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

  return { params: queryParams, ...withAbortSignal(signal) };
};

const getPaymentsMadeExports = withErrorHandling(async payload => {
  const config = buildPaymentMadeExportConfig(payload);
  const response = await axiosConfig.get(API_ROUTES.PURCHASE.PAYMENT_MADE.EXPORT, config);
  return response.data;
}, 'getPaymentsMadeExports');

const createPaymentsMade = withErrorHandling(async paymentMadeData => {
  const { formData, hasFiles } = buildMultipartPayload(paymentMadeData, 'attachments', 'attachment');
  if (hasFiles && formData) {
    const response = await axiosConfig.post(API_ROUTES.PURCHASE.PAYMENT_MADE.CREATE, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }
  const response = await axiosConfig.post(API_ROUTES.PURCHASE.PAYMENT_MADE.CREATE, paymentMadeData);
  return response.data;
}, 'createPaymentsMade');

const updatePaymentsMade = withErrorHandling(async ({ paymentId, paymentMadeData }) => {
  const { formData, hasFiles } = buildMultipartPayload(paymentMadeData, 'attachments', 'attachment');
  if (hasFiles && formData) {
    const response = await axiosConfig.patch(API_ROUTES.PURCHASE.PAYMENT_MADE.UPDATE(paymentId), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }
  const response = await axiosConfig.patch(API_ROUTES.PURCHASE.PAYMENT_MADE.UPDATE(paymentId), paymentMadeData);
  return response.data;
}, 'updatePaymentsMade');

const getPaymentsMadeInvoice = withErrorHandling(async payload => {
  const { vendorId, branchId, creditBranchId, isSplit, signal, forCreditMapping, allowCrossBranchMapping } = payload;
  const queryParams = new URLSearchParams({ vendor: vendorId });
  if (branchId) queryParams.append('branchId', branchId);
  if (creditBranchId) queryParams.append('creditBranchId', creditBranchId);
  if (isSplit) queryParams.append('isSplit', isSplit);
  if (forCreditMapping) queryParams.append('forCreditMapping', forCreditMapping);
  if (allowCrossBranchMapping != null) {
    queryParams.append('allowCrossBranchMapping', allowCrossBranchMapping);
  }
  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.PURCHASE.PAYMENT_MADE.GET_PAYMENT_INVOICE, config);
  return response.data;
}, 'getPaymentsMadeInvoice');

const approvePaymentsMade = withErrorHandling(async payload => {
  const { paymentId, approvalNote, attachments, pdcChequeDate, chequeApprovalNote } = payload;
  const body = {
    approvalNote,
    ...(attachments && { attachments }),
    ...(pdcChequeDate && { pdcChequeDate }),
    ...(chequeApprovalNote !== undefined && { chequeApprovalNote }),
  };
  const { formData, hasFiles } = buildMultipartPayload(body, 'attachments', 'attachment');
  if (hasFiles && formData) {
    const response = await axiosConfig.patch(API_ROUTES.PURCHASE.PAYMENT_MADE.APPROVED_PAYMENT(paymentId), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }
  const response = await axiosConfig.patch(API_ROUTES.PURCHASE.PAYMENT_MADE.APPROVED_PAYMENT(paymentId), body);
  return response.data;
}, 'approvePaymentsMade');

const rejectPaymentsMade = withErrorHandling(async payload => {
  const { paymentId, approvalNote, attachments, pdcChequeDate, chequeApprovalNote } = payload;
  const body = {
    approvalNote,
    ...(attachments && { attachments }),
    ...(pdcChequeDate && { pdcChequeDate }),
    ...(chequeApprovalNote !== undefined && { chequeApprovalNote }),
  };
  const { formData, hasFiles } = buildMultipartPayload(body, 'attachments', 'attachment');
  if (hasFiles && formData) {
    const response = await axiosConfig.patch(API_ROUTES.PURCHASE.PAYMENT_MADE.REJECT(paymentId), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }
  const response = await axiosConfig.patch(API_ROUTES.PURCHASE.PAYMENT_MADE.REJECT(paymentId), body);
  return response.data;
}, 'rejectPaymentsMade');

const cancelPaymentsMade = withErrorHandling(async payload => {
  const { paymentId, notes } = payload;
  const response = await axiosConfig.patch(API_ROUTES.PURCHASE.PAYMENT_MADE.CANCEL(paymentId), notes);
  return response.data;
}, 'cancelPaymentsMade');

const getPaymentMadeById = withErrorHandling(async payload => {
  const { paymentId, signal } = payload;

  const config = { ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.PURCHASE.PAYMENT_MADE.GET(paymentId), config);
  return response.data;
}, 'getPaymentMadeById');

const removePaymentMade = withErrorHandling(async payload => {
  const { paymentId } = payload;
  const response = await axiosConfig.delete(API_ROUTES.PURCHASE.PAYMENT_MADE.REMOVE(paymentId));
  return response.data;
}, 'removePaymentMade');

const applyToBill = withErrorHandling(async payload => {
  const { paymentId, bills = [], openingBalanceTransactions = [], expenses = [] } = payload;
  const response = await axiosConfig.post(API_ROUTES.PURCHASE.PAYMENT_MADE.APPLY_TO_BILL(paymentId), {
    bills,
    openingBalanceTransactions,
    expenses,
  });
  return response.data;
}, 'applyToBill');

const removeApplyBill = withErrorHandling(async payload => {
  const { paymentId, ...body } = payload;
  const response = await axiosConfig.post(API_ROUTES.PURCHASE.PAYMENT_MADE.REMOVE_APPLY_BILL(paymentId), body);
  return response.data;
}, 'removeApplyBill');

const autoApplyPendingAdvancePaymentMade = withErrorHandling(async (payload = {}) => {
  const queryParams = new URLSearchParams();
  if (payload?.customerId) {
    queryParams.append('customerId', payload.customerId);
  }
  const response = await axiosConfig.post(API_ROUTES.PURCHASE.PAYMENT_MADE.AUTO_APPLY, {}, { params: queryParams });
  return response.data;
}, 'autoApplyPendingAdvancePaymentMade');

const addRefund = withErrorHandling(async payload => {
  const response = await axiosConfig.post(API_ROUTES.PURCHASE.PAYMENT_MADE.REFUND_ADD, payload);
  return response.data;
}, 'addRefund');

const updateRefund = withErrorHandling(async payload => {
  const { paymentMadeId, ...body } = payload;
  const response = await axiosConfig.patch(API_ROUTES.PURCHASE.PAYMENT_MADE.REFUND_UPDATE(paymentMadeId), body);
  return response.data;
}, 'updateRefund');

const deleteRefund = withErrorHandling(async payload => {
  const { paymentMadeId, refundId } = payload;
  const response = await axiosConfig.delete(API_ROUTES.PURCHASE.PAYMENT_MADE.REFUND_DELETE(paymentMadeId, refundId));
  return response.data;
}, 'deleteRefund');

export const paymentMadeService = {
  getPaymentsMade,
  getPaymentsMadeExports,
  createPaymentsMade,
  updatePaymentsMade,
  getPaymentsMadeInvoice,
  approvePaymentsMade,
  rejectPaymentsMade,
  cancelPaymentsMade,
  getPaymentMadeById,
  removePaymentMade,
  applyToBill,
  removeApplyBill,
  autoApplyPendingAdvancePaymentMade,
  addRefund,
  updateRefund,
  deleteRefund,
};
