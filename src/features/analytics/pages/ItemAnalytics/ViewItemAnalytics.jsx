import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Tooltip } from 'antd';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

// Components
import { CommonFilterTags } from '@/utils/filtersUtils';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomDatePicker from '@/components/forms/formDatePicker/CustomDatePicker';
import FilterInput from '@/components/forms/formInput/FilterInput';
import FilterDrawer, { FilterSection, FilterButton } from '@/components/ui/common/FilterDrawer';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';

// Hooks
import useModulePermissions from '@/hooks/useModulePermissions';
import { useReport } from '@/features/reports/useReport';
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';

// Extras
import { itemAnalyticsColumn } from '@/features/analytics';
import Icons from '@/assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { resetBranch } from '@/features/allMaster/warehouse/warehouse.slice';
import { ANALYTICS_TOOLTIPS, filterInputEnum } from '@/utils/constants';
import { dateFormateForBackend, getPresetDateRange, getQueryParams } from '@/utils/services';
import { colorPalette } from '@/utils/theme';
import { buildDivisionSelectOptions, buildBranchSelectOptions, divisionSelectColumnHeader, branchSelectColumnHeader } from '@/utils/tableSelectDropdown/orgSelectDropdown';
import { buildItemFilterSelectOptions, itemSelectColumnHeader, itemSelectDropdownProps } from '@/utils/tableSelectDropdown/itemSelectDropdown';

const API_CALLED_ENUM = {
  ITEM_DROPDOWN: 'itemDropdown',
  DIVISION_DROPDOWN: 'divisionDropdown',
};

const ViewItemAnalytics = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { itemAnalytics, getItemAnalytics, loading, pagination, clearItemAnalytics } = useReport();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilter, setShowFilter] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(searchParams?.get('preset') || 'custom');
  const {
    divDrop,
    divisionLoading,
    getDivDropDown,
    allItemDrop,
    allItemDropLoading: itemLoading,
    getAllItemDrop,
    branchDrop,
    branchLoading,
    getBranchDropDown,
  } = useModulePermissions(RESOURCES.ANALYTICS);
  const isApicalledRefFilter = useRef({
    divisionDropdown: false,
    itemDropdown: false,
  });
  const [filter, setFilter] = useState({
    division: searchParams.get('division')?.split(',') || '',
    branch: searchParams.get('branch')?.split(',') || '',
    item: searchParams.get('item') || '',
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

  const handlePaginationChange = (page, pageSize) => {
    updateUrlParams({ page, limit: pageSize });
  };

  const fetchItemAnalytics = signal => {
    const page = parseInt(searchParams?.get('page')) || 1;
    const pageSize = parseInt(searchParams?.get('limit')) || pagination?.limit || DEFAULT_PAGE_SIZE;
    const payload = getQueryParams(window.location.href) || {};

    getItemAnalytics({
      ...payload,
      page,
      limit: pageSize,
      signal,
      startDate: searchParams?.get('startDate') || null,
      endDate: searchParams?.get('endDate') || null,
    });
  };

  useEffect(() => {
    const controller = new AbortController();

    fetchItemAnalytics(controller.signal);
    return () => controller.abort();
  }, [searchParams]);

  useResetOnUnmount(clearItemAnalytics);

  const handleFilter = () => {
    const updatedFilters = {
      item: filter?.item || null,
      startDate: dateRange?.[0] ? dateFormateForBackend(dateRange?.[0]) : null,
      endDate: dateRange?.[1] ? dateFormateForBackend(dateRange?.[1]) : null,
      division: filter?.division || null,
      branch: filter?.branch || null,
      page: 1,
      limit: pagination?.limit || DEFAULT_PAGE_SIZE,
    };

    updateUrlParams(updatedFilters);
  };

  const handleResetFilters = () => {
    setFilter({
      division: null,
      branch: null,
      item: null,
    });
    setSelectedPreset('custom');
    setDateRange(null);
    updateUrlParams({
      startDate: null,
      endDate: null,
      division: null,
      branch: null,
      item: null,
      page: 1,
      limit: pagination?.limit,
    });
  };

  const getActiveFiltersCount = () => {
    return [searchParams.get('startDate') || searchParams.get('quoteDate'), searchParams.get('division'), searchParams.get('branch'), searchParams.get('item')].filter(Boolean).length;
  };

  const containerRef = useRef(null);

  const transformedData = (itemAnalytics || []).map(item => {
    const moduleData = item.modules.reduce((acc, mod) => {
      if (mod.moduleName === 'PRODUCTION_ORDER' && mod.totalsByRole) {
        const roles = Object.entries(mod.totalsByRole)
          .filter(([, value]) => value > 0)
          .map(([key, value]) => ({ role: key, value }));

        acc[mod.moduleName] = roles || '0';
      } else {
        acc[mod.moduleName] = mod.totalQuantity;
      }
      return acc;
    }, {});

    return {
      key: item.itemId,
      itemName: item.itemName,
      ...moduleData,
    };
  });

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
          <p className="font-bold text-[1.125rem]">Item Analytics</p>
          <div className="pointer-events-auto cursor-pointer mt-1 inline-block">
            <Tooltip title={ANALYTICS_TOOLTIPS.ITEM_ANALYTICS} placement="right">
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
              dropdownStyle={{ width: '40%', borderRadius: 0 }}
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
          handleResetFilters={handleResetFilters}
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
          }}
        />
      </div>

      <div className="bg-white">
        <CustomTable
          columns={itemAnalyticsColumn()}
          loading={loading}
          data={transformedData}
          paginationClassName="!left-0"
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

export default ViewItemAnalytics;
