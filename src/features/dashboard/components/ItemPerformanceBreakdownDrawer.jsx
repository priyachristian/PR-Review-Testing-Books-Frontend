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

const PRIMARY = colorPalette.primary[500];
// Tab keys double as the `tab` query param sent to GET /sales-dashboard/item-wise/details/:itemId
const BREAKDOWN_TAB = { STATE: 'state', CUSTOMER: 'customer' };

/** Reflects the currently active `field:asc|desc` sortBy as antd's sortOrder for a given column. */
const sortOrderFor = (sortBy, field) => {
  const [sortField, sortDir] = (sortBy || '').split(':');
  // Must be `undefined`, not `null`, for non-active columns — AntD treats any column with a defined
  // `sortOrder` (even null) as individually controlled, and once more than one column is "controlled"
  // it switches `onChange`'s sorter argument to an array, breaking the plain-object destructuring below.
  return sortField === field ? (sortDir === 'asc' ? 'ascend' : 'descend') : undefined;
};

const stateBreakdownColumns = sortBy => [
  { title: 'State', dataIndex: 'state', key: 'state', fixed: 'left', sorter: true, sortOrder: sortOrderFor(sortBy, 'state') },
  { title: 'Sales Orders', dataIndex: 'salesOrderCount', key: 'salesOrderCount', width: 130, sorter: true, sortOrder: sortOrderFor(sortBy, 'salesOrderCount') },
  { title: 'Sales Order Qty', dataIndex: 'salesOrderQty', key: 'salesOrderQty', width: 140, sorter: true, sortOrder: sortOrderFor(sortBy, 'salesOrderQty') },
  {
    title: 'Sales Order Amount',
    dataIndex: 'salesOrderAmount',
    key: 'salesOrderAmount',
    render: v => formatAmount(v),
    sorter: true,
    sortOrder: sortOrderFor(sortBy, 'salesOrderAmount'),
  },
  { title: 'Invoices', dataIndex: 'invoiceCount', key: 'invoiceCount', width: 110, sorter: true, sortOrder: sortOrderFor(sortBy, 'invoiceCount') },
  { title: 'Invoice Qty', dataIndex: 'invoiceQty', key: 'invoiceQty', width: 110, sorter: true, sortOrder: sortOrderFor(sortBy, 'invoiceQty') },
  {
    title: 'Invoice Amount',
    dataIndex: 'invoiceAmount',
    key: 'invoiceAmount',
    render: v => formatAmount(v),
    sorter: true,
    sortOrder: sortOrderFor(sortBy, 'invoiceAmount'),
  },
];

