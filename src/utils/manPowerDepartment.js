/** Sentinel: filter workers with no department set */
export const MANPOWER_DEPARTMENT_UNASSIGNED = '__UNASSIGNED__';

export function getWorkerId(worker) {
  if (!worker) return undefined;
  return worker.id ?? worker._id;
}

/**
 * Unique non-empty department names from manpower list, sorted.
 */
export function getUniqueDepartmentNames(workerDropdown) {
  const names = new Set();
  for (const w of workerDropdown || []) {
    const d = w.departmentName?.trim();
    if (d) names.add(d);
  }
  return Array.from(names).sort((a, b) => a.localeCompare(b));
}

export function hasUnassignedWorkers(workerDropdown) {
  return (workerDropdown || []).some(w => !w.departmentName?.trim());
}

/**
 * @param {string} departmentFilter - '' = all; MANPOWER_DEPARTMENT_UNASSIGNED = no department; else exact name
 */
export function filterWorkersByDepartment(workerDropdown, departmentFilter) {
  const list = workerDropdown || [];
  if (!departmentFilter) return list;
  if (departmentFilter === MANPOWER_DEPARTMENT_UNASSIGNED) {
    return list.filter(w => !w.departmentName?.trim());
  }
  return list.filter(w => w.departmentName?.trim() === departmentFilter);
}

export function buildDepartmentSelectOptions(workerDropdown) {
  const names = getUniqueDepartmentNames(workerDropdown);
  const opts = [{ value: '', label: 'All departments' }];
  names.forEach(n => opts.push({ value: n, label: n }));
  if (hasUnassignedWorkers(workerDropdown)) {
    opts.push({ value: MANPOWER_DEPARTMENT_UNASSIGNED, label: 'Unassigned' });
  }
  return opts;
}
