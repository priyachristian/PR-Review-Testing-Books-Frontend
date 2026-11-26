import { colorPalette } from '@/utils/theme';

export const COMPLAINT_SOURCE = {
  CUSTOMER: 'customer',
  FACTORY: 'factory',
};

/** Listing card / `status` query param (API list filters) */
export const COMPLAINT_BUCKET = {
  NEEDS_ACTION: 'NEEDS_ACTION',
  GOING_ON: 'GOING_ON',
  ON_HOLD: 'ON_HOLD',
  FINISHED: 'FINISHED',
};

/** Map source tabs → problemList PROBLEM_TYPES for list API `problemType` */
export const COMPLAINT_SOURCE_PROBLEM_TYPE = {
  [COMPLAINT_SOURCE.CUSTOMER]: 'CUSTOMER_ISSUE',
  [COMPLAINT_SOURCE.FACTORY]: 'INTERNAL_EMPLOYEE_ISSUE',
};

/** List-row status badge (card statuses from list API) */
export const COMPLAINT_LIST_STATUS = {
  NEEDS_ACTION: { key: COMPLAINT_BUCKET.NEEDS_ACTION, label: 'Needs action', color: '#f59e0b' },
  GOING_ON: { key: COMPLAINT_BUCKET.GOING_ON, label: 'Going on', color: '#3b82f6' },
  ON_HOLD: { key: COMPLAINT_BUCKET.ON_HOLD, label: 'On hold', color: '#f97316' },
  FINISHED: { key: COMPLAINT_BUCKET.FINISHED, label: 'Finished', color: '#22c55e' },
};

/** API meta.statusCounts camelCase keys (kept for reference / docs) */
export const COMPLAINT_STATUS_COUNT_KEYS = {
  needsAction: COMPLAINT_BUCKET.NEEDS_ACTION,
  goingOn: COMPLAINT_BUCKET.GOING_ON,
  onHold: COMPLAINT_BUCKET.ON_HOLD,
  finished: COMPLAINT_BUCKET.FINISHED,
};

/** API: formType */
export const COMPLAINT_FORM_TYPE = {
  DEPARTMENT_TO_DEPARTMENT: 'DEPARTMENT_TO_DEPARTMENT',
  PERSON_TO_PERSON: 'PERSON_TO_PERSON',
  CUSTOMER_ISSUE: 'CUSTOMER_ISSUE',
};

export const COMPLAINT_FORM_TYPE_OPTIONS = [
  { value: COMPLAINT_FORM_TYPE.DEPARTMENT_TO_DEPARTMENT, label: 'Department to Department' },
  { value: COMPLAINT_FORM_TYPE.PERSON_TO_PERSON, label: 'Person to Person' },
  { value: COMPLAINT_FORM_TYPE.CUSTOMER_ISSUE, label: 'Customer Issue' },
];

/** API: currentStep / steps — NEW → ASSIGNED → IN_PROGRESS → ACTION_TAKEN → VERIFIED → CLOSED */
/** Step/status colors use the app theme (primary / secondary / success / warning). */
export const COMPLAINT_STATUS = {
  NEW: { key: 'NEW', label: 'New', color: '#64748b' },
  ASSIGNED: { key: 'ASSIGNED', label: 'Assigned', color: colorPalette.primary[500] },
  IN_PROGRESS: { key: 'IN_PROGRESS', label: 'In Progress', color: colorPalette.primary[500] },
  ACTION_TAKEN: { key: 'ACTION_TAKEN', label: 'Action Taken', color: colorPalette.primary[500] },
  VERIFIED: { key: 'VERIFIED', label: 'Verified', color: colorPalette.primary[500] },
  CLOSED: { key: 'CLOSED', label: 'Closed', color: colorPalette.primary[500] },
  ON_HOLD: { key: 'ON_HOLD', label: 'On Hold', color: '#f59e0b' },
};

