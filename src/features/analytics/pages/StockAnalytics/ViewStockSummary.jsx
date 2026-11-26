import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Space, Tooltip } from 'antd';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

import CustomButton from '@/components/ui/button/CustomButton';
import CustomDatePicker from '@/components/forms/formDatePicker/CustomDatePicker';
import FilterInput from '@/components/forms/formInput/FilterInput';
import FilterDrawer, { FilterSection, FilterButton } from '@/components/ui/common/FilterDrawer';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import ExportDataModal from '@/components/ui/common/ExportDataModal';
import Toast from '@/components/ui/common/Toast';
import { Button } from '@/components/AntDComponent';

import useModulePermissions from '@/hooks/useModulePermissions';
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import { useItemGroup } from '@/features/allMaster/itemGroup';
import { useStockSummary } from '@/features/analytics/useStockSummary';
import { stockSummaryColumns, stockSummaryDateWiseColumns, stockSummaryExportColumn } from '@/features/analytics';
import { stockSummaryService } from '@/features/analytics/stockSummary.service';

import Icons from '@/assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { ANALYTICS_TOOLTIPS, filterInputEnum } from '@/utils/constants';
import { colorPalette } from '@/utils/theme';
import { CommonFilterTags } from '@/utils/filtersUtils';
import { dateFormateForBackend, getPresetDateRange, getQueryParams } from '@/utils/services';
import { buildExportRows, downloadExcelExport, resolveExportFileName } from '@/utils/exportData';
import { isCanceledRequestError } from '@/utils/serviceHelper';
import { buildItemFilterSelectOptions, itemSelectFilterColumnHeader, itemSelectDropdownProps } from '@/utils/tableSelectDropdown/itemSelectDropdown';
import { buildWarehouseSelectOptions, warehouseSelectColumnHeader } from '@/utils/tableSelectDropdown/orgSelectDropdown';
import { buildItemGroupSelectOptions, itemGroupSelectColumnHeader } from '@/utils/tableSelectDropdown/itemGroupSelectDropdown';

const STOCK_STATUS_LABEL = {
  BELOW_MINIMUM: 'Below Min',
  ABOVE_MAXIMUM: 'Above Max',
  NORMAL: 'Normal',
};

const STOCK_STATUS_OPTIONS = [
  { label: 'Below Minimum', value: 'BELOW_MINIMUM' },
  { label: 'Above Maximum', value: 'ABOVE_MAXIMUM' },
  { label: 'Normal', value: 'NORMAL' },
];

const API_CALLED_ENUM = {
  ITEM_DROPDOWN: 'itemDropdown',
  WAREHOUSE_DROPDOWN: 'warehouseDropdown',
  ITEM_GROUP_DROPDOWN: 'itemGroupDropdown',
};

const KpiCard = ({ label, value, icon, loading }) => (
  <div className="bg-white border-r border-b border-gray-200 p-3 sm:p-4 h-full">
    <div className="flex flex-col items-start justify-between gap-2 mb-2">
      <div className="p-2 sm:p-2.5 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(23, 133, 182, 0.08)', color: colorPalette.primary[500] }}>
        {icon}
      </div>
    </div>
    <div className="space-y-0.5">
      <p className="text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide line-clamp-1">{label}</p>
      {loading ? <div className="h-6 w-20 bg-gray-100 animate-pulse rounded" /> : <p className="text-lg sm:text-lg font-bold text-gray-900 leading-tight break-words cursor-default">{value ?? 0}</p>}
    </div>
  </div>
);

const Section = ({ title, children, extra }) => (
  <div className="bg-white border border-gray-200">
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
      <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
      {extra}
    </div>
    <div className="p-4">{children}</div>
  </div>
);

const EmptyState = ({ text = 'No data available' }) => (
  <div className="flex flex-col items-center justify-center py-10 text-gray-400">
    <Icons.InboxOutlined style={{ fontSize: 36 }} />
    <p className="mt-2 text-sm">{text}</p>
  </div>
);

