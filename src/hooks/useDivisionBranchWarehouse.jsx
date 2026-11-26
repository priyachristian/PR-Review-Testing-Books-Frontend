import { useCallback, useEffect, useMemo, useState } from 'react';

// Components
import { Modal } from '@/components/AntDComponent';

// Hooks
import { useCustomer } from '@/features/sales/customer/useCustomer';
import useModulePermissions from 'hooks/useModulePermissions';
import { usePriceList } from '@/features/allMaster/priceList/usePriceList';

// Extras
import { RESOURCES } from '@/utils/jsonFile';

export const normalizeDivisionBranchWarehouseId = value => {
  if (value == null || value === '') return '';
  if (typeof value === 'string') return value;
  return value?.id ?? value?._id ?? '';
};

export const getDivisionBranchWarehouseFromEntity = entity => {
  if (!entity) {
    return { divisionId: '', branchId: '', warehouseId: '' };
  }
  return {
    divisionId: normalizeDivisionBranchWarehouseId(entity.divisionId),
    branchId: normalizeDivisionBranchWarehouseId(entity.branchId),
    warehouseId: normalizeDivisionBranchWarehouseId(entity.warehouseId),
  };
};

/** Resolve division/branch IDs from a warehouse dropdown row (populated divisionId/branchId). */
export const getDivisionBranchFromWarehouseOption = warehouse => {
  if (!warehouse) {
    return { divisionId: '', branchId: '' };
  }
  return {
    divisionId: normalizeDivisionBranchWarehouseId(warehouse.divisionId),
    branchId: normalizeDivisionBranchWarehouseId(warehouse.branchId),
  };
};

/** Resolve division ID from a branch dropdown row (populated divisionId). */
export const getDivisionFromBranchOption = branch => {
  if (!branch) {
    return { divisionId: '' };
  }
  return {
    divisionId: normalizeDivisionBranchWarehouseId(branch.divisionId),
  };
};

export const getBranchSelectPlaceholder = (warehouseRequiresCascade, { divisionId } = {}) => {
  if (warehouseRequiresCascade && !divisionId) {
    return 'Select division first';
  }
  return 'Select Branch';
};

export const getWarehouseSelectPlaceholder = (warehouseRequiresCascade, { divisionId, branchId } = {}) => {
  if (warehouseRequiresCascade && !branchId) {
    return divisionId ? 'Select branch first' : 'Select division first';
  }
  return 'Select Warehouse';
};

export const getCustomerIdFromEntity = entity => {
  if (!entity?.customerId) return '';
  const c = entity.customerId;
  return typeof c === 'string' ? c : (c?.id ?? c?._id ?? '');
};

export const buildConversionItemsDrop = (items, warehouseItems = []) => {
  if (!items?.length) return [];
  return items.map(item => {
    const id = item?.itemId?.id || item?.itemId?._id || item?.itemId;
    const warehouseItem = warehouseItems?.find(option => String(option?._id || option?.id) === String(id));
    return {
      _id: id,
      id,
      itemName: item?.itemName || '',
      itemNo: item?.itemNo || '',
      hsnCode: item?.hsnCode || '',
      itemUnitId: warehouseItem?.itemUnitId ?? null,
      itemUnit: warehouseItem?.itemUnitId?.name || warehouseItem?.itemUnit || '',
      stockInUnit: warehouseItem?.stockInUnit ?? null,
      stockOutUnit: warehouseItem?.stockOutUnit ?? null,
      unitConversions: warehouseItem?.unitConversions || [],
      convertedStockDetails: warehouseItem?.convertedStockDetails || [],
      salesInformation: warehouseItem?.salesInformation,
      purchaseInformation: warehouseItem?.purchaseInformation,
      gst: item?.gst || '0',
      trackInventory: item?.itemId?.trackInventory ?? warehouseItem?.trackInventory,
      itemCategory: item?.itemId?.itemCategory ?? warehouseItem?.itemCategory,
      availableStock: warehouseItem?.availableStock,
    };
  });
};

