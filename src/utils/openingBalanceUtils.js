import {
  OB_TYPE,
  OB_TYPE_LABEL,
  OB_PAYMENT_ENTRY_SOURCE,
  OB_PAYMENT_ENTRY_SOURCE_LABEL,
  PAYMENT_RECEIVED_STATUS,
  PAYMENT_MADE_STATUS,
  INVOICE_STATUS,
  BILL_STATUS,
  CREDIT_NOTE_STATUS,
  DEBIT_NOTE_STATUS,
  EXPENSE_ROW_TYPE,
} from 'utils/constants';
import { formatAmount } from '@/utils/currency';

export const isOpeningBalanceCreditType = type => type === OB_TYPE.CUSTOMER_CREDIT || type === OB_TYPE.VENDOR_CREDIT;

export const getObApplicationPaymentNavPath = entry => {
  if (!entry?.sourcePaymentId) return null;
  const t = entry?.type;
  if (t !== OB_TYPE.OPENING_RECEIVABLE && t !== OB_TYPE.OPENING_PAYABLE) return null;
  const id = entry.sourcePaymentId;
  if (entry.paymentNavKind === 'made') return `/payments-made/${id}`;
  if (entry.paymentNavKind === 'received') return `/payments-received/${id}`;
  return null;
};

export const formatObAmountByType = (amount, type) => {
  if (amount === null || amount === undefined || amount === '') return '-';
  const n = Math.abs(Number(amount));
  if (Number.isNaN(n)) return '-';
  if (!type) return formatAmount(n);
  return isOpeningBalanceCreditType(type) ? formatAmount(-n) : formatAmount(n);
};

export const getObApplicationKindLabel = type => {
  if (!type) return OB_TYPE_LABEL.DEFAULT;
  return OB_TYPE_LABEL[type] || OB_TYPE_LABEL.DEFAULT;
};

export const getObRelatedDocumentStatusLabel = status => {
  if (status == null || status === '') return '—';
  const u = String(status).toUpperCase();
  return PAYMENT_RECEIVED_STATUS[u] || PAYMENT_MADE_STATUS[u] || INVOICE_STATUS[u] || BILL_STATUS[u] || CREDIT_NOTE_STATUS[u] || DEBIT_NOTE_STATUS[u] || status;
};

export const getObPaymentHistorySourceLabel = (side, entry) => {
  if (!entry) return '-';
  if (side === OB_PAYMENT_ENTRY_SOURCE.PAYMENT_RECEIVED) {
    if (entry.creditNote) return 'Credit note';
    if (entry.invoice) return OB_PAYMENT_ENTRY_SOURCE_LABEL[OB_PAYMENT_ENTRY_SOURCE.INVOICE_CREDIT];
    if (entry.entrySource === OB_PAYMENT_ENTRY_SOURCE.INVOICE_CREDIT && entry.paymentDocumentNo) {
      return OB_TYPE_LABEL.DEFAULT;
    }
    if (entry.entrySource === OB_PAYMENT_ENTRY_SOURCE.INVOICE_CREDIT) {
      return OB_PAYMENT_ENTRY_SOURCE_LABEL[OB_PAYMENT_ENTRY_SOURCE.INVOICE_CREDIT];
    }
    return OB_PAYMENT_ENTRY_SOURCE_LABEL[OB_PAYMENT_ENTRY_SOURCE.PAYMENT_RECEIVED];
  }
  if (side === OB_PAYMENT_ENTRY_SOURCE.PAYMENT_MADE) {
    if (entry.debitNote) return 'Debit note';
    if (entry.bill) return OB_PAYMENT_ENTRY_SOURCE_LABEL[OB_PAYMENT_ENTRY_SOURCE.BILL_CREDIT];
    if (entry.entrySource === OB_PAYMENT_ENTRY_SOURCE.BILL_CREDIT && entry.paymentDocumentNo) {
      return OB_TYPE_LABEL.DEFAULT;
    }
    if (entry.entrySource === OB_PAYMENT_ENTRY_SOURCE.BILL_CREDIT) {
      return OB_PAYMENT_ENTRY_SOURCE_LABEL[OB_PAYMENT_ENTRY_SOURCE.BILL_CREDIT];
    }
    return OB_PAYMENT_ENTRY_SOURCE_LABEL[OB_PAYMENT_ENTRY_SOURCE.PAYMENT_MADE];
  }
  return '-';
};

