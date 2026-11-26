import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

// Components
import { Dropdown, Space } from '@/components/AntDComponent';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomButton from '@/components/ui/button/CustomButton';
import ExportReportModal from '@/components/feedback/formModal/ExportReportModal';
import FilterInput from '@/components/forms/formInput/FilterInput';
import CustomDatePicker from '@/components/forms/formDatePicker/CustomDatePicker';
import FilterDrawer, { FilterSection, FilterButton } from '@/components/ui/common/FilterDrawer';
import GeneralLedger from '@/features/reports/components/GeneralLedger';

import { renderPdfToBlob } from '@/utils/loadReactPdf';

// Hooks
import useModulePermissions from 'hooks/useModulePermissions';
import { useProfile } from '@/features/setting/profile/useProfile';

// Extras
import { useReport, clearReportsData } from '@/features/reports';
import Icons from 'assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { filterInputEnum, PERMISSION_MESSAGES } from 'utils/constants';
import { getQueryParams, dateFormateForBackend, getPresetDateRange } from 'utils/services';
import { CommonFilterTags, rangePresets, specificPresets } from '@/utils/filtersUtils';
import { downloadLedgerReportExcel } from '../generalLedger/pdf/GeneralLedgerReportExcel';
import { buildDivisionSelectOptions, buildBranchSelectOptions, divisionSelectColumnHeader, branchSelectColumnHeader } from '@/utils/tableSelectDropdown/orgSelectDropdown';

const API_CALLED_ENUM = {
  DIVISION_DROPDOWN: 'divisionDropdown',
  BRANCH_DROPDOWN: 'branchDropdown',
};

