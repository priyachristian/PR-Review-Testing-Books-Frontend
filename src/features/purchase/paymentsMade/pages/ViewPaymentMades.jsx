import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';

// Components
import ApplyToBillModal from '../components/ApplyToBillModal';
import RefundPaymentModal from '@/components/feedback/formModal/RefundPaymentModal';
import AttachMentDetails from '@/components/feedback/formModal/AttachMentDetails';
import ColumnSelection from '@/components/ui/common/ColumnSelection';
import StatusFilterTabs from '@/components/ui/common/StatusFilterTabs';
import FilterLockButton from '@/components/ui/common/FilterLockButton';
import FilterDrawer, { FilterSection, FilterButton } from '@/components/ui/common/FilterDrawer';
import { PAYMENT_MADE_STATUS_OPTIONS } from '@/utils/dropdownEnums';
import CustomButton from '@/components/ui/button/CustomButton';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomDatePicker from '@/components/forms/formDatePicker/CustomDatePicker';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import { DocumentConfirmModal } from '@/components/feedback/confirmModal/CancelOrDeleteDocumentModal';
import FilterInput from '@/components/forms/formInput/FilterInput';
import LocationFilters, { getLocationFilterTags } from '@/components/forms/formInput/LocationFilters';
import PageHeader from '@/components/ui/common/PageHeader';
import Toast from '@/components/ui/common/Toast';
import { Alert, Button, DatePicker, Dropdown, Input, Tag, Tooltip, Upload } from '@/components/AntDComponent';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import ViewDocumentListToolbarModals from '@/components/ui/common/ViewDocumentListToolbarModals';

// Hooks
import { useBank } from '@/features/banking/banks/useBank';
import useModulePermissions from 'hooks/useModulePermissions';
import { useUser } from '@/features/setting/user/useUser';
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import useDocumentListToolbar from '@/hooks/useDocumentListToolbar';
import useDocumentPdfExport from '@/hooks/useDocumentPdfExport';
import useColumnResize from '@/hooks/useColumnResize';
import { useConfirmModal } from '@/hooks/useConfirmModal';
import { useCustomer } from '@/features/sales/customer';
// Extras
import { usePaymentMade, paymentMadeColumn, paymentMadeExportColumn, getPaymentMadeDocumentDetails } from '@/features/purchase/paymentsMade';
import Icons from 'assets/icons/icon';
import { CommonFilterTags, useFilters, getCustomerFilterTag } from '@/utils/filtersUtils';
import { FILTERS_KEYS, RESOURCES } from '@/utils/jsonFile';
import { clearPaymentMadeInvoiceDrop } from '@/features/purchase/paymentsMade/paymentMade.slice';
import { resetBranch } from '@/features/allMaster/warehouse/warehouse.slice';
import { configEnum, filterInputEnum, MODULE_NAMES, PAYMENT_MADE_STATUS, PAYMENT_MODE_OPTIONS, PAYMENT_MODES, PERMISSION_MESSAGES } from 'utils/constants';
import { getAllFiltersFromLocalStorage } from '@/utils/filters';
import { getFromLocalStorage, getQueryParams, parsedTableCoulmns } from 'utils/services';
import { formatAmount } from '@/utils/currency';
import { colorPalette } from '@/utils/theme';
import { PAGE_HEADERS } from '@/utils/label';
import { buildDivisionSelectOptions, buildBranchSelectOptions, divisionSelectColumnHeader, branchSelectColumnHeader } from '@/utils/tableSelectDropdown/orgSelectDropdown';
import { buildCustomerSelectOptions, vendorSelectColumnHeader, customerSelectDropdownProps } from '@/utils/tableSelectDropdown/customerSelectDropdown';

const { TextArea } = Input;

const API_CALLED_ENUM = {
  DIVISION_DROPDOWN: 'divisionDropdown',
  BANK_DROPDOWN: 'bankDropdown',
  USERS_DROPDOWN: 'usersDropdown',
  VENDOR_DROPDOWN: 'vendorDropdown',
};