export const getObPaymentHistoryDocumentLabel = (side, entry, record) => {
  if (!entry) return '-';
  const obTxnNo = record?.transactionNo;
  if (side === OB_PAYMENT_ENTRY_SOURCE.PAYMENT_RECEIVED) {
    if (entry.creditNote?.creditNoteId) return entry.creditNote.creditNoteId;
    if (entry.invoice?.invoiceId) return entry.invoice.invoiceId;
    if (entry.paymentReceived?.paymentReceivedId) return entry.paymentReceived.paymentReceivedId;
    if (entry.paymentDocumentNo) return entry.paymentDocumentNo;
    return obTxnNo || '-';
  }
  if (side === OB_PAYMENT_ENTRY_SOURCE.PAYMENT_MADE) {
    if (entry.debitNote?.debitNoteId) return entry.debitNote.debitNoteId;
    if (entry.bill?.billId) return entry.bill.billId;
    if (entry.paymentMade?.paymentMadeId) return entry.paymentMade.paymentMadeId;
    if (entry.paymentDocumentNo) return entry.paymentDocumentNo;
    return obTxnNo || '-';
  }
  return '-';
};

const getContactBranchOpeningBalance = (contact, documentBranchId) => {
  if (!contact?.branch?.length || documentBranchId == null) return undefined;
  const id = String(documentBranchId);
  return contact.branch.find(b => String(b?.branchId) === id)?.openingBalance;
};

export const hasOpeningBalanceCreditForBranch = (contact, documentBranchId) => {
  const v = getContactBranchOpeningBalance(contact, documentBranchId);
  return v != null && Number(v) < 0;
};

export function obTxnList(raw) {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === 'object' && raw._id && Object.keys(raw).length) return [raw];
  return [];
}

export function mergePendingDropWithOb(pendingResults, openingBalanceRaw, mode, pendingExpenses = []) {
  const isInvoice = mode === 'invoice';
  const openingBalanceType = isInvoice ? OB_TYPE.OPENING_RECEIVABLE : OB_TYPE.OPENING_PAYABLE;
  const openingBalances = obTxnList(openingBalanceRaw).filter(item => item._id && (!item.type || item.type === openingBalanceType));

  const openingBalanceRows = openingBalances.map(item => {
    const common = {
      _id: item._id,
      dueDate: item.date,
      total: item.amount,
      balanceAmount: item.remainingAmount,
      type: openingBalanceType,
      branchId: item.branchId,
      branchName: item.branchName,
    };

    if (isInvoice) {
      return {
        ...common,
        invoiceId: item.transactionNo || `OB-${item._id}`,
        invoiceDate: item.date,
      };
    }

    return {
      ...common,
      billId: item.transactionNo || `OB-${item._id}`,
      billDate: item.date,
      isSplit: false,
    };
  });

  const expenseRows = pendingExpenses.map(item => {
    const common = {
      _id: item._id,
      dueDate: item.date,
      total: item.total,
      balanceAmount: item.balanceAmount,
      type: EXPENSE_ROW_TYPE,
      branchId: item.branchId,
      branchName: item.branchName,
    };

    if (isInvoice) {
      return {
        ...common,
        invoiceId: item.expenseId,
        invoiceDate: item.date,
      };
    }

    return {
      ...common,
      billId: item.expenseId,
      billDate: item.date,
      isSplit: false,
    };
  });

  return [...(pendingResults || []), ...openingBalanceRows, ...expenseRows];
}
