import { Link } from 'react-router-dom';
import { Tag } from 'antd';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import { getDateColumn, getAmountCoulmn, TruncatedCell } from 'utils/tableColumns';
import PaymentModeBadge from '@/components/ui/badge/PaymentModeBadge';
import {
  QUOTE_STATUS,
  SALES_ORDER_STATUS,
  DELIVERY_CHALLAN_STATUS,
  INVOICE_STATUS,
  PAYMENT_RECEIVED_STATUS,
  CREDIT_NOTE_STATUS,
  PURCHASE_ORDER_STATUS,
  BILL_STATUS,
  PAYMENT_MADE_STATUS,
  DEBIT_NOTE_STATUS,
  CUSTOMER_VERIFICATION_STATUS,
} from 'utils/constants';
import { formatAmount } from '@/utils/currency';
import { getObPaymentHistoryDocumentLabel, getObRelatedDocumentStatusLabel, getObApplicationKindLabel, getObPaymentHistorySourceLabel } from 'utils/openingBalanceUtils';
import { dateFormateForUi } from 'utils/services';

export const customerTransactionColumn = {
  quoteColumn: [
    getDateColumn('Date', 'quoteDate', 'quoteDate', true),
    {
      title: 'Quote#',
      key: 'quoteId',
      render: record => (
        <Link to={`/quotes/${record?._id || record?.id}`}>
          <Tag className=" font-semibold">{record?.quoteId}</Tag>
        </Link>
      ),
      visible: true,
    },
    getDateColumn('Expiry Date', 'expiryDate', 'expiryDate', true),
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => <StatusBadge status={status} value={QUOTE_STATUS?.[status] || status} />,
      visible: true,
    },
    getAmountCoulmn('Amount', 'total', 'total', true),
  ],
  salesOrderColumn: [
    getDateColumn('Date', 'orderDate', 'orderDate', true),
    {
      title: 'Sales Order#',
      key: 'orderId',
      render: record => (
        <Link to={`/sales-orders/${record?._id || record?.id}`}>
          <Tag className=" font-semibold">{record?.orderId}</Tag>
        </Link>
      ),
      visible: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => <StatusBadge status={status} value={SALES_ORDER_STATUS?.[status] || status} />,
      visible: true,
    },
    getAmountCoulmn('Amount', 'total', 'total', true),
  ],
  deliveryChallanColumn: [
    getDateColumn('Date', 'challanDate', 'challanDate', true),
    {
      title: 'Delivery Challan#',
      key: 'challanId',
      render: record => (
        <Link to={`/delivery-challans/${record?._id || record?.id}`}>
          <Tag className=" font-semibold">{record?.challanId}</Tag>
        </Link>
      ),
      visible: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => <StatusBadge status={status} value={DELIVERY_CHALLAN_STATUS?.[status] || status} />,
      visible: true,
    },
    getAmountCoulmn('Amount', 'total', 'total', true),
  ],
  invoiceColumn: [
    getDateColumn('Date', 'invoiceDate', 'invoiceDate', true),
    {
      title: 'Invoice#',
      key: 'invoiceId',
      render: record => (
        <Link to={`/invoices/${record?._id || record?.id}`}>
          <Tag className=" font-semibold">{record?.invoiceId}</Tag>
        </Link>
      ),
      visible: true,
      fixed: 'left',
    },
    getDateColumn('Due Date', 'dueDate', 'dueDate', true),
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => <StatusBadge status={status} value={INVOICE_STATUS?.[status] || status} />,
      visible: true,
    },
    getAmountCoulmn('Amount', 'total', 'total', true),
    getAmountCoulmn('Paid Amount', 'paidAmount', 'paidAmount', true),
  ],
  paymentReceivedColumn: [
    getDateColumn('Date', 'paymentDate', 'paymentDate', true),
    {
      title: 'Payment Received#',
      key: 'paymentReceivedId',
      render: record => (
        <Link to={`/payments-received/${record?._id || record?.id}`}>
          <Tag className=" font-semibold">{record?.paymentReceivedId}</Tag>
        </Link>
      ),
      visible: true,
    },
    {
      title: 'Mode',
      dataIndex: 'paymentMode',
      key: 'paymentMode',
      render: paymentMode => <PaymentModeBadge paymentMode={paymentMode} />,
      visible: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => <StatusBadge status={status} value={PAYMENT_RECEIVED_STATUS?.[status] || status} />,
      visible: true,
    },
    getAmountCoulmn('Amount Received', 'amountReceived', 'amountReceived', true),
  ],
  creditNoteColumn: [
    getDateColumn('Date', 'creditNoteDate', 'creditNoteDate', true),
    {
      title: 'Credit Notes#',
      key: 'creditNoteId',
      render: record => (
        <Link to={`/credit-notes/${record?._id || record?.id}`}>
          <Tag className=" font-semibold">{record?.creditNoteId}</Tag>
        </Link>
      ),
      visible: true,
      fixed: 'left',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => <StatusBadge status={status} value={CREDIT_NOTE_STATUS?.[status] || status} />,
      visible: true,
    },
    getAmountCoulmn('Amount', 'total', 'total', true),
  ],
  purchaseOrderColumn: [
    getDateColumn('Date', 'date', 'date', true),
    {
      title: 'Purchase Order#',
      key: 'purchaseOrderId',
      render: record => (
        <Link to={`/purchase-orders/${record?._id || record?.id}`}>
          <Tag className=" font-semibold">{record?.purchaseOrderId}</Tag>
        </Link>
      ),
      visible: true,
      fixed: 'left',
    },
    getDateColumn('Delivery Date', 'deliveryDate', 'deliveryDate', true),
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => <StatusBadge status={status} value={PURCHASE_ORDER_STATUS?.[status] || status} />,
      visible: true,
    },
    getAmountCoulmn('Amount', 'total', 'total', true),
  ],
  grpoColumn: [
    getDateColumn('Date', 'date', 'date', true),
    {
      title: 'GRPO Order#',
      key: 'grpoOrderId',
      render: record => (
        <Link to={`/grpo/${record?._id || record?.id}`}>
          <Tag className=" font-semibold">{record?.grpoOrderId}</Tag>
        </Link>
      ),
      visible: true,
    },
    getDateColumn('Due Date', 'dueDate', 'dueDate', true),
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => <StatusBadge status={status} value={PURCHASE_ORDER_STATUS?.[status] || status} />,
      visible: true,
    },
    getAmountCoulmn('Amount', 'total', 'total', true),
  ],
  billColumn: [
    getDateColumn('Date', 'billDate', 'billDate', true),
    {
      title: 'Bill#',
      key: 'billId',
      render: record => (
        <Link to={`/bills/${record?._id || record?.id}`}>
          <Tag className=" font-semibold">{record?.billId}</Tag>
        </Link>
      ),
      visible: true,
    },
    getDateColumn('Due Date', 'dueDate', 'dueDate', true),
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => <StatusBadge status={status} value={BILL_STATUS?.[status] || status} />,
      visible: true,
    },
    getAmountCoulmn('Amount', 'total', 'total', true),
    getAmountCoulmn('Paid Amount', 'paidAmount', 'paidAmount', true),
  ],
  paymentMadeColumn: [
    getDateColumn('Date', 'paymentDate', 'paymentDate', true),
    {
      title: 'Payment Made#',
      key: 'paymentMadeId',
      render: record => (
        <Link to={`/payments-made/${record?._id || record?.id}`}>
          <Tag className=" font-semibold">{record?.paymentMadeId}</Tag>
        </Link>
      ),
      visible: true,
    },
    {
      title: 'Mode',
      dataIndex: 'paymentMode',
      key: 'paymentMode',
      render: paymentMode => <PaymentModeBadge paymentMode={paymentMode} />,
      visible: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => <StatusBadge status={status} value={PAYMENT_MADE_STATUS?.[status] || status} />,
      visible: true,
    },
    getAmountCoulmn('Amount', 'paymentMade', 'paymentMade', true),
  ],
  debitNoteColumn: [
    getDateColumn('Date', 'debitNoteDate', 'debitNoteDate', true),
    {
      title: 'Debit Note#',
      key: 'debitNoteId',
      render: record => (
        <Link to={`/debit-notes/${record?._id || record?.id}`}>
          <Tag className=" font-semibold">{record?.debitNoteId}</Tag>
        </Link>
      ),
      visible: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => <StatusBadge status={status} value={DEBIT_NOTE_STATUS?.[status] || status} />,
      visible: true,
    },
    getAmountCoulmn('Amount', 'total', 'total', true),
    getAmountCoulmn('Available Balance', 'availableBalance', 'availableBalance', true),
  ],
};

