import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

// Components
import ColumnSelection from '@/components/ui/common/ColumnSelection';
import FilterLockButton from '@/components/ui/common/FilterLockButton';
import FilterDrawer, { FilterSection, FilterButton } from '@/components/ui/common/FilterDrawer';
import CustomButton from '@/components/ui/button/CustomButton';
import ViewDocumentListToolbarModals from '@/components/ui/common/ViewDocumentListToolbarModals';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomDatePicker from '@/components/forms/formDatePicker/CustomDatePicker';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import FilterInput from '@/components/forms/formInput/FilterInput';
import PageHeader from '@/components/ui/common/PageHeader';
import { DocumentConfirmModal } from '@/components/feedback/confirmModal/CancelOrDeleteDocumentModal';
import { Dropdown, Tooltip } from '@/components/AntDComponent';

// Hooks
import useModulePermissions from 'hooks/useModulePermissions';
import useDocumentListToolbar from '@/hooks/useDocumentListToolbar';
import useDocumentPdfExport from '@/hooks/useDocumentPdfExport';
import useColumnResize from '@/hooks/useColumnResize';
import { CommonFilterTags, getCustomerFilterTag, useFilters } from '@/utils/filtersUtils';
import { useUser } from '@/features/setting/user/useUser';
import { useCustomer } from '@/features/sales/customer';
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import { useConfirmModal } from '@/hooks/useConfirmModal';

// Extras
import { useExpenses, expensesColumn, expenseExportColumn, getExpenseDocumentDetails } from '@/features/purchase/expenses';
import Icons from 'assets/icons/icon';
import { getAllFiltersFromLocalStorage } from '@/utils/filters';
import { FILTERS_KEYS, RESOURCES } from '@/utils/jsonFile';
import { configEnum, filterInputEnum, MODULE_NAMES } from 'utils/constants';
import { getFromLocalStorage, getQueryParams, parsedTableCoulmns } from 'utils/services';
import { PAGE_HEADERS } from '@/utils/label';
import { formatAmount } from '@/utils/currency';
import { resetBranch } from '@/features/allMaster/warehouse';
import { buildDivisionSelectOptions, buildBranchSelectOptions, divisionSelectColumnHeader, branchSelectColumnHeader } from '@/utils/tableSelectDropdown/orgSelectDropdown';
import LocationFilters, { getLocationFilterTags } from '@/components/forms/formInput/LocationFilters';
import { buildCustomerSelectOptionsWithRole, customerSelectDropdownProps } from '@/utils/tableSelectDropdown/customerSelectDropdown';

const API_CALLED_ENUM = {
  DIVISION_DROPDOWN: 'divisionDropdown',
  USERS_DROPDOWN: 'usersDropdown',
  PARTY_DROPDOWN: 'partyDropdown',
};

