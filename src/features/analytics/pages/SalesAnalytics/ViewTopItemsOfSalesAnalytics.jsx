import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Tooltip } from 'antd';

// Components
import CustomButton from '@/components/ui/button/CustomButton';
import CustomDatePicker from '@/components/forms/formDatePicker/CustomDatePicker';
import FilterInput from '@/components/forms/formInput/FilterInput';
import FilterDrawer, { FilterSection, FilterButton } from '@/components/ui/common/FilterDrawer';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';

// Hooks
import useModulePermissions from '@/hooks/useModulePermissions';
import { useCustomer } from '@/features/sales/customer/useCustomer';
import { useItemGroup } from '@/features/allMaster/itemGroup';
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';

// Extras
import { useAnalytics, topItemsOfSalesColumns } from '@/features/analytics';
import Icons from '@/assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { resetBranch } from '@/features/allMaster/warehouse/warehouse.slice';
import { ANALYTICS_TOOLTIPS, filterInputEnum } from '@/utils/constants';
import { dateFormateForBackend, getPresetDateRange, getQueryParams } from '@/utils/services';
import { colorPalette } from '@/utils/theme';
import { CommonFilterTags, getCustomerFilterTag } from '@/utils/filtersUtils';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';
import { buildDivisionSelectOptions, buildBranchSelectOptions, divisionSelectColumnHeader, branchSelectColumnHeader } from '@/utils/tableSelectDropdown/orgSelectDropdown';
import { buildItemGroupSelectOptions, itemGroupSelectColumnHeader } from '@/utils/tableSelectDropdown/itemGroupSelectDropdown';
import { buildCustomerSelectOptions, customerSelectColumnHeader, customerSelectDropdownProps } from '@/utils/tableSelectDropdown/customerSelectDropdown';

const API_CALLED_ENUM = {
  DIVISION_DROPDOWN: 'divisionDropdown',
  CUSTOMER_DROPDOWN: 'customerDropdown',
  ITEM_GROUP_DROPDOWN: 'itemGroupDropdown',
};

