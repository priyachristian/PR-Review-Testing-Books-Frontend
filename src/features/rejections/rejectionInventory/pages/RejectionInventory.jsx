import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tag, Tooltip } from '@/components/AntDComponent';
import Icons from '@/assets/icons/icon';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import StatTile from '@/components/dataDisplay/statCard/StatTile';
import { REJECTION_STATUS as STATUS, REJECTION_FLOW as FLOW } from '@/utils/dropdownEnums';
import { useRejectionOrder } from '@/features/rejections/bookRejections/useRejectionOrder';
import { useCompanyCurrency } from '@/hooks/useCompanyCurrency';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';
import { colorPalette } from '@/utils/theme';
import { ADMIN_ROUTE_PATHS } from '@/routes/adminRoutePaths';

const getRejectedQty = item => Math.max(0, (item.receivedQty || item.bookedQty || 0) - (item.returnedQty || 0) - (item.warrantyExpiredQty || 0));

const sumOrderPieces = orders => orders.reduce((total, order) => total + (order.items || []).reduce((orderTotal, item) => orderTotal + getRejectedQty(item), 0), 0);

export default function RejectionInventory() {
  const navigate = useNavigate();
  const { inventoryData, inventoryExtras, inventoryLoading, getRejectionInventory } = useRejectionOrder();
  const { currencySymbol } = useCompanyCurrency();
  const [status, setStatus] = useState('RECEIVED');
  const [inventoryPage, setInventoryPage] = useState(1);
  const [orderPage, setOrderPage] = useState(1);

  useEffect(() => {
    getRejectionInventory();
  }, []);

  const allOrders = Array.isArray(inventoryData) ? inventoryData : [];
  const ordersForStatus = allOrders.filter(order => order.status === status);
  const selectedStatusMeta = STATUS[status];

  // Aggregate rejected pieces and value by item name + wattage.
  const itemAggregates = {};
  ordersForStatus.forEach(order => {
    (order.items || []).forEach(item => {
      const itemName = item.itemId?.name || 'Unknown';
      const wattage = item.wattage || '';
      const unitPrice = item.itemId?.price || 0;
      const rejectedQty = getRejectedQty(item);
      if (rejectedQty <= 0) return;
      const aggregateKey = `${itemName}||${wattage}`;
      if (!itemAggregates[aggregateKey]) itemAggregates[aggregateKey] = { name: itemName, wattage, qty: 0, value: 0, orders: 0 };
      itemAggregates[aggregateKey].qty += rejectedQty;
      itemAggregates[aggregateKey].value += unitPrice * rejectedQty;
      itemAggregates[aggregateKey].orders += 1;
    });
  });
  const inventoryItems = Object.values(itemAggregates)
    .sort((first, second) => second.qty - first.qty)
    .map((aggregate, index) => ({ ...aggregate, key: index }));

  const statusPieces = sumOrderPieces(ordersForStatus);
  const inventoryValue = inventoryItems.reduce((total, aggregate) => total + aggregate.value, 0);
  const totalPieces = sumOrderPieces(allOrders);

  const formatCurrency = amount => `${currencySymbol}${Math.round(amount).toLocaleString('en-IN')}`;

  const totalRow = { key: '__total__', isTotal: true, name: 'Total', wattage: '', qty: statusPieces, value: inventoryValue, orders: ordersForStatus.length };

  const inventoryColumns = [
    {
      title: 'Item (Series)',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Wattage',
      dataIndex: 'wattage',
      key: 'wattage',
      render: (wattage, record) => (record.isTotal ? null : wattage ? `${wattage}W` : '—'),
    },
    { title: 'Orders', dataIndex: 'orders', key: 'orders' },
    {
      title: 'Pieces',
      dataIndex: 'qty',
      key: 'qty',
      render: qty => qty.toLocaleString('en-IN'),
    },
    {
      title: `Value (${currencySymbol})`,
      dataIndex: 'value',
      key: 'value',
      render: value => <strong>{formatCurrency(value)}</strong>,
    },
  ];

  const orderColumns = [
    {
      title: 'Booking#',
      dataIndex: 'rejectionOrderId',
      key: 'rejectionOrderId',
      width: 130,
      render: (rejectionOrderId, record) => <Tag className="font-semibold">{rejectionOrderId || record._id}</Tag>,
    },
    {
      title: 'Customer',
      key: 'customer',
      render: (_, record) => <b>{record.customerId?.customerDisplayName || record.customerId?.companyName || '-'}</b>,
    },
    {
      title: 'Location',
      key: 'location',
      render: (_, record) => (
        <span className="inline-flex items-center gap-1 text-gray-500">
          <Icons.EnvironmentOutlined style={{ fontSize: 13, color: colorPalette.secondary[400] }} />
          {record.address?.city || '-'}, {record.address?.state || '-'}
        </span>
      ),
    },
    { title: 'Items', key: 'items', render: (_, record) => (record.items || []).length },
    {
      title: 'Pieces',
      key: 'pieces',
      render: (_, record) => <b>{sumOrderPieces([record]).toLocaleString('en-IN')}</b>,
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      render: (_, record) => (
        <Tooltip title="View Rejection">
          <Icons.EyeOutlined
            className="cursor-pointer"
            style={{ fontSize: 17, color: colorPalette.primary[500] }}
            onClick={() => navigate(`/${ADMIN_ROUTE_PATHS.rejections.build.detail(record._id)}`)}
          />
        </Tooltip>
      ),
    },
  ];

  const handleStatusClick = nextStatus => {
    setStatus(nextStatus);
    setInventoryPage(1);
    setOrderPage(1);
  };

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-lg font-bold text-gray-900 m-0">Rejection Inventory</h1>
        <p className="text-sm text-gray-500 mt-0.5">Select a status to view held items.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-9 gap-3 mb-4">
        {FLOW.map(flowStatus => {
          const statusMeta = STATUS[flowStatus];
          const StatusIcon = statusMeta?.icon;
          const statusOrders = allOrders.filter(order => order.status === flowStatus);
          const flowStatusPieces = sumOrderPieces(statusOrders);
          return (
            <StatTile
              key={flowStatus}
              icon={StatusIcon ? <StatusIcon style={{ fontSize: 15 }} /> : null}
              label={statusMeta?.label ?? flowStatus}
              value={flowStatusPieces.toLocaleString('en-IN')}
              suffix="pc"
              caption={`${statusOrders.length} order${statusOrders.length !== 1 ? 's' : ''}`}
              selected={status === flowStatus}
              onClick={() => handleStatusClick(flowStatus)}
            />
          );
        })}

        <StatTile
          icon={<Icons.RollbackOutlined style={{ fontSize: 15 }} />}
          label="Vendor Returned"
          value={(inventoryExtras?.vendorReturnedPcs || 0).toLocaleString('en-IN')}
          suffix="pc"
          caption={`Return value: ${currencySymbol}${(inventoryExtras?.vendorReturnedValue || 0).toLocaleString('en-IN')}`}
        />
        <StatTile
          icon={<Icons.DeleteOutlined style={{ fontSize: 15 }} />}
          label="Scrapped"
          value={(inventoryExtras?.scrappedPcs || 0).toLocaleString('en-IN')}
          suffix="pc"
          caption={inventoryExtras?.scrappedKg ? `≈ ${inventoryExtras.scrappedKg} kg` : undefined}
          subCaption={`Scrap value: ${currencySymbol}${(inventoryExtras?.scrappedValue || 0).toLocaleString('en-IN')}`}
        />
        <StatTile
          icon={<Icons.BoxPlotOutlined style={{ fontSize: 15 }} />}
          label="Total"
          value={totalPieces.toLocaleString('en-IN')}
          suffix="pc"
          caption={`${allOrders.length} order${allOrders.length !== 1 ? 's' : ''}`}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <StatTile icon={<Icons.InboxOutlined style={{ fontSize: 15 }} />} label={`${selectedStatusMeta?.label} — Pieces`} value={statusPieces.toLocaleString('en-IN')} suffix="pc" />
        <StatTile icon={<Icons.AppstoreOutlined style={{ fontSize: 15 }} />} label="Distinct Items" value={inventoryItems.length} />
        <StatTile icon={<Icons.DollarOutlined style={{ fontSize: 15 }} />} label="Inventory Value" value={formatCurrency(inventoryValue)} />
        <StatTile icon={<Icons.FileTextOutlined style={{ fontSize: 15 }} />} label="Orders" value={ordersForStatus.length} />
      </div>

      <div className="font-bold text-sm text-gray-900 mb-2">Item-wise inventory at &quot;{selectedStatusMeta?.label}&quot;</div>
      <CustomTable
        columns={inventoryColumns}
        data={[...inventoryItems, ...(inventoryItems.length > 0 ? [totalRow] : [])]}
        loading={inventoryLoading}
        rowClassName={record => (record.isTotal ? 'font-bold bg-gray-50' : '')}
        pagination={{ current: inventoryPage, pageSize: DEFAULT_PAGE_SIZE, total: inventoryItems.length, onChange: page => setInventoryPage(page) }}
        isPaginationFixed={false}
      />

      <div className="font-bold text-sm text-gray-900 mt-4 mb-2">Orders at &quot;{selectedStatusMeta?.label}&quot;</div>
      <CustomTable
        columns={orderColumns}
        data={ordersForStatus.map((order, index) => ({ ...order, key: order._id || index }))}
        loading={inventoryLoading}
        onRowClick={record => navigate(`/${ADMIN_ROUTE_PATHS.rejections.build.detail(record._id)}`)}
        pagination={{ current: orderPage, pageSize: DEFAULT_PAGE_SIZE, total: ordersForStatus.length, onChange: page => setOrderPage(page) }}
        isPaginationFixed={false}
      />
    </div>
  );
}
