import { io } from 'socket.io-client';

const getGatewayUrl = () => (import.meta.env.VITE_ACCOUNT_API_URL || '').replace(/\/api\/v1\/?$/, '');

let socket = null;
let refCount = 0;
const changeListeners = new Set();

const notifyChange = () => {
  changeListeners.forEach(listener => listener(socket));
};

export const connectRealtimeSocket = () => {
  refCount += 1;
  if (socket) return socket;

  const gatewayUrl = getGatewayUrl();
  if (!gatewayUrl) return null;

  socket = io(gatewayUrl, {
    withCredentials: true,
    transports: ['websocket', 'polling'],
    auth: { app: 'BOOKS' },
  });
  notifyChange();
  return socket;
};

export const disconnectRealtimeSocket = () => {
  refCount = Math.max(0, refCount - 1);
  if (refCount === 0 && socket) {
    socket.disconnect();
    socket = null;
    notifyChange();
  }
};

export const getRealtimeSocket = () => socket;

export const onRealtimeSocketChange = listener => {
  changeListeners.add(listener);
  return () => changeListeners.delete(listener);
};
