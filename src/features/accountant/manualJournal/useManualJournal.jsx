import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { manualJournalSliceMethods, resetManualJournal as resetManualJournalAction, resetManualJournals as resetManualJournalsAction } from '@/features/accountant/manualJournal/manualJournal.slice';

export const useManualJournal = () => {
  const dispatch = useDispatch();

  const { journals, pagination, create, update, manualJournalFile, loading, submitLoading, deleteLoading, uploading, error, journal, contactDropdown } = useSelector(state => state.manualJournal);

  const getManualJournal = useCallback(
    async payload => {
      return await dispatch(manualJournalSliceMethods.getManualJournal(payload));
    },
    [dispatch]
  );

  const createManualJournal = useCallback(
    async journalDataPayload => {
      return await dispatch(manualJournalSliceMethods.createManualJournal(journalDataPayload)).unwrap();
    },
    [dispatch]
  );

  const updateManualJournal = useCallback(
    async ({ manualJournalId, journalData }) => {
      return await dispatch(manualJournalSliceMethods.updateManualJournal({ manualJournalId, journalData })).unwrap();
    },
    [dispatch]
  );

  const getManualJournalById = useCallback(
    async payload => {
      return await dispatch(manualJournalSliceMethods.getManualJournalById(payload));
    },
    [dispatch]
  );

  const getContactDropdown = useCallback(
    async payload => {
      return await dispatch(manualJournalSliceMethods.getContactDropdown(payload));
    },
    [dispatch]
  );

  const resetManualJournal = useCallback(() => dispatch(resetManualJournalAction()), [dispatch]);

  const resetManualJournals = useCallback(() => dispatch(resetManualJournalsAction()), [dispatch]);

  const removeManualJournal = useCallback(
    async payload => {
      return await dispatch(manualJournalSliceMethods.removeManualJournal(payload)).unwrap();
    },
    [dispatch]
  );

  return {
    journals,
    journal,
    contactDropdown,
    pagination,
    create,
    update,
    manualJournalFile,
    loading,
    submitLoading,
    deleteLoading,
    uploading,
    error,
    getManualJournal,
    createManualJournal,
    updateManualJournal,
    getManualJournalById,
    resetManualJournal,
    resetManualJournals,
    getContactDropdown,
    removeManualJournal,
  };
};
