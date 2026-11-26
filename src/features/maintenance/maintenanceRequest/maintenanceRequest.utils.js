import { MAINTENANCE_REQUEST_PRIORITIES, MAINTENANCE_REQUEST_STATUSES, MAINTENANCE_REQUEST_TYPES } from './maintenanceRequest.schema';

export const DATE_KEYS = { startDate: 'fromDate', endDate: 'toDate', singleDate: 'requestDate' };

export const MACHINE_STOPPED_OPTIONS = [
  { label: 'Yes', value: 'true' },
  { label: 'No', value: 'false' },
];

const toLabelMap = options => Object.fromEntries(options.map(option => [option.value, option.label]));

export const STATUS_LABELS = toLabelMap(MAINTENANCE_REQUEST_STATUSES);
export const TYPE_LABELS = toLabelMap(MAINTENANCE_REQUEST_TYPES);
export const PRIORITY_LABELS = toLabelMap(MAINTENANCE_REQUEST_PRIORITIES);
export const MACHINE_STOPPED_LABELS = toLabelMap(MACHINE_STOPPED_OPTIONS);

export const recordId = item => item?.id || item?._id;

export const userLabel = user => user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || '';

export const machineOptionLabel = machine => [machine?.machineCode, machine?.machineName].filter(Boolean).join(' - ');

export const branchOptionLabel = branch => [branch?.branchCode, branch?.name].filter(Boolean).join(' - ') || branch?.name || '';

export const findById = (list, id) => (list || []).find(item => String(recordId(item)) === String(id));

export const formatMaintenanceLabel = value => {
  if (!value) return '';
  return String(value)
    .toLowerCase()
    .split('_')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const raisedByName = raisedBy => raisedBy?.name || [raisedBy?.firstName, raisedBy?.lastName].filter(Boolean).join(' ') || '';

const machineFromRecord = record => (record?.machineId && typeof record.machineId === 'object' ? record.machineId : null);

export const machineIdFromRecord = record => {
  const machine = machineFromRecord(record);
  if (machine) return recordId(machine);
  return typeof record?.machineId === 'string' ? record.machineId : '';
};

export const machineNameFromRecord = record => machineFromRecord(record)?.machineName || record?.machineName || '';

export const machineCodeFromRecord = record => machineFromRecord(record)?.machineCode || record?.machineCode || '';

export const machineLabel = record => {
  const name = machineNameFromRecord(record);
  const code = machineCodeFromRecord(record);
  if (name && code) return `${name} (${code})`;
  return name || code || '';
};
