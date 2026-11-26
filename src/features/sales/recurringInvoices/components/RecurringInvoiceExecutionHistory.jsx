import React, { useState } from 'react';
import { useRecurringInvoice } from '@/features/sales/recurringInvoices';
import RecurringExecutionHistory from '@/components/ui/common/RecurringExecutionHistory';

const RecurringInvoiceExecutionHistory = ({ history = [], currency }) => {
  const { createInvoiceFromRecurring, getRecurringInvoicesById } = useRecurringInvoice();
  const [loadingRowId, setLoadingRowId] = useState(null);

  const handleCreateInvoice = async record => {
    setLoadingRowId(record._id);
    try {
      await createInvoiceFromRecurring({ id: record?._id });
      await getRecurringInvoicesById({ recurringId: record?.recurringInvoiceId });
    } catch (error) {
      console.error('Create invoice failed:', error);
    } finally {
      setLoadingRowId(null);
    }
  };

  return (
    <RecurringExecutionHistory
      history={history}
      currency={currency}
      typeLabel="Invoice"
      redirectPathPrefix="/invoices"
      generatedNumberKey="generatedInvoiceNumber"
      generatedIdKey="generatedInvoiceId"
      loadingRowId={loadingRowId}
      onCreateAction={handleCreateInvoice}
    />
  );
};

export default RecurringInvoiceExecutionHistory;
