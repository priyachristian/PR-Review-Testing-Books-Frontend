import { Link } from 'react-router-dom';

// Components
import { Tag, Tooltip } from '../components/AntDComponent';
import StatusBadge from '@/components/ui/badge/StatusBadge';
import QuantitySummaryCell from '@/components/dataDisplay/appTable/QuantitySummaryCell';

// Extras
import { BILL_STATUS, DELIVERY_CHALLAN_STATUS, GRPO_STATUS, INVOICE_STATUS, NAVIGATION_ENUM, SALES_ORDER_STATUS } from './constants';
import { REJECTION_STATUS } from './dropdownEnums';
import { formatAmount } from './currency';
import { dateFormateForUi } from './services';

export const DOCUMENT_NUMBER_COLUMN_WIDTH = 160;

export const STANDARD_COLUMN_WIDTHS = {
  date: 120,
  'customer name': 380,
  'vendor name': 380,
  'customer display name': 280,
  name: 220,
  'item name': 400,
  item: 400,
  'branch name': 200,
  'division name': 200,
  'company name': 220,
  division: 180,
  branch: 180,
  warehouse: 180,
  status: 220,
  action: 130,
  actions: 130,
  amount: 150,
  'total amount': 150,
  'basic amount': 150,
  'balance due': 150,
  'balance amount': 150,
  'paid amount': 150,
  'due amount': 150,
  'amount (incl. tax)': 150,
  'remaining amount': 170,
  rate: 100,
  reference: 180,
  subject: 200,
  email: 240,
  phone: 160,
  description: 220,
  notes: 220,
  remarks: 220,
  address: 300,
  'added by': 160,
  'updated by': 160,
  'created from': 140,
  'customer notes': 280,
};

export const getTitleText = title => {
  if (typeof title === 'string') return title;
  return title?.props?.children?.[0]?.props?.children || title?.props?.children || 'Column';
};

export const normalizeColumnTitle = title =>
  String(getTitleText(title) || '')
    .trim()
    .toLowerCase();

const calculateHeaderWidth = (text, hasTooltip) => {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = '600 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const safeText = typeof text === 'string' ? text : String(text || 'Column');
  const metrics = context.measureText(safeText.toUpperCase());
  const padding = 32;
  const iconSpace = hasTooltip ? 40 : 16;
  return Math.max(80, Math.ceil(metrics.width + padding + iconSpace));
};

const inferMinWidthFromKey = (column, titleText) => {
  const keyText = String(column?.dataIndex || column?.key || '').toLowerCase();
  const titleLower = String(titleText || '').toLowerCase();
  if (titleLower === 'action' || titleLower === 'actions') return STANDARD_COLUMN_WIDTHS.action;
  if (titleLower.includes('#') || keyText.includes('number') || (keyText.endsWith('id') && keyText.length <= 12)) return DOCUMENT_NUMBER_COLUMN_WIDTH;
  if (titleLower.includes('date') || keyText.includes('date') || keyText.includes('createdat')) return STANDARD_COLUMN_WIDTHS.date;
  if (titleLower.includes('status') || keyText.includes('status')) return STANDARD_COLUMN_WIDTHS.status;
  if (titleLower.includes('amount') || keyText.includes('amount') || keyText.includes('total')) return STANDARD_COLUMN_WIDTHS.amount;
  if (titleLower.includes('balance') || keyText.includes('balance')) return STANDARD_COLUMN_WIDTHS['balance due'];
  if (/\bname\b/.test(titleLower) || titleLower.endsWith(' name')) return STANDARD_COLUMN_WIDTHS[titleLower.includes('customer') ? 'customer name' : 'vendor name'];
  if (titleLower.includes('email') || keyText.includes('email')) return STANDARD_COLUMN_WIDTHS.email;
  if (titleLower.includes('phone') || keyText.includes('phone') || titleLower.includes('mobile')) return STANDARD_COLUMN_WIDTHS.phone;
  if (titleLower.includes('description') || titleLower.includes('notes') || titleLower.includes('remarks')) return STANDARD_COLUMN_WIDTHS.description;
  if (titleLower.includes('address')) return STANDARD_COLUMN_WIDTHS.address;
  return 180;
};

