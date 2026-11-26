import { Tag } from '@/components/AntDComponent';
import { getDateColumn, getAmountCoulmn } from '@/utils/tableColumns';
import { PAYMENT_RECEIVED_STATUS, PAYMENT_MODE_OPTIONS, getPaymentReceivedTypeBadgeProps } from '@/utils/constants';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import PaymentModeBadge from '@/components/ui/badge/PaymentModeBadge';
import { dateFormateForUi } from '@/utils/services';

export const paymentReceivedColumn = () => {
  return [
    {
      title: 'Payment Received#',
      dataIndex: 'paymentReceivedId',
      key: 'paymentReceivedId',
      render: paymentReceivedId => <Tag className="font-semibold">{paymentReceivedId}</Tag>,
      visible: true,
      required: true,
      fixed: 'left',
      sorter: true,
      width: 182,
    },
    getDateColumn('Date', 'paymentDate', 'paymentDate', true, true),
    {
      title: 'Customer Name',
      dataIndex: 'customerDisplayName',
      key: 'customerDisplayName',
      visible: true,
      required: true,
      sorter: true,
    },
    {
      title: 'Mode',
      dataIndex: 'paymentMode',
      key: 'paymentMode',
      visible: true,
      required: true,
      sorter: true,
      render: paymentMode => <PaymentModeBadge paymentMode={paymentMode} />,
      width: 130,
    },
    {
      title: 'Type',
      dataIndex: 'paymentReceivedType',
      key: 'paymentReceivedType',
      render: (_, record) => <StatusBadge {...getPaymentReceivedTypeBadgeProps(record)} />,
      visible: true,
      required: true,
      sorter: true,
      width: 123,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => <StatusBadge status={status} value={PAYMENT_RECEIVED_STATUS?.[status] || ''} />,
      visible: true,
      required: true,
      sorter: true,
      width: 130,
    },
    {
      title: 'Deposit To',
      dataIndex: 'depositToAccountName',
      key: 'depositToAccountName',
      visible: true,
      sorter: true,
    },
    getAmountCoulmn('Payment Received', 'amountReceived', 'amountReceived', true, true),
    getAmountCoulmn('Available Balance', 'availableBalance', 'availableBalance', true),
    {
      title: 'Reference',
      dataIndex: 'reference',
      key: 'reference',
      visible: false,
      sorter: true,
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      visible: false,
      sorter: true,
    },
    {
      title: 'Approval Note',
      dataIndex: 'approvalNote',
      key: 'approvalNote',
      visible: false,
      sorter: true,
    },
    {
      title: 'Division',
      dataIndex: 'divisionName',
      key: 'divisionName',
      visible: true,
      sorter: true,
    },
    {
      title: 'Branch',
      dataIndex: 'branchName',
      key: 'branchName',
      visible: true,
      sorter: true,
    },
    {
      title: 'Warehouse',
      dataIndex: 'warehouseName',
      key: 'warehouseName',
      visible: true,
      sorter: true,
    },
    {
      title: 'Added By',
      dataIndex: 'addedBy',
      key: 'addedBy',
      visible: true,
      sorter: true,
    },
    {
      title: 'Updated By',
      dataIndex: 'updatedBy',
      key: 'updatedBy',
      visible: true,
      sorter: true,
    },
    {
      title: 'Created From',
      dataIndex: 'appName',
      key: 'appName',
      visible: true,
      render: appName => appName || '',
      sorter: false,
    },
  ];
};

const PAYMENT_RECEIVED_EXPORT_FIELDS = {
  paymentReceivedId: { title: 'Payment Received#', getExportValue: payment => payment?.paymentReceivedId || '' },
  paymentDate: { title: 'Date', getExportValue: payment => (payment?.paymentDate ? dateFormateForUi(payment.paymentDate) : '') },
  customerDisplayName: { title: 'Customer Name', getExportValue: payment => payment?.customerDisplayName || '' },
  paymentMode: {
    title: 'Mode',
    getExportValue: payment => PAYMENT_MODE_OPTIONS?.find(option => option.value === payment?.paymentMode)?.label || payment?.paymentMode || '',
  },
  paymentReceivedType: { title: 'Type', getExportValue: payment => payment?.paymentReceivedType || '' },
  status: { title: 'Status', getExportValue: payment => PAYMENT_RECEIVED_STATUS?.[payment?.status] || payment?.status || '' },
  depositToAccountName: { title: 'Deposit To', getExportValue: payment => payment?.depositToAccountName || '' },
  amountReceived: { title: 'Payment Received', getExportValue: payment => payment?.amountReceived ?? '' },
  availableBalance: { title: 'Available Balance', getExportValue: payment => payment?.availableBalance ?? '' },
  reference: { title: 'Reference', getExportValue: payment => payment?.reference || '' },
  notes: { title: 'Notes', getExportValue: payment => payment?.notes || '' },
  approvalNote: { title: 'Approval Note', getExportValue: payment => payment?.approvalNote || '' },
  divisionName: { title: 'Division', getExportValue: payment => payment?.divisionName || '' },
  branchName: { title: 'Branch', getExportValue: payment => payment?.branchName || '' },
  warehouseName: { title: 'Warehouse', getExportValue: payment => payment?.warehouseName || '' },
  addedBy: { title: 'Added By', getExportValue: payment => payment?.addedBy || '' },
  updatedBy: { title: 'Updated By', getExportValue: payment => payment?.updatedBy || '' },
  appName: { title: 'Created From', getExportValue: payment => payment?.appName || '' },
};

export const paymentReceivedExportColumn = (customizedColumns = []) => {
  const keys = (customizedColumns || []).map(col => col?.key).filter(key => key && PAYMENT_RECEIVED_EXPORT_FIELDS[key]);
  const orderedKeys = keys.length > 0 ? keys : Object.keys(PAYMENT_RECEIVED_EXPORT_FIELDS);
  return orderedKeys.map(key => PAYMENT_RECEIVED_EXPORT_FIELDS[key]);
};
