import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

// Components
import { Button, Dropdown, Space } from '@/components/AntDComponent';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomButton from '@/components/ui/button/CustomButton';
import DocumentRefreshButton from '@/components/ui/button/DocumentRefreshButton';
import CustomDatePicker from '@/components/forms/formDatePicker/CustomDatePicker';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import ExportReportModal from '@/components/feedback/formModal/ExportReportModal';
import FilterInput from '@/components/forms/formInput/FilterInput';
import { reportCompName } from '../../components/ReportComp';
import CustomerBasicDetail from '@/components/dataDisplay/statCard/CustomerBasicDetail';
import { buildCustomerSelectOptionsWithRole } from '@/utils/tableSelectDropdown/customerSelectDropdown';

import { renderPdfToBlob } from '@/utils/loadReactPdf';

// Hooks
import { useCustomer } from '@/features/sales/customer/useCustomer';
import useModulePermissions from 'hooks/useModulePermissions';
import { useProfile } from '@/features/setting/profile/useProfile';

// Extras
import { useReport, clearReportsData } from '@/features/reports';
import Icons from 'assets/icons/icon';
// import logo from "../../../assets/images/ABSS-LOGO.png";
import { RESOURCES } from '@/utils/jsonFile';
import { filterInputEnum, PERMISSION_MESSAGES } from 'utils/constants';
import { dateFormateForBackend, dateFormateForUi, getPresetDateRange, getQueryParams } from 'utils/services';
import { CommonFilterTags } from '@/utils/filtersUtils';
import { buildDivisionSelectOptions, buildBranchSelectOptions, divisionSelectColumnHeader, branchSelectColumnHeader } from '@/utils/tableSelectDropdown/orgSelectDropdown';

const API_CALLED_ENUM = {
  CUSTOMER_DROPDOWN: 'customerDropdown',
  DIVISION_DROPDOWN: 'divisionDropdown',
  BRANCH_DROPDOWN: 'branchDropdown',
};

const CompNotFound = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/reports');
  }, []);
};