export const resolveColumnWidth = column => {
  // Respect explicit width set by the column author
  if (column?.width != null && column?.width !== '') return Number(column.width);

  const titleText = getTitleText(column?.title);
  const normalizedTitle = normalizeColumnTitle(titleText);

  if (STANDARD_COLUMN_WIDTHS[normalizedTitle]) {
    return STANDARD_COLUMN_WIDTHS[normalizedTitle];
  }

  if (normalizedTitle.includes('#')) {
    return DOCUMENT_NUMBER_COLUMN_WIDTH;
  }

  const inferredWidth = inferMinWidthFromKey(column, titleText);
  const headerWidth = calculateHeaderWidth(titleText, column?.tooltip);

  return Math.max(inferredWidth, headerWidth);
};

export const TruncatedCell = ({ value, children, getPopupContainer }) => {
  const text = children ?? (value === null || value === undefined ? '' : typeof value === 'string' || typeof value === 'number' ? String(value) : '');
  if (!text) return null;

  return (
    <Tooltip title={text} getPopupContainer={getPopupContainer || (() => document.body)}>
      <span className="block min-w-0 max-w-full truncate">{text}</span>
    </Tooltip>
  );
};

export const getQuantitySummaryColumn = (title = 'Total Quantity', dataIndex = 'quantitySummary', key = 'quantitySummary', visible = true, width = 160) => ({
  title,
  dataIndex,
  key,
  visible,
  width,
  ellipsis: false,
  render: summary => <QuantitySummaryCell summary={summary} />,
});

export const getOverflowListColumn = ({ title, dataIndex, key, visible = true, overflowList = {}, width = 200, ...rest }) => ({
  title,
  dataIndex,
  key: key ?? dataIndex,
  visible,
  overflowList,
  width,
  ...rest,
});

export const getAmountCoulmn = (title = '', dataIndex = '', key = '', visible = true, required = false, sorter = true) => {
  const normalizedTitle = normalizeColumnTitle(title);
  const width = STANDARD_COLUMN_WIDTHS[normalizedTitle] ?? STANDARD_COLUMN_WIDTHS.amount;

  return {
    title: title,
    dataIndex: dataIndex,
    key: key,
    render: (amount, record) => formatAmount(amount, true, record?.currency),
    visible: visible,
    required: required,
    sorter: sorter,
    width,
  };
};

export const getDateColumn = (title = '', dataIndex = '', key = '', visible = true, requiredOrWidth = false, width) => {
  const required = typeof requiredOrWidth === 'number' ? false : Boolean(requiredOrWidth);
  const normalizedTitle = normalizeColumnTitle(title);
  const defaultWidth = STANDARD_COLUMN_WIDTHS[normalizedTitle] ?? STANDARD_COLUMN_WIDTHS.date;
  const columnWidth = typeof requiredOrWidth === 'number' ? requiredOrWidth : (width ?? defaultWidth);

  return {
    title: title,
    dataIndex: dataIndex,
    key: key,
    render: date => dateFormateForUi(date),
    visible: visible,
    required: required,
    sorter: true,
    width: columnWidth,
    ellipsis: true,
  };
};

const baseConvertToColumn = (dateTitle, dateKey, dueDateTitle, dueDateKey, doctitle, STATUS_ENUM) => {
  return [
    {
      title: `${doctitle}#`,
      key: 'documentNo',
      render: record => (
        <Link to={`/${NAVIGATION_ENUM?.[record?.type]}/${record?._id}`}>
          <Tag className=" font-semibold">{record?.documentNo}</Tag>
        </Link>
      ),
      visible: true,
    },
    getDateColumn(dateTitle, dateKey, dateKey, true),
    {
      title: 'Status ',
      dataIndex: 'status',
      key: 'status',
      render: status => <StatusBadge status={status} value={STATUS_ENUM?.[status] || ''} />,
      visible: true,
    },
    ...(dueDateTitle ? [getDateColumn(dueDateTitle, dueDateKey, dueDateKey, true)] : []),
    getAmountCoulmn('Amount', 'total', 'total', true),
  ];
};

