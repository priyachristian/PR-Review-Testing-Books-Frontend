import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { PDFDownloadLink } from '@/components/ui/common/PdfDownloadLinkLazy';
import { renderPdfToBlob } from '@/utils/loadReactPdf';

// Components
import AttachMentDetails from '@/components/feedback/formModal/AttachMentDetails';
import BackButton from '@/components/ui/button/BackButton';
import DocumentRefreshButton from '@/components/ui/button/DocumentRefreshButton';
import ConvertFromDetail from '@/components/feedback/formModal/ConvertFromDetail';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import DetailPageSkeleton from '@/components/feedback/pageLoader/DetailPageSkeleton';
import { DocumentConfirmModal } from '@/components/feedback/confirmModal/CancelOrDeleteDocumentModal';
import { DocumentMetadata, InventoryImpact, OrganizationInfo, ConversionBadges, ActionButtons } from '@/components/ui';
import { CommentHistory } from '@/features/common/comment';
import PurchaseModuleTreeView from '@/components/dataDisplay/statCard/PurchaseModuleTreeView';
import SalesModuleDetailView from '@/components/dataDisplay/statCard/SalesModuleDetailView';
import { ShowPDF } from '@/components/ui/common/ShowPDFLazy';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import StatusUpdateLoader from '@/components/feedback/pageLoader/StatusUpdateLoader';
import { Button, Dropdown, Tabs, Tag, Tooltip } from '@/components/AntDComponent';
import PermissionButton from '@/components/ui/button/PermissionButton';
import CustomerDrawerDetails from '@/features/sales/customer/components/CustomerDrawerDetails';
import ApplyOpeningBalanceCreditModal from '@/components/feedback/formModal/ApplyOpeningBalanceCreditModal';
import OpeningBalanceApplicationsHistory from '@/components/dataDisplay/statCard/OpeningBalanceApplicationsHistory';
import Toast from '@/components/ui/common/Toast';
import NoFoundPage from '@/components/ui/common/NoFoundPage';
import PageHeader from '@/components/ui/common/PageHeader';

// Hooks
import useModulePermissions from 'hooks/useModulePermissions';
import { useProfile } from '@/features/setting/profile/useProfile';
import { useConfirmModal } from '@/hooks/useConfirmModal';

// Extras
import { useBill, getBillDocumentDetails } from '@/features/purchase/bills';
import Icons from 'assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import {
  BACKEND_ENUM,
  BILL_EDIT_RESTRICTED_STATUS,
  BILL_STATUS,
  BILL_STATUS_CHANGE_RESTRICTED_STATUS,
  MODULE_NAMES,
  pageTypes,
  PERMISSION_MESSAGES,
  PAYMENT_MADE_STATUS,
  DEBIT_NOTE_STATUS,
  CONTACT_TYPE,
  LEDGER_SOURCE_MODULES,
} from 'utils/constants';
import { dateFormateForUi, isSplitDocumentUnavailable } from 'utils/services';
import { formatAmount } from '@/utils/currency';
import { hasOpeningBalanceCreditForBranch } from 'utils/openingBalanceUtils';
import { generateSafeFileName } from '@/utils/pdfname';
import StockMovementPanel from '@/components/dataDisplay/StockMovementPanel';
import DocumentJournalPanel from '@/components/dataDisplay/DocumentJournalPanel';
import BatchDetailsDrawer from '@/components/dataDisplay/BatchDetailsDrawer';
import { useViewInventory } from '@/features/inventory/viewInventory';
import { API_ROUTES } from '@/utils/apiRoute';

dayjs.extend(utc);

const BillDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { billsId } = useParams();
  const [activeKey, setActiveKey] = useState('1');
  const {
    loading,
    bill,
    submitLoading,
    deleteLoading,
    resetBill,
    getBillById,
    updateStatus,
    removeBill,
    paymentHistory,
    paymentHistoryLoading,
    getPaymentHistory,
    resetPaymentHistory,
    removeOpeningBalanceApplication,
    removeObApplicationLoading,
  } = useBill();
  const { itemInventoryBatch, itemInventoryBatchLoading, getItemInventoryBatchById, resetItemInventoryBatch } = useViewInventory();
  const billData = bill;
  const { useModuleBills, isViewOnly, isSplitSessionActive } = useModulePermissions(RESOURCES.BILLS);
  const { profile, getProfile } = useProfile();
  const [showConvertFromModal, setShowConvertFromModal] = useState(false);
  const [convertFromModalProps, setConvertFromModalProps] = useState({
    convertFromData: {},
    from: '',
    type: '',
  });
  const deleteModal = useConfirmModal();
  const cancelStatusModal = useConfirmModal();
  const [viewCustomerDetail, setViewCustomerDetail] = useState(false);
  const [showApplyVendorCreditModal, setShowApplyVendorCreditModal] = useState(false);
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

  const showApplyOpeningBalanceCredit = useMemo(() => {
    if (billData?.hasAvailableCredits != null) return Boolean(billData.hasAvailableCredits);
    return hasOpeningBalanceCreditForBranch(billData?.vendor, billData?.branchId);
  }, [billData?.hasAvailableCredits, billData?.vendor, billData?.branchId]);

  const deleteBlockedByOpeningBalanceCredit = useMemo(() => (billData?.openingBalanceApplications?.length ?? 0) > 0, [billData?.openingBalanceApplications]);

  const updateBillStatus = async newStatus => {
    if (newStatus === BACKEND_ENUM?.CANCELLED) {
      cancelStatusModal.open(billData);
      return;
    }
    await handleUpdateStatus(billData?.id || billData?._id, newStatus);
  };

  const confirmCancelStatus = async () => {
    await handleUpdateStatus(billData?.id || billData?._id, BACKEND_ENUM?.CANCELLED);
    cancelStatusModal.close();
  };

  useEffect(() => {
    const controller = new AbortController();
    getProfile({ signal: controller.signal });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    if (billsId) {
      getBillById({ billId: billsId, signal: controller.signal });
    }
    return () => {
      controller.abort();
      resetBill();
    };
  }, [billsId, isSplitSessionActive]);

  useEffect(() => {
    if (!billsId) return;
    getPaymentHistory({ billId: billsId });
    return () => resetPaymentHistory();
  }, [billsId]);

  const handleRefresh = async () => {
    await getBillById({ billId: billsId });
  };

  const handleEditClick = () => {
    resetBill();
    navigate(`/bills/${billData._id}/edit`, {
      state: {
        billsData: billData,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleDuplicateClick = () => {
    navigate('/bills/new', {
      state: {
        duplicateFromId: billData?.id || billData?._id,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleDeleteClick = () => {
    deleteModal.open(billData);
  };

  const deleteBill = async () => {
    await removeBill({ billId: billData?.id || billData?._id });
    deleteModal.close();
    navigate('/bills');
  };

  const handleDebitNoteClick = debitNoteId => {
    navigate(`/debit-notes/${debitNoteId}`, {
      state: {
        billsData: billData,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handlePaymentMadeClick = debitNoteId => {
    navigate(`/payments-made/${debitNoteId}`);
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
    if (!isObToOb && !billsId) return;
    try {
      await removeOpeningBalanceApplication({
        billId: billsId,
        applicationId: entry._id,
        creditTxnId: entry.creditTxnId || entry.openingBalanceTransactionId,
        applicationScope: isObToOb ? 'opening_balance' : 'bill',
      });
      handleObRemoveClose();
      await getPaymentHistory({ billId: billsId });
      await getBillById({ billId: billsId });
    } catch (error) {
      Toast.error(error?.message || 'Failed to remove opening balance application');
    }
  };

  const RenderPaymentHistory = () => {
    return (
      <div className="my-container p-6 space-y-6">
        {paymentHistory?.debitNotes?.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Applied Credits</h3>
              <p className="text-sm text-gray-600 mt-1">The following debit notes are applied to this bill</p>
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
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Debit Note#</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Date</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Amount Applied</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paymentHistory?.debitNotes?.map(debitNote => {
                      return debitNote?.billsApplied?.map(billsApplied => {
                        return (
                          <tr key={billsApplied._id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => handleDebitNoteClick(debitNote?._id)}>
                            <td className="py-4 px-6">
                              <Tag className="font-semibold">{debitNote?.debitNoteId}</Tag>
                            </td>
                            <td className="py-4 px-6">
                              <StatusBadge status={debitNote?.status} value={DEBIT_NOTE_STATUS?.[debitNote?.status] || '-'} />
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-gray-700">{dateFormateForUi(billsApplied?.appliedDate)}</span>
                            </td>
                            <td className="py-4 px-6">
                              <span className="font-semibold text-green-600">{formatAmount(billsApplied?.amountApplied, true, billData?.currency)}</span>
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
              <h3 className="text-lg font-semibold text-gray-900">Payment Made</h3>
              <p className="text-sm text-gray-600 mt-1">Bill has been made payments with the following payment made</p>
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
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Payment Made #</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Date</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Status</th>
                      <th className="text-left py-4 px-6 font-semibold text-gray-700">Amount paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paymentHistory?.payments?.map(paymentMade => {
                      return paymentMade?.bills?.map(billApplied => {
                        return (
                          <tr key={billApplied._id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => handlePaymentMadeClick(paymentMade?._id)}>
                            <td className="py-4 px-6">
                              <Tag className="font-semibold">{paymentMade?.paymentMadeId}</Tag>
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-gray-700">{dateFormateForUi(billApplied?.appliedDate)}</span>
                            </td>
                            <td className="py-4 px-6">
                              <StatusBadge status={paymentMade?.status} value={PAYMENT_MADE_STATUS?.[paymentMade?.status] || '-'} />
                            </td>
                            <td className="py-4 px-6">
                              <span className="font-semibold text-green-600">{formatAmount(billApplied?.amountApplied, true, billData?.currency)}</span>
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
            creditSectionTitle="Opening balance (credit)"
            creditSectionDescription="Opening balance has been paid with the following entries"
            balanceSectionTitle="Payment Made (Opening Balance)"
            balanceSectionDescription="Opening balance has been paid with the following payment made"
            showDelete={!isViewOnly}
            onRequestRemove={handleObRemoveRequest}
            removeModalOpen={obRemoveModal.open}
            entryPendingRemove={obRemoveModal.entry}
            onCloseRemoveModal={handleObRemoveClose}
            onConfirmRemove={handleObRemoveConfirm}
            removeLoading={removeObApplicationLoading}
            currency={billData?.currency}
          />
        )}
      </div>
    );
  };

  const items = [
    {
      key: '1',
      label: 'Basic Info',
      children: <SalesModuleDetailView data={billData} profile={profile} pageType={pageTypes?.BILLS} />,
    },
    ...(billData?.attachments?.length > 0
      ? [
          {
            key: '2',
            label: 'Attachments',
            children: <AttachMentDetails data={billData} />,
          },
        ]
      : []),
    {
      key: '3',
      label: 'Document Flow',
      children: <PurchaseModuleTreeView moduleTree={billData?.moduleTree} sourceModule="bill" currency={billData?.currency} />,
    },
    {
      key: 'stock-movement',
      label: 'Stock Movement',
      children: <StockMovementPanel url={API_ROUTES.PURCHASE.BILL.STOCK_MOVEMENT(billsId)} onBatchClick={handleBatchClick} />,
    },
    ...(paymentHistory?.debitNotes?.length > 0 || paymentHistory?.payments?.length > 0 || paymentHistory?.openingBalanceApplications?.length > 0
      ? [
          {
            key: '4',
            label: 'Payment History',
            children: RenderPaymentHistory(),
          },
        ]
      : []),
    {
      key: 'journal-entries',
      label: 'Journal',
      children: <DocumentJournalPanel sourceModule={LEDGER_SOURCE_MODULES.BILL} sourceId={billsId} />,
    },
    {
      key: '5',
      label: 'History',
      children: <CommentHistory moduleName={MODULE_NAMES.BILL} referenceId={billsId} commentHistory={billData?.commentHistory} canAddComment={useModuleBills?.edit} isViewOnly={isViewOnly} />,
    },
  ];

  // When document or conditional tabs change, if current tab no longer exists, switch to first tab
  useEffect(() => {
    const keys = items.map(i => i.key);
    if (keys.length && !keys.includes(activeKey)) {
      setActiveKey(keys[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- items derived from deps; omitting to avoid re-run every render
  }, [billsId, billData?.attachments?.length, paymentHistory?.debitNotes?.length, paymentHistory?.payments?.length, paymentHistory?.openingBalanceApplications?.length, activeKey]);

  const handlePrint = async () => {
    const blob = await renderPdfToBlob(
      <ShowPDF data={billData} billingAddress={billData?.vendor?.address?.billing} shippingAddress={billData?.shippingAddress} profile={profile} pageType={pageTypes.BILLS} />
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

  const handleUpdateStatus = async (billId, status) => {
    await updateStatus({ billId, status });
    getBillById({ billId });
  };

  let editStatus = !BILL_EDIT_RESTRICTED_STATUS?.includes(billData?.status);
  const inventoryEnabled = Boolean(billData?.inventoryConfig?.stockAddEnabled ?? billData?.isInventoryEnabled);

  const getConvertStatusValue = status => {
    let statusArr = [];

    const billId = billData?.id || billData?._id;
    const markAs = (backendStatus, labelStatus) => ({
      key: `markAs${labelStatus}`,
      label: `Mark As ${labelStatus}`,
      onClick: () => handleUpdateStatus(billId, backendStatus),
    });
    const openItem = markAs(BACKEND_ENUM?.OPEN, BILL_STATUS?.OPEN);
    const cancelItem = {
      key: `markAs${BILL_STATUS?.CANCELLED}`,
      label: `Mark As ${BILL_STATUS?.CANCELLED}`,
      onClick: () => updateBillStatus(BACKEND_ENUM?.CANCELLED),
    };

    if (status === BACKEND_ENUM?.DRAFT) {
      statusArr = [openItem, cancelItem];
    } else {
      statusArr = [cancelItem];
    }

    return statusArr;
  };

  const dropDownItems = [...getConvertStatusValue(billData?.status)];

  if (loading) {
    return <DetailPageSkeleton />;
  }

  if (!bill || isSplitDocumentUnavailable(bill, isSplitSessionActive)) {
    return <NoFoundPage docType={MODULE_NAMES?.BILL} />;
  }

  const customerData = {
    id: billData?.vendor?._id,
    customerDisplayName: billData?.vendor?.customerDisplayName,
  };

  const statusLabel = BILL_STATUS?.[billData?.status] || billData?.status || '-';
  const blockedTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : PERMISSION_MESSAGES.NO_PERMISSION;
  const canMarkStatus = useModuleBills?.edit && !isViewOnly && !BILL_STATUS_CHANGE_RESTRICTED_STATUS?.includes(billData?.status) && dropDownItems.length > 0;
  const canDuplicate = useModuleBills?.create && !isViewOnly;
  const canEdit = useModuleBills?.edit && editStatus && !isViewOnly;
  const canDelete = useModuleBills?.delete && !isViewOnly;
  const canDeleteBill = canDelete && !deleteBlockedByOpeningBalanceCredit;
  const markAsTooltip = canMarkStatus
    ? 'Mark Bill As'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useModuleBills?.edit
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : `This document status cannot be changed in its current status - ${statusLabel}.`;
  const duplicateTooltip = canDuplicate ? 'Duplicate Document' : blockedTooltip;
  const editTooltip = canEdit
    ? 'Edit Bill'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useModuleBills?.edit
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : `This document cannot be edited in its current status - ${statusLabel}.`;
  const deleteTooltip = canDeleteBill
    ? 'Delete Bill'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useModuleBills?.delete
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : 'This bill cannot be deleted because it is linked to opening balance credit entries. Please remove all "Opening Balance — Credit" records from the Payment History before proceeding.';

  return (
    <>
      <StatusUpdateLoader loading={submitLoading} hidden={deleteModal.isOpen || cancelStatusModal.isOpen} text="Updating bill status..." />
      <div className="bg-white border-b border-gray-100 px-4 py-4 -m-4">
        <div className="flex items-center justify-between">
          <PageHeader
            title={
              <div className="flex items-center gap-3">
                <BackButton />

                <div className="flex flex-col">
                  <h1 className="text-[18px] font-semibold text-heading leading-6">Bill Details</h1>

                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-sm font-medium text-gray-600">{billData?.billId}</span>

                    <span className="text-gray-400">•</span>

                    <StatusBadge status={billData?.status} value={BILL_STATUS?.[billData?.status]} />

                    <span className="text-gray-400">•</span>

                    <span
                      className={`inline-flex items-center gap-1.5 py-0.5 px-2.5 rounded-full text-xs font-medium ring-1 ring-inset ${
                        inventoryEnabled ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-gray-50 text-gray-600 ring-gray-500/20'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${inventoryEnabled ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                      Inventory {inventoryEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>
              </div>
            }
            rightStats={[
              {
                label: 'Total Amount',
                value: formatAmount(billData?.total || 0, true, billData?.currency),
              },
              {
                label: 'Due Amount',
                value: formatAmount(billData?.balanceAmount || 0, true, billData?.currency),
                colorClass: (billData?.balanceAmount || 0) > 0 ? 'text-red-600' : 'text-green-600',
              },
            ]}
          />

          {/* Quick Actions */}
          <div className="flex items-center space-x-3">
            <DocumentRefreshButton onRefresh={handleRefresh} />
            {billData?.vendor?._id && (
              <Button type="default" size="middle" icon={<Icons.ExportOutlined className="mr-2" />} onClick={() => setViewCustomerDetail(true)} className="flex items-center">
                View Vendor
              </Button>
            )}
            {billData?.vendor?._id && (billData?.balanceAmount || 0) > 0 && showApplyOpeningBalanceCredit && useModuleBills?.edit && !isViewOnly && (
              <Button type="default" size="middle" icon={<Icons.WalletOutlined />} onClick={() => setShowApplyVendorCreditModal(true)} className="flex items-center space-x-2">
                Apply Credit
              </Button>
            )}
            <PDFDownloadLink
              document={<ShowPDF data={billData} billingAddress={billData?.vendor?.address?.billing} shippingAddress={billData?.shippingAddress} profile={profile} pageType={pageTypes.BILLS} />}
              fileName={generateSafeFileName(billData, 'billId')}
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
                    {submitLoading ? <CustomLoader variant="button" text="Updating..." /> : 'Mark Bill As'}
                  </Button>
                </Dropdown>
              ) : (
                <Tooltip title={markAsTooltip} placement="left">
                  <span className="block w-full">
                    <Button type="primary" className="px-4 py-2 w-full" disabled block>
                      Mark Bill As
                    </Button>
                  </span>
                </Tooltip>
              )}
              <PermissionButton
                canAccess={useModuleBills?.create}
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
                canAccess={useModuleBills?.edit}
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
              <PermissionButton
                canAccess={useModuleBills?.delete}
                isViewOnly={isViewOnly}
                disabled={deleteLoading || deleteBlockedByOpeningBalanceCredit}
                tooltipTitle={deleteTooltip}
                tooltipProps={{ placement: 'left' }}
                wrapperClassName="block w-full"
                type="default"
                danger
                icon={<Icons.DeleteOutlined />}
                className="px-4 py-2 w-full"
                block
                onClick={canDeleteBill ? handleDeleteClick : undefined}
              >
                {deleteLoading ? <CustomLoader variant="button" text="Loading..." /> : 'Delete'}
              </PermissionButton>
            </ActionButtons>

            <DocumentMetadata data={billData} />

            <InventoryImpact data={billData} pageType={pageTypes?.BILLS} />

            <ConversionBadges
              convertedFrom={billData?.grpoId ? [billData.grpoId] : billData?.grpoIds && billData.grpoIds.length > 0 ? billData.grpoIds : billData?.purchaseOrders || []}
              onConvertedFromClick={() => {
                if (billData?.grpoId) {
                  setConvertFromModalProps({
                    convertFromData: billData?.grpoId || {},
                    from: 'GRPO',
                    type: 'BILL',
                  });
                } else if (billData?.grpoIds && billData?.grpoIds.length > 0) {
                  setConvertFromModalProps({
                    convertFromData: billData?.grpoIds || [],
                    from: 'GRPO',
                    type: 'BILL',
                  });
                } else {
                  setConvertFromModalProps({
                    convertFromData: billData?.purchaseOrders || [],
                    from: 'PURCHASE_ORDER',
                    type: 'BILL',
                  });
                }
                setShowConvertFromModal(true);
              }}
              convertedFromLabel={billData?.grpoId || (billData?.grpoIds && billData.grpoIds.length > 0) ? 'Converted From GRPO' : 'Converted From Purchase Order'}
            />

            {billData?.splitBillId && isSplitSessionActive && (
              <div className="my-container p-4">
                <Link to={`/bills/${billData?.splitBillId}`}>
                  <Tag className="font-semibold">{billData?.splitBillNo}</Tag>
                </Link>
              </div>
            )}

            <OrganizationInfo data={billData} />
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
          data={billData}
        />
      )}
      <DocumentConfirmModal modal={deleteModal} docType={MODULE_NAMES?.BILL} onConfirm={deleteBill} loading={deleteLoading} getDocumentDetails={getBillDocumentDetails} />
      <DocumentConfirmModal modal={cancelStatusModal} docType={MODULE_NAMES?.BILL} loading={submitLoading} mode="status" onConfirm={confirmCancelStatus} getDocumentDetails={getBillDocumentDetails} />
      {viewCustomerDetail && <CustomerDrawerDetails viewCustomerDetail={viewCustomerDetail} setViewCustomerDetail={setViewCustomerDetail} customerData={customerData} isVendor={true} />}
      {showApplyVendorCreditModal && (
        <ApplyOpeningBalanceCreditModal
          modalOpen={showApplyVendorCreditModal}
          onClose={() => setShowApplyVendorCreditModal(false)}
          mode={CONTACT_TYPE.VENDOR}
          contactDetails={billData?.vendor}
          branchId={billData?.branchId}
          isSplit={billData?.isSplit}
          contextDocumentId={billsId}
          fetchData={() => {
            getBillById({ billId: billsId });
            getPaymentHistory({ billId: billsId });
          }}
        />
      )}
      <BatchDetailsDrawer open={batchDrawerOpen} batch={itemInventoryBatch} loading={itemInventoryBatchLoading} onClose={handleBatchDrawerClose} />
    </>
  );
};

export default BillDetail;
