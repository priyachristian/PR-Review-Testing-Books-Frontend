import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';

// Components
import ProductionDashboard from '../components/ProductionDashboard';
import SalesAnalyticsDashboard from '../components/SalesAnalyticsDashboard';
import CreditLimitDashboard from '../components/CreditLimitDashboard';
import UserWiseTrackingDashboard from '../components/UserWiseTrackingDashboard';
import { GettingStarted, useOnboarding } from '@/features/onboarding';
import { Badge, Button, Tag, Tooltip } from '@/components/AntDComponent';
import CustomDatePicker from '@/components/forms/formDatePicker/CustomDatePicker';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import FilterInput from '@/components/forms/formInput/FilterInput';

// Hooks
import useModulePermissions from '@/hooks/useModulePermissions';
import { useAuth } from '@/hooks/useAuth';

// Extras
import { useDashboard } from '@/features/dashboard';
import { FILTERS_KEYS, RESOURCES } from '@/utils/jsonFile';
import { resetBranch } from '@/features/allMaster/warehouse/warehouse.slice';
import Icons from '@/assets/icons/icon';
import { clearAllFiltersFromLocalStorage, getAllFiltersFromLocalStorage, getLockedFiltersState, saveAllFiltersToLocalStorage, saveLockedFiltersState } from '@/utils/filters';
import { filterInputEnum } from '@/utils/constants';
import { formatAmount, formatAmountShort } from '@/utils/currency';
import { dateFormateForUi } from '@/utils/services';
import { colorPalette } from '@/utils/theme';
import { ADMIN_ROUTE_PATHS } from '@/routes/adminRoutePaths';
import { FEATURE_MODULE_MAP, flattenPermissionModuleTree, getIsInPlanForRoutePath } from '@/utils/routePermissions';
import { buildDivisionSelectOptions, buildBranchSelectOptions, divisionSelectColumnHeader, branchSelectColumnHeader } from '@/utils/tableSelectDropdown/orgSelectDropdown';

const DASHBOARD_TAB_ENUM = {
  GENERAL: 'general',
  SALES_ANALYTICS: 'salesAnalytics',
  CREDIT_LIMIT_ANALYTICS: 'creditLimitAnalytics',
  USER_WISE_TRACKING: 'userWiseTracking',
  GETTING_STARTED: 'gettingStarted',
  PRODUCTION_PIPELINE: 'productionPipeline',
};

const DASHBOARD_TABS = [
  { id: DASHBOARD_TAB_ENUM.GENERAL, label: 'General Dashboard' },
  { id: DASHBOARD_TAB_ENUM.SALES_ANALYTICS, label: 'Sales Dashboard' },
  { id: DASHBOARD_TAB_ENUM.CREDIT_LIMIT_ANALYTICS, label: 'Credit Limit Dashboard' },
  { id: DASHBOARD_TAB_ENUM.USER_WISE_TRACKING, label: 'Individual Work Tracking' },
  { id: DASHBOARD_TAB_ENUM.PRODUCTION_PIPELINE, label: 'Production Pipeline' },
  { id: DASHBOARD_TAB_ENUM.GETTING_STARTED, label: 'Getting Started' },
];

const TAB_ENUM = {
  SALES: 'sales',
  PAYMENT_RECEIVED: 'paymentReceived',
  PURCHASE: 'purchase',
  PAYMENT_MADE: 'paymentMade',
  EXPENSES: 'expenses',
};

/** URL query keys — separate from legacy `tab` which mixed dashboard + Top Records. */
const DASHBOARD_QUERY_KEY = 'dashboard';
const RECORD_QUERY_KEY = 'record';

const TOP_RECORD_TAB_IDS = [TAB_ENUM.SALES, TAB_ENUM.PAYMENT_RECEIVED, TAB_ENUM.PURCHASE, TAB_ENUM.PAYMENT_MADE, TAB_ENUM.EXPENSES];

const TOP_RECORD_TABS = [
  { id: TAB_ENUM.SALES, label: 'Top 5 Sales' },
  { id: TAB_ENUM.PAYMENT_RECEIVED, label: 'Top 5 Payment Received' },
  { id: TAB_ENUM.PURCHASE, label: 'Top 5 Purchase' },
  { id: TAB_ENUM.PAYMENT_MADE, label: 'Top 5 Payment Made' },
  { id: TAB_ENUM.EXPENSES, label: 'Top 5 Expenses' },
];

/**
 * The six documents users create from scratch, daily — three money-in, three money-out.
 * Deliberately excludes: recurring docs (configured once, then automatic), credit/debit
 * notes and GRPO/delivery challans (created from their parent document, in context),
 * and customer/vendor masters (created once per relationship, usually inline).
 */
const QUICK_ACTIONS = [
  { id: 'create-invoice', label: 'Invoice', path: ADMIN_ROUTE_PATHS.invoices.new, icon: Icons.FileTextFilled, moduleKey: RESOURCES.INVOICES },
  { id: 'create-payment-received', label: 'Payment Received', path: ADMIN_ROUTE_PATHS.paymentsReceived.new, icon: Icons.DollarCircleFilled, moduleKey: RESOURCES.PAYMENT_RECEIVED },
  { id: 'create-quote', label: 'Quote', path: ADMIN_ROUTE_PATHS.quotes.new, icon: Icons.SnippetsFilled, moduleKey: RESOURCES.QUOTES },
  { id: 'create-bill', label: 'Bill', path: ADMIN_ROUTE_PATHS.bills.new, icon: Icons.ReconciliationFilled, moduleKey: RESOURCES.BILLS },
  { id: 'create-payment-made', label: 'Payment Made', path: ADMIN_ROUTE_PATHS.paymentsMade.new, icon: Icons.WalletFilled, moduleKey: RESOURCES.PAYMENT_MADE },
  { id: 'add-expense', label: 'Expense', path: ADMIN_ROUTE_PATHS.expenses.new, icon: Icons.CreditCardFilled, moduleKey: RESOURCES.EXPENSES },
];

const QuickActionButton = ({ action, onClick }) => {
  const Icon = action.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center gap-3 px-3.5 py-3 rounded-lg border border-gray-200 bg-white cursor-pointer transition-all hover:border-[var(--qa-border)] hover:bg-[var(--qa-bg)] hover:shadow-sm focus-visible:border-[var(--qa-border)] focus-visible:bg-[var(--qa-bg)] focus-visible:outline-none"
      style={{
        '--qa-border': colorPalette.primary[300],
        '--qa-bg': colorPalette.primary[50],
      }}
    >
      <span
        className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 transition-colors group-hover:bg-white"
        style={{
          backgroundColor: colorPalette.primary[50],
          color: colorPalette.primary[500],
        }}
      >
        <Icon className="text-base" />
      </span>
      <span className="text-sm font-medium text-gray-700 text-left leading-tight group-hover:text-gray-900">{action.label}</span>
    </button>
  );
};

