import { MODULE_NAMES } from '@/utils/constants';

export const ROUTES = {
  ADMIN: {
    HOME: 'home',
    RECENT_UPDATES: 'recent-updates',

    DIVISION: {
      LISTING: 'division',
      CREATE: 'division/new',
      VIEW: divId => (divId ? `division/${divId}` : 'division/:divId'),
      EDIT: divId => (divId ? `division/${divId}/edit` : 'division/:divId/edit'),
    },

    BRANCH: {
      LISTING: 'branch',
      CREATE: 'branch/new',
      VIEW: brId => (brId ? `branch/${brId}` : 'branch/:brId'),
      EDIT: brId => (brId ? `branch/${brId}/edit` : 'branch/:brId/edit'),
    },

    MAN_POWER_MASTER: 'man-power-master',

    WAREHOUSE_MASTER: {
      LISTING: 'warehouse-master',
      CREATE: 'warehouse-master/new',
      VIEW: wrhId => (wrhId ? `warehouse-master/${wrhId}` : 'warehouse-master/:wrhId'),
      EDIT: wrhId => (wrhId ? `warehouse-master/${wrhId}/edit` : 'warehouse-master/:wrhId/edit'),
    },

    CUSTOMER_MASTER: {
      LISTING: 'customer-master',
      CREATE: 'customer-master/new',
      CREATE_BULK: 'customer-master/bulk/import',
      CREATE_BULK_OPENING_BALANCE: 'customer-master/bulk/opening-balance',
      VIEW: customerId => (customerId ? `customer-master/${customerId}` : 'customer-master/:customerId'),
      EDIT: customerId => (customerId ? `customer-master/${customerId}/edit` : 'customer-master/:customerId/edit'),
      ANALYSIS_360: customerId => (customerId ? `customer-master/${customerId}/360-view` : 'customer-master/:customerId/360-view'),
    },

    VENDORS: {
      LISTING: 'vendors',
      CREATE: 'vendors/new',
      CREATE_BULK: 'vendors/bulk/import',
      CREATE_BULK_OPENING_BALANCE: 'vendors/bulk/opening-balance',
      VIEW: customerId => (customerId ? `vendors/${customerId}` : 'vendors/:customerId'),
      EDIT: customerId => (customerId ? `vendors/${customerId}/edit` : 'vendors/:customerId/edit'),
    },

    PRICE_LIST: {
      LISTING: 'price-list',
      VIEW: priceListId => (priceListId ? `price-list/${priceListId}` : 'price-list/:priceListId'),
      CREATE: 'price-list/new',
      EDIT: priceListId => (priceListId ? `price-list/${priceListId}/edit` : 'price-list/:priceListId/edit'),
    },

    PROCESS: 'process',
    RECIPE: 'recipe',

    QUALITY_MASTER: {
      LISTING: 'quality-master',
      CREATE: 'quality-master/new',
      VIEW: qltId => (qltId ? `quality-master/${qltId}` : 'quality-master/:qltId'),
      EDIT: qltId => (qltId ? `quality-master/${qltId}/edit` : 'quality-master/:qltId/edit'),
    },

    ITEM_MASTER: {
      LISTING: 'item-master',
      CREATE: 'item-master/new',
      CREATE_BULK: 'item-master/bulk/import',
      CREATE_BULK_INVENTORY: 'item-master/bulk/inventory',
      VIEW: itemId => (itemId ? `item-master/${itemId}` : 'item-master/:itemId'),
      EDIT: itemId => (itemId ? `item-master/${itemId}/edit` : 'item-master/:itemId/edit'),
    },

    ITEM_GROUP_MASTER: 'item-group-master',
    ITEM_GROUP_DETAIL: itemGroupId => (itemGroupId ? `item-group-master/${itemGroupId}` : 'item-group-master/:itemGroupId'),
    SALES_ORDER_TAG_MASTER: 'sales-order-tag-master',

    VIEW_INVENTORY: {
      LISTING: 'view-inventory',
      DETAILS: itemId => (itemId ? `view-inventory/${itemId}/inventory-details` : 'view-inventory/:itemId/inventory-details'),
    },

    PRODUCTION_ORDERS: {
      LISTING: 'production-orders',
      CREATE: 'production-orders/new',
      EDIT: productionOrderId => (productionOrderId ? `production-orders/${productionOrderId}/edit` : 'production-orders/:productionOrderId/edit'),
      VIEW: productionOrderId => (productionOrderId ? `production-orders/${productionOrderId}` : 'production-orders/:productionOrderId'),
    },

    INVENTORY_TRANSFER_REQUEST: {
      LISTING: 'inventory-transfer-request',
      VIEW: transferId => (transferId ? `inventory-transfer-request/${transferId}` : 'inventory-transfer-request/:transferId'),
    },
    INVENTORY_LOGS: 'inventory-logs',

    REJECTIONS: {
      LISTING: 'rejection-orders',
      CREATE: 'rejection-orders/new',
      INVENTORY: 'rejection-inventory',
      ANALYSIS: 'rejection-analysis',
      VIEW: id => (id ? `rejection-orders/${id}` : 'rejection-orders/:rejectionId'),
      EDIT: id => (id ? `rejection-orders/${id}/edit` : 'rejection-orders/:rejectionId/edit'),
    },

    COMPLAINT: {
      LISTING: 'complaints',
      CREATE: 'complaints/new',
      VIEW: id => (id ? `complaints/${id}` : 'complaints/:complaintId'),
      EDIT: id => (id ? `complaints/${id}/edit` : 'complaints/:complaintId/edit'),
      PROBLEM_LIST: 'problem-list',
    },

    SPARE_PART: {
      LISTING: 'spare-part',
      CREATE: 'spare-part/new',
      VIEW: id => (id ? `spare-part/${id}` : 'spare-part/:sparePartId'),
      EDIT: id => (id ? `spare-part/${id}/edit` : 'spare-part/:sparePartId/edit'),
    },

    MACHINE: {
      LISTING: 'machine',
      CREATE: 'machine/new',
      VIEW: id => (id ? `machine/${id}` : 'machine/:machineId'),
      EDIT: id => (id ? `machine/${id}/edit` : 'machine/:machineId/edit'),
    },

    MAINTENANCE_REQUEST: {
      LISTING: 'maintenance-request',
      VIEW: id => (id ? `maintenance-request/${id}` : 'maintenance-request/:maintenanceRequestId'),
    },

    MAINTENANCE_PURCHASE: {
      LISTING: 'maintenance-purchase',
      CREATE: 'maintenance-purchase/new',
      VIEW: id => (id ? `maintenance-purchase/${id}` : 'maintenance-purchase/:maintenancePurchaseId'),
    },

    PART_REQUEST: {
      LISTING: 'part-request',
    },

    SPARE_STOCK_LEDGER: {
      LISTING: 'spare-stock-ledger',
    },

    SUBMIT_PRODUCTION_MODULE: {
      LISTING: 'submit-production-module',
      VIEW: productionOrderId => (productionOrderId ? `submit-production-module/${productionOrderId}` : 'submit-production-module/:productionOrderId'),
    },

    QUOTES: {
      LISTING: 'quotes',
      CREATE: 'quotes/new',
      VIEW: quoteId => (quoteId ? `quotes/${quoteId}` : 'quotes/:quoteId'),
      EDIT: quoteId => (quoteId ? `quotes/${quoteId}/edit` : 'quotes/:quoteId/edit'),
    },

    CUSTOMER_ORDERS: {
      LISTING: 'customer-orders',
      VIEW: id => (id ? `customer-orders/${id}` : 'customer-orders/:customerOrderId'),
    },

    SAMPLE_CATALOGS: {
      LISTING: 'sample-catalogs',
      CREATE: 'sample-catalogs/new',
      VIEW: id => (id ? `sample-catalogs/${id}` : 'sample-catalogs/:sampleCatalogId'),
      EDIT: id => (id ? `sample-catalogs/${id}/edit` : 'sample-catalogs/:sampleCatalogId/edit'),
    },

    CUSTOMER_PAYMENTS: {
      LISTING: 'customer-payments',
      VIEW: id => (id ? `customer-payments/${id}` : 'customer-payments/:customerPaymentId'),
    },

    CUSTOMER_APP_DASHBOARD: {
      LISTING: 'customer-app-dashboard',
    },

    SALES_ORDERS: {
      LISTING: 'sales-orders',
      CREATE: 'sales-orders/new',
      VIEW: salesId => (salesId ? `sales-orders/${salesId}` : 'sales-orders/:salesId'),
      EDIT: salesId => (salesId ? `sales-orders/${salesId}/edit` : 'sales-orders/:salesId/edit'),
    },

    DELIVERY_CHALLANS: {
      LISTING: 'delivery-challans',
      CREATE: 'delivery-challans/new',
      VIEW: deliveryChallanId => (deliveryChallanId ? `delivery-challans/${deliveryChallanId}` : 'delivery-challans/:deliveryChallanId'),
      // NOTE: keep `deliveryId` (existing param name) for edit route
      EDIT: deliveryId => (deliveryId ? `delivery-challans/${deliveryId}/edit` : 'delivery-challans/:deliveryId/edit'),
    },

    INVOICES: {
      LISTING: 'invoices',
      CREATE: 'invoices/new',
      VIEW: invoiceId => (invoiceId ? `invoices/${invoiceId}` : 'invoices/:invoiceId'),
      EDIT: invoiceId => (invoiceId ? `invoices/${invoiceId}/edit` : 'invoices/:invoiceId/edit'),
    },

    PAYMENTS_RECEIVED: {
      LISTING: 'payments-received',
      CREATE: 'payments-received/new',
      VIEW: paymentId => (paymentId ? `payments-received/${paymentId}` : 'payments-received/:paymentId'),
      EDIT: paymentId => (paymentId ? `payments-received/${paymentId}/edit` : 'payments-received/:paymentId/edit'),
    },

    RECURRING_INVOICES: {
      LISTING: 'recurring-invoices',
      CREATE: 'recurring-invoices/new',
      EDIT: recurringId => (recurringId ? `recurring-invoices/${recurringId}/edit` : 'recurring-invoices/:recurringId/edit'),
      VIEW: recurringId => (recurringId ? `recurring-invoices/${recurringId}` : 'recurring-invoices/:recurringId'),
    },

    CREDIT_NOTES: {
      LISTING: 'credit-notes',
      CREATE: 'credit-notes/new',
      VIEW: creditNotesId => (creditNotesId ? `credit-notes/${creditNotesId}` : 'credit-notes/:creditNotesId'),
      EDIT: creditNotesId => (creditNotesId ? `credit-notes/${creditNotesId}/edit` : 'credit-notes/:creditNotesId/edit'),
    },

    BANKS: {
      LISTING: 'banks',
      CREATE: 'banks/new',
      VIEW: bankId => (bankId ? `banks/${bankId}` : 'banks/:bankId'),
      EDIT: bankId => (bankId ? `banks/${bankId}/edit` : 'banks/:bankId/edit'),
    },

    BANK_TRANSFER_LOGS: 'bank-transfer-logs',

    EXPENSES: {
      LISTING: 'expenses',
      CREATE: 'expenses/new',
      VIEW: expensesId => (expensesId ? `expenses/${expensesId}` : 'expenses/:expensesId'),
      // NOTE: keep `expenseId` (existing param name) for edit route
      EDIT: expenseId => (expenseId ? `expenses/${expenseId}/edit` : 'expenses/:expenseId/edit'),
    },

    RECURRING_EXPENSES: {
      LISTING: 'recurring-expenses',
      CREATE: 'recurring-expenses/new',
      EDIT: recurringExpenseId => (recurringExpenseId ? `recurring-expenses/${recurringExpenseId}/edit` : 'recurring-expenses/:recurringExpenseId/edit'),
      VIEW: recurringExpenseId => (recurringExpenseId ? `recurring-expenses/${recurringExpenseId}` : 'recurring-expenses/:recurringExpenseId'),
    },

    PURCHASE_ORDERS: {
      LISTING: 'purchase-orders',
      CREATE: 'purchase-orders/new',
      VIEW: purchaseOrderId => (purchaseOrderId ? `purchase-orders/${purchaseOrderId}` : 'purchase-orders/:purchaseOrderId'),
      // NOTE: keep `purchaseId` (existing param name) for edit route
      EDIT: purchaseId => (purchaseId ? `purchase-orders/${purchaseId}/edit` : 'purchase-orders/:purchaseId/edit'),
    },

    BILLS: {
      LISTING: 'bills',
      CREATE: 'bills/new',
      VIEW: billsId => (billsId ? `bills/${billsId}` : 'bills/:billsId'),
      EDIT: billsId => (billsId ? `bills/${billsId}/edit` : 'bills/:billsId/edit'),
    },

    PAYMENTS_MADE: {
      LISTING: 'payments-made',
      CREATE: 'payments-made/new',
      VIEW: paymentId => (paymentId ? `payments-made/${paymentId}` : 'payments-made/:paymentId'),
      EDIT: paymentId => (paymentId ? `payments-made/${paymentId}/edit` : 'payments-made/:paymentId/edit'),
    },

    RECURRING_BILLS: {
      LISTING: 'recurring-bills',
      CREATE: 'recurring-bills/new',
      EDIT: billsId => (billsId ? `recurring-bills/${billsId}/edit` : 'recurring-bills/:billsId/edit'),
      VIEW: billsId => (billsId ? `recurring-bills/${billsId}` : 'recurring-bills/:billsId'),
    },

    DEBIT_NOTES: {
      LISTING: 'debit-notes',
      CREATE: 'debit-notes/new',
      VIEW: debitNoteId => (debitNoteId ? `debit-notes/${debitNoteId}` : 'debit-notes/:debitNoteId'),
      // NOTE: keep `vendorId` (existing param name) for edit route
      EDIT: vendorId => (vendorId ? `debit-notes/${vendorId}/edit` : 'debit-notes/:vendorId/edit'),
    },

    GRPO: {
      LISTING: 'grpo',
      CREATE: 'grpo/new',
      VIEW: grpoId => (grpoId ? `grpo/${grpoId}` : 'grpo/:grpoId'),
      EDIT: grpoId => (grpoId ? `grpo/${grpoId}/edit` : 'grpo/:grpoId/edit'),
    },

    ACCOUNTANT: {
      LISTING: 'accountant',
      DETAIL: accountId => (accountId ? `accountant/${accountId}` : 'accountant/:accountId'),
    },

    ACCOUNT_PARTNER: {
      LISTING: 'account-partner',
      CREATE: 'account-partner/new',
      EDIT: accountLedgerId => (accountLedgerId ? `account-partner/${accountLedgerId}/edit` : 'account-partner/:accountLedgerId/edit'),
    },

    MANUAL_JOURNAL: {
      LISTING: 'manual-journal',
      CREATE: 'manual-journal/new',
      VIEW: manualJournalId => (manualJournalId ? `manual-journal/${manualJournalId}` : 'manual-journal/:manualJournalId'),
      EDIT: manualJournalId => (manualJournalId ? `manual-journal/${manualJournalId}/edit` : 'manual-journal/:manualJournalId/edit'),
    },

    SETTING: {
      ROOT: 'setting',
      PROFILE: 'setting/profile',
      MY_PROFILE: 'setting/my-profile',
      USERS: 'setting/users',
      ROLES: {
        LISTING: 'setting/roles',
        NEW: 'setting/roles/new',
        EDIT: roleId => (roleId ? `setting/roles/${roleId}/edit` : 'setting/roles/:roleId/edit'),
      },
      CURRENCIES: 'setting/currencies',
      WHATSAPP_CONFIG: 'setting/whatsapp-config',
      GST_CREDENTIALS: 'setting/gst-credentials',
      QUOTATION_CONFIG: 'setting/quotation-config',
      SPLIT_CONFIG: 'setting/split-config',
      USAGE: 'setting/usage',
      INVENTORY_CONFIG: 'setting/inventory-config',
      AUTOMATION: 'setting/automation',
      REJECTION_CONFIG: 'setting/rejection-config',
      REJECTION_REASONS: 'setting/rejection-reasons',
      ADDITIONAL_CHARGES: 'setting/additional-charges',
      DISCOUNTS: 'setting/discounts',
      CREDIT_LIMITS: 'setting/credit-limits',
      PAYMENT_TERMS: 'setting/payment-terms',
      ITEM_UNITS: 'setting/item-units',
      PRODUCTION_WAREHOUSE_CONFIG: 'setting/production-warehouse-config',
      DIRECT_TAXES: 'setting/direct-taxes',
      ORGANIZATION_DEFAULTS: 'setting/organization-defaults',
      NOTIFICATIONS: 'setting/notifications',
      EMAIL_CONFIG: 'setting/email-config',
      EMAIL_PREFERENCES: 'setting/email-preferences',
      INCENTIVE_SCHEME: {
        LISTING: 'setting/incentive-scheme',
        CREATE: 'setting/incentive-scheme/new',
        USER_VIEW: userId => (userId ? `setting/incentive-scheme/user/${userId}` : 'setting/incentive-scheme/user/:userId'),
        VIEW: incentiveSchemeId => (incentiveSchemeId ? `setting/incentive-scheme/${incentiveSchemeId}` : 'setting/incentive-scheme/:incentiveSchemeId'),
        EDIT: incentiveSchemeId => (incentiveSchemeId ? `setting/incentive-scheme/${incentiveSchemeId}/edit` : 'setting/incentive-scheme/:incentiveSchemeId/edit'),
      },
    },

    SUPPORT: {
      LISTING: 'support',
      CREATE: 'support/new',
      VIEW: supportId => (supportId ? `support/${supportId}` : 'support/:supportId'),
    },
  },
};

