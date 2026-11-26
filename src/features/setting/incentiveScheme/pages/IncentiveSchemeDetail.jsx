import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';

// Components
import IncentiveSchemeDetailSkeleton from '../components/IncentiveSchemeDetailSkeleton';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import { Button, Popconfirm, Tooltip } from '@/components/AntDComponent';
import AccessFallback from '@/components/feedback/errorBoundary/AccessFallback';
import PermissionButton from '@/components/ui/button/PermissionButton';

// Hooks
import { useAuth } from '@/hooks/useAuth';
import useModulePermissions from 'hooks/useModulePermissions';

// Extras
import { useIncentiveScheme } from '@/features/setting/incentiveScheme';
import { DOC_LABELS, DOC_TYPE_COLORS } from '@/utils/constants';
import { SCHEME_STATUS_CONFIG } from '@/utils/dropdownEnums';
import { formatAmount } from '@/utils/currency';
import { colorPalette } from '@/utils/theme';
import { ADMIN_ROUTE_PATHS } from '@/routes/adminRoutePaths';
import { RESOURCES } from '@/utils/jsonFile';
import Icons from 'assets/icons/icon';

const listPath = `/${ADMIN_ROUTE_PATHS.setting.incentiveScheme.root}`;
const fmtDate = date => (date ? dayjs(date).format('DD MMM YYYY') : '-');

