import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

// Components
import { Dropdown, Tag, Tooltip } from '@/components/AntDComponent';
import ApplyCreditModal from '../components/ApplyCreditModal';
import RefundModal from '@/components/feedback/formModal/RefundModal';
import ColumnSelection from '@/components/ui/common/ColumnSelection';
import StatusFilterTabs from '@/components/ui/common/StatusFilterTabs';
import FilterLockButton from '@/components/ui/common/FilterLockButton';
import FilterDrawer, { FilterSection, FilterButton } from '@/components/ui/common/FilterDrawer';
import CustomButton from '@/components/ui/button/CustomButton';
import ViewDocumentListToolbarModals from '@/components/ui/common/ViewDocumentListToolbarModals';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomDatePicker from '@/components/forms/formDatePicker/CustomDatePicker';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import { DocumentConfirmModal } from '@/components/feedback/confirmModal/CancelOrDeleteDocumentModal';
import FilterInput from '@/components/forms/formInput/FilterInput';
import LocationFilters, { getLocationFilterTags } from '@/components/forms/formInput/LocationFilters';
import PageHeader from '@/components/ui/common/PageHeader';

// Hooks
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import { useConfirmModal } from '@/hooks/useConfirmModal';
import useModulePermissions from 'hooks/useModulePermissions';
import { useUser } from '@/features/setting/user/useUser';
import useDocumentListToolbar from '@/hooks/useDocumentListToolbar';
import useDocumentPdfExport from '@/hooks/useDocumentPdfExport';
import { gstPdfExportFormats, useGstFeatures } from '@/features/sales/gstDocument';
import useColumnResize from '@/hooks/useColumnResize';
import { useFilters } from '@/utils/filtersUtils';
import { useCustomer } from '@/features/sales/customer';

// Extras
import { useCreditNote, creditNoteColumn, creditNoteExportColumn, getCreditNoteDocumentDetails } from '@/features/sales/creditNotes';
import { resetBranch } from '@/features/allMaster/warehouse/warehouse.slice';
import Icons from 'assets/icons/icon';
import { FILTERS_KEYS, RESOURCES } from '@/utils/jsonFile';
import { getAllFiltersFromLocalStorage } from '@/utils/filters';
import { CommonFilterTags, getCustomerFilterTag } from '@/utils/filtersUtils';
import { colorPalette } from '@/utils/theme';
import { getFromLocalStorage, getQueryParams, parsedTableCoulmns } from 'utils/services';
import {
  BACKEND_ENUM,
  configEnum,
  CREDIT_NOTE_APPLIED_STATUS,
  CREDIT_NOTE_EDIT_RESTRICTED_STATUS,
  CREDIT_NOTE_STATUS,
  CREDIT_NOTE_STATUS_CHANGE_RESTRICTED_STATUS,
  filterInputEnum,
  MODULE_NAMES,
  PERMISSION_MESSAGES,
} from 'utils/constants';
import { PAGE_HEADERS } from '@/utils/label';
import { buildDivisionSelectOptions, buildBranchSelectOptions, divisionSelectColumnHeader, branchSelectColumnHeader } from '@/utils/tableSelectDropdown/orgSelectDropdown';
import { buildCustomerSelectOptions, customerSelectColumnHeader, customerSelectDropdownProps } from '@/utils/tableSelectDropdown/customerSelectDropdown';

const API_CALLED_ENUM = {
  DIVISION_DROPDOWN: 'divisionDropdown',
  USERS_DROPDOWN: 'usersDropdown',
  CUSTOMER_DROPDOWN: 'customerDropdown',
};

