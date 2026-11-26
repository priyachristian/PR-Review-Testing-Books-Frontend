import { toDecimalString } from '@/utils/currency';
import { buildItemLineUnitOptions, resolveUnitRefId } from '@/utils/itemLineUnit';

export const emptyPriceListItem = () => ({
  itemGroup: null,
  itemId: null,
  itemUnitId: null,
  itemUnitName: '',
  netPrice: 0,
  conversions: [],
  savedUnitPrices: null,
  needsUnitHydration: false,
});

const unitNameFromRef = unitPrice => unitPrice?.itemUnitId?.name || unitPrice?.itemUnitName || unitPrice?.itemUnit || '';

const mapPriceListItemToForm = item => {
  const itemGroup = item?.itemGroup?.id || item?.itemGroup?._id || null;
  const itemId = item?.itemId?.id || item?.itemId?._id || null;
  const unitPrices = Array.isArray(item?.unitPrices) ? item.unitPrices : [];
  const base = unitPrices[0];

  return {
    itemGroup,
    itemId,
    itemUnitId: resolveUnitRefId(base?.itemUnitId),
    itemUnitName: unitNameFromRef(base),
    netPrice: base?.netPrice ?? item?.netPrice ?? 0,
    conversions: unitPrices.slice(1).map(unitPrice => ({
      itemUnitId: resolveUnitRefId(unitPrice?.itemUnitId),
      itemUnitName: unitNameFromRef(unitPrice),
      netPrice: unitPrice?.netPrice ?? 0,
    })),
    savedUnitPrices: unitPrices,
    needsUnitHydration: Boolean(itemId),
  };
};

export const itemGroupIdFromMaster = master => resolveUnitRefId(master?.itemGroup);

export const findItemMaster = (itemId, itemGroup, itemsByGroup, allItemDrop) => {
  if (!itemId) return null;
  const pools = [];
  if (itemGroup && itemsByGroup?.[itemGroup]?.length) pools.push(itemsByGroup[itemGroup]);
  if (allItemDrop?.length) pools.push(allItemDrop);
  return pools.flat().find(option => option?._id === itemId || option?.id === itemId) || null;
};

export const unitsFromMaster = master => {
  const options = buildItemLineUnitOptions(master);
  const base = options.find(option => option.isBase) || null;

  return {
    itemUnitId: base?.itemUnitId || null,
    itemUnitName: base?.label || '',
    netPrice: base?.salesPrice ?? 0,
    conversions: options
      .filter(option => !option.isBase && option.itemUnitId)
      .map(option => ({
        itemUnitId: option.itemUnitId,
        itemUnitName: option.label || '',
        netPrice: option.salesPrice ?? 0,
      })),
  };
};

const applySavedUnitPrices = (master, savedUnitPrices, legacyNetPrice) => {
  const units = unitsFromMaster(master);
  const saved = Array.isArray(savedUnitPrices) ? savedUnitPrices : [];
  const nameFor = itemUnitId => {
    if (!itemUnitId) return '';
    if (units.itemUnitId && String(units.itemUnitId) === String(itemUnitId)) return units.itemUnitName;
    return units.conversions.find(conversion => String(conversion.itemUnitId) === String(itemUnitId))?.itemUnitName || '';
  };

  if (!saved.length) {
    return {
      itemUnitId: units.itemUnitId,
      itemUnitName: units.itemUnitName,
      netPrice: legacyNetPrice ?? units.netPrice ?? 0,
      conversions: [],
    };
  }

  const baseId = units.itemUnitId ? String(units.itemUnitId) : null;
  const baseSaved = baseId ? saved.find(unitPrice => String(resolveUnitRefId(unitPrice?.itemUnitId) || '') === baseId) : null;
  const conversions = saved
    .map(unitPrice => {
      const itemUnitId = resolveUnitRefId(unitPrice?.itemUnitId);
      if (!itemUnitId || (baseId && String(itemUnitId) === baseId)) return null;
      return {
        itemUnitId,
        itemUnitName: nameFor(itemUnitId) || unitNameFromRef(unitPrice),
        netPrice: unitPrice?.netPrice ?? 0,
      };
    })
    .filter(Boolean);

  return {
    itemUnitId: units.itemUnitId,
    itemUnitName: units.itemUnitName || unitNameFromRef(baseSaved),
    netPrice: baseSaved?.netPrice ?? legacyNetPrice ?? units.netPrice ?? 0,
    conversions,
  };
};

const hydratePriceListItem = (row, itemsByGroup, allItemDrop) => {
  if (!row?.needsUnitHydration || !row?.itemId) return row;
  const master = findItemMaster(row.itemId, row.itemGroup, itemsByGroup, allItemDrop);
  if (!master) return row;
  return {
    ...row,
    ...applySavedUnitPrices(master, row.savedUnitPrices, row.netPrice),
    savedUnitPrices: null,
    needsUnitHydration: false,
  };
};

export const buildFormItems = (priceListItems, itemsByGroup, allItemDrop) => {
  if (!priceListItems?.length) return [emptyPriceListItem()];
  return priceListItems.map(item => hydratePriceListItem(mapPriceListItemToForm(item), itemsByGroup, allItemDrop));
};

export const patchItemRow = (items, index, patch) => items.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row));

export const toNetPrice = value => parseFloat(toDecimalString(value || 0));

export const baseUnitPrice = item => (Array.isArray(item?.unitPrices) ? item.unitPrices[0] : null);

export const conversionUnitPrices = item => (Array.isArray(item?.unitPrices) ? item.unitPrices.slice(1) : []);
