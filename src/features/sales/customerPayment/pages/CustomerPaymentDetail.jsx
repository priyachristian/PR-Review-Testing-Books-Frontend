// React
import { useEffect, useMemo, useState } from 'react';

// Third Party
import { Link, useParams } from 'react-router-dom';
import dayjs from 'dayjs';

// Components
import { Button, Tabs, Tag, Tooltip } from '@/components/AntDComponent';
import BackButton from '@/components/ui/button/BackButton';
import DocumentRefreshButton from '@/components/ui/button/DocumentRefreshButton';
import PaymentReceivedDetailSkeleton from '@/features/sales/paymentsReceived/components/PaymentReceivedDetailSkeleton';
import NoFoundPage from '@/components/ui/common/NoFoundPage';
import PageHeader from '@/components/ui/common/PageHeader';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import StatusUpdateLoader from '@/components/feedback/pageLoader/StatusUpdateLoader';
import AttachMentDetails from '@/components/feedback/formModal/AttachMentDetails';
import PermissionButton from '@/components/ui/button/PermissionButton';
import HistoryCommon from '@/components/dataDisplay/statCard/HistoryCommon';
import CustomerDrawerDetails from '@/features/sales/customer/components/CustomerDrawerDetails';
import { ActionButtons, DocumentMetadata } from '@/components/ui';

// Hooks
import { useCustomerPayments, useCustomerPaymentActions, CP_STATUS, CUSTOMER_PAYMENT_LABEL, PAYMENT_RECEIVED_LABEL, getRefId as getId } from '@/features/sales/customerPayment';
import useModulePermissions from 'hooks/useModulePermissions';

// Assets
import Icons from 'assets/icons/icon';

// Utils
import { RESOURCES } from '@/utils/jsonFile';
import { formatAmount } from '@/utils/currency';
import { ADMIN_ROUTE_PATHS } from '@/routes/adminRoutePaths';
import { MODULE_NAMES, CUSTOMER_PAYMENT_STATUS, PERMISSION_MESSAGES, getPaymentModeLabel } from 'utils/constants';

const formatDate = value => (value ? dayjs(value).format('DD/MM/YYYY') : '-');

// "Label: value" row used in the Payment Received "More Details" card.
const MoreDetailField = ({ label, children, className = '' }) => (
  <div className={className}>
    <span className="font-semibold text-gray-600">{label}: </span>
    <span className="text-gray-900 break-words">{children ?? '-'}</span>
  </div>
);

// Same field block as the Payment Received detail page.
const InfoField = ({ label, children }) => (
  <div>
    <div className="text-xs font-medium text-gray-500">{label}</div>
    <div className="mt-1 text-sm font-medium text-gray-900 break-words">{children ?? '-'}</div>
  </div>
);

const InfoCard = ({ title, children }) => (
  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
    </div>
    <div className="px-6 py-4">{children}</div>
  </div>
);

