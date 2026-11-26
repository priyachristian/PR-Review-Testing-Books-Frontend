import { combineReducers, configureStore } from '@reduxjs/toolkit';
import storage from 'redux-persist/lib/storage';
import persistReducer from 'redux-persist/es/persistReducer';
import persistStore from 'redux-persist/es/persistStore';
import authReducer from '../features/auth/authSlice';
import divisionReducer from '@/features/allMaster/division/division.slice';
import branchReducer from '@/features/allMaster/branch/branch.slice';
import warehouseReducer from '@/features/allMaster/warehouse/warehouse.slice';
import userReducer from '@/features/setting/user/user.slice';
import roleReducer from '@/features/setting/role/role.slice';
import moduleReducer from '../features/common/module/moduleSlice';
import processReducer from '@/features/allMaster/process/process.slice';
import recipeReducer from '@/features/allMaster/recipe/recipe.slice';
import customerMasterReducer from '@/features/sales/customer/customer.slice';
import qualityReducer from '@/features/allMaster/qualityMaster/quality.slice';
import itemMasterReducer from '@/features/allMaster/item/item.slice';
import itemGroupReducer from '@/features/allMaster/itemGroup/itemGroup.slice';
import subItemGroupReducer from '@/features/allMaster/subItemGroup/subItemGroup.slice';
import priceListReducer from '@/features/allMaster/priceList/priceList.slice';
import quoteReducer from '@/features/sales/quotes/quote.slice';
import customerOrderReducer from '@/features/sales/customerOrder/customerOrder.slice';
import customerPaymentReducer from '@/features/sales/customerPayment/customerPayment.slice';
import sampleCatalogReducer from '@/features/sales/sampleCatalog/sampleCatalog.slice';
import customerAppDashboardReducer from '@/features/customerApp/dashboard/customerAppDashboard.slice';
import bankingReducer from '@/features/banking/banks/bank.slice';
import salesOrderReducer from '@/features/sales/salesOrder/salesOrder.slice';
import deliveryChallanReducer from '@/features/sales/deliveryChallan/deliveryChallan.slice';
import rejectionOrderReducer from '@/features/rejections/bookRejections/rejectionOrder.slice';
import rejectionReasonReducer from '@/features/setting/rejectionReason/rejectionReason.slice';
import problemListReducer from '@/features/complaint/problemList/problemList.slice';
import complaintReducer from '@/features/complaint/bookComplaints/complaint.slice';
import sparePartReducer from '@/features/maintenance/sparePart/sparePart.slice';
import machineReducer from '@/features/maintenance/machine/machine.slice';
import maintenanceRequestReducer from '@/features/maintenance/maintenanceRequest/maintenanceRequest.slice';
import maintenancePurchaseReducer from '@/features/maintenance/maintenancePurchase/maintenancePurchase.slice';
import partRequestReducer from '@/features/maintenance/partRequest/partRequest.slice';
import spareStockLedgerReducer from '@/features/maintenance/spareStockLedger/spareStockLedger.slice';
import invoiceReducer from '@/features/sales/invoice/invoice.slice';
import paymentReceivedReducer from '@/features/sales/paymentsReceived/paymentReceived.slice';
import creditNotesReducer from '@/features/sales/creditNotes/creditNote.slice';
import recurringInvoiceReducer from '@/features/sales/recurringInvoices/recurringInvoice.slice';
import expensesReducer from '@/features/purchase/expenses/expense.slice';
import purchaseOrderReducer from '@/features/purchase/purchaseOrder/purchaseOrder.slice';
import billsReducer from '@/features/purchase/bills/bill.slice';
import accountReducer from '@/features/accountant/chartOfAccount/chartOfAccount.slice';
import debitNotesReducer from '@/features/purchase/debitNotes/debitNote.slice';
import recurringBillsReducer from '@/features/purchase/recurringBills/recurringBill.slice';
import recurringExpenseReducer from '@/features/purchase/recurringExpenses/recurringExpense.slice';
import paymentsMadeReducer from '@/features/purchase/paymentsMade/paymentMade.slice';
import profileReducer from '@/features/setting/profile/profile.slice';
import commonReducer from '../features/common/commonSlice';
import sidebarReducer from '../features/common/sidebar/sidebarSlice';
import productionOrderReducer from '../features/production/productionOrder/productionOrder.slice';
import grpoReducer from '@/features/purchase/grpo/grpo.slice';
import analyticsReducer from '@/features/analytics/analytics.slice';
import rejectionAnalyticsReducer from '@/features/analytics/rejectionAnalytics.slice';
import monthlyProductionReportReducer from '@/features/analytics/monthlyProductionReport.slice';
import stockSummaryReducer from '@/features/analytics/stockSummary.slice';
import reportReducer from '@/features/reports/report.slice';
import moduleConfigReducer from '../features/common/moduleConfig/moduleConfigSlice';
import quotationConfigReducer from '@/features/setting/quotationConfig/quotationConfig.slice';
import emailConfigReducer from '@/features/setting/emailConfig/emailConfig.slice';
import emailPreferencesReducer from '@/features/setting/emailPrefrences/emailPreferences.slice';
import whatsappConfigReducer from '@/features/setting/whatsappConfig/whatsappConfig.slice';
import currencyReducer from '@/features/setting/currency/currency.slice';
import paymentTermReducer from '@/features/setting/paymentTerm/paymentTerm.slice';
import itemUnitReducer from '@/features/setting/itemUnit/itemUnit.slice';
import productionWarehouseConfigReducer from '@/features/setting/productionWarehouseConfig/productionWarehouseConfig.slice';
import directTaxReducer from '@/features/setting/directTax/directTax.slice';
import setupChargeReducer from '@/features/setting/setupCharge/setupChargeSlice';
import manPowerConfigReducer from '@/features/allMaster/manPower/manPower.slice';
import salesOrderTagReducer from '@/features/allMaster/salesOrderTag/salesOrderTag.slice';
import incentiveSchemeReducer from '@/features/setting/incentiveScheme/incentiveScheme.slice';
import accountLedgerReducer from '@/features/accountant/accountLedger/accountLedger.slice';
import inventoryLogsReducer from '@/features/inventory/addInventory/addInventory.slice';
import manualJournalReducer from '@/features/accountant/manualJournal/manualJournal.slice';
import inventoryAdjustmentReducer from '@/features/inventory/inventoryAdjustment/inventoryAdjustment.slice';
import batchesReducer from '@/features/inventory/batches/batches.slice';
import viewInventoryReducer from '@/features/inventory/viewInventory/viewInventory.slice';
import gstr1Reducer from '@/features/reports/gstr1/gstr1Slice';
import dashboardReducer from '@/features/dashboard/dashboard.slice';
import onboardingReducer from '@/features/onboarding/onboarding.slice';
import salesDashboardReducer from '@/features/dashboard/salesDashboard/salesDashboardSlice';
import productionDashboardReducer from '@/features/dashboard/productionDashboard/productionDashboardSlice';
import supportReducer from '@/features/homeTab/support/support.slice';
import developmentUpdateReducer from '@/features/homeTab/developmentUpdate/developmentUpdate.slice';
import locationReducer from '@/features/common/location/location.slice';
import deviceReducer from '@/features/device/device.slice';
import notificationsReducer from '@/features/notifications/notification.slice';
import commentReducer from '@/features/common/comment/comment.slice';
import { RESET_FEATURE_BLOCKED_LOADERS } from '@/utils/routePermissions';

const appReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  role: roleReducer,
  module: moduleReducer,
  moduleConfig: moduleConfigReducer,
  quotationConfig: quotationConfigReducer,
  emailConfig: emailConfigReducer,
  emailPreferences: emailPreferencesReducer,
  whatsappConfig: whatsappConfigReducer,
  currency: currencyReducer,
  paymentTerm: paymentTermReducer,
  itemUnit: itemUnitReducer,
  productionWarehouseConfig: productionWarehouseConfigReducer,
  directTax: directTaxReducer,
  division: divisionReducer,
  branch: branchReducer,
  warehouse: warehouseReducer,
  process: processReducer,
  recipe: recipeReducer,
  customerMaster: customerMasterReducer,
  quality: qualityReducer,
  itemMaster: itemMasterReducer,
  itemGroup: itemGroupReducer,
  subItemGroup: subItemGroupReducer,
  priceList: priceListReducer,
  quote: quoteReducer,
  customerOrder: customerOrderReducer,
  customerPayment: customerPaymentReducer,
  sampleCatalog: sampleCatalogReducer,
  customerAppDashboard: customerAppDashboardReducer,
  bank: bankingReducer,
  salesOrder: salesOrderReducer,
  deliveryChallan: deliveryChallanReducer,
  rejectionOrder: rejectionOrderReducer,
  rejectionReason: rejectionReasonReducer,
  problemList: problemListReducer,
  complaint: complaintReducer,
  sparePart: sparePartReducer,
  machine: machineReducer,
  maintenanceRequest: maintenanceRequestReducer,
  maintenancePurchase: maintenancePurchaseReducer,
  partRequest: partRequestReducer,
  spareStockLedger: spareStockLedgerReducer,
  invoice: invoiceReducer,
  paymentReceived: paymentReceivedReducer,
  creditNotes: creditNotesReducer,
  recurringInvoice: recurringInvoiceReducer,
  expense: expensesReducer,
  purchaseOrder: purchaseOrderReducer,
  bills: billsReducer,
  account: accountReducer,
  debitNote: debitNotesReducer,
  recurringBills: recurringBillsReducer,
  recurringExpense: recurringExpenseReducer,
  paymentMade: paymentsMadeReducer,
  profile: profileReducer,
  common: commonReducer,
  sidebar: sidebarReducer,
  productionOrder: productionOrderReducer,
  grpo: grpoReducer,
  analytics: analyticsReducer,
  rejectionAnalytics: rejectionAnalyticsReducer,
  monthlyProductionReport: monthlyProductionReportReducer,
  stockSummary: stockSummaryReducer,
  report: reportReducer,
  setupcharge: setupChargeReducer,
  manPowerConfig: manPowerConfigReducer,
  salesOrderTag: salesOrderTagReducer,
  incentiveScheme: incentiveSchemeReducer,
  accountLedger: accountLedgerReducer,
  inventoryLogs: inventoryLogsReducer,
  manualJournal: manualJournalReducer,
  inventoryAdjustment: inventoryAdjustmentReducer,
  batches: batchesReducer,
  viewInventory: viewInventoryReducer,
  gstr1: gstr1Reducer,
  dashboard: dashboardReducer,
  onboarding: onboardingReducer,
  salesDashboard: salesDashboardReducer,
  productionDashboard: productionDashboardReducer,
  support: supportReducer,
  developmentUpdate: developmentUpdateReducer,
  location: locationReducer,
  device: deviceReducer,
  notifications: notificationsReducer,
  comment: commentReducer,
});

