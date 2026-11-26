import StatusBadge from '@/components/ui/badge/StatusBadge';
import { Card } from '@/components/AntDComponent';
import Icons from '@/assets/icons/icon';
import { useCompanyCurrency } from '@/hooks/useCompanyCurrency';
import { colorPalette } from '@/utils/theme';
import { REJECTION_STATUS as STATUS } from '@/utils/dropdownEnums';

// Exact to 2 decimals, not whole rupees, so per-item amounts add up to the summary cards.
export const formatRecoveryAmount = value => Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

export function RejBadge({ s }) {
  const st = STATUS[s];
  return <StatusBadge status={s} value={st?.label ?? s ?? '-'} />;
}

export function MatchTag({ ok }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${ok ? 'text-green-700 bg-green-50' : 'text-amber-700 bg-amber-100'}`}>
      {ok ? (
        <>
          <Icons.CheckCircleOutlined className="text-xs" />
          OK
        </>
      ) : (
        <>
          <Icons.WarningOutlined className="text-xs" />
          Mismatch
        </>
      )}
    </span>
  );
}

export function SumCard({ label, value, color }) {
  return (
    <div className="bg-white border border-gray-200 border-l-[3px] rounded-lg px-[15px] py-[11px] min-w-[160px]" style={{ borderLeftColor: color }}>
      <div className="text-[10.5px] font-semibold text-gray-500 uppercase tracking-[0.03em]">{label}</div>
      <div className="text-lg font-extrabold mt-[3px]">{value}</div>
    </div>
  );
}

export function ActionBlock({ title, desc, children }) {
  return (
    <Card className="mb-3.5">
      <div className="font-bold text-base mb-1">{title}</div>
      <div className="text-gray-600 text-[13px] mb-4 max-w-[720px]">{desc}</div>
      {children}
    </Card>
  );
}

export function RecoverySummary({ agg }) {
  const { currencySymbol } = useCompanyCurrency();
  const cards = [
    { l: 'Rejection Cost', v: `${currencySymbol}${formatRecoveryAmount(agg.rejection)}`, c: colorPalette.error[600] },
    { l: 'Reuse Recovery', v: `${currencySymbol}${formatRecoveryAmount(agg.reuse)}`, c: colorPalette.success[700] },
    { l: 'Vendor Return', v: `${currencySymbol}${formatRecoveryAmount(agg.ret)}`, c: colorPalette.primary[500] },
    { l: 'Scrap Recovery', v: `${currencySymbol}${formatRecoveryAmount(agg.scrap)}`, c: colorPalette.warning[700] },
    { l: 'Total Recovered', v: `${currencySymbol}${formatRecoveryAmount(agg.total)}`, c: colorPalette.brand.teal },
    { l: 'Net Loss', v: `${currencySymbol}${formatRecoveryAmount(agg.net)}`, c: colorPalette.secondary[800] },
  ];
  const tot = agg.rejection || 1;
  return (
    <div>
      <div className="grid grid-cols-6 gap-2.5">
        {cards.map(c => (
          <div key={c.l} className="border border-gray-200 border-l-[3px] rounded-lg px-[11px] py-[9px]" style={{ borderLeftColor: c.c }}>
            <div className="text-[10.5px] font-semibold text-gray-500 uppercase">{c.l}</div>
            <div className="text-[15px] font-extrabold mt-[3px]">{c.v}</div>
          </div>
        ))}
      </div>
      <div className="mt-2.5 h-[9px] rounded-md bg-gray-100 overflow-hidden flex">
        <div className="bg-green-700" style={{ width: `${(agg.reuse / tot) * 100}%` }} />
        <div className="bg-primary" style={{ width: `${(agg.ret / tot) * 100}%` }} />
        <div className="bg-amber-700" style={{ width: `${(agg.scrap / tot) * 100}%` }} />
      </div>
      <div className="text-xs text-gray-500 mt-1.5">
        Recovery <b className="text-teal-600">{agg.pct.toFixed(1)}%</b> ·<span className="text-green-700 font-bold"> reuse</span> +<span className="text-primary font-bold"> vendor return</span> +
        <span className="text-amber-700 font-bold"> scrap</span>
      </div>
    </div>
  );
}
