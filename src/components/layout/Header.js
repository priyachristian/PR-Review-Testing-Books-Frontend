import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

// Components
import { Avatar, Badge, Button, Drawer, Input, Layout, List, Modal, Space, Tag, Tooltip, Typography } from '@/components/AntDComponent';
import { FullscreenOutlined } from '@ant-design/icons';
import SessionTimer from '../ui/common/SessionTimer';
import NotificationBell from '../ui/NotificationBell';
import MaintenanceCountdownTimer from '../ui/common/MaintenanceCountdownTimer';
import OrganizationSwitcher from './OrganizationSwitcher';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import SplitSessionPinVerify from '@/features/setting/components/SplitSessionPinVerify';

// Hooks
import { useAuth } from 'hooks/useAuth';
import { useSidebar } from 'hooks/useSidebar';
import { useModule } from '@/hooks/useModule';
// Extras
import Icons from 'assets/icons/icon';
import logo from '@/assets/images/ABSS-LOGO.png';
import booksModuleLogo from '@/assets/images/LOGO-SMALL.png';
import crmModuleLogo from '@/assets/images/CRM-LOGO.png';
import { logout } from 'features/auth/authSlice';
import { endSplitSession } from 'features/common/commonSlice';
// AdminRoutes is not used for shortcuts; we derive from sidebar permissions instead
import { getAccessibleModulesList } from '@/utils/moduleAccess';
import { COMPANY_FEATURE } from 'utils/constants';
import { RESOURCES } from '@/utils/jsonFile';
import { colorPalette } from 'utils/theme';

const { Text } = Typography;
const { Header } = Layout;

const ProfileDetailRow = ({ label, value }) => (
  <div className="flex items-center justify-between gap-4">
    <span className="text-[11.5px] font-medium text-[#57647a] flex-shrink-0">{label}</span>
    <span className="text-[12.5px] font-medium text-[#0f172a] text-right truncate">{value || 'N/A'}</span>
  </div>
);

const ProfileSectionTitle = ({ children }) => <p className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#475569] mb-3">{children}</p>;

