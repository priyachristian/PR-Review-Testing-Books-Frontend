import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { renderPdfToBlob } from '@/utils/loadReactPdf';

// Components
import { Button, Dropdown, Popconfirm, Tabs, Tag, Tooltip } from '@/components/AntDComponent';
import BackButton from '@/components/ui/button/BackButton';
import DocumentRefreshButton from '@/components/ui/button/DocumentRefreshButton';
import PermissionButton from '@/components/ui/button/PermissionButton';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import StatusConfirmPopover from '@/components/feedback/confirmModal/StatusConfirmPopover';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import NoFoundPage from '@/components/ui/common/NoFoundPage';
import ProductionDetailSkeleton from '../components/ProductionDetailSkeleton';
import ProductionProcessFlow from '../components/ProductionProcessFlow';
import { AsyncPdfDownloadLink } from '@/components/ui/common/AsyncPdfDownloadLink';
import { ActionButtons, DetailField, DocumentMetadata } from '@/components/ui';
import PageHeader from '@/components/ui/common/PageHeader';
import { BomSubmitPanel, ProcessSubmitPanel } from '../components/ProductionSubmitPanel';
import { BomViewPanel, ProcessViewPanel } from '../components/ProductionViewPanel';
import Toast from '@/components/ui/common/Toast';

// Hooks
import { useProductionOrder } from '@/features/production/productionOrder';
import { useViewInventory } from '@/features/inventory/viewInventory';
import { ItemDrawerDetails, useItemMaster } from '@/features/allMaster/item';
import { useProfile } from '@/features/setting/profile/useProfile';
import useModulePermissions from 'hooks/useModulePermissions';

// Extras
import {
  bomMaterialConsumptionColumns,
  bomSubmissionListColumns,
  inventoryImpactColumns,
  materialConsumptionColumns,
  scrapRejectionColumns,
  transferMaterialColumns,
} from '@/features/production/productionOrder';
import Icons from 'assets/icons/icon';
import {
  MODULE_NAMES,
  PRODUCTION_MODULE_BACKEND_STATUS,
  PRODUCTION_MODULE_STATUS,
  PRODUCTION_MODULE_METHOD,
  PRODUCTION_MODULE_METHOD_LABEL,
  LEDGER_SOURCE_MODULES,
  MARK_AS_CLOSE_ALLOWED_STATUSES,
  PERMISSION_MESSAGES,
  PRODUCTION_ACTIVE_STATUSES,
} from '@/utils/constants';
import { dateFormateForUi, roundQty } from '@/utils/services';
import { colorPalette } from '@/utils/theme';
import { shouldPreventNavigation } from '@/utils/util';
import { RESOURCES } from '@/utils/jsonFile';
import StockMovementPanel from '@/components/dataDisplay/StockMovementPanel';
import DocumentJournalPanel from '@/components/dataDisplay/DocumentJournalPanel';
import ProductionCostBreakdown from '../components/ProductionCostBreakdown';
import ProductionActivityPanel from '../components/ProductionActivityPanel';
import BatchDetailsDrawer from '@/components/dataDisplay/BatchDetailsDrawer';
import TransferApproveModal from '@/features/inventory/inventoryTransfer/components/TransferApproveModal';
import TransferRejectModal from '@/features/inventory/inventoryTransfer/components/TransferRejectModal';
import { API_ROUTES } from '@/utils/apiRoute';

const panelTableProps = { pagination: false, dynamicScrollY: false, scroll: { x: 'max-content' } };

const mapBomScrapRows = data =>
  data.scrapOut.map(row => ({
    itemNo: row.item?.itemNo,
    itemName: row.item?.itemName,
    itemUnit: row.item?.itemUnit,
    quantity: row.totalScrapOutQty,
    itemId: row.item,
    batches: row.batches,
    warehouseName: data.productionWarehouseId?.name,
    value: row.batches.reduce((sum, batch) => sum + batch.quantity * batch.purchasePrice, 0),
  }));

const mapBomFgRejectionRows = data =>
  data.submissionHistory
    .filter(submission => submission.fgRejectedQty)
    .map(submission => ({
      itemNo: data.itemId?.itemNo,
      itemName: data.itemId?.itemName,
      itemUnit: data.itemId?.itemUnit,
      quantity: submission.fgRejectedQty,
      itemId: data.itemId,
      warehouseName: data.inventoryInwarehouseId?.name,
      value: submission.rejectedCost,
    }));

const mapBomRmRejectionRows = data => {
  const rowsByItem = new Map();
  for (const submission of data.submissionHistory) {
    for (const material of submission.rawMaterialsConsumed || []) {
      if (!material.rejectQty) continue;
      const itemKey = material.rawMaterialId?._id || material.rawMaterialId;
      const row = rowsByItem.get(itemKey) || {
        itemNo: material.rawMaterialId?.itemNo,
        itemName: material.rawMaterialId?.itemName,
        itemUnit: material.rawMaterialId?.itemUnit,
        itemId: material.rawMaterialId,
        warehouseName: data.productionWarehouseId?.name,
        quantity: 0,
        value: 0,
        batches: [],
      };
      row.quantity = roundQty(row.quantity + material.rejectQty);
      row.value += material.rejectedValue;
      for (const batch of material.batches || []) {
        if (!row.batches.some(existing => existing.itemBatchId === batch.itemBatchId)) row.batches.push(batch);
      }
      rowsByItem.set(itemKey, row);
    }
  }
  return [...rowsByItem.values()];
};

const InfoCard = ({ title, icon, children }) => (
  <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
    <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
        {icon}
        {title}
      </h3>
    </div>
    <div className="p-3 sm:p-4 space-y-2.5">{children}</div>
  </div>
);

const InfoRow = ({ label, value }) => (
  <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-2 text-sm">
    <span className="text-gray-500 shrink-0">{label}</span>
    <span className="font-medium text-gray-900 break-words min-w-0 sm:flex-1 sm:pl-2 sm:text-right">{value ?? '-'}</span>
  </div>
);

