import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  recurringInvoiceSliceMethods,
  resetRecurringInvoice as resetRecurringInvoiceAction,
  resetRecurringInvoices as resetRecurringInvoicesAction,
} from '@/features/sales/recurringInvoices/recurringInvoice.slice';

export const useRecurringInvoice = () => {
  const dispatch = useDispatch();

  const { recurringInvoices, recurringInvoice, createInvoice, createInvoiceLoading, pagination, recurringPersonDrop, create, update, loading, submitLoading, deleteLoading, droploading, error } =
    useSelector(state => state.recurringInvoice);

  const getRecurringInvoices = useCallback(
    async payload => {
      return await dispatch(recurringInvoiceSliceMethods.getRecurringInvoices(payload));
    },
    [dispatch]
  );

  const createRecurringInvoices = useCallback(
    async recurringInvoiceData => {
      return await dispatch(recurringInvoiceSliceMethods.createRecurringInvoices(recurringInvoiceData)).unwrap();
    },
    [dispatch]
  );

  const updateRecurringInvoices = useCallback(
    async ({ recurringId, recurringInvoiceData }) => {
      return await dispatch(
        recurringInvoiceSliceMethods.updateRecurringInvoices({
          recurringId,
          recurringInvoiceData,
        })
      ).unwrap();
    },
    [dispatch]
  );

  const updateStatus = useCallback(
    async payload => {
      return await dispatch(recurringInvoiceSliceMethods.updateStatus(payload)).unwrap();
    },
    [dispatch]
  );

  const getRecurringInvoicesById = useCallback(
    async payload => {
      return await dispatch(recurringInvoiceSliceMethods.getRecurringInvoicesById(payload)).unwrap();
    },
    [dispatch]
  );

  const resetRecurringInvoice = useCallback(() => dispatch(resetRecurringInvoiceAction()), [dispatch]);

  const resetRecurringInvoices = useCallback(() => dispatch(resetRecurringInvoicesAction()), [dispatch]);

  const createInvoiceFromRecurring = useCallback(
    async data => {
      return await dispatch(recurringInvoiceSliceMethods.createInvoiceFromRecurring(data)).unwrap();
    },
    [dispatch]
  );

  const removeRecurringInvoice = useCallback(
    async payload => {
      return await dispatch(recurringInvoiceSliceMethods.removeRecurringInvoice(payload)).unwrap();
    },
    [dispatch]
  );

  return {
    recurringInvoices,
    recurringInvoice,
    createInvoice,
    createInvoiceLoading,
    pagination,
    recurringPersonDrop,
    create,
    update,
    loading,
    submitLoading,
    deleteLoading,
    droploading,
    error,
    getRecurringInvoices,
    createRecurringInvoices,
    updateRecurringInvoices,
    updateStatus,
    getRecurringInvoicesById,
    resetRecurringInvoice,
    resetRecurringInvoices,
    createInvoiceFromRecurring,
    removeRecurringInvoice,
  };
};
