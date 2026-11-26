import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { buildMultipartPayload } from 'utils/multipartHelper';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getManualJournal = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, search = '', date = null, startDate = null, endDate = null, signal, sortBy = '', division = '', branch = '' } = payload;
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
  if (date) {
    queryParams.append('date', date);
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
  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.ACCOUNTANT.MANUAL_JOURNAL.BASE, config);
  return response.data;
}, 'getManualJournal');

const createManualJournal = withErrorHandling(async journalData => {
  const { formData } = buildMultipartPayload(journalData, 'attachments', 'attachment');
  const response = await axiosConfig.post(API_ROUTES.ACCOUNTANT.MANUAL_JOURNAL.CREATE, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}, 'createManualJournal');

const updateManualJournal = withErrorHandling(async ({ manualJournalId, journalData }) => {
  const { formData } = buildMultipartPayload(journalData, 'attachments', 'attachment');
  const response = await axiosConfig.patch(API_ROUTES.ACCOUNTANT.MANUAL_JOURNAL.UPDATE(manualJournalId), formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
}, 'updateManualJournal');

const getManualJournalById = withErrorHandling(async payload => {
  const { manualJournalId, signal } = payload;

  let config = { ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.ACCOUNTANT.MANUAL_JOURNAL.GET_BY_ID(manualJournalId), config);
  return response.data;
}, 'getManualJournalById');

const getContactDropdown = withErrorHandling(async payload => {
  const { signal, branchId } = payload;

  let config = { ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.ACCOUNTANT.MANUAL_JOURNAL.GET_CONTACT_DROP_DOWN, {
    ...config,
    params: { branchId },
  });
  return response.data;
}, 'getContactDropdown');

const removeManualJournal = withErrorHandling(async payload => {
  const { manualJournalId } = payload;
  const response = await axiosConfig.delete(API_ROUTES.ACCOUNTANT.MANUAL_JOURNAL.DELETE(manualJournalId), {});
  return response.data;
}, 'removeManualJournal');

export const manualJournalService = {
  getManualJournal,
  createManualJournal,
  updateManualJournal,
  getManualJournalById,
  getContactDropdown,
  removeManualJournal,
};
