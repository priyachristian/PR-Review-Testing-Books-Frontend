import { Tag, Tooltip } from '@/components/AntDComponent';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import { dateFormateForUi } from '@/utils/services';
import { PERMISSION_MESSAGES } from 'utils/constants';
import { colorPalette } from '@/utils/theme';
import Icons from 'assets/icons/icon';

// ─── Shared static columns ────────────────────────────────────────────────────

const transferIdCol = {
  title: 'Transfer#',
  dataIndex: 'transferId',
  key: 'transferId',
  render: transferId => <Tag className="font-semibold">{transferId}</Tag>,
  visible: true,
  required: true,
  fixed: 'left',
  width: 115,
};

const transferDateCol = {
  title: 'Transfer Date',
  dataIndex: 'date',
  key: 'date',
  render: date => dateFormateForUi(date),
  visible: true,
  required: true,
};

const fromWarehouseCol = {
  title: 'From Warehouse',
  dataIndex: 'fromWarehouseId',
  key: 'fromWarehouseId',
  render: fromWarehouseId => fromWarehouseId?.name || '-',
  visible: true,
  required: true,
};

const toWarehouseCol = {
  title: 'To Warehouse',
  dataIndex: 'toWarehouseId',
  key: 'toWarehouseId',
  render: toWarehouseId => toWarehouseId?.name || '-',
  visible: true,
  required: true,
};

// ─── Shared column factories ──────────────────────────────────────────────────

const buildStatusCol = STATUS_ENUM => ({
  title: 'Status',
  dataIndex: 'status',
  key: 'status',
  render: status => <StatusBadge status={status} value={STATUS_ENUM?.[status] || ''} />,
  visible: true,
  required: true,
  width: 132,
});

const addedByCol = {
  title: 'Added By',
  dataIndex: 'addedBy',
  key: 'addedBy',
  render: addedBy => (
    <span>
      {addedBy?.firstName} {addedBy?.lastName}
    </span>
  ),
  visible: true,
};

const createdAtCol = {
  title: 'Created At',
  dataIndex: 'createdAt',
  key: 'createdAt',
  render: createdAt => (createdAt ? dateFormateForUi(createdAt) : '-'),
  visible: true,
};

const updatedByCol = {
  title: 'Updated By',
  dataIndex: 'updatedBy',
  key: 'updatedBy',
  render: updatedBy => (
    <span>
      {updatedBy?.firstName} {updatedBy?.lastName}
    </span>
  ),
  visible: true,
};

const updatedAtCol = {
  title: 'Updated At',
  dataIndex: 'updatedAt',
  key: 'updatedAt',
  render: updatedAt => (updatedAt ? dateFormateForUi(updatedAt) : '-'),
  visible: true,
};

