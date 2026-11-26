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
import ConvertToDetail from '@/components/feedback/formModal/ConvertToDetail';
import CustomerDrawerDetails from '@/features/sales/customer/components/CustomerDrawerDetails';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import DetailPageSkeleton from '@/components/feedback/pageLoader/DetailPageSkeleton';
import { DocumentConfirmModal } from '@/components/feedback/confirmModal/CancelOrDeleteDocumentModal';
import { DocumentMetadata, InventoryImpact, OrganizationInfo, ConversionBadges, ActionButtons } from '@/components/ui';
import { CommentHistory } from '@/features/common/comment';
import PurchaseModuleTreeView from '@/components/dataDisplay/statCard/PurchaseModuleTreeView';
import SalesModuleDetailView from '@/components/dataDisplay/statCard/SalesModuleDetailView';
import SalesOrderItemDetails from '@/components/dataDisplay/statCard/SalesOrderItemDetails';
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
import { usePurchaseOrder, getPurchaseOrderDocumentDetails } from '@/features/purchase/purchaseOrder';
import Icons from 'assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import {
  BACKEND_ENUM,
  MODULE_NAMES,
  pageTypes,
  PERMISSION_MESSAGES,
  PURCHASE_ORDER_CONVERSION_ALLOWED_STATUSES,
  PURCHASE_ORDER_EDIT_RESTRICTED_STATUS,
  PURCHASE_ORDER_STATUS,
  PURCHASE_ORDER_STATUS_CHANGE_RESTRICTED_STATUS,
} from 'utils/constants';
import { getGstNumericRate } from '@/utils/gstDisplay';
import { generateSafeFileName } from '@/utils/pdfname';
import { toDecimalString } from '@/utils/currency';

dayjs.extend(utc);

const PurchaseOrderDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { purchaseOrderId } = useParams();
  const [activeKey, setActiveKey] = useState('1');
  const { loading, purchaseOrder, submitLoading, deleteLoading, resetPurchaseOrder, getPurchaseOrderById, updateStatus, removePurchaseOrder } = usePurchaseOrder();
  const purchaseOrderData = purchaseOrder;
  const { useModulePurchaseOrder, isViewOnly, useModuleGrpo, useModuleBills } = useModulePermissions(RESOURCES.PURCHASE_ORDER);
  const { profile, getProfile } = useProfile();
  const { handleConvertPurchaseOrder } = useConvert();
  const [showConvertToModal, setShowConvertToModal] = useState(false);
  const deleteModal = useConfirmModal();
  const cancelStatusModal = useConfirmModal();
  const [viewCustomerDetail, setViewCustomerDetail] = useState(false);
  const updatePurchaseOrderStatus = async newStatus => {
    if (newStatus === BACKEND_ENUM?.CANCELLED) {
      cancelStatusModal.open(purchaseOrderData);
      return;
    }
    await handleUpdateStatus(purchaseOrderData?.id || purchaseOrderData?._id, newStatus);
  };

  const confirmCancelStatus = async () => {
    await handleUpdateStatus(purchaseOrderData?.id || purchaseOrderData?._id, BACKEND_ENUM?.CANCELLED);
    cancelStatusModal.close();
  };

  useEffect(() => {
    const controller = new AbortController();
    getProfile({ signal: controller.signal });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    if (purchaseOrderId) {
      getPurchaseOrderById({ purchaseOrderId, signal: controller.signal });
    }

    return () => {
      controller.abort();
      resetPurchaseOrder();
    };
  }, [purchaseOrderId]);

  const handleRefresh = async () => {
    await getPurchaseOrderById({ purchaseOrderId });
  };

  const handleEditClick = () => {
    resetPurchaseOrder();
    navigate(`/purchase-orders/${purchaseOrderData._id}/edit`, {
      state: {
        purchaseOrderData: purchaseOrderData,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleDuplicateClick = () => {
    navigate('/purchase-orders/new', {
      state: {
        duplicateFromId: purchaseOrderData?.id || purchaseOrderData?._id,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleDeleteClick = () => {
    deleteModal.open(purchaseOrderData);
  };

  const deletePurchaseOrder = async () => {
    await removePurchaseOrder({
      purchaseOrderId: purchaseOrderData?.id || purchaseOrderData?._id,
    });
    deleteModal.close();
    navigate('/purchase-orders');
  };

  const items = [
    {
      key: '1',
      label: 'Basic Info',
      children: <SalesModuleDetailView data={purchaseOrderData} profile={profile} pageType={pageTypes?.PURCHASE_ORDER} />,
    },
    {
      key: '2',
      label: 'Item Details',
      children: <SalesOrderItemDetails documentData={purchaseOrderData} />,
    },
    ...(purchaseOrderData?.attachments?.length > 0
      ? [
          {
            key: '3',
            label: 'Attachments',
            children: <AttachMentDetails data={purchaseOrderData} />,
          },
        ]
      : []),
    {
      key: '4',
      label: 'Document Flow',
      children: <PurchaseModuleTreeView moduleTree={purchaseOrderData?.moduleTree} sourceModule="purchaseOrder" currency={purchaseOrderData?.currency} />,
    },
    {
      key: '5',
      label: 'History',
      children: (
        <CommentHistory
          moduleName={MODULE_NAMES.PURCHASE_ORDER}
          referenceId={purchaseOrderId}
          commentHistory={purchaseOrderData?.commentHistory}
          canAddComment={useModulePurchaseOrder?.edit}
          isViewOnly={isViewOnly}
        />
      ),
    },
  ];

  const handlePrint = async () => {
    const blob = await renderPdfToBlob(
      <ShowPDF
        data={purchaseOrderData}
        billingAddress={purchaseOrderData?.vendor?.address?.billing}
        shippingAddress={purchaseOrderData?.shippingAddress}
        profile={profile}
        pageType={pageTypes.PURCHASE_ORDER}
      />
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

  const handleUpdateStatus = async (purchaseOrderId, status) => {
    await updateStatus({ purchaseOrderId, status });
    getPurchaseOrderById({ purchaseOrderId });
  };

  let editStatus = !PURCHASE_ORDER_EDIT_RESTRICTED_STATUS?.includes(purchaseOrderData?.status);

  const getConvertStatusValue = status => {
    let statusArr = [];

    const poId = purchaseOrderData?.id || purchaseOrderData?._id;
    const markAs = (backendStatus, labelStatus) => ({
      key: `markAs${labelStatus}`,
      label: `Mark As ${labelStatus}`,
      onClick: () => handleUpdateStatus(poId, backendStatus),
    });
    const draftItem = markAs(BACKEND_ENUM?.DRAFT, PURCHASE_ORDER_STATUS?.DRAFT);
    const sentItem = markAs(BACKEND_ENUM?.SENT, PURCHASE_ORDER_STATUS?.SENT);
    const cancelItem = {
      key: `markAs${PURCHASE_ORDER_STATUS?.CANCELLED}`,
      label: `Mark As ${PURCHASE_ORDER_STATUS?.CANCELLED}`,
      onClick: () => updatePurchaseOrderStatus(BACKEND_ENUM?.CANCELLED),
    };

    if (status === BACKEND_ENUM?.DRAFT) {
      statusArr = [sentItem, cancelItem];
    } else if (status === BACKEND_ENUM?.SENT) {
      statusArr = [markAs(BACKEND_ENUM?.ACCEPTED, PURCHASE_ORDER_STATUS?.ACCEPTED), markAs(BACKEND_ENUM?.REJECTED, PURCHASE_ORDER_STATUS?.REJECTED), draftItem, cancelItem];
    } else if (status === BACKEND_ENUM?.ACCEPTED) {
      statusArr = [markAs(BACKEND_ENUM?.CONVERTED, PURCHASE_ORDER_STATUS?.CONVERTED), sentItem, draftItem, cancelItem];
    } else if (status === BACKEND_ENUM?.REJECTED) {
      statusArr = [draftItem, cancelItem];
    } else if (status === BACKEND_ENUM?.CONVERTED) {
      statusArr = [cancelItem];
    } else if (status === BACKEND_ENUM?.PARTIALLY_RECORDED) {
      statusArr = [
        {
          key: `markAs${PURCHASE_ORDER_STATUS?.CLOSED}`,
          label: `Mark As ${PURCHASE_ORDER_STATUS?.CLOSED}`,
          onClick: () => updatePurchaseOrderStatus(BACKEND_ENUM?.CLOSED),
        },
        cancelItem,
      ];
    } else if (status === BACKEND_ENUM?.CLOSED) {
      statusArr = [markAs(BACKEND_ENUM?.PARTIALLY_RECORDED, PURCHASE_ORDER_STATUS?.PARTIALLY_RECORDED)];
    } else if (status === BACKEND_ENUM?.CANCELLED) {
      statusArr = [draftItem, sentItem];
    }

    return statusArr;
  };

  const dropDownItems = [...getConvertStatusValue(purchaseOrderData?.status)];

  if (loading) {
    return <DetailPageSkeleton />;
  }

  if (!purchaseOrder) {
    return <NoFoundPage docType={MODULE_NAMES?.PURCHASE_ORDER} />;
  }

  const customerData = {
    id: purchaseOrderData?.vendor?._id,
    customerDisplayName: purchaseOrderData?.vendor?.customerDisplayName,
  };

  const statusLabel = PURCHASE_ORDER_STATUS?.[purchaseOrderData?.status] || purchaseOrderData?.status || '-';
  const blockedTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : PERMISSION_MESSAGES.NO_PERMISSION;
  const canMarkStatus = useModulePurchaseOrder?.edit && !isViewOnly && !PURCHASE_ORDER_STATUS_CHANGE_RESTRICTED_STATUS?.includes(purchaseOrderData?.status) && dropDownItems.length > 0;
  const canConvertGRPO = useModuleGrpo?.create && !isViewOnly && PURCHASE_ORDER_CONVERSION_ALLOWED_STATUSES?.includes(purchaseOrderData?.status);
  const canConvertBill = useModuleBills?.create && !isViewOnly && PURCHASE_ORDER_CONVERSION_ALLOWED_STATUSES?.includes(purchaseOrderData?.status);
  const canDuplicate = useModulePurchaseOrder?.create && !isViewOnly;
  const canEdit = useModulePurchaseOrder?.edit && editStatus && !isViewOnly;
  const canDelete = useModulePurchaseOrder?.delete && !isViewOnly;
  const markAsTooltip = canMarkStatus
    ? 'Mark Purchase Order As'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useModulePurchaseOrder?.edit
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : `This document status cannot be changed in its current status - ${statusLabel}.`;
  const convertGRPOTooltip = canConvertGRPO
    ? 'Convert to GRPO'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useModuleGrpo?.create
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : `Cannot convert to GRPO in its current status - ${statusLabel}.`;
  const convertBillTooltip = canConvertBill
    ? 'Convert to Bill'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useModuleBills?.create
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : `Cannot convert to Bill in its current status - ${statusLabel}.`;
  const duplicateTooltip = canDuplicate ? 'Duplicate Document' : blockedTooltip;
  const editTooltip = canEdit
    ? 'Edit Purchase Order'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useModulePurchaseOrder?.edit
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : `This document cannot be edited in its current status - ${statusLabel}.`;
  const deleteTooltip = canDelete ? 'Delete Purchase Order' : blockedTooltip;

  return (
    <>
      <StatusUpdateLoader loading={submitLoading} hidden={deleteModal.isOpen || cancelStatusModal.isOpen} text="Updating purchase order status..." />
      <div className="bg-white border-b border-gray-100 px-4 py-2 -m-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <BackButton />
            <div className="flex flex-col">
              <h1 className="text-[18px] font-semibold text-gray-900">Purchase Order Details</h1>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm font-medium text-gray-600">{purchaseOrderData?.purchaseOrderId}</span>
                <span className="text-gray-400">•</span>
                <StatusBadge status={purchaseOrderData?.status} value={PURCHASE_ORDER_STATUS?.[purchaseOrderData?.status]} />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-3">
            <DocumentRefreshButton onRefresh={handleRefresh} />
            {purchaseOrderData?.vendor?._id && (
              <Button type="default" size="middle" icon={<Icons.ExportOutlined className="mr-2" />} onClick={() => setViewCustomerDetail(true)} className="flex items-center">
                View Vendor
              </Button>
            )}
            <PDFDownloadLink
              document={
                <ShowPDF
                  data={purchaseOrderData}
                  billingAddress={purchaseOrderData?.vendor?.address?.billing}
                  shippingAddress={purchaseOrderData?.shippingAddress}
                  profile={profile}
                  pageType={pageTypes.PURCHASE_ORDER}
                />
              }
              fileName={generateSafeFileName(purchaseOrderData, 'purchaseOrderId')}
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
                    {submitLoading ? <CustomLoader variant="button" text="Updating..." /> : 'Mark Purchase Order As'}
                  </Button>
                </Dropdown>
              ) : (
                <Tooltip title={markAsTooltip} placement="left">
                  <span className="block w-full">
                    <Button type="primary" className="px-4 py-2 w-full" disabled block>
                      Mark Purchase Order As
                    </Button>
                  </span>
                </Tooltip>
              )}
              <PermissionButton
                canAccess={useModuleGrpo?.create}
                isViewOnly={isViewOnly}
                disabled={!PURCHASE_ORDER_CONVERSION_ALLOWED_STATUSES?.includes(purchaseOrderData?.status) || submitLoading}
                tooltipTitle={convertGRPOTooltip}
                tooltipProps={{ placement: 'left' }}
                wrapperClassName="block w-full"
                type="primary"
                icon={<Icons.SwapOutlined />}
                className="px-4 py-2 w-full"
                block
                onClick={
                  canConvertGRPO
                    ? () => {
                        const clonedData = structuredClone(purchaseOrderData);

                        let updatedItems = [];
                        clonedData?.items?.forEach(x => {
                          if (purchaseOrderData?.status === BACKEND_ENUM?.PARTIALLY_RECORDED) {
                            if (x?.remainingQty > 0) {
                              const quantity = parseFloat(x?.remainingQty || x?.quantity);
                              const rate = parseFloat(x.rate || 0);
                              const gst = getGstNumericRate(x.gst);
                              const amount = quantity * rate;
                              const taxAmount = (gst / 100) * amount;
                              updatedItems.push({
                                ...x,
                                referenceId: clonedData?.id || clonedData?._id,
                                referenceNo: clonedData?.purchaseOrderId,
                                quantity,
                                referenceType: 'PurchaseOrder',
                                taxAmount: taxAmount ? toDecimalString(parseFloat(taxAmount)) : 0,
                                amount: amount ? toDecimalString(parseFloat(amount)) : 0,
                              });
                            }
                          } else {
                            const quantity = parseFloat(x?.quantity);
                            const rate = parseFloat(x.rate || 0);
                            const gst = getGstNumericRate(x.gst);
                            const amount = quantity * rate;
                            const taxAmount = (gst / 100) * amount;
                            updatedItems.push({
                              ...x,
                              referenceId: clonedData?.id || clonedData?._id,
                              referenceNo: clonedData?.purchaseOrderId,
                              quantity,
                              referenceType: 'PurchaseOrder',
                              taxAmount: taxAmount ? toDecimalString(parseFloat(taxAmount)) : 0,
                              amount: amount ? toDecimalString(parseFloat(amount)) : 0,
                            });
                          }
                        });

                        clonedData.items = updatedItems;
                        handleConvertPurchaseOrder(clonedData, 'grpo');
                      }
                    : undefined
                }
              >
                {submitLoading ? <CustomLoader variant="button" text="Converting..." /> : 'Convert To GRPO'}
              </PermissionButton>

              {/* Convert to Bill - Always Show */}
              <PermissionButton
                canAccess={useModuleBills?.create}
                isViewOnly={isViewOnly}
                disabled={!PURCHASE_ORDER_CONVERSION_ALLOWED_STATUSES?.includes(purchaseOrderData?.status) || submitLoading}
                tooltipTitle={convertBillTooltip}
                tooltipProps={{ placement: 'left' }}
                wrapperClassName="block w-full"
                type="primary"
                icon={<Icons.SwapOutlined />}
                className="px-4 py-2 w-full"
                block
                onClick={
                  canConvertBill
                    ? () => {
                        const clonedData = structuredClone(purchaseOrderData);

                        let updatedItems = [];
                        clonedData?.items?.forEach(x => {
                          if (purchaseOrderData?.status === BACKEND_ENUM?.PARTIALLY_RECORDED) {
                            if (x?.remainingQty > 0) {
                              const quantity = parseFloat(x?.remainingQty || x?.quantity);
                              const rate = parseFloat(x.rate || 0);
                              const gst = getGstNumericRate(x.gst);
                              const amount = quantity * rate;
                              const taxAmount = (gst / 100) * amount;
                              updatedItems.push({
                                ...x,
                                referenceId: clonedData?.id || clonedData?._id,
                                referenceNo: clonedData?.purchaseOrderId,
                                quantity,
                                referenceType: 'PurchaseOrder',
                                taxAmount: taxAmount ? toDecimalString(parseFloat(taxAmount)) : 0,
                                amount: amount ? toDecimalString(parseFloat(amount)) : 0,
                              });
                            }
                          } else {
                            const quantity = parseFloat(x?.quantity);
                            const rate = parseFloat(x.rate || 0);
                            const gst = getGstNumericRate(x.gst);
                            const amount = quantity * rate;
                            const taxAmount = (gst / 100) * amount;
                            updatedItems.push({
                              ...x,
                              referenceId: clonedData?.id || clonedData?._id,
                              referenceNo: clonedData?.purchaseOrderId,
                              quantity,
                              referenceType: 'PurchaseOrder',
                              taxAmount: taxAmount ? toDecimalString(parseFloat(taxAmount)) : 0,
                              amount: amount ? toDecimalString(parseFloat(amount)) : 0,
                            });
                          }
                        });

                        clonedData.items = updatedItems;
                        handleConvertPurchaseOrder(clonedData, 'bills');
                      }
                    : undefined
                }
              >
                {submitLoading ? <CustomLoader variant="button" text="Converting..." /> : 'Convert To Bills'}
              </PermissionButton>

              <PermissionButton
                canAccess={useModulePurchaseOrder?.create}
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

              {/* Edit Button */}
              <PermissionButton
                canAccess={useModulePurchaseOrder?.edit}
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

              {/* Delete Button */}
              <PermissionButton
                canAccess={useModulePurchaseOrder?.delete}
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

            <DocumentMetadata data={purchaseOrderData} />

            <InventoryImpact data={purchaseOrderData} pageType={pageTypes?.PURCHASE_ORDER} />

            <ConversionBadges convertedTo={purchaseOrderData?.convertedTo} onConvertedToClick={() => setShowConvertToModal(true)} />

            <OrganizationInfo data={purchaseOrderData} />
          </div>
        </div>
      </div>
      {showConvertToModal && (
        <div className="fixed">
          <ConvertToDetail
            convertToData={purchaseOrderData?.convertedTo || []}
            open={showConvertToModal}
            onClose={() => {
              setShowConvertToModal(false);
            }}
            data={purchaseOrderData}
          />
        </div>
      )}
      <DocumentConfirmModal modal={deleteModal} docType={MODULE_NAMES?.PURCHASE_ORDER} onConfirm={deletePurchaseOrder} loading={deleteLoading} getDocumentDetails={getPurchaseOrderDocumentDetails} />
      <DocumentConfirmModal
        modal={cancelStatusModal}
        docType={MODULE_NAMES?.PURCHASE_ORDER}
        loading={submitLoading}
        mode="status"
        onConfirm={confirmCancelStatus}
        getDocumentDetails={getPurchaseOrderDocumentDetails}
      />
      {viewCustomerDetail && <CustomerDrawerDetails viewCustomerDetail={viewCustomerDetail} setViewCustomerDetail={setViewCustomerDetail} customerData={customerData} isVendor={true} />}
    </>
  );
};

export default PurchaseOrderDetail;
