import { lazy } from 'react';
import { ADMIN_ROUTE_PATHS } from './adminRoutePaths';
const ViewDashboard = lazy(() => import('@/features/dashboard/pages/ViewDashboard'));
const RecentUpdates = lazy(() => import('@/features/homeTab/developmentUpdate/pages/RecentUpdates'));
const ViewDivisions = lazy(() => import('@/features/allMaster/division/pages/ViewDivisions'));
const AddDivision = lazy(() => import('@/features/allMaster/division/pages/AddDivision'));
const DivisionDetail = lazy(() => import('@/features/allMaster/division/pages/DivisionDetail'));
const ViewBranches = lazy(() => import('@/features/allMaster/branch/pages/ViewBranches'));
const AddBranch = lazy(() => import('@/features/allMaster/branch/pages/AddBranch'));
const BranchDetail = lazy(() => import('@/features/allMaster/branch/pages/BranchDetail'));
const ViewWarehouses = lazy(() => import('@/features/allMaster/warehouse/pages/ViewWarehouses'));
const AddWarehouse = lazy(() => import('@/features/allMaster/warehouse/pages/AddWarehouse'));
const WarehouseDetail = lazy(() => import('@/features/allMaster/warehouse/pages/WarehouseDetail'));
const ViewCustomers = lazy(() => import('@/features/sales/customer/pages/ViewCustomers'));
const AddCustomer = lazy(() => import('@/features/sales/customer/pages/AddCustomer'));
const Customer360View = lazy(() => import('@/features/sales/customer/pages/Customer360View'));
const ViewPriceLists = lazy(() => import('@/features/allMaster/priceList/pages/ViewPriceLists'));
const PriceListDetail = lazy(() => import('@/features/allMaster/priceList/pages/PriceListDetail'));
const AddPriceList = lazy(() => import('@/features/allMaster/priceList/pages/AddPriceList'));
const ViewProcesses = lazy(() => import('@/features/allMaster/process/pages/ViewProcesses'));
const ViewRecipes = lazy(() => import('@/features/allMaster/recipe/pages/ViewRecipes'));
const ViewQualities = lazy(() => import('@/features/allMaster/qualityMaster/pages/ViewQualities'));
const QualityDetail = lazy(() => import('@/features/allMaster/qualityMaster/pages/QualityDetail'));
const AddQuality = lazy(() => import('@/features/allMaster/qualityMaster/pages/AddQuality'));
const ViewItems = lazy(() => import('@/features/allMaster/item/pages/ViewItems'));
const AddItem = lazy(() => import('@/features/allMaster/item/pages/AddItem'));
const ViewQuotes = lazy(() => import('@/features/sales/quotes/pages/ViewQuotes'));
const AddQuote = lazy(() => import('@/features/sales/quotes/pages/AddQuote'));
const ViewCustomerOrders = lazy(() => import('@/features/sales/customerOrder/pages/ViewCustomerOrders'));
const CustomerOrderDetail = lazy(() => import('@/features/sales/customerOrder/pages/CustomerOrderDetail'));
const ViewCustomerPayments = lazy(() => import('@/features/sales/customerPayment/pages/ViewCustomerPayments'));
const CustomerPaymentDetail = lazy(() => import('@/features/sales/customerPayment/pages/CustomerPaymentDetail'));
const ViewSampleCatalogs = lazy(() => import('@/features/sales/sampleCatalog/pages/ViewSampleCatalogs'));
const AddSampleCatalog = lazy(() => import('@/features/sales/sampleCatalog/pages/AddSampleCatalog'));
const SampleCatalogDetail = lazy(() => import('@/features/sales/sampleCatalog/pages/SampleCatalogDetail'));
const CustomerAppDashboard = lazy(() => import('@/features/customerApp/dashboard/pages/CustomerAppDashboard'));
const ViewSalesOrders = lazy(() => import('@/features/sales/salesOrder/pages/ViewSalesOrders'));
const AddSalesOrder = lazy(() => import('@/features/sales/salesOrder/pages/AddSalesOrder'));
const ViewInvoices = lazy(() => import('@/features/sales/invoice/pages/ViewInvoices'));
const ViewBanks = lazy(() => import('@/features/banking/banks/pages/ViewBanks'));
const AddBank = lazy(() => import('@/features/banking/banks/pages/AddBank'));
const ViewDeliveryChallans = lazy(() => import('@/features/sales/deliveryChallan/pages/ViewDeliveryChallans'));
const AddDeliveryChallan = lazy(() => import('@/features/sales/deliveryChallan/pages/AddDeliveryChallan'));
const AddInvoice = lazy(() => import('@/features/sales/invoice/pages/AddInvoice'));
const ViewPaymentReceived = lazy(() => import('@/features/sales/paymentsReceived/pages/ViewPaymentReceived'));
const AddPaymentReceived = lazy(() => import('@/features/sales/paymentsReceived/pages/AddPaymentReceived'));
const ViewRecurringInvoices = lazy(() => import('@/features/sales/recurringInvoices/pages/ViewRecurringInvoice'));
const AddRecurringInvoice = lazy(() => import('@/features/sales/recurringInvoices/pages/AddRecurringInvoice'));
const RecurringInvoiceDetail = lazy(() => import('@/features/sales/recurringInvoices/pages/RecurringInvoiceDetail'));
const ViewCreditNotes = lazy(() => import('@/features/sales/creditNotes/pages/ViewCreditNotes'));
const AddCreditNote = lazy(() => import('@/features/sales/creditNotes/pages/AddCreditNote'));
const ViewExpenses = lazy(() => import('@/features/purchase/expenses/pages/ViewExpenses'));
const AddExpense = lazy(() => import('@/features/purchase/expenses/pages/AddExpense'));
const ViewRecurringExpenses = lazy(() => import('@/features/purchase/recurringExpenses/pages/ViewRecurringExpenses'));
const AddRecurringExpense = lazy(() => import('@/features/purchase/recurringExpenses/pages/AddRecurringExpense'));
const RecurringExpenseDetail = lazy(() => import('@/features/purchase/recurringExpenses/pages/RecurringExpenseDetail'));
const ViewPurchaseOrders = lazy(() => import('@/features/purchase/purchaseOrder/pages/ViewPurchaseOrders'));
const ViewBills = lazy(() => import('@/features/purchase/bills/pages/ViewBills'));
const AddBill = lazy(() => import('@/features/purchase/bills/pages/AddBill'));
const ViewPaymentMades = lazy(() => import('@/features/purchase/paymentsMade/pages/ViewPaymentMades'));
const AddPaymentMade = lazy(() => import('@/features/purchase/paymentsMade/pages/AddPaymentMade'));
const ViewRecurringBills = lazy(() => import('@/features/purchase/recurringBills/pages/ViewRecurringBills'));
const AddRecurringBill = lazy(() => import('@/features/purchase/recurringBills/pages/AddRecurringBill'));
const RecurringBillsDetail = lazy(() => import('@/features/purchase/recurringBills/pages/RecurringBillsDetail'));
const ViewDebitNotes = lazy(() => import('@/features/purchase/debitNotes/pages/ViewDebitNotes'));
const AddDebitNote = lazy(() => import('@/features/purchase/debitNotes/pages/AddDebitNote'));
const ViewChartOfAccounts = lazy(() => import('@/features/accountant/chartOfAccount/pages/ViewChartOfAccounts'));
const ChartOfAccountDetail = lazy(() => import('@/features/accountant/chartOfAccount/pages/ChartOfAccountDetail'));
const QuoteDetail = lazy(() => import('@/features/sales/quotes/pages/QuoteDetail'));
const SalesOrderDetail = lazy(() => import('@/features/sales/salesOrder/pages/SalesOrderDetail'));
const NewVsOldCustomerModuleData = lazy(() => import('@/features/analytics/pages/SalesAnalytics/NewVsOldCustomerModuleData'));
const InvoiceDetail = lazy(() => import('@/features/sales/invoice/pages/InvoiceDetail'));
const AddPurchaseOrder = lazy(() => import('@/features/purchase/purchaseOrder/pages/AddPurchaseOrder'));
const PurchaseOrderDetail = lazy(() => import('@/features/purchase/purchaseOrder/pages/PurchaseOrderDetail'));
const ViewGrpo = lazy(() => import('@/features/purchase/grpo/pages/ViewGrpo'));
const GrpoDetail = lazy(() => import('@/features/purchase/grpo/pages/GrpoDetail'));
const AddGrpo = lazy(() => import('@/features/purchase/grpo/pages/AddGrpo'));
const BillDetail = lazy(() => import('@/features/purchase/bills/pages/BillDetail'));
const DeliveryChallansDetail = lazy(() => import('@/features/sales/deliveryChallan/pages/DeliveryChallansDetail'));
const CreditNotesDetail = lazy(() => import('@/features/sales/creditNotes/pages/CreditNotesDetail'));
const SettingsRoutes = lazy(() => import('@/features/setting/pages/SettingsRoutes'));
const ViewReports = lazy(() => import('@/features/reports/pages/ViewReports'));
const DebitNoteDetail = lazy(() => import('@/features/purchase/debitNotes/pages/DebitNoteDetail'));
const ReportDetail = lazy(() => import('@/features/reports/pages/generalLedger/ReportDetail'));
const AddBulkCustomer = lazy(() => import('@/features/sales/customer/pages/AddBulkCustomer'));
const AddBulkOpeningBalance = lazy(() => import('@/features/sales/customer/pages/AddBulkOpeningBalance'));
const AddBulkItems = lazy(() => import('@/features/allMaster/item/pages/AddBulkItems'));
const AddBulkInventory = lazy(() => import('@/features/allMaster/item/pages/AddBulkInventory'));
const AddProductionOrder = lazy(() => import('@/features/production/productionOrder/pages/AddProductionOrder'));
const ViewProductionOrders = lazy(() => import('@/features/production/productionOrder/pages/ViewProductionOrders'));
const PaymentReceivedDetails = lazy(() => import('@/features/sales/paymentsReceived/pages/PaymentReceivedDetail'));
const PaymentMadeDetail = lazy(() => import('@/features/purchase/paymentsMade/pages/PaymentMadeDetail'));
const ViewItemLedgersReport = lazy(() => import('@/features/reports/pages/itemLedger/ViewItemLedgersReport'));
const ViewInventoryTransfers = lazy(() => import('@/features/inventory/inventoryTransfer/pages/ViewInventoryTransfers'));
const InventoryTransferDetail = lazy(() => import('@/features/inventory/inventoryTransfer/pages/InventoryTransferDetail'));
const ViewBankLedgersReport = lazy(() => import('@/features/reports/pages/bankLedger/ViewBankLedgersReport'));
const CustomerDetail = lazy(() => import('@/features/sales/customer/pages/CustomerDetail'));
const ViewSalesLedgersReport = lazy(() => import('@/features/reports/pages/salesLedger/ViewSalesLedgersReport'));
const ViewSalesLedgerDetailReport = lazy(() => import('@/features/reports/pages/salesLedger/ViewSalesLedgerDetailReport'));
const ViewPurchaseLedgersReport = lazy(() => import('@/features/reports/pages/purchaseLedger/ViewPurchaseLedgersReport'));
const ViewPurchaseLedgerDetailReport = lazy(() => import('@/features/reports/pages/purchaseLedger/ViewPurchaseLedgerDetailReport'));
const ViewGstr1Report = lazy(() => import('@/features/reports/pages/ViewGstr1Report'));
const ItemDetail = lazy(() => import('@/features/allMaster/item/pages/ItemDetail'));
const ViewCreditorLedgersReport = lazy(() => import('@/features/reports/pages/creditorsLedger/ViewCreditorLedgersReport'));
const ViewDebtorLedgersReport = lazy(() => import('@/features/reports/pages/debtorsLedger/ViewDebtorLedgersReport'));
const ExpenseDetail = lazy(() => import('@/features/purchase/expenses/pages/ExpenseDetail'));
const ViewCreditorLedgersDetailReport = lazy(() => import('@/features/reports/pages/creditorsLedger/ViewCreditorLedgersDetailReport'));
const ViewDebtorLedgersDetailReport = lazy(() => import('@/features/reports/pages/debtorsLedger/ViewDebtorLedgersDetailReport'));
const AddAccountLedger = lazy(() => import('@/features/accountant/accountLedger/pages/AddAccountLedger'));
const ViewAccountLedger = lazy(() => import('@/features/accountant/accountLedger/pages/ViewAccountLedger'));
const ViewAddInventory = lazy(() => import('@/features/inventory/addInventory/pages/ViewAddInventory'));
const BankDetail = lazy(() => import('@/features/banking/banks/pages/BankDetail'));
const BankTransferLogs = lazy(() => import('@/features/banking/bankTransferLogs/BankTransferLogs'));
const ViewGrossProfitReport = lazy(() => import('@/features/reports/pages/grossProfit/ViewGrossProfitReport'));
const ViewCustomerProfitAndLossReport = lazy(() => import('@/features/reports/pages/grossProfit/ViewCustomerProfitAndLossReport'));
const ViewItemDetailsProfitAndLossReport = lazy(() => import('@/features/reports/pages/grossProfit/ViewItemDetailsProfitAndLossReport'));
const ViewProfitAndLossReport = lazy(() => import('@/features/reports/pages/ViewProfitAndLossReport'));
const ViewItemDetailsBatchProfitAndLossReport = lazy(() => import('@/features/reports/pages/grossProfit/ViewItemDetailsBatchProfitAndLossReport'));
const ViewCustomerDetailsBatchProfitAndLossReport = lazy(() => import('@/features/reports/pages/grossProfit/ViewCustomerDetailsBatchProfitAndLossReport'));
const ViewManualJournals = lazy(() => import('@/features/accountant/manualJournal/pages/ViewManualJournals'));
const AddManualJournal = lazy(() => import('@/features/accountant/manualJournal/pages/AddManualJournal'));
const ManualJournalDetail = lazy(() => import('@/features/accountant/manualJournal/pages/ManualJournalDetail'));
import { RESOURCES } from '@/utils/jsonFile';
const ProductionOrderDetail = lazy(() => import('@/features/production/productionOrder/pages/ProductionOrderDetail'));
const ViewItemGroups = lazy(() => import('@/features/allMaster/itemGroup/pages/ViewItemGroups'));
const ItemGroupDetail = lazy(() => import('@/features/allMaster/itemGroup/pages/ItemGroupDetail'));
const ViewSalesOrderTags = lazy(() => import('@/features/allMaster/salesOrderTag/pages/ViewSalesOrderTags'));
const ViewManPowers = lazy(() => import('@/features/allMaster/manPower/pages/ViewManPowers'));
const ViewAnalytics = lazy(() => import('@/features/analytics/pages/ViewAnalytics'));
const ViewItemAnalytics = lazy(() => import('@/features/analytics/pages/ItemAnalytics/ViewItemAnalytics'));
const ViewSalesOrderAnalytics = lazy(() => import('@/features/analytics/pages/SalesAnalytics/ViewSalesOrderAnalytics'));
const ViewCustomerWisePendingOrderAnalytics = lazy(() => import('@/features/analytics/pages/SalesAnalytics/ViewCustomerWisePendingOrderAnalytics'));
const ViewItemWiseSalesOrderAnalytics = lazy(() => import('@/features/analytics/pages/SalesAnalytics/ViewItemWiseSalesOrderAnalytics'));
const ViewCustomerWiseSalesOrderAnalytics = lazy(() => import('@/features/analytics/pages/SalesAnalytics/ViewCustomerWiseSalesOrderAnalytics'));
const ViewTopCustomerOfSalesAnalytics = lazy(() => import('@/features/analytics/pages/SalesAnalytics/ViewTopCustomerOfSalesAnalytics'));
const ViewCustomerWiseBusinessPerformance = lazy(() => import('@/features/analytics/pages/SalesAnalytics/ViewCustomerWiseBusinessPerformance'));
const ViewTopItemsOfSalesAnalytics = lazy(() => import('@/features/analytics/pages/SalesAnalytics/ViewTopItemsOfSalesAnalytics'));
const ViewCustomersWithSingleInvoiceAnalytics = lazy(() => import('@/features/analytics/pages/SalesAnalytics/ViewCustomersWithSingleInvoiceAnalytics'));
const ViewTopVendorsByAmountPurchase = lazy(() => import('@/features/analytics/pages/PurchaseAnalytics/ViewTopVendorsByAmountPurchase'));
const ViewTopVendorsByRevenuePurchase = lazy(() => import('@/features/analytics/pages/PurchaseAnalytics/ViewTopVendorsByRevenuePurchase'));
const ViewTopItemsOfPurchase = lazy(() => import('@/features/analytics/pages/PurchaseAnalytics/ViewTopItemsOfPurchase'));
const ViewTopCustomerByAmountCollectionAnalytics = lazy(() => import('@/features/analytics/pages/CollectionAnalytics/ViewTopCustomerByAmountCollectionAnalytics'));
const ViewUpcomingReceivablesInvoiceCollectionAnalytics = lazy(() => import('@/features/analytics/pages/CollectionAnalytics/ViewUpcomingReceivablesInvoiceCollectionAnalytics'));
const ViewRecentlyReceivedPaymentsCollectionAnalytics = lazy(() => import('@/features/analytics/pages/CollectionAnalytics/ViewRecentlyReceivedPaymentsCollectionAnalytics'));
const ViewOverdueInvoicesCollectionAnalytics = lazy(() => import('@/features/analytics/pages/CollectionAnalytics/ViewOverdueInvoicesCollectionAnalytics'));
const ViewTopVendorsByAmountPaymentAnalytics = lazy(() => import('@/features/analytics/pages/PaymentsAnalytics/ViewTopVendorsByAmountPaymentAnalytics'));
const ViewUpcomingPayablesBillsPaymentAnalytics = lazy(() => import('@/features/analytics/pages/PaymentsAnalytics/ViewUpcomingPayablesBillsPaymentAnalytics'));
const ViewRecentlyPaymentsMadePaymentAnalytics = lazy(() => import('@/features/analytics/pages/PaymentsAnalytics/ViewRecentlyPaymentsMadePaymentAnalytics'));
const ViewOverdueBillsPaymentAnalytics = lazy(() => import('@/features/analytics/pages/PaymentsAnalytics/ViewOverdueBillsPaymentAnalytics'));
const ViewInventoryAdjustment = lazy(() => import('@/features/inventory/inventoryAdjustment/pages/ViewInventoryAdjustment'));
const ViewBatches = lazy(() => import('@/features/inventory/batches/pages/ViewBatches'));
const BatchDetail = lazy(() => import('@/features/inventory/batches/pages/BatchDetail'));
const AddInventoryAdjustment = lazy(() => import('@/features/inventory/inventoryAdjustment/pages/AddInventoryAdjustment'));
const InventoryAdjustmentDetail = lazy(() => import('@/features/inventory/inventoryAdjustment/pages/InventoryAdjustmentDetail'));
const ViewGroupItemAnalytics = lazy(() => import('@/features/analytics/pages/ItemAnalytics/ViewGroupItemAnalytics'));
const ViewRejectionAnalytics = lazy(() => import('@/features/analytics/pages/ProductionAnalytics/ViewRejectionAnalytics'));
const ViewItemRejectionAnalytics = lazy(() => import('@/features/analytics/pages/ProductionAnalytics/ViewItemRejectionAnalytics'));
const ViewItemProcessAnalytics = lazy(() => import('@/features/analytics/pages/ProductionAnalytics/ViewItemProcessAnalytics'));
const ViewMonthlyProductionReport = lazy(() => import('@/features/analytics/pages/ProductionAnalytics/ViewMonthlyProductionReport'));
const ViewStockSummary = lazy(() => import('@/features/analytics/pages/StockAnalytics/ViewStockSummary'));
const ViewProfitAndLossByProductionOrderReport = lazy(() => import('@/features/reports/pages/grossProfit/ViewProfitAndLossByProductionOrderReport'));
const ViewBalanceSheetReport = lazy(() => import('@/features/reports/pages/ViewBalanceSheetReport'));
const ViewRMWiseAnalytics = lazy(() => import('@/features/analytics/pages/SalesAnalytics/ViewRMWiseAnalytics'));
const ViewItemWiseRmAnalytics = lazy(() => import('@/features/analytics/pages/SalesAnalytics/ViewItemWiseRmAnalytics'));
const ViewSupport = lazy(() => import('@/features/homeTab/support/pages/ViewSupport'));
const AddSupport = lazy(() => import('@/features/homeTab/support/pages/AddSupport'));
const SupportDetail = lazy(() => import('@/features/homeTab/support/pages/SupportDetail'));
const ViewCustomerAgingReport = lazy(() => import('@/features/reports/pages/customerAging/ViewCustomerAgingReport'));
const ViewVendorAgingReport = lazy(() => import('@/features/reports/pages/vendorAging/ViewVendorAgingReport'));
const AgingBucketReport = lazy(() => import('@/features/reports/pages/customerAging/AgingBucketReport'));
const ViewUpcomingPaymentsReport = lazy(() => import('@/features/reports/pages/receivablesPayables/ViewUpcomingPaymentsReport'));
const ViewUpcomingPaymentsDetailReport = lazy(() => import('@/features/reports/pages/receivablesPayables/ViewUpcomingPaymentsDetailReport'));
const ViewGeneralSalesAnalytics = lazy(() => import('@/features/analytics/pages/SalesAnalytics/ViewGeneralSalesAnalytics'));
const ViewGeneralSalesDetailAnalytics = lazy(() => import('@/features/analytics/pages/SalesAnalytics/ViewGeneralSalesDetailAnalytics'));
const ViewInventory = lazy(() => import('@/features/inventory/viewInventory/pages/ViewInventory'));
const ViewInventoryDetail = lazy(() => import('@/features/inventory/viewInventory/pages/ViewInventoryDetail'));
const ViewSalesOrderWiseRmAnalytics = lazy(() => import('@/features/analytics/pages/SalesAnalytics/ViewSalesOrderWiseRmAnalytics'));
const ViewRejectionOrders = lazy(() => import('@/features/rejections/bookRejections/pages/ViewRejectionOrders'));
const AddRejectionOrder = lazy(() => import('@/features/rejections/bookRejections/pages/AddRejectionOrder'));
const RejectionOrderDetail = lazy(() => import('@/features/rejections/bookRejections/pages/RejectionOrderDetail'));
const RejectionInventory = lazy(() => import('@/features/rejections/rejectionInventory/pages/RejectionInventory'));
const RejectionAnalysis = lazy(() => import('@/features/rejections/rejectionAnalysis/pages/RejectionAnalysis'));
const ViewProblemList = lazy(() => import('@/features/complaint/problemList/pages/ViewProblemList'));
const ViewComplaints = lazy(() => import('@/features/complaint/bookComplaints/pages/ViewComplaints'));
const AddComplaint = lazy(() => import('@/features/complaint/bookComplaints/pages/AddComplaint'));
const ComplaintDetail = lazy(() => import('@/features/complaint/bookComplaints/pages/ComplaintDetail'));
const ViewSpareParts = lazy(() => import('@/features/maintenance/sparePart/pages/ViewSpareParts'));
const SparePartDetail = lazy(() => import('@/features/maintenance/sparePart/pages/SparePartDetail'));
const AddSparePart = lazy(() => import('@/features/maintenance/sparePart/pages/AddSparePart'));
const ViewMachines = lazy(() => import('@/features/maintenance/machine/pages/ViewMachines'));
const MachineDetail = lazy(() => import('@/features/maintenance/machine/pages/MachineDetail'));
const AddMachine = lazy(() => import('@/features/maintenance/machine/pages/AddMachine'));
const ViewMaintenanceRequest = lazy(() => import('@/features/maintenance/maintenanceRequest/pages/ViewMaintenanceRequest'));
const MaintenanceRequestDetail = lazy(() => import('@/features/maintenance/maintenanceRequest/pages/MaintenanceRequestDetail'));
const ViewMaintenancePurchase = lazy(() => import('@/features/maintenance/maintenancePurchase/pages/ViewMaintenancePurchase'));
const ViewPartRequest = lazy(() => import('@/features/maintenance/partRequest/pages/ViewPartRequest'));
const ViewSpareStockLedger = lazy(() => import('@/features/maintenance/spareStockLedger/pages/ViewSpareStockLedger'));
const AddMaintenancePurchase = lazy(() => import('@/features/maintenance/maintenancePurchase/pages/AddMaintenancePurchase'));
const MaintenancePurchaseDetail = lazy(() => import('@/features/maintenance/maintenancePurchase/pages/MaintenancePurchaseDetail'));

