import { Tooltip, Popconfirm, Tag } from '@/components/AntDComponent';
import Icons from '@/assets/icons/icon';
import { colorPalette } from '@/utils/theme';

export const subItemGroupColumn = (handleEditClick, handleDeleteItem, useItemGroupMaster) => {
  return [
    {
      title: 'Sub Item Group Code',
      dataIndex: 'subItemGroupNo',
      key: 'subItemGroupNo',
      render: subItemGroupNo => (subItemGroupNo ? <Tag className="font-semibold">{subItemGroupNo}</Tag> : '—'),
      sorter: false,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      visible: true,
      required: true,
    },
    {
      title: 'Items',
      dataIndex: 'itemCount',
      key: 'itemCount',
    },
    {
      title: 'Created From',
      dataIndex: 'appName',
      key: 'appName',
      render: appName => appName || '-',
      sorter: false,
    },
    ...(useItemGroupMaster?.edit || useItemGroupMaster?.delete
      ? [
          {
            title: 'Action',
            key: 'actions',
            render: (_, record) => (
              <div className="flex space-x-2">
                {useItemGroupMaster?.edit && (
                  <Tooltip title="Edit Sub Item Group">
                    <Icons.EditOutlined style={{ fontSize: 17, color: colorPalette.primary[500] }} onClick={() => handleEditClick(record)} />
                  </Tooltip>
                )}
                {useItemGroupMaster?.delete && (
                  <Popconfirm
                    title="Delete Sub Item Group"
                    description="Are you sure you want to delete this sub item group?"
                    okText="Yes"
                    cancelText="No"
                    onConfirm={() => handleDeleteItem(record?.id)}
                  >
                    <Icons.DeleteOutlined style={{ fontSize: 17, color: colorPalette.error[500] }} />
                  </Popconfirm>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];
};
