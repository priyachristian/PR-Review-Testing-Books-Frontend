import { lazy, Suspense, useEffect, useLayoutEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createBrowserRouter, Navigate, Route, RouterProvider, Routes, useLocation } from 'react-router-dom';

// Components
import AccessFallback from '@/components/feedback/errorBoundary/AccessFallback';
import RestrictionNotice from '@/components/dataDisplay/statCard/RestrictionNotice';
import RouteErrorBoundary from '@/components/feedback/errorBoundary/RouteErrorBoundary';
import SiteMaintaince from '@/components/dataDisplay/statCard/SiteMaintaince';
import AppLayout from '@/components/layout/AppLayout';
import PrivateLayout from '@/components/layout/PrivateLayout';
import RouteWithTitle from '@/components/layout/RouteWithTitle';
import UpgradeRequiredModal from '@/components/ui/common/UpgradeRequiredModal';
import AdminRoutes from '@/routes/AdminRoutes';
import DocumentPdfPreview from '@/pages/DocumentPdfPreview';
import ShortcutsManager from '@/components/ShortcutsManager';
const DesignSystem = lazy(() => import('@/pages/DesignSystem'));

// Hooks
import { useAuth } from '@/hooks/useAuth';
import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import { useModule } from '@/hooks/useModule';
import { useProfile } from '@/features/setting/profile/useProfile';
import useRealtimeGateway from '@/hooks/useRealtimeGateway';

// Extras
import logo from '@/assets/images/ABSS-LOGO.png';
import { clearAccessDenied } from '@/features/common/commonSlice';
import { resetModuleConfig } from '@/features/common/moduleConfig/moduleConfigSlice';
import { FEATURE_MODULE_MAP, flattenPermissionModuleTree, getIsInPlanForRoutePath } from '@/utils/routePermissions';
import { RESOURCES } from '@/utils/jsonFile';
import { setGA4UserId } from '@/utils/ga4Config';
import { isPdfPreviewRoute } from '@/utils/pdfPreviewRoute';

// Component to render dynamic protected routes
const ProtectedRoutes = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, isViewOnly } = useAuth();
  const { shouldShowMaintenancePage, tokenLoading } = useMaintenanceMode();
  const accessDenied = useSelector(state => state.common?.accessDenied);
  const location = useLocation();
  const permissionModules = useSelector(state => state.module?.permissionModules);

  const accessRoles = useSelector(state => state.user?.accessRoles);
  const isAdminRole = accessRoles?.role?.toLowerCase() === 'admin';

  // While auth/permissions are still loading (e.g. on hard refresh),
  // show the same bouncing-logo loader used by Suspense instead of
  // briefly flashing AccessFallback because permission flags default to false.
  const isPermissionsLoading = tokenLoading || (isAuthenticated && !accessRoles);
  const isReportsAccessible = Object.values(accessRoles?.reportsPermissions || {}).some(p => p?.view) || isAdminRole;

  const reportPermissionKeys = Object.keys(RESOURCES.REPORT_PERMISSIONS)
    .filter(k => k !== 'parentKey')
    .map(k => RESOURCES.REPORT_PERMISSIONS[k]);

  const analyticsPermissionKeys = Object.keys(RESOURCES.ANALYTICS_PERMISSIONS)
    .filter(k => k !== 'parentKey')
    .map(k => RESOURCES.ANALYTICS_PERMISSIONS[k]);

  const isAnalyticsAccessible = Object.values(accessRoles?.analyticsPermissions || {}).some(p => p?.view) || isAdminRole;

  const flatPermissionModulePaths = useMemo(() => flattenPermissionModuleTree(permissionModules), [permissionModules]);

  useLayoutEffect(() => {
    dispatch(resetModuleConfig());
  }, [location.pathname, dispatch]);

  useEffect(() => {
    if (accessDenied?.show) {
      dispatch(clearAccessDenied());
    }
  }, [location.pathname]);

  if (shouldShowMaintenancePage && !tokenLoading) {
    return <SiteMaintaince />;
  }

  if (isPermissionsLoading) {
    return (
      <PrivateLayout>
        <AppLayout>
          <div className="flex flex-col justify-center items-center min-h-[80vh]">
            <img src={logo} alt="logo" className="w-[250px] animate-bounce" />
          </div>
        </AppLayout>
      </PrivateLayout>
    );
  }

  if (accessDenied?.show) {
    return (
      <PrivateLayout>
        <AppLayout>
          <AccessFallback
            title="Access Denied"
            description={accessDenied.message || "You don't have permission to perform this action"}
            showHomeButton={accessRoles?.permissions?.[RESOURCES?.HOME]?.view ?? true}
            onDismiss={() => dispatch(clearAccessDenied())}
          />
        </AppLayout>
      </PrivateLayout>
    );
  }

  return (
    <PrivateLayout>
      <AppLayout>
        <Suspense
          fallback={
            <div className="flex flex-col justify-center items-center min-h-[80vh]">
              <img src={logo} alt="logo" className="w-[250px] animate-bounce" />
            </div>
          }
        >
          <Routes>
            {AdminRoutes.map((data, index) => {
              const isReportPermissionRoute = reportPermissionKeys.includes(data?.moduleName);
              const isAnalyticsPermissionRoute = analyticsPermissionKeys.includes(data?.moduleName);
              let modulePermissions = isReportPermissionRoute
                ? accessRoles?.[RESOURCES.REPORT_PERMISSIONS.parentKey]?.[data?.moduleName]
                : isAnalyticsPermissionRoute
                  ? accessRoles?.[RESOURCES.ANALYTICS_PERMISSIONS.parentKey]?.[data?.moduleName]
                  : accessRoles?.permissions?.[data?.moduleName];

              modulePermissions = modulePermissions || {
                view: false,
                create: false,
                edit: false,
                delete: false,
              };

              if (!modulePermissions[data?.permission] && data?.moduleName !== RESOURCES?.SETTING && data?.moduleName !== RESOURCES?.REPORTS && data?.moduleName !== RESOURCES?.ANALYTICS) {
                return (
                  <Route
                    key={index}
                    path={data.path}
                    element={
                      <AccessFallback
                        title="Access Denied"
                        description={`You don't have permission to access the ${data?.title || 'this'} module`}
                        showHomeButton={accessRoles?.permissions?.[RESOURCES?.HOME]?.view || false}
                      />
                    }
                  />
                );
              }

              if (data?.moduleName === RESOURCES?.REPORTS && data?.path === 'reports' && !isReportsAccessible) {
                return (
                  <Route
                    key={index}
                    path={data.path}
                    element={
                      <AccessFallback
                        title="Access Denied"
                        description={`You don't have permission to access the ${data?.title || 'this'} module`}
                        showHomeButton={accessRoles?.permissions?.[RESOURCES?.HOME]?.view || false}
                      />
                    }
                  />
                );
              }

              if (data?.moduleName === RESOURCES?.ANALYTICS && data?.path === 'analytics' && !isAnalyticsAccessible) {
                return (
                  <Route
                    key={index}
                    path={data.path}
                    element={
                      <AccessFallback
                        title="Access Denied"
                        description={`You don't have permission to access the ${data?.title || 'this'} module`}
                        showHomeButton={accessRoles?.permissions?.[RESOURCES?.HOME]?.view || false}
                      />
                    }
                  />
                );
              }

              if (
                (data?.moduleName === RESOURCES?.REPORTS || data?.moduleName === RESOURCES?.ANALYTICS) &&
                data?.path !== 'reports' &&
                data?.path !== 'analytics' &&
                !modulePermissions[data?.permission]
              ) {
                return (
                  <Route
                    key={index}
                    path={data.path}
                    element={
                      <AccessFallback
                        title="Access Denied"
                        description={`You don't have permission to access the ${data?.title || 'this'} module`}
                        showHomeButton={accessRoles?.permissions?.[RESOURCES?.HOME]?.view || false}
                      />
                    }
                  />
                );
              }

              const featureKey = FEATURE_MODULE_MAP[data?.moduleName];
              const routePlan = getIsInPlanForRoutePath(data.path, flatPermissionModulePaths);
              const isFeatureBlocked = Boolean(featureKey && routePlan === false);

              if (isFeatureBlocked) {
                return (
                  <Route
                    key={index}
                    path={data.path}
                    element={
                      <UpgradeRequiredModal
                        featureKey={featureKey}
                        featureName={featureKey
                          ?.toLowerCase()
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, c => c.toUpperCase())}
                      >
                        {data.component}
                      </UpgradeRequiredModal>
                    }
                  />
                );
              }

              if (isViewOnly && data?.isAdd) {
                return (
                  <Route key={index} path={data.path} element={<RestrictionNotice status="warning" title="You cannot create new documents because your ABSS subscription payment is overdue" />} />
                );
              }

              return <Route key={index} path={data.path} element={<RouteWithTitle title={data?.title}>{data.component}</RouteWithTitle>} />;
            })}
            <Route path="/" element={<Navigate to="/home" replace />} />
          </Routes>
        </Suspense>
      </AppLayout>
    </PrivateLayout>
  );
};

