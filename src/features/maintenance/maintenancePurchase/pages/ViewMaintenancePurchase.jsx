import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import ColumnSelection from '@/components/ui/common/ColumnSelection';
import PageHeader from '@/components/ui/common/PageHeader';
import CustomButton from '@/components/ui/button/CustomButton';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import CustomDatePicker from '@/components/forms/formDatePicker/CustomDatePicker';
import FilterInput from '@/components/forms/formInput/FilterInput';
import StatusFilterTabs from '@/components/ui/common/StatusFilterTabs';
import FilterLockButton from '@/components/ui/common/FilterLockButton';
import FilterDrawer, { FilterSection, FilterButton } from '@/components/ui/common/FilterDrawer';
import { Dropdown, Tooltip } from '@/components/AntDComponent';

import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import useDocumentListToolbar from '@/hooks/useDocumentListToolbar';
import useColumnResize from '@/hooks/useColumnResize';
import useModulePermissions from '@/hooks/useModulePermissions';
import { useUser } from '@/features/setting/user/useUser';
import { useMaintenanceRequest } from '@/features/maintenance/maintenanceRequest';
import { maintenancePurchaseColumn, useMaintenancePurchase } from '@/features/maintenance/maintenancePurchase';
import { MAINTENANCE_PURCHASE_STAGES } from '@/features/maintenance/maintenancePurchase/maintenancePurchase.schema';
import { DATE_KEYS, STAGE_LABELS, findById, maintenanceRequestOptionLabel, recordId, userLabel } from '@/features/maintenance/maintenancePurchase/maintenancePurchase.utils';
import { CommonFilterTags, useFilters } from '@/utils/filtersUtils';
import { getAllFiltersFromLocalStorage } from '@/utils/filters';
import { getFromLocalStorage, getQueryParams, parsedTableCoulmns } from '@/utils/services';
import { FILTERS_KEYS, RESOURCES } from '@/utils/jsonFile';
import Icons from 'assets/icons/icon';
import { configEnum, filterInputEnum, PERMISSION_MESSAGES } from 'utils/constants';
import { PAGE_HEADERS } from '@/utils/label';
import { colorPalette } from '@/utils/theme';

const API_CALLED_ENUM = {
  MAINTENANCE_REQUEST_DROPDOWN: 'maintenanceRequestDropdown',
  USERS_DROPDOWN: 'usersDropdown',
};

