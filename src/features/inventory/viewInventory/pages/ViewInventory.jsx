import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

// Components
import ColumnSelection from '@/components/ui/common/ColumnSelection';
import FilterLockButton from '@/components/ui/common/FilterLockButton';
import FilterDrawer, { FilterSection, FilterButton } from '@/components/ui/common/FilterDrawer';
import { ITEM_STATUS_OPTIONS, ITEM_TYPE_OPTIONS } from '@/utils/dropdownEnums';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import ExportReportModal from '@/components/feedback/formModal/ExportReportModal';
import FilterInput from '@/components/forms/formInput/FilterInput';
import PageHeader from '@/components/ui/common/PageHeader';
import PermissionButton from '@/components/ui/button/PermissionButton';
import { colorPalette } from '@/utils/theme';
import { Button, Dropdown, Switch, Tooltip } from '@/components/AntDComponent';
import { CommonFilterTags } from '@/utils/filtersUtils';

// Hooks
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import { useFilters } from '@/utils/filtersUtils';
import { useViewInventory, viewInventoryService } from '@/features/inventory/viewInventory';
import { useItemGroup } from '@/features/allMaster/itemGroup';
import useModulePermissions from 'hooks/useModulePermissions';

// Extras
import { viewInventoryColumn } from '@/features/inventory/viewInventory';
import { getAllFiltersFromLocalStorage } from '@/utils/filters';
import Icons from 'assets/icons/icon';
import { FILTERS_KEYS, RESOURCES } from '@/utils/jsonFile';
import { configEnum, filterInputEnum, STOCK_STATUS } from 'utils/constants';
import { getFromLocalStorage, getQueryParams, parsedTableCoulmns } from 'utils/services';
import { PAGE_HEADERS } from '@/utils/label';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';
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
import { buildItemGroupSelectOptions, itemGroupSelectColumnHeader } from '@/utils/tableSelectDropdown/itemGroupSelectDropdown';
import { buildItemFilterSelectOptions, itemSelectColumnHeader, itemSelectDropdownProps } from '@/utils/tableSelectDropdown/itemSelectDropdown';

const API_CALLED_ENUM = {
  ITEMGROUP_DROPDOWN: 'itemGroupDropdown',
  DIVISION_DROPDOWN: 'divisionDropdown',
  WAREHOUSE_DROPDOWN: 'warehouseDropdown',
  ITEM_DROPDOWN: 'itemDropdown',
};

const STOCK_STATUS_TILES = [
  { key: STOCK_STATUS.NORMAL, label: 'In Range', countKey: 'inRange', dot: '#16a34a' },
  { key: STOCK_STATUS.BELOW_MINIMUM, label: 'Below Min', countKey: 'belowMinimum', dot: '#dc2626' },
  { key: STOCK_STATUS.ABOVE_MAXIMUM, label: 'Above Max', countKey: 'aboveMaximum', dot: '#d97706' },
  { key: STOCK_STATUS.NO_RANGE, label: 'No Range', countKey: 'noRange', dot: '#9ca3af' },
];

