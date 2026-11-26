import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

// Components
import { Dropdown, Tag, Tooltip } from '@/components/AntDComponent';
import ConvertToSelectionModal from '../components/ConvertToSelectionModal';
import CreateProductionFromSalesOrderModal from '../components/CreateProductionFromSalesOrderModal';
import ColumnSelection from '@/components/ui/common/ColumnSelection';
import StatusFilterTabs from '@/components/ui/common/StatusFilterTabs';
import FilterLockButton from '@/components/ui/common/FilterLockButton';
import FilterDrawer, { FilterSection, FilterButton } from '@/components/ui/common/FilterDrawer';
import CustomButton from '@/components/ui/button/CustomButton';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomDatePicker from '@/components/forms/formDatePicker/CustomDatePicker';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import { DocumentConfirmModal } from '@/components/feedback/confirmModal/CancelOrDeleteDocumentModal';
import FilterInput from '@/components/forms/formInput/FilterInput';
import PageHeader from '@/components/ui/common/PageHeader';
import ViewDocumentListToolbarModals from '@/components/ui/common/ViewDocumentListToolbarModals';

// Hooks
import { useSalesOrderTag } from '@/features/allMaster/salesOrderTag';
import { useConvert } from 'hooks/useConvert';
import { useProfile } from '@/features/setting/profile/useProfile';
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import { useConfirmModal } from '@/hooks/useConfirmModal';
import { useModule } from 'hooks/useModule';
import useModulePermissions from 'hooks/useModulePermissions';
import useDocumentListToolbar from '@/hooks/useDocumentListToolbar';
import useDocumentPdfExport from '@/hooks/useDocumentPdfExport';
import useColumnResize from '@/hooks/useColumnResize';
import { getCustomerFilterTag, useFilters } from '@/utils/filtersUtils';
import { useUser } from '@/features/setting/user/useUser';
import { useCustomer } from '@/features/sales/customer';

// Extras
import { useSalesOrder, salesOrderColumn, salesOrderExportColumn, getSalesOrderDocumentDetails } from '@/features/sales/salesOrder';
import { resetBranch } from '@/features/allMaster/warehouse/warehouse.slice';
import { getAllFiltersFromLocalStorage } from '@/utils/filters';
import { CommonFilterTags } from '@/utils/filtersUtils';
import { colorPalette } from '@/utils/theme';
import Icons from 'assets/icons/icon';
import { FILTERS_KEYS, RESOURCES } from '@/utils/jsonFile';
import { getGstNumericRate } from '@/utils/gstDisplay';
import {
  ADDITIONAL_FEATURES,
  BACKEND_ENUM,
  configEnum,
  filterInputEnum,
  MODULE_NAMES,
  PERMISSION_MESSAGES,
  SALES_ORDER_CONVERSION_ALLOWED_STATUSES,
  SALES_ORDER_EDIT_RESTRICTED_STATUS,
  SALES_ORDER_STATUS,
  SALES_ORDER_STATUS_CHANGE_RESTRICTED_STATUS,
  SALES_ORDER_MATERIAL_STATUS,
  SALES_ORDER_MATERIAL_STATUS_LABELS,
} from 'utils/constants';
import { getFromLocalStorage, getQueryParams, parsedTableCoulmns } from 'utils/services';
import { PAGE_HEADERS } from '@/utils/label';
import { useHasCRMAccess } from '@/hooks/useHasCRMAccess';
import CreatedFromFilter from '@/components/forms/formInput/CreatedFromFilter';
import LocationFilters, { getLocationFilterTags } from '@/components/forms/formInput/LocationFilters';
import { toDecimalString } from '@/utils/currency';
import { buildDivisionSelectOptions, buildBranchSelectOptions, divisionSelectColumnHeader, branchSelectColumnHeader } from '@/utils/tableSelectDropdown/orgSelectDropdown';
import { buildCustomerSelectOptions, customerSelectColumnHeader, customerSelectDropdownProps } from '@/utils/tableSelectDropdown/customerSelectDropdown';

const MATERIAL_STATUS_TILES = [
  {
    key: SALES_ORDER_MATERIAL_STATUS.AVAILABLE,
    label: SALES_ORDER_MATERIAL_STATUS_LABELS.AVAILABLE,
    tooltip: 'All raw materials are in stock for the full quantity still to produce.',
    countKey: 'available',
    dot: '#16a34a',
  },
  {
    key: SALES_ORDER_MATERIAL_STATUS.PARTIALLY_READY,
    label: SALES_ORDER_MATERIAL_STATUS_LABELS.PARTIALLY_READY,
    tooltip: 'Part of the quantity can be produced now; the rest needs more raw material.',
    countKey: 'partiallyReady',
    dot: '#d97706',
  },
  {
    key: SALES_ORDER_MATERIAL_STATUS.ISSUES,
    label: SALES_ORDER_MATERIAL_STATUS_LABELS.ISSUES,
    tooltip: 'Nothing can be produced yet: every item has a raw material out of stock.',
    countKey: 'issues',
    dot: '#dc2626',
  },
];