const CustomerPaymentDetail = () => {
  const { customerPaymentId } = useParams();

  const [activeKey, setActiveKey] = useState('1');
  const [viewCustomerDetail, setViewCustomerDetail] = useState(false);

  const { customerPayment, loading, getCustomerPaymentById, resetCustomerPayment } = useCustomerPayments();
  const { useModuleInvoice } = useModulePermissions(RESOURCES.CUSTOMER_PAYMENT);
  const { getBlockReasons, openRecord, openReject, actionModals, submitLoading } = useCustomerPaymentActions({
    onRejected: () => getCustomerPaymentById({ customerPaymentId }),
  });

  const data = customerPayment;
  const currency = data?.currency;
  const recordedRef = data?.convertedTo?.find(c => c?.type === 'PaymentReceived');
  // Populated by the detail API; may still be a bare id for older responses.
  const depositAccount = data?.depositToAccountId && typeof data.depositToAccountId === 'object' ? data.depositToAccountId : null;
  const bankDetails = depositAccount?.bankDetails;
  const customerName = data?.customerId?.customerDisplayName || data?.customerId?.companyName || '-';
  const canOpenInvoice = !!useModuleInvoice?.view;

  useEffect(() => {
    const controller = new AbortController();
    if (customerPaymentId) {
      getCustomerPaymentById({ customerPaymentId, signal: controller.signal });
    }
    return () => {
      controller.abort();
      resetCustomerPayment();
    };
  }, [customerPaymentId, getCustomerPaymentById, resetCustomerPayment]);

  const handleRefresh = async () => {
    await getCustomerPaymentById({ customerPaymentId });
  };

  const tabItems = useMemo(() => {
    if (!data) return [];
    const invoices = data.invoices || [];

    return [
      {
        key: '1',
        label: 'Basic Info',
        children: (
          <div className="space-y-6 my-container p-6">
            <InfoCard title="Payment Details">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                <InfoField label="Party Name">{customerName}</InfoField>
                <InfoField label="Payment Date">{formatDate(data.paymentDate)}</InfoField>
                <InfoField label="Amount">{formatAmount(data.amount || 0, true, currency)}</InfoField>
                <InfoField label="Payment Mode">{getPaymentModeLabel(data.paymentMode)}</InfoField>
              </div>

              {data.status === CP_STATUS.REJECTED && data.rejectionReason && (
                <div className="mt-5">
                  <div className="text-xs font-medium text-gray-500">Rejection Reason</div>
                  <div className="mt-1 text-sm text-gray-900 whitespace-pre-wrap break-words">{data.rejectionReason}</div>
                </div>
              )}
            </InfoCard>

            <InfoCard title="More Details">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <MoreDetailField label={CUSTOMER_PAYMENT_LABEL}>{data.customerPaymentId || '-'}</MoreDetailField>
                <MoreDetailField label="Paid Into">{depositAccount?.accountName || bankDetails?.bankName || '-'}</MoreDetailField>
                {bankDetails?.accountNumber && (
                  <>
                    <MoreDetailField label="Bank">{bankDetails.bankName || '-'}</MoreDetailField>
                    <MoreDetailField label="Account Number">{bankDetails.accountNumber}</MoreDetailField>
                    <MoreDetailField label="IFSC">{bankDetails.ifsc || '-'}</MoreDetailField>
                    <MoreDetailField label="Branch">{bankDetails.branch || '-'}</MoreDetailField>
                  </>
                )}
                {data.reference && (
                  <MoreDetailField label="Reference" className="md:col-span-2">
                    {data.reference}
                  </MoreDetailField>
                )}
                {recordedRef && (
                  <MoreDetailField label={`Recorded As ${PAYMENT_RECEIVED_LABEL}`} className="md:col-span-2">
                    {recordedRef.documentId ? (
                      <Link to={`/payments-received/${getId(recordedRef.documentId)}`}>
                        <Tag className="font-semibold">{recordedRef.documentNo || '-'}</Tag>
                      </Link>
                    ) : (
                      <Tag className="font-semibold">{recordedRef.documentNo || '-'}</Tag>
                    )}
                    <span className="text-xs text-gray-500">on {formatDate(recordedRef.convertedAt)}</span>
                  </MoreDetailField>
                )}
              </div>
            </InfoCard>

            <div>
              <h2 className="text-md font-semibold text-gray-800 mb-4">Invoice Details</h2>
              <div className="overflow-auto">
                <table className="w-full border border-gray-200 rounded-md overflow-hidden">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="text-left p-3 border-b">Invoice ID</th>
                      <th className="text-left p-3 border-b">Invoice Date</th>
                      <th className="text-left p-3 border-b">Due Date</th>
                      <th className="text-left p-3 border-b">Invoice Amount</th>
                      <th className="text-left p-3 border-b">Amount Due</th>
                      <th className="text-left p-3 border-b">Payment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv, idx) => {
                      const invoice = inv?.invoiceId && typeof inv.invoiceId === 'object' ? inv.invoiceId : null;
                      const invoiceId = getId(inv?.invoiceId);
                      const tag = <Tag className="font-semibold">{inv?.invoiceNo || invoice?.invoiceId || '-'}</Tag>;
                      return (
                        <tr key={invoiceId || idx} className="hover:bg-gray-50">
                          <td className="p-3 border-b">
                            {invoiceId && canOpenInvoice ? (
                              <Link to={`/${ADMIN_ROUTE_PATHS.invoices.build.detail(invoiceId)}`}>{tag}</Link>
                            ) : (
                              <Tooltip title={invoiceId ? PERMISSION_MESSAGES.NO_PERMISSION : ''}>{tag}</Tooltip>
                            )}
                          </td>
                          <td className="p-3 border-b">{formatDate(invoice?.invoiceDate)}</td>
                          <td className="p-3 border-b">{formatDate(invoice?.dueDate)}</td>
                          <td className="p-3 border-b">{invoice?.total != null ? formatAmount(invoice.total, true, currency) : '-'}</td>
                          <td className="p-3 border-b">{invoice?.balanceAmount != null ? formatAmount(invoice.balanceAmount, true, currency) : '-'}</td>
                          <td className="p-3 border-b">{formatAmount(inv?.amountApplied, true, currency)}</td>
                        </tr>
                      );
                    })}
                    {invoices.length === 0 && (
                      <tr>
                        <td className="p-3 text-center" colSpan={6}>
                          No invoice applications
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ),
      },
      ...(data.attachments?.length > 0
        ? [
            {
              key: '2',
              label: 'Attachments',
              children: <AttachMentDetails data={data} />,
            },
          ]
        : []),
      {
        key: '3',
        label: 'History',
        children: <HistoryCommon data={data.commentHistory} />,
      },
    ];
  }, [data, currency, customerName, recordedRef, bankDetails, depositAccount, canOpenInvoice]);

  useEffect(() => {
    if (tabItems.length && !tabItems.some(tab => tab.key === activeKey)) {
      setActiveKey('1');
    }
  }, [tabItems, activeKey]);

  if (loading) return <PaymentReceivedDetailSkeleton actionRows={2} showExtraSidebarCards={false} />;
  if (!data) return <NoFoundPage docType={MODULE_NAMES?.CUSTOMER_PAYMENT} />;

  const { recordBlockReason, rejectBlockReason } = getBlockReasons(data);
  const canRecord = !recordBlockReason;
  const canReject = !rejectBlockReason;
  const customerData = {
    id: getId(data?.customerId),
    customerDisplayName: data?.customerId?.customerDisplayName,
  };

  return (
    <>
      <StatusUpdateLoader loading={submitLoading} text="Updating customer payment..." />
      <div className="bg-white border-b border-gray-100 px-4 py-4 -m-4">
        <div className="flex items-center justify-between">
          <PageHeader
            title={
              <div className="flex items-center gap-3">
                <BackButton />
                <div className="flex flex-col">
                  <h1 className="text-[18px] font-semibold text-heading leading-6">Customer Payment Details</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-medium text-gray-600">{data?.customerPaymentId}</span>
                    <span className="text-gray-400">•</span>
                    <StatusBadge status={data?.status} value={CUSTOMER_PAYMENT_STATUS?.[data?.status] || data?.status} />
                  </div>
                </div>
              </div>
            }
            rightStats={[
              {
                label: 'Total Amount',
                value: formatAmount(data?.amount || 0, true, currency),
              },
            ]}
          />

          <div className="flex items-center space-x-3">
            <DocumentRefreshButton onRefresh={handleRefresh} />
            {data?.customerId && (
              <Button type="default" size="middle" icon={<Icons.ExportOutlined className="mr-2" />} onClick={() => setViewCustomerDetail(true)} className="flex items-center">
                View Customer
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row xl:justify-between pt-3">
        <div className="w-full xl:w-3/4">
          <Tabs activeKey={activeKey} onChange={setActiveKey} items={tabItems} />
        </div>
        <div className="xl:mt-[62px] h-fit w-full xl:w-[250px] space-y-3">
          <ActionButtons>
            <PermissionButton
              disabled={!canRecord || submitLoading}
              tooltipTitle={recordBlockReason || `Record as ${PAYMENT_RECEIVED_LABEL}`}
              tooltipProps={{ placement: 'left' }}
              wrapperClassName="block w-full"
              type="primary"
              icon={<Icons.CheckCircleOutlined />}
              className="px-4 py-2 w-full"
              block
              onClick={canRecord && !submitLoading ? () => openRecord(data) : undefined}
            >
              Record Payment
            </PermissionButton>
            <PermissionButton
              disabled={!canReject || submitLoading}
              tooltipTitle={rejectBlockReason || 'Reject this payment'}
              tooltipProps={{ placement: 'left' }}
              wrapperClassName="block w-full"
              type="default"
              danger
              icon={<Icons.CloseCircleOutlined />}
              className="px-4 py-2 w-full"
              block
              onClick={canReject && !submitLoading ? () => openReject(data) : undefined}
            >
              Reject
            </PermissionButton>
          </ActionButtons>

          <DocumentMetadata data={data} />
        </div>
      </div>

      {actionModals}

      {viewCustomerDetail && <CustomerDrawerDetails viewCustomerDetail={viewCustomerDetail} setViewCustomerDetail={setViewCustomerDetail} customerData={customerData} />}
    </>
  );
};

export default CustomerPaymentDetail;
