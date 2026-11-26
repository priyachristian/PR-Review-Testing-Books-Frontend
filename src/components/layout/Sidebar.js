import { createElement, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import Icons from 'assets/icons/icon';
import { useSelector } from 'react-redux';

// Components
import { Avatar, Badge, Layout, Menu, Tooltip, Typography } from '@/components/AntDComponent';

// Hooks
import { useSidebar } from 'hooks/useSidebar';
import { useTheme } from '@/components/ui/common/ThemeProvider';
import { useDocsLink } from '@/hooks/useDocsLink';

// Extras
import logo from '@/assets/images/ABSS-LOGO.png';
import logoSmall from '@/assets/images/ABSS-LOGO-SMALL.svg';
import { colorPalette } from '@/utils/theme';
import { ROUTE_PERMISSIONS } from '@/utils/routePermissions';

const { Sider } = Layout;
const { Text } = Typography;

const handleLabelName = item => {
  let sidebarNameArr = [];

  let isNameExists = sidebarNameArr?.filter(x => x === item?.name);

  if (isNameExists?.length > 0) {
    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {item.name}
        <Badge dot style={{ backgroundColor: 'red', width: '7px', height: '7px', marginTop: '8px' }} />
      </span>
    );
  } else {
    return item.name;
  }
};

/**
 * Resolve a module's "create" route for the sidebar quick-add icon.
 * Returns the create path only when (a) a `<path>/new` route is registered in
 * ROUTE_PERMISSIONS and (b) the current user has `create` permission for that
 * module. Returns null otherwise so no add icon is rendered.
 */
const getQuickCreatePath = (path, accessRoles) => {
  if (!path) return null;
  const createPath = `${path.replace(/\/+$/, '')}/new`;
  const resourceKey = ROUTE_PERMISSIONS[createPath];
  if (!resourceKey) return null;
  const perm = accessRoles?.permissions?.[resourceKey] || accessRoles?.[resourceKey];
  return perm?.create ? createPath : null;
};

const buildMenuLabel = (item, accessRoles, navigate) => {
  const baseLabel = handleLabelName(item);
  const createPath = getQuickCreatePath(item.path, accessRoles);

  if (!createPath) return baseLabel;

  return (
    <span className="sidebar-label-with-add">
      <span className="sidebar-label-text">{baseLabel}</span>
      <Tooltip title={`Add ${item.name}`} placement="right">
        <span
          role="button"
          tabIndex={-1}
          className="sidebar-quick-add"
          onClick={e => {
            e.stopPropagation();
            navigate(createPath);
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation();
              navigate(createPath);
            }
          }}
        >
          <Icons.PlusOutlined />
        </span>
      </Tooltip>
    </span>
  );
};

const transformMenuData = (items, accessRoles, navigate) => {
  return items.map(item => ({
    key: item.path.replace(/^\/+/, ''),
    icon: createElement(Icons[item.icon] || Icons.UserOutlined),
    label: buildMenuLabel(item, accessRoles, navigate),
    path: item.path,
    children: item.subItems?.length ? transformMenuData(item.subItems, accessRoles, navigate) : undefined,
  }));
};

