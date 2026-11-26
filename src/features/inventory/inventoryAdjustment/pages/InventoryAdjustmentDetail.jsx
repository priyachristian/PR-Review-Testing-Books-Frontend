import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

// Components
import { Button, Tabs, Tag } from '@/components/AntDComponent';
import BackButton from '@/components/ui/button/BackButton';
import DocumentRefreshButton from '@/components/ui/button/DocumentRefreshButton';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import NoFoundPage from '@/components/ui/common/NoFoundPage';
import InventoryAdjustmentDetailSkeleton from '../components/InventoryAdjustmentDetailSkeleton';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import { ActionButtons, DetailField, DocumentMetadata } from '@/components/ui';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomModal from '@/components/feedback/formModal/CustomModal';

// Hooks
import useModulePermissions from '@/hooks/useModulePermissions';

// Extras
import { useInventoryAdjustment, inventoryAdjustmentDetailItemsColumn } from '@/features/inventory/inventoryAdjustment';
import { MODULE_NAMES, INVENTORY_ADJUSTMENT_REASONS, LEDGER_SOURCE_MODULES, PERMISSION_MESSAGES } from '@/utils/constants';
import { RESOURCES } from '@/utils/jsonFile';
import { dateFormateForUi } from '@/utils/services';
import Icons from 'assets/icons/icon';
import StockMovementPanel from '@/components/dataDisplay/StockMovementPanel';
import DocumentJournalPanel from '@/components/dataDisplay/DocumentJournalPanel';
import BatchDetailsDrawer from '@/components/dataDisplay/BatchDetailsDrawer';
import { useViewInventory } from '@/features/inventory/viewInventory';
import { API_ROUTES } from '@/utils/apiRoute';

