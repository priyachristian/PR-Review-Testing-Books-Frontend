import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Menu } from '@/components/AntDComponent';
import { useTheme } from '@/components/ui/common/ThemeProvider';
import useModulePermissions from 'hooks/useModulePermissions';
import { useModule } from '@/hooks/useModule';
import { useAuth } from 'hooks/useAuth';
import { useUser } from '@/features/setting/user/useUser';
import { RESOURCES } from '@/utils/jsonFile';
import { colorPalette } from '@/utils/theme';
import { TAB_TO_PATH, PATH_SEGMENT_TO_TAB, ITEM_DEFS, SECTIONS, getSettingItemPlanState } from './settingNavConfig';

const SIDER_WIDTH = 219;

function buildItemById(ctx) {
  const map = {};
  for (const d of ITEM_DEFS) {
    const isMyProfile = d.id === 'my-profile';
    if (!isMyProfile && !d.visible(ctx)) continue;
    if (!isMyProfile && !getSettingItemPlanState(d.id, ctx).visible) continue;
    map[d.id] = { id: d.id, label: d.label, icon: React.createElement(d.Icon) };
  }
  return map;
}

function sectionForTab(tabId) {
  return SECTIONS.find(s => s.itemIds.includes(tabId))?.id;
}

function menuItemsFrom(itemById) {
  return SECTIONS.map(section => {
    const children = section.itemIds
      .map(id => itemById[id])
      .filter(Boolean)
      .map(item => ({ key: item.id, icon: item.icon, label: item.label }));
    if (!children.length) return null;
    return { key: section.id, label: section.label, children };
  }).filter(Boolean);
}

function nextAccordionSection(keys, prevOpenSectionId) {
  const sectionIds = SECTIONS.map(s => s.id);
  const open = keys.filter(k => sectionIds.includes(k));
  const justOpened = open.find(k => k !== prevOpenSectionId);
  if (justOpened) return justOpened;
  if (!open.length) return null;
  return open[open.length - 1];
}

function sidebarMenuStyles(isDarkMode, primary) {
  return `
    .settings-module-sider .ant-menu-light .ant-menu-item,
    .settings-module-sider .ant-menu-light .ant-menu-submenu-title {
      height: 36px !important;
      line-height: 36px !important;
      padding-top: 0 !important;
      padding-bottom: 0 !important;
      color: ${isDarkMode ? '#d1d5db' : '#374151'} !important;
      font-weight: 500 !important;
      font-size: 13.5px !important;
      border-radius: 6px !important;
      margin: 1px 6px !important;
      width: calc(100% - 12px) !important;
    }
    .settings-module-sider .ant-menu-light .ant-menu-item-selected {
      background-color: ${primary} !important;
      color: #ffffff !important;
      font-weight: 600 !important;
    }
    .settings-module-sider .ant-menu-light .ant-menu-item:not(.ant-menu-item-selected):hover,
    .settings-module-sider .ant-menu-light .ant-menu-submenu-title:not(.ant-menu-submenu-selected > .ant-menu-submenu-title):hover {
      background-color: ${isDarkMode ? '#374151' : `${primary}18`} !important;
      color: ${isDarkMode ? '#ffffff' : primary} !important;
    }
    .settings-module-sider .ant-menu-light .ant-menu-item-selected:hover {
      background-color: ${primary} !important;
      color: #ffffff !important;
    }
    .settings-module-sider .ant-menu-light .ant-menu-submenu-selected > .ant-menu-submenu-title {
      color: ${isDarkMode ? '#ffffff' : primary} !important;
      background-color: ${isDarkMode ? '#374151' : `${primary}12`} !important;
      font-weight: 600 !important;
    }
    .settings-module-sider .ant-menu-light .ant-menu-submenu-selected > .ant-menu-submenu-title:hover {
      color: ${isDarkMode ? '#ffffff' : primary} !important;
      background-color: ${isDarkMode ? '#374151' : `${primary}12`} !important;
    }
    .settings-module-sider .ant-menu-light .ant-menu-item .ant-menu-title-content,
    .settings-module-sider .ant-menu-light .ant-menu-submenu-title .ant-menu-title-content {
      font-weight: inherit !important;
    }
    .settings-module-sider .ant-menu-light .ant-menu-item-selected .anticon {
      color: #ffffff !important;
    }
  `;
}

const SettingsLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useTheme();
  const primary = colorPalette.primary[500];

  const { accessRoles } = useUser();
  const { useInventoryConfig } = useModulePermissions(RESOURCES.INVENTORY_CONFIG);
  const { useSplitConfig } = useModulePermissions(RESOURCES.OTHER_SETTINGS.splitConfig);
  const { useAdditionalChargesConfig } = useModulePermissions(RESOURCES.OTHER_SETTINGS.additionalChargesConfig);
  const { useDefaultOrganizationConfig } = useModulePermissions(RESOURCES.OTHER_SETTINGS.defaultOrganizationConfig);
  const { useDiscountConfig } = useModulePermissions(RESOURCES.OTHER_SETTINGS.discountConfig);
  const { useIncentiveConfig } = useModulePermissions(RESOURCES.OTHER_SETTINGS.incentive);
  const { usePaymentTerms } = useModulePermissions(RESOURCES.OTHER_SETTINGS.paymentTerms);
  const { useItemUnits } = useModulePermissions(RESOURCES.OTHER_SETTINGS.itemUnit);
  const { useProductionWarehouseConfig } = useModulePermissions(RESOURCES.OTHER_SETTINGS.productionWarehouseConfig);
  const { useDirectTaxes } = useModulePermissions(RESOURCES.OTHER_SETTINGS.directTaxes);
  const { featureInPlanMap, hardHiddenPlanFeatures } = useModule();

  const { signin } = useAuth();

  const ctx = useMemo(
    () => ({
      admin: accessRoles?.role?.toLowerCase() === 'admin',
      split: Boolean(useSplitConfig?.view),
      inventory: Boolean(useInventoryConfig?.canView),
      additionalCharges: Boolean(useAdditionalChargesConfig?.view || accessRoles?.role?.toLowerCase() === 'admin'),
      defaultOrg: Boolean(useDefaultOrganizationConfig?.view || accessRoles?.role?.toLowerCase() === 'admin'),
      discount: Boolean(useDiscountConfig?.view || accessRoles?.role?.toLowerCase() === 'admin'),
      incentive: Boolean(useIncentiveConfig?.view || accessRoles?.role?.toLowerCase() === 'admin'),
      paymentTerms: Boolean(usePaymentTerms?.view || accessRoles?.role?.toLowerCase() === 'admin'),
      itemUnit: Boolean(useItemUnits?.view || accessRoles?.role?.toLowerCase() === 'admin'),
      productionWarehouseConfig: Boolean(useProductionWarehouseConfig?.view || accessRoles?.role?.toLowerCase() === 'admin'),
      directTaxes: Boolean(useDirectTaxes?.view || accessRoles?.role?.toLowerCase() === 'admin'),
      applicableFeature: signin?.company?.applicableFeature,
      featureInPlanMap,
      hardHiddenPlanFeatures,
    }),
    [
      accessRoles?.role,
      useSplitConfig?.view,
      useInventoryConfig?.canView,
      useAdditionalChargesConfig?.view,
      useDefaultOrganizationConfig?.view,
      useDiscountConfig?.view,
      useIncentiveConfig?.view,
      usePaymentTerms?.view,
      useItemUnits?.view,
      useProductionWarehouseConfig?.view,
      useDirectTaxes?.view,
      signin?.company?.applicableFeature,
      featureInPlanMap,
      hardHiddenPlanFeatures,
    ]
  );

  const itemById = useMemo(() => buildItemById(ctx), [ctx]);
  const menuItems = useMemo(() => menuItemsFrom(itemById), [itemById]);

  const activeTab = useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean);
    const settingSegment = segments[1];
    return PATH_SEGMENT_TO_TAB[settingSegment] || null;
  }, [location.pathname]);

  const isHub = location.pathname === '/setting';

  const [openSectionId, setOpenSectionId] = useState(() => {
    if (isHub) return null;
    return sectionForTab(activeTab) ?? null;
  });

  useEffect(() => {
    if (isHub) {
      setOpenSectionId(null);
    } else if (activeTab) {
      const sid = sectionForTab(activeTab);
      if (sid) setOpenSectionId(sid);
    }
  }, [isHub, activeTab]);

  const handleSelectTab = tabId => {
    const path = TAB_TO_PATH[tabId];
    if (!path) return;

    const hashIndex = path.indexOf('#');
    if (hashIndex !== -1) {
      const pathname = path.slice(0, hashIndex);
      const hash = path.slice(hashIndex + 1);
      if (location.pathname === pathname) {
        navigate({ pathname, hash: `#${hash}` });
        window.setTimeout(() => {
          document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
        return;
      }
    }

    navigate(path);
  };

  const shell = {
    backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
    borderRight: `1px solid ${isDarkMode ? '#333333' : '#e5e7eb'}`,
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  };

  return (
    <div className="flex bg-white -m-4 overflow-hidden" style={{ height: 'calc(100vh - 57px - var(--app-top-offset, 0px))', maxHeight: 'calc(100vh - 57px - var(--app-top-offset, 0px))' }}>
      <div
        className="settings-module-sider fixed left-0 z-40 flex flex-col box-content custom-scrollbar overflow-x-hidden custom-sidebar transition-all duration-300"
        style={{ ...shell, width: SIDER_WIDTH, top: 'calc(57px + var(--app-top-offset, 0px))', height: 'calc(100vh - 57px - var(--app-top-offset, 0px))' }}
      >
        <div className={`min-h-0 flex-1 overflow-y-auto pt-2 ${isDarkMode ? 'bg-[#1a1a1a]' : 'bg-white'}`} style={{ paddingBottom: 48 }}>
          <Menu
            mode="inline"
            triggerSubMenuAction="click"
            selectedKeys={activeTab ? [activeTab] : []}
            openKeys={openSectionId ? [openSectionId] : []}
            onOpenChange={keys => setOpenSectionId(nextAccordionSection(keys, openSectionId))}
            onClick={({ key }) => itemById[key] && handleSelectTab(key)}
            items={menuItems}
            className="border-none custom-menu rounded-[8px] h-full text-[#374151]"
            style={{ backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff', border: 'none' }}
          />
        </div>

        <div className={`shrink-0 border-t px-4 py-[17.5px] text-center ${isDarkMode ? 'bg-[#1a1a1a] border-gray-700' : 'bg-white border-gray-200'}`}>
          <span className={`text-[11px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Need help? Contact support</span>
        </div>

        <style>{sidebarMenuStyles(isDarkMode, primary)}</style>
      </div>

      <div className="flex-1 min-w-0 h-full overflow-hidden" style={{ marginLeft: SIDER_WIDTH }}>
        <div className="flex flex-col h-full overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default SettingsLayout;
