import { Tag, Tooltip } from '@/components/AntDComponent';
import { getDateColumn, getAmountCoulmn } from '@/utils/tableColumns';
import Icons from '@/assets/icons/icon';
import { PERMISSION_MESSAGES } from 'utils/constants';
import { colorPalette } from '@/utils/theme';

export const manualJournalColumn = (handleEditClick, handleViewClick, handleDeleteClick, useModuleManualJournals, isViewOnly) => {
  return [
    {
      title: 'Journal#',
      dataIndex: 'manualJournalId',
      key: 'manualJournalId',
      render: manualJournalId => <Tag className="font-semibold">{manualJournalId}</Tag>,
      visible: true,
      required: true,
      fixed: 'left',
      sorter: true,
    },
    getDateColumn('Date', 'date', 'date', true, true),
    {
      title: 'Branch',
      dataIndex: 'branchName',
      key: 'branchName',
      visible: true,
      sorter: true,
    },
    {
      title: 'VCH NO',
      dataIndex: 'vchNo',
      key: 'vchNo',
      visible: true,
      sorter: true,
      width: 90,
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      visible: true,
      sorter: true,
    },
    getAmountCoulmn('Total Amount', 'totalAmount', 'totalAmount', true, true),
    {
      title: 'Created By',
      dataIndex: 'addedBy',
      key: 'addedBy',
      visible: true,
      sorter: true,
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
      render: (_, record) => {
        const blockedTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : PERMISSION_MESSAGES.NO_PERMISSION;
        const canView = useModuleManualJournals?.view;
        const canEdit = useModuleManualJournals?.edit && !isViewOnly;
        const canDelete = useModuleManualJournals?.delete && !isViewOnly;
        const viewTooltip = canView ? 'View Journal' : PERMISSION_MESSAGES.NO_PERMISSION;
        const editTooltip = canEdit ? 'Edit Journal' : blockedTooltip;
        const deleteTooltip = canDelete ? 'Delete Journal' : blockedTooltip;

        return (
          <div className="flex items-center gap-3">
            <Tooltip title={viewTooltip}>
              <Icons.EyeOutlined
                className={canView ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                style={{ fontSize: 17, color: '#1E3A56' }}
                onClick={e => {
                  e.stopPropagation();
                  if (canView) handleViewClick(record);
                }}
              />
            </Tooltip>
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
