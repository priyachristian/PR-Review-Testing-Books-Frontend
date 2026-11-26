import { downloadExcelExport, resolveExportFileName } from '@/utils/exportData';
import { dateFormateForUi } from 'utils/services';

const mapEntryToExcelRow = entry => ({
  Date: entry?.date ? dateFormateForUi(entry.date) : '',
  'Document No.': entry?.documentNo || '',
  'Transaction Details': entry?.partyName || entry?.narration || '',
  Type: entry?.type || '',
  Branch: entry?.branchName || '',
  Debit: entry?.debit ? entry.debit : '',
  Credit: entry?.credit ? entry.credit : '',
});

export const downloadAccountLedgerExcel = async ({ account, entries, filename = 'account_ledger.xlsx' }) => {
  const exportData = [];

  if (account) {
    const opening = Number(account.openingBalance) || 0;
    exportData.push({
      Date: '',
      'Document No.': '',
      'Transaction Details': 'Opening Balance',
      Type: '',
      Branch: '',
      Debit: account.isDebit && opening ? opening : '',
      Credit: !account.isDebit && opening ? opening : '',
    });
  }

  (entries || []).forEach(entry => {
    exportData.push(mapEntryToExcelRow(entry));
  });

  if (account) {
    exportData.push({
      Date: '',
      'Document No.': '',
      'Transaction Details': 'Total',
      Type: '',
      Branch: '',
      Debit: account.totalDebit ?? 0,
      Credit: account.totalCredit ?? 0,
    });

    const closing = Number(account.closingBalance) || 0;
    exportData.push({
      Date: '',
      'Document No.': '',
      'Transaction Details': 'Closing Balance',
      Type: '',
      Branch: '',
      Debit: account.isDebit && closing ? closing : '',
      Credit: !account.isDebit && closing ? closing : '',
    });
  }

  const accountName = (account?.accountName || 'account').replace(/[^a-zA-Z0-9]/g, '_');

  await downloadExcelExport({
    exportData,
    sheetName: 'Account Ledger',
    fileName: resolveExportFileName(filename, `${accountName}_ledger.xlsx`),
  });
};
