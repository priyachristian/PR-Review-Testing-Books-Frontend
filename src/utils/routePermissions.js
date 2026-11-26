import { RESOURCES } from '@/utils/jsonFile';

/**
 * Maps feature-gated route paths to their RESOURCES module key.
 * Only routes whose moduleName appears in FEATURE_MODULE_MAP need to be listed.
 *
 * This is consumed by two places:
 *   1. axiosConfig — request interceptor cancels API calls when permission-tree `isInPlan` is false
 *   2. App.js       — renders <UpgradeRequiredModal> over the route (same `isInPlan` rule)
 */
export const ROUTE_PERMISSIONS = {
  // Customer Master
  '/customer-master': RESOURCES.CUSTOMER_MASTER,
  '/customer-master/new': RESOURCES.CUSTOMER_MASTER,
  '/customer-master/bulk/import': RESOURCES.CUSTOMER_MASTER,
  '/customer-master/bulk/opening-balance': RESOURCES.CUSTOMER_MASTER,
  '/customer-master/:customerId': RESOURCES.CUSTOMER_MASTER,
  '/customer-master/:customerId/edit': RESOURCES.CUSTOMER_MASTER,

  // Vendors
  '/vendors': RESOURCES.VENDORS,
  '/vendors/new': RESOURCES.VENDORS,
  '/vendors/bulk/import': RESOURCES.VENDORS,
  '/vendors/bulk/opening-balance': RESOURCES.VENDORS,
  '/vendors/:customerId': RESOURCES.VENDORS,
  '/vendors/:customerId/edit': RESOURCES.VENDORS,

  // Item Master
  '/item-master': RESOURCES.ITEM_MASTER,
  '/item-master/new': RESOURCES.ITEM_MASTER,
  '/item-master/bulk/import': RESOURCES.ITEM_MASTER,
  '/item-master/bulk/inventory': RESOURCES.ITEM_MASTER,
  '/item-master/:itemId': RESOURCES.ITEM_MASTER,
  '/item-master/:itemId/edit': RESOURCES.ITEM_MASTER,

  // Division / Branch / Warehouse  (all map to WAREHOUSE feature)
  '/division': RESOURCES.DIVISION,
  '/division/new': RESOURCES.DIVISION,
  '/division/:divId': RESOURCES.DIVISION,
  '/division/:divId/edit': RESOURCES.DIVISION,

  '/branch': RESOURCES.BRANCH,
  '/branch/new': RESOURCES.BRANCH,
  '/branch/:brId': RESOURCES.BRANCH,
  '/branch/:brId/edit': RESOURCES.BRANCH,

  '/warehouse-master': RESOURCES.WAREHOUSE_MASTER,
  '/warehouse-master/new': RESOURCES.WAREHOUSE_MASTER,
  '/warehouse-master/:wrhId': RESOURCES.WAREHOUSE_MASTER,
  '/warehouse-master/:wrhId/edit': RESOURCES.WAREHOUSE_MASTER,

  // Banks
  '/banks': RESOURCES.BANK,
  '/banks/new': RESOURCES.BANK,
  '/banks/:bankId': RESOURCES.BANK,
  '/banks/:bankId/edit': RESOURCES.BANK,

  // Quotes
  '/quotes': RESOURCES.QUOTES,
  '/quotes/new': RESOURCES.QUOTES,
  '/quotes/:quoteId': RESOURCES.QUOTES,
  '/quotes/:quoteId/edit': RESOURCES.QUOTES,

  // Sales Orders
  '/sales-orders': RESOURCES.SALES_ORDER,
  '/sales-orders/new': RESOURCES.SALES_ORDER,
  '/sales-orders/:salesId': RESOURCES.SALES_ORDER,
  '/sales-orders/:salesId/edit': RESOURCES.SALES_ORDER,

  // Delivery Challans
  '/delivery-challans': RESOURCES.DELIVERY_CHALLANS,
  '/delivery-challans/new': RESOURCES.DELIVERY_CHALLANS,
  '/delivery-challans/:deliveryChallanId': RESOURCES.DELIVERY_CHALLANS,
  '/delivery-challans/:deliveryId/edit': RESOURCES.DELIVERY_CHALLANS,

  // Invoices
  '/invoices': RESOURCES.INVOICES,
  '/invoices/new': RESOURCES.INVOICES,
  '/invoices/:invoiceId': RESOURCES.INVOICES,
  '/invoices/:invoiceId/edit': RESOURCES.INVOICES,

  // Payments Received
  '/payments-received': RESOURCES.PAYMENT_RECEIVED,
  '/payments-received/new': RESOURCES.PAYMENT_RECEIVED,
  '/payments-received/:paymentId': RESOURCES.PAYMENT_RECEIVED,
  '/payments-received/:paymentId/edit': RESOURCES.PAYMENT_RECEIVED,

  // Customer Payments (customer portal submissions)
  '/customer-payments': RESOURCES.CUSTOMER_PAYMENT,
  '/customer-payments/:customerPaymentId': RESOURCES.CUSTOMER_PAYMENT,

  // Recurring Invoices
  '/recurring-invoices': RESOURCES.RECURRING_INVOICE,
  '/recurring-invoices/new': RESOURCES.RECURRING_INVOICE,
  '/recurring-invoices/:recurringId/edit': RESOURCES.RECURRING_INVOICE,

  // Credit Notes
  '/credit-notes': RESOURCES.CREDIT_NOTES,
  '/credit-notes/new': RESOURCES.CREDIT_NOTES,
  '/credit-notes/:creditNotesId': RESOURCES.CREDIT_NOTES,
  '/credit-notes/:creditNotesId/edit': RESOURCES.CREDIT_NOTES,

  // Expenses
  '/expenses': RESOURCES.EXPENSES,
  '/expenses/new': RESOURCES.EXPENSES,
  '/expenses/:expensesId': RESOURCES.EXPENSES,
  '/expenses/:expenseId/edit': RESOURCES.EXPENSES,

  // Recurring Expenses
  '/recurring-expenses': RESOURCES.RECURRING_EXPENSES,
  '/recurring-expenses/new': RESOURCES.RECURRING_EXPENSES,
  '/recurring-expenses/:recurringExpenseId/edit': RESOURCES.RECURRING_EXPENSES,

  // Purchase Orders
  '/purchase-orders': RESOURCES.PURCHASE_ORDER,
  '/purchase-orders/new': RESOURCES.PURCHASE_ORDER,
  '/purchase-orders/:purchaseOrderId': RESOURCES.PURCHASE_ORDER,
  '/purchase-orders/:purchaseId/edit': RESOURCES.PURCHASE_ORDER,

  // GRPO
  '/grpo': RESOURCES.GRPO,
  '/grpo/new': RESOURCES.GRPO,
  '/grpo/:grpoId': RESOURCES.GRPO,
  '/grpo/:grpoId/edit': RESOURCES.GRPO,

  // Bills
  '/bills': RESOURCES.BILLS,
  '/bills/new': RESOURCES.BILLS,
  '/bills/:billsId': RESOURCES.BILLS,
  '/bills/:billsId/edit': RESOURCES.BILLS,

  // Payments Made
  '/payments-made': RESOURCES.PAYMENT_MADE,
  '/payments-made/new': RESOURCES.PAYMENT_MADE,
  '/payments-made/:paymentId': RESOURCES.PAYMENT_MADE,
  '/payments-made/:paymentId/edit': RESOURCES.PAYMENT_MADE,

  // Recurring Bills
  '/recurring-bills': RESOURCES.RECURRING_BILLS,
  '/recurring-bills/new': RESOURCES.RECURRING_BILLS,
  '/recurring-bills/:billsId/edit': RESOURCES.RECURRING_BILLS,

  // Debit Notes
  '/debit-notes': RESOURCES.DEBIT_NOTE,
  '/debit-notes/new': RESOURCES.DEBIT_NOTE,
  '/debit-notes/:debitNoteId': RESOURCES.DEBIT_NOTE,
  '/debit-notes/:vendorId/edit': RESOURCES.DEBIT_NOTE,

  // Production
  '/production-orders': RESOURCES.ADD_PRODUCTION,
  '/production-orders/new': RESOURCES.ADD_PRODUCTION,
  '/production-orders/:productionOrderId': RESOURCES.ADD_PRODUCTION,
  '/production-orders/:productionOrderId/edit': RESOURCES.ADD_PRODUCTION,

  // Manual Journal
  '/manual-journal': RESOURCES.MANUAL_JOURNALS,
  '/manual-journal/new': RESOURCES.MANUAL_JOURNALS,
  '/manual-journal/:manualJournalId': RESOURCES.MANUAL_JOURNALS,
  '/manual-journal/:manualJournalId/edit': RESOURCES.MANUAL_JOURNALS,

  // Account Ledger (Partner)
  '/account-partner': RESOURCES.ACCOUNT_LEDGER,
  '/account-partner/new': RESOURCES.ACCOUNT_LEDGER,
  '/account-partner/:accountLedgerId/edit': RESOURCES.ACCOUNT_LEDGER,

  // Inventory Adjustment
  '/inventory-adjustment': RESOURCES.INVENTORY_ADJUSTMENT,
  '/inventory-adjustment/new': RESOURCES.INVENTORY_ADJUSTMENT,
  '/inventory-adjustment/:inventoryId': RESOURCES.INVENTORY_ADJUSTMENT,
  '/inventory-adjustment/:inventoryId/edit': RESOURCES.INVENTORY_ADJUSTMENT,

  '/item-batches': RESOURCES.ITEM_BATCH,
  '/item-batches/:batchId': RESOURCES.ITEM_BATCH,

  // Quality Master
  '/quality-master': RESOURCES.QUALITY_MASTER,
  '/quality-master/new': RESOURCES.QUALITY_MASTER,
  '/quality-master/:qltId': RESOURCES.QUALITY_MASTER,
  '/quality-master/:qltId/edit': RESOURCES.QUALITY_MASTER,

  // Price List
  '/price-list': RESOURCES.PRICE_LIST,
  '/price-list/new': RESOURCES.PRICE_LIST,
  '/price-list/:priceListId': RESOURCES.PRICE_LIST,
  '/price-list/:priceListId/edit': RESOURCES.PRICE_LIST,

  // Rejections
  '/rejection-orders': RESOURCES.REJECTION_ORDERS,
  '/rejection-orders/new': RESOURCES.REJECTION_ORDERS,
  '/rejection-orders/:rejectionId': RESOURCES.REJECTION_ORDERS,
  '/rejection-inventory': RESOURCES.REJECTION_INVENTORY,
  '/rejection-analysis': RESOURCES.REJECTION_ANALYSIS,

  // Complaint
  '/complaints': RESOURCES.COMPLAINT,
  '/complaints/new': RESOURCES.COMPLAINT,
  '/complaints/:complaintId': RESOURCES.COMPLAINT,
  '/complaints/:complaintId/edit': RESOURCES.COMPLAINT,
  '/problem-list': RESOURCES.PROBLEM_LIST,

  // Spare Part
  '/spare-part': RESOURCES.SPARE_PART,
  '/spare-part/new': RESOURCES.SPARE_PART,
  '/spare-part/:sparePartId': RESOURCES.SPARE_PART,
  '/spare-part/:sparePartId/edit': RESOURCES.SPARE_PART,

  // Machine
  '/machine': RESOURCES.MACHINE,
  '/machine/new': RESOURCES.MACHINE,
  '/machine/:machineId': RESOURCES.MACHINE,
  '/machine/:machineId/edit': RESOURCES.MACHINE,

  // Maintenance Request
  '/maintenance-request': RESOURCES.MAINTENANCE_REQUEST,
  '/maintenance-request/:maintenanceRequestId': RESOURCES.MAINTENANCE_REQUEST,

  // Maintenance Purchase
  '/maintenance-purchase': RESOURCES.MAINTENANCE_PURCHASE,
  '/maintenance-purchase/new': RESOURCES.MAINTENANCE_PURCHASE,
  '/maintenance-purchase/:maintenancePurchaseId': RESOURCES.MAINTENANCE_PURCHASE,

  // Part Request
  '/part-request': RESOURCES.PART_REQUEST,

  // Spare Stock Ledger
  '/spare-stock-ledger': RESOURCES.SPARE_STOCK_LEDGER,
};

