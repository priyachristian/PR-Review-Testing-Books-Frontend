/** Maximum length NIC accepts for a document number on e-invoice and e-way bill payloads. */
export const NIC_DOC_NUMBER_MAX_LENGTH = 15;

export const MODULE_NAMES = {
  BANK: 'BANK',
  PRODUCTION_MODULE: 'PRODUCTION_MODULE',
  WAREHOUSE: 'WAREHOUSE',
  QUALITY_MASTER: 'QUALITY_MASTER',
  PROCESS: 'PROCESS',
  RECIPE: 'RECIPE',
  PRICE_LIST: 'PRICE_LIST',
  MANPOWER: 'MANPOWER',
  PRODUCTION_ORDER: 'PRODUCTION_ORDER',
  ITEMGROUP: 'ITEMGROUP',
  DIVISION: 'DIVISION',
  BRANCH: 'BRANCH',
  CUSTOMER: 'CUSTOMER',
  VENDOR: 'VENDOR',
  QUOTATION: 'QUOTATION',
  SALES_ORDER: 'SALES_ORDER',
  DELIVERY_CHALLAN: 'DELIVERY_CHALLAN',
  INVOICE: 'INVOICE',
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  RECURRING_INVOICE: 'RECURRING_INVOICE',
  CREDIT_NOTE: 'CREDIT_NOTE',
  PURCHASE_ORDER: 'PURCHASE_ORDER',
  GRPO: 'GRPO',
  BILL: 'BILL',
  PAYMENT_MADE: 'PAYMENT_MADE',
  RECURRING_BILL: 'RECURRING_BILL',
  DEBIT_NOTE: 'DEBIT_NOTE',
  ITEM: 'ITEM',
  GENERAL_SALES_ANALYTICS: 'GENERAL_SALES_ANALYTICS',
  EXPENSE: 'EXPENSE',
  RECURRING_EXPENSE: 'RECURRING_EXPENSE',
  ACCOUNT_PARTNER: 'ACCOUNT_PARTNER',
  ACCOUNT_LEDGER: 'ACCOUNT_LEDGER',
  MANUAL_JOURNAL: 'MANUAL_JOURNAL',
  VIEW_INVENTORY: 'VIEW_INVENTORY',
  INVENTORY_ADJUSTMENT: 'INVENTORY_ADJUSTMENT',
  INVENTORY_TRANSFER: 'INVENTORY_TRANSFER',
  ITEM_BATCH: 'ITEM_BATCH',
  SPLIT_INVOICE: 'SPLIT_INVOICE',
  SPLIT_BILL: 'SPLIT_BILL',
  SPLIT_CREDIT_NOTE: 'SPLIT_CREDIT_NOTE',
  SPLIT_DEBIT_NOTE: 'SPLIT_DEBIT_NOTE',
  CUSTOMER_ORDER: 'CUSTOMER_ORDER',
  CUSTOMER_PAYMENT: 'CUSTOMER_PAYMENT',
  SAMPLE_CATALOG: 'SAMPLE_CATALOG',
  REJECTION_ORDER: 'REJECTION_ORDER',
  COMPLAINT: 'COMPLAINT',
  DISPATCH: 'DISPATCH',
  CONTACT_PERSON: 'CONTACT_PERSON',
  SPARE_PART: 'SPARE_PART',
  MACHINE: 'MACHINE',
};

export const MODULE_NAMES_LABELS = {
  [MODULE_NAMES.BANK]: 'Bank',
  [MODULE_NAMES.PRODUCTION_MODULE]: 'Production Module',
  [MODULE_NAMES.WAREHOUSE]: 'Warehouse',
  [MODULE_NAMES.QUALITY_MASTER]: 'Quality',
  [MODULE_NAMES.DIVISION]: 'Division',
  [MODULE_NAMES.BRANCH]: 'Branch',
  [MODULE_NAMES.PRICE_LIST]: 'Price List',
  [MODULE_NAMES.ITEMGROUP]: 'Item Group',
  [MODULE_NAMES.CUSTOMER]: 'Customer',
  [MODULE_NAMES.CUSTOMER_ORDER]: 'Customer Order',
  [MODULE_NAMES.CUSTOMER_PAYMENT]: 'Customer Payment',
  [MODULE_NAMES.SAMPLE_CATALOG]: 'Sample Catalog',
  [MODULE_NAMES.VENDOR]: 'Vendor',
  [MODULE_NAMES.QUOTATION]: 'Quotation',
  [MODULE_NAMES.SALES_ORDER]: 'Sales Order',
  [MODULE_NAMES.DELIVERY_CHALLAN]: 'Delivery Challan',
  [MODULE_NAMES.INVOICE]: 'Invoice',
  [MODULE_NAMES.PAYMENT_RECEIVED]: 'Payment Received',
  [MODULE_NAMES.RECURRING_INVOICE]: 'Recurring Invoice',
  [MODULE_NAMES.CREDIT_NOTE]: 'Credit Note',
  [MODULE_NAMES.PURCHASE_ORDER]: 'Purchase Order',
  [MODULE_NAMES.GRPO]: 'GRPO',
  [MODULE_NAMES.BILL]: 'Bill',
  [MODULE_NAMES.PAYMENT_MADE]: 'Payment Made',
  [MODULE_NAMES.RECURRING_BILL]: 'Recurring Bill',
  [MODULE_NAMES.EXPENSE]: 'Expense',
  [MODULE_NAMES.RECURRING_EXPENSE]: 'Recurring Expense',
  [MODULE_NAMES.DEBIT_NOTE]: 'Debit Note',
  [MODULE_NAMES.ITEM]: 'Item',
  [MODULE_NAMES.GENERAL_SALES_ANALYTICS]: 'General Sales Analytics',
  [MODULE_NAMES.MANUAL_JOURNAL]: 'Manual Journal',
  [MODULE_NAMES.ACCOUNT_LEDGER]: 'Account Ledger',
  [MODULE_NAMES.VIEW_INVENTORY]: 'Inventory',
  [MODULE_NAMES.INVENTORY_ADJUSTMENT]: 'Inventory Adjustment',
  [MODULE_NAMES.INVENTORY_TRANSFER]: 'Inventory Transfer',
  [MODULE_NAMES.ITEM_BATCH]: 'Item Batch',
  [MODULE_NAMES.SPLIT_INVOICE]: 'Split Invoice',
  [MODULE_NAMES.SPLIT_BILL]: 'Split Bill',
  [MODULE_NAMES.SPLIT_CREDIT_NOTE]: 'Split Credit Note',
  [MODULE_NAMES.SPLIT_DEBIT_NOTE]: 'Split Debit Note',
  [MODULE_NAMES.REJECTION_ORDER]: 'Rejection Order',
  [MODULE_NAMES.PRODUCTION_ORDER]: 'Production Order',
  [MODULE_NAMES.COMPLAINT]: 'Complaint',
  [MODULE_NAMES.SPARE_PART]: 'Spare Part',
  [MODULE_NAMES.MACHINE]: 'Machine',
  [MODULE_NAMES.DISPATCH]: 'Dispatch',
  [MODULE_NAMES.CONTACT_PERSON]: 'Contact Person',
};

export const STOCK_CHECK_SOURCE_MODULE = hasDeliveryChallanAccess => {
  return {
    QUOTATION: 'QUOTATION',
    SALES_ORDER: 'SALES_ORDER',
    ...(hasDeliveryChallanAccess && { DELIVERY_CHALLAN: 'DELIVERY_CHALLAN' }),
    INVOICE: 'INVOICE',
  };
};

export const STOCK_DEDUCT_SOURCE_MODULE = hasDeliveryChallanAccess => {
  return {
    // SALES_ORDER: "SALES_ORDER",
    ...(hasDeliveryChallanAccess && { DELIVERY_CHALLAN: 'DELIVERY_CHALLAN' }),
    INVOICE: 'INVOICE',
  };
};

export const STOCK_ADD_SOURCE_MODULE = hasGrpoAccess => {
  return {
    // PURCHASE_ORDER: "PURCHASE_ORDER",
    ...(hasGrpoAccess && { GRPO: 'GRPO' }),
    BILL: 'BILL',
  };
};

export const RESTRICTION_DOCUMENT_LABELS = {
  QUOTATION: 'Quote',
  SALES_ORDER: 'Sales Order',
  DELIVERY_CHALLAN: 'Delivery Challan',
  INVOICE: 'Invoice',
  EXPENSE: 'Expense',
  PURCHASE_ORDER: 'Purchase Order',
  GRPO: 'GRPO',
  BILL: 'Bill',
};

const restrictionOptions = keys => keys.map(value => ({ label: RESTRICTION_DOCUMENT_LABELS[value], value }));

export const PAYMENT_TERMS_DOCUMENT_OPTIONS = {
  CUSTOMER: restrictionOptions(['QUOTATION', 'SALES_ORDER', 'DELIVERY_CHALLAN', 'INVOICE']),
  VENDOR: restrictionOptions(['PURCHASE_ORDER', 'GRPO', 'BILL']),
};

export const CREDIT_LIMIT_DOCUMENT_OPTIONS = {
  CUSTOMER: restrictionOptions(['QUOTATION', 'SALES_ORDER', 'DELIVERY_CHALLAN', 'INVOICE', 'EXPENSE']),
  VENDOR: PAYMENT_TERMS_DOCUMENT_OPTIONS.VENDOR,
};

export const CHARGE_MODULE_CONFIG = activeFeatures => {
  return [
    {
      value: 'QUOTATION',
      label: 'Quote',
    },
    {
      value: 'SALES_ORDER',
      label: 'Sales Order',
    },
    ...(activeFeatures?.[ADDITIONAL_FEATURES?.DELIVERY_CHALLAN]
      ? [
          {
            value: 'DELIVERY_CHALLAN',
            label: 'Delivery Challan',
          },
        ]
      : []),
    {
      value: 'INVOICE',
      label: 'Invoice',
    },
    {
      value: 'CREDIT_NOTE',
      label: 'Credit Note',
    },
    {
      value: 'PURCHASE_ORDER',
      label: 'Purchase Order',
    },
    ...(activeFeatures?.[ADDITIONAL_FEATURES?.GRPO]
      ? [
          {
            value: 'GRPO',
            label: 'GRPO',
          },
        ]
      : []),
    {
      value: 'BILL',
      label: 'Bill',
    },
    {
      value: 'DEBIT_NOTE',
      label: 'Debit Note',
    },
    {
      value: 'RECURRING_INVOICE',
      label: 'Recurring Invoice',
    },
    {
      value: 'RECURRING_BILL',
      label: 'Recurring Bill',
    },
  ];
};

export const userStatus = {
  ACTIVE: 'active',
  PENDING: 'pending',
  INACTIVE: 'inactive',
  BLOCKED: 'blocked',
  REJECTED: 'rejected',
};

export const Colors = {
  colorPrimary: '#f26f21',
  colorBgLayout: '#f0f2f5',
};

export const pageTypes = {
  QUOTE: 'quote',
  SALES_ORDER: 'salesOrder',
  DELIVERY_CHALLAN: 'deliveryChallan',
  INVOICE: 'invoice',
  CREDIT_NOTE: 'creditNote',
  PURCHASE_ORDER: 'purchaseOrder',
  GRPO: 'grpo',
  BILLS: 'bills',
  DEBIT_NOTE: 'debitNote',
  EXPENSES: 'expenses',
  RECURRING_INVOICE: 'recurringInvoice',
  RECURRING_BILL: 'recurringBill',
  CUSTOMER_ORDER: 'customerOrder',
  PRODUCTION: 'production',
  PAYMENT: 'payment',
  GENERAL_LEDGER: 'generalLedger',
  MANUAL_JOURNAL: 'manualJournal',
};

