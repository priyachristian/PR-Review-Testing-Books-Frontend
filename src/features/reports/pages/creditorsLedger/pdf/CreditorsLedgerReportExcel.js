import { downloadExcelExport, resolveExportFileName } from '@/utils/exportData';

const getClosingBalance = records => {
  let totalDebit = 0;
  let totalCredit = 0;
  let splitTotalDebit = 0;
  let splitTotalCredit = 0;
  let totalDebitsWithSplit = 0;
  let totalCreditsWithSplit = 0;

  (records || []).forEach(x => {
    if (x?.netPayable > 0) {
      totalCredit += x?.netPayable || 0;
    } else {
      totalDebit += x?.netPayable || 0;
    }
    if (x?.splitNetPayable > 0) {
      splitTotalCredit += x?.splitNetPayable || 0;
    } else {
      splitTotalDebit += x?.splitNetPayable || 0;
    }
    totalDebitsWithSplit += x?.totalDebitsWithSplit || 0;
    totalCreditsWithSplit += x?.totalCreditsWithSplit || 0;
  });

  return {
    customerDisplayName: 'Grand Total',
    totalDebit,
    totalCredit,
    splitTotalDebit,
    splitTotalCredit,
    totalDebitsWithSplit,
    totalCreditsWithSplit,
  };
};

const mapRecordToExcelRow = (record, isSplitSessionActive) => {
  const row = {
    Particulars: record?.customerDisplayName || '',
    Debit: record?.totalDebit ? Math.abs(record.totalDebit) : record?.netPayable < 0 ? Math.abs(record.netPayable) : '',
    Credit: record?.totalCredit ? record.totalCredit : record?.netPayable > 0 ? record.netPayable : '',
    'Due Amount': record?.overdueBillTotal > 0 ? record.overdueBillTotal : '',
  };

  if (isSplitSessionActive) {
    row['Split Debit'] = record?.splitTotalDebit ? Math.abs(record.splitTotalDebit) : record?.splitNetPayable < 0 ? Math.abs(record.splitNetPayable) : '';
    row['Split Credit'] = record?.splitTotalCredit ? record.splitTotalCredit : record?.splitNetPayable > 0 ? record.splitNetPayable : '';
    row['Split Due Amount'] = record?.splitOverdueBillTotal > 0 ? record.splitOverdueBillTotal : '';
    row['Total Debit'] = record?.totalDebitsWithSplit ? Math.abs(record.totalDebitsWithSplit) : '';
    row['Total Credits'] = record?.totalCreditsWithSplit ? Math.abs(record.totalCreditsWithSplit) : '';
    row['Total Due Amount'] = record?.totalOverdueBillWithSplit > 0 ? record.totalOverdueBillWithSplit : '';
  }

  return row;
};

export const downloadCreditorsLedgerExcel = async ({ records, isSplitSessionActive = false, filename = 'creditors_ledger.xlsx' }) => {
  const recordsWithTotal = [...(records || []), getClosingBalance(records)];
  const exportData = recordsWithTotal.map(record => mapRecordToExcelRow(record, isSplitSessionActive));

  await downloadExcelExport({
    exportData,
    sheetName: 'Creditors Ledger',
    fileName: resolveExportFileName(filename, 'creditors_ledger.xlsx'),
  });
};
