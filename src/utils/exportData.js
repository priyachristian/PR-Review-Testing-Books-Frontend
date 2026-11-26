import { getExportColumns } from './services';

export const buildExportRows = (dataList, columns) => {
  const columnsToExport = getExportColumns(columns);

  return (dataList || []).map(record => {
    const row = {};
    columnsToExport.forEach(col => {
      row[col.title] = col.getExportValue ? col.getExportValue(record) : '';
    });
    return row;
  });
};

export const resolveExportFileName = (fileName, defaultFileName, extension = 'xlsx') => {
  const baseFileName = fileName?.trim() || defaultFileName;
  const normalizedExtension = extension?.replace(/^\./, '') || 'xlsx';
  const suffix = `.${normalizedExtension}`;
  return baseFileName.toLowerCase().endsWith(suffix) ? baseFileName : `${baseFileName}${suffix}`;
};

export const downloadExcelExport = async ({ exportData, sheetName, fileName }) => {
  const XLSX = await import('xlsx');
  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, fileName);
};

export const downloadBlobFile = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
