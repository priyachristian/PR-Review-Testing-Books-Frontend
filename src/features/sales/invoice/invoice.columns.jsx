import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import Icons from 'assets/icons/icon';
import { Tag, Popover } from '@/components/AntDComponent';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import { getDateColumn, getAmountCoulmn, TruncatedCell, getOverflowListColumn, getQuantitySummaryColumn } from '@/utils/tableColumns';
import { dateFormateForUi } from '@/utils/services';
import { BACKEND_ENUM, INVOICE_STATUS, E_INVOICE_STATUS, E_WAY_BILL_STATUS } from '@/utils/constants';

const paymentReceivedOverflowList = {
  getKey: (item, index) => `${item.id || item._id}-${index}`,
  getLabel: item => item.paymentReceivedId,
  getLink: item => `/payments-received/${item.id || item._id}`,
};

export const invoiceColumn = (isSplitSessionActive, eInvoiceOptions = {}) => {
  // Plan gating: E-Invoice column only when the company's plan enables e-invoicing / e-way billing.
  const { showEInvoice = false, showEWayBill = false } = eInvoiceOptions;
  const showEInvoiceColumn = showEInvoice || showEWayBill;

  return [
    {
      title: 'Invoice#',
      // dataIndex: "invoiceId",
      key: 'invoiceId',
      render: record => {
        const hasSplitTag = Boolean(record?.splitInvoiceNo && isSplitSessionActive);

        return (
          <div className="flex items-center gap-1 flex-nowrap">
            <Tag className="font-semibold m-0">{record?.invoiceId}</Tag>
            {hasSplitTag && (
              <Popover
                trigger="hover"
                content={
                  <div className="flex flex-wrap gap-2 max-w-[280px]">
                    <Link
                      to={`/invoices/${record?.splitInvoiceId}`}
                      onClick={e => {
                        e.stopPropagation();
                      }}
                    >
                      <Tag className="font-semibold m-0 cursor-pointer">{record?.splitInvoiceNo}</Tag>
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
      sorter: true,
      fixed: 'left',
    },
    getDateColumn('Date', 'invoiceDate', 'invoiceDate', true, true),
    {
      title: 'Reference Number',
      dataIndex: 'referenceNumber',
      key: 'referenceNumber',
      visible: true,
      sorter: true,
    },
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
      // dataIndex: "status",
      key: 'status',
      render: record => {
        const currentDate = dayjs();
        const dueDate = dayjs(record?.dueDate);
        const daysDiff = dueDate.diff(currentDate, 'day');

        return record?.status === BACKEND_ENUM?.OVERDUE ? (
          <span className="text-red-500">{`Overdue by ${Math.abs(daysDiff)} days`}</span>
        ) : (
          <StatusBadge status={record?.status} value={INVOICE_STATUS?.[record?.status] || ''} />
        );
      },
      visible: true,
      required: true,
      sorter: true,
      width: 137,
    },
    {
      title: 'Dispatch Status',
      key: 'dispatchStatus',
      render: (_, record) => {
        if (record?.invoiceDispatchId) {
          return <StatusBadge status={'DELIVERED'} value="Dispatched" />;
        } else {
          return <StatusBadge status={'default'} value="Not Dispatched" />;
        }
      },
      visible: true,
      sorter: true,
      width: 168,
    },
    ...(showEInvoiceColumn
      ? [
          {
            title: showEInvoice ? 'E-Invoice / E-Way' : 'E-Way Bill',
            key: 'eInvoiceEWay',
            render: (_, record) => {
              // Active only — a cancelled/expired IRN or EWB counts as "not present".
              const hasIrn = Boolean(record?.eInvoice?.irn) && record?.eInvoice?.status === E_INVOICE_STATUS.ACT.value;
              const hasEWayBill = Boolean(record?.eWayBill?.eWayBillNo) && record?.eWayBill?.status === E_WAY_BILL_STATUS.ACT.value;

              const stateTag = (label, active, activeColor, detailLabel, detailValue) => {
                const tag = (
                  <Tag color={active ? activeColor : 'default'} bordered className="m-0" style={{ paddingInline: 7, marginInlineEnd: 0, borderRadius: 6, lineHeight: '18px' }}>
                    <span className="inline-flex items-center gap-1 text-xs">
                      {active ? <Icons.CheckCircleOutlined style={{ fontSize: 11 }} /> : <Icons.MinusCircleOutlined style={{ fontSize: 11, opacity: 0.45 }} />}
                      {label}
                    </span>
                  </Tag>
                );

                return active && detailValue ? (
                  <Popover
                    trigger="hover"
                    content={
                      <div className="max-w-[280px] text-xs break-all">
                        <span className="text-gray-500">{detailLabel}: </span>
                        {detailValue}
                      </div>
                    }
                  >
                    {tag}
                  </Popover>
                ) : (
                  tag
                );
              };

              return (
                <div className="flex items-center gap-1.5 flex-nowrap">
                  {showEInvoice && stateTag('E-Invoice', hasIrn, 'success', 'IRN', record?.eInvoice?.irn)}
                  {showEWayBill && stateTag('E-Way', hasEWayBill, 'processing', 'EWB No', record?.eWayBill?.eWayBillNo)}
                </div>
              );
            },
            visible: true,
            sorter: false,
          },
        ]
      : []),
    getDateColumn('Due Date', 'dueDate', 'dueDate', true, true),
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
    {
      title: 'Order To Invoice Days',
      dataIndex: 'orderToInvoiceDays',
      key: 'orderToInvoiceDays',
      visible: true,
      sorter: true,
    },
    {
      title: 'Invoice to Payment Days',
      key: 'orderToPaymentDays',
      dataIndex: 'orderToPaymentDays',
      visible: true,
      sorter: true,
      render: value => {
        if (value === null || value === undefined || value === '') {
          return null;
        }
        const n = typeof value === 'number' ? value : Number(value);
        if (Number.isNaN(n) || n < 0) {
          return null;
        }
        return n;
      },
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
      visible: false,
      sorter: true,
    },
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
      title: 'Payment Received',
      dataIndex: 'payments',
      key: 'payments',
      overflowList: paymentReceivedOverflowList,
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

export const invoiceExportColumn = () => [
  {
    title: 'Invoice#',
    getExportValue: invoice => (invoice?.splitInvoiceNo ? `${invoice?.invoiceId ?? ''} / ${invoice.splitInvoiceNo}` : (invoice?.invoiceId ?? '')),
  },
  {
    title: 'Date',
    getExportValue: invoice => (invoice?.invoiceDate ? dateFormateForUi(invoice.invoiceDate) : ''),
  },
  {
    title: 'Reference Number',
    getExportValue: invoice => invoice?.referenceNumber || '',
  },
  {
    title: 'Customer Name',
    getExportValue: invoice => invoice?.customerDisplayName || invoice?.customerName || '',
  },
  {
    title: 'Status',
    getExportValue: invoice => {
      if (invoice?.status === BACKEND_ENUM?.OVERDUE && invoice?.dueDate) {
        const daysDiff = dayjs(invoice.dueDate).diff(dayjs(), 'day');
        return `Overdue by ${Math.abs(daysDiff)} days`;
      }
      return INVOICE_STATUS?.[invoice?.status] || invoice?.status || '';
    },
  },
  {
    title: 'Dispatch Status',
    getExportValue: invoice => (invoice?.invoiceDispatchId ? 'Dispatched' : 'Not Dispatched'),
  },
  {
    title: 'Due Date',
    getExportValue: invoice => (invoice?.dueDate ? dateFormateForUi(invoice.dueDate) : ''),
  },
  {
    title: 'Basic Amount',
    getExportValue: invoice => invoice?.subTotal ?? '',
  },
  {
    title: 'Total Amount',
    getExportValue: invoice => invoice?.total ?? '',
  },
  {
    title: 'Balance Due',
    getExportValue: invoice => invoice?.balanceAmount ?? '',
  },
  {
    title: 'Order To Invoice Days',
    getExportValue: invoice => invoice?.orderToInvoiceDays ?? '',
  },
  {
    title: 'Invoice to Payment Days',
    getExportValue: invoice => invoice?.orderToPaymentDays ?? '',
  },
  {
    title: 'Subject',
    getExportValue: invoice => invoice?.subject || '',
  },
  {
    title: 'Customer Notes',
    getExportValue: invoice => invoice?.customerNotes || '',
  },
  {
    title: 'Division',
    getExportValue: invoice => invoice?.divisionName || '',
  },
  {
    title: 'Branch',
    getExportValue: invoice => invoice?.branchName || '',
  },
  {
    title: 'Warehouse',
    getExportValue: invoice => invoice?.warehouseName || '',
  },
  {
    title: 'Added By',
    getExportValue: invoice => invoice?.addedBy || '',
  },
  {
    title: 'Updated By',
    getExportValue: invoice => invoice?.updatedBy || '',
  },
];
