import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  paymentReceivedSliceMethods,
  clearPaymentInvoiceDrop as clearPaymentInvoiceDropAction,
  resetPaymentReceived as resetPaymentReceivedAction,
  resetPaymentsReceived as resetPaymentsReceivedAction,
} from '@/features/sales/paymentsReceived/paymentReceived.slice';

export const usePaymentReceived = () => {
  const dispatch = useDispatch();

  const {
    paymentsReceived,
    paymentReceived,
    paymentReceivedFile,
    pagination,
    paymentInvoiceDrop,
    paymentInvoiceOpeningBalance,
    paymentInvoicePendingExpenses,
    nextPaymentNo,
    create,
    update,
    remove,
    loading,
    submitLoading,
    deleteLoading,
    uploading,
    droploading,
    approveLoading,
    rejectLoading,
    cancelLoading,
    applyInvoiceLoading,
    refundLoading,
    removeApplyInvoiceLoading,
    autoApplyLoading,
    exportLoading,
    error,
  } = useSelector(state => state.paymentReceived);

  const getPaymentsRecived = useCallback(
    async payload => {
      const response = await dispatch(paymentReceivedSliceMethods.getPaymentsRecived(payload));
      return response;
    },
    [dispatch]
  );

  const getPaymentsExports = useCallback(
    async payload => {
      return await dispatch(paymentReceivedSliceMethods.getPaymentsExports(payload)).unwrap();
    },
    [dispatch]
  );

  const createPaymentsRecived = useCallback(
    async paymentReceivedData => {
      const response = await dispatch(paymentReceivedSliceMethods.createPaymentsRecived(paymentReceivedData)).unwrap();
      return response;
    },
    [dispatch]
  );

  const updatePaymentsRecived = useCallback(
    async ({ paymentId, paymentReceivedData }) => {
      const response = await dispatch(paymentReceivedSliceMethods.updatePaymentsRecived({ paymentId, paymentReceivedData })).unwrap();
      return response;
    },
    [dispatch]
  );

  const getPaymentInvoice = useCallback(
    async ({ customerId, branchId, isSplit = false, ...rest }) => {
      const response = await dispatch(
        paymentReceivedSliceMethods.getPaymentInvoice({
          customerId,
          branchId,
          isSplit,
          ...rest,
        })
      );
      return response;
    },
    [dispatch]
  );

  const paymentFileUpload = useCallback(
    async fileData => {
      const response = await dispatch(paymentReceivedSliceMethods.paymentFileUpload(fileData)).unwrap();
      return response;
    },
    [dispatch]
  );

  const approvePaymentsRecived = useCallback(
    async payload => {
      const response = await dispatch(paymentReceivedSliceMethods.approvePaymentsRecived(payload)).unwrap();
      return response;
    },
    [dispatch]
  );

  const rejectPaymentsRecived = useCallback(
    async payload => {
      const response = await dispatch(paymentReceivedSliceMethods.rejectPaymentsRecived(payload)).unwrap();
      return response;
    },
    [dispatch]
  );

  const cancelPaymentsRecived = useCallback(
    async payload => {
      const response = await dispatch(paymentReceivedSliceMethods.cancelPaymentsRecived(payload)).unwrap();
      return response;
    },
    [dispatch]
  );

  const getPaymentRecivedById = useCallback(
    async payload => {
      const response = await dispatch(paymentReceivedSliceMethods.getPaymentRecivedById(payload));
      return response;
    },
    [dispatch]
  );

  const resetPaymentReceived = useCallback(() => dispatch(resetPaymentReceivedAction()), [dispatch]);

  const clearPaymentInvoiceDrop = useCallback(() => dispatch(clearPaymentInvoiceDropAction()), [dispatch]);

  const resetPaymentsReceived = useCallback(() => dispatch(resetPaymentsReceivedAction()), [dispatch]);

  const removePaymentsRecived = useCallback(
    async payload => {
      const response = await dispatch(paymentReceivedSliceMethods.removePaymentsRecived(payload)).unwrap();
      return response;
    },
    [dispatch]
  );

  const applyToInvoice = useCallback(
    async payload => {
      const response = await dispatch(paymentReceivedSliceMethods.applyToInvoice(payload)).unwrap();
      return response;
    },
    [dispatch]
  );

  const removeApplyInvoice = useCallback(
    async payload => {
      const response = await dispatch(paymentReceivedSliceMethods.removeApplyInvoice(payload)).unwrap();
      return response;
    },
    [dispatch]
  );

  const autoApplyPendingAdvancePayments = useCallback(
    async payload => {
      return await dispatch(paymentReceivedSliceMethods.autoApplyPendingAdvancePayments(payload)).unwrap();
    },
    [dispatch]
  );

  const addRefund = useCallback(
    async payload => {
      return await dispatch(paymentReceivedSliceMethods.addRefund(payload)).unwrap();
    },
    [dispatch]
  );

  const updateRefund = useCallback(
    async payload => {
      return await dispatch(paymentReceivedSliceMethods.updateRefund(payload)).unwrap();
    },
    [dispatch]
  );

  const deleteRefund = useCallback(
    async payload => {
      return await dispatch(paymentReceivedSliceMethods.deleteRefund(payload)).unwrap();
    },
    [dispatch]
  );

  return {
    paymentsReceived,
    paymentReceived,
    paymentReceivedFile,
    pagination,
    paymentInvoiceDrop,
    paymentInvoiceOpeningBalance,
    paymentInvoicePendingExpenses,
    nextPaymentNo,
    create,
    update,
    remove,
    loading,
    submitLoading,
    deleteLoading,
    uploading,
    droploading,
    error,
    approveLoading,
    rejectLoading,
    cancelLoading,
    applyInvoiceLoading,
    refundLoading,
    removeApplyInvoiceLoading,
    autoApplyLoading,
    exportLoading,
    getPaymentsRecived,
    getPaymentsExports,
    createPaymentsRecived,
    updatePaymentsRecived,
    getPaymentInvoice,
    paymentFileUpload,
    approvePaymentsRecived,
    rejectPaymentsRecived,
    cancelPaymentsRecived,
    getPaymentRecivedById,
    resetPaymentReceived,
    clearPaymentInvoiceDrop,
    removePaymentsRecived,
    resetPaymentsReceived,
    applyToInvoice,
    removeApplyInvoice,
    autoApplyPendingAdvancePayments,
    addRefund,
    updateRefund,
    deleteRefund,
  };
};
