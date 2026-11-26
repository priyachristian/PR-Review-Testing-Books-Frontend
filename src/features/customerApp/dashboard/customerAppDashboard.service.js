import axiosConfig from 'app/axiosConfig';
import { API_ROUTES } from '@/utils/apiRoute';
import { withErrorHandling } from '@/utils/serviceHelper';

const readTotal = settled => (settled.status === 'fulfilled' ? (settled.value?.extras?.totalResults ?? 0) : 0);
const readList = settled => (settled.status === 'fulfilled' ? (settled.value?.data ?? []) : []);
const readExtras = settled => (settled.status === 'fulfilled' ? (settled.value?.extras ?? null) : null);

const fetchList = async (url, params = {}) => {
  const response = await axiosConfig.get(url, { params: { page: 1, pagination: true, ...params } });
  return response.data;
};

const getDashboardData = withErrorHandling(async () => {
  const orderBase = API_ROUTES.CUSTOMER_ORDER.BASE;
  const paymentBase = API_ROUTES.CUSTOMER_PAYMENT.BASE;
  const customerBase = API_ROUTES.SALES.CUSTOMER.BASE;

  // allSettled so one failing endpoint does not zero out the whole dashboard
  const [total, sent, accepted, completed, recentOrders, recentPayments, pendingApprovals] = await Promise.allSettled([
    fetchList(orderBase, { limit: 1 }),
    fetchList(orderBase, { limit: 1, status: 'SENT' }),
    fetchList(orderBase, { limit: 1, status: 'ACCEPTED' }),
    fetchList(orderBase, { limit: 1, status: 'COMPLETED' }),
    fetchList(orderBase, { limit: 5, sortBy: 'createdAt:desc' }),
    fetchList(paymentBase, { limit: 5, sortBy: 'createdAt:desc' }),
    fetchList(customerBase, { limit: 1, isCustomer: true, verificationStatus: 'PENDING' }),
  ]);

  const recentOrderExtras = readExtras(recentOrders);

  return {
    stats: {
      totalOrders: readTotal(total),
      sentOrders: readTotal(sent),
      acceptedOrders: readTotal(accepted),
      completedOrders: readTotal(completed),
      pendingApprovals: readTotal(pendingApprovals),
    },
    recentOrders: readList(recentOrders),
    recentPayments: readList(recentPayments),
    currency: recentOrderExtras?.currency ?? null,
  };
}, 'getDashboardData');

export const customerAppDashboardService = { getDashboardData };