export const COMPLAINT_CURRENT_STEP = {
  NEW: COMPLAINT_STATUS.NEW.key,
  ASSIGNED: COMPLAINT_STATUS.ASSIGNED.key,
  IN_PROGRESS: COMPLAINT_STATUS.IN_PROGRESS.key,
  ACTION_TAKEN: COMPLAINT_STATUS.ACTION_TAKEN.key,
  VERIFIED: COMPLAINT_STATUS.VERIFIED.key,
  CLOSED: COMPLAINT_STATUS.CLOSED.key,
};

export const COMPLAINT_CURRENT_STEP_OPTIONS = [
  { value: COMPLAINT_CURRENT_STEP.NEW, label: COMPLAINT_STATUS.NEW.label },
  { value: COMPLAINT_CURRENT_STEP.ASSIGNED, label: COMPLAINT_STATUS.ASSIGNED.label },
  { value: COMPLAINT_CURRENT_STEP.IN_PROGRESS, label: COMPLAINT_STATUS.IN_PROGRESS.label },
  { value: COMPLAINT_CURRENT_STEP.ACTION_TAKEN, label: COMPLAINT_STATUS.ACTION_TAKEN.label },
  { value: COMPLAINT_CURRENT_STEP.VERIFIED, label: COMPLAINT_STATUS.VERIFIED.label },
  { value: COMPLAINT_CURRENT_STEP.CLOSED, label: COMPLAINT_STATUS.CLOSED.label },
];

/** API: contactChannel */
export const COMPLAINT_CONTACT_CHANNEL = {
  PHONE_CALL: 'PHONE_CALL',
  WHATSAPP: 'WHATSAPP',
  EMAIL: 'EMAIL',
  IN_PERSON: 'IN_PERSON',
  OTHER: 'OTHER',
};

export const COMPLAINT_CHANNEL_OPTIONS = [
  { value: COMPLAINT_CONTACT_CHANNEL.PHONE_CALL, label: 'Phone Call' },
  { value: COMPLAINT_CONTACT_CHANNEL.WHATSAPP, label: 'WhatsApp' },
  { value: COMPLAINT_CONTACT_CHANNEL.EMAIL, label: 'Email' },
  { value: COMPLAINT_CONTACT_CHANNEL.IN_PERSON, label: 'In Person' },
  { value: COMPLAINT_CONTACT_CHANNEL.OTHER, label: 'Other' },
];

/** API: department */
export const COMPLAINT_DEPARTMENT = {
  PRODUCTION: 'PRODUCTION',
  QUALITY_CONTROL: 'QUALITY_CONTROL',
  STORE_AND_DISPATCH: 'STORE_AND_DISPATCH',
  LOGISTICS: 'LOGISTICS',
  ACCOUNTS: 'ACCOUNTS',
  SALES_AND_MARKETING: 'SALES_AND_MARKETING',
  AFTER_SALES_SERVICE: 'AFTER_SALES_SERVICE',
  HR_AND_ADMIN: 'HR_AND_ADMIN',
  MAINTENANCE: 'MAINTENANCE',
  PURCHASE: 'PURCHASE',
};

export const COMPLAINT_DEPARTMENT_OPTIONS = [
  { value: COMPLAINT_DEPARTMENT.PRODUCTION, label: 'Production' },
  { value: COMPLAINT_DEPARTMENT.QUALITY_CONTROL, label: 'Quality Control' },
  { value: COMPLAINT_DEPARTMENT.STORE_AND_DISPATCH, label: 'Store & Dispatch' },
  { value: COMPLAINT_DEPARTMENT.LOGISTICS, label: 'Logistics' },
  { value: COMPLAINT_DEPARTMENT.ACCOUNTS, label: 'Accounts' },
  { value: COMPLAINT_DEPARTMENT.SALES_AND_MARKETING, label: 'Sales & Marketing' },
  { value: COMPLAINT_DEPARTMENT.AFTER_SALES_SERVICE, label: 'After-Sales Service' },
  { value: COMPLAINT_DEPARTMENT.HR_AND_ADMIN, label: 'HR & Admin' },
  { value: COMPLAINT_DEPARTMENT.MAINTENANCE, label: 'Maintenance' },
  { value: COMPLAINT_DEPARTMENT.PURCHASE, label: 'Purchase' },
];

