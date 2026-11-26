import { API_ROUTES } from '@/utils/apiRoute';
import axiosConfig from 'app/axiosConfig';
import { withErrorHandling, withAbortSignal } from '@/utils/serviceHelper';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getRecipes = withErrorHandling(async payload => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE, search = '', sortBy = '', signal } = payload;
  const queryParams = new URLSearchParams({
    page: page,
    limit: limit,
  });
  if (search) queryParams.append('search', search);
  if (sortBy) queryParams.append('sortBy', sortBy);

  const config = { params: queryParams, ...withAbortSignal(signal) };

  const response = await axiosConfig.get(API_ROUTES.ALL_MASTER.RECIPE.BASE, config);
  return response.data;
}, 'getRecipes');

const addRecipe = withErrorHandling(async recipeData => {
  const response = await axiosConfig.post(API_ROUTES.ALL_MASTER.RECIPE.CREATE, recipeData);
  return response.data;
}, 'addRecipe');

const updateRecipe = withErrorHandling(async ({ id, name, processes, remarks }) => {
  const updatedData = {
    name,
    processes,
    remarks,
  };
  const response = await axiosConfig.patch(API_ROUTES.ALL_MASTER.RECIPE.UPDATE(id), updatedData, {});
  return response.data;
}, 'updateRecipe');

const deleteRecipe = withErrorHandling(async ({ recipeId }) => {
  const response = await axiosConfig.delete(API_ROUTES.ALL_MASTER.RECIPE.DELETE(recipeId));
  return response.data;
}, 'deleteRecipe');

export const recipeService = {
  getRecipes,
  addRecipe,
  updateRecipe,
  deleteRecipe,
};
