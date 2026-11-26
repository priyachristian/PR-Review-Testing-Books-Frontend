import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

// Components
import ColumnSelection from '@/components/ui/common/ColumnSelection';
import FilterLockButton from '@/components/ui/common/FilterLockButton';
import FilterDrawer, { FilterSection, FilterButton } from '@/components/ui/common/FilterDrawer';
import CustomDatePicker from '@/components/forms/formDatePicker/CustomDatePicker';
import FilterInput from '@/components/forms/formInput/FilterInput';
import PageHeader from '@/components/ui/common/PageHeader';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import { Button, Dropdown } from '@/components/AntDComponent';
import { CommonFilterTags } from '@/utils/filtersUtils';

// Hooks
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import { useFilters } from '@/utils/filtersUtils';
import useModulePermissions from 'hooks/useModulePermissions';

// Extras
import { useAddInventory, addInventoryColumn } from '@/features/inventory/addInventory';
import { FILTERS_KEYS, RESOURCES } from '@/utils/jsonFile';
import { getAllFiltersFromLocalStorage } from '@/utils/filters';
import Icons from 'assets/icons/icon';
import { configEnum, filterInputEnum } from 'utils/constants';
import { getFromLocalStorage, getQueryParams, parsedTableCoulmns } from 'utils/services';
import { PAGE_HEADERS } from '@/utils/label';
import useDocumentListToolbar from '@/hooks/useDocumentListToolbar';
import useColumnResize from '@/hooks/useColumnResize';
import { buildDivisionSelectOptions, buildBranchSelectOptions, divisionSelectColumnHeader, branchSelectColumnHeader } from '@/utils/tableSelectDropdown/orgSelectDropdown';

const API_CALLED_ENUM = {
  DIVISION_DROPDOWN: 'divisionDropdown',
};

