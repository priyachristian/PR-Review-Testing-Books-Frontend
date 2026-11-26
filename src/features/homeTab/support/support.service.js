import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { buildMultipartPayload } from '@/utils/multipartHelper';
import { withErrorHandling } from '@/utils/serviceHelper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getSupports = withErrorHandling(async payload => {
  const { signal, ...rest } = payload;
  const params = {
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    pagination: true,
    ...rest,
  };

  const queryParams = Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''));
  const response = await axiosConfig.get(API_ROUTES.SUPPORT.BASE, {
    params: queryParams,
    signal,
  });
  return response.data;
}, 'getSupports');

const createSupport = withErrorHandling(async payload => {
  const { formData } = buildMultipartPayload(payload, 'attachments', 'attachment');
  const response = await axiosConfig.post(API_ROUTES.SUPPORT.CREATE, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}, 'createSupport');

const supportFileUpload = withErrorHandling(async payload => {
  const response = await axiosConfig.post(API_ROUTES.FILE.UPLOAD, payload, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}, 'supportFileUpload');

const getSupportById = withErrorHandling(async payload => {
  const { supportId } = payload;
  const response = await axiosConfig.get(API_ROUTES.SUPPORT.GET_SUPPORT_ID(supportId), {});
  return response.data;
}, 'getSupportById');

const sendComment = withErrorHandling(async payload => {
  const { supportId, ...body } = payload;
  const response = await axiosConfig.post(API_ROUTES.SUPPORT.SEND(supportId), body, {});
  return response.data;
}, 'sendComment');

export const supportService = {
  getSupports,
  createSupport,
  supportFileUpload,
  getSupportById,
  sendComment,
};