/**
 * Maps RESOURCES module keys (strings) to subscription feature keys.
 * Kept in sync with the map in App.js — both places use this single source.
 */
export const FEATURE_MODULE_MAP = {
  [RESOURCES.USERS]: 'USER',
  [RESOURCES.CUSTOMER_MASTER]: 'CUSTOMER',
  [RESOURCES.VENDORS]: 'CUSTOMER',
  [RESOURCES.ITEM_MASTER]: 'ITEM',
  [RESOURCES.DELIVERY_CHALLANS]: 'DELIVERY_CHALLAN',
  [RESOURCES.INVOICES]: 'INVOICE',
  [RESOURCES.RECURRING_INVOICE]: 'RECURRING_INVOICE',
  [RESOURCES.CREDIT_NOTES]: 'CREDIT_NOTES',
  [RESOURCES.EXPENSES]: 'EXPENSES',
  [RESOURCES.RECURRING_EXPENSES]: 'RECURRING_EXPENSES',
  [RESOURCES.PURCHASE_ORDER]: 'PURCHASE_ORDER',
  [RESOURCES.GRPO]: 'GRPO',
  [RESOURCES.BILLS]: 'BILL',
  [RESOURCES.PAYMENT_MADE]: 'PAYMENT_MADE',
  [RESOURCES.RECURRING_BILLS]: 'RECURRING_BILL',
  [RESOURCES.DEBIT_NOTE]: 'DEBIT_NOTES',
  [RESOURCES.DIVISION]: 'WAREHOUSE',
  [RESOURCES.BRANCH]: 'WAREHOUSE',
  [RESOURCES.WAREHOUSE_MASTER]: 'WAREHOUSE',
  [RESOURCES.BANK]: 'BANK',
  [RESOURCES.QUOTES]: 'QUOTATION',
  [RESOURCES.SALES_ORDER]: 'SALES_ORDER',
  [RESOURCES.PAYMENT_RECEIVED]: 'PAYMENT_RECEIVED',
  [RESOURCES.MANUAL_JOURNALS]: 'MANUAL_JOURNAL',
  [RESOURCES.PRODUCTION]: 'PRODUCTION_ORDER',
  [RESOURCES.ADD_PRODUCTION]: 'PRODUCTION_ORDER',
  [RESOURCES.CUSTOMER_ORDER]: 'CUSTOMER_ORDER',
  [RESOURCES.CUSTOMER_PAYMENT]: 'CUSTOMER_ORDER',
  [RESOURCES.SAMPLE_CATALOG]: 'CUSTOMER_ORDER',
  [RESOURCES.REJECTION_ORDERS]: 'REJECTION_ORDER',
  [RESOURCES.REJECTION_ANALYSIS]: 'REJECTION_ORDER',
  [RESOURCES.REJECTION_INVENTORY]: 'REJECTION_ORDER',
  [RESOURCES.PROBLEM_LIST]: 'PROBLEM_LIST',
  [RESOURCES.COMPLAINT]: 'COMPLAINTS',
  [RESOURCES.SPARE_PART]: 'SPARE_PART',
  [RESOURCES.MACHINE]: 'MACHINE',
  [RESOURCES.MAINTENANCE_REQUEST]: 'MAINTENANCE_REQUEST',
  [RESOURCES.MAINTENANCE_PURCHASE]: 'MAINTENANCE_PURCHASE',
  [RESOURCES.PART_REQUEST]: 'PART_REQUEST',
  [RESOURCES.SPARE_STOCK_LEDGER]: 'SPARE_STOCK_LEDGER',
};

