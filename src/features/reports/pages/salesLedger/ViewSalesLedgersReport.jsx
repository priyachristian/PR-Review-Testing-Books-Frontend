import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import dayjs from 'dayjs';
import { useNavigate, useSearchParams } from 'react-router-dom';

const Column = lazy(() => import('@ant-design/charts').then(m => ({ default: m.Column })));

// Components
import { Button, DatePicker, Dropdown, Space } from '@/components/AntDComponent';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import ExportReportModal from '@/components/feedback/formModal/ExportReportModal';
import FilterInput from '@/components/forms/formInput/FilterInput';

import { renderPdfToBlob } from '@/utils/loadReactPdf';

// Hooks
import useModulePermissions from 'hooks/useModulePermissions';
import { useProfile } from '@/features/setting/profile/useProfile';

// Extras
import { useReport, salesLedgerReportColumn } from '@/features/reports';
import Icons from 'assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { filterInputEnum, MONTHS_ENUM, PERMISSION_MESSAGES } from 'utils/constants';
import { getCurrentFinancialYearRange, getMonthStartAndEndDate, getQueryParams } from 'utils/services';
import { getFinancialYearStartYear, getFYDateRangeFromStartYear, getFYStartYearValue } from '@/utils/util';
import { CommonFilterTags } from '@/utils/filtersUtils';
import { buildDivisionSelectOptions, buildBranchSelectOptions, divisionSelectColumnHeader, branchSelectColumnHeader } from '@/utils/tableSelectDropdown/orgSelectDropdown';

const API_CALLED_ENUM = {
  DIVISION_DROPDOWN: 'divisionDropdown',
  BRANCH_DROPDOWN: 'branchDropdown',
};

