import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import ColumnSelection from '@/components/ui/common/ColumnSelection';
import PageHeader from '@/components/ui/common/PageHeader';
import CustomButton from '@/components/ui/button/CustomButton';
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
import { useMachine } from '@/features/maintenance/machine';
import { useSparePart } from '@/features/maintenance/sparePart';
import { useMaintenanceRequest } from '@/features/maintenance/maintenanceRequest';
import { partRequestColumn, usePartRequest } from '@/features/maintenance/partRequest';
import ApprovePartRequestModal from '@/features/maintenance/partRequest/components/ApprovePartRequestModal';
import IssuePartRequestModal from '@/features/maintenance/partRequest/components/IssuePartRequestModal';
import ShortPartRequestModal from '@/features/maintenance/partRequest/components/ShortPartRequestModal';
import { PART_REQUEST_STATUSES } from '@/features/maintenance/partRequest/partRequest.schema';
import { DATE_KEYS, STATUS_LABELS, findById, machineOptionLabel, maintenanceRequestOptionLabel, recordId, sparePartOptionLabel, userLabel } from '@/features/maintenance/partRequest/partRequest.utils';
import { CommonFilterTags, useFilters } from '@/utils/filtersUtils';
import { getAllFiltersFromLocalStorage } from '@/utils/filters';
import { getFromLocalStorage, getQueryParams, parsedTableCoulmns } from '@/utils/services';
import { FILTERS_KEYS, RESOURCES } from '@/utils/jsonFile';
import { ADMIN_ROUTE_PATHS } from '@/routes/adminRoutePaths';
import Icons from 'assets/icons/icon';
import { configEnum, filterInputEnum, PERMISSION_MESSAGES } from 'utils/constants';
import { PAGE_HEADERS } from '@/utils/label';

const API_CALLED_ENUM = {
  MACHINE_DROPDOWN: 'machineDropdown',
  SPARE_PART_DROPDOWN: 'sparePartDropdown',
  MAINTENANCE_REQUEST_DROPDOWN: 'maintenanceRequestDropdown',
  USERS_DROPDOWN: 'usersDropdown',
};

