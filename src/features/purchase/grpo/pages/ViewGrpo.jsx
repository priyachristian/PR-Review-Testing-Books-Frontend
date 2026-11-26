import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

// Components
import ColumnSelection from '@/components/ui/common/ColumnSelection';
import StatusFilterTabs from '@/components/ui/common/StatusFilterTabs';
import FilterLockButton from '@/components/ui/common/FilterLockButton';
import FilterDrawer, { FilterSection, FilterButton } from '@/components/ui/common/FilterDrawer';
import ConvertToSelectionModal from '@/features/purchase/purchaseOrder/components/ConvertToSelectionModal';
import CustomButton from '@/components/ui/button/CustomButton';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomDatePicker from '@/components/forms/formDatePicker/CustomDatePicker';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import FilterInput from '@/components/forms/formInput/FilterInput';
import PageHeader from '@/components/ui/common/PageHeader';
import ViewDocumentListToolbarModals from '@/components/ui/common/ViewDocumentListToolbarModals';
import { DocumentConfirmModal } from '@/components/feedback/confirmModal/CancelOrDeleteDocumentModal';
import { Dropdown, Tag, Tooltip } from '@/components/AntDComponent';

// Hooks
import { useConvert } from 'hooks/useConvert';
import useModulePermissions from 'hooks/useModulePermissions';
import { useFilters } from '@/utils/filtersUtils';
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import useDocumentListToolbar from '@/hooks/useDocumentListToolbar';
import useDocumentPdfExport from '@/hooks/useDocumentPdfExport';
import useColumnResize from '@/hooks/useColumnResize';
import { useConfirmModal } from '@/hooks/useConfirmModal';
import { useUser } from '@/features/setting/user/useUser';
import { useCustomer } from '@/features/sales/customer';

// Extras
import { useGRPO, grpoColumn, grpoExportColumn, getGrpoDocumentDetails } from '@/features/purchase/grpo';
import Icons from 'assets/icons/icon';
import { FILTERS_KEYS, RESOURCES } from '@/utils/jsonFile';
import { CommonFilterTags, getCustomerFilterTag } from '@/utils/filtersUtils';
import { resetBranch } from '@/features/allMaster/warehouse/warehouse.slice';
import {
  BACKEND_ENUM,
  COMPANY_FEATURE,
  configEnum,
  filterInputEnum,
  GRPO_CONVERSION_ALLOWED_STATUSES,
  GRPO_EDIT_RESTRICTED_STATUS,
  GRPO_STATUS,
  GRPO_STATUS_CHANGE_RESTRICTED_STATUS,
  MODULE_NAMES,
  PERMISSION_MESSAGES,
} from 'utils/constants';
import { getAllFiltersFromLocalStorage } from '@/utils/filters';
import { getFromLocalStorage, getQueryParams, parsedTableCoulmns } from 'utils/services';
import { colorPalette } from '@/utils/theme';
import { PAGE_HEADERS } from 'utils/label';
import { buildDivisionSelectOptions, buildBranchSelectOptions, divisionSelectColumnHeader, branchSelectColumnHeader } from '@/utils/tableSelectDropdown/orgSelectDropdown';
import { buildCustomerSelectOptions, vendorSelectColumnHeader, customerSelectDropdownProps } from '@/utils/tableSelectDropdown/customerSelectDropdown';
import LocationFilters, { getLocationFilterTags } from '@/components/forms/formInput/LocationFilters';

const API_CALLED_ENUM = {
  DIVISION_DROPDOWN: 'divisionDropdown',
  USERS_DROPDOWN: 'usersDropdown',
  VENDOR_DROPDOWN: 'vendorDropdown',
};

