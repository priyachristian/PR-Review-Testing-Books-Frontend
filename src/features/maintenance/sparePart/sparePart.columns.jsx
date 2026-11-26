import { Tag } from '@/components/AntDComponent';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import { formatAmount } from '@/utils/currency';
import { getOverflowListColumn } from '@/utils/tableColumns';

const formatEnumLabel = value => {
  if (!value) return '-';
  return String(value)
    .toLowerCase()
    .split('_')
    .map(part => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(' ');
};

export const getSparePartDocumentDetails = sparePart =>
  sparePart
    ? {
        code: sparePart.code,
        name: sparePart.name,
        category: sparePart.category ? formatEnumLabel(sparePart.category) : undefined,
        uom: sparePart.uom?.name,
        status: sparePart.isActive ? 'Active' : 'Inactive',
      }
    : null;

export const sparePartColumn = () => [
  {
    title: 'Code',
    dataIndex: 'code',
    key: 'code',
    render: value => (value ? <Tag className="font-semibold">{value}</Tag> : ''),
    visible: true,
    required: true,
    sorter: true,
    width: 120,
  },
  {
    title: 'Name',
    dataIndex: 'name',
    key: 'name',
    render: value => value || '',
    visible: true,
    required: true,
    sorter: true,
  },
  {
    title: 'Category',
    dataIndex: 'category',
    key: 'category',
    render: value => (value ? formatEnumLabel(value) : ''),
    visible: true,
    sorter: true,
    width: 160,
  },
  {
    title: 'Current Stock',
    dataIndex: 'currentStock',
    key: 'currentStock',
    render: value => (value === 0 || value ? value : ''),
    visible: true,
    sorter: true,
    width: 130,
  },
  {
    title: 'Current Rate',
    dataIndex: 'currentRate',
    key: 'currentRate',
    render: value => (value === 0 || value ? formatAmount(value) : ''),
    visible: true,
    sorter: true,
    width: 130,
  },
  {
    title: 'UOM',
    dataIndex: 'uom',
    key: 'uom',
    render: uom => uom?.name || '',
    visible: true,
    width: 120,
  },
  getOverflowListColumn({
    title: 'Fits On Machines',
    dataIndex: 'fitsOnMachines',
    key: 'fitsOnMachines',
    width: 240,
    overflowList: {
      emptyText: '',
      linkInTooltip: true,
      getKey: (machine, index) => machine?._id || machine?.id || index,
      getLabel: machine => [machine?.machineCode, machine?.machineName].filter(Boolean).join(' - '),
      getLink: machine => {
        const id = machine?.id || machine?._id;
        return id ? `/machine/${id}` : null;
      },
    },
  }),
  {
    title: 'Status',
    dataIndex: 'isActive',
    key: 'isActive',
    render: isActive => <StatusBadge status={isActive} value={isActive ? 'Active' : 'Inactive'} />,
    visible: true,
    width: 120,
  },
];