const ReportDetail = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { reportName } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile, getProfile } = useProfile();
  const { isViewOnly, isSplitSessionActive, divDrop, divisionLoading, getDivDropDown, allBranchDrop, allBranchLoading, getAllBranchDropDown } = useModulePermissions(RESOURCES.REPORTS);
  const { useModuleGeneralLedger } = useModulePermissions(RESOURCES.REPORT_PERMISSIONS.GENERAL_LEDGER);
  const isApicalledRefFilter = useRef({
    customerDropdown: false,
    divisionDropdown: false,
    branchDropdown: false,
  });
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
  const { allCustomersDropDownList, getAllCustomersDropList, resetAllCustomersDropDownList, loading: customerLoading } = useCustomer();
  const [showFilter, setShowFilter] = useState(true);
  const [filter, setFilter] = useState({
    customer: searchParams?.get('customerId') || '',
    division: searchParams.get('division') || '',
    branch: searchParams.get('branch')?.split(',') || '',
    splitOnly: searchParams.get('splitOnly') === 'true',
  });
  const [selectedCustomer, setSelectedCustomer] = useState();
  const [sidebarOpen, setSiddebarOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const [selectedExportFormat, setSelectedExportFormat] = useState('pdf');
  const arr = [
    {
      key: 'Accountant',
      child: [
        {
          name: 'General Ledger',
          type: 'General Ledger',
          createdBy: 'System Generated',
          path: 'ledger',
        },
      ],
    },
  ];

  const [activeTab, setActiveTab] = useState(arr[0]?.key);
  const { reports, loading, getReports } = useReport();
  const [errors, setErrors] = useState({ customer: '', address: false });
  const [includeLinkedData, setIncludeLinkedData] = useState(searchParams.get('includeLinkedData') === 'true' || false);

  const handleFilter = () => {
    if (!filter?.customer) {
      setErrors({
        ...errors,
        customer: 'Customer is requried',
      });
      return;
    }

    const startDate = dateFormateForBackend(dateRange?.[0]);
    const endDate = dateFormateForBackend(dateRange?.[1]);
    let updatedFilters = {
      customerId: filter?.customer,
      division: filter?.division || null,
      branch: filter?.branch || null,
      splitOnly: isSplitSessionActive && filter?.splitOnly ? 'true' : null,
    };

    if (dateRange) {
      updatedFilters = {
        ...updatedFilters,
        preset: selectedPreset,
        startDate: startDate,
        endDate: endDate,
      };
    }

    if (includeLinkedData === true) {
      updatedFilters.includeLinkedData = true;
    } else {
      // Explicitly remove it from URL if checkbox is unchecked
      updatedFilters.includeLinkedData = null;
    }

    let findCustomer = allCustomersDropDownList?.find(x => x?.id == filter?.customer) || {};
    setSelectedCustomer(findCustomer);

    if (!findCustomer?.address?.billing?.state) {
      setErrors({ ...errors, address: true });
    } else {
      setErrors({ ...errors, address: false });
    }

    setShowFilter(false);
    updateUrlParams(updatedFilters);
  };

  const handleClear = () => {
    setDateRange(null);
    setFilter({ ...filter, customer: '', division: '', branch: '', splitOnly: false });
    setIncludeLinkedData(false);
    setSelectedCustomer(null);
    updateUrlParams({
      customerId: null,
      startDate: null,
      endDate: null,
      division: null,
      branch: null,
      preset: 'custom',
      includeLinkedData: null,
      splitOnly: null,
    });
    setSelectedPreset('custom');
    setShowFilter(true);
    dispatch(clearReportsData());
  };

  useEffect(() => {
    const controller = new AbortController();

    return () => {
      resetAllCustomersDropDownList();
      controller.abort();
      dispatch(clearReportsData());
    };
  }, []);

  const handleOnFocusApiCall = async type => {
    let obj = { ...isApicalledRefFilter.current };

    if (type === API_CALLED_ENUM.CUSTOMER_DROPDOWN) {
      await getAllCustomersDropList({});
      obj.customerDropdown = true;
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
    if (searchParams.get('customerId')) {
      handleOnFocusApiCall(API_CALLED_ENUM.CUSTOMER_DROPDOWN);
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

  const fetchReports = signal => {
    const payload = getQueryParams(window.location.href) || {};

    getReports({
      ...payload,
      customerId: filter?.customer,
      reportPath: reportName,
      signal,
      isSplit: isSplitSessionActive ? true : false,
      splitOnly: isSplitSessionActive && filter?.splitOnly ? true : false,
    });
  };

  const handleRefresh = async () => {
    fetchReports();
  };

  const updateUrlParams = newParams => {
    const params = new URLSearchParams(searchParams);

    if (!dateRange) {
      params.delete('startDate');
      params.delete('endDate');
    }

    Object.entries(newParams).forEach(([key, value]) => {
      // For includeLinkedData, only add to URL if it's true, otherwise remove it
      if (key === 'includeLinkedData') {
        if (value === true || value === 'true') {
          params.set(key, 'true');
        } else {
          params.delete(key);
        }
        return; // Skip normal processing for includeLinkedData
      }

      if (Array.isArray(value)) {
        if (value.length > 0) {
          params.set(key, value.join(','));
        } else {
          params.delete(key);
        }
      } else if (value !== null && value !== undefined) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    setSearchParams(params);
  };

  useEffect(() => {
    const controller = new AbortController();
    const customerId = searchParams.get('customerId');
    if (customerId) {
      fetchReports(controller.signal);
    } else {
      dispatch(clearReportsData());
      setSelectedCustomer(null);
    }
    return () => controller.abort();
  }, [searchParams, isSplitSessionActive]);

  useEffect(() => {
    if (allCustomersDropDownList && searchParams?.get('customerId')) {
      setSelectedCustomer(allCustomersDropDownList?.find(x => x?.id == searchParams?.get('customerId')) || {});
    } else if (!searchParams?.get('customerId')) {
      setSelectedCustomer(null);
    }
  }, [allCustomersDropDownList, searchParams]);

  useEffect(() => {
    const shouldInclude = filter?.customer === searchParams.get('customerId') && searchParams.get('includeLinkedData') === 'true';

    setIncludeLinkedData(shouldInclude);
  }, [filter?.customer, searchParams]);

  const downloadPdf = async (records, filename = 'report.pdf') => {
    await getProfile({});
    const safeName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    const { GeneralLedgerReportPdf } = await import('@smit9313/abss-pdf');
    const blob = await renderPdfToBlob(
      <GeneralLedgerReportPdf
        records={records}
        profile={profile}
        selectedCustomer={selectedCustomer}
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

  const downloadExcel = async (data, filename = `${reportName}.xlsx`) => {
    const XLSX = await import('xlsx');
    const wb = XLSX.utils.book_new();

    // Convert HTML table to worksheet
    const ws = XLSX.utils.table_to_sheet(data);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, `${reportName}`);

    // Generate Excel file and trigger download
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const canExportReport = useModuleGeneralLedger?.export && !isViewOnly;
  const exportTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : !useModuleGeneralLedger?.export ? PERMISSION_MESSAGES.NO_PERMISSION : undefined;
  const printTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : !useModuleGeneralLedger?.export ? PERMISSION_MESSAGES.NO_PERMISSION : undefined;

  const handleMenuClick = e => {
    if (!canExportReport) return;
    const format = e.key === '1' ? 'pdf' : 'xlsx';
    setSelectedExportFormat(format);
    setExportModalOpen(true);
  };

  const handleExport = async (format, filename) => {
    let data = document.getElementById(`${reportName}`);

    if (format === 'pdf') {
      await downloadPdf(reports?.ledger, filename);
    } else if (format === 'xlsx') {
      downloadExcel(data, filename);
    }
  };

  const handlePrint = async () => {
    if (!canExportReport) return;
    await getProfile({});
    const { GeneralLedgerReportPdf } = await import('@smit9313/abss-pdf');
    const blob = await renderPdfToBlob(
      <GeneralLedgerReportPdf
        records={reports?.ledger}
        profile={profile}
        selectedCustomer={selectedCustomer}
        reports={reports}
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

  return (
    <div className="-m-4 ">
      <div className="flex justify-between items-center bg-white border-b container-spacing sticky-page-header">
        <div className="flex items-center gap-3">
          <CustomButton
            type="default"
            text={<Icons.ArrowLeftOutlined />}
            onClick={() => {
              navigate('/reports');
            }}
          />
          <p className="font-bold text-[1.125rem]">General Ledger</p>
        </div>
        <div className="flex items-center gap-3">
          <DocumentRefreshButton onRefresh={handleRefresh} />
          <Button
            onClick={() => {
              setShowFilter(!showFilter);
            }}
          >
            {showFilter ? 'Hide Filters' : 'View Filters'}
          </Button>
          {reports?.ledger?.length > 0 && (
            <>
              <PermissionButton
                canAccess={useModuleGeneralLedger?.export}
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
                <PermissionButton canAccess={useModuleGeneralLedger?.export} isViewOnly={isViewOnly} tooltipTitle={exportTooltip} tooltipProps={{ placement: 'bottom' }} className="flex items-center">
                  <Space>
                    Export Report
                    <Icons.DownOutlined />
                  </Space>
                </PermissionButton>
              </Dropdown>
            </>
          )}
        </div>
      </div>

      {/* Export Modal */}
      <ExportReportModal
        modalOpen={exportModalOpen}
        setModalOpen={setExportModalOpen}
        reportName="general_ledger"
        entity={selectedCustomer?.companyName || ''}
        onExport={handleExport}
        initialFormat={selectedExportFormat}
        title="Export Report"
        formats={['pdf', 'xlsx']}
      />
      {errors?.address && (
        <div className="container-spacing bg-red-100">
          <div className="flex justify-between rounded-md">
            <div>
              <p>Please Add Customer Address</p>
            </div>
            <Icons.CloseOutlined
              onClick={() => {
                setErrors({
                  ...errors,
                  address: false,
                });
              }}
            />
          </div>
        </div>
      )}

      <div>
        {showFilter && (
          <div className=" bg-white">
            <div className="container-spacing">
              <div className="flex flex-col lg:flex-row gap-4 items-center">
                <div className="space-y-2 lg:col-span-2">
                  <CustomDatePicker selectedPreset={selectedPreset} setSelectedPreset={setSelectedPreset} dateRange={dateRange} setDateRange={setDateRange} />
                </div>
                <div className="space-y-2 relative w-64 mt-1">
                  <FilterInput
                    type={filterInputEnum?.SELECT}
                    selectVariant="twoColumn"
                    columnSelectHeader={{ id: 'Customer ID', name: 'Customer Name', role: 'Role' }}
                    name={'customer'}
                    label={'Customer'}
                    placeHolder={'Select Customer'}
                    selectionOptions={buildCustomerSelectOptionsWithRole(allCustomersDropDownList || [])}
                    value={filter?.customer}
                    setFilter={setFilter}
                    allowClear={true}
                    notFoundContent={
                      customerLoading ? (
                        <div className="flex justify-center items-center">
                          <CustomLoader size="small" />
                        </div>
                      ) : null
                    }
                    required={true}
                    loading={customerLoading}
                    onFocus={() => {
                      if (!isApicalledRefFilter.current.customerDropdown) {
                        handleOnFocusApiCall(API_CALLED_ENUM.CUSTOMER_DROPDOWN);
                        getProfile({});
                      }
                    }}
                  />
                  {errors.customer && !filter.customer && <div className="text-red-500 text-[10px] absolute right-1 -bottom-3">{errors.customer}</div>}
                </div>
                {isSplitSessionActive && (
                  <div className="flex items-center gap-x-4 mt-6">
                    <FilterInput type={filterInputEnum?.SWITCH} name={'splitOnly'} value={filter?.splitOnly} setFilter={setFilter} allowClear={true} />
                    <div>Split</div>
                  </div>
                )}
                {filter?.customer &&
                  (() => {
                    const selectedCustomerData = allCustomersDropDownList?.find(x => x?.id == filter?.customer);
                    const hasVendorId = selectedCustomerData?.vendorId;
                    const hasCustomerId = selectedCustomerData?.customerId;
                    const hasLinkedData = hasVendorId || hasCustomerId;

                    // Don't show switch if no linked data is available
                    if (!hasLinkedData) return null;

                    const message = hasVendorId && hasCustomerId ? 'Vendor and Customer data also linked' : hasVendorId ? 'Vendor data also linked' : 'Customer data also linked';

                    return (
                      <div className="flex items-center gap-x-4 mt-6">
                        <FilterInput
                          type={filterInputEnum?.SWITCH}
                          name={'includeLinkedData'}
                          value={includeLinkedData}
                          setFilter={updater => {
                            const newValue = typeof updater === 'function' ? updater({ includeLinkedData }) : updater;
                            if (newValue?.includeLinkedData !== undefined) {
                              setIncludeLinkedData(newValue.includeLinkedData);
                            }
                          }}
                          allowClear={true}
                        />
                        <div>{message}</div>
                      </div>
                    );
                  })()}

                <div className="flex-grow" />
                <Space style={{ marginTop: '22px' }}>
                  <Button onClick={handleClear} className="p-[17px]">
                    Reset All
                  </Button>
                  <Button type="primary" icon={<Icons.FilterOutlined />} size="middle" className="p-[17px]" onClick={handleFilter}>
                    Apply Filters
                  </Button>
                </Space>
              </div>
            </div>
            <div className="container-spacing border-t border-gray-200">
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
        <div className="bg-white py-2">
          <div className="flex justify-between items-center gap-3 flex-wrap">
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
                customerId: {
                  label: 'Customer',
                  format: value => {
                    const customer = allCustomersDropDownList?.find(c => String(c?.id) === String(value)) || {};
                    return customer?.customerDisplayName || customer?.companyName || null;
                  },
                  clear: (setFilter, updateUrlParams) => {
                    setFilter(prev => ({
                      ...prev,
                      customer: '',
                      division: '',
                      branch: '',
                    }));
                    setSelectedCustomer(null);
                    setSelectedPreset('custom');
                    setShowFilter(true);
                    dispatch(clearReportsData());
                    updateUrlParams({
                      customerId: null,
                      division: null,
                      branch: null,
                      preset: 'custom',
                    });
                  },
                },
                splitOnly: {
                  label: 'Split',
                  format: () => 'Yes',
                  clear: (setFilter, updateUrlParams) => {
                    setFilter(prev => ({
                      ...prev,
                      splitOnly: false,
                    }));
                    updateUrlParams({
                      splitOnly: null,
                    });
                  },
                },
              }}
            />
            {selectedCustomer && filter?.customer && <CustomerBasicDetail customerData={selectedCustomer} wrapperClassName="flex-shrink-0 flex items-center mr-5" />}
          </div>
        </div>
        <div id={`${reportName}`}>
          {selectedCustomer && filter?.customer && (
            <div className="bg-white border-t border-gray-200 container-spacing border-b relative">
              <div className="flex justify-between items-end">
                <div>
                  {profile?.companyLogo && <img src={profile?.companyLogo} alt="logo" className="max-h-[40px] max-w-[100px] object-contain" />}
                  <p className="font-medium text-lg">{profile?.name}</p>
                  <p>{`${profile?.address?.street1}`}</p>
                  <p>{`${profile?.address?.street2}`}</p>
                  <p>{`${profile?.address?.city}`}</p>
                  <p>{`${profile?.address?.state}, ${profile?.address?.country} - ${profile?.address?.pinCode}`}</p>
                </div>
                <div className="text-end">
                  <p className="font-medium text-lg">{selectedCustomer?.companyName ? selectedCustomer?.companyName : ''}</p>
                  <p>{`${selectedCustomer?.address?.billing?.address?.street1 ? selectedCustomer?.address?.billing?.address?.street1 : ''} ${selectedCustomer?.address?.billing?.city ? `, ${selectedCustomer?.address?.billing?.city}` : ''}`}</p>
                  <p>{`${selectedCustomer?.address?.billing?.state ? selectedCustomer?.address?.billing?.state : ''} ${selectedCustomer?.address?.billing?.country ? selectedCustomer?.address?.billing?.country : ''} ${selectedCustomer?.address?.billing?.pinCode ? `- ${selectedCustomer?.address?.billing?.pinCode}` : ''}`}</p>
                </div>
              </div>
              {searchParams?.get('startDate') && searchParams?.get('endDate') && (
                <div className="flex justify-center">{`${dateFormateForUi(searchParams?.get('startDate'))} - ${dateFormateForUi(searchParams?.get('endDate'))}`}</div>
              )}
            </div>
          )}
          {React.createElement(reportCompName?.[reportName] || CompNotFound, {
            loading: loading,
            reports: reports,
          })}
        </div>
      </div>
      {sidebarOpen && (
        <div className="absolute top-[65px] bottom-0 bg-white w-[200px] border z-10 my-container">
          <div className="flex justify-end mt-2 items-center px-2">
            <Icons.CloseCircleFilled
              className="h-[20px] w-[20px]"
              onClick={() => {
                setSiddebarOpen(false);
              }}
            />
          </div>
          <div className="p-2 overflow-y-auto">
            <nav className="space-y-1">
              {arr.map(item => (
                <button
                  key={item?.key}
                  onClick={() => setActiveTab(item?.key)}
                  className={`xl:w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-primary hover:text-white ${
                    activeTab === item?.key ? 'bg-primary text-white' : ''
                  }`}
                >
                  <span>{item?.key}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportDetail;
