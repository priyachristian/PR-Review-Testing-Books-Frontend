import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

// Components
import Toast from '@/components/ui/common/Toast';
// Hooks
import { useAuth } from 'hooks/useAuth';
import { useUser } from '@/features/setting/user/useUser';

// Extras
import { setSplitSession } from 'features/common/commonSlice';
import { SESSION_DURATION, SESSION_EXPIRES_ALERT_DURATION } from 'utils/constants';
import { setBaseCurrency } from '@/utils/currency';
import { isPdfPreviewRoute } from '@/utils/pdfPreviewRoute';

const PrivateLayout = ({ children }) => {
  const dispatch = useDispatch();
  const { getUserRole } = useUser();
  const { isAuthenticated, tokenLoading, signin } = useAuth();
  const ACCOUNT_URL = import.meta.env.VITE_ACCOUNT_URL;
  const isSplitSessionActive = useSelector(state => state.common.isSplitSessionActive);

  // Tabs share localStorage: follow a split session started or ended in another tab of this browser.
  useEffect(() => {
    const onStorage = event => {
      if (event.key === 'splitSession') dispatch(setSplitSession(Boolean(event.newValue)));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [dispatch]);

  useEffect(() => {
    if (!isSplitSessionActive) return;

    let hasWarned = false;

    const interval = setInterval(() => {
      const storedStartTime = localStorage.getItem('splitSession');
      if (!storedStartTime) {
        dispatch(setSplitSession(false));
        clearInterval(interval);
        return;
      }

      const now = Date.now();
      const startTime = parseInt(storedStartTime, 10);
      const elapsedSeconds = Math.floor((now - startTime) / 1000);
      const timeLeft = SESSION_DURATION - elapsedSeconds;

      if (timeLeft <= SESSION_EXPIRES_ALERT_DURATION && !hasWarned) {
        Toast.warning(`Your session expires in ${SESSION_EXPIRES_ALERT_DURATION} seconds`);
        hasWarned = true;
      }

      if (timeLeft <= 0) {
        localStorage.removeItem('splitSession');
        dispatch(setSplitSession(false));
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isSplitSessionActive, dispatch]);

  useEffect(() => {
    if (signin) {
      getUserRole({ userId: signin.user._id });
    }
  }, [signin, getUserRole]);

  useEffect(() => {
    if (signin?.company?.baseCurrency) {
      setBaseCurrency(signin.company.baseCurrency);
    }
  }, [signin?.company?.baseCurrency]);

  if (!isPdfPreviewRoute() && !isAuthenticated && !tokenLoading) {
    let redirectUrl = window.location.href?.split('?');
    window.location.href = `${ACCOUNT_URL}/login?redirect=${redirectUrl?.[0]}`;
  }

  return (
    <React.Fragment>
      <main>{children}</main>
    </React.Fragment>
  );
};

export default PrivateLayout;