export const openingBalancePaymentHistoryColumns = [
  {
    title: 'Applied on',
    key: 'appliedOn',
    width: 160,
    render: (_, record) => {
      return dateFormateForUi(record.entry?.appliedDate);
    },
  },
  {
    title: 'Document #',
    key: 'document',
    render: (_, record) => {
      return <Tag className="font-semibold">{getObPaymentHistoryDocumentLabel(record.side, record.entry, record)}</Tag>;
    },
  },
  {
    title: 'Status',
    key: 'relatedDocumentStatus',
    width: 130,
    render: (_, record) => {
      const s = record.relatedDocumentStatus;
      return <StatusBadge status={s} value={getObRelatedDocumentStatusLabel(s)} />;
    },
  },
  {
    title: 'Branch',
    key: 'branch',
    render: (_, record) => <TruncatedCell value={record?.branch?.name} />,
  },
  {
    title: 'OB type',
    key: 'obType',
    render: (_, record) => {
      return getObApplicationKindLabel(record.obType);
    },
  },
  {
    title: 'Source',
    key: 'source',
    render: (_, record) => {
      return getObPaymentHistorySourceLabel(record.side, record.entry);
    },
  },
  {
    title: 'Amount',
    key: 'amount',
    render: (_, record) => {
      return formatAmount(record.entry?.amountApplied, true, record.currency);
    },
  },
  {
    title: 'Currency',
    key: 'currency',
    render: (_, record) => record.currency?.code || '-',
  },
];

