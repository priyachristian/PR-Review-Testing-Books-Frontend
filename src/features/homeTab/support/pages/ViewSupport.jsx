import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

// Components (Design System)
import { Badge, Tooltip } from '@/components/AntDComponent';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import FilterInput from '@/components/forms/formInput/FilterInput';
import CustomButton from '@/components/ui/button/CustomButton';
import PermissionButton from '@/components/ui/button/PermissionButton';

// Hooks & extras
import useModulePermissions from '@/hooks/useModulePermissions';
import { useFilters, CommonFilterTags } from '@/utils/filtersUtils';
import { useSupport, supportColumn } from '@/features/homeTab/support';
import Icons from '@/assets/icons/icon';
import { FILTERS_KEYS, RESOURCES } from '@/utils/jsonFile';
import { getAllFiltersFromLocalStorage } from '@/utils/filters';
import { colorPalette } from '@/utils/theme';
import { userService } from '@/features/setting/user/user.service';
import { getQueryParams } from 'utils/services';
import { SupportKpiCard, SupportLifecycleModal, SUPPORT_LIFECYCLE_STAGES } from '@/features/homeTab/support/support.ui';
import { filterInputEnum, SUPPORT_CATEGORY, SUPPORT_MODULE_NAME, SUPPORT_PRIORITY, SUPPORT_STATUS } from 'utils/constants';

