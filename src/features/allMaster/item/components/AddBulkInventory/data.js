export const BULK_INVENTORY_ACCEPTED_EXTENSIONS = ['.csv', '.xlsx', '.xls'];
export const BULK_INVENTORY_ACCEPT_LABEL = 'CSV, XLSX, and XLS';
export const BULK_INVENTORY_MAX_FILE_SIZE = 2 * 1024 * 1024;

const ITEM_NO_HEADERS = new Set(['item no', 'itemno', 'item_no', 'item number']);
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

/** Detect warehouse columns from headers like "Nikol Warehouse-stock" / "Nikol Warehouse-value". */
export const extractWarehouseColumns = (columns = []) => {
  const warehousesByName = new Map();

  columns.forEach((header, index) => {
    const raw = String(header ?? '').trim();
    if (!raw) return;

    const stockMatch = raw.match(/^(.*)-\s*stock$/i);
    const valueMatch = raw.match(/^(.*)-\s*value$/i);
    const warehouseName = (stockMatch?.[1] || valueMatch?.[1] || '').trim();
    if (!warehouseName) return;

    if (!warehousesByName.has(warehouseName)) {
      warehousesByName.set(warehouseName, { warehouseName, stockIndex: -1, valueIndex: -1 });
    }

    const entry = warehousesByName.get(warehouseName);
    if (stockMatch) entry.stockIndex = index;
    if (valueMatch) entry.valueIndex = index;
  });

  return Array.from(warehousesByName.values()).filter(entry => entry.stockIndex >= 0 || entry.valueIndex >= 0);
};

const findItemNoColumnIndex = (columns = []) =>
  columns.findIndex(header => {
    const normalized = normalizeHeader(header);
    return ITEM_NO_HEADERS.has(normalized) || normalized.replace(/\s+/g, '') === 'itemno';
  });

/**
 * Parse uploaded sheet into opening-balance bulk payload rows.
 * Expects ITEM NO plus dynamic `{Warehouse}-stock` / `{Warehouse}-value` columns.
 */
export const parseBulkInventoryFile = ({ columns = [], data = [] } = {}) => {
  const itemNoIndex = findItemNoColumnIndex(columns);
  if (itemNoIndex < 0) {
    throw new Error('Could not find an "ITEM NO" column in the uploaded file.');
  }

  const warehouseColumns = extractWarehouseColumns(columns);
  if (!warehouseColumns.length) {
    throw new Error('Could not find warehouse columns. Use headers like "Warehouse Name-stock" and "Warehouse Name-value".');
  }

  const itemInventory = [];

  data.forEach((row, rowIndex) => {
    if (!Array.isArray(row) || row.every(cell => cell === null || cell === undefined || String(cell).trim() === '')) {
      return;
    }

    const itemNo = String(row[itemNoIndex] ?? '').trim();
    if (!itemNo || SKIP_HEADERS.has(normalizeHeader(itemNo))) return;

    const warehouses = warehouseColumns
      .map(({ warehouseName, stockIndex, valueIndex }) => {
        const stock = stockIndex >= 0 ? toNumber(row[stockIndex]) : 0;
        const value = valueIndex >= 0 ? toNumber(row[valueIndex]) : 0;
        if (stock === 0 && value === 0) return null;
        return { warehouseName, stock, value };
      })
      .filter(Boolean);

    if (!warehouses.length) return;

    itemInventory.push({
      itemNo,
      warehouses,
      rowNumber: rowIndex + 1,
    });
  });

  if (!itemInventory.length) {
    throw new Error('No inventory rows found. Ensure ITEM NO and warehouse stock/value columns have data.');
  }

  return {
    warehouseNames: warehouseColumns.map(entry => entry.warehouseName),
    itemInventory,
  };
};

/** Flatten nested warehouse data for table preview columns. */
export const flattenInventoryRecordForPreview = (record, warehouseNames = []) => {
  const flat = {
    itemNo: record?.itemNo,
    rowNumber: record?.rowNumber,
  };

  const warehouses = record?.warehouses || [];
  const names = warehouseNames.length ? warehouseNames : warehouses.map(w => w.warehouseName);

  names.forEach(name => {
    const match = warehouses.find(w => w.warehouseName === name);
    flat[`${name}-stock`] = match?.stock ?? '';
    flat[`${name}-value`] = match?.value ?? '';
  });

  return flat;
};

export const buildInventoryPreviewColumns = (warehouseNames = []) => [
  { title: 'S.No.', dataIndex: 'rowNumber', key: 'rowNumber', width: 70, fixed: 'left', render: (_, __, index) => index + 1 },
  { title: 'ITEM NO', dataIndex: 'itemNo', key: 'itemNo', fixed: 'left' },
  ...warehouseNames.flatMap(name => [
    { title: `${name}-stock`, dataIndex: `${name}-stock`, key: `${name}-stock` },
    { title: `${name}-value`, dataIndex: `${name}-value`, key: `${name}-value` },
  ]),
];

export const bulkInventorySampleData = [
  {
    No: 1,
    'ITEM NO': 'ITEM-1',
    'Nikol Warehouse-stock': 40,
    'Nikol Warehouse-value': 10000,
    'Odhav Warehouse-stock': 30,
    'Odhav Warehouse-value': 6000,
  },
  {
    No: 2,
    'ITEM NO': 'ITEM-2',
    'Nikol Warehouse-stock': 100,
    'Nikol Warehouse-value': 23000,
    'Odhav Warehouse-stock': 43,
    'Odhav Warehouse-value': 15000,
  },
];

const SAMPLE_FILE_CONFIG = {
  csv: { fileName: 'Inventory_Sample.csv', bookType: 'csv' },
  xlsx: { fileName: 'Inventory_Sample.xlsx', bookType: 'xlsx' },
  xls: { fileName: 'Inventory_Sample.xls', bookType: 'xls' },
};

export const downloadBulkInventorySampleFile = async format => {
  const XLSX = await import('xlsx');
  const config = SAMPLE_FILE_CONFIG[format] || SAMPLE_FILE_CONFIG.csv;
  const worksheet = XLSX.utils.json_to_sheet(bulkInventorySampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');
  XLSX.writeFile(workbook, config.fileName, { bookType: config.bookType });
};
