import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Input } from '@/components/AntDComponent';
import { colorPalette } from '@/utils/theme';

import useModulePermissions from 'hooks/useModulePermissions';
import { useModule } from '@/hooks/useModule';
import { useAuth } from 'hooks/useAuth';
import { useUser } from '@/features/setting/user/useUser';

import Icons from 'assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { TAB_TO_PATH, ITEM_DEFS, SECTIONS, getSettingItemPlanState } from './settingNavConfig';

function buildItemById(ctx) {
  const map = {};
  for (const d of ITEM_DEFS) {
    const isMyProfile = d.id === 'my-profile';
    if (!isMyProfile && !d.visible(ctx)) continue;
    if (!isMyProfile && !getSettingItemPlanState(d.id, ctx).visible) continue;
    map[d.id] = {
      id: d.id,
      label: d.label,
      description: typeof d.description === 'function' ? d.description(ctx) : d.description,
      icon: React.createElement(d.Icon),
      hubVisible: d.hubVisible !== false,
    };
  }
  return map;
}

function itemsForSection(section, itemById, searchQuery) {
  const needle = searchQuery.trim().toLowerCase();
  return section.itemIds
    .map(id => itemById[id])
    .filter(Boolean)
    .filter(item => item.hubVisible !== false)
    .filter(item => !needle || item.label.toLowerCase().includes(needle) || item.description?.toLowerCase().includes(needle));
}

const p = colorPalette.primary;

function HubSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, cardIdx) => (
        <div key={cardIdx} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-200" style={{ backgroundColor: colorPalette.neutral[50] }}>
            <span className="w-7 h-7 rounded-md bg-gray-200 animate-pulse shrink-0" />
            <span className="h-3.5 w-28 rounded bg-gray-200 animate-pulse" />
          </div>
          <ul className="flex-1 divide-y divide-gray-100">
            {Array.from({ length: cardIdx % 2 === 0 ? 3 : 2 }).map((__, rowIdx) => (
              <li key={rowIdx} className="flex items-start gap-3 px-4 py-2.5">
                <span className="w-7 h-7 rounded-md bg-gray-100 animate-pulse shrink-0 mt-px" />
                <span className="flex-1 min-w-0">
                  <span className="block h-3 w-24 rounded bg-gray-200 animate-pulse" />
                  <span className="block h-2.5 w-40 max-w-full rounded bg-gray-100 animate-pulse mt-2" />
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function SettingsHub({ itemById, onSelectTab, loading }) {
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  const focusSearch = () => {
    searchInputRef.current?.focus?.();
  };

  useEffect(() => {
    const handleKeyDown = e => {
      if (e.key !== '/') return;
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable) return;
      e.preventDefault();
      focusSearch();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const blocks = SECTIONS.map(section => ({
    ...section,
    items: itemsForSection(section, itemById, searchQuery),
  })).filter(b => b.items.length > 0);

  return (
    <div className="px-6 py-6 min-h-full" style={{ backgroundColor: colorPalette.neutral[50] }}>
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[18px] font-bold text-heading leading-tight">All settings</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Manage your account, organization, and preferences.</p>
        </div>

        <div className="w-full lg:w-72 shrink-0">
          <Input
            ref={searchInputRef}
            allowClear
            disabled={loading}
            prefix={<Icons.SearchOutlined className="text-gray-400" />}
            suffix={
              !searchQuery ? (
                <button
                  type="button"
                  tabIndex={-1}
                  onMouseDown={e => e.preventDefault()}
                  onClick={e => {
                    e.stopPropagation();
                    focusSearch();
                  }}
                  className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded border border-gray-200 bg-gray-50 text-[11px] font-medium text-gray-400 leading-none hover:text-gray-600 hover:border-gray-300"
                  aria-label="Focus search"
                >
                  /
                </button>
              ) : null
            }
            placeholder="Search settings"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onClear={focusSearch}
            className="rounded-md"
          />
        </div>
      </div>

      {loading ? (
        <HubSkeleton />
      ) : blocks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Icons.SearchOutlined className="text-2xl text-gray-300 mb-3" />
          <p className="text-sm font-medium text-heading">No settings match “{searchQuery.trim()}”</p>
          <p className="text-[13px] text-gray-500 mt-1">Try a different keyword, or check your spelling.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {blocks.map(section => (
            <article key={section.id} id={`settings-group-${section.id}`} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
              <header className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-200" style={{ backgroundColor: colorPalette.neutral[50] }}>
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-md text-sm shrink-0" style={{ backgroundColor: '#fff', color: p[500], border: `1px solid ${p[200]}` }}>
                  {React.createElement(section.Icon)}
                </span>
                <h2 className="text-sm font-semibold text-heading leading-tight">{section.label}</h2>
              </header>

              <ul className="flex-1 divide-y divide-gray-100">
                {section.items.map(item => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onSelectTab(item.id)}
                      className="group w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors focus-visible:outline-none cursor-pointer hover:bg-[--hub-hover] focus-visible:bg-[--hub-hover]"
                      style={{ '--hub-hover': p[50] }}
                    >
                      <span
                        className="inline-flex items-center justify-center w-7 h-7 rounded-md text-sm shrink-0 text-gray-500 mt-px transition-colors group-hover:text-primary"
                        style={{ backgroundColor: colorPalette.neutral[100], border: `1px solid ${colorPalette.neutral[200]}` }}
                      >
                        {item.icon}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13px] font-medium text-heading leading-tight">{item.label}</span>
                        {item.description ? <span className="block text-[12px] text-gray-500 leading-snug mt-0.5">{item.description}</span> : null}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

const SettingsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
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
  const { featureInPlanMap, hardHiddenPlanFeatures, settingsPlanLoaded } = useModule();

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
  const tabParam = searchParams.get('tab');

  useEffect(() => {
    if (tabParam && tabParam !== 'hub' && TAB_TO_PATH[tabParam]) {
      navigate(TAB_TO_PATH[tabParam], { replace: true });
    }
  }, [navigate, tabParam]);

  const handleSelectTab = tabId => {
    const path = TAB_TO_PATH[tabId];
    if (!path) return;
    navigate(path);
  };

  return <SettingsHub itemById={itemById} onSelectTab={handleSelectTab} loading={!settingsPlanLoaded} />;
};

export default SettingsPage;
