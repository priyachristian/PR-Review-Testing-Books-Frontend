import { renderBatchNumber } from '@/features/inventory/batches/batches.columns';
import { Link } from 'react-router-dom';
import { Button, Tag, Tooltip } from '@/components/AntDComponent';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import { getAmountCoulmn, getDateColumn, TruncatedCell, STANDARD_COLUMN_WIDTHS } from '@/utils/tableColumns';
import { MONTHS_ENUM } from '@/utils/constants';
import { dateFormateForUi } from '@/utils/services';
import { formatAmount } from '@/utils/currency';
import { colorPalette } from '@/utils/theme';

export const itemLedgerReportColumn = () => [
  {
    title: 'Date',
    dataIndex: 'date',
    key: 'date',
    align: 'start',
    width: 100,
    fixed: 'left',
    render: (_, record) => (record?.isBalanceRow ? '' : dateFormateForUi(record.date)),
  },
  {
    title: 'Effect',
    dataIndex: 'effectType',
    key: 'effectType',
    align: 'start',
    width: 80,
    render: (_, record) => {
      if (record?.isBalanceRow) return '';
      const { effectType } = record;
      const color = effectType === 'IN' ? 'green' : 'red';
      return <Tag color={color}>{effectType}</Tag>;
    },
  },
  {
    title: 'Posting Document',
    dataIndex: 'referenceType',
    key: 'referenceType',
    align: 'start',
    render: (_, record) => {
      if (record?.isBalanceRow) return <strong>{record.label}</strong>;
      return record.referenceType;
    },
  },
  {
    title: 'Doc No',
    dataIndex: 'refNo',
    key: 'refNo',
    align: 'start',
    width: 120,
    render: (_, record) => (record?.isBalanceRow ? '' : record.refNo),
  },
  {
    title: 'Vendor/Customer Name',
    dataIndex: 'partyName',
    key: 'partyName',
    align: 'start',
  },
  {
    title: 'QTY',
    dataIndex: 'quantity',
    key: 'quantity',
    align: 'start',
    width: 100,
    render: (_, record) => {
      if (record?.isBalanceRow) {
        // return <strong className="text-blue-600">{record.amount?.toLocaleString()}</strong>;
      }

      const qty = record.quantity || 0;
      const effect = record.effectType;
      const prefix = qty === 0 ? '' : effect === 'IN' ? '+' : effect === 'OUT' ? '' : '';
      const color = qty === 0 ? '' : effect === 'IN' ? 'text-green-600' : effect === 'OUT' ? 'text-red-600' : '';

      return (
        <span className={color}>
          {prefix}
          {record?.isBalanceRow ? '' : qty.toLocaleString()}
        </span>
      );
    },
  },
  {
    title: 'QTY Balance',
    dataIndex: 'QuantityBalance',
    key: 'QuantityBalance',
    align: 'start',
    width: 120,
    render: (_, record) => {
      if (record?.isBalanceRow) {
        return <span className="font-bold">{record.amount?.toLocaleString()}</span>;
      }
      return record?.QuantityBalance;
    },
  },
  {
    title: 'Batch Item Price',
    dataIndex: 'rate',
    key: 'rate',
    align: 'start',
    width: 120,
    render: (_, record) => (record?.isBalanceRow ? '' : record.rate),
  },
  {
    title: 'Amount',
    dataIndex: 'amount',
    key: 'amount',
    align: 'start',
    width: 120,
    render: (_, record) => {
      if (record?.isBalanceRow) return '';

      const amt = record.amount || 0;
      const effect = record.effectType;
      const prefix = amt === 0 ? '' : effect === 'IN' ? '+' : effect === 'OUT' ? '' : '';
      const color = amt === 0 ? '' : effect === 'IN' ? 'text-green-600' : effect === 'OUT' ? 'text-red-600' : '';

      return (
        <span className={color}>
          {prefix}
          {amt.toLocaleString()}
        </span>
      );
    },
  },
  {
    title: 'Balance',
    dataIndex: 'RunningAmount',
    key: 'RunningAmount',
    align: 'start',
    render: (_, record) => (record?.isBalanceRow ? <strong className="">{formatAmount(record.runAmount)}</strong> : formatAmount(record.RunningAmount)),
  },
  {
    title: 'Warehouse',
    dataIndex: 'warehouseName',
    key: 'warehouseName',
    align: 'start',
    render: (_, record) => (record?.isBalanceRow ? '' : record.warehouseName || ''),
  },
];

export const salesLedgerReportColumn = isSplitSessionActive => [
  {
    title: 'Month',
    key: 'Month',
    render: record => `${MONTHS_ENUM?.[record?.month]?.short}-${record?.year}`,
    visible: true,
  },
  {
    title: 'Total Orders',
    dataIndex: 'totalOrders',
    key: 'totalOrders',
    visible: true,
  },
  getAmountCoulmn('Basic Amount', 'totalSubTotal', 'totalSubTotal', true),
  getAmountCoulmn('Total Amount (with Tax)', 'totalFinal', 'totalFinal', true),
  ...(isSplitSessionActive ? [getAmountCoulmn('Split Total Amount', 'splitSalesTotal', 'splitSalesTotal', true)] : []),
  getAmountCoulmn('Closing Balance', 'closingBalance', 'closingBalance', true),
];

