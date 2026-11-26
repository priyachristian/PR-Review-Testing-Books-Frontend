import { Popconfirm, Tag, Tooltip } from '@/components/AntDComponent';
import Icons from '@/assets/icons/icon';
import { colorPalette } from '@/utils/theme';
import { PERMISSION_MESSAGES } from '@/utils/constants';

export const roleColumn = (handleEdit, handleCopy, handleDelete, isViewOnly) => {
  const blockedTitle = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : null;
  return [
    {
      title: 'Role Name',
      dataIndex: 'role',
      render: value => <Tag className="font-semibold">{value}</Tag>,
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        const isAdmin = record?.role?.toLowerCase() === 'admin';
        const isRoleInUse = record?.isRoleInUse;
        const canEdit = !isViewOnly && !isAdmin;
        const canCopy = !isViewOnly;
        const canDelete = !isViewOnly && !isAdmin && !isRoleInUse;
        return (
          <div className="flex space-x-2">
            <Tooltip title={blockedTitle || (isAdmin ? 'This is a system generated role. It is not editable' : 'Edit role')}>
              <button
                type="button"
                disabled={!canEdit}
                onClick={canEdit ? () => handleEdit(record) : undefined}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  cursor: canEdit ? 'pointer' : 'not-allowed',
                  opacity: canEdit ? 1 : 0.4,
                }}
              >
                <Icons.EditOutlined style={{ fontSize: 17, color: canEdit ? colorPalette.primary[500] : '#9ca3af' }} />
              </button>
            </Tooltip>

            <Tooltip title={blockedTitle || 'Copy role'}>
              <button
                type="button"
                disabled={!canCopy}
                onClick={canCopy ? () => handleCopy(record) : undefined}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: 0,
                  cursor: canCopy ? 'pointer' : 'not-allowed',
                  display: 'inline-flex',
                  alignItems: 'center',
                  opacity: canCopy ? 1 : 0.4,
                }}
              >
                <Icons.CopyOutlined style={{ fontSize: 17 }} />
              </button>
            </Tooltip>

            <Popconfirm
              title="Delete Role"
              description={`Are you sure you want to delete "${record?.role}"?`}
              onConfirm={() => handleDelete(record)}
              okText="Yes"
              cancelText="No"
              disabled={!canDelete}
            >
              <Tooltip
                title={
                  blockedTitle ||
                  (isAdmin ? 'This is a system generated role. It cannot be deleted' : isRoleInUse ? 'This role is currently assigned to users. Please unassign it before deletion.' : 'Delete role')
                }
              >
                <button
                  type="button"
                  disabled={!canDelete}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    padding: 0,
                    cursor: canDelete ? 'pointer' : 'not-allowed',
                    display: 'inline-flex',
                    alignItems: 'center',
                    opacity: canDelete ? 1 : 0.4,
                  }}
                >
                  <Icons.DeleteOutlined style={{ fontSize: 17, color: canDelete ? colorPalette.error[500] : '#9ca3af' }} />
                </button>
              </Tooltip>
            </Popconfirm>
          </div>
        );
      },
    },
  ];
};
