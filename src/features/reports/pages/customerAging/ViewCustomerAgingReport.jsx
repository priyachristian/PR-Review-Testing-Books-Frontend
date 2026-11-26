import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useFormik } from 'formik';
import dayjs from 'dayjs';

// Components
import { Button, Input, Select } from '@/components/AntDComponent';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomDatePicker from '@/components/forms/formDatePicker/CustomDatePicker';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import FilterInput from '@/components/forms/formInput/FilterInput';

// Hooks
import { useCustomer } from '@/features/sales/customer/useCustomer';
import useModulePermissions from 'hooks/useModulePermissions';

// Extras
import { useReport, customerAgingReportValidateSchema } from '@/features/reports';
import Icons from 'assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { filterInputEnum } from 'utils/constants';
import { dateFormateForBackend, getQueryParams } from 'utils/services';
import { formatAmount } from '@/utils/currency';
import { CommonFilterTags } from '@/utils/filtersUtils';
import { colorPalette } from '@/utils/theme';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';
import { buildBranchSelectOptions, branchSelectColumnHeader } from '@/utils/tableSelectDropdown/orgSelectDropdown';
import { buildCustomerSelectOptions, customerSelectColumnHeader, customerSelectDropdownProps } from '@/utils/tableSelectDropdown/customerSelectDropdown';

const API_CALLED_ENUM = {
  BRANCH_DROPDOWN: 'branchDropdown',
  CUSTOMER_DROPDOWN: 'customerDropdown',
};

