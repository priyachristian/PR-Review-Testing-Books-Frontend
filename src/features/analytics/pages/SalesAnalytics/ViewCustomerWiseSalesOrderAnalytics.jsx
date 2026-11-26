import { useCallback, useEffect, useRef, useState } from 'react';
import { formatAmount } from '@/utils/currency';
import { useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Tabs, Tooltip } from 'antd';

// Components
import { CommonFilterTags } from '@/utils/filtersUtils';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomDatePicker from '@/components/forms/formDatePicker/CustomDatePicker';
import FilterInput from '@/components/forms/formInput/FilterInput';
import FilterDrawer, { FilterSection, FilterButton } from '@/components/ui/common/FilterDrawer';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';

// Hooks
import { useCustomer } from '@/features/sales/customer/useCustomer';
import useModulePermissions from '@/hooks/useModulePermissions';
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import { useSalesOrder } from '@/features/sales/salesOrder/useSalesOrder';

// Extras
import { customerWiseAnalysisColumn } from '@/features/analytics';
import Icons from '@/assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { resetBranch } from '@/features/allMaster/warehouse/warehouse.slice';
import { ANALYTICS_TOOLTIPS, filterInputEnum } from '@/utils/constants';
import { dateFormateForBackend, getPresetDateRange, getQueryParams } from '@/utils/services';
import { colorPalette } from '@/utils/theme';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';
import { buildDivisionSelectOptions, buildBranchSelectOptions, divisionSelectColumnHeader, branchSelectColumnHeader } from '@/utils/tableSelectDropdown/orgSelectDropdown';
import { buildCustomerSelectOptions, customerSelectColumnHeader, customerSelectDropdownProps } from '@/utils/tableSelectDropdown/customerSelectDropdown';

const API_CALLED_ENUM = {
  CUSTOMER_DROPDOWN: 'customerDropdown',
  DIVISION_DROPDOWN: 'divisionDropdown',
};
const PAGINATION_DEFAULTS = {
  oldCustomerPage: 1,
  newCustomerPage: 1,
  oldCustomerLimit: 10,
  newCustomerLimit: 10,
};