const IncentiveSchemeDetail = () => {
  const { incentiveSchemeId } = useParams();
  const navigate = useNavigate();
  const { accessRoles, signin } = useAuth();
  const { useIncentiveConfig } = useModulePermissions(RESOURCES.OTHER_SETTINGS.incentive);
  const isAdmin = accessRoles?.role?.toLowerCase() === 'admin' || Boolean(signin?.user?.isAdmin);
  const canUpdate = isAdmin || Boolean(useIncentiveConfig?.update);

  const [settlingKey, setSettlingKey] = useState(null);

  const { singleScheme, consumption, loading, getIncentiveSchemeById, getSchemeConsumption, bulkSettleLogs, resetScheme } = useIncentiveScheme();

  useEffect(() => {
    if (incentiveSchemeId) {
      getIncentiveSchemeById({ schemeId: incentiveSchemeId });
      getSchemeConsumption({ schemeId: incentiveSchemeId });
    }
    return () => resetScheme();
  }, [incentiveSchemeId, getIncentiveSchemeById, getSchemeConsumption, resetScheme]);

  const handleBack = () => navigate(listPath);

  const handleSettleScheme = async () => {
    if (!incentiveSchemeId) return;
    setSettlingKey('all');
    try {
      await bulkSettleLogs({ schemeId: incentiveSchemeId });
      await getSchemeConsumption({ schemeId: incentiveSchemeId });
    } catch (_) {
      /* errors surfaced by hook */
    } finally {
      setSettlingKey(null);
    }
  };

  const handleSettleUser = async userId => {
    const id = userId?.toString?.() || userId;
    if (!incentiveSchemeId || !id) return;
    setSettlingKey(id);
    try {
      await bulkSettleLogs({ schemeId: incentiveSchemeId, userId: id });
      await getSchemeConsumption({ schemeId: incentiveSchemeId });
    } catch (_) {
      /* errors surfaced by hook */
    } finally {
      setSettlingKey(null);
    }
  };

  const isLoading = loading && !singleScheme;

  if (!isAdmin && !useIncentiveConfig?.view) {
    return <AccessFallback description="You don't have permission to access the Incentive Schemes module" showHomeButton={accessRoles?.permissions?.[RESOURCES?.HOME]?.view ?? true} />;
  }

  if (isLoading) {
    return <IncentiveSchemeDetailSkeleton />;
  }

  if (!singleScheme) {
    return <div className="px-4 py-10 text-center text-gray-400 text-sm">{loading ? 'Loading scheme…' : 'Scheme not found.'}</div>;
  }

  const scheme = singleScheme;
  const docTypeRows = scheme.docTypes || [];
  const totalConsumed = scheme.totalConsumed ?? docTypeRows.reduce((sum, docTypeRow) => sum + (docTypeRow.consumed || 0), 0);
  const remaining = (scheme.totalBudget || 0) - totalConsumed;
  const alertThreshold = scheme.alertThreshold || 80;
  const assignedUsers = scheme.assignedUsers?.map(user => user.name || user._id).join(', ') || '-';
  const byUser = consumption?.byUser || [];
  const hasAllUserSettled = !byUser.some(member => (member.pending || 0) > 0);

  const usageRows = docTypeRows.map(docTypeRow => {
    const consumed = docTypeRow.consumed || 0;
    const allocated = docTypeRow.allocatedBudget || 0;
    const denominator = allocated > 0 ? allocated : scheme.totalBudget || 0;
    const pct = denominator > 0 ? Math.min((consumed / denominator) * 100, 100) : 0;
    return {
      docType: docTypeRow.docType,
      label: DOC_LABELS[docTypeRow.docType] || docTypeRow.docType,
      color: DOC_TYPE_COLORS[docTypeRow.docType] || colorPalette.primary[500],
      consumed,
      allocated,
      denominator,
      pct,
    };
  });

  const alerts = usageRows.filter(row => row.allocated > 0 && row.pct >= alertThreshold);

  const userGridCols = 'grid-cols-[2fr_1fr_1fr_1fr_1.5fr_auto]';

  const statCards = [
    { label: 'Total budget', value: formatAmount(scheme.totalBudget), color: '#030711' },
    { label: 'Consumed', value: formatAmount(totalConsumed), color: colorPalette.primary[500] },
    { label: 'Remaining', value: formatAmount(remaining), color: colorPalette.success[600] },
    { label: 'Users assigned', value: assignedUsers, color: '#030711', valueClassName: 'text-[13px] font-medium leading-snug break-words' },
  ];

  const { accentHex: schemeStatusHex, label: schemeStatusLabel } = SCHEME_STATUS_CONFIG[scheme.status] || {
    accentHex: '#9ca3af',
    label: scheme.status,
  };

  return (
    <>
      <div className="bg-white py-2 border-b">
        <div className="flex items-center space-x-4 h-full px-4">
          <Button className="flex items-center justify-center hover:bg-gray-100 bg-gray-50 transition-colors" type="text" onClick={handleBack}>
            <Icons.ArrowLeftOutlined />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-[18px] font-semibold text-gray-900">Scheme Detail</h1>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="font-bold text-xl text-[#030711] leading-tight">{scheme.name}</h3>
              <span className="text-xs text-gray-400">
                {fmtDate(scheme.startDate)} — {fmtDate(scheme.endDate)}
              </span>
            </div>
            <StatusBadge accentHex={schemeStatusHex} value={schemeStatusLabel} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {statCards.map(card => (
              <div key={card.label} className="bg-[#f5f5f4] rounded-xl border border-gray-200 px-4 py-3">
                <div className="text-[12px] text-gray-500 mb-1">{card.label}</div>
                <div className={card.valueClassName || 'text-[22px] font-bold leading-tight'} style={{ color: card.color }}>
                  {card.value}
                </div>
              </div>
            ))}
          </div>

          {alerts.map(alert => (
            <div key={alert.docType} className="mt-3 bg-amber-50 border border-amber-300 rounded-lg px-4 py-3 text-[13px] text-amber-700">
              {alert.label} is at {Math.round(alert.pct)}% of budget. Consider increasing allocation or monitoring closely.
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
          <div className="font-semibold text-[15px] text-[#030711] mb-4">Document-wise budget vs consumed</div>
          <div className="flex flex-col gap-4">
            {usageRows.map(row => (
              <div key={row.docType}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-[13px] text-[#030711]">{row.label}</span>
                  <span className="text-[13px] font-medium" style={{ color: row.color }}>
                    {Math.round(row.pct)}% used
                  </span>
                </div>
                <div className="h-[8px] bg-gray-100 rounded-full overflow-hidden">
                  <div style={{ width: `${row.pct}%`, height: '100%', background: row.color, borderRadius: 999, transition: 'width 0.4s ease' }} />
                </div>
                <div className="flex items-center justify-between mt-1 text-[11px] text-gray-400">
                  <span>{formatAmount(row.consumed)}</span>
                  <span>{formatAmount(row.denominator)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {byUser.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4">
            <div className="font-semibold text-[15px] text-[#030711] mb-4">User-wise consumption</div>
            <div className={`grid ${userGridCols} gap-3 text-[11px] text-gray-400 uppercase tracking-wide pb-2 border-b border-gray-100`}>
              <span>User</span>
              <span>Earned</span>
              <span>Settled</span>
              <span>Pending</span>
              <span>Progress</span>
              <span className="text-right">Action</span>
            </div>
            {byUser.map(member => {
              const userId = (member._id || member.userId)?.toString?.() || member._id || member.userId;
              const pending = (member.earned || 0) - (member.settled || 0);
              const progress = member.earned > 0 ? Math.min((member.settled / member.earned) * 100, 100) : 0;
              const hasPending = pending > 0;
              return (
                <div key={userId} className={`grid ${userGridCols} gap-3 items-center py-3 border-b border-gray-100 text-[13px]`}>
                  <span className="text-[#030711]">{member.name || userId}</span>
                  <span className="font-semibold" style={{ color: colorPalette.success[600] }}>
                    {formatAmount(member.earned)}
                  </span>
                  <span style={{ color: colorPalette.primary[500] }}>{formatAmount(member.settled)}</span>
                  <span style={{ color: '#d97706' }}>{formatAmount(pending)}</span>
                  <div className="h-[6px] bg-gray-100 rounded-full overflow-hidden">
                    <div style={{ width: `${progress}%`, height: '100%', background: colorPalette.primary[500], borderRadius: 999 }} />
                  </div>
                  <div className="flex justify-end">
                    <Popconfirm
                      title={`Settle pending incentives for ${member.name || 'this user'}?`}
                      description="This settles every pending and approved incentive for this user in this scheme."
                      onConfirm={() => handleSettleUser(userId)}
                      okText="Settle"
                      cancelText="Cancel"
                      disabled={!canUpdate || !hasPending}
                    >
                      <PermissionButton
                        canAccess={canUpdate}
                        type="link"
                        size="small"
                        disabled={!hasPending}
                        loading={settlingKey === userId}
                        style={{
                          color: canUpdate && hasPending ? colorPalette.primary[500] : undefined,
                          padding: 0,
                          height: 'auto',
                          opacity: canUpdate ? 1 : 0.5,
                          cursor: canUpdate ? 'pointer' : 'not-allowed',
                        }}
                        text="Settle"
                      />
                    </Popconfirm>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end">
          <Tooltip title={hasAllUserSettled ? 'All users are already settled' : undefined}>
            <span className="inline-block">
              <Popconfirm
                title="Settle all pending & approved logs?"
                description="This settles every pending and approved incentive for this scheme."
                onConfirm={handleSettleScheme}
                okText="Settle All"
                cancelText="Cancel"
                disabled={!canUpdate || hasAllUserSettled}
              >
                <PermissionButton
                  canAccess={canUpdate}
                  type="primary"
                  loading={settlingKey === 'all'}
                  style={{
                    background: canUpdate ? colorPalette.primary[500] : undefined,
                    borderColor: canUpdate ? colorPalette.primary[500] : undefined,
                    opacity: canUpdate ? 1 : 0.5,
                    cursor: canUpdate ? 'pointer' : 'not-allowed',
                  }}
                  text="Settle All"
                />
              </Popconfirm>
            </span>
          </Tooltip>
        </div>
      </div>
    </>
  );
};

export default IncentiveSchemeDetail;
