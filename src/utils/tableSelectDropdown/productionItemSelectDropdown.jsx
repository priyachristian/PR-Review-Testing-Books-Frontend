export const ProductionDataDot = ({ isAdded }) => (
  <span
    className={`production-data-dot ${isAdded ? 'production-data-dot--added' : 'production-data-dot--missing'}`}
    title={isAdded ? 'Production data added' : 'Production data missing'}
    aria-label={isAdded ? 'Production data added' : 'Production data missing'}
  />
);

const resolveItemId = item => {
  if (item?.itemId != null && typeof item.itemId === 'object') {
    return item.itemId?._id ?? item.itemId?.id ?? null;
  }
  return item?.itemId ?? item?.value ?? item?._id ?? item?.id ?? null;
};

export const enrichItemWithMaster = (item, itemMasterList = []) => {
  const itemId = resolveItemId(item);
  const master = (itemMasterList || []).find(m => String(m?._id || m?.id) === String(itemId));
  const nested = item?.itemId && typeof item.itemId === 'object' ? item.itemId : null;

  const isProductionDataAdded = Boolean(
    item?.isProductionDataAdded ??
      master?.isProductionDataAdded ??
      item?.productionManageMethod ??
      master?.productionManageMethod ??
      nested?.productionManageMethod ??
      master?.productionData?.productionManageMethod
  );

  return {
    ...item,
    itemId: itemId ?? item?.itemId,
    itemNo: item?.itemNo || item?.itemCode || nested?.itemNo || nested?.itemCode || master?.itemNo || master?.itemCode,
    itemName: item?.itemName || nested?.itemName || master?.itemName,
    isProductionDataAdded,
  };
};

const resolveItemFields = item => {
  const itemNo = item?.itemNo || item?.itemCode || '-';
  const itemName = item?.itemName || '-';
  const value = resolveItemId(item);

  return {
    itemNo,
    itemName,
    value,
    isProductionDataAdded: Boolean(item?.isProductionDataAdded),
  };
};

export const productionItemSelectDropdownProps = {
  popupMatchSelectWidth: false,
  dropdownStyle: { minWidth: 520, width: 'min(720px, 70vw)', borderRadius: 0 },
  selectPopupClassName: 'item-select-dropdown-popup item-select-dropdown-popup--production-item',
};

export const productionItemColumnSelectHeader = {
  id: 'Item#',
  name: 'Item Name',
  productionData: 'Production Data',
};

export const buildProductionItemSelectOptions = (items, mapExtra, itemMasterList) =>
  (items || [])
    .map(item => {
      const enriched = enrichItemWithMaster(item, itemMasterList);
      const { itemNo, itemName, value, isProductionDataAdded } = resolveItemFields(enriched);
      if (!value) return null;

      return {
        value,
        label: `${itemName} ${itemNo}`.replace(/\s+/g, ' ').trim(),
        columnId: itemNo,
        columnName: itemName,
        hasProductionDataColumn: true,
        isProductionDataAdded,
        searchLabel: `${itemNo} ${itemName}`.replace(/\s+/g, ' ').trim(),
        ...(mapExtra ? mapExtra(enriched) : {}),
      };
    })
    .filter(Boolean);
