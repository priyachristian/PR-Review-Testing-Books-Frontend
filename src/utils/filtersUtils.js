import { Button, Tag, Tooltip } from 'antd';
import { useEffect, useState } from 'react';
import { dateFormateForBackend, filteredURLParams, getPresetDateRange, getQueryParams } from './services';
import { clearAllFiltersFromLocalStorage, getAllFiltersFromLocalStorage, getLockedFiltersState, saveAllFiltersToLocalStorage, saveLockedFiltersState } from './filters';
import { colorPalette } from './theme';

export const rangePresets = ['last7Days', 'last15Days', 'lastMonth', 'last3Months', 'financialYear', 'custom'];
export const specificPresets = ['specific', 'today'];

const defaultFilterConfig = ({ STATUS_ENUM, divDrop, branchDrop }) => ({
  status: {
    label: 'Status',
    format: value =>
      value
        .split(',')
        .map(item => STATUS_ENUM?.[item])
        .join(', '),
    clear: (setFilter, updateUrlParams) => {
      setFilter(prev => ({ ...prev, status: null }));
      updateUrlParams({ status: null });
    },
  },
  search: {
    label: 'Search',
    format: (_, searchParams) => searchParams?.get('search'),
    clear: (_, __, handleClear) => handleClear(),
  },
  division: {
    label: 'Division',
    format: value =>
      value
        .split(',')
        .map(id => divDrop?.find(item => item?.id === id)?.name)
        .filter(Boolean)
        .join(', '),
    clear: (setFilter, updateUrlParams) => {
      setFilter(prev => ({ ...prev, division: null, branch: null, warehouse: null }));
      updateUrlParams({ division: null, branch: null, warehouse: null });
    },
  },
  branch: {
    label: 'Branch',
    format: value =>
      value
        .split(',')
        .map(id => branchDrop?.find(item => item?.id === id)?.name)
        .filter(Boolean)
        .join(', '),
    clear: (setFilter, updateUrlParams) => {
      setFilter(prev => ({ ...prev, branch: null, warehouse: null }));
      updateUrlParams({ branch: null, warehouse: null });
    },
  },
});

const getDateLabel = (searchParams, dateKeys) => {
  const { startDateKey, endDateKey, singleDateKey } = dateKeys || {};
  if (singleDateKey && searchParams?.get(singleDateKey)) {
    return searchParams.get(singleDateKey);
  }
  const start = startDateKey ? searchParams?.get(startDateKey) : null;
  const end = endDateKey ? searchParams?.get(endDateKey) : null;
  if (!start || !end) return null;
  const fyStartYear = start.slice(0, 4);
  if (searchParams?.get('preset') === 'financialYear' && /^\d{4}$/.test(fyStartYear)) {
    return `FY ${fyStartYear}-${String(Number(fyStartYear) + 1).slice(-2)}`;
  }
  return `${start} to ${end}`;
};