/** API: urgency */
export const COMPLAINT_URGENCY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
};

export const COMPLAINT_URGENCY_OPTIONS = [
  { value: COMPLAINT_URGENCY.LOW, label: 'Low' },
  { value: COMPLAINT_URGENCY.MEDIUM, label: 'Medium' },
  { value: COMPLAINT_URGENCY.HIGH, label: 'High' },
  { value: COMPLAINT_URGENCY.CRITICAL, label: 'Critical' },
];

/** API: evidence.type (from ProblemList.requiredAttachments) */
export const COMPLAINT_EVIDENCE_TYPE = {
  INVOICE: 'INVOICE',
  ITEM_QUANTITY: 'ITEM_QUANTITY',
  TRANSPORT: 'TRANSPORT',
  BATCH: 'BATCH',
  BILL: 'BILL',
  AMOUNT: 'AMOUNT',
  SALES_PERSON: 'SALES_PERSON',
  DATE: 'DATE',
  PHOTO: 'PHOTO',
};

export const COMPLAINT_EVIDENCE_TYPE_OPTIONS = [
  { value: COMPLAINT_EVIDENCE_TYPE.INVOICE, label: 'Invoice' },
  { value: COMPLAINT_EVIDENCE_TYPE.ITEM_QUANTITY, label: 'Item and quantity' },
  { value: COMPLAINT_EVIDENCE_TYPE.TRANSPORT, label: 'Transport' },
  { value: COMPLAINT_EVIDENCE_TYPE.BATCH, label: 'Batch' },
  { value: COMPLAINT_EVIDENCE_TYPE.BILL, label: 'Bill' },
  { value: COMPLAINT_EVIDENCE_TYPE.AMOUNT, label: 'Amount' },
  { value: COMPLAINT_EVIDENCE_TYPE.SALES_PERSON, label: 'Sales person' },
  { value: COMPLAINT_EVIDENCE_TYPE.DATE, label: 'Date' },
  { value: COMPLAINT_EVIDENCE_TYPE.PHOTO, label: 'Photo' },
];

/** API: warrantyPosition */
export const COMPLAINT_WARRANTY_POSITION = {
  IN_WARRANTY: 'IN_WARRANTY',
  OUT_OF_WARRANTY: 'OUT_OF_WARRANTY',
  DEAD_ON_ARRIVAL: 'DEAD_ON_ARRIVAL',
  DOES_NOT_APPLY: 'DOES_NOT_APPLY',
};

export const COMPLAINT_WARRANTY_POSITION_OPTIONS = [
  { value: COMPLAINT_WARRANTY_POSITION.IN_WARRANTY, label: 'In warranty' },
  { value: COMPLAINT_WARRANTY_POSITION.OUT_OF_WARRANTY, label: 'Out of warranty' },
  { value: COMPLAINT_WARRANTY_POSITION.DEAD_ON_ARRIVAL, label: 'Dead on arrival' },
  { value: COMPLAINT_WARRANTY_POSITION.DOES_NOT_APPLY, label: 'Does not apply' },
];

/** API: settlementType */
export const COMPLAINT_SETTLEMENT_TYPE = {
  FREE_REPLACEMENT: 'FREE_REPLACEMENT',
  CREDIT_NOTE: 'CREDIT_NOTE',
  REPAIR_AT_SITE: 'REPAIR_AT_SITE',
  GOODWILL_GESTURE: 'GOODWILL_GESTURE',
  CLAIM_DECLINED: 'CLAIM_DECLINED',
  NOTHING_WRONG_FOUND: 'NOTHING_WRONG_FOUND',
  SORTED_OUT_ON_THE_SPOT: 'SORTED_OUT_ON_THE_SPOT',
};