const LEDGER_SUMMARY_ROWS = ['Carried Over', 'Brought Forward', 'Total'];

const isLedgerSummaryRow = record => LEDGER_SUMMARY_ROWS.includes(record?.customerDisplayName);

export const salesLedgerDetailExportColumn = () => [
  {
    title: 'Date',
    getExportValue: record => (record?.invoiceDate ? dateFormateForUi(record.invoiceDate) : ''),
  },
  {
    title: 'Particulars',
    getExportValue: record => record?.customerDisplayName || '',
  },
  {
    title: 'Vch Type',
    getExportValue: () => 'Tax Invoice',
  },
  {
    title: 'Vch No.',
    getExportValue: record => record?.invoiceId || '',
  },
  {
    title: 'Debit',
    getExportValue: record => Math.round(record?.total || 0),
  },
  {
    title: 'Credit',
    getExportValue: record => record?.credit ?? '',
  },
];

export const salesLedgerDetailReportColumn = [
  getDateColumn('Date', 'invoiceDate', 'invoiceDate', true),
  {
    title: 'Particulars',
    dataIndex: 'customerDisplayName',
    key: 'customerDisplayName',
    render: customerDisplayName => <span className={isLedgerSummaryRow({ customerDisplayName }) ? 'font-bold' : ''}>{customerDisplayName || ''}</span>,
    visible: true,
  },
  {
    title: 'Vch Type',
    key: 'Vch Type',
    render: record => (isLedgerSummaryRow(record) ? '' : 'Tax Invoice'),
    visible: true,
  },
  {
    title: 'Vch No.',
    key: 'invoiceId',
    render: record =>
      isLedgerSummaryRow(record) ? (
        ''
      ) : (
        <Link to={`/invoices/${record?.id}`}>
          <Tag className="font-semibold">{record?.invoiceId}</Tag>
        </Link>
      ),
    visible: true,
  },
  {
    title: 'Debit',
    key: 'debit',
    render: record => {
      return <span className={isLedgerSummaryRow(record) ? 'font-bold' : ''}>{formatAmount(Math.round(record?.total || 0))}</span>;
    },
    visible: true,
  },
  {
    title: 'Credit',
    dataIndex: 'credit',
    key: 'credit',
    visible: true,
  },
];

export const purchaseLedgerReportColumn = isSplitSessionActive => [
  {
    title: 'Month',
    key: 'Month',
    render: record => `${MONTHS_ENUM?.[record?.month]?.short}-${record?.year}`,
    visible: true,
  },
  {
    title: 'Total Orders',
    dataIndex: 'totalOrders',
    key: 'totalOrders',
    visible: true,
  },
  getAmountCoulmn('Sub Total', 'totalSubTotal', 'totalSubTotal', true),
  getAmountCoulmn('Total Amount', 'totalFinal', 'totalFinal', true),
  ...(isSplitSessionActive ? [getAmountCoulmn('Split Total Amount', 'splitPurchaseTotal', 'splitPurchaseTotal', true)] : []),
  getAmountCoulmn('Closing Balance', 'closingBalance', 'closingBalance', true),
];

export const purchaseLedgerDetailExportColumn = () => [
  {
    title: 'Date',
    getExportValue: record => (record?.billDate ? dateFormateForUi(record.billDate) : ''),
  },
  {
    title: 'Particulars',
    getExportValue: record => record?.customerDisplayName || '',
  },
  {
    title: 'Vch Type',
    getExportValue: () => 'Bill',
  },
  {
    title: 'Vch No.',
    getExportValue: record => record?.billId || '',
  },
  {
    title: 'Debit',
    getExportValue: record => record?.debit ?? '',
  },
  {
    title: 'Credit',
    getExportValue: record => Math.round(record?.total || 0),
  },
];

export const purchaseLedgerDetailReportColumn = [
  getDateColumn('Date', 'billDate', 'billDate', true),
  {
    title: 'Particulars',
    dataIndex: 'customerDisplayName',
    key: 'customerDisplayName',
    render: customerDisplayName => <span className={isLedgerSummaryRow({ customerDisplayName }) ? 'font-bold' : ''}>{customerDisplayName || ''}</span>,
    visible: true,
  },
  {
    title: 'Vch Type',
    key: 'Vch Type',
    render: record => (isLedgerSummaryRow(record) ? '' : 'Bill'),
    visible: true,
  },
  {
    title: 'Vch No.',
    key: 'billId',
    render: record =>
      isLedgerSummaryRow(record) ? (
        ''
      ) : (
        <Link to={`/bills/${record?.id}`}>
          <Tag className=" font-semibold">{record?.billId}</Tag>
        </Link>
      ),
    visible: true,
  },
  {
    title: 'Debit',
    dataIndex: 'debit',
    key: 'debit',
    visible: true,
  },
  // getAmountCoulmn("Credit", "total", "total", true),
  {
    title: 'Credit',
    key: 'credit',
    render: record => {
      return <span className={isLedgerSummaryRow(record) ? 'font-bold' : ''}>{formatAmount(Math.round(record?.total || 0))}</span>;
    },
    visible: true,
  },
];

