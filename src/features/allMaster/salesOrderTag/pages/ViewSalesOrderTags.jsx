import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { Dropdown, Tooltip } from '@/components/AntDComponent';
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
import useModulePermissions from '@/hooks/useModulePermissions';
import { useFilters, CommonFilterTags } from '@/utils/filtersUtils';

import AddSalesOrderTagModal from '../components/AddSalesOrderTagModal';
import { salesOrderTagColumn } from '../salesOrderTag.columns';
import { useSalesOrderTag } from '../useSalesOrderTag';

import { FILTERS_KEYS, RESOURCES } from '@/utils/jsonFile';
import { getAllFiltersFromLocalStorage } from '@/utils/filters';
import Icons from 'assets/icons/icon';
import { filterInputEnum, configEnum } from 'utils/constants';
import { PAGE_HEADERS } from '@/utils/label';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';
import { getQueryParams, getFromLocalStorage, parsedTableCoulmns } from 'utils/services';

const ViewSalesOrderTags = () => {
  const [showModal, setIsShowModal] = useState(false);
  const [selectedSalesOrderTag, setSelectedSalesOrderTag] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const isApiCalledRef = useRef(false);

  const { salesOrderTags, pagination, loading, getSalesOrderTag, deleteSalesOrderTag, resetSalesOrderTagList } = useSalesOrderTag();
  const { useSalesOrderTagMaster, isViewOnly } = useModulePermissions(RESOURCES.SALES_ORDER_TAG_MASTER);

  const [searchParams, setSearchParams] = useSearchParams();
  const FILTER_KEY = FILTERS_KEYS.SALES_ORDER_TAGS_ALL_FILTER;
  const { filter, setFilter, isLocked, setIsLocked, updateUrlParams, handleFilter, handleSearch, handleClear, handleResetFilters, areSavedFiltersApplied, getActiveFiltersCount, handleLockToggle } =
    useFilters({
      searchParams,
      setSearchParams,
      pagination,
      FILTER_KEY,
      setShowFilter,
      defaultFilter: {
        search: searchParams.get('search') || '',
        appName: searchParams.get('appName') || '',
      },
    });

  const { hasCRMAccess, filterCreatedFromColumn, createdFromExtraFilters } = useHasCRMAccess({
    pagination,
    filter,
    setFilter,
    updateUrlParams,
    searchParams,
    setShowFilter,
  });

  const fetchSalesOrderTags = signal => {
    const page = parseInt(searchParams?.get('page')) || 1;
    const pageSize = parseInt(searchParams?.get('limit')) || pagination?.limit || DEFAULT_PAGE_SIZE;
    const payload = getQueryParams(window.location.href) || {};

    getSalesOrderTag({ ...payload, page, limit: pageSize, signal });
  };

  const handleDeleteSalesOrderTag = async id => {
    const result = await deleteSalesOrderTag({ salesOrderTagId: id });
    if (result?.payload) {
      const controller = new AbortController();
      fetchSalesOrderTags(controller.signal);
    }
  };

  const handleEditClick = record => {
    setSelectedSalesOrderTag(record);
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
    fetchSalesOrderTags(controller.signal);
    return () => controller.abort();
  }, [searchParams]);

  useResetOnUnmount(resetSalesOrderTagList);

  const handlePaginationChange = (page, pageSize) => {
    updateUrlParams({ page, limit: pageSize });
  };

  const columns = salesOrderTagColumn(handleEditClick, handleDeleteSalesOrderTag, useSalesOrderTagMaster, isViewOnly);

  let columnsFromLocalStorage = getFromLocalStorage(configEnum?.SALES_ORDER_TAG_CONFIG);
  let parsedColumnData = parsedTableCoulmns(columnsFromLocalStorage, columns);

  let displayColumn = parsedColumnData?.displayColumn?.filter(x => x?.visible === true);
  const [columnsList, setColumnsList] = useState(parsedColumnData?.displayColumn?.slice(0, -1) ?? []);
  const [customizedColumns, setCutomizedColumns] = useState([...(parsedColumnData?.customizedColumn?.length > 0 ? parsedColumnData.customizedColumn : displayColumn)]);
  const containerRef = useRef(null);

  const handleColumnResize = useColumnResize(setColumnsList, setCutomizedColumns, configEnum?.SALES_ORDER_TAG_CONFIG);

  const { showColumnModal, setShowColumnModal, standardDropdownItems } = useDocumentListToolbar({
    filterKey: FILTER_KEY,
    columnConfigKey: configEnum?.SALES_ORDER_TAG_CONFIG,
    showPreferences: false,
    columnsConfig: {
      getDefaultColumns: () => salesOrderTagColumn(handleEditClick, handleDeleteSalesOrderTag, useSalesOrderTagMaster, isViewOnly),
      setColumnsList: cols => setColumnsList(Array.isArray(cols) ? cols.slice(0, -1) : cols),
      setCustomizedColumns: setCutomizedColumns,
    },
    handleResetFilters,
    onRefresh: () => fetchSalesOrderTags(),
    setIsLocked,
  });

  return (
    <div ref={containerRef} className="-m-4">
      <div className="bg-white px-4 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        <div className="w-full md:w-auto text-[1.125rem] font-bold  text-heading">{`${PAGE_HEADERS?.SALES_ORDER_TAG?.title} (${pagination?.totalResults || 0})`}</div>
        <div className="flex flex-wrap gap-2 md:gap-3 justify-center md:justify-end">
          <PermissionButton
            isViewOnly={isViewOnly}
            canAccess={!!useSalesOrderTagMaster?.create}
            type="primary"
            wrapperClassName="inline-block"
            text="Add"
            icon={<Icons.PlusCircleOutlined />}
            onClick={() => {
              setIsShowModal(true);
              setSelectedSalesOrderTag(null);
            }}
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
          <FilterInput type={filterInputEnum?.SEARCH} name={'search'} placeHolder="Search..." value={filter?.search} setFilter={setFilter} onSerch={handleSearch} onClear={handleClear} />
          <ColumnSelection
            columns={filterCreatedFromColumn(columnsList)}
            setColumnsList={setColumnsList}
            setCutomizedColumns={setCutomizedColumns}
            configPage={configEnum?.SALES_ORDER_TAG_CONFIG}
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
          data={salesOrderTags}
          loading={loading}
          tableId="id"
          pagination={{
            current: pagination.page || 1,
            pageSize: pagination.limit || DEFAULT_PAGE_SIZE,
            total: pagination.totalResults || 0,
            onChange: handlePaginationChange,
          }}
        />
        {showModal && <AddSalesOrderTagModal showModal={showModal} setModalOpen={setIsShowModal} salesOrderTag={selectedSalesOrderTag} searchParams={searchParams} />}
      </div>
    </div>
  );
};

export default ViewSalesOrderTags;
