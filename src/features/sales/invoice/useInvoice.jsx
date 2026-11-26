import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  invoiceSliceMethods,
  resetInvoice as resetInvoiceAction,
  resetInvoices as resetInvoicesAction,
  resetPaymentHistory as resetPaymentHistoryAction,
} from '@/features/sales/invoice/invoice.slice';

export const useInvoice = () => {
  const dispatch = useDispatch();

  const {
    invoices,
    invoice,
    customerPendingInvoice,
    invoiceFile,
    pagination,
    invoicePersonDrop,
    create,
    remove,
    update,
    updateTransport,
    loading,
    submitLoading,
    deleteLoading,
    submitWithStatusLoading,
    submitEInvoiceLoading,
    submitEWayBillLoading,
    submitOnlyEWayBillLoading,
    cancelEInvoiceLoading,
    cancelEWayBillLoading,
    cancelOnlyEWayBillLoading,
    refetchEInvoiceLoading,
    fetchGstinLoading,
    uploading,
    droploading,
    invoiceTransport,
    invoiceDispatch,
    createLoading,
    dispatchLoading,
    bookingCopyFile,
    truckGoodsFile,
    vehicleGoodsFile,
    invoiceDispatchLoading,
    error,
    pendingInvoiceLoading,
    exportLoading,
    dispatchDeleteLoading,
    paymentHistoryLoading,
    paymentHistory,
    applyCustomerCreditLoading,
    removeObApplicationLoading,
    autoMapOpeningBalanceLoading,
    compliancePendingCount,
  } = useSelector(state => state.invoice);

  const getInvoice = useCallback(
    async payload => {
      return await dispatch(invoiceSliceMethods.getInvoice(payload));
    },
    [dispatch]
  );

  const getPendingInvoice = useCallback(
    async payload => {
      return await dispatch(invoiceSliceMethods.getPendingInvoice(payload));
    },
    [dispatch]
  );

  const createInvoices = useCallback(
    async invoiceDataPayload => {
      return await dispatch(invoiceSliceMethods.createInvoices(invoiceDataPayload));
    },
    [dispatch]
  );

  const updateInvoices = useCallback(
    async ({ invoiceId, invoiceData }) => {
      return await dispatch(invoiceSliceMethods.updateInvoices({ invoiceId, invoiceData }));
    },
    [dispatch]
  );

  const invoiceFileUpload = useCallback(
    async payload => {
      return await dispatch(invoiceSliceMethods.invoiceFileUpload(payload)).unwrap();
    },
    [dispatch]
  );

  const updateStatus = useCallback(
    async payload => {
      return await dispatch(invoiceSliceMethods.updateStatus(payload)).unwrap();
    },
    [dispatch]
  );

  const getInvoiceTransport = useCallback(
    async payload => {
      return await dispatch(invoiceSliceMethods.getInvoiceTransport(payload));
    },
    [dispatch]
  );

  const createInvoiceTransport = useCallback(
    async payload => {
      return await dispatch(invoiceSliceMethods.createInvoiceTransport(payload)).unwrap();
    },
    [dispatch]
  );

  const updateInvoiceTransport = useCallback(
    async ({ transportId, transportData }) => {
      return await dispatch(invoiceSliceMethods.updateInvoiceTransport({ transportId, transportData })).unwrap();
    },
    [dispatch]
  );

  const getInvoiceDispatch = useCallback(
    async payload => {
      return await dispatch(invoiceSliceMethods.getInvoiceDispatch(payload));
    },
    [dispatch]
  );

  const createInvoiceDispatch = useCallback(
    async payload => {
      return await dispatch(invoiceSliceMethods.createInvoiceDispatch(payload)).unwrap();
    },
    [dispatch]
  );

  const updateInvoiceDispatch = useCallback(
    async payload => {
      return await dispatch(invoiceSliceMethods.updateInvoiceDispatch(payload)).unwrap();
    },
    [dispatch]
  );

  const bookingCopyFileUpload = useCallback(
    async payload => {
      return await dispatch(invoiceSliceMethods.bookingCopyFileUpload(payload)).unwrap();
    },
    [dispatch]
  );

  const truckGoodsFileUpload = useCallback(
    async payload => {
      return await dispatch(invoiceSliceMethods.truckGoodsFileUpload(payload)).unwrap();
    },
    [dispatch]
  );

  const vehicleGoodsFileUpload = useCallback(
    async payload => {
      return await dispatch(invoiceSliceMethods.vehicleGoodsFileUpload(payload)).unwrap();
    },
    [dispatch]
  );

  const getInvoiceById = useCallback(
    async payload => {
      return await dispatch(invoiceSliceMethods.getInvoiceById(payload));
    },
    [dispatch]
  );

  const resetInvoice = useCallback(() => dispatch(resetInvoiceAction()), [dispatch]);
  const resetInvoices = useCallback(() => dispatch(resetInvoicesAction()), [dispatch]);

  const removeInvoice = useCallback(
    async payload => {
      return await dispatch(invoiceSliceMethods.removeInvoice(payload)).unwrap();
    },
    [dispatch]
  );

  const getInvoiceExports = useCallback(
    async payload => {
      return await dispatch(invoiceSliceMethods.getInvoiceExports(payload)).unwrap();
    },
    [dispatch]
  );

  const removeDispatchInvoice = useCallback(
    async payload => {
      return await dispatch(invoiceSliceMethods.removeDispatchInvoice(payload)).unwrap();
    },
    [dispatch]
  );

  const generateEInvoice = useCallback(
    async payload => {
      try {
        return await dispatch(invoiceSliceMethods.generateEInvoice(payload)).unwrap();
      } catch (error) {
        if (error?.message || error?.data) {
          throw { message: error?.message, data: error?.data };
        }
        throw error;
      }
    },
    [dispatch]
  );

  const cancelEInvoice = useCallback(
    async payload => {
      return await dispatch(invoiceSliceMethods.cancelEInvoice(payload)).unwrap();
    },
    [dispatch]
  );

  const generateEWayBill = useCallback(
    async payload => {
      return await dispatch(invoiceSliceMethods.generateEWayBill(payload)).unwrap();
    },
    [dispatch]
  );

  const generateOnlyEWayBill = useCallback(
    async payload => {
      try {
        return await dispatch(invoiceSliceMethods.generateOnlyEWayBill(payload)).unwrap();
      } catch (error) {
        if (error?.message || error?.data) {
          throw { message: error?.message, data: error?.data };
        }
        throw error;
      }
    },
    [dispatch]
  );

  const cancelOnlyEWayBill = useCallback(
    async payload => {
      return await dispatch(invoiceSliceMethods.cancelOnlyEWayBill(payload)).unwrap();
    },
    [dispatch]
  );

  const cancelEWayBill = useCallback(
    async payload => {
      return await dispatch(invoiceSliceMethods.cancelEWayBill(payload)).unwrap();
    },
    [dispatch]
  );

  const refetchEInvoice = useCallback(
    async payload => {
      return await dispatch(invoiceSliceMethods.refetchEInvoice(payload)).unwrap();
    },
    [dispatch]
  );

  const getGstDocumentOptions = useCallback(
    async payload => {
      return await dispatch(invoiceSliceMethods.getGstDocumentOptions(payload)).unwrap();
    },
    [dispatch]
  );

  const getPaymentHistory = useCallback(
    async payload => {
      return await dispatch(invoiceSliceMethods.getPaymentHistory(payload)).unwrap();
    },
    [dispatch]
  );

  const resetPaymentHistory = useCallback(() => dispatch(resetPaymentHistoryAction()), [dispatch]);

  const fetchGstinDetails = useCallback(
    async payload => {
      return await dispatch(invoiceSliceMethods.fetchGstinDetails(payload)).unwrap();
    },
    [dispatch]
  );

  const createSplitInvoice = useCallback(
    async payload => {
      return await dispatch(invoiceSliceMethods.createSplitInvoice(payload)).unwrap();
    },
    [dispatch]
  );

  const applyCustomerCreditToInvoice = useCallback(
    async payload => {
      return await dispatch(invoiceSliceMethods.applyCustomerCreditToInvoice(payload)).unwrap();
    },
    [dispatch]
  );

  const removeOpeningBalanceApplication = useCallback(
    async payload => {
      return await dispatch(invoiceSliceMethods.removeOpeningBalanceApplication(payload)).unwrap();
    },
    [dispatch]
  );

  const autoMapOpeningBalanceToInvoices = useCallback(
    async payload => {
      return await dispatch(invoiceSliceMethods.autoMapOpeningBalanceToInvoices(payload)).unwrap();
    },
    [dispatch]
  );

  return {
    invoices,
    invoice,
    customerPendingInvoice,
    pendingInvoiceLoading,
    invoiceFile,
    pagination,
    invoicePersonDrop,
    create,
    remove,
    update,
    updateTransport,
    loading,
    submitLoading,
    deleteLoading,
    submitWithStatusLoading,
    uploading,
    droploading,
    invoiceTransport,
    createLoading,
    dispatchLoading,
    bookingCopyFile,
    truckGoodsFile,
    vehicleGoodsFile,
    invoiceDispatch,
    invoiceDispatchLoading,
    dispatchDeleteLoading,
    error,
    exportLoading,
    paymentHistoryLoading,
    paymentHistory,
    getInvoice,
    compliancePendingCount,
    getPendingInvoice,
    createInvoices,
    updateInvoices,
    invoiceFileUpload,
    updateStatus,
    getInvoiceTransport,
    createInvoiceTransport,
    updateInvoiceTransport,
    getInvoiceDispatch,
    createInvoiceDispatch,
    updateInvoiceDispatch,
    bookingCopyFileUpload,
    truckGoodsFileUpload,
    vehicleGoodsFileUpload,
    getInvoiceById,
    resetInvoice,
    removeInvoice,
    resetInvoices,
    getInvoiceExports,
    removeDispatchInvoice,
    generateEInvoice,
    cancelEInvoice,
    generateEWayBill,
    generateOnlyEWayBill,
    cancelEWayBill,
    cancelOnlyEWayBill,
    refetchEInvoice,
    getGstDocumentOptions,
    submitEInvoiceLoading,
    submitEWayBillLoading,
    submitOnlyEWayBillLoading,
    cancelEInvoiceLoading,
    cancelEWayBillLoading,
    cancelOnlyEWayBillLoading,
    refetchEInvoiceLoading,
    getPaymentHistory,
    resetPaymentHistory,
    fetchGstinDetails,
    fetchGstinLoading,
    createSplitInvoice,
    applyCustomerCreditToInvoice,
    applyCustomerCreditLoading,
    removeOpeningBalanceApplication,
    removeObApplicationLoading,
    autoMapOpeningBalanceToInvoices,
    autoMapOpeningBalanceLoading,
  };
};
