import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';

// Components
import { Alert, Button, DatePicker, Dropdown, Input, Tag, Tooltip } from '@/components/AntDComponent';
import ApplyToInvoiceModal from '../components/ApplyToInvoiceModal';
import RefundPaymentModal from '@/components/feedback/formModal/RefundPaymentModal';
import AttachMentDetails from '@/components/feedback/formModal/AttachMentDetails';
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
import CustomModal from '@/components/feedback/formModal/CustomModal';
import Toast from '@/components/ui/common/Toast';
import ViewDocumentListToolbarModals from '@/components/ui/common/ViewDocumentListToolbarModals';

// Hooks
import { useBank } from '@/features/banking/banks/useBank';
import { useUser } from '@/features/setting/user/useUser';
import { useCustomer } from '@/features/sales/customer';
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import { useConfirmModal } from '@/hooks/useConfirmModal';
import useModulePermissions from 'hooks/useModulePermissions';
import { useProfile } from '@/features/setting/profile/useProfile';
import useDocumentListToolbar from '@/hooks/useDocumentListToolbar';
import useDocumentPdfExport from '@/hooks/useDocumentPdfExport';
import useColumnResize from '@/hooks/useColumnResize';
import { useFilters, CommonFilterTags, getCustomerFilterTag } from '@/utils/filtersUtils';
// Extras
import { usePaymentReceived, paymentReceivedColumn, paymentReceivedExportColumn, clearPaymentInvoiceDrop, getPaymentReceivedDocumentDetails } from '@/features/sales/paymentsReceived';
import { resetBranch } from '@/features/allMaster/warehouse/warehouse.slice';
import { getAllFiltersFromLocalStorage } from '@/utils/filters';
import { colorPalette } from '@/utils/theme';
import Icons from 'assets/icons/icon';
import { FILTERS_KEYS, RESOURCES } from '@/utils/jsonFile';
import {
  ADDITIONAL_FEATURES,
  CHEQUE_STATUS,
  configEnum,
  filterInputEnum,
  MODULE_NAMES,
  PAYMENT_MODE_OPTIONS,
  PAYMENT_RECEIVED_STATUS,
  PAYMENT_MODES,
  BANK_TYPES,
  PERMISSION_MESSAGES,
} from 'utils/constants';
import { getFromLocalStorage, getQueryParams, parsedTableCoulmns } from 'utils/services';
import { formatAmount } from '@/utils/currency';
import { PAGE_HEADERS } from '@/utils/label';
import { useHasCRMAccess } from '@/hooks/useHasCRMAccess';
import CreatedFromFilter from '@/components/forms/formInput/CreatedFromFilter';
import LocationFilters, { getLocationFilterTags } from '@/components/forms/formInput/LocationFilters';
import { PAYMENT_RECEIVED_STATUS_OPTIONS } from '@/utils/dropdownEnums';
import { buildDivisionSelectOptions, buildBranchSelectOptions, divisionSelectColumnHeader, branchSelectColumnHeader } from '@/utils/tableSelectDropdown/orgSelectDropdown';
import { buildCustomerSelectOptions, customerSelectColumnHeader, customerSelectDropdownProps } from '@/utils/tableSelectDropdown/customerSelectDropdown';

const { TextArea } = Input;

const API_CALLED_ENUM = {
  DIVISION_DROPDOWN: 'divisionDropdown',
  BANK_DROPDOWN: 'bankDropdown',
  USERS_DROPDOWN: 'usersDropdown',
  CUSTOMER_DROPDOWN: 'customerDropdown',
};

const AUTO_APPLY_WARNING_TITLES = ['Advance Payment Available', 'Advance Payment Not Available', 'No Invoice or Advance Payment'];

const getAutoApplyErrorMessage = error => {
  if (typeof error === 'string') {
    return error;
  }
  return error?.message || 'Failed to auto adjust advance payments.';
};

const getAutoApplyWarningParts = errorMessage => {
  if (!errorMessage || typeof errorMessage !== 'string') {
    return {
      message: 'Auto Pay cannot be processed',
      description: 'Failed to auto adjust advance payments.',
    };
  }

  const title = AUTO_APPLY_WARNING_TITLES.find(prefix => errorMessage.startsWith(prefix));
  if (title) {
    const description = errorMessage.slice(title.length).replace(/^:\s*/, '');
    return { message: title, description: description || errorMessage };
  }

  if (errorMessage.includes('No pending invoices are available')) {
    return {
      message: 'No Pending Invoices',
      description: errorMessage,
    };
  }

  return {
    message: 'Auto Pay cannot be processed',
    description: errorMessage,
  };
};

const getAutoApplySummaryCounts = (result = {}) => {
  const failures = result?.failures || [];
  const failedPayments = Number(result?.failedMappings || failures.length || 0);

  const noInvoiceAvailable = failures.filter(item => {
    const message = String(item?.message || '').toLowerCase();
    const hasInvoice = Boolean(item?.invoiceNo && String(item.invoiceNo).trim() && item.invoiceNo !== '-');
    return !hasInvoice || message.includes('no invoice is available') || message.includes('no pending invoices');
  }).length;

  return {
    failedPayments,
    noInvoiceAvailable,
    invoiceAutoApplyFailed: Math.max(failedPayments - noInvoiceAvailable, 0),
  };
};

const getAutoApplyShortSummary = (result = {}) => {
  const { failedPayments, noInvoiceAvailable, invoiceAutoApplyFailed } = getAutoApplySummaryCounts(result);
  if (!failedPayments) {
    return 'Some payments could not be adjusted automatically.';
  }

  const parts = [];
  if (noInvoiceAvailable > 0) {
    parts.push(`${noInvoiceAvailable} have no invoice available`);
  }
  if (invoiceAutoApplyFailed > 0) {
    parts.push(`${invoiceAutoApplyFailed} could not be applied to invoice`);
  }

  const paymentLabel = failedPayments === 1 ? 'payment' : 'payments';
  if (!parts.length) {
    return `${failedPayments} ${paymentLabel} could not be adjusted automatically.`;
  }

  return `${failedPayments} ${paymentLabel} could not be adjusted automatically. ${parts.join('. ')}.`;
};