export const creditorLedgersReportColumn = isSplitSessionActive => [
  {
    title: 'Particulars',
    dataIndex: 'customerDisplayName',
    key: 'customerDisplayName',
    render: customerDisplayName => (
      <span className={customerDisplayName === 'Carried Over' || customerDisplayName === 'Brought Forward' || customerDisplayName === 'Total' ? 'font-bold' : ''}>{customerDisplayName || ''}</span>
    ),
    visible: true,
  },
  {
    title: 'Debit',
    key: 'Debit',
    render: record => {
      return (
        <span className={record?.customerDisplayName === 'Carried Over' || record?.customerDisplayName === 'Brought Forward' || record?.customerDisplayName === 'Total' ? 'font-bold' : ''}>
          {record?.totalDebit ? formatAmount(Math.abs(record?.totalDebit)) : record?.netPayable < 0 ? formatAmount(Math.abs(record?.netPayable)) : ''}
        </span>
      );
    },
    visible: true,
  },
  {
    title: 'Credit',
    key: 'Credit',
    render: record => {
      return (
        <span className={record?.customerDisplayName === 'Carried Over' || record?.customerDisplayName === 'Brought Forward' || record?.customerDisplayName === 'Total' ? 'font-bold' : ''}>
          {record?.totalCredit ? formatAmount(record?.totalCredit) : record?.netPayable > 0 ? formatAmount(record?.netPayable) : ''}
        </span>
      );
    },
    visible: true,
  },
  {
    title: 'Due Amount',
    key: 'DueAmount',
    render: record => (record?.overdueBillTotal && record?.overdueBillTotal > 0 ? formatAmount(record?.overdueBillTotal) : ''),
    visible: true,
  },
  ...(isSplitSessionActive
    ? [
        {
          title: 'Split Debit',
          key: 'splitDebit',
          render: record => {
            return (
              <span className={record?.customerDisplayName === 'Carried Over' || record?.customerDisplayName === 'Brought Forward' || record?.customerDisplayName === 'Total' ? 'font-bold' : ''}>
                {record?.splitTotalDebit ? formatAmount(Math.abs(record?.splitTotalDebit)) : record?.splitNetPayable < 0 ? formatAmount(Math.abs(record?.splitNetPayable)) : ''}
              </span>
            );
          },
          visible: true,
        },
        {
          title: 'Split Credit',
          key: 'splitCredit',
          render: record => {
            return (
              <span className={record?.customerDisplayName === 'Carried Over' || record?.customerDisplayName === 'Brought Forward' || record?.customerDisplayName === 'Total' ? 'font-bold' : ''}>
                {record?.splitTotalCredit ? formatAmount(record?.splitTotalCredit) : record?.splitNetPayable > 0 ? formatAmount(record?.splitNetPayable) : ''}
              </span>
            );
          },
          visible: true,
        },
        {
          title: 'Split Due Amount',
          key: 'splitDueAmount',
          render: record => (record?.splitOverdueBillTotal && record?.splitOverdueBillTotal > 0 ? formatAmount(record?.splitOverdueBillTotal) : ''),
          visible: true,
        },
        {
          title: 'Total Debit',
          key: 'totalDebitsWithSplit',
          render: record => {
            return (
              <span className={record?.customerDisplayName === 'Carried Over' || record?.customerDisplayName === 'Brought Forward' || record?.customerDisplayName === 'Total' ? 'font-bold' : ''}>
                {record?.totalDebitsWithSplit ? formatAmount(Math.abs(record?.totalDebitsWithSplit)) : ''}
              </span>
            );
          },
          visible: true,
        },
        {
          title: 'Total Credits',
          key: 'totalCreditsWithSplit',
          render: record => {
            return (
              <span className={record?.customerDisplayName === 'Carried Over' || record?.customerDisplayName === 'Brought Forward' || record?.customerDisplayName === 'Total' ? 'font-bold' : ''}>
                {record?.totalCreditsWithSplit ? formatAmount(Math.abs(record?.totalCreditsWithSplit)) : ''}
              </span>
            );
          },
          visible: true,
        },
        {
          title: 'Total Due Amount',
          key: 'totalOverdueBillWithSplit',
          render: record => (record?.totalOverdueBillWithSplit && record?.totalOverdueBillWithSplit > 0 ? formatAmount(record?.totalOverdueBillWithSplit) : ''),
          visible: true,
        },
      ]
    : []),
];

