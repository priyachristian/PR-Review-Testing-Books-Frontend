import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Dropdown, Tag, Tooltip } from 'antd';

// Components
import ColumnSelection from '@/components/ui/common/ColumnSelection';
import StatusFilterTabs from '@/components/ui/common/StatusFilterTabs';
import FilterLockButton from '@/components/ui/common/FilterLockButton';
import FilterDrawer, { FilterSection, FilterButton } from '@/components/ui/common/FilterDrawer';
import PageHeader from '@/components/ui/common/PageHeader';
import Toast from '@/components/ui/common/Toast';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import FilterInput from '@/components/forms/formInput/FilterInput';
import CustomDatePicker from '@/components/forms/formDatePicker/CustomDatePicker';
import StatusConfirmPopover from '@/components/feedback/confirmModal/StatusConfirmPopover';
import { DocumentConfirmModal } from '@/components/feedback/confirmModal/CancelOrDeleteDocumentModal';

// Hooks
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import { useConfirmModal } from '@/hooks/useConfirmModal';
import useModulePermissions from 'hooks/useModulePermissions';
import useDocumentListToolbar from '@/hooks/useDocumentListToolbar';
import useColumnResize from '@/hooks/useColumnResize';
import { useLocationCascade } from '@/hooks/useLocationCascade';
import { useProfile } from '@/features/setting/profile/useProfile';
import { useFilters } from '@/utils/filtersUtils';

// Extras
import { useCustomer, customerColumn, customerExportColumn, getCustomerDocumentDetails, isCustomerLinkedToVendor, isVendorLinkedToCustomer } from '@/features/sales/customer';
import { colorPalette } from '@/utils/theme';
import Icons from 'assets/icons/icon';
import { FILTERS_KEYS, RESOURCES } from '@/utils/jsonFile';
import { ADDITIONAL_FEATURES, configEnum, CUSTOMER_VERIFICATION_STATUS, filterInputEnum, MODULE_NAMES, PERMISSION_MESSAGES } from 'utils/constants';
import { dateFormateForUi, getFromLocalStorage, getQueryParams, parsedTableCoulmns } from 'utils/services';
import { getAllFiltersFromLocalStorage } from '@/utils/filters';
import { PAGE_HEADERS } from '@/utils/label';
import PermissionButton from '@/components/ui/button/PermissionButton';
import ExportDataModal from '@/components/ui/common/ExportDataModal';
import { buildExportRows, downloadExcelExport, resolveExportFileName } from '@/utils/exportData';
import { isCanceledRequestError } from '@/utils/serviceHelper';
import CreatedFromFilter from '@/components/forms/formInput/CreatedFromFilter';
import { useHasCRMAccess, getCreatedFromExtraFilters } from '@/hooks/useHasCRMAccess';
import { CUSTOMER_STATUS_OPTIONS } from '@/utils/dropdownEnums';

