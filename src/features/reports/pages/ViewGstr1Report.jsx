import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileTextOutlined, RightOutlined } from '@ant-design/icons';
import { DEFAULT_PAGE_SIZE, TABLE_PAGE_SIZE_OPTIONS } from '@/utils/pagination';

// Components
import { Alert, Button, Col, Collapse, Dropdown, Row, Space, Tabs, Tooltip } from '@/components/AntDComponent';
import CustomButton from '@/components/ui/button/CustomButton';
import CustomDatePicker from '@/components/forms/formDatePicker/CustomDatePicker';
import CustomTable from '@/components/dataDisplay/appTable/CustomTable';

// Hooks
import { useGstr1 } from 'hooks/useGstr1';
import { useProfile } from '@/features/setting/profile/useProfile';
import { useFilters } from '@/utils/filtersUtils';

// Extras
import { gstr1InvoiceTransformer, gstr1NoteTransformer } from '@/features/reports';
import Icons from 'assets/icons/icon';
import { TAB_LIST, TAB_TOOLTIPS } from '../../../utils/constants';
import { GSTR1_SECTION_COLUMNS } from '../../../utils/tableColumns';
import { getCurrentFinancialYearRange } from 'utils/services';
import { formatAmount } from '@/utils/currency';
import { colorPalette } from 'utils/theme';

function exemptToTableRows(exempt) {
  if (!exempt) return [];
  const keys = ['inter_registered', 'inter_unregistered', 'intra_registered', 'intra_unregistered'];
  return keys.map(k => ({ key: k, ...exempt[k] })).filter(Boolean);
}

const getSectionTableData = (sectionKey, data) => {
  if (!data) return [];
  switch (sectionKey) {
    case 'B2B':
      return gstr1InvoiceTransformer(data.b2b?.invoices ?? []);
    case 'B2CL':
      return gstr1InvoiceTransformer(data.b2cl?.invoices ?? []);
    case 'B2CS':
      return gstr1InvoiceTransformer(data.b2cs?.invoices ?? []);
    case 'CDNR':
      return gstr1NoteTransformer(data.cdnr?.notes ?? []);
    case 'CDNUR':
      return gstr1NoteTransformer(data.cdnur?.notes ?? []);
    case 'EXEMP':
      return exemptToTableRows(data.exempt);
    case 'HSN_B2B':
      return data.hsn_b2b?.hsnSummary ?? [];
    case 'HSN_B2C':
      return data.hsn_b2c?.hsnSummary ?? [];
    case 'DOCUMENTS_ISSUED':
      return data.docs?.documentSummary ?? [];
    default:
      return [];
  }
};

const getPageBoundaries = (data, pageSize) => {
  if (!Array.isArray(data) || data.length === 0 || pageSize < 1) return [];
  if (data.length <= pageSize) return [{ start: 0, end: data.length }];
  const boundaries = [];
  let start = 0;
  while (start < data.length) {
    let s = start;
    let end = s + pageSize;
    while (s > 0 && data[s]?.rowSpanCommon === 0) s--;
    if (end <= data.length && data[end - 1]?.rowSpanCommon > 0) {
      end = Math.min(data.length, end - 1 + data[end - 1].rowSpanCommon);
    }
    boundaries.push({ start: s, end });
    start = end;
  }
  return boundaries;
};

