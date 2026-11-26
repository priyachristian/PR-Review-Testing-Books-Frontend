import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';

// Components
import { Button, InputNumber, Space } from '@/components/AntDComponent';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomDatePicker from '@/components/forms/formDatePicker/CustomDatePicker';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import FilterInput from '@/components/forms/formInput/FilterInput';

// Hooks
import useModulePermissions from 'hooks/useModulePermissions';

// Extras
import { useReport, getUpcomingPaymentsBucketColumns } from '@/features/reports';
import Icons from 'assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { filterInputEnum } from 'utils/constants';
import { dateFormateForBackend } from 'utils/services';
import { CommonFilterTags } from '@/utils/filtersUtils';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';
import { buildBranchSelectOptions, branchSelectColumnHeader } from '@/utils/tableSelectDropdown/orgSelectDropdown';

const DEFAULT_NUMBER_OF_COLUMNS = 4;
const DEFAULT_COLUMN_TYPE = 'days';
const DEFAULT_DURATION = 3;
const COLUMN_TYPE_OPTIONS = [
  { label: 'Days', value: 'days' },
  { label: 'Weeks', value: 'weeks' },
  { label: 'Months', value: 'months' },
];
const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

const defaultStartDate = () => dayjs().format('YYYY-MM-DD');
const defaultEndDate = () => dayjs().add(30, 'day').format('YYYY-MM-DD');
const clampColumns = value => Math.max(1, Math.min(8, value));

// Filters as they stand in the URL, with the report defaults where a value is missing.
const readFilterFromUrl = searchParams => {
  const numberOfColumns = Number(searchParams.get('numberOfColumns'));
  return {
    startDate: searchParams.get('startDate') || defaultStartDate(),
    endDate: searchParams.get('endDate') || defaultEndDate(),
    branchId: (searchParams.get('branchId') || '').split(',').filter(id => OBJECT_ID_PATTERN.test(id)),
    numberOfColumns: numberOfColumns ? clampColumns(numberOfColumns) : DEFAULT_NUMBER_OF_COLUMNS,
    columnType: searchParams.get('columnType') || DEFAULT_COLUMN_TYPE,
    duration: Number(searchParams.get('duration')) || DEFAULT_DURATION,
  };
};

