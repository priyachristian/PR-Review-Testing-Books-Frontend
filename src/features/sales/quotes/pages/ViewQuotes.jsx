import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

// Components
import { Dropdown, Tag, Tooltip } from '@/components/AntDComponent';
import RejectionReasonModal from '../components/RejectionReasonModal';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomDatePicker from '@/components/forms/formDatePicker/CustomDatePicker';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import ColumnSelection from '@/components/ui/common/ColumnSelection';
import StatusFilterTabs from '@/components/ui/common/StatusFilterTabs';
import FilterLockButton from '@/components/ui/common/FilterLockButton';
import FilterDrawer, { FilterSection, FilterButton } from '@/components/ui/common/FilterDrawer';
import { DocumentConfirmModal } from '@/components/feedback/confirmModal/CancelOrDeleteDocumentModal';
import FilterInput from '@/components/forms/formInput/FilterInput';
import PageHeader from '@/components/ui/common/PageHeader';
import CustomButton from '@/components/ui/button/CustomButton';
import ViewDocumentListToolbarModals from '@/components/ui/common/ViewDocumentListToolbarModals';

// Hooks
import { useConvert } from 'hooks/useConvert';
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import { useConfirmModal } from '@/hooks/useConfirmModal';
import useModulePermissions from 'hooks/useModulePermissions';
import useDocumentListToolbar from '@/hooks/useDocumentListToolbar';
import useDocumentPdfExport from '@/hooks/useDocumentPdfExport';
import useColumnResize from '@/hooks/useColumnResize';
import { useQuotationConfig } from '@/features/setting/quotationConfig/useQuotationConfig';
import { useFilters } from '@/utils/filtersUtils';
import { useUser } from '@/features/setting/user/useUser';
import { useCustomer } from '@/features/sales/customer';

// Extras
import { useQuotes, quoteColumn, quoteExportColumn, getQuoteDocumentDetails } from '@/features/sales/quotes';
import { resetBranch } from '@/features/allMaster/warehouse/warehouse.slice';
import { getAllFiltersFromLocalStorage } from '@/utils/filters';
import { CommonFilterTags, getCustomerFilterTag } from '@/utils/filtersUtils';
import Icons from 'assets/icons/icon';
import { FILTERS_KEYS, RESOURCES } from '@/utils/jsonFile';
import { colorPalette } from 'utils/theme';
import {
  BACKEND_ENUM,
  configEnum,
  filterInputEnum,
  MODULE_NAMES,
  QUOTE_CONVERSION_ALLOWED_STATUSES,
  QUOTE_EDIT_RESTRICTED_STATUS,
  QUOTE_STATUS,
  QUOTE_STATUS_CHANGE_RESTRICTED_STATUS,
  PERMISSION_MESSAGES,
} from 'utils/constants';
import { getFromLocalStorage, getQueryParams, parsedTableCoulmns } from 'utils/services';
import { PAGE_HEADERS } from '@/utils/label';
import { useHasCRMAccess } from '@/hooks/useHasCRMAccess';
import CreatedFromFilter from '@/components/forms/formInput/CreatedFromFilter';
import LocationFilters, { getLocationFilterTags } from '@/components/forms/formInput/LocationFilters';
import { buildDivisionSelectOptions, buildBranchSelectOptions, divisionSelectColumnHeader, branchSelectColumnHeader } from '@/utils/tableSelectDropdown/orgSelectDropdown';
import { buildCustomerSelectOptions, customerSelectColumnHeader, customerSelectDropdownProps } from '@/utils/tableSelectDropdown/customerSelectDropdown';

const API_CALLED_ENUM = {
  DIVISION_DROPDOWN: 'divisionDropdown',
  USERS_DROPDOWN: 'usersDropdown',
  CUSTOMER_DROPDOWN: 'customerDropdown',
};

