import { Tag, Tooltip } from '@/components/AntDComponent';
import Icons from 'assets/icons/icon';
import { getDateColumn, getAmountCoulmn } from '@/utils/tableColumns';
import { colorPalette } from '@/utils/theme';
import { dateFormateForUi } from '@/utils/services';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import { EXPENSE_BILLABLE_STATUS } from '@/utils/constants';
import { PERMISSION_MESSAGES } from 'utils/constants';

export const expensesColumn = (handleEditClick, useModuleExpenses, handleViewClick, handleDeleteClick, isViewOnly, handleDuplicateClick) => {
  return [
    {
      title: 'Expenses#',
      dataIndex: 'expenseId',
      key: 'expenseId',
      render: value => <Tag className="font-semibold">{value}</Tag>,
      visible: true,
      required: true,
      sorter: true,
      fixed: 'left',
    },
    getDateColumn('Date', 'date', 'date', true, true),
    {
      title: 'Expense Account',
      dataIndex: 'expenseAccount',
      key: 'expenseAccount',
      render: expenseAccount => expenseAccount?.accountName,
      visible: true,
      required: true,
      sorter: true,
    },
    {
      title: 'Party',
      dataIndex: 'party',
      key: 'party',
      render: party => party?.customerDisplayName || '-',
      visible: true,
    },
    {
      title: 'Paid Through',
      dataIndex: 'paidThroughAccountId',
      key: 'paidThroughAccountId',
      render: paidThroughAccount => paidThroughAccount?.accountName || '-',
      visible: true,
      sorter: true,
    },
    getAmountCoulmn('Amount', 'total', 'total', true, true),
    {
      title: 'Status',
      key: 'billableStatus',
      render: record => {
        const status = record.isBillable ? record.billableStatus : 'PAID';
        return <StatusBadge status={status} value={EXPENSE_BILLABLE_STATUS[status]} />;
      },
      visible: true,
    },
    {
      title: 'Division',
      dataIndex: 'divisionId',
      key: 'divisionId',
      render: divisionId => divisionId?.name,
      visible: true,
      sorter: true,
    },
    {
      title: 'Branch',
      dataIndex: 'branchId',
      key: 'branchId',
      render: branchId => branchId?.name,
      visible: true,
      sorter: true,
    },
    {
      title: 'Added By',
      dataIndex: 'addedBy',
      key: 'addedBy',
      render: addedBy => `${addedBy?.firstName || ''} ${addedBy?.lastName || ''}`,
      visible: true,
      sorter: true,
    },
    {
      title: 'Updated By',
      dataIndex: 'updatedBy',
      key: 'updatedBy',
      render: updatedBy => `${updatedBy?.firstName || ''} ${updatedBy?.lastName || ''}`,
      visible: true,
      sorter: true,
    },
    {
      title: 'Action',
      key: 'edit',
      render: record => {
        const blockedTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : PERMISSION_MESSAGES.NO_PERMISSION;
        const canView = useModuleExpenses?.view;
        const canEdit = useModuleExpenses?.edit && !isViewOnly;
        const canDelete = useModuleExpenses?.delete && !isViewOnly;
        const canDuplicate = useModuleExpenses?.create && !isViewOnly;
        const viewTooltip = canView ? 'View Expense' : PERMISSION_MESSAGES.NO_PERMISSION;
        const editTooltip = canEdit ? 'Edit Expense' : blockedTooltip;
        const deleteTooltip = canDelete ? 'Delete Expense' : blockedTooltip;
        const duplicateTooltip = canDuplicate ? 'Duplicate Document' : blockedTooltip;

        return (
          <div className="flex items-center justify-start gap-3">
            <Tooltip title={viewTooltip}>
              <Icons.EyeOutlined
                className={canView ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                style={{ fontSize: 17, color: '#1E3A56', cursor: canView ? 'pointer' : 'not-allowed' }}
                onClick={e => {
                  e.stopPropagation();
                  if (canView) handleViewClick(record);
                }}
              />
            </Tooltip>
            <Tooltip title={duplicateTooltip}>
              <Icons.CopyOutlined
                className={canDuplicate ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                style={{ fontSize: 17, color: colorPalette.primary[500], cursor: canDuplicate ? 'pointer' : 'not-allowed' }}
                onClick={e => {
                  e.stopPropagation();
                  if (canDuplicate) handleDuplicateClick(record);
                }}
              />
            </Tooltip>
            <Tooltip title={editTooltip}>
              <Icons.EditOutlined
                className={canEdit ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                style={{ fontSize: 17, color: colorPalette.primary[500], cursor: canEdit ? 'pointer' : 'not-allowed' }}
                onClick={e => {
                  e.stopPropagation();
                  if (canEdit) handleEditClick(record);
                }}
              />
            </Tooltip>
            <Tooltip title={deleteTooltip}>
              <Icons.DeleteOutlined
                className={canDelete ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                style={{ fontSize: 17, color: colorPalette.error[500], cursor: canDelete ? 'pointer' : 'not-allowed' }}
                onClick={e => {
                  e.stopPropagation();
                  if (canDelete) handleDeleteClick(record);
                }}
              />
            </Tooltip>
          </div>
        );
      },
    },
  ];
};

const personName = person => `${person?.firstName || ''} ${person?.lastName || ''}`.trim();

export const expenseExportColumn = () => [
  {
    title: 'Expenses#',
    getExportValue: expense => expense?.expenseId || '',
  },
  {
    title: 'Date',
    getExportValue: expense => (expense?.date ? dateFormateForUi(expense.date) : ''),
  },
  {
    title: 'Expense Account',
    getExportValue: expense => expense?.expenseAccount?.accountName || '',
  },
  {
    title: 'Paid Through',
    getExportValue: expense => expense?.paidThroughAccountId?.accountName || '',
  },
  {
    title: 'Amount',
    getExportValue: expense => expense?.total ?? '',
  },
  {
    title: 'Status',
    getExportValue: expense => EXPENSE_BILLABLE_STATUS[expense.isBillable ? expense.billableStatus : 'PAID'],
  },
  {
    title: 'Customer',
    getExportValue: expense => expense?.party?.customerDisplayName || '',
  },
  {
    title: 'Notes',
    getExportValue: expense => expense?.notes || '',
  },
  {
    title: 'Division',
    getExportValue: expense => expense?.divisionId?.name || '',
  },
  {
    title: 'Branch',
    getExportValue: expense => expense?.branchId?.name || '',
  },
  {
    title: 'Added By',
    getExportValue: expense => personName(expense?.addedBy),
  },
  {
    title: 'Updated By',
    getExportValue: expense => personName(expense?.updatedBy),
  },
];
