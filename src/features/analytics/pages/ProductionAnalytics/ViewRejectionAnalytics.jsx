import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Bar } from '@ant-design/charts';
import { Tooltip } from 'antd';

import { KpiValueSkeleton, MethodBreakdownSkeleton, RejectionShimmerStyles, TrendChartSkeleton } from './components/ViewRejectionAnalyticsSkeleton';

import CustomButton from '@/components/ui/button/CustomButton';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import CustomDatePicker from '@/components/forms/formDatePicker/CustomDatePicker';
import FilterInput from '@/components/forms/formInput/FilterInput';
import FilterDrawer, { FilterSection, FilterButton } from '@/components/ui/common/FilterDrawer';
import Icons from '@/assets/icons/icon';
import { colorPalette } from '@/utils/theme';
import { dateFormateForBackend, getPresetDateRange } from '@/utils/services';
import { CommonFilterTags, useFilters } from '@/utils/filtersUtils';
import { filterInputEnum, PRODUCTION_MODULE_METHOD } from '@/utils/constants';
import { useRejectionAnalytics } from '@/features/analytics/useRejectionAnalytics';
import { rejectionByItemColumns, rejectionByRawMaterialColumns, rejectionByProcessColumns, rejectionByBranchColumns } from '@/features/analytics';
import { toDecimalString } from '@/utils/currency';

// ─── Default preset ───────────────────────────────────────────────────────────
const DEFAULT_PRESET = 'last3Months';
const REJECTION_ANALYTICS_FILTER_KEY = 'rejection_analytics_filter';

// ─── Constants ───────────────────────────────────────────────────────────────

const METHOD_OPTIONS = [
  { value: PRODUCTION_MODULE_METHOD.BOM_BASED, label: 'BOM Based' },
  { value: PRODUCTION_MODULE_METHOD.PROCESS_ROUTE, label: 'Process Route' },
];

const GROUP_BY_OPTIONS = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
];

const REJECTION_ACTIVE_FILTER_CONFIG = {
  productionManageMethod: {
    label: 'Production Method',
    format: value => METHOD_OPTIONS.find(o => o.value === value)?.label || value,
    clear: (setFilter, updateUrlParams) => {
      setFilter(prev => ({ ...prev, productionManageMethod: '' }));
      updateUrlParams({ productionManageMethod: null });
    },
  },
  groupBy: {
    label: 'Group Trend By',
    format: value => GROUP_BY_OPTIONS.find(o => o.value === value)?.label || value,
    clear: (setFilter, updateUrlParams) => {
      setFilter(prev => ({ ...prev, groupBy: 'month' }));
      updateUrlParams({ groupBy: 'month' });
    },
  },
};

// ─── KPI Card (matches AnalyticsCard / dashboard convention) ──────────────────

const KpiCard = ({ label, value, suffix = '', icon, loading }) => (
  <div className="bg-white border-r border-b border-gray-200 p-3 sm:p-4 h-full">
    <div className="flex flex-col items-start justify-between gap-2 mb-2">
      <div className="p-2 sm:p-2.5 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(23, 133, 182, 0.08)', color: colorPalette.primary[500] }}>
        {icon}
      </div>
    </div>
    <div className="space-y-0.5">
      <p className="text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide line-clamp-1">{label}</p>
      {loading ? (
        <KpiValueSkeleton />
      ) : (
        <p className="text-lg sm:text-lg font-bold text-gray-900 leading-tight break-words cursor-default">
          {value ?? 0}
          {suffix}
        </p>
      )}
    </div>
  </div>
);

// ─── Section wrapper ─────────────────────────────────────────────────────────

const Section = ({ title, children, extra }) => (
  <div className="bg-white border border-gray-200">
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
      <h3 className="font-semibold text-gray-800 text-sm">{title}</h3>
      {extra}
    </div>
    <div className="p-4">{children}</div>
  </div>
);

// ─── Empty state ─────────────────────────────────────────────────────────────

const EmptyState = ({ text = 'No data available' }) => (
  <div className="flex flex-col items-center justify-center py-10 text-gray-400">
    <Icons.InboxOutlined style={{ fontSize: 36 }} />
    <p className="mt-2 text-sm">{text}</p>
  </div>
);

// ─── Rejection rate badge ─────────────────────────────────────────────────────