/**
 * Maps route module keys to loader-reset target identifiers.
 * Consumed by axios interceptor to reset slice loaders when feature is blocked.
 */
export const FEATURE_BLOCK_LOADER_RESET_ACTIONS = {
  [RESOURCES.CUSTOMER_MASTER]: ['customerMaster'],
  [RESOURCES.VENDORS]: ['customerMaster'],
  [RESOURCES.ITEM_MASTER]: ['itemMaster'],
  [RESOURCES.DIVISION]: ['division'],
  [RESOURCES.BRANCH]: ['branch'],
  [RESOURCES.WAREHOUSE_MASTER]: ['warehouse'],
  [RESOURCES.BANK]: ['bank'],
  [RESOURCES.QUOTES]: ['quote'],
  [RESOURCES.SALES_ORDER]: ['salesOrder'],
  [RESOURCES.DELIVERY_CHALLANS]: ['deliveryChallan'],
  [RESOURCES.INVOICES]: ['invoice'],
  [RESOURCES.PAYMENT_RECEIVED]: ['paymentReceived'],
  [RESOURCES.CUSTOMER_PAYMENT]: ['customerPayment'],
  [RESOURCES.RECURRING_INVOICE]: ['recurringInvoice'],
  [RESOURCES.CREDIT_NOTES]: ['creditNotes'],
  [RESOURCES.EXPENSES]: ['expense'],
  [RESOURCES.RECURRING_EXPENSES]: ['recurringExpense'],
  [RESOURCES.PURCHASE_ORDER]: ['purchaseOrder'],
  [RESOURCES.GRPO]: ['grpo'],
  [RESOURCES.BILLS]: ['bills'],
  [RESOURCES.PAYMENT_MADE]: ['paymentMade'],
  [RESOURCES.RECURRING_BILLS]: ['recurringBills'],
  [RESOURCES.DEBIT_NOTE]: ['debitNote'],
  [RESOURCES.PRODUCTION]: ['production'],
  [RESOURCES.ADD_PRODUCTION]: ['productionOrder'],
  [RESOURCES.MANUAL_JOURNALS]: ['manualJournal'],
  [RESOURCES.ACCOUNT_LEDGER]: ['accountLedger'],
  [RESOURCES.REJECTION_ORDERS]: ['rejectionOrder'],
  [RESOURCES.REJECTION_ANALYSIS]: ['rejectionOrder'],
  [RESOURCES.REJECTION_INVENTORY]: ['rejectionOrder'],
  [RESOURCES.SPARE_PART]: ['sparePart', 'spareStockLedger'],
  [RESOURCES.MACHINE]: ['machine'],
  [RESOURCES.MAINTENANCE_REQUEST]: ['maintenanceRequest'],
  [RESOURCES.MAINTENANCE_PURCHASE]: ['maintenancePurchase'],
  [RESOURCES.PART_REQUEST]: ['partRequest'],
  [RESOURCES.SPARE_STOCK_LEDGER]: ['spareStockLedger'],
};

