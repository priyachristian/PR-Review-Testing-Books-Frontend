import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

// Components
import { Alert, Tabs, Tag } from '@/components/AntDComponent';
import BackButton from '@/components/ui/button/BackButton';
import DocumentRefreshButton from '@/components/ui/button/DocumentRefreshButton';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import InventoryTransferDetailSkeleton from '../components/InventoryTransferDetailSkeleton';
import TransferApproveModal from '../components/TransferApproveModal';
import TransferRejectModal from '../components/TransferRejectModal';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import { ActionButtons, DetailField, DocumentMetadata } from '@/components/ui';
import PermissionButton from '@/components/ui/button/PermissionButton';

// Hooks
import { useItemMaster } from '@/features/allMaster/item';
import useModulePermissions from '@/hooks/useModulePermissions';

// Extras
import NoFoundPage from '@/components/ui/common/NoFoundPage';
import { MODULE_NAMES, PERMISSION_MESSAGES } from '@/utils/constants';
import { dateFormateForUi } from 'utils/services';
import { RESOURCES } from '@/utils/jsonFile';
import Icons from 'assets/icons/icon';
import { inventoryTransferRawMaterialsColumn } from '../inventoryTransfer.columns';
import StockMovementPanel from '@/components/dataDisplay/StockMovementPanel';
import BatchDetailsDrawer from '@/components/dataDisplay/BatchDetailsDrawer';
import { useViewInventory } from '@/features/inventory/viewInventory';
import { API_ROUTES } from '@/utils/apiRoute';

const STATUS_ENUM = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

