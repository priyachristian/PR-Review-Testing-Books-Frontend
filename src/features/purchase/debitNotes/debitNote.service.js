import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { buildMultipartPayload } from 'utils/multipartHelper';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { buildDocumentExportRequestConfig } from '@/utils/documentExportQuery';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getDebitNotes = withErrorHandling(async payload => {
  const {
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    search = '',
    debitNoteDate = null,
    startDate = null,
    endDate = null,
    status = '',
    signal,
    sortBy = '',
    division = '',
    branch = '',
    isSplit = false,
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
  if (search) {
    queryParams.append('search', search);
  }
  if (sortBy) {
    queryParams.append('sortBy', sortBy);
  }
  if (status) {
    queryParams.append('status', status);
  }
  if (debitNoteDate) {
    queryParams.append('debitNoteDate', debitNoteDate);
  }
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

  const response = await axiosConfig.get(API_ROUTES.PURCHASE.DEBIT_NOTE.BASE, config);
  return response.data;
}, 'getDebitNotes');

const createDebitNotes = withErrorHandling(async debitNoteData => {
  const { formData } = buildMultipartPayload(debitNoteData, 'attachments', 'attachment');
  const response = await axiosConfig.post(API_ROUTES.PURCHASE.DEBIT_NOTE.CREATE, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}, 'createDebitNotes');

const updateDebitNotes = withErrorHandling(async ({ vendorId, debitNoteData }) => {
  const { formData } = buildMultipartPayload(debitNoteData, 'attachments', 'attachment');
  const response = await axiosConfig.patch(API_ROUTES.PURCHASE.DEBIT_NOTE.UPDATE(vendorId), formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}, 'updateDebitNotes');

const applyDebitNote = withErrorHandling(async payload => {
  const { debitNoteId, applications } = payload;
  const response = await axiosConfig.post(
    API_ROUTES.PURCHASE.DEBIT_NOTE.APPLY_DEBIT_NOTE(debitNoteId),
    {
      applications,
    },
    {}
  );
  return response.data;
}, 'applyDebitNote');

const getDebitNoteById = withErrorHandling(async payload => {
  const { debitNoteId, signal } = payload;

  let config = { ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.PURCHASE.DEBIT_NOTE.GET_DEBIT_NOTE_BY_ID(debitNoteId), { ...config });
  return response.data;
}, 'getDebitNoteById');

const removeDebitNote = withErrorHandling(async payload => {
  const { debitNoteId } = payload;

  const response = await axiosConfig.delete(API_ROUTES.PURCHASE.DEBIT_NOTE.REMOVE(debitNoteId), {});
  return response.data;
}, 'removeDebitNote');

const removeDebitNoteBillsApplied = withErrorHandling(async payload => {
  const { debitNoteId, documentId, billId } = payload;

  const response = await axiosConfig.patch(
    API_ROUTES.PURCHASE.DEBIT_NOTE.REMOVE_DEBIT_NOTE_BILL_APLLIED(debitNoteId),
    {
      documentId,
      billId,
    },
    {}
  );
  return response.data;
}, 'removeDebitNoteBillsApplied');

const updateDebitNoteStatus = withErrorHandling(async payload => {
  const { debitNoteId, status } = payload;

  let params = new URLSearchParams({});
  const response = await axiosConfig.patch(
    API_ROUTES.PURCHASE.DEBIT_NOTE.UPDATE_STATUS(debitNoteId),
    {
      status,
    },
    {
      params,
    }
  );
  return response.data;
}, 'updateDebitNoteStatus');

const createDebitNoteRefund = withErrorHandling(async payload => {
  const { debitNoteId, refundAmount, refundDate, toAccountId, reference, notes } = payload;

  const response = await axiosConfig.post(
    API_ROUTES.PURCHASE.DEBIT_NOTE.CREATE_REFUND(debitNoteId),
    {
      refundAmount,
      refundDate,
      toAccountId,
      reference,
      notes,
    },
    {}
  );
  return response.data;
}, 'createDebitNoteRefund');

const deleteDebitNoteRefund = withErrorHandling(async payload => {
  const { debitNoteId, refundId } = payload;

  const response = await axiosConfig.patch(
    API_ROUTES.PURCHASE.DEBIT_NOTE.DELETE_REFUND(debitNoteId),
    {
      refundId,
    },
    {}
  );
  return response.data;
}, 'deleteDebitNoteRefund');

const getDebitNoteExports = withErrorHandling(async payload => {
  const config = buildDocumentExportRequestConfig(payload, { dateField: 'debitNoteDate', extraFields: ['isSplit', 'country', 'state', 'city', 'addressType'] });
  const response = await axiosConfig.get(API_ROUTES.PURCHASE.DEBIT_NOTE.EXPORT, config);
  return response.data;
}, 'getDebitNoteExports');

export const debitNotesService = {
  getDebitNotes,
  createDebitNotes,
  updateDebitNotes,
  applyDebitNote,
  getDebitNoteById,
  removeDebitNote,
  removeDebitNoteBillsApplied,
  updateDebitNoteStatus,
  createDebitNoteRefund,
  deleteDebitNoteRefund,
  getDebitNoteExports,
};
