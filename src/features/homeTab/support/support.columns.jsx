import { Tag } from '@/components/AntDComponent';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import { getDateColumn } from '@/utils/tableColumns';
import { SUPPORT_MODULE_NAME, SUPPORT_STATUS, SUPPORT_PRIORITY, SUPPORT_CATEGORY, SUPPORT_CATEGORY_ENUM, STATUS_CONFIG, PRIORITY_CONFIG } from '@/utils/constants';

const PriorityPill = ({ priority }) => {
  const priorityLabel = SUPPORT_PRIORITY[priority] || priority || '';
  const config = PRIORITY_CONFIG[priority] || {};
  if (!config.color) return priorityLabel || '-';
  return (
    <Tag
      className="m-0 font-bold border-0 rounded-md"
      style={{
        color: config.color,
        backgroundColor: config.bgColor,
        fontSize: 11.5,
        padding: '2px 9px',
      }}
    >
      {priorityLabel}
    </Tag>
  );
};

export const supportColumn = () => [
  {
    title: 'Ticket',
    dataIndex: 'supportId',
    key: 'supportId',
    render: supportId => <Tag className="font-semibold">{supportId || '-'}</Tag>,
    visible: true,
    required: true,
    sorter: true,
  },
  getDateColumn('Date', 'createdAt', 'createdAt', true),
  {
    title: 'Raised By',
    dataIndex: 'userName',
    key: 'userName',
    render: userName => userName || '-',
  },
  {
    title: 'Title',
    dataIndex: 'bugTitle',
    key: 'bugTitle',
    width: 320,
    render: text => <div className="min-w-0 font-semibold text-gray-900 truncate">{text || '-'}</div>,
  },
  {
    title: 'Module',
    dataIndex: 'moduleName',
    key: 'moduleName',
    width: 150,
    render: moduleName => SUPPORT_MODULE_NAME?.[moduleName] || moduleName || '-',
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: status => {
      const statusLabel = SUPPORT_STATUS[status] || status || '';
      const config = STATUS_CONFIG[status] || STATUS_CONFIG.CLOSED;
      return <StatusBadge status={status} value={statusLabel} accentHex={config?.color} />;
    },
  },
  {
    title: 'Priority',
    dataIndex: 'priority',
    key: 'priority',
    render: priority => <PriorityPill priority={priority} />,
  },
  {
    title: 'Category',
    dataIndex: 'category',
    key: 'category',
    render: category => {
      const categoryLabel = SUPPORT_CATEGORY[category] || category || '';
      if (!categoryLabel) return '-';
      const categoryColors = {
        [SUPPORT_CATEGORY_ENUM.BUG]: { color: '#DC2626', bg: '#FEF2F2' },
        [SUPPORT_CATEGORY_ENUM.CHANGE_REQUEST]: { color: '#D97706', bg: '#FFF7ED' },
        [SUPPORT_CATEGORY_ENUM.NEW_MODULE]: { color: '#7E22CE', bg: '#FAF5FF' },
      };
      const style = categoryColors[category] || { color: '#475569', bg: '#f1f5f9' };
      return (
        <Tag
          className="m-0 font-semibold border-0 rounded-md"
          style={{
            color: style.color,
            backgroundColor: style.bg,
            fontSize: 11.5,
            padding: '2px 9px',
          }}
        >
          {categoryLabel}
        </Tag>
      );
    },
  },
  getDateColumn('Updated At', 'updatedAt', 'updatedAt', true),
];

export const supportReportColumn = () => [
  {
    title: 'Ticket',
    dataIndex: 'supportId',
    key: 'supportId',
    width: 120,
    render: supportId => <Tag className="font-semibold">{supportId || '-'}</Tag>,
  },
  {
    title: 'Title',
    dataIndex: 'bugTitle',
    key: 'bugTitle',
    width: 320,
    render: text => <div className="min-w-0 font-semibold text-gray-900 truncate">{text || '-'}</div>,
  },
  {
    title: 'Priority',
    dataIndex: 'priority',
    key: 'priority',
    width: 110,
    render: priority => <PriorityPill priority={priority} />,
  },
  getDateColumn('Raised', 'createdAt', 'createdAt', false),
  {
    title: 'Status today',
    dataIndex: 'status',
    key: 'status',
    width: 130,
    render: status => {
      const statusLabel = SUPPORT_STATUS[status] || status || '';
      const config = STATUS_CONFIG[status] || STATUS_CONFIG.CLOSED;
      return <StatusBadge status={status} value={statusLabel} accentHex={config?.color} />;
    },
  },
  {
    title: 'Raised By',
    dataIndex: 'userName',
    key: 'userName',
    width: 140,
    render: userName => userName || '—',
  },
];