export const COMPLAINT_SETTLEMENT_TYPE_OPTIONS = [
  { value: COMPLAINT_SETTLEMENT_TYPE.FREE_REPLACEMENT, label: 'Free replacement' },
  { value: COMPLAINT_SETTLEMENT_TYPE.CREDIT_NOTE, label: 'Credit note' },
  { value: COMPLAINT_SETTLEMENT_TYPE.REPAIR_AT_SITE, label: 'Repair at site' },
  { value: COMPLAINT_SETTLEMENT_TYPE.GOODWILL_GESTURE, label: 'Goodwill gesture' },
  { value: COMPLAINT_SETTLEMENT_TYPE.CLAIM_DECLINED, label: 'Claim declined' },
  { value: COMPLAINT_SETTLEMENT_TYPE.NOTHING_WRONG_FOUND, label: 'Nothing wrong found' },
  { value: COMPLAINT_SETTLEMENT_TYPE.SORTED_OUT_ON_THE_SPOT, label: 'Sorted out on the spot' },
];

/** Settlement types that show both pieces + cost fields */
export const SETTLEMENT_SHOW_PIECES_AND_COST = [COMPLAINT_SETTLEMENT_TYPE.FREE_REPLACEMENT, COMPLAINT_SETTLEMENT_TYPE.REPAIR_AT_SITE];

/** Settlement types that show cost only */
export const SETTLEMENT_SHOW_COST_ONLY = [COMPLAINT_SETTLEMENT_TYPE.CREDIT_NOTE, COMPLAINT_SETTLEMENT_TYPE.GOODWILL_GESTURE];

export const SETTLEMENT_APPROVAL_THRESHOLD = 50000;

export const settlementShowsPieces = type => SETTLEMENT_SHOW_PIECES_AND_COST.includes(type);
export const settlementShowsCost = type => SETTLEMENT_SHOW_PIECES_AND_COST.includes(type) || SETTLEMENT_SHOW_COST_ONLY.includes(type);

/** API: fixHeldResult */
export const COMPLAINT_FIX_HELD_RESULT = {
  YES_NOT_COME_BACK: 'YES_NOT_COME_BACK',
  NO_CAME_BACK: 'NO_CAME_BACK',
  PARTIAL: 'PARTIAL',
};

export const COMPLAINT_FIX_HELD_RESULT_OPTIONS = [
  { value: COMPLAINT_FIX_HELD_RESULT.YES_NOT_COME_BACK, label: 'Yes, the problem has not come back' },
  { value: COMPLAINT_FIX_HELD_RESULT.NO_CAME_BACK, label: 'No — came back' },
  { value: COMPLAINT_FIX_HELD_RESULT.PARTIAL, label: 'Partial' },
];

/** Ordered workflow steps on the complaint detail page. Modal hooks will use `actionKey`. */
export const COMPLAINT_STEPS = [
  {
    key: COMPLAINT_STATUS.NEW.key,
    label: 'New',
    description: 'Put a name against it. Nothing moves until somebody owns it.',
    willNeed: null,
    actionKey: 'assign',
    actionLabel: 'Give it to someone',
  },
  {
    key: COMPLAINT_STATUS.ASSIGNED.key,
    label: 'Assigned',
    description: 'Tell the customer we have it, before doing anything else.',
    willNeed: 'reply to the customer',
    actionKey: 'reply',
    actionLabel: 'Reply now',
  },
  {
    key: COMPLAINT_STATUS.IN_PROGRESS.key,
    label: 'In Progress',
    description: 'Find out what actually went wrong.',
    willNeed: 'check the warranty position, write down the real cause',
    actionKey: 'progress',
    actionLabel: null,
  },
  {
    key: COMPLAINT_STATUS.ACTION_TAKEN.key,
    label: 'Action Taken',
    description: 'Put on record what the customer actually got.',
    willNeed: 'what the customer got',
    actionKey: 'action_taken',
    actionLabel: null,
  },
  {
    key: COMPLAINT_STATUS.VERIFIED.key,
    label: 'Verified',
    description: 'Make sure the change actually held before you close it.',
    willNeed: 'check the fix held',
    actionKey: 'verify',
    actionLabel: null,
  },
  {
    key: COMPLAINT_STATUS.CLOSED.key,
    label: 'Closed',
    description: null,
    willNeed: null,
    actionKey: 'close',
    actionLabel: null,
  },
];

