import { dateFormateForBackend } from '@/utils/services';
import { toApiDate } from '@/utils/util';

export const getRecurringExpenseDocumentDetails = expense =>
  expense
    ? {
        recurringExpenseId: expense.recurringExpenseId,
        customerDisplayName: expense?.customer?.customerDisplayName || expense.customerDisplayName || expense.customerName,
        status: expense.status,
        totalAmount: expense.amount,
      }
    : null;

export const recurringExpenseTransformer = (values, recurringExpenseId, receipts = []) => {
  return {
    ...(!recurringExpenseId && { recurringExpenseId: values?.recurringExpenseId }),
    divisionId: values?.divisionId,
    branchId: values?.branchId,
    warehouseId: values?.warehouseId,
    expenseAccount: values.expenseAccount,
    amount: values.amount,
    paidThroughAccountId: values.paidThroughAccountId || null,
    notes: values.notes,
    customer: values.customer,
    receipts,
    repeatEvery: {
      frequency: values?.frequency,
      period: values?.period,
    },
    startDate: toApiDate(values?.startDate),
    endDate: toApiDate(values?.endDate),
    neverExpires: values?.neverExpires || false,
    ...(!recurringExpenseId && { recurringExpenseDate: dateFormateForBackend(new Date()) }),
    addressId: values.addressId,
    termsAndConditions: values.termsAndConditions,
    exchangeRate: values.exchangeRate,
  };
};
