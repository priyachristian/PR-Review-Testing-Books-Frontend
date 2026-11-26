import { Tag } from '@/components/AntDComponent';
import { getAmountCoulmn } from '@/utils/tableColumns';
import { dateFormateForUi } from '@/utils/services';
import { formatAmount } from '@/utils/currency';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import { RECURRING_BILL_STATUS } from '@/utils/constants';

export const recurringBillColumn = () => {
  return [
    {
      title: 'Recurring Bill#',
      dataIndex: 'recurringBillId',
      key: 'recurringBillId',
      render: recurringBillId => <Tag className="font-semibold">{recurringBillId}</Tag>,
      fixed: 'left',
      visible: true,
      required: true,
      sorter: true,
    },
    {
      title: 'Vendor Name',
      dataIndex: 'vendorId',
      key: 'vendorId',
      render: vendorId => vendorId?.customerDisplayName || '',
      visible: true,
      required: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => <StatusBadge status={status} value={RECURRING_BILL_STATUS?.[status] ?? '-'} />,
      visible: true,
      required: true,
      sorter: true,
      width: 130,
    },
    {
      title: 'Profile Name',
      dataIndex: 'profileName',
      key: 'profileName',
      visible: true,
      width: 228,
    },
    {
      title: 'Frequency',
      dataIndex: 'repeatEvery',
      key: 'repeatEvery',
      render: repeatEvery => `${repeatEvery?.frequency}${' '}${repeatEvery?.period}` || '',
      visible: true,
      width: 110,
    },
    {
      title: 'Last Bill Date',
      dataIndex: 'lastBillDate',
      key: 'datelastBillDate',
      align: 'start',
      render: (_, record) => dateFormateForUi(record?.currentExecutionDate),
      visible: true,
      required: true,
    },
    {
      title: 'Next Bill Date',
      dataIndex: 'nextBillDate',
      key: 'nextBillDate',
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
    getAmountCoulmn('Total Amount', 'total', 'total', true, true),
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

export const itemTableColumn = (items = []) => {
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
    { title: 'Rate', dataIndex: 'rate', key: 'rate', render: val => (val ? formatAmount(val) : '-') },
    ...(hasItemDiscount
      ? [
          {
            title: 'Discount',
            dataIndex: 'discountConfig',
            key: 'discount',
            render: discountConfig => {
              const value = parseFloat(discountConfig?.discountValue || 0);
              if (!value) return '-';
              return discountConfig?.discountType === 'PERCENTAGE' ? `${value}%` : formatAmount(value);
            },
          },
        ]
      : []),
    { title: 'GST', dataIndex: 'gst', key: 'gst', render: val => (val && val !== 'none' ? `${val}%` : '0%') },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: val => (val ? formatAmount(val) : '-') },
  ];
};
