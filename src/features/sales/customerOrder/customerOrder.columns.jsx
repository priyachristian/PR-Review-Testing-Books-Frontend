// Third Party
import { Tag } from 'antd';

// Components
import StatusBadge from '@/components/ui/badge/StatusBadge';

// Utils
import { getDateColumn, getAmountCoulmn } from '@/utils/tableColumns';

// Constants
import { CUSTOMER_ORDER_STATUS, CUSTOMER_ORDER_TYPE } from '@/utils/constants';

// An order placed from a sample catalog is a sample order.
export const getCustomerOrderType = order => (order?.sampleCatalogId ? 'SAMPLE' : 'REGULAR');

export const customerOrderColumn = () => {
  return [
    {
      title: 'Order#',
      dataIndex: 'customerOrderId',
      key: 'customerOrderId',
      render: value => <Tag className="font-semibold">{value}</Tag>,
      visible: true,
      required: true,
      sorter: true,
      fixed: 'left',
    },
    getDateColumn('Order Date', 'createdAt', 'createdAt', true, true),
    {
      title: 'Type',
      dataIndex: 'orderType',
      key: 'orderType',
      render: (_, record) => CUSTOMER_ORDER_TYPE[getCustomerOrderType(record)],
      visible: true,
      width: 100,
    },
    {
      title: 'Sample Catalog',
      dataIndex: 'catalogCode',
      key: 'catalogCode',
      render: (_, record) => [record?.catalogCode, record?.catalogName].filter(Boolean).join(' - ') || '-',
      visible: true,
    },
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
      render: status => <StatusBadge status={status} value={CUSTOMER_ORDER_STATUS?.[status] || ''} />,
      visible: true,
      required: true,
      sorter: true,
      width: 128,
    },
    getAmountCoulmn('Sub Total', 'subTotal', 'subTotal', true),
    getAmountCoulmn('Total Amount', 'total', 'total', true, true),
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
