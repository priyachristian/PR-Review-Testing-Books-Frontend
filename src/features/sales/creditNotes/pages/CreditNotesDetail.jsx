import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

// Components
import { Button, Dropdown, Tabs, Tag, Tooltip } from '@/components/AntDComponent';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import DetailPageSkeleton from '@/components/feedback/pageLoader/DetailPageSkeleton';
import BackButton from '@/components/ui/button/BackButton';
import DocumentRefreshButton from '@/components/ui/button/DocumentRefreshButton';
import ConfirmRemoveModal from '@/components/feedback/confirmModal/ConfirmRemoveModal';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import SalesModuleDetailView from '@/components/dataDisplay/statCard/SalesModuleDetailView';
import { ShowPDF } from '@/components/ui/common/ShowPDFLazy';
import AttachMentDetails from '@/components/feedback/formModal/AttachMentDetails';
import { DocumentConfirmModal } from '@/components/feedback/confirmModal/CancelOrDeleteDocumentModal';
import { ActionButtons, DocumentMetadata, OrganizationInfo } from '@/components/ui';
import StatusUpdateLoader from '@/components/feedback/pageLoader/StatusUpdateLoader';
import CustomerDrawerDetails from '@/features/sales/customer/components/CustomerDrawerDetails';
import ApplyCreditModal from '../components/ApplyCreditModal';
import RefundModal from '@/components/feedback/formModal/RefundModal';
import ConversionBadges from '@/components/ui/badge/ConversionBadges';
import ConvertFromDetail from '@/components/feedback/formModal/ConvertFromDetail';
import NoFoundPage from '@/components/ui/common/NoFoundPage';
import { CommentHistory } from '@/features/common/comment';

// Hooks
import { useProfile } from '@/features/setting/profile/useProfile';
import { useConfirmModal } from '@/hooks/useConfirmModal';
import useModulePermissions from 'hooks/useModulePermissions';

// Extras
import { getCreditNoteDocumentDetails, useCreditNote } from '@/features/sales/creditNotes';
import Icons from 'assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import {
  BACKEND_ENUM,
  CREDIT_NOTE_APPLIED_STATUS,
  CREDIT_NOTE_EDIT_RESTRICTED_STATUS,
  CREDIT_NOTE_STATUS,
  CREDIT_NOTE_STATUS_CHANGE_RESTRICTED_STATUS,
  MODULE_NAMES,
  pageTypes,
  PERMISSION_MESSAGES,
  LEDGER_SOURCE_MODULES,
} from 'utils/constants';
import { generateSafeFileName } from '@/utils/pdfname';
import { dateFormateForUi, isSplitDocumentUnavailable } from 'utils/services';
import { formatAmount } from '@/utils/currency';
import PageHeader from '@/components/ui/common/PageHeader';
import StockMovementPanel from '@/components/dataDisplay/StockMovementPanel';
import DocumentJournalPanel from '@/components/dataDisplay/DocumentJournalPanel';
import BatchDetailsDrawer from '@/components/dataDisplay/BatchDetailsDrawer';
import { useViewInventory } from '@/features/inventory/viewInventory';
import { API_ROUTES } from '@/utils/apiRoute';
import { GstDocumentPanel, GstDocumentPdfActions, useGstFeatures } from '@/features/sales/gstDocument';

const CreditNotesDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { creditNotesId } = useParams();
  const [activeKey, setActiveKey] = useState('1');
  const {
    loading,
    creditNote,
    submitLoading,
    deleteLoading,
    creditNoteRefundLoading,
    getCreditNoteById,
    resetCreditNote,
    removeCreditNote,
    removeCreditNoteInvoice,
    updateCreditNoteStatus,
    deleteCreditNoteRefund,
  } = useCreditNote();
  const { itemInventoryBatch, itemInventoryBatchLoading, getItemInventoryBatchById, resetItemInventoryBatch } = useViewInventory();
  const creditNoteData = creditNote;
  const { useModuleCreditNote, isViewOnly, isSplitSessionActive } = useModulePermissions(RESOURCES.CREDIT_NOTES);
  const { profile, getProfile } = useProfile();
  const { isEInvoicingAvailable, isOnlyEWayBillAvailable } = useGstFeatures();
  const [showapplyCreditModal, setShowapplyCreditModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedCreditNote, setSelectedCreditNote] = useState(null);
  const [showRemoveConfirmation, setShowRemoveConfirmation] = useState(false);
  const [invoiceToRemove, setInvoiceToRemove] = useState(null);
  const deleteModal = useConfirmModal();
  const cancelStatusModal = useConfirmModal();
  const [showDeleteRefundConfirmation, setShowDeleteRefundConfirmation] = useState(false);
  const [refundToDelete, setRefundToDelete] = useState(null);
  const [viewCustomerDetail, setViewCustomerDetail] = useState(false);
  const [showConvertFromModal, setShowConvertFromModal] = useState(false);
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
  }, [getProfile]);

  useEffect(() => {
    const controller = new AbortController();
    if (creditNotesId) {
      getCreditNoteById({ creditNoteId: creditNotesId, signal: controller.signal });
    }

    return () => {
      controller.abort();
      resetCreditNote();
    };
  }, [creditNotesId, isSplitSessionActive, getCreditNoteById, resetCreditNote]);

  const handleRefresh = async () => {
    await getCreditNoteById({ creditNoteId: creditNotesId });
  };

  const handleEditClick = () => {
    navigate(`/credit-notes/${creditNoteData._id}/edit`, {
      state: {
        creditNoteData: creditNoteData,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleInvoiceClick = invoiceId => {
    navigate(`/invoices/${invoiceId}`, {
      state: {
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleRemoveClick = item => {
    setInvoiceToRemove(item);
    setShowRemoveConfirmation(true);
  };

  const handleConfirmRemove = async () => {
    if (invoiceToRemove) {
      const isOb = Boolean(invoiceToRemove?.openingBalanceTransactionId);
      await removeCreditNoteInvoice({
        creditNoteId: creditNoteData?._id,
        documentId: invoiceToRemove?._id,
        ...(isOb ? { openingBalanceTransactionId: invoiceToRemove.openingBalanceTransactionId } : { invoiceId: invoiceToRemove?.invoiceId }),
      });
      getCreditNoteById({ creditNoteId: creditNotesId });
      setShowRemoveConfirmation(false);
      setInvoiceToRemove(null);

      const remaining = (creditNoteData?.invoicesApplied?.length || 0) + (creditNoteData?.openingBalanceTransactions?.length || 0);
      if (remaining === 1) {
        setActiveKey('1');
      }
    }
  };

  const handleCancelRemove = () => {
    setShowRemoveConfirmation(false);
    setInvoiceToRemove(null);
  };

  const handleDeleteRefundClick = refund => {
    setRefundToDelete(refund);
    setShowDeleteRefundConfirmation(true);
  };

  const handleConfirmDeleteRefund = async () => {
    if (refundToDelete) {
      const isLastRefund = creditNoteData?.refunds?.length === 1;

      await deleteCreditNoteRefund({
        creditNoteId: creditNoteData?._id,
        refundId: refundToDelete?._id,
      });
      getCreditNoteById({ creditNoteId: creditNotesId });
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

  const appliedRows = [
    ...(creditNoteData?.invoicesApplied || []).map(item => ({ ...item, kind: 'invoice' })),
    ...(creditNoteData?.openingBalanceTransactions || []).map(item => ({
      ...item,
      kind: 'openingBalance',
      invoiceNo: item?.transactionNo || `OB-${item?.openingBalanceTransactionId}`,
    })),
  ];
  const totalAppliedAmount = appliedRows.reduce((sum, item) => sum + (item?.amountApplied || 0), 0);

  const RenderCreditApplied = () => {
    return (
      <div className="my-container p-6">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Applied Invoices</h3>
            <p className="text-sm text-gray-600 mt-1">Credit note has been applied to the following invoices</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Invoice No</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Date</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Amount Applied</th>
                  {useModuleCreditNote?.delete && !isViewOnly && <th className="text-center py-4 px-6 font-semibold text-gray-700">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {appliedRows.map(item => (
                  <tr
                    key={item._id}
                    role={item.kind === 'invoice' ? 'button' : undefined}
                    tabIndex={item.kind === 'invoice' ? 0 : undefined}
                    className={`hover:bg-gray-50 transition-colors ${item.kind === 'invoice' ? 'cursor-pointer' : ''}`}
                    onClick={() => item.kind === 'invoice' && handleInvoiceClick(item?.invoiceId)}
                    onKeyDown={e => {
                      if (item.kind === 'invoice' && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        handleInvoiceClick(item?.invoiceId);
                      }
                    }}
                  >
                    <td className="py-4 px-6">
                      <Tag className="font-semibold hover:bg-blue-50 transition-colors">{item?.invoiceNo}</Tag>
                      {item.kind === 'openingBalance' && <span className="ml-2 text-xs text-gray-500">(Customer opening balance)</span>}
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-gray-700">{dateFormateForUi(item?.appliedDate)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-green-600">{formatAmount(item?.amountApplied, true, creditNoteData?.currency)}</span>
                    </td>
                    {useModuleCreditNote?.delete && !isViewOnly && (
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleRemoveClick(item);
                          }}
                          disabled={submitLoading}
                          className="inline-flex items-center justify-center w-8 h-8 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Remove from applied invoices"
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

          {appliedRows.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">
                <Icons.FileTextOutlined className="text-4xl mx-auto" />
              </div>
              <p className="text-gray-500 font-medium">No invoices applied yet</p>
              <p className="text-gray-400 text-sm mt-1">This credit note hasn't been applied to any invoices</p>
            </div>
          )}
        </div>

        {appliedRows.length > 0 && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <Icons.InfoCircleOutlined className="text-blue-500 text-lg mr-3" />
              <div>
                <p className="text-blue-800 font-medium">Credit Applied Summary</p>
                <p className="text-blue-600 text-sm mt-1">Total amount applied: {formatAmount(totalAppliedAmount, true, creditNoteData?.currency)}</p>
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
            <p className="text-sm text-gray-600 mt-1">History of all refunds processed for this credit note</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Refund Date</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">From Account</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Reference</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Notes</th>
                  {useModuleCreditNote?.delete && <th className="text-center py-4 px-6 font-semibold text-gray-700">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {creditNoteData?.refunds?.map((refund, index) => (
                  <tr key={refund._id || index} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <span className="text-gray-700">{dateFormateForUi(refund?.refundDate)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-semibold text-red-600">{formatAmount(refund?.refundAmount, true, creditNoteData?.currency)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-gray-700">{refund?.fromAccountName || '-'}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-gray-700">{refund?.reference || '-'}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-gray-700">{refund?.notes || '-'}</span>
                    </td>
                    {useModuleCreditNote?.delete && (
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

          {(!creditNoteData?.refunds || creditNoteData?.refunds?.length === 0) && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">
                <Icons.FileTextOutlined className="text-4xl mx-auto" />
              </div>
              <p className="text-gray-500 font-medium">No refunds processed yet</p>
              <p className="text-gray-400 text-sm mt-1">Refunds will appear here once processed</p>
            </div>
          )}
        </div>

        {creditNoteData?.refunds?.length > 0 && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <Icons.InfoCircleOutlined className="text-red-500 text-lg mr-3" />
              <div>
                <p className="text-red-800 font-medium">Refund Summary</p>
                <p className="text-red-600 text-sm mt-1">
                  Total amount refunded:{' '}
                  {formatAmount(
                    creditNoteData?.refunds?.reduce((sum, refund) => sum + (refund?.refundAmount || 0), 0),
                    true,
                    creditNoteData?.currency
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
      children: (
        <SalesModuleDetailView
          data={creditNoteData}
          profile={profile}
          pageType={pageTypes?.CREDIT_NOTE}
          isEinvoicingAvailable={isEInvoicingAvailable}
          isEwayBillingAvailable={isOnlyEWayBillAvailable}
        />
      ),
    },
    {
      key: 'stock-movement',
      label: 'Stock Movement',
      children: <StockMovementPanel url={API_ROUTES.SALES.CREDIT_NOTES.STOCK_MOVEMENT(creditNotesId)} onBatchClick={handleBatchClick} />,
    },
    ...(appliedRows.length > 0
      ? [
          {
            key: '3',
            label: 'Credit Applied',
            children: RenderCreditApplied(),
          },
        ]
      : []),
    ...(creditNoteData?.refunds?.length > 0
      ? [
          {
            key: '5',
            label: 'Refund History',
            children: RenderRefundHistory(),
          },
        ]
      : []),
    ...(creditNoteData?.attachments?.length > 0
      ? [
          {
            key: '4',
            label: 'Attachments',
            children: <AttachMentDetails data={creditNoteData} />,
          },
        ]
      : []),
    {
      key: 'journal-entries',
      label: 'Journal',
      children: <DocumentJournalPanel sourceModule={LEDGER_SOURCE_MODULES.CREDIT_NOTE} sourceId={creditNotesId} />,
    },
    {
      key: '6',
      label: 'History',
      children: (
        <CommentHistory
          moduleName={MODULE_NAMES.CREDIT_NOTE}
          referenceId={creditNotesId}
          commentHistory={creditNoteData?.commentHistory}
          canAddComment={useModuleCreditNote?.edit}
          isViewOnly={isViewOnly}
        />
      ),
    },
  ];

  const handleApplyCredit = record => {
    setShowapplyCreditModal(true);
    setSelectedCreditNote(record);
  };

  const handleDeleteClick = () => {
    deleteModal.open(creditNoteData);
  };

  const deleteCreditNote = async () => {
    await removeCreditNote({ creditNoteId: creditNoteData?.id || creditNoteData?._id });
    deleteModal.close();
    navigate('/credit-notes');
  };

  if (loading) {
    return <DetailPageSkeleton />;
  }

  if (!creditNote || isSplitDocumentUnavailable(creditNote, isSplitSessionActive)) {
    return <NoFoundPage docType={MODULE_NAMES?.CREDIT_NOTE} />;
  }

  const handleUpdateStatus = async (creditNoteId, status) => {
    await updateCreditNoteStatus({ creditNoteId, status });
    getCreditNoteById({ creditNoteId });
  };

  const updateCreditNoteStatusDirect = async newStatus => {
    if (newStatus === BACKEND_ENUM?.CANCELLED) {
      cancelStatusModal.open(creditNoteData);
      return;
    }
    await handleUpdateStatus(creditNoteData?.id || creditNoteData?._id, newStatus);
  };

  const confirmCancelStatus = async () => {
    await handleUpdateStatus(creditNoteData?.id || creditNoteData?._id, BACKEND_ENUM?.CANCELLED);
    cancelStatusModal.close();
  };

  const getConvertStatusValue = status => {
    let statusArr = [];

    const cnId = creditNoteData?.id || creditNoteData?._id;
    const markAs = (backendStatus, labelStatus) => ({
      key: `markAs${labelStatus}`,
      label: `Mark As ${labelStatus}`,
      onClick: () => handleUpdateStatus(cnId, backendStatus),
    });
    const draftItem = markAs(BACKEND_ENUM?.DRAFT, CREDIT_NOTE_STATUS?.DRAFT);
    const openItem = markAs(BACKEND_ENUM?.OPEN, CREDIT_NOTE_STATUS?.OPEN);
    const closedItem = markAs(BACKEND_ENUM?.CLOSED, CREDIT_NOTE_STATUS?.CLOSED);
    const cancelItem = {
      key: `markAs${CREDIT_NOTE_STATUS?.CANCELLED}`,
      label: `Mark As ${CREDIT_NOTE_STATUS?.CANCELLED}`,
      onClick: () => updateCreditNoteStatusDirect(BACKEND_ENUM?.CANCELLED),
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

  const dropDownItems = [...getConvertStatusValue(creditNoteData?.status)];
  const statusLabel = CREDIT_NOTE_STATUS?.[creditNoteData?.status] || creditNoteData?.status || '-';
  const isDeletable = creditNoteData ? (creditNoteData?.invoicesApplied?.length ?? 0) === 0 && (creditNoteData?.refunds?.length ?? 0) === 0 : (location.state?.creditNoteData?.isDeletable ?? false);
  const canOpenMore = useModuleCreditNote?.edit && !isViewOnly;
  const canEdit = canOpenMore && !CREDIT_NOTE_EDIT_RESTRICTED_STATUS?.includes(creditNoteData?.status);
  const canApply = canOpenMore && CREDIT_NOTE_APPLIED_STATUS?.includes(creditNoteData?.status);
  const canRefund = canApply && creditNoteData?.availableBalance > 0;
  const canDelete = useModuleCreditNote?.delete && !isViewOnly && Boolean(isDeletable) && !!creditNoteData;
  const canMarkStatus = canOpenMore && !CREDIT_NOTE_STATUS_CHANGE_RESTRICTED_STATUS?.includes(creditNoteData?.status) && dropDownItems.length > 0;
  const markAsTooltip = canMarkStatus
    ? 'Mark Credit Note As'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useModuleCreditNote?.edit
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : `This document status cannot be changed in its current status - ${statusLabel}.`;
  const editTooltip = canEdit
    ? 'Edit Credit Note'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useModuleCreditNote?.edit
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : `This document cannot be edited in its current status - ${statusLabel}.`;
  const applyTooltip = canApply
    ? 'Apply to Invoice'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useModuleCreditNote?.edit
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : `Cannot apply credit note in its current status - ${statusLabel}.`;
  const refundTooltip = canRefund
    ? 'Process Refund'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useModuleCreditNote?.edit
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : creditNoteData?.availableBalance <= 0
          ? 'No available balance to refund.'
          : `Cannot process refund in current status - ${statusLabel}.`;
  const deleteTooltip = canDelete
    ? 'Delete Credit Note'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useModuleCreditNote?.delete
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : `Cannot delete credit note in its current status - ${statusLabel}.`;

  const customerData = {
    id: creditNoteData?.customerId?._id || creditNoteData?.customerId?.id,
    customerDisplayName: creditNoteData?.customerId?.customerDisplayName,
  };

  return (
    <>
      <StatusUpdateLoader loading={submitLoading} hidden={deleteModal.isOpen || cancelStatusModal.isOpen} text="Updating credit note status..." />
      <div className="bg-white border-b border-gray-100 px-4 py-4 -m-4">
        <div className="flex items-center justify-between">
          <PageHeader
            title={
              <div className="flex items-center gap-3">
                <BackButton />

                <div className="flex flex-col">
                  <h1 className="text-[18px] font-semibold text-heading leading-6">Credit Notes Details</h1>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-medium text-gray-600">{creditNoteData?.creditNoteId}</span>

                    <span className="text-gray-400">•</span>

                    <StatusBadge status={creditNoteData?.status} value={CREDIT_NOTE_STATUS?.[creditNoteData?.status]} />
                  </div>
                </div>
              </div>
            }
            rightStats={[
              {
                label: 'Total Amount',
                value: formatAmount(creditNoteData?.total || 0, true, creditNoteData?.currency),
              },
              {
                label: 'Used Credit',
                value: formatAmount(totalAppliedAmount || 0, true, creditNoteData?.currency),
                colorClass: 'text-green-600',
              },
              {
                label: 'Unused Credit',
                value: formatAmount(creditNoteData?.availableBalance || 0, true, creditNoteData?.currency),
                colorClass: 'text-blue-600',
              },
            ]}
          />

          {/* Quick Actions */}
          <div className="flex items-center space-x-3">
            <DocumentRefreshButton onRefresh={handleRefresh} />
            {creditNoteData?.customerId && (
              <Button type="default" size="middle" icon={<Icons.ExportOutlined className="mr-2" />} onClick={() => setViewCustomerDetail(true)} className="flex items-center">
                View Customer
              </Button>
            )}
            <GstDocumentPdfActions
              document={creditNoteData}
              documentLabel="Credit Note"
              documentNumber={creditNoteData?.creditNoteId}
              fileName={generateSafeFileName(creditNoteData, 'creditNoteId')}
              renderPdf={pdfFlags => (
                <ShowPDF
                  data={creditNoteData}
                  billingAddress={creditNoteData?.customerId?.address?.billing}
                  shippingAddress={creditNoteData?.shippingAddress}
                  profile={profile}
                  pageType={pageTypes.CREDIT_NOTE}
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

        <div className="xl:mt-[62px] h-fit w-full xl:w-[250px] space-y-3">
          <div className="space-y-3">
            <ActionButtons>
              {canMarkStatus ? (
                <Dropdown menu={{ items: dropDownItems }} placement="bottom" trigger={['click']}>
                  <Button type="primary" className="px-4 py-2 w-full" disabled={submitLoading} block>
                    {submitLoading ? <CustomLoader variant="button" text="Updating..." /> : 'Mark Credit Note As'}
                  </Button>
                </Dropdown>
              ) : (
                <Tooltip title={markAsTooltip} placement="left">
                  <span className="block w-full">
                    <Button type="primary" className="px-4 py-2 w-full" disabled block>
                      Mark Credit Note As
                    </Button>
                  </span>
                </Tooltip>
              )}

              {/* E-invoice (credit note) and e-way bill (sales return) */}
              <GstDocumentPanel
                basePath={API_ROUTES.SALES.CREDIT_NOTES.BASE}
                documentId={creditNoteData?._id || creditNoteData?.id}
                document={creditNoteData}
                documentLabel="Credit Note"
                contextItems={[
                  { label: 'Credit Note#', value: creditNoteData?.creditNoteId },
                  { label: 'Customer Name', value: creditNoteData?.customerId?.customerDisplayName || creditNoteData?.customerDisplayName },
                ]}
                canGenerate={Boolean(useModuleCreditNote?.edit) && !isViewOnly && !creditNoteData?.isSplit && ![BACKEND_ENUM?.DRAFT, BACKEND_ENUM?.CANCELLED].includes(creditNoteData?.status)}
                onChanged={() => getCreditNoteById({ creditNoteId: creditNotesId })}
              />
              <PermissionButton
                canAccess={useModuleCreditNote?.edit}
                isViewOnly={isViewOnly}
                disabled={!CREDIT_NOTE_APPLIED_STATUS?.includes(creditNoteData?.status) || submitLoading}
                tooltipTitle={applyTooltip}
                tooltipProps={{ placement: 'left' }}
                wrapperClassName="block w-full"
                type="primary"
                icon={<Icons.FileSyncOutlined />}
                className="px-4 py-2 w-full"
                block
                onClick={canApply ? () => handleApplyCredit(creditNoteData) : undefined}
              >
                {submitLoading ? <CustomLoader variant="button" text="Applying..." /> : 'Apply to Invoice'}
              </PermissionButton>
              <PermissionButton
                canAccess={useModuleCreditNote?.edit}
                isViewOnly={isViewOnly}
                disabled={!CREDIT_NOTE_APPLIED_STATUS?.includes(creditNoteData?.status) || creditNoteData?.availableBalance <= 0 || submitLoading}
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
                        setSelectedCreditNote(creditNoteData);
                      }
                    : undefined
                }
              >
                {submitLoading ? <CustomLoader variant="button" text="Processing..." /> : 'Refund'}
              </PermissionButton>
              <PermissionButton
                canAccess={useModuleCreditNote?.edit}
                isViewOnly={isViewOnly}
                disabled={CREDIT_NOTE_EDIT_RESTRICTED_STATUS?.includes(creditNoteData?.status) || submitLoading}
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
                canAccess={useModuleCreditNote?.delete}
                isViewOnly={isViewOnly}
                disabled={!isDeletable || !creditNoteData || deleteLoading}
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

            <DocumentMetadata data={creditNoteData} />

            {creditNoteData?.rejectionOrderDetails?.rejectionOrderRef && (
              <ConversionBadges convertedFrom={[creditNoteData.rejectionOrderDetails]} convertedFromLabel="Converted From Rejection Order" onConvertedFromClick={() => setShowConvertFromModal(true)} />
            )}

            <OrganizationInfo data={creditNoteData} />
          </div>
        </div>
      </div>
      {showConvertFromModal && (
        <ConvertFromDetail
          open={showConvertFromModal}
          onClose={() => setShowConvertFromModal(false)}
          convertFromData={creditNoteData?.rejectionOrderDetails}
          from="REJECTION_ORDER"
          type="REJECTION_ORDER"
          data={creditNoteData}
        />
      )}
      <ApplyCreditModal
        onClose={() => setShowapplyCreditModal(false)}
        modalOpen={showapplyCreditModal}
        creditNoteDetails={selectedCreditNote}
        fetchCreditNotes={() => {
          getCreditNoteById({ creditNoteId: creditNotesId });
        }}
      />
      {/* Refund Modal */}
      <RefundModal
        variant="credit"
        modalOpen={showRefundModal}
        onClose={() => setShowRefundModal(false)}
        documentDetails={selectedCreditNote}
        fetchAfterRefund={() => {
          getCreditNoteById({ creditNoteId: creditNotesId });
        }}
      />
      {/* Remove Confirmation Modal */}
      <ConfirmRemoveModal
        modalOpen={showRemoveConfirmation}
        setModalOpen={setShowRemoveConfirmation}
        title="Remove Applied Invoice"
        description="Are you sure you want to remove this invoice from the applied list?"
        itemToRemove={invoiceToRemove}
        onConfirm={handleConfirmRemove}
        onCancel={handleCancelRemove}
        loading={submitLoading}
        importantNoteText="Removing this invoice will release the applied amount back to the balance. This action cannot be undone."
      />
      <DocumentConfirmModal modal={deleteModal} docType={MODULE_NAMES?.CREDIT_NOTE} onConfirm={deleteCreditNote} loading={deleteLoading} getDocumentDetails={getCreditNoteDocumentDetails} />
      <DocumentConfirmModal
        modal={cancelStatusModal}
        docType={MODULE_NAMES?.CREDIT_NOTE}
        loading={submitLoading}
        mode="status"
        onConfirm={confirmCancelStatus}
        getDocumentDetails={getCreditNoteDocumentDetails}
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
        loading={creditNoteRefundLoading}
        importantNoteText="Removing this refund will release the applied amount back to the balance. This action cannot be undone."
      />
      {viewCustomerDetail && <CustomerDrawerDetails viewCustomerDetail={viewCustomerDetail} setViewCustomerDetail={setViewCustomerDetail} customerData={customerData} />}
      <BatchDetailsDrawer open={batchDrawerOpen} batch={itemInventoryBatch} loading={itemInventoryBatchLoading} onClose={handleBatchDrawerClose} />
    </>
  );
};

export default CreditNotesDetail;
