import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';

// Components
import { Button, Empty, Modal, Popconfirm, Tabs, Tooltip } from '@/components/AntDComponent';
import AccessFallback from '@/components/feedback/errorBoundary/AccessFallback';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import FilterInput from '@/components/forms/formInput/FilterInput';
import DownlineTeamSkeleton from '../components/DownlineTeamSkeleton';

// Hooks
import { useAuth } from '@/hooks/useAuth';
import { useCompanyCurrency } from '@/hooks/useCompanyCurrency';
import useModulePermissions from 'hooks/useModulePermissions';

// Extras
import { incentiveLogColumn, incentiveSchemeColumn, useIncentiveScheme } from '@/features/setting/incentiveScheme';
import { DOC_LABELS, LOG_STATUS_COLORS, STATUS_TRANSITIONS, filterInputEnum } from '@/utils/constants';
import { formatAmount, formatAmountShort } from '@/utils/currency';
import { colorPalette } from '@/utils/theme';
import { ADMIN_ROUTE_PATHS } from '@/routes/adminRoutePaths';
import { RESOURCES } from '@/utils/jsonFile';
import Icons from 'assets/icons/icon';

const LOG_FILTER_KEYS = ['schemeId', 'docType', 'status'];

const buildLogFiltersFromParams = searchParams => ({
  page: parseInt(searchParams.get('page'), 10) || 1,
  limit: parseInt(searchParams.get('limit'), 10) || 20,
  ...(searchParams.get('schemeId') && { schemeId: searchParams.get('schemeId') }),
  ...(searchParams.get('docType') && { docType: searchParams.get('docType') }),
  ...(searchParams.get('status') && { status: searchParams.get('status') }),
});

const AnalyticsCard = ({ data }) => {
  const displayValue = data?.isCount ? data?.value : formatAmountShort(data?.value);
  const tooltipTitle = data?.isCount ? data?.value : formatAmount(data?.value);

  return (
    <div className="bg-white border-r border-b border-gray-200 p-3 sm:p-4 h-full">
      <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 mb-2">
        <div
          className="p-2 sm:p-2.5 flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: 'rgba(23, 133, 182, 0.08)',
            color: colorPalette.primary[500],
          }}
        >
          {data?.icon}
        </div>
        {data?.trend && (
          <div className={`text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full self-start xs:self-auto ${data?.trend > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {data?.trend > 0 ? '↑' : '↓'} {Math.abs(data?.trend)}%
          </div>
        )}
      </div>

      <div className="space-y-0.5">
        <p className="text-[11px] sm:text-xs font-medium text-gray-500 uppercase tracking-wide line-clamp-1">{data?.title}</p>
        <Tooltip title={tooltipTitle} placement="top">
          <p className="text-lg sm:text-lg font-bold text-gray-900 leading-tight break-words cursor-default">{displayValue}</p>
        </Tooltip>
      </div>
    </div>
  );
};

const getInitials = name =>
  (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();

const TeamMemberCard = ({ member, currencySymbol, onClick }) => {
  const currencyConfig = currencySymbol != null ? { symbol: currencySymbol } : undefined;
  const formatMoney = amount => formatAmount(amount, true, currencyConfig);
  const subtitle = member.role || member.designation || member.email || '-';
  const settledPct = member.totalEarned > 0 ? Math.min((member.totalSettled / member.totalEarned) * 100, 100) : 0;

  const statRows = [
    { label: 'Active schemes', value: member.activeSchemes ?? 0, color: '#030711' },
    { label: 'Total earned', value: formatMoney(member.totalEarned), color: colorPalette.success[600] },
    { label: 'Settled', value: formatMoney(member.totalSettled), color: colorPalette.primary[500] },
    { label: 'Pending', value: formatMoney(member.totalPending), color: '#d97706' },
  ];

  return (
    <div
      className="bg-white border border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => onClick?.(member)}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick?.(member)}
    >
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ backgroundColor: colorPalette.primary[500] }}>
            {getInitials(member.name) || '?'}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-[#030711] truncate">{member.name || '-'}</div>
            <div className="text-xs text-gray-500 truncate">{subtitle}</div>
          </div>
        </div>

        <div>
          {statRows.map((row, i) => (
            <div key={row.label} className={`flex justify-between items-center py-2.5 ${i < statRows.length - 1 ? 'border-b border-gray-100' : ''}`}>
              <span className="text-xs text-gray-500">{row.label}</span>
              <span className="text-sm font-semibold" style={{ color: row.color }}>
                {row.value}
              </span>
            </div>
          ))}

          <div className="pt-3 mt-1 border-t border-gray-100">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-gray-500">Settlement progress</span>
              <span className="text-xs font-semibold text-gray-700">{Math.round(settledPct)}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${settledPct}%`, backgroundColor: colorPalette.primary[500] }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DownlineTeam = ({ teamStats, loading, currencySymbol, onMemberClick }) => {
  const members = teamStats?.members || [];
  const isLoading = loading && !teamStats;

  if (isLoading) {
    return (
      <div className="px-4 pb-4 mt-3">
        <DownlineTeamSkeleton />
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="px-4 pb-4 mt-3 py-12">
        <Empty description="No team members found" />
      </div>
    );
  }

  return (
    <div className="px-4 pb-4 mt-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {members.map((member, index) => (
          <TeamMemberCard key={member._id || member.id || member.userId || index} member={member} currencySymbol={currencySymbol} onClick={onMemberClick} />
        ))}
      </div>
    </div>
  );
};

