import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

import ColumnSelection from '@/components/ui/common/ColumnSelection';
import PageHeader from '@/components/ui/common/PageHeader';
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

import { getMachineDocumentDetails, MACHINE_AMC_OPTIONS, MACHINE_CRITICALITY, MACHINE_STATUS_OPTIONS, machineColumn, useMachine } from '@/features/maintenance/machine';
import Icons from 'assets/icons/icon';
import { getFromLocalStorage, parsedTableCoulmns } from 'utils/services';
import { configEnum, filterInputEnum, MODULE_NAMES, PERMISSION_MESSAGES } from 'utils/constants';
import { PAGE_HEADERS } from '@/utils/label';
import { colorPalette } from '@/utils/theme';
import { RESOURCES } from '@/utils/jsonFile';

const EMPTY_FILTER = {
  search: '',
  isActive: '',
  criticality: '',
  hasAMC: '',
};

const getOptionLabel = (options, value) => options.find(option => option.value === value)?.label || value;

const ViewMachines = () => {
  const navigate = useNavigate();
  const { useModuleMachine, isViewOnly } = useModulePermissions(RESOURCES.MACHINE);
  const { machines, pagination, loading, deleteLoading, getMachines, resetMachine, deleteMachine, updateMachineStatus } = useMachine();
  const deleteModal = useConfirmModal();
  const [searchParams, setSearchParams] = useSearchParams();
  const [openDropdownKey, setOpenDropdownKey] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [filter, setFilter] = useState({
    search: searchParams.get('search') || '',
    isActive: searchParams.get('isActive') || '',
    criticality: searchParams.get('criticality') || '',
    hasAMC: searchParams.get('hasAMC') || '',
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
      criticality: filter.criticality || '',
      hasAMC: filter.hasAMC || '',
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
    return [searchParams.get('search'), searchParams.get('isActive'), searchParams.get('criticality'), searchParams.get('hasAMC')].filter(Boolean).length;
  };

  const getFilterLabel = (key, value) => {
    switch (key) {
      case 'isActive':
        return getOptionLabel(MACHINE_STATUS_OPTIONS, value);
      case 'criticality':
        return getOptionLabel(MACHINE_CRITICALITY, value);
      case 'hasAMC':
        return getOptionLabel(MACHINE_AMC_OPTIONS, value);
      default:
        return value;
    }
  };

  const fetchMachines = (signal, pageOverride = null, limitOverride = null) => {
    const currentPage = pageOverride || parseInt(searchParams.get('page')) || 1;
    const currentLimit = limitOverride || parseInt(searchParams.get('limit')) || pagination.limit;
    const currentSortBy = searchParams.get('sortBy') || '';
    const currentSearch = searchParams.get('search') || filter.search || '';
    const currentIsActive = searchParams.get('isActive') || '';
    const currentCriticality = searchParams.get('criticality') || '';
    const currentHasAMC = searchParams.get('hasAMC') || '';

    getMachines({
      page: currentPage,
      limit: currentLimit,
      search: currentSearch,
      sortBy: currentSortBy,
      isActive: currentIsActive,
      criticality: currentCriticality,
      hasAMC: currentHasAMC,
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
      criticality: searchParams.get('criticality'),
      hasAMC: searchParams.get('hasAMC'),
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

  const handleDeleteClick = row => {
    if (deleteLoading) return;
    deleteModal.open(row);
  };

  const confirmDeleteMachine = async () => {
    const machineId = deleteModal.payload?._id || deleteModal.payload?.id;
    if (!machineId) return;

    try {
      await deleteMachine(machineId);
      deleteModal.close();
      fetchMachines();
    } catch {
      // The slice already shows the error toast.
    }
  };

  const handleMarkAsStatus = async row => {
    const isActive = Boolean(row?.isActive);
    await updateMachineStatus({
      machineId: row?._id || row?.id,
      isActive: !isActive,
    });
    fetchMachines();
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
    fetchMachines(controller.signal);

    return () => {
      controller.abort();
    };
  }, [searchParams]);

  useResetOnUnmount(resetMachine);

  const columns = machineColumn();
  const columnsFromLocalStorage = getFromLocalStorage(configEnum?.MACHINE_CONFIG);
  const parsedColumnData = parsedTableCoulmns(columnsFromLocalStorage, columns);
  const displayColumn = parsedColumnData?.displayColumn?.filter(x => x?.visible === true);
  const [columnsList, setColumnsList] = useState(parsedColumnData?.displayColumn || []);
  const [customizedColumns, setCutomizedColumns] = useState([...(parsedColumnData?.customizedColumn?.length > 0 ? parsedColumnData.customizedColumn : displayColumn)]);

  const containerRef = useRef(null);
  const handleColumnResize = useColumnResize(setColumnsList, setCutomizedColumns, configEnum?.MACHINE_CONFIG);

  const { showColumnModal, setShowColumnModal, standardDropdownItems } = useDocumentListToolbar({
    columnConfigKey: configEnum?.MACHINE_CONFIG,
    showPreferences: false,
    columnsConfig: {
      getDefaultColumns: () => machineColumn(),
      setColumnsList,
      setCustomizedColumns: setCutomizedColumns,
    },
    handleResetFilters: handleClear,
    onRefresh: () => fetchMachines(),
  });

  return (
    <div ref={containerRef} className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden -m-4">
      <div className="bg-white px-4 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        <PageHeader
          loading={loading}
          title={PAGE_HEADERS?.MACHINES?.title}
          rightStats={[
            { label: 'Total Active Machines', value: pagination?.totalActiveMachines ?? 0 },
            { label: 'Total Class A (Critical)', value: pagination?.totalCriticalityA ?? 0 },
            { label: 'Total Under AMC', value: pagination?.totalUnderAMC ?? 0 },
          ]}
        />
        <div className="flex flex-wrap gap-2 md:gap-3 justify-center md:justify-end">
          <PermissionButton
            canAccess={!!useModuleMachine?.create}
            isViewOnly={isViewOnly}
            type="primary"
            className="py-4 px-5"
            wrapperClassName="inline-block"
            text="Add"
            icon={<Icons.PlusCircleOutlined />}
            onClick={() => navigate('/machine/new')}
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
          <StatusFilterTabs statuses={MACHINE_STATUS_OPTIONS} value={filter?.isActive ? [filter.isActive] : []} onChange={handleStatusTab} />
          <div className="flex-grow" />
          <div className="flex gap-2 items-center">
            <FilterInput type={filterInputEnum?.SEARCH} name="search" placeHolder="Search..." value={filter?.search} setFilter={setFilter} onSerch={handleSearch} onClear={handleClear} />
            <ColumnSelection
              columns={columnsList}
              setColumnsList={setColumnsList}
              setCutomizedColumns={setCutomizedColumns}
              configPage={configEnum?.MACHINE_CONFIG}
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
                selectionOptions={MACHINE_STATUS_OPTIONS}
                value={filter?.isActive}
                setFilter={setFilter}
                allowClear
                getPopupContainer={() => containerRef.current || document.body}
              />
            </div>
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name="criticality"
                label="Criticality"
                placeHolder="Select Criticality"
                selectionOptions={MACHINE_CRITICALITY}
                value={filter?.criticality}
                setFilter={setFilter}
                allowClear
                getPopupContainer={() => containerRef.current || document.body}
              />
            </div>
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name="hasAMC"
                label="Has AMC"
                placeHolder="Select AMC"
                selectionOptions={MACHINE_AMC_OPTIONS}
                value={filter?.hasAMC}
                setFilter={setFilter}
                allowClear
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
                const rowKey = id || row?.machineCode;
                const canView = useModuleMachine?.view;
                const canEdit = useModuleMachine?.edit && !isViewOnly;
                const canDelete = useModuleMachine?.delete && !isViewOnly;
                const blockedTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : PERMISSION_MESSAGES.NO_PERMISSION;
                return (
                  <div className="flex items-center justify-start gap-3">
                    {canView && (
                      <Tooltip title="View Machine" getPopupContainer={() => containerRef.current || document.body}>
                        <Icons.EyeOutlined
                          className="cursor-pointer"
                          style={{ fontSize: 17, color: '#1E3A56' }}
                          onClick={event => {
                            event.stopPropagation();
                            if (id) navigate(`/machine/${id}`);
                          }}
                        />
                      </Tooltip>
                    )}
                    <Tooltip title={canEdit ? 'Edit Machine' : blockedTooltip} getPopupContainer={() => containerRef.current || document.body}>
                      <Icons.EditOutlined
                        className={canEdit ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                        style={{ fontSize: 17, color: colorPalette.primary[500], cursor: canEdit ? 'pointer' : 'not-allowed' }}
                        onClick={event => {
                          event.stopPropagation();
                          if (!canEdit || !id) return;
                          navigate(`/machine/${id}/edit`);
                        }}
                      />
                    </Tooltip>
                    <Tooltip title={canDelete ? 'Delete Machine' : blockedTooltip} getPopupContainer={() => containerRef.current || document.body}>
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
                                Are you sure you want to mark this machine as{' '}
                                <span className={`font-semibold ${isActive ? 'text-red-600' : 'text-green-600'}`}>{isActive ? 'inactive' : 'active'}</span>?
                              </p>
                            }
                          />
                        </div>
                      )}
                    >
                      <Tooltip title={canEdit ? 'More Actions' : blockedTooltip} placement="left" getPopupContainer={() => containerRef.current || document.body}>
                        <button
                          type="button"
                          aria-label="More actions"
                          className={`inline-flex border-0 bg-transparent p-0 leading-none ${canEdit ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}
                          onClick={event => {
                            event.stopPropagation();
                          }}
                        >
                          <Icons.MoreOutlined style={{ fontSize: 17, color: canEdit ? '#1E3A56' : colorPalette.neutral[400] }} />
                        </button>
                      </Tooltip>
                    </Dropdown>
                  </div>
                );
              },
            },
          ]}
          data={machines}
          onRowClick={record => {
            const id = record?._id || record?.id;
            if (id) navigate(`/machine/${id}`);
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
      <DocumentConfirmModal modal={deleteModal} docType={MODULE_NAMES?.MACHINE} onConfirm={confirmDeleteMachine} loading={deleteLoading} getDocumentDetails={getMachineDocumentDetails} />
    </div>
  );
};

export default ViewMachines;
