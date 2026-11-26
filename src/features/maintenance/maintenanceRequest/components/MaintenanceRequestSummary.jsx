import { useNavigate } from 'react-router-dom';

import { Tag } from '@/components/AntDComponent';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import CustomButton from '@/components/ui/button/CustomButton';
import DetailField from '@/components/ui/common/DetailField';
import { requestedPartColumns } from '@/features/maintenance/maintenanceRequest/maintenanceRequest.columns';
import { formatMaintenanceLabel, machineLabel, raisedByName } from '@/features/maintenance/maintenanceRequest/maintenanceRequest.utils';
import { ADMIN_ROUTE_PATHS } from '@/routes/adminRoutePaths';
import { dateFormateForUi } from '@/utils/services';

const hasValue = value => value !== undefined && value !== null && value !== '';

const displayDate = (value, withTime = false) => (value ? dateFormateForUi(value, withTime ? { withTime: true } : undefined) : undefined);

const personText = value => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return raisedByName(value);
};

const hoursValue = value => (value || value === 0 ? value : undefined);

const DetailCard = ({ title, children, footer }) => (
  <div className="my-container container-spacing">
    <p className="font-bold text-lg">{title}</p>
    <div className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">{children}</div>
    {footer}
  </div>
);

const MaintenanceRequestSummary = ({
  request,
  canDecide = false,
  onApprove,
  onReject,
  canRequestParts = false,
  onRequestParts,
  canAssign = false,
  onAssign,
  canStartWork = false,
  onStartWork,
  startWorkLoading = false,
  canComplete = false,
  onComplete,
  canClose = false,
  onClose,
}) => {
  const navigate = useNavigate();
  const status = String(request?.status || '').toUpperCase();
  const approval = request?.approval;
  const assignment = request?.assignment;
  const work = request?.work;
  const closure = request?.closure || request?.close;
  const parts = Array.isArray(request?.parts) ? request.parts : [];
  const rejectReason = request?.rejectReason || approval?.rejectReason;
  const mrId = request?.id || request?._id;

  // page param is set so the listing applies this MR filter instead of restoring saved filters
  const handlePartRowClick = () => {
    const query = new URLSearchParams({ mrId, page: '1' }).toString();
    navigate(`/${ADMIN_ROUTE_PATHS.partRequest.root}?${query}`);
  };

  const showRaised = Boolean(request?.raisedAt || request?.raisedBy || request?.problemDescription);
  const showApproved = status !== 'REJECTED' && Boolean(approval?.approvedAt || approval?.approvedBy || hasValue(approval?.remark));
  const showRejected = status === 'REJECTED';
  const showAssigned = Boolean(assignment?.assignedAt || assignment?.assignedBy || hasValue(assignment?.mode));
  const showCompleted = Boolean(work?.completedAt || work?.completedBy || work?.startedAt || hasValue(work?.workDone));
  const showClosed = Boolean(closure?.verifiedAt || closure?.closedAt || closure?.verifiedBy || closure?.closedBy || hasValue(closure?.closeRemark));

  const stepActions = [
    canDecide ? { key: 'approve', text: 'Approve', onClick: onApprove } : null,
    canDecide ? { key: 'reject', text: 'Reject', type: 'danger', onClick: onReject } : null,
    canAssign ? { key: 'assign', text: 'Assign Technician', onClick: onAssign } : null,
    canStartWork ? { key: 'start', text: 'Start Work', onClick: onStartWork, loading: startWorkLoading } : null,
    canComplete ? { key: 'complete', text: 'Mark Completed', onClick: onComplete } : null,
  ].filter(Boolean);

  const showActions = canDecide || canRequestParts || canClose || stepActions.length > 0;

  return (
    <div className="space-y-5">
      <DetailCard title="Request details">
        <DetailField label="MR No">{request?.mrNo ? <Tag className="font-semibold">{request.mrNo}</Tag> : '-'}</DetailField>
        <DetailField label="Status">{request?.status ? <StatusBadge status={request.status} value={formatMaintenanceLabel(request.status)} /> : '-'}</DetailField>
        <DetailField label="Type">{request?.type ? <StatusBadge status={request.type} value={formatMaintenanceLabel(request.type)} /> : '-'}</DetailField>
        <DetailField label="Priority">{request?.priority ? <StatusBadge status={request.priority} value={formatMaintenanceLabel(request.priority)} /> : '-'}</DetailField>
        <DetailField label="Machine" value={machineLabel(request)} truncate={false} valueClassName="break-words" />
        <DetailField label="Machine Stopped" value={typeof request?.isMachineStopped === 'boolean' ? (request.isMachineStopped ? 'Yes' : 'No') : undefined} />
        <DetailField label="SLA Hours" value={hoursValue(request?.slaHours)} />
        <DetailField label="SLA Due" value={displayDate(request?.slaDueAt, true)} />
        <DetailField label="Branch" value={request?.branchId?.name || ''} />
        <DetailField label="Problem" value={request?.problemDescription} truncate={false} valueClassName="break-words" className="col-span-2 md:col-span-3 lg:col-span-4" />
        {rejectReason ? <DetailField label="Reject Reason" value={rejectReason} truncate={false} valueClassName="break-words text-red-600" className="col-span-2 md:col-span-3 lg:col-span-4" /> : null}
      </DetailCard>

      {showRaised ? (
        <DetailCard title="Raised">
          <DetailField label="Raised By" value={personText(request?.raisedBy)} />
          <DetailField label="Raised At" value={displayDate(request?.raisedAt, true)} />
          <DetailField label="Downtime Started" value={displayDate(request?.downtimeStartAt, true)} />
        </DetailCard>
      ) : null}

      {showApproved ? (
        <DetailCard title="Approved">
          <DetailField label="Approved By" value={personText(approval?.approvedBy)} />
          <DetailField label="Approved At" value={displayDate(approval?.approvedAt, true)} />
          <DetailField label="Remark" value={approval?.remark} truncate={false} valueClassName="break-words" className="col-span-2 md:col-span-3 lg:col-span-4" />
        </DetailCard>
      ) : null}

      {showRejected ? (
        <DetailCard title="Rejected">
          <DetailField label="Rejected By" value={personText(approval?.approvedBy || request?.rejectedBy)} />
          <DetailField label="Rejected At" value={displayDate(approval?.approvedAt || request?.rejectedAt, true)} />
          <DetailField label="Reject Reason" value={rejectReason} truncate={false} valueClassName="break-words" className="col-span-2 md:col-span-3 lg:col-span-4" />
        </DetailCard>
      ) : null}

      {showAssigned ? (
        <DetailCard title="Assigned">
          <DetailField label="Assigned By" value={personText(assignment?.assignedBy)} />
          <DetailField label="Assigned At" value={displayDate(assignment?.assignedAt, true)} />
          <DetailField label="Technician" value={personText(assignment?.assigneeId)} />
          <DetailField label="Mode" value={formatMaintenanceLabel(assignment?.mode)} />
          <DetailField label="Target Date" value={displayDate(assignment?.targetAt)} />
          <DetailField label="Estimated Hours" value={hoursValue(assignment?.estimatedHours)} />
        </DetailCard>
      ) : null}

      {showCompleted ? (
        <DetailCard title="Completed">
          <DetailField label="Started By" value={personText(work?.startedBy)} />
          <DetailField label="Started At" value={displayDate(work?.startedAt, true)} />
          <DetailField label="Completed By" value={personText(work?.completedBy)} />
          <DetailField label="Completed At" value={displayDate(work?.completedAt, true)} />
          <DetailField label="Fault Category" value={formatMaintenanceLabel(work?.faultCategory)} />
          <DetailField label="Labor Hours" value={hoursValue(work?.laborHours)} />
          <DetailField label="Sub Cause" value={work?.subCause} truncate={false} valueClassName="break-words" className="col-span-2" />
          <DetailField label="Work Done" value={work?.workDone} truncate={false} valueClassName="break-words" className="col-span-2 md:col-span-3 lg:col-span-4" />
          <DetailField label="Preventive Action" value={work?.preventiveAction} truncate={false} valueClassName="break-words" className="col-span-2 md:col-span-3 lg:col-span-4" />
        </DetailCard>
      ) : null}

      {showClosed ? (
        <DetailCard title="Closed">
          <DetailField label="Verified By" value={personText(closure?.verifiedBy || closure?.closedBy)} />
          <DetailField label="Verified At" value={displayDate(closure?.verifiedAt || closure?.closedAt, true)} />
          <DetailField label="Remark" value={closure?.closeRemark} truncate={false} valueClassName="break-words" className="col-span-2 md:col-span-3 lg:col-span-4" />
          {typeof closure?.isFirstTimeFix === 'boolean' ? <DetailField label="First Time Fix" value={closure.isFirstTimeFix ? 'Yes' : 'No'} /> : null}
        </DetailCard>
      ) : null}

      {parts.length ? (
        <div className="my-container container-spacing">
          <p className="font-bold text-lg pb-2">Requested Parts</p>
          <CustomTable
            columns={requestedPartColumns}
            data={parts}
            tableId="id"
            pagination={false}
            dynamicScrollY={false}
            scroll={{ x: 'max-content' }}
            onRowClick={mrId ? handlePartRowClick : undefined}
          />
        </div>
      ) : null}

      {showActions ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {stepActions.map(action => (
              <CustomButton key={action.key} type={action.type || 'primary'} text={action.text} onClick={action.onClick} loading={action.loading} />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {canRequestParts ? <CustomButton type="primary" text="Request Parts" onClick={onRequestParts} /> : null}
            {canClose ? <CustomButton type="primary" text="Verify & Close" onClick={onClose} /> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default MaintenanceRequestSummary;