const ViewExpenses = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [showFilter, setShowFilter] = useState(false);
  const deleteModal = useConfirmModal();
  const { expenses, pagination, loading, deleteLoading, exportLoading, getExpenses, getExpenseExports, removeExpenses, resetExpensesList } = useExpenses();
  const { isViewOnly, useModuleExpenses, divDrop, divisionLoading, getDivDropDown, branchDrop, branchLoading, getBranchDropDown } = useModulePermissions(RESOURCES.EXPENSES);
  const { usersDropdown, usersDropdownLoading, getUsersDropdown } = useUser();
  const { allCustomersDropDownList, loading: partyLoading, getAllCustomersDropList } = useCustomer();
  const isApicalledRefFilter = useRef({
    divisionDropdown: false,
    usersDropdown: false,
    partyDropdown: false,
  });
  const FILTER_KEY = FILTERS_KEYS.EXPENSES_ALL_FILTER;
  const [searchParams, setSearchParams] = useSearchParams();
  const isApiCalledRef = useRef(false);
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
    handleLockToggle,
    getActiveFiltersCount,
    setIsLocked,
  } = useFilters({
    searchParams,
    setSearchParams,
    pagination,
    FILTER_KEY,
    setShowFilter,
    defaultFilter: {
      search: searchParams.get('search') || '',
      addedBy: searchParams.get('addedBy') ? searchParams.get('addedBy').split(',') : '',
      division: searchParams.get('division') ? searchParams.get('division').split(',') : '',
      branch: searchParams.get('branch') ? searchParams.get('branch').split(',') : '',
      country: searchParams.get('country') ? searchParams.get('country').split(',') : '',
      state: searchParams.get('state') ? searchParams.get('state').split(',') : '',
      city: searchParams.get('city') ? searchParams.get('city').split(',') : '',
      addressType: searchParams.get('addressType') || '',
      customerId: searchParams.get('customerId') || '',
    },
    dateKeys: { startDate: 'startDate', endDate: 'endDate', singleDate: 'date' },
  });

  const handleViewClick = record => {
    navigate(`/expenses/${record.id}`, {
      state: {
        expenseData: record,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleEditClick = record => {
    navigate(`/expenses/${record.id}/edit`, {
      state: {
        expenseData: record,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleDuplicateClick = record => {
    navigate('/expenses/new', {
      state: {
        duplicateFromId: record.id,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleDeleteClick = record => {
    deleteModal.open(record);
  };

  const deleteExpense = async () => {
    await removeExpenses({ expenseId: deleteModal.payload?.id || deleteModal.payload?._id });
    deleteModal.close();
    fetchExpenses();
  };

  const fetchExpenses = signal => {
    const page = parseInt(searchParams?.get('page')) || 1;
    const pageSize = parseInt(searchParams?.get('limit')) || pagination.limit;

    const payload = getQueryParams(window.location.href) || {};

    getExpenses({ ...payload, page, limit: pageSize, signal });
  };

  const handlePaginationChange = (page, pageSize) => {
    updateUrlParams({ page, limit: pageSize });
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
        if (savedFilters.preset) {
          setSelectedPreset(savedFilters.preset);
        }
        if (savedFilters.startDate && savedFilters.endDate) {
          setDateRange([savedFilters.startDate, savedFilters.endDate]);
        } else if (savedFilters.date) {
          setDateRange([savedFilters.date, savedFilters.date]);
        }

        setFilter(prev => ({
          ...prev,
          search: savedFilters.search ?? prev.search,
          addedBy: savedFilters.addedBy ? savedFilters.addedBy.split(',') : prev.addedBy,
          division: savedFilters.division ? savedFilters?.division?.split(',') : prev.division,
          branch: savedFilters.branch ? savedFilters?.branch?.split(',') : prev.branch,
          country: savedFilters.country ? savedFilters.country.split(',') : prev.country,
          state: savedFilters.state ? savedFilters.state.split(',') : prev.state,
          city: savedFilters.city ? savedFilters.city.split(',') : prev.city,
          addressType: savedFilters.addressType ?? prev.addressType,
          customerId: savedFilters.customerId ?? prev.customerId,
        }));

        if (savedFilters?.division?.split(',')?.length > 0) {
          handleOnFocusApiCall(API_CALLED_ENUM.DIVISION_DROPDOWN);
        }

        if (savedFilters?.addedBy?.split(',')?.length > 0) {
          handleOnFocusApiCall(API_CALLED_ENUM.USERS_DROPDOWN);
        }

        if (savedFilters?.customerId) {
          handleOnFocusApiCall(API_CALLED_ENUM.PARTY_DROPDOWN);
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
    fetchExpenses(controller.signal);
    return () => controller.abort();
  }, [searchParams]);

  useResetOnUnmount(resetExpensesList);

  useEffect(() => {
    const controller = new AbortController();

    if (!filter?.division || filter?.division?.length <= 0) {
      dispatch(resetBranch());
    }

    if (filter?.division?.length > 0) {
      const payload = { divisionId: filter?.division, signal: controller.signal };
      getBranchDropDown(payload);
    }
    return () => controller.abort();
  }, [filter?.division]);

  const handleOnFocusApiCall = async type => {
    let obj = { ...isApicalledRefFilter.current };

    if (type === API_CALLED_ENUM.DIVISION_DROPDOWN) {
      await getDivDropDown({});
      obj.divisionDropdown = true;
    }

    if (type === API_CALLED_ENUM.USERS_DROPDOWN) {
      await getUsersDropdown();
      obj.usersDropdown = true;
    }

    if (type === API_CALLED_ENUM.PARTY_DROPDOWN) {
      await getAllCustomersDropList({});
      obj.partyDropdown = true;
    }

    isApicalledRefFilter.current = obj;
  };

  useEffect(() => {
    if (searchParams.get('division')) {
      handleOnFocusApiCall(API_CALLED_ENUM.DIVISION_DROPDOWN);
    }
    if (searchParams.get('addedBy')) {
      handleOnFocusApiCall(API_CALLED_ENUM.USERS_DROPDOWN);
    }
    if (searchParams.get('customerId')) {
      handleOnFocusApiCall(API_CALLED_ENUM.PARTY_DROPDOWN);
    }
  }, []);

  const columns = expensesColumn(handleEditClick, useModuleExpenses, handleViewClick, handleDeleteClick, isViewOnly, handleDuplicateClick);

  let columnsFromLocalStorage = getFromLocalStorage(configEnum?.EXPENSE_CONFIG);
  let parsedColumnData = parsedTableCoulmns(columnsFromLocalStorage, columns);

  let displayColumn = parsedColumnData?.displayColumn?.filter(x => x?.visible === true);
  const [columnsList, setColumnsList] = useState(parsedColumnData?.displayColumn.slice(0, -1));
  const [customizedColumns, setCutomizedColumns] = useState([...(parsedColumnData?.customizedColumn?.length > 0 ? parsedColumnData.customizedColumn : displayColumn)]);

  const handleColumnResize = useColumnResize(setColumnsList, setCutomizedColumns, configEnum?.EXPENSE_CONFIG);

  const setColumnsListForToolbar = useCallback(cols => {
    setColumnsList(Array.isArray(cols) ? cols.slice(0, -1) : cols);
  }, []);

  const getDefaultExpenseColumns = useCallback(
    () => expensesColumn(handleEditClick, useModuleExpenses, handleViewClick, handleDeleteClick, isViewOnly, handleDuplicateClick),
    [handleEditClick, useModuleExpenses, handleViewClick, handleDeleteClick, isViewOnly, handleDuplicateClick]
  );

  const { pdfExportLoading, handlePdfExport } = useDocumentPdfExport({
    defaultFileName: 'Expenses_Export',
    filterKeys: ['date', 'country', 'state', 'city', 'addressType'],
    moduleType: 'expense',
  });

  const { showColumnModal, setShowColumnModal, standardDropdownItems, toolbarModalsProps } = useDocumentListToolbar({
    moduleName: MODULE_NAMES.EXPENSE,
    resource: RESOURCES.EXPENSES,
    filterKey: FILTER_KEY,
    columnConfigKey: configEnum?.EXPENSE_CONFIG,
    configErrorMessage: 'Failed to update expense configuration',
    exportConfig: {
      exportLoading: exportLoading || pdfExportLoading,
      fetchExports: getExpenseExports,
      getExportColumns: expenseExportColumn,
      defaultFileName: 'Expenses_Export',
      sheetName: 'Expenses',
      entityPlural: 'Expenses',
      formName: 'export-expenses',
      exportLabel: 'Export Expenses',
      formats: ['xlsx', 'pdf'],
      onPdfExport: handlePdfExport,
    },
    columnsConfig: {
      getDefaultColumns: getDefaultExpenseColumns,
      setColumnsList: setColumnsListForToolbar,
      setCustomizedColumns: setCutomizedColumns,
    },
    handleResetFilters,
    onRefresh: () => fetchExpenses(),
    setIsLocked,
  });

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden -m-4">
      <div className="bg-white px-4 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        <PageHeader
          loading={loading}
          title={PAGE_HEADERS?.EXPENSES?.title}
          rightStats={[
            { label: 'Total Count', value: pagination?.totalResults || 0 },
            { label: 'Total Expense Amount', value: formatAmount(pagination?.totalAmount || 0, true) },
            { label: 'Company Cost', value: formatAmount(pagination?.companyCost || 0, true) },
            { label: 'Recoverable from Party', value: formatAmount(pagination?.recoverableFromParty || 0, true), colorClass: 'text-amber-700' },
            { label: 'Input Tax Credit', value: formatAmount(pagination?.inputTaxCredit || 0, true), colorClass: 'text-green-700' },
          ]}
        />
        <div className="flex flex-wrap justify-center md:justify-end items-center gap-2 md:gap-3 w-full md:w-auto">
          <PermissionButton
            canAccess={!!useModuleExpenses?.create}
            isViewOnly={isViewOnly}
            type="primary"
            className="py-4 px-5 w-full md:w-auto"
            wrapperClassName="w-full md:w-auto inline-block"
            onClick={() => navigate('/expenses/new')}
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
          <FilterInput type={filterInputEnum?.SEARCH} name={'search'} placeHolder="Search..." value={filter?.search} setFilter={setFilter} onSerch={handleSearch} onClear={handleClear} />
          <ColumnSelection
            columns={columnsList}
            setColumnsList={setColumnsList}
            setCutomizedColumns={setCutomizedColumns}
            configPage={configEnum?.EXPENSE_CONFIG}
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
          <FilterSection title="When" columns={1}>
            <div>
              <CustomDatePicker selectedPreset={selectedPreset} setSelectedPreset={setSelectedPreset} dateRange={dateRange} setDateRange={setDateRange} />
            </div>
          </FilterSection>

          <FilterSection title="Who">
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                name={'customerId'}
                label={'Party'}
                placeHolder={'Select Party'}
                selectVariant="twoColumn"
                columnSelectHeader={{ id: 'Party ID', name: 'Party Name', role: 'Role' }}
                selectPopupClassName={customerSelectDropdownProps.selectPopupClassNameWithRole}
                selectionOptions={buildCustomerSelectOptionsWithRole(allCustomersDropDownList)}
                value={filter?.customerId}
                setFilter={setFilter}
                allowClear={true}
                loading={partyLoading}
                onFocus={() => {
                  if (!isApicalledRefFilter.current.partyDropdown) {
                    handleOnFocusApiCall(API_CALLED_ENUM.PARTY_DROPDOWN);
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                mode="multiple"
                name={'addedBy'}
                label={'Added By'}
                placeHolder={'Select User'}
                selectionOptions={(usersDropdown || []).map(u => ({
                  label: u.name || [u.firstName, u.lastName].filter(Boolean).join(' ') || u.email || '',
                  value: u.id || u._id,
                }))}
                value={filter?.addedBy}
                setFilter={setFilter}
                allowClear={true}
                loading={usersDropdownLoading}
                onFocus={() => {
                  if (!isApicalledRefFilter.current.usersDropdown) {
                    handleOnFocusApiCall(API_CALLED_ENUM.USERS_DROPDOWN);
                  }
                }}
              />
            </div>
          </FilterSection>

          <FilterSection title="Where">
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                mode="multiple"
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
            <LocationFilters filter={filter} setFilter={setFilter} />
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
            updateUrlParams({ startDate: null, endDate: null, date: null, preset: null });
          }}
          divDrop={divDrop}
          branchDrop={branchDrop}
          extraFilters={{
            ...getCustomerFilterTag('Party', allCustomersDropDownList),
            addedBy: {
              label: 'Added By',
              format: value => {
                if (!value) return null;
                const ids = value.split(',').filter(Boolean);
                if (!ids.length) return null;
                const names = ids.map(id => {
                  const found = (usersDropdown || []).find(u => String(u?.id || u?._id) === String(id));
                  return found ? found.name || [found.firstName, found.lastName].filter(Boolean).join(' ') || found.email || null : null;
                });
                return names.filter(Boolean).join(', ');
              },
              clear: (setFilter, updateUrlParams) => {
                setFilter(prev => ({ ...prev, addedBy: '' }));
                updateUrlParams({ addedBy: null });
              },
            },
            ...getLocationFilterTags(),
          }}
        />
      </div>
      <div>
        <CustomTable
          onColumnResize={handleColumnResize}
          columns={[...customizedColumns, columns[columns.length - 1]]}
          loading={loading}
          data={expenses}
          onRowClick={handleViewClick}
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
      <ViewDocumentListToolbarModals {...toolbarModalsProps} />
      <DocumentConfirmModal modal={deleteModal} docType={MODULE_NAMES?.EXPENSE} onConfirm={deleteExpense} loading={deleteLoading} getDocumentDetails={getExpenseDocumentDetails} />
    </div>
  );
};

export default ViewExpenses;
