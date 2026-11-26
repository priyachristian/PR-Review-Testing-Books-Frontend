import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { moduleSliceMethods } from '@/features/common/module/moduleSlice';

export const useModule = () => {
  const dispatch = useDispatch();

  const { modules, permissionModules, permissionPlanMap, featureInPlanMap, hardHiddenPlanFeatures, loading, settingsPlanLoaded, error, accessibleModules } = useSelector(state => state.module);

  const getModuleList = useCallback(
    async payload => {
      try {
        const response = await dispatch(moduleSliceMethods.getModuleList(payload));

        return response;
      } catch (error) {
        console.error('Error in getModuleList:', error);
        throw error; // Ensure error is still propagated
      }
    },
    [dispatch]
  );

  const getAccessibleModules = useCallback(
    async payload => {
      try {
        const response = await dispatch(moduleSliceMethods.getAccessibleModules(payload));

        return response;
      } catch (error) {
        console.error('Error in getAccessibleModules:', error);
        throw error; // Ensure error is still propagated
      }
    },
    [dispatch]
  );

  const getSettingsFeaturePlan = useCallback(async () => {
    try {
      const response = await dispatch(moduleSliceMethods.getSettingsFeaturePlan());

      return response;
    } catch (error) {
      console.error('Error in getSettingsFeaturePlan:', error);
      throw error; // Ensure error is still propagated
    }
  }, [dispatch]);

  return {
    modules,
    permissionModules,
    permissionPlanMap,
    featureInPlanMap,
    hardHiddenPlanFeatures,
    loading,
    settingsPlanLoaded,
    error,
    accessibleModules,
    getModuleList,
    getAccessibleModules,
    getSettingsFeaturePlan,
  };
};
