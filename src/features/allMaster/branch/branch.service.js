import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getBranch = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, search = '', sortBy = '', signal, status, isSplit = false, pagination = true, divisionId = '' } = payload;

  const queryParams = new URLSearchParams({
    page: page,
    limit: limit,
  });
  if (search) queryParams.append('search', search);
  if (sortBy) queryParams.append('sortBy', sortBy);
  if (divisionId) queryParams.append('divisionId', divisionId);
  if (isSplit) {
    queryParams.append('isSplit', isSplit);
  }
  if (!pagination) {
    queryParams.delete('page');
    queryParams.delete('limit');
    queryParams.append('pagination', pagination);
  }
  if (status) {
    queryParams.append('status', status);
  }

  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.ALL_MASTER.BRANCH.BASE, config);
  return response.data;
}, 'getBranch');

const getDivDropDown = withErrorHandling(async payload => {
  const { signal } = payload;
  const queryParams = new URLSearchParams({});
  const config = { params: queryParams, ...withAbortSignal(signal) };
  const response = await axiosConfig.get(API_ROUTES.ALL_MASTER.BRANCH.GET_DIVISION_DROP, config);
  return response.data;
}, 'getDivDropDown');

const deleteBranch = withErrorHandling(async id => {
  const response = await axiosConfig.delete(API_ROUTES.ALL_MASTER.BRANCH.DELETE(id));
  return response.data;
}, 'deleteBranch');

const createBranch = withErrorHandling(async branchData => {
  const response = await axiosConfig.post(API_ROUTES.ALL_MASTER.BRANCH.CREATE, branchData);
  return response.data;
}, 'createBranch');

const updateBranch = withErrorHandling(async ({ branchId, branchData }) => {
  const response = await axiosConfig.put(API_ROUTES.ALL_MASTER.BRANCH.UPDATE_BRANCH(branchId), branchData);
  return response.data;
}, 'updateBranch');

const getBranchById = withErrorHandling(async payload => {
  const { branchId, signal } = payload;

  let config = { ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.ALL_MASTER.BRANCH.GET_BY_ID(branchId), {
    ...config,
  });
  return response.data;
}, 'getBranchById');

const toggleBranchStatus = withErrorHandling(async payload => {
  const { branchId, isActive } = payload;
  const params = { isActive };
  const response = await axiosConfig.put(API_ROUTES.ALL_MASTER.BRANCH.TOGGLE_BRANCH_STATUS(branchId), {}, { params });
  return response.data;
}, 'toggleBranchStatus');

const getAllBranchDropDown = withErrorHandling(async payload => {
  const { signal } = payload;
  const queryParams = new URLSearchParams({});

  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.ALL_MASTER.BRANCH.GET_ALL_BRANCH_DROP, config);
  return response.data;
}, 'getAllBranchDropDown');

export const branchService = {
  getBranch,
  getDivDropDown,
  deleteBranch,
  createBranch,
  updateBranch,
  getBranchById,
  getAllBranchDropDown,
  toggleBranchStatus,
};