const TagList = ({ list, nameKey = 'workerName' }) => {
  if (!list || list.length === 0) return <span className="text-gray-400 text-sm">N/A</span>;
  return (
    <div className="flex flex-wrap gap-1 justify-end">
      {list.map((item, i) => (
        <Tag key={item?.id || item?._id || i} color="blue" className="m-0">
          {item?.[nameKey]}
        </Tag>
      ))}
    </div>
  );
};

const ProductionDetail = () => {
  const {
    productionOrderById,
    loading,
    getProductionOrderById,
    updateProductionOrderStatus,
    reRaiseTransferRequest,
    deleteBomSubmission,
    deleteSubmissionLoading,
    materialConsumption,
    scrapRejection,
    panelLoading,
    getMaterialConsumption,
    getScrapRejection,
    startProductionProcess,
    startLoading,
  } = useProductionOrder();
  const { itemInventoryBatch, itemInventoryBatchLoading, getItemInventoryBatchById, resetItemInventoryBatch } = useViewInventory();
  const { inventoryTransferDetail, getInventoryTransferById } = useItemMaster();
  const { useModuleInventoryTransferRequest } = useModulePermissions(RESOURCES.INVENTORY_TRANSFER_REQUEST);
  const { productionOrderId } = useParams();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { profile, getProfile } = useProfile();
  const { useAddProduction, isViewOnly } = useModulePermissions(RESOURCES.ADD_PRODUCTION);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [openSubmitModal, setOpenSubmitModal] = useState(false);
  const [viewProcessId, setViewProcessId] = useState(null);
  const [submitProcessId, setSubmitProcessId] = useState(null);
  const [editSubmission, setEditSubmission] = useState(null);
  const [panelMode, setPanelMode] = useState('view');
  const [editBomSubmissionRow, setEditBomSubmissionRow] = useState(null);
  const [viewBomSubmissionId, setViewBomSubmissionId] = useState(null);
  const [pendingOpenSubmit, setPendingOpenSubmit] = useState(false);
  const [activeKey, setActiveKey] = useState('overview');
  const [batchDrawerOpen, setBatchDrawerOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [panelRefreshKey, setPanelRefreshKey] = useState(0);
  const [approveTransferOpen, setApproveTransferOpen] = useState(false);
  const [rejectTransferOpen, setRejectTransferOpen] = useState(false);

  const data = productionOrderById;
  const productionManageMethod = searchParams.get('method');

  useEffect(() => {
    const controller = new AbortController();
    getProfile({ signal: controller.signal });
    return () => controller.abort();
  }, [getProfile]);

  useEffect(() => {
    if (!productionOrderId) return;
    getProductionOrderById({ productionOrderId, productionManageMethod }).then(action => {
      const method = action?.payload?.data?.productionManageMethod;
      if (productionManageMethod || !method) return;
      setSearchParams(
        params => {
          params.set('method', method);
          return params;
        },
        { replace: true }
      );
    });
  }, [productionOrderId, productionManageMethod, getProductionOrderById, setSearchParams]);

  useEffect(() => {
    if (!productionOrderId || productionManageMethod !== PRODUCTION_MODULE_METHOD.PROCESS_ROUTE) return;
    const controller = new AbortController();
    getMaterialConsumption({ productionOrderId, signal: controller.signal });
    getScrapRejection({ productionOrderId, signal: controller.signal });
    return () => controller.abort();
  }, [productionOrderId, productionManageMethod, getMaterialConsumption, getScrapRejection]);

  const handleApproveTransferClick = async transferId => {
    await getInventoryTransferById({ inventoryTransferId: transferId });
    setApproveTransferOpen(true);
  };

  const handleRejectTransferClick = async transferId => {
    await getInventoryTransferById({ inventoryTransferId: transferId });
    setRejectTransferOpen(true);
  };

  const closeProcessPanel = () => {
    setEditSubmission(null);
    setPanelMode('view');
  };

  const handleItemClick = item => {
    if (!item) return;
    setViewItem({ id: String(item._id), itemNo: item.itemNo, itemName: item.itemName });
  };

  const handleBatchClick = async (itemBatchId, item) => {
    setBatchDrawerOpen(true);
    await getItemInventoryBatchById({ itemId: item._id, batchId: itemBatchId });
  };

  const handleBatchDrawerClose = () => {
    setBatchDrawerOpen(false);
    resetItemInventoryBatch();
  };

  const handleRefresh = async () => {
    await getProductionOrderById({ productionOrderId, productionManageMethod });
    if (productionManageMethod === PRODUCTION_MODULE_METHOD.PROCESS_ROUTE) {
      getMaterialConsumption({ productionOrderId });
      getScrapRejection({ productionOrderId });
    }
    setPanelRefreshKey(key => key + 1);
  };

  const handleMarkAsClose = async () => {
    try {
      await updateProductionOrderStatus({
        productionOrderId,
        status: PRODUCTION_MODULE_BACKEND_STATUS.CLOSED,
      });
      setStatusDropdownOpen(false);
      handleRefresh();
    } catch (error) {
      Toast.error(error.message || 'Failed to update production order status.');
    }
  };

  const handleStopAndComplete = async () => {
    try {
      await updateProductionOrderStatus({
        productionOrderId,
        status: PRODUCTION_MODULE_BACKEND_STATUS.COMPLETED,
        isManuallyCompleted: true,
      });
      handleRefresh();
    } catch (error) {
      Toast.error(error.message || 'Failed to update production order status.');
    }
  };

  const handleHold = async () => {
    try {
      await updateProductionOrderStatus({
        productionOrderId,
        status: PRODUCTION_MODULE_BACKEND_STATUS.ON_HOLD,
      });
      handleRefresh();
    } catch (error) {
      Toast.error(error.message || 'Failed to update production order status.');
    }
  };

  const handleUnHold = async () => {
    try {
      await updateProductionOrderStatus({
        productionOrderId,
        status: PRODUCTION_MODULE_BACKEND_STATUS.UNHOLD,
      });
      handleRefresh();
    } catch (error) {
      Toast.error(error.message || 'Failed to update production order status.');
    }
  };

  const handleRevertManualCompletion = async () => {
    try {
      await updateProductionOrderStatus({
        productionOrderId,
        status: PRODUCTION_MODULE_BACKEND_STATUS.REVERT_MANUAL_COMPLETION,
      });
      handleRefresh();
    } catch (error) {
      Toast.error(error.message || 'Failed to update production order status.');
    }
  };

  const handleReRaiseTransfer = async () => {
    try {
      await reRaiseTransferRequest({ productionOrderId });
      setStatusDropdownOpen(false);
      handleRefresh();
    } catch (error) {
      Toast.error(error.message || 'Failed to re-raise transfer request.');
    }
  };

  useEffect(() => {
    if (!location.state?.openSubmit) return;
    setPendingOpenSubmit(true);
    navigate(`${location.pathname}${location.search}`, { replace: true, state: {} });
  }, [location.state, location.pathname, location.search, navigate]);

  useEffect(() => {
    if (!pendingOpenSubmit || !productionOrderById) return;
    if (productionOrderById.productionManageMethod === PRODUCTION_MODULE_METHOD.PROCESS_ROUTE) {
      const current = productionOrderById.processBased?.processes?.find(process => !process.endDatetime);
      if (current) {
        const processId = current.id || current._id;
        if (current.startDatetime) {
          setEditSubmission(null);
          setViewProcessId(null);
          setSubmitProcessId(processId);
        } else {
          setEditSubmission(null);
          setSubmitProcessId(null);
          setViewProcessId(processId);
        }
        setActiveKey('overview');
      }
    } else if (productionOrderById.productionManageMethod === PRODUCTION_MODULE_METHOD.BOM_BASED) {
      setOpenSubmitModal(true);
      setActiveKey('overview');
    }
    setPendingOpenSubmit(false);
  }, [pendingOpenSubmit, productionOrderById]);

  const handleDeleteBomSubmission = async submission => {
    const result = await deleteBomSubmission({ productionOrderId, submissionId: submission._id });
    if (shouldPreventNavigation(result)) {
      return;
    }
    setViewBomSubmissionId(current => (String(current) === String(submission._id) ? null : current));
    await handleRefresh();
  };

  const handleProcessClick = processId => handleOpenProcessSubmit({ key: processId });

  const handleOpenProcessSubmit = (row, mode = 'view') => {
    setEditSubmission(null);
    if (mode === 'view') {
      setSubmitProcessId(null);
      setViewProcessId(row.key);
      return;
    }
    setViewProcessId(null);
    setSubmitProcessId(row.key);
  };

  const handleSubmitClick = async () => {
    if (data?.productionManageMethod === PRODUCTION_MODULE_METHOD.PROCESS_ROUTE) {
      const current = data?.processBased?.processes?.find(process => !process.endDatetime);
      if (current) {
        const processId = current.id || current._id;
        if (!current.startDatetime) {
          const result = await startProductionProcess({ productionOrderId: data?.id, processId });
          if (shouldPreventNavigation(result)) return;
          await handleRefresh();
        }
        setEditSubmission(null);
        setViewProcessId(null);
        setSubmitProcessId(processId);
        setActiveKey('overview');
      }
    } else if (data?.productionManageMethod === PRODUCTION_MODULE_METHOD.BOM_BASED) {
      setViewBomSubmissionId(null);
      setOpenSubmitModal(true);
    }
  };

  const handlePrint = async () => {
    const { ProductionOrderDetailPdf } = await import('../pdf/ProductionOrderDetailPdf');
    const blob = await renderPdfToBlob(<ProductionOrderDetailPdf data={data} profile={profile} />);
    const blobUrl = URL.createObjectURL(blob);
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = blobUrl;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    };
  };

  const loadProductionPdf = useCallback(async () => {
    const m = await import('../pdf/ProductionOrderDetailPdf');
    return {
      document: <m.ProductionOrderDetailPdf data={data} profile={profile} />,
      fileName: m.productionOrderPdfFileName(data),
    };
  }, [data, profile]);

  if (loading && !data) return <ProductionDetailSkeleton />;
  if (!data) return <NoFoundPage docType={MODULE_NAMES?.PRODUCTION_MODULE} />;

  const isBomBased = data.productionManageMethod === PRODUCTION_MODULE_METHOD.BOM_BASED;
  const isProcessRoute = data.productionManageMethod === PRODUCTION_MODULE_METHOD.PROCESS_ROUTE;
  const submittedQty = roundQty((data.totalFgRejectedQty || 0) + (data.totalFgSubmittedQty || 0));
  const canMarkAsClose = MARK_AS_CLOSE_ALLOWED_STATUSES.includes(data.status);
  const canSubmit = PRODUCTION_ACTIVE_STATUSES.includes(data.status);
  const isSubmissionLocked = [PRODUCTION_MODULE_BACKEND_STATUS.CLOSED, PRODUCTION_MODULE_BACKEND_STATUS.ON_HOLD].includes(data.status) || !!data.isManuallyCompleted;
  const submissionLockedTooltip = data.isManuallyCompleted
    ? 'Not available on a manually completed production order.'
    : `Not available on a ${PRODUCTION_MODULE_STATUS[data.status] || data.status} production order.`;
  const canEditSubmission = useAddProduction?.edit && !isViewOnly && !isSubmissionLocked;
  const canDeleteSubmission = useAddProduction?.delete && !isViewOnly && !isSubmissionLocked;
  const editSubmissionTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : !useAddProduction?.edit ? PERMISSION_MESSAGES.NO_PERMISSION : isSubmissionLocked ? submissionLockedTooltip : undefined;
  const deleteSubmissionTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : !useAddProduction?.delete ? PERMISSION_MESSAGES.NO_PERMISSION : isSubmissionLocked ? submissionLockedTooltip : undefined;
  const canOpenStatus = useAddProduction?.edit && !isViewOnly;
  const statusMenuTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : !useAddProduction?.edit ? PERMISSION_MESSAGES.NO_PERMISSION : 'Status Actions';
  const submitStatusTooltip = !isViewOnly && useAddProduction?.create && !canSubmit ? `Cannot submit in current status - ${PRODUCTION_MODULE_STATUS[data.status] || data.status}.` : undefined;
  const processes = data.processBased?.processes;
  const currentApiProcess = processes?.find(process => !process.endDatetime);
  const viewProcessIndex = processes ? processes.findIndex(process => (process.id || process._id) === viewProcessId) : -1;
  const submitProcessIndex = processes ? processes.findIndex(process => (process.id || process._id) === submitProcessId) : -1;
  const viewBomSubmissionIndex = data.submissionHistory.findIndex(submission => String(submission._id) === String(viewBomSubmissionId));
  const scrapRows = isBomBased ? mapBomScrapRows(data) : scrapRejection?.scrap;
  const rejectionRows = isBomBased ? mapBomFgRejectionRows(data) : scrapRejection?.rejection;
  const rmRejectionRows = isBomBased ? mapBomRmRejectionRows(data) : [];

  const tabItems = [
    {
      key: 'overview',
      label: isProcessRoute ? 'Production Flow' : 'Basic Info',
      children: (
        <div className="space-y-3 pb-2">
          <div className="my-container container-spacing">
            <p className="font-bold text-lg">General Information</p>
            <div className="mt-2 space-y-3">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
                <DetailField label="Item Number">
                  {data?.itemId?.itemNo ? (
                    <Tag className="font-semibold m-0 cursor-pointer" onClick={() => handleItemClick(data.itemId)}>
                      {data.itemId.itemNo}
                    </Tag>
                  ) : (
                    '-'
                  )}
                </DetailField>
                <DetailField label="Item Name" value={data?.itemId?.itemName} truncate={false} valueClassName="break-words" />
                <DetailField label="Production Date" value={dateFormateForUi(data?.productionDate)} />
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
                <DetailField label="Sales Order">{data?.salesOrderId?.orderId ? <Tag className="font-semibold m-0">{data.salesOrderId.orderId}</Tag> : '-'}</DetailField>
                {isProcessRoute && <DetailField label="Recipe Name" value={data?.processBased?.recipeId?.name} truncate={false} valueClassName="break-words" />}
                {isProcessRoute && (
                  <DetailField label="Recipe No">
                    {data?.processBased?.recipeId?.recipeId ? (
                      <Tag className="font-semibold m-0 cursor-pointer" onClick={() => navigate(`/recipe?search=${data.processBased.recipeId.recipeId}`)}>
                        {data.processBased.recipeId.recipeId}
                      </Tag>
                    ) : (
                      '-'
                    )}
                  </DetailField>
                )}
                {isBomBased && <DetailField label="Submitted Qty" value={`${submittedQty} ${data?.itemId?.itemUnit}`} />}
                {isBomBased && data.inventoryTransfers?.length > 0 && (
                  <DetailField label="Inventory Transfer">
                    <div className="flex flex-wrap items-center gap-1">
                      {data.inventoryTransfers.slice(-1).map(transfer => (
                        <span key={transfer._id} className="inline-flex items-center gap-1">
                          <Tag className="font-semibold m-0 cursor-pointer" onClick={() => navigate(`/inventory-transfer-request/${transfer._id}`)}>
                            {transfer.transferId || '-'}
                          </Tag>
                          {transfer.status ? <StatusBadge status={transfer.status} value={transfer.status} /> : null}
                        </span>
                      ))}
                      {data.inventoryTransfers.length > 1 && (
                        <Tag className="font-semibold m-0 cursor-pointer" onClick={() => setActiveKey('inventory-transfer')}>
                          +{data.inventoryTransfers.length - 1} more
                        </Tag>
                      )}
                    </div>
                  </DetailField>
                )}
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
                <DetailField label="Raw Material Warehouse" value={data?.inStockWarehouseId?.name} />
                <DetailField label="Production Warehouse" value={data?.productionWarehouseId?.name} />
                <DetailField label="Finished Goods Warehouse" value={data?.inventoryInwarehouseId?.name} />
              </div>
            </div>
          </div>

          <div className="my-container container-spacing">
            <p className="font-bold text-lg">Material Consumption</p>
            <CustomTable
              columns={isBomBased ? bomMaterialConsumptionColumns(handleItemClick) : materialConsumptionColumns(handleItemClick, handleProcessClick)}
              data={isBomBased ? data.rawMaterials : materialConsumption}
              loading={!isBomBased && panelLoading}
              {...panelTableProps}
            />
          </div>

          {isBomBased && (
            <div className="my-container px-3 py-2">
              <p className="font-bold text-lg mb-2">Submission History</p>
              <CustomTable
                columns={bomSubmissionListColumns(data.itemId.itemUnit, submission => (
                  <div className="flex items-center gap-3">
                    <Tooltip title={editSubmissionTooltip}>
                      <Icons.EditOutlined
                        className={canEditSubmission ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                        style={{ fontSize: 16, color: colorPalette.primary[500] }}
                        onClick={
                          canEditSubmission
                            ? () => {
                                setViewBomSubmissionId(null);
                                setEditBomSubmissionRow(submission);
                                setOpenSubmitModal(true);
                              }
                            : undefined
                        }
                      />
                    </Tooltip>
                    <Popconfirm
                      title="Delete Submission"
                      description="Delete this submission? Its quantities and stock are reversed."
                      okText="Yes"
                      cancelText="No"
                      disabled={!canDeleteSubmission}
                      okButtonProps={{ loading: deleteSubmissionLoading }}
                      onConfirm={() => handleDeleteBomSubmission(submission)}
                    >
                      <Tooltip title={deleteSubmissionTooltip}>
                        <Icons.DeleteOutlined
                          className={canDeleteSubmission ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}
                          style={{ fontSize: 16, color: '#F14336' }}
                          onClick={e => e.stopPropagation()}
                        />
                      </Tooltip>
                    </Popconfirm>
                  </div>
                ))}
                data={data.submissionHistory}
                tableId="_id"
                {...panelTableProps}
                onRowClick={submission => setViewBomSubmissionId(submission._id)}
              />
            </div>
          )}

          {isProcessRoute && data?.inventoryTransfers?.length > 0 && (
            <div className="my-container container-spacing space-y-4">
              <p className="font-bold text-lg">Inventory Transfer</p>
              {data.inventoryTransfers.map(transfer => (
                <div key={transfer?._id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Tag className="font-semibold m-0 cursor-pointer" onClick={() => navigate(`/inventory-transfer-request/${transfer._id}`)}>
                        {transfer?.transferId || '-'}
                      </Tag>
                      {transfer?.status ? <StatusBadge status={transfer.status} value={transfer.status} /> : null}
                    </div>
                    <span className="text-xs text-gray-500 shrink-0">{dateFormateForUi(transfer?.createdAt)}</span>
                  </div>
                  <div className="p-3 space-y-3">
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
                      <DetailField label="From Warehouse" value={transfer?.fromWarehouseName} />
                      <DetailField label="To Warehouse" value={transfer?.toWarehouseName} />
                      <DetailField label="Reference" value={transfer?.referenceNumber} />
                    </div>
                    {transfer?.notes ? <InfoRow label="Notes" value={transfer.notes} /> : null}
                    {transfer?.rawMaterials?.length > 0 && <CustomTable columns={transferMaterialColumns(handleItemClick, handleBatchClick)} data={transfer.rawMaterials} {...panelTableProps} />}
                    {transfer?.status === 'PENDING' && useModuleInventoryTransferRequest?.edit && !isViewOnly && (
                      <div className="flex justify-end gap-2">
                        <Button danger size="small" onClick={() => handleRejectTransferClick(transfer._id)}>
                          Reject Transfer
                        </Button>
                        <Button type="primary" size="small" onClick={() => handleApproveTransferClick(transfer._id)}>
                          Approve Transfer
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {isProcessRoute && processes && (
            <ProductionProcessFlow
              processes={processes}
              isLocked={data.isLocked}
              plannedQty={data.summary.planned}
              currentProcessId={currentApiProcess?.id || currentApiProcess?._id}
              canSubmit={canSubmit}
              onSubmit={handleOpenProcessSubmit}
              onReload={handleRefresh}
            />
          )}
        </div>
      ),
    },
    ...(isBomBased
      ? [
          {
            key: 'inventory-transfer',
            label: 'Inventory Transfer',
            children: (
              <div className="my-container container-spacing space-y-4">
                <p className="font-bold text-lg">Inventory Transfer</p>
                {data.inventoryTransfers?.length > 0 ? (
                  [...data.inventoryTransfers].reverse().map(transfer => (
                    <div key={transfer?._id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <Tag className="font-semibold m-0 cursor-pointer" onClick={() => navigate(`/inventory-transfer-request/${transfer._id}`)}>
                            {transfer?.transferId || '-'}
                          </Tag>
                          {transfer?.status ? <StatusBadge status={transfer.status} value={transfer.status} /> : null}
                        </div>
                        <span className="text-xs text-gray-500 shrink-0">{dateFormateForUi(transfer?.createdAt)}</span>
                      </div>
                      <div className="p-3 space-y-3">
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
                          <DetailField label="From Warehouse" value={transfer?.fromWarehouseName} />
                          <DetailField label="To Warehouse" value={transfer?.toWarehouseName} />
                          <DetailField label="Reference" value={transfer?.referenceNumber} />
                        </div>
                        {transfer?.notes ? <InfoRow label="Notes" value={transfer.notes} /> : null}
                        {transfer?.rawMaterials?.length > 0 && <CustomTable columns={transferMaterialColumns(handleItemClick, handleBatchClick)} data={transfer.rawMaterials} {...panelTableProps} />}
                        {transfer?.status === 'PENDING' && useModuleInventoryTransferRequest?.edit && !isViewOnly && (
                          <div className="flex justify-end items-center gap-2">
                            {String(transfer?.fromWarehouseId) === String(transfer?.toWarehouseId) && (
                              <span className="text-sm text-gray-500 mr-auto">Same warehouse: no stock will move. Approve confirms the materials for production.</span>
                            )}
                            <Button danger size="small" onClick={() => handleRejectTransferClick(transfer._id)}>
                              Reject Transfer
                            </Button>
                            <Button type="primary" size="small" onClick={() => handleApproveTransferClick(transfer._id)}>
                              Approve Transfer
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 m-0">No inventory transfers.</p>
                )}
              </div>
            ),
          },
        ]
      : []),
    {
      key: 'scrap',
      label: 'Scrap & Rejection',
      children: (
        <div className="my-container container-spacing space-y-4">
          <div>
            <p className="font-bold text-lg">Scrap</p>
            <CustomTable
              columns={scrapRejectionColumns(isBomBased, handleBatchClick, handleItemClick, handleProcessClick)}
              data={scrapRows}
              loading={!isBomBased && panelLoading}
              {...panelTableProps}
            />
          </div>
          <div>
            <p className="font-bold text-lg">FG Rejection</p>
            <CustomTable
              columns={scrapRejectionColumns(isBomBased, handleBatchClick, handleItemClick, handleProcessClick).filter(column => column.key !== 'batchNo')}
              data={rejectionRows}
              loading={!isBomBased && panelLoading}
              {...panelTableProps}
            />
          </div>
          {rmRejectionRows.length > 0 && (
            <div>
              <p className="font-bold text-lg">Raw Material Rejection</p>
              <CustomTable columns={scrapRejectionColumns(isBomBased, handleBatchClick, handleItemClick)} data={rmRejectionRows} {...panelTableProps} />
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'inventory-impact',
      label: 'Inventory Impact',
      children: (
        <div className="my-container container-spacing">
          <p className="font-bold text-lg">Inventory Impact</p>
          <CustomTable columns={inventoryImpactColumns(handleBatchClick, handleItemClick)} data={[...data.inventoryImpactLog].reverse()} {...panelTableProps} />
        </div>
      ),
    },
    {
      key: 'activity',
      label: 'Activity',
      children: <ProductionActivityPanel activityLog={data.activityLog} />,
    },
    {
      key: 'stock-movement',
      label: 'Stock Movement',
      children: <StockMovementPanel key={panelRefreshKey} url={API_ROUTES.PRODUCTION_ORDER.STOCK_MOVEMENT(productionOrderId)} onBatchClick={handleBatchClick} />,
    },
    {
      key: 'journal-entries',
      label: 'Journal',
      children: <DocumentJournalPanel key={panelRefreshKey} sourceModule={LEDGER_SOURCE_MODULES.PRODUCTION} sourceId={productionOrderId} hiddenColumns={['branchName']} />,
    },
    {
      key: 'cost-breakdown',
      label: 'Cost Breakdown',
      children: <ProductionCostBreakdown key={panelRefreshKey} url={API_ROUTES.PRODUCTION_ORDER.COST_BREAKDOWN(productionOrderId)} />,
    },
  ];

  return (
    <>
      <div className="bg-white border-b border-gray-100 px-4 py-4 -m-4">
        <div className="flex items-center justify-between gap-4">
          <PageHeader
            title={
              <div className="flex items-center gap-3">
                <BackButton />
                <div className="flex flex-col">
                  <h1 className="text-[18px] font-semibold text-heading leading-6">Production Order Details</h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-sm font-medium text-gray-600">{data?.productionOrderCode}</span>
                    <span className="text-gray-400">•</span>
                    <StatusBadge status={data?.status} value={PRODUCTION_MODULE_STATUS?.[data?.status] || data?.status} />
                    <span className="text-gray-400">•</span>
                    <StatusBadge status={data.productionManageMethod} value={PRODUCTION_MODULE_METHOD_LABEL[data.productionManageMethod]} />
                  </div>
                </div>
              </div>
            }
            rightStats={[
              // The unit is dummy until the backend sends itemId.itemUnit; every quantity is from the backend.
              { label: 'Planned', value: `${data.summary.planned} ${data?.itemId?.itemUnit}` },
              { label: 'Produced', value: `${data.summary.produced} ${data?.itemId?.itemUnit}`, colorClass: data.summary.produced > 0 ? 'text-green-600' : 'text-heading' },
              { label: 'Pending', value: `${data.summary.pending} ${data?.itemId?.itemUnit}`, colorClass: data.summary.pending > 0 ? 'text-amber-600' : 'text-heading' },
              { label: 'Rejected', value: `${data.totalFgRejectedQty} ${data?.itemId?.itemUnit}`, colorClass: data.totalFgRejectedQty > 0 ? 'text-red-600' : 'text-heading' },
              { label: 'Scrap', value: `${data.summary.totalScrap}`, colorClass: data.summary.totalScrap > 0 ? 'text-orange-600' : 'text-heading' },
            ]}
          />
          <div className="flex items-center space-x-3 shrink-0">
            <DocumentRefreshButton onRefresh={handleRefresh} />
            <AsyncPdfDownloadLink loadDocument={loadProductionPdf}>
              {({ loading: pdfLoading }) => (
                <Button type="default" size="middle" icon={<Icons.DownloadOutlined className="mr-2" />} disabled={pdfLoading} className="flex items-center">
                  Download
                </Button>
              )}
            </AsyncPdfDownloadLink>
            <Button type="default" size="middle" icon={<Icons.PrinterOutlined className="mr-2" />} onClick={handlePrint} className="flex items-center">
              Print
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row xl:justify-between pt-3">
        <div className="w-full xl:w-3/4 min-w-0">
          <Tabs activeKey={activeKey} onChange={setActiveKey} items={tabItems} />
        </div>

        <div className="xl:mt-[62px] h-fit w-full xl:w-[250px] space-y-2">
          <ActionButtons>
            {isBomBased && (
              <Button type="default" size="small" className="w-full" block onClick={() => setActiveKey('inventory-transfer')}>
                View Inventory Transfers
              </Button>
            )}
            {data.status === PRODUCTION_MODULE_BACKEND_STATUS.INVENTORY_REJECTED && (
              <StatusConfirmPopover
                label="Re-raise Transfer Request"
                icon={<Icons.ReloadOutlined style={{ fontSize: 14, color: colorPalette.primary[500] }} />}
                placement="left"
                variant="primary"
                onConfirm={handleReRaiseTransfer}
                contentWidth={320}
                confirmMessage={
                  <>
                    Re-raise the inventory transfer request for this production order? It will revert to{' '}
                    <span style={{ fontWeight: 600, color: colorPalette.primary[600] }}>{PRODUCTION_MODULE_STATUS.WAITING_FOR_INVENTORY_APPROVAL}</span>.
                  </>
                }
                isActive={false}
              >
                <PermissionButton canAccess={useAddProduction?.edit} isViewOnly={isViewOnly} wrapperClassName="block w-full" type="primary" size="small" className="w-full" block>
                  Re-raise Transfer Request
                </PermissionButton>
              </StatusConfirmPopover>
            )}
            {isProcessRoute && (
              <PermissionButton
                canAccess={useAddProduction?.create}
                isViewOnly={isViewOnly}
                tooltipTitle={submitStatusTooltip}
                wrapperClassName="block w-full"
                type="primary"
                size="small"
                className="w-full"
                block
                disabled={!canSubmit}
                loading={startLoading}
                onClick={useAddProduction?.create && !isViewOnly && canSubmit ? handleSubmitClick : undefined}
              >
                Submit Current Process
              </PermissionButton>
            )}
            {isBomBased && (
              <PermissionButton
                canAccess={useAddProduction?.create}
                isViewOnly={isViewOnly}
                tooltipTitle={submitStatusTooltip}
                wrapperClassName="block w-full"
                type="primary"
                icon={<Icons.ArrowLeftOutlined />}
                block
                disabled={!canSubmit}
                onClick={useAddProduction?.create && !isViewOnly && canSubmit ? handleSubmitClick : undefined}
              >
                Submit Production Order
              </PermissionButton>
            )}
            {canSubmit ? (
              <StatusConfirmPopover
                label="Stop & Complete"
                icon={<Icons.CheckCircleOutlined style={{ fontSize: 14, color: colorPalette.error[600] }} />}
                placement="left"
                variant="danger"
                onConfirm={handleStopAndComplete}
                confirmMessage={
                  <>
                    Are you sure you want to mark this production order as <span style={{ fontWeight: 600, color: colorPalette.error[600] }}>completed</span>?
                  </>
                }
                isActive={true}
              >
                <PermissionButton canAccess={useAddProduction?.create} isViewOnly={isViewOnly} wrapperClassName="block w-full" type="default" size="small" className="w-full" block>
                  Stop &amp; Complete
                </PermissionButton>
              </StatusConfirmPopover>
            ) : data.status === PRODUCTION_MODULE_BACKEND_STATUS.COMPLETED && data.isManuallyCompleted ? (
              <StatusConfirmPopover
                label="Reopen"
                icon={<Icons.UndoOutlined style={{ fontSize: 14, color: colorPalette.primary[500] }} />}
                placement="left"
                variant="primary"
                onConfirm={handleRevertManualCompletion}
                confirmMessage={
                  <>
                    Are you sure you want to <span style={{ fontWeight: 600, color: colorPalette.primary[600] }}>reopen</span> this production order?
                  </>
                }
                isActive={false}
              >
                <PermissionButton canAccess={useAddProduction?.create} isViewOnly={isViewOnly} wrapperClassName="block w-full" type="default" size="small" className="w-full" block>
                  Reopen
                </PermissionButton>
              </StatusConfirmPopover>
            ) : (
              <PermissionButton
                canAccess={useAddProduction?.create}
                isViewOnly={isViewOnly}
                wrapperClassName="block w-full"
                type="default"
                size="small"
                className="w-full"
                block
                disabled
                tooltipTitle={
                  isViewOnly
                    ? PERMISSION_MESSAGES.VIEW_ONLY
                    : !useAddProduction?.create
                      ? PERMISSION_MESSAGES.NO_PERMISSION
                      : `Cannot stop & complete in current status - ${PRODUCTION_MODULE_STATUS[data.status] || data.status}.`
                }
                tooltipProps={{ placement: 'left' }}
              >
                Stop &amp; Complete
              </PermissionButton>
            )}
            {data.status === PRODUCTION_MODULE_BACKEND_STATUS.CLOSED ? (
              <StatusConfirmPopover
                label="Reopen"
                icon={<Icons.UndoOutlined style={{ fontSize: 14, color: colorPalette.primary[500] }} />}
                placement="left"
                variant="primary"
                onConfirm={handleUnHold}
                confirmMessage={
                  <>
                    Are you sure you want to <span style={{ fontWeight: 600, color: colorPalette.primary[600] }}>reopen</span> this production order?
                  </>
                }
                isActive={false}
              >
                <PermissionButton canAccess={useAddProduction?.create} isViewOnly={isViewOnly} wrapperClassName="block w-full" type="default" size="small" className="w-full" block>
                  Reopen
                </PermissionButton>
              </StatusConfirmPopover>
            ) : data.status === PRODUCTION_MODULE_BACKEND_STATUS.ON_HOLD ? (
              <StatusConfirmPopover
                label="Un-Hold"
                icon={<Icons.PlayCircleOutlined style={{ fontSize: 14, color: colorPalette.primary[500] }} />}
                placement="left"
                variant="primary"
                onConfirm={handleUnHold}
                confirmMessage={
                  <>
                    Are you sure you want to <span style={{ fontWeight: 600, color: colorPalette.primary[600] }}>un-hold</span> this production order?
                  </>
                }
                isActive={false}
              >
                <PermissionButton canAccess={useAddProduction?.create} isViewOnly={isViewOnly} wrapperClassName="block w-full" type="default" size="small" className="w-full" block>
                  Un-Hold
                </PermissionButton>
              </StatusConfirmPopover>
            ) : canSubmit ? (
              <StatusConfirmPopover
                label="Hold"
                icon={<Icons.PauseOutlined style={{ fontSize: 14, color: colorPalette.primary[500] }} />}
                placement="left"
                variant="primary"
                onConfirm={handleHold}
                confirmMessage={
                  <>
                    Are you sure you want to mark this production order as <span style={{ fontWeight: 600, color: colorPalette.primary[600] }}>on hold</span>?
                  </>
                }
                isActive={false}
              >
                <PermissionButton canAccess={useAddProduction?.create} isViewOnly={isViewOnly} wrapperClassName="block w-full" type="default" size="small" className="w-full" block>
                  Hold
                </PermissionButton>
              </StatusConfirmPopover>
            ) : (
              <PermissionButton
                canAccess={useAddProduction?.create}
                isViewOnly={isViewOnly}
                wrapperClassName="block w-full"
                type="default"
                size="small"
                className="w-full"
                block
                disabled
                tooltipTitle={
                  isViewOnly
                    ? PERMISSION_MESSAGES.VIEW_ONLY
                    : !useAddProduction?.create
                      ? PERMISSION_MESSAGES.NO_PERMISSION
                      : `Cannot hold in current status - ${PRODUCTION_MODULE_STATUS[data.status] || data.status}.`
                }
                tooltipProps={{ placement: 'left' }}
              >
                Hold
              </PermissionButton>
            )}
            <Dropdown
              placement="bottom"
              trigger={['click']}
              disabled={!canOpenStatus}
              open={canOpenStatus && statusDropdownOpen}
              onOpenChange={flag => {
                if (!canOpenStatus) return;
                setStatusDropdownOpen(flag);
              }}
              dropdownRender={() => (
                <div className="bg-white shadow-lg rounded-lg border border-gray-200 flex flex-col w-56 py-1">
                  <div className="px-2 py-1">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 py-1">Status Actions :</div>
                  </div>
                  {canMarkAsClose ? (
                    <StatusConfirmPopover
                      key="markAsClose"
                      onConfirm={handleMarkAsClose}
                      onCloseDropdown={() => setStatusDropdownOpen(false)}
                      label="Mark as Close"
                      icon={<Icons.CloseCircleOutlined style={{ fontSize: 14, color: colorPalette.error[600] }} />}
                      placement="left"
                      type="danger"
                      confirmMessage={
                        <>
                          Are you sure you want to mark this production order as <span style={{ fontWeight: 600, color: colorPalette.error[600] }}>closed</span>?
                          {data.status === PRODUCTION_MODULE_BACKEND_STATUS.WAITING_FOR_INVENTORY_APPROVAL && (
                            <div className="mt-2">Its pending inventory transfer request will be rejected. If you reopen this order, a new request is raised automatically.</div>
                          )}
                        </>
                      }
                      isActive={true}
                    />
                  ) : (
                    <Tooltip title={canMarkAsClose ? 'Mark as Close' : `Cannot mark as close in current status - ${PRODUCTION_MODULE_STATUS?.[data?.status] || data?.status || '-'}.`} placement="left">
                      <button type="button" disabled className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 opacity-50 cursor-not-allowed text-gray-400 rounded-b">
                        <Icons.CloseCircleOutlined className="text-gray-400" style={{ fontSize: 14 }} />
                        Mark as Close
                      </button>
                    </Tooltip>
                  )}
                  {data?.status === PRODUCTION_MODULE_BACKEND_STATUS.INVENTORY_REJECTED && (
                    <StatusConfirmPopover
                      key="reRaiseTransfer"
                      onConfirm={handleReRaiseTransfer}
                      onCloseDropdown={() => setStatusDropdownOpen(false)}
                      label="Re-raise Transfer Request"
                      icon={<Icons.ReloadOutlined style={{ fontSize: 14, color: colorPalette.primary[500] }} />}
                      placement="left"
                      type="primary"
                      contentWidth={320}
                      confirmMessage={
                        <>
                          Re-raise the inventory transfer request for this production order? It will revert to{' '}
                          <span style={{ fontWeight: 600, color: colorPalette.primary[600] }}>{PRODUCTION_MODULE_STATUS.WAITING_FOR_INVENTORY_APPROVAL || 'Waiting for Inventory Approval'}</span>.
                        </>
                      }
                      isActive={false}
                    />
                  )}
                </div>
              )}
            >
              <Tooltip title={statusMenuTooltip} placement="left">
                <span className="block w-full">
                  <Button type="default" size="small" className="w-full" block disabled={!canOpenStatus}>
                    Status Actions
                  </Button>
                </span>
              </Tooltip>
            </Dropdown>
          </ActionButtons>

          <DocumentMetadata
            data={{
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
              addedBy: data.createdBy,
            }}
          />

          {(isBomBased || data?.productionOwner?.length > 0) && (
            <InfoCard title="People" icon={<Icons.TeamOutlined />}>
              <div className="flex flex-col gap-0.5 text-sm">
                <span className="text-gray-500">Production Owner</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  <TagList list={data?.productionOwner} />
                </div>
              </div>
            </InfoCard>
          )}
        </div>
      </div>
      {openSubmitModal ? (
        <BomSubmitPanel
          key={editBomSubmissionRow?._id}
          data={data}
          submission={editBomSubmissionRow}
          onClose={() => {
            setOpenSubmitModal(false);
            setEditBomSubmissionRow(null);
          }}
          onSubmitted={async () => {
            setOpenSubmitModal(false);
            setEditBomSubmissionRow(null);
            await handleRefresh();
          }}
        />
      ) : (
        viewBomSubmissionIndex >= 0 && (
          <BomViewPanel
            data={data}
            submission={data.submissionHistory[viewBomSubmissionIndex]}
            submissionIndex={viewBomSubmissionIndex}
            fgUnit={data.itemId.itemUnit}
            onClose={() => setViewBomSubmissionId(null)}
          />
        )
      )}
      {viewProcessIndex >= 0 ? (
        <ProcessViewPanel
          key={viewProcessId}
          data={data}
          process={processes[viewProcessIndex]}
          processIndex={viewProcessIndex}
          previousProcess={processes[viewProcessIndex - 1]}
          fgUnit={data?.itemId?.itemUnit || ''}
          canSubmit={canSubmit}
          panelMode={panelMode}
          editSubmission={editSubmission}
          onClose={() => {
            closeProcessPanel();
            setViewProcessId(null);
          }}
          onEdit={submission => {
            setEditSubmission(submission);
            setPanelMode('edit');
          }}
          onCancelEdit={closeProcessPanel}
          onSubmit={() => {
            setEditSubmission(null);
            setPanelMode('submit');
          }}
          onSubmitted={async () => {
            closeProcessPanel();
            await handleRefresh();
          }}
          onReload={handleRefresh}
        />
      ) : (
        submitProcessIndex >= 0 && (
          <ProcessSubmitPanel
            key={editSubmission?._id || submitProcessId}
            data={data}
            process={processes[submitProcessIndex]}
            processIndex={submitProcessIndex}
            fgUnit={data?.itemId?.itemUnit || ''}
            submission={editSubmission}
            onClose={() => {
              closeProcessPanel();
              setSubmitProcessId(null);
            }}
            onSubmitted={async () => {
              closeProcessPanel();
              setSubmitProcessId(null);
              await handleRefresh();
            }}
          />
        )
      )}
      <TransferApproveModal open={approveTransferOpen} record={inventoryTransferDetail} onClose={() => setApproveTransferOpen(false)} onSuccess={handleRefresh} />
      <TransferRejectModal open={rejectTransferOpen} record={inventoryTransferDetail} onClose={() => setRejectTransferOpen(false)} onSuccess={handleRefresh} />
      <BatchDetailsDrawer open={batchDrawerOpen} batch={itemInventoryBatch} loading={itemInventoryBatchLoading} onClose={handleBatchDrawerClose} />
      {viewItem && <ItemDrawerDetails viewItemDetail setViewItemDetail={() => setViewItem(null)} itemData={viewItem} />}
    </>
  );
};

export default ProductionDetail;