export const customerExportColumn = (isVendorPage = false) => [
  {
    title: isVendorPage ? 'Vendor#' : 'Customer#',
    getExportValue: customer => customer?.customerNumber || '',
  },
  {
    title: 'First Name',
    getExportValue: customer => customer?.bpPrimaryContactName?.firstName || '',
  },
  {
    title: 'Last Name',
    getExportValue: customer => customer?.bpPrimaryContactName?.lastName || '',
  },
  {
    title: 'Business Partner Type',
    getExportValue: customer => customer?.businessPartnerType || '',
  },
  {
    title: 'Company Name',
    getExportValue: customer => customer?.companyName || '',
  },
  {
    title: isVendorPage ? 'Vendor Display Name' : 'Customer Display Name',
    getExportValue: customer => customer?.customerDisplayName || '',
  },
  {
    title: 'Email',
    getExportValue: customer => customer?.bpEmail || '',
  },
  {
    title: isVendorPage ? 'Vendor Phone Number' : 'Customer Phone Number',
    getExportValue: customer => customer?.customerPhoneNumber || '',
  },
  {
    title: 'GST Treatment',
    getExportValue: customer => customer?.otherDetails?.gstTreatment || '',
  },
  {
    title: 'GSTIN NO',
    getExportValue: customer => customer?.otherDetails?.gstinUin || '',
  },
  {
    title: 'Tax Preference',
    getExportValue: customer => customer?.otherDetails?.taxPreference || '',
  },
  {
    title: 'PAN',
    getExportValue: customer => customer?.otherDetails?.pan || '',
  },
  {
    title: 'Currency',
    getExportValue: customer => customer?.otherDetails?.currency?.code || '',
  },
  {
    title: 'Billing Attention',
    getExportValue: customer => customer?.address?.billing?.attention || '',
  },
  {
    title: 'Billing Country',
    getExportValue: customer => customer?.address?.billing?.country || '',
  },
  {
    title: 'Billing Street1',
    getExportValue: customer => customer?.address?.billing?.address?.street1 || customer?.address?.billing?.street1 || '',
  },
  {
    title: 'Billing Street2',
    getExportValue: customer => customer?.address?.billing?.address?.street2 || customer?.address?.billing?.street2 || '',
  },
  {
    title: 'Billing City',
    getExportValue: customer => customer?.address?.billing?.city || '',
  },
  {
    title: 'Billing State',
    getExportValue: customer => customer?.address?.billing?.state || '',
  },
  {
    title: 'Billing Pin Code',
    getExportValue: customer => customer?.address?.billing?.pinCode || '',
  },
  {
    title: 'Billing Phone',
    getExportValue: customer => customer?.address?.billing?.phone || '',
  },
  {
    title: 'Billing Fax Number',
    getExportValue: customer => customer?.address?.billing?.faxNumber || '',
  },
  {
    title: 'Shipping Attention',
    getExportValue: customer => customer?.address?.shipping?.attention || '',
  },
  {
    title: 'Shipping Country',
    getExportValue: customer => customer?.address?.shipping?.country || '',
  },
  {
    title: 'Shipping Street1',
    getExportValue: customer => customer?.address?.shipping?.address?.street1 || customer?.address?.shipping?.street1 || '',
  },
  {
    title: 'Shipping Street2',
    getExportValue: customer => customer?.address?.shipping?.address?.street2 || customer?.address?.shipping?.street2 || '',
  },
  {
    title: 'Shipping City',
    getExportValue: customer => customer?.address?.shipping?.city || '',
  },
  {
    title: 'Shipping State',
    getExportValue: customer => customer?.address?.shipping?.state || '',
  },
  {
    title: 'Shipping Pin Code',
    getExportValue: customer => customer?.address?.shipping?.pinCode || '',
  },
  {
    title: 'Shipping Phone',
    getExportValue: customer => customer?.address?.shipping?.phone || '',
  },
  {
    title: 'Shipping Fax Number',
    getExportValue: customer => customer?.address?.shipping?.faxNumber || '',
  },
];

export const vendorExportColumn = () => customerExportColumn(true);

