import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { getFirebaseMessaging } from '@/utils/firebaseConfig';
import { getBrowserName, getFCMToken, getOrCreateDeviceId, isRegisteredInSession, markRegisteredInSession, requestNotificationPermission, saveRegisteredToken } from '@/utils/device';
import { deviceService } from './deviceService';

const PLATFORM = 'WEB';

// Outcome of a registration attempt. REGISTERED / ALREADY_REGISTERED guarantee a
// device row exists in the backend; the others mean it does not (and why).
export const DEVICE_REGISTRATION_STATUS = {
  REGISTERED: 'REGISTERED',
  ALREADY_REGISTERED: 'ALREADY_REGISTERED',
  UNSUPPORTED: 'UNSUPPORTED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  NO_TOKEN: 'NO_TOKEN',
};

const DEVICE_READY_STATUSES = [DEVICE_REGISTRATION_STATUS.REGISTERED, DEVICE_REGISTRATION_STATUS.ALREADY_REGISTERED];

export const isDeviceReady = status => DEVICE_READY_STATUSES.includes(status);

const registerDeviceToken = createAsyncThunk('device/registerDeviceToken', async (_, { rejectWithValue }) => {
  try {
    const messaging = await getFirebaseMessaging();
    if (!messaging) return { status: DEVICE_REGISTRATION_STATUS.UNSUPPORTED };

    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.warn('[Device] Notification permission not granted — skipping token registration.');
      return { status: DEVICE_REGISTRATION_STATUS.PERMISSION_DENIED };
    }

    const pushToken = await getFCMToken(messaging);
    if (!pushToken) return { status: DEVICE_REGISTRATION_STATUS.NO_TOKEN };

    // Session-skip is safe: the flag is only set after a successful store, so the row exists.
    if (isRegisteredInSession(pushToken)) return { status: DEVICE_REGISTRATION_STATUS.ALREADY_REGISTERED };

    const deviceId = getOrCreateDeviceId();

    const payload = {
      pushToken,
      platform: PLATFORM,
      deviceId,
      deviceName: getBrowserName(),
      os: navigator.userAgentData?.platform ?? navigator.platform ?? 'Web',
      osVersion: navigator.userAgent,
    };

    await deviceService.storeDeviceToken(payload);

    markRegisteredInSession(pushToken);
    saveRegisteredToken(pushToken);

    return { status: DEVICE_REGISTRATION_STATUS.REGISTERED };
  } catch (error) {
    console.warn('[Device] Token registration failed:', error);
    return rejectWithValue(error?.message || 'Device token registration failed');
  }
});

const deviceSlice = createSlice({
  name: 'device',
  initialState: {
    loading: false,
    error: null,
    isRegistered: false,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(registerDeviceToken.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerDeviceToken.fulfilled, (state, action) => {
        state.loading = false;
        state.isRegistered = isDeviceReady(action.payload?.status);
      })
      .addCase(registerDeviceToken.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export const deviceSliceMethods = {
  registerDeviceToken,
};

export default deviceSlice.reducer;
