import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button, Dropdown, Tooltip } from '@/components/AntDComponent';
import BackButton from '@/components/ui/button/BackButton';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import NoFoundPage from '@/components/ui/common/NoFoundPage';
import PageHeader from '@/components/ui/common/PageHeader';
import Toast from '@/components/ui/common/Toast';
import ColumnSelection from '@/components/ui/common/ColumnSelection';
import FilterDrawer, { FilterButton, FilterSection } from '@/components/ui/common/FilterDrawer';
import FilterLockButton from '@/components/ui/common/FilterLockButton';
import FilterInput from '@/components/forms/formInput/FilterInput';
import CustomDatePicker from '@/components/forms/formDatePicker/CustomDatePicker';
import ExportReportModal from '@/components/feedback/formModal/ExportReportModal';

import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import useModulePermissions from '@/hooks/useModulePermissions';
import useDocumentListToolbar from '@/hooks/useDocumentListToolbar';
import { useProfile } from '@/features/setting/profile/useProfile';
import { useChartOfAccounts } from '@/features/accountant/chartOfAccount';
import { accountService } from '@/features/accountant/chartOfAccount/chartOfAccount.service';
import { FILTERS_KEYS, RESOURCES } from '@/utils/jsonFile';
import { accountLedgerColumns } from '@/features/accountant/chartOfAccount/chartOfAccount.columns';
import { downloadAccountLedgerExcel } from '@/features/accountant/chartOfAccount/pdf/AccountLedgerExcel';

import Icons from 'assets/icons/icon';
import { DEFAULT_PAGE_SIZE } from '@/utils/pagination';
import { formatAmount } from '@/utils/currency';
import { configEnum, filterInputEnum, LEDGER_DETAIL_ROUTES, LEDGER_SOURCE_MODULES, LEDGER_PARTY_TYPES } from '@/utils/constants';
import { CommonFilterTags, useFilters } from '@/utils/filtersUtils';
import { dateFormateForBackend, getFromLocalStorage, parsedTableCoulmns } from '@/utils/services';
import { buildBranchSelectOptions, branchSelectColumnHeader } from '@/utils/tableSelectDropdown/orgSelectDropdown';
import { renderPdfToBlob } from '@/utils/loadReactPdf';
import { isCanceledRequestError } from '@/utils/serviceHelper';

const FILTER_KEY = FILTERS_KEYS.CHART_OF_ACCOUNT_DETAIL_FILTER;

const API_CALLED_ENUM = {
  BRANCH_DROPDOWN: 'branchDropdown',
};

const formatEnumLabel = value =>
  String(value || '')
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const SOURCE_MODULE_OPTIONS = Object.values(LEDGER_SOURCE_MODULES).map(value => ({
  label: formatEnumLabel(value),
  value,
}));

const PARTY_TYPE_OPTIONS = Object.values(LEDGER_PARTY_TYPES).map(value => ({
  label: formatEnumLabel(value),
  value,
}));

