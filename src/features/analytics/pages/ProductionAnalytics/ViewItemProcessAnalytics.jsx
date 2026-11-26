import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Space, Tooltip } from 'antd';

// Components
import CustomButton from '@/components/ui/button/CustomButton';
import CustomDatePicker from '@/components/forms/formDatePicker/CustomDatePicker';
import FilterInput from '@/components/forms/formInput/FilterInput';
import FilterDrawer, { FilterSection, FilterButton } from '@/components/ui/common/FilterDrawer';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import PermissionButton from '@/components/ui/button/PermissionButton';
import ExportReportModal from '@/components/feedback/formModal/ExportReportModal';
import Toast from '@/components/ui/common/Toast';

// Hooks
import useModulePermissions from '@/hooks/useModulePermissions';
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import { useProcess } from '@/features/allMaster/process/useProcess';

// Extras
import { useAnalytics, itemProcessAnalyticsColumns, itemProcessAnalyticsExportColumn } from '@/features/analytics';
import { analyticsService } from '@/features/analytics/analytics.service';
import Icons from '@/assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { filterInputEnum } from '@/utils/constants';
import { dateFormateForBackend, getPresetDateRange, getQueryParams } from '@/utils/services';
import { colorPalette } from '@/utils/theme';
import { CommonFilterTags } from '@/utils/filtersUtils';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';
import { buildExportRows, downloadExcelExport, resolveExportFileName } from '@/utils/exportData';
import { isCanceledRequestError } from '@/utils/serviceHelper';
import { buildItemFilterSelectOptions, itemSelectColumnHeader, itemSelectDropdownProps } from '@/utils/tableSelectDropdown/itemSelectDropdown';

const API_CALLED_ENUM = {
  ITEM_DROPDOWN: 'itemDropdown',
  PROCESS_DROPDOWN: 'processDropdown',
};

