export const PERMISSION_STATUS = {
  GRANTED: 'granted',
  NOT_ASKED: 'not_asked',
  BLOCKED: 'blocked',
};

const normalise = browserStatus => {
  if (browserStatus === 'granted') return PERMISSION_STATUS.GRANTED;
  if (browserStatus === 'denied') return PERMISSION_STATUS.BLOCKED;
  return PERMISSION_STATUS.NOT_ASKED; // 'default'
};

export const checkBrowserPermissionStatus = () => {
  if (!('Notification' in window)) return PERMISSION_STATUS.BLOCKED;
  return normalise(Notification.permission);
};

export const requestBrowserPermission = async () => {
  if (!('Notification' in window)) return PERMISSION_STATUS.BLOCKED;
  try {
    const result = await Notification.requestPermission();
    return normalise(result);
  } catch {
    return PERMISSION_STATUS.BLOCKED;
  }
};

export const listenForPermissionChange = callback => {
  let permissionStatus = null;
  const onPermissionChange = () => callback();
  const onVisibilityChange = () => {
    if (!document.hidden) callback();
  };

  document.addEventListener('visibilitychange', onVisibilityChange);

  if ('permissions' in navigator) {
    navigator.permissions
      .query({ name: 'notifications' })
      .then(ps => {
        permissionStatus = ps;
        ps.addEventListener('change', onPermissionChange);
      })
      .catch(() => {});
  }

  return () => {
    document.removeEventListener('visibilitychange', onVisibilityChange);
    if (permissionStatus) {
      permissionStatus.removeEventListener('change', onPermissionChange);
    }
  };
};
