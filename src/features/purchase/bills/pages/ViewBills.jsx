import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
// Components
import ColumnSelection from '@/components/ui/common/ColumnSelection';
import StatusFilterTabs from '@/components/ui/common/StatusFilterTabs';
import FilterLockButton from '@/components/ui/common/FilterLockButton';
import FilterDrawer, { FilterSection, FilterButton } from '@/components/ui/common/FilterDrawer';
import CustomButton from '@/components/ui/button/CustomButton';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomDatePicker from '@/components/forms/formDatePicker/CustomDatePicker';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import FilterInput from '@/components/forms/formInput/FilterInput';
import PageHeader from '@/components/ui/common/PageHeader';
import { DocumentConfirmModal } from '@/components/feedback/confirmModal/CancelOrDeleteDocumentModal';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import { Dropdown, Tag, Tooltip } from '@/components/AntDComponent';
import ViewDocumentListToolbarModals from '@/components/ui/common/ViewDocumentListToolbarModals';
import { CommonFilterTags, getCustomerFilterTag } from '@/utils/filtersUtils';

// Hooks
import useModulePermissions from 'hooks/useModulePermissions';
import useDocumentListToolbar from '@/hooks/useDocumentListToolbar';
import useDocumentPdfExport from '@/hooks/useDocumentPdfExport';
import useColumnResize from '@/hooks/useColumnResize';
import { useFilters } from '@/utils/filtersUtils';
import { useUser } from '@/features/setting/user/useUser';
import { useCustomer } from '@/features/sales/customer';
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import { useConfirmModal } from '@/hooks/useConfirmModal';
// Extras
import { useBill, billColumn, billExportColumn, getBillDocumentDetails } from '@/features/purchase/bills';
import Icons from 'assets/icons/icon';
import { FILTERS_KEYS, RESOURCES } from '@/utils/jsonFile';
import { resetBranch } from '@/features/allMaster/warehouse/warehouse.slice';
import { BACKEND_ENUM, BILL_EDIT_RESTRICTED_STATUS, BILL_STATUS, BILL_STATUS_CHANGE_RESTRICTED_STATUS, configEnum, filterInputEnum, MODULE_NAMES, PERMISSION_MESSAGES } from 'utils/constants';
import { getAllFiltersFromLocalStorage } from '@/utils/filters';
import { getFromLocalStorage, getQueryParams, parsedTableCoulmns } from 'utils/services';
import { colorPalette } from '@/utils/theme';
import { PAGE_HEADERS } from 'utils/label';
import { buildDivisionSelectOptions, buildBranchSelectOptions, divisionSelectColumnHeader, branchSelectColumnHeader } from '@/utils/tableSelectDropdown/orgSelectDropdown';
import { buildCustomerSelectOptions, vendorSelectColumnHeader, customerSelectDropdownProps } from '@/utils/tableSelectDropdown/customerSelectDropdown';
import LocationFilters, { getLocationFilterTags } from '@/components/forms/formInput/LocationFilters';

const API_CALLED_ENUM = {
  DIVISION_DROPDOWN: 'divisionDropdown',
  USERS_DROPDOWN: 'usersDropdown',
  VENDOR_DROPDOWN: 'vendorDropdown',
};

