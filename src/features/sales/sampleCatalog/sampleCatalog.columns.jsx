// Third Party
import { Tag } from '@/components/AntDComponent';

// Components
import StatusBadge from '@/components/ui/badge/StatusBadge';

// Utils
import { getAmountCoulmn, getDateColumn } from '@/utils/tableColumns';

// Constants
import { SAMPLE_CATALOG_STATUS, SAMPLE_CATALOG_VISIBILITY } from '@/utils/constants';

// Detail grid: one row per offered unit, the item cell spans its units.
export const sampleCatalogDetailItemsColumn = () => [
  {
    title: 'Item',
    dataIndex: 'itemName',
    key: 'itemName',
    width: 300,
    onCell: row => ({ rowSpan: row.rowSpan }),
    render: (value, row) => (
      <div>
        <div className="font-medium">{value}</div>
        {row.itemNo && <div className="text-xs opacity-70">{row.itemNo}</div>}
      </div>
    ),
  },
  { title: 'Unit', dataIndex: 'unitName', key: 'unitName', width: 120 },
  { ...getAmountCoulmn('Sample Price', 'samplePrice', 'samplePrice', true, false, false), width: 140 },
  { title: 'Min Qty', dataIndex: 'minQty', key: 'minQty', align: 'right', width: 120 },
  { title: 'Max Qty', dataIndex: 'maxQty', key: 'maxQty', align: 'right', width: 120, render: value => value ?? '-' },
];

export const sampleCatalogColumn = () => [
  {
    title: 'Catalog Code',
    dataIndex: 'catalogCode',
    key: 'catalogCode',
    render: value => <Tag className="font-semibold">{value}</Tag>,
    visible: true,
    required: true,
    sorter: true,
    fixed: 'left',
  },
  {
    title: 'Catalog Name',
    dataIndex: 'name',
    key: 'name',
    visible: true,
    required: true,
    sorter: true,
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: status => <StatusBadge status={status} value={SAMPLE_CATALOG_STATUS?.[status] || ''} />,
    visible: true,
    required: true,
    sorter: true,
    width: 128,
  },
  {
    title: 'Visibility',
    dataIndex: 'visibility',
    key: 'visibility',
    render: (value, record) => (value === 'SELECTED_CUSTOMERS' ? `${SAMPLE_CATALOG_VISIBILITY.SELECTED_CUSTOMERS} (${record?.customerCount || 0})` : SAMPLE_CATALOG_VISIBILITY?.[value] || '-'),
    visible: true,
    sorter: true,
  },
  {
    title: 'Items',
    dataIndex: 'itemCount',
    key: 'itemCount',
    visible: true,
    width: 90,
  },
  getDateColumn('Start Date', 'startDate', 'startDate', true, true),
  getDateColumn('End Date', 'endDate', 'endDate', true, true),
  getDateColumn('Created On', 'createdAt', 'createdAt', true, true),
];
