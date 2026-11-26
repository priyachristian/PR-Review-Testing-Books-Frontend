import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Tooltip } from 'antd';

// Components
import { CommonFilterTags } from '@/utils/filtersUtils';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomDatePicker from '@/components/forms/formDatePicker/CustomDatePicker';
import FilterInput from '@/components/forms/formInput/FilterInput';
import FilterDrawer, { FilterSection, FilterButton } from '@/components/ui/common/FilterDrawer';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import PageHeader from '@/components/ui/common/PageHeader';

// Hooks
import { useCustomer } from '@/features/sales/customer/useCustomer';
import ItemDrawerDetails from '@/features/allMaster/item/components/ItemDrawerDetails';
import useModulePermissions from '@/hooks/useModulePermissions';
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import { useSalesOrder } from '@/features/sales/salesOrder/useSalesOrder';

// Extras
import { customerWiseSalesOrderAnalysisColumn, customerWiseSalesOrderAnalysisItemColumn } from '@/features/analytics';
import Icons from '@/assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { resetBranch } from '@/features/allMaster/warehouse/warehouse.slice';
import { ANALYTICS_TOOLTIPS, filterInputEnum } from '@/utils/constants';
import { dateFormateForBackend, getPresetDateRange, getQueryParams } from '@/utils/services';
import { formatAmount } from '@/utils/currency';
import { colorPalette } from '@/utils/theme';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';
import { buildDivisionSelectOptions, buildBranchSelectOptions, divisionSelectColumnHeader, branchSelectColumnHeader } from '@/utils/tableSelectDropdown/orgSelectDropdown';
import { buildCustomerSelectOptions, customerSelectColumnHeader, customerSelectDropdownProps } from '@/utils/tableSelectDropdown/customerSelectDropdown';
import { buildItemFilterSelectOptions, itemSelectColumnHeader, itemSelectDropdownProps } from '@/utils/tableSelectDropdown/itemSelectDropdown';

const API_CALLED_ENUM = {
  ITEM_DROPDOWN: 'itemDropdown',
  CUSTOMER_DROPDOWN: 'customerDropdown',
  DIVISION_DROPDOWN: 'divisionDropdown',
};

