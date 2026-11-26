import { Tag } from '@/components/AntDComponent';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import { dateFormateForUi } from '@/utils/services';
import { getDateColumn, getAmountCoulmn, TruncatedCell, getOverflowListColumn, getQuantitySummaryColumn } from '@/utils/tableColumns';
import { GRPO_STATUS } from '@/utils/constants';

const billOverflowList = {
  getKey: (item, index) => `${item.id || item._id}-${index}`,
  getLabel: item => item.billId,
  getLink: item => `/bills/${item.id || item._id}`,
};

export const grpoColumn = () => {
  return [
    {
      title: 'GRPO Order#',
      dataIndex: 'grpoOrderId',
      key: 'grpoOrderId',
      render: grpoOrderId => <Tag className=" font-semibold">{grpoOrderId}</Tag>,
      visible: true,
      required: true,
      sorter: true,
      fixed: 'left',
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
      render: status => <StatusBadge status={status} value={GRPO_STATUS?.[status] || ''} />,
      visible: true,
      required: true,
      sorter: true,
      width: 133,
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
    getDateColumn('Due Date', 'dueDate', 'dueDate', true, true),
    {
      title: 'Reference',
      dataIndex: 'reference',
      key: 'reference',
      render: reference => reference || '',
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
      title: 'Bill',
      dataIndex: 'bills',
      key: 'bills',
      overflowList: billOverflowList,
      width: 115,
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

export const grpoExportColumn = () => [
  {
    title: 'GRPO Order#',
    getExportValue: grpo => grpo?.grpoOrderId || '',
  },
  {
    title: 'Date',
    getExportValue: grpo => (grpo?.date ? dateFormateForUi(grpo.date) : ''),
  },
  {
    title: 'Vendor Name',
    getExportValue: grpo => grpo?.customerDisplayName || grpo?.customerName || '',
  },
  {
    title: 'Status',
    getExportValue: grpo => GRPO_STATUS?.[grpo?.status] || grpo?.status || '',
  },
  {
    title: 'Basic Amount',
    getExportValue: grpo => grpo?.subTotal ?? '',
  },
  {
    title: 'Total Amount',
    getExportValue: grpo => grpo?.total ?? '',
  },
  {
    title: 'Due Date',
    getExportValue: grpo => (grpo?.dueDate ? dateFormateForUi(grpo.dueDate) : ''),
  },
  {
    title: 'Reference',
    getExportValue: grpo => grpo?.reference || '',
  },
  {
    title: 'Division',
    getExportValue: grpo => grpo?.divisionName || '',
  },
  {
    title: 'Branch',
    getExportValue: grpo => grpo?.branchName || '',
  },
  {
    title: 'Warehouse',
    getExportValue: grpo => grpo?.warehouseName || '',
  },
  {
    title: 'Added By',
    getExportValue: grpo => grpo?.addedBy || '',
  },
  {
    title: 'Updated By',
    getExportValue: grpo => grpo?.updatedBy || '',
  },
];
