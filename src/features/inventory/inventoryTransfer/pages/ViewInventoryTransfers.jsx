import { useEffect, useRef, useState } from 'react';
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom';

// Components
import AddTransferRequest from '../components/AddTransferRequest';
import InventoryModuleDetails from '../components/InventoryModuleDetails';
import TransferApproveModal from '../components/TransferApproveModal';
import TransferRejectModal from '../components/TransferRejectModal';
import ColumnSelection from '@/components/ui/common/ColumnSelection';
import FilterLockButton from '@/components/ui/common/FilterLockButton';
import FilterDrawer, { FilterSection, FilterButton } from '@/components/ui/common/FilterDrawer';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import FilterInput from '@/components/forms/formInput/FilterInput';
import { Button, Dropdown, Tabs } from '@/components/AntDComponent';
import { CommonFilterTags } from '@/utils/filtersUtils';

// Hooks
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import { useFilters } from '@/utils/filtersUtils';
import { useItemMaster } from '@/features/allMaster/item';
import useModulePermissions from 'hooks/useModulePermissions';

// Extras
import { inventoryTransferManualColumn, inventoryTransferProductionColumn } from '@/features/inventory/inventoryTransfer';
import { FILTERS_KEYS, RESOURCES } from '@/utils/jsonFile';
import Icons from 'assets/icons/icon';
import { getAllFiltersFromLocalStorage } from '@/utils/filters';
import { configEnum, filterInputEnum } from 'utils/constants';
import { getFromLocalStorage, getQueryParams, parsedTableCoulmns } from 'utils/services';
import { PAGE_HEADERS } from '@/utils/label';
import { ADMIN_ROUTE_PATHS } from '@/routes/adminRoutePaths';
import useDocumentListToolbar from '@/hooks/useDocumentListToolbar';
import useColumnResize from '@/hooks/useColumnResize';
import { buildDivisionSelectOptions, buildBranchSelectOptions, divisionSelectColumnHeader, branchSelectColumnHeader } from '@/utils/tableSelectDropdown/orgSelectDropdown';

const STATUS_ENUM = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

const API_CALLED_ENUM = {
  DIVISION_DROPDOWN: 'divisionDropdown',
};

const TAB_KEYS = {
  MANUAL: 'manual',
  PRODUCTION: 'production',
};

