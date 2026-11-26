export const DATE_KEYS = { startDate: 'fromDate', endDate: 'toDate', singleDate: 'date' };

export const TRANSACTION_TYPES = [
  { label: 'Opening', value: 'OPENING' },
  { label: 'Receipt', value: 'RECEIPT' },
  { label: 'Issue', value: 'ISSUE' },
  { label: 'Adjustment', value: 'ADJUSTMENT' },
];

export const TRANSACTION_TYPE_LABELS = TRANSACTION_TYPES.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});

export const REFERENCE_TYPES = [
  { label: 'Maintenance Request', value: 'MaintenanceRequest' },
  { label: 'Maintenance Purchase', value: 'MaintenancePurchase' },
  { label: 'Spare Part', value: 'SparePart' },
];

export const REFERENCE_TYPE_LABELS = REFERENCE_TYPES.reduce((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, {});

export const sparePartLabel = sparePart => {
  if (!sparePart) return '';
  const name = sparePart?.name;
  const code = sparePart?.code;
  if (name && code) return `${name} (${code})`;
  return name || code || '';
};

export const sparePartOptionLabel = part => [part?.code, part?.name].filter(Boolean).join(' - ') || part?.name || part?.code || '';

export const recordId = item => item?.id || item?._id;

export const findById = (list, id) => (list || []).find(item => String(recordId(item)) === String(id));

export const formatTransactionType = value => {
  if (!value) return '';
  return (
    TRANSACTION_TYPE_LABELS[value] ||
    String(value)
      .toLowerCase()
      .split('_')
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  );
};

export const referenceLabel = record => {
  const reference = record?.referenceId;
  return reference?.mrNo || reference?.docNo || record?.referenceType || '';
};
