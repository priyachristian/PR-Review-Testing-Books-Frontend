import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

// Components
import ColumnSelection from '@/components/ui/common/ColumnSelection';
import FilterLockButton from '@/components/ui/common/FilterLockButton';
import FilterDrawer, { FilterSection, FilterButton } from '@/components/ui/common/FilterDrawer';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import FilterInput from '@/components/forms/formInput/FilterInput';
import { Button, Dropdown } from '@/components/AntDComponent';
import { CommonFilterTags } from '@/utils/filtersUtils';

// Hooks
import useModulePermissions from '@/hooks/useModulePermissions';
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import { useFilters } from '@/utils/filtersUtils';

// Extras
import { useInventoryAdjustment, inventoryAdjustmentColumn } from '@/features/inventory/inventoryAdjustment';
import Icons from '@/assets/icons/icon';
import { FILTERS_KEYS, RESOURCES } from '@/utils/jsonFile';
import { configEnum, filterInputEnum } from '@/utils/constants';
import { getAllFiltersFromLocalStorage } from '@/utils/filters';
import { getFromLocalStorage, getQueryParams, parsedTableCoulmns } from '@/utils/services';
import { PAGE_HEADERS } from '@/utils/label';
import PermissionButton from '@/components/ui/button/PermissionButton';
import useDocumentListToolbar from '@/hooks/useDocumentListToolbar';
import useColumnResize from '@/hooks/useColumnResize';
import {
  buildDivisionSelectOptions,
  buildBranchSelectOptions,
  buildWarehouseSelectOptions,
  divisionSelectColumnHeader,
  branchSelectColumnHeader,
  warehouseSelectColumnHeader,
} from '@/utils/tableSelectDropdown/orgSelectDropdown';