const AppSidebar = ({ collapsed, setCollapsed, isMobile, bannerHeight = 0 }) => {
  const mainPrimaryColor = colorPalette.primary[500];
  const docsUrl = useDocsLink();
  const [menuItems, setMenuItems] = useState([]);
  const [openKeys, setOpenKeys] = useState([]);
  const { sidebarDrop } = useSidebar();
  const { isDarkMode } = useTheme();
  const location = useLocation();
  const { profile } = useSelector(state => state.profile);
  const auth = useSelector(state => state.auth);
  const accessRoles = useSelector(state => state.user?.accessRoles);
  const navigate = useNavigate();
  // const hasAutoCollapsed = useRef(false);
  const previousPathname = useRef(location.pathname);
  const autoCollapsed = useRef(false);
  const siderRef = useRef(null);
  const menuContainerRef = useRef(null);

  useEffect(() => {
    if (sidebarDrop?.moduleTree?.length) {
      let filteredSidebar = sidebarDrop.moduleTree.filter(item => item.key !== 'support');
      setMenuItems(transformMenuData(filteredSidebar, accessRoles, navigate));
    }
  }, [sidebarDrop, accessRoles, navigate]);

  const handleMenuClick = ({ key }) => {
    const item = findMenuItemByKey(menuItems, key);
    if (item && item.path) {
      // Forms now use useBlocker to handle navigation blocking automatically
      navigate(item.path);
      if (isMobile && typeof setCollapsed === 'function') setCollapsed(true);
    }
  };

  const findMenuItemByKey = (items, targetKey) => {
    for (const item of items) {
      if (item.key === targetKey) return item;
      if (item.children) {
        const found = findMenuItemByKey(item.children, targetKey);
        if (found) return found;
      }
    }
    return null;
  };

  useLayoutEffect(() => {
    const sidebarWidth = collapsed ? '64px' : '220px';
    document.documentElement.style.setProperty('--sidebar-width', sidebarWidth);
  }, [collapsed]);

  const getSelectedKeys = () => {
    const path = location.pathname;
    const match = path.match(/^\/(?:add-|edit-)?([^/]+)/);
    return match ? [match[1]] : [];
  };

  const getOpenKeys = () => {
    const path = location.pathname;
    const findOpenKeys = (items, parents = []) => {
      for (const item of items) {
        let newPath = path?.slice(1)?.split('/');
        let newItemPath = item?.path?.slice(1);
        if (newItemPath === newPath?.[0] || `add-${newItemPath}` === newPath?.[0] || `edit-${newItemPath}` === newPath?.[0]) {
          if (!collapsed) {
            return [...parents, item.key];
          }
          return [];
        }
        if (item.children) {
          const childKeys = findOpenKeys(item.children, [...parents, item.key]);
          if (childKeys.length) return childKeys;
        }
      }
      return [];
    };
    return findOpenKeys(menuItems);
  };

  const handleOnOpenChange = keys => {
    if (keys?.length === 1) {
      let findKey = menuItems?.filter(x => x?.key === keys?.[0]);
      if (findKey?.length === 0) {
        setOpenKeys([]);
        return;
      }
    }

    function findKeyPath(arr, targetKey, path = []) {
      for (const item of arr) {
        const newPath = [...path, item.key];
        if (item.key === targetKey) {
          return newPath;
        }
        if (item.children) {
          const result = findKeyPath(item.children, targetKey, newPath);
          if (result) {
            return result;
          }
        }
      }
      return null;
    }
    setOpenKeys(findKeyPath(menuItems, keys?.[keys?.length - 1]) || []);
  };

  useEffect(() => {
    const isSettings = location.pathname.includes('/setting');
    const wasSettings = previousPathname.current.includes('/setting');
    if (isSettings && !wasSettings && !collapsed) {
      setCollapsed(true, { persist: false });
      autoCollapsed.current = true;
    }
    if (!isSettings && wasSettings && autoCollapsed.current && collapsed) {
      setCollapsed(false, { persist: false });
      autoCollapsed.current = false;
    }
    previousPathname.current = location.pathname;
  }, [location.pathname, collapsed, setCollapsed]);

  useEffect(() => {
    if (menuItems.length) {
      const newOpenKeys = getOpenKeys();
      setOpenKeys(newOpenKeys);
    }
  }, [location.pathname, menuItems, collapsed]);

  const handleSidebarToggle = () => {
    if (typeof setCollapsed === 'function') {
      setCollapsed(!collapsed);
    } else {
      console.error('setCollapsed is not a function');
    }
  };

  const SIDEBAR_BG = isDarkMode ? '#1a1a1a' : '#ffffff';
  const SIDEBAR_FOOTER_BG = isDarkMode ? '#111111' : '#ffffff';

  const sidebarStyles = {
    backgroundColor: SIDEBAR_BG,
    borderRight: `1px solid ${isDarkMode ? '#333333' : '#e9eaec'}`,
  };

  const menuStyles = {
    backgroundColor: SIDEBAR_BG,
    paddingBottom: '50px',
  };

  const supportModule = sidebarDrop?.moduleTree?.find(item => item.key === 'support' && item?.isActive);
  const SupportIcon = (supportModule?.icon && Icons[supportModule.icon]) || Icons.CustomerServiceOutlined;

  const siderWidth = isMobile ? 260 : 220;
  const siderCollapsedWidth = 64;
  const activeSiderWidth = collapsed ? siderCollapsedWidth : siderWidth;

  const user = auth?.signin?.user || {};
  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
  const email = user?.email || '';

  const mobileBackdropZIndex = 999;
  const mobileSidebarZIndex = 1000;

  return (
    <>
      {isMobile && !collapsed && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => setCollapsed(true)}
          role="button"
          tabIndex={0}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') setCollapsed(true);
          }}
          aria-label="Close sidebar backdrop"
          style={{ zIndex: mobileBackdropZIndex }}
        />
      )}

      <Sider
        ref={siderRef}
        trigger={null}
        collapsible
        collapsed={collapsed}
        onCollapse={handleSidebarToggle}
        width={siderWidth}
        collapsedWidth={siderCollapsedWidth}
        className={`fixed left-0 h-screen box-content custom-scrollbar overflow-x-hidden custom-sidebar transition-all duration-300 ${
          isMobile ? 'z-50' : 'z-30'
        } ${collapsed && isMobile ? '-translate-x-full' : 'translate-x-0'}`}
        style={{
          ...sidebarStyles,
          position: 'fixed',
          top: 0,
          height: '100vh',
          zIndex: isMobile ? mobileSidebarZIndex : undefined,
        }}
      >
        {/* Logo Section (now fixed) */}
        <div
          className="h-[56px] flex items-center justify-between px-4 border-b border-gray-200 bg-white z-50"
          style={{
            position: 'fixed',
            left: 0,
            top: bannerHeight,
            width: activeSiderWidth,
            transition: 'width 0.3s, top 0.3s',
          }}
        >
          <NavLink to="/" className="flex items-center h-full min-w-0">
            {collapsed ? (
              <img src={logoSmall} alt="ABSS" className="object-contain transition-opacity duration-200" style={{ height: 26, width: 'auto' }} />
            ) : (
              <img
                src={logo}
                alt="ABSS"
                className="object-contain transition-opacity duration-300"
                style={{
                  height: isMobile ? 40 : 60,
                  width: isMobile ? 140 : '100%',
                }}
              />
            )}
          </NavLink>

          {isMobile && !collapsed && (
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="flex items-center justify-center w-8 h-8 rounded mr-2 transition-colors"
              style={{ color: '#94A3B8' }}
              aria-label="Close sidebar"
            >
              <Icons.CloseOutlined style={{ fontSize: 16 }} />
            </button>
          )}
        </div>

        {/* Menu Section */}
        <div
          ref={menuContainerRef}
          className="z-10 pt-2"
          style={{
            position: 'fixed',
            top: 57 + bannerHeight,
            left: 0,
            width: activeSiderWidth,
            height: 'auto',
            maxHeight: `calc(100vh - ${57 + bannerHeight}px - 57px - 44px)`,
            backgroundColor: SIDEBAR_BG,
            overflowY: 'auto',
            border: 'none',
            borderInlineEnd: 'none',
          }}
        >
          {isMobile && !collapsed && (
            <div className="px-4 pt-2 pb-3">
              <div
                className="rounded-lg p-3"
                style={{
                  background: isDarkMode ? '#111827' : '#f4f5fa',
                  border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar size={38} className="flex items-center justify-center flex-shrink-0" style={{ backgroundColor: mainPrimaryColor }}>
                    {(user?.firstName?.[0] || 'U').toUpperCase()}
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <Text className="block font-semibold truncate">{fullName || 'User'}</Text>
                    <Text className="block text-xs text-gray-500 truncate">{email}</Text>
                  </div>
                </div>
              </div>
            </div>
          )}
          <Menu
            mode="inline"
            selectedKeys={getSelectedKeys()}
            openKeys={openKeys}
            onOpenChange={handleOnOpenChange}
            className="border-none custom-menu rounded-[8px] h-full  text-[#1e293b]"
            onClick={handleMenuClick}
            items={menuItems}
            style={menuStyles}
          />
        </div>

        {/* Docs Help Strip (fixed, just above user profile) */}
        <Tooltip title={collapsed ? 'Help Documents' : ''} placement="right">
          <div
            role="button"
            tabIndex={0}
            onClick={() => window.open(docsUrl || import.meta.env.VITE_DOCS_URL, '_blank', 'noopener,noreferrer')}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') window.open(docsUrl || import.meta.env.VITE_DOCS_URL, '_blank', 'noopener,noreferrer');
            }}
            className={`flex items-center gap-2.5 z-50 cursor-pointer transition-colors ${collapsed ? 'px-[18px] py-3 justify-center' : 'px-3 py-2.5'}`}
            style={{
              position: 'fixed',
              left: 0,
              bottom: 57,
              width: activeSiderWidth,
              transition: 'width 0.3s',
              backgroundColor: SIDEBAR_FOOTER_BG,
              borderTop: `1px solid ${isDarkMode ? '#2a2a2a' : '#f0f0f0'}`,
              height: 44,
            }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = isDarkMode ? '#1e293b' : '#eff6ff')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = SIDEBAR_FOOTER_BG)}
          >
            <Icons.BookOutlined
              style={{
                fontSize: 16,
                color: docsUrl ? mainPrimaryColor : isDarkMode ? '#6b7280' : '#9ca3af',
                flexShrink: 0,
              }}
            />
            {!collapsed && (
              <div className="flex items-center justify-between w-full min-w-0">
                <span className="text-[12.5px] font-medium truncate" style={{ color: isDarkMode ? '#d1d5db' : '#374151' }}>
                  Help Documents
                </span>
                <Icons.LinkOutlined style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0 }} />
              </div>
            )}
          </div>
        </Tooltip>

        {/* User Profile Section (fixed) */}
        <div
          role="button"
          tabIndex={0}
          onClick={e => {
            e.stopPropagation();
            e.preventDefault();
            navigate('/setting/my-profile');
            if (isMobile && typeof setCollapsed === 'function') setCollapsed(true);
          }}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation();
              e.preventDefault();
              navigate('/setting/my-profile');
              if (isMobile && typeof setCollapsed === 'function') setCollapsed(true);
            }
          }}
          className={`flex items-center gap-2.5 z-50 cursor-pointer hover:bg-gray-50 transition-colors ${collapsed ? 'px-3 py-3' : 'px-3 py-2.5'}`}
          style={{
            position: 'fixed',
            left: 0,
            bottom: 0,
            width: activeSiderWidth,
            transition: 'width 0.3s',
            backgroundColor: SIDEBAR_FOOTER_BG,
            borderTop: `1px solid ${isDarkMode ? '#2a2a2a' : '#f0f0f0'}`,
          }}
        >
          <Avatar size={29} className="flex-shrink-0 text-sm uppercase" style={{ background: mainPrimaryColor, color: '#fff' }}>
            {user?.firstName?.[0] || 'U'}
          </Avatar>

          {!collapsed && (
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-medium text-[12.5px] truncate max-w-[140px] text-gray-800">
                  {user?.firstName} {user?.lastName}
                </span>
                <span className="text-[11px] truncate max-w-[140px] text-gray-500">{profile?.name}</span>
              </div>

              {supportModule && (
                <Tooltip title="Support">
                  <SupportIcon
                    onClick={e => {
                      e.stopPropagation();
                      e.preventDefault();
                      navigate('/support');
                      if (isMobile && typeof setCollapsed === 'function') setCollapsed(true);
                    }}
                    style={{ fontSize: 17, color: isDarkMode ? '#e5e7eb' : '#6b7280' }}
                  />
                </Tooltip>
              )}
            </div>
          )}
        </div>

        <style>{`
        /* Top-level Category Submenu Titles */
        .ant-menu-light .ant-menu-submenu-title {
          color: ${isDarkMode ? '#cbd5e1' : '#334155'} !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          height: 36px !important;
          line-height: 36px !important;
          border-radius: 6px !important;
          margin: 2px 4px !important;
          width: calc(100% - 8px) !important;
        }

        /* Top-level Category Icons */
        .ant-menu-light .ant-menu-submenu-title .anticon {
          color: ${isDarkMode ? '#cbd5e1' : '#334155'} !important;
          font-size: 15px !important;
        }

        /* Category Expand Arrow Icon */
        .ant-menu-light .ant-menu-submenu-title .ant-menu-submenu-arrow {
          color: ${isDarkMode ? '#94a3b8' : '#64748b'} !important;
        }

        /* Category Title Hover */
        .ant-menu-light .ant-menu-submenu-title:hover {
          background-color: ${isDarkMode ? '#374151' : 'rgba(87, 100, 122, 0.08)'} !important;
          color: ${isDarkMode ? '#ffffff' : '#1e293b'} !important;
        }

        .ant-menu-light .ant-menu-submenu-title:hover .anticon,
        .ant-menu-light .ant-menu-submenu-title:hover .ant-menu-submenu-arrow {
          color: ${isDarkMode ? '#ffffff' : '#1e293b'} !important;
        }

        /* Top-level Single Items (without children) */
        .ant-menu-light > .ant-menu-item {
          color: ${isDarkMode ? '#cbd5e1' : '#334155'} !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.05em !important;
          height: 36px !important;
          line-height: 36px !important;
          border-radius: 6px !important;
          margin: 2px 4px !important;
          width: calc(100% - 8px) !important;
        }

        .ant-menu-light > .ant-menu-item .anticon {
          color: ${isDarkMode ? '#cbd5e1' : '#334155'} !important;
          font-size: 15px !important;
        }

        /* Sub-items (Child Menu Items inside expanded categories) */
        .ant-menu-light .ant-menu-sub .ant-menu-item {
          color: ${isDarkMode ? '#d1d5db' : '#2d3748'} !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          text-transform: none !important;
          letter-spacing: normal !important;
          height: 34px !important;
          line-height: 34px !important;
          border-radius: 6px !important;
          margin: 1px 4px !important;
          width: calc(100% - 8px) !important;
          padding-inline-start: 38px !important;
        }
        @media (max-width: 768px) {
          .ant-menu-light .ant-menu-sub .ant-menu-item {
            padding-inline-start: 30px !important;
          }
        }
        .ant-menu-submenu-popup .ant-menu-sub .ant-menu-item {
          padding-inline-start: 14px !important;
        }

        .ant-menu-light .ant-menu-sub .ant-menu-item .anticon {
          color: ${isDarkMode ? '#94a3b8' : '#57647a'} !important;
          font-size: 14px !important;
        }

        /* Selected Sub-item */
        .ant-menu-light .ant-menu-sub .ant-menu-item-selected,
        .ant-menu-light > .ant-menu-item-selected {
          background-color: ${mainPrimaryColor} !important;
          color: #ffffff !important;
          font-weight: 600 !important;
        }

        .ant-menu-light .ant-menu-sub .ant-menu-item-selected .anticon,
        .ant-menu-light > .ant-menu-item-selected .anticon {
          color: #ffffff !important;
        }

        /* Selected item hover */
        .ant-menu-light .ant-menu-item-selected:hover {
          background-color: ${mainPrimaryColor} !important;
          color: #ffffff !important;
        }

        /* Selected submenu parent */
        .ant-menu-light .ant-menu-submenu-selected > .ant-menu-submenu-title {
          color: ${isDarkMode ? '#ffffff' : '#1e293b'} !important;
          font-weight: 600 !important;
        }

        /* Title content font */
        .ant-menu-light .ant-menu-item .ant-menu-title-content,
        .ant-menu-light .ant-menu-submenu-title .ant-menu-title-content {
          font-weight: inherit !important;
        }

        .ant-menu-inline .sidebar-label-with-add {
          display: flex;
          align-items: center;
          width: 100%;
          min-width: 0;
        }
        .ant-menu-inline .sidebar-label-text {
          flex: 1 1 auto;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .sidebar-quick-add {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex: 0 0 auto;
          width: 0;
          height: 20px;
          overflow: hidden;
          opacity: 0;
          border-radius: 4px;
          color: inherit;
          vertical-align: middle;
          transition: width 0.15s ease, opacity 0.15s ease, background-color 0.15s ease;
        }
        .ant-menu-item:hover .sidebar-quick-add {
          width: 20px;
          margin-left: 6px;
          opacity: 0.85;
        }
        .sidebar-quick-add:hover {
          opacity: 1 !important;
          background-color: rgba(0, 0, 0, 0.06);
        }
        .ant-menu-item-selected .sidebar-quick-add:hover {
          background-color: rgba(255, 255, 255, 0.2);
        }
      `}</style>
      </Sider>
    </>
  );
};

export default AppSidebar;
