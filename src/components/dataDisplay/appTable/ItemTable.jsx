import { useMemo, useCallback, useEffect, useState, useRef, Fragment } from 'react';
import { useSelector } from 'react-redux';
import { FieldArray } from 'formik';
import dayjs from 'dayjs';

// Components
import { DatePicker, Select, Spin, Tag } from '@/components/AntDComponent';
import CustomButton from '@/components/ui/button/CustomButton';
import ItemDrawerDetails from '@/features/allMaster/item/components/ItemDrawerDetails';
import LastRateComparison from '@/components/dataDisplay/appTable/LastRateComparison';

// Hooks
import { useCompanyCurrency } from '@/hooks/useCompanyCurrency';
import useLastTransactionRates from '@/components/dataDisplay/appTable/useLastTransactionRates';

// Extras
import { toDecimalString } from '@/utils/currency';
import Icons from 'assets/icons/icon';
import { colorPalette } from '@/utils/theme';
import { MODULE_NAMES, MODULE_TYPE, pageTypes } from '@/utils/constants';
import { formatGstForDisplay, getGstNumericRate } from '@/utils/gstDisplay';
import { calculateSplitAmount, getPriceListItemId } from 'utils/services';
import { defaultDocumentLineUnit, getItemUnitName, rateForItemLineUnit, resolveLineAvailableStock, resolveLineUnitSelection, resolveUnitRefId, stockQuantityForUnit } from '@/utils/itemLineUnit';
import { getItemLineWarning } from '@/utils/itemLineStatus';

/** On edit, refresh stale item metadata from master; rate/qty/amounts stay from document. */
const applyMasterToLineItem = (line, itemsDrop, preserveDocumentTaxRate) => {
  const itemId = line?.itemId;
  if (!itemId || !itemsDrop?.length) return line;

  const master = itemsDrop.find(m => String(m._id || m.id) === String(itemId));
  if (!master) return line;

  const itemName = master.itemName || '';
  const itemNo = master.itemNo || '';
  const hsnCode = master.hsnCode || '';
  const unit = resolveLineUnitSelection(line, master);
  const itemUnit = unit.itemUnit || '';
  const itemUnitId = unit.itemUnitId || null;
  const gst = preserveDocumentTaxRate ? (line?.gst ?? '0') : (master.gst ?? '0');

  const isStale =
    (line.itemName || '') !== itemName ||
    (line.itemNo || '') !== itemNo ||
    (line.hsnCode || '') !== hsnCode ||
    (line.itemUnit || '') !== itemUnit ||
    String(resolveUnitRefId(line.itemUnitId) || '') !== String(itemUnitId || '') ||
    getGstNumericRate(line.gst) !== getGstNumericRate(gst);

  if (!isStale) return line;

  return { ...line, itemName, itemNo, hsnCode, itemUnit, itemUnitId, gst };
};

/* Stable empty-row template — defined once, never recreated inside render */
const EMPTY_ITEM_TEMPLATE = {
  itemId: null,
  itemName: '',
  itemNo: '',
  hsnCode: '',
  itemUnit: '',
  itemUnitId: null,
  gst: '0',
  taxAmount: '0.00',
  quantity: '1.00',
  rate: '0.00',
  amount: '0.00',
  description: '',
};

const INVENTORY_ADJUSTMENT_EMPTY_ITEM = {
  itemId: null,
  itemUnitId: null,
  itemUnit: '',
  currentStock: null,
  updatedStock: null,
  adjustedStock: null,
  purchasePrice: null,
};

const buildItemSelectOptions = (itemsDrop, showAvailableStock) =>
  (itemsDrop || []).map(option => {
    const itemNo = option?.itemNo || option?.itemCode || '';
    const itemName = option?.itemName || '';
    const hasStock = option?.availableStock !== undefined && option?.availableStock !== null;
    const stockLabel = showAvailableStock && hasStock ? String(option.availableStock) : '';
    const isService = option?.itemCategory?.isService === true;
    return {
      label: `${itemName} ${itemNo}`.replace(/\s+/g, ' ').trim(),
      value: option?._id || option?.id,
      itemNo,
      itemName,
      isService,
      availableStock: showAvailableStock && hasStock ? option.availableStock : null,
      searchLabel: `${itemNo} ${itemName} ${stockLabel}`.replace(/\s+/g, ' ').trim(),
    };
  });

const hasSelectedItem = item => {
  const itemId = item?.itemId;
  return itemId != null && itemId !== '';
};

const getDragRowClassName = (index, draggedRowIndex, hoverRowIndex) => {
  if (draggedRowIndex === null) return '';
  if (index === draggedRowIndex) return 'opacity-50 bg-gray-50';
  if (index === hoverRowIndex) return 'bg-blue-50';
  return '';
};

