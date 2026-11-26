import React, { useCallback, useEffect, useImperativeHandle, useMemo, useRef, forwardRef, useState } from 'react';
import { createPortal } from 'react-dom';
import dayjs from 'dayjs';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ADMIN_ROUTE_PATHS } from '@/routes/adminRoutePaths';
import { useDispatch } from 'react-redux';
import { Empty, Tag, Button } from '@/components/AntDComponent';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import { useDashboard } from '@/features/dashboard';
import { formatAmount } from '@/utils/currency';
import { colorPalette } from '@/utils/theme';
import CustomDatePicker from '@/components/forms/formDatePicker/CustomDatePicker';
import FilterInput from '@/components/forms/formInput/FilterInput';
import useModulePermissions from '@/hooks/useModulePermissions';
import { FILTERS_KEYS, RESOURCES } from '@/utils/jsonFile';
import { filterInputEnum } from '@/utils/constants';
import { resetBranch } from '@/features/allMaster/warehouse/warehouse.slice';
import { getAllFiltersFromLocalStorage, saveAllFiltersToLocalStorage } from '@/utils/filters';
import { buildDivisionSelectOptions, buildBranchSelectOptions, divisionSelectColumnHeader, branchSelectColumnHeader } from '@/utils/tableSelectDropdown/orgSelectDropdown';

const USER_WISE_FILTER_STORAGE_KEY = FILTERS_KEYS.USER_WISE_TRACKING_DASHBOARD_FILTERS;

const MetricCell = ({ count, total, isTotalRow, color }) => {
  if (!count && !total) return null;
  return (
    <div style={{ minWidth: 72 }}>
      <div className={`text-xs font-semibold ${color || 'text-gray-900'}`}>{formatAmount(total)}</div>
      {!isTotalRow && <div className="text-xs text-gray-400">{count} docs</div>}
    </div>
  );
};

const indexCol = {
  title: '#',
  key: 'index',
  fixed: 'left',
  width: 36,
  render: (_, r, index) => (r._isTotalRow ? null : <span className="text-gray-400 text-xs">{index + 1}</span>),
};

const memberCol = {
  title: 'Team Member',
  key: 'name',
  fixed: 'left',
  width: 160,
  render: (_, r) => (
    <div>
      <div className="text-xs font-semibold text-gray-900">{r.name}</div>
      {!r._isTotalRow && r.roleName && (
        <span className="inline-block text-xs font-medium px-1 py-px rounded mt-0.5" style={{ background: colorPalette.primary[50], color: colorPalette.primary[600] }}>
          {r.roleName}
        </span>
      )}
      {!r._isTotalRow && r.email && <div className="text-xs text-gray-400 mt-px truncate">{r.email}</div>}
    </div>
  ),
};

const mkCol = (title, dataKey, color, path, navigate, startDate, endDate) => ({
  title,
  key: dataKey,
  onCell: r => {
    const hasData = r[dataKey]?.count > 0 || r[dataKey]?.total > 0;
    if (r?._isTotalRow || !r.userId || !path || !navigate || !hasData) return {};
    const handleNav = () => {
      const params = new URLSearchParams({ addedBy: r.userId });
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      navigate(`/${path}?${params.toString()}`);
    };
    return {
      className: 'cursor-pointers',
      role: 'button',
      tabIndex: 0,
      onClick: handleNav,
      onKeyDown: e => {
        if (e.key === 'Enter' || e.key === ' ') handleNav();
      },
    };
  },
  render: (_, r) => <MetricCell count={r[dataKey]?.count || 0} total={r[dataKey]?.total || 0} isTotalRow={r._isTotalRow} color={color} />,
});