const PRODUCTION_ORDER_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'PARTIAL', label: 'Partial' },
  { value: 'COMPLETED', label: 'Completed' },
];

const API_CALLED_ENUM = {
  DIVISION_DROPDOWN: 'divisionDropdown',
  USERS_DROPDOWN: 'usersDropdown',
  CUSTOMER_DROPDOWN: 'customerDropdown',
  SALES_ORDER_TAG_DROPDOWN: 'salesOrderTagDropdown',
};

const ViewSalesOrders = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { salesOrders, pagination, loading, submitLoading, deleteLoading, exportLoading, getSalesOrder, getSalesOrderExports, removeSalesOrder, resetSalesOrders, updateStatus } = useSalesOrder();
  const { salesOrderTagsDropdown, getSalesOrderTagsDropdown, dropdownLoading: salesOrderTagsDropdownLoading } = useSalesOrderTag();
  const { useModuleSalesOrder, useModuleDeliveryChallan, useModuleInvoice, isViewOnly, divDrop, divisionLoading, getDivDropDown, branchDrop, branchLoading, getBranchDropDown } = useModulePermissions(
    RESOURCES.SALES_ORDER
  );
  const { useAddProduction } = useModulePermissions(RESOURCES.ADD_PRODUCTION);
  const { usersDropdown, usersDropdownLoading, getUsersDropdown } = useUser();
  const { customerDropDownList, loading: customerLoading, getCustomerDropList } = useCustomer();

  const { activeFeatures } = useProfile();
  const { permissionPlanMap } = useModule();
  const isDeliveryChallanInPlan = permissionPlanMap?.['delivery-challans'] !== false;
  const isProductionInPlan = permissionPlanMap?.['production-module'] !== false;
  const PLAN_UPGRADE_MSG = 'Delivery Challan is not included in your current subscription plan. Please upgrade to use this feature.';
  const FILTER_KEY = FILTERS_KEYS.SALES_ORDER_ALL_FILTER;
  const [searchParams, setSearchParams] = useSearchParams();
  const deleteModal = useConfirmModal();
  const cancelStatusModal = useConfirmModal();
  const [openDropdownKey, setOpenDropdownKey] = useState(null);
  const isApiCalledRef = useRef(false);
  const isApicalledRefFilter = useRef({
    divisionDropdown: false,
    usersDropdown: false,
    customerDropdown: false,
    salesOrderTagDropdown: false,
  });
  const [isOpenConvertModal, setIsOpenConvertModal] = useState(false);
  const [convertType, setConvertType] = useState('');
  const [openCreateProductionModal, setOpenCreateProductionModal] = useState(false);
  const [createProductionSalesOrder, setCreateProductionSalesOrder] = useState(null);
  const { handleConvertSalesOrder } = useConvert();
  const [showFilter, setShowFilter] = useState(false);
  const isHaveProductionAccess = activeFeatures?.[ADDITIONAL_FEATURES?.PRODUCTION_ORDER];
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
      division: searchParams.get('division') ? searchParams.get('division').split(',') : '',
      branch: searchParams.get('branch') ? searchParams.get('branch').split(',') : '',
      customerId: searchParams.get('customerId') ? searchParams.get('customerId').split(',') : '',
      tagId: searchParams.get('tagId') ? searchParams.get('tagId').split(',') : '',
      appName: searchParams.get('appName') || '',
      addedBy: searchParams.get('addedBy') ? searchParams.get('addedBy').split(',') : '',
      productionOrderStatus: searchParams.get('productionOrderStatus') ? searchParams.get('productionOrderStatus').split(',') : '',
      country: searchParams.get('country') ? searchParams.get('country').split(',') : '',
      state: searchParams.get('state') ? searchParams.get('state').split(',') : '',
      city: searchParams.get('city') ? searchParams.get('city').split(',') : '',
      addressType: searchParams.get('addressType') || '',
    },
    dateKeys: { startDate: 'startDate', endDate: 'endDate', singleDate: 'orderDate' },
  });

  const { hasCRMAccess, filterCreatedFromColumn, createdFromExtraFilters } = useHasCRMAccess({
    pagination,
    filter,
    setFilter,
    updateUrlParams,
    searchParams,
    setShowFilter,
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
        } else if (savedFilters.orderDate) {
          setDateRange([savedFilters.orderDate, savedFilters.orderDate]);
        }

        setFilter(prev => ({
          ...prev,
          search: savedFilters.search ?? prev.search,
          status: savedFilters.status ? savedFilters?.status?.split(',') : prev.status,
          division: savedFilters.division ? savedFilters?.division?.split(',') : prev.division,
          branch: savedFilters.branch ? savedFilters?.branch?.split(',') : prev.branch,
          customerId: savedFilters.customerId ? savedFilters?.customerId?.split(',') : prev.customerId,
          tagId: savedFilters.tagId ? savedFilters?.tagId?.split(',') : prev.tagId,
          appName: savedFilters.appName ?? prev.appName,
          addedBy: savedFilters.addedBy ? savedFilters.addedBy.split(',') : prev.addedBy,
          productionOrderStatus: savedFilters.productionOrderStatus ? savedFilters?.productionOrderStatus?.split(',') : prev.productionOrderStatus,
          country: savedFilters.country ? savedFilters.country.split(',') : prev.country,
          state: savedFilters.state ? savedFilters.state.split(',') : prev.state,
          city: savedFilters.city ? savedFilters.city.split(',') : prev.city,
          addressType: savedFilters.addressType ?? prev.addressType,
        }));

        if (savedFilters?.division?.split(',')?.length > 0) {
          handleOnFocusApiCall(API_CALLED_ENUM.DIVISION_DROPDOWN);
        }

        if (savedFilters?.customerId?.split(',')?.length > 0) {
          handleOnFocusApiCall(API_CALLED_ENUM.CUSTOMER_DROPDOWN);
        }

        if (savedFilters?.addedBy?.split(',')?.length > 0) {
          handleOnFocusApiCall(API_CALLED_ENUM.USERS_DROPDOWN);
        }

        if (savedFilters?.tagId?.split(',')?.length > 0) {
          handleOnFocusApiCall(API_CALLED_ENUM.SALES_ORDER_TAG_DROPDOWN);
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
    fetchSalesOrder(controller.signal);

    return () => controller.abort();
  }, [dispatch, searchParams]);

  useResetOnUnmount(resetSalesOrders);

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

  const salesOrderTagFilterOptions = useMemo(
    () =>
      (Array.isArray(salesOrderTagsDropdown) ? salesOrderTagsDropdown : []).map(tag => ({
        value: tag?.id || tag?._id,
        searchLabel: tag?.name ?? '',
        label: (
          <span className="flex items-center gap-2">
            <span aria-hidden className="inline-block h-3 w-3 rounded-full shrink-0 ring-1 ring-black/15" style={{ backgroundColor: tag?.color ?? '#9CA3AF' }} />
            <span>{tag?.name}</span>
          </span>
        ),
      })),
    [salesOrderTagsDropdown]
  );

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

    if (type === API_CALLED_ENUM.CUSTOMER_DROPDOWN) {
      await getCustomerDropList({});
      obj.customerDropdown = true;
    }

    if (type === API_CALLED_ENUM.SALES_ORDER_TAG_DROPDOWN) {
      await getSalesOrderTagsDropdown({});
      obj.salesOrderTagDropdown = true;
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
      handleOnFocusApiCall(API_CALLED_ENUM.CUSTOMER_DROPDOWN);
    }
    if (searchParams.get('tagId')) {
      handleOnFocusApiCall(API_CALLED_ENUM.SALES_ORDER_TAG_DROPDOWN);
    }
  }, []);

  const handleCloseConvertModal = () => {
    setIsOpenConvertModal(false);
  };

  const handleEditClick = record => {
    navigate(`/sales-orders/${record.id}/edit`, {
      state: {
        salesOrderData: record,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleViewClick = record => {
    navigate(`/sales-orders/${record.id}`, {
      state: {
        salesOrderData: record,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleDuplicateClick = record => {
    navigate('/sales-orders/new', {
      state: {
        duplicateFromId: record.id,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleDeleteClick = record => {
    deleteModal.open(record);
  };

  const deleteSalesOrder = async () => {
    await removeSalesOrder({ salesOrderId: deleteModal.payload?.id });
    deleteModal.close();
    fetchSalesOrder();
    // if (clearSelection) {
    //   clearSelection();
    // }
  };

  const handleUpdateStatus = async (orderId, status) => {
    await updateStatus({ orderId, status });
    fetchSalesOrder();
  };

  const updateOrderStatus = async (order, newStatus) => {
    setOpenDropdownKey(null);
    if (newStatus === BACKEND_ENUM?.CANCELLED) {
      cancelStatusModal.open({
        order,
        newStatus,
        label: SALES_ORDER_STATUS?.[newStatus] || newStatus,
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
    const orderId = order?.id || order?._id;

    const markAs = (backendStatus, labelStatus) => ({
      key: `markAs${labelStatus}`,
      label: `Mark As ${labelStatus}`,
      onClick: () => handleUpdateStatus(orderId, backendStatus),
    });
    const draftItem = markAs(BACKEND_ENUM?.DRAFT, SALES_ORDER_STATUS?.DRAFT);
    const openItem = markAs(BACKEND_ENUM?.OPEN, SALES_ORDER_STATUS?.OPEN);
    const closedItem = {
      key: `markAs${SALES_ORDER_STATUS?.CLOSED}`,
      label: `Mark As ${SALES_ORDER_STATUS?.CLOSED}`,
      onClick: () => updateOrderStatus(order, BACKEND_ENUM?.CLOSED),
    };
    const cancelItem = {
      key: `markAs${SALES_ORDER_STATUS?.CANCELLED}`,
      label: `Mark As ${SALES_ORDER_STATUS?.CANCELLED}`,
      onClick: () => updateOrderStatus(order, BACKEND_ENUM?.CANCELLED),
    };

    if (status === BACKEND_ENUM?.DRAFT) {
      statusArr = [openItem, cancelItem];
    } else if (status === BACKEND_ENUM?.OPEN) {
      statusArr = [closedItem, draftItem, cancelItem];
    } else if (status === BACKEND_ENUM?.PARTIALLY_RECORDED) {
      statusArr = [closedItem, cancelItem];
    } else if (status === BACKEND_ENUM?.CLOSED) {
      statusArr = [cancelItem];
    } else if (status === BACKEND_ENUM?.CANCELLED) {
      statusArr = [draftItem, openItem];
    }

    return statusArr;
  };

  const fetchSalesOrder = signal => {
    const page = parseInt(searchParams?.get('page')) || 1;
    const pageSize = parseInt(searchParams?.get('limit')) || pagination.limit;
    const sortBy = searchParams?.get('sortBy') || '';

    let payload = getQueryParams(window.location.href) || {};

    if (Object.keys(payload)?.length <= 0) {
      payload = { page, limit: pageSize };
    }

    if (sortBy) payload.sortBy = sortBy;

    getSalesOrder({ ...payload, page, limit: pageSize, withMaterialStatus: isHaveProductionAccess, signal });
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
    let sortBy = '';

    if (Array.isArray(sorter)) {
      const firstSort = sorter[0];
      if (firstSort && firstSort.order) {
        sortBy = `${firstSort.field}:${firstSort.order === 'descend' ? 'desc' : 'asc'}`;
      }
    } else if (sorter?.order) {
      sortBy = `${sorter.field}:${sorter.order === 'descend' ? 'desc' : 'asc'}`;
    }

    updateUrlParams({ sortBy, page: 1 });
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
            referenceType: 'SalesOrder',
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
          referenceType: 'SalesOrder',
          taxAmount: taxAmount ? toDecimalString(parseFloat(taxAmount)) : 0,
          amount: amount ? toDecimalString(parseFloat(amount)) : 0,
        });
      }
    });

    clonedData.items = updatedItems;

    handleConvertSalesOrder(clonedData, type);
  };

  const columns = salesOrderColumn(isHaveProductionAccess);

  let columnsFromLocalStorage = getFromLocalStorage(configEnum?.SALES_ORDER_CONFIG);
  let parsedColumnData = parsedTableCoulmns(columnsFromLocalStorage, columns);

  let displayColumn = parsedColumnData?.displayColumn?.filter(x => x?.visible === true);
  const [columnsList, setColumnsList] = useState(parsedColumnData?.displayColumn);
  const [customizedColumns, setCutomizedColumns] = useState([...(parsedColumnData?.customizedColumn?.length > 0 ? parsedColumnData.customizedColumn : displayColumn)]);

  const handleColumnResize = useColumnResize(setColumnsList, setCutomizedColumns, configEnum?.SALES_ORDER_CONFIG);

  const { pdfExportLoading, handlePdfExport } = useDocumentPdfExport({
    defaultFileName: 'Sales_Orders_Export',
    entityLabel: 'sales orders',
    filterKeys: ['orderDate', 'tagId', 'country', 'state', 'city', 'addressType'],
    moduleType: 'salesOrder',
  });

  const { showColumnModal, setShowColumnModal, standardDropdownItems, toolbarModalsProps } = useDocumentListToolbar({
    moduleName: MODULE_NAMES.SALES_ORDER,
    resource: RESOURCES.SALES_ORDER,
    filterKey: FILTER_KEY,
    columnConfigKey: configEnum?.SALES_ORDER_CONFIG,
    configErrorMessage: 'Failed to update sales order configuration',
    exportConfig: {
      exportLoading: exportLoading || pdfExportLoading,
      fetchExports: getSalesOrderExports,
      getExportColumns: () => salesOrderExportColumn(isHaveProductionAccess),
      defaultFileName: 'Sales_Orders_Export',
      sheetName: 'Sales Orders',
      entityPlural: 'Sales Orders',
      formName: 'export-sales-orders',
      exportLabel: 'Export Sales Orders',
      formats: ['xlsx', 'pdf'],
      onPdfExport: handlePdfExport,
    },
    columnsConfig: {
      getDefaultColumns: () => salesOrderColumn(isHaveProductionAccess),
      setColumnsList,
      setCustomizedColumns: setCutomizedColumns,
    },
    handleResetFilters,
    onRefresh: () => fetchSalesOrder(),
    setIsLocked,
  });

  const dropdownItems = [
    ...((useModuleDeliveryChallan?.create || useModuleInvoice?.create) && !isViewOnly
      ? [
          {
            type: 'group',
            label: 'CONVERT',
            children: [
              ...(useModuleDeliveryChallan?.create
                ? [
                    {
                      key: 'convertToDeliveryChallan',
                      icon: <Icons.CarOutlined className={`text-base ${isDeliveryChallanInPlan ? '' : 'text-gray-400'}`} />,
                      label: (
                        <Tooltip title={isDeliveryChallanInPlan ? '' : PLAN_UPGRADE_MSG} placement="left">
                          <span className={`font-medium py-1 block ${isDeliveryChallanInPlan ? 'text-gray-700' : 'text-gray-400'}`}>Convert to Delivery Challan</span>
                        </Tooltip>
                      ),
                      disabled: !isDeliveryChallanInPlan,
                      onClick: ({ domEvent }) => {
                        domEvent.stopPropagation();
                        if (!isDeliveryChallanInPlan) return;
                        setConvertType('Delivery Challan');
                        setIsOpenConvertModal(true);
                      },
                    },
                  ]
                : []),

              ...(useModuleInvoice?.create
                ? [
                    {
                      key: 'convertToInvoice',
                      label: 'Convert to Invoice',
                      icon: <Icons.FileTextOutlined />,
                      onClick: ({ domEvent }) => {
                        domEvent.stopPropagation();
                        setConvertType('Invoice');
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
  const selectedMaterialStatus = searchParams.get('materialStatus') || null;
  const materialStatusCounts = pagination?.materialStatusCounts || {};
  const handleMaterialStatusClick = status => {
    updateUrlParams({ materialStatus: selectedMaterialStatus === status ? null : status, page: 1 });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden -m-4">
      <div className="bg-white px-4 py-2.5 flex flex-col md:flex-row md:items-center gap-3 md:gap-0">
        <PageHeader
          loading={loading}
          title={PAGE_HEADERS?.SALES_ORDERS?.title}
          totalAmount={pagination?.totalAmount}
          totalRecord={pagination?.totalResults}
          remainingAmount={pagination?.remainingAmount}
        />
        {isHaveProductionAccess && (
          <div className="flex flex-wrap items-center gap-1.5 md:ml-6">
            {MATERIAL_STATUS_TILES.map(tile => {
              const active = selectedMaterialStatus === tile.key;
              return (
                <Tooltip key={tile.key} title={tile.tooltip}>
                  <button
                    type="button"
                    onClick={() => handleMaterialStatusClick(tile.key)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                      active ? 'font-semibold text-gray-900' : 'text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                    style={active ? { borderColor: colorPalette.primary[500], backgroundColor: `${colorPalette.primary[500]}0F` } : undefined}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tile.dot }} />
                    <span>{tile.label}</span>
                    <span className="font-semibold text-gray-900">{(materialStatusCounts[tile.countKey] ?? 0).toLocaleString('en-IN')}</span>
                  </button>
                </Tooltip>
              );
            })}
          </div>
        )}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full md:w-auto md:ml-auto">
          <PermissionButton
            canAccess={!!useModuleSalesOrder?.create}
            isViewOnly={isViewOnly}
            type="primary"
            className="w-full sm:w-auto px-4 py-2"
            wrapperClassName="w-full sm:w-auto inline-block"
            onClick={() =>
              navigate('/sales-orders/new', {
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
          <StatusFilterTabs statuses={Object.entries(SALES_ORDER_STATUS).map(([key, label]) => ({ value: key, label }))} value={filter?.status} onChange={handleStatusTab} />
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
                selectionOptions={Object?.entries(SALES_ORDER_STATUS)?.map(([key, value]) => {
                  return { value: key, label: value };
                })}
                value={filter?.status}
                setFilter={setFilter}
                allowClear={true}
              />
            </div>
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                mode="multiple"
                name={'productionOrderStatus'}
                label={'Production Status'}
                placeHolder={'Select Production Status'}
                selectionOptions={PRODUCTION_ORDER_STATUS_OPTIONS}
                value={filter?.productionOrderStatus}
                setFilter={setFilter}
                allowClear={true}
              />
            </div>
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                mode="multiple"
                name="tagId"
                label="Sales Order Tag"
                placeHolder="Select Tags"
                selectionOptions={salesOrderTagFilterOptions}
                value={filter?.tagId}
                setFilter={setFilter}
                allowClear={true}
                loading={salesOrderTagsDropdownLoading}
                onFocus={() => {
                  if (!isApicalledRefFilter.current.salesOrderTagDropdown) {
                    handleOnFocusApiCall(API_CALLED_ENUM.SALES_ORDER_TAG_DROPDOWN);
                  }
                }}
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
                onFocus={() => {
                  if (!isApicalledRefFilter.current.customerDropdown) {
                    handleOnFocusApiCall(API_CALLED_ENUM.CUSTOMER_DROPDOWN);
                  }
                }}
              />
            </div>

            {hasCRMAccess && <CreatedFromFilter filter={filter} setFilter={setFilter} />}

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
                name={'division'}
                mode="multiple"
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
            singleDateKey: 'orderDate',
          }}
          onDateClear={() => {
            setSelectedPreset('custom');
            setDateRange(null);
            updateUrlParams({ startDate: null, endDate: null, orderDate: null, preset: null });
          }}
          STATUS_ENUM={SALES_ORDER_STATUS}
          divDrop={divDrop}
          branchDrop={branchDrop}
          extraFilters={{
            ...getCustomerFilterTag('Customer', customerDropDownList),
            productionOrderStatus: {
              label: 'Production Status',
              format: value =>
                (value || '')
                  .split(',')
                  .map(v => PRODUCTION_ORDER_STATUS_OPTIONS.find(o => o.value === v.trim())?.label || v.trim())
                  .filter(Boolean)
                  .join(', '),
              clear: (setFilter, updateUrlParams) => {
                setFilter(prev => ({ ...prev, productionOrderStatus: null }));
                updateUrlParams({ productionOrderStatus: null });
              },
            },
            tagId: {
              label: 'Sales Order Tag',
              format: value =>
                (value || '')
                  .split(',')
                  .map(id => {
                    const tag = (salesOrderTagsDropdown || []).find(t => String(t?.id || t?._id) === String(id.trim()));
                    return tag?.name || null;
                  })
                  .filter(Boolean)
                  .join(', '),
              clear: (setFilter, updateUrlParams) => {
                setFilter(prev => ({ ...prev, tagId: null }));
                updateUrlParams({ tagId: null });
              },
            },
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
            ...createdFromExtraFilters,
            ...getLocationFilterTags(),
          }}
        />
      </div>
      <div className="">
        <CustomTable
          onColumnResize={handleColumnResize}
          columns={[...filterCreatedFromColumn(customizedColumns)]}
          loading={loading}
          data={salesOrders}
          onChange={handleTableChange}
          onRowClick={handleViewClick}
          pagination={{
            current: searchParams?.get('page') || 1,
            pageSize: searchParams?.get('limit') || pagination?.limit,
            total: pagination.totalResults,
            onChange: handlePaginationChange,
          }}
          dynamicScrollY
          // scrollYOffset={115}
          enableRowSelection
          selectionType="checkbox"
          tableId="id"
          onSelectionChange={() => {}}
          renderSelectionLabel={(keys, rows) => {
            const r = rows?.[0];
            if (!r) return `${keys.length} selected`;
            return (
              <span className="flex items-center gap-2">
                <span>Sales Order#</span>
                <Tag className="font-semibold">{r?.orderId}</Tag>
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
                const statusLabel = SALES_ORDER_STATUS?.[record?.status] || record?.status || '-';
                const blockedTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : PERMISSION_MESSAGES.NO_PERMISSION;
                const productionStatusAllowed = [BACKEND_ENUM.OPEN, BACKEND_ENUM.PARTIALLY_RECORDED].includes(record?.status);

                const canView = useModuleSalesOrder?.view;
                const canOpenMore = useModuleSalesOrder?.edit && !isViewOnly;
                const canEdit = canOpenMore && !SALES_ORDER_EDIT_RESTRICTED_STATUS?.includes(record?.status);
                const canDelete = useModuleSalesOrder?.delete && !isViewOnly;
                const canDuplicate = useModuleSalesOrder?.create && !isViewOnly;
                const canConvertDC = useModuleDeliveryChallan?.create && isDeliveryChallanInPlan && !isViewOnly && SALES_ORDER_CONVERSION_ALLOWED_STATUSES?.includes(record?.status);
                const canConvertINV = useModuleInvoice?.create && !isViewOnly && SALES_ORDER_CONVERSION_ALLOWED_STATUSES?.includes(record?.status);
                const canCreateProduction = isProductionInPlan && useAddProduction?.create && record?.hasPendingProduction && productionStatusAllowed && !isViewOnly;

                const dropDownItems = [...getConvertStatusValue(record?.status, record)];
                const canMarkStatus = canOpenMore && !SALES_ORDER_STATUS_CHANGE_RESTRICTED_STATUS?.includes(record?.status) && dropDownItems.length > 0;

                const viewTooltip = canView ? 'View Order' : PERMISSION_MESSAGES.NO_PERMISSION;
                const editTooltip = canEdit ? 'Edit Order' : !useModuleSalesOrder?.edit || isViewOnly ? blockedTooltip : `This document cannot be edited in its current status - ${statusLabel}.`;
                const deleteTooltip = canDelete ? 'Delete Order' : blockedTooltip;
                const duplicateTooltip = canDuplicate ? 'Duplicate Document' : blockedTooltip;
                const convertDCTooltip = canConvertDC
                  ? 'Convert to Delivery Challan'
                  : isViewOnly
                    ? PERMISSION_MESSAGES.VIEW_ONLY
                    : !useModuleDeliveryChallan?.create
                      ? PERMISSION_MESSAGES.NO_PERMISSION
                      : !isDeliveryChallanInPlan
                        ? PLAN_UPGRADE_MSG
                        : `Cannot convert to Delivery Challan in its current status - ${statusLabel}.`;
                const convertINVTooltip = canConvertINV
                  ? 'Convert to Invoice'
                  : !useModuleInvoice?.create || isViewOnly
                    ? blockedTooltip
                    : `Cannot convert to Invoice in its current status - ${statusLabel}.`;
                const createProductionTooltip = canCreateProduction
                  ? 'Create Production'
                  : isViewOnly
                    ? PERMISSION_MESSAGES.VIEW_ONLY
                    : !useAddProduction?.create
                      ? PERMISSION_MESSAGES.NO_PERMISSION
                      : !isProductionInPlan
                        ? 'Production is not included in your current subscription plan. Please upgrade to use this feature.'
                        : !record?.hasPendingProduction
                          ? 'Production has already been created for the full quantity of this sales order.'
                          : `Cannot create Production in its current status - ${statusLabel}.`;
                const markAsTooltip = canMarkStatus
                  ? 'Mark Sales Order As'
                  : !useModuleSalesOrder?.edit || isViewOnly
                    ? blockedTooltip
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

                    <Tooltip title={createProductionTooltip}>
                      <Icons.ToolOutlined
                        className={canCreateProduction ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                        style={{ fontSize: 17, color: '#6B21A8' }}
                        onClick={
                          canCreateProduction
                            ? () => {
                                setCreateProductionSalesOrder(record);
                                setOpenCreateProductionModal(true);
                                setOpenDropdownKey(null);
                              }
                            : undefined
                        }
                      />
                    </Tooltip>

                    {/* DROPDOWN MENU */}
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

                                    if (key.includes('OPEN') || label.includes(SALES_ORDER_STATUS?.OPEN)) {
                                      return {
                                        icon: <Icons.CheckCircleOutlined className={markAsDisabled ? 'text-gray-400' : 'text-sky-800'} style={{ fontSize: 14 }} />,
                                        hoverClass: 'hover:bg-sky-50 hover:text-sky-800',
                                      };
                                    } else if (key.includes('CANCELLED') || label.includes(SALES_ORDER_STATUS?.CANCELLED)) {
                                      return {
                                        icon: <Icons.StopOutlined className={markAsDisabled ? 'text-gray-400' : 'text-rose-800'} style={{ fontSize: 14 }} />,
                                        hoverClass: 'hover:bg-rose-50 hover:text-rose-800',
                                      };
                                    } else if (key.includes('CLOSED') || label.includes(SALES_ORDER_STATUS?.CLOSED)) {
                                      return {
                                        icon: <Icons.LockOutlined className={markAsDisabled ? 'text-gray-400' : 'text-slate-600'} style={{ fontSize: 14 }} />,
                                        hoverClass: 'hover:bg-slate-50 hover:text-slate-700',
                                      };
                                    }
                                    return {
                                      icon: <Icons.CheckCircleOutlined className={markAsDisabled ? 'text-gray-400' : 'text-sky-800'} style={{ fontSize: 14 }} />,
                                      hoverClass: 'hover:bg-sky-50 hover:text-sky-800',
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
                            <div className="px-2 py-1">
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">Convert :</div>
                            </div>
                            <Tooltip title={convertDCTooltip} placement="left">
                              <button
                                type="button"
                                onClick={
                                  canConvertDC && !submitLoading
                                    ? () => {
                                        convertHandle(record, 'deliveryChallan');
                                        setOpenDropdownKey(null);
                                      }
                                    : undefined
                                }
                                disabled={!canConvertDC || submitLoading}
                                className={`
                                  w-full px-3 py-2 text-left text-sm
                                  flex items-center gap-2
                                  transition-colors duration-150
                                  ${!canConvertDC || submitLoading ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-gray-700 hover:bg-green-50 hover:text-green-600 cursor-pointer'}
                                `}
                              >
                                {submitLoading ? (
                                  <span className="flex items-center gap-2">
                                    <CustomLoader variant="button" text="Converting..." />
                                  </span>
                                ) : (
                                  <>
                                    <Icons.SwapOutlined className={!canConvertDC || submitLoading ? 'text-gray-400' : 'text-green-500'} style={{ fontSize: 16 }} />
                                    <span>To Delivery Challan</span>
                                  </>
                                )}
                              </button>
                            </Tooltip>

                            <Tooltip title={convertINVTooltip} placement="left">
                              <button
                                type="button"
                                onClick={
                                  canConvertINV && !submitLoading
                                    ? () => {
                                        convertHandle(record, 'invoice');
                                        setOpenDropdownKey(null);
                                      }
                                    : undefined
                                }
                                disabled={!canConvertINV || submitLoading}
                                className={`
                                  w-full px-3 py-2 text-left text-sm
                                  flex items-center gap-2
                                  transition-colors duration-150 rounded-b
                                  ${!canConvertINV || submitLoading ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-gray-700 hover:bg-purple-50 hover:text-purple-600 cursor-pointer'}
                                `}
                              >
                                {submitLoading ? (
                                  <span className="flex items-center gap-2">
                                    <CustomLoader variant="button" text="Converting..." />
                                  </span>
                                ) : (
                                  <>
                                    <Icons.SwapOutlined className={!canConvertINV || submitLoading ? 'text-gray-400' : 'text-purple-500'} style={{ fontSize: 16 }} />
                                    <span>To Invoice</span>
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
        />
      </div>
      {isOpenConvertModal && <ConvertToSelectionModal open={isOpenConvertModal} onClose={handleCloseConvertModal} convertType={convertType} />}
      {openCreateProductionModal && createProductionSalesOrder && (
        <CreateProductionFromSalesOrderModal
          open={openCreateProductionModal}
          record={createProductionSalesOrder}
          onClose={() => {
            setOpenCreateProductionModal(false);
            setCreateProductionSalesOrder(null);
          }}
          onSuccess={() => fetchSalesOrder()}
        />
      )}
      <DocumentConfirmModal modal={deleteModal} docType={MODULE_NAMES?.SALES_ORDER} onConfirm={deleteSalesOrder} loading={deleteLoading} getDocumentDetails={getSalesOrderDocumentDetails} />
      <DocumentConfirmModal
        modal={cancelStatusModal}
        docType={MODULE_NAMES?.SALES_ORDER}
        loading={submitLoading}
        mode="status"
        onConfirm={confirmCancelStatus}
        getDocumentDetails={payload => getSalesOrderDocumentDetails(payload?.order)}
      />
      <ColumnSelection
        hideTrigger
        columns={filterCreatedFromColumn(columnsList)}
        setColumnsList={setColumnsList}
        setCutomizedColumns={setCutomizedColumns}
        configPage={configEnum?.SALES_ORDER_CONFIG}
        modalOpen={showColumnModal}
        setModalOpen={setShowColumnModal}
      />
      <ViewDocumentListToolbarModals {...toolbarModalsProps} />
    </div>
  );
};

export default ViewSalesOrders;
