/**
 * Route to Filter Key Mapping Utility
 *
 * This file maps routes to their corresponding localStorage filter keys and column config keys.
 * When an error occurs on a specific route, this mapping is used to identify
 * and clear only that page's filters and column configs from localStorage.
 */

import { FILTERS_KEYS } from '@/utils/jsonFile';

/**
 * Maps route paths to their corresponding filter keys
 * Add new routes here as they are created
 */
export const ROUTE_FILTER_MAPPING = {
  // Sales Module
  '/quotes': FILTERS_KEYS.QUOTES_ALL_FILTERS,
  '/sales-orders': FILTERS_KEYS.SALES_ORDER_ALL_FILTER,
  '/delivery-challans': FILTERS_KEYS.DELIVERY_CHALLANS_ALL_FILTER,
  '/invoices': FILTERS_KEYS.INVOICES_ALL_FILTER,
  '/payments-received': FILTERS_KEYS.PAYMENTS_RECEIVED_ALL_FILTER,
  '/customer-payments': FILTERS_KEYS.CUSTOMER_PAYMENT_ALL_FILTERS,
  '/credit-notes': FILTERS_KEYS.CREDIT_NOTES_ALL_FILTER,
  '/recurring-invoices': FILTERS_KEYS.RECURRING_INVOICES_ALL_FILTER,

  // Purchase Module
  '/purchase-orders': FILTERS_KEYS.PURCHASE_ORDER_ALL_FILTER,
  '/grpo': FILTERS_KEYS.GRPO_ALL_FILTER,
  '/bills': FILTERS_KEYS.BILLS_ALL_FILTER,
  '/payments-made': FILTERS_KEYS.PAYMENTS_MADE_ALL_FILTER,
  '/debit-notes': FILTERS_KEYS.DEBIT_NOTES_ALL_FILTER,

  // Master Module
  '/item-master': FILTERS_KEYS.ITEMS_ALL_FILTERS,
  '/view-inventory': FILTERS_KEYS.VIEW_INVENTORY_ALL_FILTER,
  '/production-orders': FILTERS_KEYS.SUBMIT_PRODUCTION_ALL_FILTER,

  // Expenses
  '/expenses': FILTERS_KEYS.EXPENSES_ALL_FILTER,
  '/recurring-expenses': FILTERS_KEYS.RECURRING_EXPENSES_ALL_FILTER,
  '/recurring-bills': FILTERS_KEYS.RECURRING_BILLS_ALL_FILTER,

  // Maintenance
  '/maintenance-request': FILTERS_KEYS.MAINTENANCE_REQUEST_ALL_FILTERS,
  '/maintenance-purchase': FILTERS_KEYS.MAINTENANCE_PURCHASE_ALL_FILTERS,
  '/part-request': FILTERS_KEYS.PART_REQUEST_ALL_FILTERS,
  '/spare-stock-ledger': FILTERS_KEYS.SPARE_STOCK_LEDGER_ALL_FILTERS,
};

/**
 * Maps route paths to their corresponding column config keys
 * These are used to store table column visibility and ordering preferences
 */
export const ROUTE_COLUMN_CONFIG_MAPPING = {
  // Sales Module
  '/quotes': 'quoteConfig',
  '/sales-orders': 'salesOrderConfig',
  '/delivery-challans': 'deliveryChallansConfig',
  '/invoices': 'invoiceConfig',
  '/payments-received': 'paymentReceivedConfig',
  '/customer-payments': 'customerPaymentConfig',
  '/credit-notes': 'creditNotesConfig',
  '/recurring-invoices': 'recurringInvoiceConfig',

  // Purchase Module
  '/purchase-orders': 'purchaseOrderConfig',
  '/grpo': 'grpoConfig',
  '/bills': 'billConfig',
  '/payments-made': 'paymentMadeConfig',
  '/debit-notes': 'debitNoteConfig',
  '/expenses': 'expenseConfig',
  '/recurring-expenses': 'recurringExpenseConfig',
  '/recurring-bills': 'recurringBillConfig',

  // Master Module
  '/item-master': 'itemMasterConfig',
  '/customer-master': 'customerMasterConfig',
  '/view-inventory': 'itemInventoryConfig',
  '/production-orders': 'productionModuleConfig',
  '/spare-part': 'sparePartConfig',
  '/machine': 'machineConfig',
  '/maintenance-request': 'maintenanceRequestConfig',
  '/maintenance-purchase': 'maintenancePurchaseConfig',
  '/part-request': 'partRequestConfig',
  '/spare-stock-ledger': 'spareStockLedgerConfig',

  // Banking
  '/banks': 'bankConfig',

  // Others
  '/project': 'projectConfig',
};