const ViewUpcomingPaymentsReport = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const { upcomingPayments: data, upcomingPaymentsLoading: loading, getUpcomingPayments, clearUpcomingPayments } = useReport();
  const { allBranchDrop, allBranchLoading, getAllBranchDropDown } = useModulePermissions(RESOURCES.REPORTS);

  const [filter, setFilter] = useState(() => readFilterFromUrl(searchParams));
  const [showFilter, setShowFilter] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState('custom');
  const [page, setPage] = useState(1);
  const [currentPageRecords, setCurrentPageRecords] = useState([]);

  const abortControllerRef = useRef(null);
  const isApicalledRefFilter = useRef({ branchDropdown: false });
  const recordsPerPage = useRef(DEFAULT_PAGE_SIZE);

  const updateUrlParams = newParams => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length > 0) params.set(key, value.join(','));
        else params.delete(key);
      } else if (value !== null && value !== undefined && value !== '') {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    setSearchParams(params);
  };

  const handleFilter = () => {
    updateUrlParams(filter);
  };

  const handleClear = () => {
    const defaultFilter = {
      startDate: defaultStartDate(),
      endDate: defaultEndDate(),
      branchId: [],
      numberOfColumns: DEFAULT_NUMBER_OF_COLUMNS,
      columnType: DEFAULT_COLUMN_TYPE,
      duration: DEFAULT_DURATION,
    };
    setSelectedPreset('custom');
    setFilter(defaultFilter);
    updateUrlParams({ ...defaultFilter, sortBy: null });
  };

  const handleDateRangeChange = dates => {
    if (dates?.[0] && dates?.[1]) {
      setFilter(prev => ({ ...prev, startDate: dayjs(dates[0]).format('YYYY-MM-DD'), endDate: dayjs(dates[1]).format('YYYY-MM-DD') }));
    } else if (!dates) {
      setFilter(prev => ({ ...prev, startDate: defaultStartDate(), endDate: defaultEndDate() }));
    }
  };

  const formatBucketLabel = bucket => {
    const label = (bucket.label || '').trim();
    const match = label.match(/^(\d+)\s*-\s*(\d+)\s+(.+)$/i);
    if (!match) return label;
    const minValue = parseInt(match[1], 10);
    const maxValue = parseInt(match[2], 10);
    if (maxValue - minValue === 1) return `${maxValue} ${match[3]}`;
    if (minValue === maxValue) return `${minValue} ${match[3]}`;
    return label;
  };

  // An amount opens the bucket's invoices or bills, carrying the report filters along.
  const handleAmountClick = (bucket, type) => {
    const items = type === 'receivables' ? bucket.receivables : bucket.payables;
    if (!items.length) return;
    const params = new URLSearchParams();
    params.set('bucket', formatBucketLabel(bucket));
    params.set('startDate', filter.startDate);
    params.set('endDate', filter.endDate);
    if (filter.branchId.length > 0) params.set('branchId', filter.branchId.join(','));
    params.set('numberOfColumns', filter.numberOfColumns);
    params.set('columnType', filter.columnType);
    params.set('duration', filter.duration);
    navigate(`/reports/receivables-payables/${type}?${params.toString()}`);
  };

  const handleOnFocusApiCall = async () => {
    if (!isApicalledRefFilter.current.branchDropdown) {
      await getAllBranchDropDown({});
      isApicalledRefFilter.current.branchDropdown = true;
    }
  };

  const showPage = (buckets, pageNumber) => {
    const start = (pageNumber - 1) * recordsPerPage.current;
    setCurrentPageRecords(buckets.slice(start, start + recordsPerPage.current));
  };

  const handlePaginationChange = (newPage, limit) => {
    recordsPerPage.current = limit;
    setPage(newPage);
  };

  // Also fires on page changes; only a real sort change touches the URL (which refetches).
  const handleTableChange = (pagination, filters, sorter) => {
    const nextSortBy = sorter?.columnKey && sorter.order ? `${sorter.columnKey}:${sorter.order === 'ascend' ? 'asc' : 'desc'}` : null;
    if (nextSortBy !== searchParams.get('sortBy')) updateUrlParams({ sortBy: nextSortBy });
  };

  const fetchUpcomingPayments = useCallback(
    (signal, filterData, sortBy) =>
      getUpcomingPayments({
        startDate: dateFormateForBackend(filterData.startDate),
        endDate: dateFormateForBackend(filterData.endDate),
        numberOfColumns: filterData.numberOfColumns,
        columnType: filterData.columnType,
        duration: filterData.duration,
        branchId: filterData.branchId.length > 0 ? filterData.branchId : null,
        ...(sortBy && { sortBy }),
        signal,
      }),
    [getUpcomingPayments]
  );

  useEffect(() => {
    if (data?.buckets) showPage(data.buckets, page);
  }, [data, page]);

  useEffect(() => () => clearUpcomingPayments(), [clearUpcomingPayments]);

  // The URL is the source of truth: every filter, sort or reset change refetches from it.
  useEffect(() => {
    const urlFilter = readFilterFromUrl(searchParams);
    setFilter(urlFilter);
    setPage(1);

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    fetchUpcomingPayments(abortControllerRef.current.signal, urlFilter, searchParams.get('sortBy'));

    return () => abortControllerRef.current?.abort();
  }, [searchParams, fetchUpcomingPayments]);

  const resetColumnSettings = key => (setFilterFn, updateUrl) => {
    const defaults = { numberOfColumns: DEFAULT_NUMBER_OF_COLUMNS, columnType: DEFAULT_COLUMN_TYPE, duration: DEFAULT_DURATION };
    setFilterFn(prev => ({ ...prev, [key]: defaults[key] }));
    updateUrl({ [key]: null });
  };

  return (
    <div className="-m-4">
      <div className="flex justify-between items-center bg-white border-b border-gray-200 container-spacing sticky-page-header">
        <div className="flex items-center gap-3">
          <CustomButton type="default" text={<Icons.ArrowLeftOutlined />} onClick={() => navigate('/reports')} />
          <p className="font-bold text-[1.125rem]">Receivables / Payables</p>
        </div>
        <Button onClick={() => setShowFilter(!showFilter)}>{showFilter ? 'Hide Filters' : 'View Filters'}</Button>
      </div>

      {showFilter && (
        <div className="bg-white">
          <div className="container-spacing">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              <CustomDatePicker
                selectedPreset={selectedPreset}
                setSelectedPreset={setSelectedPreset}
                dateRange={[dayjs(filter.startDate), dayjs(filter.endDate)]}
                setDateRange={handleDateRangeChange}
                isMonthRange={false}
              />
              <div className="flex-grow" />
              <Space>
                <Button onClick={handleClear} className="p-[17px]">
                  Reset All
                </Button>
                <Button type="primary" icon={<Icons.FilterOutlined />} size="middle" className="p-[17px]" onClick={handleFilter}>
                  Apply Filters
                </Button>
              </Space>
            </div>
          </div>
          <div className="container-spacing border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <FilterInput
                  type={filterInputEnum?.SELECT}
                  mode="multiple"
                  name="branchId"
                  label="Branch"
                  placeHolder="Select Branch"
                  selectVariant="twoColumn"
                  columnSelectHeader={branchSelectColumnHeader}
                  selectionOptions={buildBranchSelectOptions(allBranchDrop)}
                  value={filter.branchId}
                  setFilter={setFilter}
                  allowClear={false}
                  loading={allBranchLoading}
                  onFocus={handleOnFocusApiCall}
                />
              </div>
              <div className="space-y-2">
                <div className="text-[13px] font-semibold text-gray-700">Number of Columns</div>
                <InputNumber
                  min={1}
                  max={8}
                  value={filter.numberOfColumns}
                  onChange={value => setFilter(prev => ({ ...prev, numberOfColumns: value ? clampColumns(value) : DEFAULT_NUMBER_OF_COLUMNS }))}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <FilterInput
                  type={filterInputEnum?.SELECT}
                  name="columnType"
                  label="Column Type"
                  placeHolder="Select Column Type"
                  selectionOptions={COLUMN_TYPE_OPTIONS}
                  value={filter.columnType}
                  setFilter={setFilter}
                  allowClear={false}
                />
              </div>
              <div className="space-y-2">
                <div className="text-[13px] font-semibold text-gray-700">Duration</div>
                <InputNumber min={1} max={100} value={filter.duration} onChange={value => setFilter(prev => ({ ...prev, duration: value || DEFAULT_DURATION }))} className="w-full" />
              </div>
            </div>
          </div>
        </div>
      )}

      <CommonFilterTags
        searchParams={searchParams}
        setFilter={setFilter}
        updateUrlParams={updateUrlParams}
        handleClear={handleClear}
        handleResetFilters={handleClear}
        dateKeys={{ startDateKey: 'startDate', endDateKey: 'endDate', singleDateKey: null }}
        onDateClear={() => {
          setFilter(prev => ({ ...prev, startDate: defaultStartDate(), endDate: defaultEndDate() }));
          updateUrlParams({ startDate: null, endDate: null });
        }}
        divDrop={allBranchDrop}
        branchDrop={allBranchDrop}
        extraFilters={{
          branchId: {
            label: 'Branch',
            format: value =>
              String(value)
                .split(',')
                .map(id => allBranchDrop?.find(branch => String(branch.id) === id)?.name)
                .filter(Boolean)
                .join(', '),
            clear: (setFilterFn, updateUrl) => {
              setFilterFn(prev => ({ ...prev, branchId: [] }));
              updateUrl({ branchId: [] });
            },
          },
          numberOfColumns: { label: 'Number of Columns', format: value => value, clear: resetColumnSettings('numberOfColumns') },
          columnType: {
            label: 'Column Type',
            format: value => COLUMN_TYPE_OPTIONS.find(option => option.value === value)?.label || value,
            clear: resetColumnSettings('columnType'),
          },
          duration: { label: 'Duration', format: value => value, clear: resetColumnSettings('duration') },
        }}
      />

      <CustomTable
        columns={getUpcomingPaymentsBucketColumns({ sortBy: searchParams.get('sortBy'), formatBucketLabel, onAmountClick: handleAmountClick })}
        data={currentPageRecords}
        loading={loading}
        tableId="label"
        pagination={{
          current: page,
          pageSize: recordsPerPage.current,
          total: data?.buckets?.length || 0,
          onChange: handlePaginationChange,
        }}
        showSizeChanger={false}
        onChange={handleTableChange}
      />
    </div>
  );
};

export default ViewUpcomingPaymentsReport;
