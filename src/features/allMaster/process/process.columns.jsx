import { Popconfirm, Tag, Tooltip } from '@/components/AntDComponent';
import Icons from '@/assets/icons/icon';
import { PERMISSION_MESSAGES } from '@/utils/constants';
import { colorPalette } from '@/utils/theme';

export const processColumn = (handleEdit, handleDelete, useModuleProcess, pagination, isViewOnly) => {
  return [
    {
      title: 'Process Code',
      dataIndex: 'processId',
      key: 'processId',
      render: value => <Tag className="font-semibold">{value}</Tag>,
      visible: true,
      required: true,
      sorter: true,
      width: 65,
    },
    {
      title: 'Process Name',
      dataIndex: 'name',
      key: 'name',
      render: value => <div>{value}</div>,
      visible: true,
      required: true,
      sorter: true,
    },
    {
      title: 'Action',
      key: 'edit',
      render: (_, record) => {
        const canEdit = useModuleProcess?.edit && !isViewOnly;
        const canDelete = useModuleProcess?.delete && !isViewOnly;
        const blockedTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : PERMISSION_MESSAGES.NO_PERMISSION;

        return (
          <div className="flex space-x-2">
            <Tooltip title={canEdit ? 'Edit Process' : blockedTooltip}>
              <Icons.EditOutlined
                className={canEdit ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                style={{ fontSize: 17, color: colorPalette.primary[500], cursor: canEdit ? 'pointer' : 'not-allowed' }}
                onClick={() => {
                  if (!canEdit) return;
                  handleEdit(record);
                }}
              />
            </Tooltip>
            <Popconfirm
              title="Delete Process"
              description="Are you sure you want to delete this process?"
              okText="Yes"
              cancelText="No"
              disabled={!canDelete}
              onConfirm={() => handleDelete(record?.id || record?._id)}
            >
              <Tooltip title={canDelete ? 'Delete Process' : blockedTooltip}>
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
