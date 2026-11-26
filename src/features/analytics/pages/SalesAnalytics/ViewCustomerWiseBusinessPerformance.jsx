import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Space, Tooltip } from 'antd';

import { CommonFilterTags } from '@/utils/filtersUtils';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomDatePicker from '@/components/forms/formDatePicker/CustomDatePicker';
import FilterInput from '@/components/forms/formInput/FilterInput';
import FilterDrawer, { FilterSection, FilterButton } from '@/components/ui/common/FilterDrawer';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import ExportDataModal from '@/components/ui/common/ExportDataModal';
import Toast from '@/components/ui/common/Toast';

import { useCustomer } from '@/features/sales/customer/useCustomer';
import useModulePermissions from '@/hooks/useModulePermissions';
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import { useMultiLocationFilters } from '@/hooks/useMultiLocationFilters';
import { useAnalytics, customerWiseBusinessPerformanceColumns } from '@/features/analytics';
import { analyticsService } from '@/features/analytics/analytics.service';
import { useSalesDashboard } from '@/hooks/useSalesDashboard';

import Icons from '@/assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { resetBranch } from '@/features/allMaster/warehouse/warehouse.slice';
import { ANALYTICS_TOOLTIPS, filterInputEnum } from '@/utils/constants';
import { dateFormateForBackend, getPresetDateRange, getQueryParams } from '@/utils/services';
import { colorPalette } from '@/utils/theme';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';
import { downloadBlobFile, resolveExportFileName } from '@/utils/exportData';
import { isCanceledRequestError } from '@/utils/serviceHelper';
import { buildDivisionSelectOptions, buildBranchSelectOptions, divisionSelectColumnHeader, branchSelectColumnHeader } from '@/utils/tableSelectDropdown/orgSelectDropdown';
import { buildCustomerSelectOptions, customerSelectColumnHeader, customerSelectDropdownProps } from '@/utils/tableSelectDropdown/customerSelectDropdown';

const API_CALLED_ENUM = {
  CUSTOMER_DROPDOWN: 'customerDropdown',
  DIVISION_DROPDOWN: 'divisionDropdown',
  USER_DROPDOWN: 'userDropdown',
};

const DEFAULT_COUNTRY = 'India';