export const dashboardTabs = {
  HOME: 'home',
  ANALYTICS: 'analytics',
  SALES_ORDER: 'salesOrder',
  PURCHASE_ORDER: 'purchaseOrder',
  COLLECTION: 'collection',
  PAYMENTS: 'payments',
  GROUP_ITEM: 'groupItem',
  INVENTORY_BY_DIVISION: 'inventoryByDivision',
};

export const filterInputEnum = {
  SEARCH: 'search',
  SELECT: 'select',
  SWITCH: 'switch',
};

export const confirmModalEnum = {
  PRICE_LIST_AVAILABLE: {
    TITLE: 'A new price list is available for this customer. Do you want to apply it?',
    OK_TEXT: 'Apply New Price List',
  },
  PRICE_LIST_NOT_AVAILABLE: {
    TITLE: 'The price list has been removed. Apply default item rates or keep the existing ones?',
    OK_TEXT: 'Apply Default Item Rate',
  },
  // Save-time prompt when the customer/vendor is not active in the branch or items are not in the warehouse.
  DOCUMENT_ACTIVATION: {
    TITLE: documentLabel => `Activate before saving this ${documentLabel}?`,
    PARTY_HEADING: partyLabel => `${partyLabel} not active in this branch:`,
    ITEMS_HEADING: 'Items not available in this warehouse:',
    CUSTOMER_LABEL: 'Customer',
    VENDOR_LABEL: 'Vendor',
    BRANCH_LABEL: 'Branch',
    WAREHOUSE_LABEL: 'Warehouse',
    ITEMS_LABEL: 'Items',
    NOTE_TITLE: 'Important Note:',
    PARTY_NOTE: partyLabel => `The ${partyLabel.toLowerCase()} will be activated in this branch (zero opening balance if new).`,
    ITEMS_NOTE: 'Items will be made available in this warehouse with 0 quantity. No stock is moved.',
    OK_TEXT: 'Activate & Save',
    CANCEL_TEXT: 'Cancel',
    CHECKING_MESSAGE: 'Checking vendor and item availability. Please try saving again in a moment.',
  },
  // Save/activate prompt when catalog items are not visible in the customer portal to the catalog's customers.
  SAMPLE_CATALOG_PORTAL_ACTIVATION: {
    DOCUMENT_LABEL: 'sample catalog',
    ITEMS_HEADING_ALL: 'Items not available in the customer portal for all customers:',
    ITEMS_HEADING_SELECTED: 'Items not available in the customer portal for the selected customers:',
    ITEMS_NOTE_ALL:
      'These items will be turned on in the customer portal for ALL customers. Any customer restriction on them will be removed, so every portal customer can see and order them, including in Customer Orders.',
    ITEMS_NOTE_SELECTED: "These items will be turned on in the customer portal for this catalog's selected customers only. Other customers are not affected.",
    OK_TEXT: 'Activate & Save',
    OK_TEXT_STATUS: 'Activate Items & Catalog',
  },
  PRICE_LIST_RESET_ITEMS: {
    TITLE: 'Changing the price list will reset all items. Do you want to continue?',
    OK_TEXT: 'Reset Items',
    CANCEL_TEXT: 'Cancel',
  },
  // Shown when the price list changes on a document converted from another one (its items carry the source rates).
  PRICE_LIST_APPLY_CONVERTED: {
    TITLE: 'Apply price list to items?',
    MESSAGE: 'Update item prices using this price list? If you keep the current prices, the price list selection will be removed.',
    PRICE_LIST_LABEL: 'Selected price list:',
    OK_TEXT: 'Yes, apply price list',
    CANCEL_TEXT: 'No, keep rates',
  },
  // Shown when the price list is cleared on a converted document; removing it restores the original prices.
  PRICE_LIST_REMOVE_CONVERTED: {
    TITLE: 'Remove price list?',
    MESSAGE: 'Item prices will go back to the prices from the original document.',
    PRICE_LIST_LABEL: 'Price list:',
    OK_TEXT: 'Yes, remove',
    CANCEL_TEXT: 'No, keep price list',
  },
  CANCEL_TEXT: 'Keep Existing Price List',
};

export const configEnum = {
  CUSTOME_MASTER_CONFIG: 'customerMasterConfig',
  QUOTE_CONFIG: 'quoteConfig',
  CUSTOMER_ORDER_CONFIG: 'customerOrderConfig',
  SALES_ORDER_CONFIG: 'salesOrderConfig',
  DELIVERY_CHALLANS_CONFIG: 'deliveryChallansConfig',
  INVOICE_CONFIG: 'invoiceConfig',
  RECURRING_INVOICE_CONFIG: 'recurringInvoiceConfig',
  RECURRING_EXPENSE_CONFIG: 'recurringExpenseConfig',
  RECURRING_BILL_CONFIG: 'recurringBillConfig',
  PAYMENT_RECEIVED_CONFIG: 'paymentReceivedConfig',
  CUSTOMER_PAYMENT_CONFIG: 'customerPaymentConfig',
  SAMPLE_CATALOG_CONFIG: 'sampleCatalogConfig',
  CREDIT_NOTES_CONFIG: 'creditNotesConfig',
  EXPENSE_CONFIG: 'expenseConfig',
  PURCHASE_ORDER_CONFIG: 'purchaseOrderConfig',
  GRPO_CONFIG: 'grpoConfig',
  BILL_CONFIG: 'billConfig',
  PAYMENT_MADE_CONFIG: 'paymentMadeConfig',
  DEBIT_NOTE_CONFIG: 'debitNoteConfig',
  BANK_CONFIG: 'bankConfig',
  ITEM_MASTER_CONFIG: 'itemMasterConfig',
  ITEM_GROUP_CONFIG: 'itemGroupConfig',
  MAN_POWER_CONFIG: 'manPowerConfig',
  SALES_ORDER_TAG_CONFIG: 'salesOrderTagConfig',
  ITEM_INVENTORY_CONFIG: 'itemInventoryConfig',
  QUALITY_MASTER_CONFIG: 'qualityMasterConfig',
  DIVISION_MASTER_CONFIG: 'divisionMasterConfig',
  BRANCH_MASTER_CONFIG: 'branchMasterConfig',
  WAREHOUSE_MASTER_CONFIG: 'warehouseMasterConfig',
  PROCESS_MASTER_CONFIG: 'processMasterConfig',
  RECIPE_MASTER_CONFIG: 'recipeMasterConfig',
  PRICE_LIST_CONFIG: 'priceListConfig',
  PROJECT_CONFIG: 'projectConfig',
  PRODUCTION_MODULE_CONFIG: 'productionModuleConfig',
  ADD_PRODUCTION_MODULE_CONFIG: 'productionModuleConfig',
  INVENTORY_TRANSFER_REQUEST_CONFIG: 'inventoryTransferRequestConfig',
  INVENTORY_TRANSFER_MANUAL_CONFIG: 'inventoryTransferManualConfig',
  INVENTORY_TRANSFER_PRODUCTION_CONFIG: 'inventoryTransferProductionConfig',
  ACCOUNT_LEDGER_CONFIG: 'accountLedgerConfig',
  CHART_OF_ACCOUNTS_CONFIG: 'chartOfAccountsConfig',
  ADD_INVENTORY_LOGS_CONFIG: 'addInventoryLogsConfig',
  MANUAL_JOURNAL: 'manualJournalConfig',
  INVENTORY_ADJUSTMENT: 'inventory_adjustment',
  REJECTION_ORDER_CONFIG: 'rejectionOrderConfig',
  SPARE_PART_CONFIG: 'sparePartConfig',
  MACHINE_CONFIG: 'machineConfig',
  MAINTENANCE_REQUEST_CONFIG: 'maintenanceRequestConfig',
  MAINTENANCE_PURCHASE_CONFIG: 'maintenancePurchaseConfig',
  PART_REQUEST_CONFIG: 'partRequestConfig',
  SPARE_STOCK_LEDGER_CONFIG: 'spareStockLedgerConfig',
  INVENTORY_BATCHES_CONFIG: 'inventoryBatchesConfig',
};

export const BACKEND_ENUM = {
  PENDING: 'PENDING',
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  SENT: 'SENT',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  OPEN: 'OPEN',
  INVOICED: 'INVOICED',
  CLOSED: 'CLOSED',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
  CONVERTED: 'CONVERTED',
  RECORDED: 'RECORDED',
  DELIVERED: 'DELIVERED',
  APPROVED: 'APPROVED',
  USED: 'USED',
  VOID: 'VOID',
  PARTIALLY_RECORDED: 'PARTIALLY_RECORDED',
  PARTIALLY_USED: 'PARTIALLY_USED',
};

export const STOCK_STATUS = {
  NORMAL: 'NORMAL',
  BELOW_MINIMUM: 'BELOW_MINIMUM',
  ABOVE_MAXIMUM: 'ABOVE_MAXIMUM',
  NO_RANGE: 'NO_RANGE',
};

export const SALES_ORDER_MATERIAL_STATUS = {
  AVAILABLE: 'AVAILABLE',
  PARTIALLY_READY: 'PARTIALLY_READY',
  ISSUES: 'ISSUES',
};

export const SALES_ORDER_MATERIAL_STATUS_LABELS = {
  AVAILABLE: 'Ready for Production',
  PARTIALLY_READY: 'Partially Ready',
  ISSUES: 'Waiting for Material',
};

export const QUOTE_STATUS = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};
export const QUOTE_EDIT_RESTRICTED_STATUS = [BACKEND_ENUM?.SENT, BACKEND_ENUM?.ACCEPTED, BACKEND_ENUM?.REJECTED, BACKEND_ENUM?.COMPLETED, BACKEND_ENUM?.EXPIRED, BACKEND_ENUM?.CANCELLED];
export const QUOTE_CONVERSION_ALLOWED_STATUSES = [BACKEND_ENUM?.ACCEPTED];
export const QUOTE_STATUS_CHANGE_RESTRICTED_STATUS = [];

export const CUSTOMER_ORDER_STATUS = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  UNDER_REVIEW: 'Under Review', // Sample orders only.
  ACCEPTED: 'Accepted',
  REJECTED: 'Rejected',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};
export const CUSTOMER_ORDER_CONVERSION_ALLOWED_STATUSES = [BACKEND_ENUM?.ACCEPTED];

export const CUSTOMER_ORDER_TYPE = {
  REGULAR: 'Regular',
  SAMPLE: 'Sample',
};

export const CUSTOMER_ORDER_TYPE_FILTER_OPTIONS = [
  { value: '', label: 'All Orders' },
  { value: 'SAMPLE', label: 'Sample Orders' },
  { value: 'REGULAR', label: 'Regular Orders' },
];

export const CUSTOMER_ORDER_FILTER_HINT = {
  SAMPLE_CATALOG_REGULAR: 'Regular orders are not placed from a sample catalog.',
};

export const CUSTOMER_ORDER_STATUS_ACTIONS = {
  REGULAR: { SENT: ['ACCEPTED', 'REJECTED'] },
  SAMPLE: { SENT: ['UNDER_REVIEW', 'ACCEPTED', 'REJECTED'], UNDER_REVIEW: ['ACCEPTED', 'REJECTED'] },
};

