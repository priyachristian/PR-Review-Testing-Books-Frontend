import { Link } from 'react-router-dom';
import { Tag } from '@/components/AntDComponent';
import { dateFormateForUi } from '@/utils/services';
import { REFERENCE_TYPE_LABELS, formatTransactionType } from './spareStockLedger.utils';

export const spareStockLedgerColumn = () => [
  {
    title: 'Part Code',
    dataIndex: 'sparePartId',
    key: 'sparePartCode',
    render: value => {
      const code = value?.code;
      const sparePartId = value?.id || value?._id;
      if (!code) return '';
      if (!sparePartId) return <Tag className="font-semibold">{code}</Tag>;
      return (
        <Link to={`/spare-part/${sparePartId}`} onClick={event => event.stopPropagation()}>
          <Tag className="font-semibold cursor-pointer hover:opacity-80">{code}</Tag>
        </Link>
      );
    },
    visible: true,
    required: true,
    sorter: true,
    width: 140,
  },
  {
    title: 'Part Name',
    dataIndex: 'sparePartId',
    key: 'sparePartName',
    render: value => value?.name || '',
    visible: true,
    required: true,
    sorter: true,
    width: 220,
  },
  {
    title: 'Date',
    dataIndex: 'date',
    key: 'date',
    render: value => (value ? dateFormateForUi(value, { withTime: true }) : ''),
    visible: true,
    required: true,
    sorter: true,
    width: 170,
  },
  {
    title: 'Type',
    dataIndex: 'transactionType',
    key: 'transactionType',
    render: value => (value ? formatTransactionType(value) : ''),
    visible: true,
    required: true,
    sorter: true,
    width: 140,
  },
  {
    title: 'Reference Type',
    dataIndex: 'referenceType',
    key: 'referenceType',
    render: value => (value ? REFERENCE_TYPE_LABELS[value] || value : ''),
    visible: true,
    sorter: true,
    width: 180,
  },
  {
    title: 'Qty In',
    dataIndex: 'qty',
    key: 'qtyIn',
    render: value => (Number(value) > 0 ? <span className="font-semibold text-green-600">+{value}</span> : ''),
    visible: true,
    required: true,
    sorter: true,
    width: 100,
  },
  {
    title: 'Qty Out',
    dataIndex: 'qty',
    key: 'qtyOut',
    render: value => (Number(value) < 0 ? <span className="font-semibold text-red-600">-{Math.abs(value)}</span> : ''),
    visible: true,
    required: true,
    sorter: true,
    width: 100,
  },
  {
    title: 'Stock After',
    dataIndex: 'stockAfter',
    key: 'stockAfter',
    render: value => (value === 0 || value ? value : ''),
    visible: true,
    required: true,
    sorter: true,
    width: 120,
  },
];