const ViewCustomers = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    customerMaster,
    loading,
    pagination,
    getCustomer,
    getCustomerExports,
    exportLoading,
    resetCustomerMaster,
    toggleCustomerStatus,
    submitLoading,
    resendPortalInvite,
    acceptCustomerVerification,
    rejectCustomerVerification,
    deleteCustomer,
    deleteLoading,
  } = useCustomer();
  const { isViewOnly, useModuleCustomerMaster, useModuleVendor } = useModulePermissions(RESOURCES.CUSTOMER_MASTER);
  const { useModuleTopCustomersOfSales } = useModulePermissions(RESOURCES.ANALYTICS_PERMISSIONS.TOP_CUSTOMERS_OF_SALES);
  const { useModuleTopVendorsByAmountPurchase } = useModulePermissions(RESOURCES.ANALYTICS_PERMISSIONS.TOP_VENDORS_BY_AMOUNT_PURCHASE);
  const { activeFeatures } = useProfile();
  const isCustomerOrderAppAvailable = activeFeatures?.[ADDITIONAL_FEATURES?.CUSTOMER_ORDER];
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilter, setShowFilter] = useState(false);
  const isVendorPage = location.pathname.includes('vendors');
  const FILTER_KEY = isVendorPage ? FILTERS_KEYS.VENDORS_ALL_FILTER : FILTERS_KEYS.CUSTOMERS_ALL_FILTER;
  const {
    filter,
    setFilter,
    isLocked,
    selectedPreset,
    setSelectedPreset,
    dateRange,
    setDateRange,
    handleLockToggle,
    setIsLocked,
    updateUrlParams,
    handleFilter,
    handleSearch,
    handleClear,
    handleResetFilters,
    areSavedFiltersApplied,
    getActiveFiltersCount,
  } = useFilters({
    searchParams,
    setSearchParams,
    pagination,
    FILTER_KEY,
    setShowFilter,
    defaultFilter: {
      search: searchParams.get('search') || '',
      country: searchParams.get('country') || null,
      state: searchParams.get('state') || null,
      city: searchParams.get('city') || null,
      customerType: '',
      status: searchParams.get('status') ? searchParams.get('status').split(',') : '',
      verificationStatus: searchParams.get('verificationStatus') || '',
      appName: searchParams.get('appName') || '',
    },
    dateKeys: { startDate: 'startDate', endDate: 'endDate', singleDate: 'customerDate' },
  });

  const { hasCRMAccess, filterCreatedFromColumn } = useHasCRMAccess({
    pagination,
    filter,
    setFilter,
    updateUrlParams,
    searchParams,
    setShowFilter,
  });

  const setFieldValue = useCallback(
    (field, value) => {
      setFilter(prev => ({
        ...prev,
        [field]: value === '' || value === undefined ? null : value,
      }));
    },
    [setFilter]
  );

  const locationFilters = useLocationCascade({
    country: filter?.country || '',
    state: filter?.state || '',
    setFieldValue,
  });

  const [openDropdownKey, setOpenDropdownKey] = useState(null);
  const [pendingPopover, setPendingPopover] = useState(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const deleteModal = useConfirmModal();
  const pageAccess = isVendorPage ? useModuleVendor : useModuleCustomerMaster;
  const containerRef = useRef(null);
  const listVendorModeRef = useRef(isVendorPage);
  const isApiCalledRef = useRef(false);

  useEffect(() => {
    if (!submitLoading && pendingPopover) {
      setPendingPopover(null);
    }
  }, [submitLoading, pendingPopover]);

  useResetOnUnmount(resetCustomerMaster);

  const customerNavigationState = {
    prevFrom: location.pathname,
    historyStack: [...(location.state?.historyStack || []), location.pathname],
  };

  const handleViewClick = customerData => {
    let navigationPath = isVendorPage ? `/vendors/${customerData.id}` : `/customer-master/${customerData.id}`;
    navigate(navigationPath, { state: customerNavigationState });
  };

  const handleEditClick = customerData => {
    let navigationPath = isVendorPage ? `/vendors/${customerData.id}/edit` : `/customer-master/${customerData.id}/edit`;
    navigate(navigationPath, { state: customerNavigationState });
  };

  const handleCopyToVendor = customerData => {
    setOpenDropdownKey(null);
    if (isCustomerLinkedToVendor(customerData)) {
      Toast.error('This customer is already linked to a vendor.');
      return;
    }
    if (!useModuleVendor?.create) {
      Toast.error("You don't have permission to create a vendor.");
      return;
    }
    navigate('/vendors/new', {
      state: {
        copyFromCustomerId: customerData.id || customerData._id,
      },
    });
  };

  const handleCopyToCustomer = vendorData => {
    setOpenDropdownKey(null);
    if (isVendorLinkedToCustomer(vendorData)) {
      Toast.error('This vendor is already linked to a customer.');
      return;
    }
    if (!useModuleCustomerMaster?.create) {
      Toast.error("You don't have permission to create a customer.");
      return;
    }
    navigate('/customer-master/new', {
      state: {
        copyFromVendorId: vendorData.id || vendorData._id,
      },
    });
  };

  const fetchCustomer = signal => {
    const page = parseInt(searchParams?.get('page')) || 1;
    const pageSize = parseInt(searchParams?.get('limit')) || pagination.limit;
    const sortBy = searchParams?.get('sortBy') || '';

    let payload = getQueryParams(window.location.href) || {};

    if (isVendorPage) {
      payload.isVendor = true;
    } else {
      payload.isCustomer = true;
    }

    if (sortBy) {
      payload.sortBy = sortBy;
    }

    getCustomer({ ...payload, page, limit: pageSize, signal });
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

    updateUrlParams({
      page: pagination.current,
      limit: pagination.pageSize,
      search: filter.search,
      sortBy: sortParam,
      status: filter?.status,
      verificationStatus: filter?.verificationStatus,
      country: filter?.country,
      state: filter?.state,
      city: filter?.city,
      appName: filter?.appName,
    });
  };

  const getFilterLabel = (key, value) => {
    switch (key) {
      case 'search': {
        return searchParams?.get('search');
      }
      case 'status': {
        return searchParams
          ?.get('status')
          ?.split(',')
          .map(status => CUSTOMER_STATUS_OPTIONS.find(option => option.value === status)?.label || status)
          .join(', ');
      }
      case 'appName': {
        return getCreatedFromExtraFilters().appName.format(value);
      }
      case 'verificationStatus': {
        return CUSTOMER_VERIFICATION_STATUS?.[value] || value;
      }
      default:
        return value;
    }
  };

  const activeFiltersCount = getActiveFiltersCount();

  const getDateFilterLabel = () => {
    const singleDate = searchParams.get('customerDate');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (singleDate) return dateFormateForUi(singleDate);
    if (startDate && endDate) return `${dateFormateForUi(startDate)} to ${dateFormateForUi(endDate)}`;
    return null;
  };

  const FilterTags = () => {
    const activeFilters = Object.entries({
      search: searchParams.get('search'),
      status: searchParams.get('status'),
      verificationStatus: searchParams.get('verificationStatus'),
      country: searchParams.get('country'),
      state: searchParams.get('state'),
      city: searchParams.get('city'),
      ...(hasCRMAccess ? { appName: searchParams.get('appName') } : {}),
    }).filter(([, value]) => value);

    const dateFilterLabel = getDateFilterLabel();

    if (activeFilters.length === 0 && !dateFilterLabel) return null;

    return (
      <div className="mb-5  container-spacing">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-gray-600 font-medium">Active Filters:</span>
          {activeFilters?.map(([key, value]) => (
            <Tag
              key={key}
              closable
              onClose={() => {
                if (key === 'search') {
                  handleClear();
                } else if (key === 'country') {
                  setFilter(prev => ({ ...prev, country: null, state: null, city: null }));
                  updateUrlParams({ country: null, state: null, city: null });
                } else if (key === 'state') {
                  setFilter(prev => ({ ...prev, state: null, city: null }));
                  updateUrlParams({ state: null, city: null });
                } else if (key === 'appName') {
                  setFilter(prev => ({ ...prev, appName: '' }));
                  updateUrlParams({ appName: null });
                } else {
                  setFilter(prev => ({ ...prev, [key]: null }));
                  updateUrlParams({ [key]: null });
                }
              }}
              className="px-3 py-1 bg-white"
            >
              <span className="font-medium capitalize">{key === 'appName' ? 'Created From' : key.replace(/([A-Z])/g, ' $1').trim()}:</span> {getFilterLabel(key, value)}
            </Tag>
          ))}
          {dateFilterLabel && (
            <Tag
              closable
              onClose={() => {
                setSelectedPreset('custom');
                setDateRange(null);
                updateUrlParams({ startDate: null, endDate: null, customerDate: null, preset: null });
              }}
              className="px-3 py-1 bg-white"
            >
              <span className="font-medium capitalize">Date:</span> {dateFilterLabel}
            </Tag>
          )}
          <Button size="small" className="border-none hover:underline shadow-none" onClick={handleResetFilters}>
            Clear All
          </Button>
        </div>
      </div>
    );
  };

  const handleDeleteClick = record => {
    deleteModal.open(record);
  };

  const handleDelete = async () => {
    const result = await deleteCustomer({
      customerId: deleteModal.payload?.id,
      isCustomer: !isVendorPage,
      isVendor: isVendorPage,
    });
    if (result?.payload) {
      deleteModal.close();
      const controller = new AbortController();
      fetchCustomer(controller.signal);
    }
  };

  useEffect(() => {
    const savedFilters = getAllFiltersFromLocalStorage(FILTER_KEY);

    if (!isApiCalledRef.current && !searchParams.get('page') && !searchParams.get('limit')) {
      if (savedFilters && Object.keys(savedFilters).length > 0) {
        if (savedFilters.preset) {
          setSelectedPreset(savedFilters.preset);
        }
        if (savedFilters.startDate && savedFilters.endDate) {
          setDateRange([savedFilters.startDate, savedFilters.endDate]);
        } else if (savedFilters.customerDate) {
          setDateRange([savedFilters.customerDate, savedFilters.customerDate]);
        }

        setFilter(prev => ({
          ...prev,
          search: savedFilters.search ?? prev.search,
          country: savedFilters.country ?? prev.country,
          state: savedFilters.state ?? prev.state,
          city: savedFilters.city ?? prev.city,
          status: savedFilters.status ? savedFilters?.status?.split(',') : prev.status,
          appName: savedFilters.appName ?? prev.appName,
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
    const switchedCustomerVendorList = listVendorModeRef.current !== isVendorPage;
    if (switchedCustomerVendorList) {
      listVendorModeRef.current = isVendorPage;
      resetCustomerMaster();
    }
    fetchCustomer(controller.signal);
    return () => controller.abort();
  }, [searchParams, location.pathname, isVendorPage, resetCustomerMaster, FILTER_KEY]);

  const handleStatusTab = statusArr => {
    const status = Array.isArray(statusArr) ? statusArr : statusArr ? [statusArr] : [];
    setFilter(prev => ({ ...prev, status }));
    updateUrlParams({ status, page: 1, limit: pagination?.limit });
  };

  const columns = customerColumn(isVendorPage, isCustomerOrderAppAvailable);
  const columnsFromLocalStorage = getFromLocalStorage(configEnum?.CUSTOME_MASTER_CONFIG);
  const parsedColumnData = parsedTableCoulmns(columnsFromLocalStorage, columns);

  const displayColumn = parsedColumnData?.displayColumn?.filter(x => x?.visible === true);
  const [columnsList, setColumnsList] = useState(() => parsedColumnData?.displayColumn.slice(0, -1));
  const [customizedColumns, setCutomizedColumns] = useState(() => [...(parsedColumnData?.customizedColumn?.length > 0 ? parsedColumnData.customizedColumn : displayColumn)]);

  useEffect(() => {
    const nextColumns = customerColumn(isVendorPage, isCustomerOrderAppAvailable);
    const fromStorage = getFromLocalStorage(configEnum?.CUSTOME_MASTER_CONFIG);
    const nextParsed = parsedTableCoulmns(fromStorage, nextColumns);
    const nextDisplayColumn = nextParsed?.displayColumn?.filter(x => x?.visible === true);
    setColumnsList(nextParsed?.displayColumn.slice(0, -1));
    setCutomizedColumns([...(nextParsed?.customizedColumn?.length > 0 ? nextParsed.customizedColumn : nextDisplayColumn)]);
    // Re-run when active features finish loading, since they arrive after the first render.
  }, [isVendorPage, isCustomerOrderAppAvailable]);

  const setColumnsListForToolbar = useCallback(cols => {
    setColumnsList(Array.isArray(cols) ? cols.slice(0, -1) : cols);
  }, []);

  const handleColumnResize = useColumnResize(setColumnsList, setCutomizedColumns, configEnum?.CUSTOME_MASTER_CONFIG);

  const { showColumnModal, setShowColumnModal, standardDropdownItems } = useDocumentListToolbar({
    filterKey: FILTER_KEY,
    columnConfigKey: configEnum?.CUSTOME_MASTER_CONFIG,
    showPreferences: false,
    columnsConfig: {
      getDefaultColumns: () => customerColumn(isVendorPage, isCustomerOrderAppAvailable),
      setColumnsList: setColumnsListForToolbar,
      setCustomizedColumns: setCutomizedColumns,
    },
    handleResetFilters,
    onRefresh: () => fetchCustomer(),
    setIsLocked,
  });

  const handleExport = async exportOptions => {
    const controller = new AbortController();
    const payload = {
      signal: controller.signal,
      search: searchParams.get('search') || filter.search || '',
      country: searchParams.get('country') || filter.country || '',
      state: searchParams.get('state') || filter.state || '',
      city: searchParams.get('city') || filter.city || '',
      status: searchParams.get('status') || '',
      verificationStatus: searchParams.get('verificationStatus') || filter.verificationStatus || '',
      appName: searchParams.get('appName') || filter.appName || '',
      startDate: searchParams.get('startDate') || null,
      endDate: searchParams.get('endDate') || null,
      customerDate: searchParams.get('customerDate') || null,
    };

    if (isVendorPage) {
      payload.isVendor = true;
    } else {
      payload.isCustomer = true;
    }

    try {
      const response = await getCustomerExports(payload);
      const customerList = Array.isArray(response?.data) ? response.data : [];
      if (!customerList.length) {
        Toast.warning('No data available to export.');
        return;
      }

      const exportData = buildExportRows(customerList, customerExportColumn(isVendorPage));
      const defaultFileName = isVendorPage ? 'Vendors_Export' : 'Customers_Export';
      const fileName = resolveExportFileName(exportOptions?.fileName, defaultFileName);

      downloadExcelExport({
        exportData,
        sheetName: isVendorPage ? 'Vendors' : 'Customers',
        fileName,
      });
      setExportModalOpen(false);
    } catch (error) {
      if (isCanceledRequestError(error)) return;
      Toast.error('Failed to export. Please try again.');
    }
  };

  const dropdownItems = [
    {
      type: 'group',
      label: 'IMPORT & EXPORT',
      children: [
        ...(pageAccess?.create && !isViewOnly
          ? [
              {
                key: 'addBulkCustomers',
                label: `Add ${isVendorPage ? 'Bulk Vendor' : 'Bulk Customers'}`,
                icon: <Icons.PlusCircleOutlined />,
                onClick: ({ domEvent }) => {
                  domEvent.stopPropagation();
                  navigate(isVendorPage ? '/vendors/bulk/import' : '/customer-master/bulk/import');
                },
              },
              {
                key: 'addBulkOpeningBalance',
                label: `Add ${isVendorPage ? 'Vendor' : 'Customer'} Opening Balance`,
                icon: <Icons.PlusCircleOutlined />,
                onClick: ({ domEvent }) => {
                  domEvent.stopPropagation();
                  navigate(isVendorPage ? '/vendors/bulk/opening-balance' : '/customer-master/bulk/opening-balance');
                },
              },
            ]
          : []),

        {
          key: 'exportCustomers',
          label: `Export ${isVendorPage ? 'Vendors' : 'Customers'}`,
          icon: <Icons.FileExcelOutlined />,
          onClick: ({ domEvent }) => {
            domEvent.stopPropagation();
            setExportModalOpen(true);
          },
        },
      ],
    },

    {
      type: 'divider',
    },
    ...standardDropdownItems,
    {
      type: 'divider',
    },
    (() => {
      const NO_PERMISSION_MSG = "You don't have permission for this operation. Please check with your system admin.";
      if (isVendorPage) {
        const canView = !!useModuleTopVendorsByAmountPurchase?.canView;
        return {
          type: 'group',
          label: 'ANALYTICS',
          children: [
            {
              key: 'topVendorbypurchase',
              icon: <Icons.DollarCircleOutlined className={canView ? '' : 'text-gray-400'} />,
              label: (
                <Tooltip title={canView ? '' : NO_PERMISSION_MSG} placement="left">
                  <span className={canView ? '' : 'text-gray-400'}>Top Vendor by Purchase</span>
                </Tooltip>
              ),
              disabled: !canView,
              onClick: ({ domEvent }) => {
                domEvent.stopPropagation();
                if (!canView) return;
                navigate('/analytics/purchase/top-vendors-revenue');
              },
            },
          ],
        };
      }
      const canView = !!useModuleTopCustomersOfSales?.canView;
      return {
        type: 'group',
        label: 'ANALYTICS',
        children: [
          {
            key: 'topCustomerOfSales',
            icon: <Icons.UserOutlined className={canView ? '' : 'text-gray-400'} />,
            label: (
              <Tooltip title={canView ? '' : NO_PERMISSION_MSG} placement="left">
                <span className={canView ? '' : 'text-gray-400'}>Top Customer of Sales</span>
              </Tooltip>
            ),
            disabled: !canView,
            onClick: ({ domEvent }) => {
              domEvent.stopPropagation();
              if (!canView) return;
              navigate('/analytics/sales-orders/top-customers');
            },
          },
        ],
      };
    })(),
  ];
  const handleMarkAsStatus = async record => {
    const isActive = record?.isActive;
    const payload = {
      customerId: record?.id,
      isActive: !isActive,
      isCustomer: !isVendorPage,
      isVendor: isVendorPage,
    };
    await toggleCustomerStatus(payload);
    fetchCustomer();
  };

  const handleResendPortalInvite = async record => {
    await resendPortalInvite({ customerId: record?.id });
  };

  const handleAcceptVerification = async record => {
    await acceptCustomerVerification({ customerId: record?.id });
    fetchCustomer();
  };

  const handleRejectVerification = async record => {
    await rejectCustomerVerification({ customerId: record?.id });
    fetchCustomer();
  };

  const actionColumn = () => {
    if (isVendorPage) {
      return {
        title: 'Action',
        key: 'action',
        fixed: 'right',
        width: 130,
        render: record => {
          const canView = useModuleVendor?.view;
          const canEdit = useModuleVendor?.edit && !isViewOnly;
          const canDelete = useModuleVendor?.delete && !isViewOnly;
          const canCopy = useModuleCustomerMaster?.create && !isViewOnly;
          const canOpenMore = canEdit || canCopy;
          const blockedTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : PERMISSION_MESSAGES.NO_PERMISSION;

          return (
            <div className="flex items-center justify-start gap-3">
              {canView && (
                <Tooltip title="View Vendor" getPopupContainer={() => containerRef.current || document.body}>
                  <Icons.EyeOutlined className="cursor-pointer" style={{ fontSize: 17, color: '#1E3A56' }} onClick={() => handleViewClick(record)} />
                </Tooltip>
              )}
              <Tooltip title={canEdit ? 'Edit Vendor' : blockedTooltip} getPopupContainer={() => containerRef.current || document.body}>
                <Icons.EditOutlined
                  className={canEdit ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                  style={{ fontSize: 17, color: colorPalette.primary[500], cursor: canEdit ? 'pointer' : 'not-allowed' }}
                  onClick={e => {
                    e.stopPropagation();
                    if (!canEdit) return;
                    handleEditClick(record);
                  }}
                />
              </Tooltip>
              <Tooltip title={canDelete ? 'Delete Vendor' : blockedTooltip} getPopupContainer={() => containerRef.current || document.body}>
                <Icons.DeleteOutlined
                  className={canDelete ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                  style={{ fontSize: 17, color: colorPalette.error[500], cursor: canDelete ? 'pointer' : 'not-allowed' }}
                  onClick={e => {
                    e.stopPropagation();
                    if (!canDelete) return;
                    handleDeleteClick(record);
                  }}
                />
              </Tooltip>
              <Dropdown
                placement="bottomRight"
                trigger={['click']}
                disabled={!canOpenMore}
                open={openDropdownKey === record.id}
                onOpenChange={flag => {
                  if (!canOpenMore) return;
                  setOpenDropdownKey(flag ? record.id : null);
                }}
                dropdownRender={() => {
                  const isActive = record?.isActive;

                  // Conditionally show "Mark as Active" or "Mark as Inactive" based on isActive
                  const dropDownItems = canEdit
                    ? [
                        {
                          key: `markAs${isActive ? 'Inactive' : 'Active'}`,
                          label: `Mark as ${isActive ? 'Inactive' : 'Active'}`,
                          onClick: () => handleMarkAsStatus(record),
                        },
                      ]
                    : [];
                  const getStatusIcon = isActiveStatus => {
                    if (isActiveStatus) {
                      return {
                        icon: <Icons.CheckCircleOutlined className="text-green-800" style={{ fontSize: 14 }} />,
                        hoverClass: 'hover:bg-green-50 hover:text-green-800',
                      };
                    } else {
                      return {
                        icon: <Icons.CloseCircleOutlined className="text-red-800" style={{ fontSize: 14 }} />,
                        hoverClass: 'hover:bg-red-50 hover:text-red-800',
                      };
                    }
                  };

                  return (
                    <div className="bg-white shadow-lg rounded-lg border border-gray-200 flex flex-col w-56 py-1">
                      {dropDownItems.length > 0 && (
                        <>
                          <div className="px-2 py-1">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">Status Actions :</div>
                          </div>
                          {dropDownItems.map(item => {
                            const statusIcon = getStatusIcon(!isActive);
                            return (
                              <StatusConfirmPopover
                                key={item.key}
                                record={record}
                                isActive={isActive}
                                onConfirm={() => handleMarkAsStatus(record)}
                                onCloseDropdown={() => setOpenDropdownKey(null)}
                                label={item.label}
                                icon={statusIcon.icon}
                                placement="left"
                                getPopupContainer={() => containerRef.current || document.body}
                                confirmMessage={
                                  <p className="text-sm font-medium text-gray-800 leading-relaxed">
                                    Are you sure you want to mark this {isVendorPage ? 'vendor' : 'customer'} as{' '}
                                    <span className={`font-semibold ${isActive ? 'text-red-600' : 'text-green-600'}`}>{isActive ? 'inactive' : 'active'}</span>?
                                  </p>
                                }
                              />
                            );
                          })}
                        </>
                      )}
                      {canCopy && (
                        <>
                          <div className="border-t border-gray-200 my-1" />
                          <div className="px-2 py-1">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">Copy Actions :</div>
                          </div>
                          <button className="flex items-center gap-2 px-4 py-2.5 text-sm w-full text-left hover:bg-blue-50 hover:text-blue-700" onClick={() => handleCopyToCustomer(record)}>
                            <Icons.CopyOutlined style={{ fontSize: 14 }} />
                            Copy to Customer
                          </button>
                        </>
                      )}
                    </div>
                  );
                }}
              >
                <Tooltip title={canOpenMore ? 'More Actions' : blockedTooltip} placement="left">
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
    } else {
      return {
        title: 'Action',
        key: 'action',
        fixed: 'right',
        width: 130,
        render: record => {
          const canView = useModuleCustomerMaster?.view;
          const canEdit = useModuleCustomerMaster?.edit && !isViewOnly;
          const canDelete = useModuleCustomerMaster?.delete && !isViewOnly;
          const canCopy = useModuleVendor?.create && !isViewOnly;
          const canOpenMore = canEdit || canCopy;
          const blockedTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : PERMISSION_MESSAGES.NO_PERMISSION;

          return (
            <div className="flex items-center justify-start gap-3">
              {canView && (
                <Tooltip title="View Customer" getPopupContainer={() => containerRef.current || document.body}>
                  <Icons.EyeOutlined className="cursor-pointer" style={{ fontSize: 17, color: '#1E3A56' }} onClick={() => handleViewClick(record)} />
                </Tooltip>
              )}
              <Tooltip title={canEdit ? 'Edit Customer' : blockedTooltip} getPopupContainer={() => containerRef.current || document.body}>
                <Icons.EditOutlined
                  className={canEdit ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                  style={{ fontSize: 17, color: colorPalette.primary[500], cursor: canEdit ? 'pointer' : 'not-allowed' }}
                  onClick={e => {
                    e.stopPropagation();
                    if (!canEdit) return;
                    handleEditClick(record);
                  }}
                />
              </Tooltip>
              <Tooltip title={canDelete ? 'Delete Customer' : blockedTooltip} getPopupContainer={() => containerRef.current || document.body}>
                <Icons.DeleteOutlined
                  className={canDelete ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                  style={{ fontSize: 17, color: colorPalette.error[500], cursor: canDelete ? 'pointer' : 'not-allowed' }}
                  onClick={e => {
                    e.stopPropagation();
                    if (!canDelete) return;
                    handleDeleteClick(record);
                  }}
                />
              </Tooltip>
              <Dropdown
                placement="bottomRight"
                trigger={['click']}
                disabled={!canOpenMore}
                open={openDropdownKey === record.id}
                onOpenChange={flag => {
                  if (!canOpenMore) return;
                  setOpenDropdownKey(flag ? record.id : null);
                }}
                dropdownRender={() => {
                  const isActive = record?.isActive;

                  const dropDownItems = canEdit
                    ? [
                        {
                          key: `markAs${isActive ? 'Inactive' : 'Active'}`,
                          label: `Mark as ${isActive ? 'Inactive' : 'Active'}`,
                          onClick: () => handleMarkAsStatus(record),
                        },
                      ]
                    : [];

                  const getStatusIcon = isActiveStatus => {
                    if (isActiveStatus) {
                      return {
                        icon: <Icons.CheckCircleOutlined className="text-green-800" style={{ fontSize: 14 }} />,
                        hoverClass: 'hover:bg-green-50 hover:text-green-800',
                      };
                    } else {
                      return {
                        icon: <Icons.CloseCircleOutlined className="text-red-800" style={{ fontSize: 14 }} />,
                        hoverClass: 'hover:bg-red-50 hover:text-red-800',
                      };
                    }
                  };

                  return (
                    <div className="bg-white shadow-lg rounded-lg border border-gray-200 flex flex-col w-56 py-1">
                      {dropDownItems.length > 0 && (
                        <>
                          <div className="px-2 py-1">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">Status Actions :</div>
                          </div>
                          {dropDownItems.map(item => {
                            const statusIcon = getStatusIcon(!isActive);
                            return (
                              <StatusConfirmPopover
                                key={item.key}
                                record={record}
                                isActive={isActive}
                                onConfirm={() => handleMarkAsStatus(record)}
                                onCloseDropdown={() => setOpenDropdownKey(null)}
                                label={item.label}
                                icon={statusIcon.icon}
                                placement="left"
                                getPopupContainer={() => containerRef.current || document.body}
                                confirmMessage={
                                  <p className="text-sm font-medium text-gray-800 leading-relaxed">
                                    Are you sure you want to mark this {isVendorPage ? 'vendor' : 'customer'} as{' '}
                                    <span className={`font-semibold ${isActive ? 'text-red-600' : 'text-green-600'}`}>{isActive ? 'inactive' : 'active'}</span>?
                                  </p>
                                }
                              />
                            );
                          })}
                        </>
                      )}
                      {/* Portal actions are hard hidden without the customer portal (CUSTOMER_ORDER) plan feature. */}
                      {isCustomerOrderAppAvailable && canEdit && record.portalEnabled && !record.portalAccepted && (
                        <>
                          <div className="border-t border-gray-200 my-1" />
                          <div className="px-2 py-1">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">Portal Actions :</div>
                          </div>
                          <button
                            className="flex items-center gap-2 px-4 py-2.5 text-sm w-full text-left hover:bg-blue-50 hover:text-blue-700"
                            onClick={() => {
                              setOpenDropdownKey(null);
                              handleResendPortalInvite(record);
                            }}
                          >
                            <Icons.SendOutlined style={{ fontSize: 14 }} />
                            Resend Invite
                          </button>
                        </>
                      )}
                      {isCustomerOrderAppAvailable && canEdit && record.verificationStatus === 'PENDING' && (
                        <>
                          <div className="border-t border-gray-200 my-1" />
                          <div className="px-2 py-1">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">Verification Actions :</div>
                          </div>
                          <StatusConfirmPopover
                            record={record}
                            onConfirm={() => handleAcceptVerification(record)}
                            onCloseDropdown={() => setOpenDropdownKey(null)}
                            label="Accept Verification"
                            icon={<Icons.CheckCircleOutlined style={{ fontSize: 14 }} />}
                            variant="success"
                            placement="left"
                            getPopupContainer={() => containerRef.current || document.body}
                            confirmMessage={
                              <p className="text-sm font-medium text-gray-800 leading-relaxed">Approve this customer's verification request? They will be able to place orders once approved.</p>
                            }
                          />
                          <StatusConfirmPopover
                            record={record}
                            onConfirm={() => handleRejectVerification(record)}
                            onCloseDropdown={() => setOpenDropdownKey(null)}
                            label="Reject Verification"
                            icon={<Icons.CloseCircleOutlined style={{ fontSize: 14 }} />}
                            variant="danger"
                            placement="left"
                            getPopupContainer={() => containerRef.current || document.body}
                            confirmMessage={<p className="text-sm font-medium text-gray-800 leading-relaxed">Reject this customer's verification request? This cannot be undone from here.</p>}
                          />
                        </>
                      )}
                      {canCopy && (
                        <>
                          <div className="border-t border-gray-200 my-1" />
                          <div className="px-2 py-1">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">Copy Actions :</div>
                          </div>
                          <button className="flex items-center gap-2 px-4 py-2.5 text-sm w-full text-left hover:bg-blue-50 hover:text-blue-700" onClick={() => handleCopyToVendor(record)}>
                            <Icons.CopyOutlined style={{ fontSize: 14 }} />
                            Copy to Vendor
                          </button>
                        </>
                      )}
                    </div>
                  );
                }}
              >
                <Tooltip title={canOpenMore ? 'More Actions' : blockedTooltip} placement="left">
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
    }
  };

  const customerRightStats =
    !isVendorPage && isCustomerOrderAppAvailable
      ? [
          {
            label: 'Total Count',
            value: pagination?.totalResults || 0,
          },
          {
            label: 'Invited',
            value: pagination?.portalSummary?.invited ?? 0,
            colorClass: 'text-blue-600',
            tooltip: 'Customers invited to the Customer App portal (invite sent but not yet accepted)',
          },
          {
            label: 'Joined via code',
            value: pagination?.portalSummary?.joinedViaCode ?? 0,
            colorClass: 'text-green-600',
            tooltip: 'Customers who joined the Customer App portal using a join code',
          },
        ]
      : [
          {
            label: 'Total Count',
            value: pagination?.totalResults || 0,
          },
        ];

  return (
    <div ref={containerRef} className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden -m-4">
      <div className="bg-white px-4 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        <PageHeader loading={loading} title={isVendorPage ? PAGE_HEADERS?.VENDORS?.title : PAGE_HEADERS?.CUSTOMER?.title} rightStats={customerRightStats} />

        <div className="flex flex-wrap gap-2 md:gap-3 justify-center md:justify-end">
          <PermissionButton
            isViewOnly={isViewOnly}
            canAccess={pageAccess?.create}
            type="primary"
            className="w-full md:w-auto py-2 md:py-4 px-4 md:px-5"
            onClick={() => navigate(isVendorPage ? '/vendors/new' : '/customer-master/new')}
            icon={<Icons.PlusCircleOutlined />}
            text="Add"
          />
          <Tooltip title="More Actions" placement="left" getPopupContainer={() => containerRef.current || document.body}>
            <Dropdown menu={{ items: dropdownItems, className: 'app-toolbar-dropdown' }} trigger={['click']} getPopupContainer={() => containerRef.current || document.body}>
              <CustomButton type="default" icon={<Icons.EllipsisOutlined />} />
            </Dropdown>
          </Tooltip>
        </div>
      </div>

      <div className="bg-white border-t px-4 py-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <StatusFilterTabs statuses={CUSTOMER_STATUS_OPTIONS} value={filter?.status} onChange={handleStatusTab} />
          <div className="flex-grow" />
          <div className="flex gap-2 items-center">
            <FilterInput type={filterInputEnum?.SEARCH} name={'search'} placeHolder="Search..." value={filter?.search} setFilter={setFilter} onSerch={handleSearch} onClear={handleClear} />
            <ColumnSelection
              columns={filterCreatedFromColumn(columnsList)}
              setColumnsList={setColumnsList}
              setCutomizedColumns={setCutomizedColumns}
              configPage={configEnum?.CUSTOME_MASTER_CONFIG}
              modalOpen={showColumnModal}
              setModalOpen={setShowColumnModal}
            />
            <FilterLockButton isLocked={isLocked} activeFiltersCount={activeFiltersCount} onToggle={handleLockToggle} />
            <FilterButton count={activeFiltersCount} onClick={() => setShowFilter(true)} />
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
                mode="multiple"
                name={'status'}
                label={'Status'}
                placeHolder={'Select Status'}
                selectionOptions={CUSTOMER_STATUS_OPTIONS}
                value={filter?.status}
                setFilter={setFilter}
                allowClear={true}
                getPopupContainer={() => containerRef.current || document.body}
              />
            </div>
            {!isVendorPage && (
              <div className="space-y-2">
                <FilterInput
                  type={filterInputEnum?.SELECT}
                  name={'verificationStatus'}
                  label={'Verification Status'}
                  placeHolder={'Select Verification Status'}
                  selectionOptions={Object.entries(CUSTOMER_VERIFICATION_STATUS).map(([value, label]) => ({ value, label }))}
                  value={filter?.verificationStatus}
                  setFilter={setFilter}
                  allowClear={true}
                  getPopupContainer={() => containerRef.current || document.body}
                />
              </div>
            )}
            <div className="space-y-2">{hasCRMAccess && <CreatedFromFilter filter={filter} setFilter={setFilter} getPopupContainer={() => containerRef.current || document.body} />}</div>
          </FilterSection>

          <FilterSection title="Where">
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name={'country'}
                label={'Country'}
                placeHolder={'Select Country'}
                selectionOptions={locationFilters.countryOptions}
                value={filter?.country}
                setFilter={setFilter}
                allowClear={true}
                onFocus={locationFilters.handleCountryFocus}
                getPopupContainer={() => containerRef.current || document.body}
                loading={locationFilters?.countriesLoading}
              />
            </div>
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name={'state'}
                label={'State'}
                placeHolder={'Select State'}
                selectionOptions={locationFilters.stateOptions}
                disabled={locationFilters.stateDisabled}
                value={filter?.state}
                setFilter={setFilter}
                allowClear={true}
                getPopupContainer={() => containerRef.current || document.body}
                loading={locationFilters?.statesLoading}
              />
            </div>
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name={'city'}
                label={'City'}
                placeHolder={'Select City'}
                selectionOptions={locationFilters.cityOptions}
                disabled={locationFilters.cityDisabled}
                value={filter?.city}
                setFilter={setFilter}
                allowClear={true}
                getPopupContainer={() => containerRef.current || document.body}
                loading={locationFilters?.citiesLoading}
              />
            </div>
          </FilterSection>
        </FilterDrawer>
        <FilterTags />
      </div>
      <div>
        <CustomTable
          onColumnResize={handleColumnResize}
          columns={[...filterCreatedFromColumn(customizedColumns)]}
          data={customerMaster}
          loading={loading}
          onChange={handleTableChange}
          onRowClick={handleViewClick}
          tableId="id"
          pagination={{
            current: searchParams?.get('page') || 1,
            pageSize: searchParams?.get('limit') || pagination?.limit,
            total: pagination.totalResults,
            onChange: handlePaginationChange,
          }}
          columnActions={actionColumn}
        />
      </div>

      <ExportDataModal
        modalOpen={exportModalOpen}
        setModalOpen={setExportModalOpen}
        entityPlural={isVendorPage ? 'Vendors' : 'Customers'}
        defaultFileName={isVendorPage ? 'Vendors_Export' : 'Customers_Export'}
        exportLoading={exportLoading}
        onExport={handleExport}
        formName="export-customers"
      />
      <DocumentConfirmModal
        modal={deleteModal}
        docType={isVendorPage ? MODULE_NAMES.VENDOR : MODULE_NAMES.CUSTOMER}
        onConfirm={handleDelete}
        loading={deleteLoading}
        getDocumentDetails={customer => getCustomerDocumentDetails(customer, isVendorPage)}
      />
    </div>
  );
};

export default ViewCustomers;