export const CommonFilterTags = ({
  searchParams,
  setFilter,
  updateUrlParams,
  handleClear,
  handleResetFilters,
  dateKeys, // e.g. { startDateKey: "startDate", endDateKey: "endDate", singleDateKey: "quoteDate" }
  onDateClear,
  extraFilters = {}, // e.g. { priority: { label: "Priority", format: (value) => SALES_ORDER_TRACKER_PRIORITY?.[value], clear: (setFilter, updateUrlParams) => { setFilter((prev) => ({ ...prev, priority: null })); updateUrlParams({ priority: null }); } } }
  STATUS_ENUM,
  divDrop,
  branchDrop,
  filterClassName,
}) => {
  const filterConfig = {
    ...defaultFilterConfig({ STATUS_ENUM, divDrop, branchDrop }),
    ...extraFilters,
  };

  const activeFilters = Object.entries(filterConfig)
    .map(([key, cfg]) => {
      const value = searchParams.get(key);
      if (!value) return null;
      const formattedValue = cfg.format?.(value, searchParams);
      return formattedValue ? { key, value, formattedValue, ...cfg } : null;
    })
    .filter(Boolean);

  const hasDate = (dateKeys?.startDateKey && searchParams?.get(dateKeys.startDateKey)) || (dateKeys?.singleDateKey && searchParams?.get(dateKeys.singleDateKey));

  if (activeFilters.length === 0 && !hasDate) return null;

  return (
    <div className={`p-2 bg-white ${filterClassName}`}>
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-gray-600 font-medium">Active Filters:</span>

        {activeFilters.map(({ key, formattedValue, label, clear }) => (
          <Tag key={key} closable onClose={() => clear(setFilter, updateUrlParams, handleClear)} className="px-3 py-1 bg-white">
            <span className="font-medium capitalize">{label}:</span>{' '}
            <Tooltip title={formattedValue}>
              <span className="inline-block max-w-[200px] truncate align-bottom">{formattedValue}</span>
            </Tooltip>
          </Tag>
        ))}

        {hasDate && (
          <Tag closable onClose={onDateClear} className="px-3 py-1 bg-white">
            <span className="font-medium capitalize">Date:</span>{' '}
            <Tooltip title={getDateLabel(searchParams, dateKeys)}>
              <span className="inline-block max-w-[150px] truncate align-bottom">{getDateLabel(searchParams, dateKeys)}</span>
            </Tooltip>
          </Tag>
        )}

        <Button style={{ color: colorPalette.primary[500] }} type="link" size="small" onClick={handleResetFilters}>
          Clear All
        </Button>
      </div>
    </div>
  );
};

