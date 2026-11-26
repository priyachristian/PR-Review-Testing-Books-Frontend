import { renderListNumberTag } from '@/components/dataDisplay/appTable/OverflowListCell';
import { ADMIN_ROUTE_PATHS } from '@/routes/adminRoutePaths';
import { Tag, Tooltip } from '@/components/AntDComponent';
import Icons from '@/assets/icons/icon';
import { dateFormateForUi } from '@/utils/services';
import { colorPalette } from '@/utils/theme';

export const renderBatchNumber = (number, batchId, prefix = '', key) => {
  if (number == null || number === '' || number === '-') return '-';
  const id = typeof batchId === 'object' ? batchId?._id || batchId?.id : batchId;
  const to = id ? `/${ADMIN_ROUTE_PATHS.itemBatches.build.detail(id)}` : undefined;
  return renderListNumberTag(`${prefix}${number}`, to, { key });
};

export const BATCH_SOURCE_TYPE_LABELS = {
  GRPO: 'GRPO',
  BILL: 'Bill',
  SPLIT_BILL: 'Split Bill',
  CREDIT_NOTE: 'Credit Note',
  SPLIT_CREDIT_NOTE: 'Split Credit Note',
  PRODUCTION_ORDER: 'Production Order',
  EXISTING_INVENTORY: 'Existing Inventory',
  MANUAL_STOCK_ADD: 'Manual Stock Add',
  MANUAL_STOCK_TRANSFER: 'Manual Stock Transfer',
  PRODUCTIONORDER_STOCK_TRANSFER: 'Production Order Transfer',
  DELIVERY_CHALLAN_STOCK_TRANSFER: 'Delivery Challan Transfer',
  OPENING_STOCK: 'Opening Stock',
  INVENTORY_ADJUSTMENT: 'Inventory Adjustment',
  REJECTION_RECOVERY: 'Rejection Recovery',
};

export const BATCH_SOURCE_TYPE_FILTER_OPTIONS = Object.entries(BATCH_SOURCE_TYPE_LABELS)
  .filter(([key]) => key !== 'SPLIT_BILL' && key !== 'SPLIT_CREDIT_NOTE')
  .map(([value, label]) => ({ value, label }));

export const batchesColumn = handleViewClick => {
  return [
    {
      title: 'Batch No',
      dataIndex: 'batchNo',
      key: 'batchNo',
      render: (batchNo, record) =>
        batchNo != null ? (
          <Tag
            className="font-semibold cursor-pointer m-0"
            onClick={e => {
              e.stopPropagation();
              handleViewClick?.(record);
            }}
          >
            {batchNo}
          </Tag>
        ) : (
          '-'
        ),
      visible: true,
      required: true,
      width: 120,
      fixed: 'left',
    },
    {
      title: 'Item Name',
      dataIndex: 'itemName',
      key: 'itemName',
      render: itemName => itemName || '-',
      visible: true,
      required: true,
    },
    {
      title: 'Item No',
      dataIndex: 'itemNo',
      key: 'itemNo',
      render: itemNo => itemNo || '-',
      visible: true,
    },
    {
      title: 'Warehouse',
      dataIndex: 'warehouseName',
      key: 'warehouseName',
      render: warehouseName => warehouseName || '-',
      visible: true,
    },
    {
      title: 'Branch',
      dataIndex: 'branchName',
      key: 'branchName',
      render: branchName => branchName || '-',
      visible: true,
    },
    {
      title: 'Division',
      dataIndex: 'divisionName',
      key: 'divisionName',
      render: divisionName => divisionName || '-',
      visible: true,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (quantity, record) => {
        const unit = record?.itemUnitId?.name || record?.itemUnitName || record?.itemUnit || '';
        return `${quantity ?? 0}${unit ? ` ${unit}` : ''}`;
      },
      visible: true,
      required: true,
    },
    {
      title: 'Remaining Qty',
      dataIndex: 'remainingQty',
      key: 'remainingQty',
      render: (remainingQty, record) => {
        const unit = record?.itemUnitId?.name || record?.itemUnitName || record?.itemUnit || '';
        const qty = remainingQty ?? 0;
        return <span className={qty <= 0 ? 'text-red-500 font-semibold' : ''}>{`${qty}${unit ? ` ${unit}` : ''}`}</span>;
      },
      visible: true,
      required: true,
    },
    {
      title: 'Purchase Price',
      dataIndex: 'purchasePrice',
      key: 'purchasePrice',
      render: purchasePrice => (purchasePrice != null ? purchasePrice : '-'),
      visible: true,
    },
    {
      title: 'Source Type',
      dataIndex: 'sourceType',
      key: 'sourceType',
      render: sourceType => BATCH_SOURCE_TYPE_LABELS[sourceType] || sourceType || '-',
      visible: true,
    },
    {
      title: 'Vendor Batch No',
      dataIndex: 'vendorBatchNo',
      key: 'vendorBatchNo',
      render: (number, record) => renderBatchNumber(number, record._id || record.id),
      visible: true,
    },
    {
      title: 'Vendor Batch Expiry',
      dataIndex: 'vendorBatchExpiry',
      key: 'vendorBatchExpiry',
      render: vendorBatchExpiry => (vendorBatchExpiry ? dateFormateForUi(vendorBatchExpiry) : '-'),
      visible: true,
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: createdAt => (createdAt ? dateFormateForUi(createdAt) : '-'),
      visible: true,
    },
    {
      title: 'Action',
      key: 'action',
      width: 80,
      render: (_, record) => (
        <div className="flex items-center gap-3" onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()} role="presentation">
          <Tooltip title="View">
            <Icons.EyeOutlined className="cursor-pointer" style={{ fontSize: 17, color: colorPalette.primary[500] }} onClick={() => handleViewClick(record)} />
          </Tooltip>
        </div>
      ),
    },
  ];
};
