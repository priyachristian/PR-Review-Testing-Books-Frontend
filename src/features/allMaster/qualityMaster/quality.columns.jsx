import { Popconfirm, Tag, Tooltip } from '@/components/AntDComponent';
import { colorPalette } from '@/utils/theme';
import { PERMISSION_MESSAGES } from '@/utils/constants';
import Icons from 'assets/icons/icon';

export const qualityMasterColumn = (handleEditClick, handleViewClick, handleDeleteClick, useModuleQuality, isViewOnly) => {
  return [
    {
      title: 'Report#',
      dataIndex: 'reportId',
      key: 'reportId',
      render: reportId => <Tag className="font-semibold">{reportId}</Tag>,
      visible: true,
      required: true,
      sorter: true,
      fixed: 'left',
      width: 120,
    },
    {
      title: 'Report Name',
      dataIndex: 'reportName',
      key: 'reportName',
      visible: true,
      required: true,
      sorter: true,
      width: 220,
    },
    {
      title: 'Product Name',
      dataIndex: 'productName',
      key: 'productName',
      visible: true,
      required: true,
      sorter: true,
      width: 220,
    },
    {
      title: 'Report Type',
      dataIndex: 'reportType',
      key: 'reportType',
      visible: true,
      required: true,
      sorter: true,
      width: 130,
    },
    {
      title: 'Checker',
      dataIndex: 'checker',
      key: 'checker',
      visible: true,
      sorter: true,
      width: 150,
    },
    {
      title: 'Action',
      key: 'edit',
      render: record => {
        const canView = useModuleQuality?.view;
        const canEdit = useModuleQuality?.edit && !isViewOnly;
        const canDelete = useModuleQuality?.delete && !isViewOnly;
        const blockedTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : PERMISSION_MESSAGES.NO_PERMISSION;

        return (
          <div className="flex items-center gap-3">
            {canView && (
              <Tooltip title="View Quality">
                <Icons.EyeOutlined className="cursor-pointer" onClick={() => handleViewClick(record)} style={{ fontSize: 17, color: '#1E3A56' }} />
              </Tooltip>
            )}
            <Tooltip title={canEdit ? 'Edit Quality' : blockedTooltip}>
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
              title="Delete Quality"
              description="Are you sure you want to delete this quality?"
              okText="Yes"
              cancelText="No"
              disabled={!canDelete}
              onConfirm={() => handleDeleteClick(record?.qualityData?._id || record?.qualityData?.id || record?._id)}
            >
              <Tooltip title={canDelete ? 'Delete Quality' : blockedTooltip}>
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