// Keep existing `AdminRoutes.jsx` working (same shape as before)
export const ADMIN_ROUTE_PATHS = {
  home: ROUTES.ADMIN.HOME,
  recentUpdates: ROUTES.ADMIN.RECENT_UPDATES,
  division: {
    root: ROUTES.ADMIN.DIVISION.LISTING,
    new: ROUTES.ADMIN.DIVISION.CREATE,
    detail: ROUTES.ADMIN.DIVISION.VIEW(),
    edit: ROUTES.ADMIN.DIVISION.EDIT(),
    build: {
      detail: divId => ROUTES.ADMIN.DIVISION.VIEW(divId),
      edit: divId => ROUTES.ADMIN.DIVISION.EDIT(divId),
    },
  },
  branch: {
    root: ROUTES.ADMIN.BRANCH.LISTING,
    new: ROUTES.ADMIN.BRANCH.CREATE,
    detail: ROUTES.ADMIN.BRANCH.VIEW(),
    edit: ROUTES.ADMIN.BRANCH.EDIT(),
    build: {
      detail: brId => ROUTES.ADMIN.BRANCH.VIEW(brId),
      edit: brId => ROUTES.ADMIN.BRANCH.EDIT(brId),
    },
  },
  manPowerMaster: ROUTES.ADMIN.MAN_POWER_MASTER,
  salesOrderTagMaster: ROUTES.ADMIN.SALES_ORDER_TAG_MASTER,
  warehouseMaster: {
    root: ROUTES.ADMIN.WAREHOUSE_MASTER.LISTING,
    new: ROUTES.ADMIN.WAREHOUSE_MASTER.CREATE,
    detail: ROUTES.ADMIN.WAREHOUSE_MASTER.VIEW(),
    edit: ROUTES.ADMIN.WAREHOUSE_MASTER.EDIT(),
    build: {
      detail: wrhId => ROUTES.ADMIN.WAREHOUSE_MASTER.VIEW(wrhId),
      edit: wrhId => ROUTES.ADMIN.WAREHOUSE_MASTER.EDIT(wrhId),
    },
  },
  customerMaster: {
    root: ROUTES.ADMIN.CUSTOMER_MASTER.LISTING,
    new: ROUTES.ADMIN.CUSTOMER_MASTER.CREATE,
    bulkImport: ROUTES.ADMIN.CUSTOMER_MASTER.CREATE_BULK,
    bulkOpeningBalance: ROUTES.ADMIN.CUSTOMER_MASTER.CREATE_BULK_OPENING_BALANCE,
    detail: ROUTES.ADMIN.CUSTOMER_MASTER.VIEW(),
    edit: ROUTES.ADMIN.CUSTOMER_MASTER.EDIT(),
    analysis360: ROUTES.ADMIN.CUSTOMER_MASTER.ANALYSIS_360(),
    build: {
      detail: customerId => ROUTES.ADMIN.CUSTOMER_MASTER.VIEW(customerId),
      edit: customerId => ROUTES.ADMIN.CUSTOMER_MASTER.EDIT(customerId),
      analysis360: customerId => ROUTES.ADMIN.CUSTOMER_MASTER.ANALYSIS_360(customerId),
    },
  },
  vendors: {
    root: ROUTES.ADMIN.VENDORS.LISTING,
    new: ROUTES.ADMIN.VENDORS.CREATE,
    bulkImport: ROUTES.ADMIN.VENDORS.CREATE_BULK,
    bulkOpeningBalance: ROUTES.ADMIN.VENDORS.CREATE_BULK_OPENING_BALANCE,
    detail: ROUTES.ADMIN.VENDORS.VIEW(),
    edit: ROUTES.ADMIN.VENDORS.EDIT(),
    build: {
      detail: customerId => ROUTES.ADMIN.VENDORS.VIEW(customerId),
      edit: customerId => ROUTES.ADMIN.VENDORS.EDIT(customerId),
    },
  },
  priceList: {
    root: ROUTES.ADMIN.PRICE_LIST.LISTING,
    detail: ROUTES.ADMIN.PRICE_LIST.VIEW(),
    new: ROUTES.ADMIN.PRICE_LIST.CREATE,
    edit: ROUTES.ADMIN.PRICE_LIST.EDIT(),
    build: { edit: id => ROUTES.ADMIN.PRICE_LIST.EDIT(id) },
  },
  process: ROUTES.ADMIN.PROCESS,
  recipe: ROUTES.ADMIN.RECIPE,
  qualityMaster: {
    root: ROUTES.ADMIN.QUALITY_MASTER.LISTING,
    new: ROUTES.ADMIN.QUALITY_MASTER.CREATE,
    detail: ROUTES.ADMIN.QUALITY_MASTER.VIEW(),
    edit: ROUTES.ADMIN.QUALITY_MASTER.EDIT(),
    build: {
      detail: id => ROUTES.ADMIN.QUALITY_MASTER.VIEW(id),
      edit: id => ROUTES.ADMIN.QUALITY_MASTER.EDIT(id),
    },
  },
  itemMaster: {
    root: ROUTES.ADMIN.ITEM_MASTER.LISTING,
    new: ROUTES.ADMIN.ITEM_MASTER.CREATE,
    bulkImport: ROUTES.ADMIN.ITEM_MASTER.CREATE_BULK,
    bulkInventory: ROUTES.ADMIN.ITEM_MASTER.CREATE_BULK_INVENTORY,
    detail: ROUTES.ADMIN.ITEM_MASTER.VIEW(),
    edit: ROUTES.ADMIN.ITEM_MASTER.EDIT(),
    build: {
      detail: id => ROUTES.ADMIN.ITEM_MASTER.VIEW(id),
      edit: id => ROUTES.ADMIN.ITEM_MASTER.EDIT(id),
    },
  },
  itemGroupMaster: ROUTES.ADMIN.ITEM_GROUP_MASTER,
  itemGroupDetail: ROUTES.ADMIN.ITEM_GROUP_DETAIL(),
  viewInventory: {
    root: ROUTES.ADMIN.VIEW_INVENTORY.LISTING,
    detail: ROUTES.ADMIN.VIEW_INVENTORY.DETAILS(),
    build: { detail: id => ROUTES.ADMIN.VIEW_INVENTORY.DETAILS(id) },
  },
  productionOrders: {
    root: ROUTES.ADMIN.PRODUCTION_ORDERS.LISTING,
    new: ROUTES.ADMIN.PRODUCTION_ORDERS.CREATE,
    edit: ROUTES.ADMIN.PRODUCTION_ORDERS.EDIT(),
    detail: ROUTES.ADMIN.PRODUCTION_ORDERS.VIEW(),
    build: {
      edit: id => ROUTES.ADMIN.PRODUCTION_ORDERS.EDIT(id),
      detail: id => ROUTES.ADMIN.PRODUCTION_ORDERS.VIEW(id),
    },
  },
  inventoryTransferRequest: {
    root: ROUTES.ADMIN.INVENTORY_TRANSFER_REQUEST.LISTING,
    detail: ROUTES.ADMIN.INVENTORY_TRANSFER_REQUEST.VIEW(),
    build: {
      detail: transferId => ROUTES.ADMIN.INVENTORY_TRANSFER_REQUEST.VIEW(transferId),
    },
  },
  inventoryLogs: ROUTES.ADMIN.INVENTORY_LOGS,
  rejections: {
    root: ROUTES.ADMIN.REJECTIONS.LISTING,
    new: ROUTES.ADMIN.REJECTIONS.CREATE,
    inventory: ROUTES.ADMIN.REJECTIONS.INVENTORY,
    analysis: ROUTES.ADMIN.REJECTIONS.ANALYSIS,
    detail: ROUTES.ADMIN.REJECTIONS.VIEW(),
    edit: ROUTES.ADMIN.REJECTIONS.EDIT(),
    build: {
      detail: id => ROUTES.ADMIN.REJECTIONS.VIEW(id),
      edit: id => ROUTES.ADMIN.REJECTIONS.EDIT(id),
    },
  },
  complaint: {
    root: ROUTES.ADMIN.COMPLAINT.LISTING,
    new: ROUTES.ADMIN.COMPLAINT.CREATE,
    detail: ROUTES.ADMIN.COMPLAINT.VIEW(),
    edit: ROUTES.ADMIN.COMPLAINT.EDIT(),
    problemList: ROUTES.ADMIN.COMPLAINT.PROBLEM_LIST,
    build: {
      detail: id => ROUTES.ADMIN.COMPLAINT.VIEW(id),
      edit: id => ROUTES.ADMIN.COMPLAINT.EDIT(id),
    },
  },
  sparePart: {
    root: ROUTES.ADMIN.SPARE_PART.LISTING,
    new: ROUTES.ADMIN.SPARE_PART.CREATE,
    detail: ROUTES.ADMIN.SPARE_PART.VIEW(),
    edit: ROUTES.ADMIN.SPARE_PART.EDIT(),
    build: {
      detail: id => ROUTES.ADMIN.SPARE_PART.VIEW(id),
      edit: id => ROUTES.ADMIN.SPARE_PART.EDIT(id),
    },
  },
  machine: {
    root: ROUTES.ADMIN.MACHINE.LISTING,
    new: ROUTES.ADMIN.MACHINE.CREATE,
    detail: ROUTES.ADMIN.MACHINE.VIEW(),
    edit: ROUTES.ADMIN.MACHINE.EDIT(),
    build: {
      detail: id => ROUTES.ADMIN.MACHINE.VIEW(id),
      edit: id => ROUTES.ADMIN.MACHINE.EDIT(id),
    },
  },
  maintenanceRequest: {
    root: ROUTES.ADMIN.MAINTENANCE_REQUEST.LISTING,
    detail: ROUTES.ADMIN.MAINTENANCE_REQUEST.VIEW(),
    build: {
      detail: id => ROUTES.ADMIN.MAINTENANCE_REQUEST.VIEW(id),
    },
  },
  maintenancePurchase: {
    root: ROUTES.ADMIN.MAINTENANCE_PURCHASE.LISTING,
    new: ROUTES.ADMIN.MAINTENANCE_PURCHASE.CREATE,
    detail: ROUTES.ADMIN.MAINTENANCE_PURCHASE.VIEW(),
    build: {
      detail: id => ROUTES.ADMIN.MAINTENANCE_PURCHASE.VIEW(id),
    },
  },
  partRequest: {
    root: ROUTES.ADMIN.PART_REQUEST.LISTING,
  },
  spareStockLedger: {
    root: ROUTES.ADMIN.SPARE_STOCK_LEDGER.LISTING,
  },
  submitProductionModule: {
    root: ROUTES.ADMIN.SUBMIT_PRODUCTION_MODULE.LISTING,
    detail: ROUTES.ADMIN.SUBMIT_PRODUCTION_MODULE.VIEW(),
    build: { detail: id => ROUTES.ADMIN.SUBMIT_PRODUCTION_MODULE.VIEW(id) },
  },
  quotes: {
    root: ROUTES.ADMIN.QUOTES.LISTING,
    new: ROUTES.ADMIN.QUOTES.CREATE,
    detail: ROUTES.ADMIN.QUOTES.VIEW(),
    edit: ROUTES.ADMIN.QUOTES.EDIT(),
    build: {
      detail: id => ROUTES.ADMIN.QUOTES.VIEW(id),
      edit: id => ROUTES.ADMIN.QUOTES.EDIT(id),
    },
  },
  customerOrders: {
    root: ROUTES.ADMIN.CUSTOMER_ORDERS.LISTING,
    detail: ROUTES.ADMIN.CUSTOMER_ORDERS.VIEW(),
    build: {
      detail: id => ROUTES.ADMIN.CUSTOMER_ORDERS.VIEW(id),
    },
  },
  sampleCatalogs: {
    root: ROUTES.ADMIN.SAMPLE_CATALOGS.LISTING,
    create: ROUTES.ADMIN.SAMPLE_CATALOGS.CREATE,
    detail: ROUTES.ADMIN.SAMPLE_CATALOGS.VIEW(),
    edit: ROUTES.ADMIN.SAMPLE_CATALOGS.EDIT(),
    build: {
      detail: id => ROUTES.ADMIN.SAMPLE_CATALOGS.VIEW(id),
      edit: id => ROUTES.ADMIN.SAMPLE_CATALOGS.EDIT(id),
    },
  },
  customerPayments: {
    root: ROUTES.ADMIN.CUSTOMER_PAYMENTS.LISTING,
    detail: ROUTES.ADMIN.CUSTOMER_PAYMENTS.VIEW(),
    build: {
      detail: id => ROUTES.ADMIN.CUSTOMER_PAYMENTS.VIEW(id),
    },
  },
  customerAppDashboard: {
    root: ROUTES.ADMIN.CUSTOMER_APP_DASHBOARD.LISTING,
  },
  salesOrders: {
    root: ROUTES.ADMIN.SALES_ORDERS.LISTING,
    new: ROUTES.ADMIN.SALES_ORDERS.CREATE,
    detail: ROUTES.ADMIN.SALES_ORDERS.VIEW(),
    edit: ROUTES.ADMIN.SALES_ORDERS.EDIT(),
    build: {
      detail: id => ROUTES.ADMIN.SALES_ORDERS.VIEW(id),
      edit: id => ROUTES.ADMIN.SALES_ORDERS.EDIT(id),
    },
  },
  deliveryChallans: {
    root: ROUTES.ADMIN.DELIVERY_CHALLANS.LISTING,
    new: ROUTES.ADMIN.DELIVERY_CHALLANS.CREATE,
    detail: ROUTES.ADMIN.DELIVERY_CHALLANS.VIEW(),
    edit: ROUTES.ADMIN.DELIVERY_CHALLANS.EDIT(),
    build: {
      detail: id => ROUTES.ADMIN.DELIVERY_CHALLANS.VIEW(id),
      edit: id => ROUTES.ADMIN.DELIVERY_CHALLANS.EDIT(id),
    },
  },
  invoices: {
    root: ROUTES.ADMIN.INVOICES.LISTING,
    new: ROUTES.ADMIN.INVOICES.CREATE,
    detail: ROUTES.ADMIN.INVOICES.VIEW(),
    edit: ROUTES.ADMIN.INVOICES.EDIT(),
    build: {
      detail: id => ROUTES.ADMIN.INVOICES.VIEW(id),
      edit: id => ROUTES.ADMIN.INVOICES.EDIT(id),
    },
  },
  paymentsReceived: {
    root: ROUTES.ADMIN.PAYMENTS_RECEIVED.LISTING,
    new: ROUTES.ADMIN.PAYMENTS_RECEIVED.CREATE,
    detail: ROUTES.ADMIN.PAYMENTS_RECEIVED.VIEW(),
    edit: ROUTES.ADMIN.PAYMENTS_RECEIVED.EDIT(),
    build: {
      detail: id => ROUTES.ADMIN.PAYMENTS_RECEIVED.VIEW(id),
      edit: id => ROUTES.ADMIN.PAYMENTS_RECEIVED.EDIT(id),
    },
  },
  recurringInvoices: {
    root: ROUTES.ADMIN.RECURRING_INVOICES.LISTING,
    new: ROUTES.ADMIN.RECURRING_INVOICES.CREATE,
    edit: ROUTES.ADMIN.RECURRING_INVOICES.EDIT(),
    detail: ROUTES.ADMIN.RECURRING_INVOICES.VIEW(),
    build: {
      edit: id => ROUTES.ADMIN.RECURRING_INVOICES.EDIT(id),
      detail: id => ROUTES.ADMIN.RECURRING_INVOICES.VIEW(id),
    },
  },
  creditNotes: {
    root: ROUTES.ADMIN.CREDIT_NOTES.LISTING,
    new: ROUTES.ADMIN.CREDIT_NOTES.CREATE,
    detail: ROUTES.ADMIN.CREDIT_NOTES.VIEW(),
    edit: ROUTES.ADMIN.CREDIT_NOTES.EDIT(),
    build: {
      detail: id => ROUTES.ADMIN.CREDIT_NOTES.VIEW(id),
      edit: id => ROUTES.ADMIN.CREDIT_NOTES.EDIT(id),
    },
  },
  banks: {
    root: ROUTES.ADMIN.BANKS.LISTING,
    new: ROUTES.ADMIN.BANKS.CREATE,
    detail: ROUTES.ADMIN.BANKS.VIEW(),
    edit: ROUTES.ADMIN.BANKS.EDIT(),
    build: {
      detail: id => ROUTES.ADMIN.BANKS.VIEW(id),
      edit: id => ROUTES.ADMIN.BANKS.EDIT(id),
    },
  },
  bankTransferLogs: ROUTES.ADMIN.BANK_TRANSFER_LOGS,
  expenses: {
    root: ROUTES.ADMIN.EXPENSES.LISTING,
    new: ROUTES.ADMIN.EXPENSES.CREATE,
    detail: ROUTES.ADMIN.EXPENSES.VIEW(),
    edit: ROUTES.ADMIN.EXPENSES.EDIT(),
    build: {
      detail: id => ROUTES.ADMIN.EXPENSES.VIEW(id),
      edit: id => ROUTES.ADMIN.EXPENSES.EDIT(id),
    },
  },
  recurringExpenses: {
    root: ROUTES.ADMIN.RECURRING_EXPENSES.LISTING,
    new: ROUTES.ADMIN.RECURRING_EXPENSES.CREATE,
    edit: ROUTES.ADMIN.RECURRING_EXPENSES.EDIT(),
    detail: ROUTES.ADMIN.RECURRING_EXPENSES.VIEW(),
    build: {
      edit: id => ROUTES.ADMIN.RECURRING_EXPENSES.EDIT(id),
      detail: id => ROUTES.ADMIN.RECURRING_EXPENSES.VIEW(id),
    },
  },
  purchaseOrders: {
    root: ROUTES.ADMIN.PURCHASE_ORDERS.LISTING,
    new: ROUTES.ADMIN.PURCHASE_ORDERS.CREATE,
    detail: ROUTES.ADMIN.PURCHASE_ORDERS.VIEW(),
    edit: ROUTES.ADMIN.PURCHASE_ORDERS.EDIT(),
    build: {
      detail: id => ROUTES.ADMIN.PURCHASE_ORDERS.VIEW(id),
      edit: id => ROUTES.ADMIN.PURCHASE_ORDERS.EDIT(id),
    },
  },
  bills: {
    root: ROUTES.ADMIN.BILLS.LISTING,
    new: ROUTES.ADMIN.BILLS.CREATE,
    detail: ROUTES.ADMIN.BILLS.VIEW(),
    edit: ROUTES.ADMIN.BILLS.EDIT(),
    build: {
      detail: id => ROUTES.ADMIN.BILLS.VIEW(id),
      edit: id => ROUTES.ADMIN.BILLS.EDIT(id),
    },
  },
  paymentsMade: {
    root: ROUTES.ADMIN.PAYMENTS_MADE.LISTING,
    new: ROUTES.ADMIN.PAYMENTS_MADE.CREATE,
    detail: ROUTES.ADMIN.PAYMENTS_MADE.VIEW(),
    edit: ROUTES.ADMIN.PAYMENTS_MADE.EDIT(),
    build: {
      detail: id => ROUTES.ADMIN.PAYMENTS_MADE.VIEW(id),
      edit: id => ROUTES.ADMIN.PAYMENTS_MADE.EDIT(id),
    },
  },
  recurringBills: {
    root: ROUTES.ADMIN.RECURRING_BILLS.LISTING,
    new: ROUTES.ADMIN.RECURRING_BILLS.CREATE,
    edit: ROUTES.ADMIN.RECURRING_BILLS.EDIT(),
    detail: ROUTES.ADMIN.RECURRING_BILLS.VIEW(),
    build: {
      edit: id => ROUTES.ADMIN.RECURRING_BILLS.EDIT(id),
      detail: id => ROUTES.ADMIN.RECURRING_BILLS.VIEW(id),
    },
  },
  debitNotes: {
    root: ROUTES.ADMIN.DEBIT_NOTES.LISTING,
    new: ROUTES.ADMIN.DEBIT_NOTES.CREATE,
    detail: ROUTES.ADMIN.DEBIT_NOTES.VIEW(),
    edit: ROUTES.ADMIN.DEBIT_NOTES.EDIT(),
    build: {
      detail: id => ROUTES.ADMIN.DEBIT_NOTES.VIEW(id),
      edit: id => ROUTES.ADMIN.DEBIT_NOTES.EDIT(id),
    },
  },
  grpo: {
    root: ROUTES.ADMIN.GRPO.LISTING,
    new: ROUTES.ADMIN.GRPO.CREATE,
    detail: ROUTES.ADMIN.GRPO.VIEW(),
    edit: ROUTES.ADMIN.GRPO.EDIT(),
    build: {
      detail: id => ROUTES.ADMIN.GRPO.VIEW(id),
      edit: id => ROUTES.ADMIN.GRPO.EDIT(id),
    },
  },
  accountant: {
    root: ROUTES.ADMIN.ACCOUNTANT.LISTING,
    detail: ROUTES.ADMIN.ACCOUNTANT.DETAIL(),
    build: { detail: id => ROUTES.ADMIN.ACCOUNTANT.DETAIL(id) },
  },
  accountPartner: {
    root: ROUTES.ADMIN.ACCOUNT_PARTNER.LISTING,
    new: ROUTES.ADMIN.ACCOUNT_PARTNER.CREATE,
    edit: ROUTES.ADMIN.ACCOUNT_PARTNER.EDIT(),
    build: { edit: id => ROUTES.ADMIN.ACCOUNT_PARTNER.EDIT(id) },
  },
  manualJournal: {
    root: ROUTES.ADMIN.MANUAL_JOURNAL.LISTING,
    new: ROUTES.ADMIN.MANUAL_JOURNAL.CREATE,
    detail: ROUTES.ADMIN.MANUAL_JOURNAL.VIEW(),
    edit: ROUTES.ADMIN.MANUAL_JOURNAL.EDIT(),
    build: {
      detail: manualJournalId => ROUTES.ADMIN.MANUAL_JOURNAL.VIEW(manualJournalId),
      edit: manualJournalId => ROUTES.ADMIN.MANUAL_JOURNAL.EDIT(manualJournalId),
    },
  },
  setting: {
    root: ROUTES.ADMIN.SETTING.ROOT,
    profile: ROUTES.ADMIN.SETTING.PROFILE,
    myProfile: ROUTES.ADMIN.SETTING.MY_PROFILE,
    users: ROUTES.ADMIN.SETTING.USERS,
    roles: {
      root: ROUTES.ADMIN.SETTING.ROLES.LISTING,
      new: ROUTES.ADMIN.SETTING.ROLES.NEW,
      edit: ROUTES.ADMIN.SETTING.ROLES.EDIT(),
      build: {
        edit: roleId => ROUTES.ADMIN.SETTING.ROLES.EDIT(roleId),
      },
    },
    currencies: ROUTES.ADMIN.SETTING.CURRENCIES,
    whatsappConfig: ROUTES.ADMIN.SETTING.WHATSAPP_CONFIG,
    gstCredentials: ROUTES.ADMIN.SETTING.GST_CREDENTIALS,
    quotationConfig: ROUTES.ADMIN.SETTING.QUOTATION_CONFIG,
    splitConfig: ROUTES.ADMIN.SETTING.SPLIT_CONFIG,
    usage: ROUTES.ADMIN.SETTING.USAGE,
    inventoryConfig: ROUTES.ADMIN.SETTING.INVENTORY_CONFIG,
    automation: ROUTES.ADMIN.SETTING.AUTOMATION,
    rejectionConfig: ROUTES.ADMIN.SETTING.REJECTION_CONFIG,
    rejectionReasons: ROUTES.ADMIN.SETTING.REJECTION_REASONS,
    additionalCharges: ROUTES.ADMIN.SETTING.ADDITIONAL_CHARGES,
    discounts: ROUTES.ADMIN.SETTING.DISCOUNTS,
    creditLimits: ROUTES.ADMIN.SETTING.CREDIT_LIMITS,
    paymentTerms: ROUTES.ADMIN.SETTING.PAYMENT_TERMS,
    itemUnits: ROUTES.ADMIN.SETTING.ITEM_UNITS,
    productionWarehouseConfig: ROUTES.ADMIN.SETTING.PRODUCTION_WAREHOUSE_CONFIG,
    directTaxes: ROUTES.ADMIN.SETTING.DIRECT_TAXES,
    organizationDefaults: ROUTES.ADMIN.SETTING.ORGANIZATION_DEFAULTS,
    notifications: ROUTES.ADMIN.SETTING.NOTIFICATIONS,
    emailConfig: ROUTES.ADMIN.SETTING.EMAIL_CONFIG,
    emailPreferences: ROUTES.ADMIN.SETTING.EMAIL_PREFERENCES,
    incentiveScheme: {
      root: ROUTES.ADMIN.SETTING.INCENTIVE_SCHEME.LISTING,
      new: ROUTES.ADMIN.SETTING.INCENTIVE_SCHEME.CREATE,
      userDetail: ROUTES.ADMIN.SETTING.INCENTIVE_SCHEME.USER_VIEW(),
      detail: ROUTES.ADMIN.SETTING.INCENTIVE_SCHEME.VIEW(),
      edit: ROUTES.ADMIN.SETTING.INCENTIVE_SCHEME.EDIT(),
      build: {
        detail: id => ROUTES.ADMIN.SETTING.INCENTIVE_SCHEME.VIEW(id),
        edit: id => ROUTES.ADMIN.SETTING.INCENTIVE_SCHEME.EDIT(id),
        userDetail: userId => ROUTES.ADMIN.SETTING.INCENTIVE_SCHEME.USER_VIEW(userId),
      },
    },
  },
  reports: {
    root: 'reports',
    detail: 'reports/:reportName',
    bankLedger: 'reports/bank-ledger',
    itemLedger: 'reports/item-ledger',
    salesLedger: 'reports/sales-ledger',
    salesLedgerDetail: 'reports/sales-ledger-detail',
    purchaseLedger: 'reports/purchase-ledger',
    purchaseLedgerDetail: 'reports/purchase-ledger-detail',
    creditorsLedger: 'reports/creditors-ledger',
    creditorsLedgerDetail: 'reports/creditors-ledger/:customerId',
    debtorsLedger: 'reports/debtors-ledger',
    debtorsLedgerDetail: 'reports/debtors-ledger/:customerId',
    customerAging: 'reports/customer-aging',
    vendorAging: 'reports/vendor-aging',
    customerAgingBucket: 'reports/customer-aging-bucket',
    vendorAgingBucket: 'reports/vendor-aging-bucket',
    receivablesPayables: 'reports/receivables-payables',
    receivablesPayablesReceivables: 'reports/receivables-payables/receivables',
    receivablesPayablesPayables: 'reports/receivables-payables/payables',
    grossProfit: 'reports/gross-profit',
    gstr1: 'reports/gstr1',
    grossProfitCustomer: 'reports/gross-profit/customer/:customerId',
    grossProfitItem: 'reports/gross-profit/item/:itemId',
    grossProfitItemDetails: 'reports/gross-profit/item-details/:itemId/:documentId',
    grossProfitCustomerDetails: 'reports/gross-profit/customer-details/:documentId',
    grossProfitCustomerDetailsProductionOrder: 'reports/gross-profit/customer-details/producation-order/:productionOrderId',
    balanceSheet: 'reports/balance-sheet',
    profitLossSheet: 'reports/profit-loss-sheet',
    build: {
      detail: reportName => (reportName ? `reports/${reportName}` : 'reports/:reportName'),
      creditorsLedgerDetail: customerId => (customerId ? `reports/creditors-ledger/${customerId}` : 'reports/creditors-ledger/:customerId'),
      debtorsLedgerDetail: customerId => (customerId ? `reports/debtors-ledger/${customerId}` : 'reports/debtors-ledger/:customerId'),
      grossProfitCustomer: customerId => (customerId ? `reports/gross-profit/customer/${customerId}` : 'reports/gross-profit/customer/:customerId'),
      grossProfitItem: itemId => (itemId ? `reports/gross-profit/item/${itemId}` : 'reports/gross-profit/item/:itemId'),
      grossProfitItemDetails: (itemId, documentId) => (itemId && documentId ? `reports/gross-profit/item-details/${itemId}/${documentId}` : 'reports/gross-profit/item-details/:itemId/:documentId'),
      grossProfitCustomerDetails: documentId => (documentId ? `reports/gross-profit/customer-details/${documentId}` : 'reports/gross-profit/customer-details/:documentId'),
      grossProfitCustomerDetailsProductionOrder: productionOrderId =>
        productionOrderId ? `reports/gross-profit/customer-details/producation-order/${productionOrderId}` : 'reports/gross-profit/customer-details/producation-order/:productionOrderId',
    },
  },
  analytics: {
    root: 'analytics',
    item: 'analytics/item',
    itemGroupItem: 'analytics/item/group-item',
    salesOrders: 'analytics/sales-orders',
    customerWiseSalesOrderAnalysis: 'analytics/customerWiseSalesOrderAnalysis',
    salesOrdersItem: 'analytics/sales-orders/item',
    newVsOldCustomerCustomer: 'analytics/new-vs-old-customer/customer',
    newVsOldCustomerSalesOrders: 'analytics/new-vs-old-customer/salesOrders',
    newVsOldCustomerDeliveryChallans: 'analytics/new-vs-old-customer/deliveryChallans',
    newVsOldCustomerInvoices: 'analytics/new-vs-old-customer/invoices',
    newVsOldCustomerPayments: 'analytics/new-vs-old-customer/payments',
    salesOrdersTopCustomers: 'analytics/sales-orders/top-customers',
    customerWiseBusinessPerformance: 'analytics/sales-orders/customer-wise-performance',
    salesOrdersTopItems: 'analytics/sales-orders/top-items',
    salesOrdersCustomersSingleInvoice: 'analytics/sales-orders/customers-single-invoice',
    purchaseTopVendorsAmount: 'analytics/purchase/top-vendors-amount',
    purchaseTopVendorsRevenue: 'analytics/purchase/top-vendors-revenue',
    purchaseTopItemOfPurchase: 'analytics/purchase/top-item-of-purchase',
    collectionTopCustomerAmount: 'analytics/collection/top-customer-amount',
    collectionUpcomingReceivablesInvoice: 'analytics/collection/upcoming-receivables-invoice',
    collectionRecentlyReceivedPayments: 'analytics/collection/recently-received-payments',
    collectionOverdueInvoices: 'analytics/collection/overdue-invoices',
    paymentsTopVendorsAmount: 'analytics/payments/top-vendors-amount',
    paymentsUpcomingPayablesBills: 'analytics/payments/upcoming-payables-bills',
    paymentsRecentlyPaymentsMade: 'analytics/payments/recently-payments-made',
    paymentsOverdueBills: 'analytics/payments/overdue-bills',
    salesOrdersRawMaterial: 'analytics/sales-orders/raw-material',
    salesOrdersItemRawMaterial: 'analytics/sales-orders/item/raw-material',
    generalSales: 'analytics/sales-orders/general-sales',
    generalSalesDetail: 'analytics/sales-orders/general-sales/:id',
    rejectionAnalytics: 'analytics/production/rejection',
    itemRejectionAnalytics: 'analytics/production/item-rejection',
    itemProcessAnalytics: 'analytics/production/item-process',
    monthlyProductionReport: 'analytics/production/monthly-report',
    stockSummary: 'analytics/stock/summary',
    build: {
      generalSalesDetail: id => (id ? `analytics/sales-orders/general-sales/${id}` : 'analytics/sales-orders/general-sales/:id'),
    },
  },
  itemBatches: {
    root: 'item-batches',
    detail: 'item-batches/:batchId',
    build: {
      detail: batchId => (batchId ? `item-batches/${batchId}` : 'item-batches/:batchId'),
    },
  },
  inventoryAdjustment: {
    root: 'inventory-adjustment',
    new: 'inventory-adjustment/new',
    detail: 'inventory-adjustment/:inventoryId',
    edit: 'inventory-adjustment/:inventoryId/edit',
    build: {
      detail: inventoryId => (inventoryId ? `inventory-adjustment/${inventoryId}` : 'inventory-adjustment/:inventoryId'),
      edit: inventoryId => (inventoryId ? `inventory-adjustment/${inventoryId}/edit` : 'inventory-adjustment/:inventoryId/edit'),
    },
  },
  support: {
    root: ROUTES.ADMIN.SUPPORT.LISTING,
    new: ROUTES.ADMIN.SUPPORT.CREATE,
    detail: ROUTES.ADMIN.SUPPORT.VIEW(),
    build: { detail: id => ROUTES.ADMIN.SUPPORT.VIEW(id) },
  },
};

