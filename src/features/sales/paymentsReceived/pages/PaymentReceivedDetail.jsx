import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { PDFDownloadLink } from '@/components/ui/common/PdfDownloadLinkLazy';
import { renderPdfToBlob } from '@/utils/loadReactPdf';

// Components
import { Button, DatePicker, Input, Tabs, Tag } from '@/components/AntDComponent';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import ApplyToInvoiceModal from '../components/ApplyToInvoiceModal';
import RefundHistoryTab from '@/components/ui/common/RefundHistoryTab';
import RefundPaymentModal from '@/components/feedback/formModal/RefundPaymentModal';
import AttachMentDetails from '@/components/feedback/formModal/AttachMentDetails';
import BackButton from '@/components/ui/button/BackButton';
import DocumentRefreshButton from '@/components/ui/button/DocumentRefreshButton';
import ConfirmRemoveModal from '@/components/feedback/confirmModal/ConfirmRemoveModal';
import CustomerDrawerDetails from '@/features/sales/customer/components/CustomerDrawerDetails';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import { DocumentConfirmModal } from '@/components/feedback/confirmModal/CancelOrDeleteDocumentModal';
import PaymentReceivedDetailSkeleton from '../components/PaymentReceivedDetailSkeleton';
import { ActionButtons, ApprovedBy, DocumentMetadata, OrganizationInfo } from '@/components/ui';
import { CommentHistory } from '@/features/common/comment';
import SalesModuleTreeView from '@/components/dataDisplay/statCard/SalesModuleTreeView';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import NoFoundPage from '@/components/ui/common/NoFoundPage';
import PageHeader from '@/components/ui/common/PageHeader';
import CustomButton from '@/components/ui/button/CustomButton';
import { PaymentPdf } from '@/components/ui/common/PaymentPdfLazy';
import { paymentPdfFileName } from '@smit9313/abss-pdf';
import Toast from '@/components/ui/common/Toast';
import { colorPalette } from '@/utils/theme';

// Hooks
import { useUser } from '@/features/setting/user/useUser';
import { useConfirmModal } from '@/hooks/useConfirmModal';
import useModulePermissions from 'hooks/useModulePermissions';
import { useProfile } from '@/features/setting/profile/useProfile';

// Extras
import { getPaymentReceivedDocumentDetails, usePaymentReceived } from '@/features/sales/paymentsReceived';
import Icons from 'assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { CHEQUE_STATUS, MODULE_NAMES, PAYMENT_RECEIVED_STATUS, PAYMENT_MODES, getPaymentReceivedTypeBadgeProps, LEDGER_SOURCE_MODULES, PERMISSION_MESSAGES } from '@/utils/constants';
import DocumentJournalPanel from '@/components/dataDisplay/DocumentJournalPanel';
import { isSplitDocumentUnavailable } from 'utils/services';
import { formatAmount } from '@/utils/currency';

const { TextArea } = Input;

