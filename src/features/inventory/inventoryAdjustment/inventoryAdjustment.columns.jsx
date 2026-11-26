import { Tag, Tooltip, Popconfirm } from '@/components/AntDComponent';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import Icons from '@/assets/icons/icon';
import { dateFormateForUi } from '@/utils/services';
import { formatQtyWithUnit } from '@/utils/itemLineUnit';
import { colorPalette } from '@/utils/theme';
import { INVENTORY_ADJUSTMENT_REASONS, PERMISSION_MESSAGES } from '@/utils/constants';

export const inventoryAdjustmentColumn = (useInventoryAdjustmentPermission, STATUS_ENUM, handleApproveClick, handleRejectClick, handleEditClick, handleViewClick, isViewOnly) => {
  return [
    {
      title: 'Inventory Adjustment#',
      dataIndex: 'inventoryAdjustmentNumber',
      key: 'inventoryAdjustmentNumber',
      render: inventoryAdjustmentNumber => <Tag className="font-semibold">{inventoryAdjustmentNumber}</Tag>,
      visible: true,
      required: true,
      width: 200,
      fixed: 'left',
    },
    {
      title: 'Date',
      dataIndex: 'adjustmentDate',
      key: 'adjustmentDate',
      render: adjustmentDate => dateFormateForUi(adjustmentDate),
      visible: true,
      required: true,
    },
    {
      title: 'Approved By',
      dataIndex: 'approvedBy',
      key: 'approvedBy',
      render: approvedBy => (
        <span>
          {approvedBy?.firstName} {approvedBy?.lastName}
        </span>
      ),
      visible: true,
      width: 125,
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      render: reason => INVENTORY_ADJUSTMENT_REASONS[reason],
      visible: true,
    },
    {
      title: 'Account',
      dataIndex: 'accountId',
      key: 'accountId',
      render: accountId => accountId?.accountName || '-',
      visible: true,
    },
    {
      title: 'Reference Number',
      dataIndex: 'referenceNumber',
      key: 'referenceNumber',
      visible: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => <StatusBadge status={status} value={STATUS_ENUM?.[status] || ''} />,
      visible: true,
      required: true,
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      visible: true,
    },
    {
      title: 'Division',
      dataIndex: 'divisionId',
      key: 'divisionId',
      render: divisionId => divisionId?.name || '',
      visible: true,
    },
    {
      title: 'Branch',
      dataIndex: 'branchId',
      key: 'branchId',
      render: branchId => branchId?.name || '',
      visible: true,
    },
    {
      title: 'Warehouse',
      dataIndex: 'warehouseId',
      key: 'warehouseId',
      render: warehouseId => warehouseId?.name || '',
      visible: true,
    },
    {
      title: 'Created By',
      dataIndex: 'createdBy',
      key: 'createdBy',
      render: createdBy => (
        <span>
          {createdBy?.firstName} {createdBy?.lastName}
        </span>
      ),
      visible: true,
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: createdAt => (createdAt ? dateFormateForUi(createdAt) : '-'),
      visible: true,
    },
    {
      title: 'Updated By',
      dataIndex: 'updatedBy',
      key: 'updatedBy',
      render: updatedBy => (
        <span>
          {updatedBy?.firstName} {updatedBy?.lastName}
        </span>
      ),
      visible: true,
    },
    {
      title: 'Updated At',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: updatedAt => (updatedAt ? dateFormateForUi(updatedAt) : '-'),
      visible: true,
    },
    {
      title: 'Action',
      key: 'action',
      width: 150,
      render: (_, record) => {
        const canView = useInventoryAdjustmentPermission?.view;
        const canEdit = useInventoryAdjustmentPermission?.edit && !isViewOnly && record?.status === 'DRAFT';
        const statusLabel = STATUS_ENUM?.[record?.status] || record?.status || '-';

        const viewTooltip = canView ? 'View' : PERMISSION_MESSAGES.NO_PERMISSION;
        const editTooltip = canEdit
          ? 'Edit'
          : isViewOnly
            ? PERMISSION_MESSAGES.VIEW_ONLY
            : !useInventoryAdjustmentPermission?.edit
              ? PERMISSION_MESSAGES.NO_PERMISSION
              : `This document cannot be edited in its current status - ${statusLabel}.`;
        const approveTooltip = canEdit
          ? 'Approve'
          : isViewOnly
            ? PERMISSION_MESSAGES.VIEW_ONLY
            : !useInventoryAdjustmentPermission?.edit
              ? PERMISSION_MESSAGES.NO_PERMISSION
              : `This document cannot be approved in its current status - ${statusLabel}.`;
        const rejectTooltip = canEdit
          ? 'Reject'
          : isViewOnly
            ? PERMISSION_MESSAGES.VIEW_ONLY
            : !useInventoryAdjustmentPermission?.edit
              ? PERMISSION_MESSAGES.NO_PERMISSION
              : `This document cannot be rejected in its current status - ${statusLabel}.`;

        return (
          <div className="flex items-center gap-3" onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()} role="presentation">
            <Tooltip title={viewTooltip}>
              <Icons.EyeOutlined
                className={canView ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                style={{ fontSize: 17, color: '#1E3A56' }}
                onClick={canView ? () => handleViewClick(record) : undefined}
              />
            </Tooltip>

            <Tooltip title={editTooltip}>
              <Icons.EditOutlined
                className={canEdit ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                style={{ fontSize: 17, color: colorPalette.primary[500] }}
                onClick={canEdit ? () => handleEditClick(record) : undefined}
              />
            </Tooltip>

            {canEdit ? (
              <Popconfirm
                placement="topRight"
                title={'Inventory Approve'}
                description={'Are you sure to approve this inventory?'}
                okText="Yes"
                onConfirm={() => handleApproveClick(record)}
                cancelText="No"
              >
                <Tooltip title={approveTooltip}>
                  <Icons.CheckOutlined className="cursor-pointer" style={{ fontSize: 17, color: colorPalette.primary[500] }} />
                </Tooltip>
              </Popconfirm>
            ) : (
              <Tooltip title={approveTooltip}>
                <Icons.CheckOutlined className="opacity-40 cursor-not-allowed" style={{ fontSize: 17, color: colorPalette.primary[500] }} />
              </Tooltip>
            )}

            {canEdit ? (
              <Popconfirm
                placement="topRight"
                title={'Inventory Reject'}
                description={'Are you sure to reject this inventory?'}
                okText="Yes"
                onConfirm={() => handleRejectClick(record)}
                cancelText="No"
              >
                <Tooltip title={rejectTooltip}>
                  <Icons.CloseOutlined className="cursor-pointer" style={{ fontSize: 17, color: colorPalette.error[500] }} />
                </Tooltip>
              </Popconfirm>
            ) : (
              <Tooltip title={rejectTooltip}>
                <Icons.CloseOutlined className="opacity-40 cursor-not-allowed" style={{ fontSize: 17, color: colorPalette.error[500] }} />
              </Tooltip>
            )}
          </div>
        );
      },
    },
  ];
};

export const inventoryAdjustmentDetailItemsColumn = () => {
  return [
    {
      title: 'Item Number',
      dataIndex: ['itemId', 'itemNo'],
      key: 'itemNo',
      render: text => <Tag className="font-semibold">{text}</Tag>,
    },
    {
      title: 'Item Name',
      dataIndex: ['itemId', 'itemName'],
      key: 'itemName',
    },
    {
      title: 'Item Unit',
      dataIndex: ['itemUnitId', 'name'],
      key: 'itemUnitId',
    },
    {
      title: 'Current Stock',
      dataIndex: 'currentStock',
      key: 'currentStock',
      render: (currentStock, record) => formatQtyWithUnit(currentStock, record) || '-',
    },
    {
      title: 'Adjusted Stock',
      dataIndex: 'adjustedStock',
      key: 'adjustedStock',
      render: (adjustedStock, record) => {
        if (adjustedStock == null || adjustedStock === '') return '-';
        const display = Number(adjustedStock) > 0 ? `+${adjustedStock}` : adjustedStock;
        return <span className={adjustedStock < 0 ? 'text-red-500 font-semibold' : 'text-green-500 font-semibold'}>{formatQtyWithUnit(display, record)}</span>;
      },
    },
    {
      title: 'Updated Stock',
      dataIndex: 'updatedStock',
      key: 'updatedStock',
      render: (updatedStock, record) => formatQtyWithUnit(updatedStock, record) || '-',
    },
    {
      title: 'Purchase Price',
      dataIndex: 'purchasePrice',
      key: 'purchasePrice',
      render: purchasePrice => (purchasePrice != null && purchasePrice !== '' ? purchasePrice : ''),
    },
  ];
};
