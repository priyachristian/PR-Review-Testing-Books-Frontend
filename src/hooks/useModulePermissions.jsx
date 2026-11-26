import { useSelector } from 'react-redux';

// Hooks
import { useAuth } from './useAuth';
import { useBranch } from '@/features/allMaster/branch';
import { useWarehouse } from '@/features/allMaster/warehouse';
import { useItemMaster } from '@/features/allMaster/item';
import { useCustomer } from '@/features/sales/customer/useCustomer';

// Extras
import { RESOURCES } from '@/utils/jsonFile';
import { COMPANY_FEATURE } from 'utils/constants';

const SPLIT_WISE_MODULES = new Set([
  RESOURCES.DELIVERY_CHALLANS,
  RESOURCES.INVOICES,
  RESOURCES.PAYMENT_RECEIVED,
  RESOURCES.CREDIT_NOTES,
  RESOURCES.GRPO,
  RESOURCES.BILLS,
  RESOURCES.PAYMENT_MADE,
  RESOURCES.DEBIT_NOTE,
  RESOURCES.CUSTOMER_MASTER,
  RESOURCES.ANALYTICS,
  RESOURCES.REPORTS,
  RESOURCES.REPORT_PERMISSIONS.GENERAL_LEDGER,
  RESOURCES.REPORT_PERMISSIONS.ITEM_LEDGER,
  RESOURCES.REPORT_PERMISSIONS.BANK_LEDGER,
  RESOURCES.REPORT_PERMISSIONS.SALES_LEDGER,
  RESOURCES.REPORT_PERMISSIONS.PURCHASE_LEDGER,
  RESOURCES.REPORT_PERMISSIONS.CREDITORS_LEDGER,
  RESOURCES.REPORT_PERMISSIONS.DEBTORS_LEDGER,
  RESOURCES.REPORT_PERMISSIONS.GROSS_PROFIT,
  RESOURCES.REPORT_PERMISSIONS.CUSTOMER_AGING_REPORT,
  RESOURCES.REPORT_PERMISSIONS.VENDOR_AGING_REPORT,
  RESOURCES.REPORT_PERMISSIONS.RECEIVABLES_PAYABLES,
]);

const SIGNIN_MODULES = new Set([RESOURCES.DELIVERY_CHALLANS, RESOURCES.GRPO]);

