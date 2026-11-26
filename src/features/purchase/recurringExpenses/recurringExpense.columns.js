import { Tag } from '@/components/AntDComponent';
import { getAmountCoulmn } from '@/utils/tableColumns';
import { dateFormateForUi } from '@/utils/services';

export const recurringExpensesColumn = () => {
  return [
    {
      title: 'Recurring Expense#',
      dataIndex: 'recurringExpenseId',
      key: 'recurringExpenseId',
      render: recurringExpenseId => <Tag className="font-semibold">{recurringExpenseId}</Tag>,
      fixed: 'left',
      visible: true,
      required: true,
      sorter: true,
      width: 185,
    },
    {
      title: 'Expense Account',
      dataIndex: 'expenseAccount',
      key: 'expenseAccount',
      render: expenseAccount => expenseAccount?.accountName || '',
      visible: true,
      required: true,
    },
    {
      title: 'Customer Name',
      dataIndex: 'customer',
      key: 'customer',
      render: customer => customer?.customerDisplayName || '',
      visible: true,
      required: true,
    },
    {
      title: 'Frequency',
      dataIndex: 'repeatEvery',
      key: 'repeatEvery',
      render: repeatEvery => `${repeatEvery?.frequency}${' '}${repeatEvery?.period}` || '',
    },
    {
      title: 'Last Expense Date',
      dataIndex: 'lastExpenseDate',
      key: 'datelastExpenseDate',
      align: 'start',
      render: (_, record) => dateFormateForUi(record?.currentExecutionDate),
    },
    {
      title: 'Next Expense Date',
      dataIndex: 'nextExpenseDate',
      key: 'nextExpenseDate',
      align: 'start',
      render: (_, record) => dateFormateForUi(record?.nextExecutionDate),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      required: true,
    },
    getAmountCoulmn('Amount', 'amount', 'amount', true, true),
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
  ];
};
