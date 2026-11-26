import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { PDFDownloadLink } from '@/components/ui/common/PdfDownloadLinkLazy';
import { renderPdfToBlob } from '@/utils/loadReactPdf';
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
import CustomerDrawerDetails from '@/features/sales/customer/components/CustomerDrawerDetails';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import DetailPageSkeleton from '@/components/feedback/pageLoader/DetailPageSkeleton';
import { DocumentConfirmModal } from '@/components/feedback/confirmModal/CancelOrDeleteDocumentModal';
import CreateProductionFromSalesOrderModal from '../components/CreateProductionFromSalesOrderModal';
import { ActionButtons, ConversionBadges, DocumentMetadata, InventoryImpact, OrganizationInfo } from '@/components/ui';
import { CommentHistory } from '@/features/common/comment';
import { ShowPDF } from '@/components/ui/common/ShowPDFLazy';
import SalesModuleDetailView from '@/components/dataDisplay/statCard/SalesModuleDetailView';
import SalesModuleTreeView from '@/components/dataDisplay/statCard/SalesModuleTreeView';
import SalesOrderItemDetails from '@/components/dataDisplay/statCard/SalesOrderItemDetails';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import StatusUpdateLoader from '@/components/feedback/pageLoader/StatusUpdateLoader';
import NoFoundPage from '@/components/ui/common/NoFoundPage';

// Hooks
import { useConvert } from 'hooks/useConvert';
import { useConfirmModal } from '@/hooks/useConfirmModal';
import { useProfile } from '@/features/setting/profile/useProfile';
import { useModule } from 'hooks/useModule';
import useModulePermissions from 'hooks/useModulePermissions';

// Extras
import { getSalesOrderDocumentDetails, useSalesOrder } from '@/features/sales/salesOrder';
import Icons from 'assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { getGstNumericRate } from '@/utils/gstDisplay';
import { generateSafeFileName } from '@/utils/pdfname';
import {
  BACKEND_ENUM,
  MODULE_NAMES,
  pageTypes,
  PERMISSION_MESSAGES,
  SALES_ORDER_CONVERSION_ALLOWED_STATUSES,
  SALES_ORDER_EDIT_RESTRICTED_STATUS,
  SALES_ORDER_STATUS,
  SALES_ORDER_STATUS_CHANGE_RESTRICTED_STATUS,
  SALES_ORDER_MATERIAL_STATUS_LABELS,
} from 'utils/constants';
import { toDecimalString } from '@/utils/currency';

dayjs.extend(utc);

