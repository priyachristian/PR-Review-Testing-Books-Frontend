// React
import { useEffect, useRef, useState } from 'react';

// Third Party
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

// Components
import { Button, Dropdown, Tag, Tooltip } from '@/components/AntDComponent';
import CustomDatePicker from '@/components/forms/formDatePicker/CustomDatePicker';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import ColumnSelection from '@/components/ui/common/ColumnSelection';
import CustomButton from '@/components/ui/button/CustomButton';
import FilterInput from '@/components/forms/formInput/FilterInput';
import PageHeader from '@/components/ui/common/PageHeader';
import RejectionReasonModal from '../components/RejectionReasonModal';
import ConvertToSalesOrderModal from '@/components/feedback/formModal/ConvertToSalesOrderModal';

// Hooks
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import useModulePermissions from 'hooks/useModulePermissions';
import useDocumentListToolbar from '@/hooks/useDocumentListToolbar';
import useColumnResize from '@/hooks/useColumnResize';
import { useCustomerOrders, customerOrderColumn } from '@/features/sales/customerOrder';
import { useFilters, CommonFilterTags, getCustomerFilterTag } from '@/utils/filtersUtils';
import { useCustomer } from '@/features/sales/customer';
import { useSampleCatalogs } from '@/features/sales/sampleCatalog';
import FilterDrawer, { FilterSection, FilterButton } from '@/components/ui/common/FilterDrawer';
import { resolveConversionCustomer } from 'hooks/useConvert';

// Assets
import Icons from 'assets/icons/icon';

// Utils
import { getAllFiltersFromLocalStorage } from '@/utils/filters';
import { buildCustomerSelectOptions, customerSelectColumnHeader, customerSelectDropdownProps } from '@/utils/tableSelectDropdown/customerSelectDropdown';
import { FILTERS_KEYS, RESOURCES } from '@/utils/jsonFile';
import {
  BACKEND_ENUM,
  configEnum,
  filterInputEnum,
  CUSTOMER_ORDER_STATUS,
  CUSTOMER_ORDER_STATUS_ACTIONS,
  CUSTOMER_ORDER_TYPE_FILTER_OPTIONS,
  CUSTOMER_ORDER_FILTER_HINT,
  CUSTOMER_ORDER_CONVERSION_ALLOWED_STATUSES,
  PERMISSION_MESSAGES,
} from 'utils/constants';
import { getCustomerOrderType } from '../customerOrder.columns';
import { getFromLocalStorage, getQueryParams, parsedTableCoulmns } from 'utils/services';
import { PAGE_HEADERS } from '@/utils/label';

const CUSTOMER_ORDER_STATUS_CHANGE_RESTRICTED = [BACKEND_ENUM?.COMPLETED];

const clearFilterTag = key => (setFilter, updateUrlParams) => {
  setFilter(prev => ({ ...prev, [key]: '' }));
  updateUrlParams({ [key]: null });
};

const catalogLabel = catalog => [catalog?.catalogCode, catalog?.name].filter(Boolean).join(' - ');

const getOrderFilterTags = (sampleCatalogs, customerDropDownList) => ({
  orderType: {
    label: 'Type',
    format: value => CUSTOMER_ORDER_TYPE_FILTER_OPTIONS.find(option => option.value === value)?.label,
    clear: clearFilterTag('orderType'),
  },
  sampleCatalogId: {
    label: 'Sample Catalog',
    format: value => catalogLabel(sampleCatalogs.find(catalog => catalog?.id === value)),
    clear: clearFilterTag('sampleCatalogId'),
  },
  ...getCustomerFilterTag('Customer', customerDropDownList),
});