/**
 * Get filter key for a given route path
 * @param {string} pathname - The current route pathname
 * @returns {string|null} - The filter key or null if not found
 */
export const getFilterKeyForRoute = pathname => {
  if (!pathname) return null;

  // Try exact match first
  if (ROUTE_FILTER_MAPPING[pathname]) {
    return ROUTE_FILTER_MAPPING[pathname];
  }

  // Try to match base route (in case of nested routes)
  // e.g., /sales-order/123 should match /sales-order
  for (const route in ROUTE_FILTER_MAPPING) {
    if (pathname.startsWith(route)) {
      return ROUTE_FILTER_MAPPING[route];
    }
  }

  return null;
};

/**
 * Get column config key for a given route path
 * @param {string} pathname - The current route pathname
 * @returns {string|null} - The column config key or null if not found
 */
export const getColumnConfigKeyForRoute = pathname => {
  if (!pathname) return null;

  // Try exact match first
  if (ROUTE_COLUMN_CONFIG_MAPPING[pathname]) {
    return ROUTE_COLUMN_CONFIG_MAPPING[pathname];
  }

  // Try to match base route (in case of nested routes)
  for (const route in ROUTE_COLUMN_CONFIG_MAPPING) {
    if (pathname.startsWith(route)) {
      return ROUTE_COLUMN_CONFIG_MAPPING[route];
    }
  }

  return null;
};

/**
 * Clear filters and column configs for a specific route
 * @param {string} pathname - The current route pathname
 * @returns {boolean} - True if anything was cleared, false otherwise
 */
export const clearFiltersForRoute = pathname => {
  try {
    let clearedSomething = false;

    // Clear filter data
    const filterKey = getFilterKeyForRoute(pathname);
    if (filterKey) {
      localStorage.removeItem(filterKey);
      localStorage.removeItem(`${filterKey}_locked`);
      clearedSomething = true;
    }

    // Clear column config data
    const columnConfigKey = getColumnConfigKeyForRoute(pathname);
    if (columnConfigKey) {
      localStorage.removeItem(columnConfigKey);
      clearedSomething = true;
    }

    return clearedSomething;
  } catch (error) {
    console.error(`Error clearing data for route ${pathname}:`, error);
    return false;
  }
};

/**
 * Get all filter keys and column config keys from localStorage
 * @returns {Object} - Object with filter keys and column config keys arrays
 */
export const getAllStoredConfigKeys = () => {
  try {
    const allKeys = Object.keys(localStorage);
    const filterKeys = Object.values(FILTERS_KEYS);
    const columnConfigKeys = Object.values(ROUTE_COLUMN_CONFIG_MAPPING);

    const storedFilterKeys = allKeys.filter(key => {
      // Check if it's a filter key or a locked state key
      return filterKeys.includes(key) || filterKeys.some(fk => key === `${fk}_locked`);
    });

    const storedColumnConfigKeys = allKeys.filter(key => {
      // Check if it's a column config key
      return columnConfigKeys.includes(key);
    });

    return {
      filterKeys: storedFilterKeys,
      columnConfigKeys: storedColumnConfigKeys,
      all: [...storedFilterKeys, ...storedColumnConfigKeys],
    };
  } catch (error) {
    console.error('Error getting stored config keys:', error);
    return { filterKeys: [], columnConfigKeys: [], all: [] };
  }
};

/**
 * @deprecated Use getAllStoredConfigKeys instead
 */
export const getAllStoredFilterKeys = () => {
  const result = getAllStoredConfigKeys();
  return result.filterKeys;
};

export default {
  ROUTE_FILTER_MAPPING,
  ROUTE_COLUMN_CONFIG_MAPPING,
  getFilterKeyForRoute,
  getColumnConfigKeyForRoute,
  clearFiltersForRoute,
  getAllStoredFilterKeys,
  getAllStoredConfigKeys,
};
