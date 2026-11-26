import { Tag } from 'antd';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import { getDateColumn, getAmountCoulmn, TruncatedCell, getOverflowListColumn, getQuantitySummaryColumn } from '@/utils/tableColumns';
import { SALES_ORDER_STATUS, RAW_MATERIAL_STATUS } from '@/utils/constants';
import { Tooltip } from '@/components/AntDComponent';
import { dateFormateForUi } from '@/utils/services';
import { formatAmount } from '@/utils/currency';
import { formatQtyWithUnit } from '@/utils/itemLineUnit';

const deliveryChallanOverflowList = {
  getKey: (item, index) => `${item.id || item._id}-${index}`,
  getLabel: item => item.challanId,
  getLink: item => `/delivery-challans/${item.id || item._id}`,
};

const invoiceOverflowList = {
  getKey: (item, index) => `${item.id || item._id}-${index}`,
  getLabel: item => item.invoiceId,
  getLink: item => `/invoices/${item.id || item._id}`,
};

export const salesOrderColumn = isHaveProductionAccess => {
  return [
    {
      title: 'Sales Order#',
      dataIndex: 'orderId',
      key: 'orderId',
      render: value => <Tag className="font-semibold">{value}</Tag>,
      visible: true,
      required: true,
      fixed: 'left',
      sorter: true,
    },
    getDateColumn('Date', 'orderDate', 'orderDate', true, true),
    {
      title: 'Customer Name',
      dataIndex: 'customerDisplayName',
      key: 'customerDisplayName',
      visible: true,
      required: true,
      sorter: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => <StatusBadge status={status} value={SALES_ORDER_STATUS?.[status] || ''} />,
      visible: true,
      required: true,
      sorter: true,
    },
    ...(!isHaveProductionAccess
      ? []
      : [
          {
            title: 'Production Order Status',
            dataIndex: 'productionOrderStatus',
            key: 'productionOrderStatus',
            visible: true,
            sorter: true,
            render: status => <StatusBadge status={status} value={status} />,
          },
        ]),
    {
      title: 'Sales Order Tags',
      dataIndex: 'tagName',
      key: 'tagName',
      visible: true,
      sorter: true,
      render: (_, record) => {
        const hex = record?.tagColor;
        const label = record?.tagName ?? '-';
        if (label === '-' && !hex) return '-';
        if (!hex) {
          return (
            <span className="inline-block max-w-[260px] truncate text-xs text-gray-700" title={label}>
              {label}
            </span>
          );
        }
        return (
          <Tooltip title={`${label} (${hex})`} placement="topLeft">
            <span className="inline-block min-w-0 max-w-[260px]">
              <StatusBadge accentHex={hex} value={label} />
            </span>
          </Tooltip>
        );
      },
    },
    {
      title: 'Item Count',
      dataIndex: 'itemCount',
      key: 'itemCount',
      visible: true,
      width: 120,
    },
    getQuantitySummaryColumn(),
    getAmountCoulmn('Basic Amount', 'subTotal', 'subTotal', true),
    getAmountCoulmn('Total Amount', 'total', 'total', true, true),
    getAmountCoulmn('Remaining Amount', 'remainingAmount', 'remainingAmount', true),
    {
      title: 'Delivery Method',
      dataIndex: 'deliveryMethod',
      key: 'deliveryMethod',
      visible: false,
    },
    getDateColumn('Expected Shipment Date', 'expectedShipmentDate', 'expectedShipmentDate', false),
    {
      title: 'Payment Terms',
      dataIndex: 'paymentTermsId',
      key: 'paymentTermsId',
      visible: false,
      render: paymentTermsId => paymentTermsId?.name || '-',
    },
    {
      title: 'Reference',
      dataIndex: 'reference',
      key: 'reference',
      visible: false,
    },
    {
      title: 'Customer Notes',
      dataIndex: 'customerNotes',
      key: 'customerNotes',
      visible: false,
      ellipsis: {
        showTitle: false,
      },
      render: text => <TruncatedCell value={text} />,
    },
    getOverflowListColumn({
      title: 'Delivery Challans',
      dataIndex: 'deliveryChallans',
      key: 'deliveryChallans',
      overflowList: deliveryChallanOverflowList,
    }),
    getOverflowListColumn({
      title: 'Invoices',
      dataIndex: 'invoices',
      key: 'invoices',
      overflowList: invoiceOverflowList,
    }),
    {
      title: 'Division',
      dataIndex: 'divisionName',
      key: 'divisionName',
      visible: true,
      sorter: true,
    },
    {
      title: 'Branch',
      dataIndex: 'branchName',
      key: 'branchName',
      visible: true,
      sorter: true,
    },
    {
      title: 'Warehouse',
      dataIndex: 'warehouseName',
      key: 'warehouseName',
      visible: true,
      sorter: true,
    },
    {
      title: 'Added By',
      dataIndex: 'addedBy',
      key: 'addedBy',
      visible: true,
      sorter: true,
    },
    {
      title: 'Updated By',
      dataIndex: 'updatedBy',
      key: 'updatedBy',
      visible: true,
      sorter: true,
    },
    {
      title: 'Created From',
      dataIndex: 'appName',
      key: 'appName',
      visible: true,
      render: appName => appName || '',
      sorter: false,
    },
  ];
};

