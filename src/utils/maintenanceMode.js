export const MAINTENANCE_MODE_SOCKET_EVENT = 'MAINTENANCE_MODE_ACTIVATION_BOOKS';

export const parseSocketPayload = rawData => {
  if (!rawData || rawData === 'reload') return null;
  try {
    return JSON.parse(rawData);
  } catch {
    return null;
  }
};

export const isMaintenanceSocketEvent = socketPayload => socketPayload?.type === MAINTENANCE_MODE_SOCKET_EVENT && Boolean(socketPayload?.payload);

export const getMaintenanceData = (tokenCheck, signin) => {
  const data = tokenCheck?.data ?? signin ?? {};

  return {
    isMaintenanceModeActive: Boolean(data.isMaintenanceModeActive),
    maintenanceModeMessage: data.maintenanceModeMessage,
    activateAt: data.activateAt,
  };
};

export const shouldShowMaintenancePage = (isMaintenanceModeActive, activateAt, now = Date.now()) => {
  if (!isMaintenanceModeActive) return false;
  if (!activateAt) return true;
  return new Date(activateAt).getTime() <= now;
};

export const isMaintenanceCountdownActive = (isMaintenanceModeActive, activateAt, now = Date.now()) => {
  if (!isMaintenanceModeActive) return false;
  if (!activateAt) return false;
  return new Date(activateAt).getTime() > now;
};

export const getMaintenanceTimeLeftMs = (activateAt, now = Date.now()) => {
  if (!activateAt) return 0;
  return Math.max(0, new Date(activateAt).getTime() - now);
};

export const formatMaintenanceActivateAt = activateAt => {
  if (!activateAt) return null;
  try {
    return new Date(activateAt).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return null;
  }
};

export const getMaintenanceTooltipContent = ({ formattedTime, activateAt }) => ({
  title: 'BOOKS will be temporarily unavailable.',
  timeRemaining: `Maintenance begins in ${formattedTime}`,
  scheduledAt: formatMaintenanceActivateAt(activateAt),
  message: 'Please save your work and wrap up any ongoing task before maintenance begins.',
});

export const formatMaintenanceCountdown = ms => {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = n => n.toString().padStart(2, '0');

  if (days > 0) {
    return `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
};
