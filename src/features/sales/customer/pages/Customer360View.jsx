import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { Tooltip, DatePicker, Tag } from '@/components/AntDComponent';
import BackButton from '@/components/ui/button/BackButton';
import { formatAmount, formatAmountShort, toDecimalString } from '@/utils/currency';
import { colorPalette } from 'utils/theme';
import Icons from '@/assets/icons/icon';
import { useCustomer } from '@/features/sales/customer/useCustomer';
import CustomerCreditDashboard from '@/features/sales/customer/components/CustomerCreditDashboard';
import Customer360ViewSkeleton from '@/features/sales/customer/components/Customer360ViewSkeleton';
import { useCompanyCurrency } from '@/hooks/useCompanyCurrency';
import { getFYParameterValue, getFYPickerValue } from '@/features/sales/customer/customer.utils';

const PRIMARY = colorPalette.primary[500];

// Primary KPIs — most important business metrics
const SNAPSHOT_PRIMARY = [
  {
    key: 'totalInvoiceSales',
    label: 'Total Invoice Sales',
    icon: <Icons.BarChartOutlined className="text-xl" />,
    isMoney: true,
    formula: 'Total value of all invoices raised to this customer in the current financial year.\nCancelled invoices are excluded.',
  },
  {
    key: 'totalCollection',
    label: 'Collection Received',
    icon: <Icons.DollarOutlined className="text-xl" />,
    isMoney: true,
    formula: 'Total payments actually received from this customer in the current financial year.\nOnly approved payment receipts are counted.',
  },
  {
    key: 'outstandingBalance',
    label: 'Outstanding Balance',
    icon: <Icons.WalletOutlined className="text-xl" />,
    isMoney: true,
    formula: 'Amount this customer currently owes your business.\nUpdated in real time as invoices are raised and payments are received.',
  },
  {
    key: 'totalInvoiceItemsQty',
    label: 'Total Units Sold',
    icon: <Icons.InboxOutlined className="text-xl" />,
    isMoney: false,
    format: v => v?.toLocaleString('en-IN') || '0',
    formula: 'Total number of product units sold to this customer\nacross all invoices in the current financial year.',
  },
];

// Detail KPIs — financial breakdown, shown as compact strip
const SNAPSHOT_DETAIL = [
  {
    key: 'totalTax',
    label: 'Total Tax (GST)',
    icon: <Icons.PercentageOutlined className="text-base" />,
    isMoney: true,
    tooltip: 'Total GST (CGST + SGST / IGST) collected across all invoices',
    formula: 'Total GST charged across all invoices in the financial year.\nIncludes CGST + SGST (intra-state) or IGST (inter-state).',
  },
  {
    key: 'totalDiscount',
    label: 'Total Discount',
    icon: <Icons.TagOutlined className="text-base" />,
    isMoney: true,
    tooltip: 'Total discount given — covers both per-item and transaction-level discounts',
    formula:
      'Total discount given to this customer across all invoices:\n• Item discount — difference between list price and billed amount\n• Invoice discount — discount applied on the whole invoice',
  },
  {
    key: 'totalExtraCharges',
    label: 'Extra Charges',
    icon: <Icons.PlusCircleOutlined className="text-base" />,
    isMoney: true,
    tooltip: 'Sum of additional charges, adjustments & round-off across all invoices',
    formula: 'Charges billed beyond the product value and tax:\nIncludes freight, packaging, adjustments & rounding amounts.',
  },
];

// Small info icon that shows calculation formula on hover
const InfoTooltip = ({ text }) => (
  <Tooltip title={<span className="text-xs leading-relaxed whitespace-pre-line">{text}</span>} placement="topLeft">
    <span className="cursor-help text-gray-400 hover:text-gray-600 inline-flex items-center shrink-0">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    </span>
  </Tooltip>
);

// Primary KPI card — vertical layout with icon
const SnapshotCard = ({ icon, label, displayValue, valueTooltip, formula }) => (
  <div className="bg-white border-r border-b border-gray-200 p-3 sm:p-4 h-full">
    <div className="flex items-center justify-between gap-2 mb-2">
      <div className="p-2 sm:p-2.5 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(23, 133, 182, 0.08)', color: PRIMARY }}>
        {icon}
      </div>
    </div>
    <div className="space-y-0.5">
      <div className="flex items-center gap-1">
        <p className="text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide line-clamp-1">{label}</p>
        {formula && <InfoTooltip text={formula} />}
      </div>
      {valueTooltip ? (
        <Tooltip title={valueTooltip} placement="top">
          <p className="text-xl font-bold text-gray-900 leading-tight cursor-default">{displayValue}</p>
        </Tooltip>
      ) : (
        <p className="text-xl font-bold text-gray-900 leading-tight">{displayValue}</p>
      )}
    </div>
  </div>
);

