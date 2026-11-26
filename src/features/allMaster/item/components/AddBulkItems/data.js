export const BULK_ITEM_ACCEPTED_EXTENSIONS = ['.csv', '.xlsx', '.xls'];
export const BULK_ITEM_ACCEPT_LABEL = 'CSV, XLSX, and XLS';
export const BULK_ITEM_MAX_FILE_SIZE = 2 * 1024 * 1024;

const ITEM_ROLE_TOOLTIP = 'Every item row needs at least one of Is Sellable, Is Purchasable, or Track Inventory set to Yes.';

export const itemMappingFields = [
  { id: 'itemName', label: 'Item Name', required: true },
  { id: 'itemType', label: 'Item Type', required: true },
  { id: 'itemModelNo', label: 'Item Model No', required: true },
  { id: 'itemGroup', label: 'Item Group', required: true },
  { id: 'subItemGroup', label: 'Sub Item Group' },
  { id: 'itemUnit', label: 'Item Unit', required: true },
  { id: 'description', label: 'Description', required: true },
  { id: 'isGoods', label: 'Is Goods', aliases: ['Category Is Goods'] },
  { id: 'isService', label: 'Is Service', aliases: ['Category Is Service'] },
  { id: 'isSellable', label: 'Is Sellable', tooltip: ITEM_ROLE_TOOLTIP },
  { id: 'sellingPrice', label: 'Selling Price', tooltip: 'Required when Is Sellable is Yes.', requiredWhen: 'isSellable' },
  { id: 'salesAccount', label: 'Sales Account', tooltip: 'Required when Is Sellable is Yes.', requiredWhen: 'isSellable' },
  { id: 'isPurchasable', label: 'Is Purchasable', tooltip: ITEM_ROLE_TOOLTIP },
  { id: 'costPrice', label: 'Cost Price', tooltip: 'Required when Is Purchasable is Yes.', requiredWhen: 'isPurchasable' },
  { id: 'purchaseAccount', label: 'Purchase Account', tooltip: 'Required when Is Purchasable is Yes.', requiredWhen: 'isPurchasable' },
  { id: 'trackInventory', label: 'Track Inventory', tooltip: ITEM_ROLE_TOOLTIP },
  { id: 'inventoryAccount', label: 'Inventory Account', tooltip: 'Required when Track Inventory is Yes.', requiredWhen: 'trackInventory' },
  { id: 'hsnCode', label: 'HSN Code', required: true },
  { id: 'gst', label: 'GST', required: true, aliases: ['Item GST Tax'] },
];

export const ITEM_ROLE_FIELD_IDS = ['isSellable', 'isPurchasable', 'trackInventory'];

const hasMappedColumn = (mapping, fieldId) => Boolean(mapping?.[fieldId]);

/** Which mapping fields are required for the current column mapping (mirrors item.schema role rules). */
export const getRequiredBulkItemMappingIds = (mapping = {}) => {
  const required = new Set(itemMappingFields.filter(field => field.required).map(field => field.id));

  itemMappingFields.forEach(field => {
    if (field.requiredWhen && hasMappedColumn(mapping, field.requiredWhen)) {
      required.add(field.id);
    }
  });

  return required;
};

/** Validate Step 2 field mapping before row-level Yup checks. */
export const validateBulkItemMapping = (mapping = {}) => {
  const errors = {};
  const requiredIds = getRequiredBulkItemMappingIds(mapping);

  itemMappingFields.forEach(field => {
    if (requiredIds.has(field.id) && !hasMappedColumn(mapping, field.id)) {
      if (field.requiredWhen) {
        const parent = itemMappingFields.find(item => item.id === field.requiredWhen);
        errors[field.id] = `${field.label} is required when ${parent?.label || field.requiredWhen} is mapped`;
      } else {
        errors[field.id] = `${field.label} is required`;
      }
    }
  });

  const hasRoleMapped = ITEM_ROLE_FIELD_IDS.some(fieldId => hasMappedColumn(mapping, fieldId));
  if (!hasRoleMapped) {
    const message = 'Map at least one of Is Sellable, Is Purchasable, or Track Inventory';
    ITEM_ROLE_FIELD_IDS.forEach(fieldId => {
      errors[fieldId] = message;
    });
  }

  return errors;
};

// id is the React key; dataIndex (when the verify API's raw record shape is nested) tells the
// table where to actually read the value from.
export const itemVerifyDisplayFields = [
  { id: 'itemName', label: 'Item Name' },
  { id: 'itemType', label: 'Item Type' },
  { id: 'itemModelNo', label: 'Item Model No' },
  { id: 'itemGroup', label: 'Item Group' },
  { id: 'subItemGroup', label: 'Sub Item Group' },
  { id: 'itemUnit', label: 'Item Unit' },
  { id: 'salesAccount', label: 'Sales Account', dataIndex: ['salesInformation', 'salesAccountName'] },
  { id: 'purchaseAccount', label: 'Purchase Account', dataIndex: ['purchaseInformation', 'purchaseAccountName'] },
  { id: 'inventoryAccount', label: 'Inventory Account', dataIndex: 'inventoryAccountName' },
  { id: 'gst', label: 'GST' },
  { id: 'hsnCode', label: 'HSN Code' },
];

