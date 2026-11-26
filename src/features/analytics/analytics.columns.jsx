import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { Tag, Tooltip, Popover } from '@/components/AntDComponent';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import PaymentModeBadge from '@/components/ui/badge/PaymentModeBadge';
import Icons from '@/assets/icons/icon';
import { colorPalette } from '@/utils/theme';
import { formatAmount } from '@/utils/currency';
import { INVOICE_STATUS, DELIVERY_CHALLAN_STATUS, PAYMENT_RECEIVED_STATUS, SALES_ORDER_STATUS } from '@/utils/constants';
import { getAmountCoulmn, getDateColumn } from '@/utils/tableColumns';

const moduleLinkClass = 'text-sm font-medium inline-block border-b border-blue-500 text-black cursor-pointer hover:text-blue-600';
const moduleSpanClass = 'text-sm font-medium inline-block border-b border-blue-500 text-black';

const renderInvoicesCell = invoices => {
  const list = invoices || [];
  if (!list.length) return '-';
  const VISIBLE = 1;
  const visible = list.slice(0, VISIBLE);
  const hidden = list.slice(VISIBLE);
  return (
    <div className="flex items-center gap-1 flex-nowrap">
      {visible.map(invoice => (
        <Link key={invoice._id} to={`/invoices/${invoice._id}`}>
          <Tag className="font-semibold m-0 whitespace-nowrap">{invoice.invoiceNo}</Tag>
        </Link>
      ))}
      {hidden.length > 0 && (
        <Popover
          trigger="hover"
          content={
            <div className="flex flex-wrap gap-2 max-w-[280px]">
              {list.map(invoice => (
                <Link key={invoice._id} to={`/invoices/${invoice._id}`}>
                  <Tag className="font-semibold m-0">{invoice.invoiceNo}</Tag>
                </Link>
              ))}
            </div>
          }
        >
          <Tag className="font-semibold m-0 cursor-pointer">+{hidden.length}</Tag>
        </Popover>
      )}
    </div>
  );
};

export const itemAnalyticsColumn = () => [
  {
    title: 'Item Name',
    dataIndex: 'itemName',
    key: 'itemName',
    align: 'start',
  },
  {
    title: 'Quotation',
    dataIndex: 'QUOTATION',
    key: 'QUOTATION',
  },
  {
    title: 'Sales Order',
    dataIndex: 'SALES_ORDER',
    key: 'SALES_ORDER',
  },
  {
    title: 'Delivery Challan',
    dataIndex: 'DELIVERY_CHALLAN',
    key: 'DELIVERY_CHALLAN',
  },
  {
    title: 'Invoice',
    dataIndex: 'INVOICE',
    key: 'INVOICE',
  },
  {
    title: 'Purchase Order',
    dataIndex: 'PURCHASE_ORDER',
    key: 'PURCHASE_ORDER',
  },
  {
    title: 'Bill',
    dataIndex: 'BILL',
    key: 'BILL',
  },
  {
    title: 'GRPO',
    dataIndex: 'GRPO',
    key: 'GRPO',
  },
  {
    title: 'Production Order',
    dataIndex: 'PRODUCTION_ORDER',
    key: 'PRODUCTION_ORDER',
    render: roles => {
      if (!roles || roles.length === 0) return '0';

      return (
        <div className="flex flex-wrap gap-2">
          {roles.map((r, index) => (
            <span key={index} className="flex items-center gap-2">
              <span>{r.value}</span>
              <Tag color="blue" className="text-sm font-medium">
                {r.role}
              </Tag>
            </span>
          ))}
        </div>
      );
    },
  },
];

export const groupItemWiseItemAnalysisColumn = type => {
  return [
    {
      title: 'Item#',
      dataIndex: 'item',
      key: 'item',
      render: item => {
        return (
          <Link to={`/item-master/${item?._id}`}>
            <Tag className="font-semibold">{item?.itemNo}</Tag>
          </Link>
        );
      },
    },
    {
      title: 'Item Name',
      dataIndex: 'item',
      key: 'item',
      render: item => item?.itemName,
    },
    {
      title: type === 'order' ? 'Sales Orders' : 'Invoices',
      dataIndex: type === 'order' ? 'salesOrders' : 'invoices',
      key: type === 'order' ? 'salesOrders' : 'invoices',
      render: salesOrders => {
        if (!salesOrders || salesOrders.length === 0) {
          return <span className="text-gray-400">No {type === 'order' ? 'salesOrders' : 'invoices'}</span>;
        }
        return (
          <div className="flex flex-wrap gap-2">
            {salesOrders.map(salesOrder => (
              <Link key={salesOrder?._id} to={`${type === 'order' ? '/sales-orders' : '/invoices'}/${salesOrder?._id}`}>
                <Tag key={salesOrder?._id} className="font-semibold">
                  {type === 'order' ? salesOrder?.orderId : salesOrder?.invoiceId}
                </Tag>
              </Link>
            ))}
          </div>
        );
      },
    },
    {
      title: 'Quantity',
      dataIndex: 'analytics',
      key: 'quantity',
      render: analytics => {
        const qty = type === 'order' ? analytics?.totalQuantityOrders : analytics?.totalQuantitySold;
        return <span>{qty ?? 0}</span>;
      },
    },
    {
      title: 'Amount',
      dataIndex: type === 'order' ? 'totalOrderAmount' : type === 'splitSales' ? 'totalSplitInvoiceAmount' : 'totalInvoiceAmount',
      key: type === 'order' ? 'totalOrderAmount' : type === 'splitSales' ? 'totalSplitInvoiceAmount' : 'totalInvoiceAmount',
      render: totalOrderAmount => <span>{formatAmount(totalOrderAmount)}</span>,
    },
  ];
};

export const topSaleOrdercolumns = () => [
  {
    title: 'Order#',
    dataIndex: 'orderId',
    key: 'orderId',
    render: orderId => <Tag className="font-semibold">{orderId}</Tag>,
    fixed: 'left',
  },
  {
    title: 'Customer Name',
    dataIndex: 'customerId',
    key: 'customerId',
    render: customerId => customerId?.customerDisplayName || '',
  },
  {
    title: 'Order Date',
    dataIndex: 'orderDate',
    key: 'orderDate',
    render: orderDate => dayjs(orderDate).format('DD/MM/YYYY') || '',
  },
  {
    title: 'Total Amount',
    dataIndex: 'total',
    key: 'total',
    render: total => <span>{formatAmount(total, true, null)}</span>,
  },
];

export const salesOrderWiseAnalysisColumn = (onItemClick = null) => {
  return [
    {
      title: 'Sales Order#',
      dataIndex: 'salesOrderDetail',
      width: 120,
      key: 'salesOrderDetail',
      render: salesOrderDetail => (
        <Link to={`/sales-orders/${salesOrderDetail.salesOrderId}`}>
          <Tag className="font-semibold">{salesOrderDetail.salesOrderNo}</Tag>
        </Link>
      ),
      visible: true,
      sorter: false,
      fixed: 'left',
    },
    {
      title: 'Party Name',
      dataIndex: 'customerDisplayName',
      key: 'customerDisplayName',
      visible: true,
      sorter: false,
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      render: items => {
        const list = items || [];
        if (!list.length) return '-';
        const VISIBLE = 2;
        const visible = list.slice(0, VISIBLE);
        const hidden = list.slice(VISIBLE);
        return (
          <div className="flex items-center gap-1 flex-nowrap">
            {visible.map(item => (
              <Tag key={item.itemId} className="font-semibold m-0 cursor-pointer" onClick={() => onItemClick?.(item)}>
                {item.itemId}
              </Tag>
            ))}
            {hidden.length > 0 && (
              <Popover
                trigger="hover"
                content={
                  <div className="flex flex-wrap gap-2 max-w-[280px]">
                    {list.map(item => (
                      <Tag key={item.itemId} className="font-semibold m-0 cursor-pointer" onClick={() => onItemClick?.(item)}>
                        {item.itemId}
                      </Tag>
                    ))}
                  </div>
                }
              >
                <Tag className="font-semibold m-0 cursor-pointer">+{hidden.length}</Tag>
              </Popover>
            )}
          </div>
        );
      },
      visible: true,
      sorter: false,
    },
    {
      title: 'Invoices',
      dataIndex: 'invoices',
      key: 'invoices',
      render: renderInvoicesCell,
      ellipsis: false,
      visible: true,
      sorter: false,
    },
    {
      title: 'Item Count',
      dataIndex: 'itemCount',
      key: 'itemCount',
      width: 100,
      visible: true,
      sorter: false,
    },
    {
      title: 'Required Qty',
      dataIndex: 'requiredQty',
      width: 100,
      key: 'requiredQty',
      visible: true,
      sorter: false,
    },
    {
      title: 'Ordered Qty',
      dataIndex: 'orderedQty',
      width: 100,
      key: 'orderedQty',
      visible: true,
      sorter: false,
    },
    {
      title: 'Invoiced Qty',
      dataIndex: 'invoicedQty',
      width: 100,
      key: 'invoicedQty',
      visible: true,
      sorter: false,
    },
    {
      title: 'Invoiced Amount',
      dataIndex: 'invoicedAmount',
      width: 130,
      key: 'invoicedAmount',
      render: invoicedAmount => <span>{formatAmount(invoicedAmount || 0)}</span>,
      visible: true,
      sorter: false,
    },
    {
      title: 'Available Stocks',
      dataIndex: 'availableStocks',
      key: 'availableStocks',
      visible: true,
      sorter: false,
    },
    {
      title: 'Amount (Incl. Tax)',
      dataIndex: 'amount',
      key: 'amount',
      render: amount => <span>{amount.totalAmount}</span>,
      visible: true,
      sorter: false,
    },
  ];
};

