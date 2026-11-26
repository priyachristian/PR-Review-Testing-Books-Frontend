import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import { Dropdown, Tabs, Tooltip } from '@/components/AntDComponent';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import FilterInput from '@/components/forms/formInput/FilterInput';
import CreatedFromFilter from '@/components/forms/formInput/CreatedFromFilter';
import FilterLockButton from '@/components/ui/common/FilterLockButton';
import FilterDrawer, { FilterSection, FilterButton } from '@/components/ui/common/FilterDrawer';
import ColumnSelection from '@/components/ui/common/ColumnSelection';

import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import { useHasCRMAccess } from '@/hooks/useHasCRMAccess';
import useDocumentListToolbar from '@/hooks/useDocumentListToolbar';
import useColumnResize from '@/hooks/useColumnResize';
import { useItemGroup } from '@/features/allMaster/itemGroup';
import useModulePermissions from '@/hooks/useModulePermissions';
import { useFilters, CommonFilterTags } from '@/utils/filtersUtils';

import AddItemGroupModal from '../components/AddItemGroupModal';
import { itemGroupColumn } from '../itemGroup.columns';
import SubItemGroupTab from '@/features/allMaster/subItemGroup/components/SubItemGroupTab';
import { useSubItemGroup } from '@/features/allMaster/subItemGroup';

import { FILTERS_KEYS, RESOURCES } from '@/utils/jsonFile';
import { getAllFiltersFromLocalStorage } from '@/utils/filters';
import Icons from 'assets/icons/icon';
import { filterInputEnum, configEnum } from 'utils/constants';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';
import { getQueryParams, getFromLocalStorage, parsedTableCoulmns } from 'utils/services';

