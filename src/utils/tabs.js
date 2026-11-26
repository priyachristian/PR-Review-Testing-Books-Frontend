export const CUSTOMER_DETAIL_TABS = {
  OVERVIEW: 'overview',
  ADDRESS: 'address',
  BRANCH: 'branch',
  BUSINESS_PARTNER_TEAM: 'business-partner-team',
  TRANSACTIONS: 'transactions',
  HISTORY: 'history',
  SALES_TRANSACTIONS: 'sales-transactions',
  PURCHASE_TRANSACTIONS: 'purchase-transactions',
};

export const resolveCustomerDetailTabFromUrl = tabParam => {
  if (!tabParam) return CUSTOMER_DETAIL_TABS.OVERVIEW;
  // legacy: Other Details was merged into Overview
  if (tabParam === 'other-details') return CUSTOMER_DETAIL_TABS.OVERVIEW;
  if (Object.values(CUSTOMER_DETAIL_TABS).includes(tabParam)) return tabParam;
  return CUSTOMER_DETAIL_TABS.OVERVIEW;
};

export const ADD_CUSTOMER_TABS = {
  OTHER_DETAILS: 'other-details',
  ADDRESS: 'address',
  BRANCH: 'branch',
  BUSINESS_PARTNER_TEAM: 'business-partner-team',
};

export const DEFAULT_ADD_CUSTOMER_TAB = ADD_CUSTOMER_TABS.OTHER_DETAILS;

export const ITEM_TABS = {
  PURCHASING_DATA: 'purchasing-data',
  SALES_DATA: 'sales-data',
  INVENTORY_DATA: 'inventory-data',
  PRODUCTION_DATA: 'production-data',
  ATTACHMENTS: 'attachments',
};

export const DEFAULT_ITEM_TAB = ITEM_TABS.PURCHASING_DATA;

export const GROSS_PROFIT_TABS = {
  CUSTOMER_WISE: 'customer-wise',
  ITEM_WISE: 'item-wise',
  CUSTOMER_MONTH_WISE: 'customer-month-wise',
};

export const DEFAULT_GROSS_PROFIT_TAB = GROSS_PROFIT_TABS.CUSTOMER_WISE;

export const resolveGrossProfitTabFromUrl = tabParam => {
  if (!tabParam) return DEFAULT_GROSS_PROFIT_TAB;
  if (Object.values(GROSS_PROFIT_TABS).includes(tabParam)) return tabParam;
  return DEFAULT_GROSS_PROFIT_TAB;
};
