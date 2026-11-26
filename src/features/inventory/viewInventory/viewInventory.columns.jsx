import { renderBatchNumber } from '@/features/inventory/batches/batches.columns';
import { Tag, Tooltip } from '@/components/AntDComponent';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import Icons from 'assets/icons/icon';
import { colorPalette } from '@/utils/theme';
import { formatAmount } from '@/utils/currency';
import { dateFormateForUi } from '@/utils/services';
import { STOCK_STATUS, PERMISSION_MESSAGES } from '@/utils/constants';

const getStockLevelInfo = record => {
  const availableStock = Number(record?.totalAvailableStock ?? 0) || 0;
  const min = Number(record?.minimumStockLevel ?? 0) || 0;
  const max = Number(record?.maximumStockLevel ?? 0) || 0;

  switch (record?.stockStatus) {
    case STOCK_STATUS.BELOW_MINIMUM:
      return { status: 'Below Minimum', variance: min - availableStock };
    case STOCK_STATUS.ABOVE_MAXIMUM:
      return { status: 'Above Maximum', variance: availableStock - max };
    case STOCK_STATUS.NO_RANGE:
      return { status: 'No Range', variance: '' };
    default:
      return { status: 'Normal', variance: '' };
  }
};

export const viewInventoryColumn = (handleViewClick, handleTotalOfAvailableStock, handleLedgerClick, useModuleProduction) => {
  return [
    {
      title: 'Item#',
      dataIndex: 'itemNo',
      key: 'itemNo',
      render: itemNo => <Tag className="font-semibold">{itemNo}</Tag>,
      visible: true,
      required: true,
      fixed: 'left',
      sorter: true,
      width: 100,
    },
    {
      title: 'Item Status',
      dataIndex: 'itemStatus',
      key: 'itemStatus',
      render: status => {
        return <StatusBadge status={status} value={status ? 'Active' : 'Inactive'} />;
      },
      visible: true,
      required: true,
      width: 103,
    },
    {
      title: 'Item Name',
      dataIndex: 'itemName',
      key: 'itemName',
      render: itemName => itemName || '',
      visible: true,
      required: true,
    },
    {
      title: 'Item Type',
      dataIndex: 'itemType',
      key: 'itemType',
      visible: true,
      required: true,
      width: 97,
    },
    {
      title: 'Model No',
      dataIndex: 'itemModelNo',
      key: 'itemModelNo',
      visible: true,
      width: 116,
    },
    {
      title: 'Group',
      dataIndex: 'itemGroup',
      key: 'itemGroup',
      render: itemGroup => itemGroup?.name || '',
      visible: true,
      width: 154,
    },
    {
      title: 'Total Available Qty',
      key: 'availableStock',
      dataIndex: 'availableStock',
      render: (_, record) => handleTotalOfAvailableStock(record),
      visible: true,
      required: true,
    },
    {
      title: 'Total Valuation',
      key: 'totalValuation',
      dataIndex: 'totalValuation',
      render: totalValuation => formatAmount(totalValuation ?? 0),
      visible: true,
      required: true,
      sorter: true,
    },
    {
      title: 'Latest Price',
      key: 'latestPrice',
      dataIndex: 'latestPrice',
      render: latestPrice => (latestPrice != null ? formatAmount(latestPrice) : '—'),
      visible: true,
    },
    {
      title: 'Minimum Stock Level',
      dataIndex: 'minimumStockLevel',
      key: 'minimumStockLevel',
      render: minimumStockLevel => minimumStockLevel ?? '',
      visible: true,
    },
    {
      title: 'Maximum Stock Level',
      dataIndex: 'maximumStockLevel',
      key: 'maximumStockLevel',
      render: maximumStockLevel => maximumStockLevel ?? '',
      visible: true,
    },
    {
      title: 'Stock Status',
      key: 'stockStatus',
      render: (_, record) => {
        const { status } = getStockLevelInfo(record);
        return <StatusBadge status={status} value={status} />;
      },
      visible: true,
      width: 132,
    },
    {
      title: 'Stock Variance',
      key: 'stockVariance',
      render: (_, record) => getStockLevelInfo(record).variance,
      visible: true,
    },
    {
      title: 'Added By',
      dataIndex: 'addedBy',
      key: 'addedBy',
      render: addedBy => (
        <span>
          {addedBy?.firstName} {addedBy?.lastName}
        </span>
      ),
      visible: true,
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: createdAt => (createdAt ? dateFormateForUi(createdAt) : ''),
      visible: true,
    },
    {
      title: 'Updated By',
      dataIndex: 'updatedBy',
      key: 'updatedBy',
      render: updatedBy => (
        <span>
          {updatedBy?.firstName} {updatedBy?.lastName}
        </span>
      ),
      visible: true,
    },
    {
      title: 'Updated At',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: updatedAt => (updatedAt ? dateFormateForUi(updatedAt) : ''),
      visible: true,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => {
        const canView = useModuleProduction?.view;
        const viewTooltip = canView ? 'View Stock Details' : PERMISSION_MESSAGES.NO_PERMISSION;
        const ledgerTooltip = canView ? 'View ledger' : PERMISSION_MESSAGES.NO_PERMISSION;

        return (
          <div className="flex items-center gap-3">
            <Tooltip title={viewTooltip}>
              <Icons.EyeOutlined
                className={canView ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                style={{ fontSize: 17, color: '#1E3A56' }}
                onClick={e => {
                  e.stopPropagation();
                  if (canView) handleViewClick(record);
                }}
              />
            </Tooltip>
            <Tooltip title={ledgerTooltip}>
              <Icons.FileSearchOutlined
                className={canView ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                style={{ fontSize: 17, color: colorPalette.primary[500] }}
                onClick={e => {
                  e.stopPropagation();
                  if (canView) handleLedgerClick(record);
                }}
              />
            </Tooltip>
          </div>
        );
      },
    },
  ];
};

export const warehouseColumns = [
  {
    title: 'Division',
    dataIndex: 'division',
    key: 'division',
    render: division => division?.name || '',
  },
  {
    title: 'Branch',
    dataIndex: 'branch',
    key: 'branch',
    render: branch => branch?.name || '',
  },
  {
    title: 'Warehouse',
    dataIndex: 'warehouse',
    key: 'warehouse',
    render: warehouse => warehouse?.name || '',
  },
  {
    title: 'Opening Stock',
    dataIndex: 'openingStock',
    key: 'openingStock',
    render: val => (val != null ? val : ''),
  },
  {
    title: 'Rate',
    dataIndex: 'openingStockRate',
    key: 'openingStockRate',
    render: val => formatAmount(val ?? 0),
  },
  {
    title: 'Available Stock',
    dataIndex: 'availableStock',
    key: 'availableStock',
    render: val => (val != null ? val : ''),
  },
  {
    title: 'Valuation',
    dataIndex: 'inventoryValue',
    key: 'inventoryValue',
    render: val => (val != null ? formatAmount(val) : ''),
  },
];

export const convertedStockColumns = [
  {
    title: 'Unit',
    dataIndex: 'unitName',
    key: 'unitName',
    render: val => val || '',
  },
  {
    title: 'Opening Stock',
    dataIndex: 'openingStock',
    key: 'openingStock',
    render: val => (val != null ? val : ''),
  },
  {
    title: 'Available Stock',
    dataIndex: 'availableStock',
    key: 'availableStock',
    render: val => (val != null ? val : ''),
  },
];

export const batchConvertedStockColumns = [
  {
    title: 'Unit',
    dataIndex: 'unitName',
    key: 'unitName',
    render: val => val || '',
  },
  {
    title: 'Quantity',
    dataIndex: 'quantity',
    key: 'quantity',
    render: val => (val != null ? val : ''),
  },
  {
    title: 'Remaining Qty',
    dataIndex: 'remainingQty',
    key: 'remainingQty',
    render: val => (val != null ? val : ''),
  },
];

export const batchColumns = [
  {
    title: 'Batch No',
    dataIndex: 'batchNo',
    key: 'batchNo',
    width: 100,
  },
  {
    title: 'Division',
    dataIndex: 'divisionId',
    key: 'divisionId',
    render: div => div?.name || '',
    width: 120,
  },
  {
    title: 'Branch',
    dataIndex: 'branchId',
    key: 'branchId',
    render: branch => branch?.name || '',
    width: 120,
  },
  {
    title: 'Warehouse',
    dataIndex: 'warehouseId',
    key: 'warehouseId',
    render: wh => wh?.name || '',
    width: 120,
  },
  {
    title: 'Quantity',
    dataIndex: 'quantity',
    key: 'quantity',
    width: 120,
  },
  {
    title: 'Remaining Qty',
    dataIndex: 'remainingQty',
    key: 'remainingQty',
    width: 120,
  },
  {
    title: 'Purchase Unit',
    dataIndex: 'purchaseUnitId',
    key: 'purchaseUnit',
    render: purchaseUnit => purchaseUnit?.name || '',
    width: 130,
  },
  {
    title: 'Purchase Price',
    dataIndex: 'purchasePrice',
    key: 'purchasePrice',
    render: val => (val != null ? formatAmount(val) : ''),
    width: 120,
  },
  {
    title: 'Vendor Batch No',
    dataIndex: 'vendorBatchNo',
    key: 'vendorBatchNo',
    render: (number, record) => renderBatchNumber(number, record._id || record.id),
    width: 130,
  },
  {
    title: 'User Batch No',
    dataIndex: 'userBatchNo',
    key: 'userBatchNo',
    render: (number, record) => renderBatchNumber(number, record._id || record.id),
    width: 120,
  },
  {
    title: 'Vendor Expiry',
    dataIndex: 'vendorBatchExpiry',
    key: 'vendorBatchExpiry',
    render: val => (val ? dateFormateForUi(val) : ''),
    width: 120,
  },
];
