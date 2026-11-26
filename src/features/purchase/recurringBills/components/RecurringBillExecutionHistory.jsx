import React, { useState } from 'react';
import { useRecurringBills } from '@/features/purchase/recurringBills';
import RecurringExecutionHistory from '@/components/ui/common/RecurringExecutionHistory';

const RecurringBillExecutionHistory = ({ history = [], currency }) => {
  const { createBillFromRecurring, getRecurringBillById } = useRecurringBills();
  const [loadingRowId, setLoadingRowId] = useState(null);

  const handleCreateBill = async record => {
    setLoadingRowId(record._id);
    try {
      await createBillFromRecurring({ id: record._id });
      await getRecurringBillById({ recurringBillId: record?.recurringBillId });
    } catch (error) {
      console.error('Create bill failed:', error);
    } finally {
      setLoadingRowId(null);
    }
  };

  return (
    <RecurringExecutionHistory
      history={history}
      currency={currency}
      typeLabel="Bill"
      redirectPathPrefix="/bills"
      generatedNumberKey="generatedBillNumber"
      generatedIdKey="generatedBillId"
      loadingRowId={loadingRowId}
      onCreateAction={handleCreateBill}
    />
  );
};

export default RecurringBillExecutionHistory;