const ViewCustomerWisePendingOrderAnalytics = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilter, setShowFilter] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(searchParams?.get('preset') || 'custom');
  const { customerWiseSalesOrderAnalysis, getCustomerWiseSalesOrderAnalysis, customerWiseSalesOrderAnalysisPagination, loading, resetCustomerWisePendingOrderAnalysis } = useSalesOrder();
  const {
    divDrop,
    divisionLoading,
    getDivDropDown,
    branchDrop,
    branchLoading,
    getBranchDropDown,
    allItemDrop,
    allItemDropLoading: itemLoading,
    getAllItemDrop,
  } = useModulePermissions(RESOURCES.ANALYTICS);
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [viewItemDetail, setViewItemDetail] = useState(false);
  const [selectedItemData, setSelectedItemData] = useState(null);
  const { getCustomerDropList, customerDropDownList, loading: customerLoading } = useCustomer();
  const isApicalledRefFilter = useRef({
    divisionDropdown: false,
    itemDropdown: false,
    customerDropdown: false,
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
    item: searchParams.get('item') || '',
    customerId: searchParams.get('customerId') || '',
  });

  useEffect(() => {
    const controller = new AbortController();
    const page = parseInt(searchParams?.get('page')) || 1;
    const pageSize = parseInt(searchParams?.get('limit')) || customerWiseSalesOrderAnalysisPagination.limit;
    const payload = getQueryParams(window.location.href) || {};

    getCustomerWiseSalesOrderAnalysis({ ...payload, page, limit: pageSize, signal: controller.signal });

    return () => controller.abort();
  }, [searchParams]);

  useResetOnUnmount(resetCustomerWisePendingOrderAnalysis);

  const handleOnFocusApiCall = async type => {
    let obj = { ...isApicalledRefFilter.current };

    if (type === API_CALLED_ENUM.ITEM_DROPDOWN) {
      await getAllItemDrop({});
      obj.itemDropdown = true;
    }

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
    if (searchParams.get('item')) {
      handleOnFocusApiCall(API_CALLED_ENUM.ITEM_DROPDOWN);
    }
  }, [filter?.item]);

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

  const handleFilter = () => {
    const startDate = dateFormateForBackend(dateRange?.[0]);
    const endDate = dateFormateForBackend(dateRange?.[1]);

    let updatedFilters = {
      ...filter,
      page: 1,
      limit: customerWiseSalesOrderAnalysisPagination.limit || DEFAULT_PAGE_SIZE,
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
      item: null,
      customerId: null,
      division: null,
      branch: null,
    });
    updateUrlParams({
      item: '',
      customerId: '',
      division: '',
      branch: '',
      page: 1,
      limit: customerWiseSalesOrderAnalysisPagination.limit || DEFAULT_PAGE_SIZE,
      startDate: null,
      endDate: null,
      preset: '',
      sortBy: '',
    });
    setSelectedPreset('custom');
    setDateRange(null);
  };

  const getActiveFiltersCount = () => {
    return [searchParams.get('startDate'), searchParams.get('division'), searchParams.get('branch'), searchParams.get('item'), searchParams.get('customerId')].filter(Boolean).length;
  };

  const containerRef = useRef(null);

  const handlePaginationChange = (page, pageSize) => {
    updateUrlParams({ page, limit: pageSize });
  };

  const handleTableChange = (pagination, filters, sorter) => {
    let sortParam = '';
    if (sorter?.field) {
      const direction = sorter.order === 'descend' ? 'desc' : 'asc';
      sortParam = `${sorter.field}:${direction}`;
    }

    updateUrlParams({
      page: pagination.current,
      limit: pagination.pageSize,
      sortBy: sortParam,
    });
  };

  const mainTableColumns = customerWiseSalesOrderAnalysisColumn();

  const handleExpand = (expanded, record) => {
    const customerId = record?.customerId;
    if (expanded) {
      setExpandedRowKeys([...expandedRowKeys, customerId]);
    } else {
      setExpandedRowKeys(expandedRowKeys.filter(key => key !== customerId));
    }
  };

  const handleItemCodeClick = item => {
    if (!item?.itemId) return;
    setSelectedItemData({
      id: item.itemId,
      itemNo: item.itemNo,
      itemName: item.itemName,
    });
    setViewItemDetail(true);
  };

  const itemColumns = customerWiseSalesOrderAnalysisItemColumn(handleItemCodeClick);

  const expandedRowRender = record => {
    return (
      <div className="bg-slate-50 border-l-4 border-blue-200 p-2">
        <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
          <CustomTable columns={itemColumns} data={record?.items} loading={false} pagination={false} dynamicScrollY={false} className="border-0 shadow-none" customStyle="expanded-batch-table" />
        </div>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden -m-4">
      <div className="bg-white px-4 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        <div className="flex justify-between items-center flex-wrap gap-3 w-full">
          <div className="flex items-center gap-3 flex-wrap flex-1 min-w-0">
            <CustomButton
              type="default"
              text={<Icons.ArrowLeftOutlined />}
              onClick={() => {
                navigate('/analytics');
              }}
            />
            <div className="flex-1 min-w-0">
              <PageHeader
                loading={loading}
                title={
                  <span className="inline-flex items-center gap-2">
                    Customer Wise Pending Order Analytics
                    <Tooltip title={ANALYTICS_TOOLTIPS.CUSTOMER_WISE_PENDING_ORDER} placement="right">
                      <Icons.InfoCircleOutlined style={{ color: colorPalette.primary[500], fontSize: 14 }} />
                    </Tooltip>
                  </span>
                }
                rightStats={[
                  { label: 'Customers', value: customerWiseSalesOrderAnalysisPagination?.totalResults || 0 },
                  { label: 'Pending Orders', value: customerWiseSalesOrderAnalysisPagination?.totalPendingOrders || 0 },
                  { label: 'Total Quantity', value: customerWiseSalesOrderAnalysisPagination?.totalQuantity || 0 },
                  { label: 'Total Pending Value', value: formatAmount(customerWiseSalesOrderAnalysisPagination?.totalPendingValue || 0) },
                ]}
              />
            </div>
          </div>
          <div className="flex flex-wrap justify-center md:justify-end gap-2 md:gap-3 w-full md:w-auto">
            <FilterButton count={getActiveFiltersCount()} onClick={() => setShowFilter(true)} />
          </div>
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
              name={'item'}
              label={'Item'}
              placeHolder={'Select Item'}
              selectVariant="twoColumn"
              columnSelectHeader={itemSelectColumnHeader}
              selectPopupClassName={itemSelectDropdownProps.selectPopupClassName}
              selectionOptions={buildItemFilterSelectOptions(allItemDrop)}
              value={filter?.item}
              setFilter={setFilter}
              allowClear={true}
              loading={itemLoading}
              onFocus={() => {
                if (!isApicalledRefFilter.current.itemDropdown) {
                  handleOnFocusApiCall(API_CALLED_ENUM.ITEM_DROPDOWN);
                }
              }}
              popupMatchSelectWidth={false}
              dropdownStyle={{ width: '50%', borderRadius: 0 }}
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
            item: {
              label: 'Item',
              format: value => allItemDrop?.find(x => x?._id === value)?.itemName,
              clear: (setFilter, updateUrlParams) => {
                setFilter(prev => ({ ...prev, item: null }));
                updateUrlParams({ item: null });
              },
            },
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
      <div className="bg-white">
        <CustomTable
          columns={mainTableColumns}
          data={customerWiseSalesOrderAnalysis}
          onChange={handleTableChange}
          tableId={record => record?.customerId}
          loading={loading}
          paginationClassName="!left-0"
          pagination={{
            current: parseInt(searchParams.get('page')) || 1,
            pageSize: parseInt(searchParams.get('limit')) || customerWiseSalesOrderAnalysisPagination.limit || DEFAULT_PAGE_SIZE,
            total: customerWiseSalesOrderAnalysisPagination?.totalResults || 0,
            onChange: handlePaginationChange,
          }}
          expandable={{
            expandedRowKeys: expandedRowKeys,
            onExpand: handleExpand,
            expandedRowRender: expandedRowRender,
            expandRowByClick: true,
          }}
        />
      </div>
      {viewItemDetail && <ItemDrawerDetails viewItemDetail={viewItemDetail} setViewItemDetail={setViewItemDetail} itemData={selectedItemData} />}
    </div>
  );
};

export default ViewCustomerWisePendingOrderAnalytics;
