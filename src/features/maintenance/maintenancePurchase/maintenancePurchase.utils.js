import { MAINTENANCE_PURCHASE_STAGES } from './maintenancePurchase.schema';

export const DATE_KEYS = { startDate: 'fromDate', endDate: 'toDate', singleDate: 'prDate' };

export const STAGE_LABELS = Object.fromEntries(MAINTENANCE_PURCHASE_STAGES.map(stage => [stage.value, stage.label]));

export const recordId = item => item?.id || item?._id;

export const userLabel = user => user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || '';

export const maintenanceRequestOptionLabel = request => request?.mrNo || '';

export const emptyPurchaseItem = () => ({ sparePartId: null, requestedQty: '', rate: '' });

export const linkedRequestLabel = request => [request?.mrNo, request?.machineName].filter(Boolean).join(' - ') || request?.mrNo || '';

const roundMoney = value => Math.round((value + Number.EPSILON) * 100) / 100;

export const lineAmount = item => {
  const quantity = Number(item?.requestedQty);
  const rate = Number(item?.rate);
  if (!Number.isFinite(quantity) || !Number.isFinite(rate)) return 0;
  return roundMoney(quantity * rate);
};

export const rateTotal = items => roundMoney((items || []).reduce((sum, item) => sum + lineAmount(item), 0));

export const firstPurchaseErrorFieldId = errors => {
  const topLevel = ['vendor', 'linkedMrId', 'expectedDelivery'];
  const top = topLevel.find(field => errors?.[field]);
  if (top) return top;

  if (typeof errors?.items === 'string') return 'items';

  if (Array.isArray(errors?.items)) {
    const index = errors.items.findIndex(item => item && typeof item === 'object');
    if (index >= 0) {
      const field = Object.keys(errors.items[index])[0];
      return field ? `items.${index}.${field}` : 'items';
    }
  }

  return Object.keys(errors || {})[0];
};

export const findById = (list, id) => (list || []).find(item => String(recordId(item)) === String(id));

export const maintenancePurchaseStageLabel = stage => STAGE_LABELS[stage] || stage || '';

export const sparePartIdValue = item => {
  const part = item?.sparePartId;
  if (!part) return '';
  if (typeof part === 'string') return part;
  return part.id || part._id || '';
};

export const orderedQtyValue = item => {
  const ordered = Number(item?.orderedQty);
  if (Number.isFinite(ordered)) return ordered;
  const approved = Number(item?.approvedQty);
  if (Number.isFinite(approved)) return approved;
  const requested = Number(item?.requestedQty);
  return Number.isFinite(requested) ? requested : null;
};

export const receivedQtyValue = item => {
  const received = Number(item?.receivedQty);
  return Number.isFinite(received) ? received : 0;
};

export const remainingReceiveQty = item => {
  const ordered = orderedQtyValue(item);
  if (!Number.isFinite(ordered)) return null;
  return Math.max(ordered - receivedQtyValue(item), 0);
};

export const sparePartName = item => {
  const part = item?.sparePartId;
  if (!part || typeof part !== 'object') return '';
  return part.name || '';
};

export const sparePartLabel = item => {
  const part = item?.sparePartId;
  if (!part || typeof part !== 'object') return '';
  return [part.code, part.name].filter(Boolean).join(' - ');
};

export const linkedMrNo = linkedMr => {
  if (!linkedMr || typeof linkedMr !== 'object') return '';
  return linkedMr.mrNo || '';
};
