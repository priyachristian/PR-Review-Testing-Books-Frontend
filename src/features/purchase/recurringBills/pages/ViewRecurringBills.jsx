import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

// Components
import { Dropdown, Tooltip } from '@/components/AntDComponent';
import FilterInput from '@/components/forms/formInput/FilterInput';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomDatePicker from '@/components/forms/formDatePicker/CustomDatePicker';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import ColumnSelection from '@/components/ui/common/ColumnSelection';
import StatusFilterTabs from '@/components/ui/common/StatusFilterTabs';
import FilterLockButton from '@/components/ui/common/FilterLockButton';
import FilterDrawer, { FilterSection, FilterButton } from '@/components/ui/common/FilterDrawer';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import { DocumentConfirmModal } from '@/components/feedback/confirmModal/CancelOrDeleteDocumentModal';
import ViewDocumentListToolbarModals from '@/components/ui/common/ViewDocumentListToolbarModals';
import { FILTERS_KEYS, RESOURCES } from '@/utils/jsonFile';

// Hooks
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import useModulePermissions from 'hooks/useModulePermissions';
import useDocumentListToolbar from '@/hooks/useDocumentListToolbar';
import useColumnResize from '@/hooks/useColumnResize';
import { useConfirmModal } from '@/hooks/useConfirmModal';

// Extras
import { useRecurringBills, recurringBillColumn, getRecurringBillDocumentDetails } from '@/features/purchase/recurringBills';
import Icons from 'assets/icons/icon';
import { colorPalette } from '@/utils/theme';
import { BACKEND_ENUM, configEnum, filterInputEnum, MODULE_NAMES, PERMISSION_MESSAGES, RECURRING_BILL_STATUS, RECURRING_BILL_STATUS_CHANGE_RESTRICTED_STATUS } from 'utils/constants';
import { getFromLocalStorage, getQueryParams, parsedTableCoulmns } from 'utils/services';
import { PAGE_HEADERS } from '@/utils/label';
import { getAllFiltersFromLocalStorage } from '@/utils/filters';
import { CommonFilterTags, useFilters } from '@/utils/filtersUtils';

