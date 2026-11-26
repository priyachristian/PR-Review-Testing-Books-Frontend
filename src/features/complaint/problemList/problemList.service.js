import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';

const getProblemList = withErrorHandling(async payload => {
  const { problemType, isActive, search, signal, ...rest } = payload ?? {};
  const params = { ...rest };
  if (problemType) params.problemType = problemType;
  if (typeof isActive !== 'undefined' && isActive !== null && isActive !== '') {
    params.isActive = isActive;
  }
  if (search) params.search = search;

  const response = await axiosConfig.get(API_ROUTES.COMPLAINTS.PROBLEM_LIST.BASE, {
    params,
    ...withAbortSignal(signal),
  });
  return response.data;
}, 'getProblemList');

const getProblemListById = withErrorHandling(async payload => {
  const { id, signal } = payload ?? {};
  const response = await axiosConfig.get(API_ROUTES.COMPLAINTS.PROBLEM_LIST.GET_BY_ID(id), {
    ...withAbortSignal(signal),
  });
  return response.data;
}, 'getProblemListById');

const createProblemList = withErrorHandling(async data => {
  const response = await axiosConfig.post(API_ROUTES.COMPLAINTS.PROBLEM_LIST.CREATE, data);
  return response.data;
}, 'createProblemList');

const updateProblemList = withErrorHandling(async ({ id, data }) => {
  const response = await axiosConfig.put(API_ROUTES.COMPLAINTS.PROBLEM_LIST.UPDATE(id), data);
  return response.data;
}, 'updateProblemList');

const deleteProblemList = withErrorHandling(async payload => {
  const { id } = payload ?? {};
  const response = await axiosConfig.delete(API_ROUTES.COMPLAINTS.PROBLEM_LIST.DELETE(id));
  return response.data;
}, 'deleteProblemList');

export const problemListService = {
  getProblemList,
  getProblemListById,
  createProblemList,
  updateProblemList,
  deleteProblemList,
};