export const debtorLedgersReportColumn = isSplitSessionActive => [
  {
    title: 'Particulars',
    dataIndex: 'customerDisplayName',
    key: 'customerDisplayName',
    render: customerDisplayName => (
      <span className={customerDisplayName === 'Carried Over' || customerDisplayName === 'Brought Forward' || customerDisplayName === 'Total' ? 'font-bold' : ''}>{customerDisplayName || ''}</span>
    ),
    visible: true,
  },
  {
    title: 'Debit',
    key: 'Debit',

    render: record => {
      return (
        <span className={record?.customerDisplayName === 'Carried Over' || record?.customerDisplayName === 'Brought Forward' || record?.customerDisplayName === 'Total' ? 'font-bold' : ''}>
          {record?.totalDebit ? formatAmount(record?.totalDebit) : record?.netPayable > 0 ? formatAmount(record?.netPayable) : ''}
        </span>
      );
    },
    visible: true,
  },
  {
    title: 'Credit',
    key: 'Credit',
    render: record => {
      return (
        <span className={record?.customerDisplayName === 'Carried Over' || record?.customerDisplayName === 'Brought Forward' || record?.customerDisplayName === 'Total' ? 'font-bold' : ''}>
          {record?.totalCredit ? formatAmount(Math.abs(record?.totalCredit)) : record?.netPayable < 0 ? formatAmount(Math.abs(record?.netPayable)) : ''}
        </span>
      );
    },
    visible: true,
  },
  {
    title: 'Due Amount',
    key: 'DueAmount',
    render: record => (record?.overdueInvoiceTotal && record?.overdueInvoiceTotal > 0 ? formatAmount(record?.overdueInvoiceTotal) : ''),
    visible: true,
  },
  ...(isSplitSessionActive
    ? [
        {
          title: 'Split Debit',
          key: 'splitDebit',

          render: record => {
            return (
              <span className={record?.customerDisplayName === 'Carried Over' || record?.customerDisplayName === 'Brought Forward' || record?.customerDisplayName === 'Total' ? 'font-bold' : ''}>
                {record?.splitTotalDebit ? formatAmount(record?.splitTotalDebit) : record?.splitNetPayable > 0 ? formatAmount(record?.splitNetPayable) : ''}
              </span>
            );
          },
          visible: true,
        },
        {
          title: 'Split Credit',
          key: 'splitCredit',
          render: record => {
            return (
              <span className={record?.customerDisplayName === 'Carried Over' || record?.customerDisplayName === 'Brought Forward' || record?.customerDisplayName === 'Total' ? 'font-bold' : ''}>
                {record?.splitTotalCredit ? formatAmount(Math.abs(record?.splitTotalCredit)) : record?.splitNetPayable < 0 ? formatAmount(Math.abs(record?.splitNetPayable)) : ''}
              </span>
            );
          },
          visible: true,
        },
        {
          title: 'Split Due Amount',
          key: 'SplitDueAmount',
          render: record => (record?.splitOverdueInvoiceTotal && record?.splitOverdueInvoiceTotal > 0 ? formatAmount(record?.splitOverdueInvoiceTotal) : ''),
          visible: true,
        },
        {
          title: 'Total Debit',
          key: 'totalDebitsWithSplit',
          render: record => {
            return (
              <span className={record?.customerDisplayName === 'Carried Over' || record?.customerDisplayName === 'Brought Forward' || record?.customerDisplayName === 'Total' ? 'font-bold' : ''}>
                {record?.totalDebitsWithSplit ? formatAmount(Math.abs(record?.totalDebitsWithSplit)) : ''}
              </span>
            );
          },
          visible: true,
        },
        {
          title: 'Total Credits',
          key: 'totalCreditsWithSplit',
          render: record => {
            return (
              <span className={record?.customerDisplayName === 'Carried Over' || record?.customerDisplayName === 'Brought Forward' || record?.customerDisplayName === 'Total' ? 'font-bold' : ''}>
                {record?.totalCreditsWithSplit ? formatAmount(Math.abs(record?.totalCreditsWithSplit)) : ''}
              </span>
            );
          },
          visible: true,
        },
        {
          title: 'Total Due Amount',
          key: 'totalOverdueBillWithSplit',
          render: record => (record?.totalOverdueBillWithSplit && record?.totalOverdueBillWithSplit > 0 ? formatAmount(record?.totalOverdueBillWithSplit) : ''),
          visible: true,
        },
      ]
    : []),
];

export const ProfitAndLoseColumns = [
  {
    title: 'Customer Name',
    dataIndex: 'customerDisplayName',
    key: 'customerDisplayName',
    render: customerDisplayName => customerDisplayName || '-',
  },
  {
    title: 'Total Documents',
    dataIndex: 'documentCount',
    key: 'documentCount',
    render: documentCount => documentCount ?? '-',
  },
  {
    title: 'Total Cost',
    dataIndex: 'totalCost',
    key: 'totalCost',
    render: totalCost => formatAmount(totalCost) || '-',
  },
  {
    title: 'Total Revenue',
    dataIndex: 'totalRevenue',
    key: 'totalRevenue',
    render: totalRevenue => formatAmount(totalRevenue) || '-',
  },
  {
    title: 'Total Profit',
    dataIndex: 'totalNetProfit',
    key: 'totalNetProfit',
    render: totalNetProfit => {
      const amount = formatAmount(totalNetProfit) || '-';
      const color = totalNetProfit > 0 ? 'text-green-600' : totalNetProfit < 0 ? 'text-red-500' : 'inherit';
      return <span className={color}>{amount}</span>;
    },
  },
  {
    title: 'Profit %',
    dataIndex: 'profitMarginPercentage',
    key: 'profitMarginPercentage',
    render: profitMarginPercentage => {
      const percentage = `${profitMarginPercentage} %` || '-';
      const color = profitMarginPercentage > 0 ? 'text-green-600' : profitMarginPercentage < 0 ? 'text-red-500' : 'inherit';
      return <span className={color}>{percentage}</span>;
    },
  },
];