export const salesOrderItemGroupWiseAnalysisColumn = () => {
  return [
    {
      title: 'Item Group',
      dataIndex: 'itemGroupName',
      key: 'itemGroupName',
      visible: true,
      sorter: false,
    },
    {
      title: 'Sales Orders',
      dataIndex: 'totalSalesOrderCount',
      key: 'totalSalesOrderCount',
      width: 160,
      visible: true,
      sorter: false,
    },
    {
      title: 'Total Qty',
      dataIndex: 'totalQty',
      key: 'totalQty',
      width: 120,
      visible: true,
      sorter: false,
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      visible: true,
      sorter: false,
      render: value => <span>{formatAmount(value || 0)}</span>,
    },
  ];
};

export const salesOrderWiseAnalysisItemColumn = (onItemClick = null) => {
  return [
    {
      title: 'Item#',
      dataIndex: 'itemId',
      width: 90,
      key: 'itemId',
      render: (itemId, record) =>
        itemId ? (
          <Tag className="font-semibold cursor-pointer" onClick={() => onItemClick?.(record)}>
            {itemId}
          </Tag>
        ) : (
          '-'
        ),
    },
    {
      title: 'Item Name',
      dataIndex: 'itemName',
      key: 'itemName',
    },
    {
      title: 'Required Qty',
      dataIndex: 'remainingQty',
      width: 100,
      key: 'remainingQty',
    },
    {
      title: 'Ordered Qty',
      dataIndex: 'orderedQty',
      width: 100,
      key: 'orderedQty',
    },
    {
      title: 'Invoices',
      dataIndex: 'invoices',
      key: 'invoices',
      render: renderInvoicesCell,
      ellipsis: false,
    },
    {
      title: 'Invoiced Qty',
      dataIndex: 'invoicedQty',
      width: 100,
      key: 'invoicedQty',
    },
    {
      title: 'Invoiced Amount',
      dataIndex: 'invoicedAmount',
      width: 120,
      key: 'invoicedAmount',
      render: invoicedAmount => <span>{formatAmount(invoicedAmount || 0)}</span>,
    },
    {
      title: 'Available Stocks',
      dataIndex: 'availableStock',
      key: 'availableStock',
    },
    {
      title: 'Rate',
      dataIndex: 'rate',
      key: 'rate',
    },
    {
      title: 'Amount (Incl. Tax)',
      dataIndex: 'amount',
      key: 'amount',
      render: amount => <span>{amount.totalAmount}</span>,
    },
  ];
};

export const customerWiseSalesOrderAnalysisColumn = () => {
  return [
    {
      title: 'Customer Name',
      dataIndex: 'customerName',
      key: 'customerName',
      width: 200,
      ellipsis: true,
      render: customerName => <span className="font-semibold">{customerName}</span>,
      visible: true,
      sorter: true,
      fixed: 'left',
    },
    {
      title: 'Pending Sales Orders',
      dataIndex: 'pendingSalesOrder',
      key: 'pendingSalesOrder',
      width: 130,
      align: 'left',
      visible: true,
      sorter: true,
    },
    {
      title: 'Oldest Order Date',
      dataIndex: 'oldestOrderDate',
      key: 'oldestOrderDate',
      width: 130,
      render: date => (date ? dayjs(date).format('DD/MM/YYYY') : '-'),
      visible: true,
      sorter: false,
    },
    {
      title: 'Total Quantity',
      dataIndex: 'totalQuantity',
      key: 'totalQuantity',
      width: 110,
      align: 'left',
      visible: true,
      sorter: true,
    },
    {
      title: 'Total Pending Value',
      dataIndex: 'totalPendingValue',
      key: 'totalPendingValue',
      width: 140,
      align: 'left',
      render: value => <span>{formatAmount(value || 0)}</span>,
      visible: true,
      sorter: true,
    },
  ];
};

export const customerWiseSalesOrderAnalysisItemColumn = (onItemClick = null) => {
  return [
    {
      title: 'Item No',
      dataIndex: 'itemNo',
      key: 'itemNo',
      width: 120,
      ellipsis: true,
      render: (itemNo, record) =>
        itemNo ? (
          <Tag className="font-semibold cursor-pointer" onClick={() => onItemClick?.(record)}>
            {itemNo}
          </Tag>
        ) : (
          '-'
        ),
      visible: true,
    },
    {
      title: 'Item Name',
      dataIndex: 'itemName',
      key: 'itemName',
      ellipsis: true,
      visible: true,
    },
    {
      title: 'Sales Order#',
      dataIndex: 'salesOrders',
      key: 'salesOrders',
      width: 160,
      render: salesOrders => {
        const list = salesOrders || [];
        if (!list.length) return '-';
        const VISIBLE = 2;
        const visible = list.slice(0, VISIBLE);
        const hidden = list.slice(VISIBLE);
        return (
          <div className="flex items-center gap-1 flex-nowrap">
            {visible.map(salesOrder => (
              <Link key={salesOrder.salesOrderId} to={`/sales-orders/${salesOrder.salesOrderId}`}>
                <Tag className="font-semibold m-0">{salesOrder.salesOrderNo}</Tag>
              </Link>
            ))}
            {hidden.length > 0 && (
              <Popover
                trigger="hover"
                content={
                  <div className="flex flex-wrap gap-2 max-w-[280px]">
                    {list.map(salesOrder => (
                      <Link key={salesOrder.salesOrderId} to={`/sales-orders/${salesOrder.salesOrderId}`}>
                        <Tag className="font-semibold m-0">{salesOrder.salesOrderNo}</Tag>
                      </Link>
                    ))}
                  </div>
                }
              >
                <Tag className="font-semibold m-0 cursor-pointer">+{hidden.length}</Tag>
              </Popover>
            )}
          </div>
        );
      },
      visible: true,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 90,
      align: 'left',
      visible: true,
    },
    {
      title: 'Pending Orders',
      dataIndex: 'noOfPendingOrders',
      key: 'noOfPendingOrders',
      width: 110,
      align: 'left',
      visible: true,
    },
    {
      title: 'Oldest Order Date',
      dataIndex: 'oldestOrderDate',
      key: 'oldestOrderDate',
      width: 130,
      render: date => (date ? dayjs(date).format('DD/MM/YYYY') : '-'),
      visible: true,
    },
    {
      title: 'Pending Value',
      dataIndex: 'totalPendingValue',
      key: 'totalPendingValue',
      width: 120,
      align: 'left',
      render: value => <span>{formatAmount(value || 0)}</span>,
      visible: true,
    },
  ];
};

export const itemWiseSalesOrderAnalysisColumn = () => {
  return [
    {
      title: 'Item#',
      dataIndex: 'itemDetail',
      key: 'itemDetail',
      render: itemDetail => (
        <Link to={`/item-master/${itemDetail.itemId}`}>
          <Tag className="font-semibold">{itemDetail.itemNo}</Tag>
        </Link>
      ),
      visible: true,
      sorter: false,
      fixed: 'left',
    },
    {
      title: 'Item Name',
      dataIndex: 'itemDetail',
      key: 'itemDetail',
      render: itemDetail => itemDetail.itemName,
      visible: true,
      sorter: false,
    },
    {
      title: 'Sales Orders',
      dataIndex: 'salesOrders',
      key: 'salesOrders',
      render: salesOrders => {
        return (
          <div className="flex flex-wrap gap-2">
            {salesOrders.map(salesOrder => (
              <Link key={salesOrder.salesOrderDetail.salesOrderId} to={`/sales-orders/${salesOrder?.salesOrderDetail?.salesOrderId}`}>
                <Tag className="font-semibold">{salesOrder?.salesOrderDetail?.salesOrderNo}</Tag>
              </Link>
            ))}
          </div>
        );
      },
      visible: true,
      sorter: false,
    },
    {
      title: 'Required Qty',
      dataIndex: 'totalRequiredQty',
      key: 'totalRequiredQty',
      visible: true,
      sorter: false,
    },
    {
      title: 'Available Stocks',
      dataIndex: 'availableStock',
      key: 'availableStock',
      visible: true,
      sorter: false,
    },
    {
      title: 'Sales Order Count',
      dataIndex: 'salesOrderCount',
      key: 'salesOrderCount',
      visible: true,
      sorter: false,
    },
  ];
};