// Detail KPI card — compact horizontal layout for financial breakdown strip
const DetailCard = ({ icon, label, displayValue, valueTooltip, labelTooltip, formula }) => (
  <div className="bg-gray-50 border-r border-b border-gray-200 px-3 py-2.5 flex items-center gap-3 h-full">
    <div className="flex items-center justify-center shrink-0" style={{ color: PRIMARY }}>
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-1">
        {labelTooltip ? (
          <Tooltip title={labelTooltip} placement="top">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide truncate cursor-default">{label}</p>
          </Tooltip>
        ) : (
          <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wide truncate">{label}</p>
        )}
        {formula && <InfoTooltip text={formula} />}
      </div>
      {valueTooltip ? (
        <Tooltip title={valueTooltip} placement="top">
          <p className="text-sm font-bold text-gray-800 leading-tight cursor-default">{displayValue}</p>
        </Tooltip>
      ) : (
        <p className="text-sm font-bold text-gray-800 leading-tight">{displayValue}</p>
      )}
    </div>
  </div>
);

// Insight bar row (reused for top items + top groups)
const InsightRow = ({ rank, name, sales, contribution, color }) => (
  <div className="flex items-center gap-3">
    <span className="text-[11px] font-bold text-gray-400 w-4 shrink-0">{rank}</span>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-xs font-medium text-gray-800 truncate">{name}</span>
        <Tooltip title={formatAmount(sales)} placement="top">
          <span className="text-xs font-semibold text-gray-900 shrink-0 cursor-default">{formatAmountShort(sales)}</span>
        </Tooltip>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${contribution}%`, backgroundColor: color }} />
        </div>
        <span className="text-[10px] font-semibold w-9 text-right shrink-0" style={{ color }}>
          {contribution}%
        </span>
      </div>
    </div>
  </div>
);

const Customer360View = () => {
  const { customerId } = useParams();
  const { currencySymbol } = useCompanyCurrency();
  const isSplitSessionActive = useSelector(state => state.common?.isSplitSessionActive);
  const {
    analysis360: data,
    analysis360Loading: loading,
    getCustomerAnalysis360,
    resetAnalysis360,
    customerCreditDashboard,
    customerCreditDashboardLoading,
    getCustomerCreditDashboard,
    resetCustomerCreditDashboard,
  } = useCustomer();
  const [selectedFY, setSelectedFY] = useState(dayjs());
  const selectedFYValue = useMemo(() => getFYParameterValue(selectedFY), [selectedFY]);

  const handleFYChange = date => {
    setSelectedFY(date || dayjs());
  };

  useEffect(() => {
    const controller = new AbortController();
    if (customerId) {
      getCustomerAnalysis360({
        customerId,
        isSplit: isSplitSessionActive || false,
        fy: selectedFYValue,
        signal: controller.signal,
      });
    }
    return () => {
      controller.abort();
      resetAnalysis360();
    };
  }, [customerId, isSplitSessionActive, selectedFYValue]);

  useEffect(() => {
    const controller = new AbortController();
    if (customerId) {
      getCustomerCreditDashboard({
        customerId,
        isSplit: isSplitSessionActive || false,
        fy: selectedFYValue,
        signal: controller.signal,
      });
    }
    return () => {
      controller.abort();
      resetCustomerCreditDashboard();
    };
  }, [customerId, isSplitSessionActive, selectedFYValue]);

  const renderHeader = () => {
    const customer = data?.customer;
    const customerName = customer?.name || '-';
    const customerNumber = customer?.customerNumber;
    const companyName = customer?.companyName;
    const gstin = customer?.gstin;

    return (
      <div className="customer-360-view-header bg-white border-b border-gray-200 px-4 py-3 -m-4 overflow-hidden">
        <div className="customer-360-view-header__row flex items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="shrink-0 pt-0.5 sm:pt-0 sm:self-center h-8 flex items-center">
              <BackButton />
            </div>
            <div className="min-w-0 flex-1">
              {customer ? (
                <>
                  <Tooltip title={customerName} placement="topLeft">
                    <h1 className="text-base sm:text-[18px] font-semibold leading-[22px] sm:leading-[27px] h-[22px] sm:h-[27px] max-w-[220px] sm:max-w-none text-gray-900 truncate">{companyName}</h1>
                  </Tooltip>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 min-h-[22px]">
                    {customerNumber && <Tag className="font-semibold m-0">{customerNumber}</Tag>}
                    {gstin && (
                      <>
                        <span className="text-gray-400 text-xs">•</span>
                        <Tooltip title={`GSTIN: ${gstin}`} placement="topLeft">
                          <span className="text-sm text-gray-500 truncate">GSTIN: {gstin}</span>
                        </Tooltip>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <h1 className="text-base sm:text-[18px] font-semibold text-gray-900">Customer 360° Analysis</h1>
              )}
            </div>
          </div>
          <div className="shrink-0 h-6 flex items-center">
            <DatePicker
              picker="year"
              size="small"
              allowClear={false}
              className="w-32"
              value={getFYPickerValue(selectedFYValue)}
              format={d => `FY ${getFYParameterValue(d)}`}
              onChange={handleFYChange}
            />
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <Customer360ViewSkeleton />;
  }

  if (!data) {
    return (
      <>
        {renderHeader()}
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-500">No data available for this customer.</p>
        </div>
      </>
    );
  }

  const snapshot = data?.snapshot;
  const itemGroups = data?.monthlySales?.itemGroups || [];
  const months = data?.monthlySales?.months || [];

  const totalGrandSales = months.reduce((sum, m) => sum + (m.grandTotal?.sales || 0), 0);
  const groupSalesTotal = group => months.reduce((sum, m) => sum + (m.itemGroups?.[group]?.sales || 0), 0);
  const groupPct = group => (totalGrandSales > 0 ? toDecimalString((groupSalesTotal(group) / totalGrandSales) * 100) : null);

  // Top-selling group for the current view (YTD or selected month)
  const topGroup = (() => {
    if (itemGroups.length === 0) return null;
    const best = itemGroups.reduce((b, g) => (groupSalesTotal(g) > groupSalesTotal(b) ? g : b), itemGroups[0]);
    return groupSalesTotal(best) > 0 ? best : null;
  })();

  const top5Items = data?.insights?.top5Items || [];
  const top5ItemGroups = data?.insights?.top5ItemGroups || [];

  return (
    <>
      {renderHeader()}

      {/* ── Primary KPI Cards (4) ──────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-l border-gray-200 -mx-4 mt-4">
        {SNAPSHOT_PRIMARY.map(cfg => {
          const raw = snapshot?.[cfg.key];
          const displayValue = cfg.isMoney ? formatAmountShort(raw || 0) : cfg.format ? cfg.format(raw) : String(raw ?? 0);
          const valueTooltip = cfg.isMoney ? formatAmount(raw || 0) : null;
          return <SnapshotCard key={cfg.key} icon={cfg.icon} label={cfg.label} displayValue={displayValue} valueTooltip={valueTooltip} formula={cfg.formula} />;
        })}
      </div>

      {/* ── Detail KPI Strip (3) ───────────────────────────── */}
      <div className="grid grid-cols-3 border-l border-gray-200 -mx-4">
        {SNAPSHOT_DETAIL.map(cfg => {
          const raw = snapshot?.[cfg.key];
          const displayValue = formatAmountShort(raw || 0);
          const valueTooltip = formatAmount(raw || 0);
          return <DetailCard key={cfg.key} icon={cfg.icon} label={cfg.label} displayValue={displayValue} valueTooltip={valueTooltip} labelTooltip={cfg.tooltip || null} formula={cfg.formula} />;
        })}
      </div>

      {/* ── Sales Insights ─────────────────────────────────── */}
      {(top5Items.length > 0 || top5ItemGroups.length > 0) && (
        <div className="bg-white border-l border-r border-b border-gray-200 -mx-4">
          {/* Section header */}
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Sales Insights</span>
            <span className="text-[10px] text-gray-400 font-medium">— top contributors for the selected period</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100 px-4 py-4">
            {/* Top 5 Items */}
            <div className="md:pr-6 pb-4 md:pb-0">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Top 5 Items</p>
              <div className="space-y-3">
                {top5Items.map((item, idx) => (
                  <InsightRow key={idx} rank={idx + 1} name={item.name} sales={item.sales} contribution={item.contribution} color={PRIMARY} />
                ))}
              </div>
            </div>
            {/* Top 5 Item Groups */}
            <div className="md:pl-6 pt-4 md:pt-0">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Top 5 Item Groups</p>
              <div className="space-y-3">
                {top5ItemGroups.map((group, idx) => (
                  <InsightRow key={idx} rank={idx + 1} name={group.name} sales={group.sales} contribution={group.contribution} color={colorPalette.primary[500] || PRIMARY} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Product Series Table ────────────── */}
      <div className="bg-white border border-gray-200 -mx-4">
        {/* Sales table */}
        <div className="p-4">
          <p className="text-sm font-semibold text-gray-800 mb-3">
            Product Series
            <span className="text-xs font-medium text-gray-400 ml-2">Month-wise Sales & Qty</span>
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse [&_th]:border [&_td]:border [&_th]:border-gray-200 [&_td]:border-gray-200">
              <thead>
                <tr>
                  <th rowSpan={2} className="text-left py-2 px-3 text-xs font-bold text-gray-700 uppercase bg-gray-50 sticky left-0 z-30 min-w-[80px] align-bottom border-r-gray-300">
                    Month
                  </th>
                  {itemGroups.map((group, gIdx) => {
                    const isTop = group === topGroup;
                    return (
                      <th
                        key={group}
                        colSpan={2}
                        className={`text-center py-2 px-2 text-xs font-semibold min-w-[150px] border-r-gray-300${gIdx === 0 ? ' border-l-gray-300' : ''}`}
                        style={{ backgroundColor: isTop ? 'rgba(23,133,182,0.13)' : '#f9fafb', color: isTop ? PRIMARY : '#374151' }}
                      >
                        <div className="leading-tight flex items-center justify-center gap-1.5">
                          <span>{group}</span>
                          {isTop && (
                            <span className="inline-flex items-center text-[8px] font-bold px-1.5 py-0.5 rounded-full tracking-wide" style={{ backgroundColor: PRIMARY, color: '#fff' }}>
                              TOP
                            </span>
                          )}
                        </div>
                        {groupPct(group) !== null && (
                          <div className="text-[10px] font-semibold mt-0.5" style={{ color: PRIMARY }}>
                            {groupPct(group)}%
                          </div>
                        )}
                      </th>
                    );
                  })}
                  <th colSpan={2} className="text-center py-2 px-2 text-xs font-bold text-gray-800 uppercase bg-gray-100 border-l-gray-300 sticky right-0 z-20">
                    Grand Total
                  </th>
                </tr>
                <tr>
                  {itemGroups.map((group, gIdx) => {
                    const isTop = group === topGroup;
                    const subBg = isTop ? 'rgba(23,133,182,0.13)' : '#f9fafb';
                    return (
                      <>
                        <th
                          key={`${group}-sales`}
                          className={`text-center py-1 px-1 text-[10px] font-bold border-r-0${gIdx === 0 ? ' border-l-gray-300' : ''}`}
                          style={{ backgroundColor: subBg, color: isTop ? PRIMARY : '#374151' }}
                        >
                          Sales ({currencySymbol})
                        </th>
                        <th
                          key={`${group}-qty`}
                          className="text-center py-1 px-1 text-[10px] font-bold border-l-0 border-r-gray-300"
                          style={{ backgroundColor: subBg, color: isTop ? PRIMARY : '#374151' }}
                        >
                          Qty
                        </th>
                      </>
                    );
                  })}
                  <th className="text-center py-1 px-1 text-[10px] text-gray-700 font-bold bg-gray-100 sticky right-[90px] z-20 border-l-gray-300 border-r-0" style={{ width: 120, minWidth: 120 }}>
                    Sales ({currencySymbol})
                  </th>
                  <th className="text-center py-1 px-1 text-[10px] text-gray-700 font-bold bg-gray-100 sticky right-0 z-20 border-l-0" style={{ width: 90, minWidth: 90 }}>
                    Qty
                  </th>
                </tr>
              </thead>
              <tbody>
                {months.map((monthRow, idx) => (
                  <tr key={idx} className={`hover:bg-blue-50/30 ${monthRow.grandTotal?.sales > 0 ? '' : 'opacity-50'}`}>
                    <td className="py-2.5 px-3 text-xs font-bold text-gray-900 bg-white sticky left-0 z-20 border-r-gray-300">{monthRow.label}</td>
                    {itemGroups.map((group, gIdx) => {
                      const groupData = monthRow.itemGroups?.[group] || { sales: 0, qty: 0 };
                      const isTop = group === topGroup;
                      const cellBg = isTop ? 'rgba(23,133,182,0.07)' : undefined;
                      return (
                        <>
                          <td key={`${group}-sales`} className={`py-2.5 px-2 text-center border-r-0${gIdx === 0 ? ' border-l-gray-300' : ''}`} style={{ backgroundColor: cellBg }}>
                            {groupData.sales > 0 ? (
                              <Tooltip title={formatAmount(groupData.sales)} placement="top">
                                <span className="text-xs font-semibold cursor-default" style={{ color: PRIMARY }}>
                                  {formatAmountShort(groupData.sales)}
                                </span>
                              </Tooltip>
                            ) : (
                              <span className="text-xs text-gray-300">-</span>
                            )}
                          </td>
                          <td key={`${group}-qty`} className="py-2.5 px-2 text-center border-l-0 border-r-gray-300" style={{ backgroundColor: cellBg }}>
                            <span className={`text-xs font-semibold ${groupData.qty > 0 ? 'text-gray-700' : 'text-gray-300'}`}>{groupData.qty > 0 ? groupData.qty.toLocaleString('en-IN') : '-'}</span>
                          </td>
                        </>
                      );
                    })}
                    <td className="py-2.5 px-2 text-center bg-gray-100 sticky right-[90px] z-10 border-l-gray-300 border-r-0" style={{ width: 120, minWidth: 120 }}>
                      {monthRow.grandTotal?.sales > 0 ? (
                        <Tooltip title={formatAmount(monthRow.grandTotal.sales)} placement="top">
                          <span className="text-xs font-bold text-gray-900 cursor-default">{formatAmountShort(monthRow.grandTotal.sales)}</span>
                        </Tooltip>
                      ) : (
                        <span className="text-xs text-gray-300">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-center bg-gray-100 sticky right-0 z-10 border-l-0" style={{ width: 90, minWidth: 90 }}>
                      <span className={`text-xs font-bold ${monthRow.grandTotal?.qty > 0 ? 'text-gray-800' : 'text-gray-300'}`}>
                        {monthRow.grandTotal?.qty > 0 ? monthRow.grandTotal.qty.toLocaleString('en-IN') : '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* YTD Total Row */}
              {months.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-50 font-semibold">
                    <td className="py-2.5 px-3 text-xs font-bold text-gray-800 bg-gray-50 sticky left-0 z-20 border-r-gray-300 border-t-gray-300">TOTAL</td>
                    {itemGroups.map((group, gIdx) => {
                      const totalSales = months.reduce((sum, m) => sum + (m.itemGroups?.[group]?.sales || 0), 0);
                      const totalQty = months.reduce((sum, m) => sum + (m.itemGroups?.[group]?.qty || 0), 0);
                      const isTop = group === topGroup;
                      const footBg = isTop ? 'rgba(23,133,182,0.13)' : undefined;
                      return (
                        <>
                          <td
                            key={`${group}-total-sales`}
                            className={`py-2.5 px-2 text-center border-t-gray-300 border-r-0${gIdx === 0 ? ' border-l-gray-300' : ''}`}
                            style={{ backgroundColor: footBg }}
                          >
                            {totalSales > 0 ? (
                              <Tooltip title={formatAmount(totalSales)} placement="top">
                                <span className="text-xs font-bold cursor-default" style={{ color: PRIMARY }}>
                                  {formatAmountShort(totalSales)}
                                </span>
                              </Tooltip>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                          <td key={`${group}-total-qty`} className="py-2.5 px-2 text-center border-t-gray-300 border-l-0 border-r-gray-300" style={{ backgroundColor: footBg }}>
                            <span className={`text-xs font-bold ${totalQty > 0 ? 'text-gray-800' : 'text-gray-400'}`}>{totalQty > 0 ? totalQty.toLocaleString('en-IN') : '-'}</span>
                          </td>
                        </>
                      );
                    })}
                    <td className="py-2.5 px-2 text-center bg-gray-100 sticky right-[90px] z-10 border-l-gray-300 border-t-gray-300 border-r-0" style={{ width: 120, minWidth: 120 }}>
                      {(() => {
                        const grandSales = months.reduce((sum, m) => sum + (m.grandTotal?.sales || 0), 0);
                        return (
                          <Tooltip title={formatAmount(grandSales)} placement="top">
                            <span className="text-xs font-bold text-gray-900 cursor-default">{formatAmountShort(grandSales)}</span>
                          </Tooltip>
                        );
                      })()}
                    </td>
                    <td className="py-2.5 px-2 text-center bg-gray-100 sticky right-0 z-10 border-t-gray-300 border-l-0" style={{ width: 90, minWidth: 90 }}>
                      <span className="text-xs font-bold text-gray-800">{months.reduce((sum, m) => sum + (m.grandTotal?.qty || 0), 0).toLocaleString('en-IN')}</span>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      {/* ── Credit & Collection Dashboard ──────────────────── */}
      <div className="bg-white border-l border-r border-b border-gray-200 -mx-4 px-4 pb-4">
        <CustomerCreditDashboard data={customerCreditDashboard} loading={customerCreditDashboardLoading} />
      </div>
    </>
  );
};

export default Customer360View;
