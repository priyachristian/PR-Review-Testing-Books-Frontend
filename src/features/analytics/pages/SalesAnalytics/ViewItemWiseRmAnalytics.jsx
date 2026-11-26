import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

// Components
import { Tag } from '@/components/AntDComponent';
import CustomButton from '@/components/ui/button/CustomButton';
import FilterInput from '@/components/forms/formInput/FilterInput';
import FilterDrawer, { FilterSection, FilterButton } from '@/components/ui/common/FilterDrawer';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';

// Hooks
import useModulePermissions from '@/hooks/useModulePermissions';
import { useCustomer } from '@/features/sales/customer/useCustomer';

// Extras
import { useAnalytics } from '@/features/analytics';
import { filterInputEnum, SALES_ORDER_STATUS } from '@/utils/constants';
import { getcolorforShortageQty, getQueryParams } from '@/utils/services';
import { RESOURCES } from '@/utils/jsonFile';
import Icons from '@/assets/icons/icon';
import { resetBranch } from '@/features/allMaster/warehouse/warehouse.slice';
import { CommonFilterTags } from '@/utils/filtersUtils';
import { buildDivisionSelectOptions, buildBranchSelectOptions, divisionSelectColumnHeader, branchSelectColumnHeader } from '@/utils/tableSelectDropdown/orgSelectDropdown';
import { buildCustomerSelectOptions, customerSelectColumnHeader, customerSelectDropdownProps } from '@/utils/tableSelectDropdown/customerSelectDropdown';
import { buildItemFilterSelectOptions, itemSelectColumnHeader, itemSelectDropdownProps } from '@/utils/tableSelectDropdown/itemSelectDropdown';

const API_CALLED_ENUM = {
  ITEM_DROPDOWN: 'itemDropdown',
  CUSTOMER_DROPDOWN: 'customerDropdown',
  DIVISION_DROPDOWN: 'divisionDropdown',
};

