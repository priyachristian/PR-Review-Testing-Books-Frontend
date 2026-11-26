import { Popconfirm, Tooltip } from '@/components/AntDComponent';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import Icons from '@/assets/icons/icon';
import { PERMISSION_MESSAGES } from '@/utils/constants';
import { dateFormateForUi } from '@/utils/services';
import { colorPalette } from '@/utils/theme';

const STATUS_LABELS = { ACTIVE: 'Active', EXPIRED: 'Expired', INACTIVE: 'Inactive' };

export const directTaxColumn = (handleEdit, handleDelete, handleToggleStatus, { permissions = {}, isViewOnly = false } = {}) => {
  const canUpdate = permissions?.update && !isViewOnly;
  const canDelete = permissions?.delete && !isViewOnly;
  const updateBlocked = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : !permissions?.update ? PERMISSION_MESSAGES.NO_PERMISSION : null;
  const deleteBlocked = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : !permissions?.delete ? PERMISSION_MESSAGES.NO_PERMISSION : null;

  return [
    {
      title: 'Tax Name',
      dataIndex: 'taxName',
      key: 'taxName',
      width: 120,
    },
    {
      title: 'Payment Code',
      key: 'paymentCode',
      width: 140,
      render: (_, record) => record.section.paymentCode,
    },
    {
      title: 'Section',
      key: 'section',
      width: 250,
      render: (_, record) => (
        <div className="flex flex-col">
          <span>
            {record.section.sectionNo} - {record.section.name}
          </span>
        </div>
      ),
    },
    {
      title: 'Rate',
      dataIndex: 'taxRate',
      key: 'taxRate',
      width: 70,
      render: taxRate => `${taxRate}%`,
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 120,
      render: startDate => dateFormateForUi(startDate),
    },
    {
      title: 'End Date',
      dataIndex: 'endDate',
      key: 'endDate',
      width: 120,
      render: endDate => dateFormateForUi(endDate),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: status => <StatusBadge status={status} value={STATUS_LABELS[status]} />,
    },
    {
      title: 'Action',
      key: 'action',
      width: 80,
      render: (_, record) => {
        const isActive = record.isActive;
        const updateTooltip = updateBlocked;
        const deleteTooltip = deleteBlocked || 'Delete';

        return (
          <div className="flex items-center justify-start gap-3">
            <Tooltip title={updateTooltip || 'Edit'}>
              <Icons.EditOutlined
                className={canUpdate ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                style={{ fontSize: 17, color: colorPalette.primary[500] }}
                onClick={canUpdate ? () => handleEdit(record) : undefined}
              />
            </Tooltip>
            <Popconfirm
              title={`Mark as ${isActive ? 'Inactive' : 'Active'}?`}
              description={`Are you sure you want to mark "${record.taxName}" as ${isActive ? 'inactive' : 'active'}?`}
              onConfirm={() => handleToggleStatus(record)}
              okText="Yes"
              cancelText="No"
              disabled={!canUpdate}
            >
              <Tooltip title={updateTooltip || `Mark as ${isActive ? 'Inactive' : 'Active'}`}>
                <span>
                  {isActive ? (
                    <Icons.CloseCircleOutlined className={canUpdate ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'} style={{ fontSize: 17, color: colorPalette.error[500] }} />
                  ) : (
                    <Icons.CheckCircleOutlined className={canUpdate ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'} style={{ fontSize: 17, color: '#16a34a' }} />
                  )}
                </span>
              </Tooltip>
            </Popconfirm>
            <Popconfirm title="Delete this tax?" description="This cannot be undone." onConfirm={() => handleDelete(record.id)} okText="Yes" cancelText="No" disabled={!canDelete}>
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
