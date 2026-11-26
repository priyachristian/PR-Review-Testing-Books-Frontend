import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { deviceSliceMethods } from './device.slice';

export const useDevice = () => {
  const dispatch = useDispatch();
  const { loading, error, isRegistered } = useSelector(state => state.device);

  const registerDeviceToken = useCallback(() => dispatch(deviceSliceMethods.registerDeviceToken()), [dispatch]);

  return {
    loading,
    error,
    isRegistered,
    registerDeviceToken,
  };
};