const ViewPaymentReceived = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const {
    paymentsReceived,
    pagination,
    loading,
    submitLoading,
    deleteLoading,
    approveLoading,
    rejectLoading,
    cancelLoading,
    getPaymentsRecived,
    approvePaymentsRecived,
    rejectPaymentsRecived,
    cancelPaymentsRecived,
    removePaymentsRecived,
    resetPaymentsReceived,
    autoApplyPendingAdvancePayments,
    autoApplyLoading,
    getPaymentsExports,
    exportLoading,
  } = usePaymentReceived();
  const { bankDropdown, droploading: bankDropLoading, getBankDropDown } = useBank();
  const { usersDropdown, usersDropdownLoading, getUsersDropdown, accessRoles } = useUser();
  const { useModulePaymentReceived, useModuleCustomerPayment, isViewOnly, isSplitWise, isSplitSessionActive, divDrop, divisionLoading, getDivDropDown, branchDrop, branchLoading, getBranchDropDown } =
    useModulePermissions(RESOURCES.PAYMENT_RECEIVED);
  const { activeFeatures } = useProfile();
  const isCustomerOrderAppAvailable = !!activeFeatures?.[ADDITIONAL_FEATURES?.CUSTOMER_ORDER];
  const { customerDropDownList, loading: customerLoading, getCustomerDropList } = useCustomer();
  const FILTER_KEY = FILTERS_KEYS.PAYMENTS_RECEIVED_ALL_FILTER;
  const deleteModal = useConfirmModal();
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilter, setShowFilter] = useState(false);
  const isApicalledRefFilter = useRef({
    divisionDropdown: false,
    bankDropdown: false,
    usersDropdown: false,
    customerDropdown: false,
  });
  // const [clearSelection, setClearSelection] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
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
      bank: searchParams.get('bank') || '',
      paymentMode: searchParams.get('paymentMode') ? searchParams.get('paymentMode').split(',') : '',
      isSplit: false,
      isPendingMapping: searchParams.get('isPendingMapping') || false,
      appName: searchParams.get('appName') || '',
      addedBy: searchParams.get('addedBy') ? searchParams.get('addedBy').split(',') : '',
      country: searchParams.get('country') ? searchParams.get('country').split(',') : '',
      state: searchParams.get('state') ? searchParams.get('state').split(',') : '',
      city: searchParams.get('city') ? searchParams.get('city').split(',') : '',
    },
    dateKeys: { startDate: 'startDate', endDate: 'endDate', singleDate: 'paymentDate' },
    isSplitSessionActive,
    isSplitWise,
  });

  const { hasCRMAccess, filterCreatedFromColumn, createdFromExtraFilters } = useHasCRMAccess({
    pagination,
    filter,
    setFilter,
    updateUrlParams,
    searchParams,
    setShowFilter,
  });

  const [approvalModal, setApprovalModal] = useState({
    visible: false,
    paymentId: null,
    approvalNote: '',
    depositDate: selectedRecord?.depositDate ? dayjs(selectedRecord?.depositDate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
    clearingDate: selectedRecord?.clearingDate ? dayjs(selectedRecord?.clearingDate).format('YYYY-MM-DD') : null,
    chequeReceivedDate: selectedRecord?.chequeReceivedDate ? dayjs(selectedRecord?.chequeReceivedDate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
    chequeApprovalNote: '',
  });

  const [cancelModal, setCancelModal] = useState({
    visible: false,
    paymentId: null,
    note: '',
  });
  const [showApplyToInvoiceModal, setShowApplytoInvoiceModal] = useState(false);
  const [showRefundPaymentReceivedModal, setShowRefundPaymentReceivedModal] = useState(false);
  const [showAutoApplyModal, setShowAutoApplyModal] = useState(false);
  const [showAutoApplyResultModal, setShowAutoApplyResultModal] = useState(false);
  const [autoApplyResult, setAutoApplyResult] = useState(null);
  const [autoApplyFilter, setAutoApplyFilter] = useState({ customerId: '' });
  const [autoApplyWarning, setAutoApplyWarning] = useState(null);
  const prevIsSplitSessionActive = useRef(isSplitSessionActive);
  const isApiCalledRef = useRef(false);

  useEffect(() => {
    dispatch(clearPaymentInvoiceDrop());
  }, [dispatch]);

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
        } else if (savedFilters.paymentDate) {
          setDateRange([savedFilters.paymentDate, savedFilters.paymentDate]);
        }

        setFilter(prev => ({
          ...prev,
          search: savedFilters.search ?? prev.search,
          status: savedFilters.status ? savedFilters?.status?.split(',') : prev.status,
          bank: savedFilters.bank ?? prev.bank,
          paymentMode: savedFilters.paymentMode ? savedFilters.paymentMode.split(',') : prev.paymentMode,
          division: savedFilters.division ? savedFilters?.division?.split(',') : prev.division,
          branch: savedFilters.branch ? savedFilters?.branch?.split(',') : prev.branch,
          customerId: savedFilters.customerId ? savedFilters?.customerId?.split(',') : prev.customerId,
          isSplit: savedFilters.isSplit ?? prev.isSplit,
          appName: savedFilters.appName ?? prev.appName,
          addedBy: savedFilters.addedBy ? savedFilters.addedBy.split(',') : prev.addedBy,
          country: savedFilters.country ? savedFilters.country.split(',') : prev.country,
          state: savedFilters.state ? savedFilters.state.split(',') : prev.state,
          city: savedFilters.city ? savedFilters.city.split(',') : prev.city,
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
    fetchPaymentReceived(controller.signal);
    return () => controller.abort();
  }, [dispatch, searchParams]);

  useResetOnUnmount(resetPaymentsReceived);

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

    if (type === API_CALLED_ENUM.BANK_DROPDOWN) {
      await getBankDropDown({ accountType: 'Bank, Petty Cash' });
      obj.bankDropdown = true;
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

  useEffect(() => {
    if (searchParams.get('bank')) {
      handleOnFocusApiCall(API_CALLED_ENUM.BANK_DROPDOWN);
    }
  }, [filter?.bank]);

  const handleEditClick = record => {
    navigate(`/payments-received/${record.id}/edit`, {
      state: {
        paymentReceivedData: record,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleViewClick = record => {
    navigate(`/payments-received/${record.id}`, {
      state: {
        paymentReceivedData: record,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleRowClick = record => {
    navigate(`/payments-received/${record.id}`, {
      state: {
        paymentReceivedData: record,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleDeleteClick = record => {
    deleteModal.open(record);
  };

  const deletePaymentReceived = async () => {
    await removePaymentsRecived({ paymentId: deleteModal.payload?.id });
    deleteModal.close();
    fetchPaymentReceived();
    // if (clearSelection) {
    //   clearSelection();
    // }
  };

  const fetchPaymentReceived = signal => {
    const page = parseInt(searchParams?.get('page')) || 1;
    const pageSize = parseInt(searchParams?.get('limit')) || pagination.limit;
    const sortBy = searchParams?.get('sortBy') || '';
    let payload = getQueryParams(window.location.href) || {};

    if (Object.keys(payload)?.length <= 0) {
      payload = { page, limit: pageSize };
    }

    if (sortBy) payload.sortBy = sortBy;

    getPaymentsRecived({ ...payload, page, limit: pageSize, signal });
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

  const handleApprovePayment = async () => {
    const isReceiveChequeApproval =
      selectedRecord?.paymentMode?.toLowerCase() === PAYMENT_MODES.CHEQUE?.toLowerCase() && selectedRecord?.chequeStatus?.toLowerCase() === CHEQUE_STATUS.PENDING?.toLowerCase();

    try {
      await approvePaymentsRecived({
        paymentId: approvalModal.paymentId,
        notes: {
          approvalNote: approvalModal.approvalNote,
          depositDate: isReceiveChequeApproval ? null : approvalModal.depositDate,
          clearingDate: approvalModal.clearingDate,
          chequeReceivedDate: approvalModal.chequeReceivedDate,
          ...(selectedRecord?.paymentMode?.toLowerCase() === PAYMENT_MODES.CHEQUE?.toLowerCase() && {
            chequeApprovalNote: approvalModal.chequeApprovalNote,
          }),
        },
      });
      setApprovalModal({
        visible: false,
        paymentId: null,
        approvalNote: '',
        depositDate: dayjs().format('YYYY-MM-DD'),
        clearingDate: dayjs().format('YYYY-MM-DD'),
        chequeReceivedDate: dayjs().format('YYYY-MM-DD'),
        chequeApprovalNote: '',
      });
      fetchPaymentReceived();

      // if (clearSelection) {
      //   clearSelection();
      // }
    } catch (error) {
      console.log('handleApprovePayment Error::', error);
    }
  };

  const handleRejectPayment = async () => {
    try {
      await rejectPaymentsRecived({
        paymentId: approvalModal.paymentId,
        notes: {
          approvalNote: approvalModal.approvalNote,
          chequeReceivedDate: approvalModal.chequeReceivedDate,
          ...(selectedRecord?.paymentMode?.toLowerCase() === PAYMENT_MODES.CHEQUE?.toLowerCase() && {
            chequeApprovalNote: approvalModal.chequeApprovalNote,
          }),
        },
      });
      setApprovalModal({
        visible: false,
        paymentId: null,
        approvalNote: '',
        depositDate: dayjs().format('YYYY-MM-DD'),
        clearingDate: dayjs().format('YYYY-MM-DD'),
        chequeReceivedDate: dayjs().format('YYYY-MM-DD'),
        chequeApprovalNote: '',
      });
      fetchPaymentReceived();
      // if (clearSelection) {
      //   clearSelection();
      // }
    } catch (error) {
      console.log('handleRejectPayment Error::', error);
    }
  };

  const handleCancelReceived = async () => {
    try {
      await cancelPaymentsRecived({
        paymentId: cancelModal.paymentId,
        notes: { notes: cancelModal.note },
      });
      setCancelModal({ visible: false, paymentId: null, note: '' });
      fetchPaymentReceived();
      // if (clearSelection) {
      //   clearSelection();
      // }
    } catch (error) {
      console.log('handleCancelReceived Error::', error);
    }
  };

  const handleApprovedModalClick = record => {
    const isReceiveChequeApproval = record?.paymentMode?.toLowerCase() === PAYMENT_MODES.CHEQUE?.toLowerCase() && record?.chequeStatus?.toLowerCase() === CHEQUE_STATUS.PENDING.toLowerCase();
    const isDepositCheque = record?.paymentMode?.toLowerCase() === PAYMENT_MODES.CHEQUE?.toLowerCase() && record?.chequeStatus?.toLowerCase() === CHEQUE_STATUS.RECEIVED.toLowerCase();

    setSelectedRecord(record);
    setApprovalModal({
      visible: true,
      paymentId: record?.id || record?._id,
      approvalNote: record?.approvalNote || '',
      chequeReceivedDate: record?.chequeReceivedDate ? dayjs(record.chequeReceivedDate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
      depositDate: isReceiveChequeApproval ? null : record?.depositDate ? dayjs(record.depositDate).format('YYYY-MM-DD') : isDepositCheque ? dayjs().format('YYYY-MM-DD') : null,
      clearingDate: record?.clearingDate ? dayjs(record.clearingDate).format('YYYY-MM-DD') : null,
      chequeApprovalNote: record?.chequeApprovalNote || '',
    });
  };

  const handleCancelModalClick = id => {
    setCancelModal({
      visible: true,
      paymentId: id,
      note: '',
    });
  };

  const columns = paymentReceivedColumn();

  let columnsFromLocalStorage = getFromLocalStorage(configEnum?.PAYMENT_RECEIVED_CONFIG);
  let parsedColumnData = parsedTableCoulmns(columnsFromLocalStorage, columns);

  let displayColumn = parsedColumnData?.displayColumn?.filter(x => x?.visible === true);
  const [columnsList, setColumnsList] = useState(parsedColumnData?.displayColumn);
  const [customizedColumns, setCutomizedColumns] = useState([...(parsedColumnData?.customizedColumn?.length > 0 ? parsedColumnData.customizedColumn : displayColumn)]);

  const handleColumnResize = useColumnResize(setColumnsList, setCutomizedColumns, configEnum?.PAYMENT_RECEIVED_CONFIG);

  const fetchPaymentReceivedExports = useCallback(
    async payload => {
      const merged = { ...payload };
      if (isSplitWise && isSplitSessionActive) {
        merged.isSplit = !!filter?.isSplit;
      }
      return getPaymentsExports(merged);
    },
    [filter?.isSplit, getPaymentsExports, isSplitSessionActive, isSplitWise]
  );

  const { pdfExportLoading, handlePdfExport } = useDocumentPdfExport({
    defaultFileName: 'Payments_Received_Export',
    entityLabel: 'payments',
    filterKeys: ['paymentDate', 'bank', 'paymentMode', 'isSplit', 'isPendingMapping', 'country', 'state', 'city'],
    moduleType: 'paymentReceived',
  });

  const { showColumnModal, setShowColumnModal, standardDropdownItems, toolbarModalsProps } = useDocumentListToolbar({
    filterKey: FILTER_KEY,
    columnConfigKey: configEnum?.PAYMENT_RECEIVED_CONFIG,
    showPreferences: false,
    exportConfig: {
      exportLoading: exportLoading || pdfExportLoading,
      fetchExports: fetchPaymentReceivedExports,
      getExportColumns: () => paymentReceivedExportColumn(filterCreatedFromColumn(customizedColumns)),
      defaultFileName: 'Payments_Received_Export',
      sheetName: 'Payments Received',
      entityPlural: 'Payments Received',
      formName: 'export-payments-received',
      exportLabel: 'Export Payments Received',
      formats: ['xlsx', 'pdf'],
      onPdfExport: handlePdfExport,
    },
    columnsConfig: {
      getDefaultColumns: paymentReceivedColumn,
      setColumnsList,
      setCustomizedColumns: setCutomizedColumns,
    },
    handleResetFilters,
    onRefresh: () => fetchPaymentReceived(),
    setIsLocked,
  });

  const handleApplyToInvoice = record => {
    setShowApplytoInvoiceModal(true);
    setSelectedRecord(record);
  };

  const handleRefundPaymentReceived = record => {
    setShowRefundPaymentReceivedModal(true);
    setSelectedRecord(record);
  };

  const handlePendingMappingClick = () => {
    const updatedFilter = { ...filter, isPendingMapping: true };
    setFilter(updatedFilter);
    updateUrlParams({ isPendingMapping: true, page: 1 });
  };

  const resetAutoApplyModalState = () => {
    setAutoApplyFilter({ customerId: '' });
    setAutoApplyWarning(null);
  };

  const handleAutoApplyFilter = updater => {
    setAutoApplyFilter(prev => (typeof updater === 'function' ? updater(prev) : updater));
    setAutoApplyWarning(null);
  };

  const handleOpenAutoApplyModal = () => {
    resetAutoApplyModalState();
    setShowAutoApplyModal(true);
  };

  const handleCloseAutoApplyModal = () => {
    if (autoApplyLoading) {
      return;
    }
    setShowAutoApplyModal(false);
    resetAutoApplyModalState();
  };

  const handleConfirmAutoApplyPaymentReceived = async () => {
    const customerId = Array.isArray(autoApplyFilter?.customerId) ? autoApplyFilter.customerId.filter(Boolean)[0] : autoApplyFilter?.customerId;

    try {
      setAutoApplyWarning(null);
      const response = await autoApplyPendingAdvancePayments(customerId ? { customerId } : {});
      const result = response?.data || {};

      setShowAutoApplyModal(false);
      resetAutoApplyModalState();
      setAutoApplyResult(result);

      const hasExceptions = !result?.success || Number(result?.failedMappings || 0) > 0 || (result?.failures || []).length > 0;
      if (hasExceptions) {
        setShowAutoApplyResultModal(true);
      } else {
        Toast.success(response?.message || 'Auto payment mapping completed successfully.');
      }
      fetchPaymentReceived();
    } catch (error) {
      const errorMessage = getAutoApplyErrorMessage(error);
      // Keep the Auto Pay modal open and show the warning for both selected and all-customers runs.
      setAutoApplyWarning(getAutoApplyWarningParts(errorMessage));
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden -m-4">
      <div className="bg-white px-4 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        <div className="flex items-center gap-3">
          <PageHeader loading={loading} title={PAGE_HEADERS?.PAYMENT_RECEIVED?.title} totalAmount={pagination?.totalAmount} totalRecord={pagination?.totalResults} />
          {pagination?.pendingMappingCount > 0 && (
            <div className="ml-4">
              <Tooltip title={`You have ${pagination.pendingMappingCount} payment(s) which are not mapped to any invoice. Please map them to invoice to complete the process.`} placement="top">
                <div
                  className="flex items-center gap-2 cursor-pointer"
                  onClick={handlePendingMappingClick}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handlePendingMappingClick();
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="relative">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping opacity-75"></div>
                  </div>
                  <span className="text-sm font-semibold text-red-600">{pagination.pendingMappingCount} Pending</span>
                </div>
              </Tooltip>
            </div>
          )}
        </div>

        <div className="flex flex-wrap justify-center md:justify-end items-center gap-2 md:gap-3 w-full md:w-auto">
          {/* <div className="w-full md:w-auto">
            <Sync loading={loading} getList={fetchPaymentReceived} />
          </div> */}

          {/* Hard hidden without the customer portal plan feature; disabled with a reason when the role lacks view. */}
          {isCustomerOrderAppAvailable && (
            <PermissionButton
              canAccess={!!useModuleCustomerPayment?.view}
              tooltipProps={{ placement: 'top' }}
              wrapperClassName="w-full md:w-auto"
              type="default"
              className="w-full md:w-auto py-2 md:py-4 px-4 md:px-5"
              icon={<Icons.CreditCardOutlined />}
              onClick={() =>
                navigate('/customer-payments', {
                  state: {
                    prevFrom: location.pathname,
                    historyStack: [...(location.state?.historyStack || []), location.pathname],
                  },
                })
              }
            >
              Customer Payments
            </PermissionButton>
          )}
          {pagination?.pendingMappingCount > 0 && (
            <PermissionButton
              canAccess={!!useModulePaymentReceived?.edit}
              isViewOnly={isViewOnly}
              tooltipProps={{ placement: 'top' }}
              type="default"
              className="w-full md:w-auto py-2 md:py-4 px-4 md:px-5"
              wrapperClassName="inline-block w-full md:w-auto"
              onClick={handleOpenAutoApplyModal}
              icon={<Icons.FileSyncOutlined />}
              text="Auto Pay Invoices"
              loading={autoApplyLoading}
              disabled={autoApplyLoading}
            />
          )}
          <PermissionButton
            canAccess={!!useModulePaymentReceived?.create}
            isViewOnly={isViewOnly}
            tooltipProps={{ placement: 'top' }}
            type="primary"
            className="w-full md:w-auto py-2 md:py-4 px-4 md:px-5"
            wrapperClassName="inline-block w-full md:w-auto"
            onClick={() =>
              navigate('/payments-received/new', {
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
          <StatusFilterTabs statuses={PAYMENT_RECEIVED_STATUS_OPTIONS} value={filter?.status} onChange={handleStatusTab} />
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
                selectionOptions={PAYMENT_RECEIVED_STATUS_OPTIONS}
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
            <div className="space-y-2 relative">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name={'bank'}
                label={'Bank '}
                placeHolder={'Select Bank'}
                selectionOptions={(bankDropdown || []).map(option => ({
                  label: option?.accountType !== BANK_TYPES.PETTY_CASH && option?.accountType === BANK_TYPES.BANK ? `${option?.bankName} (${option?.accountNumber?.slice(-4)})` : option?.accountType,
                  value: option.id,
                  rightContent: formatAmount(option?.availableBalance ?? 0, true, option?.currency),
                }))}
                value={filter?.bank}
                setFilter={setFilter}
                allowClear={true}
                loading={bankDropLoading}
                onFocus={() => {
                  if (!isApicalledRefFilter.current.bankDropdown) {
                    handleOnFocusApiCall(API_CALLED_ENUM.BANK_DROPDOWN);
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
            <LocationFilters filter={filter} setFilter={setFilter} showAddressType={false} />
          </FilterSection>

          <FilterSection title="Options">
            {isSplitWise && isSplitSessionActive && (
              <div className="flex items-center gap-x-4">
                <FilterInput type={filterInputEnum?.SWITCH} name={'isSplit'} value={filter?.isSplit} setFilter={setFilter} allowClear={true} />
                <div>Split Payment Received</div>
              </div>
            )}
            <div className="flex items-center gap-x-4">
              <FilterInput type={filterInputEnum?.SWITCH} name={'isPendingMapping'} value={filter?.isPendingMapping} setFilter={setFilter} allowClear={true} />
              <div>Pending Mapping</div>
            </div>
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
            singleDateKey: 'paymentDate',
          }}
          onDateClear={() => {
            setSelectedPreset('custom');
            setDateRange(null);
            updateUrlParams({ startDate: null, endDate: null, paymentDate: null, preset: null });
          }}
          STATUS_ENUM={PAYMENT_RECEIVED_STATUS}
          divDrop={divDrop}
          branchDrop={branchDrop}
          extraFilters={{
            ...getCustomerFilterTag('Customer', customerDropDownList),
            paymentMode: {
              label: 'Payment Mode',
              format: value =>
                value
                  .split(',')
                  .map(item => PAYMENT_MODE_OPTIONS.find(option => option.value === item)?.label ?? item)
                  .join(', '),
              clear: (setFilter, updateUrlParams) => {
                setFilter(prev => ({ ...prev, paymentMode: null }));
                updateUrlParams({ paymentMode: null });
              },
            },
            bank: {
              label: 'Bank',
              format: value => bankDropdown?.find(x => x?.id === value)?.bankName,
              clear: (setFilter, updateUrlParams) => {
                setFilter(prev => ({ ...prev, bank: null }));
                updateUrlParams({ bank: null });
              },
            },
            isSplit: {
              label: 'Split',
              format: value => value,
              clear: (setFilter, updateUrlParams) => {
                setFilter(prev => ({ ...prev, isSplit: null }));
                updateUrlParams({ isSplit: null });
              },
            },
            isPendingMapping: {
              label: 'Pending Mapping',
              format: value => value,
              clear: (setFilter, updateUrlParams) => {
                setFilter(prev => ({ ...prev, isPendingMapping: false }));
                updateUrlParams({ isPendingMapping: false });
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
            ...getLocationFilterTags({ includeAddressType: false }),
          }}
        />
      </div>

      <div>
        <CustomTable
          onColumnResize={handleColumnResize}
          columns={[...filterCreatedFromColumn(customizedColumns)]}
          loading={loading}
          data={paymentsReceived}
          onChange={handleTableChange}
          onRowClick={handleRowClick}
          enableRowSelection
          selectionType="checkbox"
          tableId="id"
          renderSelectionLabel={(keys, rows) => {
            const record = rows?.[0];
            if (!record) return `${keys.length} selected`;
            return (
              <span className="flex items-center gap-2">
                <span>Payment Received#</span>
                <Tag className="font-semibold">{record?.paymentReceivedId}</Tag>
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
                const statusLabel = record?.status || '-';
                const blockedTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : PERMISSION_MESSAGES.NO_PERMISSION;
                const isCancelled = record?.status === 'CANCELLED';

                const canView = useModulePaymentReceived?.view;
                const canOpenMore = useModulePaymentReceived?.edit && !isViewOnly;
                const canEdit = canOpenMore && record?.status === 'PENDING';
                const canDelete = useModulePaymentReceived?.delete && !isViewOnly && (record?.status === 'PENDING' || record?.status === 'APPROVED');
                const canApprove = canOpenMore && accessRoles?.isAccountant && record?.status === 'PENDING';
                const canCancel = canOpenMore && accessRoles?.isAccountant && (record?.status === 'APPROVED' || record?.status === 'REJECTED');
                const canApplyToInvoice = canOpenMore && record?.status === 'APPROVED' && (record?.availableBalance > 0 || record?.unusedAmount > 0);
                const canRefund = canOpenMore && record?.status === 'APPROVED' && Number(record?.unusedAmount) > 0;

                const viewTooltip = canView ? 'View Payment' : PERMISSION_MESSAGES.NO_PERMISSION;
                const editTooltip = canEdit
                  ? 'Edit Payment'
                  : isViewOnly
                    ? PERMISSION_MESSAGES.VIEW_ONLY
                    : !useModulePaymentReceived?.edit
                      ? PERMISSION_MESSAGES.NO_PERMISSION
                      : `Cannot edit payment in status: ${statusLabel}.`;
                const deleteTooltip = canDelete
                  ? 'Delete Payment'
                  : isViewOnly
                    ? PERMISSION_MESSAGES.VIEW_ONLY
                    : !useModulePaymentReceived?.delete
                      ? PERMISSION_MESSAGES.NO_PERMISSION
                      : `Cannot delete payment in status: ${statusLabel}.`;
                const statusChangeTooltip = isViewOnly
                  ? PERMISSION_MESSAGES.VIEW_ONLY
                  : !useModulePaymentReceived?.edit || !accessRoles?.isAccountant
                    ? PERMISSION_MESSAGES.NO_PERMISSION
                    : isCancelled
                      ? 'Payment is cancelled.'
                      : `Cannot change payment in status: ${statusLabel}.`;
                const cancelTooltip = canCancel
                  ? 'Cancel Payment'
                  : isViewOnly
                    ? PERMISSION_MESSAGES.VIEW_ONLY
                    : !useModulePaymentReceived?.edit || !accessRoles?.isAccountant
                      ? PERMISSION_MESSAGES.NO_PERMISSION
                      : isCancelled
                        ? 'Payment is already cancelled.'
                        : `Cannot cancel in status: ${statusLabel}.`;
                const applyToInvoiceTooltip = canApplyToInvoice
                  ? 'Apply Payment to Invoice'
                  : isViewOnly
                    ? PERMISSION_MESSAGES.VIEW_ONLY
                    : !useModulePaymentReceived?.edit
                      ? PERMISSION_MESSAGES.NO_PERMISSION
                      : isCancelled
                        ? 'Payment is cancelled.'
                        : record?.status !== 'APPROVED'
                          ? `Cannot apply to invoice in status: ${statusLabel}.`
                          : 'No available balance to apply to invoice.';
                const refundTooltip = canRefund
                  ? 'Refund'
                  : isViewOnly
                    ? PERMISSION_MESSAGES.VIEW_ONLY
                    : !useModulePaymentReceived?.edit
                      ? PERMISSION_MESSAGES.NO_PERMISSION
                      : isCancelled
                        ? 'Payment is cancelled.'
                        : record?.status !== 'APPROVED'
                          ? `Cannot refund in status: ${statusLabel}.`
                          : 'No unused amount to refund.';
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
                      onOpenChange={open => {
                        if (!canOpenMore) return;
                        setOpenDropdownId(open ? record?.id : null);
                      }}
                      dropdownRender={() => {
                        const markAsDisabled = !canApprove || approveLoading || rejectLoading;
                        const cancelDisabled = !canCancel || cancelLoading;
                        const refundDisabled = !canRefund || submitLoading;
                        const applyToInvoiceDisabled = !canApplyToInvoice || submitLoading;

                        const getApproveLabel = () => {
                          if (record?.chequeStatus === CHEQUE_STATUS.PENDING) {
                            return 'Receive Cheque Approval';
                          } else if (record?.chequeStatus === CHEQUE_STATUS.RECEIVED) {
                            return 'Deposit Cheque';
                          }
                          return 'Approve';
                        };

                        return (
                          <div className="bg-white shadow-lg rounded-lg border border-gray-200 flex flex-col w-56 py-1">
                            <div className="px-2 py-1">
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">Status Actions :</div>
                            </div>

                            {/* Approve */}
                            <Tooltip title={canApprove ? getApproveLabel() : statusChangeTooltip} placement="left">
                              <button
                                type="button"
                                onClick={
                                  markAsDisabled
                                    ? undefined
                                    : () => {
                                        handleApprovedModalClick(record);
                                        setOpenDropdownId(null);
                                      }
                                }
                                disabled={markAsDisabled}
                                className={`w-full px-3 py-2 text-left text-sm flex items-center transition-colors duration-150 ${
                                  markAsDisabled ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-gray-700 hover:bg-green-50 hover:text-green-800 cursor-pointer'
                                }`}
                              >
                                {approveLoading ? (
                                  <span className="flex items-center gap-2">
                                    <CustomLoader variant="button" text="Updating..." />
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-2">
                                    <Icons.CheckCircleOutlined className={markAsDisabled ? 'text-gray-400' : 'text-green-800'} style={{ fontSize: 14 }} />
                                    {getApproveLabel()}
                                  </span>
                                )}
                              </button>
                            </Tooltip>

                            {/* Reject */}
                            <Tooltip title={canApprove ? 'Reject Payment' : statusChangeTooltip} placement="left">
                              <button
                                type="button"
                                onClick={
                                  markAsDisabled
                                    ? undefined
                                    : () => {
                                        handleApprovedModalClick(record);
                                        setOpenDropdownId(null);
                                      }
                                }
                                disabled={markAsDisabled}
                                className={`w-full px-3 py-2 text-left text-sm flex items-center transition-colors duration-150 ${
                                  markAsDisabled ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-gray-700 hover:bg-red-50 hover:text-red-800 cursor-pointer'
                                }`}
                              >
                                {rejectLoading ? (
                                  <span className="flex items-center gap-2">
                                    <CustomLoader variant="button" text="Updating..." />
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-2">
                                    <Icons.CloseCircleOutlined className={markAsDisabled ? 'text-gray-400' : 'text-red-800'} style={{ fontSize: 14 }} />
                                    Reject
                                  </span>
                                )}
                              </button>
                            </Tooltip>

                            {/* Cancel */}
                            <Tooltip title={cancelTooltip} placement="left">
                              <button
                                type="button"
                                onClick={
                                  cancelDisabled
                                    ? undefined
                                    : () => {
                                        handleCancelModalClick(record?.id);
                                        setOpenDropdownId(null);
                                      }
                                }
                                disabled={cancelDisabled}
                                className={`w-full px-3 py-2 text-left text-sm flex items-center transition-colors duration-150 ${
                                  cancelDisabled ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-gray-700 hover:bg-rose-50 hover:text-rose-800 cursor-pointer'
                                }`}
                              >
                                {cancelLoading ? (
                                  <span className="flex items-center gap-2">
                                    <CustomLoader variant="button" text="Cancelling..." />
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-2">
                                    <Icons.StopOutlined className={cancelDisabled ? 'text-gray-400' : 'text-rose-800'} style={{ fontSize: 14 }} />
                                    Cancel Payment
                                  </span>
                                )}
                              </button>
                            </Tooltip>

                            <div className="border-t border-gray-200 my-1"></div>

                            {/* Refund */}
                            <div className="px-2 py-1">
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">Refund :</div>
                            </div>

                            <Tooltip title={refundTooltip} placement="left">
                              <button
                                type="button"
                                onClick={
                                  refundDisabled
                                    ? undefined
                                    : () => {
                                        handleRefundPaymentReceived(record);
                                        setOpenDropdownId(null);
                                      }
                                }
                                disabled={refundDisabled}
                                className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors duration-150 ${
                                  refundDisabled ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 cursor-pointer'
                                }`}
                              >
                                <Icons.DollarOutlined className={refundDisabled ? 'text-gray-400' : 'text-emerald-600'} style={{ fontSize: 16 }} />
                                <span>Refund</span>
                              </button>
                            </Tooltip>

                            <div className="border-t border-gray-200 my-1"></div>

                            {/* Apply */}
                            <div className="px-2 py-1">
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">Apply :</div>
                            </div>

                            <Tooltip title={applyToInvoiceTooltip} placement="left">
                              <button
                                type="button"
                                onClick={
                                  applyToInvoiceDisabled
                                    ? undefined
                                    : () => {
                                        handleApplyToInvoice(record);
                                        setOpenDropdownId(null);
                                      }
                                }
                                disabled={applyToInvoiceDisabled}
                                className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors duration-150 rounded-b ${
                                  applyToInvoiceDisabled ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-gray-700 hover:bg-purple-50 hover:text-purple-600 cursor-pointer'
                                }`}
                              >
                                <Icons.SwapOutlined className={applyToInvoiceDisabled ? 'text-gray-400' : 'text-purple-500'} style={{ fontSize: 16 }} />
                                <span>to Invoice</span>
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
      <CustomModal
        modalOpen={approvalModal.visible}
        setModalOpen={open => {
          if (!open) {
            setApprovalModal({
              visible: false,
              paymentId: null,
              approvalNote: '',
              depositDate: dayjs().format('YYYY-MM-DD'),
              clearingDate: dayjs().format('YYYY-MM-DD'),
              chequeReceivedDate: dayjs().format('YYYY-MM-DD'),
              chequeApprovalNote: '',
            });
          }
        }}
        title={
          selectedRecord?.chequeStatus?.toLowerCase() === CHEQUE_STATUS.PENDING?.toLowerCase() && selectedRecord.paymentMode?.toLowerCase() === PAYMENT_MODES.CHEQUE?.toLowerCase()
            ? 'Receive Cheque Approval Payment'
            : selectedRecord?.chequeStatus?.toLowerCase() === CHEQUE_STATUS.RECEIVED?.toLowerCase() && selectedRecord.paymentMode?.toLowerCase() === PAYMENT_MODES.CHEQUE?.toLowerCase()
              ? 'Deposit Cheque Payment'
              : 'Approve Payment'
        }
      >
        <div className="flex flex-col gap-y-3 mb-2">
          <p>Enter Transaction Details and click on Approve to proceed with the payment. </p>
          {selectedRecord?.attachments?.length > 0 && <AttachMentDetails data={selectedRecord} />}
        </div>

        <TextArea rows={4} placeholder="Enter transaction details" value={approvalModal.approvalNote} onChange={e => setApprovalModal(prev => ({ ...prev, approvalNote: e.target.value }))} />

        {selectedRecord?.paymentMode?.toLowerCase() === PAYMENT_MODES.CHEQUE?.toLocaleLowerCase() && (
          <div className="relative pt-1.5">
            <div className="mb-1">Cheque Received Date</div>
            <DatePicker
              value={approvalModal?.chequeReceivedDate ? dayjs(approvalModal.chequeReceivedDate, 'YYYY-MM-DD') : null}
              onChange={(_chequeReceivedDate, dateString) => setApprovalModal(prev => ({ ...prev, chequeReceivedDate: dateString }))}
              format="YYYY-MM-DD"
              className="w-full py-1.5 h-[35.5px]"
              placeholder="Select Cheque Received Date"
              disabled={selectedRecord?.chequeStatus?.toLowerCase() === CHEQUE_STATUS.RECEIVED?.toLowerCase() || selectedRecord?.chequeStatus?.toLowerCase() === CHEQUE_STATUS.DEPOSITED?.toLowerCase()}
            />
          </div>
        )}

        {selectedRecord?.paymentMode?.toLowerCase() === PAYMENT_MODES.CHEQUE?.toLocaleLowerCase() &&
          (selectedRecord.chequeStatus?.toLowerCase() === CHEQUE_STATUS.RECEIVED?.toLowerCase() || selectedRecord.chequeStatus?.toLowerCase() === CHEQUE_STATUS.DEPOSITED?.toLowerCase()) && (
            <div className="relative pt-1.5">
              <div className="mb-1">Deposite Date</div>
              <DatePicker
                value={approvalModal?.depositDate ? dayjs(approvalModal?.depositDate, 'YYYY-MM-DD') : null}
                onChange={(_depositDate, dateString) => setApprovalModal(prev => ({ ...prev, depositDate: dateString }))}
                format="YYYY-MM-DD"
                className="w-full py-1.5 h-[35.5px]"
                placeholder="Select Deposite Date"
                disabled={selectedRecord?.chequeStatus?.toLowerCase() === CHEQUE_STATUS.DEPOSITED?.toLowerCase()}
                minDate={approvalModal?.chequeReceivedDate ? dayjs(approvalModal.chequeReceivedDate, 'YYYY-MM-DD') : null}
              />
            </div>
          )}

        {selectedRecord?.paymentMode?.toLowerCase() === PAYMENT_MODES.CHEQUE?.toLocaleLowerCase() && selectedRecord.chequeStatus?.toLowerCase() === CHEQUE_STATUS.DEPOSITED?.toLowerCase() && (
          <div className="relative pt-1.5">
            <div className="mb-1">Clearing Date</div>
            <DatePicker
              value={approvalModal?.clearingDate ? dayjs(approvalModal?.clearingDate, 'YYYY-MM-DD') : null}
              onChange={(_clearingDate, dateString) => setApprovalModal(prev => ({ ...prev, clearingDate: dateString }))}
              minDate={approvalModal?.depositDate ? dayjs(approvalModal?.depositDate, 'YYYY-MM-DD') : null}
              format="YYYY-MM-DD"
              className="w-full py-1.5 h-[35.5px]"
              placeholder="Select Deposite Date"
            />
          </div>
        )}

        {selectedRecord?.paymentMode?.toLowerCase() === PAYMENT_MODES.CHEQUE?.toLocaleLowerCase() && (
          <div className="relative pt-1.5">
            <div className="mb-1">Cheque Approval Note</div>
            <TextArea
              rows={3}
              placeholder="Enter cheque approval note"
              value={approvalModal.chequeApprovalNote}
              onChange={e => setApprovalModal(prev => ({ ...prev, chequeApprovalNote: e.target.value }))}
            />
          </div>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <Button
            key="back"
            onClick={() =>
              setApprovalModal({
                visible: false,
                paymentId: null,
                approvalNote: '',
                depositDate: dayjs().format('YYYY-MM-DD'),
                clearingDate: dayjs().format('YYYY-MM-DD'),
                chequeReceivedDate: dayjs().format('YYYY-MM-DD'),
                chequeApprovalNote: '',
              })
            }
          >
            Go Back
          </Button>
          <Button key="link" type="primary" danger loading={rejectLoading} onClick={handleRejectPayment} style={{ minWidth: 80 }}>
            Reject
          </Button>
          <Button key="submit" type="primary" loading={approveLoading} onClick={handleApprovePayment} style={{ minWidth: 110 }}>
            {selectedRecord?.chequeStatus?.toLowerCase() === CHEQUE_STATUS.PENDING?.toLowerCase() && selectedRecord.paymentMode?.toLowerCase() === PAYMENT_MODES.CHEQUE?.toLowerCase()
              ? 'Receive Cheque Approval'
              : selectedRecord?.chequeStatus?.toLowerCase() === CHEQUE_STATUS.RECEIVED?.toLowerCase() && selectedRecord.paymentMode?.toLowerCase() === PAYMENT_MODES.CHEQUE?.toLowerCase()
                ? 'Deposit Cheque'
                : 'Approve'}
          </Button>
        </div>
      </CustomModal>
      <CustomModal
        modalOpen={cancelModal.visible}
        setModalOpen={open => {
          if (!open) setCancelModal({ visible: false, paymentId: null, note: '' });
        }}
        title="Cancel Payment"
      >
        <p>Enter Transaction Details and click on cancel to proceed with the payment.</p>
        <TextArea rows={4} placeholder="Enter transaction details" value={cancelModal.note} onChange={e => setCancelModal(prev => ({ ...prev, note: e.target.value }))} />
        <div className="flex justify-end gap-2 mt-4">
          <Button key="back" onClick={() => setCancelModal({ visible: false, paymentId: null, note: '' })}>
            Go Back
          </Button>
          <Button key="submit" type="primary" danger loading={cancelLoading} onClick={handleCancelReceived} style={{ minWidth: 120 }}>
            Cancel Payment
          </Button>
        </div>
      </CustomModal>
      <DocumentConfirmModal
        modal={deleteModal}
        docType={MODULE_NAMES?.PAYMENT_RECEIVED}
        onConfirm={deletePaymentReceived}
        loading={deleteLoading}
        getDocumentDetails={getPaymentReceivedDocumentDetails}
      />
      <ApplyToInvoiceModal
        onClose={() => {
          setShowApplytoInvoiceModal(false);
          setSelectedRecord(null);
        }}
        modalOpen={showApplyToInvoiceModal}
        paymentReceivedDetails={selectedRecord}
        fetchPaymentReceived={fetchPaymentReceived}
      />
      <RefundPaymentModal
        variant="paymentReceived"
        modalOpen={showRefundPaymentReceivedModal}
        onClose={() => setShowRefundPaymentReceivedModal(false)}
        paymentDetails={selectedRecord}
        fetchPayment={fetchPaymentReceived}
      />
      {showAutoApplyModal && (
        <CustomModal
          modalOpen={showAutoApplyModal}
          setModalOpen={open => {
            if (!open) {
              handleCloseAutoApplyModal();
            }
          }}
          width={560}
          title="Auto Adjust Advance Payments to Invoices"
        >
          <div className="text-sm text-gray-700">
            <p className="text-gray-600 mb-3">
              For each <span className="font-medium text-gray-800">customer</span>, amounts are applied in this order:
            </p>
            <ol className="list-decimal pl-5 space-y-2.5 mb-4 text-gray-800">
              <li>
                <span className="font-semibold text-gray-900">Opening receivable balance:</span> {''}
                <span className="text-gray-600">uses pending opening receivable amount for that branch (when it exists).</span>
              </li>
              <li>
                <span className="font-semibold text-gray-900">Unused advance payments:</span> {''}
                <span className="text-gray-600">approved advance payments that still have balance left.</span>
              </li>
            </ol>
            <p className="text-gray-600 mb-4 pl-0.5 leading-relaxed">
              Open invoices are matched by <span className="font-medium text-gray-800">due date</span> (oldest first).
            </p>
            <div className="space-y-2 mb-4">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name={'customerId'}
                label={'Customer'}
                placeHolder={'Select Customer'}
                selectVariant="twoColumn"
                columnSelectHeader={customerSelectColumnHeader}
                selectPopupClassName={customerSelectDropdownProps.selectPopupClassName}
                selectionOptions={buildCustomerSelectOptions(customerDropDownList)}
                value={autoApplyFilter?.customerId}
                setFilter={handleAutoApplyFilter}
                allowClear={true}
                loading={customerLoading}
                getPopupContainer={trigger => trigger.parentNode}
                onFocus={() => {
                  if (!isApicalledRefFilter.current.customerDropdown) {
                    handleOnFocusApiCall(API_CALLED_ENUM.CUSTOMER_DROPDOWN);
                  }
                }}
              />
            </div>
            {autoApplyWarning && <Alert type="warning" showIcon message={autoApplyWarning.message} description={autoApplyWarning.description} className="mb-4" />}
            <div className="flex justify-end gap-2 mt-6 pt-1">
              <CustomButton className="px-8 py-4" type="default" text="Cancel" onClick={handleCloseAutoApplyModal} style={{ minWidth: '100px', maxWidth: '100px' }} disabled={autoApplyLoading} />
              <CustomButton
                className="px-8 py-4"
                type="primary"
                text="Confirm"
                onClick={handleConfirmAutoApplyPaymentReceived}
                disabled={autoApplyLoading}
                loading={autoApplyLoading}
                style={{ minWidth: '100px', maxWidth: '100px' }}
              />
            </div>
          </div>
        </CustomModal>
      )}
      {showAutoApplyResultModal && (
        <CustomModal
          modalOpen={showAutoApplyResultModal}
          setModalOpen={open => {
            if (!open) setShowAutoApplyResultModal(false);
          }}
          width={560}
          title="Auto Adjustment Completed with Exceptions"
        >
          <div>
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 mb-4">
              <div className="flex items-center gap-2 text-red-700 font-semibold text-sm">
                <Icons.WarningOutlined />
                Exception Summary
              </div>
              <p className="text-sm text-red-700 mt-1">Some invoices could not be adjusted automatically. Please review the summary below, resolve the issue, and run Auto Adjust again.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="rounded-md border border-gray-200 bg-white px-4 py-3">
                <div className="text-xs text-gray-500">Total Attempted</div>
                <div className="text-lg font-semibold text-gray-800">{autoApplyResult?.attemptedMappings ?? 0}</div>
              </div>
              <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3">
                <div className="text-xs text-green-700">Adjusted Successfully</div>
                <div className="text-lg font-semibold text-green-700">{autoApplyResult?.successfulMappings ?? 0}</div>
              </div>
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3">
                <div className="text-xs text-red-700">Exceptions</div>
                <div className="text-lg font-semibold text-red-700">{autoApplyResult?.failedMappings ?? 0}</div>
              </div>
            </div>

            <div className="rounded-md border border-gray-200 bg-white px-4 py-3">
              <p className="text-sm text-gray-800 leading-relaxed">{getAutoApplyShortSummary(autoApplyResult)}</p>
            </div>
          </div>
        </CustomModal>
      )}
      <ColumnSelection
        hideTrigger
        columns={filterCreatedFromColumn(columnsList)}
        setColumnsList={setColumnsList}
        setCutomizedColumns={setCutomizedColumns}
        configPage={configEnum?.PAYMENT_RECEIVED_CONFIG}
        modalOpen={showColumnModal}
        setModalOpen={setShowColumnModal}
      />
      <ViewDocumentListToolbarModals {...toolbarModalsProps} />
    </div>
  );
};

export default ViewPaymentReceived;
