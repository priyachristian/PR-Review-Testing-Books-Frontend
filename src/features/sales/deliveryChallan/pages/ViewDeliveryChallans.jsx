import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

// Components
import { Dropdown, Tag, Tooltip } from '@/components/AntDComponent';
import ConvertToSelectionModal from '@/features/sales/salesOrder/components/ConvertToSelectionModal';
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
import LocationFilters, { getLocationFilterTags } from '@/components/forms/formInput/LocationFilters';
import PageHeader from '@/components/ui/common/PageHeader';
import ViewDocumentListToolbarModals from '@/components/ui/common/ViewDocumentListToolbarModals';

// Hooks
import { useConvert } from 'hooks/useConvert';
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import { useConfirmModal } from '@/hooks/useConfirmModal';
import useModulePermissions from 'hooks/useModulePermissions';
import useDocumentListToolbar from '@/hooks/useDocumentListToolbar';
import useDocumentPdfExport from '@/hooks/useDocumentPdfExport';
import { gstPdfExportFormats, useGstFeatures } from '@/features/sales/gstDocument';
import useColumnResize from '@/hooks/useColumnResize';
import { useFilters } from '@/utils/filtersUtils';
import { useUser } from '@/features/setting/user/useUser';
import { useCustomer } from '@/features/sales/customer';

// Extras
import { useDeliveryChallan, deliveryChallanColumn, deliveryChallanExportColumn, getDeliveryChallanDocumentDetails } from '@/features/sales/deliveryChallan';
import { resetBranch } from '@/features/allMaster/warehouse/warehouse.slice';
import Icons from 'assets/icons/icon';
import { FILTERS_KEYS, RESOURCES } from '@/utils/jsonFile';
import { getAllFiltersFromLocalStorage } from '@/utils/filters';
import { CommonFilterTags, getCustomerFilterTag } from '@/utils/filtersUtils';
import { colorPalette } from '@/utils/theme';
import {
  BACKEND_ENUM,
  COMPANY_FEATURE,
  configEnum,
  DELIVERY_CHALLAN_CONVERSION_ALLOWED_STATUSES,
  DELIVERY_CHALLAN_EDIT_RESTRICTED_STATUS,
  DELIVERY_CHALLAN_STATUS,
  DELIVERY_CHALLAN_STATUS_CHANGE_RESTRICTED_STATUS,
  filterInputEnum,
  MODULE_NAMES,
  PERMISSION_MESSAGES,
} from 'utils/constants';
import { getFromLocalStorage, getQueryParams, parsedTableCoulmns } from 'utils/services';
import { PAGE_HEADERS } from 'utils/label';
import { buildDivisionSelectOptions, buildBranchSelectOptions, divisionSelectColumnHeader, branchSelectColumnHeader } from '@/utils/tableSelectDropdown/orgSelectDropdown';
import { buildCustomerSelectOptions, customerSelectColumnHeader, customerSelectDropdownProps } from '@/utils/tableSelectDropdown/customerSelectDropdown';

const API_CALLED_ENUM = {
  DIVISION_DROPDOWN: 'divisionDropdown',
  USERS_DROPDOWN: 'usersDropdown',
  CUSTOMER_DROPDOWN: 'customerDropdown',
};

