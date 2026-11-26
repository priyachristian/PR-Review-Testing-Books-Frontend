import { parseGstImportValue } from '@/utils/gstDisplay';
import { BULK_ITEM_VERIFY_ERROR } from '@/utils/constants';

export const isItemGroupMissingError = error => error?.name === BULK_ITEM_VERIFY_ERROR.ITEM_GROUP_NOT_FOUND;
export const isSubItemGroupMissingError = error => error?.name === BULK_ITEM_VERIFY_ERROR.SUB_ITEM_GROUP_NOT_FOUND;
export const isItemUnitMissingError = error => error?.name === BULK_ITEM_VERIFY_ERROR.ITEM_UNIT_NOT_FOUND;

/** Account fields that can be fixed inline on the bulk verify step (same account dropdowns as Add Item). */
export const BULK_ITEM_ACCOUNT_FIX_CONFIG = [
  {
    errorName: BULK_ITEM_VERIFY_ERROR.SALES_ACCOUNT_NOT_FOUND,
    key: 'sales',
    label: 'Sales Account',
    placeholder: 'Select sales account',
    accountDropType: 'SALES',
    getValue: record => record.salesInformation?.salesAccountName,
    apply: (record, accountName) => ({
      ...record,
      salesInformation: {
        ...record.salesInformation,
        salesAccountName: accountName,
      },
    }),
  },
  {
    errorName: BULK_ITEM_VERIFY_ERROR.PURCHASE_ACCOUNT_NOT_FOUND,
    key: 'purchase',
    label: 'Purchase Account',
    placeholder: 'Select purchase account',
    accountDropType: 'PURCHASE',
    getValue: record => record.purchaseInformation?.purchaseAccountName,
    apply: (record, accountName) => ({
      ...record,
      purchaseInformation: {
        ...record.purchaseInformation,
        purchaseAccountName: accountName,
      },
    }),
  },
  {
    errorName: BULK_ITEM_VERIFY_ERROR.INVENTORY_ACCOUNT_NOT_FOUND,
    key: 'inventory',
    label: 'Inventory Account',
    placeholder: 'Select inventory account',
    accountDropType: 'INVENTORY',
    getValue: record => record.inventoryAccountName,
    apply: (record, accountName) => ({
      ...record,
      inventoryAccountName: accountName,
    }),
  },
];

export const isAccountMissingError = error => BULK_ITEM_ACCOUNT_FIX_CONFIG.some(config => config.errorName === error?.name);

export const getAccountFixConfigsForErrors = (errors = []) => BULK_ITEM_ACCOUNT_FIX_CONFIG.filter(config => errors.some(error => error?.name === config.errorName));

export const isVerifyErrorResolved = (record, errorName) => (record?.resolvedErrorNames || []).includes(errorName);

export const getUnresolvedVerifyErrors = (record = {}) => {
  const resolvedErrorNames = new Set(record.resolvedErrorNames || []);
  return (record.errors || []).filter(error => !resolvedErrorNames.has(error?.name));
};

export const withResolvedVerifyError = (record, errorName) => ({
  ...record,
  resolvedErrorNames: [...new Set([...(record.resolvedErrorNames || []), errorName])],
});

export const applyItemGroupFix = (record, groupName) => withResolvedVerifyError({ ...record, itemGroup: groupName }, BULK_ITEM_VERIFY_ERROR.ITEM_GROUP_NOT_FOUND);

export const applySubItemGroupFix = (record, groupName) => withResolvedVerifyError({ ...record, subItemGroup: groupName }, BULK_ITEM_VERIFY_ERROR.SUB_ITEM_GROUP_NOT_FOUND);

export const applyItemUnitFix = (record, unitName) => withResolvedVerifyError({ ...record, itemUnit: unitName }, BULK_ITEM_VERIFY_ERROR.ITEM_UNIT_NOT_FOUND);

export const applyAccountFix = (record, errorName, accountName) => {
  const accountConfig = BULK_ITEM_ACCOUNT_FIX_CONFIG.find(config => config.errorName === errorName);
  if (!accountConfig) return record;
  return withResolvedVerifyError(accountConfig.apply(record, accountName), errorName);
};