const buildActionCol = (useModuleInventoryTransferRequest, handleApproveClick, handleRejectClick, handleViewClick, isViewOnly, STATUS_ENUM) => ({
  title: 'Action',
  key: 'action',
  render: (_, record) => {
    const canView = useModuleInventoryTransferRequest?.view;
    const canEdit = useModuleInventoryTransferRequest?.edit && !isViewOnly && record?.status === 'PENDING';
    const statusLabel = STATUS_ENUM?.[record?.status] || record?.status || '-';

    const viewTooltip = canView ? 'View Details' : PERMISSION_MESSAGES.NO_PERMISSION;
    const approveTooltip = canEdit
      ? 'Approve Request'
      : isViewOnly
        ? PERMISSION_MESSAGES.VIEW_ONLY
        : !useModuleInventoryTransferRequest?.edit
          ? PERMISSION_MESSAGES.NO_PERMISSION
          : `This document cannot be approved in its current status - ${statusLabel}.`;
    const rejectTooltip = canEdit
      ? 'Reject Request'
      : isViewOnly
        ? PERMISSION_MESSAGES.VIEW_ONLY
        : !useModuleInventoryTransferRequest?.edit
          ? PERMISSION_MESSAGES.NO_PERMISSION
          : `This document cannot be rejected in its current status - ${statusLabel}.`;

    return (
      <div className="flex items-center gap-3">
        <Tooltip title={viewTooltip}>
          <Icons.EyeOutlined
            className={canView ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
            style={{ fontSize: 18, color: '#1E3A56' }}
            onClick={
              canView && handleViewClick
                ? e => {
                    e.stopPropagation();
                    handleViewClick(record);
                  }
                : undefined
            }
          />
        </Tooltip>

        <Tooltip title={approveTooltip}>
          <Icons.CheckOutlined
            className={canEdit ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
            style={{ fontSize: 17, color: colorPalette.primary[500] }}
            onClick={
              canEdit
                ? e => {
                    e.stopPropagation();
                    handleApproveClick(record);
                  }
                : undefined
            }
          />
        </Tooltip>

        <Tooltip title={rejectTooltip}>
          <Icons.CloseOutlined
            className={canEdit ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
            style={{ fontSize: 17, color: colorPalette.error[500] }}
            onClick={
              canEdit
                ? e => {
                    e.stopPropagation();
                    handleRejectClick(record);
                  }
                : undefined
            }
          />
        </Tooltip>
      </div>
    );
  },
});

// ─── Tab-specific columns ─────────────────────────────────────────────────────

export const inventoryTransferManualColumn = (useModuleInventoryTransferRequest, STATUS_ENUM, handleApproveClick, handleRejectClick, handleViewClick, isViewOnly) => [
  transferIdCol,
  {
    title: 'Item Name',
    dataIndex: 'itemId',
    key: 'itemId',
    render: (_, record) => record?.itemId?.itemName || '-',
    visible: true,
  },
  transferDateCol,
  fromWarehouseCol,
  toWarehouseCol,
  {
    title: 'Quantity',
    dataIndex: 'quantity',
    key: 'quantity',
    render: quantity => quantity || '-',
    visible: true,
    width: 100,
  },
  buildStatusCol(STATUS_ENUM),
  addedByCol,
  createdAtCol,
  updatedByCol,
  updatedAtCol,
  buildActionCol(useModuleInventoryTransferRequest, handleApproveClick, handleRejectClick, handleViewClick, isViewOnly, STATUS_ENUM),
];

export const inventoryTransferProductionColumn = (useModuleInventoryTransferRequest, STATUS_ENUM, handleApproveClick, handleRejectClick, handleViewClick, handleViewRawMaterials, isViewOnly) => [
  transferIdCol,
  {
    title: 'Production Order',
    dataIndex: 'productionOrderId',
    key: 'productionOrderId',
    render: productionOrderId => productionOrderId?.productionOrderCode || '-',
    visible: true,
  },
  transferDateCol,
  fromWarehouseCol,
  toWarehouseCol,
  {
    title: 'Raw Materials',
    key: 'rawMaterials',
    visible: true,
    render: (_, record) => (
      <div>
        {Array.isArray(record.rawMaterials) && record.rawMaterials.length > 0 && (
          <Tag
            onClick={e => {
              e.stopPropagation();
              handleViewRawMaterials(record);
            }}
            className="font-bold text-sm cursor-pointer hover:shadow"
          >
            View
          </Tag>
        )}
      </div>
    ),
  },
  buildStatusCol(STATUS_ENUM),
  addedByCol,
  createdAtCol,
  updatedByCol,
  updatedAtCol,
  buildActionCol(useModuleInventoryTransferRequest, handleApproveClick, handleRejectClick, handleViewClick, isViewOnly, STATUS_ENUM),
];

export const inventoryTransferRawMaterialsColumn = () => [
  {
    title: 'Item Number',
    dataIndex: 'rawMaterialId',
    key: 'itemNo',
    render: rawMaterialId => <Tag className="font-semibold">{rawMaterialId?.itemNo || '-'}</Tag>,
    visible: true,
  },
  {
    title: 'Item Name',
    dataIndex: 'rawMaterialId',
    key: 'itemName',
    render: rawMaterialId => rawMaterialId?.itemName || '-',
    visible: true,
  },
  {
    title: 'Unit',
    dataIndex: 'rawMaterialId',
    key: 'itemUnit',
    render: rawMaterialId => rawMaterialId?.itemUnit || '-',
    visible: true,
  },
  {
    title: 'Req. Unit / Item',
    dataIndex: 'perItemRequiredUnit',
    key: 'perItemRequiredUnit',
    render: perItemRequiredUnit => perItemRequiredUnit || '-',
    visible: true,
  },
  {
    title: 'Total Req. Unit',
    dataIndex: 'productionOrderRequiredUnit',
    key: 'productionOrderRequiredUnit',
    render: productionOrderRequiredUnit => productionOrderRequiredUnit || '-',
    visible: true,
  },
];
