import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { roleService } from './role.service';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getRoles = createAsyncThunk('roles/getRoles', async (arg = {}) => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE } = arg;
  return roleService.getRoles({ page, limit });
});

const createRole = createAsyncThunk('roles/createRole', roleService.createRole);

const updateRole = createAsyncThunk('roles/updateRole', roleService.updateRole);

const deleteRole = createAsyncThunk('roles/deleteRole', async id => {
  return roleService.deleteRole({ id });
});

const getRoleById = createAsyncThunk('roles/getRoleById', async id => {
  return roleService.getRoleById({ id });
});

const getRolesDropdown = createAsyncThunk('roles/getRolesDropdown', roleService.getRolesDropdown);

export const roleSlice = createSlice({
  name: 'roles',
  initialState: {
    roles: [],
    role: null,
    pagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
    },
    loading: false,
    error: null,
    rolesDropdown: [],
  },
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    resetRole: state => {
      state.role = null;
    },
    resetRoles: state => {
      state.roles = [];
    },
    resetRolesDropdown: state => {
      state.rolesDropdown = [];
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getRoles.pending, state => {
        state.loading = true;
      })
      .addCase(getRoles.fulfilled, (state, action) => {
        state.loading = false;
        state.roles = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalResults: action.payload.extras.totalResults,
        };
      })
      .addCase(getRoles.rejected, (state, action) => {
        state.loading = false;
        state.roles = [];
        state.error = action.error.message;
      })
      .addCase(createRole.pending, state => {
        state.loading = true;
      })
      .addCase(createRole.fulfilled, state => {
        state.loading = false;
        Toast.success('Role added successfully');
      })
      .addCase(createRole.rejected, (state, action) => {
        state.loading = false;
        Toast.error(action.error?.message || 'Failed to create role');
      })
      .addCase(updateRole.pending, state => {
        state.loading = true;
      })
      .addCase(updateRole.fulfilled, state => {
        state.loading = false;
        Toast.success('Role updated successfully');
      })
      .addCase(updateRole.rejected, (state, action) => {
        state.loading = false;
        Toast.error(action.error?.message || 'Failed to update role');
      })
      .addCase(deleteRole.fulfilled, (state, action) => {
        state.roles = state.roles.filter(role => role.id !== action.payload);
        console.log('Deleted role ID:', action.payload);
        Toast.success(action.payload?.message);
      })
      .addCase(deleteRole.rejected, (state, action) => {
        Toast.error(action.error?.message || 'Failed to delete role');
      })
      .addCase(getRoleById.pending, state => {
        state.loading = true;
      })
      .addCase(getRoleById.fulfilled, (state, action) => {
        state.loading = false;
        state.role = action.payload.data;
      })
      .addCase(getRoleById.rejected, (state, action) => {
        state.loading = false;
        state.role = null;
        state.error = action.error.message;
      })
      .addCase(getRolesDropdown.pending, state => {
        state.loading = true;
      })
      .addCase(getRolesDropdown.fulfilled, (state, action) => {
        state.loading = false;
        state.rolesDropdown = action.payload.data;
      })
      .addCase(getRolesDropdown.rejected, (state, action) => {
        state.loading = false;
        state.rolesDropdown = [];
        Toast.error(action.error.message);
      });
  },
});
export const roleSliceMethods = {
  getRoles,
  createRole,
  updateRole,
  deleteRole,
  getRoleById,
  getRolesDropdown,
};
export const { setLoading, resetRole, resetRoles, resetRolesDropdown } = roleSlice.actions;

export default roleSlice.reducer;
