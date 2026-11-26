import { Tooltip, Tag, Popconfirm } from '@/components/AntDComponent';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import Icons from '@/assets/icons/icon';
import { PERMISSION_MESSAGES } from '@/utils/constants';
import { colorPalette } from '@/utils/theme';
export const salesOrderTagColumn = (handleEditClick, handleDeleteSalesOrderTag, useSalesOrderTagMaster, isViewOnly) => {
  return [
    {
      title: 'Sales Order Tag ID',
      dataIndex: 'tagId',
      key: 'tagId',
      visible: true,
      required: true,
      render: tagId => <Tag className="font-semibold">{tagId}</Tag>,
      sorter: false,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      visible: true,
      required: true,
      render: (_, record) => {
        const hex = record?.color;
        const label = record?.name ?? '-';
        if (label === '-' && !hex) return '-';
        if (!hex) {
          return <span className="inline-block max-w-[260px] truncate text-xs text-gray-700">{label}</span>;
        }
        return <StatusBadge accentHex={hex} value={label} />;
      },
    },
    {
      title: 'Created From',
      dataIndex: 'appName',
      key: 'appName',
      visible: true,
      render: appName => appName || '',
      sorter: false,
    },
    {
      title: 'Action',
      key: 'actions',
      render: (_, record) => {
        const canEdit = useSalesOrderTagMaster?.edit && !isViewOnly;
        const canDelete = useSalesOrderTagMaster?.delete && !isViewOnly;
        const blockedTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : PERMISSION_MESSAGES.NO_PERMISSION;

        return (
          <div className="flex space-x-2">
            <Tooltip title={canEdit ? 'Edit Sales Order Tag' : blockedTooltip}>
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
              title="Delete Sales Order Tag"
              description="Are you sure you want to delete this sales order tag?"
              okText="Yes"
              cancelText="No"
              disabled={!canDelete}
              onConfirm={() => handleDeleteSalesOrderTag(record?._id)}
            >
              <Tooltip title={canDelete ? 'Delete Sales Order Tag' : blockedTooltip}>
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