export const getResolvedSelectValue = (record, errorName, value) => (isVerifyErrorResolved(record, errorName) ? value : undefined);

/** Valid records for preview/import, without removing assign dropdowns on Step 3. */
export const getEffectiveVerifyRecords = verifyRecord => {
  if (!verifyRecord) {
    return {
      totalRecords: 0,
      validRecords: [],
      invalidRecords: [],
      validRecordsCount: 0,
      invalidRecordsCount: 0,
    };
  }

  const resolvedRecords = [];
  const stillInvalidRecords = [];

  (verifyRecord.invalidRecords ?? []).forEach(record => {
    const unresolvedErrors = getUnresolvedVerifyErrors(record);
    if (unresolvedErrors.length === 0) {
      const validRecord = { ...record };
      delete validRecord.errors;
      delete validRecord.resolvedErrorNames;
      resolvedRecords.push(validRecord);
    } else {
      stillInvalidRecords.push({ ...record, errors: unresolvedErrors });
    }
  });

  const validRecords = [...(verifyRecord.validRecords ?? []), ...resolvedRecords];

  return {
    ...verifyRecord,
    validRecords,
    invalidRecords: stillInvalidRecords,
    validRecordsCount: validRecords.length,
    invalidRecordsCount: stillInvalidRecords.length,
  };
};

export const formatVerifyErrors = (errors = []) =>
  errors
    .map(error => (typeof error === 'string' ? error : error?.message))
    .filter(Boolean)
    .join(', ');

export const parseBooleanImportValue = value => {
  if (typeof value === 'boolean') return value;
  if (value == null || String(value).trim() === '') return false;

  const normalized = String(value).trim().toLowerCase();
  return ['yes', 'true', '1', 'y'].includes(normalized);
};

/** Builds bulk verify/create payload from mapped row data. */
export const buildBulkItemImportPayload = item => {
  return {
    description: item.description,
    itemName: item.itemName,
    itemType: item.itemType,
    itemModelNo: item.itemModelNo,
    itemUnit: item.itemUnit,
    itemGroup: item.itemGroup,
    subItemGroup: item.subItemGroup,
    itemStatus: true,
    itemCategory: {
      isGoods: parseBooleanImportValue(item.isGoods),
      isService: parseBooleanImportValue(item.isService),
    },
    trackInventory: parseBooleanImportValue(item.trackInventory),
    gst: parseGstImportValue(item.gst),
    hsnCode: item.hsnCode,
    salesInformation: {
      isSellable: parseBooleanImportValue(item.isSellable),
      sellingPrice: item.sellingPrice,
      salesAccountName: item.salesAccount,
    },
    purchaseInformation: {
      isPurchasable: parseBooleanImportValue(item.isPurchasable),
      costPrice: item.costPrice,
      purchaseAccountName: item.purchaseAccount,
    },
    inventoryAccountName: item.inventoryAccount,
  };
};

/** Flattens API verify/bulk item shape for import preview table columns. */
export const flattenVerifyRecordForPreview = record => ({
  itemName: record.itemName,
  itemType: record.itemType,
  itemModelNo: record.itemModelNo,
  itemGroup: record.itemGroup,
  subItemGroup: record.subItemGroup,
  itemUnit: record.itemUnitId?.name || record.itemUnit || '',
  description: record.description,
  isSellable: record.salesInformation?.isSellable ? 'Yes' : 'No',
  sellingPrice: record.salesInformation?.sellingPrice,
  salesAccount: record.salesInformation?.salesAccountName,
  isPurchasable: record.purchaseInformation?.isPurchasable ? 'Yes' : 'No',
  costPrice: record.purchaseInformation?.costPrice,
  purchaseAccount: record.purchaseInformation?.purchaseAccountName,
  inventoryAccount: record.inventoryAccountName,
  isGoods: record.itemCategory?.isGoods ? 'Yes' : 'No',
  isService: record.itemCategory?.isService ? 'Yes' : 'No',
  hsnCode: record.hsnCode,
  gst: record.gst,
  trackInventory: record.trackInventory ? 'Yes' : 'No',
});