/** Secondary actions under "Other actions" on complaint detail. Modals will use `key`. */
export const COMPLAINT_OTHER_ACTIONS = [
  { key: 'hand_off', label: 'Hand to someone else', icon: 'UserAddOutlined', danger: false },
  { key: 'waiting', label: 'Waiting on someone', icon: 'PauseCircleOutlined', danger: false },
  { key: 'escalate', label: 'Escalate', icon: 'RiseOutlined', danger: false },
  { key: 'link_complaint', label: 'Link another complaint', icon: 'LinkOutlined', danger: false },
  { key: 'not_real', label: 'Not a real complaint', icon: 'StopOutlined', danger: true },
];

export const COMPLAINT_SOURCE_TABS = [
  {
    key: COMPLAINT_SOURCE.CUSTOMER,
    label: 'From customers',
    icon: 'TeamOutlined',
  },
  {
    key: COMPLAINT_SOURCE.FACTORY,
    label: 'Inside the factory',
    icon: 'BuildOutlined',
  },
];

export const COMPLAINT_STATUS_CARDS = [
  { key: COMPLAINT_BUCKET.NEEDS_ACTION, countKey: 'needsAction', label: 'Needs action' },
  { key: COMPLAINT_BUCKET.GOING_ON, countKey: 'goingOn', label: 'Going on' },
  { key: COMPLAINT_BUCKET.ON_HOLD, countKey: 'onHold', label: 'On hold' },
  { key: COMPLAINT_BUCKET.FINISHED, countKey: 'finished', label: 'Finished' },
];

export const COMPLAINT_WAITING_REASON = {
  AWAITING_CUSTOMER_RESPONSE: 'AWAITING_CUSTOMER_RESPONSE',
  AWAITING_MATERIAL_RETURN: 'AWAITING_MATERIAL_RETURN',
  AWAITING_VENDOR_REPLY: 'AWAITING_VENDOR_REPLY',
  AWAITING_SPARE_OR_STOCK: 'AWAITING_SPARE_OR_STOCK',
  AWAITING_MANAGEMENT_APPROVAL: 'AWAITING_MANAGEMENT_APPROVAL',
  SITE_NOT_AVAILABLE: 'SITE_NOT_AVAILABLE',
};

export const COMPLAINT_WAITING_FOR_OPTIONS = [
  { value: COMPLAINT_WAITING_REASON.AWAITING_CUSTOMER_RESPONSE, label: 'Awaiting customer response' },
  { value: COMPLAINT_WAITING_REASON.AWAITING_MATERIAL_RETURN, label: 'Awaiting material return' },
  { value: COMPLAINT_WAITING_REASON.AWAITING_VENDOR_REPLY, label: 'Awaiting vendor reply' },
  { value: COMPLAINT_WAITING_REASON.AWAITING_SPARE_OR_STOCK, label: 'Awaiting spare or stock' },
  { value: COMPLAINT_WAITING_REASON.AWAITING_MANAGEMENT_APPROVAL, label: 'Awaiting management approval' },
  { value: COMPLAINT_WAITING_REASON.SITE_NOT_AVAILABLE, label: 'Site not available' },
];