export const convertToColumn = {
  convertToSalesOrderColumn: [...baseConvertToColumn('Date', 'orderDate', 'Shipment Date', 'expectedShipmentDate', 'Sales Order', SALES_ORDER_STATUS)],
  convertToDeliveryChallanColumn: [...baseConvertToColumn('Date', 'challanDate', '', '', 'Delivery Challan', DELIVERY_CHALLAN_STATUS)],
  convertToInvoiceColumn: [...baseConvertToColumn('Date', 'invoiceDate', 'Due Date', 'dueDate', 'Invoice', INVOICE_STATUS), getAmountCoulmn('Balance Due', 'balanceAmount', 'balanceAmount', true)],
  convertToGrpoColumn: [...baseConvertToColumn('Date', 'date', 'Due Date', 'dueDate', 'GRPO Order', GRPO_STATUS)],
  convertToBillColumn: [...baseConvertToColumn('Date', 'billDate', 'Due Date', 'dueDate', 'Bill', BILL_STATUS), getAmountCoulmn('Balance Due', 'balanceAmount', 'balanceAmount', true)],
};

export const convertFromColumn = (dateKey, STATUS_ENUM, docTitle, docKey, navigationPage) => {
  return [
    {
      title: `${docTitle}#`,
      key: docKey,
      render: record => (
        <Link to={`/${NAVIGATION_ENUM?.[navigationPage]}/${record?._id}`}>
          <Tag className=" font-semibold">{record?.[docKey]}</Tag>
        </Link>
      ),
      visible: true,
    },
    getDateColumn('Date', dateKey, dateKey, true),
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: status => <StatusBadge status={status} value={STATUS_ENUM?.[status] || ''} />,
      visible: true,
    },
    getAmountCoulmn('Amount', 'total', 'total', true),
  ];
};

export const rejectionConvertFromColumn = () => [
  {
    title: 'Rejection Order#',
    key: 'rejectionOrderId',
    render: record => {
      const ref = record?.rejectionOrderRef;
      const id = ref?._id || ref;
      return (
        <Link to={`/${NAVIGATION_ENUM?.RejectionOrder}/${id}`}>
          <Tag className="font-semibold">{record?.rejectionOrderId}</Tag>
        </Link>
      );
    },
    visible: true,
  },
  {
    title: 'Customer',
    key: 'customer',
    render: record => {
      return record?.customerDisplayName;
    },
    visible: true,
  },
  {
    title: 'Date',
    key: 'createdAt',
    render: record => dateFormateForUi(record?.rejectionOrderRef?.createdAt) || '—',
    visible: true,
  },
  {
    title: 'Location',
    key: 'location',
    render: record => {
      const addr = record?.rejectionOrderRef?.address;
      const parts = [addr?.city, addr?.state].filter(Boolean);
      return parts.length ? parts.join(', ') : '—';
    },
    visible: true,
  },
  {
    title: 'Status',
    key: 'status',
    render: record => {
      const status = record?.rejectionOrderRef?.status;
      return <StatusBadge status={status} value={REJECTION_STATUS?.[status]?.label || status || ''} />;
    },
    visible: true,
  },
];

const gstr1RowSpanCell = r => ({
  rowSpan: r?.rowSpanCommon ?? 1,
  style: { verticalAlign: 'middle' },
});

const gstr1RenderRowSpan = (v, r, isDate = false) => (r?.rowSpanCommon ? (isDate && v ? dateFormateForUi(v) : (v ?? '–')) : '');