const ViewItemProcessAnalytics = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilter, setShowFilter] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(searchParams?.get('preset') || 'custom');
  const { loading, pagination, itemProcessAnalytics, getItemProcessAnalytics, resetItemProcessAnalytics } = useAnalytics();
  const { allItemDrop, allItemDropLoading: itemLoading, getAllItemDrop } = useModulePermissions(RESOURCES.ANALYTICS);
  const { useModuleItemProcessAnalytics } = useModulePermissions(RESOURCES.ANALYTICS_PERMISSIONS.ITEM_PROCESS_ANALYTICS);
  const { processDrop, loading: processDropLoading, getProcessDropdown, resetProcessDrop } = useProcess();
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const isApicalledRefFilter = useRef({
    itemDropdown: false,
    processDropdown: false,
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
    process: searchParams.get('process')?.split(',').filter(Boolean) || [],
  });

  useEffect(() => {
    const controller = new AbortController();
    const page = parseInt(searchParams?.get('page')) || 1;
    const pageSize = parseInt(searchParams?.get('limit')) || pagination.limit || DEFAULT_PAGE_SIZE;
    const payload = getQueryParams(window.location.href) || {};

    getItemProcessAnalytics({ ...payload, page, limit: pageSize, signal: controller.signal });

    return () => controller.abort();
  }, [searchParams]);

  useResetOnUnmount([resetItemProcessAnalytics, resetProcessDrop]);

  const handleOnFocusApiCall = async type => {
    let obj = { ...isApicalledRefFilter.current };

    if (type === API_CALLED_ENUM.ITEM_DROPDOWN) {
      await getAllItemDrop({});
      obj.itemDropdown = true;
    }

    if (type === API_CALLED_ENUM.PROCESS_DROPDOWN) {
      await getProcessDropdown({});
      obj.processDropdown = true;
    }

    isApicalledRefFilter.current = obj;
  };

  useEffect(() => {
    if (searchParams.get('itemId')) {
      handleOnFocusApiCall(API_CALLED_ENUM.ITEM_DROPDOWN);
    }
  }, [filter?.itemId]);

  useEffect(() => {
    if (searchParams.get('process')) {
      handleOnFocusApiCall(API_CALLED_ENUM.PROCESS_DROPDOWN);
    }
  }, [filter?.process]);

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
      limit: pagination.limit || DEFAULT_PAGE_SIZE,
    };

    if (dateRange) {
      updatedFilters = {
        ...updatedFilters,
        preset: selectedPreset,
        startDate: startDate,
        endDate: endDate,
      };
    }

    updateUrlParams(updatedFilters);
  };

  const handleClear = () => {
    setFilter({
      itemId: null,
      process: [],
    });
    updateUrlParams({
      itemId: '',
      process: [],
      startDate: null,
      endDate: null,
      preset: '',
      page: 1,
      limit: pagination.limit || DEFAULT_PAGE_SIZE,
    });
    setSelectedPreset('custom');
    setDateRange(null);
  };

  const getActiveFiltersCount = () => {
    return [searchParams.get('startDate') || searchParams.get('quoteDate'), searchParams.get('itemId'), searchParams.get('process')].filter(Boolean).length;
  };

  const containerRef = useRef(null);

  const handlePaginationChange = (page, pageSize) => {
    updateUrlParams({ page, limit: pageSize });
  };

  const buildExportPayload = signal => {
    const payload = getQueryParams(window.location.href) || {};
    return {
      ...payload,
      pagination: false,
      signal,
    };
  };

  const fetchAllExportRows = async signal => {
    const response = await analyticsService.getItemProcessAnalytics(buildExportPayload(signal));
    return response?.data ?? [];
  };

  const downloadExcel = async (rows, filename = 'item_process_analytics') => {
    const exportData = buildExportRows(rows, itemProcessAnalyticsExportColumn());
    const fileName = resolveExportFileName(filename, 'Item_Process_Analytics');
    await downloadExcelExport({
      exportData,
      sheetName: 'Item Process',
      fileName,
    });
  };

  const handleExport = async (format, filename) => {
    const controller = new AbortController();
    try {
      const rows = await fetchAllExportRows(controller.signal);
      if (!rows.length) {
        Toast.warning('No data available to export.');
        return;
      }
      await downloadExcel(rows, filename);
    } catch (error) {
      if (isCanceledRequestError(error)) return;
      Toast.error('Failed to export. Please try again.');
      throw error;
    }
  };

  return (
    <div ref={containerRef} className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden -m-4">
      <div className="bg-white px-4 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        <div className="flex items-center gap-3">
          <CustomButton
            type="default"
            text={<Icons.ArrowLeftOutlined />}
            onClick={() => {
              navigate('/analytics');
            }}
          />
          <p className="font-bold text-[1.125rem]">Item Process Analytics</p>
          <div className="pointer-events-auto cursor-pointer mt-1 inline-block">
            <Tooltip title="Tracks quantity transferred between production process steps, per item." placement="right">
              <Icons.InfoCircleOutlined style={{ color: colorPalette.primary[500] }} />
            </Tooltip>
          </div>
        </div>
        <div className="flex flex-wrap justify-center md:justify-end gap-2 md:gap-3 w-full md:w-auto">
          <Space>
            <FilterButton count={getActiveFiltersCount()} onClick={() => setShowFilter(true)} />
            {itemProcessAnalytics?.length > 0 && (
              <PermissionButton
                canAccess={!!useModuleItemProcessAnalytics?.export || !!useModuleItemProcessAnalytics?.view}
                tooltipTitle="You don't have permission to export this report"
                tooltipProps={{ placement: 'bottom' }}
                type="default"
                size="middle"
                icon={<Icons.DownloadOutlined className="mr-2" />}
                className="flex items-center"
                onClick={() => setExportModalOpen(true)}
              >
                Export Report
              </PermissionButton>
            )}
          </Space>
        </div>
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
            <CustomDatePicker selectedPreset={selectedPreset} setSelectedPreset={setSelectedPreset} dateRange={dateRange} setDateRange={setDateRange} label="Date Range" />
          </div>
        </FilterSection>

        <FilterSection title="What">
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
              getPopupContainer={() => containerRef.current || document.body}
            />
          </div>
          <div className="space-y-2">
            <FilterInput
              type={filterInputEnum?.SELECT}
              mode="multiple"
              name={'process'}
              label={'Process'}
              placeHolder={'Select Process (From / To)'}
              selectionOptions={(processDrop || []).map(proc => ({
                label: proc.name,
                value: proc.name,
              }))}
              value={filter?.process}
              setFilter={setFilter}
              allowClear={true}
              loading={processDropLoading}
              onFocus={() => {
                if (!isApicalledRefFilter.current.processDropdown) {
                  handleOnFocusApiCall(API_CALLED_ENUM.PROCESS_DROPDOWN);
                }
              }}
              getPopupContainer={() => containerRef.current || document.body}
            />
          </div>
        </FilterSection>
      </FilterDrawer>

      <div className="bg-white px-4 py-0 pb-2 space-y-0">
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
            process: {
              label: 'Process',
              format: value => (Array.isArray(value) ? value.join(', ') : value),
              clear: (setFilterFn, updateUrlParamsFn) => {
                setFilterFn(prev => ({ ...prev, process: [] }));
                updateUrlParamsFn({ process: null });
              },
            },
          }}
        />
      </div>
      <div className="bg-white">
        <CustomTable
          columns={itemProcessAnalyticsColumns()}
          data={itemProcessAnalytics}
          tableId={record => record?.id}
          loading={loading}
          paginationClassName="!left-0"
          pagination={{
            current: parseInt(searchParams.get('page')) || 1,
            pageSize: searchParams?.get('limit') || pagination?.limit,
            total: pagination.totalRecords || 0,
            onChange: handlePaginationChange,
          }}
        />
      </div>
      <ExportReportModal
        modalOpen={exportModalOpen}
        setModalOpen={setExportModalOpen}
        reportName="item_process_analytics"
        onExport={handleExport}
        initialFormat="xlsx"
        title="Export Report"
        formats={['xlsx']}
      />
    </div>
  );
};

export default ViewItemProcessAnalytics;
