import { DEPARTMENT_OPTIONS, URGENCY_OPTIONS, VISIBILITY } from './problemList.constants';

export const countProblems = (nodes = []) => nodes.reduce((total, node) => total + 1 + countProblems(node.children || []), 0);

export const findProblemById = (nodes = [], id) => {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findProblemById(node.children || [], id);
    if (found) return found;
  }
  return null;
};

/** Returns [root, ..., selected] path for breadcrumbs / inheritance. */
export const getProblemPath = (nodes = [], id, trail = []) => {
  for (const node of nodes) {
    const nextTrail = [...trail, node];
    if (node.id === id) return nextTrail;
    const found = getProblemPath(node.children || [], id, nextTrail);
    if (found) return found;
  }
  return null;
};

export const getOptionLabel = (options, value) => options.find(opt => opt.value === value)?.label || '';

/**
 * Walk ancestors (nearest → root) and return the first explicit value for a field,
 * plus the ancestor node that owns it.
 */
export const resolveInheritedField = (path = [], field) => {
  if (!path.length) return { value: null, source: null };

  const current = path[path.length - 1];
  if (current[field] != null && current[field] !== '') {
    return { value: current[field], source: null };
  }

  for (let i = path.length - 2; i >= 0; i -= 1) {
    const ancestor = path[i];
    if (ancestor[field] != null && ancestor[field] !== '') {
      return { value: ancestor[field], source: ancestor };
    }
  }

  return { value: null, source: null };
};

/** Nearest non-empty requiredAttachments from parent → root. */
export const resolveInheritedAttachments = (path = []) => {
  for (let i = path.length - 1; i >= 0; i -= 1) {
    const attachments = path[i]?.requiredAttachments;
    if (Array.isArray(attachments) && attachments.length > 0) {
      return [...attachments];
    }
  }
  return [];
};

/** Build the modal blurb: inherited sort-out timing for the new child. */
export const buildAddProblemInheritanceSummary = (path = []) => {
  if (!path?.length) return null;

  const parent = path[path.length - 1];
  const sortOutWithinDays = parent?.sortOutWithinDays ?? resolveInheritedField(path, 'sortOutWithinDays').value ?? 7;

  return `It will sort out in ${sortOutWithinDays} days. Change any of that afterwards.`;
};

export const updateProblemInTree = (nodes = [], id, updater) =>
  nodes.map(node => {
    if (node.id === id) {
      return typeof updater === 'function' ? updater(node) : { ...node, ...updater };
    }
    if (node.children?.length) {
      return { ...node, children: updateProblemInTree(node.children, id, updater) };
    }
    return node;
  });

export const addChildToProblem = (nodes = [], parentId, child) => {
  if (!parentId) return [...nodes, child];

  return nodes.map(node => {
    if (node.id === parentId) {
      return { ...node, children: [...(node.children || []), child] };
    }
    if (node.children?.length) {
      return { ...node, children: addChildToProblem(node.children, parentId, child) };
    }
    return node;
  });
};

export const filterProblemTree = (nodes = [], search = '') => {
  const query = search.trim().toLowerCase();
  if (!query) return nodes;

  return nodes.reduce((acc, node) => {
    const filteredChildren = filterProblemTree(node.children || [], query);
    const matches = (node.name || '').toLowerCase().includes(query);
    if (matches || filteredChildren.length) {
      acc.push({ ...node, children: matches ? node.children || [] : filteredChildren });
    }
    return acc;
  }, []);
};

/** Collect ids of nodes that should stay expanded when searching. */
export const getExpandableIdsForSearch = (nodes = [], search = '', collected = new Set()) => {
  const query = search.trim().toLowerCase();
  if (!query) return collected;

  nodes.forEach(node => {
    const children = node.children || [];
    const childMatch = filterProblemTree(children, query).length > 0;
    if (childMatch) {
      collected.add(node.id);
      getExpandableIdsForSearch(children, query, collected);
    }
  });

  return collected;
};

/** Expand root nodes that have children (default tree open state). */
export const getDefaultExpandedIds = (nodes = []) => {
  const collected = new Set();
  nodes.forEach(node => {
    if (node.children?.length) collected.add(node.id);
  });
  return collected;
};

