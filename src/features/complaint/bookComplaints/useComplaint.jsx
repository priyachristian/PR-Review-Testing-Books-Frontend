import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { complaintSliceMethods, resetComplaint as resetComplaintAction, resetComplaints as resetComplaintsAction } from './complaint.slice';

export const useComplaint = () => {
  const dispatch = useDispatch();

  const { complaints, complaint, pagination, statusCounts, customerCount, internalCount, create, update, remove, loading, submitLoading, deleteLoading, error, message } = useSelector(
    state => state.complaint
  );

  const getComplaints = useCallback(payload => dispatch(complaintSliceMethods.getComplaints(payload)), [dispatch]);

  const getComplaintById = useCallback(payload => dispatch(complaintSliceMethods.getComplaintById(payload)), [dispatch]);

  const createComplaint = useCallback(data => dispatch(complaintSliceMethods.createComplaint(data)).unwrap(), [dispatch]);

  const updateComplaint = useCallback(({ complaintId, data }) => dispatch(complaintSliceMethods.updateComplaint({ complaintId, data })).unwrap(), [dispatch]);

  const deleteComplaint = useCallback(payload => dispatch(complaintSliceMethods.deleteComplaint(payload)).unwrap(), [dispatch]);

  const assignComplaint = useCallback(payload => dispatch(complaintSliceMethods.assignComplaint(payload)).unwrap(), [dispatch]);

  const replyComplaint = useCallback(payload => dispatch(complaintSliceMethods.replyComplaint(payload)).unwrap(), [dispatch]);

  const startProgress = useCallback(payload => dispatch(complaintSliceMethods.startProgress(payload)).unwrap(), [dispatch]);

  const setWarranty = useCallback(payload => dispatch(complaintSliceMethods.setWarranty(payload)).unwrap(), [dispatch]);

  const setRootCause = useCallback(payload => dispatch(complaintSliceMethods.setRootCause(payload)).unwrap(), [dispatch]);

  const setStopGap = useCallback(payload => dispatch(complaintSliceMethods.setStopGap(payload)).unwrap(), [dispatch]);

  const recordProgress = useCallback(payload => dispatch(complaintSliceMethods.recordProgress(payload)).unwrap(), [dispatch]);

  const setSettlement = useCallback(payload => dispatch(complaintSliceMethods.setSettlement(payload)).unwrap(), [dispatch]);

  const approveSettlement = useCallback(payload => dispatch(complaintSliceMethods.approveSettlement(payload)).unwrap(), [dispatch]);

  const completeAction = useCallback(payload => dispatch(complaintSliceMethods.completeAction(payload)).unwrap(), [dispatch]);

  const verifyComplaint = useCallback(payload => dispatch(complaintSliceMethods.verifyComplaint(payload)).unwrap(), [dispatch]);

  const closeComplaint = useCallback(payload => dispatch(complaintSliceMethods.closeComplaint(payload)).unwrap(), [dispatch]);

  const reopenComplaint = useCallback(payload => dispatch(complaintSliceMethods.reopenComplaint(payload)).unwrap(), [dispatch]);

  const handToSomeone = useCallback(payload => dispatch(complaintSliceMethods.handToSomeone(payload)).unwrap(), [dispatch]);

  const setWaiting = useCallback(payload => dispatch(complaintSliceMethods.setWaiting(payload)).unwrap(), [dispatch]);

  const escalateComplaint = useCallback(payload => dispatch(complaintSliceMethods.escalateComplaint(payload)).unwrap(), [dispatch]);

  const markNotReal = useCallback(payload => dispatch(complaintSliceMethods.markNotReal(payload)).unwrap(), [dispatch]);

  const linkComplaint = useCallback(payload => dispatch(complaintSliceMethods.linkComplaint(payload)).unwrap(), [dispatch]);

  const skipStep = useCallback(payload => dispatch(complaintSliceMethods.skipStep(payload)).unwrap(), [dispatch]);

  const addTeamNote = useCallback(payload => dispatch(complaintSliceMethods.addTeamNote(payload)).unwrap(), [dispatch]);

  const addTeamTask = useCallback(payload => dispatch(complaintSliceMethods.addTeamTask(payload)).unwrap(), [dispatch]);

  const updateTeamTask = useCallback(payload => dispatch(complaintSliceMethods.updateTeamTask(payload)).unwrap(), [dispatch]);

  const resetComplaint = useCallback(() => dispatch(resetComplaintAction()), [dispatch]);

  const resetComplaints = useCallback(() => dispatch(resetComplaintsAction()), [dispatch]);

  return {
    complaints,
    complaint,
    pagination,
    statusCounts,
    customerCount,
    internalCount,
    create,
    update,
    remove,
    loading,
    submitLoading,
    deleteLoading,
    error,
    message,
    getComplaints,
    getComplaintById,
    createComplaint,
    updateComplaint,
    deleteComplaint,
    assignComplaint,
    replyComplaint,
    startProgress,
    setWarranty,
    setRootCause,
    setStopGap,
    recordProgress,
    setSettlement,
    approveSettlement,
    completeAction,
    verifyComplaint,
    closeComplaint,
    reopenComplaint,
    handToSomeone,
    setWaiting,
    escalateComplaint,
    markNotReal,
    linkComplaint,
    skipStep,
    addTeamNote,
    addTeamTask,
    updateTeamTask,
    resetComplaint,
    resetComplaints,
  };
};
