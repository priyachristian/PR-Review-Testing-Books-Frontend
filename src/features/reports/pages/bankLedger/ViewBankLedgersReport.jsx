import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';

// Components
import { Button, Dropdown, Space, Tag } from '@/components/AntDComponent';
import CustomButton from '@/components/ui/button/CustomButton';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomDatePicker from '@/components/forms/formDatePicker/CustomDatePicker';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import FilterInput from '@/components/forms/formInput/FilterInput';
import ExportReportModal from '@/components/feedback/formModal/ExportReportModal';

import { renderPdfToBlob } from '@/utils/loadReactPdf';

// Hooks
import { useBank } from '@/features/banking/banks/useBank';
import useModulePermissions from 'hooks/useModulePermissions';
import { useProfile } from '@/features/setting/profile/useProfile';

// Extras
import { useReport, clearBankData, reportService } from '@/features/reports';
import Icons from 'assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { filterInputEnum, PERMISSION_MESSAGES } from 'utils/constants';
import { dateFormateForBackend, dateFormateForUi, getPresetDateRange, getQueryParams } from 'utils/services';
import { formatAmount } from '@/utils/currency';
import { CommonFilterTags } from '@/utils/filtersUtils';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '@/utils/pagination';
import { buildDivisionSelectOptions, buildBranchSelectOptions, divisionSelectColumnHeader, branchSelectColumnHeader } from '@/utils/tableSelectDropdown/orgSelectDropdown';

const buildBankLedgerTableRows = (bankLedger, pagination, currentPage, sortOrder = 'desc') => {
  if (!bankLedger?.length) return [];

  const totalPages = pagination?.totalPages || 1;
  const rows = [...bankLedger];
  const isDesc = sortOrder === 'desc';

  if (currentPage === 1) {
    rows.unshift({
      isBalanceRow: true,
      label: isDesc ? 'Closing Balance' : 'Opening Balance',
      availableBalance: isDesc ? (pagination?.closingBalance ?? 0) : (pagination?.openingBalance ?? 0),
    });
  } else {
    rows.unshift({
      isBalanceRow: true,
      label: 'Brought Forward',
      availableBalance: pagination?.broughtForward ?? 0,
    });
  }

  if (currentPage !== totalPages) {
    rows.push({
      isBalanceRow: true,
      label: 'Carried Over',
      availableBalance: pagination?.carriedOver ?? 0,
    });
  } else {
    rows.push({
      isBalanceRow: true,
      label: isDesc ? 'Opening Balance' : 'Closing Balance',
      availableBalance: isDesc ? (pagination?.openingBalance ?? 0) : (pagination?.closingBalance ?? 0),
    });
  }

  return rows;
};

const API_CALLED_ENUM = {
  BANK_DROPDOWN: 'bankDropdown',
  DIVISION_DROPDOWN: 'divisionDropdown',
  BRANCH_DROPDOWN: 'branchDropdown',
};

