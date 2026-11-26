import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';
import { recipeService } from './recipe.service';

const getRecipes = createAsyncThunk('recipe/getRecipes', recipeService.getRecipes);

const addRecipe = createAsyncThunk('recipe/addRecipe', recipeService.addRecipe);

const updateRecipe = createAsyncThunk('recipe/updateRecipe', recipeService.updateRecipe);

const deleteRecipe = createAsyncThunk('recipe/deleteRecipe', recipeService.deleteRecipe);

export const recipeSlice = createSlice({
  name: 'recipe',
  initialState: {
    recipes: [],
    loading: false,
    error: null,
    pagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
    },
  },
  reducers: {
    resetRecipe: state => {
      state.recipes = [];
      state.pagination = {
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        totalPages: 1,
        totalResults: 0,
      };
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getRecipes.pending, state => {
        state.loading = true;
      })
      .addCase(getRecipes.fulfilled, (state, action) => {
        state.loading = false;
        state.recipes = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalResults: action.payload.extras.totalResults,
        };
      })
      .addCase(getRecipes.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.loading = false;
          state.error = action.error.message;
          state.recipes = [];
        }
      })
      .addCase(addRecipe.pending, state => {
        state.loading = true;
      })
      .addCase(addRecipe.fulfilled, (state, action) => {
        state.loading = false;
        Toast.success(action.payload.message);
      })
      .addCase(addRecipe.rejected, (state, action) => {
        state.loading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updateRecipe.pending, state => {
        state.loading = true;
      })
      .addCase(updateRecipe.fulfilled, (state, action) => {
        state.loading = false;
        Toast.success(action.payload.message);
      })
      .addCase(updateRecipe.rejected, (state, action) => {
        state.loading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(deleteRecipe.fulfilled, (_, action) => {
        Toast.success(action.payload.message);
      })
      .addCase(deleteRecipe.rejected, (state, action) => {
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      });
  },
});
export const recipeSliceMethods = { getRecipes, addRecipe, updateRecipe, deleteRecipe };
export const { resetRecipe } = recipeSlice.actions;
export default recipeSlice.reducer;
