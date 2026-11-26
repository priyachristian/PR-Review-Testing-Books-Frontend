import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

// Components
import ColumnSelection from '@/components/ui/common/ColumnSelection';
import CustomButton from '@/components/ui/button/CustomButton';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import ViewDocumentListToolbarModals from '@/components/ui/common/ViewDocumentListToolbarModals';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import { DocumentConfirmModal } from '@/components/feedback/confirmModal/CancelOrDeleteDocumentModal';
import { Dropdown, Tooltip } from '@/components/AntDComponent';

// Hooks
import useModulePermissions from 'hooks/useModulePermissions';
import useDocumentListToolbar from '@/hooks/useDocumentListToolbar';
import useColumnResize from '@/hooks/useColumnResize';
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import { useConfirmModal } from '@/hooks/useConfirmModal';

// Extras
import { useRecurringExpenses, recurringExpensesColumn, getRecurringExpenseDocumentDetails } from '@/features/purchase/recurringExpenses';
import Icons from 'assets/icons/icon';
import { FILTERS_KEYS, RESOURCES } from '@/utils/jsonFile';
import { BACKEND_ENUM, configEnum, MODULE_NAMES, PERMISSION_MESSAGES, RECURRING_EXPENSE_STATUS, RECURRING_EXPENSE_STATUS_CHANGE_RESTRICTED_STATUS } from 'utils/constants';
import { colorPalette } from '@/utils/theme';
import { getFromLocalStorage, getQueryParams, parsedTableCoulmns } from 'utils/services';
import { PAGE_HEADERS } from '@/utils/label';

