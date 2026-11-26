import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { notificationService } from './notification.service';
import { checkBrowserPermissionStatus, requestBrowserPermission, PERMISSION_STATUS } from '@/utils/notificationPermission';
import { getOrCreateDeviceId } from '@/utils/device';
import { deviceSliceMethods, isDeviceReady, DEVICE_REGISTRATION_STATUS } from '@/features/device/device.slice';

const DEVICE_REGISTRATION_ERROR = {
  [DEVICE_REGISTRATION_STATUS.UNSUPPORTED]: 'Push notifications are not supported in this browser.',
  [DEVICE_REGISTRATION_STATUS.PERMISSION_DENIED]: 'Notification permission was not granted. Please allow notifications and try again.',
  [DEVICE_REGISTRATION_STATUS.NO_TOKEN]: 'Could not register this device for push notifications. Please try again.',
};

const getNotificationCount = createAsyncThunk('notifications/getNotificationCount', notificationService.getNotificationCount);

const getNotifications = createAsyncThunk('notifications/getNotifications', notificationService.getNotifications);

// deviceId is injected centrally so every dispatch site targets the correct device
// (notification preference is device-scoped on the backend).
const getNotificationPreference = createAsyncThunk('notifications/getNotificationPreference', () => notificationService.getNotificationPreference({ deviceId: getOrCreateDeviceId() }));

const updateNotificationPreference = createAsyncThunk('notifications/updateNotificationPreference', ({ isNotificationEnabled }) =>
  notificationService.updateNotificationPreference({ isNotificationEnabled, deviceId: getOrCreateDeviceId() })
);

// The preference lives on the Device row, so a PATCH only makes sense once a device
// is registered. With no device there is no push target to disable — skip the call
// instead of firing a guaranteed 404.
const syncPreferenceIfRegistered = async ({ dispatch, getState, isNotificationEnabled }) => {
  if (!getState().device.isRegistered) return;
  await dispatch(updateNotificationPreference({ isNotificationEnabled })).unwrap();
};

const initNotificationSync = createAsyncThunk('notifications/initNotificationSync', async (_, { dispatch, getState, rejectWithValue }) => {
  try {
    // A 404 here means no device row yet — register this device (push token + deviceId)
    // so the backend has something to sync against. Nothing else to do on 404.
    const result = await dispatch(getNotificationPreference());
    if (getNotificationPreference.rejected.match(result)) {
      await dispatch(deviceSliceMethods.registerDeviceToken());
    }

    const systemStatus = checkBrowserPermissionStatus();

    if (systemStatus === PERMISSION_STATUS.NOT_ASKED) {
      const newStatus = await requestBrowserPermission();
      if (newStatus === PERMISSION_STATUS.BLOCKED) {
        await syncPreferenceIfRegistered({ dispatch, getState, isNotificationEnabled: false });
      }
      return { systemPermissionStatus: newStatus };
    }

    return { systemPermissionStatus: systemStatus };
  } catch (error) {
    return rejectWithValue(error?.message || 'Failed to initialise notification sync');
  }
});

const enableNotificationsWithPermission = createAsyncThunk('notifications/enableNotificationsWithPermission', async (_, { dispatch, getState, rejectWithValue }) => {
  try {
    const newStatus = checkBrowserPermissionStatus();

    if (newStatus === PERMISSION_STATUS.GRANTED) {
      // Ensure this device (and its push token) is registered before enabling —
      // the preference is device-scoped, so the device row must exist for the PATCH to land.
      const { status } = await dispatch(deviceSliceMethods.registerDeviceToken()).unwrap();
      if (!isDeviceReady(status)) {
        return rejectWithValue(DEVICE_REGISTRATION_ERROR[status] || 'Could not register this device for notifications.');
      }
      await dispatch(updateNotificationPreference({ isNotificationEnabled: true })).unwrap();
      return { systemPermissionStatus: PERMISSION_STATUS.GRANTED, enabled: true };
    }

    await syncPreferenceIfRegistered({ dispatch, getState, isNotificationEnabled: false });
    return { systemPermissionStatus: newStatus, enabled: false };
  } catch (error) {
    return rejectWithValue(error?.message || 'Failed to enable notifications');
  }
});

const refreshSystemPermissionStatus = createAsyncThunk('notifications/refreshSystemPermissionStatus', async (_, { dispatch, getState, rejectWithValue }) => {
  try {
    const systemPermissionStatus = checkBrowserPermissionStatus();
    const { isNotificationEnabled } = getState().notifications;
    if (systemPermissionStatus === PERMISSION_STATUS.BLOCKED && isNotificationEnabled) {
      await syncPreferenceIfRegistered({ dispatch, getState, isNotificationEnabled: false });
    }
    return { systemPermissionStatus };
  } catch (error) {
    return rejectWithValue(error?.message || 'Failed to refresh permission status');
  }
});

const markAllAsRead = createAsyncThunk('notifications/markAllAsRead', notificationService.markAllAsRead);

