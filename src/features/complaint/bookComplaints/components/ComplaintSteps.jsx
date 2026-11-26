import { useState } from 'react';
import dayjs from 'dayjs';
import { CheckOutlined, PauseCircleOutlined, UserAddOutlined } from '@ant-design/icons';

import CustomButton from '@/components/ui/button/CustomButton';
import PermissionButton from '@/components/ui/button/PermissionButton';
import { Tooltip } from '@/components/AntDComponent';
import Icons from 'assets/icons/icon';
import { colorPalette } from '@/utils/theme';
import { PERMISSION_MESSAGES } from '@/utils/constants';

import { COMPLAINT_FORM_TYPE, COMPLAINT_OTHER_ACTIONS, COMPLAINT_SOURCE_PROBLEM_TYPE, COMPLAINT_SOURCE, COMPLAINT_STATUS, COMPLAINT_STEPS } from '../complaint.constants';
import { getNotRealReasonLabel } from '../complaint.utils';

const TOTAL_STEPS = COMPLAINT_STEPS.length;

const SKIPPABLE_STEPS = [COMPLAINT_STATUS.IN_PROGRESS.key, COMPLAINT_STATUS.ACTION_TAKEN.key];

const OTHER_ACTION_ICONS = {
  UserAddOutlined: <UserAddOutlined />,
  PauseCircleOutlined: <PauseCircleOutlined />,
  RiseOutlined: <Icons.RiseOutlined />,
  LinkOutlined: <Icons.LinkOutlined />,
  StopOutlined: <Icons.StopOutlined />,
};

const getActiveStepIndex = status => {
  const index = COMPLAINT_STEPS.findIndex(step => step.key === status);
  return index >= 0 ? index : 0;
};

const formatHereLabel = complaint => {
  if (complaint?.stepHereLabel) return complaint.stepHereLabel;
  return null;
};

const formatStepMeta = (dateValue, personName) => {
  const date = dateValue ? dayjs(dateValue).format('DD/MM/YYYY') : null;
  const name = personName || null;
  if (date && name) return `${date} · ${name}`;
  if (date) return date;
  if (name) return name;
  return null;
};

const STEP_BADGE_ACTIVE = colorPalette.primary[500];
const STEP_BADGE_PAST = colorPalette.primary[500];
const STEP_BADGE_FUTURE = colorPalette.secondary[300];
const STEP_ACTIVE_BG = colorPalette.primary[50];

const formatNotRealMeta = complaint => {
  const date = complaint?.notRealMarkedAt ? dayjs(complaint.notRealMarkedAt).format('DD/MM/YYYY') : null;
  const markedBy = complaint?.notRealMarkedBy;
  const name = typeof markedBy === 'object' ? markedBy?.name || markedBy?.userName : null;
  if (date && name) return `${date} · ${name}`;
  if (date) return date;
  if (name) return name;
  return null;
};

const StepBadge = ({ number, active, past, notReal }) => {
  if (notReal) {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold shrink-0" style={{ backgroundColor: colorPalette.error[600], color: '#ffffff' }}>
        {number}
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold shrink-0"
      style={{
        backgroundColor: active ? STEP_BADGE_ACTIVE : past ? STEP_BADGE_PAST : STEP_BADGE_FUTURE,
        color: '#ffffff',
      }}
    >
      {past ? <CheckOutlined style={{ fontSize: 11 }} /> : number}
    </span>
  );
};

const NotRealComplaintBanner = ({ complaint }) => {
  const reasonLabel = getNotRealReasonLabel(complaint?.notRealReason) || complaint?.notRealReason;
  const reasonText = complaint?.notRealNote?.trim() || reasonLabel;
  const meta = formatNotRealMeta(complaint);

  return (
    <div className="flex gap-3 py-3.5 px-2 -mx-2 rounded-lg" style={{ backgroundColor: colorPalette.error[50] }}>
      <StepBadge number={0} notReal />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-[15px] font-semibold text-gray-900">Not a real complaint</span>
          {meta ? <span className="text-sm text-gray-400">{meta}</span> : null}
        </div>
        {reasonText ? (
          <p className="text-sm mt-0.5 mb-0 leading-5" style={{ color: colorPalette.secondary[600] }}>
            {reasonText}
          </p>
        ) : null}
        <p className="text-sm mt-0.5 mb-0 leading-5" style={{ color: colorPalette.secondary[500] }}>
          Someone decided this was not a real complaint. It stays on the record but is not counted anywhere.
        </p>
      </div>
    </div>
  );
};

