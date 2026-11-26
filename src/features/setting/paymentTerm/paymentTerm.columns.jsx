import { Popconfirm, Tag, Tooltip } from '@/components/AntDComponent';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import Icons from '@/assets/icons/icon';
import { PERMISSION_MESSAGES } from '@/utils/constants';
import { colorPalette } from '@/utils/theme';

const SYSTEM_GENERATED_TOOLTIP = 'This is a system generated payment terms. It cannot be modified';

export const paymentTermColumn = (handleEdit, handleDelete, handleToggleStatus, handleSetDefault, { permissions = {}, isViewOnly = false } = {}) => {
  const canUpdate = permissions?.update && !isViewOnly;
  const canDeletePerm = permissions?.delete && !isViewOnly;
  const updateBlocked = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : !permissions?.update ? PERMISSION_MESSAGES.NO_PERMISSION : null;
  const deleteBlocked = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : !permissions?.delete ? PERMISSION_MESSAGES.NO_PERMISSION : null;

  return [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <div className="flex items-center gap-2">
          <span>{name}</span>
          {record?.isDefault ? <Tag color="blue">Default</Tag> : null}
        </div>
      ),
    },
    {
      title: 'Days',
      dataIndex: 'days',
      key: 'days',
      width: 100,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 110,
      render: isActive => <StatusBadge status={isActive} value={isActive ? 'Active' : 'Inactive'} />,
    },
    {
      title: 'Action',
      key: 'action',
      width: 160,
      render: (_, record) => {
        const isActive = record?.isActive;
        const isDefault = Boolean(record?.isDefault);
        const isSystemGenerated = Boolean(record?.isSystemGenerated);

        const canEdit = canUpdate && !isSystemGenerated;
        const canSetDefault = canUpdate && isActive && !isDefault;
        const canToggleStatus = canUpdate && !isSystemGenerated && !isDefault;
        const canDelete = canDeletePerm && !isSystemGenerated && !isDefault;

        const editTooltip = updateBlocked || (isSystemGenerated ? SYSTEM_GENERATED_TOOLTIP : 'Edit');
        const setDefaultTooltip = updateBlocked || (!isActive ? 'Inactive payment terms cannot be set as default' : isDefault ? 'Already set as default' : 'Set as Default');
        const toggleStatusTooltip =
          updateBlocked || (isSystemGenerated ? SYSTEM_GENERATED_TOOLTIP : isDefault ? 'Default payment terms cannot be marked inactive' : `Mark as ${isActive ? 'Inactive' : 'Active'}`);
        const deleteTooltip = deleteBlocked || (isSystemGenerated ? SYSTEM_GENERATED_TOOLTIP : isDefault ? 'Default payment terms cannot be deleted' : 'Delete');

        return (
          <div className="flex items-center justify-start gap-3">
            <Tooltip title={editTooltip}>
              <Icons.EditOutlined
                className={canEdit ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                style={{ fontSize: 17, color: colorPalette.primary[500] }}
                onClick={canEdit ? () => handleEdit(record) : undefined}
              />
            </Tooltip>
            <Tooltip title={setDefaultTooltip}>
              <Icons.CrownOutlined
                className={canSetDefault ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                style={{ fontSize: 17, color: canSetDefault ? '#ca8a04' : '#9ca3af' }}
                onClick={canSetDefault ? () => handleSetDefault(record) : undefined}
              />
            </Tooltip>
            <Popconfirm
              title={`Mark as ${isActive ? 'Inactive' : 'Active'}?`}
              description={`Are you sure you want to mark "${record?.name}" as ${isActive ? 'inactive' : 'active'}?`}
              onConfirm={() => handleToggleStatus(record)}
              okText="Yes"
              cancelText="No"
              disabled={!canToggleStatus}
            >
              <Tooltip title={toggleStatusTooltip}>
                <span>
                  {isActive ? (
                    <Icons.CloseCircleOutlined className={canToggleStatus ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'} style={{ fontSize: 17, color: colorPalette.error[500] }} />
                  ) : (
                    <Icons.CheckCircleOutlined className={canToggleStatus ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'} style={{ fontSize: 17, color: '#16a34a' }} />
                  )}
                </span>
              </Tooltip>
            </Popconfirm>
            <Popconfirm
              title="Delete this payment term?"
              description="This cannot be undone."
              onConfirm={() => handleDelete(record._id || record.id)}
              okText="Yes"
              cancelText="No"
              disabled={!canDelete}
            >
              <Tooltip title={deleteTooltip}>
                <span>
                  <Icons.DeleteOutlined className={canDelete ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'} style={{ fontSize: 17, color: colorPalette.error[500] }} />
                </span>
              </Tooltip>
            </Popconfirm>
          </div>
        );
      },
    },
  ];
};