const ViewBills = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const {
    bills,
    pagination,
    submitLoading,
    deleteLoading,
    loading,
    exportLoading,
    getBills,
    removeBill,
    resetBills,
    exportBill,
    updateStatus,
    autoMapOpeningBalanceToBills,
    autoMapOpeningBalanceLoading,
  } = useBill();
  const { isViewOnly, isSplitSessionActive, isSplitWise, useModuleBills, divDrop, divisionLoading, getDivDropDown, branchDrop, branchLoading, getBranchDropDown } = useModulePermissions(
    RESOURCES.BILLS
  );
  const { usersDropdown, usersDropdownLoading, getUsersDropdown } = useUser();
  const { vendorDropDownList, loading: vendorLoading, getVendorDropList } = useCustomer();
  const FILTER_KEY = FILTERS_KEYS.BILLS_ALL_FILTER;
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
  const isSplitSessionFirstRender = useRef(true);
  const [showFilter, setShowFilter] = useState(false);
  const [showAutoMapModal, setShowAutoMapModal] = useState(false);
  // const [clearSelection, setClearSelection] = useState(null);
  const prevIsSplitSessionActive = useRef(isSplitSessionActive);
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
      isSplit: false,
      addedBy: searchParams.get('addedBy') ? searchParams.get('addedBy').split(',') : '',
      country: searchParams.get('country') ? searchParams.get('country').split(',') : '',
      state: searchParams.get('state') ? searchParams.get('state').split(',') : '',
      city: searchParams.get('city') ? searchParams.get('city').split(',') : '',
      addressType: searchParams.get('addressType') || '',
    },
    dateKeys: { startDate: 'startDate', endDate: 'endDate', singleDate: 'billDate' },
    isSplitSessionActive,
    isSplitWise,
  });

  useEffect(() => {
    if (prevIsSplitSessionActive.current === true && isSplitSessionActive === false && isSplitWise) {
      handleFilter();
    }
    prevIsSplitSessionActive.current = isSplitSessionActive;
  }, [isSplitSessionActive, isSplitWise]);

  useEffect(() => {
    const savedFilters = getAllFiltersFromLocalStorage(FILTER_KEY);

    if (!isApiCalledRef.current && !searchParams.get('page') && !searchParams.get('limit')) {
      if (savedFilters && Object.keys(savedFilters).length > 0) {
        if (savedFilters.preset) {
          setSelectedPreset(savedFilters.preset);
        }
        if (savedFilters.startDate && savedFilters.endDate) {
          setDateRange([savedFilters.startDate, savedFilters.endDate]);
        } else if (savedFilters.billDate) {
          setDateRange([savedFilters.billDate, savedFilters.billDate]);
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
    fetchBills(controller.signal);
    return () => controller.abort();
  }, [searchParams]);

  useResetOnUnmount(resetBills);

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

  const handleEditClick = record => {
    navigate(`/bills/${record.id}/edit`, {
      state: {
        billsData: record,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleDuplicateClick = record => {
    navigate('/bills/new', {
      state: {
        duplicateFromId: record.id,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const fetchBills = signal => {
    const page = parseInt(searchParams?.get('page')) || 1;
    const pageSize = parseInt(searchParams?.get('limit')) || pagination.limit;
    const payload = getQueryParams(window.location.href) || {};

    getBills({ ...payload, page, limit: pageSize, signal });
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

  const handleViewClick = record => {
    navigate(`/bills/${record.id}`, {
      state: {
        billData: record,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleDeleteClick = record => {
    deleteModal.open(record);
  };

  const deleteBill = async () => {
    await removeBill({ billId: deleteModal.payload?.id });
    deleteModal.close();
    fetchBills();
    // if (clearSelection) {
    //   clearSelection();
    // }
  };

  const handleUpdateStatus = async (billId, status) => {
    await updateStatus({ billId, status });
    fetchBills();
  };

  const updateBillStatus = async (bill, newStatus) => {
    setOpenDropdownKey(null);
    if (newStatus === BACKEND_ENUM?.CANCELLED) {
      cancelStatusModal.open({
        bill,
        newStatus,
        label: BILL_STATUS?.[newStatus] || newStatus,
      });
      return;
    }
    await handleUpdateStatus(bill?.id || bill?._id, newStatus);
  };

  const confirmCancelStatus = async () => {
    const bill = cancelStatusModal.payload?.bill;
    const newStatus = cancelStatusModal.payload?.newStatus;
    await handleUpdateStatus(bill?.id || bill?._id, newStatus);
    cancelStatusModal.close();
  };

  const getConvertStatusValue = (status, bill) => {
    let statusArr = [];
    const billId = bill?.id || bill?._id;

    const markAs = (backendStatus, labelStatus) => ({
      key: `markAs${labelStatus}`,
      label: `Mark As ${labelStatus}`,
      onClick: () => handleUpdateStatus(billId, backendStatus),
    });
    const openItem = markAs(BACKEND_ENUM?.OPEN, BILL_STATUS?.OPEN);
    const cancelItem = {
      key: `markAs${BILL_STATUS?.CANCELLED}`,
      label: `Mark As ${BILL_STATUS?.CANCELLED}`,
      onClick: () => updateBillStatus(bill, BACKEND_ENUM?.CANCELLED),
    };

    if (status === BACKEND_ENUM?.DRAFT) {
      statusArr = [openItem, cancelItem];
    } else {
      statusArr = [cancelItem];
    }

    return statusArr;
  };

  const columns = billColumn(isSplitSessionActive);

  let columnsFromLocalStorage = getFromLocalStorage(configEnum?.BILL_CONFIG);
  let parsedColumnData = parsedTableCoulmns(columnsFromLocalStorage, columns);

  let displayColumn = parsedColumnData?.displayColumn?.filter(x => x?.visible === true);
  const [columnsList, setColumnsList] = useState(parsedColumnData?.displayColumn);
  const [customizedColumns, setCutomizedColumns] = useState([...(parsedColumnData?.customizedColumn?.length > 0 ? parsedColumnData.customizedColumn : displayColumn)]);

  const handleColumnResize = useColumnResize(setColumnsList, setCutomizedColumns, configEnum?.BILL_CONFIG);

  const getBillExports = useCallback(
    async payload => {
      const merged = { ...payload };
      if (isSplitWise && isSplitSessionActive) {
        merged.isSplit = !!filter?.isSplit;
      }
      return exportBill(merged);
    },
    [exportBill, filter?.isSplit, isSplitSessionActive, isSplitWise]
  );

  const { pdfExportLoading, handlePdfExport } = useDocumentPdfExport({
    defaultFileName: 'Bills_Export',
    entityLabel: 'bills',
    filterKeys: ['billDate', 'isSplit', 'country', 'state', 'city', 'addressType'],
    moduleType: 'bill',
  });

  useEffect(() => {
    if (isSplitSessionFirstRender.current) {
      isSplitSessionFirstRender.current = false;
      return;
    }

    setColumnsList(parsedColumnData?.displayColumn);
    setCutomizedColumns([...(parsedColumnData?.customizedColumn?.length > 0 ? parsedColumnData.customizedColumn : displayColumn)]);
  }, [isSplitSessionActive]);

  const { showColumnModal, setShowColumnModal, standardDropdownItems, toolbarModalsProps } = useDocumentListToolbar({
    moduleName: MODULE_NAMES.BILL,
    resource: RESOURCES.BILLS,
    filterKey: FILTER_KEY,
    columnConfigKey: configEnum?.BILL_CONFIG,
    configErrorMessage: 'Failed to update bill configuration',
    exportConfig: {
      exportLoading: exportLoading || pdfExportLoading,
      fetchExports: getBillExports,
      getExportColumns: billExportColumn,
      defaultFileName: 'Bills_Export',
      sheetName: 'Bills',
      entityPlural: 'Bills',
      formName: 'export-bills',
      exportLabel: 'Export Bills',
      formats: ['xlsx', 'pdf'],
      onPdfExport: handlePdfExport,
    },
    columnsConfig: {
      getDefaultColumns: () => billColumn(isSplitSessionActive),
      setColumnsList,
      setCustomizedColumns: setCutomizedColumns,
    },
    handleResetFilters,
    onRefresh: () => fetchBills(),
    setIsLocked,
  });

  const handleConfirmAutoMapOpeningBalance = async () => {
    await autoMapOpeningBalanceToBills({
      ...(isSplitWise && isSplitSessionActive ? { isSplit: !!filter?.isSplit } : {}),
    });
    setShowAutoMapModal(false);
    fetchBills();
  };

  const dropdownItems = [
    {
      type: 'group',
      label: 'TOOLS',
      children: [
        {
          key: 'autoMapOpeningBalance',
          label: 'Auto Map Opening Balance',
          icon: <Icons.SyncOutlined />,
          onClick: ({ domEvent }) => {
            domEvent.stopPropagation();
            setShowAutoMapModal(true);
          },
        },
      ],
    },

    {
      type: 'divider',
    },

    ...standardDropdownItems,
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden -m-4">
      <div className="bg-white px-4 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <PageHeader
            loading={loading}
            title={PAGE_HEADERS?.BILLS?.title}
            totalAmount={pagination?.totalAmount}
            totalRecord={pagination?.totalResults}
            totalBalance={pagination?.totalBalance}
            transactionCounts={pagination?.totalPaid}
            transactionLabel="Paid"
          />
        </div>

        <div className="flex flex-wrap justify-center md:justify-end items-center gap-2 md:gap-3 w-full md:w-auto">
          <PermissionButton
            canAccess={useModuleBills?.create}
            isViewOnly={isViewOnly}
            type="primary"
            className="w-full md:w-auto py-2 md:py-4 px-4 md:px-5"
            wrapperClassName="w-full md:w-auto inline-block"
            onClick={() =>
              navigate('/bills/new', {
                state: {
                  prevFrom: location.pathname,
                  historyStack: [...(location.state?.historyStack || []), location.pathname],
                },
              })
            }
            icon={<Icons.PlusCircleOutlined />}
            text="Add"
          />

          {useModuleBills.create && !isViewOnly && isSplitWise && isSplitSessionActive && (
            <CustomButton
              type="primary"
              className="w-full md:w-auto py-2 md:py-4 px-4 md:px-5"
              onClick={() =>
                navigate('/bills/new', {
                  state: {
                    prevFrom: location.pathname,
                    historyStack: [...(location.state?.historyStack || []), location.pathname],
                    isSplit: true,
                  },
                })
              }
              icon={<Icons.PlusCircleOutlined />}
              text="Add Split Bill"
            />
          )}
          <Tooltip title="More Actions" placement="left">
            <Dropdown menu={{ items: dropdownItems, className: 'app-toolbar-dropdown' }} trigger={['click']}>
              <CustomButton type="default" icon={<Icons.EllipsisOutlined />} />
            </Dropdown>
          </Tooltip>
        </div>
      </div>

      <div className="bg-white border-t px-4 py-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <StatusFilterTabs statuses={Object.entries(BILL_STATUS).map(([key, label]) => ({ value: key, label }))} value={filter?.status} onChange={handleStatusTab} />
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
                selectionOptions={Object?.entries(BILL_STATUS)?.map(([key, value]) => {
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

          {isSplitWise && isSplitSessionActive && (
            <FilterSection title="Options">
              <div className="flex items-center gap-x-4">
                <FilterInput type={filterInputEnum?.SWITCH} name={'isSplit'} value={filter?.isSplit} setFilter={setFilter} allowClear={true} />
                <div>Split Bills</div>
              </div>
            </FilterSection>
          )}
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
            singleDateKey: 'billDate',
          }}
          onDateClear={() => {
            setSelectedPreset('custom');
            setDateRange(null);
            updateUrlParams({ startDate: null, endDate: null, billDate: null, preset: null });
          }}
          STATUS_ENUM={BILL_STATUS}
          divDrop={divDrop}
          branchDrop={branchDrop}
          extraFilters={{
            ...getCustomerFilterTag('Vendor', vendorDropDownList),
            isSplit: {
              label: 'Split',
              format: value => value,
              clear: (setFilter, updateUrlParams) => {
                setFilter(prev => ({ ...prev, isSplit: null }));
                updateUrlParams({ isSplit: null });
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
            ...getLocationFilterTags(),
          }}
        />
      </div>
      <div>
        <CustomTable
          onColumnResize={handleColumnResize}
          columns={[...customizedColumns]}
          loading={loading}
          data={bills}
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
                <span>Bill#</span>
                <Tag className="font-semibold">{record?.billId}</Tag>
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
                const statusLabel = BILL_STATUS?.[record?.status] || record?.status || '-';
                const blockedTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : PERMISSION_MESSAGES.NO_PERMISSION;
                const deleteBlockedByOpeningBalanceCredit = (record?.openingBalanceApplications?.length ?? 0) > 0;

                const canView = useModuleBills?.view;
                const canOpenMore = useModuleBills?.edit && !isViewOnly;
                const canEdit = canOpenMore && !BILL_EDIT_RESTRICTED_STATUS?.includes(record?.status);
                const canDelete = useModuleBills?.delete && !isViewOnly;
                const canDeleteBill = canDelete && !deleteBlockedByOpeningBalanceCredit;
                const canDuplicate = useModuleBills?.create && !isViewOnly;

                const dropDownItems = [...getConvertStatusValue(record?.status, record)];
                const canMarkStatus = canOpenMore && !BILL_STATUS_CHANGE_RESTRICTED_STATUS?.includes(record?.status) && dropDownItems.length > 0;

                const viewTooltip = canView ? 'View Bill' : PERMISSION_MESSAGES.NO_PERMISSION;
                const editTooltip = canEdit
                  ? 'Edit Bill'
                  : isViewOnly
                    ? PERMISSION_MESSAGES.VIEW_ONLY
                    : !useModuleBills?.edit
                      ? PERMISSION_MESSAGES.NO_PERMISSION
                      : `This document cannot be edited in its current status - ${statusLabel}.`;
                const deleteTooltip = canDeleteBill
                  ? 'Delete Bill'
                  : isViewOnly
                    ? PERMISSION_MESSAGES.VIEW_ONLY
                    : !useModuleBills?.delete
                      ? PERMISSION_MESSAGES.NO_PERMISSION
                      : 'This bill cannot be deleted because it is linked to opening balance credit entries. Please remove all "Opening Balance — Credit" records from the Payment History before proceeding.';
                const duplicateTooltip = canDuplicate ? 'Duplicate Document' : blockedTooltip;
                const markAsTooltip = canMarkStatus
                  ? 'Mark Bill As'
                  : isViewOnly
                    ? PERMISSION_MESSAGES.VIEW_ONLY
                    : !useModuleBills?.edit
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
                      <span>
                        <Icons.DeleteOutlined
                          className={canDeleteBill ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                          style={{ fontSize: 17, color: colorPalette.error[500] }}
                          onClick={
                            canDeleteBill
                              ? () => {
                                  handleDeleteClick(record);
                                  setOpenDropdownKey(null);
                                }
                              : undefined
                          }
                        />
                      </span>
                    </Tooltip>

                    {/* DROPDOWN - Always Show */}
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

                                    if (key.includes('OPEN') || label.includes(BILL_STATUS?.OPEN)) {
                                      return {
                                        icon: <Icons.CheckCircleOutlined className={markAsDisabled ? 'text-gray-400' : 'text-green-800'} style={{ fontSize: 14 }} />,
                                        hoverClass: 'hover:bg-green-50 hover:text-green-800',
                                      };
                                    } else if (key.includes('CANCELLED') || label.includes(BILL_STATUS?.CANCELLED)) {
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
          pagination={{
            current: searchParams?.get('page') || 1,
            pageSize: searchParams?.get('limit') || pagination?.limit,
            total: pagination.totalResults,
            onChange: handlePaginationChange,
          }}
        />
      </div>
      <DocumentConfirmModal modal={deleteModal} docType={MODULE_NAMES?.BILL} onConfirm={deleteBill} loading={deleteLoading} getDocumentDetails={getBillDocumentDetails} />
      <DocumentConfirmModal
        modal={cancelStatusModal}
        docType={MODULE_NAMES?.BILL}
        loading={submitLoading}
        mode="status"
        onConfirm={confirmCancelStatus}
        getDocumentDetails={payload => getBillDocumentDetails(payload?.bill)}
      />
      {showAutoMapModal && (
        <CustomModal
          modalOpen={showAutoMapModal}
          setModalOpen={open => {
            if (!open && !autoMapOpeningBalanceLoading) setShowAutoMapModal(false);
          }}
          width={560}
          title="Auto Map Opening Balance to Bills"
        >
          <div className="text-sm text-gray-700">
            <p className="text-gray-600 mb-3">
              The system uses vendor available opening balance credit and maps it to open bills. Open bills are matched by <span className="font-medium text-gray-800">due date</span> (oldest first).
            </p>
            <div className="flex justify-end gap-2 mt-6 pt-1">
              <CustomButton
                className="px-8 py-4"
                type="default"
                text="Cancel"
                onClick={() => !autoMapOpeningBalanceLoading && setShowAutoMapModal(false)}
                style={{ minWidth: '100px', maxWidth: '100px' }}
                disabled={autoMapOpeningBalanceLoading}
              />
              <CustomButton
                className="px-8 py-4"
                type="primary"
                text="Confirm"
                onClick={handleConfirmAutoMapOpeningBalance}
                disabled={autoMapOpeningBalanceLoading}
                loading={autoMapOpeningBalanceLoading}
                style={{ minWidth: '100px', maxWidth: '100px' }}
              />
            </div>
          </div>
        </CustomModal>
      )}
      <ColumnSelection
        hideTrigger
        columns={columnsList}
        setColumnsList={setColumnsList}
        setCutomizedColumns={setCutomizedColumns}
        configPage={configEnum?.BILL_CONFIG}
        modalOpen={showColumnModal}
        setModalOpen={setShowColumnModal}
      />
      <ViewDocumentListToolbarModals {...toolbarModalsProps} />
    </div>
  );
};
export default ViewBills;
