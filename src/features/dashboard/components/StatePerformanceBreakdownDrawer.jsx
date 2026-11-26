import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

// Components
import { Tag, Tooltip } from '@/components/AntDComponent';
import BreakdownDrawer from '@/components/dataDisplay/drawer/BreakdownDrawer';
import InfiniteScrollTable from '@/components/dataDisplay/appTable/InfiniteScrollTable';

// Extras
import { useSalesDashboard } from '@/hooks/useSalesDashboard';
import { formatAmount } from '@/utils/currency';
import { colorPalette } from '@/utils/theme';
import Icons from '@/assets/icons/icon';
import { TruncatedCell } from '@/utils/tableColumns';

const PRIMARY = colorPalette.primary[500];
// Tab keys double as the `tab` query param sent to GET /sales-dashboard/state-wise/details/:stateId
const BREAKDOWN_TAB = { ITEM: 'item', CUSTOMER: 'customer' };

/** Reflects the currently active `field:asc|desc` sortBy as antd's sortOrder for a given column. */
const sortOrderFor = (sortBy, field) => {
  const [sortField, sortDir] = (sortBy || '').split(':');
  // Must be `undefined`, not `null`, for non-active columns — AntD treats any column with a defined
  // `sortOrder` (even null) as individually controlled, and once more than one column is "controlled"
  // it switches `onChange`'s sorter argument to an array, breaking the plain-object destructuring below.
  return sortField === field ? (sortDir === 'asc' ? 'ascend' : 'descend') : undefined;
};