export const DEFAULT_WAITING_VALUES = {
  waitingFor: '',
  note: '',
};

export const DEFAULT_ESCALATE_VALUES = {
  personId: '',
  reason: '',
};

export const COMPLAINT_LINK_CONNECTION = {
  SAME_UNDERLYING_ISSUE: 'SAME_UNDERLYING_ISSUE',
  SAME_BATCH: 'SAME_BATCH',
  SAME_CUSTOMER_SAME_PRODUCT: 'SAME_CUSTOMER_SAME_PRODUCT',
  RELATED: 'RELATED',
};

export const COMPLAINT_LINK_CONNECTION_OPTIONS = [
  { value: COMPLAINT_LINK_CONNECTION.SAME_UNDERLYING_ISSUE, label: 'Same underlying issue' },
  { value: COMPLAINT_LINK_CONNECTION.SAME_BATCH, label: 'Same batch' },
  { value: COMPLAINT_LINK_CONNECTION.SAME_CUSTOMER_SAME_PRODUCT, label: 'Same customer, same product' },
  { value: COMPLAINT_LINK_CONNECTION.RELATED, label: 'Related' },
];

export const DEFAULT_LINK_VALUES = {
  connectionType: '',
  linkedComplaintId: '',
};

export const COMPLAINT_NOT_REAL_REASON = {
  DUPLICATE_OF_ANOTHER: 'DUPLICATE_OF_ANOTHER',
  NOT_OUR_PRODUCT: 'NOT_OUR_PRODUCT',
  OUTSIDE_WARRANTY_DECLINED: 'OUTSIDE_WARRANTY_DECLINED',
  WITHDRAWN_BY_RAISER: 'WITHDRAWN_BY_RAISER',
  NO_FAULT_FOUND: 'NO_FAULT_FOUND',
  TEST_ENTRY: 'TEST_ENTRY',
};

export const COMPLAINT_NOT_REAL_REASON_OPTIONS = [
  { value: COMPLAINT_NOT_REAL_REASON.DUPLICATE_OF_ANOTHER, label: 'Duplicate of another' },
  { value: COMPLAINT_NOT_REAL_REASON.NOT_OUR_PRODUCT, label: 'Not our product' },
  { value: COMPLAINT_NOT_REAL_REASON.OUTSIDE_WARRANTY_DECLINED, label: 'Outside warranty — declined' },
  { value: COMPLAINT_NOT_REAL_REASON.WITHDRAWN_BY_RAISER, label: 'Withdrawn by raiser' },
  { value: COMPLAINT_NOT_REAL_REASON.NO_FAULT_FOUND, label: 'No fault found' },
  { value: COMPLAINT_NOT_REAL_REASON.TEST_ENTRY, label: 'Test entry' },
];

export const DEFAULT_NOT_REAL_VALUES = {
  reason: '',
  note: '',
};

export const DEFAULT_REPLY_MESSAGE = 'We will collect a few failed pieces for testing and come back to you within 5 days.';

export const DEFAULT_MOVE_TO_IN_PROGRESS_VALUES = {
  whatHappened: 'Called back a few failed pieces and started testing them.',
};

export const DEFAULT_MOVE_TO_ACTION_TAKEN_VALUES = {
  whatHappened: '',
};

export const DEFAULT_WARRANTY_CHECK_VALUES = {
  position: '',
  why: '',
};

export const DEFAULT_REAL_CAUSE_VALUES = {
  why1: '',
  why2: '',
  why3: '',
  why4: '',
  why5: '',
  realCause: '',
  fixThisOne: '',
  neverRepeats: '',
  ownerId: '',
  byWhen: null,
};

export const DEFAULT_STOP_GAP_VALUES = {
  whatYouDid: '',
};

export const DEFAULT_CUSTOMER_GOT_VALUES = {
  settlementType: '',
  pieces: '',
  cost: '',
  summary: '',
};