const ViewCustomerAgingReport = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [currentPageRecords, setCurrentPageRecords] = useState([]);
  const recordsPerPage = useRef(DEFAULT_PAGE_SIZE);
  const prevPageLimitRef = useRef(recordsPerPage.current);

  const { loading, customerAgingReport, getCustomerAging, clearCustomerAgingReport } = useReport();

  const { isSplitWise, isSplitSessionActive, allBranchDrop, allBranchLoading, getAllBranchDropDown } = useModulePermissions(RESOURCES.REPORTS);

  const { allCustomersDropDownList, getAllCustomersDropList, loading: customerLoading } = useCustomer();

  const [selectedPreset, setSelectedPreset] = useState(searchParams.get('preset') || 'custom');
  const [dateRange, setDateRange] = useState(() => {
    if (searchParams.get('startDate') && searchParams.get('endDate')) {
      return [dayjs(searchParams.get('startDate')).toDate(), dayjs(searchParams.get('endDate')).toDate()];
    }
    const today = dayjs().toDate();
    const lastMonth = dayjs().subtract(1, 'month').toDate();
    return [lastMonth, today];
  });

  const [showFilter, setShowFilter] = useState(true);
  const [filter, setFilter] = useState({
    branch: searchParams.get('branchId')?.split(',') || '',
    customer: searchParams.get('customerIds')?.split(',') || '',
    isSplit: searchParams.get('isSplit') === 'true',
  });

  const isApicalledRefFilter = useRef({
    branchDropdown: false,
    customerDropdown: false,
  });
  const isFirstSplitEffectRef = useRef(true);
  const hasSetInitialDatesRef = useRef(false);

  // Formik for aging-specific fields (numberOfColumns, columnType, duration)
  const formik = useFormik({
    initialValues: {
      reportType: 'customer',
      numberOfColumns: (() => {
        const urlValue = searchParams.get('numberOfColumns');
        if (urlValue) {
          const parsed = parseInt(urlValue);
          return isNaN(parsed) ? 5 : Math.max(1, Math.min(8, parsed));
        }
        return 5;
      })(),
      columnType: searchParams.get('columnType') || 'months',
      duration: searchParams.get('duration') ? parseInt(searchParams.get('duration')) : 5,
    },
    validationSchema: customerAgingReportValidateSchema,
    enableReinitialize: true,
  });

  const handleDateRangeChange = dates => {
    if (!dates) {
      setDateRange(null);
      return;
    }
    if (Array.isArray(dates)) {
      setDateRange(dates.map(d => (d ? (d.toDate ? d.toDate() : d) : null)));
    } else {
      setDateRange(dates);
    }
  };

  const handlePresetChange = preset => {
    setSelectedPreset(preset);
  };

  const handleOnFocusApiCall = async type => {
    let obj = { ...isApicalledRefFilter.current };

    if (type === API_CALLED_ENUM.BRANCH_DROPDOWN) {
      await getAllBranchDropDown({});
      obj.branchDropdown = true;
    }

    if (type === API_CALLED_ENUM.CUSTOMER_DROPDOWN) {
      await getAllCustomersDropList({});
      obj.customerDropdown = true;
    }

    isApicalledRefFilter.current = obj;
  };

  const handlePaginationChange = (page, limit) => {
    if (prevPageLimitRef.current !== limit) {
      recordsPerPage.current = limit;
      prevPageLimitRef.current = limit;
    }
    let finalRecords = getTableData();
    let recordNumberForNextPage = page === 1 ? 0 : (page - 1) * recordsPerPage.current;
    let updatedPageRecords = finalRecords?.slice(recordNumberForNextPage, recordsPerPage.current * page);
    setPage(page);
    setCurrentPageRecords(updatedPageRecords);
  };

  const handleTableChange = (pagination, filters, sorter) => {
    if (!sorter || !sorter.field || !sorter.order) {
      const currentSortBy = searchParams.get('sortBy');
      if (currentSortBy) {
        updateUrlParams({
          sortBy: null,
        });
      }
      return;
    }

    const direction = sorter.order === 'ascend' ? 'asc' : 'desc';
    const sortBy = `${sorter.field}:${direction}`;

    updateUrlParams({
      sortBy: sortBy,
    });
  };

  // Initialize currentPageRecords when data changes
  useEffect(() => {
    const tableData = getTableData();
    if (tableData.length > 0) {
      const initialRecords = tableData.slice(0, recordsPerPage.current);
      setCurrentPageRecords(initialRecords);
      setPage(1);
    } else {
      setCurrentPageRecords([]);
    }
  }, [customerAgingReport]);

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
        params.set(key, String(value));
      } else {
        params.delete(key);
      }
    });

    setSearchParams(params);
  };

  const handleClear = () => {
    setFilter({
      branch: '',
      customer: '',
      isSplit: false,
    });
    setShowFilter(true);
    formik.setValues({
      reportType: 'customer',
      numberOfColumns: 5,
      columnType: 'months',
      duration: 5,
    });
    setSelectedPreset('custom');
    setDateRange(null);
    updateUrlParams({
      branchId: '',
      customerIds: '',
      numberOfColumns: 5,
      columnType: 'months',
      duration: 5,
      startDate: '',
      endDate: '',
      isSplit: '',
    });
  };

  const handleFilter = async () => {
    const startDate = dateRange?.[0] ? dateFormateForBackend(dateRange[0]) : null;
    const endDate = dateRange?.[1] ? dateFormateForBackend(dateRange[1]) : null;

    const branchIdStr = Array.isArray(filter?.branch) ? filter.branch.join(',') : filter?.branch || '';
    const customerIdsStr = Array.isArray(filter?.customer) ? filter.customer.join(',') : filter?.customer || '';

    const updatedFilters = {
      branchId: branchIdStr,
      customerIds: customerIdsStr,
      startDate,
      endDate,
      numberOfColumns: formik.values.numberOfColumns,
      columnType: formik.values.columnType,
      duration: formik.values.duration,
      isSplit: filter?.isSplit,
    };

    if (!isSplitSessionActive && isSplitWise) {
      updatedFilters.isSplit = false;
      setFilter(prev => ({
        ...prev,
        isSplit: false,
      }));
    }

    setShowFilter(false);
    updateUrlParams(updatedFilters);
    setPage(1);
  };

  useEffect(() => {
    if (!hasSetInitialDatesRef.current && !searchParams.get('startDate') && !searchParams.get('endDate')) {
      hasSetInitialDatesRef.current = true;
      updateUrlParams({
        startDate: dateFormateForBackend(dayjs().subtract(1, 'month').toDate()),
        endDate: dateFormateForBackend(dayjs().toDate()),
      });
    }
  }, []);

  const fetchCustomerAgingReport = signal => {
    let payload = getQueryParams(window.location.href);
    payload = payload || {};

    const numberOfColumns = parseInt(payload.numberOfColumns) || 5;
    const columnType = payload.columnType || 'months';
    const duration = parseInt(payload.duration) || 5;

    const finalPayload = {
      signal,
      numberOfColumns,
      columnType,
      duration,
      ...(payload.customerIds && { customerIds: payload.customerIds.split(',') }),
      ...(payload.branchId && { branchId: payload.branchId.split(',') }),
      ...(payload.sortBy && { sortBy: payload.sortBy }),
    };
    if (payload.startDate && payload.endDate) {
      finalPayload.startDate = payload.startDate;
      finalPayload.endDate = payload.endDate;
    }

    const splitToggleOn = payload?.isSplit === true || payload?.isSplit === 'true';

    getCustomerAging({
      ...finalPayload,
      isSplit: isSplitSessionActive ? true : false,
      splitOnly: isSplitSessionActive && isSplitWise && splitToggleOn ? true : false,
    });
  };

  useEffect(() => {
    if (isFirstSplitEffectRef.current) {
      isFirstSplitEffectRef.current = false;
      return;
    }
    if (!isSplitSessionActive && isSplitWise) {
      handleFilter();
    }
  }, [isSplitSessionActive]);

  useEffect(() => {
    if (!searchParams.get('startDate') || !searchParams.get('endDate')) {
      return;
    }

    const controller = new AbortController();
    fetchCustomerAgingReport(controller.signal);

    return () => {
      controller.abort();
      clearCustomerAgingReport();
    };
  }, [searchParams, isSplitSessionActive]);

  useEffect(() => {
    if (searchParams.get('branchId')) {
      handleOnFocusApiCall(API_CALLED_ENUM.BRANCH_DROPDOWN);
    }
  }, []);

  useEffect(() => {
    if (searchParams.get('customerIds')) {
      handleOnFocusApiCall(API_CALLED_ENUM.CUSTOMER_DROPDOWN);
    }
  }, []);

  const formatBucketLabel = bucket => {
    const labelToCheck = (bucket.label || bucket.bucket || '').trim();

    const singleValuePattern = /^(\d+)\s*-\s*(\d+)\s+(.+)$/i;
    const match = labelToCheck.match(singleValuePattern);

    if (match) {
      const minValue = parseInt(match[1], 10);
      const maxValue = parseInt(match[2], 10);
      const unit = match[3];

      if (minValue === maxValue) {
        return `${minValue} ${unit}`;
      }
      if (minValue === 0 && maxValue === 1) {
        return `1 ${unit}`;
      }
    }

    return bucket.label || bucket.bucket || '';
  };

  const handleBucketClick = (bucket, customer) => {
    const startDate = searchParams.get('startDate') || null;
    const endDate = searchParams.get('endDate') || null;

    const columnType = searchParams.get('columnType') || formik.values.columnType || 'months';
    const formattedLabel = formatBucketLabel(bucket);

    const params = new URLSearchParams({
      minDays: bucket.minDays.toString(),
      customerId: customer.entityId,
      customerName: customer.entityName,
      bucketLabel: formattedLabel,
      bucketAmount: (bucket.amount || 0).toString(),
    });
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);

    if (bucket.maxDays !== null && bucket.maxDays !== undefined) {
      params.append('maxDays', bucket.maxDays.toString());
    }

    const branchId = searchParams.get('branchId');
    const customerIds = searchParams.get('customerIds');
    const numberOfColumns = searchParams.get('numberOfColumns');
    const duration = searchParams.get('duration');
    const sortBy = searchParams.get('sortBy');

    if (branchId) params.append('branchId', branchId);
    if (customerIds) params.append('customerIds', customerIds);
    if (numberOfColumns) params.append('numberOfColumns', numberOfColumns);
    if (columnType) params.append('columnType', columnType);
    if (duration) params.append('duration', duration);
    if (sortBy) params.append('sortBy', sortBy);
    const isSplit = searchParams.get('isSplit');
    if (isSplit) params.append('isSplit', isSplit);

    navigate(`/reports/customer-aging-bucket?${params.toString()}`);
  };

  const getTableColumns = () => {
    if (!customerAgingReport?.agingBuckets) return [];

    const sortBy = searchParams.get('sortBy') || '';
    const [sortField, sortOrder] = sortBy ? sortBy.split(':') : [null, null];

    const baseColumns = [
      {
        title: 'Customer Name',
        dataIndex: 'entityName',
        key: 'entityName',
        fixed: 'left',
        width: 200,
        sorter: false,
      },
      {
        title: 'Completed',
        dataIndex: 'completedCount',
        key: 'completedCount',
        width: 100,
        align: 'right',
        render: value => value || 0,
        sorter: true,
        sortOrder: sortField === 'completedCount' ? (sortOrder === 'asc' ? 'ascend' : 'descend') : null,
      },
    ];

    const bucketColumns = customerAgingReport.agingBuckets.map((bucket, index) => ({
      title: formatBucketLabel(bucket),
      dataIndex: `bucket_${index}`,
      key: `bucket_${index}`,
      width: 120,
      align: 'right',
      sorter: true,
      sortOrder: sortField === `bucket_${index}` ? (sortOrder === 'asc' ? 'ascend' : 'descend') : null,
      render: (value, record) => {
        if (record.key === 'summary') {
          return <strong>{formatAmount(value || 0)}</strong>;
        }
        const amount = value || 0;
        return amount > 0 ? (
          <button
            type="button"
            onClick={() => handleBucketClick({ ...bucket, amount }, record)}
            style={{
              cursor: 'pointer',
              color: colorPalette.primary[500],
              background: 'none',
              border: 'none',
              padding: 0,
              // textDecoration: 'underline',
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleBucketClick({ ...bucket, amount }, record);
              }
            }}
          >
            {formatAmount(amount)}
          </button>
        ) : (
          formatAmount(amount)
        );
      },
    }));

    const totalColumn = {
      title: 'Total Outstanding',
      dataIndex: 'totalOutstanding',
      key: 'totalOutstanding',
      width: 150,
      align: 'right',
      render: value => <strong>{formatAmount(value || 0)}</strong>,
      sorter: true,
      sortOrder: sortField === 'totalOutstanding' ? (sortOrder === 'asc' ? 'ascend' : 'descend') : null,
    };

    return [...baseColumns, ...bucketColumns, totalColumn];
  };

  const getTableData = () => {
    if (!customerAgingReport?.details) return [];

    return customerAgingReport.details.map((detail, index) => {
      const rowData = {
        key: `entity_${index}`,
        entityId: detail.entityId,
        entityName: detail.entityName || 'N/A',
        completedCount: detail.completedCount || 0,
        totalOutstanding: detail.totalOutstanding || 0,
      };

      if (customerAgingReport.agingBuckets) {
        customerAgingReport.agingBuckets.forEach((bucket, bucketIndex) => {
          rowData[`bucket_${bucketIndex}`] = 0;
        });
      }

      if (detail.items && Array.isArray(detail.items) && detail.items.length > 0 && customerAgingReport.agingBuckets) {
        detail.items.forEach(item => {
          if (item.bucket || item.bucketLabel) {
            const bucketIndex = customerAgingReport.agingBuckets.findIndex(b => b.bucket === item.bucket || b.label === item.bucketLabel);
            if (bucketIndex >= 0) {
              const key = `bucket_${bucketIndex}`;
              // Use totalAmount for completed invoices (balanceAmount is 0 for completed)
              rowData[key] = (rowData[key] || 0) + (item.totalAmount || 0);
            }
          }
        });
      }

      return rowData;
    });
  };

  const getSummaryRow = () => {
    if (!customerAgingReport) return null;

    const { summary, agingBuckets } = customerAgingReport;
    const summaryData = {
      key: 'summary',
      entityName: 'Total',
      completedCount: summary?.totalCompleted || 0,
      totalOutstanding: summary?.totalOutstanding || 0,
    };

    agingBuckets?.forEach((bucket, index) => {
      summaryData[`bucket_${index}`] = bucket.amount || 0;
    });

    return summaryData;
  };

  const handleNumberOfColumnsChange = e => {
    const inputValue = e.target.value;
    if (inputValue === '') {
      formik.setFieldValue('numberOfColumns', '');
      return;
    }

    const numValue = parseInt(inputValue, 10);
    if (isNaN(numValue)) {
      return;
    }

    const clampedValue = Math.max(1, Math.min(8, numValue));
    formik.setFieldValue('numberOfColumns', clampedValue);
  };

  return (
    <div className="-m-4">
      <div className="flex justify-between items-center bg-white border-b border-gray-200 container-spacing sticky-page-header">
        <div className="flex items-center gap-3">
          <CustomButton
            type="default"
            text={<Icons.ArrowLeftOutlined />}
            onClick={() => {
              navigate('/reports');
            }}
          />
          <p className="font-bold text-[1.125rem]">Customer Aging Report</p>
        </div>
        <Button
          onClick={() => {
            setShowFilter(!showFilter);
          }}
        >
          {showFilter ? 'Hide Filters' : 'View Filters'}
        </Button>
      </div>

      {showFilter && (
        <div className="bg-white border-t px-4  border-b space-y-3">
          <div className="container-spacing bg-white">
            {/* First Row: Date Range and Buttons */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end mb-4">
              <div className="space-y-2">
                <CustomDatePicker selectedPreset={selectedPreset} setSelectedPreset={handlePresetChange} dateRange={dateRange} setDateRange={handleDateRangeChange} />
              </div>
              <div className="flex-grow" />
              <div className="flex gap-3">
                <Button onClick={handleClear} className="p-[17px]">
                  Reset All
                </Button>
                <Button type="primary" icon={<Icons.FilterOutlined />} size="middle" className="p-[17px]" onClick={handleFilter} loading={loading} disabled={loading}>
                  Apply Filters
                </Button>
              </div>
            </div>

            {/* Second Row: Branch, Customer, Column Type, Number of Columns, Duration */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-5 gap-4 pt-4 border-t border-gray-200">
              <div className="space-y-2">
                <FilterInput
                  type={filterInputEnum?.SELECT}
                  mode="multiple"
                  name="branch"
                  label="Branch"
                  placeHolder="Select Branch"
                  selectVariant="twoColumn"
                  columnSelectHeader={branchSelectColumnHeader}
                  selectionOptions={buildBranchSelectOptions(allBranchDrop)}
                  value={filter?.branch}
                  setFilter={setFilter}
                  allowClear={false}
                  loading={allBranchLoading}
                  onFocus={() => {
                    if (!isApicalledRefFilter.current.branchDropdown) {
                      handleOnFocusApiCall(API_CALLED_ENUM.BRANCH_DROPDOWN);
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <FilterInput
                  type={filterInputEnum?.SELECT}
                  mode="multiple"
                  name="customer"
                  label="Customer"
                  placeHolder="Select Customer"
                  selectVariant="twoColumn"
                  columnSelectHeader={customerSelectColumnHeader}
                  selectPopupClassName={customerSelectDropdownProps.selectPopupClassName}
                  selectionOptions={buildCustomerSelectOptions(allCustomersDropDownList)}
                  value={filter?.customer}
                  setFilter={setFilter}
                  allowClear={true}
                  loading={customerLoading}
                  onFocus={() => {
                    if (!isApicalledRefFilter.current.customerDropdown) {
                      handleOnFocusApiCall(API_CALLED_ENUM.CUSTOMER_DROPDOWN);
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <div className="text-[13px] font-semibold text-gray-700">Column Type</div>
                <Select
                  id="columnType"
                  className="w-full [&_.ant-select-selector]:!h-[35px]"
                  value={formik.values.columnType}
                  onChange={value => formik.setFieldValue('columnType', value)}
                  options={[
                    { label: 'Days', value: 'days' },
                    { label: 'Weeks', value: 'weeks' },
                    { label: 'Months', value: 'months' },
                  ]}
                />
                {formik.errors.columnType && formik.touched.columnType && <div className="text-red-500 text-xs mt-1">{formik.errors.columnType}</div>}
              </div>
              <div className="space-y-2">
                <div className="text-[13px] font-semibold text-gray-700">Number of Columns</div>
                <Input
                  id="numberOfColumns"
                  type="number"
                  min={1}
                  max={8}
                  className="w-full h-[35px]"
                  value={formik.values.numberOfColumns}
                  onChange={handleNumberOfColumnsChange}
                  onBlur={() => {
                    const value = formik.values.numberOfColumns;
                    if (value === '' || value === null || value === undefined) {
                      formik.setFieldValue('numberOfColumns', 1);
                    }
                  }}
                />
                {formik.errors.numberOfColumns && formik.touched.numberOfColumns && <div className="text-red-500 text-xs mt-1">{formik.errors.numberOfColumns}</div>}
              </div>
              <div className="space-y-2">
                <div className="text-[13px] font-semibold text-gray-700">Duration</div>
                <Input id="duration" type="number" min={1} className="w-full h-[35px]" value={formik.values.duration} onChange={e => formik.setFieldValue('duration', parseInt(e.target.value) || 1)} />
                {formik.errors.duration && formik.touched.duration && <div className="text-red-500 text-xs mt-1">{formik.errors.duration}</div>}
              </div>
            </div>
            {isSplitWise && isSplitSessionActive ? (
              <div className="flex items-center gap-x-4 pt-4 border-t border-gray-200">
                <FilterInput type={filterInputEnum?.SWITCH} name="isSplit" value={filter?.isSplit} setFilter={setFilter} allowClear={true} />
                <div>Split</div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      <CommonFilterTags
        searchParams={searchParams}
        setFilter={setFilter}
        updateUrlParams={updateUrlParams}
        handleClear={handleClear}
        handleResetFilters={handleClear}
        dateKeys={{
          startDateKey: 'startDate',
          endDateKey: 'endDate',
          singleDateKey: null,
        }}
        onDateClear={() => {
          setSelectedPreset('custom');
          setDateRange(null);
          updateUrlParams({
            startDate: null,
            endDate: null,
          });
        }}
        divDrop={allBranchDrop}
        branchDrop={allBranchDrop}
        extraFilters={{
          branchId: {
            label: 'Branch',
            format: value => {
              const ids = String(value).split(',').filter(Boolean);
              return ids
                .map(id => allBranchDrop?.find(b => String(b.id) === String(id))?.name)
                .filter(Boolean)
                .join(', ');
            },
            clear: (setFilter, updateUrlParams) => {
              setFilter(prev => ({
                ...prev,
                branch: '',
              }));
              updateUrlParams({
                branchId: '',
              });
            },
          },
          customerIds: {
            label: 'Customer',
            format: value => {
              const ids = String(value).split(',').filter(Boolean);
              return ids
                .map(id => allCustomersDropDownList?.find(c => String(c.id) === String(id))?.customerDisplayName)
                .filter(Boolean)
                .join(', ');
            },
            clear: (setFilter, updateUrlParams) => {
              setFilter(prev => ({
                ...prev,
                customer: '',
              }));
              updateUrlParams({
                customerIds: '',
              });
            },
          },
          isSplit: {
            label: 'Split',
            format: value => (String(value) === 'true' ? 'On' : 'Off'),
            clear: (setFilterFn, updateUrl) => {
              setFilterFn(prev => ({
                ...prev,
                isSplit: false,
              }));
              updateUrl({
                isSplit: false,
              });
            },
          },
        }}
      />

      <div className="">
        <CustomTable
          columns={getTableColumns()}
          loading={loading}
          data={[...currentPageRecords, getSummaryRow()].filter(Boolean)}
          scroll={{ x: 'max-content' }}
          pagination={{
            current: page,
            pageSize: recordsPerPage.current,
            total: getTableData().length || 0,
            onChange: handlePaginationChange,
          }}
          showSizeChanger={false}
          onChange={handleTableChange}
        />
      </div>
    </div>
  );
};

export default ViewCustomerAgingReport;
