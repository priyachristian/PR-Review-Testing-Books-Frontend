import Icons from 'assets/icons/icon';
import { ADMIN_ROUTE_PATHS } from '@/routes/adminRoutePaths';

/** Maps each setting tab id to its dedicated route path. */
export const TAB_TO_PATH = {
  'my-profile': `/${ADMIN_ROUTE_PATHS.setting.myProfile}`,
  profile: `/${ADMIN_ROUTE_PATHS.setting.profile}`,
  users: `/${ADMIN_ROUTE_PATHS.setting.users}`,
  roles: `/${ADMIN_ROUTE_PATHS.setting.roles.root}`,
  'quotation-config': `/${ADMIN_ROUTE_PATHS.setting.quotationConfig}`,
  currencies: `/${ADMIN_ROUTE_PATHS.setting.currencies}`,
  'whatsapp-config': `/${ADMIN_ROUTE_PATHS.setting.whatsappConfig}`,
  'gst-credentials': `/${ADMIN_ROUTE_PATHS.setting.gstCredentials}`,
  'Split Config': `/${ADMIN_ROUTE_PATHS.setting.splitConfig}`,
  usage: `/${ADMIN_ROUTE_PATHS.setting.usage}`,
  'Inventory Config': `/${ADMIN_ROUTE_PATHS.setting.inventoryConfig}`,
  'Production Warehouse Config': `/${ADMIN_ROUTE_PATHS.setting.productionWarehouseConfig}`,
  automation: `/${ADMIN_ROUTE_PATHS.setting.automation}`,
  'Rejection Config': `/${ADMIN_ROUTE_PATHS.setting.rejectionConfig}`,
  'Rejection Reasons': `/${ADMIN_ROUTE_PATHS.setting.rejectionReasons}`,
  'additional-charges': `/${ADMIN_ROUTE_PATHS.setting.additionalCharges}`,
  discounts: `/${ADMIN_ROUTE_PATHS.setting.discounts}`,
  'credit-limits': `/${ADMIN_ROUTE_PATHS.setting.creditLimits}`,
  'payment-terms': `/${ADMIN_ROUTE_PATHS.setting.paymentTerms}`,
  'item-units': `/${ADMIN_ROUTE_PATHS.setting.itemUnits}`,
  'direct-taxes': `/${ADMIN_ROUTE_PATHS.setting.directTaxes}`,
  'organization-defaults': `/${ADMIN_ROUTE_PATHS.setting.organizationDefaults}`,
  notifications: `/${ADMIN_ROUTE_PATHS.setting.notifications}`,
  'email-config': `/${ADMIN_ROUTE_PATHS.setting.emailConfig}`,
  'email-preferences': `/${ADMIN_ROUTE_PATHS.setting.emailPreferences}`,
  'incentive-scheme': `/${ADMIN_ROUTE_PATHS.setting.incentiveScheme.root}`,
};

/** Maps URL path segments (under /setting/) back to tab ids. */
export const PATH_SEGMENT_TO_TAB = {
  'my-profile': 'my-profile',
  profile: 'profile',
  users: 'users',
  roles: 'roles',
  'quotation-config': 'quotation-config',
  currencies: 'currencies',
  'whatsapp-config': 'whatsapp-config',
  'gst-credentials': 'gst-credentials',
  'split-config': 'Split Config',
  usage: 'usage',
  'inventory-config': 'Inventory Config',
  'production-warehouse-config': 'Production Warehouse Config',
  automation: 'automation',
  'rejection-config': 'Rejection Config',
  'rejection-reasons': 'Rejection Reasons',
  'additional-charges': 'additional-charges',
  discounts: 'discounts',
  'credit-limits': 'credit-limits',
  'payment-terms': 'payment-terms',
  'item-units': 'item-units',
  'direct-taxes': 'direct-taxes',
  'organization-defaults': 'organization-defaults',
  notifications: 'notifications',
  'email-config': 'email-config',
  'email-preferences': 'email-preferences',
  'incentive-scheme': 'incentive-scheme',
};

/** Maps a settings item id to the subscription feature key that gates it. */
export const PLAN_GATED_SETTING_FEATURES = {
  'incentive-scheme': 'INCENTIVE',
  'Rejection Config': 'REJECTION_ORDER',
  'Rejection Reasons': 'REJECTION_ORDER',
};

