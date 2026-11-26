import { Fragment, useMemo } from 'react';
import { Skeleton, Tooltip } from '@/components/AntDComponent';
import Icons from '@/assets/icons/icon';
import { formatAmountShort, formatAmount, toDecimalString } from '@/utils/currency';
import { colorPalette } from '@/utils/theme';

const PRIMARY = colorPalette.primary[500];
const CONTRIBUTION_UP_COLOR = colorPalette.success[600];
const CONTRIBUTION_DOWN_COLOR = colorPalette.error[600];
// Light-green tint marking each month's highest-selling group (distinct from the primary-blue overall top-group column tint).
const BEST_GROUP_BG = 'rgba(34, 197, 94, 0.14)';

// Always returns { icon, color } so callers can use .color for text and .icon for the trend arrow
// consistently. icon is null when there's nothing to compare against (zero/first month).
const getContributionColor = (current, previousValue, hasPreviousMonth) => {
  if (!current || current <= 0) return { icon: null, color: colorPalette.neutral[300] };
  if (!hasPreviousMonth) return { icon: null, color: colorPalette.secondary[700] };

  const curr = Number(current) || 0;
  const prev = Number(previousValue) || 0;
  if (curr > prev) {
    return {
      icon: <Icons.CaretUpFilled className="text-[12px]" />,
      color: CONTRIBUTION_UP_COLOR,
    };
  }

  if (curr < prev) {
    return {
      icon: <Icons.CaretDownFilled className="text-[12px]" />,
      color: CONTRIBUTION_DOWN_COLOR,
    };
  }

  return {
    icon: <Icons.MinusOutlined className="text-[12px]" />,
    color: colorPalette.secondary[700],
  };
};