const gstr1RenderRowSpanAmount = (v, r) => (r?.rowSpanCommon && v != null ? formatAmount(v) : '');

const gstr1RateCol = {
  title: 'Rate',
  dataIndex: 'gstTaxPercent',
  key: 'gstTaxPercent',
  align: 'left',
  width: 80,
  render: v => (v != null ? `${Number(v)}%` : '–'),
};
const gstr1TaxableValueCol = {
  title: 'Taxable Value',
  dataIndex: 'taxableAmount',
  key: 'taxableAmount',
  align: 'left',
  width: 100,
  render: v => (v != null ? formatAmount(v) : '–'),
};

const GSTR1_AMOUNT_SUBCOLS = [
  { title: 'Integrated Tax', key: 'igst', width: 120, getVal: r => r?.igst?.taxValue ?? 0 },
  { title: 'Central Tax', key: 'cgst', width: 110, getVal: r => r?.cgst?.taxValue ?? 0 },
  {
    title: 'State / UT Tax',
    key: 'stateUtTax',
    width: 120,
    getVal: r => r?.sgstUgst?.taxValue ?? 0,
  },
  { title: 'Cess', key: 'cess', width: 90, getVal: r => r?.cess ?? 0 },
];
const GSTR1_AMOUNT_SUBCOLS_INTEGRATED_CESS = GSTR1_AMOUNT_SUBCOLS.filter(c => c.key === 'igst' || c.key === 'cess');
const gstr1AmountChildren = subCols =>
  subCols.map(({ title, key, width, getVal }) => ({
    title,
    key,
    align: 'right',
    width,
    render: (_, r) => formatAmount(getVal(r)),
  }));

const gstr1InvoiceDetailsChildren = includeValue => {
  const base = [
    {
      title: 'No.',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      align: 'left',
      width: 100,
      onCell: gstr1RowSpanCell,
      render: (v, r) => gstr1RenderRowSpan(v, r),
    },
    {
      title: 'Date',
      dataIndex: 'invoiceDate',
      key: 'invoiceDate',
      align: 'left',
      width: 110,
      onCell: gstr1RowSpanCell,
      render: (v, r) => gstr1RenderRowSpan(v, r, true),
    },
  ];
  if (includeValue) {
    base.push({
      title: 'Value',
      dataIndex: 'invoiceAmount',
      key: 'invoiceAmount',
      align: 'left',
      width: 110,
      onCell: gstr1RowSpanCell,
      render: gstr1RenderRowSpanAmount,
    });
  }
  return base;
};

const GSTR1_INVOICE_COLUMN_PIECES = {
  gstin: {
    title: 'GSTIN / UIN',
    key: 'gstin',
    align: 'left',
    width: 160,
    onCell: gstr1RowSpanCell,
    render: (_, r) => gstr1RenderRowSpan(r?.contact?.gstin, r),
  },
  placeOfSupply: {
    title: 'Place of Supply',
    key: 'placeOfSupply',
    align: 'left',
    width: 180,
    onCell: gstr1RowSpanCell,
    render: (v, r) => gstr1RenderRowSpan(r?.placeOfSupply ?? v, r),
  },
  invoiceDetailsNoDate: {
    title: 'Invoice details',
    key: 'invoiceDetails',
    align: 'center',
    onHeaderCell: () => ({ className: 'gstr1-group-header-center' }),
    children: gstr1InvoiceDetailsChildren(false),
  },
  invoiceDetailsWithValue: {
    title: 'Invoice details',
    key: 'invoiceDetails',
    align: 'center',
    onHeaderCell: () => ({ className: 'gstr1-group-header-center' }),
    children: gstr1InvoiceDetailsChildren(true),
  },
  value: {
    title: 'Value',
    dataIndex: 'invoiceAmount',
    key: 'invoiceAmount',
    align: 'right',
    width: 110,
    onCell: gstr1RowSpanCell,
    render: gstr1RenderRowSpanAmount,
  },
  rate: gstr1RateCol,
  taxableValue: gstr1TaxableValueCol,
  amountFull: {
    title: 'Amount',
    key: 'amount',
    align: 'left',
    onHeaderCell: () => ({ className: 'gstr1-group-header-center' }),
    children: gstr1AmountChildren(GSTR1_AMOUNT_SUBCOLS),
  },
  amountIntegratedCess: {
    title: 'Amount',
    key: 'amount',
    align: 'left',
    onHeaderCell: () => ({ className: 'gstr1-group-header-center' }),
    children: gstr1AmountChildren(GSTR1_AMOUNT_SUBCOLS_INTEGRATED_CESS),
  },
};

