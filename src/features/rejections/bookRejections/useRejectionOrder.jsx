import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { rejectionOrderSliceMethods, resetRejectionOrder as resetRejectionOrderAction, resetRejectionOrders as resetRejectionOrdersAction } from './rejectionOrder.slice';

export const useRejectionOrder = () => {
  const dispatch = useDispatch();

  const {
    rejectionOrders,
    rejectionOrder,
    pagination,
    create,
    update,
    remove,
    loading,
    submitLoading,
    deleteLoading,
    inventoryLoading,
    analysisLoading,
    invoiceDropLoading,
    inventoryData,
    inventoryExtras,
    analysisData,
    error,
  } = useSelector(state => state.rejectionOrder);

  const getRejectionOrders = useCallback(async payload => await dispatch(rejectionOrderSliceMethods.getRejectionOrders(payload)), [dispatch]);

  const createRejectionOrder = useCallback(async data => await dispatch(rejectionOrderSliceMethods.createRejectionOrder(data)), [dispatch]);

  const saveRejectionWorkflow = useCallback(async ({ rejectionOrderId, data }) => await dispatch(rejectionOrderSliceMethods.saveRejectionWorkflow({ rejectionOrderId, data })), [dispatch]);

  const updateRejectionBooking = useCallback(async ({ rejectionOrderId, data }) => await dispatch(rejectionOrderSliceMethods.updateRejectionBooking({ rejectionOrderId, data })), [dispatch]);

  const getRejectionOrderById = useCallback(async payload => await dispatch(rejectionOrderSliceMethods.getRejectionOrderById(payload)), [dispatch]);

  const removeRejectionOrder = useCallback(async payload => await dispatch(rejectionOrderSliceMethods.removeRejectionOrder(payload)), [dispatch]);

  const resetRejectionOrder = useCallback(() => dispatch(resetRejectionOrderAction()), [dispatch]);
  const resetRejectionOrders = useCallback(() => dispatch(resetRejectionOrdersAction()), [dispatch]);

  const getRejectionInventory = useCallback(async () => await dispatch(rejectionOrderSliceMethods.getRejectionOrderInventory()), [dispatch]);
  const getRejectionAnalysis = useCallback(async (payload = {}) => await dispatch(rejectionOrderSliceMethods.getRejectionOrderAnalysis(payload)), [dispatch]);
  const getRejectionRecoveryBom = useCallback(async payload => await dispatch(rejectionOrderSliceMethods.getRejectionRecoveryBom(payload)), [dispatch]);
  const fetchInvoiceDropdownPage = useCallback(payload => dispatch(rejectionOrderSliceMethods.getInvoiceDropdown(payload)).unwrap(), [dispatch]);

  return {
    rejectionOrders,
    rejectionOrder,
    pagination,
    create,
    update,
    remove,
    loading,
    submitLoading,
    deleteLoading,
    inventoryLoading,
    analysisLoading,
    invoiceDropLoading,
    inventoryData,
    inventoryExtras,
    analysisData,
    error,
    getRejectionOrders,
    createRejectionOrder,
    saveRejectionWorkflow,
    updateRejectionBooking,
    getRejectionOrderById,
    removeRejectionOrder,
    resetRejectionOrder,
    resetRejectionOrders,
    getRejectionInventory,
    getRejectionAnalysis,
    getRejectionRecoveryBom,
    fetchInvoiceDropdownPage,
  };
};
