import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { developmentUpdateSliceMethods, resetDevelopmentUpdate as resetDevelopmentUpdateAction } from '@/features/homeTab/developmentUpdate/developmentUpdate.slice';

export const useDevelopmentUpdate = () => {
  const dispatch = useDispatch();

  const { developmentUpdate, loading, error } = useSelector(state => state.developmentUpdate);

  const getDevelopmentUpdate = useCallback(
    async payload => {
      return await dispatch(developmentUpdateSliceMethods.getDevelopmentUpdate(payload));
    },
    [dispatch]
  );

  const resetDevelopmentUpdate = useCallback(() => dispatch(resetDevelopmentUpdateAction()), [dispatch]);

  return {
    developmentUpdate,
    loading,
    error,
    getDevelopmentUpdate,
    resetDevelopmentUpdate,
  };
};
