import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  deliveryChallanSliceMethods,
  resetDeliveryChallan as resetDeliveryChallanAction,
  resetDeliveryChallans as resetDeliveryChallansAction,
  resetDeliveryChallanDropConvert as resetDeliveryChallanDropConvertAction,
  resetPendingItems as resetPendingItemsAction,
} from './deliveryChallan.slice';

export const useDeliveryChallan = () => {
  const dispatch = useDispatch();

  const {
    deliveryChallans,
    deliveryChallan,
    deliveryChallanFile,
    pagination,
    create,
    remove,
    update,
    loading,
    submitLoading,
    deleteLoading,
    submitWithStatusLoading,
    uploading,
    droploading,
    error,
    deliveryChallanDropForConvert,
    pendingItems,
    pendingItemsLoading,
    exportLoading,
  } = useSelector(state => state.deliveryChallan);

  const getDeliveryChallans = useCallback(
    async payload => {
      const response = await dispatch(deliveryChallanSliceMethods.getDeliveryChallans(payload));
      return response;
    },
    [dispatch]
  );

  const createDeliveryChallans = useCallback(
    async ({ deliveryChallanData, attachmentFile }) => {
      const response = await dispatch(
        deliveryChallanSliceMethods.createDeliveryChallans({
          deliveryChallanData,
          attachmentFile,
        })
      );
      return response;
    },
    [dispatch]
  );

  const updateDeliveryChallans = useCallback(
    async ({ deliveryId, deliveryChallanData, attachmentFile }) => {
      const response = await dispatch(
        deliveryChallanSliceMethods.updateDeliveryChallans({
          deliveryId,
          deliveryChallanData,
          attachmentFile,
        })
      );
      return response;
    },
    [dispatch]
  );

  const deliveryFileUpload = useCallback(
    async fileData => {
      const response = await dispatch(deliveryChallanSliceMethods.deliveryFileUpload(fileData)).unwrap();
      return response;
    },
    [dispatch]
  );

  const updateStatus = useCallback(
    async payload => {
      const response = await dispatch(deliveryChallanSliceMethods.updateStatus(payload)).unwrap();
      return response;
    },
    [dispatch]
  );

  const getDeliveryChallanById = useCallback(
    async payload => {
      const response = await dispatch(deliveryChallanSliceMethods.getDeliveryChallanById(payload));
      return response;
    },
    [dispatch]
  );

  const getDeliveryChallanDropdownForConvert = useCallback(
    async payload => {
      const response = await dispatch(deliveryChallanSliceMethods.getDeliveryChallanDropdownForConvert(payload));
      return response;
    },
    [dispatch]
  );

  const getPendingItemsDeliveryChallan = useCallback(
    async payload => {
      const response = await dispatch(deliveryChallanSliceMethods.getPendingItemsDeliveryChallan(payload)).unwrap();
      return response;
    },
    [dispatch]
  );

  const resetDeliveryChallan = useCallback(() => dispatch(resetDeliveryChallanAction()), [dispatch]);
  const resetDeliveryChallans = useCallback(() => dispatch(resetDeliveryChallansAction()), [dispatch]);
  const resetDeliveryChallanDropConvert = useCallback(() => dispatch(resetDeliveryChallanDropConvertAction()), [dispatch]);

  const resetPendingItems = useCallback(() => dispatch(resetPendingItemsAction()), [dispatch]);

  const removeDeliveryChallan = useCallback(
    async payload => {
      const response = await dispatch(deliveryChallanSliceMethods.removeDeliveryChallan(payload)).unwrap();
      return response;
    },
    [dispatch]
  );

  const getDeliveryChallanExports = useCallback(async payload => await dispatch(deliveryChallanSliceMethods.getDeliveryChallanExports(payload)).unwrap(), [dispatch]);

  return {
    deliveryChallans,
    deliveryChallan,
    deliveryChallanFile,
    pagination,
    create,
    update,
    remove,
    loading,
    submitLoading,
    deleteLoading,
    submitWithStatusLoading,
    uploading,
    droploading,
    error,
    deliveryChallanDropForConvert,
    pendingItems,
    pendingItemsLoading,
    exportLoading,
    getDeliveryChallans,
    getDeliveryChallanExports,
    createDeliveryChallans,
    updateDeliveryChallans,
    deliveryFileUpload,
    updateStatus,
    getDeliveryChallanById,
    resetDeliveryChallan,
    removeDeliveryChallan,
    resetDeliveryChallans,
    getDeliveryChallanDropdownForConvert,
    getPendingItemsDeliveryChallan,
    resetDeliveryChallanDropConvert,
    resetPendingItems,
  };
};