export const useFilters = ({
  searchParams,
  setSearchParams,
  pagination,
  FILTER_KEY,
  setShowFilter,
  defaultFilter = { search: '', status: '', division: '', branch: '' },
  dateKeys = { startDate: 'startDate', endDate: 'endDate', singleDate: 'quoteDate' },
  isSplitSessionActive = false,
  isSplitWise = false,
}) => {
  const [filter, setFilter] = useState(defaultFilter);
  const [isLocked, setIsLocked] = useState(getLockedFiltersState(FILTER_KEY));
  const [selectedPreset, setSelectedPreset] = useState(searchParams?.get('preset') || 'custom');

  const getcustomDates = () => {
    if (searchParams?.get(dateKeys.startDate) && searchParams?.get(dateKeys.endDate)) {
      return [searchParams?.get(dateKeys.startDate), searchParams?.get(dateKeys.endDate)];
    }
    if (searchParams?.get(dateKeys.singleDate)) {
      return [searchParams?.get(dateKeys.singleDate), searchParams?.get(dateKeys.singleDate)];
    }
    return null;
  };

  const [dateRange, setDateRange] = useState(selectedPreset === 'custom' || selectedPreset === 'specific' ? getcustomDates() : getPresetDateRange(selectedPreset));

  useEffect(() => {
    if (!isSplitWise || isSplitSessionActive) return;

    setFilter(prev => (prev?.isSplit ? { ...prev, isSplit: false } : prev));

    const savedFilters = getAllFiltersFromLocalStorage(FILTER_KEY);
    if (savedFilters?.isSplit) {
      saveAllFiltersToLocalStorage({ ...savedFilters, isSplit: false }, FILTER_KEY);
    }

    if (searchParams.get('isSplit')) {
      updateUrlParams({ isSplit: null, page: 1, limit: pagination?.limit });
    }
  }, [isSplitSessionActive, isSplitWise]);

  const handleLockToggle = () => {
    const nextLocked = !isLocked;
    setIsLocked(nextLocked);
    saveLockedFiltersState(nextLocked, FILTER_KEY);

    if (nextLocked) {
      const params = getQueryParams(window.location.href) || {};
      const onlyFilters = Object.fromEntries(Object.entries(params).filter(([key]) => !['companyId', 'page', 'limit', 'isSplit'].includes(key)));
      saveAllFiltersToLocalStorage(onlyFilters, FILTER_KEY);
    } else {
      clearAllFiltersFromLocalStorage(FILTER_KEY);
    }
  };

  const updateUrlParams = newParams => {
    const params = new URLSearchParams(searchParams);
    const effectivePreset = newParams?.preset ?? selectedPreset;

    if (specificPresets.includes(effectivePreset)) {
      params.delete(dateKeys.startDate);
      params.delete(dateKeys.endDate);
    } else {
      params.delete(dateKeys.singleDate);
    }

    if (!dateRange) {
      params.delete(dateKeys.startDate);
      params.delete(dateKeys.endDate);
      params.delete(dateKeys.singleDate);
    }

    const filterParams = filteredURLParams(params, newParams);
    setSearchParams(filterParams, { replace: true });
  };

  const handleFilter = () => {
    const startDate = dateFormateForBackend(dateRange?.[0]);
    const endDate = dateFormateForBackend(dateRange?.[1]);

    let updatedFilters = {
      ...filter,
      page: 1,
      limit: pagination?.limit,
    };

    if (rangePresets.includes(selectedPreset) && dateRange) {
      updatedFilters = {
        ...updatedFilters,
        preset: selectedPreset,
        [dateKeys.startDate]: startDate,
        [dateKeys.endDate]: endDate,
      };
    } else if (specificPresets.includes(selectedPreset) && dateRange) {
      updatedFilters = {
        ...updatedFilters,
        preset: selectedPreset,
        [dateKeys.singleDate]: endDate,
      };
    }

    if (!isSplitSessionActive && isSplitWise) {
      updatedFilters.isSplit = false;
      setFilter(prev => ({ ...prev, isSplit: false }));
    }

    setShowFilter(false);
    updateUrlParams(updatedFilters);
  };

  const handleSearch = () => {
    updateUrlParams({ search: filter?.search || '', page: 1, limit: pagination?.limit });
  };
  const handleClear = () => {
    setFilter(prev => ({ ...prev, search: '' }));
    updateUrlParams({ search: '', page: 1, limit: pagination?.limit });
  };

  const handleResetFilters = () => {
    let newFilter = {};

    Object.keys(defaultFilter)?.forEach(key => {
      newFilter[key] = '';
    });
    setFilter(newFilter);
    setSelectedPreset('custom');
    setDateRange(null);

    updateUrlParams({
      ...newFilter,
      preset: '',
      [dateKeys.startDate]: '',
      [dateKeys.endDate]: '',
      [dateKeys.singleDate]: '',
      page: 1,
      limit: pagination?.limit,
    });
  };

  const areSavedFiltersApplied = saved => {
    if (!saved) return false;
    const keysToCompare = [...Object.keys(defaultFilter), 'preset', dateKeys.startDate, dateKeys.endDate, dateKeys.singleDate];
    return keysToCompare.every(key => {
      const savedVal = saved[key] ?? null;
      const currentVal = searchParams.get(key) ?? null;
      return String(savedVal) === String(currentVal);
    });
  };

  const getActiveFiltersCount = () => {
    // const defaultFilterCount = Object.entries(defaultFilter).filter(([key, defaultValue]) => {
    const defaultFilterCount = Object.entries(defaultFilter).filter(([key]) => {
      const currentValue = searchParams.get(key);
      // return currentValue && currentValue !== defaultValue && currentValue !== "";
      return currentValue && currentValue !== '';
    }).length;

    const hasDateFilter = (dateKeys?.startDate && searchParams?.get(dateKeys.startDate)) || (dateKeys?.singleDate && searchParams?.get(dateKeys.singleDate));

    return defaultFilterCount + (hasDateFilter ? 1 : 0);
  };

  return {
    filter,
    setFilter,
    isLocked,
    setIsLocked,
    selectedPreset,
    setSelectedPreset,
    dateRange,
    setDateRange,
    updateUrlParams,
    handleFilter,
    handleSearch,
    handleClear,
    handleResetFilters,
    areSavedFiltersApplied,
    getActiveFiltersCount,
    handleLockToggle,
  };
};

export const getCustomerFilterTag = (label, customerDropDownList = []) => ({
  customerId: {
    label: label,
    format: value => {
      if (!value) return null;
      const ids = value.split(',').filter(Boolean);
      const list = customerDropDownList ?? [];
      const names = ids.map(id => {
        const found = list.find(customer => customer?.id === id);
        return found ? found.customerDisplayName : null;
      });

      return names.filter(Boolean).join(', ');
    },
    clear: (setFilter, updateUrlParams) => {
      setFilter(prev => ({
        ...prev,
        customerId: '',
      }));

      updateUrlParams({
        customerId: null,
      });
    },
  },
});
