import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

// Components
import ColumnSelection from '@/components/ui/common/ColumnSelection';
import FilterLockButton from '@/components/ui/common/FilterLockButton';
import FilterDrawer, { FilterSection, FilterButton } from '@/components/ui/common/FilterDrawer';
import PageHeader from '@/components/ui/common/PageHeader';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomDatePicker from '@/components/forms/formDatePicker/CustomDatePicker';
import FilterInput from '@/components/forms/formInput/FilterInput';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import PermissionButton from '@/components/ui/button/PermissionButton';
import StatusConfirmPopover from '@/components/feedback/confirmModal/StatusConfirmPopover';
import { Dropdown, Tooltip } from '@/components/AntDComponent';
import { CommonFilterTags } from '@/utils/filtersUtils';
import Toast from '@/components/ui/common/Toast';

// Hooks
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import { useFilters } from '@/utils/filtersUtils';
import { useProductionOrder } from '@/features/production/productionOrder';
import { useItemGroup } from '@/features/allMaster/itemGroup';
import { useSubItemGroup } from '@/features/allMaster/subItemGroup';
import useModulePermissions from 'hooks/useModulePermissions';
import useDocumentListToolbar from '@/hooks/useDocumentListToolbar';

// Extras
import { submitProductionColumns, PRODUCTION_MODULE_METHOD } from '@/features/production/productionOrder';
import { getAllFiltersFromLocalStorage } from '@/utils/filters';
import { FILTERS_KEYS, RESOURCES } from '@/utils/jsonFile';
import Icons from 'assets/icons/icon';
import {
  configEnum,
  filterInputEnum,
  PRODUCTION_ACTIVE_STATUSES,
  PRODUCTION_MODULE_BACKEND_STATUS,
  PRODUCTION_MODULE_STATUS,
  PRODUCTION_MODULE_METHOD_LABEL,
  MARK_AS_CLOSE_ALLOWED_STATUSES,
  PERMISSION_MESSAGES,
} from 'utils/constants';
import { colorPalette } from '@/utils/theme';
import { getFromLocalStorage, getQueryParams, parsedTableCoulmns } from 'utils/services';
import { PAGE_HEADERS } from '@/utils/label';
import { buildDivisionSelectOptions, buildBranchSelectOptions, divisionSelectColumnHeader, branchSelectColumnHeader } from '@/utils/tableSelectDropdown/orgSelectDropdown';
import { buildItemGroupSelectOptions, itemGroupSelectColumnHeader } from '@/utils/tableSelectDropdown/itemGroupSelectDropdown';
import { buildSubItemGroupSelectOptions, subItemGroupSelectColumnHeader } from '@/utils/tableSelectDropdown/subItemGroupSelectDropdown';

const API_CALLED_ENUM = {
  DIVISION_DROPDOWN: 'divisionDropdown',
  ITEM_GROUP_DROPDOWN: 'itemGroupDropdown',
  SUB_ITEM_GROUP_DROPDOWN: 'subItemGroupDropdown',
};

