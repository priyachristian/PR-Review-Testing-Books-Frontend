import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { Input, Tooltip } from '@/components/AntDComponent';
import useModulePermissions from '@/hooks/useModulePermissions';
import Icons from '@/assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { ANALYTICS_TOOLTIPS } from '@/utils/constants';
import { colorPalette } from '@/utils/theme';

const SECTION_ICONS = {
  'Sales & Orders': Icons.ShoppingOutlined,
  'Customer Analytics': Icons.TeamOutlined,
  'Item Analytics': Icons.AppstoreOutlined,
  'Purchase & Vendors': Icons.ShoppingCartOutlined,
  'Receivables & Collections': Icons.DollarOutlined,
  'Payables & Payments': Icons.SendOutlined,
  'Raw Material Analytics': Icons.DatabaseOutlined,
  'Production & Quality': Icons.BarChartOutlined,
  'Inventory & Stock': Icons.BankOutlined,
};

const ITEM_TOOLTIPS = {
  item: ANALYTICS_TOOLTIPS.ITEM_ANALYTICS,
  'item/group-item': ANALYTICS_TOOLTIPS.GROUP_ITEM,
  'sales-orders': ANALYTICS_TOOLTIPS.SALES_ORDERS,
  customerWiseSalesOrderAnalysis: ANALYTICS_TOOLTIPS.CUSTOMER_WISE_PENDING_ORDER,
  'sales-orders/item': ANALYTICS_TOOLTIPS.SALES_ITEM_WISE,
  'new-vs-old-customer/customer': ANALYTICS_TOOLTIPS.SALES_CUSTOMER_WISE,
  'sales-orders/top-customers': ANALYTICS_TOOLTIPS.SALES_TOP_CUSTOMERS,
  'sales-orders/customer-wise-performance': ANALYTICS_TOOLTIPS.CUSTOMER_WISE_BUSINESS_PERFORMANCE,
  'sales-orders/top-items': ANALYTICS_TOOLTIPS.SALES_TOP_ITEMS,
  'sales-orders/customers-single-invoice': ANALYTICS_TOOLTIPS.CUSTOMER_ONE_INVOICE,
  'sales-orders/general-sales': ANALYTICS_TOOLTIPS.GENERAL_SALES_ANALYTICS,
  'purchase/top-vendors-amount': ANALYTICS_TOOLTIPS.PURCHASE_TOP_VENDOR_AMOUNT,
  'purchase/top-vendors-revenue': ANALYTICS_TOOLTIPS.PURCHASE_VENDOR_BY_PURCHASE,
  'purchase/top-item-of-purchase': ANALYTICS_TOOLTIPS.PURCHASE_TOP_ITEM_OF_PURCHASE,
  'collection/top-customer-amount': ANALYTICS_TOOLTIPS.COLLECTION_TOP_CUSTOMER,
  'collection/upcoming-receivables-invoice': ANALYTICS_TOOLTIPS.COLLECTION_UPCOMING_INVOICE,
  'collection/recently-received-payments': ANALYTICS_TOOLTIPS.COLLECTION_RECENT_PAYMENTS,
  'collection/overdue-invoices': ANALYTICS_TOOLTIPS.COLLECTION_OVERDUE,
  'production/rejection': 'Tracks FG rejection rates, raw material waste, and process-step losses across all production orders.',
  'production/item-rejection': ANALYTICS_TOOLTIPS.ITEM_REJECTION_ANALYTICS,
  'production/item-process': 'Tracks quantity transferred between production process steps, per item.',
  'production/monthly-report': 'Month-wise breakdown of production orders, planned vs completed quantity, FG submissions and rejections.',
  'stock/summary': ANALYTICS_TOOLTIPS.STOCK_SUMMARY,
  'payments/top-vendors-amount': ANALYTICS_TOOLTIPS.PAYMENTS_TOP_VENDOR,
  'payments/upcoming-payables-bills': ANALYTICS_TOOLTIPS.PAYMENTS_UPCOMING,
  'payments/recently-payments-made': ANALYTICS_TOOLTIPS.PAYMENTS_RECENT,
  'payments/overdue-bills': ANALYTICS_TOOLTIPS.PAYMENTS_OVERDUE,
};

