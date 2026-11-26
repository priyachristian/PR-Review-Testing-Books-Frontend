// React
import { useEffect, useRef, useState } from 'react';

// Third Party
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

// Components
import { Dropdown, Tag, Tooltip } from '@/components/AntDComponent';
import FilterLockButton from '@/components/ui/common/FilterLockButton';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import ColumnSelection from '@/components/ui/common/ColumnSelection';
import CustomButton from '@/components/ui/button/CustomButton';
import PermissionButton from '@/components/ui/button/PermissionButton';
import FilterInput from '@/components/forms/formInput/FilterInput';
import PageHeader from '@/components/ui/common/PageHeader';
import FilterDrawer, { FilterSection, FilterButton } from '@/components/ui/common/FilterDrawer';

// Hooks
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import useModulePermissions from 'hooks/useModulePermissions';
import useDocumentListToolbar from '@/hooks/useDocumentListToolbar';
import useColumnResize from '@/hooks/useColumnResize';
import { useSampleCatalogs, sampleCatalogColumn } from '@/features/sales/sampleCatalog';
import { useFilters, CommonFilterTags } from '@/utils/filtersUtils';

// Assets
import Icons from 'assets/icons/icon';

// Utils
import { getAllFiltersFromLocalStorage } from '@/utils/filters';
import { FILTERS_KEYS, RESOURCES } from '@/utils/jsonFile';
import { configEnum, filterInputEnum, PERMISSION_MESSAGES, SAMPLE_CATALOG_STATUS } from 'utils/constants';
import { getFromLocalStorage, getQueryParams, parsedTableCoulmns } from 'utils/services';
import { PAGE_HEADERS } from '@/utils/label';
import { ADMIN_ROUTE_PATHS } from '@/routes/adminRoutePaths';
import { colorPalette } from '@/utils/theme';

const FILTER_KEY = FILTERS_KEYS.SAMPLE_CATALOG_ALL_FILTERS;
const STATUS_OPTIONS = Object.entries(SAMPLE_CATALOG_STATUS).map(([value, label]) => ({ value, label }));

