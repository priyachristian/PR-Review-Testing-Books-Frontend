import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

// Components
import { Button, Dropdown, Space } from '@/components/AntDComponent';
import CustomButton from '@/components/ui/button/CustomButton';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomDatePicker from '@/components/forms/formDatePicker/CustomDatePicker';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import FilterInput from '@/components/forms/formInput/FilterInput';
import ExportDataModal from '@/components/ui/common/ExportDataModal';
import ExportReportModal from '@/components/feedback/formModal/ExportReportModal';
import Toast from '@/components/ui/common/Toast';

import { renderPdfToBlob } from '@/utils/loadReactPdf';

// Hooks
import useModulePermissions from 'hooks/useModulePermissions';
import { useProfile } from '@/features/setting/profile/useProfile';
import { useFilters } from '@/utils/filtersUtils';

// Extras
import { useReport, salesLedgerDetailExportColumn, salesLedgerDetailReportColumn } from '@/features/reports';
import Icons from 'assets/icons/icon';
import { FILTERS_KEYS, RESOURCES } from '@/utils/jsonFile';
import { filterInputEnum, PERMISSION_MESSAGES } from 'utils/constants';
import { buildExportRows, downloadExcelExport, resolveExportFileName } from '@/utils/exportData';
import { isCanceledRequestError } from '@/utils/serviceHelper';
import { dateFormateForBackend, getCurrentFinancialYearRange, getQueryParams } from 'utils/services';
import { CommonFilterTags } from '@/utils/filtersUtils';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';
import { getFYDateRangeFromStartYear, getFYStartYearValue } from '@/utils/util';
import { ADMIN_ROUTE_PATHS } from '@/routes/adminRoutePaths';
import { buildDivisionSelectOptions, buildBranchSelectOptions, divisionSelectColumnHeader, branchSelectColumnHeader } from '@/utils/tableSelectDropdown/orgSelectDropdown';

const API_CALLED_ENUM = {
  DIVISION_DROPDOWN: 'divisionDropdown',
  BRANCH_DROPDOWN: 'branchDropdown',
};

