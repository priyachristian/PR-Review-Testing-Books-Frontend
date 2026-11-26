import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Skeleton, Table } from '@/components/AntDComponent';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import Icons from 'assets/icons/icon';
import { colorPalette } from '@/utils/theme';
import { formatAmount } from '@/utils/currency';
import { CUSTOMER_ORDER_STATUS, CUSTOMER_PAYMENT_STATUS } from 'utils/constants';
import { ADMIN_ROUTE_PATHS } from 'routes/adminRoutePaths';
import { useCustomerAppDashboard } from '@/features/customerApp/dashboard';

const TABLE_EMPTY = (
  <div className="flex flex-col items-center justify-center gap-2 h-full min-h-[180px] py-4">
    <div className="w-9 h-9 bg-gray-100 rounded-md flex items-center justify-center">
      <Icons.InboxOutlined className="text-base text-gray-400" />
    </div>
    <p className="text-sm font-medium text-gray-500 mb-0">No records found</p>
  </div>
);

const TABLE_FILL_CLASS =
  'flex-1 min-h-0 [&_.ant-table-wrapper]:h-full [&_.ant-spin-nested-loading]:h-full [&_.ant-spin-container]:h-full [&_.ant-table]:h-full [&_.ant-table-container]:h-full [&_.ant-table-content]:h-full [&_table]:h-full [&_.ant-table-placeholder]:h-full [&_.ant-table-placeholder>td]:h-full [&_.ant-table-tbody>tr.ant-table-placeholder]:h-full';

const PRIMARY = colorPalette.primary[500];

const VARIANT_COLORS = {
  default: { bg: 'rgba(23,133,182,0.08)', text: PRIMARY },
  warning: { bg: 'rgba(245,158,11,0.08)', text: '#f59e0b' },
  success: { bg: 'rgba(34,197,94,0.08)', text: '#16a34a' },
  info: { bg: 'rgba(99,102,241,0.08)', text: '#6366f1' },
  amber: { bg: 'rgba(217,119,6,0.08)', text: '#d97706' },
};

const STAT_CARDS = [
  {
    key: 'totalOrders',
    label: 'Total Orders',
    icon: Icons.ShoppingCartOutlined,
    variant: 'default',
    navigateTo: `/${ADMIN_ROUTE_PATHS.customerOrders.root}`,
  },
  {
    key: 'sentOrders',
    label: 'Pending',
    icon: Icons.ClockCircleOutlined,
    variant: 'warning',
    navigateTo: `/${ADMIN_ROUTE_PATHS.customerOrders.root}?status=SENT`,
  },
  {
    key: 'acceptedOrders',
    label: 'Accepted',
    icon: Icons.CheckCircleOutlined,
    variant: 'success',
    navigateTo: `/${ADMIN_ROUTE_PATHS.customerOrders.root}?status=ACCEPTED`,
  },
  {
    key: 'completedOrders',
    label: 'Completed',
    icon: Icons.FileDoneOutlined,
    variant: 'info',
    navigateTo: `/${ADMIN_ROUTE_PATHS.customerOrders.root}?status=COMPLETED`,
  },
  {
    key: 'pendingApprovals',
    label: 'Pending User Approval',
    icon: Icons.TeamOutlined,
    variant: 'amber',
    navigateTo: `/${ADMIN_ROUTE_PATHS.customerMaster.root}?verificationStatus=PENDING`,
  },
];

const ORDER_COLUMNS = navigate => [
  {
    title: 'Order No.',
    dataIndex: 'customerOrderId',
    key: 'customerOrderId',
    render: (text, record) => (
      <button
        type="button"
        className="bg-transparent border-0 p-0 cursor-pointer text-blue-600 hover:underline text-sm font-medium"
        onClick={() => navigate(`/${ADMIN_ROUTE_PATHS.customerOrders.build.detail(record._id)}`)}
      >
        {text || '-'}
      </button>
    ),
  },
  {
    title: 'Customer',
    dataIndex: 'customerDisplayName',
    key: 'customerDisplayName',
    render: val => <span className="text-sm text-gray-700">{val || '-'}</span>,
  },
  {
    title: 'Amount',
    dataIndex: 'total',
    key: 'total',
    align: 'right',
    render: (val, record) => <span className="text-sm font-medium">{formatAmount(val ?? 0, true, record.currency)}</span>,
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: status => <StatusBadge status={status} value={CUSTOMER_ORDER_STATUS?.[status] || status} />,
  },
];

