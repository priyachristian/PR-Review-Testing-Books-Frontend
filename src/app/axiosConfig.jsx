import axios from 'axios';
import { setAccessDenied } from '@/features/common/commonSlice';
import {
  getModuleKeyForRoute,
  FEATURE_MODULE_MAP,
  FEATURE_BLOCK_LOADER_RESET_ACTIONS,
  RESET_FEATURE_BLOCKED_LOADERS,
  flattenPermissionModuleTree,
  getIsInPlanForRoutePath,
} from '@/utils/routePermissions';
import { isPdfPreviewRoute } from '@/utils/pdfPreviewRoute';

const baseURL = import.meta.env.VITE_API_URL || process.env.REACT_APP_API_URL;
const accountURL = import.meta.env.VITE_ACCOUNT_URL;

// eslint-disable-next-line no-unused-vars
let store = null;

// Refresh Token Flow Implementation
// This prevents multiple refresh token calls when several APIs fail simultaneously
// When a 401 occurs:
// 1. If already refreshing, queue the failed request
// 2. If not refreshing, start refresh process
// 3. After refresh succeeds, retry all queued requests with new token
// 4. If refresh fails, logout user and clear all queued requests
let isRefreshing = false;
let failedQueue = [];
let requestGeneration = 0;

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

export const setAxiosStore = reduxStore => {
  store = reduxStore;
};

const axiosConfig = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

const NO_REFRESH_URLS = ['auth/validate-token', 'auth/logout', 'auth/refresh-tokens'];

const ROUTES = [];

axiosConfig.interceptors.request.use(config => {
  // Public PDF preview must not attach auth/company context or trip feature gates.
  if (isPdfPreviewRoute()) {
    return config;
  }

  if (!store) return config;

  const state = store.getState();
  const permissionModules = state.module?.permissionModules;
  const flatNodes = flattenPermissionModuleTree(permissionModules);
  const companyId = state.auth?.companyId;

  if (companyId) {
    if (config.params instanceof URLSearchParams) {
      config.params.append('companyId', companyId);
    } else {
      config.params = {
        ...config.params,
        companyId,
      };
    }
  }

  if (flatNodes.length) {
    const routeModuleKey = getModuleKeyForRoute(window.location.pathname);
    const featureKey = FEATURE_MODULE_MAP[routeModuleKey];
    const inPlan = getIsInPlanForRoutePath(window.location.pathname, flatNodes);

    if (featureKey && inPlan === false) {
      const targetSlices = FEATURE_BLOCK_LOADER_RESET_ACTIONS[routeModuleKey];
      if (Array.isArray(targetSlices) && targetSlices.length) {
        store.dispatch({
          type: RESET_FEATURE_BLOCKED_LOADERS,
          payload: targetSlices,
        });
      }

      return Promise.reject(
        Object.assign(new axios.CanceledError('Feature not available in current plan'), {
          isFeatureBlocked: true,
        })
      );
    }
  }

  return config;
});

axiosConfig.interceptors.response.use(
  function (response) {
    requestGeneration++;
    return response;
  },
  async function (error) {
    // Silently drop requests cancelled because the feature is not in the plan
    if (error?.isFeatureBlocked) {
      return Promise.reject(error);
    }

    const original = error.config;
    const originalRequest = error.config;

    // No response (network errors) or no config
    if (!error.response || !original) {
      return Promise.reject(error);
    }

    const url = original.url;

    if (NO_REFRESH_URLS.includes(url) && ROUTES.includes(window.location.pathname.replace('/', ''))) {
      return Promise.reject(error);
    }

    // Public PDF preview: never refresh tokens or navigate away.
    if (isPdfPreviewRoute()) {
      return Promise.reject(error);
    }

    if (error.response.status === 403) {
      const message = error.response?.data?.message || "You don't have permission to perform this action";
      if (store) {
        store.dispatch(setAccessDenied(message));
        if (error.response?.data?.data?.canLoggedIn === false) {
          window.location.href = accountURL;
        }
      }
      return Promise.reject(error);
    }

    // Handle unauthorized
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Refresh already in progress → queue request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => axiosConfig(originalRequest))
          .catch(e => Promise.reject(e));
      }

      isRefreshing = true;
      const generationAtStart = requestGeneration;

      try {
        // Call refresh endpoint (cookie-based)
        let BASE_URL = import.meta.env.VITE_ACCOUNT_API_URL;
        await callApiWithCustomBaseURL(BASE_URL, 'auth/refresh-tokens', {
          method: 'POST',
        });

        // Process queued requests
        processQueue(null);

        // Retry original request
        return axiosConfig(originalRequest);
      } catch (refreshError) {
        // Process queued requests with error
        processQueue(refreshError);
        if (requestGeneration === generationAtStart) {
          window.location.href = `${accountURL}/login`;
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Utility function to make API call with custom base URL
export const callApiWithCustomBaseURL = (customBaseURL, endpoint, options = {}) => {
  // Create full URL by combining custom base URL with endpoint
  const fullUrl = `${customBaseURL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

  // Use the existing axiosConfig instance with all interceptors but override the URL
  return axiosConfig({
    ...options,
    url: fullUrl,
    baseURL: '', // This ensures the full URL is used instead of appending to default baseURL
  });
};

// Account backend (org switch, modules) — same axios instance/cookies as Books API calls
const ACCOUNT_API_BASE = import.meta.env.VITE_ACCOUNT_API_URL;

export const accountApi = {
  get: (endpoint, options = {}) => callApiWithCustomBaseURL(ACCOUNT_API_BASE, endpoint, { method: 'GET', ...options }),
  post: (endpoint, data, options = {}) => callApiWithCustomBaseURL(ACCOUNT_API_BASE, endpoint, { method: 'POST', data, ...options }),
};

export default axiosConfig;
