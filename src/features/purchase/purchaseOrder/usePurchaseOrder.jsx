import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  purchaseOrderSliceMethods,
  resetPurchaseOrder as resetPurchaseOrderAction,
  resetPurchaseOrderDropForConvert as resetPurchaseOrderDropForConvertAction,
  resetPendingItems as resetPendingItemsAction,
  resetPurchaseOrders as resetPurchaseOrdersAction,
} from '@/features/purchase/purchaseOrder/purchaseOrder.slice';

export const usePurchaseOrder = () => {
  const dispatch = useDispatch();

  const {
    purchaseOrders,
    purchaseOrder,
    purchaseOrderFile,
    pagination,
    purchaseAccountDrop,
    purchaseOrderDropForConvert,
    pendingItems,
    remove,
    create,
    update,
    loading,
    submitLoading,
    deleteLoading,
    submitWithStatusLoading,
    uploading,
    droploading,
    pendingItemLoading,
    exportLoading,
    error,
  } = useSelector(state => state.purchaseOrder);

  const getPurchaseOrder = useCallback(
    async payload => {
      return await dispatch(purchaseOrderSliceMethods.getPurchaseOrder(payload));
    },
    [dispatch]
  );

  const createPurchaseOrders = useCallback(
    async purchaseOrderData => {
      return await dispatch(purchaseOrderSliceMethods.createPurchaseOrders(purchaseOrderData));
    },
    [dispatch]
  );

  const updatePurchaseOrders = useCallback(
    async ({ purchaseId, purchaseOrderData }) => {
      return await dispatch(purchaseOrderSliceMethods.updatePurchaseOrders({ purchaseId, purchaseOrderData }));
    },
    [dispatch]
  );

  const purchaseOrderFileUpload = useCallback(
    async fileData => {
      return await dispatch(purchaseOrderSliceMethods.purchaseOrderFileUpload(fileData)).unwrap();
    },
    [dispatch]
  );

  const updateStatus = useCallback(
    async payload => {
      return await dispatch(purchaseOrderSliceMethods.updateStatus(payload)).unwrap();
    },
    [dispatch]
  );

  const getPurchaseOrderById = useCallback(
    async payload => {
      return await dispatch(purchaseOrderSliceMethods.getPurchaseOrderById(payload));
    },
    [dispatch]
  );

  const resetPurchaseOrder = useCallback(() => dispatch(resetPurchaseOrderAction()), [dispatch]);
  const resetPurchaseOrders = useCallback(() => dispatch(resetPurchaseOrdersAction()), [dispatch]);

  const getPurchaseOrderDropdownforConvert = useCallback(
    async payload => {
      return await dispatch(purchaseOrderSliceMethods.getPurchaseOrderDropdownforConvert(payload));
    },
    [dispatch]
  );

  const getPendingItemsPurchaseOrder = useCallback(
    async payload => {
      return await dispatch(purchaseOrderSliceMethods.getPendingItemsPurchaseOrder(payload));
    },
    [dispatch]
  );

  const resetPurchaseOrderDropForConvert = useCallback(() => dispatch(resetPurchaseOrderDropForConvertAction()), [dispatch]);

  const resetPendingItems = useCallback(() => dispatch(resetPendingItemsAction()), [dispatch]);

  const removePurchaseOrder = useCallback(
    async payload => {
      return await dispatch(purchaseOrderSliceMethods.removePurchaseOrder(payload)).unwrap();
    },
    [dispatch]
  );

  const getPurchaseOrderExports = useCallback(async payload => await dispatch(purchaseOrderSliceMethods.getPurchaseOrderExports(payload)).unwrap(), [dispatch]);

  return {
    purchaseOrders,
    purchaseOrder,
    purchaseOrderFile,
    pagination,
    purchaseAccountDrop,
    purchaseOrderDropForConvert,
    pendingItems,
    remove,
    create,
    update,
    loading,
    submitLoading,
    deleteLoading,
    submitWithStatusLoading,
    uploading,
    droploading,
    pendingItemLoading,
    exportLoading,
    error,
    getPurchaseOrder,
    createPurchaseOrders,
    updatePurchaseOrders,
    purchaseOrderFileUpload,
    updateStatus,
    getPurchaseOrderById,
    resetPurchaseOrder,
    getPurchaseOrderDropdownforConvert,
    getPendingItemsPurchaseOrder,
    resetPurchaseOrderDropForConvert,
    resetPendingItems,
    removePurchaseOrder,
    resetPurchaseOrders,
    getPurchaseOrderExports,
  };
};
