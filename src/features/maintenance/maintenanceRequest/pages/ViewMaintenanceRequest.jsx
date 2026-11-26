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
import { useWarehouse } from '@/features/allMaster/warehouse/useWarehouse';
import { useMachine } from '@/features/maintenance/machine';
import { maintenanceRequestColumn, useMaintenanceRequest } from '@/features/maintenance/maintenanceRequest';
import { MAINTENANCE_REQUEST_PRIORITIES, MAINTENANCE_REQUEST_STATUSES, MAINTENANCE_REQUEST_TYPES } from '@/features/maintenance/maintenanceRequest/maintenanceRequest.schema';
import {
  DATE_KEYS,
  MACHINE_STOPPED_OPTIONS,
  STATUS_LABELS,
  TYPE_LABELS,
  PRIORITY_LABELS,
  MACHINE_STOPPED_LABELS,
  recordId,
  userLabel,
  machineOptionLabel,
  branchOptionLabel,
  findById,
} from '@/features/maintenance/maintenanceRequest/maintenanceRequest.utils';
import RaiseCallModal from '@/features/maintenance/maintenanceRequest/components/RaiseCallModal';
import { CommonFilterTags, useFilters } from '@/utils/filtersUtils';
import { getAllFiltersFromLocalStorage } from '@/utils/filters';
import { getFromLocalStorage, getQueryParams, parsedTableCoulmns } from '@/utils/services';
import { FILTERS_KEYS, RESOURCES } from '@/utils/jsonFile';
import Icons from 'assets/icons/icon';
import { configEnum, filterInputEnum, PERMISSION_MESSAGES } from 'utils/constants';
import { PAGE_HEADERS } from '@/utils/label';
import { colorPalette } from '@/utils/theme';

const API_CALLED_ENUM = {
  MACHINE_DROPDOWN: 'machineDropdown',
  BRANCH_DROPDOWN: 'branchDropdown',
  USERS_DROPDOWN: 'usersDropdown',
};

