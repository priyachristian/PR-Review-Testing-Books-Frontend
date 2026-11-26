// React
import { useEffect, useRef, useState } from 'react';

// Third Party
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

// Components
import { Dropdown, Tag, Tooltip } from '@/components/AntDComponent';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import ColumnSelection from '@/components/ui/common/ColumnSelection';
import StatusFilterTabs from '@/components/ui/common/StatusFilterTabs';
import FilterLockButton from '@/components/ui/common/FilterLockButton';
import FilterDrawer, { FilterSection, FilterButton } from '@/components/ui/common/FilterDrawer';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomDatePicker from '@/components/forms/formDatePicker/CustomDatePicker';
import FilterInput from '@/components/forms/formInput/FilterInput';
import PageHeader from '@/components/ui/common/PageHeader';

// Hooks
import { useCustomer } from '@/features/sales/customer';
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import useModulePermissions from 'hooks/useModulePermissions';
import useDocumentListToolbar from '@/hooks/useDocumentListToolbar';
import useColumnResize from '@/hooks/useColumnResize';
import { useFilters, CommonFilterTags, getCustomerFilterTag } from '@/utils/filtersUtils';
import { useCustomerPayments, useCustomerPaymentActions, customerPaymentColumn, getRefId, PAYMENT_RECEIVED_LABEL } from '@/features/sales/customerPayment';

// Assets
import Icons from 'assets/icons/icon';

// Utils
import { getAllFiltersFromLocalStorage } from '@/utils/filters';
import { FILTERS_KEYS, RESOURCES } from '@/utils/jsonFile';
import { configEnum, filterInputEnum, CUSTOMER_PAYMENT_STATUS, PAYMENT_MODE_OPTIONS, PERMISSION_MESSAGES } from 'utils/constants';
import { CUSTOMER_PAYMENT_STATUS_OPTIONS } from '@/utils/dropdownEnums';
import { getFromLocalStorage, getQueryParams, parsedTableCoulmns } from 'utils/services';
import { ADMIN_ROUTE_PATHS } from '@/routes/adminRoutePaths';
import { PAGE_HEADERS } from '@/utils/label';
import { buildCustomerSelectOptions, customerSelectColumnHeader, customerSelectDropdownProps } from '@/utils/tableSelectDropdown/customerSelectDropdown';

const splitParam = value => (value ? value.split(',') : '');

// Same row style as the Payment Received list three-dot menu.
const MenuAction = ({ disabled, tooltip, onClick, icon: Icon, label, iconClass, hoverClass }) => (
  <Tooltip title={tooltip} placement="left">
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={`w-full px-3 py-2 text-left text-sm flex items-center transition-colors duration-150 ${
        disabled ? 'opacity-50 cursor-not-allowed text-gray-400' : `text-gray-700 cursor-pointer ${hoverClass}`
      }`}
    >
      <span className="flex items-center gap-2">
        <Icon className={disabled ? 'text-gray-400' : iconClass} style={{ fontSize: 14 }} />
        {label}
      </span>
    </button>
  </Tooltip>
);