const ViewRecurringExpenses = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { recurringExpenses, pagination, loading, submitLoading, deleteLoading, getRecurringExpenses, resetRecurringExpenses, updateStatus, removeRecurringExpense } = useRecurringExpenses();
  const { isViewOnly, useModuleRecurringExpenses } = useModulePermissions(RESOURCES.RECURRING_EXPENSES);
  const FILTER_KEY = FILTERS_KEYS.RECURRING_EXPENSES_ALL_FILTER;
  const [searchParams, setSearchParams] = useSearchParams();
  const [openDropdownKey, setOpenDropdownKey] = useState(null);
  const deleteModal = useConfirmModal();
  const cancelStatusModal = useConfirmModal();

  const handleEditClick = record => {
    navigate(`/recurring-expenses/${record.id}/edit`, {
      state: {
        recurringExpenseData: record,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleViewClick = record => {
    navigate(`/recurring-expenses/${record.id}`, {
      state: {
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const fetchRecurringExpenses = signal => {
    const page = parseInt(searchParams?.get('page')) || 1;
    const pageSize = parseInt(searchParams?.get('limit')) || pagination.limit;

    const payload = getQueryParams(window.location.href) || {};

    getRecurringExpenses({ ...payload, page, limit: pageSize, signal });
  };

  const updateUrlParams = newParams => {
    const params = new URLSearchParams(searchParams);
    Object.entries(newParams).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length > 0) {
          params.set(key, value.join(','));
        } else {
          params.delete(key);
        }
      } else if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });
    setSearchParams(params);
  };

  const handlePaginationChange = (page, pageSize) => {
    updateUrlParams({ page, limit: pageSize });
  };

  const handleResetFilters = () => {
    updateUrlParams({ page: 1, limit: pagination?.limit });
  };

  const handleUpdateStatus = async (expenseId, status) => {
    await updateStatus({ expenseId, status });
    fetchRecurringExpenses();
  };

  const updateRecurringExpenseStatus = async (record, newStatus) => {
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

  const deleteRecurringExpense = async () => {
    await removeRecurringExpense({ expenseId: deleteModal.payload?.id ?? deleteModal.payload?._id });
    fetchRecurringExpenses();
    deleteModal.close();
  };

  const getStatusActionItems = (status, record) => {
    let statusArr = [];

    if (status === BACKEND_ENUM?.DRAFT) {
      statusArr = [
        {
          key: `markAs${RECURRING_EXPENSE_STATUS.ACTIVE}`,
          label: `Mark As ${RECURRING_EXPENSE_STATUS.ACTIVE}`,
          onClick: () => updateRecurringExpenseStatus(record, BACKEND_ENUM.ACTIVE),
        },
        {
          key: `markAs${RECURRING_EXPENSE_STATUS.CANCELLED}`,
          label: `Mark As ${RECURRING_EXPENSE_STATUS.CANCELLED}`,
          onClick: () => updateRecurringExpenseStatus(record, BACKEND_ENUM.CANCELLED),
        },
      ];
    } else if (status === BACKEND_ENUM?.ACTIVE) {
      statusArr = [
        {
          key: `markAs${RECURRING_EXPENSE_STATUS.PAUSED}`,
          label: `Mark As ${RECURRING_EXPENSE_STATUS.PAUSED}`,
          onClick: () => updateRecurringExpenseStatus(record, BACKEND_ENUM.PAUSED),
        },
        {
          key: `markAs${RECURRING_EXPENSE_STATUS.CANCELLED}`,
          label: `Mark As ${RECURRING_EXPENSE_STATUS.CANCELLED}`,
          onClick: () => updateRecurringExpenseStatus(record, BACKEND_ENUM.CANCELLED),
        },
      ];
    } else if (status === BACKEND_ENUM?.PAUSED) {
      statusArr = [
        {
          key: `markAs${RECURRING_EXPENSE_STATUS.ACTIVE}`,
          label: `Mark As ${RECURRING_EXPENSE_STATUS.ACTIVE}`,
          onClick: () => updateRecurringExpenseStatus(record, BACKEND_ENUM.ACTIVE),
        },
        {
          key: `markAs${RECURRING_EXPENSE_STATUS.CANCELLED}`,
          label: `Mark As ${RECURRING_EXPENSE_STATUS.CANCELLED}`,
          onClick: () => updateRecurringExpenseStatus(record, BACKEND_ENUM.CANCELLED),
        },
      ];
    } else if (RECURRING_EXPENSE_STATUS_CHANGE_RESTRICTED_STATUS?.includes(status)) {
      statusArr = [
        {
          key: `markAs${RECURRING_EXPENSE_STATUS.CANCELLED}`,
          label: `Mark As ${RECURRING_EXPENSE_STATUS.CANCELLED}`,
          onClick: () => updateRecurringExpenseStatus(record, BACKEND_ENUM.CANCELLED),
        },
      ];
    }

    return statusArr;
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchRecurringExpenses(controller.signal);

    return () => controller.abort();
  }, [searchParams]);

  useResetOnUnmount(resetRecurringExpenses);

  const defaultColumns = recurringExpensesColumn();
  const columnsFromLocalStorage = getFromLocalStorage(configEnum?.RECURRING_EXPENSE_CONFIG);
  const parsedColumnData = parsedTableCoulmns(columnsFromLocalStorage, defaultColumns);
  const displayColumn = parsedColumnData?.displayColumn?.filter(x => x?.visible === true);
  const [columnsList, setColumnsList] = useState(parsedColumnData?.displayColumn);
  const [customizedColumns, setCutomizedColumns] = useState([...(parsedColumnData?.customizedColumn?.length > 0 ? parsedColumnData.customizedColumn : displayColumn)]);

  const handleColumnResize = useColumnResize(setColumnsList, setCutomizedColumns, configEnum?.RECURRING_EXPENSE_CONFIG);

  const { showColumnModal, setShowColumnModal, standardDropdownItems, toolbarModalsProps } = useDocumentListToolbar({
    moduleName: MODULE_NAMES.RECURRING_EXPENSE,
    resource: RESOURCES.RECURRING_EXPENSES,
    filterKey: FILTER_KEY,
    columnConfigKey: configEnum?.RECURRING_EXPENSE_CONFIG,
    configErrorMessage: 'Failed to update recurring expense configuration',
    columnsConfig: {
      getDefaultColumns: recurringExpensesColumn,
      setColumnsList,
      setCustomizedColumns: setCutomizedColumns,
    },
    handleResetFilters,
    onRefresh: () => fetchRecurringExpenses(),
  });

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden -m-4">
      <div className="bg-white px-4 py-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-0">
        <div className="w-full md:w-auto text-[1.125rem] font-bold  text-heading">{PAGE_HEADERS?.RECURRING_EXPENSES?.title}</div>
        <div className="flex flex-wrap justify-center md:justify-end items-center gap-2 md:gap-3 w-full md:w-auto">
          <PermissionButton
            canAccess={!!useModuleRecurringExpenses?.create}
            isViewOnly={isViewOnly}
            type="primary"
            className="py-4 px-5 w-full md:w-auto"
            wrapperClassName="w-full md:w-auto inline-block"
            onClick={() => navigate('/recurring-expenses/new')}
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

      <div className="bg-white border-t px-4 py-3.5">
        <ColumnSelection
          columns={columnsList}
          setColumnsList={setColumnsList}
          setCutomizedColumns={setCutomizedColumns}
          configPage={configEnum?.RECURRING_EXPENSE_CONFIG}
          modalOpen={showColumnModal}
          setModalOpen={setShowColumnModal}
        />
      </div>

      <div>
        <CustomTable
          onColumnResize={handleColumnResize}
          columns={customizedColumns}
          loading={loading}
          data={recurringExpenses}
          tableId="id"
          onRowClick={handleViewClick}
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
                const statusLabel = RECURRING_EXPENSE_STATUS?.[record?.status] || record?.status || '-';
                const blockedTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : PERMISSION_MESSAGES.NO_PERMISSION;

                const canView = useModuleRecurringExpenses?.view;
                const canOpenMore = useModuleRecurringExpenses?.edit && !isViewOnly;
                const canEdit = canOpenMore && record?.status === BACKEND_ENUM.DRAFT;
                const canDelete = useModuleRecurringExpenses?.delete && !isViewOnly && record?.status === BACKEND_ENUM.DRAFT;

                const dropDownItems = [...getStatusActionItems(record?.status, record)];
                const canMarkStatus = canOpenMore && !RECURRING_EXPENSE_STATUS_CHANGE_RESTRICTED_STATUS?.includes(record?.status) && dropDownItems.length > 0;

                const viewTooltip = canView ? 'View Recurring Expense' : PERMISSION_MESSAGES.NO_PERMISSION;
                const editTooltip = canEdit
                  ? 'Edit Recurring Expense'
                  : isViewOnly
                    ? PERMISSION_MESSAGES.VIEW_ONLY
                    : !useModuleRecurringExpenses?.edit
                      ? PERMISSION_MESSAGES.NO_PERMISSION
                      : `This document cannot be edited in its current status - ${statusLabel}.`;
                const deleteTooltip = canDelete
                  ? 'Delete Recurring Expense'
                  : isViewOnly
                    ? PERMISSION_MESSAGES.VIEW_ONLY
                    : !useModuleRecurringExpenses?.delete
                      ? PERMISSION_MESSAGES.NO_PERMISSION
                      : `This document cannot be deleted in its current status - ${statusLabel}.`;
                const markAsTooltip = canMarkStatus
                  ? 'Mark Recurring Expense As'
                  : isViewOnly
                    ? PERMISSION_MESSAGES.VIEW_ONLY
                    : !useModuleRecurringExpenses?.edit
                      ? PERMISSION_MESSAGES.NO_PERMISSION
                      : `This document status cannot be changed in its current status - ${statusLabel}.`;
                const moreTooltip = canOpenMore ? 'More Actions' : blockedTooltip;

                return (
                  <div className="flex items-center gap-3">
                    <Tooltip title={viewTooltip}>
                      <Icons.EyeOutlined
                        className={canView ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                        style={{ fontSize: 17, color: '#1E3A56' }}
                        onClick={canView ? () => handleViewClick(record) : undefined}
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

                                    if (key.includes(RECURRING_EXPENSE_STATUS?.ACTIVE) || label.includes(RECURRING_EXPENSE_STATUS?.ACTIVE)) {
                                      return {
                                        icon: <Icons.CheckCircleOutlined className={markAsDisabled ? 'text-gray-400' : 'text-green-800'} style={{ fontSize: 14 }} />,
                                        hoverClass: 'hover:bg-green-50 hover:text-green-800',
                                      };
                                    } else if (key.includes(RECURRING_EXPENSE_STATUS?.PAUSED) || label.includes(RECURRING_EXPENSE_STATUS?.PAUSED)) {
                                      return {
                                        icon: <Icons.PauseOutlined className={markAsDisabled ? 'text-gray-400' : 'text-amber-700'} style={{ fontSize: 14 }} />,
                                        hoverClass: 'hover:bg-amber-50 hover:text-amber-800',
                                      };
                                    } else if (key.includes(RECURRING_EXPENSE_STATUS?.COMPLETED) || label.includes(RECURRING_EXPENSE_STATUS?.COMPLETED)) {
                                      return {
                                        icon: <Icons.CheckCircleOutlined className={markAsDisabled ? 'text-gray-400' : 'text-emerald-800'} style={{ fontSize: 14 }} />,
                                        hoverClass: 'hover:bg-emerald-50 hover:text-emerald-800',
                                      };
                                    } else if (key.includes(RECURRING_EXPENSE_STATUS?.CANCELLED) || label.includes(RECURRING_EXPENSE_STATUS?.CANCELLED)) {
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
      <DocumentConfirmModal
        modal={deleteModal}
        docType={MODULE_NAMES?.RECURRING_EXPENSE}
        onConfirm={deleteRecurringExpense}
        loading={deleteLoading}
        getDocumentDetails={getRecurringExpenseDocumentDetails}
      />
      <DocumentConfirmModal
        modal={cancelStatusModal}
        docType={MODULE_NAMES?.RECURRING_EXPENSE}
        loading={submitLoading}
        mode="status"
        onConfirm={confirmCancelStatus}
        getDocumentDetails={payload => getRecurringExpenseDocumentDetails(payload?.record)}
      />
      <ViewDocumentListToolbarModals {...toolbarModalsProps} />
    </div>
  );
};

export default ViewRecurringExpenses;
