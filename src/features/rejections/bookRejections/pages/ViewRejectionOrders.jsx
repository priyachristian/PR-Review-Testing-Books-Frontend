import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

// Components
import { Dropdown, Tooltip } from '@/components/AntDComponent';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomButton from '@/components/ui/button/CustomButton';
import { DocumentConfirmModal } from '@/components/feedback/confirmModal/CancelOrDeleteDocumentModal';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import StatTile from '@/components/dataDisplay/statCard/StatTile';
import FilterInput from '@/components/forms/formInput/FilterInput';
import FilterLockButton from '@/components/ui/common/FilterLockButton';
import FilterDrawer, { FilterSection, FilterButton } from '@/components/ui/common/FilterDrawer';
import ColumnSelection from '@/components/ui/common/ColumnSelection';
import PageHeader from '@/components/ui/common/PageHeader';

// Hooks
import useModulePermissions from 'hooks/useModulePermissions';
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import { useConfirmModal } from '@/hooks/useConfirmModal';
import useDocumentListToolbar from '@/hooks/useDocumentListToolbar';
import useColumnResize from '@/hooks/useColumnResize';
import { useFilters } from '@/utils/filtersUtils';
import { useUser } from '@/features/setting/user/useUser';

// Extras
import { useRejectionOrder, rejectionOrderColumn } from '@/features/rejections/bookRejections';
import { REJECTION_STATUS as STATUS, REJECTION_FLOW as FLOW, REJECTION_ALL_STATUS_TILE as ALL_STATUS_TILE } from '@/utils/dropdownEnums';
import { CommonFilterTags } from '@/utils/filtersUtils';
import { getFromLocalStorage, getQueryParams, parsedTableCoulmns } from 'utils/services';
import { configEnum, filterInputEnum, MODULE_NAMES } from '@/utils/constants';
import { FILTERS_KEYS, RESOURCES } from '@/utils/jsonFile';
import Icons from '@/assets/icons/icon';
import { buildDivisionSelectOptions, buildBranchSelectOptions, divisionSelectColumnHeader, branchSelectColumnHeader } from '@/utils/tableSelectDropdown/orgSelectDropdown';

const STATUS_ENUM = Object.fromEntries(FLOW.map(s => [s, STATUS[s].label]));
const STATUS_OPTIONS = FLOW.map(s => ({ value: s, label: STATUS[s].label }));
const FILTER_KEY = FILTERS_KEYS.REJECTIONS_ALL_FILTER;

const API_CALLED_ENUM = {
  DIVISION_DROPDOWN: 'divisionDropdown',
  USERS_DROPDOWN: 'usersDropdown',
};

const getRejectionOrderDocumentDetails = order =>
  order
    ? {
        rejectionOrderId: order.rejectionOrderId,
        customerDisplayName: order?.customerDisplayName,
        arrivalDate: order.arrivalDate,
        status: order.status,
      }
    : null;

