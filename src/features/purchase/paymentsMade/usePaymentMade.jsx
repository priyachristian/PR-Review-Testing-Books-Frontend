import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  paymentsMadeSliceMethods,
  clearPaymentMadeInvoiceDrop as clearPaymentMadeInvoiceDropAction,
  resetPaymentMade as resetPaymentMadeAction,
  resetPaymentsMade as resetPaymentsMadeAction,
} from '@/features/purchase/paymentsMade/paymentMade.slice';

export const usePaymentMade = () => {
  const dispatch = useDispatch();

  const {
    paymentsMade,
    paymentMade,
    pagination,
    paymentsMadeInvoiceDrop,
    paymentsMadeOpeningBalance,
    paymentsMadePendingExpenses,
    nextPaymentMadeId,
    create,
    remove,
    update,
    loading,
    submitLoading,
    deleteLoading,
    droploading,
    error,
    approveLoading,
    rejectLoading,
    cancelLoading,
    applyBillLoading,
    refundLoading,
    removeApplyBillLoading,
    autoApplyLoading,
    exportLoading,
  } = useSelector(state => state.paymentMade);

  const getPaymentsMade = useCallback(
    async payload => {
      return await dispatch(paymentsMadeSliceMethods.getPaymentsMade(payload));
    },
    [dispatch]
  );

  const getPaymentsMadeExports = useCallback(
    async payload => {
      return await dispatch(paymentsMadeSliceMethods.getPaymentsMadeExports(payload)).unwrap();
    },
    [dispatch]
  );

  const createPaymentsMade = useCallback(
    async paymentMadeData => {
      return await dispatch(paymentsMadeSliceMethods.createPaymentsMade(paymentMadeData)).unwrap();
    },
    [dispatch]
  );

  const updatePaymentsMade = useCallback(
    async ({ paymentId, paymentMadeData }) => {
      return await dispatch(paymentsMadeSliceMethods.updatePaymentsMade({ paymentId, paymentMadeData })).unwrap();
    },
    [dispatch]
  );

  const getPaymentsMadeInvoice = useCallback(
    async payload => {
      return await dispatch(paymentsMadeSliceMethods.getPaymentsMadeInvoice(payload));
    },
    [dispatch]
  );

  const approvePaymentsMade = useCallback(
    async payload => {
      return await dispatch(paymentsMadeSliceMethods.approvePaymentsMade(payload)).unwrap();
    },
    [dispatch]
  );

  const rejectPaymentsMade = useCallback(
    async payload => {
      return await dispatch(paymentsMadeSliceMethods.rejectPaymentsMade(payload)).unwrap();
    },
    [dispatch]
  );

  const cancelPaymentsMade = useCallback(
    async payload => {
      return await dispatch(paymentsMadeSliceMethods.cancelPaymentsMade(payload)).unwrap();
    },
    [dispatch]
  );

  const getPaymentMadeById = useCallback(
    async payload => {
      return await dispatch(paymentsMadeSliceMethods.getPaymentMadeById(payload)).unwrap();
    },
    [dispatch]
  );

  const resetPaymentMade = useCallback(() => dispatch(resetPaymentMadeAction()), [dispatch]);
  const clearPaymentMadeInvoiceDrop = useCallback(() => dispatch(clearPaymentMadeInvoiceDropAction()), [dispatch]);
  const resetPaymentsMade = useCallback(() => dispatch(resetPaymentsMadeAction()), [dispatch]);

  const removePaymentMade = useCallback(
    async payload => {
      return await dispatch(paymentsMadeSliceMethods.removePaymentMade(payload)).unwrap();
    },
    [dispatch]
  );

  const applyToBill = useCallback(
    async payload => {
      return await dispatch(paymentsMadeSliceMethods.applyToBill(payload)).unwrap();
    },
    [dispatch]
  );

  const removeApplyBill = useCallback(
    async payload => {
      return await dispatch(paymentsMadeSliceMethods.removeApplyBill(payload)).unwrap();
    },
    [dispatch]
  );

  const autoApplyPendingAdvancePaymentMade = useCallback(
    async payload => {
      return await dispatch(paymentsMadeSliceMethods.autoApplyPendingAdvancePaymentMade(payload)).unwrap();
    },
    [dispatch]
  );

  const addRefund = useCallback(
    async payload => {
      return await dispatch(paymentsMadeSliceMethods.addRefund(payload)).unwrap();
    },
    [dispatch]
  );

  const updateRefund = useCallback(
    async payload => {
      return await dispatch(paymentsMadeSliceMethods.updateRefund(payload)).unwrap();
    },
    [dispatch]
  );

  const deleteRefund = useCallback(
    async payload => {
      return await dispatch(paymentsMadeSliceMethods.deleteRefund(payload)).unwrap();
    },
    [dispatch]
  );

  return {
    paymentsMade,
    paymentMade,
    pagination,
    paymentsMadeInvoiceDrop,
    paymentsMadeOpeningBalance,
    paymentsMadePendingExpenses,
    nextPaymentMadeId,
    create,
    remove,
    update,
    loading,
    submitLoading,
    deleteLoading,
    droploading,
    error,
    approveLoading,
    rejectLoading,
    cancelLoading,
    applyBillLoading,
    refundLoading,
    removeApplyBillLoading,
    autoApplyLoading,
    exportLoading,
    getPaymentsMade,
    getPaymentsMadeExports,
    createPaymentsMade,
    updatePaymentsMade,
    getPaymentsMadeInvoice,
    approvePaymentsMade,
    rejectPaymentsMade,
    cancelPaymentsMade,
    getPaymentMadeById,
    resetPaymentMade,
    clearPaymentMadeInvoiceDrop,
    removePaymentMade,
    resetPaymentsMade,
    applyToBill,
    removeApplyBill,
    autoApplyPendingAdvancePaymentMade,
    addRefund,
    updateRefund,
    deleteRefund,
  };
};
