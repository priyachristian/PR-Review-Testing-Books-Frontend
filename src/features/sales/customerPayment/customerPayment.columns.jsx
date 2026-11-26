// Third Party
import { Tag } from 'antd';

// Components
import StatusBadge from '@/components/ui/badge/StatusBadge';

// Utils
import { getDateColumn, getAmountCoulmn } from '@/utils/tableColumns';

// Constants
import { CUSTOMER_PAYMENT_STATUS, getPaymentModeLabel } from '@/utils/constants';

export const customerPaymentColumn = () => {
  return [
    {
      title: 'Payment#',
      dataIndex: 'customerPaymentId',
      key: 'customerPaymentId',
      render: value => <Tag className="font-semibold">{value}</Tag>,
      visible: true,
      required: true,
      sorter: true,
      fixed: 'left',
    },
    getDateColumn('Payment Date', 'paymentDate', 'paymentDate', true, true),
    {
      title: 'Customer Name',
      dataIndex: 'customerId',
      key: 'customerId',
      render: customer => customer?.customerDisplayName || customer?.companyName || '-',
      visible: true,
      required: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => <StatusBadge status={status} value={CUSTOMER_PAYMENT_STATUS?.[status] || ''} />,
      visible: true,
      required: true,
      sorter: true,
      width: 128,
    },
    getAmountCoulmn('Amount', 'amount', 'amount', true, true),
    {
      title: 'Mode',
      dataIndex: 'paymentMode',
      key: 'paymentMode',
      render: value => getPaymentModeLabel(value),
      visible: true,
    },
    {
      title: 'Reference',
      dataIndex: 'reference',
      key: 'reference',
      render: value => value || '-',
      visible: true,
    },
  ];
};
