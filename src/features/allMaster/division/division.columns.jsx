import { Tag } from '@/components/AntDComponent';
import StatusBadge from '@/components/ui/badge/StatusBadge';

export const divisionColumn = () => {
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
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      visible: true,
      sorter: true,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      visible: true,
      sorter: true,
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
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      visible: true,
      // sorter: true,
      width: 100,
    },
  ];
};
