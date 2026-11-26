import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

// Components
import { Button, Dropdown, Tabs, Tooltip } from '@/components/AntDComponent';
import PermissionButton from '@/components/ui/button/PermissionButton';
import AttachMentDetails from '@/components/feedback/formModal/AttachMentDetails';
import BackButton from '@/components/ui/button/BackButton';
import DocumentRefreshButton from '@/components/ui/button/DocumentRefreshButton';
import ConvertFromDetail from '@/components/feedback/formModal/ConvertFromDetail';
import ConvertToDetail from '@/components/feedback/formModal/ConvertToDetail';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import DetailPageSkeleton from '@/components/feedback/pageLoader/DetailPageSkeleton';
import { DocumentConfirmModal } from '@/components/feedback/confirmModal/CancelOrDeleteDocumentModal';
import { ActionButtons, ConversionBadges, DocumentMetadata, InventoryImpact, OrganizationInfo } from '@/components/ui';
import { CommentHistory } from '@/features/common/comment';
import { ShowPDF } from '@/components/ui/common/ShowPDFLazy';
import SalesModuleDetailView from '@/components/dataDisplay/statCard/SalesModuleDetailView';
import SalesModuleTreeView from '@/components/dataDisplay/statCard/SalesModuleTreeView';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import CustomerDrawerDetails from '@/features/sales/customer/components/CustomerDrawerDetails';
import StatusUpdateLoader from '@/components/feedback/pageLoader/StatusUpdateLoader';
import NoFoundPage from '@/components/ui/common/NoFoundPage';

// Hooks
import { useConvert } from 'hooks/useConvert';
import { useConfirmModal } from '@/hooks/useConfirmModal';
import useModulePermissions from 'hooks/useModulePermissions';
import { useProfile } from '@/features/setting/profile/useProfile';

// Extras
import { getDeliveryChallanDocumentDetails, useDeliveryChallan } from '@/features/sales/deliveryChallan';
import { GstDocumentPanel, GstDocumentPdfActions, useGstFeatures } from '@/features/sales/gstDocument';
import StockTransferNotice from '@/features/sales/deliveryChallan/components/StockTransferNotice';
import Icons from 'assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import {
  BACKEND_ENUM,
  DELIVERY_CHALLAN_CONVERSION_ALLOWED_STATUSES,
  DELIVERY_CHALLAN_EDIT_RESTRICTED_STATUS,
  DELIVERY_CHALLAN_EWAY_BILL_STATUSES,
  DELIVERY_CHALLAN_STATUS,
  DELIVERY_CHALLAN_STATUS_CHANGE_RESTRICTED_STATUS,
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

const DeliveryChallansDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { deliveryChallanId } = useParams();
  const [activeKey, setActiveKey] = useState('1');
  const { loading, deliveryChallan, submitLoading, deleteLoading, resetDeliveryChallan, getDeliveryChallanById, updateStatus, removeDeliveryChallan } = useDeliveryChallan();
  const { itemInventoryBatch, itemInventoryBatchLoading, getItemInventoryBatchById, resetItemInventoryBatch } = useViewInventory();
  const deliveryChallanData = deliveryChallan;
  const { isSplitSessionActive, useModuleDelivery, useModuleInvoice, isSplitWise, isViewOnly } = useModulePermissions(RESOURCES.DELIVERY_CHALLANS);
  const { profile, getProfile } = useProfile();
  const { isEWayBillAvailable } = useGstFeatures();
  const isStockTransfer = Boolean(deliveryChallanData?.isStockTransfer);
  // A challan gets an e-way bill once it is sent; a stock transfer also needs its stock moved.
  const canGenerateEWayBill = DELIVERY_CHALLAN_EWAY_BILL_STATUSES.includes(deliveryChallanData?.status) && (!isStockTransfer || Boolean(deliveryChallanData?.stockTransfer?.transferredAt));
  const { handleConvertDeliveryChallan } = useConvert();
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
  const updateChallanStatus = async newStatus => {
    if (newStatus === BACKEND_ENUM?.CANCELLED) {
      cancelStatusModal.open(deliveryChallanData);
      return;
    }
    await handleUpdateStatus(deliveryChallanData?.id || deliveryChallanData?._id, newStatus);
  };

  const confirmCancelStatus = async () => {
    await handleUpdateStatus(deliveryChallanData?.id || deliveryChallanData?._id, BACKEND_ENUM?.CANCELLED);
    cancelStatusModal.close();
  };

  useEffect(() => {
    const controller = new AbortController();
    getProfile({ signal: controller.signal });
    return () => controller.abort();
  }, [getProfile]);

  useEffect(() => {
    const controller = new AbortController();
    if (deliveryChallanId) {
      getDeliveryChallanById({ deliveryChallanId, signal: controller.signal });
    }
    return () => {
      controller.abort();
      resetDeliveryChallan();
    };
  }, [deliveryChallanId, getDeliveryChallanById, resetDeliveryChallan]);

  const handleRefresh = async () => {
    await getDeliveryChallanById({ deliveryChallanId });
  };

  const handleEditClick = () => {
    navigate(`/delivery-challans/${deliveryChallanData._id}/edit`, {
      state: {
        deliveryChallanData,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleDuplicateClick = () => {
    navigate('/delivery-challans/new', {
      state: {
        duplicateFromId: deliveryChallanData?.id || deliveryChallanData?._id,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleDeleteClick = () => {
    deleteModal.open(deliveryChallanData);
  };

  const deleteDeliveryChallan = async () => {
    await removeDeliveryChallan({
      deliveryChallanId: deliveryChallanData?.id || deliveryChallanData?._id,
    });
    deleteModal.close();
    navigate('/delivery-challans');
  };

  const items = [
    {
      key: '1',
      label: 'Basic Info',
      children: (
        <div className="flex flex-col gap-3">
          {isStockTransfer && <StockTransferNotice />}
          <SalesModuleDetailView data={deliveryChallanData} profile={profile} pageType={pageTypes?.DELIVERY_CHALLAN} isEwayBillingAvailable={isEWayBillAvailable} />
        </div>
      ),
    },
    ...(deliveryChallanData?.attachments?.length > 0
      ? [
          {
            key: '2',
            label: 'Attachments',
            children: <AttachMentDetails data={deliveryChallanData} />,
          },
        ]
      : []),
    {
      key: '3',
      label: 'Document Flow',
      children: <SalesModuleTreeView moduleTree={deliveryChallanData?.moduleTree} sourceModule="deliveryChallan" currency={deliveryChallanData?.currency} />,
    },
    {
      key: 'stock-movement',
      label: 'Stock Movement',
      children: <StockMovementPanel url={API_ROUTES.SALES.DELIVERY_CHALLANS.STOCK_MOVEMENT(deliveryChallanId)} onBatchClick={handleBatchClick} />,
    },
    {
      key: 'journal-entries',
      label: 'Journal',
      children: <DocumentJournalPanel sourceModule={LEDGER_SOURCE_MODULES.DELIVERY_CHALLAN} sourceId={deliveryChallanId} />,
    },
    {
      key: '4',
      label: 'History',
      children: (
        <CommentHistory
          moduleName={MODULE_NAMES.DELIVERY_CHALLAN}
          referenceId={deliveryChallanId}
          commentHistory={deliveryChallanData?.commentHistory}
          canAddComment={useModuleDelivery?.edit}
          isViewOnly={isViewOnly}
        />
      ),
    },
  ];

  const handleUpdateStatus = async (deliveryChallanId, status) => {
    await updateStatus({ deliveryChallanId, status });
    getDeliveryChallanById({ deliveryChallanId });
  };

  let editStatus = !DELIVERY_CHALLAN_EDIT_RESTRICTED_STATUS?.includes(deliveryChallanData?.status);

  const getConvertStatusValue = status => {
    let statusArr = [];

    const dcId = deliveryChallanData?.id || deliveryChallanData?._id;
    const markAs = (backendStatus, labelStatus) => ({
      key: `markAs${labelStatus}`,
      label: `Mark As ${labelStatus}`,
      onClick: () => handleUpdateStatus(dcId, backendStatus),
    });
    const draftItem = markAs(BACKEND_ENUM?.DRAFT, DELIVERY_CHALLAN_STATUS?.DRAFT);
    const sentItem = markAs(BACKEND_ENUM?.SENT, DELIVERY_CHALLAN_STATUS?.SENT);
    const cancelItem = {
      key: `markAs${DELIVERY_CHALLAN_STATUS?.CANCELLED}`,
      label: `Mark As ${DELIVERY_CHALLAN_STATUS?.CANCELLED}`,
      onClick: () => updateChallanStatus(BACKEND_ENUM?.CANCELLED),
    };

    if (status === BACKEND_ENUM?.DRAFT) {
      statusArr = [sentItem, cancelItem];
    } else if (status === BACKEND_ENUM?.SENT) {
      statusArr = [draftItem, cancelItem];
    } else if (status === BACKEND_ENUM?.CANCELLED) {
      statusArr = [draftItem, sentItem];
    } else {
      statusArr = [cancelItem];
    }

    return statusArr;
  };

  const dropDownItems = [...getConvertStatusValue(deliveryChallanData?.status)];

  if (loading) {
    return <DetailPageSkeleton />;
  }

  if (!deliveryChallan) {
    return <NoFoundPage docType={MODULE_NAMES?.DELIVERY_CHALLAN} />;
  }

  const statusLabel = DELIVERY_CHALLAN_STATUS?.[deliveryChallanData?.status] || deliveryChallanData?.status || '-';
  const blockedTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : PERMISSION_MESSAGES.NO_PERMISSION;
  const canMarkStatus = useModuleDelivery?.edit && !isViewOnly && !DELIVERY_CHALLAN_STATUS_CHANGE_RESTRICTED_STATUS?.includes(deliveryChallanData?.status) && dropDownItems.length > 0;
  const canConvertINV = useModuleInvoice?.create && !isViewOnly && DELIVERY_CHALLAN_CONVERSION_ALLOWED_STATUSES?.includes(deliveryChallanData?.status);
  const canSplit = isSplitWise && isSplitSessionActive && canConvertINV;
  const showSplit = isSplitWise && isSplitSessionActive && useModuleInvoice?.create && DELIVERY_CHALLAN_CONVERSION_ALLOWED_STATUSES?.includes(deliveryChallanData?.status);
  const canDuplicate = useModuleDelivery?.create && !isViewOnly;
  const canEditOrder = useModuleDelivery?.edit && editStatus && !isViewOnly;
  const canDelete = useModuleDelivery?.delete && !isViewOnly;

  const markAsTooltip = canMarkStatus
    ? 'Mark Delivery Challan As'
    : !useModuleDelivery?.edit || isViewOnly
      ? blockedTooltip
      : `This document status cannot be changed in its current status - ${statusLabel}.`;
  const convertINVTooltip = canConvertINV
    ? 'Convert to Invoice'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useModuleInvoice?.create
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : `Cannot convert to Invoice in its current status - ${statusLabel}.`;
  const splitTooltip = canSplit ? 'Convert to Invoice With Split' : PERMISSION_MESSAGES.VIEW_ONLY;
  const duplicateTooltip = canDuplicate ? 'Duplicate Document' : blockedTooltip;
  const editTooltip = canEditOrder ? 'Edit Delivery Challan' : !useModuleDelivery?.edit || isViewOnly ? blockedTooltip : `This document cannot be edited in its current status - ${statusLabel}.`;
  const deleteTooltip = canDelete ? 'Delete Delivery Challan' : blockedTooltip;

  const customerData = {
    id: deliveryChallanData?.customerId?._id || deliveryChallanData?.customerId?.id,
    customerDisplayName: deliveryChallanData?.customerId?.customerDisplayName,
  };

  return (
    <>
      <StatusUpdateLoader loading={submitLoading} hidden={deleteModal.isOpen || cancelStatusModal.isOpen} text="Updating delivery challan status..." />
      <div className="bg-white border-b border-gray-100 px-4 py-2 -m-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <BackButton />
            <div className="flex flex-col">
              <h1 className="text-[18px] font-semibold text-gray-900">Delivery Challan Details</h1>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm font-medium text-gray-600">{deliveryChallanData?.challanId}</span>
                <span className="text-gray-400">•</span>
                <StatusBadge status={deliveryChallanData?.status} value={DELIVERY_CHALLAN_STATUS?.[deliveryChallanData?.status]} />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-3">
            <DocumentRefreshButton onRefresh={handleRefresh} />
            {deliveryChallanData?.customerId && (
              <Button type="default" size="middle" icon={<Icons.ExportOutlined className="mr-2" />} onClick={() => setViewCustomerDetail(true)} className="flex items-center">
                View Customer
              </Button>
            )}
            <GstDocumentPdfActions
              document={deliveryChallanData}
              documentLabel="Delivery Challan"
              documentNumber={deliveryChallanData?.challanId}
              fileName={generateSafeFileName(deliveryChallanData, 'challanId')}
              allowEInvoice={false}
              renderPdf={pdfFlags => (
                <ShowPDF
                  data={deliveryChallanData}
                  billingAddress={deliveryChallanData?.customerId?.address?.billing}
                  shippingAddress={deliveryChallanData?.shippingAddress}
                  profile={profile}
                  pageType={pageTypes.DELIVERY_CHALLAN}
                  {...pdfFlags}
                />
              )}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row xl:justify-between">
        <div className="w-full xl:w-3/4 pt-3">
          <Tabs activeKey={activeKey} onChange={setActiveKey} items={items} />
        </div>
        <div className="xl:mt-[62px] h-fit w-full xl:w-[250px] space-y-3">
          <ActionButtons>
            {canMarkStatus ? (
              <Dropdown menu={{ items: dropDownItems }} placement="bottom" trigger={['click']}>
                <Button type="primary" className="px-4 py-2 w-full" disabled={submitLoading} block>
                  {submitLoading ? <CustomLoader variant="button" text="Updating..." /> : 'Mark Delivery Challan As'}
                </Button>
              </Dropdown>
            ) : (
              <Tooltip title={markAsTooltip} placement="left">
                <span className="block w-full">
                  <Button type="primary" className="px-4 py-2 w-full" disabled block>
                    Mark Delivery Challan As
                  </Button>
                </span>
              </Tooltip>
            )}
            <GstDocumentPanel
              basePath={API_ROUTES.SALES.DELIVERY_CHALLANS.BASE}
              documentId={deliveryChallanData?._id || deliveryChallanData?.id}
              document={deliveryChallanData}
              documentLabel="Delivery Challan"
              contextItems={[
                { label: 'Delivery Challan#', value: deliveryChallanData?.challanId },
                { label: 'Customer Name', value: deliveryChallanData?.customerId?.customerDisplayName },
                ...(isStockTransfer
                  ? [
                      { label: 'From Warehouse', value: deliveryChallanData?.stockTransfer?.fromWarehouseName },
                      { label: 'To Warehouse', value: deliveryChallanData?.warehouseName },
                    ]
                  : [{ label: 'Warehouse', value: deliveryChallanData?.warehouseName }]),
              ]}
              allowEInvoice={false}
              canGenerate={Boolean(useModuleDelivery?.edit) && !isViewOnly && canGenerateEWayBill}
              onChanged={() => getDeliveryChallanById({ deliveryChallanId })}
            />
            <PermissionButton
              canAccess={useModuleInvoice?.create}
              isViewOnly={isViewOnly}
              disabled={!DELIVERY_CHALLAN_CONVERSION_ALLOWED_STATUSES?.includes(deliveryChallanData?.status) || submitLoading}
              tooltipTitle={convertINVTooltip}
              tooltipProps={{ placement: 'left' }}
              wrapperClassName="block w-full"
              type="primary"
              icon={<Icons.SwapOutlined />}
              className="px-4 py-2 w-full"
              block
              onClick={canConvertINV ? () => handleConvertDeliveryChallan(deliveryChallanData) : undefined}
            >
              {submitLoading ? <CustomLoader variant="button" text="Converting..." /> : 'Convert To Invoice'}
            </PermissionButton>
            {showSplit && (
              <PermissionButton
                canAccess={useModuleInvoice?.create}
                isViewOnly={isViewOnly}
                disabled={submitLoading}
                tooltipTitle={splitTooltip}
                tooltipProps={{ placement: 'left' }}
                wrapperClassName="block w-full"
                type="primary"
                icon={<Icons.SplitCellsOutlined />}
                className="px-4 py-2 w-full"
                block
                onClick={canSplit ? () => handleConvertDeliveryChallan(deliveryChallanData, isSplitWise) : undefined}
              >
                {submitLoading ? <CustomLoader variant="button" text="Converting..." /> : 'Convert To Invoice With Split'}
              </PermissionButton>
            )}
            <PermissionButton
              canAccess={useModuleDelivery?.create}
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
              canAccess={useModuleDelivery?.edit}
              isViewOnly={isViewOnly}
              disabled={!editStatus || submitLoading}
              tooltipTitle={editTooltip}
              tooltipProps={{ placement: 'left' }}
              wrapperClassName="block w-full"
              type="default"
              icon={<Icons.EditOutlined />}
              className="px-4 py-2 w-full"
              block
              onClick={canEditOrder ? handleEditClick : undefined}
            >
              {submitLoading ? <CustomLoader variant="button" text="Loading..." /> : 'Edit'}
            </PermissionButton>
            <PermissionButton
              canAccess={useModuleDelivery?.delete}
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

          <DocumentMetadata data={deliveryChallanData} />

          <InventoryImpact data={deliveryChallanData} pageType={pageTypes?.DELIVERY_CHALLAN} />

          <ConversionBadges
            convertedTo={deliveryChallanData?.convertedTo}
            convertedFrom={deliveryChallanData?.salesOrders}
            onConvertedToClick={() => setShowConvertToModal(true)}
            onConvertedFromClick={() => setShowConvertFromModal(true)}
          />

          {isStockTransfer ? (
            <>
              <OrganizationInfo
                title="Stock Transfer From"
                data={{
                  divisionName: deliveryChallanData?.stockTransfer?.fromDivisionName,
                  branchName: deliveryChallanData?.stockTransfer?.fromBranchName,
                  warehouseName: deliveryChallanData?.stockTransfer?.fromWarehouseName,
                }}
              />
              <OrganizationInfo title="Stock Transfer To" data={deliveryChallanData} />
            </>
          ) : (
            <OrganizationInfo data={deliveryChallanData} />
          )}
        </div>
      </div>
      {showConvertToModal && (
        <div className="fixed">
          <ConvertToDetail
            open={showConvertToModal}
            onClose={() => {
              setShowConvertToModal(false);
            }}
            convertToData={deliveryChallanData?.convertedTo || []}
            data={deliveryChallanData}
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
            convertFromData={deliveryChallanData?.salesOrders || []}
            type={'DELIVERY_CHALLAN'}
            data={deliveryChallanData}
          />
        </div>
      )}
      <DocumentConfirmModal
        modal={deleteModal}
        docType={MODULE_NAMES?.DELIVERY_CHALLAN}
        onConfirm={deleteDeliveryChallan}
        loading={deleteLoading}
        getDocumentDetails={getDeliveryChallanDocumentDetails}
      />
      <DocumentConfirmModal
        modal={cancelStatusModal}
        docType={MODULE_NAMES?.DELIVERY_CHALLAN}
        loading={submitLoading}
        mode="status"
        onConfirm={confirmCancelStatus}
        getDocumentDetails={getDeliveryChallanDocumentDetails}
      />
      {viewCustomerDetail && <CustomerDrawerDetails viewCustomerDetail={viewCustomerDetail} setViewCustomerDetail={setViewCustomerDetail} customerData={customerData} />}
      <BatchDetailsDrawer open={batchDrawerOpen} batch={itemInventoryBatch} loading={itemInventoryBatchLoading} onClose={handleBatchDrawerClose} />
    </>
  );
};

export default DeliveryChallansDetail;