const ViewStockSummary = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const controllerRef = useRef(null);
  const isApicalledRefFilter = useRef({
    itemDropdown: false,
    warehouseDropdown: false,
    itemGroupDropdown: false,
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilter, setShowFilter] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(searchParams?.get('preset') || 'custom');
  const [filter, setFilter] = useState({
    warehouseId: searchParams.get('warehouseId') || '',
    itemId: searchParams.get('itemId') || '',
    itemGroupId: searchParams.get('itemGroupId') || '',
    stockStatus: searchParams.get('stockStatus') || '',
  });

  const [dateWiseItem, setDateWiseItem] = useState(null);
  const [showDateWise, setShowDateWise] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const getCustomDates = () => {
    if (searchParams?.get('startDate') && searchParams?.get('endDate')) {
      return [searchParams.get('startDate'), searchParams.get('endDate')];
    }
    return null;
  };

  const [dateRange, setDateRange] = useState(selectedPreset === 'custom' || selectedPreset === 'specific' ? getCustomDates() : getPresetDateRange(selectedPreset));

  const { allItemDrop, allItemDropLoading: itemLoading, getAllItemDrop, warehouseDrop, warehouseLoading, getWarehouseDrop, isSplitSessionActive } = useModulePermissions(RESOURCES.ANALYTICS);
  const { itemGroupDrop, itemGroupDropLoading, getItemGroupDropdown } = useItemGroup();
  const { summaryRows, kpis, pagination, loading, dateWiseRows, dateWisePagination, dateWiseLoading, getSummary, getDateWise, resetAll, resetDateWiseData } = useStockSummary();

  useResetOnUnmount(resetAll);

  const dateWiseControllerRef = useRef(null);

  const updateUrlParams = newParams => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          params.set(key, value.join(','));
        } else {
          params.delete(key);
        }
      } else if (value !== null && value !== undefined && value !== '') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    setSearchParams(params);
  };

  const handlePaginationChange = (page, pageSize) => {
    updateUrlParams({ page, limit: pageSize });
  };

  const fetchSummary = signal => {
    const page = parseInt(searchParams?.get('page'), 10) || 1;
    const pageSize = parseInt(searchParams?.get('limit'), 10) || pagination?.limit || DEFAULT_PAGE_SIZE;
    const params = getQueryParams(window.location.href) || {};

    getSummary({
      fromDate: params.startDate || dateFormateForBackend(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
      toDate: params.endDate || dateFormateForBackend(new Date()),
      branchId: params.branchId || undefined,
      divisionId: params.divisionId || undefined,
      warehouseId: params.warehouseId || undefined,
      itemId: params.itemId || undefined,
      itemGroupId: params.itemGroupId || undefined,
      stockStatus: params.stockStatus || undefined,
      search: params.search || undefined,
      isSplit: isSplitSessionActive || false,
      page,
      limit: pageSize,
      signal,
    });
  };

  useEffect(() => {
    if (!searchParams.get('startDate') || !searchParams.get('endDate')) {
      const start = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const end = new Date();
      updateUrlParams({
        startDate: dateFormateForBackend(start),
        endDate: dateFormateForBackend(end),
        page: searchParams.get('page') || 1,
        limit: searchParams.get('limit') || DEFAULT_PAGE_SIZE,
      });
      return;
    }

    controllerRef.current?.abort();
    controllerRef.current = new AbortController();
    fetchSummary(controllerRef.current.signal);
    return () => controllerRef.current?.abort();
  }, [searchParams, isSplitSessionActive]);

  useEffect(() => {
    if (searchParams.get('itemId')) handleOnFocusApiCall(API_CALLED_ENUM.ITEM_DROPDOWN);
  }, [filter?.itemId]);

  useEffect(() => {
    if (searchParams.get('warehouseId')) handleOnFocusApiCall(API_CALLED_ENUM.WAREHOUSE_DROPDOWN);
  }, [filter?.warehouseId]);

  useEffect(() => {
    if (searchParams.get('itemGroupId')) handleOnFocusApiCall(API_CALLED_ENUM.ITEM_GROUP_DROPDOWN);
  }, [filter?.itemGroupId]);

  const handleFilter = () => {
    updateUrlParams({
      warehouseId: filter?.warehouseId || null,
      itemId: filter?.itemId || null,
      itemGroupId: filter?.itemGroupId || null,
      stockStatus: filter?.stockStatus || null,
      startDate: dateRange?.[0] ? dateFormateForBackend(dateRange[0]) : null,
      endDate: dateRange?.[1] ? dateFormateForBackend(dateRange[1]) : null,
      preset: selectedPreset || null,
      page: 1,
      limit: searchParams.get('limit') || pagination?.limit || DEFAULT_PAGE_SIZE,
    });
  };

  const handleResetFilters = () => {
    const start = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = new Date();
    setFilter({
      warehouseId: null,
      itemId: null,
      itemGroupId: null,
      stockStatus: null,
    });
    setSelectedPreset('custom');
    setDateRange([dateFormateForBackend(start), dateFormateForBackend(end)]);
    updateUrlParams({
      startDate: dateFormateForBackend(start),
      endDate: dateFormateForBackend(end),
      warehouseId: null,
      itemId: null,
      itemGroupId: null,
      stockStatus: null,
      preset: null,
      page: 1,
      limit: pagination?.limit || DEFAULT_PAGE_SIZE,
    });
  };

  const fetchDateWise = (row, page = 1, limit = DEFAULT_PAGE_SIZE) => {
    dateWiseControllerRef.current?.abort();
    dateWiseControllerRef.current = new AbortController();
    getDateWise({
      fromDate: searchParams.get('startDate'),
      toDate: searchParams.get('endDate'),
      itemId: String(row.itemId),
      warehouseId: String(row.warehouseId),
      isSplit: isSplitSessionActive || false,
      page,
      limit,
      signal: dateWiseControllerRef.current.signal,
    });
  };

  useEffect(() => {
    if (!showDateWise || !dateWiseItem) return;
    const limit = parseInt(searchParams?.get('limit'), 10) || pagination?.limit || DEFAULT_PAGE_SIZE;
    fetchDateWise(dateWiseItem, 1, limit);
  }, [isSplitSessionActive]);

  const handleDateWiseClick = row => {
    setDateWiseItem(row);
    setShowDateWise(true);
    resetDateWiseData();
    const limit = parseInt(searchParams?.get('limit'), 10) || pagination?.limit || DEFAULT_PAGE_SIZE;
    fetchDateWise(row, 1, limit);
  };

  const handleBackFromDateWise = () => {
    dateWiseControllerRef.current?.abort();
    setShowDateWise(false);
    setDateWiseItem(null);
    resetDateWiseData();
  };

  const handleDateWisePaginationChange = (page, pageSize) => {
    if (!dateWiseItem) return;
    fetchDateWise(dateWiseItem, page, pageSize);
  };

  const handleOnFocusApiCall = async key => {
    const obj = { ...isApicalledRefFilter.current };
    if (key === API_CALLED_ENUM.ITEM_DROPDOWN) {
      await getAllItemDrop({});
      obj.itemDropdown = true;
    }
    if (key === API_CALLED_ENUM.WAREHOUSE_DROPDOWN) {
      await getWarehouseDrop({});
      obj.warehouseDropdown = true;
    }
    if (key === API_CALLED_ENUM.ITEM_GROUP_DROPDOWN) {
      await getItemGroupDropdown({});
      obj.itemGroupDropdown = true;
    }
    isApicalledRefFilter.current = obj;
  };

  const getActiveFiltersCount = () => {
    return [searchParams.get('warehouseId'), searchParams.get('itemId'), searchParams.get('itemGroupId'), searchParams.get('stockStatus'), searchParams.get('startDate')].filter(Boolean).length;
  };

  const buildExportPayload = signal => {
    const params = getQueryParams(window.location.href) || {};
    return {
      fromDate: params.startDate || dateFormateForBackend(new Date(new Date().getFullYear(), new Date().getMonth(), 1)),
      toDate: params.endDate || dateFormateForBackend(new Date()),
      branchId: params.branchId || undefined,
      divisionId: params.divisionId || undefined,
      warehouseId: params.warehouseId || undefined,
      itemId: params.itemId || undefined,
      itemGroupId: params.itemGroupId || undefined,
      stockStatus: params.stockStatus || undefined,
      search: params.search || undefined,
      isSplit: isSplitSessionActive || false,
      pagination: false,
      signal,
    };
  };

  const handleExport = async ({ fileName }) => {
    if (!summaryRows?.length && !(pagination?.totalResults > 0)) {
      Toast.warning('No data available to export.');
      return;
    }

    const controller = new AbortController();
    setExportLoading(true);
    try {
      const response = await stockSummaryService.getStockSummary(buildExportPayload(controller.signal));
      const rows = Array.isArray(response?.data) ? response.data : [];
      if (!rows.length) {
        Toast.warning('No data available to export.');
        return;
      }

      const exportData = buildExportRows(rows, stockSummaryExportColumn());
      const resolvedName = resolveExportFileName(fileName, 'Stock_Summary_Export');
      await downloadExcelExport({
        exportData,
        sheetName: 'Stock Summary',
        fileName: resolvedName,
      });
      setShowExportModal(false);
    } catch (error) {
      if (isCanceledRequestError(error)) return;
      console.error('Export error:', error);
      Toast.error('Failed to export. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  const dateLabel = searchParams.get('startDate') && searchParams.get('endDate') ? `${searchParams.get('startDate')} to ${searchParams.get('endDate')}` : '';
  const currentPage = parseInt(searchParams?.get('page'), 10) || 1;
  const currentLimit = parseInt(searchParams?.get('limit'), 10) || pagination?.limit || DEFAULT_PAGE_SIZE;

  return (
    <div ref={containerRef} className="-m-4 bg-white">
      {/* ── Header ── */}
      <div className="px-4 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        <div className="flex items-center gap-3">
          {showDateWise ? (
            <CustomButton type="default" text={<Icons.ArrowLeftOutlined />} onClick={handleBackFromDateWise} />
          ) : (
            <CustomButton type="default" text={<Icons.ArrowLeftOutlined />} onClick={() => navigate('/analytics')} />
          )}
          <p className="font-bold text-[1.125rem]">
            Stock Summary Report
            {showDateWise && (
              <span className="ml-2 text-base font-normal text-gray-500">
                — {dateWiseItem?.itemName || ''} / {dateWiseItem?.warehouseName || ''}
              </span>
            )}
          </p>
          {!showDateWise && (
            <div className="pointer-events-auto cursor-pointer mt-1 inline-block">
              <Tooltip title={ANALYTICS_TOOLTIPS.STOCK_SUMMARY} placement="right">
                <Icons.InfoCircleOutlined style={{ color: colorPalette.primary[500] }} />
              </Tooltip>
            </div>
          )}
          {showDateWise && dateWiseItem?.stockStatus && <StatusBadge status={dateWiseItem.stockStatus} value={STOCK_STATUS_LABEL?.[dateWiseItem.stockStatus] || dateWiseItem.stockStatus} />}
        </div>
        {!showDateWise && (
          <div className="flex flex-wrap justify-center md:justify-end gap-2 md:gap-3 w-full md:w-auto">
            <Space>
              <FilterButton count={getActiveFiltersCount()} onClick={() => setShowFilter(true)} />
              <Button icon={<Icons.FileExcelOutlined />} onClick={() => setShowExportModal(true)} disabled={!summaryRows?.length}>
                Export
              </Button>
            </Space>
          </div>
        )}
      </div>

      {/* ── Filter Drawer ── */}
      {!showDateWise && (
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
              <CustomDatePicker selectedPreset={selectedPreset} setSelectedPreset={setSelectedPreset} dateRange={dateRange} setDateRange={setDateRange} label="Date Range" />
            </div>
          </FilterSection>

          <FilterSection title="What">
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name="warehouseId"
                label="Warehouse"
                placeHolder="Select Warehouse"
                selectVariant="twoColumn"
                columnSelectHeader={warehouseSelectColumnHeader}
                selectionOptions={buildWarehouseSelectOptions(warehouseDrop)}
                value={filter?.warehouseId}
                setFilter={setFilter}
                allowClear
                loading={warehouseLoading}
                onFocus={() => {
                  if (!isApicalledRefFilter.current.warehouseDropdown) {
                    handleOnFocusApiCall(API_CALLED_ENUM.WAREHOUSE_DROPDOWN);
                  }
                }}
                getPopupContainer={() => containerRef.current || document.body}
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
                loading={itemLoading}
                onFocus={() => {
                  if (!isApicalledRefFilter.current.itemDropdown) {
                    handleOnFocusApiCall(API_CALLED_ENUM.ITEM_DROPDOWN);
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name="itemGroupId"
                label="Item Group"
                placeHolder="Select Item Group"
                selectVariant="twoColumn"
                columnSelectHeader={itemGroupSelectColumnHeader}
                selectionOptions={buildItemGroupSelectOptions(itemGroupDrop)}
                value={filter?.itemGroupId}
                setFilter={setFilter}
                allowClear
                loading={itemGroupDropLoading}
                onFocus={() => {
                  if (!isApicalledRefFilter.current.itemGroupDropdown) {
                    handleOnFocusApiCall(API_CALLED_ENUM.ITEM_GROUP_DROPDOWN);
                  }
                }}
                getPopupContainer={() => containerRef.current || document.body}
              />
            </div>
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name="stockStatus"
                label="Stock Status"
                placeHolder="Select Status"
                selectionOptions={STOCK_STATUS_OPTIONS}
                value={filter?.stockStatus}
                setFilter={setFilter}
                allowClear
                getPopupContainer={() => containerRef.current || document.body}
              />
            </div>
          </FilterSection>
        </FilterDrawer>
      )}

      {/* ── Active filter tags ── */}
      {!showDateWise && (
        <CommonFilterTags
          filterClassName="!mb-0 border-t"
          searchParams={searchParams}
          setFilter={setFilter}
          updateUrlParams={updateUrlParams}
          handleClear={handleResetFilters}
          handleResetFilters={handleResetFilters}
          dateKeys={{ startDateKey: 'startDate', endDateKey: 'endDate' }}
          onDateClear={() => {
            setSelectedPreset('custom');
            setDateRange(null);
            updateUrlParams({ startDate: null, endDate: null, preset: null });
          }}
          extraFilters={{
            warehouseId: {
              label: 'Warehouse',
              format: value => warehouseDrop?.find(x => x?._id === value)?.name,
              clear: (setFilterFn, updateUrl) => {
                setFilterFn(prev => ({ ...prev, warehouseId: null }));
                updateUrl({ warehouseId: null });
              },
            },
            itemId: {
              label: 'Item',
              format: value => allItemDrop?.find(x => x?._id === value)?.itemName,
              clear: (setFilterFn, updateUrl) => {
                setFilterFn(prev => ({ ...prev, itemId: null }));
                updateUrl({ itemId: null });
              },
            },
            itemGroupId: {
              label: 'Item Group',
              format: value => itemGroupDrop?.find(x => x?._id === value)?.name,
              clear: (setFilterFn, updateUrl) => {
                setFilterFn(prev => ({ ...prev, itemGroupId: null }));
                updateUrl({ itemGroupId: null });
              },
            },
            stockStatus: {
              label: 'Stock Status',
              format: value => STOCK_STATUS_OPTIONS.find(x => x.value === value)?.label || value,
              clear: (setFilterFn, updateUrl) => {
                setFilterFn(prev => ({ ...prev, stockStatus: null }));
                updateUrl({ stockStatus: null });
              },
            },
          }}
        />
      )}

      <div className="px-4 pb-6 space-y-4">
        {/* ── KPI Cards ── */}
        {!showDateWise && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 border-t border-l border-gray-200">
            <KpiCard label="Total Items" value={kpis?.totalItems} icon={<Icons.InboxOutlined style={{ fontSize: 20 }} />} loading={loading} />
            <KpiCard label="Total Inward" value={kpis?.totalInward} icon={<Icons.PlusCircleOutlined style={{ fontSize: 20 }} />} loading={loading} />
            <KpiCard label="Total Outward" value={kpis?.totalOutward} icon={<Icons.MinusCircleOutlined style={{ fontSize: 20 }} />} loading={loading} />
            <KpiCard label="Net Movement" value={kpis?.netMovement} icon={<Icons.SwapOutlined style={{ fontSize: 20 }} />} loading={loading} />
            <KpiCard label="Low Stock" value={kpis?.lowStockCount} icon={<Icons.WarningOutlined style={{ fontSize: 20 }} />} loading={loading} />
          </div>
        )}

        {/* ── Summary view ── */}
        {!showDateWise && (
          <Section title={dateLabel ? `Stock Summary — ${dateLabel}` : 'Stock Summary'} extra={<span className="text-xs text-gray-400">Click Date-wise to drill down</span>}>
            <CustomTable
              columns={stockSummaryColumns(handleDateWiseClick, currentPage, currentLimit)}
              data={summaryRows}
              loading={loading}
              tableId={r => `${r.itemId}-${r.warehouseId}`}
              paginationClassName="!left-0"
              pagination={{
                current: parseInt(searchParams.get('page'), 10) || 1,
                pageSize: parseInt(searchParams.get('limit'), 10) || pagination?.limit || DEFAULT_PAGE_SIZE,
                total: pagination?.totalResults || 0,
                onChange: handlePaginationChange,
              }}
              locale={{ emptyText: <EmptyState text="No stock movement for the selected filters" /> }}
            />
          </Section>
        )}

        {/* ── Date-wise drill-down ── */}
        {showDateWise && (
          <Section title={`Date-wise Breakdown — ${dateWiseItem?.itemName || ''} / ${dateWiseItem?.warehouseName || ''}`}>
            <CustomTable
              columns={stockSummaryDateWiseColumns(dateWisePagination?.page || 1, dateWisePagination?.limit || DEFAULT_PAGE_SIZE)}
              data={dateWiseRows}
              loading={dateWiseLoading}
              tableId={r => r.date}
              paginationClassName="!left-0"
              pagination={{
                current: dateWisePagination?.page || 1,
                pageSize: dateWisePagination?.limit || DEFAULT_PAGE_SIZE,
                total: dateWisePagination?.totalResults || 0,
                onChange: handleDateWisePaginationChange,
              }}
              locale={{ emptyText: <EmptyState text="No date-wise movement for this item" /> }}
            />
          </Section>
        )}
      </div>

      <ExportDataModal
        modalOpen={showExportModal}
        setModalOpen={setShowExportModal}
        entityPlural="Stock Summary"
        defaultFileName="Stock_Summary_Export"
        exportLoading={exportLoading}
        onExport={handleExport}
        formName="export-stock-summary"
        formats={['xlsx']}
      />
    </div>
  );
};

export default ViewStockSummary;
