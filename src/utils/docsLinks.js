/**
 * Maps the first URL path segment of each app route to its corresponding
 * documentation page path in the abss-informative docs site.
 *
 * The key is the first segment of `location.pathname` (e.g. "customer-master"
 * for "/customer-master" and "/customer-master/new").
 * The value is the path appended to VITE_DOCS_URL.
 */
export const DOCS_LINKS = {
  // ── Home ────────────────────────────────────────────────────────────────────
  home: '/documentation/books/home/dashboard',

  // ── All Masters ─────────────────────────────────────────────────────────────
  division: '/documentation/books/all-master/division',
  branch: '/documentation/books/all-master/branch',
  'man-power-master': '/documentation/books/all-master/manpower',
  'warehouse-master': '/documentation/books/all-master/warehouse-master',
  'price-list': '/documentation/books/all-master/price-list',
  process: '/documentation/books/all-master/process',
  recipe: '/documentation/books/all-master/recipe',
  'quality-master': '/documentation/books/all-master/quality-master',
  'item-master': '/documentation/books/all-master/item-master',
  'item-group-master': '/documentation/books/all-master/item-group',

  // ── Sales ───────────────────────────────────────────────────────────────────
  'customer-master': '/documentation/books/sales/customer-master',
  quotes: '/documentation/books/sales/quotes',
  'sales-orders': '/documentation/books/sales/sales-orders',
  'delivery-challans': '/documentation/books/sales/delivery-challans',
  invoices: '/documentation/books/sales/invoices',
  'payments-received': '/documentation/books/sales/payments-received',
  'recurring-invoices': '/documentation/books/sales/recurring-invoices',
  'credit-notes': '/documentation/books/sales/credit-notes',

  // ── Purchase ────────────────────────────────────────────────────────────────
  vendors: '/documentation/books/purchase/vendors',
  'purchase-orders': '/documentation/books/purchase/purchase-orders',
  bills: '/documentation/books/purchase/bills',
  'payments-made': '/documentation/books/purchase/payments-made',
  expenses: '/documentation/books/purchase/expenses',
  'recurring-expenses': '/documentation/books/purchase/recurring-expenses',
  'recurring-bills': '/documentation/books/purchase/recurring-bills',
  'debit-notes': '/documentation/books/purchase/debit-notes',
  grpo: '/documentation/books/purchase/grpo',

  // ── Inventory ───────────────────────────────────────────────────────────────
  'view-inventory': '/documentation/books/inventory/view-inventory',
  'inventory-transfer-request': '/documentation/books/inventory/inventory-transfer',
  'inventory-adjustment': '/documentation/books/inventory/inventory-adjustment',

  // ── Production ──────────────────────────────────────────────────────────────
  'production-orders': '/documentation/books/production/submit-production',

  // ── Banking ─────────────────────────────────────────────────────────────────
  banks: '/documentation/books/banking/banks',
  'bank-transfer-logs': '/documentation/books/banking/bank-transfer-logs',

  // ── Accountant ──────────────────────────────────────────────────────────────
  accountant: '/documentation/books/accountant/chart-of-accounts',
  'account-partner': '/documentation/books/accountant/account-ledger',
  'manual-journal': '/documentation/books/accountant/manual-journals',

  // ── Analytics & Reports ─────────────────────────────────────────────────────
  analytics: '/documentation/books/analytics/analytics-overview',
  reports: '/documentation/books/reports/reports-overview',

  // ── Support ─────────────────────────────────────────────────────────────────
  support: '/documentation/books/support/support',
};
