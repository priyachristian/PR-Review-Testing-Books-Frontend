import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { PDFDownloadLink } from '@/components/ui/common/PdfDownloadLinkLazy';
import { renderPdfToBlob } from '@/utils/loadReactPdf';

// Components
import ApplyToBillModal from '../components/ApplyToBillModal';
import RefundHistoryTab from '@/components/ui/common/RefundHistoryTab';
import AttachMentDetails from '@/components/feedback/formModal/AttachMentDetails';
import BackButton from '@/components/ui/button/BackButton';
import DocumentRefreshButton from '@/components/ui/button/DocumentRefreshButton';
import ConfirmRemoveModal from '@/components/feedback/confirmModal/ConfirmRemoveModal';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import CustomerDrawerDetails from '@/features/sales/customer/components/CustomerDrawerDetails';
import { DocumentConfirmModal } from '@/components/feedback/confirmModal/CancelOrDeleteDocumentModal';
import PaymentMadeDetailSkeleton from '../components/PaymentMadeDetailSkeleton';
import CustomModal from '@/components/feedback/formModal/CustomModal';
import { DocumentMetadata, OrganizationInfo, ActionButtons, ApprovedBy } from '@/components/ui';
import { CommentHistory } from '@/features/common/comment';
import PurchaseModuleTreeView from '@/components/dataDisplay/statCard/PurchaseModuleTreeView';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import Toast from '@/components/ui/common/Toast';
import NoFoundPage from '@/components/ui/common/NoFoundPage';
import PageHeader from '@/components/ui/common/PageHeader';
import { Button, DatePicker, Input, Tabs, Tag, Upload } from '@/components/AntDComponent';
import PermissionButton from '@/components/ui/button/PermissionButton';

// Hooks
import useModulePermissions from 'hooks/useModulePermissions';
import { useUser } from '@/features/setting/user/useUser';
import { useProfile } from '@/features/setting/profile/useProfile';
import { useConfirmModal } from '@/hooks/useConfirmModal';

// Extras
import { usePaymentMade, getPaymentMadeDocumentDetails } from '@/features/purchase/paymentsMade';
import Icons from 'assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { CHEQUE_STATUS, MODULE_NAMES, PAYMENT_MADE_STATUS, PAYMENT_MODES, PERMISSION_MESSAGES, getPaymentMadeTypeBadgeProps, LEDGER_SOURCE_MODULES } from '@/utils/constants';
import DocumentJournalPanel from '@/components/dataDisplay/DocumentJournalPanel';
import { isSplitDocumentUnavailable } from 'utils/services';
import { formatAmount } from '@/utils/currency';
import { colorPalette } from '@/utils/theme';
import RefundPaymentModal from '@/components/feedback/formModal/RefundPaymentModal';
import CustomButton from '@/components/ui/button/CustomButton';
import { PaymentPdf } from '@/components/ui/common/PaymentPdfLazy';
import { paymentPdfFileName } from '@smit9313/abss-pdf';

const { TextArea } = Input;