const CHUNK_ERROR_KEY = 'chunkLoadErrorReloadAttempted';

/**
 * Public shell for Puppeteer / mobile WebView PDF generation.
 * Must not mount auth hooks, sockets, or ProtectedRoutes.
 */
function PdfPreviewApp() {
  const router = useMemo(
    () =>
      createBrowserRouter([
        {
          path: '/pdf-preview/document/:documentId',
          element: <DocumentPdfPreview />,
        },
        {
          path: '*',
          element: <div>PDF preview route not found</div>,
        },
      ]),
    []
  );

  return <RouterProvider router={router} />;
}

function MainApp() {
  const { companyId, checktoken, isAuthenticated, signin } = useAuth();
  const { getProfile, getActiveFeatures } = useProfile();
  const { getModuleList } = useModule();
  useRealtimeGateway();

  // Clear chunk error flag on successful load (allows auto-reload on future deployments)
  useEffect(() => {
    sessionStorage.removeItem(CHUNK_ERROR_KEY);
  }, []);

  useEffect(() => {
    setGA4UserId(isAuthenticated ? signin?.user?._id : null);
  }, [isAuthenticated, signin]);

  useEffect(() => {
    if (!isAuthenticated) {
      checktoken();
    }
  }, []);

  useEffect(() => {
    if (!companyId) return;
    getProfile({});
    getActiveFeatures({});
    getModuleList();
  }, [companyId]);

  const router = useMemo(
    () =>
      createBrowserRouter([
        {
          path: '/pdf-preview/document/:documentId',
          element: <DocumentPdfPreview />,
        },
        {
          path: '/design-system',
          element: (
            <Suspense
              fallback={
                <div className="flex flex-col justify-center items-center min-h-[80vh]">
                  <img src={logo} alt="logo" className="w-[250px] animate-bounce" />
                </div>
              }
            >
              <DesignSystem />
            </Suspense>
          ),
        },
        {
          path: '/*',
          element: <ProtectedRoutes />,
          errorElement: <RouteErrorBoundary />,
        },
      ]),
    []
  );

  return (
    <>
      <ShortcutsManager />
      <RouterProvider router={router} />
    </>
  );
}

function App() {
  return isPdfPreviewRoute() ? <PdfPreviewApp /> : <MainApp />;
}

export default App;
