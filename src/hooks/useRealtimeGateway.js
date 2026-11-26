import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout, updateMaintenanceMode } from '@/features/auth/authSlice';
import { pushNotification } from '@/features/notifications/notification.slice';
import { persistor } from '@/app/store';
import { useAuth } from '@/hooks/useAuth';
import { connectRealtimeSocket, disconnectRealtimeSocket } from '@/hooks/realtimeSocket';

const STOCK_ALERT_CONTENT = {
  STOCK_MIN_LIMIT_REACHED: { title: 'Stock Below Minimum', body: (itemName, itemNo) => `${itemName} (${itemNo}) stock has fallen below the minimum level.` },
  STOCK_MAX_LIMIT_REACHED: { title: 'Stock Above Maximum', body: (itemName, itemNo) => `${itemName} (${itemNo}) stock has exceeded the maximum level.` },
};

const useRealtimeGateway = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(state => state.auth?.isAuthenticated);
  const { checktoken } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return undefined;

    const socket = connectRealtimeSocket();
    if (!socket) return undefined;

    const handleAuthLogout = () => {
      dispatch(logout());
      persistor.purge();
      const accountUrl = import.meta.env.VITE_ACCOUNT_URL;
      window.location.href = accountUrl ? `${accountUrl}/login` : '/login';
    };

    const handleMaintenanceModeActivation = ({ isMaintenanceModeActive, maintenanceModeMessage, activateAt }) => {
      dispatch(updateMaintenanceMode({ isMaintenanceModeActive, maintenanceModeMessage, activateAt }));
      checktoken({ silent: true });
    };

    const handleStockLimitReached =
      eventName =>
      ({ eventId, itemId, itemName, itemNo, limitType, currentStock, limitValue }) => {
        const content = STOCK_ALERT_CONTENT[eventName];
        dispatch(
          pushNotification({
            id: eventId || `${eventName}-${itemId}-${Date.now()}`,
            title: content.title,
            body: content.body(itemName, itemNo),
            createdAt: new Date().toISOString(),
            isRead: false,
            data: { itemId, limitType, currentStock, limitValue },
          })
        );
      };
    const handleStockMinLimitReached = handleStockLimitReached('STOCK_MIN_LIMIT_REACHED');
    const handleStockMaxLimitReached = handleStockLimitReached('STOCK_MAX_LIMIT_REACHED');

    socket.on('AUTH_LOGOUT', handleAuthLogout);
    socket.on('MAINTENANCE_MODE_ACTIVATION', handleMaintenanceModeActivation);
    socket.on('STOCK_MIN_LIMIT_REACHED', handleStockMinLimitReached);
    socket.on('STOCK_MAX_LIMIT_REACHED', handleStockMaxLimitReached);

    return () => {
      socket.off('AUTH_LOGOUT', handleAuthLogout);
      socket.off('MAINTENANCE_MODE_ACTIVATION', handleMaintenanceModeActivation);
      socket.off('STOCK_MIN_LIMIT_REACHED', handleStockMinLimitReached);
      socket.off('STOCK_MAX_LIMIT_REACHED', handleStockMaxLimitReached);
      disconnectRealtimeSocket();
    };
  }, [dispatch, isAuthenticated, checktoken]);
};

export default useRealtimeGateway;
