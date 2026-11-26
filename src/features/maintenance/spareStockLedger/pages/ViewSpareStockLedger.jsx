import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

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
import { useSparePart } from '@/features/maintenance/sparePart';
import { spareStockLedgerColumn, StockAdjustmentModal, useSpareStockLedger } from '@/features/maintenance/spareStockLedger';
import {
  DATE_KEYS,
  REFERENCE_TYPES,
  REFERENCE_TYPE_LABELS,
  TRANSACTION_TYPES,
  TRANSACTION_TYPE_LABELS,
  findById,
  recordId,
  sparePartOptionLabel,
} from '@/features/maintenance/spareStockLedger/spareStockLedger.utils';
import { CommonFilterTags, useFilters } from '@/utils/filtersUtils';
import { getAllFiltersFromLocalStorage } from '@/utils/filters';
import { getFromLocalStorage, getQueryParams, parsedTableCoulmns } from '@/utils/services';
import { FILTERS_KEYS, RESOURCES } from '@/utils/jsonFile';
import Icons from 'assets/icons/icon';
import { configEnum, filterInputEnum } from 'utils/constants';
import { PAGE_HEADERS } from '@/utils/label';

const API_CALLED_ENUM = {
  SPARE_PART_DROPDOWN: 'sparePartDropdown',
};

