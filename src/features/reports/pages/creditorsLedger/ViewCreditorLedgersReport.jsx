import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

// Components
import { Dropdown, Space } from '@/components/AntDComponent';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import ExportReportModal from '@/components/feedback/formModal/ExportReportModal';
import FilterInput from '@/components/forms/formInput/FilterInput';
import CustomDatePicker from '@/components/forms/formDatePicker/CustomDatePicker';
import FilterDrawer, { FilterSection, FilterButton } from '@/components/ui/common/FilterDrawer';

// Hooks
import useModulePermissions from 'hooks/useModulePermissions';
import { useProfile } from '@/features/setting/profile/useProfile';

// Extras
import { useReport, creditorLedgersReportColumn } from '@/features/reports';
import Icons from 'assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { filterInputEnum, PERMISSION_MESSAGES } from 'utils/constants';
import { getQueryParams, dateFormateForBackend, getPresetDateRange } from 'utils/services';
import { renderPdfToBlob } from '@/utils/loadReactPdf';
import { CommonFilterTags, rangePresets, specificPresets } from '@/utils/filtersUtils';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';
import { downloadCreditorsLedgerExcel } from './pdf/CreditorsLedgerReportExcel';
import { buildDivisionSelectOptions, buildBranchSelectOptions, divisionSelectColumnHeader, branchSelectColumnHeader } from '@/utils/tableSelectDropdown/orgSelectDropdown';

const API_CALLED_ENUM = {
  DIVISION_DROPDOWN: 'divisionDropdown',
  BRANCH_DROPDOWN: 'branchDropdown',
};

