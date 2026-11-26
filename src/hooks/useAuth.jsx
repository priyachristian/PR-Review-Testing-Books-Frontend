import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { authSliceMethods, setIsViewOnly as setIsViewOnlyAction } from 'features/auth/authSlice';

export const useAuth = () => {
  const dispatch = useDispatch();

  const {
    email,
    accessToken,
    refreshToken,
    companyId,
    inviteData,
    tokenCheck,
    isAuthenticated,
    verify,
    tokenLoading,
    resend,
    addorg,
    signin,
    loading,
    verifyloading,
    error,
    loadingToastId,
    checktokenReset,
    isViewOnly,
    tokenError,
  } = useSelector(state => state.auth);

  const checktoken = useCallback(async (options = {}) => await dispatch(authSliceMethods.checktoken(options)), [dispatch]);

  const forgotPassword = useCallback(async forgotData => await dispatch(authSliceMethods.forgotPassword(forgotData)).unwrap(), [dispatch]);

  const checktokenResetPassword = useCallback(async payload => await dispatch(authSliceMethods.checktokenResetPassword(payload)), [dispatch]);

  const logoutApi = useCallback(async () => await dispatch(authSliceMethods.logoutApi()).unwrap(), [dispatch]);

  const setIsViewOnly = useCallback(payload => dispatch(setIsViewOnlyAction(payload)), [dispatch]);

  return {
    email,
    accessToken,
    refreshToken,
    companyId,
    inviteData,
    tokenCheck,
    isAuthenticated,
    verify,
    resend,
    addorg,
    signin,
    loading,
    verifyloading,
    tokenLoading,
    error,
    loadingToastId,
    checktokenReset,
    isViewOnly,
    tokenError,
    checktoken,
    forgotPassword,
    checktokenResetPassword,
    logoutApi,
    setIsViewOnly,
  };
};
