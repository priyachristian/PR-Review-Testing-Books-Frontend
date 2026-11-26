import dayjs from 'dayjs';
import { Tag, Tooltip } from '@/components/AntDComponent';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import { colorPalette } from '@/utils/theme';
import { COMPLAINT_LIST_STATUS } from './complaint.constants';

const isComplaintOverdue = (value, record) => {
  if (record?.deadlineTone === 'late') return true;
  if (record?.dueDate && dayjs(record.dueDate).isValid() && dayjs(record.dueDate).isBefore(dayjs())) return true;
  if (typeof value === 'string' && /overdue|\blate\b/i.test(value)) return true;
  return false;
};

export const complaintColumns = ({ showCustomer = true } = {}) => [
  {
    title: 'NUMBER',
    key: 'complaintNo',
    dataIndex: 'complaintNo',
    width: 160,
    visible: true,
    required: true,
    render: value => <Tag className="font-semibold">{value || '-'}</Tag>,
  },
  {
    title: 'DATE',
    key: 'date',
    dataIndex: 'date',
    width: 120,
    visible: true,
    render: value => (value ? dayjs(value).format('DD/MM/YYYY') : '-'),
  },
  {
    title: 'PROBLEM',
    key: 'problemPath',
    dataIndex: 'problemPath',
    visible: true,
    required: true,
    render: problemPath => {
      const path = Array.isArray(problemPath) ? problemPath : [];
      const label = path[path.length - 1] || '-';
      const fullName = path.length ? path.join(' > ') : '-';
      return (
        <Tooltip title={fullName}>
          <span className="block min-w-0 max-w-full truncate">{label}</span>
        </Tooltip>
      );
    },
  },
  ...(showCustomer
    ? [
        {
          title: 'CUSTOMER',
          key: 'customerName',
          dataIndex: 'customerName',
          width: 180,
          visible: true,
          render: value => value || '',
        },
      ]
    : []),
  {
    title: 'WITH',
    key: 'userName',
    dataIndex: 'userName',
    width: 160,
    visible: true,
    render: value => value || '',
  },
  {
    title: 'TIME',
    key: 'time',
    dataIndex: 'time',
    width: 160,
    visible: true,
    render: (value, record) => {
      if (!value) return '';
      const overdue = isComplaintOverdue(value, record);
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium" style={overdue ? { color: colorPalette.error[500] } : undefined}>
          {value}
        </span>
      );
    },
  },
  {
    title: 'STATUS',
    key: 'status',
    dataIndex: 'status',
    width: 140,
    visible: true,
    render: value => {
      const statusMeta = COMPLAINT_LIST_STATUS[value] || COMPLAINT_LIST_STATUS.NEEDS_ACTION;
      return <StatusBadge value={statusMeta.label} accentHex={statusMeta.color} />;
    },
  },
];
