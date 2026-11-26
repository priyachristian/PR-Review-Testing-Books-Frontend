import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

// Components
import { Tabs } from '@/components/AntDComponent';
import CustomButton from '@/components/ui/button/CustomButton';
import PageHeader from '@/components/ui/common/PageHeader';
import FilterDrawer, { FilterSection, FilterButton } from '@/components/ui/common/FilterDrawer';
import CustomDatePicker from '@/components/forms/formDatePicker/CustomDatePicker';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import FilterInput from '@/components/forms/formInput/FilterInput';

// Hooks
import useModulePermissions from 'hooks/useModulePermissions';
import { useItemGroup } from '@/features/allMaster/itemGroup';

// Extras
import { useReport, ProfitAndLoseColumns, ItemWiseProfitAndLoseColumns, CustomerMonthWiseProfitAndLoseColumns } from '@/features/reports';
import Icons from '@/assets/icons/icon';
import { filterInputEnum } from '@/utils/constants';
import { CommonFilterTags } from '@/utils/filtersUtils';
import { dateFormateForBackend, getPresetDateRange, getPresetDateRangeMonthWise, getQueryParams } from '@/utils/services';
import { formatAmount } from '@/utils/currency';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';
import { GROSS_PROFIT_TABS, resolveGrossProfitTabFromUrl } from '@/utils/tabs';
import { buildDivisionSelectOptions, buildBranchSelectOptions, divisionSelectColumnHeader, branchSelectColumnHeader } from '@/utils/tableSelectDropdown/orgSelectDropdown';
import { buildItemGroupSelectOptions, itemGroupSelectColumnHeader } from '@/utils/tableSelectDropdown/itemGroupSelectDropdown';

const API_CALLED_ENUM = {
  DIVISION_DROPDOWN: 'divisionDropdown',
  BRANCH_DROPDOWN: 'branchDropdown',
  ITEMGROUP_DROPDOWN: 'itemGroupDropdown',
};