export const getDepartmentLabel = (value, options = DEPARTMENT_OPTIONS) => getOptionLabel(options, value);
export const getPersonLabel = (value, options = []) => getOptionLabel(options, value);
export const getUrgencyLabel = value => getOptionLabel(URGENCY_OPTIONS, value);

export const isLeafProblem = node => {
  if (!node) return false;
  if (typeof node.childCount === 'number') return node.childCount === 0;
  return !node.children?.length;
};

export const mapUsersToSelectOptions = (users = []) =>
  (users || []).map(u => ({
    label: u.name || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || '',
    value: u.id || u._id,
  }));

export const ensureOptionForValue = (options = [], value, fallbackLabel) => {
  if (value == null || value === '') return options;
  if (options.some(opt => opt.value === value)) return options;
  return [{ value, label: fallbackLabel || String(value) }, ...options];
};

/** Flatten tree into searchable rows with full path. */
export const flattenProblemTree = (nodes = [], trail = []) => {
  const rows = [];
  nodes.forEach(node => {
    if (!node?.isActive) return;
    const path = [...trail, node];
    rows.push({
      id: node.id,
      name: node.name,
      path,
      pathLabel: path.map(p => p.name).join(' > '),
      isLeaf: isLeafProblem(node),
      node,
    });
    if (node.children?.length) {
      rows.push(...flattenProblemTree(node.children, path));
    }
  });
  return rows;
};

export const searchProblems = (nodes = [], query = '') => {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return flattenProblemTree(nodes).filter(row => row.name.toLowerCase().includes(q) || row.pathLabel.toLowerCase().includes(q));
};

/** Structured routing summary for the complaint form banner. */
export const resolveProblemRouting = (path, personOptions = [], departmentOptions = DEPARTMENT_OPTIONS) => {
  if (!path?.length) return null;
  const person = resolveInheritedField(path, 'assignedTo');
  const department = resolveInheritedField(path, 'department');
  const urgency = resolveInheritedField(path, 'urgency');
  const leaf = path[path.length - 1];
  const sortOutWithinDays = leaf?.sortOutWithinDays ?? resolveInheritedField(path, 'sortOutWithinDays').value ?? 7;
  const requiredAttachments = leaf?.requiredAttachments?.length
    ? leaf.requiredAttachments
    : path
        .slice()
        .reverse()
        .find(n => n.requiredAttachments?.length)?.requiredAttachments || [];

  return {
    personLabel: getPersonLabel(person.value, personOptions) || 'Unassigned',
    departmentLabel: getDepartmentLabel(department.value, departmentOptions) || 'Unassigned',
    urgencyLabel: getUrgencyLabel(urgency.value) || 'Medium',
    sortOutWithinDays,
    resolveInDays: sortOutWithinDays,
    requiredAttachments,
  };
};

/** Build create/update payload */
export const buildProblemPayload = ({
  name,
  parentProblemId,
  problemType,
  sortOrder,
  department = null,
  assignedTo = null,
  urgency = null,
  replyWithinHours = null,
  sortOutWithinDays = null,
  requiredAttachments = [],
  visibility = VISIBILITY.EVERYONE,
  canAddChild = true,
  isActive = true,
  includeProblemType = false,
} = {}) => {
  const payload = {
    name,
    parentProblemId: parentProblemId ?? null,
    department: department || null,
    assignedTo: assignedTo || null,
    urgency: urgency || undefined,
    replyWithinHours: replyWithinHours === '' || replyWithinHours == null ? null : Number(replyWithinHours),
    sortOutWithinDays: sortOutWithinDays === '' || sortOutWithinDays == null ? null : Number(sortOutWithinDays),
    requiredAttachments: requiredAttachments || [],
    visibility: visibility || VISIBILITY.EVERYONE,
    canAddChild: canAddChild !== false,
    isActive: isActive !== false,
  };

  if (typeof sortOrder === 'number') {
    payload.sortOrder = sortOrder;
  }

  if (includeProblemType && problemType) {
    payload.problemType = problemType;
  }

  if (!payload.urgency) {
    delete payload.urgency;
  }

  return payload;
};
