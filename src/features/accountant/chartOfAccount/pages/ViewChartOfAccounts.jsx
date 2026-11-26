import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import FilterDrawer, { FilterButton, FilterSection } from '@/components/ui/common/FilterDrawer';
import FilterLockButton from '@/components/ui/common/FilterLockButton';
import ColumnSelection from '@/components/ui/common/ColumnSelection';
import FilterInput from '@/components/forms/formInput/FilterInput';
import CustomDatePicker from '@/components/forms/formDatePicker/CustomDatePicker';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import AddAccountModel from '@/components/feedback/formModal/AddAccountModel';
import ExportReportModal from '@/components/feedback/formModal/ExportReportModal';
import Toast from '@/components/ui/common/Toast';
import { useTheme } from '@/components/ui/common/ThemeProvider';
import { Dropdown, Tooltip } from '@/components/AntDComponent';

import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import useModulePermissions from '@/hooks/useModulePermissions';
import useDocumentListToolbar from '@/hooks/useDocumentListToolbar';
import useColumnResize from '@/hooks/useColumnResize';
import { useProfile } from '@/features/setting/profile/useProfile';

import { useChartOfAccounts } from '@/features/accountant/chartOfAccount';
import { chartOfAccountColumns } from '@/features/accountant/chartOfAccount/chartOfAccount.columns';
import { flattenAccountRows } from '@/features/accountant/chartOfAccount/chartOfAccount.utils';
import { downloadChartOfAccountExcel } from '@/features/accountant/chartOfAccount/pdf/ChartOfAccountExcel';

import { RESOURCES, FILTERS_KEYS } from '@/utils/jsonFile';
import Icons from 'assets/icons/icon';
import { PAGE_HEADERS } from '@/utils/label';
import { ADMIN_ROUTE_PATHS } from '@/routes/adminRoutePaths';
import { configEnum, filterInputEnum } from '@/utils/constants';
import { getAllFiltersFromLocalStorage } from '@/utils/filters';
import { CommonFilterTags, useFilters } from '@/utils/filtersUtils';
import { dateFormateForBackend, getFromLocalStorage, parsedTableCoulmns } from '@/utils/services';
import { renderPdfToBlob } from '@/utils/loadReactPdf';

const FILTER_KEY = FILTERS_KEYS.CHART_OF_ACCOUNTS_ALL_FILTER;
const URL_FILTER_KEYS = ['search', 'category', 'isActive', 'isSystemAccount', 'startDate', 'endDate', 'preset'];

const API_CALLED_ENUM = {
  CATEGORY_DROPDOWN: 'categoryDropdown',
};

const parseBoolParam = value => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
};

const toBoolString = value => {
  if (value === true || value === 'true') return 'true';
  if (value === false || value === 'false') return 'false';
  return '';
};

const hasUrlFilters = searchParams => URL_FILTER_KEYS.some(key => searchParams.get(key));

const countAccountsInTree = groups => {
  let count = 0;
  const walk = accounts => {
    for (const account of accounts || []) {
      count += 1;
      walk(account.children);
    }
  };
  (groups || []).forEach(group => walk(group.accounts));
  return count;
};

