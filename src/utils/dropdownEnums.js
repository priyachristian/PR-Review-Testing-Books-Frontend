import Icons from '@/assets/icons/icon';
import { colorPalette } from '@/utils/theme';
import { userStatus, PAYMENT_RECEIVED_STATUS, CUSTOMER_PAYMENT_STATUS } from './constants';

export const SUB_SUPPLY_TYPE_OPTIONS = [
  { value: '1', label: 'Supply' },
  { value: '2', label: 'Import' },
  { value: '3', label: 'Export' },
  { value: '4', label: 'Job Work' },
  { value: '5', label: 'For Own Use' },
  { value: '6', label: 'Job Work Returns' },
  { value: '7', label: 'Sales Return' },
  { value: '8', label: 'Others' },
  { value: '9', label: 'SKD/CKD' },
  { value: '10', label: 'Line Sales' },
  { value: '11', label: 'Recipient Not Known' },
  { value: '12', label: 'Exhibition or Fairs' },
];

export const SUPPLY_TYPE_OPTIONS = [
  { value: 'O', label: 'Outward' },
  { value: 'I', label: 'Inward' },
];

export const TRANSPORT_MODE_OPTIONS = [
  { value: '1', label: 'Road' },
  { value: '2', label: 'Rail' },
  { value: '3', label: 'Air' },
  { value: '4', label: 'Ship' },
];

export const VEHICLE_TYPE_OPTIONS = [
  { value: 'R', label: 'Regular' },
  { value: 'O', label: 'ODC' },
];

export const GST_RATE_OPTIONS = [
  { label: 'None', value: 'none' },
  { label: 'Exempted', value: 'exempted' },
  { label: '0% GST', value: '0' },
  { label: '5% GST', value: '5' },
  { label: '12% GST', value: '12' },
  { label: '18% GST', value: '18' },
  { label: '28% GST', value: '28' },
];

export const EXPENSE_AMOUNTS_ARE_OPTIONS = [
  { label: 'Tax Exclusive', value: false },
  { label: 'Tax Inclusive', value: true },
];

export const EXPENSE_SUPPLY_TYPE_OPTIONS = [
  { label: 'Goods', value: 'GOODS' },
  { label: 'Service', value: 'SERVICE' },
];

export const EXPENSE_INPUT_CREDIT_OPTIONS = [
  { label: 'Eligible', value: true },
  { label: 'Not Eligible', value: false },
];

export const EXPENSE_TAX_SPLIT_OPTIONS = [
  { label: 'CGST + SGST', value: 'CGST_SGST' },
  { label: 'IGST', value: 'IGST' },
];

export const USER_STATUS_OPTIONS = status => [
  { value: userStatus.ACTIVE, label: 'Active' },
  { value: userStatus.INACTIVE, label: 'Inactive' },
  ...(status === userStatus.PENDING ? [{ value: userStatus.PENDING, label: 'Pending' }] : []),
];

// Customer list status filter (API/URL values = ACTIVE/INACTIVE).
export const CUSTOMER_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

// Filterable subset of payment received statuses (excludes system-driven COMPLETED/FAILED/REFUNDED).
export const PAYMENT_RECEIVED_STATUS_OPTIONS = [
  { value: 'PENDING', label: PAYMENT_RECEIVED_STATUS.PENDING },
  { value: 'APPROVED', label: PAYMENT_RECEIVED_STATUS.APPROVED },
  { value: 'REJECTED', label: PAYMENT_RECEIVED_STATUS.REJECTED },
  { value: 'CANCELLED', label: PAYMENT_RECEIVED_STATUS.CANCELLED },
];

export const PAYMENT_MADE_STATUS_OPTIONS = PAYMENT_RECEIVED_STATUS_OPTIONS;

// Customer (portal) payment statuses; CANCELLED is never set by any flow, so it is not filterable.
export const CUSTOMER_PAYMENT_STATUS_OPTIONS = [
  { value: 'SUBMITTED', label: CUSTOMER_PAYMENT_STATUS.SUBMITTED },
  { value: 'APPROVED', label: CUSTOMER_PAYMENT_STATUS.APPROVED },
  { value: 'REJECTED', label: CUSTOMER_PAYMENT_STATUS.REJECTED },
];

export const ITEM_STATUS_OPTIONS = [
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

// Item master list status filter.
export const ITEM_MASTER_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

// Division list status filter.
export const DIVISION_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

// Branch list status filter.
export const BRANCH_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

// Warehouse list status filter.
export const WAREHOUSE_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
];

