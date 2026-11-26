export const itemSelectColumnHeader = { id: 'Item#', name: 'Item Name', balance: 'Available Stock' };

/** Two-column Item# / Item Name header (no Available Stock column). */
export const itemSelectFilterColumnHeader = { id: 'Item#', name: 'Item Name' };

export const itemSelectDropdownProps = {
  popupMatchSelectWidth: false,
  selectPopupClassName: 'item-select-dropdown-popup item-select-dropdown-popup--item-table',
  dropdownStyle: { minWidth: 520, width: 'min(720px, 70vw)', borderRadius: 0 },
  dropdownStyleWithStock: { minWidth: 620, width: 'min(820px, 75vw)', borderRadius: 0 },
};

export const buildItemFilterSelectOptions = (itemsDrop, { showAvailableStock = false } = {}) =>
  (itemsDrop || []).map(option => {
    const itemNo = option?.itemNo || option?.itemCode || '';
    const itemName = option?.itemName || '';
    const hasStock = option?.availableStock !== undefined && option?.availableStock !== null;
    const stockLabel = showAvailableStock && hasStock ? String(option.availableStock) : '';

    return {
      value: option?._id || option?.id,
      label: `${itemName} ${itemNo}`.replace(/\s+/g, ' ').trim(),
      columnId: itemNo || '-',
      columnName: itemName || '-',
      searchLabel: `${itemNo} ${itemName} ${stockLabel}`.replace(/\s+/g, ' ').trim(),
      ...(showAvailableStock
        ? {
            hasBalanceColumn: true,
            columnBalance: hasStock ? String(option.availableStock) : '-',
          }
        : {}),
    };
  });

export const getItemSelectDisplayLabel = item => {
  const itemNo = item?.itemNo || item?.itemCode || '';
  const itemName = item?.itemName || '';
  return `${itemName} ${itemNo}`.replace(/\s+/g, ' ').trim();
};
