import { PART_REQUEST_STATUSES } from './partRequest.schema';

export const DATE_KEYS = { startDate: 'fromDate', endDate: 'toDate', singleDate: 'requestedDate' };

const toLabelMap = options => Object.fromEntries(options.map(option => [option.value, option.label]));

export const STATUS_LABELS = toLabelMap(PART_REQUEST_STATUSES);

export const recordId = item => item?.id || item?._id;

export const findById = (list, id) => (list || []).find(item => String(recordId(item)) === String(id));

export const userLabel = user => user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || '';

export const machineOptionLabel = machine => [machine?.machineCode, machine?.machineName].filter(Boolean).join(' - ');

export const sparePartOptionLabel = part => [part?.code, part?.name].filter(Boolean).join(' - ') || part?.name || part?.code || '';

export const maintenanceRequestOptionLabel = request => request?.mrNo || '';

export const formatPartRequestLabel = value => {
  if (!value) return '';
  return String(value)
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const requestedByName = requestedBy => requestedBy?.name || [requestedBy?.firstName, requestedBy?.lastName].filter(Boolean).join(' ') || '';

export const machineIdFromRecord = record => recordId(record?.machineId) || null;

export const machineCodeFromRecord = record => record?.machineId?.machineCode || record?.machineCode || '';

export const machineNameFromRecord = record => record?.machineId?.machineName || record?.machineName || '';

export const machineLabel = record => {
  const name = machineNameFromRecord(record);
  const code = machineCodeFromRecord(record);
  if (name && code) return `${name} (${code})`;
  return name || code || '';
};

export const sparePartIdFromRecord = record => recordId(record?.sparePartId) || null;

export const partCodeFromRecord = record => record?.partCode || record?.sparePartId?.code || '';

export const partNameFromRecord = record => record?.partName || record?.sparePartId?.name || '';

export const partLabel = record => {
  const name = partNameFromRecord(record);
  const code = partCodeFromRecord(record);
  if (name && code) return `${name} (${code})`;
  return name || code || '';
};
