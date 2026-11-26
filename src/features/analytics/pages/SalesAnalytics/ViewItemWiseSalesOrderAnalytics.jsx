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
import { useItemGroup } from '@/features/allMaster/itemGroup';
import useModulePermissions from '@/hooks/useModulePermissions';
import { useSalesOrder } from '@/features/sales/salesOrder/useSalesOrder';

// Extras
import { itemWiseAnalysisSalesOrderColumn, itemWiseSalesOrderAnalysisColumn } from '@/features/analytics';
import Icons from '@/assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { resetBranch } from '@/features/allMaster/warehouse/warehouse.slice';
import { ANALYTICS_TOOLTIPS, filterInputEnum } from '@/utils/constants';
import { dateFormateForBackend, getPresetDateRange, getQueryParams } from '@/utils/services';
import { formatAmount } from '@/utils/currency';
import { colorPalette } from '@/utils/theme';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';
import { buildDivisionSelectOptions, buildBranchSelectOptions, divisionSelectColumnHeader, branchSelectColumnHeader } from '@/utils/tableSelectDropdown/orgSelectDropdown';
import { buildItemGroupSelectOptions, itemGroupSelectColumnHeader } from '@/utils/tableSelectDropdown/itemGroupSelectDropdown';
import { buildCustomerSelectOptions, customerSelectColumnHeader, customerSelectDropdownProps } from '@/utils/tableSelectDropdown/customerSelectDropdown';
import { buildItemFilterSelectOptions, itemSelectColumnHeader, itemSelectDropdownProps } from '@/utils/tableSelectDropdown/itemSelectDropdown';

const API_CALLED_ENUM = {
  ITEM_DROPDOWN: 'itemDropdown',
  CUSTOMER_DROPDOWN: 'customerDropdown',
  DIVISION_DROPDOWN: 'divisionDropdown',
  ITEM_TYPE_DROPDOWN: 'itemTypeDropdown',
  ITEM_GROUP_DROPDOWN: 'itemGroupDropdown',
};