const ViewGrpo = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const { grpoOrders, pagination, submitLoading, deleteLoading, loading, exportLoading, getgrpos, getGrpoExports, removeGrpo, resetGrpos, updateStatus } = useGRPO();
  const { usersDropdown, usersDropdownLoading, getUsersDropdown } = useUser();
  const { signin, isViewOnly, isSplitSessionActive, useModuleGrpo, divDrop, divisionLoading, getDivDropDown, branchDrop, branchLoading, getBranchDropDown, useModuleBills } = useModulePermissions(
    RESOURCES.GRPO
  );
  const { vendorDropDownList, loading: vendorLoading, getVendorDropList } = useCustomer();
  const FILTER_KEY = FILTERS_KEYS.GRPO_ALL_FILTER;
  const { handleConvertGRPO } = useConvert();
  const deleteModal = useConfirmModal();
  const cancelStatusModal = useConfirmModal();
  const [openDropdownKey, setOpenDropdownKey] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const isApiCalledRef = useRef(false);
  const isApicalledRefFilter = useRef({
    divisionDropdown: false,
    usersDropdown: false,
    vendorDropdown: false,
  });
  const [showFilter, setShowFilter] = useState(false);
  const [isOpenConvertModal, setIsOpenConvertModal] = useState(false);
  const [convertType, setConvertType] = useState('');
  // const [clearSelection, setClearSelection] = useState(null);
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
      status: searchParams.get('status') ? searchParams.get('status').split(',') : '',
      division: searchParams.get('division') ? searchParams.get('division').split(',') : '',
      branch: searchParams.get('branch') ? searchParams.get('branch').split(',') : '',
      customerId: searchParams.get('customerId') ? searchParams.get('customerId').split(',') : '',
      addedBy: searchParams.get('addedBy') ? searchParams.get('addedBy').split(',') : '',
      country: searchParams.get('country') ? searchParams.get('country').split(',') : '',
      state: searchParams.get('state') ? searchParams.get('state').split(',') : '',
      city: searchParams.get('city') ? searchParams.get('city').split(',') : '',
      addressType: searchParams.get('addressType') || '',
    },
    dateKeys: { startDate: 'startDate', endDate: 'endDate', singleDate: 'grpoDate' },
  });

  useEffect(() => {
    const savedFilters = getAllFiltersFromLocalStorage(FILTER_KEY);

    if (!isApiCalledRef.current && !searchParams.get('page') && !searchParams.get('limit')) {
      if (savedFilters && Object.keys(savedFilters).length > 0) {
        if (savedFilters.preset) {
          setSelectedPreset(savedFilters.preset);
        }
        if (savedFilters.startDate && savedFilters.endDate) {
          setDateRange([savedFilters.startDate, savedFilters.endDate]);
        } else if (savedFilters.grpoDate) {
          setDateRange([savedFilters.grpoDate, savedFilters.grpoDate]);
        }

        setFilter(prev => ({
          ...prev,
          search: savedFilters.search ?? prev.search,
          status: savedFilters.status ? savedFilters?.status?.split(',') : prev.status,
          division: savedFilters.division ? savedFilters?.division?.split(',') : prev.division,
          branch: savedFilters.branch ? savedFilters?.branch?.split(',') : prev.branch,
          customerId: savedFilters.customerId ? savedFilters?.customerId?.split(',') : prev.customerId,
          addedBy: savedFilters.addedBy ? savedFilters.addedBy.split(',') : prev.addedBy,
          country: savedFilters.country ? savedFilters.country.split(',') : prev.country,
          state: savedFilters.state ? savedFilters.state.split(',') : prev.state,
          city: savedFilters.city ? savedFilters.city.split(',') : prev.city,
          addressType: savedFilters.addressType ?? prev.addressType,
        }));

        if (savedFilters?.division?.split(',')?.length > 0) {
          handleOnFocusApiCall(API_CALLED_ENUM.DIVISION_DROPDOWN);
        }

        if (savedFilters?.customerId?.split(',')?.length > 0) {
          handleOnFocusApiCall(API_CALLED_ENUM.VENDOR_DROPDOWN);
        }

        if (savedFilters?.addedBy?.split(',')?.length > 0) {
          handleOnFocusApiCall(API_CALLED_ENUM.USERS_DROPDOWN);
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
    fetchGRPO(controller.signal);
    return () => controller.abort();
  }, [searchParams]);

  useResetOnUnmount(resetGrpos);

  const isSplitInitRef = useRef(true);
  useEffect(() => {
    if (isSplitInitRef.current) {
      isSplitInitRef.current = false;
      return;
    }
    const controller = new AbortController();
    fetchGRPO(controller.signal);
    return () => controller.abort();
  }, [isSplitSessionActive]);

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

    if (type === API_CALLED_ENUM.VENDOR_DROPDOWN) {
      await getVendorDropList({});
      obj.vendorDropdown = true;
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
      handleOnFocusApiCall(API_CALLED_ENUM.VENDOR_DROPDOWN);
    }
  }, []);

  const handleEditClick = record => {
    navigate(`/grpo/${record.id}/edit`, {
      state: {
        grpoData: record,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleDuplicateClick = record => {
    navigate('/grpo/new', {
      state: {
        duplicateFromId: record.id,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const fetchGRPO = signal => {
    const page = parseInt(searchParams?.get('page')) || 1;
    const pageSize = parseInt(searchParams?.get('limit')) || pagination.limit;

    const payload = getQueryParams(window.location.href) || {};

    getgrpos({ ...payload, page, limit: pageSize, ...(isSplitSessionActive ? { isSplit: true } : {}), signal });
  };

  const handleStatusTab = statusArr => {
    const status = Array.isArray(statusArr) ? statusArr : statusArr ? [statusArr] : [];
    setFilter(prev => ({ ...prev, status }));
    updateUrlParams({ status, page: 1, limit: pagination?.limit });
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

  const handleViewClick = record => {
    navigate(`/grpo/${record.id}`, {
      state: {
        grpoData: record,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleDeleteClick = record => {
    deleteModal.open(record);
  };

  const deleteGRPO = async () => {
    await removeGrpo({ grpoId: deleteModal.payload?.id });
    deleteModal.close();
    fetchGRPO();
    // if (clearSelection) {
    //   clearSelection();
    // }
  };

  const handleUpdateStatus = async (grpoId, status) => {
    await updateStatus({ grpoId, status });
    fetchGRPO();
  };

  const updateGrpoStatus = async (grpo, newStatus) => {
    setOpenDropdownKey(null);
    if (newStatus === BACKEND_ENUM?.CANCELLED) {
      cancelStatusModal.open({
        grpo,
        newStatus,
        label: GRPO_STATUS?.[newStatus] || newStatus,
      });
      return;
    }
    await handleUpdateStatus(grpo?.id || grpo?._id, newStatus);
  };

  const confirmCancelStatus = async () => {
    const grpo = cancelStatusModal.payload?.grpo;
    const newStatus = cancelStatusModal.payload?.newStatus;
    await handleUpdateStatus(grpo?.id || grpo?._id, newStatus);
    cancelStatusModal.close();
  };

  const getConvertStatusValue = (status, grpo) => {
    let statusArr = [];
    const grpoId = grpo?.id || grpo?._id;

    const markAs = (backendStatus, labelStatus) => ({
      key: `markAs${labelStatus}`,
      label: `Mark As ${labelStatus}`,
      onClick: () => handleUpdateStatus(grpoId, backendStatus),
    });
    const draftItem = markAs(BACKEND_ENUM?.DRAFT, GRPO_STATUS?.DRAFT);
    const recordedItem = markAs(BACKEND_ENUM?.RECORDED, GRPO_STATUS?.RECORDED);
    const cancelItem = {
      key: `markAs${GRPO_STATUS?.CANCELLED}`,
      label: `Mark As ${GRPO_STATUS?.CANCELLED}`,
      onClick: () => updateGrpoStatus(grpo, BACKEND_ENUM?.CANCELLED),
    };

    if (status === BACKEND_ENUM?.DRAFT) {
      statusArr = [recordedItem, cancelItem];
    } else if (status === BACKEND_ENUM?.RECORDED) {
      statusArr = [draftItem, cancelItem];
    } else if (status === BACKEND_ENUM?.CANCELLED) {
      statusArr = [draftItem, recordedItem];
    } else {
      statusArr = [cancelItem];
    }

    return statusArr;
  };

  const columns = grpoColumn();

  let columnsFromLocalStorage = getFromLocalStorage(configEnum?.GRPO_CONFIG);
  let parsedColumnData = parsedTableCoulmns(columnsFromLocalStorage, columns);

  let displayColumn = parsedColumnData?.displayColumn?.filter(x => x?.visible === true);
  const [columnsList, setColumnsList] = useState(parsedColumnData?.displayColumn);
  const [customizedColumns, setCutomizedColumns] = useState([...(parsedColumnData?.customizedColumn?.length > 0 ? parsedColumnData.customizedColumn : displayColumn)]);

  const handleColumnResize = useColumnResize(setColumnsList, setCutomizedColumns, configEnum?.GRPO_CONFIG);

  const { pdfExportLoading, handlePdfExport } = useDocumentPdfExport({
    defaultFileName: 'GRPO_Export',
    entityLabel: 'GRPO orders',
    filterKeys: ['grpoDate', 'country', 'state', 'city', 'addressType'],
    moduleType: 'grpo',
  });

  const { showColumnModal, setShowColumnModal, standardDropdownItems, toolbarModalsProps } = useDocumentListToolbar({
    moduleName: MODULE_NAMES.GRPO,
    resource: RESOURCES.GRPO,
    filterKey: FILTER_KEY,
    columnConfigKey: configEnum?.GRPO_CONFIG,
    configErrorMessage: 'Failed to update GRPO configuration',
    exportConfig: {
      exportLoading: exportLoading || pdfExportLoading,
      fetchExports: getGrpoExports,
      getExportColumns: grpoExportColumn,
      defaultFileName: 'GRPO_Export',
      sheetName: 'GRPO',
      entityPlural: 'GRPO Orders',
      formName: 'export-grpo',
      exportLabel: 'Export GRPO',
      formats: ['xlsx', 'pdf'],
      onPdfExport: handlePdfExport,
    },
    columnsConfig: {
      getDefaultColumns: grpoColumn,
      setColumnsList,
      setCustomizedColumns: setCutomizedColumns,
    },
    handleResetFilters,
    onRefresh: () => fetchGRPO(),
    setIsLocked,
  });

  const dropdownItems = [
    ...(useModuleBills?.create && !isViewOnly
      ? [
          {
            type: 'group',
            label: 'CONVERT',
            children: [
              {
                key: 'convertToBill',
                label: 'Convert to Bills',
                icon: <Icons.FileTextOutlined />,
                onClick: ({ domEvent }) => {
                  domEvent.stopPropagation();
                  setConvertType('Bill');
                  setIsOpenConvertModal(true);
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
  ];
  const handleCloseConvertModal = () => {
    setIsOpenConvertModal(false);
    setConvertType('');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden -m-4">
      <div className="bg-white px-4 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        <PageHeader loading={loading} title={PAGE_HEADERS?.GRPO?.title} totalAmount={pagination?.totalAmount} totalRecord={pagination?.totalResults} />

        <div className="flex flex-wrap justify-center md:justify-end items-center gap-2 md:gap-3 w-full md:w-auto">
          <PermissionButton
            canAccess={!!useModuleGrpo?.create}
            isViewOnly={isViewOnly}
            type="primary"
            className="w-full md:w-auto py-2 md:py-4 px-4 md:px-5"
            wrapperClassName="w-full md:w-auto inline-block"
            onClick={() =>
              navigate('/grpo/new', {
                state: {
                  prevFrom: location.pathname,
                  historyStack: [...(location.state?.historyStack || []), location.pathname],
                },
              })
            }
            icon={<Icons.PlusCircleOutlined />}
            text="Add"
          />
          <Tooltip title="More Actions" placement="left">
            <Dropdown menu={{ items: dropdownItems, className: 'app-toolbar-dropdown' }} trigger={['click']}>
              <CustomButton type="default" icon={<Icons.EllipsisOutlined />} />
            </Dropdown>
          </Tooltip>
        </div>
      </div>

      <div className="bg-white border-t px-4 py-3.5 space-y-3">
        <div className="flex flex-col lg:flex-row gap-4 items-center">
          <StatusFilterTabs statuses={Object.entries(GRPO_STATUS).map(([key, label]) => ({ value: key, label }))} value={filter?.status} onChange={handleStatusTab} />
          <div className="flex-grow" />
          <div className="flex gap-2 items-center">
            <FilterInput type={filterInputEnum?.SEARCH} name={'search'} placeHolder="Search..." value={filter?.search} setFilter={setFilter} onSerch={handleSearch} onClear={handleClear} />
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

          <FilterSection title="What">
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                mode="multiple"
                name={'status'}
                label={'Status'}
                placeHolder={'Select Status'}
                selectionOptions={Object?.entries(GRPO_STATUS)?.map(([key, value]) => {
                  return { value: key, label: value };
                })}
                value={filter?.status}
                setFilter={setFilter}
                allowClear={true}
              />
            </div>
          </FilterSection>

          <FilterSection title="Who">
            <div className="space-y-2">
              <FilterInput
                type={filterInputEnum?.SELECT}
                mode="multiple"
                name={'customerId'}
                label={'Vendor'}
                placeHolder={'Select Vendor'}
                selectVariant="twoColumn"
                columnSelectHeader={vendorSelectColumnHeader}
                selectPopupClassName={customerSelectDropdownProps.selectPopupClassName}
                selectionOptions={buildCustomerSelectOptions(vendorDropDownList)}
                value={filter?.customerId}
                setFilter={setFilter}
                allowClear={true}
                loading={vendorLoading}
                onFocus={() => {
                  if (!isApicalledRefFilter.current.vendorDropdown) {
                    handleOnFocusApiCall(API_CALLED_ENUM.VENDOR_DROPDOWN);
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
            singleDateKey: 'grpoDate',
          }}
          onDateClear={() => {
            setSelectedPreset('custom');
            setDateRange(null);
            updateUrlParams({
              startDate: null,
              endDate: null,
              grpoDate: null,
              preset: null,
            });
          }}
          STATUS_ENUM={GRPO_STATUS}
          divDrop={divDrop}
          branchDrop={branchDrop}
          extraFilters={{
            ...getCustomerFilterTag('Vendor', vendorDropDownList),
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
          columns={[...customizedColumns]}
          loading={loading}
          data={grpoOrders}
          onChange={handleTableChange}
          onRowClick={handleViewClick}
          enableRowSelection
          selectionType="checkbox"
          tableId="id"
          renderSelectionLabel={(keys, rows) => {
            const record = rows?.[0];
            if (!record) return `${keys.length} selected`;
            return (
              <span className="flex items-center gap-2">
                <span>GRPO Order#</span>
                <Tag className="font-semibold">{record?.grpoOrderId}</Tag>
              </span>
            );
          }}
          columnActions={() => {
            return {
              title: 'Action',
              key: 'action',
              fixed: 'right',
              width: 180,
              visible: true,

              render: (_, record) => {
                const statusLabel = GRPO_STATUS?.[record?.status] || record?.status || '-';
                const blockedTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : PERMISSION_MESSAGES.NO_PERMISSION;

                const canView = useModuleGrpo?.view;
                const canOpenMore = useModuleGrpo?.edit && !isViewOnly;
                const canEdit = canOpenMore && !GRPO_EDIT_RESTRICTED_STATUS?.includes(record?.status);
                const canDelete = useModuleGrpo?.delete && !isViewOnly;
                const canDuplicate = useModuleGrpo?.create && !isViewOnly;
                const canConvert = useModuleBills?.create && !isViewOnly && GRPO_CONVERSION_ALLOWED_STATUSES?.includes(record?.status);
                const canSplit = signin?.company?.companyFeatures?.includes(COMPANY_FEATURE?.ENABLESPLITBYQTYORPRICE) && isSplitSessionActive && canConvert;

                const dropDownItems = [...getConvertStatusValue(record?.status, record)];
                const canMarkStatus = canOpenMore && !GRPO_STATUS_CHANGE_RESTRICTED_STATUS?.includes(record?.status) && dropDownItems.length > 0;

                const viewTooltip = canView ? 'View GRPO' : PERMISSION_MESSAGES.NO_PERMISSION;
                const editTooltip = canEdit
                  ? 'Edit GRPO'
                  : isViewOnly
                    ? PERMISSION_MESSAGES.VIEW_ONLY
                    : !useModuleGrpo?.edit
                      ? PERMISSION_MESSAGES.NO_PERMISSION
                      : `This document cannot be edited in its current status - ${statusLabel}.`;
                const deleteTooltip = canDelete ? 'Delete GRPO' : blockedTooltip;
                const duplicateTooltip = canDuplicate ? 'Duplicate Document' : blockedTooltip;
                const convertTooltip = canConvert
                  ? 'Convert to Bills'
                  : isViewOnly
                    ? PERMISSION_MESSAGES.VIEW_ONLY
                    : !useModuleBills?.create
                      ? PERMISSION_MESSAGES.NO_PERMISSION
                      : `Cannot convert to Bills in its current status - ${statusLabel}.`;
                const markAsTooltip = canMarkStatus
                  ? 'Mark GRPO As'
                  : isViewOnly
                    ? PERMISSION_MESSAGES.VIEW_ONLY
                    : !useModuleGrpo?.edit
                      ? PERMISSION_MESSAGES.NO_PERMISSION
                      : `This document status cannot be changed in its current status - ${statusLabel}.`;
                const moreTooltip = canOpenMore ? 'More Actions' : blockedTooltip;

                return (
                  <div className="flex items-center gap-3">
                    {/* VIEW */}
                    <Tooltip title={viewTooltip}>
                      <Icons.EyeOutlined
                        className={canView ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                        style={{ fontSize: 17, color: '#1E3A56' }}
                        onClick={
                          canView
                            ? () => {
                                handleViewClick(record);
                                setOpenDropdownKey(null);
                              }
                            : undefined
                        }
                      />
                    </Tooltip>

                    <Tooltip title={duplicateTooltip}>
                      <Icons.CopyOutlined
                        className={canDuplicate ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                        style={{ fontSize: 17, color: colorPalette.primary[500] }}
                        onClick={
                          canDuplicate
                            ? () => {
                                handleDuplicateClick(record);
                                setOpenDropdownKey(null);
                              }
                            : undefined
                        }
                      />
                    </Tooltip>

                    {/* EDIT */}
                    <Tooltip title={editTooltip}>
                      <Icons.EditOutlined
                        className={canEdit ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                        style={{ fontSize: 17, color: colorPalette.primary[500] }}
                        onClick={
                          canEdit
                            ? () => {
                                handleEditClick(record);
                                setOpenDropdownKey(null);
                              }
                            : undefined
                        }
                      />
                    </Tooltip>

                    {/* DELETE */}
                    <Tooltip title={deleteTooltip}>
                      <Icons.DeleteOutlined
                        className={canDelete ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                        style={{ fontSize: 17, color: colorPalette.error[500] }}
                        onClick={
                          canDelete
                            ? () => {
                                handleDeleteClick(record);
                                setOpenDropdownKey(null);
                              }
                            : undefined
                        }
                      />
                    </Tooltip>

                    {/* DROPDOWN */}
                    <Dropdown
                      placement="bottomRight"
                      trigger={['click']}
                      disabled={!canOpenMore}
                      open={canOpenMore && openDropdownKey === record.id}
                      onOpenChange={flag => {
                        if (!canOpenMore) return;
                        setOpenDropdownKey(flag ? record.id : null);
                      }}
                      dropdownRender={() => {
                        const markAsDisabled = !canMarkStatus || submitLoading;

                        return (
                          <div className="bg-white shadow-lg rounded-lg border border-gray-200 flex flex-col w-56 py-1">
                            {dropDownItems.length > 0 && (
                              <>
                                <div className="px-2 py-1">
                                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">Status Actions :</div>
                                </div>
                                {dropDownItems.map((item, index) => {
                                  const getStatusIcon = () => {
                                    const key = item.key || '';
                                    const label = item.label || '';

                                    if (key.includes('RECORDED') || label.includes(GRPO_STATUS?.RECORDED)) {
                                      return {
                                        icon: <Icons.CheckCircleOutlined className={markAsDisabled ? 'text-gray-400' : 'text-green-800'} style={{ fontSize: 14 }} />,
                                        hoverClass: 'hover:bg-green-50 hover:text-green-800',
                                      };
                                    } else if (key.includes('CANCELLED') || label.includes(GRPO_STATUS?.CANCELLED)) {
                                      return {
                                        icon: <Icons.StopOutlined className={markAsDisabled ? 'text-gray-400' : 'text-rose-800'} style={{ fontSize: 14 }} />,
                                        hoverClass: 'hover:bg-rose-50 hover:text-rose-800',
                                      };
                                    }
                                    return {
                                      icon: <Icons.CheckCircleOutlined className={markAsDisabled ? 'text-gray-400' : 'text-blue-800'} style={{ fontSize: 14 }} />,
                                      hoverClass: 'hover:bg-blue-50 hover:text-blue-800',
                                    };
                                  };

                                  const statusIcon = getStatusIcon();

                                  return (
                                    <Tooltip key={item.key} title={markAsDisabled ? markAsTooltip : item.label} placement="left">
                                      <button
                                        type="button"
                                        onClick={
                                          markAsDisabled
                                            ? undefined
                                            : () => {
                                                setOpenDropdownKey(null);
                                                item.onClick?.();
                                              }
                                        }
                                        disabled={markAsDisabled}
                                        className={`
                                          w-full px-3 py-2 text-left text-sm
                                          flex items-center
                                          transition-colors duration-150
                                          ${markAsDisabled ? 'opacity-50 cursor-not-allowed text-gray-400' : `text-gray-700 ${statusIcon.hoverClass} cursor-pointer`}
                                          ${index === 0 ? 'rounded-t' : ''}
                                          ${index === dropDownItems.length - 1 && !canConvert && !canSplit ? 'rounded-b' : ''}
                                        `}
                                      >
                                        {submitLoading ? (
                                          <span className="flex items-center gap-2">
                                            <CustomLoader variant="button" text="Updating..." />
                                          </span>
                                        ) : (
                                          <span className="flex items-center gap-2">
                                            {statusIcon.icon}
                                            {item.label}
                                          </span>
                                        )}
                                      </button>
                                    </Tooltip>
                                  );
                                })}
                                <div className="border-t border-gray-200 my-1"></div>
                              </>
                            )}
                            <div className="px-2 py-1">
                              <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">Convert :</div>
                            </div>
                            <Tooltip title={convertTooltip} placement="left">
                              <button
                                type="button"
                                onClick={
                                  canConvert && !submitLoading
                                    ? () => {
                                        handleConvertGRPO(record);
                                        setOpenDropdownKey(null);
                                      }
                                    : undefined
                                }
                                disabled={!canConvert || submitLoading}
                                className={`
                                  w-full px-3 py-2 text-left text-sm
                                  flex items-center gap-2
                                  transition-colors duration-150
                                  ${!canSplit ? 'rounded-b' : ''}
                                  ${!canConvert || submitLoading ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-gray-700 hover:bg-purple-50 hover:text-purple-600 cursor-pointer'}
                                `}
                              >
                                {submitLoading ? (
                                  <span className="flex items-center gap-2">
                                    <CustomLoader variant="button" text="Converting..." />
                                  </span>
                                ) : (
                                  <>
                                    <Icons.SwapOutlined className={!canConvert || submitLoading ? 'text-gray-400' : 'text-purple-500'} style={{ fontSize: 16 }} />
                                    <span>To Bills</span>
                                  </>
                                )}
                              </button>
                            </Tooltip>
                            {canSplit && (
                              <>
                                <div className="border-t border-gray-200 my-1"></div>
                                <Tooltip title="Convert to Bills (Split)" placement="left">
                                  <button
                                    type="button"
                                    onClick={
                                      !submitLoading
                                        ? () => {
                                            handleConvertGRPO(record, true);
                                            setOpenDropdownKey(null);
                                          }
                                        : undefined
                                    }
                                    disabled={submitLoading}
                                    className={`
                                      w-full px-3 py-2 text-left text-sm
                                      flex items-center gap-2
                                      transition-colors duration-150 rounded-b
                                      ${submitLoading ? 'opacity-50 cursor-not-allowed text-gray-400' : 'text-gray-700 hover:bg-green-50 hover:text-green-600 cursor-pointer'}
                                    `}
                                  >
                                    {submitLoading ? (
                                      <span className="flex items-center gap-2">
                                        <CustomLoader variant="button" text="Converting..." />
                                      </span>
                                    ) : (
                                      <>
                                        <Icons.SplitCellsOutlined className={submitLoading ? 'text-gray-400' : 'text-green-500'} style={{ fontSize: 16 }} />
                                        <span>To Bills (Split)</span>
                                      </>
                                    )}
                                  </button>
                                </Tooltip>
                              </>
                            )}
                          </div>
                        );
                      }}
                    >
                      <Tooltip title={moreTooltip} placement="left">
                        <span>
                          <Icons.MoreOutlined
                            className={canOpenMore ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}
                            style={{ fontSize: 17, color: canOpenMore ? '#1E3A56' : colorPalette.neutral[400] }}
                          />
                        </span>
                      </Tooltip>
                    </Dropdown>
                  </div>
                );
              },
            };
          }}
          pagination={{
            current: searchParams?.get('page') || 1,
            pageSize: searchParams?.get('limit') || pagination?.limit,
            total: pagination.totalResults,
            onChange: handlePaginationChange,
          }}
        />
      </div>
      {isOpenConvertModal && <ConvertToSelectionModal open={isOpenConvertModal} onClose={handleCloseConvertModal} convertType={convertType} convertFrom="GRPO" />}
      <DocumentConfirmModal modal={deleteModal} docType={MODULE_NAMES?.GRPO} onConfirm={deleteGRPO} loading={deleteLoading} getDocumentDetails={getGrpoDocumentDetails} />
      <DocumentConfirmModal
        modal={cancelStatusModal}
        docType={MODULE_NAMES?.GRPO}
        loading={submitLoading}
        mode="status"
        onConfirm={confirmCancelStatus}
        getDocumentDetails={payload => getGrpoDocumentDetails(payload?.grpo)}
      />
      <ColumnSelection
        hideTrigger
        columns={columnsList}
        setColumnsList={setColumnsList}
        setCutomizedColumns={setCutomizedColumns}
        configPage={configEnum?.GRPO_CONFIG}
        modalOpen={showColumnModal}
        setModalOpen={setShowColumnModal}
      />
      <ViewDocumentListToolbarModals {...toolbarModalsProps} />
    </div>
  );
};

export default ViewGrpo;