export const SAMPLE_CATALOG_STATUS = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
};
export const SAMPLE_CATALOG_VISIBILITY = {
  ALL_CUSTOMERS: 'All App Customers',
  SELECTED_CUSTOMERS: 'Selected Customers',
};
export const SAMPLE_CATALOG_UNIT_HINT = {
  SINGLE_UNIT: unitName => `Only ${unitName} is set up. Add unit conversions in Item master to offer more.`,
  ADD_UNIT: 'Add unit',
  ALL_UNITS_ADDED: 'All units of this item are already added.',
  CONVERSION: (qty, unitName, baseQty, baseUnitName) => `${qty} ${unitName} = ${baseQty} ${baseUnitName}`,
  SAME_ITEM: 'Same item',
};
// Customer-submitted payments (portal). SUBMITTED awaits the supplier recording it into a
// PaymentReceived (APPROVED) or rejecting it.
export const CUSTOMER_PAYMENT_STATUS = {
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
};

export const SALES_ORDER_STATUS = {
  DRAFT: 'Draft',
  OPEN: 'Open',
  PARTIALLY_RECORDED: 'Partially Recorded',
  COMPLETED: 'Completed',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled',
};
export const SALES_ORDER_EDIT_RESTRICTED_STATUS = [
  BACKEND_ENUM?.OPEN,
  BACKEND_ENUM?.INVOICED,
  BACKEND_ENUM?.CLOSED,
  BACKEND_ENUM?.CANCELLED,
  BACKEND_ENUM?.COMPLETED,
  BACKEND_ENUM?.PARTIALLY_RECORDED,
];
export const SALES_ORDER_CONVERSION_ALLOWED_STATUSES = [BACKEND_ENUM?.OPEN, BACKEND_ENUM?.PARTIALLY_RECORDED];
export const SALES_ORDER_STATUS_CHANGE_RESTRICTED_STATUS = [];

export const DELIVERY_CHALLAN_STATUS = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  CANCELLED: 'Cancelled',
  DELIVERED: 'Delivered',
};
export const DELIVERY_CHALLAN_EDIT_RESTRICTED_STATUS = [BACKEND_ENUM?.SENT, BACKEND_ENUM?.CANCELLED, BACKEND_ENUM?.DELIVERED];
export const DELIVERY_CHALLAN_CONVERSION_ALLOWED_STATUSES = [BACKEND_ENUM?.SENT];
export const DELIVERY_CHALLAN_STATUS_CHANGE_RESTRICTED_STATUS = [];
export const DELIVERY_CHALLAN_EWAY_BILL_STATUSES = [BACKEND_ENUM?.SENT, BACKEND_ENUM?.DELIVERED];

export const INVOICE_STATUS = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  PARTIALLY_PAID: 'Partially Paid',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
  CANCELLED: 'Cancelled',
};
export const INVOICE_EDIT_RESTRICTED_STATUS = [BACKEND_ENUM?.SENT, BACKEND_ENUM?.PAID, BACKEND_ENUM.PARTIALLY_PAID, BACKEND_ENUM.OVERDUE, BACKEND_ENUM.CANCELLED];
export const INVOICE_STATUS_CHANGE_RESTRICTED_STATUS = [BACKEND_ENUM?.CANCELLED];

export const PAYMENT_RECEIVED_STATUS = {
  PENDING: 'Pending',
  COMPLETED: 'Completed',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
  CANCELLED: 'Cancelled',
};

export const PAYMENT_TRANSACTION_TYPE = {
  TRANSFER: 'TRANSFER',
  WITHDRAWAL: 'WITHDRAWAL',
  DEPOSIT: 'DEPOSIT',
};

export const PAYMENT_MODES = {
  PETTY_CASH: 'PETTY_CASH',
  CHEQUE: 'CHEQUE',
  BANK_TRANSFER: 'BANK_TRANSFER',
  UPI: 'UPI',
  OTHER: 'OTHER',
};

export const PAYMENT_MODE_OPTIONS = [
  { value: PAYMENT_MODES.PETTY_CASH, label: 'Petty Cash' },
  { value: PAYMENT_MODES.CHEQUE, label: 'Cheque' },
  { value: PAYMENT_MODES.BANK_TRANSFER, label: 'Bank Transfer' },
  { value: PAYMENT_MODES.UPI, label: 'UPI' },
];

// Display labels for payment modes (PAYMENT_MODES.OTHER is not offered in forms but can be stored).
export const PAYMENT_MODE_LABELS = {
  ...Object.fromEntries(PAYMENT_MODE_OPTIONS.map(({ value, label }) => [value, label])),
  [PAYMENT_MODES.OTHER]: 'Other',
};

export const getPaymentModeLabel = mode => PAYMENT_MODE_LABELS[mode] || mode || '-';

export const PAYMENT_RECEIVED_TYPE_LABELS = {
  ADVANCE: 'Advance',
  INVOICE: 'Invoice',
};

export const getPaymentReceivedTypeBadgeProps = record =>
  record?.isAdvancePayment || record?.paymentReceivedType === PAYMENT_RECEIVED_TYPE_LABELS.ADVANCE
    ? { status: 'ADVANCE', value: PAYMENT_RECEIVED_TYPE_LABELS.ADVANCE }
    : { status: 'INVOICE', value: PAYMENT_RECEIVED_TYPE_LABELS.INVOICE };

export const CREDIT_NOTE_STATUS = {
  DRAFT: 'Draft',
  OPEN: 'Open',
  PARTIALLY_USED: 'Partially Used',
  USED: 'Used',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled',
};
export const CREDIT_NOTE_EDIT_RESTRICTED_STATUS = [BACKEND_ENUM?.OPEN, BACKEND_ENUM?.USED, BACKEND_ENUM.PARTIALLY_USED, BACKEND_ENUM.CANCELLED, BACKEND_ENUM.CLOSED];
export const CREDIT_NOTE_STATUS_CHANGE_RESTRICTED_STATUS = [BACKEND_ENUM?.USED];
export const CREDIT_NOTE_APPLIED_STATUS = [BACKEND_ENUM?.OPEN, BACKEND_ENUM.PARTIALLY_USED];

export const PURCHASE_ORDER_STATUS = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  ACCEPTED: 'Accepted',
  PARTIALLY_RECORDED: 'Partially Recorded',
  REJECTED: 'Rejected',
  CONVERTED: 'Converted',
  CANCELLED: 'Cancelled',
  CLOSED: 'Closed',
};
export const PURCHASE_ORDER_EDIT_RESTRICTED_STATUS = [
  BACKEND_ENUM?.SENT,
  BACKEND_ENUM?.ACCEPTED,
  BACKEND_ENUM?.REJECTED,
  BACKEND_ENUM?.CONVERTED,
  BACKEND_ENUM?.CANCELLED,
  BACKEND_ENUM?.PARTIALLY_RECORDED,
  BACKEND_ENUM?.CLOSED,
];
export const PURCHASE_ORDER_CONVERSION_ALLOWED_STATUSES = [BACKEND_ENUM?.ACCEPTED, BACKEND_ENUM?.PARTIALLY_RECORDED];
export const PURCHASE_ORDER_STATUS_CHANGE_RESTRICTED_STATUS = [];

export const GRPO_STATUS = {
  DRAFT: 'Draft',
  RECORDED: 'Recorded',
  CONVERTED: 'Converted',
  CANCELLED: 'Cancelled',
};
export const GRPO_EDIT_RESTRICTED_STATUS = [BACKEND_ENUM?.RECORDED, BACKEND_ENUM?.CONVERTED, BACKEND_ENUM?.CANCELLED];
export const GRPO_CONVERSION_ALLOWED_STATUSES = [BACKEND_ENUM?.RECORDED];
export const GRPO_STATUS_CHANGE_RESTRICTED_STATUS = [];

export const BILL_STATUS = {
  DRAFT: 'Draft',
  OPEN: 'Open',
  PAID: 'Paid',
  PARTIALLY_PAID: 'Partially Paid',
  OVERDUE: 'Overdue',
  CANCELLED: 'Cancelled',
};

export const EXPENSE_BILLABLE_STATUS = {
  UNPAID: 'Unpaid',
  PARTIALLY_PAID: 'Partially Paid',
  PAID: 'Paid',
};

export const BILL_EDIT_RESTRICTED_STATUS = [BACKEND_ENUM?.OPEN, BACKEND_ENUM?.PAID, BACKEND_ENUM?.PARTIALLY_PAID, BACKEND_ENUM?.OVERDUE, BACKEND_ENUM?.CANCELLED];
export const BILL_STATUS_CHANGE_RESTRICTED_STATUS = [
  // BACKEND_ENUM?.OPEN,
  // BACKEND_ENUM?.PAID,
  // BACKEND_ENUM?.PARTIALLY_PAID,
  // BACKEND_ENUM?.OVERDUE,
  BACKEND_ENUM?.CANCELLED,
];

export const PAYMENT_MADE_STATUS = {
  PENDING: 'Pending',
  COMPLETED: 'Completed',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
  CANCELLED: 'Cancelled',
};

export const PAYMENT_MADE_TYPE_LABELS = {
  ADVANCE: 'Advance',
  BILL: 'Bill',
};

// Same rule as payments received — see getPaymentReceivedTypeBadgeProps.
export const getPaymentMadeTypeBadgeProps = record =>
  record?.isAdvancePayment || record?.paymentMadeType === PAYMENT_MADE_TYPE_LABELS.ADVANCE
    ? { status: 'ADVANCE', value: PAYMENT_MADE_TYPE_LABELS.ADVANCE }
    : { status: 'BILL', value: PAYMENT_MADE_TYPE_LABELS.BILL };

export const DEBIT_NOTE_STATUS = {
  DRAFT: 'Draft',
  OPEN: 'Open',
  PARTIALLY_USED: 'Partially Used',
  USED: 'Used',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled',
};
export const DEBIT_NOTE_EDIT_RESTRICTED_STATUS = [BACKEND_ENUM?.OPEN, BACKEND_ENUM?.USED, BACKEND_ENUM.PARTIALLY_USED, BACKEND_ENUM.CANCELLED, BACKEND_ENUM.CLOSED];
export const DEBIT_NOTE_STATUS_CHANGE_RESTRICTED_STATUS = [BACKEND_ENUM?.USED];
export const DEBIT_NOTE_APPLIED_STATUS = [BACKEND_ENUM?.OPEN, BACKEND_ENUM.PARTIALLY_USED];

export const PRODUCTION_MODULE_STATUS = {
  PENDING: 'Pending',
  WAITING_FOR_INVENTORY_APPROVAL: 'Waiting for Inventory Approval',
  INVENTORY_ISSUED: 'Inventory Issued',
  INVENTORY_REJECTED: 'Inventory Rejected',
  PARTIAL: 'Partial',
  COMPLETED: 'Completed',
  ON_HOLD: 'On Hold',
  CLOSED: 'Closed',
};

export const RAW_MATERIAL_STATUS = {
  AVAILABLE: 'Available',
  PARTIALLY_AVAILABLE: 'Partially Available',
  UNAVAILABLE: 'Unavailable',
};

