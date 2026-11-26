import { Tooltip } from '@/components/AntDComponent';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import Icons from '@/assets/icons/icon';
import { PERMISSION_MESSAGES } from '@/utils/constants';
import { colorPalette } from '@/utils/theme';

const SYSTEM_GENERATED_TOOLTIP = 'This is a system generated item unit. It cannot be modified';

export const itemUnitColumn = (handleEdit, { permissions = {}, isViewOnly = false } = {}) => {
  const canUpdate = permissions?.update && !isViewOnly;
  const updateBlocked = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : !permissions?.update ? PERMISSION_MESSAGES.NO_PERMISSION : null;

  return [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
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
      width: 80,
      render: (_, record) => {
        const isSystemGenerated = Boolean(record?.isSystemGenerated);
        const canEdit = canUpdate && !isSystemGenerated;
        const editTooltip = updateBlocked || (isSystemGenerated ? SYSTEM_GENERATED_TOOLTIP : 'Edit');

        return (
          <div className="flex items-center justify-start gap-3">
            <Tooltip title={editTooltip}>
              <Icons.EditOutlined
                className={canEdit ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                style={{ fontSize: 17, color: colorPalette.primary[500] }}
                onClick={canEdit ? () => handleEdit(record) : undefined}
              />
            </Tooltip>
          </div>
        );
      },
    },
  ];
};
