import { Tag, Tooltip } from '@/components/AntDComponent';
import Icons from 'assets/icons/icon';
import { PERMISSION_MESSAGES } from 'utils/constants';
import { colorPalette } from '@/utils/theme';

export const accountLedgerColumn = (handleEditClick, handleDeleteClick, isViewOnly, useModuleAccountLedger) => {
  return [
    {
      title: 'Account Ledger#',
      dataIndex: 'businessAccountLedgerMasterId',
      key: 'businessAccountLedgerMasterId',
      render: businessAccountLedgerMasterId => businessAccountLedgerMasterId && <Tag className="font-semibold">{businessAccountLedgerMasterId}</Tag>,
      visible: true,
      required: true,
      fixed: 'left',
    },
    {
      title: 'Ledger Name',
      dataIndex: 'personName',
      key: 'personName',
      visible: true,
      required: true,
    },
    {
      title: 'GST',
      dataIndex: 'gstinUin',
      key: 'gstinUin',
      render: gstinUin => gstinUin,
      visible: true,
      required: true,
    },
    {
      title: 'Added By',
      dataIndex: 'addedBy',
      key: 'addedBy',
      visible: true,
    },
    {
      title: 'Updated By',
      dataIndex: 'updatedBy',
      key: 'updatedBy',
      visible: true,
    },
    {
      title: 'Action',
      key: 'edit',
      render: record => {
        const blockedTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : PERMISSION_MESSAGES.NO_PERMISSION;
        const canEdit = useModuleAccountLedger?.edit && !isViewOnly;
        const canDelete = useModuleAccountLedger?.delete && !isViewOnly;
        const editTooltip = canEdit ? 'Edit Account Ledger' : blockedTooltip;
        const deleteTooltip = canDelete ? 'Delete Account Ledger' : blockedTooltip;

        return (
          <div className="flex items-center gap-3">
            <Tooltip title={editTooltip}>
              <Icons.EditOutlined
                className={canEdit ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                style={{ fontSize: 17, color: colorPalette.primary[500], cursor: canEdit ? 'pointer' : 'not-allowed' }}
                onClick={e => {
                  e.stopPropagation();
                  if (canEdit) handleEditClick(record);
                }}
              />
            </Tooltip>
            <Tooltip title={deleteTooltip}>
              <Icons.DeleteOutlined
                className={canDelete ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                style={{ fontSize: 17, color: colorPalette.error[500], cursor: canDelete ? 'pointer' : 'not-allowed' }}
                onClick={e => {
                  e.stopPropagation();
                  if (canDelete) handleDeleteClick(record);
                }}
              />
            </Tooltip>
          </div>
        );
      },
    },
  ];
};