export const isFeatureEnabled = value => {
  if (value == null) return true;
  if (typeof value === 'object') return value.isEnabled !== false;
  return value !== false;
};

export const getSettingItemPlanState = (itemId, ctx) => {
  const featureKey = PLAN_GATED_SETTING_FEATURES[itemId];
  if (!featureKey) return { visible: true, upgradeable: false };

  const inPlan = isFeatureEnabled(ctx?.featureInPlanMap?.[featureKey]);
  if (inPlan) return { visible: true, upgradeable: false };

  if (!ctx?.admin) return { visible: false, upgradeable: false };

  const isHardEnforced = ctx?.hardHiddenPlanFeatures?.includes(featureKey);
  if (isHardEnforced) return { visible: false, upgradeable: false };

  return { visible: true, upgradeable: true };
};

/**
 * Master list of all settings items.
 * `visible(ctx)` controls whether the item appears given the current user context.
 * `hubVisible: false` keeps the item in the sidebar but hides it from the hub cards.
 */
export const ITEM_DEFS = [
  // 1 — My account
  {
    id: 'my-profile',
    label: 'My profile',
    description: ctx => (isFeatureEnabled(ctx?.featureInPlanMap?.INCENTIVE) ? 'Your profile and incentive earnings' : 'Your profile and account details'),
    Icon: Icons.UserOutlined,
    visible: () => true,
  },

  // 2 — Organization
  { id: 'profile', label: 'Profile', description: 'Company details and basic information', Icon: Icons.BankOutlined, visible: c => c.admin },
  { id: 'currencies', label: 'Currencies', description: 'Manage supported currencies and base currency', Icon: Icons.DollarOutlined, visible: c => c.admin },
  {
    id: 'whatsapp-config',
    label: 'WhatsApp config',
    description: 'Admin WhatsApp summary notifications and schedule',
    Icon: Icons.MessageOutlined,
    visible: c => c.admin,
  },
  {
    id: 'gst-credentials',
    label: 'GST portal credentials',
    description: 'Portal login used to generate e-invoices and e-way bills',
    Icon: Icons.LockOutlined,
    visible: c => c.admin && Boolean(c.applicableFeature),
  },
  { id: 'usage', label: 'Manage subscription', description: 'Usage and subscription insights', Icon: Icons.CrownOutlined, visible: c => c.admin },

  // 3 — Users and roles
  { id: 'users', label: 'Users', description: 'Invite and manage organization users', Icon: Icons.UsergroupAddOutlined, visible: c => c.admin },
  { id: 'roles', label: 'Roles', description: 'Define roles and permissions', Icon: Icons.SafetyOutlined, visible: c => c.admin },

  // 4 — Sales
  { id: 'quotation-config', label: 'Quotation config', description: 'Defaults and options for quotations', Icon: Icons.FileTextOutlined, visible: c => c.admin },
  {
    id: 'incentive-scheme',
    label: 'Incentive schemes',
    description: 'Create budget-backed incentive schemes to reward your sales team per document type',
    Icon: Icons.TrophyOutlined,
    visible: c => c.incentive,
  },

  // 5 — Inventory
  { id: 'Inventory Config', label: 'Inventory config', description: 'Stock, warehouses, and inventory rules', Icon: Icons.BoxPlotOutlined, visible: c => c.inventory },
  {
    id: 'Production Warehouse Config',
    label: 'Production warehouse config',
    description: 'Map production departments to their material and finished goods warehouses',
    Icon: Icons.SettingOutlined,
    visible: c => c.admin || c.productionWarehouseConfig,
  },
  { id: 'Rejection Reasons', label: 'Rejections', description: 'Manage rejection reason master list', Icon: Icons.CloseCircleOutlined, visible: c => c.admin },
  {
    id: 'Rejection Config',
    label: 'Rejection config',
    description: 'Default warehouses for reuse, vendor return, and scrap recovery',
    Icon: Icons.InboxOutlined,
    visible: c => c.admin,
    hubVisible: false,
  },

  // 6 — Automation
  {
    id: 'automation',
    label: 'Automation',
    description: 'Invoice and bill Auto Pay settings',
    Icon: Icons.SyncOutlined,
    visible: c => c.admin,
  },

  // 7 — Preferences and advanced
  { id: 'Split Config', label: 'Split config', description: 'Branch and split session settings', Icon: Icons.BranchesOutlined, visible: c => c.split },
  {
    id: 'additional-charges',
    label: 'Additional charges',
    description: 'Configure charges applied to quotes, invoices, and sales orders',
    Icon: Icons.DollarOutlined,
    visible: c => c.additionalCharges,
  },
  {
    id: 'discounts',
    label: 'Discounts',
    description: 'Company-wide discount configuration',
    Icon: Icons.PercentageOutlined,
    visible: c => c.discount,
  },
  {
    id: 'credit-limits',
    label: 'Credit limits & payment terms',
    description: 'Sales and purchase credit limit and payment term defaults',
    Icon: Icons.CreditCardOutlined,
    visible: c => c.admin,
  },
  {
    id: 'payment-terms',
    label: 'Payment terms',
    description: 'Manage payment term names and due days',
    Icon: Icons.CalendarOutlined,
    visible: c => c.paymentTerms,
  },
  {
    id: 'item-units',
    label: 'Item unit',
    description: 'Manage item unit names used across inventory and documents',
    Icon: Icons.NumberOutlined,
    visible: c => c.itemUnit,
  },
  {
    id: 'direct-taxes',
    label: 'Direct taxes',
    description: 'Income tax TDS and TCS rates',
    Icon: Icons.PercentageOutlined,
    visible: c => c.directTaxes,
  },
  {
    id: 'organization-defaults',
    label: 'Organization defaults',
    description: 'Default division, branch, and warehouse',
    Icon: Icons.ApartmentOutlined,
    visible: c => c.defaultOrg,
  },

  // 7 — Notifications
  {
    id: 'notifications',
    label: 'Notifications',
    description: 'Configure notification preferences for your organization',
    Icon: Icons.NotificationOutlined,
    visible: c => c.admin,
  },
  {
    id: 'email-config',
    label: 'Email config',
    description: 'Configure email server and templates for your organization',
    Icon: Icons.MailOutlined,
    visible: c => c.admin,
  },
  {
    id: 'email-preferences',
    label: 'Email and Whatsapp preferences',
    description: 'Configure email and whatsapp preferences for your organization',
    Icon: Icons.MailOutlined,
    visible: c => c.admin,
  },
];