const SECTION_SUMMARY_CONFIG = {
  B2B: [
    {
      key: 'recipients',
      title: 'Number of Recipients',
      getValue: d => d?.b2b?.distinctGstinSummary?.length ?? 0,
      format: 'number',
    },
    {
      key: 'invoices',
      title: 'Number of Invoices',
      getValue: d => d?.b2b?.invoices?.length ?? 0,
      format: 'number',
    },
    {
      key: 'invoiceValue',
      title: 'Total Invoice Value',
      getValue: d => parseFloat(d?.b2b?.totalInvoiceAmount) || 0,
      format: 'currency',
    },
    {
      key: 'taxableValue',
      title: 'Total Taxable Value',
      getValue: d => parseFloat(d?.b2b?.totalTaxableAmount) || 0,
      format: 'currency',
    },
    {
      key: 'cess',
      title: 'Total Cess',
      getValue: d => parseFloat(d?.b2b?.totalCessAmount) || 0,
      format: 'currency',
    },
  ],
  B2CL: [
    {
      key: 'invoices',
      title: 'Number of Invoices',
      getValue: d => d?.b2cl?.invoices?.length ?? 0,
      format: 'number',
    },
    {
      key: 'invoiceValue',
      title: 'Total Invoice Value',
      getValue: d => parseFloat(d?.b2cl?.totalInvoiceAmount) || 0,
      format: 'currency',
    },
    {
      key: 'taxableValue',
      title: 'Total Taxable Value',
      getValue: d => parseFloat(d?.b2cl?.totalTaxableAmount) || 0,
      format: 'currency',
    },
    {
      key: 'cess',
      title: 'Total Cess',
      getValue: d => parseFloat(d?.b2cl?.totalCessAmount) || 0,
      format: 'currency',
    },
  ],
  B2CS: [
    {
      key: 'invoiceValue',
      title: 'Total Invoice Value',
      getValue: d => parseFloat(d?.b2cs?.totalInvoiceAmount) || 0,
      format: 'currency',
    },
    {
      key: 'taxableValue',
      title: 'Total Taxable Value',
      getValue: d => parseFloat(d?.b2cs?.totalTaxableAmount) || 0,
      format: 'currency',
    },
    {
      key: 'cess',
      title: 'Total Cess',
      getValue: d => parseFloat(d?.b2cs?.totalCessAmount) || 0,
      format: 'currency',
    },
  ],
  CDNR: [
    {
      key: 'recipients',
      title: 'Number of Recipients',
      getValue: d => d?.cdnr?.distinctGstinSummary?.length ?? 0,
      format: 'number',
    },
    {
      key: 'notes',
      title: 'Number of Notes',
      getValue: d => d?.cdnr?.notes?.length ?? 0,
      format: 'number',
    },
    {
      key: 'noteValue',
      title: 'Total Note Value',
      getValue: d => parseFloat(d?.cdnr?.totalNoteAmount) || 0,
      format: 'currency',
    },
    {
      key: 'taxableValue',
      title: 'Total Taxable Value',
      getValue: d => parseFloat(d?.cdnr?.totalTaxableAmount) || 0,
      format: 'currency',
    },
    {
      key: 'cess',
      title: 'Total Cess',
      getValue: d => parseFloat(d?.cdnr?.totalCessAmount) || 0,
      format: 'currency',
    },
  ],
  CDNUR: [
    {
      key: 'notes',
      title: 'Number of Notes',
      getValue: d => d?.cdnur?.notes?.length ?? 0,
      format: 'number',
    },
    {
      key: 'noteValue',
      title: 'Total Note Value',
      getValue: d => parseFloat(d?.cdnur?.totalNoteAmount) || 0,
      format: 'currency',
    },
    {
      key: 'taxableValue',
      title: 'Total Taxable Value',
      getValue: d => parseFloat(d?.cdnur?.totalTaxableAmount) || 0,
      format: 'currency',
    },
    {
      key: 'cess',
      title: 'Total Cess',
      getValue: d => parseFloat(d?.cdnur?.totalCessAmount) || 0,
      format: 'currency',
    },
  ],
  EXEMP: [
    {
      key: 'nilRated',
      title: 'Total Nil Rated Supplies',
      getValue: d => parseFloat(d?.exempt?.total_nil_rated_supply) || 0,
      format: 'currency',
    },
    {
      key: 'exempted',
      title: 'Total Exempted Supplies',
      getValue: d => parseFloat(d?.exempt?.total_exempt) || 0,
      format: 'currency',
    },
    {
      key: 'nonGst',
      title: 'Total Non-GST Supplies',
      getValue: d => parseFloat(d?.exempt?.total_non_gst) || 0,
      format: 'currency',
    },
  ],
  HSN_B2B: [
    {
      key: 'hsnCount',
      title: 'No. of HSN',
      getValue: d => d?.hsn_b2b?.noOfHsn ?? 0,
      format: 'number',
    },
    {
      key: 'totalValue',
      title: 'Total Value',
      getValue: d => parseFloat(d?.hsn_b2b?.totalValue) || 0,
      format: 'currency',
    },
    {
      key: 'taxableValue',
      title: 'Total Taxable Value',
      getValue: d => parseFloat(d?.hsn_b2b?.totalTaxableValue) || 0,
      format: 'currency',
    },
    {
      key: 'igst',
      title: 'Total Integrated Tax (IGST)',
      getValue: d => parseFloat(d?.hsn_b2b?.totalIntegratedTax) || 0,
      format: 'currency',
    },
    {
      key: 'cgst',
      title: 'Total Central Tax (CGST)',
      getValue: d => parseFloat(d?.hsn_b2b?.totalCentralTax) || 0,
      format: 'currency',
    },
    {
      key: 'sgst',
      title: 'Total State/UT Tax (SGST/UTGST)',
      getValue: d => parseFloat(d?.hsn_b2b?.totalStateUtTax) || 0,
      format: 'currency',
    },
    {
      key: 'cess',
      title: 'Total Cess',
      getValue: d => parseFloat(d?.hsn_b2b?.totalCess) || 0,
      format: 'currency',
    },
  ],
  HSN_B2C: [
    {
      key: 'hsnCount',
      title: 'No. of HSN',
      getValue: d => d?.hsn_b2c?.noOfHsn ?? 0,
      format: 'number',
    },
    {
      key: 'totalValue',
      title: 'Total Value',
      getValue: d => parseFloat(d?.hsn_b2c?.totalValue) || 0,
      format: 'currency',
    },
    {
      key: 'taxableValue',
      title: 'Total Taxable Value',
      getValue: d => parseFloat(d?.hsn_b2c?.totalTaxableValue) || 0,
      format: 'currency',
    },
    {
      key: 'igst',
      title: 'Total Integrated Tax (IGST)',
      getValue: d => parseFloat(d?.hsn_b2c?.totalIntegratedTax) || 0,
      format: 'currency',
    },
    {
      key: 'cgst',
      title: 'Total Central Tax (CGST)',
      getValue: d => parseFloat(d?.hsn_b2c?.totalCentralTax) || 0,
      format: 'currency',
    },
    {
      key: 'sgst',
      title: 'Total State/UT Tax (SGST/UTGST)',
      getValue: d => parseFloat(d?.hsn_b2c?.totalStateUtTax) || 0,
      format: 'currency',
    },
    {
      key: 'cess',
      title: 'Total Cess',
      getValue: d => parseFloat(d?.hsn_b2c?.totalCess) || 0,
      format: 'currency',
    },
  ],
  DOCUMENTS_ISSUED: [
    {
      key: 'totalNumber',
      title: 'Total Number',
      getValue: d => parseFloat(d?.docs?.totalDocuments) || 0,
      format: 'number',
    },
    {
      key: 'totalCancelled',
      title: 'Total Cancelled',
      getValue: d => parseFloat(d?.docs?.totalCancelled) || 0,
      format: 'number',
    },
  ],
};

