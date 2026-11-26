import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';

// Components
import { CommonFilterTags } from '@/utils/filtersUtils';
import { Button, Dropdown, Space } from '@/components/AntDComponent';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomDatePicker from '@/components/forms/formDatePicker/CustomDatePicker';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import FilterInput from '@/components/forms/formInput/FilterInput';
import ExportReportModal from '@/components/feedback/formModal/ExportReportModal';

import { renderPdfToBlob } from '@/utils/loadReactPdf';

// Hooks
import { useItemMaster, itemMasterService } from '@/features/allMaster/item';
import useModulePermissions from 'hooks/useModulePermissions';
import { useProfile } from '@/features/setting/profile/useProfile';

// Extras
import { itemLedgerReportColumn } from '@/features/reports';
import Icons from 'assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { filterInputEnum, LEDGER_DETAIL_ROUTES, PERMISSION_MESSAGES } from 'utils/constants';
import { dateFormateForBackend, dateFormateForUi, filteredURLParams, getPresetDateRange, getQueryParams } from 'utils/services';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';
import { buildItemFilterSelectOptions, getItemSelectDisplayLabel, itemSelectColumnHeader, itemSelectDropdownProps } from '@/utils/tableSelectDropdown/itemSelectDropdown';
import {
  buildDivisionSelectOptions,
  buildBranchSelectOptions,
  buildWarehouseSelectOptions,
  divisionSelectColumnHeader,
  branchSelectColumnHeader,
  warehouseSelectColumnHeader,
} from '@/utils/tableSelectDropdown/orgSelectDropdown';

const API_CALLED_ENUM = {
  ITEM_DROPDOWN: 'itemDropdown',
  DIVISION_DROPDOWN: 'divisionDropdown',
  BRANCH_DROPDOWN: 'branchDropdown',
  WAREHOUSE_DROPDOWN: 'warehouseDropdown',
};

