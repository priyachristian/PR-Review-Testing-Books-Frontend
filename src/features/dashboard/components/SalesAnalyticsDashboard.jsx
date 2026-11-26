import { useCallback, useEffect, useImperativeHandle, useMemo, useRef, forwardRef, useState, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';

const Bar = lazy(() => import('@ant-design/charts').then(m => ({ default: m.Bar })));
const Pie = lazy(() => import('@ant-design/charts').then(m => ({ default: m.Pie })));
const Line = lazy(() => import('@ant-design/charts').then(m => ({ default: m.Line })));
import dayjs from 'dayjs';

import { Button, DatePicker, Drawer, Select, Tag, Tooltip } from '@/components/AntDComponent';

import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import CustomDatePicker from '@/components/forms/formDatePicker/CustomDatePicker';
import FilterInput from '@/components/forms/formInput/FilterInput';
import ItemGroupMonthlySalesTable from '@/features/dashboard/components/ItemGroupMonthlySalesTable';
import ItemPerformanceBreakdownDrawer from '@/features/dashboard/components/ItemPerformanceBreakdownDrawer';
import CustomerPerformanceBreakdownDrawer from '@/features/dashboard/components/CustomerPerformanceBreakdownDrawer';
import StatePerformanceBreakdownDrawer from '@/features/dashboard/components/StatePerformanceBreakdownDrawer';

import StatusBadge from '@/components/ui/badge/StatusBadge';
import { useSalesDashboard } from '@/hooks/useSalesDashboard';
import useModulePermissions from '@/hooks/useModulePermissions';
import { FILTERS_KEYS, RESOURCES } from '@/utils/jsonFile';
import Icons from '@/assets/icons/icon';
import { filterInputEnum, INVOICE_STATUS } from '@/utils/constants';
import { formatAmount, toDecimalString, formatAmountShort } from '@/utils/currency';
import { dateFormateForUi } from '@/utils/services';
import { colorPalette } from '@/utils/theme';
import { resetBranch } from '@/features/allMaster/warehouse/warehouse.slice';
import { useDispatch } from 'react-redux';
import { getAllFiltersFromLocalStorage, saveAllFiltersToLocalStorage } from '@/utils/filters';
import { buildDivisionSelectOptions, buildBranchSelectOptions, divisionSelectColumnHeader, branchSelectColumnHeader } from '@/utils/tableSelectDropdown/orgSelectDropdown';

const PRIMARY = colorPalette.primary[500];
const PIE_COLORS = ['#6366f1', '#06b6d4', '#f97316', '#a855f7', '#3b82f6', '#22c55e', '#eab308', '#ec4899'];

const SALES_FILTER_STORAGE_KEY = FILTERS_KEYS.SALES_ANALYTICS_DASHBOARD_FILTERS;

/** State/city APIs return rows sorted by totalSales desc; show this many until user expands. */
const PERFORMANCE_DRILLDOWN_TABLE_INITIAL_ROWS = 5;

/** Performance table tabs (state is API-bound + drill-down; customer is API-bound; item is static until its API ships). */
const PERF_TAB = { STATE: 'state', CUSTOMER: 'customer', ITEM: 'item' };
const PERF_TABS = [
  { key: PERF_TAB.STATE, label: 'State-wise Performance' },
  { key: PERF_TAB.CUSTOMER, label: 'Customer-wise Performance' },
  { key: PERF_TAB.ITEM, label: 'Item-wise Performance' },
];

/** Colors for the Order/Invoice/Payment trend + Order status charts. */
const ORDER_TREND_COLORS = ['#3b82f6', '#a855f7', '#16a34a']; // Orders / Invoices / Payments
const ORDER_TREND_SERIES = ['Orders', 'Invoices', 'Payments'];
// Map API fields (salesAmount / invoiceAmount / paymentAmount) to the trend series shown in the chart.
const ORDER_TREND_FIELD_BY_SERIES = { Orders: 'salesAmount', Invoices: 'invoiceAmount', Payments: 'paymentAmount' };

// Indian fiscal year runs Apr–Mar; a Jan/Feb/Mar anchor date belongs to the FY that started the previous April.
const fyStartYear = d => (d.month() < 3 ? d.year() - 1 : d.year());
const fyRangeFor = anchor => {
  const startYear = fyStartYear(anchor);
  return {
    startDate: dayjs(`${startYear}-04-01`).format('YYYY-MM-DD'),
    endDate: dayjs(`${startYear + 1}-03-31`).format('YYYY-MM-DD'),
  };
};
const ORDER_STATUS_COLOR_MAP = { Completed: '#3b82f6', Pending: '#84cc16', Cancelled: '#ef4444' };
const ORDER_STATUS_FALLBACK_COLOR = '#94a3b8';

/** Matches FilterInput SELECT styling; used here only so User can omit mode (single-select default). */
const SALES_ANALYTICS_FILTER_SELECT_CLASS = `w-full 
    [&_.ant-select-selector]:!h-[35px]
    [&_.ant-select-selector]:!flex
    [&_.ant-select-selector]:!items-center
    [&_.ant-select-selector]:!py-0
    [&_.ant-select-selection-placeholder]:!flex
    [&_.ant-select-selection-placeholder]:!items-center
    [&_.ant-select-selection-placeholder]:!text-[13px]`;

// ─── View Enum ────────────────────────────────────────────────────────────────
const VIEW = { STATE: 'state', CITY: 'city', CUSTOMER: 'customer', INVOICE: 'invoice' };

// ─── Coming Soon Badge ────────────────────────────────────────────────────────
const ComingSoonBadge = () => (
  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-400 border border-dashed border-gray-300">
    <Icons.ClockCircleOutlined className="text-[9px]" />
    Coming Soon
  </span>
);

// ─── Default dashboard-wide date range ───────────────────────────────────────
const fyStart = d => (d.month() < 3 ? d.year() - 1 : d.year());

/** Default dashboard-wide date filter — current fiscal year (Apr 1 -> Mar 31). Every analytics widget uses this except the Order/Invoice/Payment trend chart, which has its own independent FY filter. */
const defaultFYDateRange = () => {
  const sy = fyStart(dayjs());
  return [dayjs(`${sy}-04-01`).startOf('day'), dayjs(`${sy + 1}-03-31`).endOf('day')];
};

// ─── Sales by State chart ────────────────────────────────────────────────────
const STATE_BAR_PALETTE = ['#22c55e', '#3b82f6', '#f97316', '#a855f7', '#ef4444', '#06b6d4', '#eab308', '#ec4899'];

/** Wrap a state name at word boundaries so no line exceeds 20 characters. */
const wrapStateLabel = val => {
  if (!val || val.length <= 20) return val;
  const words = val.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length <= 20) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines.join('\n');
};