const AdminRoutes = [
  {
    path: ADMIN_ROUTE_PATHS.home,
    component: <ViewDashboard />,
    title: 'Dashboard',
    moduleName: RESOURCES.HOME,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.recentUpdates,
    component: <RecentUpdates />,
    title: 'Recent Updates',
    moduleName: RESOURCES.HOME,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.division.root,
    component: <ViewDivisions />,
    title: 'Division',
    moduleName: RESOURCES.DIVISION,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.division.new,
    component: <AddDivision />,
    title: 'Add | Division',
    isAdd: true,
    moduleName: RESOURCES.DIVISION,
    permission: 'create',
  },
  {
    path: ADMIN_ROUTE_PATHS.division.detail,
    component: <DivisionDetail />,
    title: 'View | Division',
    moduleName: RESOURCES.DIVISION,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.division.edit,
    component: <AddDivision />,
    title: 'Edit | Division',
    isAdd: true,
    moduleName: RESOURCES.DIVISION,
    permission: 'edit',
  },
  {
    path: ADMIN_ROUTE_PATHS.branch.root,
    component: <ViewBranches />,
    title: 'Branch',
    moduleName: RESOURCES.BRANCH,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.branch.new,
    component: <AddBranch />,
    title: 'Add | Branch',
    isAdd: true,
    moduleName: RESOURCES.BRANCH,
    permission: 'create',
  },
  {
    path: ADMIN_ROUTE_PATHS.branch.detail,
    component: <BranchDetail />,
    title: 'View | Branch',
    moduleName: RESOURCES.BRANCH,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.branch.edit,
    component: <AddBranch />,
    title: 'Edit | Branch',
    isAdd: true,
    moduleName: RESOURCES.BRANCH,
    permission: 'edit',
  },
  {
    path: ADMIN_ROUTE_PATHS.manPowerMaster,
    component: <ViewManPowers />,
    title: 'Manpower Master',
    moduleName: RESOURCES.MAN_POWER_MASTER,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.warehouseMaster.root,
    component: <ViewWarehouses />,
    title: 'Warehouse',
    moduleName: RESOURCES.WAREHOUSE_MASTER,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.warehouseMaster.new,
    component: <AddWarehouse />,
    title: 'Add | Warehouse',
    isAdd: true,
    moduleName: RESOURCES.WAREHOUSE_MASTER,
    permission: 'create',
  },
  {
    path: ADMIN_ROUTE_PATHS.warehouseMaster.detail,
    component: <WarehouseDetail />,
    title: 'View | Warehouse',
    moduleName: RESOURCES.WAREHOUSE_MASTER,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.warehouseMaster.edit,
    component: <AddWarehouse />,
    title: 'Edit | Warehouse',
    isAdd: true,
    moduleName: RESOURCES.WAREHOUSE_MASTER,
    permission: 'edit',
  },
  {
    path: ADMIN_ROUTE_PATHS.customerMaster.root,
    component: <ViewCustomers />,
    title: 'Customer',
    moduleName: RESOURCES.CUSTOMER_MASTER,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.customerMaster.new,
    component: <AddCustomer />,
    title: 'Add | Customer',
    isAdd: true,
    moduleName: RESOURCES.CUSTOMER_MASTER,
    permission: 'create',
  },
  {
    path: ADMIN_ROUTE_PATHS.customerMaster.bulkImport,
    component: <AddBulkCustomer />,
    title: 'Add Bulk | Customer',
    isAdd: true,
    moduleName: RESOURCES.CUSTOMER_MASTER,
    permission: 'create',
  },
  {
    path: ADMIN_ROUTE_PATHS.customerMaster.bulkOpeningBalance,
    component: <AddBulkOpeningBalance />,
    title: 'Add Opening Balance | Customer',
    isAdd: true,
    moduleName: RESOURCES.CUSTOMER_MASTER,
    permission: 'create',
  },
  {
    path: ADMIN_ROUTE_PATHS.vendors.bulkImport,
    component: <AddBulkCustomer />,
    title: 'Add Bulk | Vendor',
    isAdd: true,
    moduleName: RESOURCES.VENDORS,
    permission: 'create',
  },
  {
    path: ADMIN_ROUTE_PATHS.vendors.bulkOpeningBalance,
    component: <AddBulkOpeningBalance />,
    title: 'Add Opening Balance | Vendor',
    isAdd: true,
    moduleName: RESOURCES.VENDORS,
    permission: 'create',
  },
  {
    path: ADMIN_ROUTE_PATHS.priceList.root,
    component: <ViewPriceLists />,
    title: 'Price List',
    moduleName: RESOURCES.PRICE_LIST,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.priceList.detail,
    component: <PriceListDetail />,
    title: 'View | Price List',
    moduleName: RESOURCES.PRICE_LIST,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.priceList.new,
    component: <AddPriceList />,
    title: 'Add | Price List',
    isAdd: true,
    moduleName: RESOURCES.PRICE_LIST,
    permission: 'create',
  },
  {
    path: ADMIN_ROUTE_PATHS.priceList.edit,
    component: <AddPriceList />,
    title: 'Edit | Price List',
    isAdd: true,
    moduleName: RESOURCES.PRICE_LIST,
    permission: 'edit',
  },
  {
    path: ADMIN_ROUTE_PATHS.process,
    component: <ViewProcesses />,
    title: 'Process',
    moduleName: RESOURCES.PROCESS,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.recipe,
    component: <ViewRecipes />,
    title: 'Recipe',
    moduleName: RESOURCES.RECIPE,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.customerMaster.edit,
    component: <AddCustomer />,
    title: 'Edit | Customer',
    isAdd: true,
    moduleName: RESOURCES.CUSTOMER_MASTER,
    permission: 'edit',
  },
  {
    path: ADMIN_ROUTE_PATHS.customerMaster.detail,
    component: <CustomerDetail />,
    title: 'View | Customer',
    moduleName: RESOURCES.CUSTOMER_MASTER,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.customerMaster.analysis360,
    component: <Customer360View />,
    title: '360 View | Customer',
    moduleName: RESOURCES.CUSTOMER_MASTER,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.qualityMaster.root,
    component: <ViewQualities />,
    title: 'Quality',
    moduleName: RESOURCES.QUALITY_MASTER,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.qualityMaster.new,
    component: <AddQuality />,
    title: 'Add | Quality',
    isAdd: true,
    moduleName: RESOURCES.QUALITY_MASTER,
    permission: 'create',
  },
  {
    path: ADMIN_ROUTE_PATHS.qualityMaster.detail,
    component: <QualityDetail />,
    title: 'View | Quality',
    moduleName: RESOURCES.QUALITY_MASTER,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.qualityMaster.edit,
    component: <AddQuality />,
    title: 'Edit | Quality',
    isAdd: true,
    moduleName: RESOURCES.QUALITY_MASTER,
    permission: 'edit',
  },
  {
    path: ADMIN_ROUTE_PATHS.itemMaster.root,
    component: <ViewItems />,
    title: 'Item',
    moduleName: RESOURCES.ITEM_MASTER,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.itemMaster.detail,
    component: <ItemDetail />,
    title: 'Item',
    moduleName: RESOURCES.ITEM_MASTER,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.itemMaster.bulkImport,
    component: <AddBulkItems />,
    title: 'Add Bulk | Item',
    isAdd: true,
    moduleName: RESOURCES.ITEM_MASTER,
    permission: 'create',
  },
  {
    path: ADMIN_ROUTE_PATHS.itemMaster.bulkInventory,
    component: <AddBulkInventory />,
    title: 'Add Bulk Inventory | Item',
    isAdd: true,
    moduleName: RESOURCES.ITEM_MASTER,
    permission: 'create',
  },
  {
    path: ADMIN_ROUTE_PATHS.itemMaster.new,
    component: <AddItem />,
    title: 'Add | Item',
    isAdd: true,
    moduleName: RESOURCES.ITEM_MASTER,
    permission: 'create',
  },
  {
    path: ADMIN_ROUTE_PATHS.itemMaster.edit,
    component: <AddItem />,
    title: 'Edit | Item',
    isAdd: true,
    moduleName: RESOURCES.ITEM_MASTER,
    permission: 'edit',
  },
  {
    path: ADMIN_ROUTE_PATHS.itemGroupMaster,
    component: <ViewItemGroups />,
    title: 'Item Group Master',
    moduleName: RESOURCES.ITEM_GROUP_MASTER,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.itemGroupDetail,
    component: <ItemGroupDetail />,
    title: 'View | Item Group Master',
    moduleName: RESOURCES.ITEM_GROUP_MASTER,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.salesOrderTagMaster,
    component: <ViewSalesOrderTags />,
    title: 'Sales Order Tag Master',
    moduleName: RESOURCES.SALES_ORDER_TAG_MASTER,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.viewInventory.root,
    component: <ViewInventory />,
    title: 'View Inventory',
    moduleName: RESOURCES.PRODUCTION,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.viewInventory.detail,
    component: <ViewInventoryDetail />,
    title: 'View Inventory Details',
    moduleName: RESOURCES.PRODUCTION,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.inventoryTransferRequest.root,
    component: <ViewInventoryTransfers />,
    title: 'View Inventory Transfer Request',
    moduleName: RESOURCES.INVENTORY_TRANSFER_REQUEST,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.inventoryTransferRequest.detail,
    component: <InventoryTransferDetail />,
    title: 'View | Inventory Transfer Request',
    moduleName: RESOURCES.INVENTORY_TRANSFER_REQUEST,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.inventoryLogs,
    component: <ViewAddInventory />,
    title: 'Add Inventory Logs',
    moduleName: RESOURCES.ADD_INVENTORY,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.productionOrders.new,
    component: <AddProductionOrder />,
    title: 'Add | Production Orders',
    isAdd: true,
    moduleName: RESOURCES.ADD_PRODUCTION,
    permission: 'create',
  },
  {
    path: ADMIN_ROUTE_PATHS.productionOrders.edit,
    component: <AddProductionOrder />,
    title: 'Edit | Production Orders',
    isAdd: true,
    moduleName: RESOURCES.ADD_PRODUCTION,
    permission: 'edit',
  },
  {
    path: ADMIN_ROUTE_PATHS.productionOrders.root,
    component: <ViewProductionOrders />,
    title: 'Production Orders',
    moduleName: RESOURCES.ADD_PRODUCTION,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.productionOrders.detail,
    component: <ProductionOrderDetail />,
    title: 'View | Production Orders',
    moduleName: RESOURCES.ADD_PRODUCTION,
    permission: 'view',
  },
  //sales
  {
    path: ADMIN_ROUTE_PATHS.quotes.root,
    component: <ViewQuotes />,
    title: 'Quote',
    moduleName: RESOURCES.QUOTES,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.quotes.detail,
    component: <QuoteDetail />,
    title: 'View | Quote',
    moduleName: RESOURCES.QUOTES,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.quotes.new,
    component: <AddQuote />,
    title: 'Add | Quote',
    isAdd: true,
    moduleName: RESOURCES.QUOTES,
    permission: 'create',
  },
  {
    path: ADMIN_ROUTE_PATHS.quotes.edit,
    component: <AddQuote />,
    title: 'Edit | Quote',
    isAdd: true,
    moduleName: RESOURCES.QUOTES,
    permission: 'edit',
  },
  {
    path: ADMIN_ROUTE_PATHS.customerOrders.root,
    component: <ViewCustomerOrders />,
    title: 'Customer Order',
    moduleName: RESOURCES.CUSTOMER_ORDER,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.customerOrders.detail,
    component: <CustomerOrderDetail />,
    title: 'View | Customer Order',
    moduleName: RESOURCES.CUSTOMER_ORDER,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.sampleCatalogs.root,
    component: <ViewSampleCatalogs />,
    title: 'Sample Catalogs',
    moduleName: RESOURCES.SAMPLE_CATALOG,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.sampleCatalogs.create,
    component: <AddSampleCatalog />,
    title: 'Add | Sample Catalog',
    isAdd: true,
    moduleName: RESOURCES.SAMPLE_CATALOG,
    permission: 'create',
  },
  {
    path: ADMIN_ROUTE_PATHS.sampleCatalogs.detail,
    component: <SampleCatalogDetail />,
    title: 'View | Sample Catalog',
    moduleName: RESOURCES.SAMPLE_CATALOG,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.sampleCatalogs.edit,
    component: <AddSampleCatalog />,
    title: 'Edit | Sample Catalog',
    isAdd: true,
    moduleName: RESOURCES.SAMPLE_CATALOG,
    permission: 'edit',
  },
  {
    path: ADMIN_ROUTE_PATHS.customerPayments.root,
    component: <ViewCustomerPayments />,
    title: 'Customer Payments',
    moduleName: RESOURCES.CUSTOMER_PAYMENT,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.customerPayments.detail,
    component: <CustomerPaymentDetail />,
    title: 'View | Customer Payment',
    moduleName: RESOURCES.CUSTOMER_PAYMENT,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.customerAppDashboard.root,
    component: <CustomerAppDashboard />,
    title: 'Customer App Dashboard',
    moduleName: RESOURCES.CUSTOMER_APP_DASHBOARD,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.salesOrders.root,
    component: <ViewSalesOrders />,
    title: 'Sales Order',
    moduleName: RESOURCES.SALES_ORDER,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.salesOrders.detail,
    component: <SalesOrderDetail />,
    title: 'View | Sales Order',
    moduleName: RESOURCES.SALES_ORDER,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.salesOrders.new,
    component: <AddSalesOrder />,
    title: 'Add | Sales Order',
    isAdd: true,
    moduleName: RESOURCES.SALES_ORDER,
    permission: 'create',
  },
  {
    path: ADMIN_ROUTE_PATHS.salesOrders.edit,
    component: <AddSalesOrder />,
    title: 'Edit | Sales Order',
    isAdd: true,
    moduleName: RESOURCES.SALES_ORDER,
    permission: 'edit',
  },
  {
    path: ADMIN_ROUTE_PATHS.deliveryChallans.root,
    component: <ViewDeliveryChallans />,
    title: 'Delivery Challan',
    moduleName: RESOURCES.DELIVERY_CHALLANS,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.deliveryChallans.detail,
    component: <DeliveryChallansDetail />,
    title: 'View | Delivery Challan',
    moduleName: RESOURCES.DELIVERY_CHALLANS,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.deliveryChallans.new,
    component: <AddDeliveryChallan />,
    title: 'Add | Delivery Challan',
    isAdd: true,
    moduleName: RESOURCES.DELIVERY_CHALLANS,
    permission: 'create',
  },
  {
    path: ADMIN_ROUTE_PATHS.deliveryChallans.edit,
    component: <AddDeliveryChallan />,
    title: 'Edit | Delivery Challan',
    isAdd: true,
    moduleName: RESOURCES.DELIVERY_CHALLANS,
    permission: 'edit',
  },
  {
    path: ADMIN_ROUTE_PATHS.invoices.root,
    component: <ViewInvoices />,
    title: 'Invoice',
    moduleName: RESOURCES.INVOICES,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.invoices.detail,
    component: <InvoiceDetail />,
    title: 'View | Invoice',
    moduleName: RESOURCES.INVOICES,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.invoices.new,
    component: <AddInvoice />,
    title: 'Add | Invoice',
    isAdd: true,
    moduleName: RESOURCES.INVOICES,
    permission: 'create',
  },
  {
    path: ADMIN_ROUTE_PATHS.invoices.edit,
    component: <AddInvoice />,
    title: 'Edit | Invoice',
    isAdd: true,
    moduleName: RESOURCES.INVOICES,
    permission: 'edit',
  },
  {
    path: ADMIN_ROUTE_PATHS.paymentsReceived.root,
    component: <ViewPaymentReceived />,
    title: 'Payment Received',
    moduleName: RESOURCES.PAYMENT_RECEIVED,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.paymentsReceived.new,
    component: <AddPaymentReceived />,
    title: 'Add | Payment Received',
    isAdd: true,
    moduleName: RESOURCES.PAYMENT_RECEIVED,
    permission: 'create',
  },
  {
    path: ADMIN_ROUTE_PATHS.paymentsReceived.edit,
    component: <AddPaymentReceived />,
    title: 'Edit | Payment Received',
    isAdd: true,
    moduleName: RESOURCES.PAYMENT_RECEIVED,
    permission: 'edit',
  },
  {
    path: ADMIN_ROUTE_PATHS.paymentsReceived.detail,
    component: <PaymentReceivedDetails />,
    title: 'View | Payment Received',
    moduleName: RESOURCES.PAYMENT_RECEIVED,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.recurringInvoices.root,
    component: <ViewRecurringInvoices />,
    title: 'Recurring Invoice',
    moduleName: RESOURCES.RECURRING_INVOICE,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.recurringInvoices.new,
    component: <AddRecurringInvoice />,
    title: 'Add | Recurring Invoice',
    isAdd: true,
    moduleName: RESOURCES.RECURRING_INVOICE,
    permission: 'create',
  },
  {
    path: ADMIN_ROUTE_PATHS.recurringInvoices.edit,
    component: <AddRecurringInvoice />,
    title: 'Edit | Recurring Invoice',
    isAdd: true,
    moduleName: RESOURCES.RECURRING_INVOICE,
    permission: 'edit',
  },
  {
    path: ADMIN_ROUTE_PATHS.recurringInvoices.detail,
    component: <RecurringInvoiceDetail />,
    title: 'View | Recurring Invoice',
    moduleName: RESOURCES.RECURRING_INVOICE,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.creditNotes.root,
    component: <ViewCreditNotes />,
    title: 'Credit Note',
    moduleName: RESOURCES.CREDIT_NOTES,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.creditNotes.detail,
    component: <CreditNotesDetail />,
    title: 'View | Credit Note',
    moduleName: RESOURCES.CREDIT_NOTES,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.creditNotes.new,
    component: <AddCreditNote />,
    title: 'Add | Credit Note',
    isAdd: true,
    moduleName: RESOURCES.CREDIT_NOTES,
    permission: 'create',
  },
  {
    path: ADMIN_ROUTE_PATHS.creditNotes.edit,
    component: <AddCreditNote />,
    title: 'Edit | Credit Note',
    isAdd: true,
    moduleName: RESOURCES.CREDIT_NOTES,
    permission: 'edit',
  },

  //banking
  {
    path: ADMIN_ROUTE_PATHS.banks.root,
    component: <ViewBanks />,
    title: 'Banks',
    moduleName: RESOURCES.BANK,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.banks.detail,
    component: <BankDetail />,
    title: 'View | Banks',
    moduleName: RESOURCES.BANK,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.banks.new,
    component: <AddBank />,
    title: 'Add | Banks',
    isAdd: true,
    moduleName: RESOURCES.BANK,
    permission: 'create',
  },
  {
    path: ADMIN_ROUTE_PATHS.banks.edit,
    component: <AddBank />,
    title: 'Edit | Banks',
    isAdd: true,
    moduleName: RESOURCES.BANK,
    permission: 'edit',
  },
  {
    path: ADMIN_ROUTE_PATHS.bankTransferLogs,
    component: <BankTransferLogs />,
    title: 'Bank Transfer Logs',
    moduleName: RESOURCES.BANK_TRANSFER_LOGS,
    permission: 'view',
  },
  //purchase
  {
    path: ADMIN_ROUTE_PATHS.vendors.root,
    component: <ViewCustomers />,
    title: 'Vendor',
    moduleName: RESOURCES.VENDORS,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.vendors.new,
    component: <AddCustomer />,
    title: 'Add | Vendor',
    isAdd: true,
    moduleName: RESOURCES.VENDORS,
    permission: 'create',
  },
  {
    path: ADMIN_ROUTE_PATHS.vendors.edit,
    component: <AddCustomer />,
    title: 'Edit | Vendor',
    isAdd: true,
    moduleName: RESOURCES.VENDORS,
    permission: 'edit',
  },
  {
    path: ADMIN_ROUTE_PATHS.vendors.detail,
    component: <CustomerDetail />,
    title: 'View | Vendor',
    moduleName: RESOURCES.VENDORS,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.expenses.root,
    component: <ViewExpenses />,
    title: 'Expense',
    moduleName: RESOURCES.EXPENSES,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.expenses.detail,
    component: <ExpenseDetail />,
    title: 'View | Expenses',
    moduleName: RESOURCES.EXPENSES,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.expenses.new,
    component: <AddExpense />,
    title: 'Add | Expense',
    isAdd: true,
    moduleName: RESOURCES.EXPENSES,
    permission: 'create',
  },
  {
    path: ADMIN_ROUTE_PATHS.expenses.edit,
    component: <AddExpense />,
    title: 'Edit | Expense',
    isAdd: true,
    moduleName: RESOURCES.EXPENSES,
    permission: 'edit',
  },
  {
    path: ADMIN_ROUTE_PATHS.recurringExpenses.root,
    component: <ViewRecurringExpenses />,
    title: 'Recurring Expense',
    moduleName: RESOURCES.RECURRING_EXPENSES,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.recurringExpenses.new,
    component: <AddRecurringExpense />,
    title: 'Add | Recurring Expense',
    isAdd: true,
    moduleName: RESOURCES.RECURRING_EXPENSES,
    permission: 'create',
  },
  {
    path: ADMIN_ROUTE_PATHS.recurringExpenses.edit,
    component: <AddRecurringExpense />,
    title: 'Edit | Recurring Expense',
    isAdd: true,
    moduleName: RESOURCES.RECURRING_EXPENSES,
    permission: 'edit',
  },
  {
    path: ADMIN_ROUTE_PATHS.recurringExpenses.detail,
    component: <RecurringExpenseDetail />,
    title: 'View | Recurring Expense',
    moduleName: RESOURCES.RECURRING_EXPENSES,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.purchaseOrders.root,
    component: <ViewPurchaseOrders />,
    title: 'Purchase Order',
    moduleName: RESOURCES.PURCHASE_ORDER,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.purchaseOrders.detail,
    component: <PurchaseOrderDetail />,
    title: 'View | Purchase Order',
    moduleName: RESOURCES.PURCHASE_ORDER,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.purchaseOrders.new,
    component: <AddPurchaseOrder />,
    title: 'Add | Purchase Order',
    isAdd: true,
    moduleName: RESOURCES.PURCHASE_ORDER,
    permission: 'create',
  },
  {
    path: ADMIN_ROUTE_PATHS.purchaseOrders.edit,
    component: <AddPurchaseOrder />,
    title: 'Edit | Purchase Order',
    isAdd: true,
    moduleName: RESOURCES.PURCHASE_ORDER,
    permission: 'edit',
  },
  {
    path: ADMIN_ROUTE_PATHS.bills.root,
    component: <ViewBills />,
    title: 'Bill',
    moduleName: RESOURCES.BILLS,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.bills.detail,
    component: <BillDetail />,
    title: 'View | Bill',
    moduleName: RESOURCES.BILLS,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.bills.new,
    component: <AddBill />,
    title: 'Add | Bill',
    isAdd: true,
    moduleName: RESOURCES.BILLS,
    permission: 'create',
  },
  {
    path: ADMIN_ROUTE_PATHS.bills.edit,
    component: <AddBill />,
    title: 'Edit | Bill',
    isAdd: true,
    moduleName: RESOURCES.BILLS,
    permission: 'edit',
  },
  {
    path: ADMIN_ROUTE_PATHS.paymentsMade.root,
    component: <ViewPaymentMades />,
    title: 'Payment Made',
    moduleName: RESOURCES.PAYMENT_MADE,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.paymentsMade.new,
    component: <AddPaymentMade />,
    title: 'Add | Payment Made',
    isAdd: true,
    moduleName: RESOURCES.PAYMENT_MADE,
    permission: 'create',
  },
  {
    path: ADMIN_ROUTE_PATHS.paymentsMade.edit,
    component: <AddPaymentMade />,
    title: 'Edit | Payment Made',
    isAdd: true,
    moduleName: RESOURCES.PAYMENT_MADE,
    permission: 'edit',
  },
  {
    path: ADMIN_ROUTE_PATHS.paymentsMade.detail,
    component: <PaymentMadeDetail />,
    title: 'View | Payment Made',
    moduleName: RESOURCES.PAYMENT_MADE,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.recurringBills.root,
    component: <ViewRecurringBills />,
    title: 'Recurring Bill',
    moduleName: RESOURCES.RECURRING_BILLS,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.recurringBills.new,
    component: <AddRecurringBill />,
    title: 'Add | Recurring Bill',
    isAdd: true,
    moduleName: RESOURCES.RECURRING_BILLS,
    permission: 'create',
  },
  {
    path: ADMIN_ROUTE_PATHS.recurringBills.edit,
    component: <AddRecurringBill />,
    title: 'Edit | Recurring Bill',
    isAdd: true,
    moduleName: RESOURCES.RECURRING_BILLS,
    permission: 'edit',
  },
  {
    path: ADMIN_ROUTE_PATHS.recurringBills.detail,
    component: <RecurringBillsDetail />,
    title: 'View | Recurring Bill',
    moduleName: RESOURCES.RECURRING_BILLS,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.debitNotes.root,
    component: <ViewDebitNotes />,
    title: 'Debit Note',
    moduleName: RESOURCES.DEBIT_NOTE,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.debitNotes.detail,
    component: <DebitNoteDetail />,
    title: 'View | Debit Note',
    moduleName: RESOURCES.DEBIT_NOTE,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.debitNotes.new,
    component: <AddDebitNote />,
    title: 'Add | Debit Note',
    isAdd: true,
    moduleName: RESOURCES.DEBIT_NOTE,
    permission: 'create',
  },
  {
    path: ADMIN_ROUTE_PATHS.debitNotes.edit,
    component: <AddDebitNote />,
    title: 'Edit | Debit Note',
    isAdd: true,
    moduleName: RESOURCES.DEBIT_NOTE,
    permission: 'edit',
  },
  {
    path: ADMIN_ROUTE_PATHS.grpo.root,
    component: <ViewGrpo />,
    title: 'GRPO',
    moduleName: RESOURCES.GRPO,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.grpo.detail,
    component: <GrpoDetail />,
    title: 'View | GRPO',
    moduleName: RESOURCES.GRPO,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.grpo.new,
    component: <AddGrpo />,
    title: 'Add | GRPO',
    isAdd: true,
    moduleName: RESOURCES.GRPO,
    permission: 'create',
  },
  {
    path: ADMIN_ROUTE_PATHS.grpo.edit,
    component: <AddGrpo />,
    title: 'Edit | GRPO',
    isAdd: true,
    moduleName: RESOURCES.GRPO,
    permission: 'edit',
  },

  //accounts
  {
    path: ADMIN_ROUTE_PATHS.accountant.root,
    component: <ViewChartOfAccounts />,
    title: 'Chart of Accounts',
    moduleName: RESOURCES.ACCOUNTANT,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.accountant.detail,
    component: <ChartOfAccountDetail />,
    title: 'Account Ledger',
    moduleName: RESOURCES.ACCOUNTANT,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.accountPartner.root,
    component: <ViewAccountLedger />,
    title: 'View | Account Ledger',
    moduleName: RESOURCES.ACCOUNT_LEDGER,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.accountPartner.new,
    component: <AddAccountLedger />,
    title: 'Add | Account Ledger',
    isAdd: true,
    moduleName: RESOURCES.ACCOUNT_LEDGER,
    permission: 'create',
  },
  {
    path: ADMIN_ROUTE_PATHS.accountPartner.edit,
    component: <AddAccountLedger />,
    title: 'Edit | Account Ledger',
    isAdd: true,
    moduleName: RESOURCES.ACCOUNT_LEDGER,
    permission: 'edit',
  },
  {
    path: ADMIN_ROUTE_PATHS.manualJournal.root,
    component: <ViewManualJournals />,
    title: 'Manual Journals',
    moduleName: RESOURCES.MANUAL_JOURNALS,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.manualJournal.new,
    component: <AddManualJournal />,
    title: 'Add | Manual Journal',
    isAdd: true,
    moduleName: RESOURCES.MANUAL_JOURNALS,
    permission: 'create',
  },
  {
    path: ADMIN_ROUTE_PATHS.manualJournal.edit,
    component: <AddManualJournal />,
    title: 'Edit | Manual Journal',
    isAdd: true,
    moduleName: RESOURCES.MANUAL_JOURNALS,
    permission: 'edit',
  },
  {
    path: ADMIN_ROUTE_PATHS.manualJournal.detail,
    component: <ManualJournalDetail />,
    title: 'View | Manual Journal',
    moduleName: RESOURCES.MANUAL_JOURNALS,
    permission: 'view',
  },

  {
    path: 'setting/*',
    component: <SettingsRoutes />,
    title: 'Settings',
    moduleName: RESOURCES.SETTING,
  },
  //reports
  {
    path: ADMIN_ROUTE_PATHS.reports.root,
    component: <ViewReports />,
    title: 'Report',
    moduleName: RESOURCES.REPORTS,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.reports.detail,
    component: <ReportDetail />,
    title: 'View | Report',
    moduleName: RESOURCES.REPORT_PERMISSIONS.GENERAL_LEDGER,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.reports.bankLedger,
    component: <ViewBankLedgersReport />,
    title: 'View | Bank Ledger',
    moduleName: RESOURCES.REPORT_PERMISSIONS.BANK_LEDGER,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.reports.itemLedger,
    component: <ViewItemLedgersReport />,
    title: 'View | Item Ledger',
    moduleName: RESOURCES.REPORT_PERMISSIONS.ITEM_LEDGER,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.reports.salesLedger,
    component: <ViewSalesLedgersReport />,
    title: 'View | Sales Ledger',
    moduleName: RESOURCES.REPORT_PERMISSIONS.SALES_LEDGER,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.reports.salesLedgerDetail,
    component: <ViewSalesLedgerDetailReport />,
    title: 'View | Sales Ledger Detail',
    moduleName: RESOURCES.REPORT_PERMISSIONS.SALES_LEDGER,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.reports.purchaseLedger,
    component: <ViewPurchaseLedgersReport />,
    title: 'View | Purchase Ledger',
    moduleName: RESOURCES.REPORT_PERMISSIONS.PURCHASE_LEDGER,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.reports.purchaseLedgerDetail,
    component: <ViewPurchaseLedgerDetailReport />,
    title: 'View | Purchase Ledger Detail',
    moduleName: RESOURCES.REPORT_PERMISSIONS.PURCHASE_LEDGER,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.reports.creditorsLedger,
    component: <ViewCreditorLedgersReport />,
    title: 'View | Creditors Ledger',
    moduleName: RESOURCES.REPORT_PERMISSIONS.CREDITORS_LEDGER,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.reports.creditorsLedgerDetail,
    component: <ViewCreditorLedgersDetailReport />,
    title: 'View | Creditors Ledger Detail',
    moduleName: RESOURCES.REPORT_PERMISSIONS.CREDITORS_LEDGER,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.reports.debtorsLedger,
    component: <ViewDebtorLedgersReport />,
    title: 'View | Debtors Ledger',
    moduleName: RESOURCES.REPORT_PERMISSIONS.DEBTORS_LEDGER,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.reports.debtorsLedgerDetail,
    component: <ViewDebtorLedgersDetailReport />,
    title: 'View | Debtors Report Detail',
    moduleName: RESOURCES.REPORT_PERMISSIONS.DEBTORS_LEDGER,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.reports.customerAging,
    component: <ViewCustomerAgingReport />,
    title: 'View | Customer Aging Report',
    moduleName: RESOURCES.REPORT_PERMISSIONS.CUSTOMER_AGING_REPORT,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.reports.vendorAging,
    component: <ViewVendorAgingReport />,
    title: 'View | Vendor Aging Report',
    moduleName: RESOURCES.REPORT_PERMISSIONS.VENDOR_AGING_REPORT,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.reports.customerAgingBucket,
    component: <AgingBucketReport />,
    title: 'View | Customer Aging Bucket Details',
    moduleName: RESOURCES.REPORT_PERMISSIONS.CUSTOMER_AGING_REPORT,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.reports.vendorAgingBucket,
    component: <AgingBucketReport />,
    title: 'View | Vendor Aging Bucket Details',
    moduleName: RESOURCES.REPORT_PERMISSIONS.VENDOR_AGING_REPORT,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.reports.receivablesPayables,
    component: <ViewUpcomingPaymentsReport />,
    title: 'View | Receivables / Payables',
    moduleName: RESOURCES.REPORT_PERMISSIONS.RECEIVABLES_PAYABLES,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.reports.receivablesPayablesReceivables,
    component: <ViewUpcomingPaymentsDetailReport />,
    title: 'View | Receivables',
    moduleName: RESOURCES.REPORT_PERMISSIONS.RECEIVABLES_PAYABLES,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.reports.receivablesPayablesPayables,
    component: <ViewUpcomingPaymentsDetailReport />,
    title: 'View | Payables',
    moduleName: RESOURCES.REPORT_PERMISSIONS.RECEIVABLES_PAYABLES,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.reports.grossProfit,
    component: <ViewGrossProfitReport />,
    title: 'View | Gross Profit Report',
    moduleName: RESOURCES.REPORT_PERMISSIONS.GROSS_PROFIT,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.reports.gstr1,
    component: <ViewGstr1Report />,
    title: 'View | GSTR-1 Report',
    moduleName: RESOURCES.REPORTS,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.reports.grossProfitCustomer,
    component: <ViewCustomerProfitAndLossReport />,
    title: 'View | Customer Gross Profit Report',
    moduleName: RESOURCES.REPORT_PERMISSIONS.GROSS_PROFIT,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.reports.grossProfitItem,
    component: <ViewItemDetailsProfitAndLossReport />,
    title: 'View | Item Gross Profit Report',
    moduleName: RESOURCES.REPORT_PERMISSIONS.GROSS_PROFIT,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.reports.grossProfitItemDetails,
    component: <ViewItemDetailsBatchProfitAndLossReport />,
    title: 'View | Item Details Gross Profit Report',
    moduleName: RESOURCES.REPORT_PERMISSIONS.GROSS_PROFIT,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.reports.grossProfitCustomerDetails,
    component: <ViewCustomerDetailsBatchProfitAndLossReport />,
    title: 'View | Customer Details Gross Profit Report',
    moduleName: RESOURCES.REPORT_PERMISSIONS.GROSS_PROFIT,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.reports.grossProfitCustomerDetailsProductionOrder,
    component: <ViewProfitAndLossByProductionOrderReport />,
    title: 'View | Producation Order Details Gross Profit Report',
    moduleName: RESOURCES.REPORT_PERMISSIONS.GROSS_PROFIT,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.reports.balanceSheet,
    component: <ViewBalanceSheetReport />,
    title: 'View | Balance Sheet',
    moduleName: RESOURCES.REPORTS,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.reports.profitLossSheet,
    component: <ViewProfitAndLossReport />,
    title: 'View | Profit & Loss Statement',
    moduleName: RESOURCES.REPORTS,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.analytics.generalSalesDetail,
    component: <ViewGeneralSalesDetailAnalytics />,
    title: 'View | General Sales Analytics Detail',
    moduleName: RESOURCES.ANALYTICS_PERMISSIONS.GENERAL_SALES_ANALYTICS,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.analytics.generalSales,
    component: <ViewGeneralSalesAnalytics />,
    title: 'View | General Sales Analytics',
    moduleName: RESOURCES.ANALYTICS_PERMISSIONS.GENERAL_SALES_ANALYTICS,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.itemBatches.root,
    component: <ViewBatches />,
    title: 'Inventory | Item Batches',
    moduleName: RESOURCES.ITEM_BATCH,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.itemBatches.detail,
    component: <BatchDetail />,
    title: 'View | Item Batch',
    moduleName: RESOURCES.ITEM_BATCH,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.inventoryAdjustment.root,
    component: <ViewInventoryAdjustment />,
    title: 'Inventory | Adjustment',
    moduleName: RESOURCES.INVENTORY_ADJUSTMENT,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.inventoryAdjustment.new,
    component: <AddInventoryAdjustment />,
    title: 'Add | Inventory',
    isAdd: true,
    moduleName: RESOURCES.INVENTORY_ADJUSTMENT,
    permission: 'create',
  },
  {
    path: ADMIN_ROUTE_PATHS.inventoryAdjustment.edit,
    component: <AddInventoryAdjustment />,
    title: 'Edit | Inventory',
    isAdd: true,
    moduleName: RESOURCES.INVENTORY_ADJUSTMENT,
    permission: 'edit',
  },
  {
    path: ADMIN_ROUTE_PATHS.inventoryAdjustment.detail,
    component: <InventoryAdjustmentDetail />,
    title: 'View | Inventory Adjustment',
    moduleName: RESOURCES.INVENTORY_ADJUSTMENT,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.analytics.root,
    component: <ViewAnalytics />,
    title: 'View | Analytics Dashboard',
    moduleName: RESOURCES.ANALYTICS,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.analytics.item,
    component: <ViewItemAnalytics />,
    title: 'View | Item Analytics',
    moduleName: RESOURCES.ANALYTICS_PERMISSIONS.ITEM_ANALYTICS,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.analytics.itemGroupItem,
    component: <ViewGroupItemAnalytics />,
    title: 'View | Group Item Analytics',
    moduleName: RESOURCES.ANALYTICS_PERMISSIONS.ITEM_ANALYTICS,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.analytics.salesOrders,
    component: <ViewSalesOrderAnalytics />,
    title: 'View | Sales Orders Analytics',
    moduleName: RESOURCES.ANALYTICS_PERMISSIONS.SALES_ORDERS_ANALYTICS,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.analytics.customerWiseSalesOrderAnalysis,
    component: <ViewCustomerWisePendingOrderAnalytics />,
    title: 'View | Customer Wise Pending Order Analytics',
    moduleName: RESOURCES.ANALYTICS_PERMISSIONS.CUSTOMER_WISE_SALES_ORDERS_ANALYTICS,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.analytics.salesOrdersItem,
    component: <ViewItemWiseSalesOrderAnalytics />,
    title: 'View | Item Wise Sales Orders Analytics',
    moduleName: RESOURCES.ANALYTICS_PERMISSIONS.ITEM_WISE_SALES_ORDERS_ANALYTICS,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.analytics.newVsOldCustomerCustomer,
    component: <ViewCustomerWiseSalesOrderAnalytics />,
    title: 'View | New vs Old Customer Report',
    moduleName: RESOURCES.ANALYTICS_PERMISSIONS.NEW_VS_OLD_CUSTOMER_REPORT,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.analytics.newVsOldCustomerSalesOrders,
    component: <NewVsOldCustomerModuleData />,
    title: 'New vs Old Customer | Sales Orders',
    moduleName: RESOURCES.ANALYTICS_PERMISSIONS.NEW_VS_OLD_CUSTOMER_REPORT,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.analytics.newVsOldCustomerDeliveryChallans,
    component: <NewVsOldCustomerModuleData />,
    title: 'New vs Old Customer | Delivery Challans',
    moduleName: RESOURCES.ANALYTICS_PERMISSIONS.NEW_VS_OLD_CUSTOMER_REPORT,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.analytics.newVsOldCustomerInvoices,
    component: <NewVsOldCustomerModuleData />,
    title: 'New vs Old Customer | Invoices',
    moduleName: RESOURCES.ANALYTICS_PERMISSIONS.NEW_VS_OLD_CUSTOMER_REPORT,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.analytics.newVsOldCustomerPayments,
    component: <NewVsOldCustomerModuleData />,
    title: 'New vs Old Customer | Payments',
    moduleName: RESOURCES.ANALYTICS_PERMISSIONS.NEW_VS_OLD_CUSTOMER_REPORT,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.analytics.salesOrdersTopCustomers,
    component: <ViewTopCustomerOfSalesAnalytics />,
    title: 'View | Top Customer of Sales',
    moduleName: RESOURCES.ANALYTICS_PERMISSIONS.TOP_CUSTOMERS_OF_SALES,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.analytics.customerWiseBusinessPerformance,
    component: <ViewCustomerWiseBusinessPerformance />,
    title: 'View | Customer-wise Business Performance',
    moduleName: RESOURCES.ANALYTICS_PERMISSIONS.CUSTOMER_WISE_BUSINESS_PERFORMANCE,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.analytics.salesOrdersTopItems,
    component: <ViewTopItemsOfSalesAnalytics />,
    title: 'View | Top Items of Sales',
    moduleName: RESOURCES.ANALYTICS_PERMISSIONS.TOP_ITEMS_OF_SALES,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.analytics.salesOrdersCustomersSingleInvoice,
    component: <ViewCustomersWithSingleInvoiceAnalytics />,
    title: 'View | Customers With Single Invoice',
    moduleName: RESOURCES.ANALYTICS_PERMISSIONS.CUSTOMER_ONE_INVOICE,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.analytics.purchaseTopVendorsAmount,
    component: <ViewTopVendorsByAmountPurchase />,
    title: 'View | Top Vendors By Amount',
    moduleName: RESOURCES.ANALYTICS_PERMISSIONS.TOP_VENDORS_BY_AMOUNT_PURCHASE,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.analytics.purchaseTopVendorsRevenue,
    component: <ViewTopVendorsByRevenuePurchase />,
    title: 'View | Vendors By Purchase',
    moduleName: RESOURCES.ANALYTICS_PERMISSIONS.VENDORS_BY_PURCHASE,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.analytics.purchaseTopItemOfPurchase,
    component: <ViewTopItemsOfPurchase />,
    title: 'View | Top Item Of Purchase',
    moduleName: RESOURCES.ANALYTICS_PERMISSIONS.TOP_ITEM_OF_PURCHASE,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.analytics.collectionTopCustomerAmount,
    component: <ViewTopCustomerByAmountCollectionAnalytics />,
    title: 'View | Top Customer By Amount',
    moduleName: RESOURCES.ANALYTICS_PERMISSIONS.TOP_CUSTOMER_BY_AMOUNT_COLLECTION,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.analytics.collectionUpcomingReceivablesInvoice,
    component: <ViewUpcomingReceivablesInvoiceCollectionAnalytics />,
    title: 'View | Upcoming Receivables Invoice',
    moduleName: RESOURCES.ANALYTICS_PERMISSIONS.UPCOMING_RECEIVABLES_INVOICE,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.analytics.collectionRecentlyReceivedPayments,
    component: <ViewRecentlyReceivedPaymentsCollectionAnalytics />,
    title: 'View | Recently Received Payments',
    moduleName: RESOURCES.ANALYTICS_PERMISSIONS.RECENTLY_RECEIVED_PAYMENTS,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.analytics.collectionOverdueInvoices,
    component: <ViewOverdueInvoicesCollectionAnalytics />,
    title: 'View | Overdue Invoices',
    moduleName: RESOURCES.ANALYTICS_PERMISSIONS.OVERDUE_INVOICES,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.analytics.paymentsTopVendorsAmount,
    component: <ViewTopVendorsByAmountPaymentAnalytics />,
    title: 'View | Top Vendors By Amount',
    moduleName: RESOURCES.ANALYTICS_PERMISSIONS.TOP_VENDORS_BY_AMOUNT_PAYMENTS,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.analytics.paymentsUpcomingPayablesBills,
    component: <ViewUpcomingPayablesBillsPaymentAnalytics />,
    title: 'View | Upcoming Payables Bills',
    moduleName: RESOURCES.ANALYTICS_PERMISSIONS.UPCOMING_PAYABLES_BILLS,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.analytics.paymentsRecentlyPaymentsMade,
    component: <ViewRecentlyPaymentsMadePaymentAnalytics />,
    title: 'View | Recently Payments Made',
    moduleName: RESOURCES.ANALYTICS_PERMISSIONS.RECENTLY_PAYMENTS_MADE,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.analytics.paymentsOverdueBills,
    component: <ViewOverdueBillsPaymentAnalytics />,
    title: 'View | Overdue Bills',
    moduleName: RESOURCES.ANALYTICS_PERMISSIONS.OVERDUE_BILLS,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.analytics.rejectionAnalytics,
    component: <ViewRejectionAnalytics />,
    title: 'View | Production Rejection Analytics',
    moduleName: RESOURCES.ANALYTICS_PERMISSIONS.REJECTION_ANALYTICS,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.analytics.itemRejectionAnalytics,
    component: <ViewItemRejectionAnalytics />,
    title: 'View | Production Item Rejection Analytics',
    moduleName: RESOURCES.ANALYTICS_PERMISSIONS.ITEM_REJECTION_ANALYTICS,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.analytics.itemProcessAnalytics,
    component: <ViewItemProcessAnalytics />,
    title: 'View | Production Item Process Analytics',
    moduleName: RESOURCES.ANALYTICS_PERMISSIONS.ITEM_PROCESS_ANALYTICS,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.analytics.monthlyProductionReport,
    component: <ViewMonthlyProductionReport />,
    title: 'View | Monthly Production Report',
    moduleName: RESOURCES.ANALYTICS_PERMISSIONS.MONTHLY_PRODUCTION_REPORT,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.analytics.stockSummary,
    component: <ViewStockSummary />,
    title: 'View | Stock Summary Report',
    moduleName: RESOURCES.ANALYTICS_PERMISSIONS.STOCK_SUMMARY,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.analytics.salesOrdersRawMaterial,
    component: <ViewRMWiseAnalytics />,
    title: 'View | Sales Order RM Analytics',
    moduleName: RESOURCES.ANALYTICS_PERMISSIONS.RM_ANALYTICS,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.analytics.salesOrdersItemRawMaterial,
    component: <ViewItemWiseRmAnalytics />,
    title: 'View | Item Wise RM Analytics',
    moduleName: RESOURCES.ANALYTICS_PERMISSIONS.ITEM_WISE_RM_ANALYTICS,
    permission: 'view',
  },
  {
    path: 'analytics/sales-orders/so-raw-material',
    component: <ViewSalesOrderWiseRmAnalytics />,
    title: 'View | Sales Order Wise RM Analytics',
    moduleName: RESOURCES.ANALYTICS_PERMISSIONS.SO_WISE_RM_ANALYTICS,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.support.root,
    component: <ViewSupport />,
    title: 'Support',
    moduleName: RESOURCES.SUPPORT,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.support.new,
    component: <AddSupport />,
    title: 'Add | Support',
    moduleName: RESOURCES.SUPPORT,
    permission: 'create',
  },
  {
    path: ADMIN_ROUTE_PATHS.support.detail,
    component: <SupportDetail />,
    title: 'View | Support',
    moduleName: RESOURCES.SUPPORT,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.rejections.root,
    component: <ViewRejectionOrders />,
    title: 'Rejections',
    moduleName: RESOURCES.REJECTION_ORDERS,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.rejections.new,
    component: <AddRejectionOrder />,
    title: 'Add | Rejection',
    isAdd: true,
    moduleName: RESOURCES.REJECTION_ORDERS,
    permission: 'create',
  },
  {
    path: ADMIN_ROUTE_PATHS.rejections.edit,
    component: <AddRejectionOrder />,
    title: 'Edit | Rejection',
    isAdd: true,
    moduleName: RESOURCES.REJECTION_ORDERS,
    permission: 'edit',
  },
  {
    path: ADMIN_ROUTE_PATHS.rejections.inventory,
    component: <RejectionInventory />,
    title: 'Rejection Inventory',
    moduleName: RESOURCES.REJECTION_INVENTORY,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.rejections.analysis,
    component: <RejectionAnalysis />,
    title: 'Rejection Analysis',
    moduleName: RESOURCES.REJECTION_ANALYSIS,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.rejections.detail,
    component: <RejectionOrderDetail />,
    title: 'View | Rejection',
    moduleName: RESOURCES.REJECTION_ORDERS,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.complaint.root,
    component: <ViewComplaints />,
    title: 'Complaints',
    moduleName: RESOURCES.COMPLAINT,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.complaint.new,
    component: <AddComplaint />,
    title: 'Add | Complaint',
    isAdd: true,
    moduleName: RESOURCES.COMPLAINT,
    permission: 'create',
  },
  {
    path: ADMIN_ROUTE_PATHS.complaint.edit,
    component: <AddComplaint />,
    title: 'Edit | Complaint',
    isAdd: true,
    moduleName: RESOURCES.COMPLAINT,
    permission: 'edit',
  },
  {
    path: ADMIN_ROUTE_PATHS.complaint.detail,
    component: <ComplaintDetail />,
    title: 'View | Complaint',
    moduleName: RESOURCES.COMPLAINT,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.complaint.problemList,
    component: <ViewProblemList />,
    title: 'Problem List',
    moduleName: RESOURCES.PROBLEM_LIST,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.sparePart.root,
    component: <ViewSpareParts />,
    title: 'Spare Parts',
    moduleName: RESOURCES.SPARE_PART,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.sparePart.new,
    component: <AddSparePart />,
    title: 'Add | Spare Part',
    isAdd: true,
    moduleName: RESOURCES.SPARE_PART,
    permission: 'create',
  },
  {
    path: ADMIN_ROUTE_PATHS.sparePart.edit,
    component: <AddSparePart />,
    title: 'Edit | Spare Part',
    isAdd: true,
    moduleName: RESOURCES.SPARE_PART,
    permission: 'edit',
  },
  {
    path: ADMIN_ROUTE_PATHS.sparePart.detail,
    component: <SparePartDetail />,
    title: 'View | Spare Part',
    moduleName: RESOURCES.SPARE_PART,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.machine.root,
    component: <ViewMachines />,
    title: 'Machines',
    moduleName: RESOURCES.MACHINE,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.machine.new,
    component: <AddMachine />,
    title: 'Add | Machine',
    isAdd: true,
    moduleName: RESOURCES.MACHINE,
    permission: 'create',
  },
  {
    path: ADMIN_ROUTE_PATHS.machine.edit,
    component: <AddMachine />,
    title: 'Edit | Machine',
    isAdd: true,
    moduleName: RESOURCES.MACHINE,
    permission: 'edit',
  },
  {
    path: ADMIN_ROUTE_PATHS.machine.detail,
    component: <MachineDetail />,
    title: 'View | Machine',
    moduleName: RESOURCES.MACHINE,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.maintenanceRequest.root,
    component: <ViewMaintenanceRequest />,
    title: 'Maintenance Requests',
    moduleName: RESOURCES.MAINTENANCE_REQUEST,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.maintenanceRequest.detail,
    component: <MaintenanceRequestDetail />,
    title: 'View | Maintenance Request',
    moduleName: RESOURCES.MAINTENANCE_REQUEST,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.maintenancePurchase.root,
    component: <ViewMaintenancePurchase />,
    title: 'Maintenance Purchases',
    moduleName: RESOURCES.MAINTENANCE_PURCHASE,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.maintenancePurchase.new,
    component: <AddMaintenancePurchase />,
    title: 'Add | Maintenance Purchase',
    isAdd: true,
    moduleName: RESOURCES.MAINTENANCE_PURCHASE,
    permission: 'create',
  },
  {
    path: ADMIN_ROUTE_PATHS.maintenancePurchase.detail,
    component: <MaintenancePurchaseDetail />,
    title: 'View | Maintenance Purchase',
    moduleName: RESOURCES.MAINTENANCE_PURCHASE,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.partRequest.root,
    component: <ViewPartRequest />,
    title: 'Part Requests',
    moduleName: RESOURCES.PART_REQUEST,
    permission: 'view',
  },
  {
    path: ADMIN_ROUTE_PATHS.spareStockLedger.root,
    component: <ViewSpareStockLedger />,
    title: 'Spare Stock Ledger',
    moduleName: RESOURCES.SPARE_STOCK_LEDGER,
    permission: 'view',
  },
];

export default AdminRoutes;