const ViewChartOfAccounts = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { colorPalette } = useTheme();
  const isApiCalledRef = useRef(false);
  const isApicalledRefFilter = useRef({
    categoryDropdown: false,
  });
  const { useModuleAccountant, isViewOnly, isSplitSessionActive } = useModulePermissions(RESOURCES.ACCOUNTANT);
  const { profile, getProfile } = useProfile();
  const { categories, accounts, loading, droploading, getAccountsList, getAccountCategories, deleteAccount, deleteLoading, resetAccounts } = useChartOfAccounts();
  const [collapsedIds, setCollapsedIds] = useState(new Set());
  const [accountModal, setAccountModal] = useState({ open: false, account: null });
  const [openDropdownKey, setOpenDropdownKey] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const {
    filter,
    setFilter,
    isLocked,
    selectedPreset,
    setSelectedPreset,
    dateRange,
    setDateRange,
    updateUrlParams,
    handleFilter,
    handleSearch,
    handleClear,
    handleResetFilters,
    areSavedFiltersApplied,
    getActiveFiltersCount,
    handleLockToggle,
    setIsLocked,
  } = useFilters({
    searchParams,
    setSearchParams,
    pagination: {},
    FILTER_KEY,
    setShowFilter,
    defaultFilter: {
      search: searchParams.get('search') || '',
      category: searchParams.get('category') || '',
      isActive: searchParams.get('isActive') || '',
      isSystemAccount: searchParams.get('isSystemAccount') || '',
    },
    dateKeys: { startDate: 'startDate', endDate: 'endDate', singleDate: 'date' },
  });

  const handleApplyFilters = useCallback(() => {
    if (selectedPreset === 'today' && dateRange?.[0]) {
      const todayDate = dateFormateForBackend(dateRange[0]);
      updateUrlParams({
        ...filter,
        page: 1,
        preset: 'today',
        startDate: todayDate,
        endDate: todayDate,
        date: null,
      });
      setShowFilter(false);
      return;
    }
    handleFilter();
  }, [selectedPreset, dateRange, filter, updateUrlParams, handleFilter]);

  const buildAccountsPayload = useCallback(
    signal => ({
      signal,
      isSplit: isSplitSessionActive,
      search: searchParams.get('search') || undefined,
      category: searchParams.get('category') || undefined,
      isActive: parseBoolParam(searchParams.get('isActive')),
      includeInactive: true,
      isSystemAccount: parseBoolParam(searchParams.get('isSystemAccount')),
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
    }),
    [isSplitSessionActive, searchParams]
  );

  const handleOnFocusApiCall = async type => {
    let obj = { ...isApicalledRefFilter.current };

    if (type === API_CALLED_ENUM.CATEGORY_DROPDOWN) {
      await getAccountCategories({});
      obj.categoryDropdown = true;
    }

    isApicalledRefFilter.current = obj;
  };

  useEffect(() => {
    if (searchParams.get('category')) {
      handleOnFocusApiCall(API_CALLED_ENUM.CATEGORY_DROPDOWN);
    }
  }, []);

  useEffect(() => {
    const savedFilters = getAllFiltersFromLocalStorage(FILTER_KEY);

    if (!isApiCalledRef.current && !hasUrlFilters(searchParams)) {
      if (savedFilters && Object.keys(savedFilters).length > 0) {
        if (savedFilters.preset) {
          setSelectedPreset(savedFilters.preset);
        }
        if (savedFilters.startDate && savedFilters.endDate) {
          setDateRange([savedFilters.startDate, savedFilters.endDate]);
        }

        setFilter(prev => ({
          ...prev,
          search: savedFilters.search ?? prev.search,
          category: savedFilters.category ?? prev.category,
          isActive: toBoolString(savedFilters.isActive) || prev.isActive,
          isSystemAccount: toBoolString(savedFilters.isSystemAccount) || prev.isSystemAccount,
        }));

        if (savedFilters.category) {
          handleOnFocusApiCall(API_CALLED_ENUM.CATEGORY_DROPDOWN);
        }

        if (!areSavedFiltersApplied(savedFilters)) {
          isApiCalledRef.current = true;
          updateUrlParams({
            ...savedFilters,
            isActive: toBoolString(savedFilters.isActive) || null,
            isSystemAccount: toBoolString(savedFilters.isSystemAccount) || null,
          });
          return;
        }
      }
      isApiCalledRef.current = true;
    }

    const controller = new AbortController();
    getAccountsList(buildAccountsPayload(controller.signal));
    return () => controller.abort();
  }, [searchParams, buildAccountsPayload]);

  useResetOnUnmount(resetAccounts);

  const toggleExpand = id => {
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const visibleRows = useMemo(() => flattenAccountRows(accounts, collapsedIds), [accounts, collapsedIds]);
  const totalAccounts = useMemo(() => countAccountsInTree(accounts), [accounts]);

  const categoryOptions = useMemo(
    () =>
      (categories || []).map(category => ({
        label: category.displayName,
        value: category.code,
      })),
    [categories]
  );

  const handleRowClick = useCallback(
    record => {
      const params = new URLSearchParams();
      const startDate = searchParams.get('startDate');
      const endDate = searchParams.get('endDate');

      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const query = params.toString();
      navigate(`/${ADMIN_ROUTE_PATHS.accountant.build.detail(record.id)}${query ? `?${query}` : ''}`);
    },
    [navigate, searchParams]
  );

  const fetchAccounts = useCallback(() => {
    const controller = new AbortController();
    getAccountsList(buildAccountsPayload(controller.signal));
  }, [getAccountsList, buildAccountsPayload]);

  const handleDeleteAccount = useCallback(
    async accountId => {
      if (deleteLoading) return;
      try {
        await deleteAccount({ accountId });
        fetchAccounts();
      } catch {
        // slice handles toast
      }
    },
    [deleteLoading, deleteAccount, fetchAccounts]
  );

  const downloadPdf = useCallback(
    async (filename = 'chart_of_accounts.pdf') => {
      const result = await getProfile({});
      const latestProfile = result?.payload?.data || profile;
      const safeName = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;
      const { ChartOfAccountPdf } = await import('@/features/accountant/chartOfAccount/pdf/ChartOfAccountPdf');
      const blob = await renderPdfToBlob(
        <ChartOfAccountPdf accountDrop={accounts} profile={latestProfile} startDate={searchParams.get('startDate') || ''} endDate={searchParams.get('endDate') || ''} />
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = safeName;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    [accounts, getProfile, profile, searchParams]
  );

  const handleExport = useCallback(
    async (format, filename) => {
      if (!totalAccounts) {
        Toast.warning('No data available to export.');
        return;
      }

      try {
        if (format === 'pdf') {
          await downloadPdf(filename);
        } else if (format === 'xlsx') {
          await downloadChartOfAccountExcel({ accountDrop: accounts, filename });
        }
      } catch (error) {
        console.error('Chart of Accounts export error:', error);
        Toast.error('Failed to export. Please try again.');
        throw error;
      }
    },
    [accounts, downloadPdf, totalAccounts]
  );

  const columns = useMemo(
    () =>
      chartOfAccountColumns({
        colorPalette,
        toggleExpand,
        useModuleAccountant,
        isViewOnly,
        openDropdownKey,
        setOpenDropdownKey,
        navigate,
        setAccountModal,
        handleDeleteAccount,
      }),
    [colorPalette, useModuleAccountant, isViewOnly, openDropdownKey, navigate, handleDeleteAccount]
  );

  const columnsFromLocalStorage = getFromLocalStorage(configEnum?.CHART_OF_ACCOUNTS_CONFIG);
  const parsedColumnData = parsedTableCoulmns(columnsFromLocalStorage, columns);
  const displayColumn = parsedColumnData?.displayColumn?.filter(x => x?.visible === true);
  const selectableColumns = (parsedColumnData?.displayColumn || []).filter(col => col?.key !== 'action' && col?.key !== 'lock');

  const [columnsList, setColumnsList] = useState(selectableColumns);
  const [customizedColumns, setCutomizedColumns] = useState([
    ...(parsedColumnData?.customizedColumn?.length > 0
      ? parsedColumnData.customizedColumn.filter(col => col?.key !== 'action' && col?.key !== 'lock')
      : displayColumn.filter(col => col?.key !== 'action' && col?.key !== 'lock')),
  ]);

  const handleColumnResize = useColumnResize(setColumnsList, setCutomizedColumns, configEnum?.CHART_OF_ACCOUNTS_CONFIG);

  const setColumnsListForToolbar = useCallback(cols => {
    setColumnsList(Array.isArray(cols) ? cols.filter(col => col?.key !== 'action' && col?.key !== 'lock') : cols);
  }, []);

  const getDefaultChartOfAccountColumns = useCallback(
    () =>
      chartOfAccountColumns({
        colorPalette,
        toggleExpand,
        useModuleAccountant,
        isViewOnly,
        openDropdownKey,
        setOpenDropdownKey,
        navigate,
        setAccountModal,
        handleDeleteAccount,
      }),
    [colorPalette, useModuleAccountant, isViewOnly, openDropdownKey, navigate, handleDeleteAccount]
  );

  const { showColumnModal, setShowColumnModal, standardDropdownItems } = useDocumentListToolbar({
    filterKey: FILTER_KEY,
    columnConfigKey: configEnum?.CHART_OF_ACCOUNTS_CONFIG,
    showPreferences: false,
    columnsConfig: {
      getDefaultColumns: getDefaultChartOfAccountColumns,
      setColumnsList: setColumnsListForToolbar,
      setCustomizedColumns: cols => setCutomizedColumns(Array.isArray(cols) ? cols.filter(col => col?.key !== 'action' && col?.key !== 'lock') : cols),
    },
    handleResetFilters,
    onRefresh: () => fetchAccounts(),
    setIsLocked,
  });

  const moreActionsItems = useMemo(
    () => [
      ...(useModuleAccountant?.view
        ? [
            {
              type: 'group',
              label: 'EXPORT',
              children: [
                {
                  key: 'export',
                  label: 'Export Chart of Accounts',
                  icon: <Icons.FileExcelOutlined />,
                  onClick: ({ domEvent }) => {
                    domEvent.stopPropagation();
                    setExportModalOpen(true);
                  },
                },
              ],
            },
            {
              type: 'divider',
            },
          ]
        : []),
      ...standardDropdownItems,
    ],
    [standardDropdownItems, useModuleAccountant?.view]
  );

  const lockColumn = columns.find(col => col.key === 'lock');
  const actionColumn = columns.find(col => col.key === 'action');
  const tableColumns = [...customizedColumns, ...(lockColumn ? [lockColumn] : []), ...(actionColumn ? [actionColumn] : [])];

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden -m-4">
      <div className="bg-white px-4 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        <div className="w-full md:w-auto text-[1.125rem] font-bold text-heading">
          {PAGE_HEADERS?.CHART_OF_ACCOUNTS?.title}
          <span className="ml-2 text-sm font-normal text-gray-400">({totalAccounts})</span>
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3 justify-center md:justify-end">
          <PermissionButton
            canAccess={!!useModuleAccountant?.create}
            isViewOnly={isViewOnly}
            type="primary"
            className="py-4 px-5"
            wrapperClassName="inline-block"
            onClick={() => setAccountModal({ open: true, account: null })}
            text={
              <div className="flex gap-2 items-center">
                <Icons.PlusCircleOutlined className="text-lg" />
                <div>Add</div>
              </div>
            }
          />
          <Tooltip title="More Actions" placement="left">
            <Dropdown menu={{ items: moreActionsItems, className: 'app-toolbar-dropdown' }} trigger={['click']}>
              <CustomButton type="default" icon={<Icons.EllipsisOutlined />} />
            </Dropdown>
          </Tooltip>
        </div>
      </div>

      <div className="bg-white border-t px-4 py-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <FilterInput type={filterInputEnum?.SEARCH} name="search" placeHolder="Search..." value={filter?.search} setFilter={setFilter} onSerch={handleSearch} onClear={handleClear} />
          <ColumnSelection
            columns={columnsList}
            setColumnsList={setColumnsList}
            setCutomizedColumns={setCutomizedColumns}
            configPage={configEnum?.CHART_OF_ACCOUNTS_CONFIG}
            modalOpen={showColumnModal}
            setModalOpen={setShowColumnModal}
          />
          <div className="flex-grow" />
          <div className="flex gap-2">
            <FilterLockButton isLocked={isLocked} activeFiltersCount={getActiveFiltersCount()} onToggle={handleLockToggle} />
            <FilterButton count={getActiveFiltersCount()} onClick={() => setShowFilter(true)} />
          </div>
        </div>

        <FilterDrawer open={showFilter} onClose={() => setShowFilter(false)} onApply={handleApplyFilters} onReset={handleResetFilters}>
          <FilterSection title="When" columns={1}>
            <CustomDatePicker label="Date Range" selectedPreset={selectedPreset} setSelectedPreset={setSelectedPreset} dateRange={dateRange} setDateRange={setDateRange} enableFYYearPicker />
          </FilterSection>

          <FilterSection title="Account">
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name="category"
                label="Category"
                placeHolder="Select Category"
                selectionOptions={categoryOptions}
                value={filter?.category}
                setFilter={setFilter}
                allowClear
                loading={droploading}
                onFocus={() => {
                  if (!isApicalledRefFilter.current.categoryDropdown) {
                    handleOnFocusApiCall(API_CALLED_ENUM.CATEGORY_DROPDOWN);
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name="isActive"
                label="Account Status"
                placeHolder="Select Account Status"
                selectionOptions={[
                  { label: 'Active', value: 'true' },
                  { label: 'Inactive', value: 'false' },
                ]}
                value={filter?.isActive}
                setFilter={setFilter}
                allowClear
              />
            </div>

            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name="isSystemAccount"
                label="System Account"
                placeHolder="Select System Account"
                selectionOptions={[
                  { label: 'Yes', value: 'true' },
                  { label: 'No', value: 'false' },
                ]}
                value={filter?.isSystemAccount}
                setFilter={setFilter}
                allowClear
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
          dateKeys={{
            startDateKey: 'startDate',
            endDateKey: 'endDate',
            singleDateKey: 'date',
          }}
          onDateClear={() => {
            setSelectedPreset('custom');
            setDateRange(null);
            updateUrlParams({
              startDate: null,
              endDate: null,
              date: null,
              preset: null,
            });
          }}
          extraFilters={{
            category: {
              label: 'Category',
              format: value => categoryOptions.find(option => option.value === value)?.label || value,
              clear: (setFilterState, updateParams) => {
                setFilterState(prev => ({ ...prev, category: '' }));
                updateParams({ category: null });
              },
            },
            isActive: {
              label: 'Account Status',
              format: value => (value === 'true' ? 'Active' : 'Inactive'),
              clear: (setFilterState, updateParams) => {
                setFilterState(prev => ({ ...prev, isActive: '' }));
                updateParams({ isActive: null });
              },
            },
            isSystemAccount: {
              label: 'System Account',
              format: value => (value === 'true' ? 'Yes' : 'No'),
              clear: (setFilterState, updateParams) => {
                setFilterState(prev => ({ ...prev, isSystemAccount: '' }));
                updateParams({ isSystemAccount: null });
              },
            },
          }}
        />
      </div>

      <CustomTable onColumnResize={handleColumnResize} columns={tableColumns} data={visibleRows} loading={loading} tableId="id" pagination={false} expandable={false} onRowClick={handleRowClick} />

      {accountModal.open && (
        <AddAccountModel
          showModal={accountModal.open}
          setModalOpen={open => {
            if (!open) {
              setAccountModal({ open: false, account: null });
              fetchAccounts();
            }
          }}
          editAccount={accountModal.account}
          getList={fetchAccounts}
        />
      )}

      <ExportReportModal
        modalOpen={exportModalOpen}
        setModalOpen={setExportModalOpen}
        reportName="Chart_of_Accounts"
        title="Export Chart of Accounts"
        initialFormat="xlsx"
        formats={['pdf', 'xlsx']}
        onExport={handleExport}
      />
    </div>
  );
};

export default ViewChartOfAccounts;
