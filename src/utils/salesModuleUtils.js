import ConfirmModal from '@/components/feedback/confirmModal/ConfirmModal';
import { getPriceListChangeConfirmModalProps } from '@/components/feedback/confirmModal/priceListChangeConfirmModal';
import { toDecimalString } from '@/utils/currency';
import { confirmModalEnum } from '@/utils/constants';
import { getPriceListItemId } from 'utils/services';
import { getItemUnitName, priceListNetPriceForUnit, resolveLineUnitSelection } from '@/utils/itemLineUnit';

export const EMPTY_SALES_ITEM_ROW = {
  itemId: null,
  itemName: '',
  itemNo: '',
  description: '',
  hsnCode: '',
  itemUnit: '',
  itemUnitId: null,
  gst: '0',
  taxAmount: '0.00',
  quantity: '1.00',
  rate: '0.00',
  amount: '0.00',
};

export const getCustomerPriceListId = customer => customer?.priceList?._id ?? customer?.priceList?.id ?? null;

// True when the customer has an active entry for the branch, the same rule the branch customer dropdown uses.
export const isCustomerActiveInBranch = (customer, branchId) => {
  const branchKey = String(branchId?._id ?? branchId?.id ?? branchId ?? '');
  return (customer?.branch || []).some(entry => entry?.isActive === true && String(entry?.branchId?._id ?? entry?.branchId ?? '') === branchKey);
};

export const isIncludePriceListItemOnly = customer => !!(customer?.includePriceListItemOnly ?? customer?.otherDetails?.includePriceListItemOnly);

export const findItemById = (itemId, allItemDrop = []) => (allItemDrop || []).find(item => String(item._id || item.id) === String(itemId));

export const getDiscountConfigForRecalculate = ({ documentData, changeDiscountConfig, moduleConfig }) =>
  documentData?.appliesTo && !changeDiscountConfig
    ? {
        appliesTo: documentData?.appliesTo,
      }
    : moduleConfig?.discountConfig;

export const resolveSalesItemDropdownParams = ({ warehouseId, customerId, customer, priceListId }) => {
  if (!warehouseId) return null;

  if (!customerId) {
    return { warehouseId };
  }

  const includePriceListItemOnly = isIncludePriceListItemOnly(customer);
  const resolvedPriceListId = priceListId ?? getCustomerPriceListId(customer);

  if (includePriceListItemOnly) {
    return {
      warehouseId,
      customerId,
      ...(resolvedPriceListId && { priceListId: resolvedPriceListId }),
      includePriceListItemOnly: true,
    };
  }

  return { warehouseId };
};

export const isStockCheckedOn = (inventoryConfig, moduleName) => inventoryConfig?.salesFlowStockDeductSource === moduleName || !!inventoryConfig?.salesFlowStockCheckSource?.includes(moduleName);

export const createItemDropdownFetcher = ({ getAllItemDrop, lastFetchedItemDropKeyRef, itemDropAbortControllerRef }) => {
  return ({ warehouseId, customerId, priceListId, includePriceListItemOnly, force = false } = {}) => {
    if (!getAllItemDrop || !warehouseId) return;

    const shouldFilterByPriceList = includePriceListItemOnly && customerId && priceListId;
    const shouldFilterByCustomerOnly = includePriceListItemOnly && customerId && !priceListId;
    const dropKey = shouldFilterByPriceList ? `${warehouseId}|${customerId}|${priceListId}` : shouldFilterByCustomerOnly ? `${warehouseId}|${customerId}|` : `${warehouseId}|`;

    if (!force && lastFetchedItemDropKeyRef.current === dropKey) return;
    lastFetchedItemDropKeyRef.current = dropKey;

    itemDropAbortControllerRef?.current?.abort();
    const controller = new AbortController();
    if (itemDropAbortControllerRef) {
      itemDropAbortControllerRef.current = controller;
    }

    getAllItemDrop({
      warehouseId,
      signal: controller.signal,
      ...(includePriceListItemOnly && customerId && { customerId, ...(priceListId && { priceListId }) }),
    });
  };
};