// Portal columns are shown only on the customer page and only when the plan has the CUSTOMER_ORDER (customer portal) feature.
export const customerColumn = (isVendorPage, isCustomerOrderAppAvailable = false) => {
  return [
    {
      title: isVendorPage ? 'Vendor#' : 'Customer#',
      dataIndex: 'customerNumber',
      key: 'customerNumber',
      visible: true,
      render: value => <Tag className="font-semibold">{value}</Tag>,
      required: true,
      sorter: true,
      fixed: 'left',
      width: 137,
    },
    {
      title: 'Company Name',
      dataIndex: 'companyName',
      key: 'companyName',
      ellipsis: {
        showTitle: false,
      },
      render: text => <TruncatedCell value={text} />,
      visible: true,
      required: true,
      sorter: true,
    },
    {
      title: 'Name',
      dataIndex: 'bpPrimaryContactName',
      key: 'bpPrimaryContactName',
      ellipsis: {
        showTitle: false,
      },
      render: text => {
        const fullName = [text?.firstName, text?.lastName].filter(Boolean).join(' ');
        return <TruncatedCell value={fullName || '-'} />;
      },
      visible: true,
      required: true,
      sorter: true,
    },
    {
      title: isVendorPage ? 'Vendor Display Name' : 'Customer Display Name',
      dataIndex: 'customerDisplayName',
      key: 'customerDisplayName',
      ellipsis: {
        showTitle: false,
      },
      render: text => <TruncatedCell value={text} />,
      visible: true,
      required: true,
      sorter: true,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'status',
      visible: true,
      sorter: true,
      required: true,
      render: status => {
        return <StatusBadge status={status} value={status ? 'Active' : 'Inactive'} />;
      },
      width: 108,
    },
    ...(isVendorPage || !isCustomerOrderAppAvailable
      ? []
      : [
          {
            title: 'Portal Access',
            dataIndex: 'portalEnabled',
            key: 'portalEnabled',
            visible: true,
            render: value => <StatusBadge status={value} value={value ? 'Enabled' : 'Disabled'} />,
            width: 127,
          },
          {
            title: 'Portal Accepted',
            dataIndex: 'portalAccepted',
            key: 'portalAccepted',
            visible: true,
            render: value => <StatusBadge status={value} value={value ? 'Yes' : 'No'} />,
            width: 138,
          },
          {
            title: 'Verification Status',
            dataIndex: 'verificationStatus',
            key: 'verificationStatus',
            visible: true,
            // Derived field (joined from CustomerPortalUser after pagination) — backend can't sort by it.
            render: status => (status ? <StatusBadge status={status} value={CUSTOMER_VERIFICATION_STATUS?.[status] || status} /> : '-'),
            width: 155,
          },
        ]),
    {
      title: 'Email',
      dataIndex: 'bpEmail',
      key: 'bpEmail',
      visible: true,
      sorter: true,
    },
    {
      title: 'Opening Balance',
      dataIndex: 'branch',
      key: 'branch',
      render: (branch, record) => {
        let openingBalance = 0;
        branch?.forEach(item => {
          openingBalance = openingBalance + (item?.openingBalance ? item?.openingBalance : 0);
        });
        return formatAmount(openingBalance, true, record?.otherDetails?.currency);
      },
      visible: true,
      sorter: true,
    },
    {
      title: 'Current Balance',
      dataIndex: 'branch',
      key: 'current Balance',
      render: (branch, record) => {
        let currentBalance = 0;
        branch?.forEach(item => {
          currentBalance = currentBalance + (item?.currentBalance ? item?.currentBalance : 0);
        });
        return formatAmount(currentBalance, true, record?.otherDetails?.currency);
      },
      visible: true,
      sorter: true,
    },
    {
      title: 'Credit Limit',
      dataIndex: 'customerCreditLimit',
      key: 'customerCreditLimit',
      render: (customerCreditLimit, record) => formatAmount(customerCreditLimit || 0, true, record?.otherDetails?.currency),
      visible: true,
      sorter: true,
      width: 151,
    },
    {
      title: 'Work Phone',
      dataIndex: 'customerPhoneNumber',
      key: 'customerPhoneNumber',
      visible: true,
      sorter: true,
      width: 123,
    },
    {
      title: 'Added By',
      dataIndex: 'addedBy',
      key: 'addedBy',
      render: addedBy => `${addedBy?.firstName || ''} ${addedBy?.lastName || ''}`,
      visible: true,
      sorter: true,
    },
    {
      title: 'Updated By',
      dataIndex: 'updatedBy',
      key: 'updatedBy',
      render: updatedBy => `${updatedBy?.firstName || ''} ${updatedBy?.lastName || ''}`,
      visible: true,
      sorter: true,
    },
    ...(isVendorPage
      ? []
      : [
          {
            title: 'Created From',
            dataIndex: 'appName',
            key: 'appName',
            visible: true,
            render: appName => appName || '',
            sorter: false,
          },
        ]),
  ];
};
