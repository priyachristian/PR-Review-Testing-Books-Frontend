import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { Tag, Popover } from '@/components/AntDComponent';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import { dateFormateForUi } from '@/utils/services';
import { getDateColumn, getAmountCoulmn, TruncatedCell, getOverflowListColumn, getQuantitySummaryColumn } from '@/utils/tableColumns';
import { BILL_STATUS, BACKEND_ENUM } from '@/utils/constants';

const paymentMadeOverflowList = {
  getKey: (item, index) => `${item.id || item._id}-${index}`,
  getLabel: item => item.paymentMadeId,
  getLink: item => `/payments-made/${item.id || item._id}`,
};

export const billColumn = isSplitSessionActive => {
  return [
    {
      title: 'Bill#',
      key: 'billId',
      render: record => {
        const hasSplitTag = Boolean(record?.splitBillNo && isSplitSessionActive);

        return (
          <div className="flex items-center gap-1 flex-nowrap">
            <Tag className="font-semibold m-0">{record?.billId}</Tag>
            {hasSplitTag && (
              <Popover
                trigger="hover"
                content={
                  <div className="flex flex-wrap gap-2 max-w-[280px]">
                    <Link
                      to={`/bills/${record?.splitBillId}`}
                      onClick={e => {
                        e.stopPropagation();
                      }}
                    >
                      <Tag className="font-semibold m-0 cursor-pointer">{record?.splitBillNo}</Tag>
                    </Link>
                  </div>
                }
              >
                <Tag className="font-semibold m-0 cursor-pointer" onClick={e => e.stopPropagation()}>
                  +1
                </Tag>
              </Popover>
            )}
          </div>
        );
      },
      visible: true,
      required: true,
      fixed: 'left',
      sorter: true,
    },
    getDateColumn('Date', 'billDate', 'billDate', true, true),
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
      key: 'status',
      render: record => {
        const currentDate = dayjs();
        const dueDate = dayjs(record?.dueDate);
        const daysDiff = dueDate.diff(currentDate, 'day');

        return record?.status === BACKEND_ENUM?.OVERDUE ? (
          <span className="text-red-500">{`Overdue by ${Math.abs(daysDiff)} days`}</span>
        ) : (
          <StatusBadge status={record?.status} value={BILL_STATUS?.[record?.status] || ''} />
        );
      },
      visible: true,
      required: true,
      sorter: true,
      width: 142,
    },
    {
      title: 'Item Count',
      dataIndex: 'itemCount',
      key: 'itemCount',
      visible: true,
      width: 120,
    },
    getQuantitySummaryColumn(),
    getAmountCoulmn('Basic Amount', 'subTotal', 'subTotal', true),
    getAmountCoulmn('Total Amount', 'total', 'total', true, true),
    getAmountCoulmn('Balance Due', 'balanceAmount', 'balanceAmount', true),
    getDateColumn('Due Date', 'dueDate', 'dueDate', true, true),
    {
      title: 'Customer Notes',
      dataIndex: 'customerNotes',
      key: 'customerNotes',
      visible: false,
      sorter: true,
      ellipsis: {
        showTitle: false,
      },
      render: text => <TruncatedCell value={text} />,
    },
    getOverflowListColumn({
      title: 'Payment Made',
      dataIndex: 'payments',
      key: 'payments',
      overflowList: paymentMadeOverflowList,
      width: 158,
    }),
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

export const billExportColumn = () => [
  {
    title: 'Bill#',
    getExportValue: bill => (bill?.splitBillNo ? `${bill?.billId ?? ''} / ${bill.splitBillNo}` : (bill?.billId ?? '')),
  },
  {
    title: 'Date',
    getExportValue: bill => (bill?.billDate ? dateFormateForUi(bill.billDate) : ''),
  },
  {
    title: 'Vendor Name',
    getExportValue: bill => bill?.customerDisplayName || '',
  },
  {
    title: 'Status',
    getExportValue: bill => {
      if (bill?.status === BACKEND_ENUM?.OVERDUE && bill?.dueDate) {
        const daysDiff = dayjs(bill.dueDate).diff(dayjs(), 'day');
        return `Overdue by ${Math.abs(daysDiff)} days`;
      }
      return BILL_STATUS?.[bill?.status] || bill?.status || '';
    },
  },
  {
    title: 'Basic Amount',
    getExportValue: bill => bill?.subTotal ?? '',
  },
  {
    title: 'Total Amount',
    getExportValue: bill => bill?.total ?? '',
  },
  {
    title: 'Balance Due',
    getExportValue: bill => bill?.balanceAmount ?? '',
  },
  {
    title: 'Due Date',
    getExportValue: bill => (bill?.dueDate ? dateFormateForUi(bill.dueDate) : ''),
  },
  {
    title: 'Customer Notes',
    getExportValue: bill => bill?.customerNotes || '',
  },
  {
    title: 'Division',
    getExportValue: bill => bill?.divisionName || '',
  },
  {
    title: 'Branch',
    getExportValue: bill => bill?.branchName || '',
  },
  {
    title: 'Warehouse',
    getExportValue: bill => bill?.warehouseName || '',
  },
  {
    title: 'Added By',
    getExportValue: bill => bill?.addedBy || '',
  },
  {
    title: 'Updated By',
    getExportValue: bill => bill?.updatedBy || '',
  },
];
