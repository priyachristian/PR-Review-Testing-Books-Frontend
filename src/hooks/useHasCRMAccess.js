import { useCallback, useEffect, useMemo } from 'react';
import { APP_NAME_OPTIONS } from '@/utils/dropdownEnums';

export const CREATED_FROM_COLUMN_KEY = 'appName';

export const filterColumnsByCRMAccess = (columns, hasCRMAccess) => (hasCRMAccess ? columns : columns?.filter(col => col?.key !== CREATED_FROM_COLUMN_KEY));

export const getCreatedFromExtraFilters = () => ({
  appName: {
    label: 'Created From',
    format: value => APP_NAME_OPTIONS.find(opt => opt.value === value)?.label || value,
    clear: (setFilter, updateUrlParams) => {
      setFilter(prev => ({ ...prev, appName: '' }));
      updateUrlParams({ appName: null });
    },
  },
});

/**
 * @param {object} options
 * @param {{ hasCRMAccess?: boolean }} options.pagination - List pagination from Redux (extras.hasCRMAccess)
 * @param {object} options.filter - Current filter state from useFilters
 * @param {function} options.setFilter - useFilters setFilter
 * @param {function} options.updateUrlParams - useFilters updateUrlParams
 * @param {URLSearchParams} options.searchParams
 * @param {function} [options.setShowFilter] - Optional; closes filter panel when CRM access is removed
 */
export function useHasCRMAccess({ pagination, filter, setFilter, updateUrlParams, searchParams, setShowFilter }) {
  // Only true after API sets hasCRMAccess in extras; undefined until first list response
  const hasCRMAccess = pagination?.hasCRMAccess === true;
  const hasCRMAccessDenied = pagination?.hasCRMAccess === false;

  useEffect(() => {
    if (!hasCRMAccessDenied) return;

    const hasAppNameFilter = filter?.appName || searchParams?.get('appName');
    if (!hasAppNameFilter) return;

    setFilter(prev => ({ ...prev, appName: '' }));
    updateUrlParams({ appName: null });
    setShowFilter?.(false);
  }, [hasCRMAccessDenied, filter?.appName, searchParams, setFilter, updateUrlParams, setShowFilter]);

  const filterCreatedFromColumn = useCallback(columns => filterColumnsByCRMAccess(columns, hasCRMAccess), [hasCRMAccess]);

  const createdFromExtraFilters = useMemo(() => (hasCRMAccess ? getCreatedFromExtraFilters() : {}), [hasCRMAccess]);

  return {
    hasCRMAccess,
    filterCreatedFromColumn,
    createdFromExtraFilters,
  };
}