export const itemWiseAnalysisSalesOrderColumn = () => {
  return [
    {
      title: 'Sales Order#',
      dataIndex: 'salesOrderDetail',
      key: 'salesOrderDetail',
      render: salesOrderDetail => (
        <Link to={`/sales-orders/${salesOrderDetail.salesOrderId}`}>
          <Tag className="font-semibold">{salesOrderDetail.salesOrderNo}</Tag>
        </Link>
      ),
      visible: true,
      sorter: false,
    },
    {
      title: 'Party Name',
      dataIndex: 'customerDisplayName',
      key: 'customerDisplayName',
      visible: true,
      sorter: false,
    },
    {
      title: 'Remaining Qty',
      dataIndex: 'remainingQty',
      key: 'remainingQty',
      visible: true,
      sorter: false,
    },
    {
      title: 'Ordered Qty',
      dataIndex: 'orderedQty',
      key: 'orderedQty',
    },
    {
      title: 'Amount (Incl. Tax)',
      dataIndex: 'amount',
      key: 'amount',
      render: amount => <span>{formatAmount(amount.totalAmount)}</span>,
      visible: true,
      sorter: false,
    },
  ];
};

export const moduleDataDeliveryChallansColumn = () => [
  {
    title: 'Delivery Challan ID',
    dataIndex: 'deliveryChallanId',
    key: 'deliveryChallanId',
    render: (value, record) => (
      <Link to={`/delivery-challans/${record?.id || record?._id}`}>
        <Tag className="font-medium cursor-pointer hover:opacity-80">{value || '-'}</Tag>
      </Link>
    ),
  },
  getDateColumn('Date', 'date', 'date', true, false, 150),
  getAmountCoulmn('Amount', 'amount', 'amount', true, false, true),
  {
    title: 'Item Count',
    dataIndex: 'itemCount',
    key: 'itemCount',
    align: 'left',
    render: value => <span className="font-medium">{value || 0}</span>,
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    align: 'left',
    render: value => <StatusBadge status={value} value={DELIVERY_CHALLAN_STATUS?.[value] || value || '-'} />,
  },
];

export const moduleDataInvoicesColumn = () => [
  {
    title: 'Invoice ID',
    dataIndex: 'invoiceId',
    key: 'invoiceId',
    render: (value, record) => (
      <Link to={`/invoices/${record?.id || record?._id}`}>
        <Tag className="font-medium cursor-pointer hover:opacity-80">{value || '-'}</Tag>
      </Link>
    ),
  },
  getDateColumn('Date', 'date', 'date', true, false, 150),
  getAmountCoulmn('Amount', 'amount', 'amount', true, false, true),
  {
    title: 'Item Count',
    dataIndex: 'itemCount',
    key: 'itemCount',
    align: 'left',
    render: value => <span className="font-medium">{value || 0}</span>,
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    align: 'left',
    render: value => <StatusBadge status={value} value={INVOICE_STATUS?.[value] || value || '-'} />,
  },
];

export const moduleDataPaymentsColumn = () => [
  {
    title: 'Payment ID',
    dataIndex: 'paymentReceivedId',
    key: 'paymentReceivedId',
    render: (value, record) => (
      <Link to={`/payment-in/${record?.id || record?._id}`}>
        <Tag className="font-medium cursor-pointer hover:opacity-80">{value || '-'}</Tag>
      </Link>
    ),
  },
  getDateColumn('Date', 'date', 'date', true, false, 150),
  getAmountCoulmn('Amount', 'amount', 'amount', true, false, true),
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    align: 'left',
    render: value => <StatusBadge status={value} value={PAYMENT_RECEIVED_STATUS?.[value] || value || '-'} />,
  },
];

export const moduleDataSalesOrdersColumn = () => [
  {
    title: 'Sales Order ID',
    dataIndex: 'orderId',
    key: 'orderId',
    render: (value, record) => (
      <Link to={`/sales-orders/${record?.id || record?._id}`}>
        <Tag className="font-medium cursor-pointer hover:opacity-80">{value || '-'}</Tag>
      </Link>
    ),
  },
  getDateColumn('Date', 'date', 'date', true, false, 150),
  getAmountCoulmn('Amount', 'amount', 'amount', true, false, true),
  {
    title: 'Item Count',
    dataIndex: 'itemCount',
    key: 'itemCount',
    align: 'left',
    render: value => <span className="font-medium">{value || 0}</span>,
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    align: 'left',
    render: status => <StatusBadge status={status} value={SALES_ORDER_STATUS?.[status] || ''} />,
  },
];

export const customerWiseBusinessPerformanceColumns = () => [
  {
    title: 'Customer No',
    dataIndex: 'customerNumber',
    key: 'customerNumber',
    render: customerNumber => <Tag className="font-semibold">{customerNumber ?? '-'}</Tag>,
    fixed: 'left',
    sorter: true,
    sortDirections: ['descend', 'ascend'],
  },
  {
    title: 'Customer Name',
    dataIndex: 'customerName',
    key: 'customerName',
    sorter: true,
    sortDirections: ['descend', 'ascend'],
    render: value => value || '-',
  },
  {
    title: 'City',
    dataIndex: 'city',
    key: 'city',
    render: value => value || '-',
  },
  {
    title: 'State',
    dataIndex: 'state',
    key: 'state',
    render: value => value || '-',
  },
  {
    title: 'Order Qty',
    dataIndex: 'orderQtyByUom',
    key: 'orderQtyByUom',
    sorter: true,
    sortDirections: ['descend', 'ascend'],
    render: entries => {
      const list = Array.isArray(entries) ? entries : [];
      if (!list.length) return <span className="font-semibold">0</span>;
      const text = list.map(entry => `${entry.qty ?? 0}${entry.unit ? ` ${entry.unit}` : ''}`).join(', ');
      return <span className="font-semibold">{text}</span>;
    },
  },
  {
    title: 'Dispatch Qty',
    dataIndex: 'dispatchedQtyByUom',
    key: 'dispatchedQtyByUom',
    sorter: true,
    sortDirections: ['descend', 'ascend'],
    render: entries => {
      const list = Array.isArray(entries) ? entries : [];
      if (!list.length) return <span className="font-semibold">0</span>;
      const text = list.map(entry => `${entry.qty ?? 0}${entry.unit ? ` ${entry.unit}` : ''}`).join(', ');
      return <span className="font-semibold">{text}</span>;
    },
  },
  {
    title: 'Order',
    dataIndex: 'orderAmount',
    key: 'orderAmount',
    sorter: true,
    sortDirections: ['descend', 'ascend'],
    render: value => <div className="font-semibold">{formatAmount(value || 0)}</div>,
  },
  {
    title: 'Invoice',
    dataIndex: 'invoiceAmount',
    key: 'invoiceAmount',
    sorter: true,
    sortDirections: ['descend', 'ascend'],
    render: value => <div className="font-semibold">{formatAmount(value || 0)}</div>,
  },
  {
    title: 'Payment',
    dataIndex: 'paymentReceived',
    key: 'paymentReceived',
    sorter: true,
    sortDirections: ['descend', 'ascend'],
    render: value => <div className="font-semibold">{formatAmount(value || 0)}</div>,
  },
];

export const topCustomersOfSalesColumns = isSplitSessionActive => [
  {
    title: 'Customer No',
    dataIndex: 'customerNumber',
    key: 'customerNumber',
    render: customerNumber => <Tag className="font-semibold">{customerNumber ?? '-'}</Tag>,
    fixed: 'left',
    sorter: true,
    sortDirections: ['descend', 'ascend'],
  },
  {
    title: 'Customer Name',
    dataIndex: 'customerName',
    key: 'customerName',
    render: customerName => customerName || '',
    sorter: true,
    sortDirections: ['descend', 'ascend'],
  },
  {
    title: 'Quotation Qty',
    dataIndex: 'quoteQty',
    key: 'quoteQty',
    render: quoteQty => <span className="font-semibold">{quoteQty}</span>,
    sorter: true,
    sortDirections: ['descend', 'ascend'],
  },
  {
    title: 'Quotation Value',
    dataIndex: 'quoteValue',
    key: 'quoteValue',
    render: quoteValue => <div className="font-semibold">{formatAmount(quoteValue)}</div>,
    sorter: true,
    sortDirections: ['descend', 'ascend'],
  },
  {
    title: 'Sales Order Qty',
    dataIndex: 'salesOrderQty',
    key: 'salesOrderQty',
    render: salesOrderQty => <span className="font-semibold">{salesOrderQty}</span>,
    sorter: true,
    sortDirections: ['descend', 'ascend'],
  },
  {
    title: 'Sales Order Value',
    dataIndex: 'salesOrderValue',
    key: 'salesOrderValue',
    render: salesOrderValue => <div className="font-semibold">{formatAmount(salesOrderValue)}</div>,
    sorter: true,
    sortDirections: ['descend', 'ascend'],
  },
  {
    title: 'Delivery Challan Qty',
    dataIndex: 'dcQty',
    key: 'dcQty',
    render: dcQty => <span className="font-semibold">{dcQty}</span>,
    sorter: true,
    sortDirections: ['descend', 'ascend'],
  },
  {
    title: 'Delivery Challan Value',
    dataIndex: 'dcValue',
    key: 'dcValue',
    render: dcValue => <div className="font-semibold">{formatAmount(dcValue)}</div>,
    sorter: true,
    sortDirections: ['descend', 'ascend'],
  },
  {
    title: 'Invoice Qty',
    dataIndex: 'invoiceQty',
    key: 'invoiceQty',
    render: invoiceQty => <span className="font-semibold">{invoiceQty}</span>,
    sorter: true,
    sortDirections: ['descend', 'ascend'],
  },
  {
    title: 'Invoice Value',
    dataIndex: 'invoiceValue',
    key: 'invoiceValue',
    render: invoiceValue => <div className="font-semibold">{formatAmount(invoiceValue)}</div>,
    sorter: true,
    sortDirections: ['descend', 'ascend'],
  },
  ...(isSplitSessionActive
    ? [
        {
          title: 'Invoice Split Qty (By Qty)',
          dataIndex: 'invoiceSplitByQtyQty',
          key: 'invoiceSplitByQtyQty',
          render: qty => <span className="font-semibold">{qty ?? 0}</span>,
          sorter: true,
          sortDirections: ['descend', 'ascend'],
        },
        {
          title: 'Invoice Split Value (By Qty)',
          dataIndex: 'invoiceSplitByQtyValue',
          key: 'invoiceSplitByQtyValue',
          render: val => <div className="font-semibold">{formatAmount(val || 0)}</div>,
          sorter: true,
          sortDirections: ['descend', 'ascend'],
        },
        {
          title: 'Invoice Split Qty (By Price)',
          dataIndex: 'invoiceSplitByPriceQty',
          key: 'invoiceSplitByPriceQty',
          render: qty => <span className="font-semibold">{qty ?? 0}</span>,
          sorter: true,
          sortDirections: ['descend', 'ascend'],
        },
        {
          title: 'Invoice Split Value (By Price)',
          dataIndex: 'invoiceSplitByPriceValue',
          key: 'invoiceSplitByPriceValue',
          render: val => <div className="font-semibold">{formatAmount(val || 0)}</div>,
          sorter: true,
          sortDirections: ['descend', 'ascend'],
        },
      ]
    : []),
];

