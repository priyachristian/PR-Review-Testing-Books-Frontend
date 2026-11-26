// Components
import InventoryPipelineSkeleton from './InventoryPipelineSkeleton';
import { Tooltip } from '@/components/AntDComponent';
import { colorPalette } from '@/utils/theme';

// Extras
import Icons from 'assets/icons/icon';

const AVAILABLE = colorPalette.primary[500];
const INCOMING = '#16a34a';
const COMMITTED = '#ea580c';
const SHORT = '#dc2626';

/** Tooltips spell out exactly which document statuses feed each number. */
const STAGE_HELP = {
  available: 'Stock physically on hand right now, totalled across all warehouses.',
  incoming: 'Quantity expected to arrive — from purchase orders not yet received, and recorded GRPOs that have not added stock yet.',
  committed: 'Quantity already promised to customers through open quotations, sales orders and delivery challans.',
  projected: 'Available + Incoming − Committed. The stock you can expect to hold once everything in the pipeline clears.',
};

const ROW_HELP = {
  quotations: 'Counts quotations with status Sent or Accepted. Rejected, expired, cancelled, and quotations already converted to a sales order or invoice are excluded.',
  salesOrders: 'Counts sales orders with status Open or Partially Recorded, less quantities already delivered or invoiced. Closed, completed and cancelled orders are excluded.',
  deliveryChallans: 'Counts standalone delivery challans (not raised from a sales order) with status Sent that have not deducted stock yet.',
  purchaseOrders:
    'Counts purchase orders with status Accepted or Partially Recorded, less quantities already received via GRPO or billed. Sent, rejected, converted and cancelled orders are excluded.',
  grpo: 'Counts GRPOs with status Recorded that have not added stock yet, less quantities already billed.',
};

const DRAFT_HELP = 'Draft documents are shown for visibility only. They are not confirmed, so they are excluded from the totals and the projected stock figure.';

const InfoDot = ({ text }) => (
  <Tooltip title={<span className="text-xs leading-relaxed">{text}</span>} placement="top">
    <span className="cursor-help text-gray-400 hover:text-gray-600 inline-flex items-center shrink-0">
      <Icons.InfoCircleOutlined className="text-[11px]" />
    </span>
  </Tooltip>
);

/** One step of the Available + Incoming − Committed = Projected equation. */
const Stage = ({ label, value, color, operator, help, emphasis }) => (
  <div className="flex items-center gap-2 sm:gap-3">
    {operator ? <span className="text-base font-semibold text-gray-300 shrink-0">{operator}</span> : null}
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-1">
        <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide truncate">{label}</span>
        <InfoDot text={help} />
      </div>
      <p className={`tabular-nums leading-tight ${emphasis ? 'text-xl font-bold' : 'text-lg font-bold'}`} style={{ color }}>
        {value}
      </p>
    </div>
  </div>
);