const ViewItemGroupMaster = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showModal, setIsShowModal] = useState(false);
  const [selectedItemGroup, setSelectedItemGroup] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const isApiCalledRef = useRef(false);

  const { itemGroup, itemGroupPagination, loading, getItemGroup, deleteItemGroup, resetItemGroupList } = useItemGroup();
  const { subItemGroupPagination } = useSubItemGroup();
  const { useItemGroupMaster, isViewOnly } = useModulePermissions(RESOURCES.ITEM_GROUP_MASTER);

  const [activeTab, setActiveTab] = useState('itemGroup');
  const [subShowModal, setSubShowModal] = useState(false);
  const [subSelected, setSubSelected] = useState(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const FILTER_KEY = FILTERS_KEYS.ITEM_GROUPS_ALL_FILTER;
  const { filter, setFilter, isLocked, setIsLocked, updateUrlParams, handleFilter, handleSearch, handleClear, handleResetFilters, areSavedFiltersApplied, getActiveFiltersCount, handleLockToggle } =
    useFilters({
      searchParams,
      setSearchParams,
      pagination: itemGroupPagination,
      FILTER_KEY,
      setShowFilter,
      defaultFilter: {
        search: searchParams.get('search') || '',
        appName: searchParams.get('appName') || '',
      },
    });

  const { hasCRMAccess, filterCreatedFromColumn, createdFromExtraFilters } = useHasCRMAccess({
    pagination: itemGroupPagination,
    filter,
    setFilter,
    updateUrlParams,
    searchParams,
    setShowFilter,
  });

  const fetchItemGroups = signal => {
    const page = parseInt(searchParams?.get('page')) || 1;
    const pageSize = parseInt(searchParams?.get('limit')) || itemGroupPagination?.limit || DEFAULT_PAGE_SIZE;

    let payload = getQueryParams(window.location.href) || {};

    if (Object.keys(payload)?.length <= 0) {
      payload = { page, limit: pageSize };
    }

    getItemGroup({ ...payload, page, limit: pageSize, signal });
  };

  const handleDeleteItem = async id => {
    const result = await deleteItemGroup({ itemGroupId: id });
    if (result?.payload) {
      const controller = new AbortController();
      fetchItemGroups(controller.signal);
    }
  };

  const itemGroupNavigationState = {
    prevFrom: location.pathname,
    historyStack: [...(location.state?.historyStack || []), location.pathname],
  };

  const handleViewClick = itemData => {
    navigate(`/item-group-master/${itemData?.id || itemData?._id}`, { state: itemGroupNavigationState });
  };

  const handleRowClick = itemData => {
    navigate(`/item-group-master/${itemData?.id || itemData?._id}`, { state: itemGroupNavigationState });
  };

  const handleEditClick = record => {
    setSelectedItemGroup(record);
    setIsShowModal(true);
  };

  useEffect(() => {
    const savedFilters = getAllFiltersFromLocalStorage(FILTER_KEY);

    if (!isApiCalledRef.current && !searchParams.get('page') && !searchParams.get('limit')) {
      if (savedFilters && Object.keys(savedFilters).length > 0) {
        setFilter(prev => ({
          ...prev,
          search: savedFilters.search ?? prev.search,
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

    const controller = new AbortController();
    fetchItemGroups(controller.signal);
    return () => controller.abort();
  }, [searchParams]);

  useResetOnUnmount(resetItemGroupList);

  const handlePaginationChange = (page, pageSize) => {
    updateUrlParams({ page, limit: pageSize });
  };

  const columns = itemGroupColumn(handleViewClick, handleEditClick, handleDeleteItem, useItemGroupMaster, isViewOnly);

  let columnsFromLocalStorage = getFromLocalStorage(configEnum?.ITEM_GROUP_CONFIG);
  let parsedColumnData = parsedTableCoulmns(columnsFromLocalStorage, columns);

  let displayColumn = parsedColumnData?.displayColumn?.filter(x => x?.visible === true);
  const [columnsList, setColumnsList] = useState(parsedColumnData?.displayColumn?.slice(0, -1) ?? []);
  const [customizedColumns, setCutomizedColumns] = useState([...(parsedColumnData?.customizedColumn?.length > 0 ? parsedColumnData.customizedColumn : displayColumn)]);
  const containerRef = useRef(null);

  const handleColumnResize = useColumnResize(setColumnsList, setCutomizedColumns, configEnum?.ITEM_GROUP_CONFIG);

  const { showColumnModal, setShowColumnModal, standardDropdownItems } = useDocumentListToolbar({
    filterKey: FILTER_KEY,
    columnConfigKey: configEnum?.ITEM_GROUP_CONFIG,
    showPreferences: false,
    columnsConfig: {
      getDefaultColumns: () => itemGroupColumn(handleViewClick, handleEditClick, handleDeleteItem, useItemGroupMaster, isViewOnly),
      setColumnsList: cols => setColumnsList(Array.isArray(cols) ? cols.slice(0, -1) : cols),
      setCustomizedColumns: setCutomizedColumns,
    },
    handleResetFilters,
    onRefresh: () => fetchItemGroups(),
    setIsLocked,
  });

  const itemGroupTabContent = (
    <>
      <div className="bg-white border-t px-4 py-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <FilterInput type={filterInputEnum?.SEARCH} name={'search'} placeHolder="Search..." value={filter?.search} setFilter={setFilter} onSerch={handleSearch} onClear={handleClear} />
          <ColumnSelection
            columns={filterCreatedFromColumn(columnsList)}
            setColumnsList={setColumnsList}
            setCutomizedColumns={setCutomizedColumns}
            configPage={configEnum?.ITEM_GROUP_CONFIG}
            modalOpen={showColumnModal}
            setModalOpen={setShowColumnModal}
          />
          <div className="flex-grow" />
          <div className="flex gap-2">
            {hasCRMAccess && (
              <>
                <FilterLockButton isLocked={isLocked} activeFiltersCount={getActiveFiltersCount()} onToggle={handleLockToggle} />
                <FilterButton count={getActiveFiltersCount()} onClick={() => setShowFilter(true)} />
              </>
            )}
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
          {hasCRMAccess && (
            <FilterSection title="Who">
              <div className="space-y-2">
                <CreatedFromFilter filter={filter} setFilter={setFilter} getPopupContainer={() => containerRef.current || document.body} />
              </div>
            </FilterSection>
          )}
        </FilterDrawer>
        <CommonFilterTags
          searchParams={searchParams}
          setFilter={setFilter}
          updateUrlParams={updateUrlParams}
          handleClear={handleClear}
          handleResetFilters={handleResetFilters}
          extraFilters={createdFromExtraFilters}
        />
      </div>
      <div className="">
        <CustomTable
          onColumnResize={handleColumnResize}
          columns={[...filterCreatedFromColumn(customizedColumns), columns[columns.length - 1]]}
          data={itemGroup}
          onRowClick={handleRowClick}
          loading={loading}
          tableId="id"
          pagination={{
            current: itemGroupPagination.page || 1,
            pageSize: itemGroupPagination.limit || DEFAULT_PAGE_SIZE,
            total: itemGroupPagination.totalResults || 0,
            onChange: handlePaginationChange,
          }}
        />
        {showModal && <AddItemGroupModal showModal={showModal} setModalOpen={setIsShowModal} itemGroup={selectedItemGroup} onSuccess={() => fetchItemGroups()} />}
      </div>
    </>
  );

  return (
    <div ref={containerRef} className="-m-4">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="bg-white"
        tabBarStyle={{ paddingLeft: 16, paddingRight: 16, marginBottom: 0 }}
        tabBarExtraContent={{
          right: (
            <div className="flex flex-wrap gap-2 md:gap-3 justify-center md:justify-end">
              <PermissionButton
                isViewOnly={isViewOnly}
                canAccess={!!useItemGroupMaster?.create}
                type="primary"
                wrapperClassName="inline-block"
                text="Add"
                icon={<Icons.PlusCircleOutlined />}
                onClick={() => {
                  if (activeTab === 'itemGroup') {
                    setSelectedItemGroup(null);
                    setIsShowModal(true);
                  } else {
                    setSubSelected(null);
                    setSubShowModal(true);
                  }
                }}
              />
              {activeTab === 'itemGroup' && (
                <Tooltip title="More Actions" placement="left" getPopupContainer={() => containerRef.current || document.body}>
                  <Dropdown menu={{ items: standardDropdownItems, className: 'app-toolbar-dropdown' }} trigger={['click']} getPopupContainer={() => containerRef.current || document.body}>
                    <CustomButton type="default" icon={<Icons.EllipsisOutlined />} />
                  </Dropdown>
                </Tooltip>
              )}
            </div>
          ),
        }}
        items={[
          {
            key: 'itemGroup',
            label: `Item Group (${subItemGroupPagination?.itemGroupCount ?? itemGroupPagination?.totalResults ?? 0})`,
            children: itemGroupTabContent,
          },
          {
            key: 'subItemGroup',
            label: `Sub Item Group (${itemGroupPagination?.subItemGroupCount ?? subItemGroupPagination?.totalResults ?? 0})`,
            children: <SubItemGroupTab showAddModal={subShowModal} setShowAddModal={setSubShowModal} selected={subSelected} setSelected={setSubSelected} />,
          },
        ]}
      />
    </div>
  );
};

export default ViewItemGroupMaster;