export const topItemsOfSalesColumns = isSplitSessionActive => [
  {
    title: 'Item No',
    dataIndex: 'itemNo',
    key: 'itemNo',
    render: itemNo => <Tag className="font-semibold">{itemNo ?? '-'}</Tag>,
    fixed: 'left',
    sorter: true,
    sortDirections: ['descend', 'ascend'],
  },
  {
    title: 'Item Name',
    dataIndex: 'itemName',
    key: 'itemName',
    sorter: true,
    sortDirections: ['descend', 'ascend'],
  },
  {
    title: 'Quotation Qty',
    dataIndex: 'quoteQty',
    key: 'quoteQty',
    render: quoteQty => <span className="font-semibold">{quoteQty}</span>,
    sorter: true,
    sortDirections: ['descend', 'ascend'],
  },
  {
    title: 'Quotation Value',
    dataIndex: 'quoteValue',
    key: 'quoteValue',
    render: quoteValue => <div className="font-semibold">{formatAmount(quoteValue)}</div>,
    sorter: true,
    sortDirections: ['descend', 'ascend'],
  },
  {
    title: 'Sales Order Qty',
    dataIndex: 'salesOrderQty',
    key: 'salesOrderQty',
    render: salesOrderQty => <span className="font-semibold">{salesOrderQty}</span>,
    sorter: true,
    sortDirections: ['descend', 'ascend'],
  },
  {
    title: 'Sales Order Value',
    dataIndex: 'salesOrderValue',
    key: 'salesOrderValue',
    render: salesOrderValue => <div className="font-semibold">{formatAmount(salesOrderValue)}</div>,
    sorter: true,
    sortDirections: ['descend', 'ascend'],
  },
  {
    title: 'Delivery Challan Qty',
    dataIndex: 'dcQty',
    key: 'dcQty',
    render: dcQty => <span className="font-semibold">{dcQty}</span>,
    sorter: true,
    sortDirections: ['descend', 'ascend'],
  },
  {
    title: 'Delivery Challan Value',
    dataIndex: 'dcValue',
    key: 'dcValue',
    render: dcValue => <div className="font-semibold">{formatAmount(dcValue)}</div>,
    sorter: true,
    sortDirections: ['descend', 'ascend'],
  },
  {
    title: 'Invoice Qty',
    dataIndex: 'invoiceQty',
    key: 'invoiceQty',
    render: invoiceQty => <span className="font-semibold">{invoiceQty}</span>,
    sorter: true,
    sortDirections: ['descend', 'ascend'],
  },
  {
    title: 'Invoice Value',
    dataIndex: 'invoiceValue',
    key: 'invoiceValue',
    render: invoiceValue => <div className="font-semibold">{formatAmount(invoiceValue)}</div>,
    sorter: true,
    sortDirections: ['descend', 'ascend'],
  },
  ...(isSplitSessionActive
    ? [
        {
          title: 'Invoice Split Qty (By Qty)',
          dataIndex: 'invoiceSplitByQtyQty',
          key: 'invoiceSplitByQtyQty',
          render: qty => <span className="font-semibold">{qty ?? 0}</span>,
          sorter: true,
          sortDirections: ['descend', 'ascend'],
        },
        {
          title: 'Invoice Split Value (By Qty)',
          dataIndex: 'invoiceSplitByQtyValue',
          key: 'invoiceSplitByQtyValue',
          render: val => <div className="font-semibold">{formatAmount(val || 0)}</div>,
          sorter: true,
          sortDirections: ['descend', 'ascend'],
        },
        {
          title: 'Invoice Split Qty (By Price)',
          dataIndex: 'invoiceSplitByPriceQty',
          key: 'invoiceSplitByPriceQty',
          render: qty => <span className="font-semibold">{qty ?? 0}</span>,
          sorter: true,
          sortDirections: ['descend', 'ascend'],
        },
        {
          title: 'Invoice Split Value (By Price)',
          dataIndex: 'invoiceSplitByPriceValue',
          key: 'invoiceSplitByPriceValue',
          render: val => <div className="font-semibold">{formatAmount(val || 0)}</div>,
          sorter: true,
          sortDirections: ['descend', 'ascend'],
        },
      ]
    : []),
];

export const customerWiseAnalysisColumn = (showLastOrderColumn = true, onModuleClick = null) => {
  return [
    {
      title: 'Customer Name',
      dataIndex: 'customerName',
      key: 'customerName',
      render: (text, record) => (
        <div className="flex items-center gap-2">
          <Link className="!text-black border-b border-blue-500 !font-medium hover:!no-underline" to={`/customer-master/${record.customerId}`}>
            {text}
          </Link>
        </div>
      ),
    },
    {
      title: 'Total Orders',
      dataIndex: 'totalOrders',
      key: 'totalOrders',
      align: 'left',
      render: (value, record) =>
        onModuleClick ? (
          <span
            role="button"
            tabIndex={0}
            className={moduleLinkClass}
            onClick={() => onModuleClick(record, 'salesOrders')}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onModuleClick(record, 'salesOrders');
              }
            }}
          >
            {value}
          </span>
        ) : (
          <span className={moduleSpanClass}>{value}</span>
        ),
    },
    {
      title: 'Total Amount',
      dataIndex: 'ordersTotalAmount',
      key: 'ordersTotalAmount',
      align: 'left',
      render: value => <span className="font-semibold text-green-600">{formatAmount(value, true, null)}</span>,
    },
    {
      title: 'Delivery Challans',
      dataIndex: 'totalDeliveryChallans',
      key: 'totalDeliveryChallans',
      align: 'left',
      render: (value, record) =>
        onModuleClick ? (
          <span
            role="button"
            tabIndex={0}
            className={moduleLinkClass}
            onClick={() => onModuleClick(record, 'deliveryChallans')}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onModuleClick(record, 'deliveryChallans');
              }
            }}
          >
            {value || 0}
          </span>
        ) : (
          <span className={moduleSpanClass}>{value || 0}</span>
        ),
    },
    {
      title: 'Delivery Challans Amount',
      dataIndex: 'deliveryChallansTotalAmount',
      key: 'deliveryChallansTotalAmount',
      align: 'left',
      render: value => <span className="font-semibold text-green-600">{formatAmount(value)}</span>,
    },
    {
      title: 'Invoices',
      dataIndex: 'totalInvoices',
      key: 'totalInvoices',
      align: 'left',
      render: (value, record) =>
        onModuleClick ? (
          <span
            role="button"
            tabIndex={0}
            className={moduleLinkClass}
            onClick={() => onModuleClick(record, 'invoices')}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onModuleClick(record, 'invoices');
              }
            }}
          >
            {value || 0}
          </span>
        ) : (
          <span className={moduleSpanClass}>{value || 0}</span>
        ),
    },
    {
      title: 'Invoices Amount',
      dataIndex: 'invoicesTotalAmount',
      key: 'invoicesTotalAmount',
      align: 'left',
      render: value => <span className="font-semibold text-green-600">{formatAmount(value)}</span>,
    },
    {
      title: 'Payments',
      dataIndex: 'totalPayments',
      key: 'totalPayments',
      align: 'left',
      render: (value, record) =>
        onModuleClick ? (
          <span
            role="button"
            tabIndex={0}
            className={moduleLinkClass}
            onClick={() => onModuleClick(record, 'payments')}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onModuleClick(record, 'payments');
              }
            }}
          >
            {value || 0}
          </span>
        ) : (
          <span className={moduleSpanClass}>{value || 0}</span>
        ),
    },
    {
      title: 'Payments Amount',
      dataIndex: 'paymentsTotalAmount',
      key: 'paymentsTotalAmount',
      align: 'left',
      render: value => <span className="font-semibold text-green-600">{formatAmount(value)}</span>,
    },
    {
      title: 'First Order',
      dataIndex: 'firstOrderDate',
      key: 'firstOrderDate',
      render: date => (
        <div className="flex items-center gap-1 text-gray-600">
          <span>{date ? dayjs(date).format('DD/MM/YYYY') : ''}</span>
        </div>
      ),
    },
    ...(showLastOrderColumn
      ? [
          {
            title: 'Last Order',
            dataIndex: 'lastOrderDate',
            key: 'lastOrderDate',
            render: date => (
              <div className="flex items-center gap-1 text-gray-600">
                <span>{date ? dayjs(date).format('DD/MM/YYYY') : ''}</span>
              </div>
            ),
          },
        ]
      : []),
  ];
};

