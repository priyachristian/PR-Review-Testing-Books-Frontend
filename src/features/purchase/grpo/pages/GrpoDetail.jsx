import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { PDFDownloadLink } from '@/components/ui/common/PdfDownloadLinkLazy';
import { renderPdfToBlob } from '@/utils/loadReactPdf';

// Components
import AttachMentDetails from '@/components/feedback/formModal/AttachMentDetails';
import BackButton from '@/components/ui/button/BackButton';
import DocumentRefreshButton from '@/components/ui/button/DocumentRefreshButton';
import ConvertFromDetail from '@/components/feedback/formModal/ConvertFromDetail';
import ConvertToDetail from '@/components/feedback/formModal/ConvertToDetail';
import CustomerDrawerDetails from '@/features/sales/customer/components/CustomerDrawerDetails';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import DetailPageSkeleton from '@/components/feedback/pageLoader/DetailPageSkeleton';
import { DocumentConfirmModal } from '@/components/feedback/confirmModal/CancelOrDeleteDocumentModal';
import { DocumentMetadata, InventoryImpact, OrganizationInfo, ConversionBadges, ActionButtons } from '@/components/ui';
import { CommentHistory } from '@/features/common/comment';
import PurchaseModuleTreeView from '@/components/dataDisplay/statCard/PurchaseModuleTreeView';
import SalesModuleDetailView from '@/components/dataDisplay/statCard/SalesModuleDetailView';
import { ShowPDF } from '@/components/ui/common/ShowPDFLazy';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import StatusUpdateLoader from '@/components/feedback/pageLoader/StatusUpdateLoader';
import { Button, Dropdown, Tabs, Tooltip } from '@/components/AntDComponent';
import PermissionButton from '@/components/ui/button/PermissionButton';
import NoFoundPage from '@/components/ui/common/NoFoundPage';

// Hooks
import { useConvert } from 'hooks/useConvert';
import useModulePermissions from 'hooks/useModulePermissions';
import { useProfile } from '@/features/setting/profile/useProfile';
import { useConfirmModal } from '@/hooks/useConfirmModal';

// Extras
import { useGRPO, getGrpoDocumentDetails } from '@/features/purchase/grpo';
import Icons from 'assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import {
  BACKEND_ENUM,
  GRPO_CONVERSION_ALLOWED_STATUSES,
  GRPO_EDIT_RESTRICTED_STATUS,
  GRPO_STATUS,
  GRPO_STATUS_CHANGE_RESTRICTED_STATUS,
  MODULE_NAMES,
  pageTypes,
  PERMISSION_MESSAGES,
  LEDGER_SOURCE_MODULES,
} from 'utils/constants';
import { generateSafeFileName } from '@/utils/pdfname';
import StockMovementPanel from '@/components/dataDisplay/StockMovementPanel';
import DocumentJournalPanel from '@/components/dataDisplay/DocumentJournalPanel';
import BatchDetailsDrawer from '@/components/dataDisplay/BatchDetailsDrawer';
import { useViewInventory } from '@/features/inventory/viewInventory';
import { API_ROUTES } from '@/utils/apiRoute';

dayjs.extend(utc);

const GrpoDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { grpoId } = useParams();
  const [activeKey, setActiveKey] = useState('1');
  const { loading, grpoOrder, submitLoading, deleteLoading, resetGrpo, getGrpoById, updateStatus, removeGrpo } = useGRPO();
  const { itemInventoryBatch, itemInventoryBatchLoading, getItemInventoryBatchById, resetItemInventoryBatch } = useViewInventory();
  const grpoData = grpoOrder;
  const { isSplitSessionActive, isSplitWise, isViewOnly, useModuleGrpo, useModuleBills } = useModulePermissions(RESOURCES.GRPO);
  const { profile, getProfile } = useProfile();
  const { handleConvertGRPO } = useConvert();
  const [showConvertToModal, setShowConvertToModal] = useState(false);
  const [showConvertFromModal, setShowConvertFromModal] = useState(false);
  const deleteModal = useConfirmModal();
  const cancelStatusModal = useConfirmModal();
  const [viewCustomerDetail, setViewCustomerDetail] = useState(false);
  const [batchDrawerOpen, setBatchDrawerOpen] = useState(false);

  const handleBatchClick = async (itemBatchId, item) => {
    setBatchDrawerOpen(true);
    await getItemInventoryBatchById({ itemId: item._id, batchId: itemBatchId });
  };

  const handleBatchDrawerClose = () => {
    setBatchDrawerOpen(false);
    resetItemInventoryBatch();
  };

  const updateGrpoStatus = async newStatus => {
    if (newStatus === BACKEND_ENUM?.CANCELLED) {
      cancelStatusModal.open(grpoData);
      return;
    }
    await handleUpdateStatus(grpoData?.id || grpoData?._id, newStatus);
  };

  const confirmCancelStatus = async () => {
    await handleUpdateStatus(grpoData?.id || grpoData?._id, BACKEND_ENUM?.CANCELLED);
    cancelStatusModal.close();
  };

  useEffect(() => {
    const controller = new AbortController();
    getProfile({ signal: controller.signal });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    if (grpoId) {
      getGrpoById({ grpoId, signal: controller.signal });
    }

    return () => {
      controller.abort();
      resetGrpo();
    };
  }, [grpoId]);

  const handleRefresh = async () => {
    await getGrpoById({ grpoId });
  };

  const handleEditClick = () => {
    resetGrpo();
    navigate(`/grpo/${grpoData._id}/edit`, {
      state: {
        grpoData: grpoData,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleDuplicateClick = () => {
    navigate('/grpo/new', {
      state: {
        duplicateFromId: grpoData?.id || grpoData?._id,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleDeleteClick = () => {
    deleteModal.open(grpoData);
  };

  const deleteGRPO = async () => {
    await removeGrpo({ grpoId: grpoData?.id || grpoData?._id });
    deleteModal.close();
    navigate('/grpo');
  };

  const items = [
    {
      key: '1',
      label: 'Basic Info',
      children: <SalesModuleDetailView data={grpoData} profile={profile} pageType={pageTypes?.GRPO} />,
    },
    ...(grpoData?.attachments?.length > 0
      ? [
          {
            key: '2',
            label: 'Attachments',
            children: <AttachMentDetails data={grpoData} />,
          },
        ]
      : []),
    {
      key: '3',
      label: 'Document Flow',
      children: <PurchaseModuleTreeView moduleTree={grpoData?.moduleTree} sourceModule="grpo" currency={grpoData?.currency} />,
    },
    {
      key: 'stock-movement',
      label: 'Stock Movement',
      children: <StockMovementPanel url={API_ROUTES.PURCHASE.GRPO.STOCK_MOVEMENT(grpoId)} onBatchClick={handleBatchClick} />,
    },
    {
      key: 'journal-entries',
      label: 'Journal',
      children: <DocumentJournalPanel sourceModule={LEDGER_SOURCE_MODULES.GRPO} sourceId={grpoId} />,
    },
    {
      key: '4',
      label: 'History',
      children: <CommentHistory moduleName={MODULE_NAMES.GRPO} referenceId={grpoId} commentHistory={grpoData?.commentHistory} canAddComment={useModuleGrpo?.edit} isViewOnly={isViewOnly} />,
    },
  ];

  const handlePrint = async () => {
    const blob = await renderPdfToBlob(
      <ShowPDF data={grpoData} billingAddress={grpoData?.vendor?.address?.billing} shippingAddress={grpoData?.shippingAddress} profile={profile} pageType={pageTypes.GRPO} />
    );

    const blobUrl = URL.createObjectURL(blob);

    // Create a hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = blobUrl;

    document.body.appendChild(iframe);

    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    };
  };

  const handleUpdateStatus = async (grpoId, status) => {
    await updateStatus({ grpoId, status });
    getGrpoById({ grpoId });
  };

  let editStatus = !GRPO_EDIT_RESTRICTED_STATUS?.includes(grpoData?.status);
  const inventoryEnabled = Boolean(grpoData?.inventoryConfig?.stockAddEnabled ?? grpoData?.isInventoryEnabled);

  const getConvertStatusValue = status => {
    let statusArr = [];

    const grpoId = grpoData?.id || grpoData?._id;
    const markAs = (backendStatus, labelStatus) => ({
      key: `markAs${labelStatus}`,
      label: `Mark As ${labelStatus}`,
      onClick: () => handleUpdateStatus(grpoId, backendStatus),
    });
    const draftItem = markAs(BACKEND_ENUM?.DRAFT, GRPO_STATUS?.DRAFT);
    const recordedItem = markAs(BACKEND_ENUM?.RECORDED, GRPO_STATUS?.RECORDED);
    const cancelItem = {
      key: `markAs${GRPO_STATUS?.CANCELLED}`,
      label: `Mark As ${GRPO_STATUS?.CANCELLED}`,
      onClick: () => updateGrpoStatus(BACKEND_ENUM?.CANCELLED),
    };

    if (status === BACKEND_ENUM?.DRAFT) {
      statusArr = [recordedItem, cancelItem];
    } else if (status === BACKEND_ENUM?.RECORDED) {
      statusArr = [draftItem, cancelItem];
    } else if (status === BACKEND_ENUM?.CANCELLED) {
      statusArr = [draftItem, recordedItem];
    } else {
      statusArr = [cancelItem];
    }

    return statusArr;
  };

  const dropDownItems = [...getConvertStatusValue(grpoData?.status)];

  if (loading) {
    return <DetailPageSkeleton />;
  }

  if (!grpoOrder) {
    return <NoFoundPage docType={MODULE_NAMES?.GRPO} />;
  }

  const customerData = {
    id: grpoData?.vendor?._id || grpoData?.vendor?.id,
    customerDisplayName: grpoData?.vendor?.customerDisplayName,
  };

  const statusLabel = GRPO_STATUS?.[grpoData?.status] || grpoData?.status || '-';
  const blockedTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : PERMISSION_MESSAGES.NO_PERMISSION;
  const canMarkStatus = useModuleGrpo?.edit && !isViewOnly && !GRPO_STATUS_CHANGE_RESTRICTED_STATUS?.includes(grpoData?.status) && dropDownItems.length > 0;
  const canConvert = useModuleBills?.create && !isViewOnly && GRPO_CONVERSION_ALLOWED_STATUSES?.includes(grpoData?.status);
  const canSplit = isSplitWise && isSplitSessionActive && canConvert;
  const showSplit = isSplitWise && isSplitSessionActive && useModuleBills?.create && GRPO_CONVERSION_ALLOWED_STATUSES?.includes(grpoData?.status);
  const canDuplicate = useModuleGrpo?.create && !isViewOnly;
  const canEdit = useModuleGrpo?.edit && editStatus && !isViewOnly;
  const canDelete = useModuleGrpo?.delete && !isViewOnly;
  const markAsTooltip = canMarkStatus
    ? 'Mark GRPO As'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useModuleGrpo?.edit
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : `This document status cannot be changed in its current status - ${statusLabel}.`;
  const convertTooltip = canConvert
    ? 'Convert to Bill'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useModuleBills?.create
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : `Cannot convert to Bill in its current status - ${statusLabel}.`;
  const splitTooltip = canSplit ? 'Convert to Bill With Split' : PERMISSION_MESSAGES.VIEW_ONLY;
  const duplicateTooltip = canDuplicate ? 'Duplicate Document' : blockedTooltip;
  const editTooltip = canEdit
    ? 'Edit GRPO'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useModuleGrpo?.edit
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : `This document cannot be edited in its current status - ${statusLabel}.`;
  const deleteTooltip = canDelete ? 'Delete GRPO' : blockedTooltip;

  return (
    <>
      <StatusUpdateLoader loading={submitLoading} hidden={deleteModal.isOpen || cancelStatusModal.isOpen} text="Updating GRPO status..." />
      <div className="bg-white border-b border-gray-100 px-4 py-2 -m-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <BackButton />
            <div className="flex flex-col">
              <h1 className="text-[18px] font-semibold text-gray-900">GRPO Details</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-sm font-medium text-gray-600">{grpoData?.grpoOrderId}</span>
                <span className="text-gray-400">•</span>
                <StatusBadge status={grpoData?.status} value={GRPO_STATUS?.[grpoData?.status]} />
                <span className="text-gray-400">•</span>
                <span
                  className={`inline-flex items-center gap-1.5 py-0.5 px-2.5 rounded-full text-xs font-medium ring-1 ring-inset ${
                    inventoryEnabled ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-gray-50 text-gray-600 ring-gray-500/20'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${inventoryEnabled ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                  Inventory {inventoryEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-3">
            <DocumentRefreshButton onRefresh={handleRefresh} />
            {grpoData?.vendor?._id && (
              <Button type="default" size="middle" icon={<Icons.ExportOutlined className="mr-2" />} onClick={() => setViewCustomerDetail(true)} className="flex items-center">
                View Vendor
              </Button>
            )}
            <PDFDownloadLink
              document={<ShowPDF data={grpoData} billingAddress={grpoData?.vendor?.address?.billing} shippingAddress={grpoData?.shippingAddress} profile={profile} pageType={pageTypes.GRPO} />}
              fileName={generateSafeFileName(grpoData, 'grpoOrderId')}
            >
              {({ loading: pdfLoading }) => (
                <Button type="default" size="middle" icon={<Icons.DownloadOutlined className="mr-2" />} disabled={pdfLoading} className="flex items-center">
                  Download
                </Button>
              )}
            </PDFDownloadLink>
            <Button type="default" size="middle" icon={<Icons.PrinterOutlined className="mr-2" />} onClick={handlePrint} className="flex items-center">
              Print
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row xl:justify-between pt-3">
        <div className="w-full xl:w-3/4">
          <Tabs activeKey={activeKey} onChange={setActiveKey} items={items} />
        </div>
        <div className="xl:mt-[62px] h-fit w-full xl:w-[250px] space-y-3">
          <div className="space-y-3">
            <ActionButtons>
              {canMarkStatus ? (
                <Dropdown menu={{ items: dropDownItems }} placement="bottom" trigger={['click']}>
                  <Button type="primary" className="px-4 py-2 w-full" disabled={submitLoading} block>
                    {submitLoading ? <CustomLoader variant="button" text="Updating..." /> : 'Mark GRPO As'}
                  </Button>
                </Dropdown>
              ) : (
                <Tooltip title={markAsTooltip} placement="left">
                  <span className="block w-full">
                    <Button type="primary" className="px-4 py-2 w-full" disabled block>
                      Mark GRPO As
                    </Button>
                  </span>
                </Tooltip>
              )}
              <PermissionButton
                canAccess={useModuleBills?.create}
                isViewOnly={isViewOnly}
                disabled={!GRPO_CONVERSION_ALLOWED_STATUSES?.includes(grpoData?.status) || submitLoading}
                tooltipTitle={convertTooltip}
                tooltipProps={{ placement: 'left' }}
                wrapperClassName="block w-full"
                type="primary"
                icon={<Icons.SwapOutlined />}
                className="px-4 py-2 w-full"
                block
                onClick={canConvert ? () => handleConvertGRPO(grpoData) : undefined}
              >
                {submitLoading ? <CustomLoader variant="button" text="Converting..." /> : 'Convert To Bill'}
              </PermissionButton>
              {showSplit && (
                <PermissionButton
                  canAccess={useModuleBills?.create}
                  isViewOnly={isViewOnly}
                  disabled={!GRPO_CONVERSION_ALLOWED_STATUSES?.includes(grpoData?.status) || !isSplitWise || !isSplitSessionActive || submitLoading}
                  tooltipTitle={splitTooltip}
                  tooltipProps={{ placement: 'left' }}
                  wrapperClassName="block w-full"
                  type="primary"
                  icon={<Icons.SplitCellsOutlined />}
                  className="px-4 py-2 w-full"
                  block
                  onClick={canSplit ? () => handleConvertGRPO(grpoData, isSplitWise) : undefined}
                >
                  {submitLoading ? <CustomLoader variant="button" text="Converting..." /> : 'Convert To Bill With Split'}
                </PermissionButton>
              )}
              <PermissionButton
                canAccess={useModuleGrpo?.create}
                isViewOnly={isViewOnly}
                disabled={submitLoading}
                tooltipTitle={duplicateTooltip}
                tooltipProps={{ placement: 'left' }}
                wrapperClassName="block w-full"
                type="default"
                icon={<Icons.CopyOutlined />}
                className="px-4 py-2 w-full"
                block
                onClick={canDuplicate ? handleDuplicateClick : undefined}
              >
                Duplicate Document
              </PermissionButton>
              <PermissionButton
                canAccess={useModuleGrpo?.edit}
                isViewOnly={isViewOnly}
                disabled={!editStatus || submitLoading}
                tooltipTitle={editTooltip}
                tooltipProps={{ placement: 'left' }}
                wrapperClassName="block w-full"
                type="default"
                icon={<Icons.EditOutlined />}
                className="px-4 py-2 w-full"
                block
                onClick={canEdit ? handleEditClick : undefined}
              >
                {submitLoading ? <CustomLoader variant="button" text="Loading..." /> : 'Edit'}
              </PermissionButton>
              <PermissionButton
                canAccess={useModuleGrpo?.delete}
                isViewOnly={isViewOnly}
                disabled={deleteLoading}
                tooltipTitle={deleteTooltip}
                tooltipProps={{ placement: 'left' }}
                wrapperClassName="block w-full"
                type="default"
                danger
                icon={<Icons.DeleteOutlined />}
                className="px-4 py-2 w-full"
                block
                onClick={canDelete ? handleDeleteClick : undefined}
              >
                {deleteLoading ? <CustomLoader variant="button" text="Loading..." /> : 'Delete'}
              </PermissionButton>
            </ActionButtons>

            <DocumentMetadata data={grpoData} />

            <InventoryImpact data={grpoData} pageType={pageTypes?.GRPO} />

            <ConversionBadges
              convertedTo={grpoData?.convertedTo}
              convertedFrom={grpoData?.purchaseOrders}
              onConvertedToClick={() => setShowConvertToModal(true)}
              onConvertedFromClick={() => setShowConvertFromModal(true)}
              convertedFromLabel="Converted From Purchase Order"
            />

            <OrganizationInfo data={grpoData} />
          </div>
        </div>
      </div>
      {showConvertToModal && (
        <div className="fixed">
          <ConvertToDetail
            open={showConvertToModal}
            onClose={() => {
              setShowConvertToModal(false);
            }}
            convertToData={grpoData?.convertedTo || []}
            data={grpoData}
          />
        </div>
      )}
      {showConvertFromModal && (
        <div className="fixed">
          <ConvertFromDetail
            open={showConvertFromModal}
            onClose={() => {
              setShowConvertFromModal(false);
            }}
            convertFromData={grpoData?.purchaseOrders || []}
            type={'GRPO'}
            data={grpoData}
          />
        </div>
      )}
      <DocumentConfirmModal modal={deleteModal} docType={MODULE_NAMES?.GRPO} onConfirm={deleteGRPO} loading={deleteLoading} getDocumentDetails={getGrpoDocumentDetails} />
      <DocumentConfirmModal modal={cancelStatusModal} docType={MODULE_NAMES?.GRPO} loading={submitLoading} mode="status" onConfirm={confirmCancelStatus} getDocumentDetails={getGrpoDocumentDetails} />
      {viewCustomerDetail && <CustomerDrawerDetails viewCustomerDetail={viewCustomerDetail} setViewCustomerDetail={setViewCustomerDetail} customerData={customerData} isVendor={true} />}
      <BatchDetailsDrawer open={batchDrawerOpen} batch={itemInventoryBatch} loading={itemInventoryBatchLoading} onClose={handleBatchDrawerClose} />
    </>
  );
};

export default GrpoDetail;