const ViewSalesLedgersReport = () => {
  const navigate = useNavigate();
  const { salesLedger, loading, getSalesLedger, clearSalesLedger } = useReport();
  const updatedSalesLedger = salesLedger?.map((item, index) => {
    let data = { ...item };
    let closingBalance = 0;
    salesLedger?.forEach((x, i) => {
      if (i <= index) {
        closingBalance = closingBalance + (x?.totalFinal || 0);
      }
    });
    data.closingBalance = closingBalance;
    return data;
  });
  const { isViewOnly, isSplitWise, isSplitSessionActive, divDrop, divisionLoading, getDivDropDown, allBranchLoading, allBranchDrop, getAllBranchDropDown } = useModulePermissions(RESOURCES.REPORTS);
  const { useModuleSalesLedger } = useModulePermissions(RESOURCES.REPORT_PERMISSIONS.SALES_LEDGER);
  const { profile, getProfile } = useProfile();
  const isApicalledRefFilter = useRef({
    divisionDropdown: false,
    branchDropdown: false,
  });
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState({
    division: searchParams.get('division') ? searchParams.get('division').split(',') : [],
    branch: searchParams.get('branch') ? searchParams.get('branch').split(',') : [],
  });
  const [showFilter, setShowFilter] = useState(!(searchParams.get('division') || searchParams.get('branch') || searchParams.get('FY')));

  const currentFYStartYear = String(getFinancialYearStartYear(dayjs()));
  const normalizedQueryFY = getFYStartYearValue(searchParams?.get('FY'));
  const [selectedFYStartYear, setSelectedFYStartYear] = useState(normalizedQueryFY || currentFYStartYear);
  const finYearDateRange = getFYDateRangeFromStartYear(normalizedQueryFY || selectedFYStartYear || currentFYStartYear) || getCurrentFinancialYearRange();
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedExportFormat, setSelectedExportFormat] = useState('pdf');

  const handleOnFocusApiCall = async type => {
    if (type === API_CALLED_ENUM.DIVISION_DROPDOWN) {
      if (isApicalledRefFilter.current.divisionDropdown) return;
      isApicalledRefFilter.current.divisionDropdown = true;
      await getDivDropDown({});
      return;
    }

    if (type === API_CALLED_ENUM.BRANCH_DROPDOWN) {
      if (isApicalledRefFilter.current.branchDropdown) return;
      isApicalledRefFilter.current.branchDropdown = true;
      await getAllBranchDropDown({});
    }
  };

  // Prefetch dropdowns once when URL already has filters (e.g. page reload)
  useEffect(() => {
    if (searchParams.get('division')) {
      handleOnFocusApiCall(API_CALLED_ENUM.DIVISION_DROPDOWN);
    }
    if (searchParams.get('branch')) {
      handleOnFocusApiCall(API_CALLED_ENUM.BRANCH_DROPDOWN);
    }
  }, []);

  useEffect(() => {
    setFilter({
      division: searchParams.get('division') ? searchParams.get('division').split(',') : [],
      branch: searchParams.get('branch') ? searchParams.get('branch').split(',') : [],
    });

    const fyFromUrl = getFYStartYearValue(searchParams?.get('FY'));
    if (fyFromUrl) {
      setSelectedFYStartYear(fyFromUrl);
    }

    if (searchParams.get('division') || searchParams.get('branch') || searchParams.get('FY')) {
      setShowFilter(false);
    }
  }, [searchParams]);

  const financialYearData = [];

  salesLedger?.forEach(entry => {
    financialYearData.push({
      month: `${MONTHS_ENUM?.[entry?.month]?.short}-${entry?.year}`,
      Amount: entry?.totalFinal,
    });
  });

  const salesLedgerConfig = {
    data: financialYearData,
    xField: 'month',
    yField: 'Amount',
    height: 300,
    xAxis: { label: { autoHide: false, autoRotate: false } },
  };

  const updateUrlParams = newParams => {
    const params = new URLSearchParams(searchParams);

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
    setFilter({ ...filter, division: '', branch: '' });
    setSelectedFYStartYear(currentFYStartYear);
    updateUrlParams({
      division: '',
      branch: '',
      FY: currentFYStartYear,
    });
    setShowFilter(true);
  };

  const handleFilter = async () => {
    let updatedFilters = {
      ...filter,
      FY: getFYStartYearValue(selectedFYStartYear) || currentFYStartYear,
    };

    setShowFilter(false);
    updateUrlParams(updatedFilters);
  };

  const fetchSalesLedger = signal => {
    let payload = getQueryParams(window.location.href);
    payload = payload || {};

    getSalesLedger({
      ...payload,
      signal,
      FY: getFYStartYearValue(searchParams?.get('FY')) || currentFYStartYear,
      isSplit: isSplitSessionActive && isSplitWise ? true : false,
    });
  };

  useEffect(() => {
    const controller = new AbortController();

    fetchSalesLedger(controller.signal);

    return () => {
      controller.abort();
      clearSalesLedger();
    };
  }, [searchParams, isSplitSessionActive]);

  const handleViewClick = record => {
    const dateRange = getMonthStartAndEndDate(record?.year, record?.month);

    let payload = getQueryParams(window.location.href);

    payload = {
      ...payload,
      startDate: dateRange?.startDate,
      endDate: dateRange?.endDate,
    };

    const navigationState = {
      startDate: finYearDateRange?.startDate,
      endDate: finYearDateRange?.endDate,
    };

    const params = new URLSearchParams(payload);
    navigate(`/reports/sales-ledger-detail?${params.toString()}`, {
      state: { range: navigationState },
    });
  };

  const downloadPdf = async (records, filename = 'report.pdf') => {
    const result = await getProfile({});
    const freshProfile = result?.payload?.data || profile;
    const safeName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    const startDate = finYearDateRange?.startDate || '';
    const endDate = finYearDateRange?.endDate || '';
    const { SalesLedgerReportPdf } = await import('@smit9313/abss-pdf');
    const blob = await renderPdfToBlob(<SalesLedgerReportPdf records={records} profile={freshProfile} startDate={startDate} endDate={endDate} showSplitColumn={isSplitSessionActive && isSplitWise} />);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = safeName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const canExportReport = useModuleSalesLedger?.export && !isViewOnly;
  const exportTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : !useModuleSalesLedger?.export ? PERMISSION_MESSAGES.NO_PERMISSION : undefined;
  const printTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : !useModuleSalesLedger?.export ? PERMISSION_MESSAGES.NO_PERMISSION : undefined;

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
  ];
  const menuProps = {
    items,
    onClick: handleMenuClick,
  };

  const handleExport = async (format, filename) => {
    if (format === 'pdf') {
      await downloadPdf(updatedSalesLedger, filename);
    } else if (format === 'xlsx') {
      // downloadExcel(filename);
    }
  };

  const handlePrint = async () => {
    if (!canExportReport) return;
    const result = await getProfile({});
    const freshProfile = result?.payload?.data || profile;
    const startDate = finYearDateRange?.startDate || '';
    const endDate = finYearDateRange?.endDate || '';
    const { SalesLedgerReportPdf } = await import('@smit9313/abss-pdf');
    const blob = await renderPdfToBlob(
      <SalesLedgerReportPdf records={updatedSalesLedger} profile={freshProfile} startDate={startDate} endDate={endDate} showSplitColumn={isSplitSessionActive && isSplitWise} />
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
      <div className="flex justify-between items-center container-spacing sticky-page-header bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <CustomButton
            type="default"
            text={<Icons.ArrowLeftOutlined />}
            onClick={() => {
              navigate('/reports');
            }}
          />
          <p className="font-bold text-[1.125rem]">Sales Ledger (Monthly Summary)</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              setShowFilter(!showFilter);
            }}
          >
            {showFilter ? 'Hide Filters' : 'View Filters'}
          </Button>
          {salesLedger?.length > 0 && (
            <>
              <PermissionButton
                canAccess={useModuleSalesLedger?.export}
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
                <PermissionButton canAccess={useModuleSalesLedger?.export} isViewOnly={isViewOnly} tooltipTitle={exportTooltip} tooltipProps={{ placement: 'bottom' }} className="flex items-center">
                  <Space>Export Report</Space>
                </PermissionButton>
              </Dropdown>
            </>
          )}
        </div>
      </div>
      {showFilter && (
        <div className="bg-white">
          <div className="container-spacing">
            <div className="flex flex-col lg:flex-row lg:items-stretch gap-4">
              <div className="space-y-2 min-w-[240px]">
                <label htmlFor="sales-ledger-financial-year" className="block text-sm font-medium">
                  Financial Year
                </label>
                <DatePicker
                  id="sales-ledger-financial-year"
                  picker="year"
                  placeholder="Select Financial Year"
                  className="min-w-[240px]"
                  value={selectedFYStartYear ? dayjs(`${selectedFYStartYear}-04-01`) : null}
                  format={d => {
                    const fyStartYear = getFinancialYearStartYear(d);
                    return fyStartYear ? `FY ${fyStartYear}-${String(fyStartYear + 1).slice(-2)}` : '';
                  }}
                  onChange={date => {
                    if (!date) {
                      setSelectedFYStartYear(currentFYStartYear);
                      return;
                    }
                    setSelectedFYStartYear(String(date.year()));
                  }}
                  allowClear={false}
                />
              </div>
              <div className="space-y-2 min-w-[220px]">
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
              <div className="space-y-2 min-w-[220px]">
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
              <div className="lg:ml-auto shrink-0 self-stretch flex items-center justify-center">
                <Space>
                  <Button onClick={handleClear} className="p-[17px]">
                    Reset All
                  </Button>
                  <Button type="primary" icon={<Icons.FilterOutlined />} size="middle" className="p-[17px]" onClick={handleFilter}>
                    Apply Filters
                  </Button>
                </Space>
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
        extraFilters={{
          FY: {
            label: 'Financial Year',
            format: value => `FY ${value}-${String(Number(value) + 1).slice(-2)}`,
            clear: (_, updateUrlParams) => {
              setSelectedFYStartYear(currentFYStartYear);
              updateUrlParams({ FY: currentFYStartYear });
            },
          },
        }}
        divDrop={divDrop}
        branchDrop={allBranchDrop}
      />

      <div>
        <CustomTable
          columns={salesLedgerReportColumn(isSplitSessionActive)}
          loading={loading}
          data={updatedSalesLedger}
          onRowClick={handleViewClick}
          scroll={{ x: 'max-content' }}
          showSizeChanger={false}
        />
      </div>
      <div className="bg-white container-spacing">
        <Suspense
          fallback={
            <div className="flex items-center justify-center" style={{ height: 300 }}>
              <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
            </div>
          }
        >
          <Column {...salesLedgerConfig} />
        </Suspense>
      </div>
      <ExportReportModal
        modalOpen={exportModalOpen}
        setModalOpen={setExportModalOpen}
        reportName="sales_ledger"
        entity=""
        onExport={handleExport}
        initialFormat={selectedExportFormat}
        title="Export Report"
        formats={['pdf']}
      />
    </div>
  );
};

export default ViewSalesLedgersReport;
