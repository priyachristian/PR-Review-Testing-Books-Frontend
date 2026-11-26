import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { buildMultipartPayload, buildMultipartPayloadMultipleFields } from 'utils/multipartHelper';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const COMPLAINT_MEDIA_FIELDS = [
  { path: 'attachments', formFieldName: 'attachment' },
  { path: 'photos', formFieldName: 'photo' },
];

const postJsonOrMultipart = async (url, data, attachmentPath = 'attachments') => {
  const payload = data ?? {};
  const { formData, hasFiles } = buildMultipartPayload(payload, attachmentPath, 'attachment');

  if (hasFiles && formData) {
    const response = await axiosConfig.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  const response = await axiosConfig.post(url, payload);
  return response.data;
};

const postOrPutComplaintMedia = async (url, data, method = 'post') => {
  const payload = data ?? {};
  const { formData, hasFiles } = buildMultipartPayloadMultipleFields(payload, COMPLAINT_MEDIA_FIELDS);

  if (hasFiles && formData) {
    const response = await axiosConfig[method](url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  const response = await axiosConfig[method](url, payload);
  return response.data;
};

const getComplaints = withErrorHandling(async payload => {
  const {
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    search = '',
    problemType = '',
    status = '',
    formType = '',
    currentStep = '',
    assignedTo = '',
    customerId = '',
    sortBy = '',
    pagination,
    signal,
  } = payload ?? {};

  const params = { page, limit };
  if (search) params.search = search;
  if (problemType) params.problemType = problemType;
  if (status) params.status = status;
  if (formType) params.formType = formType;
  if (currentStep) params.currentStep = currentStep;
  if (assignedTo) params.assignedTo = assignedTo;
  if (customerId) params.customerId = customerId;
  if (sortBy) params.sortBy = sortBy;
  if (typeof pagination !== 'undefined' && pagination !== null && pagination !== '') {
    params.pagination = pagination;
  }

  const response = await axiosConfig.get(API_ROUTES.COMPLAINTS.BASE, {
    params,
    ...withAbortSignal(signal),
  });
  return response.data;
}, 'getComplaints');

const getComplaintById = withErrorHandling(async payload => {
  const { complaintId, signal } = payload ?? {};
  const response = await axiosConfig.get(API_ROUTES.COMPLAINTS.GET_BY_ID(complaintId), {
    ...withAbortSignal(signal),
  });
  return response.data;
}, 'getComplaintById');

const getComplaintDropdown = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, search = '', signal } = payload || {};
  const queryParams = new URLSearchParams({ page, limit });
  if (search) queryParams.append('search', search);
  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.COMPLAINTS.DROPDOWN, config);
  return response.data;
}, 'getComplaintDropdown');

const createComplaint = withErrorHandling(async data => {
  return postOrPutComplaintMedia(API_ROUTES.COMPLAINTS.CREATE, data, 'post');
}, 'createComplaint');

const updateComplaint = withErrorHandling(async ({ complaintId, data }) => {
  return postOrPutComplaintMedia(API_ROUTES.COMPLAINTS.UPDATE(complaintId), data, 'put');
}, 'updateComplaint');

const deleteComplaint = withErrorHandling(async payload => {
  const { complaintId } = payload ?? {};
  const response = await axiosConfig.delete(API_ROUTES.COMPLAINTS.DELETE(complaintId));
  return response.data;
}, 'deleteComplaint');

const assignComplaint = withErrorHandling(async ({ complaintId, data }) => {
  const response = await axiosConfig.post(API_ROUTES.COMPLAINTS.STEP_ASSIGN(complaintId), data ?? {});
  return response.data;
}, 'assignComplaint');

const replyComplaint = withErrorHandling(async ({ complaintId, data }) => {
  return postJsonOrMultipart(API_ROUTES.COMPLAINTS.STEP_REPLY(complaintId), data, 'proofAttachments');
}, 'replyComplaint');

const startProgress = withErrorHandling(async ({ complaintId, data }) => {
  const response = await axiosConfig.post(API_ROUTES.COMPLAINTS.STEP_START_PROGRESS(complaintId), data ?? {});
  return response.data;
}, 'startProgress');

const setWarranty = withErrorHandling(async ({ complaintId, data }) => {
  const response = await axiosConfig.post(API_ROUTES.COMPLAINTS.STEP_WARRANTY(complaintId), data ?? {});
  return response.data;
}, 'setWarranty');

const setRootCause = withErrorHandling(async ({ complaintId, data }) => {
  const response = await axiosConfig.post(API_ROUTES.COMPLAINTS.STEP_ROOT_CAUSE(complaintId), data ?? {});
  return response.data;
}, 'setRootCause');

const setStopGap = withErrorHandling(async ({ complaintId, data }) => {
  const response = await axiosConfig.post(API_ROUTES.COMPLAINTS.STEP_STOP_GAP(complaintId), data ?? {});
  return response.data;
}, 'setStopGap');