const ViewMaintenanceRequest = () => {
  const navigate = useNavigate();
  const { useModuleMaintenanceRequest, isViewOnly } = useModulePermissions(RESOURCES.MAINTENANCE_REQUEST);
  const { maintenanceRequests, pagination, loading, getMaintenanceRequests, resetMaintenanceRequest } = useMaintenanceRequest();
  const { machineDropdown, dropdownLoading: machineDropdownLoading, getMachineDropdown } = useMachine();
  const { branchDrop, droploading: branchDropdownLoading, getBranchDropDown } = useWarehouse();
  const { usersDropdown, usersDropdownLoading, getUsersDropdown } = useUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const [raiseCallOpen, setRaiseCallOpen] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const FILTER_KEY = FILTERS_KEYS.MAINTENANCE_REQUEST_ALL_FILTERS;
  const isApiCalledRef = useRef(false);
  const isApicalledRefFilter = useRef({
    machineDropdown: false,
    branchDropdown: false,
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
      status: searchParams.get('status') || '',
      type: searchParams.get('type') || '',
      priority: searchParams.get('priority') || '',
      machineId: searchParams.get('machineId') || '',
      branchId: searchParams.get('branchId') || '',
      raisedBy: searchParams.get('raisedBy') || '',
      isMachineStopped: searchParams.get('isMachineStopped') || '',
    },
    dateKeys: DATE_KEYS,
  });

  const handleOnFocusApiCall = async type => {
    const called = { ...isApicalledRefFilter.current };

    if (type === API_CALLED_ENUM.MACHINE_DROPDOWN) {
      await getMachineDropdown({});
      called.machineDropdown = true;
    }

    if (type === API_CALLED_ENUM.BRANCH_DROPDOWN) {
      await getBranchDropDown({});
      called.branchDropdown = true;
    }

    if (type === API_CALLED_ENUM.USERS_DROPDOWN) {
      await getUsersDropdown();
      called.usersDropdown = true;
    }

    isApicalledRefFilter.current = called;
  };

  const fetchMaintenanceRequests = signal => {
    const page = parseInt(searchParams?.get('page')) || 1;
    const pageSize = parseInt(searchParams?.get('limit')) || pagination.limit;
    const sortBy = searchParams?.get('sortBy') || '';
    const payload = getQueryParams(window.location.href) || {};

    getMaintenanceRequests({
      page,
      limit: pageSize,
      search: payload.search || '',
      sortBy,
      status: payload.status || '',
      type: payload.type || '',
      priority: payload.priority || '',
      machineId: payload.machineId || '',
      branchId: payload.branchId || '',
      raisedBy: payload.raisedBy || '',
      isMachineStopped: payload.isMachineStopped || '',
      fromDate: payload.fromDate || '',
      toDate: payload.toDate || '',
      requestDate: payload.requestDate || '',
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
        } else if (savedFilters.requestDate) {
          setDateRange([savedFilters.requestDate, savedFilters.requestDate]);
        }

        setFilter(prev => ({
          ...prev,
          search: savedFilters.search ?? prev.search,
          status: savedFilters.status ?? prev.status,
          type: savedFilters.type ?? prev.type,
          priority: savedFilters.priority ?? prev.priority,
          machineId: savedFilters.machineId ?? prev.machineId,
          branchId: savedFilters.branchId ?? prev.branchId,
          raisedBy: savedFilters.raisedBy ?? prev.raisedBy,
          isMachineStopped: savedFilters.isMachineStopped ?? prev.isMachineStopped,
        }));

        if (savedFilters.machineId) {
          handleOnFocusApiCall(API_CALLED_ENUM.MACHINE_DROPDOWN);
        }
        if (savedFilters.branchId) {
          handleOnFocusApiCall(API_CALLED_ENUM.BRANCH_DROPDOWN);
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
    fetchMaintenanceRequests(controller.signal);
    return () => controller.abort();
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get('machineId')) {
      handleOnFocusApiCall(API_CALLED_ENUM.MACHINE_DROPDOWN);
    }
    if (searchParams.get('branchId')) {
      handleOnFocusApiCall(API_CALLED_ENUM.BRANCH_DROPDOWN);
    }
    if (searchParams.get('raisedBy')) {
      handleOnFocusApiCall(API_CALLED_ENUM.USERS_DROPDOWN);
    }
  }, []);

  useResetOnUnmount(resetMaintenanceRequest);

  const columns = maintenanceRequestColumn();
  const columnsFromLocalStorage = getFromLocalStorage(configEnum?.MAINTENANCE_REQUEST_CONFIG);
  const parsedColumnData = parsedTableCoulmns(columnsFromLocalStorage, columns);
  const displayColumn = parsedColumnData?.displayColumn?.filter(x => x?.visible === true);
  const [columnsList, setColumnsList] = useState(parsedColumnData?.displayColumn || []);
  const [customizedColumns, setCutomizedColumns] = useState([...(parsedColumnData?.customizedColumn?.length > 0 ? parsedColumnData.customizedColumn : displayColumn)]);

  const containerRef = useRef(null);
  const handleColumnResize = useColumnResize(setColumnsList, setCutomizedColumns, configEnum?.MAINTENANCE_REQUEST_CONFIG);

  const { showColumnModal, setShowColumnModal, standardDropdownItems } = useDocumentListToolbar({
    columnConfigKey: configEnum?.MAINTENANCE_REQUEST_CONFIG,
    filterKey: FILTER_KEY,
    showPreferences: false,
    columnsConfig: {
      getDefaultColumns: () => maintenanceRequestColumn(),
      setColumnsList,
      setCustomizedColumns: setCutomizedColumns,
    },
    handleResetFilters,
    onRefresh: () => fetchMaintenanceRequests(),
    setIsLocked,
  });

  const handleStatusTab = statusArr => {
    const next = Array.isArray(statusArr) ? statusArr.filter(Boolean) : [];
    const current = filter?.status ? [filter.status] : [];
    const added = next.find(value => !current.includes(value));
    const status = added || '';
    setFilter(prev => ({ ...prev, status }));
    updateUrlParams({ status: status || null, page: 1, limit: pagination?.limit });
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
          title={PAGE_HEADERS?.MAINTENANCE_REQUESTS?.title}
          rightStats={[
            { label: 'Open Requests', value: pagination?.openRequestCount ?? 0 },
            { label: 'Critical Open', value: pagination?.criticalOpenCount ?? 0 },
            { label: 'Machine Stopped', value: pagination?.machineStoppedCount ?? 0 },
          ]}
        />
        <div className="flex flex-wrap gap-2 md:gap-3 justify-center md:justify-end">
          <PermissionButton
            canAccess={!!useModuleMaintenanceRequest?.create}
            isViewOnly={isViewOnly}
            type="primary"
            className="py-4 px-5"
            wrapperClassName="inline-block"
            text="Add"
            icon={<Icons.PlusCircleOutlined />}
            onClick={() => setRaiseCallOpen(true)}
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
          <StatusFilterTabs statuses={MAINTENANCE_REQUEST_STATUSES} value={filter?.status} onChange={handleStatusTab} />
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
              <CustomDatePicker selectedPreset={selectedPreset} setSelectedPreset={setSelectedPreset} dateRange={dateRange} setDateRange={setDateRange} label="Raised Date" />
            </div>
          </FilterSection>

          <FilterSection title="What">
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name="status"
                label="Status"
                placeHolder="Select Status"
                selectionOptions={MAINTENANCE_REQUEST_STATUSES}
                value={filter?.status}
                setFilter={setFilter}
                allowClear
              />
            </div>
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name="type"
                label="Type"
                placeHolder="Select Type"
                selectionOptions={MAINTENANCE_REQUEST_TYPES}
                value={filter?.type}
                setFilter={setFilter}
                allowClear
              />
            </div>
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name="priority"
                label="Priority"
                placeHolder="Select Priority"
                selectionOptions={MAINTENANCE_REQUEST_PRIORITIES}
                value={filter?.priority}
                setFilter={setFilter}
                allowClear
              />
            </div>
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name="isMachineStopped"
                label="Machine Stopped"
                placeHolder="Select"
                selectionOptions={MACHINE_STOPPED_OPTIONS}
                value={filter?.isMachineStopped}
                setFilter={setFilter}
                allowClear
              />
            </div>
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name="machineId"
                label="Machine"
                placeHolder="Select Machine"
                selectionOptions={(machineDropdown || []).map(machine => ({
                  label: machineOptionLabel(machine),
                  value: recordId(machine),
                }))}
                value={filter?.machineId}
                setFilter={setFilter}
                allowClear
                loading={machineDropdownLoading}
                onFocus={() => {
                  if (!isApicalledRefFilter.current.machineDropdown) {
                    handleOnFocusApiCall(API_CALLED_ENUM.MACHINE_DROPDOWN);
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

          <FilterSection title="Where">
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name="branchId"
                label="Branch"
                placeHolder="Select Branch"
                selectionOptions={(branchDrop || []).map(branch => ({
                  label: branchOptionLabel(branch),
                  value: recordId(branch),
                }))}
                value={filter?.branchId}
                setFilter={setFilter}
                allowClear
                loading={branchDropdownLoading}
                onFocus={() => {
                  if (!isApicalledRefFilter.current.branchDropdown) {
                    handleOnFocusApiCall(API_CALLED_ENUM.BRANCH_DROPDOWN);
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
            updateUrlParams({ fromDate: null, toDate: null, requestDate: null, preset: null });
          }}
          STATUS_ENUM={STATUS_LABELS}
          extraFilters={{
            type: {
              label: 'Type',
              format: value => TYPE_LABELS[value] || value,
              clear: () => clearFilterValue('type'),
            },
            priority: {
              label: 'Priority',
              format: value => PRIORITY_LABELS[value] || value,
              clear: () => clearFilterValue('priority'),
            },
            isMachineStopped: {
              label: 'Machine Stopped',
              format: value => MACHINE_STOPPED_LABELS[value] || value,
              clear: () => clearFilterValue('isMachineStopped'),
            },
            machineId: {
              label: 'Machine',
              format: value => {
                const machine = findById(machineDropdown, value);
                return machine ? machineOptionLabel(machine) : value;
              },
              clear: () => clearFilterValue('machineId'),
            },
            raisedBy: {
              label: 'Raised By',
              format: value => {
                const user = findById(usersDropdown, value);
                return user ? userLabel(user) : value;
              },
              clear: () => clearFilterValue('raisedBy'),
            },
            branchId: {
              label: 'Branch',
              format: value => {
                const branch = findById(branchDrop, value);
                return branch ? branchOptionLabel(branch) : value;
              },
              clear: () => clearFilterValue('branchId'),
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
                const canView = useModuleMaintenanceRequest?.view;
                const blockedTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : PERMISSION_MESSAGES.NO_PERMISSION;
                return canView ? (
                  <Tooltip title="View and Manage Maintenance Request" getPopupContainer={() => containerRef.current || document.body}>
                    <Icons.EyeOutlined
                      className="cursor-pointer"
                      style={{ fontSize: 17, color: colorPalette.primary[500] }}
                      onClick={event => {
                        event.stopPropagation();
                        if (id) navigate(`/maintenance-request/${id}`);
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
          data={maintenanceRequests}
          onRowClick={record => {
            const id = record?.id || record?._id;
            if (id) navigate(`/maintenance-request/${id}`);
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
      <RaiseCallModal open={raiseCallOpen} onClose={() => setRaiseCallOpen(false)} onSuccess={() => fetchMaintenanceRequests()} />
      <ColumnSelection
        hideTrigger
        columns={columnsList}
        setColumnsList={setColumnsList}
        setCutomizedColumns={setCutomizedColumns}
        configPage={configEnum?.MAINTENANCE_REQUEST_CONFIG}
        modalOpen={showColumnModal}
        setModalOpen={setShowColumnModal}
      />
    </div>
  );
};

export default ViewMaintenanceRequest;