const ViewSampleCatalogs = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilter, setShowFilter] = useState(false);
  const isApiCalledRef = useRef(false);

  const { sampleCatalogs, pagination, loading, getSampleCatalogs, resetSampleCatalogs } = useSampleCatalogs();
  const { useModuleSampleCatalog, isViewOnly } = useModulePermissions(RESOURCES.SAMPLE_CATALOG);

  const { filter, setFilter, isLocked, updateUrlParams, handleFilter, handleSearch, handleClear, handleResetFilters, areSavedFiltersApplied, getActiveFiltersCount, handleLockToggle, setIsLocked } =
    useFilters({
      searchParams,
      setSearchParams,
      pagination,
      FILTER_KEY,
      setShowFilter,
      defaultFilter: {
        search: searchParams.get('search') || '',
        status: searchParams.get('status') ? searchParams.get('status').split(',') : '',
      },
    });

  const fetchSampleCatalogs = signal => {
    const page = parseInt(searchParams?.get('page')) || 1;
    const limit = parseInt(searchParams?.get('limit')) || pagination.limit;
    const payload = getQueryParams(window.location.href) || {};
    getSampleCatalogs({ ...payload, page, limit, signal });
  };

  useEffect(() => {
    const savedFilters = getAllFiltersFromLocalStorage(FILTER_KEY);
    if (!isApiCalledRef.current && !searchParams.get('page') && !searchParams.get('limit')) {
      isApiCalledRef.current = true;
      if (savedFilters && Object.keys(savedFilters).length > 0 && !areSavedFiltersApplied(savedFilters)) {
        setFilter(prev => ({ ...prev, search: savedFilters.search ?? prev.search, status: savedFilters.status ? savedFilters.status.split(',') : prev.status }));
        updateUrlParams(savedFilters);
        return;
      }
    }
    const controller = new AbortController();
    fetchSampleCatalogs(controller.signal);
    return () => controller.abort();
  }, [searchParams]);

  useResetOnUnmount(resetSampleCatalogs);

  const navigateWithHistory = path => navigate(path, { state: { prevFrom: location.pathname, historyStack: [...(location.state?.historyStack || []), location.pathname] } });

  const handleViewClick = record => navigateWithHistory(`/${ADMIN_ROUTE_PATHS.sampleCatalogs.build.detail(record.id)}`);

  const columns = sampleCatalogColumn();
  const parsedColumnData = parsedTableCoulmns(getFromLocalStorage(configEnum?.SAMPLE_CATALOG_CONFIG), columns);
  const displayColumn = parsedColumnData?.displayColumn?.filter(x => x?.visible === true);
  const [columnsList, setColumnsList] = useState(parsedColumnData?.displayColumn);
  const [customizedColumns, setCutomizedColumns] = useState([...(parsedColumnData?.customizedColumn?.length > 0 ? parsedColumnData.customizedColumn : displayColumn)]);
  const handleColumnResize = useColumnResize(setColumnsList, setCutomizedColumns, configEnum?.SAMPLE_CATALOG_CONFIG);

  const handleTableChange = (tablePagination, filters, sorter) => {
    const sortBy = sorter?.field ? `${sorter.field}:${sorter.order === 'descend' ? 'desc' : 'asc'}` : '';
    updateUrlParams({ page: tablePagination.current, limit: tablePagination.pageSize, sortBy });
  };

  const { showColumnModal, setShowColumnModal, standardDropdownItems } = useDocumentListToolbar({
    filterKey: FILTER_KEY,
    columnConfigKey: configEnum?.SAMPLE_CATALOG_CONFIG,
    showPreferences: false,
    columnsConfig: { getDefaultColumns: sampleCatalogColumn, setColumnsList, setCustomizedColumns: setCutomizedColumns },
    handleResetFilters,
    onRefresh: () => fetchSampleCatalogs(),
    setIsLocked,
  });

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden -m-4">
      <div className="bg-white px-4 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        <PageHeader loading={loading} title={PAGE_HEADERS?.SAMPLE_CATALOGS?.title} totalRecord={pagination?.totalResults} totalAmount={null} />
        <div className="flex flex-wrap justify-center md:justify-end items-center gap-2 md:gap-3 w-full md:w-auto">
          <PermissionButton
            canAccess={!!useModuleSampleCatalog?.create}
            isViewOnly={isViewOnly}
            type="primary"
            className="py-4 px-5"
            wrapperClassName="inline-block"
            onClick={() => navigateWithHistory(`/${ADMIN_ROUTE_PATHS.sampleCatalogs.create}`)}
            icon={<Icons.PlusCircleOutlined />}
            text="Add"
          />
          <Tooltip title="More Actions" placement="left">
            <Dropdown menu={{ items: standardDropdownItems, className: 'app-toolbar-dropdown' }} trigger={['click']}>
              <CustomButton type="default" icon={<Icons.EllipsisOutlined />} />
            </Dropdown>
          </Tooltip>
        </div>
      </div>

      <div className="bg-white border-t px-4 py-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <FilterInput type={filterInputEnum?.SEARCH} name="search" placeHolder="Search by name or code..." value={filter?.search} setFilter={setFilter} onSerch={handleSearch} onClear={handleClear} />
          <ColumnSelection
            columns={columnsList}
            setColumnsList={setColumnsList}
            setCutomizedColumns={setCutomizedColumns}
            configPage={configEnum?.SAMPLE_CATALOG_CONFIG}
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
            <FilterInput
              type={filterInputEnum?.SELECT}
              mode="multiple"
              name="status"
              label="Status"
              placeHolder="Select Status"
              selectionOptions={STATUS_OPTIONS}
              value={filter?.status}
              setFilter={setFilter}
              allowClear
            />
          </FilterSection>
        </FilterDrawer>

        <CommonFilterTags
          searchParams={searchParams}
          setFilter={setFilter}
          updateUrlParams={updateUrlParams}
          handleClear={handleClear}
          handleResetFilters={handleResetFilters}
          STATUS_ENUM={SAMPLE_CATALOG_STATUS}
        />
      </div>

      <div>
        <CustomTable
          onColumnResize={handleColumnResize}
          columns={[...customizedColumns]}
          loading={loading}
          data={sampleCatalogs}
          onRowClick={handleViewClick}
          onChange={handleTableChange}
          tableId="id"
          pagination={{
            current: searchParams?.get('page') || 1,
            pageSize: searchParams?.get('limit') || pagination?.limit,
            total: pagination.totalResults,
            onChange: (page, limit) => updateUrlParams({ page, limit }),
          }}
          columnActions={() => ({
            title: 'Action',
            key: 'action',
            fixed: 'right',
            width: 90,
            visible: true,
            render: (_, record) => {
              const canView = !!useModuleSampleCatalog?.view;
              const canEdit = !!useModuleSampleCatalog?.edit && !isViewOnly;
              return (
                <div className="flex items-center gap-3">
                  <Tooltip title={canView ? 'View Sample Catalog' : PERMISSION_MESSAGES.NO_PERMISSION}>
                    <Icons.EyeOutlined
                      className={canView ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                      style={{ fontSize: 17, color: '#1E3A56' }}
                      onClick={canView ? () => handleViewClick(record) : undefined}
                    />
                  </Tooltip>
                  <Tooltip title={canEdit ? 'Edit Sample Catalog' : isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : PERMISSION_MESSAGES.NO_PERMISSION}>
                    <Icons.EditOutlined
                      className={canEdit ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                      style={{ fontSize: 17, color: colorPalette.primary[500] }}
                      onClick={
                        canEdit
                          ? event => {
                              event.stopPropagation();
                              navigateWithHistory(`/${ADMIN_ROUTE_PATHS.sampleCatalogs.build.edit(record.id)}`);
                            }
                          : undefined
                      }
                    />
                  </Tooltip>
                </div>
              );
            },
          })}
          renderSelectionLabel={(keys, rows) => (rows?.[0] ? <Tag className="font-semibold">{rows[0].catalogCode}</Tag> : `${keys.length} selected`)}
        />
      </div>
    </div>
  );
};

export default ViewSampleCatalogs;
