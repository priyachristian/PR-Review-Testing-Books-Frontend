import ReactGA from 'react-ga4';

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID;

let _initialized = false;
let _lastPath = null;

export const initGA4 = () => {
  if (_initialized || !GA_MEASUREMENT_ID) return;
  try {
    ReactGA.initialize(GA_MEASUREMENT_ID, { gaOptions: { send_page_view: false } });
    _initialized = true;
  } catch {
    _initialized = false;
  }
};

export const trackPageView = (path, title) => {
  if (!_initialized || path === _lastPath) return;
  try {
    ReactGA.send({ hitType: 'pageview', page: path, title });
    _lastPath = path;
  } catch {
    _lastPath = null;
  }
};

export const setGA4UserId = userId => {
  if (!_initialized) return;
  try {
    ReactGA.set({ userId: userId || null });
  } catch {
    _initialized = false;
  }
};