export const PRODUCTION_MODULE_BACKEND_STATUS = {
  PENDING: 'PENDING',
  WAITING_FOR_INVENTORY_APPROVAL: 'WAITING_FOR_INVENTORY_APPROVAL',
  INVENTORY_ISSUED: 'INVENTORY_ISSUED',
  INVENTORY_REJECTED: 'INVENTORY_REJECTED',
  PARTIAL: 'PARTIAL',
  COMPLETED: 'COMPLETED',
  ON_HOLD: 'ON_HOLD',
  UNHOLD: 'UNHOLD',
  REVERT_MANUAL_COMPLETION: 'REVERT_MANUAL_COMPLETION',
  CLOSED: 'CLOSED',
};

export const MARK_AS_CLOSE_ALLOWED_STATUSES = [
  PRODUCTION_MODULE_BACKEND_STATUS.PENDING,
  PRODUCTION_MODULE_BACKEND_STATUS.PARTIAL,
  PRODUCTION_MODULE_BACKEND_STATUS.INVENTORY_ISSUED,
  PRODUCTION_MODULE_BACKEND_STATUS.INVENTORY_REJECTED,
  PRODUCTION_MODULE_BACKEND_STATUS.WAITING_FOR_INVENTORY_APPROVAL,
];

export const PRODUCTION_ACTIVE_STATUSES = [PRODUCTION_MODULE_BACKEND_STATUS.PENDING, PRODUCTION_MODULE_BACKEND_STATUS.PARTIAL, PRODUCTION_MODULE_BACKEND_STATUS.INVENTORY_ISSUED];

export const PRODUCTION_DELETE_ALLOWED_STATUSES = [PRODUCTION_MODULE_BACKEND_STATUS.PENDING, PRODUCTION_MODULE_BACKEND_STATUS.PARTIAL, PRODUCTION_MODULE_BACKEND_STATUS.INVENTORY_REJECTED];

export const PRODUCTION_MODULE_METHOD = {
  BOM_BASED: 'BOM_BASED',
  PROCESS_ROUTE: 'PROCESS_ROUTE',
};

export const PRODUCTION_MODULE_METHOD_LABEL = {
  BOM_BASED: 'BOM Based',
  PROCESS_ROUTE: 'Process Route',
};

export const PROCESS_STATUS = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  PARTIALLY_COMPLETED: 'Partial',
  COMPLETED: 'Completed',
};

export const PRODUCTION_ORDER_ACTIVITY_TYPE = {
  ORDER_CREATED: 'Order Created',
  SEQUENCE_REARRANGED: 'Sequence Rearranged',
  SEQUENCE_LOCKED: 'Sequence Locked',
  SEQUENCE_UNLOCKED: 'Sequence Unlocked',
  PROCESS_STARTED: 'Process Started',
  PROCESS_SUBMITTED: 'Process Submitted',
  PROCESS_SUBMISSION_EDITED: 'Process Submission Edited',
  PROCESS_SUBMISSION_DELETED: 'Process Submission Deleted',
  PROCESS_COMPLETED: 'Process Completed',
  FG_SUBMITTED: 'FG Submitted',
  FG_SUBMISSION_EDITED: 'FG Submission Edited',
  FG_SUBMISSION_DELETED: 'FG Submission Deleted',
  STATUS_CHANGED: 'Status Changed',
  TRANSFER_REQUEST_RERAISED: 'Transfer Request Re-raised',
};

export const PRODUCTION_ORDER_INVENTORY_EVENT_TYPE = {
  PROCESS_SUBMISSION: 'Process Submission',
  PROCESS_SUBMISSION_EDITED: 'Process Submission Edited',
  PROCESS_SUBMISSION_DELETED: 'Process Submission Deleted',
  RAW_MATERIAL_CONSUMED: 'Raw Material Consumed',
  RAW_MATERIAL_CONSUMPTION_EDITED: 'Raw Material Consumption Edited',
  RAW_MATERIAL_CONSUMPTION_DELETED: 'Raw Material Consumption Deleted',
  RAW_MATERIAL_RETURNED: 'Raw Material Returned',
  RAW_MATERIAL_RETURN_EDITED: 'Raw Material Return Edited',
  RAW_MATERIAL_RETURN_DELETED: 'Raw Material Return Deleted',
  SCRAP_BOOKED: 'Scrap Booked',
  SCRAP_EDITED: 'Scrap Edited',
  SCRAP_DELETED: 'Scrap Deleted',
  FINISHED_GOODS_POSTED: 'Finished Goods Posted',
  FINISHED_GOODS_EDITED: 'Finished Goods Edited',
  FINISHED_GOODS_DELETED: 'Finished Goods Deleted',
};

export const INVENTORY_ADJUSTMENT_REASONS = {
  STOCK_ON_FIRE: 'Stock on fire',
  STOLEN_GOODS: 'Stolen goods',
  DAMAGED_GOODS: 'Damaged goods',
  STOCK_WRITTEN_OFF: 'Stock written off',
  STOCKTAKING_RESULTS: 'Stocktaking results',
  INVENTORY_REVALUATION: 'Inventory revaluation',
  OTHER: 'Other',
};

export const INVENTORY_SOURCE_TYPE = {
  PRODUCTION_ORDER: 'PRODUCTION_ORDER',
  EXISTING_INVENTORY: 'EXISTING_INVENTORY',
  MANUAL_STOCK_ADD: 'MANUAL_STOCK_ADD',
  MANUAL_STOCK_TRANSFER: 'MANUAL_STOCK_TRANSFER',
  PRODUCTIONORDER_STOCK_TRANSFER: 'PRODUCTIONORDER_STOCK_TRANSFER',
  DELIVERY_CHALLAN_STOCK_TRANSFER: 'DELIVERY_CHALLAN_STOCK_TRANSFER',
  OPENING_STOCK: 'OPENING_STOCK',
  REJECTION_RECOVERY: 'REJECTION_RECOVERY',
};

export const SOURCE_TYPES = [
  MODULE_NAMES.GRPO,
  MODULE_NAMES.BILL,
  MODULE_NAMES.CREDIT_NOTE,
  MODULE_NAMES.SPLIT_CREDIT_NOTE,
  INVENTORY_SOURCE_TYPE.PRODUCTION_ORDER,
  INVENTORY_SOURCE_TYPE.EXISTING_INVENTORY,
  INVENTORY_SOURCE_TYPE.MANUAL_STOCK_ADD,
  INVENTORY_SOURCE_TYPE.MANUAL_STOCK_TRANSFER,
  INVENTORY_SOURCE_TYPE.PRODUCTIONORDER_STOCK_TRANSFER,
  INVENTORY_SOURCE_TYPE.DELIVERY_CHALLAN_STOCK_TRANSFER,
  INVENTORY_SOURCE_TYPE.OPENING_STOCK,
  MODULE_NAMES.INVENTORY_ADJUSTMENT,
  MODULE_NAMES.SPLIT_BILL,
  INVENTORY_SOURCE_TYPE.REJECTION_RECOVERY,
];

export const SOURCE_ROUTES = {
  [MODULE_NAMES.GRPO]: id => `/grpo/${id}`,
  [MODULE_NAMES.BILL]: id => `/bills/${id}`,
  [MODULE_NAMES.CREDIT_NOTE]: id => `/credit-notes/${id}`,
  [MODULE_NAMES.SPLIT_CREDIT_NOTE]: id => `/credit-notes/${id}`,
  [INVENTORY_SOURCE_TYPE.PRODUCTION_ORDER]: id => `/production-orders/${id}`,
  [INVENTORY_SOURCE_TYPE.MANUAL_STOCK_TRANSFER]: id => `/inventory-transfer-request/${id}`,
  [INVENTORY_SOURCE_TYPE.PRODUCTIONORDER_STOCK_TRANSFER]: id => `/inventory-transfer-request/${id}`,
  [INVENTORY_SOURCE_TYPE.DELIVERY_CHALLAN_STOCK_TRANSFER]: id => `/delivery-challans/${id}`,
  [MODULE_NAMES.INVENTORY_ADJUSTMENT]: id => `/inventory-adjustment/${id}`,
  [MODULE_NAMES.SPLIT_BILL]: id => `/bills/${id}`,
  [INVENTORY_SOURCE_TYPE.REJECTION_RECOVERY]: id => `/rejection-orders/${id}`,
};

export const DEDUCTED_SOURCE_TYPES = [
  MODULE_NAMES.INVOICE,
  MODULE_NAMES.DELIVERY_CHALLAN,
  MODULE_NAMES.DEBIT_NOTE,
  MODULE_NAMES.SPLIT_DEBIT_NOTE,
  INVENTORY_SOURCE_TYPE.PRODUCTION_ORDER,
  INVENTORY_SOURCE_TYPE.MANUAL_STOCK_TRANSFER,
  INVENTORY_SOURCE_TYPE.PRODUCTIONORDER_STOCK_TRANSFER,
  INVENTORY_SOURCE_TYPE.DELIVERY_CHALLAN_STOCK_TRANSFER,
  MODULE_NAMES.INVENTORY_ADJUSTMENT,
  MODULE_NAMES.SPLIT_INVOICE,
];

export const DEDUCTED_SOURCE_ROUTES = {
  [MODULE_NAMES.INVOICE]: id => `/invoices/${id}`,
  [MODULE_NAMES.DELIVERY_CHALLAN]: id => `/delivery-challans/${id}`,
  [MODULE_NAMES.DEBIT_NOTE]: id => `/debit-notes/${id}`,
  [MODULE_NAMES.SPLIT_DEBIT_NOTE]: id => `/debit-notes/${id}`,
  [INVENTORY_SOURCE_TYPE.PRODUCTION_ORDER]: id => `/production-orders/${id}`,
  [INVENTORY_SOURCE_TYPE.MANUAL_STOCK_TRANSFER]: id => `/inventory-transfer-request/${id}`,
  [INVENTORY_SOURCE_TYPE.PRODUCTIONORDER_STOCK_TRANSFER]: id => `/inventory-transfer-request/${id}`,
  [INVENTORY_SOURCE_TYPE.DELIVERY_CHALLAN_STOCK_TRANSFER]: id => `/delivery-challans/${id}`,
  [MODULE_NAMES.INVENTORY_ADJUSTMENT]: id => `/inventory-adjustment/${id}`,
  [MODULE_NAMES.SPLIT_INVOICE]: id => `/invoices/${id}`,
};

export const LEDGER_DETAIL_ROUTES = {
  Quote: { build: id => `quotes/${id}` },
  SalesOrder: { build: id => `sales-orders/${id}` },
  DeliveryChallan: { build: id => `delivery-challans/${id}` },
  Invoice: { build: id => `invoices/${id}` },
  PurchaseOrder: { build: id => `purchase-orders/${id}` },
  GrpoOrder: { build: id => `grpo/${id}` },
  Bill: { build: id => `bills/${id}` },
  ProductionOrder: { build: id => `production-orders/${id}` },
  CreditNote: { build: id => `credit-notes/${id}` },
  DebitNote: { build: id => `debit-notes/${id}` },
  InventoryTransferRequest: { build: id => `inventory-transfer-request/${id}` },
  PaymentReceived: { build: id => `payments-received/${id}` },
  PaymentMade: { build: id => `payments-made/${id}` },
  Expense: { build: id => `expenses/${id}` },
  ManualJournal: { build: id => `manual-journal/${id}` },
  Customer: { build: id => `customer-master/${id}`, hash: 'branch' },
  Vendor: { build: id => `vendors/${id}`, hash: 'branch' },
  Item: { build: id => `item-master/${id}`, hash: 'inventory-data' },
  Account: { build: id => `accountant/${id}` },
};

