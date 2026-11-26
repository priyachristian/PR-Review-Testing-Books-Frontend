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
import DetailPageSkeleton from '@/components/feedback/pageLoader/DetailPageSkeleton';
import ConvertToDetail from '@/components/feedback/formModal/ConvertToDetail';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import CustomerDrawerDetails from '@/features/sales/customer/components/CustomerDrawerDetails';
import { DocumentConfirmModal } from '@/components/feedback/confirmModal/CancelOrDeleteDocumentModal';
import { ActionButtons, ConversionBadges, DocumentMetadata, InventoryImpact, OrganizationInfo } from '@/components/ui';
import { CommentHistory } from '@/features/common/comment';
import { ShowPDF } from '@/components/ui/common/ShowPDFLazy';
import NoFoundPage from '@/components/ui/common/NoFoundPage';
import RejectionReasonModal from '../components/RejectionReasonModal';
import SalesModuleDetailView from '@/components/dataDisplay/statCard/SalesModuleDetailView';
import SalesModuleTreeView from '@/components/dataDisplay/statCard/SalesModuleTreeView';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import StatusUpdateLoader from '@/components/feedback/pageLoader/StatusUpdateLoader';

// Hooks
import { useConvert } from 'hooks/useConvert';
import { useConfirmModal } from '@/hooks/useConfirmModal';
import { useProfile } from '@/features/setting/profile/useProfile';
import useModulePermissions from 'hooks/useModulePermissions';
import { useQuotationConfig } from '@/features/setting/quotationConfig/useQuotationConfig';

// Extras
import { getQuoteDocumentDetails, useQuotes } from '@/features/sales/quotes';
import Icons from 'assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { generateSafeFileName } from '@/utils/pdfname';
import {
  BACKEND_ENUM,
  MODULE_NAMES,
  pageTypes,
  PERMISSION_MESSAGES,
  QUOTE_CONVERSION_ALLOWED_STATUSES,
  QUOTE_EDIT_RESTRICTED_STATUS,
  QUOTE_STATUS,
  QUOTE_STATUS_CHANGE_RESTRICTED_STATUS,
} from 'utils/constants';

dayjs.extend(utc);

const QuoteDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { quoteId } = useParams();

  const [activeKey, setActiveKey] = useState('1');
  const { quote, loading, submitLoading, deleteLoading, resetQuote, getQuoteById, updateStatus, removeQuote } = useQuotes();
  const quoteData = quote;
  const { useModuleQuotes, useModuleSalesOrder, useModuleInvoice, isViewOnly } = useModulePermissions(RESOURCES.QUOTES);
  const { profile, getProfile } = useProfile();
  const { handleConvertQuote } = useConvert();
  const [showConvertToModal, setShowConvertToModal] = useState(false);
  const deleteModal = useConfirmModal();
  const cancelStatusModal = useConfirmModal();
  const [viewCustomerDetail, setViewCustomerDetail] = useState(false);
  const [rejectionModal, setRejectionModal] = useState(false);
  const { quoteCloseReasons, loading: quoteCloseReasonsLoading, getQuotationConfig, resetQuotationConfig } = useQuotationConfig();

  const updateQuoteStatus = async newStatus => {
    if (newStatus === BACKEND_ENUM?.CANCELLED) {
      cancelStatusModal.open(quoteData);
      return;
    }
    await handleUpdateStatus(quoteData?.id || quoteData?._id, newStatus);
  };

  const confirmCancelStatus = async () => {
    await handleUpdateStatus(quoteData?.id || quoteData?._id, BACKEND_ENUM?.CANCELLED);
    cancelStatusModal.close();
  };

  useEffect(() => {
    const controller = new AbortController();
    getProfile({ signal: controller.signal });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    if (quoteId) {
      getQuoteById({ quoteId, signal: controller.signal });
    }
    return () => {
      controller.abort();
      resetQuote();
    };
  }, [quoteId]);

  const handleEditClick = () => {
    navigate(`/quotes/${quoteData._id}/edit`, {
      state: {
        quoteData: quoteData,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleDuplicateClick = () => {
    navigate('/quotes/new', {
      state: {
        duplicateFromId: quoteData?.id || quoteData?._id,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleDeleteClick = () => {
    deleteModal.open(quoteData);
  };

  const deleteQuote = async () => {
    await removeQuote({ quoteId: quoteData?.id || quoteData?._id });
    deleteModal.close();
    navigate('/quotes');
  };

  const items = [
    {
      key: '1',
      label: 'Basic Info',
      children: <SalesModuleDetailView data={quoteData} profile={profile} pageType={pageTypes?.QUOTE} />,
    },
    {
      key: '2',
      label: 'Document Flow',
      children: <SalesModuleTreeView moduleTree={quoteData?.moduleTree} sourceModule="quote" currency={quoteData?.currency} />,
    },
    ...(quoteData?.attachments?.length > 0
      ? [
          {
            key: '3',
            label: 'Attachments',
            children: <AttachMentDetails data={quoteData} />,
          },
        ]
      : []),
    {
      key: '4',
      label: 'History',
      children: <CommentHistory moduleName={MODULE_NAMES.QUOTATION} referenceId={quoteId} commentHistory={quoteData?.commentHistory} canAddComment={useModuleQuotes?.edit} isViewOnly={isViewOnly} />,
    },
  ];

  const handlePrint = async () => {
    const blob = await renderPdfToBlob(
      <ShowPDF data={quoteData} billingAddress={quoteData?.customerId?.address?.billing} shippingAddress={quoteData?.shippingAddress} profile={profile} pageType={pageTypes.QUOTE} />
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

  const handleUpdateStatus = async (quoteId, status, rejectionReason) => {
    await updateStatus({ quoteId, status, rejectionReason });
    getQuoteById({ quoteId });
  };

  const handleRefresh = async () => {
    await getQuoteById({ quoteId });
  };

  const openRejectModal = () => {
    setRejectionModal(true);
    resetQuotationConfig();
    getQuotationConfig({});
  };

  const handleRejectQuote = async rejectionReason => {
    await handleUpdateStatus(quoteData?.id || quoteData?._id, BACKEND_ENUM?.REJECTED, rejectionReason);
    setRejectionModal(false);
    resetQuotationConfig();
  };

  let editStatus = !QUOTE_EDIT_RESTRICTED_STATUS?.includes(quoteData?.status);

  const getConvertStatusValue = status => {
    let statusArr = [];

    const quoteId = quoteData?.id || quoteData?._id;
    const markAs = (backendStatus, labelStatus) => ({
      key: `markAs${labelStatus}`,
      label: `Mark As ${labelStatus}`,
      onClick: () => handleUpdateStatus(quoteId, backendStatus),
    });
    const draftItem = markAs(BACKEND_ENUM?.DRAFT, QUOTE_STATUS?.DRAFT);
    const sentItem = markAs(BACKEND_ENUM?.SENT, QUOTE_STATUS?.SENT);
    const cancelItem = {
      key: `markAs${QUOTE_STATUS?.CANCELLED}`,
      label: `Mark As ${QUOTE_STATUS?.CANCELLED}`,
      onClick: () => updateQuoteStatus(BACKEND_ENUM?.CANCELLED),
    };

    if (status === BACKEND_ENUM?.DRAFT) {
      statusArr = [sentItem, cancelItem];
    } else if (status === BACKEND_ENUM?.SENT) {
      statusArr = [
        markAs(BACKEND_ENUM?.ACCEPTED, QUOTE_STATUS?.ACCEPTED),
        {
          key: `markAs${QUOTE_STATUS?.REJECTED}`,
          label: `Mark As ${QUOTE_STATUS?.REJECTED}`,
          onClick: () => openRejectModal(),
        },
        draftItem,
        cancelItem,
      ];
    } else if (status === BACKEND_ENUM?.ACCEPTED) {
      statusArr = [markAs(BACKEND_ENUM?.COMPLETED, QUOTE_STATUS?.COMPLETED), sentItem, draftItem, cancelItem];
    } else if (status === BACKEND_ENUM?.REJECTED) {
      statusArr = [draftItem, cancelItem];
    } else if (status === BACKEND_ENUM?.CANCELLED) {
      statusArr = [draftItem, sentItem];
    } else {
      statusArr = [cancelItem];
    }

    return statusArr;
  };

  const dropDownItems = [...getConvertStatusValue(quoteData?.status)];
  const statusLabel = QUOTE_STATUS?.[quoteData?.status] || quoteData?.status || '-';
  const blockedTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : PERMISSION_MESSAGES.NO_PERMISSION;
  const canMarkStatus = useModuleQuotes?.edit && !isViewOnly && !QUOTE_STATUS_CHANGE_RESTRICTED_STATUS?.includes(quoteData?.status) && dropDownItems.length > 0;
  const canConvertSO = useModuleSalesOrder?.create && !isViewOnly && QUOTE_CONVERSION_ALLOWED_STATUSES?.includes(quoteData?.status);
  const canConvertINV = useModuleInvoice?.create && !isViewOnly && QUOTE_CONVERSION_ALLOWED_STATUSES?.includes(quoteData?.status);
  const canDuplicate = useModuleQuotes?.create && !isViewOnly;
  const canEditQuote = useModuleQuotes?.edit && editStatus && !isViewOnly;
  const canDelete = useModuleQuotes?.delete && !isViewOnly;
  const markAsTooltip = canMarkStatus ? 'Mark Quotation As' : !useModuleQuotes?.edit || isViewOnly ? blockedTooltip : `This document status cannot be changed in its current status - ${statusLabel}.`;
  const convertSOTooltip = canConvertSO ? 'Convert to Sales Order' : !useModuleSalesOrder?.create || isViewOnly ? blockedTooltip : `Cannot convert to Sales Order its current status - ${statusLabel}.`;
  const convertINVTooltip = canConvertINV ? 'Convert to Invoice' : !useModuleInvoice?.create || isViewOnly ? blockedTooltip : `Cannot convert to Invoice its current status - ${statusLabel}.`;
  const duplicateTooltip = canDuplicate ? 'Duplicate Document' : blockedTooltip;
  const editTooltip = canEditQuote ? 'Edit Quote' : !useModuleQuotes?.edit || isViewOnly ? blockedTooltip : `This document cannot be edited in its current status - ${statusLabel}.`;
  const deleteTooltip = canDelete ? 'Delete Quote' : blockedTooltip;

  if (loading) {
    return <DetailPageSkeleton />;
  }

  if (!quote) {
    return <NoFoundPage docType={MODULE_NAMES?.QUOTATION} />;
  }

  const customerData = {
    id: quoteData?.customerId?._id,
    customerDisplayName: quoteData?.customerId?.customerDisplayName,
  };

  return (
    <>
      <StatusUpdateLoader loading={submitLoading} hidden={deleteModal.isOpen || cancelStatusModal.isOpen} text="Updating quotation status..." />
      <div className="bg-white border-b border-gray-100 px-4 py-2 -m-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <BackButton />
            <div className="flex flex-col">
              <h1 className="text-[18px] font-semibold text-gray-900">Quotation Details</h1>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm font-medium text-gray-600">{quoteData?.quoteId}</span>
                <span className="text-gray-400">•</span>
                <StatusBadge status={quoteData?.status} value={QUOTE_STATUS?.[quoteData?.status]} />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center space-x-3">
            <DocumentRefreshButton onRefresh={handleRefresh} />
            {quoteData?.customerId && (
              <Button type="default" size="middle" icon={<Icons.ExportOutlined className="mr-2" />} onClick={() => setViewCustomerDetail(true)} className="flex items-center">
                View Customer
              </Button>
            )}
            <PDFDownloadLink
              document={<ShowPDF data={quoteData} billingAddress={quoteData?.customerId?.address?.billing} shippingAddress={quoteData?.shippingAddress} profile={profile} pageType={pageTypes.QUOTE} />}
              fileName={generateSafeFileName(quoteData, 'quoteId')}
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
                    {submitLoading ? <CustomLoader variant="button" text="Updating..." /> : 'Mark Quotation As'}
                  </Button>
                </Dropdown>
              ) : (
                <Tooltip title={markAsTooltip} placement="left">
                  <span className="block w-full">
                    <Button type="primary" className="px-4 py-2 w-full" disabled block>
                      Mark Quotation As
                    </Button>
                  </span>
                </Tooltip>
              )}
              {/* Convert to Sales Order */}
              <PermissionButton
                canAccess={useModuleSalesOrder?.create}
                isViewOnly={isViewOnly}
                disabled={!QUOTE_CONVERSION_ALLOWED_STATUSES?.includes(quoteData?.status) || submitLoading}
                tooltipTitle={convertSOTooltip}
                tooltipProps={{ placement: 'left' }}
                wrapperClassName="block w-full"
                type="primary"
                icon={<Icons.SwapOutlined />}
                className="px-4 py-2 w-full"
                block
                onClick={canConvertSO ? () => handleConvertQuote(quoteData, 'salesOrder') : undefined}
              >
                {submitLoading ? <CustomLoader variant="button" text="Converting..." /> : 'Convert To Sales Order'}
              </PermissionButton>
              {/* Convert to Invoice */}
              <PermissionButton
                canAccess={useModuleInvoice?.create}
                isViewOnly={isViewOnly}
                disabled={!QUOTE_CONVERSION_ALLOWED_STATUSES?.includes(quoteData?.status) || submitLoading}
                tooltipTitle={convertINVTooltip}
                tooltipProps={{ placement: 'left' }}
                wrapperClassName="block w-full"
                type="primary"
                icon={<Icons.SwapOutlined />}
                className="px-4 py-2 w-full"
                block
                onClick={canConvertINV ? () => handleConvertQuote(quoteData, 'invoice') : undefined}
              >
                {submitLoading ? <CustomLoader variant="button" text="Converting..." /> : 'Convert To Invoice'}
              </PermissionButton>
              {/* Duplicate Document */}
              <PermissionButton
                canAccess={useModuleQuotes?.create}
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
              {/* Edit Quote */}
              <PermissionButton
                canAccess={useModuleQuotes?.edit}
                isViewOnly={isViewOnly}
                disabled={!editStatus || submitLoading}
                tooltipTitle={editTooltip}
                tooltipProps={{ placement: 'left' }}
                wrapperClassName="block w-full"
                type="default"
                icon={<Icons.EditOutlined />}
                className="px-4 py-2 w-full"
                block
                onClick={canEditQuote ? handleEditClick : undefined}
              >
                {submitLoading ? <CustomLoader variant="button" text="Loading..." /> : 'Edit'}
              </PermissionButton>
              {/* Delete Quote */}
              <PermissionButton
                canAccess={useModuleQuotes?.delete}
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
            <DocumentMetadata data={quoteData} showCreatedFrom={true} />

            <InventoryImpact data={quoteData} pageType={pageTypes?.QUOTE} />

            <ConversionBadges convertedTo={quoteData?.convertedTo} onConvertedToClick={() => setShowConvertToModal(true)} />

            <OrganizationInfo data={quoteData} />
          </div>
        </div>
        {showConvertToModal && (
          <div className="fixed">
            <ConvertToDetail
              convertToData={quoteData?.convertedTo || []}
              open={showConvertToModal}
              onClose={() => {
                setShowConvertToModal(false);
              }}
              data={quoteData}
            />
          </div>
        )}
      </div>
      <RejectionReasonModal
        open={rejectionModal}
        idValue={quoteData?.quoteId}
        status={BACKEND_ENUM?.REJECTED}
        statusLabelMap={QUOTE_STATUS}
        idLabel="SQ No"
        onCancel={() => {
          setRejectionModal(false);
          resetQuotationConfig();
        }}
        onSubmit={handleRejectQuote}
        reasons={quoteCloseReasons}
        loading={submitLoading || quoteCloseReasonsLoading}
      />
      <DocumentConfirmModal modal={deleteModal} docType={MODULE_NAMES?.QUOTATION} onConfirm={deleteQuote} loading={deleteLoading} getDocumentDetails={getQuoteDocumentDetails} />
      <DocumentConfirmModal
        modal={cancelStatusModal}
        docType={MODULE_NAMES?.QUOTATION}
        loading={submitLoading}
        mode="status"
        onConfirm={confirmCancelStatus}
        getDocumentDetails={getQuoteDocumentDetails}
      />
      {viewCustomerDetail && <CustomerDrawerDetails viewCustomerDetail={viewCustomerDetail} setViewCustomerDetail={setViewCustomerDetail} customerData={customerData} />}
    </>
  );
};

export default QuoteDetail;