const useDivisionBranchWarehouse = (initialEntity = null, fetchOptions = null, loadCompanyBranches = false, loadCompanyWarehouses = false) => {
  // Use lazy initialization to avoid recalculating on every render
  // Calculate once and reuse for all three state initializations
  const [selectedDivisionId, setSelectedDivisionId] = useState(() => {
    const initial = getDivisionBranchWarehouseFromEntity(initialEntity);
    return initial.divisionId;
  });
  const [selectedBranchId, setSelectedBranchId] = useState(() => {
    const initial = getDivisionBranchWarehouseFromEntity(initialEntity);
    return initial.branchId;
  });
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(() => {
    const initial = getDivisionBranchWarehouseFromEntity(initialEntity);
    return initial.warehouseId;
  });

  const setFromEntity = useCallback(entity => {
    const { divisionId, branchId, warehouseId } = getDivisionBranchWarehouseFromEntity(entity);
    setSelectedDivisionId(divisionId);
    setSelectedBranchId(branchId);
    setSelectedWarehouseId(warehouseId);
  }, []);

  const reset = useCallback(() => {
    setSelectedDivisionId('');
    setSelectedBranchId('');
    setSelectedWarehouseId('');
  }, []);

  const getDivDropDown = fetchOptions?.getDivDropDown;
  const getPriceListDropdown = fetchOptions?.getPriceListDropdown;
  const onStep1Cleanup = fetchOptions?.onStep1Cleanup;

  useEffect(() => {
    if (!fetchOptions) return;
    if (!getDivDropDown && !getPriceListDropdown) return;

    const controller = new AbortController();
    const payload = { signal: controller.signal };

    getDivDropDown?.(payload);
    if (getPriceListDropdown) {
      getPriceListDropdown(payload);
    }

    return () => {
      if (onStep1Cleanup) onStep1Cleanup();
      controller.abort();
    };
  }, [fetchOptions, getDivDropDown, getPriceListDropdown, onStep1Cleanup]);

  const getBranchDropDown = fetchOptions?.getBranchDropDown;

  // Division-scoped branches when a division is selected.
  // Optional company-wide branch fetch (no divisionId) only when loadCompanyBranches is on
  // (branch-first). Skip it after cascade mode — next branch load should wait for divisionId.
  useEffect(() => {
    if (!getBranchDropDown) return;

    const controller = new AbortController();

    if (selectedDivisionId) {
      getBranchDropDown({
        divisionId: selectedDivisionId,
        signal: controller.signal,
      });
    } else if (loadCompanyBranches) {
      getBranchDropDown({
        signal: controller.signal,
      });
    }

    return () => controller.abort();
  }, [selectedDivisionId, getBranchDropDown, loadCompanyBranches]);

  const getCustomerDropList = fetchOptions?.getCustomerDropList;
  const getWarehouseDrop = fetchOptions?.getWarehouseDrop;

  // Branch-scoped warehouses + customers when a branch is selected.
  // Optional company-wide warehouse fetch (no branchId) only when loadCompanyWarehouses is on
  // (warehouse-first). Skip it after cascade mode — division change clears branch and the
  // next warehouse load should wait for a new branchId.
  useEffect(() => {
    if (!fetchOptions) return;
    if (!getCustomerDropList && !getWarehouseDrop) return;

    const controller = new AbortController();

    if (selectedBranchId) {
      getCustomerDropList?.({
        branchId: selectedBranchId,
        signal: controller.signal,
      });
      getWarehouseDrop?.({
        branchId: selectedBranchId,
        signal: controller.signal,
      });
    } else if (loadCompanyWarehouses) {
      getWarehouseDrop?.({
        signal: controller.signal,
      });
    }

    return () => controller.abort();
  }, [fetchOptions, selectedBranchId, getCustomerDropList, getWarehouseDrop, loadCompanyWarehouses]);

  const getAllItemDrop = fetchOptions?.getAllItemDrop;
  const skipAutoItemDrop = fetchOptions?.skipAutoItemDrop;

  useEffect(() => {
    if (!fetchOptions || !selectedWarehouseId || !getAllItemDrop || skipAutoItemDrop) return;

    const controller = new AbortController();
    getAllItemDrop({
      warehouseId: selectedWarehouseId,
      signal: controller.signal,
    });
    return () => controller.abort();
  }, [fetchOptions, selectedWarehouseId, getAllItemDrop, skipAutoItemDrop]);

  return {
    selectedDivisionId,
    selectedBranchId,
    selectedWarehouseId,
    setSelectedDivisionId,
    setSelectedBranchId,
    setSelectedWarehouseId,
    setFromEntity,
    reset,
  };
};