const ItemGroupMonthlySalesTable = ({ monthlySales, loading, title = 'Item Group Sales', subtitle = 'Month-wise Sales, Qty & Contribution', extra }) => {
  const itemGroups = monthlySales?.itemGroups || [];
  const months = monthlySales?.months || [];

  const groupSalesTotals = useMemo(() => {
    const map = {};
    itemGroups.forEach(group => {
      map[group] = months.reduce((sum, m) => sum + (m.itemGroups?.[group]?.sales || 0), 0);
    });
    return map;
  }, [itemGroups, months]);

  const groupQtyTotals = useMemo(() => {
    const map = {};
    itemGroups.forEach(group => {
      map[group] = months.reduce((sum, m) => sum + (m.itemGroups?.[group]?.qty || 0), 0);
    });
    return map;
  }, [itemGroups, months]);

  const totalGrandSales = useMemo(() => months.reduce((sum, m) => sum + (m.grandTotal?.sales || 0), 0), [months]);
  const totalGrandQty = useMemo(() => months.reduce((sum, m) => sum + (m.grandTotal?.qty || 0), 0), [months]);

  const groupPct = group => (totalGrandSales > 0 ? toDecimalString(((groupSalesTotals[group] || 0) / totalGrandSales) * 100) : null);

  const topGroup = useMemo(() => {
    if (itemGroups.length === 0) return null;
    const best = itemGroups.reduce((b, g) => ((groupSalesTotals[g] || 0) > (groupSalesTotals[b] || 0) ? g : b), itemGroups[0]);
    return (groupSalesTotals[best] || 0) > 0 ? best : null;
  }, [itemGroups, groupSalesTotals]);

  // Per month, the item group with the highest sales (its Sales/Qty/Contribution cells are highlighted).
  // Keyed by month index → group name. Ties → earliest group; months with no sales have no winner.
  const bestGroupByMonth = useMemo(() => {
    const map = {};
    months.forEach((m, i) => {
      let bestGroup = null;
      let bestSales = 0;
      itemGroups.forEach(group => {
        const sales = m.itemGroups?.[group]?.sales || 0;
        if (sales > bestSales) {
          bestSales = sales;
          bestGroup = group;
        }
      });
      if (bestGroup) map[i] = bestGroup;
    });
    return map;
  }, [months, itemGroups]);

  if (loading) {
    return (
      <div className="bg-white border-x border-b border-gray-200 p-4">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="ds-shimmer h-3 w-48" />
          {extra}
        </div>
        <Skeleton active paragraph={{ rows: 6 }} title={false} />
      </div>
    );
  }

  if (!months.length || !itemGroups.length) {
    return (
      <div className="bg-white border-x border-b border-gray-200 p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
          {extra}
        </div>
        <div className="h-[120px] flex flex-col items-center justify-center text-gray-400 border border-dashed border-gray-200 rounded-md">
          <Icons.InboxOutlined className="text-3xl mb-2" />
          <span className="text-xs">No item group sales data for the selected period</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-x border-b border-gray-200 p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-sm font-semibold text-gray-700">
          {title}
          <span className="text-xs font-medium text-gray-400 ml-2">{subtitle}</span>
        </h3>
        {extra}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse [&_th]:border [&_td]:border [&_th]:border-gray-200 [&_td]:border-gray-200">
          <thead>
            <tr>
              <th rowSpan={2} className="text-left py-2 px-3 text-xs font-bold text-gray-700 uppercase bg-gray-50 sticky left-0 z-30 min-w-[80px] align-bottom border-r-gray-300">
                Month
              </th>
              {itemGroups.map((group, gIdx) => {
                const isTop = group === topGroup;
                const pct = groupPct(group);
                return (
                  <th
                    key={group}
                    colSpan={3}
                    className={`text-center py-2 px-2 text-xs font-semibold min-w-[210px] border-r-gray-300${gIdx === 0 ? ' border-l-gray-300' : ''}`}
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
                    {pct !== null && (
                      <div className="text-[10px] font-semibold mt-0.5" style={{ color: PRIMARY }}>
                        {pct}%
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
                  <Fragment key={group}>
                    <th
                      className={`text-center py-1 px-1 text-[10px] font-bold border-r-0${gIdx === 0 ? ' border-l-gray-300' : ''}`}
                      style={{ backgroundColor: subBg, color: isTop ? PRIMARY : '#374151' }}
                    >
                      Sales (₹)
                    </th>
                    <th className="text-center py-1 px-1 text-[10px] font-bold border-l-0 border-r-0" style={{ backgroundColor: subBg, color: isTop ? PRIMARY : '#374151' }}>
                      Qty
                    </th>
                    <th className="text-center py-1 px-1 text-[10px] font-bold border-l-0 border-r-gray-300" style={{ backgroundColor: subBg, color: isTop ? PRIMARY : '#374151' }}>
                      Contribution
                    </th>
                  </Fragment>
                );
              })}
              <th className="text-center py-1 px-1 text-[10px] text-gray-700 font-bold bg-gray-100 sticky right-[90px] z-20 border-l-gray-300 border-r-0" style={{ width: 120, minWidth: 120 }}>
                Sales (₹)
              </th>
              <th className="text-center py-1 px-1 text-[10px] text-gray-700 font-bold bg-gray-100 sticky right-0 z-20 border-l-0" style={{ width: 90, minWidth: 90 }}>
                Qty
              </th>
            </tr>
          </thead>
          <tbody>
            {months.map((monthRow, idx) => {
              const bestGroupThisMonth = bestGroupByMonth[idx];
              return (
                <tr key={`${monthRow.label}-${idx}`} className={`hover:bg-blue-50/30 ${monthRow.grandTotal?.sales > 0 ? '' : 'opacity-50'}`}>
                  <td className="py-2.5 px-3 text-xs font-bold text-gray-900 bg-white sticky left-0 z-20 border-r-gray-300">{monthRow.label}</td>
                  {itemGroups.map((group, gIdx) => {
                    const groupData = monthRow.itemGroups?.[group] || { sales: 0, qty: 0, contribution: 0 };
                    const previousContribution = idx > 0 ? months[idx - 1]?.itemGroups?.[group]?.contribution : null;
                    const contributionColor = getContributionColor(groupData.contribution, previousContribution, idx > 0);
                    const isTop = group === topGroup;
                    // The month's highest-selling group gets an amber tint across its three cells; this
                    // takes precedence over the overall top-group (blue) column tint.
                    const isMonthBest = group === bestGroupThisMonth;
                    const cellBg = isMonthBest ? BEST_GROUP_BG : isTop ? 'rgba(23,133,182,0.07)' : undefined;
                    return (
                      <Fragment key={group}>
                        <td className={`py-2.5 px-2 text-center border-r-0${gIdx === 0 ? ' border-l-gray-300' : ''}`} style={{ backgroundColor: cellBg }}>
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
                        <td className="py-2.5 px-2 text-center border-l-0 border-r-0" style={{ backgroundColor: cellBg }}>
                          <span className={`text-xs font-semibold ${groupData.qty > 0 ? 'text-gray-700' : 'text-gray-300'}`}>{groupData.qty > 0 ? groupData.qty.toLocaleString('en-IN') : '-'}</span>
                        </td>
                        <td className="py-2.5 px-2 text-center border-l-0 border-r-gray-300" style={{ backgroundColor: cellBg }}>
                          {groupData?.contribution > 0 ? (
                            <div className="flex items-center justify-center gap-1">
                              {contributionColor?.icon && (
                                <span className="text-[10px]" style={{ color: contributionColor.color }}>
                                  {contributionColor.icon}
                                </span>
                              )}

                              <span className="text-xs font-bold" style={{ color: contributionColor?.color }}>
                                {groupData.contribution}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-300">-</span>
                          )}
                        </td>
                      </Fragment>
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
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 font-semibold">
              <td className="py-2.5 px-3 text-xs font-bold text-gray-800 bg-gray-50 sticky left-0 z-20 border-r-gray-300 border-t-gray-300">TOTAL</td>
              {itemGroups.map((group, gIdx) => {
                const totalSales = groupSalesTotals[group] || 0;
                const totalQty = groupQtyTotals[group] || 0;
                const totalContributionPct = groupPct(group);
                const isTop = group === topGroup;
                const footBg = isTop ? 'rgba(23,133,182,0.13)' : undefined;
                return (
                  <Fragment key={group}>
                    <td className={`py-2.5 px-2 text-center border-t-gray-300 border-r-0${gIdx === 0 ? ' border-l-gray-300' : ''}`} style={{ backgroundColor: footBg }}>
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
                    <td className="py-2.5 px-2 text-center border-t-gray-300 border-l-0 border-r-0" style={{ backgroundColor: footBg }}>
                      <span className={`text-xs font-bold ${totalQty > 0 ? 'text-gray-800' : 'text-gray-400'}`}>{totalQty > 0 ? totalQty.toLocaleString('en-IN') : '-'}</span>
                    </td>
                    <td className="py-2.5 px-2 text-center border-t-gray-300 border-l-0 border-r-gray-300" style={{ backgroundColor: footBg }}>
                      {totalContributionPct != null ? <span className="text-xs font-bold text-gray-800">{totalContributionPct}%</span> : <span className="text-xs text-gray-400">-</span>}
                    </td>
                  </Fragment>
                );
              })}
              <td className="py-2.5 px-2 text-center bg-gray-100 sticky right-[90px] z-10 border-l-gray-300 border-t-gray-300 border-r-0" style={{ width: 120, minWidth: 120 }}>
                {totalGrandSales > 0 ? (
                  <Tooltip title={formatAmount(totalGrandSales)} placement="top">
                    <span className="text-xs font-bold text-gray-900 cursor-default">{formatAmountShort(totalGrandSales)}</span>
                  </Tooltip>
                ) : (
                  <span className="text-xs text-gray-400">-</span>
                )}
              </td>
              <td className="py-2.5 px-2 text-center bg-gray-100 sticky right-0 z-10 border-t-gray-300 border-l-0" style={{ width: 90, minWidth: 90 }}>
                <span className={`text-xs font-bold ${totalGrandQty > 0 ? 'text-gray-800' : 'text-gray-400'}`}>{totalGrandQty > 0 ? totalGrandQty.toLocaleString('en-IN') : '-'}</span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default ItemGroupMonthlySalesTable;
