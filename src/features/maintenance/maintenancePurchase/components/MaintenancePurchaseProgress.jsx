import { StatusProgress, buildStatusProgressSteps } from '@/components/ui';

const FLOW = [
  { key: 'PR', label: 'PR' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'PO', label: 'PO' },
  { key: 'PARTIAL', label: 'Partial' },
  { key: 'RECEIVED', label: 'Received' },
];

const MaintenancePurchaseProgress = ({ purchase }) => {
  const steps = buildStatusProgressSteps(FLOW, purchase?.stage);
  return <StatusProgress steps={steps} />;
};

export default MaintenancePurchaseProgress;
