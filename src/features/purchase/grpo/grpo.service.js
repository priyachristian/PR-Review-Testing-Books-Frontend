import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { buildMultipartPayload } from 'utils/multipartHelper';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { buildDocumentExportRequestConfig } from '@/utils/documentExportQuery';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getgrpos = withErrorHandling(async payload => {
  const {
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    search = '',
    grpoDate = null,
    startDate = null,
    endDate = null,
    status = '',
    signal,
    sortBy = '',
    division = '',
    branch = '',
    addedBy = '',
    customerId,
    isSplit = false,
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
    queryParams.append('isSplit', true);
  }
  if (search) {
    queryParams.append('search', search);
  }
  if (sortBy) {
    queryParams.append('sortBy', sortBy);
  }
  if (grpoDate) {
    queryParams.append('date', grpoDate);
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

  const response = await axiosConfig.get(API_ROUTES.PURCHASE.GRPO.BASE, config);
  return response.data;
}, 'getgrpos');

const createGrpos = async grpoData => {
  try {
    const { formData } = buildMultipartPayload(grpoData, 'attachments', 'attachment');
    const response = await axiosConfig.post(API_ROUTES.PURCHASE.GRPO.CREATE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error creating grpo order :', error);
    throw error;
  }
};

const updateGrpos = async (grpoId, grpoData) => {
  try {
    const { formData } = buildMultipartPayload(grpoData, 'attachments', 'attachment');
    const response = await axiosConfig.patch(API_ROUTES.PURCHASE.GRPO.UPDATE(grpoId), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error update grpo order :', error);
    throw error;
  }
};

const updateStatus = withErrorHandling(async payload => {
  const { grpoId, status } = payload;
  const response = await axiosConfig.patch(
    API_ROUTES.PURCHASE.GRPO.UPDATE_STATUS(grpoId),
    {
      status,
    },
    {}
  );
  return response.data;
}, 'updateStatus');

const getGrpoById = withErrorHandling(async payload => {
  const { grpoId, signal } = payload;

  let config = { ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.PURCHASE.GRPO.GET_BY_ID(grpoId), {
    ...config,
  });
  return response.data;
}, 'getGrpoById');

const removeGrpo = withErrorHandling(async payload => {
  const { grpoId } = payload;

  const response = await axiosConfig.delete(API_ROUTES.PURCHASE.GRPO.DELETE(grpoId), {});
  return response.data;
}, 'removeGrpo');

const getGrpoDropdownForConvert = withErrorHandling(async payload => {
  const { vendor, signal } = payload;
  const queryParams = new URLSearchParams({
    vendor: vendor,
  });
  let config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.PURCHASE.GRPO.GET_DROPDOWN, config);
  return response.data;
}, 'getGrpoDropdownForConvert');

const getGrpoExports = withErrorHandling(async payload => {
  const config = buildDocumentExportRequestConfig(payload, {
    dateField: 'grpoDate',
    dateQueryKey: 'date',
    extraFields: ['country', 'state', 'city', 'addressType'],
  });
  const response = await axiosConfig.get(API_ROUTES.PURCHASE.GRPO.EXPORT, config);
  return response.data;
}, 'getGrpoExports');

const getPendingItemsGrpo = withErrorHandling(async payload => {
  const { ids, signal } = payload;
  const queryParams = new URLSearchParams({
    id: ids,
  });
  let config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.PURCHASE.GRPO.GET_PENDING, config);
  return response.data;
}, 'getPendingItemsGrpo');

export const grpoService = {
  getgrpos,
  createGrpos,
  updateGrpos,
  updateStatus,
  getGrpoById,
  removeGrpo,
  getGrpoDropdownForConvert,
  getPendingItemsGrpo,
  getGrpoExports,
};