const ACTIVE_TAB_DEFAULT = 'B2B';
const PRIMARY_COLOR = colorPalette.primary[500];
const GSTR1_FILTER_KEY = 'gstr1_report_filter';

const getInvoiceSectionTotals = invoices => {
  let taxable = 0,
    invoice = 0,
    cess = 0,
    igst = 0,
    cgst = 0,
    sgst = 0;
  (invoices || []).forEach(inv => {
    invoice += parseFloat(inv.invoiceAmount) || 0;
    (inv.lineItems || []).forEach(li => {
      const t = li.itemTax || {};
      taxable += parseFloat(t.taxableAmount) || 0;
      cess += parseFloat(t.cess) || 0;
      igst += parseFloat(t.igst?.taxValue) || 0;
      cgst += parseFloat(t.cgst?.taxValue) || 0;
      sgst += parseFloat(t.sgst?.taxValue) || 0;
    });
  });
  return {
    taxableAmount: taxable,
    invoiceAmount: invoice,
    cess,
    igstAmount: igst,
    sgstCgstAmount: cgst + sgst,
    taxAmount: igst + cgst + sgst,
  };
};

const getNoteSectionTotals = (notes, totalNoteAmount = 0) => {
  let taxable = 0,
    cess = 0,
    igst = 0,
    cgst = 0,
    sgst = 0;
  (notes || []).forEach(note => {
    (note.lineItems || []).forEach(li => {
      const t = li.itemTax || {};
      taxable += parseFloat(t.taxableAmount) || 0;
      cess += parseFloat(t.cess) || 0;
      igst += parseFloat(t.igst?.taxValue) || 0;
      cgst += parseFloat(t.cgst?.taxValue) || 0;
      sgst += parseFloat(t.sgst?.taxValue) || 0;
    });
  });
  const noteAmt = typeof totalNoteAmount === 'number' ? totalNoteAmount : parseFloat(totalNoteAmount) || 0;
  const sign = noteAmt < 0 ? -1 : 1;
  return {
    taxableAmount: sign * taxable,
    invoiceAmount: noteAmt,
    cess: sign * cess,
    igstAmount: sign * igst,
    sgstCgstAmount: sign * (cgst + sgst),
    taxAmount: sign * (igst + cgst + sgst),
  };
};

const getPdfSummaryFromGstr1Data = data => {
  if (!data)
    return {
      rows: {},
      totals: {
        taxableAmount: 0,
        invoiceAmount: 0,
        cessAmount: 0,
        igstAmount: 0,
        sgstCgstAmount: 0,
        taxAmount: 0,
      },
    };
  const b2b = getInvoiceSectionTotals(data.b2b?.invoices ?? []);
  const b2cl = getInvoiceSectionTotals(data.b2cl?.invoices ?? []);
  const b2cs = getInvoiceSectionTotals(data.b2cs?.invoices ?? []);
  const cdnr = getNoteSectionTotals(data.cdnr?.notes ?? [], data.cdnr?.totalNoteAmount);
  const cdnur = getNoteSectionTotals(data.cdnur?.notes ?? [], data.cdnur?.totalNoteAmount);
  const nilRated = (parseFloat(data.exempt?.total_nil_rated_supply) || 0) + (parseFloat(data.exempt?.total_exempt) || 0) + (parseFloat(data.exempt?.total_non_gst) || 0);
  const hsnB2b = data.hsn_b2b || {};
  const hsnB2c = data.hsn_b2c || {};
  const hsn = {
    taxableAmount: (parseFloat(hsnB2b.totalTaxableValue) || 0) + (parseFloat(hsnB2c.totalTaxableValue) || 0),
    invoiceAmount: (parseFloat(hsnB2b.totalValue) || 0) + (parseFloat(hsnB2c.totalValue) || 0),
    cessAmount: (parseFloat(hsnB2b.totalCess) || 0) + (parseFloat(hsnB2c.totalCess) || 0),
    igstAmount: (parseFloat(hsnB2b.totalIntegratedTax) || 0) + (parseFloat(hsnB2c.totalIntegratedTax) || 0),
    sgstCgstAmount: (parseFloat(hsnB2b.totalCentralTax) || 0) + (parseFloat(hsnB2b.totalStateUtTax) || 0) + (parseFloat(hsnB2c.totalCentralTax) || 0) + (parseFloat(hsnB2c.totalStateUtTax) || 0),
    taxAmount:
      (parseFloat(hsnB2b.totalIntegratedTax) || 0) +
      (parseFloat(hsnB2b.totalCentralTax) || 0) +
      (parseFloat(hsnB2b.totalStateUtTax) || 0) +
      (parseFloat(hsnB2c.totalIntegratedTax) || 0) +
      (parseFloat(hsnB2c.totalCentralTax) || 0) +
      (parseFloat(hsnB2c.totalStateUtTax) || 0),
  };
  const totals = {
    taxableAmount: b2b.taxableAmount + b2cl.taxableAmount + b2cs.taxableAmount + cdnr.taxableAmount + cdnur.taxableAmount + nilRated + hsn.taxableAmount,
    invoiceAmount: b2b.invoiceAmount + b2cl.invoiceAmount + b2cs.invoiceAmount + cdnr.invoiceAmount + cdnur.invoiceAmount + nilRated + hsn.invoiceAmount,
    cessAmount: b2b.cess + b2cl.cess + b2cs.cess + cdnr.cess + cdnur.cess + hsn.cessAmount,
    igstAmount: b2b.igstAmount + b2cl.igstAmount + b2cs.igstAmount + cdnr.igstAmount + cdnur.igstAmount + hsn.igstAmount,
    sgstCgstAmount: b2b.sgstCgstAmount + b2cl.sgstCgstAmount + b2cs.sgstCgstAmount + cdnr.sgstCgstAmount + cdnur.sgstCgstAmount + hsn.sgstCgstAmount,
    taxAmount: b2b.taxAmount + b2cl.taxAmount + b2cs.taxAmount + cdnr.taxAmount + cdnur.taxAmount + hsn.taxAmount,
  };
  return {
    rows: {
      B2B: b2b,
      B2CL: b2cl,
      B2CS: b2cs,
      CDNR: cdnr,
      CDNUR: cdnur,
      NilRated: {
        taxableAmount: nilRated,
        invoiceAmount: nilRated,
        cess: 0,
        igstAmount: 0,
        sgstCgstAmount: 0,
        taxAmount: 0,
      },
      HSN: hsn,
    },
    totals,
  };
};