export const customersWithSingleInvoiceColumns = (handleViewClick, handleInvoiceClick) => [
  {
    title: 'Customer Name',
    dataIndex: 'customerName',
    key: 'customerName',
    render: (customerName, record) => <div className="font-semibold">{customerName || record?.customerName || 'N/A'}</div>,
  },
  {
    title: 'Company Name',
    dataIndex: 'companyName',
    key: 'companyName',
    render: (companyName, record) => companyName || record?.companyName || 'N/A',
  },
  {
    title: 'Phone Number',
    dataIndex: 'customerPhoneNumber',
    key: 'customerPhoneNumber',
    render: (phone, record) => phone || record?.customerPhoneNumber || 'N/A',
  },
  {
    title: 'Invoice ID',
    dataIndex: 'invoiceId',
    key: 'invoiceId',
    render: (invoiceId, record) => {
      const id = invoiceId || record?.invoice?.invoiceId;
      return (
        <Tag className="font-semibold cursor-pointer" onClick={() => handleInvoiceClick && handleInvoiceClick(record?.invoice || record)} style={{ color: colorPalette.primary[500] }}>
          {id || 'N/A'}
        </Tag>
      );
    },
  },
  {
    title: 'Invoice Date',
    dataIndex: 'invoiceDate',
    key: 'invoiceDate',
    render: (invoiceDate, record) => {
      const date = invoiceDate || record?.invoice?.invoiceDate;
      return date ? dayjs(date).format('DD/MM/YYYY') : 'N/A';
    },
  },
  {
    title: 'Due Date',
    dataIndex: 'dueDate',
    key: 'dueDate',
    render: (dueDate, record) => {
      const date = dueDate || record?.invoice?.dueDate;
      return date ? dayjs(date).format('DD/MM/YYYY') : 'N/A';
    },
  },
  {
    title: 'Total Amount',
    dataIndex: 'total',
    key: 'total',
    render: (total, record) => {
      const amount = total || record?.invoice?.total || 0;
      return <div className="font-semibold">{formatAmount(amount)}</div>;
    },
  },
  {
    title: 'Balance Amount',
    dataIndex: 'balanceAmount',
    key: 'balanceAmount',
    render: (balanceAmount, record) => {
      const amount = balanceAmount || record?.invoice?.balanceAmount || 0;
      return <div className="font-semibold">{formatAmount(amount)}</div>;
    },
  },
  {
    title: 'Status',
    key: 'status',
    render: (_, record) => {
      const invoiceStatus = record?.invoice?.status;
      return <StatusBadge status={invoiceStatus} value={INVOICE_STATUS?.[invoiceStatus] || invoiceStatus || ''} />;
    },
  },
  {
    title: 'Action',
    key: 'action',
    render: (_, record) => (
      <div className="flex items-center gap-3">
        <Tooltip title="View Customer">
          <Icons.EyeOutlined
            style={{ fontSize: 17, color: '#1E3A56' }}
            onClick={e => {
              e.stopPropagation();
              handleViewClick(record);
            }}
          />
        </Tooltip>
        {record.invoice && (
          <Tooltip title="View Invoice">
            <Icons.FileTextOutlined
              style={{ fontSize: 17, color: colorPalette.primary[500] }}
              onClick={e => {
                e.stopPropagation();
                handleInvoiceClick && handleInvoiceClick(record.invoice);
              }}
            />
          </Tooltip>
        )}
      </div>
    ),
  },
];

export const topVendorsByAmountPurchsecolumns = () => [
  {
    title: 'Order#',
    dataIndex: 'purchaseOrderId',
    key: 'purchaseOrderId',
    render: purchaseOrderId => <Tag className="font-semibold">{purchaseOrderId}</Tag>,
    fixed: 'left',
  },
  {
    title: 'Vendor Name',
    dataIndex: 'vendorName',
    key: 'vendorName',
    render: vendorName => vendorName || '',
  },
  {
    title: 'Order Date',
    dataIndex: 'date',
    key: 'date',
    render: date => dayjs(date).format('DD/MM/YYYY') || '',
  },
  {
    title: 'Total Amount',
    dataIndex: 'totalAmount',
    key: 'totalAmount',
    render: totalAmount => <span>{formatAmount(totalAmount)}</span>,
  },
];

export const topVendorByRevenuePurchasecolumns = isSplitSessionActive => [
  {
    title: 'Vendor No',
    dataIndex: 'vendorNumber',
    key: 'vendorNumber',
    render: vendorNumber => <Tag className="font-semibold">{vendorNumber ?? '-'}</Tag>,
    fixed: 'left',
    sorter: true,
    sortDirections: ['descend', 'ascend'],
  },
  {
    title: 'Vendor Name',
    dataIndex: 'vendorName',
    key: 'vendorName',
    render: vendorName => vendorName || '',
    sorter: true,
    sortDirections: ['descend', 'ascend'],
  },
  {
    title: 'PO Qty',
    dataIndex: 'purchaseOrderQty',
    key: 'purchaseOrderQty',
    render: qty => <span className="font-semibold">{qty ?? 0}</span>,
    sorter: true,
    sortDirections: ['descend', 'ascend'],
  },
  {
    title: 'PO Value',
    dataIndex: 'purchaseOrderValue',
    key: 'purchaseOrderValue',
    render: val => <div className="font-semibold">{formatAmount(val)}</div>,
    sorter: true,
    sortDirections: ['descend', 'ascend'],
  },
  {
    title: 'GRPO Qty',
    dataIndex: 'grpoQty',
    key: 'grpoQty',
    render: qty => <span className="font-semibold">{qty ?? 0}</span>,
    sorter: true,
    sortDirections: ['descend', 'ascend'],
  },
  {
    title: 'GRPO Value',
    dataIndex: 'grpoValue',
    key: 'grpoValue',
    render: val => <div className="font-semibold">{formatAmount(val)}</div>,
    sorter: true,
    sortDirections: ['descend', 'ascend'],
  },
  {
    title: 'Bill Qty',
    dataIndex: 'billQty',
    key: 'billQty',
    render: qty => <span className="font-semibold">{qty ?? 0}</span>,
    sorter: true,
    sortDirections: ['descend', 'ascend'],
  },
  {
    title: 'Bill Value',
    dataIndex: 'billValue',
    key: 'billValue',
    render: val => <div className="font-semibold">{formatAmount(val)}</div>,
    sorter: true,
    sortDirections: ['descend', 'ascend'],
  },
  ...(isSplitSessionActive
    ? [
        {
          title: 'Bill Split Qty (By Qty)',
          dataIndex: 'billSplitByQtyQty',
          key: 'billSplitByQtyQty',
          render: qty => <span className="font-semibold">{qty ?? 0}</span>,
          sorter: true,
          sortDirections: ['descend', 'ascend'],
        },
        {
          title: 'Bill Split Value (By Qty)',
          dataIndex: 'billSplitByQtyValue',
          key: 'billSplitByQtyValue',
          render: val => <div className="font-semibold">{formatAmount(val || 0)}</div>,
          sorter: true,
          sortDirections: ['descend', 'ascend'],
        },
        {
          title: 'Bill Split Qty (By Price)',
          dataIndex: 'billSplitByPriceQty',
          key: 'billSplitByPriceQty',
          render: qty => <span className="font-semibold">{qty ?? 0}</span>,
          sorter: true,
          sortDirections: ['descend', 'ascend'],
        },
        {
          title: 'Bill Split Value (By Price)',
          dataIndex: 'billSplitByPriceValue',
          key: 'billSplitByPriceValue',
          render: val => <div className="font-semibold">{formatAmount(val || 0)}</div>,
          sorter: true,
          sortDirections: ['descend', 'ascend'],
        },
      ]
    : []),
];

