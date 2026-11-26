import { Link } from 'react-router-dom';
import { Tag } from '@/components/AntDComponent';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import { formatAmount } from '@/utils/currency';
import { dateFormateForUi } from '@/utils/services';
import { getOverflowListColumn } from '@/utils/tableColumns';
import { linkedMrNo, maintenancePurchaseStageLabel, sparePartLabel, userLabel } from './maintenancePurchase.utils';

export const maintenancePurchaseColumn = () => [
  {
    title: 'Doc No',
    dataIndex: 'docNo',
    key: 'docNo',
    render: value => (value ? <Tag className="font-semibold">{value}</Tag> : ''),
    visible: true,
    required: true,
    sorter: true,
    width: 140,
  },
  {
    title: 'Vendor',
    dataIndex: 'vendor',
    key: 'vendor',
    visible: true,
    sorter: true,
    width: 180,
  },
  getOverflowListColumn({
    title: 'Items',
    dataIndex: 'items',
    key: 'items',
    width: 240,
    overflowList: {
      emptyText: '',
      linkInTooltip: true,
      getKey: (item, index) => item?._id || item?.id || index,
      getLabel: item => sparePartLabel(item) || '',
      getLink: item => {
        const sparePart = item?.sparePartId;
        const id = typeof sparePart === 'object' ? sparePart?.id || sparePart?._id : sparePart;
        return id ? `/spare-part/${id}` : null;
      },
    },
  }),
  {
    title: 'Linked MR',
    dataIndex: 'linkedMrId',
    key: 'linkedMrId',
    render: value => {
      const mrNo = linkedMrNo(value);
      const id = value?.id || value?._id;
      if (!mrNo) return '';
      if (!id) return <Tag className="font-semibold">{mrNo}</Tag>;
      return (
        <Link to={`/maintenance-request/${id}`} onClick={event => event.stopPropagation()}>
          <Tag className="font-semibold cursor-pointer hover:opacity-80">{mrNo}</Tag>
        </Link>
      );
    },
    visible: true,
    width: 140,
  },
  {
    title: 'Total Amount',
    dataIndex: 'totalAmount',
    key: 'totalAmount',
    render: value => formatAmount(value),
    visible: true,
    sorter: true,
    width: 150,
  },
  {
    title: 'PR Date',
    dataIndex: 'prDate',
    key: 'prDate',
    render: value => (value ? dateFormateForUi(value) : ''),
    visible: true,
    sorter: true,
    width: 140,
  },
  {
    title: 'Expected Delivery',
    dataIndex: 'expectedDelivery',
    key: 'expectedDelivery',
    render: value => (value ? dateFormateForUi(value) : ''),
    visible: true,
    sorter: true,
    width: 170,
  },
  {
    title: 'Raised By',
    dataIndex: 'raisedBy',
    key: 'raisedBy',
    render: value => userLabel(value) || '',
    visible: true,
    width: 160,
  },
  {
    title: 'Stage',
    dataIndex: 'stage',
    key: 'stage',
    render: value => (value ? <StatusBadge status={value} value={maintenancePurchaseStageLabel(value)} /> : ''),
    visible: true,
    sorter: true,
    width: 140,
  },
];

const quantityValue = value => (value === 0 || value ? value : '-');

export const maintenancePurchaseItemColumns = [
  {
    title: 'Code',
    dataIndex: 'sparePartId',
    key: 'code',
    width: 140,
    render: part => (part?.code ? <Tag className="font-semibold">{part.code}</Tag> : ''),
  },
  {
    title: 'Spare Part',
    dataIndex: 'sparePartId',
    key: 'name',
    width: 220,
    render: part => part?.name || '',
  },
  {
    title: 'Requested Qty',
    dataIndex: 'requestedQty',
    key: 'requestedQty',
    width: 140,
    render: quantityValue,
  },
  {
    title: 'Approved Qty',
    dataIndex: 'approvedQty',
    key: 'approvedQty',
    width: 140,
    render: quantityValue,
  },
  {
    title: 'Ordered Qty',
    dataIndex: 'orderedQty',
    key: 'orderedQty',
    width: 140,
    render: quantityValue,
  },
  {
    title: 'Received Qty',
    dataIndex: 'receivedQty',
    key: 'receivedQty',
    width: 140,
    render: quantityValue,
  },
  {
    title: 'Rate',
    dataIndex: 'rate',
    key: 'rate',
    width: 130,
    render: value => formatAmount(value),
  },
  {
    title: 'Amount',
    dataIndex: 'amount',
    key: 'amount',
    width: 140,
    render: value => formatAmount(value),
  },
];
