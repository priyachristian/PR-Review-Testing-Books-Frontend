import { StatusProgress, buildStatusProgressSteps } from '@/components/ui';

const FLOW = [
  { key: 'RAISED', label: 'Raised' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'ASSIGNED', label: 'Assigned' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'COMPLETED', label: 'Completed' },
  { key: 'CLOSED', label: 'Closed' },
];

const rejectedSteps = [
  { key: 'RAISED', label: 'Raised', state: 'done', stepNumber: 1 },
  { key: 'REJECTED', label: 'Rejected', state: 'rejected', stepNumber: 2 },
];

const SKIP_WHEN_CLOSED = [
  { flag: 'isApproved', keys: ['APPROVED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED'] },
  { flag: 'isAssigned', keys: ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED'] },
  { flag: 'isInProgress', keys: ['IN_PROGRESS', 'COMPLETED'] },
  { flag: 'isCompleted', keys: ['COMPLETED'] },
];

const getClosedFlow = request => {
  const skipKeys = new Set();
  SKIP_WHEN_CLOSED.forEach(({ flag, keys }) => {
    if (request?.[flag] === false) {
      keys.forEach(key => skipKeys.add(key));
    }
  });
  return FLOW.filter(step => !skipKeys.has(step.key));
};

const MaintenanceRequestProgress = ({ request }) => {
  const status = String(request?.status || '').toUpperCase();
  const flow = status === 'CLOSED' ? getClosedFlow(request) : FLOW;
  const steps = status === 'REJECTED' ? rejectedSteps : buildStatusProgressSteps(flow, status);
  return <StatusProgress steps={steps} />;
};

export default MaintenanceRequestProgress;
