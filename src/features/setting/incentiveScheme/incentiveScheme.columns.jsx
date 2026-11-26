import dayjs from 'dayjs';
import { Popconfirm, Tag } from '@/components/AntDComponent';
import PermissionButton from '@/components/ui/button/PermissionButton';
import Icons from 'assets/icons/icon';
import { formatAmount } from '@/utils/currency';
import { colorPalette } from '@/utils/theme';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import { DOC_LABELS } from '@/utils/constants';
import { INCENTIVE_LOG_STATUS_CONFIG, SCHEME_STATUS_CONFIG } from '@/utils/dropdownEnums';

const fmtDate = date => (date ? dayjs(date).format('DD MMM YYYY') : '-');

const currencyConfig = currencySymbol => (currencySymbol != null ? { symbol: currencySymbol } : undefined);

const formatMoney = (amount, currencySymbol) => formatAmount(amount, true, currencyConfig(currencySymbol));

const createFmtShort = currencySymbol => {
  const symbol = currencySymbol ?? '';
  return n => {
    n = Number(n || 0);
    if (n >= 1_00_000) return `${symbol}${(n / 1_00_000).toFixed(n % 1_00_000 === 0 ? 0 : 1)}L`;
    if (n >= 1000 && n % 1000 === 0) return `${symbol}${n / 1000}K`;
    return formatMoney(n, currencySymbol);
  };
};

const getSchemeConsumed = scheme => {
  if (scheme.totalConsumed != null) return Number(scheme.totalConsumed) || 0;
  return Object.values(scheme.consumedByDocType || {}).reduce((sum, value) => sum + (Number(value) || 0), 0);
};

export const downlineTeamColumn = currencySymbol => [
  {
    title: 'User',
    key: 'user',
    width: 240,
    render: (_, member) => (
      <div>
        <div className="font-medium text-[#030711]">{member.name || '-'}</div>
        {member.email && <div className="text-xs text-gray-500">{member.email}</div>}
      </div>
    ),
  },
  {
    title: 'Active Schemes',
    key: 'activeSchemes',
    width: 120,
    render: (_, member) => member.activeSchemes ?? 0,
  },
  {
    title: 'Total Earned',
    key: 'totalEarned',
    width: 130,
    render: (_, member) => (
      <span className="font-semibold" style={{ color: colorPalette.success[600] }}>
        {formatMoney(member.totalEarned, currencySymbol)}
      </span>
    ),
  },
  {
    title: 'Settled',
    key: 'totalSettled',
    width: 120,
    render: (_, member) => (
      <span className="font-semibold" style={{ color: colorPalette.primary[500] }}>
        {formatMoney(member.totalSettled, currencySymbol)}
      </span>
    ),
  },
  {
    title: 'Pending',
    key: 'totalPending',
    width: 120,
    render: (_, member) => (
      <span className="font-semibold" style={{ color: '#d97706' }}>
        {formatMoney(member.totalPending, currencySymbol)}
      </span>
    ),
  },
  {
    title: 'Settlement Progress',
    key: 'progress',
    width: 200,
    render: (_, member) => {
      const settledPct = member.totalEarned > 0 ? Math.min((member.totalSettled / member.totalEarned) * 100, 100) : 0;

      return (
        <div className="min-w-[140px]">
          <div className="text-[11px] text-gray-500 mb-1">{Math.round(settledPct)}% settled</div>
          <div className="h-[6px] bg-gray-100 rounded-full overflow-hidden">
            <div style={{ width: `${settledPct}%`, height: '100%', background: colorPalette.primary[500], borderRadius: 999 }} />
          </div>
        </div>
      );
    },
  },
];