const INITIAL_PAGINATION = { page: 1, limit: 10, totalResults: 0, totalPages: 0 };

export const notificationSlice = createSlice({
  name: 'notifications',
  initialState: {
    notifications: [],
    unreadCount: 0,
    loading: false,
    scrollLoading: false,
    countLoading: false,
    pagination: { ...INITIAL_PAGINATION },
    error: null,

    isNotificationEnabled: true,
    preferenceLoading: false,

    systemPermissionStatus: PERMISSION_STATUS.GRANTED,

    permissionSyncing: false,
  },
  reducers: {
    resetNotifications: state => {
      state.notifications = [];
      state.pagination = { ...INITIAL_PAGINATION };
    },
    clearUnreadCount: state => {
      state.unreadCount = 0;
    },
    pushNotification: (state, action) => {
      const incoming = action.payload;
      if (state.notifications.some(n => n.id === incoming.id)) return;
      state.notifications = [incoming, ...state.notifications];
      state.unreadCount += 1;
      state.pagination.totalResults += 1;
      if (state.pagination.limit > 0) {
        state.pagination.totalPages = Math.ceil(state.pagination.totalResults / state.pagination.limit);
      }
    },
  },
  extraReducers: builder => {
    builder
      .addCase(getNotificationCount.pending, state => {
        state.countLoading = true;
      })
      .addCase(getNotificationCount.fulfilled, (state, action) => {
        state.countLoading = false;
        state.unreadCount = action.payload?.data?.count ?? 0;
      })
      .addCase(getNotificationCount.rejected, state => {
        state.countLoading = false;
      })

      .addCase(getNotifications.pending, (state, action) => {
        const isFirstPage = (action.meta.arg?.page ?? 1) === 1;
        if (isFirstPage) {
          state.loading = true;
        } else {
          state.scrollLoading = true;
        }
      })
      .addCase(getNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.scrollLoading = false;
        const data = action.payload?.data ?? [];
        const pagination = action.payload?.extras?.pagination;
        const isFirstPage = (action.meta.arg?.page ?? 1) === 1;
        state.notifications = isFirstPage ? data : [...state.notifications, ...data];
        if (pagination) state.pagination = pagination;
        if (isFirstPage) state.unreadCount = 0;
      })
      .addCase(getNotifications.rejected, (state, action) => {
        state.loading = false;
        state.scrollLoading = false;
        state.error = action.error?.message ?? 'Failed to fetch notifications';
      })

      // ── DB preference ───────────────────────────────────────────────
      .addCase(getNotificationPreference.pending, state => {
        state.preferenceLoading = true;
      })
      .addCase(getNotificationPreference.fulfilled, (state, action) => {
        state.preferenceLoading = false;
        state.isNotificationEnabled = action.payload?.data?.isNotificationEnabled ?? true;
      })
      .addCase(getNotificationPreference.rejected, state => {
        state.preferenceLoading = false;
      })
      .addCase(updateNotificationPreference.pending, state => {
        state.preferenceLoading = true;
      })
      .addCase(updateNotificationPreference.fulfilled, (state, action) => {
        state.preferenceLoading = false;
        state.isNotificationEnabled = action.payload?.data?.isNotificationEnabled ?? true;
      })
      .addCase(updateNotificationPreference.rejected, state => {
        state.preferenceLoading = false;
      })

      .addCase(initNotificationSync.pending, state => {
        state.permissionSyncing = true;
      })
      .addCase(initNotificationSync.fulfilled, (state, action) => {
        state.permissionSyncing = false;
        state.systemPermissionStatus = action.payload.systemPermissionStatus;
      })
      .addCase(initNotificationSync.rejected, state => {
        state.permissionSyncing = false;
      })

      .addCase(enableNotificationsWithPermission.pending, state => {
        state.permissionSyncing = true;
      })
      .addCase(enableNotificationsWithPermission.fulfilled, (state, action) => {
        state.permissionSyncing = false;
        state.systemPermissionStatus = action.payload.systemPermissionStatus;
      })
      .addCase(enableNotificationsWithPermission.rejected, state => {
        state.permissionSyncing = false;
      })

      .addCase(refreshSystemPermissionStatus.fulfilled, (state, action) => {
        state.systemPermissionStatus = action.payload.systemPermissionStatus;
      })
      .addCase(markAllAsRead.fulfilled, state => {
        state.unreadCount = 0;
      })
      .addCase(markAllAsRead.rejected, (state, action) => {
        state.error = action.error?.message ?? 'Failed to mark notifications as read';
      });
  },
});

export const { resetNotifications, clearUnreadCount, pushNotification } = notificationSlice.actions;
export default notificationSlice.reducer;

export const notificationSliceMethods = {
  getNotificationCount,
  getNotifications,
  getNotificationPreference,
  updateNotificationPreference,
  initNotificationSync,
  enableNotificationsWithPermission,
  refreshSystemPermissionStatus,
  markAllAsRead,
};
