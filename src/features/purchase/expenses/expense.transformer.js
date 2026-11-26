import { toApiDate } from '@/utils/util';

const round2 = value => Math.round((Number(value) || 0) * 100) / 100;

const EXPENSE_DUPLICATE_OMIT_KEYS = ['id', '_id', 'expenseId', 'createdAt', 'updatedAt', 'date', 'invoiceNo', 'invoiceDate', 'receipts'];

export const stripExpenseForDuplicate = expense => {
  if (!expense) return expense;
  const cloneable = { ...expense };
  EXPENSE_DUPLICATE_OMIT_KEYS.forEach(key => {
    delete cloneable[key];
  });
  return cloneable;
};

export const getExpenseDocumentDetails = expense =>
  expense
    ? {
        expenseId: expense.expenseId,
        date: expense.date,
        expenseAccountName: expense.expenseAccount?.accountName,
        amount: expense.total,
      }
    : null;

export const getExpenseLineAmounts = (line, isTaxInclusive) => {
  // 'none' and 'exempted' have no number, so they count as 0%.
  const rate = Number(line.gst) || 0;
  const amount = Number(line.amount) || 0;
  const baseAmount = isTaxInclusive && rate ? round2(amount / (1 + rate / 100)) : amount;
  const taxAmount = isTaxInclusive ? round2(amount - baseAmount) : round2((amount * rate) / 100);
  return { baseAmount, taxAmount };
};

// Fills the total box. The backend works these out again when saving.
export const calculateExpenseAmounts = (values, setFieldValue) => {
  let subTotal = 0;
  let totalTax = 0;
  values.lines.forEach(line => {
    const { baseAmount, taxAmount } = getExpenseLineAmounts(line, values.isTaxInclusive);
    subTotal += baseAmount;
    totalTax += taxAmount;
  });
  subTotal = round2(subTotal);
  totalTax = round2(totalTax);

  // TDS is on the amount before GST and is deducted; TCS is on the amount after GST and is added.
  let directTax = 0;
  const isTds = values.tax?.type === 'TDS';
  if (values.tax?.taxId) {
    if (values.tax.amount == null || values.isTaxAmountManual === false) {
      directTax = round2(((isTds ? subTotal : subTotal + totalTax) * values.tax.rate) / 100);
      setFieldValue('tax', { ...values.tax, amount: directTax });
    } else {
      directTax = round2(values.tax.amount);
    }
  }

  const preciseTotal = round2(subTotal + totalTax + (isTds ? -directTax : directTax));
  const total = values.isRoundOff ? Math.round(preciseTotal) : preciseTotal;

  setFieldValue('subTotal', subTotal);
  setFieldValue('totalTax', totalTax);
  setFieldValue('total', total);
  setFieldValue('roundOffAmount', round2(total - preciseTotal));
};

export const expenseTransformer = (values, receipts) => {
  return {
    expenseId: values?.expenseId,
    date: toApiDate(values.date),
    paidThroughAccountId: values.paidThroughAccountId || null,
    notes: values.notes,
    party: values.party,
    receipts,
    divisionId: values?.divisionId,
    branchId: values?.branchId,
    warehouseId: values?.warehouseId,
    termsAndConditions: values.termsAndConditions,
    exchangeRate: values.exchangeRate,
    invoiceNo: values.invoiceNo,
    invoiceDate: values.invoiceDate ? toApiDate(values.invoiceDate) : null,
    isTaxInclusive: values.isTaxInclusive,
    taxSplit: values.taxSplit,
    supplierGstin: values.supplierGstin,
    isRoundOff: values.isRoundOff,
    isBillable: values.isBillable,
    tax: values.isBillable ? null : values.tax,
    lines: values.lines.map(line => ({
      accountId: line.accountId,
      description: line.description,
      amount: Number(line.amount),
      gst: line.gst,
      supplyType: line.supplyType,
      hsnCode: line.hsnCode,
      isItcEligible: line.isItcEligible,
    })),
  };
};
