import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

// Components
import ColumnSelection from '@/components/ui/common/ColumnSelection';
import StatusFilterTabs from '@/components/ui/common/StatusFilterTabs';
import FilterDrawer, { FilterSection, FilterButton } from '@/components/ui/common/FilterDrawer';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import StatusConfirmPopover from '@/components/feedback/confirmModal/StatusConfirmPopover';
import { Button, Tag, Dropdown, Tooltip, Popconfirm } from '@/components/AntDComponent';
import FilterInput from '@/components/forms/formInput/FilterInput';

// Hooks
import useModulePermissions from 'hooks/useModulePermissions';
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import useDocumentListToolbar from '@/hooks/useDocumentListToolbar';
import useColumnResize from '@/hooks/useColumnResize';

// Extras
import { useWarehouse, warehouseColumn, resetBranch } from '@/features/allMaster/warehouse';
import Icons from 'assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { getFromLocalStorage, getQueryParams, parsedTableCoulmns } from 'utils/services';
import { configEnum, filterInputEnum, PERMISSION_MESSAGES } from 'utils/constants';
import { WAREHOUSE_STATUS_OPTIONS } from '@/utils/dropdownEnums';
import { colorPalette } from '@/utils/theme';
import { PAGE_HEADERS } from '@/utils/label';
import { buildDivisionSelectOptions, buildBranchSelectOptions, divisionSelectColumnHeader, branchSelectColumnHeader } from '@/utils/tableSelectDropdown/orgSelectDropdown';

