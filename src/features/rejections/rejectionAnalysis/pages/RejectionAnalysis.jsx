import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LabelList, Legend, ComposedChart, Line } from 'recharts';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { Tabs, Tooltip as AntTooltip } from '@/components/AntDComponent';
import Icons from '@/assets/icons/icon';
import { colorPalette } from '@/utils/theme';
import { useRejectionOrder } from '@/features/rejections/bookRejections/useRejectionOrder';
import { useCompanyCurrency } from '@/hooks/useCompanyCurrency';
import { useItemMaster } from '@/features/allMaster/item';
import { CommonFilterTags } from '@/utils/filtersUtils';
import FilterInput from '@/components/forms/formInput/FilterInput';
import FilterDrawer, { FilterSection, FilterButton } from '@/components/ui/common/FilterDrawer';
import { filterInputEnum } from '@/utils/constants';
import { buildItemFilterSelectOptions, itemSelectColumnHeader, itemSelectDropdownProps } from '@/utils/tableSelectDropdown/itemSelectDropdown';
import indiaGeo from '@/assets/maps/india.geo.json';

const PRIMARY = colorPalette.primary[500];

const PIE_COLORS = [
  colorPalette.brand.indigo,
  colorPalette.brand.teal,
  colorPalette.warning[500],
  colorPalette.brand.purple,
  colorPalette.primary[500],
  colorPalette.success[500],
  colorPalette.warning[400],
  colorPalette.brand.pink,
];

const RECOVERY_PIE_COLORS = [colorPalette.success[500], colorPalette.brand.indigo, colorPalette.warning[600], colorPalette.secondary[400]];

const COST_BAR_COLORS = [colorPalette.error[500], colorPalette.brand.teal, '#1a2a3a'];

// ─── Shared small components ──────────────────────────────────────────────────

const KpiCard = ({ icon, title, value, sub }) => (
  <div className="bg-white border-r border-b border-gray-200 p-3 sm:p-4 h-full">
    <div className="mb-2">
      <div className="p-2 sm:p-2.5 inline-flex items-center justify-center" style={{ backgroundColor: `${PRIMARY}14`, color: PRIMARY }}>
        {icon}
      </div>
    </div>
    <div className="space-y-1">
      <p className="text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide line-clamp-1">{title}</p>
      <p className="text-sm sm:text-base font-bold text-gray-900 leading-tight line-clamp-1">{value}</p>
      {sub && <p className="text-[11px] text-gray-400 leading-tight line-clamp-1">{sub}</p>}
    </div>
  </div>
);

const RecoveryKpiCard = ({ icon, iconBg, iconColor, title, value, sub }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-4">
    <div className="mb-3">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: iconBg, color: iconColor }}>
        {icon}
      </div>
    </div>
    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{title}</p>
    <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
    {sub && <p className="text-[12px] text-gray-400 mt-1">{sub}</p>}
  </div>
);

const PanelCell = ({ children, className = '' }) => <div className={`bg-white border-r border-b border-gray-200 p-4 ${className}`}>{children}</div>;

const RecoveryPanel = ({ children, className = '' }) => <div className={`bg-white border border-gray-200 rounded-xl p-4 ${className}`}>{children}</div>;

const PanelTitle = ({ title, sub }) => (
  <>
    <div className="font-semibold text-[15px] text-gray-900 mb-0.5">{title}</div>
    <div className="text-[12.5px] text-gray-500 mb-3">{sub}</div>
  </>
);

const EmptyState = () => <div className="py-8 text-center text-gray-400 text-[13px]">No data.</div>;
const LoadingState = () => (
  <div className="h-[230px] flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
  </div>
);

const truncate = (text, maxLength = 18) => (typeof text === 'string' && text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text);

const YAxisTick = ({ x, y, payload }) => (
  <text x={x} y={y} dy={4} textAnchor="end" fontSize={12} fill={colorPalette.secondary[500]}>
    <title>{payload?.value}</title>
    {truncate(payload?.value)}
  </text>
);

// ─── Chart components ─────────────────────────────────────────────────────────

