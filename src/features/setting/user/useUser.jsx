import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { userSliceMethods, resetUsers as resetUsersAction, resetUserDetail as resetUserDetailAction } from '@/features/setting/user/user.slice';

export const useUser = () => {
  const dispatch = useDispatch();

  const { users, userDetail, userDetailLoading, usersDropdown, usersDropdownLoading, pagination, defaultConfig, loading, defaultConfigLoading, deleteLoading, accessRoles, error } = useSelector(
    state => state.user
  );

  const getUsers = useCallback(async payload => await dispatch(userSliceMethods.getUsers(payload)), [dispatch]);

  const getUserProfile = useCallback(async payload => await dispatch(userSliceMethods.getUserProfile(payload)), [dispatch]);

  const inviteUser = useCallback(async payload => await dispatch(userSliceMethods.inviteUser(payload)).unwrap(), [dispatch]);

  const getUserRole = useCallback(async payload => await dispatch(userSliceMethods.getUserRole(payload)), [dispatch]);

  const saveDefaultConfiguration = useCallback(async payload => await dispatch(userSliceMethods.saveDefaultConfiguration(payload)), [dispatch]);

  const updateUserStatusAndRole = useCallback(async payload => await dispatch(userSliceMethods.updateUserStatusAndRole(payload)).unwrap(), [dispatch]);

  const deleteCompanyUser = useCallback(async payload => await dispatch(userSliceMethods.deleteCompanyUser(payload)).unwrap(), [dispatch]);

  const resetUsers = useCallback(() => dispatch(resetUsersAction()), [dispatch]);

  const resetUserDetail = useCallback(() => dispatch(resetUserDetailAction()), [dispatch]);

  const getUsersDropdown = useCallback(async payload => await dispatch(userSliceMethods.getUsersDropdown(payload)), [dispatch]);

  return {
    users,
    userDetail,
    userDetailLoading,
    usersDropdown,
    usersDropdownLoading,
    pagination,
    defaultConfig,
    loading,
    defaultConfigLoading,
    deleteLoading,
    accessRoles,
    error,
    getUsers,
    getUserProfile,
    inviteUser,
    getUserRole,
    saveDefaultConfiguration,
    resetUsers,
    resetUserDetail,
    updateUserStatusAndRole,
    deleteCompanyUser,
    getUsersDropdown,
  };
};
