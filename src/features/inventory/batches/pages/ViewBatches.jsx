import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

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
import { useBatches, batchesColumn, BATCH_SOURCE_TYPE_LABELS, BATCH_SOURCE_TYPE_FILTER_OPTIONS } from '@/features/inventory/batches';
import Icons from '@/assets/icons/icon';
import { FILTERS_KEYS, RESOURCES } from '@/utils/jsonFile';
import { configEnum, filterInputEnum } from '@/utils/constants';
import { getAllFiltersFromLocalStorage } from '@/utils/filters';
import { getFromLocalStorage, getQueryParams, parsedTableCoulmns } from '@/utils/services';
import { PAGE_HEADERS } from '@/utils/label';
import { ADMIN_ROUTE_PATHS } from '@/routes/adminRoutePaths';
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
import { buildItemFilterSelectOptions, getItemSelectDisplayLabel, itemSelectFilterColumnHeader, itemSelectDropdownProps } from '@/utils/tableSelectDropdown/itemSelectDropdown';

const API_CALLED_ENUM = {
  DIVISION_DROPDOWN: 'divisionDropdown',
  WAREHOUSE_DROPDOWN: 'warehouseDropdown',
  ITEM_DROPDOWN: 'itemDropdown',
};

const ViewBatches = () => {
  const navigate = useNavigate();
  const { batches, loading, getItemBatches, pagination, resetBatches } = useBatches();
  const { divDrop, divisionLoading, getDivDropDown, branchDrop, branchLoading, getBranchDropDown, warehouseDrop, warehouseLoading, getWarehouseDrop, allItemDrop, allItemDropLoading, getAllItemDrop } =
    useModulePermissions(RESOURCES.ADD_INVENTORY);

  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilter, setShowFilter] = useState(false);

  const FILTER_KEY = FILTERS_KEYS.INVENTORY_BATCHES_ALL_FILTER;
  const isApiCalledRef = useRef(false);
  const isApicalledRefFilter = useRef({
    divisionDropdown: false,
    warehouseDropdown: false,
    itemDropdown: false,
  });

  const { filter, setFilter, isLocked, updateUrlParams, handleFilter, handleSearch, handleClear, handleResetFilters, areSavedFiltersApplied, getActiveFiltersCount, handleLockToggle } = useFilters({
    searchParams,
    setSearchParams,
    pagination,
    FILTER_KEY,
    setShowFilter,
    defaultFilter: {
      search: searchParams.get('search') || '',
      sourceType: searchParams.get('sourceType') || '',
      itemId: searchParams.get('itemId') || '',
      division: searchParams.get('division') || '',
      branch: searchParams.get('branch') ? searchParams.get('branch').split(',') : '',
      warehouse: searchParams.get('warehouse') ? searchParams.get('warehouse').split(',') : '',
    },
  });

  const handlePaginationChange = (page, pageSize) => {
    updateUrlParams({ page, limit: pageSize });
  };

  const fetchBatchesData = signal => {
    const page = parseInt(searchParams?.get('page')) || 1;
    const pageSize = parseInt(searchParams?.get('limit')) || pagination.limit;

    const payload = getQueryParams(window.location.href) || {};

    getItemBatches({
      ...payload,
      page,
      limit: pageSize,
      signal,
    });
  };

  const handleViewClick = record => {
    const id = record?.id || record?._id;
    if (id) {
      navigate(`/${ADMIN_ROUTE_PATHS.itemBatches.build.detail(id)}`);
    }
  };

  useEffect(() => {
    const savedFilters = getAllFiltersFromLocalStorage(FILTER_KEY);

    if (!isApiCalledRef.current && !searchParams.get('page') && !searchParams.get('limit')) {
      if (savedFilters && Object.keys(savedFilters).length > 0) {
        setFilter(prev => ({
          ...prev,
          search: savedFilters.search ?? prev.search,
          sourceType: savedFilters.sourceType ? savedFilters.sourceType.split(',') : prev.sourceType,
          itemId: savedFilters.itemId ?? prev.itemId,
          division: savedFilters.division ?? prev.division,
          branch: savedFilters.branch ? savedFilters.branch.split(',') : prev.branch,
          warehouse: savedFilters.warehouse ? savedFilters.warehouse.split(',') : prev.warehouse,
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
    fetchBatchesData(controller.signal);
    return () => controller.abort();
  }, [searchParams]);

  useResetOnUnmount(resetBatches);

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

    if (type === API_CALLED_ENUM.ITEM_DROPDOWN) {
      await getAllItemDrop({});
      obj.itemDropdown = true;
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
    if (searchParams.get('itemId')) {
      handleOnFocusApiCall(API_CALLED_ENUM.ITEM_DROPDOWN);
    }
  }, [filter?.itemId]);

  useEffect(() => {
    const controller = new AbortController();
    if (filter?.division) {
      const payload = { divisionId: filter?.division, signal: controller.signal };
      getBranchDropDown(payload);
    }
    return () => controller.abort();
  }, [filter?.division]);

  const columns = batchesColumn(handleViewClick);

  let columnsFromLocalStorage = getFromLocalStorage(configEnum?.INVENTORY_BATCHES_CONFIG);
  let parsedColumnData = parsedTableCoulmns(columnsFromLocalStorage, columns);

  let displayColumn = parsedColumnData?.displayColumn?.filter(x => x?.visible === true);
  const [columnsList, setColumnsList] = useState(parsedColumnData?.displayColumn.slice(0, -1));
  const [customizedColumns, setCutomizedColumns] = useState([...(parsedColumnData?.customizedColumn?.length > 0 ? parsedColumnData.customizedColumn : displayColumn)]);

  const handleColumnResize = useColumnResize(setColumnsList, setCutomizedColumns, configEnum?.INVENTORY_BATCHES_CONFIG);

  const { showColumnModal, setShowColumnModal, standardDropdownItems } = useDocumentListToolbar({
    filterKey: FILTER_KEY,
    columnConfigKey: configEnum?.INVENTORY_BATCHES_CONFIG,
    showPreferences: false,
    columnsConfig: {
      getDefaultColumns: () => batchesColumn(handleViewClick),
      setColumnsList,
      setCustomizedColumns: setCutomizedColumns,
    },
    handleResetFilters,
    onRefresh: () => fetchBatchesData(),
  });

  const dropdownItems = [...standardDropdownItems];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden -m-4">
      {/* Header */}
      <div className="bg-white px-4 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        <div className="w-full md:w-auto text-[1.125rem] font-bold text-heading">{`${PAGE_HEADERS?.INVENTORY_BATCHES?.title} (${pagination?.totalResults || 0})`}</div>
        <div className="flex flex-wrap gap-2 md:gap-3 justify-center md:justify-end">
          <Dropdown menu={{ items: dropdownItems, className: 'app-toolbar-dropdown' }} trigger={['click']} getPopupContainer={() => document.body}>
            <Button size="middle" className="app-toolbar-button" icon={<Icons.EllipsisOutlined />} />
          </Dropdown>
        </div>
      </div>

      {/* Filters toolbar */}
      <div className="bg-white border-t px-4 py-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <FilterInput type={filterInputEnum?.SEARCH} name="search" placeHolder="Search..." value={filter?.search} setFilter={setFilter} onSerch={handleSearch} onClear={handleClear} />
          <ColumnSelection
            columns={columnsList}
            setColumnsList={setColumnsList}
            setCutomizedColumns={setCutomizedColumns}
            configPage={configEnum?.INVENTORY_BATCHES_CONFIG}
            modalOpen={showColumnModal}
            setModalOpen={setShowColumnModal}
          />
          <div className="flex-grow" />
          <div className="flex gap-2">
            <FilterLockButton isLocked={isLocked} activeFiltersCount={getActiveFiltersCount()} onToggle={handleLockToggle} />
            <FilterButton count={getActiveFiltersCount()} onClick={() => setShowFilter(true)} />
          </div>
        </div>

        {/* Filter Drawer */}
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
                name="sourceType"
                label="Source Type"
                className="mt-1"
                placeHolder="Select Source Type"
                selectionOptions={BATCH_SOURCE_TYPE_FILTER_OPTIONS}
                value={filter?.sourceType}
                setFilter={setFilter}
                allowClear={true}
              />
            </div>
            <div className="space-y-2 min-w-0">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name="itemId"
                label="Item"
                placeHolder="Search Item"
                value={filter?.itemId}
                setFilter={setFilter}
                selectVariant="twoColumn"
                columnSelectHeader={itemSelectFilterColumnHeader}
                selectPopupClassName={itemSelectDropdownProps.selectPopupClassName}
                selectionOptions={buildItemFilterSelectOptions(allItemDrop)}
                allowClear={true}
                loading={allItemDropLoading}
                onFocus={() => {
                  if (!isApicalledRefFilter.current.itemDropdown) {
                    handleOnFocusApiCall(API_CALLED_ENUM.ITEM_DROPDOWN);
                  }
                }}
              />
            </div>
          </FilterSection>

          <FilterSection title="Where">
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name="division"
                label="Division"
                placeHolder="Select Division"
                selectVariant="twoColumn"
                columnSelectHeader={divisionSelectColumnHeader}
                selectionOptions={buildDivisionSelectOptions(divDrop)}
                value={filter?.division}
                setFilter={setFilter}
                allowClear={true}
                extraFilterValues={{ branch: '', warehouse: '' }}
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
                name="branch"
                label="Branch"
                placeHolder="Select Branch"
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
                name="warehouse"
                mode="multiple"
                label="Warehouse"
                placeHolder="Select Warehouse"
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
          STATUS_ENUM={BATCH_SOURCE_TYPE_LABELS}
          divDrop={divDrop}
          branchDrop={branchDrop}
          extraFilters={{
            sourceType: {
              label: 'Source Type',
              format: value => BATCH_SOURCE_TYPE_LABELS[value] || value,
              clear: (setFilter, updateUrlParams) => {
                setFilter(prev => ({ ...prev, sourceType: null }));
                updateUrlParams({ sourceType: null });
              },
            },
            itemId: {
              label: 'Item',
              format: value => {
                const found = allItemDrop?.find(opt => String(opt?._id || opt?.id) === String(value));
                return found ? getItemSelectDisplayLabel(found) || null : null;
              },
              clear: (setFilter, updateUrlParams) => {
                setFilter(prev => ({ ...prev, itemId: null }));
                updateUrlParams({ itemId: null });
              },
            },
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

      {/* Table */}
      <div>
        <CustomTable
          onColumnResize={handleColumnResize}
          columns={[...customizedColumns, columns[columns.length - 1]]}
          loading={loading}
          data={batches || []}
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

export default ViewBatches;