const PipelineRow = ({ icon, title, count, quantity, help, draftCount, draftQty }) => {
  const qty = quantity ?? 0;
  const docs = count ?? 0;
  const drafts = draftCount ?? 0;
  const isActive = qty > 0;

  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5 border-t border-gray-100">
      <div
        className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 text-sm ${isActive ? 'bg-gray-100' : 'bg-gray-50'}`}
        style={{ color: isActive ? colorPalette.primary[500] : '#9ca3af' }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-[13px] font-medium text-[#1e293b]">{title}</span>
          <InfoDot text={help} />
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <p className="text-[11px] text-[#64748b] leading-4">{isActive ? `${docs} ${docs === 1 ? 'document' : 'documents'}` : 'Nothing pending'}</p>
          {drafts > 0 ? (
            <Tooltip title={<span className="text-xs leading-relaxed">{DRAFT_HELP}</span>} placement="top">
              <span className="text-[10px] font-medium text-gray-500 bg-gray-100 border border-gray-200 px-1.5 py-px rounded-full cursor-help leading-4 shrink-0">
                {drafts} draft · {draftQty ?? 0}
              </span>
            </Tooltip>
          ) : null}
        </div>
      </div>
      <span className={`text-[13px] font-semibold tabular-nums shrink-0 leading-4 ${isActive ? 'text-[#1e293b]' : 'text-gray-300'}`}>{qty}</span>
    </div>
  );
};

const PipelineCard = ({ title, subtitle, total, totalCount, accent, iconBg, headerIcon, rows }) => (
  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
    <div className="flex items-center justify-between gap-2.5 px-3 py-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-9 h-9 rounded-md flex items-center justify-center shrink-0 text-sm" style={{ backgroundColor: iconBg, color: accent }}>
          {headerIcon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 leading-4">{title}</p>
          <p className="text-[11px] text-[#64748b] leading-4">{subtitle}</p>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-base font-bold leading-tight tabular-nums" style={{ color: accent }}>
          {total ?? 0}
        </p>
        <p className="text-[11px] text-[#64748b] leading-4">
          {totalCount} {totalCount === 1 ? 'doc' : 'docs'}
        </p>
      </div>
    </div>
    <div>
      {rows.map(row => (
        <PipelineRow key={row.key} {...row} />
      ))}
    </div>
  </div>
);

const InventoryPipeline = ({ data, loading, availableStock = 0 }) => {
  if (loading) {
    return <InventoryPipelineSkeleton />;
  }

  if (!data) {
    return (
      <div>
        <p className="font-bold text-lg">Inventory Pipeline</p>
        <p className="mt-2 text-sm text-gray-500">Pipeline data could not be loaded.</p>
      </div>
    );
  }

  const available = Number(availableStock) || 0;
  const incoming = data.pendingQty ?? 0;
  const committed = data.pendingSalesQty ?? 0;
  const projectedValue = available + incoming - committed;
  const projected = Math.round(projectedValue * 1000) / 1000;
  const isShort = projected < 0;
  const draftCount = data.draftCount ?? 0;
  const draftQty = data.draftQty ?? 0;

  // Proportional widths for the position bar.
  const scale = Math.max(available + incoming, committed, 1);
  const pct = value => `${Math.min(100, (value / scale) * 100)}%`;

  const outgoingRows = [
    {
      key: 'quotations',
      title: 'Quotations',
      quantity: data.quotePendingQty ?? 0,
      count: data.quoteCount ?? 0,
      draftCount: data.quoteDraftCount ?? 0,
      draftQty: data.quoteDraftQty ?? 0,
      help: ROW_HELP.quotations,
      icon: <Icons.FileTextOutlined />,
    },
    {
      key: 'sales-orders',
      title: 'Sales Orders',
      quantity: data.salesOrderPendingQty ?? 0,
      count: data.salesOrderCount ?? 0,
      draftCount: data.salesOrderDraftCount ?? 0,
      draftQty: data.salesOrderDraftQty ?? 0,
      help: ROW_HELP.salesOrders,
      icon: <Icons.ShoppingCartOutlined />,
    },
    {
      key: 'delivery-challans',
      title: 'Delivery Challans',
      quantity: data.deliveryChallanPendingQty ?? 0,
      count: data.deliveryChallanCount ?? 0,
      draftCount: data.deliveryChallanDraftCount ?? 0,
      draftQty: data.deliveryChallanDraftQty ?? 0,
      help: ROW_HELP.deliveryChallans,
      icon: <Icons.TruckOutlined />,
    },
  ];

  const incomingRows = [
    {
      key: 'purchase-orders',
      title: 'Purchase Orders',
      quantity: data.poPendingQty ?? 0,
      count: data.poCount ?? 0,
      draftCount: data.poDraftCount ?? 0,
      draftQty: data.poDraftQty ?? 0,
      help: ROW_HELP.purchaseOrders,
      icon: <Icons.ProfileOutlined />,
    },
    { key: 'grpo', title: 'GRPO', quantity: data.grpoPendingQty ?? 0, count: data.grpoCount ?? 0, help: ROW_HELP.grpo, icon: <Icons.InboxOutlined /> },
  ];

  const outgoingCount = (data.quoteCount ?? 0) + (data.salesOrderCount ?? 0) + (data.deliveryChallanCount ?? 0);
  const incomingCount = (data.poCount ?? 0) + (data.grpoCount ?? 0);

  return (
    <div>
      <p className="font-bold text-lg pb-2">Inventory Pipeline</p>

      {/* Stock position: Available + Incoming − Committed = Projected */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 mb-3">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-2">
          <Stage label="Available now" value={available} color={AVAILABLE} help={STAGE_HELP.available} />
          <Stage label="Incoming" value={incoming} color={INCOMING} operator="+" help={STAGE_HELP.incoming} />
          <Stage label="Committed" value={committed} color={COMMITTED} operator="−" help={STAGE_HELP.committed} />
          <Stage label="Projected" value={projected} color={isShort ? SHORT : AVAILABLE} operator="=" help={STAGE_HELP.projected} emphasis />
        </div>

        <div className="mt-3 h-2 rounded-full bg-gray-100 flex overflow-hidden">
          <div style={{ width: pct(available), backgroundColor: AVAILABLE }} />
          <div style={{ width: pct(incoming), backgroundColor: INCOMING }} />
        </div>
        <div className="mt-1.5 h-2 rounded-full bg-gray-100 flex overflow-hidden">
          <div style={{ width: pct(committed), backgroundColor: COMMITTED }} />
        </div>

        <div className="mt-2.5 flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-[12px]">
            {isShort ? (
              <>
                <Icons.WarningOutlined style={{ color: SHORT }} />
                <span className="font-medium" style={{ color: SHORT }}>
                  Short by {Math.abs(projected)} — committed stock exceeds what you have and expect.
                </span>
              </>
            ) : (
              <>
                <Icons.CheckCircleOutlined style={{ color: INCOMING }} />
                <span className="text-[#64748b]">
                  Covered — {available >= committed ? 'on-hand stock already covers everything committed.' : 'incoming stock is needed to cover what is committed.'}
                </span>
              </>
            )}
          </div>

          {draftCount > 0 ? (
            <Tooltip title={<span className="text-xs leading-relaxed">{DRAFT_HELP}</span>} placement="topRight">
              <span className="text-[11px] text-gray-500 cursor-help shrink-0">
                Excludes {draftCount} draft {draftCount === 1 ? 'document' : 'documents'} ({draftQty} units)
              </span>
            </Tooltip>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <PipelineCard
          title="Incoming"
          subtitle="Expected to enter stock"
          total={incoming}
          totalCount={incomingCount}
          accent={INCOMING}
          iconBg="#dcfce7"
          headerIcon={<Icons.ArrowUpOutlined className="rotate-180" />}
          rows={incomingRows}
        />
        <PipelineCard
          title="Outgoing"
          subtitle="Committed to leave stock"
          total={committed}
          totalCount={outgoingCount}
          accent={COMMITTED}
          iconBg="#ffedd5"
          headerIcon={<Icons.ArrowUpOutlined />}
          rows={outgoingRows}
        />
      </div>
    </div>
  );
};

export default InventoryPipeline;
