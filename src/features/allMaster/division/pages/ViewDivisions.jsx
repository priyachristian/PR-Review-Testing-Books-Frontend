import { useEffect, useState, useRef } from 'react';
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
import { useDivision, divisionSliceMethods, divisionColumn } from '@/features/allMaster/division';
import Icons from 'assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { getFromLocalStorage, parsedTableCoulmns } from 'utils/services';
import { configEnum, filterInputEnum, PERMISSION_MESSAGES } from 'utils/constants';
import { DIVISION_STATUS_OPTIONS } from '@/utils/dropdownEnums';
import { colorPalette } from '@/utils/theme';
import { PAGE_HEADERS } from 'utils/label';

const ViewDivisions = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { isViewOnly, useModuleDivision, isSplitSessionActive } = useModulePermissions(RESOURCES.DIVISION);
  const [searchParams, setSearchParams] = useSearchParams();
  const { getDivision, division, pagination, loading, resetDivisionList, toggleDivisionStatus } = useDivision();
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || '');
  const [filter, setFilter] = useState({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') ? searchParams.get('status').split(',') : '',
  });
  const [showFilter, setShowFilter] = useState(false);
  const [openDropdownKey, setOpenDropdownKey] = useState(null);

  const data = division.map((item, index) => ({
    key: index + 1,
    _id: item.divisionCode,
    name: item.name || '',
    address: item.address?.city || '',
    email: item.contactEmail || '',
    phone: item.contactPhone || '',
    divisionData: item,
    isActive: item?.isActive ?? false,
  }));

  const containerRef = useRef(null);

  const handleMarkAsStatus = async record => {
    const isActive = record?.divisionData?.isActive ?? record?.divisionData?.status;
    const payload = {
      divisionId: record?.divisionData?.id || record?.divisionData?._id,
      isActive: !isActive,
    };
    await toggleDivisionStatus(payload);
    fetchDivision();
  };

  const handleViewClick = record => {
    navigate(`/division/${record.divisionData.id || record.divisionData._id}`, {
      state: {
        divisionData: record.divisionData,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleRowClick = record => {
    handleViewClick(record);
  };

  const actionColumn = {
    title: 'Action',
    key: 'action',
    width: 140,
    render: record => {
      const isActive = record?.divisionData?.isActive ?? record?.divisionData?.status;
      const canView = useModuleDivision?.view;
      const canEdit = useModuleDivision?.edit && !isViewOnly;
      const canDelete = useModuleDivision?.delete && !isViewOnly;
      const blockedTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : PERMISSION_MESSAGES.NO_PERMISSION;
      return (
        <div className="flex items-center justify-start gap-3">
          {canView && (
            <Tooltip title="View Division" getPopupContainer={() => containerRef.current || document.body}>
              <Icons.EyeOutlined
                className="cursor-pointer"
                style={{ fontSize: 17, color: '#1E3A56' }}
                onClick={e => {
                  e.stopPropagation();
                  handleViewClick(record);
                }}
              />
            </Tooltip>
          )}
          <Tooltip title={canEdit ? 'Edit Division' : blockedTooltip} getPopupContainer={() => containerRef.current || document.body}>
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
            title="Delete Division"
            description="Are you sure you want to delete this division?"
            okText="Yes"
            cancelText="No"
            disabled={!canDelete}
            onConfirm={() => handleDeleteClick(record?.divisionData?._id || record?.divisionData?.id)}
          >
            <Tooltip title={canDelete ? 'Delete Division' : blockedTooltip} getPopupContainer={() => containerRef.current || document.body}>
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
            open={openDropdownKey === record.key}
            onOpenChange={flag => {
              if (!canEdit) return;
              setOpenDropdownKey(flag ? record.key : null);
            }}
            dropdownRender={() => {
              const isActiveLocal = isActive;
              const dropDownItems = [
                {
                  key: `markAs${isActiveLocal ? 'Inactive' : 'Active'}`,
                  label: `Mark as ${isActiveLocal ? 'Inactive' : 'Active'}`,
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
                        const statusIcon = getStatusIcon(!isActiveLocal);
                        return (
                          <StatusConfirmPopover
                            key={item.key}
                            record={record}
                            isActive={isActiveLocal}
                            onConfirm={() => handleMarkAsStatus(record)}
                            onCloseDropdown={() => setOpenDropdownKey(null)}
                            label={item.label}
                            icon={statusIcon.icon}
                            placement="left"
                            getPopupContainer={() => containerRef.current || document.body}
                            confirmMessage={
                              <p className="text-sm font-medium text-gray-800 leading-relaxed">
                                Are you sure you want to mark this division as{' '}
                                <span className={`font-semibold ${isActiveLocal ? 'text-red-600' : 'text-green-600'}`}>{isActiveLocal ? 'inactive' : 'active'}</span>?
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

  const handleSerch = () => {
    if (filter.search) {
      updateUrlParams({ page: 1, limit: DEFAULT_PAGE_SIZE, search: filter.search });
    }
  };

  const handleClear = () => {
    setFilter({
      search: '',
      status: '',
    });
    updateUrlParams({ page: 1, limit: DEFAULT_PAGE_SIZE, search: '', status: '' });
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
      page: 1,
      limit: pagination?.limit,
    });
  };

  const getActiveFiltersCount = () => {
    return [searchParams.get('search'), searchParams.get('status')].filter(Boolean).length;
  };

  const handleEditClick = divisionData => {
    navigate(`/division/${divisionData.divisionData.id}/edit`, {
      state: {
        divisionData: divisionData.divisionData,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const fetchDivision = signal => {
    const currentPage = parseInt(searchParams?.get('page')) || 1;
    const currentLimit = parseInt(searchParams?.get('limit')) || pagination.limit;

    getDivision({
      page: currentPage,
      limit: currentLimit,
      search: searchParams.get('search') || '',
      sortBy: searchParams.get('sortBy') || '',
      status: searchParams.get('status') || '',
      signal,
    });
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

    if (sorter?.field && sorter?.order) {
      const direction = sorter.order === 'ascend' ? 'asc' : 'desc';
      sortString = `${sorter.field}:${direction}`;
      setSortBy(sortString);
    } else {
      setSortBy('');
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
          .map(status => DIVISION_STATUS_OPTIONS.find(option => option.value === status)?.label || status)
          .join(', ');
      }
      default:
        return value;
    }
  };

  const FilterTags = () => {
    const activeFilters = Object.entries({
      search: searchParams.get('search'),
      status: searchParams.get('status'),
    }).filter(([, value]) => value);

    if (activeFilters.length === 0) return null;

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
    fetchDivision(controller.signal);

    return () => controller.abort();
  }, [searchParams, isSplitSessionActive]);

  useResetOnUnmount(resetDivisionList);

  const handleDeleteClick = async id => {
    try {
      await dispatch(divisionSliceMethods.deleteDivision(id)).unwrap();
      const currentPage = parseInt(searchParams?.get('page')) || 1;
      const currentLimit = parseInt(searchParams?.get('limit')) || pagination.limit;
      updateUrlParams({
        page: currentPage,
        limit: currentLimit,
        search: filter.search,
      });
    } catch (error) {
      console.error('Failed to delete division:', error);
    }
  };

  const columns = divisionColumn();

  let columnsFromLocalStorage = getFromLocalStorage(configEnum?.DIVISION_MASTER_CONFIG);
  let parsedColumnData = parsedTableCoulmns(columnsFromLocalStorage, columns);

  let displayColumn = parsedColumnData?.displayColumn?.filter(x => x?.visible === true);
  const [columnsList, setColumnsList] = useState(parsedColumnData?.displayColumn);
  const [customizedColumns, setCutomizedColumns] = useState([...(parsedColumnData?.customizedColumn?.length > 0 ? parsedColumnData.customizedColumn : displayColumn)]);

  const handleColumnResize = useColumnResize(setColumnsList, setCutomizedColumns, configEnum?.DIVISION_MASTER_CONFIG);

  const { showColumnModal, setShowColumnModal, standardDropdownItems } = useDocumentListToolbar({
    columnConfigKey: configEnum?.DIVISION_MASTER_CONFIG,
    showPreferences: false,
    columnsConfig: {
      getDefaultColumns: () => divisionColumn(),
      setColumnsList: cols => setColumnsList(cols),
      setCustomizedColumns: setCutomizedColumns,
    },
    handleResetFilters: handleClear,
    onRefresh: () => fetchDivision(),
  });

  return (
    <div ref={containerRef} className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden -m-4">
      <div className="bg-white px-4 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        <div className="w-full md:w-auto text-[1.125rem] font-bold  text-heading">{`${PAGE_HEADERS?.DIVISION?.title} (${pagination?.totalResults || 0})`}</div>
        <div className="flex flex-wrap gap-2 md:gap-3 justify-center md:justify-end">
          <PermissionButton
            canAccess={!!useModuleDivision?.create}
            isViewOnly={isViewOnly}
            type="primary"
            className="py-4 px-5"
            wrapperClassName="inline-block"
            onClick={() => navigate('/division/new')}
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
          <StatusFilterTabs statuses={DIVISION_STATUS_OPTIONS} value={filter?.status} onChange={handleStatusTab} />
          <div className="flex-grow" />
          <div className="flex gap-2 items-center">
            <FilterInput type={filterInputEnum?.SEARCH} name={'search'} placeHolder="Search..." value={filter?.search} setFilter={setFilter} onSerch={handleSerch} onClear={handleClear} />
            <ColumnSelection
              columns={columnsList}
              setColumnsList={setColumnsList}
              setCutomizedColumns={setCutomizedColumns}
              configPage={configEnum?.DIVISION_MASTER_CONFIG}
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
                label={'Division Status'}
                placeHolder={'Select Division Status'}
                selectionOptions={DIVISION_STATUS_OPTIONS}
                value={filter?.status}
                setFilter={setFilter}
                allowClear={true}
                getPopupContainer={() => containerRef.current || document.body}
              />
            </div>
          </FilterSection>
        </FilterDrawer>
        <FilterTags />
      </div>
      <div className="">
        <CustomTable
          onColumnResize={handleColumnResize}
          columns={[...customizedColumns, actionColumn].map(col => {
            const [field, order] = sortBy?.split(':') || [];
            return {
              ...col,
              sorter: col.sorter ?? Boolean(col.dataIndex && col.dataIndex !== 'Action'),
              sortOrder: col.dataIndex === field ? (order === 'asc' ? 'ascend' : 'descend') : null,
            };
          })}
          loading={loading}
          data={data}
          onChange={handleTableChange}
          onRowClick={handleRowClick}
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

export default ViewDivisions;