export const bulkItemSampleData = [
  {
    'Item Name': 'Cold Rolled Steel Sheet 2mm',
    'Item Type': 'RM',
    'Item Model No': 'CRS-2MM-1220',
    'Item Group': 'Raw Materials',
    'Sub Item Group': 'Steel Sheets',
    'Item Unit': 'KGS',
    Description: '2mm thickness cold rolled steel sheet for fabrication and stamping',
    'Is Goods': true,
    'Is Service': false,
    'Is Sellable': true,
    'Selling Price': 5200,
    'Sales Account': 'Sales',
    'Is Purchasable': true,
    'Cost Price': 4100,
    'Purchase Account': 'Cost of Goods Sold',
    'Track Inventory': true,
    'Inventory Account': 'Inventory Asset',
    'HSN Code': '72085100',
    GST: '18',
  },
  {
    'Item Name': 'Precision Gearbox Unit 50:1',
    'Item Type': 'FG',
    'Item Model No': 'PGB-50-2024',
    'Item Group': 'Finished Goods',
    'Sub Item Group': 'Gearboxes',
    'Item Unit': 'NOS',
    Description: 'Industrial gearbox assembly with 50:1 reduction ratio for conveyor drives',
    'Is Goods': true,
    'Is Service': false,
    'Is Sellable': true,
    'Selling Price': 24500,
    'Sales Account': 'Sales',
    'Is Purchasable': true,
    'Cost Price': 19800,
    'Purchase Account': 'Cost of Goods Sold',
    'Track Inventory': true,
    'Inventory Account': 'Inventory Asset',
    'HSN Code': '84834000',
    GST: '18',
  },
  {
    'Item Name': 'Annual Maintenance Service Plan',
    'Item Type': 'CONSUMABLE',
    'Item Model No': 'SRV-AMC-01',
    'Item Group': 'Services',
    'Sub Item Group': 'Maintenance Services',
    'Item Unit': 'NOS',
    Description: 'Yearly on-site maintenance and calibration support package',
    'Is Goods': false,
    'Is Service': true,
    'Is Sellable': true,
    'Selling Price': 15000,
    'Sales Account': 'Sales',
    'Is Purchasable': false,
    'Cost Price': '',
    'Purchase Account': '',
    'Track Inventory': false,
    'Inventory Account': '',
    'HSN Code': '998719',
    GST: '0',
  },
  {
    'Item Name': 'Exempted Item',
    'Item Type': 'FG',
    'Item Model No': 'PGB-67-2025',
    'Item Group': 'Finished Goods',
    'Sub Item Group': 'Conveyor Components',
    'Item Unit': 'NOS',
    Description: 'Exempted item for conveyor drives',
    'Is Goods': true,
    'Is Service': false,
    'Is Sellable': true,
    'Selling Price': 24500,
    'Sales Account': 'Sales',
    'Is Purchasable': true,
    'Cost Price': 14500,
    'Purchase Account': 'Cost of Goods Sold',
    'Track Inventory': true,
    'Inventory Account': 'Inventory Asset',
    'HSN Code': '84834000',
    GST: 'exempted',
  },
  {
    'Item Name': 'Nil Rated Item',
    'Item Type': 'CONSUMABLE',
    'Item Model No': 'SRV-AMC-02',
    'Item Group': 'Services',
    'Sub Item Group': 'Support Services',
    'Item Unit': 'NOS',
    Description: 'Nil rated item for conveyor drives',
    'Is Goods': false,
    'Is Service': true,
    'Is Sellable': true,
    'Selling Price': 13400,
    'Sales Account': 'Sales',
    'Is Purchasable': false,
    'Cost Price': '',
    'Purchase Account': '',
    'Track Inventory': false,
    'Inventory Account': '',
    'HSN Code': '998719',
    GST: 'none',
  },
];

const SAMPLE_FILE_CONFIG = {
  csv: { fileName: 'Items_Sample.csv', bookType: 'csv' },
  xlsx: { fileName: 'Items_Sample.xlsx', bookType: 'xlsx' },
  xls: { fileName: 'Items_Sample.xls', bookType: 'xls' },
};

export const downloadBulkItemSampleFile = async format => {
  const XLSX = await import('xlsx');
  const config = SAMPLE_FILE_CONFIG[format] || SAMPLE_FILE_CONFIG.csv;
  const worksheet = XLSX.utils.json_to_sheet(bulkItemSampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Items');
  XLSX.writeFile(workbook, config.fileName, { bookType: config.bookType });
};
