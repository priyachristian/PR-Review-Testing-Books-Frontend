import { Tag } from '@/components/AntDComponent';
import StatusBadge from '@/components/ui/badge/StatusBadge';

export const branchColumn = () => {
  return [
    {
      title: 'Code#',
      dataIndex: '_id',
      key: '_id',
      render: id => <Tag className="font-semibold">{id}</Tag>,
      visible: true,
      required: true,
      sorter: true,
      fixed: 'left',
      width: 130,
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
      title: 'Division',
      dataIndex: 'division',
      key: 'division',
      visible: true,
      required: true,
      sorter: true,
      width: 150,
    },
    {
      title: 'Manager Name',
      dataIndex: 'managername',
      key: 'managername',
      visible: true,
      sorter: true,
      width: 180,
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
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      visible: true,
      sorter: true,
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      visible: true,
      // sorter: true,
      width: 100,
    },
  ];
};