const GSTR1_INVOICE_SECTION_LAYOUT = {
  B2B: ['gstin', 'invoiceDetailsWithValue', 'rate', 'taxableValue', 'amountFull', 'placeOfSupply'],
  B2CL: ['placeOfSupply', 'invoiceDetailsWithValue', 'rate', 'taxableValue', 'amountIntegratedCess'],
  B2CS: ['placeOfSupply', 'rate', 'taxableValue', 'amountFull'],
};

const buildGstr1InvoiceColumns = sectionKey => {
  const keys = GSTR1_INVOICE_SECTION_LAYOUT[sectionKey];
  return keys ? keys.map(k => ({ ...GSTR1_INVOICE_COLUMN_PIECES[k] })) : [];
};

export const B2B_GSTR1_TABLE_COLUMNS = buildGstr1InvoiceColumns('B2B');
export const B2CL_GSTR1_TABLE_COLUMNS = buildGstr1InvoiceColumns('B2CL');
export const B2CS_GSTR1_TABLE_COLUMNS = buildGstr1InvoiceColumns('B2CS');

const gstr1NoteRowSpanCol = (title, dataIndex, key, width, align = 'left', opts = {}) => ({
  title,
  dataIndex,
  key,
  align,
  width,
  onCell: gstr1RowSpanCell,
  render: (v, r) => (opts.isDate ? gstr1RenderRowSpan(v, r, true) : opts.isAmount ? gstr1RenderRowSpanAmount(v, r) : gstr1RenderRowSpan(v, r)),
});

const CDNR_COLUMN_DESCRIPTORS = [
  { title: 'Recipient GSTIN', dataIndex: 'recipientGSTIN', key: 'recipientGSTIN', width: 160 },
  { title: 'Recipient Name', dataIndex: 'recipientName', key: 'recipientName', width: 180 },
  { title: 'Note No', dataIndex: 'noteNumber', key: 'noteNumber', width: 120 },
  { title: 'Note Date', dataIndex: 'noteDate', key: 'noteDate', width: 110, isDate: true },
  {
    title: 'Original Inv No',
    dataIndex: 'originalInvoiceNumber',
    key: 'originalInvoiceNumber',
    width: 130,
  },
  {
    title: 'Original Inv Date',
    dataIndex: 'originalInvoiceDate',
    key: 'originalInvoiceDate',
    width: 140,
    isDate: true,
  },
  {
    title: 'Note Value',
    dataIndex: 'noteValue',
    key: 'noteValue',
    width: 120,
    align: 'left',
    isAmount: true,
  },
  {
    title: 'Rate',
    dataIndex: 'gstTaxPercent',
    key: 'gstTaxPercent',
    align: 'center',
    width: 80,
    noRowSpan: true,
  },
  {
    title: 'Taxable Value',
    dataIndex: 'taxableAmount',
    key: 'taxableAmount',
    align: 'right',
    width: 130,
    noRowSpan: true,
  },
  { key: 'amount', isAmountGroup: true },
  { title: 'Place of Supply', dataIndex: 'placeOfSupply', key: 'placeOfSupply', width: 160 },
];