const ViewPartRequest = () => {
  const navigate = useNavigate();
  const { useModulePartRequest, isViewOnly } = useModulePermissions(RESOURCES.PART_REQUEST);
  const { useModuleMaintenancePurchase, isViewOnly: isPurchaseViewOnly } = useModulePermissions(RESOURCES.MAINTENANCE_PURCHASE);
  const { partRequests, pagination, loading, getPartRequests, resetPartRequest } = usePartRequest();
  const { machineDropdown, dropdownLoading: machineDropdownLoading, getMachineDropdown } = useMachine();
  const { sparePartDropdown, dropdownLoading: sparePartDropdownLoading, getSparePartDropdown } = useSparePart();
  const { maintenanceRequestDropdown, dropdownLoading: maintenanceRequestDropdownLoading, getMaintenanceRequestDropdown } = useMaintenanceRequest();
  const { usersDropdown, usersDropdownLoading, getUsersDropdown } = useUser();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilter, setShowFilter] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [shortOpen, setShortOpen] = useState(false);
  const [selectedPartRequest, setSelectedPartRequest] = useState(null);
  const [openDropdownKey, setOpenDropdownKey] = useState(null);
  const FILTER_KEY = FILTERS_KEYS.PART_REQUEST_ALL_FILTERS;
  const isApiCalledRef = useRef(false);
  const isApicalledRefFilter = useRef({
    machineDropdown: false,
    sparePartDropdown: false,
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
      status: searchParams.get('status') || '',
      mrId: searchParams.get('mrId') || '',
      machineId: searchParams.get('machineId') || '',
      sparePartId: searchParams.get('sparePartId') || '',
      requestedBy: searchParams.get('requestedBy') || '',
    },
    dateKeys: DATE_KEYS,
  });

  const handleOnFocusApiCall = async type => {
    const called = { ...isApicalledRefFilter.current };

    if (type === API_CALLED_ENUM.MACHINE_DROPDOWN) {
      await getMachineDropdown({});
      called.machineDropdown = true;
    }

    if (type === API_CALLED_ENUM.SPARE_PART_DROPDOWN) {
      await getSparePartDropdown({});
      called.sparePartDropdown = true;
    }

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

  const fetchPartRequests = signal => {
    const page = parseInt(searchParams?.get('page'), 10) || 1;
    const pageSize = parseInt(searchParams?.get('limit'), 10) || pagination.limit;
    const sortBy = searchParams?.get('sortBy') || '';
    const payload = getQueryParams(window.location.href) || {};

    getPartRequests({
      page,
      limit: pageSize,
      search: payload.search || '',
      sortBy,
      status: payload.status || '',
      mrId: payload.mrId || '',
      machineId: payload.machineId || '',
      sparePartId: payload.sparePartId || '',
      requestedBy: payload.requestedBy || '',
      fromDate: payload.fromDate || '',
      toDate: payload.toDate || '',
      requestedDate: payload.requestedDate || '',
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
        } else if (savedFilters.requestedDate) {
          setDateRange([savedFilters.requestedDate, savedFilters.requestedDate]);
        }

        setFilter(prev => ({
          ...prev,
          search: savedFilters.search ?? prev.search,
          status: savedFilters.status ?? prev.status,
          mrId: savedFilters.mrId ?? prev.mrId,
          machineId: savedFilters.machineId ?? prev.machineId,
          sparePartId: savedFilters.sparePartId ?? prev.sparePartId,
          requestedBy: savedFilters.requestedBy ?? prev.requestedBy,
        }));

        if (savedFilters.machineId) {
          handleOnFocusApiCall(API_CALLED_ENUM.MACHINE_DROPDOWN);
        }
        if (savedFilters.sparePartId) {
          handleOnFocusApiCall(API_CALLED_ENUM.SPARE_PART_DROPDOWN);
        }
        if (savedFilters.mrId) {
          handleOnFocusApiCall(API_CALLED_ENUM.MAINTENANCE_REQUEST_DROPDOWN);
        }
        if (savedFilters.requestedBy) {
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
    fetchPartRequests(controller.signal);
    return () => controller.abort();
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get('machineId')) {
      handleOnFocusApiCall(API_CALLED_ENUM.MACHINE_DROPDOWN);
    }
    if (searchParams.get('sparePartId')) {
      handleOnFocusApiCall(API_CALLED_ENUM.SPARE_PART_DROPDOWN);
    }
    if (searchParams.get('mrId')) {
      handleOnFocusApiCall(API_CALLED_ENUM.MAINTENANCE_REQUEST_DROPDOWN);
    }
    if (searchParams.get('requestedBy')) {
      handleOnFocusApiCall(API_CALLED_ENUM.USERS_DROPDOWN);
    }
  }, []);

  useResetOnUnmount(resetPartRequest);

  const columns = partRequestColumn();
  const columnsFromLocalStorage = getFromLocalStorage(configEnum?.PART_REQUEST_CONFIG);
  const parsedColumnData = parsedTableCoulmns(columnsFromLocalStorage, columns);
  const displayColumn = parsedColumnData?.displayColumn?.filter(x => x?.visible === true);
  const [columnsList, setColumnsList] = useState(parsedColumnData?.displayColumn || []);
  const [customizedColumns, setCutomizedColumns] = useState([...(parsedColumnData?.customizedColumn?.length > 0 ? parsedColumnData.customizedColumn : displayColumn)]);

  const containerRef = useRef(null);
  const handleColumnResize = useColumnResize(setColumnsList, setCutomizedColumns, configEnum?.PART_REQUEST_CONFIG);

  const { showColumnModal, setShowColumnModal, standardDropdownItems } = useDocumentListToolbar({
    columnConfigKey: configEnum?.PART_REQUEST_CONFIG,
    filterKey: FILTER_KEY,
    showPreferences: false,
    columnsConfig: {
      getDefaultColumns: () => partRequestColumn(),
      setColumnsList,
      setCustomizedColumns: setCutomizedColumns,
    },
    handleResetFilters,
    onRefresh: () => fetchPartRequests(),
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

  const handleApproveClick = record => {
    setSelectedPartRequest(record);
    setApproveOpen(true);
  };

  const handleApproveClose = () => {
    setApproveOpen(false);
    setSelectedPartRequest(null);
  };

  const handleIssueClick = record => {
    setSelectedPartRequest(record);
    setIssueOpen(true);
  };

  const handleIssueClose = () => {
    setIssueOpen(false);
    setSelectedPartRequest(null);
  };

  const handleShortClick = record => {
    setSelectedPartRequest(record);
    setShortOpen(true);
  };

  const handleShortClose = () => {
    setShortOpen(false);
    setSelectedPartRequest(null);
  };

  const handleRaisePrClick = record => {
    const linkedMrId = recordId(record?.mrId) || record?.mrId || null;
    const sparePartId = recordId(record?.sparePartId) || record?.sparePartId || null;
    const requestedQty = record?.approvedQty ?? record?.requestedQty ?? '';

    navigate(`/${ADMIN_ROUTE_PATHS.maintenancePurchase.new}`, {
      state: {
        fromPartRequest: {
          partRequestId: recordId(record),
          partRequestNo: record?.partRequestNo || '',
          linkedMrId,
          sparePartId,
          requestedQty,
        },
      },
    });
  };

  return (
    <div ref={containerRef} className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden -m-4">
      <div className="bg-white px-4 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        <PageHeader
          loading={loading}
          title={PAGE_HEADERS?.PART_REQUESTS?.title}
          rightStats={[
            { label: 'Pending', value: pagination?.statusCounts?.PENDING ?? 0 },
            { label: 'Approved', value: pagination?.statusCounts?.APPROVED ?? 0 },
            { label: 'Issued', value: pagination?.statusCounts?.ISSUED ?? 0 },
            { label: 'Short', value: pagination?.statusCounts?.SHORT ?? 0 },
          ]}
        />
        <div className="flex flex-wrap gap-2 md:gap-3 justify-center md:justify-end">
          <Tooltip title="More Actions" placement="left" getPopupContainer={() => containerRef.current || document.body}>
            <Dropdown menu={{ items: standardDropdownItems, className: 'app-toolbar-dropdown' }} trigger={['click']} getPopupContainer={() => containerRef.current || document.body}>
              <CustomButton type="default" icon={<Icons.EllipsisOutlined />} />
            </Dropdown>
          </Tooltip>
        </div>
      </div>
      <div className="bg-white border-t px-4 py-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <StatusFilterTabs statuses={PART_REQUEST_STATUSES} value={filter?.status} onChange={handleStatusTab} />
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
              <CustomDatePicker selectedPreset={selectedPreset} setSelectedPreset={setSelectedPreset} dateRange={dateRange} setDateRange={setDateRange} label="Requested Date" />
            </div>
          </FilterSection>

          <FilterSection title="What">
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name="status"
                label="Status"
                placeHolder="Select Status"
                selectionOptions={PART_REQUEST_STATUSES}
                value={filter?.status}
                setFilter={setFilter}
                allowClear
              />
            </div>
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name="mrId"
                label="MR No"
                placeHolder="Select Maintenance Request"
                selectionOptions={(maintenanceRequestDropdown || []).map(request => ({
                  label: maintenanceRequestOptionLabel(request),
                  value: recordId(request),
                }))}
                value={filter?.mrId}
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
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name="sparePartId"
                label="Part"
                placeHolder="Select Spare Part"
                selectionOptions={(sparePartDropdown || []).map(part => ({
                  label: sparePartOptionLabel(part),
                  value: recordId(part),
                }))}
                value={filter?.sparePartId}
                setFilter={setFilter}
                allowClear
                loading={sparePartDropdownLoading}
                onFocus={() => {
                  if (!isApicalledRefFilter.current.sparePartDropdown) {
                    handleOnFocusApiCall(API_CALLED_ENUM.SPARE_PART_DROPDOWN);
                  }
                }}
              />
            </div>
          </FilterSection>

          <FilterSection title="Who">
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name="requestedBy"
                label="Requested By"
                placeHolder="Select User"
                selectionOptions={(usersDropdown || []).map(user => ({
                  label: userLabel(user),
                  value: recordId(user),
                }))}
                value={filter?.requestedBy}
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
            updateUrlParams({ fromDate: null, toDate: null, requestedDate: null, preset: null });
          }}
          STATUS_ENUM={STATUS_LABELS}
          extraFilters={{
            mrId: {
              label: 'MR No',
              format: value => {
                const request = findById(maintenanceRequestDropdown, value);
                return request ? maintenanceRequestOptionLabel(request) || value : value;
              },
              clear: () => clearFilterValue('mrId'),
            },
            machineId: {
              label: 'Machine',
              format: value => {
                const machine = findById(machineDropdown, value);
                return machine ? machineOptionLabel(machine) : value;
              },
              clear: () => clearFilterValue('machineId'),
            },
            sparePartId: {
              label: 'Part',
              format: value => {
                const part = findById(sparePartDropdown, value);
                return part ? sparePartOptionLabel(part) : value;
              },
              clear: () => clearFilterValue('sparePartId'),
            },
            requestedBy: {
              label: 'Requested By',
              format: value => {
                const user = findById(usersDropdown, value);
                return user ? userLabel(user) : value;
              },
              clear: () => clearFilterValue('requestedBy'),
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
              width: 90,
              render: (value, record) => {
                const row = record?.id || record?._id ? record : value;
                const rowKey = row?.id || row?._id;
                const canEdit = !!useModulePartRequest?.edit && !isViewOnly;
                const isPending = row?.status === 'PENDING';
                const isApproved = row?.status === 'APPROVED';
                const isShort = row?.status === 'SHORT';
                const canApprove = canEdit && isPending;
                const canIssue = canEdit && isApproved;
                const canShort = canEdit && isApproved;
                const canRaisePr = !!useModuleMaintenancePurchase?.create && !isPurchaseViewOnly && isShort;
                const blockedTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : PERMISSION_MESSAGES.NO_PERMISSION;
                const approveBlockedTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : !useModulePartRequest?.edit ? PERMISSION_MESSAGES.NO_PERMISSION : 'Only pending requests can be approved';
                const issueBlockedTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : !useModulePartRequest?.edit ? PERMISSION_MESSAGES.NO_PERMISSION : 'Only approved requests can be issued';
                const shortBlockedTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : !useModulePartRequest?.edit ? PERMISSION_MESSAGES.NO_PERMISSION : 'Only approved requests can be marked short';
                const raisePrBlockedTooltip = isPurchaseViewOnly
                  ? PERMISSION_MESSAGES.VIEW_ONLY
                  : !useModuleMaintenancePurchase?.create
                    ? PERMISSION_MESSAGES.NO_PERMISSION
                    : 'Only short requests can raise a purchase request';

                return (
                  <div className="flex items-center justify-start gap-3">
                    <Dropdown
                      placement="bottomRight"
                      trigger={['click']}
                      open={openDropdownKey === rowKey}
                      onOpenChange={flag => setOpenDropdownKey(flag ? rowKey : null)}
                      dropdownRender={() => (
                        <div className="bg-white shadow-lg rounded-lg border border-gray-200 flex flex-col w-56 py-1" role="presentation" onClick={event => event.stopPropagation()}>
                          <div className="px-2 py-1">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">Status Actions :</div>
                          </div>
                          <Tooltip title={canApprove ? 'Approve Part Request' : approveBlockedTooltip} placement="left" getPopupContainer={() => containerRef.current || document.body}>
                            <button
                              type="button"
                              disabled={!canApprove}
                              onClick={event => {
                                event.stopPropagation();
                                if (!canApprove) return;
                                setOpenDropdownKey(null);
                                handleApproveClick(row);
                              }}
                              className={`w-full px-3 py-2 text-left text-sm flex items-center transition-colors duration-150 ${
                                canApprove ? 'text-gray-700 hover:bg-green-50 hover:text-green-800 cursor-pointer' : 'opacity-50 cursor-not-allowed text-gray-400'
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <Icons.CheckCircleOutlined className={canApprove ? 'text-green-800' : 'text-gray-400'} style={{ fontSize: 14 }} />
                                Approve
                              </span>
                            </button>
                          </Tooltip>
                          <Tooltip title={canIssue ? 'Issue Part Request' : issueBlockedTooltip} placement="left" getPopupContainer={() => containerRef.current || document.body}>
                            <button
                              type="button"
                              disabled={!canIssue}
                              onClick={event => {
                                event.stopPropagation();
                                if (!canIssue) return;
                                setOpenDropdownKey(null);
                                handleIssueClick(row);
                              }}
                              className={`w-full px-3 py-2 text-left text-sm flex items-center transition-colors duration-150 ${
                                canIssue ? 'text-gray-700 hover:bg-blue-50 hover:text-blue-800 cursor-pointer' : 'opacity-50 cursor-not-allowed text-gray-400'
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <Icons.DeliveredProcedureOutlined className={canIssue ? 'text-blue-800' : 'text-gray-400'} style={{ fontSize: 14 }} />
                                Issue
                              </span>
                            </button>
                          </Tooltip>
                          <Tooltip title={canShort ? 'Mark Part Request Short' : shortBlockedTooltip} placement="left" getPopupContainer={() => containerRef.current || document.body}>
                            <button
                              type="button"
                              disabled={!canShort}
                              onClick={event => {
                                event.stopPropagation();
                                if (!canShort) return;
                                setOpenDropdownKey(null);
                                handleShortClick(row);
                              }}
                              className={`w-full px-3 py-2 text-left text-sm flex items-center transition-colors duration-150 ${
                                canShort ? 'text-gray-700 hover:bg-amber-50 hover:text-amber-800 cursor-pointer' : 'opacity-50 cursor-not-allowed text-gray-400'
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <Icons.WarningOutlined className={canShort ? 'text-amber-700' : 'text-gray-400'} style={{ fontSize: 14 }} />
                                Short
                              </span>
                            </button>
                          </Tooltip>
                          <Tooltip title={canRaisePr ? 'Raise Purchase Request' : raisePrBlockedTooltip} placement="left" getPopupContainer={() => containerRef.current || document.body}>
                            <button
                              type="button"
                              disabled={!canRaisePr}
                              onClick={event => {
                                event.stopPropagation();
                                if (!canRaisePr) return;
                                setOpenDropdownKey(null);
                                handleRaisePrClick(row);
                              }}
                              className={`w-full px-3 py-2 text-left text-sm flex items-center transition-colors duration-150 ${
                                canRaisePr ? 'text-gray-700 hover:bg-indigo-50 hover:text-indigo-800 cursor-pointer' : 'opacity-50 cursor-not-allowed text-gray-400'
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <Icons.ShoppingCartOutlined className={canRaisePr ? 'text-indigo-700' : 'text-gray-400'} style={{ fontSize: 14 }} />
                                Raise PR
                              </span>
                            </button>
                          </Tooltip>
                        </div>
                      )}
                    >
                      <Tooltip title={canEdit ? 'More Actions' : blockedTooltip} placement="left" getPopupContainer={() => containerRef.current || document.body}>
                        <button type="button" aria-label="More actions" className="inline-flex border-0 bg-transparent p-0 leading-none cursor-pointer" onClick={event => event.stopPropagation()}>
                          <Icons.MoreOutlined style={{ fontSize: 17, color: '#1E3A56' }} />
                        </button>
                      </Tooltip>
                    </Dropdown>
                  </div>
                );
              },
            },
          ]}
          data={partRequests}
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
      <ApprovePartRequestModal open={approveOpen} partRequest={selectedPartRequest} onClose={handleApproveClose} onSuccess={() => fetchPartRequests()} />
      <IssuePartRequestModal open={issueOpen} partRequest={selectedPartRequest} onClose={handleIssueClose} onSuccess={() => fetchPartRequests()} />
      <ShortPartRequestModal open={shortOpen} partRequest={selectedPartRequest} onClose={handleShortClose} onSuccess={() => fetchPartRequests()} />
      <ColumnSelection
        hideTrigger
        columns={columnsList}
        setColumnsList={setColumnsList}
        setCutomizedColumns={setCutomizedColumns}
        configPage={configEnum?.PART_REQUEST_CONFIG}
        modalOpen={showColumnModal}
        setModalOpen={setShowColumnModal}
      />
    </div>
  );
};

export default ViewPartRequest;
