import { Link } from 'react-router-dom';
import { Tag } from '@/components/AntDComponent';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import { dateFormateForUi } from '@/utils/services';
import {
  formatPartRequestLabel,
  machineCodeFromRecord,
  machineIdFromRecord,
  machineNameFromRecord,
  partCodeFromRecord,
  partNameFromRecord,
  recordId,
  requestedByName,
  sparePartIdFromRecord,
} from './partRequest.utils';

export const partRequestColumn = () => [
  {
    title: 'Part Request No',
    dataIndex: 'partRequestNo',
    key: 'partRequestNo',
    render: value => (value ? <Tag className="font-semibold">{value}</Tag> : ''),
    visible: true,
    required: true,
    sorter: false,
    width: 140,
  },
  {
    title: 'MR No',
    dataIndex: 'mrNo',
    key: 'mrNo',
    render: (value, record) => {
      const mrNo = value || record?.mrId?.mrNo;
      const id = recordId(record?.mrId) || record?.mrId;
      if (!mrNo) return '';
      if (!id) return <Tag className="font-semibold">{mrNo}</Tag>;
      return (
        <Link to={`/maintenance-request/${id}`} onClick={event => event.stopPropagation()}>
          <Tag className="font-semibold cursor-pointer hover:opacity-80">{mrNo}</Tag>
        </Link>
      );
    },
    visible: true,
    required: true,
    sorter: true,
    width: 140,
  },
  {
    title: 'Machine Code',
    dataIndex: 'machineCode',
    key: 'machineCode',
    render: (_, record) => {
      const code = machineCodeFromRecord(record);
      const machineId = machineIdFromRecord(record);
      if (!code) return '';
      if (!machineId) return <Tag className="font-semibold">{code}</Tag>;
      return (
        <Link to={`/machine/${machineId}`} onClick={event => event.stopPropagation()}>
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
    title: 'Machine Name',
    dataIndex: 'machineName',
    key: 'machineName',
    render: (_, record) => machineNameFromRecord(record) || '',
    visible: true,
    required: true,
    sorter: true,
    width: 220,
  },
  {
    title: 'Part Code',
    dataIndex: 'partCode',
    key: 'partCode',
    render: (_, record) => {
      const code = partCodeFromRecord(record);
      const sparePartId = sparePartIdFromRecord(record);
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
    dataIndex: 'partName',
    key: 'partName',
    render: (_, record) => partNameFromRecord(record) || '',
    visible: true,
    required: true,
    sorter: true,
    width: 240,
  },
  {
    title: 'Requested',
    dataIndex: 'requestedQty',
    key: 'requestedQty',
    render: value => value ?? '',
    visible: true,
    sorter: true,
    width: 110,
  },
  {
    title: 'Approved',
    dataIndex: 'approvedQty',
    key: 'approvedQty',
    render: value => value ?? '',
    visible: true,
    sorter: true,
    width: 110,
  },
  {
    title: 'Issued',
    dataIndex: 'issuedQty',
    key: 'issuedQty',
    render: value => value ?? '',
    visible: true,
    sorter: true,
    width: 110,
  },
  {
    title: 'UOM',
    dataIndex: 'uom',
    key: 'uom',
    render: value => value || '',
    visible: true,
    width: 100,
  },
  {
    title: 'Requested By',
    dataIndex: 'requestedBy',
    key: 'requestedBy',
    render: value => requestedByName(value) || '',
    visible: true,
    width: 160,
  },
  {
    title: 'Request Date',
    dataIndex: 'requestedAt',
    key: 'requestedAt',
    render: value => (value ? dateFormateForUi(value, { withTime: true }) : ''),
    visible: true,
    sorter: true,
    width: 170,
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: value => (value ? <StatusBadge status={value} value={formatPartRequestLabel(value)} /> : ''),
    visible: true,
    sorter: true,
    width: 130,
  },
];