export const ItemWiseProfitAndLoseColumns = [
  {
    title: 'Item#',
    dataIndex: 'itemNo',
    key: 'itemNo',
    render: itemNo => <Tag className="font-semibold">{itemNo}</Tag>,
  },
  {
    title: 'Item Name',
    dataIndex: 'itemName',
    key: 'itemName',
    render: itemName => itemName || '-',
  },
  {
    title: 'Total Documents',
    dataIndex: 'documentCount',
    key: 'documentCount',
    render: documentCount => documentCount ?? '-',
  },
  {
    title: 'Total Cost',
    dataIndex: 'totalCost',
    key: 'totalCost',
    render: totalCost => formatAmount(totalCost) || '-',
  },
  {
    title: 'Total Revenue',
    dataIndex: 'totalRevenue',
    key: 'totalRevenue',
    render: totalRevenue => formatAmount(totalRevenue) || '-',
  },
  {
    title: 'Total Profit',
    dataIndex: 'totalNetProfit',
    key: 'totalNetProfit',
    render: totalNetProfit => {
      const amount = formatAmount(totalNetProfit) || '-';
      const color = totalNetProfit > 0 ? 'text-green-600' : totalNetProfit < 0 ? 'text-red-500' : 'inherit';
      return <span className={color}>{amount}</span>;
    },
  },
  {
    title: 'Profit %',
    dataIndex: 'profitMarginPercentage',
    key: 'profitMarginPercentage',
    render: profitMarginPercentage => {
      const percentage = `${profitMarginPercentage} %` || '-';
      const color = profitMarginPercentage > 0 ? 'text-green-600' : profitMarginPercentage < 0 ? 'text-red-500' : 'inherit';
      return <span className={color}>{percentage}</span>;
    },
  },
];

export const CustomerMonthWiseProfitAndLoseColumns = [
  {
    title: 'Customer Name',
    dataIndex: 'customerDisplayName',
    key: 'customerDisplayName',
    fixed: 'left',
    render: customerDisplayName => customerDisplayName || '-',
  },
];

export const CustomerProfitAndLoseColumns = [
  {
    title: 'Document#',
    dataIndex: 'documentNo',
    key: 'documentNo',
    render: documentNo => <Tag className="font-semibold">{documentNo}</Tag>,
  },
  {
    title: 'Total Items',
    dataIndex: 'totalItems',
    key: 'totalItems',
    render: totalItems => totalItems ?? '-',
  },
  {
    title: 'Total Cost',
    dataIndex: 'totalCost',
    key: 'totalCost',
    render: totalCost => formatAmount(totalCost) || '-',
  },
  // {
  //   title: "Total Qty",
  //   dataIndex: "totalQuantity",
  //   key: "totalQuantity",
  //   render: (totalQuantity) => <Tag className="font-semibold">{totalQuantity}</Tag>,
  // },
  {
    title: 'Total Revenue',
    dataIndex: 'totalRevenue',
    key: 'totalRevenue',
    render: totalRevenue => formatAmount(totalRevenue) || '-',
  },
  {
    title: 'Total Profit',
    dataIndex: 'totalNetProfit',
    key: 'totalNetProfit',
    render: totalNetProfit => {
      const amount = formatAmount(totalNetProfit) || '-';
      const color = totalNetProfit > 0 ? 'text-green-600' : totalNetProfit < 0 ? 'text-red-500' : 'inherit';
      return <span className={color}>{amount}</span>;
    },
  },
  {
    title: 'Profit %',
    dataIndex: 'profitMarginPercentage',
    key: 'profitMarginPercentage',
    render: profitMarginPercentage => {
      const percentage = `${profitMarginPercentage} %` || '-';
      const color = profitMarginPercentage > 0 ? 'text-green-600' : profitMarginPercentage < 0 ? 'text-red-500' : 'inherit';
      return <span className={color}>{percentage}</span>;
    },
  },
  // {
  //   title: "Action",
  //   key: "edit",
  //   render: () => (
  //     <div className="flex items-center gap-3">
  //       <Tooltip title="View Sales">
  //         <Button icon={<Icons.EyeOutlined />} />
  //       </Tooltip>
  //     </div>
  //   ),
  // },
];