const AUTO_APPLY_WARNING_TITLES = ['Advance Payment Available', 'Advance Payment Not Available', 'No Bill or Advance Payment'];

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

  if (errorMessage.includes('No pending bills are available')) {
    return {
      message: 'No Pending Bills',
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

  const noBillAvailable = failures.filter(item => {
    const message = String(item?.message || '').toLowerCase();
    const hasBill = Boolean(item?.billNo && String(item.billNo).trim() && item.billNo !== '-');
    return !hasBill || message.includes('no bill is available') || message.includes('no pending bills');
  }).length;

  return {
    failedPayments,
    noBillAvailable,
    billAutoApplyFailed: Math.max(failedPayments - noBillAvailable, 0),
  };
};

const getAutoApplyShortSummary = (result = {}) => {
  const { failedPayments, noBillAvailable, billAutoApplyFailed } = getAutoApplySummaryCounts(result);
  if (!failedPayments) {
    return 'Some payments could not be adjusted automatically.';
  }

  const parts = [];
  if (noBillAvailable > 0) {
    parts.push(`${noBillAvailable} have no bill available`);
  }
  if (billAutoApplyFailed > 0) {
    parts.push(`${billAutoApplyFailed} could not be applied to bill`);
  }

  const paymentLabel = failedPayments === 1 ? 'payment' : 'payments';
  if (!parts.length) {
    return `${failedPayments} ${paymentLabel} could not be adjusted automatically.`;
  }

  return `${failedPayments} ${paymentLabel} could not be adjusted automatically. ${parts.join('. ')}.`;
};

const ViewPaymentMades = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { usersDropdown, usersDropdownLoading, getUsersDropdown, accessRoles } = useUser();
  const {
    paymentsMade,
    pagination,
    loading,
    approveLoading,
    rejectLoading,
    cancelLoading,
    submitLoading,
    deleteLoading,
    getPaymentsMade,
    approvePaymentsMade,
    rejectPaymentsMade,
    cancelPaymentsMade,
    removePaymentMade,
    resetPaymentsMade,
    autoApplyPendingAdvancePaymentMade,
    autoApplyLoading,
    getPaymentsMadeExports,
    exportLoading,
  } = usePaymentMade();
  const { isViewOnly, isSplitWise, isSplitSessionActive, useModulePaymentMade, divDrop, divisionLoading, getDivDropDown, branchDrop, branchLoading, getBranchDropDown } = useModulePermissions(
    RESOURCES.PAYMENT_MADE
  );
  const { vendorDropDownList, loading: vendorLoading, getVendorDropList } = useCustomer();
  const FILTER_KEY = FILTERS_KEYS.PAYMENTS_MADE_ALL_FILTER;
  const { bankDropdown, droploading: bankDropLoading, getBankDropDown } = useBank();
  const deleteModal = useConfirmModal();
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilter, setShowFilter] = useState(false);
  const isApicalledRefFilter = useRef({
    divisionDropdown: false,
    bankDropdown: false,
    usersDropdown: false,
    vendorDropdown: false,
  });
  // const [clearSelection, setClearSelection] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [approvalModal, setApprovalModal] = useState({
    visible: false,
    paymentId: null,
    approvalNote: '',
    pdcChequeDate: selectedRecord?.pdcChequeDate ? dayjs(selectedRecord?.pdcChequeDate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
    chequeApprovalNote: '',
  });

  const [cancelModal, setCancelModal] = useState({
    visible: false,
    paymentId: null,
    note: '',
  });

  const [paymentPDF, setPaymentPDF] = useState([]);
  const [file, setFile] = useState(null);
  const isApiCalledRef = useRef(false);
  const prevIsSplitSessionActive = useRef(isSplitSessionActive);
  const [showApplyToBillModal, setShowApplyToBillModal] = useState(false);
  const [showRefundPaymentMadeModal, setShowRefundPaymentMadeModal] = useState(false);
  const [showAutoApplyModal, setShowAutoApplyModal] = useState(false);
  const [showAutoApplyResultModal, setShowAutoApplyResultModal] = useState(false);
  const [autoApplyResult, setAutoApplyResult] = useState(null);
  const [autoApplyFilter, setAutoApplyFilter] = useState({ customerId: '' });
  const [autoApplyWarning, setAutoApplyWarning] = useState(null);
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
      bank: searchParams.get('bank') || '',
      paymentMode: searchParams.get('paymentMode') ? searchParams.get('paymentMode').split(',') : '',
      isSplit: false,
      isPendingMapping: searchParams.get('isPendingMapping') || false,
      addedBy: searchParams.get('addedBy') ? searchParams.get('addedBy').split(',') : '',
      country: searchParams.get('country') ? searchParams.get('country').split(',') : '',
      state: searchParams.get('state') ? searchParams.get('state').split(',') : '',
      city: searchParams.get('city') ? searchParams.get('city').split(',') : '',
    },
    dateKeys: { startDate: 'startDate', endDate: 'endDate', singleDate: 'paymentDate' },
    isSplitSessionActive,
    isSplitWise,
  });

  useEffect(() => {
    dispatch(clearPaymentMadeInvoiceDrop());
  }, [dispatch]);

  useEffect(() => {
    if (prevIsSplitSessionActive.current === true && isSplitSessionActive === false && isSplitWise) {
      handleFilter();
    }
    prevIsSplitSessionActive.current = isSplitSessionActive;
  }, [isSplitSessionActive, isSplitWise]);

  useEffect(() => {
    if (isApiCalledRef.current) {
      const controller = new AbortController();
      fetchPaymentMade(controller.signal);
      return () => controller.abort();
    }

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
          paymentMode: savedFilters.paymentMode ? savedFilters?.paymentMode?.split(',') : prev.paymentMode,
          division: savedFilters.division ? savedFilters?.division?.split(',') : prev.division,
          branch: savedFilters.branch ? savedFilters?.branch?.split(',') : prev.branch,
          customerId: savedFilters.customerId ? savedFilters?.customerId?.split(',') : prev.customerId,
          isSplit: savedFilters.isSplit ?? prev.isSplit,
          addedBy: savedFilters.addedBy ? savedFilters.addedBy.split(',') : prev.addedBy,
          country: savedFilters.country ? savedFilters.country.split(',') : prev.country,
          state: savedFilters.state ? savedFilters.state.split(',') : prev.state,
          city: savedFilters.city ? savedFilters.city.split(',') : prev.city,
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
    fetchPaymentMade(controller.signal);
    return () => controller.abort();
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  useResetOnUnmount(resetPaymentsMade);

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
  }, [filter?.division]); // eslint-disable-line react-hooks/exhaustive-deps

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

  useEffect(() => {
    if (searchParams.get('bank')) {
      handleOnFocusApiCall(API_CALLED_ENUM.BANK_DROPDOWN);
    }
  }, [filter?.bank]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEditClick = record => {
    navigate(`/payments-made/${record.id}/edit`, {
      state: {
        paymentMadeData: record,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleViewClick = record => {
    navigate(`/payments-made/${record.id}`, {
      state: {
        paymentMadeData: record,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleRowClick = record => {
    navigate(`/payments-made/${record.id}`, {
      state: {
        paymentMadeData: record,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const fetchPaymentMade = signal => {
    const page = parseInt(searchParams?.get('page')) || 1;
    const pageSize = parseInt(searchParams?.get('limit')) || pagination.limit;
    const payload = getQueryParams(window.location.href) || {};

    getPaymentsMade({ ...payload, page, limit: pageSize, signal });
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

  const handleApprovePayment = async () => {
    try {
      await approvePaymentsMade({
        paymentId: approvalModal.paymentId,
        approvalNote: approvalModal.approvalNote,
        attachments: [...(selectedRecord?.attachments || []), ...paymentPDF],
        ...(selectedRecord?.paymentMode?.toLowerCase() === PAYMENT_MODES.CHEQUE?.toLowerCase() && {
          ...(approvalModal.pdcChequeDate && { pdcChequeDate: approvalModal.pdcChequeDate }),
          chequeApprovalNote: approvalModal.chequeApprovalNote,
        }),
      });
      setApprovalModal({
        visible: false,
        paymentId: null,
        approvalNote: '',
        pdcChequeDate: dayjs().format('YYYY-MM-DD'),
        chequeApprovalNote: '',
      });
      fetchPaymentMade();
      setFile(null);
      setPaymentPDF([]);
      // if (clearSelection) {
      //   clearSelection();
      // }
    } catch (error) {
      console.log('handleApprovePayment Error::', error);
    }
  };

  const handleRejectPayment = async () => {
    try {
      await rejectPaymentsMade({
        paymentId: approvalModal.paymentId,
        approvalNote: approvalModal.approvalNote,
        attachments: [...(selectedRecord?.attachments || []), ...paymentPDF],
        ...(selectedRecord?.paymentMode?.toLowerCase() === PAYMENT_MODES.CHEQUE?.toLowerCase() && {
          ...(approvalModal.pdcChequeDate && { pdcChequeDate: approvalModal.pdcChequeDate }),
          chequeApprovalNote: approvalModal.chequeApprovalNote,
        }),
      });
      setApprovalModal({
        visible: false,
        paymentId: null,
        approvalNote: '',
        pdcChequeDate: dayjs().format('YYYY-MM-DD'),
        chequeApprovalNote: '',
      });
      fetchPaymentMade();
      setFile(null);
      setPaymentPDF([]);
    } catch (error) {
      console.log('handleRejectPayment Error::', error);
    }
  };

  const handleCancelReceived = async () => {
    try {
      await cancelPaymentsMade({
        paymentId: cancelModal.paymentId,
        notes: { notes: cancelModal.note },
      });
      setCancelModal({ visible: false, paymentId: null, note: '' });
      fetchPaymentMade();

      // if (clearSelection) {
      //   clearSelection();
      // }
    } catch (error) {
      console.log('handleCancelReceived Error::', error);
    }
  };

  const handleApprovedModalClick = id => {
    let findPayment = paymentsMade?.find(x => x?.id === id);
    setSelectedRecord(findPayment);
    setApprovalModal({
      visible: true,
      paymentId: id,
      approvalNote: '',
      pdcChequeDate: findPayment?.pdcChequeDate ? dayjs(findPayment?.pdcChequeDate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
      chequeApprovalNote: '',
    });
  };

  const handleCancelModalClick = id => {
    setCancelModal({
      visible: true,
      paymentId: id,
      note: '',
    });
  };

  const handleFileUpload = file => {
    if (!file) {
      Toast.error('No file selected for upload.');
      return;
    }
    setPaymentPDF([file]);
  };

  const handleDeleteClick = record => {
    deleteModal.open(record);
  };

  const deletePaymentMade = async () => {
    await removePaymentMade({ paymentId: deleteModal.payload?.id });
    deleteModal.close();
    fetchPaymentMade();
    // if (clearSelection) {
    //   clearSelection();
    // }
  };

  const handleApplyToBill = record => {
    setShowApplyToBillModal(true);
    setSelectedRecord(record);
  };

  const handleRefundPaymentMade = record => {
    setShowRefundPaymentMadeModal(true);
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

  const handleConfirmAutoApplyPaymentMade = async () => {
    const vendorId = Array.isArray(autoApplyFilter?.customerId) ? autoApplyFilter.customerId.filter(Boolean)[0] : autoApplyFilter?.customerId;

    try {
      setAutoApplyWarning(null);
      const response = await autoApplyPendingAdvancePaymentMade(vendorId ? { customerId: vendorId } : {});
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
      fetchPaymentMade();
    } catch (error) {
      setAutoApplyWarning(getAutoApplyWarningParts(getAutoApplyErrorMessage(error)));
    }
  };

  const columns = paymentMadeColumn();
  let columnsFromLocalStorage = getFromLocalStorage(configEnum?.PAYMENT_MADE_CONFIG);
  let parsedColumnData = parsedTableCoulmns(columnsFromLocalStorage, columns);

  let displayColumn = parsedColumnData?.displayColumn?.filter(x => x?.visible === true);
  const [columnsList, setColumnsList] = useState(parsedColumnData?.displayColumn);
  const [customizedColumns, setCutomizedColumns] = useState([...(parsedColumnData?.customizedColumn?.length > 0 ? parsedColumnData.customizedColumn : displayColumn)]);

  const handleColumnResize = useColumnResize(setColumnsList, setCutomizedColumns, configEnum?.PAYMENT_MADE_CONFIG);

  const fetchPaymentMadeExports = useCallback(
    async payload => {
      const merged = { ...payload };
      if (isSplitWise && isSplitSessionActive) {
        merged.isSplit = !!filter?.isSplit;
      }
      return getPaymentsMadeExports(merged);
    },
    [filter?.isSplit, getPaymentsMadeExports, isSplitSessionActive, isSplitWise]
  );

  const { pdfExportLoading, handlePdfExport } = useDocumentPdfExport({
    defaultFileName: 'Payments_Made_Export',
    entityLabel: 'payments',
    filterKeys: ['paymentDate', 'bank', 'paymentMode', 'isSplit', 'isPendingMapping', 'country', 'state', 'city'],
    moduleType: 'paymentMade',
  });

  const { showColumnModal, setShowColumnModal, standardDropdownItems, toolbarModalsProps } = useDocumentListToolbar({
    filterKey: FILTER_KEY,
    columnConfigKey: configEnum?.PAYMENT_MADE_CONFIG,
    showPreferences: false,
    exportConfig: {
      exportLoading: exportLoading || pdfExportLoading,
      fetchExports: fetchPaymentMadeExports,
      getExportColumns: () => paymentMadeExportColumn(customizedColumns),
      defaultFileName: 'Payments_Made_Export',
      sheetName: 'Payments Made',
      entityPlural: 'Payments Made',
      formName: 'export-payments-made',
      exportLabel: 'Export Payments Made',
      formats: ['xlsx', 'pdf'],
      onPdfExport: handlePdfExport,
    },
    columnsConfig: {
      getDefaultColumns: paymentMadeColumn,
      setColumnsList,
      setCustomizedColumns: setCutomizedColumns,
    },
    handleResetFilters,
    onRefresh: () => fetchPaymentMade(),
    setIsLocked,
  });

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden -m-4">
      <div className="bg-white px-4 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        <div className="flex items-center gap-3">
          <PageHeader loading={loading} title={PAGE_HEADERS?.PAYMENT_MADE?.title} totalAmount={pagination?.totalAmount} totalRecord={pagination?.totalResults} />
          {pagination?.pendingMappingCount > 0 && (
            <div className="ml-4">
              <Tooltip title={`You have ${pagination.pendingMappingCount} payment(s) which are not mapped to any bill. Please map them to bill to complete the process.`} placement="top">
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
            <Sync loading={loading} getList={fetchPaymentMade} />
          </div> */}

          {pagination?.pendingMappingCount > 0 && (
            <PermissionButton
              canAccess={useModulePaymentMade?.edit}
              isViewOnly={isViewOnly}
              tooltipProps={{ placement: 'top' }}
              type="default"
              className="w-full md:w-auto py-2 md:py-4 px-4 md:px-5"
              wrapperClassName="inline-block w-full md:w-auto"
              onClick={handleOpenAutoApplyModal}
              icon={<Icons.FileSyncOutlined />}
              text="Auto Pay Bills"
              loading={autoApplyLoading}
              disabled={autoApplyLoading}
            />
          )}
          <PermissionButton
            canAccess={useModulePaymentMade?.create}
            isViewOnly={isViewOnly}
            tooltipProps={{ placement: 'top' }}
            type="primary"
            className="w-full md:w-auto py-2 md:py-4 px-4 md:px-5"
            wrapperClassName="inline-block w-full md:w-auto"
            onClick={() =>
              navigate('/payments-made/new', {
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
          <StatusFilterTabs statuses={PAYMENT_MADE_STATUS_OPTIONS} value={filter?.status} onChange={handleStatusTab} />
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
                selectionOptions={PAYMENT_MADE_STATUS_OPTIONS}
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
                  label: option?.accountType !== 'Petty Cash' && option?.accountType === 'Bank' ? `${option?.bankName} (${option?.accountNumber?.slice(-4)})` : option?.accountType,
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
            <LocationFilters filter={filter} setFilter={setFilter} showAddressType={false} />
          </FilterSection>

          <FilterSection title="Options">
            {isSplitWise && isSplitSessionActive && (
              <div className="flex items-center gap-x-4">
                <FilterInput type={filterInputEnum?.SWITCH} name={'isSplit'} value={filter?.isSplit} setFilter={setFilter} allowClear={true} />
                <div>Split Payment Made</div>
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
          STATUS_ENUM={PAYMENT_MADE_STATUS}
          divDrop={divDrop}
          branchDrop={branchDrop}
          extraFilters={{
            ...getCustomerFilterTag('Vendor', vendorDropDownList),
            addedBy: {
              label: 'Added By',
              format: value =>
                value
                  .split(',')
                  .filter(Boolean)
                  .map(id => {
                    const found = (usersDropdown || []).find(u => String(u?.id || u?._id) === String(id));
                    return found ? found.name || [found.firstName, found.lastName].filter(Boolean).join(' ') || found.email || null : null;
                  })
                  .filter(Boolean)
                  .join(', '),
              clear: (setFilter, updateUrlParams) => {
                setFilter(prev => ({ ...prev, addedBy: '' }));
                updateUrlParams({ addedBy: null });
              },
            },
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
            ...getLocationFilterTags({ includeAddressType: false }),
          }}
        />
      </div>
      <div>
        <CustomTable
          onColumnResize={handleColumnResize}
          columns={[...customizedColumns]}
          loading={loading}
          data={paymentsMade}
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
                <span>Payment Made#</span>
                <Tag className="font-semibold">{record?.paymentMadeId}</Tag>
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

                const canView = useModulePaymentMade?.view;
                const canOpenMore = useModulePaymentMade?.edit && !isViewOnly;
                const canEdit = canOpenMore && record?.status === 'PENDING';
                const canDelete = useModulePaymentMade?.delete && !isViewOnly && (record?.status === 'PENDING' || record?.status === 'APPROVED');
                const canApprove = canOpenMore && accessRoles?.isAccountant && record?.status === 'PENDING';
                const canCancel = canOpenMore && accessRoles?.isAccountant && (record?.status === 'APPROVED' || record?.status === 'REJECTED');
                const canApplyToBill = canOpenMore && record?.status === 'APPROVED' && (record?.availableBalance > 0 || record?.unusedAmount > 0);
                const canRefund = canOpenMore && record?.status === 'APPROVED' && Number(record?.unusedAmount) > 0;

                const viewTooltip = canView ? 'View Payment' : PERMISSION_MESSAGES.NO_PERMISSION;
                const editTooltip = canEdit
                  ? 'Edit Payment'
                  : isViewOnly
                    ? PERMISSION_MESSAGES.VIEW_ONLY
                    : !useModulePaymentMade?.edit
                      ? PERMISSION_MESSAGES.NO_PERMISSION
                      : `Cannot edit payment in status: ${statusLabel}.`;
                const deleteTooltip = canDelete
                  ? 'Delete Payment'
                  : isViewOnly
                    ? PERMISSION_MESSAGES.VIEW_ONLY
                    : !useModulePaymentMade?.delete
                      ? PERMISSION_MESSAGES.NO_PERMISSION
                      : `Cannot delete payment in status: ${statusLabel}.`;
                const statusChangeTooltip = isViewOnly
                  ? PERMISSION_MESSAGES.VIEW_ONLY
                  : !useModulePaymentMade?.edit || !accessRoles?.isAccountant
                    ? PERMISSION_MESSAGES.NO_PERMISSION
                    : isCancelled
                      ? 'Payment is cancelled.'
                      : `Cannot change payment in status: ${statusLabel}.`;
                const cancelTooltip = canCancel
                  ? 'Cancel Payment'
                  : isViewOnly
                    ? PERMISSION_MESSAGES.VIEW_ONLY
                    : !useModulePaymentMade?.edit || !accessRoles?.isAccountant
                      ? PERMISSION_MESSAGES.NO_PERMISSION
                      : isCancelled
                        ? 'Payment is already cancelled.'
                        : `Cannot cancel in status: ${statusLabel}.`;
                const applyToBillTooltip = canApplyToBill
                  ? 'Apply to Bill'
                  : isViewOnly
                    ? PERMISSION_MESSAGES.VIEW_ONLY
                    : !useModulePaymentMade?.edit
                      ? PERMISSION_MESSAGES.NO_PERMISSION
                      : isCancelled
                        ? 'Payment is cancelled.'
                        : record?.status !== 'APPROVED'
                          ? `Cannot apply to bill in status: ${statusLabel}.`
                          : 'No available balance to apply to bill.';
                const refundTooltip = canRefund
                  ? 'Refund'
                  : isViewOnly
                    ? PERMISSION_MESSAGES.VIEW_ONLY
                    : !useModulePaymentMade?.edit
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
                        const markAsDisabled = !canApprove || submitLoading || rejectLoading;
                        const cancelDisabled = !canCancel || cancelLoading;
                        const refundDisabled = !canRefund || submitLoading;
                        const applyToBillDisabled = !canApplyToBill || submitLoading;

                        return (
                          <div className="bg-white shadow-lg rounded-lg border border-gray-200 flex flex-col w-56 py-1">
                            {/* Status Actions */}
                            <div className="px-2 py-1">
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">Status Actions :</div>
                            </div>

                            {/* Approve */}
                            <Tooltip title={canApprove ? 'Approve Payment' : statusChangeTooltip} placement="left">
                              <button
                                type="button"
                                onClick={
                                  markAsDisabled
                                    ? undefined
                                    : () => {
                                        handleApprovedModalClick(record?.id);
                                        setOpenDropdownId(null);
                                      }
                                }
                                disabled={markAsDisabled}
                                className={`
        w-full px-3 py-2 text-left text-sm flex items-center
        transition-colors duration-150
        ${markAsDisabled ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-gray-700 hover:bg-green-50 hover:text-green-800 cursor-pointer'}
      `}
                              >
                                {approveLoading ? (
                                  <span className="flex items-center gap-2">
                                    <CustomLoader variant="button" text="Updating..." />
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-2">
                                    <Icons.CheckCircleOutlined className={markAsDisabled ? 'text-gray-400' : 'text-green-800'} style={{ fontSize: 14 }} />
                                    Approve
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
                                        handleApprovedModalClick(record?.id);
                                        setOpenDropdownId(null);
                                      }
                                }
                                disabled={markAsDisabled}
                                className={`
        w-full px-3 py-2 text-left text-sm flex items-center
        transition-colors duration-150
        ${markAsDisabled ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-gray-700 hover:bg-red-50 hover:text-red-800 cursor-pointer'}
      `}
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

                            <div className="border-t border-gray-200 my-1"></div>

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
                                className={`
        w-full px-3 py-2 text-left text-sm flex items-center
        transition-colors duration-150
        ${cancelDisabled ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-gray-700 hover:bg-rose-50 hover:text-rose-800 cursor-pointer'}
      `}
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
                                        handleRefundPaymentMade(record);
                                        setOpenDropdownId(null);
                                      }
                                }
                                disabled={refundDisabled}
                                className={`
        w-full px-3 py-2 text-left text-sm flex items-center gap-2
        transition-colors duration-150
        ${refundDisabled ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 cursor-pointer'}
      `}
                              >
                                <Icons.DollarOutlined className={refundDisabled ? 'text-gray-400' : 'text-emerald-600'} style={{ fontSize: 16 }} />
                                <span>Refund</span>
                              </button>
                            </Tooltip>

                            <div className="border-t border-gray-200 my-1"></div>

                            {/* Apply To Bill */}
                            <div className="px-2 py-1">
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">Apply :</div>
                            </div>

                            <Tooltip title={applyToBillTooltip} placement="left">
                              <button
                                type="button"
                                onClick={
                                  applyToBillDisabled
                                    ? undefined
                                    : () => {
                                        handleApplyToBill(record);
                                        setOpenDropdownId(null);
                                      }
                                }
                                disabled={applyToBillDisabled}
                                className={`
        w-full px-3 py-2 text-left text-sm flex items-center gap-2
        transition-colors duration-150
        ${applyToBillDisabled ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-gray-700 hover:bg-purple-50 hover:text-purple-600 cursor-pointer'}
      `}
                              >
                                <Icons.SwapOutlined className={applyToBillDisabled ? 'text-gray-400' : 'text-purple-500'} style={{ fontSize: 16 }} />
                                <span>to Bill</span>
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
            setFile(null);
            setPaymentPDF([]);
            setApprovalModal({
              visible: false,
              paymentId: null,
              approvalNote: '',
              pdcChequeDate: dayjs().format('YYYY-MM-DD'),
              chequeApprovalNote: '',
            });
          }
        }}
        title="Approve Payment"
      >
        <p>Enter Transaction Details and click on Approve to proceed with the payment.</p>
        {selectedRecord?.attachments?.length > 0 && <AttachMentDetails data={selectedRecord} />}
        <Upload.Dragger
          multiple={false}
          accept=".jpeg,.jpg,.png,.svg,.pdf"
          showUploadList={false}
          beforeUpload={file => {
            if (file) {
              setPaymentPDF([]);
              const newFile = {
                uid: file.uid,
                name: file.name,
                status: 'done',
                url: URL.createObjectURL(file),
                originFileObj: file,
              };
              handleFileUpload(file);
              setFile([newFile]);
            }
            return false;
          }}
          fileList={file || []}
          className="custom-upload font-normal"
        >
          <Button className="w-full !h-32 border-dashed flex flex-col items-center justify-center gap-2">
            <div>
              <Icons.CloudUploadOutlined className="text-2xl" />
            </div>
            <div className="font-bold text-xs">Choose a File or Drag & Drop it here</div>
            <div className="text-xs">Supported File Types : JPEG, PNG, SVG and PDF</div>
          </Button>
        </Upload.Dragger>
        {file?.[0] && (
          <div className="mt-2 flex items-center justify-between gap-3 rounded-md border border-gray-200 bg-white px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              {file?.[0]?.originFileObj?.type?.startsWith('image/') ? (
                <img src={file?.[0]?.url} alt={file?.[0]?.name || 'preview'} className="h-9 w-9 rounded border border-gray-200 object-cover bg-gray-50" />
              ) : (
                <div className="h-9 w-9 rounded border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-600">
                  {file?.[0]?.originFileObj?.type === 'application/pdf' || file?.[0]?.name?.toLowerCase()?.endsWith('.pdf') ? <Icons.FileTextOutlined /> : <Icons.FileOutlined />}
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium text-gray-800 truncate">{file?.[0]?.name || 'Attachment'}</span>
                  <Tag className="text-[10px] leading-4">{(file?.[0]?.originFileObj?.type || file?.[0]?.name?.split('.')?.pop() || 'file')?.toString()}</Tag>
                </div>
                {file?.[0]?.url && (
                  <a style={{ color: colorPalette.primary[500] }} className="text-xs" href={file?.[0]?.url} target="_blank" rel="noreferrer">
                    View
                  </a>
                )}
              </div>
            </div>

            <Button
              size="small"
              type="text"
              danger
              className="!px-2"
              onClick={() => {
                try {
                  if (file?.[0]?.url) URL.revokeObjectURL(file[0].url);
                } catch (e) {
                  // ignore
                }
                setFile(null);
                setPaymentPDF([]);
              }}
              icon={<Icons.DeleteOutlined />}
            />
          </div>
        )}
        <TextArea
          className="mt-5"
          rows={4}
          placeholder="Enter transaction details"
          value={approvalModal.approvalNote}
          onChange={e => setApprovalModal(prev => ({ ...prev, approvalNote: e.target.value }))}
        />

        {selectedRecord?.paymentMode?.toLowerCase() === PAYMENT_MODES.CHEQUE?.toLocaleLowerCase() && (
          <>
            <div className="relative pt-1.5">
              <div className="mb-1">PDC Cheque Date</div>
              <DatePicker
                value={approvalModal?.pdcChequeDate ? dayjs(approvalModal?.pdcChequeDate, 'YYYY-MM-DD') : null}
                onChange={(_pdcChequeDate, dateString) => setApprovalModal(prev => ({ ...prev, pdcChequeDate: dateString }))}
                format="YYYY-MM-DD"
                className="w-full py-1.5 h-[35.5px]"
                placeholder="Select PDC Cheque Date"
              />
            </div>
            <div className="relative pt-1.5">
              <div className="mb-1">Cheque Approval Note</div>
              <TextArea
                rows={3}
                placeholder="Enter cheque approval note"
                value={approvalModal.chequeApprovalNote}
                onChange={e => setApprovalModal(prev => ({ ...prev, chequeApprovalNote: e.target.value }))}
              />
            </div>
          </>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <Button
            key="back"
            onClick={() => {
              setApprovalModal({
                visible: false,
                paymentId: null,
                approvalNote: '',
                pdcChequeDate: dayjs().format('YYYY-MM-DD'),
                chequeApprovalNote: '',
              });
              setFile(null);
              setPaymentPDF([]);
            }}
          >
            Go Back
          </Button>
          <Button key="link" type="primary" danger loading={rejectLoading} onClick={handleRejectPayment} style={{ minWidth: 80 }}>
            Reject
          </Button>
          <Button key="submit" type="primary" loading={approveLoading} onClick={handleApprovePayment} style={{ minWidth: 90 }}>
            Approve
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
      <DocumentConfirmModal modal={deleteModal} docType={MODULE_NAMES?.PAYMENT_MADE} onConfirm={deletePaymentMade} loading={deleteLoading} getDocumentDetails={getPaymentMadeDocumentDetails} />
      <ApplyToBillModal
        modalOpen={showApplyToBillModal}
        onClose={() => {
          setShowApplyToBillModal(false);
          setSelectedRecord(null);
        }}
        paymentMadeDetails={selectedRecord}
        fetchPaymentMade={fetchPaymentMade}
      />
      <RefundPaymentModal
        variant="paymentMade"
        modalOpen={showRefundPaymentMadeModal}
        onClose={() => setShowRefundPaymentMadeModal(false)}
        paymentDetails={selectedRecord}
        fetchPayment={fetchPaymentMade}
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
          title="Auto Adjust Advance Payments to Bills"
        >
          <div className="text-sm text-gray-700">
            <p className="text-gray-600 mb-3">
              For each <span className="font-medium text-gray-800">vendor</span>, amounts are applied in this order:
            </p>
            <ol className="list-decimal pl-5 space-y-2.5 mb-4 text-gray-800">
              <li>
                <span className="font-semibold text-gray-900">Opening payable balance:</span>{' '}
                <span className="text-gray-600">uses pending opening payable amount for that branch (when it exists).</span>
              </li>
              <li>
                <span className="font-semibold text-gray-900">Unused advance payments:</span> <span className="text-gray-600"> approved advance payments that still have balance left.</span>
              </li>
            </ol>
            <p className="text-gray-600 mb-4 pl-0.5 leading-relaxed">
              Open bills are matched by <span className="font-medium text-gray-800">due date</span> (oldest first).
            </p>
            <div className="space-y-2 mb-4">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name={'customerId'}
                label={'Vendor'}
                placeHolder={'Select Vendor'}
                selectVariant="twoColumn"
                columnSelectHeader={vendorSelectColumnHeader}
                selectPopupClassName={customerSelectDropdownProps.selectPopupClassName}
                selectionOptions={buildCustomerSelectOptions(vendorDropDownList)}
                value={autoApplyFilter?.customerId}
                setFilter={handleAutoApplyFilter}
                allowClear={true}
                loading={vendorLoading}
                getPopupContainer={trigger => trigger.parentNode}
                onFocus={() => {
                  if (!isApicalledRefFilter.current.vendorDropdown) {
                    handleOnFocusApiCall(API_CALLED_ENUM.VENDOR_DROPDOWN);
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
                onClick={handleConfirmAutoApplyPaymentMade}
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
              <p className="text-sm text-red-700 mt-1">Some bills could not be adjusted automatically. Please review the summary below, resolve the issue, and run Auto Adjust again.</p>
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
        columns={columnsList}
        setColumnsList={setColumnsList}
        setCutomizedColumns={setCutomizedColumns}
        configPage={configEnum?.PAYMENT_MADE_CONFIG}
        modalOpen={showColumnModal}
        setModalOpen={setShowColumnModal}
      />
      <ViewDocumentListToolbarModals {...toolbarModalsProps} />
    </div>
  );
};

export default ViewPaymentMades;
