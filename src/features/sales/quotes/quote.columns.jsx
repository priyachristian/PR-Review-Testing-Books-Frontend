import { Tag } from '@/components/AntDComponent';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import { getDateColumn, getAmountCoulmn, TruncatedCell, getOverflowListColumn, getQuantitySummaryColumn } from '@/utils/tableColumns';
import { QUOTE_STATUS } from '@/utils/constants';
import { dateFormateForUi } from '@/utils/services';

const salesOrderOverflowList = {
  getKey: (item, index) => `${item.id || item._id}-${index}`,
  getLabel: item => item.orderId,
  getLink: item => `/sales-orders/${item.id || item._id}`,
};

const invoiceOverflowList = {
  getKey: (item, index) => `${item.id || item._id}-${index}`,
  getLabel: item => item.invoiceId,
  getLink: item => `/invoices/${item.id || item._id}`,
};

export const quoteColumn = () => {
  return [
    {
      title: 'Quote#',
      dataIndex: 'quoteId',
      key: 'quoteId',
      render: value => <Tag className="font-semibold">{value}</Tag>,
      visible: true,
      required: true,
      sorter: true,
      fixed: 'left',
    },
    getDateColumn('Date', 'quoteDate', 'quoteDate', true, true, 120),
    {
      title: 'Customer Name',
      dataIndex: 'customerDisplayName',
      key: 'customerDisplayName',
      visible: true,
      required: true,
      sorter: true,
    },
    {
      title: 'Status ',
      dataIndex: 'status',
      key: 'status',
      render: status => <StatusBadge status={status} value={QUOTE_STATUS?.[status] || ''} />,
      visible: true,
      required: true,
      sorter: true,
      width: 126,
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
    getDateColumn('Expiry Date', 'expiryDate', 'expiryDate', true),
    {
      title: 'Reference',
      dataIndex: 'reference',
      key: 'reference',
      visible: false,
      sorter: true,
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
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
      title: 'Sales Orders',
      dataIndex: 'salesOrder',
      key: 'salesOrder',
      overflowList: salesOrderOverflowList,
      width: 120,
    }),
    getOverflowListColumn({
      title: 'Invoices',
      dataIndex: 'invoices',
      key: 'invoices',
      overflowList: invoiceOverflowList,
      width: 120,
    }),
    {
      title: 'Division',
      dataIndex: 'divisionName',
      key: 'divisionName',
      visible: true,
      sorter: true,
      width: 140,
    },
    {
      title: 'Branch',
      dataIndex: 'branchName',
      key: 'branchName',
      visible: true,
      sorter: true,
      width: 140,
    },
    {
      title: 'Warehouse',
      dataIndex: 'warehouseName',
      key: 'warehouseName',
      visible: true,
      sorter: true,
      width: 140,
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

export const quoteExportColumn = () => [
  {
    title: 'Quote#',
    getExportValue: quote => quote?.quoteId || '',
  },
  {
    title: 'Date',
    getExportValue: quote => (quote?.quoteDate ? dateFormateForUi(quote.quoteDate) : ''),
  },
  {
    title: 'Customer Name',
    getExportValue: quote => quote?.customerDisplayName || quote?.customerName || '',
  },
  {
    title: 'Status',
    getExportValue: quote => QUOTE_STATUS?.[quote?.status] || quote?.status || '',
  },
  {
    title: 'Basic Amount',
    getExportValue: quote => quote?.subTotal ?? '',
  },
  {
    title: 'Total Amount',
    getExportValue: quote => quote?.total ?? '',
  },
  {
    title: 'Expiry Date',
    getExportValue: quote => (quote?.expiryDate ? dateFormateForUi(quote.expiryDate) : ''),
  },
  {
    title: 'Reference',
    getExportValue: quote => quote?.reference || '',
  },
  {
    title: 'Subject',
    getExportValue: quote => quote?.subject || '',
  },
  {
    title: 'Customer Notes',
    getExportValue: quote => quote?.customerNotes || '',
  },
  {
    title: 'Division',
    getExportValue: quote => quote?.divisionName || '',
  },
  {
    title: 'Branch',
    getExportValue: quote => quote?.branchName || '',
  },
  {
    title: 'Warehouse',
    getExportValue: quote => quote?.warehouseName || '',
  },
  {
    title: 'Added By',
    getExportValue: quote => quote?.addedBy || '',
  },
  {
    title: 'Updated By',
    getExportValue: quote => quote?.updatedBy || '',
  },
  {
    title: 'Created From',
    getExportValue: quote => quote?.appName || '',
  },
];
