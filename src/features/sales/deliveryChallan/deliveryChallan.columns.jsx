import { Tag } from 'antd';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import { getDateColumn, getAmountCoulmn, TruncatedCell, getOverflowListColumn, getQuantitySummaryColumn } from '@/utils/tableColumns';
import { DELIVERY_CHALLAN_STATUS } from '@/utils/constants';
import { dateFormateForUi } from '@/utils/services';

const invoiceOverflowList = {
  getKey: (item, index) => `${item.id || item._id}-${index}`,
  getLabel: item => item.invoiceId,
  getLink: item => `/invoices/${item.id || item._id}`,
};

export const deliveryChallanColumn = () => {
  return [
    {
      title: 'Delivery Challan#',
      dataIndex: 'challanId',
      key: 'challanId',
      render: value => <Tag className="font-semibold">{value}</Tag>,
      visible: true,
      required: true,
      sorter: true,
      fixed: 'left',
      width: 168,
    },
    getDateColumn('Date', 'challanDate', 'challanDate', true, true),
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
      render: status => <StatusBadge status={status} value={DELIVERY_CHALLAN_STATUS?.[status] || ''} />,
      visible: true,
      required: true,
      sorter: true,
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
    {
      title: 'Challan Type',
      dataIndex: 'challanType',
      key: 'challanType',
      visible: false,
      sorter: true,
    },
    {
      title: 'Reference',
      dataIndex: 'reference',
      key: 'reference',
      visible: false,
      sorter: true,
    },
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
      title: 'Invoices',
      dataIndex: 'invoices',
      key: 'invoices',
      overflowList: invoiceOverflowList,
      width: 112,
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

export const deliveryChallanExportColumn = () => [
  {
    title: 'Delivery Challan#',
    getExportValue: challan => challan?.challanId || '',
  },
  {
    title: 'Date',
    getExportValue: challan => (challan?.challanDate ? dateFormateForUi(challan.challanDate) : ''),
  },
  {
    title: 'Customer Name',
    getExportValue: challan => challan?.customerDisplayName || challan?.customerName || '',
  },
  {
    title: 'Status',
    getExportValue: challan => DELIVERY_CHALLAN_STATUS?.[challan?.status] || challan?.status || '',
  },
  {
    title: 'Basic Amount',
    getExportValue: challan => challan?.subTotal ?? '',
  },
  {
    title: 'Total Amount',
    getExportValue: challan => challan?.total ?? '',
  },
  {
    title: 'Challan Type',
    getExportValue: challan => challan?.challanType || '',
  },
  {
    title: 'Reference',
    getExportValue: challan => challan?.reference || '',
  },
  {
    title: 'Customer Notes',
    getExportValue: challan => challan?.customerNotes || '',
  },
  {
    title: 'Division',
    getExportValue: challan => challan?.divisionName || '',
  },
  {
    title: 'Branch',
    getExportValue: challan => challan?.branchName || '',
  },
  {
    title: 'Warehouse',
    getExportValue: challan => challan?.warehouseName || '',
  },
  {
    title: 'Added By',
    getExportValue: challan => challan?.addedBy || '',
  },
  {
    title: 'Updated By',
    getExportValue: challan => challan?.updatedBy || '',
  },
];