const ViewCreditNotes = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { creditNotes, pagination, loading, submitLoading, deleteLoading, exportLoading, getCreditNotes, getCreditNoteExports, removeCreditNote, resetCreditNotes, updateCreditNoteStatus } =
    useCreditNote();
  const { usersDropdown, usersDropdownLoading, getUsersDropdown } = useUser();
  const { customerDropDownList, loading: customerLoading, getCustomerDropList } = useCustomer();
  const { isViewOnly, useModuleCreditNote, isSplitWise, isSplitSessionActive, divDrop, divisionLoading, getDivDropDown, branchDrop, branchLoading, getBranchDropDown } = useModulePermissions(
    RESOURCES.CREDIT_NOTES
  );
  const FILTER_KEY = FILTERS_KEYS.CREDIT_NOTES_ALL_FILTER;
  const deleteModal = useConfirmModal();
  const cancelStatusModal = useConfirmModal();
  const [searchParams, setSearchParams] = useSearchParams();
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const isApiCalledRef = useRef(false);
  const isApicalledRefFilter = useRef({
    divisionDropdown: false,
    usersDropdown: false,
    customerDropdown: false,
  });
  const [showapplyCreditModal, setShowapplyCreditModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedCreditNote, setSelectedCreditNote] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const prevIsSplitSessionActive = useRef(isSplitSessionActive);

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
      isSplit: false,
      addedBy: searchParams.get('addedBy') ? searchParams.get('addedBy').split(',') : '',
      country: searchParams.get('country') ? searchParams.get('country').split(',') : '',
      state: searchParams.get('state') ? searchParams.get('state').split(',') : '',
      city: searchParams.get('city') ? searchParams.get('city').split(',') : '',
      addressType: searchParams.get('addressType') || '',
    },
    dateKeys: { startDate: 'startDate', endDate: 'endDate', singleDate: 'creditNoteDate' },
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
        } else if (savedFilters.creditNoteDate) {
          setDateRange([savedFilters.creditNoteDate, savedFilters.creditNoteDate]);
        }

        setFilter(prev => ({
          ...prev,
          search: savedFilters.search ?? prev.search,
          status: savedFilters.status ? savedFilters?.status?.split(',') : prev.status,
          division: savedFilters.division ? savedFilters?.division?.split(',') : prev.division,
          branch: savedFilters.branch ? savedFilters?.branch?.split(',') : prev.branch,
          customerId: savedFilters.customerId ? savedFilters?.customerId?.split(',') : prev.customerId,
          isSplit: savedFilters.isSplit ?? prev.isSplit,
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
    fetchCreditNotes(controller.signal);
    return () => controller.abort();
  }, [searchParams]);

  useResetOnUnmount(resetCreditNotes);

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
    navigate(`/credit-notes/${record.id}/edit`, {
      state: {
        creditNoteData: record,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleViewClick = record => {
    navigate(`/credit-notes/${record.id}`, {
      state: {
        creditNoteData: record,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const fetchCreditNotes = signal => {
    const page = parseInt(searchParams?.get('page')) || 1;
    const pageSize = parseInt(searchParams?.get('limit')) || pagination.limit;
    const payload = getQueryParams(window.location.href) || {};

    getCreditNotes({ ...payload, page, limit: pageSize, signal });
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

  const handleApplyCredit = record => {
    setShowapplyCreditModal(true);
    setSelectedCreditNote(record);
  };

  const handleDeleteClick = record => {
    deleteModal.open(record);
  };

  const deleteCreditNote = async () => {
    await removeCreditNote({ creditNoteId: deleteModal.payload?.id });
    deleteModal.close();
    fetchCreditNotes();
    // if (clearSelection) {
    //   clearSelection();
    // }
  };

  const handleUpdateStatus = async (creditNoteId, status) => {
    await updateCreditNoteStatus({ creditNoteId, status });
    fetchCreditNotes();
  };

  const updateStatusForRecord = async (creditNote, newStatus) => {
    setOpenDropdownId(null);
    const creditNoteId = creditNote?.id || creditNote?._id;
    if (newStatus === BACKEND_ENUM?.CANCELLED) {
      cancelStatusModal.open({
        record: creditNote,
        newStatus,
        label: CREDIT_NOTE_STATUS?.[newStatus] || newStatus,
      });
      return;
    }
    await handleUpdateStatus(creditNoteId, newStatus);
  };

  const confirmCancelStatus = async () => {
    const record = cancelStatusModal.payload?.record;
    const newStatus = cancelStatusModal.payload?.newStatus;
    const creditNoteId = record?.id || record?._id;
    await handleUpdateStatus(creditNoteId, newStatus);
    cancelStatusModal.close();
  };

  const getConvertStatusValue = (status, creditNote) => {
    let statusArr = [];
    const creditNoteId = creditNote?.id || creditNote?._id;

    const markAs = (backendStatus, labelStatus) => ({
      key: `markAs${labelStatus}`,
      label: `Mark As ${labelStatus}`,
      onClick: () => handleUpdateStatus(creditNoteId, backendStatus),
    });
    const draftItem = markAs(BACKEND_ENUM?.DRAFT, CREDIT_NOTE_STATUS?.DRAFT);
    const openItem = markAs(BACKEND_ENUM?.OPEN, CREDIT_NOTE_STATUS?.OPEN);
    const closedItem = markAs(BACKEND_ENUM?.CLOSED, CREDIT_NOTE_STATUS?.CLOSED);
    const cancelItem = {
      key: `markAs${CREDIT_NOTE_STATUS?.CANCELLED}`,
      label: `Mark As ${CREDIT_NOTE_STATUS?.CANCELLED}`,
      onClick: () => updateStatusForRecord(creditNote, BACKEND_ENUM?.CANCELLED),
    };

    if (status === BACKEND_ENUM?.DRAFT) {
      statusArr = [openItem, cancelItem];
    } else if (status === BACKEND_ENUM?.OPEN) {
      statusArr = [closedItem, draftItem, cancelItem];
    } else if (status === BACKEND_ENUM?.CLOSED) {
      statusArr = [openItem, draftItem];
    } else if (status === BACKEND_ENUM?.PARTIALLY_USED) {
      statusArr = [closedItem];
    } else if (status === BACKEND_ENUM?.CANCELLED) {
      statusArr = [draftItem, openItem];
    }

    return statusArr;
  };

  const columns = creditNoteColumn();

  let columnsFromLocalStorage = getFromLocalStorage(configEnum?.CREDIT_NOTES_CONFIG);
  let parsedColumnData = parsedTableCoulmns(columnsFromLocalStorage, columns);

  let displayColumn = parsedColumnData?.displayColumn?.filter(x => x?.visible === true);
  const [columnsList, setColumnsList] = useState(parsedColumnData?.displayColumn);
  const [customizedColumns, setCutomizedColumns] = useState([...(parsedColumnData?.customizedColumn?.length > 0 ? parsedColumnData.customizedColumn : displayColumn)]);

  const handleColumnResize = useColumnResize(setColumnsList, setCutomizedColumns, configEnum?.CREDIT_NOTES_CONFIG);

  const fetchCreditNoteExports = useCallback(
    async payload => {
      const merged = { ...payload };
      if (isSplitWise && isSplitSessionActive) {
        merged.isSplit = !!filter?.isSplit;
      }
      return getCreditNoteExports(merged);
    },
    [filter?.isSplit, getCreditNoteExports, isSplitSessionActive, isSplitWise]
  );

  const { isEInvoicingAvailable, isEWayBillAvailable } = useGstFeatures();

  const { pdfExportLoading, handlePdfExport } = useDocumentPdfExport({
    defaultFileName: 'Credit_Notes_Export',
    filterKeys: ['creditNoteDate', 'isSplit', 'country', 'state', 'city', 'addressType'],
    moduleType: 'creditNote',
  });

  const { showColumnModal, setShowColumnModal, standardDropdownItems, toolbarModalsProps } = useDocumentListToolbar({
    moduleName: MODULE_NAMES.CREDIT_NOTE,
    resource: RESOURCES.CREDIT_NOTES,
    filterKey: FILTER_KEY,
    columnConfigKey: configEnum?.CREDIT_NOTES_CONFIG,
    configErrorMessage: 'Failed to update credit note configuration',
    exportConfig: {
      exportLoading: exportLoading || pdfExportLoading,
      fetchExports: fetchCreditNoteExports,
      getExportColumns: creditNoteExportColumn,
      defaultFileName: 'Credit_Notes_Export',
      sheetName: 'Credit Notes',
      entityPlural: 'Credit Notes',
      formName: 'export-credit-notes',
      exportLabel: 'Export Credit Notes',
      formats: gstPdfExportFormats({ allowEInvoice: true, isEInvoicingAvailable, isEWayBillAvailable }),
      onPdfExport: handlePdfExport,
    },
    columnsConfig: {
      getDefaultColumns: creditNoteColumn,
      setColumnsList,
      setCustomizedColumns: setCutomizedColumns,
    },
    handleResetFilters,
    onRefresh: () => fetchCreditNotes(),
    setIsLocked,
  });

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden -m-4">
      <div className="bg-white px-4 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        <PageHeader
          loading={loading}
          title={PAGE_HEADERS?.CREDIT_NOTES?.title}
          totalAmount={pagination?.totalAmount}
          availableCredit={pagination?.availableCreditAmount}
          totalRecord={pagination?.totalResults}
        />

        <div className="flex flex-wrap justify-center md:justify-end items-center gap-2 md:gap-3 w-full md:w-auto">
          <PermissionButton
            canAccess={!!useModuleCreditNote?.create}
            isViewOnly={isViewOnly}
            type="primary"
            className="w-full md:w-auto py-2 md:py-4 px-4 md:px-5"
            wrapperClassName="w-full md:w-auto inline-block"
            onClick={() =>
              navigate('/credit-notes/new', {
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
            <Dropdown menu={{ items: standardDropdownItems, className: 'app-toolbar-dropdown' }} trigger={['click']}>
              <CustomButton type="default" icon={<Icons.EllipsisOutlined />} />
            </Dropdown>
          </Tooltip>
        </div>
      </div>

      <div className="bg-white border-t px-4 py-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <StatusFilterTabs statuses={Object.entries(CREDIT_NOTE_STATUS).map(([key, label]) => ({ value: key, label }))} value={filter?.status} onChange={handleStatusTab} />
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
                selectionOptions={Object?.entries(CREDIT_NOTE_STATUS)?.map(([key, value]) => {
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

          {isSplitWise && isSplitSessionActive && (
            <FilterSection title="Options">
              <div className="flex items-center gap-x-4">
                <FilterInput type={filterInputEnum?.SWITCH} name={'isSplit'} value={filter?.isSplit} setFilter={setFilter} allowClear={true} />
                <div>Split Credit Note</div>
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
            singleDateKey: 'creditNoteDate',
          }}
          onDateClear={() => {
            setSelectedPreset('custom');
            setDateRange(null);
            updateUrlParams({ startDate: null, endDate: null, creditNoteDate: null, preset: null });
          }}
          STATUS_ENUM={CREDIT_NOTE_STATUS}
          divDrop={divDrop}
          branchDrop={branchDrop}
          extraFilters={{
            ...getCustomerFilterTag('Customer', customerDropDownList),
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
          data={creditNotes}
          onRowClick={handleViewClick}
          onChange={handleTableChange}
          enableRowSelection
          selectionType="radio"
          tableId="id"
          renderSelectionLabel={(keys, rows) => {
            const record = rows?.[0];
            if (!record) return `${keys.length} selected`;
            return (
              <span className="flex items-center gap-2">
                <span>Credit Note#</span>
                <Tag className="font-semibold">{record?.creditNoteId}</Tag>
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
                const statusLabel = CREDIT_NOTE_STATUS?.[record?.status] || record?.status || '-';
                const blockedTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : PERMISSION_MESSAGES.NO_PERMISSION;

                const canView = useModuleCreditNote?.view;
                const canOpenMore = useModuleCreditNote?.edit && !isViewOnly;
                const canEdit = canOpenMore && !CREDIT_NOTE_EDIT_RESTRICTED_STATUS?.includes(record?.status);
                const canApply = canOpenMore && CREDIT_NOTE_APPLIED_STATUS?.includes(record?.status);
                const canRefund = canApply && record?.availableBalance > 0;
                const canDelete = useModuleCreditNote?.delete && !isViewOnly && record?.isDeletable;

                const dropDownItems = [...getConvertStatusValue(record?.status, record)];
                const canMarkStatus = canOpenMore && !CREDIT_NOTE_STATUS_CHANGE_RESTRICTED_STATUS?.includes(record?.status) && dropDownItems.length > 0;

                const viewTooltip = canView ? 'View Credit Note' : PERMISSION_MESSAGES.NO_PERMISSION;
                const editTooltip = canEdit
                  ? 'Edit Credit Note'
                  : isViewOnly
                    ? PERMISSION_MESSAGES.VIEW_ONLY
                    : !useModuleCreditNote?.edit
                      ? PERMISSION_MESSAGES.NO_PERMISSION
                      : `This document cannot be edited in its current status - ${statusLabel}.`;
                const deleteTooltip = canDelete
                  ? 'Delete Credit Note'
                  : isViewOnly
                    ? PERMISSION_MESSAGES.VIEW_ONLY
                    : !useModuleCreditNote?.delete
                      ? PERMISSION_MESSAGES.NO_PERMISSION
                      : `Cannot delete credit note in its current status - ${statusLabel}.`;
                const applyTooltip = canApply
                  ? 'Apply to Invoice'
                  : isViewOnly
                    ? PERMISSION_MESSAGES.VIEW_ONLY
                    : !useModuleCreditNote?.edit
                      ? PERMISSION_MESSAGES.NO_PERMISSION
                      : `Cannot apply credit note in its current status - ${statusLabel}.`;
                const refundTooltip = canRefund
                  ? 'Process Refund'
                  : isViewOnly
                    ? PERMISSION_MESSAGES.VIEW_ONLY
                    : !useModuleCreditNote?.edit
                      ? PERMISSION_MESSAGES.NO_PERMISSION
                      : record?.availableBalance <= 0
                        ? 'No available balance to refund.'
                        : `Cannot process refund in current status - ${statusLabel}.`;
                const markAsTooltip = canMarkStatus
                  ? 'Mark Credit Note As'
                  : isViewOnly
                    ? PERMISSION_MESSAGES.VIEW_ONLY
                    : !useModuleCreditNote?.edit
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
                                setOpenDropdownId(null);
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
                                setOpenDropdownId(null);
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
                                setOpenDropdownId(null);
                              }
                            : undefined
                        }
                      />
                    </Tooltip>

                    <Dropdown
                      placement="bottomRight"
                      trigger={['click']}
                      disabled={!canOpenMore}
                      open={canOpenMore && openDropdownId === record?.id}
                      onOpenChange={flag => {
                        if (!canOpenMore) return;
                        setOpenDropdownId(flag ? record?.id : null);
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

                                    if (key.includes('OPEN') || label.includes(CREDIT_NOTE_STATUS?.OPEN)) {
                                      return {
                                        icon: <Icons.CheckCircleOutlined className={markAsDisabled ? 'text-gray-400' : 'text-green-800'} style={{ fontSize: 14 }} />,
                                        hoverClass: 'hover:bg-green-50 hover:text-green-800',
                                      };
                                    } else if (key.includes('CLOSED') || label.includes(CREDIT_NOTE_STATUS?.CLOSED)) {
                                      return {
                                        icon: <Icons.CheckCircleOutlined className={markAsDisabled ? 'text-gray-400' : 'text-blue-800'} style={{ fontSize: 14 }} />,
                                        hoverClass: 'hover:bg-blue-50 hover:text-blue-800',
                                      };
                                    } else if (key.includes('CANCELLED') || label.includes(CREDIT_NOTE_STATUS?.CANCELLED)) {
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
                                                setOpenDropdownId(null);
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
                                          ${index === dropDownItems.length - 1 && !canApply ? 'rounded-b' : ''}
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

                            {/* Apply to Invoice - Always Show */}
                            <div className="px-2 py-1">
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">Apply :</div>
                            </div>
                            <Tooltip title={applyTooltip} placement="left">
                              <button
                                type="button"
                                onClick={
                                  canApply && !submitLoading
                                    ? () => {
                                        handleApplyCredit(record);
                                        setOpenDropdownId(null);
                                      }
                                    : undefined
                                }
                                disabled={!canApply || submitLoading}
                                className={`
                                  w-full px-3 py-2 text-left text-sm
                                  flex items-center gap-2
                                  transition-colors duration-150
                                  ${!canApply || submitLoading ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-gray-700 hover:bg-purple-50 hover:text-purple-600 cursor-pointer'}
                                `}
                              >
                                {submitLoading ? (
                                  <span className="flex items-center gap-2">
                                    <CustomLoader variant="button" text="Applying..." />
                                  </span>
                                ) : (
                                  <>
                                    <Icons.FileSyncOutlined className={!canApply || submitLoading ? 'text-gray-400' : 'text-purple-500'} style={{ fontSize: 16 }} />
                                    <span> to Invoice</span>
                                  </>
                                )}
                              </button>
                            </Tooltip>

                            {/* Refund */}
                            <div className="px-2 py-1 border-t border-gray-200 my-1">
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">Refund :</div>
                            </div>
                            <Tooltip title={refundTooltip} placement="left">
                              <button
                                type="button"
                                onClick={
                                  canRefund && !submitLoading
                                    ? () => {
                                        setShowRefundModal(true);
                                        setSelectedCreditNote(record);
                                        setOpenDropdownId(null);
                                      }
                                    : undefined
                                }
                                disabled={!canRefund || submitLoading}
                                className={`
                                  w-full px-3 py-2 text-left text-sm
                                  flex items-center gap-2
                                  transition-colors duration-150 rounded-b
                                  ${!canRefund || submitLoading ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 cursor-pointer'}
                                `}
                              >
                                {submitLoading ? (
                                  <span className="flex items-center gap-2">
                                    <CustomLoader variant="button" text="Processing..." />
                                  </span>
                                ) : (
                                  <>
                                    <Icons.DollarOutlined className={!canRefund || submitLoading ? 'text-gray-400' : 'text-emerald-600'} style={{ fontSize: 16 }} />
                                    <span>Refund</span>
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
      <ApplyCreditModal onClose={() => setShowapplyCreditModal(false)} modalOpen={showapplyCreditModal} creditNoteDetails={selectedCreditNote} fetchCreditNotes={fetchCreditNotes} />
      <RefundModal variant="credit" modalOpen={showRefundModal} onClose={() => setShowRefundModal(false)} documentDetails={selectedCreditNote} fetchAfterRefund={fetchCreditNotes} />
      <DocumentConfirmModal modal={deleteModal} docType={MODULE_NAMES?.CREDIT_NOTE} onConfirm={deleteCreditNote} loading={deleteLoading} getDocumentDetails={getCreditNoteDocumentDetails} />
      <DocumentConfirmModal
        modal={cancelStatusModal}
        docType={MODULE_NAMES?.CREDIT_NOTE}
        loading={submitLoading}
        mode="status"
        onConfirm={confirmCancelStatus}
        getDocumentDetails={payload => getCreditNoteDocumentDetails(payload?.record)}
      />
      <ColumnSelection
        hideTrigger
        columns={columnsList}
        setColumnsList={setColumnsList}
        setCutomizedColumns={setCutomizedColumns}
        configPage={configEnum?.CREDIT_NOTES_CONFIG}
        modalOpen={showColumnModal}
        setModalOpen={setShowColumnModal}
      />
      <ViewDocumentListToolbarModals {...toolbarModalsProps} />
    </div>
  );
};

export default ViewCreditNotes;
