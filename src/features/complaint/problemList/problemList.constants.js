export const PROBLEM_TYPES = {
  INTERNAL_EMPLOYEE_ISSUE: 'INTERNAL_EMPLOYEE_ISSUE',
  CUSTOMER_ISSUE: 'CUSTOMER_ISSUE',
};

export const VISIBILITY = {
  EVERYONE: 'EVERYONE',
};

export const ATTACHMENT_OPTIONS = [
  { value: 'INVOICE', label: 'Invoice' },
  { value: 'ITEM_QUANTITY', label: 'Item and quantity' },
  { value: 'TRANSPORT', label: 'Transport' },
  { value: 'BATCH', label: 'Batch' },
  { value: 'BILL', label: 'Bill' },
  { value: 'AMOUNT', label: 'Amount' },
  { value: 'SALES_PERSON', label: 'Sales person' },
  { value: 'DATE', label: 'Date' },
  { value: 'PHOTO', label: 'Photo' },
];

export const URGENCY_OPTIONS = [
  { value: 'CRITICAL', label: 'Critical' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

export const DEPARTMENT_OPTIONS = [
  { value: 'PRODUCTION', label: 'Production' },
  { value: 'QUALITY_CONTROL', label: 'Quality Control' },
  { value: 'STORE_AND_DISPATCH', label: 'Store & Dispatch' },
  { value: 'LOGISTICS', label: 'Logistics' },
  { value: 'ACCOUNTS', label: 'Accounts' },
  { value: 'SALES_AND_MARKETING', label: 'Sales & Marketing' },
  { value: 'AFTER_SALES_SERVICE', label: 'After-Sales Service' },
  { value: 'HR_AND_ADMIN', label: 'HR & Admin' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'PURCHASE', label: 'Purchase' },
];

export const DEFAULT_PROBLEM_FIELDS = {
  name: '',
  department: null,
  assignedTo: null,
  urgency: null,
  replyWithinHours: null,
  sortOutWithinDays: null,
  requiredAttachments: [],
  visibility: VISIBILITY.EVERYONE,
  canAddChild: true,
  isActive: true,
  children: [],
};