export const RESET_FEATURE_BLOCKED_LOADERS = 'common/resetFeatureBlockedLoaders';

export const buildPermissionPlanMap = flatNodes => {
  const map = {};
  if (!Array.isArray(flatNodes)) return map;
  for (const n of flatNodes) {
    if (n?.pathNorm) {
      map[n.pathNorm] = n.isInPlan !== false;
    }
  }
  return map;
};

/**
 * Resolves the RESOURCES module key for the current route pathname.
 * Tries exact match first, then falls back to dynamic-segment pattern matching.
 *
 * @param {string} pathname - e.g. window.location.pathname
 * @returns {string|null} - RESOURCES value, or null if no mapping found
 */
export const getModuleKeyForRoute = pathname => {
  // Exact match
  if (ROUTE_PERMISSIONS[pathname]) {
    return ROUTE_PERMISSIONS[pathname];
  }

  // Pattern match for dynamic segments (e.g. /customer-master/123/edit)
  for (const [routePattern, moduleKey] of Object.entries(ROUTE_PERMISSIONS)) {
    const pattern = routePattern
      .replace(/:[^/]+/g, '[^/]+') // :param → match any segment
      .replace(/\//g, '\\/'); // escape slashes

    const regex = new RegExp(`^${pattern}$`);
    if (regex.test(pathname)) {
      return moduleKey;
    }
  }

  return null;
};

export const normalizeModuleTreePath = path => {
  if (!path || typeof path !== 'string') return '';
  return path.replace(/^\//, '').replace(/\/$/, '');
};

export const buildFeatureInPlanMap = moduleTree => {
  const map = {};
  const walk = nodes => {
    if (!Array.isArray(nodes)) return;
    for (const n of nodes) {
      if (n?.featureName) {
        map[n.featureName] = n.isInPlan !== false;
      }
      if (Array.isArray(n.subItems) && n.subItems.length) {
        walk(n.subItems);
      }
    }
  };
  walk(moduleTree);
  return map;
};

/**
 * Flatten `/module/permission-tree` moduleTree nodes for path → isInPlan lookups.
 */
export const flattenPermissionModuleTree = moduleTree => {
  const list = [];
  const walk = nodes => {
    if (!Array.isArray(nodes)) return;
    for (const n of nodes) {
      if (n?.path && typeof n.path === 'string') {
        list.push({
          pathNorm: normalizeModuleTreePath(n.path),
          isInPlan: n.isInPlan,
        });
      }
      if (Array.isArray(n.subItems) && n.subItems.length) {
        walk(n.subItems);
      }
    }
  };
  walk(moduleTree);
  return list;
};

/**
 * @param {string} routePath - pathname (e.g. /banks/new) or app route pattern (e.g. banks/:id)
 * @param {{ pathNorm: string, isInPlan?: boolean }[]} flatNodes - from flattenPermissionModuleTree
 * @returns {boolean|null} true = in plan or unknown flag; false = not in plan; null = no tree / no matching node
 */
export const getIsInPlanForRoutePath = (routePath, flatNodes) => {
  if (!flatNodes?.length || routePath == null || routePath === '') {
    return null;
  }
  const routeNorm = normalizeModuleTreePath(routePath.startsWith('/') ? routePath : `/${routePath}`);
  const sorted = [...flatNodes].filter(n => n.pathNorm).sort((a, b) => b.pathNorm.length - a.pathNorm.length);
  for (const node of sorted) {
    if (routeNorm === node.pathNorm || routeNorm.startsWith(`${node.pathNorm}/`)) {
      return node.isInPlan !== false;
    }
  }
  return null;
};