const ProfileAppTile = ({ module, comingSoon = false, onSelect }) => {
  if (comingSoon) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] px-3 py-6 min-h-[84px]">
        <span className="text-[11.5px] font-semibold text-[#0f172a] text-center leading-tight">{module.name}</span>
      </div>
    );
  }

  const isInteractive = !!module?.onClick;
  const iconImage = module?.iconImage || (module?.name === 'Books' ? booksModuleLogo : module?.name === 'CRM' ? crmModuleLogo : null);

  const handleActivate = () => {
    if (!isInteractive) return;
    onSelect?.(module);
  };

  return (
    <div
      className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-[#e2e8f0] bg-white p-3 transition-all ${
        isInteractive ? 'cursor-pointer hover:border-[#0e928e] hover:bg-[#e6f4f1] shadow-2xs group' : 'cursor-default'
      }`}
      onClick={handleActivate}
      onKeyDown={e => {
        if ((e.key === 'Enter' || e.key === ' ') && isInteractive) {
          e.preventDefault();
          handleActivate();
        }
      }}
      tabIndex={isInteractive ? 0 : -1}
      role={isInteractive ? 'button' : undefined}
      aria-label={`Open ${module.name} app`}
    >
      <div className="flex flex-1 items-center justify-center w-full overflow-visible">
        {iconImage ? (
          <img
            src={iconImage}
            alt={module.name}
            className="object-contain pointer-events-none select-none transition-transform duration-200 group-hover:scale-105"
            style={{
              width: 40,
              height: 40,
              transform: 'scale(2.25)',
              transformOrigin: 'center',
            }}
          />
        ) : (
          module?.icon || <Icons.AppstoreOutlined style={{ color: '#475569', fontSize: 28 }} />
        )}
      </div>
      <span className="text-[11.5px] font-semibold text-[#0f172a] text-center leading-tight flex-shrink-0 truncate w-full">{module.name}</span>
    </div>
  );
};

const AppHeader = ({ collapsed, toggleSidebar, isMobile, sidebarWidth = 220, topOffset = 0, tooltipPlacement, onEnterFocusMode }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { profile } = useSelector(state => state.profile);
  const { sidebarDrop } = useSidebar();
  const accessRoles = useSelector(state => state.user?.accessRoles);
  const auth = useSelector(state => state.auth);
  const isSplitSessionActive = useSelector(state => state.common.isSplitSessionActive);
  const { signin, logoutApi, companyId } = useAuth();
  const { accessibleModules, getAccessibleModules } = useModule();
  const [showVerifySessionPinModal, setShowVerifySessionPinModal] = useState(false);
  const normalize = str => (str || '').toLowerCase().replace(/[\s_-]/g, '');

  const isSplitWise = signin?.company?.companyFeatures?.includes(COMPANY_FEATURE?.ENABLESPLITBYQTYORPRICE);

  const dueDate = signin?.subscription?.isCustomPlan ? signin?.subscription?.paymentDate : signin?.subscription?.currentEnd;
  const handleCloseVerifySessionPinModal = () => {
    setShowVerifySessionPinModal(false);
  };

  const logoutFunction = async () => {
    try {
      await logoutApi();
    } finally {
      dispatch(logout());
    }
  };

  const handleLogout = () => {
    Modal.confirm({
      title: 'Confirm Logout',
      content: 'Are you sure you want to log out?',
      okText: 'Yes, Logout',
      cancelText: 'Cancel',
      cancelButtonProps: {
        className: 'confirm-modal-cancel-button',
        style: {
          borderColor: colorPalette.neutral[300],
          color: colorPalette.neutral[700],
        },
      },
      okButtonProps: {
        type: 'primary',
        style: {
          backgroundColor: colorPalette.primary[500],
          borderColor: colorPalette.primary[500],
        },
      },
      onOk: () => {
        logoutFunction();
      },
    });
  };

  const handleActiveSession = () => {
    setShowVerifySessionPinModal(true);
  };

  const handleDeactivateSession = () => {
    dispatch(endSplitSession());
  };

  // User profile drawer state
  const [isUserDrawerOpen, setIsUserDrawerOpen] = useState(false);

  // Quick shortcut navigation state
  const [isShortcutOpen, setIsShortcutOpen] = useState(false);
  const [shortcutQuery, setShortcutQuery] = useState('');
  const shortcutInputRef = useRef(null);

  useEffect(() => {
    if (isShortcutOpen) {
      setTimeout(() => {
        try {
          shortcutInputRef.current?.focus({ cursor: 'end' });
        } catch (e) {
          // no-op
        }
      }, 50);
    }
  }, [isShortcutOpen]);

  const goToPath = useCallback(
    path => {
      // Forms now use useBlocker to handle navigation blocking automatically
      navigate(`/${path}`);
      setIsShortcutOpen(false);
      setShortcutQuery('');
    },
    [navigate]
  );

  const permissionAlias = {
    itemmaster: 'items',
    customermaster: 'customers',
    quotes: 'quotations',
    deliverychallans: 'deliverychallan',
    paymentsreceived: 'paymentreceived',
    creditnotes: 'creditnote',
    vendors: 'vendor',
    recurringexpenses: 'recurringexpense',
    purchaseorders: 'purchaseorder',
    paymentsmade: 'paymentmade',
    debitnotes: 'debitnote',
  };

  const routeItems = useMemo(() => {
    const flattenLeaves = nodes => {
      const results = [];
      const walk = arr => {
        if (!Array.isArray(arr)) return;
        for (const node of arr) {
          const hasChildren = Array.isArray(node?.subItems) && node.subItems.length > 0;
          const rawPath = typeof node?.path === 'string' ? node.path : '';
          const cleanedPath = rawPath.replace(/^\/+/, '');
          const isEligibleLeaf = cleanedPath && (!hasChildren || node.subItems.length === 0);
          if (isEligibleLeaf) {
            results.push({
              title: node?.name || cleanedPath,
              path: cleanedPath,
            });
          }
          if (hasChildren) walk(node.subItems);
        }
      };
      walk(nodes);
      return results;
    };

    const permissionMap = Object.fromEntries(Object.entries(accessRoles?.permissions || {}).map(([key, value]) => [normalize(key), value]));

    const permitted = flattenLeaves(sidebarDrop?.moduleTree || []).filter(r => {
      const rawName = r.title?.trim() || '';
      const normalizedName = normalize(rawName);
      const alias = permissionAlias[normalizedName];
      const finalKey = alias || normalizedName;
      const canView = permissionMap[finalKey]?.view;
      return rawName === 'Setting' || !!canView;
    });

    permitted.push({ title: 'Setting', path: 'setting' });

    const withAdd = [...permitted];
    for (const r of permitted) {
      const rawName = r.title?.trim() || '';
      const normalizedName = normalize(rawName);
      const alias = permissionAlias[normalizedName];
      const finalKey = alias || normalizedName;
      const canCreate = permissionMap[finalKey]?.create;
      const p = r.path || '';

      if (
        rawName !== 'Setting' &&
        rawName !== 'Dashboard' &&
        rawName !== 'Bank Transfer Logs' &&
        rawName !== 'Analytics' &&
        rawName !== 'Reports' &&
        rawName !== 'Inventory Transfer' &&
        rawName !== 'View Inventory' &&
        rawName !== 'Submit Production' &&
        rawName !== 'Recipe' &&
        rawName !== 'Process' &&
        rawName !== 'Users' &&
        canCreate &&
        p &&
        !p.includes('?')
      ) {
        const base = p.replace(/^\/+/, '');
        if (!base.endsWith('/new')) {
          const addPath = `${base}/new`;
          withAdd.push({
            title: `Add ${rawName}`,
            path: addPath,
          });
        }
      }
    }

    const seen = new Set();
    const filtered = withAdd
      .filter(r => {
        const p = r.path || '';
        if (!p || p.includes(':') || p.startsWith('edit-') || p.includes('/edit-') || p.includes('-detail')) {
          return false;
        }
        if (seen.has(p)) return false;
        seen.add(p);
        return true;
      })
      .map(r => {
        const normTitle = (r.title || r.path || '').toLowerCase().replace(/[\s_-]/g, '');
        const normPath = (r.path || '').toLowerCase().replace(/[\s_-]/g, '');
        const isAdd = r.path.endsWith('/new');
        const isReport = r.path.startsWith('reports');
        const isSetting = r.path.startsWith('setting');
        const type = isAdd ? 'Add' : isReport ? 'Report' : isSetting ? 'Setting' : 'View';
        return { key: r.path, ...r, normTitle, normPath, type };
      })
      .sort((a, b) => a.title.localeCompare(b.title));

    return filtered;
  }, [sidebarDrop?.moduleTree, accessRoles?.permissions]);

  const aliasToPath = useMemo(
    () => ({
      salesorder: 'sales-orders',
      addsalesorder: 'sales-orders/new',
      invoice: 'invoices',
      addinvoice: 'invoices/new',
      purchaseorder: 'purchase-orders',
      addpurchaseorder: 'purchase-orders/new',
      bills: 'bills',
      paymentsreceived: 'payments-received',
      paymentsmade: 'payments-made',
      vendors: 'vendors',
      customers: 'customer-master',
      addcustomer: 'customer-master/new',
      banking: 'banking',
      reports: 'reports',
      settings: 'setting',
      dashboard: 'home',
    }),
    []
  );

  const filteredShortcuts = useMemo(() => {
    const q = normalize(shortcutQuery);
    if (!q) return routeItems;
    const aliasMatchPath = aliasToPath[q];
    const aliasMatch = aliasMatchPath ? routeItems.find(it => normalize(it.path) === normalize(aliasMatchPath)) : null;

    const list = routeItems.filter(it => it.normTitle.includes(q) || it.normPath.includes(q));

    if (aliasMatch && !list.find(l => l.path === aliasMatch.path)) {
      return [aliasMatch, ...list];
    }
    return list;
  }, [shortcutQuery, routeItems, aliasToPath]);

  const modulesList = useMemo(() => (isUserDrawerOpen ? getAccessibleModulesList(accessibleModules?.modules) : []), [isUserDrawerOpen, accessibleModules?.modules]);
  const isHasFreeTrial = accessibleModules?.modules?.find(module => module?.module === 'BOOKS');

  useEffect(() => {
    const handler = e => {
      const key = (e.key || '').toLowerCase();
      const isMeta = e.metaKey || e.ctrlKey;

      // Open command palette
      if (isMeta && key === 'k') {
        e.preventDefault();
        setIsShortcutOpen(true);
        return;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goToPath]);

  useEffect(() => {
    if (!isShortcutOpen) return undefined;
    const handler = e => {
      const key = (e.key || '').toLowerCase();
      if (key === 'escape') {
        e.preventDefault();
        setIsShortcutOpen(false);
        return;
      }
      if (key === 'enter') {
        e.preventDefault();
        if (filteredShortcuts[0]) goToPath(filteredShortcuts[0].path);
        return;
      }
      if (['1', '2', '3'].includes(key)) {
        const idx = Number(key) - 1;
        const target = filteredShortcuts[idx];
        if (target) {
          e.preventDefault();
          goToPath(target.path);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isShortcutOpen, filteredShortcuts, goToPath]);

  useEffect(() => {
    getAccessibleModules();
  }, []);

  const renderTypeBadge = type => {
    const baseStyle = {
      borderRadius: 8,
      padding: '2px 10px',
      height: 'auto',
      lineHeight: 1.2,
      fontWeight: 600,
      fontSize: 12,
    };
    const styleMap = {
      Add: {
        ...baseStyle,
        background: '#E6F4FF',
        color: '#1677FF',
        borderColor: '#91CAFF',
      },
      View: {
        ...baseStyle,
        background: '#F6FFED',
        color: '#52C41A',
        borderColor: '#B7EB8F',
      },
      Report: {
        ...baseStyle,
        background: '#F9F0FF',
        color: '#722ED1',
        borderColor: '#D3ADF7',
      },
      Setting: {
        ...baseStyle,
        background: '#F0F5FF',
        color: '#2F54EB',
        borderColor: '#ADC6FF',
      },
    };
    return (
      <Tag bordered style={styleMap[type] || baseStyle}>
        {type}
      </Tag>
    );
  };

  const renderKey = text => (
    <span
      key={text}
      style={{
        display: 'inline-block',
        border: '1px solid #e5e7eb',
        background: '#f8fafc',
        borderRadius: 6,
        padding: '2px 8px',
        marginRight: 6,
        fontSize: 12,
        fontWeight: 600,
        color: '#334155',
      }}
    >
      {text}
    </span>
  );

  const getDueMessage = dueDate => {
    if (!dueDate) return 'Subscription billing date unavailable';

    const today = dayjs().startOf('day');
    const due = dayjs(dueDate).startOf('day');
    const diff = due.diff(today, 'days');

    if (diff > 1) {
      return `Your ABSS subscription payment is due in ${diff} days`;
    }

    if (diff === 1) {
      return 'Your ABSS subscription payment is due tomorrow';
    }

    if (diff === 0) {
      return 'Your ABSS subscription payment is due today';
    }

    if (diff === -1) {
      return 'Your ABSS subscription payment was due yesterday';
    }

    return `Your ABSS subscription payment is overdue by ${Math.abs(diff)} days`;
  };

  let ACCOUNT_URL = import.meta.env.VITE_ACCOUNT_URL;

  const fullName = auth?.signin?.user?.firstName ? `${auth?.signin?.user?.firstName} ${auth?.signin?.user?.lastName || ''}`.trim() : '';
  const companyDisplayName = profile?.name || signin?.company?.name;
  const avatarInitials = `${auth?.signin?.user?.firstName?.[0] || ''}${auth?.signin?.user?.lastName?.[0] || ''}`.toUpperCase();

  const iconFontSize = '15px';

  return (
    <Header
      className="min-h-[56px] flex items-center justify-between fixed z-20 right-0 transition-all duration-300 ease-in-out border-b border-gray-200 px-3 md:px-4 gap-2"
      style={{
        height: '56px',
        lineHeight: 'normal',
        width: isMobile ? '100%' : `calc(100% - ${sidebarWidth}px)`,
        background: '#ffffff',
        top: topOffset,
      }}
    >
      {/* Left: sidebar toggle + logo (mobile) + welcome text */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 h-full">
        <button
          type="button"
          onClick={toggleSidebar}
          className="flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors p-1.5 rounded-lg hover:bg-gray-100 outline-none flex-shrink-0 cursor-pointer border-none bg-transparent my-auto"
          aria-label={isMobile ? (collapsed ? 'Open sidebar' : 'Close sidebar') : collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
          </svg>
        </button>

        <NavLink to="/home" className={`flex items-center transition-all duration-300 flex-shrink-0 ${isMobile && !collapsed ? 'hidden' : 'block'} md:hidden my-auto`}>
          <img src={logo} alt="ABSS" className="w-32 sm:w-36 md:h-10 md:w-40" />
        </NavLink>

        {fullName && (
          <div className="flex items-center gap-1.5 text-[14px] leading-none whitespace-nowrap flex-shrink-0 min-w-0 my-auto">
            <span className="text-slate-500 font-normal">Welcome,</span>
            <span className="text-slate-900 font-semibold">{fullName}</span>
            {companyDisplayName && (
              <>
                <span className="text-slate-400 font-normal">·</span>
                <span className="text-slate-500 font-normal">{companyDisplayName}</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Center: Maintenance countdown & Subscription alerts */}
      <div className="hidden xl:flex items-center justify-end flex-1 min-w-0 px-2 gap-2 h-full">
        <MaintenanceCountdownTimer variant="inline" />
        {isHasFreeTrial?.plan?.isFree && (
          <div className="flex items-center gap-1.5 px-2.5 py-3 bg-amber-50 rounded-lg border border-amber-200 min-w-0 my-auto">
            <Icons.ExclamationCircleOutlined className="text-amber-500 text-xs flex-shrink-0" />
            <Text className="text-xs font-medium text-amber-800 truncate">Trial ends in {dayjs(isHasFreeTrial?.plan?.currentEnd).diff(dayjs(), 'day')} days</Text>
            <button
              type="button"
              className="text-xs font-semibold text-blue-600 cursor-pointer hover:underline whitespace-nowrap bg-transparent border-none p-0"
              onClick={() => window.open(`${ACCOUNT_URL}/billing-plans?tab=BOOKS&period=monthly`, '_blank')}
            >
              Upgrade
            </button>
          </div>
        )}
        {dueDate && dayjs(dueDate).diff(dayjs(), 'day') <= 5 && (
          <div className="flex items-center gap-1.5 px-2.5 py-3 bg-red-50 rounded-lg border border-red-200 min-w-0 my-auto">
            <Icons.ExclamationCircleOutlined className="text-red-500 text-xs flex-shrink-0" />
            <Text className="text-xs font-medium text-red-800 truncate">{getDueMessage(dueDate)}</Text>
          </div>
        )}
      </div>

      {/* Right: Integrated Action Container + SessionTimer + OrganizationSwitcher + User Avatar */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 h-full" style={{ lineHeight: 'normal' }}>
        {/* Session Timer */}
        <div className="hidden sm:block flex-shrink-0 my-auto">
          <SessionTimer />
        </div>

        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-0.5 sm:px-1 py-0.5 sm:py-1 flex-shrink-0 my-auto box-border">
          {/* 1. Refresh / Sync Button */}
          <Tooltip title="Sync data" placement={tooltipPlacement}>
            <Button
              type="text"
              size="middle"
              icon={<Icons.SyncOutlined style={{ fontSize: iconFontSize }} className="sm:text-[16px]" />}
              onClick={() => {
                window.location.reload();
              }}
              className="!h-7 !w-7 sm:!h-8 sm:!w-8 !rounded-md flex items-center justify-center text-gray-600 hover:!bg-white hover:!text-gray-900 hover:!shadow-sm transition-all p-0"
            />
          </Tooltip>

          {/* 2. Full screen Button */}
          {onEnterFocusMode && (
            <Tooltip title="Full screen" placement={tooltipPlacement}>
              <Button
                type="text"
                size="middle"
                icon={<FullscreenOutlined style={{ fontSize: iconFontSize }} className="sm:text-[16px]" />}
                onClick={onEnterFocusMode}
                className="!h-7 !w-7 sm:!h-8 sm:!w-8 !rounded-md flex items-center justify-center text-gray-600 hover:!bg-white hover:!text-gray-900 hover:!shadow-sm transition-all p-0"
              />
            </Tooltip>
          )}

          {/* 3. Recent Updates */}
          <Tooltip title="Recent Updates" placement={tooltipPlacement}>
            <Badge dot color="#ef4444" offset={[-2, 2]}>
              <Button
                type="text"
                size="middle"
                icon={<Icons.NotificationOutlined style={{ fontSize: '14px' }} className="sm:text-[16px]" />}
                onClick={() => navigate('/recent-updates')}
                className="!h-7 !w-7 sm:!h-8 sm:!w-8 !rounded-md flex items-center justify-center text-gray-600 hover:!bg-white hover:!text-gray-900 hover:!shadow-sm transition-all p-0"
              />
            </Badge>
          </Tooltip>

          {/* 4. Search Box / Button */}
          <Tooltip title="Quick shortcuts (Ctrl/Cmd + K)" placement={tooltipPlacement || 'bottom'}>
            <Button
              type="text"
              size="middle"
              onClick={() => setIsShortcutOpen(true)}
              className="!h-7 sm:!h-8 !rounded-md flex items-center justify-center text-gray-600 hover:!bg-white hover:!text-gray-900 hover:!shadow-sm transition-all !px-1.5 sm:!px-2 gap-1.5"
            >
              <Icons.SearchOutlined style={{ fontSize: iconFontSize }} className="sm:text-[16px]" />
              <span className="hidden xl:inline text-[12px] font-medium text-gray-600">Search</span>
              <span className="hidden xl:inline text-[10px] font-semibold text-gray-500 border border-gray-200 bg-white rounded py-0.5 leading-none">⌘K</span>
            </Button>
          </Tooltip>

          {/* 5. Notification Bell */}
          <div className="flex items-center justify-center my-auto">
            <NotificationBell tooltipPlacement={tooltipPlacement} />
          </div>

          {/* 6. Support / Help (Headphones Icon) */}
          {accessRoles?.permissions?.[RESOURCES.SUPPORT]?.view && (
            <Tooltip title="Help & Support" placement={tooltipPlacement}>
              <Button
                type="text"
                size="middle"
                icon={<Icons.CustomerServiceOutlined style={{ fontSize: iconFontSize }} className="sm:text-[16px]" />}
                onClick={() => navigate('/support')}
                className="hidden sm:!flex !h-7 !w-7 sm:!h-8 sm:!w-8 !rounded-md items-center justify-center text-gray-600 hover:!bg-white hover:!text-gray-900 hover:!shadow-sm transition-all p-0"
              />
            </Tooltip>
          )}

          {/* 7. Settings (Gear Icon) */}
          <Tooltip title="Settings" placement={tooltipPlacement}>
            <Button
              type="text"
              size="middle"
              icon={<Icons.SettingOutlined style={{ fontSize: iconFontSize }} className="sm:text-[16px]" />}
              onClick={() => navigate('/setting')}
              className="!h-7 !w-7 sm:!h-8 sm:!w-8 !rounded-md flex items-center justify-center text-gray-600 hover:!bg-white hover:!text-gray-900 hover:!shadow-sm transition-all p-0"
            />
          </Tooltip>
        </div>

        {/* Organization Switcher */}
        <div className="flex items-center my-auto">
          <OrganizationSwitcher companyId={companyId} companyName={signin?.company?.name} />
        </div>

        {/* User Avatar Circle */}
        <button
          type="button"
          onClick={() => setIsUserDrawerOpen(true)}
          className="w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer border-none p-0 flex-shrink-0 outline-none leading-none my-auto"
          style={{ background: colorPalette.primary[500] }}
          aria-label="User profile"
        >
          {avatarInitials || 'JS'}
        </button>
      </div>

      {showVerifySessionPinModal && <SplitSessionPinVerify modalOpen={showVerifySessionPinModal} handleModalClose={handleCloseVerifySessionPinModal} />}

      {/* Shortcut Modal */}
      <CustomModal
        modalOpen={isShortcutOpen}
        setModalOpen={setIsShortcutOpen}
        width="min(600px, 90vw)"
        destroyOnClose
        className="!top-[5vh] sm:!top-[10vh]"
        styles={{
          body: { padding: '0 16px 16px' },
        }}
        title={
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap py-0.5">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
              <Icons.SearchOutlined style={{ fontSize: 11, color: colorPalette.primary[500] }} className="sm:text-xs" />
            </div>
            <span className="text-gray-800 text-[13px] sm:text-[14px]">Quick Navigation</span>
            <span className="text-[9px] sm:text-[10px] text-gray-400 bg-gray-100 px-1 sm:px-1.5 py-0.5 rounded font-mono ml-1">⌘K</span>
          </div>
        }
      >
        <Space direction="vertical" size={8} style={{ width: '100%' }} className="sm:!gap-[10px]">
          <Input
            size="large"
            placeholder="Search pages, e.g. quotation, sales order, vendors..."
            value={shortcutQuery}
            onChange={e => setShortcutQuery(e.target.value)}
            prefix={<Icons.SearchOutlined style={{ color: '#9ca3af' }} />}
            allowClear
            ref={shortcutInputRef}
            className="!rounded-xl !text-sm sm:!text-base"
          />
          <div className="text-[10px] sm:text-[11px] text-gray-400 flex items-center gap-2 sm:gap-3 px-1 flex-wrap">
            <span>{filteredShortcuts.length} routes</span>
            <span className="hidden sm:inline">·</span>
            <span className="hidden sm:inline">
              Press <kbd className="bg-gray-100 border border-gray-200 rounded px-1 text-[9px] sm:text-[10px]">1</kbd>–
              <kbd className="bg-gray-100 border border-gray-200 rounded px-1 text-[9px] sm:text-[10px]">3</kbd> for top results
            </span>
            <span className="hidden sm:inline">·</span>
            <span>
              <kbd className="bg-gray-100 border border-gray-200 rounded px-1 text-[9px] sm:text-[10px]">↵</kbd> to navigate
            </span>
          </div>
          <div style={{ maxHeight: '50vh' }} className="sm:max-h-[55vh] rounded-xl border border-gray-100 overflow-hidden overflow-y-auto">
            <List
              dataSource={filteredShortcuts}
              locale={{
                emptyText: (
                  <div className="flex flex-col items-center py-6 sm:py-8 text-gray-400">
                    <Icons.SearchOutlined style={{ fontSize: 20, marginBottom: 6 }} className="sm:text-2xl sm:mb-2" />
                    <span className="text-xs sm:text-sm">No pages match your search</span>
                  </div>
                ),
              }}
              size="small"
              renderItem={(item, idx) => (
                <List.Item className="cursor-pointer !px-3 sm:!px-4 !py-2 sm:!py-2.5 hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-b-0" onClick={() => goToPath(item.path)}>
                  <div className="flex items-center justify-between w-full gap-2 sm:gap-3">
                    <div className="flex flex-col min-w-0 flex-1">
                      <Text strong className="text-[12px] sm:text-[13px] text-gray-800 truncate">
                        {item.title}
                      </Text>
                      <Text type="secondary" className="text-[10px] sm:text-[11px] font-mono truncate">
                        /{item.path}
                      </Text>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                      {idx < 3 ? renderKey(String(idx + 1)) : null}
                      {renderTypeBadge(item.type)}
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </div>
        </Space>
      </CustomModal>

      {/* User Profile Drawer */}
      <Drawer
        placement="right"
        onClose={() => setIsUserDrawerOpen(false)}
        open={isUserDrawerOpen}
        width={400}
        zIndex={10001}
        maskClosable={true}
        closable={false}
        styles={{
          body: { padding: 0 },
        }}
      >
        <div className="flex flex-col h-full bg-white">
          <div className="px-5 pt-4 pb-3 border-b border-[#eef2f6] relative">
            <Button
              size="small"
              icon={<Icons.CloseOutlined />}
              onClick={() => setIsUserDrawerOpen(false)}
              className="absolute top-4 right-4 !w-8 !h-8 !min-w-8 !p-0 flex items-center justify-center border border-[#e2e8f0] rounded-lg bg-white text-[#64748b] hover:text-[#1e293b] hover:border-[#cbd5e1] transition-colors shadow-none"
            />

            <div className="flex items-start gap-3.5 pr-8">
              <Avatar
                size={40}
                className="flex-shrink-0 flex items-center justify-center uppercase shadow-xs"
                style={{
                  background: colorPalette.primary[500],
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 700,
                }}
              >
                {avatarInitials || <Icons.UserOutlined />}
              </Avatar>
              <div className="flex flex-col min-w-0 pt-0.5">
                <Text strong className="!text-[15px] !font-semibold !text-[#0f172a] truncate leading-tight mb-0.5">
                  {fullName || 'User'}
                </Text>
                <Text className="!text-[12px] !font-medium text-[#57647a] truncate">{auth?.email || auth?.signin?.user?.email || ''}</Text>
              </div>
            </div>
          </div>

          <div className="px-5 py-4 border-b border-[#eef2f6] space-y-1">
            <ProfileDetailRow label="Name" value={fullName} />
            <ProfileDetailRow label="Email" value={auth?.email || auth?.signin?.user?.email} />
            <ProfileDetailRow label="User ID" value={auth?.signin?.user?._id ? `USR-${auth.signin.user._id.slice(-6).toUpperCase()}` : 'N/A'} />
            <ProfileDetailRow label="Organisation ID" value={companyId ? `ORG-${companyId.slice(-4).toUpperCase()}` : 'N/A'} />
            <ProfileDetailRow label="Role" value={accessRoles?.role} />

            <div className={`grid ${isSplitWise ? 'grid-cols-3' : 'grid-cols-2'} gap-3 pt-2`}>
              <button
                type="button"
                className="h-[35px] rounded-[6px] border border-[#cbd5e1] bg-white text-[13px] font-bold text-[#1e293b] cursor-pointer hover:bg-[#f8fafc] hover:border-[#94a3b8] transition-all shadow-2xs"
                onClick={() => {
                  setIsUserDrawerOpen(false);
                  window.open(ACCOUNT_URL || 'https://accounts.abss.ai', '_blank');
                }}
              >
                My account
              </button>
              {isSplitWise && (
                <button
                  type="button"
                  className="h-[35px] rounded-[6px] border border-amber-300 bg-amber-50 text-[12px] font-bold text-amber-700 cursor-pointer hover:bg-amber-100 transition-all shadow-2xs px-1"
                  onClick={() => {
                    setIsUserDrawerOpen(false);
                    if (isSplitSessionActive) {
                      handleDeactivateSession();
                    } else {
                      handleActiveSession();
                    }
                  }}
                >
                  {isSplitSessionActive ? 'Deactivate' : 'Active'}
                </button>
              )}
              <button
                type="button"
                className="h-[35px] rounded-[6px] border border-[#cbd5e1] text-[13px] font-bold text-[#dc2626] cursor-pointer hover:bg-[#fee2e2] transition-all shadow-2xs"
                onClick={() => {
                  setIsUserDrawerOpen(false);
                  handleLogout();
                }}
              >
                Sign out
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
            {modulesList?.filter(module => module.isAccessible)?.length > 0 && (
              <div>
                <ProfileSectionTitle>My Apps</ProfileSectionTitle>
                <div className="grid grid-cols-3 gap-3">
                  {modulesList
                    ?.filter(module => module.isAccessible)
                    ?.map((module, index) => (
                      <ProfileAppTile
                        key={`${module.name}-${index}`}
                        module={module}
                        onSelect={() => {
                          setIsUserDrawerOpen(false);
                          module.onClick?.();
                        }}
                      />
                    ))}
                </div>
              </div>
            )}

            {modulesList?.filter(module => !module.isAccessible && !module.isComingSoon)?.length > 0 && (
              <div>
                <ProfileSectionTitle>Other Apps</ProfileSectionTitle>
                <div className="grid grid-cols-3 gap-3">
                  {modulesList
                    ?.filter(module => !module.isAccessible && !module.isComingSoon)
                    ?.map((module, index) => (
                      <ProfileAppTile
                        key={`${module.name}-${index}`}
                        module={module}
                        onSelect={() => {
                          setIsUserDrawerOpen(false);
                          module.onClick?.();
                        }}
                      />
                    ))}
                </div>
              </div>
            )}

            {modulesList?.filter(module => module.isComingSoon)?.length > 0 && (
              <div>
                <ProfileSectionTitle>Coming Soon</ProfileSectionTitle>
                <div className="grid grid-cols-2 gap-3">
                  {modulesList
                    ?.filter(module => module.isComingSoon)
                    ?.map((module, index) => (
                      <ProfileAppTile key={`${module.name}-${index}`} module={module} comingSoon />
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Drawer>
    </Header>
  );
};

export default AppHeader;