const itemBreakdownColumns = sortBy => [
  {
    title: 'Item#',
    dataIndex: 'itemId',
    key: 'itemId',
    fixed: 'left',
    width: 120,
    render: (_, record) => (
      <Link to={`/item-master/${record?.itemId}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
        <Tag className="font-semibold">{record?.itemNo}</Tag>
      </Link>
    ),
  },
  {
    title: 'Item',
    dataIndex: 'itemName',
    key: 'itemName',
    render: text => <TruncatedCell value={text} />,
    sorter: true,
    sortOrder: sortOrderFor(sortBy, 'itemName'),
  },
  { title: 'Sales Orders', dataIndex: 'salesOrderCount', key: 'salesOrderCount', width: 140, sorter: true, sortOrder: sortOrderFor(sortBy, 'salesOrderCount') },
  { title: 'Sales Order Qty', dataIndex: 'salesOrderQty', key: 'salesOrderQty', width: 140, sorter: true, sortOrder: sortOrderFor(sortBy, 'salesOrderQty') },
  {
    title: 'Sales Order Amount',
    dataIndex: 'salesOrderAmount',
    key: 'salesOrderAmount',
    render: v => formatAmount(v),
    sorter: true,
    sortOrder: sortOrderFor(sortBy, 'salesOrderAmount'),
  },
  { title: 'Invoices', dataIndex: 'invoiceCount', key: 'invoiceCount', width: 100, sorter: true, sortOrder: sortOrderFor(sortBy, 'invoiceCount') },
  { title: 'Invoice Qty', dataIndex: 'invoiceQty', key: 'invoiceQty', width: 110, sorter: true, sortOrder: sortOrderFor(sortBy, 'invoiceQty') },
  {
    title: 'Actual Sales',
    dataIndex: 'actualSales',
    key: 'actualSales',
    render: v => (v ? formatAmount(v) : null),
    sorter: true,
    sortOrder: sortOrderFor(sortBy, 'actualSales'),
  },
];

const customerBreakdownColumns = sortBy => [
  {
    title: 'Customer#',
    dataIndex: 'customerId',
    key: 'customerId',
    fixed: 'left',
    width: 130,
    render: (_, record) => (
      <Link to={`/customer-master/${record?.customerId}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
        <Tag className="font-semibold">{record?.customerNumber}</Tag>
      </Link>
    ),
  },
  {
    title: 'Customer',
    dataIndex: 'customerName',
    key: 'customerName',
    render: val => (
      <Tooltip title={val}>
        <span className="font-medium text-gray-800 line-clamp-1 max-w-[220px] inline-block align-middle">{val}</span>
      </Tooltip>
    ),
    sorter: true,
    sortOrder: sortOrderFor(sortBy, 'customerName'),
  },
  { title: 'Sales Orders', dataIndex: 'salesOrderCount', key: 'salesOrderCount', width: 140, sorter: true, sortOrder: sortOrderFor(sortBy, 'salesOrderCount') },
  {
    title: 'Sales Order Amount',
    dataIndex: 'salesOrderAmount',
    key: 'salesOrderAmount',
    render: v => formatAmount(v),
    sorter: true,
    sortOrder: sortOrderFor(sortBy, 'salesOrderAmount'),
  },
  { title: 'Invoices', dataIndex: 'invoiceCount', key: 'invoiceCount', width: 100, sorter: true, sortOrder: sortOrderFor(sortBy, 'invoiceCount') },
  {
    title: 'Actual Sales',
    dataIndex: 'actualSales',
    key: 'actualSales',
    render: v => (v ? formatAmount(v) : null),
    sorter: true,
    sortOrder: sortOrderFor(sortBy, 'actualSales'),
  },
  { title: 'Collection', dataIndex: 'collection', key: 'collection', render: v => formatAmount(v), sorter: true, sortOrder: sortOrderFor(sortBy, 'collection') },
  {
    title: 'Due Amount',
    dataIndex: 'dueAmount',
    key: 'dueAmount',
    render: v => (v > 0 ? <span className="font-semibold text-red-500">{formatAmount(v)}</span> : null),
    sorter: true,
    sortOrder: sortOrderFor(sortBy, 'dueAmount'),
  },
];

/**
 * Drawer opened from the State-wise performance table's state name — shows, in tabs, how that
 * state's sales break down by item and by customer, via
 * GET /sales-dashboard/state-wise/details/:stateId?tab=item|customer.
 */
const StatePerformanceBreakdownDrawer = ({ open, onClose, state, buildPayload }) => {
  const stateId = state?.stateId;
  const stateName = state?.stateName;

  const {
    stateItemBreakdown,
    stateCustomerBreakdown,
    stateItemBreakdownLoading,
    stateItemBreakdownScrollLoading,
    stateCustomerBreakdownLoading,
    stateCustomerBreakdownScrollLoading,
    getStateWiseDetails,
    resetStateItemBreakdown,
    resetStateCustomerBreakdown,
  } = useSalesDashboard();

  const [activeTab, setActiveTab] = useState(BREAKDOWN_TAB.ITEM);
  const loadedTabsRef = useRef({ [BREAKDOWN_TAB.ITEM]: false, [BREAKDOWN_TAB.CUSTOMER]: false });
  const [itemSortBy, setItemSortBy] = useState(undefined);
  const [customerSortBy, setCustomerSortBy] = useState(undefined);

  // Reset + load the default tab whenever the drawer opens for a (new) state
  useEffect(() => {
    if (!open || !stateId) return;

    setActiveTab(BREAKDOWN_TAB.ITEM);
    setItemSortBy(undefined);
    setCustomerSortBy(undefined);
    loadedTabsRef.current = { [BREAKDOWN_TAB.ITEM]: true, [BREAKDOWN_TAB.CUSTOMER]: false };
    resetStateItemBreakdown();
    resetStateCustomerBreakdown();
    getStateWiseDetails({ ...buildPayload(), stateId, tab: BREAKDOWN_TAB.ITEM, page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, stateId]);

  const handleTabChange = key => {
    setActiveTab(key);
    if (loadedTabsRef.current[key]) return;
    loadedTabsRef.current[key] = true;
    getStateWiseDetails({ ...buildPayload(), stateId, tab: key, page: 1 });
  };

  const loadMoreItems = useCallback(() => {
    getStateWiseDetails({ ...buildPayload(), stateId, tab: BREAKDOWN_TAB.ITEM, page: (stateItemBreakdown?.page || 1) + 1, sortBy: itemSortBy });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildPayload, stateId, stateItemBreakdown?.page, itemSortBy]);

  const loadMoreCustomers = useCallback(() => {
    getStateWiseDetails({ ...buildPayload(), stateId, tab: BREAKDOWN_TAB.CUSTOMER, page: (stateCustomerBreakdown?.page || 1) + 1, sortBy: customerSortBy });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildPayload, stateId, stateCustomerBreakdown?.page, customerSortBy]);

  const handleItemSortChange = (_, __, sorter) => {
    const s = Array.isArray(sorter) ? sorter[0] : sorter;
    const nextSortBy = s?.order ? `${s.field}:${s.order === 'ascend' ? 'asc' : 'desc'}` : undefined;
    setItemSortBy(nextSortBy);
    getStateWiseDetails({ ...buildPayload(), stateId, tab: BREAKDOWN_TAB.ITEM, page: 1, sortBy: nextSortBy });
  };

  const handleCustomerSortChange = (_, __, sorter) => {
    const s = Array.isArray(sorter) ? sorter[0] : sorter;
    const nextSortBy = s?.order ? `${s.field}:${s.order === 'ascend' ? 'asc' : 'desc'}` : undefined;
    setCustomerSortBy(nextSortBy);
    getStateWiseDetails({ ...buildPayload(), stateId, tab: BREAKDOWN_TAB.CUSTOMER, page: 1, sortBy: nextSortBy });
  };

  const itemRows = stateItemBreakdown?.rows || [];
  const customerRows = stateCustomerBreakdown?.rows || [];
  const itemHasMore = (stateItemBreakdown?.page || 0) < (stateItemBreakdown?.totalPages || 0);
  const customerHasMore = (stateCustomerBreakdown?.page || 0) < (stateCustomerBreakdown?.totalPages || 0);

  const tabs = [
    {
      key: BREAKDOWN_TAB.ITEM,
      label: 'Item-wise Breakdown',
      children: (
        <InfiniteScrollTable
          columns={itemBreakdownColumns(itemSortBy)}
          data={itemRows}
          rowKey="itemId"
          tableId="state-item-breakdown"
          loading={stateItemBreakdownLoading}
          scrollLoading={stateItemBreakdownScrollLoading}
          hasMore={itemHasMore}
          onLoadMore={loadMoreItems}
          onChange={handleItemSortChange}
        />
      ),
    },
    {
      key: BREAKDOWN_TAB.CUSTOMER,
      label: 'Customer-wise Breakdown',
      children: (
        <InfiniteScrollTable
          columns={customerBreakdownColumns(customerSortBy)}
          data={customerRows}
          rowKey="customerId"
          tableId="state-customer-breakdown"
          loading={stateCustomerBreakdownLoading}
          scrollLoading={stateCustomerBreakdownScrollLoading}
          hasMore={customerHasMore}
          onLoadMore={loadMoreCustomers}
          onChange={handleCustomerSortChange}
        />
      ),
    },
  ];

  return (
    <BreakdownDrawer
      open={open}
      onClose={onClose}
      width={1000}
      expandable
      icon={<Icons.EnvironmentOutlined style={{ color: PRIMARY }} />}
      title={stateName}
      titleFallback="State Details"
      tabs={tabs}
      activeTabKey={activeTab}
      onTabChange={handleTabChange}
    />
  );
};

export default StatePerformanceBreakdownDrawer;