const SalesByStateChart = ({ stateGraph, loading }) => {
  const [showAll, setShowAll] = useState(false);

  const top = useMemo(() => {
    const sorted = [...(stateGraph || [])].sort((a, b) => (b.actualSales || 0) - (a.actualSales || 0));
    return showAll ? sorted : sorted.slice(0, 5);
  }, [stateGraph, showAll]);

  const chartHeight = useMemo(() => Math.max(260, top.length * 44), [top.length]);

  const sharedStyleFn = useCallback(
    ({ region }) => {
      const idx = top.findIndex(s => s.state === region);
      return { fill: STATE_BAR_PALETTE[idx % STATE_BAR_PALETTE.length], radiusTopLeft: 2, radiusTopRight: 2 };
    },
    [top]
  );

  // Always use the full graph data so % reflects share of ALL states, not just the visible slice
  const totalSales = useMemo(() => (stateGraph || []).reduce((sum, s) => sum + Number(s.actualSales || 0), 0), [stateGraph]);

  // Build bar data with % contribution per state included
  const barData = useMemo(
    () =>
      top.map(s => ({
        region: s.state,
        value: Number(s.actualSales || 0),
        percent: totalSales > 0 ? toDecimalString((Number(s.actualSales || 0) / totalSales) * 100) : '0.0',
      })),
    [top, totalSales]
  );

  const barConfig = useMemo(
    () => ({
      data: barData,
      xField: 'region',
      yField: 'value',
      height: chartHeight,
      legend: false,
      style: sharedStyleFn,
      axis: {
        x: { title: false, labelFormatter: wrapStateLabel },
        y: { position: 'top', labelFormatter: v => `${toDecimalString(v / 10000000)} Cr`, title: false },
      },
      label: {
        text: d => `${d.percent}%`,
        position: 'right',
        dx: 6,
        style: { fontSize: 11, fill: '#6b7280', fontWeight: 500, textAlign: 'start' },
      },
      tooltip: {
        title: d => `${d.region}  •  ${d.percent}% of total sales`,
        items: [{ channel: 'y', valueFormatter: v => formatAmount(v) }],
      },
    }),
    [barData, chartHeight, sharedStyleFn]
  );

  return (
    <div>
      <div className="flex items-start justify-between mb-2">
        <div>
          <h3 className="text-sm font-bold text-[#030711]">Sales by State</h3>
          <p className="text-[11px] text-gray-500">Actual Sales (₹ Crore)</p>
        </div>
        <div className="flex items-center bg-gray-100 rounded-md p-0.5 gap-0.5">
          <button
            onClick={() => setShowAll(false)}
            className={`px-2.5 py-1 text-[11px] font-medium rounded transition-all duration-150 ${!showAll ? 'bg-white text-[#030711] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Top 5
          </button>
          <button
            onClick={() => setShowAll(true)}
            className={`px-2.5 py-1 text-[11px] font-medium rounded transition-all duration-150 ${showAll ? 'bg-white text-[#030711] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            All States
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-[230px] flex items-end gap-2 px-3 pb-3">
          {[40, 70, 55, 85, 45, 65, 50, 75].map((h, i) => (
            <div key={i} className="ds-shimmer flex-1 rounded-t min-w-0" style={{ height: `${h}%` }} />
          ))}
        </div>
      ) : barData.length === 0 ? (
        <div className="h-[230px] flex flex-col items-center justify-center text-gray-400" style={{ height: chartHeight }}>
          <Icons.BarChartOutlined className="text-3xl mb-2" />
          <span className="text-xs">No data for the selected filters</span>
        </div>
      ) : (
        <Suspense
          fallback={
            <div className="flex items-center justify-center" style={{ height: 230 }}>
              <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
            </div>
          }
        >
          <Bar {...barConfig} />
        </Suspense>
      )}
    </div>
  );
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────
const KpiCard = ({ icon, title, displayValue, valueTooltip, trend, comingSoon, loading, tooltip }) => (
  <div className="bg-white border-r border-b border-gray-200 p-3 sm:p-4 h-full">
    <div className="flex items-center justify-between gap-2 mb-2">
      <div className="p-2 sm:p-2.5 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(23, 133, 182, 0.08)', color: PRIMARY }}>
        {icon}
      </div>
      <div className="flex items-center gap-1.5">
        {tooltip && (
          <Tooltip title={<span className="text-xs leading-relaxed whitespace-pre-line">{tooltip}</span>} placement="bottom" overlayStyle={{ maxWidth: 280 }}>
            <Icons.InfoCircleOutlined className="text-gray-300 hover:text-gray-500 text-sm cursor-pointer transition-colors" />
          </Tooltip>
        )}
        {trend !== undefined && trend !== null && !comingSoon && (
          <div className={`text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full ${trend >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
    <div className="space-y-1">
      <p className="text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide line-clamp-1">{title}</p>
      {comingSoon ? (
        <ComingSoonBadge />
      ) : loading ? (
        <div className="ds-shimmer h-7 w-24" />
      ) : valueTooltip ? (
        <Tooltip title={valueTooltip} placement="top">
          <p className="text-sm sm:text-base font-bold text-gray-900 leading-tight cursor-default">{displayValue}</p>
        </Tooltip>
      ) : (
        <p className="text-sm sm:text-base font-bold text-gray-900 leading-tight">{displayValue}</p>
      )}
    </div>
  </div>
);

// ─── Breadcrumb ───────────────────────────────────────────────────────────────
const Breadcrumb = ({ items, onNavigate }) => (
  <div className="sticky-page-header bg-white border-b border-gray-200 px-4 py-2 sm:px-6">
    <div className="flex items-center gap-1.5 text-sm flex-wrap">
      {items.map((item, idx) => (
        <span key={idx} className="flex items-center gap-1.5">
          {idx > 0 && <Icons.RightOutlined className="text-gray-400 text-[10px]" />}
          {idx < items.length - 1 ? (
            <button className="font-medium hover:underline transition-colors" style={{ color: PRIMARY }} onClick={() => onNavigate(idx)}>
              {item}
            </button>
          ) : (
            <span className="font-semibold text-gray-800">{item}</span>
          )}
        </span>
      ))}
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const SalesAnalyticsDashboard = forwardRef(function SalesAnalyticsDashboard({ filtersPanelOpen = false, filtersPortalEl = null, activeFiltersPortalEl = null, filtersLocked = false }, ref) {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // ── Module permissions (division/branch dropdowns) ──
  const { divDrop, divisionLoading, getDivDropDown, branchDrop, branchLoading, getBranchDropDown, isSplitSessionActive } = useModulePermissions(RESOURCES.HOME);

  // ── Sales Dashboard hook ──
  const {
    summary,
    stateWise,
    stateGraph,
    orderTrend,
    orderStatus,
    customerWise,
    itemWise,
    cityWise,
    customers,
    inactiveCustomers,
    userDropdown,
    customerInvoices,
    nonOrderCustomers,
    nonOrderCustomerList,
    summaryLoading,
    stateWiseLoading,
    stateGraphLoading,
    orderTrendLoading,
    orderStatusLoading,
    customerWiseLoading,
    itemWiseLoading,
    cityWiseLoading,
    customersLoading,
    inactiveCustomersLoading,
    userDropdownLoading,
    customerInvoicesLoading,
    nonOrderCustomerListLoading,
    getSummary,
    getStateWise,
    getStateGraph,
    getOrderTrend,
    getOrderStatus,
    getCustomerWise,
    getItemWise,
    getCityWise,
    getCustomers,
    getInactiveCustomers,
    getNonOrderCustomers,
    getNonOrderCustomerList,
    getUserDropdown,
    getCustomerInvoices,
    itemGroupAnalytics,
    itemGroupAnalyticsLoading,
    getItemGroupAnalytics,
    resetAll,
  } = useSalesDashboard();

  // ── URL search params ──
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Helper: read initial value from URL or fallback ──
  const spView = searchParams.get('view') || VIEW.STATE;
  const spState = searchParams.get('state') || null;
  const spCity = searchParams.get('city') || null;
  const spCustId = searchParams.get('customerId') || null;
  const spCustName = searchParams.get('customerName') || null;
  const spStart = searchParams.get('startDate') || null;
  const spEnd = searchParams.get('endDate') || null;
  const spPreset = searchParams.get('preset') || 'custom';
  const spDivision = searchParams.get('division') || '';
  const spBranch = searchParams.get('branch') || '';
  const spUserId = searchParams.get('userId') || '';

  // ── Drill-down state — seeded from URL ──
  const [view, setView] = useState(Object.values(VIEW).includes(spView) ? spView : VIEW.STATE);
  const [selectedState, setSelectedState] = useState(spState);
  const [selectedCity, setSelectedCity] = useState(spCity);
  const [selectedCustomer, setSelectedCustomer] = useState(spCustId ? { id: spCustId, name: spCustName || '' } : null);

  // ── Non-order drawer ──
  const [nonOrderDrawerOpen, setNonOrderDrawerOpen] = useState(false);
  const [nonOrderDrawerState, setNonOrderDrawerState] = useState('');
  const [nonOrderDrawerCity, setNonOrderDrawerCity] = useState('');
  // ── Item-wise performance breakdown drawer (opened from item-wise table row) ──
  const [itemBreakdownDrawerOpen, setItemBreakdownDrawerOpen] = useState(false);
  const [itemBreakdownDrawerItem, setItemBreakdownDrawerItem] = useState(null);
  // ── Customer-wise performance breakdown drawer (opened from customer-wise table row) ──
  const [customerBreakdownDrawerOpen, setCustomerBreakdownDrawerOpen] = useState(false);
  const [customerBreakdownDrawerCustomer, setCustomerBreakdownDrawerCustomer] = useState(null);
  // ── State-wise performance breakdown drawer (opened from the State name) ──
  const [stateBreakdownDrawerOpen, setStateBreakdownDrawerOpen] = useState(false);
  const [stateBreakdownDrawerState, setStateBreakdownDrawerState] = useState(null);
  // ── Performance table tabs (State / Customer / Item) + their View-All pagination ──
  const [perfTab, setPerfTab] = useState(PERF_TAB.STATE);
  const [stateViewAll, setStateViewAll] = useState(false);
  const [stateSortBy, setStateSortBy] = useState(undefined);
  const [customerViewAll, setCustomerViewAll] = useState(false);
  const [customerPage, setCustomerPage] = useState(1);
  const [customerLimit, setCustomerLimit] = useState(10);
  const [customerSortBy, setCustomerSortBy] = useState('actualSales:desc');
  const [itemViewAll, setItemViewAll] = useState(false);
  const [itemPage, setItemPage] = useState(1);
  const [itemLimit, setItemLimit] = useState(10);
  const [itemSortBy, setItemSortBy] = useState('actualSales:desc');

  // ── Order/Invoice/Payment trend chart — own fiscal-year filter, independent of the dashboard-wide date filter ──
  const [orderTrendFY, setOrderTrendFY] = useState(dayjs());
  const orderTrendFYRange = useMemo(() => fyRangeFor(orderTrendFY), [orderTrendFY]);

  // ── Item Group Sales table — own fiscal-year filter, independent of the dashboard-wide date filter ──
  const [itemGroupFY, setItemGroupFY] = useState(dayjs());
  const itemGroupFYRange = useMemo(() => fyRangeFor(itemGroupFY), [itemGroupFY]);

  const [pieShowAll, setPieShowAll] = useState(false);
  const [cityPerformanceTableExpanded, setCityPerformanceTableExpanded] = useState(false);
  const [inactiveCustomersTableExpanded, setInactiveCustomersTableExpanded] = useState(false);
  const [customerPerformanceTableExpanded, setCustomerPerformanceTableExpanded] = useState(false);

  // ── Filter state — seeded from URL ──
  const [selectedPreset, setSelectedPreset] = useState(spPreset);
  const initialDateRange = spStart && spEnd ? [dayjs(spStart), dayjs(spEnd)] : defaultFYDateRange();
  const [dateRange, setDateRange] = useState(initialDateRange);
  const [appliedDateRange, setAppliedDateRange] = useState(initialDateRange);
  const [filter, setFilter] = useState({
    division: spDivision,
    branch: spBranch,
    userId: spUserId,
  });
  const [appliedFilters, setAppliedFilters] = useState({
    division: spDivision,
    branch: spBranch,
    userId: spUserId,
  });

  const isApiCalledRef = useRef({ divisionDropdown: false, userDropdown: false });
  const salesLockedFiltersHydratedRef = useRef(false);
  const [isHydrated, setIsHydrated] = useState(!filtersLocked);

  // ── Sync state → URL ──
  const syncUrl = useCallback(
    (patch = {}) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev);
          const set = (k, v) => (v ? next.set(k, v) : next.delete(k));
          const clear = (...keys) => keys.forEach(k => next.delete(k));

          // Keep home URL in sync with outer dashboard switcher (General vs Sales)
          next.set('dashboard', 'sales');
          next.delete('record');
          next.delete('tab');

          if ('view' in patch) set('view', patch.view);
          if ('state' in patch) set('state', patch.state);
          if ('city' in patch) set('city', patch.city);
          if ('customerId' in patch) set('customerId', patch.customerId);
          if ('customerName' in patch) set('customerName', patch.customerName);
          if ('startDate' in patch) set('startDate', patch.startDate);
          if ('endDate' in patch) set('endDate', patch.endDate);
          if ('preset' in patch) set('preset', patch.preset);
          if ('division' in patch) set('division', patch.division);
          if ('branch' in patch) set('branch', patch.branch);
          if ('userId' in patch) set('userId', patch.userId);

          // Clear deeper drill-down params when going back up
          if (patch.view === VIEW.STATE) {
            clear('state', 'city', 'customerId', 'customerName');
          }
          if (patch.view === VIEW.CITY) {
            clear('city', 'customerId', 'customerName');
          }
          if (patch.view === VIEW.CUSTOMER) {
            clear('customerId', 'customerName');
          }

          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  // ── Seed the URL with the default fiscal-year range on first mount (no startDate/endDate in URL yet) — the header's
  // active-filters badge/bar reads filter state off the URL, so without this the FY filter is applied but shows as hidden ──
  useEffect(() => {
    if (spStart && spEnd) return;
    syncUrl({
      startDate: dayjs(initialDateRange[0]).format('YYYY-MM-DD'),
      endDate: dayjs(initialDateRange[1]).format('YYYY-MM-DD'),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Create primitives from applied filters for effect dependency arrays ──
  const appliedStartDateStr = appliedDateRange?.[0] ? dayjs(appliedDateRange[0]).format('YYYY-MM-DD') : '';
  const appliedEndDateStr = appliedDateRange?.[1] ? dayjs(appliedDateRange[1]).format('YYYY-MM-DD') : '';
  const appliedDivisionStr = Array.isArray(appliedFilters?.division) ? appliedFilters.division.join(',') : appliedFilters?.division || '';
  const appliedBranchStr = Array.isArray(appliedFilters?.branch) ? appliedFilters.branch.join(',') : appliedFilters?.branch || '';
  const appliedUserIdStr = appliedFilters?.userId || '';

  // ── Build payload for API calls ──
  const buildPayload = useCallback(
    (extra = {}) => {
      return {
        startDate: appliedStartDateStr || undefined,
        endDate: appliedEndDateStr || undefined,
        division: appliedDivisionStr || undefined,
        branch: appliedBranchStr || undefined,
        userId: appliedUserIdStr || undefined,
        isSplit: isSplitSessionActive || undefined,
        ...extra,
      };
    },
    [appliedStartDateStr, appliedEndDateStr, appliedDivisionStr, appliedBranchStr, appliedUserIdStr, isSplitSessionActive]
  );

  // ── Load summary + always-visible chart data on filter change ──
  useEffect(() => {
    if (!isHydrated) return;
    getSummary(buildPayload());
    getStateGraph(buildPayload());
    getOrderStatus(buildPayload());
    getNonOrderCustomers(buildPayload());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, appliedStartDateStr, appliedEndDateStr, appliedDivisionStr, appliedBranchStr, appliedUserIdStr, isSplitSessionActive]);

  // ── Order/Invoice/Payment trend has its own fiscal-year filter — reload on FY change, independent of the dashboard date range ──
  useEffect(() => {
    if (!isHydrated) return;
    getOrderTrend(buildPayload({ startDate: orderTrendFYRange.startDate, endDate: orderTrendFYRange.endDate }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, orderTrendFYRange.startDate, orderTrendFYRange.endDate, appliedDivisionStr, appliedBranchStr, appliedUserIdStr, isSplitSessionActive]);

  // ── Item Group Sales table has its own fiscal-year filter — reload on FY change, independent of the dashboard date range ──
  useEffect(() => {
    if (!isHydrated) return;
    getItemGroupAnalytics(buildPayload({ startDate: itemGroupFYRange.startDate, endDate: itemGroupFYRange.endDate }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, itemGroupFYRange.startDate, itemGroupFYRange.endDate, appliedDivisionStr, appliedBranchStr, appliedUserIdStr, isSplitSessionActive]);

  // ── State-wise table has no server-side pagination; fetch all states at once when its tab is active ──
  useEffect(() => {
    if (!isHydrated) return;
    if (perfTab !== PERF_TAB.STATE) return;
    getStateWise(buildPayload());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, perfTab, appliedStartDateStr, appliedEndDateStr, appliedDivisionStr, appliedBranchStr, appliedUserIdStr, isSplitSessionActive]);

  // ── Customer-wise (customer-wise) is paginated + server-sorted; fetch only while its tab is active ──
  useEffect(() => {
    if (!isHydrated) return;
    if (perfTab !== PERF_TAB.CUSTOMER) return;
    getCustomerWise(
      buildPayload({
        page: customerViewAll ? customerPage : 1,
        limit: customerViewAll ? customerLimit : PERFORMANCE_DRILLDOWN_TABLE_INITIAL_ROWS,
        sortBy: customerSortBy,
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isHydrated,
    perfTab,
    customerViewAll,
    customerPage,
    customerLimit,
    customerSortBy,
    appliedStartDateStr,
    appliedEndDateStr,
    appliedDivisionStr,
    appliedBranchStr,
    appliedUserIdStr,
    isSplitSessionActive,
  ]);

  // ── Item-wise is paginated + server-sorted; fetch only while its tab is active ──
  useEffect(() => {
    if (!isHydrated) return;
    if (perfTab !== PERF_TAB.ITEM) return;
    getItemWise(
      buildPayload({
        page: itemViewAll ? itemPage : 1,
        limit: itemViewAll ? itemLimit : PERFORMANCE_DRILLDOWN_TABLE_INITIAL_ROWS,
        sortBy: itemSortBy,
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, perfTab, itemViewAll, itemPage, itemLimit, itemSortBy, appliedStartDateStr, appliedEndDateStr, appliedDivisionStr, appliedBranchStr, appliedUserIdStr, isSplitSessionActive]);

  useEffect(() => {
    setCityPerformanceTableExpanded(false);
    setInactiveCustomersTableExpanded(false);
    setCustomerPerformanceTableExpanded(false);
    // Collapse the State/Customer/Item View-All tables back to their summary rows when filters change
    setStateViewAll(false);
    setCustomerViewAll(false);
    setCustomerPage(1);
    setItemViewAll(false);
    setItemPage(1);
    // Close the breakdown drawers too — their data was fetched for the previous filters
    setItemBreakdownDrawerOpen(false);
    setCustomerBreakdownDrawerOpen(false);
    setStateBreakdownDrawerOpen(false);
  }, [appliedStartDateStr, appliedEndDateStr, appliedDivisionStr, appliedBranchStr, appliedUserIdStr]);

  useEffect(() => {
    setCityPerformanceTableExpanded(false);
    setInactiveCustomersTableExpanded(false);
    setCustomerPerformanceTableExpanded(false);
  }, [selectedState]);

  useEffect(() => {
    setInactiveCustomersTableExpanded(false);
    setCustomerPerformanceTableExpanded(false);
  }, [selectedCity]);

  // ── Load user dropdown once ──
  useEffect(() => {
    if (!isApiCalledRef.current.userDropdown) {
      getUserDropdown();
      isApiCalledRef.current.userDropdown = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Reload drill-down data on view/selection/filter change ──
  useEffect(() => {
    if (!isHydrated) return;
    if (view === VIEW.CITY && selectedState) {
      getCityWise(buildPayload({ state: selectedState }));
    }
    if (view === VIEW.CUSTOMER && selectedState && selectedCity) {
      getCustomers(buildPayload({ state: selectedState, city: selectedCity }));
      getInactiveCustomers(buildPayload({ state: selectedState, city: selectedCity }));
    }
    if (view === VIEW.INVOICE && selectedCustomer?.id) {
      getCustomerInvoices(buildPayload({ customerId: selectedCustomer.id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, view, selectedState, selectedCity, selectedCustomer?.id, appliedStartDateStr, appliedEndDateStr, appliedDivisionStr, appliedBranchStr, appliedUserIdStr, isSplitSessionActive]);

  // ── Branch dropdown when division changes ──
  useEffect(() => {
    const controller = new AbortController();
    if (!filter.division || filter.division.length <= 0) {
      dispatch(resetBranch());
    }
    if (filter.division && filter.division.length > 0) {
      getBranchDropDown({ divisionId: filter.division, signal: controller.signal });
    }
    return () => controller.abort();
  }, [filter.division, dispatch, getBranchDropDown]);

  const persistSalesFiltersToStorage = useCallback(() => {
    const rangeToUse = dateRange;
    const filtersToSave = {
      division: filter.division && filter.division.length > 0 ? (Array.isArray(filter.division) ? filter.division.join(',') : filter.division) : '',
      branch: filter.branch && filter.branch.length > 0 ? (Array.isArray(filter.branch) ? filter.branch.join(',') : filter.branch) : '',
      userId: filter.userId || '',
      preset: selectedPreset !== 'custom' ? selectedPreset : '',
      startDate: rangeToUse?.[0] ? dayjs(rangeToUse[0]).format('YYYY-MM-DD') : null,
      endDate: rangeToUse?.[1] ? dayjs(rangeToUse[1]).format('YYYY-MM-DD') : null,
    };
    const cleaned = Object.fromEntries(Object.entries(filtersToSave).filter(([, v]) => v !== '' && v !== null && v !== undefined));
    saveAllFiltersToLocalStorage(cleaned, SALES_FILTER_STORAGE_KEY);
  }, [filter.division, filter.branch, filter.userId, dateRange, selectedPreset]);

  // Restore saved filters when Sales dashboard lock is on (same idea as General dashboard)
  useEffect(() => {
    if (!filtersLocked) {
      if (!isHydrated) setIsHydrated(true);
      return;
    }
    if (salesLockedFiltersHydratedRef.current) return;
    const saved = getAllFiltersFromLocalStorage(SALES_FILTER_STORAGE_KEY);
    if (!saved || Object.keys(saved).length === 0) {
      salesLockedFiltersHydratedRef.current = true;
      setIsHydrated(true);
      return;
    }
    salesLockedFiltersHydratedRef.current = true;

    if (saved.preset) setSelectedPreset(saved.preset);
    if (saved.startDate && saved.endDate) {
      const dr = [dayjs(saved.startDate), dayjs(saved.endDate)];
      setDateRange(dr);
      setAppliedDateRange(dr);
    }
    const newDivision = saved.division ? saved.division.split(',').filter(Boolean) : '';
    const newBranch = saved.branch ? saved.branch.split(',').filter(Boolean) : '';
    const newUserId = saved.userId || '';
    setFilter(prev => ({ ...prev, division: newDivision, branch: newBranch, userId: newUserId }));
    setAppliedFilters({ division: newDivision, branch: newBranch, userId: newUserId });
    syncUrl({
      startDate: saved.startDate || null,
      endDate: saved.endDate || null,
      preset: saved.preset && saved.preset !== 'custom' ? saved.preset : null,
      division: newDivision || null,
      branch: newBranch || null,
      userId: newUserId || null,
    });
    if (newDivision && newDivision.length > 0 && !isApiCalledRef.current.divisionDropdown) {
      getDivDropDown({});
      isApiCalledRef.current.divisionDropdown = true;
    }
    setIsHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersLocked]);

  // ── Cleanup on unmount ──
  useEffect(() => {
    return () => {
      resetAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Filter handlers ──
  const handleApplyFilters = () => {
    const rangeToUse = dateRange;
    setAppliedFilters({ division: filter.division, branch: filter.branch, userId: filter.userId });
    setAppliedDateRange(rangeToUse);
    syncUrl({
      startDate: rangeToUse?.[0] ? dayjs(rangeToUse[0]).format('YYYY-MM-DD') : null,
      endDate: rangeToUse?.[1] ? dayjs(rangeToUse[1]).format('YYYY-MM-DD') : null,
      preset: selectedPreset !== 'custom' ? selectedPreset : null,
      division: filter.division || null,
      branch: filter.branch || null,
      userId: filter.userId || null,
    });
    if (filtersLocked) {
      persistSalesFiltersToStorage();
    }
  };

  const handleResetFilters = () => {
    setFilter({ division: '', branch: '', userId: '' });
    setAppliedFilters({ division: '', branch: '', userId: '' });
    setDateRange(null);
    setAppliedDateRange(null);
    setSelectedPreset('custom');
    syncUrl({
      startDate: null,
      endDate: null,
      preset: null,
      division: null,
      branch: null,
      userId: null,
    });
  };

  const filterActionsRef = useRef({ apply: handleApplyFilters, reset: handleResetFilters });
  filterActionsRef.current.apply = handleApplyFilters;
  filterActionsRef.current.reset = handleResetFilters;

  const persistForLockRef = useRef(persistSalesFiltersToStorage);
  persistForLockRef.current = persistSalesFiltersToStorage;

  useImperativeHandle(
    ref,
    () => ({
      applyFilters: () => filterActionsRef.current.apply(),
      resetFilters: () => filterActionsRef.current.reset(),
      saveFiltersForLock: () => persistForLockRef.current(),
    }),
    []
  );

  const activeFilterCount = (appliedFilters.division?.length > 0 ? 1 : 0) + (appliedFilters.branch?.length > 0 ? 1 : 0) + (appliedFilters.userId ? 1 : 0) + (appliedDateRange ? 1 : 0);

  // ── Navigation ──
  const drillToCity = useCallback(
    state => {
      setSelectedState(state);
      setView(VIEW.CITY);
      syncUrl({ view: VIEW.CITY, state });
    },
    [syncUrl]
  );

  const handleStateRowClick = useCallback(
    record => {
      if (!record?.state) return;
      drillToCity(record.state);
    },
    [drillToCity]
  );

  const drillToCustomer = useCallback(
    city => {
      setSelectedCity(city);
      setView(VIEW.CUSTOMER);
      syncUrl({ view: VIEW.CUSTOMER, city });
    },
    [syncUrl]
  );

  const drillToInvoices = useCallback(
    customer => {
      setSelectedCustomer(customer);
      setView(VIEW.INVOICE);
      syncUrl({ view: VIEW.INVOICE, customerId: customer.id, customerName: customer.name });
    },
    [syncUrl]
  );

  const handleViewNonOrderCustomers = useCallback(
    (state, city = '') => {
      setNonOrderDrawerState(state);
      setNonOrderDrawerCity(city);
      setNonOrderDrawerOpen(true);
      getNonOrderCustomerList(buildPayload({ state, city: city || undefined }));
    },
    [buildPayload, getNonOrderCustomerList]
  );

  const handleBreadcrumb = useCallback(
    idx => {
      if (idx === 0) {
        setView(VIEW.STATE);
        setSelectedState(null);
        setSelectedCity(null);
        setSelectedCustomer(null);
        syncUrl({ view: VIEW.STATE });
      } else if (idx === 1) {
        setView(VIEW.CITY);
        setSelectedCity(null);
        setSelectedCustomer(null);
        syncUrl({ view: VIEW.CITY });
      } else if (idx === 2) {
        setView(VIEW.CUSTOMER);
        setSelectedCustomer(null);
        syncUrl({ view: VIEW.CUSTOMER });
      }
    },
    [syncUrl]
  );

  // ── Pie chart: sales mix by state ──
  const sortedPieSource = useMemo(() => [...(stateGraph || [])].sort((a, b) => (b.actualSales || 0) - (a.actualSales || 0)), [stateGraph]);
  const pieData = useMemo(() => {
    const source = pieShowAll ? sortedPieSource : sortedPieSource.slice(0, 5);
    const total = source.reduce((sum, d) => sum + Number(d.actualSales || 0), 0);
    return source.map(d => ({
      state: d.state,
      value: Number(d.actualSales || 0),
      percent: total > 0 ? toDecimalString((Number(d.actualSales || 0) / total) * 100) : '0.0',
    }));
  }, [sortedPieSource, pieShowAll]);

  const pieConfig = useMemo(
    () => ({
      data: pieData,
      angleField: 'value',
      colorField: 'state',
      innerRadius: 0.62,
      height: 190,
      legend: false,
      label: false,
      scale: { color: { range: PIE_COLORS } },
      tooltip: {
        title: d => d.state,
        items: [
          { field: 'value', name: 'Sales', valueFormatter: v => formatAmount(v) },
          { field: 'percent', name: 'Share', valueFormatter: v => `${v}%` },
        ],
      },
      annotations: [
        {
          type: 'text',
          style: {
            text: 'Total Sales',
            x: '50%',
            y: '45%',
            textAlign: 'center',
            textBaseline: 'middle',
            fontSize: 9,
            fill: '#6b7280',
          },
        },
        {
          type: 'text',
          style: {
            text: formatAmountShort(summary?.totalSales || 0),
            x: '50%',
            y: '58%',
            textAlign: 'center',
            textBaseline: 'middle',
            fontSize: 12,
            fontWeight: 600,
            fill: '#030711',
          },
        },
      ],
    }),
    [pieData, summary?.totalSales]
  );

  // Order - Invoice - Payment monthly trend — flatten API rows into long format (one row per month per series)
  const orderTrendData = useMemo(
    () => (orderTrend || []).flatMap(m => ORDER_TREND_SERIES.map(category => ({ month: m.month, category, value: Number(m[ORDER_TREND_FIELD_BY_SERIES[category]] || 0) }))),
    [orderTrend]
  );

  const orderTrendConfig = useMemo(
    () => ({
      data: orderTrendData,
      xField: 'month',
      yField: 'value',
      colorField: 'category',
      height: 260,
      legend: false,
      scale: { color: { domain: ORDER_TREND_SERIES, range: ORDER_TREND_COLORS } },
      style: { lineWidth: 2 },
      point: { shapeField: 'circle', sizeField: 3, style: { stroke: '#fff', lineWidth: 1 } },
      axis: {
        x: { title: false },
        y: { title: false, labelFormatter: v => `${Math.round(v / 100000)}L` },
      },
      tooltip: { title: d => d.month, items: [{ channel: 'y', valueFormatter: v => formatAmount(v) }] },
    }),
    [orderTrendData]
  );

  // Order status donut — API rows: { status, count, percentage }
  const orderStatusData = useMemo(() => (orderStatus || []).map(d => ({ status: d.status, value: Number(d.count || 0), percent: d.percentage })), [orderStatus]);

  const orderStatusConfig = useMemo(
    () => ({
      data: orderStatusData,
      angleField: 'value',
      colorField: 'status',
      innerRadius: 0.6,
      height: 200,
      legend: false,
      label: false,
      scale: { color: { domain: orderStatusData.map(d => d.status), range: orderStatusData.map(d => ORDER_STATUS_COLOR_MAP[d.status] || ORDER_STATUS_FALLBACK_COLOR) } },
      tooltip: { title: d => d.status, items: [{ field: 'percent', name: 'Share', valueFormatter: v => `${v}%` }] },
    }),
    [orderStatusData]
  );

  // ─── Table Columns ────────────────────────────────────────────────────────

  const stateColumns = useMemo(() => {
    const [sortField, sortDir] = (stateSortBy || '').split(':');
    const orderFor = field => (sortField === field ? (sortDir === 'asc' ? 'ascend' : 'descend') : null);
    // Only the active column gets a `sortOrder` — giving every sortable column a (possibly null) sortOrder makes
    // AntD think multiple columns are simultaneously controlled and it starts passing `sorter` as an array to
    // onChange, which breaks the `sorter.field`/`sorter.order` destructuring below after the first click.
    const sortProps = field => (orderFor(field) ? { sorter: true, sortDirections: ['ascend', 'descend'], sortOrder: orderFor(field) } : { sorter: true, sortDirections: ['ascend', 'descend'] });
    return [
      {
        title: 'State',
        dataIndex: 'state',
        key: 'state',
        fixed: 'left',
        render: (val, row) => (
          <button
            type="button"
            className="font-semibold hover:underline transition-colors"
            style={{ color: PRIMARY }}
            onClick={e => {
              e.stopPropagation();
              setStateBreakdownDrawerState({ stateId: row?.stateId, stateName: val });
              setStateBreakdownDrawerOpen(true);
            }}
          >
            {val}
          </button>
        ),
      },
      { title: 'Orders', dataIndex: 'salesOrderCount', key: 'salesOrderCount', width: 100, ...sortProps('salesOrderCount') },
      {
        title: 'Order Amount',
        dataIndex: 'salesOrderAmount',
        key: 'salesOrderAmount',
        render: v => (v ? formatAmount(v) : null),
        ...sortProps('salesOrderAmount'),
      },
      {
        title: 'Actual Sales',
        dataIndex: 'totalSales',
        key: 'totalSales',
        render: v => (v ? formatAmount(v) : null),
        ...sortProps('totalSales'),
      },
      { title: 'Customers', dataIndex: 'customerCount', key: 'customerCount', width: 100, ...sortProps('customerCount') },
      { title: 'Invoices', dataIndex: 'invoiceCount', key: 'invoiceCount', width: 100, ...sortProps('invoiceCount') },
      {
        title: 'Collection',
        dataIndex: 'collection',
        key: 'collection',
        render: v => formatAmount(v),
        ...sortProps('collection'),
      },
      {
        title: 'Due Amount',
        dataIndex: 'dueAmount',
        key: 'dueAmount',
        render: v => (v > 0 ? <span className="font-semibold text-red-500">{formatAmount(v)}</span> : null),
        ...sortProps('dueAmount'),
      },
      {
        title: 'Customer With No Invoices',
        key: 'nonOrder',
        ...sortProps('nonOrder'),
        render: (_, row) => {
          const item = (nonOrderCustomers || []).find(n => n.state === row.state);
          const count = item?.count || 0;
          if (!count) return null;
          return (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20">{count}</span>
              <button
                className="text-xs px-2 py-0.5 rounded border border-amber-300 text-amber-600 font-medium hover:bg-amber-50 whitespace-nowrap transition-colors"
                onClick={e => {
                  e.stopPropagation();
                  handleViewNonOrderCustomers(row.state);
                }}
              >
                View →
              </button>
            </div>
          );
        },
      },
      {
        title: '',
        key: 'action',
        fixed: 'right',
        width: 140,
        render: (_, row) => (
          <button
            className="text-xs px-2.5 py-1 rounded font-medium text-white whitespace-nowrap transition-opacity hover:opacity-80"
            style={{ backgroundColor: PRIMARY }}
            onClick={e => {
              e.stopPropagation();
              drillToCity(row.state);
            }}
          >
            View Cities →
          </button>
        ),
      },
    ];
  }, [drillToCity, nonOrderCustomers, handleViewNonOrderCustomers, stateSortBy]);

  const cityColumns = useMemo(
    () => [
      {
        title: 'City',
        dataIndex: 'city',
        key: 'city',
        fixed: 'left',
        width: 160,
        render: val => (
          <button
            className="font-semibold hover:underline transition-colors"
            style={{ color: PRIMARY }}
            onClick={e => {
              e.stopPropagation();
              drillToCustomer(val);
            }}
          >
            {val}
          </button>
        ),
      },
      {
        title: 'Actual Sales',
        dataIndex: 'totalSales',
        key: 'totalSales',
        render: v => (v ? formatAmount(v) : null),
      },
      {
        title: 'Customers',
        dataIndex: 'customerCount',
        key: 'customerCount',
        render: v => v || null,
      },
      { title: 'Invoices', dataIndex: 'invoiceCount', key: 'invoiceCount', render: v => v || null },
      {
        title: 'Collection',
        dataIndex: 'collection',
        key: 'collection',
        render: v => (v ? formatAmount(v) : null),
      },
      {
        title: 'Due Amount',
        dataIndex: 'dueAmount',
        key: 'dueAmount',
        render: v => (v > 0 ? <span className="font-semibold text-red-500">{formatAmount(v)}</span> : null),
      },
      {
        title: 'Customer With No Invoices',
        key: 'nonOrderCount',
        render: (_, row) => {
          const count = row.nonOrderCount || 0;
          if (!count) return null;
          return (
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20">{count}</span>
              <button
                className="text-xs px-2 py-0.5 rounded border border-amber-300 text-amber-600 font-medium hover:bg-amber-50 whitespace-nowrap transition-colors"
                onClick={e => {
                  e.stopPropagation();
                  handleViewNonOrderCustomers(selectedState, row.city);
                }}
              >
                View →
              </button>
            </div>
          );
        },
      },
      {
        title: '',
        key: 'action',
        render: (_, row) => (
          <button
            className="text-xs px-2.5 py-1 rounded font-medium text-white whitespace-nowrap transition-opacity hover:opacity-80"
            style={{ backgroundColor: PRIMARY }}
            onClick={e => {
              e.stopPropagation();
              drillToCustomer(row.city);
            }}
          >
            View Customers →
          </button>
        ),
      },
    ],
    [drillToCustomer, selectedState, handleViewNonOrderCustomers]
  );

  const customerColumns = useMemo(
    () => [
      {
        title: 'Customer',
        dataIndex: 'customerName',
        key: 'customerName',
        fixed: 'left',
        render: (v, row) => (
          <button
            className="font-semibold hover:underline transition-colors text-left"
            style={{ color: PRIMARY }}
            onClick={e => {
              e.stopPropagation();
              drillToInvoices({ id: row.customerId, name: v });
            }}
          >
            {v || null}
          </button>
        ),
      },
      { title: 'Invoices', dataIndex: 'invoiceCount', key: 'invoiceCount', render: v => v || null },
      {
        title: 'Total Sales',
        dataIndex: 'totalSales',
        key: 'totalSales',
        render: v => (v ? formatAmount(v) : null),
      },
      {
        title: 'Collection',
        dataIndex: 'collection',
        key: 'collection',
        render: v => (v ? formatAmount(v) : null),
      },
      {
        title: 'Outstanding',
        dataIndex: 'outstanding',
        key: 'outstanding',
        render: v => (v > 0 ? <span className="font-semibold text-red-500">{formatAmount(v)}</span> : null),
      },
      {
        title: 'Due Amount',
        dataIndex: 'dueAmount',
        key: 'dueAmount',
        render: v => (v > 0 ? <span className="font-semibold text-orange-500">{formatAmount(v)}</span> : null),
      },
      {
        title: 'Last Invoice',
        dataIndex: 'lastInvoiceDate',
        key: 'lastInvoiceDate',
        render: v => (v ? dateFormateForUi(v) : null),
      },
      {
        title: '',
        key: 'action',
        render: (_, row) => (
          <button
            className="text-xs px-2.5 py-1 rounded font-medium text-white whitespace-nowrap transition-opacity hover:opacity-80"
            style={{ backgroundColor: PRIMARY }}
            onClick={e => {
              e.stopPropagation();
              drillToInvoices({ id: row.customerId, name: row.customerName });
            }}
          >
            View Invoices →
          </button>
        ),
      },
    ],
    [drillToInvoices]
  );

  const inactiveColumns = useMemo(
    () => [
      {
        title: 'Customer',
        dataIndex: 'customerName',
        key: 'customerName',
        render: (v, row) => (
          <button
            className="font-semibold hover:underline transition-colors text-left"
            style={{ color: PRIMARY }}
            onClick={e => {
              e.stopPropagation();
              drillToInvoices({ id: row.customerId, name: v });
            }}
          >
            {v || '—'}
          </button>
        ),
      },
      {
        title: 'Last Invoice',
        dataIndex: 'lastInvoice',
        key: 'lastInvoice',
        render: v => (v ? dateFormateForUi(v) : null),
      },
      {
        title: 'Lifetime Sales',
        dataIndex: 'totalLifetime',
        key: 'totalLifetime',
        render: v => (v ? formatAmount(v) : null),
      },
      { title: 'State', dataIndex: 'state', key: 'state', render: v => v || null },
      { title: 'City', dataIndex: 'city', key: 'city', render: v => v || null },
      {
        title: '',
        key: 'action',
        render: (_, row) => (
          <button
            className="text-xs px-2.5 py-1 rounded font-medium whitespace-nowrap transition-opacity hover:opacity-80 border"
            style={{ color: PRIMARY, borderColor: PRIMARY }}
            onClick={e => {
              e.stopPropagation();
              drillToInvoices({ id: row.customerId, name: row.customerName });
            }}
          >
            View Invoices →
          </button>
        ),
      },
    ],
    [drillToInvoices]
  );

  // ─── User dropdown options ────────────────────────────────────────────────
  const userOptions = useMemo(
    () =>
      (userDropdown || []).map(u => ({
        label: u.name || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || '',
        value: u.id || u._id,
      })),
    [userDropdown]
  );

  // ─── Active filter chips (expanded panel + collapsed bar below tabs) ──────
  const renderSalesActiveFiltersTags = () => (
    <div className="px-1 py-1.5 bg-gray-50/80 rounded-md border border-gray-100">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-gray-600 font-medium text-sm">Active filters:</span>
        {appliedFilters.division?.length > 0 && (
          <Tag
            closable
            onClose={() => {
              setFilter(p => ({ ...p, division: '', branch: '' }));
              setAppliedFilters(p => ({ ...p, division: '', branch: '' }));
              syncUrl({ division: null, branch: null });
            }}
            className="px-3 py-1 bg-white"
          >
            <span className="font-medium capitalize">Division:</span>{' '}
            <span>
              {(Array.isArray(appliedFilters.division) ? appliedFilters.division : [appliedFilters.division])
                .map(id => divDrop?.find(d => d.id === id)?.name)
                .filter(Boolean)
                .join(', ')}
            </span>
          </Tag>
        )}
        {appliedFilters.branch?.length > 0 && (
          <Tag
            closable
            onClose={() => {
              setFilter(p => ({ ...p, branch: '' }));
              setAppliedFilters(p => ({ ...p, branch: '' }));
              syncUrl({ branch: null });
            }}
            className="px-3 py-1 bg-white"
          >
            <span className="font-medium capitalize">Branch:</span>{' '}
            <span>
              {(Array.isArray(appliedFilters.branch) ? appliedFilters.branch : [appliedFilters.branch])
                .map(id => branchDrop?.find(d => d.id === id)?.name)
                .filter(Boolean)
                .join(', ')}
            </span>
          </Tag>
        )}
        {appliedFilters.userId && (
          <Tag
            closable
            onClose={() => {
              setFilter(p => ({ ...p, userId: '' }));
              setAppliedFilters(p => ({ ...p, userId: '' }));
              syncUrl({ userId: null });
            }}
            className="px-3 py-1 bg-white"
          >
            <span className="font-medium capitalize">User:</span> <span>{userOptions.find(u => u.value === appliedFilters.userId)?.label || appliedFilters.userId}</span>
          </Tag>
        )}
        {appliedDateRange?.[0] && appliedDateRange?.[1] && (
          <Tag
            closable
            onClose={() => {
              setDateRange(null);
              setAppliedDateRange(null);
              setSelectedPreset('custom');
              syncUrl({ startDate: null, endDate: null, preset: null });
            }}
            className="px-3 py-1 bg-white"
          >
            <span className="font-medium capitalize">Date:</span>{' '}
            <span>
              {dayjs(appliedDateRange[0]).format('YYYY-MM-DD')} to {dayjs(appliedDateRange[1]).format('YYYY-MM-DD')}
            </span>
          </Tag>
        )}
        <Button type="link" size="small" style={{ color: PRIMARY }} onClick={handleResetFilters}>
          Clear all
        </Button>
      </div>
    </div>
  );

  // ─── Filter panel body (toggle lives on parent home tab bar) ──────────────
  const renderFilterPanelBody = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 items-start">
        <div className="lg:col-span-2 flex flex-col w-full min-w-0">
          <CustomDatePicker selectedPreset={selectedPreset} setSelectedPreset={setSelectedPreset} dateRange={dateRange} setDateRange={setDateRange} label="Date Range" />
        </div>
        <div className="flex flex-col gap-2 w-full min-w-0">
          <FilterInput
            type={filterInputEnum.SELECT}
            mode="multiple"
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
            mode="multiple"
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
            disabled={!filter.division || filter.division.length === 0}
          />
        </div>
        <div className="flex flex-col gap-2 w-full min-w-0">
          <div className="text-[13px] font-semibold text-gray-700 flex items-center gap-1.5">User</div>
          <Select
            showSearch
            filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            placeholder="Select User"
            className={SALES_ANALYTICS_FILTER_SELECT_CLASS}
            options={userOptions}
            value={userDropdownLoading ? undefined : filter.userId}
            onChange={v => setFilter(prev => ({ ...prev, userId: v }))}
            allowClear
            loading={userDropdownLoading}
          />
        </div>
      </div>

      {activeFilterCount > 0 && <div className="mt-3 pt-3 border-t border-gray-100">{renderSalesActiveFiltersTags()}</div>}
    </>
  );

  // ── State-wise table — client-sliced without pagination, sorted client-side (all rows already loaded) ──
  const allStateRows = useMemo(() => stateWise?.result || [], [stateWise]);
  const stateTotalResults = allStateRows.length;

  const stateRowSortValue = useCallback((row, field) => (field === 'nonOrder' ? (nonOrderCustomers || []).find(n => n.state === row.state)?.count || 0 : (row?.[field] ?? 0)), [nonOrderCustomers]);

  const sortedStateRows = useMemo(() => {
    if (!stateSortBy) return allStateRows;
    const [field, dir] = stateSortBy.split(':');
    const mult = dir === 'asc' ? 1 : -1;
    return [...allStateRows].sort((a, b) => (stateRowSortValue(a, field) - stateRowSortValue(b, field)) * mult);
  }, [allStateRows, stateSortBy, stateRowSortValue]);

  const statePerformanceTableRows = useMemo(() => {
    return stateViewAll ? sortedStateRows : sortedStateRows.slice(0, PERFORMANCE_DRILLDOWN_TABLE_INITIAL_ROWS);
  }, [sortedStateRows, stateViewAll]);

  const handleStateTableChange = (_pagination, _filters, sorter) => {
    const s = Array.isArray(sorter) ? sorter[0] : sorter;
    if (s?.field && s?.order) {
      const next = `${s.field}:${s.order === 'ascend' ? 'asc' : 'desc'}`;
      if (next !== stateSortBy) setStateSortBy(next);
    } else {
      setStateSortBy(undefined);
    }
  };

  // ── Customer-wise performance table — server-paginated + server-sorted ──
  const customerWiseRows = customerWise?.result || [];
  const customerWiseTotalResults = customerWise?.totalResults || 0;

  const customerWiseColumns = useMemo(() => {
    const [sortField, sortDir] = (customerSortBy || '').split(':');
    const orderFor = field => (sortField === field ? (sortDir === 'asc' ? 'ascend' : 'descend') : null);
    // Only the active column gets a `sortOrder` — giving every sortable column a (possibly null) sortOrder makes
    // AntD think multiple columns are simultaneously controlled and it starts passing `sorter` as an array to
    // onChange, which breaks the `sorter.field`/`sorter.order` destructuring below after the first click.
    const sortProps = field => (orderFor(field) ? { sorter: true, sortDirections: ['ascend', 'descend'], sortOrder: orderFor(field) } : { sorter: true, sortDirections: ['ascend', 'descend'] });
    return [
      {
        title: 'Customer#',
        dataIndex: 'customerNumber',
        key: 'customerNumber',
        render: (_, record) => <Tag className="font-semibold">{record?.customerNumber}</Tag>,
        width: 120,
        visible: true,
        required: true,
        sorter: true,
        fixed: 'left',
      },
      {
        title: 'Customer',
        dataIndex: 'customerName',
        key: 'customerName',
        width: 400,
        render: val => (
          <Tooltip title={val}>
            <span className="font-medium text-gray-800 line-clamp-1 max-w-[240px] inline-block align-middle">{val}</span>
          </Tooltip>
        ),
      },
      { title: 'Sales Orders', dataIndex: 'salesOrderCount', key: 'salesOrderCount', width: 120, ...sortProps('salesOrderCount') },
      { title: 'Sales Order Amount', dataIndex: 'salesOrderAmount', key: 'salesOrderAmount', ...sortProps('salesOrderAmount'), render: v => formatAmount(v) },
      { title: 'Invoices', dataIndex: 'invoiceCount', key: 'invoiceCount', width: 100, ...sortProps('invoiceCount') },
      { title: 'Actual Sales', dataIndex: 'actualSales', key: 'actualSales', ...sortProps('actualSales'), render: v => (v ? formatAmount(v) : null) },
      { title: 'Collection', dataIndex: 'collection', key: 'collection', ...sortProps('collection'), render: v => formatAmount(v) },
      {
        title: 'Due Amount',
        dataIndex: 'dueAmount',
        key: 'dueAmount',
        ...sortProps('dueAmount'),
        render: v => (v > 0 ? <span className="font-semibold text-red-500">{formatAmount(v)}</span> : null),
      },
    ];
  }, [customerSortBy]);

  const customerWisePagination = customerViewAll
    ? {
        current: customerPage,
        pageSize: customerLimit,
        total: customerWiseTotalResults,
        onChange: (page, pageSize) => {
          if (pageSize !== customerLimit) {
            setCustomerLimit(pageSize);
            setCustomerPage(1);
          } else {
            setCustomerPage(page);
          }
        },
      }
    : false;

  // Table onChange fires for sorting only (CustomTable disables the AntD Table's own pagination).
  const handleCustomerWiseTableChange = (_pagination, _filters, sorter) => {
    const s = Array.isArray(sorter) ? sorter[0] : sorter;
    const next = s?.field && s?.order ? `${s.field}:${s.order === 'ascend' ? 'asc' : 'desc'}` : undefined;
    if (next !== customerSortBy) {
      setCustomerSortBy(next);
      setCustomerPage(1);
    }
  };

  const openCustomerBreakdownDrawer = record => {
    if (!record?.customerId) return;
    setCustomerBreakdownDrawerCustomer({ customerId: record.customerId, customerNumber: record.customerNumber, customerName: record.customerName });
    setCustomerBreakdownDrawerOpen(true);
  };

  const openItemBreakdownDrawer = record => {
    if (!record?.itemId) return;
    setItemBreakdownDrawerItem({ itemId: record.itemId, itemNo: record.itemNo, itemName: record.itemName });
    setItemBreakdownDrawerOpen(true);
  };

  // ── Item-wise table — server-paginated + server-sorted ──
  const itemColumns = useMemo(() => {
    const [sortField, sortDir] = (itemSortBy || '').split(':');
    const orderFor = field => (sortField === field ? (sortDir === 'asc' ? 'ascend' : 'descend') : null);
    // Only the active column gets a `sortOrder` — giving every sortable column a (possibly null) sortOrder makes
    // AntD think multiple columns are simultaneously controlled and it starts passing `sorter` as an array to
    // onChange, which breaks the `sorter.field`/`sorter.order` destructuring below after the first click.
    const sortProps = field => (orderFor(field) ? { sorter: true, sortDirections: ['ascend', 'descend'], sortOrder: orderFor(field) } : { sorter: true, sortDirections: ['ascend', 'descend'] });
    return [
      {
        title: 'Item#',
        dataIndex: 'itemId',
        key: 'itemId',
        render: (_, record) => <Tag className="font-semibold">{record?.itemNo}</Tag>,
        width: 120,
        visible: true,
        required: true,
        sorter: true,
        fixed: 'left',
      },
      {
        title: 'Item',
        dataIndex: 'itemName',
        key: 'itemName',
        render: val => (
          <Tooltip title={val}>
            <span className="font-medium text-gray-800 line-clamp-1 max-w-[240px] inline-block align-middle">{val}</span>
          </Tooltip>
        ),
      },
      { title: 'Sales Orders', dataIndex: 'salesOrderCount', key: 'salesOrderCount', width: 120, ...sortProps('salesOrderCount') },
      { title: 'Sales Order Qty', dataIndex: 'salesOrderQty', key: 'salesOrderQty', width: 140, ...sortProps('salesOrderQty') },
      { title: 'Sales Order Amount', dataIndex: 'salesOrderAmount', key: 'salesOrderAmount', ...sortProps('salesOrderAmount'), render: v => formatAmount(v) },
      { title: 'Invoices', dataIndex: 'invoiceCount', key: 'invoiceCount', width: 100, ...sortProps('invoiceCount') },
      { title: 'Invoice Qty', dataIndex: 'invoiceQty', key: 'invoiceQty', width: 110, ...sortProps('invoiceQty') },
      { title: 'Actual Sales', dataIndex: 'actualSales', key: 'actualSales', ...sortProps('actualSales'), render: v => (v ? formatAmount(v) : null) },
    ];
  }, [itemSortBy]);

  // ── Item-wise table — server-paginated ──
  const itemRows = itemWise?.result || [];
  const itemTotalResults = itemWise?.totalResults || 0;
  const itemPagination = itemViewAll
    ? {
        current: itemPage,
        pageSize: itemLimit,
        total: itemTotalResults,
        onChange: (page, pageSize) => {
          if (pageSize !== itemLimit) {
            setItemLimit(pageSize);
            setItemPage(1);
          } else {
            setItemPage(page);
          }
        },
      }
    : false;

  // Table onChange fires for sorting only (CustomTable disables the AntD Table's own pagination).
  const handleItemTableChange = (_pagination, _filters, sorter) => {
    const s = Array.isArray(sorter) ? sorter[0] : sorter;
    const next = s?.field && s?.order ? `${s.field}:${s.order === 'ascend' ? 'asc' : 'desc'}` : undefined;
    if (next !== itemSortBy) {
      setItemSortBy(next);
      setItemPage(1);
    }
  };

  const cityPerformanceTableRows = useMemo(() => {
    const list = cityWise || [];
    return cityPerformanceTableExpanded ? list : list.slice(0, PERFORMANCE_DRILLDOWN_TABLE_INITIAL_ROWS);
  }, [cityWise, cityPerformanceTableExpanded]);

  const cityPerformanceHasMoreRows = (cityWise || []).length > PERFORMANCE_DRILLDOWN_TABLE_INITIAL_ROWS;

  const inactiveCustomersTableRows = useMemo(() => {
    const list = inactiveCustomers || [];
    return inactiveCustomersTableExpanded ? list : list.slice(0, PERFORMANCE_DRILLDOWN_TABLE_INITIAL_ROWS);
  }, [inactiveCustomers, inactiveCustomersTableExpanded]);

  const inactiveCustomersHasMoreRows = (inactiveCustomers || []).length > PERFORMANCE_DRILLDOWN_TABLE_INITIAL_ROWS;

  const customerPerformanceTableRows = useMemo(() => {
    const list = customers || [];
    return customerPerformanceTableExpanded ? list : list.slice(0, PERFORMANCE_DRILLDOWN_TABLE_INITIAL_ROWS);
  }, [customers, customerPerformanceTableExpanded]);

  const customerPerformanceHasMoreRows = (customers || []).length > PERFORMANCE_DRILLDOWN_TABLE_INITIAL_ROWS;

  const renderStateView = () => {
    const anyViewAll = customerViewAll || itemViewAll;
    return (
      <>
        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 border-l border-gray-200">
          <KpiCard
            icon={<Icons.BarChartOutlined className="text-xl" />}
            title="Actual Sales"
            displayValue={formatAmountShort(summary?.totalSales || 0)}
            valueTooltip={formatAmount(summary?.totalSales || 0)}
            loading={summaryLoading}
            tooltip={'Total of all invoices raised in the selected period.Excludes cancelled invoices.'}
          />
          <KpiCard
            icon={<Icons.UserOutlined className="text-xl" />}
            title="Active Customers"
            displayValue={String(summary?.uniqueCustomers || 0)}
            loading={summaryLoading}
            tooltip={'Unique customers with at least one invoice in the selected period.'}
          />
          <KpiCard
            icon={<Icons.DollarOutlined className="text-xl" />}
            title="Total Collection"
            displayValue={formatAmountShort(summary?.totalCollection || 0)}
            valueTooltip={formatAmount(summary?.totalCollection || 0)}
            loading={summaryLoading}
            tooltip={'Total payments received in the selected period.Based on payment date, not invoice date.'}
          />
          <KpiCard
            icon={<Icons.WalletOutlined className="text-xl" />}
            title="Outstanding"
            displayValue={formatAmountShort(summary?.outstanding || 0)}
            valueTooltip={formatAmount(summary?.outstanding || 0)}
            loading={summaryLoading}
            tooltip={'Total live outstanding balance across all active customers — sourced from customer current balance, same as the main dashboard.'}
          />
          <KpiCard
            icon={<Icons.ExclamationCircleOutlined className="text-xl" />}
            title="Due Amount"
            displayValue={formatAmountShort(summary?.totalDue || 0)}
            valueTooltip={formatAmount(summary?.totalDue || 0)}
            loading={summaryLoading}
            tooltip={'Total unpaid balance on invoices whose due date has already passed.Based on invoice due date vs today.'}
          />
        </div>

        {!anyViewAll && (
          <>
            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 border-l border-gray-200">
              {/* Sales by State */}
              <div className="lg:col-span-2 bg-white border-r border-b border-gray-200 p-4">
                <SalesByStateChart stateGraph={stateGraph} loading={stateGraphLoading} />
              </div>

              {/* Sales Mix by State */}
              <div className="bg-white border-r border-b border-gray-200 p-4 overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-700">Sales Mix by State</h3>
                  <div className="flex items-center bg-gray-100 rounded-md p-0.5 gap-0.5">
                    <button
                      onClick={() => setPieShowAll(false)}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded transition-all duration-150 ${!pieShowAll ? 'bg-white text-[#030711] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Top 5
                    </button>
                    <button
                      onClick={() => setPieShowAll(true)}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded transition-all duration-150 ${pieShowAll ? 'bg-white text-[#030711] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      All
                    </button>
                  </div>
                </div>
                {stateGraphLoading ? (
                  <div className="h-[190px] flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
                  </div>
                ) : pieData.length > 0 ? (
                  <div className="flex items-center gap-3">
                    <div className="w-[170px] h-[190px] flex-shrink-0">
                      <Suspense
                        fallback={
                          <div className="flex items-center justify-center" style={{ height: 190 }}>
                            <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
                          </div>
                        }
                      >
                        <Pie {...pieConfig} />
                      </Suspense>
                    </div>
                    {/* Custom compact legend — state, amount and share */}
                    <div className="flex-1 min-w-0 space-y-1.5 max-h-[190px] overflow-y-auto pr-1">
                      {pieData.map((d, i) => (
                        <div key={i} className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span className="text-[11px] text-gray-600 truncate" title={d.state}>
                              {d.state}
                            </span>
                          </div>
                          <span className="text-[11px] text-gray-500 font-medium flex-shrink-0 whitespace-nowrap">
                            {formatAmountShort(d.value)} · {d.percent}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="h-[190px] flex flex-col items-center justify-center text-gray-400">
                    <Icons.BarChartOutlined className="text-3xl mb-2" />
                    <span className="text-xs">No data for the selected filters</span>
                  </div>
                )}
              </div>
            </div>

            {/* Charts Row 2 — Order/Invoice/Payment trend + Order status */}
            <div className="grid grid-cols-1 lg:grid-cols-3 border-l border-gray-200">
              {/* Order - Invoice - Payment Trend (Monthly) */}
              <div className="lg:col-span-2 bg-white border-r border-b border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-[#030711]">Order - Invoice - Payment Trend (Monthly)</h3>
                    <p className="text-[11px] text-gray-500">Value in ₹</p>
                  </div>
                  <DatePicker
                    picker="year"
                    size="small"
                    allowClear={false}
                    className="w-32"
                    value={orderTrendFY}
                    format={d => `FY ${fyStartYear(d)}-${String(fyStartYear(d) + 1).slice(-2)}`}
                    onChange={date => setOrderTrendFY(date || dayjs())}
                  />
                </div>
                <div className="flex items-center gap-4 mb-2 text-[11px] text-gray-600">
                  {ORDER_TREND_SERIES.map((c, i) => (
                    <span key={c} className="inline-flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: ORDER_TREND_COLORS[i] }} /> {c} (₹)
                    </span>
                  ))}
                </div>
                {orderTrendLoading ? (
                  <div className="flex items-center justify-center" style={{ height: 260 }}>
                    <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
                  </div>
                ) : orderTrendData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-gray-400" style={{ height: 260 }}>
                    <Icons.BarChartOutlined className="text-3xl mb-2" />
                    <span className="text-xs">No data for the selected filters</span>
                  </div>
                ) : (
                  <Suspense
                    fallback={
                      <div className="flex items-center justify-center" style={{ height: 260 }}>
                        <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
                      </div>
                    }
                  >
                    <Line {...orderTrendConfig} />
                  </Suspense>
                )}
              </div>

              {/* Order Status Summary */}
              <div className="bg-white border-r border-b border-gray-200 p-4 overflow-hidden">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Order Status Summary</h3>
                {orderStatusLoading ? (
                  <div className="flex items-center justify-center" style={{ height: 200 }}>
                    <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
                  </div>
                ) : orderStatusData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-gray-400" style={{ height: 200 }}>
                    <Icons.BarChartOutlined className="text-3xl mb-2" />
                    <span className="text-xs">No data for the selected filters</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-2">
                    <Suspense
                      fallback={
                        <div className="flex items-center justify-center" style={{ height: 200 }}>
                          <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
                        </div>
                      }
                    >
                      <Pie {...orderStatusConfig} />
                    </Suspense>
                    <div className="space-y-2.5">
                      {orderStatusData.map(d => (
                        <div key={d.status} className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-2 text-[12px] text-gray-600">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: ORDER_STATUS_COLOR_MAP[d.status] || ORDER_STATUS_FALLBACK_COLOR }} />
                            {d.status}
                          </span>
                          <span className="text-[12px] font-medium text-gray-500 tabular-nums">{d.percent}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Performance tables — tabbed (State-wise / Customer-wise / Item-wise) */}
        <div className="bg-white border-x border-b border-gray-200 px-4 py-2">
          {/* Tab header — mirrors the top dashboard tab bar (ViewDashboard) for a uniform look */}
          {!anyViewAll && (
            <div className="flex items-center justify-between gap-3 border-b border-gray-200 mb-3">
              <div className="flex items-center min-w-0 flex-1 overflow-x-auto overflow-y-hidden">
                {PERF_TABS.map(t => {
                  const active = perfTab === t.key;
                  return (
                    <button
                      key={t.key}
                      onClick={() => setPerfTab(t.key)}
                      className={`px-4 py-2.5 text-sm font-medium -mb-px whitespace-nowrap transition-[color,box-shadow] duration-150 ${
                        active ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700 hover:shadow-[inset_0_-2px_0_0_#d1d5db]'
                      }`}
                      style={active ? { color: PRIMARY, boxShadow: `inset 0 -2px 0 0 ${PRIMARY}` } : undefined}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
              {perfTab === PERF_TAB.CUSTOMER && (
                <Button
                  size="small"
                  className="flex-shrink-0"
                  onClick={() => {
                    setCustomerViewAll(true);
                    setCustomerPage(1);
                  }}
                >
                  View All
                </Button>
              )}
              {perfTab === PERF_TAB.ITEM && itemTotalResults > PERFORMANCE_DRILLDOWN_TABLE_INITIAL_ROWS && (
                <Button
                  size="small"
                  className="flex-shrink-0"
                  onClick={() => {
                    setItemViewAll(true);
                    setItemPage(1);
                  }}
                >
                  View All
                </Button>
              )}
            </div>
          )}

          {/* Unified View All Header */}
          {anyViewAll && (
            <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
              <Button
                onClick={() => {
                  setStateViewAll(false);
                  setCustomerViewAll(false);
                  setCustomerPage(1);
                  setItemViewAll(false);
                  setItemPage(1);
                }}
                icon={<Icons.ArrowLeftOutlined />}
                type="text"
                className="flex items-center justify-center hover:bg-gray-100 bg-gray-50"
              />
              <div>
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  {PERF_TABS.find(t => t.key === perfTab)?.label}
                  <span className="text-xs font-semibold text-gray-400 tabular-nums">
                    ({perfTab === PERF_TAB.STATE ? stateTotalResults : perfTab === PERF_TAB.CUSTOMER ? customerWiseTotalResults : itemTotalResults})
                  </span>
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {perfTab === PERF_TAB.STATE && 'Click state name or "View Cities →" to drill down'}
                  {perfTab === PERF_TAB.CUSTOMER && 'Top customers by actual sales'}
                  {perfTab === PERF_TAB.ITEM && 'Top items by actual sales'}
                </p>
              </div>
            </div>
          )}

          {/* State-wise (API-bound + drill-down) */}
          {perfTab === PERF_TAB.STATE && (
            <>
              <div>
                <CustomTable
                  columns={stateColumns}
                  data={statePerformanceTableRows}
                  loading={stateWiseLoading}
                  pagination={false}
                  onChange={handleStateTableChange}
                  onRowClick={handleStateRowClick}
                  dynamicScrollY={false}
                  tableId="state"
                  scroll={{ x: 'max-content' }}
                />
              </div>
              {!stateWiseLoading && allStateRows.length > PERFORMANCE_DRILLDOWN_TABLE_INITIAL_ROWS && (
                <div className="flex justify-center pt-3 mt-2 border-t border-gray-100">
                  <Button type="text" className="!h-auto py-1.5 px-3 font-semibold" style={{ color: PRIMARY }} onClick={() => setStateViewAll(v => !v)}>
                    {stateViewAll ? (
                      'Show less'
                    ) : (
                      <>
                        View more
                        <span className="text-gray-500 font-normal ml-1.5">({allStateRows.length - PERFORMANCE_DRILLDOWN_TABLE_INITIAL_ROWS} more)</span>
                      </>
                    )}
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Customer-wise (customer-wise, server-paginated) */}
          {perfTab === PERF_TAB.CUSTOMER && (
            <>
              <div className={customerViewAll ? 'pb-16' : ''}>
                <CustomTable
                  columns={customerWiseColumns}
                  data={customerWiseRows}
                  loading={customerWiseLoading}
                  rowKey="customerId"
                  pagination={customerWisePagination}
                  onChange={handleCustomerWiseTableChange}
                  onRowClick={openCustomerBreakdownDrawer}
                  dynamicScrollY={false}
                  tableId="customerWise"
                  scroll={{ x: 'max-content' }}
                />
              </div>
            </>
          )}

          {/* Item-wise (server-paginated) */}
          {perfTab === PERF_TAB.ITEM && (
            <>
              <div className={itemViewAll ? 'pb-16' : ''}>
                <CustomTable
                  columns={itemColumns}
                  data={itemRows}
                  loading={itemWiseLoading}
                  rowKey="itemId"
                  pagination={itemPagination}
                  onChange={handleItemTableChange}
                  onRowClick={openItemBreakdownDrawer}
                  dynamicScrollY={false}
                  tableId="item"
                  scroll={{ x: 'max-content' }}
                />
              </div>
            </>
          )}
        </div>
        {!anyViewAll && (
          <ItemGroupMonthlySalesTable
            monthlySales={itemGroupAnalytics?.monthlySales}
            loading={itemGroupAnalyticsLoading}
            title="Item Group Sales"
            subtitle="Month-wise Sales, Qty & Contribution by item group"
            extra={
              <DatePicker
                picker="year"
                size="small"
                allowClear={false}
                className="w-32"
                value={itemGroupFY}
                format={d => `FY ${fyStartYear(d)}-${String(fyStartYear(d) + 1).slice(-2)}`}
                onChange={date => setItemGroupFY(date || dayjs())}
              />
            }
          />
        )}
      </>
    );
  };

  // ─── City View ────────────────────────────────────────────────────────────
  const renderCityView = () => {
    const cityTotal = (cityWise || []).reduce((s, d) => s + d.totalSales, 0);
    const cityCustomers = (cityWise || []).reduce((s, d) => s + d.customerCount, 0);
    const cityCollection = (cityWise || []).reduce((s, d) => s + d.collection, 0);
    const cityOutstanding = (cityWise || []).reduce((s, d) => s + (d.outstanding || 0), 0);
    const cityDue = (cityWise || []).reduce((s, d) => s + (d.dueAmount || 0), 0);

    return (
      <>
        <Breadcrumb items={['All States', selectedState]} onNavigate={handleBreadcrumb} />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 border-l border-gray-200">
          <KpiCard
            icon={<Icons.BarChartOutlined className="text-xl" />}
            title="Actual Sales"
            displayValue={formatAmountShort(cityTotal)}
            valueTooltip={formatAmount(cityTotal)}
            loading={cityWiseLoading}
            tooltip={'Total invoices raised by customers in this state for the selected period.'}
          />
          <KpiCard
            icon={<Icons.UserOutlined className="text-xl" />}
            title="Active Customers"
            displayValue={String(cityCustomers)}
            loading={cityWiseLoading}
            tooltip={'Unique customers with at least one invoice in this state.'}
          />
          <KpiCard
            icon={<Icons.DollarOutlined className="text-xl" />}
            title="Total Collection"
            displayValue={formatAmountShort(cityCollection)}
            valueTooltip={formatAmount(cityCollection)}
            loading={cityWiseLoading}
            tooltip={'Payments received from customers in this state for the selected period.'}
          />
          <KpiCard
            icon={<Icons.WalletOutlined className="text-xl" />}
            title="Outstanding"
            displayValue={formatAmountShort(cityOutstanding)}
            valueTooltip={formatAmount(cityOutstanding)}
            loading={cityWiseLoading}
            tooltip={'Total live outstanding balance across customers in this state — sourced from customer current balance, same as the main dashboard.'}
          />
          <KpiCard
            icon={<Icons.ExclamationCircleOutlined className="text-xl" />}
            title="Due Amount"
            displayValue={formatAmountShort(cityDue)}
            valueTooltip={formatAmount(cityDue)}
            loading={cityWiseLoading}
            tooltip={'Total unpaid balance on overdue invoices across all cities in this state.'}
          />
        </div>

        <div className="bg-white border-x border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">City-wise Performance — {selectedState}</h3>
            <span className="text-xs text-gray-400">Click city name to see customers</span>
          </div>
          <CustomTable columns={cityColumns} data={cityPerformanceTableRows} loading={cityWiseLoading} dynamicScrollY={false} tableId="city" scroll={{ x: 'max-content' }} />
          {!cityWiseLoading && cityPerformanceHasMoreRows && (
            <div className="flex justify-center pt-3 mt-2 border-t border-gray-100">
              <Button type="text" className="!h-auto py-1.5 px-3 font-semibold" style={{ color: PRIMARY }} onClick={() => setCityPerformanceTableExpanded(v => !v)}>
                {cityPerformanceTableExpanded ? (
                  'Show less'
                ) : (
                  <>
                    View more
                    <span className="text-gray-500 font-normal ml-1.5">({(cityWise || []).length - PERFORMANCE_DRILLDOWN_TABLE_INITIAL_ROWS} more)</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </>
    );
  };

  // ─── Customer View ────────────────────────────────────────────────────────
  const renderCustomerView = () => {
    const custTotal = (customers || []).reduce((s, d) => s + d.totalSales, 0);
    const custCollection = (customers || []).reduce((s, d) => s + d.collection, 0);
    const custOutstanding = (customers || []).reduce((s, d) => s + d.outstanding, 0);
    const custDue = (customers || []).reduce((s, d) => s + (d.dueAmount || 0), 0);

    return (
      <>
        <Breadcrumb items={['All States', selectedState, selectedCity]} onNavigate={handleBreadcrumb} />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 border-l border-gray-200">
          <KpiCard
            icon={<Icons.UserOutlined className="text-xl" />}
            title="Total Customers"
            displayValue={String((customers || []).length)}
            loading={customersLoading}
            tooltip={'Customers with at least one invoice in this city for the selected period.'}
          />
          <KpiCard
            icon={<Icons.ShoppingOutlined className="text-xl" />}
            title="Total Sales"
            displayValue={formatAmountShort(custTotal)}
            valueTooltip={formatAmount(custTotal)}
            loading={customersLoading}
            tooltip={'Total invoices raised by customers in this city for the selected period.'}
          />
          <KpiCard
            icon={<Icons.DollarOutlined className="text-xl" />}
            title="Collection"
            displayValue={formatAmountShort(custCollection)}
            valueTooltip={formatAmount(custCollection)}
            loading={customersLoading}
            tooltip={'Payments received from customers in this city for the selected period.'}
          />
          <KpiCard
            icon={<Icons.WalletOutlined className="text-xl" />}
            title="Outstanding"
            displayValue={formatAmountShort(custOutstanding)}
            valueTooltip={formatAmount(custOutstanding)}
            loading={customersLoading}
            tooltip={'Total live outstanding balance across customers in this city — sourced from customer current balance, same as the main dashboard.'}
          />
          <KpiCard
            icon={<Icons.ExclamationCircleOutlined className="text-xl" />}
            title="Due Amount"
            displayValue={formatAmountShort(custDue)}
            valueTooltip={formatAmount(custDue)}
            loading={customersLoading}
            tooltip={'Total unpaid balance on invoices whose due date has already passed.'}
          />
        </div>

        {/* Inactive customers alert */}
        {((inactiveCustomers || []).length > 0 || inactiveCustomersLoading) && (
          <div className="bg-white border-x border-b border-orange-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icons.ExclamationCircleOutlined className="text-orange-500 text-base" />
              <h3 className="text-sm font-semibold text-orange-600">
                Customers without orders in last 90 days
                {!inactiveCustomersLoading && ` (${(inactiveCustomers || []).length})`}
              </h3>
            </div>
            <CustomTable columns={inactiveColumns} data={inactiveCustomersTableRows} loading={inactiveCustomersLoading} dynamicScrollY={false} tableId="inactive" scroll={{ x: 'max-content' }} />
            {!inactiveCustomersLoading && inactiveCustomersHasMoreRows && (
              <div className="flex justify-center pt-3 mt-2 border-t border-gray-100">
                <Button type="text" className="!h-auto py-1.5 px-3 font-semibold" style={{ color: PRIMARY }} onClick={() => setInactiveCustomersTableExpanded(v => !v)}>
                  {inactiveCustomersTableExpanded ? (
                    'Show less'
                  ) : (
                    <>
                      View more
                      <span className="text-gray-500 font-normal ml-1.5">({(inactiveCustomers || []).length - PERFORMANCE_DRILLDOWN_TABLE_INITIAL_ROWS} more)</span>
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Customer performance table */}
        <div className="bg-white border-x border-b border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Customer Performance — {selectedCity}</h3>
          <CustomTable columns={customerColumns} data={customerPerformanceTableRows} loading={customersLoading} dynamicScrollY={false} tableId="customer" scroll={{ x: 'max-content' }} />
          {!customersLoading && customerPerformanceHasMoreRows && (
            <div className="flex justify-center pt-3 mt-2 border-t border-gray-100">
              <Button type="text" className="!h-auto py-1.5 px-3 font-semibold" style={{ color: PRIMARY }} onClick={() => setCustomerPerformanceTableExpanded(v => !v)}>
                {customerPerformanceTableExpanded ? (
                  'Show less'
                ) : (
                  <>
                    View more
                    <span className="text-gray-500 font-normal ml-1.5">({(customers || []).length - PERFORMANCE_DRILLDOWN_TABLE_INITIAL_ROWS} more)</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </>
    );
  };

  // ─── Invoice Columns ──────────────────────────────────────────────────────
  const invoiceColumns = [
    {
      title: 'Invoice No.',
      dataIndex: 'invoiceId',
      key: 'invoiceId',
      render: (v, row) => (
        <Tag className="font-semibold cursor-pointer hover:opacity-80 transition-opacity" onClick={() => navigate(`/invoices/${row._id}`)}>
          {v || '—'}
        </Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'invoiceDate',
      key: 'invoiceDate',
      render: v => (v ? dateFormateForUi(v) : null),
    },
    {
      title: 'Amount',
      dataIndex: 'total',
      key: 'total',
      render: v => (v ? <span className="font-medium">{formatAmount(v)}</span> : null),
    },
    {
      title: 'Paid',
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      render: v => (v ? <span className="text-green-600 font-medium">{formatAmount(v)}</span> : null),
    },
    {
      title: 'Outstanding',
      dataIndex: 'balanceAmount',
      key: 'balanceAmount',
      render: v => (v > 0 ? <span className="font-semibold text-red-500">{formatAmount(v)}</span> : null),
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: v => (v ? dateFormateForUi(v) : null),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: v => (v ? <StatusBadge status={v} value={INVOICE_STATUS?.[v] || v} /> : null),
    },
  ];

  // ─── Invoice View ─────────────────────────────────────────────────────────
  const renderInvoiceView = () => {
    const cust = customerInvoices?.customer || {};
    const invoiceSummary = customerInvoices?.summary || {};
    const invoiceList = customerInvoices?.invoices || [];

    // Avatar initials
    const initials = (cust.name || selectedCustomer?.name || '')
      .split(' ')
      .slice(0, 2)
      .map(w => w[0])
      .join('')
      .toUpperCase();

    return (
      <>
        <Breadcrumb items={['All States', selectedState, selectedCity, selectedCustomer?.name || cust.name || 'Customer']} onNavigate={handleBreadcrumb} />

        {/* Customer Header Card */}
        <div className="bg-white border-x border-b border-gray-200 p-4">
          {customerInvoicesLoading && !cust.name ? (
            <div className="flex items-center gap-4">
              <div className="ds-shimmer w-14 h-14 rounded-full flex-shrink-0" />
              <div className="space-y-2 flex-1 min-w-0">
                <div className="ds-shimmer h-5 w-48 max-w-full" />
                <div className="ds-shimmer h-3 w-72 max-w-full" />
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0" style={{ backgroundColor: PRIMARY }}>
                {cust.companyLogo ? <img src={cust.companyLogo} alt={cust.name} className="w-full h-full rounded-full object-cover" /> : initials || <Icons.UserOutlined />}
              </div>

              {/* Info */}
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-900 leading-tight">{cust.name || selectedCustomer?.name || '—'}</h2>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-sm text-gray-500">
                  {(cust.city || cust.state) && (
                    <span className="flex items-center gap-1">
                      <Icons.EnvironmentOutlined className="text-xs" />
                      {[cust.city, cust.state].filter(Boolean).join(', ')}
                    </span>
                  )}
                  {cust.gstinUin && (
                    <>
                      <span className="text-gray-300">·</span>
                      <span className="text-xs font-mono text-gray-600">GSTIN: {cust.gstinUin}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 border-l border-gray-200">
          <KpiCard
            icon={<Icons.BarChartOutlined className="text-xl" />}
            title="Total Billed"
            displayValue={formatAmountShort(invoiceSummary.totalBilled || 0)}
            valueTooltip={formatAmount(invoiceSummary.totalBilled || 0)}
            loading={customerInvoicesLoading}
            tooltip={'Total of all invoices raised for this customer in the selected period.'}
          />
          <KpiCard
            icon={<Icons.DollarOutlined className="text-xl" />}
            title="Collected"
            displayValue={formatAmountShort(invoiceSummary.totalCollection || 0)}
            valueTooltip={formatAmount(invoiceSummary.totalCollection || 0)}
            loading={customerInvoicesLoading}
            tooltip={'Amount paid against invoices, as recorded on each invoice.'}
          />
          <KpiCard
            icon={<Icons.WalletOutlined className="text-xl" />}
            title="Outstanding"
            displayValue={formatAmountShort(invoiceSummary.outstanding || 0)}
            valueTooltip={formatAmount(invoiceSummary.outstanding || 0)}
            loading={customerInvoicesLoading}
            tooltip={'Total unpaid balance remaining across all invoices for this customer.'}
          />
          <KpiCard
            icon={<Icons.FileTextOutlined className="text-xl" />}
            title="Invoices"
            displayValue={String(invoiceSummary.invoiceCount || 0)}
            loading={customerInvoicesLoading}
            tooltip={'Number of invoices raised for this customer in the selected period.'}
          />
        </div>

        {/* Invoice Table */}
        <div className="bg-white border-x border-b border-gray-200 p-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Invoice List — {cust.name || selectedCustomer?.name || ''}</h3>
          <CustomTable columns={invoiceColumns} data={invoiceList} loading={customerInvoicesLoading} dynamicScrollY={false} tableId="customerInvoices" scroll={{ x: 'max-content' }} />
        </div>
      </>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div>
      {filtersPanelOpen && filtersPortalEl && createPortal(renderFilterPanelBody(), filtersPortalEl)}
      {!filtersPanelOpen && activeFiltersPortalEl && activeFilterCount > 0 && createPortal(renderSalesActiveFiltersTags(), activeFiltersPortalEl)}
      {view === VIEW.STATE && renderStateView()}
      {view === VIEW.CITY && renderCityView()}
      {view === VIEW.CUSTOMER && renderCustomerView()}
      {view === VIEW.INVOICE && renderInvoiceView()}

      {/* Non-Order Customer Drawer — portal, always mounted */}
      <Drawer
        closable={false}
        title={
          <div className="flex items-center justify-between gap-4 w-full py-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Icons.UserOutlined style={{ color: PRIMARY }} />
              <span className="font-bold text-gray-900 truncate">Customer With No Invoices — {nonOrderDrawerCity ? `${nonOrderDrawerState} / ${nonOrderDrawerCity}` : nonOrderDrawerState}</span>
            </div>
            <Button size="small" icon={<Icons.CloseOutlined />} onClick={() => setNonOrderDrawerOpen(false)} className="flex items-center justify-center hover:bg-gray-100 transition-colors" />
          </div>
        }
        placement="right"
        width={600}
        open={nonOrderDrawerOpen}
        onClose={() => setNonOrderDrawerOpen(false)}
        bodyStyle={{ padding: 0 }}
      >
        {nonOrderCustomerListLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                <div className="ds-shimmer w-9 h-9 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2 min-w-0">
                  <div className="ds-shimmer h-3.5 w-40 max-w-full" />
                  <div className="ds-shimmer h-3 w-28 max-w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (nonOrderCustomerList || []).length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <Icons.UserOutlined className="text-3xl mb-2" />
            <span className="text-sm">No customers found</span>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">{(nonOrderCustomerList || []).length} customers with no orders</p>
            {(nonOrderCustomerList || []).map((c, idx) => {
              const initials = (c.name || '')
                .split(' ')
                .slice(0, 2)
                .map(w => w[0])
                .join('')
                .toUpperCase();
              return (
                <button
                  type="button"
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition-colors cursor-pointer w-full text-left"
                  onClick={() => navigate(`/customer-master/${c.customerId}`)}
                >
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: PRIMARY }}>
                    {initials || <Icons.UserOutlined className="text-sm" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold hover:underline transition-colors truncate" style={{ color: PRIMARY }}>
                      {c.name || '—'}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      {c.city && (
                        <span className="text-xs text-gray-500 flex items-center gap-0.5">
                          <Icons.EnvironmentOutlined className="text-[10px]" />
                          {c.city}
                        </span>
                      )}
                      {c.phone && <span className="text-xs text-gray-400">{c.phone}</span>}
                    </div>
                  </div>
                  <Icons.RightOutlined className="text-gray-300 text-xs flex-shrink-0" />
                </button>
              );
            })}
          </div>
        )}
      </Drawer>

      {/* Item-wise performance breakdown drawer — opened from item-wise table row */}
      <ItemPerformanceBreakdownDrawer open={itemBreakdownDrawerOpen} onClose={() => setItemBreakdownDrawerOpen(false)} item={itemBreakdownDrawerItem} buildPayload={buildPayload} />

      {/* Customer-wise performance breakdown drawer — opened from customer-wise table row */}
      <CustomerPerformanceBreakdownDrawer
        open={customerBreakdownDrawerOpen}
        onClose={() => setCustomerBreakdownDrawerOpen(false)}
        customer={customerBreakdownDrawerCustomer}
        buildPayload={buildPayload}
      />

      {/* State-wise performance breakdown drawer — opened from the State name */}
      <StatePerformanceBreakdownDrawer open={stateBreakdownDrawerOpen} onClose={() => setStateBreakdownDrawerOpen(false)} state={stateBreakdownDrawerState} buildPayload={buildPayload} />
    </div>
  );
});

export default SalesAnalyticsDashboard;