const STATUS_ENUM = {
  DRAFT: 'Draft',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

const API_CALLED_ENUM = {
  DIVISION_DROPDOWN: 'divisionDropdown',
  WAREHOUSE_DROPDOWN: 'warehouseDropdown',
};

const ViewInventoryAdjustment = () => {
  const { inventoryAdjustment, loading, getInventoryAdjustment, pagination, approveInventoryAdjustment, rejectInventoryAdjustment, resetInventoryAdjustment } = useInventoryAdjustment();
  const { useInventoryAdjustmentPermission, isViewOnly, divDrop, divisionLoading, getDivDropDown, branchDrop, branchLoading, getBranchDropDown, warehouseDrop, warehouseLoading, getWarehouseDrop } =
    useModulePermissions(RESOURCES.INVENTORY_ADJUSTMENT);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilter, setShowFilter] = useState(false);
  const FILTER_KEY = FILTERS_KEYS.VIEW_INVENTORY_ADJUSTMENT_ALL_FILTER;
  const isApiCalledRef = useRef(false);
  const isApicalledRefFilter = useRef({
    divisionDropdown: false,
    warehouseDropdown: false,
  });
  const { filter, setFilter, isLocked, updateUrlParams, handleFilter, handleSearch, handleClear, handleResetFilters, areSavedFiltersApplied, getActiveFiltersCount, handleLockToggle } = useFilters({
    searchParams,
    setSearchParams,
    pagination: pagination,
    FILTER_KEY,
    setShowFilter,
    defaultFilter: {
      search: searchParams.get('search') || '',
      status: searchParams.get('status') || '',
      division: searchParams.get('division') || '',
      branch: searchParams.get('branch') ? searchParams.get('branch').split(',') : '',
      warehouse: searchParams.get('warehouse') ? searchParams.get('warehouse').split(',') : '',
    },
  });

  const handlePaginationChange = (page, pageSize) => {
    updateUrlParams({ page, limit: pageSize });
  };

  const fetchInventoryAdjustmentData = signal => {
    const page = parseInt(searchParams?.get('page')) || 1;
    const pageSize = parseInt(searchParams?.get('limit')) || pagination.limit;

    const payload = getQueryParams(window.location.href) || {};

    getInventoryAdjustment({
      ...payload,
      page,
      limit: pageSize,
      signal,
    });
  };

  const handleApproveClick = async record => {
    await approveInventoryAdjustment({ inventoryId: record?._id });
    fetchInventoryAdjustmentData();
  };

  const handleRejectClick = async record => {
    await rejectInventoryAdjustment({ inventoryId: record?._id });
    fetchInventoryAdjustmentData();
  };

  const handleEditClick = record => {
    navigate(`/inventory-adjustment/${record?._id}/edit`, {
      state: {
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleViewClick = record => {
    navigate(`/inventory-adjustment/${record?._id}`, {
      state: {
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  useEffect(() => {
    const savedFilters = getAllFiltersFromLocalStorage(FILTER_KEY);

    if (!isApiCalledRef.current && !searchParams.get('page') && !searchParams.get('limit')) {
      if (savedFilters && Object.keys(savedFilters).length > 0) {
        setFilter(prev => ({
          ...prev,
          search: savedFilters.search ?? prev.search,
          status: savedFilters.status ? savedFilters?.status?.split(',') : prev.status,
          division: savedFilters.division ?? prev.division,
          branch: savedFilters.branch ? savedFilters?.branch?.split(',') : prev.branch,
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
    fetchInventoryAdjustmentData(controller.signal);
    return () => controller.abort();
  }, [searchParams]);

  useResetOnUnmount(resetInventoryAdjustment);

  const handleOnFocusApiCall = async type => {
    let obj = { ...isApicalledRefFilter.current };

    if (type === API_CALLED_ENUM.DIVISION_DROPDOWN) {
      await getDivDropDown({});
      obj.divisionDropdown = true;
    }

    if (type === API_CALLED_ENUM.WAREHOUSE_DROPDOWN) {
      await getWarehouseDrop({});
      obj.warehouseDropdown = true;
    }

    isApicalledRefFilter.current = obj;
  };

  useEffect(() => {
    if (searchParams.get('warehouse')) {
      handleOnFocusApiCall(API_CALLED_ENUM.WAREHOUSE_DROPDOWN);
    }
  }, [filter?.warehouse]);

  useEffect(() => {
    if (searchParams.get('division')) {
      handleOnFocusApiCall(API_CALLED_ENUM.DIVISION_DROPDOWN);
    }
  }, [filter?.division]);

  useEffect(() => {
    const controller = new AbortController();
    if (filter?.division) {
      const payload = { divisionId: filter?.division, signal: controller.signal };
      getBranchDropDown(payload);
    }
    return () => controller.abort();
  }, [filter?.division]);

  const columns = inventoryAdjustmentColumn(useInventoryAdjustmentPermission, STATUS_ENUM, handleApproveClick, handleRejectClick, handleEditClick, handleViewClick, isViewOnly);

  let columnsFromLocalStorage = getFromLocalStorage(configEnum?.INVENTORY_ADJUSTMENT);
  let parsedColumnData = parsedTableCoulmns(columnsFromLocalStorage, columns);

  let displayColumn = parsedColumnData?.displayColumn?.filter(x => x?.visible === true);
  const [columnsList, setColumnsList] = useState(parsedColumnData?.displayColumn.slice(0, -1));
  const [customizedColumns, setCutomizedColumns] = useState([...(parsedColumnData?.customizedColumn?.length > 0 ? parsedColumnData.customizedColumn : displayColumn)]);

  const handleColumnResize = useColumnResize(setColumnsList, setCutomizedColumns, configEnum?.INVENTORY_ADJUSTMENT);

  const { showColumnModal, setShowColumnModal, standardDropdownItems } = useDocumentListToolbar({
    filterKey: FILTER_KEY,
    columnConfigKey: configEnum?.INVENTORY_ADJUSTMENT_CONFIG,
    showPreferences: false,
    columnsConfig: {
      getDefaultColumns: () => inventoryAdjustmentColumn(useInventoryAdjustmentPermission, STATUS_ENUM, handleApproveClick, handleRejectClick, handleEditClick, handleViewClick, isViewOnly),
      setColumnsList: setColumnsList,
      setCustomizedColumns: setCutomizedColumns,
    },
    handleResetFilters,
    onRefresh: () => fetchInventoryAdjustmentData(),
  });
  const dropdownItems = [...standardDropdownItems];
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden -m-4">
      <div className="bg-white px-4 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        <div className="w-full md:w-auto text-[1.125rem] font-bold  text-heading">{`${PAGE_HEADERS?.VIEW_INVENTORY_ADJUSTMENT?.title} (${pagination?.totalResults || 0})`}</div>
        <div className="flex flex-wrap gap-2 md:gap-3 justify-center md:justify-end">
          <PermissionButton
            isViewOnly={isViewOnly}
            canAccess={useInventoryAdjustmentPermission?.create}
            type="primary"
            className="py-4 px-5"
            onClick={() => navigate('/inventory-adjustment/new')}
            icon={<Icons.PlusCircleOutlined />}
            text="Add"
          />
          <Dropdown menu={{ items: dropdownItems, className: 'app-toolbar-dropdown' }} trigger={['click']} getPopupContainer={() => document.body}>
            <Button size="middle" className="app-toolbar-button" icon={<Icons.EllipsisOutlined />} />
          </Dropdown>
        </div>
      </div>
      <div className="bg-white border-t px-4 py-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <FilterInput type={filterInputEnum?.SEARCH} name={'search'} placeHolder="Search..." value={filter?.search} setFilter={setFilter} onSerch={handleSearch} onClear={handleClear} />
          <ColumnSelection
            columns={columnsList}
            setColumnsList={setColumnsList}
            setCutomizedColumns={setCutomizedColumns}
            configPage={configEnum?.INVENTORY_ADJUSTMENT_CONFIG}
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
          <FilterSection title="What">
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                mode="multiple"
                name={'status'}
                label={'Status'}
                className="mt-1"
                placeHolder={'Select Status'}
                selectionOptions={Object?.entries(STATUS_ENUM)?.map(([key, value]) => {
                  return { value: key, label: value };
                })}
                value={filter?.status}
                setFilter={setFilter}
                allowClear={true}
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
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name={'warehouse'}
                mode="multiple"
                label={'Warehouse'}
                placeHolder={'Select Warehouse'}
                value={filter?.warehouse}
                setFilter={setFilter}
                selectVariant="twoColumn"
                columnSelectHeader={warehouseSelectColumnHeader}
                selectionOptions={buildWarehouseSelectOptions(
                  (warehouseDrop || []).filter(warehouse => {
                    if (Array.isArray(filter?.branch)) {
                      return filter?.branch?.length > 0 ? filter?.branch?.includes(warehouse?.branchId?.id) : true;
                    }
                    return warehouse?.branchId?.id === filter?.branch;
                  })
                )}
                allowClear={true}
                disabled={!filter?.branch || (Array.isArray(filter?.branch) && filter?.branch?.length === 0)}
                loading={warehouseLoading}
                onFocus={() => {
                  if (!isApicalledRefFilter.current.warehouseDropdown) {
                    handleOnFocusApiCall(API_CALLED_ENUM.WAREHOUSE_DROPDOWN);
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
          STATUS_ENUM={STATUS_ENUM}
          divDrop={divDrop}
          branchDrop={branchDrop}
          extraFilters={{
            warehouse: {
              label: 'Warehouse',
              format: value => warehouseDrop?.find(x => x?.id === value)?.name,
              clear: (setFilter, updateUrlParams) => {
                setFilter(prev => ({ ...prev, warehouse: null }));
                updateUrlParams({ warehouse: null });
              },
            },
          }}
        />
      </div>
      <div>
        <CustomTable
          onColumnResize={handleColumnResize}
          columns={[...customizedColumns, ...[columns[columns.length - 1]]]}
          loading={loading}
          data={inventoryAdjustment || []}
          tableId="id"
          onRowClick={handleViewClick}
          pagination={{
            current: searchParams?.get('page') || 1,
            pageSize: searchParams?.get('limit') || pagination?.limit,
            total: pagination.totalResults,
            onChange: handlePaginationChange,
          }}
        />
      </div>
    </div>
  );
};

export default ViewInventoryAdjustment;