const ViewSubmitProductions = () => {
  const navigate = useNavigate();
  const { productionOrder, productionOrderOtherDetails, pagination, loading, getProductionOrder, resetProductionOrder, updateProductionOrderStatus, reRaiseTransferRequest } = useProductionOrder();
  const { divDrop, divisionLoading, getDivDropDown, branchDrop, branchLoading, getBranchDropDown, useAddProduction, isViewOnly } = useModulePermissions(RESOURCES.ADD_PRODUCTION);
  const { useModuleRejectionAnalytics } = useModulePermissions(RESOURCES.ANALYTICS_PERMISSIONS.REJECTION_ANALYTICS);
  const { useModuleItemRejectionAnalytics } = useModulePermissions(RESOURCES.ANALYTICS_PERMISSIONS.ITEM_REJECTION_ANALYTICS);
  const { useModuleItemProcessAnalytics } = useModulePermissions(RESOURCES.ANALYTICS_PERMISSIONS.ITEM_PROCESS_ANALYTICS);
  const { useModuleMonthlyProductionReport } = useModulePermissions(RESOURCES.ANALYTICS_PERMISSIONS.MONTHLY_PRODUCTION_REPORT);
  const canView = useAddProduction?.view;
  const canAdd = useAddProduction?.create && !isViewOnly;
  const canOpenMore = useAddProduction?.edit && !isViewOnly;
  const blockedTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : PERMISSION_MESSAGES.NO_PERMISSION;
  const { itemGroupDrop, itemGroupDropLoading, getItemGroupDropdown } = useItemGroup();
  const { subItemGroupDrop, subItemGroupDropLoading, getSubItemGroupDropdown } = useSubItemGroup();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilter, setShowFilter] = useState(false);
  const [openDropdownKey, setOpenDropdownKey] = useState(null);
  const FILTER_KEY = FILTERS_KEYS.SUBMIT_PRODUCTION_ALL_FILTER;
  const isApiCalledRef = useRef(false);
  const isApicalledRefFilter = useRef({
    divisionDropdown: false,
    itemGroupDropdown: false,
    subItemGroupDropdown: false,
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
    handleLockToggle,
    getActiveFiltersCount,
  } = useFilters({
    searchParams,
    setSearchParams,
    pagination,
    FILTER_KEY,
    setShowFilter,
    defaultFilter: {
      search: '',
      status: '',
      division: '',
      branch: '',
      productionManageMethod: '',
      itemGroupId: '',
      subItemGroupId: '',
    },
    dateKeys: { startDate: 'startDate', endDate: 'endDate', singleDate: 'productionDate' },
  });

  useEffect(() => {
    const savedFilters = getAllFiltersFromLocalStorage(FILTER_KEY);

    if (!isApiCalledRef.current && !searchParams.get('page') && !searchParams.get('limit')) {
      if (savedFilters && Object.keys(savedFilters).length > 0) {
        if (savedFilters.preset) {
          setSelectedPreset(savedFilters.preset);
        }
        if (savedFilters.startDate && savedFilters.endDate) {
          setDateRange([savedFilters.startDate, savedFilters.endDate]);
        } else if (savedFilters.productionDate) {
          setDateRange([savedFilters.productionDate, savedFilters.productionDate]);
        }

        setFilter(prev => ({
          ...prev,
          search: savedFilters.search ?? prev.search,
          status: savedFilters.status ? savedFilters?.status?.split(',') : prev.status,
          division: savedFilters.division ?? prev.division,
          branch: savedFilters.branch ? savedFilters?.branch?.split(',') : prev.branch,
          productionManageMethod: savedFilters.productionManageMethod ?? prev.productionManageMethod,
          itemGroupId: savedFilters.itemGroupId ? savedFilters?.itemGroupId?.split(',') : prev.itemGroupId,
          subItemGroupId: savedFilters.subItemGroupId ? savedFilters?.subItemGroupId?.split(',') : prev.subItemGroupId,
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
    fetchSubmitProductionOrder(controller.signal);
    return () => controller.abort();
  }, [searchParams]);

  useResetOnUnmount(resetProductionOrder);

  useEffect(() => {
    if (searchParams.get('itemGroupId')) {
      handleOnFocusApiCall(API_CALLED_ENUM.ITEM_GROUP_DROPDOWN);
    }
    if (searchParams.get('subItemGroupId')) {
      handleOnFocusApiCall(API_CALLED_ENUM.SUB_ITEM_GROUP_DROPDOWN);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const urlParams = getQueryParams(window.location.href) || {};
    const hasUrlFilter = ['search', 'status', 'division', 'branch', 'productionManageMethod', 'itemGroupId', 'subItemGroupId'].some(key => urlParams[key]);
    if (!hasUrlFilter) return;
    setFilter(prev => ({
      ...prev,
      search: urlParams.search ?? prev.search,
      status: urlParams.status ? urlParams.status.split(',') : prev.status,
      division: urlParams.division ?? prev.division,
      branch: urlParams.branch ? urlParams.branch.split(',') : prev.branch,
      productionManageMethod: urlParams.productionManageMethod ?? prev.productionManageMethod,
      itemGroupId: urlParams.itemGroupId ? urlParams.itemGroupId.split(',') : prev.itemGroupId,
      subItemGroupId: urlParams.subItemGroupId ? urlParams.subItemGroupId.split(',') : prev.subItemGroupId,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    if (filter?.division) {
      const payload = { divisionId: filter?.division, signal: controller.signal };
      getBranchDropDown(payload);
    }
    return () => controller.abort();
  }, [filter?.division]);

  const handleOnFocusApiCall = async type => {
    let obj = { ...isApicalledRefFilter.current };

    if (type === API_CALLED_ENUM.DIVISION_DROPDOWN) {
      await getDivDropDown({});
      obj.divisionDropdown = true;
    }

    if (type === API_CALLED_ENUM.ITEM_GROUP_DROPDOWN) {
      await getItemGroupDropdown({});
      obj.itemGroupDropdown = true;
    }

    if (type === API_CALLED_ENUM.SUB_ITEM_GROUP_DROPDOWN) {
      await getSubItemGroupDropdown({});
      obj.subItemGroupDropdown = true;
    }

    isApicalledRefFilter.current = obj;
  };

  useEffect(() => {
    if (searchParams.get('division')) {
      handleOnFocusApiCall(API_CALLED_ENUM.DIVISION_DROPDOWN);
    }
  }, [filter?.division]);

  const handleViewClick = (record, navState) => {
    navigate(`/production-orders/${record.id || record._id}?method=${record.productionManageMethod}`, navState ? { state: navState } : undefined);
  };

  const handleHold = async record => {
    if (!canOpenMore) return;
    try {
      await updateProductionOrderStatus({
        productionOrderId: record.id || record._id,
        status: PRODUCTION_MODULE_BACKEND_STATUS.ON_HOLD,
      });
      setOpenDropdownKey(null);
      fetchSubmitProductionOrder();
    } catch (error) {
      Toast.error(error.message || 'Failed to update production order status.');
    }
  };

  const handleUnHold = async record => {
    if (!canOpenMore) return;
    try {
      await updateProductionOrderStatus({
        productionOrderId: record.id || record._id,
        status: PRODUCTION_MODULE_BACKEND_STATUS.UNHOLD,
      });
      setOpenDropdownKey(null);
      fetchSubmitProductionOrder();
    } catch (error) {
      Toast.error(error.message || 'Failed to update production order status.');
    }
  };

  const handleStopAndComplete = async record => {
    if (!canOpenMore) return;
    try {
      await updateProductionOrderStatus({
        productionOrderId: record.id || record._id,
        status: PRODUCTION_MODULE_BACKEND_STATUS.COMPLETED,
        isManuallyCompleted: true,
      });
      setOpenDropdownKey(null);
      fetchSubmitProductionOrder();
    } catch (error) {
      Toast.error(error.message || 'Failed to update production order status.');
    }
  };

  const handleRevertManualCompletion = async record => {
    if (!canOpenMore) return;
    try {
      await updateProductionOrderStatus({
        productionOrderId: record.id || record._id,
        status: PRODUCTION_MODULE_BACKEND_STATUS.REVERT_MANUAL_COMPLETION,
      });
      setOpenDropdownKey(null);
      fetchSubmitProductionOrder();
    } catch (error) {
      Toast.error(error.message || 'Failed to update production order status.');
    }
  };

  const handleMarkAsClose = async record => {
    if (!canOpenMore) return;
    try {
      await updateProductionOrderStatus({
        productionOrderId: record.id || record._id,
        status: PRODUCTION_MODULE_BACKEND_STATUS.CLOSED,
      });
      setOpenDropdownKey(null);
      fetchSubmitProductionOrder();
    } catch (error) {
      Toast.error(error.message || 'Failed to update production order status.');
    }
  };

  const handleReRaiseTransfer = async record => {
    if (!canOpenMore) return;
    try {
      await reRaiseTransferRequest({ productionOrderId: record.id || record._id });
      setOpenDropdownKey(null);
      fetchSubmitProductionOrder();
    } catch (error) {
      Toast.error(error.message || 'Failed to re-raise transfer request.');
    }
  };

  const fetchSubmitProductionOrder = signal => {
    const page = parseInt(searchParams?.get('page')) || 1;
    const pageSize = parseInt(searchParams?.get('limit')) || pagination.limit;

    const payload = getQueryParams(window.location.href) || {};

    getProductionOrder({ ...payload, page, limit: pageSize, signal });
  };

  const handlePaginationChange = (page, pageSize) => {
    updateUrlParams({ page, limit: pageSize });
  };

  const columns = submitProductionColumns();

  let columnsFromLocalStorage = getFromLocalStorage(configEnum?.PRODUCTION_MODULE_CONFIG);
  let parsedColumnData = parsedTableCoulmns(columnsFromLocalStorage, columns);

  let displayColumn = parsedColumnData?.displayColumn?.filter(x => x?.visible === true);
  const [columnsList, setColumnsList] = useState(parsedColumnData?.displayColumn);
  const [customizedColumns, setCutomizedColumns] = useState([...(parsedColumnData?.customizedColumn?.length > 0 ? parsedColumnData.customizedColumn : displayColumn)]);

  const containerRef = useRef(null);

  const { showColumnModal, setShowColumnModal, standardDropdownItems } = useDocumentListToolbar({
    filterKey: FILTER_KEY,
    columnConfigKey: configEnum?.PRODUCTION_MODULE_CONFIG,
    showPreferences: false,
    columnsConfig: {
      getDefaultColumns: submitProductionColumns,
      setColumnsList,
      setCustomizedColumns: setCutomizedColumns,
    },
    handleResetFilters,
    onRefresh: () => fetchSubmitProductionOrder(),
  });

  const dropdownItems = [
    ...standardDropdownItems,
    {
      type: 'divider',
    },
    {
      type: 'group',
      label: 'ANALYTICS',
      children: (() => {
        const NO_PERMISSION_MSG = "You don't have permission for this operation. Please check with your system admin.";
        const canViewRejectionAnalytics = !!useModuleRejectionAnalytics?.canView;
        const canViewItemRejectionAnalytics = !!useModuleItemRejectionAnalytics?.canView;
        const canViewItemProcessAnalytics = !!useModuleItemProcessAnalytics?.canView;
        const canViewMonthlyProductionReport = !!useModuleMonthlyProductionReport?.canView;
        return [
          {
            key: 'rejectionAnalytics',
            icon: <Icons.BarChartOutlined className={canViewRejectionAnalytics ? '' : 'text-gray-400'} />,
            label: (
              <Tooltip title={canViewRejectionAnalytics ? '' : NO_PERMISSION_MSG} placement="left">
                <span className={canViewRejectionAnalytics ? '' : 'text-gray-400'}>Rejection Analytics</span>
              </Tooltip>
            ),
            disabled: !canViewRejectionAnalytics,
            onClick: ({ domEvent }) => {
              domEvent.stopPropagation();
              if (!canViewRejectionAnalytics) return;
              navigate('/analytics/production/rejection');
            },
          },
          {
            key: 'itemRejectionAnalytics',
            icon: <Icons.RiseOutlined className={canViewItemRejectionAnalytics ? '' : 'text-gray-400'} />,
            label: (
              <Tooltip title={canViewItemRejectionAnalytics ? '' : NO_PERMISSION_MSG} placement="left">
                <span className={canViewItemRejectionAnalytics ? '' : 'text-gray-400'}>Item Rejection Analytics</span>
              </Tooltip>
            ),
            disabled: !canViewItemRejectionAnalytics,
            onClick: ({ domEvent }) => {
              domEvent.stopPropagation();
              if (!canViewItemRejectionAnalytics) return;
              navigate('/analytics/production/item-rejection');
            },
          },
          {
            key: 'itemProcessAnalytics',
            icon: <Icons.SwapOutlined className={canViewItemProcessAnalytics ? '' : 'text-gray-400'} />,
            label: (
              <Tooltip title={canViewItemProcessAnalytics ? '' : NO_PERMISSION_MSG} placement="left">
                <span className={canViewItemProcessAnalytics ? '' : 'text-gray-400'}>Item Process Analytics</span>
              </Tooltip>
            ),
            disabled: !canViewItemProcessAnalytics,
            onClick: ({ domEvent }) => {
              domEvent.stopPropagation();
              if (!canViewItemProcessAnalytics) return;
              navigate('/analytics/production/item-process');
            },
          },
          {
            key: 'monthlyProductionReport',
            icon: <Icons.InboxOutlined className={canViewMonthlyProductionReport ? '' : 'text-gray-400'} />,
            label: (
              <Tooltip title={canViewMonthlyProductionReport ? '' : NO_PERMISSION_MSG} placement="left">
                <span className={canViewMonthlyProductionReport ? '' : 'text-gray-400'}>Monthly Production Report</span>
              </Tooltip>
            ),
            disabled: !canViewMonthlyProductionReport,
            onClick: ({ domEvent }) => {
              domEvent.stopPropagation();
              if (!canViewMonthlyProductionReport) return;
              navigate('/analytics/production/monthly-report');
            },
          },
        ];
      })(),
    },
  ];

  return (
    <div ref={containerRef} className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden -m-4">
      <div className="bg-white px-4 py-2.5 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <PageHeader
            title={`${PAGE_HEADERS?.PRODUCTION_ORDERS?.title} (${pagination?.totalResults || 0})`}
            rightStats={[
              { label: 'Total Orders', value: productionOrderOtherDetails?.totalOrders ?? 0 },
              { label: 'Pending', value: productionOrderOtherDetails?.pending ?? 0 },
              { label: 'In Progress', value: productionOrderOtherDetails?.inProgress ?? 0 },
              { label: 'Partially Done', value: productionOrderOtherDetails?.partiallyDone ?? 0 },
              { label: 'Completed', value: productionOrderOtherDetails?.completed ?? 0, colorClass: 'text-green-600' },
              { label: 'Waiting for Approval', value: productionOrderOtherDetails?.waitingForInventoryApproval ?? 0 },
              { label: 'On Hold', value: productionOrderOtherDetails?.onHold ?? 0 },
              { label: 'Closed', value: productionOrderOtherDetails?.closed ?? 0 },
            ]}
          />
        </div>
        <PermissionButton
          canAccess={canAdd}
          isViewOnly={isViewOnly}
          type="primary"
          className="py-4 px-5"
          wrapperClassName="inline-block"
          onClick={canAdd ? () => navigate('/production-orders/new') : undefined}
          icon={<Icons.PlusCircleOutlined />}
          text="Add"
        />
        <Tooltip title="More Actions" placement="left" getPopupContainer={() => containerRef.current || document.body}>
          <Dropdown menu={{ items: dropdownItems, className: 'app-toolbar-dropdown' }} trigger={['click']} getPopupContainer={() => containerRef.current || document.body}>
            <CustomButton type="default" icon={<Icons.EllipsisOutlined />} />
          </Dropdown>
        </Tooltip>
      </div>
      <div className="bg-white border-t px-4 py-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <FilterInput type={filterInputEnum?.SEARCH} name={'search'} placeHolder="Search..." value={filter?.search} setFilter={setFilter} onSerch={handleSearch} onClear={handleClear} />
          <ColumnSelection
            columns={columnsList}
            setColumnsList={setColumnsList}
            setCutomizedColumns={setCutomizedColumns}
            configPage={configEnum?.PRODUCTION_MODULE_CONFIG}
            modalOpen={showColumnModal}
            setModalOpen={setShowColumnModal}
          />
          <div className="flex-grow" />
          <div className="flex gap-2">
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
              <CustomDatePicker selectedPreset={selectedPreset} setSelectedPreset={setSelectedPreset} dateRange={dateRange} setDateRange={setDateRange} />
            </div>
          </FilterSection>

          <FilterSection title="What">
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                mode="multiple"
                name={'status'}
                label={'Status'}
                placeHolder={'Select Status'}
                selectionOptions={Object?.entries(PRODUCTION_MODULE_STATUS)?.map(([key, value]) => {
                  return { value: key, label: value };
                })}
                value={filter?.status}
                setFilter={setFilter}
                allowClear={true}
              />
            </div>
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                mode="single"
                name={'productionManageMethod'}
                label={'Production Method'}
                placeHolder={'Select Method'}
                selectionOptions={Object?.entries(PRODUCTION_MODULE_METHOD)?.map(([key, value]) => {
                  return { value: key, label: PRODUCTION_MODULE_METHOD_LABEL[value] };
                })}
                value={filter?.productionManageMethod}
                setFilter={setFilter}
                allowClear={true}
              />
            </div>
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                mode="multiple"
                name={'itemGroupId'}
                label={'Item Group'}
                placeHolder={'Select Item Group'}
                selectVariant="twoColumn"
                columnSelectHeader={itemGroupSelectColumnHeader}
                selectionOptions={buildItemGroupSelectOptions(itemGroupDrop)}
                value={filter?.itemGroupId}
                setFilter={setFilter}
                allowClear={true}
                loading={itemGroupDropLoading}
                onFocus={() => {
                  if (!isApicalledRefFilter.current.itemGroupDropdown) {
                    handleOnFocusApiCall(API_CALLED_ENUM.ITEM_GROUP_DROPDOWN);
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                mode="multiple"
                name={'subItemGroupId'}
                label={'Sub Item Group'}
                placeHolder={'Select Sub Item Group'}
                selectVariant="twoColumn"
                columnSelectHeader={subItemGroupSelectColumnHeader}
                selectionOptions={buildSubItemGroupSelectOptions(subItemGroupDrop)}
                value={filter?.subItemGroupId}
                setFilter={setFilter}
                allowClear={true}
                loading={subItemGroupDropLoading}
                onFocus={() => {
                  if (!isApicalledRefFilter.current.subItemGroupDropdown) {
                    handleOnFocusApiCall(API_CALLED_ENUM.SUB_ITEM_GROUP_DROPDOWN);
                  }
                }}
              />
            </div>
          </FilterSection>

          <FilterSection title="Where">
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name={'division'}
                label={'Division'}
                placeHolder={'Select Division'}
                selectVariant="twoColumn"
                columnSelectHeader={divisionSelectColumnHeader}
                selectionOptions={buildDivisionSelectOptions(divDrop)}
                value={filter?.division}
                setFilter={setFilter}
                allowClear={true}
                extraFilterValues={{ branch: '' }}
                loading={divisionLoading}
                onFocus={() => {
                  if (!isApicalledRefFilter.current.divisionDropdown) {
                    handleOnFocusApiCall(API_CALLED_ENUM.DIVISION_DROPDOWN);
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                mode="multiple"
                name={'branch'}
                label={'Branch'}
                placeHolder={'Select Branch'}
                selectVariant="twoColumn"
                columnSelectHeader={branchSelectColumnHeader}
                selectionOptions={buildBranchSelectOptions(branchDrop)}
                value={filter?.branch}
                setFilter={setFilter}
                allowClear={true}
                disabled={!filter?.division}
                loading={branchLoading}
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
            startDateKey: 'startDate',
            endDateKey: 'endDate',
            singleDateKey: 'productionDate',
          }}
          onDateClear={() => {
            setSelectedPreset('custom');
            setDateRange(null);
            updateUrlParams({ startDate: null, endDate: null, productionDate: null, preset: null });
          }}
          STATUS_ENUM={PRODUCTION_MODULE_STATUS}
          divDrop={divDrop}
          branchDrop={branchDrop}
          extraFilters={{
            productionManageMethod: {
              label: 'Production Method',
              format: value => PRODUCTION_MODULE_METHOD_LABEL[value],
              clear: (setFilter, updateUrlParams) => {
                setFilter(prev => ({ ...prev, productionManageMethod: null }));
                updateUrlParams({ productionManageMethod: null });
              },
            },
            itemGroupId: {
              label: 'Item Group',
              format: value =>
                String(value)
                  .split(',')
                  .map(id => (itemGroupDrop || []).find(group => group.id === id)?.name || id)
                  .join(', '),
              clear: (setFilter, updateUrlParams) => {
                setFilter(prev => ({ ...prev, itemGroupId: null }));
                updateUrlParams({ itemGroupId: null });
              },
            },
            subItemGroupId: {
              label: 'Sub Item Group',
              format: value =>
                String(value)
                  .split(',')
                  .map(id => (subItemGroupDrop || []).find(group => group.id === id)?.name || id)
                  .join(', '),
              clear: (setFilter, updateUrlParams) => {
                setFilter(prev => ({ ...prev, subItemGroupId: null }));
                updateUrlParams({ subItemGroupId: null });
              },
            },
          }}
        />
      </div>

      <div>
        <CustomTable
          columns={[...customizedColumns]}
          data={productionOrder}
          loading={loading}
          onRowClick={handleViewClick}
          tableId="id"
          pagination={{
            current: searchParams?.get('page') || 1,
            pageSize: searchParams?.get('limit') || DEFAULT_PAGE_SIZE,
            total: pagination.totalResults,
            onChange: handlePaginationChange,
          }}
          columnActions={() => ({
            title: 'Action',
            key: 'action',
            fixed: 'right',
            width: 140,
            visible: true,
            render: (_, record) => {
              const canSubmitStatus = PRODUCTION_ACTIVE_STATUSES.includes(record?.status);
              const canSubmit = useAddProduction?.create && !isViewOnly && canSubmitStatus;
              const canMarkAsClose = MARK_AS_CLOSE_ALLOWED_STATUSES.includes(record?.status);
              const canReRaise = record?.status === 'INVENTORY_REJECTED';
              const recordKey = record.id || record._id;
              const statusLabel = PRODUCTION_MODULE_STATUS[record?.status] || record?.status || '-';
              const submitLabel = record.productionManageMethod === PRODUCTION_MODULE_METHOD.PROCESS_ROUTE ? 'Submit Current Process' : 'Submit Production Order';
              const submitTooltip = isViewOnly
                ? PERMISSION_MESSAGES.VIEW_ONLY
                : !useAddProduction?.create
                  ? PERMISSION_MESSAGES.NO_PERMISSION
                  : !canSubmitStatus
                    ? `Submission is not allowed for a ${statusLabel} production order`
                    : submitLabel;

              return (
                <div className="flex items-center gap-3">
                  <Tooltip title={canView ? 'View Details' : PERMISSION_MESSAGES.NO_PERMISSION}>
                    <Icons.EyeOutlined
                      className={canView ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                      style={{ fontSize: 17, color: '#1E3A56' }}
                      onClick={event => {
                        if (!canView) return;
                        event.stopPropagation();
                        handleViewClick(record);
                      }}
                    />
                  </Tooltip>

                  <Tooltip title={submitTooltip}>
                    <Icons.ArrowLeftOutlined
                      className={canSubmit ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                      style={{ fontSize: 17, color: colorPalette.primary[500], cursor: canSubmit ? 'pointer' : 'not-allowed' }}
                      onClick={event => {
                        event.stopPropagation();
                        if (!canSubmit) return;
                        handleViewClick(record, { openSubmit: true });
                      }}
                    />
                  </Tooltip>

                  <Dropdown
                    placement="bottomRight"
                    trigger={['click']}
                    disabled={!canOpenMore}
                    open={canOpenMore && openDropdownKey === recordKey}
                    onOpenChange={flag => {
                      if (!canOpenMore) return;
                      setOpenDropdownKey(flag ? recordKey : null);
                    }}
                    dropdownRender={() => (
                      <div className="bg-white shadow-lg rounded-lg border border-gray-200 flex flex-col w-56 py-1">
                        <div className="px-2 py-1">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">Status Actions :</div>
                        </div>

                        {record?.status === PRODUCTION_MODULE_BACKEND_STATUS.CLOSED ? (
                          <StatusConfirmPopover
                            key="reopenClosed"
                            onConfirm={() => handleUnHold(record)}
                            onCloseDropdown={() => setOpenDropdownKey(null)}
                            label="Reopen"
                            icon={<Icons.UndoOutlined style={{ fontSize: 14, color: colorPalette.primary[500] }} />}
                            placement="left"
                            variant="primary"
                            confirmMessage={
                              <>
                                Are you sure you want to <span style={{ fontWeight: 600, color: colorPalette.primary[600] }}>reopen</span> this production order?
                              </>
                            }
                            isActive={false}
                          />
                        ) : record?.status === PRODUCTION_MODULE_BACKEND_STATUS.ON_HOLD ? (
                          <StatusConfirmPopover
                            key="unHold"
                            onConfirm={() => handleUnHold(record)}
                            onCloseDropdown={() => setOpenDropdownKey(null)}
                            label="Un-Hold"
                            icon={<Icons.PlayCircleOutlined style={{ fontSize: 14, color: colorPalette.primary[500] }} />}
                            placement="left"
                            variant="primary"
                            confirmMessage={
                              <>
                                Are you sure you want to <span style={{ fontWeight: 600, color: colorPalette.primary[600] }}>un-hold</span> this production order?
                              </>
                            }
                            isActive={false}
                          />
                        ) : canSubmit ? (
                          <StatusConfirmPopover
                            key="hold"
                            onConfirm={() => handleHold(record)}
                            onCloseDropdown={() => setOpenDropdownKey(null)}
                            label="Hold"
                            icon={<Icons.PauseOutlined style={{ fontSize: 14, color: colorPalette.primary[500] }} />}
                            placement="left"
                            variant="primary"
                            confirmMessage={
                              <>
                                Are you sure you want to mark this production order as <span style={{ fontWeight: 600, color: colorPalette.primary[600] }}>on hold</span>?
                              </>
                            }
                            isActive={false}
                          />
                        ) : (
                          <Tooltip title={`Cannot hold in current status - ${statusLabel}.`} placement="left">
                            <button type="button" disabled className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 opacity-50 cursor-not-allowed text-gray-400">
                              <Icons.PauseOutlined className="text-gray-400" style={{ fontSize: 14 }} />
                              Hold
                            </button>
                          </Tooltip>
                        )}

                        {canSubmit ? (
                          <StatusConfirmPopover
                            key="stopAndComplete"
                            onConfirm={() => handleStopAndComplete(record)}
                            onCloseDropdown={() => setOpenDropdownKey(null)}
                            label="Stop & Complete"
                            icon={<Icons.CheckCircleOutlined style={{ fontSize: 14, color: colorPalette.error[600] }} />}
                            placement="left"
                            variant="danger"
                            confirmMessage={
                              <>
                                Are you sure you want to mark this production order as <span style={{ fontWeight: 600, color: colorPalette.error[600] }}>completed</span>?
                              </>
                            }
                            isActive={true}
                          />
                        ) : record?.status === PRODUCTION_MODULE_BACKEND_STATUS.COMPLETED && record?.isManuallyCompleted ? (
                          <StatusConfirmPopover
                            key="reopen"
                            onConfirm={() => handleRevertManualCompletion(record)}
                            onCloseDropdown={() => setOpenDropdownKey(null)}
                            label="Reopen"
                            icon={<Icons.UndoOutlined style={{ fontSize: 14, color: colorPalette.primary[500] }} />}
                            placement="left"
                            variant="primary"
                            confirmMessage={
                              <>
                                Are you sure you want to <span style={{ fontWeight: 600, color: colorPalette.primary[600] }}>reopen</span> this production order?
                              </>
                            }
                            isActive={false}
                          />
                        ) : (
                          <Tooltip title={`Cannot stop & complete in current status - ${statusLabel}.`} placement="left">
                            <button type="button" disabled className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 opacity-50 cursor-not-allowed text-gray-400">
                              <Icons.CheckCircleOutlined className="text-gray-400" style={{ fontSize: 14 }} />
                              Stop & Complete
                            </button>
                          </Tooltip>
                        )}

                        {canMarkAsClose ? (
                          <StatusConfirmPopover
                            key="markAsClose"
                            onConfirm={() => handleMarkAsClose(record)}
                            onCloseDropdown={() => setOpenDropdownKey(null)}
                            label="Mark as Close"
                            icon={<Icons.CloseCircleOutlined style={{ fontSize: 14, color: colorPalette.error[600] }} />}
                            placement="left"
                            type="danger"
                            confirmMessage={
                              <>
                                Are you sure you want to mark this production order as <span style={{ fontWeight: 600, color: colorPalette.error[600] }}>closed</span>?
                                {record?.status === PRODUCTION_MODULE_BACKEND_STATUS.WAITING_FOR_INVENTORY_APPROVAL && (
                                  <div className="mt-2">Its pending inventory transfer request will be rejected. If you reopen this order, a new request is raised automatically.</div>
                                )}
                              </>
                            }
                            isActive={true}
                          />
                        ) : (
                          <Tooltip title={`Cannot mark as close in current status - ${statusLabel}.`} placement="left">
                            <button type="button" disabled className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 opacity-50 cursor-not-allowed text-gray-400 rounded-b">
                              <Icons.CloseCircleOutlined className="text-gray-400" style={{ fontSize: 14 }} />
                              Mark as Close
                            </button>
                          </Tooltip>
                        )}

                        {canReRaise && (
                          <StatusConfirmPopover
                            key="reRaiseTransfer"
                            onConfirm={() => handleReRaiseTransfer(record)}
                            onCloseDropdown={() => setOpenDropdownKey(null)}
                            label="Re-raise Transfer Request"
                            icon={<Icons.ReloadOutlined style={{ fontSize: 14, color: colorPalette.primary[500] }} />}
                            placement="left"
                            type="primary"
                            contentWidth={320}
                            confirmMessage={
                              <>
                                Re-raise the inventory transfer request for this production order? It will revert to{' '}
                                <span style={{ fontWeight: 600, color: colorPalette.primary[600] }}>{PRODUCTION_MODULE_STATUS.WAITING_FOR_INVENTORY_APPROVAL || 'Waiting for Inventory Approval'}</span>
                                .
                              </>
                            }
                            isActive={false}
                          />
                        )}
                      </div>
                    )}
                  >
                    <Tooltip title={canOpenMore ? 'More Actions' : blockedTooltip} placement="left">
                      <span className={canOpenMore ? 'inline-flex cursor-pointer' : 'inline-flex opacity-40 cursor-not-allowed'} style={{ cursor: canOpenMore ? 'pointer' : 'not-allowed' }}>
                        <Icons.MoreOutlined style={{ fontSize: 17, color: canOpenMore ? '#1E3A56' : colorPalette.neutral[400], cursor: 'inherit' }} />
                      </span>
                    </Tooltip>
                  </Dropdown>
                </div>
              );
            },
          })}
        />
      </div>
    </div>
  );
};

export default ViewSubmitProductions;
