import { Tag } from '@/components/AntDComponent';
import { getDateColumn, getAmountCoulmn } from '@/utils/tableColumns';
import { PAYMENT_MADE_STATUS, PAYMENT_MODE_OPTIONS, getPaymentMadeTypeBadgeProps } from '@/utils/constants';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import PaymentModeBadge from '@/components/ui/badge/PaymentModeBadge';
import { dateFormateForUi } from '@/utils/services';

export const paymentMadeColumn = () => {
  return [
    {
      title: 'Payment Made#',
      dataIndex: 'paymentMadeId',
      key: 'paymentMadeId',
      render: paymentMadeId => <Tag className=" font-semibold">{paymentMadeId}</Tag>,
      visible: true,
      required: true,
      fixed: 'left',
      sorter: true,
    },
    getDateColumn('Date', 'paymentDate', 'paymentDate', true, true, 120),
    {
      title: 'Vendor Name',
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
      render: paymentMode => <PaymentModeBadge paymentMode={paymentMode} />,
      visible: true,
      required: true,
      sorter: true,
    },
    {
      title: 'Type',
      dataIndex: 'paymentMadeType',
      key: 'paymentMadeType',
      visible: true,
      required: true,
      sorter: true,
      render: (_, record) => <StatusBadge {...getPaymentMadeTypeBadgeProps(record)} />,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => <StatusBadge status={status} value={PAYMENT_MADE_STATUS?.[status] || ''} />,
      visible: true,
      required: true,
      sorter: true,
    },
    {
      title: 'Paid Through',
      dataIndex: 'paidThroughAccountName',
      key: 'paidThroughAccountName',
      visible: true,
      sorter: true,
    },
    getAmountCoulmn('Payment Made', 'paymentMade', 'paymentMade', true),
    getAmountCoulmn('Available Balance', 'availableBalance', 'availableBalance', true),
    {
      title: 'Reference',
      dataIndex: 'reference',
      key: 'reference',
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
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
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
  ];
};

const PAYMENT_MADE_EXPORT_FIELDS = {
  paymentMadeId: { title: 'Payment Made#', getExportValue: payment => payment?.paymentMadeId || '' },
  paymentDate: { title: 'Date', getExportValue: payment => (payment?.paymentDate ? dateFormateForUi(payment.paymentDate) : '') },
  customerDisplayName: { title: 'Vendor Name', getExportValue: payment => payment?.customerDisplayName || '' },
  paymentMode: {
    title: 'Mode',
    getExportValue: payment => PAYMENT_MODE_OPTIONS?.find(option => option.value === payment?.paymentMode)?.label || payment?.paymentMode || '',
  },
  paymentMadeType: { title: 'Type', getExportValue: payment => payment?.paymentMadeType || '' },
  status: { title: 'Status', getExportValue: payment => PAYMENT_MADE_STATUS?.[payment?.status] || payment?.status || '' },
  paidThroughAccountName: { title: 'Paid Through', getExportValue: payment => payment?.paidThroughAccountName || '' },
  paymentMade: { title: 'Payment Made', getExportValue: payment => payment?.paymentMade ?? '' },
  availableBalance: { title: 'Available Balance', getExportValue: payment => payment?.availableBalance ?? '' },
  reference: { title: 'Reference', getExportValue: payment => payment?.reference || '' },
  approvalNote: { title: 'Approval Note', getExportValue: payment => payment?.approvalNote || '' },
  notes: { title: 'Notes', getExportValue: payment => payment?.notes || '' },
  divisionName: { title: 'Division', getExportValue: payment => payment?.divisionName || '' },
  branchName: { title: 'Branch', getExportValue: payment => payment?.branchName || '' },
  warehouseName: { title: 'Warehouse', getExportValue: payment => payment?.warehouseName || '' },
  addedBy: { title: 'Added By', getExportValue: payment => payment?.addedBy || '' },
  updatedBy: { title: 'Updated By', getExportValue: payment => payment?.updatedBy || '' },
};

export const paymentMadeExportColumn = (customizedColumns = []) => {
  const keys = (customizedColumns || []).map(col => col?.key).filter(key => key && PAYMENT_MADE_EXPORT_FIELDS[key]);
  const orderedKeys = keys.length > 0 ? keys : Object.keys(PAYMENT_MADE_EXPORT_FIELDS);
  return orderedKeys.map(key => PAYMENT_MADE_EXPORT_FIELDS[key]);
};
