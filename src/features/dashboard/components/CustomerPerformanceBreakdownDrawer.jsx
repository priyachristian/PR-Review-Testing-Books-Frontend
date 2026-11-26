import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

// Components
import { Tag } from '@/components/AntDComponent';
import BreakdownDrawer from '@/components/dataDisplay/drawer/BreakdownDrawer';
import InfiniteScrollTable from '@/components/dataDisplay/appTable/InfiniteScrollTable';

// Extras
import { useSalesDashboard } from '@/hooks/useSalesDashboard';
import { formatAmount } from '@/utils/currency';
import { colorPalette } from '@/utils/theme';
import Icons from '@/assets/icons/icon';
import { TruncatedCell } from '@/utils/tableColumns';

const PRIMARY = colorPalette.primary[500];

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
 * Drawer opened from the Customer-wise performance table's "Customer" tag — shows the customer's
 * basic details up top and, below, how its sales break down by item, via
 * GET /sales-dashboard/customer-wise/details/:customerId. Both the breakdown rows and the basic
 * details (`extras.customerDetails`) come from that single endpoint.
 */
const CustomerPerformanceBreakdownDrawer = ({ open, onClose, customer, buildPayload }) => {
  const { customerItemBreakdown, customerDetails, customerItemBreakdownLoading, customerItemBreakdownScrollLoading, getCustomerWiseDetails, resetCustomerItemBreakdown, resetCustomerDetails } =
    useSalesDashboard();
  const [itemSortBy, setItemSortBy] = useState(undefined);

  useEffect(() => {
    if (!open || !customer?.customerId) return;

    setItemSortBy(undefined);
    resetCustomerItemBreakdown();
    resetCustomerDetails();
    getCustomerWiseDetails({ ...buildPayload(), customerId: customer.customerId, page: 1 });

    return () => {
      resetCustomerDetails();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, customer?.customerId]);

  const loadMoreItems = useCallback(() => {
    getCustomerWiseDetails({ ...buildPayload(), customerId: customer.customerId, page: (customerItemBreakdown?.page || 1) + 1, sortBy: itemSortBy });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildPayload, customer?.customerId, customerItemBreakdown?.page, itemSortBy]);

  const handleItemSortChange = (_, __, sorter) => {
    const s = Array.isArray(sorter) ? sorter[0] : sorter;
    const nextSortBy = s?.order ? `${s.field}:${s.order === 'ascend' ? 'asc' : 'desc'}` : undefined;
    setItemSortBy(nextSortBy);
    getCustomerWiseDetails({ ...buildPayload(), customerId: customer.customerId, page: 1, sortBy: nextSortBy });
  };

  const itemRows = customerItemBreakdown?.rows || [];
  const itemHasMore = (customerItemBreakdown?.page || 0) < (customerItemBreakdown?.totalPages || 0);

  const basicDetails = [
    { label: 'Customer Number', value: customerDetails?.customerNumber || customer?.customerNumber },
    { label: 'Email', value: customerDetails?.customerEmail },
    { label: 'Phone', value: customerDetails?.phoneNumber },
  ];

  const tabs = [
    {
      key: 'item',
      label: 'Item-wise Breakdown',
      children: (
        <InfiniteScrollTable
          columns={itemBreakdownColumns(itemSortBy)}
          data={itemRows}
          rowKey="itemId"
          tableId="customer-item-breakdown"
          loading={customerItemBreakdownLoading}
          scrollLoading={customerItemBreakdownScrollLoading}
          hasMore={itemHasMore}
          onLoadMore={loadMoreItems}
          onChange={handleItemSortChange}
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
      icon={<Icons.UserOutlined style={{ color: PRIMARY }} />}
      title={customerDetails?.companyName || customer?.customerName || customer?.customerNumber}
      titleFallback="Customer Details"
      basicDetails={basicDetails}
      basicDetailsLoading={customerItemBreakdownLoading && !customerDetails}
      viewEntityLabel="View Customer"
      onViewEntity={customer?.customerId ? () => window.open(`/customer-master/${customer.customerId}`, '_blank', 'noopener,noreferrer') : undefined}
      tabs={tabs}
    />
  );
};

export default CustomerPerformanceBreakdownDrawer;
