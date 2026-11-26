import { Link } from 'react-router-dom';
import { Tag, Tooltip } from '@/components/AntDComponent';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import { dateFormateForUi } from '@/utils/services';
import { formatMaintenanceLabel, machineCodeFromRecord, machineIdFromRecord, machineNameFromRecord, raisedByName } from './maintenanceRequest.utils';

export const maintenanceRequestColumn = () => [
  {
    title: 'MR No',
    dataIndex: 'mrNo',
    key: 'mrNo',
    render: value => (value ? <Tag className="font-semibold">{value}</Tag> : ''),
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
    title: 'Branch',
    dataIndex: 'branchId',
    key: 'branchId',
    render: value => value?.name || '',
    visible: true,
    sorter: true,
    width: 160,
  },
  {
    title: 'Problem',
    dataIndex: 'problemDescription',
    key: 'problemDescription',
    render: value =>
      value ? (
        <Tooltip title={value}>
          <span className="line-clamp-2">{value}</span>
        </Tooltip>
      ) : (
        ''
      ),
    visible: true,
    width: 280,
  },
  {
    title: 'Raised By',
    dataIndex: 'raisedBy',
    key: 'raisedBy',
    render: value => raisedByName(value) || '',
    visible: true,
    width: 160,
  },
  {
    title: 'Raised At',
    dataIndex: 'raisedAt',
    key: 'raisedAt',
    render: value => (value ? dateFormateForUi(value, { withTime: true }) : ''),
    visible: true,
    sorter: true,
    width: 170,
  },
  {
    title: 'SLA Due',
    dataIndex: 'slaDueAt',
    key: 'slaDueAt',
    render: value => (value ? dateFormateForUi(value, { withTime: true }) : ''),
    visible: true,
    sorter: true,
    width: 170,
  },
  {
    title: 'Machine Stopped',
    dataIndex: 'isMachineStopped',
    key: 'isMachineStopped',
    render: value => (typeof value === 'boolean' ? (value ? 'Yes' : 'No') : ''),
    visible: true,
    sorter: true,
    width: 150,
  },
  {
    title: 'Type',
    dataIndex: 'type',
    key: 'type',
    render: value => (value ? <StatusBadge status={value} value={formatMaintenanceLabel(value)} /> : ''),
    visible: true,
    sorter: true,
    width: 140,
  },
  {
    title: 'Priority',
    dataIndex: 'priority',
    key: 'priority',
    render: value => (value ? <StatusBadge status={value} value={formatMaintenanceLabel(value)} /> : ''),
    visible: true,
    sorter: true,
    width: 120,
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: value => (value ? <StatusBadge status={value} value={formatMaintenanceLabel(value)} /> : ''),
    visible: true,
    sorter: true,
    width: 130,
  },
];

export const requestedPartColumns = [
  {
    title: 'Part Code',
    dataIndex: ['sparePartId', 'code'],
    key: 'partCode',
    width: 140,
    render: value => value || '',
  },
  {
    title: 'Part Name',
    dataIndex: ['sparePartId', 'name'],
    key: 'partName',
    width: 240,
    render: value => value || '',
  },
  {
    title: 'UOM',
    dataIndex: 'uom',
    key: 'uom',
    width: 100,
    render: value => value || '',
  },
  {
    title: 'Quantity',
    dataIndex: 'requestedQty',
    key: 'requestedQty',
    width: 110,
    render: value => value ?? '',
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: 140,
    render: value => (value ? <StatusBadge status={value} value={formatMaintenanceLabel(value)} /> : '-'),
  },
  {
    title: 'Requested At',
    dataIndex: 'requestedAt',
    key: 'requestedAt',
    width: 180,
    render: value => (value ? dateFormateForUi(value, { withTime: true }) : ''),
  },
];
