const StatusBadge = ({ status, value, accentHex }) => {
  if (accentHex) {
    const base = accentHex.startsWith('#') ? accentHex.slice(0, 7) : `#${accentHex.replace(/^#/, '').slice(0, 6)}`;
    const bgTint = /^#[0-9A-Fa-f]{6}$/.test(base) ? `${base}1a` : undefined;
    return (
      <span
        className={`inline-flex items-center gap-1.5 py-0.5 px-2.5 rounded-full text-xs font-medium ring-1 ring-inset w-fit min-w-0 max-w-[min(100%,280px)] whitespace-nowrap text-gray-700 ${
          !bgTint ? 'bg-gray-50 ring-gray-500/20' : ''
        }`}
        style={
          bgTint
            ? {
                backgroundColor: bgTint,
                boxShadow: `inset 0 0 0 1px ${base}40`,
              }
            : undefined
        }
      >
        <span aria-hidden className={`w-1.5 h-1.5 rounded-full shrink-0 ring-1 ring-white/60`} style={{ backgroundColor: base }} />
        <span className="truncate">{value}</span>
      </span>
    );
  }

  const getStatusColor = status => {
    switch (status) {
      // Positive statuses - Green variants
      case 'ACCEPTED':
        return 'bg-green-50 text-green-700 ring-green-600/20 dot-green-500';
      case 'FULFILLED':
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dot-emerald-500';
      case 'PAID':
        return 'bg-teal-50 text-teal-700 ring-teal-600/20 dot-teal-500';
      case 'DELIVERED':
        return 'bg-green-50 text-green-700 ring-green-600/20 dot-green-500';
      case 'CONVERTED':
        return 'bg-lime-50 text-lime-700 ring-lime-600/20 dot-lime-500';
      case 'APPROVED':
        return 'bg-green-50 text-green-700 ring-green-600/20 dot-green-500';
      case 'DEPOSIT':
        return 'bg-green-50 text-green-700 ring-green-600/20 dot-green-500';
      case true:
        return 'bg-green-50 text-green-700 ring-green-600/20 dot-green-500';
      case 'Active':
      case 'active':
        return 'bg-green-50 text-green-700 ring-green-600/20 dot-green-500';
      case 'ACTIVE':
        return 'bg-green-50 text-green-700 ring-green-600/20 dot-green-500';
      case 'PAUSED':
        return 'bg-amber-50 text-amber-700 ring-amber-600/20 dot-amber-500';
      case 'ON_HOLD':
        return 'bg-gray-100 text-gray-600 ring-gray-500/20 dot-gray-400';
      case 'SUCCESS':
        return 'bg-green-50 text-green-700 ring-green-600/20 dot-green-500';
      case 'Normal':
      case 'NORMAL':
      case 'AVAILABLE':
        return 'bg-green-50 text-green-700 ring-green-600/20 dot-green-500';
      case 'Below Minimum':
      case 'BELOW_MINIMUM':
      case 'INSUFFICIENT_STOCK':
      case 'UNAVAILABLE':
      case 'ISSUES':
        return 'bg-red-50 text-red-700 ring-red-600/20 dot-red-500';
      case 'Above Maximum':
      case 'ABOVE_MAXIMUM':
      case 'TIGHT':
      case 'PARTIALLY_AVAILABLE':
      case 'PARTIALLY_READY':
        return 'bg-amber-50 text-amber-700 ring-amber-600/20 dot-amber-500';
      case 'No Range':
      case 'NO_RANGE':
        return 'bg-gray-100 text-gray-600 ring-gray-500/20 dot-gray-400';

      // Negative statuses - Red variants
      case 'REJECTED':
        return 'bg-red-50 text-red-700 ring-red-600/20 dot-red-500';
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-700 ring-rose-600/20 dot-rose-500';
      case 'OVERDUE':
        return 'bg-red-50 text-red-700 ring-red-600/20 dot-red-500';
      case 'WITHDRAWAL':
        return 'bg-red-50 text-red-700 ring-red-600/20 dot-red-500';
      case 'WAITING_FOR_INVENTORY_APPROVAL':
        return 'bg-red-50 text-red-700 ring-red-600/20 dot-red-500';
      case 'UNDER_REVIEW':
      case 'PENDING':
      case 'pending':
        return 'bg-amber-50 text-amber-700 ring-amber-600/20 dot-amber-500';
      case 'FAILED':
        return 'bg-red-50 text-red-700 ring-red-600/20 dot-red-500';
      case false:
        return 'bg-red-50 text-red-700 ring-red-600/20 dot-red-500';
      case 'RECEIVED':
        return 'bg-blue-50 text-blue-700 ring-blue-600/20 dot-blue-500';
      case 'REJECTION_COUNTED':
        return 'bg-yellow-50 text-yellow-700 ring-yellow-600/20 dot-yellow-500';
      case 'SETTLED':
        return 'bg-violet-50 text-violet-700 ring-violet-600/20 dot-violet-500';
      case 'SORTED':
        return 'bg-indigo-50 text-indigo-700 ring-indigo-600/20 dot-indigo-500';
      case 'DEVOLVED':
        return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dot-emerald-500';

      // Warning statuses - Yellow/Orange variants
      case 'EXPIRED':
      case 'ADVANCE':
        return 'bg-amber-50 text-amber-700 ring-amber-600/20 dot-amber-500';
      case 'PARTIALLY_PAID':
      case 'PARTIALLY_RECORDED':
      case 'PARTIALLY_USED':
      case 'INVENTORY_REJECTED':
        return 'bg-yellow-50 text-yellow-700 ring-yellow-600/20 dot-yellow-500';

      // Neutral/in-progress statuses - Blue/Gray variants
      case 'DRAFT':
        return 'bg-slate-50 text-slate-600 ring-slate-500/20 dot-slate-400';
      case 'SUBMITTED':
      case 'SENT':
      case 'INVOICE':
        return 'bg-blue-50 text-blue-700 ring-blue-600/20 dot-blue-500';
      case 'BILL':
        return 'bg-blue-50 text-blue-700 ring-blue-600/20 dot-blue-500';
      case 'TRANSFER':
        return 'bg-blue-50 text-blue-700 ring-blue-600/20 dot-blue-500';
      case 'OPEN':
      case 'RAISED':
        return 'bg-sky-50 text-sky-700 ring-sky-600/20 dot-sky-500';
      case 'INVOICED':
        return 'bg-indigo-50 text-indigo-700 ring-indigo-600/20 dot-indigo-500';
      case 'CLOSED':
        return 'bg-zinc-100 text-zinc-600 ring-zinc-500/20 dot-zinc-400';
      case 'RECORDED':
        return 'bg-violet-50 text-violet-700 ring-violet-600/20 dot-violet-500';
      case 'USED':
        return 'bg-purple-50 text-purple-700 ring-purple-600/20 dot-purple-500';
      case 'INVENTORY_ISSUED':
      case 'ISSUED':
        return 'bg-blue-50 text-blue-700 ring-blue-600/20 dot-blue-500';
      case 'SHORT':
        return 'bg-orange-50 text-orange-700 ring-orange-600/20 dot-orange-500';
      case 'PARTIAL':
      case 'PARTIALLY_COMPLETED':
        return 'bg-blue-50 text-blue-700 ring-blue-600/20 dot-blue-500';
      case 'IN_PROGRESS':
        return 'bg-sky-50 text-sky-700 ring-sky-600/20 dot-sky-500';
      case 'PROCESS_ROUTE':
        return 'bg-blue-50 text-blue-700 ring-blue-600/20 dot-blue-500';
      case 'BOM_BASED':
        return 'bg-violet-50 text-violet-700 ring-violet-600/20 dot-violet-500';

      // Maintenance purchase stages
      case 'PR':
        return 'bg-amber-50 text-amber-700 ring-amber-600/20 dot-amber-500';
      case 'PO':
        return 'bg-indigo-50 text-indigo-700 ring-indigo-600/20 dot-indigo-500';

      // Maintenance request type and priority
      case 'BREAKDOWN':
        return 'bg-orange-50 text-orange-700 ring-orange-600/20 dot-orange-500';
      case 'PREVENTIVE':
        return 'bg-blue-50 text-blue-700 ring-blue-600/20 dot-blue-500';
      case 'CORRECTIVE':
        return 'bg-amber-50 text-amber-700 ring-amber-600/20 dot-amber-500';
      case 'CRITICAL':
        return 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-600/20 dot-fuchsia-500';
      case 'HIGH':
        return 'bg-red-50 text-red-700 ring-red-600/20 dot-red-500';
      case 'MEDIUM':
        return 'bg-orange-50 text-orange-700 ring-orange-600/20 dot-orange-500';
      case 'LOW':
        return 'bg-green-50 text-green-700 ring-green-600/20 dot-green-500';

      // Inactive statuses - Red variants
      case 'inactive':
      case 'INACTIVE':
      case 'Inactive':
        return 'bg-red-50 text-red-700 ring-red-600/20 dot-red-500';
      case 'VOID':
        return 'bg-slate-100 text-slate-500 ring-slate-400/20 dot-slate-400';

      default:
        return 'bg-gray-100 text-gray-600 ring-gray-500/20 dot-gray-400';
    }
  };

  const getDotColor = status => {
    switch (status) {
      case 'ACCEPTED':
      case 'PAID':
      case 'SUCCESS':
      case 'DELIVERED':
      case 'CONVERTED':
      case 'APPROVED':
      case 'DEPOSIT':
      case true:
      case 'Active':
      case 'active':
      case 'ACTIVE':
      case 'Normal':
      case 'NORMAL':
      case 'AVAILABLE':
        return 'bg-green-500';
      case 'inactive':
      case 'INACTIVE':
      case 'Inactive':
      case 'Below Minimum':
      case 'INSUFFICIENT_STOCK':
      case 'UNAVAILABLE':
      case 'ISSUES':
        return 'bg-red-500';
      case 'Above Maximum':
      case 'TIGHT':
      case 'PARTIALLY_AVAILABLE':
      case 'PARTIALLY_READY':
        return 'bg-amber-500';
      case 'No Range':
        return 'bg-gray-400';
      case 'PAUSED':
        return 'bg-amber-500';
      case 'ON_HOLD':
        return 'bg-gray-400';
      case 'FULFILLED':
      case 'COMPLETED':
        return 'bg-emerald-500';
      case 'REJECTED':
      case 'OVERDUE':
      case 'WITHDRAWAL':
      case 'WAITING_FOR_INVENTORY_APPROVAL':
      case false:
        return 'bg-red-500';
      case 'UNDER_REVIEW':
      case 'PENDING':
      case 'pending':
        return 'bg-amber-500';
      case 'FAILED':
      case 'CANCELLED':
        return 'bg-rose-500';
      case 'RECEIVED':
        return 'bg-blue-500';
      case 'REJECTION_COUNTED':
        return 'bg-yellow-500';
      case 'SETTLED':
        return 'bg-violet-500';
      case 'SORTED':
        return 'bg-indigo-500';
      case 'DEVOLVED':
        return 'bg-emerald-500';
      case 'EXPIRED':
      case 'ADVANCE':
        return 'bg-amber-500';
      case 'PARTIALLY_PAID':
      case 'PARTIALLY_RECORDED':
      case 'PARTIALLY_USED':
      case 'INVENTORY_REJECTED':
        return 'bg-yellow-500';
      case 'DRAFT':
        return 'bg-slate-400';
      case 'SUBMITTED':
      case 'SENT':
      case 'INVOICE':
      case 'TRANSFER':
      case 'INVENTORY_ISSUED':
      case 'ISSUED':
      case 'PARTIAL':
      case 'PARTIALLY_COMPLETED':
      case 'PROCESS_ROUTE':
        return 'bg-blue-500';
      case 'IN_PROGRESS':
        return 'bg-sky-500';
      case 'BOM_BASED':
        return 'bg-violet-500';
      case 'BILL':
        return 'bg-blue-500';
      case 'OPEN':
      case 'RAISED':
        return 'bg-sky-500';
      case 'INVOICED':
      case 'PO':
        return 'bg-indigo-500';
      case 'CLOSED':
      case 'VOID':
        return 'bg-zinc-400';
      case 'RECORDED':
        return 'bg-violet-500';
      case 'USED':
        return 'bg-purple-500';
      case 'PR':
        return 'bg-amber-500';
      case 'BREAKDOWN':
      case 'MEDIUM':
      case 'SHORT':
        return 'bg-orange-500';
      case 'PREVENTIVE':
        return 'bg-blue-500';
      case 'CORRECTIVE':
        return 'bg-amber-500';
      case 'CRITICAL':
        return 'bg-fuchsia-500';
      case 'HIGH':
        return 'bg-red-500';
      case 'LOW':
        return 'bg-green-500';
      default:
        return 'bg-gray-400';
    }
  };

  const colorClass = getStatusColor(status);
  const dotColor = getDotColor(status);

  return (
    <span className={`${colorClass} inline-flex items-center gap-1.5 py-0.5 px-2.5 rounded-full text-xs font-medium ring-1 ring-inset w-fit min-w-0 max-w-[min(100%,280px)] whitespace-nowrap`}>
      <span className={`${dotColor} w-1.5 h-1.5 rounded-full shrink-0`} />
      <span className="truncate">{value}</span>
    </span>
  );
};

export default StatusBadge;
