import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { buildMultipartPayload } from 'utils/multipartHelper';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { buildDocumentExportRequestConfig } from '@/utils/documentExportQuery';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getCreditNotes = withErrorHandling(async payload => {
  const {
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    search = '',
    status = '',
    creditNoteDate = null,
    startDate = null,
    endDate = null,
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
  if (creditNoteDate) {
    queryParams.append('creditNoteDate', creditNoteDate);
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

  const response = await axiosConfig.get(API_ROUTES.SALES.CREDIT_NOTES.BASE, config);
  return response.data;
}, 'getCreditNotes');

const createCreditNotes = withErrorHandling(async creditNoteData => {
  const { formData } = buildMultipartPayload(creditNoteData, 'attachments', 'attachment');
  const response = await axiosConfig.post(API_ROUTES.SALES.CREDIT_NOTES.CREATE, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}, 'createCreditNotes');

const updateCreditNotes = withErrorHandling(async ({ creditNotesId, creditNoteData }) => {
  const { formData } = buildMultipartPayload(creditNoteData, 'attachments', 'attachment');
  const response = await axiosConfig.patch(API_ROUTES.SALES.CREDIT_NOTES.UPDATE(creditNotesId), formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}, 'updateCreditNotes');

const applyCreditNote = withErrorHandling(async payload => {
  const { creditNoteId, applications } = payload;
  const response = await axiosConfig.post(
    API_ROUTES.SALES.CREDIT_NOTES.APPLY_CREDIT_NOTE(creditNoteId),
    {
      applications,
    },
    {}
  );
  return response.data;
}, 'applyCreditNote');

const getCreditNoteById = withErrorHandling(async payload => {
  const { creditNoteId, signal } = payload;

  let config = { ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.SALES.CREDIT_NOTES.GET_BY_ID(creditNoteId), {
    ...config,
  });
  return response.data;
}, 'getCreditNoteById');

const removeCreditNote = withErrorHandling(async payload => {
  const { creditNoteId } = payload;

  const response = await axiosConfig.delete(API_ROUTES.SALES.CREDIT_NOTES.REMOVE_CREDIT_NOTE(creditNoteId), {});
  return response.data;
}, 'removeCreditNote');

const removeCreditNoteInvoice = withErrorHandling(async payload => {
  const { creditNoteId, documentId, invoiceId, openingBalanceTransactionId } = payload;
  const body = { documentId };
  if (openingBalanceTransactionId) {
    body.openingBalanceTransactionId = openingBalanceTransactionId;
  } else {
    body.invoiceId = invoiceId;
  }
  const response = await axiosConfig.patch(API_ROUTES.SALES.CREDIT_NOTES.REMOVE_CREDIT_NOTE_INVOICE(creditNoteId), body, {});
  return response.data;
}, 'removeCreditNoteInvoice');

const updateCreditNoteStatus = withErrorHandling(async payload => {
  const { creditNoteId, status } = payload;

  let params = new URLSearchParams({});
  const response = await axiosConfig.patch(
    API_ROUTES.SALES.CREDIT_NOTES.UPDATE_CREDIT_SATUS(creditNoteId),
    {
      status,
    },
    {
      params,
    }
  );
  return response.data;
}, 'updateCreditNoteStatus');

const createCreditNoteRefund = withErrorHandling(async payload => {
  const { creditNoteId, refundAmount, refundDate, fromAccountId, reference, notes } = payload;

  const response = await axiosConfig.post(
    API_ROUTES.SALES.CREDIT_NOTES.CREATE_REFUND(creditNoteId),
    {
      refundAmount,
      refundDate,
      fromAccountId,
      reference,
      notes,
    },
    {}
  );
  return response.data;
}, 'createCreditNoteRefund');

const deleteCreditNoteRefund = withErrorHandling(async payload => {
  const { creditNoteId, refundId } = payload;

  const response = await axiosConfig.patch(
    API_ROUTES.SALES.CREDIT_NOTES.DELETE_REFUND(creditNoteId),
    {
      refundId,
    },
    {}
  );
  return response.data;
}, 'deleteCreditNoteRefund');

const getCreditNoteExports = withErrorHandling(async payload => {
  const config = buildDocumentExportRequestConfig(payload, { dateField: 'creditNoteDate', extraFields: ['isSplit', 'country', 'state', 'city', 'addressType'] });
  const response = await axiosConfig.get(API_ROUTES.SALES.CREDIT_NOTES.EXPORT, config);
  return response.data;
}, 'getCreditNoteExports');

export const creditNoteService = {
  getCreditNotes,
  createCreditNotes,
  updateCreditNotes,
  applyCreditNote,
  getCreditNoteById,
  removeCreditNote,
  removeCreditNoteInvoice,
  updateCreditNoteStatus,
  createCreditNoteRefund,
  deleteCreditNoteRefund,
  getCreditNoteExports,
};
