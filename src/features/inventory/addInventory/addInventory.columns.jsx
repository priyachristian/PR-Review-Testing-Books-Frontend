import { dateFormateForUi } from '@/utils/services';

export const addInventoryColumn = () => {
  return [
    {
      title: 'Created Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: date => dateFormateForUi(date),
      visible: true,
      sorter: true,
      required: true,
    },
    {
      title: 'Item Name',
      dataIndex: 'itemName',
      key: 'itemName',
      visible: true,
      sorter: true,
      required: true,
    },
    {
      title: 'Quantity',
      dataIndex: 'quantity',
      key: 'quantity',
      visible: true,
      required: true,
    },
    {
      title: 'Reference Number',
      dataIndex: 'referenceNumber',
      key: 'referenceNumber',
      visible: true,
      required: true,
    },
    {
      title: 'Division',
      dataIndex: 'divisionName',
      key: 'divisionName',
      visible: true,
      required: false,
    },
    {
      title: 'Branch',
      dataIndex: 'branchName',
      key: 'branchName',
      visible: true,
      required: false,
    },
    {
      title: 'Warehouse',
      dataIndex: 'warehouseName',
      key: 'warehouseName',
      visible: true,
      required: false,
    },
    {
      title: 'Created By',
      dataIndex: 'createdByUserFullName',
      key: 'createdByUserFullName',
      visible: true,
      required: false,
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      visible: true,
      required: false,
    },
  ];
};