const ViewSpareStockLedger = () => {
  const { useModuleSparePart, isViewOnly } = useModulePermissions(RESOURCES.SPARE_PART);
  const { spareStockLedgers, pagination, loading, getSpareStockLedgers, resetSpareStockLedger } = useSpareStockLedger();
  const { sparePartDropdown, dropdownLoading: sparePartDropdownLoading, getSparePartDropdown } = useSparePart();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilter, setShowFilter] = useState(false);
  const [adjustmentOpen, setAdjustmentOpen] = useState(false);
  const FILTER_KEY = FILTERS_KEYS.SPARE_STOCK_LEDGER_ALL_FILTERS;
  const isApiCalledRef = useRef(false);
  const isApicalledRefFilter = useRef({
    sparePartDropdown: false,
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
      sparePartId: searchParams.get('sparePartId') || '',
      transactionType: searchParams.get('transactionType') || '',
      referenceType: searchParams.get('referenceType') || '',
    },
    dateKeys: DATE_KEYS,
  });

  const handleOnFocusApiCall = async type => {
    const called = { ...isApicalledRefFilter.current };

    if (type === API_CALLED_ENUM.SPARE_PART_DROPDOWN) {
      await getSparePartDropdown({});
      called.sparePartDropdown = true;
    }

    isApicalledRefFilter.current = called;
  };

  const fetchSpareStockLedgers = signal => {
    const page = parseInt(searchParams?.get('page'), 10) || 1;
    const pageSize = parseInt(searchParams?.get('limit'), 10) || pagination.limit;
    const sortBy = searchParams?.get('sortBy') || '';
    const payload = getQueryParams(window.location.href) || {};

    getSpareStockLedgers({
      page,
      limit: pageSize,
      search: payload.search || '',
      sortBy,
      sparePartId: payload.sparePartId || '',
      transactionType: payload.transactionType || '',
      referenceType: payload.referenceType || '',
      fromDate: payload.fromDate || '',
      toDate: payload.toDate || '',
      date: payload.date || '',
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
        } else if (savedFilters.date) {
          setDateRange([savedFilters.date, savedFilters.date]);
        }

        setFilter(prev => ({
          ...prev,
          search: savedFilters.search ?? prev.search,
          sparePartId: savedFilters.sparePartId ?? prev.sparePartId,
          transactionType: savedFilters.transactionType ?? prev.transactionType,
          referenceType: savedFilters.referenceType ?? prev.referenceType,
        }));

        if (savedFilters.sparePartId) {
          handleOnFocusApiCall(API_CALLED_ENUM.SPARE_PART_DROPDOWN);
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
    fetchSpareStockLedgers(controller.signal);
    return () => controller.abort();
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get('sparePartId')) {
      handleOnFocusApiCall(API_CALLED_ENUM.SPARE_PART_DROPDOWN);
    }
  }, []);

  useResetOnUnmount(resetSpareStockLedger);

  const columns = spareStockLedgerColumn();
  const columnsFromLocalStorage = getFromLocalStorage(configEnum?.SPARE_STOCK_LEDGER_CONFIG);
  const parsedColumnData = parsedTableCoulmns(columnsFromLocalStorage, columns);
  const displayColumn = parsedColumnData?.displayColumn?.filter(x => x?.visible === true);
  const [columnsList, setColumnsList] = useState(parsedColumnData?.displayColumn || []);
  const [customizedColumns, setCutomizedColumns] = useState([...(parsedColumnData?.customizedColumn?.length > 0 ? parsedColumnData.customizedColumn : displayColumn)]);

  const containerRef = useRef(null);
  const handleColumnResize = useColumnResize(setColumnsList, setCutomizedColumns, configEnum?.SPARE_STOCK_LEDGER_CONFIG);

  const { showColumnModal, setShowColumnModal, standardDropdownItems } = useDocumentListToolbar({
    columnConfigKey: configEnum?.SPARE_STOCK_LEDGER_CONFIG,
    filterKey: FILTER_KEY,
    showPreferences: false,
    columnsConfig: {
      getDefaultColumns: () => spareStockLedgerColumn(),
      setColumnsList,
      setCustomizedColumns: setCutomizedColumns,
    },
    handleResetFilters,
    onRefresh: () => fetchSpareStockLedgers(),
    setIsLocked,
  });

  const handleTransactionTypeTab = typeArr => {
    const next = Array.isArray(typeArr) ? typeArr.filter(Boolean) : [];
    const current = filter?.transactionType ? [filter.transactionType] : [];
    const added = next.find(value => !current.includes(value));
    const transactionType = added || '';
    setFilter(prev => ({ ...prev, transactionType }));
    updateUrlParams({ transactionType: transactionType || null, page: 1, limit: pagination?.limit });
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
          title={PAGE_HEADERS?.SPARE_STOCK_LEDGER?.title}
          rightStats={[
            { label: 'Total Issued Stock', value: pagination?.totalIssuedStock ?? 0 },
            { label: 'Total Received Stock', value: pagination?.totalReceivedStock ?? 0 },
          ]}
        />
        <div className="flex flex-wrap gap-2 md:gap-3 justify-center md:justify-end">
          <PermissionButton
            canAccess={!!useModuleSparePart?.create}
            isViewOnly={isViewOnly}
            type="primary"
            className="py-4 px-5"
            wrapperClassName="inline-block"
            text="Stock Adjustment"
            icon={<Icons.PlusCircleOutlined />}
            onClick={() => setAdjustmentOpen(true)}
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
          <StatusFilterTabs statuses={TRANSACTION_TYPES} value={filter?.transactionType} onChange={handleTransactionTypeTab} />
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
              <CustomDatePicker selectedPreset={selectedPreset} setSelectedPreset={setSelectedPreset} dateRange={dateRange} setDateRange={setDateRange} label="Date" />
            </div>
          </FilterSection>

          <FilterSection title="What">
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name="sparePartId"
                label="Spare Part"
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
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name="transactionType"
                label="Transaction Type"
                placeHolder="Select Type"
                selectionOptions={TRANSACTION_TYPES}
                value={filter?.transactionType}
                setFilter={setFilter}
                allowClear
              />
            </div>
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name="referenceType"
                label="Reference Type"
                placeHolder="Select Reference Type"
                selectionOptions={REFERENCE_TYPES}
                value={filter?.referenceType}
                setFilter={setFilter}
                allowClear
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
            updateUrlParams({ fromDate: null, toDate: null, date: null, preset: null });
          }}
          extraFilters={{
            sparePartId: {
              label: 'Spare Part',
              format: value => {
                const part = findById(sparePartDropdown, value);
                return part ? sparePartOptionLabel(part) : value;
              },
              clear: () => clearFilterValue('sparePartId'),
            },
            transactionType: {
              label: 'Type',
              format: value => TRANSACTION_TYPE_LABELS[value] || value,
              clear: () => clearFilterValue('transactionType'),
            },
            referenceType: {
              label: 'Reference',
              format: value => REFERENCE_TYPE_LABELS[value] || value,
              clear: () => clearFilterValue('referenceType'),
            },
          }}
        />
      </div>
      <div>
        <CustomTable
          columns={[
            ...customizedColumns.map(col => ({
              ...col,
              onHeaderCell: column => ({
                width: column.width,
                onResize: handleColumnResize(column.key || column.dataIndex),
              }),
            })),
          ]}
          data={spareStockLedgers}
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
        configPage={configEnum?.SPARE_STOCK_LEDGER_CONFIG}
        modalOpen={showColumnModal}
        setModalOpen={setShowColumnModal}
      />
      <StockAdjustmentModal open={adjustmentOpen} onClose={() => setAdjustmentOpen(false)} onSuccess={() => fetchSpareStockLedgers()} />
    </div>
  );
};

export default ViewSpareStockLedger;
