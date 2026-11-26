import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

// Components
import ColumnSelection from '@/components/ui/common/ColumnSelection';
import StatusFilterTabs from '@/components/ui/common/StatusFilterTabs';
import FilterLockButton from '@/components/ui/common/FilterLockButton';
import FilterDrawer, { FilterSection, FilterButton } from '@/components/ui/common/FilterDrawer';
import ConvertToSelectionModal from '../components/ConvertToSelectionModal';
import CustomButton from '@/components/ui/button/CustomButton';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomDatePicker from '@/components/forms/formDatePicker/CustomDatePicker';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import { DocumentConfirmModal } from '@/components/feedback/confirmModal/CancelOrDeleteDocumentModal';
import FilterInput from '@/components/forms/formInput/FilterInput';
import PageHeader from '@/components/ui/common/PageHeader';
import ViewDocumentListToolbarModals from '@/components/ui/common/ViewDocumentListToolbarModals';

import { Dropdown, Tag, Tooltip } from '@/components/AntDComponent';

// Hooks
import { useConvert } from 'hooks/useConvert';
import useModulePermissions from 'hooks/useModulePermissions';
import { useFilters } from '@/utils/filtersUtils';
import { useUser } from '@/features/setting/user/useUser';
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import useDocumentListToolbar from '@/hooks/useDocumentListToolbar';
import useDocumentPdfExport from '@/hooks/useDocumentPdfExport';
import useColumnResize from '@/hooks/useColumnResize';
import { useConfirmModal } from '@/hooks/useConfirmModal';
import { useCustomer } from '@/features/sales/customer';

// Extras
import { usePurchaseOrder, purchaseOrderColumn, purchaseOrderExportColumn, getPurchaseOrderDocumentDetails } from '@/features/purchase/purchaseOrder';
import Icons from 'assets/icons/icon';
import { FILTERS_KEYS, RESOURCES } from '@/utils/jsonFile';
import { CommonFilterTags, getCustomerFilterTag } from '@/utils/filtersUtils';
import { resetBranch } from '@/features/allMaster/warehouse/warehouse.slice';
import {
  BACKEND_ENUM,
  configEnum,
  filterInputEnum,
  MODULE_NAMES,
  PERMISSION_MESSAGES,
  PURCHASE_ORDER_CONVERSION_ALLOWED_STATUSES,
  PURCHASE_ORDER_EDIT_RESTRICTED_STATUS,
  PURCHASE_ORDER_STATUS,
  PURCHASE_ORDER_STATUS_CHANGE_RESTRICTED_STATUS,
} from 'utils/constants';
import { getAllFiltersFromLocalStorage } from '@/utils/filters';
import { getGstNumericRate } from '@/utils/gstDisplay';
import { getFromLocalStorage, getQueryParams, parsedTableCoulmns } from 'utils/services';
import { colorPalette } from '@/utils/theme';
import { PAGE_HEADERS } from '@/utils/label';
import { toDecimalString } from '@/utils/currency';
import { buildDivisionSelectOptions, buildBranchSelectOptions, divisionSelectColumnHeader, branchSelectColumnHeader } from '@/utils/tableSelectDropdown/orgSelectDropdown';
import { buildCustomerSelectOptions, vendorSelectColumnHeader, customerSelectDropdownProps } from '@/utils/tableSelectDropdown/customerSelectDropdown';
import LocationFilters, { getLocationFilterTags } from '@/components/forms/formInput/LocationFilters';

const API_CALLED_ENUM = {
  DIVISION_DROPDOWN: 'divisionDropdown',
  USERS_DROPDOWN: 'usersDropdown',
  VENDOR_DROPDOWN: 'vendorDropdown',
};