/**
 * Which main dashboard is shown: General vs Sales Analytics.
 * Legacy: `tab=general` | `tab=sales` (sales meant Sales Analytics, not Top 5 Sales).
 */
function parseDashboardTabFromSearchParams(sp) {
  const d = sp.get(DASHBOARD_QUERY_KEY);
  if (d === 'sales') return DASHBOARD_TAB_ENUM.SALES_ANALYTICS;
  if (d === 'credit-limit') return DASHBOARD_TAB_ENUM.CREDIT_LIMIT_ANALYTICS;
  if (d === 'user-wise') return DASHBOARD_TAB_ENUM.USER_WISE_TRACKING;
  if (d === 'getting-started') return DASHBOARD_TAB_ENUM.GETTING_STARTED;
  if (d === 'production-pipeline') return DASHBOARD_TAB_ENUM.PRODUCTION_PIPELINE;
  if (d === 'general') return DASHBOARD_TAB_ENUM.GENERAL;

  const legacyTab = sp.get('tab');
  if (legacyTab === 'general') return DASHBOARD_TAB_ENUM.GENERAL;
  if (legacyTab === 'sales') return DASHBOARD_TAB_ENUM.SALES_ANALYTICS;
  if (legacyTab && TOP_RECORD_TAB_IDS.includes(legacyTab) && legacyTab !== TAB_ENUM.SALES) {
    return DASHBOARD_TAB_ENUM.GENERAL;
  }

  return DASHBOARD_TAB_ENUM.GENERAL;
}

function parseTopRecordTabFromSearchParams(sp) {
  const rec = sp.get(RECORD_QUERY_KEY);
  const byRecordKey = rec ? TOP_RECORD_TABS.find(t => t.id === rec) : null;
  if (byRecordKey) return byRecordKey;

  const legacyTab = sp.get('tab');
  if (legacyTab && TOP_RECORD_TABS.find(t => t.id === legacyTab)) {
    const dash = sp.get(DASHBOARD_QUERY_KEY);
    if (legacyTab === TAB_ENUM.SALES && dash === 'general') {
      return TOP_RECORD_TABS.find(t => t.id === TAB_ENUM.SALES);
    }
    if (legacyTab !== 'general' && legacyTab !== 'sales') {
      return TOP_RECORD_TABS.find(t => t.id === legacyTab);
    }
  }

  return TOP_RECORD_TABS[0];
}

function multiSelectToCommaString(value) {
  if (!value || value.length === 0) return '';
  return Array.isArray(value) ? value.join(',') : String(value);
}

function multiSelectToApiParam(value) {
  const s = multiSelectToCommaString(value);
  return s.length > 0 ? s : undefined;
}

function cleanSavedFilterEntries(obj) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== '' && v !== null && v !== undefined));
}

const FILTER_KEY = FILTERS_KEYS.DASHBOARD_ALL_FILTERS;
const SALES_FILTER_KEY = FILTERS_KEYS.SALES_ANALYTICS_DASHBOARD_FILTERS;
const USER_WISE_FILTER_KEY = FILTERS_KEYS.USER_WISE_TRACKING_DASHBOARD_FILTERS;
const PRODUCTION_PIPELINE_FILTER_KEY = FILTERS_KEYS.PRODUCTION_PIPELINE_DASHBOARD_FILTERS;

