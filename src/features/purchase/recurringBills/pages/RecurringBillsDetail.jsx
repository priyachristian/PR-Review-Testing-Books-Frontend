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
import RecurringBillDetailSkeleton from '../components/RecurringBillDetailSkeleton';
import RecurringBillExecutionHistory from '../components/RecurringBillExecutionHistory';
import { CommentHistory } from '@/features/common/comment';

// Hooks
import useModulePermissions from 'hooks/useModulePermissions';
import { useProfile } from '@/features/setting/profile/useProfile';
import { useConfirmModal } from '@/hooks/useConfirmModal';

// Extras
import { useRecurringBills, itemTableColumn, getRecurringBillDocumentDetails } from '@/features/purchase/recurringBills';
import { formatAmount } from '@/utils/currency';
import Icons from '@/assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { BACKEND_ENUM, MODULE_NAMES, pageTypes, PERMISSION_MESSAGES, RECURRING_BILL_STATUS, RECURRING_BILL_STATUS_CHANGE_RESTRICTED_STATUS } from 'utils/constants';
import { buildTaxContext, isIGSTExists } from 'utils/services';
import { PDFDownloadLink } from '@/components/ui/common/PdfDownloadLinkLazy';
import { renderPdfToBlob } from '@/utils/loadReactPdf';
import { ShowPDF } from '@/components/ui/common/ShowPDFLazy';
import { generateSafeFileName } from '@/utils/pdfname';

const RecurringBillsDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { billsId } = useParams();
  const [activeKey, setActiveKey] = useState('1');
  const [viewCustomerDetail, setViewCustomerDetail] = useState(false);
  const cancelStatusModal = useConfirmModal();
  const deleteModal = useConfirmModal();
  const { loading, recurringBill, submitLoading, deleteLoading, getRecurringBillById, resetRecurringBill, updateStatus, removeRecurringBill } = useRecurringBills();
  const { useModuleRecurringBills, isViewOnly } = useModulePermissions(RESOURCES.RECURRING_BILLS);
  const { profile, getProfile } = useProfile();

  useEffect(() => {
    const controller = new AbortController();
    getProfile({ signal: controller.signal });
    return () => controller.abort();
  }, [getProfile]);

  useEffect(() => {
    const controller = new AbortController();
    if (billsId) {
      getRecurringBillById({ recurringBillId: billsId, signal: controller.signal });
    } else {
      resetRecurringBill();
    }
    return () => {
      controller.abort();
      resetRecurringBill();
    };
  }, [billsId, getRecurringBillById, resetRecurringBill]);

  const handleRefresh = async () => {
    await getRecurringBillById({ recurringBillId: billsId });
  };

  const handleEditClick = () => {
    navigate(`/recurring-bills/${recurringBill._id}/edit`, {
      state: {
        recurringBillData: recurringBill,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleUpdateStatus = async status => {
    const recurringBillId = recurringBill?.id || recurringBill?._id;
    await updateStatus({ billsId: recurringBillId, status });
    await getRecurringBillById({ recurringBillId: billsId });
  };

  const updateRecurringBillStatus = async newStatus => {
    if (newStatus === BACKEND_ENUM.CANCELLED) {
      cancelStatusModal.open(recurringBill);
      return;
    }
    await handleUpdateStatus(newStatus);
  };

  const confirmCancelStatus = async () => {
    await handleUpdateStatus(BACKEND_ENUM.CANCELLED);
    cancelStatusModal.close();
  };

  const handleDeleteClick = () => {
    deleteModal.open(recurringBill);
  };

  const deleteRecurringBill = async () => {
    const recurringBillId = recurringBill?.id || recurringBill?._id;
    await removeRecurringBill({ billsId: recurringBillId });
    deleteModal.close();
    navigate('/recurring-bills');
  };

  const getStatusActionItems = status => {
    let statusArr = [];

    if (status === BACKEND_ENUM?.DRAFT) {
      statusArr = [
        {
          key: `markAs${RECURRING_BILL_STATUS.ACTIVE}`,
          label: `Mark As ${RECURRING_BILL_STATUS.ACTIVE}`,
          onClick: () => updateRecurringBillStatus(BACKEND_ENUM.ACTIVE),
        },
        {
          key: `markAs${RECURRING_BILL_STATUS.CANCELLED}`,
          label: `Mark As ${RECURRING_BILL_STATUS.CANCELLED}`,
          onClick: () => updateRecurringBillStatus(BACKEND_ENUM.CANCELLED),
        },
      ];
    } else if (status === BACKEND_ENUM?.ACTIVE) {
      statusArr = [
        {
          key: `markAs${RECURRING_BILL_STATUS.PAUSED}`,
          label: `Mark As ${RECURRING_BILL_STATUS.PAUSED}`,
          onClick: () => updateRecurringBillStatus(BACKEND_ENUM.PAUSED),
        },
        {
          key: `markAs${RECURRING_BILL_STATUS.CANCELLED}`,
          label: `Mark As ${RECURRING_BILL_STATUS.CANCELLED}`,
          onClick: () => updateRecurringBillStatus(BACKEND_ENUM.CANCELLED),
        },
      ];
    } else if (status === BACKEND_ENUM?.PAUSED) {
      statusArr = [
        {
          key: `markAs${RECURRING_BILL_STATUS.ACTIVE}`,
          label: `Mark As ${RECURRING_BILL_STATUS.ACTIVE}`,
          onClick: () => updateRecurringBillStatus(BACKEND_ENUM.ACTIVE),
        },
        {
          key: `markAs${RECURRING_BILL_STATUS.CANCELLED}`,
          label: `Mark As ${RECURRING_BILL_STATUS.CANCELLED}`,
          onClick: () => updateRecurringBillStatus(BACKEND_ENUM.CANCELLED),
        },
      ];
    } else if (!RECURRING_BILL_STATUS_CHANGE_RESTRICTED_STATUS?.includes(status)) {
      statusArr = [
        {
          key: `markAs${RECURRING_BILL_STATUS.CANCELLED}`,
          label: `Mark As ${RECURRING_BILL_STATUS.CANCELLED}`,
          onClick: () => updateRecurringBillStatus(BACKEND_ENUM.CANCELLED),
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
            <DetailField label="Recurring Bill No">{recurringBill?.recurringBillId ? <Tag className="font-semibold">{recurringBill.recurringBillId}</Tag> : '-'}</DetailField>
            <DetailField label="Profile Name" value={recurringBill?.profileName} truncate={false} valueClassName="break-words" />
            <DetailField label="Vendor Name" value={recurringBill?.vendor?.customerDisplayName} truncate={false} valueClassName="break-words" />
            <DetailField label="Start Date" value={recurringBill?.startDate ? dayjs(recurringBill.startDate).format('DD MMM YYYY') : undefined} />
            <DetailField label="End Date" value={recurringBill?.neverExpires ? 'Never Expires' : recurringBill?.endDate ? dayjs(recurringBill.endDate).format('DD MMM YYYY') : undefined} />
            <DetailField
              label="Repeat Every"
              value={recurringBill?.repeatEvery?.frequency && recurringBill?.repeatEvery?.period ? `${recurringBill.repeatEvery.frequency} ${recurringBill.repeatEvery.period}` : undefined}
            />
            <DetailField label="Payment Terms" value={recurringBill?.paymentTermsId?.name} />
            <DetailField label="Next Execution Date" value={recurringBill?.nextExecutionDate ? dayjs(recurringBill.nextExecutionDate).format('DD MMM YYYY') : undefined} />
          </div>
        </div>
      </div>

      <div className="my-container container-spacing">
        <p className="font-bold text-lg">Item Details</p>
        <div className="mt-4">
          <CustomTable columns={itemTableColumn(recurringBill?.items || [])} data={recurringBill?.items || []} pagination={false} scroll={{ x: 'max-content' }} dynamicScrollY={false} />
        </div>

        <div className="flex justify-end mt-6">
          <div className="w-full md:w-1/3 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Sub Total</span>
              <span className="font-medium">{formatAmount(recurringBill?.subTotal || 0)}</span>
            </div>
            {parseFloat(recurringBill?.discountConfig?.discountValue || 0) > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Discount</span>
                <span className="font-medium">
                  {recurringBill?.discountConfig?.discountType === 'PERCENTAGE' ? `${recurringBill?.discountConfig?.discountValue}%` : formatAmount(recurringBill?.discountConfig?.discountValue || 0)}
                </span>
              </div>
            )}
            {isIGSTExists(buildTaxContext(profile, recurringBill?.vendor, recurringBill?.vendor?.address?.billing?.state || '')) ? (
              <div className="flex justify-between">
                <span className="text-gray-600">IGST</span>
                <span className="font-medium">{formatAmount(recurringBill?.igst || 0)}</span>
              </div>
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600">CGST</span>
                  <span className="font-medium">{formatAmount(recurringBill?.cgst || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">SGST</span>
                  <span className="font-medium">{formatAmount(recurringBill?.sgst || 0)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Total Tax</span>
              <span className="font-medium">{formatAmount(recurringBill?.totalTax || 0)}</span>
            </div>
            {recurringBill?.isRoundOff && (
              <div className="flex justify-between">
                <span className="text-gray-600">Round Off</span>
                <span className="font-medium">{formatAmount(recurringBill?.roundOffAmount || 0)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-3">
              <span className="text-gray-800 font-bold">Total</span>
              <span className="font-bold">{formatAmount(recurringBill?.total || 0, true, recurringBill?.currency)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="my-container container-spacing">
        <p className="font-bold text-lg mb-3">Terms & Notes</p>
        <div className="grid md:grid-cols-2 gap-6">
          <DetailField label="Vendor Notes">
            <div className="p-3 bg-gray-50 rounded-md whitespace-pre-wrap">{recurringBill?.customerNotes || '-'}</div>
          </DetailField>
          <DetailField label="Terms & Conditions">
            <div className="p-3 bg-gray-50 rounded-md whitespace-pre-wrap">{recurringBill?.termsAndConditions || '-'}</div>
          </DetailField>
        </div>
      </div>
    </div>
  );

  const handlePrint = async () => {
    const blob = await renderPdfToBlob(
      <ShowPDF data={recurringBill} billingAddress={recurringBill?.vendor?.address?.billing} shippingAddress={recurringBill?.shippingAddress} profile={profile} pageType={pageTypes.RECURRING_BILL} />
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
    return <RecurringBillDetailSkeleton />;
  }

  if (!recurringBill && !loading) {
    return <NoFoundPage docType={MODULE_NAMES?.RECURRING_BILL} />;
  }

  const customerData = {
    id: recurringBill?.vendor?._id || recurringBill?.vendor?.id || recurringBill?.vendorId,
    customerDisplayName: recurringBill?.vendor?.customerDisplayName,
  };

  const isDraftStatus = recurringBill?.status === BACKEND_ENUM.DRAFT;
  const dropDownItems = [...getStatusActionItems(recurringBill?.status)];
  const statusLabel = RECURRING_BILL_STATUS?.[recurringBill?.status] || recurringBill?.status || '-';
  const canOpenMore = useModuleRecurringBills?.edit && !isViewOnly;
  const canEdit = canOpenMore && isDraftStatus;
  const canDelete = useModuleRecurringBills?.delete && !isViewOnly && isDraftStatus;
  const canMarkStatus = canOpenMore && !RECURRING_BILL_STATUS_CHANGE_RESTRICTED_STATUS?.includes(recurringBill?.status) && dropDownItems.length > 0;
  const markAsTooltip = canMarkStatus
    ? 'Mark Recurring Bill As'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useModuleRecurringBills?.edit
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : `This document status cannot be changed in its current status - ${statusLabel}.`;
  const editTooltip = canEdit
    ? 'Edit Recurring Bill'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useModuleRecurringBills?.edit
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : `This document cannot be edited in its current status - ${statusLabel}.`;
  const deleteTooltip = canDelete
    ? 'Delete Recurring Bill'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useModuleRecurringBills?.delete
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
      label: 'Next Bill',
      children: <SalesModuleDetailView data={{ ...recurringBill, vendor: recurringBill?.vendor }} profile={profile} pageType={pageTypes?.RECURRING_BILL} />,
    },
    ...(recurringBill?.attachments?.length > 0
      ? [
          {
            key: '3',
            label: 'Attachments',
            children: <AttachMentDetails data={recurringBill} />,
          },
        ]
      : []),
    {
      key: '4',
      label: 'History',
      children: (
        <CommentHistory
          moduleName={MODULE_NAMES.RECURRING_BILL}
          referenceId={billsId}
          commentHistory={recurringBill?.commentHistory}
          canAddComment={useModuleRecurringBills?.edit}
          isViewOnly={isViewOnly}
        />
      ),
    },
    {
      key: '5',
      label: 'Recurring Activities',
      children: <RecurringBillExecutionHistory history={recurringBill?.history || []} currency={recurringBill?.currency} />,
    },
  ];

  return (
    <>
      <StatusUpdateLoader loading={submitLoading} hidden={deleteModal.isOpen || cancelStatusModal.isOpen} text="Updating recurring bill status..." />
      <div className="bg-white border-b border-gray-100 px-4 py-2 -m-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center space-x-4 min-w-0">
            <BackButton />
            <div className="flex flex-col">
              <h1 className="text-[18px] font-semibold text-gray-900">Recurring Bill Details</h1>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm font-medium text-gray-600">{recurringBill?.recurringBillId}</span>
                <span className="text-gray-400">•</span>
                <StatusBadge status={recurringBill?.status} value={RECURRING_BILL_STATUS?.[recurringBill?.status] || recurringBill?.status || '-'} />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <DocumentRefreshButton onRefresh={handleRefresh} />
            {recurringBill?.vendorId && (
              <Button type="default" size="middle" icon={<Icons.ExportOutlined className="mr-2" />} onClick={() => setViewCustomerDetail(true)} className="flex items-center">
                View Vendor
              </Button>
            )}
            <PDFDownloadLink
              document={
                <ShowPDF
                  data={recurringBill}
                  billingAddress={recurringBill?.vendor?.address?.billing}
                  shippingAddress={recurringBill?.shippingAddress}
                  profile={profile}
                  pageType={pageTypes.RECURRING_BILL}
                />
              }
              fileName={generateSafeFileName(recurringBill, 'recurringBillId')}
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
                  {submitLoading ? <CustomLoader variant="button" text="Updating..." /> : 'Mark Recurring Bill As'}
                </Button>
              </Dropdown>
            ) : (
              <Tooltip title={markAsTooltip} placement="left">
                <span className="block w-full">
                  <Button type="primary" className="px-4 py-2 w-full" disabled block>
                    Mark Recurring Bill As
                  </Button>
                </span>
              </Tooltip>
            )}
            <PermissionButton
              canAccess={useModuleRecurringBills?.edit}
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
              canAccess={useModuleRecurringBills?.delete}
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

          <DocumentMetadata data={recurringBill} />
          <OrganizationInfo data={recurringBill} />
        </div>
      </div>
      <DocumentConfirmModal modal={deleteModal} docType={MODULE_NAMES?.RECURRING_BILL} onConfirm={deleteRecurringBill} loading={deleteLoading} getDocumentDetails={getRecurringBillDocumentDetails} />
      <DocumentConfirmModal
        modal={cancelStatusModal}
        docType={MODULE_NAMES?.RECURRING_BILL}
        loading={submitLoading}
        mode="status"
        onConfirm={confirmCancelStatus}
        getDocumentDetails={getRecurringBillDocumentDetails}
      />
      {viewCustomerDetail && <CustomerDrawerDetails viewCustomerDetail={viewCustomerDetail} setViewCustomerDetail={setViewCustomerDetail} customerData={customerData} isVendor={true} />}
    </>
  );
};

export default RecurringBillsDetail;
