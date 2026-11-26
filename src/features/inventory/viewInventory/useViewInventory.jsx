import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  viewInventorySliceMethods,
  resetInventoryStock as resetInventoryStockAction,
  resetItemInventoryDetails as resetItemInventoryDetailsAction,
  resetItemInventoryBatches as resetItemInventoryBatchesAction,
  resetItemInventoryBatch as resetItemInventoryBatchAction,
  resetInventoryPendingPurchaseOrderQty as resetInventoryPendingPurchaseOrderQtyAction,
} from './viewInventory.slice';

export const useViewInventory = () => {
  const dispatch = useDispatch();

  const {
    inventoryStock,
    inventoryStockPagination,
    inventoryStockLoading,
    itemInventoryDetails,
    itemInventoryDetailsLoading,
    itemInventoryBatches,
    itemInventoryBatchesPagination,
    itemInventoryBatchesLoading,
    itemInventoryBatch,
    itemInventoryBatchLoading,
    inventoryPendingPurchaseOrderQty,
    inventoryPendingPurchaseOrderQtyLoading,
    error,
  } = useSelector(state => state.viewInventory);

  const getItemInventoryStock = useCallback(
    async payload => {
      const response = await dispatch(viewInventorySliceMethods.getItemInventoryStock(payload));
      return response;
    },
    [dispatch]
  );

  const getItemInventoryDetails = useCallback(
    async payload => {
      const response = await dispatch(viewInventorySliceMethods.getItemInventoryDetails(payload));
      return response;
    },
    [dispatch]
  );

  const getItemInventoryBatches = useCallback(
    async payload => {
      const response = await dispatch(viewInventorySliceMethods.getItemInventoryBatches(payload));
      return response;
    },
    [dispatch]
  );

  const getItemInventoryBatchById = useCallback(
    async payload => {
      const response = await dispatch(viewInventorySliceMethods.getItemInventoryBatchById(payload));
      return response;
    },
    [dispatch]
  );

  const getInventoryPendingPurchaseOrderQty = useCallback(
    async payload => {
      const response = await dispatch(viewInventorySliceMethods.getInventoryPendingPurchaseOrderQty(payload));
      return response;
    },
    [dispatch]
  );

  const resetInventoryStock = useCallback(() => dispatch(resetInventoryStockAction()), [dispatch]);

  const resetItemInventoryDetails = useCallback(() => dispatch(resetItemInventoryDetailsAction()), [dispatch]);

  const resetItemInventoryBatches = useCallback(() => dispatch(resetItemInventoryBatchesAction()), [dispatch]);

  const resetItemInventoryBatch = useCallback(() => dispatch(resetItemInventoryBatchAction()), [dispatch]);

  const resetInventoryPendingPurchaseOrderQty = useCallback(() => dispatch(resetInventoryPendingPurchaseOrderQtyAction()), [dispatch]);

  return {
    inventoryStock,
    inventoryStockPagination,
    inventoryStockLoading,
    itemInventoryDetails,
    itemInventoryDetailsLoading,
    itemInventoryBatches,
    itemInventoryBatchesPagination,
    itemInventoryBatchesLoading,
    itemInventoryBatch,
    itemInventoryBatchLoading,
    inventoryPendingPurchaseOrderQty,
    inventoryPendingPurchaseOrderQtyLoading,
    error,
    getItemInventoryStock,
    getItemInventoryDetails,
    getItemInventoryBatches,
    getItemInventoryBatchById,
    getInventoryPendingPurchaseOrderQty,
    resetInventoryStock,
    resetItemInventoryDetails,
    resetItemInventoryBatches,
    resetItemInventoryBatch,
    resetInventoryPendingPurchaseOrderQty,
  };
};
