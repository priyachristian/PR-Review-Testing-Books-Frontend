import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { roleSliceMethods, resetRole as resetRoleAction, resetRoles as resetRolesAction, resetRolesDropdown as resetRolesDropdownAction } from '@/features/setting/role/role.slice';

export const useRole = () => {
  const dispatch = useDispatch();

  const { roles, role, pagination, loading, error, rolesDropdown } = useSelector(state => state.role);

  const getRoles = useCallback(async payload => await dispatch(roleSliceMethods.getRoles(payload)), [dispatch]);

  const createRole = useCallback(async roleData => await dispatch(roleSliceMethods.createRole(roleData)), [dispatch]);

  const updateRole = useCallback(async payload => await dispatch(roleSliceMethods.updateRole(payload)), [dispatch]);

  const getRoleById = useCallback(async id => await dispatch(roleSliceMethods.getRoleById(id)), [dispatch]);

  const getRolesDropdown = useCallback(async payload => await dispatch(roleSliceMethods.getRolesDropdown(payload)), [dispatch]);

  const handleDeleteRole = useCallback(async id => await dispatch(roleSliceMethods.deleteRole(id)), [dispatch]);

  const resetRole = useCallback(() => dispatch(resetRoleAction()), [dispatch]);
  const resetRoles = useCallback(() => dispatch(resetRolesAction()), [dispatch]);
  const resetRolesDropdown = useCallback(() => dispatch(resetRolesDropdownAction()), [dispatch]);

  return {
    roles,
    role,
    pagination,
    loading,
    error,
    rolesDropdown,
    getRoles,
    createRole,
    updateRole,
    getRoleById,
    resetRole,
    resetRoles,
    getRolesDropdown,
    resetRolesDropdown,
    handleDeleteRole,
  };
};
