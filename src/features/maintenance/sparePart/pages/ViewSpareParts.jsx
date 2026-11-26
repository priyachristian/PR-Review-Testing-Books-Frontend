import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

import ColumnSelection from '@/components/ui/common/ColumnSelection';
import StatusFilterTabs from '@/components/ui/common/StatusFilterTabs';
import FilterDrawer, { FilterSection, FilterButton } from '@/components/ui/common/FilterDrawer';
import CustomButton from '@/components/ui/button/CustomButton';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import StatusConfirmPopover from '@/components/feedback/confirmModal/StatusConfirmPopover';
import { DocumentConfirmModal } from '@/components/feedback/confirmModal/CancelOrDeleteDocumentModal';
import { Button, Dropdown, Tag, Tooltip } from '@/components/AntDComponent';
import FilterInput from '@/components/forms/formInput/FilterInput';

import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import { useConfirmModal } from '@/hooks/useConfirmModal';
import useDocumentListToolbar from '@/hooks/useDocumentListToolbar';
import useColumnResize from '@/hooks/useColumnResize';
import useModulePermissions from '@/hooks/useModulePermissions';

import { getSparePartDocumentDetails, SPARE_PART_CATEGORIES, SPARE_PART_STATUS_OPTIONS, useSparePart, sparePartColumn } from '@/features/maintenance/sparePart';
import { useMachine } from '@/features/maintenance/machine';
import Icons from 'assets/icons/icon';
import { getFromLocalStorage, parsedTableCoulmns } from 'utils/services';
import { configEnum, filterInputEnum, MODULE_NAMES, PERMISSION_MESSAGES } from 'utils/constants';
import { PAGE_HEADERS } from '@/utils/label';
import { colorPalette } from '@/utils/theme';
import { RESOURCES } from '@/utils/jsonFile';

const EMPTY_FILTER = {
  search: '',
  isActive: '',
  category: '',
  machineId: '',
};

const getOptionLabel = (options, value) => options.find(option => option.value === value)?.label || value;

const machineLabel = machine => [machine?.machineCode, machine?.machineName].filter(Boolean).join(' - ') || machine?.machineName || machine?.machineCode || '';