const PAYMENT_COLUMNS = [
  {
    title: 'Ref No.',
    dataIndex: 'customerPaymentId',
    key: 'customerPaymentId',
    render: val => <span className="text-sm font-medium text-gray-800">{val || '-'}</span>,
  },
  {
    title: 'Customer',
    dataIndex: 'customerId',
    key: 'customerId',
    render: customer => <span className="text-sm text-gray-700">{customer?.customerDisplayName || customer?.companyName || '-'}</span>,
  },
  {
    title: 'Amount',
    dataIndex: 'amount',
    key: 'amount',
    align: 'right',
    render: (val, record) => <span className="text-sm font-medium">{formatAmount(val ?? 0, true, record.currency)}</span>,
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: status => <StatusBadge status={status} value={CUSTOMER_PAYMENT_STATUS?.[status] || status} />,
  },
];

const StatCard = ({ card, value, loading, onClick }) => {
  const Icon = card.icon;
  const colors = VARIANT_COLORS[card.variant] || VARIANT_COLORS.default;

  return (
    <div
      className="bg-white border-r border-b border-gray-200 p-3 sm:p-4 flex items-center gap-3 min-w-0 cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick?.()}
    >
      <div className="p-2 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: colors.bg, color: colors.text }}>
        <Icon className="text-base" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] sm:text-[11px] font-medium text-gray-400 uppercase tracking-wide leading-none mb-1 truncate">{card.label}</p>
        {loading ? <Skeleton.Input active size="small" style={{ width: 48, height: 22 }} /> : <p className="text-sm sm:text-base font-bold leading-tight tabular-nums text-gray-900">{value ?? 0}</p>}
      </div>
    </div>
  );
};

const CustomerAppDashboard = () => {
  const navigate = useNavigate();
  const { stats, recentOrders, recentPayments, loading, getDashboardData } = useCustomerAppDashboard();

  useEffect(() => {
    getDashboardData();
  }, [getDashboardData]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Customer App Dashboard</h1>
        <p className="text-sm text-gray-500">Overview of customer orders and payments</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 border-l border-t border-gray-200">
        {STAT_CARDS.map(card => (
          <StatCard key={card.key} card={card} value={stats?.[card.key]} loading={loading} onClick={() => navigate(card.navigateTo)} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-stretch">
        <div className="border border-gray-200 bg-white overflow-hidden flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
            <span className="text-sm font-semibold text-gray-800">Recent Orders</span>
            <button type="button" className="text-xs text-blue-600 hover:underline bg-transparent border-0 cursor-pointer" onClick={() => navigate(`/${ADMIN_ROUTE_PATHS.customerOrders.root}`)}>
              View all
            </button>
          </div>
          <div className={TABLE_FILL_CLASS}>
            <Table dataSource={recentOrders} columns={ORDER_COLUMNS(navigate)} rowKey="_id" loading={loading} pagination={false} size="small" locale={{ emptyText: TABLE_EMPTY }} />
          </div>
        </div>

        <div className="border border-gray-200 bg-white overflow-hidden flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
            <span className="text-sm font-semibold text-gray-800">Recent Payments</span>
            <button type="button" className="text-xs text-blue-600 hover:underline bg-transparent border-0 cursor-pointer" onClick={() => navigate(`/${ADMIN_ROUTE_PATHS.customerPayments.root}`)}>
              View all
            </button>
          </div>
          <div className={TABLE_FILL_CLASS}>
            <Table dataSource={recentPayments} columns={PAYMENT_COLUMNS} rowKey="_id" loading={loading} pagination={false} size="small" locale={{ emptyText: TABLE_EMPTY }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerAppDashboard;
