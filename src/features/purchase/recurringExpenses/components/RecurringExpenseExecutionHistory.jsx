import { useState } from 'react';
import { useRecurringExpenses } from '@/features/purchase/recurringExpenses';
import RecurringExecutionHistory from '@/components/ui/common/RecurringExecutionHistory';

const RecurringExpenseExecutionHistory = ({ history = [] }) => {
  const { createExpenseFromRecurring, getRecurringExpenseById } = useRecurringExpenses();
  const [loadingRowId, setLoadingRowId] = useState(null);

  const handleCreateExpense = async record => {
    setLoadingRowId(record._id);
    try {
      await createExpenseFromRecurring({ id: record._id });
      await getRecurringExpenseById({ recurringExpenseId: record?.recurringExpenseId });
    } catch (error) {
      console.error('Create expense failed:', error);
    } finally {
      setLoadingRowId(null);
    }
  };

  return (
    <RecurringExecutionHistory
      history={history}
      typeLabel="Expense"
      redirectPathPrefix="/expenses"
      generatedNumberKey="generatedExpenseNumber"
      generatedIdKey="generatedExpenseId"
      loadingRowId={loadingRowId}
      onCreateAction={handleCreateExpense}
    />
  );
};

export default RecurringExpenseExecutionHistory;
