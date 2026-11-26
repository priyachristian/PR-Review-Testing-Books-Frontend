import { Dropdown, Popconfirm, Tooltip } from '@/components/AntDComponent';
import Icons from '@/assets/icons/icon';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import { PERMISSION_MESSAGES } from '@/utils/constants';
import { colorPalette } from '@/utils/theme';

const getWarehouseName = (value, warehouseDrop) => {
  if (typeof value === 'object') return value?.name || value?.warehouseName || '-';
  const id = String(value || '');
  return warehouseDrop?.find(warehouse => String(warehouse?._id || warehouse?.id) === id)?.name || '-';
};

export const productionWarehouseConfigColumns = (
  handleEdit,
  handleDelete,
  handleStatusChange,
  { canEdit = false, canDelete = false, isViewOnly = false, startIndex = 0, statusLoading = false, deleteLoading = false, warehouseDrop = [], openDropdownKey, setOpenDropdownKey } = {}
) => {
  const blockedTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : PERMISSION_MESSAGES.NO_PERMISSION;
  const canOpenMore = canEdit && !isViewOnly;

  return [
    {
      title: '#',
      key: 'idx',
      width: 50,
      render: (_, __, index) => startIndex + index + 1,
    },
    { title: 'Department Name', dataIndex: 'departmentName', key: 'departmentName' },
    {
      title: 'Raw Material Warehouse',
      dataIndex: 'rawMaterialWarehouseId',
      key: 'rawMaterialWarehouseId',
      render: value => getWarehouseName(value, warehouseDrop),
    },
    {
      title: 'Production Warehouse',
      dataIndex: 'productionWarehouseId',
      key: 'productionWarehouseId',
      render: value => getWarehouseName(value, warehouseDrop),
    },
    {
      title: 'Finished Goods Warehouse',
      dataIndex: 'finishedGoodsWarehouseId',
      key: 'finishedGoodsWarehouseId',
      render: value => getWarehouseName(value, warehouseDrop),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 115,
      render: isActive => <StatusBadge status={isActive !== false} value={isActive === false ? 'Inactive' : 'Active'} />,
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      width: 125,
      render: (_, record) => {
        const recordKey = record._id || record.id;
        const isActive = record.isActive !== false;
        const statusLabel = isActive ? 'Active' : 'Inactive';
        const editTooltip = canEdit && !isViewOnly ? 'Edit configuration' : blockedTooltip;
        const deleteTooltip = canDelete && !isViewOnly ? 'Delete configuration' : blockedTooltip;
        const markAsTooltip = canOpenMore ? `Mark configuration as ${isActive ? 'Inactive' : 'Active'}` : blockedTooltip;
        const moreTooltip = canOpenMore ? 'More Actions' : blockedTooltip;
        const markAsDisabled = !canOpenMore || statusLoading;
        return (
          <div className="flex items-center justify-center gap-3">
            <Tooltip title={editTooltip} placement="left">
              <Icons.EditOutlined
                className={canEdit && !isViewOnly ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                style={{ fontSize: 17, color: colorPalette.primary[500] }}
                onClick={canEdit && !isViewOnly ? () => handleEdit(record) : undefined}
              />
            </Tooltip>

            <Popconfirm
              title="Delete this configuration?"
              description="This cannot be undone."
              onConfirm={() => handleDelete(recordKey)}
              okText="Yes"
              cancelText="No"
              disabled={!canDelete || isViewOnly || deleteLoading}
            >
              <Tooltip title={deleteTooltip} placement="left">
                <Icons.DeleteOutlined className={canDelete && !isViewOnly ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'} style={{ fontSize: 17, color: colorPalette.error[500] }} />
              </Tooltip>
            </Popconfirm>

            <Dropdown
              placement="bottomRight"
              trigger={['click']}
              disabled={!canOpenMore}
              open={canOpenMore && openDropdownKey === recordKey}
              onOpenChange={open => {
                if (!canOpenMore) return;
                setOpenDropdownKey(open ? recordKey : null);
              }}
              dropdownRender={() => (
                <div className="bg-white shadow-lg rounded-lg border border-gray-200 flex flex-col w-56 py-1">
                  <div className="px-2 py-1">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">Status Actions:</div>
                  </div>
                  <Tooltip title={markAsDisabled ? markAsTooltip : `Mark as ${isActive ? 'Inactive' : 'Active'}`} placement="left">
                    <button
                      type="button"
                      disabled={markAsDisabled}
                      onClick={() => {
                        if (markAsDisabled) return;
                        setOpenDropdownKey(null);
                        handleStatusChange(record, !isActive);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors duration-150 ${
                        markAsDisabled ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-gray-700 hover:bg-gray-50 cursor-pointer'
                      }`}
                    >
                      {isActive ? (
                        <Icons.CloseCircleOutlined className={markAsDisabled ? 'text-gray-400' : 'text-red-700'} style={{ fontSize: 15 }} />
                      ) : (
                        <Icons.CheckCircleOutlined className={markAsDisabled ? 'text-gray-400' : 'text-green-700'} style={{ fontSize: 15 }} />
                      )}
                      Mark as {isActive ? 'Inactive' : 'Active'}
                    </button>
                  </Tooltip>
                </div>
              )}
            >
              <Tooltip title={moreTooltip} placement="left">
                <span>
                  <Icons.MoreOutlined
                    className={canOpenMore ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
                    style={{ fontSize: 17, color: canOpenMore ? '#1E3A56' : colorPalette.neutral[400] }}
                  />
                </span>
              </Tooltip>
            </Dropdown>
            <span className="sr-only">Current status: {statusLabel}</span>
          </div>
        );
      },
    },
  ];
};