export const MONTHS_ENUM = {
  1: { short: 'Jan', long: 'January' },
  2: { short: 'Feb', long: 'February' },
  3: { short: 'Mar', long: 'March' },
  4: { short: 'Apr', long: 'April' },
  5: { short: 'May', long: 'May' },
  6: { short: 'Jun', long: 'June' },
  7: { short: 'Jul', long: 'July' },
  8: { short: 'Aug', long: 'August' },
  9: { short: 'Sep', long: 'September' },
  10: { short: 'Oct', long: 'October' },
  11: { short: 'Nov', long: 'November' },
  12: { short: 'Dec', long: 'December' },
};

export const NAVIGATION_ENUM = {
  QUOTE: 'quotes',
  Invoice: 'invoices',
  SalesOrder: 'sales-orders',
  DeliveryChallan: 'delivery-challans',
  PurchaseOrder: 'purchase-orders',
  BILL: 'bills',
  GRPO: 'grpo',
  CustomerOrder: 'customer-orders',
  RejectionOrder: 'rejection-orders',
};

export const CUSTOMER_TYPE = {
  SUNDRY_CREDITORS: 'Sundry Creditors',
  SUNDRY_DEBTORS: 'Sundry Debtors',
  EXPENSES: 'Expenses Vendor',
  LOAN_BORROWER: 'Loan Borrower',
  LOAN_LENDER: 'Loan Lander',
};

export const ITEM_UNITS = {
  NUMBERS: 'NOS',
  PIECES: 'PCS',
  BOX: 'BOX',
  KILOGRAMS: 'KGS',
  GRAMS: 'GMS',
  METER: 'MTR',
  FEET: 'FT',
  LITER: 'LTR',
  MILILITER: 'MLT',
  OTHERS: 'OTH',
  BOTTLES: 'BTL',
  CANS: 'CAN',
  CENTIMETER: 'CMS',
  DOZENS: 'DOZ',
  CARTONS: 'CTN',
  METRIC_TON: 'MTS',
  PACKS: 'PAS',
  PAIRS: 'PRS',
  QUINTAL: 'QTL',
  ROLLS: 'ROL',
  SETS: 'SET',
  TABLETS: 'TBS',
  TONNES: 'TON',
  TUBES: 'TUB',
  UNITS: 'UNT',
  YARDS: 'YDS',
};

export const BULK_ITEM_VERIFY_ERROR = {
  ITEM_GROUP_NOT_FOUND: 'ITEM_GROUP_NOT_FOUND',
  SUB_ITEM_GROUP_NOT_FOUND: 'SUB_ITEM_GROUP_NOT_FOUND',
  ITEM_UNIT_NOT_FOUND: 'ITEM_UNIT_NOT_FOUND',
  SALES_ACCOUNT_NOT_FOUND: 'SALES_ACCOUNT_NOT_FOUND',
  PURCHASE_ACCOUNT_NOT_FOUND: 'PURCHASE_ACCOUNT_NOT_FOUND',
  INVENTORY_ACCOUNT_NOT_FOUND: 'INVENTORY_ACCOUNT_NOT_FOUND',
};

export const BULK_CUSTOMER_VERIFY_ERROR = {
  CURRENCY_NOT_AVAILABLE: 'CURRENCY_NOT_AVAILABLE',
  INVALID_PAYMENT_TERMS: 'INVALID_PAYMENT_TERMS',
  BILLING_COUNTRY_NOT_FOUND: 'BILLING_COUNTRY_NOT_FOUND',
  BILLING_COUNTRY_REQUIRED: 'BILLING_COUNTRY_REQUIRED',
  BILLING_STATE_NOT_FOUND: 'BILLING_STATE_NOT_FOUND',
  BILLING_STATE_REQUIRED: 'BILLING_STATE_REQUIRED',
  BILLING_CITY_NOT_FOUND: 'BILLING_CITY_NOT_FOUND',
  BILLING_CITY_REQUIRED: 'BILLING_CITY_REQUIRED',
  SHIPPING_COUNTRY_NOT_FOUND: 'SHIPPING_COUNTRY_NOT_FOUND',
  SHIPPING_COUNTRY_REQUIRED: 'SHIPPING_COUNTRY_REQUIRED',
  SHIPPING_STATE_NOT_FOUND: 'SHIPPING_STATE_NOT_FOUND',
  SHIPPING_STATE_REQUIRED: 'SHIPPING_STATE_REQUIRED',
  SHIPPING_CITY_NOT_FOUND: 'SHIPPING_CITY_NOT_FOUND',
  SHIPPING_CITY_REQUIRED: 'SHIPPING_CITY_REQUIRED',
};

export const COMPANY_FEATURE = {
  ENABLESPLITBYQTYORPRICE: 'ENABLESPLITBYQTYORPRICE',
  EINVOICEANDEWAYBILL: 'EINVOICEANDEWAYBILL',
  ONLYEWAYBILL: 'ONLYEWAYBILL',
};

export const SESSION_DURATION = 180; // Time in seconds
export const SESSION_EXPIRES_ALERT_DURATION = 10; // Time in seconds

export const RECURRING_INVOICE_STATUS = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const RECURRING_INVOICE_STATUS_CHANGE_RESTRICTED_STATUS = [BACKEND_ENUM?.COMPLETED, BACKEND_ENUM?.CANCELLED];

export const RECURRING_BILL_STATUS = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const RECURRING_BILL_STATUS_CHANGE_RESTRICTED_STATUS = [BACKEND_ENUM?.COMPLETED, BACKEND_ENUM?.CANCELLED];

export const RECURRING_EXPENSE_STATUS = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const RECURRING_EXPENSE_STATUS_CHANGE_RESTRICTED_STATUS = [BACKEND_ENUM?.COMPLETED, BACKEND_ENUM?.CANCELLED];

export const CREDIT_LIMIT_TYPE = {
  'Branch Wise': 'Branch Wise',
  Unified: 'Unified',
};

export const DISCOUNT_CONFIG_CHANGE_MODAL = {
  TITLE: 'Discount config has changed',
  OK_TEXT: 'Apply New Discount Config',
  CANCEL_TEXT: 'Keep Existing Discount Config',
};

export const DELETE_DOC_NOTES = {
  [MODULE_NAMES?.QUOTATION]: [
    'if you delete this it will effect on quote',
    'if you delete this it will effect on SO',
    'if you delete this it will effect on DC',
    'if you delete this it will effect on Invoice',
  ],
};

export const ACCOUNT_TYPE_ENUM = {
  CREDITORS: 'Creditors',
  DEBTORS: 'Debtors',
  NONE: 'None',
};

export const CREDIT_NOTE_TYPE_ENUM = {
  GOODS_RETURN: 'Goods Return',
  GOODS_REJECTION: 'Goods Rejection',
  RATE_DIFFERENCE: 'Rate Difference',
  QUANTITY_SHORTAGE: 'Quantity Shortage',
  TAX_ADJUSTMENT: 'Tax Adjustment',
  POST_SALE_DISCOUNT: 'Post Sale Discount',
  SERVICE_CANCELLATION: 'Service Cancellation',
  OTHER: 'Other',
};

export const DEBIT_NOTE_TYPE_ENUM = CREDIT_NOTE_TYPE_ENUM;

export const CHEQUE_STATUS = {
  RECEIVED: 'RECEIVED',
  DEPOSITED: 'DEPOSITED',
  CLEARED: 'CLEARED',
  BOUNCED: 'BOUNCED',
  PENDING: 'PENDING',
};

export const ALERT_TYPE = {
  SUCCESS: { type: 'success', color: '#52c41a' },
  INFO: { type: 'info', color: '#1677ff' },
  WARNING: { type: 'warning', color: '#faad14' },
  ERROR: { type: 'error', color: '#ff4d4f' },
};

export const CURRENCIES = {
  INR: 'INR',
};

export const CURRENCY_FORMAT_OPTIONS = [
  { label: '1,234,567.89', value: '1,234,567.89' },
  { label: '1.234.567,89', value: '1.234.567,89' },
  { label: '1 234 567,89', value: '1 234 567,89' },
  { label: '1,23,45,678.90 (Indian)', value: '1,23,45,678.90', default: true },
];

export const CURRENCY_DECIMAL_OPTIONS = [0, 1, 2, 3, 4].map(n => ({
  label: String(n),
  value: n,
}));

export const REPORTING_METHODS = [
  {
    label: 'Accrual and Cash',
    value: 'accrual-and-cash',
  },
  {
    label: 'Accrual Only',
    value: 'accrual-only',
  },
  {
    label: 'Cash Only',
    value: 'cash-only',
  },
];

export const FEATURE_NAMES = {
  banks: 'Bank',
  items: 'Item',
  users: 'User',
  division: 'Division',
  branch: 'Branch',
  warehouseMaster: 'Warehouse',
  customers: 'Customer',
  quotations: 'Quotation',
  salesOrders: 'Sales Order',
  invoices: 'Invoice',
  paymentReceived: 'Payment Received',
  recurringInvoices: 'Recurring Invoice',
  creditNote: 'Credit Notes',
  vendor: 'Vendor',
  expenses: 'Expenses',
  deliveryChallan: 'Delivery Challan',
  grpo: 'GRPO',
  recurringExpense: 'Recurring Expenses',
  purchaseOrder: 'Purchase Order',
  bill: 'Bill',
  paymentMade: 'Payment Made',
  recurringBills: 'Recurring Bill',
  debitNote: 'Debit Note',
  accountLedger: 'Account Ledger',
  manualJournals: 'Manual Journal',
  addProduction: 'Add Production',
  INVENTORY: 'Inventory',
  PRODUCTION_ORDER: 'Production Order',
  E_INVOICE: 'E-Invoice',
  E_BILL: 'E-Bill',
  THIRD_PARTY_API_CALLS: 'NIC API Calls',
  campaigns: 'Campaign',
  leads: 'Lead',
  payments: 'Payment',
};

export const MODULE_TYPE = {
  SALES: 'SALES',
  PURCHASE: 'PURCHASE',
};

export const E_INVOICE_STATUS = {
  ACT: {
    label: 'Active',
    value: 'ACT',
  },
  CNL: {
    label: 'Cancelled',
    value: 'CNL',
  },
  EXP: {
    label: 'Expired',
    value: 'EXP',
  },
};

export const E_WAY_BILL_STATUS = {
  ACT: {
    label: 'Active',
    value: 'ACT',
  },
  CNL: {
    label: 'Cancelled',
    value: 'CNL',
  },
  DIS: {
    label: 'Discarded',
    value: 'DIS',
  },
};

// Cancellation reasons constant
export const E_INVOICE_CANCELLATION_REASONS = {
  1: { value: '1', label: 'Duplicate E-Invoice' },
  2: { value: '2', label: 'Data Entry Mistake' },
  3: { value: '3', label: 'Order Cancelled' },
  4: { value: '4', label: 'Other' },
};

export const E_WAY_BILL_CANCELLATION_REASONS = {
  1: { value: '1', label: 'Duplicate' },
  2: { value: '2', label: 'Data Entry Mistake' },
};

export const TRANSPORT_MODES = {
  1: 'Road',
  2: 'Rail',
  3: 'Air',
  4: 'Ship',
};