const ViewMaintenancePurchase = () => {
  const navigate = useNavigate();
  const { useModuleMaintenancePurchase, isViewOnly } = useModulePermissions(RESOURCES.MAINTENANCE_PURCHASE);
  const { maintenancePurchases, pagination, loading, getMaintenancePurchases, resetMaintenancePurchase } = useMaintenancePurchase();
  const { maintenanceRequestDropdown, dropdownLoading: maintenanceRequestDropdownLoading, getMaintenanceRequestDropdown } = useMaintenanceRequest();
  const { usersDropdown, usersDropdownLoading, getUsersDropdown } = useUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilter, setShowFilter] = useState(false);
  const FILTER_KEY = FILTERS_KEYS.MAINTENANCE_PURCHASE_ALL_FILTERS;
  const isApiCalledRef = useRef(false);
  const isApicalledRefFilter = useRef({
    maintenanceRequestDropdown: false,
    usersDropdown: false,
  });

  const {
    filter,
    setFilter,
    isLocked,
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
    setIsLocked,
  } = useFilters({
    searchParams,
    setSearchParams,
    pagination,
    FILTER_KEY,
    setShowFilter,
    defaultFilter: {
      search: searchParams.get('search') || '',
      stage: searchParams.get('stage') || '',
      linkedMrId: searchParams.get('linkedMrId') || '',
      raisedBy: searchParams.get('raisedBy') || '',
    },
    dateKeys: DATE_KEYS,
  });

  const handleOnFocusApiCall = async type => {
    const called = { ...isApicalledRefFilter.current };

    if (type === API_CALLED_ENUM.MAINTENANCE_REQUEST_DROPDOWN) {
      await getMaintenanceRequestDropdown();
      called.maintenanceRequestDropdown = true;
    }

    if (type === API_CALLED_ENUM.USERS_DROPDOWN) {
      await getUsersDropdown();
      called.usersDropdown = true;
    }

    isApicalledRefFilter.current = called;
  };

  const fetchMaintenancePurchases = signal => {
    const page = parseInt(searchParams?.get('page'), 10) || 1;
    const pageSize = parseInt(searchParams?.get('limit'), 10) || pagination.limit;
    const sortBy = searchParams?.get('sortBy') || '';
    const payload = getQueryParams(window.location.href) || {};

    getMaintenancePurchases({
      page,
      limit: pageSize,
      search: payload.search || '',
      sortBy,
      stage: payload.stage || '',
      linkedMrId: payload.linkedMrId || '',
      raisedBy: payload.raisedBy || '',
      fromDate: payload.fromDate || '',
      toDate: payload.toDate || '',
      prDate: payload.prDate || '',
      signal,
    });
  };

  useEffect(() => {
    const savedFilters = getAllFiltersFromLocalStorage(FILTER_KEY);

    if (!isApiCalledRef.current && !searchParams.get('page') && !searchParams.get('limit')) {
      if (savedFilters && Object.keys(savedFilters).length > 0) {
        if (savedFilters.preset) {
          setSelectedPreset(savedFilters.preset);
        }
        if (savedFilters.fromDate && savedFilters.toDate) {
          setDateRange([savedFilters.fromDate, savedFilters.toDate]);
        } else if (savedFilters.prDate) {
          setDateRange([savedFilters.prDate, savedFilters.prDate]);
        }

        setFilter(prev => ({
          ...prev,
          search: savedFilters.search ?? prev.search,
          stage: savedFilters.stage ?? prev.stage,
          linkedMrId: savedFilters.linkedMrId ?? prev.linkedMrId,
          raisedBy: savedFilters.raisedBy ?? prev.raisedBy,
        }));

        if (savedFilters.linkedMrId) {
          handleOnFocusApiCall(API_CALLED_ENUM.MAINTENANCE_REQUEST_DROPDOWN);
        }
        if (savedFilters.raisedBy) {
          handleOnFocusApiCall(API_CALLED_ENUM.USERS_DROPDOWN);
        }

        if (!areSavedFiltersApplied(savedFilters)) {
          isApiCalledRef.current = true;
          updateUrlParams(savedFilters);
          return;
        }
      }
      isApiCalledRef.current = true;
    }

    const controller = new AbortController();
    fetchMaintenancePurchases(controller.signal);
    return () => controller.abort();
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get('linkedMrId')) {
      handleOnFocusApiCall(API_CALLED_ENUM.MAINTENANCE_REQUEST_DROPDOWN);
    }
    if (searchParams.get('raisedBy')) {
      handleOnFocusApiCall(API_CALLED_ENUM.USERS_DROPDOWN);
    }
  }, []);

  useResetOnUnmount(resetMaintenancePurchase);

  const columns = maintenancePurchaseColumn();
  const columnsFromLocalStorage = getFromLocalStorage(configEnum?.MAINTENANCE_PURCHASE_CONFIG);
  const parsedColumnData = parsedTableCoulmns(columnsFromLocalStorage, columns);
  const displayColumn = parsedColumnData?.displayColumn?.filter(x => x?.visible === true);
  const [columnsList, setColumnsList] = useState(parsedColumnData?.displayColumn || []);
  const [customizedColumns, setCutomizedColumns] = useState([...(parsedColumnData?.customizedColumn?.length > 0 ? parsedColumnData.customizedColumn : displayColumn)]);

  const containerRef = useRef(null);
  const handleColumnResize = useColumnResize(setColumnsList, setCutomizedColumns, configEnum?.MAINTENANCE_PURCHASE_CONFIG);

  const { showColumnModal, setShowColumnModal, standardDropdownItems } = useDocumentListToolbar({
    columnConfigKey: configEnum?.MAINTENANCE_PURCHASE_CONFIG,
    filterKey: FILTER_KEY,
    showPreferences: false,
    columnsConfig: {
      getDefaultColumns: () => maintenancePurchaseColumn(),
      setColumnsList,
      setCustomizedColumns: setCutomizedColumns,
    },
    handleResetFilters,
    onRefresh: () => fetchMaintenancePurchases(),
    setIsLocked,
  });

  const handleStageTab = stageArr => {
    const next = Array.isArray(stageArr) ? stageArr.filter(Boolean) : [];
    const current = filter?.stage ? [filter.stage] : [];
    const added = next.find(value => !current.includes(value));
    const stage = added || '';
    setFilter(prev => ({ ...prev, stage }));
    updateUrlParams({ stage: stage || null, page: 1, limit: pagination?.limit });
  };

  const handlePaginationChange = (page, pageSize) => {
    updateUrlParams({ page, limit: pageSize });
  };

  const handleTableChange = (paginationData, filters, sorter) => {
    let sortString = '';
    if (sorter?.field && sorter?.order) {
      const direction = sorter.order === 'ascend' ? 'asc' : 'desc';
      sortString = `${sorter.field}:${direction}`;
    }
    updateUrlParams({ sortBy: sortString, page: 1 });
  };

  const clearFilterValue = key => {
    setFilter(prev => ({ ...prev, [key]: '' }));
    updateUrlParams({ [key]: null });
  };

  return (
    <div ref={containerRef} className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden -m-4">
      <div className="bg-white px-4 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        <PageHeader
          loading={loading}
          title={PAGE_HEADERS?.MAINTENANCE_PURCHASES?.title}
          rightStats={[
            { label: 'Pending Approval', value: pagination?.pendingApprovalCount ?? 0 },
            { label: 'Open Orders', value: pagination?.openOrderCount ?? 0 },
            { label: 'Received', value: pagination?.receivedCount ?? 0 },
          ]}
        />
        <div className="flex flex-wrap gap-2 md:gap-3 justify-center md:justify-end">
          <PermissionButton
            canAccess={!!useModuleMaintenancePurchase?.create}
            isViewOnly={isViewOnly}
            type="primary"
            className="py-4 px-5"
            wrapperClassName="inline-block"
            text="Add"
            icon={<Icons.PlusCircleOutlined />}
            onClick={() => navigate('/maintenance-purchase/new')}
          />
          <Tooltip title="More Actions" placement="left" getPopupContainer={() => containerRef.current || document.body}>
            <Dropdown menu={{ items: standardDropdownItems, className: 'app-toolbar-dropdown' }} trigger={['click']} getPopupContainer={() => containerRef.current || document.body}>
              <CustomButton type="default" icon={<Icons.EllipsisOutlined />} />
            </Dropdown>
          </Tooltip>
        </div>
      </div>
      <div className="bg-white border-t px-4 py-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <StatusFilterTabs statuses={MAINTENANCE_PURCHASE_STAGES} value={filter?.stage} onChange={handleStageTab} />
          <div className="flex-grow" />
          <div className="flex flex-nowrap gap-2 items-center">
            <FilterInput type={filterInputEnum?.SEARCH} name="search" placeHolder="Search..." value={filter?.search} setFilter={setFilter} onSerch={handleSearch} onClear={handleClear} />
            <FilterLockButton isLocked={isLocked} activeFiltersCount={getActiveFiltersCount()} onToggle={handleLockToggle} />
            <FilterButton count={getActiveFiltersCount()} onClick={() => setShowFilter(true)} />
          </div>
        </div>
        <FilterDrawer
          open={showFilter}
          onClose={() => setShowFilter(false)}
          onApply={() => {
            handleFilter();
            setShowFilter(false);
          }}
          onReset={handleResetFilters}
        >
          <FilterSection title="When" columns={1}>
            <div>
              <CustomDatePicker selectedPreset={selectedPreset} setSelectedPreset={setSelectedPreset} dateRange={dateRange} setDateRange={setDateRange} label="PR Date" />
            </div>
          </FilterSection>

          <FilterSection title="What">
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name="stage"
                label="Stage"
                placeHolder="Select Stage"
                selectionOptions={MAINTENANCE_PURCHASE_STAGES}
                value={filter?.stage}
                setFilter={setFilter}
                allowClear
              />
            </div>
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name="linkedMrId"
                label="Linked MR"
                placeHolder="Select Maintenance Request"
                selectionOptions={(maintenanceRequestDropdown || []).map(request => ({
                  label: maintenanceRequestOptionLabel(request),
                  value: recordId(request),
                }))}
                value={filter?.linkedMrId}
                setFilter={setFilter}
                allowClear
                loading={maintenanceRequestDropdownLoading}
                onFocus={() => {
                  if (!isApicalledRefFilter.current.maintenanceRequestDropdown) {
                    handleOnFocusApiCall(API_CALLED_ENUM.MAINTENANCE_REQUEST_DROPDOWN);
                  }
                }}
              />
            </div>
          </FilterSection>

          <FilterSection title="Who">
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name="raisedBy"
                label="Raised By"
                placeHolder="Select User"
                selectionOptions={(usersDropdown || []).map(user => ({
                  label: userLabel(user),
                  value: recordId(user),
                }))}
                value={filter?.raisedBy}
                setFilter={setFilter}
                allowClear
                loading={usersDropdownLoading}
                onFocus={() => {
                  if (!isApicalledRefFilter.current.usersDropdown) {
                    handleOnFocusApiCall(API_CALLED_ENUM.USERS_DROPDOWN);
                  }
                }}
              />
            </div>
          </FilterSection>
        </FilterDrawer>
        <CommonFilterTags
          searchParams={searchParams}
          setFilter={setFilter}
          updateUrlParams={updateUrlParams}
          handleClear={handleClear}
          handleResetFilters={handleResetFilters}
          dateKeys={{
            startDateKey: DATE_KEYS.startDate,
            endDateKey: DATE_KEYS.endDate,
            singleDateKey: DATE_KEYS.singleDate,
          }}
          onDateClear={() => {
            setSelectedPreset('custom');
            setDateRange(null);
            updateUrlParams({ fromDate: null, toDate: null, prDate: null, preset: null });
          }}
          extraFilters={{
            stage: {
              label: 'Stage',
              format: value => STAGE_LABELS[value] || value,
              clear: () => clearFilterValue('stage'),
            },
            linkedMrId: {
              label: 'Linked MR',
              format: value => {
                const request = findById(maintenanceRequestDropdown, value);
                return request ? maintenanceRequestOptionLabel(request) || value : value;
              },
              clear: () => clearFilterValue('linkedMrId'),
            },
            raisedBy: {
              label: 'Raised By',
              format: value => {
                const user = findById(usersDropdown, value);
                return user ? userLabel(user) : value;
              },
              clear: () => clearFilterValue('raisedBy'),
            },
          }}
        />
      </div>
      <div>
        <CustomTable
          onColumnResize={handleColumnResize}
          columns={[
            ...customizedColumns,
            {
              title: 'Action',
              key: 'action',
              width: 80,
              render: (value, record) => {
                const row = record?.id || record?._id ? record : value;
                const id = row?.id || row?._id;
                const canView = useModuleMaintenancePurchase?.view;
                const blockedTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : PERMISSION_MESSAGES.NO_PERMISSION;
                return canView ? (
                  <Tooltip title="View and Manage Maintenance Purchase" getPopupContainer={() => containerRef.current || document.body}>
                    <Icons.EyeOutlined
                      className="cursor-pointer"
                      style={{ fontSize: 17, color: colorPalette.primary[500] }}
                      onClick={event => {
                        event.stopPropagation();
                        if (id) navigate(`/maintenance-purchase/${id}`);
                      }}
                    />
                  </Tooltip>
                ) : (
                  <Tooltip title={blockedTooltip} getPopupContainer={() => containerRef.current || document.body}>
                    <Icons.EyeOutlined className="opacity-40 cursor-not-allowed" style={{ fontSize: 17, color: colorPalette.primary[500] }} />
                  </Tooltip>
                );
              },
            },
          ]}
          data={maintenancePurchases}
          onRowClick={record => {
            const id = record?.id || record?._id;
            if (id) navigate(`/maintenance-purchase/${id}`);
          }}
          loading={loading}
          onChange={handleTableChange}
          tableId="id"
          pagination={{
            current: searchParams?.get('page') || 1,
            pageSize: searchParams?.get('limit') || pagination?.limit,
            total: pagination.totalResults,
            onChange: handlePaginationChange,
          }}
        />
      </div>
      <ColumnSelection
        hideTrigger
        columns={columnsList}
        setColumnsList={setColumnsList}
        setCutomizedColumns={setCutomizedColumns}
        configPage={configEnum?.MAINTENANCE_PURCHASE_CONFIG}
        modalOpen={showColumnModal}
        setModalOpen={setShowColumnModal}
      />
    </div>
  );
};

export { ViewMaintenancePurchase };
export default ViewMaintenancePurchase;
