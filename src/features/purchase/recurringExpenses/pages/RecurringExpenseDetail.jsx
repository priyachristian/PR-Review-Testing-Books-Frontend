import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import { PDFDownloadLink } from '@/components/ui/common/PdfDownloadLinkLazy';
import { renderPdfToBlob } from '@/utils/loadReactPdf';

// Components
import { Button, Dropdown, Tabs, Tag, Tooltip } from '@/components/AntDComponent';
import PermissionButton from '@/components/ui/button/PermissionButton';
import DocumentRefreshButton from '@/components/ui/button/DocumentRefreshButton';
import BackButton from '@/components/ui/button/BackButton';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';
import StatusUpdateLoader from '@/components/feedback/pageLoader/StatusUpdateLoader';
import { DocumentConfirmModal } from '@/components/feedback/confirmModal/CancelOrDeleteDocumentModal';
import NoFoundPage from '@/components/ui/common/NoFoundPage';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import { ActionButtons, DetailField, DocumentMetadata, OrganizationInfo } from '@/components/ui';
import AttachMentDetails from '@/components/feedback/formModal/AttachMentDetails';
import ExpenseDetailView from '@/features/purchase/expenses/components/ExpenseDetailView';
import { ExpensePDF } from '@/components/ui/common/ExpensePdfLazy';
import CustomerDrawerDetails from '@/features/sales/customer/components/CustomerDrawerDetails';
import RecurringExpenseDetailSkeleton from '../components/RecurringExpenseDetailSkeleton';
import RecurringExpenseExecutionHistory from '../components/RecurringExpenseExecutionHistory';
import { CommentHistory } from '@/features/common/comment';

// Hooks
import { useConfirmModal } from '@/hooks/useConfirmModal';
import useModulePermissions from 'hooks/useModulePermissions';
import { useProfile } from '@/features/setting/profile/useProfile';

// Extras
import { getRecurringExpenseDocumentDetails, useRecurringExpenses } from '@/features/purchase/recurringExpenses';
import { formatAmount } from '@/utils/currency';
import Icons from '@/assets/icons/icon';
import { RESOURCES } from '@/utils/jsonFile';
import { BACKEND_ENUM, MODULE_NAMES, PERMISSION_MESSAGES, RECURRING_EXPENSE_STATUS, RECURRING_EXPENSE_STATUS_CHANGE_RESTRICTED_STATUS } from 'utils/constants';
import { generateSafeFileName } from '@/utils/pdfname';

const getNextExpensePreviewData = recurringExpense => ({
  ...recurringExpense,
  expenseId: recurringExpense?.recurringExpenseId,
  date: recurringExpense?.nextExecutionDate || recurringExpense?.recurringExpenseDate,
  party: recurringExpense?.customer,
  total: recurringExpense?.amount,
});

const RecurringExpenseDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { recurringExpenseId } = useParams();
  const [activeKey, setActiveKey] = useState('1');
  const [viewCustomerDetail, setViewCustomerDetail] = useState(false);
  const cancelStatusModal = useConfirmModal();
  const deleteModal = useConfirmModal();
  const { loading, recurringExpense, submitLoading, deleteLoading, getRecurringExpenseById, resetRecurringExpense, updateStatus, removeRecurringExpense } = useRecurringExpenses();
  const { useModuleRecurringExpenses, isViewOnly } = useModulePermissions(RESOURCES.RECURRING_EXPENSES);
  const { profile, getProfile } = useProfile();

  const nextExpensePreviewData = useMemo(() => getNextExpensePreviewData(recurringExpense), [recurringExpense]);

  useEffect(() => {
    const controller = new AbortController();
    getProfile({ signal: controller.signal });
    return () => controller.abort();
  }, [getProfile]);

  useEffect(() => {
    const controller = new AbortController();
    if (recurringExpenseId) {
      getRecurringExpenseById({ recurringExpenseId, signal: controller.signal });
    } else {
      resetRecurringExpense();
    }
    return () => {
      controller.abort();
      resetRecurringExpense();
    };
  }, [recurringExpenseId, getRecurringExpenseById, resetRecurringExpense]);

  const handleRefresh = async () => {
    await getRecurringExpenseById({ recurringExpenseId });
  };

  const handleEditClick = () => {
    navigate(`/recurring-expenses/${recurringExpense._id}/edit`, {
      state: {
        recurringExpenseData: recurringExpense,
        prevFrom: location.pathname,
        historyStack: [...(location.state?.historyStack || []), location.pathname],
      },
    });
  };

  const handleUpdateStatus = async status => {
    const expenseId = recurringExpense?.id || recurringExpense?._id;
    await updateStatus({ expenseId, status });
    await getRecurringExpenseById({ recurringExpenseId });
  };

  const updateRecurringExpenseStatus = async newStatus => {
    if (newStatus === BACKEND_ENUM.CANCELLED) {
      cancelStatusModal.open(recurringExpense);
      return;
    }
    await handleUpdateStatus(newStatus);
  };

  const confirmCancelStatus = async () => {
    await handleUpdateStatus(BACKEND_ENUM.CANCELLED);
    cancelStatusModal.close();
  };

  const handleDeleteClick = () => {
    deleteModal.open(recurringExpense);
  };

  const deleteRecurringExpense = async () => {
    const expenseId = recurringExpense?.id || recurringExpense?._id;
    await removeRecurringExpense({ expenseId });
    deleteModal.close();
    navigate('/recurring-expenses');
  };

  const getStatusActionItems = status => {
    let statusArr = [];

    if (status === BACKEND_ENUM?.DRAFT) {
      statusArr = [
        {
          key: `markAs${RECURRING_EXPENSE_STATUS.ACTIVE}`,
          label: `Mark As ${RECURRING_EXPENSE_STATUS.ACTIVE}`,
          onClick: () => updateRecurringExpenseStatus(BACKEND_ENUM.ACTIVE),
        },
        {
          key: `markAs${RECURRING_EXPENSE_STATUS.CANCELLED}`,
          label: `Mark As ${RECURRING_EXPENSE_STATUS.CANCELLED}`,
          onClick: () => updateRecurringExpenseStatus(BACKEND_ENUM.CANCELLED),
        },
      ];
    } else if (status === BACKEND_ENUM?.ACTIVE) {
      statusArr = [
        {
          key: `markAs${RECURRING_EXPENSE_STATUS.PAUSED}`,
          label: `Mark As ${RECURRING_EXPENSE_STATUS.PAUSED}`,
          onClick: () => updateRecurringExpenseStatus(BACKEND_ENUM.PAUSED),
        },
        {
          key: `markAs${RECURRING_EXPENSE_STATUS.CANCELLED}`,
          label: `Mark As ${RECURRING_EXPENSE_STATUS.CANCELLED}`,
          onClick: () => updateRecurringExpenseStatus(BACKEND_ENUM.CANCELLED),
        },
      ];
    } else if (status === BACKEND_ENUM?.PAUSED) {
      statusArr = [
        {
          key: `markAs${RECURRING_EXPENSE_STATUS.ACTIVE}`,
          label: `Mark As ${RECURRING_EXPENSE_STATUS.ACTIVE}`,
          onClick: () => updateRecurringExpenseStatus(BACKEND_ENUM.ACTIVE),
        },
        {
          key: `markAs${RECURRING_EXPENSE_STATUS.CANCELLED}`,
          label: `Mark As ${RECURRING_EXPENSE_STATUS.CANCELLED}`,
          onClick: () => updateRecurringExpenseStatus(BACKEND_ENUM.CANCELLED),
        },
      ];
    } else if (!RECURRING_EXPENSE_STATUS_CHANGE_RESTRICTED_STATUS?.includes(status)) {
      statusArr = [
        {
          key: `markAs${RECURRING_EXPENSE_STATUS.CANCELLED}`,
          label: `Mark As ${RECURRING_EXPENSE_STATUS.CANCELLED}`,
          onClick: () => updateRecurringExpenseStatus(BACKEND_ENUM.CANCELLED),
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
            <DetailField label="Recurring Expense Id">{recurringExpense?.recurringExpenseId ? <Tag className="font-semibold">{recurringExpense.recurringExpenseId}</Tag> : '-'}</DetailField>
            <DetailField label="Customer Name" value={recurringExpense?.customer?.customerDisplayName} truncate={false} valueClassName="break-words" />
            <DetailField label="Expense Account" value={recurringExpense?.expenseAccountName} truncate={false} valueClassName="break-words" />
            <DetailField label="Recurring Expense Date" value={recurringExpense?.recurringExpenseDate ? dayjs(recurringExpense.recurringExpenseDate).format('DD MMM YYYY') : undefined} />
            <DetailField label="Start Date" value={recurringExpense?.startDate ? dayjs(recurringExpense.startDate).format('DD MMM YYYY') : undefined} />
            <DetailField label="End Date" value={recurringExpense?.neverExpires ? 'Never Expires' : recurringExpense?.endDate ? dayjs(recurringExpense.endDate).format('DD MMM YYYY') : undefined} />
            <DetailField
              label="Repeat Every"
              value={recurringExpense?.repeatEvery?.frequency && recurringExpense?.repeatEvery?.period ? `${recurringExpense.repeatEvery.frequency} ${recurringExpense.repeatEvery.period}` : undefined}
            />
            <DetailField label="Next Execution Date" value={recurringExpense?.nextExecutionDate ? dayjs(recurringExpense.nextExecutionDate).format('DD MMM YYYY') : undefined} />
          </div>
        </div>
      </div>

      <div className="my-container container-spacing">
        <p className="font-bold text-lg">Expense Details</p>
        <div className="mt-2 space-y-3">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
            <DetailField label="Expense Account" value={recurringExpense?.expenseAccountName} truncate={false} valueClassName="break-words" />
            <DetailField label="Paid Through" value={recurringExpense?.paidThroughAccountName || recurringExpense?.paidThroughAccountId?.accountName} />
            <DetailField label="Amount" value={formatAmount(recurringExpense?.amount || 0)} />
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <div className="w-full md:w-1/3 space-y-3">
            <div className="flex justify-between border-t pt-3">
              <span className="text-gray-800 font-bold">Total Amount</span>
              <span className="font-bold">{formatAmount(recurringExpense?.amount || 0)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="my-container container-spacing">
        <p className="font-bold text-lg mb-3">Terms & Notes</p>
        <div className="grid md:grid-cols-2 gap-6">
          <DetailField label="Notes">
            <div className="p-3 bg-gray-50 rounded-md whitespace-pre-wrap">{recurringExpense?.notes || '-'}</div>
          </DetailField>
          <DetailField label="Terms & Conditions">
            <div className="p-3 bg-gray-50 rounded-md whitespace-pre-wrap">{recurringExpense?.termsAndConditions || '-'}</div>
          </DetailField>
        </div>
      </div>
    </div>
  );

  const handlePrint = async () => {
    const blob = await renderPdfToBlob(<ExpensePDF data={nextExpensePreviewData} profile={profile} />);

    const blobUrl = URL.createObjectURL(blob);

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
    return <RecurringExpenseDetailSkeleton />;
  }

  if (!recurringExpense && !loading) {
    return <NoFoundPage docType={MODULE_NAMES?.RECURRING_EXPENSE} />;
  }

  const customerData = {
    id: recurringExpense?.customer?._id || recurringExpense?.customer?.id,
    customerDisplayName: recurringExpense?.customer?.customerDisplayName,
  };

  const isDraftStatus = recurringExpense?.status === BACKEND_ENUM.DRAFT;
  const dropDownItems = [...getStatusActionItems(recurringExpense?.status)];
  const statusLabel = RECURRING_EXPENSE_STATUS?.[recurringExpense?.status] || recurringExpense?.status || '-';
  const canOpenMore = useModuleRecurringExpenses?.edit && !isViewOnly;
  const canEdit = canOpenMore && isDraftStatus;
  const canDelete = useModuleRecurringExpenses?.delete && !isViewOnly && isDraftStatus;
  const canMarkStatus = canOpenMore && !RECURRING_EXPENSE_STATUS_CHANGE_RESTRICTED_STATUS?.includes(recurringExpense?.status) && dropDownItems.length > 0;
  const markAsTooltip = canMarkStatus
    ? 'Mark Recurring Expense As'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useModuleRecurringExpenses?.edit
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : `This document status cannot be changed in its current status - ${statusLabel}.`;
  const editTooltip = canEdit
    ? 'Edit Recurring Expense'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useModuleRecurringExpenses?.edit
        ? PERMISSION_MESSAGES.NO_PERMISSION
        : `This document cannot be edited in its current status - ${statusLabel}.`;
  const deleteTooltip = canDelete
    ? 'Delete Recurring Expense'
    : isViewOnly
      ? PERMISSION_MESSAGES.VIEW_ONLY
      : !useModuleRecurringExpenses?.delete
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
      label: 'Next Expense',
      children: <ExpenseDetailView data={nextExpensePreviewData} profile={profile} />,
    },
    ...(recurringExpense?.attachments?.length > 0
      ? [
          {
            key: '3',
            label: 'Attachments',
            children: <AttachMentDetails data={recurringExpense} />,
          },
        ]
      : []),
    {
      key: '4',
      label: 'History',
      children: (
        <CommentHistory
          moduleName={MODULE_NAMES.RECURRING_EXPENSE}
          referenceId={recurringExpenseId}
          commentHistory={recurringExpense?.commentHistory}
          canAddComment={useModuleRecurringExpenses?.edit}
          isViewOnly={isViewOnly}
        />
      ),
    },
    {
      key: '5',
      label: 'Recurring Activities',
      children: <RecurringExpenseExecutionHistory history={recurringExpense?.history || []} />,
    },
  ];

  return (
    <>
      <StatusUpdateLoader loading={submitLoading} hidden={deleteModal.isOpen || cancelStatusModal.isOpen} text="Updating recurring expense status..." />
      <div className="bg-white border-b border-gray-100 px-4 py-2 -m-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <BackButton />
            <div className="flex flex-col">
              <h1 className="text-[18px] font-semibold text-gray-900">Recurring Expense Details</h1>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm font-medium text-gray-600">{recurringExpense?.recurringExpenseId}</span>
                <span className="text-gray-400">•</span>
                <StatusBadge status={recurringExpense?.status} value={RECURRING_EXPENSE_STATUS?.[recurringExpense?.status] || recurringExpense?.status || '-'} />
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <DocumentRefreshButton onRefresh={handleRefresh} />
            {(recurringExpense?.customer?._id || recurringExpense?.customer?.id) && (
              <Button type="default" size="middle" icon={<Icons.ExportOutlined className="mr-2" />} onClick={() => setViewCustomerDetail(true)} className="flex items-center">
                View Customer
              </Button>
            )}
            <PDFDownloadLink document={<ExpensePDF data={nextExpensePreviewData} profile={profile} />} fileName={generateSafeFileName(recurringExpense, 'recurringExpenseId')}>
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
                  {submitLoading ? <CustomLoader variant="button" text="Updating..." /> : 'Mark Recurring Expense As'}
                </Button>
              </Dropdown>
            ) : (
              <Tooltip title={markAsTooltip} placement="left">
                <span className="block w-full">
                  <Button type="primary" className="px-4 py-2 w-full" disabled block>
                    Mark Recurring Expense As
                  </Button>
                </span>
              </Tooltip>
            )}
            <PermissionButton
              canAccess={useModuleRecurringExpenses?.edit}
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
              canAccess={useModuleRecurringExpenses?.delete}
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

          <DocumentMetadata data={recurringExpense} />
          <OrganizationInfo data={recurringExpense} />
        </div>
      </div>
      <DocumentConfirmModal
        modal={deleteModal}
        docType={MODULE_NAMES?.RECURRING_EXPENSE}
        onConfirm={deleteRecurringExpense}
        loading={deleteLoading}
        getDocumentDetails={getRecurringExpenseDocumentDetails}
      />
      <DocumentConfirmModal
        modal={cancelStatusModal}
        docType={MODULE_NAMES?.RECURRING_EXPENSE}
        loading={submitLoading}
        mode="status"
        onConfirm={confirmCancelStatus}
        getDocumentDetails={getRecurringExpenseDocumentDetails}
      />
      {viewCustomerDetail && <CustomerDrawerDetails viewCustomerDetail={viewCustomerDetail} setViewCustomerDetail={setViewCustomerDetail} customerData={customerData} />}
    </>
  );
};

export default RecurringExpenseDetail;
