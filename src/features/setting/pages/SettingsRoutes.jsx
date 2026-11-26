import { lazy, Suspense, useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';

import NotFound from '@/components/dataDisplay/emptyState/NotFound';
import RestrictionNotice from '@/components/dataDisplay/statCard/RestrictionNotice';
import RouteWithTitle from '@/components/layout/RouteWithTitle';
import { useAuth } from '@/hooks/useAuth';
import { useModule } from '@/hooks/useModule';
import { useUser } from '@/features/setting/user/useUser';
import SettingsLayout from './SettingsLayout';
import { PLAN_GATED_SETTING_FEATURES, getSettingItemPlanState } from './settingNavConfig';
import logo from '@/assets/images/ABSS-LOGO.png';

const SettingsPage = lazy(() => import('./SettingsPage'));
const MyProfilePage = lazy(() => import('@/features/setting/myProfile/pages/MyProfilePage'));
const ProfilePage = lazy(() => import('@/features/setting/user/pages/ProfilePage'));
const UsersPage = lazy(() => import('@/features/setting/user/pages/UsersPage'));
const RolesPage = lazy(() => import('@/features/setting/role/pages/RolesPage'));
const AddEditRolePage = lazy(() => import('@/features/setting/role/pages/AddEditRolePage'));
const CurrenciesPage = lazy(() => import('@/features/setting/currency/pages/CurrenciesPage'));
const WhatsappConfigPage = lazy(() => import('@/features/setting/whatsappConfig/pages/WhatsappConfigPage'));
const GstCredentialsPage = lazy(() => import('@/features/setting/gstCredentials/pages/GstCredentialsPage'));
const QuotationConfigPage = lazy(() => import('@/features/setting/quotationConfig/pages/QuotationConfigPage'));
const SplitConfigPage = lazy(() => import('@/features/setting/splitConfig/pages/SplitConfigPage'));
const UsagePage = lazy(() => import('@/features/setting/usage/pages/UsagePage'));
const InventoryConfigPage = lazy(() => import('@/features/setting/inventoryConfig/pages/InventoryConfigPage'));
const ProductionWarehouseConfigPage = lazy(() => import('@/features/setting/productionWarehouseConfig/pages/ViewProductionWarehouseConfigPage'));
const AutomationPage = lazy(() => import('@/features/setting/automation/pages/AutomationPage'));
const RejectionConfigPage = lazy(() => import('@/features/setting/rejectionConfig/pages/RejectionConfigPage'));
const RejectionReasonPage = lazy(() => import('@/features/setting/rejectionReason/pages/RejectionReasonPage'));
const ViewAdditionalChargesConfiguration = lazy(() => import('@/features/setting/otherSettings/pages/ViewAdditionalChargesConfiguration'));
const ViewDiscountConfiguration = lazy(() => import('@/features/setting/otherSettings/pages/ViewDiscountConfiguration'));
const ViewCreditLimitConfiguration = lazy(() => import('@/features/setting/otherSettings/pages/ViewCreditLimitConfiguration'));
const PaymentTermsPage = lazy(() => import('@/features/setting/paymentTerm/pages/PaymentTermsPage'));
const ItemUnitsPage = lazy(() => import('@/features/setting/itemUnit/pages/ItemUnitsPage'));
const DirectTaxesPage = lazy(() => import('@/features/setting/directTax/pages/DirectTaxesPage'));
const ViewDefaultOrganizationConfiguration = lazy(() => import('@/features/setting/otherSettings/pages/ViewDefaultOrganizationConfiguration'));
const ViewNotificationManagement = lazy(() => import('@/features/setting/otherSettings/pages/ViewNotificationManagement'));
const ViewEmailPrefrences = lazy(() => import('@/features/setting/emailPrefrences/pages/ViewEmailPrefrences'));
const ViewEmailConfig = lazy(() => import('@/features/setting/emailConfig/pages/ViewEmailConfig'));
const ViewIncentiveSchemes = lazy(() => import('@/features/setting/incentiveScheme/pages/ViewIncentiveSchemes'));
const AddIncentiveScheme = lazy(() => import('@/features/setting/incentiveScheme/pages/AddIncentiveScheme'));
const IncentiveSchemeDetail = lazy(() => import('@/features/setting/incentiveScheme/pages/IncentiveSchemeDetail'));
const UserIncentiveSchemeDetail = lazy(() => import('@/features/setting/incentiveScheme/pages/UserIncentiveSchemeDetail'));
const UpgradeRequiredModal = lazy(() => import('@/components/ui/common/UpgradeRequiredModal'));

const SettingsContentFallback = () => (
  <div className="flex flex-col justify-center items-center min-h-[calc(100vh-57px-2rem)]">
    <img src={logo} alt="logo" className="w-[200px] animate-bounce" />
  </div>
);

const SettingsRoutes = () => {
  const { isViewOnly } = useAuth();
  const { featureInPlanMap, hardHiddenPlanFeatures, getSettingsFeaturePlan } = useModule();
  const { accessRoles } = useUser();
  const isAdmin = accessRoles?.role?.toLowerCase() === 'admin';

  useEffect(() => {
    getSettingsFeaturePlan();
  }, [getSettingsFeaturePlan]);

  const addEditRoleElement = title =>
    isViewOnly ? (
      <RestrictionNotice status="warning" title="You cannot create new documents because your ABSS subscription payment is overdue" />
    ) : (
      <RouteWithTitle title={title}>
        <AddEditRolePage />
      </RouteWithTitle>
    );

  const withUpgradeGuard = (itemId, element) => {
    const { visible, upgradeable } = getSettingItemPlanState(itemId, { admin: isAdmin, featureInPlanMap, hardHiddenPlanFeatures });

    if (!visible) {
      return <RestrictionNotice status="warning" title="This feature isn't available on your current plan." />;
    }

    if (!upgradeable) return element;

    const featureKey = PLAN_GATED_SETTING_FEATURES[itemId];
    return (
      <UpgradeRequiredModal
        featureKey={featureKey}
        featureName={featureKey
          .toLowerCase()
          .replace(/_/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase())}
      >
        {element}
      </UpgradeRequiredModal>
    );
  };

  return (
    <SettingsLayout>
      <Suspense fallback={<SettingsContentFallback />}>
        <Routes>
          <Route
            index
            element={
              <RouteWithTitle title="Settings">
                <SettingsPage />
              </RouteWithTitle>
            }
          />
          <Route
            path="my-profile"
            element={
              <RouteWithTitle title="My Profile | Settings">
                <MyProfilePage />
              </RouteWithTitle>
            }
          />
          <Route
            path="profile"
            element={
              <RouteWithTitle title="Profile | Settings">
                <ProfilePage />
              </RouteWithTitle>
            }
          />
          <Route
            path="users"
            element={
              <RouteWithTitle title="Users | Settings">
                <UsersPage />
              </RouteWithTitle>
            }
          />
          <Route
            path="roles"
            element={
              <RouteWithTitle title="Roles | Settings">
                <RolesPage />
              </RouteWithTitle>
            }
          />
          <Route path="roles/new" element={addEditRoleElement('Add Role | Settings')} />
          <Route path="roles/:roleId/edit" element={addEditRoleElement('Edit Role | Settings')} />
          <Route
            path="currencies"
            element={
              <RouteWithTitle title="Currencies | Settings">
                <CurrenciesPage />
              </RouteWithTitle>
            }
          />
          <Route
            path="whatsapp-config"
            element={
              <RouteWithTitle title="WhatsApp Config | Settings">
                <WhatsappConfigPage />
              </RouteWithTitle>
            }
          />
          <Route
            path="gst-credentials"
            element={
              <RouteWithTitle title="GST Portal Credentials | Settings">
                <GstCredentialsPage />
              </RouteWithTitle>
            }
          />
          <Route
            path="quotation-config"
            element={
              <RouteWithTitle title="Quotation Config | Settings">
                <QuotationConfigPage />
              </RouteWithTitle>
            }
          />
          <Route
            path="split-config"
            element={
              <RouteWithTitle title="Split Config | Settings">
                <SplitConfigPage />
              </RouteWithTitle>
            }
          />
          <Route
            path="usage"
            element={
              <RouteWithTitle title="Usage | Settings">
                <UsagePage />
              </RouteWithTitle>
            }
          />
          <Route
            path="inventory-config"
            element={
              <RouteWithTitle title="Inventory Config | Settings">
                <InventoryConfigPage />
              </RouteWithTitle>
            }
          />
          <Route
            path="production-warehouse-config"
            element={
              <RouteWithTitle title="Production Warehouse Config | Settings">
                <ProductionWarehouseConfigPage />
              </RouteWithTitle>
            }
          />
          <Route
            path="automation"
            element={
              <RouteWithTitle title="Automation | Settings">
                <AutomationPage />
              </RouteWithTitle>
            }
          />
          <Route
            path="rejection-config"
            element={withUpgradeGuard(
              'Rejection Config',
              <RouteWithTitle title="Rejection Config | Settings">
                <RejectionConfigPage />
              </RouteWithTitle>
            )}
          />
          <Route
            path="rejection-reasons"
            element={withUpgradeGuard(
              'Rejection Reasons',
              <RouteWithTitle title="Rejection Reasons | Settings">
                <RejectionReasonPage />
              </RouteWithTitle>
            )}
          />
          <Route
            path="additional-charges"
            element={
              <RouteWithTitle title="Additional Charges | Settings">
                <ViewAdditionalChargesConfiguration />
              </RouteWithTitle>
            }
          />
          <Route
            path="discounts"
            element={
              <RouteWithTitle title="Discounts | Settings">
                <ViewDiscountConfiguration />
              </RouteWithTitle>
            }
          />
          <Route
            path="credit-limits"
            element={
              <RouteWithTitle title="Credit Limits & Payment Terms | Settings">
                <ViewCreditLimitConfiguration />
              </RouteWithTitle>
            }
          />
          <Route
            path="payment-terms"
            element={
              <RouteWithTitle title="Payment Terms | Settings">
                <PaymentTermsPage />
              </RouteWithTitle>
            }
          />
          <Route
            path="item-units"
            element={
              <RouteWithTitle title="Item Unit | Settings">
                <ItemUnitsPage />
              </RouteWithTitle>
            }
          />
          <Route
            path="direct-taxes"
            element={
              <RouteWithTitle title="Direct Taxes | Settings">
                <DirectTaxesPage />
              </RouteWithTitle>
            }
          />
          <Route
            path="organization-defaults"
            element={
              <RouteWithTitle title="Organization Defaults | Settings">
                <ViewDefaultOrganizationConfiguration />
              </RouteWithTitle>
            }
          />
          <Route
            path="notifications"
            element={
              <RouteWithTitle title="Notifications | Settings">
                <ViewNotificationManagement />
              </RouteWithTitle>
            }
          />
          <Route
            path="email-config"
            element={
              <RouteWithTitle title="Email Config | Settings">
                <ViewEmailConfig />
              </RouteWithTitle>
            }
          />
          <Route
            path="email-preferences"
            element={
              <RouteWithTitle title="Email and Whatsapp Preferences | Settings">
                <ViewEmailPrefrences />
              </RouteWithTitle>
            }
          />
          <Route
            path="incentive-scheme"
            element={withUpgradeGuard(
              'incentive-scheme',
              <RouteWithTitle title="Incentive Schemes | Settings">
                <ViewIncentiveSchemes />
              </RouteWithTitle>
            )}
          />
          <Route
            path="incentive-scheme/new"
            element={withUpgradeGuard(
              'incentive-scheme',
              <RouteWithTitle title="Add | Incentive Schemes | Settings">
                <AddIncentiveScheme />
              </RouteWithTitle>
            )}
          />
          <Route
            path="incentive-scheme/user/:userId"
            element={withUpgradeGuard(
              'incentive-scheme',
              <RouteWithTitle title="User Incentive | Incentive Schemes | Settings">
                <UserIncentiveSchemeDetail />
              </RouteWithTitle>
            )}
          />
          <Route
            path="incentive-scheme/:incentiveSchemeId/edit"
            element={withUpgradeGuard(
              'incentive-scheme',
              <RouteWithTitle title="Edit | Incentive Schemes | Settings">
                <AddIncentiveScheme />
              </RouteWithTitle>
            )}
          />
          <Route
            path="incentive-scheme/:incentiveSchemeId"
            element={withUpgradeGuard(
              'incentive-scheme',
              <RouteWithTitle title="Detail | Incentive Schemes | Settings">
                <IncentiveSchemeDetail />
              </RouteWithTitle>
            )}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </SettingsLayout>
  );
};

export default SettingsRoutes;
