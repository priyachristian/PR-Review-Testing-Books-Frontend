import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import Toast from '@/components/ui/common/Toast';
import { userService } from './user.service';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const getUsers = createAsyncThunk('users/getUsers', async (arg = {}) => {
  const { page = 1, limit = DEFAULT_PAGE_SIZE } = arg;
  return userService.getUsers({ page, limit });
});

const getUserProfile = createAsyncThunk('users/getUserProfile', userService.getUserProfile);

const inviteUser = createAsyncThunk('users/inviteUser', userService.inviteUser);

const getUserRole = createAsyncThunk('users/getUserRole', userService.getUserRole);

const saveDefaultConfiguration = createAsyncThunk('users/saveDefaultConfiguration', userService.saveDefaultConfiguration);

const updateUserStatusAndRole = createAsyncThunk('users/updateUserStatusAndRole', userService.updateUserStatusAndRole);

const deleteCompanyUser = createAsyncThunk('users/deleteCompanyUser', userService.deleteCompanyUser);

const getUsersDropdown = createAsyncThunk('users/getUsersDropdown', userService.getUsersDropdown);

export const userSlice = createSlice({
  name: 'users',
  initialState: {
    users: [],
    userDetail: null,
    userDetailLoading: false,
    usersDropdown: [],
    usersDropdownLoading: false,
    defaultConfig: null,
    pagination: {
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      totalPages: 1,
      totalResults: 0,
    },
    loading: false,
    defaultConfigLoading: false,
    deleteLoading: false,
    accessRoles: null,
    error: null,
  },
  reducers: {
    resetUsers: state => {
      state.users = [];
    },
    resetUserDetail: state => {
      state.userDetail = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getUsers.pending, state => {
        state.loading = true;
      })
      .addCase(getUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload.data;
        state.pagination = {
          page: action.payload.extras.page,
          limit: action.payload.extras.limit,
          totalPages: action.payload.extras.totalPages,
          totalResults: action.payload.extras.totalResults,
        };
      })
      .addCase(getUsers.rejected, (state, action) => {
        state.users = [];
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(getUserProfile.pending, state => {
        state.userDetailLoading = true;
      })
      .addCase(getUserProfile.fulfilled, (state, action) => {
        state.userDetailLoading = false;
        state.userDetail = action.payload?.data || action.payload || null;
      })
      .addCase(getUserProfile.rejected, (state, action) => {
        state.userDetailLoading = false;
        state.userDetail = null;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
        }
      })
      .addCase(getUserRole.pending, state => {
        state.loading = true;
      })
      .addCase(getUserRole.fulfilled, (state, action) => {
        state.loading = false;
        state.accessRoles = action.payload?.data?.roleId;
      })
      .addCase(getUserRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(saveDefaultConfiguration.pending, state => {
        state.defaultConfigLoading = true;
      })
      .addCase(saveDefaultConfiguration.fulfilled, (state, action) => {
        state.defaultConfigLoading = false;
        state.defaultConfig = action?.payload?.data;
        state.message = action?.payload?.message;
        Toast.success(state.message);
      })
      .addCase(saveDefaultConfiguration.rejected, (state, action) => {
        state.defaultConfigLoading = false;
        state.defaultConfig = null;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(inviteUser.pending, state => {
        state.loading = true;
      })
      .addCase(inviteUser.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action?.payload?.message;
        Toast.success(state.message);
      })
      .addCase(inviteUser.rejected, (state, action) => {
        state.loading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(updateUserStatusAndRole.pending, state => {
        state.loading = true;
      })
      .addCase(updateUserStatusAndRole.fulfilled, (state, action) => {
        state.loading = false;
        state.message = action?.payload?.message;
        Toast.success(state.message);
      })
      .addCase(updateUserStatusAndRole.rejected, (state, action) => {
        state.loading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(deleteCompanyUser.pending, state => {
        state.deleteLoading = true;
      })
      .addCase(deleteCompanyUser.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.message = action?.payload?.message;
        Toast.success(state.message);
      })
      .addCase(deleteCompanyUser.rejected, (state, action) => {
        state.deleteLoading = false;
        if (action.error.name !== 'CanceledError' && action.error.code !== 'ERR_CANCELED' && action.error.message !== 'canceled') {
          state.error = action.error.message;
          Toast.error(state.error);
        }
      })
      .addCase(getUsersDropdown.pending, state => {
        state.usersDropdownLoading = true;
      })
      .addCase(getUsersDropdown.fulfilled, (state, action) => {
        state.usersDropdownLoading = false;
        state.usersDropdown = action.payload?.data || [];
      })
      .addCase(getUsersDropdown.rejected, state => {
        state.usersDropdownLoading = false;
      });
  },
});
export const { resetUsers, resetUserDetail } = userSlice.actions;
export const userSliceMethods = {
  getUsers,
  getUserProfile,
  inviteUser,
  getUserRole,
  saveDefaultConfiguration,
  updateUserStatusAndRole,
  deleteCompanyUser,
  getUsersDropdown,
};
export default userSlice.reducer;
