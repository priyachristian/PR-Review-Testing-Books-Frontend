import { Tag } from '@/components/AntDComponent';
import StatusBadge from '@/components/ui/badge/StatusBadge';

export const warehouseColumn = () => {
  return [
    {
      title: 'Code#',
      dataIndex: 'warehouseId',
      key: 'warehouseId',
      render: warehouseId => <Tag className="font-semibold">{warehouseId}</Tag>,
      visible: true,
      required: true,
      // sorter: true,
      fixed: 'left',
      width: 119,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      visible: true,
      required: true,
      sorter: true,
    },
    {
      title: 'Branch Name',
      dataIndex: 'branchName',
      key: 'branchName',
      visible: true,
      required: true,
      sorter: true,
      width: 110,
    },
    {
      title: 'Division Name',
      dataIndex: 'divisionName',
      key: 'divisionName',
      visible: true,
      required: true,
      sorter: true,
      width: 110,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'status',
      visible: true,
      required: true,
      sorter: true,
      render: status => {
        return <StatusBadge status={status} value={status ? 'Active' : 'Inactive'} />;
      },
      width: 120,
    },
  ];
};