const SalesOrderDetail = () => {
  const navigate = useNavigate();
  const { salesId } = useParams();
  const location = useLocation();
  const [activeKey, setActiveKey] = useState('1');
  const { loading, salesOrder, submitLoading, deleteLoading, updateStatus, revertClose, getSalesOrderById, resetSalesOrder, removeSalesOrder } = useSalesOrder();
  const salesOrderData = salesOrder;
  const { useModuleSalesOrder, useModuleDeliveryChallan, useModuleInvoice, isViewOnly } = useModulePermissions(RESOURCES.SALES_ORDER);
  const { permissionPlanMap } = useModule();
  const isDeliveryChallanInPlan = permissionPlanMap?.['delivery-challans'] !== false;
  const isProductionInPlan = permissionPlanMap?.['production-module'] !== false;
  const { useAddProduction } = useModulePermissions(RESOURCES.ADD_PRODUCTION);
  const { profile, getProfile } = useProfile();
  const { handleConvertSalesOrder } = useConvert();
  const [showConvertToModal, setShowConvertToModal] = useState(false);
  const [showConvertFromModal, setShowConvertFromModal] = useState(false);
  const deleteModal = useConfirmModal();
  const cancelStatusModal = useConfirmModal();
  const [viewCustomerDetail, setViewCustomerDetail] = useState(false);
  const [openCreateProductionModal, setOpenCreateProductionModal] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    getProfile({ signal: controller.signal });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    if (salesId) {
      getSalesOrderById({ orderId: salesId, signal: controller.signal });
    }

    return () => {
      controller.abort();
      resetSalesOrder();
    };
  }, [salesId]);

  const handleRefresh = async () => {
    await getSalesOrderById({ orderId: salesId });
  };

  const handleEditClick = () => {
    navigate(`/sales-orders/${salesOrderData._id}/edit`, {
      state: {
        salesOrderData: salesOrderData,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleDuplicateClick = () => {
    navigate('/sales-orders/new', {
      state: {
        duplicateFromId: salesOrderData?.id || salesOrderData?._id,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleDeleteClick = () => {
    deleteModal.open(salesOrderData);
  };

  const deleteSalesOrder = async () => {
    await removeSalesOrder({ salesOrderId: salesOrderData?.id || salesOrderData?._id });
    deleteModal.close();
    navigate('/sales-orders');
  };

  const items = [
    {
      key: '1',
      label: 'Basic Info',
      children: <SalesModuleDetailView data={salesOrderData} profile={profile} pageType={pageTypes?.SALES_ORDER} />,
    },
    {
      key: '2',
      label: 'Items & Raw Materials',
      children: <SalesOrderItemDetails documentData={salesOrderData} />,
    },
    ...(salesOrderData?.attachments?.length > 0
      ? [
          {
            key: '3',
            label: 'Attachments',
            children: <AttachMentDetails data={salesOrderData} />,
          },
        ]
      : []),
    {
      key: '4',
      label: 'Document Flow',
      children: <SalesModuleTreeView moduleTree={salesOrderData?.moduleTree} sourceModule="salesOrder" currency={salesOrderData?.currency} />,
    },
    {
      key: '5',
      label: 'History',
      children: (
        <CommentHistory moduleName={MODULE_NAMES.SALES_ORDER} referenceId={salesId} commentHistory={salesOrderData?.commentHistory} canAddComment={useModuleSalesOrder?.edit} isViewOnly={isViewOnly} />
      ),
    },
  ];

  const handlePrint = async () => {
    const blob = await renderPdfToBlob(
      <ShowPDF
        data={salesOrderData}
        billingAddress={salesOrderData?.customerId?.address?.billing}
        shippingAddress={salesOrderData?.shippingAddress}
        profile={profile}
        pageType={pageTypes.SALES_ORDER}
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

  const handleUpdateStatus = async (orderId, status) => {
    await updateStatus({ orderId, status });
    getSalesOrderById({ orderId });
  };

  const handleRevertClose = async orderId => {
    await revertClose({ orderId });
    getSalesOrderById({ orderId });
  };

  const confirmCancelStatus = async () => {
    await handleUpdateStatus(salesOrderData?.id || salesOrderData?._id, BACKEND_ENUM?.CANCELLED);
    cancelStatusModal.close();
  };

  let editStatus = !SALES_ORDER_EDIT_RESTRICTED_STATUS?.includes(salesOrderData?.status);

  const getConvertStatusValue = status => {
    let statusArr = [];

    const soId = salesOrderData?.id || salesOrderData?._id;
    const markAs = (backendStatus, labelStatus) => ({
      key: `markAs${labelStatus}`,
      label: `Mark As ${labelStatus}`,
      onClick: () => handleUpdateStatus(soId, backendStatus),
    });
    const draftItem = markAs(BACKEND_ENUM?.DRAFT, SALES_ORDER_STATUS?.DRAFT);
    const openItem = markAs(BACKEND_ENUM?.OPEN, SALES_ORDER_STATUS?.OPEN);
    const closedItem = markAs(BACKEND_ENUM?.CLOSED, SALES_ORDER_STATUS?.CLOSED);
    const cancelItem = {
      key: `markAs${SALES_ORDER_STATUS?.CANCELLED}`,
      label: `Mark As ${SALES_ORDER_STATUS?.CANCELLED}`,
      onClick: () => cancelStatusModal.open(salesOrderData),
    };
    const revertCloseItem = {
      key: 'revertClose',
      label: 'Revert Close',
      onClick: () => handleRevertClose(soId),
    };

    if (status === BACKEND_ENUM?.DRAFT) {
      statusArr = [openItem, cancelItem];
    } else if (status === BACKEND_ENUM?.OPEN) {
      statusArr = [closedItem, draftItem, cancelItem];
    } else if (status === BACKEND_ENUM?.PARTIALLY_RECORDED) {
      statusArr = [closedItem, cancelItem];
    } else if (status === BACKEND_ENUM?.CLOSED) {
      statusArr = [revertCloseItem, cancelItem];
    } else if (status === BACKEND_ENUM?.CANCELLED) {
      statusArr = [draftItem, openItem];
    }

    return statusArr;
  };

  const dropDownItems = [...getConvertStatusValue(salesOrderData?.status)];

  if (loading) {
    return <DetailPageSkeleton />;
  }

  if (!salesOrder) {
    return <NoFoundPage docType={MODULE_NAMES?.SALES_ORDER} />;
  }

  const statusLabel = SALES_ORDER_STATUS?.[salesOrderData?.status] || salesOrderData?.status || '-';
  const blockedTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : PERMISSION_MESSAGES.NO_PERMISSION;
  const productionStatusAllowed = [BACKEND_ENUM.OPEN, BACKEND_ENUM.PARTIALLY_RECORDED].includes(salesOrderData?.status);

  const canMarkStatus = useModuleSalesOrder?.edit && !isViewOnly && !SALES_ORDER_STATUS_CHANGE_RESTRICTED_STATUS?.includes(salesOrderData?.status) && dropDownItems.length > 0;
  const canConvertDC = useModuleDeliveryChallan?.create && isDeliveryChallanInPlan && !isViewOnly && SALES_ORDER_CONVERSION_ALLOWED_STATUSES?.includes(salesOrderData?.status);
  const canConvertINV = useModuleInvoice?.create && !isViewOnly && SALES_ORDER_CONVERSION_ALLOWED_STATUSES?.includes(salesOrderData?.status);
  const canCreateProduction = isProductionInPlan && useAddProduction?.create && salesOrderData?.hasPendingProduction && productionStatusAllowed && !isViewOnly;
  const canDuplicate = useModuleSalesOrder?.create && !isViewOnly;
  const canEditOrder = useModuleSalesOrder?.edit && editStatus && !isViewOnly;
  const canDelete = useModuleSalesOrder?.delete && !isViewOnly;

  const markAsTooltip = canMarkStatus
    ? 'Mark Sales Order As'
    : !useModuleSalesOrder?.edit || isViewOnly
      ? blockedTooltip
      : `This document status cannot be changed in its current status - ${statusLabel}.`;
  const convertDCTooltip = canConvertDC
    ? 'Convert to Delivery Challan'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useModuleDeliveryChallan?.create
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : !isDeliveryChallanInPlan
          ? 'Delivery Challan is not included in your current subscription plan. Please upgrade to use this feature.'
          : `Cannot convert to Delivery Challan in its current status - ${statusLabel}.`;
  const convertINVTooltip = canConvertINV ? 'Convert to Invoice' : !useModuleInvoice?.create || isViewOnly ? blockedTooltip : `Cannot convert to Invoice in its current status - ${statusLabel}.`;
  const createProductionTooltip = canCreateProduction
    ? 'Create Production'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useAddProduction?.create
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : !isProductionInPlan
          ? 'Production is not included in your current subscription plan. Please upgrade to use this feature.'
          : !salesOrderData?.hasPendingProduction
            ? 'Production has already been created for the full quantity of this sales order.'
            : `Cannot create Production in its current status - ${statusLabel}.`;
  const duplicateTooltip = canDuplicate ? 'Duplicate Document' : blockedTooltip;
  const editTooltip = canEditOrder ? 'Edit Sales Order' : !useModuleSalesOrder?.edit || isViewOnly ? blockedTooltip : `This document cannot be edited in its current status - ${statusLabel}.`;
  const deleteTooltip = canDelete ? 'Delete Sales Order' : blockedTooltip;

  const customerData = {
    id: salesOrderData?.customerId?._id || salesOrderData?.customerId?.id,
    customerDisplayName: salesOrderData?.customerId?.customerDisplayName,
  };

  return (
    <>
      <StatusUpdateLoader loading={submitLoading} hidden={deleteModal.isOpen || cancelStatusModal.isOpen} text="Updating sales order status..." />
      <div className="bg-white border-b border-gray-100 px-4 py-2 -m-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <BackButton />
            <div className="flex flex-col">
              <h1 className="text-[18px] font-semibold text-gray-900">Sales Order Details</h1>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm font-medium text-gray-600">{salesOrderData?.orderId}</span>
                <span className="text-gray-400">•</span>
                <StatusBadge status={salesOrderData?.status} value={SALES_ORDER_STATUS?.[salesOrderData?.status]} />
                {salesOrderData?.rawMaterialStatus && (
                  <>
                    <span className="text-gray-400">•</span>
                    <StatusBadge status={salesOrderData.rawMaterialStatus} value={SALES_ORDER_MATERIAL_STATUS_LABELS[salesOrderData.rawMaterialStatus]} />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-3">
            <DocumentRefreshButton onRefresh={handleRefresh} />
            {salesOrderData?.customerId && (
              <Button type="default" size="middle" icon={<Icons.ExportOutlined className="mr-2" />} onClick={() => setViewCustomerDetail(true)} className="flex items-center">
                View Customer
              </Button>
            )}
            <PDFDownloadLink
              document={
                <ShowPDF
                  data={salesOrderData}
                  billingAddress={salesOrderData?.customerId?.address?.billing}
                  shippingAddress={salesOrderData?.shippingAddress}
                  profile={profile}
                  pageType={pageTypes.SALES_ORDER}
                />
              }
              fileName={generateSafeFileName(salesOrderData, 'orderId')}
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
                    {submitLoading ? <CustomLoader variant="button" text="Updating..." /> : 'Mark Sales Order As'}
                  </Button>
                </Dropdown>
              ) : (
                <Tooltip title={markAsTooltip} placement="left">
                  <span className="block w-full">
                    <Button type="primary" className="px-4 py-2 w-full" disabled block>
                      Mark Sales Order As
                    </Button>
                  </span>
                </Tooltip>
              )}
              <PermissionButton
                canAccess={useModuleDeliveryChallan?.create}
                isViewOnly={isViewOnly}
                disabled={!SALES_ORDER_CONVERSION_ALLOWED_STATUSES?.includes(salesOrderData?.status) || submitLoading || !isDeliveryChallanInPlan}
                tooltipTitle={convertDCTooltip}
                tooltipProps={{ placement: 'left' }}
                wrapperClassName="block w-full"
                type="primary"
                icon={<Icons.SwapOutlined />}
                className="px-4 py-2 w-full"
                block
                onClick={
                  canConvertDC
                    ? () => {
                        const clonedData = structuredClone(salesOrderData);
                        let updatedItems = [];
                        clonedData?.items?.forEach(x => {
                          if (salesOrderData?.status === BACKEND_ENUM?.PARTIALLY_RECORDED) {
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
                                referenceType: 'SalesOrder',
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
                              referenceType: 'SalesOrder',
                              taxAmount: taxAmount ? toDecimalString(parseFloat(taxAmount)) : 0,
                              amount: amount ? toDecimalString(parseFloat(amount)) : 0,
                            });
                          }
                        });
                        clonedData.items = updatedItems;
                        handleConvertSalesOrder(clonedData, 'deliveryChallan');
                      }
                    : undefined
                }
              >
                {submitLoading ? <CustomLoader variant="button" text="Converting..." /> : 'Convert To Delivery Challan'}
              </PermissionButton>
              <PermissionButton
                canAccess={useModuleInvoice?.create}
                isViewOnly={isViewOnly}
                disabled={!SALES_ORDER_CONVERSION_ALLOWED_STATUSES?.includes(salesOrderData?.status) || submitLoading}
                tooltipTitle={convertINVTooltip}
                tooltipProps={{ placement: 'left' }}
                wrapperClassName="block w-full"
                type="primary"
                icon={<Icons.SwapOutlined />}
                className="px-4 py-2 w-full"
                block
                onClick={
                  canConvertINV
                    ? () => {
                        const clonedData = structuredClone(salesOrderData);
                        let updatedItems = [];
                        clonedData?.items?.forEach(x => {
                          if (salesOrderData?.status === BACKEND_ENUM?.PARTIALLY_RECORDED) {
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
                                referenceType: 'SalesOrder',
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
                              referenceType: 'SalesOrder',
                              taxAmount: taxAmount ? toDecimalString(parseFloat(taxAmount)) : 0,
                              amount: amount ? toDecimalString(parseFloat(amount)) : 0,
                            });
                          }
                        });
                        clonedData.items = updatedItems;
                        handleConvertSalesOrder(clonedData, 'invoice');
                      }
                    : undefined
                }
              >
                {submitLoading ? <CustomLoader variant="button" text="Converting..." /> : 'Convert To Invoice'}
              </PermissionButton>

              <PermissionButton
                canAccess={useAddProduction?.create}
                isViewOnly={isViewOnly}
                disabled={!isProductionInPlan || !salesOrderData?.hasPendingProduction || submitLoading || !productionStatusAllowed}
                tooltipTitle={createProductionTooltip}
                tooltipProps={{ placement: 'left' }}
                wrapperClassName="block w-full"
                type="primary"
                className="px-4 py-2 w-full"
                block
                onClick={canCreateProduction ? () => setOpenCreateProductionModal(true) : undefined}
              >
                Create Production
              </PermissionButton>

              <PermissionButton
                canAccess={useModuleSalesOrder?.create}
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
                canAccess={useModuleSalesOrder?.edit}
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
                canAccess={useModuleSalesOrder?.delete}
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

            <DocumentMetadata data={salesOrderData} showCreatedFrom={true} showPriorityTag={true} />

            <InventoryImpact data={salesOrderData} pageType={pageTypes?.SALES_ORDER} />

            <ConversionBadges
              convertedTo={salesOrderData?.convertedTo}
              convertedFrom={
                salesOrderData?.quoteId
                  ? [salesOrderData.quoteId]
                  : salesOrderData?.customerOrderId
                    ? [salesOrderData.customerOrderId]
                    : salesOrderData?.rejectionOrderDetails?.rejectionOrderRef
                      ? [salesOrderData.rejectionOrderDetails]
                      : []
              }
              onConvertedToClick={() => setShowConvertToModal(true)}
              onConvertedFromClick={() => setShowConvertFromModal(true)}
              convertedFromLabel={
                salesOrderData?.quoteId
                  ? 'Converted From Quote'
                  : salesOrderData?.customerOrderId
                    ? salesOrderData.customerOrderId?.sampleCatalogId
                      ? 'Converted From Sample Order'
                      : 'Converted From Customer Order'
                    : salesOrderData?.rejectionOrderDetails?.rejectionOrderRef
                      ? 'Converted From Rejection Order'
                      : ''
              }
            />

            <OrganizationInfo data={salesOrderData} />
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
            convertToData={salesOrderData?.convertedTo || []}
            data={salesOrderData}
          />
        </div>
      )}
      {showConvertFromModal && (
        <div className="fixed">
          <ConvertFromDetail
            open={showConvertFromModal}
            onClose={() => setShowConvertFromModal(false)}
            convertFromData={salesOrderData?.quoteId || salesOrderData?.customerOrderId || salesOrderData?.rejectionOrderDetails || {}}
            type={salesOrderData?.quoteId ? 'QUOTE' : salesOrderData?.customerOrderId ? 'CUSTOMER_ORDER' : salesOrderData?.rejectionOrderDetails?.rejectionOrderRef ? 'REJECTION_ORDER' : 'QUOTE'}
            data={salesOrderData}
          />
        </div>
      )}
      <DocumentConfirmModal modal={deleteModal} docType={MODULE_NAMES?.SALES_ORDER} onConfirm={deleteSalesOrder} loading={deleteLoading} getDocumentDetails={getSalesOrderDocumentDetails} />
      <DocumentConfirmModal
        modal={cancelStatusModal}
        docType={MODULE_NAMES?.SALES_ORDER}
        loading={submitLoading}
        mode="status"
        onConfirm={confirmCancelStatus}
        getDocumentDetails={getSalesOrderDocumentDetails}
      />
      {viewCustomerDetail && <CustomerDrawerDetails viewCustomerDetail={viewCustomerDetail} setViewCustomerDetail={setViewCustomerDetail} customerData={customerData} />}
      {openCreateProductionModal && salesOrderData && (
        <CreateProductionFromSalesOrderModal
          open={openCreateProductionModal}
          record={salesOrderData}
          onClose={() => setOpenCreateProductionModal(false)}
          onSuccess={() => {
            getSalesOrderById({ orderId: salesOrderData?.id || salesOrderData?._id || salesId });
          }}
        />
      )}
    </>
  );
};

export default SalesOrderDetail;
