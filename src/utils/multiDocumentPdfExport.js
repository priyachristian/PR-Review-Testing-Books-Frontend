import { getQueryParams } from '@/utils/services';

/** Build PDF/list export filters from the current URL query. */
export const buildListPdfExportFilters = (extraKeys = []) => {
  const params = getQueryParams(window.location.href) || {};
  const baseKeys = ['search', 'sortBy', 'startDate', 'endDate', 'status', 'division', 'branch', 'customerId', 'appName', 'addedBy'];
  const keys = [...new Set([...baseKeys, ...extraKeys])];
  const filters = {};
  keys.forEach(key => {
    if (params[key]) filters[key] = params[key];
  });
  return filters;
};
