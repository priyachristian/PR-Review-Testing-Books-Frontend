import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { creditNotesSliceMethods, resetCreditNote as resetCreditNoteAction, resetCreditNotes as resetCreditNotesAction } from '@/features/sales/creditNotes/creditNote.slice';

export const useCreditNote = () => {
  const dispatch = useDispatch();

  const { creditNotes, creditNote, pagination, creditNotePersonDrop, create, remove, update, loading, creditNoteRefundLoading, submitLoading, deleteLoading, exportLoading, error } = useSelector(
    state => state.creditNotes
  );

  const getCreditNotes = useCallback(
    async payload => {
      return await dispatch(creditNotesSliceMethods.getCreditNotes(payload));
    },
    [dispatch]
  );

  const createCreditNotes = useCallback(
    async creditNoteData => {
      return await dispatch(creditNotesSliceMethods.createCreditNotes(creditNoteData)).unwrap();
    },
    [dispatch]
  );

  const updateCreditNotes = useCallback(
    async ({ creditNotesId, creditNoteData }) => {
      return await dispatch(creditNotesSliceMethods.updateCreditNotes({ creditNotesId, creditNoteData })).unwrap();
    },
    [dispatch]
  );

  const applyCreditNote = useCallback(
    async payload => {
      return await dispatch(creditNotesSliceMethods.applyCreditNote(payload));
    },
    [dispatch]
  );

  const getCreditNoteById = useCallback(
    async payload => {
      return await dispatch(creditNotesSliceMethods.getCreditNoteById(payload));
    },
    [dispatch]
  );

  const resetCreditNote = useCallback(() => dispatch(resetCreditNoteAction()), [dispatch]);
  const resetCreditNotes = useCallback(() => dispatch(resetCreditNotesAction()), [dispatch]);

  const removeCreditNote = useCallback(
    async payload => {
      return await dispatch(creditNotesSliceMethods.removeCreditNote(payload)).unwrap();
    },
    [dispatch]
  );

  const removeCreditNoteInvoice = useCallback(
    async payload => {
      return await dispatch(creditNotesSliceMethods.removeCreditNoteInvoice(payload)).unwrap();
    },
    [dispatch]
  );

  const updateCreditNoteStatus = useCallback(
    async payload => {
      return await dispatch(creditNotesSliceMethods.updateCreditNoteStatus(payload)).unwrap();
    },
    [dispatch]
  );

  const createCreditNoteRefund = useCallback(
    async payload => {
      return await dispatch(creditNotesSliceMethods.createCreditNoteRefund(payload)).unwrap();
    },
    [dispatch]
  );

  const deleteCreditNoteRefund = useCallback(
    async payload => {
      return await dispatch(creditNotesSliceMethods.deleteCreditNoteRefund(payload)).unwrap();
    },
    [dispatch]
  );

  const getCreditNoteExports = useCallback(async payload => await dispatch(creditNotesSliceMethods.getCreditNoteExports(payload)).unwrap(), [dispatch]);

  return {
    creditNotes,
    creditNote,
    pagination,
    creditNotePersonDrop,
    create,
    remove,
    update,
    loading,
    creditNoteRefundLoading,
    submitLoading,
    deleteLoading,
    exportLoading,
    error,
    getCreditNotes,
    createCreditNotes,
    updateCreditNotes,
    applyCreditNote,
    getCreditNoteById,
    resetCreditNote,
    removeCreditNote,
    removeCreditNoteInvoice,
    resetCreditNotes,
    updateCreditNoteStatus,
    createCreditNoteRefund,
    deleteCreditNoteRefund,
    getCreditNoteExports,
  };
};