const ViewInventoryTransfers = () => {
  const { inventoryTransferRequest, loading, fetchInventoryTransferRequest, pagination1, resetInventoryTransferRequest } = useItemMaster();
  const { useModuleInventoryTransferRequest, divDrop, divisionLoading, getDivDropDown, branchDrop, branchLoading, getBranchDropDown, isViewOnly } = useModulePermissions(
    RESOURCES.INVENTORY_TRANSFER_REQUEST
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [modalOpen, setModalOpen] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedRawMaterials, setSelectedRawMaterials] = useState([]);
  const [approveModal, setApproveModal] = useState({ visible: false, recordData: null });
  const [rejectModal, setRejectModal] = useState({ visible: false, recordData: null });
  const [showFilter, setShowFilter] = useState(false);

  const activeTab = searchParams.get('tab') || TAB_KEYS.MANUAL;
  const isProductionTab = activeTab === TAB_KEYS.PRODUCTION;

  const FILTER_KEY = FILTERS_KEYS.INVENTORY_TRANSFER_REQUEST_ALL_FILTER;
  const isApiCalledRef = useRef(false);
  const isApicalledRefFilter = useRef({
    divisionDropdown: false,
  });
  const { filter, setFilter, isLocked, updateUrlParams, handleFilter, handleSearch, handleClear, handleResetFilters, areSavedFiltersApplied, getActiveFiltersCount, handleLockToggle } = useFilters({
    searchParams,
    setSearchParams,
    pagination: pagination1,
    FILTER_KEY,
    setShowFilter,
    defaultFilter: { search: '', status: '', division: '', branch: '' },
  });

  const handlePaginationChange = (page, pageSize) => {
    updateUrlParams({ page, limit: pageSize });
  };

  const handleTabChange = tab => {
    isApiCalledRef.current = false;
    updateUrlParams({ tab, page: 1 });
  };

  const fetchInventoryTransferRequestData = signal => {
    const page = parseInt(searchParams?.get('page')) || 1;
    const pageSize = parseInt(searchParams?.get('limit')) || pagination1.limit;

    const payload = getQueryParams(window.location.href) || {};

    fetchInventoryTransferRequest({
      ...payload,
      page,
      limit: pageSize,
      signal,
      isProductionOrderReq: isProductionTab,
    });
  };

  const handleApproveClick = record => {
    setApproveModal({ visible: true, recordData: record });
  };

  const handleRejectClick = record => {
    setRejectModal({ visible: true, recordData: record });
  };

  const handleViewClick = record => {
    navigate(`/${ADMIN_ROUTE_PATHS.inventoryTransferRequest.build.detail(record._id)}`, {
      state: {
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleViewRawMaterials = record => {
    setSelectedRawMaterials(record.rawMaterials || []);
    setIsModalVisible(true);
  };

  useEffect(() => {
    const savedFilters = getAllFiltersFromLocalStorage(FILTER_KEY);

    if (!isApiCalledRef.current && !searchParams.get('page') && !searchParams.get('limit')) {
      if (savedFilters && Object.keys(savedFilters).length > 0) {
        setFilter(prev => ({
          ...prev,
          search: savedFilters.search ?? prev.search,
          status: savedFilters.status ? savedFilters?.status?.split(',') : prev.status,
          division: savedFilters.division ?? prev.division,
          branch: savedFilters.branch ? savedFilters?.branch?.split(',') : prev.branch,
        }));

        if (savedFilters.division) {
          handleOnFocusApiCall(API_CALLED_ENUM.DIVISION_DROPDOWN);
        }

        if (!areSavedFiltersApplied(savedFilters)) {
          isApiCalledRef.current = true;
          updateUrlParams(savedFilters);
          return;
        }
      }
      isApiCalledRef.current = true;
    }

    const controller = new AbortController();
    fetchInventoryTransferRequestData(controller.signal);
    return () => controller.abort();
  }, [searchParams]);

  useResetOnUnmount(resetInventoryTransferRequest);

  const handleOnFocusApiCall = async type => {
    let obj = { ...isApicalledRefFilter.current };

    if (type === API_CALLED_ENUM.DIVISION_DROPDOWN) {
      await getDivDropDown({});
      obj.divisionDropdown = true;
    }

    isApicalledRefFilter.current = obj;
  };

  useEffect(() => {
    if (searchParams.get('division')) {
      handleOnFocusApiCall(API_CALLED_ENUM.DIVISION_DROPDOWN);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    if (filter?.division) {
      const payload = { divisionId: filter?.division, signal: controller.signal };
      getBranchDropDown(payload);
    }
    return () => controller.abort();
  }, [filter?.division]);

  const manualColumns = inventoryTransferManualColumn(useModuleInventoryTransferRequest, STATUS_ENUM, handleApproveClick, handleRejectClick, handleViewClick, isViewOnly);
  const productionColumns = inventoryTransferProductionColumn(
    useModuleInventoryTransferRequest,
    STATUS_ENUM,
    handleApproveClick,
    handleRejectClick,
    handleViewClick,
    handleViewRawMaterials,
    isViewOnly
  );

  const activeColumns = isProductionTab ? productionColumns : manualColumns;
  const activeConfigKey = isProductionTab ? configEnum?.INVENTORY_TRANSFER_PRODUCTION_CONFIG : configEnum?.INVENTORY_TRANSFER_MANUAL_CONFIG;

  let columnsFromLocalStorage = getFromLocalStorage(activeConfigKey);
  let parsedColumnData = parsedTableCoulmns(columnsFromLocalStorage, activeColumns);

  let displayColumn = parsedColumnData?.displayColumn?.filter(x => x?.visible === true);
  const [columnsList, setColumnsList] = useState(parsedColumnData?.displayColumn.slice(0, -1));
  const [customizedColumns, setCutomizedColumns] = useState([...(parsedColumnData?.customizedColumn?.length > 0 ? parsedColumnData.customizedColumn : displayColumn)]);

  const handleColumnResize = useColumnResize(setColumnsList, setCutomizedColumns, activeConfigKey);

  useEffect(() => {
    const isProd = activeTab === TAB_KEYS.PRODUCTION;
    const configKey = isProd ? configEnum.INVENTORY_TRANSFER_PRODUCTION_CONFIG : configEnum.INVENTORY_TRANSFER_MANUAL_CONFIG;
    const cols = isProd
      ? inventoryTransferProductionColumn(useModuleInventoryTransferRequest, STATUS_ENUM, handleApproveClick, handleRejectClick, handleViewClick, handleViewRawMaterials, isViewOnly)
      : inventoryTransferManualColumn(useModuleInventoryTransferRequest, STATUS_ENUM, handleApproveClick, handleRejectClick, handleViewClick, isViewOnly);
    const stored = getFromLocalStorage(configKey);
    const parsed = parsedTableCoulmns(stored, cols);
    const display = parsed?.displayColumn?.filter(x => x?.visible === true);
    setColumnsList(parsed?.displayColumn.slice(0, -1));
    setCutomizedColumns([...(parsed?.customizedColumn?.length > 0 ? parsed.customizedColumn : display)]);
  }, [activeTab]);

  const tabItems = [
    {
      key: TAB_KEYS.MANUAL,
      label: 'Manual Transfers',
    },
    {
      key: TAB_KEYS.PRODUCTION,
      label: 'Production Order Transfers',
    },
  ];

  const { showColumnModal, setShowColumnModal, standardDropdownItems } = useDocumentListToolbar({
    filterKey: FILTER_KEY,
    columnConfigKey: activeConfigKey,
    showPreferences: false,
    columnsConfig: {
      getDefaultColumns: () => activeColumns,
      setColumnsList: setColumnsList,
      setCustomizedColumns: setCutomizedColumns,
    },
    handleResetFilters,
    onRefresh: () => fetchInventoryTransferRequestData(),
  });
  const dropdownItems = [...standardDropdownItems];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden -m-4">
      <div className="bg-white px-4 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        <div className="w-full md:w-auto text-[1.125rem] font-bold  text-heading">{`${PAGE_HEADERS?.INVENTORY_TRANSFER?.title} (${pagination1?.totalResults || 0})`}</div>
        <div className="flex flex-wrap gap-2 md:gap-3 justify-center md:justify-end">
          <PermissionButton
            canAccess={useModuleInventoryTransferRequest?.create}
            isViewOnly={isViewOnly}
            type="primary"
            className="py-4 px-5"
            wrapperClassName="inline-block"
            onClick={() => setModalOpen(true)}
            icon={<Icons.PlusCircleOutlined />}
            text="Add"
          />
          <Dropdown menu={{ items: dropdownItems, className: 'app-toolbar-dropdown' }} trigger={['click']} getPopupContainer={() => document.body}>
            <Button size="middle" className="app-toolbar-button" icon={<Icons.EllipsisOutlined />} />
          </Dropdown>
        </div>
      </div>

      <div className="bg-white border-t">
        <Tabs activeKey={activeTab} items={tabItems} onChange={handleTabChange} className="px-4 pt-1" />
      </div>

      <div className="bg-white border-t px-4 py-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <FilterInput type={filterInputEnum?.SEARCH} name={'search'} placeHolder="Search..." value={filter?.search} setFilter={setFilter} onSerch={handleSearch} onClear={handleClear} />
          <ColumnSelection
            columns={columnsList}
            setColumnsList={setColumnsList}
            setCutomizedColumns={setCutomizedColumns}
            configPage={activeConfigKey}
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
          onClose={() => setShowFilter(false)}
          onApply={() => {
            handleFilter();
            setShowFilter(false);
          }}
          onReset={handleResetFilters}
        >
          <FilterSection title="What">
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                mode="multiple"
                name={'status'}
                label={'Status'}
                className="mt-1"
                placeHolder={'Select Status'}
                selectionOptions={Object?.entries(STATUS_ENUM)?.map(([key, value]) => {
                  return { value: key, label: value };
                })}
                value={filter?.status}
                setFilter={setFilter}
                allowClear={true}
              />
            </div>
          </FilterSection>

          <FilterSection title="Where">
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name={'division'}
                label={'Division'}
                placeHolder={'Select Division'}
                selectVariant="twoColumn"
                columnSelectHeader={divisionSelectColumnHeader}
                selectionOptions={buildDivisionSelectOptions(divDrop)}
                value={filter?.division}
                setFilter={setFilter}
                allowClear={true}
                extraFilterValues={{ branch: '' }}
                loading={divisionLoading}
                onFocus={() => {
                  if (!isApicalledRefFilter.current.divisionDropdown) {
                    handleOnFocusApiCall(API_CALLED_ENUM.DIVISION_DROPDOWN);
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                mode="multiple"
                name={'branch'}
                label={'Branch'}
                placeHolder={'Select Branch'}
                selectVariant="twoColumn"
                columnSelectHeader={branchSelectColumnHeader}
                selectionOptions={buildBranchSelectOptions(branchDrop)}
                value={filter?.branch}
                setFilter={setFilter}
                allowClear={true}
                disabled={!filter?.division}
                loading={branchLoading}
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
          STATUS_ENUM={STATUS_ENUM}
          divDrop={divDrop}
          branchDrop={branchDrop}
        />
      </div>
      <div>
        <CustomTable
          onColumnResize={handleColumnResize}
          columns={[...customizedColumns, activeColumns[activeColumns.length - 1]]}
          loading={loading}
          data={inventoryTransferRequest || []}
          tableId="id"
          onRowClick={handleViewClick}
          pagination={{
            current: searchParams?.get('page') || 1,
            pageSize: searchParams?.get('limit') || pagination1?.limit,
            total: pagination1.totalResults,
            onChange: handlePaginationChange,
          }}
        />
      </div>
      <AddTransferRequest modalOpen={modalOpen} setModalOpen={setModalOpen} fetchInventoryTransferRequestData={fetchInventoryTransferRequestData} />
      <TransferApproveModal
        open={approveModal.visible}
        record={approveModal.recordData}
        onClose={() => setApproveModal({ visible: false, recordData: null })}
        onSuccess={fetchInventoryTransferRequestData}
      />
      <TransferRejectModal
        open={rejectModal.visible}
        record={rejectModal.recordData}
        onClose={() => setRejectModal({ visible: false, recordData: null })}
        onSuccess={fetchInventoryTransferRequestData}
      />
      <InventoryModuleDetails isModalVisible={isModalVisible} setIsModalVisible={setIsModalVisible} selectedRawMaterials={selectedRawMaterials} />
    </div>
  );
};

export default ViewInventoryTransfers;
