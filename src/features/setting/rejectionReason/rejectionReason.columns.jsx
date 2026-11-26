import { Tag, Popconfirm, Tooltip } from '@/components/AntDComponent';
import Icons from '@/assets/icons/icon';
import { colorPalette } from '@/utils/theme';

export const rejectionReasonColumn = (handleEdit, handleDelete, isViewOnly, startIndex = 0) => {
  return [
    {
      title: '#',
      key: 'idx',
      width: 50,
      render: (_, __, i) => startIndex + i + 1,
    },
    {
      title: 'Reason Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: value => value || '—',
    },
    {
      title: 'Parent Reason',
      key: 'parent',
      render: (_, record) => (record?.parentReasonId?.name ? <Tag className="text-xs">{record.parentReasonId.name}</Tag> : '—'),
    },
    ...(!isViewOnly
      ? [
          {
            title: 'Action',
            key: 'action',
            align: 'center',
            width: 90,
            render: (_, record) => (
              <div className="flex items-center justify-center gap-3">
                <Tooltip title="Edit Reason">
                  <Icons.EditOutlined className="cursor-pointer" style={{ fontSize: 17, color: colorPalette.primary[500] }} onClick={() => handleEdit(record)} />
                </Tooltip>
                <Popconfirm title="Delete this reason?" description="This cannot be undone." onConfirm={() => handleDelete(record._id || record.id)} okText="Yes" cancelText="No">
                  <Icons.DeleteOutlined className="cursor-pointer" style={{ fontSize: 17, color: colorPalette.error[500] }} />
                </Popconfirm>
              </div>
            ),
          },
        ]
      : []),
  ];
};