export const salesOrderItemColumns = (documentData, onItemClick) => {
  const currency = documentData?.currency;
  const showAmount = amount => formatAmount(amount, true, currency);
  const showQty = (qty, record) => formatQtyWithUnit(qty, record.unitName);

  return [
    {
      title: 'Item Number',
      dataIndex: 'itemNo',
      key: 'itemNo',
      width: 130,
      render: (itemNo, record) => (
        <Tag className="font-semibold m-0 cursor-pointer" onClick={() => onItemClick(record)}>
          {itemNo}
        </Tag>
      ),
    },
    {
      title: 'Item Name',
      dataIndex: 'itemName',
      key: 'itemName',
      render: (itemName, record) => (
        <div className="min-w-0">
          <TruncatedCell value={itemName} />
          {record.description && <div className="text-xs text-gray-600 mt-1">({record.description})</div>}
        </div>
      ),
    },
    { title: 'HSN/SAC', dataIndex: 'hsnCode', key: 'hsnCode', width: 100, render: hsnCode => hsnCode || 'N/A' },
    { title: 'Qty', dataIndex: 'quantity', key: 'quantity', width: 110, render: showQty },
    {
      title: 'Remaining Qty',
      dataIndex: 'remainingQty',
      key: 'remainingQty',
      width: 130,
      render: (remainingQty, record) => (
        <>
          {showQty(remainingQty, record)}
          {record.excessQty > 0 && <div className="text-[10px] text-red-600 mt-0.5">Over-converted by {record.excessQty}</div>}
        </>
      ),
    },
    { title: 'Available Qty', dataIndex: 'availableQty', key: 'availableQty', width: 120, render: showQty },
    { title: 'Unit Price', dataIndex: 'unitPrice', key: 'unitPrice', width: 120, render: showAmount },
    ...(documentData?.appliesTo === 'ITEM' && !documentData?.isSplit ? [{ title: 'Discount', dataIndex: 'discount', key: 'discount', width: 100 }] : []),
    ...(!documentData?.isSplit ? [{ title: 'Tax Rate(%)', dataIndex: 'taxRate', key: 'taxRate', width: 110 }] : []),
    { title: 'Amount', dataIndex: 'amount', key: 'amount', width: 140, render: showAmount },
    { title: 'Remaining Amount', dataIndex: 'remainingAmount', key: 'remainingAmount', width: 150, render: showAmount },
  ];
};

export const salesOrderRawMaterialColumns = onItemClick => [
  {
    title: 'Item Number',
    dataIndex: 'itemNo',
    key: 'itemNo',
    width: 140,
    render: (itemNo, record) => (
      <Tag className="font-semibold m-0 cursor-pointer" onClick={() => onItemClick(record)}>
        {itemNo}
      </Tag>
    ),
  },
  { title: 'Raw Material', dataIndex: 'itemName', key: 'itemName', width: 240, render: itemName => <TruncatedCell value={itemName} /> },
  { title: 'Used In', dataIndex: 'usedIn', key: 'usedIn', width: 220, render: usedIn => <TruncatedCell value={usedIn} /> },
  { title: 'Required Qty', dataIndex: 'requiredQty', key: 'requiredQty', width: 140, render: (requiredQty, record) => formatQtyWithUnit(requiredQty, record.unitName) },
  { title: 'In Stock', dataIndex: 'inStock', key: 'inStock', width: 120, render: (inStock, record) => formatQtyWithUnit(inStock, record.unitName) },
  {
    title: 'Short by',
    dataIndex: 'shortBy',
    key: 'shortBy',
    width: 110,
    render: (shortBy, record) => <span className={shortBy > 0 ? 'text-red-600 font-medium' : undefined}>{formatQtyWithUnit(shortBy, record.unitName)}</span>,
  },
  { title: 'Status', dataIndex: 'status', key: 'status', width: 170, render: status => <StatusBadge status={status} value={RAW_MATERIAL_STATUS[status]} /> },
];

export const salesOrderExportColumn = isHaveProductionAccess => {
  const columns = [
    {
      title: 'Sales Order#',
      getExportValue: order => order?.orderId || '',
    },
    {
      title: 'Date',
      getExportValue: order => (order?.orderDate ? dateFormateForUi(order.orderDate) : ''),
    },
    {
      title: 'Customer Name',
      getExportValue: order => order?.customerDisplayName || order?.customerName || '',
    },
    {
      title: 'Status',
      getExportValue: order => SALES_ORDER_STATUS?.[order?.status] || order?.status || '',
    },
  ];

  if (isHaveProductionAccess) {
    columns.push({
      title: 'Production Order Status',
      getExportValue: order => order?.productionOrderStatus || '',
    });
  }

  return [
    ...columns,
    {
      title: 'Sales Order Tags',
      getExportValue: order => order?.tagName || '',
    },
    {
      title: 'Basic Amount',
      getExportValue: order => order?.subTotal ?? '',
    },
    {
      title: 'Total Amount',
      getExportValue: order => order?.total ?? '',
    },
    {
      title: 'Remaining Amount',
      getExportValue: order => order?.remainingAmount ?? '',
    },
    {
      title: 'Delivery Method',
      getExportValue: order => order?.deliveryMethod || '',
    },
    {
      title: 'Expected Shipment Date',
      getExportValue: order => (order?.expectedShipmentDate ? dateFormateForUi(order.expectedShipmentDate) : ''),
    },
    {
      title: 'Payment Terms',
      getExportValue: order => order?.paymentTermsId?.name || '',
    },
    {
      title: 'Reference',
      getExportValue: order => order?.reference || '',
    },
    {
      title: 'Customer Notes',
      getExportValue: order => order?.customerNotes || '',
    },
    {
      title: 'Division',
      getExportValue: order => order?.divisionName || '',
    },
    {
      title: 'Branch',
      getExportValue: order => order?.branchName || '',
    },
    {
      title: 'Warehouse',
      getExportValue: order => order?.warehouseName || '',
    },
    {
      title: 'Added By',
      getExportValue: order => order?.addedBy || '',
    },
    {
      title: 'Updated By',
      getExportValue: order => order?.updatedBy || '',
    },
    {
      title: 'Created From',
      getExportValue: order => order?.appName || '',
    },
  ];
};