const AnalyticsCard = ({ data }) => {
  return (
    <div className="bg-white border-r border-b border-gray-200 p-3 sm:p-4 h-full">
      <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 mb-2">
        <div
          className="p-2 sm:p-2.5 flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: 'rgba(23, 133, 182, 0.08)',
            color: colorPalette.primary[500],
          }}
        >
          {data?.icon}
        </div>
        {data?.trend && (
          <div className={`text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full self-start xs:self-auto ${data?.trend > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {data?.trend > 0 ? '↑' : '↓'} {Math.abs(data?.trend)}%
          </div>
        )}
      </div>

      <div className="space-y-0.5">
        <p className="text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide line-clamp-1">{data?.title}</p>
        <Tooltip title={formatAmount(data?.value)} placement="top">
          <p className="text-lg sm:text-lg font-bold text-gray-900 leading-tight break-words cursor-default">{formatAmountShort(data?.value)}</p>
        </Tooltip>
      </div>
    </div>
  );
};

const AnalyticsCardSkeleton = () => {
  return (
    <div className="bg-white border-r border-b border-gray-200 p-3 sm:p-4 h-full">
      <div className="flex items-center gap-3 mb-2">
        <div className="ds-shimmer h-10 w-10 rounded-md flex-shrink-0" />
      </div>
      <div className="space-y-2">
        <div className="ds-shimmer h-3 w-20" />
        <div className="ds-shimmer h-7 w-24" />
      </div>
    </div>
  );
};

const ViewDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const { isViewOnly } = useAuth();
  const accessRoles = useSelector(state => state.user?.accessRoles);
  const permissionModules = useSelector(state => state.module?.permissionModules);

  const flatPermissionModulePaths = useMemo(() => flattenPermissionModuleTree(permissionModules), [permissionModules]);

  // Mirrors the route guards in App.js: every quick action is a "create" action,
  // so it must clear the module's create permission, the plan, and view-only mode.
  const quickActions = useMemo(() => {
    if (isViewOnly) return [];

    return QUICK_ACTIONS.filter(action => {
      if (!accessRoles?.permissions?.[action.moduleKey]?.create) return false;
      const featureKey = FEATURE_MODULE_MAP[action.moduleKey];
      const routePlan = getIsInPlanForRoutePath(action.path, flatPermissionModulePaths);
      return !(featureKey && routePlan === false);
    });
  }, [isViewOnly, accessRoles, flatPermissionModulePaths]);

  const [activeDashboardTab, setActiveDashboardTab] = useState(() => parseDashboardTabFromSearchParams(searchParams));
  const prevTabRef = useRef(null);
  const isApicalledRefFilter = useRef({
    divisionDropdown: false,
  });
  const isApiCalledRef = useRef(false);
  const [filtersInitialized, setFiltersInitialized] = useState(false);

  // Date filter state - separate applied from current
  const [selectedPreset, setSelectedPreset] = useState('custom');
  const [dateRange, setDateRange] = useState(null);
  const [appliedDateRange, setAppliedDateRange] = useState(null);

  const [isLocked, setIsLocked] = useState(getLockedFiltersState(FILTER_KEY));
  const [salesFiltersLocked, setSalesFiltersLocked] = useState(() => getLockedFiltersState(SALES_FILTER_KEY));
  const [userWiseFiltersLocked, setUserWiseFiltersLocked] = useState(() => getLockedFiltersState(USER_WISE_FILTER_KEY));
  const [productionPipelineFiltersLocked, setProductionPipelineFiltersLocked] = useState(() => getLockedFiltersState(PRODUCTION_PIPELINE_FILTER_KEY));

  const productionDashboardRef = useRef(null);

  // Division and Branch filter state - separate applied filters from current filter state
  const [appliedFilters, setAppliedFilters] = useState({
    division: searchParams.get('division') ? searchParams.get('division').split(',') : [],
    branch: searchParams.get('branch') ? searchParams.get('branch').split(',') : [],
  });
  const [filter, setFilter] = useState({
    division: searchParams.get('division') ? searchParams.get('division').split(',') : [],
    branch: searchParams.get('branch') ? searchParams.get('branch').split(',') : [],
  });
  const [filtersPanelOpen, setFiltersPanelOpen] = useState(false);

  const generalAppliedFilterBadgeCount = useMemo(
    () => (appliedFilters.division?.length > 0 ? 1 : 0) + (appliedFilters.branch?.length > 0 ? 1 : 0) + (appliedDateRange ? 1 : 0),
    [appliedFilters.division, appliedFilters.branch, appliedDateRange]
  );

  const salesAppliedFilterBadgeCount = useMemo(() => {
    let n = 0;
    if (searchParams.get('division')) n++;
    if (searchParams.get('branch')) n++;
    if (searchParams.get('userId')) n++;
    if (searchParams.get('startDate') && searchParams.get('endDate')) n++;
    return n;
  }, [searchParams]);

  const userWiseAppliedFilterBadgeCount = useMemo(() => {
    let n = 0;
    if (searchParams.get('division')) n++;
    if (searchParams.get('branch')) n++;
    if (searchParams.get('startDate') && searchParams.get('endDate')) n++;
    return n;
  }, [searchParams]);

  const productionPipelineAppliedFilterBadgeCount = useMemo(() => {
    let n = 0;
    if (searchParams.get('division')) n++;
    if (searchParams.get('branch')) n++;
    if (searchParams.get('startDate') && searchParams.get('endDate')) n++;
    return n;
  }, [searchParams]);

  const headerFilterBadgeCount =
    activeDashboardTab === DASHBOARD_TAB_ENUM.GENERAL
      ? generalAppliedFilterBadgeCount
      : activeDashboardTab === DASHBOARD_TAB_ENUM.SALES_ANALYTICS
        ? salesAppliedFilterBadgeCount
        : activeDashboardTab === DASHBOARD_TAB_ENUM.USER_WISE_TRACKING
          ? userWiseAppliedFilterBadgeCount
          : activeDashboardTab === DASHBOARD_TAB_ENUM.PRODUCTION_PIPELINE
            ? productionPipelineAppliedFilterBadgeCount
            : 0;

  // Get formatted dates for API calls
  const getDateRangeForApi = () => {
    const rangeToUse = appliedDateRange || dateRange;
    if (!rangeToUse || !rangeToUse[0] || !rangeToUse[1]) return { startDate: null, endDate: null };
    return {
      startDate: dayjs(rangeToUse[0]).format('YYYY-MM-DD'),
      endDate: dayjs(rangeToUse[1]).format('YYYY-MM-DD'),
    };
  };

  const [activeTab, setActiveTab] = useState(() => parseTopRecordTabFromSearchParams(searchParams));

  // Sync Top Records selection into URL when user changes subtabs (do not depend on `searchParams` — avoids fighting browser back/forward)
  useEffect(() => {
    if (activeDashboardTab !== DASHBOARD_TAB_ENUM.GENERAL) return;

    setSearchParams(
      prev => {
        const p = new URLSearchParams(prev);
        if (p.get(RECORD_QUERY_KEY) === activeTab.id && p.get(DASHBOARD_QUERY_KEY) === 'general') {
          return p;
        }
        p.set(DASHBOARD_QUERY_KEY, 'general');
        p.set(RECORD_QUERY_KEY, activeTab.id);
        const legacy = p.get('tab');
        if (legacy && (legacy === 'general' || legacy === 'sales' || TOP_RECORD_TAB_IDS.includes(legacy))) {
          p.delete('tab');
        }
        return p;
      },
      { replace: true }
    );
  }, [activeTab.id, activeDashboardTab, setSearchParams]);

  // Browser back/forward: sync main dashboard tab from URL
  useEffect(() => {
    const next = parseDashboardTabFromSearchParams(searchParams);
    setActiveDashboardTab(prev => (prev !== next ? next : prev));
  }, [searchParams]);

  // Browser back/forward: sync Top Records tab when on General
  useEffect(() => {
    if (parseDashboardTabFromSearchParams(searchParams) !== DASHBOARD_TAB_ENUM.GENERAL) return;
    const next = parseTopRecordTabFromSearchParams(searchParams);
    setActiveTab(prev => (prev.id !== next.id ? next : prev));
  }, [searchParams]);

  const { isSplitSessionActive, divDrop, divisionLoading, getDivDropDown, branchDrop, branchLoading, getBranchDropDown } = useModulePermissions(RESOURCES.HOME);
  const {
    dashboardSummary,
    loading,
    summaryLoading,
    top5Record,
    getDashboardSummary,
    resetDashboardSummary,
    getTop5SalesOrder,
    getTop5PurchaseOrder,
    getTop5PaymentReceived,
    getTop5PaymentMade,
    getTop5Expense,
    resetTop5Record,
  } = useDashboard();

  const { status: onboardingStatus, getOnboardingStatus } = useOnboarding();
  useEffect(() => {
    const controller = new AbortController();
    getOnboardingStatus({ signal: controller.signal });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const onboardingRemaining = onboardingStatus ? Math.max(0, (onboardingStatus.total || 0) - (onboardingStatus.completedCount || 0)) : 0;

  const analyticsData = [
    {
      title: 'Total Sales',
      icon: <Icons.ShoppingOutlined className="text-xl" />,
      value: dashboardSummary?.totalOfSalesOrders || 0,
    },
    {
      title: 'Total Collection',
      icon: <Icons.DollarOutlined className="text-xl" />,
      value: dashboardSummary?.totalPaymentReceived || 0,
    },
    {
      title: 'Customer Outstanding',
      icon: <Icons.UserOutlined className="text-xl" />,
      value: dashboardSummary?.totalCustomerOutstanding || 0,
    },
    {
      title: 'Due Amount',
      icon: <Icons.WalletOutlined className="text-xl" />,
      value: dashboardSummary?.totalCustomerDue || 0,
    },
    {
      title: 'Total Expense',
      icon: <Icons.MinusCircleOutlined className="text-xl" />,
      value: dashboardSummary?.totalOfExpenses || 0,
    },
    {
      title: 'Total Purchase',
      icon: <Icons.ShoppingOutlined className="text-xl" />,
      value: dashboardSummary?.totalOfPurchaseOrders || 0,
    },
    {
      title: 'Total Payments',
      icon: <Icons.CreditCardOutlined className="text-xl" />,
      value: dashboardSummary?.totalPaymentMade || 0,
    },
    {
      title: 'Vendor Outstanding',
      icon: <Icons.TeamOutlined className="text-xl" />,
      value: dashboardSummary?.totalVendorOutstanding || 0,
    },
    {
      title: 'Vendor Due',
      icon: <Icons.FileTextOutlined className="text-xl" />,
      value: dashboardSummary?.totalVendorDue || 0,
    },
    {
      title: 'Total Bank Balance',
      icon: <Icons.BankOutlined className="text-xl" />,
      value: dashboardSummary?.totalAvailableBalance || 0,
    },
  ];

  const getTopRecords = async () => {
    const { startDate, endDate } = getDateRangeForApi();
    const basePayload = {
      startDate,
      endDate,
      division: multiSelectToApiParam(appliedFilters.division),
      branch: multiSelectToApiParam(appliedFilters.branch),
    };

    if (activeTab?.id === TAB_ENUM?.SALES) {
      getTop5SalesOrder(basePayload);
    } else if (activeTab?.id === TAB_ENUM?.PAYMENT_RECEIVED) {
      getTop5PaymentReceived({ ...basePayload, isSplit: isSplitSessionActive });
    } else if (activeTab?.id === TAB_ENUM?.PURCHASE) {
      getTop5PurchaseOrder(basePayload);
    } else if (activeTab?.id === TAB_ENUM?.PAYMENT_MADE) {
      getTop5PaymentMade({ ...basePayload, isSplit: isSplitSessionActive });
    } else if (activeTab?.id === TAB_ENUM?.EXPENSES) {
      getTop5Expense(basePayload);
    }
  };

  useEffect(() => {
    if (!filtersInitialized) return;
    if (activeDashboardTab !== DASHBOARD_TAB_ENUM.GENERAL) return;

    const { startDate, endDate } = getDateRangeForApi();
    getDashboardSummary({
      isSplit: isSplitSessionActive,
      startDate,
      endDate,
      division: multiSelectToApiParam(appliedFilters.division),
      branch: multiSelectToApiParam(appliedFilters.branch),
    });

    return () => {
      resetDashboardSummary();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersInitialized, isSplitSessionActive, appliedDateRange, appliedFilters.division, appliedFilters.branch, activeDashboardTab]);

  useEffect(() => {
    if (!filtersInitialized) return;
    if (activeDashboardTab !== DASHBOARD_TAB_ENUM.GENERAL) return;

    // Only call API if tab actually changed or isSplitSessionActive changed or date/division/branch changed
    const currentTabId = activeTab?.id;
    const prevTabId = prevTabRef.current?.id;
    const currentSplit = isSplitSessionActive;
    const prevSplit = prevTabRef.current?.isSplit;
    const currentDateRange = JSON.stringify(dateRange);
    const prevDateRange = prevTabRef.current?.dateRange;
    const currentDivision = JSON.stringify(appliedFilters.division);
    const prevDivision = prevTabRef.current?.division;
    const currentBranch = JSON.stringify(appliedFilters.branch);
    const prevBranch = prevTabRef.current?.branch;

    // On initial load (prevTabRef is null) or when tab/split/date/division/branch changes, fetch data
    if (
      prevTabRef.current === null ||
      prevTabId !== currentTabId ||
      prevSplit !== currentSplit ||
      prevDateRange !== currentDateRange ||
      prevDivision !== currentDivision ||
      prevBranch !== currentBranch
    ) {
      getTopRecords();
      prevTabRef.current = {
        id: currentTabId,
        isSplit: currentSplit,
        dateRange: currentDateRange,
        division: currentDivision,
        branch: currentBranch,
      };
    }

    return () => {
      resetTop5Record();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersInitialized, activeTab?.id, isSplitSessionActive, appliedDateRange, appliedFilters.division, appliedFilters.branch, activeDashboardTab]);

  // Handle division dropdown API call on focus
  const handleOnFocusApiCall = async type => {
    let obj = { ...isApicalledRefFilter.current };

    if (type === 'divisionDropdown') {
      await getDivDropDown({});
      obj.divisionDropdown = true;
    }

    isApicalledRefFilter.current = obj;
  };

  useEffect(() => {
    const savedFilters = getAllFiltersFromLocalStorage(FILTER_KEY);

    if (!isApiCalledRef.current) {
      if (savedFilters && Object.keys(savedFilters).length > 0) {
        if (savedFilters.preset) {
          setSelectedPreset(savedFilters.preset);
        }
        if (savedFilters.startDate && savedFilters.endDate) {
          setDateRange([savedFilters.startDate, savedFilters.endDate]);
          setAppliedDateRange([savedFilters.startDate, savedFilters.endDate]);
        }

        const newDivision = savedFilters.division ? savedFilters.division.split(',') : [];
        const newBranch = savedFilters.branch ? savedFilters.branch.split(',') : [];

        setFilter(prev => ({
          ...prev,
          division: newDivision,
          branch: newBranch,
        }));

        setAppliedFilters({
          division: newDivision,
          branch: newBranch,
        });

        if (newDivision && newDivision.length > 0) {
          handleOnFocusApiCall('divisionDropdown');
        }
      }
      isApiCalledRef.current = true;
    }
    setFiltersInitialized(true);
  }, []);

  // Load division dropdown if division is in URL params
  useEffect(() => {
    if (searchParams.get('division')) {
      handleOnFocusApiCall('divisionDropdown');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle branch dropdown based on division selection
  useEffect(() => {
    const controller = new AbortController();

    if (!filter.division || filter.division.length <= 0) {
      dispatch(resetBranch());
    }

    if (filter.division && filter.division.length > 0) {
      const payload = { divisionId: filter.division, signal: controller.signal };
      getBranchDropDown(payload);
    }
    return () => controller.abort();
  }, [filter.division, dispatch, getBranchDropDown]);

  const saveGeneralFiltersToStorage = () => {
    const filtersToSave = {
      division: multiSelectToCommaString(filter.division),
      branch: multiSelectToCommaString(filter.branch),
      preset: selectedPreset,
      startDate: dateRange?.[0] ? dayjs(dateRange[0]).format('YYYY-MM-DD') : null,
      endDate: dateRange?.[1] ? dayjs(dateRange[1]).format('YYYY-MM-DD') : null,
    };
    saveAllFiltersToLocalStorage(cleanSavedFilterEntries(filtersToSave), FILTER_KEY);
  };

  const handleApplyFilters = () => {
    setAppliedFilters({
      division: filter.division,
      branch: filter.branch,
    });
    setAppliedDateRange(dateRange);

    if (isLocked) {
      saveGeneralFiltersToStorage();
    }
  };

  const handleLockToggle = () => {
    const nextLocked = !isLocked;
    setIsLocked(nextLocked);
    saveLockedFiltersState(nextLocked, FILTER_KEY);

    if (nextLocked) {
      saveGeneralFiltersToStorage();
    } else {
      clearAllFiltersFromLocalStorage(FILTER_KEY);
    }
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setFilter({
      division: [],
      branch: [],
    });
    setAppliedFilters({
      division: [],
      branch: [],
    });
    setDateRange(null);
    setAppliedDateRange(null);
    setSelectedPreset('custom');
  };

  const getTableColumnsDetail = () => {
    let orderNoTitle = 'Invoice#';
    let orderNoKey = 'invoiceId';
    let customerNameTitle = 'Customer Name';
    let customerNameKey = 'customerName';
    let dateTitle = 'Date';
    let dateKey = 'invoiceDate';
    let totalTitle = 'Total Amount';
    let totalKey = 'total';

    if (TAB_ENUM?.PAYMENT_RECEIVED === activeTab?.id) {
      orderNoTitle = 'Payment Received#';
      orderNoKey = 'paymentReceivedId';
      dateKey = 'paymentDate';
      totalKey = 'amountReceived';
    } else if (TAB_ENUM?.PURCHASE === activeTab?.id) {
      orderNoTitle = 'Bill#';
      orderNoKey = 'billId';
      customerNameTitle = 'Vendor Name';
      customerNameKey = 'vendorName';
      dateKey = 'billDate';
      totalKey = 'total';
    } else if (TAB_ENUM?.PAYMENT_MADE === activeTab?.id) {
      orderNoTitle = 'Payment Made#';
      orderNoKey = 'paymentMadeId';
      customerNameTitle = 'Vendor Name';
      customerNameKey = 'vendorName';
      dateKey = 'paymentDate';
      totalKey = 'paymentMade';
    } else if (TAB_ENUM?.EXPENSES === activeTab?.id) {
      orderNoTitle = 'Expense#';
      orderNoKey = 'expenseId';
      customerNameTitle = 'Party Name';
      customerNameKey = 'vendorName';
      dateKey = 'date';
      totalKey = 'amount';
    }

    return {
      orderNoTitle,
      orderNoKey,
      customerNameTitle,
      customerNameKey,
      dateTitle,
      dateKey,
      totalTitle,
      totalKey,
    };
  };

  const tableColumns = getTableColumnsDetail();

  const columns = [
    {
      title: tableColumns?.orderNoTitle,
      dataIndex: tableColumns?.orderNoKey,
      key: tableColumns?.orderNoKey,
      render: value => <Tag className="font-semibold">{value}</Tag>,
    },
    {
      title: tableColumns?.customerNameTitle,
      dataIndex: tableColumns?.customerNameKey,
      key: tableColumns?.customerNameKey,
      render: value => value?.customerDisplayName || value?.customerName || value,
    },
    {
      title: tableColumns?.dateTitle,
      dataIndex: tableColumns?.dateKey,
      key: tableColumns?.dateKey,
      render: value => dateFormateForUi(value),
    },
    {
      title: tableColumns?.totalTitle,
      dataIndex: tableColumns?.totalKey,
      key: tableColumns?.totalKey,
      render: value => formatAmount(value),
    },
  ];

  const handleViewClick = record => {
    let baseUrl = 'invoices';

    if (TAB_ENUM?.PAYMENT_RECEIVED === activeTab?.id) {
      baseUrl = 'payments-received';
    } else if (TAB_ENUM?.PURCHASE === activeTab?.id) {
      baseUrl = 'bills';
    } else if (TAB_ENUM?.PAYMENT_MADE === activeTab?.id) {
      baseUrl = 'payments-made';
    } else if (TAB_ENUM?.EXPENSES === activeTab?.id) {
      baseUrl = 'expenses';
    }

    navigate(`/${baseUrl}/${record?.id || record?._id}`);
  };

  const handleCreditTabChange = key => {
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      p.set('tab', key);
      p.set('page', '1');
      p.set('aPage', '1');
      p.set('sortBy', 'utilizationPercent:desc');
      p.set('aSortBy', 'crossedSinceDays:desc');
      return p;
    });
  };

  const portalFiltersFlushWithTabs =
    (activeDashboardTab === DASHBOARD_TAB_ENUM.SALES_ANALYTICS || activeDashboardTab === DASHBOARD_TAB_ENUM.USER_WISE_TRACKING || activeDashboardTab === DASHBOARD_TAB_ENUM.PRODUCTION_PIPELINE) &&
    filtersPanelOpen;

  const portalFiltersSlotRef = useRef(null);
  const portalActiveFiltersSlotRef = useRef(null);
  const salesDashboardRef = useRef(null);
  const userWiseDashboardRef = useRef(null);
  const [portalFiltersPortalEl, setPortalFiltersPortalEl] = useState(null);
  const [portalActiveFiltersPortalEl, setPortalActiveFiltersPortalEl] = useState(null);

  const handleSalesLockToggle = () => {
    const next = !salesFiltersLocked;
    setSalesFiltersLocked(next);
    saveLockedFiltersState(next, SALES_FILTER_KEY);
    if (next) {
      salesDashboardRef.current?.saveFiltersForLock?.();
    } else {
      clearAllFiltersFromLocalStorage(SALES_FILTER_KEY);
    }
  };

  const handleUserWiseLockToggle = () => {
    const next = !userWiseFiltersLocked;
    setUserWiseFiltersLocked(next);
    saveLockedFiltersState(next, USER_WISE_FILTER_KEY);
    if (next) {
      userWiseDashboardRef.current?.saveFiltersForLock?.();
    } else {
      clearAllFiltersFromLocalStorage(USER_WISE_FILTER_KEY);
    }
  };

  const handleProductionPipelineLockToggle = () => {
    const next = !productionPipelineFiltersLocked;
    setProductionPipelineFiltersLocked(next);
    saveLockedFiltersState(next, PRODUCTION_PIPELINE_FILTER_KEY);
    if (next) {
      productionDashboardRef.current?.saveFiltersForLock?.();
    } else {
      clearAllFiltersFromLocalStorage(PRODUCTION_PIPELINE_FILTER_KEY);
    }
  };

  const generalHasActiveFilters = !!(appliedFilters?.division?.length > 0 || appliedFilters?.branch?.length > 0 || (appliedDateRange?.length > 0 && appliedDateRange[0] && appliedDateRange[1]));

  const portalActiveFiltersBarShow =
    (activeDashboardTab === DASHBOARD_TAB_ENUM.SALES_ANALYTICS || activeDashboardTab === DASHBOARD_TAB_ENUM.USER_WISE_TRACKING || activeDashboardTab === DASHBOARD_TAB_ENUM.PRODUCTION_PIPELINE) &&
    !filtersPanelOpen &&
    headerFilterBadgeCount > 0;

  useLayoutEffect(() => {
    if (portalFiltersFlushWithTabs) {
      setPortalFiltersPortalEl(portalFiltersSlotRef.current);
    } else {
      setPortalFiltersPortalEl(null);
    }
  }, [portalFiltersFlushWithTabs]);

  useLayoutEffect(() => {
    if (portalActiveFiltersBarShow) {
      setPortalActiveFiltersPortalEl(portalActiveFiltersSlotRef.current);
    } else {
      setPortalActiveFiltersPortalEl(null);
    }
  }, [portalActiveFiltersBarShow]);

  const renderGeneralActiveFiltersTags = () => (
    <div className="px-1 py-1.5 bg-gray-50/80 rounded-md border border-gray-100">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-gray-600 font-medium text-sm">Active filters:</span>

        {appliedFilters?.division?.length > 0 && (
          <Tag
            closable
            onClose={() => {
              setFilter(prev => ({ ...prev, division: [], branch: [] }));
              setAppliedFilters(prev => ({ ...prev, division: [], branch: [] }));
            }}
            className="px-3 py-1 bg-white"
          >
            <span className="font-medium capitalize">Division:</span>{' '}
            <span className="">
              {(Array.isArray(appliedFilters.division) ? appliedFilters.division : [appliedFilters.division])
                .map(id => divDrop?.find(d => d.id === id)?.name)
                .filter(Boolean)
                .join(', ')}
            </span>
          </Tag>
        )}

        {appliedFilters?.branch?.length > 0 && (
          <Tag
            closable
            onClose={() => {
              setFilter(prev => ({ ...prev, branch: [] }));
              setAppliedFilters(prev => ({ ...prev, branch: [] }));
            }}
            className="px-3 py-1 bg-white"
          >
            <span className="font-medium capitalize">Branch:</span>{' '}
            <span className="">
              {(Array.isArray(appliedFilters.branch) ? appliedFilters.branch : [appliedFilters.branch])
                .map(id => branchDrop?.find(d => d.id === id)?.name)
                .filter(Boolean)
                .join(', ')}
            </span>
          </Tag>
        )}

        {appliedDateRange?.length > 0 && appliedDateRange[0] && appliedDateRange[1] && (
          <Tag
            closable
            onClose={() => {
              setDateRange(null);
              setAppliedDateRange(null);
              setSelectedPreset('custom');
            }}
            className="px-3 py-1 bg-white"
          >
            <span className="font-medium capitalize">Date:</span>{' '}
            <span className="">
              {dayjs(appliedDateRange[0]).format('YYYY-MM-DD')} to {dayjs(appliedDateRange[1]).format('YYYY-MM-DD')}
            </span>
          </Tag>
        )}

        <Button style={{ color: colorPalette.primary[500] }} type="link" size="small" onClick={handleResetFilters}>
          Clear all
        </Button>
      </div>
    </div>
  );

  return (
    <div className="-m-4">
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-end justify-between px-4">
          {/* ── Dashboard tabs — underline style ── */}
          <div className="min-w-0 flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar flex items-end">
            <div className="flex items-center w-max">
              {DASHBOARD_TABS.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveDashboardTab(tab.id);
                    setSearchParams(
                      prev => {
                        const p = new URLSearchParams(prev);
                        if (tab.id === DASHBOARD_TAB_ENUM.GENERAL) {
                          p.set(DASHBOARD_QUERY_KEY, 'general');
                          p.set(RECORD_QUERY_KEY, activeTab.id);
                        } else if (tab.id === DASHBOARD_TAB_ENUM.SALES_ANALYTICS) {
                          p.set(DASHBOARD_QUERY_KEY, 'sales');
                          p.delete(RECORD_QUERY_KEY);
                          ['view', 'state', 'city', 'customerId', 'customerName'].forEach(k => p.delete(k));
                        } else if (tab.id === DASHBOARD_TAB_ENUM.CREDIT_LIMIT_ANALYTICS) {
                          p.set(DASHBOARD_QUERY_KEY, 'credit-limit');
                          p.delete(RECORD_QUERY_KEY);
                          ['view', 'state', 'city', 'customerId', 'customerName'].forEach(k => p.delete(k));
                        } else if (tab.id === DASHBOARD_TAB_ENUM.USER_WISE_TRACKING) {
                          p.set(DASHBOARD_QUERY_KEY, 'user-wise');
                          p.delete(RECORD_QUERY_KEY);
                          ['view', 'state', 'city', 'customerId', 'customerName'].forEach(k => p.delete(k));
                        } else if (tab.id === DASHBOARD_TAB_ENUM.PRODUCTION_PIPELINE) {
                          p.set(DASHBOARD_QUERY_KEY, 'production-pipeline');
                          p.delete(RECORD_QUERY_KEY);
                          ['view', 'state', 'city', 'customerId', 'customerName'].forEach(k => p.delete(k));
                        } else if (tab.id === DASHBOARD_TAB_ENUM.GETTING_STARTED) {
                          p.set(DASHBOARD_QUERY_KEY, 'getting-started');
                          p.delete(RECORD_QUERY_KEY);
                          ['view', 'state', 'city', 'customerId', 'customerName'].forEach(k => p.delete(k));
                        }
                        const legacy = p.get('tab');
                        if (legacy === 'general' || legacy === 'sales' || TOP_RECORD_TAB_IDS.includes(legacy)) {
                          p.delete('tab');
                        }
                        return p;
                      },
                      { replace: true }
                    );
                  }}
                  className={`px-4 py-2.5 text-sm font-medium -mb-px whitespace-nowrap transition-[color,box-shadow] duration-150 ${
                    activeDashboardTab === tab.id ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700 hover:shadow-[inset_0_-2px_0_0_#d1d5db]'
                  }`}
                  style={activeDashboardTab === tab.id ? { color: colorPalette.primary[500], boxShadow: `inset 0 -2px 0 0 ${colorPalette.primary[500]}` } : undefined}
                >
                  {tab.label}
                  {tab.id === DASHBOARD_TAB_ENUM.GETTING_STARTED && onboardingRemaining > 0 && <Badge count={onboardingRemaining} color={colorPalette.primary[500]} className="ml-2" />}
                </button>
              ))}
            </div>
          </div>

          {/* ── Right actions ── */}
          <div className="flex shrink-0 items-center gap-1.5 py-1.5">
            {activeDashboardTab === DASHBOARD_TAB_ENUM.CREDIT_LIMIT_ANALYTICS ? (
              <div className="inline-flex rounded-md border border-gray-200 bg-gray-50 p-0.5 gap-0.5">
                {[
                  { key: 'customer', label: 'Customers', icon: <Icons.UserOutlined /> },
                  { key: 'vendor', label: 'Vendors', icon: <Icons.BankOutlined /> },
                ].map(tab => {
                  const isActive = (searchParams.get('tab') || 'customer') === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => handleCreditTabChange(tab.key)}
                      className={`flex items-center gap-1 px-3 py-1 text-xs font-medium rounded transition-all duration-150 outline-none ${
                        isActive ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400 hover:text-gray-600'
                      }`}
                      style={isActive ? { color: colorPalette.primary[500] } : {}}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            ) : activeDashboardTab === DASHBOARD_TAB_ENUM.GETTING_STARTED ? null : (
              <>
                {(activeDashboardTab === DASHBOARD_TAB_ENUM.GENERAL ||
                  activeDashboardTab === DASHBOARD_TAB_ENUM.USER_WISE_TRACKING ||
                  activeDashboardTab === DASHBOARD_TAB_ENUM.SALES_ANALYTICS ||
                  activeDashboardTab === DASHBOARD_TAB_ENUM.PRODUCTION_PIPELINE) && (
                  <Tooltip
                    title={
                      (
                        activeDashboardTab === DASHBOARD_TAB_ENUM.GENERAL
                          ? isLocked
                          : activeDashboardTab === DASHBOARD_TAB_ENUM.SALES_ANALYTICS
                            ? salesFiltersLocked
                            : activeDashboardTab === DASHBOARD_TAB_ENUM.PRODUCTION_PIPELINE
                              ? productionPipelineFiltersLocked
                              : userWiseFiltersLocked
                      )
                        ? 'Unlock filters to clear saved preferences'
                        : 'Lock current filters to save preferences'
                    }
                    placement="top"
                  >
                    <span className="inline-flex items-center leading-none">
                      <Button
                        type={
                          (
                            activeDashboardTab === DASHBOARD_TAB_ENUM.GENERAL
                              ? isLocked
                              : activeDashboardTab === DASHBOARD_TAB_ENUM.SALES_ANALYTICS
                                ? salesFiltersLocked
                                : activeDashboardTab === DASHBOARD_TAB_ENUM.PRODUCTION_PIPELINE
                                  ? productionPipelineFiltersLocked
                                  : userWiseFiltersLocked
                          )
                            ? 'primary'
                            : 'default'
                        }
                        size="small"
                        icon={
                          (
                            activeDashboardTab === DASHBOARD_TAB_ENUM.GENERAL
                              ? isLocked
                              : activeDashboardTab === DASHBOARD_TAB_ENUM.SALES_ANALYTICS
                                ? salesFiltersLocked
                                : activeDashboardTab === DASHBOARD_TAB_ENUM.PRODUCTION_PIPELINE
                                  ? productionPipelineFiltersLocked
                                  : userWiseFiltersLocked
                          ) ? (
                            <Icons.UnlockOutlined />
                          ) : (
                            <Icons.LockOutlined />
                          )
                        }
                        onClick={
                          activeDashboardTab === DASHBOARD_TAB_ENUM.GENERAL
                            ? handleLockToggle
                            : activeDashboardTab === DASHBOARD_TAB_ENUM.SALES_ANALYTICS
                              ? handleSalesLockToggle
                              : activeDashboardTab === DASHBOARD_TAB_ENUM.PRODUCTION_PIPELINE
                                ? handleProductionPipelineLockToggle
                                : handleUserWiseLockToggle
                        }
                      >
                        {(
                          activeDashboardTab === DASHBOARD_TAB_ENUM.GENERAL
                            ? isLocked
                            : activeDashboardTab === DASHBOARD_TAB_ENUM.SALES_ANALYTICS
                              ? salesFiltersLocked
                              : activeDashboardTab === DASHBOARD_TAB_ENUM.PRODUCTION_PIPELINE
                                ? productionPipelineFiltersLocked
                                : userWiseFiltersLocked
                        )
                          ? 'Unlock'
                          : 'Lock'}
                      </Button>
                    </span>
                  </Tooltip>
                )}
                {filtersPanelOpen && (
                  <>
                    <Button
                      size="small"
                      onClick={() =>
                        activeDashboardTab === DASHBOARD_TAB_ENUM.GENERAL
                          ? handleResetFilters()
                          : activeDashboardTab === DASHBOARD_TAB_ENUM.SALES_ANALYTICS
                            ? salesDashboardRef.current?.resetFilters?.()
                            : activeDashboardTab === DASHBOARD_TAB_ENUM.PRODUCTION_PIPELINE
                              ? productionDashboardRef.current?.resetFilters?.()
                              : userWiseDashboardRef.current?.resetFilters?.()
                      }
                    >
                      Reset
                    </Button>
                    <Button
                      size="small"
                      type="primary"
                      icon={<Icons.FilterOutlined />}
                      onClick={() =>
                        activeDashboardTab === DASHBOARD_TAB_ENUM.GENERAL
                          ? handleApplyFilters()
                          : activeDashboardTab === DASHBOARD_TAB_ENUM.SALES_ANALYTICS
                            ? salesDashboardRef.current?.applyFilters?.()
                            : activeDashboardTab === DASHBOARD_TAB_ENUM.PRODUCTION_PIPELINE
                              ? productionDashboardRef.current?.applyFilters?.()
                              : userWiseDashboardRef.current?.applyFilters?.()
                      }
                    >
                      Apply
                    </Button>
                  </>
                )}
                <Button size="small" onClick={() => setFiltersPanelOpen(v => !v)} className="flex items-center gap-1.5">
                  {filtersPanelOpen ? 'Hide filters' : 'Filters'}
                  {headerFilterBadgeCount > 0 && <Badge count={headerFilterBadgeCount} color={colorPalette.primary[500]} />}
                </Button>
              </>
            )}
          </div>
        </div>

        {activeDashboardTab === DASHBOARD_TAB_ENUM.GENERAL && !filtersPanelOpen && generalHasActiveFilters && (
          <div className="px-4 pb-2 pt-2 border-t border-gray-100">{renderGeneralActiveFiltersTags()}</div>
        )}

        {portalFiltersFlushWithTabs && <div ref={portalFiltersSlotRef} className="px-4 pb-3 pt-2 border-t border-gray-100 space-y-3" />}

        {portalActiveFiltersBarShow && <div ref={portalActiveFiltersSlotRef} className="px-4 py-2 border-t border-gray-100" />}

        {filtersPanelOpen && activeDashboardTab === DASHBOARD_TAB_ENUM.GENERAL && (
          <div className="px-4 pb-3 pt-2 border-t border-gray-100 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="lg:col-span-2 space-y-2">
                <CustomDatePicker selectedPreset={selectedPreset} setSelectedPreset={setSelectedPreset} dateRange={dateRange} setDateRange={setDateRange} label="Date Range" />
              </div>
              <div className="space-y-2">
                <FilterInput
                  type={filterInputEnum?.SELECT}
                  mode="multiple"
                  name={'division'}
                  label={'Division'}
                  placeHolder={'Select Division'}
                  selectVariant="twoColumn"
                  columnSelectHeader={divisionSelectColumnHeader}
                  selectionOptions={buildDivisionSelectOptions(divDrop)}
                  value={filter.division}
                  setFilter={setFilter}
                  allowClear={true}
                  extraFilterValues={{ branch: [] }}
                  loading={divisionLoading}
                  onFocus={() => {
                    if (!isApicalledRefFilter.current.divisionDropdown) {
                      handleOnFocusApiCall('divisionDropdown');
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
                  selectionOptions={buildBranchSelectOptions(branchDrop)}
                  value={filter.branch}
                  setFilter={setFilter}
                  allowClear={true}
                  loading={branchLoading}
                  disabled={!filter.division || filter.division.length === 0}
                />
              </div>
            </div>

            {generalHasActiveFilters && renderGeneralActiveFiltersTags()}
          </div>
        )}
      </div>

      {activeDashboardTab === DASHBOARD_TAB_ENUM.SALES_ANALYTICS && (
        <SalesAnalyticsDashboard
          ref={salesDashboardRef}
          filtersPanelOpen={filtersPanelOpen}
          filtersPortalEl={portalFiltersPortalEl}
          activeFiltersPortalEl={portalActiveFiltersPortalEl}
          filtersLocked={salesFiltersLocked}
        />
      )}

      {activeDashboardTab === DASHBOARD_TAB_ENUM.CREDIT_LIMIT_ANALYTICS && <CreditLimitDashboard />}

      {activeDashboardTab === DASHBOARD_TAB_ENUM.USER_WISE_TRACKING && (
        <UserWiseTrackingDashboard
          ref={userWiseDashboardRef}
          filtersPanelOpen={filtersPanelOpen}
          filtersPortalEl={portalFiltersPortalEl}
          activeFiltersPortalEl={portalActiveFiltersPortalEl}
          filtersLocked={userWiseFiltersLocked}
        />
      )}

      {activeDashboardTab === DASHBOARD_TAB_ENUM.PRODUCTION_PIPELINE && (
        <ProductionDashboard
          ref={productionDashboardRef}
          filtersPanelOpen={filtersPanelOpen}
          filtersPortalEl={portalFiltersPortalEl}
          activeFiltersPortalEl={portalActiveFiltersPortalEl}
          filtersLocked={productionPipelineFiltersLocked}
        />
      )}

      {activeDashboardTab === DASHBOARD_TAB_ENUM.GETTING_STARTED && <GettingStarted />}

      {activeDashboardTab === DASHBOARD_TAB_ENUM.GENERAL && (
        <div>
          {/* Analytics Cards Section */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 border-l border-gray-200">
            {summaryLoading
              ? Array.from({ length: 10 }).map((_, index) => <AnalyticsCardSkeleton key={index} />)
              : analyticsData?.map((item, index) => {
                  return <AnalyticsCard key={index} data={item} />;
                })}
          </div>

          {/* Quick Actions Section */}
          {quickActions.length > 0 && (
            <div className="bg-white border-x border-b border-gray-200 p-4 sm:p-5">
              <div className="mb-3">
                <h2 className="text-lg font-bold text-gray-900 mb-0.5">Quick Actions</h2>
                <p className="text-sm text-gray-500">Create the records you use most, without leaving the dashboard</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
                {quickActions.map(action => (
                  <QuickActionButton key={action.id} action={action} onClick={() => navigate(`/${action.path}`)} />
                ))}
              </div>
            </div>
          )}

          {/* Top Records Section */}
          <div className="bg-white border-x border-b border-gray-200 p-4 sm:p-5">
            <div className="mb-3">
              <h2 className="text-lg font-bold text-gray-900 mb-0.5">Top Records</h2>
              <p className="text-sm text-gray-500">View your top performing records across different categories</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-1.5 bg-gray-50 p-1 border border-gray-200 mb-3 w-full overflow-x-auto">
              {TOP_RECORD_TABS.map(tab => {
                return (
                  <button
                    key={tab?.id}
                    className={`px-4 py-2 cursor-pointer rounded-lg font-medium text-sm whitespace-nowrap transition-all duration-200 ${
                      activeTab?.id === tab?.id ? 'text-white shadow-md' : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                    }`}
                    style={{
                      backgroundColor: activeTab?.id === tab?.id ? colorPalette.primary[500] : 'transparent',
                    }}
                    onClick={() => {
                      // Only update if clicking a different tab
                      if (activeTab?.id !== tab?.id) {
                        setActiveTab(tab);
                      }
                    }}
                  >
                    {tab?.label}
                  </button>
                );
              })}
            </div>

            {/* Table Section */}
            <div className="overflow-x-auto">
              <CustomTable columns={columns} loading={loading} data={top5Record} dynamicScrollY={false} onRowClick={handleViewClick} tableId="id" scroll={{ x: true }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewDashboard;