const TaskDot = ({ done, optional }) => {
  if (done) {
    return <Icons.CheckCircleOutlined className="text-base shrink-0" style={{ color: colorPalette.success[500] }} />;
  }
  if (optional) {
    return <span className="inline-flex w-4 h-4 rounded-full border-2 shrink-0" style={{ borderColor: colorPalette.secondary[300] }} />;
  }
  return (
    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full border-2 shrink-0" style={{ borderColor: colorPalette.warning[500] }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colorPalette.warning[500] }} />
    </span>
  );
};

const TakeOffHoldButton = ({ loading, onClick }) => <CustomButton type="primary" size="middle" icon={<Icons.PlayCircleOutlined />} text="Take it off hold" loading={loading} onClick={onClick} />;

const AssignedStepActions = ({ replyRequired, replyDone, isWaiting, submitLoading, onReply, onStartWork, onTakeOffHold }) => {
  const canStart = !replyRequired || replyDone;

  return (
    <div className="mt-2.5 space-y-2.5">
      {replyRequired ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <TaskDot done={replyDone} />
            <span className={`text-sm ${replyDone ? 'text-gray-400 line-through' : 'text-gray-700'}`}>Reply to the customer</span>
          </div>
          {replyDone ? <CustomButton type="default" size="middle" text="Change" onClick={onReply} /> : <CustomButton type="primary" size="middle" text="Reply now" onClick={onReply} />}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2.5">
        {isWaiting ? (
          <TakeOffHoldButton loading={submitLoading} onClick={onTakeOffHold} />
        ) : (
          <CustomButton
            type={canStart ? 'primary' : 'default'}
            size="middle"
            icon={<Icons.PlayCircleOutlined />}
            text="Start working on it"
            disabled={!canStart}
            onClick={onStartWork}
            style={
              canStart
                ? undefined
                : {
                    backgroundColor: colorPalette.secondary[50],
                    borderColor: colorPalette.secondary[200],
                    color: colorPalette.secondary[400],
                  }
            }
          />
        )}
        {!isWaiting && replyRequired && !replyDone ? (
          <span className="text-sm" style={{ color: colorPalette.warning[600] }}>
            Finish the item above first
          </span>
        ) : null}
      </div>
    </div>
  );
};

const InProgressStepActions = ({ inProgress, isWaiting, canSkip, submitLoading, onCheckWarranty, onWriteCause, onAddStopGap, onRecordAction, onTakeOffHold, onSkip }) => {
  const warrantyDone = Boolean(inProgress?.warrantyPosition || inProgress?.warrantyWhy);
  const causeDone = Boolean(inProgress?.realCause);
  const stopGapDone = Boolean(inProgress?.stopGapAction);
  const canRecord = warrantyDone && causeDone;

  return (
    <div className="mt-2.5 space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <TaskDot done={warrantyDone} />
          <span className={`text-sm ${warrantyDone ? 'text-gray-400 line-through' : 'text-gray-700'}`}>Check the warranty position</span>
        </div>
        {warrantyDone ? <CustomButton type="default" size="middle" text="Change" onClick={onCheckWarranty} /> : <CustomButton type="primary" size="middle" text="Check it" onClick={onCheckWarranty} />}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <TaskDot done={causeDone} />
          <span className={`text-sm ${causeDone ? 'text-gray-400 line-through' : 'text-gray-700'}`}>Write down the real cause</span>
        </div>
        {causeDone ? <CustomButton type="default" size="middle" text="Change" onClick={onWriteCause} /> : <CustomButton type="primary" size="middle" text="Write it" onClick={onWriteCause} />}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <TaskDot done={stopGapDone} optional />
          <span className={`text-sm ${stopGapDone ? 'text-gray-400 line-through' : 'text-gray-500'}`}>Stop-gap action, if you took one (optional)</span>
        </div>
        <CustomButton type="default" size="middle" text={stopGapDone ? 'Change' : 'Add'} onClick={onAddStopGap} />
      </div>

      <div className="flex flex-wrap items-center gap-2.5 pt-0.5">
        {isWaiting ? (
          <TakeOffHoldButton loading={submitLoading} onClick={onTakeOffHold} />
        ) : (
          <CustomButton
            type={canRecord ? 'primary' : 'default'}
            size="middle"
            icon={<Icons.ToolOutlined />}
            text="Record what we did"
            disabled={!canRecord}
            onClick={onRecordAction}
            style={
              canRecord
                ? undefined
                : {
                    backgroundColor: '#dbeafe',
                    borderColor: '#bfdbfe',
                    color: colorPalette.secondary[400],
                  }
            }
          />
        )}
        {canSkip ? <CustomButton type="default" size="middle" text="Skip this step" onClick={onSkip} /> : null}
        {!isWaiting && !canRecord ? (
          <span className="text-sm" style={{ color: colorPalette.warning[600] }}>
            Finish the item{warrantyDone || causeDone ? '' : 's'} above first
          </span>
        ) : null}
      </div>
    </div>
  );
};

const ActionTakenStepActions = ({ actionTaken, isWaiting, canSkip, submitLoading, onWriteCustomerGot, onCheckFix, onTakeOffHold, onSkip }) => {
  const customerGotDone = Boolean(actionTaken?.settlementType && actionTaken?.summary);
  const canCheckFix = customerGotDone;

  return (
    <div className="mt-2.5 space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <TaskDot done={customerGotDone} />
          <span className={`text-sm ${customerGotDone ? 'text-gray-400 line-through' : 'text-gray-700'}`}>What the customer got</span>
        </div>
        {customerGotDone ? (
          <CustomButton type="default" size="middle" text="Change" onClick={onWriteCustomerGot} />
        ) : (
          <CustomButton type="primary" size="middle" text="Write it" onClick={onWriteCustomerGot} />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {isWaiting ? (
          <TakeOffHoldButton loading={submitLoading} onClick={onTakeOffHold} />
        ) : (
          <CustomButton
            type={canCheckFix ? 'primary' : 'default'}
            size="middle"
            icon={<Icons.CheckCircleOutlined />}
            text="Check the fix worked"
            disabled={!canCheckFix}
            onClick={onCheckFix}
            style={
              canCheckFix
                ? undefined
                : {
                    backgroundColor: '#dbeafe',
                    borderColor: '#bfdbfe',
                    color: colorPalette.secondary[400],
                  }
            }
          />
        )}
        {canSkip ? <CustomButton type="default" size="middle" text="Skip this step" onClick={onSkip} /> : null}
        {!isWaiting && !canCheckFix ? (
          <span className="text-sm" style={{ color: colorPalette.warning[600] }}>
            Finish the item above first
          </span>
        ) : null}
      </div>
    </div>
  );
};

const VerifiedStepActions = ({ verified, isWaiting, submitLoading, onCheckFixHeld, onCloseComplaint, onTakeOffHold }) => {
  const fixHeldDone = Boolean(verified?.fixHeldResult || verified?.howDoYouKnow);
  const canClose = fixHeldDone;

  return (
    <div className="mt-2.5 space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <TaskDot done={fixHeldDone} />
          <span className={`text-sm ${fixHeldDone ? 'text-gray-400 line-through' : 'text-gray-700'}`}>Check the fix held</span>
        </div>
        {fixHeldDone ? <CustomButton type="default" size="middle" text="Change" onClick={onCheckFixHeld} /> : <CustomButton type="primary" size="middle" text="Check it" onClick={onCheckFixHeld} />}
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {isWaiting ? (
          <TakeOffHoldButton loading={submitLoading} onClick={onTakeOffHold} />
        ) : (
          <CustomButton
            type={canClose ? 'primary' : 'default'}
            size="middle"
            text="Close this complaint"
            disabled={!canClose}
            onClick={onCloseComplaint}
            style={
              canClose
                ? undefined
                : {
                    backgroundColor: colorPalette.primary[50],
                    borderColor: colorPalette.primary[100],
                    color: colorPalette.secondary[400],
                  }
            }
          />
        )}
        {!isWaiting && !canClose ? (
          <span className="text-sm" style={{ color: colorPalette.warning[600] }}>
            Finish the item above first
          </span>
        ) : null}
      </div>
    </div>
  );
};

const ClosedStepActions = ({ closed, onReopen }) => {
  const rating = Number(closed?.customerSatisfaction ?? closed?.customerRating) || 0;

  return (
    <div className="mt-2.5 space-y-2.5">
      {rating > 0 ? (
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map(star => (
            <span key={star} className="text-base leading-none" style={{ color: star <= rating ? colorPalette.warning[500] : colorPalette.secondary[300] }}>
              ★
            </span>
          ))}
        </div>
      ) : null}
      <CustomButton type="default" size="middle" icon={<Icons.RollbackOutlined />} text="Open it again" onClick={onReopen} />
    </div>
  );
};

/**
 * Complaint workflow steps UI.
 * Modals plug in via onStepAction / onOtherAction later.
 */
const ComplaintSteps = ({ complaint, submitLoading = false, isViewOnly = false, onStepAction, onOtherAction, onTakeOffHold }) => {
  const [showOtherActions, setShowOtherActions] = useState(false);
  const currentStep = complaint?.currentStep || complaint?.status || COMPLAINT_STATUS.NEW.key;
  const activeIndex = getActiveStepIndex(currentStep);
  const hereLabel = formatHereLabel(complaint);
  const isWaiting = Boolean(complaint?.isWaiting);
  const isNotRealComplaint = Boolean(complaint?.isNotRealComplaint);
  const isClosed = currentStep === COMPLAINT_STATUS.CLOSED.key || Boolean(complaint?.isClosed);
  const allowSkipSteps = Boolean(complaint?.allowSkipSteps);
  const canSkipCurrentStep = allowSkipSteps && !isNotRealComplaint && !isClosed && SKIPPABLE_STEPS.includes(currentStep);
  const isCustomer = complaint?.problemType !== COMPLAINT_SOURCE_PROBLEM_TYPE[COMPLAINT_SOURCE.FACTORY];
  const replyRequired = complaint?.formType === COMPLAINT_FORM_TYPE.CUSTOMER_ISSUE;
  const assignedReply = complaint?.steps?.find(step => step?.step === COMPLAINT_STATUS.ASSIGNED.key)?.assigned;
  const replyDone = Boolean(assignedReply?.channel || assignedReply?.message);
  const inProgress = complaint?.steps?.find(step => step?.step === COMPLAINT_STATUS.IN_PROGRESS.key)?.inProgress || {};
  const actionTaken = complaint?.steps?.find(step => step?.step === COMPLAINT_STATUS.ACTION_TAKEN.key)?.actionTaken || {};
  const verified = complaint?.steps?.find(step => step?.step === COMPLAINT_STATUS.VERIFIED.key)?.verified || {};
  const closed = complaint?.steps?.find(step => step?.step === COMPLAINT_STATUS.CLOSED.key)?.closed || {};

  const primaryActions = COMPLAINT_OTHER_ACTIONS.filter(action => !action.danger);
  const dangerActions = COMPLAINT_OTHER_ACTIONS.filter(action => action.danger);
  const hideOtherActions = isClosed || isNotRealComplaint;
  const otherActionsOpen = showOtherActions && !hideOtherActions;
  const isAlreadyLinked = Array.isArray(complaint?.linkedComplaints) && complaint.linkedComplaints.length > 0;

  return (
    <div className="my-container container-spacing">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div className="min-w-0">
          <p className="font-bold text-lg m-0">The steps</p>
          <p className="text-sm text-gray-500 mt-0.5 mb-0">
            How a {isCustomer ? 'customer' : 'factory'} complaint is sorted out, start to finish. Step {activeIndex + 1} of {TOTAL_STEPS}.
          </p>
        </div>
        {!hideOtherActions ? (
          <CustomButton
            type="default"
            size="middle"
            icon={<Icons.MoreOutlined />}
            text={otherActionsOpen ? 'Less' : 'Other actions'}
            onClick={() => setShowOtherActions(open => !open)}
            className="shrink-0"
          />
        ) : null}
      </div>

      {otherActionsOpen ? (
        <div className="mt-3 -mx-4 px-4 py-3 bg-gray-50 border-y border-gray-100">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {primaryActions.map(action => {
                const isWaitingAction = action.key === 'waiting';
                const showTakeOffHold = isWaitingAction && isWaiting;
                const isLinkAction = action.key === 'link_complaint';
                const isLinkDisabled = isLinkAction && isAlreadyLinked;
                const isHandOffBlocked = isViewOnly && action.key === 'hand_off';

                const button = (
                  <CustomButton
                    type="default"
                    size="middle"
                    icon={showTakeOffHold ? <Icons.PlayCircleOutlined /> : OTHER_ACTION_ICONS[action.icon]}
                    text={showTakeOffHold ? 'Take it off hold' : action.label}
                    loading={showTakeOffHold ? submitLoading : false}
                    disabled={isLinkDisabled || isHandOffBlocked}
                    onClick={() => {
                      if (isLinkDisabled || isHandOffBlocked) return;
                      if (showTakeOffHold) {
                        onTakeOffHold?.();
                        return;
                      }
                      onOtherAction?.(action, complaint);
                    }}
                  />
                );

                if (isLinkAction || isHandOffBlocked) {
                  return (
                    <Tooltip key={action.key} title={isHandOffBlocked ? PERMISSION_MESSAGES.VIEW_ONLY : isLinkDisabled ? 'This complaint is already linked' : undefined}>
                      <span className="inline-block">{button}</span>
                    </Tooltip>
                  );
                }

                return <span key={action.key}>{button}</span>;
              })}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {dangerActions.map(action => (
                <CustomButton
                  key={action.key}
                  type="default"
                  size="middle"
                  icon={OTHER_ACTION_ICONS[action.icon]}
                  text={action.label}
                  onClick={() => onOtherAction?.(action, complaint)}
                  style={{
                    backgroundColor: colorPalette.error[50],
                    borderColor: colorPalette.error[200],
                    color: colorPalette.error[700],
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-3 divide-y divide-gray-100">
        {isNotRealComplaint ? <NotRealComplaintBanner complaint={complaint} /> : null}

        {COMPLAINT_STEPS.map((step, index) => {
          const active = !isNotRealComplaint && index === activeIndex;
          const past = !isNotRealComplaint && index < activeIndex;
          const future = !isNotRealComplaint && index > activeIndex;
          const muted = isNotRealComplaint || future;
          const stepRecord = complaint?.steps?.find(item => item?.step === step.key);
          const pastMeta = stepRecord?.isSkipped
            ? formatStepMeta(stepRecord?.skippedAt, stepRecord?.skippedBy?.name) || 'skipped'
            : formatStepMeta(stepRecord?.completedAt, stepRecord?.completedBy?.name);
          const activeMeta = formatStepMeta(stepRecord?.startedAt, complaint?.assignedTo?.name) || hereLabel;
          const statusLabel = isNotRealComplaint
            ? 'not reached yet'
            : active
              ? activeMeta
              : past
                ? stepRecord?.isSkipped
                  ? pastMeta
                    ? `skipped · ${pastMeta}`
                    : 'skipped'
                  : pastMeta || 'done'
                : 'not reached yet';
          const isClosedStep = step.key === COMPLAINT_STATUS.CLOSED.key;
          const closedDescription = !isNotRealComplaint && isClosedStep && (active || past) ? closed?.howItEnded : null;
          const skippedDescription = past && stepRecord?.isSkipped ? stepRecord?.skipReason : null;
          const bodyText = isNotRealComplaint
            ? step.willNeed
              ? `Will need: ${step.willNeed}`
              : step.description
            : closedDescription || skippedDescription || (active ? step.description : past ? step.description : step.willNeed ? `Will need: ${step.willNeed}` : null);
          const isAssignedStep = step.key === COMPLAINT_STATUS.ASSIGNED.key;
          const isInProgressStep = step.key === COMPLAINT_STATUS.IN_PROGRESS.key;
          const isActionTakenStep = step.key === COMPLAINT_STATUS.ACTION_TAKEN.key;
          const isVerifiedStep = step.key === COMPLAINT_STATUS.VERIFIED.key;
          const showAssignAction = active && step.actionLabel && !isAssignedStep && !isInProgressStep && !isActionTakenStep && !isVerifiedStep && !isClosedStep;
          const showAssignedActions = active && isAssignedStep;
          const showInProgressActions = active && isInProgressStep;
          const showActionTakenActions = active && isActionTakenStep;
          const showVerifiedActions = active && isVerifiedStep;
          const showClosedActions = active && isClosedStep;

          return (
            <div key={step.key} className={`flex gap-3 py-3.5 px-2 -mx-2 rounded-lg ${muted ? 'opacity-50' : ''}`} style={active ? { backgroundColor: STEP_ACTIVE_BG } : undefined}>
              <StepBadge number={index + 1} active={active} past={past} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className={`text-[15px] font-semibold ${muted ? 'text-gray-500' : 'text-gray-900'}`}>{step.label}</span>
                  {statusLabel ? <span className="text-sm text-gray-400">{statusLabel}</span> : null}
                </div>
                {bodyText ? <p className={`text-sm mt-0.5 mb-0 leading-5 ${muted ? 'text-gray-400' : 'text-gray-600'}`}>{bodyText}</p> : null}
                {showAssignAction ? (
                  <div className="mt-2.5">
                    {isWaiting ? (
                      <TakeOffHoldButton loading={submitLoading} onClick={onTakeOffHold} />
                    ) : (
                      <PermissionButton
                        isViewOnly={isViewOnly}
                        type="primary"
                        size="middle"
                        icon={<UserAddOutlined />}
                        text={step.actionLabel}
                        onClick={() => onStepAction?.({ ...step, actionKey: 'assign' }, complaint)}
                      />
                    )}
                  </div>
                ) : null}
                {showAssignedActions ? (
                  <AssignedStepActions
                    replyRequired={replyRequired}
                    replyDone={replyDone}
                    isWaiting={isWaiting}
                    submitLoading={submitLoading}
                    onReply={() => onStepAction?.({ ...step, actionKey: 'reply' }, complaint)}
                    onStartWork={() => onStepAction?.({ ...step, actionKey: 'start_work' }, complaint)}
                    onTakeOffHold={onTakeOffHold}
                  />
                ) : null}
                {showInProgressActions ? (
                  <InProgressStepActions
                    inProgress={inProgress}
                    isWaiting={isWaiting}
                    canSkip={canSkipCurrentStep}
                    submitLoading={submitLoading}
                    onCheckWarranty={() => onStepAction?.({ ...step, actionKey: 'check_warranty' }, complaint)}
                    onWriteCause={() => onStepAction?.({ ...step, actionKey: 'write_cause' }, complaint)}
                    onAddStopGap={() => onStepAction?.({ ...step, actionKey: 'add_stop_gap' }, complaint)}
                    onRecordAction={() => onStepAction?.({ ...step, actionKey: 'record_action' }, complaint)}
                    onTakeOffHold={onTakeOffHold}
                    onSkip={() => onStepAction?.({ ...step, actionKey: 'skip_step' }, complaint)}
                  />
                ) : null}
                {showActionTakenActions ? (
                  <ActionTakenStepActions
                    actionTaken={actionTaken}
                    isWaiting={isWaiting}
                    canSkip={canSkipCurrentStep}
                    submitLoading={submitLoading}
                    onWriteCustomerGot={() => onStepAction?.({ ...step, actionKey: 'write_customer_got' }, complaint)}
                    onCheckFix={() => onStepAction?.({ ...step, actionKey: 'check_fix' }, complaint)}
                    onTakeOffHold={onTakeOffHold}
                    onSkip={() => onStepAction?.({ ...step, actionKey: 'skip_step' }, complaint)}
                  />
                ) : null}
                {showVerifiedActions ? (
                  <VerifiedStepActions
                    verified={verified}
                    isWaiting={isWaiting}
                    submitLoading={submitLoading}
                    onCheckFixHeld={() => onStepAction?.({ ...step, actionKey: 'check_fix_held' }, complaint)}
                    onCloseComplaint={() => onStepAction?.({ ...step, actionKey: 'close_complaint' }, complaint)}
                    onTakeOffHold={onTakeOffHold}
                  />
                ) : null}
                {showClosedActions ? <ClosedStepActions closed={closed} onReopen={() => onStepAction?.({ ...step, actionKey: 'reopen' }, complaint)} /> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ComplaintSteps;
