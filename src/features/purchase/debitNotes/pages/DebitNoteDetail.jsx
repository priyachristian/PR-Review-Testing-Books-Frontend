import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

// Components
import ApplyBillModal from '../components/ApplyBillModal';
import AttachMentDetails from '@/components/feedback/formModal/AttachMentDetails';
import BackButton from '@/components/ui/button/BackButton';
import DocumentRefreshButton from '@/components/ui/button/DocumentRefreshButton';
import ConfirmRemoveModal from '@/components/feedback/confirmModal/ConfirmRemoveModal';
import CustomerDrawerDetails from '@/features/sales/customer/components/CustomerDrawerDetails';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import { DocumentConfirmModal } from '@/components/feedback/confirmModal/CancelOrDeleteDocumentModal';
import { DocumentMetadata, OrganizationInfo, ActionButtons } from '@/components/ui';
import RefundModal from '@/components/feedback/formModal/RefundModal';
import SalesModuleDetailView from '@/components/dataDisplay/statCard/SalesModuleDetailView';
import { ShowPDF } from '@/components/ui/common/ShowPDFLazy';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import StatusUpdateLoader from '@/components/feedback/pageLoader/StatusUpdateLoader';
import { Button, Dropdown, Tabs, Tag, Tooltip } from '@/components/AntDComponent';
import PermissionButton from '@/components/ui/button/PermissionButton';
import DetailPageSkeleton from '@/components/feedback/pageLoader/DetailPageSkeleton';
import NoFoundPage from '@/components/ui/common/NoFoundPage';
import { CommentHistory } from '@/features/common/comment';

// Hooks
import useModulePermissions from 'hooks/useModulePermissions';
import { useProfile } from '@/features/setting/profile/useProfile';
import { useConfirmModal } from '@/hooks/useConfirmModal';

// Extras
import { useDebitNote, getDebitNoteDocumentDetails } from '@/features/purchase/debitNotes';
import Icons from 'assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import {
  BACKEND_ENUM,
  DEBIT_NOTE_TYPE_ENUM,
  pageTypes,
  DEBIT_NOTE_APPLIED_STATUS,
  DEBIT_NOTE_EDIT_RESTRICTED_STATUS,
  DEBIT_NOTE_STATUS,
  DEBIT_NOTE_STATUS_CHANGE_RESTRICTED_STATUS,
  MODULE_NAMES,
  LEDGER_SOURCE_MODULES,
  PERMISSION_MESSAGES,
} from 'utils/constants';
import { dateFormateForUi, isSplitDocumentUnavailable } from 'utils/services';
import { formatAmount } from '@/utils/currency';
import { generateSafeFileName } from '@/utils/pdfname';
import PageHeader from '@/components/ui/common/PageHeader';
import StockMovementPanel from '@/components/dataDisplay/StockMovementPanel';
import DocumentJournalPanel from '@/components/dataDisplay/DocumentJournalPanel';
import BatchDetailsDrawer from '@/components/dataDisplay/BatchDetailsDrawer';
import { useViewInventory } from '@/features/inventory/viewInventory';
import { API_ROUTES } from '@/utils/apiRoute';
import { GstDocumentPanel, GstDocumentPdfActions, useGstFeatures } from '@/features/sales/gstDocument';

const DebitNoteDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { debitNoteId } = useParams();
  const [activeKey, setActiveKey] = useState('1');
  const {
    loading,
    debitNote,
    resetDebitNote,
    getDebitNoteById,
    removeDebitNoteBillsApplied,
    removeDebitNote,
    submitLoading,
    deleteLoading,
    debitNoteRefundLoading,
    updateDebitNoteStatus,
    deleteDebitNoteRefund,
  } = useDebitNote();
  const { itemInventoryBatch, itemInventoryBatchLoading, getItemInventoryBatchById, resetItemInventoryBatch } = useViewInventory();
  const debitNoteData = debitNote;
  const { useModuleDebitNotes, isViewOnly, isSplitSessionActive } = useModulePermissions(RESOURCES.DEBIT_NOTE);
  const { profile, getProfile } = useProfile();
  const { isEWayBillAvailable } = useGstFeatures();
  const [showApplyToBillModal, setShowApplyToBillModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedDebitNote, setSelectedDebitNote] = useState(null);
  const [showRemoveConfirmation, setShowRemoveConfirmation] = useState(false);
  const [billToRemove, setBillToRemove] = useState(null);
  const deleteModal = useConfirmModal();
  const cancelStatusModal = useConfirmModal();
  const [showDeleteRefundConfirmation, setShowDeleteRefundConfirmation] = useState(false);
  const [refundToDelete, setRefundToDelete] = useState(null);
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

  useEffect(() => {
    const controller = new AbortController();
    getProfile({ signal: controller.signal });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    if (debitNoteId) {
      getDebitNoteById({ debitNoteId, signal: controller.signal });
    }

    return () => {
      controller.abort();
      resetDebitNote();
    };
  }, [debitNoteId, isSplitSessionActive]);

  const handleRefresh = async () => {
    await getDebitNoteById({ debitNoteId });
  };

  const handleEditClick = () => {
    navigate(`/debit-notes/${debitNoteData._id}/edit`, {
      state: {
        debitNoteData: debitNoteData,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleRemoveClick = item => {
    setBillToRemove(item);
    setShowRemoveConfirmation(true);
  };

  const handleAppliedBillRowClick = item => {
    const billId = item?.billId?._id ?? item?.billId;
    if (!billId) return;
    navigate(`/bills/${billId}`, {
      state: {
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleConfirmRemove = async () => {
    if (billToRemove) {
      await removeDebitNoteBillsApplied({
        debitNoteId: debitNoteData?._id,
        documentId: billToRemove?._id,
        billId: billToRemove?.billId,
      });
      getDebitNoteById({ debitNoteId });
      setShowRemoveConfirmation(false);
      setBillToRemove(null);
    }

    // If this was the last bill applied, switch to Basic Info tab
    if (debitNoteData?.billsApplied?.length === 1) {
      setActiveKey('1');
    }
  };

  const handleCancelRemove = () => {
    setShowRemoveConfirmation(false);
    setBillToRemove(null);
  };

  const handleDeleteRefundClick = refund => {
    setRefundToDelete(refund);
    setShowDeleteRefundConfirmation(true);
  };

  const handleConfirmDeleteRefund = async () => {
    if (refundToDelete) {
      const isLastRefund = debitNoteData?.refunds?.length === 1;
      await deleteDebitNoteRefund({
        debitNoteId: debitNoteData?._id,
        refundId: refundToDelete?._id,
      });
      getDebitNoteById({ debitNoteId });
      setShowDeleteRefundConfirmation(false);
      setRefundToDelete(null);

      if (isLastRefund) {
        setActiveKey('1');
      }
    }
  };

  const handleCancelDeleteRefund = () => {
    setShowDeleteRefundConfirmation(false);
    setRefundToDelete(null);
  };

  const RenderCreditApplied = () => {
    return (
      <div className="my-container p-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Applied Bills</h3>
            <p className="text-sm text-gray-600 mt-1">Debit note has been applied to the following bills</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Bill No</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Date</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Amount Applied</th>
                  {useModuleDebitNotes?.delete && !isViewOnly && <th className="text-center py-4 px-6 font-semibold text-gray-700">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {debitNoteData?.billsApplied?.map(item => (
                  <tr key={item._id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => handleAppliedBillRowClick(item)}>
                    <td className="py-4 px-6">
                      <Tag className="font-semibold">{item?.billNo}</Tag>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-gray-700">{dateFormateForUi(item?.appliedDate)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-green-600">{formatAmount(item?.amountApplied, true, debitNoteData?.currency)}</span>
                    </td>
                    {useModuleDebitNotes?.delete && !isViewOnly && (
                      <td className="py-4 px-6 text-center">
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            handleRemoveClick(item);
                          }}
                          disabled={submitLoading}
                          className="inline-flex items-center justify-center w-8 h-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Remove from applied bills"
                        >
                          <Icons.DeleteOutlined className="text-base" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {debitNoteData?.billsApplied?.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">
                <Icons.FileTextOutlined className="text-4xl mx-auto" />
              </div>
              <p className="text-gray-500 font-medium">No bills applied yet</p>
              <p className="text-gray-400 text-sm mt-1">This debit note hasn't been applied to any bills</p>
            </div>
          )}
        </div>

        {debitNoteData?.billsApplied?.length > 0 && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <Icons.InfoCircleOutlined className="text-blue-500 text-lg mr-3" />
              <div>
                <p className="text-blue-800 font-medium">Credit Applied Summary</p>
                <p className="text-blue-600 text-sm mt-1">
                  Total amount applied:{' '}
                  {formatAmount(
                    debitNoteData?.billsApplied?.reduce((sum, item) => sum + (item?.amountApplied || 0), 0),
                    true,
                    debitNoteData?.currency
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const RenderRefundHistory = () => {
    return (
      <div className="my-container p-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Refund History</h3>
            <p className="text-sm text-gray-600 mt-1">History of all refunds processed for this debit note</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Refund Date</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">To Account</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Reference</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Notes</th>
                  {useModuleDebitNotes?.delete && <th className="text-center py-4 px-6 font-semibold text-gray-700">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {debitNoteData?.refunds?.map((refund, index) => (
                  <tr key={refund._id || index} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <span className="text-gray-700">{dateFormateForUi(refund?.refundDate)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-green-600">{formatAmount(refund?.refundAmount, true, debitNoteData?.currency)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-gray-700">{refund?.toAccountName || '-'}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-gray-700">{refund?.reference || '-'}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-gray-700">{refund?.notes || '-'}</span>
                    </td>
                    {useModuleDebitNotes?.delete && (
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleDeleteRefundClick(refund)}
                          disabled={submitLoading}
                          className="inline-flex items-center justify-center w-8 h-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete refund"
                        >
                          <Icons.DeleteOutlined className="text-base" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(!debitNoteData?.refunds || debitNoteData?.refunds?.length === 0) && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">
                <Icons.FileTextOutlined className="text-4xl mx-auto" />
              </div>
              <p className="text-gray-500 font-medium">No refunds processed yet</p>
              <p className="text-gray-400 text-sm mt-1">Refunds will appear here once processed</p>
            </div>
          )}
        </div>

        {debitNoteData?.refunds?.length > 0 && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <Icons.InfoCircleOutlined className="text-green-500 text-lg mr-3" />
              <div>
                <p className="text-green-800 font-medium">Refund Summary</p>
                <p className="text-green-600 text-sm mt-1">
                  Total amount refunded:{' '}
                  {formatAmount(
                    debitNoteData?.refunds?.reduce((sum, refund) => sum + (refund?.refundAmount || 0), 0),
                    true,
                    debitNoteData?.currency
                  )}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const items = [
    {
      key: '1',
      label: 'Basic Info',
      // The e-invoice flag is off: a debit note carries only an e-way bill.
      children: <SalesModuleDetailView data={debitNoteData} profile={profile} pageType={pageTypes?.DEBIT_NOTE} isEwayBillingAvailable={isEWayBillAvailable} />,
    },
    {
      key: 'stock-movement',
      label: 'Stock Movement',
      children: <StockMovementPanel url={API_ROUTES.PURCHASE.DEBIT_NOTE.STOCK_MOVEMENT(debitNoteId)} onBatchClick={handleBatchClick} />,
    },
    ...(debitNoteData?.billsApplied?.length > 0
      ? [
          {
            key: '3',
            label: 'Credit Applied',
            children: RenderCreditApplied(),
          },
        ]
      : []),
    ...(debitNoteData?.refunds?.length > 0
      ? [
          {
            key: '5',
            label: 'Refund History',
            children: RenderRefundHistory(),
          },
        ]
      : []),
    ...(debitNoteData?.attachments?.length > 0
      ? [
          {
            key: '4',
            label: 'Attachments',
            children: <AttachMentDetails data={debitNoteData} />,
          },
        ]
      : []),
    {
      key: 'journal-entries',
      label: 'Journal',
      children: <DocumentJournalPanel sourceModule={LEDGER_SOURCE_MODULES.DEBIT_NOTE} sourceId={debitNoteId} />,
    },
    {
      key: '6',
      label: 'History',
      children: (
        <CommentHistory
          moduleName={MODULE_NAMES.DEBIT_NOTE}
          referenceId={debitNoteId}
          commentHistory={debitNoteData?.commentHistory}
          canAddComment={useModuleDebitNotes?.edit}
          isViewOnly={isViewOnly}
        />
      ),
    },
  ];

  const handleApplyToBill = record => {
    setShowApplyToBillModal(true);
    setSelectedDebitNote(record);
  };

  const handleDeleteClick = () => {
    deleteModal.open(debitNoteData);
  };

  const deleteDebitNote = async () => {
    await removeDebitNote({
      debitNoteId: debitNoteData?.id || debitNoteData?._id,
    });
    deleteModal.close();
    navigate('/debit-notes');
  };

  if (loading) {
    return <DetailPageSkeleton />;
  }

  if (!debitNote || isSplitDocumentUnavailable(debitNote, isSplitSessionActive)) {
    return <NoFoundPage docType={MODULE_NAMES?.DEBIT_NOTE} />;
  }

  const handleUpdateStatus = async (debitNoteId, status) => {
    await updateDebitNoteStatus({ debitNoteId, status });
    getDebitNoteById({ debitNoteId });
  };

  const updateDebitNoteStatusDirect = async newStatus => {
    if (newStatus === BACKEND_ENUM?.CANCELLED) {
      cancelStatusModal.open(debitNoteData);
      return;
    }
    await handleUpdateStatus(debitNoteData?.id || debitNoteData?._id, newStatus);
  };

  const confirmCancelStatus = async () => {
    await handleUpdateStatus(debitNoteData?.id || debitNoteData?._id, BACKEND_ENUM?.CANCELLED);
    cancelStatusModal.close();
  };

  const getConvertStatusValue = status => {
    let statusArr = [];

    const dnId = debitNoteData?.id || debitNoteData?._id;
    const markAs = (backendStatus, labelStatus) => ({
      key: `markAs${labelStatus}`,
      label: `Mark As ${labelStatus}`,
      onClick: () => handleUpdateStatus(dnId, backendStatus),
    });
    const draftItem = markAs(BACKEND_ENUM?.DRAFT, DEBIT_NOTE_STATUS?.DRAFT);
    const openItem = markAs(BACKEND_ENUM?.OPEN, DEBIT_NOTE_STATUS?.OPEN);
    const closedItem = markAs(BACKEND_ENUM?.CLOSED, DEBIT_NOTE_STATUS?.CLOSED);
    const cancelItem = {
      key: `markAs${DEBIT_NOTE_STATUS?.CANCELLED}`,
      label: `Mark As ${DEBIT_NOTE_STATUS?.CANCELLED}`,
      onClick: () => updateDebitNoteStatusDirect(BACKEND_ENUM?.CANCELLED),
    };

    if (status === BACKEND_ENUM?.DRAFT) {
      statusArr = [openItem, cancelItem];
    } else if (status === BACKEND_ENUM?.OPEN) {
      statusArr = [closedItem, draftItem, cancelItem];
    } else if (status === BACKEND_ENUM?.CLOSED) {
      statusArr = [openItem, draftItem];
    } else if (status === BACKEND_ENUM?.PARTIALLY_USED) {
      statusArr = [closedItem];
    } else if (status === BACKEND_ENUM?.CANCELLED) {
      statusArr = [draftItem, openItem];
    }

    return statusArr;
  };

  const dropDownItems = [...getConvertStatusValue(debitNoteData?.status)];
  const statusLabel = DEBIT_NOTE_STATUS?.[debitNoteData?.status] || debitNoteData?.status || '-';
  const isDeletable = debitNoteData ? (debitNoteData?.billsApplied?.length ?? 0) === 0 && (debitNoteData?.refunds?.length ?? 0) === 0 : (location.state?.debitNoteData?.isDeletable ?? false);
  const canOpenMore = useModuleDebitNotes?.edit && !isViewOnly;
  const canEdit = canOpenMore && !DEBIT_NOTE_EDIT_RESTRICTED_STATUS?.includes(debitNoteData?.status);
  const canApply = canOpenMore && DEBIT_NOTE_APPLIED_STATUS?.includes(debitNoteData?.status);
  const canRefund = canApply && debitNoteData?.availableBalance > 0;
  const canDelete = useModuleDebitNotes?.delete && !isViewOnly && Boolean(isDeletable) && !!debitNoteData;
  const canMarkStatus = canOpenMore && !DEBIT_NOTE_STATUS_CHANGE_RESTRICTED_STATUS?.includes(debitNoteData?.status) && dropDownItems.length > 0;
  const markAsTooltip = canMarkStatus
    ? 'Mark Debit Note As'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useModuleDebitNotes?.edit
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : `This document status cannot be changed in its current status - ${statusLabel}.`;
  const editTooltip = canEdit
    ? 'Edit Debit Note'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useModuleDebitNotes?.edit
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : `This document cannot be edited in its current status - ${statusLabel}.`;
  const applyTooltip = canApply
    ? 'Apply to Bill'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useModuleDebitNotes?.edit
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : `Cannot apply in current status - ${statusLabel}.`;
  const refundTooltip = canRefund
    ? 'Process Refund'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useModuleDebitNotes?.edit
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : debitNoteData?.availableBalance <= 0
          ? 'No available balance to refund.'
          : `Cannot process refund in current status - ${statusLabel}.`;
  const deleteTooltip = canDelete
    ? 'Delete Debit Note'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useModuleDebitNotes?.delete
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : `Cannot delete in current status - ${statusLabel}.`;

  const customerData = {
    id: debitNoteData?.vendorId?._id,
    customerDisplayName: debitNoteData?.vendorId?.customerDisplayName,
  };

  return (
    <>
      <StatusUpdateLoader loading={submitLoading} hidden={deleteModal.isOpen || cancelStatusModal.isOpen} text="Updating debit note status..." />
      <div className="bg-white border-b border-gray-100 px-4 py-4 -m-4">
        <div className="flex items-center justify-between">
          <PageHeader
            title={
              <div className="flex items-center gap-3">
                <BackButton />

                <div className="flex flex-col">
                  <h1 className="text-[18px] font-semibold text-heading leading-6">Debit Note Details</h1>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-medium text-gray-600">{debitNoteData?.debitNoteId}</span>

                    <span className="text-gray-400">•</span>

                    <StatusBadge status={debitNoteData?.status} value={DEBIT_NOTE_STATUS?.[debitNoteData?.status]} />
                  </div>
                </div>
              </div>
            }
            rightStats={[
              debitNoteData?.type && {
                label: 'Type',
                value: DEBIT_NOTE_TYPE_ENUM[debitNoteData?.type] || debitNoteData?.type,
              },
              {
                label: 'Total Amount',
                value: formatAmount(debitNoteData?.total || 0, true, debitNoteData?.currency),
              },
              {
                label: 'Used Credit',
                value: formatAmount(debitNoteData?.billsApplied?.reduce((sum, item) => sum + (item?.amountApplied || 0), 0) || 0, true, debitNoteData?.currency),
                colorClass: 'text-green-600',
              },
              {
                label: 'Unused Credit',
                value: formatAmount(debitNoteData?.availableBalance || 0, true, debitNoteData?.currency),
                colorClass: 'text-blue-600',
              },
            ].filter(Boolean)}
          />

          {/* Quick Actions */}
          <div className="flex items-center space-x-3">
            <DocumentRefreshButton onRefresh={handleRefresh} />
            {debitNoteData?.vendorId?._id && (
              <Button type="default" size="middle" icon={<Icons.ExportOutlined className="mr-2" />} onClick={() => setViewCustomerDetail(true)} className="flex items-center">
                View Vendor
              </Button>
            )}
            <GstDocumentPdfActions
              document={debitNoteData}
              documentLabel="Debit Note"
              documentNumber={debitNoteData?.debitNoteId}
              fileName={generateSafeFileName(debitNoteData, 'debitNoteId')}
              allowEInvoice={false}
              renderPdf={pdfFlags => (
                <ShowPDF
                  data={debitNoteData}
                  billingAddress={debitNoteData?.vendorId?.address?.billing}
                  shippingAddress={debitNoteData?.shippingAddress}
                  profile={profile}
                  pageType={pageTypes.DEBIT_NOTE}
                  {...pdfFlags}
                />
              )}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row xl:justify-between pt-3">
        <div className="w-full xl:w-3/4">
          <Tabs activeKey={activeKey} onChange={setActiveKey} items={items} />
        </div>
        <div className="xl:mt-[62px] h-fit w-full xl:w-[250px] space-y-3 relative">
          <div className="space-y-3">
            <ActionButtons>
              {canMarkStatus ? (
                <Dropdown menu={{ items: dropDownItems }} placement="bottom" trigger={['click']}>
                  <Button type="primary" className="px-4 py-2 w-full" disabled={submitLoading} block>
                    {submitLoading ? <CustomLoader variant="button" text="Updating..." /> : 'Mark Debit Note As'}
                  </Button>
                </Dropdown>
              ) : (
                <Tooltip title={markAsTooltip} placement="left">
                  <span className="block w-full">
                    <Button type="primary" className="px-4 py-2 w-full" disabled block>
                      Mark Debit Note As
                    </Button>
                  </span>
                </Tooltip>
              )}

              {/* E-way bill for goods returned to the vendor */}
              <GstDocumentPanel
                basePath={API_ROUTES.PURCHASE.DEBIT_NOTE.BASE}
                documentId={debitNoteData?._id || debitNoteData?.id}
                document={debitNoteData}
                documentLabel="Debit Note"
                contextItems={[
                  { label: 'Debit Note#', value: debitNoteData?.debitNoteId },
                  { label: 'Vendor Name', value: debitNoteData?.vendorId?.customerDisplayName || debitNoteData?.customerDisplayName },
                ]}
                allowEInvoice={false}
                canGenerate={Boolean(useModuleDebitNotes?.edit) && !isViewOnly && !debitNoteData?.isSplit && ![BACKEND_ENUM?.DRAFT, BACKEND_ENUM?.CANCELLED].includes(debitNoteData?.status)}
                onChanged={() => getDebitNoteById({ debitNoteId })}
              />

              <PermissionButton
                canAccess={useModuleDebitNotes?.edit}
                isViewOnly={isViewOnly}
                disabled={!canApply || submitLoading}
                tooltipTitle={applyTooltip}
                tooltipProps={{ placement: 'left' }}
                wrapperClassName="block w-full"
                type="primary"
                icon={<Icons.SwapOutlined />}
                className="px-4 py-2 w-full"
                block
                onClick={canApply ? () => handleApplyToBill(debitNoteData) : undefined}
              >
                {submitLoading ? <CustomLoader variant="button" text="Loading..." /> : 'Apply to Bill'}
              </PermissionButton>
              <PermissionButton
                canAccess={useModuleDebitNotes?.edit}
                isViewOnly={isViewOnly}
                disabled={!canRefund || submitLoading}
                tooltipTitle={refundTooltip}
                tooltipProps={{ placement: 'left' }}
                wrapperClassName="block w-full"
                type="primary"
                icon={<Icons.DollarOutlined />}
                className="px-4 py-2 w-full"
                block
                onClick={
                  canRefund
                    ? () => {
                        setShowRefundModal(true);
                        setSelectedDebitNote(debitNoteData);
                      }
                    : undefined
                }
              >
                {submitLoading ? <CustomLoader variant="button" text="Processing..." /> : 'Refund'}
              </PermissionButton>
              <PermissionButton
                canAccess={useModuleDebitNotes?.edit}
                isViewOnly={isViewOnly}
                disabled={DEBIT_NOTE_EDIT_RESTRICTED_STATUS?.includes(debitNoteData?.status) || submitLoading}
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
                canAccess={useModuleDebitNotes?.delete}
                isViewOnly={isViewOnly}
                disabled={!isDeletable || !debitNoteData || deleteLoading}
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

            <DocumentMetadata data={debitNoteData} />

            <OrganizationInfo data={debitNoteData} />
          </div>
        </div>
      </div>

      {/* Apply Bill Modal */}
      {showApplyToBillModal && (
        <ApplyBillModal
          modalOpen={showApplyToBillModal}
          onClose={() => setShowApplyToBillModal(false)}
          debitNoteDetails={selectedDebitNote}
          fetchDebitNote={() => {
            getDebitNoteById({ debitNoteId });
          }}
        />
      )}

      {/* Refund Modal */}
      <RefundModal
        variant="debit"
        modalOpen={showRefundModal}
        onClose={() => setShowRefundModal(false)}
        documentDetails={selectedDebitNote}
        fetchAfterRefund={() => {
          getDebitNoteById({ debitNoteId });
        }}
      />

      {/* Remove Confirmation Modal */}
      <ConfirmRemoveModal
        modalOpen={showRemoveConfirmation}
        setModalOpen={setShowRemoveConfirmation}
        title="Remove Applied Bill"
        description="Are you sure you want to remove this bill from the applied list?"
        itemToRemove={billToRemove}
        onConfirm={handleConfirmRemove}
        onCancel={handleCancelRemove}
        loading={submitLoading}
        importantNoteText="Removing this bill will release the applied amount back to the balance. This action cannot be undone."
      />
      {/* Delete Refund Confirmation Modal */}
      <ConfirmRemoveModal
        modalOpen={showDeleteRefundConfirmation}
        setModalOpen={setShowDeleteRefundConfirmation}
        title="Delete Refund"
        description="Are you sure you want to delete this refund? This action will reverse the account transaction and cannot be undone."
        itemToRemove={refundToDelete}
        onConfirm={handleConfirmDeleteRefund}
        onCancel={handleCancelDeleteRefund}
        loading={debitNoteRefundLoading}
        importantNoteText="Removing this refund will release the applied amount back to the balance. This action cannot be undone."
      />

      <DocumentConfirmModal modal={deleteModal} docType={MODULE_NAMES?.DEBIT_NOTE} onConfirm={deleteDebitNote} loading={deleteLoading} getDocumentDetails={getDebitNoteDocumentDetails} />
      <DocumentConfirmModal
        modal={cancelStatusModal}
        docType={MODULE_NAMES?.DEBIT_NOTE}
        loading={submitLoading}
        mode="status"
        onConfirm={confirmCancelStatus}
        getDocumentDetails={getDebitNoteDocumentDetails}
      />
      {viewCustomerDetail && <CustomerDrawerDetails viewCustomerDetail={viewCustomerDetail} setViewCustomerDetail={setViewCustomerDetail} customerData={customerData} isVendor={true} />}
      <BatchDetailsDrawer open={batchDrawerOpen} batch={itemInventoryBatch} loading={itemInventoryBatchLoading} onClose={handleBatchDrawerClose} />
    </>
  );
};

export default DebitNoteDetail;