const ViewPurchaseOrders = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { purchaseOrders, pagination, loading, submitLoading, deleteLoading, exportLoading, getPurchaseOrder, getPurchaseOrderExports, removePurchaseOrder, resetPurchaseOrders, updateStatus } =
    usePurchaseOrder();
  const { isViewOnly, useModulePurchaseOrder, divDrop, divisionLoading, getDivDropDown, branchDrop, branchLoading, getBranchDropDown, useModuleGrpo, useModuleBills } = useModulePermissions(
    RESOURCES.PURCHASE_ORDER
  );
  const { usersDropdown, usersDropdownLoading, getUsersDropdown } = useUser();
  const { vendorDropDownList, loading: vendorLoading, getVendorDropList } = useCustomer();
  const FILTER_KEY = FILTERS_KEYS.PURCHASE_ORDER_ALL_FILTER;
  const { handleConvertPurchaseOrder } = useConvert();
  const deleteModal = useConfirmModal();
  const cancelStatusModal = useConfirmModal();
  const [openDropdownKey, setOpenDropdownKey] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const isApiCalledRef = useRef(false);
  const isApicalledRefFilter = useRef({
    divisionDropdown: false,
    usersDropdown: false,
    vendorDropdown: false,
  });
  const [isOpenConvertModal, setIsOpenConvertModal] = useState(false);
  const [convertType, setConvertType] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  // const [clearSelection, setClearSelection] = useState(null);
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
    handleLockToggle,
    getActiveFiltersCount,
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
      division: searchParams.get('division') ? searchParams.get('division').split(',') : '',
      branch: searchParams.get('branch') ? searchParams.get('branch').split(',') : '',
      customerId: searchParams.get('customerId') ? searchParams.get('customerId').split(',') : '',
      addedBy: searchParams.get('addedBy') ? searchParams.get('addedBy').split(',') : '',
      country: searchParams.get('country') ? searchParams.get('country').split(',') : '',
      state: searchParams.get('state') ? searchParams.get('state').split(',') : '',
      city: searchParams.get('city') ? searchParams.get('city').split(',') : '',
      addressType: searchParams.get('addressType') || '',
    },
    dateKeys: { startDate: 'startDate', endDate: 'endDate', singleDate: 'purchaseOrderDate' },
  });

  useEffect(() => {
    const savedFilters = getAllFiltersFromLocalStorage(FILTER_KEY);

    if (!isApiCalledRef.current && !searchParams.get('page') && !searchParams.get('limit')) {
      if (savedFilters && Object.keys(savedFilters).length > 0) {
        if (savedFilters.preset) {
          setSelectedPreset(savedFilters.preset);
        }
        if (savedFilters.startDate && savedFilters.endDate) {
          setDateRange([savedFilters.startDate, savedFilters.endDate]);
        } else if (savedFilters.purchaseOrderDate) {
          setDateRange([savedFilters.purchaseOrderDate, savedFilters.purchaseOrderDate]);
        }

        setFilter(prev => ({
          ...prev,
          search: savedFilters.search ?? prev.search,
          status: savedFilters.status ? savedFilters?.status?.split(',') : prev.status,
          division: savedFilters.division ? savedFilters?.division?.split(',') : prev.division,
          branch: savedFilters.branch ? savedFilters?.branch?.split(',') : prev.branch,
          customerId: savedFilters.customerId ? savedFilters?.customerId?.split(',') : prev.customerId,
          addedBy: savedFilters.addedBy ? savedFilters.addedBy.split(',') : prev.addedBy,
          country: savedFilters.country ? savedFilters.country.split(',') : prev.country,
          state: savedFilters.state ? savedFilters.state.split(',') : prev.state,
          city: savedFilters.city ? savedFilters.city.split(',') : prev.city,
          addressType: savedFilters.addressType ?? prev.addressType,
        }));

        if (savedFilters?.division?.split(',')?.length > 0) {
          handleOnFocusApiCall(API_CALLED_ENUM.DIVISION_DROPDOWN);
        }
        if (savedFilters?.customerId?.split(',')?.length > 0) {
          handleOnFocusApiCall(API_CALLED_ENUM.VENDOR_DROPDOWN);
        }

        if (savedFilters?.addedBy?.split(',')?.length > 0) {
          handleOnFocusApiCall(API_CALLED_ENUM.USERS_DROPDOWN);
        }

        if (!areSavedFiltersApplied(savedFilters)) {
          isApiCalledRef.current = true;
          updateUrlParams(savedFilters);
          return;
        }
      }
      isApiCalledRef.current = true;
    }

    const controller = new AbortController();
    fetchPurchaseOrder(controller.signal);
    return () => controller.abort();
  }, [dispatch, searchParams]);

  useResetOnUnmount(resetPurchaseOrders);

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

  const handleOnFocusApiCall = async type => {
    let obj = { ...isApicalledRefFilter.current };

    if (type === API_CALLED_ENUM.DIVISION_DROPDOWN) {
      await getDivDropDown({});
      obj.divisionDropdown = true;
    }

    if (type === API_CALLED_ENUM.USERS_DROPDOWN) {
      await getUsersDropdown();
      obj.usersDropdown = true;
    }

    if (type === API_CALLED_ENUM.VENDOR_DROPDOWN) {
      await getVendorDropList({});
      obj.vendorDropdown = true;
    }

    isApicalledRefFilter.current = obj;
  };

  useEffect(() => {
    if (searchParams.get('division')) {
      handleOnFocusApiCall(API_CALLED_ENUM.DIVISION_DROPDOWN);
    }
    if (searchParams.get('addedBy')) {
      handleOnFocusApiCall(API_CALLED_ENUM.USERS_DROPDOWN);
    }
    if (searchParams.get('customerId')) {
      handleOnFocusApiCall(API_CALLED_ENUM.VENDOR_DROPDOWN);
    }
  }, []);

  const handleCloseConvertModal = () => {
    setIsOpenConvertModal(false);
  };

  const handleEditClick = record => {
    navigate(`/purchase-orders/${record.id}/edit`, {
      state: {
        purchaseOrderData: record,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleDuplicateClick = record => {
    navigate('/purchase-orders/new', {
      state: {
        duplicateFromId: record.id,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const fetchPurchaseOrder = signal => {
    const page = parseInt(searchParams?.get('page')) || 1;
    const pageSize = parseInt(searchParams?.get('limit')) || pagination.limit;

    let payload = getQueryParams(window.location.href) || {};

    if (Object.keys(payload)?.length <= 0) {
      payload = { page, limit: pageSize };
    }

    getPurchaseOrder({ ...payload, page, limit: pageSize, signal });
  };

  const handleStatusTab = statusArr => {
    const status = Array.isArray(statusArr) ? statusArr : statusArr ? [statusArr] : [];
    setFilter(prev => ({ ...prev, status }));
    updateUrlParams({ status, page: 1, limit: pagination?.limit });
  };

  const handlePaginationChange = (page, pageSize) => {
    updateUrlParams({ page, limit: pageSize });
  };

  const handleTableChange = (pagination, filters, sorter) => {
    let sortByValue = '';

    if (sorter && sorter.field) {
      sortByValue = sorter.order === 'ascend' ? sorter.field : `-${sorter.field}`;
    }

    updateUrlParams({
      sortBy: sortByValue,
      page: 1,
      limit: pagination?.pageSize || DEFAULT_PAGE_SIZE,
    });
  };

  const handleViewClick = record => {
    navigate(`/purchase-orders/${record.id}`, {
      state: {
        purchaseOrderData: record,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const convertHandle = (data, type) => {
    const clonedData = structuredClone(data);

    let updatedItems = [];
    clonedData?.items?.forEach(x => {
      if (data?.status === BACKEND_ENUM?.PARTIALLY_RECORDED) {
        if (x?.remainingQty > 0) {
          const quantity = parseFloat(x?.remainingQty || x?.quantity);
          const rate = parseFloat(x.rate || 0);
          const gst = getGstNumericRate(x.gst);
          const amount = quantity * rate;
          const taxAmount = (gst / 100) * amount;
          updatedItems.push({
            ...x,
            referenceId: clonedData?.id || clonedData?._id,
            referenceNo: clonedData?.purchaseOrderId,
            quantity,
            referenceType: 'PurchaseOrder',
            taxAmount: taxAmount ? toDecimalString(parseFloat(taxAmount)) : 0,
            amount: amount ? toDecimalString(parseFloat(amount)) : 0,
          });
        }
      } else {
        const quantity = parseFloat(x?.quantity);
        const rate = parseFloat(x.rate || 0);
        const gst = getGstNumericRate(x.gst);
        const amount = quantity * rate;
        const taxAmount = (gst / 100) * amount;
        updatedItems.push({
          ...x,
          referenceId: clonedData?.id || clonedData?._id,
          referenceNo: clonedData?.purchaseOrderId,
          quantity,
          referenceType: 'PurchaseOrder',
          taxAmount: taxAmount ? toDecimalString(parseFloat(taxAmount)) : 0,
          amount: amount ? toDecimalString(parseFloat(amount)) : 0,
        });
      }
    });

    clonedData.items = updatedItems;

    handleConvertPurchaseOrder(clonedData, type);
  };

  const handleDeleteClick = record => {
    deleteModal.open(record);
  };

  const deletePurchaseOrder = async () => {
    await removePurchaseOrder({ purchaseOrderId: deleteModal.payload?.id });
    deleteModal.close();
    fetchPurchaseOrder();
    // if (clearSelection) {
    //   clearSelection();
    // }
  };

  const handleUpdateStatus = async (purchaseOrderId, status) => {
    await updateStatus({ purchaseOrderId, status });
    fetchPurchaseOrder();
  };

  const updateOrderStatus = async (order, newStatus) => {
    setOpenDropdownKey(null);
    if (newStatus === BACKEND_ENUM?.CANCELLED) {
      cancelStatusModal.open({
        order,
        newStatus,
        label: PURCHASE_ORDER_STATUS?.[newStatus] || newStatus,
      });
      return;
    }
    await handleUpdateStatus(order?.id || order?._id, newStatus);
  };

  const confirmCancelStatus = async () => {
    const order = cancelStatusModal.payload?.order;
    const newStatus = cancelStatusModal.payload?.newStatus;
    await handleUpdateStatus(order?.id || order?._id, newStatus);
    cancelStatusModal.close();
  };

  const getConvertStatusValue = (status, order) => {
    let statusArr = [];
    const purchaseOrderId = order?.id || order?._id;

    const markAs = (backendStatus, labelStatus) => ({
      key: `markAs${labelStatus}`,
      label: `Mark As ${labelStatus}`,
      onClick: () => handleUpdateStatus(purchaseOrderId, backendStatus),
    });
    const draftItem = markAs(BACKEND_ENUM?.DRAFT, PURCHASE_ORDER_STATUS?.DRAFT);
    const sentItem = markAs(BACKEND_ENUM?.SENT, PURCHASE_ORDER_STATUS?.SENT);
    const closedItem = {
      key: `markAs${PURCHASE_ORDER_STATUS?.CLOSED}`,
      label: `Mark As ${PURCHASE_ORDER_STATUS?.CLOSED}`,
      onClick: () => updateOrderStatus(order, BACKEND_ENUM?.CLOSED),
    };
    const cancelItem = {
      key: `markAs${PURCHASE_ORDER_STATUS?.CANCELLED}`,
      label: `Mark As ${PURCHASE_ORDER_STATUS?.CANCELLED}`,
      onClick: () => updateOrderStatus(order, BACKEND_ENUM?.CANCELLED),
    };

    if (status === BACKEND_ENUM?.DRAFT) {
      statusArr = [sentItem, cancelItem];
    } else if (status === BACKEND_ENUM?.SENT) {
      statusArr = [markAs(BACKEND_ENUM?.ACCEPTED, PURCHASE_ORDER_STATUS?.ACCEPTED), markAs(BACKEND_ENUM?.REJECTED, PURCHASE_ORDER_STATUS?.REJECTED), draftItem, cancelItem];
    } else if (status === BACKEND_ENUM?.ACCEPTED) {
      statusArr = [markAs(BACKEND_ENUM?.CONVERTED, PURCHASE_ORDER_STATUS?.CONVERTED), sentItem, draftItem, cancelItem];
    } else if (status === BACKEND_ENUM?.REJECTED) {
      statusArr = [draftItem, cancelItem];
    } else if (status === BACKEND_ENUM?.CONVERTED) {
      statusArr = [cancelItem];
    } else if (status === BACKEND_ENUM?.PARTIALLY_RECORDED) {
      statusArr = [closedItem, cancelItem];
    } else if (status === BACKEND_ENUM?.CLOSED) {
      statusArr = [markAs(BACKEND_ENUM?.PARTIALLY_RECORDED, PURCHASE_ORDER_STATUS?.PARTIALLY_RECORDED)];
    } else if (status === BACKEND_ENUM?.CANCELLED) {
      statusArr = [draftItem, sentItem];
    }

    return statusArr;
  };

  const columns = purchaseOrderColumn();

  let columnsFromLocalStorage = getFromLocalStorage(configEnum?.PURCHASE_ORDER_CONFIG);
  let parsedColumnData = parsedTableCoulmns(columnsFromLocalStorage, columns);

  let displayColumn = parsedColumnData?.displayColumn?.filter(x => x?.visible === true);
  const [columnsList, setColumnsList] = useState(parsedColumnData?.displayColumn);
  const [customizedColumns, setCutomizedColumns] = useState([...(parsedColumnData?.customizedColumn?.length > 0 ? parsedColumnData.customizedColumn : displayColumn)]);

  const handleColumnResize = useColumnResize(setColumnsList, setCutomizedColumns, configEnum?.PURCHASE_ORDER_CONFIG);

  const { pdfExportLoading, handlePdfExport } = useDocumentPdfExport({
    defaultFileName: 'Purchase_Orders_Export',
    entityLabel: 'purchase orders',
    filterKeys: ['purchaseOrderDate', 'country', 'state', 'city', 'addressType'],
    moduleType: 'purchaseOrder',
  });

  const { showColumnModal, setShowColumnModal, standardDropdownItems, toolbarModalsProps } = useDocumentListToolbar({
    moduleName: MODULE_NAMES.PURCHASE_ORDER,
    resource: RESOURCES.PURCHASE_ORDER,
    filterKey: FILTER_KEY,
    columnConfigKey: configEnum?.PURCHASE_ORDER_CONFIG,
    configErrorMessage: 'Failed to update purchase order configuration',
    exportConfig: {
      exportLoading: exportLoading || pdfExportLoading,
      fetchExports: getPurchaseOrderExports,
      getExportColumns: purchaseOrderExportColumn,
      defaultFileName: 'Purchase_Orders_Export',
      sheetName: 'Purchase Orders',
      entityPlural: 'Purchase Orders',
      formName: 'export-purchase-orders',
      exportLabel: 'Export Purchase Orders',
      formats: ['xlsx', 'pdf'],
      onPdfExport: handlePdfExport,
    },
    columnsConfig: {
      getDefaultColumns: purchaseOrderColumn,
      setColumnsList,
      setCustomizedColumns: setCutomizedColumns,
    },
    handleResetFilters,
    onRefresh: () => fetchPurchaseOrder(),
    setIsLocked,
  });

  const dropdownItems = [
    ...((useModuleGrpo?.create || useModuleBills?.create) && !isViewOnly
      ? [
          {
            type: 'group',
            label: 'CONVERT',
            children: [
              ...(useModuleGrpo?.create
                ? [
                    {
                      key: 'convertToGrpo',
                      label: 'Convert to GRPO',
                      icon: <Icons.DeliveredProcedureOutlined />,
                      onClick: ({ domEvent }) => {
                        domEvent.stopPropagation();
                        setConvertType('GRPO');
                        setIsOpenConvertModal(true);
                      },
                    },
                  ]
                : []),

              ...(useModuleBills?.create
                ? [
                    {
                      key: 'convertToBill',
                      label: 'Convert to Bills',
                      icon: <Icons.FileTextOutlined />,
                      onClick: ({ domEvent }) => {
                        domEvent.stopPropagation();
                        setConvertType('Bill');
                        setIsOpenConvertModal(true);
                      },
                    },
                  ]
                : []),
            ],
          },
          {
            type: 'divider',
          },
        ]
      : []),

    ...standardDropdownItems,
  ];
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden -m-4">
      <div className="bg-white px-4 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        <PageHeader loading={loading} title={PAGE_HEADERS?.PURCHASE_ORDERS?.title} totalAmount={pagination?.totalAmount} totalRecord={pagination?.totalResults} />

        <div className="flex flex-wrap justify-center md:justify-end items-center gap-2 md:gap-3 w-full md:w-auto">
          <PermissionButton
            canAccess={useModulePurchaseOrder?.create}
            isViewOnly={isViewOnly}
            type="primary"
            className="w-full md:w-auto py-2 md:py-4 px-4 md:px-5"
            wrapperClassName="w-full md:w-auto inline-block"
            onClick={() =>
              navigate('/purchase-orders/new', {
                state: {
                  prevFrom: location.pathname,
                  historyStack: [...(location.state?.historyStack || []), location.pathname],
                },
              })
            }
            icon={<Icons.PlusCircleOutlined />}
            text="Add"
          />
          <Tooltip title="More Actions" placement="left">
            <Dropdown menu={{ items: dropdownItems, className: 'app-toolbar-dropdown' }} trigger={['click']}>
              <CustomButton type="default" icon={<Icons.EllipsisOutlined />} />
            </Dropdown>
          </Tooltip>
        </div>
      </div>

      <div className="bg-white border-t px-4 py-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <StatusFilterTabs statuses={Object.entries(PURCHASE_ORDER_STATUS).map(([key, label]) => ({ value: key, label }))} value={filter?.status} onChange={handleStatusTab} />
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
                selectionOptions={Object?.entries(PURCHASE_ORDER_STATUS)?.map(([key, value]) => {
                  return { value: key, label: value };
                })}
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
                mode="multiple"
                name={'customerId'}
                label={'Vendor'}
                placeHolder={'Select Vendor'}
                selectVariant="twoColumn"
                columnSelectHeader={vendorSelectColumnHeader}
                selectPopupClassName={customerSelectDropdownProps.selectPopupClassName}
                selectionOptions={buildCustomerSelectOptions(vendorDropDownList)}
                value={filter?.customerId}
                setFilter={setFilter}
                allowClear={true}
                loading={vendorLoading}
                onFocus={() => {
                  if (!isApicalledRefFilter.current.vendorDropdown) {
                    handleOnFocusApiCall(API_CALLED_ENUM.VENDOR_DROPDOWN);
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                mode="multiple"
                name={'addedBy'}
                label={'Added By'}
                placeHolder={'Select User'}
                selectionOptions={(usersDropdown || []).map(u => ({
                  label: u.name || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || '',
                  value: u.id || u._id,
                }))}
                value={filter?.addedBy}
                setFilter={setFilter}
                allowClear={true}
                loading={usersDropdownLoading}
                onFocus={() => {
                  if (!isApicalledRefFilter.current.usersDropdown) {
                    handleOnFocusApiCall(API_CALLED_ENUM.USERS_DROPDOWN);
                  }
                }}
              />
            </div>
          </FilterSection>

          <FilterSection title="Where">
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                mode="multiple"
                name={'division'}
                label={'Division'}
                placeHolder={'Select Division'}
                selectVariant="twoColumn"
                columnSelectHeader={divisionSelectColumnHeader}
                selectionOptions={buildDivisionSelectOptions(divDrop)}
                value={filter?.division}
                setFilter={setFilter}
                allowClear={true}
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
                name={'branch'}
                label={'Branch'}
                placeHolder={'Select Branch'}
                selectVariant="twoColumn"
                columnSelectHeader={branchSelectColumnHeader}
                selectionOptions={buildBranchSelectOptions(branchDrop)}
                value={filter?.branch}
                setFilter={setFilter}
                allowClear={true}
                disabled={!filter?.division}
                loading={branchLoading}
              />
            </div>
            <LocationFilters filter={filter} setFilter={setFilter} />
          </FilterSection>
        </FilterDrawer>
        <CommonFilterTags
          searchParams={searchParams}
          setFilter={setFilter}
          updateUrlParams={updateUrlParams}
          handleClear={handleClear}
          handleResetFilters={handleResetFilters}
          dateKeys={{
            startDateKey: 'startDate',
            endDateKey: 'endDate',
            singleDateKey: 'purchaseOrderDate',
          }}
          onDateClear={() => {
            setSelectedPreset('custom');
            setDateRange(null);
            updateUrlParams({
              startDate: null,
              endDate: null,
              purchaseOrderDate: null,
              preset: null,
            });
          }}
          STATUS_ENUM={PURCHASE_ORDER_STATUS}
          divDrop={divDrop}
          branchDrop={branchDrop}
          extraFilters={{
            ...getCustomerFilterTag('Vendor', vendorDropDownList),
            addedBy: {
              label: 'Added By',
              format: value => {
                if (!value) return null;
                const ids = value.split(',').filter(Boolean);
                if (!ids.length) return null;
                const names = ids.map(id => {
                  const found = (usersDropdown || []).find(u => String(u?.id || u?._id) === String(id));
                  return found ? found.name || [found.firstName, found.lastName].filter(Boolean).join(' ') || found.email || null : null;
                });
                return names.filter(Boolean).join(', ');
              },
              clear: (setFilter, updateUrlParams) => {
                setFilter(prev => ({ ...prev, addedBy: '' }));
                updateUrlParams({ addedBy: null });
              },
            },
            ...getLocationFilterTags(),
          }}
        />
      </div>
      <div>
        <CustomTable
          onColumnResize={handleColumnResize}
          columns={[...customizedColumns]}
          loading={loading}
          data={purchaseOrders}
          onChange={handleTableChange}
          onRowClick={handleViewClick}
          enableRowSelection
          selectionType="checkbox"
          tableId="id"
          renderSelectionLabel={(keys, rows) => {
            const record = rows?.[0];
            if (!record) return `${keys.length} selected`;
            return (
              <span className="flex items-center gap-2">
                <span>Purchase Order#</span>
                <Tag className="font-semibold">{record?.purchaseOrderId}</Tag>
              </span>
            );
          }}
          columnActions={() => {
            return {
              title: 'Action',
              key: 'action',
              fixed: 'right',
              width: 180,
              visible: true,

              render: (_, record) => {
                const statusLabel = PURCHASE_ORDER_STATUS?.[record?.status] || record?.status || '-';
                const blockedTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : PERMISSION_MESSAGES.NO_PERMISSION;

                const canView = useModulePurchaseOrder?.view;
                const canOpenMore = useModulePurchaseOrder?.edit && !isViewOnly;
                const canEdit = canOpenMore && !PURCHASE_ORDER_EDIT_RESTRICTED_STATUS?.includes(record?.status);
                const canDelete = useModulePurchaseOrder?.delete && !isViewOnly;
                const canDuplicate = useModulePurchaseOrder?.create && !isViewOnly;
                const canConvertGRPO = useModuleGrpo?.create && !isViewOnly && PURCHASE_ORDER_CONVERSION_ALLOWED_STATUSES?.includes(record?.status);
                const canConvertBill = useModuleBills?.create && !isViewOnly && PURCHASE_ORDER_CONVERSION_ALLOWED_STATUSES?.includes(record?.status);

                const dropDownItems = [...getConvertStatusValue(record?.status, record)];
                const canMarkStatus = canOpenMore && !PURCHASE_ORDER_STATUS_CHANGE_RESTRICTED_STATUS?.includes(record?.status) && dropDownItems.length > 0;

                const viewTooltip = canView ? 'View Purchase Order' : PERMISSION_MESSAGES.NO_PERMISSION;
                const editTooltip = canEdit
                  ? 'Edit Purchase Order'
                  : isViewOnly
                    ? PERMISSION_MESSAGES.VIEW_ONLY
                    : !useModulePurchaseOrder?.edit
                      ? PERMISSION_MESSAGES.NO_PERMISSION
                      : `This document cannot be edited in its current status - ${statusLabel}.`;
                const deleteTooltip = canDelete ? 'Delete Purchase Order' : blockedTooltip;
                const duplicateTooltip = canDuplicate ? 'Duplicate Document' : blockedTooltip;
                const convertGRPOTooltip = canConvertGRPO
                  ? 'Convert to GRPO'
                  : isViewOnly
                    ? PERMISSION_MESSAGES.VIEW_ONLY
                    : !useModuleGrpo?.create
                      ? PERMISSION_MESSAGES.NO_PERMISSION
                      : `Cannot convert to GRPO in its current status - ${statusLabel}.`;
                const convertBillTooltip = canConvertBill
                  ? 'Convert to Bill'
                  : isViewOnly
                    ? PERMISSION_MESSAGES.VIEW_ONLY
                    : !useModuleBills?.create
                      ? PERMISSION_MESSAGES.NO_PERMISSION
                      : `Cannot convert to Bill in its current status - ${statusLabel}.`;
                const markAsTooltip = canMarkStatus
                  ? 'Mark Purchase Order As'
                  : isViewOnly
                    ? PERMISSION_MESSAGES.VIEW_ONLY
                    : !useModulePurchaseOrder?.edit
                      ? PERMISSION_MESSAGES.NO_PERMISSION
                      : `This document status cannot be changed in its current status - ${statusLabel}.`;
                const moreTooltip = canOpenMore ? 'More Actions' : blockedTooltip;

                return (
                  <div className="flex items-center gap-3">
                    {/* VIEW */}
                    <Tooltip title={viewTooltip}>
                      <Icons.EyeOutlined
                        className={canView ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                        style={{ fontSize: 17, color: '#1E3A56' }}
                        onClick={
                          canView
                            ? () => {
                                handleViewClick(record);
                                setOpenDropdownKey(null);
                              }
                            : undefined
                        }
                      />
                    </Tooltip>

                    <Tooltip title={duplicateTooltip}>
                      <Icons.CopyOutlined
                        className={canDuplicate ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                        style={{ fontSize: 17, color: colorPalette.primary[500] }}
                        onClick={
                          canDuplicate
                            ? () => {
                                handleDuplicateClick(record);
                                setOpenDropdownKey(null);
                              }
                            : undefined
                        }
                      />
                    </Tooltip>

                    {/* EDIT */}
                    <Tooltip title={editTooltip}>
                      <Icons.EditOutlined
                        className={canEdit ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                        style={{ fontSize: 17, color: colorPalette.primary[500] }}
                        onClick={
                          canEdit
                            ? () => {
                                handleEditClick(record);
                                setOpenDropdownKey(null);
                              }
                            : undefined
                        }
                      />
                    </Tooltip>

                    {/* DELETE */}
                    <Tooltip title={deleteTooltip}>
                      <Icons.DeleteOutlined
                        className={canDelete ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                        style={{ fontSize: 17, color: colorPalette.error[500] }}
                        onClick={
                          canDelete
                            ? () => {
                                handleDeleteClick(record);
                                setOpenDropdownKey(null);
                              }
                            : undefined
                        }
                      />
                    </Tooltip>

                    {/* DROPDOWN */}
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
                                    const label = item.label || '';

                                    if (key.includes('ACCEPTED') || label.includes(PURCHASE_ORDER_STATUS?.ACCEPTED)) {
                                      return {
                                        icon: <Icons.CheckCircleOutlined className={markAsDisabled ? 'text-gray-400' : 'text-green-800'} style={{ fontSize: 14 }} />,
                                        hoverClass: 'hover:bg-green-50 hover:text-green-800',
                                      };
                                    } else if (key.includes('SENT') || label.includes(PURCHASE_ORDER_STATUS?.SENT)) {
                                      return {
                                        icon: <Icons.CheckCircleOutlined className={markAsDisabled ? 'text-gray-400' : 'text-blue-800'} style={{ fontSize: 14 }} />,
                                        hoverClass: 'hover:bg-blue-50 hover:text-blue-800',
                                      };
                                    } else if (key.includes('REJECTED') || label.includes(PURCHASE_ORDER_STATUS?.REJECTED)) {
                                      return {
                                        icon: <Icons.CloseCircleOutlined className={markAsDisabled ? 'text-gray-400' : 'text-red-800'} style={{ fontSize: 14 }} />,
                                        hoverClass: 'hover:bg-red-50 hover:text-red-800',
                                      };
                                    } else if (key.includes('CANCELLED') || label.includes(PURCHASE_ORDER_STATUS?.CANCELLED)) {
                                      return {
                                        icon: <Icons.StopOutlined className={markAsDisabled ? 'text-gray-400' : 'text-rose-800'} style={{ fontSize: 14 }} />,
                                        hoverClass: 'hover:bg-rose-50 hover:text-rose-800',
                                      };
                                    } else if (key.includes('CLOSED') || label.includes(PURCHASE_ORDER_STATUS?.CLOSED)) {
                                      return {
                                        icon: <Icons.LockOutlined className={markAsDisabled ? 'text-gray-400' : 'text-slate-600'} style={{ fontSize: 14 }} />,
                                        hoverClass: 'hover:bg-slate-50 hover:text-slate-700',
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
                                          w-full px-3 py-2 text-left text-sm
                                          flex items-center
                                          transition-colors duration-150
                                          ${markAsDisabled ? 'opacity-50 cursor-not-allowed text-gray-400' : `text-gray-700 ${statusIcon.hoverClass} cursor-pointer`}
                                          ${index === 0 ? 'rounded-t' : ''}
                                          ${index === dropDownItems.length - 1 && !canConvertGRPO && !canConvertBill ? 'rounded-b' : ''}
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

                            {/* Convert Actions Section */}
                            <div className="px-2 py-1">
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">Convert :</div>
                            </div>

                            {/* Convert to GRPO - Always Show */}
                            <Tooltip title={convertGRPOTooltip} placement="left">
                              <button
                                type="button"
                                onClick={
                                  canConvertGRPO && !submitLoading
                                    ? () => {
                                        convertHandle(record, 'grpo');
                                        setOpenDropdownKey(null);
                                      }
                                    : undefined
                                }
                                disabled={!canConvertGRPO || submitLoading}
                                className={`
                                  w-full px-3 py-2 text-left text-sm
                                  flex items-center gap-2
                                  transition-colors duration-150
                                  ${!canConvertGRPO || submitLoading ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-gray-700 hover:bg-green-50 hover:text-green-600 cursor-pointer'}
                                `}
                              >
                                {submitLoading ? (
                                  <span className="flex items-center gap-2">
                                    <CustomLoader variant="button" text="Converting..." />
                                  </span>
                                ) : (
                                  <>
                                    <Icons.SwapOutlined className={!canConvertGRPO || submitLoading ? 'text-gray-400' : 'text-green-500'} style={{ fontSize: 16 }} />
                                    <span>To GRPO</span>
                                  </>
                                )}
                              </button>
                            </Tooltip>

                            {/* Convert to Bill - Always Show */}
                            <Tooltip title={convertBillTooltip} placement="left">
                              <button
                                type="button"
                                onClick={
                                  canConvertBill && !submitLoading
                                    ? () => {
                                        convertHandle(record, 'bill');
                                        setOpenDropdownKey(null);
                                      }
                                    : undefined
                                }
                                disabled={!canConvertBill || submitLoading}
                                className={`
                                  w-full px-3 py-2 text-left text-sm
                                  flex items-center gap-2
                                  transition-colors duration-150 rounded-b
                                  ${!canConvertBill || submitLoading ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-gray-700 hover:bg-purple-50 hover:text-purple-600 cursor-pointer'}
                                `}
                              >
                                {submitLoading ? (
                                  <span className="flex items-center gap-2">
                                    <CustomLoader variant="button" text="Converting..." />
                                  </span>
                                ) : (
                                  <>
                                    <Icons.SwapOutlined className={!canConvertBill || submitLoading ? 'text-gray-400' : 'text-purple-500'} style={{ fontSize: 16 }} />
                                    <span>To Bill</span>
                                  </>
                                )}
                              </button>
                            </Tooltip>
                          </div>
                        );
                      }}
                    >
                      <Tooltip title={moreTooltip} placement="left">
                        <span>
                          <Icons.MoreOutlined
                            className={canOpenMore ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
                            style={{ fontSize: 17, color: canOpenMore ? '#1E3A56' : colorPalette.neutral[400] }}
                          />
                        </span>
                      </Tooltip>
                    </Dropdown>
                  </div>
                );
              },
            };
          }}
          pagination={{
            current: searchParams?.get('page') || 1,
            pageSize: searchParams?.get('limit') || pagination?.limit,
            total: pagination.totalResults,
            onChange: handlePaginationChange,
          }}
        />
      </div>
      {isOpenConvertModal && <ConvertToSelectionModal open={isOpenConvertModal} onClose={handleCloseConvertModal} convertType={convertType} />}
      <DocumentConfirmModal modal={deleteModal} docType={MODULE_NAMES?.PURCHASE_ORDER} onConfirm={deletePurchaseOrder} loading={deleteLoading} getDocumentDetails={getPurchaseOrderDocumentDetails} />
      <DocumentConfirmModal
        modal={cancelStatusModal}
        docType={MODULE_NAMES?.PURCHASE_ORDER}
        loading={submitLoading}
        mode="status"
        onConfirm={confirmCancelStatus}
        getDocumentDetails={payload => getPurchaseOrderDocumentDetails(payload?.order)}
      />
      <ColumnSelection
        hideTrigger
        columns={columnsList}
        setColumnsList={setColumnsList}
        setCutomizedColumns={setCutomizedColumns}
        configPage={configEnum?.PURCHASE_ORDER_CONFIG}
        modalOpen={showColumnModal}
        setModalOpen={setShowColumnModal}
      />
      <ViewDocumentListToolbarModals {...toolbarModalsProps} />
    </div>
  );
};

export default ViewPurchaseOrders;