// Which form the shared GST document modals render.
export const GST_DOCUMENT_GENERATE_MODE = {
  E_INVOICE: 'E_INVOICE',
  E_WAY_BILL_BY_IRN: 'E_WAY_BILL_BY_IRN',
  E_WAY_BILL: 'E_WAY_BILL',
};

export const GST_DOCUMENT_CANCEL_MODE = {
  E_INVOICE: 'E_INVOICE',
  E_WAY_BILL: 'E_WAY_BILL',
};

export const ADDITIONAL_FEATURES = {
  ONLY_E_WAY_BILL: 'ONLY_E_WAY_BILL',
  E_INVOICE_AND_E_WAY_BILL: 'E_INVOICE_AND_E_WAY_BILL',
  PRODUCTION_ORDER: 'PRODUCTION_ORDER',
  DELIVERY_CHALLAN: 'DELIVERY_CHALLAN',
  GRPO: 'GRPO',
  CUSTOMER_ORDER: 'CUSTOMER_ORDER',
};

export const SUPPORT_PRIORITY_ENUM = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
};

export const SUPPORT_PRIORITY = {
  [SUPPORT_PRIORITY_ENUM.HIGH]: 'High',
  [SUPPORT_PRIORITY_ENUM.MEDIUM]: 'Medium',
  [SUPPORT_PRIORITY_ENUM.LOW]: 'Low',
};

export const SUPPORT_STATUS_ENUM = {
  RAISED: 'RAISED',
  REQUIREMENT_GATHERING: 'REQUIREMENT_GATHERING',
  DESIGNING: 'DESIGNING',
  PRODUCT_OWNER_REVIEW: 'PRODUCT_OWNER_REVIEW',
  DEVELOPMENT_HANDOVER: 'DEVELOPMENT_HANDOVER',
  DEVELOPMENT_REVIEW: 'DEVELOPMENT_REVIEW',
  DEVELOPMENT_WORK_ONGOING: 'DEVELOPMENT_WORK_ONGOING',
  PM_REVIEW: 'PM_REVIEW',
  CLIENT_TRAINING: 'CLIENT_TRAINING',
  CLOSED: 'CLOSED',
};

export const SUPPORT_STATUS = {
  [SUPPORT_STATUS_ENUM.RAISED]: 'Raised',
  [SUPPORT_STATUS_ENUM.REQUIREMENT_GATHERING]: 'Requirement Gathering',
  [SUPPORT_STATUS_ENUM.DESIGNING]: 'Screen Design',
  [SUPPORT_STATUS_ENUM.PRODUCT_OWNER_REVIEW]: 'Director Review',
  [SUPPORT_STATUS_ENUM.DEVELOPMENT_HANDOVER]: 'Handover to Development',
  [SUPPORT_STATUS_ENUM.DEVELOPMENT_REVIEW]: 'Developer Review',
  [SUPPORT_STATUS_ENUM.DEVELOPMENT_WORK_ONGOING]: 'In Development',
  [SUPPORT_STATUS_ENUM.PM_REVIEW]: 'PM Review',
  [SUPPORT_STATUS_ENUM.CLIENT_TRAINING]: 'User Training',
  [SUPPORT_STATUS_ENUM.CLOSED]: 'Closed',
};

export const SUPPORT_CATEGORY_ENUM = {
  BUG: 'BUG',
  CHANGE_REQUEST: 'CHANGE_REQUEST',
  NEW_MODULE: 'NEW_MODULE',
  FEATURE: 'FEATURE',
  DOCUMENTATION: 'DOCUMENTATION',
  OTHER: 'OTHER',
};

export const SUPPORT_CATEGORY = {
  [SUPPORT_CATEGORY_ENUM.BUG]: 'Bug',
  [SUPPORT_CATEGORY_ENUM.CHANGE_REQUEST]: 'Change Request',
  [SUPPORT_CATEGORY_ENUM.NEW_MODULE]: 'New Module',
  [SUPPORT_CATEGORY_ENUM.FEATURE]: 'Feature',
  [SUPPORT_CATEGORY_ENUM.DOCUMENTATION]: 'Documentation',
  [SUPPORT_CATEGORY_ENUM.OTHER]: 'Other',
};

export const BUG_STAGES = [
  { key: SUPPORT_STATUS_ENUM.RAISED, title: SUPPORT_STATUS[SUPPORT_STATUS_ENUM.RAISED] },
  { key: SUPPORT_STATUS_ENUM.DEVELOPMENT_HANDOVER, title: SUPPORT_STATUS[SUPPORT_STATUS_ENUM.DEVELOPMENT_HANDOVER] },
  { key: SUPPORT_STATUS_ENUM.DEVELOPMENT_WORK_ONGOING, title: SUPPORT_STATUS[SUPPORT_STATUS_ENUM.DEVELOPMENT_WORK_ONGOING] },
  { key: SUPPORT_STATUS_ENUM.PM_REVIEW, title: SUPPORT_STATUS[SUPPORT_STATUS_ENUM.PM_REVIEW] },
  { key: SUPPORT_STATUS_ENUM.CLIENT_TRAINING, title: SUPPORT_STATUS[SUPPORT_STATUS_ENUM.CLIENT_TRAINING] },
  { key: SUPPORT_STATUS_ENUM.CLOSED, title: SUPPORT_STATUS[SUPPORT_STATUS_ENUM.CLOSED] },
];

export const FEATURE_STAGES = [
  { key: SUPPORT_STATUS_ENUM.RAISED, title: SUPPORT_STATUS[SUPPORT_STATUS_ENUM.RAISED] },
  { key: SUPPORT_STATUS_ENUM.REQUIREMENT_GATHERING, title: SUPPORT_STATUS[SUPPORT_STATUS_ENUM.REQUIREMENT_GATHERING] },
  { key: SUPPORT_STATUS_ENUM.DESIGNING, title: SUPPORT_STATUS[SUPPORT_STATUS_ENUM.DESIGNING] },
  { key: SUPPORT_STATUS_ENUM.PRODUCT_OWNER_REVIEW, title: SUPPORT_STATUS[SUPPORT_STATUS_ENUM.PRODUCT_OWNER_REVIEW] },
  { key: SUPPORT_STATUS_ENUM.DEVELOPMENT_HANDOVER, title: SUPPORT_STATUS[SUPPORT_STATUS_ENUM.DEVELOPMENT_HANDOVER] },
  { key: SUPPORT_STATUS_ENUM.DEVELOPMENT_REVIEW, title: SUPPORT_STATUS[SUPPORT_STATUS_ENUM.DEVELOPMENT_REVIEW] },
  { key: SUPPORT_STATUS_ENUM.DEVELOPMENT_WORK_ONGOING, title: SUPPORT_STATUS[SUPPORT_STATUS_ENUM.DEVELOPMENT_WORK_ONGOING] },
  { key: SUPPORT_STATUS_ENUM.PM_REVIEW, title: SUPPORT_STATUS[SUPPORT_STATUS_ENUM.PM_REVIEW] },
  { key: SUPPORT_STATUS_ENUM.CLIENT_TRAINING, title: SUPPORT_STATUS[SUPPORT_STATUS_ENUM.CLIENT_TRAINING] },
  { key: SUPPORT_STATUS_ENUM.CLOSED, title: SUPPORT_STATUS[SUPPORT_STATUS_ENUM.CLOSED] },
];

export const SUPPORT_MODULE_NAME = {
  BANK: 'Bank',
  //ALL MASTER
  ITEM_MASTER: 'Item Master',
  QUANLITY_MASTER: 'Quality Master',
  DIVISION: 'Division',
  BRANCH: 'Branch',
  WAREHOUSE: 'Warehouse',
  PROCESS: 'Process',
  RECIPE: 'Recipe',
  PRICE_LIST: 'Price List',
  ITEM_GROUP: 'Item Group',
  MANPOWER: 'Manpower',
  //PRODUCTION
  PRODUCTION: 'Production',
  //SALES
  CUSTOMER_MASTER: 'Customer Master',
  QUOTES: 'Quotes',
  SALES_ORDER: 'Sales Order',
  DELIVERY_CHALLAN: 'Delivery Challan',
  INVOICE: 'Invoice',
  PAYMENT_RECEIVED: 'Payment Received',
  RECURRING_INVOICE: 'Recurring Invoice',
  CREDIT_NOTES: 'Credit Notes',
  //PURCHASE
  VENDOR_MASTER: 'Vendor Master',
  EXPENSES: 'Expenses',
  RECURRING_EXPENSES: 'Recurring Expenses',
  PURCHASE_ORDER: 'Purchase Order',
  GRPO: 'GRPO',
  BILL: 'Bill',
  PAYMENT_MADE: 'Payment Made',
  RECURRING_BILL: 'Recurring Bill',
  DEBIT_NOTE: 'Debit Note',
  //ACCOUNTANT
  CHARTS_OF_ACCOUNTS: 'Charts Of Accounts',
  ACCOUNT_LEDGER: 'Account Ledger',
  MANUAL_JOURNAL: 'Manual Journal',
  //INVENTORY
  ADD_INVENTORY: 'Add Inventory',
  INVENTORY_TRANSFER: 'Inventory Transfer',
  INVENTORY_ADJUSTMENT: 'Inventory Adjustment',
  REPORTS: 'Reports',
  ANALYTICS: 'Analytics',
};

export const STATUS_CONFIG = {
  [SUPPORT_STATUS_ENUM.RAISED]: { color: '#1890ff', bgColor: '#e6f7ff', borderColor: '#91d5ff' },
  [SUPPORT_STATUS_ENUM.REQUIREMENT_GATHERING]: { color: '#13c2c2', bgColor: '#e6fffb', borderColor: '#87e8de' },
  [SUPPORT_STATUS_ENUM.DESIGNING]: { color: '#722ed1', bgColor: '#f9f0ff', borderColor: '#d3adf7' },
  [SUPPORT_STATUS_ENUM.PRODUCT_OWNER_REVIEW]: { color: '#2f54eb', bgColor: '#f0f5ff', borderColor: '#adc6ff' },
  [SUPPORT_STATUS_ENUM.DEVELOPMENT_HANDOVER]: { color: '#597ef7', bgColor: '#f0f5ff', borderColor: '#adc6ff' },
  [SUPPORT_STATUS_ENUM.DEVELOPMENT_WORK_ONGOING]: { color: '#fa8c16', bgColor: '#fff7e6', borderColor: '#ffd591' },
  [SUPPORT_STATUS_ENUM.DEVELOPMENT_REVIEW]: { color: '#fa541c', bgColor: '#fff2e8', borderColor: '#ffbb96' },
  [SUPPORT_STATUS_ENUM.PM_REVIEW]: { color: '#eb2f96', bgColor: '#fff0f6', borderColor: '#ffadd2' },
  [SUPPORT_STATUS_ENUM.CLIENT_TRAINING]: { color: '#52c41a', bgColor: '#f6ffed', borderColor: '#b7eb8f' },
  [SUPPORT_STATUS_ENUM.CLOSED]: { color: '#8c8c8c', bgColor: '#fafafa', borderColor: '#d9d9d9' },
};

export const PRIORITY_CONFIG = {
  HIGH: { color: '#ff4d4f', bgColor: '#fff2f0', borderColor: '#ffccc7' },
  MEDIUM: { color: '#faad14', bgColor: '#fffbe6', borderColor: '#ffe58f' },
  LOW: { color: '#52c41a', bgColor: '#f6ffed', borderColor: '#b7eb8f' },
};