const ViewSupport = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { useSupport: supportPermissions, isViewOnly } = useModulePermissions(RESOURCES.SUPPORT);
  const canCreate = supportPermissions?.create;
  const { supports, pagination, loading, getSupports, statusCounts } = useSupport();
  const [userDrop, setUserDrop] = useState([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const isApiCalledRef = useRef(false);
  const [showFilter, setShowFilter] = useState(false);
  const [lifecycleRecord, setLifecycleRecord] = useState(null);
  const FILTER_KEY = FILTERS_KEYS.SUPPORT_ALL_FILTER;

  const { filter, setFilter, isLocked, updateUrlParams, handleFilter, handleSearch, handleClear, handleResetFilters, areSavedFiltersApplied, getActiveFiltersCount, handleLockToggle } = useFilters({
    searchParams,
    setSearchParams,
    pagination,
    FILTER_KEY,
    setShowFilter,
    defaultFilter: {
      search: searchParams.get('search') || '',
      category: searchParams.get('category') ? searchParams.get('category').split(',') : [],
      status: searchParams.get('status') ? searchParams.get('status').split(',') : [],
      priority: searchParams.get('priority') ? searchParams.get('priority').split(',') : [],
      moduleName: searchParams.get('moduleName') ? searchParams.get('moduleName').split(',') : [],
      raisedBy: searchParams.get('raisedBy') ? searchParams.get('raisedBy').split(',') : [],
    },
    dateKeys: { startDateKey: 'startDate', endDateKey: 'endDate', singleDateKey: 'createdAt' },
  });

  useEffect(() => {
    const controller = new AbortController();
    const fetchUserDropdown = async () => {
      try {
        const data = await userService.getUsersDropdown({ signal: controller.signal });
        setUserDrop(data?.data ?? data ?? []);
      } catch {
        setUserDrop([]);
      }
    };
    fetchUserDropdown();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const savedFilters = getAllFiltersFromLocalStorage(FILTER_KEY);

    if (!isApiCalledRef.current && !searchParams.get('page') && !searchParams.get('limit')) {
      if (savedFilters && Object.keys(savedFilters).length > 0) {
        setFilter(prev => ({
          ...prev,
          search: savedFilters.search ?? prev.search,
          category: savedFilters.category ? savedFilters?.category?.split(',') : prev.category,
          status: savedFilters.status ? savedFilters?.status?.split(',') : prev.status,
          priority: savedFilters.priority ? savedFilters?.priority?.split(',') : prev.priority,
          moduleName: savedFilters.moduleName ? savedFilters?.moduleName?.split(',') : prev.moduleName,
          raisedBy: savedFilters.raisedBy ? savedFilters?.raisedBy?.split(',') : prev.raisedBy,
        }));

        if (!areSavedFiltersApplied(savedFilters)) {
          isApiCalledRef.current = true;
          updateUrlParams(savedFilters);
          return;
        }
      }
      isApiCalledRef.current = true;
    }

    const controller = new AbortController();
    fetchSupports(controller.signal);
    return () => controller.abort();
  }, [searchParams]);

  const fetchSupports = signal => {
    const page = parseInt(searchParams?.get('page')) || 1;
    const pageSize = parseInt(searchParams?.get('limit')) || pagination.limit;
    const sortBy = searchParams?.get('sortBy') || '';
    const payload = getQueryParams(window.location.href) || {};
    if (sortBy) payload.sortBy = sortBy;
    getSupports({ ...payload, page, limit: pageSize, signal });
  };

  const handlePaginationChange = (page, pageSize) => {
    updateUrlParams({ page, limit: pageSize });
  };

  const handleTableChange = (paginationArg, filters, sorter) => {
    let sortBy = '';
    if (Array.isArray(sorter)) {
      const firstSort = sorter[0];
      if (firstSort && firstSort.order) {
        sortBy = `${firstSort.field}:${firstSort.order === 'descend' ? 'desc' : 'asc'}`;
      }
    } else if (sorter?.order) {
      sortBy = `${sorter.field}:${sorter.order === 'descend' ? 'desc' : 'asc'}`;
    }
    if (sortBy) updateUrlParams({ sortBy, page: 1 });
  };

  const getRowId = record => String(record?.id || record?._id || '');

  const openTicket = useCallback(
    record => {
      const rowId = getRowId(record);
      navigate(`/support/${rowId}`, {
        state: {
          prevFrom: location.pathname,
          historyStack: [...(location.state?.historyStack || []), location.pathname],
        },
      });
    },
    [navigate, location]
  );

  const columns = useMemo(
    () => [
      ...supportColumn(),
      {
        title: 'Action',
        key: 'action',
        width: 88,
        align: 'center',
        render: (_, record) => (
          <div className="flex items-center justify-center gap-2.5">
            <Tooltip title="Lifecycle">
              <Icons.BranchesOutlined
                className="cursor-pointer"
                style={{ fontSize: 18, color: colorPalette.primary[500] }}
                onClick={e => {
                  e.stopPropagation();
                  setLifecycleRecord(record);
                }}
              />
            </Tooltip>
            <Tooltip title="Open ticket">
              <Icons.EyeOutlined
                className="cursor-pointer"
                style={{ fontSize: 18, color: colorPalette.primary[500] }}
                onClick={e => {
                  e.stopPropagation();
                  openTicket(record);
                }}
              />
            </Tooltip>
          </div>
        ),
      },
    ],
    [openTicket]
  );

  const supportExtraFilters = {
    category: {
      label: 'Category',
      format: value =>
        value
          .split(',')
          .map(item => SUPPORT_CATEGORY?.[item] || item)
          .join(', '),
      clear: (setFilterFn, updateUrl) => {
        setFilterFn(prev => ({ ...prev, category: [] }));
        updateUrl({ category: null });
      },
    },
    priority: {
      label: 'Priority',
      format: value =>
        value
          .split(',')
          .map(item => SUPPORT_PRIORITY?.[item] || item)
          .join(', '),
      clear: (setFilterFn, updateUrl) => {
        setFilterFn(prev => ({ ...prev, priority: [] }));
        updateUrl({ priority: null });
      },
    },
    moduleName: {
      label: 'Module',
      format: value =>
        value
          .split(',')
          .map(item => SUPPORT_MODULE_NAME?.[item] || item)
          .join(', '),
      clear: (setFilterFn, updateUrl) => {
        setFilterFn(prev => ({ ...prev, moduleName: [] }));
        updateUrl({ moduleName: null });
      },
    },
    raisedBy: {
      label: 'Raised By',
      format: value =>
        value
          .split(',')
          .map(id => {
            const u = (userDrop || []).find(x => (x?.id || x?._id) === id);
            return u?.name || u?.email || id;
          })
          .filter(Boolean)
          .join(', '),
      clear: (setFilterFn, updateUrl) => {
        setFilterFn(prev => ({ ...prev, raisedBy: [] }));
        updateUrl({ raisedBy: null });
      },
    },
  };

  const displayKpis = useMemo(
    () =>
      SUPPORT_LIFECYCLE_STAGES.map(stage => {
        const camelKey = stage.key.toLowerCase().replace(/_([a-z])/g, (_, l) => l.toUpperCase());
        return {
          key: stage.key,
          label: stage.title,
          count: statusCounts?.[camelKey] ?? statusCounts?.[stage.key] ?? 0,
        };
      }),
    [statusCounts]
  );

  const currentStatuses = useMemo(() => {
    if (Array.isArray(filter?.status)) return filter.status;
    if (typeof filter?.status === 'string' && filter.status) return filter.status.split(',').filter(Boolean);
    const fromUrl = searchParams.get('status');
    return fromUrl ? fromUrl.split(',').filter(Boolean) : [];
  }, [filter?.status, searchParams]);

  const handleKpiClick = useCallback(
    stageKey => {
      const isSelected = currentStatuses.length === 1 && currentStatuses[0] === stageKey;
      const nextStatuses = isSelected ? [] : [stageKey];
      setFilter(prev => ({ ...prev, status: nextStatuses }));
      updateUrlParams({ status: nextStatuses.length ? nextStatuses.join(',') : null, page: 1 });
    },
    [currentStatuses, setFilter, updateUrlParams]
  );

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden -m-4 bg-[#F6F7F9]">
      <div className="shrink-0 bg-white border-b border-gray-200 px-4 py-3 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h1 className="text-[18px] font-bold text-gray-900 m-0">Support Tickets</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 justify-end">
            <PermissionButton
              canAccess={canCreate}
              isViewOnly={isViewOnly}
              type="primary"
              className="w-full sm:w-auto"
              onClick={() => navigate('/support/new', { state: { prevFrom: location.pathname, historyStack: [...(location.state?.historyStack || []), location.pathname] } })}
              icon={<Icons.PlusCircleOutlined />}
              text="Raise Ticket"
            />
          </div>
        </div>
      </div>

      <div className="shrink-0 grid grid-cols-2 md:grid-cols-5 border-t border-l border-b border-gray-200 bg-white">
        {displayKpis.map(stat => (
          <SupportKpiCard key={stat.key} label={stat.label} value={stat.count} loading={loading} active={currentStatuses.includes(stat.key)} onClick={() => handleKpiClick(stat.key)} />
        ))}
      </div>

      <div className="shrink-0 bg-white border-b border-gray-200 px-4 py-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row gap-3 items-center">
          <FilterInput
            type={filterInputEnum?.SEARCH}
            name="search"
            placeHolder="Search ticket no, title, module..."
            value={filter?.search}
            setFilter={setFilter}
            onSerch={handleSearch}
            onClear={handleClear}
          />
          <div className="flex-grow" />
          <div className="flex flex-wrap gap-2 justify-end">
            <Tooltip title={isLocked ? 'Unlock filters to clear saved preferences' : 'Lock current filters to save preferences'} placement="top">
              <CustomButton
                type={isLocked ? 'primary' : 'default'}
                icon={isLocked ? <Icons.UnlockOutlined /> : <Icons.LockOutlined />}
                onClick={handleLockToggle}
                text={isLocked ? 'Unlock' : 'Lock'}
              />
            </Tooltip>
            <CustomButton type="default" onClick={() => setShowFilter(!showFilter)}>
              {showFilter ? 'Hide Filters' : 'Filters'}
              <Badge count={getActiveFiltersCount()} showZero color={colorPalette.primary[500]} className="ml-1" />
            </CustomButton>
            <CustomButton type="primary" icon={<Icons.FilterOutlined />} onClick={handleFilter} text="Apply Filters" />
          </div>
        </div>

        {showFilter && (
          <div className="py-3 filters-open">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="flex flex-col gap-1">
                <FilterInput
                  type={filterInputEnum?.SELECT}
                  mode="multiple"
                  name="category"
                  label="Category"
                  placeHolder="Select Category"
                  selectionOptions={[
                    { value: 'BUG', label: 'Bug' },
                    { value: 'CHANGE_REQUEST', label: 'Change Request' },
                    { value: 'NEW_MODULE', label: 'New Module' },
                  ]}
                  value={filter?.category}
                  setFilter={setFilter}
                  allowClear
                />
              </div>
              <div className="flex flex-col gap-1">
                <FilterInput
                  type={filterInputEnum?.SELECT}
                  mode="multiple"
                  name="status"
                  label="Status"
                  placeHolder="Select Status"
                  selectionOptions={Object?.entries(SUPPORT_STATUS)?.map(([key, value]) => ({ value: key, label: value }))}
                  value={filter?.status}
                  setFilter={setFilter}
                  allowClear
                />
              </div>
              <div className="flex flex-col gap-1">
                <FilterInput
                  type={filterInputEnum?.SELECT}
                  mode="multiple"
                  name="priority"
                  label="Priority"
                  placeHolder="Select Priority"
                  selectionOptions={Object?.entries(SUPPORT_PRIORITY)?.map(([key, value]) => ({ value: key, label: value }))}
                  value={filter?.priority}
                  setFilter={setFilter}
                  allowClear
                />
              </div>
              <div className="flex flex-col gap-1">
                <FilterInput
                  type={filterInputEnum?.SELECT}
                  mode="multiple"
                  name="moduleName"
                  label="Module Name"
                  placeHolder="Select Module"
                  selectionOptions={Object?.entries(SUPPORT_MODULE_NAME)?.map(([key, value]) => ({ value: key, label: value }))}
                  value={filter?.moduleName}
                  setFilter={setFilter}
                  allowClear
                />
              </div>
              <div className="flex flex-col gap-1">
                <FilterInput
                  type={filterInputEnum?.SELECT}
                  mode="multiple"
                  name="raisedBy"
                  label="Raised By"
                  placeHolder="Select Raised By"
                  selectionOptions={(userDrop || []).map(option => ({ label: option?.name || option?.email || '', value: option?.id || option?._id }))}
                  value={filter?.raisedBy}
                  setFilter={setFilter}
                  allowClear
                />
              </div>
            </div>
          </div>
        )}

        <CommonFilterTags
          searchParams={searchParams}
          setFilter={setFilter}
          updateUrlParams={updateUrlParams}
          handleClear={handleClear}
          handleResetFilters={handleResetFilters}
          dateKeys={{ startDateKey: 'startDate', endDateKey: 'endDate', singleDateKey: 'createdAt' }}
          onDateClear={() => updateUrlParams({ startDate: null, endDate: null, createdAt: null, preset: null })}
          extraFilters={supportExtraFilters}
          STATUS_ENUM={SUPPORT_STATUS}
          divDrop={[]}
          branchDrop={[]}
        />
      </div>

      <div className="flex-1 min-h-0 overflow-hidden bg-white">
        <CustomTable
          columns={columns}
          loading={loading}
          data={supports}
          onChange={handleTableChange}
          tableId={getRowId}
          onRowClick={record => openTicket(record)}
          customStyle="support-lifecycle-table"
          scroll={{ x: 'max-content' }}
          pagination={{
            current: parseInt(searchParams?.get('page')) || 1,
            pageSize: parseInt(searchParams?.get('limit')) || pagination?.limit,
            total: pagination.totalResults,
            onChange: handlePaginationChange,
          }}
        />
      </div>

      <SupportLifecycleModal
        open={Boolean(lifecycleRecord)}
        record={lifecycleRecord}
        onClose={() => setLifecycleRecord(null)}
        onOpenTicket={record => {
          setLifecycleRecord(null);
          openTicket(record);
        }}
      />
    </div>
  );
};

export default ViewSupport;