export const CustomerDetailsBatchProfitAndLossColumns = [
  {
    title: 'Item#',
    dataIndex: 'itemNo',
    key: 'itemNo',
    render: itemNo => <Tag className="font-semibold">{itemNo}</Tag>,
  },
  {
    title: 'Item Name',
    dataIndex: 'itemName',
    key: 'itemName',
    render: itemName => itemName || '-',
  },
  {
    title: 'Total Qty',
    dataIndex: 'totalQuantity',
    key: 'totalQuantity',
    render: totalQuantity => <Tag className="font-semibold">{totalQuantity}</Tag>,
  },
  {
    title: 'Total Cost',
    dataIndex: 'totalCost',
    key: 'totalCost',
    render: totalCost => formatAmount(totalCost) || '-',
  },
  {
    title: 'Total Revenue',
    dataIndex: 'totalRevenue',
    key: 'totalRevenue',
    render: totalRevenue => formatAmount(totalRevenue) || '-',
  },
  {
    title: 'Total Profit',
    dataIndex: 'totalNetProfit',
    key: 'totalNetProfit',
    render: totalNetProfit => {
      const amount = formatAmount(totalNetProfit) || '-';
      const color = totalNetProfit > 0 ? 'text-green-600' : totalNetProfit < 0 ? 'text-red-500' : 'inherit';
      return <span className={color}>{amount}</span>;
    },
  },
  {
    title: 'Profit %',
    dataIndex: 'profitMarginPercentage',
    key: 'profitMarginPercentage',
    render: profitMarginPercentage => {
      const percentage = `${profitMarginPercentage} %` || '-';
      const color = profitMarginPercentage > 0 ? 'text-green-600' : profitMarginPercentage < 0 ? 'text-red-500' : 'inherit';
      return <span className={color}>{percentage}</span>;
    },
  },
];

export const ItemDetailsProfitAndLoseColumns = [
  {
    title: 'Document#',
    dataIndex: 'documentNo',
    key: 'documentNo',
    render: documentNo => <Tag className="font-semibold">{documentNo}</Tag>,
  },
  {
    title: 'Customer',
    dataIndex: 'customerName',
    key: 'customerName',
    ellipsis: true,
    render: (customerName, record) => (
      <Tooltip title={customerName || record?.customerId || ''}>
        <span className="text-gray-800">{customerName || '-'}</span>
      </Tooltip>
    ),
  },
  {
    title: 'Total Qty',
    dataIndex: 'totalQuantity',
    key: 'totalQuantity',
    render: totalQuantity => <Tag className="font-semibold">{totalQuantity}</Tag>,
  },
  {
    title: 'Total Cost',
    dataIndex: 'totalCost',
    key: 'totalCost',
    render: totalCost => formatAmount(totalCost) || '-',
  },
  {
    title: 'Total Revenue',
    dataIndex: 'totalRevenue',
    key: 'totalRevenue',
    render: totalRevenue => formatAmount(totalRevenue) || '-',
  },
  {
    title: 'Total Profit',
    dataIndex: 'totalNetProfit',
    key: 'totalNetProfit',
    render: totalNetProfit => {
      const amount = formatAmount(totalNetProfit) || '-';
      const color = totalNetProfit > 0 ? 'text-green-600' : totalNetProfit < 0 ? 'text-red-500' : 'inherit';
      return <span className={color}>{amount}</span>;
    },
  },
  {
    title: 'Profit %',
    dataIndex: 'profitMarginPercentage',
    key: 'profitMarginPercentage',
    render: profitMarginPercentage => {
      const percentage = `${profitMarginPercentage} %` || '-';
      const color = profitMarginPercentage > 0 ? 'text-green-600' : profitMarginPercentage < 0 ? 'text-red-500' : 'inherit';
      return <span className={color}>{percentage}</span>;
    },
  },
  // {
  //   title: "Action",
  //   key: "view",
  //   render: (record) => (
  //     <div className="flex items-center gap-3">
  //       <Tooltip title="View Batches">
  //         <Button icon={<Icons.EyeOutlined />} onClick={() => handleViewClick(record)} />
  //       </Tooltip>
  //     </div>
  //   ),
  // },
];

export const ItemDetailsBatchProfitAndLossColumns = [
  {
    title: 'Batch#',
    dataIndex: 'batchNo',
    key: 'batchNo',
    render: (batchNo, record) => renderBatchNumber(batchNo, record.itemBatchId),
  },
  {
    title: 'Total Qty',
    dataIndex: 'quantity',
    key: 'quantity',
    render: quantity => <Tag className="font-semibold">{quantity}</Tag>,
  },
  {
    title: 'Purchase Price',
    dataIndex: 'purchasePrice',
    key: 'purchasePrice',
    render: purchasePrice => formatAmount(purchasePrice) || '-',
  },
  {
    title: 'Selling Price',
    dataIndex: 'sellingPrice',
    key: 'sellingPrice',
    render: sellingPrice => formatAmount(sellingPrice) || '-',
  },
  {
    title: 'Total Cost',
    dataIndex: 'totalCost',
    key: 'totalCost',
    render: totalCost => formatAmount(totalCost) || '-',
  },
  {
    title: 'Total Revenue',
    dataIndex: 'totalRevenue',
    key: 'totalRevenue',
    render: totalRevenue => formatAmount(totalRevenue) || '-',
  },
  {
    title: 'Total Profit',
    dataIndex: 'netProfit',
    key: 'netProfit',
    render: netProfit => {
      const amount = formatAmount(netProfit) || '-';
      const color = netProfit > 0 ? 'text-green-600' : netProfit < 0 ? 'text-red-500' : 'inherit';
      return <span className={color}>{amount}</span>;
    },
  },
];

