import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { renderPdfToBlob } from '@/utils/loadReactPdf';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
// qrcode is loaded on-demand (only when an e-invoice QR is needed)
const QRCode = { toDataURL: async (...args) => (await import('qrcode')).default.toDataURL(...args) };

// Components
import { Button, Dropdown, Tabs, Tag, Tooltip } from '@/components/AntDComponent';
import PermissionButton from '@/components/ui/button/PermissionButton';
import AttachMentDetails from '@/components/feedback/formModal/AttachMentDetails';
import BackButton from '@/components/ui/button/BackButton';
import DocumentRefreshButton from '@/components/ui/button/DocumentRefreshButton';
import ConvertFromDetail from '@/components/feedback/formModal/ConvertFromDetail';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import DetailPageSkeleton from '@/components/feedback/pageLoader/DetailPageSkeleton';
import { DocumentConfirmModal } from '@/components/feedback/confirmModal/CancelOrDeleteDocumentModal';
import { ActionButtons, ConversionBadges, DocumentMetadata, InventoryImpact, LrDetails, OrganizationInfo } from '@/components/ui';
import { CommentHistory } from '@/features/common/comment';
import { ShowPDF } from '@/components/ui/common/ShowPDFLazy';
import SalesModuleDetailView from '@/components/dataDisplay/statCard/SalesModuleDetailView';
import SalesModuleTreeView from '@/components/dataDisplay/statCard/SalesModuleTreeView';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import StatusUpdateLoader from '@/components/feedback/pageLoader/StatusUpdateLoader';
import NoFoundPage from '@/components/ui/common/NoFoundPage';
import PageHeader from '@/components/ui/common/PageHeader';
import TransportInvoice from '../components/TransportInvoice';
import CustomerDrawerDetails from '@/features/sales/customer/components/CustomerDrawerDetails';
import DispatchExportModal from '@/components/feedback/formModal/DispatchExportModal';

// Hooks
import { useAuth } from 'hooks/useAuth';
import { useConfirmModal } from '@/hooks/useConfirmModal';
import useModulePermissions from 'hooks/useModulePermissions';
import { useProfile } from '@/features/setting/profile/useProfile';

// Extras
import { getInvoiceDocumentDetails, useInvoice } from '@/features/sales/invoice';
import { getInvoiceLrDetails } from '@/features/sales/invoice/invoiceLrDetails';
import Icons from 'assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { CancelGstDocumentModal, GenerateGstDocumentModal } from '@/features/sales/gstDocument';
import StockTransferNotice from '@/features/sales/deliveryChallan/components/StockTransferNotice';
import { generateSafeFileName } from '@/utils/pdfname';
import {
  BACKEND_ENUM,
  CREDIT_NOTE_STATUS,
  INVOICE_EDIT_RESTRICTED_STATUS,
  INVOICE_STATUS,
  INVOICE_STATUS_CHANGE_RESTRICTED_STATUS,
  E_INVOICE_STATUS,
  E_WAY_BILL_STATUS,
  GST_DOCUMENT_CANCEL_MODE,
  GST_DOCUMENT_GENERATE_MODE,
  pageTypes,
  PAYMENT_MADE_STATUS,
  ADDITIONAL_FEATURES,
  MODULE_NAMES,
  CONTACT_TYPE,
  LEDGER_SOURCE_MODULES,
  PERMISSION_MESSAGES,
} from 'utils/constants';
import { dateFormateForUi, isSplitDocumentUnavailable } from 'utils/services';
import { formatAmount } from '@/utils/currency';
import { hasOpeningBalanceCreditForBranch } from 'utils/openingBalanceUtils';
import ApplyOpeningBalanceCreditModal from '@/components/feedback/formModal/ApplyOpeningBalanceCreditModal';
import OpeningBalanceApplicationsHistory from '@/components/dataDisplay/statCard/OpeningBalanceApplicationsHistory';
import Toast from '@/components/ui/common/Toast';
import StockMovementPanel from '@/components/dataDisplay/StockMovementPanel';
import DocumentJournalPanel from '@/components/dataDisplay/DocumentJournalPanel';
import BatchDetailsDrawer from '@/components/dataDisplay/BatchDetailsDrawer';
import { useViewInventory } from '@/features/inventory/viewInventory';
import { API_ROUTES } from '@/utils/apiRoute';

dayjs.extend(utc);

