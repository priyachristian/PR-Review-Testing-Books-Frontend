import { Tag, Tooltip } from '@/components/AntDComponent';
import Icons from '@/assets/icons/icon';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import { REJECTION_STATUS as STATUS, canDeleteRejectionOrder, canEditRejectionOrder, getRejectionEditBlockedMessage } from '@/utils/dropdownEnums';
import { ADMIN_ROUTE_PATHS } from '@/routes/adminRoutePaths';
import { PERMISSION_MESSAGES } from '@/utils/constants';
import { colorPalette } from '@/utils/theme';
import { dateFormateForUi } from '@/utils/services';

export const rejectionOrderColumn = (navigate, { onDelete, canView = true, canEdit = false, canDelete = false, isViewOnly = false } = {}) => {
  return [
    {
      title: 'Booking#',
      dataIndex: 'rejectionOrderId',
      key: 'rejectionOrderId',
      render: value => <Tag className="font-semibold">{value}</Tag>,
      visible: true,
      required: true,
      fixed: 'left',
    },
    {
      title: 'Customer Name',
      dataIndex: 'customerDisplayName',
      key: 'customerDisplayName',
      width: 150,
      render: value => value || '-',
      visible: true,
      required: true,
    },
    {
      title: 'Location',
      key: 'location',
      width: 200,
      render: (_, record) => (
        <span className="inline-flex items-center gap-1">
          <Icons.EnvironmentOutlined style={{ fontSize: 13 }} className="text-gray-400" />
          {[record?.address?.city, record?.address?.state, record?.address?.country].filter(Boolean).join(', ') || '-'}
        </span>
      ),
      visible: true,
    },
    {
      title: 'Division',
      dataIndex: 'divisionName',
      key: 'divisionName',
      width: 150,
      render: value => value || '-',
      visible: true,
    },
    {
      title: 'Branch',
      dataIndex: 'branchName',
      key: 'branchName',
      width: 150,
      render: value => value || '-',
      visible: true,
    },
    {
      title: 'Warehouse',
      dataIndex: 'warehouseName',
      key: 'warehouseName',
      width: 150,
      render: value => value || '-',
      visible: true,
    },
    {
      title: 'Items / Qty',
      key: 'itemsQty',
      width: 150,
      render: (_, record) => (
        <span>
          {record?.itemsCount || 0} items · {record?.totalPc || 0} pc
        </span>
      ),
      visible: true,
    },
    {
      title: 'Created On',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: value => (value ? dateFormateForUi(value) : '-'),
      visible: true,
    },
    {
      title: 'Created By',
      dataIndex: 'addedBy',
      key: 'addedBy',
      width: 150,
      render: value => value || '-',
      visible: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: status => <StatusBadge status={status} value={STATUS[status]?.label || status} />,
      visible: true,
      required: true,
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      visible: true,
      required: true,
      render: (_, record) => {
        const statusLabel = STATUS[record?.status]?.label || record?.status || '-';
        const canDeleteOrder = canDelete && !isViewOnly && canDeleteRejectionOrder(record?.status);
        const viewTooltip = canView ? 'View Rejection' : PERMISSION_MESSAGES.NO_PERMISSION;
        const canEditOrder = canEdit && !isViewOnly && canEditRejectionOrder(record?.status);
        const editTooltip = canEditOrder
          ? 'Edit Rejection'
          : isViewOnly
            ? PERMISSION_MESSAGES.VIEW_ONLY
            : !canEdit
              ? PERMISSION_MESSAGES.NO_PERMISSION
              : getRejectionEditBlockedMessage(record?.status);
        const deleteTooltip = canDeleteOrder
          ? 'Delete Rejection'
          : isViewOnly
            ? PERMISSION_MESSAGES.VIEW_ONLY
            : !canDelete
              ? PERMISSION_MESSAGES.NO_PERMISSION
              : `This document cannot be deleted in its current status - ${statusLabel}.`;

        return (
          <div className="flex items-center justify-center gap-3">
            <Tooltip title={viewTooltip}>
              <Icons.EyeOutlined
                className={canView ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                style={{ fontSize: 17, color: '#1E3A56', cursor: canView ? 'pointer' : 'not-allowed' }}
                onClick={e => {
                  e.stopPropagation();
                  if (canView) navigate(record._id);
                }}
              />
            </Tooltip>
            <Tooltip title={editTooltip}>
              <Icons.EditOutlined
                className={canEditOrder ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                style={{ fontSize: 17, color: colorPalette.primary[500], cursor: canEditOrder ? 'pointer' : 'not-allowed' }}
                onClick={e => {
                  e.stopPropagation();
                  if (canEditOrder) navigate(`/${ADMIN_ROUTE_PATHS.rejections.build.edit(record._id)}`);
                }}
              />
            </Tooltip>
            <Tooltip title={deleteTooltip}>
              <Icons.DeleteOutlined
                className={canDeleteOrder ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                style={{ fontSize: 17, color: colorPalette.error[500], cursor: canDeleteOrder ? 'pointer' : 'not-allowed' }}
                onClick={e => {
                  e.stopPropagation();
                  if (canDeleteOrder) onDelete?.(record);
                }}
              />
            </Tooltip>
          </div>
        );
      },
    },
  ];
};