const ViewAddInventory = () => {
  const { divDrop, divisionLoading, getDivDropDown, branchDrop, branchLoading, getBranchDropDown } = useModulePermissions(RESOURCES.ADD_INVENTORY);
  const { inventoryLogs, loading, getInventoryLogs, resetInventoryLogs } = useAddInventory();
  const [searchParams, setSearchParams] = useSearchParams();
  const isApiCalledRef = useRef(false);
  const isApicalledRefFilter = useRef({
    divisionDropdown: false,
  });
  const FILTER_KEY = FILTERS_KEYS.ADD_INVENTORY_LOG_ALL_FILTER;
  const [showFilter, setShowFilter] = useState(false);
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
  } = useFilters({
    searchParams,
    setSearchParams,
    pagination: inventoryLogs?.extras,
    FILTER_KEY,
    setShowFilter,
    defaultFilter: {
      search: searchParams.get('search') || '',
      division: searchParams.get('division') || '',
      branch: searchParams.get('branch') ? searchParams.get('branch').split(',') : '',
    },
    dateKeys: { startDate: 'startDate', endDate: 'endDate', singleDate: 'createdAt' },
  });

  const fetchInventoryLogs = signal => {
    const page = parseInt(searchParams?.get('page')) || 1;
    const pageSize = parseInt(searchParams?.get('limit')) || DEFAULT_PAGE_SIZE;
    const sortBy = searchParams?.get('sortBy') || '';

    const payload = getQueryParams(window.location.href) || {};

    if (sortBy) payload.sortBy = sortBy;

    getInventoryLogs({
      ...payload,
      page,
      limit: pageSize,
      signal,
    });
  };

  const handlePaginationChange = (page, pageSize) => {
    updateUrlParams({ page, limit: pageSize });
  };

  const handleTableChange = (pagination, filters, sorter) => {
    let sortBy = '';

    if (Array.isArray(sorter)) {
      const firstSort = sorter[0];
      if (firstSort && firstSort.order) {
        sortBy = `${firstSort.field}:${firstSort.order === 'descend' ? 'desc' : 'asc'}`;
      }
    } else if (sorter?.order) {
      sortBy = `${sorter.field}:${sorter.order === 'descend' ? 'desc' : 'asc'}`;
    }

    updateUrlParams({ sortBy, page: 1 });
  };

  useEffect(() => {
    const savedFilters = getAllFiltersFromLocalStorage(FILTER_KEY);

    if (!isApiCalledRef.current && !searchParams.get('page') && !searchParams.get('limit')) {
      if (savedFilters && Object.keys(savedFilters).length > 0) {
        if (savedFilters.preset) {
          setSelectedPreset(savedFilters.preset);
        }
        if (savedFilters.startDate && savedFilters.endDate) {
          setDateRange([savedFilters.startDate, savedFilters.endDate]);
        } else if (savedFilters.createdAt) {
          setDateRange([savedFilters.createdAt, savedFilters.createdAt]);
        }

        setFilter(prev => ({
          ...prev,
          search: savedFilters.search ?? prev.search,
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
    fetchInventoryLogs(controller.signal);

    return () => controller.abort();
  }, [searchParams]);

  useResetOnUnmount(resetInventoryLogs);

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

    isApicalledRefFilter.current = obj;
  };

  useEffect(() => {
    if (searchParams.get('division')) {
      handleOnFocusApiCall(API_CALLED_ENUM.DIVISION_DROPDOWN);
    }
  }, [filter?.division]);

  // Define columns for inventory logs
  const columns = addInventoryColumn();
  let columnsFromLocalStorage = getFromLocalStorage(configEnum?.ADD_INVENTORY_LOGS_CONFIG);
  let parsedColumnData = parsedTableCoulmns(columnsFromLocalStorage, columns);
  let displayColumn = parsedColumnData?.displayColumn?.filter(x => x?.visible === true);

  // For now, use the default columns directly to ensure data displays
  const [columnsList, setColumnsList] = useState(parsedColumnData?.displayColumn);
  const [customizedColumns, setCutomizedColumns] = useState([...(parsedColumnData.customizedColumn?.length > 0 ? parsedColumnData.customizedColumn : displayColumn)]);

  const handleColumnResize = useColumnResize(setColumnsList, setCutomizedColumns, configEnum?.ADD_INVENTORY_LOGS_CONFIG);

  const { showColumnModal, setShowColumnModal, standardDropdownItems } = useDocumentListToolbar({
    filterKey: FILTER_KEY,
    columnConfigKey: configEnum?.ADD_INVENTORY_LOGS_CONFIG,
    showPreferences: false,
    columnsConfig: {
      getDefaultColumns: () => addInventoryColumn(),
      setColumnsList: setColumnsList,
      setCustomizedColumns: setCutomizedColumns,
    },
    handleResetFilters,
    onRefresh: () => fetchInventoryLogs(),
  });
  const dropdownItems = [...standardDropdownItems];
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden -m-4">
      <div className="bg-white px-4 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        <PageHeader title={PAGE_HEADERS?.ADD_INVENTORY?.title} totalRecord={inventoryLogs?.extras?.totalResults || 0} totalAmount={null} totalQuantity={inventoryLogs?.extras?.totalQuantity || 0} />
        <Dropdown menu={{ items: dropdownItems, className: 'app-toolbar-dropdown' }} trigger={['click']} getPopupContainer={() => document.body}>
          <Button size="middle" className="app-toolbar-button" icon={<Icons.EllipsisOutlined />} />
        </Dropdown>
      </div>

      <div className="bg-white border-t px-4 py-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <FilterInput
            type={filterInputEnum?.SEARCH}
            name={'search'}
            placeHolder="Search items, reference numbers..."
            value={filter?.search}
            setFilter={setFilter}
            onSerch={handleSearch}
            onClear={handleClear}
          />
          <ColumnSelection
            columns={columnsList}
            setColumnsList={setColumnsList}
            setCutomizedColumns={setCutomizedColumns}
            configPage={configEnum?.ADD_INVENTORY_LOGS_CONFIG}
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
            singleDateKey: 'createdAt',
          }}
          onDateClear={() => {
            setSelectedPreset('custom');
            setDateRange(null);
            updateUrlParams({ startDate: null, endDate: null, createdAt: null, preset: null });
          }}
          divDrop={divDrop}
          branchDrop={branchDrop}
        />
      </div>
      <div>
        <CustomTable
          onColumnResize={handleColumnResize}
          columns={customizedColumns}
          loading={loading}
          data={inventoryLogs?.data || []}
          onChange={handleTableChange}
          tableId="id"
          pagination={{
            current: searchParams?.get('page') || 1,
            pageSize: searchParams?.get('limit') || DEFAULT_PAGE_SIZE,
            total: inventoryLogs?.extras?.totalResults || 0,
            onChange: handlePaginationChange,
          }}
        />
      </div>
    </div>
  );
};

export default ViewAddInventory;