const PaymentMadeDetail = () => {
  const { paymentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeKey, setActiveKey] = useState('1');
  const { useModulePaymentMade, isViewOnly, isSplitSessionActive } = useModulePermissions(RESOURCES.PAYMENT_MADE);
  const { accessRoles } = useUser();
  const { profile, getProfile } = useProfile();
  const {
    loading,
    paymentMade,
    resetPaymentMade,
    getPaymentMadeById,
    removeApplyBill,
    removeApplyBillLoading,
    approvePaymentsMade,
    rejectPaymentsMade,
    cancelPaymentsMade,
    removePaymentMade,
    deleteRefund,
    refundLoading,
    submitLoading,
    deleteLoading,
    approveLoading,
    rejectLoading,
    cancelLoading,
  } = usePaymentMade();
  const paymentMadeData = paymentMade;
  const canRemoveApplication = paymentMadeData?.status === 'APPROVED' && useModulePaymentMade?.edit && !isViewOnly;
  const [showRemoveConfirmation, setShowRemoveConfirmation] = useState(false);
  const [invoiceToRemove, setInvoiceToRemove] = useState(null);
  const [showApplyToBillModal, setShowApplyToBillModal] = useState(false);
  const [showRefundPaymentMadeModal, setShowRefundPaymentMadeModal] = useState(false);
  const [refundBeingEdited, setRefundBeingEdited] = useState(null);
  const [showRefundDeleteConfirm, setShowRefundDeleteConfirm] = useState(false);
  const [refundPendingDelete, setRefundPendingDelete] = useState(null);
  const deleteModal = useConfirmModal();
  const [approvalModal, setApprovalModal] = useState({
    visible: false,
    paymentId: null,
    approvalNote: '',
    pdcChequeDate: dayjs().format('YYYY-MM-DD'),
    chequeApprovalNote: '',
  });
  const [cancelModal, setCancelModal] = useState({
    visible: false,
    paymentId: null,
    note: '',
  });
  const [file, setFile] = useState(null);
  const [paymentPDF, setPaymentPDF] = useState([]);
  const [viewCustomerDetail, setViewCustomerDetail] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    getProfile({ signal: controller.signal });
    return () => controller.abort();
  }, [getProfile]);

  useEffect(() => {
    const controller = new AbortController();
    if (paymentId) {
      getPaymentMadeById({ paymentId, signal: controller.signal });
    }

    return () => {
      controller.abort();
      resetPaymentMade();
    };
  }, [paymentId, isSplitSessionActive]);

  const handleRefresh = async () => {
    await getPaymentMadeById({ paymentId });
  };

  const handlePrint = async () => {
    try {
      const blob = await renderPdfToBlob(<PaymentPdf data={paymentMadeData} profile={profile} variant="made" />);
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
    resetPaymentMade();
    navigate(`/payments-made/${paymentMadeData?.id || paymentMadeData?._id}/edit`, {
      state: {
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
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

  const handleRemoveClick = item => {
    setInvoiceToRemove(item);
    setShowRemoveConfirmation(true);
  };

  const handleConfirmRemove = async () => {
    if (!invoiceToRemove) return;

    let removedLine;
    if (invoiceToRemove.billId) removedLine = { billId: invoiceToRemove._id };
    else if (invoiceToRemove.expenseId) removedLine = { expenseLineId: invoiceToRemove._id };
    else removedLine = { openingBalanceLineId: invoiceToRemove._id };

    await removeApplyBill({ paymentId, ...removedLine });
    getPaymentMadeById({ paymentId });
    setShowRemoveConfirmation(false);
    setInvoiceToRemove(null);
  };

  const handleCancelRemove = () => {
    setShowRemoveConfirmation(false);
    setInvoiceToRemove(null);
  };

  const handleApplyToBill = () => {
    setShowApplyToBillModal(true);
  };

  const handleRefundPaymentMade = () => {
    setRefundBeingEdited(null);
    setShowRefundPaymentMadeModal(true);
  };

  const closeRefundModal = () => {
    setShowRefundPaymentMadeModal(false);
    setRefundBeingEdited(null);
  };

  const handleEditRefundRow = row => {
    setRefundBeingEdited(row);
    setShowRefundPaymentMadeModal(true);
  };

  const handleDeleteRefundClick = row => {
    setRefundPendingDelete(row);
    setShowRefundDeleteConfirm(true);
  };

  const handleConfirmDeleteRefund = async () => {
    if (!refundPendingDelete) return;
    try {
      await deleteRefund({
        paymentMadeId: paymentMadeData?._id,
        refundId: refundPendingDelete._id,
      });
      getPaymentMadeById({ paymentId });
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

  const handleApprovedModalClick = () => {
    setApprovalModal({
      visible: true,
      paymentId: paymentMadeData?.id || paymentMadeData?._id,
      approvalNote: '',
      pdcChequeDate: paymentMadeData?.pdcChequeDate ? dayjs(paymentMadeData?.pdcChequeDate).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD'),
      chequeApprovalNote: '',
    });
  };

  const handleCancelModalClick = () => {
    setCancelModal({
      visible: true,
      paymentId: paymentMadeData?.id || paymentMadeData?._id,
      note: '',
    });
  };

  const handleFileUpload = file => {
    if (!file) {
      Toast.error('No file selected for upload.');
      return;
    }
    setPaymentPDF([file]);
  };

  const handleApprovePayment = async () => {
    try {
      await approvePaymentsMade({
        paymentId: approvalModal.paymentId,
        approvalNote: approvalModal.approvalNote,
        attachments: [...(paymentMadeData?.attachments || []), ...paymentPDF],
        ...(paymentMadeData?.paymentMode?.toLowerCase() === PAYMENT_MODES.CHEQUE?.toLowerCase() && {
          ...(approvalModal.pdcChequeDate && { pdcChequeDate: approvalModal.pdcChequeDate }),
          chequeApprovalNote: approvalModal.chequeApprovalNote,
        }),
      });
      setApprovalModal({
        visible: false,
        paymentId: null,
        approvalNote: '',
        pdcChequeDate: dayjs().format('YYYY-MM-DD'),
        chequeApprovalNote: '',
      });
      setFile(null);
      setPaymentPDF([]);
      getPaymentMadeById({ paymentId });
    } catch (error) {
      console.log('handleApprovePayment Error::', error);
    }
  };

  const handleRejectPayment = async () => {
    try {
      await rejectPaymentsMade({
        paymentId: approvalModal.paymentId,
        approvalNote: approvalModal.approvalNote,
        attachments: [...(paymentMadeData?.attachments || []), ...paymentPDF],
        ...(paymentMadeData?.paymentMode?.toLowerCase() === PAYMENT_MODES.CHEQUE?.toLowerCase() && {
          ...(approvalModal.pdcChequeDate && { pdcChequeDate: approvalModal.pdcChequeDate }),
          chequeApprovalNote: approvalModal.chequeApprovalNote,
        }),
      });
      setApprovalModal({
        visible: false,
        paymentId: null,
        approvalNote: '',
        pdcChequeDate: dayjs().format('YYYY-MM-DD'),
        chequeApprovalNote: '',
      });
      setFile(null);
      setPaymentPDF([]);
      getPaymentMadeById({ paymentId });
    } catch (error) {
      console.log('handleRejectPayment Error::', error);
    }
  };

  const handleCancelReceived = async () => {
    try {
      await cancelPaymentsMade({
        paymentId: cancelModal.paymentId,
        notes: { notes: cancelModal.note },
      });
      setCancelModal({ visible: false, paymentId: null, note: '' });
      getPaymentMadeById({ paymentId });
    } catch (error) {
      console.log('handleCancelReceived Error::', error);
    }
  };

  const handleDeleteClick = () => {
    deleteModal.open(paymentMadeData);
  };

  const deletePaymentMade = async () => {
    await removePaymentMade({
      paymentId: paymentMadeData?.id || paymentMadeData?._id,
    });
    deleteModal.close();
    navigate('/payments-made');
  };

  const getApproveLabel = () => {
    if (paymentMadeData?.chequeStatus === CHEQUE_STATUS.PENDING) {
      return 'Receive Cheque Approval';
    } else if (paymentMadeData?.chequeStatus === CHEQUE_STATUS.RECEIVED) {
      return 'Deposit Cheque';
    }
    return 'Approve';
  };

  const items = [
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
                  <div className="mt-1 text-sm font-medium text-gray-900">{paymentMadeData?.vendorId?.customerDisplayName || '-'}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500">Payment Date</div>
                  <div className="mt-1 text-sm font-medium text-gray-900">{paymentMadeData?.paymentDate ? dayjs(paymentMadeData?.paymentDate).format('DD/MM/YYYY') : '-'}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500">Amount Paid</div>
                  <div className="mt-1 text-sm font-medium text-gray-900">{formatAmount(paymentMadeData?.paymentMade || 0, true, paymentMadeData?.currency)}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500">Payment Mode</div>
                  <div className="mt-1 text-sm font-medium text-gray-900">{formatEnumKey(paymentMadeData?.paymentMode) || '-'}</div>
                </div>
              </div>

              <div className="mt-5">
                <div className="text-xs font-medium text-gray-500">Notes</div>
                <div className="mt-1 text-sm text-gray-900 whitespace-pre-wrap break-words">{paymentMadeData?.notes || '-'}</div>
              </div>

              <div className="mt-5">
                <div className="text-xs font-medium text-gray-500">Approval Notes</div>
                <div className="mt-1 text-sm text-gray-900 whitespace-pre-wrap break-words">{paymentMadeData?.approvalNote || '-'}</div>
              </div>

              {paymentMadeData?.chequeApprovalNote && (
                <div className="mt-5">
                  <div className="text-xs font-medium text-gray-500">Cheque Approval Note</div>
                  <div className="mt-1 text-sm text-gray-900 whitespace-pre-wrap break-words">{paymentMadeData.chequeApprovalNote}</div>
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
                  <span className="font-semibold text-gray-600">Payment Made: </span>
                  <span className="text-gray-900">{paymentMadeData?.paymentMadeId || '-'}</span>
                </div>

                {paymentMadeData?.paymentMode !== 'CASH' && (
                  <div>
                    <span className="font-semibold text-gray-600">Paid Through: </span>
                    <span className="text-gray-900">{paymentMadeData?.paidThroughAccountId?.accountName || '-'}</span>
                  </div>
                )}

                {paymentMadeData?.paymentMode?.toLowerCase() === PAYMENT_MODES.CHEQUE.toLowerCase() && (
                  <div>
                    <span className="font-semibold text-gray-600">Cheque Status: </span>
                    <span className="text-gray-900">{formatEnumKey(paymentMadeData?.chequeStatus) || '-'}</span>
                  </div>
                )}

                {paymentMadeData?.paymentMode?.toLowerCase() === PAYMENT_MODES.CHEQUE.toLowerCase() && (
                  <div>
                    <span className="font-semibold text-gray-600">PDC Cheque Date: </span>
                    <span className="text-gray-900">{paymentMadeData?.pdcChequeDate ? formatDate(paymentMadeData?.pdcChequeDate) : '-'}</span>
                  </div>
                )}

                {paymentMadeData?.paymentMode?.toLowerCase() === PAYMENT_MODES.CHEQUE.toLowerCase() && paymentMadeData?.chequeApprovalNote && (
                  <div className="md:col-span-2">
                    <span className="font-semibold text-gray-600">Cheque Approval Note: </span>
                    <span className="text-gray-900 whitespace-pre-wrap break-words">{paymentMadeData?.chequeApprovalNote}</span>
                  </div>
                )}

                {paymentMadeData?.reference && (
                  <div className="md:col-span-2">
                    <span className="font-semibold text-gray-600">Reference: </span>
                    <span className="text-gray-900">{paymentMadeData?.reference}</span>
                  </div>
                )}
              </div>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start">
                  <StatusBadge {...getPaymentMadeTypeBadgeProps(paymentMadeData)} />
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-md font-semibold text-gray-800 mb-4">Bill Details</h2>
            <div className="overflow-auto">
              <table className="w-full border border-gray-200 rounded-md overflow-hidden">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="text-left p-3 border-b">Bill No</th>
                    <th className="text-left p-3 border-b">Bill Date</th>
                    <th className="text-left p-3 border-b">Applied Date</th>
                    <th className="text-left p-3 border-b">Bill Amount</th>
                    <th className="text-left p-3 border-b">Amount Due</th>
                    <th className="text-left p-3 border-b">Payment</th>
                    {canRemoveApplication && <th className="text-left p-3 border-b">Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {(paymentMadeData?.openingBalanceTransactions || []).map((ob, idx) => {
                    const t = ob.openingBalanceTransaction || {};
                    return (
                      <tr key={`ob-${idx}`} className="hover:bg-gray-50 bg-amber-50/40">
                        <td className="p-3 border-b">
                          <Tag className="font-semibold">{ob.transactionNo || t.transactionNo || '-'}</Tag>
                          <div className="text-xs text-gray-500 mt-0.5">(Vendor opening balance)</div>
                        </td>
                        <td className="p-3 border-b">{formatDate(t.date)}</td>
                        <td className="p-3 border-b">{formatDate(ob.appliedDate)}</td>
                        <td className="p-3 border-b">{t.amount != null ? formatAmount(t.amount, true, paymentMadeData?.currency) : '-'}</td>
                        <td className="p-3 border-b">{formatAmount(Number(t.remainingAmount), true, paymentMadeData?.currency)}</td>
                        <td className="p-3 border-b">{formatAmount(ob.amountApplied, true, paymentMadeData?.currency)}</td>
                        {canRemoveApplication && (
                          <td className="p-3 border-b">
                            <Icons.DeleteOutlined style={{ fontSize: 17, color: colorPalette.error[500], cursor: 'pointer' }} onClick={() => handleRemoveClick(ob)} />
                          </td>
                        )}
                      </tr>
                    );
                  })}
                  {(paymentMadeData?.bills || []).map((inv, idx) => (
                    <tr key={`bill-${idx}`} className="hover:bg-gray-50">
                      <td className="p-3 border-b">
                        {inv?.billId?._id ? (
                          <Link to={`/bills/${inv?.billId?._id}`}>
                            <Tag className="font-semibold">{inv?.billNo}</Tag>
                          </Link>
                        ) : (
                          <Tag className="font-semibold">{inv?.billNo || '-'}</Tag>
                        )}
                      </td>
                      <td className="p-3 border-b">{formatDate(inv?.billId?.billDate)}</td>
                      <td className="p-3 border-b">{formatDate(inv?.appliedDate)}</td>
                      <td className="p-3 border-b">{inv?.billId?.total != null ? formatAmount(inv.billId.total, true, paymentMadeData?.currency) : '-'}</td>
                      <td className="p-3 border-b">{inv?.billId?.balanceAmount != null ? formatAmount(inv.billId.balanceAmount, true, paymentMadeData?.currency) : '-'}</td>
                      <td className="p-3 border-b">{formatAmount(inv.amountApplied, true, paymentMadeData?.currency)}</td>
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
                  {(paymentMadeData?.expenses || []).map((expense, idx) => (
                    <tr key={`expense-${idx}`} className="hover:bg-gray-50">
                      <td className="p-3 border-b">
                        <Link to={`/expenses/${expense.expenseId._id}`}>
                          <Tag className="font-semibold">{expense.expenseNo}</Tag>
                        </Link>
                      </td>
                      <td className="p-3 border-b">{formatDate(expense.expenseId.date)}</td>
                      <td className="p-3 border-b">{formatDate(expense.appliedDate)}</td>
                      <td className="p-3 border-b">{formatAmount(expense.expenseId.total, true, paymentMadeData?.currency)}</td>
                      <td className="p-3 border-b">{formatAmount(expense.expenseId.balanceAmount, true, paymentMadeData?.currency)}</td>
                      <td className="p-3 border-b">{formatAmount(expense.amountApplied, true, paymentMadeData?.currency)}</td>
                      {canRemoveApplication && (
                        <td className="p-3 border-b">
                          <Icons.DeleteOutlined style={{ fontSize: 17, color: colorPalette.error[500], cursor: 'pointer' }} onClick={() => handleRemoveClick(expense)} />
                        </td>
                      )}
                    </tr>
                  ))}
                  {!((paymentMadeData?.openingBalanceTransactions || []).length > 0 || (paymentMadeData?.bills || []).length > 0 || (paymentMadeData?.expenses || []).length > 0) && (
                    <tr>
                      <td className="p-3 text-center text-gray-500" colSpan={canRemoveApplication ? 7 : 6}>
                        No applications yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes/Amount Paid are shown in Payment Details card above */}
        </div>
      ),
    },
    ...(paymentMadeData?.attachments?.length > 0
      ? [
          {
            key: '2',
            label: 'Attachments',
            children: <AttachMentDetails data={paymentMadeData} />,
          },
        ]
      : []),
    {
      key: '3',
      label: 'Document Flow',
      children: <PurchaseModuleTreeView moduleTree={paymentMadeData?.moduleTree} sourceModule="paymentMade" currency={paymentMadeData?.currency} />,
    },
    ...(paymentMadeData?.refunds?.length > 0
      ? [
          {
            key: '4',
            label: 'Refund History',
            children: (
              <RefundHistoryTab
                refunds={paymentMadeData.refunds}
                paymentDocNo={paymentMadeData?.paymentMadeId}
                paymentStatus={paymentMadeData?.status}
                statusValueMap={PAYMENT_MADE_STATUS}
                canManageRefunds={paymentMadeData?.status === 'APPROVED' && useModulePaymentMade?.edit && !isViewOnly}
                onEditRefund={handleEditRefundRow}
                onDeleteRefund={handleDeleteRefundClick}
                currency={paymentMadeData?.currency}
              />
            ),
          },
        ]
      : []),
    {
      key: 'journal-entries',
      label: 'Journal',
      children: <DocumentJournalPanel sourceModule={LEDGER_SOURCE_MODULES.PAYMENT_MADE} sourceId={paymentId} />,
    },
    {
      key: '5',
      label: 'History',
      children: (
        <CommentHistory
          moduleName={MODULE_NAMES.PAYMENT_MADE}
          referenceId={paymentId}
          commentHistory={paymentMadeData?.commentHistory}
          canAddComment={useModulePaymentMade?.edit}
          isViewOnly={isViewOnly}
        />
      ),
    },
  ];

  const tabKeys = useMemo(
    () => ['1', ...(paymentMadeData?.attachments?.length > 0 ? ['2'] : []), '3', ...(paymentMadeData?.refunds?.length > 0 ? ['4'] : []), 'journal-entries', '5'],
    [paymentMadeData?.attachments?.length, paymentMadeData?.refunds?.length]
  );

  useEffect(() => {
    if (!tabKeys.includes(activeKey)) {
      setActiveKey('1');
    }
  }, [tabKeys, activeKey]);

  const customerData = {
    id: paymentMadeData?.vendorId?._id,
    customerDisplayName: paymentMadeData?.vendorId?.customerDisplayName,
  };

  if (loading) return <PaymentMadeDetailSkeleton />;

  if (!paymentMadeData?._id && !paymentMadeData?.id) {
    return <NoFoundPage docType={MODULE_NAMES.PAYMENT_MADE} />;
  }

  if (isSplitDocumentUnavailable(paymentMadeData, isSplitSessionActive)) {
    return <NoFoundPage docType={MODULE_NAMES.PAYMENT_MADE} />;
  }

  const statusLabel = paymentMadeData?.status || '-';
  const isCancelled = paymentMadeData?.status === 'CANCELLED';
  const canEditAction = useModulePaymentMade?.edit && !isViewOnly;
  const canEdit = canEditAction && paymentMadeData?.status === 'PENDING';
  const canDelete = useModulePaymentMade?.delete && !isViewOnly && (paymentMadeData?.status === 'PENDING' || paymentMadeData?.status === 'APPROVED');
  const canApprove = canEditAction && accessRoles?.isAccountant && paymentMadeData?.status === 'PENDING';
  const canCancel = canEditAction && accessRoles?.isAccountant && (paymentMadeData?.status === 'APPROVED' || paymentMadeData?.status === 'REJECTED');
  const canApplyToBill = canEditAction && paymentMadeData?.status === 'APPROVED' && (paymentMadeData?.availableBalance > 0 || paymentMadeData?.unusedAmount > 0);
  const canRefund = canEditAction && paymentMadeData?.status === 'APPROVED' && Number(paymentMadeData?.unusedAmount) > 0;
  const editTooltip = canEdit
    ? 'Edit Payment'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useModulePaymentMade?.edit
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : `Cannot edit payment in status: ${statusLabel}.`;
  const deleteTooltip = canDelete
    ? 'Delete Payment'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useModulePaymentMade?.delete
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : `Cannot delete payment in status: ${statusLabel}.`;
  const statusChangeTooltip = isViewOnly
    ? PERMISSION_MESSAGES.VIEW_ONLY
    : !useModulePaymentMade?.edit || !accessRoles?.isAccountant
      ? PERMISSION_MESSAGES.NO_PERMISSION
      : isCancelled
        ? 'Payment is cancelled.'
        : `Cannot change payment in status: ${statusLabel}.`;
  const cancelTooltip = canCancel
    ? 'Cancel Payment'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useModulePaymentMade?.edit || !accessRoles?.isAccountant
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : isCancelled
          ? 'Payment is already cancelled.'
          : `Cannot cancel in status: ${statusLabel}.`;
  const applyToBillTooltip = canApplyToBill
    ? 'Apply Payment to Bill'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useModulePaymentMade?.edit
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : isCancelled
          ? 'Payment is cancelled.'
          : paymentMadeData?.status !== 'APPROVED'
            ? `Cannot apply to bill in status: ${statusLabel}.`
            : 'No available balance to apply to bill.';
  const refundTooltip = canRefund
    ? 'Refund'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useModulePaymentMade?.edit
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : isCancelled
          ? 'Payment is cancelled.'
          : paymentMadeData?.status !== 'APPROVED'
            ? `Cannot refund in status: ${statusLabel}.`
            : 'No unused amount to refund.';

  return (
    <>
      <div className="bg-white border-b border-gray-100 px-4 py-4 -m-4">
        <div className="flex items-center justify-between">
          <PageHeader
            title={
              <div className="flex items-center gap-3">
                <BackButton />

                <div className="flex flex-col">
                  <h1 className="text-[18px] font-semibold text-heading leading-6">Payment Made Details</h1>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-medium text-gray-600">{paymentMadeData?.paymentMadeId}</span>

                    <span className="text-gray-400">•</span>

                    <StatusBadge status={paymentMadeData?.status} value={PAYMENT_MADE_STATUS?.[paymentMadeData?.status] || paymentMadeData?.status} />
                  </div>
                </div>
              </div>
            }
            rightStats={[
              {
                label: 'Total Amount',
                value: formatAmount(paymentMadeData?.paymentMade || 0, true, paymentMadeData?.currency),
              },
              {
                label: 'Available Balance',
                value: formatAmount(paymentMadeData?.availableBalance || paymentMadeData?.unusedAmount || 0, true, paymentMadeData?.currency),
                colorClass: (paymentMadeData?.availableBalance || paymentMadeData?.unusedAmount || 0) > 0 ? 'text-green-600' : 'text-gray-600',
              },
            ]}
          />

          <div className="flex items-center space-x-3">
            <DocumentRefreshButton onRefresh={handleRefresh} />
            {paymentMadeData?.vendorId?._id && (
              <Button type="default" size="middle" icon={<Icons.ExportOutlined className="mr-2" />} onClick={() => setViewCustomerDetail(true)} className="flex items-center">
                View Vendor
              </Button>
            )}
            <PDFDownloadLink document={<PaymentPdf data={paymentMadeData} profile={profile} variant="made" />} fileName={paymentPdfFileName(paymentMadeData, 'made')}>
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

      <div className="flex flex-col xl:flex-row xl:justify-between gap-y-4 pt-3">
        <div className="w-full xl:w-3/4">
          <Tabs activeKey={activeKey} onChange={setActiveKey} items={items} />
        </div>
        <div className="xl:mt-[62px] h-fit w-full xl:w-[250px] space-y-3">
          <div className="space-y-3">
            <ActionButtons>
              <PermissionButton
                canAccess={useModulePaymentMade?.edit && accessRoles?.isAccountant}
                isViewOnly={isViewOnly}
                disabled={paymentMadeData?.status !== 'PENDING' || approveLoading || rejectLoading}
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
                canAccess={useModulePaymentMade?.edit}
                isViewOnly={isViewOnly}
                disabled={paymentMadeData?.status !== 'APPROVED' || !(Number(paymentMadeData?.unusedAmount) > 0) || submitLoading}
                tooltipTitle={refundTooltip}
                tooltipProps={{ placement: 'left' }}
                wrapperClassName="block w-full"
                type="primary"
                icon={<Icons.DollarOutlined />}
                className="px-4 py-2 w-full"
                block
                onClick={canRefund ? handleRefundPaymentMade : undefined}
              >
                Refund
              </PermissionButton>
              <PermissionButton
                canAccess={useModulePaymentMade?.edit}
                isViewOnly={isViewOnly}
                disabled={paymentMadeData?.status !== 'APPROVED' || !(paymentMadeData?.availableBalance > 0 || paymentMadeData?.unusedAmount > 0) || submitLoading}
                tooltipTitle={applyToBillTooltip}
                tooltipProps={{ placement: 'left' }}
                wrapperClassName="block w-full"
                type="primary"
                icon={<Icons.SwapOutlined />}
                className="px-4 py-2 w-full"
                block
                onClick={canApplyToBill ? handleApplyToBill : undefined}
              >
                {submitLoading ? <CustomLoader variant="button" text="Applying..." /> : 'Apply to Bill'}
              </PermissionButton>
              <PermissionButton
                canAccess={useModulePaymentMade?.edit}
                isViewOnly={isViewOnly}
                disabled={paymentMadeData?.status !== 'PENDING' || submitLoading}
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
                canAccess={useModulePaymentMade?.delete}
                isViewOnly={isViewOnly}
                disabled={!(paymentMadeData?.status === 'PENDING' || paymentMadeData?.status === 'APPROVED') || deleteLoading}
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
                canAccess={useModulePaymentMade?.edit && accessRoles?.isAccountant}
                isViewOnly={isViewOnly}
                disabled={!(paymentMadeData?.status === 'APPROVED' || paymentMadeData?.status === 'REJECTED') || submitLoading}
                tooltipTitle={cancelTooltip}
                tooltipProps={{ placement: 'left' }}
                wrapperClassName="block w-full"
                type="default"
                danger
                icon={<Icons.CloseCircleOutlined />}
                className="px-4 py-2 w-full"
                block
                onClick={canCancel ? handleCancelModalClick : undefined}
              >
                {submitLoading ? <CustomLoader variant="button" text="Loading..." /> : 'Cancel Payment'}
              </PermissionButton>
            </ActionButtons>

            <DocumentMetadata data={paymentMadeData} />

            <ApprovedBy data={paymentMadeData} />

            <OrganizationInfo
              data={{
                divisionName: paymentMadeData?.divisionId?.name,
                branchName: paymentMadeData?.branchId?.name,
                warehouseName: paymentMadeData?.warehouseId?.name,
              }}
            />
          </div>
        </div>
      </div>
      {/* Remove Confirmation Modal */}
      <ConfirmRemoveModal
        modalOpen={showRemoveConfirmation}
        setModalOpen={setShowRemoveConfirmation}
        title="Remove Applied Payment Made"
        description="Are you sure you want to remove this payment made from the applied list?"
        itemToRemove={invoiceToRemove}
        onConfirm={handleConfirmRemove}
        onCancel={handleCancelRemove}
        loading={removeApplyBillLoading}
        importantNoteText="Removing this payment made will release the applied amount back to the balance. This action cannot be undone."
      />

      <ApplyToBillModal
        modalOpen={showApplyToBillModal}
        onClose={() => setShowApplyToBillModal(false)}
        paymentMadeDetails={
          paymentMadeData
            ? {
                ...paymentMadeData,
                _id: paymentMadeData?._id || paymentMadeData?.id,
                branchId: paymentMadeData?.branchId?._id || paymentMadeData?.branchId,
                branchName: paymentMadeData?.branchName || paymentMadeData?.branchId?.name || null,
              }
            : null
        }
        fetchPaymentMade={() => getPaymentMadeById({ paymentId })}
      />
      <RefundPaymentModal
        variant="paymentMade"
        modalOpen={showRefundPaymentMadeModal}
        onClose={closeRefundModal}
        editRefund={refundBeingEdited}
        paymentDetails={
          paymentMadeData
            ? {
                ...paymentMadeData,
                _id: paymentMadeData?._id || paymentMadeData?.id,
                branchId: paymentMadeData?.branchId?._id || paymentMadeData?.branchId,
              }
            : null
        }
        fetchPayment={() => getPaymentMadeById({ paymentId })}
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
                  <p className="text-green-600 font-semibold">{formatAmount(refundPendingDelete?.amountRefunded, true, paymentMadeData?.currency)}</p>
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
      <CustomModal
        modalOpen={approvalModal.visible}
        setModalOpen={open => {
          if (!open) {
            setApprovalModal({
              visible: false,
              paymentId: null,
              approvalNote: '',
              pdcChequeDate: dayjs().format('YYYY-MM-DD'),
              chequeApprovalNote: '',
            });
            setFile(null);
            setPaymentPDF([]);
          }
        }}
        title={
          paymentMadeData?.chequeStatus?.toLowerCase() === CHEQUE_STATUS.PENDING?.toLowerCase() && paymentMadeData?.paymentMode?.toLowerCase() === PAYMENT_MODES.CHEQUE?.toLowerCase()
            ? 'Receive Cheque Approval Payment'
            : paymentMadeData?.chequeStatus?.toLowerCase() === CHEQUE_STATUS.RECEIVED?.toLowerCase() && paymentMadeData?.paymentMode?.toLowerCase() === PAYMENT_MODES.CHEQUE?.toLowerCase()
              ? 'Deposit Cheque Payment'
              : 'Approve Payment'
        }
      >
        <p>Enter Transaction Details and click on Approve to proceed with the payment.</p>
        {paymentMadeData?.attachments?.length > 0 && <AttachMentDetails data={paymentMadeData} />}
        <Upload.Dragger
          multiple={false}
          accept=".jpeg,.jpg,.png,.svg,.pdf"
          showUploadList={false}
          beforeUpload={file => {
            if (file) {
              setPaymentPDF([]);
              const newFile = {
                uid: file.uid,
                name: file.name,
                status: 'done',
                url: URL.createObjectURL(file),
                originFileObj: file,
              };
              handleFileUpload(file);
              setFile([newFile]);
            }
            return false;
          }}
          fileList={file || []}
          className="custom-upload font-normal"
        >
          <Button className="w-full !h-32 border-dashed flex flex-col items-center justify-center gap-2">
            <div>
              <Icons.CloudUploadOutlined className="text-2xl" />
            </div>
            <div className="font-bold text-xs">Choose a File or Drag & Drop it here</div>
            <div className="text-xs">Supported File Types : JPEG, PNG, SVG and PDF</div>
          </Button>
        </Upload.Dragger>
        {file?.[0] && (
          <div className="mt-2 flex items-center justify-between gap-3 rounded-md border border-gray-200 bg-white px-3 py-2">
            <div className="flex items-center gap-2 min-w-0">
              {file?.[0]?.originFileObj?.type?.startsWith('image/') ? (
                <img src={file?.[0]?.url} alt={file?.[0]?.name || 'preview'} className="h-9 w-9 rounded border border-gray-200 object-cover bg-gray-50" />
              ) : (
                <div className="h-9 w-9 rounded border border-gray-200 bg-gray-50 flex items-center justify-center text-gray-600">
                  {file?.[0]?.originFileObj?.type === 'application/pdf' || file?.[0]?.name?.toLowerCase()?.endsWith('.pdf') ? <Icons.FileTextOutlined /> : <Icons.FileOutlined />}
                </div>
              )}

              <div className="min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-medium text-gray-800 truncate">{file?.[0]?.name || 'Attachment'}</span>
                  <Tag className="text-[10px] leading-4">{(file?.[0]?.originFileObj?.type || file?.[0]?.name?.split('.')?.pop() || 'file')?.toString()}</Tag>
                </div>
                {file?.[0]?.url && (
                  <a style={{ color: colorPalette.primary[500] }} className="text-xs" href={file?.[0]?.url} target="_blank" rel="noreferrer">
                    View
                  </a>
                )}
              </div>
            </div>

            <Button
              size="small"
              type="text"
              danger
              className="!px-2"
              onClick={() => {
                try {
                  if (file?.[0]?.url) URL.revokeObjectURL(file[0].url);
                } catch (e) {
                  // ignore
                }
                setFile(null);
                setPaymentPDF([]);
              }}
              icon={<Icons.DeleteOutlined />}
            />
          </div>
        )}
        <TextArea
          className="mt-5"
          rows={4}
          placeholder="Enter transaction details"
          value={approvalModal.approvalNote}
          onChange={e => setApprovalModal(prev => ({ ...prev, approvalNote: e.target.value }))}
        />

        {paymentMadeData?.paymentMode?.toLowerCase() === PAYMENT_MODES.CHEQUE?.toLowerCase() && (
          <>
            <div className="relative pt-1.5">
              <div className="mb-1">PDC Cheque Date</div>
              <DatePicker
                value={approvalModal?.pdcChequeDate ? dayjs(approvalModal?.pdcChequeDate, 'YYYY-MM-DD') : null}
                onChange={(_pdcChequeDate, dateString) => setApprovalModal(prev => ({ ...prev, pdcChequeDate: dateString }))}
                format="YYYY-MM-DD"
                className="w-full py-1.5 h-[35.5px]"
                placeholder="Select PDC Cheque Date"
              />
            </div>
            <div className="relative pt-1.5">
              <div className="mb-1">Cheque Approval Note</div>
              <TextArea
                rows={3}
                placeholder="Enter cheque approval note"
                value={approvalModal.chequeApprovalNote}
                onChange={e => setApprovalModal(prev => ({ ...prev, chequeApprovalNote: e.target.value }))}
              />
            </div>
          </>
        )}
        <div className="flex justify-end gap-2 mt-4">
          <CustomButton
            text="Go Back"
            disabled={rejectLoading || approveLoading}
            onClick={() => {
              setApprovalModal({
                visible: false,
                paymentId: null,
                approvalNote: '',
                pdcChequeDate: dayjs().format('YYYY-MM-DD'),
                chequeApprovalNote: '',
              });
              setFile(null);
              setPaymentPDF([]);
            }}
          />
          <CustomButton text="Reject" type="primary" danger loading={rejectLoading} disabled={approveLoading} onClick={handleRejectPayment} style={{ minWidth: 80 }} />
          <CustomButton text={getApproveLabel()} type="primary" loading={approveLoading} disabled={rejectLoading} onClick={handleApprovePayment} style={{ minWidth: 110 }} />
        </div>
      </CustomModal>

      {/* Cancel Modal */}
      <CustomModal
        modalOpen={cancelModal.visible}
        setModalOpen={open => {
          if (!open) setCancelModal({ visible: false, paymentId: null, note: '' });
        }}
        title="Cancel Payment"
      >
        <p>Enter Transaction Details and click on cancel to proceed with the payment.</p>
        <TextArea rows={4} placeholder="Enter transaction details" value={cancelModal.note} onChange={e => setCancelModal(prev => ({ ...prev, note: e.target.value }))} />
        <div className="flex justify-end gap-2 mt-4">
          <CustomButton text="Go Back" disabled={cancelLoading} onClick={() => setCancelModal({ visible: false, paymentId: null, note: '' })} />
          <CustomButton text="Cancel Payment" type="primary" danger loading={cancelLoading} onClick={handleCancelReceived} style={{ minWidth: 120 }} />
        </div>
      </CustomModal>

      <DocumentConfirmModal modal={deleteModal} docType={MODULE_NAMES?.PAYMENT_MADE} onConfirm={deletePaymentMade} loading={deleteLoading} getDocumentDetails={getPaymentMadeDocumentDetails} />
      {viewCustomerDetail && <CustomerDrawerDetails viewCustomerDetail={viewCustomerDetail} setViewCustomerDetail={setViewCustomerDetail} customerData={customerData} isVendor={true} />}
    </>
  );
};

export default PaymentMadeDetail;