const PaymentReceivedDetail = () => {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeKey, setActiveKey] = useState('1');
  const { useModulePaymentReceived, isViewOnly, isSplitSessionActive } = useModulePermissions(RESOURCES.PAYMENT_RECEIVED);
  const { accessRoles } = useUser();
  const { profile, getProfile } = useProfile();
  const {
    loading,
    submitLoading,
    deleteLoading,
    approveLoading,
    rejectLoading,
    cancelLoading,
    paymentReceived,
    resetPaymentReceived,
    getPaymentRecivedById,
    removeApplyInvoice,
    removeApplyInvoiceLoading,
    approvePaymentsRecived,
    rejectPaymentsRecived,
    cancelPaymentsRecived,
    removePaymentsRecived,
    deleteRefund,
    refundLoading,
  } = usePaymentReceived();
  const paymentReceivedData = paymentReceived;
  const [showRemoveConfirmation, setShowRemoveConfirmation] = useState(false);
  const [invoiceToRemove, setInvoiceToRemove] = useState(null);
  const deleteModal = useConfirmModal();
  const [showApplyToInvoiceModal, setShowApplytoInvoiceModal] = useState(false);
  const [showRefundPaymentReceivedModal, setShowRefundPaymentReceivedModal] = useState(false);
  const [refundBeingEdited, setRefundBeingEdited] = useState(null);
  const [showRefundDeleteConfirm, setShowRefundDeleteConfirm] = useState(false);
  const [refundPendingDelete, setRefundPendingDelete] = useState(null);
  const [approvalModal, setApprovalModal] = useState({
    visible: false,
    approvalNote: '',
    depositDate: dayjs().format('YYYY-MM-DD'),
    clearingDate: null,
    chequeReceivedDate: dayjs().format('YYYY-MM-DD'),
    chequeApprovalNote: '',
  });
  const [cancelModal, setCancelModal] = useState({
    visible: false,
    note: '',
  });
  const [viewCustomerDetail, setViewCustomerDetail] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    getProfile({ signal: controller.signal });
    return () => controller.abort();
  }, [getProfile]);

  useEffect(() => {
    const controller = new AbortController();
    if (paymentId) {
      getPaymentRecivedById({ paymentId, signal: controller.signal });
    }

    return () => {
      controller.abort();
      resetPaymentReceived();
    };
  }, [paymentId, isSplitSessionActive, getPaymentRecivedById, resetPaymentReceived]);

  const handleRefresh = async () => {
    await getPaymentRecivedById({ paymentId });
  };

  const handlePrint = async () => {
    try {
      const blob = await renderPdfToBlob(<PaymentPdf data={paymentReceivedData} profile={profile} variant="received" />);
      const blobUrl = URL.createObjectURL(blob);
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = blobUrl;
      document.body.appendChild(iframe);
      iframe.onload = () => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      };
    } catch (error) {
      Toast.error('Failed to generate the payment PDF. Please try again.');
    }
  };

  const handleEditClick = () => {
    resetPaymentReceived();
    navigate(`/payments-received/${paymentReceivedData?.id || paymentReceivedData?._id}/edit`, {
      state: {
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleDeleteClick = () => {
    deleteModal.open(paymentReceivedData);
  };

  const deletePaymentReceived = async () => {
    await removePaymentsRecived({
      paymentId: paymentReceivedData?.id || paymentReceivedData?._id,
    });
    deleteModal.close();
    navigate('/payments-received');
  };

  const handleApprovedModalClick = () => {
    const isReceiveChequeApproval =
      paymentReceivedData?.paymentMode?.toLowerCase() === PAYMENT_MODES.CHEQUE?.toLowerCase() && paymentReceivedData?.chequeStatus?.toLowerCase() === CHEQUE_STATUS.PENDING.toLowerCase();
    const isDepositCheque =
      paymentReceivedData?.paymentMode?.toLowerCase() === PAYMENT_MODES.CHEQUE?.toLowerCase() && paymentReceivedData?.chequeStatus?.toLowerCase() === CHEQUE_STATUS.RECEIVED.toLowerCase();

    setApprovalModal({
      visible: true,
      approvalNote: paymentReceivedData?.approvalNote || '',
      chequeReceivedDate: paymentReceivedData?.chequeReceivedDate ? dayjs(paymentReceivedData.chequeReceivedDate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
      depositDate: isReceiveChequeApproval
        ? null
        : paymentReceivedData?.depositDate
          ? dayjs(paymentReceivedData.depositDate).format('YYYY-MM-DD')
          : isDepositCheque
            ? dayjs().format('YYYY-MM-DD')
            : null,
      clearingDate: paymentReceivedData?.clearingDate ? dayjs(paymentReceivedData.clearingDate).format('YYYY-MM-DD') : null,
      chequeApprovalNote: paymentReceivedData?.chequeApprovalNote || '',
    });
  };

  const handleApprovePayment = async () => {
    const isReceiveChequeApproval =
      paymentReceivedData?.paymentMode?.toLowerCase() === PAYMENT_MODES.CHEQUE?.toLowerCase() && paymentReceivedData?.chequeStatus?.toLowerCase() === CHEQUE_STATUS.PENDING?.toLowerCase();

    await approvePaymentsRecived({
      paymentId: paymentReceivedData?.id || paymentReceivedData?._id,
      notes: {
        approvalNote: approvalModal.approvalNote,
        depositDate: isReceiveChequeApproval ? null : approvalModal.depositDate,
        clearingDate: approvalModal.clearingDate,
        chequeReceivedDate: approvalModal.chequeReceivedDate,
        ...(paymentReceivedData?.paymentMode?.toLowerCase() === PAYMENT_MODES.CHEQUE?.toLowerCase() && {
          chequeApprovalNote: approvalModal.chequeApprovalNote,
        }),
      },
    });
    setApprovalModal({
      visible: false,
      approvalNote: '',
      depositDate: dayjs().format('YYYY-MM-DD'),
      clearingDate: null,
      chequeReceivedDate: dayjs().format('YYYY-MM-DD'),
      chequeApprovalNote: '',
    });
    getPaymentRecivedById({ paymentId });
  };

  const handleRejectPayment = async () => {
    await rejectPaymentsRecived({
      paymentId: paymentReceivedData?.id || paymentReceivedData?._id,
      notes: {
        approvalNote: approvalModal.approvalNote,
        chequeReceivedDate: approvalModal.chequeReceivedDate,
        ...(paymentReceivedData?.paymentMode?.toLowerCase() === PAYMENT_MODES.CHEQUE?.toLowerCase() && {
          chequeApprovalNote: approvalModal.chequeApprovalNote,
        }),
      },
    });
    setApprovalModal({
      visible: false,
      approvalNote: '',
      depositDate: dayjs().format('YYYY-MM-DD'),
      clearingDate: null,
      chequeReceivedDate: dayjs().format('YYYY-MM-DD'),
      chequeApprovalNote: '',
    });
    getPaymentRecivedById({ paymentId });
  };

  const handleCancelModalClick = () => {
    setCancelModal({
      visible: true,
      note: '',
    });
  };

  const handleCancelPayment = async () => {
    await cancelPaymentsRecived({
      paymentId: paymentReceivedData?.id || paymentReceivedData?._id,
      notes: { notes: cancelModal.note },
    });
    setCancelModal({ visible: false, note: '' });
    getPaymentRecivedById({ paymentId });
  };

  const statusLabel = PAYMENT_RECEIVED_STATUS?.[paymentReceivedData?.status] || paymentReceivedData?.status || '-';
  const isCancelled = paymentReceivedData?.status === 'CANCELLED';
  const canEditAction = useModulePaymentReceived?.edit && !isViewOnly;
  const canEdit = canEditAction && paymentReceivedData?.status === 'PENDING';
  const canDelete = useModulePaymentReceived?.delete && !isViewOnly && (paymentReceivedData?.status === 'PENDING' || paymentReceivedData?.status === 'APPROVED');
  const canApprove = canEditAction && accessRoles?.isAccountant && paymentReceivedData?.status === 'PENDING';
  const canRemoveApplication = canEditAction && paymentReceivedData?.status === 'APPROVED';
  const canCancel = canEditAction && accessRoles?.isAccountant && (paymentReceivedData?.status === 'APPROVED' || paymentReceivedData?.status === 'REJECTED');
  const canApplyToInvoice = canEditAction && paymentReceivedData?.status === 'APPROVED' && (paymentReceivedData?.availableBalance > 0 || paymentReceivedData?.unusedAmount > 0);
  const canRefund = canEditAction && paymentReceivedData?.status === 'APPROVED' && Number(paymentReceivedData?.unusedAmount) > 0;

  const editTooltip = canEdit
    ? 'Edit Payment'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useModulePaymentReceived?.edit
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : `Cannot edit payment in status: ${statusLabel}.`;
  const deleteTooltip = canDelete
    ? 'Delete Payment'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useModulePaymentReceived?.delete
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : `Cannot delete payment in status: ${statusLabel}.`;
  const statusChangeTooltip = isViewOnly
    ? PERMISSION_MESSAGES.VIEW_ONLY
    : !useModulePaymentReceived?.edit || !accessRoles?.isAccountant
      ? PERMISSION_MESSAGES.NO_PERMISSION
      : isCancelled
        ? 'Payment is cancelled.'
        : `Cannot change payment in status: ${statusLabel}.`;
  const cancelTooltip = canCancel
    ? 'Cancel Payment'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useModulePaymentReceived?.edit || !accessRoles?.isAccountant
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : isCancelled
          ? 'Payment is already cancelled.'
          : `Cannot cancel in status: ${statusLabel}.`;
  const applyToInvoiceTooltip = canApplyToInvoice
    ? 'Apply Payment to Invoice'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useModulePaymentReceived?.edit
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : isCancelled
          ? 'Payment is cancelled.'
          : paymentReceivedData?.status !== 'APPROVED'
            ? `Cannot apply to invoice in status: ${statusLabel}.`
            : 'No available balance to apply to invoice.';
  const refundTooltip = canRefund
    ? 'Refund'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useModulePaymentReceived?.edit
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : isCancelled
          ? 'Payment is cancelled.'
          : paymentReceivedData?.status !== 'APPROVED'
            ? `Cannot refund in status: ${statusLabel}.`
            : 'No unused amount to refund.';

  const handleApplyToInvoice = () => {
    setShowApplytoInvoiceModal(true);
  };

  const handleRefundPaymentReceived = () => {
    setRefundBeingEdited(null);
    setShowRefundPaymentReceivedModal(true);
  };

  const closeRefundPaymentReceivedModal = () => {
    setShowRefundPaymentReceivedModal(false);
    setRefundBeingEdited(null);
  };

  const handleEditRefundRow = useCallback(row => {
    setRefundBeingEdited(row);
    setShowRefundPaymentReceivedModal(true);
  }, []);

  const handleDeleteRefundClick = useCallback(row => {
    setRefundPendingDelete(row);
    setShowRefundDeleteConfirm(true);
  }, []);

  const handleConfirmDeleteRefund = async () => {
    if (!refundPendingDelete) return;
    try {
      await deleteRefund({
        paymentReceivedId: paymentReceivedData?._id,
        refundId: refundPendingDelete._id,
      });
      getPaymentRecivedById({ paymentId });
    } catch {
      /* slice */
    }
    setShowRefundDeleteConfirm(false);
    setRefundPendingDelete(null);
  };

  const handleCancelDeleteRefund = () => {
    setShowRefundDeleteConfirm(false);
    setRefundPendingDelete(null);
  };

  const getApproveLabel = () => {
    if (paymentReceivedData?.chequeStatus === CHEQUE_STATUS.PENDING) {
      return 'Receive Cheque Approval';
    } else if (paymentReceivedData?.chequeStatus === CHEQUE_STATUS.RECEIVED) {
      return 'Deposit Cheque';
    }
    return 'Approve';
  };

  const formatDate = isoDate => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatEnumKey = key => {
    if (!key) return '';
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const handleRemoveClick = useCallback(item => {
    setInvoiceToRemove(item);
    setShowRemoveConfirmation(true);
  }, []);

  const handleConfirmRemove = async () => {
    if (!invoiceToRemove) return;

    let removedLine;
    if (invoiceToRemove.invoiceId) removedLine = { invoiceId: invoiceToRemove._id };
    else if (invoiceToRemove.expenseId) removedLine = { expenseLineId: invoiceToRemove._id };
    else removedLine = { openingBalanceLineId: invoiceToRemove._id };

    await removeApplyInvoice({ paymentId, ...removedLine });
    getPaymentRecivedById({ paymentId });
    setShowRemoveConfirmation(false);
    setInvoiceToRemove(null);
  };

  const handleCancelRemove = () => {
    setShowRemoveConfirmation(false);
    setInvoiceToRemove(null);
  };

  const items = useMemo(
    () => [
      {
        key: '1',
        label: 'Basic Info',
        children: (
          <div className="space-y-6 my-container p-6">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">Payment Details</h3>
              </div>

              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                  <div>
                    <div className="text-xs font-medium text-gray-500">Party Name</div>
                    <div className="mt-1 text-sm font-medium text-gray-900">{paymentReceivedData?.customerId?.customerDisplayName || '-'}</div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-gray-500">Payment Date</div>
                    <div className="mt-1 text-sm font-medium text-gray-900">{paymentReceivedData?.paymentDate ? dayjs(paymentReceivedData?.paymentDate).format('DD/MM/YYYY') : '-'}</div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-gray-500">Amount Received</div>
                    <div className="mt-1 text-sm font-medium text-gray-900">{formatAmount(paymentReceivedData?.amountReceived || 0, true, paymentReceivedData?.currency)}</div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-gray-500">Payment Mode</div>
                    <div className="mt-1 text-sm font-medium text-gray-900">{formatEnumKey(paymentReceivedData?.paymentMode) || '-'}</div>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="text-xs font-medium text-gray-500">Notes</div>
                  <div className="mt-1 text-sm text-gray-900 whitespace-pre-wrap break-words">{paymentReceivedData?.notes || '-'}</div>
                </div>

                <div className="mt-5">
                  <div className="text-xs font-medium text-gray-500">Approval Notes</div>
                  <div className="mt-1 text-sm text-gray-900 whitespace-pre-wrap break-words">{paymentReceivedData?.approvalNote || '-'}</div>
                </div>

                {paymentReceivedData?.chequeApprovalNote && (
                  <div className="mt-5">
                    <div className="text-xs font-medium text-gray-500">Cheque Approval Note</div>
                    <div className="mt-1 text-sm text-gray-900 whitespace-pre-wrap break-words">{paymentReceivedData.chequeApprovalNote}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Keep all other data (do not remove), just present neatly */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">More Details</h3>
              </div>
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  <div>
                    <span className="font-semibold text-gray-600">Payment Received: </span>
                    <span className="text-gray-900">{paymentReceivedData?.paymentReceivedId || '-'}</span>
                  </div>

                  {paymentReceivedData?.paymentMode !== 'CASH' && (
                    <div>
                      <span className="font-semibold text-gray-600">Deposit To: </span>
                      <span className="text-gray-900">{paymentReceivedData?.depositToAccountId?.accountName || '-'}</span>
                    </div>
                  )}

                  {paymentReceivedData?.paymentMode?.toLowerCase() === PAYMENT_MODES.CHEQUE.toLowerCase() && (
                    <div>
                      <span className="font-semibold text-gray-600">Cheque Status: </span>
                      <span className="text-gray-900">{formatEnumKey(paymentReceivedData?.chequeStatus) || '-'}</span>
                    </div>
                  )}

                  {paymentReceivedData?.paymentMode?.toLowerCase() === PAYMENT_MODES.CHEQUE.toLowerCase() && (
                    <div>
                      <span className="font-semibold text-gray-600">Deposit Date: </span>
                      <span className="text-gray-900">{paymentReceivedData?.depositDate ? formatDate(paymentReceivedData?.depositDate) : '-'}</span>
                    </div>
                  )}

                  {paymentReceivedData?.paymentMode?.toLowerCase() === PAYMENT_MODES.CHEQUE.toLowerCase() && (
                    <div>
                      <span className="font-semibold text-gray-600">Clearing Date: </span>
                      <span className="text-gray-900">{paymentReceivedData?.clearingDate ? formatDate(paymentReceivedData?.clearingDate) : '-'}</span>
                    </div>
                  )}

                  {paymentReceivedData?.paymentMode?.toLowerCase() === PAYMENT_MODES.CHEQUE.toLowerCase() && paymentReceivedData?.chequeApprovalNote && (
                    <div className="md:col-span-2">
                      <span className="font-semibold text-gray-600">Cheque Approval Note: </span>
                      <span className="text-gray-900 whitespace-pre-wrap break-words">{paymentReceivedData?.chequeApprovalNote}</span>
                    </div>
                  )}

                  {paymentReceivedData?.reference && (
                    <div className="md:col-span-2">
                      <span className="font-semibold text-gray-600">Reference: </span>
                      <span className="text-gray-900">{paymentReceivedData?.reference}</span>
                    </div>
                  )}

                  <div>
                    <span className="font-semibold text-gray-600">Tax Deducted: </span>
                    <span className="text-gray-900">{paymentReceivedData?.taxDeducted ? 'Yes, TDS (Income Tax)' : 'No Tax deducted'}</span>
                  </div>

                  {paymentReceivedData?.taxDeducted && (
                    <div>
                      <span className="font-semibold text-gray-600">TDS Account: </span>
                      <span className="text-gray-900">{paymentReceivedData?.tdsAccountId?.accountName || '-'}</span>
                    </div>
                  )}
                </div>

                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-start">
                    <StatusBadge {...getPaymentReceivedTypeBadgeProps(paymentReceivedData)} />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-md font-semibold text-gray-800 mb-4">Invoice Details</h2>
              <div className="overflow-auto">
                <table className="w-full border border-gray-200 rounded-md overflow-hidden">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="text-left p-3 border-b">Invoice No</th>
                      <th className="text-left p-3 border-b">Invoice Date</th>
                      <th className="text-left p-3 border-b">Applied Date</th>
                      <th className="text-left p-3 border-b">Invoice Amount</th>
                      <th className="text-left p-3 border-b">Amount Due</th>
                      {paymentReceivedData?.taxDeducted && <th className="text-left p-3 border-b">TDS</th>}
                      <th className="text-left p-3 border-b">Payment</th>
                      {canRemoveApplication && <th className="text-left p-3 border-b">Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {(paymentReceivedData?.openingBalanceTransactions || []).map((ob, idx) => {
                      const t = ob.openingBalanceTransaction || {};
                      return (
                        <tr key={`ob-${idx}`} className="hover:bg-gray-50 bg-amber-50/40">
                          <td className="p-3 border-b">
                            <Tag className="font-semibold">{ob.transactionNo || t.transactionNo || '-'}</Tag>
                            <div className="text-xs text-gray-500 mt-0.5">(Customer opening balance)</div>
                          </td>
                          <td className="p-3 border-b">{formatDate(t.date)}</td>
                          <td className="p-3 border-b">{formatDate(ob.appliedDate)}</td>
                          <td className="p-3 border-b">{t.amount != null ? formatAmount(t.amount, true, paymentReceivedData?.currency) : '-'}</td>
                          <td className="p-3 border-b">{formatAmount(Number(t.remainingAmount), true, paymentReceivedData?.currency)}</td>
                          {paymentReceivedData?.taxDeducted && <td className="p-3 border-b">-</td>}
                          <td className="p-3 border-b">{formatAmount(ob.amountApplied, true, paymentReceivedData?.currency)}</td>
                          {canRemoveApplication && (
                            <td className="p-3 border-b">
                              <Icons.DeleteOutlined style={{ fontSize: 17, color: colorPalette.error[500], cursor: 'pointer' }} onClick={() => handleRemoveClick(ob)} />
                            </td>
                          )}
                        </tr>
                      );
                    })}
                    {(paymentReceivedData?.invoices || []).map((inv, idx) => (
                      <tr key={`inv-${idx}`} className="hover:bg-gray-50">
                        <td className="p-3 border-b">
                          {inv?.invoiceId?._id ? (
                            <Link to={`/invoices/${inv?.invoiceId?._id}`}>
                              <Tag className="font-semibold">{inv?.invoiceNo}</Tag>
                            </Link>
                          ) : (
                            <Tag className="font-semibold">{inv?.invoiceNo || '-'}</Tag>
                          )}
                        </td>
                        <td className="p-3 border-b">{formatDate(inv?.invoiceId?.invoiceDate)}</td>
                        <td className="p-3 border-b">{formatDate(inv?.appliedDate)}</td>
                        <td className="p-3 border-b">{inv?.invoiceId?.total != null ? formatAmount(inv.invoiceId.total, true, paymentReceivedData?.currency) : '-'}</td>
                        <td className="p-3 border-b">{inv?.invoiceId?.balanceAmount != null ? formatAmount(inv.invoiceId.balanceAmount, true, paymentReceivedData?.currency) : '-'}</td>
                        {paymentReceivedData?.taxDeducted && <td className="p-3 border-b">{formatAmount(inv?.tdsAmount || 0, true, paymentReceivedData?.currency)}</td>}
                        <td className="p-3 border-b">{formatAmount(inv?.amountApplied, true, paymentReceivedData?.currency)}</td>
                        {canRemoveApplication && (
                          <td className="p-3 border-b">
                            <Icons.DeleteOutlined
                              style={{ fontSize: 17, color: colorPalette.error[500], cursor: 'pointer' }}
                              onClick={() => {
                                handleRemoveClick(inv);
                              }}
                            />
                          </td>
                        )}
                      </tr>
                    ))}
                    {(paymentReceivedData?.expenses || []).map((expense, idx) => (
                      <tr key={`expense-${idx}`} className="hover:bg-gray-50">
                        <td className="p-3 border-b">
                          <Link to={`/expenses/${expense.expenseId._id}`}>
                            <Tag className="font-semibold">{expense.expenseNo}</Tag>
                          </Link>
                        </td>
                        <td className="p-3 border-b">{formatDate(expense.expenseId.date)}</td>
                        <td className="p-3 border-b">{formatDate(expense.appliedDate)}</td>
                        <td className="p-3 border-b">{formatAmount(expense.expenseId.total, true, paymentReceivedData?.currency)}</td>
                        <td className="p-3 border-b">{formatAmount(expense.expenseId.balanceAmount, true, paymentReceivedData?.currency)}</td>
                        {paymentReceivedData?.taxDeducted && <td className="p-3 border-b">-</td>}
                        <td className="p-3 border-b">{formatAmount(expense.amountApplied, true, paymentReceivedData?.currency)}</td>
                        {canRemoveApplication && (
                          <td className="p-3 border-b">
                            <Icons.DeleteOutlined style={{ fontSize: 17, color: colorPalette.error[500], cursor: 'pointer' }} onClick={() => handleRemoveClick(expense)} />
                          </td>
                        )}
                      </tr>
                    ))}
                    {!((paymentReceivedData?.openingBalanceTransactions || []).length > 0 || (paymentReceivedData?.invoices || []).length > 0 || (paymentReceivedData?.expenses || []).length > 0) && (
                      <tr>
                        <td className="p-3 text-center text-gray-500" colSpan={(canRemoveApplication ? 7 : 6) + (paymentReceivedData?.taxDeducted ? 1 : 0)}>
                          No applications yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notes is shown in Payment Details card above */}
          </div>
        ),
      },
      ...(paymentReceivedData?.attachments?.length > 0
        ? [
            {
              key: '2',
              label: 'Attachments',
              children: <AttachMentDetails data={paymentReceivedData} />,
            },
          ]
        : []),
      {
        key: '3',
        label: 'Document Flow',
        children: <SalesModuleTreeView moduleTree={paymentReceivedData?.moduleTree} sourceModule="paymentReceived" currency={paymentReceivedData?.currency} />,
      },
      ...(paymentReceivedData?.refunds?.length > 0
        ? [
            {
              key: '4',
              label: 'Refund History',
              children: (
                <RefundHistoryTab
                  refunds={paymentReceivedData.refunds}
                  paymentDocNo={paymentReceivedData?.paymentReceivedId}
                  paymentStatus={paymentReceivedData?.status}
                  statusValueMap={PAYMENT_RECEIVED_STATUS}
                  canManageRefunds={paymentReceivedData?.status === 'APPROVED' && useModulePaymentReceived?.edit && !isViewOnly}
                  onEditRefund={handleEditRefundRow}
                  onDeleteRefund={handleDeleteRefundClick}
                  currency={paymentReceivedData?.currency}
                />
              ),
            },
          ]
        : []),
      {
        key: 'journal-entries',
        label: 'Journal',
        children: <DocumentJournalPanel sourceModule={LEDGER_SOURCE_MODULES.PAYMENT_RECEIVED} sourceId={paymentId} />,
      },
      {
        key: '5',
        label: 'History',
        children: (
          <CommentHistory
            moduleName={MODULE_NAMES.PAYMENT_RECEIVED}
            referenceId={paymentId}
            commentHistory={paymentReceivedData?.commentHistory}
            canAddComment={useModulePaymentReceived?.edit}
            isViewOnly={isViewOnly}
          />
        ),
      },
    ],
    [paymentReceivedData, canRemoveApplication, useModulePaymentReceived?.edit, isViewOnly, handleRemoveClick, handleEditRefundRow, handleDeleteRefundClick]
  );

  useEffect(() => {
    if (!items.some(tab => tab.key === activeKey)) {
      setActiveKey('1');
    }
  }, [items, activeKey]);

  const customerData = {
    id: paymentReceivedData?.customerId?._id || paymentReceivedData?.customerId?.id,
    customerDisplayName: paymentReceivedData?.customerId?.customerDisplayName,
  };

  if (loading) return <PaymentReceivedDetailSkeleton />;

  if (!paymentReceivedData?._id && !paymentReceivedData?.id) {
    return <NoFoundPage docType={MODULE_NAMES.PAYMENT_RECEIVED} />;
  }

  if (isSplitDocumentUnavailable(paymentReceivedData, isSplitSessionActive)) {
    return <NoFoundPage docType={MODULE_NAMES.PAYMENT_RECEIVED} />;
  }

  return (
    <>
      <div className="bg-white border-b border-gray-100 px-4 py-4 -m-4">
        <div className="flex items-center justify-between">
          <PageHeader
            title={
              <div className="flex items-center gap-3">
                <BackButton />

                <div className="flex flex-col">
                  <h1 className="text-[18px] font-semibold text-heading leading-6">Payment Received Details</h1>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-medium text-gray-600">{paymentReceivedData?.paymentReceivedId}</span>

                    <span className="text-gray-400">•</span>

                    <StatusBadge status={paymentReceivedData?.status} value={PAYMENT_RECEIVED_STATUS?.[paymentReceivedData?.status] || paymentReceivedData?.status} />
                  </div>
                </div>
              </div>
            }
            rightStats={[
              {
                label: 'Total Amount',
                value: formatAmount(paymentReceivedData?.amountReceived || 0, true, paymentReceivedData?.currency),
              },
              {
                label: 'Available Balance',
                value: formatAmount(paymentReceivedData?.availableBalance || paymentReceivedData?.unusedAmount || 0, true, paymentReceivedData?.currency),
                colorClass: (paymentReceivedData?.availableBalance || paymentReceivedData?.unusedAmount || 0) > 0 ? 'text-green-600' : 'text-gray-600',
              },
            ]}
          />

          <div className="flex items-center space-x-3">
            <DocumentRefreshButton onRefresh={handleRefresh} />
            {paymentReceivedData?.customerId && (
              <Button type="default" size="middle" icon={<Icons.ExportOutlined className="mr-2" />} onClick={() => setViewCustomerDetail(true)} className="flex items-center">
                View Customer
              </Button>
            )}
            <PDFDownloadLink document={<PaymentPdf data={paymentReceivedData} profile={profile} variant="received" />} fileName={paymentPdfFileName(paymentReceivedData, 'received')}>
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
              <PermissionButton
                canAccess={useModulePaymentReceived?.edit && accessRoles?.isAccountant}
                isViewOnly={isViewOnly}
                disabled={paymentReceivedData?.status !== 'PENDING' || approveLoading || rejectLoading}
                tooltipTitle={canApprove ? getApproveLabel() : statusChangeTooltip}
                tooltipProps={{ placement: 'left' }}
                wrapperClassName="block w-full"
                type="primary"
                icon={<Icons.CheckCircleOutlined />}
                className="px-4 py-2 w-full"
                block
                onClick={canApprove ? handleApprovedModalClick : undefined}
              >
                {approveLoading ? <CustomLoader variant="button" text="Approving..." /> : getApproveLabel()}
              </PermissionButton>
              <PermissionButton
                canAccess={useModulePaymentReceived?.edit}
                isViewOnly={isViewOnly}
                disabled={paymentReceivedData?.status !== 'APPROVED' || !(Number(paymentReceivedData?.unusedAmount) > 0) || submitLoading}
                tooltipTitle={refundTooltip}
                tooltipProps={{ placement: 'left' }}
                wrapperClassName="block w-full"
                type="primary"
                icon={<Icons.DollarOutlined />}
                className="px-4 py-2 w-full"
                block
                onClick={canRefund ? handleRefundPaymentReceived : undefined}
              >
                Refund
              </PermissionButton>
              <PermissionButton
                canAccess={useModulePaymentReceived?.edit}
                isViewOnly={isViewOnly}
                disabled={paymentReceivedData?.status !== 'APPROVED' || !(paymentReceivedData?.availableBalance > 0 || paymentReceivedData?.unusedAmount > 0) || submitLoading}
                tooltipTitle={applyToInvoiceTooltip}
                tooltipProps={{ placement: 'left' }}
                wrapperClassName="block w-full"
                type="primary"
                icon={<Icons.SwapOutlined />}
                className="px-4 py-2 w-full"
                block
                onClick={canApplyToInvoice ? handleApplyToInvoice : undefined}
              >
                {submitLoading ? <CustomLoader variant="button" text="Applying..." /> : 'Apply to Invoice'}
              </PermissionButton>
              <PermissionButton
                canAccess={useModulePaymentReceived?.edit}
                isViewOnly={isViewOnly}
                disabled={paymentReceivedData?.status !== 'PENDING' || submitLoading}
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
                canAccess={useModulePaymentReceived?.delete}
                isViewOnly={isViewOnly}
                disabled={!(paymentReceivedData?.status === 'PENDING' || paymentReceivedData?.status === 'APPROVED') || deleteLoading}
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
              <PermissionButton
                canAccess={useModulePaymentReceived?.edit && accessRoles?.isAccountant}
                isViewOnly={isViewOnly}
                disabled={!(paymentReceivedData?.status === 'APPROVED' || paymentReceivedData?.status === 'REJECTED') || cancelLoading}
                tooltipTitle={cancelTooltip}
                tooltipProps={{ placement: 'left' }}
                wrapperClassName="block w-full"
                type="default"
                danger
                icon={<Icons.StopOutlined />}
                className="px-4 py-2 w-full"
                block
                onClick={canCancel ? handleCancelModalClick : undefined}
              >
                {cancelLoading ? <CustomLoader variant="button" text="Cancelling..." /> : 'Cancel Payment'}
              </PermissionButton>
            </ActionButtons>

            <DocumentMetadata data={paymentReceivedData} />

            <ApprovedBy data={paymentReceivedData} />

            <OrganizationInfo
              data={{
                divisionName: paymentReceivedData?.divisionId?.name,
                branchName: paymentReceivedData?.branchId?.name,
                warehouseName: paymentReceivedData?.warehouseId?.name,
              }}
            />
          </div>
        </div>
      </div>
      {/* Remove Confirmation Modal */}
      <ConfirmRemoveModal
        modalOpen={showRemoveConfirmation}
        setModalOpen={setShowRemoveConfirmation}
        title="Remove Applied Payment Received"
        description="Are you sure you want to remove this payment received from the applied list?"
        itemToRemove={invoiceToRemove}
        onConfirm={handleConfirmRemove}
        onCancel={handleCancelRemove}
        loading={removeApplyInvoiceLoading}
        importantNoteText="Removing this payment received will release the applied amount back to the balance. This action cannot be undone."
      />
      <CustomModal
        modalOpen={approvalModal.visible}
        setModalOpen={open => {
          if (!open) {
            setApprovalModal({
              visible: false,
              approvalNote: '',
              depositDate: dayjs().format('YYYY-MM-DD'),
              clearingDate: null,
              chequeReceivedDate: dayjs().format('YYYY-MM-DD'),
              chequeApprovalNote: '',
            });
          }
        }}
        title={
          paymentReceivedData?.chequeStatus?.toLowerCase() === CHEQUE_STATUS.PENDING?.toLowerCase() && paymentReceivedData?.paymentMode?.toLowerCase() === PAYMENT_MODES.CHEQUE?.toLowerCase()
            ? 'Receive Cheque Approval Payment'
            : paymentReceivedData?.chequeStatus?.toLowerCase() === CHEQUE_STATUS.RECEIVED?.toLowerCase() && paymentReceivedData?.paymentMode?.toLowerCase() === PAYMENT_MODES.CHEQUE?.toLowerCase()
              ? 'Deposit Cheque Payment'
              : 'Approve Payment'
        }
      >
        <div className="flex flex-col gap-y-3 mb-2">
          <p>Enter Transaction Details and click on Approve to proceed with the payment. </p>
          {paymentReceivedData?.attachments?.length > 0 && <AttachMentDetails data={paymentReceivedData} />}
        </div>

        <TextArea rows={4} placeholder="Enter transaction details" value={approvalModal.approvalNote} onChange={e => setApprovalModal(prev => ({ ...prev, approvalNote: e.target.value }))} />

        {paymentReceivedData?.paymentMode?.toLowerCase() === PAYMENT_MODES.CHEQUE?.toLowerCase() && (
          <div className="relative pt-1.5">
            <div className="mb-1">Cheque Received Date</div>
            <DatePicker
              value={approvalModal?.chequeReceivedDate ? dayjs(approvalModal.chequeReceivedDate, 'YYYY-MM-DD') : null}
              onChange={(_chequeReceivedDate, dateString) => setApprovalModal(prev => ({ ...prev, chequeReceivedDate: dateString }))}
              format="YYYY-MM-DD"
              className="w-full py-1.5 h-[35.5px]"
              placeholder="Select Cheque Received Date"
              disabled={
                paymentReceivedData?.chequeStatus?.toLowerCase() === CHEQUE_STATUS.RECEIVED?.toLowerCase() ||
                paymentReceivedData?.chequeStatus?.toLowerCase() === CHEQUE_STATUS.DEPOSITED?.toLowerCase()
              }
            />
          </div>
        )}

        {paymentReceivedData?.paymentMode?.toLowerCase() === PAYMENT_MODES.CHEQUE?.toLowerCase() &&
          (paymentReceivedData?.chequeStatus?.toLowerCase() === CHEQUE_STATUS.RECEIVED?.toLowerCase() ||
            paymentReceivedData?.chequeStatus?.toLowerCase() === CHEQUE_STATUS.DEPOSITED?.toLowerCase()) && (
            <div className="relative pt-1.5">
              <div className="mb-1">Deposit Date</div>
              <DatePicker
                value={approvalModal?.depositDate ? dayjs(approvalModal?.depositDate, 'YYYY-MM-DD') : null}
                onChange={(_depositDate, dateString) => setApprovalModal(prev => ({ ...prev, depositDate: dateString }))}
                format="YYYY-MM-DD"
                className="w-full py-1.5 h-[35.5px]"
                placeholder="Select Deposit Date"
                disabled={paymentReceivedData?.chequeStatus?.toLowerCase() === CHEQUE_STATUS.DEPOSITED?.toLowerCase()}
                minDate={approvalModal?.chequeReceivedDate ? dayjs(approvalModal.chequeReceivedDate, 'YYYY-MM-DD') : null}
              />
            </div>
          )}

        {paymentReceivedData?.paymentMode?.toLowerCase() === PAYMENT_MODES.CHEQUE?.toLowerCase() && paymentReceivedData?.chequeStatus?.toLowerCase() === CHEQUE_STATUS.DEPOSITED?.toLowerCase() && (
          <div className="relative pt-1.5">
            <div className="mb-1">Clearing Date</div>
            <DatePicker
              value={approvalModal?.clearingDate ? dayjs(approvalModal?.clearingDate, 'YYYY-MM-DD') : null}
              onChange={(_clearingDate, dateString) => setApprovalModal(prev => ({ ...prev, clearingDate: dateString }))}
              minDate={approvalModal?.depositDate ? dayjs(approvalModal?.depositDate, 'YYYY-MM-DD') : null}
              format="YYYY-MM-DD"
              className="w-full py-1.5 h-[35.5px]"
              placeholder="Select Clearing Date"
            />
          </div>
        )}

        {paymentReceivedData?.paymentMode?.toLowerCase() === PAYMENT_MODES.CHEQUE?.toLowerCase() && (
          <div className="relative pt-1.5">
            <div className="mb-1">Cheque Approval Note</div>
            <TextArea
              rows={3}
              placeholder="Enter cheque approval note"
              value={approvalModal.chequeApprovalNote}
              onChange={e => setApprovalModal(prev => ({ ...prev, chequeApprovalNote: e.target.value }))}
            />
          </div>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <CustomButton
            text="Go Back"
            disabled={rejectLoading || approveLoading}
            onClick={() =>
              setApprovalModal({
                visible: false,
                approvalNote: '',
                depositDate: dayjs().format('YYYY-MM-DD'),
                clearingDate: null,
                chequeReceivedDate: dayjs().format('YYYY-MM-DD'),
                chequeApprovalNote: '',
              })
            }
          />
          <CustomButton text="Reject" type="primary" danger loading={rejectLoading} disabled={approveLoading} onClick={handleRejectPayment} style={{ minWidth: 80 }} />
          <CustomButton text={getApproveLabel()} type="primary" loading={approveLoading} disabled={rejectLoading} onClick={handleApprovePayment} style={{ minWidth: 110 }} />
        </div>
      </CustomModal>

      {/* Cancel Modal */}
      <CustomModal
        modalOpen={cancelModal.visible}
        setModalOpen={open => {
          if (!open) setCancelModal({ visible: false, note: '' });
        }}
        title="Cancel Payment"
      >
        <p>Enter Transaction Details and click on cancel to proceed with the payment.</p>
        <TextArea rows={4} placeholder="Enter transaction details" value={cancelModal.note} onChange={e => setCancelModal(prev => ({ ...prev, note: e.target.value }))} />
        <div className="flex justify-end gap-2 mt-4">
          <Button key="back" onClick={() => setCancelModal({ visible: false, note: '' })}>
            Go Back
          </Button>
          <Button key="submit" type="primary" danger loading={cancelLoading} onClick={handleCancelPayment} style={{ minWidth: 120 }}>
            Cancel Payment
          </Button>
        </div>
      </CustomModal>

      {/* Delete Modal */}
      <DocumentConfirmModal
        modal={deleteModal}
        docType={MODULE_NAMES?.PAYMENT_RECEIVED}
        onConfirm={deletePaymentReceived}
        loading={deleteLoading}
        getDocumentDetails={getPaymentReceivedDocumentDetails}
      />

      <ApplyToInvoiceModal
        modalOpen={showApplyToInvoiceModal}
        onClose={() => setShowApplytoInvoiceModal(false)}
        paymentReceivedDetails={
          paymentReceivedData
            ? {
                ...paymentReceivedData,
                _id: paymentReceivedData?._id || paymentReceivedData?.id,
                branchId: paymentReceivedData?.branchId?._id || paymentReceivedData?.branchId,
                branchName: paymentReceivedData?.branchName || paymentReceivedData?.branchId?.name || null,
              }
            : null
        }
        fetchPaymentReceived={() => getPaymentRecivedById({ paymentId })}
      />
      <RefundPaymentModal
        variant="paymentReceived"
        modalOpen={showRefundPaymentReceivedModal}
        onClose={closeRefundPaymentReceivedModal}
        editRefund={refundBeingEdited}
        paymentDetails={
          paymentReceivedData
            ? {
                ...paymentReceivedData,
                _id: paymentReceivedData?._id || paymentReceivedData?.id,
                branchId: paymentReceivedData?.branchId?._id || paymentReceivedData?.branchId,
              }
            : null
        }
        fetchPayment={() => getPaymentRecivedById({ paymentId })}
      />

      <ConfirmRemoveModal
        modalOpen={showRefundDeleteConfirm}
        setModalOpen={setShowRefundDeleteConfirm}
        title="Delete refund"
        description="Are you sure you want to delete this refund? The refunded amount will be restored to the payment unused balance."
        itemToRemove={refundPendingDelete}
        customItemDetails={
          refundPendingDelete ? (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Refund date:</span>
                  <p className="text-gray-900">{refundPendingDelete?.refundedAt ? formatDate(refundPendingDelete.refundedAt) : '—'}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Amount refunded:</span>
                  <p className="text-green-600 font-semibold">{formatAmount(refundPendingDelete?.amountRefunded, true, paymentReceivedData?.currency)}</p>
                </div>
              </div>
            </div>
          ) : null
        }
        showItemDetails={Boolean(refundPendingDelete)}
        onConfirm={handleConfirmDeleteRefund}
        onCancel={handleCancelDeleteRefund}
        loading={refundLoading}
        importantNoteText="Deleting this refund reverses the bank adjustment and increases unused balance on this payment. This action cannot be undone."
      />
      {viewCustomerDetail && <CustomerDrawerDetails viewCustomerDetail={viewCustomerDetail} setViewCustomerDetail={setViewCustomerDetail} customerData={customerData} />}
    </>
  );
};

export default PaymentReceivedDetail;
