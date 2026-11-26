import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Dropdown, Space, Tooltip } from 'antd';

// Components
import { CommonFilterTags } from '@/utils/filtersUtils';
import CustomButton from '@/components/ui/button/CustomButton';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomDatePicker from '@/components/forms/formDatePicker/CustomDatePicker';
import FilterInput from '@/components/forms/formInput/FilterInput';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import PageHeader from '@/components/ui/common/PageHeader';
import ItemDrawerDetails from '@/features/allMaster/item/components/ItemDrawerDetails';
import ExportReportModal from '@/components/feedback/formModal/ExportReportModal';
import Toast from '@/components/ui/common/Toast';

// Hooks
import useModulePermissions from '@/hooks/useModulePermissions';
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import { useRejectionAnalytics } from '@/features/analytics/useRejectionAnalytics';
import { useProfile } from '@/features/setting/profile/useProfile';

// Extras
import { itemRejectionAnalyticsColumn, itemRejectionAnalyticsProductionOrderColumn, flattenItemRejectionExportRows, itemRejectionAnalyticsExportColumn } from '@/features/analytics';
import { getItemRejectionReport } from '@/features/analytics/rejectionAnalytics.service';
import Icons from '@/assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { ANALYTICS_TOOLTIPS, filterInputEnum } from '@/utils/constants';
import { dateFormateForBackend, getPresetDateRange, getQueryParams } from '@/utils/services';
import { colorPalette } from '@/utils/theme';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';
import { buildExportRows, downloadExcelExport, resolveExportFileName } from '@/utils/exportData';
import { renderPdfToBlob } from '@/utils/loadReactPdf';
import { isCanceledRequestError } from '@/utils/serviceHelper';
import { buildItemFilterSelectOptions, itemSelectColumnHeader, itemSelectDropdownProps } from '@/utils/tableSelectDropdown/itemSelectDropdown';

const API_CALLED_ENUM = {
  ITEM_DROPDOWN: 'itemDropdown',
};

