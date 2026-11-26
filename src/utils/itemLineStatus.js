import { toDecimalString } from '@/utils/currency';
import { resolveLineAvailableStock, resolveLineUnitSelection } from '@/utils/itemLineUnit';

// Client-side item line selectability — the UI companion to the backend documentItemEnricher.
//
// The detail/edit API returns a per-line `itemIssue` (computed from the Item master). On the live
// form we additionally detect "not selectable in the selected warehouse" by checking whether a
// line's item is present in the current active-for-warehouse dropdown. Together these drive:
//   - an inline warning row under each affected item (informative, shown for every bad line), and
//   - a submit guard that blocks only NEWLY added items (carried lines are tolerated, mirroring the
//     backend's assertSelectableForNewLines vs assertResolvable).

// Mirrors the backend ITEM_LINE_ISSUE codes.
export const ITEM_LINE_ISSUE = {
  INACTIVE: 'ITEM_INACTIVE',
  NOT_IN_WAREHOUSE: 'ITEM_NOT_IN_WAREHOUSE',
  MISSING: 'ITEM_MISSING',
};

const BACKEND_ISSUE_MESSAGE = {
  [ITEM_LINE_ISSUE.INACTIVE]: 'This item is inactive and cannot be added to new documents.',
  [ITEM_LINE_ISSUE.NOT_IN_WAREHOUSE]: 'This item is not available in the selected warehouse.',
  [ITEM_LINE_ISSUE.MISSING]: 'This item no longer exists.',
};

const idOf = option => String(option?._id ?? option?.id ?? '');

// Normalize a line's itemId, which may be a string, an ObjectId, or a populated { _id, id } object
// (edit/detail responses populate it). Returns '' when absent.
const lineItemId = line => {
  const raw = line?.itemId;
  if (raw == null || raw === '') return '';
  if (typeof raw === 'object') return String(raw._id ?? raw.id ?? '');
  return String(raw);
};

export const findDropItem = (itemId, itemsDrop) => {
  const id = itemId && typeof itemId === 'object' ? String(itemId._id ?? itemId.id ?? '') : String(itemId ?? '');
  return id ? (itemsDrop || []).find(option => idOf(option) === id) || null : null;
};

// A line is "not selectable in this warehouse" when it references an item that is absent from the
// current active-for-warehouse dropdown. Only meaningful once the dropdown has actually loaded.
export const isLineUnavailableInWarehouse = (item, { itemsDrop, itemsDropReady }) => Boolean(itemsDropReady && lineItemId(item) && !findDropItem(item.itemId, itemsDrop));

// The warning string for a single line (backend issue takes priority), or null.
export const getItemLineWarning = (item, { itemsDrop, itemsDropReady, stockItem } = {}) => {
  if (item?.itemIssue && BACKEND_ISSUE_MESSAGE[item.itemIssue]) return BACKEND_ISSUE_MESSAGE[item.itemIssue];
  if (isLineUnavailableInWarehouse(item, { itemsDrop, itemsDropReady })) {
    return 'This item is inactive or not available in the selected warehouse.';
  }
  const needed = parseFloat(item?.quantity) || 0;
  if (stockItem && stockItem.trackInventory !== false && !stockItem.itemCategory?.isService) {
    const unitSelection = resolveLineUnitSelection(item, stockItem);
    const available = resolveLineAvailableStock(stockItem, unitSelection);
    if (available != null && Number(available) < needed) {
      const unitName = unitSelection.itemUnit;
      const withUnit = value => (unitName ? `${toDecimalString(value)} ${unitName}` : toDecimalString(value));
      return `Only ${withUnit(available)} in stock in the selected warehouse, ${withUnit(needed)} needed.`;
    }
  }
  return null;
};

// Lines (with display label) that should block a save. `originalItemIds` is the set of item ids
// already on the document before this edit — carried lines are tolerated, only newly added ones
// that are unavailable block, matching the backend.
export const getBlockingWarehouseItems = (items, { itemsDrop, itemsDropReady, originalItemIds }) => {
  if (!Array.isArray(items) || !items.length || !itemsDropReady) return [];
  const carried = originalItemIds instanceof Set ? originalItemIds : new Set();
  return items
    .filter(item => {
      const id = lineItemId(item);
      return id && !carried.has(id) && !findDropItem(item.itemId, itemsDrop);
    })
    .map(item => ({ itemId: lineItemId(item), itemName: item.itemName || item.itemNo || 'Item' }));
};

// User-facing block message for a document save, naming the offending item(s).
export const buildWarehouseBlockMessage = (blocked, documentLabel = 'document') => {
  const names = (blocked || [])
    .map(line => line.itemName)
    .filter(Boolean)
    .join(', ');
  const isPlural = (blocked || []).length > 1;
  return isPlural
    ? `${names} are inactive or not available in the selected warehouse, so this ${documentLabel} can't be saved yet. To continue, activate these items from the Item Master and make sure they're available in the selected warehouse. You can then save the document.`
    : `${names} is inactive or not available in the selected warehouse, so this ${documentLabel} can't be saved yet. To continue, activate this item from the Item Master and make sure it's available in the selected warehouse. You can then save the document.`;
};

/**
 * One call for a sales document's save guard. Returns a user-facing error message when a newly
 * added item is inactive / not available in the selected warehouse, or null when the save may
 * proceed. Conversions are skipped (their items come from the source document, not the warehouse
 * dropdown), and items already on the document are tolerated.
 */
export const checkSalesItemsBeforeSave = ({ items, itemsDrop, itemsDropLoading, originalItems, isConverted = false, documentLabel = 'document' }) => {
  if (isConverted) return null;
  const itemsDropReady = !itemsDropLoading && Array.isArray(itemsDrop) && itemsDrop.length > 0;
  if (!itemsDropReady) return null;
  const originalItemIds = new Set((originalItems || []).map(lineItemId).filter(Boolean));
  const blocked = getBlockingWarehouseItems(items, { itemsDrop, itemsDropReady, originalItemIds });
  return blocked.length ? buildWarehouseBlockMessage(blocked, documentLabel) : null;
};