const ITEM_ICONS = {
  'sales-orders': Icons.FileDoneOutlined,
  customerWiseSalesOrderAnalysis: Icons.ClockCircleOutlined,
  'sales-orders/item': Icons.AppstoreOutlined,
  'sales-orders/general-sales': Icons.DashboardOutlined,
  'new-vs-old-customer/customer': Icons.SwapOutlined,
  'sales-orders/top-customers': Icons.TrophyOutlined,
  'sales-orders/customer-wise-performance': Icons.RiseOutlined,
  'sales-orders/customers-single-invoice': Icons.FileTextOutlined,
  item: Icons.CodeSandboxOutlined,
  'item/group-item': Icons.GroupOutlined,
  'sales-orders/top-items': Icons.CrownOutlined,
  'purchase/top-vendors-amount': Icons.ShopOutlined,
  'purchase/top-vendors-revenue': Icons.ShoppingCartOutlined,
  'purchase/top-item-of-purchase': Icons.TagsOutlined,
  'collection/top-customer-amount': Icons.TeamOutlined,
  'collection/upcoming-receivables-invoice': Icons.CalendarOutlined,
  'collection/recently-received-payments': Icons.WalletOutlined,
  'collection/overdue-invoices': Icons.WarningOutlined,
  'payments/top-vendors-amount': Icons.BankOutlined,
  'payments/upcoming-payables-bills': Icons.HistoryOutlined,
  'payments/recently-payments-made': Icons.CreditCardOutlined,
  'payments/overdue-bills': Icons.FileExclamationOutlined,
  'sales-orders/raw-material': Icons.DatabaseOutlined,
  'sales-orders/item/raw-material': Icons.ClusterOutlined,
  'sales-orders/so-raw-material': Icons.BranchesOutlined,
  'production/rejection': Icons.StopOutlined,
  'production/item-rejection': Icons.BoxPlotOutlined,
  'production/item-process': Icons.ApartmentOutlined,
  'production/monthly-report': Icons.FileSyncOutlined,
  'stock/summary': Icons.InboxOutlined,
};

const p = colorPalette.primary;