const ViewSpareParts = () => {
  const navigate = useNavigate();
  const { useModuleSparePart, isViewOnly } = useModulePermissions(RESOURCES.SPARE_PART);
  const { spareParts, pagination, loading, deleteLoading, getSpareParts, resetSparePart, deleteSparePart, updateSparePartStatus } = useSparePart();
  const { machineDropdown, dropdownLoading: machineDropdownLoading, getMachineDropdown } = useMachine();
  const deleteModal = useConfirmModal();
  const [searchParams, setSearchParams] = useSearchParams();
  const [openDropdownKey, setOpenDropdownKey] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const machineDropdownCalledRef = useRef(false);
  const [filter, setFilter] = useState({
    search: searchParams.get('search') || '',
    isActive: searchParams.get('isActive') || '',
    category: searchParams.get('category') || '',
    machineId: searchParams.get('machineId') || '',
  });

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

  const handleSearch = () => {
    if (filter.search) {
      updateUrlParams({ page: 1, limit: DEFAULT_PAGE_SIZE, search: filter.search });
    }
  };

  const handleClear = () => {
    setFilter(EMPTY_FILTER);
    updateUrlParams({ page: 1, limit: DEFAULT_PAGE_SIZE, ...EMPTY_FILTER });
  };

  const handleFilter = () => {
    updateUrlParams({
      search: filter.search || '',
      isActive: filter.isActive || '',
      category: filter.category || '',
      machineId: filter.machineId || '',
      page: 1,
      limit: pagination?.limit || DEFAULT_PAGE_SIZE,
    });
  };

  const handleStatusTab = next => {
    const current = filter.isActive || '';
    const selected = Array.isArray(next) ? next : next ? [next] : [];
    let isActive = '';
    if (selected.length === 1) {
      isActive = selected[0];
    } else if (selected.length > 1) {
      isActive = selected.find(value => value !== current) || selected[selected.length - 1];
    }
    setFilter(prev => ({ ...prev, isActive }));
    updateUrlParams({ isActive, page: 1, limit: pagination?.limit || DEFAULT_PAGE_SIZE });
  };

  const getActiveFiltersCount = () => {
    return [searchParams.get('search'), searchParams.get('isActive'), searchParams.get('category'), searchParams.get('machineId')].filter(Boolean).length;
  };

  const getFilterLabel = (key, value) => {
    switch (key) {
      case 'isActive':
        return getOptionLabel(SPARE_PART_STATUS_OPTIONS, value);
      case 'category':
        return getOptionLabel(SPARE_PART_CATEGORIES, value);
      case 'machineId': {
        const machine = (machineDropdown || []).find(item => String(item?.id || item?._id) === String(value));
        return machine ? machineLabel(machine) : value;
      }
      default:
        return value;
    }
  };

  const fetchSpareParts = (signal, pageOverride = null, limitOverride = null) => {
    const currentPage = pageOverride || parseInt(searchParams.get('page')) || 1;
    const currentLimit = limitOverride || parseInt(searchParams.get('limit')) || pagination.limit;
    const currentSortBy = searchParams.get('sortBy') || '';
    const currentSearch = searchParams.get('search') || filter.search || '';
    const currentIsActive = searchParams.get('isActive') || '';
    const currentCategory = searchParams.get('category') || '';
    const currentMachineId = searchParams.get('machineId') || '';

    getSpareParts({
      page: currentPage,
      limit: currentLimit,
      search: currentSearch,
      sortBy: currentSortBy,
      isActive: currentIsActive,
      category: currentCategory,
      machineId: currentMachineId,
      signal,
    });
  };

  const handlePaginationChange = (page, pageSize) => {
    updateUrlParams({ page, limit: pageSize });
  };

  const FilterTags = () => {
    const activeFilters = Object.entries({
      search: searchParams.get('search'),
      isActive: searchParams.get('isActive'),
      category: searchParams.get('category'),
      machineId: searchParams.get('machineId'),
    }).filter(([, value]) => value);

    if (activeFilters.length === 0) return null;

    return (
      <div className="mb-5 container-spacing">
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-gray-600 font-medium">Active Filters:</span>
          {activeFilters.map(([key, value]) => (
            <Tag
              key={key}
              closable
              onClose={() => {
                setFilter(prev => ({ ...prev, [key]: '' }));
                updateUrlParams({ [key]: '' });
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

  const handleViewClick = id => {
    if (id) navigate(`/spare-part/${id}`);
  };

  const handleDeleteClick = row => {
    if (deleteLoading) return;
    deleteModal.open(row);
  };

  const confirmDeleteSparePart = async () => {
    const sparePartId = deleteModal.payload?._id || deleteModal.payload?.id;
    if (!sparePartId) return;

    try {
      await deleteSparePart(sparePartId);
      deleteModal.close();
      fetchSpareParts();
    } catch {
      // The slice already shows the error toast.
    }
  };

  const handleMarkAsStatus = async row => {
    const isActive = Boolean(row?.isActive);
    await updateSparePartStatus({
      sparePartId: row?._id || row?.id,
      isActive: !isActive,
    });
    fetchSpareParts();
  };

  const handleTableChange = (paginationData, filters, sorter) => {
    let sortString = '';
    if (sorter?.field && sorter?.order) {
      const direction = sorter.order === 'ascend' ? 'asc' : 'desc';
      sortString = `${sorter.field}:${direction}`;
    }
    updateUrlParams({ sortBy: sortString, page: 1 });
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchSpareParts(controller.signal);

    return () => {
      controller.abort();
    };
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get('machineId') && !machineDropdownCalledRef.current) {
      machineDropdownCalledRef.current = true;
      getMachineDropdown();
    }
  }, [searchParams, getMachineDropdown]);

  useResetOnUnmount(resetSparePart);

  const columns = sparePartColumn();
  const columnsFromLocalStorage = getFromLocalStorage(configEnum?.SPARE_PART_CONFIG);
  const parsedColumnData = parsedTableCoulmns(columnsFromLocalStorage, columns);
  const displayColumn = parsedColumnData?.displayColumn?.filter(x => x?.visible === true);
  const [columnsList, setColumnsList] = useState(parsedColumnData?.displayColumn || []);
  const [customizedColumns, setCutomizedColumns] = useState([...(parsedColumnData?.customizedColumn?.length > 0 ? parsedColumnData.customizedColumn : displayColumn)]);

  const containerRef = useRef(null);
  const handleColumnResize = useColumnResize(setColumnsList, setCutomizedColumns, configEnum?.SPARE_PART_CONFIG);

  const { showColumnModal, setShowColumnModal, standardDropdownItems } = useDocumentListToolbar({
    columnConfigKey: configEnum?.SPARE_PART_CONFIG,
    showPreferences: false,
    columnsConfig: {
      getDefaultColumns: () => sparePartColumn(),
      setColumnsList,
      setCustomizedColumns: setCutomizedColumns,
    },
    handleResetFilters: handleClear,
    onRefresh: () => fetchSpareParts(),
  });

  return (
    <div ref={containerRef} className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden -m-4">
      <div className="bg-white px-4 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        <div className="w-full md:w-auto text-[1.125rem] font-bold text-heading">{`${PAGE_HEADERS?.SPARE_PARTS?.title} (${pagination?.totalResults || 0})`}</div>
        <div className="flex flex-wrap gap-2 md:gap-3 justify-center md:justify-end">
          <PermissionButton
            canAccess={!!useModuleSparePart?.create}
            isViewOnly={isViewOnly}
            type="primary"
            className="py-4 px-5"
            wrapperClassName="inline-block"
            text="Add"
            icon={<Icons.PlusCircleOutlined />}
            onClick={() => navigate('/spare-part/new')}
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
          <StatusFilterTabs statuses={SPARE_PART_STATUS_OPTIONS} value={filter?.isActive ? [filter.isActive] : []} onChange={handleStatusTab} />
          <div className="flex-grow" />
          <div className="flex gap-2 items-center">
            <FilterInput type={filterInputEnum?.SEARCH} name="search" placeHolder="Search..." value={filter?.search} setFilter={setFilter} onSerch={handleSearch} onClear={handleClear} />
            <ColumnSelection
              columns={columnsList}
              setColumnsList={setColumnsList}
              setCutomizedColumns={setCutomizedColumns}
              configPage={configEnum?.SPARE_PART_CONFIG}
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
                name="isActive"
                label="Status"
                placeHolder="Select Status"
                selectionOptions={SPARE_PART_STATUS_OPTIONS}
                value={filter?.isActive}
                setFilter={setFilter}
                allowClear
                getPopupContainer={() => containerRef.current || document.body}
              />
            </div>
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name="category"
                label="Category"
                placeHolder="Select Category"
                selectionOptions={SPARE_PART_CATEGORIES}
                value={filter?.category}
                setFilter={setFilter}
                allowClear
                getPopupContainer={() => containerRef.current || document.body}
              />
            </div>
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name="machineId"
                label="Machine"
                placeHolder="Select Machine"
                selectionOptions={(machineDropdown || []).map(machine => ({
                  label: machineLabel(machine),
                  value: machine?.id || machine?._id,
                }))}
                value={filter?.machineId}
                setFilter={setFilter}
                allowClear
                loading={machineDropdownLoading}
                getPopupContainer={() => containerRef.current || document.body}
                onFocus={() => {
                  if (!machineDropdownCalledRef.current) {
                    machineDropdownCalledRef.current = true;
                    getMachineDropdown();
                  }
                }}
              />
            </div>
          </FilterSection>
        </FilterDrawer>
        <FilterTags />
      </div>
      <div>
        <CustomTable
          onColumnResize={handleColumnResize}
          columns={[
            ...customizedColumns,
            {
              title: 'Action',
              key: 'action',
              width: 150,
              render: (value, record) => {
                const row = record?._id || record?.id ? record : value;
                const id = row?._id || row?.id;
                const isActive = Boolean(row?.isActive);
                const rowKey = id || row?.code;
                const canView = useModuleSparePart?.view;
                const canEdit = useModuleSparePart?.edit && !isViewOnly;
                const canDelete = useModuleSparePart?.delete && !isViewOnly;
                const blockedTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : PERMISSION_MESSAGES.NO_PERMISSION;
                return (
                  <div className="flex items-center justify-start gap-3">
                    {canView && (
                      <Tooltip title="View Spare Part" getPopupContainer={() => containerRef.current || document.body}>
                        <Icons.EyeOutlined
                          className="cursor-pointer"
                          style={{ fontSize: 17, color: '#1E3A56' }}
                          onClick={event => {
                            event.stopPropagation();
                            handleViewClick(id);
                          }}
                        />
                      </Tooltip>
                    )}
                    <Tooltip title={canEdit ? 'Edit Spare Part' : blockedTooltip} getPopupContainer={() => containerRef.current || document.body}>
                      <Icons.EditOutlined
                        className={canEdit ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                        style={{ fontSize: 17, color: colorPalette.primary[500], cursor: canEdit ? 'pointer' : 'not-allowed' }}
                        onClick={event => {
                          event.stopPropagation();
                          if (!canEdit || !id) return;
                          navigate(`/spare-part/${id}/edit`);
                        }}
                      />
                    </Tooltip>
                    <Tooltip title={canDelete ? 'Delete Spare Part' : blockedTooltip} getPopupContainer={() => containerRef.current || document.body}>
                      <Icons.DeleteOutlined
                        className={canDelete ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                        style={{ fontSize: 17, color: colorPalette.error[500], cursor: canDelete ? 'pointer' : 'not-allowed' }}
                        onClick={event => {
                          event.stopPropagation();
                          if (!canDelete) return;
                          handleDeleteClick(row);
                        }}
                      />
                    </Tooltip>
                    <Dropdown
                      placement="bottomRight"
                      trigger={['click']}
                      disabled={!canEdit}
                      open={openDropdownKey === rowKey}
                      onOpenChange={flag => {
                        if (!canEdit) return;
                        setOpenDropdownKey(flag ? rowKey : null);
                      }}
                      dropdownRender={() => (
                        <div className="bg-white shadow-lg rounded-lg border border-gray-200 flex flex-col w-56 py-1">
                          <div className="px-2 py-1">
                            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">Status Actions :</div>
                          </div>
                          <StatusConfirmPopover
                            record={row}
                            isActive={isActive}
                            onConfirm={() => handleMarkAsStatus(row)}
                            onCloseDropdown={() => setOpenDropdownKey(null)}
                            label={`Mark as ${isActive ? 'Inactive' : 'Active'}`}
                            icon={
                              isActive ? (
                                <Icons.CloseCircleOutlined className="text-red-800" style={{ fontSize: 14 }} />
                              ) : (
                                <Icons.CheckCircleOutlined className="text-green-800" style={{ fontSize: 14 }} />
                              )
                            }
                            placement="left"
                            getPopupContainer={() => containerRef.current || document.body}
                            confirmMessage={
                              <p className="text-sm font-medium text-gray-800 leading-relaxed">
                                Are you sure you want to mark this spare part as{' '}
                                <span className={`font-semibold ${isActive ? 'text-red-600' : 'text-green-600'}`}>{isActive ? 'inactive' : 'active'}</span>?
                              </p>
                            }
                          />
                        </div>
                      )}
                    >
                      <Tooltip title={canEdit ? 'More Actions' : blockedTooltip} placement="left" getPopupContainer={() => containerRef.current || document.body}>
                        <span>
                          <Icons.MoreOutlined
                            className={canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
                            style={{ fontSize: 17, color: canEdit ? '#1E3A56' : colorPalette.neutral[400] }}
                          />
                        </span>
                      </Tooltip>
                    </Dropdown>
                  </div>
                );
              },
            },
          ]}
          data={spareParts}
          onRowClick={record => {
            const id = record?._id || record?.id;
            handleViewClick(id);
          }}
          loading={loading}
          onChange={handleTableChange}
          tableId="_id"
          pagination={{
            current: searchParams?.get('page') || 1,
            pageSize: searchParams?.get('limit') || pagination?.limit,
            total: pagination.totalResults,
            onChange: handlePaginationChange,
          }}
        />
      </div>
      <DocumentConfirmModal modal={deleteModal} docType={MODULE_NAMES?.SPARE_PART} onConfirm={confirmDeleteSparePart} loading={deleteLoading} getDocumentDetails={getSparePartDocumentDetails} />
    </div>
  );
};

export default ViewSpareParts;
