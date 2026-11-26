import { Tag, Tooltip, Popconfirm } from '@/components/AntDComponent';
import Icons from '@/assets/icons/icon';
import { PERMISSION_MESSAGES } from '@/utils/constants';
import { colorPalette } from '@/utils/theme';
import { dateFormateForUi } from '@/utils/services';
import StatusBadge from '@/components/ui/badge/StatusBadge';

export const itemGroupDetailItemsColumn = navigate => [
  {
    title: 'Item Number',
    dataIndex: 'itemNo',
    key: 'itemNo',
    render: (itemNo, record) => (
      <Tag className="font-semibold cursor-pointer" onClick={() => record?.itemId && navigate(`/item-master/${record.itemId}`)}>
        {itemNo || '-'}
      </Tag>
    ),
  },
  {
    title: 'Item Name',
    dataIndex: 'itemName',
    key: 'itemName',
  },
  {
    title: 'Type',
    dataIndex: 'itemType',
    key: 'itemType',
  },
  {
    title: 'Status',
    dataIndex: 'itemStatus',
    key: 'itemStatus',
    render: itemStatus => {
      return <StatusBadge status={itemStatus} value={itemStatus ? 'Active' : 'Inactive'} />;
    },
  },
];

export const itemGroupColumn = (handleViewClick, handleEditClick, handleDeleteItem, useItemGroupMaster, isViewOnly) => {
  return [
    {
      title: 'Item Group ID',
      dataIndex: 'itemGroupId',
      key: 'itemGroupId',
      render: itemGroupId => <Tag className="font-semibold">{itemGroupId}</Tag>,
      visible: true,
      required: true,
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
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: createdAt => dateFormateForUi(createdAt) || '-',
      sorter: false,
    },
    {
      title: 'Created From',
      dataIndex: 'appName',
      key: 'appName',
      visible: true,
      render: appName => appName || '-',
      sorter: false,
    },
    {
      title: 'Action',
      key: 'actions',
      render: (_, record) => {
        const canView = useItemGroupMaster?.view;
        const canEdit = useItemGroupMaster?.edit && !isViewOnly;
        const canDelete = useItemGroupMaster?.delete && !isViewOnly;
        const blockedTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : PERMISSION_MESSAGES.NO_PERMISSION;

        return (
          <div className="flex space-x-2">
            {canView && (
              <Tooltip title="View Item Group">
                <Icons.EyeOutlined className="cursor-pointer" onClick={() => handleViewClick(record)} style={{ fontSize: 17, color: '#1E3A56' }} />
              </Tooltip>
            )}
            <Tooltip title={canEdit ? 'Edit Item Group' : blockedTooltip}>
              <Icons.EditOutlined
                className={canEdit ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                style={{ fontSize: 17, color: colorPalette.primary[500], cursor: canEdit ? 'pointer' : 'not-allowed' }}
                onClick={() => {
                  if (!canEdit) return;
                  handleEditClick(record);
                }}
              />
            </Tooltip>
            <Popconfirm
              title="Delete Item Group"
              description="Are you sure you want to delete this item group?"
              okText="Yes"
              cancelText="No"
              disabled={!canDelete}
              onConfirm={() => handleDeleteItem(record?.id)}
            >
              <Tooltip title={canDelete ? 'Delete Item Group' : blockedTooltip}>
                <Icons.DeleteOutlined
                  className={canDelete ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                  style={{ fontSize: 17, color: colorPalette.error[500], cursor: canDelete ? 'pointer' : 'not-allowed' }}
                  onClick={e => e.stopPropagation()}
                />
              </Tooltip>
            </Popconfirm>
          </div>
        );
      },
    },
  ];
};