// Shared tooltip / toast copy for disabled actions. Pass labels from MODULE_NAMES_LABELS so the
// wording stays consistent across modules.
const ADMIN_CONTACT_SUFFIX = 'Please check with your system admin.';
export const PERMISSION_MESSAGES = {
  NO_PERMISSION: `You don't have permission for this operation. ${ADMIN_CONTACT_SUFFIX}`,
  VIEW_ONLY: 'This action is not available in view-only mode.',
  UPGRADE_PLAN: 'Please upgrade your plan to use this feature.',
  // e.g. noActionPermission('record', 'Customer Payment')
  noActionPermission: (action, moduleLabel) => `You don't have permission to ${action} this ${moduleLabel}. ${ADMIN_CONTACT_SUFFIX}`,
  // e.g. requiresModuleRight('Recording', 'Payment Received', 'create')
  requiresModuleRight: (actionLabel, moduleLabel, right) => `${actionLabel} creates a ${moduleLabel}. You need ${moduleLabel} ${right} permission. ${ADMIN_CONTACT_SUFFIX}`,
  // e.g. alreadyInStatus('payment', 'Approved')
  alreadyInStatus: (docLabel, statusLabel) => `This ${docLabel} is already ${statusLabel}.`,
};

export const ANALYTICS_TOOLTIPS = {
  ITEM_ANALYTICS: 'See where each item is stuck in the process flow. Fix delays, avoid stock-outs & overstocking, and speed up delivery & cash collection.',
  GROUP_ITEM: 'See sales quantity & value by item group. Discover your top-performing and lagging categories to focus marketing, inventory & supplier negotiations on what really moves the needle.',
  SALES_ORDERS: 'See all sales orders with stock availability & order value. Catch stock-short orders early, prioritize high-value customers, and never miss a delivery deadline.',
  CUSTOMER_WISE_PENDING_ORDER: 'Pending sales orders grouped by customer. See who has the most open orders, outstanding quantity, and value so you can prioritize fulfillment and protect revenue.',
  SALES_ITEM_WISE: 'Pending sales orders by item – spot hottest demanded items, stock shortages & biggest revenue on hold. Prioritize production/purchase to protect sales & cash flow.',
  SALES_CUSTOMER_WISE: 'Pending sales & value by customer. See who owes you the most, who’s waiting longest, and who to prioritize to protect revenue & loyalty.',
  SALES_TOP_ORDERS: 'Your highest-value pending sales orders at a glance. Protect your biggest revenue deals by fixing stock shortages and speeding up delivery fast.',
  SALES_TOP_CUSTOMERS: 'Your highest-revenue customers ranked. Know who your real profit heroes are so you can keep them happy, sell more to them, and never lose them.',
  CUSTOMER_WISE_BUSINESS_PERFORMANCE: 'Customer-wise summary of order quantity, dispatch quantity, order amount, invoice amount and payments received for the selected period.',
  SALES_TOP_ITEMS: 'Your top-selling & most profitable items ranked. Know exactly which products make you the most money so you can sell even more of them.',
  PURCHASE_TOP_VENDOR_AMOUNT: 'Your most expensive suppliers ranked. Find where your money is really going so you can negotiate harder, save more, and boost profit margins.',
  PURCHASE_VENDOR_BY_PURCHASE: 'Ranked list of suppliers based on the highest purchase value. Focus here to get better prices & secure stock of your cash-cow products.',
  PURCHASE_TOP_ITEM_OF_PURCHASE: 'Our top items by purchase value. Know which items are most purchased so you can focus on stocking them and negotiate better prices.',
  COLLECTION_TOP_CUSTOMER: 'Your biggest money-making customers ranked by sales value. Focus here to protect and grow the accounts that actually pay your bills.',
  COLLECTION_UPCOMING_INVOICE: 'Money coming in soon! See due invoices, amounts & customers. Forecast cash accurately and chase payments before they’re late.',
  COLLECTION_RECENT_PAYMENTS: 'Latest cash in the bank! See who paid, how much, and when. Know exactly which customers keep your cash flow healthy.',
  COLLECTION_OVERDUE: 'Money you’re owed RIGHT NOW! See overdue amounts, customers & aging. Chase the biggest and oldest first to unlock cash today.',
  PAYMENTS_TOP_VENDOR: 'Your most expensive vendors ranked. Know who costs you the most so you can negotiate harder and save thousands instantly.',
  PAYMENTS_UPCOMING: 'Money going OUT soon! See due bills, amounts & vendors. Plan cash, avoid penalties, and stay in control of every payment.',
  PAYMENTS_RECENT: 'Latest money you paid out. See who got paid, how much & when — catch mistakes early and keep cash under control.',
  PAYMENTS_OVERDUE: 'Money you owe RIGHT NOW! See overdue bills, amounts & aging. Pay the biggest/oldest first to avoid penalties and keep supply flowing.',
  CUSTOMER_ONE_INVOICE: 'Customers who have exactly one invoice. This helps you identify one-time buyers who may need follow-up to encourage repeat purchases.',
  GENERAL_SALES_ANALYTICS: 'General sales analytics. This helps you identify the sales performance of the company.',
  ITEM_REJECTION_ANALYTICS:
    'Analyze finished goods (FG) and raw material (RM) rejections across production orders. Filter by date to identify rejection trends, quantities, reasons, and overall production quality.',
  STOCK_SUMMARY: 'Opening, inward, outward and closing stock per item and warehouse for a date range.',
};

export const CUSTOMER_STATUS = {
  ALL: 'All',
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
};

export const CUSTOMER_VERIFICATION_STATUS = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

export const DYNAMIC_REPORT_BASIS = {
  ITEM_GROUP: 'ITEM_GROUP',
  ITEM: 'ITEM',
};

export const DYNAMIC_REPORT_BASIS_OPTIONS = [
  { value: DYNAMIC_REPORT_BASIS.ITEM_GROUP, label: 'Item Group' },
  { value: DYNAMIC_REPORT_BASIS.ITEM, label: 'Item' },
];

export const GENERAL_SALES_ANALYTICS_MODULES = {
  QUOTE: 'QUOTE',
  SALES_ORDER: 'SALES_ORDER',
  DELIVERY_CHALLAN: 'DELIVERY_CHALLAN',
  INVOICE: 'INVOICE',
};

export const GENERAL_SALES_ANALYTICS_MODULE_OPTIONS = [
  { value: GENERAL_SALES_ANALYTICS_MODULES.QUOTE, label: 'Quote' },
  { value: GENERAL_SALES_ANALYTICS_MODULES.SALES_ORDER, label: 'Sales Order' },
  { value: GENERAL_SALES_ANALYTICS_MODULES.DELIVERY_CHALLAN, label: 'Delivery Challan' },
  { value: GENERAL_SALES_ANALYTICS_MODULES.INVOICE, label: 'Invoice' },
];

export const GENERAL_SALES_ANALYTICS_MODULE_LABELS = {
  [GENERAL_SALES_ANALYTICS_MODULES.QUOTE]: 'Quote',
  [GENERAL_SALES_ANALYTICS_MODULES.SALES_ORDER]: 'Sales Order',
  [GENERAL_SALES_ANALYTICS_MODULES.DELIVERY_CHALLAN]: 'Delivery Challan',
  [GENERAL_SALES_ANALYTICS_MODULES.INVOICE]: 'Invoice',
};

export const TAB_LIST = [
  { key: 'B2B', label: 'B2B' },
  { key: 'B2CL', label: 'B2CL' },
  { key: 'B2CS', label: 'B2CS' },
  { key: 'CDNR', label: 'CDNR' },
  { key: 'CDNUR', label: 'CDNUR' },
  { key: 'EXEMP', label: 'EXEMP' },
  { key: 'HSN_B2B', label: 'HSN (B2B)' },
  { key: 'HSN_B2C', label: 'HSN (B2C)' },
  { key: 'DOCUMENTS_ISSUED', label: 'DOCUMENTS ISSUED' },
];

export const TAB_TOOLTIPS = {
  B2B: 'Details of invoices of Taxable supplies made to other registered taxpayers',
  B2CL: 'Invoices for Taxable outward supplies to consumers where a)The place of supply is outside the state where the supplier is registered and b)The total invoice value is more that Rs "2,50,000"',
  B2CS: 'Supplies made to consumers and unregistered persons of the following nature a) Intra-State: any value b) Inter-State: Invoice value Rs "2.5 lakh" or less',
  CDNR: 'Credit/ Debit Notes issued to the registered taxpayers during the tax period. Debit or credit note issued against invoice will be reported here against original invoice, hence fill the details of original invoice also which was furnished in B2B,B2CL section of earlier/current period tax period.',
  CDNUR: 'Credit/ Debit Notes issued to the unregistered persons against interstate invoice value is more than Rs 2.5 lakh',
  EXEMP: 'Details of Nil Rated, Exempted and Non GST Supplies made during the tax period',
  HSN_B2B: 'HSN-wise summary of goods/services supplied to registered taxpayers during the tax period.',
  HSN_B2C: 'HSN-wise summary of goods/services supplied to consumers during the tax period.',
  DOCUMENTS_ISSUED: 'Documents issued during the tax period',
};

export const EXPENSE_ROW_TYPE = 'expense';

export const OB_TYPE = {
  OPENING_RECEIVABLE: 'opening_receivable',
  OPENING_PAYABLE: 'opening_payable',
  CUSTOMER_CREDIT: 'customer_credit',
  VENDOR_CREDIT: 'vendor_credit',
};

export const OB_TYPE_LABEL = {
  [OB_TYPE.OPENING_RECEIVABLE]: 'Opening receivable',
  [OB_TYPE.OPENING_PAYABLE]: 'Opening payable',
  [OB_TYPE.CUSTOMER_CREDIT]: 'Customer credit',
  [OB_TYPE.VENDOR_CREDIT]: 'Vendor credit',
  DEFAULT: 'Opening balance',
};

export const CONTACT_TYPE = {
  CUSTOMER: 'customer',
  VENDOR: 'vendor',
};

export const OB_PAYMENT_ENTRY_SOURCE = {
  PAYMENT_RECEIVED: 'payment_received',
  INVOICE_CREDIT: 'invoice_credit',
  PAYMENT_MADE: 'payment_made',
  BILL_CREDIT: 'bill_credit',
};

export const OB_PAYMENT_ENTRY_SOURCE_LABEL = {
  [OB_PAYMENT_ENTRY_SOURCE.PAYMENT_RECEIVED]: 'Payment received',
  [OB_PAYMENT_ENTRY_SOURCE.INVOICE_CREDIT]: 'Invoice',
  [OB_PAYMENT_ENTRY_SOURCE.PAYMENT_MADE]: 'Payment made',
  [OB_PAYMENT_ENTRY_SOURCE.BILL_CREDIT]: 'Bill',
};

export const INTERVAL_LABEL = {
  daily: 'day',
  biweekly: '2 weeks',
  monthly: 'month',
  yearly: 'year',
};

export const FISCAL_YEAR_OPTIONS = [
  { label: 'January - December', value: 'January - December' },
  { label: 'February - January', value: 'February - January' },
  { label: 'March - February', value: 'March - February' },
  { label: 'April - March', value: 'April - March', default: true },
  { label: 'May - April', value: 'May - April' },
  { label: 'June - May', value: 'June - May' },
  { label: 'July - June', value: 'July - June' },
  { label: 'August - July', value: 'August - July' },
  { label: 'September - August', value: 'September - August' },
  { label: 'October - September', value: 'October - September' },
  { label: 'November - October', value: 'November - October' },
  { label: 'December - November', value: 'December - November' },
];