const useItemRowDragReorder = ({ arr, disabled, moveRef }) => {
  const [draggedRowIndex, setDraggedRowIndex] = useState(null);
  const [hoverRowIndex, setHoverRowIndex] = useState(null);
  const dragGhostRef = useRef(null);
  const dragStateRef = useRef(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const rafIdRef = useRef(null);
  const arrRef = useRef(arr);
  arrRef.current = arr;
  const registeredListenersRef = useRef({ move: null, up: null });

  const isRowDraggable = useCallback(index => !disabled && hasSelectedItem(arr?.[index]), [disabled, arr]);

  const moveGhostTo = useCallback((x, y) => {
    const ghost = dragGhostRef.current;
    if (!ghost) return;
    ghost.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }, []);

  const processFrame = useCallback(() => {
    rafIdRef.current = null;
    const state = dragStateRef.current;
    if (!state) return;

    const { x, y } = pointerRef.current;
    moveGhostTo(x - state.offsetX, y - state.offsetY);

    const targetRow = document.elementFromPoint(x, y)?.closest('tr[data-row-index]');
    if (!targetRow) return;

    const targetIndex = Number(targetRow.getAttribute('data-row-index'));
    if (Number.isNaN(targetIndex) || targetIndex === state.hoverIndex) return;
    if (!isRowDraggable(state.originIndex) || !hasSelectedItem(arrRef.current?.[targetIndex])) return;

    state.hoverIndex = targetIndex;
    setHoverRowIndex(targetIndex);
  }, [isRowDraggable, moveGhostTo]);

  const handlePointerMove = useCallback(
    e => {
      if (!dragStateRef.current) return;
      pointerRef.current = { x: e.clientX, y: e.clientY };
      if (rafIdRef.current == null) {
        rafIdRef.current = requestAnimationFrame(processFrame);
      }
    },
    [processFrame]
  );

  const endDrag = useCallback(() => {
    const state = dragStateRef.current;
    dragStateRef.current = null;
    if (rafIdRef.current != null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
    setDraggedRowIndex(null);
    setHoverRowIndex(null);
    if (dragGhostRef.current) {
      dragGhostRef.current.style.display = 'none';
      dragGhostRef.current.innerHTML = '';
    }
    document.body.style.userSelect = '';
    window.removeEventListener('mousemove', registeredListenersRef.current.move);
    window.removeEventListener('mouseup', registeredListenersRef.current.up);

    if (state && state.hoverIndex !== state.originIndex) {
      moveRef.current?.(state.originIndex, state.hoverIndex);
    }
  }, [moveRef]);

  const handleDragStart = useCallback(
    (e, index) => {
      if (!isRowDraggable(index)) return;
      e.preventDefault();

      const rowEl = e.currentTarget.closest('tr');
      const rowRect = rowEl?.getBoundingClientRect();
      const offsetX = rowRect ? Math.min(e.clientX - rowRect.left, 32) : 16;
      const offsetY = rowRect ? e.clientY - rowRect.top : 16;
      dragStateRef.current = { originIndex: index, hoverIndex: index, offsetX, offsetY };
      pointerRef.current = { x: e.clientX, y: e.clientY };
      setDraggedRowIndex(index);
      setHoverRowIndex(index);

      const ghost = dragGhostRef.current;
      if (ghost && rowEl && rowRect) {
        ghost.innerHTML = '';
        ghost.style.width = `${rowRect.width}px`;

        Array.from(rowEl.children).forEach(cell => {
          const cellWidth = cell.getBoundingClientRect().width;
          const cellClone = cell.cloneNode(true);
          cellClone.style.flex = `0 0 ${cellWidth}px`;
          cellClone.style.width = `${cellWidth}px`;

          // cloneNode ignores JS-set input values, so copy the current text over
          cell.querySelectorAll('input, textarea').forEach((field, i) => {
            const clonedField = cellClone.querySelectorAll('input, textarea')[i];
            if (clonedField) clonedField.value = field.value;
          });

          ghost.appendChild(cellClone);
        });

        ghost.style.display = 'flex';
        moveGhostTo(e.clientX - offsetX, e.clientY - offsetY);
      }

      document.body.style.userSelect = 'none';
      registeredListenersRef.current = { move: handlePointerMove, up: endDrag };
      window.addEventListener('mousemove', handlePointerMove, { passive: true });
      window.addEventListener('mouseup', endDrag);
    },
    [isRowDraggable, moveGhostTo, handlePointerMove, endDrag]
  );

  useEffect(
    () => () => {
      if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
      window.removeEventListener('mousemove', registeredListenersRef.current.move);
      window.removeEventListener('mouseup', registeredListenersRef.current.up);
      document.body.style.userSelect = '';
    },
    []
  );

  return {
    draggedRowIndex,
    hoverRowIndex,
    isRowDraggable,
    handleDragStart,
    dragGhostRef,
  };
};

const itemSelectFilterOption = (input, option) => {
  const query = (input ?? '').toLowerCase();
  const text = String(option?.searchLabel ?? option?.label ?? '').toLowerCase();
  return text.includes(query);
};

const renderItemSelectOption = (option, showAvailableStock) => {
  const data = option?.data ?? option;
  const itemNo = data?.itemNo ?? '-';
  const itemName = data?.itemName ?? '-';
  const isService = data?.isService === true;
  const stock = showAvailableStock && data?.availableStock !== undefined && data?.availableStock !== null ? data.availableStock : null;

  return (
    <div className={`item-select-dropdown-row${showAvailableStock ? ' item-select-dropdown-row--with-stock' : ''}`}>
      <span className="item-select-dropdown-cell item-select-dropdown-cell--id">
        <Tag className="font-semibold max-w-full truncate" title={itemNo}>
          {itemNo}
        </Tag>
      </span>
      <span className="item-select-dropdown-cell item-select-dropdown-cell--name !flex items-center gap-1.5 !overflow-visible" title={itemName}>
        <span className="min-w-0 flex-1 truncate">{itemName}</span>
        <Tag color={isService ? 'blue' : 'green'} className="shrink-0 !mr-0 text-[10px] leading-none py-0.5 px-1.5" title={isService ? 'Service item (no stock is managed)' : 'Goods item'}>
          {isService ? 'Service' : 'Goods'}
        </Tag>
      </span>
      {showAvailableStock && <span className="item-select-dropdown-cell item-select-dropdown-cell--stock">{isService ? '-' : stock !== null ? stock : '-'}</span>}
    </div>
  );
};

const renderItemSelectDropdown = (menu, showAvailableStock) => (
  <div className="item-select-dropdown-panel">
    <div className={`item-select-dropdown-header${showAvailableStock ? ' item-select-dropdown-header--with-stock' : ''}`}>
      <span className="item-select-dropdown-cell item-select-dropdown-cell--id">Item#</span>
      <span className="item-select-dropdown-cell item-select-dropdown-cell--name">Item Name</span>
      {showAvailableStock && <span className="item-select-dropdown-cell item-select-dropdown-cell--stock">Available Stock</span>}
    </div>
    {menu}
  </div>
);

/**
 * Inline notice for a goods item whose inventory tracking is turned off, shown on
 * stock-affecting documents so the user knows this line will not move stock levels.
 */
const InventoryOffNotice = ({ masterItem }) => (
  <div className="inline-flex items-start gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs text-amber-700">
    <Icons.InfoCircleOutlined className="mt-0.5 shrink-0" />
    <span>
      {masterItem?.itemCategory?.isService === true
        ? 'This is a service item. This transaction will not increase or decrease stock.'
        : 'Inventory tracking is turned off for this item. This transaction will not increase or decrease the item’s stock quantity.'}
    </span>
  </div>
);

const ItemTable = ({
  values,
  arr,
  findItem,
  itemsDrop,
  itemsDropLoading = false,
  setFieldValue,
  calculateAmounts,
  errors,
  handleBlur,
  handleChange,
  selectedCustomerData,
  activePriceListItems,
  touched,
  disabled,
  splitWiseType,
  discountConfig,
  isShowBatchNo,
  showBatchIndicator = false,
  page,
  itemchangeCb,
  moduleType = '',
  pageType = '',
  currency,
  footerActions = null,
  allowRateEdit = false,
  preserveDocumentTaxRate = false,
  allowDiscountEdit = false,
  showInventoryWarning = false,
  // Source document lines; added as disabled options so items missing from itemsDrop still show a name.
  sourceItems = null,
  lockItemUnit = false,
  // When set (e.g. editing a document), skip this document so last-rate isn't compared to itself.
  excludeDocumentId = null,
  showLastRateComparison = false,
}) => {
  const [viewItemDetail, setViewItemDetail] = useState(false);
  const [selectedItemData, setSelectedItemData] = useState(null);
  const [itemDrawerInitialTab, setItemDrawerInitialTab] = useState('1');
  const handleViewItem = (item, initialTab = '1') => {
    const ref = item.itemId;
    const id = typeof ref === 'object' ? ref?.id || ref?._id : ref;
    if (!id) return;
    setSelectedItemData({ id: String(id), itemNo: item.itemNo, itemName: item.itemName });
    setItemDrawerInitialTab(initialTab || '1');
    setViewItemDetail(true);
  };
  const { currencySymbol: companyCurrencySymbol } = useCompanyCurrency();
  const displaySymbol = currency?.symbol ?? companyCurrencySymbol;
  const isSplitSessionActive = useSelector(state => state.common.isSplitSessionActive);
  const isInventoryAdjustment = page === MODULE_NAMES?.INVENTORY_ADJUSTMENT;

  const isRecurringDocument = pageType === pageTypes.RECURRING_INVOICE || pageType === pageTypes.RECURRING_BILL;
  const enableLastRateComparison = showLastRateComparison || (!isInventoryAdjustment && !isRecurringDocument && (moduleType === MODULE_TYPE.SALES || moduleType === MODULE_TYPE.PURCHASE));

  const partyId = selectedCustomerData?.id || selectedCustomerData?._id || '';
  const lastRatesByItemId = useLastTransactionRates({
    enabled: enableLastRateComparison,
    items: arr,
    customerId: moduleType === MODULE_TYPE.PURCHASE ? undefined : partyId,
    vendorId: moduleType === MODULE_TYPE.PURCHASE ? partyId : undefined,
    pageType,
    page,
    moduleType,
    excludeDocumentId,
  });

  let qtyDisabled = disabled;
  if ((page === MODULE_NAMES?.INVOICE || page === MODULE_NAMES?.BILL) && splitWiseType === 'Split By Qty' && isSplitSessionActive) {
    qtyDisabled = false;
  }

  let rateDisabled = disabled;
  if ((page === MODULE_NAMES?.INVOICE || page === MODULE_NAMES?.BILL) && splitWiseType === 'Split By Price' && isSplitSessionActive) {
    rateDisabled = false;
  }
  // When allowRateEdit is set (e.g. invoice/credit note created from a rejection order),
  // keep every other field locked but let the user enter the rate.
  if (allowRateEdit) {
    rateDisabled = false;
  }

  let discountDisabled = disabled;
  if (allowDiscountEdit) {
    discountDisabled = false;
  }

  const showItemAvailableStock = isInventoryAdjustment || ![pageTypes.CREDIT_NOTE, pageTypes.RECURRING_INVOICE].includes(pageType);
  const itemSelectOptions = useMemo(() => {
    const options = buildItemSelectOptions(itemsDrop, showItemAvailableStock);
    if (!sourceItems?.length) return options;
    const optionIds = new Set(options.map(option => String(option.value)));
    const sourceOptions = buildItemSelectOptions(
      sourceItems.map(item => ({ ...item, _id: item?.itemId?._id ?? item?.itemId?.id ?? item?.itemId })),
      false
    )
      .filter(option => {
        const id = String(option.value || '');
        if (!id || optionIds.has(id)) return false;
        optionIds.add(id);
        return true;
      })
      .map(option => ({ ...option, disabled: true }));
    return [...options, ...sourceOptions];
  }, [itemsDrop, showItemAvailableStock, sourceItems]);
  const renderOption = useCallback(option => renderItemSelectOption(option, showItemAvailableStock), [showItemAvailableStock]);
  const renderDropdown = useCallback(menu => renderItemSelectDropdown(menu, showItemAvailableStock), [showItemAvailableStock]);
  const moveRef = useRef(null);
  const { draggedRowIndex, hoverRowIndex, isRowDraggable, handleDragStart, dragGhostRef } = useItemRowDragReorder({
    arr,
    disabled,
    moveRef,
  });

  useEffect(() => {
    if (draggedRowIndex !== null || isInventoryAdjustment || !setFieldValue || itemsDropLoading || !itemsDrop?.length || !arr?.length) return;

    const syncedItems = arr.map(line => applyMasterToLineItem(line, itemsDrop, preserveDocumentTaxRate));
    const changed = syncedItems.some((row, i) => row !== arr[i]);
    if (!changed) return;

    setFieldValue('items', syncedItems);
    calculateAmounts?.({ ...values, items: syncedItems }, setFieldValue, discountConfig);
  }, [itemsDrop, itemsDropLoading, arr, isInventoryAdjustment, draggedRowIndex, preserveDocumentTaxRate]);

  if (isInventoryAdjustment) {
    const iaInputClass =
      'w-full rounded border border-gray-200 bg-transparent px-2 py-1.5 h-[36px] text-center text-sm font-normal text-gray-800 outline-none focus:border-primary disabled:bg-gray-50 disabled:text-gray-500';

    return (
      <div id="items" className={`pt-4 ${disabled ? 'mb-5' : ''}`}>
        <div ref={dragGhostRef} className="item-row-drag-ghost" style={{ display: 'none' }} />
        <div className="w-full max-w-full overflow-x-auto overflow-y-hidden rounded-lg border border-gray-200 bg-white pr-4 pl-1 pt-4 shadow-sm">
          <div className="mb-3 text-sm font-semibold text-gray-900 ml-4">Item Table</div>
          <table className="w-full min-w-full max-md:min-w-[980px] table-fixed" style={{ borderCollapse: 'collapse', borderSpacing: 0 }}>
            <thead>
              <tr className="w-full text-[10px] uppercase tracking-wide text-gray-500">
                {!disabled && <th className="border-0 border-b border-gray-100 px-1 pb-2 text-center w-[28px]"></th>}
                <th className="border-0 border-b border-gray-100 px-3 pb-2 text-start w-[330px]">Item Details</th>
                <th className="border-0 border-b border-gray-100 px-2 pb-2 text-center whitespace-nowrap w-[120px]">Item Unit</th>
                <th className="border-0 border-b border-gray-100 px-2 pb-2 text-center whitespace-nowrap w-[140px]">Current Stock</th>
                <th className="border-0 border-b border-gray-100 px-2 pb-2 text-center whitespace-nowrap w-[140px]">Updated Stock</th>
                <th className="border-0 border-b border-gray-100 px-2 pb-2 text-center whitespace-nowrap w-[140px]">Adjusted Stock</th>
                <th className="border-0 border-b border-gray-100 px-2 pb-2 text-center whitespace-nowrap w-[140px]">Purchase Price</th>
                {!disabled && <th className="border-0 border-b border-gray-100 px-1 pb-2 w-[28px]"></th>}
              </tr>
            </thead>
            <tbody>
              <FieldArray name="items">
                {({ push, remove, move }) => {
                  moveRef.current = move;
                  return (
                    <>
                      {arr?.map((item, index) => {
                        const selectedMaster = findItem?.(item.itemId, itemsDrop);
                        const unitSelection = resolveLineUnitSelection(item, selectedMaster);
                        return (
                          <tr key={index} data-row-index={index} className={getDragRowClassName(index, draggedRowIndex, hoverRowIndex)}>
                            {!disabled && (
                              <td className="border-0 border-b border-gray-100 text-center w-[28px] align-middle">
                                {isRowDraggable(index) ? (
                                  <span
                                    role="button"
                                    tabIndex={0}
                                    onMouseDown={e => handleDragStart(e, index)}
                                    onKeyDown={e => e.preventDefault()}
                                    className="cursor-move inline-flex p-1"
                                    title="Drag to reorder"
                                  >
                                    <Icons.DragOutlined className="text-gray-400" />
                                  </span>
                                ) : null}
                              </td>
                            )}
                            <td className="border-0 border-b border-gray-100 py-2 px-3 text-start align-top relative w-[330px]">
                              <div className="rounded-md border border-gray-200 bg-white px-2">
                                <Select
                                  showSearch
                                  placeholder="Type or click to select an item."
                                  filterOption={itemSelectFilterOption}
                                  id=""
                                  bordered={false}
                                  className="item-details-select item-details-select--wrap w-full cursor-pointer"
                                  popupClassName="item-select-dropdown-popup item-select-dropdown-popup--item-table"
                                  dropdownStyle={{ minWidth: 520, width: 'min(720px, 70vw)', borderRadius: 0 }}
                                  popupMatchSelectWidth={false}
                                  optionRender={renderOption}
                                  dropdownRender={renderDropdown}
                                  name={`items[${index}].itemId`}
                                  value={item.itemId}
                                  onChange={value => {
                                    const selectedItemId = value;
                                    const selectedItem = findItem(selectedItemId, itemsDrop);
                                    const unit = resolveLineUnitSelection({}, selectedItem);
                                    const unitPrice = unit.option?.purchasePrice;
                                    const defaultPurchasePrice = unitPrice != null && unitPrice !== '' ? toDecimalString(parseFloat(unitPrice)) : null;
                                    const updatedItems = arr.map((itm, idx) =>
                                      idx === index
                                        ? {
                                            ...itm,
                                            itemId: selectedItemId,
                                            itemUnit: unit.itemUnit || '',
                                            itemUnitId: unit.itemUnitId,
                                            purchasePrice: defaultPurchasePrice,
                                          }
                                        : itm
                                    );

                                    setFieldValue('items', updatedItems);
                                    if (itemchangeCb) {
                                      itemchangeCb(selectedItem, { ...values, items: updatedItems });
                                    }
                                  }}
                                  onBlur={handleBlur}
                                  options={itemSelectOptions.filter(opt => !arr.some((itm, idx2) => String(itm?.itemId) === String(opt.value) && idx2 !== index))}
                                  disabled={disabled}
                                  loading={itemsDropLoading}
                                  notFoundContent={
                                    itemsDropLoading ? (
                                      <div className="flex justify-center items-center">
                                        <Spin size="small" />
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-center w-full">No Item Available</div>
                                    )
                                  }
                                />
                              </div>
                              {errors.items?.[index]?.itemId && touched.items?.[index]?.itemId && <div className="text-red-500 text-xs leading-tight mt-1 text-left">{errors.items[index].itemId}</div>}
                            </td>
                            <td className="border-0 border-b border-gray-100 px-2 py-2 text-center align-top relative">
                              {hasSelectedItem(item) ? (
                                <Select
                                  placeholder="Unit"
                                  className="item-unit-select w-full"
                                  popupMatchSelectWidth={false}
                                  value={unitSelection.option?.value}
                                  options={unitSelection.options.map(option => ({ label: option.label, value: option.value }))}
                                  disabled={disabled || lockItemUnit || unitSelection.options.length <= 1}
                                  onChange={value => {
                                    const option = unitSelection.options.find(unitOption => String(unitOption.value) === String(value));
                                    if (!option) return;
                                    const unitPrice = option.purchasePrice;
                                    const purchasePrice = unitPrice != null && unitPrice !== '' ? toDecimalString(parseFloat(unitPrice)) : null;
                                    const master = findItem?.(item.itemId, itemsDrop);
                                    const nextLine = { ...item, itemUnit: option.label, itemUnitId: option.itemUnitId || null };
                                    const baseStock = item.baseAvailableStock != null && item.baseAvailableStock !== '' ? item.baseAvailableStock : master?.availableStock;
                                    const currentStock = baseStock == null || baseStock === '' ? item.currentStock : toDecimalString(stockQuantityForUnit(baseStock, master, nextLine));
                                    const updatedItems = arr.map((itm, i) =>
                                      i === index
                                        ? {
                                            ...itm,
                                            itemUnit: option.label,
                                            itemUnitId: option.itemUnitId || null,
                                            purchasePrice,
                                            currentStock,
                                            adjustedStock:
                                              itm.updatedStock != null && itm.updatedStock !== '' ? toDecimalString(parseFloat(itm.updatedStock) - parseFloat(currentStock || 0)) : itm.adjustedStock,
                                          }
                                        : itm
                                    );
                                    setFieldValue('items', updatedItems);
                                  }}
                                />
                              ) : (
                                <input type="text" readOnly disabled className={iaInputClass} value="" />
                              )}
                              {errors.items?.[index]?.itemUnitId && touched.items?.[index]?.itemUnitId && (
                                <div className="text-red-500 text-xs leading-tight mt-1 text-left">{errors.items[index].itemUnitId}</div>
                              )}
                            </td>
                            <td className="border-0 border-b border-gray-100 px-2 py-2 text-center align-top relative">
                              <input
                                type="text"
                                className={iaInputClass}
                                name={`items[${index}].currentStock`}
                                value={item.currentStock != null && item.currentStock !== '' ? toDecimalString(parseFloat(item.currentStock)) : ''}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                disabled
                              />
                              {errors.items?.[index]?.currentStock && touched.items?.[index]?.currentStock && (
                                <div className="text-red-500 text-xs leading-tight mt-1 text-left">{errors.items[index].currentStock}</div>
                              )}
                            </td>
                            <td className="border-0 border-b border-gray-100 px-2 py-2 text-center align-top relative">
                              <input
                                type="text"
                                className={iaInputClass}
                                name={`items[${index}].updatedStock`}
                                value={item.updatedStock ?? ''}
                                placeholder="0.00"
                                onChange={e => {
                                  const updatedValue = e.target.value;
                                  const updatedItems = arr.map((itm, idx) => {
                                    if (idx === index) {
                                      const adj = updatedValue !== '' ? toDecimalString(parseFloat(updatedValue || 0) - parseFloat(itm.currentStock || 0)) : null;
                                      const adjNum = adj != null ? parseFloat(adj) : 0;
                                      let purchasePrice = itm.purchasePrice;
                                      if (adjNum > 0 && (purchasePrice == null || purchasePrice === '')) {
                                        const unitPrice = resolveLineUnitSelection(itm, findItem(itm.itemId, itemsDrop)).option?.purchasePrice;
                                        purchasePrice = unitPrice != null && unitPrice !== '' ? toDecimalString(parseFloat(unitPrice)) : null;
                                      }
                                      return {
                                        ...itm,
                                        updatedStock: updatedValue,
                                        adjustedStock: adj,
                                        purchasePrice,
                                      };
                                    }
                                    return itm;
                                  });
                                  setFieldValue('items', updatedItems);
                                }}
                                onBlur={e => {
                                  const val = e.target.value;
                                  if (val !== '' && !isNaN(parseFloat(val))) {
                                    const formatted = toDecimalString(parseFloat(val));
                                    const updatedItems = arr.map((itm, idx) => {
                                      if (idx === index) {
                                        const adj = toDecimalString(parseFloat(formatted) - parseFloat(itm.currentStock || 0));
                                        const adjNum = parseFloat(adj);
                                        let purchasePrice = itm.purchasePrice;
                                        if (adjNum > 0 && (purchasePrice == null || purchasePrice === '')) {
                                          const unitPrice = resolveLineUnitSelection(itm, findItem(itm.itemId, itemsDrop)).option?.purchasePrice;
                                          purchasePrice = unitPrice != null && unitPrice !== '' ? toDecimalString(parseFloat(unitPrice)) : null;
                                        }
                                        return {
                                          ...itm,
                                          updatedStock: formatted,
                                          adjustedStock: adj,
                                          purchasePrice,
                                        };
                                      }
                                      return itm;
                                    });
                                    setFieldValue('items', updatedItems);
                                  }
                                  handleBlur(e);
                                }}
                                disabled={disabled}
                              />
                              {errors.items?.[index]?.updatedStock && touched.items?.[index]?.updatedStock && (
                                <div className="text-red-500 text-xs leading-tight mt-1 text-left">{errors.items[index].updatedStock}</div>
                              )}
                            </td>
                            <td className="border-0 border-b border-gray-100 px-2 py-2 text-center align-top relative">
                              <input
                                type="text"
                                className={iaInputClass}
                                name={`items[${index}].adjustedStock`}
                                value={item.adjustedStock != null && item.adjustedStock !== '' ? toDecimalString(parseFloat(item.adjustedStock)) : ''}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                disabled
                              />
                              {errors.items?.[index]?.adjustedStock && touched.items?.[index]?.adjustedStock && (
                                <div className="text-red-500 text-xs leading-tight mt-1 text-left">{errors.items[index].adjustedStock}</div>
                              )}
                            </td>
                            <td className="border-0 border-b border-gray-100 px-2 py-2 text-center align-top relative">
                              <input
                                type="text"
                                className={iaInputClass}
                                name={`items[${index}].purchasePrice`}
                                value={item.purchasePrice ?? ''}
                                onChange={e => {
                                  const newValue = e.target.value;
                                  const updatedItems = arr.map((itm, idx) => (idx === index ? { ...itm, purchasePrice: newValue } : itm));
                                  setFieldValue('items', updatedItems);
                                }}
                                onBlur={e => {
                                  const val = e.target.value;
                                  if (val !== '' && !isNaN(parseFloat(val))) {
                                    const formatted = toDecimalString(parseFloat(val));
                                    const updatedItems = arr.map((itm, idx) => (idx === index ? { ...itm, purchasePrice: formatted } : itm));
                                    setFieldValue('items', updatedItems);
                                  }
                                  handleBlur(e);
                                }}
                                disabled={disabled || !(parseFloat(item.adjustedStock) > 0)}
                              />
                              {errors.items?.[index]?.purchasePrice && touched.items?.[index]?.purchasePrice && (
                                <div className="text-red-500 text-xs leading-tight mt-1 text-left">{errors.items[index].purchasePrice}</div>
                              )}
                            </td>
                            {!disabled && (
                              <td className="border-0 border-b border-gray-100 px-1 py-2 text-end align-top">
                                {arr?.length > 1 ? (
                                  <div className="flex h-[36px] items-center justify-end">
                                    <Icons.DeleteOutlined style={{ fontSize: 15, color: colorPalette.error[500], cursor: 'pointer' }} onClick={() => remove(index)} />
                                  </div>
                                ) : (
                                  <div className="h-[36px]" />
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                      {!disabled && (
                        <div className="flex items-center gap-2 mt-3 ms-1 mb-2">
                          <CustomButton
                            type="primary"
                            onClick={() => push(INVENTORY_ADJUSTMENT_EMPTY_ITEM)}
                            text={
                              <div className="flex gap-1 text-xs items-center">
                                <Icons.PlusCircleOutlined className="text-xs" />
                                <div>Add Item</div>
                              </div>
                            }
                          />
                          {footerActions}
                        </div>
                      )}
                    </>
                  );
                }}
              </FieldArray>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div id="items" className={`pt-4 ${disabled ? 'mb-5' : ''}`}>
      <div ref={dragGhostRef} className="item-row-drag-ghost" style={{ display: 'none' }} />
      <div className="w-full max-w-full overflow-x-auto overflow-y-hidden rounded-lg border border-gray-200 bg-white pr-4 pl-1 pt-4 shadow-sm">
        <div className="mb-3 text-sm font-semibold text-gray-900 ml-4">Item Table</div>
        <table className="w-full min-w-0 table-fixed" style={{ borderCollapse: 'collapse', borderSpacing: 0 }}>
          <thead>
            <tr className="w-full text-[10px] uppercase tracking-wide text-gray-500">
              {!disabled && <th className="border-0 border-b border-gray-100 px-1 pb-2 text-center w-[28px]"></th>}
              <th className="border-0 border-b border-gray-100 px-4 pb-2 text-start w-[330px]">Item</th>
              {isShowBatchNo && <th className="border-0 border-b border-gray-100 px-4 pb-2 text-end whitespace-nowrap w-[160px]">Vendor Batch No</th>}
              {isShowBatchNo && <th className="border-0 border-b border-gray-100 px-4 pb-2 text-end whitespace-nowrap w-[200px]">Vendor Batch Expiry Date</th>}
              <th className="hidden">Item Code</th>
              <th className="border-0 border-b border-gray-100 px-2 pb-2 text-center whitespace-nowrap w-[105px]">HSN</th>
              <th className="border-0 border-b border-gray-100 px-2 pb-2 text-center whitespace-nowrap w-[96px]">Unit</th>
              <th className="border-0 border-b border-gray-100 px-2 pb-2 text-center whitespace-nowrap w-[88px]">Qty</th>
              {splitWiseType === 'Split By Qty' && isSplitSessionActive && (
                <th className="border-0 border-b border-gray-100 px-2 pb-2 text-end text-red-600 whitespace-nowrap w-[110px]">Split Quantity</th>
              )}
              <th className="border-0 border-b border-gray-100 px-2 pb-2 text-end whitespace-nowrap w-[120px]">Rate</th>
              {discountConfig?.appliesTo === 'ITEM' && !values?.isSplit && <th className="w-[8px] border-0 border-b border-gray-100 p-0"></th>}
              {discountConfig?.appliesTo === 'ITEM' && !values?.isSplit && <th className="border-0 border-b border-gray-100 px-2 pb-2 text-end whitespace-nowrap w-[96px]">Disc.</th>}
              {splitWiseType === 'Split By Price' && isSplitSessionActive && (
                <th className="border-0 border-b border-gray-100 px-2 pb-2 text-end text-red-600 whitespace-nowrap w-[110px]">Split Rate</th>
              )}
              {!values?.isSplit && <th className="border-0 border-b border-gray-100 px-2 pb-2 text-end whitespace-nowrap w-[90px]">GST</th>}
              <th className="border-0 border-b border-gray-100 px-3 pb-2 text-end whitespace-nowrap w-[100px]">Amount</th>
              {(splitWiseType === 'Split By Price' || splitWiseType === 'Split By Qty') && isSplitSessionActive && (
                <th className="border-0 border-b border-gray-100 px-2 pb-2 text-end text-red-600 whitespace-nowrap w-[110px]">Split Amount</th>
              )}
              <th className="border-0 border-b border-gray-100 px-1 pb-2 w-[28px]"></th>
            </tr>
          </thead>
          <tbody>
            <FieldArray name="items">
              {({ push, move }) => {
                moveRef.current = move;
                return (
                  <>
                    {arr?.map((item, index) => {
                      const lineMaster = item?.itemId ? findItem(item.itemId, itemsDrop) : null;
                      const inventoryOffMaster = showInventoryWarning ? lineMaster : null;
                      const isServiceItem = inventoryOffMaster?.itemCategory?.isService === true;
                      const showInventoryOffNotice = !!inventoryOffMaster && (isServiceItem ? true : inventoryOffMaster.trackInventory === false);
                      const unitSelection = resolveLineUnitSelection(item, lineMaster);
                      const lineAvailableStock = resolveLineAvailableStock(lineMaster, unitSelection);
                      // Item selectability: inactive / unavailable in the selected warehouse, or a backend itemIssue.
                      const itemsDropReady = !isInventoryAdjustment && !itemsDropLoading && (itemsDrop?.length || 0) > 0;
                      const itemLineWarning = getItemLineWarning(item, { itemsDrop, itemsDropReady, stockItem: showBatchIndicator ? lineMaster : null });
                      const lineItemId = typeof item.itemId === 'object' ? item.itemId?.id || item.itemId?._id : item.itemId;
                      const lastRateEntry = lineItemId ? lastRatesByItemId[String(lineItemId)] : null;
                      const showRateComparison = enableLastRateComparison && !!lastRateEntry?.rate;
                      return (
                        <Fragment key={index}>
                          <tr data-row-index={index} className={getDragRowClassName(index, draggedRowIndex, hoverRowIndex)}>
                            {!disabled && (
                              <td className="border-0 border-b border-gray-100 text-center w-[28px] align-middle">
                                {isRowDraggable(index) ? (
                                  <span
                                    role="button"
                                    tabIndex={0}
                                    onMouseDown={e => handleDragStart(e, index)}
                                    onKeyDown={e => e.preventDefault()}
                                    className="cursor-move inline-flex p-1"
                                    title="Drag to reorder"
                                  >
                                    <Icons.DragOutlined className="text-gray-400" />
                                  </span>
                                ) : null}
                              </td>
                            )}
                            <td className="border-0 border-b border-gray-100 py-2 px-3 text-start align-top relative w-[330px]">
                              <div className="rounded-md border border-gray-200 bg-white px-2">
                                <Select
                                  showSearch
                                  placeholder="Type or click to select an item."
                                  filterOption={itemSelectFilterOption}
                                  id=""
                                  bordered={false}
                                  className="item-details-select item-details-select--wrap w-full cursor-pointer"
                                  popupClassName="item-select-dropdown-popup item-select-dropdown-popup--item-table"
                                  dropdownStyle={{ minWidth: 520, width: 'min(720px, 70vw)', borderRadius: 0 }}
                                  popupMatchSelectWidth={false}
                                  optionRender={renderOption}
                                  dropdownRender={renderDropdown}
                                  name={`items[${index}].itemId`}
                                  value={item.itemId}
                                  onChange={value => {
                                    const selectedItemId = value;
                                    const selectedItem = findItem(selectedItemId, itemsDrop);

                                    const resolvedPriceListItems = activePriceListItems ?? selectedCustomerData?.priceList?.items ?? [];
                                    const matchedPriceListLine = resolvedPriceListItems?.find(priceListItem => String(getPriceListItemId(priceListItem) || '') === String(selectedItemId || '')) || {};
                                    const selectedUnit = defaultDocumentLineUnit(selectedItem, moduleType).option;

                                    const updatedItems = arr.map((itm, idx) => {
                                      if (idx === index) {
                                        let updatedItemData = {
                                          ...itm,
                                          itemId: selectedItemId,
                                          rate: selectedUnit
                                            ? rateForItemLineUnit(selectedUnit, { moduleType, priceListLine: matchedPriceListLine })
                                            : moduleType === MODULE_TYPE.PURCHASE
                                              ? String(selectedItem?.purchaseInformation?.costPrice || 0)
                                              : String(selectedItem?.salesInformation?.sellingPrice || 0),
                                          itemName: selectedItem?.itemName || '',
                                          itemNo: selectedItem?.itemNo || selectedItem?.itemCode || '',
                                          hsnCode: selectedItem?.hsnCode || '',
                                          itemUnit: selectedUnit?.label || selectedItem?.itemUnitId?.name || selectedItem?.itemUnit || '',
                                          itemUnitId: selectedUnit?.itemUnitId || null,
                                          gst: selectedItem?.gst || '0',
                                          ...(isShowBatchNo && {
                                            batchNumberMandatory: selectedItem?.purchasingData?.timeBatchNumberMandatory?.activeInactive || false,
                                          }),
                                          ...(isShowBatchNo && {
                                            batchExpiryDateMandatory: selectedItem?.purchasingData?.punchingTimeBatchNumberMandatory?.activeInactive || false,
                                          }),
                                        };
                                        return updatedItemData;
                                      }
                                      return itm;
                                    });

                                    setFieldValue('items', updatedItems);
                                    calculateAmounts({ ...values, items: updatedItems }, setFieldValue, discountConfig);
                                    if (itemchangeCb) {
                                      itemchangeCb(selectedItem);
                                    }
                                    const isLastRow = index === values.items.length - 1;
                                    if (!disabled && isLastRow) {
                                      push(EMPTY_ITEM_TEMPLATE);
                                    }
                                  }}
                                  onBlur={handleBlur}
                                  options={itemSelectOptions}
                                  disabled={disabled}
                                  loading={itemsDropLoading}
                                  notFoundContent={
                                    itemsDropLoading ? (
                                      <div className="flex justify-center items-center">
                                        <Spin size="small" />
                                      </div>
                                    ) : (
                                      <div className="flex items-center justify-center w-full">No Item Available</div>
                                    )
                                  }
                                />
                              </div>
                              {errors.items?.[index]?.itemId && touched.items?.[index]?.itemId && <div className="text-red-500 mt-1 text-xs">{errors.items[index].itemId}</div>}

                              {hasSelectedItem(item) && (
                                <div className="my-1 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                                  <button
                                    type="button"
                                    className="inline-flex items-center gap-1 text-xs underline underline-offset-2 hover:text-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                                    style={{ color: colorPalette.primary[500] }}
                                    onClick={() => handleViewItem(item)}
                                    aria-label={`View item details for ${item.itemName || item.itemNo || 'selected item'}`}
                                  >
                                    <Icons.ShoppingOutlined />
                                    View Item Details
                                  </button>
                                  {lineAvailableStock !== null && (
                                    <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                                      <span>Available Stock:</span>
                                      <span className="font-semibold text-gray-800">{lineAvailableStock}</span>
                                      {unitSelection.itemUnit ? <span>{unitSelection.itemUnit}</span> : null}
                                    </span>
                                  )}
                                </div>
                              )}

                              {hasSelectedItem(item) && (
                                <div className="px-0 pb-1 item-desc-spacing" style={{ '--item-desc-mt': '6px' }}>
                                  <textarea
                                    className="w-full px-3 py-1 text-sm font-normal text-gray-800 border-none bg-gray-100 rounded resize-none focus:outline-none focus:ring-1 focus:ring-gray-300"
                                    placeholder="Add a description to your item"
                                    name={`items[${index}].description`}
                                    value={item.description || ''}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    rows="2"
                                    disabled={disabled}
                                  />
                                  {errors.items?.[index]?.description && touched.items?.[index]?.description && <div className="text-red-500 text-xs mt-1">{errors.items[index].description}</div>}
                                </div>
                              )}

                              {itemLineWarning && (
                                <div className="mt-1 inline-flex items-start gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs text-amber-700">
                                  <Icons.ExclamationCircleOutlined className="mt-0.5 shrink-0" />
                                  <span>{itemLineWarning}</span>
                                </div>
                              )}

                              {showInventoryOffNotice && (
                                <div className="mt-1">
                                  <InventoryOffNotice masterItem={inventoryOffMaster} />
                                </div>
                              )}
                            </td>
                            {isShowBatchNo && (
                              <td className="border-0 border-b border-gray-100 px-4 py-1.5 text-center relative">
                                <input
                                  type="text"
                                  className="w-full rounded border border-gray-200 bg-transparent px-2 py-1.5 h-[36px] text-sm font-normal text-gray-800 outline-none focus:border-primary"
                                  name={`items[${index}].vendorBatchNo`}
                                  value={item.vendorBatchNo || ''}
                                  onChange={handleChange}
                                />
                                {errors.items?.[index]?.vendorBatchNo && touched.items?.[index]?.vendorBatchNo && (
                                  <div className="text-red-500 text-xs absolute bottom-0 right-0">{errors.items[index].vendorBatchNo}</div>
                                )}
                              </td>
                            )}
                            {isShowBatchNo && (
                              <td className="border-0 border-b border-gray-100 px-4 py-1.5 text-center relative">
                                <DatePicker
                                  value={item.vendorBatchExpiry ? dayjs(item.vendorBatchExpiry, 'YYYY-MM-DD') : null}
                                  onChange={(date, dateString) => {
                                    setFieldValue(`items[${index}].vendorBatchExpiry`, dateString);
                                    calculateAmounts(
                                      {
                                        ...values,
                                        items: arr.map((itm, i) => (i === index ? { ...itm, vendorBatchExpiry: dateString } : itm)),
                                      },
                                      setFieldValue,
                                      discountConfig
                                    );
                                  }}
                                  format="YYYY-MM-DD"
                                  className="w-32 py-1.5 h-[35.5px]"
                                  placeholder="Select Date"
                                />
                                {errors.items?.[index]?.vendorBatchExpiry && touched.items?.[index]?.vendorBatchExpiry && (
                                  <div className="text-red-500 text-xs absolute bottom-0 right-0">{errors.items[index].vendorBatchExpiry}</div>
                                )}
                              </td>
                            )}
                            <td className="w-full border text-center relative hidden">
                              <input type="text" className="focus:outline-none py-2" name={`items[${index}].itemName`} value={item.itemName} onChange={handleChange} onBlur={handleBlur} readOnly />
                            </td>
                            <td className="hidden">
                              <input type="text" name={`items[${index}].itemNo`} value={item.itemNo} onChange={handleChange} onBlur={handleBlur} readOnly />
                            </td>
                            <td className="border-0 border-b border-gray-100 px-2 py-2 text-center align-top relative">
                              <input
                                type="text"
                                className="w-full rounded border border-gray-200 bg-transparent px-2 py-1.5 h-[36px] text-center text-sm font-normal text-gray-800 outline-none"
                                name={`items[${index}].hsnCode`}
                                value={item.hsnCode || ''}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                readOnly
                              />
                            </td>
                            <td className="border-0 border-b border-gray-100 px-2 py-2 text-center align-top relative">
                              {hasSelectedItem(item) ? (
                                <Select
                                  placeholder="Unit"
                                  className="item-unit-select w-full"
                                  popupMatchSelectWidth={false}
                                  value={unitSelection.option?.value}
                                  options={unitSelection.options.map(option => ({ label: option.label, value: option.value }))}
                                  disabled={disabled || lockItemUnit || unitSelection.options.length <= 1}
                                  onChange={value => {
                                    const option = unitSelection.options.find(unitOption => String(unitOption.value) === String(value));
                                    if (!option) return;

                                    const resolvedPriceListItems = activePriceListItems ?? selectedCustomerData?.priceList?.items ?? [];
                                    const matchedPriceListLine = resolvedPriceListItems?.find(priceListItem => String(getPriceListItemId(priceListItem) || '') === String(item?.itemId || '')) || {};
                                    const updatedItems = arr.map((itm, i) =>
                                      i === index
                                        ? {
                                            ...itm,
                                            itemUnit: option.label,
                                            itemUnitId: option.itemUnitId || null,
                                            rate: rateForItemLineUnit(option, {
                                              moduleType,
                                              priceListLine: matchedPriceListLine,
                                            }),
                                          }
                                        : itm
                                    );
                                    setFieldValue('items', updatedItems);
                                    calculateAmounts({ ...values, items: updatedItems }, setFieldValue, discountConfig);
                                  }}
                                />
                              ) : (
                                <input type="text" readOnly disabled className="w-full rounded border border-gray-200 bg-transparent px-2 py-1.5 h-[36px] text-center text-sm outline-none" value="" />
                              )}
                            </td>

                            <td className="border-0 border-b border-gray-100 px-2 py-2 text-center align-top relative">
                              <div className="flex flex-col items-center justify-start">
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  className="w-full rounded border border-gray-200 bg-transparent px-2 py-1.5 h-[36px] text-center text-sm font-normal text-gray-800 outline-none focus:border-primary"
                                  name={`items[${index}].quantity`}
                                  value={item.quantity || ''}
                                  onChange={e => {
                                    const newValue = e.target.value;
                                    if (newValue !== '' && !/^\d*\.?\d{0,3}$/.test(newValue)) {
                                      return;
                                    }
                                    setFieldValue(`items[${index}].quantity`, newValue);
                                    if (splitWiseType === 'Split By Qty' && isSplitSessionActive) {
                                      if (item.finalQty < parseFloat(newValue)) {
                                        return;
                                      }

                                      let updatedSplitQty = Number((parseFloat(item?.finalQty || 0) - parseFloat(newValue || 0)).toFixed(3)) || 0;

                                      let splitAmount = calculateSplitAmount(
                                        {
                                          ...item,
                                          quantity: parseFloat(newValue) || 0,
                                          splitQty: updatedSplitQty || 0,
                                        },
                                        values?.splitWiseType
                                      );

                                      let updatedItems = arr.map((itm, i) => {
                                        if (i === index) {
                                          item.quantity = newValue;
                                          item.splitQty = updatedSplitQty || 0;
                                          item.splitAmount = splitAmount;
                                        }
                                        return itm;
                                      });
                                      setFieldValue('items', updatedItems);
                                      calculateAmounts(
                                        {
                                          ...values,
                                          items: updatedItems,
                                        },
                                        setFieldValue,
                                        discountConfig
                                      );
                                    } else {
                                      calculateAmounts(
                                        {
                                          ...values,
                                          items: arr.map((itm, i) => (i === index ? { ...itm, quantity: newValue } : itm)),
                                        },
                                        setFieldValue,
                                        discountConfig
                                      );
                                    }
                                  }}
                                  onBlur={e => {
                                    // Format quantity on blur - supports floating values (up to 2 decimal places)
                                    const value = e.target.value;
                                    if (value && !isNaN(parseFloat(value))) {
                                      const num = parseFloat(value);
                                      setFieldValue(`items[${index}].quantity`, num.toString());
                                    }
                                    handleBlur(e);
                                  }}
                                  disabled={disabled && qtyDisabled}
                                />
                                {/* Fixed-height slot so unit (BOX / PC / etc.) never shifts the qty input up */}
                                <div
                                  className="h-[14px] mt-0.5 w-full text-[10px] text-gray-500 text-center leading-[14px] truncate"
                                  title={unitSelection.itemUnit || getItemUnitName(item) || undefined}
                                >
                                  {unitSelection.itemUnit || getItemUnitName(item) || '\u00A0'}
                                </div>
                              </div>
                              {errors.items?.[index]?.quantity && touched.items?.[index]?.quantity && (
                                <div className="text-red-500 text-xs absolute bottom-0 right-0">{errors.items[index].quantity}</div>
                              )}
                            </td>
                            {splitWiseType === 'Split By Qty' && isSplitSessionActive && (
                              <td className="border-0 border-b border-gray-100 px-4 py-2 text-end align-top relative">
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  className="w-full rounded border border-gray-200 bg-transparent px-2 py-1.5 h-[36px] text-sm font-normal text-gray-800 outline-none focus:border-primary"
                                  name={`items[${index}].splitQty`}
                                  value={item.splitQty || ''}
                                  onChange={e => {
                                    const newValue = e?.target?.value || '';
                                    if (newValue !== '' && !/^\d*\.?\d{0,3}$/.test(newValue)) {
                                      return;
                                    }
                                    setFieldValue(`items[${index}].splitQty`, newValue);
                                    let splitAmount = calculateSplitAmount({ ...item, splitQty: parseFloat(newValue) || 0 }, values?.splitWiseType);
                                    const splitQtyValue = parseFloat(newValue) || 0;
                                    if (newValue && item?.finalQty >= splitQtyValue) {
                                      calculateAmounts(
                                        {
                                          ...values,
                                          items: arr.map((itm, i) =>
                                            i === index
                                              ? {
                                                  ...itm,
                                                  quantity: Number((parseFloat(item?.finalQty || 0) - splitQtyValue).toFixed(3)),
                                                  splitQty: newValue,
                                                  splitAmount,
                                                }
                                              : itm
                                          ),
                                        },
                                        setFieldValue,
                                        discountConfig
                                      );
                                    } else if (!newValue) {
                                      calculateAmounts(
                                        {
                                          ...values,
                                          items: arr.map((itm, i) =>
                                            i === index
                                              ? {
                                                  ...itm,
                                                  quantity: item?.finalQty,
                                                  splitQty: 0,
                                                  splitAmount,
                                                }
                                              : itm
                                          ),
                                        },
                                        setFieldValue,
                                        discountConfig
                                      );
                                    }
                                  }}
                                  onBlur={e => {
                                    // Format split qty on blur - supports floating values (up to 2 decimal places)
                                    const value = e.target.value;
                                    if (value && !isNaN(parseFloat(value))) {
                                      const num = parseFloat(value);
                                      setFieldValue(`items[${index}].splitQty`, num.toString());
                                    }
                                    handleBlur(e);
                                  }}
                                />
                                {errors.items?.[index]?.splitQty && touched.items?.[index]?.splitQty && (
                                  <div className="text-red-500 text-xs absolute bottom-0 right-0">{errors?.items?.[index]?.splitQty}</div>
                                )}
                                <div
                                  className="h-[14px] mt-0.5 w-full text-[10px] text-gray-500 text-left leading-[14px] truncate"
                                  title={unitSelection.itemUnit || getItemUnitName(item) || undefined}
                                >
                                  {unitSelection.itemUnit || getItemUnitName(item) || '\u00A0'}
                                </div>
                              </td>
                            )}
                            <td className="border-0 border-b border-gray-100 px-2 py-2 text-end align-top relative">
                              <input
                                type="text"
                                inputMode="decimal"
                                className="w-full rounded border border-gray-200 bg-transparent px-2 py-1.5 h-[36px] text-right text-sm font-normal text-gray-800 outline-none focus:border-primary"
                                name={`items[${index}].rate`}
                                value={item.rate || ''}
                                onChange={e => {
                                  const newValue = e.target.value;
                                  if (newValue !== '' && !/^\d*\.?\d{0,3}$/.test(newValue)) {
                                    return;
                                  }
                                  setFieldValue(`items[${index}].rate`, newValue);

                                  if (splitWiseType === 'Split By Price' && isSplitSessionActive) {
                                    if (item?.finalRate < parseFloat(newValue)) {
                                      return;
                                    }

                                    let updatedSplitRate = Number((parseFloat(item?.finalRate || 0) - parseFloat(newValue || 0)).toFixed(3)) || 0;

                                    let splitAmount = calculateSplitAmount(
                                      {
                                        ...item,
                                        rate: parseFloat(newValue) || 0,
                                        splitRate: updatedSplitRate || 0,
                                      },
                                      values?.splitWiseType
                                    );

                                    let updatedItems = arr.map((itm, i) => {
                                      if (i === index) {
                                        item.rate = newValue;
                                        item.splitRate = updatedSplitRate || 0;
                                        item.splitAmount = splitAmount;
                                      }
                                      return itm;
                                    });
                                    setFieldValue('items', updatedItems);
                                    calculateAmounts(
                                      {
                                        ...values,
                                        items: updatedItems,
                                      },
                                      setFieldValue,
                                      discountConfig
                                    );
                                  } else {
                                    calculateAmounts(
                                      {
                                        ...values,
                                        items: arr.map((itm, i) => (i === index ? { ...itm, rate: newValue } : itm)),
                                      },
                                      setFieldValue,
                                      discountConfig
                                    );
                                  }
                                }}
                                onBlur={handleBlur}
                                disabled={disabled && rateDisabled}
                              />
                              {enableLastRateComparison && hasSelectedItem(item) ? (
                                showRateComparison ? (
                                  <LastRateComparison
                                    lastRate={lastRateEntry.rate}
                                    currentRate={item.rate}
                                    currencySymbol={lastRateEntry.currencySymbol || displaySymbol}
                                    onClick={() => handleViewItem(item, '3')}
                                  />
                                ) : (
                                  <div className="h-[18px] mt-1" aria-hidden="true" />
                                )
                              ) : null}
                              {errors.items?.[index]?.rate && touched.items?.[index]?.rate && <div className="text-red-500 text-xs absolute bottom-0 right-0">{errors.items[index].rate}</div>}
                            </td>
                            {discountConfig?.appliesTo === 'ITEM' && !values?.isSplit && <th className="w-[8px] border-0 border-b border-gray-100 p-0"></th>}
                            {discountConfig?.appliesTo === 'ITEM' && !values?.isSplit && (
                              <td className="border-0 border-b border-gray-100 px-2 py-2 text-end align-top relative">
                                <div className="flex items-center justify-end">
                                  <input
                                    type="text"
                                    className="w-12 rounded-l border border-gray-200 px-2 py-1 h-[36px] text-right text-sm font-normal text-gray-800 outline-none focus:border-primary"
                                    name={`items[${index}].discountValue`}
                                    value={item.discountValue || ''}
                                    onChange={e => {
                                      const newValue = e?.target?.value;
                                      setFieldValue(`items[${index}].discountValue`, newValue);

                                      calculateAmounts(
                                        {
                                          ...values,
                                          items: arr.map((itm, i) =>
                                            i === index
                                              ? {
                                                  ...itm,
                                                  discountValue: newValue,
                                                }
                                              : itm
                                          ),
                                        },
                                        setFieldValue,
                                        discountConfig
                                      );
                                    }}
                                    onBlur={handleBlur}
                                    disabled={discountDisabled}
                                  />
                                  <select
                                    value={item.discountType}
                                    onChange={e => {
                                      setFieldValue(`items[${index}].discountType`, e.target.value);

                                      calculateAmounts(
                                        {
                                          ...values,
                                          items: arr.map((itm, i) =>
                                            i === index
                                              ? {
                                                  ...itm,
                                                  discountType: e.target.value,
                                                }
                                              : itm
                                          ),
                                        },
                                        setFieldValue,
                                        discountConfig
                                      );
                                    }}
                                    className="rounded-r border border-l-0 border-gray-200 px-1.5 py-1 h-[36px] text-sm font-normal text-gray-800 outline-none focus:border-primary bg-white"
                                    disabled={discountDisabled}
                                  >
                                    <option value="PERCENTAGE">%</option>
                                    <option value="AMOUNT">{displaySymbol}</option>
                                  </select>
                                </div>
                              </td>
                            )}
                            {splitWiseType === 'Split By Price' && isSplitSessionActive && (
                              <td className="border-0 border-b border-gray-100 px-4 py-2 text-end align-top relative">
                                <>
                                  <div className="relative">
                                    <span className="absolute right-2 top-1/2 text-gray-500 pointer-events-none">%</span>
                                    {errors.items?.[index]?.splitPercentage && (
                                      <span className="absolute right-6 top-1/2 text-red-500" title={errors.items[index].splitPercentage}>
                                        <Icons.InfoCircleOutlined className="" />
                                      </span>
                                    )}
                                  </div>

                                  <input
                                    type="text"
                                    className={`mb-2 w-full rounded border border-gray-200 ps-1 text-sm font-normal text-gray-800 outline-none focus:border-primary ${errors.items?.[index]?.splitPercentage ? 'border-red-500' : ''}`}
                                    value={item?.splitPercentage}
                                    onChange={e => {
                                      if (e?.target?.value && !isNaN(e?.target?.value)) {
                                        const newValue = parseFloat(e?.target?.value);
                                        setFieldValue(`items[${index}].splitPercentage`, newValue);
                                        setFieldValue('splitPercentage', '');
                                        const splitPriceByPercentage = Number((((item?.finalRate || 0) * newValue) / 100).toFixed(3));

                                        const splitRateValue = parseFloat(splitPriceByPercentage);
                                        let splitAmount = calculateSplitAmount({ ...item, splitRate: splitRateValue }, values?.splitWiseType);

                                        calculateAmounts(
                                          {
                                            ...values,
                                            items: arr.map((itm, i) =>
                                              i === index
                                                ? {
                                                    ...itm,
                                                    rate: Number((parseFloat(item?.finalRate || 0) - splitRateValue).toFixed(3)).toString(),
                                                    splitRate: splitPriceByPercentage,
                                                    splitAmount: toDecimalString(splitAmount),
                                                    splitPercentage: newValue,
                                                  }
                                                : itm
                                            ),
                                          },
                                          setFieldValue,
                                          discountConfig
                                        );
                                      } else if (e?.target?.value === '') {
                                        calculateAmounts(
                                          {
                                            ...values,
                                            items: arr.map((itm, i) =>
                                              i === index
                                                ? {
                                                    ...itm,
                                                    rate: item?.finalRate,
                                                    splitRate: '',
                                                    splitAmount: 0,
                                                    splitPercentage: '',
                                                  }
                                                : itm
                                            ),
                                          },
                                          setFieldValue,
                                          discountConfig
                                        );
                                      }
                                    }}
                                    maxLength={3}
                                  />
                                  <input
                                    type="text"
                                    className="w-full bg-transparent p-2 text-sm font-normal text-gray-800 outline-none focus:border-b focus:border-primary"
                                    name={`items[${index}].splitRate`}
                                    value={item.splitRate || ''}
                                    onChange={e => {
                                      const newValue = e?.target?.value || '';
                                      if (newValue !== '' && !/^\d*\.?\d{0,3}$/.test(newValue)) {
                                        return;
                                      }
                                      setFieldValue(`items[${index}].splitRate`, newValue);

                                      // Only calculate if we have a valid number
                                      if (newValue && !isNaN(parseFloat(newValue))) {
                                        const splitRateValue = parseFloat(newValue);
                                        let splitAmount = calculateSplitAmount({ ...item, splitRate: splitRateValue }, values?.splitWiseType);
                                        if (splitRateValue > 0 && item?.finalRate >= splitRateValue) {
                                          calculateAmounts(
                                            {
                                              ...values,
                                              items: arr.map((itm, i) =>
                                                i === index
                                                  ? {
                                                      ...itm,
                                                      rate: Number((parseFloat(item?.finalRate || 0) - splitRateValue).toFixed(3)).toString(),
                                                      splitRate: newValue,
                                                      splitAmount: toDecimalString(splitAmount),
                                                      splitPercentage: toDecimalString((splitRateValue / item?.finalRate) * 100),
                                                    }
                                                  : itm
                                              ),
                                            },
                                            setFieldValue,
                                            discountConfig
                                          );
                                        } else if (!newValue || splitRateValue === 0) {
                                          calculateAmounts(
                                            {
                                              ...values,
                                              items: arr.map((itm, i) =>
                                                i === index
                                                  ? {
                                                      ...itm,
                                                      rate: item?.finalRate,
                                                      splitRate: '',
                                                      splitAmount: 0,
                                                      splitPercentage: '',
                                                    }
                                                  : itm
                                              ),
                                            },
                                            setFieldValue,
                                            discountConfig
                                          );
                                        }
                                      } else if (!newValue) {
                                        // Handle empty value
                                        calculateAmounts(
                                          {
                                            ...values,
                                            items: arr.map((itm, i) =>
                                              i === index
                                                ? {
                                                    ...itm,
                                                    rate: item?.finalRate,
                                                    splitRate: '',
                                                    splitAmount: 0,
                                                    splitPercentage: '',
                                                  }
                                                : itm
                                            ),
                                          },
                                          setFieldValue,
                                          discountConfig
                                        );
                                      }
                                    }}
                                    onBlur={handleBlur}
                                  />
                                  {errors.items?.[index]?.splitRate && touched.items?.[index]?.splitRate && (
                                    <div className="text-red-500 text-xs absolute bottom-0 right-0">{errors.items[index].splitRate}</div>
                                  )}
                                </>
                              </td>
                            )}
                            {!values?.isSplit && (
                              <td className="border-0 border-b border-gray-100 px-2 py-2 text-end align-top relative">
                                <input
                                  type="text"
                                  className="w-full bg-transparent px-1 py-1 h-[36px] text-right text-sm font-normal text-gray-800 outline-none"
                                  // name={`items[${index}].gst`}
                                  value={`${formatGstForDisplay(item.gst)} (${toDecimalString(item?.taxAmount || 0)})`}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  readOnly
                                />
                              </td>
                            )}
                            <td className="border-0 border-b border-gray-100 px-3 py-2 text-end align-top relative">
                              <input
                                type="text"
                                className="w-full bg-transparent px-1 py-1 h-[36px] text-right text-sm font-normal text-gray-800 outline-none"
                                name={`items[${index}].amount`}
                                value={item.amount != null && item.amount !== '' && !isNaN(Number(item.amount)) ? Number(item.amount).toFixed(2) : (item.amount ?? '')}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                readOnly
                              />
                              {errors.items?.[index]?.amount && touched.items?.[index]?.amount && <div className="text-red-500 text-xs absolute bottom-0 right-0">{errors.items[index].amount}</div>}
                            </td>
                            {(splitWiseType === 'Split By Price' || splitWiseType === 'Split By Qty') && isSplitSessionActive && (
                              <td className="border-0 border-b border-gray-100 px-4 py-2 text-end align-top relative">
                                <input
                                  type="text"
                                  className="w-full bg-transparent p-2 text-right text-sm font-normal text-gray-800 outline-none"
                                  name={`items[${index}].splitAmount`}
                                  value={item.splitAmount != null && item.splitAmount !== '' && !isNaN(Number(item.splitAmount)) ? Number(item.splitAmount).toFixed(2) : (item.splitAmount ?? '')}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  readOnly
                                />
                              </td>
                            )}
                            {!disabled && (
                              <td className="border-0 border-b border-gray-100 px-1 py-2 text-end align-top">
                                {arr?.length > 1 ? (
                                  <div className="flex h-[36px] items-center justify-end">
                                    <Icons.DeleteOutlined
                                      style={{ fontSize: 15, color: colorPalette.error[500], cursor: 'pointer' }}
                                      onClick={() => {
                                        const updatedItems = arr.filter((_, i) => i !== index);
                                        setFieldValue('items', updatedItems);
                                        calculateAmounts({ ...values, items: updatedItems }, setFieldValue, discountConfig);
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <div className="h-[36px]" />
                                )}
                              </td>
                            )}
                          </tr>
                        </Fragment>
                      );
                    })}
                    {!disabled && (
                      <CustomButton
                        type="primary"
                        className="mt-3 ms-1 mb-2"
                        onClick={() => push(EMPTY_ITEM_TEMPLATE)}
                        text={
                          <div className="flex gap-1 text-xs items-center">
                            <Icons.PlusCircleOutlined className="text-xs" />
                            <div>Add Item</div>
                          </div>
                        }
                      />
                    )}
                  </>
                );
              }}
            </FieldArray>
          </tbody>
        </table>
      </div>
      {viewItemDetail && (
        <ItemDrawerDetails
          viewItemDetail={viewItemDetail}
          setViewItemDetail={open => {
            setViewItemDetail(open);
            if (!open) setItemDrawerInitialTab('1');
          }}
          itemData={selectedItemData}
          customerId={moduleType === 'PURCHASE' ? undefined : selectedCustomerData?.id || selectedCustomerData?._id}
          customerName={moduleType === 'PURCHASE' ? undefined : selectedCustomerData?.customerDisplayName || selectedCustomerData?.companyName}
          vendorId={moduleType === 'PURCHASE' ? selectedCustomerData?.id || selectedCustomerData?._id : undefined}
          vendorName={moduleType === 'PURCHASE' ? selectedCustomerData?.customerDisplayName || selectedCustomerData?.vendorDisplayName || selectedCustomerData?.companyName : undefined}
          pageType={pageType}
          page={page}
          moduleType={moduleType}
          initialTab={itemDrawerInitialTab}
        />
      )}
    </div>
  );
};

// Shared item picker pieces so other line tables (e.g. Sample Catalog) look the same.
export { buildItemSelectOptions, itemSelectFilterOption, renderItemSelectOption, renderItemSelectDropdown };

export default ItemTable;