export const topItemsOfPurchasecolumns = isSplitSessionActive => [
  {
    title: 'Item No',
    dataIndex: 'itemNo',
    key: 'itemNo',
    render: itemNo => <Tag className="font-semibold">{itemNo ?? '-'}</Tag>,
    sorter: true,
    sortDirections: ['descend', 'ascend'],
  },
  {
    title: 'Item Name',
    dataIndex: 'itemName',
    key: 'itemName',
    sorter: true,
    sortDirections: ['descend', 'ascend'],
  },
  {
    title: 'PO Qty',
    dataIndex: 'purchaseOrderQty',
    key: 'purchaseOrderQty',
    render: qty => <span className="font-semibold">{qty ?? 0}</span>,
    sorter: true,
    sortDirections: ['descend', 'ascend'],
  },
  {
    title: 'PO Value',
    dataIndex: 'purchaseOrderValue',
    key: 'purchaseOrderValue',
    render: val => <div className="font-semibold">{formatAmount(val)}</div>,
    sorter: true,
    sortDirections: ['descend', 'ascend'],
  },
  {
    title: 'GRPO Qty',
    dataIndex: 'grpoQty',
    key: 'grpoQty',
    render: qty => <span className="font-semibold">{qty ?? 0}</span>,
    sorter: true,
    sortDirections: ['descend', 'ascend'],
  },
  {
    title: 'GRPO Value',
    dataIndex: 'grpoValue',
    key: 'grpoValue',
    render: val => <div className="font-semibold">{formatAmount(val)}</div>,
    sorter: true,
    sortDirections: ['descend', 'ascend'],
  },
  {
    title: 'Bill Qty',
    dataIndex: 'billQty',
    key: 'billQty',
    render: qty => <span className="font-semibold">{qty ?? 0}</span>,
    sorter: true,
    sortDirections: ['descend', 'ascend'],
  },
  {
    title: 'Bill Value',
    dataIndex: 'billValue',
    key: 'billValue',
    render: val => <div className="font-semibold">{formatAmount(val)}</div>,
    sorter: true,
    sortDirections: ['descend', 'ascend'],
  },
  ...(isSplitSessionActive
    ? [
        {
          title: 'Bill Split Qty (By Qty)',
          dataIndex: 'billSplitByQtyQty',
          key: 'billSplitByQtyQty',
          render: qty => <span className="font-semibold">{qty ?? 0}</span>,
          sorter: true,
          sortDirections: ['descend', 'ascend'],
        },
        {
          title: 'Bill Split Value (By Qty)',
          dataIndex: 'billSplitByQtyValue',
          key: 'billSplitByQtyValue',
          render: val => <div className="font-semibold">{formatAmount(val || 0)}</div>,
          sorter: true,
          sortDirections: ['descend', 'ascend'],
        },
        {
          title: 'Bill Split Qty (By Price)',
          dataIndex: 'billSplitByPriceQty',
          key: 'billSplitByPriceQty',
          render: qty => <span className="font-semibold">{qty ?? 0}</span>,
          sorter: true,
          sortDirections: ['descend', 'ascend'],
        },
        {
          title: 'Bill Split Value (By Price)',
          dataIndex: 'billSplitByPriceValue',
          key: 'billSplitByPriceValue',
          render: val => <div className="font-semibold">{formatAmount(val || 0)}</div>,
          sorter: true,
          sortDirections: ['descend', 'ascend'],
        },
      ]
    : []),
];

export const topCustomerByAmountCollectioncolumns = () => [
  {
    title: 'Customer Name',
    dataIndex: 'vendorName',
    key: 'vendorName',
    render: vendorName => vendorName || '',
  },
  {
    title: 'Invoice Count',
    dataIndex: 'invoiceCount',
    key: 'invoiceCount',
    render: invoiceCount => invoiceCount,
  },
  {
    title: 'Total Balance',
    dataIndex: 'totalBalance',
    key: 'totalBalance',
    render: totalBalance => formatAmount(typeof totalBalance === 'number' ? totalBalance : 0),
  },
];

export const upcomingReceivablesInvoiceCollectionColumns = () => [
  {
    title: 'Invoice#',
    dataIndex: 'invoiceId',
    key: 'invoiceId',
    render: invoiceId => <Tag className="font-semibold">{invoiceId}</Tag>,
    fixed: 'left',
  },
  {
    title: 'Customer Name',
    dataIndex: 'customerName',
    key: 'customerName',
  },
  {
    title: 'Due Date',
    dataIndex: 'dueDate',
    key: 'dueDate',
    render: dueDate => dayjs(dueDate).format('DD/MM/YYYY') || '',
  },
  {
    title: 'Amount',
    dataIndex: 'balanceAmount',
    key: 'balanceAmount',
    render: balanceAmount => formatAmount(typeof balanceAmount === 'number' ? balanceAmount : 0),
  },
];

export const recentPaymentsReceivedCollectionColumns = () => [
  {
    title: 'Payment#',
    dataIndex: 'paymentReceivedId',
    key: 'paymentReceivedId',
    render: paymentReceivedId => <Tag className="font-semibold">{paymentReceivedId}</Tag>,
    fixed: 'left',
  },
  {
    title: 'Customer Name',
    dataIndex: 'customerName',
    key: 'customerName',
  },
  {
    title: 'Payment Mode',
    dataIndex: 'paymentMode',
    key: 'paymentMode',
    render: paymentMode => <PaymentModeBadge paymentMode={paymentMode} />,
  },
  {
    title: 'Date',
    dataIndex: 'paymentDate',
    key: 'paymentDate',
    render: paymentDate => dayjs(paymentDate).format('DD/MM/YYYY') || '',
  },
  {
    title: 'Amount',
    dataIndex: 'amountReceived',
    key: 'amountReceived',
    render: amountReceived => formatAmount(typeof amountReceived === 'number' ? amountReceived : 0),
  },
];

export const overdueInvoicesCollectionColumns = () => [
  {
    title: 'Invoice#',
    dataIndex: 'invoiceId',
    key: 'invoiceId',
    render: invoiceId => <Tag className="font-semibold">{invoiceId}</Tag>,
    fixed: 'left',
  },
  {
    title: 'Customer Name',
    dataIndex: 'customerName',
    key: 'customerName',
  },
  {
    title: 'Due Date',
    dataIndex: 'dueDate',
    key: 'dueDate',
    render: dueDate => dayjs(dueDate).format('DD/MM/YYYY') || '',
  },
  {
    title: 'Amount',
    dataIndex: 'balanceAmount',
    key: 'balanceAmount',
    render: balanceAmount => formatAmount(typeof balanceAmount === 'number' ? balanceAmount : 0),
  },
];

export const itemProcessAnalyticsExportColumn = () => [
  {
    title: 'Date',
    getExportValue: record => (record?.date ? dayjs(record.date).format('DD/MM/YYYY') : ''),
  },
  {
    title: 'Job No',
    getExportValue: record => record?.jobNo || '',
  },
  {
    title: 'Product',
    getExportValue: record => [record?.itemName, record?.itemNo].filter(Boolean).join(' - ') || '',
  },
  {
    title: 'From',
    getExportValue: record => record?.from || '',
  },
  {
    title: 'To',
    getExportValue: record => record?.to || '',
  },
  {
    title: 'Send Qty',
    getExportValue: record => (typeof record?.sendQty === 'number' ? record.sendQty : 0),
  },
  {
    title: 'Send By',
    getExportValue: record => record?.sendBy || '',
  },
  {
    title: 'Recv Qty',
    getExportValue: record => (typeof record?.recvQty === 'number' ? record.recvQty : 0),
  },
  {
    title: 'Recv By',
    getExportValue: record => record?.recvBy || '',
  },
];

export const itemProcessAnalyticsColumns = () => [
  {
    title: 'Date',
    dataIndex: 'date',
    key: 'date',
    render: date => (date ? dayjs(date).format('DD/MM/YYYY') : ''),
  },
  {
    title: 'Job No',
    dataIndex: 'jobNo',
    key: 'jobNo',
    render: jobNo => jobNo || '',
  },
  {
    title: 'Product',
    dataIndex: 'itemName',
    key: 'itemName',
    render: (itemName, record) => [itemName, record?.itemNo].filter(Boolean).join(' - ') || '',
  },
  {
    title: 'From',
    dataIndex: 'from',
    key: 'from',
  },
  {
    title: 'To',
    dataIndex: 'to',
    key: 'to',
  },
  {
    title: 'Send Qty',
    dataIndex: 'sendQty',
    key: 'sendQty',
    render: sendQty => (typeof sendQty === 'number' ? sendQty : 0),
  },
  {
    title: 'Send By',
    dataIndex: 'sendBy',
    key: 'sendBy',
    render: sendBy => sendBy || '',
  },
  {
    title: 'Recv Qty',
    dataIndex: 'recvQty',
    key: 'recvQty',
    render: recvQty => (typeof recvQty === 'number' ? recvQty : 0),
  },
  {
    title: 'Recv By',
    dataIndex: 'recvBy',
    key: 'recvBy',
    render: recvBy => recvBy || '',
  },
];

