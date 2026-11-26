import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { Button, Tag } from '@/components/AntDComponent';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import BackButton from '@/components/ui/button/BackButton';
import CustomButton from '@/components/ui/button/CustomButton';
import DocumentRefreshButton from '@/components/ui/button/DocumentRefreshButton';
import DetailField from '@/components/ui/common/DetailField';
import NoFoundPage from '@/components/ui/common/NoFoundPage';
import useModulePermissions from '@/hooks/useModulePermissions';
import { formatAmount } from '@/utils/currency';
import { RESOURCES } from '@/utils/jsonFile';
import { dateFormateForUi } from '@/utils/services';

import { maintenancePurchaseItemColumns, useMaintenancePurchase } from '@/features/maintenance/maintenancePurchase';
import ApproveMaintenancePurchaseModal from '@/features/maintenance/maintenancePurchase/components/ApproveMaintenancePurchaseModal';
import MaintenancePurchaseProgress from '@/features/maintenance/maintenancePurchase/components/MaintenancePurchaseProgress';
import RaiseMaintenancePurchasePoModal from '@/features/maintenance/maintenancePurchase/components/RaiseMaintenancePurchasePoModal';
import ReceiveMaintenancePurchaseModal from '@/features/maintenance/maintenancePurchase/components/ReceiveMaintenancePurchaseModal';
import { linkedMrNo, maintenancePurchaseStageLabel } from '@/features/maintenance/maintenancePurchase/maintenancePurchase.utils';

const purchaseRecord = purchase => {
  if (!purchase) return null;
  if (purchase.docNo || purchase.stage || purchase.vendor) return purchase;
  return purchase.maintenancePurchase || purchase.result || null;
};

const displayDate = (value, withTime = false) => (value ? dateFormateForUi(value, withTime ? { withTime: true } : undefined) : undefined);

const detailTableProps = { pagination: false, dynamicScrollY: false, scroll: { x: 'max-content' } };

const MaintenancePurchaseDetail = () => {
  const { maintenancePurchaseId } = useParams();
  const navigate = useNavigate();
  const { useModuleMaintenancePurchase, isViewOnly } = useModulePermissions(RESOURCES.MAINTENANCE_PURCHASE);
  const { maintenancePurchase, detailLoading, error, getMaintenancePurchaseById, resetMaintenancePurchaseDetail } = useMaintenancePurchase();
  const [approveOpen, setApproveOpen] = useState(false);
  const [raisePoOpen, setRaisePoOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);

  const purchase = purchaseRecord(maintenancePurchase);
  const items = Array.isArray(purchase?.items) ? purchase.items : [];
  const linkedMr = linkedMrNo(purchase?.linkedMrId);
  const stage = String(purchase?.stage || '').toUpperCase();
  const canEdit = useModuleMaintenancePurchase?.edit && !isViewOnly;
  const canApprove = canEdit && stage === 'PR';
  const canRaisePo = canEdit && stage === 'APPROVED';
  const canReceive = canEdit && (stage === 'PO' || stage === 'PARTIAL');

  useEffect(() => {
    const controller = new AbortController();
    if (maintenancePurchaseId) {
      getMaintenancePurchaseById({ maintenancePurchaseId, signal: controller.signal });
    } else {
      resetMaintenancePurchaseDetail();
    }

    return () => {
      controller.abort();
      resetMaintenancePurchaseDetail();
    };
  }, [maintenancePurchaseId, getMaintenancePurchaseById, resetMaintenancePurchaseDetail]);

  const handleRefresh = async () => {
    await getMaintenancePurchaseById({ maintenancePurchaseId });
  };

  if (detailLoading || (!purchase && !error)) {
    return <CustomLoader variant="ring" text="Loading..." fullScreen={true} />;
  }

  if (!purchase) {
    return (
      <NoFoundPage
        title="Maintenance purchase not found"
        description="This purchase request may have been deleted or you may not have access to view it."
        action={
          <Button type="primary" onClick={() => navigate('/maintenance-purchase')}>
            Back To Maintenance Purchases
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
              <h1 className="text-[18px] font-semibold text-gray-900">Maintenance Purchase Details</h1>
              <div className="flex items-center space-x-2 mt-1">
                {purchase.docNo ? (
                  <>
                    <span className="text-sm font-medium text-gray-600">{purchase.docNo}</span>
                    <span className="text-gray-400">•</span>
                  </>
                ) : null}
                {purchase.stage ? <StatusBadge status={purchase.stage} value={maintenancePurchaseStageLabel(purchase.stage)} /> : null}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <DocumentRefreshButton onRefresh={handleRefresh} />
          </div>
        </div>
      </div>
      <div className="space-y-5 pt-6">
        <MaintenancePurchaseProgress purchase={purchase} />

        <div className="my-container container-spacing">
          <p className="font-bold text-lg">Purchase details</p>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
            <DetailField label="Doc No">{purchase.docNo ? <Tag className="font-semibold">{purchase.docNo}</Tag> : '-'}</DetailField>
            {purchase.partRequestId?.partRequestNo ? (
              <DetailField label="Part Request No">{purchase.partRequestId?.partRequestNo ? <Tag className="font-semibold">{purchase.partRequestId?.partRequestNo}</Tag> : '-'}</DetailField>
            ) : null}
            <DetailField label="Stage">{purchase.stage ? <StatusBadge status={purchase.stage} value={maintenancePurchaseStageLabel(purchase.stage)} /> : '-'}</DetailField>
            <DetailField label="Vendor" value={purchase.vendor} truncate={false} valueClassName="break-words" />
            <DetailField label="Linked MR">{linkedMr ? <Tag className="font-semibold">{linkedMr}</Tag> : '-'}</DetailField>
            <DetailField label="Total Amount" value={formatAmount(purchase.totalAmount)} />
            <DetailField label="PR Date" value={displayDate(purchase.prDate, true)} />
            <DetailField label="Approved Date" value={displayDate(purchase.approvedDate, true)} />
            <DetailField label="PO Date" value={displayDate(purchase.poDate, true)} />
            <DetailField label="Expected Delivery" value={displayDate(purchase.expectedDelivery)} />
          </div>
        </div>

        <div className="my-container container-spacing">
          <p className="font-bold text-lg pb-2">Items</p>
          <CustomTable columns={maintenancePurchaseItemColumns} data={items.map((item, index) => ({ ...item, key: item?._id || item?.id || index }))} tableId="key" {...detailTableProps} />
          {canApprove || canRaisePo || canReceive ? (
            <div className="mt-4 flex items-center justify-end gap-2">
              {canApprove ? <CustomButton type="primary" text="Approve" onClick={() => setApproveOpen(true)} /> : null}
              {canRaisePo ? <CustomButton type="primary" text="Raise PO" onClick={() => setRaisePoOpen(true)} /> : null}
              {canReceive ? <CustomButton type="primary" text="Receive Goods" onClick={() => setReceiveOpen(true)} /> : null}
            </div>
          ) : null}
        </div>
      </div>
      <ApproveMaintenancePurchaseModal open={approveOpen} purchase={purchase} onClose={() => setApproveOpen(false)} />
      <RaiseMaintenancePurchasePoModal open={raisePoOpen} purchase={purchase} onClose={() => setRaisePoOpen(false)} />
      <ReceiveMaintenancePurchaseModal open={receiveOpen} purchase={purchase} onClose={() => setReceiveOpen(false)} />
    </>
  );
};

export default MaintenancePurchaseDetail;
