import { Tag } from '@/components/AntDComponent';
import StatusBadge from '@/components/ui/badge/StatusBadge';

export const getMachineDocumentDetails = machine =>
  machine
    ? {
        code: machine.machineCode,
        name: machine.machineName,
        location: machine.location,
        process: typeof machine.process === 'string' ? machine.process : machine.process?.name,
        status: machine.isActive ? 'Active' : 'Inactive',
      }
    : null;

export const machineColumn = () => [
  {
    title: 'Code',
    dataIndex: 'machineCode',
    key: 'machineCode',
    render: value => (value ? <Tag className="font-semibold">{value}</Tag> : ''),
    visible: true,
    required: true,
    sorter: true,
    width: 140,
  },
  {
    title: 'Name',
    dataIndex: 'machineName',
    key: 'machineName',
    render: value => value || '',
    visible: true,
    required: true,
    sorter: true,
  },
  {
    title: 'Location',
    dataIndex: 'location',
    key: 'location',
    render: value => value || '',
    visible: true,
    sorter: true,
  },
  {
    title: 'Process',
    dataIndex: 'process',
    key: 'process',
    render: value => value || '',
    visible: true,
    sorter: true,
    width: 140,
  },
  {
    title: 'Criticality',
    dataIndex: 'criticality',
    key: 'criticality',
    render: value => value || '',
    visible: true,
    sorter: true,
    width: 130,
  },
  {
    title: 'AMC',
    dataIndex: 'hasAMC',
    key: 'hasAMC',
    render: hasAMC => (hasAMC ? 'Yes' : 'No'),
    visible: true,
    width: 100,
  },
  {
    title: 'Status',
    dataIndex: 'isActive',
    key: 'isActive',
    render: isActive => <StatusBadge status={isActive} value={isActive ? 'Active' : 'Inactive'} />,
    visible: true,
    width: 120,
  },
];
