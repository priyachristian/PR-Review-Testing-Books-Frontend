import dayjs from 'dayjs';
import { buildItemLineUnitOptions, resolveUnitRefId } from '@/utils/itemLineUnit';
import { SAMPLE_CATALOG_UNIT_HINT } from '@/utils/constants';
import { toApiDate } from '@/utils/util';

export const byLineOrder = (a, b) => (a.lineOrder ?? 0) - (b.lineOrder ?? 0);

export const emptySampleCatalogItem = () => ({ itemId: null, units: [] });

// Sales price configured for the unit on the item master; empty when none is set.
const configuredPrice = option => (Number(option?.salesPrice) > 0 ? Number(option.salesPrice) : '');

// "1 DOZ = 12 NOS" for a conversion unit, so the sample price can be set against the base unit.
const conversionText = (master, option, baseName) => {
  if (option.isBase || !baseName) return '';
  const row = (master?.unitConversions || []).find(conv => String(resolveUnitRefId(conv?.itemUnitId)) === String(option.itemUnitId));
  return row?.qty && row?.baseQty ? SAMPLE_CATALOG_UNIT_HINT.CONVERSION(row.qty, option.label, row.baseQty, baseName) : '';
};

// All units an item can be sold in (base + conversions), merged with any saved catalog values.
export const buildUnitRows = (master, savedUnits = []) => {
  const savedMap = new Map(savedUnits.map((unit, order) => [String(unit.itemUnitId), { ...unit, lineOrder: order }]));
  const options = buildItemLineUnitOptions(master).filter(option => option.itemUnitId);
  const baseName = options.find(option => option.isBase)?.label || '';
  const rows = options.map(option => {
    const saved = savedMap.get(String(option.itemUnitId));
    return {
      itemUnitId: option.itemUnitId,
      unitName: option.label,
      isBase: option.isBase,
      conversion: conversionText(master, option, baseName),
      selected: Boolean(saved) || (!savedUnits.length && option.isBase),
      // Position of the line in the form, so added units stay where the user put them.
      lineOrder: saved ? saved.lineOrder : !savedUnits.length && option.isBase ? 0 : null,
      samplePrice: saved?.samplePrice ?? configuredPrice(option),
      minQty: saved?.minQty ?? '',
      maxQty: saved?.maxQty ?? '',
    };
  });

  // Keep saved units the item master no longer lists, so editing never drops them silently.
  savedUnits.forEach((unit, order) => {
    if (!rows.some(row => String(row.itemUnitId) === String(unit.itemUnitId))) {
      rows.push({ ...unit, unitName: unit.unitName, isBase: false, selected: true, lineOrder: order, maxQty: unit.maxQty ?? '' });
    }
  });
  return rows;
};

export const buildCatalogFormValues = (catalog, findMaster) => ({
  catalogCode: catalog?.catalogCode || '',
  name: catalog?.name || '',
  description: catalog?.description || '',
  startDate: catalog?.startDate ? dayjs(catalog.startDate) : null,
  endDate: catalog?.endDate ? dayjs(catalog.endDate) : null,
  visibility: catalog?.visibility || 'ALL_CUSTOMERS',
  customerIds: (catalog?.customers || []).map(customer => customer.id),
  items: catalog?.items?.length ? catalog.items.map(line => ({ itemId: line.itemId, units: buildUnitRows(findMaster(line.itemId), line.units) })) : [emptySampleCatalogItem()],
});

export const toCatalogPayload = (values, { includeStatus = false, status } = {}) => ({
  name: values.name.trim(),
  description: values.description || '',
  startDate: values.startDate ? toApiDate(values.startDate) : null,
  endDate: values.endDate ? toApiDate(values.endDate) : null,
  visibility: values.visibility,
  customerIds: values.visibility === 'SELECTED_CUSTOMERS' ? values.customerIds : [],
  items: values.items
    .filter(item => item.itemId)
    .map(item => ({
      itemId: item.itemId,
      units: item.units
        .filter(unit => unit.selected)
        .sort(byLineOrder)
        .map(unit => ({
          itemUnitId: unit.itemUnitId,
          samplePrice: Number(unit.samplePrice),
          minQty: Number(unit.minQty),
          maxQty: Number(unit.maxQty),
        })),
    })),
  ...(includeStatus && { status }),
});
