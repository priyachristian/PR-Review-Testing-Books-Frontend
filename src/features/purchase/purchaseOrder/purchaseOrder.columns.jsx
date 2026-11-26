import { Tag } from '@/components/AntDComponent';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import { dateFormateForUi } from '@/utils/services';
import { getDateColumn, getAmountCoulmn, TruncatedCell, getOverflowListColumn, getQuantitySummaryColumn } from '@/utils/tableColumns';
import { PURCHASE_ORDER_STATUS } from '@/utils/constants';

const grpoOverflowList = {
  getKey: (item, index) => `${item.id || item._id}-${index}`,
  getLabel: item => item.grpoOrderId,
  getLink: item => `/grpo/${item.id || item._id}`,
};

const billOverflowList = {
  getKey: (item, index) => `${item.id || item._id}-${index}`,
  getLabel: item => item.billId,
  getLink: item => `/bills/${item.id || item._id}`,
};

export const purchaseOrderColumn = () => {
  return [
    {
      title: 'Purchase Order#',
      dataIndex: 'purchaseOrderId',
      key: 'purchaseOrderId',
      render: purchaseOrderId => <Tag className=" font-semibold">{purchaseOrderId}</Tag>,
      visible: true,
      required: true,
      fixed: 'left',
      sorter: true,
    },
    getDateColumn('Date', 'date', 'date', true, true),
    {
      title: 'Vendor Name',
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
      render: status => <StatusBadge status={status} value={PURCHASE_ORDER_STATUS?.[status] || ''} />,
      visible: true,
      required: true,
      sorter: true,
      width: 188,
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
    getDateColumn('Delivery Date', 'deliveryDate', 'deliveryDate', false),
    {
      title: 'Customer Notes',
      dataIndex: 'customerNotes',
      key: 'customerNotes',
      visible: false,
      sorter: true,
      ellipsis: {
        showTitle: false,
      },
      render: text => <TruncatedCell value={text} />,
    },
    getOverflowListColumn({
      title: 'GRPO',
      dataIndex: 'grpos',
      key: 'grpos',
      overflowList: grpoOverflowList,
      width: 124,
    }),
    getOverflowListColumn({
      title: 'Bill',
      dataIndex: 'bills',
      key: 'bills',
      overflowList: billOverflowList,
      width: 137,
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
  ];
};

export const purchaseOrderExportColumn = () => [
  {
    title: 'Purchase Order#',
    getExportValue: order => order?.purchaseOrderId || '',
  },
  {
    title: 'Date',
    getExportValue: order => (order?.date ? dateFormateForUi(order.date) : ''),
  },
  {
    title: 'Vendor Name',
    getExportValue: order => order?.customerDisplayName || order?.customerName || '',
  },
  {
    title: 'Status',
    getExportValue: order => PURCHASE_ORDER_STATUS?.[order?.status] || order?.status || '',
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
    title: 'Delivery Date',
    getExportValue: order => (order?.deliveryDate ? dateFormateForUi(order.deliveryDate) : ''),
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
];