const ViewIncentiveSchemes = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { accessRoles, signin } = useAuth();
  const { currencySymbol } = useCompanyCurrency();
  const { useIncentiveConfig, isViewOnly } = useModulePermissions(RESOURCES.OTHER_SETTINGS.incentive);
  const isAdmin = accessRoles?.role?.toLowerCase() === 'admin' || Boolean(signin?.user?.isAdmin);
  const canAdd = (isAdmin || useIncentiveConfig?.add) && !isViewOnly;
  const canUpdate = (isAdmin || useIncentiveConfig?.update) && !isViewOnly;
  const canDelete = (isAdmin || useIncentiveConfig?.delete) && !isViewOnly;

  const {
    schemes,
    summary,
    teamStats,
    logs,
    logsPagination,
    pagination,
    loading,
    submitLoading,
    getIncentiveSchemes,
    updateIncentiveSchemeStatus,
    deleteIncentiveScheme,
    getSchemeSummary,
    getIncentiveLogs,
    updateLogStatus,
    deleteIncentiveLog,
    bulkSettleLogs,
    getTeamStats,
  } = useIncentiveScheme();

  const activeTab = searchParams.get('tab') || 'schemes';
  const appliedLogFilters = useMemo(() => buildLogFiltersFromParams(searchParams), [searchParams]);

  const [logDraftFilters, setLogDraftFilters] = useState(() => ({
    schemeId: searchParams.get('schemeId') || undefined,
    docType: searchParams.get('docType') || undefined,
    status: searchParams.get('status') || undefined,
  }));

  const urlSchemeId = searchParams.get('schemeId');
  const urlDocType = searchParams.get('docType');
  const urlStatus = searchParams.get('status');

  useEffect(() => {
    setLogDraftFilters({
      schemeId: urlSchemeId || undefined,
      docType: urlDocType || undefined,
      status: urlStatus || undefined,
    });
  }, [urlSchemeId, urlDocType, urlStatus]);

  useEffect(() => {
    getIncentiveSchemes({ page: 1, limit: 20 });
    getSchemeSummary();
  }, [getIncentiveSchemes, getSchemeSummary]);

  useEffect(() => {
    if (activeTab === 'logs') {
      getIncentiveLogs(appliedLogFilters);
    }
    if (activeTab === 'team') {
      getTeamStats();
    }
  }, [activeTab, appliedLogFilters, getIncentiveLogs, getTeamStats]);

  // Recalculate table height after summary strip renders (CustomTable uses window resize)
  useEffect(() => {
    if (!summary) return;
    const timer = setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
    return () => clearTimeout(timer);
  }, [summary, activeTab]);

  const handleTabChange = tab => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', tab);
    setSearchParams(params);
  };

  const handleApplyLogFilters = () => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', 'logs');
    params.set('page', '1');
    params.set('limit', String(appliedLogFilters.limit || 20));
    LOG_FILTER_KEYS.forEach(key => {
      const value = logDraftFilters[key];
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    setSearchParams(params);
  };

  const handleResetLogFilters = () => {
    setLogDraftFilters({});
    const params = new URLSearchParams(searchParams);
    params.set('tab', 'logs');
    params.set('page', '1');
    params.set('limit', String(appliedLogFilters.limit || 20));
    LOG_FILTER_KEYS.forEach(key => params.delete(key));
    setSearchParams(params);
  };

  const handleLogPaginationChange = (page, pageSize) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(page));
    params.set('limit', String(pageSize));
    setSearchParams(params);
  };

  const openUserDetail = member => {
    const memberId = member._id || member.id || member.userId;
    if (memberId) {
      navigate(`/${ADMIN_ROUTE_PATHS.setting.incentiveScheme.build.userDetail(memberId)}`);
    }
  };

  const openCreate = () => {
    navigate(`/${ADMIN_ROUTE_PATHS.setting.incentiveScheme.new}`);
  };

  const openEdit = schemeId => {
    navigate(`/${ADMIN_ROUTE_PATHS.setting.incentiveScheme.build.edit(schemeId)}`);
  };

  const openDetail = schemeId => {
    navigate(`/${ADMIN_ROUTE_PATHS.setting.incentiveScheme.build.detail(schemeId)}`);
  };

  const handleStatusChange = async (id, nextStatus) => {
    try {
      await updateIncentiveSchemeStatus({ schemeId: id, status: nextStatus });
      getIncentiveSchemes({ page: pagination.page, limit: pagination.limit });
      getSchemeSummary();
    } catch (_) {
      /* errors surfaced by hook */
    }
  };

  const handleDelete = async id => {
    try {
      await deleteIncentiveScheme({ schemeId: id });
      getIncentiveSchemes({ page: 1, limit: pagination.limit });
      getSchemeSummary();
    } catch (_) {
      /* errors surfaced by hook */
    }
  };

  const handleBulkSettle = async () => {
    if (!appliedLogFilters.schemeId) return;
    try {
      await bulkSettleLogs({ schemeId: appliedLogFilters.schemeId, userId: appliedLogFilters.userId });
      getIncentiveLogs(appliedLogFilters);
    } catch (_) {
      /* errors surfaced by hook */
    }
  };

  const handleSettleLog = log => {
    const logId = log._id || log.id;
    const refresh = () => getIncentiveLogs(appliedLogFilters);
    const logUser = log.userId;
    const userName = logUser ? `${logUser.firstName || ''} ${logUser.lastName || ''}`.trim() || logUser.email : '-';
    Modal.confirm({
      title: 'Settle Incentive',
      okText: 'Settle',
      cancelText: 'Cancel',
      okButtonProps: { style: { background: colorPalette.primary[500], borderColor: colorPalette.primary[500] } },
      content: (
        <div className="text-[13px] mt-2">
          <p className="text-gray-500 mb-3">Mark this incentive as paid out. This action settles the earned amount and cannot be undone.</p>
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">Scheme</span>
            <span className="font-medium">{log.schemeId?.name || '-'}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">User</span>
            <span className="font-medium">{userName}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">Document Type</span>
            <span className="font-medium">{DOC_LABELS[log.docType] || log.docType}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">Current Status</span>
            <span className="font-medium">{log.status}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-gray-500">Settle Amount</span>
            <span className="font-semibold" style={{ color: colorPalette.primary[500] }}>
              {formatAmount(log.earnedAmount)}
            </span>
          </div>
        </div>
      ),
      onOk: () => updateLogStatus({ logId, status: 'SETTLED' }).then(refresh),
    });
  };

  const logColumns = incentiveLogColumn({
    canSettle: canUpdate,
    canDelete,
    isViewOnly,
    handleSettleLog,
    currencySymbol,
    handleDeleteLog: log => {
      const logId = log._id || log.id;
      return deleteIncentiveLog({ logId }).then(() => getIncentiveLogs(appliedLogFilters));
    },
  });

  const schemeColumns = incentiveSchemeColumn(currencySymbol);

  const renderSchemeActions = scheme => {
    const schemeId = scheme._id || scheme.id;
    const transitions = STATUS_TRANSITIONS[scheme.status] || [];
    const iconBtnStyle = allowed => ({ padding: 0, width: 24, height: 24, minWidth: 24, opacity: allowed ? 1 : 0.4, cursor: allowed ? 'pointer' : 'not-allowed' });

    const transitionButton = (transition, onClick) => {
      const icon =
        transition.next === 'ACTIVE' ? (
          <Icons.PlayCircleOutlined style={{ fontSize: 17, color: colorPalette.primary[500] }} />
        ) : transition.next === 'PAUSED' ? (
          <Icons.PauseOutlined style={{ fontSize: 17, color: '#d97706' }} />
        ) : (
          <Icons.StopOutlined style={{ fontSize: 17, color: colorPalette.error[500] }} />
        );
      return <PermissionButton type="text" style={iconBtnStyle(canUpdate)} icon={icon} onClick={onClick} canAccess={canUpdate} isViewOnly={isViewOnly} />;
    };

    return (
      <div className="flex items-center gap-1">
        <Tooltip title="View details">
          <Icons.EyeOutlined style={{ fontSize: 17, color: '#1E3A56' }} onClick={() => openDetail(schemeId)} />
        </Tooltip>
        {scheme.status !== 'ENDED' && (
          <PermissionButton
            type="text"
            style={iconBtnStyle(canUpdate)}
            icon={<Icons.EditOutlined style={{ fontSize: 17, color: colorPalette.primary[500] }} />}
            onClick={() => openEdit(schemeId)}
            canAccess={canUpdate}
            isViewOnly={isViewOnly}
          />
        )}
        {transitions.map(transition =>
          transition.next === 'ENDED' ? (
            <Popconfirm
              key={transition.next}
              title="End this scheme?"
              description="Earning stops immediately. You can continue it again until the scheme's end date."
              onConfirm={() => handleStatusChange(schemeId, transition.next)}
              okText="End Scheme"
              okType="danger"
              cancelText="Cancel"
              disabled={!canUpdate}
            >
              {transitionButton(transition)}
            </Popconfirm>
          ) : transition.next === 'PAUSED' ? (
            <Popconfirm
              key={transition.next}
              title="Pause scheme?"
              description="Earning stops temporarily. You can resume the scheme at any time."
              onConfirm={() => handleStatusChange(schemeId, transition.next)}
              okText="Pause"
              cancelText="Cancel"
              disabled={!canUpdate}
            >
              {transitionButton(transition)}
            </Popconfirm>
          ) : (
            <span key={transition.next}>{transitionButton(transition, () => handleStatusChange(schemeId, transition.next))}</span>
          )
        )}
        {scheme.status === 'ENDED' && scheme.endDate && dayjs().isBefore(dayjs(scheme.endDate).endOf('day')) && (
          <Popconfirm
            title="Continue this scheme?"
            description="The scheme becomes active again and resumes earning until its end date."
            onConfirm={() => handleStatusChange(schemeId, 'ACTIVE')}
            okText="Continue"
            cancelText="Cancel"
            disabled={!canUpdate}
          >
            <PermissionButton
              type="text"
              style={iconBtnStyle(canUpdate)}
              icon={<Icons.ReloadOutlined style={{ fontSize: 17, color: colorPalette.primary[500] }} />}
              canAccess={canUpdate}
              isViewOnly={isViewOnly}
            />
          </Popconfirm>
        )}
        <Popconfirm
          title="Delete scheme?"
          description="Any existing activity logs must be cancelled or removed first."
          onConfirm={() => handleDelete(schemeId)}
          okText="Yes"
          cancelText="No"
          disabled={!canDelete}
        >
          <PermissionButton
            type="text"
            style={iconBtnStyle(canDelete)}
            icon={<Icons.DeleteOutlined style={{ color: colorPalette.error[500], fontSize: 17 }} />}
            canAccess={canDelete}
            isViewOnly={isViewOnly}
          />
        </Popconfirm>
      </div>
    );
  };

  if (!isAdmin && !useIncentiveConfig?.view) {
    return <AccessFallback description="You don't have permission to access the Incentive Schemes module" showHomeButton={accessRoles?.permissions?.[RESOURCES?.HOME]?.view ?? true} />;
  }

  const remaining = summary ? (summary.totalBudget ?? 0) - (summary.totalConsumed ?? 0) : 0;

  const summaryCards = summary
    ? [
        {
          title: 'Total budget',
          icon: <Icons.WalletOutlined className="text-xl" />,
          value: summary.totalBudget ?? 0,
        },
        {
          title: 'Consumed',
          icon: <Icons.MinusCircleOutlined className="text-xl" />,
          value: summary.totalConsumed ?? 0,
        },
        {
          title: 'Remaining',
          icon: <Icons.BankOutlined className="text-xl" />,
          value: remaining,
        },
        {
          title: 'Active schemes',
          icon: <Icons.AppstoreOutlined className="text-xl" />,
          value: summary.activeSchemes ?? 0,
          isCount: true,
        },
      ]
    : [];

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Header */}
      <div className="shrink-0 bg-white shadow-sm border border-gray-200 px-4 py-[6px]">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h3 className="md:text-xl lg:text-lg font-semibold text-[#030711] tracking-tight leading-none">Incentive Schemes</h3>
            <p className="lg:text-xs md:text-xs text-[#6b7280] font-medium">Motivate your sales team with budget-backed incentive schemes per document type.</p>
          </div>
          <PermissionButton
            canAccess={canAdd}
            isViewOnly={isViewOnly}
            type="primary"
            onClick={openCreate}
            style={{
              background: canAdd ? colorPalette.primary[500] : undefined,
              borderColor: canAdd ? colorPalette.primary[500] : undefined,
              opacity: canAdd ? 1 : 0.5,
              cursor: canAdd ? 'pointer' : 'not-allowed',
            }}
            icon={<Icons.PlusCircleOutlined />}
            text="New Scheme"
          />
        </div>
      </div>

      {/* Summary strip */}
      {summary && (
        <div className="shrink-0 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 border-l border-gray-200">
          {summaryCards.map((item, index) => (
            <AnalyticsCard key={index} data={item} />
          ))}
        </div>
      )}

      {/* Tabs + content */}
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-white shadow-sm">
        <div className="shrink-0 px-4 pt-2">
          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
            items={[
              { key: 'schemes', label: 'Schemes' },
              { key: 'logs', label: 'Incentive Logs' },
              { key: 'team', label: 'Downline Team' },
            ]}
          />
        </div>

        {/* Scheme list */}
        {activeTab === 'schemes' && (
          <div className="flex-1 min-h-0 overflow-hidden">
            <CustomTable
              key={`schemes-${summary ? 'ready' : 'loading'}`}
              columns={schemeColumns}
              data={schemes || []}
              loading={loading}
              rowKey={r => r._id || r.id}
              onRowClick={record => openDetail(record._id || record.id)}
              pagination={{
                current: pagination.page,
                pageSize: pagination.limit,
                total: pagination.totalResults,
                onChange: (page, pageSize) => getIncentiveSchemes({ page, limit: pageSize }),
              }}
              paginationClassName="border-l-0"
              scrollYOffset={130}
              isPaginationFixed={true}
              columnActions={() => ({
                title: 'Action',
                key: 'action',
                fixed: 'right',
                width: 240,
                visible: true,
                render: (_, record) => renderSchemeActions(record),
              })}
            />
          </div>
        )}

        {/* Incentive Logs tab */}
        {activeTab === 'logs' && (
          <div className="flex flex-col flex-1 min-h-0 overflow-hidden px-4 pb-4 mt-3">
            <div className="shrink-0 flex flex-wrap gap-4 items-end mb-4">
              <div className="space-y-2 flex-1 min-w-[180px]">
                <FilterInput
                  type={filterInputEnum?.SELECT}
                  name="schemeId"
                  label="Scheme"
                  placeHolder="Select Scheme"
                  selectionOptions={(schemes || []).map(s => ({ value: s._id || s.id, label: s.name }))}
                  value={logDraftFilters.schemeId}
                  setFilter={setLogDraftFilters}
                  allowClear
                />
              </div>
              <div className="space-y-2 flex-1 min-w-[180px]">
                <FilterInput
                  type={filterInputEnum?.SELECT}
                  name="docType"
                  label="Document Type"
                  placeHolder="Select Document Type"
                  selectionOptions={Object.entries(DOC_LABELS).map(([key, label]) => ({ value: key, label }))}
                  value={logDraftFilters.docType}
                  setFilter={setLogDraftFilters}
                  allowClear
                />
              </div>
              <div className="space-y-2 flex-1 min-w-[180px]">
                <FilterInput
                  type={filterInputEnum?.SELECT}
                  name="status"
                  label="Status"
                  placeHolder="Select Status"
                  selectionOptions={Object.keys(LOG_STATUS_COLORS).map(s => ({ value: s, label: s[0] + s.slice(1).toLowerCase() }))}
                  value={logDraftFilters.status}
                  setFilter={setLogDraftFilters}
                  allowClear
                />
              </div>
              <div className="flex gap-2 flex-shrink-0 mb-[10px]">
                <Button onClick={handleResetLogFilters}>Reset Filters</Button>
                <Button type="primary" icon={<Icons.FilterOutlined />} onClick={handleApplyLogFilters} style={{ background: colorPalette.primary[500], borderColor: colorPalette.primary[500] }}>
                  Apply Filters
                </Button>
              </div>
            </div>
            {appliedLogFilters.schemeId && (
              <div className="shrink-0 flex justify-end mb-4">
                <Popconfirm
                  title="Settle all pending & approved logs?"
                  description="This settles every pending and approved incentive for the selected scheme (and user, if filtered)."
                  onConfirm={handleBulkSettle}
                  okText="Settle All"
                  cancelText="Cancel"
                  disabled={!canUpdate}
                >
                  <PermissionButton
                    canAccess={canUpdate}
                    isViewOnly={isViewOnly}
                    type="primary"
                    text="Settle All"
                    style={{
                      background: canUpdate ? colorPalette.primary[500] : undefined,
                      borderColor: canUpdate ? colorPalette.primary[500] : undefined,
                      opacity: canUpdate ? 1 : 0.5,
                      cursor: canUpdate ? 'pointer' : 'not-allowed',
                    }}
                    loading={submitLoading}
                  />
                </Popconfirm>
              </div>
            )}
            <div className="flex-1 min-h-0 overflow-hidden">
              <CustomTable
                key={`logs-${appliedLogFilters.schemeId || 'all'}-${appliedLogFilters.docType || 'all'}-${appliedLogFilters.status || 'all'}`}
                columns={logColumns}
                data={logs}
                loading={loading}
                rowKey={r => r._id || r.id}
                pagination={{
                  current: logsPagination.page,
                  pageSize: logsPagination.limit,
                  total: logsPagination.totalResults,
                  onChange: handleLogPaginationChange,
                }}
                paginationClassName="border-l-0"
                scrollYOffset={130}
                isPaginationFixed={true}
              />
            </div>
          </div>
        )}

        {/* Downline team tab */}
        {activeTab === 'team' && (
          <div className="flex-1 min-h-0 overflow-y-auto">
            <DownlineTeam teamStats={teamStats} loading={loading} currencySymbol={currencySymbol} onMemberClick={openUserDetail} />
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewIncentiveSchemes;