const ViewGstr1Report = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { gstr1Data, loading, error, fetchGstr1, clearGstr1 } = useGstr1();
  const { profile, getProfile } = useProfile();

  const [showFilter, setShowFilter] = useState(true);
  const [activeTab, setActiveTab] = useState(ACTIVE_TAB_DEFAULT);
  const [page, setPage] = useState(1);
  const pageSizeRef = useRef(DEFAULT_PAGE_SIZE);
  const [pageSizeVersion, setPageSizeVersion] = useState(0);

  const finYearRange = getCurrentFinancialYearRange();
  const defaultStart = finYearRange?.startDate;
  const defaultEnd = finYearRange?.endDate;

  const { selectedPreset, setSelectedPreset, dateRange, setDateRange, handleFilter } = useFilters({
    searchParams,
    setSearchParams,
    pagination: { limit: DEFAULT_PAGE_SIZE },
    FILTER_KEY: GSTR1_FILTER_KEY,
    setShowFilter,
    defaultFilter: { search: '', status: '', division: '', branch: '' },
    dateKeys: { startDate: 'startDate', endDate: 'endDate', singleDate: 'startDate' },
    isSplitSessionActive: false,
    isSplitWise: false,
  });

  const fetchRef = useRef(fetchGstr1);
  const clearRef = useRef(clearGstr1);
  const defaultDatesSetRef = useRef(false);

  useEffect(() => {
    fetchRef.current = fetchGstr1;
    clearRef.current = clearGstr1;
  }, [fetchGstr1, clearGstr1]);

  useEffect(() => {
    if (defaultDatesSetRef.current) return;
    if (!searchParams.get('startDate') || !searchParams.get('endDate')) {
      defaultDatesSetRef.current = true;
      setDateRange([defaultStart, defaultEnd]);
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.set('startDate', defaultStart);
        next.set('endDate', defaultEnd);
        next.set('preset', 'custom');
        return next;
      });
    }
  }, [defaultStart, defaultEnd, searchParams, setDateRange, setSearchParams]);

  useEffect(() => {
    const controller = new AbortController();
    const start = searchParams.get('startDate') || defaultStart;
    const end = searchParams.get('endDate') || defaultEnd;
    if (!start || !end) {
      return () => controller.abort();
    }
    fetchRef.current({ startDate: start, endDate: end, signal: controller.signal });
    return () => controller.abort();
  }, [searchParams.toString(), defaultStart, defaultEnd]);

  useEffect(() => {
    return () => clearRef.current();
  }, []);

  const currentTableData = useMemo(() => getSectionTableData(activeTab, gstr1Data), [activeTab, gstr1Data]);
  const sectionColumns = GSTR1_SECTION_COLUMNS[activeTab] ?? [];

  const pageBoundaries = useMemo(() => getPageBoundaries(currentTableData, pageSizeRef.current), [currentTableData, pageSizeVersion]);

  const paginatedData = useMemo(() => {
    if (!Array.isArray(currentTableData) || !pageBoundaries.length) return currentTableData;
    if (currentTableData.length <= pageSizeRef.current) return currentTableData;
    const bounds = pageBoundaries[page - 1];
    if (!bounds) return [];
    return currentTableData.slice(bounds.start, bounds.end);
  }, [currentTableData, page, pageBoundaries]);

  const handlePaginationChange = (newPage, newPageSize) => {
    if (newPageSize !== pageSizeRef.current) {
      pageSizeRef.current = newPageSize;
      setPageSizeVersion(v => v + 1);
    }
    setPage(newPage);
  };

  useEffect(() => {
    setPage(1);
  }, [activeTab, currentTableData.length]);

  const taxpayerDetails = gstr1Data?.taxpayerDetails;
  const returnPeriodDetails = gstr1Data?.returnPeriodDetails;
  const turnoverSummary = gstr1Data?.turnoverSummary;
  const hasSummary = taxpayerDetails || returnPeriodDetails || turnoverSummary;

  const summaryBoxesForTab = useMemo(() => SECTION_SUMMARY_CONFIG[activeTab] ?? [], [activeTab]);
  const showSectionSummary = gstr1Data != null && summaryBoxesForTab.length > 0;

  const tabItems = useMemo(
    () =>
      TAB_LIST.map(({ key, label }) => ({
        key,
        label: (
          <Tooltip key={key} title={TAB_TOOLTIPS[key] || ''} placement="top">
            <span>{label}</span>
          </Tooltip>
        ),
        children: null,
      })),
    []
  );

  const formatDateForPdf = dateStr => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[date.getMonth()];
      const year = String(date.getFullYear()).slice(-2);
      return `${day}-${month}-${year}`;
    } catch {
      return String(dateStr);
    }
  };

  const formatNumberForPdf = num => {
    if (num === null || num === undefined || Number.isNaN(Number(num))) return '';
    const value = parseFloat(num) || 0;
    if (value === 0) return '';
    return value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatAddress = addr => {
    if (!addr || typeof addr !== 'object') return 'Address not available';
    const lines = [];
    if (addr.street1) lines.push(addr.street1);
    if (addr.street2) lines.push(addr.street2);
    if (addr.city) lines.push(addr.city);
    if (addr.state || addr.pinCode) {
      const line = [addr.state, addr.pinCode ? ` - ${addr.pinCode}` : ''].filter(Boolean).join('');
      if (line) lines.push(line);
    }
    return lines.length > 0 ? lines.join('<br/>') : 'Address not available';
  };

  const generatePdfHtml = () => {
    const rd = gstr1Data?.returnPeriodDetails;
    const fromDate = dateRange?.[0] || rd?.periodStart;
    const toDate = dateRange?.[1] || rd?.periodEnd;
    const periodText = fromDate && toDate ? `${formatDateForPdf(fromDate)} to ${formatDateForPdf(toDate)}` : rd?.displayRange || 'N/A';
    const summary = getPdfSummaryFromGstr1Data(gstr1Data);
    const companyName = profile?.name || gstr1Data?.taxpayerDetails?.legalName || 'Company Name';
    const address = profile?.address || {};
    const gstin = gstr1Data?.taxpayerDetails?.gstin || 'N/A';
    // Tally-style: limit Particulars width so amount columns get proper space (percentages)
    const colWidths = {
      particulars: '19%',
      voucher: '8%',
      taxable: '12%',
      igst: '11%',
      cgst: '11%',
      sgst: '11%',
      cess: '6%',
      tax: '11%',
      invoice: '11%',
    };
    const numCellStyle =
      "text-align: right; font-family: 'Courier New', monospace; font-size: 11px; vertical-align: middle; white-space: nowrap; padding: 4px 5px; border-left: 1px solid #e0e0e0; line-height: 1.4;";

    const buildListRow = (label, data, isSubItem = false, isTotal = false) => {
      const indent = isSubItem ? 'padding-left: 14px;' : '';
      const fontWeight = isTotal ? 'font-weight: 700;' : 'font-weight: 500;';
      const rowPadding = isTotal ? '4px 5px' : '4px 5px';
      const fontSize = '11px';
      const borderStyle = isTotal ? 'border-top: 2px solid #000; border-bottom: 2px solid #000;' : 'border-bottom: 1px solid #e5e5e5;';
      const bgColor = isTotal ? 'background-color: #f5f5f5;' : '';
      const particularsStyle = `width: ${colWidths.particulars}; max-width: ${colWidths.particulars}; padding: ${rowPadding}; ${indent} ${fontWeight} font-size: ${fontSize}; text-align: left; vertical-align: middle; line-height: 1.4;`;

      if (!data) {
        return `
        <tr style="${borderStyle} ${bgColor}">
          <td style="${particularsStyle}">${label}</td>
          <td style="width: ${colWidths.voucher}; ${numCellStyle}"></td>
          <td style="width: ${colWidths.taxable}; ${numCellStyle}"></td>
          <td style="width: ${colWidths.igst}; ${numCellStyle}"></td>
          <td style="width: ${colWidths.cgst}; ${numCellStyle}"></td>
          <td style="width: ${colWidths.sgst}; ${numCellStyle}"></td>
          <td style="width: ${colWidths.cess}; ${numCellStyle}"></td>
          <td style="width: ${colWidths.tax}; ${numCellStyle}"></td>
          <td style="width: ${colWidths.invoice}; ${numCellStyle}"></td>
        </tr>`;
      }

      const showNum = v => (v != null && !Number.isNaN(Number(v)) && Number(v) !== 0 ? formatNumberForPdf(v) : '');
      const taxable = showNum(data.taxableAmount);
      const igst = showNum(data.igstAmount);
      const cgst = showNum(data.sgstCgstAmount / 2);
      const sgst = showNum(data.sgstCgstAmount / 2);
      const cess = showNum(data.cessAmount ?? data.cess);
      const tax = showNum(data.taxAmount);
      const invoice = showNum(data.invoiceAmount);

      return `
        <tr style="${borderStyle} ${bgColor}">
          <td style="${particularsStyle}">${label}</td>
          <td style="width: ${colWidths.voucher}; ${numCellStyle}"></td>
          <td style="width: ${colWidths.taxable}; ${numCellStyle}">${taxable}</td>
          <td style="width: ${colWidths.igst}; ${numCellStyle}">${igst}</td>
          <td style="width: ${colWidths.cgst}; ${numCellStyle}">${cgst}</td>
          <td style="width: ${colWidths.sgst}; ${numCellStyle}">${sgst}</td>
          <td style="width: ${colWidths.cess}; ${numCellStyle}">${cess}</td>
          <td style="width: ${colWidths.tax}; ${numCellStyle}">${tax}</td>
          <td style="width: ${colWidths.invoice}; ${numCellStyle}">${invoice}</td>
        </tr>`;
    };

    const { rows, totals } = summary;
    const listRows = [
      buildListRow('B2B', rows.B2B),
      buildListRow('Taxable Sales', rows.B2B, true),
      buildListRow('Reverse Charge Supplies'),
      buildListRow('B2CL', rows.B2CL),
      buildListRow('Exports - 6A'),
      buildListRow('CDNR - 9B', rows.CDNR),
      buildListRow('CDNUR - 9B', rows.CDNUR),
      buildListRow('Amended B2B - 9A'),
      buildListRow('Amended B2CL - 9A'),
      buildListRow('Amended Exports - 9A'),
      buildListRow('Amended CDNR - 9C'),
      buildListRow('Amended CDNUR - 9C'),
      buildListRow('B2CS', rows.B2CS),
      buildListRow('Nil Rated - 8', rows.NilRated),
      buildListRow('Amendment B2CS - 10'),
      buildListRow('Tax Liability (Advances) - 11A'),
      buildListRow('Adjustment of Advances - 11B'),
      buildListRow('Amended Tax Liability - 11A'),
      buildListRow('Amendment Adjusted Advances - 11B'),
      buildListRow('HSN Summary - 12', rows.HSN),
      buildListRow('Document Summary - 13'),
    ].join('');

    const totalRow = `
      <tr style="border-top: 2px solid #000; border-bottom: 2px solid #000; background-color: #f5f5f5;">
        <td style="width: ${colWidths.particulars}; padding: 4px 5px; font-weight: 700; font-size: 11px; text-align: left; vertical-align: middle; line-height: 1.4;">Total</td>
        <td style="width: ${colWidths.voucher}; ${numCellStyle} font-weight: 700; padding: 4px 5px;"></td>
        <td style="width: ${colWidths.taxable}; ${numCellStyle} font-weight: 700; padding: 4px 5px;">${formatNumberForPdf(totals.taxableAmount)}</td>
        <td style="width: ${colWidths.igst}; ${numCellStyle} font-weight: 700;">${formatNumberForPdf(totals.igstAmount)}</td>
        <td style="width: ${colWidths.cgst}; ${numCellStyle} font-weight: 700;">${formatNumberForPdf(totals.sgstCgstAmount / 2)}</td>
        <td style="width: ${colWidths.sgst}; ${numCellStyle} font-weight: 700;">${formatNumberForPdf(totals.sgstCgstAmount / 2)}</td>
        <td style="width: ${colWidths.cess}; ${numCellStyle} font-weight: 700;">${formatNumberForPdf(totals.cessAmount)}</td>
        <td style="width: ${colWidths.tax}; ${numCellStyle} font-weight: 700;">${formatNumberForPdf(totals.taxAmount)}</td>
        <td style="width: ${colWidths.invoice}; ${numCellStyle} font-weight: 700;">${formatNumberForPdf(totals.invoiceAmount)}</td>
      </tr>`;

    const thStyle = (w, align = 'right', hasLeftBorder = true) =>
      `width: ${w}; padding: 5px 8px; text-align: ${align}; font-size: 10px; font-weight: 700; ${hasLeftBorder ? 'border-left: 1px solid #ccc;' : ''} vertical-align: middle; line-height: 1.3;`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; padding: 0; font-family: Arial, sans-serif; font-size: 11px; color: #000; background: #fff; line-height: 1.4; }
          .gstr1-sheet { padding: 10px 12px 12px; page-break-inside: avoid; }
          .page-number { position: absolute; top: 10px; right: 12px; font-size: 10px; color: #555; }
          .header-block { margin-bottom: 8px; padding: 8px 0; text-align: left; }
          .company-name { font-size: 17px; font-weight: 700; margin: 0 0 6px 0; line-height: 1.3; }
          .address { font-size: 11px; margin: 0; line-height: 1.5; color: #333; max-width: 90%; }
          .title-row { margin: 8px 0 6px; text-align: center; }
          .gstr-title { font-size: 15px; font-weight: 700; margin: 0; }
          .period { font-size: 11px; margin: 4px 0 0; color: #333; }
          .gst-activity { text-align: right; margin: 6px 0 4px; font-size: 11px; }
          .gst-info { margin: 4px 0 8px; font-size: 11px; }
          .gst-info p { margin: 0; line-height: 1.5; }
          .summary-box { border: 1px solid #000; margin-bottom: 8px; }
          .summary-header { border-bottom: 1px solid #000; background-color: #e8e8e8; padding: 5px 8px; font-size: 11px; font-weight: 700; display: flex; justify-content: space-between; }
          .summary-item { display: flex; justify-content: space-between; padding: 4px 8px; font-size: 11px; border-bottom: 1px solid #e5e5e5; line-height: 1.4; }
          .summary-item:last-child { border-bottom: none; }
          .return-view-title { font-size: 12px; font-weight: 700; margin: 0 0 4px 0; }
          table { border-collapse: collapse; table-layout: fixed; width: 100%; font-size: 11px; }
          th, td { overflow: hidden; word-wrap: break-word; }
          thead th { background-color: #e8e8e8; padding: 5px 8px; font-size: 10px; line-height: 1.3; }
        </style>
      </head>
      <body>
        <div class="gstr1-sheet">
          <div class="page-number">Page 1</div>
          <div class="header-block">
            <div class="company-name">${companyName}</div>
            <div class="address">${formatAddress(address)}</div>
          </div>
          <div class="title-row">
            <div class="gstr-title">GSTR-1</div>
            <div class="period">${periodText}</div>
          </div>
          <div class="gst-activity">Last online GST activity: <strong>${profile?.lastActivity ? formatDateForPdf(profile.lastActivity) : 'No Activity Found'}</strong></div>
          <div class="gst-info">
            <p>GST Registration: <strong>${gstin}</strong> &nbsp; Status: <strong>Active</strong> &nbsp; ARN: <strong>${profile?.arn || ''}</strong> &nbsp; ARN Date: <strong>${profile?.arnDate ? formatDateForPdf(profile.arnDate) : ''}</strong></p>
          </div>
          <div class="summary-box">
            <div class="summary-header">
              <span>Particulars</span>
              <span>Voucher Count</span>
            </div>
            <div class="summary-item"><span>Total Vouchers</span><span style="font-weight: 600;">0</span></div>
            <div class="summary-item"><span>Included in Return</span><span style="font-weight: 600;">0</span></div>
            <div class="summary-item"><span>No Action Required</span><span style="font-weight: 600;">0</span></div>
            <div class="summary-item"><span>Not Relevant for This Return</span><span style="font-weight: 600;">0</span></div>
            <div class="summary-item"><span>Uncertain Transactions (Corrections needed)</span><span style="font-weight: 600;">0</span></div>
          </div>
          <div class="return-view-title">Return View</div>
          <table>
            <thead>
              <tr style="border-top: 1.5px solid #000; border-bottom: 1.5px solid #000;">
                <th style="${thStyle(colWidths.particulars, 'left', false)}">Particulars</th>
                <th style="${thStyle(colWidths.voucher)}">Vch Count<br/>(Summary)</th>
                <th style="${thStyle(colWidths.taxable)}">Taxable<br/>Amount</th>
                <th style="${thStyle(colWidths.igst)}">IGST<br/>Amount</th>
                <th style="${thStyle(colWidths.cgst)}">CGST<br/>Amount</th>
                <th style="${thStyle(colWidths.sgst)}">SGST/<br/>UTGST</th>
                <th style="${thStyle(colWidths.cess)}">Cess<br/>Amount</th>
                <th style="${thStyle(colWidths.tax)}">Tax<br/>Amount</th>
                <th style="${thStyle(colWidths.invoice)}">Invoice<br/>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${listRows}
              ${totalRow}
            </tbody>
          </table>
        </div>
      </body>
      </html>`;
  };

  const downloadPdf = async () => {
    if (!gstr1Data?.taxpayerDetails) return;
    try {
      await getProfile({});
      const html = generatePdfHtml();
      const opt = {
        margin: [5, 5, 5, 5],
        filename: 'gstr1.pdf',
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: {
          scale: 1.5,
          useCORS: true,
          backgroundColor: '#ffffff',
          windowWidth: 794,
          windowHeight: 1123,
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'], avoid: ['.gstr1-sheet', 'table', 'tr'] },
      };
      const html2pdf = (await import('html2pdf.js')).default;
      await html2pdf().set(opt).from(html).save();
    } catch (err) {
      console.error('Error generating GSTR-1 PDF:', err);
    }
  };

  const exportMenuItems = [
    {
      key: 'pdf',
      label: 'Download PDF',
      icon: <Icons.FileTextOutlined />,
      onClick: () => downloadPdf(),
    },
  ];

  return (
    <div className="-m-4">
      <div className="flex justify-between items-center container-spacing sticky-page-header bg-white border-b border-gray-200">
        <div className="flex items-center gap-3">
          <CustomButton type="default" text={<Icons.ArrowLeftOutlined />} onClick={() => navigate('/reports')} />
          <p className="font-bold text-2xl">GSTR-1 Report</p>
        </div>
        <div className="flex items-center gap-2">
          {gstr1Data?.taxpayerDetails && (
            <Dropdown
              menu={{
                items: exportMenuItems.map(({ key, label, icon }) => ({ key, label, icon })),
                onClick: ({ key }) => key === 'pdf' && downloadPdf(),
              }}
              trigger={['click']}
            >
              <Button type="primary" icon={<Icons.DownloadOutlined />}>
                <Space>Export Report</Space>
              </Button>
            </Dropdown>
          )}
          <Button onClick={() => setShowFilter(!showFilter)}>{showFilter ? 'Hide Filters' : 'View Filters'}</Button>
        </div>
      </div>

      {showFilter && (
        <div className="bg-white border-b border-gray-200">
          <div className="container-spacing py-4">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end">
              <div className="space-y-2">
                <CustomDatePicker selectedPreset={selectedPreset} setSelectedPreset={setSelectedPreset} dateRange={dateRange} setDateRange={setDateRange} />
              </div>
              <div className="flex-grow" />
              <Button type="primary" icon={<Icons.FilterOutlined />} size="middle" className="p-[17px]" onClick={handleFilter}>
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="container-spacing">
          <Alert message="Error" description={error} type="error" showIcon closable />
        </div>
      )}

      <div className="container-spacing space-y-3">
        <Collapse
          defaultActiveKey={[]}
          ghost
          expandIconPosition="end"
          className="custom-collapse shadow-sm"
          expandIcon={({ isActive }) => (
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 hover:opacity-90"
              style={{
                background: colorPalette.primary[100],
              }}
            >
              <RightOutlined className={`text-sm transition-transform duration-200 ${isActive ? 'rotate-90' : ''}`} style={{ color: colorPalette.primary[600] }} />
            </div>
          )}
          items={[
            {
              key: 'gstr1-summary',
              label: (
                <span className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <FileTextOutlined style={{ color: colorPalette.primary[500] }} />
                  GSTR-1 Summary
                </span>
              ),
              children: hasSummary ? (
                <Row gutter={[24, 24]}>
                  {taxpayerDetails && (
                    <Col xs={24} md={8}>
                      <div className="h-full border border-gray-200 rounded-lg p-4 bg-gray-50/50">
                        <p className="text-sm text-gray-600 mb-2 font-medium">Taxpayer Details</p>
                        <p className="text-sm mb-1">
                          <span className="text-gray-600">GSTIN: </span>
                          <span className="font-semibold">{taxpayerDetails.gstin || '–'}</span>
                        </p>
                        <p className="text-sm mb-1">
                          <span className="text-gray-600">Legal Name: </span>
                          <span className="font-semibold">{taxpayerDetails.legalName || '–'}</span>
                        </p>
                        <p className="text-sm mb-0">
                          <span className="text-gray-600">Trade Name: </span>
                          <span className="font-semibold">{taxpayerDetails.tradeName || '–'}</span>
                        </p>
                      </div>
                    </Col>
                  )}
                  {returnPeriodDetails && (
                    <Col xs={24} md={8}>
                      <div className="h-full border border-gray-200 rounded-lg p-4 bg-gray-50/50">
                        <p className="text-sm text-gray-600 mb-2 font-medium">Return Period</p>
                        <p className="text-sm mb-1">
                          <span className="text-gray-600">Period Label: </span>
                          <span className="font-semibold">{returnPeriodDetails.label || '–'}</span>
                        </p>
                        <p className="text-sm mb-0">
                          <span className="text-gray-600">Display Range: </span>
                          <span className="font-semibold">{returnPeriodDetails.displayRange || '–'}</span>
                        </p>
                      </div>
                    </Col>
                  )}
                  {turnoverSummary && (
                    <Col xs={24} md={8}>
                      <div className="h-full border border-gray-200 rounded-lg p-4 bg-gray-50/50">
                        <p className="text-sm text-gray-600 mb-2 font-medium">Turnover Summary</p>
                        <p className="text-sm mb-1">
                          <span className="text-gray-600">Previous Year Turnover: </span>
                          <span className="font-semibold">{formatAmount(turnoverSummary.previousYearTurnover ?? 0)}</span>
                        </p>
                        <p className="text-sm mb-1">
                          <span className="text-gray-600">First Quarter Turnover: </span>
                          <span className="font-semibold">{formatAmount(turnoverSummary.firstQuarterTurnover ?? 0)}</span>
                        </p>
                        <p className="text-sm mb-0">
                          <span className="text-gray-600">Is First Return: </span>
                          <span className="font-semibold">{turnoverSummary.isFirstReturn ? 'Yes' : 'No'}</span>
                        </p>
                      </div>
                    </Col>
                  )}
                </Row>
              ) : (
                <p className="text-gray-500 py-4 mb-0">No summary data available</p>
              ),
            },
          ]}
        />

        <div className="gstr1-tabs-wrapper overflow-x-auto">
          <style>{`
            .gstr1-tabs-wrapper.ant-tabs .ant-tabs-nav { margin-bottom: 0; }
            .gstr1-tabs-wrapper.ant-tabs .ant-tabs-nav-operations { display: none !important; }
            .gstr1-tabs-wrapper.ant-tabs .ant-tabs-tab { padding: 4px 0; margin: 0 0 0 16px; }
            .gstr1-tabs-wrapper.ant-tabs .ant-tabs-tab:first-of-type { margin-left: 0; }
            .gstr1-tabs-wrapper.ant-tabs .ant-tabs-tab .ant-tabs-tab-btn { color: #8c8c8c; font-size: 14px; }
            .gstr1-tabs-wrapper.ant-tabs .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn { color: ${PRIMARY_COLOR}; font-weight: 500; }
            .gstr1-tabs-wrapper.ant-tabs .ant-tabs-ink-bar { background: ${PRIMARY_COLOR}; height: 2px; }
            .gstr1-section-table .ant-table-thead th.gstr1-group-header-center > div {
              justify-content: center;
            }
          `}</style>
          <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} style={{ marginBottom: 0 }} className="gstr1-tabs-wrapper" />
        </div>

        {showSectionSummary && (
          <div className="flex flex-wrap gap-2 mt-2">
            {summaryBoxesForTab.map(({ key, title, getValue, format }) => {
              const value = getValue(gstr1Data);
              const displayValue = format === 'currency' ? formatAmount(value) : value;
              return (
                <div key={key} className="flex items-center gap-1 bg-white border border-gray-200 rounded-[4px] shadow-sm px-4 py-3">
                  <div className="text-sm text-gray-500 truncate">{title}</div>
                  <div className="text-base font-semibold text-gray-900 leading-tight">{displayValue}</div>
                </div>
              );
            })}
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded p-3 mt-2 gstr1-section-table">
          {sectionColumns.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No table for this section.</div>
          ) : (
            <CustomTable
              columns={sectionColumns}
              data={currentTableData.length > pageSizeRef.current ? paginatedData : currentTableData}
              loading={loading}
              bordered
              pagination={
                currentTableData.length > pageSizeRef.current
                  ? {
                      current: page,
                      pageSize: pageSizeRef.current,
                      total: currentTableData.length,
                      onChange: handlePaginationChange,
                      showSizeChanger: true,
                      pageSizeOptions: TABLE_PAGE_SIZE_OPTIONS.map(String),
                    }
                  : false
              }
              scroll={{ x: 'max-content' }}
              isPaginationFixed={false}
            />
          )}
        </div>

        {loading && !gstr1Data?.taxpayerDetails && <div className="text-center py-8 text-gray-500">Loading GSTR-1 data...</div>}
      </div>
    </div>
  );
};

export default ViewGstr1Report;
