import { Popconfirm, Tag, Tooltip } from '@/components/AntDComponent';
import Icons from '@/assets/icons/icon';
import { PERMISSION_MESSAGES } from '@/utils/constants';
import { colorPalette } from '@/utils/theme';

export const recipeColumn = (handleEdit, handleViewClick, handleDelete, useModuleRecipe, isViewOnly) => {
  return [
    {
      title: 'Recipe Code',
      dataIndex: 'recipeId',
      key: 'recipeId',
      render: value => <Tag className="font-semibold">{value}</Tag>,
      visible: true,
      required: true,
      sorter: true,
      width: 65,
    },
    {
      title: 'Recipe Name',
      dataIndex: 'name',
      key: 'name',
      render: value => <div>{value}</div>,
      visible: true,
      required: true,
      sorter: true,
    },
    {
      title: 'Processes',
      dataIndex: 'processes',
      key: 'processes',
      sorter: true,
      render: (items, record) => (
        <div className="flex items-center gap-2">
          <Tooltip title="View Processes">
            <Tag onClick={() => handleViewClick(record)} className={'text-xs font-semibold hover:cursor-pointer py-1 hover:border-[--orange]'}>
              {`View Processes (${items.length})`}
            </Tag>
          </Tooltip>
          {record.sequenceLocked === true && <Icons.LockOutlined style={{ fontSize: 14, color: colorPalette.primary[500] }} />}
        </div>
      ),
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      sorter: true,
      render: value => <div>{value}</div>,
    },
    {
      title: 'Action',
      key: 'edit',
      render: (_, record) => {
        const canEdit = useModuleRecipe?.canEdit && !isViewOnly;
        const canDelete = useModuleRecipe?.canDelete && !isViewOnly;
        const blockedTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : PERMISSION_MESSAGES.NO_PERMISSION;

        return (
          <div className="flex space-x-2">
            <Tooltip title={canEdit ? 'Edit Recipe' : blockedTooltip}>
              <Icons.EditOutlined
                className={canEdit ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                style={{ fontSize: 17, color: colorPalette.primary[500], cursor: canEdit ? 'pointer' : 'not-allowed' }}
                onClick={() => {
                  if (!canEdit) return;
                  handleEdit(record);
                }}
              />
            </Tooltip>
            <Popconfirm
              title="Delete Recipe"
              description="Are you sure you want to delete this recipe?"
              okText="Yes"
              cancelText="No"
              disabled={!canDelete}
              onConfirm={() => handleDelete(record?.id || record?._id)}
            >
              <Tooltip title={canDelete ? 'Delete Recipe' : blockedTooltip}>
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