const InvoiceDetail = () => {
  const navigate = useNavigate();
  const { invoiceId } = useParams();
  const location = useLocation();
  const [activeKey, setActiveKey] = useState('1');
  const {
    loading,
    invoice,
    getInvoiceById,
    resetInvoice,
    updateStatus,
    generateEInvoice,
    submitEInvoiceLoading,
    submitEWayBillLoading,
    submitOnlyEWayBillLoading,
    cancelEInvoiceLoading,
    cancelOnlyEWayBillLoading,
    cancelEInvoice,
    generateEWayBill,
    generateOnlyEWayBill,
    cancelOnlyEWayBill,
    refetchEInvoice,
    refetchEInvoiceLoading,
    getGstDocumentOptions,
    getPaymentHistory,
    paymentHistoryLoading,
    paymentHistory,
    resetPaymentHistory,
    removeOpeningBalanceApplication,
    removeObApplicationLoading,
    fetchGstinDetails,
    fetchGstinLoading,
    removeInvoice,
    submitLoading,
    deleteLoading,
  } = useInvoice();
  const { itemInventoryBatch, itemInventoryBatchLoading, getItemInventoryBatchById, resetItemInventoryBatch } = useViewInventory();
  const invoiceData = invoice;
  const { useModuleInvoice, isViewOnly, isSplitSessionActive } = useModulePermissions(RESOURCES.INVOICES);
  const { profile, getProfile } = useProfile();
  const { signin } = useAuth();
  const applicableFeature = signin?.company?.applicableFeature;
  const [showConvertFromModal, setShowConvertFromModal] = useState(false);
  const [convertFromModalProps, setConvertFromModalProps] = useState({
    convertFromData: {},
    from: '',
    type: '',
  });
  const [generateMode, setGenerateMode] = useState(null);
  const [cancelMode, setCancelMode] = useState(null);
  const isEinvoicingAvailable = applicableFeature === ADDITIONAL_FEATURES?.E_INVOICE_AND_E_WAY_BILL;
  const isOnlyEWayBillAvailable = applicableFeature === ADDITIONAL_FEATURES?.ONLY_E_WAY_BILL;
  const hasActiveEWayBill = Boolean(invoiceData?.eWayBill) && invoiceData?.eWayBill?.status === E_WAY_BILL_STATUS?.ACT?.value;
  // { challanId, eWayBillNo } of a linked delivery challan whose active e-way bill already covers these goods.
  const linkedChallanEWayBill = invoiceData?.linkedChallanEWayBill || null;
  const hasActiveIrn = isEinvoicingAvailable && Boolean(invoiceData?.eInvoice?.irn) && invoiceData?.eInvoice?.status === E_INVOICE_STATUS?.ACT?.value;
  const hasLinkedActiveEWayBill = hasActiveEWayBill && Boolean(invoiceData?.eWayBill?.linkedIrn) && invoiceData?.eWayBill?.linkedIrn === invoiceData?.eInvoice?.irn;

  const generateActions = {
    [GST_DOCUMENT_GENERATE_MODE.E_INVOICE]: { submit: generateEInvoice, loading: submitEInvoiceLoading },
    [GST_DOCUMENT_GENERATE_MODE.E_WAY_BILL_BY_IRN]: { submit: generateEWayBill, loading: submitEWayBillLoading },
    [GST_DOCUMENT_GENERATE_MODE.E_WAY_BILL]: { submit: generateOnlyEWayBill, loading: submitOnlyEWayBillLoading },
  };

  // Rejects on failure so the shared modal stays open.
  const handleGenerateGstDocument = async payload => {
    const mode = generateMode;
    await generateActions[mode].submit({ invoiceId, ...payload });
    setGenerateMode(null);
    await getInvoiceById({ invoiceId });
    if (mode !== GST_DOCUMENT_GENERATE_MODE.E_INVOICE) {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  const handleCancelGstDocument = async cancelPayload => {
    if (cancelMode === GST_DOCUMENT_CANCEL_MODE.E_INVOICE) {
      const irn = invoiceData?.eInvoice?.irn || invoiceData?.eInvoice?.IRN || '';
      if (!irn) {
        Toast.error('IRN (Invoice Reference Number) not found for this invoice.');
        return;
      }
      await cancelEInvoice({ invoiceId, cancelPayload });
    } else {
      await cancelOnlyEWayBill({ invoiceId, cancelPayload });
    }
    setCancelMode(null);
    await getInvoiceById({ invoiceId });
  };

  const showApplyOpeningBalanceCredit = useMemo(() => {
    if (invoiceData?.hasAvailableCredits != null) return Boolean(invoiceData.hasAvailableCredits);
    return hasOpeningBalanceCreditForBranch(invoiceData?.customerId, invoiceData?.branchId);
  }, [invoiceData?.hasAvailableCredits, invoiceData?.customerId, invoiceData?.branchId]);

  const deleteBlockedByOpeningBalanceCredit = useMemo(() => (invoiceData?.openingBalanceApplications?.length ?? 0) > 0, [invoiceData?.openingBalanceApplications]);

  const cancelStatusModal = useConfirmModal();
  const deleteModal = useConfirmModal();
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [selectedInvoiceForDispatch, setSelectedInvoiceForDispatch] = useState(null);
  const [dispatchExportModalOpen, setDispatchExportModalOpen] = useState(false);
  const [dispatchExportActionLabel, setDispatchExportActionLabel] = useState('Download');
  const [plainDownloadLoading, setPlainDownloadLoading] = useState(false);
  const pendingDownloadRef = useRef(null);
  const [showApplyCustomerCreditModal, setShowApplyCustomerCreditModal] = useState(false);
  const [obRemoveModal, setObRemoveModal] = useState({ open: false, entry: null });
  const [batchDrawerOpen, setBatchDrawerOpen] = useState(false);

  const handleBatchClick = async (itemBatchId, item) => {
    setBatchDrawerOpen(true);
    await getItemInventoryBatchById({ itemId: item._id, batchId: itemBatchId });
  };

  const handleBatchDrawerClose = () => {
    setBatchDrawerOpen(false);
    resetItemInventoryBatch();
  };

  const updateInvoiceStatus = async newStatus => {
    if (newStatus === BACKEND_ENUM?.CANCELLED) {
      cancelStatusModal.open(invoiceData);
      return;
    }
    await handleUpdateStatus(invoiceData?.id || invoiceData?._id, newStatus);
  };

  const confirmCancelStatus = async () => {
    await handleUpdateStatus(invoiceData?.id || invoiceData?._id, BACKEND_ENUM?.CANCELLED);
    cancelStatusModal.close();
  };

  useEffect(() => {
    const controller = new AbortController();
    getProfile({ signal: controller.signal });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!invoiceId) return;
    getPaymentHistory({ invoiceId });
    return () => resetPaymentHistory();
  }, [invoiceId]);

  useEffect(() => {
    const controller = new AbortController();
    if (invoiceId) {
      getInvoiceById({ invoiceId, signal: controller.signal });
    }

    return () => {
      controller.abort();
      resetInvoice();
    };
  }, [invoiceId, isSplitSessionActive]);

  const handleRefresh = async () => {
    await getInvoiceById({ invoiceId });
  };

  const handleEditClick = () => {
    navigate(`/invoices/${invoiceData._id}/edit`, {
      state: {
        invoiceData: invoiceData,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleDuplicateClick = () => {
    navigate('/invoices/new', {
      state: {
        duplicateFromId: invoiceData?.id || invoiceData?._id,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleDeleteClick = () => {
    deleteModal.open(invoiceData);
  };

  const deleteInvoice = async () => {
    await removeInvoice({ invoiceId: invoiceData?.id || invoiceData?._id });
    deleteModal.close();
    navigate('/invoices');
  };

  const handleRefetchEInvoice = async () => {
    try {
      await refetchEInvoice({ invoiceId });
      await getInvoiceById({ invoiceId });
    } catch (error) {
      console.error('Error refetching e-invoice:', error);
    }
  };

  const handleDispatchClick = () => {
    setSelectedInvoiceForDispatch(invoiceData);
    setDispatchModalOpen(true);
  };

  const hasDispatchDetails = Boolean(invoiceData?.dispatchDetails);
  const lrDetails = useMemo(() => getInvoiceLrDetails(invoiceData), [invoiceData]);

  const triggerDownload = (downloadFn, actionLabel = 'Download') => {
    if (hasDispatchDetails) {
      pendingDownloadRef.current = downloadFn;
      setDispatchExportActionLabel(actionLabel);
      setDispatchExportModalOpen(true);
      return;
    }
    downloadFn(false);
  };

  const handleDispatchExportConfirm = includeDispatchDetails => {
    const downloadFn = pendingDownloadRef.current;
    pendingDownloadRef.current = null;
    return downloadFn?.(includeDispatchDetails);
  };

  const handlePlainDownload = () => {
    triggerDownload(async includeDispatchDetails => {
      setPlainDownloadLoading(true);
      try {
        const blob = await renderPdfToBlob(
          <ShowPDF
            data={invoiceData}
            billingAddress={invoiceData?.customerId?.address?.billing}
            shippingAddress={invoiceData?.shippingAddress}
            profile={profile}
            pageType={pageTypes.INVOICE}
            isEinvoicingAvailable={isEinvoicingAvailable}
            isEwayBillingAvailable={isOnlyEWayBillAvailable}
            showEInvoice={false}
            showEWayBill={false}
            includeDispatchDetails={includeDispatchDetails}
          />
        );
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = generateSafeFileName(invoiceData, 'invoiceId');
        link.click();
        URL.revokeObjectURL(url);
      } finally {
        setPlainDownloadLoading(false);
      }
    });
  };

  const handleCreditNoteClick = creditNoteId => {
    navigate(`/credit-notes/${creditNoteId}`, {
      state: {
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handlePaymentReceivedClick = paymentId => {
    navigate(`/payments-received/${paymentId}`);
  };

  const handleObRemoveRequest = entry => {
    if (isViewOnly) return;
    setObRemoveModal({ open: true, entry });
  };

  const handleObRemoveClose = () => setObRemoveModal({ open: false, entry: null });

  const handleObRemoveConfirm = async () => {
    const entry = obRemoveModal.entry;
    if (!entry?._id) return;
    const isObToOb = entry.applicationScope === 'opening_balance' || Boolean(entry.targetTransactionNo);
    if (!isObToOb && !invoiceId) return;
    try {
      await removeOpeningBalanceApplication({
        invoiceId,
        applicationId: entry._id,
        creditTxnId: entry.creditTxnId || entry.openingBalanceTransactionId,
        applicationScope: isObToOb ? 'opening_balance' : 'invoice',
      });
      handleObRemoveClose();
      await getPaymentHistory({ invoiceId });
      await getInvoiceById({ invoiceId });
    } catch (error) {
      Toast.error(error?.message || 'Failed to remove opening balance application');
    }
  };

  const RenderPaymentHistory = () => {
    return (
      <div className="my-container p-6 space-y-5">
        {paymentHistory?.creditNotes?.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Applied Credits</h3>
              <p className="text-sm text-gray-600 mt-1">Invoice has been credited with the following credit notes</p>
            </div>

            <div className="overflow-x-auto ">
              {paymentHistoryLoading ? (
                <div className="flex justify-center items-center min-h-[75px]">
                  <CustomLoader />
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Credit Note#</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Date</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Amount Applied</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paymentHistory?.creditNotes?.map(creditNote => {
                      return creditNote?.invoicesApplied?.map(invoiceApplied => {
                        return (
                          <tr key={invoiceApplied._id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => handleCreditNoteClick(creditNote?._id)}>
                            <td className="py-4 px-6">
                              <Tag className="font-semibold">{creditNote?.creditNoteId}</Tag>
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-gray-700">{dateFormateForUi(invoiceApplied?.appliedDate)}</span>
                            </td>
                            <td className="py-4 px-6">
                              <StatusBadge status={creditNote?.status} value={CREDIT_NOTE_STATUS?.[creditNote?.status] || '-'} />
                            </td>
                            <td className="py-4 px-6">
                              <span className="font-semibold text-green-600">{formatAmount(invoiceApplied?.amountApplied, true, invoiceData?.currency)}</span>
                            </td>
                          </tr>
                        );
                      });
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {paymentHistory?.payments?.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Payment Received</h3>
              <p className="text-sm text-gray-600 mt-1">Invoice has been received payments with the following payment received</p>
            </div>

            <div className="overflow-x-auto">
              {paymentHistoryLoading ? (
                <div className="flex justify-center items-center min-h-[75px]">
                  <CustomLoader />
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Payment Received #</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Date</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Amount received</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paymentHistory?.payments?.map(paymentReceived => {
                      return paymentReceived?.invoices?.map(invoiceApplied => {
                        return (
                          <tr key={invoiceApplied._id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => handlePaymentReceivedClick(paymentReceived?._id)}>
                            <td className="py-4 px-6">
                              <Tag className="font-semibold">{paymentReceived?.paymentReceivedId}</Tag>
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-gray-700">{dateFormateForUi(invoiceApplied?.appliedDate)}</span>
                            </td>
                            <td className="py-4 px-6">
                              <StatusBadge status={paymentReceived?.status} value={PAYMENT_MADE_STATUS?.[paymentReceived?.status] || '-'} />
                            </td>
                            <td className="py-4 px-6">
                              <span className="font-semibold text-green-600">{formatAmount(invoiceApplied?.amountApplied, true, invoiceData?.currency)}</span>
                            </td>
                          </tr>
                        );
                      });
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {paymentHistory?.openingBalanceApplications?.length > 0 && (
          <OpeningBalanceApplicationsHistory
            applications={paymentHistory.openingBalanceApplications}
            loading={paymentHistoryLoading}
            creditSectionTitle="Opening balance (payable)"
            creditSectionDescription="Opening balance has been paid with the following entries"
            balanceSectionTitle="Payment Received (Opening Balance)"
            balanceSectionDescription="Opening balance has been received with the following payment received"
            showDelete={!isViewOnly}
            onRequestRemove={handleObRemoveRequest}
            removeModalOpen={obRemoveModal.open}
            entryPendingRemove={obRemoveModal.entry}
            onCloseRemoveModal={handleObRemoveClose}
            onConfirmRemove={handleObRemoveConfirm}
            removeLoading={removeObApplicationLoading}
            currency={invoiceData?.currency}
          />
        )}
      </div>
    );
  };

  const items = [
    {
      key: '1',
      label: 'Basic Info',
      children: (
        <div className="flex flex-col gap-3">
          {invoiceData?.isFromStockTransferChallan && <StockTransferNotice variant="invoice" />}
          <SalesModuleDetailView data={invoiceData} profile={profile} pageType={pageTypes?.INVOICE} isEinvoicingAvailable={isEinvoicingAvailable} isEwayBillingAvailable={isOnlyEWayBillAvailable} />
        </div>
      ),
    },
    ...(invoiceData?.attachments?.length > 0
      ? [
          {
            key: '2',
            label: 'Attachments',
            children: <AttachMentDetails data={invoiceData} />,
          },
        ]
      : []),
    {
      key: '3',
      label: 'Document Flow',
      children: <SalesModuleTreeView moduleTree={invoiceData?.moduleTree} sourceModule="invoice" currency={invoiceData?.currency} />,
    },
    {
      key: 'stock-movement',
      label: 'Stock Movement',
      children: <StockMovementPanel url={API_ROUTES.SALES.INVOICE.STOCK_MOVEMENT(invoiceId)} onBatchClick={handleBatchClick} />,
    },
    ...(paymentHistory?.creditNotes?.length > 0 || paymentHistory?.payments?.length > 0 || paymentHistory?.openingBalanceApplications?.length > 0
      ? [
          {
            key: '4',
            label: 'Payment History',
            children: RenderPaymentHistory(),
          },
        ]
      : []),
    {
      key: 'lr-details',
      label: 'LR Details',
      children: <LrDetails details={lrDetails} dispatch={invoiceData?.dispatchDetails} eWayBill={invoiceData?.eWayBill} />,
    },
    {
      key: 'journal-entries',
      label: 'Journal',
      children: <DocumentJournalPanel sourceModule={LEDGER_SOURCE_MODULES.INVOICE} sourceId={invoiceId} />,
    },
    {
      key: '5',
      label: 'History',
      children: (
        <CommentHistory moduleName={MODULE_NAMES.INVOICE} referenceId={invoiceId} commentHistory={invoiceData?.commentHistory} canAddComment={useModuleInvoice?.edit} isViewOnly={isViewOnly} />
      ),
    },
  ];

  // When document or conditional tabs change, if current tab no longer exists, switch to first tab
  useEffect(() => {
    const keys = items.map(i => i.key);
    if (keys.length && !keys.includes(activeKey)) {
      setActiveKey(keys[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- items derived from deps; omitting to avoid re-run every render
  }, [invoiceId, invoiceData?.attachments?.length, paymentHistory?.creditNotes?.length, paymentHistory?.payments?.length, paymentHistory?.openingBalanceApplications?.length, activeKey]);

  const handlePrint = () => {
    triggerDownload(async includeDispatchDetails => {
      try {
        // Generate QR code first if eInvoice exists
        let qrCodeDataUrl = null;
        if (invoiceData?.eInvoice?.signedQrCode) {
          qrCodeDataUrl = await QRCode.toDataURL(invoiceData.eInvoice.signedQrCode, {
            width: 200,
            margin: 1,
            errorCorrectionLevel: 'L',
          });
        }
        const blob = await renderPdfToBlob(
          <ShowPDF
            data={invoiceData}
            billingAddress={invoiceData?.customerId?.address?.billing}
            shippingAddress={invoiceData?.shippingAddress}
            profile={profile}
            pageType={pageTypes.INVOICE}
            qrCodeUrl={qrCodeDataUrl} // Pass pre-generated QR code
            isEinvoicingAvailable={isEinvoicingAvailable}
            isEwayBillingAvailable={isOnlyEWayBillAvailable}
            showEInvoice={false}
            showEWayBill={false}
            includeDispatchDetails={includeDispatchDetails}
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
      } catch (error) {
        console.error('Error printing PDF:', error);
      }
    }, 'Print');
  };

  const getDownloadOptions = invoiceData => {
    const isEWayBillAvailable = invoiceData?.eWayBill && invoiceData?.eWayBill?.status === E_WAY_BILL_STATUS.ACT.value;
    const isEInvoiceAvailable = invoiceData?.eInvoice && invoiceData?.eInvoice?.status === E_INVOICE_STATUS.ACT.value;
    const options = [
      {
        key: 'only-invoice',
        label: 'Only Invoice',
        onClick: () =>
          triggerDownload(async includeDispatchDetails => {
            const blob = await renderPdfToBlob(
              <ShowPDF
                data={invoiceData}
                billingAddress={invoiceData?.customerId?.address?.billing}
                shippingAddress={invoiceData?.shippingAddress}
                profile={profile}
                pageType={pageTypes.INVOICE}
                isEinvoicingAvailable={isEinvoicingAvailable}
                isEwayBillingAvailable={isOnlyEWayBillAvailable}
                showEInvoice={false}
                showEWayBill={false}
                includeDispatchDetails={includeDispatchDetails}
              />
            );
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${invoiceData?.invoiceId}.pdf`;
            link.click();
            URL.revokeObjectURL(url);
          }),
      },
    ];

    if (isEInvoiceAvailable) {
      options.push({
        key: 'with-einvoice',
        label: 'With E-Invoice',
        disabled: !invoiceData?.eInvoice || invoiceData?.eInvoice?.status !== E_INVOICE_STATUS.ACT.value,
        onClick: () =>
          triggerDownload(async includeDispatchDetails => {
            let qrCodeDataUrl = null;
            if (invoiceData?.eInvoice?.signedQrCode) {
              qrCodeDataUrl = await QRCode.toDataURL(invoiceData.eInvoice.signedQrCode, {
                width: 200,
                margin: 1,
                errorCorrectionLevel: 'L',
              });
            }
            const blob = await renderPdfToBlob(
              <ShowPDF
                data={invoiceData}
                billingAddress={invoiceData?.customerId?.address?.billing}
                shippingAddress={invoiceData?.shippingAddress}
                profile={profile}
                pageType={pageTypes.INVOICE}
                isEinvoicingAvailable={isEinvoicingAvailable}
                isEwayBillingAvailable={isOnlyEWayBillAvailable}
                showEInvoice={true}
                showEWayBill={false}
                qrCodeUrl={qrCodeDataUrl}
                includeDispatchDetails={includeDispatchDetails}
              />
            );
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${invoiceData?.invoiceId}_with_einvoice.pdf`;
            link.click();
            URL.revokeObjectURL(url);
          }),
      });
    }

    if (isEWayBillAvailable) {
      options.push(
        {
          key: 'with-ewaybill',
          label: 'With E-Way Bill',
          disabled: !invoiceData?.eWayBill || invoiceData?.eWayBill?.status !== E_WAY_BILL_STATUS.ACT.value,
          onClick: () =>
            triggerDownload(async includeDispatchDetails => {
              let qrCodeDataUrl = null;
              if (invoiceData?.eInvoice?.signedQrCode) {
                qrCodeDataUrl = await QRCode.toDataURL(invoiceData.eInvoice.signedQrCode, {
                  width: 200,
                  margin: 1,
                  errorCorrectionLevel: 'L',
                });
              }
              const ewaybillQrCodeDataUrl = await QRCode.toDataURL(
                `EWB No: ${invoiceData?.eWayBill?.eWayBillNo} | Date: ${
                  invoiceData?.eWayBill?.eWayBillDate ? dayjs(invoiceData?.eWayBill?.eWayBillDate).format('DD/MM/YYYY HH:mm:ss') : '-'
                } | TransporterId: ${invoiceData?.eWayBill?.transporterId || '-'}`,
                {
                  width: 200,
                  margin: 1,
                  errorCorrectionLevel: 'L',
                }
              );
              const blob = await renderPdfToBlob(
                <ShowPDF
                  data={invoiceData}
                  billingAddress={invoiceData?.customerId?.address?.billing}
                  shippingAddress={invoiceData?.shippingAddress}
                  profile={profile}
                  pageType={pageTypes.INVOICE}
                  isEinvoicingAvailable={isEinvoicingAvailable}
                  isEwayBillingAvailable={isOnlyEWayBillAvailable}
                  showEInvoice={false}
                  showEWayBill={true}
                  qrCodeUrl={qrCodeDataUrl}
                  eWayBillQrCodeUrl={ewaybillQrCodeDataUrl}
                  includeDispatchDetails={includeDispatchDetails}
                />
              );
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `${invoiceData?.invoiceId}_with_ewaybill.pdf`;
              link.click();
              URL.revokeObjectURL(url);
            }),
        },
        {
          key: 'only-ewaybill',
          label: 'Only E-Way Bill',
          disabled: !invoiceData?.eWayBill || invoiceData?.eWayBill?.status !== E_WAY_BILL_STATUS.ACT.value,
          onClick: () =>
            triggerDownload(async includeDispatchDetails => {
              let eWayBillQrCodeDataUrl = null;
              if (invoiceData?.eWayBill?.eWayBillNo) {
                eWayBillQrCodeDataUrl = await QRCode.toDataURL(
                  `EWB No: ${invoiceData.eWayBill.eWayBillNo} | Date: ${
                    invoiceData?.eWayBill?.eWayBillDate ? dayjs(invoiceData?.eWayBill?.eWayBillDate).format('DD/MM/YYYY HH:mm:ss') : '-'
                  } | TransporterId: ${invoiceData?.eWayBill?.transporterId || '-'}`,
                  {
                    width: 200,
                    margin: 1,
                    errorCorrectionLevel: 'L',
                  }
                );
              }
              const blob = await renderPdfToBlob(
                <ShowPDF
                  data={invoiceData}
                  billingAddress={invoiceData?.customerId?.address?.billing}
                  shippingAddress={invoiceData?.shippingAddress}
                  profile={profile}
                  pageType={pageTypes.INVOICE}
                  isEinvoicingAvailable={isEinvoicingAvailable}
                  isEwayBillingAvailable={isOnlyEWayBillAvailable}
                  showEInvoice={false}
                  showEWayBill={true}
                  showInvoice={false}
                  eWayBillQrCodeUrl={eWayBillQrCodeDataUrl}
                  includeDispatchDetails={includeDispatchDetails}
                />
              );
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `${invoiceData?.invoiceId}_with_ewaybill.pdf`;
              link.click();
              URL.revokeObjectURL(url);
            }),
        }
      );
    }

    if (isEWayBillAvailable && isEInvoiceAvailable) {
      options.push({
        key: 'with-both',
        label: 'With E-Way Bill and E-Invoice',
        disabled: !invoiceData?.eInvoice || !invoiceData?.eWayBill || invoiceData?.eInvoice?.status !== E_INVOICE_STATUS.ACT.value || invoiceData?.eWayBill?.status !== E_WAY_BILL_STATUS.ACT.value,
        onClick: () =>
          triggerDownload(async includeDispatchDetails => {
            let qrCodeDataUrl = null;
            if (invoiceData?.eInvoice?.signedQrCode) {
              qrCodeDataUrl = await QRCode.toDataURL(invoiceData.eInvoice.signedQrCode, {
                width: 200,
                margin: 1,
                errorCorrectionLevel: 'L',
              });
            }
            const ewaybillQrCodeDataUrl = await QRCode.toDataURL(
              `EWB No: ${invoiceData?.eWayBill?.eWayBillNo} | Date: ${
                invoiceData?.eWayBill?.eWayBillDate ? dayjs(invoiceData?.eWayBill?.eWayBillDate).format('DD/MM/YYYY HH:mm:ss') : '-'
              } | TransporterId: ${invoiceData?.eWayBill?.transporterId || '-'}`,
              {
                width: 200,
                margin: 1,
                errorCorrectionLevel: 'L',
              }
            );
            const blob = await renderPdfToBlob(
              <ShowPDF
                data={invoiceData}
                billingAddress={invoiceData?.customerId?.address?.billing}
                shippingAddress={invoiceData?.shippingAddress}
                profile={profile}
                pageType={pageTypes.INVOICE}
                isEinvoicingAvailable={isEinvoicingAvailable}
                isEwayBillingAvailable={isOnlyEWayBillAvailable}
                showEInvoice={true}
                showEWayBill={true}
                qrCodeUrl={qrCodeDataUrl}
                eWayBillQrCodeUrl={ewaybillQrCodeDataUrl}
                includeDispatchDetails={includeDispatchDetails}
              />
            );
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${invoiceData?.invoiceId}_complete.pdf`;
            link.click();
            URL.revokeObjectURL(url);
          }),
      });
    }

    return options;
  };

  const getPrintOptions = invoiceData => {
    const isEWayBillAvailable = invoiceData?.eWayBill && invoiceData?.eWayBill?.status === E_WAY_BILL_STATUS.ACT.value;
    const isEInvoiceAvailable = invoiceData?.eInvoice && invoiceData?.eInvoice?.status === E_INVOICE_STATUS.ACT.value;
    const options = [
      {
        key: 'only-invoice',
        label: 'Only Invoice',
        onClick: () =>
          triggerDownload(async includeDispatchDetails => {
            const blob = await renderPdfToBlob(
              <ShowPDF
                data={invoiceData}
                billingAddress={invoiceData?.customerId?.address?.billing}
                shippingAddress={invoiceData?.shippingAddress}
                profile={profile}
                pageType={pageTypes.INVOICE}
                isEinvoicingAvailable={isEinvoicingAvailable}
                isEwayBillingAvailable={isOnlyEWayBillAvailable}
                showEInvoice={false}
                showEWayBill={false}
                includeDispatchDetails={includeDispatchDetails}
              />
            );
            const blobUrl = URL.createObjectURL(blob);
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = blobUrl;
            document.body.appendChild(iframe);
            iframe.onload = () => {
              iframe.contentWindow?.focus();
              iframe.contentWindow?.print();
            };
          }, 'Print'),
      },
    ];
    if (isEInvoiceAvailable) {
      options.push({
        key: 'with-einvoice',
        label: 'With E-Invoice',
        disabled: !invoiceData?.eInvoice || invoiceData?.eInvoice?.status !== E_INVOICE_STATUS.ACT.value,
        onClick: () =>
          triggerDownload(async includeDispatchDetails => {
            let qrCodeDataUrl = null;
            if (invoiceData?.eInvoice?.signedQrCode) {
              qrCodeDataUrl = await QRCode.toDataURL(invoiceData.eInvoice.signedQrCode, {
                width: 200,
                margin: 1,
                errorCorrectionLevel: 'L',
              });
            }
            const blob = await renderPdfToBlob(
              <ShowPDF
                data={invoiceData}
                billingAddress={invoiceData?.customerId?.address?.billing}
                shippingAddress={invoiceData?.shippingAddress}
                profile={profile}
                pageType={pageTypes.INVOICE}
                isEinvoicingAvailable={isEinvoicingAvailable}
                isEwayBillingAvailable={isOnlyEWayBillAvailable}
                showEInvoice={true}
                showEWayBill={false}
                qrCodeUrl={qrCodeDataUrl}
                includeDispatchDetails={includeDispatchDetails}
              />
            );
            const blobUrl = URL.createObjectURL(blob);
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = blobUrl;
            document.body.appendChild(iframe);
            iframe.onload = () => {
              iframe.contentWindow?.focus();
              iframe.contentWindow?.print();
            };
          }, 'Print'),
      });
    }

    if (isEWayBillAvailable) {
      options.push(
        {
          key: 'with-ewaybill',
          label: 'With E-Way Bill',
          disabled: !invoiceData?.eWayBill || invoiceData?.eWayBill?.status !== E_WAY_BILL_STATUS.ACT.value,
          onClick: () =>
            triggerDownload(async includeDispatchDetails => {
              let qrCodeDataUrl = null;
              if (invoiceData?.eInvoice?.signedQrCode) {
                qrCodeDataUrl = await QRCode.toDataURL(invoiceData.eInvoice.signedQrCode, {
                  width: 200,
                  margin: 1,
                  errorCorrectionLevel: 'L',
                });
              }
              let eWayBillQrCodeDataUrl = null;
              if (invoiceData?.eWayBill?.eWayBillNo) {
                eWayBillQrCodeDataUrl = await QRCode.toDataURL(
                  `EWB No: ${invoiceData.eWayBill.eWayBillNo} | Date: ${
                    invoiceData?.eWayBill?.eWayBillDate ? dayjs(invoiceData?.eWayBill?.eWayBillDate).format('DD/MM/YYYY HH:mm:ss') : '-'
                  } | TransporterId: ${invoiceData?.eWayBill?.transporterId || '-'}`,
                  {
                    width: 200,
                    margin: 1,
                    errorCorrectionLevel: 'L',
                  }
                );
              }
              const blob = await renderPdfToBlob(
                <ShowPDF
                  data={invoiceData}
                  billingAddress={invoiceData?.customerId?.address?.billing}
                  shippingAddress={invoiceData?.shippingAddress}
                  profile={profile}
                  pageType={pageTypes.INVOICE}
                  isEinvoicingAvailable={isEinvoicingAvailable}
                  isEwayBillingAvailable={isOnlyEWayBillAvailable}
                  showEInvoice={false}
                  showEWayBill={true}
                  qrCodeUrl={qrCodeDataUrl}
                  eWayBillQrCodeUrl={eWayBillQrCodeDataUrl}
                  includeDispatchDetails={includeDispatchDetails}
                />
              );
              const blobUrl = URL.createObjectURL(blob);
              const iframe = document.createElement('iframe');
              iframe.style.display = 'none';
              iframe.src = blobUrl;
              document.body.appendChild(iframe);
              iframe.onload = () => {
                iframe.contentWindow?.focus();
                iframe.contentWindow?.print();
              };
            }, 'Print'),
        },
        {
          key: 'only-ewaybill',
          label: 'Only E-Way Bill',
          disabled: !invoiceData?.eWayBill || invoiceData?.eWayBill?.status !== E_WAY_BILL_STATUS.ACT.value,
          onClick: () =>
            triggerDownload(async includeDispatchDetails => {
              let eWayBillQrCodeDataUrl = null;
              if (invoiceData?.eWayBill?.eWayBillNo) {
                eWayBillQrCodeDataUrl = await QRCode.toDataURL(
                  `EWB No: ${invoiceData.eWayBill.eWayBillNo} | Date: ${
                    invoiceData?.eWayBill?.eWayBillDate ? dayjs(invoiceData?.eWayBill?.eWayBillDate).format('DD/MM/YYYY HH:mm:ss') : '-'
                  } | TransporterId: ${invoiceData?.eWayBill?.transporterId || '-'}`,
                  {
                    width: 200,
                    margin: 1,
                    errorCorrectionLevel: 'L',
                  }
                );
              }
              const blob = await renderPdfToBlob(
                <ShowPDF
                  data={invoiceData}
                  billingAddress={invoiceData?.customerId?.address?.billing}
                  shippingAddress={invoiceData?.shippingAddress}
                  profile={profile}
                  pageType={pageTypes.INVOICE}
                  isEinvoicingAvailable={isEinvoicingAvailable}
                  isEwayBillingAvailable={isOnlyEWayBillAvailable}
                  showEInvoice={false}
                  showEWayBill={true}
                  showInvoice={false}
                  eWayBillQrCodeUrl={eWayBillQrCodeDataUrl}
                  includeDispatchDetails={includeDispatchDetails}
                />
              );
              const blobUrl = URL.createObjectURL(blob);
              const iframe = document.createElement('iframe');
              iframe.style.display = 'none';
              iframe.src = blobUrl;
              document.body.appendChild(iframe);
              iframe.onload = () => {
                iframe.contentWindow?.focus();
                iframe.contentWindow?.print();
              };
            }, 'Print'),
        }
      );
    }

    if (isEWayBillAvailable && isEInvoiceAvailable) {
      options.push({
        key: 'with-both',
        label: 'With E-Way Bill and E-Invoice',
        disabled: !invoiceData?.eInvoice || !invoiceData?.eWayBill || invoiceData?.eInvoice?.status !== E_INVOICE_STATUS.ACT.value || invoiceData?.eWayBill?.status !== E_WAY_BILL_STATUS.ACT.value,
        onClick: () =>
          triggerDownload(async includeDispatchDetails => {
            let qrCodeDataUrl = null;
            if (invoiceData?.eInvoice?.signedQrCode) {
              qrCodeDataUrl = await QRCode.toDataURL(invoiceData.eInvoice.signedQrCode, {
                width: 200,
                margin: 1,
                errorCorrectionLevel: 'L',
              });
            }
            let eWayBillQrCodeDataUrl = null;
            if (invoiceData?.eWayBill?.eWayBillNo) {
              eWayBillQrCodeDataUrl = await QRCode.toDataURL(
                `EWB No: ${invoiceData.eWayBill.eWayBillNo} | Date: ${
                  invoiceData?.eWayBill?.eWayBillDate ? dayjs(invoiceData?.eWayBill?.eWayBillDate).format('DD/MM/YYYY HH:mm:ss') : '-'
                } | TransporterId: ${invoiceData?.eWayBill?.transporterId || '-'}`,
                {
                  width: 200,
                  margin: 1,
                  errorCorrectionLevel: 'L',
                }
              );
            }
            const blob = await renderPdfToBlob(
              <ShowPDF
                data={invoiceData}
                billingAddress={invoiceData?.customerId?.address?.billing}
                shippingAddress={invoiceData?.shippingAddress}
                profile={profile}
                pageType={pageTypes.INVOICE}
                isEinvoicingAvailable={isEinvoicingAvailable}
                isEwayBillingAvailable={isOnlyEWayBillAvailable}
                showEInvoice={true}
                showEWayBill={true}
                qrCodeUrl={qrCodeDataUrl}
                eWayBillQrCodeUrl={eWayBillQrCodeDataUrl}
                includeDispatchDetails={includeDispatchDetails}
              />
            );
            const blobUrl = URL.createObjectURL(blob);
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = blobUrl;
            document.body.appendChild(iframe);
            iframe.onload = () => {
              iframe.contentWindow?.focus();
              iframe.contentWindow?.print();
            };
          }, 'Print'),
      });
    }
    return options;
  };

  const handleUpdateStatus = async (invoiceId, status) => {
    await updateStatus({ invoiceId, status });
    getInvoiceById({ invoiceId });
  };

  let editStatus = !INVOICE_EDIT_RESTRICTED_STATUS?.includes(invoiceData?.status);

  const getConvertStatusValue = status => {
    let statusArr = [];

    const markAs = (backendStatus, labelStatus) => ({
      key: `markAs${labelStatus}`,
      label: `Mark As ${labelStatus}`,
      onClick: () => handleUpdateStatus(invoiceData?._id, backendStatus),
    });
    const sentItem = markAs(BACKEND_ENUM?.SENT, INVOICE_STATUS?.SENT);
    const cancelItem = {
      key: `markAs${INVOICE_STATUS?.CANCELLED}`,
      label: `Mark As ${INVOICE_STATUS?.CANCELLED}`,
      onClick: () => updateInvoiceStatus(BACKEND_ENUM?.CANCELLED),
    };

    if (status === BACKEND_ENUM?.DRAFT) {
      statusArr = [sentItem, cancelItem];
    } else {
      statusArr = [cancelItem];
    }

    return statusArr;
  };

  const dropDownItems = [...getConvertStatusValue(invoiceData?.status)];

  const [viewCustomerDetail, setViewCustomerDetail] = useState(false);

  if (loading) {
    return <DetailPageSkeleton />;
  }

  if (!invoice || isSplitDocumentUnavailable(invoice, isSplitSessionActive)) {
    return <NoFoundPage docType={MODULE_NAMES?.INVOICE} />;
  }

  const statusLabel = INVOICE_STATUS?.[invoiceData?.status] || invoiceData?.status || '-';
  const blockedTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : PERMISSION_MESSAGES.NO_PERMISSION;
  const canMarkStatus = useModuleInvoice?.edit && !isViewOnly && !INVOICE_STATUS_CHANGE_RESTRICTED_STATUS?.includes(invoiceData?.status) && dropDownItems.length > 0;
  const canDispatch = useModuleInvoice?.edit && !isViewOnly && invoiceData?.status !== BACKEND_ENUM?.CANCELLED;
  const canDuplicate = useModuleInvoice?.create && !isViewOnly;
  const canEditOrder = useModuleInvoice?.edit && editStatus && !isViewOnly;
  const canDelete = useModuleInvoice?.delete && !isViewOnly;
  const canDeleteInvoice = canDelete && !deleteBlockedByOpeningBalanceCredit;

  const markAsTooltip = canMarkStatus
    ? 'Mark Invoice As'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useModuleInvoice?.edit
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : `This document status cannot be changed in its current status - ${statusLabel}.`;
  const dispatchTooltip = canDispatch
    ? 'Dispatch Invoice'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useModuleInvoice?.edit
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : `Dispatch not allowed for this status - ${statusLabel}.`;
  const duplicateTooltip = canDuplicate ? 'Duplicate Document' : blockedTooltip;
  const editTooltip = canEditOrder
    ? 'Edit Invoice'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useModuleInvoice?.edit
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : `This document cannot be edited in its current status - ${statusLabel}.`;
  const deleteTooltip = canDeleteInvoice
    ? 'Delete Invoice'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useModuleInvoice?.delete
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : 'This invoice cannot be deleted because it is linked to opening balance credit entries. Please remove all "Opening Balance — Credit" records from the Payment History before proceeding.';

  const customerData = {
    id: invoiceData?.customerId?._id || invoiceData?.customerId?.id,
    customerDisplayName: invoiceData?.customerId?.customerDisplayName,
  };

  const handleFetchGstinDetails = async gstin => {
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9]Z[0-9A-Z]$/;
    if (!gstin) return { error: null, name: null };

    if (!gstinRegex.test(gstin.toUpperCase())) {
      return { error: 'Invalid GSTIN format', name: null };
    }

    try {
      const response = await fetchGstinDetails({ gstin });

      if (response?.data) {
        return {
          error: null,
          name: response?.data?.data?.TradeName || response?.data?.data?.tradeName,
        };
      }
      return { error: null, name: null };
    } catch (error) {
      const errorMessage = typeof error === 'string' ? error : error?.message || 'Failed to fetch transporter details';
      return { error: errorMessage, name: null };
    }
  };

  return (
    <>
      <StatusUpdateLoader loading={submitLoading} hidden={deleteModal.isOpen || cancelStatusModal.isOpen} text="Updating invoice status..." />
      <div className="bg-white border-b border-gray-100 px-4 py-4 -m-4">
        <div className="flex items-center justify-between">
          <PageHeader
            title={
              <div className="flex items-center gap-3">
                <BackButton />

                <div className="flex flex-col">
                  <h1 className="text-[18px] font-semibold text-heading leading-6">Invoice Details</h1>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-medium text-gray-600">{invoiceData?.invoiceId}</span>

                    <span className="text-gray-400">•</span>

                    <StatusBadge status={invoiceData?.status} value={INVOICE_STATUS?.[invoiceData?.status]} />
                  </div>
                </div>
              </div>
            }
            rightStats={[
              {
                label: 'Total Amount',
                value: formatAmount(invoiceData?.total || 0, true, invoiceData?.currency),
              },
              {
                label: 'Due Amount',
                value: formatAmount(invoiceData?.balanceAmount || 0, true, invoiceData?.currency),
                colorClass: (invoiceData?.balanceAmount || 0) > 0 ? 'text-red-600' : 'text-green-600',
              },
            ]}
          />

          {/* Quick Actions */}
          <div className="flex items-center space-x-3">
            <DocumentRefreshButton onRefresh={handleRefresh} />

            {/* Download Dropdown */}
            {invoiceData?.customerId && (
              <Button type="default" size="middle" icon={<Icons.ExportOutlined className="mr-2" />} onClick={() => setViewCustomerDetail(true)} className="flex items-center">
                View Customer
              </Button>
            )}
            {invoiceData?.customerId?._id && invoiceData?.balanceAmount > 0 && showApplyOpeningBalanceCredit && useModuleInvoice?.edit && !isViewOnly && (
              <Button type="default" size="middle" icon={<Icons.WalletOutlined />} onClick={() => setShowApplyCustomerCreditModal(true)} className="flex items-center space-x-2">
                Apply Credit
              </Button>
            )}
            {((invoiceData?.eInvoice && invoiceData?.eInvoice?.status === E_INVOICE_STATUS.ACT.value) || (invoiceData?.eWayBill && invoiceData?.eWayBill?.status === E_WAY_BILL_STATUS.ACT.value)) &&
            (isEinvoicingAvailable || isOnlyEWayBillAvailable) ? (
              <Dropdown
                menu={{
                  items: getDownloadOptions(invoiceData),
                }}
                trigger={['hover']}
                placement="bottom"
              >
                <Button type="default" size="middle" icon={<Icons.DownloadOutlined className="mr-2" />} className="flex items-center">
                  Download <Icons.DownOutlined />
                </Button>
              </Dropdown>
            ) : (
              <Button
                type="default"
                size="middle"
                icon={<Icons.DownloadOutlined className="mr-2" />}
                disabled={plainDownloadLoading}
                loading={plainDownloadLoading}
                className="flex items-center"
                onClick={handlePlainDownload}
              >
                Download
              </Button>
            )}
            {/* Print Dropdown */}
            {((invoiceData?.eInvoice && invoiceData?.eInvoice?.status === E_INVOICE_STATUS.ACT.value) || (invoiceData?.eWayBill && invoiceData?.eWayBill?.status === E_WAY_BILL_STATUS.ACT.value)) &&
            (isEinvoicingAvailable || isOnlyEWayBillAvailable) ? (
              <Dropdown
                menu={{
                  items: getPrintOptions(invoiceData),
                }}
                trigger={['hover']}
                placement="bottomRight"
              >
                <Button type="default" size="middle" icon={<Icons.PrinterOutlined />}>
                  Print <Icons.DownOutlined />
                </Button>
              </Dropdown>
            ) : (
              <Button type="default" size="middle" icon={<Icons.PrinterOutlined className="mr-2" />} className="flex items-center" onClick={handlePrint}>
                Print
              </Button>
            )}
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
                    {submitLoading ? <CustomLoader variant="button" text="Updating..." /> : 'Mark Invoice As'}
                  </Button>
                </Dropdown>
              ) : (
                <Tooltip title={markAsTooltip} placement="left">
                  <span className="block w-full">
                    <Button type="primary" className="px-4 py-2 w-full" disabled block>
                      Mark Invoice As
                    </Button>
                  </span>
                </Tooltip>
              )}

              {/* E-Invoice Section */}
              {isEinvoicingAvailable &&
                !invoiceData?.isSplit &&
                ![INVOICE_STATUS.DRAFT.toLowerCase(), INVOICE_STATUS.CANCELLED.toLowerCase()].includes(invoiceData?.status.toLowerCase()) &&
                !isViewOnly && (
                  <>
                    {useModuleInvoice.edit && !invoiceData?.eInvoice && (
                      <div className="relative w-full">
                        <CustomButton
                          type="primary"
                          className="px-4 py-2 min-w-full flex items-center justify-center gap-2"
                          onClick={() => setGenerateMode(GST_DOCUMENT_GENERATE_MODE.E_INVOICE)}
                          text="Generate E-Invoice"
                          loading={submitEInvoiceLoading}
                        />
                      </div>
                    )}

                    {useModuleInvoice.edit && invoiceData?.eInvoice && invoiceData?.eInvoice?.status === E_INVOICE_STATUS?.CNL?.value && (
                      <div className="relative w-full">
                        <Tooltip
                          placement="left"
                          title="This invoice's e-invoice (IRN) was already generated and cancelled. As per GST rules, a new IRN cannot be generated for the same invoice number. Please raise a new invoice."
                        >
                          <span className="block w-full">
                            <CustomButton type="primary" className="px-4 py-2 min-w-full flex items-center justify-center gap-2" text="Generate E-Invoice" disabled />
                          </span>
                        </Tooltip>
                      </div>
                    )}

                    {useModuleInvoice.edit && (!invoiceData?.eInvoice || invoiceData?.eInvoice?.status !== E_INVOICE_STATUS?.ACT?.value) && (
                      <CustomButton
                        type="default"
                        className="px-4 py-2 w-full flex items-center justify-center gap-2"
                        onClick={handleRefetchEInvoice}
                        text="Refetch E-Invoice"
                        loading={refetchEInvoiceLoading}
                        icon={<Icons.SyncOutlined />}
                        iconPosition="left"
                      />
                    )}

                    {useModuleInvoice.edit && invoiceData?.eInvoice && invoiceData?.eInvoice?.status === E_INVOICE_STATUS?.ACT?.value && (
                      <div className="relative w-full">
                        <Tooltip
                          placement="left"
                          title={
                            hasLinkedActiveEWayBill
                              ? 'This IRN cannot be cancelled because an e-way bill generated from it is still active. Cancel that e-way bill first, then try cancelling the IRN.'
                              : ''
                          }
                        >
                          <span className="block w-full">
                            <CustomButton
                              type="primary"
                              danger
                              className="px-4 py-2 min-w-full flex items-center justify-center gap-2"
                              onClick={() => setCancelMode(GST_DOCUMENT_CANCEL_MODE.E_INVOICE)}
                              text="Cancel E-Invoice"
                              disabled={hasLinkedActiveEWayBill}
                            />
                          </span>
                        </Tooltip>
                      </div>
                    )}
                  </>
                )}

              {(isOnlyEWayBillAvailable || isEinvoicingAvailable) &&
                !invoiceData?.isSplit &&
                ![INVOICE_STATUS.DRAFT.toLowerCase(), INVOICE_STATUS.CANCELLED.toLowerCase()].includes(invoiceData?.status.toLowerCase()) &&
                !isViewOnly && (
                  <>
                    {useModuleInvoice.edit && (!invoiceData?.eWayBill || invoiceData?.eWayBill?.status === E_WAY_BILL_STATUS?.CNL?.value) && (
                      <Tooltip
                        placement="left"
                        title={
                          linkedChallanEWayBill
                            ? `E-way bill ${linkedChallanEWayBill.eWayBillNo} is already active on delivery challan ${linkedChallanEWayBill.challanId}. Cancel it there to generate one for this invoice.`
                            : ''
                        }
                      >
                        <span className="block w-full">
                          <CustomButton
                            type="primary"
                            className="px-4 py-2 w-full"
                            onClick={() => {
                              if (hasActiveIrn) {
                                setGenerateMode(GST_DOCUMENT_GENERATE_MODE.E_WAY_BILL_BY_IRN);
                              } else {
                                setGenerateMode(GST_DOCUMENT_GENERATE_MODE.E_WAY_BILL);
                              }
                            }}
                            text="Generate E-Way Bill"
                            loading={submitOnlyEWayBillLoading || submitEWayBillLoading}
                            disabled={Boolean(linkedChallanEWayBill)}
                          />
                        </span>
                      </Tooltip>
                    )}

                    {useModuleInvoice.edit && invoiceData?.eWayBill && invoiceData?.eWayBill?.status === E_WAY_BILL_STATUS?.ACT?.value && (
                      <CustomButton
                        type="primary"
                        danger
                        className="px-4 py-2 w-full"
                        onClick={() => setCancelMode(GST_DOCUMENT_CANCEL_MODE.E_WAY_BILL)}
                        text="Cancel E-Way Bill"
                        loading={cancelOnlyEWayBillLoading}
                      />
                    )}
                  </>
                )}

              {/* Dispatch Button */}
              <PermissionButton
                canAccess={useModuleInvoice?.edit}
                isViewOnly={isViewOnly}
                disabled={invoiceData?.status === BACKEND_ENUM?.CANCELLED || submitLoading}
                tooltipTitle={dispatchTooltip}
                tooltipProps={{ placement: 'left' }}
                wrapperClassName="block w-full"
                type="default"
                icon={<Icons.TruckOutlined />}
                className={`px-4 py-2 w-full ${invoiceData?.invoiceDispatchId ? 'custom-invoice-dispatch-btn' : ''}`}
                block
                onClick={canDispatch ? handleDispatchClick : undefined}
                style={{
                  color: canDispatch ? '#7C3AED' : undefined,
                }}
              >
                {submitLoading ? <CustomLoader variant="button" text="Loading..." /> : 'Dispatch'}
              </PermissionButton>
              <PermissionButton
                canAccess={useModuleInvoice?.create}
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
                canAccess={useModuleInvoice?.edit}
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
                canAccess={useModuleInvoice?.delete}
                isViewOnly={isViewOnly}
                disabled={deleteBlockedByOpeningBalanceCredit || deleteLoading}
                tooltipTitle={deleteTooltip}
                tooltipProps={{ placement: 'left' }}
                wrapperClassName="block w-full"
                type="default"
                danger
                icon={<Icons.DeleteOutlined />}
                className="px-4 py-2 w-full"
                block
                onClick={canDeleteInvoice ? handleDeleteClick : undefined}
              >
                {deleteLoading ? <CustomLoader variant="button" text="Deleting..." /> : 'Delete'}
              </PermissionButton>
            </ActionButtons>

            <div className="space-y-3">
              <DocumentMetadata data={invoiceData} />

              <InventoryImpact data={invoiceData} pageType={pageTypes?.INVOICE} />

              <ConversionBadges
                convertedFrom={
                  invoiceData?.deliveryChallanId
                    ? [invoiceData.deliveryChallanId]
                    : invoiceData?.deliveryChallanIds?.length > 0
                      ? invoiceData.deliveryChallanIds
                      : invoiceData?.quoteId
                        ? [invoiceData.quoteId]
                        : invoiceData?.salesOrders?.length > 0
                          ? invoiceData.salesOrders
                          : []
                }
                onConvertedFromClick={() => {
                  if (invoiceData?.deliveryChallanId) {
                    setConvertFromModalProps({
                      convertFromData: invoiceData?.deliveryChallanId || {},
                      from: 'DELIVERY_CHALLAN',
                      type: 'INVOICE',
                    });
                  } else if (invoiceData?.deliveryChallanIds?.length > 0) {
                    setConvertFromModalProps({
                      convertFromData: invoiceData?.deliveryChallanIds || [],
                      from: 'DELIVERY_CHALLAN',
                      type: 'INVOICE',
                    });
                  } else if (invoiceData?.quoteId) {
                    setConvertFromModalProps({
                      convertFromData: invoiceData?.quoteId || {},
                      from: 'QUOTE',
                      type: 'INVOICE',
                    });
                  } else if (invoiceData?.salesOrders?.length > 0) {
                    setConvertFromModalProps({
                      convertFromData: invoiceData?.salesOrders || [],
                      from: 'SALES_ORDER',
                      type: 'INVOICE',
                    });
                  }
                  setShowConvertFromModal(true);
                }}
                convertedFromLabel={
                  invoiceData?.deliveryChallanId || invoiceData?.deliveryChallanIds?.length > 0
                    ? 'Converted From Delivery Challan'
                    : invoiceData?.quoteId
                      ? 'Converted From Quote'
                      : invoiceData?.salesOrders?.length > 0
                        ? 'Converted From Sales Order'
                        : ''
                }
              />

              {invoiceData?.splitInvoiceId && isSplitSessionActive && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-3">
                    <Link to={`/invoices/${invoiceData?.splitInvoiceId}`}>
                      <Tag className="font-semibold">{invoiceData?.splitInvoiceNo}</Tag>
                    </Link>
                  </div>
                </div>
              )}

              <OrganizationInfo data={invoiceData} />
            </div>
          </div>
        </div>
      </div>
      {showConvertFromModal && (
        <ConvertFromDetail
          open={showConvertFromModal}
          onClose={() => {
            setShowConvertFromModal(false);
          }}
          convertFromData={convertFromModalProps?.convertFromData}
          from={convertFromModalProps?.from}
          type={convertFromModalProps?.type}
          data={invoiceData}
        />
      )}

      {/* E-Invoice and E-Way Bill modals */}
      <GenerateGstDocumentModal
        mode={generateMode}
        onClose={() => setGenerateMode(null)}
        onSubmit={handleGenerateGstDocument}
        loading={Boolean(generateActions[generateMode]?.loading)}
        items={invoiceData?.items}
        documentLabel="invoice"
        contextItems={[
          { label: 'Invoice#', value: invoiceData?.invoiceId },
          { label: 'Customer Name', value: invoiceData?.customerId?.customerDisplayName },
        ]}
        hasActiveEWayBill={hasActiveEWayBill}
        // The goods already travel on the linked challan's e-way bill.
        allowEWayBillWithEInvoice={!linkedChallanEWayBill}
        onInvalidHsn={() => getInvoiceById({ invoiceId, silent: true })}
        loadOptions={async () => (await getGstDocumentOptions({ invoiceId }))?.data}
        onFetchGstinDetails={handleFetchGstinDetails}
        fetchGstinLoading={fetchGstinLoading}
      />
      <CancelGstDocumentModal
        mode={cancelMode}
        onClose={() => setCancelMode(null)}
        onSubmit={handleCancelGstDocument}
        loading={cancelMode === GST_DOCUMENT_CANCEL_MODE.E_INVOICE ? cancelEInvoiceLoading : cancelOnlyEWayBillLoading}
      />
      <TransportInvoice
        modalOpen={dispatchModalOpen}
        setModalOpen={setDispatchModalOpen}
        selectedInvoice={selectedInvoiceForDispatch}
        setSelectedInvoice={setSelectedInvoiceForDispatch}
        fetchInvoices={() => getInvoiceById({ invoiceId })}
      />
      <DispatchExportModal modalOpen={dispatchExportModalOpen} setModalOpen={setDispatchExportModalOpen} onConfirm={handleDispatchExportConfirm} actionLabel={dispatchExportActionLabel} />

      <DocumentConfirmModal modal={deleteModal} docType={MODULE_NAMES?.INVOICE} onConfirm={deleteInvoice} loading={deleteLoading} getDocumentDetails={getInvoiceDocumentDetails} />
      <DocumentConfirmModal
        modal={cancelStatusModal}
        docType={MODULE_NAMES?.INVOICE}
        loading={submitLoading}
        mode="status"
        onConfirm={confirmCancelStatus}
        getDocumentDetails={getInvoiceDocumentDetails}
      />
      {viewCustomerDetail && <CustomerDrawerDetails viewCustomerDetail={viewCustomerDetail} setViewCustomerDetail={setViewCustomerDetail} customerData={customerData} />}
      {showApplyCustomerCreditModal && (
        <ApplyOpeningBalanceCreditModal
          modalOpen={showApplyCustomerCreditModal}
          onClose={() => setShowApplyCustomerCreditModal(false)}
          mode={CONTACT_TYPE.CUSTOMER}
          contactDetails={invoiceData?.customerId}
          branchId={invoiceData?.branchId}
          isSplit={invoiceData?.isSplit}
          contextDocumentId={invoiceId}
          fetchData={() => {
            getInvoiceById({ invoiceId });
            getPaymentHistory({ invoiceId });
          }}
        />
      )}
      <BatchDetailsDrawer open={batchDrawerOpen} batch={itemInventoryBatch} loading={itemInventoryBatchLoading} onClose={handleBatchDrawerClose} />
    </>
  );
};

export default InvoiceDetail;
