import { downloadExcelExport, resolveExportFileName } from '@/utils/exportData';
import { flattenAccountsForExport, formatAccountBalanceLabel, indentAccountName } from '../chartOfAccount.utils';

const mapAccountToExcelRow = account => ({
  'Account Name': indentAccountName(account?.accountName, account?.indentLevel),
  'Account Code': account?.accountCode || '',
  'Closing Balance': formatAccountBalanceLabel(account?.currentBalance, account?.isDebit),
  'Account Type': account?.categoryDisplayName || account?.category || '',
  'Parent Account': account?.parentAccountName || '',
  Status: account?.isActive ? 'Active' : 'Inactive',
  'System Account': account?.isSystemAccount ? 'Yes' : 'No',
});

export const downloadChartOfAccountExcel = async ({ accountDrop, filename = 'chart_of_accounts.xlsx' }) => {
  const rows = flattenAccountsForExport(accountDrop);
  const exportData = rows.map(mapAccountToExcelRow);

  await downloadExcelExport({
    exportData,
    sheetName: 'Chart of Accounts',
    fileName: resolveExportFileName(filename, 'chart_of_accounts.xlsx'),
  });
};
