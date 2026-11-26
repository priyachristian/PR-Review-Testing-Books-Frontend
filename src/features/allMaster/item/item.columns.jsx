import { Tooltip, Tag } from '@/components/AntDComponent';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import Icons from 'assets/icons/icon';
import { formatGstForDisplay } from '@/utils/gstDisplay';
import { colorPalette } from '@/utils/theme';
import { TruncatedCell } from '@/utils/tableColumns';
import { PRODUCTION_MODULE_METHOD_LABEL } from '@/utils/constants';
import { formatAmount } from '@/utils/currency';

export const itemExportColumn = () => [
  {
    title: 'Item#',
    getExportValue: item => item?.itemNo || '',
  },
  {
    title: 'Item Name',
    getExportValue: item => item?.itemName || '',
  },
  {
    title: 'Item Type',
    getExportValue: item => item?.itemType || '',
  },
  {
    title: 'Item Model No',
    getExportValue: item => item?.itemModelNo || '',
  },
  {
    title: 'Item Group',
    getExportValue: item => item?.itemGroup?.name || item?.itemGroup || '',
  },
  {
    title: 'Sub Item Group',
    getExportValue: item => item?.subItemGroup?.name || item?.subItemGroup || '',
  },
  {
    title: 'Item Unit',
    getExportValue: item => item?.itemUnitId?.name || item?.itemUnit || '',
  },
  {
    title: 'Description',
    getExportValue: item => item?.description || '',
  },
  {
    title: 'Is Goods',
    getExportValue: item => (item?.itemCategory?.isGoods ? 'Yes' : 'No'),
  },
  {
    title: 'Is Service',
    getExportValue: item => (item?.itemCategory?.isService ? 'Yes' : 'No'),
  },
  {
    title: 'Is Sellable',
    getExportValue: item => (item?.salesInformation?.isSellable ? 'Yes' : 'No'),
  },
  {
    title: 'Selling Price',
    getExportValue: item => {
      const price = item?.salesInformation?.sellingPrice;
      return price != null && price !== '' ? price : '';
    },
  },
  {
    title: 'Sales Account',
    getExportValue: item => item?.salesInformation?.salesAccountName || '',
  },
  {
    title: 'Is Purchasable',
    getExportValue: item => (item?.purchaseInformation?.isPurchasable ? 'Yes' : 'No'),
  },
  {
    title: 'Cost Price',
    getExportValue: item => {
      const price = item?.purchaseInformation?.costPrice;
      return price != null && price !== '' ? price : '';
    },
  },
  {
    title: 'Purchase Account',
    getExportValue: item => item?.purchaseInformation?.purchaseAccountName || '',
  },
  {
    title: 'Track Inventory',
    getExportValue: item => (item?.trackInventory ? 'Yes' : 'No'),
  },
  {
    title: 'Inventory Account',
    getExportValue: item => item?.inventoryAccountName || '',
  },
  {
    title: 'HSN Code',
    getExportValue: item => item?.hsnCode || '',
  },
  {
    title: 'GST',
    getExportValue: item => (item?.gst != null ? item.gst : ''),
  },
];

export const itemsColumn = (handleEditClick, handleViewClick, useModuleItem) => {
  return [
    {
      title: 'Item#',
      dataIndex: 'itemNo',
      key: 'itemNo',
      render: itemNo => <Tag className="font-semibold">{itemNo}</Tag>,
      visible: true,
      required: true,
      fixed: 'left',
      width: 100,
    },
    {
      title: 'Item Name',
      dataIndex: 'itemName',
      key: 'itemName',
      ellipsis: {
        showTitle: false,
      },
      render: text => <TruncatedCell value={text} />,
      visible: true,
      required: true,
      sorter: true,
    },
    {
      title: 'Item Type',
      dataIndex: 'itemType',
      key: 'itemType',
      visible: true,
      required: true,
      sorter: true,
      width: 120,
    },
    {
      title: 'Item Status',
      dataIndex: 'itemStatus',
      key: 'itemStatus',
      render: status => {
        return <StatusBadge status={status} value={status ? 'Active' : 'Inactive'} />;
      },
      visible: true,
      required: true,
      sorter: true,
      width: 120,
    },
    {
      title: 'Item Model No',
      dataIndex: 'itemModelNo',
      key: 'itemModelNo',
      visible: true,
      sorter: true,
    },
    {
      title: 'Item Unit',
      dataIndex: ['itemUnitId', 'name'],
      key: 'itemUnit',
      visible: true,
      sorter: true,
      render: (value, record) => value || record?.itemUnit || '-',
    },
    {
      title: 'Selling Price',
      dataIndex: 'sellingPrice',
      key: 'sellingPrice',
      visible: true,
      sorter: false,
      align: 'right',
      render: (value, record) => formatAmount(value ?? record?.salesInformation?.sellingPrice),
    },
    {
      title: 'Cost Price',
      dataIndex: 'costPrice',
      key: 'costPrice',
      visible: true,
      sorter: false,
      align: 'right',
      render: (value, record) => formatAmount(value ?? record?.purchaseInformation?.costPrice),
    },
    {
      title: 'Item Group',
      dataIndex: 'itemGroup',
      key: 'itemGroup',
      visible: false,
      sorter: true,
    },
    {
      title: 'Sub Item Group',
      dataIndex: 'subItemGroup',
      key: 'subItemGroup',
      visible: false,
      render: value => value || '-',
    },
    {
      title: 'Item HSN Code',
      dataIndex: 'hsnCode',
      key: 'hsnCode',
      visible: false,
      sorter: true,
    },
    {
      title: 'GST',
      dataIndex: 'gst',
      key: 'gst',
      render: gst => {
        if (!gst) return '';
        const d = formatGstForDisplay(gst);
        return d;
      },
      visible: false,
      sorter: true,
    },
    {
      title: 'Production Manage Method',
      dataIndex: 'productionManageMethod',
      key: 'productionManageMethod',
      visible: true,
      sorter: true,
      render: productionManageMethod => PRODUCTION_MODULE_METHOD_LABEL[productionManageMethod],
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      visible: false,
      sorter: true,
    },
    {
      title: 'Created From',
      dataIndex: 'appName',
      key: 'appName',
      visible: true,
      render: appName => appName || '',
      sorter: false,
    },
    {
      title: 'Action',
      key: 'edit',
      render: record => (
        <div className="flex items-center gap-3">
          {useModuleItem.view && (
            <Tooltip title="View Item">
              <Icons.EyeOutlined onClick={() => handleViewClick(record)} style={{ fontSize: 17, color: '#1E3A56' }} />
            </Tooltip>
          )}
          {useModuleItem.edit && (
            <Tooltip title="Edit Item">
              <Icons.EditOutlined onClick={() => handleEditClick(record)} style={{ fontSize: 17, color: colorPalette.primary[500] }} />
            </Tooltip>
          )}
        </div>
      ),
    },
  ];
};

export const ITEMS_USED_IN_COLUMNS = [
  { title: 'Item Number', dataIndex: 'itemNo', key: 'itemNo', render: itemNo => <Tag className="font-semibold">{itemNo}</Tag> },
  { title: 'Item Name', dataIndex: 'itemName', key: 'itemName' },
  { title: 'Item Type', dataIndex: 'itemType', key: 'itemType' },
  {
    title: 'Item Group',
    dataIndex: 'itemGroup',
    key: 'itemGroup',
  },
];
