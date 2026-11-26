const NAV_STATE_PARAM = 'navState';

const isInternalAppPath = path => typeof path === 'string' && path.startsWith('/') && !path.startsWith('//');

export const buildNavigationState = location => ({
  prevFrom: location.pathname,
  historyStack: [...(Array.isArray(location.state?.historyStack) ? location.state.historyStack.filter(isInternalAppPath) : []), location.pathname],
});

export const appendNavigationState = (path, navigationState) => {
  const hashIndex = path.indexOf('#');
  const hash = hashIndex >= 0 ? path.slice(hashIndex) : '';
  const pathWithoutHash = hashIndex >= 0 ? path.slice(0, hashIndex) : path;
  const queryIndex = pathWithoutHash.indexOf('?');
  const pathname = queryIndex >= 0 ? pathWithoutHash.slice(0, queryIndex) : pathWithoutHash;
  const search = queryIndex >= 0 ? pathWithoutHash.slice(queryIndex + 1) : '';
  const params = new URLSearchParams(search);
  params.set(NAV_STATE_PARAM, JSON.stringify(navigationState));
  const nextSearch = params.toString();
  return `${pathname}${nextSearch ? `?${nextSearch}` : ''}${hash}`;
};

export const readNavigationState = search => {
  const params = new URLSearchParams(search);
  const raw = params.get(NAV_STATE_PARAM);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    const historyStack = Array.isArray(parsed?.historyStack) ? parsed.historyStack.filter(isInternalAppPath) : [];
    const prevFrom = isInternalAppPath(parsed?.prevFrom) ? parsed.prevFrom : undefined;
    return { historyStack, ...(prevFrom ? { prevFrom } : {}) };
  } catch {
    return { historyStack: [] };
  }
};

export const stripNavigationStateParam = location => {
  const params = new URLSearchParams(location.search);
  params.delete(NAV_STATE_PARAM);
  const search = params.toString();
  return `${location.pathname}${search ? `?${search}` : ''}${location.hash}`;
};
