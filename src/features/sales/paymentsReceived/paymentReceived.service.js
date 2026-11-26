import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { buildMultipartPayload } from 'utils/multipartHelper';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getPaymentsRecived = withErrorHandling(async payload => {
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
    bank = null,
    isSplit = false,
    isPendingMapping = false,
    paymentMode,
    division = '',
    branch = '',
    appName = '',
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

  if (sortBy) queryParams.append('sortBy', sortBy);

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
    queryParams.append('depositToAccountId', bank);
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
  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.SALES.PAYMENT_RECEIVED.BASE, config);
  return response.data;
}, 'getPaymentsRecived');

const buildPaymentReceivedExportConfig = payload => {
  const {
    search = '',
    paymentDate = null,
    startDate = null,
    endDate = null,
    status = '',
    sortBy = '',
    signal,
    bank = null,
    isSplit = false,
    isPendingMapping = false,
    paymentMode,
    division = '',
    branch = '',
    appName = '',
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
    queryParams.append('depositToAccountId', bank);
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

  return { params: queryParams, ...withAbortSignal(signal) };
};

const getPaymentsExports = withErrorHandling(async payload => {
  const config = buildPaymentReceivedExportConfig(payload);
  const response = await axiosConfig.get(API_ROUTES.SALES.PAYMENT_RECEIVED.EXPORT, config);
  return response.data;
}, 'getPaymentsExports');

const createPaymentsRecived = withErrorHandling(async paymentReceivedData => {
  const { formData } = buildMultipartPayload(paymentReceivedData, 'attachments', 'attachment');
  const response = await axiosConfig.post(API_ROUTES.SALES.PAYMENT_RECEIVED.CREATE, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}, 'createPaymentsRecived');

const updatePaymentsRecived = withErrorHandling(async ({ paymentId, paymentReceivedData }) => {
  const { formData } = buildMultipartPayload(paymentReceivedData, 'attachments', 'attachment');
  const response = await axiosConfig.patch(API_ROUTES.SALES.PAYMENT_RECEIVED.UPDATE(paymentId), formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}, 'updatePaymentsRecived');

const paymentFileUpload = withErrorHandling(async fileData => {
  const response = await axiosConfig.post(API_ROUTES.FILE.UPLOAD, fileData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}, 'paymentFileUpload');

const getPaymentInvoice = withErrorHandling(async payload => {
  const { customerId, branchId, creditBranchId, isSplit, forCreditMapping, allowCrossBranchMapping, signal } = payload;
  const queryParams = new URLSearchParams({ customerId });
  if (branchId) {
    queryParams.append('branchId', branchId);
  }
  if (creditBranchId) {
    queryParams.append('creditBranchId', creditBranchId);
  }
  if (isSplit) {
    queryParams.append('isSplit', isSplit);
  }
  if (forCreditMapping) {
    queryParams.append('forCreditMapping', forCreditMapping);
  }
  if (allowCrossBranchMapping != null) {
    queryParams.append('allowCrossBranchMapping', allowCrossBranchMapping);
  }

  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.SALES.PAYMENT_RECEIVED.GET_PAYMENT_INVOICE, config);
  return response.data;
}, 'getPaymentInvoice');

const approvePaymentsRecived = withErrorHandling(async payload => {
  const { paymentId, notes } = payload;
  const response = await axiosConfig.patch(API_ROUTES.SALES.PAYMENT_RECEIVED.APPROVED_PAYMENT_RECEIVED(paymentId), notes, {});
  return response.data;
}, 'approvePaymentsRecived');

const rejectPaymentsRecived = withErrorHandling(async payload => {
  const { paymentId, notes } = payload;
  const response = await axiosConfig.patch(API_ROUTES.SALES.PAYMENT_RECEIVED.REJECT(paymentId), notes, {});
  return response.data;
}, 'rejectPaymentsRecived');

const cancelPaymentsRecived = withErrorHandling(async payload => {
  const { paymentId, notes } = payload;
  const response = await axiosConfig.patch(API_ROUTES.SALES.PAYMENT_RECEIVED.CANCEL(paymentId), notes, {});
  return response.data;
}, 'cancelPaymentsRecived');

const getPaymentRecivedById = withErrorHandling(async payload => {
  const { paymentId, signal } = payload;

  let config = { ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.SALES.PAYMENT_RECEIVED.GET_BY_ID(paymentId), {
    ...config,
  });
  return response.data;
}, 'getPaymentRecivedById');

const removePaymentsRecived = withErrorHandling(async payload => {
  const { paymentId } = payload;
  const response = await axiosConfig.delete(API_ROUTES.SALES.PAYMENT_RECEIVED.REMOVE_PAYMENT_RECIVED(paymentId), {});
  return response.data;
}, 'removePaymentsRecived');

const applyToInvoice = withErrorHandling(async payload => {
  const { paymentId, invoices = [], openingBalanceTransactions = [], expenses = [] } = payload;
  const response = await axiosConfig.post(
    API_ROUTES.SALES.PAYMENT_RECEIVED.APPLY_TO_INVOICE(paymentId),
    {
      invoices,
      openingBalanceTransactions,
      expenses,
    },
    {}
  );
  return response.data;
}, 'applyToInvoice');

const removeApplyInvoice = withErrorHandling(async payload => {
  const { paymentId, ...body } = payload;
  const response = await axiosConfig.post(API_ROUTES.SALES.PAYMENT_RECEIVED.REMOVE_APPLY_INVOICE(paymentId), body, {});
  return response.data;
}, 'removeApplyInvoice');

const autoApplyPendingAdvancePayments = withErrorHandling(async (payload = {}) => {
  const queryParams = new URLSearchParams();
  if (payload?.customerId) {
    queryParams.append('customerId', payload.customerId);
  }
  const response = await axiosConfig.post(API_ROUTES.SALES.PAYMENT_RECEIVED.AUTO_APPLY, {}, { params: queryParams });
  return response.data;
}, 'autoApplyPendingAdvancePayments');

const addRefund = withErrorHandling(async payload => {
  const { ...body } = payload;
  const response = await axiosConfig.post(API_ROUTES.SALES.PAYMENT_RECEIVED.REFUND_ADD, body, {});
  return response.data;
}, 'addRefund');

const updateRefund = withErrorHandling(async payload => {
  const { paymentReceivedId, ...body } = payload;
  const response = await axiosConfig.patch(API_ROUTES.SALES.PAYMENT_RECEIVED.REFUND_UPDATE(paymentReceivedId), body, {});
  return response.data;
}, 'updateRefund');

const deleteRefund = withErrorHandling(async payload => {
  const { paymentReceivedId, refundId } = payload;
  const response = await axiosConfig.delete(API_ROUTES.SALES.PAYMENT_RECEIVED.REFUND_DELETE(paymentReceivedId, refundId), {});
  return response.data;
}, 'deleteRefund');

export const payemntReceivedService = {
  getPaymentsRecived,
  getPaymentsExports,
  createPaymentsRecived,
  updatePaymentsRecived,
  paymentFileUpload,
  getPaymentInvoice,
  approvePaymentsRecived,
  rejectPaymentsRecived,
  cancelPaymentsRecived,
  getPaymentRecivedById,
  removePaymentsRecived,
  applyToInvoice,
  removeApplyInvoice,
  autoApplyPendingAdvancePayments,
  addRefund,
  updateRefund,
  deleteRefund,
};