const ViewCustomerWiseBusinessPerformance = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilter, setShowFilter] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(searchParams?.get('preset') || 'custom');

  const { getCustomerWiseBusinessPerformance, customerWiseBusinessPerformance, loading, pagination, resetCustomerWiseBusinessPerformance } = useAnalytics();

  const { divDrop, divisionLoading, getDivDropDown, branchDrop, branchLoading, getBranchDropDown } = useModulePermissions(RESOURCES.ANALYTICS);
  const { getCustomerDropList, customerDropDownList, loading: customerLoading } = useCustomer();
  const { userDropdown, userDropdownLoading, getUserDropdown } = useSalesDashboard();

  const isApicalledRefFilter = useRef({
    divisionDropdown: false,
    customerDropdown: false,
    userDropdown: false,
  });

  const getcustomDates = () => {
    if (searchParams?.get('startDate') && searchParams?.get('endDate')) {
      return [searchParams?.get('startDate'), searchParams?.get('endDate')];
    }
    return null;
  };

  const [dateRange, setDateRange] = useState(selectedPreset === 'custom' || selectedPreset === 'specific' ? getcustomDates() : getPresetDateRange(selectedPreset));
  const [filter, setFilter] = useState({
    division: searchParams.get('division')?.split(',') || '',
    branch: searchParams.get('branch')?.split(',') || '',
    customerId: searchParams.get('customerId') || '',
    addedBy: searchParams.get('addedBy') || '',
    country: DEFAULT_COUNTRY,
    state: searchParams.get('state') || '',
    city: searchParams.get('city') || '',
  });

  const userOptions = (userDropdown || []).map(u => ({
    label: u.name || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || '',
    value: u.id || u._id,
  }));

  const locationFilters = useMultiLocationFilters({
    country: filter?.country || DEFAULT_COUNTRY,
    state: filter?.state || '',
    city: filter?.city || '',
    setFilter,
  });

  useEffect(() => {
    const controller = new AbortController();
    const page = parseInt(searchParams?.get('page')) || 1;
    const pageSize = parseInt(searchParams?.get('limit')) || pagination.limit || DEFAULT_PAGE_SIZE;
    const payload = getQueryParams(window.location.href) || {};

    getCustomerWiseBusinessPerformance({ ...payload, page, limit: pageSize, signal: controller.signal });

    return () => controller.abort();
  }, [searchParams]);

  useResetOnUnmount(resetCustomerWiseBusinessPerformance);

  useEffect(() => {
    locationFilters.handleCountryFocus?.();
  }, []);

  const handleOnFocusApiCall = async type => {
    let obj = { ...isApicalledRefFilter.current };

    if (type === API_CALLED_ENUM.DIVISION_DROPDOWN) {
      await getDivDropDown({});
      obj.divisionDropdown = true;
    }

    if (type === API_CALLED_ENUM.CUSTOMER_DROPDOWN) {
      await getCustomerDropList({});
      obj.customerDropdown = true;
    }

    if (type === API_CALLED_ENUM.USER_DROPDOWN) {
      await getUserDropdown();
      obj.userDropdown = true;
    }

    isApicalledRefFilter.current = obj;
  };

  useEffect(() => {
    if (searchParams.get('division')) {
      handleOnFocusApiCall(API_CALLED_ENUM.DIVISION_DROPDOWN);
    }
  }, [filter?.division]);

  useEffect(() => {
    if (searchParams.get('customerId')) {
      handleOnFocusApiCall(API_CALLED_ENUM.CUSTOMER_DROPDOWN);
    }
  }, [filter?.customerId]);

  useEffect(() => {
    if (searchParams.get('addedBy') && !isApicalledRefFilter.current.userDropdown) {
      handleOnFocusApiCall(API_CALLED_ENUM.USER_DROPDOWN);
    }
  }, [filter?.addedBy]);

  useEffect(() => {
    if (searchParams.get('state')) {
      locationFilters.handleCountryFocus?.();
    }
  }, [filter?.state]);

  useEffect(() => {
    const controller = new AbortController();

    if (!filter?.division || filter?.division?.length <= 0) {
      dispatch(resetBranch());
    }

    if (filter?.division?.length > 0) {
      getBranchDropDown({ divisionId: filter?.division, signal: controller.signal });
    }
    return () => controller.abort();
  }, [filter?.division]);

  const updateUrlParams = newParams => {
    const params = new URLSearchParams(searchParams);

    if (!dateRange) {
      params.delete('startDate');
      params.delete('endDate');
    }

    Object.entries(newParams).forEach(([key, value]) => {
      if (key === 'country') return;
      if (Array.isArray(value)) {
        if (value.length > 0) {
          params.set(key, value.join(','));
        } else {
          params.delete(key);
        }
      } else if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    setSearchParams(params);
  };

  const handleFilter = () => {
    const startDate = dateFormateForBackend(dateRange?.[0]);
    const endDate = dateFormateForBackend(dateRange?.[1]);

    let updatedFilters = {
      division: filter.division,
      branch: filter.branch,
      customerId: filter.customerId,
      addedBy: filter.addedBy,
      state: filter.state,
      city: filter.city,
      page: 1,
      limit: pagination.limit || DEFAULT_PAGE_SIZE,
    };

    if (dateRange) {
      updatedFilters = {
        ...updatedFilters,
        preset: selectedPreset,
        startDate,
        endDate,
      };
    } else {
      updatedFilters = {
        ...updatedFilters,
        startDate: null,
        endDate: null,
        preset: '',
      };
    }

    updateUrlParams(updatedFilters);
  };

  const handleClear = () => {
    setFilter({
      division: null,
      branch: null,
      customerId: null,
      addedBy: null,
      country: DEFAULT_COUNTRY,
      state: '',
      city: '',
    });
    updateUrlParams({
      division: '',
      branch: '',
      customerId: '',
      addedBy: '',
      state: '',
      city: '',
      page: 1,
      limit: pagination.limit || DEFAULT_PAGE_SIZE,
      startDate: null,
      endDate: null,
      preset: '',
      sortBy: '',
    });
    setSelectedPreset('custom');
    setDateRange(null);
  };

  const getActiveFiltersCount = () => {
    return [
      searchParams.get('startDate'),
      searchParams.get('division'),
      searchParams.get('branch'),
      searchParams.get('customerId'),
      searchParams.get('addedBy'),
      searchParams.get('state'),
      searchParams.get('city'),
    ].filter(Boolean).length;
  };

  const containerRef = useRef(null);

  const handlePaginationChange = (page, pageSize) => {
    updateUrlParams({ page, limit: pageSize });
  };

  const handleTableChange = (tablePagination, filters, sorter) => {
    let sortParam = '';
    if (sorter?.field) {
      const direction = sorter.order === 'descend' ? 'desc' : 'asc';
      sortParam = `${sorter.field}:${direction}`;
    }

    updateUrlParams({
      page: tablePagination.current,
      limit: tablePagination.pageSize,
      sortBy: sortParam,
    });
  };

  const handleExport = async ({ fileName }) => {
    if (!customerWiseBusinessPerformance?.length && !(pagination?.totalRecords > 0)) {
      Toast.warning('No data available to export.');
      return;
    }

    const controller = new AbortController();
    setExportLoading(true);
    try {
      const params = getQueryParams(window.location.href) || {};
      const resolvedName = resolveExportFileName(fileName, 'Customer_Wise_Business_Performance');
      const blob = await analyticsService.exportCustomerWiseBusinessPerformance({
        ...params,
        fileName: resolvedName.replace(/\.xlsx$/i, ''),
        signal: controller.signal,
      });

      if (!(blob instanceof Blob) || blob.size === 0) {
        Toast.warning('No data available to export.');
        return;
      }

      if (blob.type && blob.type.includes('application/json')) {
        const text = await blob.text();
        const parsed = JSON.parse(text || '{}');
        throw new Error(parsed?.message || 'Failed to export. Please try again.');
      }

      downloadBlobFile(blob, resolvedName);
      setShowExportModal(false);
    } catch (error) {
      if (isCanceledRequestError(error)) return;
      console.error('Export error:', error);
      Toast.error(error?.message || 'Failed to export. Please try again.');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden -m-4">
      <div className="bg-white px-4 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        <div className="flex items-center gap-3">
          <CustomButton
            type="default"
            text={<Icons.ArrowLeftOutlined />}
            onClick={() => {
              navigate('/analytics');
            }}
          />
          <p className="font-bold text-[1.125rem]">Customer-wise Business Performance</p>
          <div className="pointer-events-auto cursor-pointer mt-1 inline-block">
            <Tooltip title={ANALYTICS_TOOLTIPS.CUSTOMER_WISE_BUSINESS_PERFORMANCE} placement="right">
              <Icons.InfoCircleOutlined style={{ color: colorPalette.primary[500] }} />
            </Tooltip>
          </div>
        </div>
        <div className="flex flex-wrap justify-center md:justify-end gap-2 md:gap-3 w-full md:w-auto">
          <Space>
            <FilterButton count={getActiveFiltersCount()} onClick={() => setShowFilter(true)} />
            <Button
              icon={<Icons.FileExcelOutlined />}
              onClick={() => setShowExportModal(true)}
              disabled={!customerWiseBusinessPerformance?.length && !(pagination?.totalRecords > 0)}
              loading={exportLoading}
            >
              Export
            </Button>
          </Space>
        </div>
      </div>

      <FilterDrawer
        open={showFilter}
        onClose={() => setShowFilter(false)}
        onApply={() => {
          handleFilter();
          setShowFilter(false);
        }}
        onReset={handleClear}
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
              name={'division'}
              label={'Division'}
              mode="multiple"
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
              getPopupContainer={() => containerRef.current || document.body}
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
              allowClear={false}
              disabled={!filter?.division}
              loading={branchLoading}
              getPopupContainer={() => containerRef.current || document.body}
            />
          </div>
          <div className="space-y-2">
            <FilterInput
              type={filterInputEnum?.SELECT}
              name={'customerId'}
              label={'Customer'}
              placeHolder={'Select Customer'}
              selectVariant="twoColumn"
              columnSelectHeader={customerSelectColumnHeader}
              selectPopupClassName={customerSelectDropdownProps.selectPopupClassName}
              selectionOptions={buildCustomerSelectOptions(customerDropDownList)}
              value={filter?.customerId}
              setFilter={setFilter}
              allowClear={true}
              loading={customerLoading}
              onFocus={() => {
                if (!isApicalledRefFilter.current.customerDropdown) {
                  handleOnFocusApiCall(API_CALLED_ENUM.CUSTOMER_DROPDOWN);
                }
              }}
              getPopupContainer={() => containerRef.current || document.body}
            />
          </div>
          <div className="space-y-2">
            <FilterInput
              type={filterInputEnum?.SELECT}
              name={'addedBy'}
              label={'Added By'}
              placeHolder={'Select User'}
              selectionOptions={userOptions}
              value={filter?.addedBy}
              setFilter={setFilter}
              allowClear={true}
              loading={userDropdownLoading}
              onFocus={() => {
                if (!isApicalledRefFilter.current.userDropdown) {
                  handleOnFocusApiCall(API_CALLED_ENUM.USER_DROPDOWN);
                }
              }}
              getPopupContainer={() => containerRef.current || document.body}
            />
          </div>
          <div className="space-y-2">
            <FilterInput
              type={filterInputEnum?.SELECT}
              name={'state'}
              label={'State'}
              placeHolder={'Select State'}
              selectionOptions={locationFilters.stateOptions}
              value={filter?.state}
              setFilter={setFilter}
              allowClear={true}
              extraFilterValues={{ city: '' }}
              loading={locationFilters.statesLoading}
              onFocus={locationFilters.handleCountryFocus}
              getPopupContainer={() => containerRef.current || document.body}
            />
          </div>
          <div className="space-y-2">
            <FilterInput
              type={filterInputEnum?.SELECT}
              name={'city'}
              label={'City'}
              placeHolder={'Select City'}
              selectionOptions={locationFilters.cityOptions}
              disabled={!filter?.state}
              value={filter?.city}
              setFilter={setFilter}
              allowClear={true}
              loading={locationFilters.citiesLoading}
              getPopupContainer={() => containerRef.current || document.body}
            />
          </div>
        </FilterSection>
      </FilterDrawer>

      <div className="bg-white px-4 py-0 pb-2 space-y-0">
        <CommonFilterTags
          filterClassName="!mb-0 border-t"
          searchParams={searchParams}
          setFilter={setFilter}
          updateUrlParams={updateUrlParams}
          handleClear={handleClear}
          handleResetFilters={handleClear}
          dateKeys={{
            startDateKey: 'startDate',
            endDateKey: 'endDate',
          }}
          onDateClear={() => {
            setSelectedPreset('custom');
            setDateRange(null);
            updateUrlParams({ startDate: null, endDate: null, preset: null });
          }}
          divDrop={divDrop}
          branchDrop={branchDrop}
          extraFilters={{
            customerId: {
              label: 'Customer',
              format: value => customerDropDownList?.find(x => x?._id === value)?.customerDisplayName,
              clear: (setFilterFn, updateUrl) => {
                setFilterFn(prev => ({ ...prev, customerId: null }));
                updateUrl({ customerId: null });
              },
            },
            addedBy: {
              label: 'Added By',
              format: value => userOptions.find(x => x.value === value)?.label || value,
              clear: (setFilterFn, updateUrl) => {
                setFilterFn(prev => ({ ...prev, addedBy: null }));
                updateUrl({ addedBy: null });
              },
            },
            state: {
              label: 'State',
              format: value => value,
              clear: (setFilterFn, updateUrl) => {
                setFilterFn(prev => ({ ...prev, state: '', city: '' }));
                updateUrl({ state: null, city: null });
              },
            },
            city: {
              label: 'City',
              format: value => value,
              clear: (setFilterFn, updateUrl) => {
                setFilterFn(prev => ({ ...prev, city: '' }));
                updateUrl({ city: null });
              },
            },
          }}
        />
      </div>

      <div className="bg-white">
        <CustomTable
          columns={customerWiseBusinessPerformanceColumns()}
          data={customerWiseBusinessPerformance}
          onChange={handleTableChange}
          tableId={record => record?.rowKey}
          loading={loading}
          paginationClassName="!left-0"
          pagination={{
            current: parseInt(searchParams.get('page')) || 1,
            pageSize: searchParams?.get('limit') || pagination?.limit,
            total: pagination?.totalRecords || 0,
            onChange: handlePaginationChange,
          }}
        />
      </div>

      <ExportDataModal
        modalOpen={showExportModal}
        setModalOpen={setShowExportModal}
        entityPlural="Customer-wise Business Performance"
        defaultFileName="Customer_Wise_Business_Performance"
        exportLoading={exportLoading}
        onExport={handleExport}
        formName="export-customer-wise-business-performance"
      />
    </div>
  );
};

export default ViewCustomerWiseBusinessPerformance;