const ViewItemWiseSalesOrderAnalytics = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilter, setShowFilter] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(searchParams?.get('preset') || 'custom');
  const { itemWiseSalesOrderAnalysis, getItemWiseSalesOrderAnalysis, itemWiseSalesOrderAnalysisPagination, loading } = useSalesOrder();
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
  const { itemGroupDrop, itemGroupDropLoading, getItemGroupDropdown } = useItemGroup();
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const { getCustomerDropList, customerDropDownList, loading: customerLoading } = useCustomer();
  const isApicalledRefFilter = useRef({
    divisionDropdown: false,
    itemDropdown: false,
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
    item: searchParams.get('item') || '',
    customerId: searchParams.get('customerId') || '',
    itemType: searchParams.get('itemType') || '',
    itemGroup: searchParams.get('itemGroup') || '',
  });

  useEffect(() => {
    const controller = new AbortController();
    const page = parseInt(searchParams?.get('page')) || 1;
    const pageSize = parseInt(searchParams?.get('limit')) || itemWiseSalesOrderAnalysisPagination.limit;

    let payload = getQueryParams(window.location.href) || {};

    if (Object.keys(payload)?.length <= 0) {
      payload = { page, limit: pageSize };
    }

    getItemWiseSalesOrderAnalysis({ ...payload, page, limit: pageSize, signal: controller.signal });

    return () => controller.abort();
  }, [searchParams]);

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

    if (type === API_CALLED_ENUM.ITEM_GROUP_DROPDOWN) {
      await getItemGroupDropdown({});
      obj.itemGroupDropdown = true;
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
      limit: itemWiseSalesOrderAnalysisPagination.limit || DEFAULT_PAGE_SIZE,
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
      itemType: null,
      itemGroup: null,
    });
    updateUrlParams({
      item: '',
      customerId: '',
      division: '',
      branch: '',
      page: 1,
      limit: itemWiseSalesOrderAnalysisPagination.limit || DEFAULT_PAGE_SIZE,
      itemType: '',
      itemGroup: '',
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
      searchParams.get('item'),
      searchParams.get('customerId'),
      searchParams.get('itemType'),
      searchParams.get('itemGroup'),
    ].filter(Boolean).length;
  };

  const containerRef = useRef(null);

  const handlePaginationChange = (page, pageSize) => {
    updateUrlParams({ page, limit: pageSize });
  };

  const mainTableColumns = itemWiseSalesOrderAnalysisColumn();

  const handleExpand = (expanded, record) => {
    if (expanded) {
      setExpandedRowKeys([...expandedRowKeys, record.itemDetail.itemId]);
    } else {
      setExpandedRowKeys(expandedRowKeys.filter(key => key !== record.itemDetail.itemId));
    }
  };

  const salesOrderColumns = itemWiseAnalysisSalesOrderColumn();

  const expandedRowRender = record => {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 border-l-4 border-blue-200 rounded-r-lg shadow-sm">
        <div className="p-3 px-5 pb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <div>
                <h4 className="text-base font-semibold text-gray-800">Sales Order Details</h4>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h5 className="font-medium text-gray-700">Sales Order Information</h5>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Detailed breakdown of sales order</span>
                </div>
              </div>
            </div>

            <CustomTable columns={salesOrderColumns} data={record?.salesOrders} loading={false} pagination={false} className="border-0 shadow-none" customStyle="expanded-batch-table" />
          </div>
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
                    Item Wise Sales Order Analytics
                    <Tooltip title={ANALYTICS_TOOLTIPS.SALES_ITEM_WISE} placement="right">
                      <Icons.InfoCircleOutlined style={{ color: colorPalette.primary[500], fontSize: 14 }} />
                    </Tooltip>
                  </span>
                }
                rightStats={[
                  { label: 'Sales Orders', value: itemWiseSalesOrderAnalysisPagination?.totalSalesOrders || 0 },
                  { label: 'Unique Items', value: itemWiseSalesOrderAnalysisPagination?.totalUniqueItems || 0 },
                  { label: 'Ordered Qty', value: itemWiseSalesOrderAnalysisPagination?.totalOrderedQty || 0 },
                  { label: 'Required Qty', value: itemWiseSalesOrderAnalysisPagination?.totalRequiredQty || 0 },
                  { label: 'Total Amount', value: formatAmount(itemWiseSalesOrderAnalysisPagination?.totalAmount || 0) },
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
          <div className="space-y-2">
            <FilterInput
              type={filterInputEnum?.SELECT}
              name={'itemType'}
              mode="multiple"
              label={'Item Type'}
              placeHolder={'Select Item Type'}
              selectionOptions={[
                { value: 'RM', label: 'RM' },
                { value: 'FG', label: 'FG' },
                { value: 'SEMI_RM', label: 'SEMI RM' },
                { value: 'CONSUMABLE', label: 'CONSUMABLE' },
                { value: 'TRADE', label: 'TRADE' },
                { value: 'SCRAP', label: 'SCRAP' },
              ]}
              value={filter?.itemType}
              setFilter={setFilter}
              allowClear={true}
              getPopupContainer={() => containerRef.current || document.body}
            />
          </div>
          <div className="space-y-2">
            <FilterInput
              type={filterInputEnum?.SELECT}
              name={'itemGroup'}
              mode="multiple"
              label={'Item Group'}
              placeHolder={'Select Item Group'}
              selectVariant="twoColumn"
              columnSelectHeader={itemGroupSelectColumnHeader}
              selectionOptions={buildItemGroupSelectOptions(itemGroupDrop)}
              value={filter?.itemGroup}
              setFilter={setFilter}
              allowClear={true}
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
            itemType: {
              label: 'Item Type',
              format: value => value,
              clear: (setFilter, updateUrlParams) => {
                setFilter(prev => ({ ...prev, itemType: null }));
                updateUrlParams({ itemType: null });
              },
            },
            itemGroup: {
              label: 'Item Group',
              format: value => {
                const itemGroupNames = value ? value.split(',').map(id => itemGroupDrop?.find(x => x?.id === id)?.name) : null;
                return itemGroupNames?.join(', ');
              },
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
          columns={mainTableColumns}
          data={itemWiseSalesOrderAnalysis}
          tableId={record => record?.itemDetail?.itemId}
          loading={loading}
          paginationClassName="!left-0"
          pagination={{
            current: parseInt(searchParams.get('page')) || 1,
            pageSize: parseInt(searchParams.get('limit')) || itemWiseSalesOrderAnalysisPagination.limit || DEFAULT_PAGE_SIZE,
            total: itemWiseSalesOrderAnalysisPagination?.totalResults || 0,
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
    </div>
  );
};

export default ViewItemWiseSalesOrderAnalytics;