export const topVendorsByAmountPaymentColumns = () => [
  {
    title: 'Vendor Name',
    dataIndex: 'vendorName',
    key: 'vendorName',
    render: vendorName => vendorName || '',
  },
  {
    title: 'Bill Count',
    dataIndex: 'billCount',
    key: 'billCount',
    render: billCount => billCount,
  },
  {
    title: 'Total Balance',
    dataIndex: 'totalBalance',
    key: 'totalBalance',
    render: totalBalance => formatAmount(typeof totalBalance === 'number' ? totalBalance : 0),
  },
];

export const upcomingPayablesBillsPaymentColumns = () => [
  {
    title: 'Bill#',
    dataIndex: 'billId',
    key: 'billId',
    render: billId => <Tag className="font-semibold">{billId}</Tag>,
    fixed: 'left',
  },
  {
    title: 'Vendor Name',
    dataIndex: 'vendorName',
    key: 'vendorName',
    render: vendorName => vendorName || '',
  },
  {
    title: 'Due Date',
    dataIndex: 'dueDate',
    key: 'dueDate',
    render: dueDate => dayjs(dueDate).format('DD/MM/YYYY') || '',
  },
  {
    title: 'Amount',
    dataIndex: 'balanceAmount',
    key: 'balanceAmount',
    render: balanceAmount => formatAmount(typeof balanceAmount === 'number' ? balanceAmount : 0),
  },
];

export const recentPaymentsMadePaymentColumns = () => [
  {
    title: 'Payment Made#',
    dataIndex: 'paymentMadeId',
    key: 'paymentMadeId',
    render: billId => <Tag className="font-semibold">{billId}</Tag>,
    fixed: 'left',
  },
  {
    title: 'Vendor Name',
    dataIndex: 'vendorName',
    key: 'vendorName',
    render: vendorName => vendorName || '',
  },
  {
    title: 'Payment Mode',
    dataIndex: 'paymentMode',
    key: 'paymentMode',
    render: paymentMode => <PaymentModeBadge paymentMode={paymentMode} />,
  },
  {
    title: 'Date',
    dataIndex: 'paymentDate',
    key: 'paymentDate',
    render: paymentDate => dayjs(paymentDate).format('DD/MM/YYYY') || '',
  },
  {
    title: 'Amount',
    dataIndex: 'paymentMade',
    key: 'paymentMade',
    render: paymentMade => formatAmount(typeof paymentMade === 'number' ? paymentMade : 0),
  },
];

export const overdueBillsPaymentColumns = () => [
  {
    title: 'Bill#',
    dataIndex: 'billId',
    key: 'billId',
    render: billId => <Tag className="font-semibold">{billId}</Tag>,
    fixed: 'left',
  },
  {
    title: 'Vendor Name',
    dataIndex: 'vendorName',
    key: 'vendorName',
    render: vendorName => vendorName || '',
  },
  {
    title: 'Due Date',
    dataIndex: 'dueDate',
    key: 'dueDate',
    render: dueDate => dayjs(dueDate).format('DD/MM/YYYY') || '',
  },
  {
    title: 'Amount',
    dataIndex: 'balanceAmount',
    key: 'balanceAmount',
    render: balanceAmount => formatAmount(typeof balanceAmount === 'number' ? balanceAmount : 0),
  },
];

const renderRejectionRate = rate => {
  const value = Number(rate ?? 0);
  const color = value === 0 ? 'text-green-600 bg-green-50' : value < 5 ? 'text-yellow-600 bg-yellow-50' : 'text-red-600 bg-red-50';
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{formatAmount(value, false, null, 1)}%</span>;
};

export const rejectionByItemColumns = () => [
  { title: 'Item Number', dataIndex: 'itemCode', key: 'itemCode', width: 44, render: v => <Tag>{v || '—'}</Tag> },
  { title: 'Item Name', dataIndex: 'itemName', key: 'itemName', ellipsis: true, width: 44, render: v => <span className="text-xs font-medium text-gray-900 truncate block">{v || '—'}</span> },
  { title: 'Ord.', dataIndex: 'orderCount', key: 'orderCount', width: 48, render: v => <span className="text-xs tabular-nums text-gray-700">{v ?? 0}</span> },
  { title: 'Plnd.', dataIndex: 'totalPlanned', key: 'totalPlanned', width: 48, render: v => <span className="text-xs tabular-nums">{v ?? 0}</span> },
  { title: 'Rej.', dataIndex: 'totalRejected', key: 'totalRejected', width: 48, render: v => <span className="text-xs tabular-nums font-semibold text-red-600">{v ?? 0}</span> },
  { title: 'Rate', dataIndex: 'rejectionRate', key: 'rejectionRate', width: 56, render: renderRejectionRate },
];

export const rejectionByRawMaterialColumns = () => [
  { title: 'Item Number', dataIndex: 'itemCode', key: 'itemCode', width: 44, render: v => <Tag>{v || '—'}</Tag> },
  { title: 'Material', dataIndex: 'itemName', key: 'itemName', ellipsis: true, width: 44, render: v => <span className="text-xs font-medium text-gray-900 truncate block">{v || '—'}</span> },
  { title: 'Req.', dataIndex: 'totalRequired', key: 'totalRequired', width: 44, render: v => <span className="text-xs tabular-nums">{v ?? 0}</span> },
  { title: 'Rej.', dataIndex: 'totalRejected', key: 'totalRejected', width: 44, render: v => <span className="text-xs tabular-nums font-semibold text-red-600">{v ?? 0}</span> },
  { title: 'Ret.', dataIndex: 'totalReturned', key: 'totalReturned', width: 44, render: v => <span className="text-xs tabular-nums text-orange-600">{v ?? 0}</span> },
  { title: 'Rate', dataIndex: 'rejectionRate', key: 'rejectionRate', width: 56, render: renderRejectionRate },
];

export const rejectionByProcessColumns = () => [
  { title: 'Step', dataIndex: 'processName', key: 'processName', ellipsis: true, render: v => <span className="text-xs font-medium text-gray-900 truncate block">{v || '—'}</span> },
  { title: 'IN', dataIndex: 'totalProcessIN', key: 'totalProcessIN', width: 44, render: v => <span className="text-xs tabular-nums">{v ?? 0}</span> },
  { title: 'OUT', dataIndex: 'totalProcessOUT', key: 'totalProcessOUT', width: 44, render: v => <span className="text-xs tabular-nums text-green-600">{v ?? 0}</span> },
  { title: 'Rej.', dataIndex: 'totalRejection', key: 'totalRejection', width: 44, render: v => <span className="text-xs tabular-nums font-semibold text-red-600">{v ?? 0}</span> },
  { title: 'Rate', dataIndex: 'rejectionRate', key: 'rejectionRate', width: 56, render: renderRejectionRate },
];

export const rejectionByBranchColumns = () => [
  { title: 'Branch', dataIndex: 'branchName', key: 'branchName', ellipsis: true, render: v => <span className="text-xs font-medium text-gray-900 truncate block">{v || '—'}</span> },
  { title: 'Ord.', dataIndex: 'orderCount', key: 'orderCount', width: 44, render: v => <span className="text-xs tabular-nums text-gray-700">{v ?? 0}</span> },
  { title: 'Plnd.', dataIndex: 'totalPlanned', key: 'totalPlanned', width: 44, render: v => <span className="text-xs tabular-nums">{v ?? 0}</span> },
  { title: 'Sub.', dataIndex: 'totalSubmitted', key: 'totalSubmitted', width: 44, render: v => <span className="text-xs tabular-nums text-green-600">{v ?? 0}</span> },
  { title: 'Rej.', dataIndex: 'totalRejected', key: 'totalRejected', width: 44, render: v => <span className="text-xs tabular-nums font-semibold text-red-600">{v ?? 0}</span> },
  { title: 'Rate', dataIndex: 'rejectionRate', key: 'rejectionRate', width: 56, render: renderRejectionRate },
];