const ViewSalesLedgerDetailReport = () => {
  const navigate = useNavigate();
  const { salesLedgerDetail, salesLedgerDetailPagination, loading, exportLoading, getSalesLedgerDetail, getSalesLedgerDetailExport, clearSalesLedgerDetail } = useReport();
  const { isSplitSessionActive, divDrop, divisionLoading, getDivDropDown, allBranchLoading, allBranchDrop, getAllBranchDropDown } = useModulePermissions(RESOURCES.REPORTS);
  const { useModuleSalesLedger, isViewOnly } = useModulePermissions(RESOURCES.REPORT_PERMISSIONS.SALES_LEDGER);
  const canExportReport = useModuleSalesLedger?.export && !isViewOnly;
  const exportTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : !useModuleSalesLedger?.export ? PERMISSION_MESSAGES.NO_PERMISSION : undefined;
  const { profile, getProfile } = useProfile();

  const isApicalledRefFilter = useRef({
    divisionDropdown: false,
    branchDropdown: false,
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilter, setShowFilter] = useState(true);
  const [exportDataModalOpen, setExportDataModalOpen] = useState(false);
  const [exportReportModalOpen, setExportReportModalOpen] = useState(false);
  const [selectedExportFormat, setSelectedExportFormat] = useState('pdf');

  const fyFromQuery = getFYStartYearValue(searchParams?.get('FY'));
  const selectedFYRange = getFYDateRangeFromStartYear(fyFromQuery);
  let finYearDateRange = selectedFYRange || getCurrentFinancialYearRange();

  const FILTER_KEY = FILTERS_KEYS.SALES_LEDGER_DETAIL_FILTER;
  const { filter, setFilter, updateUrlParams, selectedPreset, setSelectedPreset, dateRange, setDateRange } = useFilters({
    searchParams,
    setSearchParams,
    pagination: salesLedgerDetailPagination,
    FILTER_KEY,
    setShowFilter,
    defaultFilter: {
      division: searchParams.get('division') ? searchParams.get('division').split(',') : [],
      branch: searchParams.get('branch') ? searchParams.get('branch').split(',') : [],
      splitOnly: searchParams.get('splitOnly') === 'true',
    },
  });

  const buildSalesLedgerDetailPayload = ({ page, limit, signal, pagination = true } = {}) => {
    let payload = getQueryParams(window.location.href) || {};
    const sortBy = payload.sortBy;
    delete payload.isSplit;
    delete payload.sortBy;

    let sortField = 'invoiceDate';
    let sortOrder = 'asc';
    if (sortBy) {
      const [field, order] = sortBy.split(':');
      if (field) sortField = field;
      if (order) sortOrder = order;
    }

    return {
      ...payload,
      pagination,
      ...(pagination
        ? {
            page: page ?? (parseInt(searchParams?.get('page')) || 1),
            limit: limit ?? (parseInt(searchParams?.get('limit')) || salesLedgerDetailPagination?.limit || DEFAULT_PAGE_SIZE),
          }
        : {}),
      sortField,
      sortOrder,
      ...(isSplitSessionActive ? { isSplit: !!filter?.splitOnly } : {}),
      signal,
    };
  };

  const fetchSalesLedgerDetail = signal => {
    getSalesLedgerDetail(buildSalesLedgerDetailPayload({ signal }));
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchSalesLedgerDetail(controller.signal);
    return () => {
      controller.abort();
      clearSalesLedgerDetail();
    };
  }, [searchParams, isSplitSessionActive]);

  const currentPageRecords = useMemo(() => {
    if (!salesLedgerDetail?.length) return [];

    const updatedPageRecords = [...salesLedgerDetail];
    const currentPage = salesLedgerDetailPagination?.page || 1;
    const limit = salesLedgerDetailPagination?.limit || DEFAULT_PAGE_SIZE;
    const totalResults = salesLedgerDetailPagination?.totalResults || 0;
    const totalPages = Math.ceil(totalResults / limit) || 1;

    if (currentPage !== 1 && salesLedgerDetailPagination?.broughtForward !== undefined) {
      updatedPageRecords.unshift({
        customerDisplayName: 'Brought Forward',
        total: salesLedgerDetailPagination.broughtForward,
      });
    }

    if (currentPage !== totalPages && salesLedgerDetailPagination?.carriedOver !== undefined) {
      updatedPageRecords.push({
        customerDisplayName: 'Carried Over',
        total: salesLedgerDetailPagination.carriedOver,
      });
    }

    const totalOverall = salesLedgerDetailPagination?.totalOverall !== undefined ? salesLedgerDetailPagination.totalOverall : salesLedgerDetail.reduce((sum, r) => sum + Math.round(r?.total || 0), 0);

    updatedPageRecords.push({
      customerDisplayName: 'Total',
      total: totalOverall,
    });

    return updatedPageRecords;
  }, [salesLedgerDetail, salesLedgerDetailPagination]);

  const handlePaginationChange = (page, pageSize) => {
    updateUrlParams({ page, limit: pageSize });
  };

  const handleTableChange = (pagination, filters, sorter) => {
    let sortBy = '';
    if (sorter?.field && sorter?.order) {
      sortBy = `${sorter.field}:${sorter.order === 'descend' ? 'desc' : 'asc'}`;
    }
    updateUrlParams({ sortBy, page: 1 });
  };

  const getColumnsWithSort = () => {
    const [field, order] = (searchParams.get('sortBy') || '').split(':');
    return salesLedgerDetailReportColumn.map(col => ({
      ...col,
      sortOrder: col.dataIndex === field && order ? (order === 'asc' ? 'ascend' : 'descend') : null,
    }));
  };

  const handleClear = () => {
    setFilter({ division: [], branch: [], splitOnly: false });
    setSelectedPreset('custom');
    setDateRange(null);
    updateUrlParams({
      division: [],
      branch: [],
      splitOnly: null,
      startDate: null,
      endDate: null,
      preset: null,
      sortBy: null,
      page: 1,
    });
    setShowFilter(true);
  };

  const handleFilter = async () => {
    const rawStartDate = dateFormateForBackend(dateRange?.[0]);
    const rawEndDate = dateFormateForBackend(dateRange?.[1]);
    const startDate = rawStartDate && rawStartDate < finYearDateRange.startDate ? finYearDateRange.startDate : rawStartDate;
    const endDate = rawEndDate && rawEndDate > finYearDateRange.endDate ? finYearDateRange.endDate : rawEndDate;

    let updatedFilters = {
      division: filter?.division,
      branch: filter?.branch,
      splitOnly: filter?.splitOnly ? 'true' : null,
      page: 1,
    };

    if (dateRange) {
      updatedFilters = {
        ...updatedFilters,
        preset: selectedPreset,
        startDate,
        endDate,
      };
    }
    setShowFilter(false);
    updateUrlParams(updatedFilters);
  };

  const downloadPdf = async (records, filename = 'sales-ledger') => {
    const result = await getProfile({});
    const freshProfile = result?.payload?.data || profile;
    const safeName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    const { SalesLedgerReportPdf } = await import('@smit9313/abss-pdf');
    const blob = await renderPdfToBlob(
      <SalesLedgerReportPdf records={records || []} profile={freshProfile} startDate={searchParams?.get('startDate') || ''} endDate={searchParams?.get('endDate') || ''} />
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = safeName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportData = async exportOptions => {
    if (!canExportReport) return;
    const controller = new AbortController();
    try {
      const response = await getSalesLedgerDetailExport(buildSalesLedgerDetailPayload({ signal: controller.signal, pagination: false }));
      const dataList = Array.isArray(response?.data) ? response.data : [];
      if (!dataList.length) {
        Toast.warning('No data available to export.');
        return;
      }

      const exportData = buildExportRows(dataList, salesLedgerDetailExportColumn());
      const fileName = resolveExportFileName(exportOptions?.fileName, 'Sales_Ledger_Export');

      downloadExcelExport({
        exportData,
        sheetName: 'Sales Ledger',
        fileName,
      });
      setExportDataModalOpen(false);
    } catch (error) {
      if (isCanceledRequestError(error)) return;
      Toast.error('Failed to export. Please try again.');
    }
  };

  const handleExportReport = async (format, filename) => {
    if (format !== 'pdf') return;

    const controller = new AbortController();
    try {
      const response = await getSalesLedgerDetailExport(buildSalesLedgerDetailPayload({ signal: controller.signal, pagination: false }));
      const dataList = Array.isArray(response?.data) ? response.data : [];
      if (!dataList.length) {
        Toast.warning('No data available to export.');
        return;
      }
      await downloadPdf(dataList, filename);
    } catch (error) {
      if (isCanceledRequestError(error)) return;
      Toast.error('Failed to export. Please try again.');
    }
  };

  const handlePrint = async () => {
    if (!canExportReport) return;
    const controller = new AbortController();
    try {
      const response = await getSalesLedgerDetailExport(buildSalesLedgerDetailPayload({ signal: controller.signal, pagination: false }));
      const dataList = Array.isArray(response?.data) ? response.data : [];
      if (!dataList.length) {
        Toast.warning('No data available to print.');
        return;
      }

      const result = await getProfile({});
      const freshProfile = result?.payload?.data || profile;
      const { SalesLedgerReportPdf } = await import('@smit9313/abss-pdf');
      const blob = await renderPdfToBlob(
        <SalesLedgerReportPdf records={dataList} profile={freshProfile} startDate={searchParams?.get('startDate') || ''} endDate={searchParams?.get('endDate') || ''} />
      );
      const blobUrl = URL.createObjectURL(blob);
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
    } catch (error) {
      if (isCanceledRequestError(error)) return;
      Toast.error('Failed to print. Please try again.');
    }
  };

  const handleMenuClick = e => {
    if (!canExportReport) return;
    if (e.key === 'pdf') {
      setSelectedExportFormat('pdf');
      setExportReportModalOpen(true);
    }
    if (e.key === 'xlsx') {
      setExportDataModalOpen(true);
    }
  };

  const items = [
    { label: 'PDF', key: 'pdf' },
    { label: 'XLSX', key: 'xlsx' },
  ];
  const menuProps = { items, onClick: handleMenuClick };

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

  const handleBackToSalesLedger = () => {
    const parentFilterParams = new URLSearchParams();
    ['FY', 'division', 'branch'].forEach(key => {
      const value = searchParams.get(key);
      if (value) parentFilterParams.set(key, value);
    });

    const queryString = parentFilterParams.toString();
    navigate(`/${ADMIN_ROUTE_PATHS.reports.salesLedger}${queryString ? `?${queryString}` : ''}`);
  };

  return (
    <div className="-m-4">
      <div className="flex justify-between items-center bg-white border-b border-gray-200 container-spacing sticky-page-header">
        <div className="flex items-center gap-3">
          <CustomButton type="default" text={<Icons.ArrowLeftOutlined />} onClick={handleBackToSalesLedger} />
          <p className="font-bold text-[1.125rem]">Sales Ledger</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setShowFilter(!showFilter)}>{showFilter ? 'Hide Filters' : 'View Filters'}</Button>
          {salesLedgerDetail?.length > 0 && (
            <>
              <PermissionButton
                canAccess={useModuleSalesLedger?.export}
                isViewOnly={isViewOnly}
                tooltipTitle={exportTooltip}
                tooltipProps={{ placement: 'bottom' }}
                type="default"
                size="middle"
                icon={<Icons.PrinterOutlined className="mr-2" />}
                className="flex items-center"
                loading={exportLoading}
                onClick={canExportReport ? handlePrint : undefined}
              >
                Print
              </PermissionButton>
              <Dropdown menu={menuProps} trigger={['click']} disabled={!canExportReport} open={canExportReport ? undefined : false}>
                <PermissionButton canAccess={useModuleSalesLedger?.export} isViewOnly={isViewOnly} tooltipTitle={exportTooltip} tooltipProps={{ placement: 'bottom' }}>
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
                <CustomDatePicker
                  selectedPreset={selectedPreset}
                  setSelectedPreset={setSelectedPreset}
                  dateRange={dateRange}
                  setDateRange={setDateRange}
                  disabledDate={current => {
                    if (!current) return false;
                    const currentDate = current.format('YYYY-MM-DD');
                    return currentDate < finYearDateRange.startDate || currentDate > finYearDateRange.endDate;
                  }}
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
                  disabled={!filter?.division || filter?.division?.length === 0}
                  loading={allBranchLoading}
                  onFocus={() => {
                    if (!isApicalledRefFilter.current.branchDropdown) {
                      handleOnFocusApiCall(API_CALLED_ENUM.BRANCH_DROPDOWN);
                    }
                  }}
                />
              </div>

              {isSplitSessionActive && (
                <div className="flex items-center gap-x-4 self-center mt-2 lg:mt-6">
                  <FilterInput type={filterInputEnum?.SWITCH} name={'splitOnly'} value={filter?.splitOnly} setFilter={setFilter} allowClear={true} />
                  <div>Split</div>
                </div>
              )}

              <div className="lg:ml-auto shrink-0 self-stretch flex items-center justify-center mt-2 lg:mt-0">
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
        dateKeys={{
          startDateKey: 'startDate',
          endDateKey: 'endDate',
          singleDateKey: null,
        }}
        onDateClear={() => {
          setSelectedPreset('custom');
          setDateRange(null);
          updateUrlParams({
            startDate: null,
            endDate: null,
            preset: null,
          });
        }}
        divDrop={divDrop}
        branchDrop={allBranchDrop}
        extraFilters={{
          splitOnly: {
            label: 'Split',
            format: () => 'Yes',
            clear: (setFilter, updateUrlParams) => {
              setFilter(prev => ({ ...prev, splitOnly: false }));
              updateUrlParams({ splitOnly: null });
            },
          },
        }}
      />

      <div>
        <CustomTable
          columns={getColumnsWithSort()}
          loading={loading}
          data={currentPageRecords}
          onChange={handleTableChange}
          pagination={{
            current: parseInt(searchParams.get('page')) || salesLedgerDetailPagination?.page || 1,
            pageSize: parseInt(searchParams.get('limit')) || salesLedgerDetailPagination?.limit || DEFAULT_PAGE_SIZE,
            total: salesLedgerDetailPagination?.totalResults || 0,
            onChange: handlePaginationChange,
          }}
        />
      </div>

      <ExportDataModal
        modalOpen={exportDataModalOpen}
        setModalOpen={setExportDataModalOpen}
        entityPlural="Sales Ledger"
        defaultFileName="Sales_Ledger_Export"
        exportLoading={exportLoading}
        onExport={handleExportData}
        formName="export-sales-ledger-detail"
      />
      <ExportReportModal
        modalOpen={exportReportModalOpen}
        setModalOpen={setExportReportModalOpen}
        reportName="sales_ledger_detail"
        entity=""
        onExport={handleExportReport}
        initialFormat={selectedExportFormat}
        title="Export Report"
        formats={['pdf']}
      />
    </div>
  );
};

export default ViewSalesLedgerDetailReport;