export const incentiveLogColumn = ({ canSettle, canDelete, isViewOnly = false, handleSettleLog, handleDeleteLog, currencySymbol }) => [
  {
    title: 'User',
    key: 'user',
    render: (_, record) => {
      const user = record.userId;
      return user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email : '-';
    },
  },
  { title: 'Doc Type', dataIndex: 'docType', key: 'docType', render: type => DOC_LABELS[type] || type },
  { title: 'Doc Number', dataIndex: ['docId', 'number'], key: 'docNumber', render: number => <Tag className="font-semibold">{number || '-'}</Tag> },
  { title: 'Doc Amount', dataIndex: 'docAmount', key: 'docAmount', render: value => formatMoney(value, currencySymbol) },
  {
    title: 'Scheme Name',
    dataIndex: 'schemeId',
    key: 'schemeId',
    render: schemeId => {
      return schemeId?.name || '-';
    },
  },
  {
    title: 'Earned',
    dataIndex: 'earnedAmount',
    key: 'earnedAmount',
    render: value => (
      <span className="font-semibold" style={{ color: colorPalette.primary[500] }}>
        {formatMoney(value, currencySymbol)}
      </span>
    ),
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: status => {
      const { accentHex, label } = INCENTIVE_LOG_STATUS_CONFIG[status] || { accentHex: '#9ca3af', label: status };
      return <StatusBadge accentHex={accentHex} value={label} />;
    },
  },
  {
    title: 'Action',
    key: 'action',
    width: 160,
    render: (_, record) => {
      const iconBtnStyle = allowed => ({ padding: 0, width: 24, height: 24, minWidth: 24, opacity: allowed ? 1 : 0.4, cursor: allowed ? 'pointer' : 'not-allowed' });
      return (
        <div className="flex items-center gap-1">
          {(record.status === 'PENDING' || record.status === 'APPROVED') && (
            <PermissionButton
              type="text"
              style={iconBtnStyle(canSettle)}
              icon={<Icons.DollarOutlined style={{ fontSize: 17, color: colorPalette.success[600] }} />}
              onClick={() => handleSettleLog(record)}
              canAccess={canSettle}
              isViewOnly={isViewOnly}
            />
          )}
          {record.status !== 'SETTLED' && (
            <Popconfirm title="Delete log?" description="This will permanently remove this incentive log." onConfirm={() => handleDeleteLog(record)} okText="Yes" cancelText="No" disabled={!canDelete}>
              <PermissionButton
                type="text"
                style={iconBtnStyle(canDelete)}
                icon={<Icons.DeleteOutlined style={{ color: colorPalette.error[500], fontSize: 17 }} />}
                canAccess={canDelete}
                isViewOnly={isViewOnly}
              />
            </Popconfirm>
          )}
        </div>
      );
    },
  },
];

export const incentiveSchemeColumn = currencySymbol => {
  const fmtShort = createFmtShort(currencySymbol);

  return [
    {
      title: 'Scheme',
      key: 'name',
      width: 400,
      render: (_, scheme) => {
        const docLabels = scheme.docTypes?.map(docType => DOC_LABELS[docType.docType] || docType.docType).join(' · ');
        return (
          <div>
            <div className="font-medium text-[#030711]">{scheme.name}</div>
            {docLabels && <div className="text-xs text-gray-500 line-clamp-1">{docLabels}</div>}
          </div>
        );
      },
    },
    {
      title: 'Status',
      key: 'status',
      width: 110,
      render: (_, scheme) => {
        const { accentHex, label } = SCHEME_STATUS_CONFIG[scheme.status] || { accentHex: '#9ca3af', label: scheme.status };
        return <StatusBadge accentHex={accentHex} value={label} />;
      },
    },
    {
      title: 'Period',
      key: 'period',
      width: 190,
      render: (_, scheme) => (scheme.startDate ? `${fmtDate(scheme.startDate)} – ${fmtDate(scheme.endDate)}` : '-'),
    },
    {
      title: 'Budget',
      key: 'budget',
      width: 120,
      render: (_, scheme) => fmtShort(scheme.totalBudget),
    },
    {
      title: 'Consumed',
      key: 'consumed',
      width: 120,
      render: (_, scheme) => (
        <span className="font-semibold" style={{ color: colorPalette.primary[500] }}>
          {fmtShort(getSchemeConsumed(scheme))}
        </span>
      ),
    },
    {
      title: 'Usage',
      key: 'usage',
      width: 220,
      render: (_, scheme) => {
        const consumed = getSchemeConsumed(scheme);
        const budget = scheme.totalBudget || 0;
        const pct = budget > 0 ? Math.min((consumed / budget) * 100, 100) : 0;
        const barColor = pct >= 100 ? colorPalette.error[500] : pct >= 80 ? '#d97706' : colorPalette.primary[500];

        return (
          <div className="min-w-[160px]">
            <div className="flex justify-between text-[11px] text-gray-500 mb-1">
              <span>{Math.round(pct)}% used</span>
              {scheme.assignedUsers?.length > 0 && <span>{scheme.assignedUsers.length} users</span>}
            </div>
            <div className="h-[6px] bg-gray-100 rounded-full overflow-hidden">
              <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 999 }} />
            </div>
          </div>
        );
      },
    },
  ];
};
