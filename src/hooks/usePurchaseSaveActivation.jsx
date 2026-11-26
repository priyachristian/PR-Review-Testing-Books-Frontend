import { useEffect, useState } from 'react';

// Components
import Toast from '@/components/ui/common/Toast';

// Extras
import { confirmModalEnum } from '@/utils/constants';
import { isLineUnavailableInWarehouse } from '@/utils/itemLineStatus';
import { isCustomerActiveInBranch } from '@/utils/salesModuleUtils';

// Save-time check for purchase documents: vendor active in the branch, every line item active in the warehouse.
const usePurchaseSaveActivation = ({ vendor, branchId, itemsDrop, itemsDropLoading, getVendorDropList }) => {
  const [pendingActivation, setPendingActivation] = useState(null);
  // undefined: not checked or failed, null: loading, boolean: vendor found in the branch vendor list.
  const [vendorInBranchList, setVendorInBranchList] = useState(undefined);
  const vendorId = vendor?._id || vendor?.id;

  // Read-only vendors (edit/conversion) may lack branch rows; the vendor list holds only vendors active in the branch.
  useEffect(() => {
    setVendorInBranchList(undefined);
    if (!getVendorDropList || !vendorId || !branchId) return;
    const controller = new AbortController();
    setVendorInBranchList(null);
    getVendorDropList({ branchId, signal: controller.signal }).then(action => {
      if (controller.signal.aborted) return;
      const fulfilled = action?.meta?.requestStatus === 'fulfilled';
      setVendorInBranchList(fulfilled ? (action.payload?.data || []).some(item => item?._id === vendorId) : undefined);
    });
    return () => controller.abort();
  }, [getVendorDropList, vendorId, branchId]);

  // Returns payload flags, or null when the save must stop (still checking, or confirm modal opened).
  const resolveActivation = (values, activationConfirmed = false) => {
    const lines = values?.items || [];
    // itemsDrop is null until loaded; an empty list is valid (warehouse has no active items yet).
    const itemsDropReady = !itemsDropLoading && Array.isArray(itemsDrop);
    if (vendorInBranchList === null || (lines.length > 0 && !itemsDropReady)) {
      Toast.info(confirmModalEnum.DOCUMENT_ACTIVATION.CHECKING_MESSAGE);
      return null;
    }

    const needsVendor = typeof vendorInBranchList === 'boolean' ? !vendorInBranchList : Array.isArray(vendor?.branch) && !!branchId && !isCustomerActiveInBranch(vendor, branchId);
    const unavailableItems = lines.filter(item => isLineUnavailableInWarehouse(item, { itemsDrop, itemsDropReady }));
    if (!needsVendor && !unavailableItems.length) return {};

    if (!activationConfirmed) {
      const itemNames = [...new Set(unavailableItems.map(item => item?.itemName || item?.itemNo || 'Item'))];
      setPendingActivation({ values, needsVendor, itemNames });
      return null;
    }
    return {
      ...(needsVendor && { activateVendorBranch: true }),
      ...(unavailableItems.length > 0 && { activateItemWarehouse: true }),
    };
  };

  return { pendingActivation, setPendingActivation, resolveActivation };
};

export default usePurchaseSaveActivation;
