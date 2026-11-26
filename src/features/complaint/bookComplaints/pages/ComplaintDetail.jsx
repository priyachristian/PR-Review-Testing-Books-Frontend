import { useLayoutEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';

import BackButton from '@/components/ui/button/BackButton';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import NoFoundPage from '@/components/ui/common/NoFoundPage';
import { Button } from '@/components/AntDComponent';
import { useResetOnUnmount } from '@/hooks/useResetOnUnmount';
import { ADMIN_ROUTE_PATHS } from '@/routes/adminRoutePaths';

import ComplaintDetailSkeleton from '../components/ComplaintDetailSkeleton';
import AssignComplaintModal from '../components/complaintsSteps/AssignComplaintModal';
import CloseComplaintModal from '../components/complaintsSteps/CloseComplaintModal';
import CustomerGotModal from '../components/complaintsSteps/CustomerGotModal';
import EscalateComplaintModal from '../components/complaintsSteps/EscalateComplaintModal';
import FixHeldModal from '../components/complaintsSteps/FixHeldModal';
import LinkComplaintModal from '../components/complaintsSteps/LinkComplaintModal';
import MoveToActionTakenModal from '../components/complaintsSteps/MoveToActionTakenModal';
import MoveToInProgressModal from '../components/complaintsSteps/MoveToInProgressModal';
import MoveToVerifiedModal from '../components/complaintsSteps/MoveToVerifiedModal';
import NotRealComplaintModal from '../components/complaintsSteps/NotRealComplaintModal';
import ReopenComplaintModal from '../components/complaintsSteps/ReopenComplaintModal';
import ReplyToCustomerModal from '../components/complaintsSteps/ReplyToCustomerModal';
import SkipStepModal from '../components/complaintsSteps/SkipStepModal';
import StopGapActionModal from '../components/complaintsSteps/StopGapActionModal';
import WaitingOnSomeoneModal from '../components/complaintsSteps/WaitingOnSomeoneModal';
import WarrantyCheckModal from '../components/complaintsSteps/WarrantyCheckModal';
import WriteRealCauseModal from '../components/complaintsSteps/WriteRealCauseModal';
import ComplaintSummaryCard from '../components/ComplaintSummaryCard';
import ComplaintSteps from '../components/ComplaintSteps';
import ComplaintTeamOnly from '../components/ComplaintTeamOnly';
import ComplaintFullHistory from '../components/ComplaintFullHistory';
import { COMPLAINT_STATUS, settlementShowsCost, settlementShowsPieces } from '../complaint.constants';
import { useComplaint } from '../useComplaint';
import useModulePermissions from 'hooks/useModulePermissions';
import { RESOURCES } from '@/utils/jsonFile';

const ComplaintDetail = () => {
  const { complaintId } = useParams();
  const navigate = useNavigate();
  const { isViewOnly } = useModulePermissions(RESOURCES.COMPLAINT);
  const {
    complaint,
    loading,
    submitLoading,
    getComplaintById,
    assignComplaint,
    replyComplaint,
    startProgress,
    setWarranty,
    setRootCause,
    setStopGap,
    recordProgress,
    setSettlement,
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
    resetComplaint,
  } = useComplaint();

  const [assignIntent, setAssignIntent] = useState('step');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [moveInProgressModalOpen, setMoveInProgressModalOpen] = useState(false);
  const [moveActionTakenModalOpen, setMoveActionTakenModalOpen] = useState(false);
  const [moveVerifiedModalOpen, setMoveVerifiedModalOpen] = useState(false);
  const [warrantyModalOpen, setWarrantyModalOpen] = useState(false);
  const [causeModalOpen, setCauseModalOpen] = useState(false);
  const [stopGapModalOpen, setStopGapModalOpen] = useState(false);
  const [customerGotModalOpen, setCustomerGotModalOpen] = useState(false);
  const [fixHeldModalOpen, setFixHeldModalOpen] = useState(false);
  const [closeComplaintModalOpen, setCloseComplaintModalOpen] = useState(false);
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [waitingModalOpen, setWaitingModalOpen] = useState(false);
  const [escalateModalOpen, setEscalateModalOpen] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [notRealModalOpen, setNotRealModalOpen] = useState(false);
  const [skipStepModalOpen, setSkipStepModalOpen] = useState(false);

  useResetOnUnmount(resetComplaint);

  useLayoutEffect(() => {
    if (!complaintId) return undefined;
    const controller = new AbortController();
    getComplaintById({ complaintId, signal: controller.signal });
    return () => controller.abort();
  }, [complaintId, getComplaintById]);

  if (loading) {
    return <ComplaintDetailSkeleton />;
  }

  if (!complaint) {
    return (
      <NoFoundPage
        title="Complaint not found"
        description="This complaint may have been deleted or you may not have access to view it."
        action={
          <Button type="primary" onClick={() => navigate(`/${ADMIN_ROUTE_PATHS.complaint.root}`)}>
            Back To Complaints
          </Button>
        }
      />
    );
  }

  const statusMeta = COMPLAINT_STATUS[complaint.currentStep] || COMPLAINT_STATUS.NEW;

  const openAssignModal = (intent = 'step') => {
    if (isViewOnly) return;
    setAssignIntent(intent);
    setAssignModalOpen(true);
  };
  const openReplyModal = () => setReplyModalOpen(true);
  const openMoveInProgressModal = () => setMoveInProgressModalOpen(true);
  const openMoveActionTakenModal = () => setMoveActionTakenModalOpen(true);
  const openMoveVerifiedModal = () => setMoveVerifiedModalOpen(true);
  const openWarrantyModal = () => setWarrantyModalOpen(true);
  const openCauseModal = () => setCauseModalOpen(true);
  const openStopGapModal = () => setStopGapModalOpen(true);
  const openCustomerGotModal = () => setCustomerGotModalOpen(true);
  const openFixHeldModal = () => setFixHeldModalOpen(true);
  const openCloseComplaintModal = () => setCloseComplaintModalOpen(true);
  const openReopenModal = () => setReopenModalOpen(true);
  const openWaitingModal = () => {
    if (complaint?.isWaiting) return;
    setWaitingModalOpen(true);
  };
  const openEscalateModal = () => setEscalateModalOpen(true);
  const openLinkModal = () => setLinkModalOpen(true);
  const openNotRealModal = () => setNotRealModalOpen(true);
  const openSkipStepModal = () => setSkipStepModalOpen(true);

  const handleStepAction = step => {
    if (step?.actionKey === 'assign') openAssignModal('step');
    if (step?.actionKey === 'reply') openReplyModal();
    if (step?.actionKey === 'start_work') openMoveInProgressModal();
    if (step?.actionKey === 'check_warranty') openWarrantyModal();
    if (step?.actionKey === 'write_cause') openCauseModal();
    if (step?.actionKey === 'add_stop_gap') openStopGapModal();
    if (step?.actionKey === 'record_action') openMoveActionTakenModal();
    if (step?.actionKey === 'write_customer_got') openCustomerGotModal();
    if (step?.actionKey === 'check_fix') openMoveVerifiedModal();
    if (step?.actionKey === 'check_fix_held') openFixHeldModal();
    if (step?.actionKey === 'close_complaint') openCloseComplaintModal();
    if (step?.actionKey === 'reopen') openReopenModal();
    if (step?.actionKey === 'skip_step') openSkipStepModal();
  };

  const handleOtherAction = action => {
    if (action?.key === 'hand_off') openAssignModal('hand_off');
    if (action?.key === 'waiting') openWaitingModal();
    if (action?.key === 'escalate') openEscalateModal();
    if (action?.key === 'link_complaint') openLinkModal();
    if (action?.key === 'not_real') openNotRealModal();
  };

  const handleAssignSubmit = async values => {
    const data = {
      department: values.department,
      personId: values.person,
      reason: values.reason,
    };

    if (assignIntent === 'hand_off') {
      await handToSomeone({ complaintId, data });
    } else {
      await assignComplaint({ complaintId, data });
    }
  };

  const handleReplySubmit = async values => {
    const data = {
      channel: values.channel,
      message: values.message,
    };
    if (values.proof) {
      data.proofAttachments = [values.proof];
    }
    await replyComplaint({ complaintId, data });
  };

  const handleMoveInProgressSubmit = async values => {
    await startProgress({
      complaintId,
      data: {
        whatHappened: values.whatHappened,
      },
    });
  };

  const handleWarrantySubmit = async values => {
    await setWarranty({
      complaintId,
      data: {
        warrantyPosition: values.position,
        why: values.why,
      },
    });
  };

  const handleCauseSubmit = async values => {
    const whys = [values.why1, values.why2, values.why3, values.why4, values.why5].map(why => (why || '').trim());
    await setRootCause({
      complaintId,
      data: {
        whys,
        realCause: values.realCause,
        immediateFix: values.fixThisOne,
        preventiveAction: values.neverRepeats,
        ensureByPersonId: values.ownerId,
        ensureByDate: values.byWhen ? dayjs(values.byWhen).format('YYYY-MM-DD') : undefined,
      },
    });
  };

  const handleStopGapSubmit = async values => {
    await setStopGap({
      complaintId,
      data: {
        stopGapAction: values.whatYouDid,
      },
    });
  };

  const handleMoveActionTakenSubmit = async values => {
    await recordProgress({
      complaintId,
      data: {
        whatHappened: values.whatHappened,
      },
    });
  };

  const handleCustomerGotSubmit = async values => {
    const showCost = settlementShowsCost(values.settlementType);
    const showPieces = settlementShowsPieces(values.settlementType);
    await setSettlement({
      complaintId,
      data: {
        settlementType: values.settlementType,
        pieces: showPieces && values.pieces !== '' && values.pieces != null ? Number(values.pieces) : null,
        costInRupees: showCost && values.cost !== '' && values.cost != null ? Number(values.cost) : 0,
        summary: values.summary,
      },
    });
  };

  const handleMoveVerifiedSubmit = async values => {
    await completeAction({
      complaintId,
      data: {
        whatHappened: values.whatHappened,
      },
    });
  };

  const handleFixHeldSubmit = async values => {
    await verifyComplaint({
      complaintId,
      data: {
        fixHeldResult: values.result,
        howDoYouKnow: values.howKnow,
      },
    });
  };

  const handleCloseComplaintSubmit = async values => {
    const data = {
      howItEnded: values.howItEnded,
    };
    if (values.customerRating) {
      data.customerSatisfaction = values.customerRating;
    }
    await closeComplaint({ complaintId, data });
  };

  const handleReopenSubmit = async values => {
    const data = {
      reason: values.reason,
    };
    if (values.note) {
      data.note = values.note;
    }
    await reopenComplaint({ complaintId, data });
  };

  const handleWaitingSubmit = async values => {
    if (values?.isWaiting === false) {
      await setWaiting({
        complaintId,
        data: { isWaiting: false },
      });
    } else {
      await setWaiting({
        complaintId,
        data: {
          isWaiting: true,
          waitingReason: values.waitingFor,
          why: values.note,
        },
      });
    }
  };

  const handleTakeOffHold = async () => {
    try {
      await setWaiting({
        complaintId,
        data: { isWaiting: false },
      });
    } catch {
      // Slice already toasts the error; keep original hold UI.
    }
  };

  const handleEscalateSubmit = async values => {
    await escalateComplaint({
      complaintId,
      data: {
        personId: values.personId,
        reason: values.reason,
      },
    });
  };

  const handleNotRealSubmit = async values => {
    const data = {
      reason: values.reason,
    };
    if (values.note) {
      data.note = values.note;
    }
    await markNotReal({ complaintId, data });
  };

  const handleSkipStepSubmit = async values => {
    await skipStep({
      complaintId,
      data: {
        skipReason: values.skipReason,
      },
    });
  };

  const handleLinkSubmit = async values => {
    await linkComplaint({
      complaintId,
      data: {
        connectionType: values.connectionType,
        linkedComplaintId: values.linkedComplaintId,
      },
    });
  };

  return (
    <>
      <div className="bg-white border-b border-gray-100 px-4 py-2 -m-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-4 min-w-0">
            <BackButton />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm font-medium text-gray-900">{complaint.complaintNo}</span>
                <span className="text-gray-400">•</span>
                <StatusBadge value={statusMeta.label} accentHex={statusMeta.color} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-8 space-y-4 pb-8">
        <ComplaintSummaryCard complaint={complaint} />
        <ComplaintSteps
          complaint={complaint}
          submitLoading={submitLoading}
          isViewOnly={isViewOnly}
          onStepAction={handleStepAction}
          onOtherAction={handleOtherAction}
          onTakeOffHold={handleTakeOffHold}
        />
        <ComplaintTeamOnly complaint={complaint} />
        <ComplaintFullHistory complaint={complaint} />
      </div>

      <AssignComplaintModal open={assignModalOpen} onClose={() => setAssignModalOpen(false)} complaint={complaint} submitLoading={submitLoading} onSubmit={handleAssignSubmit} />
      <ReplyToCustomerModal open={replyModalOpen} onClose={() => setReplyModalOpen(false)} complaint={complaint} submitLoading={submitLoading} onSubmit={handleReplySubmit} />
      <MoveToInProgressModal
        open={moveInProgressModalOpen}
        onClose={() => setMoveInProgressModalOpen(false)}
        complaint={complaint}
        submitLoading={submitLoading}
        onSubmit={handleMoveInProgressSubmit}
      />
      <MoveToActionTakenModal open={moveActionTakenModalOpen} onClose={() => setMoveActionTakenModalOpen(false)} submitLoading={submitLoading} onSubmit={handleMoveActionTakenSubmit} />
      <MoveToVerifiedModal open={moveVerifiedModalOpen} onClose={() => setMoveVerifiedModalOpen(false)} submitLoading={submitLoading} onSubmit={handleMoveVerifiedSubmit} />
      <WarrantyCheckModal open={warrantyModalOpen} onClose={() => setWarrantyModalOpen(false)} complaint={complaint} submitLoading={submitLoading} onSubmit={handleWarrantySubmit} />
      <WriteRealCauseModal open={causeModalOpen} onClose={() => setCauseModalOpen(false)} complaint={complaint} submitLoading={submitLoading} onSubmit={handleCauseSubmit} />
      <StopGapActionModal open={stopGapModalOpen} onClose={() => setStopGapModalOpen(false)} complaint={complaint} submitLoading={submitLoading} onSubmit={handleStopGapSubmit} />
      <CustomerGotModal open={customerGotModalOpen} onClose={() => setCustomerGotModalOpen(false)} complaint={complaint} submitLoading={submitLoading} onSubmit={handleCustomerGotSubmit} />
      <FixHeldModal open={fixHeldModalOpen} onClose={() => setFixHeldModalOpen(false)} complaint={complaint} submitLoading={submitLoading} onSubmit={handleFixHeldSubmit} />
      <CloseComplaintModal open={closeComplaintModalOpen} onClose={() => setCloseComplaintModalOpen(false)} complaint={complaint} submitLoading={submitLoading} onSubmit={handleCloseComplaintSubmit} />
      <ReopenComplaintModal open={reopenModalOpen} onClose={() => setReopenModalOpen(false)} complaint={complaint} submitLoading={submitLoading} onSubmit={handleReopenSubmit} />
      <WaitingOnSomeoneModal open={waitingModalOpen} onClose={() => setWaitingModalOpen(false)} submitLoading={submitLoading} onSubmit={handleWaitingSubmit} />
      <EscalateComplaintModal open={escalateModalOpen} onClose={() => setEscalateModalOpen(false)} complaint={complaint} submitLoading={submitLoading} onSubmit={handleEscalateSubmit} />
      <LinkComplaintModal open={linkModalOpen} onClose={() => setLinkModalOpen(false)} complaint={complaint} submitLoading={submitLoading} onSubmit={handleLinkSubmit} />
      <NotRealComplaintModal open={notRealModalOpen} onClose={() => setNotRealModalOpen(false)} submitLoading={submitLoading} onSubmit={handleNotRealSubmit} />
      <SkipStepModal open={skipStepModalOpen} onClose={() => setSkipStepModalOpen(false)} submitLoading={submitLoading} onSubmit={handleSkipStepSubmit} />
    </>
  );
};

export default ComplaintDetail;