// Rejection order lifecycle. Colors come from the shared theme palette (no hardcoded hex);
// StatusBadge owns the badge styling — these color/icon fields drive the flow stepper and inventory tiles.
export const REJECTION_STATUS = {
  PENDING: { key: 'PENDING', label: 'Pending', color: colorPalette.secondary[500], icon: Icons.ProfileOutlined },
  RECEIVED: { key: 'RECEIVED', label: 'Received', color: colorPalette.primary[500], icon: Icons.TruckOutlined },
  REJECTION_COUNTED: { key: 'REJECTION_COUNTED', label: 'Rejection Counted', color: colorPalette.warning[700], icon: Icons.FileSearchOutlined },
  SETTLED: { key: 'SETTLED', label: 'Settled', color: colorPalette.brand.purple, icon: Icons.AccountBookOutlined },
  SORTED: { key: 'SORTED', label: 'Sorted', color: colorPalette.success[700], icon: Icons.AppstoreOutlined },
  DEVOLVED: { key: 'DEVOLVED', label: 'Devolved', color: colorPalette.brand.teal, icon: Icons.SyncOutlined },
};

export const REJECTION_FLOW = ['PENDING', 'RECEIVED', 'REJECTION_COUNTED', 'SETTLED', 'SORTED', 'DEVOLVED'];

export const REJECTION_ALL_STATUS_TILE = { label: 'All Status', icon: Icons.DatabaseOutlined };

export const REJECTION_DELETE_BLOCKED_STATUSES = [REJECTION_STATUS.SETTLED.key, REJECTION_STATUS.SORTED.key, REJECTION_STATUS.DEVOLVED.key];

export const canDeleteRejectionOrder = status => !REJECTION_DELETE_BLOCKED_STATUSES.includes(status);

// Booking edit is allowed only before goods are received; the API enforces the same rule.
export const canEditRejectionOrder = status => status === REJECTION_STATUS.PENDING.key;

export const getRejectionEditBlockedMessage = status => `This document can only be edited in Pending status. Current status - ${REJECTION_STATUS[status]?.label || status || '-'}.`;

export const TAG_COLORS = [
  { label: 'Blue', value: '#2563EB' },
  { label: 'Green', value: '#16A34A' },
  { label: 'Orange', value: '#F97316' },
  { label: 'Red', value: '#DC2626' },
  { label: 'Purple', value: '#7C3AED' },
  { label: 'Teal', value: '#0D9488' },
  { label: 'Yellow', value: '#EAB308' },
  { label: 'Indigo', value: '#4F46E5' },
  { label: 'Gray', value: '#6B7280' },
  { label: 'Pink', value: '#EC4899' },
];

export const SCHEME_STATUS_CONFIG = {
  ACTIVE: { accentHex: '#16a34a', label: 'Active' },
  DRAFT: { accentHex: '#ca8a04', label: 'Draft' },
  PAUSED: { accentHex: '#ea580c', label: 'Paused' },
  ENDED: { accentHex: '#6b7280', label: 'Ended' },
};

export const INCENTIVE_LOG_STATUS_CONFIG = {
  PENDING: { accentHex: '#f59e0b', label: 'Pending' },
  SETTLED: { accentHex: '#16a34a', label: 'Settled' },
  CANCELLED: { accentHex: '#dc2626', label: 'Cancelled' },
};

export const ITEM_TYPE_OPTIONS = [
  { value: 'RM', label: 'RM' },
  { value: 'FG', label: 'FG' },
  { value: 'SEMI_RM', label: 'SEMI RM' },
  { value: 'CONSUMABLE', label: 'CONSUMABLE' },
  { value: 'TRADE', label: 'TRADE' },
  { value: 'SCRAP', label: 'SCRAP' },
  { value: 'SERVICE', label: 'SERVICE' },
];

export const ITEM_CATEGORY_OPTIONS = [
  { value: 'goods', label: 'Goods' },
  { value: 'service', label: 'Service' },
];

export const APP_NAME_OPTIONS = [
  { value: 'BOOKS', label: 'BOOKS' },
  { value: 'CRM', label: 'CRM' },
];

export const ADDRESS_TYPE_OPTIONS = [
  { value: 'billTo', label: 'Bill To' },
  { value: 'shipTo', label: 'Ship To' },
];

export const BALANCE_TYPE_OPTIONS = [
  { label: 'Debit', value: 'Debit' },
  { label: 'Credit', value: 'Credit' },
];
