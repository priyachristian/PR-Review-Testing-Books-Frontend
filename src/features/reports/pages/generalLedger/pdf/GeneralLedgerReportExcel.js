import { dateFormateForUi } from 'utils/services';
import { formatAmount } from '@/utils/currency';

const HEADERS = ['Date', 'Particulars', 'Vch Type', 'Vch No', 'Debit', 'Credit', 'Balance'];

function buildFinalBalance(recordList, reports) {
  let totalDebit = recordList.reduce((sum, r) => sum + (r?.debit || 0), 0);
  let totalCredit = recordList.reduce((sum, r) => sum + (r?.credit || 0), 0);
  if (reports?.openingBalanceType === 'DR') {
    totalDebit += reports?.openingBalance || 0;
  } else {
    totalCredit += reports?.openingBalance || 0;
  }
  return totalDebit > totalCredit ? totalDebit : totalCredit;
}

function buildRows(records, reports, startDate, endDate) {
  const recordList = Array.isArray(records) ? records : [];
  const rows = [];

  if (reports?.openingBalance) {
    rows.push([
      startDate ? dateFormateForUi(startDate) : '',
      'Opening Balance',
      '',
      '',
      reports?.openingBalanceType === 'DR' ? formatAmount(reports.openingBalance, false) : '',
      reports?.openingBalanceType === 'CR' ? formatAmount(reports.openingBalance, false) : '',
      '',
    ]);
  }

  recordList.forEach(record => {
    rows.push([
      record?.date ? dateFormateForUi(record.date) : '',
      record?.description || '',
      record?.vchType || '',
      record?.vchNo || '',
      record?.debit ? formatAmount(record.debit, false) : '',
      record?.credit ? formatAmount(record.credit, false) : '',
      record?.balance ? formatAmount(record.balance, false) : '',
    ]);
  });

  rows.push(['', '', '', '', reports?.totalDebit ? formatAmount(reports.totalDebit, false) : '', reports?.totalCredit ? formatAmount(reports.totalCredit, false) : '', '']);

  if (reports?.closingBalance !== undefined) {
    rows.push([
      endDate ? dateFormateForUi(endDate) : '',
      'Closing Balance',
      '',
      '',
      reports?.closingBalanceType === 'DR' ? formatAmount(reports?.closingBalance, false) : '',
      reports?.closingBalanceType === 'CR' ? formatAmount(reports?.closingBalance, false) : '',
      '',
    ]);
  }

  const finalBalance = buildFinalBalance(recordList, reports || {});
  rows.push(['', '', '', '', finalBalance ? formatAmount(finalBalance, false) : '', finalBalance ? formatAmount(finalBalance, false) : '', '']);

  return rows;
}

export const generalLedgerReportExcelFileName = ({ selectedCustomer } = {}) => {
  const today = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

  const entity = selectedCustomer?.companyName || selectedCustomer?.customerDisplayName || '';
  const entitySanitized = entity.replace(/[^a-zA-Z0-9]/g, '_');

  return entitySanitized ? `general_ledger_${entitySanitized}_${dateStr}.xlsx` : `general_ledger_${dateStr}.xlsx`;
};

async function buildGeneralLedgerWorkbook({ records, reports, startDate, endDate }) {
  const XLSX = await import('xlsx');
  const rows = buildRows(records, reports, startDate, endDate);
  const worksheet = XLSX.utils.aoa_to_sheet([HEADERS, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'ledger');
  return { XLSX, workbook };
}

export async function buildGeneralLedgerExcelBase64({ records, reports, startDate, endDate }) {
  const { XLSX, workbook } = await buildGeneralLedgerWorkbook({ records, reports, startDate, endDate });
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
}

export async function downloadLedgerReportExcel({ records, reports, startDate, endDate, filename = 'general_ledger.xlsx' }) {
  const { XLSX, workbook } = await buildGeneralLedgerWorkbook({ records, reports, startDate, endDate });
  const fileName = filename.toLowerCase().endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  XLSX.writeFile(workbook, fileName);
}
