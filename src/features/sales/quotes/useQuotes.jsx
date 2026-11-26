import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { quoteSliceMethods, resetQuote as resetQuoteAction, resetQuotes as resetQuotesAction } from '@/features/sales/quotes/quote.slice';

export const useQuotes = () => {
  const dispatch = useDispatch();

  const {
    quotes,
    quote,
    quoteFile,
    pagination,
    quotePersonDrop,
    quoteCustomerProjectDrop,
    create,
    remove,
    update,
    loading,
    submitLoading,
    deleteLoading,
    submitWithStatusLoading,
    uploading,
    droploading,
    exportLoading,
    error,
  } = useSelector(state => state.quote);

  const getQuotes = useCallback(
    async payload => {
      const response = await dispatch(quoteSliceMethods.getQuotes(payload));
      return response;
    },
    [dispatch]
  );

  const createQuotes = useCallback(
    async quoteData => {
      const response = await dispatch(quoteSliceMethods.createQuotes(quoteData));
      return response;
    },
    [dispatch]
  );

  const updateQuotes = useCallback(
    async ({ quoteId, quoteData }) => {
      const response = await dispatch(quoteSliceMethods.updateQuotes({ quoteId, quoteData }));
      return response;
    },
    [dispatch]
  );

  const quoteFileUpload = useCallback(
    async fileData => {
      const response = await dispatch(quoteSliceMethods.quoteFileUpload(fileData)).unwrap();
      return response;
    },
    [dispatch]
  );

  const getQuoteCustomerProject = useCallback(
    async selectedCustomer => {
      const response = await dispatch(quoteSliceMethods.getQuoteCustomerProject(selectedCustomer));
      return response;
    },
    [dispatch]
  );

  const updateStatus = useCallback(
    async payload => {
      const response = await dispatch(quoteSliceMethods.updateStatus(payload)).unwrap();
      return response;
    },
    [dispatch]
  );

  const getQuoteById = useCallback(
    async payload => {
      const response = await dispatch(quoteSliceMethods.getQuoteById(payload));
      return response;
    },
    [dispatch]
  );

  const resetQuote = useCallback(() => dispatch(resetQuoteAction()), [dispatch]);
  const resetQuotes = useCallback(() => dispatch(resetQuotesAction()), [dispatch]);

  const removeQuote = useCallback(
    async payload => {
      const response = await dispatch(quoteSliceMethods.removeQuote(payload)).unwrap();
      return response;
    },
    [dispatch]
  );

  const getQuoteExports = useCallback(async payload => await dispatch(quoteSliceMethods.getQuoteExports(payload)).unwrap(), [dispatch]);

  return {
    quotes,
    quote,
    quoteFile,
    pagination,
    quotePersonDrop,
    quoteCustomerProjectDrop,
    create,
    remove,
    update,
    loading,
    submitLoading,
    deleteLoading,
    submitWithStatusLoading,
    uploading,
    droploading,
    exportLoading,
    error,
    getQuotes,
    getQuoteExports,
    createQuotes,
    updateQuotes,
    quoteFileUpload,
    getQuoteCustomerProject,
    updateStatus,
    getQuoteById,
    resetQuote,
    removeQuote,
    resetQuotes,
  };
};
