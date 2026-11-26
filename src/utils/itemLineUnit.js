import { MODULE_TYPE } from '@/utils/constants';

export const resolveUnitRefId = unit => {
  if (!unit) return null;
  if (typeof unit === 'string') return unit;
  return unit._id || unit.id || null;
};

export const getItemUnitName = item => item?.itemUnitId?.name || item?.itemUnit || item?.itemId?.itemUnitId?.name || item?.itemId?.itemUnit || '';

/** Quantity with its unit, e.g. 100 PCS. `source` is a unit name or a record with `itemUnitId` / `itemUnit`. */
export const formatQtyWithUnit = (qty, source) => {
  if (qty == null || qty === '') return '';
  const unit = typeof source === 'string' ? source : getItemUnitName(source);
  if (!unit) return qty;
  return (
    <span className="inline-flex items-baseline gap-1">
      <span>{qty}</span>
      <span>{unit}</span>
    </span>
  );
};

/** Base item unit first, then each entry in `unitConversions`. */
export const buildItemLineUnitOptions = master => {
  if (!master) return [];

  const options = [];
  const push = option => {
    if (!option?.value) return;
    if (options.some(existing => String(existing.value) === String(option.value))) return;
    options.push(option);
  };

  const baseId = resolveUnitRefId(master.itemUnitId);
  const baseName = master.itemUnitId?.name || master.itemUnit || '';
  push({
    value: baseId || baseName,
    label: baseName || baseId,
    itemUnitId: baseId || null,
    salesPrice: master.salesInformation?.sellingPrice,
    purchasePrice: master.purchaseInformation?.costPrice,
    isBase: true,
  });

  (master.unitConversions || []).forEach(row => {
    const id = resolveUnitRefId(row?.itemUnitId);
    const name = row?.itemUnitId?.name || '';
    push({
      value: id || name,
      label: name || id,
      itemUnitId: id || null,
      salesPrice: row?.salesPrice,
      purchasePrice: row?.purchasePrice,
      isBase: false,
    });
  });

  return options;
};

export const resolveLineUnitSelection = (line, master) => {
  const options = buildItemLineUnitOptions(master);
  const lineUnitId = resolveUnitRefId(line?.itemUnitId);
  const lineUnitName = getItemUnitName(line);

  if (!options.length) {
    const fallback =
      lineUnitName || lineUnitId
        ? [
            {
              value: lineUnitId || lineUnitName,
              label: lineUnitName || String(lineUnitId),
              itemUnitId: lineUnitId || null,
              isBase: true,
            },
          ]
        : [];
    return {
      itemUnitId: lineUnitId || null,
      itemUnit: lineUnitName,
      option: fallback[0] || null,
      options: fallback,
    };
  }

  const matchedByLine =
    options.find(option => lineUnitId && (String(option.itemUnitId || '') === String(lineUnitId) || String(option.value) === String(lineUnitId))) ||
    options.find(option => lineUnitName && option.label === lineUnitName);
  const matched = matchedByLine || options.find(option => option.isBase) || options[0];

  return {
    itemUnitId: matched?.itemUnitId || (matchedByLine ? lineUnitId : null) || null,
    itemUnit: matched?.label || '',
    option: matched || null,
    options,
  };
};

/**
 * Unit preselected when an item is added to a document.
 * Sales uses `stockOutUnit`, purchase uses `stockInUnit`.
 * A missing unit, or one the item does not have, stays on the base unit.
 */
export const defaultDocumentLineUnit = (master, moduleType) => {
  const preferredSource = moduleType === MODULE_TYPE.PURCHASE ? master?.stockInUnit : moduleType === MODULE_TYPE.SALES ? master?.stockOutUnit : null;
  const preferredId = resolveUnitRefId(preferredSource);
  if (preferredId) {
    const selection = resolveLineUnitSelection({ itemUnitId: preferredId }, master);
    if (selection.option && String(selection.itemUnitId || '') === String(preferredId)) return selection;
  }
  return resolveLineUnitSelection({}, master);
};

const stockOrNull = stock => (stock === undefined || stock === null || stock === '' ? null : stock);

/**
 * Item-dropdown stock for a document line.
 * Base unit uses `availableStock`. A conversion unit uses the matching `convertedStockDetails` row.
 */
export const resolveLineAvailableStock = (master, unitSelection) => {
  if (!master || master.itemCategory?.isService === true) return null;

  const option = unitSelection?.option;
  if (!option || option.isBase) return stockOrNull(master.availableStock);

  const unitId = option.itemUnitId;
  const converted = (master.convertedStockDetails || []).find(row => {
    const rowId = resolveUnitRefId(row?.itemUnitId);
    if (unitId && rowId && String(rowId) === String(unitId)) return true;
    return !!(option.label && row?.unitName && row.unitName === option.label);
  });
  return stockOrNull(converted?.availableStock);
};

/**
 * Base-unit quantity expressed in the line's selected unit.
 * `1 conversion unit = baseQty base units`, so the selected quantity is `baseStock * qty / baseQty`.
 * A base-unit line returns `baseStock` unchanged.
 */
export const stockQuantityForUnit = (baseStock, master, line) => {
  const base = Number(baseStock);
  const safeBase = Number.isFinite(base) ? base : 0;
  const selection = resolveLineUnitSelection(line || {}, master);
  if (!selection.option || selection.option.isBase) return safeBase;

  const unitId = selection.itemUnitId || selection.option.itemUnitId;
  const conversion = (master?.unitConversions || []).find(row => {
    const rowId = resolveUnitRefId(row?.itemUnitId);
    return unitId && rowId && String(rowId) === String(unitId);
  });
  const baseQty = Number(conversion?.baseQty);
  if (baseQty > 0) {
    const qty = Number(conversion?.qty);
    return (safeBase * (qty > 0 ? qty : 1)) / baseQty;
  }

  const converted = resolveLineAvailableStock(master, selection);
  return converted == null ? safeBase : Number(converted);
};

const hasNetPrice = value => value != null && value !== '';

/**
 * Price-list net price for the selected unit.
 * `unitPrices` is matched by item unit. A single legacy `netPrice` applies to the base unit.
 */
export const priceListNetPriceForUnit = (priceListLine, { itemUnitId, isBase = false } = {}) => {
  if (!priceListLine) return null;

  const unitPrices = Array.isArray(priceListLine.unitPrices) ? priceListLine.unitPrices : [];
  if (unitPrices.length) {
    if (!itemUnitId) return null;
    const match = unitPrices.find(row => String(resolveUnitRefId(row?.itemUnitId) || '') === String(itemUnitId));
    return hasNetPrice(match?.netPrice) ? match.netPrice : null;
  }

  if (isBase && hasNetPrice(priceListLine.netPrice)) return priceListLine.netPrice;
  return null;
};

/** Uses the price-list price for the selected unit when one exists. Otherwise the unit sales or purchase price. */
export const rateForItemLineUnit = (option, { moduleType, priceListNetPrice, priceListLine } = {}) => {
  if (!option) return '0';
  const listPrice = hasNetPrice(priceListNetPrice) ? priceListNetPrice : priceListNetPriceForUnit(priceListLine, { itemUnitId: option.itemUnitId, isBase: option.isBase });
  if (hasNetPrice(listPrice)) return String(listPrice);
  const price = moduleType === MODULE_TYPE.PURCHASE ? option.purchasePrice : option.salesPrice;
  return String(price || 0);
};
