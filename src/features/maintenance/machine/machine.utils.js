import dayjs from 'dayjs';

export const refId = value => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  return value.id || value._id || null;
};

export const numberValue = value => (value === 0 || value ? value : '');

export const toNumberOrNull = value => {
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isNaN(number) ? null : number;
};

export const unitName = value => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  return value.name || value.label || null;
};

export const sparePartLabel = part => [part?.code, part?.name].filter(Boolean).join(' - ') || part?.name || part?.code || '';

export const emptyPmTask = () => ({ taskType: null, description: '', isRequired: true });

export const emptyWearPart = () => ({ sparePartId: null, avgLifeHours: '', uom: null });

export const touchAll = current => {
  if (Array.isArray(current)) return current.map(touchAll);
  if (current && typeof current === 'object' && !dayjs.isDayjs(current)) {
    return Object.fromEntries(Object.entries(current).map(([key, value]) => [key, touchAll(value)]));
  }
  return true;
};

export const firstErrorFieldId = errors => {
  const topLevel = ['machineName', 'location', 'process', 'criticality', 'hasAMC', 'pmFrequencyDays', 'lastPMDate', 'nextPMDueDate'];
  const top = topLevel.find(field => errors[field]);
  if (top) return top;

  if (Array.isArray(errors.pmTasks)) {
    const index = errors.pmTasks.findIndex(item => item && typeof item === 'object');
    if (index >= 0) {
      const field = Object.keys(errors.pmTasks[index])[0];
      return field ? `pmTasks.${index}.${field}` : 'pmTasks';
    }
  }

  if (Array.isArray(errors.wearParts)) {
    const index = errors.wearParts.findIndex(item => item && typeof item === 'object');
    if (index >= 0) {
      const field = Object.keys(errors.wearParts[index])[0];
      return field ? `wearParts.${index}.${field}` : 'wearParts';
    }
  }

  return Object.keys(errors)[0];
};