const buildCdnrColumns = ({ excludeRecipientGstin = false, integratedCessOnly = false } = {}) => {
  const amountSubcols = integratedCessOnly ? GSTR1_AMOUNT_SUBCOLS_INTEGRATED_CESS : GSTR1_AMOUNT_SUBCOLS;
  const amountCol = {
    title: 'Amount',
    key: 'amount',
    align: 'left',
    onHeaderCell: () => ({ className: 'gstr1-group-header-center' }),
    children: gstr1AmountChildren(amountSubcols),
  };
  return CDNR_COLUMN_DESCRIPTORS.filter(d => !(excludeRecipientGstin && d.key === 'recipientGSTIN')).map(d => {
    if (d.isAmountGroup) return amountCol;
    if (d.noRowSpan) return d.key === 'gstTaxPercent' ? { ...gstr1RateCol, width: d.width } : { ...gstr1TaxableValueCol };
    return gstr1NoteRowSpanCol(d.title, d.dataIndex, d.key, d.width, d.align, d);
  });
};

export const CDNR_GSTR1_COLUMNS = buildCdnrColumns({});
export const CDNUR_GSTR1_COLUMNS = buildCdnrColumns({
  excludeRecipientGstin: true,
  integratedCessOnly: true,
});

export const EXEMP_GSTR1_COLUMNS = [
  {
    title: 'Description',
    dataIndex: 'description',
    key: 'description',
    align: 'left',
    width: 280,
    render: v => v ?? '–',
  },
  {
    title: 'Non-GST',
    dataIndex: 'non_gst',
    key: 'non_gst',
    align: 'left',
    width: 120,
    render: v => (v != null ? formatAmount(v) : '–'),
  },
  {
    title: 'Exempt',
    dataIndex: 'exempt',
    key: 'exempt',
    align: 'left',
    width: 100,
    render: v => (v != null ? formatAmount(v) : '–'),
  },
  {
    title: 'Nil Rated',
    dataIndex: 'nil_rated',
    key: 'nil_rated',
    align: 'left',
    width: 100,
    render: v => (v != null ? formatAmount(v) : '–'),
  },
];

export const HSN_GSTR1_COLUMNS = [
  {
    title: 'HSN',
    dataIndex: 'hsnCode',
    key: 'hsnCode',
    align: 'left',
    width: 100,
    render: v => v ?? '–',
  },
  {
    title: 'Description',
    dataIndex: 'description',
    key: 'description',
    align: 'left',
    width: 180,
    render: v => v ?? '–',
  },
  {
    title: 'UQC',
    dataIndex: 'unit',
    key: 'unit',
    align: 'left',
    width: 80,
    render: v => v ?? '–',
  },
  {
    title: 'Total Quantity',
    dataIndex: 'totalQuantity',
    key: 'totalQuantity',
    align: 'left',
    width: 110,
    render: v => (v != null ? v : '–'),
  },
  {
    title: 'Total Value',
    dataIndex: 'totalItemValue',
    key: 'totalItemValue',
    align: 'left',
    width: 120,
    render: v => (v != null ? formatAmount(v) : '–'),
  },
  {
    title: 'Taxable Value',
    dataIndex: 'totalTaxableValue',
    key: 'totalTaxableValue',
    align: 'left',
    width: 120,
    render: v => (v != null ? formatAmount(v) : '–'),
  },
  {
    title: 'Amount',
    key: 'amount',
    align: 'left',
    onHeaderCell: () => ({ className: 'gstr1-group-header-center' }),
    children: [
      {
        title: 'Integrated Tax',
        key: 'totalIgst',
        align: 'left',
        width: 120,
        render: (_, r) => (r?.totalIgst != null ? formatAmount(r.totalIgst) : '–'),
      },
      {
        title: 'Central Tax',
        key: 'totalCgst',
        align: 'left',
        width: 110,
        render: (_, r) => (r?.totalCgst != null ? formatAmount(r.totalCgst) : '–'),
      },
      {
        title: 'State / UT Tax',
        key: 'stateUtTax',
        align: 'left',
        width: 120,
        render: (_, r) => (r != null ? formatAmount(r?.totalSgstUgst ?? 0) : '–'),
      },
      {
        title: 'Cess',
        key: 'totalCess',
        align: 'left',
        width: 90,
        render: (_, r) => (r?.totalCess != null ? formatAmount(r.totalCess) : '–'),
      },
    ],
  },
];