const useModulePermissions = moduleName => {
  const { signin, isViewOnly } = useAuth();
  const { divDrop, droploading: divisionLoading, getDivDropDown, getAllBranchDropDown, loading: allBranchLoading, allBranchDrop } = useBranch();
  const { branchDrop, droploading: branchLoading, getBranchDropDown } = useWarehouse();
  const { warehouseDrop, droploading: warehouseLoading, getWarehouseDrop, allItemDrop, allItemDropLoading, getAllItemDrop } = useItemMaster();
  const { customerAddress, getCustomerAddress, resetCustomerAddress, addressLoading } = useCustomer();
  const isSplitSessionActive = useSelector(state => state.common.isSplitSessionActive);
  const accessRoles = useSelector(state => state.user?.accessRoles);
  const isSplitWise = signin?.company?.companyFeatures?.includes(COMPANY_FEATURE?.ENABLESPLITBYQTYORPRICE);

  const getAccess = (name, subName = null) => {
    const DEFAULT = { view: false, create: false, edit: false, delete: false };
    let raw;
    if (subName) {
      raw = name === subName ? accessRoles?.[subName] : accessRoles?.[name]?.[subName];
    } else {
      raw = accessRoles?.permissions?.[name] || accessRoles?.[name];
    }
    const p = raw || DEFAULT;
    return {
      ...p,
      canView: p.view || false,
      canCreate: p.create || false,
      canEdit: p.edit || false,
      canDelete: p.delete || false,
      hasPermission: permission => p[permission] || false,
    };
  };

  const modules = {
    [RESOURCES.QUOTES]: {
      useModuleQuotes: getAccess(RESOURCES.QUOTES),
      useModuleSalesOrder: getAccess(RESOURCES.SALES_ORDER),
      useModuleInvoice: getAccess(RESOURCES.INVOICES),
    },
    [RESOURCES.SALES_ORDER]: {
      useModuleSalesOrder: getAccess(RESOURCES.SALES_ORDER),
      useModuleDeliveryChallan: getAccess(RESOURCES.DELIVERY_CHALLANS),
      useModuleInvoice: getAccess(RESOURCES.INVOICES),
    },
    [RESOURCES.DELIVERY_CHALLANS]: {
      useModuleDelivery: getAccess(RESOURCES.DELIVERY_CHALLANS),
      useModuleInvoice: getAccess(RESOURCES.INVOICES),
    },
    [RESOURCES.INVOICES]: {
      useModuleInvoice: getAccess(RESOURCES.INVOICES),
    },
    [RESOURCES.PAYMENT_RECEIVED]: {
      useModulePaymentReceived: getAccess(RESOURCES.PAYMENT_RECEIVED),
      useModuleCustomerPayment: getAccess(RESOURCES.CUSTOMER_PAYMENT),
    },
    [RESOURCES.RECURRING_INVOICE]: {
      useModuleRecurringInvoice: getAccess(RESOURCES.RECURRING_INVOICE),
    },
    [RESOURCES.CREDIT_NOTES]: {
      useModuleCreditNote: getAccess(RESOURCES.CREDIT_NOTES),
    },
    [RESOURCES.EXPENSES]: {
      useModuleExpenses: getAccess(RESOURCES.EXPENSES),
    },
    [RESOURCES.RECURRING_EXPENSES]: {
      useModuleRecurringExpenses: getAccess(RESOURCES.RECURRING_EXPENSES),
    },
    [RESOURCES.PURCHASE_ORDER]: {
      useModulePurchaseOrder: getAccess(RESOURCES.PURCHASE_ORDER),
      useModuleGrpo: getAccess(RESOURCES.GRPO),
      useModuleBills: getAccess(RESOURCES.BILLS),
    },
    [RESOURCES.GRPO]: {
      useModuleGrpo: getAccess(RESOURCES.GRPO),
      useModuleBills: getAccess(RESOURCES.BILLS),
    },
    [RESOURCES.BILLS]: {
      useModuleBills: getAccess(RESOURCES.BILLS),
    },
    [RESOURCES.PAYMENT_MADE]: {
      useModulePaymentMade: getAccess(RESOURCES.PAYMENT_MADE),
    },
    [RESOURCES.RECURRING_BILLS]: {
      useModuleRecurringBills: getAccess(RESOURCES.RECURRING_BILLS),
    },
    [RESOURCES.DEBIT_NOTE]: {
      useModuleDebitNotes: getAccess(RESOURCES.DEBIT_NOTE),
    },
    [RESOURCES.BANK]: {
      useModuleBank: getAccess(RESOURCES.BANK),
    },
    [RESOURCES.CUSTOMER_MASTER]: {
      useModuleCustomerMaster: getAccess(RESOURCES.CUSTOMER_MASTER),
      useModuleVendor: getAccess(RESOURCES.VENDORS),
    },
    [RESOURCES.ITEM_MASTER]: {
      useModuleItem: getAccess(RESOURCES.ITEM_MASTER),
    },
    [RESOURCES.ROLES]: {
      useModuleRoles: getAccess(RESOURCES.ROLES),
    },
    [RESOURCES.QUALITY_MASTER]: {
      useModuleQuality: getAccess(RESOURCES.QUALITY_MASTER),
    },
    [RESOURCES.DIVISION]: {
      useModuleDivision: getAccess(RESOURCES.DIVISION),
    },
    [RESOURCES.BRANCH]: {
      useModuleBranch: getAccess(RESOURCES.BRANCH),
    },
    [RESOURCES.WAREHOUSE_MASTER]: {
      useModuleWarehouse: getAccess(RESOURCES.WAREHOUSE_MASTER),
    },
    [RESOURCES.PROCESS]: {
      useModuleProcess: getAccess(RESOURCES.PROCESS),
    },
    [RESOURCES.RECIPE]: {
      useModuleRecipe: getAccess(RESOURCES.RECIPE),
    },
    [RESOURCES.PRICE_LIST]: {
      useModulePriceList: getAccess(RESOURCES.PRICE_LIST),
    },
    [RESOURCES.ACCOUNTANT]: {
      useModuleAccountant: getAccess(RESOURCES.ACCOUNTANT),
    },
    [RESOURCES.PRODUCTION]: {
      useModuleProduction: getAccess(RESOURCES.PRODUCTION),
      useModuleInventoryLogs: getAccess(RESOURCES.ADD_INVENTORY),
    },
    [RESOURCES.INVENTORY_TRANSFER_REQUEST]: {
      useModuleInventoryTransferRequest: getAccess(RESOURCES.INVENTORY_TRANSFER_REQUEST),
    },
    [RESOURCES.ADD_INVENTORY]: {
      useModuleInventoryLogs: getAccess(RESOURCES.ADD_INVENTORY),
    },
    [RESOURCES.REPORTS]: {
      useModuleReports: getAccess(RESOURCES.REPORTS),
    },
    [RESOURCES.REPORT_PERMISSIONS.GENERAL_LEDGER]: {
      useModuleGeneralLedger: getAccess(RESOURCES.REPORT_PERMISSIONS.parentKey, RESOURCES.REPORT_PERMISSIONS.GENERAL_LEDGER),
    },
    [RESOURCES.REPORT_PERMISSIONS.ITEM_LEDGER]: {
      useModuleItemLedger: getAccess(RESOURCES.REPORT_PERMISSIONS.parentKey, RESOURCES.REPORT_PERMISSIONS.ITEM_LEDGER),
    },
    [RESOURCES.REPORT_PERMISSIONS.BANK_LEDGER]: {
      useModuleBankLedger: getAccess(RESOURCES.REPORT_PERMISSIONS.parentKey, RESOURCES.REPORT_PERMISSIONS.BANK_LEDGER),
    },
    [RESOURCES.REPORT_PERMISSIONS.SALES_LEDGER]: {
      useModuleSalesLedger: getAccess(RESOURCES.REPORT_PERMISSIONS.parentKey, RESOURCES.REPORT_PERMISSIONS.SALES_LEDGER),
    },
    [RESOURCES.REPORT_PERMISSIONS.PURCHASE_LEDGER]: {
      useModulePurchaseLedger: getAccess(RESOURCES.REPORT_PERMISSIONS.parentKey, RESOURCES.REPORT_PERMISSIONS.PURCHASE_LEDGER),
    },
    [RESOURCES.REPORT_PERMISSIONS.CREDITORS_LEDGER]: {
      useModuleCreditorsLedger: getAccess(RESOURCES.REPORT_PERMISSIONS.parentKey, RESOURCES.REPORT_PERMISSIONS.CREDITORS_LEDGER),
    },
    [RESOURCES.REPORT_PERMISSIONS.DEBTORS_LEDGER]: {
      useModuleDebtorsLedger: getAccess(RESOURCES.REPORT_PERMISSIONS.parentKey, RESOURCES.REPORT_PERMISSIONS.DEBTORS_LEDGER),
    },
    [RESOURCES.REPORT_PERMISSIONS.GROSS_PROFIT]: {
      useModuleGrossProfit: getAccess(RESOURCES.REPORT_PERMISSIONS.parentKey, RESOURCES.REPORT_PERMISSIONS.GROSS_PROFIT),
    },
    [RESOURCES.REPORT_PERMISSIONS.CUSTOMER_AGING_REPORT]: {
      useModuleCustomerAgingReport: getAccess(RESOURCES.REPORT_PERMISSIONS.parentKey, RESOURCES.REPORT_PERMISSIONS.CUSTOMER_AGING_REPORT),
    },
    [RESOURCES.REPORT_PERMISSIONS.VENDOR_AGING_REPORT]: {
      useModuleVendorAgingReport: getAccess(RESOURCES.REPORT_PERMISSIONS.parentKey, RESOURCES.REPORT_PERMISSIONS.VENDOR_AGING_REPORT),
    },
    [RESOURCES.REPORT_PERMISSIONS.RECEIVABLES_PAYABLES]: {
      useModuleReceivablesPayables: getAccess(RESOURCES.REPORT_PERMISSIONS.parentKey, RESOURCES.REPORT_PERMISSIONS.RECEIVABLES_PAYABLES),
    },
    [RESOURCES.ACCOUNT_LEDGER]: {
      useModuleAccountLedger: getAccess(RESOURCES.ACCOUNT_LEDGER),
    },
    [RESOURCES.MANUAL_JOURNALS]: {
      useModuleManualJournals: getAccess(RESOURCES.MANUAL_JOURNALS),
    },
    [RESOURCES.ADD_PRODUCTION]: {
      useAddProduction: getAccess(RESOURCES.ADD_PRODUCTION),
    },
    [RESOURCES.BANK_TRANSFER_LOGS]: {
      useBankTransferLogs: getAccess(RESOURCES.BANK_TRANSFER_LOGS),
    },
    [RESOURCES.ITEM_GROUP_MASTER]: {
      useItemGroupMaster: getAccess(RESOURCES.ITEM_GROUP_MASTER),
    },
    [RESOURCES.SALES_ORDER_TAG_MASTER]: {
      useSalesOrderTagMaster: getAccess(RESOURCES.SALES_ORDER_TAG_MASTER),
    },
    [RESOURCES.MAN_POWER_MASTER]: {
      useManPowerMaster: getAccess(RESOURCES.MAN_POWER_MASTER),
    },
    [RESOURCES.INVENTORY_ADJUSTMENT]: {
      useInventoryAdjustmentPermission: getAccess(RESOURCES.INVENTORY_ADJUSTMENT),
    },
    [RESOURCES.SUPPORT]: {
      useSupport: getAccess(RESOURCES.SUPPORT),
    },
    [RESOURCES.CUSTOMER_ORDER]: {
      useModuleCustomerOrder: getAccess(RESOURCES.CUSTOMER_ORDER),
      useModuleSalesOrder: getAccess(RESOURCES.SALES_ORDER),
    },
    [RESOURCES.SAMPLE_CATALOG]: {
      useModuleSampleCatalog: getAccess(RESOURCES.SAMPLE_CATALOG),
    },
    [RESOURCES.CUSTOMER_PAYMENT]: {
      useModuleCustomerPayment: getAccess(RESOURCES.CUSTOMER_PAYMENT),
      useModulePaymentReceived: getAccess(RESOURCES.PAYMENT_RECEIVED),
      useModuleInvoice: getAccess(RESOURCES.INVOICES),
    },
    [RESOURCES.OTHER_SETTINGS.additionalChargesConfig]: {
      useAdditionalChargesConfig: getAccess(RESOURCES.OTHER_SETTINGS.parentKey, RESOURCES.OTHER_SETTINGS.additionalChargesConfig),
    },
    [RESOURCES.OTHER_SETTINGS.defaultOrganizationConfig]: {
      useDefaultOrganizationConfig: getAccess(RESOURCES.OTHER_SETTINGS.parentKey, RESOURCES.OTHER_SETTINGS.defaultOrganizationConfig),
    },
    [RESOURCES.OTHER_SETTINGS.discountConfig]: {
      useDiscountConfig: getAccess(RESOURCES.OTHER_SETTINGS.parentKey, RESOURCES.OTHER_SETTINGS.discountConfig),
    },
    [RESOURCES.OTHER_SETTINGS.splitConfig]: {
      useSplitConfig: getAccess(RESOURCES.OTHER_SETTINGS.splitConfig),
    },
    [RESOURCES.OTHER_SETTINGS.incentive]: {
      useIncentiveConfig: getAccess(RESOURCES.OTHER_SETTINGS.parentKey, RESOURCES.OTHER_SETTINGS.incentive),
    },
    [RESOURCES.OTHER_SETTINGS.paymentTerms]: {
      usePaymentTerms: getAccess(RESOURCES.OTHER_SETTINGS.parentKey, RESOURCES.OTHER_SETTINGS.paymentTerms),
    },
    [RESOURCES.OTHER_SETTINGS.itemUnit]: {
      useItemUnits: getAccess(RESOURCES.OTHER_SETTINGS.parentKey, RESOURCES.OTHER_SETTINGS.itemUnit),
    },
    [RESOURCES.OTHER_SETTINGS.productionWarehouseConfig]: {
      useProductionWarehouseConfig: getAccess(RESOURCES.OTHER_SETTINGS.parentKey, RESOURCES.OTHER_SETTINGS.productionWarehouseConfig),
    },
    [RESOURCES.OTHER_SETTINGS.directTaxes]: {
      useDirectTaxes: getAccess(RESOURCES.OTHER_SETTINGS.parentKey, RESOURCES.OTHER_SETTINGS.directTaxes),
    },
    [RESOURCES.INVENTORY_CONFIG]: {
      useInventoryConfig: getAccess(RESOURCES.INVENTORY_CONFIG, RESOURCES.INVENTORY_CONFIG),
    },
    [RESOURCES.ANALYTICS_PERMISSIONS.ITEM_ANALYTICS]: {
      useModuleItemAnalytics: getAccess(RESOURCES.ANALYTICS_PERMISSIONS.parentKey, RESOURCES.ANALYTICS_PERMISSIONS.ITEM_ANALYTICS),
    },
    [RESOURCES.ANALYTICS_PERMISSIONS.GROUP_ITEM_ANALYTICS]: {
      useModuleGroupItemAnalytics: getAccess(RESOURCES.ANALYTICS_PERMISSIONS.parentKey, RESOURCES.ANALYTICS_PERMISSIONS.GROUP_ITEM_ANALYTICS),
    },
    [RESOURCES.ANALYTICS_PERMISSIONS.SALES_ORDERS_ANALYTICS]: {
      useModuleSalesOrdersAnalytics: getAccess(RESOURCES.ANALYTICS_PERMISSIONS.parentKey, RESOURCES.ANALYTICS_PERMISSIONS.SALES_ORDERS_ANALYTICS),
    },
    [RESOURCES.ANALYTICS_PERMISSIONS.CUSTOMER_WISE_SALES_ORDERS_ANALYTICS]: {
      useModuleCustomerWiseSalesOrdersAnalytics: getAccess(RESOURCES.ANALYTICS_PERMISSIONS.parentKey, RESOURCES.ANALYTICS_PERMISSIONS.CUSTOMER_WISE_SALES_ORDERS_ANALYTICS),
    },
    [RESOURCES.ANALYTICS_PERMISSIONS.ITEM_WISE_SALES_ORDERS_ANALYTICS]: {
      useModuleItemWiseSalesOrdersAnalytics: getAccess(RESOURCES.ANALYTICS_PERMISSIONS.parentKey, RESOURCES.ANALYTICS_PERMISSIONS.ITEM_WISE_SALES_ORDERS_ANALYTICS),
    },
    [RESOURCES.ANALYTICS_PERMISSIONS.NEW_VS_OLD_CUSTOMER_REPORT]: {
      useModuleNewVsOldCustomerReport: getAccess(RESOURCES.ANALYTICS_PERMISSIONS.parentKey, RESOURCES.ANALYTICS_PERMISSIONS.NEW_VS_OLD_CUSTOMER_REPORT),
    },
    [RESOURCES.ANALYTICS_PERMISSIONS.TOP_CUSTOMERS_OF_SALES]: {
      useModuleTopCustomersOfSales: getAccess(RESOURCES.ANALYTICS_PERMISSIONS.parentKey, RESOURCES.ANALYTICS_PERMISSIONS.TOP_CUSTOMERS_OF_SALES),
    },
    [RESOURCES.ANALYTICS_PERMISSIONS.CUSTOMER_WISE_BUSINESS_PERFORMANCE]: {
      useModuleCustomerWiseBusinessPerformance: getAccess(RESOURCES.ANALYTICS_PERMISSIONS.parentKey, RESOURCES.ANALYTICS_PERMISSIONS.CUSTOMER_WISE_BUSINESS_PERFORMANCE),
    },
    [RESOURCES.ANALYTICS_PERMISSIONS.TOP_ITEMS_OF_SALES]: {
      useModuleTopItemsOfSales: getAccess(RESOURCES.ANALYTICS_PERMISSIONS.parentKey, RESOURCES.ANALYTICS_PERMISSIONS.TOP_ITEMS_OF_SALES),
    },
    [RESOURCES.ANALYTICS_PERMISSIONS.CUSTOMER_ONE_INVOICE]: {
      useModuleCustomerOneInvoice: getAccess(RESOURCES.ANALYTICS_PERMISSIONS.parentKey, RESOURCES.ANALYTICS_PERMISSIONS.CUSTOMER_ONE_INVOICE),
    },
    [RESOURCES.ANALYTICS_PERMISSIONS.TOP_VENDORS_BY_AMOUNT_PURCHASE]: {
      useModuleTopVendorsByAmountPurchase: getAccess(RESOURCES.ANALYTICS_PERMISSIONS.parentKey, RESOURCES.ANALYTICS_PERMISSIONS.TOP_VENDORS_BY_AMOUNT_PURCHASE),
    },
    [RESOURCES.ANALYTICS_PERMISSIONS.VENDORS_BY_PURCHASE]: {
      useModuleVendorsByPurchase: getAccess(RESOURCES.ANALYTICS_PERMISSIONS.parentKey, RESOURCES.ANALYTICS_PERMISSIONS.VENDORS_BY_PURCHASE),
    },
    [RESOURCES.ANALYTICS_PERMISSIONS.TOP_ITEM_OF_PURCHASE]: {
      useModuleTopItemOfPurchase: getAccess(RESOURCES.ANALYTICS_PERMISSIONS.parentKey, RESOURCES.ANALYTICS_PERMISSIONS.TOP_ITEM_OF_PURCHASE),
    },
    [RESOURCES.ANALYTICS_PERMISSIONS.TOP_CUSTOMER_BY_AMOUNT_COLLECTION]: {
      useModuleTopCustomerByAmountCollection: getAccess(RESOURCES.ANALYTICS_PERMISSIONS.parentKey, RESOURCES.ANALYTICS_PERMISSIONS.TOP_CUSTOMER_BY_AMOUNT_COLLECTION),
    },
    [RESOURCES.ANALYTICS_PERMISSIONS.UPCOMING_RECEIVABLES_INVOICE]: {
      useModuleUpcomingReceivablesInvoice: getAccess(RESOURCES.ANALYTICS_PERMISSIONS.parentKey, RESOURCES.ANALYTICS_PERMISSIONS.UPCOMING_RECEIVABLES_INVOICE),
    },
    [RESOURCES.ANALYTICS_PERMISSIONS.RECENTLY_RECEIVED_PAYMENTS]: {
      useModuleRecentlyReceivedPayments: getAccess(RESOURCES.ANALYTICS_PERMISSIONS.parentKey, RESOURCES.ANALYTICS_PERMISSIONS.RECENTLY_RECEIVED_PAYMENTS),
    },
    [RESOURCES.ANALYTICS_PERMISSIONS.OVERDUE_INVOICES]: {
      useModuleOverdueInvoices: getAccess(RESOURCES.ANALYTICS_PERMISSIONS.parentKey, RESOURCES.ANALYTICS_PERMISSIONS.OVERDUE_INVOICES),
    },
    [RESOURCES.ANALYTICS_PERMISSIONS.TOP_VENDORS_BY_AMOUNT_PAYMENTS]: {
      useModuleTopVendorsByAmountPayments: getAccess(RESOURCES.ANALYTICS_PERMISSIONS.parentKey, RESOURCES.ANALYTICS_PERMISSIONS.TOP_VENDORS_BY_AMOUNT_PAYMENTS),
    },
    [RESOURCES.ANALYTICS_PERMISSIONS.UPCOMING_PAYABLES_BILLS]: {
      useModuleUpcomingPayablesBills: getAccess(RESOURCES.ANALYTICS_PERMISSIONS.parentKey, RESOURCES.ANALYTICS_PERMISSIONS.UPCOMING_PAYABLES_BILLS),
    },
    [RESOURCES.ANALYTICS_PERMISSIONS.RECENTLY_PAYMENTS_MADE]: {
      useModuleRecentlyPaymentsMade: getAccess(RESOURCES.ANALYTICS_PERMISSIONS.parentKey, RESOURCES.ANALYTICS_PERMISSIONS.RECENTLY_PAYMENTS_MADE),
    },
    [RESOURCES.ANALYTICS_PERMISSIONS.OVERDUE_BILLS]: {
      useModuleOverdueBills: getAccess(RESOURCES.ANALYTICS_PERMISSIONS.parentKey, RESOURCES.ANALYTICS_PERMISSIONS.OVERDUE_BILLS),
    },
    [RESOURCES.ANALYTICS_PERMISSIONS.GENERAL_SALES_ANALYTICS]: {
      useModuleGeneralSalesAnalytics: getAccess(RESOURCES.ANALYTICS_PERMISSIONS.parentKey, RESOURCES.ANALYTICS_PERMISSIONS.GENERAL_SALES_ANALYTICS),
    },
    [RESOURCES.ANALYTICS_PERMISSIONS.RM_ANALYTICS]: {
      useModuleRmAnalytics: getAccess(RESOURCES.ANALYTICS_PERMISSIONS.parentKey, RESOURCES.ANALYTICS_PERMISSIONS.RM_ANALYTICS),
    },
    [RESOURCES.ANALYTICS_PERMISSIONS.ITEM_WISE_RM_ANALYTICS]: {
      useModuleItemWiseRmAnalytics: getAccess(RESOURCES.ANALYTICS_PERMISSIONS.parentKey, RESOURCES.ANALYTICS_PERMISSIONS.ITEM_WISE_RM_ANALYTICS),
    },
    [RESOURCES.ANALYTICS_PERMISSIONS.SO_WISE_RM_ANALYTICS]: {
      useModuleSoWiseRmAnalytics: getAccess(RESOURCES.ANALYTICS_PERMISSIONS.parentKey, RESOURCES.ANALYTICS_PERMISSIONS.SO_WISE_RM_ANALYTICS),
    },
    [RESOURCES.ANALYTICS_PERMISSIONS.REJECTION_ANALYTICS]: {
      useModuleRejectionAnalytics: getAccess(RESOURCES.ANALYTICS_PERMISSIONS.parentKey, RESOURCES.ANALYTICS_PERMISSIONS.REJECTION_ANALYTICS),
    },
    [RESOURCES.ANALYTICS_PERMISSIONS.ITEM_REJECTION_ANALYTICS]: {
      useModuleItemRejectionAnalytics: getAccess(RESOURCES.ANALYTICS_PERMISSIONS.parentKey, RESOURCES.ANALYTICS_PERMISSIONS.ITEM_REJECTION_ANALYTICS),
    },
    [RESOURCES.ANALYTICS_PERMISSIONS.ITEM_PROCESS_ANALYTICS]: {
      useModuleItemProcessAnalytics: getAccess(RESOURCES.ANALYTICS_PERMISSIONS.parentKey, RESOURCES.ANALYTICS_PERMISSIONS.ITEM_PROCESS_ANALYTICS),
    },
    [RESOURCES.ANALYTICS_PERMISSIONS.MONTHLY_PRODUCTION_REPORT]: {
      useModuleMonthlyProductionReport: getAccess(RESOURCES.ANALYTICS_PERMISSIONS.parentKey, RESOURCES.ANALYTICS_PERMISSIONS.MONTHLY_PRODUCTION_REPORT),
    },
    [RESOURCES.ANALYTICS_PERMISSIONS.STOCK_SUMMARY]: {
      useModuleStockSummary: getAccess(RESOURCES.ANALYTICS_PERMISSIONS.parentKey, RESOURCES.ANALYTICS_PERMISSIONS.STOCK_SUMMARY),
    },
    [RESOURCES.REJECTION_ORDERS]: {
      useModuleRejectionOrders: getAccess(RESOURCES.REJECTION_ORDERS),
    },
    [RESOURCES.PROBLEM_LIST]: {
      useModuleProblemList: getAccess(RESOURCES.PROBLEM_LIST),
    },
    [RESOURCES.COMPLAINT]: {
      useModuleComplaint: getAccess(RESOURCES.COMPLAINT),
    },
    [RESOURCES.SPARE_PART]: {
      useModuleSparePart: getAccess(RESOURCES.SPARE_PART),
    },
    [RESOURCES.MACHINE]: {
      useModuleMachine: getAccess(RESOURCES.MACHINE),
    },
    [RESOURCES.MAINTENANCE_REQUEST]: {
      useModuleMaintenanceRequest: getAccess(RESOURCES.MAINTENANCE_REQUEST),
    },
    [RESOURCES.MAINTENANCE_PURCHASE]: {
      useModuleMaintenancePurchase: getAccess(RESOURCES.MAINTENANCE_PURCHASE),
    },
    [RESOURCES.PART_REQUEST]: {
      useModulePartRequest: getAccess(RESOURCES.PART_REQUEST),
    },
    [RESOURCES.SPARE_STOCK_LEDGER]: {
      useModuleSpareStockLedger: getAccess(RESOURCES.SPARE_STOCK_LEDGER),
    },
  };

  const returnData = {
    ...(modules[moduleName] || {}),
    ...(SPLIT_WISE_MODULES.has(moduleName) ? { isSplitWise } : {}),
    ...(SIGNIN_MODULES.has(moduleName) ? { signin } : {}),
  };

  return {
    ...returnData,
    divDrop,
    divisionLoading,
    getDivDropDown,
    branchDrop,
    branchLoading,
    getBranchDropDown,
    allBranchDrop,
    allBranchLoading,
    getAllBranchDropDown,
    warehouseDrop,
    warehouseLoading,
    getWarehouseDrop,
    allItemDrop,
    allItemDropLoading,
    getAllItemDrop,
    customerAddress,
    getCustomerAddress,
    resetCustomerAddress,
    addressLoading,
    isViewOnly,
    isSplitSessionActive,
  };
};

export default useModulePermissions;
