import { getToken } from 'firebase/messaging';

const DEVICE_ID_KEY = 'abss_device_id';
const REGISTERED_TOKEN_KEY = 'abss_device_registered_token';
const SW_PATH = '/firebase-messaging-sw.js';

const _sessionRegistered = new Set();
export const isRegisteredInSession = token => _sessionRegistered.has(token);
export const markRegisteredInSession = token => _sessionRegistered.add(token);

export const getOrCreateDeviceId = () => {
  const existing = localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;

  const newId = crypto.randomUUID();
  localStorage.setItem(DEVICE_ID_KEY, newId);
  return newId;
};

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const result = await Notification.requestPermission();
  return result === 'granted';
};

export const getFCMToken = async messaging => {
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    console.warn('[FCM] VITE_FIREBASE_VAPID_KEY is not set — cannot generate push token.');
    return null;
  }

  try {
    let serviceWorkerRegistration = null;

    if ('serviceWorker' in navigator) {
      serviceWorkerRegistration = await navigator.serviceWorker.register(SW_PATH);
    }

    const token = await getToken(messaging, {
      vapidKey,
      ...(serviceWorkerRegistration && { serviceWorkerRegistration }),
    });

    return token || null;
  } catch (error) {
    console.warn('[FCM] Failed to get push token:', error.message);
    return null;
  }
};

export const getLastRegisteredToken = () => localStorage.getItem(REGISTERED_TOKEN_KEY) || null;

export const saveRegisteredToken = token => localStorage.setItem(REGISTERED_TOKEN_KEY, token);

export const clearRegisteredToken = () => localStorage.removeItem(REGISTERED_TOKEN_KEY);

export const getBrowserName = () => {
  const ua = navigator.userAgent;
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('OPR/') || ua.includes('Opera')) return 'Opera';
  if (ua.includes('Chrome/')) return 'Chrome';
  if (ua.includes('Firefox/')) return 'Firefox';
  if (ua.includes('Safari/')) return 'Safari';
  return 'Unknown';
};