const RateBadge = ({ rate }) => {
  const value = Number(rate ?? 0);
  const color = value === 0 ? 'text-green-600 bg-green-50' : value < 5 ? 'text-yellow-600 bg-yellow-50' : 'text-red-600 bg-red-50';
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{toDecimalString(value)}%</span>;
};

// ─── Main component ──────────────────────────────────────────────────────────

const ViewRejectionAnalytics = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilter, setShowFilter] = useState(false);

  const { filter, setFilter, selectedPreset, setSelectedPreset, dateRange, setDateRange, updateUrlParams, handleFilter, handleResetFilters } = useFilters({
    searchParams,
    setSearchParams,
    pagination: { limit: 10 },
    FILTER_KEY: REJECTION_ANALYTICS_FILTER_KEY,
    setShowFilter,
    defaultFilter: {
      productionManageMethod: searchParams.get('productionManageMethod') || '',
      groupBy: searchParams.get('groupBy') || 'month',
    },
  });

  const searchParamsKey = searchParams.toString();

  const {
    summary,
    summaryLoading,
    trend,
    trendLoading,
    byItem,
    byItemLoading,
    byRawMaterial,
    byRawMaterialLoading,
    byProcess,
    byProcessLoading,
    byBranch,
    byBranchLoading,
    getSummary,
    getTrend,
    getByItem,
    getByRawMaterial,
    getByProcess,
    getByBranch,
    resetAll,
  } = useRejectionAnalytics();

  const controllerRef = useRef(null);
  const defaultDatesSetRef = useRef(false);

  const getBasePayload = useCallback(() => {
    const method = searchParams.get('productionManageMethod') || undefined;
    const startDate = searchParams.get('startDate') || searchParams.get('quoteDate') || undefined;
    const endDate = searchParams.get('endDate') || searchParams.get('quoteDate') || undefined;

    return {
      ...(startDate && endDate ? { startDate, endDate } : {}),
      productionManageMethod: method,
    };
  }, [searchParamsKey]);

  const fetchRejectionData = useCallback(() => {
    const { productionManageMethod, ...rest } = getBasePayload();

    controllerRef.current?.abort();
    controllerRef.current = new AbortController();
    const signal = controllerRef.current.signal;
    const base = { ...rest, productionManageMethod, signal };
    const groupBy = searchParams.get('groupBy') || 'month';

    getSummary(base);
    getTrend({ ...base, groupBy });
    getByItem(base);
    getByRawMaterial(base);
    if (!productionManageMethod || productionManageMethod === PRODUCTION_MODULE_METHOD.PROCESS_ROUTE) {
      getByProcess(base);
    }
    getByBranch(base);
  }, [searchParamsKey, getBasePayload, getSummary, getTrend, getByItem, getByRawMaterial, getByProcess, getByBranch]);

  useEffect(() => {
    if (!defaultDatesSetRef.current) {
      defaultDatesSetRef.current = true;
      if (!searchParams.get('startDate') || !searchParams.get('endDate')) {
        if (!searchParams.get('quoteDate')) {
          const defaultRange = getPresetDateRange(DEFAULT_PRESET);
          setSelectedPreset(DEFAULT_PRESET);
          setDateRange(defaultRange);
          updateUrlParams({
            preset: DEFAULT_PRESET,
            startDate: dateFormateForBackend(defaultRange[0]),
            endDate: dateFormateForBackend(defaultRange[1]),
            groupBy: filter.groupBy || 'month',
            productionManageMethod: filter.productionManageMethod || '',
          });
          return;
        }
      }
    }

    fetchRejectionData();
    return () => controllerRef.current?.abort();
  }, [fetchRejectionData]);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
      resetAll();
    };
  }, []);

  const handleDateClear = () => {
    setSelectedPreset('custom');
    setDateRange(null);
    updateUrlParams({ startDate: null, endDate: null, quoteDate: null, preset: null });
  };

  const getActiveFiltersCount = () => {
    return [
      searchParams.get('startDate') || searchParams.get('quoteDate'),
      searchParams.get('productionManageMethod'),
      searchParams.get('groupBy') && searchParams.get('groupBy') !== 'month' ? searchParams.get('groupBy') : null,
    ].filter(Boolean).length;
  };

  const containerRef = useRef(null);

  const appliedMethod = searchParams.get('productionManageMethod') || '';
  const appliedGroupBy = searchParams.get('groupBy') || 'month';

  // ── Bar chart config ──
  const trendChartConfig = {
    data: (trend || [])
      .map(d => [
        { period: d.period, value: d.rejectedQty, type: 'Rejected' },
        { period: d.period, value: d.submittedQty, type: 'Submitted' },
      ])
      .flat(),
    xField: 'period',
    yField: 'value',
    colorField: 'type',
    group: true,
    color: [colorPalette.primary[500], '#22c55e'],
    columnStyle: { radius: [3, 3, 0, 0] },
    legend: { position: 'top-right' },
    xAxis: { label: { autoRotate: true } },
    yAxis: { label: { formatter: v => v } },
    tooltip: {
      formatter: d => ({ name: d.type, value: d.value }),
    },
    height: 260,
  };

  const showProcessSection = !appliedMethod || appliedMethod === PRODUCTION_MODULE_METHOD.PROCESS_ROUTE;
  const showRawMaterialSection = !appliedMethod || appliedMethod === PRODUCTION_MODULE_METHOD.BOM_BASED;

  return (
    <div ref={containerRef} className="-m-4 bg-white">
      <div className="px-4 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        <div className="flex items-center gap-3">
          <CustomButton type="default" text={<Icons.ArrowLeftOutlined />} onClick={() => navigate('/analytics')} />
          <p className="font-bold text-[1.125rem]">Production Rejection Analytics</p>
          <div className="pointer-events-auto cursor-pointer mt-1 inline-block">
            <Tooltip title="Tracks FG rejection rates, raw material waste, and process funnel losses across production orders." placement="right">
              <Icons.InfoCircleOutlined style={{ color: colorPalette.primary[500] }} />
            </Tooltip>
          </div>
        </div>
        <div className="flex flex-wrap justify-center md:justify-end gap-2 md:gap-3 w-full md:w-auto">
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
            <CustomDatePicker selectedPreset={selectedPreset} setSelectedPreset={setSelectedPreset} dateRange={dateRange} setDateRange={setDateRange} label="Date Range" />
          </div>
        </FilterSection>

        <FilterSection title="What">
          <div className="space-y-2">
            <FilterInput
              type={filterInputEnum?.SELECT}
              name="productionManageMethod"
              label="Production Method"
              placeHolder="All Methods"
              selectionOptions={METHOD_OPTIONS}
              value={filter?.productionManageMethod}
              setFilter={setFilter}
              allowClear
              getPopupContainer={() => containerRef.current || document.body}
            />
          </div>
          <div className="space-y-2">
            <FilterInput
              type={filterInputEnum?.SELECT}
              name="groupBy"
              label="Group Trend By"
              placeHolder="Select Period"
              selectionOptions={GROUP_BY_OPTIONS}
              value={filter?.groupBy}
              setFilter={setFilter}
              allowClear={false}
              getPopupContainer={() => containerRef.current || document.body}
            />
          </div>
        </FilterSection>
      </FilterDrawer>

      <CommonFilterTags
        filterClassName="!mb-0 border-t"
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
        onDateClear={handleDateClear}
        extraFilters={REJECTION_ACTIVE_FILTER_CONFIG}
      />

      <div className="px-4 pb-6 space-y-4">
        <RejectionShimmerStyles />
        <style>{`
          .rejection-top5-table .ant-table-thead > tr > th,
          .rejection-top5-table .ant-table-tbody > tr > td {
            padding: 6px 8px !important;
          }
        `}</style>
        {/* ── KPI Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 border-t border-l border-gray-200">
          <KpiCard label="Rejection Rate" value={summary?.rejectionRate} suffix="%" icon={<Icons.WarningOutlined style={{ fontSize: 20 }} />} loading={summaryLoading} />
          <KpiCard label="Yield Rate" value={summary?.yieldRate} suffix="%" icon={<Icons.CheckCircleOutlined style={{ fontSize: 20 }} />} loading={summaryLoading} />
          <KpiCard label="Total Rejected" value={summary?.totalRejected} icon={<Icons.CloseCircleOutlined style={{ fontSize: 20 }} />} loading={summaryLoading} />
          <KpiCard label="Total Orders" value={summary?.totalOrders} icon={<Icons.FileTextOutlined style={{ fontSize: 20 }} />} loading={summaryLoading} />
          <KpiCard label="RM Rejected" value={toDecimalString(summary?.totalRawMaterialRejected)} icon={<Icons.BoxPlotOutlined style={{ fontSize: 20 }} />} loading={summaryLoading} />
        </div>

        {/* ── Method Breakdown ── */}
        {summaryLoading ? (
          <MethodBreakdownSkeleton />
        ) : (
          summary?.byMethod?.length > 0 && (
            <div className="flex flex-row gap-4 w-full overflow-x-auto">
              {summary.byMethod.map(m => (
                <div key={m.method} className="flex-1 min-w-[220px] bg-white border border-gray-200 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] text-gray-500 uppercase tracking-wide mb-1 font-medium">{m.method === PRODUCTION_MODULE_METHOD.BOM_BASED ? 'BOM Based' : 'Process Route'}</p>
                    <p className="text-xl font-bold text-gray-900">{m.totalOrders} orders</p>
                    <p className="text-sm text-gray-500 mt-0.5">Planned: {m.totalPlanned}</p>
                  </div>
                  <div className="text-right">
                    <RateBadge rate={m.rejectionRate} />
                    <p className="text-sm font-semibold text-red-600 mt-1">{m.totalRejected} rejected</p>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ── Trend Chart ── */}
        <Section
          title="Rejection Trend"
          extra={<span className="text-xs text-gray-400">{appliedGroupBy === 'day' ? 'Daily' : appliedGroupBy === 'week' ? 'Weekly' : 'Monthly'} · Rejected vs Submitted</span>}
        >
          {trendLoading ? <TrendChartSkeleton /> : trend?.length > 0 ? <Bar {...trendChartConfig} /> : <EmptyState text="No trend data for the selected period" />}
        </Section>

        {/* ── By Item + By Branch ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Section title="Top 5 — Rejection by Finished Good" extra={<span className="text-[11px] text-gray-400">Sorted by qty rejected</span>}>
            <CustomTable
              columns={rejectionByItemColumns()}
              data={byItem}
              loading={byItemLoading}
              rowKey={r => r.itemId?.toString() || r.itemName}
              pagination={false}
              compactOnDesktop
              customStyle="rejection-top5-table"
              locale={{ emptyText: <EmptyState text="No item rejection data" /> }}
            />
          </Section>

          <Section title="Top 5 — Rejection by Branch" extra={<span className="text-[11px] text-gray-400">Sorted by rejection rate</span>}>
            <CustomTable
              columns={rejectionByBranchColumns()}
              data={byBranch}
              loading={byBranchLoading}
              rowKey={r => r.branchId?.toString() || r.branchName}
              pagination={false}
              compactOnDesktop
              customStyle="rejection-top5-table"
              locale={{ emptyText: <EmptyState text="No branch rejection data" /> }}
            />
          </Section>
        </div>

        {/* ── By Raw Material + By Process ── */}
        {(showRawMaterialSection || showProcessSection) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {showRawMaterialSection && (
              <Section
                title="Top 5 — Raw Material Rejection"
                extra={
                  <span className="text-[11px] font-medium px-2 py-0.5" style={{ backgroundColor: 'rgba(23, 133, 182, 0.08)', color: colorPalette.primary[500] }}>
                    BOM Based orders
                  </span>
                }
              >
                <CustomTable
                  columns={rejectionByRawMaterialColumns()}
                  data={byRawMaterial}
                  loading={byRawMaterialLoading}
                  rowKey={r => r.rawMaterialId?.toString() || r.itemName}
                  pagination={false}
                  compactOnDesktop
                  customStyle="rejection-top5-table"
                  locale={{ emptyText: <EmptyState text="No raw material rejection data" /> }}
                />
              </Section>
            )}

            {showProcessSection && (
              <Section
                title="Top 5 — Rejection by Process Step"
                extra={
                  <span className="text-[11px] font-medium px-2 py-0.5" style={{ backgroundColor: 'rgba(23, 133, 182, 0.08)', color: colorPalette.primary[500] }}>
                    Process Route orders
                  </span>
                }
              >
                <CustomTable
                  columns={rejectionByProcessColumns()}
                  data={byProcess}
                  loading={byProcessLoading}
                  rowKey={r => r.processName}
                  pagination={false}
                  compactOnDesktop
                  customStyle="rejection-top5-table"
                  locale={{ emptyText: <EmptyState text="No process rejection data" /> }}
                />
              </Section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewRejectionAnalytics;
