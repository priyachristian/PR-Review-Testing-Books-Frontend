export const BULK_OPENING_BALANCE_ACCEPTED_EXTENSIONS = ['.csv', '.xlsx', '.xls'];
export const BULK_OPENING_BALANCE_ACCEPT_LABEL = 'CSV, XLSX, and XLS';
export const BULK_OPENING_BALANCE_MAX_FILE_SIZE = 2 * 1024 * 1024;

const CUSTOMER_NO_HEADERS = new Set(['customer no', 'customerno', 'customer_no', 'customer number', 'vendor no', 'vendorno', 'vendor_no', 'vendor number']);
const SKIP_HEADERS = new Set(['no', 's.no', 's.no.', 'sno', 'sr.no', 'sr no', '#']);

const normalizeHeader = header =>
  String(header ?? '')
    .trim()
    .toLowerCase();

const toNumber = value => {
  if (value === null || value === undefined || value === '') return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const findCustomerNoColumnIndex = (columns = []) =>
  columns.findIndex(header => {
    const normalized = normalizeHeader(header);
    return CUSTOMER_NO_HEADERS.has(normalized) || normalized.replace(/\s+/g, '') === 'customerno';
  });

/** Branch columns are every non-empty header except No / CUSTOMER NO. */
export const extractBranchColumns = (columns = []) => {
  const customerNoIndex = findCustomerNoColumnIndex(columns);

  return columns
    .map((header, index) => ({ header: String(header ?? '').trim(), index }))
    .filter(({ header, index }) => {
      if (!header) return false;
      if (index === customerNoIndex) return false;
      return !SKIP_HEADERS.has(normalizeHeader(header));
    })
    .map(({ header, index }) => ({ branchName: header, index }));
};

/**
 * Parse uploaded sheet into customer opening-balance bulk rows.
 * Expects CUSTOMER NO plus dynamic branch-name columns.
 */
export const parseBulkOpeningBalanceFile = ({ columns = [], data = [] } = {}) => {
  const customerNoIndex = findCustomerNoColumnIndex(columns);
  if (customerNoIndex < 0) {
    throw new Error('Could not find a "CUSTOMER NO" or "VENDOR NO" column in the uploaded file.');
  }

  const branchColumns = extractBranchColumns(columns);
  if (!branchColumns.length) {
    throw new Error('Could not find branch columns. Add branch names as column headers with opening balance values.');
  }

  const customerOpeningBalance = [];

  data.forEach((row, rowIndex) => {
    if (!Array.isArray(row) || row.every(cell => cell === null || cell === undefined || String(cell).trim() === '')) {
      return;
    }

    const customerNumber = String(row[customerNoIndex] ?? '').trim();
    if (!customerNumber || SKIP_HEADERS.has(normalizeHeader(customerNumber))) return;

    const branch = branchColumns
      .map(({ branchName, index }) => {
        const cell = row[index];
        if (cell === null || cell === undefined || String(cell).trim() === '') return null;
        return { branchName, openingBalance: toNumber(cell) };
      })
      .filter(Boolean);

    if (!branch.length) return;

    customerOpeningBalance.push({
      customerNumber,
      branch,
      rowNumber: rowIndex + 1,
    });
  });

  if (!customerOpeningBalance.length) {
    throw new Error('No opening balance rows found. Ensure CUSTOMER NO and branch columns have data.');
  }

  return {
    branchNames: branchColumns.map(entry => entry.branchName),
    customerOpeningBalance,
  };
};

export const flattenOpeningBalanceRecordForPreview = (record, branchNames = []) => {
  const flat = {
    customerNumber: record?.customerNumber,
    rowNumber: record?.rowNumber,
  };

  const branches = record?.branch || [];
  const names = branchNames.length ? branchNames : branches.map(b => b.branchName);

  names.forEach(name => {
    const match = branches.find(b => b.branchName === name);
    flat[name] = match?.openingBalance ?? '';
  });

  return flat;
};

export const buildOpeningBalancePreviewColumns = (branchNames = [], { isVendorPage = false } = {}) => [
  { title: 'S.No.', dataIndex: 'rowNumber', key: 'rowNumber', width: 70, fixed: 'left', render: (_, __, index) => index + 1 },
  { title: isVendorPage ? 'VENDOR NO' : 'CUSTOMER NO', dataIndex: 'customerNumber', key: 'customerNumber', fixed: 'left' },
  ...branchNames.map(name => ({ title: name, dataIndex: name, key: name })),
];

export const getBulkOpeningBalanceSampleData = (isVendorPage = false) => {
  const numberKey = isVendorPage ? 'VENDOR NO' : 'CUSTOMER NO';
  const prefix = isVendorPage ? 'VEN' : 'CUS';

  return [
    {
      No: 1,
      [numberKey]: `${prefix}-00001`,
      'Nikol Branch': 100000,
      'Odhav Branch': 100000,
    },
    {
      No: 2,
      [numberKey]: `${prefix}-00002`,
      'Nikol Branch': 100000,
      'Odhav Branch': 100000,
    },
  ];
};

const getSampleFileConfig = isVendorPage => {
  const prefix = isVendorPage ? 'Vendor' : 'Customer';
  return {
    csv: { fileName: `${prefix}_Opening_Balance_Sample.csv`, bookType: 'csv' },
    xlsx: { fileName: `${prefix}_Opening_Balance_Sample.xlsx`, bookType: 'xlsx' },
    xls: { fileName: `${prefix}_Opening_Balance_Sample.xls`, bookType: 'xls' },
  };
};

export const downloadBulkOpeningBalanceSampleFile = async (format, { isVendorPage = false } = {}) => {
  const XLSX = await import('xlsx');
  const config = getSampleFileConfig(isVendorPage)[format] || getSampleFileConfig(isVendorPage).csv;
  const worksheet = XLSX.utils.json_to_sheet(getBulkOpeningBalanceSampleData(isVendorPage));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Opening Balance');
  XLSX.writeFile(workbook, config.fileName, { bookType: config.bookType });
};
