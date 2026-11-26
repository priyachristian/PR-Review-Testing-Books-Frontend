import { Link } from 'react-router-dom';

import CustomButton from '@/components/ui/button/CustomButton';
import { colorPalette } from '@/utils/theme';
import { getBillingPlansUrl } from '@/utils/util';

const PRIMARY = colorPalette.primary[500];

const FEATURE_BENEFITS_MAP = {
  CUSTOMER_ORDER: ['Customer self service ordering portal', 'Real time order tracking'],
};

const LockIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const CheckIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const UpgradeRequiredModal = ({ featureKey, featureName, benefits, children }) => {
  const resolvedBenefits = benefits ?? FEATURE_BENEFITS_MAP[featureKey] ?? [];

  return (
    <div className="relative">
      <div className="pointer-events-none select-none" style={{ filter: 'blur(3px)' }}>
        {children}
      </div>

      <div
        className="absolute inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-required-title"
        aria-describedby="upgrade-required-description"
      >
        <div
          style={{
            backgroundColor: '#fff',
            borderRadius: 14,
            padding: '32px 28px 28px',
            width: '100%',
            maxWidth: 360,
            boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: colorPalette.primary[50],
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <LockIcon />
          </div>

          <h2
            id="upgrade-required-title"
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: colorPalette.neutral[900],
              margin: '0 0 8px',
              lineHeight: 1.3,
            }}
          >
            Upgrade Required
          </h2>

          <p
            id="upgrade-required-description"
            style={{
              fontSize: 13.5,
              color: colorPalette.neutral[500],
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            {featureName ? (
              <>
                Upgrade your plan to access <strong style={{ color: colorPalette.neutral[700] }}>{featureName}</strong> and other premium features.
              </>
            ) : (
              'Upgrade your plan to access this premium feature.'
            )}
          </p>

          {resolvedBenefits.length > 0 && (
            <ul
              style={{
                listStyle: 'none',
                margin: '18px 0 0',
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 9,
                textAlign: 'left',
              }}
            >
              {resolvedBenefits.map(b => (
                <li
                  key={b}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    fontSize: 13,
                    color: colorPalette.neutral[600],
                    lineHeight: 1.4,
                  }}
                >
                  <span
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      background: colorPalette.primary[50],
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <CheckIcon />
                  </span>
                  {b}
                </li>
              ))}
            </ul>
          )}

          <Link to={getBillingPlansUrl()} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textDecoration: 'none', marginTop: resolvedBenefits.length > 0 ? 22 : 24 }}>
            <CustomButton type="primary" size="large" className="w-full">
              Upgrade Plan
            </CustomButton>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default UpgradeRequiredModal;
