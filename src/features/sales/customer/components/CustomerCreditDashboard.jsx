import { Tooltip } from '@/components/AntDComponent';
import CustomerCreditDashboardSkeleton from './CustomerCreditDashboardSkeleton';
import { formatAmount, formatAmountShort } from '@/utils/currency';
import { colorPalette } from '@/utils/theme';

const ORANGE = '#ea580c';
const GREEN = '#16a34a';
const RED = '#dc2626';
const BLUE = colorPalette.primary[500];
const BAR_GREEN = '#22c55e';

const shortMonthLabel = full => {
  if (!full || typeof full !== 'string') return '—';
  const parts = full.trim().split(/\s+/);
  return parts[0] || full;
};

const currentMonthYearKey = () => {
  const d = new Date();
  const mon = d.toLocaleString('en-GB', { month: 'short' });
  const capitalized = mon.length ? mon.charAt(0).toUpperCase() + mon.slice(1) : mon;
  return `${capitalized} ${d.getFullYear()}`;
};

const buildDonutBackground = (utilized, available, overdue45) => {
  const u = Math.max(0, Number(utilized) || 0);
  const a = Math.max(0, Number(available) || 0);
  const o = Math.max(0, Number(overdue45) || 0);
  const sum = u + a + o;
  if (sum <= 0) {
    return { background: 'conic-gradient(#e5e7eb 0deg 360deg)' };
  }
  let angle = 0;
  const slices = [];
  const pushSlice = (color, portion) => {
    if (portion <= 0) return;
    const deg = (portion / sum) * 360;
    const end = angle + deg;
    slices.push(`${color} ${angle}deg ${end}deg`);
    angle = end;
  };
  pushSlice(ORANGE, u);
  pushSlice(GREEN, a);
  pushSlice(RED, o);
  if (angle < 359.5) {
    slices.push(`#e5e7eb ${angle}deg 360deg`);
  }
  return { background: `conic-gradient(${slices.join(', ')})` };
};

const creditHealthBadge = (availableCredit, totalCredit, utilizedCredit) => {
  if (availableCredit < 0) return { label: 'OVER LIMIT', className: 'bg-red-100 text-red-800' };
  if (totalCredit > 0 && utilizedCredit / totalCredit >= 0.85) return { label: 'HIGH USE', className: 'bg-amber-100 text-amber-800' };
  if (availableCredit > 0) return { label: 'HEALTHY', className: 'bg-emerald-100 text-emerald-800' };
  return { label: '—', className: 'bg-gray-100 text-gray-600' };
};

const InfoIcon = ({ text }) => (
  <Tooltip title={<span className="text-xs leading-relaxed whitespace-pre-line">{text}</span>} placement="topLeft">
    <span className="cursor-help text-gray-400 hover:text-gray-600 inline-flex items-center shrink-0 ml-1">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    </span>
  </Tooltip>
);