const ChartOfAccountDetail = () => {
  const navigate = useNavigate();
  const { accountId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const isApicalledRefFilter = useRef({
    branchDropdown: false,
  });
  const { accountLedger, ledgerLoading, getAccountLedger, resetAccountLedger } = useChartOfAccounts();
  const { useModuleAccountant, isSplitSessionActive, allBranchDrop, allBranchLoading, getAllBranchDropDown } = useModulePermissions(RESOURCES.ACCOUNTANT);
  const { profile, getProfile } = useProfile();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);
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
    handleResetFilters,
    getActiveFiltersCount,
    handleLockToggle,
    setIsLocked,
  } = useFilters({
    searchParams,
    setSearchParams,
    pagination: { limit },
    FILTER_KEY,
    setShowFilter,
    defaultFilter: {
      branchId: searchParams.get('branchId') || '',
      sourceModule: searchParams.get('sourceModule') || '',
      partyType: searchParams.get('partyType') || '',
    },
    dateKeys: { startDate: 'startDate', endDate: 'endDate', singleDate: 'date' },
  });

  const handleApplyFilters = useCallback(() => {
    if (selectedPreset === 'today' && dateRange?.[0]) {
      const todayDate = dateFormateForBackend(dateRange[0]);
      updateUrlParams({
        ...filter,
        page: 1,
        limit,
        preset: 'today',
        startDate: todayDate,
        endDate: todayDate,
        date: null,
      });
      setShowFilter(false);
      return;
    }
    handleFilter();
  }, [selectedPreset, dateRange, filter, limit, updateUrlParams, handleFilter]);

  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const branchId = searchParams.get('branchId');
  const sourceModule = searchParams.get('sourceModule');
  const partyType = searchParams.get('partyType');

  const fetchLedger = useCallback(
    (signal, overrides = {}) => {
      getAccountLedger({
        accountId,
        page: overrides.page ?? page,
        limit: overrides.limit ?? limit,
        isSplit: isSplitSessionActive,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        branchId: branchId || undefined,
        sourceModule: sourceModule || undefined,
        partyType: partyType || undefined,
        signal,
      });
    },
    [getAccountLedger, accountId, page, limit, isSplitSessionActive, startDate, endDate, branchId, sourceModule, partyType]
  );

  useEffect(() => {
    resetAccountLedger();
    setPage(1);
  }, [isSplitSessionActive, resetAccountLedger]);

  useEffect(() => {
    setPage(1);
  }, [startDate, endDate, branchId, sourceModule, partyType]);

  useEffect(() => {
    const controller = new AbortController();
    fetchLedger(controller.signal);
    return () => controller.abort();
  }, [fetchLedger]);

  const handleOnFocusApiCall = async type => {
    const next = { ...isApicalledRefFilter.current };

    if (type === API_CALLED_ENUM.BRANCH_DROPDOWN) {
      await getAllBranchDropDown({});
      next.branchDropdown = true;
    }

    isApicalledRefFilter.current = next;
  };

  useEffect(() => {
    if (searchParams.get('branchId')) {
      handleOnFocusApiCall(API_CALLED_ENUM.BRANCH_DROPDOWN);
    }
  }, [filter?.branchId]);

  useResetOnUnmount(resetAccountLedger);

  const account = accountLedger?.account;
  const columns = useMemo(() => accountLedgerColumns(), []);

  const columnsFromLocalStorage = getFromLocalStorage(configEnum?.ACCOUNT_LEDGER_CONFIG);
  const parsedColumnData = parsedTableCoulmns(columnsFromLocalStorage, columns);
  const displayColumn = parsedColumnData?.displayColumn?.filter(x => x?.visible === true);

  const [columnsList, setColumnsList] = useState(parsedColumnData?.displayColumn);
  const [customizedColumns, setCutomizedColumns] = useState([...(parsedColumnData?.customizedColumn?.length > 0 ? parsedColumnData.customizedColumn : displayColumn)]);

  const getDefaultAccountLedgerColumns = useCallback(() => accountLedgerColumns(), []);

  const { showColumnModal, setShowColumnModal, standardDropdownItems } = useDocumentListToolbar({
    filterKey: FILTER_KEY,
    columnConfigKey: configEnum?.ACCOUNT_LEDGER_CONFIG,
    showPreferences: false,
    columnsConfig: {
      getDefaultColumns: getDefaultAccountLedgerColumns,
      setColumnsList,
      setCustomizedColumns: setCutomizedColumns,
    },
    handleResetFilters,
    onRefresh: () => fetchLedger(new AbortController().signal),
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
                  label: 'Export Account Ledger',
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

  const handleRowClick = useCallback(
    record => {
      const target = LEDGER_DETAIL_ROUTES[record?.refType];
      if (!target || !record?.refId) return;
      navigate({ pathname: `/${target.build(record.refId)}`, hash: target.hash ? `#${target.hash}` : '' });
    },
    [navigate]
  );

  const buildExportPayload = useCallback(
    signal => ({
      accountId,
      pagination: false,
      isSplit: isSplitSessionActive,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      branchId: branchId || undefined,
      sourceModule: sourceModule || undefined,
      partyType: partyType || undefined,
      signal,
    }),
    [accountId, isSplitSessionActive, startDate, endDate, branchId, sourceModule, partyType]
  );

  const fetchExportLedger = useCallback(
    async signal => {
      const response = await accountService.getAccountLedger(buildExportPayload(signal));
      return response?.data || null;
    },
    [buildExportPayload]
  );

  const handleExport = useCallback(
    async (format, filename) => {
      const controller = new AbortController();
      try {
        const ledgerData = await fetchExportLedger(controller.signal);
        const entries = ledgerData?.entries || [];
        const exportAccount = ledgerData?.account;

        if (!entries.length && !exportAccount) {
          Toast.warning('No data available to export.');
          return;
        }

        if (format === 'pdf') {
          const result = await getProfile({});
          const latestProfile = result?.payload?.data || profile;
          const safeName = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;
          const { AccountLedgerPdf } = await import('@/features/accountant/chartOfAccount/pdf/AccountLedgerPdf');
          const blob = await renderPdfToBlob(<AccountLedgerPdf account={exportAccount} entries={entries} profile={latestProfile} startDate={startDate || ''} endDate={endDate || ''} />);
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = safeName;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        } else if (format === 'xlsx') {
          await downloadAccountLedgerExcel({
            account: exportAccount,
            entries,
            filename,
          });
        }
      } catch (error) {
        if (isCanceledRequestError(error)) return;
        console.error('Account ledger export error:', error);
        Toast.error('Failed to export. Please try again.');
        throw error;
      }
    },
    [fetchExportLedger, getProfile, profile, startDate, endDate]
  );

  // The balance leads, the way an account is read: what it is worth, then what it is made of.
  const rightStats = [
    {
      label: 'Closing Balance',
      value: account ? `${formatAmount(account.closingBalance)} ${account.isDebit ? 'Dr' : 'Cr'}` : formatAmount(0),
    },
    { label: 'Total Debit', value: formatAmount(account?.totalDebit ?? 0) },
    { label: 'Total Credit', value: formatAmount(account?.totalCredit ?? 0) },
    { label: 'Account Type', value: account?.categoryDisplayName ?? '-' },
  ];

  if (!ledgerLoading && accountLedger && !account) {
    return (
      <NoFoundPage
        title="Account not found"
        description="This account may have been deleted or you may not have access to view it."
        action={
          <Button type="primary" onClick={() => navigate('/accountant')}>
            Back to Chart of Accounts
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden -m-4">
      <div className="bg-white px-4 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        <div className="flex items-center gap-3 min-w-0">
          <BackButton />
          <PageHeader title={account?.accountName || 'Account Ledger'} loading={ledgerLoading} rightStats={rightStats} />
        </div>
        <div className="flex flex-wrap gap-2 md:gap-3 justify-center md:justify-end shrink-0">
          <Tooltip title="More Actions" placement="left">
            <Dropdown menu={{ items: moreActionsItems, className: 'app-toolbar-dropdown' }} trigger={['click']}>
              <CustomButton type="default" icon={<Icons.EllipsisOutlined />} />
            </Dropdown>
          </Tooltip>
        </div>
      </div>

      <div className="bg-white border-t px-4 py-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <ColumnSelection
            columns={columnsList}
            setColumnsList={setColumnsList}
            setCutomizedColumns={setCutomizedColumns}
            configPage={configEnum?.ACCOUNT_LEDGER_CONFIG}
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

          <FilterSection title="Organization">
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name="branchId"
                label="Branch"
                placeHolder="Select Branch"
                selectVariant="twoColumn"
                columnSelectHeader={branchSelectColumnHeader}
                selectionOptions={buildBranchSelectOptions(allBranchDrop)}
                value={filter?.branchId}
                setFilter={setFilter}
                allowClear
                loading={allBranchLoading}
                onFocus={() => {
                  if (!isApicalledRefFilter.current.branchDropdown) {
                    handleOnFocusApiCall(API_CALLED_ENUM.BRANCH_DROPDOWN);
                  }
                }}
              />
            </div>
          </FilterSection>

          <FilterSection title="Ledger">
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name="sourceModule"
                label="Source Module"
                placeHolder="Select Source Module"
                selectionOptions={SOURCE_MODULE_OPTIONS}
                value={filter?.sourceModule}
                setFilter={setFilter}
                allowClear
              />
            </div>

            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name="partyType"
                label="Party Type"
                placeHolder="Select Party Type"
                selectionOptions={PARTY_TYPE_OPTIONS}
                value={filter?.partyType}
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
            branchId: {
              label: 'Branch',
              format: value => allBranchDrop?.find(item => item?.id === value)?.name || value,
              clear: (setFilterState, updateParams) => {
                setFilterState(prev => ({ ...prev, branchId: '' }));
                updateParams({ branchId: null });
              },
            },
            sourceModule: {
              label: 'Source Module',
              format: value => SOURCE_MODULE_OPTIONS.find(option => option.value === value)?.label || formatEnumLabel(value),
              clear: (setFilterState, updateParams) => {
                setFilterState(prev => ({ ...prev, sourceModule: '' }));
                updateParams({ sourceModule: null });
              },
            },
            partyType: {
              label: 'Party Type',
              format: value => PARTY_TYPE_OPTIONS.find(option => option.value === value)?.label || formatEnumLabel(value),
              clear: (setFilterState, updateParams) => {
                setFilterState(prev => ({ ...prev, partyType: '' }));
                updateParams({ partyType: null });
              },
            },
          }}
        />
      </div>

      <CustomTable
        columns={customizedColumns}
        data={accountLedger?.entries || []}
        loading={ledgerLoading}
        tableId="id"
        onRowClick={handleRowClick}
        pagination={{
          current: accountLedger?.page || page,
          pageSize: accountLedger?.limit || limit,
          total: accountLedger?.totalResults || 0,
          onChange: (nextPage, nextPageSize) => {
            setPage(nextPage);
            if (nextPageSize !== limit) setLimit(nextPageSize);
          },
        }}
      />

      <ExportReportModal
        modalOpen={exportModalOpen}
        setModalOpen={setExportModalOpen}
        reportName="Account_Ledger"
        entity={account?.accountName || ''}
        title="Export Account Ledger"
        initialFormat="xlsx"
        formats={['pdf', 'xlsx']}
        onExport={handleExport}
      />
    </div>
  );
};

export default ChartOfAccountDetail;
