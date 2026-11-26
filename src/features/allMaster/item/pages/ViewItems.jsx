import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

// Components
import ColumnSelection from '@/components/ui/common/ColumnSelection';
import StatusFilterTabs from '@/components/ui/common/StatusFilterTabs';
import FilterLockButton from '@/components/ui/common/FilterLockButton';
import FilterDrawer, { FilterSection, FilterButton } from '@/components/ui/common/FilterDrawer';
import CustomButton from '@/components/ui/button/CustomButton';
import PermissionButton from '@/components/ui/button/PermissionButton';
import FilterInput from '@/components/forms/formInput/FilterInput';
import CustomDatePicker from '@/components/forms/formDatePicker/CustomDatePicker';
import StatusConfirmPopover from '@/components/feedback/confirmModal/StatusConfirmPopover';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import { Button, Dropdown, Tag, Tooltip, Popconfirm } from '@/components/AntDComponent';
import ExportDataModal from '@/components/ui/common/ExportDataModal';
import Toast from '@/components/ui/common/Toast';

// Hooks
import { useFilters } from '@/utils/filtersUtils';
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import useModulePermissions from 'hooks/useModulePermissions';
import useDocumentListToolbar from '@/hooks/useDocumentListToolbar';
import useColumnResize from '@/hooks/useColumnResize';

// Extras
import { getAllFiltersFromLocalStorage } from '@/utils/filters';
import { colorPalette } from '@/utils/theme';
import Icons from 'assets/icons/icon';
import { FILTERS_KEYS, RESOURCES } from '@/utils/jsonFile';
import { configEnum, filterInputEnum, PERMISSION_MESSAGES } from 'utils/constants';
import { dateFormateForUi, getFromLocalStorage, getQueryParams, parsedTableCoulmns } from 'utils/services';
import { PAGE_HEADERS } from '@/utils/label';
import { useItemMaster, itemsColumn, itemExportColumn } from '@/features/allMaster/item';
import { useItemGroup } from '@/features/allMaster/itemGroup';
import { ITEM_TYPE_OPTIONS, ITEM_MASTER_STATUS_OPTIONS, ITEM_CATEGORY_OPTIONS } from '@/utils/dropdownEnums';
import { buildExportRows, downloadExcelExport, resolveExportFileName } from '@/utils/exportData';
import { isCanceledRequestError } from '@/utils/serviceHelper';
import { useHasCRMAccess, getCreatedFromExtraFilters } from '@/hooks/useHasCRMAccess';
import CreatedFromFilter from '@/components/forms/formInput/CreatedFromFilter';
import { buildItemGroupSelectOptions, itemGroupSelectColumnHeader } from '@/utils/tableSelectDropdown/itemGroupSelectDropdown';

const API_CALLED_ENUM = {
  ITEMGROUP_DROPDOWN: 'itemGroupDropdown',
};

