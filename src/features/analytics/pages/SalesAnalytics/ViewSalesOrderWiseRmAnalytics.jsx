import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';

// Components
import { Tag } from '@/components/AntDComponent';
import CustomButton from '@/components/ui/button/CustomButton';
import FilterInput from '@/components/forms/formInput/FilterInput';
import FilterDrawer, { FilterSection, FilterButton } from '@/components/ui/common/FilterDrawer';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import StatusBadge from '@/components/ui/badge/StatusBadge';

// Hooks
import useModulePermissions from '@/hooks/useModulePermissions';
import { useCustomer } from '@/features/sales/customer/useCustomer';

// Extras
import { useAnalytics } from '@/features/analytics';
import { filterInputEnum, SALES_ORDER_STATUS } from '@/utils/constants';
import { getQueryParams } from '@/utils/services';
import { formatAmount } from '@/utils/currency';
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

const ItemDetail = ({ item }) => {
  const navigate = useNavigate();
  const [isExpand, setIsExpand] = useState(false);

  const handleRowExpand = () => {
    setIsExpand(!isExpand);
  };

  const handleViewClick = record => {
    navigate(`/item-master/${record?.itemId}`);
  };

  const columns = [
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

  return (
    <div className={`bg-white rounded-lg shadow-sm border-l-4 overflow-hidden`}>
      <div className="p-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={handleRowExpand} onKeyDown={e => e.key === 'Enter' && handleRowExpand()} role="button" tabIndex={0}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isExpand ? <Icons.DownOutlined className="text-gray-500" style={{ fontSize: '20px' }} /> : <Icons.RightOutlined className="text-gray-500" style={{ fontSize: '20px' }} />}
            <Tag className="font-semibold">{item?.itemNo}</Tag>
          </div>
          <div className="flex items-center space-x-8">
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Item Name</p>
              <p className="text-lg font-bold">{item?.itemName}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total Qty</p>
              <p className="text-lg font-bold text-purple-600">{item?.quantity}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Remaining Qty</p>
              <p className="text-lg font-bold text-green-600">{item?.remainingQty}</p>
            </div>
          </div>
        </div>
      </div>

      {isExpand && item?.bomBasedItems?.length > 0 && <CustomTable columns={columns} data={item?.bomBasedItems} dynamicScrollY={false} onRowClick={handleViewClick} />}
    </div>
  );
};

const SalesOrderDetail = ({ salesOrder }) => {
  const [isExpand, setIsExpand] = useState(false);

  const handleRowExpand = () => {
    setIsExpand(!isExpand);
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border-l-4 overflow-hidden`}>
      <div className="p-4 cursor-pointer hover:bg-gray-50 transition-colors" onClick={handleRowExpand} onKeyDown={e => e.key === 'Enter' && handleRowExpand()} role="button" tabIndex={0}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isExpand ? <Icons.DownOutlined className="text-gray-500" style={{ fontSize: '20px' }} /> : <Icons.RightOutlined className="text-gray-500" style={{ fontSize: '20px' }} />}
            <Tag className="font-semibold">{salesOrder?.orderId}</Tag>
          </div>
          <div className="flex items-center space-x-8">
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Customer Name</p>
              <p className="text-lg font-bold">{salesOrder?.customerName}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
              <StatusBadge status={salesOrder?.status} value={SALES_ORDER_STATUS?.[salesOrder?.status] || '-'} />
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total Amount</p>
              <p className="text-lg font-bold">{formatAmount(salesOrder?.total || 0)}</p>
            </div>
          </div>
        </div>
      </div>

      {isExpand && salesOrder?.items?.length > 0 && (
        <div>
          {salesOrder?.items?.map(item => {
            return <ItemDetail item={item} key={item?.itemId} />;
          })}
        </div>
      )}
    </div>
  );
};

const ViewSalesOrderWiseRmAnalytics = () => {
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
  const { salesOrderWiseRmAnalytics, loading, getSalesOrderWiseRmAnalytics } = useAnalytics();
  const { getCustomerDropList, customerDropDownList, loading: customerLoading } = useCustomer();
  const isApicalledRefFilter = useRef({
    divisionDropdown: false,
    itemDropdown: false,
    customerDropdown: false,
  });

  const [filter, setFilter] = useState({
    division: searchParams.get('division')?.split(',') || '',
    branch: searchParams.get('branch')?.split(',') || '',
    item: searchParams.get('item') || '',
    customerId: searchParams.get('customerId') || '',
    status: searchParams.get('status')?.split(',') || '',
  });

  useEffect(() => {
    let payload = getQueryParams(window.location.href) || {};

    getSalesOrderWiseRmAnalytics({ ...payload });
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

  return (
    <div ref={containerRef} className="m-1/2 -my-4">
      <div className="flex justify-between items-center border-b bg-white sticky-page-header container-spacing -mx-4">
        <div className="flex items-center gap-3">
          <CustomButton
            type="default"
            text={<Icons.ArrowLeftOutlined />}
            onClick={() => {
              navigate('/analytics');
            }}
          />
          <p className="font-bold text-[1.125rem]">Sales Order Wise RM Analytics</p>
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

      <div className="space-y-3">
        {loading ? (
          <CustomLoader />
        ) : (
          salesOrderWiseRmAnalytics?.map(salesOrder => {
            return <SalesOrderDetail salesOrder={salesOrder} key={salesOrder?._id} />;
          })
        )}
      </div>
    </div>
  );
};

export default ViewSalesOrderWiseRmAnalytics;
