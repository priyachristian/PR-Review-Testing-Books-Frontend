import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

const buildStockAlertRoute = notification => {
  const items = Array.isArray(notification?.data?.items) ? notification.data.items : [];
  const params = new URLSearchParams({
    page: '1',
    limit: String(DEFAULT_PAGE_SIZE),
  });

  const itemIds = [...new Set(items.map(item => item?.itemId).filter(Boolean))];
  if (itemIds.length > 0) {
    params.set('itemIds', itemIds.join(','));
  }

  return `view-inventory?${params.toString()}`;
};

const TYPE_ROUTE_MAP = {
  CUSTOMER_ORDER_SENT: ({ actionId }) => (actionId ? `customer-orders/${actionId}` : 'customer-orders'),
  CUSTOMER_ORDER_UPDATED: ({ actionId }) => (actionId ? `customer-orders/${actionId}` : 'customer-orders'),
  STOCK_MIN_MAX_LEVEL: buildStockAlertRoute,
};

export const getNotificationRoute = notification => {
  if (!notification?.type) return null;
  const resolver = TYPE_ROUTE_MAP[notification.type];
  if (!resolver) return null;
  return resolver(notification);
};