const InventoryTransferDetail = () => {
  const { transferId } = useParams();
  const navigate = useNavigate();
  const [activeKey, setActiveKey] = useState('1');
  const { inventoryTransferDetailLoading: loading, inventoryTransferDetail: record, getInventoryTransferById, resetInventoryTransferDetail } = useItemMaster();
  const { itemInventoryBatch, itemInventoryBatchLoading, getItemInventoryBatchById, resetItemInventoryBatch } = useViewInventory();
  const { useModuleInventoryTransferRequest, isViewOnly } = useModulePermissions(RESOURCES.INVENTORY_TRANSFER_REQUEST);
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
    if (transferId) {
      getInventoryTransferById({ inventoryTransferId: transferId, signal: controller.signal });
    } else {
      resetInventoryTransferDetail();
    }
    return () => {
      resetInventoryTransferDetail();
      controller.abort();
    };
  }, [transferId]);

  useEffect(() => {
    setActiveKey('1');
  }, [transferId]);

  const handleRefresh = async () => {
    await getInventoryTransferById({ inventoryTransferId: transferId });
  };

  const BasicInfo = () => {
    return (
      <div className="space-y-10 pb-5">
        <div className="my-container container-spacing">
          <p className="font-bold text-lg">General Information</p>

          <div className="mt-2 space-y-3">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-y-3">
              <DetailField label="Transfer ID">{record?.transferId ? <Tag className="font-semibold m-0">{record.transferId}</Tag> : '-'}</DetailField>
              <DetailField label="Production Order">
                {record?.productionOrderId?.productionOrderCode ? (
                  <Tag className="font-semibold m-0 cursor-pointer" onClick={() => navigate(`/production-orders/${record.productionOrderId._id}`)}>
                    {record.productionOrderId.productionOrderCode}
                  </Tag>
                ) : (
                  '-'
                )}
              </DetailField>
              <DetailField label="Transfer Date" value={record?.date ? dateFormateForUi(record.date) : undefined} />
              <DetailField label="Status">{record?.status ? <StatusBadge status={record.status} value={STATUS_ENUM?.[record.status] || record.status} /> : '-'}</DetailField>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-y-3">
              <DetailField label="Item Number">{record?.itemId?.itemNo ? <Tag className="font-semibold m-0">{record.itemId.itemNo}</Tag> : '-'}</DetailField>
              <DetailField label="Item Name" value={record?.itemId?.itemName} truncate={false} valueClassName="break-words" />
              <DetailField label="Item Unit" value={record?.itemUnitId?.name} />
              <DetailField label="Quantity" value={record?.quantity} />
            </div>
          </div>
        </div>

        <div className="my-container container-spacing">
          <p className="font-bold text-lg">Warehouse Information</p>

          <div className="mt-2 space-y-3">
            <div className="grid md:grid-cols-2 gap-y-3">
              <DetailField label="From Warehouse" value={record?.fromWarehouseId?.name} />
              <DetailField label="To Warehouse" value={record?.toWarehouseId?.name} />
            </div>
          </div>
        </div>

        <div className="my-container container-spacing">
          <p className="font-bold text-lg">Additional Details</p>

          <div className="mt-2 space-y-3">
            <DetailField label="Notes" value={record?.notes} valueClassName="whitespace-pre-wrap" truncate={false} />
          </div>
        </div>

        {record?.rawMaterials && record.rawMaterials.length > 0 && (
          <div className="my-container container-spacing">
            <p className="font-bold text-lg pb-2">Raw Materials ({record.rawMaterials.length})</p>
            <CustomTable columns={inventoryTransferRawMaterialsColumn()} data={record.rawMaterials} pagination={false} scroll={{ x: 'max-content' }} dynamicScrollY={false} />
          </div>
        )}
      </div>
    );
  };

  // A production-order request whose source and destination warehouse are the same only confirms the materials
  // for production; approving it moves no stock, so the Stock Movement tab explains that instead of an empty list.
  const fromWarehouseKey = record?.fromWarehouseId?._id || record?.fromWarehouseId;
  const toWarehouseKey = record?.toWarehouseId?._id || record?.toWarehouseId;
  const isSameWarehouseProductionRequest = Boolean(record?.isProductionOrderReq || record?.productionOrderId) && Boolean(fromWarehouseKey) && String(fromWarehouseKey) === String(toWarehouseKey);
  const productionOrderCode = record?.productionOrderId?.productionOrderCode;
  const sameWarehouseName = record?.fromWarehouseId?.name;
  const sameWarehouseMessage = `This request was raised by ${productionOrderCode ? `production order ${productionOrderCode}` : 'a production order'} with the same source and destination warehouse${
    sameWarehouseName ? ` (${sameWarehouseName})` : ''
  }. It only approves the raw materials for production, so no stock moves between warehouses.`;

  const items = [
    {
      key: '1',
      label: 'Overview',
      children: <BasicInfo />,
    },
    {
      key: 'stock-movement',
      label: 'Stock Movement',
      children: isSameWarehouseProductionRequest ? (
        <Alert type="info" showIcon message="No physical stock movement" description={sameWarehouseMessage} />
      ) : (
        <StockMovementPanel url={API_ROUTES.INVENTORY.INVENTORY_TRANSFER.STOCK_MOVEMENT(transferId)} onBatchClick={handleBatchClick} />
      ),
    },
  ];

  if (loading) {
    return <InventoryTransferDetailSkeleton />;
  }

  if (!record && !loading) {
    return <NoFoundPage docType={MODULE_NAMES?.INVENTORY_TRANSFER} />;
  }

  const statusLabel = STATUS_ENUM?.[record?.status] || record?.status || '-';
  const canEdit = useModuleInventoryTransferRequest?.edit && !isViewOnly && record?.status === 'PENDING';
  const approveTooltip = canEdit
    ? 'Approve Request'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useModuleInventoryTransferRequest?.edit
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : `This document cannot be approved in its current status - ${statusLabel}.`;
  const rejectTooltip = canEdit
    ? 'Reject Request'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useModuleInventoryTransferRequest?.edit
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : `This document cannot be rejected in its current status - ${statusLabel}.`;

  return (
    <>
      <div className="bg-white border-b border-gray-100 px-4 py-2 -m-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-4 min-w-0">
            <BackButton />
            <div className="flex flex-col">
              <h1 className="text-[18px] font-semibold text-gray-900">Inventory Transfer Request Details</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-medium text-gray-600">{record?.transferId}</span>
                {record?.status && (
                  <>
                    <span className="text-gray-400">•</span>
                    <StatusBadge status={record.status} value={STATUS_ENUM?.[record.status] || record.status} />
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
                canAccess={useModuleInventoryTransferRequest?.edit}
                isViewOnly={isViewOnly}
                disabled={record?.status !== 'PENDING'}
                tooltipTitle={approveTooltip}
                tooltipProps={{ placement: 'left' }}
                wrapperClassName="block w-full"
                type="primary"
                icon={<Icons.CheckOutlined />}
                block
                onClick={canEdit ? () => setApproveModalOpen(true) : undefined}
              >
                Approve Request
              </PermissionButton>
              <PermissionButton
                canAccess={useModuleInventoryTransferRequest?.edit}
                isViewOnly={isViewOnly}
                disabled={record?.status !== 'PENDING'}
                tooltipTitle={rejectTooltip}
                tooltipProps={{ placement: 'left' }}
                wrapperClassName="block w-full"
                danger
                icon={<Icons.CloseOutlined />}
                block
                onClick={canEdit ? () => setRejectModalOpen(true) : undefined}
              >
                Reject Request
              </PermissionButton>
            </ActionButtons>
            <DocumentMetadata
              data={{
                addedBy: record?.addedBy,
                createdAt: record?.createdAt,
                updatedBy: record?.updatedBy || null,
                updatedAt: record?.updatedAt,
              }}
            />
          </div>
        </div>
      </div>
      <TransferApproveModal open={approveModalOpen} record={record} onClose={() => setApproveModalOpen(false)} onSuccess={handleRefresh} />
      <TransferRejectModal open={rejectModalOpen} record={record} onClose={() => setRejectModalOpen(false)} onSuccess={handleRefresh} />
      <BatchDetailsDrawer open={batchDrawerOpen} batch={itemInventoryBatch} loading={itemInventoryBatchLoading} onClose={handleBatchDrawerClose} />
    </>
  );
};

export default InventoryTransferDetail;