const ViewCustomerPayments = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { customerPayments, pagination, loading, getCustomerPayments, resetCustomerPayments } = useCustomerPayments();
  const { useModuleCustomerPayment } = useModulePermissions(RESOURCES.CUSTOMER_PAYMENT);
  const { customerDropDownList, loading: customerLoading, getCustomerDropList } = useCustomer();

  const FILTER_KEY = FILTERS_KEYS.CUSTOMER_PAYMENT_ALL_FILTERS;
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilter, setShowFilter] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const isApiCalledRef = useRef(false);
  const isCustomerDropLoadedRef = useRef(false);

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
      status: splitParam(searchParams.get('status')),
      paymentMode: splitParam(searchParams.get('paymentMode')),
      customerId: splitParam(searchParams.get('customerId')),
    },
    dateKeys: { startDate: 'startDate', endDate: 'endDate', singleDate: 'paymentDate' },
  });

  const loadCustomerDropdown = () => {
    if (isCustomerDropLoadedRef.current) return;
    isCustomerDropLoadedRef.current = true;
    getCustomerDropList({});
  };

  const fetchCustomerPayments = signal => {
    const page = parseInt(searchParams?.get('page')) || 1;
    const limit = parseInt(searchParams?.get('limit')) || pagination?.limit;
    const payload = getQueryParams(window.location.href) || {};
    getCustomerPayments({ ...payload, page, limit, signal });
  };

  useEffect(() => {
    const savedFilters = getAllFiltersFromLocalStorage(FILTER_KEY);

    if (!isApiCalledRef.current && !searchParams.get('page') && !searchParams.get('limit')) {
      if (savedFilters && Object.keys(savedFilters).length > 0) {
        if (savedFilters.preset) setSelectedPreset(savedFilters.preset);
        if (savedFilters.startDate && savedFilters.endDate) {
          setDateRange([savedFilters.startDate, savedFilters.endDate]);
        } else if (savedFilters.paymentDate) {
          setDateRange([savedFilters.paymentDate, savedFilters.paymentDate]);
        }
        setFilter(prev => ({
          ...prev,
          search: savedFilters.search ?? prev.search,
          status: savedFilters.status ? savedFilters.status.split(',') : prev.status,
          paymentMode: savedFilters.paymentMode ? savedFilters.paymentMode.split(',') : prev.paymentMode,
          customerId: savedFilters.customerId ? savedFilters.customerId.split(',') : prev.customerId,
        }));
        if (savedFilters.customerId) loadCustomerDropdown();

        if (!areSavedFiltersApplied(savedFilters)) {
          isApiCalledRef.current = true;
          updateUrlParams(savedFilters);
          return;
        }
      }
      isApiCalledRef.current = true;
    }

    const controller = new AbortController();
    fetchCustomerPayments(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Customer names for filter tags when the page is opened with a customer filter in the URL.
  useEffect(() => {
    if (searchParams.get('customerId')) loadCustomerDropdown();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useResetOnUnmount(resetCustomerPayments);

  const { getBlockReasons, openRecord, openReject, actionModals, submitLoading } = useCustomerPaymentActions({
    onRejected: () => fetchCustomerPayments(),
  });

  const handleViewClick = record => {
    navigate(`/${ADMIN_ROUTE_PATHS.customerPayments.build.detail(getRefId(record))}`, {
      state: {
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleStatusTab = statusArr => {
    const status = Array.isArray(statusArr) ? statusArr : statusArr ? [statusArr] : [];
    setFilter(prev => ({ ...prev, status }));
    updateUrlParams({ status, page: 1, limit: pagination?.limit });
  };

  const handlePaginationChange = (page, pageSize) => {
    updateUrlParams({ page, limit: pageSize });
  };

  const handleTableChange = (paginationArg, filters, sorter) => {
    let sortParam = '';
    if (sorter && sorter.field) {
      const direction = sorter.order === 'descend' ? 'desc' : 'asc';
      sortParam = sorter.order ? `${sorter.field}:${direction}` : '';
    }
    updateUrlParams({ page: paginationArg.current, limit: paginationArg.pageSize, sortBy: sortParam });
  };

  const columns = customerPaymentColumn();
  const parsedColumnData = parsedTableCoulmns(getFromLocalStorage(configEnum?.CUSTOMER_PAYMENT_CONFIG), columns);
  const displayColumn = parsedColumnData?.displayColumn?.filter(x => x?.visible === true);
  const [columnsList, setColumnsList] = useState(parsedColumnData?.displayColumn);
  const [customizedColumns, setCutomizedColumns] = useState([...(parsedColumnData?.customizedColumn?.length > 0 ? parsedColumnData.customizedColumn : displayColumn)]);
  const handleColumnResize = useColumnResize(setColumnsList, setCutomizedColumns, configEnum?.CUSTOMER_PAYMENT_CONFIG);

  const { showColumnModal, setShowColumnModal, standardDropdownItems } = useDocumentListToolbar({
    filterKey: FILTER_KEY,
    columnConfigKey: configEnum?.CUSTOMER_PAYMENT_CONFIG,
    showPreferences: false,
    columnsConfig: {
      getDefaultColumns: customerPaymentColumn,
      setColumnsList,
      setCustomizedColumns: setCutomizedColumns,
    },
    handleResetFilters,
    onRefresh: () => fetchCustomerPayments(),
    setIsLocked,
  });

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden -m-4">
      <div className="bg-white px-4 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        <PageHeader
          loading={loading}
          title={PAGE_HEADERS?.CUSTOMER_PAYMENTS?.title}
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
          <StatusFilterTabs statuses={CUSTOMER_PAYMENT_STATUS_OPTIONS} value={filter?.status} onChange={handleStatusTab} />
          <div className="flex-grow" />
          <div className="flex gap-2 items-center">
            <FilterInput type={filterInputEnum?.SEARCH} name={'search'} placeHolder="Search..." value={filter?.search} setFilter={setFilter} onSerch={handleSearch} onClear={handleClear} />
            <FilterLockButton isLocked={isLocked} activeFiltersCount={getActiveFiltersCount()} onToggle={handleLockToggle} />
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
                mode="multiple"
                name={'status'}
                label={'Status'}
                placeHolder={'Select Status'}
                selectionOptions={CUSTOMER_PAYMENT_STATUS_OPTIONS}
                value={filter?.status}
                setFilter={setFilter}
                allowClear={true}
              />
            </div>
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                mode="multiple"
                name={'paymentMode'}
                label={'Mode'}
                placeHolder={'Select Mode'}
                selectionOptions={PAYMENT_MODE_OPTIONS}
                value={filter?.paymentMode}
                setFilter={setFilter}
                allowClear={true}
              />
            </div>
          </FilterSection>

          <FilterSection title="Who">
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
                allowClear={true}
                loading={customerLoading}
                onFocus={loadCustomerDropdown}
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
          dateKeys={{ startDateKey: 'startDate', endDateKey: 'endDate', singleDateKey: 'paymentDate' }}
          onDateClear={() => {
            setSelectedPreset('custom');
            setDateRange(null);
            updateUrlParams({ startDate: null, endDate: null, paymentDate: null, preset: null });
          }}
          STATUS_ENUM={CUSTOMER_PAYMENT_STATUS}
          extraFilters={{
            ...getCustomerFilterTag('Customer', customerDropDownList),
            paymentMode: {
              label: 'Payment Mode',
              format: value =>
                value
                  .split(',')
                  .map(item => PAYMENT_MODE_OPTIONS.find(option => option.value === item)?.label ?? item)
                  .join(', '),
              clear: (setFilterFn, updateUrlParamsFn) => {
                setFilterFn(prev => ({ ...prev, paymentMode: null }));
                updateUrlParamsFn({ paymentMode: null });
              },
            },
          }}
        />
      </div>

      <div>
        <CustomTable
          onColumnResize={handleColumnResize}
          columns={[...customizedColumns]}
          loading={loading}
          data={customerPayments}
          onRowClick={handleViewClick}
          onChange={handleTableChange}
          enableRowSelection
          selectionType="checkbox"
          tableId="id"
          renderSelectionLabel={(keys, rows) => {
            const record = rows?.[0];
            if (!record) return `${keys.length} selected`;
            return (
              <span className="flex items-center gap-2">
                <span>Payment#</span>
                <Tag className="font-semibold">{record?.customerPaymentId}</Tag>
              </span>
            );
          }}
          columnActions={() => ({
            title: 'Action',
            key: 'action',
            fixed: 'right',
            width: 110,
            visible: true,
            render: (_, record) => {
              const recordId = getRefId(record);
              const canView = useModuleCustomerPayment?.view;
              const { recordBlockReason, rejectBlockReason } = getBlockReasons(record);
              const recordDisabled = Boolean(recordBlockReason) || submitLoading;
              const rejectDisabled = Boolean(rejectBlockReason) || submitLoading;

              return (
                <div className="flex items-center gap-3">
                  <Tooltip title={canView ? 'View Customer Payment' : PERMISSION_MESSAGES.NO_PERMISSION}>
                    <Icons.EyeOutlined
                      className={`cursor-pointer ${canView ? '' : 'opacity-40 cursor-no-drop'}`}
                      style={{ fontSize: 17, color: '#1E3A56' }}
                      onClick={canView ? () => handleViewClick(record) : undefined}
                    />
                  </Tooltip>

                  <Dropdown
                    placement="bottomRight"
                    trigger={['click']}
                    open={openDropdownId === recordId}
                    onOpenChange={open => setOpenDropdownId(open ? recordId : null)}
                    dropdownRender={() => (
                      <div className="bg-white shadow-lg rounded-lg border border-gray-200 flex flex-col w-56 py-1">
                        <div className="px-2 py-1">
                          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">Status Actions :</div>
                        </div>
                        <MenuAction
                          disabled={recordDisabled}
                          tooltip={recordBlockReason || `Record as ${PAYMENT_RECEIVED_LABEL}`}
                          onClick={() => {
                            setOpenDropdownId(null);
                            openRecord(record);
                          }}
                          icon={Icons.CheckCircleOutlined}
                          label="Record Payment"
                          iconClass="text-green-800"
                          hoverClass="hover:bg-green-50 hover:text-green-800"
                        />
                        <MenuAction
                          disabled={rejectDisabled}
                          tooltip={rejectBlockReason || 'Reject Payment'}
                          onClick={() => {
                            setOpenDropdownId(null);
                            openReject(record);
                          }}
                          icon={Icons.CloseCircleOutlined}
                          label="Reject"
                          iconClass="text-red-800"
                          hoverClass="hover:bg-red-50 hover:text-red-800"
                        />
                      </div>
                    )}
                  >
                    <Tooltip title="More Actions" placement="left">
                      <span>
                        <Icons.MoreOutlined className="cursor-pointer" style={{ fontSize: 17, color: '#1E3A56' }} />
                      </span>
                    </Tooltip>
                  </Dropdown>
                </div>
              );
            },
          })}
          pagination={{
            current: searchParams?.get('page') || 1,
            pageSize: searchParams?.get('limit') || pagination?.limit,
            total: pagination?.totalResults,
            onChange: handlePaginationChange,
          }}
        />
      </div>

      <ColumnSelection
        hideTrigger
        columns={columnsList}
        setColumnsList={setColumnsList}
        setCutomizedColumns={setCutomizedColumns}
        configPage={configEnum?.CUSTOMER_PAYMENT_CONFIG}
        modalOpen={showColumnModal}
        setModalOpen={setShowColumnModal}
      />

      {actionModals}
    </div>
  );
};

export default ViewCustomerPayments;