const ViewCustomerWiseSalesOrderAnalytics = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilter, setShowFilter] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(searchParams?.get('preset') || 'custom');
  const [activeTab, setActiveTab] = useState('oldCustomers');
  const { loading, newVsOldCustomerReport, getNewVsOldCustomerReport, oldCustomerPagination, newCustomerPagination, resetCustomerWiseSalesOrderAnalysis } = useSalesOrder();
  const { divDrop, divisionLoading, getDivDropDown, branchDrop, branchLoading, getBranchDropDown } = useModulePermissions(RESOURCES.ANALYTICS);
  const { getCustomerDropList, customerDropDownList, loading: customerLoading } = useCustomer();
  const isApicalledRefFilter = useRef({
    divisionDropdown: false,
    customerDropdown: false,
  });
  const getcustomDates = () => {
    if (searchParams?.get('startDate') && searchParams?.get('endDate')) {
      return [searchParams?.get('startDate'), searchParams?.get('endDate')];
    }
    if (searchParams?.get('quoteDate')) {
      return [searchParams?.get('quoteDate'), searchParams?.get('quoteDate')];
    }
    return null;
  };
  const [dateRange, setDateRange] = useState(selectedPreset === 'custom' || selectedPreset === 'specific' ? getcustomDates() : getPresetDateRange(selectedPreset));
  const [filter, setFilter] = useState({
    division: searchParams.get('division')?.split(',') || '',
    branch: searchParams.get('branch')?.split(',') || '',
    customerId: searchParams.get('customerId') || '',
  });

  useEffect(() => {
    const controller = new AbortController();
    const oldPage = parseInt(searchParams?.get('oldCustomerPage')) || 1;
    const oldLimit = parseInt(searchParams?.get('oldCustomerLimit')) || DEFAULT_PAGE_SIZE;
    const newPage = parseInt(searchParams?.get('newCustomerPage')) || 1;
    const newLimit = parseInt(searchParams?.get('newCustomerLimit')) || DEFAULT_PAGE_SIZE;

    const payload = getQueryParams(window.location.href) || {};

    getNewVsOldCustomerReport({
      ...payload,
      signal: controller.signal,
      oldPage,
      oldLimit,
      newPage,
      newLimit,
    });

    return () => controller.abort();
  }, [searchParams]);

  useResetOnUnmount(resetCustomerWiseSalesOrderAnalysis);

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

    isApicalledRefFilter.current = obj;
  };

  useEffect(() => {
    if (searchParams.get('division')) {
      handleOnFocusApiCall(API_CALLED_ENUM.DIVISION_DROPDOWN);
    }
  }, [filter?.division]);

  useEffect(() => {
    const controller = new AbortController();

    if (!filter?.division || filter?.division?.length <= 0) {
      dispatch(resetBranch());
    }

    if (filter?.division?.length > 0) {
      const payload = { divisionId: filter?.division, signal: controller.signal };
      getBranchDropDown(payload);
    }
    return () => controller.abort();
  }, [filter?.division]);

  useEffect(() => {
    if (searchParams.get('customerId')) {
      handleOnFocusApiCall(API_CALLED_ENUM.CUSTOMER_DROPDOWN);
    }
  }, [filter?.customerId]);

  const updateUrlParams = newParams => {
    const params = new URLSearchParams(searchParams);
    params.delete('page');
    params.delete('limit');

    if (!dateRange) {
      params.delete('startDate');
      params.delete('endDate');
    }

    Object.entries(newParams).forEach(([key, value]) => {
      if (Object.prototype.hasOwnProperty.call(PAGINATION_DEFAULTS, key)) {
        const numericValue = Number(value);
        if (!numericValue || numericValue === PAGINATION_DEFAULTS[key]) {
          params.delete(key);
        } else {
          params.set(key, String(numericValue));
        }
        return;
      }

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
    const oldLimit = parseInt(searchParams?.get('oldCustomerLimit')) || DEFAULT_PAGE_SIZE;
    const newLimit = parseInt(searchParams?.get('newCustomerLimit')) || DEFAULT_PAGE_SIZE;

    let updatedFilters = {
      ...filter,
      oldCustomerPage: 1,
      oldCustomerLimit: oldLimit,
      newCustomerPage: 1,
      newCustomerLimit: newLimit,
    };

    if (dateRange) {
      updatedFilters = {
        ...updatedFilters,
        preset: selectedPreset,
        startDate: startDate,
        endDate: endDate,
      };
    }

    updateUrlParams(updatedFilters);
  };

  const handleClear = () => {
    const oldLimit = parseInt(searchParams?.get('oldCustomerLimit')) || DEFAULT_PAGE_SIZE;
    const newLimit = parseInt(searchParams?.get('newCustomerLimit')) || DEFAULT_PAGE_SIZE;

    setFilter({
      customerId: null,
      division: null,
      branch: null,
    });
    updateUrlParams({
      customerId: '',
      division: '',
      branch: '',
      oldCustomerPage: 1,
      oldCustomerLimit: oldLimit,
      newCustomerPage: 1,
      newCustomerLimit: newLimit,
      startDate: null,
      endDate: null,
      preset: '',
    });
    setSelectedPreset('custom');
    setDateRange(null);
  };

  const getActiveFiltersCount = () => {
    return [searchParams.get('startDate') || searchParams.get('quoteDate'), searchParams.get('division'), searchParams.get('branch'), searchParams.get('customerId')].filter(Boolean).length;
  };

  const containerRef = useRef(null);

  const handleOldCustomerPaginationChange = (page, pageSize) => {
    updateUrlParams({ oldCustomerPage: page, oldCustomerLimit: pageSize });
  };

  const handleNewCustomerPaginationChange = (page, pageSize) => {
    updateUrlParams({ newCustomerPage: page, newCustomerLimit: pageSize });
  };

  const handleModuleClick = useCallback((record, moduleName) => {
    sessionStorage.setItem('analyticsCustomerId', record?.customerId);
    window.open(`/analytics/new-vs-old-customer/${moduleName}`, '_blank');
  }, []);

  const oldCustomerColumns = customerWiseAnalysisColumn(true, handleModuleClick);
  const newCustomerColumns = customerWiseAnalysisColumn(false, handleModuleClick);

  return (
    <div ref={containerRef} className="-m-4">
      <div className="flex justify-between items-center border-b bg-white sticky-page-header container-spacing">
        <div className="flex items-center gap-3">
          <CustomButton
            type="default"
            text={<Icons.ArrowLeftOutlined />}
            onClick={() => {
              navigate('/analytics');
            }}
          />
          <p className="font-bold text-[1.125rem]">New vs Old Customer Report</p>
          <div className="pointer-events-auto cursor-pointer mt-1 inline-block">
            <Tooltip title={ANALYTICS_TOOLTIPS.SALES_CUSTOMER_WISE} placement="right">
              <Icons.InfoCircleOutlined style={{ color: colorPalette.primary[500] }} />
            </Tooltip>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-4 items-center ">
          <div className="flex-grow" />
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
        </FilterSection>
      </FilterDrawer>

      <div className="bg-white">
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
            singleDateKey: 'quoteDate',
          }}
          onDateClear={() => {
            setSelectedPreset('custom');
            setDateRange(null);
            updateUrlParams({
              oldCustomerPage: 1,
              newCustomerPage: 1,
              startDate: null,
              endDate: null,
              quoteDate: null,
              preset: null,
            });
          }}
          divDrop={divDrop}
          branchDrop={branchDrop}
          extraFilters={{
            customerId: {
              label: 'Customer',
              format: value => customerDropDownList?.find(x => x?._id === value)?.customerDisplayName,
              clear: (setFilter, updateUrlParams) => {
                setFilter(prev => ({ ...prev, customerId: null }));
                updateUrlParams({ customerId: null });
              },
            },
          }}
        />
      </div>
      <div className="p-4" style={{ backgroundColor: colorPalette.neutral[50] }}>
        {/* Summary Cards as Tabs - Left Side Half Width */}
        <div className="w-full lg:w-1/2 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Card
              className={`flex-1 cursor-pointer transition-all duration-200 ${activeTab === 'oldCustomers' ? 'ring-2 ring-offset-2' : ''}`}
              bodyStyle={{ padding: '14px 16px' }}
              style={{
                borderColor: activeTab === 'oldCustomers' ? colorPalette.primary[500] : colorPalette.neutral[200],
                backgroundColor: '#ffffff',
                ...(activeTab === 'oldCustomers'
                  ? {
                      ringColor: colorPalette.primary[500],
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    }
                  : {
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    }),
              }}
              onClick={() => setActiveTab('oldCustomers')}
            >
              {/* Single row with all items */}
              <div className="flex items-center justify-between gap-4">
                <div style={{ minWidth: '80px' }}>
                  <p
                    className="font-bold uppercase"
                    style={{
                      color: colorPalette.neutral[700],
                      fontSize: '12px',
                      letterSpacing: '0.5px',
                      lineHeight: '1.3',
                    }}
                  >
                    OLD
                  </p>
                  <p
                    className="font-bold uppercase"
                    style={{
                      color: colorPalette.neutral[700],
                      fontSize: '12px',
                      letterSpacing: '0.5px',
                      lineHeight: '1.3',
                    }}
                  >
                    CUSTOMERS
                  </p>
                </div>

                {/* Divider */}
                <div
                  style={{
                    width: '1px',
                    height: '50px',
                    backgroundColor: colorPalette.neutral[300],
                  }}
                />
                <div className="text-center">
                  <p
                    style={{
                      color: colorPalette.neutral[900],
                      fontSize: '18px',
                      fontWeight: '700',
                      marginBottom: '4px',
                      lineHeight: '1',
                    }}
                  >
                    {newVsOldCustomerReport?.oldCustomersStats?.totalCustomers || 0}
                  </p>
                  <p
                    style={{
                      color: colorPalette.neutral[600],
                      fontSize: '11px',
                      fontWeight: '600',
                    }}
                  >
                    Customers
                  </p>
                </div>
                {/* Divider */}
                <div
                  style={{
                    width: '1px',
                    height: '50px',
                    backgroundColor: colorPalette.neutral[300],
                  }}
                />

                <div className="text-center">
                  <h3
                    style={{
                      color: colorPalette.neutral[900],
                      fontSize: '18px',
                      fontWeight: '700',
                      lineHeight: '1',
                      marginBottom: '4px',
                    }}
                  >
                    {newVsOldCustomerReport?.oldCustomersStats?.totalOrders || 0}
                  </h3>
                  <p
                    style={{
                      color: colorPalette.neutral[600],
                      fontSize: '11px',
                      fontWeight: '600',
                    }}
                  >
                    Orders
                  </p>
                </div>

                {/* Divider */}
                <div
                  style={{
                    width: '1px',
                    height: '50px',
                    backgroundColor: colorPalette.neutral[300],
                  }}
                />

                <div className="text-center" style={{ minWidth: '70px' }}>
                  <p
                    style={{
                      color: colorPalette.success[700],
                      fontSize: '16px',
                      fontWeight: '700',
                      marginBottom: '4px',
                      lineHeight: '1',
                    }}
                  >
                    {formatAmount(newVsOldCustomerReport?.oldCustomersStats?.totalRevenue || 0)}
                  </p>
                  <p
                    style={{
                      color: colorPalette.neutral[600],
                      fontSize: '11px',
                      fontWeight: '600',
                    }}
                  >
                    Revenue
                  </p>
                </div>
              </div>
            </Card>

            <Card
              className={`flex-1 cursor-pointer transition-all duration-200 ${activeTab === 'newCustomers' ? 'ring-2 ring-offset-2' : ''}`}
              bodyStyle={{ padding: '14px 16px' }}
              style={{
                borderColor: activeTab === 'newCustomers' ? colorPalette.success[500] : colorPalette.neutral[200],
                backgroundColor: '#ffffff',
                ...(activeTab === 'newCustomers'
                  ? {
                      ringColor: colorPalette.success[500],
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                    }
                  : {
                      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    }),
              }}
              onClick={() => setActiveTab('newCustomers')}
            >
              {/* Single row with all items */}
              <div className="flex items-center justify-between gap-4">
                <div style={{ minWidth: '80px' }}>
                  <p
                    className="font-bold uppercase"
                    style={{
                      color: colorPalette.neutral[700],
                      fontSize: '12px',
                      letterSpacing: '0.5px',
                      lineHeight: '1.3',
                    }}
                  >
                    NEW
                  </p>
                  <p
                    className="font-bold uppercase"
                    style={{
                      color: colorPalette.neutral[700],
                      fontSize: '12px',
                      letterSpacing: '0.5px',
                      lineHeight: '1.3',
                    }}
                  >
                    CUSTOMERS
                  </p>
                </div>

                {/* Divider */}
                <div
                  style={{
                    width: '1px',
                    height: '50px',
                    backgroundColor: colorPalette.neutral[300],
                  }}
                />

                <div className="text-center">
                  <p
                    style={{
                      color: colorPalette.neutral[900],
                      fontSize: '18px',
                      fontWeight: '700',
                      marginBottom: '4px',
                      lineHeight: '1',
                    }}
                  >
                    {newVsOldCustomerReport?.newCustomersStats?.totalCustomers || 0}
                  </p>
                  <p
                    style={{
                      color: colorPalette.neutral[600],
                      fontSize: '11px',
                      fontWeight: '600',
                    }}
                  >
                    Customers
                  </p>
                </div>

                {/* Divider */}
                <div
                  style={{
                    width: '1px',
                    height: '50px',
                    backgroundColor: colorPalette.neutral[300],
                  }}
                />

                <div className="text-center">
                  <h3
                    style={{
                      color: colorPalette.neutral[900],
                      fontSize: '18px',
                      fontWeight: '700',
                      lineHeight: '1',
                      marginBottom: '4px',
                    }}
                  >
                    {newVsOldCustomerReport?.newCustomersStats?.totalOrders || 0}
                  </h3>
                  <p
                    style={{
                      color: colorPalette.neutral[600],
                      fontSize: '11px',
                      fontWeight: '600',
                    }}
                  >
                    Orders
                  </p>
                </div>

                {/* Divider */}
                <div
                  style={{
                    width: '1px',
                    height: '50px',
                    backgroundColor: colorPalette.neutral[300],
                  }}
                />

                <div className="text-center" style={{ minWidth: '70px' }}>
                  <p
                    style={{
                      color: colorPalette.success[700],
                      fontSize: '16px',
                      fontWeight: '700',
                      marginBottom: '4px',
                      lineHeight: '1',
                    }}
                  >
                    {formatAmount(newVsOldCustomerReport?.newCustomersStats?.totalRevenue || 0)}
                  </p>
                  <p
                    style={{
                      color: colorPalette.neutral[600],
                      fontSize: '11px',
                      fontWeight: '600',
                    }}
                  >
                    Revenue
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="custom-card-tabs"
          renderTabBar={() => <div style={{ display: 'none' }} />}
          items={[
            {
              key: 'oldCustomers',
              children: (
                <CustomTable
                  columns={oldCustomerColumns}
                  data={newVsOldCustomerReport?.oldCustomers || []}
                  tableId={record => record?.customerId}
                  loading={loading}
                  paginationClassName="!left-0"
                  isPaginationFixed={true}
                  pagination={{
                    current: oldCustomerPagination?.page || 1,
                    pageSize: oldCustomerPagination?.limit || DEFAULT_PAGE_SIZE,
                    total: oldCustomerPagination?.totalResults || 0,
                    onChange: handleOldCustomerPaginationChange,
                    showSizeChanger: true,
                  }}
                  scroll={{ x: 'max-content' }}
                />
              ),
            },
            {
              key: 'newCustomers',
              children: (
                <CustomTable
                  columns={newCustomerColumns}
                  data={newVsOldCustomerReport?.newCustomers || []}
                  tableId={record => record?.customerId}
                  loading={loading}
                  paginationClassName="!left-0"
                  isPaginationFixed={true}
                  pagination={{
                    current: newCustomerPagination?.page || 1,
                    pageSize: newCustomerPagination?.limit || DEFAULT_PAGE_SIZE,
                    total: newCustomerPagination?.totalResults || 0,
                    onChange: handleNewCustomerPaginationChange,
                    showSizeChanger: true,
                  }}
                  scroll={{ x: 'max-content' }}
                />
              ),
            },
          ]}
        />
      </div>
    </div>
  );
};

export default ViewCustomerWiseSalesOrderAnalytics;
