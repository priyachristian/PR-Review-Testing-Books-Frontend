// Config
import axiosConfig from 'app/axiosConfig';

// Utils
import { API_ROUTES } from '@/utils/apiRoute';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getSampleCatalogs = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, search = '', status = '', visibility = '', sortBy = '', pagination, signal } = payload;

  const queryParams = new URLSearchParams({ page, limit });
  if (search) queryParams.append('search', search);
  if (status) queryParams.append('status', status);
  if (visibility) queryParams.append('visibility', visibility);
  if (sortBy) queryParams.append('sortBy', sortBy);
  if (pagination === false) queryParams.append('pagination', 'false');

  const response = await axiosConfig.get(API_ROUTES.SAMPLE_CATALOG.BASE, { params: queryParams, ...withAbortSignal(signal) });
  return response.data;
}, 'getSampleCatalogs');

const getSampleCatalogById = withErrorHandling(async ({ sampleCatalogId, signal }) => {
  const response = await axiosConfig.get(API_ROUTES.SAMPLE_CATALOG.GET_BY_ID(sampleCatalogId), { ...withAbortSignal(signal) });
  return response.data;
}, 'getSampleCatalogById');

// The backend answers 409 with the items to turn on in the customer portal; return it so the page can ask the user.
const withPortalActivation = request => async payload => {
  try {
    return await request(payload);
  } catch (error) {
    const data = error?.response?.data?.data;
    if (error?.response?.status === 409 && data?.portalActivationRequired) return { activationRequired: data };
    throw error;
  }
};

const createSampleCatalog = withErrorHandling(
  withPortalActivation(async catalogData => {
    const response = await axiosConfig.post(API_ROUTES.SAMPLE_CATALOG.BASE, catalogData);
    return response.data;
  }),
  'createSampleCatalog'
);

const updateSampleCatalog = withErrorHandling(
  withPortalActivation(async ({ sampleCatalogId, catalogData }) => {
    const response = await axiosConfig.patch(API_ROUTES.SAMPLE_CATALOG.GET_BY_ID(sampleCatalogId), catalogData);
    return response.data;
  }),
  'updateSampleCatalog'
);

const updateSampleCatalogStatus = withErrorHandling(
  withPortalActivation(async ({ sampleCatalogId, status, activateItemPortal = false }) => {
    const response = await axiosConfig.patch(API_ROUTES.SAMPLE_CATALOG.UPDATE_STATUS(sampleCatalogId), { status, ...(activateItemPortal && { activateItemPortal }) });
    return response.data;
  }),
  'updateSampleCatalogStatus'
);

export const sampleCatalogService = {
  getSampleCatalogs,
  getSampleCatalogById,
  createSampleCatalog,
  updateSampleCatalog,
  updateSampleCatalogStatus,
};
