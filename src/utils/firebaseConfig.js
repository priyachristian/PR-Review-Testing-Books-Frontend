import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';

const REQUIRED_ENV_VARS = ['VITE_FIREBASE_API_KEY', 'VITE_FIREBASE_AUTH_DOMAIN', 'VITE_FIREBASE_PROJECT_ID', 'VITE_FIREBASE_MESSAGING_SENDER_ID', 'VITE_FIREBASE_APP_ID'];

const isFirebaseConfigured = () => REQUIRED_ENV_VARS.every(key => Boolean(import.meta.env[key]));

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let messagingInstance = null;

export const getFirebaseMessaging = async () => {
  if (messagingInstance) return messagingInstance;

  if (!isFirebaseConfigured()) {
    console.warn('[Firebase] Not configured — set VITE_FIREBASE_* env vars to enable push notifications.');
    return null;
  }

  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn('[Firebase] FCM is not supported in this browser.');
      return null;
    }

    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    messagingInstance = getMessaging(app);
    return messagingInstance;
  } catch (error) {
    console.warn('[Firebase] Initialisation failed:', error.message);
    return null;
  }
};