export const itemRejectionAnalyticsColumn = (onItemClick = null) => {
  return [
    {
      title: 'Item#',
      dataIndex: 'itemNo',
      width: 120,
      key: 'itemNo',
      render: (itemNo, record) =>
        itemNo ? (
          <Tag className="font-semibold cursor-pointer" onClick={() => onItemClick?.(record)}>
            {itemNo}
          </Tag>
        ) : (
          '-'
        ),
      visible: true,
      sorter: false,
    },
    {
      title: 'Item Name',
      dataIndex: 'itemName',
      key: 'itemName',
      visible: true,
      sorter: false,
    },
    {
      title: 'Production Orders',
      dataIndex: 'productionOrders',
      key: 'productionOrders',
      width: 200,
      render: productionOrders => {
        const list = productionOrders || [];
        if (!list.length) return '-';
        const VISIBLE = 2;
        const visible = list.slice(0, VISIBLE);
        const hidden = list.slice(VISIBLE);
        return (
          <div className="flex items-center gap-1 flex-nowrap">
            {visible.map(order => (
              <Link key={order.productionOrderId} to={`/production-orders/${order.productionOrderId}`}>
                <Tag className="font-semibold m-0">{order.productionOrderCode}</Tag>
              </Link>
            ))}
            {hidden.length > 0 && (
              <Popover
                trigger="hover"
                content={
                  <div className={`flex flex-wrap gap-2 ${list.length > 30 ? 'max-w-[780px]' : 'max-w-[280px]'}`}>
                    {list.map(order => (
                      <Link key={order.productionOrderId} to={`/production-orders/${order.productionOrderId}`}>
                        <Tag className="font-semibold m-0">{order.productionOrderCode}</Tag>
                      </Link>
                    ))}
                  </div>
                }
              >
                <Tag className="font-semibold m-0 cursor-pointer">+{hidden.length}</Tag>
              </Popover>
            )}
          </div>
        );
      },
      visible: true,
      sorter: false,
    },
    {
      title: 'Order Count',
      dataIndex: 'productionOrders',
      key: 'orderCount',
      width: 110,
      render: productionOrders => productionOrders?.length || 0,
      visible: true,
      sorter: false,
    },
    {
      title: 'Total Rejected Qty',
      dataIndex: 'totalRejectedQty',
      key: 'totalRejectedQty',
      width: 150,
      render: value => <span className="font-semibold text-red-600">{value ?? 0}</span>,
      visible: true,
      sorter: false,
    },
    {
      title: 'Rejection Percentage',
      dataIndex: 'rejectionPercentage',
      key: 'rejectionPercentage',
      width: 200,
      render: value => <span className="font-semibold">{value ? `${value}%` : ''}</span>,
      visible: true,
      sorter: false,
    },
  ];
};

export const itemRejectionAnalyticsProductionOrderColumn = () => {
  return [
    {
      title: 'Production Order#',
      dataIndex: 'productionOrderCode',
      width: 140,
      key: 'productionOrderCode',
      render: (code, record) =>
        code ? (
          <Link to={`/production-orders/${record.productionOrderId}`}>
            <Tag className="font-semibold">{code}</Tag>
          </Link>
        ) : (
          '-'
        ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: status => (status ? <StatusBadge status={status} value={status} /> : '-'),
    },
    getDateColumn('Production Date', 'productionDate', 'productionDate', true, false, 140),
    {
      title: 'FG Rejected Qty',
      dataIndex: 'fgRejectedQty',
      key: 'fgRejectedQty',
      width: 130,
      render: value => value ?? 0,
    },
    {
      title: 'RM Rejected Qty',
      dataIndex: 'rawMaterialRejectedQty',
      key: 'rawMaterialRejectedQty',
      width: 140,
      render: value => value ?? 0,
    },
    {
      title: 'Rejected Qty',
      dataIndex: 'rejectedQty',
      key: 'rejectedQty',
      width: 120,
      render: value => <span className="font-semibold text-red-600">{value ?? 0}</span>,
    },
  ];
};

export const flattenItemRejectionExportRows = (items = []) =>
  items.map(item => ({
    itemNo: item?.itemNo || '',
    itemName: item?.itemName || '',
    orderCount: item?.productionOrders?.length ?? 0,
    totalRejectedQty: item?.totalRejectedQty ?? 0,
    rejectionPercentage: item?.rejectionPercentage,
  }));

export const itemRejectionAnalyticsExportColumn = () => [
  {
    title: 'Item#',
    getExportValue: record => record?.itemNo || '',
  },
  {
    title: 'Item Name',
    getExportValue: record => record?.itemName || '',
  },
  {
    title: 'Order Count',
    getExportValue: record => record?.orderCount ?? 0,
  },
  {
    title: 'Total Rejected Qty',
    getExportValue: record => record?.totalRejectedQty ?? 0,
  },
  {
    title: 'Rejection Percentage',
    getExportValue: record => (record?.rejectionPercentage != null && record?.rejectionPercentage !== '' ? `${record.rejectionPercentage}%` : ''),
  },
];

const STOCK_STATUS_LABEL = {
  BELOW_MINIMUM: 'Below Min',
  ABOVE_MAXIMUM: 'Above Max',
  NORMAL: 'Normal',
};

export const stockSummaryColumns = (onDateWiseClick, page = 1, limit = 15) => [
  {
    title: '#',
    width: 50,
    render: (_, __, idx) => <span className="text-xs text-gray-500">{(Number(page) - 1) * Number(limit) + idx + 1}</span>,
  },
  {
    title: 'Item',
    dataIndex: 'itemName',
    key: 'itemName',
    width: 200,
    render: (v, row) => (
      <div>
        <p className="text-sm font-medium text-gray-900 truncate">{v || '-'}</p>
        {row.itemNo && <p className="text-xs text-gray-400">{row.itemNo}</p>}
      </div>
    ),
  },
  {
    title: 'Warehouse',
    dataIndex: 'warehouseName',
    key: 'warehouseName',
    width: 150,
    render: v => <span className="text-sm text-gray-700">{v || '-'}</span>,
  },
  {
    title: 'Opening',
    dataIndex: 'openingQty',
    key: 'openingQty',
    width: 100,
    align: 'right',
    render: v => <span className="text-sm font-medium text-gray-700">{v ?? 0}</span>,
  },
  {
    title: 'Inward',
    dataIndex: 'inwardQty',
    key: 'inwardQty',
    width: 100,
    align: 'right',
    render: v => <span className="text-sm font-medium text-green-600">{v ?? 0}</span>,
  },
  {
    title: 'Outward',
    dataIndex: 'outwardQty',
    key: 'outwardQty',
    width: 100,
    align: 'right',
    render: v => <span className="text-sm font-medium text-red-500">{v ?? 0}</span>,
  },
  {
    title: 'Closing',
    dataIndex: 'closingQty',
    key: 'closingQty',
    width: 100,
    align: 'right',
    render: v => <span className="text-sm font-bold text-gray-900">{v ?? 0}</span>,
  },
  {
    title: 'Min / Max',
    key: 'minMax',
    width: 120,
    align: 'right',
    render: (_, row) => (
      <span className="text-xs text-gray-500">
        {row.minimumStockLevel ?? 0} / {row.maximumStockLevel ?? 0}
      </span>
    ),
  },
  {
    title: 'Status',
    dataIndex: 'stockStatus',
    key: 'stockStatus',
    width: 110,
    render: v => <StatusBadge status={v} value={STOCK_STATUS_LABEL?.[v] || v} />,
  },
  {
    title: 'Date-wise',
    key: 'datewise',
    width: 100,
    align: 'center',
    render: (_, row) => (
      <button type="button" className="text-xs font-semibold underline-offset-2 hover:underline" style={{ color: colorPalette.primary[500] }} onClick={() => onDateWiseClick?.(row)}>
        View
      </button>
    ),
  },
];

export const stockSummaryExportColumn = () => [
  {
    title: 'Item#',
    getExportValue: record => record?.itemNo || '',
  },
  {
    title: 'Item Name',
    getExportValue: record => record?.itemName || '',
  },
  {
    title: 'Warehouse',
    getExportValue: record => record?.warehouseName || '',
  },
  {
    title: 'Opening',
    getExportValue: record => record?.openingQty ?? 0,
  },
  {
    title: 'Inward',
    getExportValue: record => record?.inwardQty ?? 0,
  },
  {
    title: 'Outward',
    getExportValue: record => record?.outwardQty ?? 0,
  },
  {
    title: 'Closing',
    getExportValue: record => record?.closingQty ?? 0,
  },
  {
    title: 'Min Stock',
    getExportValue: record => record?.minimumStockLevel ?? 0,
  },
  {
    title: 'Max Stock',
    getExportValue: record => record?.maximumStockLevel ?? 0,
  },
  {
    title: 'Status',
    getExportValue: record => STOCK_STATUS_LABEL?.[record?.stockStatus] || record?.stockStatus || '',
  },
];

export const stockSummaryDateWiseColumns = (page = 1, limit = 15) => [
  {
    title: '#',
    width: 50,
    render: (_, __, idx) => <span className="text-xs text-gray-500">{(Number(page) - 1) * Number(limit) + idx + 1}</span>,
  },
  {
    title: 'Date',
    dataIndex: 'date',
    key: 'date',
    width: 120,
    render: v => <span className="text-sm text-gray-700">{v}</span>,
  },
  {
    title: 'Opening',
    dataIndex: 'openingQty',
    key: 'openingQty',
    width: 100,
    align: 'right',
    render: v => <span className="text-sm font-medium text-gray-700">{v ?? 0}</span>,
  },
  {
    title: 'Inward',
    dataIndex: 'inwardQty',
    key: 'inwardQty',
    width: 100,
    align: 'right',
    render: v => <span className="text-sm font-medium text-green-600">{v ?? 0}</span>,
  },
  {
    title: 'Outward',
    dataIndex: 'outwardQty',
    key: 'outwardQty',
    width: 100,
    align: 'right',
    render: v => <span className="text-sm font-medium text-red-500">{v ?? 0}</span>,
  },
  {
    title: 'Closing',
    dataIndex: 'closingQty',
    key: 'closingQty',
    width: 100,
    align: 'right',
    render: v => <span className="text-sm font-bold text-gray-900">{v ?? 0}</span>,
  },
];