const ViewWarehouses = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { warehouse, pagination, loading, getWarehouse, resetWarehouseList, toggleWarehouseStatus, deleteWarehouse } = useWarehouse();
  const { isViewOnly, useModuleWarehouse, isSplitSessionActive, divDrop, divisionLoading, getDivDropDown, branchDrop, branchLoading, getBranchDropDown } = useModulePermissions(
    RESOURCES.WAREHOUSE_MASTER
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') ? searchParams.get('status').split(',') : '',
    divisionId: searchParams.get('divisionId') || '',
    branchId: searchParams.get('branchId') || '',
  });
  const [showFilter, setShowFilter] = useState(false);
  const [openDropdownKey, setOpenDropdownKey] = useState(null);
  const divApiCalledRef = useRef(false);

  useEffect(() => {
    dispatch(resetBranch());
  }, [dispatch]);

  const handleEditClick = record => {
    navigate(`/warehouse-master/${record._id || record?.id}/edit`, {
      state: {
        warehouseData: record,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleSerch = () => {
    if (filter.search) {
      updateUrlParams({ page: 1, limit: DEFAULT_PAGE_SIZE, search: filter.search });
    }
  };

  const handleClear = () => {
    setFilter({
      search: '',
      status: '',
      divisionId: '',
      branchId: '',
    });
    updateUrlParams({ page: 1, limit: DEFAULT_PAGE_SIZE, search: '', status: '', divisionId: '', branchId: '' });
  };

  const handleStatusTab = statusArr => {
    const status = Array.isArray(statusArr) ? statusArr : statusArr ? [statusArr] : [];
    setFilter(prev => ({ ...prev, status }));
    updateUrlParams({ status, page: 1, limit: pagination?.limit || DEFAULT_PAGE_SIZE });
  };

  const handleFilter = () => {
    updateUrlParams({
      search: filter.search || '',
      status: filter?.status || '',
      divisionId: filter?.divisionId || '',
      branchId: filter?.branchId || '',
      page: 1,
      limit: pagination?.limit,
    });
  };

  const getActiveFiltersCount = () => {
    return [searchParams.get('search'), searchParams.get('status'), searchParams.get('divisionId'), searchParams.get('branchId')].filter(Boolean).length;
  };

  const handleViewClick = record => {
    navigate(`/warehouse-master/${record._id || record?.id}`, {
      state: {
        warehouseData: record,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleRowClick = record => {
    handleViewClick(record);
  };

  const fetchWarehouse = signal => {
    const page = parseInt(searchParams?.get('page')) || 1;
    const pageSize = parseInt(searchParams?.get('limit')) || pagination.limit;
    const payload = getQueryParams(window.location.href) || {};

    getWarehouse({
      ...payload,
      page,
      limit: pageSize,
      sortBy: searchParams.get('sortBy') || '',
      search: searchParams.get('search') || '',
      status: searchParams.get('status') || '',
      signal,
    });
  };

  const handleDeleteClick = async id => {
    try {
      await deleteWarehouse({ warehouseId: id });
      const controller = new AbortController();
      fetchWarehouse(controller.signal);
    } catch (error) {
      console.error('Failed to delete warehouse:', error);
    }
  };

  const updateUrlParams = newParams => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          params.set(key, value.join(','));
        } else {
          params.delete(key);
        }
      } else if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    setSearchParams(params);
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

  const getFilterLabel = (key, value) => {
    switch (key) {
      case 'search': {
        return searchParams?.get('search');
      }
      case 'status': {
        return searchParams
          ?.get('status')
          ?.split(',')
          .map(status => WAREHOUSE_STATUS_OPTIONS.find(option => option.value === status)?.label || status)
          .join(', ');
      }
      case 'divisionId': {
        return (divDrop || []).find(div => div.id === value)?.name || value;
      }
      case 'branchId': {
        return (branchDrop || []).find(branch => branch.id === value)?.name || value;
      }
      default:
        return value;
    }
  };

  const FilterTags = () => {
    const activeFilters = Object.entries({
      search: searchParams.get('search'),
      status: searchParams.get('status'),
      divisionId: searchParams.get('divisionId'),
      branchId: searchParams.get('branchId'),
    }).filter(([, value]) => value);

    if (activeFilters.length === 0) return null;

    return (
      <div className="mb-5 container-spacing">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-gray-600 font-medium">Active Filters:</span>
          {activeFilters?.map(([key, value]) => (
            <Tag
              key={key}
              closable
              onClose={() => {
                if (key === 'search') {
                  handleClear();
                } else {
                  setFilter(prev => ({ ...prev, [key]: null }));
                  updateUrlParams({ [key]: null });
                }
              }}
              className="px-3 py-1 bg-white"
            >
              <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span> {getFilterLabel(key, value)}
            </Tag>
          ))}
          <Button size="small" className="border-none hover:underline shadow-none" onClick={handleClear}>
            Clear All
          </Button>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchWarehouse(controller.signal);

    return () => {
      controller.abort();
    };
  }, [searchParams, isSplitSessionActive]);

  useResetOnUnmount(resetWarehouseList);

  useEffect(() => {
    const controller = new AbortController();
    if (filter?.divisionId) {
      getBranchDropDown({ divisionId: filter.divisionId, signal: controller.signal });
    }
    return () => controller.abort();
  }, [filter?.divisionId, getBranchDropDown]);

  useEffect(() => {
    if (searchParams.get('divisionId') && !divApiCalledRef.current) {
      getDivDropDown({});
      divApiCalledRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = warehouseColumn();

  let columnsFromLocalStorage = getFromLocalStorage(configEnum?.WAREHOUSE_MASTER_CONFIG);
  let parsedColumnData = parsedTableCoulmns(columnsFromLocalStorage, columns);

  let displayColumn = parsedColumnData?.displayColumn?.filter(x => x?.visible === true);
  const [columnsList, setColumnsList] = useState(parsedColumnData?.displayColumn);
  const [customizedColumns, setCutomizedColumns] = useState([...(parsedColumnData?.customizedColumn?.length > 0 ? parsedColumnData.customizedColumn : displayColumn)]);
  const containerRef = useRef(null);

  const handleColumnResize = useColumnResize(setColumnsList, setCutomizedColumns, configEnum?.WAREHOUSE_MASTER_CONFIG);

  const { showColumnModal, setShowColumnModal, standardDropdownItems } = useDocumentListToolbar({
    columnConfigKey: configEnum?.WAREHOUSE_MASTER_CONFIG,
    showPreferences: false,
    columnsConfig: {
      getDefaultColumns: () => warehouseColumn(),
      setColumnsList: cols => setColumnsList(cols),
      setCustomizedColumns: setCutomizedColumns,
    },
    handleResetFilters: handleClear,
    onRefresh: () => fetchWarehouse(),
  });

  const handleMarkAsStatus = async record => {
    const payload = {
      warehouseId: record?._id || record?.id,
      isActive: !record?.isActive,
    };
    await toggleWarehouseStatus(payload);
    fetchWarehouse();
  };

  const actionColumn = {
    title: 'Action',
    key: 'action',
    render: record => {
      const recordId = record?._id || record?.id;
      const isActive = record?.isActive;
      const canView = useModuleWarehouse?.view;
      const canEdit = useModuleWarehouse?.edit && !isViewOnly;
      const canDelete = useModuleWarehouse?.delete && !isViewOnly;
      const blockedTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : PERMISSION_MESSAGES.NO_PERMISSION;
      return (
        <div className="flex items-center justify-start gap-3">
          {canView && (
            <Tooltip title="View Warehouse" getPopupContainer={() => containerRef.current || document.body}>
              <Icons.EyeOutlined className="cursor-pointer" style={{ fontSize: 17, color: '#1E3A56' }} onClick={() => handleViewClick(record)} />
            </Tooltip>
          )}
          <Tooltip title={canEdit ? 'Edit Warehouse' : blockedTooltip} getPopupContainer={() => containerRef.current || document.body}>
            <Icons.EditOutlined
              className={canEdit ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
              style={{ fontSize: 17, color: colorPalette.primary[500], cursor: canEdit ? 'pointer' : 'not-allowed' }}
              onClick={e => {
                e.stopPropagation();
                if (!canEdit) return;
                handleEditClick(record);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="Delete Warehouse"
            description="Are you sure you want to delete this warehouse?"
            okText="Yes"
            cancelText="No"
            disabled={!canDelete}
            onConfirm={() => handleDeleteClick(recordId)}
          >
            <Tooltip title={canDelete ? 'Delete Warehouse' : blockedTooltip} getPopupContainer={() => containerRef.current || document.body}>
              <Icons.DeleteOutlined
                className={canDelete ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                style={{ fontSize: 17, color: colorPalette.error[500], cursor: canDelete ? 'pointer' : 'not-allowed' }}
                onClick={e => e.stopPropagation()}
              />
            </Tooltip>
          </Popconfirm>
          <Dropdown
            placement="bottomRight"
            trigger={['click']}
            disabled={!canEdit}
            open={openDropdownKey === recordId}
            onOpenChange={flag => {
              if (!canEdit) return;
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
                                Are you sure you want to mark this warehouse as{' '}
                                <span className={`font-semibold ${isActive ? 'text-red-600' : 'text-green-600'}`}>{isActive ? 'inactive' : 'active'}</span>?
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
        <div className="w-full md:w-auto text-[1.125rem] font-bold  text-heading">{`${PAGE_HEADERS?.WAREHOUSE?.title} (${pagination?.totalResults || 0})`}</div>
        <div className="flex flex-wrap gap-2 md:gap-3 justify-center md:justify-end">
          <PermissionButton
            canAccess={!!useModuleWarehouse?.create}
            isViewOnly={isViewOnly}
            type="primary"
            className="py-4 px-5"
            wrapperClassName="inline-block"
            onClick={() => navigate('/warehouse-master/new')}
            icon={<Icons.PlusCircleOutlined />}
            text="Add"
          />
          <Tooltip title="More Actions" placement="left" getPopupContainer={() => containerRef.current || document.body}>
            <Dropdown menu={{ items: standardDropdownItems, className: 'app-toolbar-dropdown' }} trigger={['click']} getPopupContainer={() => containerRef.current || document.body}>
              <CustomButton type="default" icon={<Icons.EllipsisOutlined />} />
            </Dropdown>
          </Tooltip>
        </div>
      </div>
      <div className="bg-white border-t px-4 py-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <StatusFilterTabs statuses={WAREHOUSE_STATUS_OPTIONS} value={filter?.status} onChange={handleStatusTab} />
          <div className="flex-grow" />
          <div className="flex gap-2 items-center">
            <FilterInput type={filterInputEnum?.SEARCH} name={'search'} placeHolder="Search..." value={filter?.search} setFilter={setFilter} onSerch={handleSerch} onClear={handleClear} />
            <ColumnSelection
              columns={columnsList}
              setColumnsList={setColumnsList}
              setCutomizedColumns={setCutomizedColumns}
              configPage={configEnum?.WAREHOUSE_MASTER_CONFIG}
              modalOpen={showColumnModal}
              setModalOpen={setShowColumnModal}
            />
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
          onReset={handleClear}
        >
          <FilterSection title="What">
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                mode="multiple"
                name={'status'}
                label={'Warehouse Status'}
                placeHolder={'Select Warehouse Status'}
                selectionOptions={WAREHOUSE_STATUS_OPTIONS}
                value={filter?.status}
                setFilter={setFilter}
                allowClear={true}
                getPopupContainer={() => containerRef.current || document.body}
              />
            </div>
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name={'divisionId'}
                label={'Division'}
                placeHolder={'Select Division'}
                selectVariant="twoColumn"
                columnSelectHeader={divisionSelectColumnHeader}
                selectionOptions={buildDivisionSelectOptions(divDrop)}
                value={filter?.divisionId}
                setFilter={setFilter}
                allowClear={true}
                extraFilterValues={{ branchId: '' }}
                loading={divisionLoading}
                onFocus={() => {
                  if (!divApiCalledRef.current) {
                    getDivDropDown({});
                    divApiCalledRef.current = true;
                  }
                }}
                getPopupContainer={() => containerRef.current || document.body}
              />
            </div>
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name={'branchId'}
                label={'Branch'}
                placeHolder={'Select Branch'}
                selectVariant="twoColumn"
                columnSelectHeader={branchSelectColumnHeader}
                selectionOptions={buildBranchSelectOptions(branchDrop)}
                value={filter?.branchId}
                setFilter={setFilter}
                allowClear={true}
                disabled={!filter?.divisionId}
                loading={branchLoading}
                getPopupContainer={() => containerRef.current || document.body}
              />
            </div>
          </FilterSection>
        </FilterDrawer>
        <FilterTags />
      </div>
      <div>
        <CustomTable
          onColumnResize={handleColumnResize}
          columns={[...customizedColumns, actionColumn].map(col => {
            const [field, order] = searchParams.get('sortBy')?.split(':') || [];
            return {
              ...col,
              sorter: col.sorter ?? Boolean(col.dataIndex && col.dataIndex !== 'Action'),
              sortOrder: col.dataIndex === field ? (order === 'asc' ? 'ascend' : 'descend') : null,
            };
          })}
          loading={loading}
          data={warehouse}
          onRowClick={handleRowClick}
          onChange={handleTableChange}
          pagination={{
            current: searchParams?.get('page') || 1,
            pageSize: searchParams?.get('limit') || pagination?.limit,
            total: pagination.totalResults,
            onChange: handlePaginationChange,
          }}
        />
      </div>
    </div>
  );
};

export default ViewWarehouses;
