import { resolveUnitRefId } from '@/utils/itemLineUnit';

const stockOrNull = stock => (stock === undefined || stock === null || stock === '' ? null : stock);

const findConvertedStock = (rows, itemUnitId, unitName) => {
  const selectedId = resolveUnitRefId(itemUnitId);
  const converted = (rows || []).find(row => {
    const rowId = resolveUnitRefId(row?.itemUnitId);
    if (selectedId && rowId && String(rowId) === String(selectedId)) return true;
    return !!(unitName && row?.unitName && row.unitName === unitName);
  });
  return stockOrNull(converted?.availableStock);
};

/** Selected unit matches the raw material base unit, or no unit has been chosen yet. */
export const isRawMaterialBaseUnit = (rawMaterial, itemUnitId) => {
  const baseId = resolveUnitRefId(rawMaterial?.itemUnitId);
  const selectedId = resolveUnitRefId(itemUnitId);
  return !selectedId || !baseId || String(baseId) === String(selectedId);
};

/** Item total from `inventoryData`: `totalAvailableStock`, or `inventoryData.convertedStockDetails`. */
export const resolveRawMaterialTotalStock = (rawMaterial, itemUnitId, unitName) => {
  const inventory = rawMaterial?.inventoryData;
  if (!inventory) return null;
  if (isRawMaterialBaseUnit(rawMaterial, itemUnitId)) return stockOrNull(inventory.totalAvailableStock);
  return findConvertedStock(inventory.convertedStockDetails, itemUnitId, unitName);
};

/** One warehouse row: `availableStock`, or that warehouse's `convertedStockDetails`. */
export const resolveRawMaterialWarehouseStock = (rawMaterial, warehouse, itemUnitId, unitName) => {
  if (isRawMaterialBaseUnit(rawMaterial, itemUnitId)) return warehouse?.availableStock ?? 0;
  return findConvertedStock(warehouse?.convertedStockDetails, itemUnitId, unitName);
};