export default function ViewRejectionOrders() {
  const navigate = useNavigate();
  const { rejectionOrders, pagination, loading, deleteLoading, getRejectionOrders, resetRejectionOrders, removeRejectionOrder } = useRejectionOrder();
  const { useModuleRejectionOrders, isViewOnly, divDrop, divisionLoading, getDivDropDown, branchDrop, branchLoading, getBranchDropDown } = useModulePermissions(RESOURCES.REJECTION_ORDERS);
  const { usersDropdown, usersDropdownLoading, getUsersDropdown } = useUser();

  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilter, setShowFilter] = useState(false);
  const deleteModal = useConfirmModal();
  const isApiCalledRef = useRef(false);
  const isApicalledRefFilter = useRef({ divisionDropdown: false, usersDropdown: false });

  const { filter, setFilter, isLocked, setIsLocked, updateUrlParams, handleFilter, handleSearch, handleClear, handleResetFilters, getActiveFiltersCount, handleLockToggle } = useFilters({
    searchParams,
    setSearchParams,
    pagination,
    FILTER_KEY,
    setShowFilter,
    defaultFilter: {
      search: searchParams.get('search') || '',
      status: searchParams.get('status') ? searchParams.get('status').split(',') : '',
      division: searchParams.get('division') || '',
      branch: searchParams.get('branch') || '',
      addedBy: searchParams.get('addedBy') ? searchParams.get('addedBy').split(',') : '',
    },
  });

  const containerRef = useRef(null);

  const fetchRejectionOrders = signal => {
    const params = getQueryParams(window.location.href) || {};
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || pagination?.limit;
    getRejectionOrders({ ...params, page, limit, signal });
  };

  useResetOnUnmount(resetRejectionOrders);

  useEffect(() => {
    if (!isApiCalledRef.current) {
      isApiCalledRef.current = true;
    }
    const controller = new AbortController();
    fetchRejectionOrders(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (!filter?.division) return;
    getBranchDropDown({ divisionId: filter.division });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter?.division]);

  const handleOnFocusApiCall = async type => {
    const obj = { ...isApicalledRefFilter.current };
    if (type === API_CALLED_ENUM.DIVISION_DROPDOWN) {
      await getDivDropDown({});
      obj.divisionDropdown = true;
    }
    if (type === API_CALLED_ENUM.USERS_DROPDOWN) {
      await getUsersDropdown();
      obj.usersDropdown = true;
    }
    isApicalledRefFilter.current = obj;
  };

  useEffect(() => {
    if (searchParams.get('addedBy')) {
      handleOnFocusApiCall(API_CALLED_ENUM.USERS_DROPDOWN);
    }
    if (searchParams.get('division')) {
      handleOnFocusApiCall(API_CALLED_ENUM.DIVISION_DROPDOWN);
    }
  }, []);

  const handlePaginationChange = (page, pageSize) => updateUrlParams({ page, limit: pageSize });

  const orders = rejectionOrders || [];

  const confirmDelete = async () => {
    const result = await removeRejectionOrder({ rejectionOrderId: deleteModal.payload?._id });
    if (result?.meta?.requestStatus === 'rejected') return;
    deleteModal.close();

    const page = parseInt(searchParams.get('page')) || 1;
    if (orders.length === 1 && page > 1) {
      updateUrlParams({ page: page - 1 });
      return;
    }
    const params = getQueryParams(window.location.href) || {};
    getRejectionOrders({ ...params, page, limit: parseInt(searchParams.get('limit')) || pagination?.limit });
  };

  const columns = rejectionOrderColumn(navigate, {
    onDelete: deleteModal.open,
    canView: useModuleRejectionOrders?.view,
    canEdit: useModuleRejectionOrders?.edit,
    canDelete: useModuleRejectionOrders?.delete,
    isViewOnly,
  });

  let columnsFromLocalStorage = getFromLocalStorage(configEnum?.REJECTION_ORDER_CONFIG);
  let parsedColumnData = parsedTableCoulmns(columnsFromLocalStorage, columns);

  let displayColumn = parsedColumnData?.displayColumn?.filter(x => x?.visible === true && x?.title !== 'Action' && x?.key !== 'action');
  const [columnsList, setColumnsList] = useState(parsedColumnData?.displayColumn?.slice(0, -1) ?? []);
  const [customizedColumns, setCutomizedColumns] = useState([
    ...(parsedColumnData?.customizedColumn?.length > 0 ? parsedColumnData.customizedColumn.filter(col => col?.title !== 'Action' && col?.key !== 'action') : displayColumn),
  ]);

  const handleColumnResize = useColumnResize(setColumnsList, setCutomizedColumns, configEnum?.REJECTION_ORDER_CONFIG);

  const { showColumnModal, setShowColumnModal, standardDropdownItems } = useDocumentListToolbar({
    filterKey: FILTER_KEY,
    columnConfigKey: configEnum?.REJECTION_ORDER_CONFIG,
    showPreferences: false,
    columnsConfig: {
      getDefaultColumns: () =>
        rejectionOrderColumn(navigate, {
          onDelete: deleteModal.open,
          canView: useModuleRejectionOrders?.view,
          canEdit: useModuleRejectionOrders?.edit,
          canDelete: useModuleRejectionOrders?.delete,
          isViewOnly,
        }),
      setColumnsList: cols => setColumnsList(Array.isArray(cols) ? cols.slice(0, -1) : cols),
      setCustomizedColumns: cols => setCutomizedColumns(Array.isArray(cols) ? cols.filter(col => col?.title !== 'Action' && col?.key !== 'action') : cols),
    },
    handleResetFilters,
    onRefresh: () => fetchRejectionOrders(),
    setIsLocked,
  });

  // Multi-select status cards; no status selected means All. Counts come from the API and ignore the status filter.
  const activeStatuses = useMemo(() => (searchParams.get('status') || '').split(',').filter(Boolean), [searchParams]);
  const statusCounts = useMemo(() => pagination?.statusWiseRejectionOrderCount ?? {}, [pagination?.statusWiseRejectionOrderCount]);
  const allStatusCount = useMemo(() => FLOW.reduce((total, status) => total + (statusCounts[status] || 0), 0), [statusCounts]);
  const AllStatusIcon = ALL_STATUS_TILE.icon;

  const applyStatusFilter = nextStatuses => {
    setFilter(prev => ({ ...prev, status: nextStatuses.length ? nextStatuses : '' }));
    updateUrlParams({ status: nextStatuses.length ? nextStatuses : null, page: 1, limit: pagination?.limit });
  };

  const handleStatusCardSelect = status => {
    applyStatusFilter(activeStatuses.includes(status) ? activeStatuses.filter(s => s !== status) : [...activeStatuses, status]);
  };

  const handleFilterDrawerClose = () => {
    setFilter(prev => ({ ...prev, status: activeStatuses }));
    setShowFilter(false);
  };

  return (
    <div ref={containerRef} className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden -m-4">
      <div className="bg-white px-4 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        <PageHeader loading={loading} title="Rejections" totalRecord={pagination?.totalResults} totalAmount={null} />
        <div className="flex flex-wrap gap-2 md:gap-3 justify-center md:justify-end">
          <PermissionButton canAccess={useModuleRejectionOrders?.create} isViewOnly={isViewOnly} type="primary" icon={<Icons.PlusCircleOutlined />} text="Add" onClick={() => navigate('new')} />
          <Tooltip title="More Actions" placement="left" getPopupContainer={() => containerRef.current || document.body}>
            <Dropdown menu={{ items: standardDropdownItems, className: 'app-toolbar-dropdown' }} trigger={['click']} getPopupContainer={() => containerRef.current || document.body}>
              <CustomButton type="default" icon={<Icons.EllipsisOutlined />} />
            </Dropdown>
          </Tooltip>
        </div>
      </div>

      <div className="bg-white border-t px-4 py-3.5">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          <StatTile
            icon={<AllStatusIcon style={{ fontSize: 15 }} />}
            label={ALL_STATUS_TILE.label}
            value={allStatusCount}
            selected={activeStatuses.length === 0}
            onClick={() => applyStatusFilter([])}
          />
          {FLOW.map(status => {
            const statusMeta = STATUS[status];
            const StatusIcon = statusMeta?.icon;
            return (
              <StatTile
                key={status}
                icon={StatusIcon ? <StatusIcon style={{ fontSize: 15 }} /> : null}
                label={statusMeta?.label ?? status}
                value={statusCounts[status] || 0}
                selected={activeStatuses.includes(status)}
                onClick={() => handleStatusCardSelect(status)}
              />
            );
          })}
        </div>
      </div>

      <div className="bg-white border-t px-4 py-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <FilterInput
            type={filterInputEnum.SEARCH}
            name="search"
            placeHolder="Search by booking#, customer…"
            value={filter?.search}
            setFilter={setFilter}
            onSearch={handleSearch}
            onClear={handleClear}
          />
          <ColumnSelection
            columns={columnsList}
            setColumnsList={setColumnsList}
            setCutomizedColumns={setCutomizedColumns}
            configPage={configEnum?.REJECTION_ORDER_CONFIG}
            modalOpen={showColumnModal}
            setModalOpen={setShowColumnModal}
          />
          <div className="flex-grow" />
          <div className="flex gap-2">
            <FilterLockButton isLocked={isLocked} activeFiltersCount={getActiveFiltersCount()} onToggle={handleLockToggle} />
            <FilterButton count={getActiveFiltersCount()} onClick={() => setShowFilter(true)} />
          </div>
        </div>

        <FilterDrawer
          open={showFilter}
          onClose={handleFilterDrawerClose}
          onApply={() => {
            handleFilter();
            setShowFilter(false);
          }}
          onReset={handleResetFilters}
        >
          <FilterSection title="What">
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum.SELECT}
                name="division"
                label="Division"
                placeHolder="Select Division"
                selectVariant="twoColumn"
                columnSelectHeader={divisionSelectColumnHeader}
                selectionOptions={buildDivisionSelectOptions(divDrop)}
                value={filter?.division}
                setFilter={setFilter}
                allowClear
                extraFilterValues={{ branch: '' }}
                loading={divisionLoading}
                onFocus={() => {
                  if (!isApicalledRefFilter.current.divisionDropdown) handleOnFocusApiCall(API_CALLED_ENUM.DIVISION_DROPDOWN);
                }}
                getPopupContainer={() => containerRef.current || document.body}
              />
            </div>
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum.SELECT}
                name="branch"
                label="Branch"
                placeHolder="Select Branch"
                selectVariant="twoColumn"
                columnSelectHeader={branchSelectColumnHeader}
                selectionOptions={buildBranchSelectOptions(branchDrop)}
                value={filter?.branch}
                setFilter={setFilter}
                allowClear
                disabled={!filter?.division}
                loading={branchLoading}
                getPopupContainer={() => containerRef.current || document.body}
              />
            </div>
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum.SELECT}
                mode="multiple"
                name="status"
                label="Status"
                placeHolder="Select Status"
                selectionOptions={STATUS_OPTIONS}
                value={filter?.status}
                setFilter={setFilter}
                allowClear
                getPopupContainer={() => containerRef.current || document.body}
              />
            </div>
          </FilterSection>

          <FilterSection title="Who">
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum.SELECT}
                mode="multiple"
                name="addedBy"
                label="Added By"
                placeHolder="Select User"
                selectionOptions={(usersDropdown || []).map(u => ({ label: u.name || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || '', value: u.id || u._id }))}
                value={filter?.addedBy}
                setFilter={setFilter}
                allowClear
                loading={usersDropdownLoading}
                onFocus={() => {
                  if (!isApicalledRefFilter.current.usersDropdown) handleOnFocusApiCall(API_CALLED_ENUM.USERS_DROPDOWN);
                }}
                getPopupContainer={() => containerRef.current || document.body}
              />
            </div>
          </FilterSection>
        </FilterDrawer>

        <CommonFilterTags
          searchParams={searchParams}
          setFilter={setFilter}
          updateUrlParams={updateUrlParams}
          handleClear={handleClear}
          handleResetFilters={handleResetFilters}
          dateKeys={{}}
          STATUS_ENUM={STATUS_ENUM}
          divDrop={divDrop}
          branchDrop={branchDrop}
          extraFilters={{
            addedBy: {
              label: 'Added By',
              format: value => {
                if (!value) return null;
                const ids = value.split(',').filter(Boolean);
                if (!ids.length) return null;
                return ids
                  .map(id => {
                    const found = (usersDropdown || []).find(u => String(u?.id || u?._id) === String(id));
                    return found ? found.name || [found.firstName, found.lastName].filter(Boolean).join(' ') || found.email || null : null;
                  })
                  .filter(Boolean)
                  .join(', ');
              },
              clear: (setF, updateUrl) => {
                setF(prev => ({ ...prev, addedBy: '' }));
                updateUrl({ addedBy: null });
              },
            },
          }}
        />
      </div>

      <CustomTable
        onColumnResize={handleColumnResize}
        columns={[...customizedColumns, columns[columns.length - 1]]}
        data={orders.map(r => ({ ...r, key: r._id }))}
        loading={loading}
        onRowClick={record => navigate(record._id)}
        pagination={{
          current: parseInt(searchParams.get('page')) || 1,
          pageSize: parseInt(searchParams.get('limit')) || pagination?.limit,
          total: pagination?.totalResults || 0,
          onChange: handlePaginationChange,
        }}
      />

      <DocumentConfirmModal modal={deleteModal} docType={MODULE_NAMES?.REJECTION_ORDER} onConfirm={confirmDelete} loading={deleteLoading} getDocumentDetails={getRejectionOrderDocumentDetails} />
    </div>
  );
}