const ViewItemWiseRmAnalytics = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilter, setShowFilter] = useState(false);
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
  const { itemWiseRmAnalytics, loading, getItemWiseRmAnalytics } = useAnalytics();
  const { getCustomerDropList, customerDropDownList, loading: customerLoading } = useCustomer();
  const isApicalledRefFilter = useRef({
    divisionDropdown: false,
    itemDropdown: false,
    customerDropdown: false,
  });
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [filter, setFilter] = useState({
    division: searchParams.get('division')?.split(',') || '',
    branch: searchParams.get('branch')?.split(',') || '',
    item: searchParams.get('item') || '',
    customerId: searchParams.get('customerId') || '',
    status: searchParams.get('status')?.split(',') || '',
  });

  useEffect(() => {
    const controller = new AbortController();

    let payload = getQueryParams(window.location.href) || {};

    getItemWiseRmAnalytics({ ...payload, signal: controller.signal });

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

    isApicalledRefFilter.current = obj;
  };

  useEffect(() => {
    if (searchParams.get('item') && !isApicalledRefFilter.current?.itemDropdown) {
      handleOnFocusApiCall(API_CALLED_ENUM.ITEM_DROPDOWN);
    }
  }, [filter?.item]);

  useEffect(() => {
    if (searchParams.get('division') && !isApicalledRefFilter.current?.divisionDropdown) {
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
    if (searchParams.get('customerId') && !isApicalledRefFilter.current?.customerDropdown) {
      handleOnFocusApiCall(API_CALLED_ENUM.CUSTOMER_DROPDOWN);
    }
  }, [filter?.customerId]);

  const updateUrlParams = newParams => {
    const params = new URLSearchParams(searchParams);

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
    let updatedFilters = {
      ...filter,
    };

    updateUrlParams(updatedFilters);
  };

  const handleClear = () => {
    setFilter({
      item: null,
      customerId: null,
      division: null,
      branch: null,
      status: null,
    });
    updateUrlParams({
      item: '',
      customerId: '',
      division: '',
      branch: '',
      status: '',
    });
  };

  const getActiveFiltersCount = () => {
    return [searchParams.get('status'), searchParams.get('division'), searchParams.get('branch'), searchParams.get('item'), searchParams.get('customerId')].filter(Boolean).length;
  };

  const containerRef = useRef(null);

  const rawMaterialColumns = [
    {
      title: 'Item#',
      key: 'itemNo',
      render: record => (
        <Link to={`/item-master/${record?.itemId}`}>
          <Tag className="font-semibold">{record?.itemNo}</Tag>
        </Link>
      ),
    },
    {
      title: 'Item Name',
      dataIndex: 'itemName',
      key: 'itemName',
    },
    {
      title: 'Required Qty',
      dataIndex: 'requiredQty',
      key: 'requiredQty',
    },
    {
      title: 'Available Qty',
      dataIndex: 'availableStock',
      key: 'availableStock',
    },
    {
      title: 'Shortage Qty',
      dataIndex: 'shortage',
      key: 'shortage',
    },
  ];

  const expandedRowRender = record => {
    return (
      <div className="bg-gradient-to-br from-slate-50 to-blue-50 border-l-4 border-blue-200 rounded-r-lg shadow-sm">
        <div className="p-3 px-5 pb-5">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h5 className="font-medium text-gray-700">Raw Material Information</h5>
              </div>
            </div>

            <CustomTable columns={rawMaterialColumns} data={record?.bomBasedItems} dynamicScrollY={false} customStyle="rm-analytics-table" rowClassName={record => getcolorforShortageQty(record)} />
          </div>
        </div>
      </div>
    );
  };

  const itemColumns = [
    {
      title: 'Item#',
      dataIndex: 'itemNo',
      key: 'itemNo',
      render: value => <Tag className="font-semibold">{value}</Tag>,
    },
    {
      title: 'Item Name',
      dataIndex: 'itemName',
      key: 'itemName',
    },
    {
      title: 'Total Qty',
      dataIndex: 'totalQuantity',
      key: 'totalQuantity',
    },
    {
      title: 'Billed Qty',
      dataIndex: 'billedQty',
      key: 'billedQty',
    },
    {
      title: 'Remaining Qty',
      dataIndex: 'remainingQty',
      key: 'remainingQty',
    },
  ];

  const handleExpand = (expanded, record) => {
    if (expanded) {
      setExpandedRowKeys([...expandedRowKeys, record.itemId]);
    } else {
      setExpandedRowKeys(expandedRowKeys.filter(key => key !== record.itemId));
    }
  };

  return (
    <div ref={containerRef} className="m-1/2 -my-4 mb-4">
      <div className="flex justify-between items-center border-b bg-white sticky-page-header container-spacing -mx-4">
        <div className="flex items-center gap-3">
          <CustomButton
            type="default"
            text={<Icons.ArrowLeftOutlined />}
            onClick={() => {
              navigate('/analytics');
            }}
          />
          <p className="font-bold text-[1.125rem]">Item Wise RM Analytics</p>
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
        <FilterSection title="What">
          <div className="space-y-2">
            <FilterInput
              type={filterInputEnum?.SELECT}
              mode="multiple"
              name={'status'}
              label={'Status'}
              placeHolder={'Select Status'}
              selectionOptions={Object?.entries(SALES_ORDER_STATUS)?.map(([key, value]) => {
                return { value: key, label: value };
              })}
              value={filter?.status}
              setFilter={setFilter}
              allowClear={true}
              getPopupContainer={() => containerRef.current || document.body}
            />
          </div>
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

      <div className="bg-white mt-4">
        <CommonFilterTags
          filterClassName="!mb-0 border-t"
          searchParams={searchParams}
          setFilter={setFilter}
          updateUrlParams={updateUrlParams}
          handleClear={handleClear}
          handleResetFilters={handleClear}
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
          STATUS_ENUM={SALES_ORDER_STATUS}
        />
      </div>

      <CustomTable
        columns={itemColumns}
        data={itemWiseRmAnalytics}
        tableId={record => record.itemId}
        loading={loading}
        expandable={{
          expandedRowKeys: expandedRowKeys,
          onExpand: handleExpand,
          expandedRowRender: expandedRowRender,
          expandRowByClick: true,
        }}
      />
    </div>
  );
};

export default ViewItemWiseRmAnalytics;
