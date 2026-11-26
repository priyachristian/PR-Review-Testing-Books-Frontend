import { useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { pushNotification, notificationSliceMethods } from '@/features/notifications/notification.slice';
import { CUSTOMER_SOCKET } from 'utils/constants';

export const useCustomerSocket = () => {
  const dispatch = useDispatch();
  const userId = useSelector(state => state.auth?.signin?.user?._id);
  const companyId = useSelector(state => state.auth?.companyId);
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);
  const attemptsRef = useRef(0);
  const mountedRef = useRef(true);
  const hasConnectedRef = useRef(false);

  useEffect(() => {
    if (!userId) return;

    mountedRef.current = true;

    const connect = () => {
      if (!mountedRef.current) return;

      const socket = new WebSocket(`${import.meta.env.VITE_CUSTOMER_SOCKET_URL}?type=user&id=${userId}`);
      wsRef.current = socket;

      socket.onopen = () => {
        if (hasConnectedRef.current && companyId) {
          dispatch(notificationSliceMethods.getNotificationCount({ companyId }));
        }
        hasConnectedRef.current = true;
        attemptsRef.current = 0;
      };

      socket.onmessage = event => {
        try {
          const payload = JSON.parse(event.data);
          if (payload?.type === `NOTIFICATION_NEW-${userId}` && payload?.notification) {
            dispatch(pushNotification(payload.notification));
          }
        } catch {
          if (event.data === 'reload') window.location.reload();
        }
      };

      socket.onerror = () => {
        // onclose fires right after — reconnect logic lives there
      };

      socket.onclose = () => {
        clearTimeout(reconnectRef.current);
        if (!mountedRef.current) return;

        const attempt = attemptsRef.current;
        if (attempt >= CUSTOMER_SOCKET.RECONNECT_MAX_ATTEMPTS) return;

        const delay = Math.min(CUSTOMER_SOCKET.RECONNECT_BASE_MS * 2 ** attempt, CUSTOMER_SOCKET.RECONNECT_MAX_MS);
        attemptsRef.current += 1;
        reconnectRef.current = setTimeout(connect, delay);
      };
    };

    connect();

    return () => {
      mountedRef.current = false;
      clearTimeout(reconnectRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [userId, dispatch]);

  return { wsRef };
};