const ViewDeliveryChallans = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const {
    deliveryChallans,
    pagination,
    loading,
    submitLoading,
    deleteLoading,
    exportLoading,
    getDeliveryChallans,
    getDeliveryChallanExports,
    removeDeliveryChallan,
    resetDeliveryChallans,
    updateStatus,
  } = useDeliveryChallan();
  const { handleConvertDeliveryChallan } = useConvert();
  const { useModuleDelivery, useModuleInvoice, isViewOnly, signin, isSplitSessionActive, divDrop, divisionLoading, getDivDropDown, branchDrop, branchLoading, getBranchDropDown } =
    useModulePermissions(RESOURCES.DELIVERY_CHALLANS);
  const { usersDropdown, usersDropdownLoading, getUsersDropdown } = useUser();
  const { customerDropDownList, loading: customerLoading, getCustomerDropList } = useCustomer();

  const FILTER_KEY = FILTERS_KEYS.DELIVERY_CHALLANS_ALL_FILTER;
  const [searchParams, setSearchParams] = useSearchParams();
  const deleteModal = useConfirmModal();
  const cancelStatusModal = useConfirmModal();
  const [openDropdownKey, setOpenDropdownKey] = useState(null);
  const isApiCalledRef = useRef(false);
  const isApicalledRefFilter = useRef({
    divisionDropdown: false,
    usersDropdown: false,
    customerDropdown: false,
  });
  const [isOpenConvertModal, setIsOpenConvertModal] = useState(false);
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
      addedBy: searchParams.get('addedBy') ? searchParams.get('addedBy').split(',') : '',
      country: searchParams.get('country') ? searchParams.get('country').split(',') : '',
      state: searchParams.get('state') ? searchParams.get('state').split(',') : '',
      city: searchParams.get('city') ? searchParams.get('city').split(',') : '',
      addressType: searchParams.get('addressType') || '',
    },
    dateKeys: { startDate: 'startDate', endDate: 'endDate', singleDate: 'challanDate' },
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
        } else if (savedFilters.challanDate) {
          setDateRange([savedFilters.challanDate, savedFilters.challanDate]);
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
          handleOnFocusApiCall(API_CALLED_ENUM.CUSTOMER_DROPDOWN);
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
    fetchDeliverychallans(controller.signal);

    return () => controller.abort();
  }, [searchParams]);

  useResetOnUnmount(resetDeliveryChallans);

  const isSplitInitRef = useRef(true);
  useEffect(() => {
    if (isSplitInitRef.current) {
      isSplitInitRef.current = false;
      return;
    }
    const controller = new AbortController();
    fetchDeliverychallans(controller.signal);
    return () => controller.abort();
  }, [isSplitSessionActive]);

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

    if (type === API_CALLED_ENUM.CUSTOMER_DROPDOWN) {
      await getCustomerDropList({});
      obj.customerDropdown = true;
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
  }, []);

  const handleEditClick = record => {
    navigate(`/delivery-challans/${record.id}/edit`, {
      state: {
        deliveryChallanData: record,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleCloseConvertModal = () => {
    setIsOpenConvertModal(false);
  };

  const fetchDeliverychallans = signal => {
    const page = parseInt(searchParams?.get('page')) || 1;
    const pageSize = parseInt(searchParams?.get('limit')) || pagination.limit;
    const payload = getQueryParams(window.location.href) || {};

    getDeliveryChallans({ ...payload, page, limit: pageSize, ...(isSplitSessionActive ? { isSplit: true } : {}), signal });
  };

  const handlePaginationChange = (page, pageSize) => {
    updateUrlParams({ page, limit: pageSize });
  };

  const handleStatusTab = statusArr => {
    const status = Array.isArray(statusArr) ? statusArr : statusArr ? [statusArr] : [];
    setFilter(prev => ({ ...prev, status }));
    updateUrlParams({ status, page: 1, limit: pagination?.limit });
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

  const handleViewClick = record => {
    navigate(`/delivery-challans/${record.id}`, {
      state: {
        deliveryChallanData: record,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleDuplicateClick = record => {
    navigate('/delivery-challans/new', {
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

  const deleteDeliveryChallan = async () => {
    await removeDeliveryChallan({ deliveryChallanId: deleteModal.payload?.id });
    deleteModal.close();
    fetchDeliverychallans();
    // if (clearSelection) {
    //   clearSelection();
    // }
  };

  const handleUpdateStatus = async (challanId, status) => {
    await updateStatus({ deliveryChallanId: challanId, status });
    fetchDeliverychallans();
  };

  const updateChallanStatus = async (challan, newStatus) => {
    setOpenDropdownKey(null);
    if (newStatus === BACKEND_ENUM?.CANCELLED) {
      cancelStatusModal.open({
        challan,
        newStatus,
        label: DELIVERY_CHALLAN_STATUS?.[newStatus] || newStatus,
      });
      return;
    }
    await handleUpdateStatus(challan?.id || challan?._id, newStatus);
  };

  const confirmCancelStatus = async () => {
    const challan = cancelStatusModal.payload?.challan;
    const newStatus = cancelStatusModal.payload?.newStatus;
    await handleUpdateStatus(challan?.id || challan?._id, newStatus);
    cancelStatusModal.close();
  };

  const getConvertStatusValue = (status, challan) => {
    let statusArr = [];
    const challanId = challan?.id || challan?._id;

    const markAs = (backendStatus, labelStatus) => ({
      key: `markAs${labelStatus}`,
      label: `Mark As ${labelStatus}`,
      onClick: () => handleUpdateStatus(challanId, backendStatus),
    });
    const draftItem = markAs(BACKEND_ENUM?.DRAFT, DELIVERY_CHALLAN_STATUS?.DRAFT);
    const sentItem = markAs(BACKEND_ENUM?.SENT, DELIVERY_CHALLAN_STATUS?.SENT);
    const cancelItem = {
      key: `markAs${DELIVERY_CHALLAN_STATUS?.CANCELLED}`,
      label: `Mark As ${DELIVERY_CHALLAN_STATUS?.CANCELLED}`,
      onClick: () => updateChallanStatus(challan, BACKEND_ENUM?.CANCELLED),
    };

    if (status === BACKEND_ENUM?.DRAFT) {
      statusArr = [sentItem, cancelItem];
    } else if (status === BACKEND_ENUM?.SENT) {
      statusArr = [draftItem, cancelItem];
    } else if (status === BACKEND_ENUM?.CANCELLED) {
      statusArr = [draftItem, sentItem];
    } else {
      statusArr = [cancelItem];
    }

    return statusArr;
  };

  const columns = deliveryChallanColumn();

  let columnsFromLocalStorage = getFromLocalStorage(configEnum?.DELIVERY_CHALLANS_CONFIG);
  let parsedColumnData = parsedTableCoulmns(columnsFromLocalStorage, columns);

  let displayColumn = parsedColumnData?.displayColumn?.filter(x => x?.visible === true);
  const [columnsList, setColumnsList] = useState(parsedColumnData?.displayColumn);
  const [customizedColumns, setCutomizedColumns] = useState([...(parsedColumnData?.customizedColumn?.length > 0 ? parsedColumnData.customizedColumn : displayColumn)]);

  const handleColumnResize = useColumnResize(setColumnsList, setCutomizedColumns, configEnum?.DELIVERY_CHALLANS_CONFIG);

  const { isEWayBillAvailable } = useGstFeatures();

  const { pdfExportLoading, handlePdfExport } = useDocumentPdfExport({
    defaultFileName: 'Delivery_Challans_Export',
    entityLabel: 'delivery challans',
    filterKeys: ['challanDate', 'country', 'state', 'city', 'addressType'],
    moduleType: 'deliveryChallan',
  });

  const { showColumnModal, setShowColumnModal, standardDropdownItems, toolbarModalsProps } = useDocumentListToolbar({
    moduleName: MODULE_NAMES.DELIVERY_CHALLAN,
    resource: RESOURCES.DELIVERY_CHALLANS,
    filterKey: FILTER_KEY,
    columnConfigKey: configEnum?.DELIVERY_CHALLANS_CONFIG,
    configErrorMessage: 'Failed to update delivery challan configuration',
    exportConfig: {
      exportLoading: exportLoading || pdfExportLoading,
      fetchExports: getDeliveryChallanExports,
      getExportColumns: deliveryChallanExportColumn,
      defaultFileName: 'Delivery_Challans_Export',
      sheetName: 'Delivery Challans',
      entityPlural: 'Delivery Challans',
      formName: 'export-delivery-challans',
      exportLabel: 'Export Delivery Challans',
      formats: gstPdfExportFormats({ isEWayBillAvailable }),
      onPdfExport: handlePdfExport,
    },
    columnsConfig: {
      getDefaultColumns: deliveryChallanColumn,
      setColumnsList,
      setCustomizedColumns: setCutomizedColumns,
    },
    handleResetFilters,
    onRefresh: () => fetchDeliverychallans(),
    setIsLocked,
  });

  const dropdownItems = [
    ...(useModuleInvoice?.create && !isViewOnly
      ? [
          {
            type: 'group',
            label: 'CONVERT',
            children: [
              {
                key: 'convertToInvoice',
                label: 'Convert to Invoice',
                icon: <Icons.FileTextOutlined />,
                onClick: ({ domEvent }) => {
                  domEvent.stopPropagation();
                  setIsOpenConvertModal(true);
                },
              },
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
        <PageHeader loading={loading} title={PAGE_HEADERS?.DELIVERY_CHALLAN?.title} totalAmount={pagination?.totalAmount} totalRecord={pagination?.totalResults} />

        <div className="flex flex-wrap justify-center md:justify-end items-center gap-2 md:gap-3 w-full md:w-auto">
          <PermissionButton
            canAccess={!!useModuleDelivery?.create}
            isViewOnly={isViewOnly}
            type="primary"
            className="w-full md:w-auto py-2 md:py-4 px-4 md:px-5"
            wrapperClassName="w-full md:w-auto inline-block"
            onClick={() =>
              navigate('/delivery-challans/new', {
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
          <StatusFilterTabs statuses={Object.entries(DELIVERY_CHALLAN_STATUS).map(([key, label]) => ({ value: key, label }))} value={filter?.status} onChange={handleStatusTab} />
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
                selectionOptions={Object?.entries(DELIVERY_CHALLAN_STATUS)?.map(([key, value]) => {
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
            singleDateKey: 'challanDate',
          }}
          onDateClear={() => {
            setSelectedPreset('custom');
            setDateRange(null);
            updateUrlParams({ startDate: null, endDate: null, challanDate: null, preset: null });
          }}
          STATUS_ENUM={DELIVERY_CHALLAN_STATUS}
          divDrop={divDrop}
          branchDrop={branchDrop}
          extraFilters={{
            ...getCustomerFilterTag('Customer', customerDropDownList),
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
          data={deliveryChallans}
          onChange={handleTableChange}
          onRowClick={handleViewClick}
          pagination={{
            current: searchParams?.get('page') || 1,
            pageSize: searchParams?.get('limit') || pagination?.limit,
            total: pagination.totalResults,
            onChange: handlePaginationChange,
          }}
          enableRowSelection
          selectionType="checkbox"
          tableId="id"
          renderSelectionLabel={(keys, rows) => {
            const r = rows?.[0];
            if (!r) return `${keys.length} selected`;
            return (
              <span className="flex items-center gap-2">
                <span>Delivery Challan#</span>
                <Tag className="font-semibold">{r?.challanId}</Tag>
              </span>
            );
          }}
          columnActions={() => {
            return {
              title: 'Action',
              key: 'action',
              fixed: 'right',
              width: 150,
              visible: true,

              render: (_, record) => {
                const statusLabel = DELIVERY_CHALLAN_STATUS?.[record?.status] || record?.status || '-';
                const blockedTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : PERMISSION_MESSAGES.NO_PERMISSION;

                const canView = useModuleDelivery?.view;
                const canOpenMore = useModuleDelivery?.edit && !isViewOnly;
                const canEdit = canOpenMore && !DELIVERY_CHALLAN_EDIT_RESTRICTED_STATUS?.includes(record?.status);
                const canDelete = useModuleDelivery?.delete && !isViewOnly;
                const canDuplicate = useModuleDelivery?.create && !isViewOnly;
                const canConvertINV = useModuleInvoice?.create && !isViewOnly && DELIVERY_CHALLAN_CONVERSION_ALLOWED_STATUSES?.includes(record?.status);
                const canSplit = signin?.company?.companyFeatures?.includes(COMPANY_FEATURE?.ENABLESPLITBYQTYORPRICE) && isSplitSessionActive && canConvertINV;

                const dropDownItems = [...getConvertStatusValue(record?.status, record)];
                const canMarkStatus = canOpenMore && !DELIVERY_CHALLAN_STATUS_CHANGE_RESTRICTED_STATUS?.includes(record?.status) && dropDownItems.length > 0;

                const viewTooltip = canView ? 'View DC' : PERMISSION_MESSAGES.NO_PERMISSION;
                const editTooltip = canEdit ? 'Edit DC' : !useModuleDelivery?.edit || isViewOnly ? blockedTooltip : `This document cannot be edited in its current status - ${statusLabel}.`;
                const deleteTooltip = canDelete ? 'Delete DC' : blockedTooltip;
                const duplicateTooltip = canDuplicate ? 'Duplicate Document' : blockedTooltip;
                const convertINVTooltip = canConvertINV
                  ? 'Convert to Invoice'
                  : isViewOnly
                    ? PERMISSION_MESSAGES.VIEW_ONLY
                    : !useModuleInvoice?.create
                      ? PERMISSION_MESSAGES.NO_PERMISSION
                      : `Cannot convert to Invoice in its current status - ${statusLabel}.`;
                const markAsTooltip = canMarkStatus
                  ? 'Mark Delivery Challan As'
                  : !useModuleDelivery?.edit || isViewOnly
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

                                    if (key.includes('SENT') || label.includes(DELIVERY_CHALLAN_STATUS?.SENT)) {
                                      return {
                                        icon: <Icons.CheckCircleOutlined className={markAsDisabled ? 'text-gray-400' : 'text-blue-800'} style={{ fontSize: 14 }} />,
                                        hoverClass: 'hover:bg-blue-50 hover:text-blue-800',
                                      };
                                    } else if (key.includes('CANCELLED') || label.includes(DELIVERY_CHALLAN_STATUS?.CANCELLED)) {
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
                            <Tooltip title={convertINVTooltip} placement="left">
                              <button
                                type="button"
                                onClick={
                                  canConvertINV && !submitLoading
                                    ? () => {
                                        handleConvertDeliveryChallan(record, false);
                                        setOpenDropdownKey(null);
                                      }
                                    : undefined
                                }
                                disabled={!canConvertINV || submitLoading}
                                className={`
                                  w-full px-3 py-2 text-left text-sm
                                  flex items-center gap-2
                                  transition-colors duration-150
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
                            {canSplit && (
                              <>
                                <div className="border-t border-gray-200 my-1"></div>
                                <Tooltip title="Convert to Invoice (Split)" placement="left">
                                  <button
                                    type="button"
                                    onClick={
                                      !submitLoading
                                        ? () => {
                                            handleConvertDeliveryChallan(record, true);
                                            setOpenDropdownKey(null);
                                          }
                                        : undefined
                                    }
                                    disabled={submitLoading}
                                    className={`
                                      w-full px-3 py-2 text-left text-sm
                                      flex items-center gap-2
                                      transition-colors duration-150 rounded-b
                                      ${submitLoading ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600 cursor-pointer'}
                                    `}
                                  >
                                    {submitLoading ? (
                                      <span className="flex items-center gap-2">
                                        <CustomLoader variant="button" text="Processing..." />
                                      </span>
                                    ) : (
                                      <>
                                        <Icons.SplitCellsOutlined className={submitLoading ? 'text-gray-400' : 'text-blue-500'} style={{ fontSize: 16 }} />
                                        <span>To Invoice(Split)</span>
                                      </>
                                    )}
                                  </button>
                                </Tooltip>
                              </>
                            )}
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
      {isOpenConvertModal && <ConvertToSelectionModal open={isOpenConvertModal} onClose={handleCloseConvertModal} convertType="invoice" convertFrom="deliveryChallan" />}
      <DocumentConfirmModal
        modal={deleteModal}
        docType={MODULE_NAMES?.DELIVERY_CHALLAN}
        onConfirm={deleteDeliveryChallan}
        loading={deleteLoading}
        getDocumentDetails={getDeliveryChallanDocumentDetails}
      />
      <DocumentConfirmModal
        modal={cancelStatusModal}
        docType={MODULE_NAMES?.DELIVERY_CHALLAN}
        loading={submitLoading}
        mode="status"
        onConfirm={confirmCancelStatus}
        getDocumentDetails={payload => getDeliveryChallanDocumentDetails(payload?.challan)}
      />
      <ColumnSelection
        hideTrigger
        columns={columnsList}
        setColumnsList={setColumnsList}
        setCutomizedColumns={setCutomizedColumns}
        configPage={configEnum?.DELIVERY_CHALLANS_CONFIG}
        modalOpen={showColumnModal}
        setModalOpen={setShowColumnModal}
      />
      <ViewDocumentListToolbarModals {...toolbarModalsProps} />
    </div>
  );
};

export default ViewDeliveryChallans;
