import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, forwardRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { useDispatch } from 'react-redux';

import { useProductionDashboard } from '@/features/dashboard/productionDashboard/useProductionDashboard';
import useModulePermissions from '@/hooks/useModulePermissions';
import { Button, Skeleton, Tag, Tooltip } from '@/components/AntDComponent';
import CustomDatePicker from '@/components/forms/formDatePicker/CustomDatePicker';
import FilterInput from '@/components/forms/formInput/FilterInput';
import { FILTERS_KEYS, RESOURCES } from '@/utils/jsonFile';
import { colorPalette } from '@/utils/theme';
import { filterInputEnum, PRODUCTION_MODULE_STATUS } from '@/utils/constants';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import { resetBranch } from '@/features/allMaster/warehouse/warehouse.slice';
import { getAllFiltersFromLocalStorage, saveAllFiltersToLocalStorage } from '@/utils/filters';
import { buildBranchSelectOptions, buildDivisionSelectOptions, divisionSelectColumnHeader, branchSelectColumnHeader } from '@/utils/tableSelectDropdown/orgSelectDropdown';

const PRODUCTION_FILTER_STORAGE_KEY = FILTERS_KEYS.PRODUCTION_PIPELINE_DASHBOARD_FILTERS;

const FY_START_MONTH = 3;
const defaultDateRange = () => {
  const today = dayjs();
  const fyStart = today.month() >= FY_START_MONTH ? today.month(FY_START_MONTH).startOf('month') : today.subtract(1, 'year').month(FY_START_MONTH).startOf('month');
  return [fyStart, today.endOf('day')];
};

const fmt = (n, dec = 0) => (n == null ? '—' : Number(n).toLocaleString('en-IN', { maximumFractionDigits: dec, minimumFractionDigits: dec }));
const pct = n => (n == null ? '—' : `${n}%`);

const SHORT_STATUS_LABEL = {
  PENDING: 'Pending',
  WAITING_FOR_INVENTORY_APPROVAL: 'Awaiting Inv.',
  INVENTORY_ISSUED: 'Inv. Issued',
  INVENTORY_REJECTED: 'Inv. Rejected',
  PARTIAL: 'In Production',
  COMPLETED: 'Completed',
  ON_HOLD: 'On Hold',
  CLOSED: 'Closed',
};