const ViewCustomerOrders = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { customerOrders, pagination, loading, submitLoading, getCustomerOrders, resetCustomerOrders, updateStatus, getCustomerOrderById } = useCustomerOrders();
  const { useModuleCustomerOrder, useModuleSalesOrder, isViewOnly } = useModulePermissions(RESOURCES.CUSTOMER_ORDER);

  const [searchParams, setSearchParams] = useSearchParams();
  const [rejectionModal, setRejectionModal] = useState({
    open: false,
    order: null,
  });
  const [convertModal, setConvertModal] = useState({ open: false, order: null });
  const [openDropdownKey, setOpenDropdownKey] = useState(null);
  const FILTER_KEY = FILTERS_KEYS.CUSTOMER_ORDER_ALL_FILTERS;
  const isApiCalledRef = useRef(false);
  const [showFilter, setShowFilter] = useState(false);
  const { portalCustomers, loading: customerLoading, getPortalCustomers } = useCustomer();
  const { sampleCatalogs, loading: catalogLoading, getSampleCatalogs } = useSampleCatalogs();
  const loadedDropdownsRef = useRef({ customer: false, catalog: false });

  // Dropdown lists load once, on first focus or when a saved filter needs their labels.
  const loadCustomers = () => {
    if (loadedDropdownsRef.current.customer) return;
    loadedDropdownsRef.current.customer = true;
    getPortalCustomers({});
  };
  const loadCatalogs = () => {
    if (loadedDropdownsRef.current.catalog) return;
    loadedDropdownsRef.current.catalog = true;
    getSampleCatalogs({ pagination: false });
  };

  const {
    filter,
    setFilter,
    isLocked,
    selectedPreset,
    setSelectedPreset,
    dateRange,
    setDateRange,
    updateUrlParams,
    handleFilter,
    handleSearch,
    handleClear,
    handleResetFilters,
    areSavedFiltersApplied,
    getActiveFiltersCount,
    handleLockToggle,
    setIsLocked,
  } = useFilters({
    searchParams,
    setSearchParams,
    pagination,
    FILTER_KEY,
    setShowFilter,
    defaultFilter: {
      search: searchParams.get('search') || '',
      status: searchParams.get('status') ? searchParams.get('status').split(',') : '',
      orderType: searchParams.get('orderType') || '',
      sampleCatalogId: searchParams.get('sampleCatalogId') || '',
      customerId: searchParams.get('customerId') || '',
    },
    dateKeys: { startDate: 'startDate', endDate: 'endDate' },
  });

  useEffect(() => {
    const savedFilters = getAllFiltersFromLocalStorage(FILTER_KEY);

    if (!isApiCalledRef.current && !searchParams.get('page') && !searchParams.get('limit')) {
      if (savedFilters && Object.keys(savedFilters).length > 0) {
        if (savedFilters.preset) setSelectedPreset(savedFilters.preset);
        if (savedFilters.startDate && savedFilters.endDate) {
          setDateRange([savedFilters.startDate, savedFilters.endDate]);
        }
        setFilter(prev => ({
          ...prev,
          search: savedFilters.search ?? prev.search,
          status: savedFilters.status ? savedFilters?.status?.split(',') : prev.status,
          orderType: savedFilters.orderType ?? prev.orderType,
          sampleCatalogId: savedFilters.sampleCatalogId ?? prev.sampleCatalogId,
          customerId: savedFilters.customerId ?? prev.customerId,
        }));
        if (!areSavedFiltersApplied(savedFilters)) {
          isApiCalledRef.current = true;
          updateUrlParams(savedFilters);
          return;
        }
      }
      isApiCalledRef.current = true;
    }

    const controller = new AbortController();
    fetchCustomerOrders(controller.signal);
    return () => controller.abort();
  }, [searchParams]);

  useResetOnUnmount(resetCustomerOrders);

  useEffect(() => {
    if (searchParams.get('customerId')) loadCustomers();
    if (searchParams.get('sampleCatalogId')) loadCatalogs();
  }, [searchParams]);

  // Regular orders have no catalog, so a picked catalog is dropped.
  useEffect(() => {
    if (filter?.orderType === 'REGULAR' && filter?.sampleCatalogId) setFilter(prev => ({ ...prev, sampleCatalogId: '' }));
  }, [filter?.orderType]);

  const handleConvertToSalesOrder = async (order, values) => {
    const response = await getCustomerOrderById({
      customerOrderId: order?.id || order?._id,
      branchId: values.branchId,
    });
    const fullOrder = response?.payload?.data || order;

    const payload = {
      customerId: resolveConversionCustomer(fullOrder),
      items: (fullOrder?.items || []).map(item => ({
        ...item,
        sampleMinQty: undefined,
        sampleMaxQty: undefined,
        itemId: item?.itemId,
        itemName: item?.itemName || '',
        itemNo: item?.itemNo || '',
        hsnCode: item?.hsnCode || '',
        itemUnit: item?.itemUnitId?.name || item?.itemUnit || '',
        gst: item?.gst || '0',
      })),
      subTotal: fullOrder?.subTotal,
      cgst: fullOrder?.cgst,
      sgst: fullOrder?.sgst,
      igst: fullOrder?.igst,
      totalTax: fullOrder?.totalTax,
      total: fullOrder?.total,
      additionalCharges: fullOrder?.additionalCharges,
      addressId: fullOrder?.addressId || null,
      isRoundOff: fullOrder?.isRoundOff || false,
      roundOffAmount: fullOrder?.roundOffAmount || 0,
      reference: fullOrder?.reference,
      customerNotes: fullOrder?.customerNotes,
      divisionId: values.divisionId,
      divisionName: values.divisionName,
      branchId: values.branchId,
      branchName: values.branchName,
      warehouseId: values.warehouseId,
      warehouseName: values.warehouseName,
      customerOrderId: fullOrder?._id,
      customerOrderNo: fullOrder?.customerOrderId,
      sampleCatalogId: fullOrder?.sampleCatalogId || null,
      paymentTermsId: fullOrder?.paymentTermsId,
    };

    navigate('/sales-orders/new', {
      state: {
        salesOrderData: payload,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleViewClick = record => {
    navigate(`/customer-orders/${record.id}`, {
      state: {
        orderData: record,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleUpdateStatus = async (customerOrderId, status) => {
    await updateStatus({ customerOrderId, status });
    fetchCustomerOrders();
  };

  const openRejectModal = order => {
    setOpenDropdownKey(null);
    setRejectionModal({ open: true, order });
  };

  const handleRejectOrder = async rejectionReason => {
    const customerOrderId = rejectionModal?.order?.id || rejectionModal?.order?._id;
    if (!customerOrderId) return;
    await updateStatus({ customerOrderId, status: BACKEND_ENUM?.REJECTED, rejectionReason });
    setRejectionModal({ open: false, order: null });
    fetchCustomerOrders();
  };

  const getStatusActions = (status, order) => {
    const orderId = order?.id || order?._id;
    // Draft orders are still with the customer, so they have no actions.
    return (CUSTOMER_ORDER_STATUS_ACTIONS[getCustomerOrderType(order)]?.[status] || []).map(next => ({
      key: `markAs${next}`,
      label: `Mark As ${CUSTOMER_ORDER_STATUS?.[next]}`,
      onClick: () => (next === BACKEND_ENUM?.REJECTED ? openRejectModal(order) : handleUpdateStatus(orderId, next)),
    }));
  };

  const columns = customerOrderColumn();
  let columnsFromLocalStorage = getFromLocalStorage(configEnum?.CUSTOMER_ORDER_CONFIG);
  let parsedColumnData = parsedTableCoulmns(columnsFromLocalStorage, columns);
  let displayColumn = parsedColumnData?.displayColumn?.filter(x => x?.visible === true);
  const [columnsList, setColumnsList] = useState(parsedColumnData?.displayColumn);
  const [customizedColumns, setCutomizedColumns] = useState([...(parsedColumnData?.customizedColumn?.length > 0 ? parsedColumnData.customizedColumn : displayColumn)]);

  const handleColumnResize = useColumnResize(setColumnsList, setCutomizedColumns, configEnum?.CUSTOMER_ORDER_CONFIG);

  const fetchCustomerOrders = signal => {
    const page = parseInt(searchParams?.get('page')) || 1;
    const pageSize = parseInt(searchParams?.get('limit')) || pagination.limit;
    const payload = getQueryParams(window.location.href) || {};
    const sortBy = searchParams?.get('sortBy') || '';
    if (sortBy) payload.sortBy = sortBy;
    getCustomerOrders({ ...payload, page, limit: pageSize, signal });
  };

  const handlePaginationChange = (page, pageSize) => {
    updateUrlParams({ page, limit: pageSize });
  };

  const handleTableChange = (pagination, filters, sorter) => {
    let sortParam = '';
    if (sorter && sorter.field) {
      const direction = sorter.order === 'descend' ? 'desc' : 'asc';
      sortParam = `${sorter.field}:${direction}`;
    }
    updateUrlParams({ page: pagination.current, limit: pagination.pageSize, sortBy: sortParam });
  };

  const { showColumnModal, setShowColumnModal, standardDropdownItems } = useDocumentListToolbar({
    filterKey: FILTER_KEY,
    columnConfigKey: configEnum?.CUSTOMER_ORDER_CONFIG,
    showPreferences: false,
    columnsConfig: {
      getDefaultColumns: customerOrderColumn,
      setColumnsList,
      setCustomizedColumns: setCutomizedColumns,
    },
    handleResetFilters,
    onRefresh: () => fetchCustomerOrders(),
    setIsLocked,
  });

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden -m-4">
      <div className="bg-white px-4 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        <PageHeader
          loading={loading}
          title={PAGE_HEADERS?.CUSTOMER_ORDERS?.title}
          totalRecord={pagination?.totalResults}
          totalAmount={pagination?.totalAmount}
          totalAmountCurrency={pagination?.currency}
        />
        <div className="flex flex-wrap justify-center md:justify-end items-center gap-2 md:gap-3 w-full md:w-auto">
          <Tooltip title="More Actions" placement="left">
            <Dropdown menu={{ items: standardDropdownItems, className: 'app-toolbar-dropdown' }} trigger={['click']}>
              <CustomButton type="default" icon={<Icons.EllipsisOutlined />} />
            </Dropdown>
          </Tooltip>
        </div>
      </div>

      <div className="bg-white border-t px-4 py-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <FilterInput type={filterInputEnum?.SEARCH} name={'search'} placeHolder="Search..." value={filter?.search} setFilter={setFilter} onSerch={handleSearch} onClear={handleClear} />
          <ColumnSelection
            columns={columnsList}
            setColumnsList={setColumnsList}
            setCutomizedColumns={setCutomizedColumns}
            configPage={configEnum?.CUSTOMER_ORDER_CONFIG}
            modalOpen={showColumnModal}
            setModalOpen={setShowColumnModal}
          />
          <div className="flex-grow" />
          <div className="flex gap-2">
            <Tooltip title={isLocked ? 'Unlock filters to clear saved preferences' : 'Lock current filters to save preferences'} placement="top">
              <Button type={isLocked ? 'primary' : 'default'} icon={isLocked ? <Icons.UnlockOutlined /> : <Icons.LockOutlined />} onClick={handleLockToggle}>
                {isLocked ? 'Unlock' : 'Lock'}
              </Button>
            </Tooltip>
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
              <CustomDatePicker selectedPreset={selectedPreset} setSelectedPreset={setSelectedPreset} dateRange={dateRange} setDateRange={setDateRange} />
            </div>
          </FilterSection>

          <FilterSection title="What">
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name={'orderType'}
                label={'Type'}
                placeHolder={CUSTOMER_ORDER_TYPE_FILTER_OPTIONS[0].label}
                selectionOptions={CUSTOMER_ORDER_TYPE_FILTER_OPTIONS}
                value={filter?.orderType}
                setFilter={setFilter}
              />
              <Tooltip title={filter?.orderType === 'REGULAR' ? CUSTOMER_ORDER_FILTER_HINT.SAMPLE_CATALOG_REGULAR : ''} placement="top">
                <div>
                  <FilterInput
                    type={filterInputEnum?.SELECT}
                    name={'sampleCatalogId'}
                    label={'Sample Catalog'}
                    placeHolder={'Select Sample Catalog'}
                    selectionOptions={(sampleCatalogs || []).map(catalog => ({ value: catalog?.id, label: catalogLabel(catalog) }))}
                    value={filter?.sampleCatalogId}
                    setFilter={setFilter}
                    extraFilterValues={{ orderType: 'SAMPLE' }}
                    disabled={filter?.orderType === 'REGULAR'}
                    allowClear={true}
                    loading={catalogLoading}
                    onFocus={loadCatalogs}
                  />
                </div>
              </Tooltip>
              <FilterInput
                type={filterInputEnum?.SELECT}
                mode="multiple"
                name={'status'}
                label={'Status'}
                placeHolder={'Select Status'}
                selectionOptions={Object?.entries(CUSTOMER_ORDER_STATUS)?.map(([key, value]) => ({
                  value: key,
                  label: value,
                }))}
                value={filter?.status}
                setFilter={setFilter}
                allowClear={true}
              />
            </div>
          </FilterSection>

          <FilterSection title="Who">
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name={'customerId'}
                label={'Customer'}
                placeHolder={'Select Customer'}
                selectVariant="twoColumn"
                columnSelectHeader={customerSelectColumnHeader}
                selectPopupClassName={customerSelectDropdownProps.selectPopupClassName}
                selectionOptions={buildCustomerSelectOptions(portalCustomers)}
                value={filter?.customerId}
                setFilter={setFilter}
                allowClear={true}
                loading={customerLoading}
                onFocus={loadCustomers}
              />
            </div>
          </FilterSection>
        </FilterDrawer>

        <CommonFilterTags
          searchParams={searchParams}
          setFilter={setFilter}
          updateUrlParams={updateUrlParams}
          handleClear={handleClear}
          handleResetFilters={handleResetFilters}
          dateKeys={{ startDateKey: 'startDate', endDateKey: 'endDate' }}
          onDateClear={() => {
            setSelectedPreset('custom');
            setDateRange(null);
            updateUrlParams({ startDate: null, endDate: null, preset: null });
          }}
          STATUS_ENUM={CUSTOMER_ORDER_STATUS}
          extraFilters={getOrderFilterTags(sampleCatalogs || [], portalCustomers)}
        />
      </div>

      <div>
        <CustomTable
          onColumnResize={handleColumnResize}
          columns={[...customizedColumns]}
          loading={loading}
          data={customerOrders}
          onRowClick={handleViewClick}
          onChange={handleTableChange}
          pagination={{
            current: searchParams?.get('page') || 1,
            pageSize: searchParams?.get('limit') || pagination?.limit,
            total: pagination.totalResults,
            onChange: handlePaginationChange,
          }}
          enableRowSelection
          selectionType="checkbox"
          onSelectionChange={() => {}}
          tableId="id"
          renderSelectionLabel={(keys, rows) => {
            const r = rows?.[0];
            if (!r) return `${keys.length} selected`;
            return (
              <span className="flex items-center gap-2">
                <span>Order#</span>
                <Tag className="font-semibold">{r?.customerOrderId}</Tag>
              </span>
            );
          }}
          columnActions={() => ({
            title: 'Action',
            key: 'action',
            fixed: 'right',
            width: 130,
            visible: true,
            render: (_, record) => {
              const canView = useModuleCustomerOrder?.view;

              const viewTooltip = canView ? 'View Customer Order' : PERMISSION_MESSAGES.NO_PERMISSION;

              const statusAllowsConvert = CUSTOMER_ORDER_CONVERSION_ALLOWED_STATUSES?.includes(record?.status);
              const canConvertSO = useModuleSalesOrder?.create && statusAllowsConvert && !isViewOnly;
              const statusLabel = CUSTOMER_ORDER_STATUS?.[record?.status] || record?.status || '-';
              const convertSOTooltip = isViewOnly
                ? PERMISSION_MESSAGES.VIEW_ONLY
                : !useModuleSalesOrder?.create
                  ? PERMISSION_MESSAGES.NO_PERMISSION
                  : !statusAllowsConvert
                    ? `Cannot convert to Sales Order its current status - ${statusLabel}.`
                    : 'Convert to Sales Order';

              const dropDownItems = getStatusActions(record?.status, record);
              const canOpenMore = useModuleCustomerOrder?.edit && !isViewOnly;
              const canMarkStatus = canOpenMore && !CUSTOMER_ORDER_STATUS_CHANGE_RESTRICTED?.includes(record?.status) && dropDownItems?.length > 0;
              const moreTooltip = canOpenMore ? 'More Actions' : isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : PERMISSION_MESSAGES.NO_PERMISSION;

              return (
                <div className="flex items-center gap-3">
                  <Tooltip title={viewTooltip}>
                    <Icons.EyeOutlined
                      className={canView ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                      style={{ fontSize: 17, color: '#1E3A56' }}
                      onClick={canView ? () => handleViewClick(record) : undefined}
                    />
                  </Tooltip>

                  <Dropdown
                    placement="bottomRight"
                    trigger={['click']}
                    disabled={!canOpenMore}
                    open={canOpenMore && openDropdownKey === record.id}
                    onOpenChange={flag => {
                      if (!canOpenMore) return;
                      setOpenDropdownKey(flag ? record.id : null);
                    }}
                    dropdownRender={() => {
                      const markAsDisabled = !canMarkStatus || submitLoading;
                      const markAsTooltip = !canMarkStatus ? "You don't have permission to change status or this status cannot be changed." : 'Mark Customer Order As';

                      return (
                        <div className="bg-white shadow-lg rounded-lg border border-gray-200 flex flex-col w-56 py-1">
                          {dropDownItems.length > 0 && (
                            <>
                              <div className="px-2 py-1">
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">Status Actions :</div>
                              </div>
                              {dropDownItems.map((item, index) => {
                                const getStatusIcon = () => {
                                  const key = item.key || '';
                                  if (key.includes(BACKEND_ENUM.ACCEPTED) || key.includes(BACKEND_ENUM.COMPLETED)) {
                                    return {
                                      icon: <Icons.CheckCircleOutlined className={markAsDisabled ? 'text-gray-400' : 'text-green-800'} style={{ fontSize: 14 }} />,
                                      hoverClass: 'hover:bg-green-50 hover:text-green-800',
                                    };
                                  } else if (key.includes(BACKEND_ENUM.SENT)) {
                                    return {
                                      icon: <Icons.CheckCircleOutlined className={markAsDisabled ? 'text-gray-400' : 'text-blue-800'} style={{ fontSize: 14 }} />,
                                      hoverClass: 'hover:bg-blue-50 hover:text-blue-800',
                                    };
                                  } else if (key.includes(BACKEND_ENUM.REJECTED)) {
                                    return {
                                      icon: <Icons.CloseCircleOutlined className={markAsDisabled ? 'text-gray-400' : 'text-red-800'} style={{ fontSize: 14 }} />,
                                      hoverClass: 'hover:bg-red-50 hover:text-red-800',
                                    };
                                  } else if (key.includes(BACKEND_ENUM.CANCELLED)) {
                                    return {
                                      icon: <Icons.StopOutlined className={markAsDisabled ? 'text-gray-400' : 'text-rose-800'} style={{ fontSize: 14 }} />,
                                      hoverClass: 'hover:bg-rose-50 hover:text-rose-800',
                                    };
                                  }
                                  return {
                                    icon: <Icons.CheckCircleOutlined className={markAsDisabled ? 'text-gray-400' : 'text-blue-800'} style={{ fontSize: 14 }} />,
                                    hoverClass: 'hover:bg-blue-50 hover:text-blue-800',
                                  };
                                };

                                const statusIcon = getStatusIcon();

                                return (
                                  <Tooltip key={item.key} title={markAsDisabled ? markAsTooltip : item.label} placement="left">
                                    <button
                                      type="button"
                                      onClick={
                                        markAsDisabled
                                          ? undefined
                                          : () => {
                                              setOpenDropdownKey(null);
                                              item.onClick?.();
                                            }
                                      }
                                      disabled={markAsDisabled}
                                      className={`
                                        w-full px-3 py-2 text-left text-sm flex items-center
                                        transition-colors duration-150
                                        ${markAsDisabled ? 'opacity-50 cursor-not-allowed text-gray-400' : `text-gray-700 ${statusIcon.hoverClass} cursor-pointer`}
                                        ${index === 0 ? 'rounded-t' : ''}
                                        ${index === dropDownItems.length - 1 ? 'rounded-b' : ''}
                                      `}
                                    >
                                      {submitLoading ? (
                                        <span className="flex items-center gap-2">
                                          <CustomLoader variant="button" text="Updating..." />
                                        </span>
                                      ) : (
                                        <span className="flex items-center gap-2">
                                          {statusIcon.icon}
                                          {item.label}
                                        </span>
                                      )}
                                    </button>
                                  </Tooltip>
                                );
                              })}
                              <div className="border-t border-gray-200 my-1"></div>
                            </>
                          )}

                          {/* Convert to Sales Order */}
                          <div className="px-2 py-1">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">Convert :</div>
                          </div>
                          <Tooltip title={convertSOTooltip} placement="left">
                            <button
                              type="button"
                              onClick={
                                canConvertSO && !submitLoading
                                  ? () => {
                                      setOpenDropdownKey(null);
                                      setConvertModal({ open: true, order: record });
                                    }
                                  : undefined
                              }
                              disabled={!canConvertSO || submitLoading}
                              className={`
                                w-full px-3 py-2 text-left text-sm
                                flex items-center gap-2
                                transition-colors duration-150 rounded-b
                                ${!canConvertSO || submitLoading ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-gray-700 hover:bg-green-50 hover:text-green-600 cursor-pointer'}
                              `}
                            >
                              {submitLoading ? (
                                <span className="flex items-center gap-2">
                                  <CustomLoader variant="button" text="Converting..." />
                                </span>
                              ) : (
                                <>
                                  <Icons.SwapOutlined className={!canConvertSO || submitLoading ? 'text-gray-400' : 'text-green-500'} style={{ fontSize: 16 }} />
                                  <span>To Sales Order</span>
                                </>
                              )}
                            </button>
                          </Tooltip>
                        </div>
                      );
                    }}
                  >
                    <Tooltip title={moreTooltip} placement="left">
                      <span className={canOpenMore ? 'inline-flex cursor-pointer' : 'inline-flex opacity-40 cursor-not-allowed'} style={{ cursor: canOpenMore ? 'pointer' : 'not-allowed' }}>
                        <Icons.MoreOutlined style={{ fontSize: 17, color: canOpenMore ? '#1E3A56' : '#9ca3af', cursor: 'inherit' }} />
                      </span>
                    </Tooltip>
                  </Dropdown>
                </div>
              );
            },
          })}
        />
      </div>

      <RejectionReasonModal
        open={rejectionModal.open}
        idValue={rejectionModal?.order?.customerOrderId}
        status={BACKEND_ENUM?.REJECTED}
        statusLabelMap={CUSTOMER_ORDER_STATUS}
        idLabel="Order No"
        onCancel={() => setRejectionModal({ open: false, order: null })}
        onSubmit={handleRejectOrder}
        reasons={[]}
        loading={submitLoading}
      />

      <ConvertToSalesOrderModal
        open={convertModal.open}
        onClose={() => setConvertModal({ open: false, order: null })}
        onSubmit={values => handleConvertToSalesOrder(convertModal.order, values)}
        orderNo={convertModal.order?.customerOrderId}
        customerName={convertModal.order?.customerId?.customerDisplayName || convertModal.order?.customerDisplayName}
      />
    </div>
  );
};

export default ViewCustomerOrders;
