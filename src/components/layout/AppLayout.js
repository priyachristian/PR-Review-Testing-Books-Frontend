import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';

// Components
import AnalyticsHeader from './AnalyticsHeader';
import SettingsHeader from './SettingsHeader';
import AppHeader from './Header';
import AppSidebar from './Sidebar';
import NotFound from '@/components/dataDisplay/emptyState/NotFound';
import { FullscreenExitOutlined } from '@ant-design/icons';
import { Layout } from '@/components/AntDComponent';
import ScrollToTopButton from '../ui/common/ScrollToTopButton ';
import AdminRoutes from 'routes/AdminRoutes';

// Hooks
import { useAuth } from '@/hooks/useAuth';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import MaintenanceCountdownTimer from '@/components/ui/common/MaintenanceCountdownTimer';
import useScrollToTop from '@/hooks/useScrollToTop';
import { useGlobalBlocker } from '../../hooks/useGlobalBlocker';
import { useSidebar } from 'hooks/useSidebar';
import { onMessage } from 'firebase/messaging';
import { getFirebaseMessaging } from '@/utils/firebaseConfig';
import { useDevice } from '@/features/device/useDevice';
import { notificationSliceMethods } from '@/features/notifications/notification.slice';
import { listenForPermissionChange } from '@/utils/notificationPermission';
import { getRealtimeSocket, onRealtimeSocketChange } from '@/hooks/realtimeSocket';

// Extras
import logo from '@/assets/images/ABSS-LOGO.png';

const { Content } = Layout;
const SIDEBAR_KEY = 'abss_sidebar_collapsed_v1';
const MAINTENANCE_BANNER_HEIGHT = 36;
const SETTINGS_HEADER_HEIGHT = 57;

