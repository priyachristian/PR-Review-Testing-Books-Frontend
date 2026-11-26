import { useEffect } from 'react';

// Components
import MyProfileSkeleton from '../components/MyProfileSkeleton';
import ProfileCard from '../components/ProfileCard';

// Hooks
import { useIncentiveScheme } from '@/features/setting/incentiveScheme';
import { useCompanyCurrency } from '@/hooks/useCompanyCurrency';
import { useAuth } from '@/hooks/useAuth';
import { useUser } from '@/features/setting/user/useUser';

// Utils
import { formatAmount } from '@/utils/currency';
import { colorPalette } from '@/utils/theme';

const MyProfilePage = () => {
  const { currencySymbol } = useCompanyCurrency();
  const { signin, companyId } = useAuth();
  const { userDetail, userDetailLoading, getUserProfile, resetUserDetail } = useUser();
  const { userStatsDetail, getUserStatsDetail, resetUserStatsDetail } = useIncentiveScheme();
  const userId = signin?.user?._id;
  const resolvedCompanyId = companyId || signin?.company?.id || signin?.company?._id;

  useEffect(() => {
    const controller = new AbortController();

    if (userId && resolvedCompanyId) {
      getUserProfile({ userId, companyId: resolvedCompanyId, signal: controller.signal });
    }
    getUserStatsDetail();

    return () => {
      controller.abort();
      resetUserDetail();
      resetUserStatsDetail();
    };
  }, [userId, resolvedCompanyId, getUserProfile, getUserStatsDetail, resetUserDetail, resetUserStatsDetail]);

  const isLoading = userDetailLoading && !userDetail;

  if (isLoading) {
    return <MyProfileSkeleton />;
  }

  const profile = userDetail || {};
  const stats = userStatsDetail || {};
  const name = profile.name || [profile.firstName, profile.lastName].filter(Boolean).join(' ') || '';
  const email = profile.email || '';
  const role = profile.role || '';
  const phone = profile.phone || '';
  const { totalEarned = 0, totalSettled = 0, totalPending = 0, activeSchemes = 0, schemes = [] } = stats;
  const hasActiveSchemes = activeSchemes > 0;

  const statCards = [
    { label: 'Total earned', value: formatAmount(totalEarned, true, { symbol: currencySymbol }), color: colorPalette.success[600] },
    { label: 'Settled', value: formatAmount(totalSettled, true, { symbol: currencySymbol }), color: colorPalette.primary[500] },
    { label: 'Pending', value: formatAmount(totalPending, true, { symbol: currencySymbol }), color: '#d97706' },
    { label: 'Active schemes', value: activeSchemes, color: '#030711' },
  ];

  return (
    <>
      <div className="bg-white py-2.5 px-4 border-b">
        <h1 className="text-[18px] font-semibold text-gray-900">My Profile</h1>
      </div>

      <div className="px-6 py-6 space-y-6">
        <ProfileCard name={name} email={email} phone={phone} role={role} />

        {hasActiveSchemes && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mx-2 sm:mx-4">
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
            <div>
              {schemes.map(scheme => {
                const earned = scheme.totalEarned ?? 0;
                const settled = scheme.totalSettled ?? 0;
                const pending = scheme.totalPending ?? 0;
                const settledPct = earned > 0 ? Math.min((settled / earned) * 100, 100) : 0;

                return (
                  <div key={scheme._id || scheme.id} className="py-4 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-start justify-between gap-4 mb-1">
                      <span className="font-semibold text-[14px] text-[#030711]">{scheme.name || scheme.schemeName || '-'}</span>
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
          </div>
        )}
      </div>
    </>
  );
};

export default MyProfilePage;