const ViewBankLedgersReport = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const getcustomDates = () => {
    if (searchParams?.get('startDate') && searchParams?.get('endDate')) {
      return [searchParams?.get('startDate'), searchParams?.get('endDate')];
    }
    if (searchParams?.get('orderDate')) {
      return [searchParams?.get('orderDate'), searchParams?.get('orderDate')];
    }
    return null;
  };
  const [selectedPreset, setSelectedPreset] = useState(searchParams?.get('preset') || 'custom');
  const [dateRange, setDateRange] = useState(selectedPreset === 'custom' || selectedPreset === 'specific' ? getcustomDates() : getPresetDateRange(selectedPreset));
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedExportFormat, setSelectedExportFormat] = useState('pdf');
  const { profile, getProfile } = useProfile();
  const { isViewOnly, isSplitSessionActive, divDrop, divisionLoading, getDivDropDown, allBranchDrop, allBranchLoading, getAllBranchDropDown } = useModulePermissions(RESOURCES.REPORTS);
  const { useModuleBankLedger } = useModulePermissions(RESOURCES.REPORT_PERMISSIONS.BANK_LEDGER);
  const { bankDropdown, droploading: bankLoading, getBankDropDown } = useBank();
  const { bankLedger, loading, getBankLedger, pagination } = useReport();
  const isApicalledRefFilter = useRef({
    bankDropdown: false,
    divisionDropdown: false,
    branchDropdown: false,
  });
  const [filter, setFilter] = useState({
    bank: searchParams?.get('accountId') || '',
    division: searchParams.get('division')?.split(',') || '',
    branch: searchParams.get('branch')?.split(',') || '',
  });
  const [errors, setErrors] = useState({ bank: '' });
  const [showFilter, setShowFilter] = useState(!searchParams?.get('accountId'));

  const selectedBankId = searchParams?.get('accountId');

  let selectedBankName = '';
  let selectedBank = null;

  if (selectedBankId && bankDropdown?.length) {
    const bank = bankDropdown?.find(b => String(b.id) === String(selectedBankId));

    if (bank) {
      selectedBank = bank;
      selectedBankName = bank?.accountName || '';
    }
  }
  const bankCurrency = selectedBank?.currency ?? null;

  const updateUrlParams = newParams => {
    const params = new URLSearchParams(searchParams);

    if (!dateRange) {
      params.delete('startDate');
      params.delete('endDate');
    }

    Object.entries(newParams).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          params.set(key, value.join(','));
        } else {
          params.delete(key);
        }
      } else if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    setSearchParams(params);
  };

  const fetchBankLedgerForExport = async () => {
    let payload = getQueryParams(window.location.href) || {};
    const response = await reportService.getBankLedger({
      ...payload,
      isSplit: isSplitSessionActive ? true : false,
      pagination: false,
      sortOrder: payload.sortOrder || 'desc',
    });
    return {
      records: response?.data || [],
      openingBalance: response?.extras?.openingBalance ?? 0,
      closingBalance: response?.extras?.closingBalance ?? 0,
    };
  };

  const downloadPdf = async (records, filename = 'report.pdf', balances = {}) => {
    await getProfile({});
    const safeName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    const { BankLedgerReportPdf } = await import('@smit9313/abss-pdf');
    const blob = await renderPdfToBlob(
      <BankLedgerReportPdf
        records={records}
        profile={profile}
        selectedBankName={selectedBankName}
        accountNumber={selectedBank?.accountType === 'Bank' ? selectedBank?.accountNumber || '' : ''}
        startDate={searchParams?.get('startDate') || ''}
        endDate={searchParams?.get('endDate') || ''}
        openingBalance={balances.openingBalance ?? pagination?.openingBalance ?? 0}
        closingBalance={balances.closingBalance ?? pagination?.closingBalance ?? 0}
        bankCurrency={bankCurrency}
      />
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = safeName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadExcel = async (filename = 'BankLedgerReport.xlsx', exportData = null) => {
    const XLSX = await import('xlsx');
    const exportRecords = exportData?.records || bankLedger || [];
    const exportOpening = exportData?.openingBalance ?? pagination?.openingBalance ?? 0;
    const exportClosing = exportData?.closingBalance ?? pagination?.closingBalance ?? 0;
    const tableDataWithBalances = buildBankLedgerTableRows(
      exportRecords,
      {
        openingBalance: exportOpening,
        closingBalance: exportClosing,
        totalPages: 1,
      },
      1,
      currentSortOrder
    );

    const excelData = tableDataWithBalances.map(row => {
      if (row.isBalanceRow) {
        return {
          'Bank Date': '',
          'Transaction Details': row.label,
          Effect: '',
          'Document No': '',
          Amount: '',
          'Available Balance': row.availableBalance,
          Branch: '',
          Division: '',
          Notes: '',
        };
      }

      return {
        'Bank Date': dateFormateForUi(row.date),
        'Transaction Details': row?.partyName || row?.narration || '',
        Effect: row.effectType,
        'Document No': row.documentNo,
        Amount: (row.effectType === 'OUT' ? '' : row.effectType === 'IN' ? '+' : '') + (row.amount ?? 0),
        'Available Balance': row.availableBalance,
        Branch: row?.branchId?.name || '',
        Division: row?.divisionId?.name || '',
        Notes: row?.narration || '',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'BankLedger');

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const canExportReport = useModuleBankLedger?.export && !isViewOnly;
  const exportTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : !useModuleBankLedger?.export ? PERMISSION_MESSAGES.NO_PERMISSION : undefined;
  const printTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : !useModuleBankLedger?.export ? PERMISSION_MESSAGES.NO_PERMISSION : undefined;

  const handleMenuClick = e => {
    if (!canExportReport) return;
    const format = e.key === '1' ? 'pdf' : 'xlsx';
    setSelectedExportFormat(format);
    setExportModalOpen(true);
  };

  const items = [
    {
      label: 'PDF',
      key: '1',
    },
    {
      label: 'XLSX',
      key: '2',
    },
  ];
  const menuProps = {
    items,
    onClick: handleMenuClick,
  };

  const handleClear = () => {
    setDateRange(null);
    setFilter({ ...filter, bank: '', division: '', branch: '' });
    setSelectedPreset('custom');
    dispatch(clearBankData());
    setShowFilter(true);
    updateUrlParams({
      preset: '',
      startDate: '',
      endDate: '',
      accountId: '',
      division: '',
      branch: '',
      page: '',
      limit: '',
    });
  };

  useEffect(() => {
    if (!filter.bank) {
      handleClear();
    }
  }, [filter.bank]);

  const handleFilter = async () => {
    if (!filter?.bank) {
      setErrors({
        ...errors,
        bank: 'bank is requried',
      });
      return;
    }

    const startDate = dateFormateForBackend(dateRange?.[0]);
    const endDate = dateFormateForBackend(dateRange?.[1]);
    let updatedFilters = {
      accountId: filter?.bank,
      division: filter?.division,
      branch: filter?.branch,
      page: DEFAULT_PAGE,
      limit: Number(searchParams?.get('limit')) || pagination?.limit || DEFAULT_PAGE_SIZE,
    };

    if (dateRange) {
      updatedFilters = {
        ...updatedFilters,
        preset: selectedPreset,
        startDate: startDate,
        endDate: endDate,
      };
    }

    setShowFilter(false);
    updateUrlParams(updatedFilters);
  };

  const handlePaginationChange = (nextPage, nextPageSize) => {
    updateUrlParams({ page: nextPage, limit: nextPageSize });
  };

  const handleTableChange = (_, __, sorter, extra) => {
    if (extra?.action && extra.action !== 'sort') return;
    if (sorter?.columnKey !== 'date') return;
    const activeSortOrder = searchParams?.get('sortOrder') || 'desc';
    const newSortOrder = activeSortOrder === 'desc' ? 'asc' : 'desc';
    updateUrlParams({ sortOrder: newSortOrder, page: DEFAULT_PAGE });
  };

  const fetchBanks = () => {
    let payload = getQueryParams(window.location.href);
    payload = payload || {};

    getBankLedger({
      ...payload,
      isSplit: isSplitSessionActive ? true : false,
      pagination: true,
      page: Number(payload.page) || DEFAULT_PAGE,
      limit: Number(payload.limit) || DEFAULT_PAGE_SIZE,
      sortOrder: payload.sortOrder || 'desc',
    });
  };

  useEffect(() => {
    const controller = new AbortController();

    return () => {
      controller.abort();
      dispatch(clearBankData());
    };
  }, [isSplitSessionActive]);

  const handleOnFocusApiCall = async type => {
    let obj = { ...isApicalledRefFilter.current };

    if (type === API_CALLED_ENUM.BANK_DROPDOWN) {
      await getBankDropDown({});
      obj.bankDropdown = true;
    }

    if (type === API_CALLED_ENUM.DIVISION_DROPDOWN) {
      await getDivDropDown({});
      obj.divisionDropdown = true;
    }

    if (type === API_CALLED_ENUM.BRANCH_DROPDOWN) {
      await getAllBranchDropDown({});
      obj.branchDropdown = true;
    }

    isApicalledRefFilter.current = obj;
  };

  useEffect(() => {
    if (searchParams.get('accountId')) {
      handleOnFocusApiCall(API_CALLED_ENUM.BANK_DROPDOWN);
    }
  }, []);

  useEffect(() => {
    if (searchParams.get('division')) {
      handleOnFocusApiCall(API_CALLED_ENUM.DIVISION_DROPDOWN);
    }
  }, []);

  useEffect(() => {
    if (searchParams.get('branch')) {
      handleOnFocusApiCall(API_CALLED_ENUM.BRANCH_DROPDOWN);
    }
  }, []);

  useEffect(() => {
    if (filter?.bank) {
      fetchBanks();
    }
  }, [searchParams, isSplitSessionActive]);

  const currentPage = Number(searchParams?.get('page')) || DEFAULT_PAGE;
  const currentSortOrder = searchParams?.get('sortOrder') || 'desc';
  const tableDataWithBalances = buildBankLedgerTableRows(bankLedger, pagination, currentPage, currentSortOrder);

  const columns = [
    {
      title: 'Bank Date',
      dataIndex: 'date',
      key: 'date',
      render: date => (date ? dateFormateForUi(date) : ''),
      align: 'left',
      sorter: true,
      sortOrder: currentSortOrder === 'desc' ? 'descend' : 'ascend',
      sortDirections: ['descend', 'ascend', 'descend'],
    },
    {
      title: 'Transaction Details',
      key: 'transactionDetails',
      align: 'left',
      render: (_, record) => {
        if (record?.isBalanceRow) return <strong>{record.label}</strong>;
        return record?.partyName || record?.narration || '';
      },
    },
    {
      title: 'Effect',
      dataIndex: 'effectType',
      key: 'effectType',
      render: (_, record) => {
        const { effectType } = record;
        if (record?.isBalanceRow || !effectType) return '';

        let color = 'default';
        if (effectType === 'OUT') color = 'red';
        else if (effectType === 'IN') color = 'green';

        return <Tag color={color}>{effectType}</Tag>;
      },
      align: 'right',
    },
    {
      title: 'Document',
      dataIndex: 'referenceType',
      key: 'referenceType',
      align: 'right',
      render: referenceType => referenceType || '',
    },
    {
      title: 'Doc no.',
      dataIndex: 'documentNo',
      key: 'documentNo',
      align: 'right',
    },
    {
      title: 'Branch',
      dataIndex: 'branchId',
      key: 'branchId',
      align: 'right',
      render: branchId => branchId?.name || '',
    },
    {
      title: 'Division',
      dataIndex: 'divisionId',
      key: 'divisionId',
      align: 'right',
      render: divisionId => divisionId?.name || '',
    },
    {
      title: 'Amount',
      key: 'amount',
      align: 'right',
      fixed: 'right',
      width: 120,
      className: 'shadow',
      render: (_, record) => {
        if (record?.isBalanceRow) return '';
        const { amount, effectType } = record;
        const prefix = effectType === 'OUT' ? '' : effectType === 'IN' ? '+' : '';
        const colorClass = effectType === 'OUT' ? 'text-red-600' : effectType === 'IN' ? 'text-green-600' : 'text-black';

        return <span className={colorClass}>{amount != null ? `${prefix}${formatAmount(amount, true, bankCurrency)}` : ''}</span>;
      },
    },
    {
      title: 'Available Balance',
      dataIndex: 'availableBalance',
      key: 'availableBalance',
      fixed: 'right',
      width: 180,
      render: (availableBalance, record) => {
        if (record?.isBalanceRow) {
          return <span className="font-bold">{formatAmount(availableBalance, true, bankCurrency)}</span>;
        }
        return formatAmount(availableBalance, true, bankCurrency);
      },
      align: 'right',
    },
  ];

  // Where each ledger sourceModule's document lives, same idea as a General Ledger drill-down.
  const SOURCE_MODULE_ROUTES = {
    PAYMENT_RECEIVED: id => `/payments-received/${id}`,
    PAYMENT_MADE: id => `/payments-made/${id}`,
    EXPENSE: id => `/expenses/${id}`,
    CREDIT_NOTE: id => `/credit-notes/${id}`,
    DEBIT_NOTE: id => `/debit-notes/${id}`,
    MANUAL_JOURNAL: id => `/manual-journal/${id}`,
    BANK_TRANSFER: () => `/bank-transfer-logs`,
  };

  const handleRowClick = record => {
    if (record?.isBalanceRow) return;
    const route = SOURCE_MODULE_ROUTES[record?.sourceModule];
    if (route) navigate(route(record?.documentId));
  };

  const handleExport = async (format, filename) => {
    const exportData = await fetchBankLedgerForExport();
    if (format === 'pdf') {
      await downloadPdf(exportData.records, filename, exportData);
    } else if (format === 'xlsx') {
      await downloadExcel(filename, exportData);
    }
  };

  const handlePrint = async () => {
    if (!canExportReport) return;
    const exportData = await fetchBankLedgerForExport();
    await getProfile({});
    const { BankLedgerReportPdf } = await import('@smit9313/abss-pdf');
    const blob = await renderPdfToBlob(
      <BankLedgerReportPdf
        records={exportData.records}
        profile={profile}
        selectedBankName={selectedBankName}
        accountNumber={selectedBank?.accountType === 'Bank' ? selectedBank?.accountNumber || '' : ''}
        startDate={searchParams?.get('startDate') || ''}
        endDate={searchParams?.get('endDate') || ''}
        openingBalance={exportData.openingBalance}
        closingBalance={exportData.closingBalance}
        bankCurrency={bankCurrency}
      />
    );

    const blobUrl = URL.createObjectURL(blob);

    // Create a hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = blobUrl;

    document.body.appendChild(iframe);

    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      iframe.contentWindow?.addEventListener('afterprint', () => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(blobUrl);
      });
    };
  };

  return (
    <div className="-m-4">
      <div className="flex justify-between items-center bg-white border-b border-gray-200 container-spacing sticky-page-header">
        <div className="flex items-center gap-3">
          <CustomButton
            type="default"
            text={<Icons.ArrowLeftOutlined />}
            onClick={() => {
              navigate('/reports');
            }}
          />
          <p className="font-bold text-[1.125rem]">Bank Ledger</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              setShowFilter(!showFilter);
            }}
          >
            {showFilter ? 'Hide Filters' : 'View Filters'}
          </Button>
          {bankLedger?.length > 0 && (
            <>
              <PermissionButton
                canAccess={useModuleBankLedger?.export}
                isViewOnly={isViewOnly}
                tooltipTitle={printTooltip}
                tooltipProps={{ placement: 'bottom' }}
                type="default"
                size="middle"
                icon={<Icons.PrinterOutlined className="mr-2" />}
                className="flex items-center"
                onClick={handlePrint}
              >
                Print
              </PermissionButton>
              <Dropdown menu={menuProps} trigger={['click']} disabled={!canExportReport} open={canExportReport ? undefined : false}>
                <PermissionButton canAccess={useModuleBankLedger?.export} isViewOnly={isViewOnly} tooltipTitle={exportTooltip} tooltipProps={{ placement: 'bottom' }} className="flex items-center">
                  <Space>Export Report</Space>
                </PermissionButton>
              </Dropdown>
            </>
          )}
        </div>
      </div>

      <div>
        {showFilter && (
          <div className="bg-white">
            <div className="container-spacing ">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-5 gap-4 items-center">
                <div className="space-y-2 lg:col-span-2">
                  <CustomDatePicker selectedPreset={selectedPreset} setSelectedPreset={setSelectedPreset} dateRange={dateRange} setDateRange={setDateRange} />
                </div>
                <div className="space-y-2 relative mt-1">
                  <FilterInput
                    type={filterInputEnum?.SELECT}
                    name={'bank'}
                    label={'Bank '}
                    placeHolder={'Select Bank'}
                    dropdownStyle={{ minWidth: 500, width: 'min(500px, 70vw)', borderRadius: 0 }}
                    selectionOptions={(bankDropdown || []).map(option => ({
                      label: option?.accountName,
                      value: option.id,
                      rightContent: formatAmount(option?.availableBalance ?? 0, true, option?.currency),
                    }))}
                    value={filter?.bank}
                    setFilter={setFilter}
                    allowClear={true}
                    required={true}
                    loading={bankLoading}
                    onFocus={() => {
                      if (!isApicalledRefFilter.current.bankDropdown) {
                        handleOnFocusApiCall(API_CALLED_ENUM.BANK_DROPDOWN);
                      }
                    }}
                  />
                  {errors.bank && !filter.bank && <div className="text-red-500 text-[10px] absolute right-1 -bottom-3">{errors.bank}</div>}
                </div>
                <div className="flex flex-col sm:flex-row sm:space-x-3 lg:justify-end space-y-2 sm:space-y-0 lg:col-span-2 mt-[22px]">
                  {/* <Button
                  onClick={() => {
                    setShowFilter(!showFilter);
                  }}
                >
                  {showFilter ? 'Hide Filters' : 'View Filters'}
                </Button> */}
                  <Button onClick={handleClear} className="p-[17px] w-full sm:w-auto">
                    Reset All
                  </Button>
                  <Button type="primary" icon={<Icons.FilterOutlined />} size="middle" className="p-[17px] w-full sm:w-auto" onClick={handleFilter}>
                    Apply Filters
                  </Button>
                </div>
              </div>
            </div>
            <div className="container-spacing bg-white border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 xl:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <FilterInput
                    type={filterInputEnum?.SELECT}
                    name={'division'}
                    label={'Division'}
                    mode="multiple"
                    placeHolder={'Select Division'}
                    selectVariant="twoColumn"
                    columnSelectHeader={divisionSelectColumnHeader}
                    selectionOptions={buildDivisionSelectOptions(divDrop)}
                    value={filter?.division}
                    setFilter={setFilter}
                    allowClear={false}
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
                    selectionOptions={buildBranchSelectOptions((allBranchDrop || []).filter(branch => filter?.division?.includes(branch?.divisionId?.id)))}
                    value={filter?.branch}
                    setFilter={setFilter}
                    allowClear={false}
                    disabled={!filter?.division}
                    loading={allBranchLoading}
                    onFocus={() => {
                      if (!isApicalledRefFilter.current.branchDropdown) {
                        handleOnFocusApiCall(API_CALLED_ENUM.BRANCH_DROPDOWN);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
        <CommonFilterTags
          searchParams={searchParams}
          setFilter={setFilter}
          updateUrlParams={updateUrlParams}
          handleClear={handleClear}
          handleResetFilters={handleClear}
          dateKeys={{
            startDateKey: 'startDate',
            endDateKey: 'endDate',
            singleDateKey: 'orderDate',
          }}
          onDateClear={() => {
            setSelectedPreset('custom');
            setDateRange(null);
            updateUrlParams({
              startDate: null,
              endDate: null,
              orderDate: null,
              preset: null,
            });
          }}
          divDrop={divDrop}
          branchDrop={allBranchDrop}
          extraFilters={{
            accountId: {
              label: 'Bank',
              format: value => {
                const bank = bankDropdown?.find(b => String(b?.id) === String(value)) || {};
                if (!bank) return value;
                // Same label logic as filter dropdown
                return bank?.accountName || null;
              },
              clear: (setFilter, updateUrlParams) => {
                setFilter(prev => ({
                  ...prev,
                  bank: '',
                  division: '',
                  branch: '',
                }));
                updateUrlParams({
                  accountId: null,
                  division: null,
                  branch: null,
                });
              },
            },
          }}
        />
        {/* <div className="my-container container-spacing mb-5 rounded-md">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full text-center text-sm font-medium text-gray-700">
            <div className="border-b-2 border-blue-500 py-3 bg-gray-100 rounded-md shadow-md">
              <div className="uppercase text-gray-500 text-xs tracking-wide">Payment Received</div>
              <div className="text-base text-gray-900 font-semibold">
                {" "}
                {bankLedger?.paymentReceived || "0 / 0"}
              </div>
            </div>

            <div className="border-b-2 border-blue-500 py-3 bg-gray-100 rounded-md shadow-md">
              <div className="uppercase text-gray-500 text-xs tracking-wide">Payment Pay</div>
              <div className="text-base text-gray-900 font-semibold">2 / 4000</div>
            </div>

            <div className="border-b-2 border-blue-500 py-3 bg-gray-100 rounded-md shadow-md">
              <div className="uppercase text-gray-500 text-xs tracking-wide">
                Total Pay Received
              </div>
              <div className="text-base text-gray-900 font-semibold">59000</div>
            </div>

            <div className="border-b-2 border-blue-500 py-3 bg-gray-100 rounded-md shadow-md">
              <div className="uppercase text-gray-500 text-xs tracking-wide">
                Bank to Bank Transfer
              </div>
              <div className="text-base text-gray-900 font-semibold">59000</div>
            </div>
          </div>
        </div> */}

        <div className="">
          <div>
            <CustomTable
              columns={columns}
              data={tableDataWithBalances}
              onRowClick={handleRowClick}
              loading={loading}
              onChange={handleTableChange}
              pagination={
                pagination?.totalResults > 0
                  ? {
                      current: currentPage,
                      pageSize: Number(searchParams?.get('limit')) || pagination?.limit || DEFAULT_PAGE_SIZE,
                      total: pagination?.totalResults || 0,
                      onChange: handlePaginationChange,
                    }
                  : false
              }
              isPaginationFixed={false}
            />
          </div>
        </div>
      </div>

      <ExportReportModal
        modalOpen={exportModalOpen}
        setModalOpen={setExportModalOpen}
        reportName="bank_ledger"
        entity={bankDropdown.find(bank => bank.id === selectedBankId)?.accountName || ''}
        onExport={handleExport}
        initialFormat={selectedExportFormat}
        title="Export Report"
        formats={['pdf', 'xlsx']}
      />
    </div>
  );
};

export default ViewBankLedgersReport;
