import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { buildMultipartPayload } from 'utils/multipartHelper';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { buildDocumentExportRequestConfig } from '@/utils/documentExportQuery';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getQuotes = withErrorHandling(async payload => {
  const {
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    search = '',
    quoteDate = null,
    startDate = null,
    endDate = null,
    status = '',
    sortBy = '',
    signal,
    division,
    branch,
    customerId,
    appName = '',
    addedBy = '',
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
  if (quoteDate) {
    queryParams.append('quoteDate', quoteDate);
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

  const response = await axiosConfig.get(API_ROUTES.SALES.QUOTE.BASE, config);
  return response.data;
}, 'getQuotes');

const createQuotes = async quoteData => {
  const { formData } = buildMultipartPayload(quoteData, 'attachments', 'attachment');

  const response = await axiosConfig.post(API_ROUTES.SALES.QUOTE.CREATE, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

const updateQuotes = async ({ quoteId, quoteData }) => {
  const { formData } = buildMultipartPayload(quoteData, 'attachments', 'attachment');
  const response = await axiosConfig.patch(API_ROUTES.SALES.QUOTE.UPDATE(quoteId), formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

const quoteFileUpload = withErrorHandling(async fileData => {
  const response = await axiosConfig.post(API_ROUTES.FILE.UPLOAD, fileData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}, 'quoteFileUpload');

const getQuoteCustomerProject = withErrorHandling(async customerId => {
  const response = await axiosConfig.get(API_ROUTES.SALES.QUOTE.GET_QUOTE_CUSTOMER_PROJECT, {
    params: { customerId },
  });
  return response.data;
}, 'getQuoteCustomerProject');

const updateStatus = withErrorHandling(async payload => {
  const { quoteId, status, rejectionReason } = payload;
  const response = await axiosConfig.patch(
    API_ROUTES.SALES.QUOTE.UPDATE_STATUS(quoteId),
    {
      status,
      ...(rejectionReason ? { rejectionReason } : {}),
    },
    {}
  );
  return response.data;
}, 'updateStatus');

const getQuoteById = withErrorHandling(async payload => {
  const { quoteId, signal } = payload;

  const config = { ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.SALES.QUOTE.GET_QUOTE_BY_ID(quoteId), {
    ...config,
  });
  return response.data;
}, 'getQuoteById');

const removeQuote = withErrorHandling(async payload => {
  const { quoteId } = payload;

  const response = await axiosConfig.delete(API_ROUTES.SALES.QUOTE.DELETE(quoteId), {});
  return response.data;
}, 'removeQuote');

const getQuoteExports = withErrorHandling(async payload => {
  const config = buildDocumentExportRequestConfig(payload, { dateField: 'quoteDate', extraFields: ['country', 'state', 'city', 'addressType'] });
  const response = await axiosConfig.get(API_ROUTES.SALES.QUOTE.EXPORT, config);
  return response.data;
}, 'getQuoteExports');

export const quoteService = {
  getQuotes,
  createQuotes,
  updateQuotes,
  quoteFileUpload,
  getQuoteCustomerProject,
  updateStatus,
  getQuoteById,
  removeQuote,
  getQuoteExports,
};