export const DEFAULT_MOVE_TO_VERIFIED_VALUES = {
  whatHappened: '',
};

export const DEFAULT_FIX_HELD_VALUES = {
  result: '',
  howKnow: '',
};

export const DEFAULT_CLOSE_COMPLAINT_VALUES = {
  howItEnded: '',
  customerRating: null,
};

export const COMPLAINT_REOPEN_REASON = {
  SAME_FAULT_REPORTED_AGAIN: 'SAME_FAULT_REPORTED_AGAIN',
  NOT_SATISFIED_WITH_WHAT_WAS_DONE: 'NOT_SATISFIED_WITH_WHAT_WAS_DONE',
  THE_REPLACEMENT_FAILED_TOO: 'THE_REPLACEMENT_FAILED_TOO',
  THE_FIX_DID_NOT_HOLD: 'THE_FIX_DID_NOT_HOLD',
};

export const COMPLAINT_REOPEN_REASON_OPTIONS = [
  { value: COMPLAINT_REOPEN_REASON.SAME_FAULT_REPORTED_AGAIN, label: 'Same fault reported again' },
  { value: COMPLAINT_REOPEN_REASON.NOT_SATISFIED_WITH_WHAT_WAS_DONE, label: 'Not satisfied with what was done' },
  { value: COMPLAINT_REOPEN_REASON.THE_REPLACEMENT_FAILED_TOO, label: 'The replacement failed too' },
  { value: COMPLAINT_REOPEN_REASON.THE_FIX_DID_NOT_HOLD, label: 'The fix did not hold' },
];

export const DEFAULT_REOPEN_VALUES = {
  reason: '',
  note: '',
};

export const COMPLAINT_CUSTOMER_OPTIONS = [
  { value: 'lumina', label: 'Lumina Distributors' },
  { value: 'metro', label: 'Metro Infra Pvt Ltd' },
  { value: 'city-light', label: 'City Light Co.' },
  { value: 'brightway', label: 'Brightway Electricals' },
  { value: 'orbit', label: 'Orbit Lighting Hub' },
];

/** Map problem-list attachment keys to Add Complaint form field labels */
export const ATTACHMENT_FIELD_LABELS = {
  INVOICE: 'Invoice',
  BILL: 'Bill',
  SALES_PERSON: 'Sales person',
  ITEM_QUANTITY: 'Item and quantity',
  TRANSPORT: 'Transport',
  BATCH: 'Batch',
  AMOUNT: 'Amount',
  DATE: 'When did it happen',
  PHOTO: 'Photo',
};

export const ATTACHMENT_FIELD_PLACEHOLDERS = {
  DATE: 'DD/MM/YYYY',
  BATCH: 'e.g. B-88231',
  TRANSPORT: 'LR / transporter number',
  AMOUNT: 'Amount',
};

/**
 * Evidence input kinds for requiredAttachments.
 * invoice/bill → PaginatedSelect; item_quantity → item select + qty; photo → file; etc.
 */
export const EVIDENCE_FIELD_CONFIG = {
  INVOICE: { kind: 'invoice' },
  BILL: { kind: 'bill' },
  SALES_PERSON: { kind: 'user' },
  ITEM_QUANTITY: { kind: 'item_quantity' },
  TRANSPORT: { kind: 'number', evidenceKey: 'value' },
  BATCH: { kind: 'text', evidenceKey: 'batchNumber' },
  AMOUNT: { kind: 'number', evidenceKey: 'amount' },
  DATE: { kind: 'date', evidenceKey: 'date' },
  PHOTO: { kind: 'file' },
};

/** Middle-branch name tokens under Employee Issue (system tree). */
export const EMPLOYEE_FORM_BRANCH = {
  DEPARTMENT: 'DEPARTMENT',
  PERSON: 'PERSON',
};

export const NEXT_COMPLAINT_NUMBER = 'CMP/26-27/0006';