const conversionCol = {
  title: 'Conversion %',
  key: 'conversionRate',
  render: (_, r) => {
    const quoteCount = r.quotations?.count || 0;
    const invoiceCount = r.invoices?.count || 0;
    if (quoteCount === 0) return <span className="text-gray-400 text-sm">—</span>;
    const rate = Math.min(Math.round((invoiceCount / quoteCount) * 100), 100);
    const color = rate >= 70 ? '#16a34a' : rate >= 40 ? '#d97706' : '#dc2626';
    return (
      <div style={{ minWidth: 72 }}>
        <div className="text-xs font-semibold" style={{ color }}>
          {rate}%
        </div>
        <div className="text-xs text-gray-400">
          {invoiceCount} / {quoteCount}
        </div>
        <div style={{ marginTop: 3, height: 3, borderRadius: 2, background: '#e5e7eb', overflow: 'hidden' }}>
          <div style={{ width: `${rate}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.3s' }} />
        </div>
      </div>
    );
  },
};

const SectionTable = ({ title, accentColor, columns, data, loading }) => (
  <div>
    <div className="px-3 py-2 border-b border-gray-100" style={{ borderLeft: `4px solid ${accentColor}` }}>
      <span className="font-semibold text-sm" style={{ color: accentColor }}>
        {title}
      </span>
    </div>
    <CustomTable
      columns={[indexCol, memberCol, ...columns]}
      data={data}
      loading={loading}
      rowKey={r => r.userId?.toString?.() || r.name}
      pagination={false}
      isPaginationFixed={false}
      scroll={{ x: 'max-content' }}
      dynamicScrollY={false}
      size="small"
      rowClassName={r => (r._isTotalRow ? 'bg-gray-50 font-semibold' : '')}
    />
  </div>
);

const UserWiseTrackingDashboard = forwardRef(function UserWiseTrackingDashboard({ filtersPanelOpen = false, filtersPortalEl = null, activeFiltersPortalEl = null, filtersLocked = false }, ref) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useDispatch();

  const { userWiseSummary, userWiseSummaryLoading, getUserWiseSummary } = useDashboard();
  const { divDrop, divisionLoading, getDivDropDown, branchDrop, branchLoading, getBranchDropDown, isSplitSessionActive } = useModulePermissions(RESOURCES.HOME);

  // Helper: read initial value from URL or fallback
  const spStart = searchParams.get('startDate') || null;
  const spEnd = searchParams.get('endDate') || null;
  const spPreset = searchParams.get('preset');
  const spDivision = searchParams.get('division') || '';
  const spBranch = searchParams.get('branch') || '';

  const [dateRange, setDateRange] = useState(() => (spStart && spEnd ? [dayjs(spStart), dayjs(spEnd)] : [dayjs(), dayjs()]));
  const [appliedDateRange, setAppliedDateRange] = useState(() => (spStart && spEnd ? [dayjs(spStart), dayjs(spEnd)] : [dayjs(), dayjs()]));
  const [selectedPreset, setSelectedPreset] = useState(() => spPreset || (spStart && spEnd ? 'custom' : 'today'));

  const navStartDate = appliedDateRange?.[0] ? dayjs(appliedDateRange[0]).format('YYYY-MM-DD') : null;
  const navEndDate = appliedDateRange?.[1] ? dayjs(appliedDateRange[1]).format('YYYY-MM-DD') : null;

  const salesCols = useMemo(
    () => [
      mkCol('Quotation', 'quotations', undefined, ADMIN_ROUTE_PATHS.quotes.root, navigate, navStartDate, navEndDate),
      mkCol('Sales Order', 'salesOrders', undefined, ADMIN_ROUTE_PATHS.salesOrders.root, navigate, navStartDate, navEndDate),
      mkCol('Delivery Challan', 'deliveryChallans', undefined, ADMIN_ROUTE_PATHS.deliveryChallans.root, navigate, navStartDate, navEndDate),
      mkCol('Invoice', 'invoices', undefined, ADMIN_ROUTE_PATHS.invoices.root, navigate, navStartDate, navEndDate),
      mkCol('Payment Received', 'paymentsReceived', 'text-green-600', ADMIN_ROUTE_PATHS.paymentsReceived.root, navigate, navStartDate, navEndDate),
      mkCol('Credit Note', 'creditNotes', undefined, ADMIN_ROUTE_PATHS.creditNotes.root, navigate, navStartDate, navEndDate),
      conversionCol,
    ],
    [navigate, navStartDate, navEndDate]
  );

  const purchaseCols = useMemo(
    () => [
      mkCol('Purchase Order', 'purchaseOrders', undefined, ADMIN_ROUTE_PATHS.purchaseOrders.root, navigate, navStartDate, navEndDate),
      mkCol('GRPO', 'grpoOrders', undefined, ADMIN_ROUTE_PATHS.grpo.root, navigate, navStartDate, navEndDate),
      mkCol('Bill', 'bills', undefined, ADMIN_ROUTE_PATHS.bills.root, navigate, navStartDate, navEndDate),
      mkCol('Payment Made', 'paymentsMade', 'text-red-500', ADMIN_ROUTE_PATHS.paymentsMade.root, navigate, navStartDate, navEndDate),
      mkCol('Debit Note', 'debitNotes', undefined, ADMIN_ROUTE_PATHS.debitNotes.root, navigate, navStartDate, navEndDate),
    ],
    [navigate, navStartDate, navEndDate]
  );

  const [filter, setFilter] = useState({
    division: spDivision ? spDivision.split(',') : [],
    branch: spBranch ? spBranch.split(',') : [],
  });

  const [appliedFilters, setAppliedFilters] = useState({
    division: spDivision ? spDivision.split(',') : [],
    branch: spBranch ? spBranch.split(',') : [],
  });

  const isApiCalledRef = useRef({ divisionDropdown: false });
  const lockedFiltersHydratedRef = useRef(false);
  const [isHydrated, setIsHydrated] = useState(!filtersLocked);

  const appliedStartDateStr = appliedDateRange?.[0] ? dayjs(appliedDateRange[0]).format('YYYY-MM-DD') : '';
  const appliedEndDateStr = appliedDateRange?.[1] ? dayjs(appliedDateRange[1]).format('YYYY-MM-DD') : '';
  const appliedDivisionStr = Array.isArray(appliedFilters?.division) ? appliedFilters.division.join(',') : appliedFilters?.division || '';
  const appliedBranchStr = Array.isArray(appliedFilters?.branch) ? appliedFilters.branch.join(',') : appliedFilters?.branch || '';

  const syncUrl = useCallback(
    (patch = {}) => {
      setSearchParams(
        prev => {
          const next = new URLSearchParams(prev);
          const set = (k, v) => (v ? next.set(k, v) : next.delete(k));

          next.set('dashboard', 'user-wise');
          next.delete('record');
          next.delete('tab');

          if ('startDate' in patch) set('startDate', patch.startDate);
          if ('endDate' in patch) set('endDate', patch.endDate);
          if ('preset' in patch) set('preset', patch.preset);
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
    if (!searchParams.get('startDate') && !searchParams.get('endDate') && !filtersLocked) {
      syncUrl({
        startDate: dayjs().format('YYYY-MM-DD'),
        endDate: dayjs().format('YYYY-MM-DD'),
        preset: 'today',
      });
    }
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const payload = {
      divisionId: appliedDivisionStr || undefined,
      branchId: appliedBranchStr || undefined,
    };

    if (appliedStartDateStr && appliedEndDateStr) {
      payload.startDate = appliedStartDateStr;
      payload.endDate = appliedEndDateStr;
    }

    if (isSplitSessionActive) {
      payload.isSplit = true;
    }

    getUserWiseSummary(payload);
  }, [isHydrated, appliedStartDateStr, appliedEndDateStr, appliedDivisionStr, appliedBranchStr, isSplitSessionActive]);

  useEffect(() => {
    if (searchParams.get('division') && !isApiCalledRef.current.divisionDropdown) {
      getDivDropDown({});
      isApiCalledRef.current.divisionDropdown = true;
    }
  }, []);

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

  const persistFiltersToStorage = useCallback(() => {
    const filtersToSave = {
      division: filter.division && filter.division.length > 0 ? (Array.isArray(filter.division) ? filter.division.join(',') : filter.division) : '',
      branch: filter.branch && filter.branch.length > 0 ? (Array.isArray(filter.branch) ? filter.branch.join(',') : filter.branch) : '',
      preset: selectedPreset !== 'custom' ? selectedPreset : '',
      startDate: dateRange?.[0] ? dayjs(dateRange[0]).format('YYYY-MM-DD') : null,
      endDate: dateRange?.[1] ? dayjs(dateRange[1]).format('YYYY-MM-DD') : null,
    };
    const cleaned = Object.fromEntries(Object.entries(filtersToSave).filter(([, v]) => v !== '' && v !== null && v !== undefined));
    saveAllFiltersToLocalStorage(cleaned, USER_WISE_FILTER_STORAGE_KEY);
  }, [filter.division, filter.branch, dateRange, selectedPreset]);

  useEffect(() => {
    if (!filtersLocked) {
      if (!isHydrated) setIsHydrated(true);
      return;
    }
    if (lockedFiltersHydratedRef.current) return;
    const saved = getAllFiltersFromLocalStorage(USER_WISE_FILTER_STORAGE_KEY);
    if (!saved || Object.keys(saved).length === 0) {
      lockedFiltersHydratedRef.current = true;
      setIsHydrated(true);
      return;
    }
    lockedFiltersHydratedRef.current = true;

    if (saved.preset) setSelectedPreset(saved.preset);
    if (saved.startDate && saved.endDate) {
      const dr = [dayjs(saved.startDate), dayjs(saved.endDate)];
      setDateRange(dr);
      setAppliedDateRange(dr);
    }
    const newDivision = saved.division ? saved.division.split(',') : [];
    const newBranch = saved.branch ? saved.branch.split(',') : [];

    setFilter(prev => ({ ...prev, division: newDivision, branch: newBranch }));
    setAppliedFilters({ division: newDivision, branch: newBranch });

    syncUrl({
      startDate: saved.startDate || null,
      endDate: saved.endDate || null,
      preset: saved.preset && saved.preset !== 'custom' ? saved.preset : null,
      division: newDivision ? (Array.isArray(newDivision) ? newDivision.join(',') : newDivision) : null,
      branch: newBranch ? (Array.isArray(newBranch) ? newBranch.join(',') : newBranch) : null,
    });

    if (newDivision && newDivision.length > 0 && !isApiCalledRef.current.divisionDropdown) {
      getDivDropDown({});
      isApiCalledRef.current.divisionDropdown = true;
    }
    setIsHydrated(true);
  }, [filtersLocked]);

  const handleApplyFilters = () => {
    const rangeToUse = dateRange;
    setAppliedFilters({ division: filter.division, branch: filter.branch });
    setAppliedDateRange(rangeToUse);

    syncUrl({
      startDate: rangeToUse?.[0] ? dayjs(rangeToUse[0]).format('YYYY-MM-DD') : null,
      endDate: rangeToUse?.[1] ? dayjs(rangeToUse[1]).format('YYYY-MM-DD') : null,
      preset: selectedPreset !== 'custom' ? selectedPreset : null,
      division: filter.division ? (Array.isArray(filter.division) ? filter.division.join(',') : filter.division) : null,
      branch: filter.branch ? (Array.isArray(filter.branch) ? filter.branch.join(',') : filter.branch) : null,
    });

    if (filtersLocked) {
      persistFiltersToStorage();
    }
  };

  const handleResetFilters = () => {
    setFilter({ division: [], branch: [] });
    setAppliedFilters({ division: [], branch: [] });
    setDateRange(null);
    setAppliedDateRange(null);
    setSelectedPreset('custom');
    syncUrl({
      startDate: null,
      endDate: null,
      preset: null,
      division: null,
      branch: null,
    });
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

  const activeFilterCount = (appliedFilters.division?.length > 0 ? 1 : 0) + (appliedFilters.branch?.length > 0 ? 1 : 0) + (appliedDateRange ? 1 : 0);

  const renderActiveFiltersTags = () => (
    <div className="px-1 py-1.5 bg-gray-50/80 rounded-md border border-gray-100">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-gray-600 font-medium text-sm">Active filters:</span>

        {appliedFilters?.division?.length > 0 && (
          <Tag
            closable
            onClose={() => {
              setFilter(prev => ({ ...prev, division: [], branch: [] }));
              setAppliedFilters(prev => ({ ...prev, division: [], branch: [] }));
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

        {appliedFilters?.branch?.length > 0 && (
          <Tag
            closable
            onClose={() => {
              setFilter(prev => ({ ...prev, branch: [] }));
              setAppliedFilters(prev => ({ ...prev, branch: [] }));
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

        {appliedDateRange?.length > 0 && appliedDateRange[0] && appliedDateRange[1] && (
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
              {dayjs(appliedDateRange[0]).format('YYYY-MM-DD') === dayjs(appliedDateRange[1]).format('YYYY-MM-DD')
                ? dayjs(appliedDateRange[0]).format('YYYY-MM-DD')
                : `${dayjs(appliedDateRange[0]).format('YYYY-MM-DD')} to ${dayjs(appliedDateRange[1]).format('YYYY-MM-DD')}`}
            </span>
          </Tag>
        )}

        <Button style={{ color: colorPalette.primary[500] }} type="link" size="small" onClick={() => filterActionsRef.current.reset()}>
          Clear all
        </Button>
      </div>
    </div>
  );

  const filtersContent = (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
      <div className="lg:col-span-2 space-y-2">
        <CustomDatePicker selectedPreset={selectedPreset} setSelectedPreset={setSelectedPreset} dateRange={dateRange} setDateRange={setDateRange} label="Date Range" />
      </div>
      <div className="space-y-2">
        <FilterInput
          type={filterInputEnum?.SELECT}
          mode="multiple"
          name="division"
          label="Division"
          placeHolder="Select Division"
          selectVariant="twoColumn"
          columnSelectHeader={divisionSelectColumnHeader}
          selectionOptions={buildDivisionSelectOptions(divDrop)}
          value={filter.division}
          setFilter={setFilter}
          allowClear={true}
          extraFilterValues={{ branch: [] }}
          loading={divisionLoading}
          onFocus={() => {
            if (!isApiCalledRef.current.divisionDropdown) {
              getDivDropDown({});
              isApiCalledRef.current.divisionDropdown = true;
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
          selectionOptions={buildBranchSelectOptions(branchDrop)}
          value={filter.branch}
          setFilter={setFilter}
          allowClear={true}
          loading={branchLoading}
          disabled={!filter.division || filter.division.length === 0}
        />
      </div>
    </div>
  );

  const { activeUsers = [], inactiveUsers = [] } = userWiseSummary || {};

  const SALES_KEYS = ['quotations', 'salesOrders', 'deliveryChallans', 'invoices', 'paymentsReceived', 'creditNotes'];
  const PURCHASE_KEYS = ['purchaseOrders', 'grpoOrders', 'bills', 'paymentsMade', 'debitNotes', 'expenses'];

  const hasAny = (row, keys) => keys.some(k => (row[k]?.count || 0) > 0);

  const salesUsers = useMemo(() => activeUsers.filter(r => hasAny(r, SALES_KEYS)), [activeUsers]);
  const purchaseUsers = useMemo(() => activeUsers.filter(r => hasAny(r, PURCHASE_KEYS)), [activeUsers]);

  const makeTotalRow = (users, keys) => {
    if (!users.length) return null;
    const sum = key => ({
      count: users.reduce((acc, r) => acc + (r[key]?.count || 0), 0),
      total: users.reduce((acc, r) => acc + (r[key]?.total || 0), 0),
    });
    const row = { _isTotalRow: true, userId: '__total__', name: 'Total' };
    keys.forEach(k => {
      row[k] = sum(k);
    });
    return row;
  };

  const salesTotalRow = useMemo(() => makeTotalRow(salesUsers, SALES_KEYS), [salesUsers]);
  const purchaseTotalRow = useMemo(() => makeTotalRow(purchaseUsers, PURCHASE_KEYS), [purchaseUsers]);

  const salesTableData = useMemo(() => (salesTotalRow ? [...salesUsers, salesTotalRow] : salesUsers), [salesUsers, salesTotalRow]);
  const purchaseTableData = useMemo(() => (purchaseTotalRow ? [...purchaseUsers, purchaseTotalRow] : purchaseUsers), [purchaseUsers, purchaseTotalRow]);

  return (
    <div style={{ padding: '0 0 12px 0' }}>
      {filtersPanelOpen &&
        filtersPortalEl &&
        createPortal(
          <>
            {filtersContent}
            {activeFilterCount > 0 && renderActiveFiltersTags()}
          </>,
          filtersPortalEl
        )}

      {activeFilterCount > 0 && !filtersPanelOpen && activeFiltersPortalEl && createPortal(renderActiveFiltersTags(), activeFiltersPortalEl)}

      {activeUsers.length === 0 && !userWiseSummaryLoading ? (
        <div className="mx-4 mt-4 bg-white border border-gray-200 rounded-lg p-10 flex items-center justify-center">
          <Empty description="No activity found for the selected period" />
        </div>
      ) : (
        <div className="px-4 pt-3 flex flex-col gap-3">
          {salesTableData.length > 0 && <SectionTable title="Sales" accentColor={colorPalette.primary[500]} columns={salesCols} data={salesTableData} loading={userWiseSummaryLoading} />}
          {purchaseTableData.length > 0 && <SectionTable title="Purchase" accentColor="#d97706" columns={purchaseCols} data={purchaseTableData} loading={userWiseSummaryLoading} />}
        </div>
      )}

      {inactiveUsers.length > 0 && !userWiseSummaryLoading && (
        <div className="px-4 pt-3">
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-500">No Activity</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: colorPalette.primary[50], color: colorPalette.primary[600] }}>
                {inactiveUsers.length}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 p-3">
              {inactiveUsers.map(u => (
                <div key={u.userId} className="flex items-center gap-2 border border-gray-100 rounded-lg px-3 py-2 bg-gray-50" style={{ minWidth: 160 }}>
                  <div>
                    <div className="text-xs font-semibold text-gray-700 truncate" style={{ maxWidth: 140 }}>
                      {u.name}
                    </div>
                    {u.roleName && (
                      <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: colorPalette.primary[50], color: colorPalette.primary[600] }}>
                        {u.roleName}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default UserWiseTrackingDashboard;