const ViewTopItemsOfSalesAnalytics = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isSplitSessionActive = useSelector(state => state.common?.isSplitSessionActive);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilter, setShowFilter] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(searchParams?.get('preset') || 'custom');
  const { getTopItemsOfSalesAnalytics, loading, pagination, topItemsOfSalesAnalytics, resetTopItemsOfSalesAnalytics } = useAnalytics();
  const { divDrop, divisionLoading, getDivDropDown, branchDrop, branchLoading, getBranchDropDown } = useModulePermissions(RESOURCES.ANALYTICS);
  const { getCustomerDropList, customerDropDownList, loading: customerLoading } = useCustomer();
  const { itemGroupDrop, itemGroupDropLoading, getItemGroupDropdown } = useItemGroup();
  const isApicalledRefFilter = useRef({
    divisionDropdown: false,
    customerDropdown: false,
    itemGroupDropdown: false,
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
    customerId: searchParams.get('customerId')?.split(',') || '',
    itemGroup: searchParams.get('itemGroup')?.split(',') || '',
  });

  const fetchTopItemsOfSalesAnalytics = signal => {
    const page = parseInt(searchParams?.get('page')) || 1;
    const pageSize = parseInt(searchParams?.get('limit')) || pagination.limit || DEFAULT_PAGE_SIZE;
    const payload = getQueryParams(window.location.href) || {};

    getTopItemsOfSalesAnalytics({
      ...payload,
      page,
      limit: pageSize,
      isSplit: isSplitSessionActive || false,
      signal,
    });
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchTopItemsOfSalesAnalytics(controller.signal);
    return () => controller.abort();
  }, [searchParams, isSplitSessionActive]);

  useResetOnUnmount(resetTopItemsOfSalesAnalytics);

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

    if (type === API_CALLED_ENUM.ITEM_GROUP_DROPDOWN) {
      await getItemGroupDropdown({});
      obj.itemGroupDropdown = true;
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
    if (searchParams.get('itemGroup')) {
      handleOnFocusApiCall(API_CALLED_ENUM.ITEM_GROUP_DROPDOWN);
    }
  }, [filter?.itemGroup]);

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

  const updateUrlParams = newParams => {
    const params = new URLSearchParams(searchParams);

    if (!dateRange) {
      params.delete('startDate');
      params.delete('endDate');
    }

    Object.entries(newParams).forEach(([key, value]) => {
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

  const handleViewClick = record => {
    navigate(`/item-master/${record?.itemId}`);
  };

  const handleFilter = () => {
    const startDate = dateFormateForBackend(dateRange?.[0]);
    const endDate = dateFormateForBackend(dateRange?.[1]);

    let updatedFilters = {
      ...filter,
      page: 1,
      limit: pagination.limit || DEFAULT_PAGE_SIZE,
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
    setFilter({
      division: null,
      branch: null,
      customerId: null,
      itemGroup: null,
    });
    updateUrlParams({
      division: '',
      branch: '',
      customerId: '',
      itemGroup: '',
      page: 1,
      limit: pagination.limit || DEFAULT_PAGE_SIZE,
      startDate: null,
      endDate: null,
      preset: '',
    });
    setSelectedPreset('custom');
    setDateRange(null);
  };

  const getActiveFiltersCount = () => {
    return [
      searchParams.get('startDate') || searchParams.get('quoteDate'),
      searchParams.get('division'),
      searchParams.get('branch'),
      searchParams.get('customerId'),
      searchParams.get('itemGroup'),
    ].filter(Boolean).length;
  };

  const containerRef = useRef(null);

  const handlePaginationChange = (page, pageSize) => {
    updateUrlParams({ page, limit: pageSize });
  };

  const handleTableChange = (pagination, filters, sorter) => {
    let sortParam = '';
    if (sorter && sorter.field) {
      const direction = sorter.order === 'descend' ? 'desc' : 'asc';
      sortParam = `${sorter.field}:${direction}`;
    }

    updateUrlParams({
      page: pagination.current,
      limit: pagination.pageSize,
      sortBy: sortParam,
    });
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
          <p className="font-bold text-[1.125rem]">Top Items Of Sales</p>{' '}
          <div className="pointer-events-auto cursor-pointer mt-1 inline-block">
            <Tooltip title={ANALYTICS_TOOLTIPS.SALES_TOP_ITEMS} placement="right">
              <Icons.InfoCircleOutlined style={{ color: colorPalette.primary[500] }} />
            </Tooltip>
          </div>
        </div>
        <div className="flex flex-wrap justify-center md:justify-end gap-2 md:gap-3 w-full md:w-auto">
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
              mode="multiple"
              name={'customerId'}
              label={'Customer'}
              placeHolder={'Select Customer'}
              selectVariant="twoColumn"
              columnSelectHeader={customerSelectColumnHeader}
              selectPopupClassName={customerSelectDropdownProps.selectPopupClassName}
              selectionOptions={buildCustomerSelectOptions(customerDropDownList)}
              value={filter?.customerId}
              setFilter={setFilter}
              allowClear={false}
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
              mode="multiple"
              name={'itemGroup'}
              label={'Item Group'}
              placeHolder={'Select Item Group'}
              selectVariant="twoColumn"
              columnSelectHeader={itemGroupSelectColumnHeader}
              selectionOptions={buildItemGroupSelectOptions(itemGroupDrop)}
              value={filter?.itemGroup}
              setFilter={setFilter}
              allowClear={false}
              loading={itemGroupDropLoading}
              onFocus={() => {
                if (!isApicalledRefFilter.current.itemGroupDropdown) {
                  handleOnFocusApiCall(API_CALLED_ENUM.ITEM_GROUP_DROPDOWN);
                }
              }}
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
            singleDateKey: 'quoteDate',
          }}
          onDateClear={() => {
            setSelectedPreset('custom');
            setDateRange(null);
            updateUrlParams({ startDate: null, endDate: null, quoteDate: null, preset: null });
          }}
          divDrop={divDrop}
          branchDrop={branchDrop}
          extraFilters={{
            ...getCustomerFilterTag('Customer', customerDropDownList),
            itemGroup: {
              label: 'Item Group',
              format: value =>
                value
                  .split(',')
                  .map(id => itemGroupDrop?.find(x => x?.id === id)?.name)
                  .filter(Boolean)
                  .join(', '),
              clear: (setFilter, updateUrlParams) => {
                setFilter(prev => ({ ...prev, itemGroup: null }));
                updateUrlParams({ itemGroup: null });
              },
            },
          }}
        />
      </div>
      <div className="bg-white">
        <CustomTable
          columns={topItemsOfSalesColumns(isSplitSessionActive)}
          data={topItemsOfSalesAnalytics}
          onChange={handleTableChange}
          tableId={record => record?.itemId}
          loading={loading}
          onRowClick={handleViewClick}
          paginationClassName="!left-0"
          pagination={{
            current: parseInt(searchParams.get('page')) || 1,
            pageSize: searchParams?.get('limit') || pagination?.limit,
            total: pagination.totalRecords || 0,
            onChange: handlePaginationChange,
          }}
        />
      </div>
    </div>
  );
};

export default ViewTopItemsOfSalesAnalytics;
