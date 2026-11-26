import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// Components
import UserIncentiveSchemeDetailSkeleton from '../components/UserIncentiveSchemeDetailSkeleton';
import { Button } from '@/components/AntDComponent';
import AccessFallback from '@/components/feedback/errorBoundary/AccessFallback';

// Hooks
import { useCompanyCurrency } from '@/hooks/useCompanyCurrency';
import { useAuth } from '@/hooks/useAuth';
import useModulePermissions from 'hooks/useModulePermissions';
// Extras
import { useIncentiveScheme } from '@/features/setting/incentiveScheme';
import { formatAmount } from '@/utils/currency';
import { colorPalette } from '@/utils/theme';
import { ADMIN_ROUTE_PATHS } from '@/routes/adminRoutePaths';
import { RESOURCES } from '@/utils/jsonFile';
import Icons from 'assets/icons/icon';

const listPath = `/${ADMIN_ROUTE_PATHS.setting.incentiveScheme.root}`;

const getInitials = name =>
  (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join('')
    .toUpperCase();

const UserIncentiveSchemeDetail = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { currencySymbol } = useCompanyCurrency();
  const { useIncentiveConfig } = useModulePermissions(RESOURCES.OTHER_SETTINGS.incentive);
  const { accessRoles, signin } = useAuth();
  const isAdmin = accessRoles?.role?.toLowerCase() === 'admin' || Boolean(signin?.user?.isAdmin);

  const { userSchemes, loading, getUserIncentiveSchemes, resetUserSchemes } = useIncentiveScheme();

  useEffect(() => {
    if (userId) {
      getUserIncentiveSchemes({ userId });
    }
    return () => resetUserSchemes();
  }, [userId, getUserIncentiveSchemes, resetUserSchemes]);

  const handleBack = () => navigate(`${listPath}?tab=team`);

  const isLoading = loading && !userSchemes?.user;

  if (!isAdmin && !useIncentiveConfig?.view) {
    return <AccessFallback description="You don't have permission to access the Incentive Schemes module" />;
  }

  if (isLoading) {
    return <UserIncentiveSchemeDetailSkeleton />;
  }

  if (!userSchemes?.user) {
    return <div className="px-4 py-10 text-center text-gray-400 text-sm">{loading ? 'Loading user details…' : 'User not found.'}</div>;
  }

  const { user, totalEarned = 0, totalSettled = 0, totalPending = 0, totalSchemes = 0, schemes = [] } = userSchemes;

  const statCards = [
    { label: 'Total earned', value: formatAmount(totalEarned, true, { symbol: currencySymbol }), color: colorPalette.success[600] },
    { label: 'Settled', value: formatAmount(totalSettled, true, { symbol: currencySymbol }), color: colorPalette.primary[500] },
    { label: 'Pending', value: formatAmount(totalPending, true, { symbol: currencySymbol }), color: '#d97706' },
    { label: 'Schemes', value: totalSchemes, color: '#030711' },
  ];

  return (
    <>
      <div className="bg-white py-2 border-b">
        <div className="flex items-center space-x-4 h-full px-4">
          <Button className="flex items-center justify-center hover:bg-gray-100 bg-gray-50 transition-colors" type="text" onClick={handleBack}>
            <Icons.ArrowLeftOutlined />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-[18px] font-semibold text-gray-900">User Incentive Details</h1>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-4 mb-5">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white text-base font-bold flex-shrink-0" style={{ backgroundColor: colorPalette.primary[500] }}>
              {getInitials(user.name) || <Icons.UserOutlined />}
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#030711] leading-tight">{user.name || '-'}</h3>
              {user.email && <span className="text-xs text-gray-500">{user.email}</span>}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {statCards.map(card => (
              <div key={card.label} className="bg-[#f5f5f4] rounded-xl border border-gray-200 px-4 py-3">
                <div className="text-[12px] text-gray-500 mb-1">{card.label}</div>
                <div className="text-[22px] font-bold leading-tight" style={{ color: card.color }}>
                  {card.value}
                </div>
              </div>
            ))}
          </div>

          <div className="font-semibold text-[15px] text-[#030711] mb-4">Scheme-wise incentive earned</div>

          {schemes.length === 0 ? (
            <div className="text-center text-gray-400 text-sm py-8">No schemes assigned to this user yet.</div>
          ) : (
            <div>
              {schemes.map(scheme => {
                const earned = scheme.totalEarned ?? 0;
                const settled = scheme.totalSettled ?? 0;
                const pending = scheme.totalPending ?? 0;
                const settledPct = earned > 0 ? Math.min((settled / earned) * 100, 100) : 0;

                return (
                  <div key={scheme._id || scheme.id} className="py-4 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <span className="font-semibold text-[14px] text-[#030711]">{scheme.schemeName}</span>
                      <span className="font-bold text-[14px]" style={{ color: colorPalette.success[600] }}>
                        {formatAmount(earned, true, { symbol: currencySymbol })}
                      </span>
                    </div>
                    <div className="flex gap-4 text-[12px] text-gray-500 mb-2">
                      <span>
                        Settled:{' '}
                        <span className="font-medium" style={{ color: colorPalette.primary[500] }}>
                          {formatAmount(settled, true, { symbol: currencySymbol })}
                        </span>
                      </span>
                      <span>
                        Pending:{' '}
                        <span className="font-medium" style={{ color: '#d97706' }}>
                          {formatAmount(pending, true, { symbol: currencySymbol })}
                        </span>
                      </span>
                    </div>
                    <div className="h-[6px] bg-gray-100 rounded-full overflow-hidden">
                      <div
                        style={{
                          width: `${settledPct}%`,
                          height: '100%',
                          background: colorPalette.primary[500],
                          borderRadius: 999,
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UserIncentiveSchemeDetail;