function BarBlock({ data, color }) {
  if (!data?.length) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height={Math.max(150, data.length * 34)}>
      <BarChart data={data} layout="vertical" margin={{ left: 6, right: 28 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" width={140} tick={<YAxisTick />} interval={0} />
        <Tooltip cursor={{ fill: colorPalette.secondary[50] }} />
        <Bar dataKey="value" fill={color} radius={[0, 6, 6, 0]} barSize={16} label={{ position: 'right', fontSize: 11, fill: colorPalette.secondary[500] }} />
      </BarChart>
    </ResponsiveContainer>
  );
}

const SourceTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value, invoices = [] } = payload[0]?.payload || {};
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2.5 text-[12px] min-w-[180px]">
      <p className="font-semibold text-gray-800 mb-1">{name}</p>
      <p className="text-gray-600 mb-1.5">
        Qty: <span className="font-medium text-gray-900">{value}</span>
      </p>
      {invoices.length > 0 && (
        <div>
          <p className="text-[11px] text-gray-400 uppercase tracking-wide mb-1">Referenced Invoices</p>
          <div className="flex flex-wrap gap-1">
            {invoices.map(invoiceId => (
              <span key={invoiceId} className="inline-block bg-blue-50 text-blue-700 text-[11px] font-medium px-1.5 py-0.5 rounded">
                {invoiceId}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

function SourceBarBlock({ data, color }) {
  if (!data?.length) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height={Math.max(150, data.length * 34)}>
      <BarChart data={data} layout="vertical" margin={{ left: 6, right: 28 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" width={140} tick={<YAxisTick />} interval={0} />
        <Tooltip content={<SourceTooltip />} cursor={{ fill: colorPalette.secondary[50] }} />
        <Bar dataKey="value" fill={color} radius={[0, 6, 6, 0]} barSize={16} label={{ position: 'right', fontSize: 11, fill: colorPalette.secondary[500] }} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function ReasonDonut({ data }) {
  if (!data?.length) return <EmptyState />;
  return (
    <>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={88} innerRadius={44} paddingAngle={2}>
            {data.map((_, index) => (
              <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
        {data.map((entry, index) => (
          <span key={entry.name} className="inline-flex items-center gap-1.5 text-[11px] text-gray-500">
            <span className="w-2 h-2 rounded-sm inline-block" style={{ background: PIE_COLORS[index % PIE_COLORS.length] }} />
            {entry.name} ({entry.value})
          </span>
        ))}
      </div>
    </>
  );
}

function GeoMap({ byCity }) {
  const points = useMemo(() => (byCity || []).map(city => ({ name: city.name, value: city.value, coords: city.coords })).filter(city => city.coords), [byCity]);
  if (!points.length) return <EmptyState />;
  const maxValue = Math.max(...points.map(point => point.value), 1);
  const getBubbleRadius = value => 6 + (Math.sqrt(value) / Math.sqrt(maxValue)) * 18;
  return (
    <div className="w-full">
      <ComposableMap projection="geoMercator" projectionConfig={{ scale: 820, center: [81, 22.5] }} width={800} height={520} style={{ width: '100%', height: 'auto' }}>
        <Geographies geography={indiaGeo}>
          {({ geographies }) =>
            geographies.map(geo => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill={colorPalette.secondary[100]}
                stroke={colorPalette.secondary[200]}
                strokeWidth={0.5}
                style={{ default: { outline: 'none' }, hover: { fill: colorPalette.secondary[200], outline: 'none' }, pressed: { outline: 'none' } }}
              />
            ))
          }
        </Geographies>
        {points.map(point => {
          const bubbleRadius = getBubbleRadius(point.value);
          const fontSize = Math.min(9, Math.max(6, bubbleRadius * 0.8));
          return (
            <Marker key={point.name} coordinates={point.coords}>
              <circle r={bubbleRadius} fill={PRIMARY} fillOpacity={0.35} stroke={PRIMARY} strokeWidth={1} />
              <title>{`${point.name}: ${point.value} pc`}</title>
              <text textAnchor="middle" dy={fontSize / 3} style={{ fontSize, fontWeight: 700, fill: '#fff', pointerEvents: 'none' }}>
                {point.value}
              </text>
              <text
                textAnchor="middle"
                y={-bubbleRadius - 6}
                style={{ fontSize: 10, fontWeight: 600, fill: colorPalette.secondary[800], stroke: '#fff', strokeWidth: 3, paintOrder: 'stroke', strokeLinejoin: 'round', pointerEvents: 'none' }}
              >
                {`${point.name} (${point.value})`}
              </text>
            </Marker>
          );
        })}
      </ComposableMap>
      <div className="text-[11px] text-gray-400 text-center -mt-1">Bubble size = rejected qty by city</div>
    </div>
  );
}

function AggregateCostBar({ data }) {
  if (!data?.length) return <EmptyState />;
  const formatRupees = amount => `₹${Number(amount).toLocaleString('en-IN')}`;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ left: 60, right: 16, top: 24, bottom: 8 }}>
        <CartesianGrid vertical={false} stroke={colorPalette.secondary[100]} />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: colorPalette.secondary[500] }} />
        <YAxis tickFormatter={formatRupees} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: colorPalette.secondary[400] }} />
        <Tooltip formatter={amount => [formatRupees(amount)]} cursor={{ fill: colorPalette.secondary[50] }} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={80}>
          {data.map((_, index) => (
            <Cell key={index} fill={COST_BAR_COLORS[index]} />
          ))}
          <LabelList
            dataKey="value"
            content={({ value, x, y, width }) => (
              <text x={(x || 0) + (width || 0) / 2} y={(y || 0) - 5} textAnchor="middle" fontSize={11} fill={colorPalette.secondary[700]} fontWeight={600}>
                {formatRupees(value)}
              </text>
            )}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function RecoveryDonut({ data }) {
  if (!data?.length) return <EmptyState />;
  return (
    <>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={2}>
            {data.map((_, index) => (
              <Cell key={index} fill={RECOVERY_PIE_COLORS[index % RECOVERY_PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={amount => [`₹${amount.toLocaleString('en-IN')}`]} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 justify-center">
        {data.map((entry, index) => (
          <span key={entry.name} className="inline-flex items-center gap-1.5 text-[12px] text-gray-600">
            <span className="w-3 h-3 rounded-sm inline-block flex-shrink-0" style={{ background: RECOVERY_PIE_COLORS[index % RECOVERY_PIE_COLORS.length] }} />
            {entry.name} ({entry.value.toLocaleString('en-IN')})
          </span>
        ))}
      </div>
    </>
  );
}

const formatLakh = value => {
  if (value === 0) return '₹0L';
  const lakhs = value / 100000;
  return `₹${lakhs % 1 === 0 ? lakhs : lakhs.toFixed(1)}L`;
};

const SalesRejectionTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const getSeriesValue = dataKey => payload.find(entry => entry.dataKey === dataKey)?.value ?? 0;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 text-[12px] min-w-[190px]">
      <p className="font-semibold text-gray-800 mb-2">{label}</p>
      <p style={{ color: colorPalette.warning[500] }}>Rejection % : {getSeriesValue('rejectionPct')}%</p>
      <p style={{ color: colorPalette.error[500] }}>Rejection (₹) : ₹{getSeriesValue('rejectionValue').toLocaleString('en-IN')}</p>
      <p style={{ color: '#16a34a' }}>Sales (₹) : ₹{getSeriesValue('salesValue').toLocaleString('en-IN')}</p>
    </div>
  );
};

function SalesVsRejectionChart({ data }) {
  if (!data?.length) return <EmptyState />;
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ left: 8, right: 32, top: 12, bottom: 4 }}>
        <CartesianGrid vertical={false} stroke={colorPalette.secondary[100]} />
        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: colorPalette.secondary[500] }} />
        <YAxis yAxisId="left" tickFormatter={formatLakh} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: colorPalette.secondary[400] }} width={52} />
        <YAxis yAxisId="right" orientation="right" tickFormatter={percent => `${percent}%`} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: colorPalette.secondary[400] }} width={36} />
        <Tooltip content={<SalesRejectionTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 10 }}
          formatter={seriesName => (seriesName === 'salesValue' ? 'Sales (₹)' : seriesName === 'rejectionValue' ? 'Rejection (₹)' : 'Rejection %')}
        />
        <Line yAxisId="left" type="monotone" dataKey="salesValue" name="salesValue" stroke="#16a34a" strokeWidth={2} strokeDasharray="6 3" dot={{ r: 3, fill: '#16a34a' }} activeDot={{ r: 5 }} />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="rejectionValue"
          name="rejectionValue"
          stroke={colorPalette.error[500]}
          strokeWidth={2}
          dot={{ r: 3, fill: colorPalette.error[500] }}
          activeDot={{ r: 5 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="rejectionPct"
          name="rejectionPct"
          stroke={colorPalette.warning[500]}
          strokeWidth={2}
          strokeDasharray="6 3"
          dot={{ r: 3, fill: colorPalette.warning[500] }}
          activeDot={{ r: 5 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

const API_CALLED_ENUM = {
  ITEM_DROPDOWN: 'itemDropdown',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RejectionAnalysis() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { analysisData, analysisLoading, getRejectionAnalysis } = useRejectionOrder();
  const { currencySymbol } = useCompanyCurrency();
  const { itemDrop, itemDropLoading, getItemDrop } = useItemMaster();
  const [activeTab, setActiveTab] = useState('overview');
  const [showFilter, setShowFilter] = useState(false);
  const [filter, setFilter] = useState({ itemId: searchParams.get('itemId') || '' });
  const containerRef = useRef(null);
  const isApicalledRefFilter = useRef({
    itemDropdown: false,
  });

  const handleOnFocusApiCall = async type => {
    let obj = { ...isApicalledRefFilter.current };
    if (type === API_CALLED_ENUM.ITEM_DROPDOWN) {
      await getItemDrop({});
      obj.itemDropdown = true;
    }
    isApicalledRefFilter.current = obj;
  };

  useEffect(() => {
    if (searchParams.get('itemId')) {
      handleOnFocusApiCall(API_CALLED_ENUM.ITEM_DROPDOWN);
    }
  }, []);

  useEffect(() => {
    const itemId = searchParams.get('itemId') || '';
    getRejectionAnalysis(itemId ? { itemId } : {});
  }, [searchParams]);

  const updateUrlParams = newParams => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    setSearchParams(params);
  };

  const handleFilter = () => {
    updateUrlParams({ itemId: filter.itemId || '' });
  };

  const handleResetFilters = () => {
    setFilter({ itemId: '' });
    updateUrlParams({ itemId: '' });
  };

  const getActiveFiltersCount = () => {
    return [searchParams.get('itemId')].filter(Boolean).length;
  };

  const {
    totalRejectedQty = 0,
    totalReturnedQty = 0,
    orderCount = 0,
    byReason = [],
    byItem = [],
    byCustomer = [],
    byState = [],
    byCity = [],
    bySubReason = [],
    byComponent = [],
    byVendor = [],
    salesVsRejection = [],
    recovery = null,
  } = analysisData || {};

  const subReasonTop = useMemo(() => bySubReason.slice(0, 8), [bySubReason]);

  // Normalize recovery numeric fields with safe defaults so a partial payload can't crash the KPI cards / charts.
  const recoveryStats = useMemo(() => {
    if (!recovery) return null;
    const { recoveryRate = 0, totalRecovered = 0, totalRejectionCost = 0, netLoss = 0, reuseValue = 0, vendorReturnValue = 0, scrapValue = 0 } = recovery;
    return { recoveryRate, totalRecovered, totalRejectionCost, netLoss, reuseValue, vendorReturnValue, scrapValue };
  }, [recovery]);

  const recoveryPieData = useMemo(() => {
    if (!recoveryStats) return [];
    const { reuseValue, vendorReturnValue, scrapValue, netLoss } = recoveryStats;
    return [
      { name: 'Reuse', value: reuseValue },
      { name: 'Vendor Return', value: vendorReturnValue },
      { name: 'Scrap', value: scrapValue },
      { name: 'Loss', value: Math.max(0, netLoss) },
    ].filter(segment => segment.value > 0);
  }, [recoveryStats]);

  const costBarData = useMemo(
    () =>
      recoveryStats
        ? [
            { name: 'Rejection', value: recoveryStats.totalRejectionCost },
            { name: 'Recovered', value: recoveryStats.totalRecovered },
            { name: 'Net Loss', value: Math.abs(recoveryStats.netLoss) },
          ]
        : [],
    [recoveryStats]
  );

  const recoveryRateByItem = useMemo(() => (recovery?.byItem || []).slice(0, 8).map(item => ({ name: item.name, value: item.recoveryRate })), [recovery]);

  const tabItems = [
    { key: 'overview', label: 'Overview' },
    { key: 'recovery', label: 'Rejection vs Recovery' },
  ];

  return (
    <div ref={containerRef} className="-m-4">
      {/* Page header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[18px] m-0 font-bold text-gray-900">Rejection Analysis</h1>
          <p className="text-[13px] mt-0.5 mb-0 text-gray-500">Aggregated rejection data across all orders.</p>
        </div>
        <FilterButton count={getActiveFiltersCount()} onClick={() => setShowFilter(true)} />
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
        <FilterSection title="What">
          <div className="space-y-2">
            <FilterInput
              type={filterInputEnum?.SELECT}
              name="itemId"
              label="Item"
              placeHolder="All items"
              selectVariant="twoColumn"
              columnSelectHeader={itemSelectColumnHeader}
              selectPopupClassName={itemSelectDropdownProps.selectPopupClassName}
              selectionOptions={buildItemFilterSelectOptions(itemDrop)}
              value={filter.itemId}
              setFilter={setFilter}
              allowClear
              loading={itemDropLoading}
              showSearch
              onFocus={() => {
                if (!isApicalledRefFilter.current.itemDropdown) {
                  handleOnFocusApiCall(API_CALLED_ENUM.ITEM_DROPDOWN);
                }
              }}
              getPopupContainer={() => containerRef.current || document.body}
            />
          </div>
        </FilterSection>
      </FilterDrawer>

      {/* Filter tags */}
      <div className="bg-white px-4 py-0 pb-2">
        <CommonFilterTags
          filterClassName="!mb-0 border-t"
          searchParams={searchParams}
          setFilter={setFilter}
          updateUrlParams={updateUrlParams}
          handleClear={handleResetFilters}
          handleResetFilters={handleResetFilters}
          extraFilters={{
            itemId: {
              label: 'Item',
              format: value => (itemDrop || []).find(item => String(item._id) === String(value))?.itemName || null,
              clear: (setFilter, updateUrlParams) => {
                setFilter(prev => ({ ...prev, itemId: '' }));
                updateUrlParams({ itemId: '' });
              },
            },
          }}
        />
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-200 px-4">
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </div>

      {/* ── Overview tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 border-l border-gray-200">
            <KpiCard icon={<Icons.ProfileOutlined style={{ fontSize: 20 }} />} title="Total Rejected Qty" value={`${totalRejectedQty.toLocaleString('en-IN')} pc`} />
            <KpiCard icon={<Icons.UndoOutlined style={{ fontSize: 20 }} />} title="Total Returned Qty" value={`${totalReturnedQty.toLocaleString('en-IN')} pc`} sub="good-condition, sent back" />
            <KpiCard icon={<Icons.BarChartOutlined style={{ fontSize: 20 }} />} title="Total Orders" value={String(orderCount)} />
            <KpiCard icon={<Icons.WarningOutlined style={{ fontSize: 20 }} />} title="Top Reason" value={byReason[0]?.name || '-'} sub={byReason[0] ? `${byReason[0].value} pc` : undefined} />
            <KpiCard
              icon={<Icons.AppstoreOutlined style={{ fontSize: 20 }} />}
              title="Top Component"
              value={byComponent[0]?.name || '-'}
              sub={byComponent[0] ? `${byComponent[0].value} pc` : undefined}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 border-l border-gray-200">
            <PanelCell>
              <PanelTitle title="Geographic rejection map" sub="Rejected qty by city" />
              {analysisLoading ? <LoadingState /> : <GeoMap byCity={byCity} />}
            </PanelCell>
            <PanelCell>
              <PanelTitle title="Reason-wise rejection" sub="Root-cause distribution" />
              {analysisLoading ? <LoadingState /> : <ReasonDonut data={byReason} />}
            </PanelCell>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 border-l border-gray-200">
            <PanelCell>
              <PanelTitle title="Item-wise rejection" sub="By product" />
              {analysisLoading ? <LoadingState /> : <BarBlock data={byItem} color={PRIMARY} />}
            </PanelCell>
            <PanelCell>
              <PanelTitle title="Sub-reason breakdown" sub="What specifically failed (top 8)" />
              {analysisLoading ? <LoadingState /> : <BarBlock data={subReasonTop} color={colorPalette.brand.purple} />}
            </PanelCell>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 border-l border-gray-200">
            <PanelCell>
              <PanelTitle title="Customer-wise rejection" sub="Who returns the most" />
              {analysisLoading ? <LoadingState /> : <BarBlock data={byCustomer} color={colorPalette.warning[500]} />}
            </PanelCell>
            <PanelCell>
              <PanelTitle title="State-wise rejection" sub="Regional concentration" />
              {analysisLoading ? <LoadingState /> : <BarBlock data={byState} color={colorPalette.brand.teal} />}
            </PanelCell>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 border-l border-gray-200">
            <PanelCell>
              <PanelTitle title="Sales vs Rejection ratio" sub="Sold qty vs rejected qty per item (top 15, excl. draft & cancelled invoices)" />
              {analysisLoading ? <LoadingState /> : <SalesVsRejectionChart data={salesVsRejection} />}
            </PanelCell>
            <PanelCell>
              <div className="font-semibold text-[15px] text-gray-900 mb-0.5 flex items-center gap-1.5">
                Source-wise rejection
                <AntTooltip
                  title="Only rejection orders linked to a sales invoice are counted here. Without an invoice reference, we cannot trace which batch the item was deducted from — and therefore cannot identify its procurement source (vendor, existing inventory, or manual stock)."
                  placement="right"
                >
                  <Icons.InfoCircleOutlined style={{ fontSize: 13, color: colorPalette.primary[500], cursor: 'pointer' }} />
                </AntTooltip>
              </div>
              <div className="text-[12.5px] text-gray-500 mb-3">Rejection qty by procurement source (vendor, existing inventory, manual stock)</div>
              {analysisLoading ? <LoadingState /> : <SourceBarBlock data={byVendor.slice(0, 6)} color={colorPalette.brand.indigo} />}
            </PanelCell>
          </div>
        </>
      )}

      {/* ── Rejection vs Recovery tab ─────────────────────────────────────────── */}
      {activeTab === 'recovery' && (
        <div className="p-4 space-y-4">
          {/* KPI cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <RecoveryKpiCard
              icon={<Icons.SyncOutlined style={{ fontSize: 18 }} />}
              iconBg={`${colorPalette.brand.teal}18`}
              iconColor={colorPalette.brand.teal}
              title="Recovery Rate"
              value={recoveryStats ? `${recoveryStats.recoveryRate}%` : '—'}
              sub="of rejection cost"
            />
            <RecoveryKpiCard
              icon={<Icons.WalletOutlined style={{ fontSize: 18 }} />}
              iconBg={`${colorPalette.brand.teal}18`}
              iconColor={colorPalette.brand.teal}
              title="Total Recovered"
              value={recoveryStats ? `${currencySymbol}${recoveryStats.totalRecovered.toLocaleString('en-IN')}` : '—'}
              sub={recoveryStats ? `of ${currencySymbol}${recoveryStats.totalRejectionCost.toLocaleString('en-IN')} rejected` : undefined}
            />
            <RecoveryKpiCard
              icon={<Icons.WarningOutlined style={{ fontSize: 18 }} />}
              iconBg={`${colorPalette.error[500]}14`}
              iconColor={colorPalette.error[500]}
              title="Net Loss After Recovery"
              value={recoveryStats ? `${currencySymbol}${recoveryStats.netLoss.toLocaleString('en-IN')}` : '—'}
            />
          </div>

          {/* Cost bar + composition donut */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <RecoveryPanel>
              <PanelTitle title="Rejection cost vs Recovered value" sub="Value reclaimed against loss booked" />
              {analysisLoading ? <LoadingState /> : <AggregateCostBar data={costBarData} />}
            </RecoveryPanel>
            <RecoveryPanel>
              <PanelTitle title="Recovery composition" sub="Reuse / vendor return / scrap / loss" />
              {analysisLoading ? <LoadingState /> : <RecoveryDonut data={recoveryPieData} />}
            </RecoveryPanel>
          </div>

          {/* Recovery rate by product */}
          <RecoveryPanel>
            <PanelTitle title="Recovery rate by product series" sub="Which products give back the most value" />
            {analysisLoading ? <LoadingState /> : <BarBlock data={recoveryRateByItem} color={colorPalette.brand.teal} />}
            <p className="text-[11.5px] text-gray-400 mt-4 leading-relaxed border-t border-gray-100 pt-3">
              Suggested additions for sharper decisions: <strong>rejection cost (₹) trend</strong>, <strong>reason → sub-reason → vendor drill-down</strong>, <strong>days-to-settle (ageing)</strong>,{' '}
              <strong>PC-to-PC vs Credit Note split</strong>, <strong>repeat-customer rejection rate</strong>, and <strong>scrap weight (kg) trend</strong>.
            </p>
          </RecoveryPanel>
        </div>
      )}
    </div>
  );
}
