import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Button } from '@/components/AntDComponent';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import BackButton from '@/components/ui/button/BackButton';
import DocumentRefreshButton from '@/components/ui/button/DocumentRefreshButton';
import NoFoundPage from '@/components/ui/common/NoFoundPage';
import useModulePermissions from '@/hooks/useModulePermissions';
import { RESOURCES } from '@/utils/jsonFile';

import { useMaintenanceRequest } from '@/features/maintenance/maintenanceRequest';
import ApproveMaintenanceRequestModal from '@/features/maintenance/maintenanceRequest/components/ApproveMaintenanceRequestModal';
import AssignTechnicianModal from '@/features/maintenance/maintenanceRequest/components/AssignTechnicianModal';
import CloseMaintenanceRequestModal from '@/features/maintenance/maintenanceRequest/components/CloseMaintenanceRequestModal';
import CompleteWorkModal from '@/features/maintenance/maintenanceRequest/components/CompleteWorkModal';
import MaintenanceRequestProgress from '@/features/maintenance/maintenanceRequest/components/MaintenanceRequestProgress';
import MaintenanceRequestSummary from '@/features/maintenance/maintenanceRequest/components/MaintenanceRequestSummary';
import RejectMaintenanceRequestModal from '@/features/maintenance/maintenanceRequest/components/RejectMaintenanceRequestModal';
import RequestPartModal from '@/features/maintenance/maintenanceRequest/components/RequestPartModal';
import { formatMaintenanceLabel } from '@/features/maintenance/maintenanceRequest/maintenanceRequest.utils';

const requestRecord = request => {
  if (!request) return null;
  if (request.mrNo || request.problemDescription || request.status) return request;
  return request.maintenanceRequest || request.result || null;
};

const MaintenanceRequestDetail = () => {
  const { maintenanceRequestId } = useParams();
  const navigate = useNavigate();
  const { useModuleMaintenanceRequest, isViewOnly } = useModulePermissions(RESOURCES.MAINTENANCE_REQUEST);
  const { maintenanceRequest, detailLoading, error, startWorkLoading, getMaintenanceRequestById, resetMaintenanceRequestDetail, startMaintenanceRequestWork } = useMaintenanceRequest();
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [closeOpen, setCloseOpen] = useState(false);
  const [requestPartOpen, setRequestPartOpen] = useState(false);

  const request = requestRecord(maintenanceRequest);
  const status = String(request?.status || '').toUpperCase();
  const canEdit = useModuleMaintenanceRequest?.edit && !isViewOnly;
  const canDecide = canEdit && status === 'RAISED';
  const canAssign = canEdit && status === 'APPROVED';
  const canStartWork = canEdit && status === 'ASSIGNED';
  const canComplete = canEdit && status === 'IN_PROGRESS';
  const canClose = canEdit && Boolean(status) && status !== 'REJECTED' && status !== 'CLOSED';
  const canRequestParts = canEdit && Boolean(status) && status !== 'REJECTED' && status !== 'CLOSED';

  useEffect(() => {
    const controller = new AbortController();
    if (maintenanceRequestId) {
      getMaintenanceRequestById({ maintenanceRequestId, signal: controller.signal });
    } else {
      resetMaintenanceRequestDetail();
    }

    return () => {
      controller.abort();
      resetMaintenanceRequestDetail();
    };
  }, [maintenanceRequestId, getMaintenanceRequestById, resetMaintenanceRequestDetail]);

  const handleRefresh = async () => {
    await getMaintenanceRequestById({ maintenanceRequestId });
  };

  const handleStartWork = async () => {
    if (startWorkLoading || !canStartWork) return;

    try {
      await startMaintenanceRequestWork({ maintenanceRequestId });
    } catch {
      // The slice already shows the error toast.
    }
  };

  if (detailLoading || (!request && !error)) {
    return <CustomLoader variant="ring" text="Loading..." fullScreen={true} />;
  }

  if (!request) {
    return (
      <NoFoundPage
        title="Maintenance request not found"
        description="This maintenance request may have been deleted or you may not have access to view it."
        action={
          <Button type="primary" onClick={() => navigate('/maintenance-request')}>
            Back To Maintenance Requests
          </Button>
        }
      />
    );
  }

  return (
    <>
      <div className="bg-white border-b border-gray-100 px-4 py-2 -m-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <BackButton />
            <div className="flex flex-col">
              <h1 className="text-[18px] font-semibold text-gray-900">Maintenance Request Details</h1>
              <div className="flex items-center space-x-2 mt-1">
                {request.mrNo ? (
                  <>
                    <span className="text-sm font-medium text-gray-600">{request.mrNo}</span>
                    <span className="text-gray-400">•</span>
                  </>
                ) : null}
                {request.status ? <StatusBadge status={request.status} value={formatMaintenanceLabel(request.status)} /> : null}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <DocumentRefreshButton onRefresh={handleRefresh} />
          </div>
        </div>
      </div>
      <div className="space-y-5 pt-6">
        <MaintenanceRequestProgress request={request} />
        <MaintenanceRequestSummary
          request={request}
          canDecide={canDecide}
          onApprove={() => setApproveOpen(true)}
          onReject={() => setRejectOpen(true)}
          canRequestParts={canRequestParts}
          onRequestParts={() => setRequestPartOpen(true)}
          canAssign={canAssign}
          onAssign={() => setAssignOpen(true)}
          canStartWork={canStartWork}
          onStartWork={handleStartWork}
          startWorkLoading={startWorkLoading}
          canComplete={canComplete}
          onComplete={() => setCompleteOpen(true)}
          canClose={canClose}
          onClose={() => setCloseOpen(true)}
        />
      </div>
      <ApproveMaintenanceRequestModal open={approveOpen} request={request} onClose={() => setApproveOpen(false)} />
      <RejectMaintenanceRequestModal open={rejectOpen} request={request} onClose={() => setRejectOpen(false)} />
      <AssignTechnicianModal open={assignOpen} request={request} onClose={() => setAssignOpen(false)} />
      <CompleteWorkModal open={completeOpen} request={request} onClose={() => setCompleteOpen(false)} />
      <CloseMaintenanceRequestModal open={closeOpen} request={request} onClose={() => setCloseOpen(false)} />
      <RequestPartModal open={requestPartOpen} request={request} onClose={() => setRequestPartOpen(false)} />
    </>
  );
};

export default MaintenanceRequestDetail;