export const getAgingBucketReportColumns = ({ type, onDocumentClick }) => {
  const isCustomer = type === 'customer';
  const documentIdKey = isCustomer ? 'invoiceId' : 'billId';

  return [
    {
      title: isCustomer ? 'Invoice #' : 'Bill #',
      dataIndex: isCustomer ? 'invoiceNo' : 'billNo',
      key: 'documentNo',
      fixed: 'left',
      width: 150,
      render: (text, record) => (
        <Tag
          type="button"
          onClick={e => {
            e.stopPropagation();
            onDocumentClick(record[documentIdKey]);
          }}
          className="color-primary hover:text-primary-hover hover:underline font-medium cursor-pointer"
        >
          {text || 'N/A'}
        </Tag>
      ),
    },
    {
      title: isCustomer ? 'Customer' : 'Vendor',
      dataIndex: isCustomer ? 'customerName' : 'vendorName',
      key: 'entityName',
    },
    {
      title: isCustomer ? 'Invoice Date' : 'Bill Date',
      dataIndex: isCustomer ? 'invoiceDate' : 'billDate',
      key: 'documentDate',
      align: 'center',
      render: date => (date ? dateFormateForUi(date) : '-'),
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      align: 'center',
      render: date => (date ? dateFormateForUi(date) : '-'),
    },
    {
      title: 'Payment Date',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      align: 'center',
      render: date => (date ? dateFormateForUi(date) : '-'),
    },
    {
      title: 'Age (Days)',
      dataIndex: 'ageDays',
      key: 'ageDays',
      align: 'center',
      render: days => {
        if (days === null || days === undefined) return '-';
        const color = days <= 30 ? 'green' : days <= 60 ? 'blue' : days <= 90 ? 'orange' : 'red';
        return <Tag color={color}>{days} days</Tag>;
      },
    },
    {
      title: 'Total Amount',
      dataIndex: 'total',
      key: 'total',
      align: 'right',
      render: amount => <span className="font-semibold">{formatAmount(amount || 0)}</span>,
    },
    {
      title: 'Paid Amount',
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      align: 'right',
      render: amount => formatAmount(amount || 0),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      align: 'center',
      render: (_, record) => {
        const balance = record.balanceAmount || 0;
        const amount = record.total || 0;
        if (balance === 0) return <StatusBadge status="PAID" value="Paid" />;
        if (balance < amount) return <StatusBadge status="PARTIALLY_PAID" value="Partially Paid" />;
        return <StatusBadge status="UNPAID" value="Unpaid" />;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'center',
      fixed: 'right',
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          style={{ color: colorPalette.primary[500] }}
          size="small"
          onClick={e => {
            e.stopPropagation();
            onDocumentClick(record[documentIdKey]);
          }}
        >
          View
        </Button>
      ),
    },
  ];
};

// Receivables / Payables: one row per due-date bucket. Amounts open the bucket's invoices or bills.
export const getUpcomingPaymentsBucketColumns = ({ sortBy, formatBucketLabel, onAmountClick }) => {
  const [sortField, sortDirection] = sortBy ? sortBy.split(':') : [null, null];
  const sortOrderFor = field => (sortField === field ? (sortDirection === 'asc' ? 'ascend' : 'descend') : null);

  const amountCell = (amount, record, type) => {
    const hasAmount = amount > 0;
    const colorClass = type === 'receivables' ? 'text-green-600 hover:text-green-700' : 'text-red-600 hover:text-red-700';
    return (
      <Tooltip title={hasAmount ? `Click to view ${type} list` : `No ${type}`}>
        <button
          type="button"
          disabled={!hasAmount}
          className={`font-semibold bg-transparent border-none p-0 ${hasAmount ? `cursor-pointer hover:underline ${colorClass}` : 'text-gray-400 cursor-not-allowed'}`}
          onClick={() => onAmountClick(record, type)}
        >
          {formatAmount(amount)}
        </button>
      </Tooltip>
    );
  };

  return [
    {
      title: 'Bucket',
      dataIndex: 'label',
      key: 'label',
      width: 200,
      fixed: 'left',
      render: (_, record) => <span className="font-semibold">{formatBucketLabel(record)}</span>,
    },
    {
      title: 'Amount Receivable',
      dataIndex: 'receivableAmount',
      key: 'receivableAmount',
      width: 180,
      align: 'right',
      sorter: true,
      sortOrder: sortOrderFor('receivableAmount'),
      render: (amount, record) => amountCell(amount, record, 'receivables'),
    },
    {
      title: 'Amount Payable',
      dataIndex: 'payableAmount',
      key: 'payableAmount',
      width: 180,
      align: 'right',
      sorter: true,
      sortOrder: sortOrderFor('payableAmount'),
      render: (amount, record) => amountCell(amount, record, 'payables'),
    },
    {
      title: 'Total Count',
      dataIndex: 'count',
      key: 'count',
      width: 120,
      align: 'center',
      sorter: true,
      sortOrder: sortOrderFor('count'),
      render: count => <Tag color="blue">{count}</Tag>,
    },
    {
      title: 'Receivables Count',
      dataIndex: 'receivables',
      key: 'receivablesCount',
      width: 150,
      align: 'center',
      sorter: true,
      sortOrder: sortOrderFor('receivablesCount'),
      render: receivables => <Tag color="green">{receivables.length}</Tag>,
    },
    {
      title: 'Payables Count',
      dataIndex: 'payables',
      key: 'payablesCount',
      width: 150,
      align: 'center',
      sorter: true,
      sortOrder: sortOrderFor('payablesCount'),
      render: payables => <Tag color="red">{payables.length}</Tag>,
    },
  ];
};