const ViewItemRejectionAnalytics = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilter, setShowFilter] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(searchParams?.get('preset') || 'custom');
  const {
    itemRejectionReport,
    itemRejectionReportSummary,
    itemRejectionReportPagination,
    itemRejectionReportLoading,
    getItemRejectionReport: fetchItemRejectionReport,
    resetItemRejectionReportData,
  } = useRejectionAnalytics();
  const { allItemDrop, warehouseLoading: itemLoading, getAllItemDrop } = useModulePermissions(RESOURCES.ANALYTICS);
  const { useModuleItemRejectionAnalytics } = useModulePermissions(RESOURCES.ANALYTICS_PERMISSIONS.ITEM_REJECTION_ANALYTICS);
  const { profile, getProfile } = useProfile();
  const [expandedRowKeys, setExpandedRowKeys] = useState([]);
  const [viewItemDetail, setViewItemDetail] = useState(false);
  const [selectedItemData, setSelectedItemData] = useState(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedExportFormat, setSelectedExportFormat] = useState('pdf');
  const [printLoading, setPrintLoading] = useState(false);
  const isApicalledRefFilter = useRef({
    itemDropdown: false,
  });

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
    itemId: searchParams.get('itemId') || '',
    itemType: searchParams.get('itemType') || '',
  });

  useEffect(() => {
    const controller = new AbortController();
    const page = parseInt(searchParams?.get('page')) || 1;
    const pageSize = parseInt(searchParams?.get('limit')) || itemRejectionReportPagination.limit || DEFAULT_PAGE_SIZE;
    const payload = getQueryParams(window.location.href) || {};

    fetchItemRejectionReport({ ...payload, page, limit: pageSize, signal: controller.signal });

    return () => controller.abort();
  }, [searchParams]);

  useResetOnUnmount(resetItemRejectionReportData);

  const handleOnFocusApiCall = async type => {
    let obj = { ...isApicalledRefFilter.current };

    if (type === API_CALLED_ENUM.ITEM_DROPDOWN) {
      await getAllItemDrop({});
      obj.itemDropdown = true;
    }

    isApicalledRefFilter.current = obj;
  };

  useEffect(() => {
    if (searchParams.get('itemId')) {
      handleOnFocusApiCall(API_CALLED_ENUM.ITEM_DROPDOWN);
    }
  }, [filter?.itemId]);

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

  const handleFilter = () => {
    const startDate = dateFormateForBackend(dateRange?.[0]);
    const endDate = dateFormateForBackend(dateRange?.[1]);

    let updatedFilters = {
      ...filter,
      page: 1,
      limit: itemRejectionReportPagination.limit || DEFAULT_PAGE_SIZE,
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

  const handleClear = () => {
    setFilter({
      itemId: null,
      itemType: null,
    });
    updateUrlParams({
      itemId: '',
      itemType: '',
      startDate: null,
      endDate: null,
      preset: '',
      page: 1,
      limit: itemRejectionReportPagination.limit || DEFAULT_PAGE_SIZE,
    });
    setSelectedPreset('custom');
    setDateRange(null);
  };

  const handlePaginationChange = (page, pageSize) => {
    updateUrlParams({ page, limit: pageSize });
  };

  const handleItemCodeClick = item => {
    if (!item?.itemId) return;
    setSelectedItemData({
      id: item.itemId,
      itemNo: item.itemNo,
      itemName: item.itemName,
    });
    setViewItemDetail(true);
  };

  const mainTableColumns = itemRejectionAnalyticsColumn(handleItemCodeClick);
  const productionOrderColumns = itemRejectionAnalyticsProductionOrderColumn();

  const handleExpand = (expanded, record) => {
    if (expanded) {
      setExpandedRowKeys([...expandedRowKeys, record.itemId]);
    } else {
      setExpandedRowKeys(expandedRowKeys.filter(key => key !== record.itemId));
    }
  };

  const expandedRowRender = record => {
    return (
      <div className="bg-slate-50 border-l-4 border-blue-200 p-2">
        <div className="bg-white rounded-md border border-gray-200 overflow-hidden">
          <CustomTable
            columns={productionOrderColumns}
            data={record?.productionOrders}
            loading={false}
            pagination={false}
            dynamicScrollY={false}
            className="border-0 shadow-none"
            customStyle="expanded-batch-table"
          />
        </div>
      </div>
    );
  };

  const buildExportPayload = signal => {
    const payload = getQueryParams(window.location.href) || {};
    return {
      ...payload,
      pagination: false,
      signal,
    };
  };

  const fetchAllExportData = async signal => {
    const response = await getItemRejectionReport(buildExportPayload(signal));
    const data = response?.data ?? {};
    const items = data.items ?? [];
    const summary = {
      totalProductionOrders: data.totalProductionOrders ?? 0,
      totalFgRejectedQty: data.totalFgRejectedQty ?? 0,
      totalRawMaterialRejectedQty: data.totalRawMaterialRejectedQty ?? 0,
      totalRejectedQty: data.totalRejectedQty ?? 0,
      overallRejectionPercentage: data.overallRejectionPercentage ?? 0,
    };
    return { items, summary, rows: flattenItemRejectionExportRows(items) };
  };

  const buildPdfBlob = async (rows, summary) => {
    const result = await getProfile({});
    const freshProfile = result?.payload?.data || profile;
    const { ItemRejectionAnalyticsPdf } = await import('@smit9313/abss-pdf');
    return renderPdfToBlob(
      <ItemRejectionAnalyticsPdf records={rows} profile={freshProfile} summary={summary} startDate={searchParams?.get('startDate') || ''} endDate={searchParams?.get('endDate') || ''} />
    );
  };

  const downloadPdf = async (rows, summary, filename = 'item_rejection_analytics') => {
    const safeName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    const blob = await buildPdfBlob(rows, summary);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = safeName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadExcel = async (rows, filename = 'item_rejection_analytics') => {
    const exportData = buildExportRows(rows, itemRejectionAnalyticsExportColumn());
    const fileName = resolveExportFileName(filename, 'Item_Rejection_Analytics');
    await downloadExcelExport({
      exportData,
      sheetName: 'Item Rejection',
      fileName,
    });
  };

  const handleMenuClick = e => {
    const format = e.key === '1' ? 'pdf' : 'xlsx';
    setSelectedExportFormat(format);
    setExportModalOpen(true);
  };

  const handleExport = async (format, filename) => {
    const controller = new AbortController();
    try {
      const { rows, summary } = await fetchAllExportData(controller.signal);
      if (!rows.length) {
        Toast.warning('No data available to export.');
        return;
      }

      if (format === 'pdf') {
        await downloadPdf(rows, summary, filename);
      } else if (format === 'xlsx') {
        await downloadExcel(rows, filename);
      }
    } catch (error) {
      if (isCanceledRequestError(error)) return;
      Toast.error('Failed to export. Please try again.');
      throw error;
    }
  };

  const handlePrint = async () => {
    const controller = new AbortController();
    setPrintLoading(true);
    try {
      const { rows, summary } = await fetchAllExportData(controller.signal);
      if (!rows.length) {
        Toast.warning('No data available to print.');
        return;
      }

      const blob = await buildPdfBlob(rows, summary);
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
    } finally {
      setPrintLoading(false);
    }
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
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden -m-4">
      <div className="bg-white px-4 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        <div className="flex justify-between items-center flex-wrap gap-3 w-full">
          <div className="flex items-center gap-3 flex-wrap flex-1 min-w-0">
            <CustomButton
              type="default"
              text={<Icons.ArrowLeftOutlined />}
              onClick={() => {
                navigate('/analytics');
              }}
            />
            <div className="flex-1 min-w-0">
              <PageHeader
                loading={itemRejectionReportLoading}
                title={
                  <span className="inline-flex items-center gap-2">
                    Item Rejection Analytics
                    <Tooltip title={ANALYTICS_TOOLTIPS.ITEM_REJECTION_ANALYTICS} placement="right">
                      <Icons.InfoCircleOutlined style={{ color: colorPalette.primary[500], fontSize: 14 }} />
                    </Tooltip>
                  </span>
                }
                rightStats={[
                  { label: 'Production Orders', value: itemRejectionReportSummary?.totalProductionOrders || 0 },
                  { label: 'FG Rejected Qty', value: itemRejectionReportSummary?.totalFgRejectedQty || 0 },
                  { label: 'RM Rejected Qty', value: itemRejectionReportSummary?.totalRawMaterialRejectedQty || 0 },
                  { label: 'Total Rejected Qty', value: itemRejectionReportSummary?.totalRejectedQty || 0 },
                  { label: 'Overall Rejection Percentage', value: (itemRejectionReportSummary?.overallRejectionPercentage || 0) + '%' },
                ]}
              />
            </div>
          </div>
          <div className="flex flex-wrap justify-center md:justify-end gap-2 md:gap-3 w-full md:w-auto">
            <Space>
              <Button
                onClick={() => {
                  setShowFilter(!showFilter);
                }}
              >
                {showFilter ? 'Hide Filters' : 'View Filters'}
              </Button>
              <Button type="primary" icon={<Icons.FilterOutlined />} size="middle" className="p-[17px]" onClick={handleFilter}>
                Apply Filters
              </Button>
              {itemRejectionReport?.length > 0 && (
                <>
                  <PermissionButton
                    canAccess={!!useModuleItemRejectionAnalytics?.export || !!useModuleItemRejectionAnalytics?.view}
                    tooltipTitle="You don't have permission to print this report"
                    tooltipProps={{ placement: 'bottom' }}
                    type="default"
                    size="middle"
                    icon={<Icons.PrinterOutlined className="mr-2" />}
                    className="flex items-center"
                    loading={printLoading}
                    onClick={handlePrint}
                  >
                    Print
                  </PermissionButton>
                  <Dropdown menu={menuProps} trigger={['click']}>
                    <PermissionButton
                      canAccess={!!useModuleItemRejectionAnalytics?.export || !!useModuleItemRejectionAnalytics?.view}
                      tooltipTitle="You don't have permission to export this report"
                      tooltipProps={{ placement: 'bottom' }}
                      className="flex items-center"
                    >
                      <Space>
                        Export Report
                        <Icons.DownOutlined />
                      </Space>
                    </PermissionButton>
                  </Dropdown>
                </>
              )}
            </Space>
          </div>
        </div>
      </div>
      <div className="bg-white px-4 py-0 pb-2 space-y-0">
        {showFilter && (
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-6 gap-4 border-t border-gray-300 pt-2 filters-open">
            <div className="space-y-2 md:col-span-2">
              <CustomDatePicker selectedPreset={selectedPreset} setSelectedPreset={setSelectedPreset} dateRange={dateRange} setDateRange={setDateRange} />
            </div>
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name={'itemId'}
                label={'Item'}
                placeHolder={'Select Item'}
                selectVariant="twoColumn"
                columnSelectHeader={itemSelectColumnHeader}
                selectPopupClassName={itemSelectDropdownProps.selectPopupClassName}
                selectionOptions={buildItemFilterSelectOptions(allItemDrop)}
                value={filter?.itemId}
                setFilter={setFilter}
                allowClear={true}
                loading={itemLoading}
                onFocus={() => {
                  if (!isApicalledRefFilter.current.itemDropdown) {
                    handleOnFocusApiCall(API_CALLED_ENUM.ITEM_DROPDOWN);
                  }
                }}
                popupMatchSelectWidth={false}
                dropdownStyle={{ width: '50%', borderRadius: 0 }}
              />
            </div>
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name={'itemType'}
                label={'Item Type'}
                placeHolder={'Select Item Type'}
                selectionOptions={[
                  { value: 'RM', label: 'RM' },
                  { value: 'FG', label: 'FG' },
                ]}
                value={filter?.itemType}
                setFilter={setFilter}
                allowClear={true}
              />
            </div>
          </div>
        )}
        <CommonFilterTags
          filterClassName="!mb-0 border-t"
          searchParams={searchParams}
          setFilter={setFilter}
          updateUrlParams={updateUrlParams}
          handleClear={handleClear}
          handleResetFilters={handleClear}
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
          extraFilters={{
            itemId: {
              label: 'Item',
              format: value => allItemDrop?.find(x => x?._id === value)?.itemName,
              clear: (setFilterFn, updateUrlParamsFn) => {
                setFilterFn(prev => ({ ...prev, itemId: null }));
                updateUrlParamsFn({ itemId: null });
              },
            },
            itemType: {
              label: 'Item Type',
              format: value => value,
              clear: (setFilterFn, updateUrlParamsFn) => {
                setFilterFn(prev => ({ ...prev, itemType: null }));
                updateUrlParamsFn({ itemType: null });
              },
            },
          }}
        />
      </div>
      <div className="bg-white">
        <CustomTable
          columns={mainTableColumns}
          data={itemRejectionReport}
          tableId={record => record?.itemId}
          loading={itemRejectionReportLoading}
          paginationClassName="!left-0"
          pagination={{
            current: parseInt(searchParams.get('page')) || 1,
            pageSize: parseInt(searchParams.get('limit')) || itemRejectionReportPagination.limit || DEFAULT_PAGE_SIZE,
            total: itemRejectionReportPagination?.totalResults || 0,
            onChange: handlePaginationChange,
          }}
          expandable={{
            expandedRowKeys: expandedRowKeys,
            onExpand: handleExpand,
            expandedRowRender: expandedRowRender,
            expandRowByClick: true,
          }}
        />
      </div>
      {viewItemDetail && <ItemDrawerDetails viewItemDetail={viewItemDetail} setViewItemDetail={setViewItemDetail} itemData={selectedItemData} />}
      <ExportReportModal
        modalOpen={exportModalOpen}
        setModalOpen={setExportModalOpen}
        reportName="item_rejection_analytics"
        onExport={handleExport}
        initialFormat={selectedExportFormat}
        title="Export Report"
        formats={['pdf', 'xlsx']}
      />
    </div>
  );
};

export default ViewItemRejectionAnalytics;
