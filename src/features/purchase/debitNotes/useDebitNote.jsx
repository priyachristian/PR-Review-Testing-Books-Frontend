import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { debitNotesSliceMethods, resetDebitNote as resetDebitNoteAction, resetDebitNotes as resetDebitNotesAction } from '@/features/purchase/debitNotes/debitNote.slice';

export const useDebitNote = () => {
  const dispatch = useDispatch();

  const { debitNotes, debitNote, debitNoteFile, pagination, create, update, remove, loading, submitLoading, deleteLoading, debitNoteRefundLoading, exportLoading, uploading, droploading, error } =
    useSelector(state => state.debitNote);

  const getDebitNotes = useCallback(
    async payload => {
      return await dispatch(debitNotesSliceMethods.getDebitNotes(payload));
    },
    [dispatch]
  );

  const createDebitNotes = useCallback(
    async debitNoteData => {
      return await dispatch(debitNotesSliceMethods.createDebitNotes(debitNoteData)).unwrap();
    },
    [dispatch]
  );

  const updateDebitNotes = useCallback(
    async ({ vendorId, debitNoteData }) => {
      return await dispatch(debitNotesSliceMethods.updateDebitNotes({ vendorId, debitNoteData })).unwrap();
    },
    [dispatch]
  );

  const applyDebitNote = useCallback(
    async payload => {
      return await dispatch(debitNotesSliceMethods.applyDebitNote(payload)).unwrap();
    },
    [dispatch]
  );

  const getDebitNoteById = useCallback(
    async payload => {
      return await dispatch(debitNotesSliceMethods.getDebitNoteById(payload)).unwrap();
    },
    [dispatch]
  );

  const resetDebitNote = useCallback(() => dispatch(resetDebitNoteAction()), [dispatch]);
  const resetDebitNotes = useCallback(() => dispatch(resetDebitNotesAction()), [dispatch]);

  const removeDebitNote = useCallback(
    async payload => {
      return await dispatch(debitNotesSliceMethods.removeDebitNote(payload)).unwrap();
    },
    [dispatch]
  );

  const removeDebitNoteBillsApplied = useCallback(
    async payload => {
      return await dispatch(debitNotesSliceMethods.removeDebitNoteBillsApplied(payload)).unwrap();
    },
    [dispatch]
  );

  const updateDebitNoteStatus = useCallback(
    async payload => {
      return await dispatch(debitNotesSliceMethods.updateDebitNoteStatus(payload)).unwrap();
    },
    [dispatch]
  );

  const createDebitNoteRefund = useCallback(
    async payload => {
      return await dispatch(debitNotesSliceMethods.createDebitNoteRefund(payload)).unwrap();
    },
    [dispatch]
  );

  const deleteDebitNoteRefund = useCallback(
    async payload => {
      return await dispatch(debitNotesSliceMethods.deleteDebitNoteRefund(payload)).unwrap();
    },
    [dispatch]
  );

  const getDebitNoteExports = useCallback(async payload => await dispatch(debitNotesSliceMethods.getDebitNoteExports(payload)).unwrap(), [dispatch]);

  return {
    debitNotes,
    debitNote,
    debitNoteFile,
    pagination,
    create,
    update,
    remove,
    loading,
    submitLoading,
    deleteLoading,
    debitNoteRefundLoading,
    exportLoading,
    uploading,
    droploading,
    error,
    getDebitNotes,
    createDebitNotes,
    updateDebitNotes,
    applyDebitNote,
    getDebitNoteById,
    resetDebitNote,
    removeDebitNote,
    removeDebitNoteBillsApplied,
    resetDebitNotes,
    updateDebitNoteStatus,
    createDebitNoteRefund,
    deleteDebitNoteRefund,
    getDebitNoteExports,
  };
};
