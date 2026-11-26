import { Tag } from '@/components/AntDComponent';

export const manPowerColumn = () => {
  return [
    {
      title: 'Worker No',
      dataIndex: 'workerNo',
      key: 'workerNo',
      render: workerNo => <Tag className="font-semibold">{workerNo}</Tag>,
      sorter: true,
      visible: true,
      required: true,
      fixed: 'left',
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
      title: 'Department',
      dataIndex: 'departmentName',
      key: 'departmentName',
      render: departmentName => departmentName || '',
      visible: true,
      required: true,
      sorter: true,
    },
    {
      title: 'Salary Per Hour',
      dataIndex: 'modules',
      key: 'modules',
      render: modules => modules?.map(item => <Tag key={item}>{item}</Tag>),
      visible: true,
      sorter: true,
    },
    {
      title: 'Action',
      key: 'actions',
      render: () => null,
    },
  ];
};
