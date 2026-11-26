import { Tag } from '@/components/AntDComponent';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import { dateFormateForUi } from '@/utils/services';
import { formatAmount } from '@/utils/currency';
import { RECURRING_INVOICE_STATUS } from '@/utils/constants';

export const recurringInvoiceColumn = () => {
  return [
    {
      title: 'Recurring Invoice#',
      dataIndex: 'recurringInvoiceId',
      key: 'recurringInvoiceId',
      render: recurringInvoiceId => <Tag className="font-semibold">{recurringInvoiceId}</Tag>,
      fixed: 'left',
      visible: true,
      required: true,
      sorter: true,
      width: 180,
    },
    {
      title: 'Customer Name',
      dataIndex: 'customerId',
      key: 'customerId',
      render: customerId => customerId?.customerDisplayName || '',
      visible: true,
      required: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => <StatusBadge status={status} value={RECURRING_INVOICE_STATUS?.[status] || ''} />,
      visible: true,
      required: true,
      sorter: true,
      width: 134,
    },
    {
      title: 'Profile Name ',
      dataIndex: 'profileName',
      key: 'profileName',
      visible: true,
      width: 190,
    },
    {
      title: 'Frequency',
      dataIndex: 'repeatEvery',
      key: 'repeatEvery',
      render: repeatEvery => `${repeatEvery?.frequency}${' '}${repeatEvery?.period}` || '',
      visible: true,
    },
    {
      title: 'Last Invoice Date',
      dataIndex: 'lastInvoiceDate',
      key: 'datelastInvoiceDate',
      align: 'start',
      render: (_, record) => dateFormateForUi(record?.currentExecutionDate),
      visible: true,
      required: true,
    },
    {
      title: 'Next Invoice Date',
      dataIndex: 'nextInvoiceDate',
      key: 'nextInvoiceDate',
      align: 'start',
      render: (_, record) => dateFormateForUi(record?.nextExecutionDate),
      visible: true,
    },
    {
      title: 'Sub Total',
      dataIndex: 'subTotal',
      key: 'subTotal',
      render: (_, record) => formatAmount(record?.subTotal, true, record?.currency),
      visible: true,
      required: true,
    },
    {
      title: 'Amount',
      key: 'total',
      render: record => formatAmount(record?.total ? Math.round(record?.total) : 0, true, record?.currency),
      visible: true,
      required: true,
    },
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
      render: addedBy => `${addedBy?.firstName || ''} ${addedBy?.lastName || ''}`,
      visible: true,
      sorter: true,
    },
    {
      title: 'Updated By',
      dataIndex: 'updatedBy',
      key: 'updatedBy',
      render: updatedBy => `${updatedBy?.firstName || ''} ${updatedBy?.lastName || ''}`,
      visible: true,
      sorter: true,
    },
  ];
};

export const itemTableColumn = (currency, items = []) => {
  const hasItemDiscount = items.some(item => item?.discountConfig);

  return [
    { title: 'Item Number', dataIndex: 'itemNo', key: 'itemNo', render: itemNo => <Tag className="font-semibold">{itemNo}</Tag> },
    {
      title: 'Item Name',
      dataIndex: 'itemName',
      key: 'itemName',
      render: (text, record) => (
        <div>
          <p className="font-medium">{text}</p>
          <p className="text-xs text-gray-500">{record?.description}</p>
        </div>
      ),
    },
    { title: 'Qty', dataIndex: 'quantity', key: 'quantity' },
    { title: 'Rate', dataIndex: 'rate', key: 'rate', render: val => formatAmount(val, false, currency) },
    ...(hasItemDiscount
      ? [
          {
            title: 'Discount',
            dataIndex: 'discountConfig',
            key: 'discount',
            render: discountConfig => {
              const value = parseFloat(discountConfig?.discountValue || 0);
              if (!value) return '-';
              return discountConfig?.discountType === 'PERCENTAGE' ? `${value}%` : formatAmount(value, false, currency);
            },
          },
        ]
      : []),
    { title: 'GST', dataIndex: 'gst', key: 'gst', render: val => (val && val !== 'none' ? `${val}%` : '0%') },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: val => formatAmount(val, false, currency) },
  ];
};