const ViewItemLedgersReport = () => {
  const navigate = useNavigate();
  const { itemHistory, getItemReport, loading, pagination, clearItemReport } = useItemMaster();
  const { profile, getProfile } = useProfile();
  const {
    isViewOnly,
    isSplitWise,
    isSplitSessionActive,
    divDrop,
    divisionLoading,
    getDivDropDown,
    allBranchDrop,
    allBranchLoading,
    getAllBranchDropDown,
    warehouseDrop,
    warehouseLoading,
    getWarehouseDrop,
    allItemDrop,
    allItemDropLoading: itemLoading,
    getAllItemDrop,
  } = useModulePermissions(RESOURCES.REPORTS);
  const { useModuleItemLedger } = useModulePermissions(RESOURCES.REPORT_PERMISSIONS.ITEM_LEDGER);
  const isApicalledRefFilter = useRef({
    itemDropdown: false,
    divisionDropdown: false,
    branchDropdown: false,
    warehouseDropdown: false,
  });
  const isFirstSplitEffectRef = useRef(true);
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilter, setShowFilter] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState(searchParams?.get('preset') || 'custom');
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedExportFormat, setSelectedExportFormat] = useState('pdf');

  const canExportReport = useModuleItemLedger?.export && !isViewOnly;
  const exportTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : !useModuleItemLedger?.export ? PERMISSION_MESSAGES.NO_PERMISSION : undefined;
  const printTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : !useModuleItemLedger?.export ? PERMISSION_MESSAGES.NO_PERMISSION : undefined;

  const handleMenuClick = e => {
    if (!canExportReport) return;
    const format = e.key === '1' ? 'pdf' : 'xlsx';
    setSelectedExportFormat(format);
    setExportModalOpen(true);
  };

  const exportMenuItems = [
    {
      label: 'PDF',
      key: '1',
    },
    {
      label: 'XLSX',
      key: '2',
    },
  ];
  const exportMenuProps = {
    items: exportMenuItems,
    onClick: handleMenuClick,
  };

  const getcustomDates = () => {
    if (searchParams?.get('startDate') && searchParams?.get('endDate')) {
      return [searchParams?.get('startDate'), searchParams?.get('endDate')];
    }
    if (searchParams?.get('quoteDate')) {
      return [searchParams?.get('quoteDate'), searchParams?.get('quoteDate')];
    }
    return null;
  };
  const [dateRange, setDateRange] = useState(selectedPreset === 'custom' || selectedPreset === 'specific' ? getcustomDates() : getPresetDateRange(selectedPreset));
  const [filter, setFilter] = useState({
    item: searchParams.get('item') || '',
    division: searchParams.get('division') || '',
    branch: searchParams.get('branch')?.split(',') || '',
    warehouse: searchParams.get('warehouse')?.split(',') || '',
    isSplit: searchParams.get('isSplit') === 'true',
  });
  const [errors, setErrors] = useState({ item: '' });

  const itemSelectOptions = useMemo(() => buildItemFilterSelectOptions(allItemDrop, { showAvailableStock: true }), [allItemDrop]);

  const selectedItem = useMemo(() => allItemDrop?.find(opt => String(opt?._id) === String(filter?.item || searchParams.get('item'))) || null, [allItemDrop, filter?.item, searchParams]);
  const selectedItemName = selectedItem ? getItemSelectDisplayLabel(selectedItem) || selectedItem?.name || '' : '';
  const selectedItemSku = selectedItem?.itemNo || selectedItem?.itemCode || selectedItem?.sku || '';

  useEffect(() => {
    return () => {
      dispatch(clearItemReport());
    };
  }, [dispatch]);

  const handleOnFocusApiCall = async type => {
    let obj = { ...isApicalledRefFilter.current };

    if (type === API_CALLED_ENUM.ITEM_DROPDOWN) {
      await getAllItemDrop({});
      obj.itemDropdown = true;
    }

    if (type === API_CALLED_ENUM.DIVISION_DROPDOWN) {
      await getDivDropDown({});
      obj.divisionDropdown = true;
    }

    if (type === API_CALLED_ENUM.BRANCH_DROPDOWN) {
      await getAllBranchDropDown({});
      obj.branchDropdown = true;
    }

    if (type === API_CALLED_ENUM.WAREHOUSE_DROPDOWN) {
      await getWarehouseDrop({});
      obj.warehouseDropdown = true;
    }

    isApicalledRefFilter.current = obj;
  };

  useEffect(() => {
    if (searchParams.get('item')) {
      handleOnFocusApiCall(API_CALLED_ENUM.ITEM_DROPDOWN);
    }
  }, [filter?.item]);

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

  useEffect(() => {
    if (searchParams.get('warehouse')) {
      handleOnFocusApiCall(API_CALLED_ENUM.WAREHOUSE_DROPDOWN);
    }
  }, [filter?.warehouse]);

  useEffect(() => {
    if (!filter?.item) {
      handleResetFilters();
    }
  }, [filter?.item]);

  const fetchItemReports = signal => {
    let payload = getQueryParams(window.location.href);
    payload = payload || {};
    const splitToggleOn = payload?.isSplit === true || payload?.isSplit === 'true';
    delete payload.isSplit;

    getItemReport({
      ...payload,
      signal,
      isSplit: isSplitSessionActive ? true : false,
      splitOnly: isSplitSessionActive && isSplitWise && splitToggleOn ? true : false,
    });
  };

  const handlePaginationChange = (page, pageSize) => {
    updateUrlParams({ page, limit: pageSize });
  };

  const updateUrlParams = newParams => {
    const params = new URLSearchParams(searchParams);

    if (!dateRange) {
      params.delete('startDate');
      params.delete('endDate');
    }

    const filterParams = filteredURLParams(params, newParams);
    setSearchParams(filterParams);
  };

  const handleFilter = () => {
    if (!filter?.item) {
      setErrors({ ...errors, item: 'Item is required' });
      return;
    }

    const updatedFilters = {
      item: filter?.item,
      startDate: dateRange?.[0] ? dateFormateForBackend(dateRange?.[0]) : null,
      endDate: dateRange?.[1] ? dateFormateForBackend(dateRange?.[1]) : null,
      division: filter?.division || null,
      branch: filter?.branch || null,
      warehouse: filter?.warehouse || null,
      page: 1,
      limit: pagination?.limit || DEFAULT_PAGE_SIZE,
      isSplit: filter?.isSplit,
    };

    if (!isSplitSessionActive && isSplitWise) {
      updatedFilters.isSplit = false;
      setFilter(prev => ({
        ...prev,
        isSplit: false,
      }));
    }

    setShowFilter(false);
    updateUrlParams(updatedFilters);
  };

  const handleResetFilters = () => {
    setFilter({
      item: '',
      division: null,
      branch: null,
      warehouse: null,
      isSplit: false,
    });
    dispatch(clearItemReport());
    setSelectedPreset('custom');
    setDateRange(null);
    setShowFilter(true);
    updateUrlParams({
      item: null,
      startDate: null,
      endDate: null,
      division: null,
      branch: null,
      warehouse: null,
      isSplit: null,
      page: 1,
      limit: pagination?.limit,
    });
  };

  useEffect(() => {
    if (isFirstSplitEffectRef.current) {
      isFirstSplitEffectRef.current = false;
      return;
    }
    if (!isSplitSessionActive && isSplitWise && searchParams?.get('item')) {
      handleFilter();
    }
  }, [isSplitSessionActive]);

  useEffect(() => {
    const controller = new AbortController();
    if (searchParams?.get('item')) {
      fetchItemReports(controller.signal);
    }
    return () => controller.abort();
  }, [searchParams, isSplitSessionActive]);

  const getRowDetailPath = record => {
    if (record?.isBalanceRow || !record?.refId) return null;
    const target = LEDGER_DETAIL_ROUTES[record?.refType];
    return target ? `/${target.build(record.refId)}` : null;
  };

  const handleRowClick = record => {
    const path = getRowDetailPath(record);
    if (!path) return;
    navigate(path);
  };

  const fetchAllRecordsForExport = async () => {
    let payload = getQueryParams(window.location.href) || {};
    const splitToggleOn = payload?.isSplit === true || payload?.isSplit === 'true';
    delete payload.isSplit;

    const response = await itemMasterService.getItemReport({
      ...payload,
      page: 1,
      pagination: false,
      isSplit: isSplitSessionActive ? true : false,
      splitOnly: isSplitSessionActive && isSplitWise && splitToggleOn ? true : false,
    });

    return {
      records: response?.data || [],
      openingBalance: response?.extras?.openingBalance ?? 0,
      closingBalance: response?.extras?.closingBalance ?? 0,
    };
  };

  const getPdfProps = (records, openingBalance, closingBalance) => ({
    records: records || [],
    profile,
    selectedItemName,
    selectedItemSku,
    startDate: searchParams?.get('startDate') || '',
    endDate: searchParams?.get('endDate') || '',
    openingBalance: openingBalance ?? 0,
    closingBalance: closingBalance ?? 0,
  });

  const downloadPdf = async (filename = 'ItemLedgerReport.pdf') => {
    const result = await getProfile({});
    const freshProfile = result?.payload?.data || profile;
    const safeName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    const { records, openingBalance, closingBalance } = await fetchAllRecordsForExport();
    const { ItemLedgerReportPdf } = await import('./pdf/ItemLedgerReportPdf');
    const blob = await renderPdfToBlob(<ItemLedgerReportPdf {...getPdfProps(records, openingBalance, closingBalance)} profile={freshProfile} />);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = safeName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadExcel = async (filename = 'ItemLedgerReport.xlsx') => {
    const XLSX = await import('xlsx');
    const { records, openingBalance, closingBalance } = await fetchAllRecordsForExport();
    const tableDataWithBalances = [...(records || [])];

    if (records?.length) {
      tableDataWithBalances.unshift({
        isBalanceRow: true,
        label: 'Opening Quantity',
        QuantityBalance: openingBalance ?? 0,
      });

      tableDataWithBalances.push({
        isBalanceRow: true,
        label: 'Closing Quantity',
        QuantityBalance: closingBalance ?? 0,
      });
    }

    const excelData = tableDataWithBalances.map(row => {
      if (row.isBalanceRow) {
        return {
          Date: '',
          Effect: '',
          'Posting Document': row.label,
          'Doc No': '',
          QTY: '',
          'QTY Balance': row.QuantityBalance ?? '',
        };
      }

      const qty = row.quantity || 0;
      const prefix = qty === 0 ? '' : row.effectType === 'IN' ? '+' : '';

      return {
        Date: dateFormateForUi(row.date),
        Effect: row.effectType || '',
        'Posting Document': row.referenceType || '',
        'Doc No': row.refNo || '',
        QTY: `${prefix}${qty}`,
        'QTY Balance': row.QuantityBalance ?? '',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'ItemLedger');

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
    const { records, openingBalance, closingBalance } = await fetchAllRecordsForExport();
    const { ItemLedgerReportPdf } = await import('./pdf/ItemLedgerReportPdf');
    const blob = await renderPdfToBlob(<ItemLedgerReportPdf {...getPdfProps(records, openingBalance, closingBalance)} profile={freshProfile} />);

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

  return (
    <div className="-m-4">
      <div className="flex justify-between items-center bg-white border-b sticky-page-header container-spacing">
        <div className="flex items-center gap-3">
          <CustomButton
            type="default"
            text={<Icons.ArrowLeftOutlined />}
            onClick={() => {
              navigate('/reports');
            }}
          />
          <p className="font-bold text-[1.125rem]">Item Ledger</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              setShowFilter(!showFilter);
            }}
          >
            {showFilter ? 'Hide Filters' : 'View Filters'}
          </Button>
          {filter?.item && itemHistory?.length > 0 && (
            <>
              <PermissionButton
                canAccess={useModuleItemLedger?.export}
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
              <Dropdown menu={exportMenuProps} trigger={['click']} disabled={!canExportReport} open={canExportReport ? undefined : false}>
                <PermissionButton canAccess={useModuleItemLedger?.export} isViewOnly={isViewOnly} tooltipTitle={exportTooltip} tooltipProps={{ placement: 'bottom' }} className="flex items-center">
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

      <ExportReportModal
        modalOpen={exportModalOpen}
        setModalOpen={setExportModalOpen}
        reportName="item_ledger"
        entity={selectedItemName || ''}
        onExport={handleExport}
        initialFormat={selectedExportFormat}
        title="Export Report"
        formats={['pdf', 'xlsx']}
      />
      {showFilter && (
        <div className="bg-white filters-open">
          <div className="container-spacing">
            <div className="flex flex-col lg:flex-row gap-4 items-center ">
              <div className="space-y-2 lg:col-span-2">
                <CustomDatePicker selectedPreset={selectedPreset} setSelectedPreset={setSelectedPreset} dateRange={dateRange} setDateRange={setDateRange} />
              </div>
              <div className="space-y-2 w-[250px] relative mt-1">
                <FilterInput
                  type={filterInputEnum?.SELECT}
                  name={'item'}
                  label={'Item'}
                  placeHolder={'Type or click to select an item.'}
                  selectVariant="twoColumn"
                  columnSelectHeader={itemSelectColumnHeader}
                  selectPopupClassName={itemSelectDropdownProps.selectPopupClassName}
                  selectionOptions={itemSelectOptions}
                  value={filter?.item}
                  setFilter={setFilter}
                  allowClear={true}
                  required={true}
                  loading={itemLoading}
                  onFocus={() => {
                    if (!isApicalledRefFilter.current.itemDropdown) {
                      handleOnFocusApiCall(API_CALLED_ENUM.ITEM_DROPDOWN);
                    }
                  }}
                  popupMatchSelectWidth={itemSelectDropdownProps.popupMatchSelectWidth}
                  dropdownStyle={itemSelectDropdownProps.dropdownStyleWithStock}
                />
                {errors.item && !filter.item && <div className="text-red-500 text-[10px] absolute right-1 -bottom-3">{errors.item}</div>}
              </div>
              <div className="flex-grow" />
              <Space className="mt-6">
                <Button
                  className="p-[17px]"
                  onClick={() => {
                    handleResetFilters();
                  }}
                >
                  Reset All
                </Button>
                <Button type="primary" icon={<Icons.FilterOutlined />} size="middle" className="p-[17px]" onClick={handleFilter}>
                  Apply Filters
                </Button>
              </Space>
            </div>
          </div>
          <div className="container-spacing  border-t border-gray-200">
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
                  extraFilterValues={{ branch: '', warehouse: '' }}
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
                  extraFilterValues={{ warehouse: '' }}
                  loading={allBranchLoading}
                  onFocus={() => {
                    if (!isApicalledRefFilter.current.branchDropdown) {
                      handleOnFocusApiCall(API_CALLED_ENUM.BRANCH_DROPDOWN);
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <FilterInput
                  type={filterInputEnum?.SELECT}
                  name={'warehouse'}
                  mode="multiple"
                  label={'Warehouse'}
                  placeHolder={'Select Warehouse'}
                  value={filter?.warehouse}
                  setFilter={setFilter}
                  selectVariant="twoColumn"
                  columnSelectHeader={warehouseSelectColumnHeader}
                  selectionOptions={buildWarehouseSelectOptions(
                    (warehouseDrop || []).filter(warehouse => {
                      if (Array.isArray(filter?.branch)) {
                        return filter?.branch?.length > 0 ? filter?.branch?.includes(warehouse?.branchId?.id) : true;
                      }
                      return warehouse?.branchId?.id === filter?.branch;
                    })
                  )}
                  allowClear={true}
                  disabled={!filter?.branch || (Array.isArray(filter?.branch) && filter?.branch?.length === 0)}
                  loading={warehouseLoading}
                  onFocus={() => {
                    if (!isApicalledRefFilter.current.warehouseDropdown) {
                      handleOnFocusApiCall(API_CALLED_ENUM.WAREHOUSE_DROPDOWN);
                    }
                  }}
                />
              </div>
              {isSplitWise && isSplitSessionActive ? (
                <div className="flex items-center gap-x-4 pt-5">
                  <FilterInput type={filterInputEnum?.SWITCH} name="isSplit" value={filter?.isSplit} setFilter={setFilter} allowClear={true} />
                  <div>Split</div>
                </div>
              ) : (
                <div className="hidden lg:block" />
              )}
            </div>
          </div>
        </div>
      )}

      <CommonFilterTags
        searchParams={searchParams}
        setFilter={setFilter}
        updateUrlParams={updateUrlParams}
        handleClear={handleResetFilters}
        handleResetFilters={handleResetFilters}
        dateKeys={{
          startDateKey: 'startDate',
          endDateKey: 'endDate',
          singleDateKey: 'quoteDate',
        }}
        onDateClear={() => {
          setSelectedPreset('custom');
          setDateRange(null);
          updateUrlParams({
            startDate: null,
            endDate: null,
            quoteDate: null,
            page: 1,
          });
        }}
        divDrop={divDrop}
        branchDrop={allBranchDrop}
        extraFilters={{
          item: {
            label: 'Item',
            format: value => {
              const found = allItemDrop?.find(opt => String(opt?._id) === String(value));
              return found ? getItemSelectDisplayLabel(found) || null : null;
            },
            clear: (setFilter, updateUrlParams) => {
              setFilter(prev => ({
                ...prev,
                item: '',
                division: null,
                branch: null,
                warehouse: null,
              }));
              updateUrlParams({
                item: null,
                division: null,
                branch: null,
                warehouse: null,
                page: 1,
              });
            },
          },
          warehouse: {
            label: 'Warehouse',
            format: value =>
              value
                .split(',')
                .map(id => warehouseDrop?.find(x => x?.id === id)?.name)
                .filter(Boolean)
                .join(', '),
            clear: (setFilter, updateUrlParams) => {
              setFilter(prev => ({ ...prev, warehouse: null }));
              updateUrlParams({ warehouse: null });
            },
          },
          isSplit: {
            label: 'Split',
            format: value => (String(value) === 'true' ? 'On' : 'Off'),
            clear: (setFilterFn, updateUrl) => {
              setFilterFn(prev => ({
                ...prev,
                isSplit: false,
              }));
              updateUrl({
                isSplit: false,
              });
            },
          },
        }}
      />
      <div className="my-container">
        <CustomTable
          columns={itemLedgerReportColumn()}
          loading={loading}
          data={
            filter?.item && itemHistory?.length > 0
              ? (() => {
                  const currentPage = Number(searchParams?.get('page')) || 1;
                  const totalPages = pagination?.totalPages || 1;

                  const rows = [...itemHistory];

                  if (currentPage === 1) {
                    rows.unshift({
                      key: 'opening-balance',
                      isBalanceRow: true,
                      label: 'Opening Quantity',
                      amount: pagination?.openingBalance || 0,
                      runAmount: pagination?.openingAmount || 0,
                    });
                  } else {
                    rows.unshift({
                      key: 'brought-forward',
                      isBalanceRow: true,
                      label: 'Brought Forward',
                      amount: pagination?.broughtForward || 0,
                      runAmount: pagination?.broughtForwardAmount || 0,
                    });
                  }

                  if (currentPage !== totalPages) {
                    rows.push({
                      key: 'carried-over',
                      isBalanceRow: true,
                      label: 'Carried Over',
                      amount: pagination?.carriedOver || 0,
                      runAmount: pagination?.carriedOverAmount || 0,
                    });
                  }

                  rows.push({
                    key: 'closing-balance',
                    isBalanceRow: true,
                    label: 'Closing Quantity',
                    amount: pagination?.closingBalance || 0,
                    runAmount: pagination?.closingAmount || 0,
                  });

                  return rows;
                })()
              : []
          }
          pagination={
            filter?.item && itemHistory?.length > 0
              ? {
                  current: Number(searchParams?.get('page')) || 1,
                  pageSize: Number(searchParams?.get('limit')) || pagination?.limit,
                  total: pagination?.totalResults || 0,
                  onChange: handlePaginationChange,
                }
              : false
          }
          onRowClick={handleRowClick}
          rowClassName={record => (getRowDetailPath(record) ? '' : 'ledger-row-no-click')}
        />
      </div>
      <style>{`
        .ledger-row-no-click td {
          cursor: default !important;
        }
      `}</style>
    </div>
  );
};

export default ViewItemLedgersReport;
