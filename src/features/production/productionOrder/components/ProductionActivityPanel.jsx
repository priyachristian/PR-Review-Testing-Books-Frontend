// Components
import { Empty } from '@/components/AntDComponent';

// Extras
import { PRODUCTION_MODULE_STATUS, PRODUCTION_MODULE_METHOD_LABEL, PROCESS_STATUS } from '@/utils/constants';
import { formatAmount } from '@/utils/currency';

const formatStamp = datetime => {
  const date = new Date(datetime);
  return {
    date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    time: date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }),
  };
};

const ACTION_DOT = {
  ORDER_CREATED: 'bg-emerald-500',
  SEQUENCE_REARRANGED: 'bg-violet-500',
  SEQUENCE_LOCKED: 'bg-gray-400',
  SEQUENCE_UNLOCKED: 'bg-gray-400',
  PROCESS_STARTED: 'bg-blue-500',
  PROCESS_SUBMITTED: 'bg-emerald-500',
  PROCESS_SUBMISSION_EDITED: 'bg-amber-500',
  PROCESS_SUBMISSION_DELETED: 'bg-red-500',
  PROCESS_COMPLETED: 'bg-emerald-500',
  FG_SUBMITTED: 'bg-emerald-500',
  FG_SUBMISSION_EDITED: 'bg-amber-500',
  FG_SUBMISSION_DELETED: 'bg-red-500',
  STATUS_CHANGED: 'bg-amber-500',
  TRANSFER_REQUEST_RERAISED: 'bg-amber-500',
};

const META_LABEL = {
  processIN: 'Input',
  processOUT: 'Output',
  processRejection: 'Rejected',
  totalUsedUnit: 'Units used',
  fgSubmittedQty: 'FG submitted',
  fgRejectedQty: 'FG rejected',
  quantity: 'Quantity',
  reversedProcessOUT: 'Reversed good output',
  reversedProcessRejection: 'Reversed rejected',
  reversedFgSubmittedQty: 'Reversed FG submitted',
  reversedFgRejectedQty: 'Reversed FG rejected',
};

const ProductionActivityPanel = ({ activityLog }) => {
  if (!activityLog?.length) {
    return (
      <div className="my-container container-spacing">
        <p className="font-bold text-lg">Activity</p>
        <Empty description="No activity recorded yet." />
      </div>
    );
  }

  return (
    <div className="my-container container-spacing">
      <p className="font-bold text-lg">Activity</p>
      <div className="relative">
        <div className="absolute left-[72px] top-1 bottom-1 w-px bg-gray-200" />
        <div className="space-y-3">
          {[...activityLog].reverse().map((event, index) => {
            const stamp = formatStamp(event.performedAt);
            const scrapQty = (event.metadata?.scrapOut || []).reduce((sum, row) => sum + (row.value || row.qtyPerItem || 0), 0);
            const box = Object.entries(event.metadata || {})
              .filter(([key, value]) => META_LABEL[key] && typeof value === 'number' && value !== 0)
              .map(([key, value]) => `${META_LABEL[key]} ${value}`)
              .concat(scrapQty > 0 ? [`Scrap ${scrapQty}`] : [])
              .concat(event.metadata?.processNames?.length ? [event.metadata.processNames.map(row => row.processName).join(' → ')] : [])
              .concat(
                event.metadata?.resultingStatus
                  ? [
                      event.action === 'PROCESS_SUBMITTED' || event.action === 'PROCESS_SUBMISSION_EDITED'
                        ? PROCESS_STATUS[event.metadata.resultingStatus]
                        : PRODUCTION_MODULE_STATUS[event.metadata.resultingStatus],
                    ]
                  : []
              )
              .concat(event.metadata?.transferId ? [event.metadata.transferId] : [])
              .concat(event.metadata?.recipeName ? [`recipe ${event.metadata.recipeName}`] : [])
              .concat(event.metadata?.productionManageMethod ? [PRODUCTION_MODULE_METHOD_LABEL[event.metadata.productionManageMethod]] : [])
              .concat(
                (event.metadata?.scrapOut || []).filter(row => row.item?.itemName || row.itemName).map(row => `${row.item?.itemName || row.itemName} ${row.value ?? row.qtyPerItem ?? ''}`.trim())
              )
              .concat((event.metadata?.rawMaterialsConsumed || []).map(row => `${row.item?.itemName || row.itemName || 'RM'} ${row.value ?? row.productionOrderSubmittedUnit ?? ''}`.trim()))
              .concat((event.metadata?.additionalCost || []).map(row => `${row.notes || 'Cost'} ${formatAmount(row.amount)}`))
              .join(' · ');

            return (
              <div key={`${event.action}-${event.performedAt}-${index}`} className="flex items-start gap-3">
                <div className="w-14 shrink-0 text-right">
                  <p className="text-xs text-gray-500 m-0">{stamp.time}</p>
                  <p className="text-xs text-gray-400 m-0">{stamp.date}</p>
                </div>
                <span className={`mt-1.5 w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white relative z-[1] ${ACTION_DOT[event.action] || 'bg-emerald-500'}`} />
                <div className="min-w-0 flex-1 pb-1">
                  <p className="text-sm font-semibold text-gray-800 m-0">
                    {event.action === 'STATUS_CHANGED'
                      ? `Status changed from ${PRODUCTION_MODULE_STATUS[event.metadata.previousStatus]} to ${PRODUCTION_MODULE_STATUS[event.metadata.newStatus]}`
                      : event.description}
                    {event.performedBy?.name ? ` by ${event.performedBy.name}` : ''}
                  </p>
                  {box ? <p className="text-sm text-gray-700 m-0 mt-1.5 border border-gray-200 bg-gray-50 rounded px-2 py-1.5">{box}</p> : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProductionActivityPanel;