const SALES_DOCUMENT_RESOURCES = new Set([RESOURCES.QUOTES, RESOURCES.SALES_ORDER, RESOURCES.DELIVERY_CHALLANS, RESOURCES.INVOICES, RESOURCES.RECURRING_INVOICE, RESOURCES.CREDIT_NOTES]);
const PURCHASE_DOCUMENT_RESOURCES = new Set([RESOURCES.PURCHASE_ORDER, RESOURCES.GRPO, RESOURCES.BILLS, RESOURCES.RECURRING_BILLS, RESOURCES.DEBIT_NOTE]);

export const useDivisionBranchWarehouseWithResource = (initialEntity, resource, options = {}) => {
  const {
    skipLocationDropdowns = false,
    skipItemDropdown = false,
    skipAutoItemDrop = false,
    // When true, supports branch-first selection (company-wide branch dropdown + auto-fill division).
    enableBranchFirst = false,
    // When true, supports warehouse-first selection (company-wide warehouse dropdown + cascade lock).
    enableWarehouseFirst = false,
    moduleConfig = null,
    // Customer is fixed from the source document: location changes keep it and the customer list is skipped.
    lockCustomer = false,
  } = options;
  const permissions = useModulePermissions(resource);
  const priceList = usePriceList();
  const customer = useCustomer();

  const [selectedCustomerId, setSelectedCustomerId] = useState(() => getCustomerIdFromEntity(initialEntity));
  const [warehouseRequiresCascade, setWarehouseRequiresCascade] = useState(false);

  // Extract specific functions to avoid object reference changes
  const getCustomerDropList = customer.getCustomerDropList;
  const getPriceListDropdown = priceList.getPriceListDropdown;
  const resetPriceListDrop = priceList.resetPriceListDrop;

  // Memoize cleanup function to prevent recreation
  const onStep1Cleanup = useCallback(() => {
    resetPriceListDrop();
    Modal.destroyAll();
  }, [resetPriceListDrop]);

  // Company-wide lists when no default branch and cascade is unlocked.
  const canLoadCompanyLocationDropdowns = !skipLocationDropdowns && Boolean(moduleConfig) && !moduleConfig?.defaultConfiguration?.branchId && !warehouseRequiresCascade;
  const loadCompanyBranches = enableBranchFirst && canLoadCompanyLocationDropdowns;
  const loadCompanyWarehouses = enableWarehouseFirst && canLoadCompanyLocationDropdowns;

  const fetchOptions = useMemo(
    () =>
      permissions.getDivDropDown
        ? {
            getDivDropDown: skipLocationDropdowns ? undefined : permissions.getDivDropDown,
            getBranchDropDown: skipLocationDropdowns ? undefined : permissions.getBranchDropDown,
            getWarehouseDrop: skipLocationDropdowns ? undefined : permissions.getWarehouseDrop,
            // Skip getAllItemDrop for EXPENSES, RECURRING_EXPENSES, PAYMENT_MADE, PAYMENT_RECEIVED
            getAllItemDrop:
              skipItemDropdown ||
              resource === RESOURCES.EXPENSES ||
              resource === RESOURCES.RECURRING_EXPENSES ||
              resource === RESOURCES.PAYMENT_MADE ||
              resource === RESOURCES.PAYMENT_RECEIVED ||
              resource === RESOURCES.MANUAL_JOURNALS
                ? undefined
                : payload =>
                    permissions.getAllItemDrop({
                      ...payload,
                      ...(SALES_DOCUMENT_RESOURCES.has(resource) ? { isSellable: true } : {}),
                      ...(PURCHASE_DOCUMENT_RESOURCES.has(resource) ? { isPurchasable: true } : {}),
                    }),
            getCustomerDropList:
              skipLocationDropdowns || lockCustomer || resource === RESOURCES.PAYMENT_MADE || resource === RESOURCES.INVENTORY_ADJUSTMENT || resource === RESOURCES.MANUAL_JOURNALS
                ? undefined
                : getCustomerDropList,
            getPriceListDropdown:
              resource === RESOURCES.VENDORS ||
              resource === RESOURCES.EXPENSES ||
              resource === RESOURCES.RECURRING_EXPENSES ||
              resource === RESOURCES.PURCHASE_ORDER ||
              resource === RESOURCES.GRPO ||
              resource === RESOURCES.BILLS ||
              resource === RESOURCES.RECURRING_BILLS ||
              resource === RESOURCES.PAYMENT_MADE ||
              resource === RESOURCES.PAYMENT_RECEIVED ||
              resource === RESOURCES.REJECTION_ORDERS ||
              resource === RESOURCES.INVENTORY_ADJUSTMENT ||
              resource === RESOURCES.MANUAL_JOURNALS
                ? undefined
                : getPriceListDropdown,
            onStep1Cleanup,
            skipAutoItemDrop,
          }
        : null,
    [
      permissions.getDivDropDown,
      permissions.getBranchDropDown,
      permissions.getWarehouseDrop,
      permissions.getAllItemDrop,
      getCustomerDropList,
      getPriceListDropdown,
      onStep1Cleanup,
      resource,
      skipLocationDropdowns,
      lockCustomer,
      skipItemDropdown,
      skipAutoItemDrop,
    ]
  );

  const divisionBranchWarehouse = useDivisionBranchWarehouse(initialEntity, fetchOptions, loadCompanyBranches, loadCompanyWarehouses);

  const setFromEntity = useCallback(
    entity => {
      divisionBranchWarehouse.setFromEntity(entity);
      setSelectedCustomerId(getCustomerIdFromEntity(entity));
    },
    [divisionBranchWarehouse.setFromEntity]
  );

  const applyBranchSelection = useCallback(
    (branchId, { setFieldValue, setFieldTouched, values }) => {
      const nextBranchId = branchId || '';
      setFieldTouched?.('branchId', false, false);
      setFieldTouched?.('warehouseId', false, false);
      divisionBranchWarehouse.setSelectedBranchId(nextBranchId);
      setFieldValue('warehouseId', null, false);
      divisionBranchWarehouse.setSelectedWarehouseId('');
      if (!lockCustomer) {
        setSelectedCustomerId(null);
        if (values && Object.prototype.hasOwnProperty.call(values, 'customerId')) {
          setFieldValue('customerId', null, false);
        }
      }
      if (!nextBranchId) return;

      const selectedBranch = (permissions.branchDrop || []).find(b => (b.id ?? b._id) === nextBranchId);
      const { divisionId } = getDivisionFromBranchOption(selectedBranch);

      if (divisionId) {
        setFieldTouched?.('divisionId', false, false);
        divisionBranchWarehouse.setSelectedDivisionId(divisionId);
        setFieldValue('divisionId', divisionId, false);
      }
    },
    [permissions.branchDrop, lockCustomer, divisionBranchWarehouse.setSelectedBranchId, divisionBranchWarehouse.setSelectedWarehouseId, divisionBranchWarehouse.setSelectedDivisionId]
  );

  const applyWarehouseSelection = useCallback(
    (warehouseId, { setFieldValue, setFieldTouched, currentBranchId, values }) => {
      const nextWarehouseId = warehouseId || '';
      divisionBranchWarehouse.setSelectedWarehouseId(nextWarehouseId);
      if (!nextWarehouseId) return;

      const selectedWarehouse = (permissions.warehouseDrop || []).find(w => (w.id ?? w._id) === nextWarehouseId);
      const { divisionId, branchId } = getDivisionBranchFromWarehouseOption(selectedWarehouse);

      if (divisionId) {
        setFieldTouched('divisionId', false, false);
        divisionBranchWarehouse.setSelectedDivisionId(divisionId);
        setFieldValue('divisionId', divisionId, false);
      }

      if (branchId) {
        const branchChanged = branchId !== currentBranchId;
        setFieldTouched('branchId', false, false);
        divisionBranchWarehouse.setSelectedBranchId(branchId);
        setFieldValue('branchId', branchId, false);
        if (branchChanged && !lockCustomer) {
          setSelectedCustomerId(null);
          if (values && Object.prototype.hasOwnProperty.call(values, 'customerId')) {
            setFieldValue('customerId', null, false);
          }
        }
      }
    },
    [permissions.warehouseDrop, lockCustomer, divisionBranchWarehouse.setSelectedWarehouseId, divisionBranchWarehouse.setSelectedDivisionId, divisionBranchWarehouse.setSelectedBranchId]
  );

  // Memoize customer validation to avoid recalculation on every render
  const customerIdFromEntity = useMemo(() => getCustomerIdFromEntity(initialEntity), [initialEntity]);

  const customerNotInBranch = useMemo(() => {
    if (lockCustomer || !customerIdFromEntity) return false;
    if (!customer.customerDropDownList?.length) return false;
    return !customer.customerDropDownList.find(c => c.id === customerIdFromEntity);
  }, [lockCustomer, customerIdFromEntity, customer.customerDropDownList]);

  // Memoize return object to prevent unnecessary re-renders in consuming components
  return useMemo(
    () => ({
      ...divisionBranchWarehouse,
      setFromEntity,
      divDrop: permissions.divDrop,
      divisionLoading: permissions.divisionLoading,
      branchDrop: permissions.branchDrop,
      branchLoading: permissions.branchLoading,
      warehouseDrop: permissions.warehouseDrop,
      warehouseLoading: permissions.warehouseLoading,
      allItemDrop: permissions.allItemDrop,
      allItemDropLoading: permissions.allItemDropLoading,
      getAllItemDrop: permissions.getAllItemDrop,
      customerAddress: permissions.customerAddress,
      addressLoading: permissions.addressLoading,
      getCustomerAddress: permissions.getCustomerAddress,
      resetCustomerAddress: permissions.resetCustomerAddress,
      isSplitWise: permissions.isSplitWise,
      isSplitSessionActive: permissions.isSplitSessionActive,
      customerDropDownList: customer.customerDropDownList,
      getCustomerDropList: customer.getCustomerDropList,
      resetCustomerDropDownList: customer.resetCustomerDropDownList,
      customerLoading: customer.loading,
      priceListDrop: priceList.priceListDrop,
      getPriceListDropdown: priceList.getPriceListDropdown,
      resetPriceListDrop: priceList.resetPriceListDrop,
      priceListDropLoading: priceList.loading,
      selectedCustomerId,
      setSelectedCustomerId,
      customerNotInBranch,
      warehouseRequiresCascade,
      setWarehouseRequiresCascade,
      applyBranchSelection,
      applyWarehouseSelection,
    }),
    [
      divisionBranchWarehouse,
      setFromEntity,
      permissions.divDrop,
      permissions.divisionLoading,
      permissions.branchDrop,
      permissions.branchLoading,
      permissions.warehouseDrop,
      permissions.warehouseLoading,
      permissions.allItemDrop,
      permissions.allItemDropLoading,
      permissions.getAllItemDrop,
      permissions.customerAddress,
      permissions.addressLoading,
      permissions.getCustomerAddress,
      permissions.resetCustomerAddress,
      permissions.isSplitWise,
      permissions.isSplitSessionActive,
      customer.customerDropDownList,
      customer.getCustomerDropList,
      customer.resetCustomerDropDownList,
      customer.loading,
      priceList.priceListDrop,
      priceList.getPriceListDropdown,
      priceList.resetPriceListDrop,
      priceList.loading,
      selectedCustomerId,
      customerNotInBranch,
      warehouseRequiresCascade,
      applyBranchSelection,
      applyWarehouseSelection,
    ]
  );
};

export default useDivisionBranchWarehouse;
