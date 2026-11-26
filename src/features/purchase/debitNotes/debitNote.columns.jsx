import { Tag } from '@/components/AntDComponent';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import { getDateColumn, getAmountCoulmn, getQuantitySummaryColumn } from '@/utils/tableColumns';
import { DEBIT_NOTE_STATUS } from '@/utils/constants';
import { dateFormateForUi } from '@/utils/services';

export const debitNoteColumn = () => {
  return [
    {
      title: 'Debit Note#',
      dataIndex: 'debitNoteId',
      key: 'debitNoteId',
      render: debitNoteId => <Tag className="font-semibold">{debitNoteId}</Tag>,
      visible: true,
      required: true,
      sorter: true,
      fixed: 'left',
    },
    getDateColumn('Date', 'debitNoteDate', 'debitNoteDate', true, true),
    {
      title: 'Vendor Name',
      dataIndex: 'customerDisplayName',
      key: 'customerDisplayName',
      visible: true,
      required: true,
      sorter: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => <StatusBadge status={status} value={DEBIT_NOTE_STATUS?.[status] || ''} />,
      visible: true,
      required: true,
      sorter: true,
    },
    {
      title: 'Debit Note Type',
      dataIndex: 'debitNoteType',
      key: 'debitNoteType',
      visible: true,
      sorter: true,
    },
    {
      title: 'Item Count',
      dataIndex: 'itemCount',
      key: 'itemCount',
      visible: true,
      width: 120,
    },
    getQuantitySummaryColumn(),
    getAmountCoulmn('Total Amount', 'total', 'total', true, true),
    getAmountCoulmn('Available Balance', 'availableBalance', 'availableBalance', true),
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

export const debitNoteExportColumn = () => [
  {
    title: 'Debit Note#',
    getExportValue: debitNote => debitNote?.debitNoteId || '',
  },
  {
    title: 'Date',
    getExportValue: debitNote => (debitNote?.debitNoteDate ? dateFormateForUi(debitNote.debitNoteDate) : ''),
  },
  {
    title: 'Vendor Name',
    getExportValue: debitNote => debitNote?.customerDisplayName || '',
  },
  {
    title: 'Status',
    getExportValue: debitNote => DEBIT_NOTE_STATUS?.[debitNote?.status] || debitNote?.status || '',
  },
  {
    title: 'Debit Note Type',
    getExportValue: debitNote => debitNote?.debitNoteType || '',
  },
  {
    title: 'Total Amount',
    getExportValue: debitNote => debitNote?.total ?? '',
  },
  {
    title: 'Available Balance',
    getExportValue: debitNote => debitNote?.availableBalance ?? '',
  },
  {
    title: 'Reference',
    getExportValue: debitNote => debitNote?.reference || '',
  },
  {
    title: 'Division',
    getExportValue: debitNote => debitNote?.divisionName || '',
  },
  {
    title: 'Branch',
    getExportValue: debitNote => debitNote?.branchName || '',
  },
  {
    title: 'Warehouse',
    getExportValue: debitNote => debitNote?.warehouseName || '',
  },
  {
    title: 'Added By',
    getExportValue: debitNote => debitNote?.addedBy || '',
  },
  {
    title: 'Updated By',
    getExportValue: debitNote => debitNote?.updatedBy || '',
  },
];