export const applyDefaultItemRatesByPriceList = ({ items = [], priceListExists, allItemDrop = [], type = 'default' }) =>
  items.map(itm => {
    const itemExistsInPriceList = priceListExists?.priceList?.items?.find(item => String(getPriceListItemId(item) || '') === String(itm?.itemId || '')) || {};
    const selectedItem = findItemById(itm?.itemId, allItemDrop);
    const unit = resolveLineUnitSelection(itm, selectedItem);
    const onBaseUnit = unit.option?.isBase !== false;
    let rateSource = onBaseUnit ? selectedItem?.salesInformation?.sellingPrice || 0 : unit.option?.salesPrice || 0;
    if (type === 'applied') {
      const listPrice = priceListNetPriceForUnit(itemExistsInPriceList, {
        itemUnitId: unit.itemUnitId,
        isBase: onBaseUnit,
      });
      if (listPrice != null && listPrice !== '') rateSource = listPrice;
    }

    return {
      ...itm,
      rate: toDecimalString(parseFloat(rateSource || 0)),
      itemName: selectedItem?.itemName || '',
      itemNo: selectedItem?.itemNo || '',
      hsnCode: selectedItem?.hsnCode || '',
      itemUnit: unit.itemUnit || getItemUnitName(itm),
      itemUnitId: unit.itemUnitId || null,
      gst: selectedItem?.gst || '0',
    };
  });

export const buildLegacyCustomerPriceListConfirmState = ({ values, nextCustomerId, customerDropDownList, newCustomerPriceListId, confirmModalEnum }) => {
  let title = confirmModalEnum?.PRICE_LIST_NOT_AVAILABLE?.TITLE;
  let okText = confirmModalEnum?.PRICE_LIST_NOT_AVAILABLE?.OK_TEXT;
  let cancelText = confirmModalEnum?.CANCEL_TEXT;
  let type = 'default';

  const priceListExists = customerDropDownList?.find(cust => cust.id === nextCustomerId) || {};

  if (!values?.customerId) {
    return { title, okText, cancelText, type, priceListExists };
  }

  if (priceListExists?.priceList?.items?.length > 0 || newCustomerPriceListId !== values?.priceList) {
    title = confirmModalEnum?.PRICE_LIST_AVAILABLE?.TITLE;
    okText = confirmModalEnum?.PRICE_LIST_AVAILABLE?.OK_TEXT;
    type = 'applied';
  }

  return { title, okText, cancelText, type, priceListExists };
};

export const resetSalesItemsForPriceList = ({ values, setFieldValue, priceListId, setItemDropPriceListId, calculateAmounts, discountConfig }) => {
  const resetItems = [{ ...EMPTY_SALES_ITEM_ROW }];
  setFieldValue('priceList', priceListId || undefined);
  setFieldValue('items', resetItems);
  setItemDropPriceListId(priceListId || null);
  calculateAmounts({ ...values, items: resetItems, priceList: priceListId }, setFieldValue, discountConfig);
};

// Fields calculatePriceListChange overwrites when a price list is applied to existing rows.
const PRICE_LIST_APPLIED_ITEM_FIELDS = ['rate', 'itemName', 'itemNo', 'hsnCode', 'gst'];

// Rows match by position (converted tables are locked) and are restored only when the item is unchanged.
export const restoreConvertedItemRates = (currentItems = [], sourceItems = []) =>
  (currentItems || []).map((item, index) => {
    const sourceItem = sourceItems?.[index];
    if (!sourceItem || String(sourceItem?.itemId || '') !== String(item?.itemId || '')) return item;

    const restored = { ...item };
    PRICE_LIST_APPLIED_ITEM_FIELDS.forEach(field => {
      restored[field] = sourceItem[field];
    });
    return restored;
  });

// Restores source rates, sets or clears the price list, and recalculates totals.
export const revertConvertedItemsToSource = ({ values, setFieldValue, sourceItems, priceListId, setItemDropPriceListId, calculateAmounts, discountConfig }) => {
  const restoredItems = restoreConvertedItemRates(values?.items, sourceItems);
  setFieldValue('items', restoredItems);
  setFieldValue('priceList', priceListId || undefined);
  setItemDropPriceListId(priceListId || null);
  calculateAmounts({ ...values, items: restoredItems, priceList: priceListId }, setFieldValue, discountConfig);
};

export const showPriceListResetConfirm = ({ message, onOk, onCancel } = {}) => {
  const modal = ConfirmModal({
    ...getPriceListChangeConfirmModalProps({ message: message || confirmModalEnum?.PRICE_LIST_RESET_ITEMS?.TITLE }),
    okText: confirmModalEnum?.PRICE_LIST_RESET_ITEMS?.OK_TEXT,
    cancelText: confirmModalEnum?.PRICE_LIST_RESET_ITEMS?.CANCEL_TEXT,
    onOk,
    onCancel,
  });
  modal.showModal();
};
