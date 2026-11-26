import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';

// Components
import { Dropdown, Tooltip } from '@/components/AntDComponent';
import BankTransfer from '../components/BankTransfer';
import ColumnSelection from '@/components/ui/common/ColumnSelection';
import FilterLockButton from '@/components/ui/common/FilterLockButton';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import FilterInput from '@/components/forms/formInput/FilterInput';
import PageHeader from '@/components/ui/common/PageHeader';

// Hooks
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import useModulePermissions from 'hooks/useModulePermissions';
import useDocumentListToolbar from '@/hooks/useDocumentListToolbar';
import useColumnResize from '@/hooks/useColumnResize';
import { useFilters, CommonFilterTags } from '@/utils/filtersUtils';

// Extras
import { useBank, bankColumns } from '@/features/banking/banks';
import Icons from 'assets/icons/icon';
import { FILTERS_KEYS, RESOURCES } from '@/utils/jsonFile';
import { getAllFiltersFromLocalStorage } from '@/utils/filters';
import { configEnum, filterInputEnum } from 'utils/constants';
import { getFromLocalStorage, getQueryParams, parsedTableCoulmns } from 'utils/services';
import { PAGE_HEADERS } from '@/utils/label';

const ViewBanks = () => {
  const navigate = useNavigate();
  const { useModuleBank, isSplitSessionActive, isViewOnly } = useModulePermissions(RESOURCES.BANK);
  const canAdd = useModuleBank?.canCreate && !isViewOnly;
  const canEdit = useModuleBank?.edit && !isViewOnly;
  const { banking, loading, pagination, getBank, resetBanking } = useBank();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedBankDetail, setSelectedBankDetail] = useState(null);
  const [isBankTransferModalOpen, setIsBankTransferModalOpen] = useState(false);
  const isApiCalledRef = useRef(false);
  const FILTER_KEY = FILTERS_KEYS.BANKS_ALL_FILTER;
  const { filter, setFilter, isLocked, setIsLocked, updateUrlParams, handleSearch, handleClear, handleResetFilters, areSavedFiltersApplied, getActiveFiltersCount, handleLockToggle } = useFilters({
    searchParams,
    setSearchParams,
    pagination,
    FILTER_KEY,
    defaultFilter: {
      search: searchParams.get('search') || '',
    },
  });

  const handleEditClick = record => {
    if (!canEdit) return;
    navigate(`/banks/${record.id}/edit`, {
      state: { bankData: record },
    });
  };

  const fetchBanks = signal => {
    const page = parseInt(searchParams?.get('page')) || 1;
    const pageSize = parseInt(searchParams?.get('limit')) || pagination.limit;
    const payload = getQueryParams(window.location.href) || {};
    delete payload.accountType;

    getBank({ ...payload, page, limit: pageSize, pagination: true, signal });
  };

  const handleBankTransferClick = async record => {
    if (!canEdit) return;
    if (record) {
      setSelectedBankDetail(record);
      setIsBankTransferModalOpen(true);
    }
  };

  const handleRowClick = record => {
    navigate(`/banks/${record.id}?page=1&limit=${DEFAULT_PAGE_SIZE}`);
  };

  const handleTableChange = (pagination, filters, sorter) => {
    let sortBy = '';

    if (Array.isArray(sorter)) {
      const firstSort = sorter[0];
      if (firstSort && firstSort.order) {
        sortBy = `${firstSort.field}:${firstSort.order === 'descend' ? 'desc' : 'asc'}`;
      }
    } else if (sorter?.order) {
      sortBy = `${sorter.field}:${sorter.order === 'descend' ? 'desc' : 'asc'}`;
    }

    updateUrlParams({ sortBy, page: 1 });
  };

  useEffect(() => {
    const savedFilters = getAllFiltersFromLocalStorage(FILTER_KEY);

    if (!isApiCalledRef.current && !searchParams.get('page') && !searchParams.get('limit')) {
      if (savedFilters && Object.keys(savedFilters).length > 0) {
        setFilter(prev => ({
          ...prev,
          search: savedFilters.search ?? prev.search,
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
    fetchBanks(controller.signal);
    return () => controller.abort();
  }, [searchParams, isSplitSessionActive]);

  useResetOnUnmount(resetBanking);

  const handlePaginationChange = (page, pageSize) => {
    updateUrlParams({ page, limit: pageSize });
  };

  const columns = bankColumns(handleEditClick, handleBankTransferClick, handleRowClick, useModuleBank, isViewOnly);

  let columnsFromLocalStorage = getFromLocalStorage(configEnum?.BANK_CONFIG);
  let parsedColumnData = parsedTableCoulmns(columnsFromLocalStorage, columns);

  let displayColumn = parsedColumnData?.displayColumn?.filter(x => x?.visible === true);
  const [columnsList, setColumnsList] = useState(parsedColumnData?.displayColumn.slice(0, -1));
  const [customizedColumns, setCutomizedColumns] = useState([...(parsedColumnData?.customizedColumn?.length > 0 ? parsedColumnData.customizedColumn : displayColumn)]);
  const containerRef = useRef(null);

  const handleColumnResize = useColumnResize(setColumnsList, setCutomizedColumns, configEnum?.BANK_CONFIG);

  const { showColumnModal, setShowColumnModal, standardDropdownItems } = useDocumentListToolbar({
    filterKey: FILTER_KEY,
    columnConfigKey: configEnum?.BANK_CONFIG,
    showPreferences: false,
    columnsConfig: {
      getDefaultColumns: () => bankColumns(handleEditClick, handleBankTransferClick, handleRowClick, useModuleBank, isViewOnly),
      setColumnsList: cols => setColumnsList(Array.isArray(cols) ? cols.slice(0, -1) : cols),
      setCustomizedColumns: setCutomizedColumns,
    },
    handleResetFilters,
    onRefresh: () => fetchBanks(),
    setIsLocked,
  });

  return (
    <div ref={containerRef} className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden -m-4">
      <div className="bg-white px-4 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        <PageHeader loading={loading} title={PAGE_HEADERS.BANKS.title} totalAmount={pagination?.totalAmount} totalRecord={pagination?.totalResults} />
        <div className="flex flex-wrap gap-2 md:gap-3 justify-center md:justify-end">
          <PermissionButton
            canAccess={canAdd}
            isViewOnly={isViewOnly}
            type="primary"
            className="py-4 px-5"
            wrapperClassName="inline-block"
            onClick={canAdd ? () => navigate('/banks/new') : undefined}
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
          <FilterInput type={filterInputEnum?.SEARCH} name={'search'} placeHolder="Search..." value={filter?.search} setFilter={setFilter} onSerch={handleSearch} onClear={handleClear} />
          <ColumnSelection
            columns={columnsList}
            setColumnsList={setColumnsList}
            setCutomizedColumns={setCutomizedColumns}
            configPage={configEnum?.BANK_CONFIG}
            modalOpen={showColumnModal}
            setModalOpen={setShowColumnModal}
          />
          <div className="flex-grow" />
          <div className="flex gap-2">
            <FilterLockButton isLocked={isLocked} activeFiltersCount={getActiveFiltersCount()} onToggle={handleLockToggle} />
          </div>
        </div>
        <CommonFilterTags searchParams={searchParams} setFilter={setFilter} updateUrlParams={updateUrlParams} handleClear={handleClear} handleResetFilters={handleResetFilters} />
      </div>
      <div>
        <CustomTable
          onColumnResize={handleColumnResize}
          columns={[...customizedColumns, columns[columns.length - 1]]}
          loading={loading}
          data={banking}
          onRowClick={handleRowClick}
          onChange={handleTableChange}
          tableId="id"
          pagination={{
            current: searchParams?.get('page') || 1,
            pageSize: searchParams?.get('limit') || pagination?.limit,
            total: pagination.totalResults,
            onChange: handlePaginationChange,
          }}
        />
      </div>
      <BankTransfer bankDetail={selectedBankDetail} setModalOpen={setIsBankTransferModalOpen} modalOpen={isBankTransferModalOpen} getList={fetchBanks} />
    </div>
  );
};

export default ViewBanks;