const ViewGrossProfitReport = () => {
  const navigate = useNavigate();
  const { getProfitAndLose, profitAndLose, loading, pagination, getProfitAndLoseItemWise, profitAndLoseItemWise, getProfitAndLoseCustomerMonthWise, profitAndLoseCustomerMonthWise } = useReport();
  const { divDrop, divisionLoading, getDivDropDown, allBranchDrop, allBranchLoading, getAllBranchDropDown } = useModulePermissions();
  const { itemGroupDrop, itemGroupDropLoading, getItemGroupDropdown } = useItemGroup();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeKey, setActiveKey] = useState(() => resolveGrossProfitTabFromUrl(searchParams?.get('tab')));
  const [filter, setFilter] = useState({
    search: searchParams.get('search') || '',
    division: searchParams.get('division')?.split(',') || '',
    branch: searchParams.get('branch')?.split(',') || '',
    itemGroup: searchParams.get('itemGroup') || '',
    itemType: searchParams.get('itemType') || '',
  });
  const [showFilter, setShowFilter] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(searchParams?.get('preset') || 'custom');
  const getcustomDates = () => {
    if (searchParams?.get('startDate') && searchParams?.get('endDate')) {
      return [searchParams?.get('startDate'), searchParams?.get('endDate')];
    }
    if (searchParams?.get('orderDate')) {
      return [searchParams?.get('orderDate'), searchParams?.get('orderDate')];
    }
    return null;
  };
  const [dateRange, setDateRange] = useState(selectedPreset === 'custom' || selectedPreset === 'specific' ? getcustomDates() : getPresetDateRange(selectedPreset));
  const isApicalledRefFilter = useRef({
    divisionDropdown: false,
    branchDropdown: false,
    itemGroupDropdown: false,
  });

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

  const handleTabChange = newActiveKey => {
    setActiveKey(newActiveKey);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', newActiveKey);
    setSearchParams(newParams);
    updateUrlParams({
      page: 1,
      search: '',
      tab: newActiveKey,
      division: '',
      branch: '',
      preset: '',
      startDate: '',
      endDate: '',
      itemGroup: '',
      itemType: '',
    });
    setFilter({ ...filter, search: '', division: '', branch: '', itemGroup: '', itemType: '' });
    if (newActiveKey === GROSS_PROFIT_TABS.CUSTOMER_MONTH_WISE) {
      setSelectedPreset('last3Months');
      setDateRange(getPresetDateRangeMonthWise('last3Months'));
    } else {
      setDateRange(null);
      setSelectedPreset('custom');
    }
  };

  const handleClear = () => {
    setFilter({ ...filter, division: '', branch: '', search: '', itemGroup: '', itemType: '' });
    setSelectedPreset('custom');
    setDateRange(null);
    updateUrlParams({
      preset: '',
      startDate: '',
      endDate: '',
      division: '',
      branch: '',
      search: '',
      page: 1,
      limit: pagination?.limit || DEFAULT_PAGE_SIZE,
      itemGroup: '',
      itemType: '',
    });
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchProfitAndLose(controller.signal);
    return () => controller.abort();
  }, [searchParams]);

  const fetchProfitAndLose = signal => {
    const page = parseInt(searchParams?.get('page')) || 1;
    const pageSize = parseInt(searchParams?.get('limit')) || DEFAULT_PAGE_SIZE;

    let payload = getQueryParams(window.location.href) || {};

    if (Object.keys(payload)?.length <= 0) {
      payload = { page, limit: pageSize };
    }

    if (activeKey === GROSS_PROFIT_TABS.CUSTOMER_WISE) {
      getProfitAndLose({ ...payload, page, limit: pageSize, signal });
    } else if (activeKey === GROSS_PROFIT_TABS.ITEM_WISE) {
      getProfitAndLoseItemWise({ ...payload, page, limit: pageSize, signal });
    } else if (activeKey === GROSS_PROFIT_TABS.CUSTOMER_MONTH_WISE) {
      getProfitAndLoseCustomerMonthWise({ ...payload, page, limit: pageSize, signal });
    }
  };

  const handleSerch = () => {
    if (filter?.search) {
      updateUrlParams({ search: filter?.search, page: 1, limit: DEFAULT_PAGE_SIZE });
    }
  };

  const handleFilter = async () => {
    const startDate = dateFormateForBackend(dateRange?.[0]);
    const endDate = dateFormateForBackend(dateRange?.[1]);
    let updatedFilters = {
      division: filter?.division,
      branch: filter?.branch,
      search: filter?.search,
      page: 1,
      limit: pagination?.limit || DEFAULT_PAGE_SIZE,
      itemGroup: filter?.itemGroup,
      itemType: filter?.itemType,
    };

    if (dateRange) {
      updatedFilters = {
        ...updatedFilters,
        preset: selectedPreset,
        startDate: startDate,
        endDate: endDate,
      };
    }

    setShowFilter(false);
    updateUrlParams(updatedFilters);
  };

  const getActiveFiltersCount = () => {
    const keys = ['search', 'division', 'branch', 'itemGroup', 'itemType'];
    const defaultCount = keys.filter(key => {
      const currentValue = searchParams.get(key);
      return currentValue && currentValue !== '';
    }).length;
    const hasDateFilter = searchParams.get('startDate') || searchParams.get('endDate') ? 1 : 0;
    return defaultCount + hasDateFilter;
  };

  const handlePaginationChange = (page, pageSize) => {
    updateUrlParams({ page, limit: pageSize });
  };

  const handleViewClick = record => {
    navigate(`/reports/gross-profit/customer/${record.customerId}`);
  };

  const handleItemClick = record => {
    navigate(`/reports/gross-profit/item/${record.itemId}`);
  };

  const CustomerWiseProfitLose = () => {
    return (
      <div className="space-y-4">
        <div>
          <CustomTable
            columns={ProfitAndLoseColumns}
            data={profitAndLose?.customers}
            loading={loading}
            onRowClick={handleViewClick}
            pagination={{
              current: searchParams?.get('page') || 1,
              pageSize: searchParams?.get('limit') || pagination?.limit,
              total: pagination.totalRecords,
              onChange: handlePaginationChange,
            }}
          />
        </div>
      </div>
    );
  };

  const ItemWiseProfitLose = () => {
    return (
      <div className="space-y-4">
        <div>
          <CustomTable
            columns={ItemWiseProfitAndLoseColumns}
            data={profitAndLoseItemWise?.items}
            loading={loading}
            onRowClick={handleItemClick}
            pagination={{
              current: searchParams?.get('page') || 1,
              pageSize: searchParams?.get('limit') || pagination?.limit,
              total: pagination.totalRecords,
              onChange: handlePaginationChange,
            }}
          />
        </div>
      </div>
    );
  };

  const generateMonthColumns = customers => {
    if (!customers || customers.length === 0) return [];
    const monthWiseTotals = profitAndLoseCustomerMonthWise && profitAndLoseCustomerMonthWise.monthWiseTotals;

    const allMonths = new Set();
    customers.forEach(customer => {
      if (customer.months) {
        Object.keys(customer.months).forEach(monthKey => {
          allMonths.add(monthKey);
        });
      }
    });

    const sortedMonths = Array.from(allMonths);

    return sortedMonths.map(monthKey => {
      const monthData = customers.find(customer => customer.months && customer.months[monthKey])?.months[monthKey];
      const monthTotal = monthWiseTotals?.[monthKey];

      const monthName = monthData?.monthName || monthTotal?.monthName || monthKey;
      const year = monthData?.year || monthTotal?.year || monthKey.split('-')[0];
      const month = monthData?.month || monthTotal?.month || monthKey.split('-')[1];

      const totalRevenue = monthTotal ? formatAmount(monthTotal.totalRevenue) : '-';
      const totalNetProfit = monthTotal ? formatAmount(monthTotal.totalNetProfit) : '-';
      const profitMarginPercentage = monthTotal ? `${monthTotal.profitMarginPercentage}%` : '0.00%';

      return {
        title: (
          <div className="flex flex-col items-center justify-center px-2 pt-1 pb-2 my-container border-s-[3px] border-[--orange] min-w-[200px]">
            <div className="font-bold text-base text-gray-800 mb-0.5">{monthName}</div>
            <div className="text-xs text-gray-500 mb-1">
              {month}/{year}
            </div>
            <div className="flex flex-col w-full">
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] text-gray-600 font-medium">Revenue</span>
                <span className="text-[11px] font-semibold text-[--orange]">{totalRevenue}</span>
              </div>
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] text-gray-600 font-medium">Profit</span>
                <span className={`text-[11px] font-semibold ${parseFloat(totalNetProfit) > 0 ? 'text-green-700' : parseFloat(totalNetProfit) < 0 ? 'text-red-700' : 'text-gray-700'}`}>
                  {totalNetProfit}
                </span>
              </div>
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] text-gray-600 font-medium">Margin</span>
                <span className={`text-[11px] font-semibold ${parseFloat(profitMarginPercentage) > 0 ? 'text-green-700' : parseFloat(profitMarginPercentage) < 0 ? 'text-red-700' : 'text-gray-700'}`}>
                  {profitMarginPercentage}
                </span>
              </div>
            </div>
          </div>
        ),
        key: monthKey,
        width: 220,
        ellipsis: false,
        render: (_, record) => {
          const monthData = record.months?.[monthKey];
          if (!monthData) {
            return <span className="text-gray-500 text-xs text-center flex w-full justify-center">-</span>;
          }

          return (
            <div className="p-2 bg-gray-50 rounded border border-gray-200 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-gray-500">Revenue:</div>
                <div className="text-xs font-semibold text-gray-800">{formatAmount(monthData.totalRevenue)}</div>
              </div>

              <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-gray-500">Profit:</div>
                <div className="flex items-center gap-1">
                  <div className={`text-xs font-semibold ${monthData.totalNetProfit > 0 ? 'text-[--primary]' : monthData.totalNetProfit < 0 ? 'text-red-500' : 'text-gray-600'}`}>
                    {formatAmount(monthData.totalNetProfit)}
                  </div>
                  {monthData.profitDifferencePercentage !== null && (
                    <div
                      className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                        parseFloat(monthData.profitDifferencePercentage) > 0
                          ? 'bg-green-100 text-green-700'
                          : parseFloat(monthData.profitDifferencePercentage) < 0
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {parseFloat(monthData.profitDifferencePercentage) > 0 ? (
                        <Icons.CaretUpFilled className="text-[8px]" />
                      ) : parseFloat(monthData.profitDifferencePercentage) < 0 ? (
                        <Icons.CaretDownFilled className="text-[8px]" />
                      ) : null}
                      {Math.abs(parseFloat(monthData.profitDifferencePercentage))}%
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">Margin:</div>
                <div className={`text-xs font-semibold ${monthData.profitMarginPercentage > 0 ? 'text-[--primary]' : monthData.profitMarginPercentage < 0 ? 'text-red-500' : 'text-gray-600'}`}>
                  {monthData.profitMarginPercentage}%
                </div>
              </div>
            </div>
          );
        },
      };
    });
  };

  const CustomerMonthWiseProfitLose = () => {
    const dynamicColumns = generateMonthColumns(profitAndLoseCustomerMonthWise?.customers || []);
    const allColumns = [...CustomerMonthWiseProfitAndLoseColumns, ...dynamicColumns];

    return (
      <div className="space-y-4">
        <div>
          <CustomTable
            columns={allColumns}
            data={profitAndLoseCustomerMonthWise?.customers}
            loading={loading}
            pagination={{
              current: searchParams?.get('page') || 1,
              pageSize: searchParams?.get('limit') || pagination?.limit,
              total: pagination.totalRecords,
              onChange: handlePaginationChange,
            }}
            adjustScrollForTallHeader
            scroll={{ x: 'max-content' }}
          />
        </div>
      </div>
    );
  };

  const items = [
    {
      key: GROSS_PROFIT_TABS.CUSTOMER_WISE,
      label: 'Customer Wise Gross Profit',
      children: <CustomerWiseProfitLose />,
    },
    {
      key: GROSS_PROFIT_TABS.ITEM_WISE,
      label: 'Item Wise Gross Profit',
      children: <ItemWiseProfitLose />,
    },
    {
      key: GROSS_PROFIT_TABS.CUSTOMER_MONTH_WISE,
      label: "Customer's Month Wise Gross Profit",
      children: <CustomerMonthWiseProfitLose />,
    },
  ];

  const handleOnFocusApiCall = async type => {
    let obj = { ...isApicalledRefFilter.current };

    if (type === API_CALLED_ENUM.DIVISION_DROPDOWN) {
      await getDivDropDown({});
      obj.divisionDropdown = true;
    }

    if (type === API_CALLED_ENUM.BRANCH_DROPDOWN) {
      await getAllBranchDropDown({});
      obj.branchDropdown = true;
    }

    if (type === API_CALLED_ENUM.ITEMGROUP_DROPDOWN) {
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
    if (searchParams.get('branch')) {
      handleOnFocusApiCall(API_CALLED_ENUM.BRANCH_DROPDOWN);
    }
  }, [filter?.branch]);

  useEffect(() => {
    if (searchParams.get('itemGroup')) {
      handleOnFocusApiCall(API_CALLED_ENUM.ITEMGROUP_DROPDOWN);
    }
  }, [filter?.itemGroup]);

  return (
    <div className="-m-4">
      <div className="flex justify-between items-center container-spacing sticky-page-header bg-white border-b border-gray-200">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <CustomButton
            type="default"
            text={<Icons.ArrowLeftOutlined />}
            onClick={() => {
              navigate('/reports');
            }}
          />
          <div className="flex-1 min-w-0">
            <PageHeader
              loading={loading}
              title="Gross Profit"
              rightStats={[
                { label: 'Total Revenue', value: formatAmount(pagination?.summary?.totalRevenue || 0) },
                { label: 'Total Profit', value: formatAmount(pagination?.summary?.totalNetProfit || 0) },
                { label: 'Profit Margin', value: `${pagination?.summary?.profitMarginPercentage || 0}%` },
              ]}
            />
          </div>
        </div>
      </div>
      <div className="bg-white border-t px-4 py-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <div className="w-full min-w-0 lg:flex-1 [&_.ant-tabs-nav]:mb-0 [&_.ant-tabs-nav::before]:border-b-0 [&_.ant-tabs-content-holder]:hidden">
            <Tabs activeKey={activeKey} onChange={handleTabChange} items={items.map(({ key, label }) => ({ key, label }))} />
          </div>
          <div className="flex gap-2 items-center shrink-0">
            <FilterInput type={filterInputEnum?.SEARCH} name={'search'} placeHolder="Search..." value={filter?.search} setFilter={setFilter} onSerch={handleSerch} onClear={handleClear} />
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
              <CustomDatePicker
                selectedPreset={selectedPreset}
                setSelectedPreset={setSelectedPreset}
                dateRange={dateRange}
                setDateRange={setDateRange}
                isMonthRange={activeKey === GROSS_PROFIT_TABS.CUSTOMER_MONTH_WISE}
              />
            </div>
          </FilterSection>

          {activeKey === GROSS_PROFIT_TABS.ITEM_WISE && (
            <FilterSection title="What">
              <div className="space-y-2">
                <FilterInput
                  type={filterInputEnum?.SELECT}
                  name="itemGroup"
                  label="Item Group"
                  placeHolder="Select Item Group"
                  selectVariant="twoColumn"
                  columnSelectHeader={itemGroupSelectColumnHeader}
                  selectionOptions={buildItemGroupSelectOptions(itemGroupDrop)}
                  value={filter?.itemGroup}
                  setFilter={setFilter}
                  allowClear={false}
                  loading={itemGroupDropLoading}
                  onFocus={() => {
                    if (!isApicalledRefFilter.current.itemGroupDropdown) {
                      handleOnFocusApiCall(API_CALLED_ENUM.ITEMGROUP_DROPDOWN);
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <FilterInput
                  type={filterInputEnum?.SELECT}
                  name="itemType"
                  label="Item Type"
                  placeHolder="Select Item Type"
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
                  allowClear={false}
                />
              </div>
            </FilterSection>
          )}

          <FilterSection title="Where">
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name="division"
                label="Division"
                mode="multiple"
                placeHolder="Select Division"
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
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                mode="multiple"
                name="branch"
                label="Branch"
                placeHolder="Select Branch"
                selectVariant="twoColumn"
                columnSelectHeader={branchSelectColumnHeader}
                selectionOptions={buildBranchSelectOptions((allBranchDrop || []).filter(branch => filter?.division?.includes(branch?.divisionId?.id)))}
                value={filter?.branch}
                setFilter={setFilter}
                allowClear={false}
                disabled={!filter?.division}
                loading={allBranchLoading}
                onFocus={() => {
                  if (!isApicalledRefFilter.current.branchDropdown) {
                    handleOnFocusApiCall(API_CALLED_ENUM.BRANCH_DROPDOWN);
                  }
                }}
              />
            </div>
          </FilterSection>
        </FilterDrawer>
      </div>
      <CommonFilterTags
        searchParams={searchParams}
        setFilter={setFilter}
        updateUrlParams={updateUrlParams}
        handleClear={handleClear}
        handleResetFilters={handleClear}
        dateKeys={{
          startDateKey: 'startDate',
          endDateKey: 'endDate',
          singleDateKey: 'orderDate',
        }}
        onDateClear={() => {
          setSelectedPreset('custom');
          setDateRange(null);
          updateUrlParams({
            startDate: null,
            endDate: null,
            orderDate: null,
            preset: null,
            page: 1,
          });
        }}
        divDrop={divDrop}
        branchDrop={allBranchDrop}
        extraFilters={{
          itemGroup: {
            label: 'Item Group',
            format: value => {
              const grp = itemGroupDrop?.find(g => String(g?.id) === String(value)) || {};
              return grp?.name || value;
            },
            clear: (setFilter, updateUrlParams) => {
              setFilter(prev => ({
                ...prev,
                itemGroup: '',
              }));
              updateUrlParams({
                itemGroup: '',
                page: 1,
              });
            },
          },
          itemType: {
            label: 'Item Type',
            format: value => value,
            clear: (setFilter, updateUrlParams) => {
              setFilter(prev => ({
                ...prev,
                itemType: '',
              }));
              updateUrlParams({
                itemType: '',
                page: 1,
              });
            },
          },
        }}
      />
      <div className="bg-white border-t">{items.find(item => item.key === activeKey)?.children}</div>
    </div>
  );
};

export default ViewGrossProfitReport;
