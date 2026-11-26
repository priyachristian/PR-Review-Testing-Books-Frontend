import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setupChargeSliceMethods } from '@/features/setting/setupCharge/setupChargeSlice';

export const useSetupCharge = () => {
  const dispatch = useDispatch();

  const { company, loading, error } = useSelector(state => state.setupcharge);

  const getCompany = useCallback(async payload => await dispatch(setupChargeSliceMethods.getCompany(payload)), [dispatch]);

  const createSetupCharge = useCallback(async payload => await dispatch(setupChargeSliceMethods.createSetupCharge(payload)).unwrap(), [dispatch]);

  const updateSetupCharge = useCallback(async payload => await dispatch(setupChargeSliceMethods.updateSetupCharge(payload)).unwrap(), [dispatch]);

  const deleteSetupCharge = useCallback(async payload => await dispatch(setupChargeSliceMethods.deleteSetupCharge(payload)).unwrap(), [dispatch]);

  return {
    company,
    loading,
    error,
    createSetupCharge,
    updateSetupCharge,
    getCompany,
    deleteSetupCharge,
  };
};
