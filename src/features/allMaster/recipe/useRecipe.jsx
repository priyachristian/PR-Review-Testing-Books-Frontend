import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { recipeSliceMethods, resetRecipe as resetRecipeAction } from '@/features/allMaster/recipe/recipe.slice';

export const useRecipe = () => {
  const dispatch = useDispatch();

  const { recipes, loading, error, pagination } = useSelector(state => state.recipe);

  const getRecipes = useCallback(
    async payload => {
      const response = await dispatch(recipeSliceMethods.getRecipes(payload));
      return response;
    },
    [dispatch]
  );

  const addRecipe = useCallback(
    async values => {
      const response = await dispatch(recipeSliceMethods.addRecipe(values));
      return response;
    },
    [dispatch]
  );

  const updateRecipe = useCallback(
    async recipeData => {
      const response = await dispatch(recipeSliceMethods.updateRecipe(recipeData));
      return response;
    },
    [dispatch]
  );

  const deleteRecipe = useCallback(
    async payload => {
      return await dispatch(recipeSliceMethods.deleteRecipe(payload)).unwrap();
    },
    [dispatch]
  );

  const resetRecipe = useCallback(() => dispatch(resetRecipeAction()), [dispatch]);

  return { recipes, loading, error, pagination, getRecipes, addRecipe, updateRecipe, deleteRecipe, resetRecipe };
};