const InventoryAdjustmentDetail = () => {
  const { inventoryId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeKey, setActiveKey] = useState('1');
  const {
    loading,
    getInventoryAdjustmentById,
    inventoryAdjustmentById: inventoryAdjustment,
    approveInventoryAdjustment,
    rejectInventoryAdjustment,
    approveLoading,
    rejectLoading,
  } = useInventoryAdjustment();
  const { itemInventoryBatch, itemInventoryBatchLoading, getItemInventoryBatchById, resetItemInventoryBatch } = useViewInventory();
  const { useInventoryAdjustmentPermission, isViewOnly } = useModulePermissions(RESOURCES.INVENTORY_ADJUSTMENT);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [batchDrawerOpen, setBatchDrawerOpen] = useState(false);

  const handleBatchClick = async (itemBatchId, item) => {
    setBatchDrawerOpen(true);
    await getItemInventoryBatchById({ itemId: item._id, batchId: itemBatchId });
  };

  const handleBatchDrawerClose = () => {
    setBatchDrawerOpen(false);
    resetItemInventoryBatch();
  };

  useEffect(() => {
    const controller = new AbortController();
    if (inventoryId) {
      getInventoryAdjustmentById({ inventoryId, signal: controller.signal });
    }
    return () => controller.abort();
  }, [inventoryId, getInventoryAdjustmentById]);

  useEffect(() => {
    setActiveKey('1');
  }, [inventoryId]);

  const handleRefresh = async () => {
    await getInventoryAdjustmentById({ inventoryId });
  };

  const handleEditClick = () => {
    navigate(`/inventory-adjustment/${inventoryId}/edit`, {
      state: {
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleApproveClick = () => {
    setApproveModalOpen(true);
  };

  const handleRejectClick = () => {
    setRejectModalOpen(true);
  };

  const handleApproveSubmit = async () => {
    await approveInventoryAdjustment({ inventoryId });
    setApproveModalOpen(false);
    getInventoryAdjustmentById({ inventoryId });
  };

  const handleRejectSubmit = async () => {
    await rejectInventoryAdjustment({ inventoryId });
    setRejectModalOpen(false);
    getInventoryAdjustmentById({ inventoryId });
  };

  const Overview = () => (
    <div className="space-y-10 pb-5">
      <div className="my-container container-spacing">
        <p className="font-bold text-lg">Basic Information</p>

        <div className="mt-2 space-y-3">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-y-3">
            <DetailField label="Adjustment Number">
              {inventoryAdjustment?.inventoryAdjustmentNumber ? <Tag className="font-semibold m-0">{inventoryAdjustment.inventoryAdjustmentNumber}</Tag> : '-'}
            </DetailField>
            <DetailField label="Adjustment Date" value={inventoryAdjustment?.adjustmentDate ? dateFormateForUi(inventoryAdjustment.adjustmentDate) : undefined} />
            <DetailField label="Reason" value={INVENTORY_ADJUSTMENT_REASONS?.[inventoryAdjustment?.reason] || inventoryAdjustment?.reason} />
            <DetailField label="Reference Number" value={inventoryAdjustment?.referenceNumber} />
            <DetailField label="Account" value={inventoryAdjustment?.accountId?.accountName} truncate={false} valueClassName="break-words" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-y-3">
            <DetailField label="Division" value={inventoryAdjustment?.divisionId?.name} />
            <DetailField label="Branch" value={inventoryAdjustment?.branchId?.name} />
            <DetailField label="Warehouse" value={inventoryAdjustment?.warehouseId?.name} />
            <DetailField label="Total Items" value={inventoryAdjustment?.items?.length ?? 0} />
          </div>

          <div className="grid md:grid-cols-1 gap-y-3">
            <DetailField label="Description" value={inventoryAdjustment?.description} valueClassName="whitespace-pre-wrap" truncate={false} />
          </div>
        </div>
      </div>

      <div className="my-container container-spacing">
        <p className="font-bold text-lg pb-2">Adjusted Items ({inventoryAdjustment?.items?.length || 0})</p>
        <CustomTable columns={inventoryAdjustmentDetailItemsColumn()} data={inventoryAdjustment?.items || []} pagination={false} scroll={{ x: 'max-content' }} dynamicScrollY={false} />
      </div>
    </div>
  );

  const items = [
    {
      key: '1',
      label: 'Overview',
      children: <Overview />,
    },
    {
      key: 'stock-movement',
      label: 'Stock Movement',
      children: <StockMovementPanel url={API_ROUTES.INVENTORY.INVENTORY_ADJUSTMENT.STOCK_MOVEMENT(inventoryId)} onBatchClick={handleBatchClick} />,
    },
    {
      key: 'journal-entries',
      label: 'Journal',
      children: <DocumentJournalPanel sourceModule={LEDGER_SOURCE_MODULES.INVENTORY_ADJUSTMENT} sourceId={inventoryId} />,
    },
  ];

  if (loading) {
    return <InventoryAdjustmentDetailSkeleton />;
  }

  if (!inventoryAdjustment) {
    return <NoFoundPage docType={MODULE_NAMES?.INVENTORY_ADJUSTMENT || 'Inventory Adjustment'} />;
  }

  const statusLabel = inventoryAdjustment?.status || '-';
  const canEdit = useInventoryAdjustmentPermission?.edit && !isViewOnly && inventoryAdjustment?.status === 'DRAFT';
  const editTooltip = canEdit
    ? 'Edit'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useInventoryAdjustmentPermission?.edit
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : `This document cannot be edited in its current status - ${statusLabel}.`;
  const approveTooltip = canEdit
    ? 'Approve'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useInventoryAdjustmentPermission?.edit
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : `This document cannot be approved in its current status - ${statusLabel}.`;
  const rejectTooltip = canEdit
    ? 'Reject'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useInventoryAdjustmentPermission?.edit
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : `This document cannot be rejected in its current status - ${statusLabel}.`;

  return (
    <>
      <div className="bg-white border-b border-gray-100 px-4 py-2 -m-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-4 min-w-0">
            <BackButton />
            <div className="flex flex-col">
              <h1 className="text-[18px] font-semibold text-gray-900">Inventory Adjustment Details</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-medium text-gray-600">{inventoryAdjustment?.inventoryAdjustmentNumber}</span>
                {inventoryAdjustment?.status && (
                  <>
                    <span className="text-gray-400">•</span>
                    <StatusBadge status={inventoryAdjustment.status} value={inventoryAdjustment.status} />
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DocumentRefreshButton onRefresh={handleRefresh} />
          </div>
        </div>
      </div>

      <div className="w-full pt-3">
        <div className="flex flex-col xl:flex-row gap-4">
          <div className="min-w-0 flex-1">
            <Tabs activeKey={activeKey} onChange={setActiveKey} items={items} />
          </div>
          <div className="xl:mt-[62px] h-fit xl:w-[250px] shrink-0 space-y-3">
            <ActionButtons>
              <PermissionButton
                canAccess={useInventoryAdjustmentPermission?.edit}
                isViewOnly={isViewOnly}
                disabled={inventoryAdjustment?.status !== 'DRAFT'}
                tooltipTitle={editTooltip}
                tooltipProps={{ placement: 'left' }}
                wrapperClassName="block w-full"
                icon={<Icons.EditOutlined />}
                block
                onClick={canEdit ? handleEditClick : undefined}
              >
                Edit
              </PermissionButton>
              <PermissionButton
                canAccess={useInventoryAdjustmentPermission?.edit}
                isViewOnly={isViewOnly}
                disabled={inventoryAdjustment?.status !== 'DRAFT'}
                tooltipTitle={approveTooltip}
                tooltipProps={{ placement: 'left' }}
                wrapperClassName="block w-full"
                type="primary"
                icon={<Icons.CheckOutlined />}
                block
                onClick={canEdit ? handleApproveClick : undefined}
              >
                Approve
              </PermissionButton>
              <PermissionButton
                canAccess={useInventoryAdjustmentPermission?.edit}
                isViewOnly={isViewOnly}
                disabled={inventoryAdjustment?.status !== 'DRAFT'}
                tooltipTitle={rejectTooltip}
                tooltipProps={{ placement: 'left' }}
                wrapperClassName="block w-full"
                danger
                icon={<Icons.CloseOutlined />}
                block
                onClick={canEdit ? handleRejectClick : undefined}
              >
                Reject
              </PermissionButton>
            </ActionButtons>
            <DocumentMetadata
              data={{
                addedBy: inventoryAdjustment?.createdBy,
                createdAt: inventoryAdjustment?.createdAt,
                updatedBy: inventoryAdjustment?.updatedBy || null,
                updatedAt: inventoryAdjustment?.updatedAt,
              }}
            />
          </div>
        </div>
      </div>
      <CustomModal modalOpen={approveModalOpen} setModalOpen={setApproveModalOpen} title="Inventory Approve">
        <p className="mb-4">Are you sure to approve this inventory?</p>
        <div className="flex justify-end gap-2">
          <Button key="back" onClick={() => setApproveModalOpen(false)}>
            Go Back
          </Button>
          <Button key="submit" type="primary" loading={approveLoading} style={{ minWidth: 110 }} onClick={handleApproveSubmit}>
            Approve
          </Button>
        </div>
      </CustomModal>
      <CustomModal modalOpen={rejectModalOpen} setModalOpen={setRejectModalOpen} title="Inventory Reject">
        <p className="mb-4">Are you sure to reject this inventory?</p>
        <div className="flex justify-end gap-2">
          <Button key="back" onClick={() => setRejectModalOpen(false)}>
            Go Back
          </Button>
          <Button key="submit" type="primary" danger loading={rejectLoading} style={{ minWidth: 90 }} onClick={handleRejectSubmit}>
            Reject
          </Button>
        </div>
      </CustomModal>
      <BatchDetailsDrawer open={batchDrawerOpen} batch={itemInventoryBatch} loading={itemInventoryBatchLoading} onClose={handleBatchDrawerClose} />
    </>
  );
};

export default InventoryAdjustmentDetail;