/** Grouped sections for the hub and sidebar. */
export const SECTIONS = [
  {
    id: 'my_account',
    label: 'My account',
    Icon: Icons.UserOutlined,
    itemIds: ['my-profile'],
  },
  {
    id: 'organization',
    label: 'Organization',
    Icon: Icons.BankOutlined,
    itemIds: ['profile', 'currencies', 'whatsapp-config', 'gst-credentials', 'usage'],
  },
  {
    id: 'users_roles',
    label: 'Users and roles',
    Icon: Icons.TeamOutlined,
    itemIds: ['users', 'roles'],
  },
  {
    id: 'sales',
    label: 'Sales',
    Icon: Icons.ShoppingOutlined,
    itemIds: ['quotation-config', 'incentive-scheme'],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    Icon: Icons.InboxOutlined,
    itemIds: ['Inventory Config', 'Production Warehouse Config', 'Rejection Reasons', 'Rejection Config'],
  },
  {
    id: 'automation',
    label: 'Automation',
    Icon: Icons.SyncOutlined,
    itemIds: ['automation'],
  },
  {
    id: 'Setup and Configuration',
    label: 'Setup and Configuration',
    Icon: Icons.SettingOutlined,
    itemIds: ['Split Config', 'additional-charges', 'discounts', 'credit-limits', 'payment-terms', 'item-units', 'organization-defaults'],
  },
  {
    id: 'taxes_compliance',
    label: 'Taxes & Compliance',
    Icon: Icons.AuditOutlined,
    itemIds: ['direct-taxes'],
  },
  {
    id: 'Preferences and advance',
    label: 'Preferences and advance',
    Icon: Icons.NotificationOutlined,
    itemIds: ['notifications', 'email-config', 'email-preferences'],
  },
];