const CustomerCreditDashboard = ({ data, loading }) => {
  if (loading) {
    return <CustomerCreditDashboardSkeleton />;
  }

  if (!data) {
    return (
      <div className="pt-4">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Monthly Collection & Credit Dashboard</h3>
        <p className="text-xs text-gray-500">Credit dashboard could not be loaded.</p>
      </div>
    );
  }

  const { financialYear, monthlyPayments = [], creditSummary = {} } = data;
  const { totalCredit = 0, utilizedCredit = 0, availableCredit = 0, overdueCredit = 0, overdue45Days = 0 } = creditSummary;

  const ytdTotal = monthlyPayments.reduce((s, m) => s + (Number(m?.amount) || 0), 0);
  const maxPayment = Math.max(...monthlyPayments.map(m => Number(m?.amount) || 0), 1);
  const nowKey = currentMonthYearKey();

  const utilizationPct = totalCredit > 0 ? Math.min(100, Math.round((utilizedCredit / totalCredit) * 100)) : utilizedCredit > 0 ? 100 : 0;
  const utilizationBarFill = totalCredit > 0 ? utilizationPct : utilizedCredit > 0 ? 100 : 0;

  const donutAvailableSlice = Math.max(0, availableCredit);
  const { background: donutBg } = buildDonutBackground(utilizedCredit, donutAvailableSlice, overdue45Days);

  const health = creditHealthBadge(availableCredit, totalCredit, utilizedCredit);

  return (
    <div className="pt-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">Monthly Collection & Credit Dashboard</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Monthly Collection */}
        <div className="border border-gray-200 bg-white p-4 shadow-sm flex flex-col">
          <div className="flex items-start justify-between gap-2 pb-2 border-b border-gray-200">
            <div className="flex items-center">
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Monthly Collection (₹)</span>
              <InfoIcon text={'Month-wise breakdown of payments received from this customer in the current financial year.'} />
            </div>
            <Tooltip title={formatAmount(ytdTotal)} placement="top">
              <span className="text-[10px] sm:text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded whitespace-nowrap cursor-default">{formatAmountShort(ytdTotal)} YTD</span>
            </Tooltip>
          </div>
          <div className="pt-3 space-y-1">
            {monthlyPayments.map((row, idx) => {
              const amt = Number(row?.amount) || 0;
              const pct = maxPayment > 0 ? (amt / maxPayment) * 100 : 0;
              const isCurrent = row?.month === nowKey;
              return (
                <div key={row?.month || idx} className="flex items-center gap-2 text-[11px] leading-tight">
                  <span className="w-7 shrink-0 font-medium text-gray-600">{shortMonthLabel(row?.month)}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden min-w-0">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: isCurrent ? BLUE : BAR_GREEN,
                      }}
                    />
                  </div>
                  <Tooltip title={formatAmount(amt)} placement="top">
                    <span className="w-20 shrink-0 text-right text-gray-800 font-medium tabular-nums text-[11px] cursor-default">{amt > 0 ? formatAmountShort(amt) : '0'}</span>
                  </Tooltip>
                </div>
              );
            })}
          </div>
        </div>

        {/* Total Credit Limit */}
        <div className="border border-gray-200 bg-white p-4 shadow-sm flex flex-col">
          <div className="flex items-start justify-between gap-2 pb-3 border-b border-gray-200">
            <div className="flex items-center">
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Total Credit Limit</span>
              <InfoIcon text={'Maximum credit amount allowed for this customer.\nIf branch-wise limits are configured, this shows the total across all branches.'} />
            </div>
          </div>
          <div className="pt-3">
            <Tooltip title={formatAmount(totalCredit)} placement="top">
              <p className="text-2xl font-bold text-primary tabular-nums cursor-default w-fit">{formatAmountShort(totalCredit)}</p>
            </Tooltip>
            <p className="text-[11px] text-gray-500 mt-1">Sanctioned limit - FY {financialYear || '—'}</p>
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="rounded-md bg-gray-50 border border-gray-100 px-2 py-2 text-center">
                <p className="text-[10px] text-gray-500 uppercase">Limit</p>
                <Tooltip title={formatAmount(totalCredit)} placement="top">
                  <p className="text-xs font-semibold text-gray-900 truncate cursor-default">{formatAmountShort(totalCredit)}</p>
                </Tooltip>
              </div>
              <div className="rounded-md bg-gray-50 border border-gray-100 px-2 py-2 text-center">
                <p className="text-[10px] text-gray-500 uppercase">Used</p>
                <Tooltip title={formatAmount(utilizedCredit)} placement="top">
                  <p className="text-xs font-semibold text-gray-900 truncate cursor-default">{formatAmountShort(utilizedCredit)}</p>
                </Tooltip>
              </div>
              <div className="rounded-md bg-gray-50 border border-gray-100 px-2 py-2 text-center">
                <p className="text-[10px] text-gray-500 uppercase">Avail.</p>
                <Tooltip title={formatAmount(Math.max(0, availableCredit))} placement="top">
                  <p className="text-xs font-semibold text-gray-900 truncate cursor-default">{formatAmountShort(Math.max(0, availableCredit))}</p>
                </Tooltip>
              </div>
            </div>
            {availableCredit < 0 ? (
              <div className="mt-3 text-[11px] text-amber-900 bg-amber-50 border border-amber-100 rounded-md px-2 py-2">
                Utilization exceeds sanctioned limit by {formatAmount(Math.abs(availableCredit))}.
              </div>
            ) : null}
          </div>
        </div>

        {/* Credit Utilization */}
        <div className="border border-gray-200 bg-white p-4 shadow-sm flex flex-col">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-200">
            <div className="flex items-center">
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Credit Utilization</span>
              <InfoIcon text={'Total unpaid invoice amount currently outstanding against this customer.\nUtilization % = Outstanding ÷ Credit Limit × 100'} />
            </div>
            <span className="text-xs font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">{totalCredit > 0 ? `${utilizationPct}%` : utilizedCredit > 0 ? '100%' : '0%'}</span>
          </div>
          <div className="flex items-center gap-4 flex-1 pt-3">
            <div className="relative shrink-0 w-[100px] h-[100px]">
              <div
                className="w-full h-full rounded-full"
                style={{
                  background: donutBg,
                  mask: 'radial-gradient(farthest-side, transparent calc(100% - 12px), #000 calc(100% - 11px))',
                  WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 12px), #000 calc(100% - 11px))',
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-sm font-bold text-gray-800">{totalCredit > 0 ? `${utilizationPct}%` : utilizedCredit > 0 ? '100%' : '0%'}</span>
              </div>
            </div>
            <ul className="flex-1 space-y-2 text-xs min-w-0">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: ORANGE }} />
                <span className="text-gray-600">Utilized</span>
                <Tooltip title={formatAmount(utilizedCredit)} placement="top">
                  <span className="ml-auto font-semibold text-gray-900 tabular-nums cursor-default">{formatAmountShort(utilizedCredit)}</span>
                </Tooltip>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: GREEN }} />
                <span className="text-gray-600">Available</span>
                <Tooltip title={formatAmount(Math.max(0, availableCredit))} placement="top">
                  <span className="ml-auto font-semibold text-gray-900 tabular-nums cursor-default">{formatAmountShort(Math.max(0, availableCredit))}</span>
                </Tooltip>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: RED }} />
                <span className="text-gray-600">Overdue &gt;45d</span>
                <Tooltip title={formatAmount(overdue45Days)} placement="top">
                  <span className="ml-auto font-semibold text-gray-900 tabular-nums cursor-default">{formatAmountShort(overdue45Days)}</span>
                </Tooltip>
              </li>
            </ul>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
              <span>Utilization</span>
              <span>{utilizationBarFill > 0 ? `${utilizationBarFill}%` : '0%'}</span>
            </div>
            <div className="relative h-1.5 rounded-full overflow-hidden bg-gray-100">
              <div className="absolute inset-0 rounded-full" style={{ background: 'linear-gradient(90deg, #22c55e 0%, #eab308 50%, #dc2626 100%)' }} />
              <div className="absolute inset-y-0 right-0 bg-gray-100 transition-[width] duration-300" style={{ width: `${100 - utilizationBarFill}%` }} />
            </div>
          </div>
        </div>

        {/* Available Credit */}
        <div className="border border-gray-200 bg-white p-4 shadow-sm flex flex-col">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-200">
            <div className="flex items-center">
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Available Credit</span>
              <InfoIcon text={'Remaining credit available for new orders.\nAvailable = Credit Limit − Outstanding Amount\nNegative means this customer has exceeded their credit limit.'} />
            </div>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${health.className}`}>{health.label}</span>
          </div>
          <div className="pt-3 flex flex-col flex-1 min-h-0">
            <Tooltip title={formatAmount(availableCredit)} placement="top">
              <p className={`text-2xl font-bold tabular-nums cursor-default w-fit ${availableCredit < 0 ? 'text-red-600' : 'text-emerald-600'}`}>{formatAmountShort(availableCredit)}</p>
            </Tooltip>
            <p className="text-[11px] text-gray-500 mt-1">Net free limit for new orders</p>
            <ul className="mt-3 space-y-2 text-xs border-t border-gray-100 pt-3">
              <li className="flex justify-between gap-2">
                <span className="text-gray-600">Overdue outstanding</span>
                <Tooltip title={formatAmount(overdueCredit)} placement="top">
                  <span className="font-medium text-gray-900 tabular-nums cursor-default">{formatAmountShort(overdueCredit)}</span>
                </Tooltip>
              </li>
              <li className="flex justify-between gap-2">
                <span className="text-gray-600">Overdue &gt;45 days</span>
                <Tooltip title={formatAmount(overdue45Days)} placement="top">
                  <span className="font-medium text-gray-900 tabular-nums cursor-default">{formatAmountShort(overdue45Days)}</span>
                </Tooltip>
              </li>
              <li className="flex justify-between gap-2 pt-2 border-t border-gray-100 font-semibold">
                <span className="text-gray-800">Net available</span>
                <Tooltip title={formatAmount(availableCredit)} placement="top">
                  <span className={`tabular-nums cursor-default ${availableCredit < 0 ? 'text-red-600' : 'text-gray-900'}`}>{formatAmountShort(availableCredit)}</span>
                </Tooltip>
              </li>
            </ul>
            <div
              className={`mt-auto pt-3 text-[11px] rounded-md px-2 py-2 border ${availableCredit >= 0 ? 'text-emerald-800 bg-emerald-50 border-emerald-100' : 'text-red-800 bg-red-50 border-red-100'}`}
            >
              {availableCredit >= 0 ? 'Sufficient headroom against sanctioned limit for new orders.' : 'Available credit is negative: collections or limit review may be required before new orders.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerCreditDashboard;