export const DOCUMENTS_GSTR1_COLUMNS = [
  {
    title: 'Nature of document',
    dataIndex: 'documentLabel',
    key: 'documentLabel',
    align: 'left',
    width: 220,
    render: v => v ?? '–',
  },
  {
    title: 'Serial From',
    dataIndex: 'serialFrom',
    key: 'serialFrom',
    align: 'left',
    width: 100,
    render: v => v ?? '–',
  },
  {
    title: 'Serial To',
    dataIndex: 'serialTo',
    key: 'serialTo',
    align: 'left',
    width: 100,
    render: v => v ?? '–',
  },
  {
    title: 'Total Issued',
    dataIndex: 'totalIssued',
    key: 'totalIssued',
    align: 'left',
    width: 100,
    render: v => (v != null ? v : '–'),
  },
  {
    title: 'Cancelled',
    dataIndex: 'cancelledCount',
    key: 'cancelledCount',
    align: 'left',
    width: 90,
    render: v => (v != null ? v : '–'),
  },
  {
    title: 'Net Issued',
    dataIndex: 'netIssued',
    key: 'netIssued',
    align: 'left',
    width: 100,
    render: v => (v != null ? v : '–'),
  },
];

export const GSTR1_SECTION_COLUMNS = {
  B2B: B2B_GSTR1_TABLE_COLUMNS,
  B2CL: B2CL_GSTR1_TABLE_COLUMNS,
  B2CS: B2CS_GSTR1_TABLE_COLUMNS,
  CDNR: CDNR_GSTR1_COLUMNS,
  CDNUR: CDNUR_GSTR1_COLUMNS,
  EXEMP: EXEMP_GSTR1_COLUMNS,
  HSN_B2B: HSN_GSTR1_COLUMNS,
  HSN_B2C: HSN_GSTR1_COLUMNS,
  DOCUMENTS_ISSUED: DOCUMENTS_GSTR1_COLUMNS,
};

export const profitAndLossTableColumns = [
  {
    title: 'Particulars',
    dataIndex: 'accountName',
    key: 'accountName',
    width: '70%',
    render: (name, record) => {
      const isDeduction = record.isDeduction;
      const paddingLeft = Math.min(record.depth ?? 0, 10) * 16 + 8;
      return (
        <div
          className={`text-xs align-top ${record.depth === 0 ? 'font-medium' : 'text-gray-600 font-normal'} ${isDeduction ? 'text-red-600' : ''}`}
          style={{ paddingLeft: record.depth === 0 ? 8 : paddingLeft }}
        >
          {name}
        </div>
      );
    },
  },
  {
    title: '',
    dataIndex: 'amount',
    key: 'amount',
    width: '30%',
    align: 'right',
    render: (val, record) => {
      const showAmount = record.depth === 0 || !record.children?.length;
      const isDeduction = record.isDeduction;
      return (
        <div className={`text-xs font-mono whitespace-nowrap align-top ${record.depth === 0 ? 'font-semibold' : ''} ${isDeduction ? 'text-red-600' : ''}`}>
          {showAmount ? formatAmount(val ?? 0) : ''}
        </div>
      );
    },
  },
];

export const ITEMS_USED_IN_COLUMNS = [
  { title: 'Item Number', dataIndex: 'itemNo', key: 'itemNo' },
  { title: 'Item Name', dataIndex: 'itemName', key: 'itemName' },
  { title: 'Item Type', dataIndex: 'itemType', key: 'itemType' },
  {
    title: 'Item Group',
    dataIndex: 'itemGroup',
    key: 'itemGroup',
  },
];