const AppLayout = ({ children }) => {
  useScrollToTop();
  useGlobalBlocker();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { registerDeviceToken } = useDevice();
  const { sideloading, getSidebar } = useSidebar();
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const { companyId, isViewOnly, setIsViewOnly } = useAuth();
  const { isCountdownActive } = useMaintenanceMode();
  const [socketBannerMessage, setSocketBannerMessage] = useState(null);
  const bannerHeight = socketBannerMessage ? 40 : 0;
  const viewOnlyBannerHeight = 48;
  const maintenanceBannerHeight = isMobile && isCountdownActive ? MAINTENANCE_BANNER_HEIGHT : 0;
  const totalBannerHeight = bannerHeight + (isViewOnly ? viewOnlyBannerHeight : 0) + maintenanceBannerHeight;
  const [collapsed, setCollapsedState] = useState(() => {
    try {
      const raw = localStorage.getItem(SIDEBAR_KEY);
      return raw === null ? false : JSON.parse(raw);
    } catch (error) {
      console.warn('read sidebar state failed', error);
      return false;
    }
  });
  const setCollapsed = useCallback((value, { persist = true } = {}) => {
    try {
      setCollapsedState(value);
      if (persist) localStorage.setItem(SIDEBAR_KEY, JSON.stringify(value));
    } catch (error) {
      console.warn('persist sidebar state failed', error);
    }
  }, []);
  const toggleSidebar = () => setCollapsed(!collapsed);
  const [focusMode, setFocusMode] = useState(false);
  useEffect(() => {
    if (!focusMode) return undefined;
    const onKeyDown = e => {
      if (e.key === 'Escape') setFocusMode(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [focusMode]);
  useEffect(() => {
    const raf = requestAnimationFrame(() => window.dispatchEvent(new Event('resize')));
    const timeout = setTimeout(() => window.dispatchEvent(new Event('resize')), 320);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeout);
    };
  }, [focusMode]);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!companyId) return;
    getSidebar();
    registerDeviceToken();
    dispatch(notificationSliceMethods.initNotificationSync());
  }, [companyId]);

  useEffect(() => {
    const cleanupPermissionListener = listenForPermissionChange(() => {
      dispatch(notificationSliceMethods.refreshSystemPermissionStatus());
    });

    return () => {
      cleanupPermissionListener();
    };
  }, []);

  useEffect(() => {
    let unsubscribe = null;
    let mounted = true;

    getFirebaseMessaging().then(messaging => {
      if (!mounted || !messaging) return;

      unsubscribe = onMessage(messaging, payload => {
        const { orderId, icon, title, body } = payload?.data ?? {};

        const clickAction = orderId ? `${window.location.origin}/customer-orders/${orderId}` : window.location.origin;

        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(title, {
            body,
            icon: icon || '/AppIcon.png',
            tag: orderId ? `order-${orderId}` : `notif-${title}-${body}`.slice(0, 64),
            renotify: false,
            data: { clickAction },
          });
        });
      });
    });

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handler = event => {
      if (event.data?.type === 'SW_NAVIGATE' && event.data?.url) {
        const path = new URL(event.data.url).pathname;
        navigate(path);
      }
    };

    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, [navigate]);

  useEffect(() => {
    const attach = socket => {
      if (!socket) return undefined;

      const handleSubscription = payload => {
        if (payload?.message) {
          setSocketBannerMessage(payload.message);
        }

        if (!payload?.canLoggedIn && payload?.status === 'inactive') {
          window.location.href = import.meta.env.VITE_ACCOUNT_URL;
        } else if (payload?.canLoggedIn && payload?.status === 'inactive') {
          setIsViewOnly(true);
        } else if (payload?.canLoggedIn && payload?.status !== 'inactive') {
          setIsViewOnly(false);
        }
      };

      const handleAppName = payload => {
        if (payload?.platform === 'WEB') {
          setSocketBannerMessage(payload);
        }
      };

      socket.on('SUBSCRIPTION', handleSubscription);
      socket.on('APP_NAME', handleAppName);

      return () => {
        socket.off('SUBSCRIPTION', handleSubscription);
        socket.off('APP_NAME', handleAppName);
      };
    };

    let detach = attach(getRealtimeSocket());
    const unsubscribe = onRealtimeSocketChange(socket => {
      detach?.();
      detach = attach(socket);
    });

    return () => {
      detach?.();
      unsubscribe();
    };
  }, [setIsViewOnly]);

  useEffect(() => {
    const topOffset = isViewOnly ? viewOnlyBannerHeight : 0;
    document.documentElement.style.setProperty('--app-top-offset', `${topOffset}px`);
    return () => document.documentElement.style.removeProperty('--app-top-offset');
  }, [isViewOnly, viewOnlyBannerHeight]);

  useEffect(() => {
    // if (isMobile) setCollapsed(true);
    if (isMobile) {
      setCollapsed(true, { persist: false });
    }
  }, [isMobile]);

  let routeExists = AdminRoutes?.filter(x => {
    if (x?.path === 'setting/*') {
      return location.pathname === '/setting' || location.pathname.startsWith('/setting/');
    }

    let path = x?.path?.split('/');
    let currentPath = location?.pathname?.slice(1)?.split('/');
    if (path?.[0] === currentPath?.[0] && path?.length === currentPath?.length) {
      return x;
    }
  });

  if (routeExists?.length <= 0 && location?.pathname !== '/') {
    return <NotFound />;
  }

  const hideLayout = location.pathname.startsWith('/analytics');
  const hideLayoutCompletely = location.pathname === '/setting' || location.pathname.startsWith('/setting/');
  const isAddOrEditPage = /\/new$|\/edit/.test(location.pathname);
  const viewOnlyBanner = isViewOnly ? (
    <div
      className="w-full flex items-center justify-center px-4 py-2 text-base font-bold"
      style={{
        position: 'fixed',
        top: bannerHeight,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: '#fee2e2',
        color: '#00000',
        height: viewOnlyBannerHeight,
      }}
    >
      <span className="flex-1 text-center">You cannot create new documents because your ABSS subscription payment is overdue</span>
    </div>
  ) : null;

  if (hideLayoutCompletely) {
    return (
      <>
        {viewOnlyBanner}
        <Layout>
          <SettingsHeader />
          <Content
            className="p-4"
            style={{
              marginTop: `calc(${SETTINGS_HEADER_HEIGHT}px + var(--app-top-offset, 0px))`,
              height: `calc(100vh - ${SETTINGS_HEADER_HEIGHT}px - var(--app-top-offset, 0px))`,
              overflow: 'hidden',
              backgroundColor: '#f9fafb',
            }}
          >
            {children}
          </Content>
        </Layout>
      </>
    );
  }

  if (hideLayout)
    return (
      <>
        {sideloading ? (
          <div className="flex justify-center items-center h-screen">
            <img src={logo} alt="logo" className="w-[300px]" />
          </div>
        ) : (
          <Layout>
            <AnalyticsHeader />
            <Content
              className="p-4"
              style={{
                minHeight: 'calc(100vh - 64px)',
                backgroundColor: '#f9fafb',
              }}
            >
              {children}
              <ScrollToTopButton />
            </Content>
          </Layout>
        )}
      </>
    );
  const SIDEBAR_WIDTH = 220;
  const SIDEBAR_COLLAPSED = 64;

  return (
    <div className="min-h-screen">
      {sideloading ? (
        <div className="flex justify-center items-center h-screen">
          <img src={logo} alt="logo" className="w-[300px]" />
        </div>
      ) : (
        <>
          {!focusMode && <AppSidebar collapsed={collapsed} setCollapsed={setCollapsed} isMobile={isMobile} bannerHeight={totalBannerHeight} />}

          <Layout
            className="transition-all duration-300"
            style={{
              marginLeft: focusMode ? 0 : isMobile ? 0 : collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH,
              ['--app-header-offset']: totalBannerHeight,
              ['--app-header-height']: 56,
              ['--sidebar-width']: focusMode ? '0px' : undefined,
            }}
          >
            {/* Socket Banner Message */}
            {socketBannerMessage && (
              <div
                className="w-full flex items-center justify-center px-4 py-2 text-sm font-semibold"
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  zIndex: 9999,
                  backgroundColor: '#fff7e6',
                  borderBottom: '1px solid #ffd591',
                  color: '#7c3b00',
                  height: 40,
                }}
              >
                <span className="flex-1 text-center">
                  {typeof socketBannerMessage === 'object' ? (
                    <>
                      {socketBannerMessage.releaseNotes ? `${socketBannerMessage.releaseNotes}` : ''}
                      <button
                        onClick={() => window.location.reload()}
                        style={{
                          background: 'var(--primary-500)',
                          border: '1px solid var(--primary-500)',
                          cursor: 'pointer',
                          color: '#fff',
                          fontWeight: 500,
                          fontSize: '12px',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          marginLeft: '10px',
                        }}
                      >
                        Refresh
                      </button>
                    </>
                  ) : (
                    socketBannerMessage
                  )}
                </span>
              </div>
            )}
            {/* Maintenance countdown banner (mobile only) */}
            {maintenanceBannerHeight > 0 && (
              <div
                className="md:hidden w-full"
                style={{
                  position: 'fixed',
                  top: bannerHeight + (isViewOnly ? viewOnlyBannerHeight : 0),
                  left: 0,
                  right: 0,
                  zIndex: 9998,
                  height: MAINTENANCE_BANNER_HEIGHT,
                }}
              >
                <MaintenanceCountdownTimer variant="banner" />
              </div>
            )}
            {/* View-only banner: above Header, below socket banner */}
            {viewOnlyBanner}

            {/* Push Header below fixed banners */}
            {!focusMode && (
              <div style={{ marginTop: totalBannerHeight }}>
                <AppHeader
                  collapsed={collapsed}
                  toggleSidebar={toggleSidebar}
                  isMobile={isMobile}
                  sidebarWidth={collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH}
                  topOffset={totalBannerHeight}
                  tooltipPlacement={totalBannerHeight > 0 ? 'bottom' : undefined}
                  onEnterFocusMode={() => setFocusMode(true)}
                />
              </div>
            )}

            <Content
              className={`p-4 ${isAddOrEditPage ? 'content-no-pt' : ''}`}
              style={{
                marginTop: focusMode ? 0 : 56,
                minHeight: focusMode ? '100vh' : 'calc(100vh - 64px)',
                backgroundColor: '#f9fafb',
              }}
            >
              {children}
              <ScrollToTopButton />
            </Content>
          </Layout>

          {focusMode && (
            <button
              type="button"
              onClick={() => setFocusMode(false)}
              title="Exit full screen (Esc)"
              aria-label="Exit full screen"
              className="fixed left-1/2 top-2 z-[1000] inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-md transition-all hover:text-gray-900 hover:shadow-lg"
            >
              <FullscreenExitOutlined />
              <span>Exit full screen</span>
            </button>
          )}

          {/* Overlay for mobile when sidebar open */}
          {isMobile && !collapsed && (
            <div
              role="button"
              tabIndex={0}
              className="fixed inset-0 bg-black bg-opacity-40 z-40"
              onClick={() => setCollapsed(true)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') setCollapsed(true);
              }}
            />
          )}
        </>
      )}
    </div>
  );
};

export default AppLayout;
