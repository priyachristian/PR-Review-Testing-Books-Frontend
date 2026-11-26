import { Tag } from '@/components/AntDComponent';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import { getDateColumn, getAmountCoulmn, getQuantitySummaryColumn } from '@/utils/tableColumns';
import { CREDIT_NOTE_STATUS } from '@/utils/constants';
import { dateFormateForUi } from '@/utils/services';

export const creditNoteColumn = () => {
  return [
    {
      title: 'Credit Notes#',
      dataIndex: 'creditNoteId',
      key: 'creditNoteId',
      render: creditNoteId => <Tag className=" font-semibold">{creditNoteId}</Tag>,
      visible: true,
      required: true,
      sorter: true,
      fixed: 'left',
    },
    getDateColumn('Date', 'creditNoteDate', 'creditNoteDate', true, true),
    {
      title: 'Customer Name',
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
      render: status => <StatusBadge status={status} value={CREDIT_NOTE_STATUS?.[status] || ''} />,
      visible: true,
      required: true,
      sorter: true,
      width: 151,
    },
    {
      title: 'Type',
      dataIndex: 'creditNoteType',
      key: 'creditNoteType',
      render: creditNoteType => (creditNoteType ? <Tag className="text-xs">{creditNoteType}</Tag> : null),
      visible: true,
      required: true,
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
      title: 'Reference Number',
      dataIndex: 'referenceNumber',
      key: 'referenceNumber',
      render: referenceNumber => referenceNumber,
      visible: true,
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

export const creditNoteExportColumn = () => [
  {
    title: 'Credit Notes#',
    getExportValue: creditNote => creditNote?.creditNoteId || '',
  },
  {
    title: 'Date',
    getExportValue: creditNote => (creditNote?.creditNoteDate ? dateFormateForUi(creditNote.creditNoteDate) : ''),
  },
  {
    title: 'Customer Name',
    getExportValue: creditNote => creditNote?.customerDisplayName || '',
  },
  {
    title: 'Status',
    getExportValue: creditNote => CREDIT_NOTE_STATUS?.[creditNote?.status] || creditNote?.status || '',
  },
  {
    title: 'Type',
    getExportValue: creditNote => creditNote?.creditNoteType || '',
  },
  {
    title: 'Total Amount',
    getExportValue: creditNote => creditNote?.total ?? '',
  },
  {
    title: 'Available Balance',
    getExportValue: creditNote => creditNote?.availableBalance ?? '',
  },
  {
    title: 'Reference Number',
    getExportValue: creditNote => creditNote?.referenceNumber || '',
  },
  {
    title: 'Division',
    getExportValue: creditNote => creditNote?.divisionName || '',
  },
  {
    title: 'Branch',
    getExportValue: creditNote => creditNote?.branchName || '',
  },
  {
    title: 'Warehouse',
    getExportValue: creditNote => creditNote?.warehouseName || '',
  },
  {
    title: 'Added By',
    getExportValue: creditNote => creditNote?.addedBy || '',
  },
  {
    title: 'Updated By',
    getExportValue: creditNote => creditNote?.updatedBy || '',
  },
];