// Root reducer that can handle resetting all slices
const LOADER_STATE_KEYS = [
  'loading',
  'submitLoading',
  'submitWithStatusLoading',
  'uploading',
  'droploading',
  'pendingItemLoading',
  'moduleDataLoading',
  'approveLoading',
  'rejectLoading',
  'cancelLoading',
  'applyInvoiceLoading',
  'removeApplyInvoiceLoading',
  'autoApplyLoading',
  'inventoryConfigLoading',
  'branchConfigLoading',
  'sessionPinLoading',
  'discountConfigLoading',
  'logoUploading',
  'signUploading',
  'subscriptionDetailLoading',
  'creditLimitConfigLoading',
];

const rootReducer = (state, action) => {
  if (action.type === 'auth/logout') {
    // Reset all slices to initial state except auth (which will be handled by the auth slice itself)
    const { auth } = state;
    return appReducer({ auth }, action);
  }

  if (action.type === RESET_FEATURE_BLOCKED_LOADERS) {
    const targetSlices = Array.isArray(action.payload) ? action.payload : [];
    if (!targetSlices.length) {
      return appReducer(state, action);
    }

    const nextState = { ...state };
    targetSlices.forEach(sliceKey => {
      const sliceState = nextState[sliceKey];
      if (!sliceState || typeof sliceState !== 'object') return;

      const updatedSliceState = { ...sliceState };
      LOADER_STATE_KEYS.forEach(loaderKey => {
        if (Object.prototype.hasOwnProperty.call(updatedSliceState, loaderKey)) {
          updatedSliceState[loaderKey] = false;
        }
      });
      nextState[sliceKey] = updatedSliceState;
    });

    return nextState;
  }

  return appReducer(state, action);
};

const persistConfig = {
  key: 'auth',
  storage,
  whitelist: ['email', 'companyId', 'inviteData', 'signin'],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE', 'persist/REGISTER'],
      },
    }),
});

export const persistor = persistStore(store);