const ViewCreditorLedgersDetailReport = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { customerId } = useParams();
  const { profile, getProfile } = useProfile();
  const { loading, reports, getReports } = useReport();
  const { isViewOnly, isSplitSessionActive, isSplitWise, divDrop, divisionLoading, getDivDropDown, allBranchDrop, allBranchLoading, getAllBranchDropDown } = useModulePermissions(RESOURCES.REPORTS);
  const { useModuleCreditorsLedger } = useModulePermissions(RESOURCES.REPORT_PERMISSIONS.CREDITORS_LEDGER);

  const isApicalledRefFilter = useRef({
    divisionDropdown: false,
    branchDropdown: false,
  });
  const isFirstSplitEffectRef = useRef(true);
  const [showFilter, setShowFilter] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedExportFormat, setSelectedExportFormat] = useState('pdf');
  const [filter, setFilter] = useState({
    division: searchParams.get('division')?.split(',') || '',
    branch: searchParams.get('branch')?.split(',') || '',
    splitOnly: searchParams.get('splitOnly') === 'true' || searchParams.get('toggle') === 'true',
    includeLinkedData: searchParams.get('includeLinkedData') || false,
  });
  const [selectedPreset, setSelectedPreset] = useState(searchParams?.get('preset') || 'custom');
  const getcustomDates = () => {
    if (searchParams?.get('startDate') && searchParams?.get('endDate')) {
      return [searchParams?.get('startDate'), searchParams?.get('endDate')];
    }
    return null;
  };
  const [dateRange, setDateRange] = useState(selectedPreset === 'custom' || selectedPreset === 'specific' ? getcustomDates() : getPresetDateRange(selectedPreset));

  const loadLedger = signal => {
    const payload = getQueryParams(window.location.href) || {};

    getReports({
      signal,
      customerId,
      reportPath: 'ledger',
      ...payload,
      isSplit: isSplitSessionActive ? true : false,
      splitOnly: payload?.splitOnly === true || payload?.splitOnly === 'true' || payload?.toggle === true || payload?.toggle === 'true',
    });
  };

  useEffect(() => {
    const controller = new AbortController();
    loadLedger(controller.signal);
    return () => {
      controller.abort();
      dispatch(clearReportsData());
    };
  }, [searchParams, isSplitSessionActive]);

  const handleOnFocusApiCall = async type => {
    const obj = { ...isApicalledRefFilter.current };

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

    if (newParams.splitOnly === false || newParams.splitOnly === null) {
      params.delete('toggle');
    }

    setSearchParams(params, { replace: true });
  };

  const handleClear = () => {
    setFilter({
      division: '',
      branch: '',
      splitOnly: false,
      includeLinkedData: false,
    });
    setSelectedPreset('custom');
    setDateRange(null);
    updateUrlParams({
      division: '',
      branch: '',
      splitOnly: false,
      includeLinkedData: false,
      toggle: false,
      preset: '',
      startDate: '',
      endDate: '',
    });
  };

  const getActiveFiltersCount = () => {
    const keys = ['division', 'branch'];
    const defaultCount = keys.filter(key => {
      const currentValue = searchParams.get(key);
      return currentValue && currentValue !== '';
    }).length;
    const splitOnly = searchParams.get('splitOnly') === 'true' || searchParams.get('toggle') === 'true' ? 1 : 0;
    const includeLinkedData = searchParams.get('includeLinkedData') === 'true' ? 1 : 0;
    const hasDateFilter = searchParams.get('startDate') || searchParams.get('endDate') ? 1 : 0;
    return defaultCount + splitOnly + includeLinkedData + hasDateFilter;
  };

  useEffect(() => {
    if (isFirstSplitEffectRef.current) {
      isFirstSplitEffectRef.current = false;
      return;
    }
    if (!isSplitSessionActive && isSplitWise) {
      handleFilter();
    }
  }, [isSplitSessionActive]);

  const handleFilter = () => {
    const startDate = dateFormateForBackend(dateRange?.[0]);
    const endDate = dateFormateForBackend(dateRange?.[1]);
    let updatedFilters = {
      ...filter,
      division: filter?.division,
      branch: filter?.branch,
      splitOnly: filter?.splitOnly,
      includeLinkedData: filter?.includeLinkedData,
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

    if (!isSplitSessionActive && isSplitWise) {
      updatedFilters.splitOnly = false;
      setFilter({
        splitOnly: false,
        division: filter?.division || '',
        branch: filter?.branch || '',
        includeLinkedData: filter?.includeLinkedData || false,
      });
    }

    setShowFilter(false);
    updateUrlParams(updatedFilters);
  };

  const downloadPdf = async (filename = 'report.pdf') => {
    const result = await getProfile({});
    const freshProfile = result?.payload?.data || profile;
    const safeName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    const { GeneralLedgerReportPdf } = await import('@smit9313/abss-pdf');
    const blob = await renderPdfToBlob(
      <GeneralLedgerReportPdf
        records={reports?.ledger || []}
        profile={freshProfile}
        selectedCustomer={reports}
        reports={reports}
        startDate={searchParams?.get('startDate') || ''}
        endDate={searchParams?.get('endDate') || ''}
      />
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = safeName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadExcel = async (filename = 'creditors_ledger_detail.xlsx') => {
    await downloadLedgerReportExcel({
      records: reports?.ledger || [],
      reports,
      startDate: searchParams?.get('startDate') || '',
      endDate: searchParams?.get('endDate') || '',
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
      await downloadPdf(filename);
    } else if (format === 'xlsx') {
      await downloadExcel(filename);
    }
  };

  const handlePrint = async () => {
    if (!canExportReport) return;
    const result = await getProfile({});
    const freshProfile = result?.payload?.data || profile;
    const { GeneralLedgerReportPdf } = await import('@smit9313/abss-pdf');
    const blob = await renderPdfToBlob(
      <GeneralLedgerReportPdf
        records={reports?.ledger || []}
        profile={freshProfile}
        selectedCustomer={reports}
        reports={reports}
        startDate={searchParams?.get('startDate') || ''}
        endDate={searchParams?.get('endDate') || ''}
      />
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
  };

  const menuProps = {
    items: [
      { label: 'PDF', key: '1' },
      { label: 'XLSX', key: '2' },
    ],
    onClick: handleMenuClick,
  };

  const partyName = reports?.customerDisplayName || reports?.companyName || '';
  const billingAddress = reports?.address?.billing;

  return (
    <div className="-m-4">
      <div className="flex justify-between items-center bg-white border-b border-gray-200 container-spacing sticky-page-header">
        <div className="flex items-center gap-3">
          <CustomButton
            type="default"
            text={<Icons.ArrowLeftOutlined />}
            onClick={() => {
              navigate(-1);
            }}
          />
          <p className="font-bold text-[1.125rem]">Creditors Ledger Detail</p>
        </div>
        <div className="flex items-center gap-3">
          {reports?.ledger?.length > 0 && (
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
        <div className="flex justify-end">
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
            <div className="flex items-center gap-x-4 mt-5">
              <FilterInput type={filterInputEnum?.SWITCH} name="includeLinkedData" value={filter?.includeLinkedData} setFilter={setFilter} allowClear={true} />
              <span>Linked to the Customer</span>
            </div>
            {isSplitWise && isSplitSessionActive && (
              <div className="flex items-center gap-x-4 mt-5">
                <FilterInput type={filterInputEnum?.SWITCH} name="splitOnly" value={filter?.splitOnly} setFilter={setFilter} allowClear={true} />
                <span>Split</span>
              </div>
            )}
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
          splitOnly: {
            label: 'Split',
            format: value => (String(value) === 'true' ? 'On' : 'Off'),
            clear: (setFilterFn, updateUrl) => {
              setFilterFn(prev => ({
                ...prev,
                splitOnly: false,
              }));
              updateUrl({
                splitOnly: false,
                toggle: false,
              });
            },
          },
          includeLinkedData: {
            label: 'Linked to the Customer',
            format: value => (String(value) === 'true' ? 'Yes' : 'No'),
            clear: (setFilterFn, updateUrl) => {
              setFilterFn(prev => ({
                ...prev,
                includeLinkedData: false,
              }));
              updateUrl({
                includeLinkedData: false,
              });
            },
          },
        }}
      />

      <div className="bg-white border-b border-gray-200 container-spacing py-3 border-t">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Vendor:</span>
            <button type="button" className="cursor-pointer text-[--orange]" onClick={() => navigate(`/vendors/${customerId}`)}>
              {partyName}
            </button>
          </div>
          {billingAddress && (
            <div className="text-gray-800 sm:text-right">
              <p className="font-medium text-lg">{reports?.companyName ? reports?.companyName : ''}</p>
              <p>{`${billingAddress?.address?.street1 || ''}${billingAddress?.city ? `, ${billingAddress.city}` : ''}`}</p>
              <p>{`${billingAddress?.state || ''} ${billingAddress?.country || ''}${billingAddress?.pinCode ? ` - ${billingAddress.pinCode}` : ''}`.trim()}</p>
            </div>
          )}
        </div>
      </div>

      <GeneralLedger loading={loading} reports={reports} />

      <ExportReportModal
        modalOpen={exportModalOpen}
        setModalOpen={setExportModalOpen}
        reportName="creditors_ledger_detail"
        entity={partyName}
        onExport={handleExport}
        initialFormat={selectedExportFormat}
        title="Export Report"
        formats={['pdf', 'xlsx']}
      />
    </div>
  );
};

export default ViewCreditorLedgersDetailReport;