const recordProgress = withErrorHandling(async ({ complaintId, data }) => {
  const response = await axiosConfig.post(API_ROUTES.COMPLAINTS.STEP_RECORD_PROGRESS(complaintId), data ?? {});
  return response.data;
}, 'recordProgress');

const setSettlement = withErrorHandling(async ({ complaintId, data }) => {
  const response = await axiosConfig.post(API_ROUTES.COMPLAINTS.STEP_SETTLEMENT(complaintId), data ?? {});
  return response.data;
}, 'setSettlement');

const approveSettlement = withErrorHandling(async ({ complaintId, data }) => {
  const response = await axiosConfig.post(API_ROUTES.COMPLAINTS.STEP_APPROVE_SETTLEMENT(complaintId), data ?? {});
  return response.data;
}, 'approveSettlement');

const completeAction = withErrorHandling(async ({ complaintId, data }) => {
  const response = await axiosConfig.post(API_ROUTES.COMPLAINTS.STEP_COMPLETE_ACTION(complaintId), data ?? {});
  return response.data;
}, 'completeAction');

const verifyComplaint = withErrorHandling(async ({ complaintId, data }) => {
  const response = await axiosConfig.post(API_ROUTES.COMPLAINTS.STEP_VERIFY(complaintId), data ?? {});
  return response.data;
}, 'verifyComplaint');

const closeComplaint = withErrorHandling(async ({ complaintId, data }) => {
  const response = await axiosConfig.post(API_ROUTES.COMPLAINTS.STEP_CLOSE(complaintId), data ?? {});
  return response.data;
}, 'closeComplaint');

const reopenComplaint = withErrorHandling(async ({ complaintId, data }) => {
  const response = await axiosConfig.post(API_ROUTES.COMPLAINTS.ACTION_REOPEN(complaintId), data ?? {});
  return response.data;
}, 'reopenComplaint');

const handToSomeone = withErrorHandling(async ({ complaintId, data }) => {
  return postJsonOrMultipart(API_ROUTES.COMPLAINTS.ACTION_HAND_TO_SOMEONE(complaintId), data ?? {});
}, 'handToSomeone');

const setWaiting = withErrorHandling(async ({ complaintId, data }) => {
  return postJsonOrMultipart(API_ROUTES.COMPLAINTS.ACTION_WAITING(complaintId), data ?? {});
}, 'setWaiting');

const escalateComplaint = withErrorHandling(async ({ complaintId, data }) => {
  return postJsonOrMultipart(API_ROUTES.COMPLAINTS.ACTION_ESCALATE(complaintId), data ?? {});
}, 'escalateComplaint');

const markNotReal = withErrorHandling(async ({ complaintId, data }) => {
  return postJsonOrMultipart(API_ROUTES.COMPLAINTS.ACTION_NOT_REAL(complaintId), data ?? {});
}, 'markNotReal');

const linkComplaint = withErrorHandling(async ({ complaintId, data }) => {
  return postJsonOrMultipart(API_ROUTES.COMPLAINTS.ACTION_LINK(complaintId), data ?? {});
}, 'linkComplaint');

const skipStep = withErrorHandling(async ({ complaintId, data }) => {
  const response = await axiosConfig.post(API_ROUTES.COMPLAINTS.STEP_SKIP(complaintId), data ?? {});
  return response.data;
}, 'skipStep');

const addTeamNote = withErrorHandling(async ({ complaintId, data }) => {
  const response = await axiosConfig.post(API_ROUTES.COMPLAINTS.TEAM_NOTES(complaintId), data ?? {});
  return response.data;
}, 'addTeamNote');

const addTeamTask = withErrorHandling(async ({ complaintId, data }) => {
  const response = await axiosConfig.post(API_ROUTES.COMPLAINTS.TEAM_TASKS(complaintId), data ?? {});
  return response.data;
}, 'addTeamTask');

const updateTeamTask = withErrorHandling(async ({ complaintId, taskId, data }) => {
  const response = await axiosConfig.patch(API_ROUTES.COMPLAINTS.UPDATE_TEAM_TASK(complaintId, taskId), data ?? {});
  return response.data;
}, 'updateTeamTask');

export const complaintService = {
  getComplaints,
  getComplaintById,
  getComplaintDropdown,
  createComplaint,
  updateComplaint,
  deleteComplaint,
  assignComplaint,
  replyComplaint,
  startProgress,
  setWarranty,
  setRootCause,
  setStopGap,
  recordProgress,
  setSettlement,
  approveSettlement,
  completeAction,
  verifyComplaint,
  closeComplaint,
  reopenComplaint,
  handToSomeone,
  setWaiting,
  escalateComplaint,
  markNotReal,
  linkComplaint,
  skipStep,
  addTeamNote,
  addTeamTask,
  updateTeamTask,
};
