import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { PDFDownloadLink } from '@/components/ui/common/PdfDownloadLinkLazy';
import { renderPdfToBlob } from '@/utils/loadReactPdf';

// Components
import AttachMentDetails from '@/components/feedback/formModal/AttachMentDetails';
import BackButton from '@/components/ui/button/BackButton';
import DocumentRefreshButton from '@/components/ui/button/DocumentRefreshButton';
import DetailPageSkeleton from '@/components/feedback/pageLoader/DetailPageSkeleton';
import { DocumentConfirmModal } from '@/components/feedback/confirmModal/CancelOrDeleteDocumentModal';
import { DocumentMetadata, OrganizationInfo, ActionButtons } from '@/components/ui';
import { CommentHistory } from '@/features/common/comment';
import ExpenseDetailView from '@/features/purchase/expenses/components/ExpenseDetailView';
import { ExpensePDF } from '@/components/ui/common/ExpensePdfLazy';
import { Button, Tabs, Tag } from '@/components/AntDComponent';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import PageHeader from '@/components/ui/common/PageHeader';
import CustomerDrawerDetails from '@/features/sales/customer/components/CustomerDrawerDetails';

// Hooks
import useModulePermissions from 'hooks/useModulePermissions';
import { useConfirmModal } from '@/hooks/useConfirmModal';
import { useProfile } from '@/features/setting/profile/useProfile';

// Extras
import { getExpenseDocumentDetails, useExpenses } from '@/features/purchase/expenses';
import Icons from 'assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { MODULE_NAMES, LEDGER_SOURCE_MODULES, EXPENSE_BILLABLE_STATUS, LEDGER_PARTY_TYPES, PAYMENT_MADE_STATUS, PAYMENT_RECEIVED_STATUS, PERMISSION_MESSAGES } from 'utils/constants';
import { dateFormateForUi } from 'utils/services';
import DocumentJournalPanel from '@/components/dataDisplay/DocumentJournalPanel';
import { generateSafeFileName } from '@/utils/pdfname';
import { formatAmount } from '@/utils/currency';
import PermissionButton from '@/components/ui/button/PermissionButton';
import NoFoundPage from '@/components/ui/common/NoFoundPage';

