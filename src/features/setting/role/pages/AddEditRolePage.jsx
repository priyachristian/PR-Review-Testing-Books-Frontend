import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

// Components
import { Checkbox, Form, Input, Spin, Switch } from '@/components/AntDComponent';
import CustomButton from '@/components/ui/button/CustomButton';
import Toast from '@/components/ui/common/Toast';

// Hooks
import { useAuth } from 'hooks/useAuth';
import { useModule } from 'hooks/useModule';
import useModulePermissions from 'hooks/useModulePermissions';

// Extras
import { useRole } from '@/features/setting/role';
import { ALL_STATIC_MODULES, RESOURCES, STATICANALYTICSROUTEMODULES, STATICROUTEMODULES } from '@/utils/jsonFile';
import { setLoading } from '@/features/setting/role/role.slice';
import { shouldPreventNavigation } from '@/utils/util';
import { COMPANY_FEATURE } from 'utils/constants';
import BackButton from '@/components/ui/button/BackButton';
import { ADMIN_ROUTE_PATHS } from '@/routes/adminRoutePaths';

const ROLES_PATH = `/${ADMIN_ROUTE_PATHS.setting.roles.root}`;
const SETTINGS_HEADER_HEIGHT = 57;

const getScrollParent = element => {
  let parent = element?.parentElement;
  while (parent) {
    const { overflowY } = window.getComputedStyle(parent);
    if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
};

const AddEditRolePage = () => {
  const navigate = useNavigate();
  const { roleId } = useParams();
  const location = useLocation();
  const mode = roleId ? 'edit' : (location.state?.mode ?? 'add');
  const initialRole = location.state?.initialRole ?? null;
  const handleClose = () => navigate(ROLES_PATH);

  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const { loading, role, error, createRole, updateRole, resetRole, getRoleById } = useRole();
  const copyRoleId = mode === 'copy' ? initialRole?.id || initialRole?._id : null;
  const initialValues = roleId || mode === 'copy' ? role : initialRole;
  const { permissionModules: modules, loading: modulesLoading, getModuleList } = useModule();
  const { isBlocked } = useModulePermissions(RESOURCES.ROLES);
  const { signin } = useAuth();
  const [tableData, setTableData] = React.useState([]);
  const [notAllowedModules, setNotAllowedModules] = useState([]);
  const [isSticky, setIsSticky] = useState(false);
  const tableStartRef = useRef(null);
  const tableEndRef = useRef(null);
  const tableWrapperRef = useRef(null);
  const normalTableRef = useRef(null);
  const [stickyHeaderStyle, setStickyHeaderStyle] = useState({});
  const [columnWidths, setColumnWidths] = useState([]);

  const isSplitWise = signin?.company?.companyFeatures?.includes(COMPANY_FEATURE?.ENABLESPLITBYQTYORPRICE);

  useEffect(() => {
    const update = () => {
      const wrapper = tableWrapperRef.current;
      const table = normalTableRef.current;

      if (wrapper) {
        const { left, width } = wrapper.getBoundingClientRect();
        setStickyHeaderStyle({ left: `${left}px`, width: `${width}px` });
      }

      if (table && !modulesLoading) {
        const ths = table.querySelectorAll('thead th');
        if (ths.length === 7) {
          setColumnWidths(Array.from(ths).map(th => `${th.getBoundingClientRect().width}px`));
        }
      }

      const start = tableStartRef.current?.getBoundingClientRect().top ?? 0;
      const end = tableEndRef.current?.getBoundingClientRect().top ?? 0;
      setIsSticky(start <= SETTINGS_HEADER_HEIGHT && end > SETTINGS_HEADER_HEIGHT);
    };

    update();

    const observer = new ResizeObserver(update);
    tableWrapperRef.current && observer.observe(tableWrapperRef.current);
    normalTableRef.current && observer.observe(normalTableRef.current);

    const scrollParent = getScrollParent(tableWrapperRef.current);
    scrollParent?.addEventListener('scroll', update, { passive: true });
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });

    return () => {
      scrollParent?.removeEventListener('scroll', update);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      observer.disconnect();
    };
  }, [tableData, modulesLoading]);

  const standaloneParentKeyMap = {
    inventoryConfigParent: 'inventory config',
    otherSettingsParent: 'other settings',
    ...(isSplitWise ? { splitConfigParent: 'split config' } : {}),
  };

  const isParentEnabled = parentKey => {
    return tableData.some(p => {
      if (!p.isStaticParent) return false;

      if (p.name?.toLowerCase() === parentKey) {
        return p.permissions?.view === true;
      }

      // Check by standalone parent key mapping (for Inventory Config, Other Settings)
      if (standaloneParentKeyMap[p.key] === parentKey) {
        return p.permissions?.view === true;
      }

      return false;
    });
  };

  if (isBlocked) {
    navigate('/');
  }

  function flattenData(items, level = 0) {
    let rows = [];

    items.forEach(item => {
      const hasChildren = item.subItems && item.subItems.length > 0;
      const itemNameLower = item.name?.toLowerCase();
      const isInPlan = item?.isInPlan !== undefined ? item.isInPlan : true;

      const staticSubModules = ALL_STATIC_MODULES.filter(sm => sm.parentKey === itemNameLower);
      const hasStaticChildren = staticSubModules.length > 0;

      const isStaticParent = hasStaticChildren && !hasChildren;

      rows.push({
        key: item.key,
        name: item.name,
        level,
        permissions: item.permissions || {},
        hasChildren: hasChildren || hasStaticChildren,
        isAllowed: hasChildren ? item?.subItems?.length === item?.subItems?.filter(x => x?.isAllowed === true)?.length : item.isAllowed,
        isStaticParent,
        permissionType: isStaticParent ? (itemNameLower === 'reports' ? 'viewExport' : 'viewOnly') : undefined,
        isInPlan,
      });

      if (hasChildren) {
        rows = rows.concat(flattenData(item.subItems, level + 1));
      }
    });

    return rows;
  }

  const STANDALONE_STATIC_PARENTS = [
    {
      key: 'inventoryConfigParent',
      name: 'Inventory Config',
      parentKey: 'inventory config',
      permissionType: 'headerOnly',
    },
    {
      key: 'otherSettingsParent',
      name: 'Other Settings',
      parentKey: 'other settings',
      permissionType: 'headerOnly',
    },
    ...(isSplitWise
      ? [
          {
            key: 'splitConfigParent',
            name: 'Split Config',
            parentKey: 'split config',
            permissionType: 'headerOnly',
          },
        ]
      : []),
  ];

  function appendStaticModules(flatData) {
    const result = [];
    const existingParentKeys = new Set();

    flatData.forEach(item => {
      result.push(item);

      if (item.isStaticParent) {
        const parentKey = item.name?.toLowerCase();
        existingParentKeys.add(parentKey);

        const staticSubModules = ALL_STATIC_MODULES.filter(sm => sm.parentKey === parentKey);

        staticSubModules.forEach(sm => {
          result.push({
            key: sm.key,
            name: sm.moduleName,
            level: item.level + 1,
            permissions: getDefaultPermissionsForType(sm.permissionType),
            hasChildren: false,
            isAllowed: true,
            isStaticModule: true,
            permissionType: sm.permissionType,
            parentKey: sm.parentKey,
          });
        });
      }
    });

    STANDALONE_STATIC_PARENTS.forEach(parent => {
      if (!existingParentKeys.has(parent.parentKey)) {
        result.push({
          key: parent.key,
          name: parent.name,
          level: 0,
          permissions: { view: false },
          hasChildren: true,
          isAllowed: true,
          isStaticParent: true,
          permissionType: parent.permissionType,
        });

        const staticSubModules = ALL_STATIC_MODULES.filter(sm => sm.parentKey === parent.parentKey);

        staticSubModules.forEach(sm => {
          result.push({
            key: sm.key,
            name: sm.moduleName,
            level: 1,
            permissions: getDefaultPermissionsForType(sm.permissionType),
            hasChildren: false,
            isAllowed: true,
            isStaticModule: true,
            permissionType: sm.permissionType,
            parentKey: sm.parentKey,
          });
        });

        if (parent.parentKey === 'split config' && isSplitWise) {
          result.push({
            key: 'splitConfig',
            name: 'Split Config',
            level: 1,
            permissions: getDefaultPermissionsForType('viewEdit'),
            hasChildren: false,
            isAllowed: true,
            isStaticModule: true,
            permissionType: 'viewEdit',
            parentKey: 'split config',
          });
        }
      }
    });

    return result;
  }

  function getDefaultPermissionsForType(permissionType) {
    switch (permissionType) {
      case 'viewExport':
        return { view: false, export: false };
      case 'viewOnly':
        return { view: false };
      case 'viewEdit':
        return { view: false, edit: false };
      case 'crud':
        return { view: false, create: false, edit: false, delete: false };
      default:
        return { view: false, create: false, edit: false, delete: false };
    }
  }

  function addPermissionsRecursive(items) {
    return items.map(item => {
      const hasChildren = item.subItems && item.subItems.length > 0;

      const newItem = {
        ...item,
        isInPlan: item?.isInPlan !== undefined ? item.isInPlan : true,
      };

      if (hasChildren) {
        newItem.subItems = addPermissionsRecursive(item.subItems);
      } else {
        newItem.key = item._id;
        newItem.module = item._id;
        newItem.moduleName = item.name;
        newItem.fullAccess = false;
        newItem.view = false;
        newItem.create = false;
        newItem.edit = false;
        newItem.delete = false;
        newItem.isAllowed = item?.isAllowed !== undefined ? item?.isAllowed : true;
        newItem.subItems = [];
      }

      return newItem;
    });
  }

  useEffect(() => {
    if (!modulesLoading && modules.length > 0) {
      const initialTableData = addPermissionsRecursive(modules);
      let data = flattenData(initialTableData);
      let allowedData = data.filter(item => item.isAllowed !== false);
      let notAllowedData = data.filter(item => item.isAllowed === false && item.hasChildren === false && !item.isStaticModule);
      // Append static modules after filtering (preserves API order)
      allowedData = appendStaticModules(allowedData);
      setNotAllowedModules(notAllowedData);
      setTableData(allowedData);
    }
  }, [modules, modulesLoading]);

  useEffect(() => {
    getModuleList({});
  }, [dispatch]);

  const getStaticPermissionsFromInitialValues = (module, initialValues) => {
    const reports = initialValues?.reportsPermissions ?? {};
    const analytics = initialValues?.analyticsPermissions ?? {};
    const inventoryConfig = initialValues?.inventoryConfig ?? {};
    const otherSettings = initialValues?.otherSettings ?? {};
    const splitConfig = initialValues?.splitConfig ?? {};

    switch (module.parentKey) {
      case 'reports':
        return {
          view: reports[module.key]?.view || false,
          export: reports[module.key]?.export || false,
        };
      case 'analytics':
        return {
          view: analytics[module.key]?.view || false,
        };
      case 'inventory config':
        return {
          view: inventoryConfig?.view || false,
          edit: inventoryConfig?.edit || false,
        };
      case 'split config':
        return {
          view: splitConfig?.view || false,
          edit: splitConfig?.edit || false,
        };
      case 'other settings':
        if (module.permissionType === 'crud') {
          return {
            view: otherSettings[module.key]?.view || false,
            create: otherSettings[module.key]?.add || false,
            edit: otherSettings[module.key]?.update || false,
            delete: otherSettings[module.key]?.delete || false,
          };
        }
        return {
          view: otherSettings[module.key]?.view || false,
          edit: otherSettings[module.key]?.edit || false,
        };
      default:
        return module.permissions;
    }
  };

  const getStandaloneParentPermissions = () => {
    return { view: false };
  };

  useEffect(() => {
    if (!modulesLoading && initialValues && modules?.length > 0) {
      const initialTableData = addPermissionsRecursive(modules);
      let data = flattenData(initialTableData);
      let allowedData = data.filter(item => item.isAllowed !== false);
      let notAllowedData = data.filter(item => item.isAllowed === false && item.hasChildren === false && !item.isStaticModule);
      allowedData = appendStaticModules(allowedData);

      const standaloneParentKeys = ['inventoryConfigParent', 'otherSettingsParent', ...(isSplitWise ? ['splitConfigParent'] : [])];

      const tableValue = allowedData?.map(module => {
        if (module.isStaticModule) {
          return {
            ...module,
            permissions: getStaticPermissionsFromInitialValues(module, initialValues),
          };
        }

        if (module.isStaticParent && standaloneParentKeys.includes(module.key)) {
          return {
            ...module,
            permissions: getStandaloneParentPermissions(),
          };
        }

        if (module.isStaticParent) {
          const existingPermission = initialValues.permissions.find(permission => permission?.module === module.key || permission?.module?.id === module.key);

          let exportValue = existingPermission?.export || false;
          if (module.name?.toLowerCase() === 'reports') {
            const reportsPerms = initialValues?.reportsPermissions ?? {};
            exportValue = Object.values(reportsPerms).some(p => p?.export === true);
          }

          return {
            ...module,
            permissions: {
              view: existingPermission?.view || false,
              export: exportValue,
              create: existingPermission?.create || false,
              edit: existingPermission?.edit || false,
              delete: existingPermission?.delete || false,
            },
          };
        }

        // Handle standard modules
        const existingPermission = initialValues.permissions.find(permission => permission?.module === module.key || permission?.module?.id === module.key);
        const view = module.isInPlan ? existingPermission?.view || false : false;
        const create = module.isInPlan ? existingPermission?.create || false : false;
        const edit = module.isInPlan ? existingPermission?.edit || false : false;
        const deletePermission = module.isInPlan ? existingPermission?.delete || false : false;

        return {
          ...module,
          permissions: {
            create,
            view,
            edit,
            delete: deletePermission,
          },
        };
      });
      if (mode === 'copy') {
        setTableData(tableValue);
        setNotAllowedModules(notAllowedData);
      } else if (mode === 'edit') {
        form.setFieldsValue({
          role: initialValues.role,
          description: initialValues.description,
          isAccountant: initialValues.isAccountant,
        });
        setTableData(tableValue);
        setNotAllowedModules(notAllowedData);
      }
    }
  }, [initialValues, form, mode, modules, modulesLoading, isSplitWise]);

  useEffect(() => {
    if (error) {
      Toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    const controller = new AbortController();
    if (roleId) {
      getRoleById(roleId);
    } else if (copyRoleId) {
      getRoleById(copyRoleId);
    } else {
      resetRole();
    }

    return () => {
      resetRole();
      controller.abort();
    };
  }, [roleId, copyRoleId]);

  const shouldShowPermission = (record, permissionKey) => {
    if (record?.isStaticParent) {
      const permissionType = record.permissionType || 'viewOnly';
      switch (permissionType) {
        case 'viewExport':
          return ['view', 'export'].includes(permissionKey);
        case 'viewOnly':
          return permissionKey === 'view';
        case 'headerOnly':
          return false;
        default:
          return permissionKey === 'view';
      }
    }

    if (record?.hasChildren && !record?.isStaticParent) return false;

    const permissionType = record.permissionType || 'standard';

    switch (permissionType) {
      case 'viewExport':
        return ['view', 'export'].includes(permissionKey);
      case 'viewOnly':
        return permissionKey === 'view';
      case 'viewEdit':
        return ['view', 'edit'].includes(permissionKey);
      case 'crud':
        return ['view', 'create', 'edit', 'delete'].includes(permissionKey);
      case 'headerOnly':
        return false;
      default: // 'standard'
        return ['view', 'create', 'edit', 'delete'].includes(permissionKey);
    }
  };

  // Check if Full Access should be shown
  const shouldShowFullAccess = record => {
    // Static parents don't show full access
    if (record?.isStaticParent) return false;
    // Regular parents with children don't show full access
    if (record?.hasChildren) return false;
    const permissionType = record.permissionType || 'standard';
    // Full access only for standard and crud types
    return permissionType === 'standard' || permissionType === 'crud';
  };

  // Check if all permissions are enabled for full access
  const isFullAccessEnabled = (permissions, permissionType) => {
    switch (permissionType) {
      case 'viewExport':
        return permissions.view && permissions.export;
      case 'viewOnly':
        return permissions.view;
      case 'viewEdit':
        return permissions.view && permissions.edit;
      case 'crud':
      default:
        return permissions.create && permissions.view && permissions.edit && permissions.delete;
    }
  };

  // Check if a specific permission for a static module's child should be disabled
  // For Reports: View and Export are controlled separately by parent's View and Export switches
  const isStaticModulePermissionDisabled = (record, permissionKey) => {
    if (!record.isStaticModule) return false;

    // For Inventory Config, Split Config, and Other Settings children, always enabled (no parent switch)
    if (record.parentKey === 'inventory config' || record.parentKey === 'split config' || record.parentKey === 'other settings') {
      return false;
    }

    // For Reports children: check the specific parent permission
    if (record.parentKey === 'reports') {
      const reportsParent = tableData.find(p => p.isStaticParent && p.name?.toLowerCase() === 'reports');
      if (!reportsParent) return true;

      // View column is disabled if parent's View is OFF
      // Export column is disabled if parent's Export is OFF
      if (permissionKey === 'view') {
        return !reportsParent.permissions?.view;
      }
      if (permissionKey === 'export') {
        return !reportsParent.permissions?.export;
      }
      return false;
    }

    // For Analytics: just check parent view
    return !isParentEnabled(record.parentKey);
  };

  const handleToggle = (key, action, value) => {
    setTableData(prevData => {
      const toggledItem = prevData.find(item => item.key === key);
      if (toggledItem?.isInPlan === false) return prevData;
      const isStaticParent = toggledItem?.isStaticParent;
      const isStaticModule = toggledItem?.isStaticModule;

      let parentMatchKey = toggledItem?.name?.toLowerCase();
      if (standaloneParentKeyMap[toggledItem?.key]) {
        parentMatchKey = standaloneParentKeyMap[toggledItem.key];
      }

      return prevData.map(item => {
        if (item.key === key) {
          const updatedPermissions = {
            ...item.permissions,
            [action]: value,
          };

          if (value) {
            if (action === 'create' && shouldShowPermission(item, 'view')) {
              updatedPermissions.view = true;
            } else if (action === 'edit') {
              if (shouldShowPermission(item, 'view')) updatedPermissions.view = true;
              if (shouldShowPermission(item, 'create')) updatedPermissions.create = true;
            } else if (action === 'delete') {
              if (shouldShowPermission(item, 'view')) updatedPermissions.view = true;
              if (shouldShowPermission(item, 'create')) updatedPermissions.create = true;
              if (shouldShowPermission(item, 'edit')) updatedPermissions.edit = true;
            }
          }

          return {
            ...item,
            permissions: updatedPermissions,
          };
        }

        if (isStaticModule && toggledItem?.parentKey === 'reports' && action === 'export' && value === true && item.isStaticParent && item.name?.toLowerCase() === 'reports') {
          return {
            ...item,
            permissions: {
              ...item.permissions,
              export: true,
            },
          };
        }

        if (isStaticParent && value === false && item.isStaticModule && item.parentKey === parentMatchKey) {
          if (parentMatchKey === 'reports') {
            if (action === 'view' || action === 'export') {
              return {
                ...item,
                permissions: {
                  ...item.permissions,
                  [action]: false,
                },
              };
            }
          } else if (parentMatchKey === 'analytics' && action === 'view') {
            return {
              ...item,
              permissions: {
                ...item.permissions,
                view: false,
              },
            };
          }
        }

        return item;
      });
    });
  };

  const handleFullAccess = (key, isFullAccess, permissionType = 'standard') => {
    setTableData(prevData => {
      const toggledItem = prevData.find(item => item.key === key);
      if (toggledItem?.isInPlan === false) return prevData;
      const isStaticParent = toggledItem?.isStaticParent;

      let parentMatchKey = toggledItem?.name?.toLowerCase();
      if (standaloneParentKeyMap[toggledItem?.key]) {
        parentMatchKey = standaloneParentKeyMap[toggledItem.key];
      }

      return prevData.map(item => {
        if (item.key === key) {
          let newPermissions;
          switch (permissionType) {
            case 'viewExport':
              newPermissions = { view: isFullAccess, export: isFullAccess };
              break;
            case 'viewOnly':
              newPermissions = { view: isFullAccess };
              break;
            case 'viewEdit':
              newPermissions = { view: isFullAccess, edit: isFullAccess };
              break;
            case 'crud':
            default:
              newPermissions = {
                create: isFullAccess,
                view: isFullAccess,
                edit: isFullAccess,
                delete: isFullAccess,
              };
          }
          return {
            ...item,
            permissions: newPermissions,
          };
        }

        // If toggling a static parent's full access OFF, reset all its static children
        if (isStaticParent && isFullAccess === false && item.isStaticModule && item.parentKey === parentMatchKey) {
          return {
            ...item,
            permissions: getDefaultPermissionsForType(item.permissionType),
          };
        }

        return item;
      });
    });
  };

  const onFinish = async values => {
    if (loading) return;
    dispatch(setLoading(true));

    const standardModules = tableData.filter(item => !item.hasChildren && !item.isStaticModule && !item.isStaticParent);
    const staticParentModules = tableData.filter(item => item.isStaticParent);
    const staticModules = tableData.filter(item => item.isStaticModule);

    const standaloneParentKeys = ['inventoryConfigParent', 'otherSettingsParent', ...(isSplitWise ? ['splitConfigParent'] : [])];

    let permissions = [
      ...standardModules.map(item => ({
        module: item.key,
        view: item.isInPlan ? item?.permissions?.view || false : false,
        create: item.isInPlan ? item?.permissions?.create || false : false,
        edit: item.isInPlan ? item?.permissions?.edit || false : false,
        delete: item.isInPlan ? item?.permissions?.delete || false : false,
      })),
      ...staticParentModules
        .filter(item => !standaloneParentKeys.includes(item.key))
        .map(item => ({
          module: item.key,
          view: item?.permissions?.view || false,
          create: item?.permissions?.create || false,
          edit: item?.permissions?.edit || false,
          delete: item?.permissions?.delete || false,
        })),
    ];

    permissions = [
      ...permissions,
      ...notAllowedModules.map(module => ({
        module: module.key,
        view: false,
        create: false,
        edit: false,
        delete: false,
      })),
    ];

    const getStaticModulePermissions = key => {
      const module = staticModules.find(m => m.key === key);
      return module?.permissions || {};
    };

    const reportsPermissions = STATICROUTEMODULES.reduce((acc, item) => {
      const perms = getStaticModulePermissions(item.key);
      acc[item.key] = {
        view: perms.view || false,
        export: perms.export || false,
      };
      return acc;
    }, {});

    const analyticsPermissions = STATICANALYTICSROUTEMODULES.reduce((acc, item) => {
      const perms = getStaticModulePermissions(item.key);
      acc[item.key] = {
        view: perms.view || false,
        export: false,
      };
      return acc;
    }, {});

    const inventoryConfigPerms = getStaticModulePermissions('inventoryConfig');
    const inventoryConfig = {
      view: inventoryConfigPerms.view || false,
      edit: inventoryConfigPerms.edit || false,
    };

    const additionalChargesPerms = getStaticModulePermissions('additionalChargesConfig');
    const defaultOrgPerms = getStaticModulePermissions('defaultOrganizationConfig');
    const discountPerms = getStaticModulePermissions('discountConfig');
    const incentivePerms = getStaticModulePermissions('incentive');
    const paymentTermsPerms = getStaticModulePermissions('paymentTerms');
    const itemUnitPerms = getStaticModulePermissions('itemUnit');
    const productionWarehouseConfigPerms = getStaticModulePermissions('productionDepartmentWarehouseConfig');
    const directTaxesPerms = getStaticModulePermissions('directTaxes');

    const otherSettings = {
      additionalChargesConfig: {
        view: additionalChargesPerms.view || false,
        add: additionalChargesPerms.create || false,
        update: additionalChargesPerms.edit || false,
        delete: additionalChargesPerms.delete || false,
      },
      defaultOrganizationConfig: {
        view: defaultOrgPerms.view || false,
        edit: defaultOrgPerms.edit || false,
      },
      discountConfig: {
        view: discountPerms.view || false,
        edit: discountPerms.edit || false,
      },
      incentive: {
        view: incentivePerms.view || false,
        add: incentivePerms.create || false,
        update: incentivePerms.edit || false,
        delete: incentivePerms.delete || false,
      },
      paymentTerms: {
        view: paymentTermsPerms.view || false,
        add: paymentTermsPerms.create || false,
        update: paymentTermsPerms.edit || false,
        delete: paymentTermsPerms.delete || false,
      },
      itemUnit: {
        view: itemUnitPerms.view || false,
        add: itemUnitPerms.create || false,
        update: itemUnitPerms.edit || false,
        delete: itemUnitPerms.delete || false,
      },
      productionDepartmentWarehouseConfig: {
        view: productionWarehouseConfigPerms.view || false,
        add: productionWarehouseConfigPerms.create || false,
        update: productionWarehouseConfigPerms.edit || false,
        delete: productionWarehouseConfigPerms.delete || false,
      },
      directTaxes: {
        view: directTaxesPerms.view || false,
        add: directTaxesPerms.create || false,
        update: directTaxesPerms.edit || false,
        delete: directTaxesPerms.delete || false,
      },
    };

    const roleData = {
      role: values.role,
      description: values.description,
      isAccountant: values?.isAccountant || false,
      permissions,
      reportsPermissions,
      analyticsPermissions,
      inventoryConfig,
      otherSettings,
    };

    // Add splitConfig if user has split feature access
    if (isSplitWise) {
      const splitConfigPerms = getStaticModulePermissions('splitConfig');
      roleData.splitConfig = {
        view: splitConfigPerms.view || false,
        edit: splitConfigPerms.edit || false,
      };
    }

    try {
      const result = mode === 'edit' ? await updateRole({ id: initialValues.id, ...roleData }) : await createRole(roleData);
      if (shouldPreventNavigation(result)) {
        return;
      }
      handleClose();
    } finally {
      dispatch(setLoading(false));
    }
  };

  const getFormTitle = () => {
    switch (mode) {
      case 'add':
        return 'Add Role';
      case 'edit':
        return 'Edit Role';
      case 'copy':
        return 'Add Role (Copied)';
      default:
        return 'Role Form';
    }
  };
  // Handle back navigation
  const handleBack = () => {
    handleClose();
  };

  const isModuleAccessible = record => (Object.prototype.hasOwnProperty.call(record, 'isInPlan') ? record.isInPlan : true);

  return (
    <>
      <div className=" bg-white">
        <div className="flex items-center gap-3 border-b py-3 px-2">
          <BackButton onClick={handleBack} />
          <h2 className="text-[18px] font-semibold text-gray-900">{getFormTitle()}</h2>
        </div>
      </div>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        onFinishFailed={({ errorFields }) => Toast.error(errorFields?.[0]?.errors?.[0] || 'Please fill all the required fields to proceed further')}
        scrollToFirstError={{ behavior: 'smooth', block: 'center' }}
        className="p-6 rounded-lg my-container mb-20"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Form.Item name="role" label="Role Name" className="[&.ant-form-item-has-error]:pb-3" rules={[{ required: true, message: 'Please input the role name!' }]}>
            <Input placeholder="Enter Role" />
          </Form.Item>
        </div>

        <Form.Item name="description" label="Description" className="pt-2 [&.ant-form-item-has-error]:pb-3" rules={[{ required: true, message: 'Please input the description!' }]}>
          <Input.TextArea placeholder="Enter Description" />
        </Form.Item>

        <Form.Item name="isAccountant" valuePropName="checked" className="pt-2">
          <Checkbox>This Role is for Accountant users</Checkbox>
        </Form.Item>
        <p className="text-sm text-gray-500 mb-4">If you mark this option, all users who are added with this role will be accountant user.</p>

        <div className="permission-table-wrapper" ref={tableWrapperRef}>
          <div ref={tableStartRef} className="h-[1px]" />
          <Spin spinning={modulesLoading}>
            <table className="permission-table" ref={normalTableRef}>
              <thead className={`transition-opacity duration-300 ${isSticky ? 'opacity-0' : 'opacity-100'}`}>
                <tr>
                  <th>Module Name</th>
                  <th>Full Access</th>
                  <th>View</th>
                  <th>Create</th>
                  <th>Edit</th>
                  <th>Delete</th>
                  <th>Export</th>
                </tr>
              </thead>

              <tbody>
                {tableData.map(record => (
                  <tr key={record.key}>
                    {/* Module Name */}
                    <td>
                      <div style={{ paddingLeft: record.level * 20 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{ fontWeight: record.hasChildren ? 600 : 400 }}>{record.name}</span>
                          {!isModuleAccessible(record) && <span style={{ fontSize: 12, color: '#6b7280' }}>(Upgrade your plan to get access)</span>}
                        </div>
                      </div>
                    </td>

                    {/* Full Access */}
                    <td align="center">
                      {shouldShowFullAccess(record) && (
                        <Switch
                          checked={isFullAccessEnabled(record.permissions, record.permissionType || 'standard')}
                          onChange={checked => handleFullAccess(record.key, checked, record.permissionType)}
                          disabled={
                            !isModuleAccessible(record) ||
                            isStaticModulePermissionDisabled(record, 'view') ||
                            isStaticModulePermissionDisabled(record, 'create') ||
                            isStaticModulePermissionDisabled(record, 'edit') ||
                            isStaticModulePermissionDisabled(record, 'delete')
                          }
                        />
                      )}
                    </td>

                    {/* View */}
                    <td align="center">
                      {shouldShowPermission(record, 'view') && (
                        <Switch
                          checked={record.permissions.view}
                          onChange={checked => handleToggle(record.key, 'view', checked)}
                          disabled={!isModuleAccessible(record) || isStaticModulePermissionDisabled(record, 'view')}
                        />
                      )}
                    </td>

                    {/* Create */}
                    <td align="center">
                      {shouldShowPermission(record, 'create') && (
                        <Switch
                          checked={record.permissions.create}
                          onChange={checked => handleToggle(record.key, 'create', checked)}
                          disabled={!isModuleAccessible(record) || isStaticModulePermissionDisabled(record, 'create')}
                        />
                      )}
                    </td>

                    {/* Edit */}
                    <td align="center">
                      {shouldShowPermission(record, 'edit') && (
                        <Switch
                          checked={record.permissions.edit}
                          onChange={checked => handleToggle(record.key, 'edit', checked)}
                          disabled={!isModuleAccessible(record) || isStaticModulePermissionDisabled(record, 'edit')}
                        />
                      )}
                    </td>

                    {/* Delete */}
                    <td align="center">
                      {shouldShowPermission(record, 'delete') && (
                        <Switch
                          checked={record.permissions.delete}
                          onChange={checked => handleToggle(record.key, 'delete', checked)}
                          disabled={!isModuleAccessible(record) || isStaticModulePermissionDisabled(record, 'delete')}
                        />
                      )}
                    </td>

                    {/* Export */}
                    <td align="center">
                      {shouldShowPermission(record, 'export') && (
                        <Switch
                          checked={record.permissions.export}
                          onChange={checked => handleToggle(record.key, 'export', checked)}
                          disabled={!isModuleAccessible(record) || isStaticModulePermissionDisabled(record, 'export')}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Spin>
          <div ref={tableEndRef} className="h-[1px]" />
        </div>
        <div
          className={`fixed z-50 transition-all duration-300 ease-out ${isSticky ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}`}
          style={{ top: SETTINGS_HEADER_HEIGHT, ...stickyHeaderStyle }}
        >
          <div className="relative w-full bg-white">
            <div className="w-full overflow-x-auto sticky-header-container" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <table className="permission-table" style={{ tableLayout: columnWidths.length === 7 ? 'fixed' : 'auto', width: '100%' }}>
                {columnWidths.length === 7 && (
                  <colgroup>
                    {columnWidths.map((width, index) => (
                      <col key={index} style={{ width }} />
                    ))}
                  </colgroup>
                )}
                <thead>
                  <tr>
                    <th>Module Name</th>
                    <th>Full Access</th>
                    <th>View</th>
                    <th>Create</th>
                    <th>Edit</th>
                    <th>Delete</th>
                    <th>Export</th>
                  </tr>
                </thead>
              </table>
            </div>
          </div>
        </div>
      </Form>
      <div className="flex items-center gap-5 py-[12.5px] px-12 border-t w-full bg-white fixed bottom-0 shadow-[0_-1px_10px_rgba(0,0,0,0.08)]">
        <CustomButton type="primary" text="Save" loading={loading} onClick={() => form.submit()} />

        <CustomButton text="Cancel" disabled={loading} onClick={handleClose} />
      </div>
    </>
  );
};

export default AddEditRolePage;