const ViewRecurringBills = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { recurringBills, pagination, loading, submitLoading, deleteLoading, getRecurringBills, resetRecurringBills, updateStatus, removeRecurringBill } = useRecurringBills();
  const { isViewOnly, useModuleRecurringBills } = useModulePermissions(RESOURCES.RECURRING_BILLS);
  const FILTER_KEY = FILTERS_KEYS.RECURRING_BILLS_ALL_FILTER;
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilter, setShowFilter] = useState(false);
  const [openDropdownKey, setOpenDropdownKey] = useState(null);
  const deleteModal = useConfirmModal();
  const cancelStatusModal = useConfirmModal();
  const isApiCalledRef = useRef(false);

  const {
    filter,
    setFilter,
    handleSearch,
    handleResetFilters,
    handleClear,
    handleFilter,
    getActiveFiltersCount,
    isLocked,
    handleLockToggle,
    updateUrlParams,
    selectedPreset,
    setSelectedPreset,
    areSavedFiltersApplied,
    dateRange,
    setDateRange,
    setIsLocked,
  } = useFilters({
    FILTER_KEY,
    searchParams,
    setSearchParams,
    pagination,
    setShowFilter,
    defaultFilter: {
      search: searchParams.get('search') || '',
      status: searchParams.get('status') ? searchParams.get('status').split(',') : '',
    },
    dateKeys: { startDate: 'startDate', endDate: 'endDate', singleDate: 'recurringBillDate' },
  });

  const handleEditClick = record => {
    const recordKey = record?.id ?? record?._id;
    navigate(`/recurring-bills/${recordKey}/edit`, {
      state: {
        recurringBillData: record,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const fetchRecurringBills = signal => {
    const page = parseInt(searchParams?.get('page')) || 1;
    const pageSize = parseInt(searchParams?.get('limit')) || pagination.limit;

    let payload = getQueryParams(window.location.href) || {};

    if (Object.keys(payload)?.length <= 0) {
      payload = { page, limit: pageSize };
    }

    getRecurringBills({ ...payload, page, limit: pageSize, signal });
  };

  const handlePaginationChange = (page, pageSize) => {
    updateUrlParams({ page, limit: pageSize });
  };

  const handleRowClick = record => {
    navigate(`/recurring-bills/${record?.id ?? record?._id}`, {
      state: {
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleUpdateStatus = async (billsId, status) => {
    await updateStatus({ billsId, status });
    fetchRecurringBills();
  };

  const updateRecurringBillStatus = async (record, newStatus) => {
    setOpenDropdownKey(null);
    if (newStatus === BACKEND_ENUM.CANCELLED) {
      cancelStatusModal.open({ record, newStatus });
      return;
    }
    await handleUpdateStatus(record?.id ?? record?._id, newStatus);
  };

  const confirmCancelStatus = async () => {
    const record = cancelStatusModal.payload?.record;
    await handleUpdateStatus(record?.id ?? record?._id, cancelStatusModal.payload?.newStatus);
    cancelStatusModal.close();
  };

  const handleDeleteClick = record => {
    deleteModal.open(record);
  };

  const deleteRecurringBill = async () => {
    await removeRecurringBill({ billsId: deleteModal.payload?.id ?? deleteModal.payload?._id });
    fetchRecurringBills();
    deleteModal.close();
  };

  const getStatusActionItems = (status, record) => {
    let statusArr = [];

    if (status === BACKEND_ENUM?.DRAFT) {
      statusArr = [
        {
          key: `markAs${RECURRING_BILL_STATUS.ACTIVE}`,
          label: `Mark As ${RECURRING_BILL_STATUS.ACTIVE}`,
          onClick: () => updateRecurringBillStatus(record, BACKEND_ENUM.ACTIVE),
        },
        {
          key: `markAs${RECURRING_BILL_STATUS.CANCELLED}`,
          label: `Mark As ${RECURRING_BILL_STATUS.CANCELLED}`,
          onClick: () => updateRecurringBillStatus(record, BACKEND_ENUM.CANCELLED),
        },
      ];
    } else if (status === BACKEND_ENUM?.ACTIVE) {
      statusArr = [
        {
          key: `markAs${RECURRING_BILL_STATUS.PAUSED}`,
          label: `Mark As ${RECURRING_BILL_STATUS.PAUSED}`,
          onClick: () => updateRecurringBillStatus(record, BACKEND_ENUM.PAUSED),
        },
        {
          key: `markAs${RECURRING_BILL_STATUS.CANCELLED}`,
          label: `Mark As ${RECURRING_BILL_STATUS.CANCELLED}`,
          onClick: () => updateRecurringBillStatus(record, BACKEND_ENUM.CANCELLED),
        },
      ];
    } else if (status === BACKEND_ENUM?.PAUSED) {
      statusArr = [
        {
          key: `markAs${RECURRING_BILL_STATUS.ACTIVE}`,
          label: `Mark As ${RECURRING_BILL_STATUS.ACTIVE}`,
          onClick: () => updateRecurringBillStatus(record, BACKEND_ENUM.ACTIVE),
        },
        {
          key: `markAs${RECURRING_BILL_STATUS.CANCELLED}`,
          label: `Mark As ${RECURRING_BILL_STATUS.CANCELLED}`,
          onClick: () => updateRecurringBillStatus(record, BACKEND_ENUM.CANCELLED),
        },
      ];
    } else if (RECURRING_BILL_STATUS_CHANGE_RESTRICTED_STATUS?.includes(status)) {
      statusArr = [
        {
          key: `markAs${RECURRING_BILL_STATUS.CANCELLED}`,
          label: `Mark As ${RECURRING_BILL_STATUS.CANCELLED}`,
          onClick: () => updateRecurringBillStatus(record, BACKEND_ENUM.CANCELLED),
        },
      ];
    }

    return statusArr;
  };

  const handleStatusTab = statusArr => {
    const status = Array.isArray(statusArr) ? statusArr : statusArr ? [statusArr] : [];
    setFilter(prev => ({ ...prev, status }));
    updateUrlParams({ status, page: 1, limit: pagination?.limit });
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
        } else if (savedFilters.recurringBillDate) {
          setDateRange([savedFilters.recurringBillDate, savedFilters.recurringBillDate]);
        }

        setFilter(prev => ({
          ...prev,
          search: savedFilters.search ?? prev.search,
          status: savedFilters.status ? savedFilters.status.split(',') : prev.status,
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
    fetchRecurringBills(controller.signal);
    return () => controller.abort();
  }, [searchParams]);

  useResetOnUnmount(resetRecurringBills);

  const defaultColumns = recurringBillColumn();
  const columnsFromLocalStorage = getFromLocalStorage(configEnum?.RECURRING_BILL_CONFIG);
  const parsedColumnData = parsedTableCoulmns(columnsFromLocalStorage, defaultColumns);
  const displayColumn = parsedColumnData?.displayColumn?.filter(x => x?.visible === true);
  const [columnsList, setColumnsList] = useState(parsedColumnData?.displayColumn);
  const [customizedColumns, setCutomizedColumns] = useState([...(parsedColumnData?.customizedColumn?.length > 0 ? parsedColumnData.customizedColumn : displayColumn)]);

  const handleColumnResize = useColumnResize(setColumnsList, setCutomizedColumns, configEnum?.RECURRING_BILL_CONFIG);

  const { showColumnModal, setShowColumnModal, standardDropdownItems, toolbarModalsProps } = useDocumentListToolbar({
    moduleName: MODULE_NAMES.RECURRING_BILL,
    resource: RESOURCES.RECURRING_BILLS,
    filterKey: FILTER_KEY,
    columnConfigKey: configEnum?.RECURRING_BILL_CONFIG,
    configErrorMessage: 'Failed to update recurring bill configuration',
    columnsConfig: {
      getDefaultColumns: recurringBillColumn,
      setColumnsList,
      setCustomizedColumns: setCutomizedColumns,
    },
    handleResetFilters,
    onRefresh: () => fetchRecurringBills(),
    setIsLocked,
  });

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden -m-4">
      <div className="bg-white px-4 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        <div className="w-full md:w-auto text-[1.125rem] font-bold  text-heading">{PAGE_HEADERS?.RECURRING_BILLS?.title}</div>
        <div className="flex flex-wrap justify-center md:justify-end items-center gap-2 md:gap-3 w-full md:w-auto">
          <PermissionButton
            canAccess={useModuleRecurringBills?.create}
            isViewOnly={isViewOnly}
            type="primary"
            className="py-4 px-5 w-full md:w-auto"
            wrapperClassName="w-full md:w-auto inline-block"
            onClick={() => navigate('/recurring-bills/new')}
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
          <StatusFilterTabs statuses={Object.entries(RECURRING_BILL_STATUS).map(([key, label]) => ({ value: key, label }))} value={filter?.status} onChange={handleStatusTab} />
          <div className="flex-grow" />
          <div className="flex gap-2 items-center">
            <FilterInput type={filterInputEnum?.SEARCH} name="search" placeHolder="Search..." value={filter?.search} setFilter={setFilter} onSerch={handleSearch} onClear={handleClear} />
            <ColumnSelection
              columns={columnsList}
              setColumnsList={setColumnsList}
              setCutomizedColumns={setCutomizedColumns}
              configPage={configEnum?.RECURRING_BILL_CONFIG}
              modalOpen={showColumnModal}
              setModalOpen={setShowColumnModal}
            />
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
                selectionOptions={Object?.entries(RECURRING_BILL_STATUS)?.map(([key, value]) => {
                  return { value: key, label: value };
                })}
                value={filter?.status}
                setFilter={setFilter}
                allowClear={true}
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
            singleDateKey: 'recurringBillDate',
          }}
          onDateClear={() => {
            setSelectedPreset('custom');
            setDateRange(null);
            updateUrlParams({
              startDate: null,
              endDate: null,
              recurringBillDate: null,
              preset: null,
            });
          }}
          STATUS_ENUM={RECURRING_BILL_STATUS}
        />
      </div>

      <div>
        <CustomTable
          onColumnResize={handleColumnResize}
          columns={customizedColumns}
          loading={loading}
          data={recurringBills}
          tableId="id"
          onRowClick={handleRowClick}
          pagination={{
            current: searchParams?.get('page') || 1,
            pageSize: searchParams?.get('limit') || pagination?.limit,
            total: pagination.totalResults,
            onChange: handlePaginationChange,
          }}
          columnActions={() => {
            return {
              title: 'Action',
              key: 'action',
              fixed: 'right',
              width: 180,
              visible: true,
              render: (_, record) => {
                const recordKey = record?.id ?? record?._id;
                const statusLabel = RECURRING_BILL_STATUS?.[record?.status] || record?.status || '-';
                const blockedTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : PERMISSION_MESSAGES.NO_PERMISSION;

                const canView = useModuleRecurringBills?.view;
                const canOpenMore = useModuleRecurringBills?.edit && !isViewOnly;
                const canEdit = canOpenMore && record?.status === BACKEND_ENUM.DRAFT;
                const canDelete = useModuleRecurringBills?.delete && !isViewOnly && record?.status === BACKEND_ENUM.DRAFT;

                const dropDownItems = [...getStatusActionItems(record?.status, record)];
                const canMarkStatus = canOpenMore && !RECURRING_BILL_STATUS_CHANGE_RESTRICTED_STATUS?.includes(record?.status) && dropDownItems.length > 0;

                const viewTooltip = canView ? 'View Recurring Bill' : PERMISSION_MESSAGES.NO_PERMISSION;
                const editTooltip = canEdit
                  ? 'Edit Recurring Bill'
                  : isViewOnly
                    ? PERMISSION_MESSAGES.VIEW_ONLY
                    : !useModuleRecurringBills?.edit
                      ? PERMISSION_MESSAGES.NO_PERMISSION
                      : `This document cannot be edited in its current status - ${statusLabel}.`;
                const deleteTooltip = canDelete
                  ? 'Delete Recurring Bill'
                  : isViewOnly
                    ? PERMISSION_MESSAGES.VIEW_ONLY
                    : !useModuleRecurringBills?.delete
                      ? PERMISSION_MESSAGES.NO_PERMISSION
                      : `This document cannot be deleted in its current status - ${statusLabel}.`;
                const markAsTooltip = canMarkStatus
                  ? 'Mark Recurring Bill As'
                  : isViewOnly
                    ? PERMISSION_MESSAGES.VIEW_ONLY
                    : !useModuleRecurringBills?.edit
                      ? PERMISSION_MESSAGES.NO_PERMISSION
                      : `This document status cannot be changed in its current status - ${statusLabel}.`;
                const moreTooltip = canOpenMore ? 'More Actions' : blockedTooltip;

                return (
                  <div className="flex items-center gap-3">
                    <Tooltip title={viewTooltip}>
                      <Icons.EyeOutlined
                        className={canView ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                        style={{ fontSize: 17, color: '#1E3A56' }}
                        onClick={canView ? () => handleRowClick(record) : undefined}
                      />
                    </Tooltip>

                    <Tooltip title={editTooltip}>
                      <Icons.EditOutlined
                        style={{ fontSize: 17, color: colorPalette.primary[500] }}
                        className={canEdit ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                        onClick={canEdit ? () => handleEditClick(record) : undefined}
                      />
                    </Tooltip>

                    <Tooltip title={deleteTooltip}>
                      <Icons.DeleteOutlined
                        className={canDelete ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                        style={{ fontSize: 17, color: colorPalette.error[500] }}
                        onClick={canDelete ? () => handleDeleteClick(record) : undefined}
                      />
                    </Tooltip>

                    <Dropdown
                      placement="bottomRight"
                      trigger={['click']}
                      disabled={!canOpenMore}
                      open={canOpenMore && openDropdownKey === recordKey}
                      onOpenChange={flag => {
                        if (!canOpenMore) return;
                        setOpenDropdownKey(flag ? recordKey : null);
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

                                    if (key.includes(RECURRING_BILL_STATUS?.ACTIVE) || label.includes(RECURRING_BILL_STATUS?.ACTIVE)) {
                                      return {
                                        icon: <Icons.CheckCircleOutlined className={markAsDisabled ? 'text-gray-400' : 'text-green-800'} style={{ fontSize: 14 }} />,
                                        hoverClass: 'hover:bg-green-50 hover:text-green-800',
                                      };
                                    } else if (key.includes(RECURRING_BILL_STATUS?.PAUSED) || label.includes(RECURRING_BILL_STATUS?.PAUSED)) {
                                      return {
                                        icon: <Icons.PauseOutlined className={markAsDisabled ? 'text-gray-400' : 'text-amber-700'} style={{ fontSize: 14 }} />,
                                        hoverClass: 'hover:bg-amber-50 hover:text-amber-800',
                                      };
                                    } else if (key.includes(RECURRING_BILL_STATUS?.COMPLETED) || label.includes(RECURRING_BILL_STATUS?.COMPLETED)) {
                                      return {
                                        icon: <Icons.CheckCircleOutlined className={markAsDisabled ? 'text-gray-400' : 'text-emerald-800'} style={{ fontSize: 14 }} />,
                                        hoverClass: 'hover:bg-emerald-50 hover:text-emerald-800',
                                      };
                                    } else if (key.includes(RECURRING_BILL_STATUS?.CANCELLED) || label.includes(RECURRING_BILL_STATUS?.CANCELLED)) {
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
                                          ${index === dropDownItems.length - 1 ? 'rounded-b' : ''}
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
        />
      </div>
      <DocumentConfirmModal modal={deleteModal} docType={MODULE_NAMES?.RECURRING_BILL} onConfirm={deleteRecurringBill} loading={deleteLoading} getDocumentDetails={getRecurringBillDocumentDetails} />
      <DocumentConfirmModal
        modal={cancelStatusModal}
        docType={MODULE_NAMES?.RECURRING_BILL}
        loading={submitLoading}
        mode="status"
        onConfirm={confirmCancelStatus}
        getDocumentDetails={payload => getRecurringBillDocumentDetails(payload?.record)}
      />
      <ViewDocumentListToolbarModals {...toolbarModalsProps} />
    </div>
  );
};

export default ViewRecurringBills;