const ViewAnalytics = () => {
  const { useModuleItemAnalytics } = useModulePermissions(RESOURCES.ANALYTICS_PERMISSIONS.ITEM_ANALYTICS);
  const { useModuleGroupItemAnalytics } = useModulePermissions(RESOURCES.ANALYTICS_PERMISSIONS.GROUP_ITEM_ANALYTICS);
  const { useModuleSalesOrdersAnalytics } = useModulePermissions(RESOURCES.ANALYTICS_PERMISSIONS.SALES_ORDERS_ANALYTICS);
  const { useModuleCustomerWiseSalesOrdersAnalytics } = useModulePermissions(RESOURCES.ANALYTICS_PERMISSIONS.CUSTOMER_WISE_SALES_ORDERS_ANALYTICS);
  const { useModuleItemWiseSalesOrdersAnalytics } = useModulePermissions(RESOURCES.ANALYTICS_PERMISSIONS.ITEM_WISE_SALES_ORDERS_ANALYTICS);
  const { useModuleNewVsOldCustomerReport } = useModulePermissions(RESOURCES.ANALYTICS_PERMISSIONS.NEW_VS_OLD_CUSTOMER_REPORT);
  const { useModuleTopCustomersOfSales } = useModulePermissions(RESOURCES.ANALYTICS_PERMISSIONS.TOP_CUSTOMERS_OF_SALES);
  const { useModuleCustomerWiseBusinessPerformance } = useModulePermissions(RESOURCES.ANALYTICS_PERMISSIONS.CUSTOMER_WISE_BUSINESS_PERFORMANCE);
  const { useModuleTopItemsOfSales } = useModulePermissions(RESOURCES.ANALYTICS_PERMISSIONS.TOP_ITEMS_OF_SALES);
  const { useModuleCustomerOneInvoice } = useModulePermissions(RESOURCES.ANALYTICS_PERMISSIONS.CUSTOMER_ONE_INVOICE);
  const { useModuleTopVendorsByAmountPurchase } = useModulePermissions(RESOURCES.ANALYTICS_PERMISSIONS.TOP_VENDORS_BY_AMOUNT_PURCHASE);
  const { useModuleVendorsByPurchase } = useModulePermissions(RESOURCES.ANALYTICS_PERMISSIONS.VENDORS_BY_PURCHASE);
  const { useModuleTopItemOfPurchase } = useModulePermissions(RESOURCES.ANALYTICS_PERMISSIONS.TOP_ITEM_OF_PURCHASE);
  const { useModuleTopCustomerByAmountCollection } = useModulePermissions(RESOURCES.ANALYTICS_PERMISSIONS.TOP_CUSTOMER_BY_AMOUNT_COLLECTION);
  const { useModuleUpcomingReceivablesInvoice } = useModulePermissions(RESOURCES.ANALYTICS_PERMISSIONS.UPCOMING_RECEIVABLES_INVOICE);
  const { useModuleRecentlyReceivedPayments } = useModulePermissions(RESOURCES.ANALYTICS_PERMISSIONS.RECENTLY_RECEIVED_PAYMENTS);
  const { useModuleOverdueInvoices } = useModulePermissions(RESOURCES.ANALYTICS_PERMISSIONS.OVERDUE_INVOICES);
  const { useModuleTopVendorsByAmountPayments } = useModulePermissions(RESOURCES.ANALYTICS_PERMISSIONS.TOP_VENDORS_BY_AMOUNT_PAYMENTS);
  const { useModuleUpcomingPayablesBills } = useModulePermissions(RESOURCES.ANALYTICS_PERMISSIONS.UPCOMING_PAYABLES_BILLS);
  const { useModuleRecentlyPaymentsMade } = useModulePermissions(RESOURCES.ANALYTICS_PERMISSIONS.RECENTLY_PAYMENTS_MADE);
  const { useModuleOverdueBills } = useModulePermissions(RESOURCES.ANALYTICS_PERMISSIONS.OVERDUE_BILLS);
  const { useModuleGeneralSalesAnalytics } = useModulePermissions(RESOURCES.ANALYTICS_PERMISSIONS.GENERAL_SALES_ANALYTICS);
  const { useModuleRmAnalytics } = useModulePermissions(RESOURCES.ANALYTICS_PERMISSIONS.RM_ANALYTICS);
  const { useModuleItemWiseRmAnalytics } = useModulePermissions(RESOURCES.ANALYTICS_PERMISSIONS.ITEM_WISE_RM_ANALYTICS);
  const { useModuleSoWiseRmAnalytics } = useModulePermissions(RESOURCES.ANALYTICS_PERMISSIONS.SO_WISE_RM_ANALYTICS);
  const { useModuleRejectionAnalytics } = useModulePermissions(RESOURCES.ANALYTICS_PERMISSIONS.REJECTION_ANALYTICS);
  const { useModuleItemRejectionAnalytics } = useModulePermissions(RESOURCES.ANALYTICS_PERMISSIONS.ITEM_REJECTION_ANALYTICS);
  const { useModuleItemProcessAnalytics } = useModulePermissions(RESOURCES.ANALYTICS_PERMISSIONS.ITEM_PROCESS_ANALYTICS);
  const { useModuleMonthlyProductionReport } = useModulePermissions(RESOURCES.ANALYTICS_PERMISSIONS.MONTHLY_PRODUCTION_REPORT);
  const { useModuleStockSummary } = useModulePermissions(RESOURCES.ANALYTICS_PERMISSIONS.STOCK_SUMMARY);

  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  const focusSearch = () => {
    searchInputRef.current?.focus?.();
  };

  useEffect(() => {
    const handleKeyDown = e => {
      if (e.key !== '/') return;
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable) return;
      e.preventDefault();
      focusSearch();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const sections = [
    {
      key: 'Sales & Orders',
      child: [
        { name: 'Sales Orders Analytics', path: 'sales-orders', isAccessible: useModuleSalesOrdersAnalytics?.canView },
        { name: 'Customer-wise Pending Orders', path: 'customerWiseSalesOrderAnalysis', isAccessible: useModuleCustomerWiseSalesOrdersAnalytics?.canView },
        { name: 'Item-wise Sales Orders', path: 'sales-orders/item', isAccessible: useModuleItemWiseSalesOrdersAnalytics?.canView },
        { name: 'General Sales Analytics', path: 'sales-orders/general-sales', isAccessible: useModuleGeneralSalesAnalytics?.canView },
      ],
    },
    {
      key: 'Customer Analytics',
      child: [
        { name: 'New vs Old Customers', path: 'new-vs-old-customer/customer', isAccessible: useModuleNewVsOldCustomerReport?.canView },
        { name: 'Top Customers by Sales', path: 'sales-orders/top-customers', isAccessible: useModuleTopCustomersOfSales?.canView },
        { name: 'Customer-wise Business Performance', path: 'sales-orders/customer-wise-performance', isAccessible: useModuleCustomerWiseBusinessPerformance?.canView },
        { name: 'Customers with Single Invoice', path: 'sales-orders/customers-single-invoice', isAccessible: useModuleCustomerOneInvoice?.canView },
      ],
    },
    {
      key: 'Item Analytics',
      child: [
        { name: 'Item Analytics', path: 'item', isAccessible: useModuleItemAnalytics?.canView },
        { name: 'Item Group Analytics', path: 'item/group-item', isAccessible: useModuleGroupItemAnalytics?.canView },
        { name: 'Top Items by Sales', path: 'sales-orders/top-items', isAccessible: useModuleTopItemsOfSales?.canView },
      ],
    },
    {
      key: 'Purchase & Vendors',
      child: [
        { name: 'Top Vendors by Amount', path: 'purchase/top-vendors-amount', isAccessible: useModuleTopVendorsByAmountPurchase?.canView },
        { name: 'Top Vendors by Purchase', path: 'purchase/top-vendors-revenue', isAccessible: useModuleVendorsByPurchase?.canView },
        { name: 'Top Items by Purchase', path: 'purchase/top-item-of-purchase', isAccessible: useModuleTopItemOfPurchase?.canView },
      ],
    },
    {
      key: 'Receivables & Collections',
      child: [
        { name: 'Top Customers by Amount', path: 'collection/top-customer-amount', isAccessible: useModuleTopCustomerByAmountCollection?.canView },
        { name: 'Upcoming Receivables', path: 'collection/upcoming-receivables-invoice', isAccessible: useModuleUpcomingReceivablesInvoice?.canView },
        { name: 'Recently Received Payments', path: 'collection/recently-received-payments', isAccessible: useModuleRecentlyReceivedPayments?.canView },
        { name: 'Overdue Invoices', path: 'collection/overdue-invoices', isAccessible: useModuleOverdueInvoices?.canView },
      ],
    },
    {
      key: 'Payables & Payments',
      child: [
        { name: 'Top Vendors by Amount', path: 'payments/top-vendors-amount', isAccessible: useModuleTopVendorsByAmountPayments?.canView },
        { name: 'Upcoming Payables', path: 'payments/upcoming-payables-bills', isAccessible: useModuleUpcomingPayablesBills?.canView },
        { name: 'Recent Payments Made', path: 'payments/recently-payments-made', isAccessible: useModuleRecentlyPaymentsMade?.canView },
        { name: 'Overdue Bills', path: 'payments/overdue-bills', isAccessible: useModuleOverdueBills?.canView },
      ],
    },
    {
      key: 'Raw Material Analytics',
      child: [
        { name: 'Raw Material Analytics', path: 'sales-orders/raw-material', isAccessible: useModuleRmAnalytics?.canView },
        { name: 'Item-wise RM Analytics', path: 'sales-orders/item/raw-material', isAccessible: useModuleItemWiseRmAnalytics?.canView },
        { name: 'Sales Order-wise RM Analytics', path: 'sales-orders/so-raw-material', isAccessible: useModuleSoWiseRmAnalytics?.canView },
      ],
    },
    {
      key: 'Production & Quality',
      child: [
        { name: 'Rejection Analytics', path: 'production/rejection', isAccessible: useModuleRejectionAnalytics?.canView },
        { name: 'Item Rejection Analytics', path: 'production/item-rejection', isAccessible: useModuleItemRejectionAnalytics?.canView },
        { name: 'Item Process Analytics', path: 'production/item-process', isAccessible: useModuleItemProcessAnalytics?.canView },
        { name: 'Monthly Production Report', path: 'production/monthly-report', isAccessible: useModuleMonthlyProductionReport?.canView },
      ],
    },
    {
      key: 'Inventory & Stock',
      child: [{ name: 'Stock Summary Report', path: 'stock/summary', isAccessible: useModuleStockSummary?.canView }],
    },
  ];

  const needle = searchQuery.trim().toLowerCase();
  const blocks = sections
    .map(section => ({
      ...section,
      child: section.child.filter(item => item.isAccessible && (!needle || item.name.toLowerCase().includes(needle))),
    }))
    .filter(section => section.child.length > 0);
  const reportTotal = blocks.reduce((sum, section) => sum + section.child.length, 0);
  const categoryTotal = blocks.length;

  return (
    <div className="-m-4 min-h-[calc(100vh-57px)]" style={{ backgroundColor: colorPalette.neutral[50] }}>
      <div className="px-6 py-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-[18px] font-bold text-heading leading-tight">All analytics</h1>
            {categoryTotal > 0 ? (
              <p className="text-[13px] text-gray-500 mt-1">
                {reportTotal} {reportTotal === 1 ? 'report' : 'reports'} across {categoryTotal} {categoryTotal === 1 ? 'category' : 'categories'}
              </p>
            ) : null}
          </div>

          <div className="w-full lg:w-72 shrink-0">
            <Input
              ref={searchInputRef}
              allowClear
              prefix={<Icons.SearchOutlined className="text-gray-400" />}
              suffix={
                !searchQuery ? (
                  <button
                    type="button"
                    tabIndex={-1}
                    onMouseDown={e => e.preventDefault()}
                    onClick={e => {
                      e.stopPropagation();
                      focusSearch();
                    }}
                    className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded border border-gray-200 bg-gray-50 text-[11px] font-medium text-gray-400 leading-none hover:text-gray-600 hover:border-gray-300"
                    aria-label="Focus search"
                  >
                    /
                  </button>
                ) : null
              }
              placeholder="Search analytics"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onClear={focusSearch}
              className="rounded-md"
            />
          </div>
        </div>

        {blocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Icons.SearchOutlined className="text-2xl text-gray-300 mb-3" />
            <p className="text-sm font-medium text-heading">{needle ? `No analytics match “${searchQuery.trim()}”` : 'No analytics available'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {blocks.map(section => {
              const SectionIcon = SECTION_ICONS[section.key] || Icons.BarChartOutlined;
              return (
                <article key={section.key} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
                  <header className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-200" style={{ backgroundColor: colorPalette.neutral[50] }}>
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-md text-sm shrink-0" style={{ backgroundColor: '#fff', color: p[500], border: `1px solid ${p[200]}` }}>
                      <SectionIcon />
                    </span>
                    <h2 className="text-sm font-semibold text-heading leading-tight truncate">{section.key}</h2>
                  </header>

                  <ul className="flex-1 divide-y divide-gray-100">
                    {section.child.map(item => {
                      const ItemIcon = ITEM_ICONS[item.path] || Icons.BarChartOutlined;
                      return (
                        <li key={item.path} className="group relative flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[--hub-hover]" style={{ '--hub-hover': p[50] }}>
                          <Link to={`/analytics/${item.path}`} aria-label={item.name} className="absolute inset-0 z-0 focus-visible:outline-none" />
                          <span
                            className="pointer-events-none relative z-[1] inline-flex items-center justify-center w-7 h-7 rounded-md text-sm shrink-0 text-gray-500 transition-colors group-hover:text-primary"
                            style={{ backgroundColor: colorPalette.neutral[100], border: `1px solid ${colorPalette.neutral[200]}` }}
                          >
                            <ItemIcon />
                          </span>
                          <span className="pointer-events-none relative z-[1] text-[13px] font-medium text-heading leading-tight group-hover:text-primary">{item.name}</span>
                          <Tooltip title={ITEM_TOOLTIPS[item.path] || 'No description available'} placement="right">
                            <button
                              type="button"
                              aria-label={`${item.name} details`}
                              className="relative z-[1] inline-flex shrink-0 cursor-pointer border-0 bg-transparent p-0"
                              style={{ color: colorPalette.primary[500] }}
                            >
                              <Icons.InfoCircleOutlined />
                            </button>
                          </Tooltip>
                        </li>
                      );
                    })}
                  </ul>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewAnalytics;