// Bucket detail rows are paged in the browser, so these columns carry no server sorter.
// Amounts arrive already converted to the base currency; overdue documents are not part of this report.
const upcomingPaymentStatus = record => {
  if (record.balanceAmount === 0) return <StatusBadge status="PAID" value="Paid" />;
  if (record.balanceAmount < record.amount) return <StatusBadge status="PARTIALLY_PAID" value="Partially Paid" />;
  return <StatusBadge status="UNPAID" value="Unpaid" />;
};

const daysUntilDueTag = days => <Tag color={days <= 7 ? 'orange' : 'blue'}>{days} days</Tag>;

export const getUpcomingPaymentsReceivablesColumns = ({ onDocumentClick }) => [
  {
    title: 'Invoice #',
    dataIndex: 'invoiceNumber',
    key: 'invoiceNumber',
    width: 140,
    fixed: 'left',
    render: (invoiceNumber, record) => (
      <Tag
        className="font-semibold cursor-pointer"
        onClick={e => {
          e.stopPropagation();
          onDocumentClick(record.redirectUrl);
        }}
      >
        {invoiceNumber}
      </Tag>
    ),
  },
  {
    title: 'Customer',
    dataIndex: 'customerName',
    key: 'customerName',
    width: STANDARD_COLUMN_WIDTHS['customer name'],
    render: customerName => <TruncatedCell value={customerName} />,
  },
  {
    title: 'Branch',
    dataIndex: 'branchName',
    key: 'branchName',
    width: STANDARD_COLUMN_WIDTHS.branch,
    render: branchName => <TruncatedCell value={branchName} />,
  },
  { ...getDateColumn('Invoice Date', 'invoiceDate', 'invoiceDate'), sorter: false },
  { ...getDateColumn('Due Date', 'dueDate', 'dueDate'), sorter: false },
  { title: 'Days Until Due', dataIndex: 'daysUntilDue', key: 'daysUntilDue', width: 160, align: 'center', render: daysUntilDueTag },
  { ...getAmountCoulmn('Invoice Amount', 'amount', 'amount', true, false, false), align: 'right' },
  {
    ...getAmountCoulmn('Paid Amount', 'paidAmount', 'paidAmount', true, false, false),
    align: 'right',
    render: (_, record) => formatAmount(record.amount - record.balanceAmount),
  },
  {
    ...getAmountCoulmn('Balance Due', 'balanceAmount', 'balanceAmount', true, false, false),
    align: 'right',
    render: balance => <span className="font-semibold text-red-600">{formatAmount(balance)}</span>,
  },
  { title: 'Status', dataIndex: 'status', key: 'status', width: 150, align: 'center', render: (_, record) => upcomingPaymentStatus(record) },
];

export const getUpcomingPaymentsPayablesColumns = ({ onDocumentClick }) => [
  {
    title: 'Bill #',
    dataIndex: 'billNumber',
    key: 'billNumber',
    width: 140,
    fixed: 'left',
    render: (billNumber, record) => (
      <Tag
        className="font-semibold cursor-pointer"
        onClick={e => {
          e.stopPropagation();
          onDocumentClick(record.redirectUrl);
        }}
      >
        {billNumber}
      </Tag>
    ),
  },
  {
    title: 'Vendor',
    dataIndex: 'vendorName',
    key: 'vendorName',
    width: STANDARD_COLUMN_WIDTHS['vendor name'],
    render: vendorName => <TruncatedCell value={vendorName} />,
  },
  {
    title: 'Branch',
    dataIndex: 'branchName',
    key: 'branchName',
    width: STANDARD_COLUMN_WIDTHS.branch,
    render: branchName => <TruncatedCell value={branchName} />,
  },
  { ...getDateColumn('Bill Date', 'billDate', 'billDate'), sorter: false },
  { ...getDateColumn('Due Date', 'dueDate', 'dueDate'), sorter: false },
  { title: 'Days Until Due', dataIndex: 'daysUntilDue', key: 'daysUntilDue', width: 160, align: 'center', render: daysUntilDueTag },
  { ...getAmountCoulmn('Bill Amount', 'amount', 'amount', true, false, false), align: 'right' },
  {
    ...getAmountCoulmn('Paid Amount', 'paidAmount', 'paidAmount', true, false, false),
    align: 'right',
    render: (_, record) => formatAmount(record.amount - record.balanceAmount),
  },
  {
    ...getAmountCoulmn('Balance Due', 'balanceAmount', 'balanceAmount', true, false, false),
    align: 'right',
    render: balance => <span className="font-semibold text-red-600">{formatAmount(balance)}</span>,
  },
  { title: 'Status', dataIndex: 'status', key: 'status', width: 150, align: 'center', render: (_, record) => upcomingPaymentStatus(record) },
];
