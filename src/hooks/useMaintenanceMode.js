import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getMaintenanceData, getMaintenanceTimeLeftMs, isMaintenanceCountdownActive, shouldShowMaintenancePage } from '@/utils/maintenanceMode';

let tickListeners = new Set();
let tickIntervalId = null;
let sharedNow = Date.now();

const subscribeToMaintenanceTick = listener => {
  tickListeners.add(listener);

  if (!tickIntervalId) {
    tickIntervalId = setInterval(() => {
      sharedNow = Date.now();
      tickListeners.forEach(fn => fn(sharedNow));
    }, 1000);
  }

  return () => {
    tickListeners.delete(listener);
    if (tickListeners.size === 0 && tickIntervalId) {
      clearInterval(tickIntervalId);
      tickIntervalId = null;
    }
  };
};

export const useMaintenanceMode = () => {
  const { signin, tokenCheck, tokenLoading } = useAuth();
  const [now, setNow] = useState(sharedNow);

  const { isMaintenanceModeActive, maintenanceModeMessage, activateAt } = useMemo(() => getMaintenanceData(tokenCheck, signin), [tokenCheck, signin]);

  const needsTick = isMaintenanceCountdownActive(isMaintenanceModeActive, activateAt, now);

  useEffect(() => {
    if (!needsTick) return undefined;
    return subscribeToMaintenanceTick(setNow);
  }, [needsTick, activateAt]);

  const shouldShowPage = shouldShowMaintenancePage(isMaintenanceModeActive, activateAt, now);
  const isCountdownActive = isMaintenanceCountdownActive(isMaintenanceModeActive, activateAt, now);
  const timeLeftMs = getMaintenanceTimeLeftMs(activateAt, now);

  return {
    tokenLoading,
    isMaintenanceModeActive,
    maintenanceModeMessage,
    activateAt,
    shouldShowMaintenancePage: shouldShowPage,
    isCountdownActive,
    timeLeftMs,
  };
};