const ViewInventory = () => {
  const navigate = useNavigate();
  const { inventoryStock, inventoryStockLoading: loading, inventoryStockPagination, getItemInventoryStock, resetInventoryStock } = useViewInventory();
  const { itemGroupDrop, itemGroupDropLoading, getItemGroupDropdown } = useItemGroup();
  const {
    isViewOnly,
    useModuleProduction,
    divDrop,
    divisionLoading,
    getDivDropDown,
    branchDrop,
    branchLoading,
    getBranchDropDown,
    warehouseDrop,
    warehouseLoading,
    getWarehouseDrop,
    allItemDrop,
    allItemDropLoading,
    getAllItemDrop,
  } = useModulePermissions(RESOURCES.PRODUCTION);
  const { useModuleStockSummary } = useModulePermissions(RESOURCES.ANALYTICS_PERMISSIONS.STOCK_SUMMARY);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilter, setShowFilter] = useState(false);
  const showZeroInventoryQty = searchParams.get('includeZeroInventory') === 'true';
  const FILTER_KEY = FILTERS_KEYS.VIEW_INVENTORY_ALL_FILTER;
  const isApiCalledRef = useRef(false);
  const isApicalledRefFilter = useRef({
    itemGroupDropdown: false,
    divisionDropdown: false,
    warehouseDropdown: false,
    itemDropdown: false,
  });
  const { filter, setFilter, isLocked, updateUrlParams, handleFilter, handleSearch, handleClear, handleResetFilters, areSavedFiltersApplied, handleLockToggle, getActiveFiltersCount } = useFilters({
    searchParams,
    setSearchParams,
    pagination: inventoryStockPagination,
    FILTER_KEY,
    setShowFilter,
    defaultFilter: {
      search: searchParams.get('search') || '',
      division: searchParams.get('division') || '',
      branch: searchParams.get('branch') ? searchParams.get('branch').split(',') : '',
      warehouse: searchParams.get('warehouse') ? searchParams.get('warehouse').split(',') : '',
      itemType: searchParams.get('itemType') ? searchParams.get('itemType').split(',') : '',
      itemGroup: searchParams.get('itemGroup') ? searchParams.get('itemGroup').split(',') : '',
      itemIds: searchParams.get('itemIds') ? searchParams.get('itemIds').split(',') : [],
      itemStatus: searchParams.get('itemStatus') || undefined,
    },
  });

  const handleToggleIncludeOutOfStock = checked => {
    setSearchParams(prev => {
      const params = new URLSearchParams(prev);
      params.set('page', '1');
      params.set('includeZeroInventory', checked ? 'true' : 'false');
      return params;
    });
  };

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

    if (type === API_CALLED_ENUM.ITEMGROUP_DROPDOWN) {
      await getItemGroupDropdown({});
      obj.itemGroupDropdown = true;
    }

    if (type === API_CALLED_ENUM.DIVISION_DROPDOWN) {
      await getDivDropDown({});
      obj.divisionDropdown = true;
    }

    if (type === API_CALLED_ENUM.ITEM_DROPDOWN) {
      await getAllItemDrop({});
      obj.itemDropdown = true;
    }

    if (type === API_CALLED_ENUM.WAREHOUSE_DROPDOWN) {
      await getWarehouseDrop({});
      obj.warehouseDropdown = true;
    }

    isApicalledRefFilter.current = obj;
  };

  useEffect(() => {
    if (searchParams.get('itemGroup')) {
      handleOnFocusApiCall(API_CALLED_ENUM.ITEMGROUP_DROPDOWN);
    }
  }, [filter?.itemGroup]);

  useEffect(() => {
    if (searchParams.get('itemIds')) {
      handleOnFocusApiCall(API_CALLED_ENUM.ITEM_DROPDOWN);
    }
  }, [filter?.itemIds]);

  useEffect(() => {
    if (searchParams.get('division')) {
      handleOnFocusApiCall(API_CALLED_ENUM.DIVISION_DROPDOWN);
    }
  }, [filter?.division]);

  useEffect(() => {
    if (searchParams.get('warehouse')) {
      handleOnFocusApiCall(API_CALLED_ENUM.WAREHOUSE_DROPDOWN);
    }
  }, [filter?.warehouse]);

  const handleViewClick = record => {
    const id = record?.id || record?._id;
    if (id) {
      navigate(`/view-inventory/${id}/inventory-details`);
    }
  };

  const handleLedgerClick = record => {
    navigate(`/reports/item-ledger?page=1&limit=${DEFAULT_PAGE_SIZE}&item=${record?.id || record?._id}`);
  };

  const getExportPayload = () => {
    const payload = getQueryParams(window.location.href) || {};
    delete payload.page;
    delete payload.limit;
    return {
      ...payload,
      includeZeroInventory: showZeroInventoryQty,
    };
  };

  const handleExport = async (format, filename) => {
    if (format !== 'xlsx') return;
    const payload = getExportPayload();
    const response = await viewInventoryService.exportInventoryStock(payload);
    const results = response?.data?.results || [];
    const columnKeys = ['Item ID', 'Item Name', 'Item Type', 'Model No', 'Item Group', 'Total Available Qty', 'Total Valuation', 'Latest Price'];
    const excelData = results.map(row => ({
      'Item ID': row.itemId ?? '',
      'Item Name': row.itemName ?? '',
      'Item Type': row.itemType ?? '',
      'Model No': row.itemModelNo ?? '',
      'Item Group': row.itemGroup ?? '',
      'Total Available Qty': row.totalAvailableQty ?? 0,
      'Total Valuation': row.totalValuation ?? 0,
      'Latest Price': row.latestPrice ?? '',
    }));
    const XLSX = await import('xlsx');
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const itemNameColIndex = columnKeys.indexOf('Item Name');
    worksheet['!cols'] = columnKeys.map((key, colIndex) => {
      const headerWidth = key.length;
      const maxDataWidth = excelData.reduce((max, row) => Math.max(max, String(row[key] ?? '').length), headerWidth);
      let wch = Math.max(headerWidth, Math.min(maxDataWidth, 50));
      if (colIndex === itemNameColIndex) {
        wch = Math.max(wch, headerWidth * 2);
      }
      return { wch };
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory Stock');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handlePaginationChange = (page, pageSize) => {
    updateUrlParams({ page, limit: pageSize });
  };

  const fetchInventoryItemStock = signal => {
    const page = parseInt(searchParams?.get('page')) || 1;
    const pageSize = parseInt(searchParams?.get('limit')) || inventoryStock.limit;

    const payload = getQueryParams(window.location.href) || {};

    getItemInventoryStock({
      ...payload,
      page,
      limit: pageSize,
      includeZeroInventory: showZeroInventoryQty,
      signal,
    });
  };

  useEffect(() => {
    const savedFilters = getAllFiltersFromLocalStorage(FILTER_KEY);

    if (!isApiCalledRef.current && !searchParams.get('page') && !searchParams.get('limit')) {
      if (savedFilters && Object.keys(savedFilters).length > 0) {
        setFilter(prev => ({
          ...prev,
          search: savedFilters.search ?? prev.search,
          division: savedFilters.division ?? prev.division,
          branch: savedFilters.branch ? savedFilters?.branch?.split(',') : prev.branch,
          warehouse: savedFilters.warehouse ? savedFilters?.warehouse?.split(',') : prev.warehouse,
          itemType: savedFilters.itemType ? savedFilters?.itemType?.split(',') : prev.itemType,
          itemGroup: savedFilters.itemGroup ? savedFilters?.itemGroup?.split(',') : prev.itemGroup,
          itemStatus: savedFilters.itemStatus ?? prev.itemStatus,
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
    fetchInventoryItemStock(controller.signal);
    return () => controller.abort();
  }, [searchParams, showZeroInventoryQty]);

  useResetOnUnmount(resetInventoryStock);

  const handleTotalOfAvailableStock = record => {
    const total = Number(record?.totalAvailableStock ?? 0) || 0;
    return total.toString().padStart(2, '0');
  };

  const columns = viewInventoryColumn(handleViewClick, handleTotalOfAvailableStock, handleLedgerClick, useModuleProduction);

  let columnsFromLocalStorage = getFromLocalStorage(configEnum?.ITEM_INVENTORY_CONFIG);
  let parsedColumnData = parsedTableCoulmns(columnsFromLocalStorage, columns);

  let displayColumn = parsedColumnData?.displayColumn?.filter(x => x?.visible === true);
  const [columnsList, setColumnsList] = useState(parsedColumnData?.displayColumn.slice(0, -1));
  const [customizedColumns, setCutomizedColumns] = useState([...(parsedColumnData?.customizedColumn?.length > 0 ? parsedColumnData.customizedColumn : displayColumn)]);

  const handleColumnResize = useColumnResize(setColumnsList, setCutomizedColumns, configEnum?.ITEM_INVENTORY_CONFIG);

  const { showColumnModal, setShowColumnModal, standardDropdownItems } = useDocumentListToolbar({
    filterKey: FILTER_KEY,
    columnConfigKey: configEnum?.ITEM_INVENTORY_CONFIG,
    showPreferences: false,
    columnsConfig: {
      getDefaultColumns: () => viewInventoryColumn(handleViewClick, handleTotalOfAvailableStock, handleLedgerClick, useModuleProduction),
      setColumnsList: cols => setColumnsList(Array.isArray(cols) ? cols.slice(0, -1) : cols),
      setCustomizedColumns: setCutomizedColumns,
    },
    handleResetFilters,
    onRefresh: () => fetchInventoryItemStock(new AbortController().signal),
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
        const canViewStockSummary = !!useModuleStockSummary?.canView;
        return [
          {
            key: 'stockSummary',
            icon: <Icons.BarChartOutlined className={canViewStockSummary ? '' : 'text-gray-400'} />,
            label: (
              <Tooltip title={canViewStockSummary ? '' : NO_PERMISSION_MSG} placement="left">
                <span className={canViewStockSummary ? '' : 'text-gray-400'}>Stock Summary Report</span>
              </Tooltip>
            ),
            disabled: !canViewStockSummary,
            onClick: ({ domEvent }) => {
              domEvent.stopPropagation();
              if (!canViewStockSummary) return;
              navigate('/analytics/stock/summary');
            },
          },
        ];
      })(),
    },
  ];

  const selectedStockStatus = searchParams.get('stockStatus') || null;
  const stockStatusCounts = inventoryStockPagination?.stockStatusCounts || {};
  const handleStockStatusClick = status => {
    updateUrlParams({ stockStatus: selectedStockStatus === status ? null : status, page: 1 });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden -m-4">
      <div className="bg-white px-4 py-2.5 flex flex-col md:flex-row md:items-center gap-3 md:gap-0">
        <PageHeader
          loading={loading}
          title={PAGE_HEADERS?.VIEW_INVENTORY?.title}
          totalRecord={inventoryStockPagination?.totalResults}
          totalQuantity={inventoryStockPagination?.totalStock}
          totalAmount={inventoryStockPagination?.totalValuation}
        />
        <div className="flex flex-wrap items-center gap-1.5 md:ml-6">
          {STOCK_STATUS_TILES.map(tile => {
            const active = selectedStockStatus === tile.key;
            return (
              <button
                key={tile.key}
                type="button"
                onClick={() => handleStockStatusClick(tile.key)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                  active ? 'font-semibold text-gray-900' : 'text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
                style={active ? { borderColor: colorPalette.primary[500], backgroundColor: `${colorPalette.primary[500]}0F` } : undefined}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tile.dot }} />
                <span>{tile.label}</span>
                <span className="font-semibold text-gray-900">{(stockStatusCounts[tile.countKey] ?? 0).toLocaleString('en-IN')}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 justify-end md:ml-auto">
          <PermissionButton
            size="middle"
            className="p-[17px]"
            tooltipProps={{ placement: 'left' }}
            isViewOnly={isViewOnly}
            onClick={isViewOnly ? undefined : () => setExportModalOpen(true)}
            text="Export"
          />
          <Dropdown menu={{ items: dropdownItems, className: 'app-toolbar-dropdown' }} trigger={['click']} getPopupContainer={() => document.body}>
            <Button size="middle" className="app-toolbar-button" icon={<Icons.EllipsisOutlined />} />
          </Dropdown>
        </div>
      </div>

      <div className="view-inventory-filters bg-white border-t px-3 sm:px-4 py-3 sm:py-3.5 space-y-3 min-w-0 overflow-x-hidden">
        <div className="flex flex-wrap items-center gap-3 w-full min-w-0">
          <div className="w-full min-w-0 md:flex-1 md:min-w-[12rem] md:max-w-md">
            <FilterInput
              type={filterInputEnum?.SEARCH}
              name={'search'}
              placeHolder="Search..."
              value={filter?.search}
              setFilter={setFilter}
              onSerch={handleSearch}
              onClear={handleClear}
              searchFullWidth
            />
          </div>
          <div className="w-full sm:w-auto [&_button]:!w-full sm:[&_button]:!w-auto">
            <ColumnSelection
              columns={columnsList}
              setColumnsList={setColumnsList}
              setCutomizedColumns={setCutomizedColumns}
              configPage={configEnum?.ITEM_INVENTORY_CONFIG}
              modalOpen={showColumnModal}
              setModalOpen={setShowColumnModal}
            />
          </div>
          <div className="flex items-center justify-between gap-2 w-full sm:w-auto sm:min-w-[12rem] md:min-w-0">
            <span className="text-xs sm:text-sm text-gray-600">Include out-of-stock items</span>
            <Switch size="small" className="flex-shrink-0" checked={showZeroInventoryQty} onChange={handleToggleIncludeOutOfStock} />
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full md:w-auto md:ml-auto">
            <div className="w-full sm:w-auto [&_button]:!w-full sm:[&_button]:!w-auto">
              <FilterLockButton isLocked={isLocked} activeFiltersCount={getActiveFiltersCount()} onToggle={handleLockToggle} />
            </div>
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
            <div className="space-y-2 min-w-0">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name={'itemStatus'}
                label={'Item Status'}
                placeHolder={'Select Item Status'}
                value={filter?.itemStatus}
                setFilter={setFilter}
                selectionOptions={ITEM_STATUS_OPTIONS}
                allowClear={true}
              />
            </div>
            <div className="space-y-2 min-w-0">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name={'itemType'}
                mode="multiple"
                label={'Item Type'}
                placeHolder={'Search Item Type'}
                value={filter?.itemType}
                setFilter={setFilter}
                selectionOptions={ITEM_TYPE_OPTIONS}
                allowClear={true}
              />
            </div>
            <div className="space-y-2 min-w-0">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name={'itemGroup'}
                mode="multiple"
                label={'Item Group'}
                placeHolder={'Search Item Group'}
                value={filter?.itemGroup}
                setFilter={setFilter}
                selectVariant="twoColumn"
                columnSelectHeader={itemGroupSelectColumnHeader}
                selectionOptions={buildItemGroupSelectOptions(itemGroupDrop)}
                allowClear={true}
                loading={itemGroupDropLoading}
                onFocus={() => {
                  if (!isApicalledRefFilter.current.itemGroupDropdown) {
                    handleOnFocusApiCall(API_CALLED_ENUM.ITEMGROUP_DROPDOWN);
                  }
                }}
              />
            </div>
            <div className="space-y-2 min-w-0">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name={'itemIds'}
                mode="multiple"
                label={'Item'}
                placeHolder={'Search Item'}
                value={filter?.itemIds}
                setFilter={setFilter}
                selectVariant="twoColumn"
                columnSelectHeader={itemSelectColumnHeader}
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
            <div className="space-y-2 min-w-0">
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
                allowClear={false}
                extraFilterValues={{ branch: '' }}
                loading={divisionLoading}
                onFocus={() => {
                  if (!isApicalledRefFilter.current.divisionDropdown) {
                    handleOnFocusApiCall(API_CALLED_ENUM.DIVISION_DROPDOWN);
                  }
                }}
              />
            </div>
            <div className="space-y-2 min-w-0">
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
                allowClear={false}
                disabled={!filter?.division}
                loading={branchLoading}
              />
            </div>
            <div className="space-y-2 min-w-0">
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
          divDrop={divDrop}
          branchDrop={branchDrop}
          extraFilters={{
            itemStatus: {
              label: 'Item Status',
              format: value => (value === 'true' ? 'Active' : value === 'false' ? 'Inactive' : value),
              clear: (setFilter, updateUrlParams) => {
                setFilter(prev => ({ ...prev, itemStatus: undefined }));
                updateUrlParams({ itemStatus: null });
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
            itemGroup: {
              label: 'Item Group',
              format: value => itemGroupDrop?.find(x => x?.id === value)?.name,
              clear: (setFilter, updateUrlParams) => {
                setFilter(prev => ({ ...prev, itemGroup: null }));
                updateUrlParams({ itemGroup: null });
              },
            },
            itemIds: {
              label: 'Item',
              format: value =>
                String(value)
                  .split(',')
                  .filter(Boolean)
                  .map(id => allItemDrop?.find(x => x?._id === id)?.itemName || id)
                  .join(', '),
              clear: (setFilter, updateUrlParams) => {
                setFilter(prev => ({ ...prev, itemIds: [] }));
                updateUrlParams({ itemIds: null });
              },
            },
            itemType: {
              label: 'Item Type',
              format: value => value,
              clear: (setFilter, updateUrlParams) => {
                setFilter(prev => ({ ...prev, itemType: null }));
                updateUrlParams({ itemType: null });
              },
            },
          }}
        />
      </div>
      <CustomTable
        onColumnResize={handleColumnResize}
        columns={[...customizedColumns, columns[columns.length - 1]]}
        loading={loading}
        data={inventoryStock || []}
        onRowClick={handleViewClick}
        tableId="id"
        pagination={{
          current: searchParams?.get('page') || 1,
          pageSize: searchParams?.get('limit') || DEFAULT_PAGE_SIZE,
          total: inventoryStockPagination.totalResults,
          onChange: handlePaginationChange,
        }}
      />
      <ExportReportModal
        modalOpen={exportModalOpen}
        setModalOpen={setExportModalOpen}
        reportName="View_Inventory"
        title="Export Inventory Stock"
        initialFormat="xlsx"
        formats={['xlsx']}
        onExport={handleExport}
      />
    </div>
  );
};

export default ViewInventory;
