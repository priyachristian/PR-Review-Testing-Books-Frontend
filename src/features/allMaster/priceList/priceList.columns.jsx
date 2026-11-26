import { Popconfirm, Tag, Tooltip } from '@/components/AntDComponent';
import Icons from '@/assets/icons/icon';
import { formatAmount } from '@/utils/currency';
import { PERMISSION_MESSAGES } from '@/utils/constants';
import { colorPalette } from '@/utils/theme';
import { baseUnitPrice } from '@/features/allMaster/priceList/priceList.utils';

const formatUnitPrice = (amount, currency) => {
  if (amount == null || amount === '') return '-';
  return formatAmount(amount, true, currency, currency?.decimalPlaces);
};

export const priceListDetailItemsColumn = (navigate, currency) => [
  {
    title: 'Item Number',
    dataIndex: ['itemId', 'itemNo'],
    key: 'itemNo',
    render: (itemNo, record) => (
      <Tag className="font-semibold cursor-pointer" onClick={() => navigate(`/item-master/${record?.itemId?.id}`)}>
        {itemNo || '-'}
      </Tag>
    ),
  },
  {
    title: 'Item Name',
    dataIndex: ['itemId', 'itemName'],
    key: 'itemId',
  },
  {
    title: 'Item Group',
    dataIndex: ['itemGroup', 'name'],
    key: 'itemGroup',
  },
  {
    title: 'Item Unit',
    key: 'itemUnit',
    render: (_, record) => baseUnitPrice(record)?.itemUnitId?.name || '-',
  },
  {
    title: 'Net Price',
    key: 'netPrice',
    render: (_, record) => formatUnitPrice(baseUnitPrice(record)?.netPrice, currency),
  },
];

export const priceListConversionColumns = currency => [
  {
    title: 'Item Unit',
    key: 'itemUnit',
    render: (_, record) => record?.itemUnitId?.name || '-',
  },
  {
    title: 'Net Price',
    key: 'netPrice',
    render: (_, record) => formatUnitPrice(record?.netPrice, currency),
  },
];

export const priceListColumn = (handleEditClick, handleViewClick, handleDeleteClick, useModulePriceList, isViewOnly) => {
  return [
    {
      title: 'Index',
      dataIndex: 'priceListCode',
      key: 'priceListCode',
      render: value => <Tag className="font-semibold">{value}</Tag>,
      visible: true,
      required: true,
      fixed: 'left',
      width: 98,
    },
    {
      title: 'Price List Name',
      dataIndex: 'priceListName',
      key: 'priceListName',
      visible: true,
      required: true,
      width: 222,
    },
    {
      title: 'Remarks',
      dataIndex: 'remarks',
      key: 'remarks',
      visible: true,
      width: 148,
    },
    {
      title: 'Currency',
      dataIndex: ['currency', 'code'],
      key: 'currency',
      visible: true,
      render: (_, record) => record?.currency?.code || '-',
      width: 138,
    },
    {
      title: 'Action',
      key: 'edit',
      render: record => {
        const canView = useModulePriceList?.view;
        const canEdit = useModulePriceList?.edit && !isViewOnly;
        const canDelete = useModulePriceList?.delete && !isViewOnly;
        const blockedTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : PERMISSION_MESSAGES.NO_PERMISSION;

        return (
          <div className="flex items-center gap-3">
            {canView && (
              <Tooltip title="View Pricelist">
                <Icons.EyeOutlined className="cursor-pointer" style={{ fontSize: 17, color: '#1E3A56' }} onClick={() => handleViewClick(record)} />
              </Tooltip>
            )}
            <Tooltip title={canEdit ? 'Edit Pricelist' : blockedTooltip}>
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
              title="Delete Pricelist"
              description="Are you sure you want to delete this price list?"
              okText="Yes"
              cancelText="No"
              disabled={!canDelete}
              onConfirm={() => handleDeleteClick(record?.id || record?._id)}
            >
              <Tooltip title={canDelete ? 'Delete Pricelist' : blockedTooltip}>
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
