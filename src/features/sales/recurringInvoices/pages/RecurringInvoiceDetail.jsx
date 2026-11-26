import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';

// Components
import { Button, Dropdown, Tabs, Tag, Tooltip } from '@/components/AntDComponent';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';
import DocumentRefreshButton from '@/components/ui/button/DocumentRefreshButton';
import BackButton from '@/components/ui/button/BackButton';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import StatusUpdateLoader from '@/components/feedback/pageLoader/StatusUpdateLoader';
import { DocumentConfirmModal } from '@/components/feedback/confirmModal/CancelOrDeleteDocumentModal';
import NoFoundPage from '@/components/ui/common/NoFoundPage';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import { ActionButtons, DetailField, DocumentMetadata, OrganizationInfo } from '@/components/ui';
import AttachMentDetails from '@/components/feedback/formModal/AttachMentDetails';
import SalesModuleDetailView from '@/components/dataDisplay/statCard/SalesModuleDetailView';
import CustomerDrawerDetails from '@/features/sales/customer/components/CustomerDrawerDetails';
import RecurringInvoiceDetailSkeleton from '../components/RecurringInvoiceDetailSkeleton';
import { CommentHistory } from '@/features/common/comment';
import RecurringInvoiceExecutionHistory from '../components/RecurringInvoiceExecutionHistory';

// Hooks
import { useConfirmModal } from '@/hooks/useConfirmModal';
import useModulePermissions from 'hooks/useModulePermissions';
import { useProfile } from '@/features/setting/profile/useProfile';

// Extras
import { getRecurringInvoiceDocumentDetails, useRecurringInvoice, itemTableColumn } from '@/features/sales/recurringInvoices';
import { formatAmount } from '@/utils/currency';
import Icons from '@/assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { BACKEND_ENUM, MODULE_NAMES, pageTypes, PERMISSION_MESSAGES, RECURRING_INVOICE_STATUS, RECURRING_INVOICE_STATUS_CHANGE_RESTRICTED_STATUS } from 'utils/constants';
import { buildTaxContext, isIGSTExists } from 'utils/services';
import { PDFDownloadLink } from '@/components/ui/common/PdfDownloadLinkLazy';
import { renderPdfToBlob } from '@/utils/loadReactPdf';
import { ShowPDF } from '@/components/ui/common/ShowPDFLazy';
import { generateSafeFileName } from '@/utils/pdfname';

const RecurringInvoiceDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { recurringId } = useParams();
  const [activeKey, setActiveKey] = useState('1');
  const [viewCustomerDetail, setViewCustomerDetail] = useState(false);
  const cancelStatusModal = useConfirmModal();
  const deleteModal = useConfirmModal();
  const { loading, recurringInvoice, submitLoading, deleteLoading, getRecurringInvoicesById, resetRecurringInvoice, updateStatus, removeRecurringInvoice } = useRecurringInvoice();
  const { useModuleRecurringInvoice, isViewOnly } = useModulePermissions(RESOURCES.RECURRING_INVOICE);
  const { profile, getProfile } = useProfile();

  useEffect(() => {
    const controller = new AbortController();
    getProfile({ signal: controller.signal });
    return () => controller.abort();
  }, [getProfile]);

  useEffect(() => {
    const controller = new AbortController();
    if (recurringId) {
      getRecurringInvoicesById({ recurringId, signal: controller.signal });
    } else {
      resetRecurringInvoice();
    }
    return () => {
      controller.abort();
      resetRecurringInvoice();
    };
  }, [recurringId, getRecurringInvoicesById, resetRecurringInvoice]);

  const handleRefresh = async () => {
    await getRecurringInvoicesById({ recurringId });
  };

  const handleEditClick = () => {
    navigate(`/recurring-invoices/${recurringInvoice._id}/edit`, {
      state: {
        recurringInvoiceData: recurringInvoice,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleUpdateStatus = async status => {
    const recurringInvoiceId = recurringInvoice?.id || recurringInvoice?._id;
    await updateStatus({ recurringId: recurringInvoiceId, status });
    await getRecurringInvoicesById({ recurringId });
  };

  const updateRecurringInvoiceStatus = async newStatus => {
    if (newStatus === BACKEND_ENUM.CANCELLED) {
      cancelStatusModal.open(recurringInvoice);
      return;
    }
    await handleUpdateStatus(newStatus);
  };

  const confirmCancelStatus = async () => {
    await handleUpdateStatus(BACKEND_ENUM.CANCELLED);
    cancelStatusModal.close();
  };

  const handleDeleteClick = () => {
    deleteModal.open(recurringInvoice);
  };

  const deleteRecurringInvoice = async () => {
    const recurringInvoiceId = recurringInvoice?.id || recurringInvoice?._id;
    await removeRecurringInvoice({ recurringId: recurringInvoiceId });
    deleteModal.close();
    navigate('/recurring-invoices');
  };

  const getStatusActionItems = status => {
    let statusArr = [];

    if (status === BACKEND_ENUM?.DRAFT) {
      statusArr = [
        {
          key: `markAs${RECURRING_INVOICE_STATUS.ACTIVE}`,
          label: `Mark As ${RECURRING_INVOICE_STATUS.ACTIVE}`,
          onClick: () => updateRecurringInvoiceStatus(BACKEND_ENUM.ACTIVE),
        },
        {
          key: `markAs${RECURRING_INVOICE_STATUS.CANCELLED}`,
          label: `Mark As ${RECURRING_INVOICE_STATUS.CANCELLED}`,
          onClick: () => updateRecurringInvoiceStatus(BACKEND_ENUM.CANCELLED),
        },
      ];
    } else if (status === BACKEND_ENUM?.ACTIVE) {
      statusArr = [
        {
          key: `markAs${RECURRING_INVOICE_STATUS.PAUSED}`,
          label: `Mark As ${RECURRING_INVOICE_STATUS.PAUSED}`,
          onClick: () => updateRecurringInvoiceStatus(BACKEND_ENUM.PAUSED),
        },
        {
          key: `markAs${RECURRING_INVOICE_STATUS.CANCELLED}`,
          label: `Mark As ${RECURRING_INVOICE_STATUS.CANCELLED}`,
          onClick: () => updateRecurringInvoiceStatus(BACKEND_ENUM.CANCELLED),
        },
      ];
    } else if (status === BACKEND_ENUM?.PAUSED) {
      statusArr = [
        {
          key: `markAs${RECURRING_INVOICE_STATUS.ACTIVE}`,
          label: `Mark As ${RECURRING_INVOICE_STATUS.ACTIVE}`,
          onClick: () => updateRecurringInvoiceStatus(BACKEND_ENUM.ACTIVE),
        },
        {
          key: `markAs${RECURRING_INVOICE_STATUS.CANCELLED}`,
          label: `Mark As ${RECURRING_INVOICE_STATUS.CANCELLED}`,
          onClick: () => updateRecurringInvoiceStatus(BACKEND_ENUM.CANCELLED),
        },
      ];
    } else if (!RECURRING_INVOICE_STATUS_CHANGE_RESTRICTED_STATUS?.includes(status)) {
      statusArr = [
        {
          key: `markAs${RECURRING_INVOICE_STATUS.CANCELLED}`,
          label: `Mark As ${RECURRING_INVOICE_STATUS.CANCELLED}`,
          onClick: () => updateRecurringInvoiceStatus(BACKEND_ENUM.CANCELLED),
        },
      ];
    }

    return statusArr;
  };

  const basicInfoContent = (
    <div className="space-y-10">
      <div className="my-container container-spacing">
        <div className="flex justify-between items-center mb-3">
          <p className="font-bold text-lg">General Information</p>
        </div>

        <div className="mt-2 space-y-3">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
            <DetailField label="Recurring Invoice No">{recurringInvoice?.recurringInvoiceId ? <Tag className="font-semibold">{recurringInvoice.recurringInvoiceId}</Tag> : '-'}</DetailField>
            <DetailField label="Profile Name" value={recurringInvoice?.profileName} truncate={false} valueClassName="break-words" />
            <DetailField label="Customer Name" value={recurringInvoice?.customerId?.customerDisplayName} truncate={false} valueClassName="break-words" />
            <DetailField label="Reference Number" value={recurringInvoice?.referenceNumber} />
            <DetailField label="Start Date" value={recurringInvoice?.startDate ? dayjs(recurringInvoice.startDate).format('DD MMM YYYY') : undefined} />
            <DetailField label="End Date" value={recurringInvoice?.neverExpires ? 'Never Expires' : recurringInvoice?.endDate ? dayjs(recurringInvoice.endDate).format('DD MMM YYYY') : undefined} />
            <DetailField
              label="Repeat Every"
              value={recurringInvoice?.repeatEvery?.frequency && recurringInvoice?.repeatEvery?.period ? `${recurringInvoice.repeatEvery.frequency} ${recurringInvoice.repeatEvery.period}` : undefined}
            />
            <DetailField label="Payment Terms" value={recurringInvoice?.paymentTermsId?.name} />
            <DetailField label="Next Execution Date" value={recurringInvoice?.nextExecutionDate ? dayjs(recurringInvoice.nextExecutionDate).format('DD MMM YYYY') : undefined} />
            <DetailField label="Subject" value={recurringInvoice?.subject} />
          </div>
        </div>
      </div>

      <div className="my-container container-spacing">
        <p className="font-bold text-lg">Item Details</p>
        <div className="mt-4">
          <CustomTable
            columns={itemTableColumn(recurringInvoice?.currency, recurringInvoice?.items || [])}
            data={recurringInvoice?.items || []}
            pagination={false}
            scroll={{ x: 'max-content' }}
            dynamicScrollY={false}
          />
        </div>

        <div className="flex justify-end mt-6">
          <div className="w-full md:w-1/3 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Sub Total</span>
              <span className="font-medium">{formatAmount(recurringInvoice?.subTotal || 0, false, recurringInvoice?.currency)}</span>
            </div>
            {parseFloat(recurringInvoice?.discountConfig?.discountValue || 0) > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Discount</span>
                <span className="font-medium">
                  {recurringInvoice?.discountConfig?.discountType === 'PERCENTAGE'
                    ? `${recurringInvoice?.discountConfig?.discountValue}%`
                    : formatAmount(recurringInvoice?.discountConfig?.discountValue || 0, false, recurringInvoice?.currency)}
                </span>
              </div>
            )}
            {isIGSTExists(buildTaxContext(profile, recurringInvoice?.customerId, recurringInvoice?.shippingAddress?.state)) ? (
              <div className="flex justify-between">
                <span className="text-gray-600">IGST</span>
                <span className="font-medium">{formatAmount(recurringInvoice?.igst || 0, false, recurringInvoice?.currency)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">CGST</span>
                  <span className="font-medium">{formatAmount(recurringInvoice?.cgst || 0, false, recurringInvoice?.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">SGST</span>
                  <span className="font-medium">{formatAmount(recurringInvoice?.sgst || 0, false, recurringInvoice?.currency)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Total Tax</span>
              <span className="font-medium">{formatAmount(recurringInvoice?.totalTax || 0, false, recurringInvoice?.currency)}</span>
            </div>
            {recurringInvoice?.isRoundOff && (
              <div className="flex justify-between">
                <span className="text-gray-600">Round Off</span>
                <span className="font-medium">{formatAmount(recurringInvoice?.roundOffAmount || 0, false, recurringInvoice?.currency)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-3">
              <span className="text-gray-800 font-bold">Total</span>
              <span className="font-bold">{formatAmount(recurringInvoice?.total || 0, true, recurringInvoice?.currency)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="my-container container-spacing">
        <p className="font-bold text-lg mb-3">Terms & Notes</p>
        <div className="grid md:grid-cols-2 gap-6">
          <DetailField label="Customer Notes">
            <div className="p-3 bg-gray-50 rounded-md whitespace-pre-wrap">{recurringInvoice?.customerNotes || '-'}</div>
          </DetailField>
          <DetailField label="Terms & Conditions">
            <div className="p-3 bg-gray-50 rounded-md whitespace-pre-wrap">{recurringInvoice?.termsAndConditions || '-'}</div>
          </DetailField>
        </div>
      </div>
    </div>
  );

  const handlePrint = async () => {
    const blob = await renderPdfToBlob(
      <ShowPDF
        data={recurringInvoice}
        billingAddress={recurringInvoice?.customerId?.address?.billing}
        shippingAddress={recurringInvoice?.shippingAddress}
        profile={profile}
        pageType={pageTypes.RECURRING_INVOICE}
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
      setTimeout(() => {
        document.body.removeChild(iframe);
        URL.revokeObjectURL(blobUrl);
      }, 1000);
    };
  };

  if (loading) {
    return <RecurringInvoiceDetailSkeleton />;
  }

  if (!recurringInvoice && !loading) {
    return <NoFoundPage docType={MODULE_NAMES?.RECURRING_INVOICE} />;
  }

  const customerData = {
    id: recurringInvoice?.customerId?._id || recurringInvoice?.customerId?.id,
    customerDisplayName: recurringInvoice?.customerId?.customerDisplayName,
  };

  const isDraftStatus = recurringInvoice?.status === BACKEND_ENUM.DRAFT;
  const dropDownItems = [...getStatusActionItems(recurringInvoice?.status)];
  const statusLabel = RECURRING_INVOICE_STATUS?.[recurringInvoice?.status] || recurringInvoice?.status || '-';
  const canOpenMore = useModuleRecurringInvoice?.edit && !isViewOnly;
  const canEdit = canOpenMore && isDraftStatus;
  const canDelete = useModuleRecurringInvoice?.delete && !isViewOnly && isDraftStatus;
  const canMarkStatus = canOpenMore && !RECURRING_INVOICE_STATUS_CHANGE_RESTRICTED_STATUS?.includes(recurringInvoice?.status) && dropDownItems.length > 0;
  const markAsTooltip = canMarkStatus
    ? 'Mark Recurring Invoice As'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useModuleRecurringInvoice?.edit
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : `This document status cannot be changed in its current status - ${statusLabel}.`;
  const editTooltip = canEdit
    ? 'Edit Recurring Invoice'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useModuleRecurringInvoice?.edit
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : `This document cannot be edited in its current status - ${statusLabel}.`;
  const deleteTooltip = canDelete
    ? 'Delete Recurring Invoice'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useModuleRecurringInvoice?.delete
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : `This document cannot be deleted in its current status - ${statusLabel}.`;

  const items = [
    {
      key: '1',
      label: 'Basic Info',
      children: basicInfoContent,
    },
    {
      key: '2',
      label: 'Next Invoice',
      children: <SalesModuleDetailView data={recurringInvoice} profile={profile} pageType={pageTypes?.RECURRING_INVOICE} />,
    },
    ...(recurringInvoice?.attachments?.length > 0
      ? [
          {
            key: '3',
            label: 'Attachments',
            children: <AttachMentDetails data={recurringInvoice} />,
          },
        ]
      : []),
    {
      key: '4',
      label: 'History',
      children: (
        <CommentHistory
          moduleName={MODULE_NAMES.RECURRING_INVOICE}
          referenceId={recurringId}
          commentHistory={recurringInvoice?.commentHistory}
          canAddComment={useModuleRecurringInvoice?.edit}
          isViewOnly={isViewOnly}
        />
      ),
    },
    {
      key: '5',
      label: 'Recurring Activities',
      children: <RecurringInvoiceExecutionHistory history={recurringInvoice?.history || []} currency={recurringInvoice?.currency} />,
    },
  ];

  return (
    <>
      <StatusUpdateLoader loading={submitLoading} hidden={deleteModal.isOpen || cancelStatusModal.isOpen} text="Updating recurring invoice status..." />
      <div className="bg-white border-b border-gray-100 px-4 py-2 -m-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <BackButton />
            <div className="flex flex-col">
              <h1 className="text-[18px] font-semibold text-gray-900">Recurring Invoice Details</h1>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm font-medium text-gray-600">{recurringInvoice?.recurringInvoiceId}</span>
                <span className="text-gray-400">•</span>
                <StatusBadge status={recurringInvoice?.status} value={RECURRING_INVOICE_STATUS?.[recurringInvoice?.status] || recurringInvoice?.status || '-'} />
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <DocumentRefreshButton onRefresh={handleRefresh} />
            {recurringInvoice?.customerId && (
              <Button type="default" size="middle" icon={<Icons.ExportOutlined className="mr-2" />} onClick={() => setViewCustomerDetail(true)} className="flex items-center">
                View Customer
              </Button>
            )}
            <PDFDownloadLink
              document={
                <ShowPDF
                  data={recurringInvoice}
                  billingAddress={recurringInvoice?.customerId?.address?.billing}
                  shippingAddress={recurringInvoice?.shippingAddress}
                  profile={profile}
                  pageType={pageTypes.RECURRING_INVOICE}
                />
              }
              fileName={generateSafeFileName(recurringInvoice, 'recurringInvoiceId')}
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
          <ActionButtons>
            {canMarkStatus ? (
              <Dropdown menu={{ items: dropDownItems }} placement="bottom" trigger={['click']}>
                <Button type="primary" className="px-4 py-2 w-full" disabled={submitLoading} block>
                  {submitLoading ? <CustomLoader variant="button" text="Updating..." /> : 'Mark Recurring Invoice As'}
                </Button>
              </Dropdown>
            ) : (
              <Tooltip title={markAsTooltip} placement="left">
                <span className="block w-full">
                  <Button type="primary" className="px-4 py-2 w-full" disabled block>
                    Mark Recurring Invoice As
                  </Button>
                </span>
              </Tooltip>
            )}
            <PermissionButton
              canAccess={useModuleRecurringInvoice?.edit}
              isViewOnly={isViewOnly}
              disabled={!isDraftStatus || submitLoading}
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
              canAccess={useModuleRecurringInvoice?.delete}
              isViewOnly={isViewOnly}
              disabled={!isDraftStatus || deleteLoading}
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

          <DocumentMetadata data={recurringInvoice} />
          <OrganizationInfo data={recurringInvoice} />
        </div>
      </div>
      <DocumentConfirmModal
        modal={deleteModal}
        docType={MODULE_NAMES?.RECURRING_INVOICE}
        onConfirm={deleteRecurringInvoice}
        loading={deleteLoading}
        getDocumentDetails={getRecurringInvoiceDocumentDetails}
      />
      <DocumentConfirmModal
        modal={cancelStatusModal}
        docType={MODULE_NAMES?.RECURRING_INVOICE}
        loading={submitLoading}
        mode="status"
        onConfirm={confirmCancelStatus}
        getDocumentDetails={getRecurringInvoiceDocumentDetails}
      />
      {viewCustomerDetail && <CustomerDrawerDetails viewCustomerDetail={viewCustomerDetail} setViewCustomerDetail={setViewCustomerDetail} customerData={customerData} />}
    </>
  );
};

export default RecurringInvoiceDetail;