// ─── 5-stage pipeline config ──────────────────────────────────────────────────
const STAGE_CONFIG = [
  {
    id: 'so',
    label: 'Sales Orders',
    sub: 'Linked to production',
    color: '#1e4fd6',
    bgActive: '#e8eefb',
    statuses: null,
    tooltip: 'Total sales orders in the period. Conversion Rate = SOs with at least one production order ÷ total SOs.',
  },
  {
    id: 'pending',
    label: 'Awaiting Production',
    sub: 'Pending start',
    color: '#8a94ab',
    bgActive: '#f1f2f6',
    statuses: ['PENDING'],
    tooltip: 'Production orders in PENDING status — created but not yet started. Click to see sample orders.',
  },
  {
    id: 'rm',
    label: 'Raw Material Stage',
    sub: 'Inventory processing',
    color: '#6d28d9',
    bgActive: '#f5f3ff',
    statuses: ['WAITING_FOR_INVENTORY_APPROVAL', 'INVENTORY_ISSUED', 'INVENTORY_REJECTED'],
    tooltip: 'Orders across 3 statuses: Waiting for Inventory Approval + Inventory Issued + Inventory Rejected. Counts and quantities are summed across all three.',
  },
  {
    id: 'inprog',
    label: 'In Production',
    sub: 'Job card active',
    color: '#b45309',
    bgActive: '#fffbeb',
    statuses: ['PARTIAL'],
    tooltip: 'Orders in PARTIAL status — some finished goods submitted but order not yet complete.',
  },
  {
    id: 'done',
    label: 'Completed',
    sub: 'FG ready / Closed',
    color: '#15803d',
    bgActive: '#ecfdf5',
    statuses: ['COMPLETED', 'CLOSED', 'ON_HOLD'],
    tooltip: 'Orders across 3 statuses: Completed + Closed + On Hold. Counts and quantities are summed across all three.',
  },
];

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard = ({ label, value, sub, accent, tooltip }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4">
    <div className="flex items-center gap-1 mb-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
      {tooltip && (
        <Tooltip title={tooltip} placement="top">
          <span className="text-gray-300 hover:text-gray-500 cursor-help text-[11px] leading-none">ⓘ</span>
        </Tooltip>
      )}
    </div>
    <p className="text-[22px] font-bold leading-tight tabular-nums" style={{ color: accent || colorPalette.primary[500] }}>
      {value}
    </p>
    {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
const ProductionDashboard = forwardRef(function ProductionDashboard({ filtersPortalEl = null, activeFiltersPortalEl = null, filtersLocked = false }, ref) {
  const dispatch = useDispatch();
  const { divDrop, divisionLoading, getDivDropDown, branchDrop, branchLoading, getBranchDropDown } = useModulePermissions(RESOURCES.HOME);
  const { summary, summaryLoading, pipeline, pipelineLoading, salesFunnel, salesFunnelLoading, topItems, topItemsLoading, fetchSummary, fetchPipeline, fetchSalesOrderFunnel, fetchTopItems, reset } =
    useProductionDashboard();

  const [searchParams, setSearchParams] = useSearchParams();
  const spStart = searchParams.get('startDate') || null;
  const spEnd = searchParams.get('endDate') || null;
  const spDivision = searchParams.get('division') || '';
  const spBranch = searchParams.get('branch') || '';

  const initialDateRange = spStart && spEnd ? [dayjs(spStart), dayjs(spEnd)] : defaultDateRange();
  const [selectedPreset, setSelectedPreset] = useState('custom');
  const [dateRange, setDateRange] = useState(initialDateRange);
  const [appliedDateRange, setAppliedDateRange] = useState(initialDateRange);
  const [filter, setFilter] = useState({ division: spDivision, branch: spBranch });
  const [appliedFilters, setAppliedFilters] = useState({ division: spDivision, branch: spBranch });

  const [internalTab, setInternalTab] = useState('pipeline');
  const [activeStageId, setActiveStageId] = useState(null);
  const [isHydrated, setIsHydrated] = useState(!filtersLocked);

  const lockedHydratedRef = useRef(false);
  const isApiCalledRef = useRef({ divisionDropdown: false });

  const syncUrl = useCallback(
    (patch = {}) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev);
          const set = (k, v) => (v ? next.set(k, v) : next.delete(k));
          next.set('dashboard', 'production-pipeline');
          next.delete('record');
          next.delete('tab');
          if ('startDate' in patch) set('startDate', patch.startDate);
          if ('endDate' in patch) set('endDate', patch.endDate);
          if ('division' in patch) set('division', patch.division);
          if ('branch' in patch) set('branch', patch.branch);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  useEffect(() => {
    if (spStart && spEnd) return;
    syncUrl({
      startDate: dayjs(initialDateRange[0]).format('YYYY-MM-DD'),
      endDate: dayjs(initialDateRange[1]).format('YYYY-MM-DD'),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const appliedStartStr = appliedDateRange?.[0] ? dayjs(appliedDateRange[0]).format('YYYY-MM-DD') : '';
  const appliedEndStr = appliedDateRange?.[1] ? dayjs(appliedDateRange[1]).format('YYYY-MM-DD') : '';
  const appliedDivisionStr = appliedFilters?.division || '';
  const appliedBranchStr = appliedFilters?.branch || '';

  const buildPayload = useCallback(
    () => ({
      startDate: appliedStartStr || undefined,
      endDate: appliedEndStr || undefined,
      division: appliedDivisionStr || undefined,
      branch: appliedBranchStr || undefined,
    }),
    [appliedStartStr, appliedEndStr, appliedDivisionStr, appliedBranchStr]
  );

  useEffect(() => {
    if (!isHydrated) return;
    const p = buildPayload();
    fetchSummary(p);
    fetchPipeline(p);
    fetchSalesOrderFunnel(p);
    fetchTopItems(p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, appliedStartStr, appliedEndStr, appliedDivisionStr, appliedBranchStr]);

  useEffect(() => {
    const controller = new AbortController();
    if (!filter.division) {
      dispatch(resetBranch());
    } else {
      getBranchDropDown({ divisionId: filter.division, signal: controller.signal });
    }
    return () => controller.abort();
  }, [filter.division, dispatch, getBranchDropDown]);

  useEffect(() => {
    if (!filtersLocked) {
      if (!isHydrated) setIsHydrated(true);
      return;
    }
    if (lockedHydratedRef.current) return;
    const saved = getAllFiltersFromLocalStorage(PRODUCTION_FILTER_STORAGE_KEY);
    if (!saved || Object.keys(saved).length === 0) {
      lockedHydratedRef.current = true;
      setIsHydrated(true);
      return;
    }
    lockedHydratedRef.current = true;
    if (saved.startDate && saved.endDate) {
      const dr = [dayjs(saved.startDate), dayjs(saved.endDate)];
      setDateRange(dr);
      setAppliedDateRange(dr);
    }
    const newDivision = saved.division || '';
    const newBranch = saved.branch || '';
    setFilter({ division: newDivision, branch: newBranch });
    setAppliedFilters({ division: newDivision, branch: newBranch });
    syncUrl({ startDate: saved.startDate || null, endDate: saved.endDate || null, division: newDivision || null, branch: newBranch || null });
    if (newDivision && !isApiCalledRef.current.divisionDropdown) {
      getDivDropDown({});
      isApiCalledRef.current.divisionDropdown = true;
    }
    setIsHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersLocked]);

  useEffect(() => {
    return () => {
      reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistFiltersToStorage = useCallback(() => {
    const toSave = {
      division: filter.division || '',
      branch: filter.branch || '',
      startDate: dateRange?.[0] ? dayjs(dateRange[0]).format('YYYY-MM-DD') : null,
      endDate: dateRange?.[1] ? dayjs(dateRange[1]).format('YYYY-MM-DD') : null,
    };
    const cleaned = Object.fromEntries(Object.entries(toSave).filter(([, v]) => v !== '' && v !== null && v !== undefined));
    saveAllFiltersToLocalStorage(cleaned, PRODUCTION_FILTER_STORAGE_KEY);
  }, [filter.division, filter.branch, dateRange]);

  const handleApplyFilters = () => {
    setAppliedFilters({ division: filter.division, branch: filter.branch });
    setAppliedDateRange(dateRange);
    syncUrl({
      startDate: dateRange?.[0] ? dayjs(dateRange[0]).format('YYYY-MM-DD') : null,
      endDate: dateRange?.[1] ? dayjs(dateRange[1]).format('YYYY-MM-DD') : null,
      division: filter.division || null,
      branch: filter.branch || null,
    });
    if (filtersLocked) persistFiltersToStorage();
  };

  const handleResetFilters = () => {
    setFilter({ division: '', branch: '' });
    setAppliedFilters({ division: '', branch: '' });
    setDateRange(null);
    setAppliedDateRange(null);
    setSelectedPreset('custom');
    syncUrl({ startDate: null, endDate: null, division: null, branch: null });
  };

  const filterActionsRef = useRef({ apply: handleApplyFilters, reset: handleResetFilters });
  filterActionsRef.current.apply = handleApplyFilters;
  filterActionsRef.current.reset = handleResetFilters;

  const persistForLockRef = useRef(persistFiltersToStorage);
  persistForLockRef.current = persistFiltersToStorage;

  useImperativeHandle(
    ref,
    () => ({
      applyFilters: () => filterActionsRef.current.apply(),
      resetFilters: () => filterActionsRef.current.reset(),
      saveFiltersForLock: () => persistForLockRef.current(),
    }),
    []
  );

  const activeFilterCount = (appliedFilters.division ? 1 : 0) + (appliedFilters.branch ? 1 : 0) + (appliedDateRange ? 1 : 0);

  // ── Build 5 pipeline stages from backend data ──────────────────────────────
  const computedStages = useMemo(() => {
    return STAGE_CONFIG.map(cfg => {
      if (cfg.id === 'so') {
        const total = salesFunnel?.totalSalesOrders || 0;
        const withPO = salesFunnel?.withProductionOrder || 0;
        const withoutPO = salesFunnel?.withoutProductionOrder || 0;
        const conv = salesFunnel?.conversionRate || 0;
        return {
          ...cfg,
          count: total,
          metrics: [
            ['Total SOs', fmt(total)],
            ['With PO', fmt(withPO)],
            ['Without PO', fmt(withoutPO)],
            ['Linked', pct(conv)],
          ],
          badgeText: `${pct(conv)} LINKED`,
          orders: [],
        };
      }
      const matches = (pipeline?.stages || []).filter(s => cfg.statuses.includes(s.status));
      const count = matches.reduce((a, b) => a + (b.count || 0), 0);
      const totalQty = matches.reduce((a, b) => a + (b.totalQty || 0), 0);
      const submittedQty = matches.reduce((a, b) => a + (b.submittedQty || 0), 0);
      // tag each order with its pipeline stage status (not returned by backend)
      const orders = matches.flatMap(s => (s.orders || []).map(o => ({ ...o, status: s.status }))).slice(0, 5);
      return {
        ...cfg,
        count,
        metrics: [
          ['Orders', fmt(count)],
          ['Total Qty', fmt(totalQty, 2)],
          ['Submitted', fmt(submittedQty, 2)],
          ['Statuses', cfg.statuses.length > 1 ? `${cfg.statuses.length} types` : PRODUCTION_MODULE_STATUS[cfg.statuses[0]] || cfg.statuses[0]],
        ],
        badgeText: cfg.statuses.length > 1 ? `${cfg.statuses.length} STATUSES` : (PRODUCTION_MODULE_STATUS[cfg.statuses[0]] || cfg.statuses[0]).toUpperCase(),
        orders,
      };
    });
  }, [pipeline, salesFunnel]);

  const activeStageData = activeStageId ? computedStages.find(s => s.id === activeStageId) : null;

  // ── Render helpers ─────────────────────────────────────────────────────────
  const renderActiveFilterTags = () => (
    <div className="px-1 py-1.5 bg-gray-50/80 rounded-md border border-gray-100">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-gray-600 font-medium text-sm">Active filters:</span>
        {appliedFilters.division && (
          <Tag
            closable
            onClose={() => {
              setFilter(p => ({ ...p, division: '', branch: '' }));
              setAppliedFilters(p => ({ ...p, division: '', branch: '' }));
              syncUrl({ division: null, branch: null });
            }}
            className="px-3 py-1 bg-white"
          >
            <span className="font-medium capitalize">Division:</span> <span>{divDrop?.find(d => d.id === appliedFilters.division)?.name || appliedFilters.division}</span>
          </Tag>
        )}
        {appliedFilters.branch && (
          <Tag
            closable
            onClose={() => {
              setFilter(p => ({ ...p, branch: '' }));
              setAppliedFilters(p => ({ ...p, branch: '' }));
              syncUrl({ branch: null });
            }}
            className="px-3 py-1 bg-white"
          >
            <span className="font-medium capitalize">Branch:</span> <span>{branchDrop?.find(d => d.id === appliedFilters.branch)?.name || appliedFilters.branch}</span>
          </Tag>
        )}
        {appliedDateRange?.[0] && appliedDateRange?.[1] && (
          <Tag
            closable
            onClose={() => {
              setDateRange(null);
              setAppliedDateRange(null);
              setSelectedPreset('custom');
              syncUrl({ startDate: null, endDate: null });
            }}
            className="px-3 py-1 bg-white"
          >
            <span className="font-medium capitalize">Date:</span>{' '}
            <span>
              {dayjs(appliedDateRange[0]).format('YYYY-MM-DD')} to {dayjs(appliedDateRange[1]).format('YYYY-MM-DD')}
            </span>
          </Tag>
        )}
        <Button type="link" size="small" style={{ color: colorPalette.primary[500] }} onClick={handleResetFilters}>
          Clear all
        </Button>
      </div>
    </div>
  );

  const renderFilterPanelBody = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-start">
        <div className="lg:col-span-2 flex flex-col w-full min-w-0">
          <CustomDatePicker selectedPreset={selectedPreset} setSelectedPreset={setSelectedPreset} dateRange={dateRange} setDateRange={setDateRange} label="Date Range" />
        </div>
        <div className="flex flex-col gap-2 w-full min-w-0">
          <FilterInput
            type={filterInputEnum.SELECT}
            name="division"
            label="Division"
            placeHolder="Select Division"
            selectVariant="twoColumn"
            columnSelectHeader={divisionSelectColumnHeader}
            selectionOptions={buildDivisionSelectOptions(divDrop)}
            value={filter.division}
            setFilter={setFilter}
            allowClear
            extraFilterValues={{ branch: '' }}
            loading={divisionLoading}
            onFocus={() => {
              if (!isApiCalledRef.current.divisionDropdown) {
                getDivDropDown({});
                isApiCalledRef.current.divisionDropdown = true;
              }
            }}
          />
        </div>
        <div className="flex flex-col gap-2 w-full min-w-0">
          <FilterInput
            type={filterInputEnum.SELECT}
            name="branch"
            label="Branch"
            placeHolder="Select Branch"
            selectVariant="twoColumn"
            columnSelectHeader={branchSelectColumnHeader}
            selectionOptions={buildBranchSelectOptions(branchDrop)}
            value={filter.branch}
            setFilter={setFilter}
            allowClear
            loading={branchLoading}
            disabled={!filter.division}
          />
        </div>
      </div>
      {activeFilterCount > 0 && <div className="mt-3 pt-3 border-t border-gray-100">{renderActiveFilterTags()}</div>}
    </>
  );

  return (
    <div>
      {filtersPortalEl && createPortal(renderFilterPanelBody(), filtersPortalEl)}
      {activeFiltersPortalEl && activeFilterCount > 0 && createPortal(renderActiveFilterTags(), activeFiltersPortalEl)}

      {/* Internal tabs */}
      <div className="bg-white border-b border-gray-200 px-5">
        <div className="flex gap-0">
          {[
            { id: 'pipeline', label: 'Pipeline View' },
            { id: 'forecast', label: 'Production Demand' },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setInternalTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium -mb-px whitespace-nowrap transition-[color,border-color] duration-150 border-b-2 ${
                internalTab === tab.id ? 'border-current' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              style={internalTab === tab.id ? { color: colorPalette.primary[500], borderColor: colorPalette.primary[500] } : undefined}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5">
        {/* ─── Pipeline View ─── */}
        {internalTab === 'pipeline' && (
          <>
            {/* KPI Row */}
            {summaryLoading || salesFunnelLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                {[...Array(4)].map((_, i) => (
                  <Skeleton.Button key={i} active block style={{ height: 88 }} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                <KpiCard
                  label="Open Sales Orders"
                  value={fmt(salesFunnel?.totalSalesOrders)}
                  sub={salesFunnel?.withoutProductionOrder ? `${fmt(salesFunnel.withoutProductionOrder)} without PO` : undefined}
                  tooltip="Total sales orders in the selected date range (excluding cancelled). 'Without PO' = SOs not yet linked to a production order."
                />
                <KpiCard
                  label="Active Production Orders"
                  value={fmt(summary?.totalOrders)}
                  sub={`${fmt(summary?.totalQty, 2)} units ordered`}
                  accent="#b45309"
                  tooltip="Count of all production orders in the selected period, across every status. Total Qty = sum of ordered quantities."
                />
                <KpiCard
                  label="FG Ready for Dispatch"
                  value={fmt(summary?.byStatus?.find(s => s.status === 'COMPLETED')?.count)}
                  sub={`${fmt(summary?.byStatus?.find(s => s.status === 'COMPLETED')?.submittedQty, 2)} units submitted`}
                  accent="#15803d"
                  tooltip="Production orders in COMPLETED status. Submitted units = total fgSubmittedQty across those orders."
                />
                <KpiCard
                  label="Completion Rate"
                  value={pct(summary?.completionRate)}
                  sub={`${fmt(summary?.submittedQty, 2)} of ${fmt(summary?.totalQty, 2)} units`}
                  accent={colorPalette.primary[500]}
                  tooltip="(Total submitted finished goods ÷ Total ordered quantity) × 100. Measures how much of planned production has been completed."
                />
              </div>
            )}

            {/* Pipeline Stages Row */}
            {pipelineLoading || salesFunnelLoading ? (
              <Skeleton active className="mb-4" />
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg overflow-visible flex mb-4 relative">
                {computedStages.map((stage, idx) => {
                  const isActive = activeStageId === stage.id;
                  return (
                    <button
                      key={stage.id}
                      type="button"
                      onClick={() => setActiveStageId(prev => (prev === stage.id ? null : stage.id))}
                      className="flex-1 min-w-0 p-4 text-left border-r border-gray-200 last:border-r-0 transition-colors duration-100 relative"
                      style={{ background: isActive ? stage.bgActive : undefined }}
                      aria-expanded={isActive}
                    >
                      {/* color bar */}
                      <div className="h-[3px] w-full rounded mb-3" style={{ background: stage.color }} />

                      <div className="flex items-center gap-1 mb-0.5">
                        <p className="text-xs font-bold text-gray-800 truncate">{stage.label}</p>
                        {stage.tooltip && (
                          <Tooltip title={stage.tooltip} placement="top">
                            <span className="text-gray-300 hover:text-gray-500 cursor-help text-[11px] leading-none flex-shrink-0">ⓘ</span>
                          </Tooltip>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 mb-3 truncate">{stage.sub}</p>

                      {/* big count */}
                      <p className="text-[26px] font-bold leading-none mb-0.5 tabular-nums" style={{ color: stage.color }}>
                        {fmt(stage.count)}
                      </p>
                      <p className="text-[11px] text-gray-400 mb-2.5">orders</p>

                      {/* metrics */}
                      <div className="space-y-1">
                        {stage.metrics.map(([k, v]) => (
                          <div key={k} className="flex justify-between text-[11.5px]">
                            <span className="text-gray-500">{k}</span>
                            <span className="font-medium tabular-nums text-gray-700">{v}</span>
                          </div>
                        ))}
                      </div>

                      {/* badge */}
                      <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10.5px] font-semibold" style={{ background: stage.bgActive, color: stage.color }}>
                        {stage.badgeText}
                      </span>

                      {/* arrow connector */}
                      {idx < STAGE_CONFIG.length - 1 && (
                        <div
                          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-5 h-5 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 text-xs font-bold z-10"
                          style={{ background: '#f0f2f7' }}
                          aria-hidden="true"
                        >
                          ›
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Detail Drawer */}
            {activeStageData && (
              <div className="bg-white border border-gray-200 rounded-lg mb-5 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: activeStageData.color }} />
                    <span className="text-sm font-semibold text-gray-800">{activeStageData.label} — Sample Orders</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveStageId(null)}
                    className="text-gray-400 hover:text-gray-600 text-lg leading-none px-1.5 py-0.5 rounded hover:bg-gray-200 transition-colors"
                  >
                    ×
                  </button>
                </div>

                {activeStageData.orders.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">
                    {activeStageData.id === 'so' ? 'Sales order details available via the Sales Dashboard.' : 'No order records available for this stage.'}
                  </p>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-100">
                            {['Order #', 'Item', 'Qty', 'Submitted', 'Date', 'Status'].map((h, i) => (
                              <th
                                key={h}
                                className={`py-2.5 px-4 text-gray-400 font-medium uppercase text-[10.5px] tracking-wider bg-gray-50 whitespace-nowrap ${i >= 2 && i <= 4 ? 'text-right' : 'text-left'}`}
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {activeStageData.orders.map(o => {
                            return (
                              <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                <td className="py-2.5 px-4 tabular-nums text-gray-700 whitespace-nowrap">{o.code || '—'}</td>
                                <td className="py-2.5 px-4 text-gray-700 max-w-[160px] truncate">{o.itemName || '—'}</td>
                                <td className="py-2.5 px-4 text-right tabular-nums text-gray-700 whitespace-nowrap">{fmt(o.quantity, 2)}</td>
                                <td className="py-2.5 px-4 text-right tabular-nums text-gray-700 whitespace-nowrap">{fmt(o.submittedQty, 2)}</td>
                                <td className="py-2.5 px-4 text-right tabular-nums text-gray-500 whitespace-nowrap">{o.productionDate ? dayjs(o.productionDate).format('DD MMM YY') : '—'}</td>
                                <td className="py-2.5 px-4 whitespace-nowrap">
                                  <StatusBadge status={o.status} value={SHORT_STATUS_LABEL[o.status] || PRODUCTION_MODULE_STATUS[o.status] || o.status} />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="px-4 py-2.5 border-t border-gray-100 text-xs text-gray-400">
                      Showing {activeStageData.orders.length} of {fmt(activeStageData.count)} orders
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {/* ─── Production Demand Tab ─── */}
        {internalTab === 'forecast' && (
          <>
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-800">Production Item Demand</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Top items by production order volume · {topItems?.length ? <span className="font-medium text-gray-700">{topItems.length} items</span> : 'No items found'}
              </p>
            </div>

            {topItemsLoading ? (
              <Skeleton active />
            ) : topItems?.length > 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-gray-200">
                        {['#', 'Item', 'Orders', 'Total Qty', 'Submitted Qty', 'Completion', ''].map((h, i) => (
                          <th key={i} className={`py-2.5 px-4 text-gray-400 font-medium uppercase text-[10.5px] tracking-wider bg-gray-50 ${i >= 2 ? 'text-right' : 'text-left'}`}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {topItems.map((item, idx) => {
                        const maxQty = topItems[0]?.totalQty || 1;
                        const barPct = Math.round((item.totalQty / maxQty) * 100);
                        const completion = item.completionRate || 0;
                        const isLow = completion < 40;
                        return (
                          <tr key={item.itemId} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${isLow ? 'bg-red-50/40' : ''}`}>
                            <td className="py-2.5 px-4 tabular-nums text-gray-400">{idx + 1}</td>
                            <td className="py-2.5 px-4 font-medium text-gray-800 max-w-[200px] truncate">{item.itemName}</td>
                            <td className="py-2.5 px-4 text-right tabular-nums text-gray-700">{fmt(item.orderCount)}</td>
                            <td className="py-2.5 px-4 text-right">
                              <span className="tabular-nums text-gray-700">{fmt(item.totalQty, 2)}</span>
                              <div className="mt-1 h-[5px] w-20 bg-gray-100 rounded-full overflow-hidden ml-auto">
                                <div className="h-[5px] rounded-full" style={{ width: `${barPct}%`, background: colorPalette.primary[500] }} />
                              </div>
                            </td>
                            <td className="py-2.5 px-4 text-right tabular-nums text-gray-700">{fmt(item.submittedQty ?? 0, 2)}</td>
                            <td className="py-2.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-16 h-[5px] bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-[5px] rounded-full"
                                    style={{
                                      width: `${completion}%`,
                                      background: completion >= 80 ? '#15803d' : completion >= 40 ? '#b45309' : '#b91c1c',
                                    }}
                                  />
                                </div>
                                <span className="tabular-nums w-8 text-right" style={{ color: completion >= 80 ? '#15803d' : completion >= 40 ? '#b45309' : '#b91c1c' }}>
                                  {pct(completion)}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              {isLow && (
                                <span className="inline-block px-2 py-0.5 rounded text-[10.5px] font-bold" style={{ background: '#fff1f1', color: '#b91c1c' }}>
                                  LOW
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-lg py-12 text-center">
                <p className="text-sm text-gray-400">No production demand data for selected period</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
});

export default ProductionDashboard;