const adminRoutes = ROUTES.ADMIN;

/**
 * `MODULE_NAMES` → list URL, built from each group’s `LISTING` in {@link ROUTES}.ADMIN.
 */
const MODULE_NAME_TO_LIST_PATH = {
  [MODULE_NAMES.BANK]: `/${adminRoutes.BANKS.LISTING}`,
  [MODULE_NAMES.ITEM]: `/${adminRoutes.ITEM_MASTER.LISTING}`,
  [MODULE_NAMES.WAREHOUSE]: `/${adminRoutes.WAREHOUSE_MASTER.LISTING}`,
  [MODULE_NAMES.QUALITY_MASTER]: `/${adminRoutes.QUALITY_MASTER.LISTING}`,
  [MODULE_NAMES.DIVISION]: `/${adminRoutes.DIVISION.LISTING}`,
  [MODULE_NAMES.BRANCH]: `/${adminRoutes.BRANCH.LISTING}`,
  [MODULE_NAMES.PRICE_LIST]: `/${adminRoutes.PRICE_LIST.LISTING}`,
  [MODULE_NAMES.ITEMGROUP]: `/${adminRoutes.ITEM_GROUP_MASTER}`,
  [MODULE_NAMES.PRODUCTION_MODULE]: `/${adminRoutes.PRODUCTION_ORDERS.LISTING}`,
  [MODULE_NAMES.CUSTOMER]: `/${adminRoutes.CUSTOMER_MASTER.LISTING}`,
  [MODULE_NAMES.CUSTOMER_ORDER]: `/${adminRoutes.CUSTOMER_ORDERS.LISTING}`,
  [MODULE_NAMES.SAMPLE_CATALOG]: `/${adminRoutes.SAMPLE_CATALOGS.LISTING}`,
  [MODULE_NAMES.QUOTATION]: `/${adminRoutes.QUOTES.LISTING}`,
  [MODULE_NAMES.SALES_ORDER]: `/${adminRoutes.SALES_ORDERS.LISTING}`,
  [MODULE_NAMES.DELIVERY_CHALLAN]: `/${adminRoutes.DELIVERY_CHALLANS.LISTING}`,
  [MODULE_NAMES.INVOICE]: `/${adminRoutes.INVOICES.LISTING}`,
  [MODULE_NAMES.PAYMENT_RECEIVED]: `/${adminRoutes.PAYMENTS_RECEIVED.LISTING}`,
  [MODULE_NAMES.RECURRING_INVOICE]: `/${adminRoutes.RECURRING_INVOICES.LISTING}`,
  [MODULE_NAMES.CREDIT_NOTE]: `/${adminRoutes.CREDIT_NOTES.LISTING}`,
  [MODULE_NAMES.VENDOR]: `/${adminRoutes.VENDORS.LISTING}`,
  [MODULE_NAMES.EXPENSE]: `/${adminRoutes.EXPENSES.LISTING}`,
  [MODULE_NAMES.RECURRING_EXPENSE]: `/${adminRoutes.RECURRING_EXPENSES.LISTING}`,
  [MODULE_NAMES.PURCHASE_ORDER]: `/${adminRoutes.PURCHASE_ORDERS.LISTING}`,
  [MODULE_NAMES.GRPO]: `/${adminRoutes.GRPO.LISTING}`,
  [MODULE_NAMES.BILL]: `/${adminRoutes.BILLS.LISTING}`,
  [MODULE_NAMES.PAYMENT_MADE]: `/${adminRoutes.PAYMENTS_MADE.LISTING}`,
  [MODULE_NAMES.RECURRING_BILL]: `/${adminRoutes.RECURRING_BILLS.LISTING}`,
  [MODULE_NAMES.DEBIT_NOTE]: `/${adminRoutes.DEBIT_NOTES.LISTING}`,
  [MODULE_NAMES.MANUAL_JOURNAL]: `/${adminRoutes.MANUAL_JOURNAL.LISTING}`,
  [MODULE_NAMES.INVENTORY_TRANSFER]: `/${adminRoutes.INVENTORY_TRANSFER_REQUEST.LISTING}`,
  [MODULE_NAMES.VIEW_INVENTORY]: `/${adminRoutes.VIEW_INVENTORY.LISTING}`,
  [MODULE_NAMES.INVENTORY_ADJUSTMENT]: `/${ADMIN_ROUTE_PATHS.inventoryAdjustment.root}`,
  [MODULE_NAMES.ITEM_BATCH]: `/${ADMIN_ROUTE_PATHS.itemBatches.root}`,
  [MODULE_NAMES.REJECTION_ORDER]: `/${adminRoutes.REJECTIONS.LISTING}`,
};

/** List URL for a module `docType` (e.g. not-found “back to list”). */
export const getModuleListPath = docType => (docType && MODULE_NAME_TO_LIST_PATH[docType]) || '/';