export const ORGANIZATION_LANGUAGE_OPTIONS = [
  { label: 'English', value: 'English', default: true },
  { label: 'Hindi', value: 'Hindi' },
  { label: 'Gujarati', value: 'Gujarati' },
  { label: 'Marathi', value: 'Marathi' },
  { label: 'Tamil', value: 'Tamil' },
  { label: 'Telugu', value: 'Telugu' },
  { label: 'Kannada', value: 'Kannada' },
  { label: 'Bengali', value: 'Bengali' },
  { label: 'Punjabi', value: 'Punjabi' },
];

export const DATE_FORMAT_OPTIONS = [
  { label: 'DD/MM/YYYY [ 07/05/2026 ]', value: 'DD/MM/YYYY', default: true },
  { label: 'MM/DD/YYYY [ 05/07/2026 ]', value: 'MM/DD/YYYY' },
  { label: 'YYYY-MM-DD [ 2026-05-07 ]', value: 'YYYY-MM-DD' },
  { label: 'DD-MM-YYYY [ 07-05-2026 ]', value: 'DD-MM-YYYY' },
  { label: 'DD MMM YYYY [ 07 May 2026 ]', value: 'DD MMM YYYY' },
  { label: 'MMM DD, YYYY [ May 07, 2026 ]', value: 'MMM DD, YYYY' },
  { label: 'MMMM dd, yyyy [ May 07, 2026 ]', value: 'MMMM dd, yyyy' },
];

export const DEFAULT_CURRENCY = {
  decimalPlaces: 2,
  code: 'INR',
  name: 'Indian Rupee',
  format: '1,23,45,678.90',
  symbol: '₹',
};

export const FORMAT_LOCALE_MAP = {
  '1,234,567.89': 'en-US',
  '1.234.567,89': 'de-DE',
  '1 234 567,89': 'fr-FR',
  '1,23,45,678.90': 'en-IN',
};

export const CUSTOMER_SOCKET = {
  RECONNECT_BASE_MS: 1_000,
  RECONNECT_MAX_MS: 30_000,
  RECONNECT_MAX_ATTEMPTS: 10,
};

export const DOC_TYPE_OPTIONS = [
  { label: 'Quotation', value: 'QUOTATION' },
  { label: 'Sales Order', value: 'SALES_ORDER' },
  { label: 'Delivery Challan', value: 'DELIVERY_CHALLAN' },
  { label: 'Invoice', value: 'INVOICE' },
  { label: 'Collection (Payment Received)', value: 'PAYMENT_RECEIVED' },
];

export const CALC_METHOD_OPTIONS = [
  { label: 'Per Document Amount', value: 'PER_DOC_AMOUNT' },
  { label: 'Per Item', value: 'PER_ITEM' },
  { label: 'Per Item Group', value: 'PER_ITEM_GROUP' },
];

export const DOC_TYPE_ROW_DEFAULTS = {
  calcMethod: 'PER_DOC_AMOUNT',
  incentiveType: 'PERCENTAGE',
};

export const DOC_TYPE_COLORS = {
  INVOICE: '#4338ca',
  SALES_ORDER: '#16a34a',
  QUOTATION: '#f59e0b',
  DELIVERY_CHALLAN: '#0ea5e9',
  PAYMENT_RECEIVED: '#ca8a04',
};

export const AVATAR_PALETTE = ['#4338ca', '#16a34a', '#dc2626', '#d97706', '#0ea5e9', '#7c3aed', '#db2777', '#059669'];
export const LOG_STATUS_COLORS = { PENDING: 'gold', APPROVED: 'blue', SETTLED: 'green', CANCELLED: 'red' };
export const DOC_LABELS = { INVOICE: 'Invoice', SALES_ORDER: 'Sales Order', QUOTATION: 'Quotation', DELIVERY_CHALLAN: 'Delivery Challan', PAYMENT_RECEIVED: 'Payment Received' };

export const STATUS_TRANSITIONS = {
  DRAFT: [{ label: 'Publish', next: 'ACTIVE' }],
  ACTIVE: [
    { label: 'Pause', next: 'PAUSED' },
    { label: 'End', next: 'ENDED' },
  ],
  PAUSED: [
    { label: 'Resume', next: 'ACTIVE' },
    { label: 'End', next: 'ENDED' },
  ],
  ENDED: [],
};

export const ADDRESS_TYPE = {
  BILLING: 'billing',
  SHIPPING: 'shipping',
};

export const ACCOUNT_CATEGORIES = {
  OTHER_ASSET: 'OTHER_ASSET',
  OTHER_CURRENT_ASSET: 'OTHER_CURRENT_ASSET',
  CASH: 'CASH',
  BANK: 'BANK',
  FIXED_ASSET: 'FIXED_ASSET',
  ACCOUNTS_RECEIVABLE: 'ACCOUNTS_RECEIVABLE',
  STOCK: 'STOCK',
  PAYMENT_CLEARING: 'PAYMENT_CLEARING',
  INTANGIBLE_ASSET: 'INTANGIBLE_ASSET',
  NON_CURRENT_ASSET: 'NON_CURRENT_ASSET',
  DEFERRED_TAX_ASSET: 'DEFERRED_TAX_ASSET',
  OTHER_CURRENT_LIABILITY: 'OTHER_CURRENT_LIABILITY',
  // CREDIT_CARD: 'CREDIT_CARD',
  NON_CURRENT_LIABILITY: 'NON_CURRENT_LIABILITY',
  OTHER_LIABILITY: 'OTHER_LIABILITY',
  ACCOUNTS_PAYABLE: 'ACCOUNTS_PAYABLE',
  OVERSEAS_TAX_PAYABLE: 'OVERSEAS_TAX_PAYABLE',
  DEFERRED_TAX_LIABILITY: 'DEFERRED_TAX_LIABILITY',
  EQUITY: 'EQUITY',
  INCOME: 'INCOME',
  OTHER_INCOME: 'OTHER_INCOME',
  EXPENSE: 'EXPENSE',
  COGS: 'COGS',
  OTHER_EXPENSE: 'OTHER_EXPENSE',
};

export const PARTY_ACCOUNT_TYPES = {
  ACCOUNTS_RECEIVABLE: 'ACCOUNTS_RECEIVABLE',
  ACCOUNTS_PAYABLE: 'ACCOUNTS_PAYABLE',
  BRANCH_DIVISIONS: 'BRANCH_DIVISIONS',
};

export const PARTY_ACCOUNT_TYPE_LABELS = {
  [PARTY_ACCOUNT_TYPES.ACCOUNTS_RECEIVABLE]: 'Accounts Receivable',
  [PARTY_ACCOUNT_TYPES.ACCOUNTS_PAYABLE]: 'Accounts Payable',
  [PARTY_ACCOUNT_TYPES.BRANCH_DIVISIONS]: 'Branch / Divisions',
};

export const BANK_TYPES = {
  BANK: 'Bank',
  CREDIT_CARD: 'Credit Card',
  PETTY_CASH: 'Petty Cash',
  PAYMENT_CLEARING: 'Payment Clearing',
};

export const PAYMENT_ACCOUNT_CATEGORIES = [ACCOUNT_CATEGORIES.CASH, ACCOUNT_CATEGORIES.BANK, ACCOUNT_CATEGORIES.PAYMENT_CLEARING, ACCOUNT_CATEGORIES.CREDIT_CARD];

export const ACCOUNT_DROPDOWN_CATEGORIES = {
  PAYMENT: PAYMENT_ACCOUNT_CATEGORIES,
  TDS: [ACCOUNT_CATEGORIES.OTHER_CURRENT_ASSET],
  EXPENSE: [ACCOUNT_CATEGORIES.EXPENSE, ACCOUNT_CATEGORIES.COGS, ACCOUNT_CATEGORIES.OTHER_EXPENSE],
  SALES: [ACCOUNT_CATEGORIES.INCOME, ACCOUNT_CATEGORIES.OTHER_INCOME],
  PURCHASE: [ACCOUNT_CATEGORIES.EXPENSE, ACCOUNT_CATEGORIES.COGS, ACCOUNT_CATEGORIES.OTHER_EXPENSE, ACCOUNT_CATEGORIES.FIXED_ASSET],
  INVENTORY: [ACCOUNT_CATEGORIES.STOCK],
  INVENTORY_ADJUSTMENT: [ACCOUNT_CATEGORIES.EXPENSE, ACCOUNT_CATEGORIES.OTHER_EXPENSE, ACCOUNT_CATEGORIES.COGS, ACCOUNT_CATEGORIES.INCOME, ACCOUNT_CATEGORIES.OTHER_INCOME],
};

// with accounting modules remove this all
export const PAYMENT_RECEIVED_MODE = {
  'Petty Cash': 'Petty Cash',
  CHEQUE: 'Cheque',
  BANK_TRANSFER: 'Bank Transfer',
  UPI: 'UPI',
  OTHER: 'Other',
};

export const PAYMENT_MADE_MODE = {
  'Petty Cash': 'Petty Cash',
  CHEQUE: 'Cheque',
  BANK_TRANSFER: 'Bank Transfer',
  UPI: 'UPI',
  OTHER: 'Other',
};

export const PAID_THROUGH_ENUM = {
  'Petty Cash': 'Petty Cash',
  CHEQUE: 'Cheque',
  BANK_TRANSFER: 'Bank Transfer',
  UPI: 'UPI',
};

export const PAYMENT_MODE_ENUM = {
  'Petty Cash': 'Petty Cash',
  CHEQUE: 'Cheque',
  BANK_TRANSFER: 'Bank Transfer',
  UPI: 'UPI',
};

export const PAID_MODES_WITH_BANK = ['BANK_TRANSFER', 'CHEQUE', 'Petty Cash', 'UPI'];

export const SHARED_APP_LABEL = { BOOKS: 'Books', CRM: 'CRM' };

// Matches the status sent by GET company/subscription usage rows
export const USAGE_STATUS = { OK: 'OK', WARNING: 'WARNING', EXCEEDED: 'EXCEEDED', UNLIMITED: 'UNLIMITED' };

export const LEDGER_SOURCE_MODULES = {
  OPENING_BALANCE: 'OPENING_BALANCE',
  INVOICE: 'INVOICE',
  DELIVERY_CHALLAN: 'DELIVERY_CHALLAN',
  GRPO: 'GRPO',
  BILL: 'BILL',
  PRODUCTION: 'PRODUCTION',
  CREDIT_NOTE: 'CREDIT_NOTE',
  DEBIT_NOTE: 'DEBIT_NOTE',
  PAYMENT_RECEIVED: 'PAYMENT_RECEIVED',
  PAYMENT_MADE: 'PAYMENT_MADE',
  EXPENSE: 'EXPENSE',
  BANK_TRANSFER: 'BANK_TRANSFER',
  MANUAL_JOURNAL: 'MANUAL_JOURNAL',
  INVENTORY_ADJUSTMENT: 'INVENTORY_ADJUSTMENT',
};

export const LEDGER_PARTY_TYPES = {
  CUSTOMER: 'CUSTOMER',
  VENDOR: 'VENDOR',
};