const ViewItems = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { items, loading, pagination, getItems, getItemsExport, exportLoading, resetItems, toggleItemStatus, deleteItem } = useItemMaster();
  const { itemGroupDrop, itemGroupDropLoading, getItemGroupDropdown } = useItemGroup();
  const { isViewOnly, useModuleItem } = useModulePermissions(RESOURCES.ITEM_MASTER);
  const { useModuleItemAnalytics } = useModulePermissions(RESOURCES.ANALYTICS_PERMISSIONS.ITEM_ANALYTICS);
  const { useModuleGroupItemAnalytics } = useModulePermissions(RESOURCES.ANALYTICS_PERMISSIONS.GROUP_ITEM_ANALYTICS);
  const { useModuleTopItemsOfSales } = useModulePermissions(RESOURCES.ANALYTICS_PERMISSIONS.TOP_ITEMS_OF_SALES);
  const { useModuleTopItemOfPurchase } = useModulePermissions(RESOURCES.ANALYTICS_PERMISSIONS.TOP_ITEM_OF_PURCHASE);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilter, setShowFilter] = useState(false);
  const isApiCalledRef = useRef(false);
  const [openDropdownKey, setOpenDropdownKey] = useState(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const isApicalledRefFilter = useRef({
    itemGroupDropdown: false,
  });
  const FILTER_KEY = FILTERS_KEYS.ITEMS_ALL_FILTERS;
  const {
    filter,
    setFilter,
    isLocked,
    selectedPreset,
    setSelectedPreset,
    dateRange,
    setDateRange,
    updateUrlParams,
    handleFilter,
    handleSearch,
    handleClear,
    handleResetFilters,
    areSavedFiltersApplied,
    getActiveFiltersCount,
    handleLockToggle,
  } = useFilters({
    searchParams,
    setSearchParams,
    pagination,
    FILTER_KEY,
    setShowFilter,
    defaultFilter: {
      search: searchParams.get('search') || '',
      itemType: '',
      itemGroup: '',
      status: searchParams.get('status') ? searchParams.get('status').split(',') : '',
      category: searchParams.get('category') || '',
      appName: searchParams.get('appName') || '',
    },
    dateKeys: { startDate: 'startDate', endDate: 'endDate', singleDate: 'itemDate' },
  });

  const { hasCRMAccess, filterCreatedFromColumn } = useHasCRMAccess({
    pagination,
    filter,
    setFilter,
    updateUrlParams,
    searchParams,
    setShowFilter,
    dateKeys: { startDate: 'startDate', endDate: 'endDate', singleDate: 'itemDate' },
  });

  useResetOnUnmount(resetItems);

  const handleOnFocusApiCall = async type => {
    let obj = { ...isApicalledRefFilter.current };

    if (type === API_CALLED_ENUM.ITEMGROUP_DROPDOWN) {
      await getItemGroupDropdown({});
      obj.itemGroupDropdown = true;
    }

    isApicalledRefFilter.current = obj;
  };

  useEffect(() => {
    if (searchParams.get('itemGroup')) {
      handleOnFocusApiCall(API_CALLED_ENUM.ITEMGROUP_DROPDOWN);
    }
  }, [filter?.itemGroup]);

  const itemNavigationState = {
    prevFrom: location.pathname,
    historyStack: [...(location.state?.historyStack || []), location.pathname],
  };

  const handleViewClick = itemData => {
    navigate(`/item-master/${itemData?.id || itemData?._id}`, { state: itemNavigationState });
  };

  const handleRowClick = itemData => {
    navigate(`/item-master/${itemData?.id || itemData?._id}`, { state: itemNavigationState });
  };

  const handleEditClick = itemData => {
    navigate(`/item-master/${itemData?.id || itemData?._id}/edit`, { state: itemNavigationState });
  };

  const fetchItems = signal => {
    const page = parseInt(searchParams?.get('page')) || 1;
    const pageSize = parseInt(searchParams?.get('limit')) || pagination.limit;

    let payload = getQueryParams(window.location.href) || {};

    if (Object.keys(payload)?.length <= 0) {
      payload = { page, limit: pageSize };
    }

    getItems({
      ...payload,
      page,
      limit: pageSize,
      sortBy: searchParams.get('sortBy') || 'createdAt:desc',
      signal,
      status: searchParams.get('status') || '',
    });
  };

  const handlePaginationChange = (page, pageSize) => {
    updateUrlParams({ page, limit: pageSize });
  };

  const handleTableChange = (pagination, filters, sorter) => {
    let sortString = '';

    if (sorter && sorter.field && sorter.order) {
      const direction = sorter.order === 'ascend' ? 'asc' : 'desc';
      sortString = `${sorter.field}:${direction}`;
    }

    updateUrlParams({
      page: pagination.current,
      limit: pagination.pageSize,
      search: filter.search,
      sortBy: sortString,
    });
  };

  useEffect(() => {
    const savedFilters = getAllFiltersFromLocalStorage(FILTER_KEY);

    if (!isApiCalledRef.current && !searchParams.get('page') && !searchParams.get('limit')) {
      if (savedFilters && Object.keys(savedFilters).length > 0) {
        if (savedFilters.preset) {
          setSelectedPreset(savedFilters.preset);
        }
        if (savedFilters.startDate && savedFilters.endDate) {
          setDateRange([savedFilters.startDate, savedFilters.endDate]);
        } else if (savedFilters.itemDate) {
          setDateRange([savedFilters.itemDate, savedFilters.itemDate]);
        }

        setFilter(prev => ({
          ...prev,
          search: savedFilters.search ?? prev.search,
          itemType: savedFilters.itemType ? savedFilters?.itemType?.split(',') : prev.itemType,
          itemGroup: savedFilters.itemGroup ? savedFilters?.itemGroup?.split(',') : prev.itemGroup,
          status: savedFilters.status ? savedFilters?.status?.split(',') : prev.status,
          category: savedFilters.category ?? prev.category,
          appName: savedFilters.appName ?? prev.appName,
        }));

        if (!areSavedFiltersApplied(savedFilters)) {
          isApiCalledRef.current = true;
          updateUrlParams(savedFilters);
          return;
        }
      }
      isApiCalledRef.current = true;
    }

    const urlItemType = searchParams.get('itemType');
    const urlItemGroup = searchParams.get('itemGroup');
    const urlSearch = searchParams.get('search');
    const urlStatus = searchParams.get('status');
    const urlCategory = searchParams.get('category');
    const urlAppName = searchParams.get('appName');

    if (urlItemType || urlItemGroup || urlSearch || urlStatus || urlCategory || urlAppName) {
      setFilter(prev => ({
        ...prev,
        search: urlSearch || prev.search,
        itemType: urlItemType ? urlItemType.split(',') : prev.itemType,
        itemGroup: urlItemGroup ? urlItemGroup.split(',') : prev.itemGroup,
        status: urlStatus ? urlStatus.split(',') : prev.status,
        category: urlCategory || prev.category,
        appName: urlAppName || prev.appName,
      }));
    }

    const controller = new AbortController();
    fetchItems(controller.signal);
    return () => controller.abort();
  }, [dispatch, searchParams]);

  const getFilterLabel = (key, value) => {
    switch (key) {
      case 'search': {
        return searchParams?.get('search');
      }
      case 'status': {
        return searchParams
          ?.get('status')
          ?.split(',')
          .map(status => ITEM_MASTER_STATUS_OPTIONS.find(option => option.value === status)?.label || status)
          .join(', ');
      }
      case 'itemGroup': {
        if (!value || !itemGroupDrop) return value;
        const groupIds = value.split(',');
        const groupNames = groupIds
          .map(id => {
            const group = itemGroupDrop.find(g => g.id === id);
            return group ? group.name : id;
          })
          .join(', ');
        return groupNames;
      }
      case 'itemType': {
        if (!value) return value;
        const typeLabels = Object.fromEntries(ITEM_TYPE_OPTIONS.map(option => [option.value, option.label]));
        const types = value.split(',');
        return types.map(type => typeLabels[type] || type).join(', ');
      }
      case 'appName': {
        return getCreatedFromExtraFilters().appName.format(value);
      }
      case 'category': {
        const categoryLabels = {
          goods: 'Goods',
          service: 'Service',
        };
        return categoryLabels[value] || value;
      }
      default:
        return value;
    }
  };

  const getDateFilterLabel = () => {
    const singleDate = searchParams.get('itemDate');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (singleDate) return dateFormateForUi(singleDate);
    if (startDate && endDate) return `${dateFormateForUi(startDate)} to ${dateFormateForUi(endDate)}`;
    return null;
  };

  const FilterTags = () => {
    const activeFilters = Object.entries({
      search: searchParams.get('search'),
      itemType: searchParams.get('itemType'),
      itemGroup: searchParams.get('itemGroup'),
      status: searchParams.get('status'),
      category: searchParams.get('category'),
      ...(hasCRMAccess ? { appName: searchParams.get('appName') } : {}),
    }).filter(([, value]) => value);

    const dateFilterLabel = getDateFilterLabel();

    if (activeFilters.length === 0 && !dateFilterLabel) return null;

    return (
      <div className="mb-5  container-spacing">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-gray-600 font-medium">Active Filters:</span>
          {activeFilters?.map(([key, value]) => (
            <Tag
              key={key}
              closable
              onClose={() => {
                if (key === 'search') {
                  handleClear();
                } else if (key === 'appName') {
                  setFilter(prev => ({ ...prev, appName: '' }));
                  updateUrlParams({ appName: null });
                } else {
                  setFilter(prev => ({ ...prev, [key]: null }));
                  updateUrlParams({ [key]: null });
                }
              }}
              className="px-3 py-1 bg-white"
            >
              <span className="font-medium capitalize">{key === 'appName' ? 'Created From' : key === 'category' ? 'Category' : key.replace(/([A-Z])/g, ' $1').trim()}:</span>{' '}
              {getFilterLabel(key, value)}
            </Tag>
          ))}
          {dateFilterLabel && (
            <Tag
              closable
              onClose={() => {
                setSelectedPreset('custom');
                setDateRange(null);
                updateUrlParams({ startDate: null, endDate: null, itemDate: null, preset: null });
              }}
              className="px-3 py-1 bg-white"
            >
              <span className="font-medium capitalize">Date:</span> {dateFilterLabel}
            </Tag>
          )}
          <Button size="small" className="border-none hover:underline shadow-none" onClick={handleResetFilters}>
            Clear All
          </Button>
        </div>
      </div>
    );
  };

  const handleStatusTab = statusArr => {
    const status = Array.isArray(statusArr) ? statusArr : statusArr ? [statusArr] : [];
    setFilter(prev => ({ ...prev, status }));
    updateUrlParams({ status, page: 1, limit: pagination?.limit });
  };

  const columns = itemsColumn(handleEditClick, handleViewClick, useModuleItem, isViewOnly);

  let columnsFromLocalStorage = getFromLocalStorage(configEnum?.ITEM_MASTER_CONFIG);
  let parsedColumnData = parsedTableCoulmns(columnsFromLocalStorage, columns);

  let displayColumn = parsedColumnData?.displayColumn?.filter(x => x?.visible === true);
  const [columnsList, setColumnsList] = useState(parsedColumnData?.displayColumn.slice(0, -1));
  const [customizedColumns, setCutomizedColumns] = useState([...(parsedColumnData?.customizedColumn?.length > 0 ? parsedColumnData.customizedColumn : displayColumn)]);

  const handleColumnResize = useColumnResize(setColumnsList, setCutomizedColumns, configEnum?.ITEM_MASTER_CONFIG);

  const { showColumnModal, setShowColumnModal, standardDropdownItems } = useDocumentListToolbar({
    filterKey: FILTER_KEY,
    columnConfigKey: configEnum?.ITEM_MASTER_CONFIG,
    showPreferences: false,
    columnsConfig: {
      getDefaultColumns: () => itemsColumn(handleEditClick, handleViewClick, useModuleItem, isViewOnly),
      setColumnsList: cols => setColumnsList(Array.isArray(cols) ? cols.slice(0, -1) : cols),
      setCustomizedColumns: setCutomizedColumns,
    },
    handleResetFilters,
    onRefresh: () => fetchItems(),
  });

  const handleExport = async exportOptions => {
    const controller = new AbortController();
    const payload = {
      signal: controller.signal,
      search: searchParams.get('search') || '',
      sortBy: searchParams.get('sortBy') || '',
      itemType: searchParams.get('itemType') || '',
      itemGroup: searchParams.get('itemGroup') || '',
      appName: searchParams.get('appName') || '',
      status: searchParams.get('status') || '',
      category: searchParams.get('category') || '',
      startDate: searchParams.get('startDate') || null,
      endDate: searchParams.get('endDate') || null,
      itemDate: searchParams.get('itemDate') || null,
    };
    try {
      const response = await getItemsExport(payload);
      const itemList = Array.isArray(response?.data) ? response.data : [];
      if (!itemList.length) {
        Toast.warning('No data available to export.');
        return;
      }

      const exportData = buildExportRows(itemList, itemExportColumn());
      const fileName = resolveExportFileName(exportOptions?.fileName, 'Items_Export');

      downloadExcelExport({
        exportData,
        sheetName: 'Items',
        fileName,
      });
      setExportModalOpen(false);
    } catch (error) {
      if (isCanceledRequestError(error)) return;
      Toast.error('Failed to export. Please try again.');
    }
  };

  const dropdownItems = [
    {
      type: 'group',
      label: 'IMPORT & EXPORT',
      children: [
        ...(useModuleItem?.canCreate && !isViewOnly
          ? [
              {
                key: 'addBulkItems',
                label: 'Add Bulk Items',
                icon: <Icons.PlusCircleOutlined />,
                onClick: ({ domEvent }) => {
                  domEvent.stopPropagation();
                  navigate('/item-master/bulk/import');
                },
              },
              {
                key: 'addBulkInventory',
                label: 'Add Bulk Inventory',
                icon: <Icons.PlusCircleOutlined />,
                onClick: ({ domEvent }) => {
                  domEvent.stopPropagation();
                  navigate('/item-master/bulk/inventory');
                },
              },
            ]
          : []),

        {
          key: 'exportItems',
          label: 'Export Items',
          icon: <Icons.FileExcelOutlined />,
          onClick: ({ domEvent }) => {
            domEvent.stopPropagation();
            setExportModalOpen(true);
          },
        },
      ],
    },

    {
      type: 'divider',
    },

    ...standardDropdownItems,
    {
      type: 'divider',
    },

    {
      type: 'group',
      label: 'ANALYTICS',
      children: (() => {
        const NO_PERMISSION_MSG = "You don't have permission for this operation. Please check with your system admin.";
        const canViewItemAnalytics = !!useModuleItemAnalytics?.canView;
        const canViewGroupItemAnalytics = !!useModuleGroupItemAnalytics?.canView;
        const canViewTopItemsOfSales = !!useModuleTopItemsOfSales?.canView;
        const canViewTopItemOfPurchase = !!useModuleTopItemOfPurchase?.canView;
        return [
          {
            key: 'itemAnalytics',
            icon: <Icons.TagOutlined className={canViewItemAnalytics ? '' : 'text-gray-400'} />,
            label: (
              <Tooltip title={canViewItemAnalytics ? '' : NO_PERMISSION_MSG} placement="left">
                <span className={canViewItemAnalytics ? '' : 'text-gray-400'}>Item Analytics</span>
              </Tooltip>
            ),
            disabled: !canViewItemAnalytics,
            onClick: ({ domEvent }) => {
              domEvent.stopPropagation();
              if (!canViewItemAnalytics) return;
              navigate('/analytics/item');
            },
          },
          {
            key: 'groupItemAnalytics',
            icon: <Icons.BarChartOutlined className={canViewGroupItemAnalytics ? '' : 'text-gray-400'} />,
            label: (
              <Tooltip title={canViewGroupItemAnalytics ? '' : NO_PERMISSION_MSG} placement="left">
                <span className={canViewGroupItemAnalytics ? '' : 'text-gray-400'}>Group Item Analytics</span>
              </Tooltip>
            ),
            disabled: !canViewGroupItemAnalytics,
            onClick: ({ domEvent }) => {
              domEvent.stopPropagation();
              if (!canViewGroupItemAnalytics) return;
              navigate('/analytics/item/group-item');
            },
          },
          {
            key: 'topitemssofsales',
            icon: <Icons.DollarCircleOutlined className={canViewTopItemsOfSales ? '' : 'text-gray-400'} />,
            label: (
              <Tooltip title={canViewTopItemsOfSales ? '' : NO_PERMISSION_MSG} placement="left">
                <span className={canViewTopItemsOfSales ? '' : 'text-gray-400'}>Top Items of Sales</span>
              </Tooltip>
            ),
            disabled: !canViewTopItemsOfSales,
            onClick: ({ domEvent }) => {
              domEvent.stopPropagation();
              if (!canViewTopItemsOfSales) return;
              navigate('/analytics/sales-orders/top-items');
            },
          },
          {
            key: 'topitemssofpurchase',
            icon: <Icons.ShoppingOutlined className={canViewTopItemOfPurchase ? '' : 'text-gray-400'} />,
            label: (
              <Tooltip title={canViewTopItemOfPurchase ? '' : NO_PERMISSION_MSG} placement="left">
                <span className={canViewTopItemOfPurchase ? '' : 'text-gray-400'}>Top Items of Purchase</span>
              </Tooltip>
            ),
            disabled: !canViewTopItemOfPurchase,
            onClick: ({ domEvent }) => {
              domEvent.stopPropagation();
              if (!canViewTopItemOfPurchase) return;
              navigate('/analytics/purchase/top-item-of-purchase');
            },
          },
        ];
      })(),
    },
  ];

  const containerRef = useRef(null);

  const handleMarkAsStatus = async record => {
    const isActive = record?.isActive ?? record?.itemStatus;
    const payload = {
      itemId: record?.id || record?._id,
      isActive: !isActive,
    };
    await toggleItemStatus(payload);
    fetchItems();
  };

  const handleDeleteClick = async id => {
    try {
      await deleteItem({ itemId: id });
      fetchItems();
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const actionColumn = {
    title: 'Action',
    key: 'action',
    render: record => {
      const recordId = record?.id || record?._id;
      const isActive = record?.itemStatus;
      const canView = useModuleItem?.view;
      const canEdit = useModuleItem?.edit && !isViewOnly;
      const canDelete = useModuleItem?.delete && !isViewOnly;
      const blockedTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : PERMISSION_MESSAGES.NO_PERMISSION;
      return (
        <div className="flex items-center justify-start gap-3">
          {canView && (
            <Tooltip title="View Item" getPopupContainer={() => containerRef.current || document.body}>
              <Icons.EyeOutlined className="cursor-pointer" style={{ fontSize: 17, color: '#1E3A56' }} onClick={() => handleViewClick(record)} />
            </Tooltip>
          )}
          <Tooltip title={canEdit ? 'Edit Item' : blockedTooltip} getPopupContainer={() => containerRef.current || document.body}>
            <Icons.EditOutlined
              className={canEdit ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
              style={{ fontSize: 17, color: colorPalette.primary[500], cursor: canEdit ? 'pointer' : 'not-allowed' }}
              onClick={e => {
                e.stopPropagation();
                if (canEdit) handleEditClick(record);
              }}
            />
          </Tooltip>
          <Popconfirm title="Delete Item" description="Are you sure you want to delete this item?" okText="Yes" cancelText="No" disabled={!canDelete} onConfirm={() => handleDeleteClick(recordId)}>
            <Tooltip title={canDelete ? 'Delete Item' : blockedTooltip} getPopupContainer={() => containerRef.current || document.body}>
              <Icons.DeleteOutlined
                className={canDelete ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                style={{ fontSize: 17, color: colorPalette.error[500], cursor: canDelete ? 'pointer' : 'not-allowed' }}
                onClick={e => {
                  e.stopPropagation();
                }}
              />
            </Tooltip>
          </Popconfirm>
          <Dropdown
            placement="bottomRight"
            trigger={['click']}
            disabled={!canEdit}
            open={openDropdownKey === recordId}
            onOpenChange={flag => {
              setOpenDropdownKey(flag ? recordId : null);
            }}
            dropdownRender={() => {
              const dropDownItems = [
                {
                  key: `markAs${isActive ? 'Inactive' : 'Active'}`,
                  label: `Mark as ${isActive ? 'Inactive' : 'Active'}`,
                  onClick: () => handleMarkAsStatus(record),
                },
              ];

              const getStatusIcon = isActiveStatus => {
                if (isActiveStatus) {
                  return {
                    icon: <Icons.CheckCircleOutlined className="text-green-800" style={{ fontSize: 14 }} />,
                    hoverClass: 'hover:bg-green-50 hover:text-green-800',
                  };
                } else {
                  return {
                    icon: <Icons.CloseCircleOutlined className="text-red-800" style={{ fontSize: 14 }} />,
                    hoverClass: 'hover:bg-red-50 hover:text-red-800',
                  };
                }
              };

              return (
                <div className="bg-white shadow-lg rounded-lg border border-gray-200 flex flex-col w-56 py-1">
                  {dropDownItems.length > 0 && (
                    <>
                      <div className="px-2 py-1">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">Status Actions :</div>
                      </div>
                      {dropDownItems.map(item => {
                        const statusIcon = getStatusIcon(!isActive);
                        return (
                          <StatusConfirmPopover
                            key={item.key}
                            record={record}
                            isActive={isActive}
                            onConfirm={() => handleMarkAsStatus(record)}
                            onCloseDropdown={() => setOpenDropdownKey(null)}
                            label={item.label}
                            icon={statusIcon.icon}
                            placement="left"
                            getPopupContainer={() => containerRef.current || document.body}
                            confirmMessage={
                              <p className="text-sm font-medium text-gray-800 leading-relaxed">
                                Are you sure you want to mark this item as <span className={`font-semibold ${isActive ? 'text-red-600' : 'text-green-600'}`}>{isActive ? 'inactive' : 'active'}</span>?
                              </p>
                            }
                          />
                        );
                      })}
                    </>
                  )}
                </div>
              );
            }}
          >
            <Tooltip title={canEdit ? 'More Actions' : blockedTooltip} placement="left">
              <span>
                <Icons.MoreOutlined className={canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'} style={{ fontSize: 17, color: canEdit ? '#1E3A56' : colorPalette.neutral[400] }} />
              </span>
            </Tooltip>
          </Dropdown>
        </div>
      );
    },
  };

  return (
    <div ref={containerRef} className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden -m-4">
      <div className="bg-white px-4 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="w-full md:w-auto text-[1.125rem] font-bold  text-heading">{`${PAGE_HEADERS?.ITEMS?.title} (${pagination?.totalResults || 0})`}</div>
        </div>
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full md:w-auto">
          <PermissionButton
            canAccess={!!useModuleItem?.canCreate}
            isViewOnly={isViewOnly}
            type="primary"
            className="w-full sm:w-auto px-4 py-2"
            wrapperClassName="w-full sm:w-auto inline-block"
            onClick={() => navigate('/item-master/new')}
            icon={<Icons.PlusCircleOutlined />}
            text="Add"
          />
          <Tooltip title="More Actions" placement="left" getPopupContainer={() => containerRef.current || document.body}>
            <Dropdown menu={{ items: dropdownItems, className: 'app-toolbar-dropdown' }} trigger={['click']} getPopupContainer={() => containerRef.current || document.body}>
              <CustomButton type="default" icon={<Icons.EllipsisOutlined />} />
            </Dropdown>
          </Tooltip>
        </div>
      </div>

      <div className="bg-white border-t px-4 py-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <StatusFilterTabs statuses={ITEM_MASTER_STATUS_OPTIONS} value={filter?.status} onChange={handleStatusTab} />
          <div className="flex-grow" />
          <div className="flex gap-2 items-center">
            <FilterInput type={filterInputEnum?.SEARCH} name={'search'} placeHolder="Search..." value={filter?.search} setFilter={setFilter} onSerch={handleSearch} onClear={handleClear} />
            <ColumnSelection
              columns={filterCreatedFromColumn(columnsList)}
              setColumnsList={setColumnsList}
              setCutomizedColumns={setCutomizedColumns}
              configPage={configEnum?.ITEM_MASTER_CONFIG}
              modalOpen={showColumnModal}
              setModalOpen={setShowColumnModal}
            />
            <FilterLockButton isLocked={isLocked} activeFiltersCount={getActiveFiltersCount()} onToggle={handleLockToggle} />
            <FilterButton count={getActiveFiltersCount()} onClick={() => setShowFilter(true)} />
          </div>
        </div>
        <FilterDrawer
          open={showFilter}
          onClose={() => setShowFilter(false)}
          onApply={() => {
            handleFilter();
            setShowFilter(false);
          }}
          onReset={handleResetFilters}
        >
          <FilterSection title="When" columns={1}>
            <div>
              <CustomDatePicker selectedPreset={selectedPreset} setSelectedPreset={setSelectedPreset} dateRange={dateRange} setDateRange={setDateRange} label="Date Range" />
            </div>
          </FilterSection>

          <FilterSection title="What">
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                mode="multiple"
                name={'itemType'}
                label={'Item Type'}
                placeHolder={'Select Item Type'}
                selectionOptions={ITEM_TYPE_OPTIONS}
                value={filter?.itemType}
                setFilter={setFilter}
                allowClear={true}
                getPopupContainer={() => containerRef.current || document.body}
              />
            </div>
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                mode="multiple"
                name={'itemGroup'}
                label={'Item Group'}
                placeHolder={'Select Item Group'}
                selectVariant="twoColumn"
                columnSelectHeader={itemGroupSelectColumnHeader}
                selectionOptions={buildItemGroupSelectOptions(itemGroupDrop)}
                value={filter?.itemGroup}
                setFilter={setFilter}
                allowClear={true}
                loading={itemGroupDropLoading}
                getPopupContainer={() => containerRef.current || document.body}
                onFocus={() => {
                  if (!isApicalledRefFilter.current.itemGroupDropdown) {
                    handleOnFocusApiCall(API_CALLED_ENUM.ITEMGROUP_DROPDOWN);
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                mode="multiple"
                name={'status'}
                label={'Item Status'}
                placeHolder={'Select Item Status'}
                selectionOptions={ITEM_MASTER_STATUS_OPTIONS}
                value={filter?.status}
                setFilter={setFilter}
                allowClear={true}
                getPopupContainer={() => containerRef.current || document.body}
              />
            </div>
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name={'category'}
                label={'Item Category'}
                placeHolder={'Select Item Category'}
                selectionOptions={ITEM_CATEGORY_OPTIONS}
                value={filter?.category}
                setFilter={setFilter}
                allowClear={true}
                getPopupContainer={() => containerRef.current || document.body}
              />
            </div>
          </FilterSection>

          {hasCRMAccess && (
            <FilterSection title="Who">
              <div className="space-y-2">
                <CreatedFromFilter filter={filter} setFilter={setFilter} getPopupContainer={() => containerRef.current || document.body} />
              </div>
            </FilterSection>
          )}
        </FilterDrawer>

        <FilterTags />
      </div>
      <div className="">
        <CustomTable
          onColumnResize={handleColumnResize}
          columns={[...filterCreatedFromColumn(customizedColumns), actionColumn]}
          loading={loading}
          data={items}
          onChange={handleTableChange}
          onRowClick={handleRowClick}
          tableId="key"
          pagination={{
            current: searchParams?.get('page') || 1,
            pageSize: searchParams?.get('limit') || DEFAULT_PAGE_SIZE,
            total: pagination.totalResults,
            onChange: handlePaginationChange,
          }}
        />
      </div>

      <ExportDataModal
        modalOpen={exportModalOpen}
        setModalOpen={setExportModalOpen}
        entityPlural="Items"
        defaultFileName="Items_Export"
        exportLoading={exportLoading}
        onExport={handleExport}
        formName="export-items"
      />
    </div>
  );
};

export default ViewItems;