const customerBreakdownColumns = sortBy => [
  {
    title: 'Customer#',
    dataIndex: 'customerId',
    key: 'customerId',
    fixed: 'left',
    width: 120,
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
  { title: 'Sales Orders', dataIndex: 'salesOrderCount', key: 'salesOrderCount', width: 130, sorter: true, sortOrder: sortOrderFor(sortBy, 'salesOrderCount') },
  { title: 'Sales Order Qty', dataIndex: 'salesOrderQty', key: 'salesOrderQty', width: 130, sorter: true, sortOrder: sortOrderFor(sortBy, 'salesOrderQty') },
  {
    title: 'Sales Order Amount',
    dataIndex: 'salesOrderAmount',
    key: 'salesOrderAmount',
    render: v => formatAmount(v),
    sorter: true,
    sortOrder: sortOrderFor(sortBy, 'salesOrderAmount'),
  },
  { title: 'Invoices', dataIndex: 'invoiceCount', key: 'invoiceCount', width: 110, sorter: true, sortOrder: sortOrderFor(sortBy, 'invoiceCount') },
  { title: 'Invoice Qty', dataIndex: 'invoiceQty', key: 'invoiceQty', width: 110, sorter: true, sortOrder: sortOrderFor(sortBy, 'invoiceQty') },
  {
    title: 'Invoice Amount',
    dataIndex: 'invoiceAmount',
    key: 'invoiceAmount',
    render: v => formatAmount(v),
    sorter: true,
    sortOrder: sortOrderFor(sortBy, 'invoiceAmount'),
  },
];

/**
 * Drawer opened from the Item-wise performance table's "Item#" tag — shows the item's basic
 * details up top and, in tabs, how its sales break down by state and by customer, via
 * GET /sales-dashboard/item-wise/details/:itemId?tab=state|customer. Both the breakdown rows
 * and the basic details (`extras.itemDetails`) come from that single endpoint.
 */
const ItemPerformanceBreakdownDrawer = ({ open, onClose, item, buildPayload }) => {
  const {
    itemStateBreakdown,
    itemCustomerBreakdown,
    itemDetails,
    itemStateBreakdownLoading,
    itemStateBreakdownScrollLoading,
    itemCustomerBreakdownLoading,
    itemCustomerBreakdownScrollLoading,
    getItemWiseDetails,
    resetItemStateBreakdown,
    resetItemCustomerBreakdown,
    resetItemDetails,
  } = useSalesDashboard();

  const [activeTab, setActiveTab] = useState(BREAKDOWN_TAB.STATE);
  const loadedTabsRef = useRef({ [BREAKDOWN_TAB.STATE]: false, [BREAKDOWN_TAB.CUSTOMER]: false });
  const [stateSortBy, setStateSortBy] = useState(undefined);
  const [customerSortBy, setCustomerSortBy] = useState(undefined);

  // Reset + load the default tab whenever the drawer opens for a (new) item
  useEffect(() => {
    if (!open || !item?.itemId) return;

    setActiveTab(BREAKDOWN_TAB.STATE);
    setStateSortBy(undefined);
    setCustomerSortBy(undefined);
    loadedTabsRef.current = { [BREAKDOWN_TAB.STATE]: true, [BREAKDOWN_TAB.CUSTOMER]: false };
    resetItemStateBreakdown();
    resetItemCustomerBreakdown();
    resetItemDetails();
    getItemWiseDetails({ ...buildPayload(), itemId: item.itemId, tab: BREAKDOWN_TAB.STATE, page: 1 });

    return () => {
      resetItemDetails();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item?.itemId]);

  const handleTabChange = key => {
    setActiveTab(key);
    if (loadedTabsRef.current[key]) return;
    loadedTabsRef.current[key] = true;
    getItemWiseDetails({ ...buildPayload(), itemId: item.itemId, tab: key, page: 1 });
  };

  const loadMoreState = useCallback(() => {
    getItemWiseDetails({ ...buildPayload(), itemId: item.itemId, tab: BREAKDOWN_TAB.STATE, page: (itemStateBreakdown?.page || 1) + 1, sortBy: stateSortBy });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildPayload, item?.itemId, itemStateBreakdown?.page, stateSortBy]);

  const loadMoreCustomer = useCallback(() => {
    getItemWiseDetails({ ...buildPayload(), itemId: item.itemId, tab: BREAKDOWN_TAB.CUSTOMER, page: (itemCustomerBreakdown?.page || 1) + 1, sortBy: customerSortBy });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildPayload, item?.itemId, itemCustomerBreakdown?.page, customerSortBy]);

  const handleStateSortChange = (_, __, sorter) => {
    const s = Array.isArray(sorter) ? sorter[0] : sorter;
    const nextSortBy = s?.order ? `${s.field}:${s.order === 'ascend' ? 'asc' : 'desc'}` : undefined;
    setStateSortBy(nextSortBy);
    getItemWiseDetails({ ...buildPayload(), itemId: item.itemId, tab: BREAKDOWN_TAB.STATE, page: 1, sortBy: nextSortBy });
  };

  const handleCustomerSortChange = (_, __, sorter) => {
    const s = Array.isArray(sorter) ? sorter[0] : sorter;
    const nextSortBy = s?.order ? `${s.field}:${s.order === 'ascend' ? 'asc' : 'desc'}` : undefined;
    setCustomerSortBy(nextSortBy);
    getItemWiseDetails({ ...buildPayload(), itemId: item.itemId, tab: BREAKDOWN_TAB.CUSTOMER, page: 1, sortBy: nextSortBy });
  };

  const stateRows = itemStateBreakdown?.rows || [];
  const customerRows = itemCustomerBreakdown?.rows || [];
  const stateHasMore = (itemStateBreakdown?.page || 0) < (itemStateBreakdown?.totalPages || 0);
  const customerHasMore = (itemCustomerBreakdown?.page || 0) < (itemCustomerBreakdown?.totalPages || 0);

  const basicDetails = [
    { label: 'Item Code', value: itemDetails?.itemNo || item?.itemNo },
    { label: 'Item Group', value: itemDetails?.itemGroupName },
    { label: 'Item Unit', value: itemDetails?.itemUnit },
  ];

  const tabs = [
    {
      key: BREAKDOWN_TAB.STATE,
      label: 'State-wise Breakdown',
      children: (
        <InfiniteScrollTable
          columns={stateBreakdownColumns(stateSortBy)}
          data={stateRows}
          rowKey="state"
          tableId="item-state-breakdown"
          loading={itemStateBreakdownLoading}
          scrollLoading={itemStateBreakdownScrollLoading}
          hasMore={stateHasMore}
          onLoadMore={loadMoreState}
          onChange={handleStateSortChange}
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
          tableId="item-customer-breakdown"
          loading={itemCustomerBreakdownLoading}
          scrollLoading={itemCustomerBreakdownScrollLoading}
          hasMore={customerHasMore}
          onLoadMore={loadMoreCustomer}
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
      icon={<Icons.ShoppingOutlined style={{ color: PRIMARY }} />}
      title={itemDetails?.itemName || item?.itemName || item?.itemNo}
      titleFallback="Item Details"
      basicDetails={basicDetails}
      basicDetailsLoading={itemStateBreakdownLoading && !itemDetails}
      viewEntityLabel="View Item"
      onViewEntity={item?.itemId ? () => window.open(`/item-master/${item.itemId}`, '_blank', 'noopener,noreferrer') : undefined}
      tabs={tabs}
      activeTabKey={activeTab}
      onTabChange={handleTabChange}
    />
  );
};

export default ItemPerformanceBreakdownDrawer;