const ExpensePayments = ({ expense }) => {
  const navigate = useNavigate();
  const isVendorBillable = expense.partyType === LEDGER_PARTY_TYPES.VENDOR;
  const paymentPath = isVendorBillable ? '/payments-made' : '/payments-received';
  const statusLabels = isVendorBillable ? PAYMENT_MADE_STATUS : PAYMENT_RECEIVED_STATUS;
  const sectionTitle = isVendorBillable ? 'Payment Made' : 'Payment Received';
  const sectionDescription = isVendorBillable ? 'Expense has been paid with the following payment made' : 'Expense has been received payments with the following payment received';
  const paymentNoLabel = isVendorBillable ? 'Payment Made #' : 'Payment Received #';
  const amountLabel = isVendorBillable ? 'Amount paid' : 'Amount received';

  return (
    <div className="my-container p-6 space-y-5">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{sectionTitle}</h3>
          <p className="text-sm text-gray-600 mt-1">{sectionDescription}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">{paymentNoLabel}</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Date</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Status</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">{amountLabel}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {(expense.payments || []).map(payment => (
                <tr key={payment.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => navigate(`${paymentPath}/${payment.id}`)}>
                  <td className="py-4 px-6">
                    <Tag className="font-semibold">{payment.paymentNo}</Tag>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-gray-700">{dateFormateForUi(payment.paymentDate)}</span>
                  </td>
                  <td className="py-4 px-6">
                    <StatusBadge status={payment.status} value={statusLabels[payment.status] || '-'} />
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-semibold text-green-600">{formatAmount(payment.amountApplied, true, expense.currency)}</span>
                  </td>
                </tr>
              ))}
              {!(expense.payments || []).length && (
                <tr>
                  <td colSpan={4} className="py-8 px-6 text-center text-gray-500">
                    No payments against this expense yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const ExpenseDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { expensesId } = useParams();
  const [activeKey, setActiveKey] = useState('1');
  const [viewCustomerDetail, setViewCustomerDetail] = useState(false);
  const deleteModal = useConfirmModal();
  const { profile, getProfile } = useProfile();
  const { loading, expense, deleteLoading, getExpenseById, removeExpenses } = useExpenses();
  const expenseData = expense;
  const { isViewOnly, useModuleExpenses } = useModulePermissions(RESOURCES.EXPENSES);
  const party = expenseData?.party;
  const isVendor = party?.Role?.isVendor;

  useEffect(() => {
    const controller = new AbortController();
    getProfile({ signal: controller.signal });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (expensesId) {
      getExpenseById({ expenseId: expensesId });
    }
  }, [expensesId]);

  const handleRefresh = async () => {
    await getExpenseById({ expenseId: expensesId });
  };

  const handleEditClick = () => {
    navigate(`/expenses/${expenseData?.id || expenseData?._id}/edit`, {
      state: {
        expenseData: expenseData,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleDuplicateClick = () => {
    navigate('/expenses/new', {
      state: {
        duplicateFromId: expenseData?.id || expenseData?._id,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleDeleteClick = () => {
    deleteModal.open(expenseData);
  };

  const deleteExpense = async () => {
    await removeExpenses({ expenseId: expenseData?.id || expenseData?._id });
    deleteModal.close();
    navigate('/expenses');
  };

  const items = [
    {
      key: '1',
      label: 'Basic Info',
      children: <ExpenseDetailView data={expenseData} profile={profile} />,
    },
    ...(expenseData?.isBillable
      ? [
          {
            key: 'payments',
            label: 'Payments',
            children: <ExpensePayments expense={expenseData} />,
          },
        ]
      : []),
    {
      key: 'journal-entries',
      label: 'Journal',
      children: <DocumentJournalPanel sourceModule={LEDGER_SOURCE_MODULES.EXPENSE} sourceId={expensesId} />,
    },
    {
      key: '2',
      label: 'History',
      children: (
        <CommentHistory moduleName={MODULE_NAMES.EXPENSE} referenceId={expensesId} commentHistory={expenseData?.commentHistory} canAddComment={useModuleExpenses?.edit} isViewOnly={isViewOnly} />
      ),
    },
    ...(expenseData?.receipts?.length > 0
      ? [
          {
            key: '3',
            label: 'Attachments',
            children: <AttachMentDetails data={{ ...expenseData, attachments: expenseData?.receipts }} />,
          },
        ]
      : []),
  ];

  const handlePrint = async () => {
    const blob = await renderPdfToBlob(<ExpensePDF data={expenseData} profile={profile} />);

    const blobUrl = URL.createObjectURL(blob);

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = blobUrl;

    document.body.appendChild(iframe);

    iframe.onload = () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    };
  };

  // const goBack = () => {
  //   navigate(-1);
  // };

  if (loading) {
    return (
      <div className="p-1">
        <DetailPageSkeleton />
      </div>
    );
  }

  if (!expenseData && !loading) {
    return <NoFoundPage docType={MODULE_NAMES?.EXPENSE} />;
  }

  const blockedTooltip = isViewOnly ? PERMISSION_MESSAGES.VIEW_ONLY : PERMISSION_MESSAGES.NO_PERMISSION;
  const canEdit = useModuleExpenses?.edit && !isViewOnly;
  const canDelete = useModuleExpenses?.delete && !isViewOnly;
  const editTooltip = canEdit ? 'Edit' : blockedTooltip;
  const deleteTooltip = canDelete ? 'Delete Expense' : blockedTooltip;
  const duplicateTooltip = useModuleExpenses?.create && !isViewOnly ? 'Duplicate Document' : blockedTooltip;

  return (
    <div className="p-1">
      <div className="bg-white border-b border-gray-100 px-4 py-4 -m-4">
        <div className="flex items-center justify-between">
          <PageHeader
            title={
              <div className="flex items-center gap-3">
                <BackButton />

                <div className="flex flex-col">
                  <h1 className="text-[18px] font-semibold text-heading leading-6">Expenses Details</h1>

                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-sm font-medium text-gray-600">{expenseData?.expenseId}</span>
                    {expenseData?.isBillable && (
                      <>
                        <span className="text-gray-400">•</span>
                        <StatusBadge status={expenseData?.billableStatus} value={EXPENSE_BILLABLE_STATUS[expenseData?.billableStatus] || '-'} />
                      </>
                    )}
                  </div>
                </div>
              </div>
            }
            rightStats={[
              {
                label: 'Total Amount',
                value: formatAmount(expenseData?.total || 0, true, expenseData?.currency),
              },
              ...(expenseData?.isBillable
                ? [
                    {
                      label: 'Due Amount',
                      value: formatAmount(expenseData?.balanceAmount || 0, true, expenseData?.currency),
                      colorClass: (expenseData?.balanceAmount || 0) > 0 ? 'text-red-600' : 'text-green-600',
                    },
                  ]
                : []),
            ]}
          />

          {/* Quick Actions */}
          <div className="flex items-center space-x-3">
            <DocumentRefreshButton onRefresh={handleRefresh} />
            {party?.Role && (
              <Button type="default" size="middle" icon={<Icons.ExportOutlined className="mr-2" />} onClick={() => setViewCustomerDetail(true)} className="flex items-center">
                {isVendor ? 'View Vendor' : 'View Customer'}
              </Button>
            )}
            <PDFDownloadLink document={<ExpensePDF data={expenseData} profile={profile} />} fileName={generateSafeFileName(expenseData, 'expenseId')}>
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
        {(useModuleExpenses?.create || useModuleExpenses?.edit || useModuleExpenses?.delete) && (
          <div className="xl:mt-[62px] h-fit w-full xl:w-[250px] space-y-3">
            <div className="space-y-3">
              <ActionButtons>
                <div className="flex flex-col gap-2 mt-2">
                  <PermissionButton
                    canAccess={!!useModuleExpenses?.create}
                    isViewOnly={isViewOnly}
                    tooltipTitle={duplicateTooltip}
                    tooltipProps={{ placement: 'left' }}
                    wrapperClassName="block w-full"
                    type="default"
                    icon={<Icons.CopyOutlined />}
                    className="px-4 py-2 w-full"
                    block
                    onClick={useModuleExpenses?.create && !isViewOnly ? handleDuplicateClick : undefined}
                  >
                    Duplicate Document
                  </PermissionButton>
                  <PermissionButton
                    canAccess={useModuleExpenses?.edit}
                    isViewOnly={isViewOnly}
                    tooltipTitle={editTooltip}
                    tooltipProps={{ placement: 'left' }}
                    wrapperClassName="block w-full"
                    type="primary"
                    className="px-4 py-2 w-full"
                    onClick={canEdit ? handleEditClick : undefined}
                    text="Edit"
                  />
                  <PermissionButton
                    canAccess={useModuleExpenses?.delete}
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
                    text="Delete"
                  />
                </div>
              </ActionButtons>

              <DocumentMetadata data={expenseData} />

              <OrganizationInfo data={expenseData} />
            </div>
          </div>
        )}
      </div>
      {viewCustomerDetail && (
        <CustomerDrawerDetails
          viewCustomerDetail={viewCustomerDetail}
          setViewCustomerDetail={setViewCustomerDetail}
          customerData={{ id: party?.id, customerDisplayName: party?.customerDisplayName }}
          isVendor={isVendor}
        />
      )}
      <DocumentConfirmModal modal={deleteModal} docType={MODULE_NAMES?.EXPENSE} onConfirm={deleteExpense} loading={deleteLoading} getDocumentDetails={getExpenseDocumentDetails} />
    </div>
  );
};

export default ExpenseDetail;
