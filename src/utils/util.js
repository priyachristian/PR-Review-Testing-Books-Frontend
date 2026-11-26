import * as Yup from 'yup';
import dayjs from 'dayjs';

const normalizeKey = value =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

const hasValue = value => value != null && String(value).trim() !== '';

const getValidationErrors = error => (error.inner?.length ? error.inner.map(err => err.message) : [error.message]);

/** Format file size for display */
export const formatFileSize = bytes => {
  if (bytes == null) return '';
  return bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} KB`;
};

/** Renders import preview table cells (React does not display boolean children). */
export const formatImportPreviewCell = value => {
  if (typeof value === 'boolean') return String(value);
  if (value == null || value === '') return '';
  return value;
};

/** Auto map spreadsheet columns with fields */
export const buildDefaultFieldMapping = (columns = [], fields = []) => {
  const normalizedColumns = Object.fromEntries(columns.map(col => [normalizeKey(col), col]));
  return fields.reduce((acc, field) => {
    const keys = [field.label, field.id, ...(field.aliases || [])].map(normalizeKey);
    const matched = keys.find(key => normalizedColumns[key]);

    if (matched) {
      acc[field.id] = normalizedColumns[matched];
    }

    return acc;
  }, {});
};

/** Convert spreadsheet rows into mapped records */
export const mapImportFileRows = (file, mapping, { filterEmpty = true, headerRowCount = 1 } = {}) => {
  if (!file?.columns?.length) return [];

  const columnIndex = Object.fromEntries(file.columns.map((col, index) => [col, index]));
  const rows = file.data.map((row, rowIndex) => {
    const data = {};

    Object.entries(mapping).forEach(([fieldId, columnName]) => {
      const index = columnIndex[columnName];
      data[fieldId] = index !== undefined ? (row[index] ?? null) : null;
    });

    return {
      rowIndex,
      rowNumber: rowIndex + headerRowCount + 1,
      data,
    };
  });

  return filterEmpty ? rows.filter(row => Object.values(row.data).some(hasValue)) : rows;
};

/** Validate imported records */
export const validateImportRecords = async (records, validationSchema, { preprocess, getRecordLabel } = {}) => {
  const validRecords = [];
  const invalidRecords = [];

  for (let index = 0; index < records.length; index++) {
    const { rowIndex, rowNumber, data } = records[index];

    try {
      const payload = preprocess ? preprocess(data) : data;

      const validated = await validationSchema.validate(payload, {
        abortEarly: false,
      });

      validRecords.push({
        ...validated,
        rowIndex,
        rowNumber,
      });
    } catch (error) {
      invalidRecords.push({
        index,
        rowIndex,
        rowNumber,
        label: getRecordLabel?.(data) || Object.values(data).find(hasValue)?.toString() || '-',
        data,
        errors: getValidationErrors(error),
      });
    }
  }

  return {
    totalRecords: records.length,
    validRecordsCount: validRecords.length,
    invalidRecordsCount: invalidRecords.length,
    validRecords,
    invalidRecords,
  };
};

/** Download selected rows */
export const downloadImportRows = async (file, fileName, records, { outputPrefix = 'Skipped_Items' } = {}) => {
  if (!file?.columns?.length || !records?.length) return;

  const XLSX = await import('xlsx');
  const rows = records.map(record => file.data[record.rowIndex]).filter(Boolean);
  const worksheet = XLSX.utils.aoa_to_sheet([file.columns, ...rows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  const ext = fileName?.split('.').pop()?.toLowerCase() || 'xlsx';
  XLSX.writeFile(workbook, `${outputPrefix}.${ext}`, ext === 'xlsx' ? undefined : { bookType: ext });
};

export const readExcelFile = async file => {
  const XLSX = await import('xlsx');
  return new Promise((resolve, reject) => {
    if (!file) {
      reject('No file provided');
      return;
    }

    const reader = new FileReader();

    reader.readAsArrayBuffer(file);

    reader.onload = e => {
      try {
        const arrayBuffer = e.target.result;
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (jsonData.length === 0) {
          reject('Empty file or invalid format');
          return;
        }

        const columns = jsonData[0];
        const dataRows = jsonData.slice(1);

        resolve({ columns, data: dataRows });
      } catch (error) {
        reject(error.message);
      }
    };

    reader.onerror = error => reject(error);
  });
};

/**
 * Validates customer records against Yup schema.
 * @param {Array} records - Array of customer records.
 * @returns {Promise<Object>} - Validation result with valid and invalid records.
 */
export const validateRecords = async (records, validationSchema) => {
  const validRecords = [];
  const invalidRecords = [];

  for (let index = 0; index < records.length; index++) {
    try {
      const validatedRecord = await validationSchema.validate(records[index], {
        abortEarly: false,
      });
      validRecords.push(validatedRecord);
    } catch (error) {
      invalidRecords.push({
        index,
        errors: getValidationErrors(error),
      });
    }
  }

  return {
    totalRecords: records.length,
    validRecordsCount: validRecords.length,
    invalidRecordsCount: invalidRecords.length,
    validRecords,
    invalidRecords, // Contains indexes and validation error details
  };
};

export const shouldPreventNavigation = result => {
  return result?.payload?.code === 0 || result?.type?.endsWith('/rejected');
};

/** Converts Formik errors object to touched object so error messages display below inputs */
export const errorsToTouched = obj => {
  if (!obj || typeof obj !== 'object') return {};
  return Object.fromEntries(
    Object.entries(obj).map(([key, val]) => [
      key,
      Array.isArray(val) ? val.map(item => (typeof item === 'object' && item !== null ? errorsToTouched(item) : true)) : val && typeof val === 'object' ? errorsToTouched(val) : true,
    ])
  );
};

export const amountField = {
  show: value => (value === '' || value == null ? '' : +value === 0 ? '0' : value),

  focusClear: value => value !== '' && value != null && !Number.isNaN(+value) && +value === 0,

  blur: rawValue => {
    const trimmedValue = String(rawValue ?? '').trim();
    return trimmedValue === '' || Number.isNaN(parseFloat(trimmedValue)) ? '0' : trimmedValue;
  },
};

/** Removes trailing rows without `itemId` while keeping at least one row. */
export const trimItemRows = v => {
  const a = [...(v || [])];
  while (a.length > 1 && !a[a.length - 1]?.itemId) a.pop();
  return a;
};

Yup.addMethod(Yup.array, 'itemTableRows', function (rowSchema) {
  return this.transform(trimItemRows).of(rowSchema);
});

export const getFinancialYearStartYear = date => {
  if (!date || !date.isValid()) return null;
  return date.month() < 3 ? date.year() - 1 : date.year();
};

export const getFYStartYearValue = value => {
  if (value == null) return null;
  const fyYear = String(value).slice(0, 4);
  return Number.isNaN(Number(fyYear)) ? null : fyYear;
};

export const getFYDateRangeFromStartYear = startYear => {
  const fyValue = getFYStartYearValue(startYear);
  if (fyValue == null) return null;
  const fyStart = Number(fyValue);
  if (Number.isNaN(fyStart)) return null;
  return {
    startDate: `${fyStart}-04-01`,
    endDate: `${fyStart + 1}-03-31`,
  };
};

export const toApiDate = value => (value ? dayjs(value).format('YYYY-MM-DD') : null);

export const getBillingPlansUrl = () => {
  const accountBaseUrl = (import.meta.env.VITE_ACCOUNT_URL || '').replace(/\/$/, '');
  return `${accountBaseUrl}/billing-plans?tab=BOOKS&period=monthly`;
};