const ViewQuotes = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { quotes, pagination, loading, submitLoading, deleteLoading, exportLoading, getQuotes, getQuoteExports, removeQuote, resetQuotes, updateStatus } = useQuotes();
  const { useModuleQuotes, useModuleSalesOrder, useModuleInvoice, isViewOnly, divDrop, divisionLoading, getDivDropDown, branchDrop, branchLoading, getBranchDropDown } = useModulePermissions(
    RESOURCES.QUOTES
  );
  const { usersDropdown, usersDropdownLoading, getUsersDropdown } = useUser();
  const { customerDropDownList, loading: customerLoading, getCustomerDropList } = useCustomer();
  const { quoteCloseReasons, loading: quoteCloseReasonsLoading, getQuotationConfig, resetQuotationConfig } = useQuotationConfig();
  const [searchParams, setSearchParams] = useSearchParams();
  const deleteModal = useConfirmModal();
  const cancelStatusModal = useConfirmModal();
  const [rejectionModal, setRejectionModal] = useState({
    open: false,
    quote: null,
  });
  const [openDropdownKey, setOpenDropdownKey] = useState(null);
  const FILTER_KEY = FILTERS_KEYS.QUOTES_ALL_FILTERS;
  const isApiCalledRef = useRef(false);
  const isApicalledRefFilter = useRef({
    divisionDropdown: false,
    usersDropdown: false,
    customerDropdown: false,
  });
  const { handleConvertQuote } = useConvert();
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
      appName: searchParams.get('appName') || '',
      addedBy: searchParams.get('addedBy') ? searchParams.get('addedBy').split(',') : '',
      country: searchParams.get('country') ? searchParams.get('country').split(',') : '',
      state: searchParams.get('state') ? searchParams.get('state').split(',') : '',
      city: searchParams.get('city') ? searchParams.get('city').split(',') : '',
      addressType: searchParams.get('addressType') || '',
    },
    dateKeys: { startDate: 'startDate', endDate: 'endDate', singleDate: 'quoteDate' },
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
        } else if (savedFilters.quoteDate) {
          setDateRange([savedFilters.quoteDate, savedFilters.quoteDate]);
        }

        setFilter(prev => ({
          ...prev,
          search: savedFilters.search ?? prev.search,
          status: savedFilters.status ? savedFilters?.status?.split(',') : prev.status,
          division: savedFilters.division ? savedFilters?.division?.split(',') : prev.division,
          branch: savedFilters.branch ? savedFilters?.branch?.split(',') : prev.branch,
          customerId: savedFilters.customerId ? savedFilters?.customerId?.split(',') : prev.customerId,
          appName: savedFilters.appName ?? prev.appName,
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
    fetchQuote(controller.signal);
    return () => controller.abort();
  }, [dispatch, searchParams]);

  useResetOnUnmount(resetQuotes);

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
    navigate(`/quotes/${record.id}/edit`, {
      state: {
        quoteData: record,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleViewClick = record => {
    navigate(`/quotes/${record.id}`, {
      state: {
        quoteData: record,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleDuplicateClick = record => {
    navigate('/quotes/new', {
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

  const deleteQuote = async () => {
    await removeQuote({ quoteId: deleteModal.payload?.id });
    deleteModal.close();
    fetchQuote();
  };

  const handleUpdateStatus = async (quoteId, status) => {
    await updateStatus({ quoteId, status });
    fetchQuote();
  };

  const openRejectModal = quote => {
    setOpenDropdownKey(null);
    setRejectionModal({
      open: true,
      quote,
    });
    resetQuotationConfig();
    getQuotationConfig({});
  };

  const handleRejectQuote = async rejectionReason => {
    const quoteId = rejectionModal?.quote?.id || rejectionModal?.quote?._id;
    if (!quoteId) return;

    await updateStatus({
      quoteId,
      status: BACKEND_ENUM?.REJECTED,
      rejectionReason,
    });
    setRejectionModal({ open: false, quote: null });
    fetchQuote();
  };

  const updateQuoteStatus = async (quote, newStatus) => {
    setOpenDropdownKey(null);
    if (newStatus === BACKEND_ENUM?.CANCELLED) {
      cancelStatusModal.open({
        quote,
        newStatus,
        label: QUOTE_STATUS?.[newStatus] || newStatus,
      });
      return;
    }
    await handleUpdateStatus(quote?.id || quote?._id, newStatus);
  };

  const confirmCancelStatus = async () => {
    const quote = cancelStatusModal.payload?.quote;
    const newStatus = cancelStatusModal.payload?.newStatus;
    await handleUpdateStatus(quote?.id || quote?._id, newStatus);
    cancelStatusModal.close();
  };

  const getConvertStatusValue = (status, quote) => {
    let statusArr = [];
    const quoteId = quote?.id || quote?._id;

    const markAs = (backendStatus, labelStatus) => ({
      key: `markAs${labelStatus}`,
      label: `Mark As ${labelStatus}`,
      onClick: () => handleUpdateStatus(quoteId, backendStatus),
    });
    const draftItem = markAs(BACKEND_ENUM?.DRAFT, QUOTE_STATUS?.DRAFT);
    const sentItem = markAs(BACKEND_ENUM?.SENT, QUOTE_STATUS?.SENT);
    const cancelItem = {
      key: `markAs${QUOTE_STATUS?.CANCELLED}`,
      label: `Mark As ${QUOTE_STATUS?.CANCELLED}`,
      onClick: () => updateQuoteStatus(quote, BACKEND_ENUM?.CANCELLED),
    };

    if (status === BACKEND_ENUM?.DRAFT) {
      statusArr = [sentItem, cancelItem];
    } else if (status === BACKEND_ENUM?.SENT) {
      statusArr = [
        markAs(BACKEND_ENUM?.ACCEPTED, QUOTE_STATUS?.ACCEPTED),
        {
          key: `markAs${QUOTE_STATUS?.REJECTED}`,
          label: `Mark As ${QUOTE_STATUS?.REJECTED}`,
          onClick: () => openRejectModal(quote),
        },
        draftItem,
        cancelItem,
      ];
    } else if (status === BACKEND_ENUM?.ACCEPTED) {
      statusArr = [markAs(BACKEND_ENUM?.COMPLETED, QUOTE_STATUS?.COMPLETED), sentItem, draftItem, cancelItem];
    } else if (status === BACKEND_ENUM?.REJECTED) {
      statusArr = [draftItem, cancelItem];
    } else if (status === BACKEND_ENUM?.CANCELLED) {
      statusArr = [draftItem, sentItem];
    } else {
      statusArr = [cancelItem];
    }

    return statusArr;
  };

  const columns = quoteColumn();

  let columnsFromLocalStorage = getFromLocalStorage(configEnum?.QUOTE_CONFIG);
  let parsedColumnData = parsedTableCoulmns(columnsFromLocalStorage, columns);

  let displayColumn = parsedColumnData?.displayColumn?.filter(x => x?.visible === true);
  const [columnsList, setColumnsList] = useState(parsedColumnData?.displayColumn);
  const [customizedColumns, setCutomizedColumns] = useState([...(parsedColumnData?.customizedColumn?.length > 0 ? parsedColumnData.customizedColumn : displayColumn)]);

  const handleColumnResize = useColumnResize(setColumnsList, setCutomizedColumns, configEnum?.QUOTE_CONFIG);

  const fetchQuote = signal => {
    const page = parseInt(searchParams?.get('page')) || 1;
    const pageSize = parseInt(searchParams?.get('limit')) || pagination.limit;
    const sortBy = searchParams?.get('sortBy') || '';

    let payload = getQueryParams(window.location.href) || {};

    if (Object.keys(payload)?.length <= 0) {
      payload = { page, limit: pageSize };
    }

    if (sortBy) payload.sortBy = sortBy;

    getQuotes({ ...payload, page, limit: pageSize, signal });
  };

  const { pdfExportLoading, handlePdfExport } = useDocumentPdfExport({
    defaultFileName: 'Quotes_Export',
    entityLabel: 'quotes',
    filterKeys: ['quoteDate', 'country', 'state', 'city', 'addressType'],
    moduleType: 'quote',
  });

  const { showColumnModal, setShowColumnModal, standardDropdownItems, toolbarModalsProps } = useDocumentListToolbar({
    moduleName: MODULE_NAMES.QUOTATION,
    resource: RESOURCES.QUOTES,
    filterKey: FILTER_KEY,
    columnConfigKey: configEnum?.QUOTE_CONFIG,
    configErrorMessage: 'Failed to update quote configuration',
    exportConfig: {
      exportLoading: exportLoading || pdfExportLoading,
      fetchExports: getQuoteExports,
      getExportColumns: quoteExportColumn,
      defaultFileName: 'Quotes_Export',
      sheetName: 'Quotes',
      entityPlural: 'Quotes',
      formName: 'export-quotes',
      exportLabel: 'Export Quotes',
      formats: ['xlsx', 'pdf'],
      onPdfExport: handlePdfExport,
    },
    columnsConfig: {
      getDefaultColumns: quoteColumn,
      setColumnsList,
      setCustomizedColumns: setCutomizedColumns,
    },
    handleResetFilters,
    onRefresh: () => fetchQuote(),
    setIsLocked,
  });

  const handleStatusTab = statusArr => {
    const status = Array.isArray(statusArr) ? statusArr : statusArr ? [statusArr] : [];
    setFilter(prev => ({ ...prev, status }));
    updateUrlParams({ status, page: 1, limit: pagination?.limit });
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
      sortBy: sortParam,
    });
  };

  const dropdownItems = standardDropdownItems;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden -m-4">
      <div className="bg-white px-4 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        <PageHeader loading={loading} title={PAGE_HEADERS?.QUOTES?.title} totalAmount={pagination?.totalAmount} totalRecord={pagination?.totalResults} />

        <div className="flex flex-wrap justify-center md:justify-end gap-2 md:gap-3 w-full md:w-auto">
          <PermissionButton
            canAccess={!!useModuleQuotes?.create}
            isViewOnly={isViewOnly}
            type="primary"
            className="w-full md:w-auto "
            wrapperClassName="w-full md:w-auto inline-block"
            onClick={() =>
              navigate('/quotes/new', {
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
          <StatusFilterTabs statuses={Object.entries(QUOTE_STATUS).map(([key, label]) => ({ value: key, label }))} value={filter?.status} onChange={handleStatusTab} />
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
                selectionOptions={Object?.entries(QUOTE_STATUS)?.map(([key, value]) => {
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
            singleDateKey: 'quoteDate',
          }}
          onDateClear={() => {
            setSelectedPreset('custom');
            setDateRange(null);
            updateUrlParams({ startDate: null, endDate: null, quoteDate: null, preset: null });
          }}
          STATUS_ENUM={QUOTE_STATUS}
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
            ...createdFromExtraFilters,
            ...getLocationFilterTags(),
          }}
        />
      </div>

      <div>
        <CustomTable
          onColumnResize={handleColumnResize}
          columns={[...filterCreatedFromColumn(customizedColumns)]}
          loading={loading}
          data={quotes}
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
                <span>Quote#</span>
                <Tag className="font-semibold">{r?.quoteId}</Tag>
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
                const statusLabel = QUOTE_STATUS?.[record?.status] || record?.status || '-';
                const blockedTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : PERMISSION_MESSAGES.NO_PERMISSION;

                const canView = useModuleQuotes?.view;
                const canOpenMore = useModuleQuotes?.edit && !isViewOnly;
                const canEdit = canOpenMore && !QUOTE_EDIT_RESTRICTED_STATUS?.includes(record?.status);
                const canDelete = useModuleQuotes?.delete && !isViewOnly;
                const canDuplicate = useModuleQuotes?.create && !isViewOnly;
                const canConvertSO = useModuleSalesOrder?.create && !isViewOnly && QUOTE_CONVERSION_ALLOWED_STATUSES?.includes(record?.status);
                const canConvertINV = useModuleInvoice?.create && !isViewOnly && QUOTE_CONVERSION_ALLOWED_STATUSES?.includes(record?.status);

                const dropDownItems = [...getConvertStatusValue(record?.status, record)];
                const canMarkStatus = canOpenMore && !QUOTE_STATUS_CHANGE_RESTRICTED_STATUS?.includes(record?.status) && dropDownItems.length > 0;

                const viewTooltip = canView ? 'View Quote' : PERMISSION_MESSAGES.NO_PERMISSION;
                const editTooltip = canEdit ? 'Edit Quote' : !useModuleQuotes?.edit || isViewOnly ? blockedTooltip : `This document cannot be edited in its current status - ${statusLabel}.`;
                const deleteTooltip = canDelete ? 'Delete Quote' : blockedTooltip;
                const duplicateTooltip = canDuplicate ? 'Duplicate Document' : blockedTooltip;
                const convertSOTooltip = canConvertSO
                  ? 'Convert to Sales Order'
                  : !useModuleSalesOrder?.create || isViewOnly
                    ? blockedTooltip
                    : `Cannot convert to Sales Order its current status - ${statusLabel}.`;
                const convertINVTooltip = canConvertINV
                  ? 'Convert to Invoice'
                  : !useModuleInvoice?.create || isViewOnly
                    ? blockedTooltip
                    : `Cannot convert to Invoice its current status - ${statusLabel}.`;
                const markAsTooltip = canMarkStatus
                  ? 'Mark Quotation As'
                  : !useModuleQuotes?.edit || isViewOnly
                    ? blockedTooltip
                    : `This document status cannot be changed in its current status - ${statusLabel}.`;
                const moreTooltip = canOpenMore ? 'More Actions' : blockedTooltip;

                return (
                  <div className="flex items-center gap-3">
                    <Tooltip title={viewTooltip}>
                      <Icons.EyeOutlined
                        className={canView ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                        style={{ fontSize: 17, color: '#1E3A56' }}
                        onClick={canView ? () => handleViewClick(record) : undefined}
                      />
                    </Tooltip>

                    <Tooltip title={duplicateTooltip}>
                      <Icons.CopyOutlined
                        className={canDuplicate ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                        style={{ fontSize: 17, color: colorPalette.primary[500] }}
                        onClick={canDuplicate ? () => handleDuplicateClick(record) : undefined}
                      />
                    </Tooltip>

                    <Tooltip title={editTooltip}>
                      <Icons.EditOutlined
                        style={{ fontSize: 17, color: colorPalette.primary[500] }}
                        className={canEdit ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                        onClick={canEdit ? () => handleEditClick(record) : undefined}
                      />
                    </Tooltip>

                    <Tooltip title={deleteTooltip}>
                      <Icons.DeleteOutlined
                        className={canDelete ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                        style={{ fontSize: 17, color: colorPalette.error[500] }}
                        onClick={canDelete ? () => handleDeleteClick(record) : undefined}
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

                                    if (key.includes('ACCEPTED') || key.includes('COMPLETED') || label.includes(QUOTE_STATUS?.ACCEPTED) || label.includes(QUOTE_STATUS?.COMPLETED)) {
                                      return {
                                        icon: <Icons.CheckCircleOutlined className={markAsDisabled ? 'text-gray-400' : 'text-green-800'} style={{ fontSize: 14 }} />,
                                        hoverClass: 'hover:bg-green-50 hover:text-green-800',
                                      };
                                    } else if (key.includes('SENT') || label.includes(QUOTE_STATUS?.SENT)) {
                                      return {
                                        icon: <Icons.CheckCircleOutlined className={markAsDisabled ? 'text-gray-400' : 'text-blue-800'} style={{ fontSize: 14 }} />,
                                        hoverClass: 'hover:bg-blue-50 hover:text-blue-800',
                                      };
                                    } else if (key.includes('REJECTED') || label.includes(QUOTE_STATUS?.REJECTED)) {
                                      return {
                                        icon: <Icons.CloseCircleOutlined className={markAsDisabled ? 'text-gray-400' : 'text-red-800'} style={{ fontSize: 14 }} />,
                                        hoverClass: 'hover:bg-red-50 hover:text-red-800',
                                      };
                                    } else if (key.includes('CANCELLED') || label.includes(QUOTE_STATUS?.CANCELLED)) {
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

                            {/* Convert to Sales Order - Always Show */}
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
                                        handleConvertQuote(record, 'salesOrder');
                                      }
                                    : undefined
                                }
                                disabled={!canConvertSO || submitLoading}
                                className={`
                                  w-full px-3 py-2 text-left text-sm
                                  flex items-center gap-2
                                  transition-colors duration-150
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

                            {/* Convert to Invoice - Always Show */}
                            <Tooltip title={convertINVTooltip} placement="left">
                              <button
                                type="button"
                                onClick={
                                  canConvertINV && !submitLoading
                                    ? () => {
                                        setOpenDropdownKey(null);
                                        handleConvertQuote(record, 'invoice');
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
      <DocumentConfirmModal modal={deleteModal} docType={MODULE_NAMES?.QUOTATION} onConfirm={deleteQuote} loading={deleteLoading} getDocumentDetails={getQuoteDocumentDetails} />
      <DocumentConfirmModal
        modal={cancelStatusModal}
        docType={MODULE_NAMES?.QUOTATION}
        loading={submitLoading}
        mode="status"
        onConfirm={confirmCancelStatus}
        getDocumentDetails={payload => getQuoteDocumentDetails(payload?.quote)}
      />
      <RejectionReasonModal
        open={rejectionModal.open}
        idValue={rejectionModal?.quote?.quoteId}
        status={BACKEND_ENUM?.REJECTED}
        statusLabelMap={QUOTE_STATUS}
        idLabel="SQ No"
        onCancel={() => {
          resetQuotationConfig();
          setRejectionModal({ open: false, quote: null });
        }}
        onSubmit={handleRejectQuote}
        reasons={quoteCloseReasons}
        loading={submitLoading || quoteCloseReasonsLoading}
      />
      <ColumnSelection
        hideTrigger
        columns={filterCreatedFromColumn(columnsList)}
        setColumnsList={setColumnsList}
        setCutomizedColumns={setCutomizedColumns}
        configPage={configEnum?.QUOTE_CONFIG}
        modalOpen={showColumnModal}
        setModalOpen={setShowColumnModal}
      />
      <ViewDocumentListToolbarModals {...toolbarModalsProps} />
    </div>
  );
};

export default ViewQuotes;