const ViewCreditorLedgersReport = () => {
  const navigate = useNavigate();
  const { loading, creditorsReport, getCreditorsReport } = useReport();
  const { isViewOnly, isSplitSessionActive, divDrop, divisionLoading, getDivDropDown, allBranchDrop, allBranchLoading, getAllBranchDropDown } = useModulePermissions(RESOURCES.REPORTS);
  const { useModuleCreditorsLedger } = useModulePermissions(RESOURCES.REPORT_PERMISSIONS.CREDITORS_LEDGER);
  const { profile, getProfile } = useProfile();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilter, setShowFilter] = useState(false);
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
  const [currentPageRecords, setCurrentPageRecords] = useState();
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedExportFormat, setSelectedExportFormat] = useState('pdf');
  const [filter, setFilter] = useState({
    search: searchParams.get('search') || '',
    division: searchParams.get('division')?.split(',') || '',
    branch: searchParams.get('branch')?.split(',') || '',
    column: searchParams.get('column') || '',
    withZeroBalance: searchParams?.get('withZeroBalance') || false,
    includeLinkedData: searchParams?.get('includeLinkedData') || false,
  });
  const [selectedPreset, setSelectedPreset] = useState(searchParams?.get('preset') || 'custom');
  const getcustomDates = () => {
    if (searchParams?.get('startDate') && searchParams?.get('endDate')) {
      return [searchParams?.get('startDate'), searchParams?.get('endDate')];
    }
    return null;
  };
  const [dateRange, setDateRange] = useState(selectedPreset === 'custom' || selectedPreset === 'specific' ? getcustomDates() : getPresetDateRange(selectedPreset));
  const isApicalledRefFilter = useRef({
    divisionDropdown: false,
    branchDropdown: false,
  });
  const recordsPerPage = useRef(parseInt(searchParams.get('limit')) || DEFAULT_PAGE_SIZE);
  const prevPageLimitRef = useRef(recordsPerPage.current);
  const getSearchedRecords = records => {
    const searchValue = filter?.search?.trim()?.toLowerCase();
    if (!searchValue) return records || [];

    return (records || []).filter(record => {
      const searchableFields = [record?.customerDisplayName, record?.companyName, record?.bpEmail, record?.customerPhoneNumber];
      return searchableFields?.some(value =>
        String(value || '')
          .toLowerCase()
          .includes(searchValue)
      );
    });
  };
  let finalRecords = getSearchedRecords(creditorsReport);
  let totalPages = Math.max(1, Math.ceil(finalRecords?.length / recordsPerPage.current));

  const getClosingBalance = () => {
    let totalDebit = 0,
      totalCredit = 0,
      splitTotalDebit = 0,
      splitTotalCredit = 0,
      totalDebitsWithSplit = 0,
      totalCreditsWithSplit = 0;

    finalRecords?.forEach(x => {
      if (x?.netPayable > 0) {
        totalCredit = totalCredit + (x?.netPayable || 0);
      } else {
        totalDebit = totalDebit + (x?.netPayable || 0);
      }
      if (x?.splitNetPayable > 0) {
        splitTotalCredit = splitTotalCredit + (x?.splitNetPayable || 0);
      } else {
        splitTotalDebit = splitTotalDebit + (x?.splitNetPayable || 0);
      }
      totalDebitsWithSplit = totalDebitsWithSplit + (x?.totalDebitsWithSplit || 0);
      totalCreditsWithSplit = totalCreditsWithSplit + (x?.totalCreditsWithSplit || 0);
    });

    return {
      customerDisplayName: 'Total',
      totalDebit,
      totalCredit,
      splitTotalDebit,
      splitTotalCredit,
      totalDebitsWithSplit,
      totalCreditsWithSplit,
    };
  };

  const handlePaginationChange = (page, limit) => {
    if (prevPageLimitRef.current !== limit) {
      recordsPerPage.current = limit;
      prevPageLimitRef.current = limit;
    }
    let finalRecords = getSearchedRecords(creditorsReport);
    let totalPages = Math.max(1, Math.ceil(finalRecords?.length / recordsPerPage.current));
    let recordNumberForNextPage = page === 1 ? 0 : (page - 1) * recordsPerPage.current;
    let updatedPageRecords = finalRecords?.slice(recordNumberForNextPage, recordsPerPage.current * page);
    setPage(page);
    updateUrlParams({ page, limit });

    if (page === totalPages) {
      let totalDebit = 0,
        totalCredit = 0,
        splitTotalDebit = 0,
        splitTotalCredit = 0,
        totalDebitsWithSplit = 0,
        totalCreditsWithSplit = 0;

      finalRecords?.forEach(x => {
        if (x?.netPayable > 0) {
          totalCredit = totalCredit + (x?.netPayable || 0);
        } else {
          totalDebit = totalDebit + (x?.netPayable || 0);
        }
        if (x?.splitNetPayable > 0) {
          splitTotalCredit = splitTotalCredit + (x?.splitNetPayable || 0);
        } else {
          splitTotalDebit = splitTotalDebit + (x?.splitNetPayable || 0);
        }
        totalDebitsWithSplit = totalDebitsWithSplit + (x?.totalDebitsWithSplit || 0);
        totalCreditsWithSplit = totalCreditsWithSplit + (x?.totalCreditsWithSplit || 0);
      });

      const prevPageStart = page - 1;
      const prevPageRecords = finalRecords.slice(0, prevPageStart * recordsPerPage.current);

      let prevPageDebit = 0,
        prevPageCredit = 0,
        prevPageSplitDebit = 0,
        prevPageSplitCredit = 0,
        prevPageDebitsWithSplit = 0,
        prevPageCreditsWithSplit = 0;

      prevPageRecords?.forEach(x => {
        if (x?.netPayable > 0) {
          prevPageCredit = prevPageCredit + (x?.netPayable || 0);
        } else {
          prevPageDebit = prevPageDebit + (x?.netPayable || 0);
        }
        if (x?.splitNetPayable > 0) {
          prevPageSplitCredit = prevPageSplitCredit + (x?.splitNetPayable || 0);
        } else {
          prevPageSplitDebit = prevPageSplitDebit + (x?.splitNetPayable || 0);
        }
        prevPageDebitsWithSplit = prevPageDebitsWithSplit + (x?.totalDebitsWithSplit || 0);
        prevPageCreditsWithSplit = prevPageCreditsWithSplit + (x?.totalCreditsWithSplit || 0);
      });

      if (page !== 1) {
        updatedPageRecords.unshift({
          customerDisplayName: 'Brought Forward',
          totalDebit: prevPageDebit,
          totalCredit: prevPageCredit,
          splitTotalDebit: prevPageSplitDebit,
          splitTotalCredit: prevPageSplitCredit,
          totalDebitsWithSplit: prevPageDebitsWithSplit,
          totalCreditsWithSplit: prevPageCreditsWithSplit,
        });
      }

      let closingBalanceArr = [
        {
          customerDisplayName: 'Total',
          totalDebit,
          totalCredit,
          splitTotalDebit,
          splitTotalCredit,
          totalDebitsWithSplit,
          totalCreditsWithSplit,
        },
      ];

      updatedPageRecords.push(...closingBalanceArr);
    } else {
      if (page !== 1) {
        const prevPageStart = page - 1;
        const prevPageRecords = finalRecords.slice(0, prevPageStart * recordsPerPage.current);

        let prevPageDebit = 0,
          prevPageCredit = 0,
          prevPageSplitDebit = 0,
          prevPageSplitCredit = 0,
          prevPageDebitsWithSplit = 0,
          prevPageCreditsWithSplit = 0;

        prevPageRecords?.forEach(x => {
          if (x?.netPayable > 0) {
            prevPageCredit = prevPageCredit + (x?.netPayable || 0);
          } else {
            prevPageDebit = prevPageDebit + (x?.netPayable || 0);
          }
          if (x?.splitNetPayable > 0) {
            prevPageSplitCredit = prevPageSplitCredit + (x?.splitNetPayable || 0);
          } else {
            prevPageSplitDebit = prevPageSplitDebit + (x?.splitNetPayable || 0);
          }
          prevPageDebitsWithSplit = prevPageDebitsWithSplit + (x?.totalDebitsWithSplit || 0);
          prevPageCreditsWithSplit = prevPageCreditsWithSplit + (x?.totalCreditsWithSplit || 0);
        });

        let pageDebit = 0,
          pageCredit = 0,
          splitPageDebit = 0,
          splitPageCredit = 0,
          pageDebitsWithSplit = 0,
          pageCreditsWithSplit = 0;

        updatedPageRecords?.forEach(x => {
          if (x?.netPayable > 0) {
            pageCredit = pageCredit + (x?.netPayable || 0);
          } else {
            pageDebit = pageDebit + (x?.netPayable || 0);
          }
          if (x?.splitNetPayable > 0) {
            splitPageCredit = splitPageCredit + (x?.splitNetPayable || 0);
          } else {
            splitPageDebit = splitPageDebit + (x?.splitNetPayable || 0);
          }
          pageDebitsWithSplit = pageDebitsWithSplit + (x?.totalDebitsWithSplit || 0);
          pageCreditsWithSplit = pageCreditsWithSplit + (x?.totalCreditsWithSplit || 0);
        });

        pageDebit = pageDebit + prevPageDebit;
        pageCredit = pageCredit + prevPageCredit;
        splitPageDebit = splitPageDebit + prevPageSplitDebit;
        splitPageCredit = splitPageCredit + prevPageSplitCredit;
        pageDebitsWithSplit = pageDebitsWithSplit + prevPageDebitsWithSplit;
        pageCreditsWithSplit = pageCreditsWithSplit + prevPageCreditsWithSplit;

        updatedPageRecords.unshift({
          customerDisplayName: 'Brought Forward',
          totalDebit: prevPageDebit,
          totalCredit: prevPageCredit,
          splitTotalDebit: prevPageSplitDebit,
          splitTotalCredit: prevPageSplitCredit,
          totalDebitsWithSplit: prevPageDebitsWithSplit,
          totalCreditsWithSplit: prevPageCreditsWithSplit,
        });

        if (page !== totalPages) {
          updatedPageRecords.push({
            customerDisplayName: 'Carried Over',
            totalDebit: pageDebit,
            totalCredit: pageCredit,
            splitTotalDebit: splitPageDebit,
            splitTotalCredit: splitPageCredit,
            totalDebitsWithSplit: pageDebitsWithSplit,
            totalCreditsWithSplit: pageCreditsWithSplit,
          });
        }
      } else {
        let pageDebit = 0,
          pageCredit = 0,
          splitPageDebit = 0,
          splitPageCredit = 0,
          pageDebitsWithSplit = 0,
          pageCreditsWithSplit = 0;

        updatedPageRecords?.forEach(x => {
          if (x?.netPayable > 0) {
            pageCredit = pageCredit + (x?.netPayable || 0);
          } else {
            pageDebit = pageDebit + (x?.netPayable || 0);
          }
          if (x?.splitNetPayable > 0) {
            splitPageCredit = splitPageCredit + (x?.splitNetPayable || 0);
          } else {
            splitPageDebit = splitPageDebit + (x?.splitNetPayable || 0);
          }
          pageDebitsWithSplit = pageDebitsWithSplit + (x?.totalDebitsWithSplit || 0);
          pageCreditsWithSplit = pageCreditsWithSplit + (x?.totalCreditsWithSplit || 0);
        });

        if (page !== totalPages) {
          updatedPageRecords.push({
            customerDisplayName: 'Carried Over',
            totalDebit: pageDebit,
            totalCredit: pageCredit,
            splitTotalDebit: splitPageDebit,
            splitTotalCredit: splitPageCredit,
            totalDebitsWithSplit: pageDebitsWithSplit,
            totalCreditsWithSplit: pageCreditsWithSplit,
          });
        }
      }

      let closingBalance = getClosingBalance();
      updatedPageRecords.push(closingBalance);
    }

    setCurrentPageRecords(updatedPageRecords);
  };

  const handleViewClick = record => {
    const navigationState = {
      // customerId: record?.customerId,
      ...(searchParams?.get('division') && { division: searchParams?.get('division') }),
      ...(searchParams?.get('branch') && { branch: searchParams?.get('branch') }),
      ...(searchParams?.get('column') && { column: searchParams?.get('column') }),
      ...(searchParams?.get('startDate') && { startDate: searchParams?.get('startDate') }),
      ...(searchParams?.get('endDate') && { endDate: searchParams?.get('endDate') }),
      ...(searchParams?.get('preset') && { preset: searchParams?.get('preset') }),
      ...(searchParams?.get('includeLinkedData') && { includeLinkedData: searchParams?.get('includeLinkedData') }),
    };

    const params = new URLSearchParams(navigationState);
    navigate(`/reports/creditors-ledger/${record?.customerId}?${params.toString()}`);
  };

  const downloadPdf = async (records, filename = 'report.pdf') => {
    await getProfile({});
    const safeName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    const { CreditorsLedgerReportPdf } = await import('@smit9313/abss-pdf');
    const blob = await renderPdfToBlob(
      <CreditorsLedgerReportPdf
        records={records}
        profile={profile}
        isSplitSessionActive={isSplitSessionActive}
        startDate={searchParams?.get('startDate') || ''}
        endDate={searchParams?.get('endDate') || ''}
      />
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = safeName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const downloadExcel = async (filename = 'creditors_ledger.xlsx') => {
    await downloadCreditorsLedgerExcel({
      records: finalRecords,
      isSplitSessionActive,
      filename,
    });
  };

  const canExportReport = useModuleCreditorsLedger?.export && !isViewOnly;
  const exportTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : !useModuleCreditorsLedger?.export ? PERMISSION_MESSAGES.NO_PERMISSION : undefined;
  const printTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : !useModuleCreditorsLedger?.export ? PERMISSION_MESSAGES.NO_PERMISSION : undefined;

  const handleMenuClick = e => {
    if (!canExportReport) return;
    const format = e.key === '1' ? 'pdf' : 'xlsx';
    setSelectedExportFormat(format);
    setExportModalOpen(true);
  };

  const handleExport = async (format, filename) => {
    if (format === 'pdf') {
      await downloadPdf(finalRecords, filename);
    } else if (format === 'xlsx') {
      await downloadExcel(filename);
    }
  };

  const handlePrint = async () => {
    if (!canExportReport) return;
    await getProfile({});
    const { CreditorsLedgerReportPdf } = await import('@smit9313/abss-pdf');
    const blob = await renderPdfToBlob(
      <CreditorsLedgerReportPdf
        records={finalRecords}
        profile={profile}
        isSplitSessionActive={isSplitSessionActive}
        startDate={searchParams?.get('startDate') || ''}
        endDate={searchParams?.get('endDate') || ''}
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

  const updateUrlParams = newParams => {
    const params = new URLSearchParams(searchParams);

    if (!dateRange) {
      params.delete('startDate');
      params.delete('endDate');
      params.delete('preset');
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

  const handleClear = () => {
    setFilter({
      search: '',
      division: '',
      branch: '',
      column: '',
      withZeroBalance: false,
      includeLinkedData: false,
    });
    setSelectedPreset('custom');
    setDateRange(null);
    setPage(1);
    updateUrlParams({
      search: '',
      division: '',
      branch: '',
      column: '',
      withZeroBalance: false,
      includeLinkedData: false,
      preset: '',
      startDate: '',
      endDate: '',
      page: 1,
      limit: recordsPerPage.current,
    });
  };

  const handleFilter = async () => {
    const startDate = dateFormateForBackend(dateRange?.[0]);
    const endDate = dateFormateForBackend(dateRange?.[1]);
    let updatedFilters = {
      ...filter,
    };

    if (rangePresets.includes(selectedPreset) && dateRange) {
      updatedFilters = {
        ...updatedFilters,
        preset: selectedPreset,
        startDate,
        endDate,
      };
    } else if (specificPresets.includes(selectedPreset) && dateRange) {
      updatedFilters = {
        ...updatedFilters,
        preset: selectedPreset,
        startDate: endDate,
        endDate,
      };
    } else {
      updatedFilters = {
        ...updatedFilters,
        preset: '',
        startDate: '',
        endDate: '',
      };
    }

    setShowFilter(false);
    setPage(1);
    updateUrlParams({ ...updatedFilters, page: 1, limit: recordsPerPage.current });
  };

  const handleSearch = () => {
    setPage(1);
    updateUrlParams({ search: filter?.search, page: 1, limit: recordsPerPage.current });
  };

  const getActiveFiltersCount = () => {
    const keys = ['search', 'division', 'branch', 'column'];
    const defaultCount = keys.filter(key => {
      const currentValue = searchParams.get(key);
      return currentValue && currentValue !== '';
    }).length;
    const withZeroBalance = searchParams.get('withZeroBalance') === 'true' ? 1 : 0;
    const includeLinkedData = searchParams.get('includeLinkedData') === 'true' ? 1 : 0;
    const hasDateFilter = searchParams.get('startDate') || searchParams.get('endDate') ? 1 : 0;
    return defaultCount + withZeroBalance + includeLinkedData + hasDateFilter;
  };

  useEffect(() => {
    if (finalRecords?.length > 0) {
      // Calculate current page records based on current page
      const startIndex = (page - 1) * recordsPerPage.current;
      const endIndex = startIndex + recordsPerPage.current;
      let initialPageRecords = finalRecords?.slice(startIndex, endIndex);

      if (page === totalPages) {
        let totalDebit = 0,
          totalCredit = 0,
          splitTotalDebit = 0,
          splitTotalCredit = 0,
          totalDebitsWithSplit = 0,
          totalCreditsWithSplit = 0;

        finalRecords?.forEach(x => {
          if (x?.netPayable > 0) {
            totalCredit = totalCredit + (x?.netPayable || 0);
          } else {
            totalDebit = totalDebit + (x?.netPayable || 0);
          }
          if (x?.splitNetPayable > 0) {
            splitTotalCredit = splitTotalCredit + (x?.splitNetPayable || 0);
          } else {
            splitTotalDebit = splitTotalDebit + (x?.splitNetPayable || 0);
          }
          totalDebitsWithSplit = totalDebitsWithSplit + (x?.totalDebitsWithSplit || 0);
          totalCreditsWithSplit = totalCreditsWithSplit + (x?.totalCreditsWithSplit || 0);
        });

        let closingBalanceArr = [
          {
            customerDisplayName: 'Total',
            totalDebit,
            totalCredit,
            splitTotalDebit,
            splitTotalCredit,
            totalDebitsWithSplit,
            totalCreditsWithSplit,
          },
        ];

        initialPageRecords.push(...closingBalanceArr);
      } else {
        let totalDebit = 0,
          totalCredit = 0,
          splitTotalDebit = 0,
          splitTotalCredit = 0,
          pageDebitsWithSplit = 0,
          pageCreditsWithSplit = 0;

        initialPageRecords?.forEach(x => {
          if (x?.netPayable > 0) {
            totalCredit = totalCredit + (x?.netPayable || 0);
          } else {
            totalDebit = totalDebit + (x?.netPayable || 0);
          }
          if (x?.splitNetPayable > 0) {
            splitTotalCredit = splitTotalCredit + (x?.splitNetPayable || 0);
          } else {
            splitTotalDebit = splitTotalDebit + (x?.splitNetPayable || 0);
          }
          pageDebitsWithSplit = pageDebitsWithSplit + (x?.totalDebitsWithSplit || 0);
          pageCreditsWithSplit = pageCreditsWithSplit + (x?.totalCreditsWithSplit || 0);
        });

        initialPageRecords.push({
          customerDisplayName: 'Carried Over',
          totalDebit,
          totalCredit,
          splitTotalDebit,
          splitTotalCredit,
          totalDebitsWithSplit: pageDebitsWithSplit,
          totalCreditsWithSplit: pageCreditsWithSplit,
        });

        let closingBalance = getClosingBalance();
        initialPageRecords.push(closingBalance);
      }

      setCurrentPageRecords(initialPageRecords);
    } else {
      setCurrentPageRecords([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creditorsReport, filter?.search, page]);

  useEffect(() => {
    if (finalRecords?.length > 0 && page > totalPages) {
      setPage(1);
      updateUrlParams({ page: 1, limit: recordsPerPage.current });
    }
  }, [filter?.search, creditorsReport]);

  const fetchCreditorsReport = signal => {
    let payload = getQueryParams(window.location.href);
    payload = payload || {};

    // Remove page and limit for frontend pagination
    // eslint-disable-next-line no-unused-vars
    const { page, limit, ...filterParams } = payload;
    getCreditorsReport({
      signal,
      ...filterParams,
      isSplit: isSplitSessionActive ? true : false,
    });
  };

  useEffect(() => {
    const urlPage = parseInt(searchParams.get('page')) || 1;
    const urlLimit = parseInt(searchParams.get('limit')) || DEFAULT_PAGE_SIZE;
    if (urlPage !== page) {
      setPage(urlPage);
    }
    if (urlLimit !== recordsPerPage.current) {
      recordsPerPage.current = urlLimit;
      prevPageLimitRef.current = urlLimit;
    }
  }, [searchParams]);

  useEffect(() => {
    const controller = new AbortController();
    fetchCreditorsReport(controller.signal);
    return () => {
      controller.abort();
    };
    // Only trigger API call when filter-related params change, not page/limit
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    searchParams.get('division'),
    searchParams.get('branch'),
    searchParams.get('column'),
    searchParams.get('withZeroBalance'),
    searchParams.get('includeLinkedData'),
    searchParams.get('startDate'),
    searchParams.get('endDate'),
    isSplitSessionActive,
  ]);

  const handleOnFocusApiCall = async type => {
    let obj = { ...isApicalledRefFilter.current };

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
    if (searchParams.get('division')) {
      handleOnFocusApiCall(API_CALLED_ENUM.DIVISION_DROPDOWN);
    }
  }, [filter?.division]);

  useEffect(() => {
    if (searchParams.get('branch')) {
      handleOnFocusApiCall(API_CALLED_ENUM.BRANCH_DROPDOWN);
    }
  }, [filter?.branch]);

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
          <p className="font-bold text-[1.125rem]">Creditors Ledger</p>
        </div>
        <div className="flex items-center gap-3">
          {creditorsReport?.length > 0 && (
            <>
              <PermissionButton
                canAccess={useModuleCreditorsLedger?.export}
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
                <PermissionButton
                  canAccess={useModuleCreditorsLedger?.export}
                  isViewOnly={isViewOnly}
                  tooltipTitle={exportTooltip}
                  tooltipProps={{ placement: 'bottom' }}
                  className="flex items-center"
                >
                  <Space>Export Report</Space>
                </PermissionButton>
              </Dropdown>
            </>
          )}
        </div>
      </div>
      <div className="bg-white border-t px-4 py-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <FilterInput type={filterInputEnum?.SEARCH} name={'search'} placeHolder="Search..." value={filter?.search} setFilter={setFilter} onSerch={handleSearch} onClear={handleClear} />
          <div className="flex-grow" />
          <FilterButton count={getActiveFiltersCount()} onClick={() => setShowFilter(true)} />
        </div>
        <FilterDrawer
          open={showFilter}
          onClose={() => setShowFilter(false)}
          onApply={() => {
            handleFilter();
            setShowFilter(false);
          }}
          onReset={handleClear}
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
                name="column"
                label="Type"
                placeHolder="Select Type"
                selectionOptions={[
                  { value: 'CREDIT', label: 'CREDIT' },
                  { value: 'DEBIT', label: 'DEBIT' },
                ]}
                value={filter?.column}
                setFilter={setFilter}
                allowClear={true}
              />
            </div>
            <div className="flex items-center gap-x-4 mt-5">
              <FilterInput type={filterInputEnum?.SWITCH} name={'withZeroBalance'} value={filter?.withZeroBalance} setFilter={setFilter} allowClear={true} />
              <span>Record With Zero Balance</span>
            </div>
            <div className="flex items-center gap-x-4 mt-5">
              <FilterInput type={filterInputEnum?.SWITCH} name={'includeLinkedData'} value={filter?.includeLinkedData} setFilter={setFilter} allowClear={true} />
              <span>Linked to the Customer</span>
            </div>
          </FilterSection>

          <FilterSection title="Where">
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name="division"
                label="Division"
                mode="multiple"
                placeHolder="Select Division"
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
                name="branch"
                label="Branch"
                placeHolder="Select Branch"
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
          </FilterSection>
        </FilterDrawer>
      </div>

      <CommonFilterTags
        searchParams={searchParams}
        setFilter={setFilter}
        updateUrlParams={updateUrlParams}
        handleClear={handleClear}
        handleResetFilters={handleClear}
        dateKeys={{
          startDateKey: 'startDate',
          endDateKey: 'endDate',
        }}
        onDateClear={() => {
          setSelectedPreset('custom');
          setDateRange(null);
          updateUrlParams({ startDate: null, endDate: null, preset: null });
        }}
        divDrop={divDrop}
        branchDrop={allBranchDrop}
        extraFilters={{
          column: {
            label: 'Type',
            format: value => value,
            clear: (setFilter, updateUrlParams) => {
              setFilter(prev => ({
                ...prev,
                column: '',
              }));
              updateUrlParams({
                column: '',
                page: 1,
              });
            },
          },
          withZeroBalance: {
            label: 'With Zero Balance',
            format: value => (String(value) === 'true' ? 'Yes' : 'No'),
            clear: (setFilter, updateUrlParams) => {
              setFilter(prev => ({
                ...prev,
                withZeroBalance: false,
              }));
              updateUrlParams({
                withZeroBalance: false,
                page: 1,
              });
            },
          },
          includeLinkedData: {
            label: 'Linked to the Customer',
            format: value => (String(value) === 'true' ? 'Yes' : 'No'),
            clear: (setFilter, updateUrlParams) => {
              setFilter(prev => ({
                ...prev,
                includeLinkedData: false,
              }));
              updateUrlParams({
                includeLinkedData: false,
                page: 1,
              });
            },
          },
        }}
      />

      <div className="">
        <CustomTable
          columns={creditorLedgersReportColumn(isSplitSessionActive)}
          loading={loading}
          data={currentPageRecords}
          tableId="customerId"
          pagination={{
            current: page,
            pageSize: recordsPerPage.current,
            total: finalRecords?.length || 0,
            onChange: handlePaginationChange,
          }}
          showSizeChanger={false}
          onRowClick={handleViewClick}
        />
      </div>
      <ExportReportModal
        modalOpen={exportModalOpen}
        setModalOpen={setExportModalOpen}
        reportName="creditors_ledger"
        entity=""
        onExport={handleExport}
        initialFormat={selectedExportFormat}
        title="Export Report"
        formats={['pdf', 'xlsx']}
      />
    </div>
  );
};

export default ViewCreditorLedgersReport;
