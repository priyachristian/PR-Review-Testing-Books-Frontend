import { Document, Image, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

import abssBrandingLogo from '@/assets/images/ABSS-LOGO.png';
import { MONTHS_ENUM } from 'utils/constants';
import { dateFormateForUi } from 'utils/services';
import { formatAmount } from '@/utils/currency';
import { resolveProfile } from 'utils/pdfUtils';

const DETAIL_RECORDS_FIRST_PAGE = 35;
const DETAIL_RECORDS_PER_PAGE = 40;
const MONTHLY_RECORDS_PER_PAGE = 25;

const BORDER = '#D1D5DB';
const BORDER_DARK = '#9CA3AF';
const LABEL_CLR = '#4B5563';
const TEXT_CLR = '#111827';
const ROW_ALT = '#F3F4F6';
const WHITE = '#FFFFFF';

const PAGE_PAD = 28;
const FOOTER_H = 44;
const BORDER_INSET = 6;
const BOTTOM_RESERVE = FOOTER_H + BORDER_INSET;

const SPECIAL_ROWS = ['Brought Forward', 'Carried Over', 'Total'];

const formatAmountCellPdfLines = (val, isAbs = false, maxChars = 14) => {
  const str = val == null || val === '' ? '' : formatAmount(isAbs ? Math.abs(val) : val, false);
  if (!str || str.length <= maxChars) return str;
  const i = str.indexOf(',', Math.floor(str.length / 2));
  return i > -1 ? `${str.slice(0, i + 1)}\n${str.slice(i + 1)}` : str;
};

const S = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: TEXT_CLR,
    backgroundColor: WHITE,
    paddingTop: PAGE_PAD,
    paddingLeft: PAGE_PAD,
    paddingRight: PAGE_PAD,
    paddingBottom: PAGE_PAD + FOOTER_H,
  },
  pageContent: { flexDirection: 'column' },
  outerBorder: {
    position: 'absolute',
    top: PAGE_PAD - BORDER_INSET,
    left: PAGE_PAD - BORDER_INSET,
    right: PAGE_PAD - BORDER_INSET,
    bottom: BOTTOM_RESERVE,
    borderWidth: 0.75,
    borderColor: BORDER_DARK,
    borderStyle: 'solid',
  },
  reportTitleBlock: {
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 0.75,
    borderBottomColor: BORDER_DARK,
  },
  reportTitleMain: { fontSize: 12, fontWeight: 'bold', textAlign: 'center', marginBottom: 4 },
  reportDateRange: { fontSize: 9, textAlign: 'center', color: LABEL_CLR },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 0.75,
    borderBottomColor: BORDER_DARK,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    paddingRight: 8,
  },
  headerLeftText: {
    flex: 1,
    minWidth: 0,
    maxWidth: '100%',
  },
  companyLogo: { height: 36, width: 76, objectFit: 'contain', marginRight: 8, flexShrink: 0 },
  companyName: { fontSize: 11, fontWeight: 'bold', marginBottom: 3 },
  addrLine: { fontSize: 8, color: LABEL_CLR, marginBottom: 2, lineHeight: 1.35 },
  metaLine: { fontSize: 8, color: LABEL_CLR, marginBottom: 2 },
  tableOuter: { flexDirection: 'column', marginTop: 4 },
  tableWrap: { flexDirection: 'column', borderWidth: 0.75, borderColor: BORDER_DARK },
  tableBody: { flexDirection: 'column' },
  dataRowsBlock: { flexDirection: 'column' },
  emptyRow: { minHeight: 14 },
  totalsBlock: { paddingTop: 2, backgroundColor: WHITE },
  thead: { flexDirection: 'row', backgroundColor: ROW_ALT, borderBottomWidth: 0.75, borderBottomColor: BORDER_DARK },
  th: { fontSize: 8, fontWeight: 'bold', paddingHorizontal: 4, paddingVertical: 5 },
  thRight: { fontSize: 8, fontWeight: 'bold', paddingHorizontal: 4, paddingVertical: 5, textAlign: 'right' },
  tr: { flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: BORDER },
  trAlt: { backgroundColor: ROW_ALT },
  td: { fontSize: 8.5, paddingHorizontal: 4, paddingVertical: 3 },
  tdRight: { fontSize: 8.5, paddingHorizontal: 4, paddingVertical: 3, textAlign: 'right' },
  tdBold: { fontWeight: 'bold' },
  colDate: { width: '11%', textAlign: 'center' },
  colPart: { width: '28%', textAlign: 'left' },
  colVchT: { width: '14%', textAlign: 'left' },
  colVchN: { width: '14%', textAlign: 'left' },
  colDr: { width: '12%', textAlign: 'right' },
  colCr: { width: '12%', textAlign: 'right' },
  colMonth: { width: '14%', textAlign: 'left' },
  colOrders: { width: '12%', textAlign: 'right' },
  colBasic: { width: '16%', textAlign: 'right' },
  colTotal: { width: '16%', textAlign: 'right' },
  colSplit: { width: '16%', textAlign: 'right' },
  colClosing: { width: '16%', textAlign: 'right' },
  totalTop: { borderTopWidth: 0.75, borderTopColor: TEXT_CLR, paddingTop: 2 },
  totalRow: { borderTopWidth: 0.75, borderTopColor: TEXT_CLR, backgroundColor: ROW_ALT },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexShrink: 0,
    backgroundColor: ROW_ALT,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomWidth: 0.75,
    borderBottomColor: BORDER_DARK,
  },
  summaryCol: { alignItems: 'flex-end', marginLeft: 14 },
  summaryLabel: { fontSize: 7.5, color: LABEL_CLR },
  summaryValue: { fontSize: 9, fontWeight: 'bold' },
  pageBottomBar: {
    position: 'absolute',
    left: PAGE_PAD,
    right: PAGE_PAD,
    bottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pagePagination: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pagePaginationText: { fontSize: 9, color: LABEL_CLR, textAlign: 'center' },
  poweredByRow: { flexDirection: 'row', alignItems: 'center' },
  poweredByText: { fontSize: 7.5, color: LABEL_CLR, marginRight: 4 },
  abssBrandingLogo: { width: 62, objectFit: 'contain' },
});

const isMonthlySummaryRecord = record => record?.month != null && record?.year != null && record?.totalFinal != null && !record?.billDate;

const isMonthlySummary = records => {
  const list = Array.isArray(records) ? records : [];
  if (!list.length) return false;
  return list.every(isMonthlySummaryRecord);
};

const getParticulars = record => record?.customerDisplayName || '';

const isSpecialRow = record => SPECIAL_ROWS.includes(getParticulars(record));

const getRecordAmount = record => Math.round(parseFloat(record?.total || 0));

const formatMonth = record => `${MONTHS_ENUM?.[record?.month]?.short || ''}-${record?.year || ''}`;

function buildDetailPages(records) {
  const recordList = Array.isArray(records) ? records.filter(r => !isSpecialRow(r)) : [];
  const len = recordList.length;
  const grandTotal = recordList.reduce((sum, r) => sum + getRecordAmount(r), 0);

  const pages = [];
  let i = 0;
  let currentPage = 1;

  while (i < Math.max(len, 1)) {
    const recordsPerPage = currentPage === 1 ? DETAIL_RECORDS_FIRST_PAGE : DETAIL_RECORDS_PER_PAGE;
    const prevPageRecords = recordList.slice(0, i);
    const pageRecords = recordList.slice(i, i + recordsPerPage);

    const prevTotal = prevPageRecords.reduce((sum, r) => sum + getRecordAmount(r), 0);
    const pageTotal = pageRecords.reduce((sum, r) => sum + getRecordAmount(r), 0);
    const cumulativeTotal = prevTotal + pageTotal;

    pages.push({ currentPage, totalPages: 0, pageRecords, recordsPerPage, prevTotal, cumulativeTotal, grandTotal });

    i += recordsPerPage;
    currentPage += 1;
  }

  const totalPages = pages.length;
  pages.forEach(p => {
    p.totalPages = totalPages;
  });

  return pages;
}

function buildMonthlyPages(records) {
  const recordList = Array.isArray(records) ? records : [];
  const pages = [];

  for (let i = 0; i < Math.max(recordList.length, 1); i += MONTHLY_RECORDS_PER_PAGE) {
    pages.push(recordList.slice(i, i + MONTHLY_RECORDS_PER_PAGE));
  }

  return pages;
}

function resolveReportDateRange(startDate, endDate) {
  if (startDate && endDate) {
    return `From ${dateFormateForUi(startDate)} To ${dateFormateForUi(endDate)}`;
  }
  return '';
}

const ReportTitleBanner = ({ title, startDate, endDate }) => {
  const range = resolveReportDateRange(startDate, endDate);

  return (
    <View style={S.reportTitleBlock} wrap={false}>
      <Text style={S.reportTitleMain}>{title}</Text>
      {range ? <Text style={S.reportDateRange}>{range}</Text> : null}
    </View>
  );
};

const CompanyHeader = ({ profile }) => {
  const company = resolveProfile(profile);
  const addressLine1 = [company?.address?.street1, company?.address?.street2, company?.address?.city].filter(Boolean).join(', ');
  const addressLine2 = [company?.address?.state, company?.address?.country].filter(Boolean).join(', ') + (company?.address?.pinCode ? ` - ${company.address.pinCode}` : '');

  return (
    <View wrap={false}>
      <View style={S.headerRow}>
        <View style={S.headerLeft}>
          {company?.companyLogo ? (
            <Image
              source={{
                uri: company.companyLogo,
                headers: { Pragma: 'no-cache', 'Cache-Control': 'no-cache' },
                method: 'GET',
                body: undefined,
              }}
              style={S.companyLogo}
            />
          ) : null}
          <View style={S.headerLeftText}>
            {company?.name ? <Text style={S.companyName}>{company.name}</Text> : null}
            {addressLine1 ? <Text style={S.addrLine}>{addressLine1}</Text> : null}
            {addressLine2 ? <Text style={S.addrLine}>{addressLine2}</Text> : null}
          </View>
        </View>
      </View>
    </View>
  );
};

const PageBottomBar = ({ currentPage, totalPages }) => (
  <>
    <View style={S.pageBottomBar} fixed>
      <View style={S.poweredByRow}>
        <Text style={S.poweredByText}>Powered by:</Text>
        <Image src={abssBrandingLogo} style={S.abssBrandingLogo} />
      </View>
    </View>
    <View style={S.pagePagination} fixed>
      <Text style={S.pagePaginationText} wrap={false}>
        {currentPage} / {totalPages}
      </Text>
    </View>
  </>
);

const DetailPurchaseTable = ({ pageData }) => {
  const { currentPage, totalPages, pageRecords, recordsPerPage, prevTotal, cumulativeTotal, grandTotal } = pageData;
  const isLastPage = currentPage === totalPages;

  return (
    <View style={S.tableOuter}>
      <View style={S.tableWrap}>
        {currentPage === 1 ? (
          <View style={S.summaryRow}>
            <View style={[S.summaryCol, { marginLeft: 0 }]}>
              <Text style={S.summaryLabel}>Total Purchases</Text>
              <Text style={S.summaryValue}>{grandTotal ? formatAmountCellPdfLines(grandTotal) : '0.00'}</Text>
            </View>
          </View>
        ) : null}

        <View style={S.thead}>
          <Text style={[S.th, S.colDate]}>Date</Text>
          <Text style={[S.th, S.colPart]}>Particulars</Text>
          <Text style={[S.th, S.colVchT]}>Vch Type</Text>
          <Text style={[S.th, S.colVchN]}>Vch No.</Text>
          <Text style={[S.thRight, S.colDr]}>Debit</Text>
          <Text style={[S.thRight, S.colCr]}>Credit</Text>
        </View>

        <View style={S.tableBody}>
          {currentPage > 1 ? (
            <View style={S.tr} wrap={false}>
              <Text style={[S.td, S.colDate]} />
              <Text style={[S.td, S.colPart, S.tdBold]}>Brought Forward</Text>
              <Text style={[S.td, S.colVchT]} />
              <Text style={[S.td, S.colVchN]} />
              <Text style={[S.tdRight, S.colDr]} />
              <Text style={[S.tdRight, S.colCr, S.tdBold]}>{prevTotal ? formatAmountCellPdfLines(prevTotal) : ''}</Text>
            </View>
          ) : null}

          <View style={S.dataRowsBlock}>
            {pageRecords.map((record, index) => {
              const date = dateFormateForUi(record?.billDate);
              const prevDate = index === 0 ? '' : dateFormateForUi(pageRecords[index - 1]?.billDate);
              const alt = index % 2 === 1;
              const amount = getRecordAmount(record);

              return (
                <View key={`${record?.billDate}-${record?.billId}-${index}`} style={[S.tr, alt && S.trAlt]} wrap={false}>
                  <Text style={[S.td, S.colDate]}>{date !== prevDate ? date : ''}</Text>
                  <Text style={[S.td, S.colPart]}>{getParticulars(record)}</Text>
                  <Text style={[S.td, S.colVchT]}>Bill</Text>
                  <Text style={[S.td, S.colVchN]}>{record?.billId || ''}</Text>
                  <Text style={[S.tdRight, S.colDr]} />
                  <Text style={[S.tdRight, S.colCr]}>{amount ? formatAmountCellPdfLines(amount) : ''}</Text>
                </View>
              );
            })}
            {!isLastPage
              ? Array.from({ length: Math.max(0, recordsPerPage - pageRecords.length) }).map((_, i) => (
                  <View key={`empty-${i}`} style={[S.tr, (pageRecords.length + i) % 2 === 1 && S.trAlt, S.emptyRow]}>
                    <Text style={[S.td, S.colDate]}> </Text>
                    <Text style={[S.td, S.colPart]}> </Text>
                    <Text style={[S.td, S.colVchT]}> </Text>
                    <Text style={[S.td, S.colVchN]}> </Text>
                    <Text style={[S.tdRight, S.colDr]}> </Text>
                    <Text style={[S.tdRight, S.colCr]}> </Text>
                  </View>
                ))
              : null}
          </View>

          {!isLastPage ? (
            <View style={S.totalsBlock}>
              <View style={S.tr} wrap={false}>
                <Text style={[S.td, S.colDate]} />
                <Text style={[S.td, S.colPart, S.tdBold]} wrap={false}>
                  Carried Over
                </Text>
                <Text style={[S.td, S.colVchT]} />
                <Text style={[S.td, S.colVchN]} />
                <Text style={[S.tdRight, S.colDr]} />
                <Text style={[S.tdRight, S.colCr, S.tdBold, S.totalTop]} wrap={false}>
                  {cumulativeTotal ? formatAmountCellPdfLines(cumulativeTotal) : ''}
                </Text>
              </View>
            </View>
          ) : null}

          {isLastPage ? (
            <View style={S.totalsBlock}>
              <View style={[S.tr, S.totalRow]} wrap={false}>
                <Text style={[S.td, S.colDate]} />
                <Text style={[S.td, S.colPart, S.tdBold]} wrap={false}>
                  Total
                </Text>
                <Text style={[S.td, S.colVchT]} />
                <Text style={[S.td, S.colVchN]} />
                <Text style={[S.tdRight, S.colDr]} />
                <Text style={[S.tdRight, S.colCr, S.tdBold, S.totalTop]} wrap={false}>
                  {grandTotal ? formatAmountCellPdfLines(grandTotal) : '0.00'}
                </Text>
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const MonthlySummaryTable = ({ pageRecords, isLastPage, showSplitColumn, totals }) => {
  const colMonth = showSplitColumn ? S.colMonth : { ...S.colMonth, width: '18%' };
  const colOrders = showSplitColumn ? S.colOrders : { ...S.colOrders, width: '14%' };
  const colBasic = showSplitColumn ? S.colBasic : { ...S.colBasic, width: '20%' };
  const colTotal = showSplitColumn ? S.colTotal : { ...S.colTotal, width: '20%' };
  const colClosing = showSplitColumn ? S.colClosing : { ...S.colClosing, width: '20%' };

  return (
    <View style={S.tableOuter}>
      <View style={S.tableWrap}>
        {isLastPage ? (
          <View style={S.summaryRow}>
            <View style={[S.summaryCol, { marginLeft: 0 }]}>
              <Text style={S.summaryLabel}>Total Purchases</Text>
              <Text style={S.summaryValue}>{totals.totalFinal ? formatAmountCellPdfLines(totals.totalFinal) : '0.00'}</Text>
            </View>
          </View>
        ) : null}

        <View style={S.thead}>
          <Text style={[S.th, colMonth]}>Month</Text>
          <Text style={[S.thRight, colOrders]}>Total Orders</Text>
          <Text style={[S.thRight, colBasic]}>Sub Total</Text>
          <Text style={[S.thRight, colTotal]}>Total Amount</Text>
          {showSplitColumn ? <Text style={[S.thRight, S.colSplit]}>Split Total Amount</Text> : null}
          <Text style={[S.thRight, colClosing]}>Closing Balance</Text>
        </View>

        <View style={S.tableBody}>
          {pageRecords.map((record, index) => {
            const alt = index % 2 === 1;
            return (
              <View key={`${record?.month}-${record?.year}-${index}`} style={[S.tr, alt && S.trAlt]} wrap={false}>
                <Text style={[S.td, colMonth]}>{formatMonth(record)}</Text>
                <Text style={[S.tdRight, colOrders]}>{record?.totalOrders ?? ''}</Text>
                <Text style={[S.tdRight, colBasic]}>{record?.totalSubTotal != null ? formatAmountCellPdfLines(record.totalSubTotal) : ''}</Text>
                <Text style={[S.tdRight, colTotal]}>{record?.totalFinal != null ? formatAmountCellPdfLines(record.totalFinal) : ''}</Text>
                {showSplitColumn ? <Text style={[S.tdRight, S.colSplit]}>{record?.splitPurchaseTotal != null ? formatAmountCellPdfLines(record.splitPurchaseTotal) : ''}</Text> : null}
                <Text style={[S.tdRight, colClosing]}>{record?.closingBalance != null ? formatAmountCellPdfLines(record.closingBalance) : ''}</Text>
              </View>
            );
          })}

          {isLastPage && pageRecords.length > 0 ? (
            <View style={[S.tr, S.totalRow]} wrap={false}>
              <Text style={[S.td, colMonth, S.tdBold]}>Total</Text>
              <Text style={[S.tdRight, colOrders, S.tdBold]}>{totals.totalOrders || ''}</Text>
              <Text style={[S.tdRight, colBasic, S.tdBold]}>{totals.totalSubTotal ? formatAmountCellPdfLines(totals.totalSubTotal) : '0.00'}</Text>
              <Text style={[S.tdRight, colTotal, S.tdBold]}>{totals.totalFinal ? formatAmountCellPdfLines(totals.totalFinal) : '0.00'}</Text>
              {showSplitColumn ? <Text style={[S.tdRight, S.colSplit, S.tdBold]}>{totals.splitPurchaseTotal ? formatAmountCellPdfLines(totals.splitPurchaseTotal) : '0.00'}</Text> : null}
              <Text style={[S.tdRight, colClosing, S.tdBold]}>{totals.closingBalance ? formatAmountCellPdfLines(totals.closingBalance) : '0.00'}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
};

export const PurchaseLedgerReportPdf = ({ records, profile, startDate, endDate, showSplitColumn = false }) => {
  const monthlyMode = isMonthlySummary(records);
  const recordList = Array.isArray(records) ? records : [];

  if (monthlyMode) {
    const pages = buildMonthlyPages(recordList);
    const totalPages = pages.length;
    const totals = recordList.reduce(
      (acc, record, index) => {
        const closingBalance = record?.closingBalance != null ? parseFloat(record.closingBalance) : recordList.slice(0, index + 1).reduce((sum, r) => sum + (parseFloat(r?.totalFinal) || 0), 0);

        return {
          totalOrders: acc.totalOrders + (Number(record?.totalOrders) || 0),
          totalSubTotal: acc.totalSubTotal + (parseFloat(record?.totalSubTotal) || 0),
          totalFinal: acc.totalFinal + (parseFloat(record?.totalFinal) || 0),
          splitPurchaseTotal: acc.splitPurchaseTotal + (parseFloat(record?.splitPurchaseTotal) || 0),
          closingBalance,
        };
      },
      { totalOrders: 0, totalSubTotal: 0, totalFinal: 0, splitPurchaseTotal: 0, closingBalance: 0 }
    );

    return (
      <Document>
        {pages.map((pageRecords, idx) => (
          <Page key={idx} size="A4" style={S.page}>
            <View style={S.outerBorder} fixed />
            <View style={S.pageContent} wrap={false}>
              {idx === 0 ? <ReportTitleBanner title="Purchase Ledger (Monthly Summary)" startDate={startDate} endDate={endDate} /> : null}
              <CompanyHeader profile={profile} />
              <MonthlySummaryTable pageRecords={pageRecords} isLastPage={idx === totalPages - 1} showSplitColumn={showSplitColumn} totals={totals} />
            </View>
            <PageBottomBar currentPage={idx + 1} totalPages={totalPages} />
          </Page>
        ))}
      </Document>
    );
  }

  const pages = buildDetailPages(recordList);

  return (
    <Document>
      {pages.map((pageData, idx) => (
        <Page key={idx} size="A4" style={S.page}>
          <View style={S.outerBorder} fixed />
          <View style={S.pageContent} wrap={false}>
            {idx === 0 ? <ReportTitleBanner title="Purchase Register" startDate={startDate} endDate={endDate} /> : null}
            <CompanyHeader profile={profile} />
            <DetailPurchaseTable pageData={pageData} />
          </View>
          <PageBottomBar currentPage={pageData.currentPage} totalPages={pageData.totalPages} />
        </Page>
      ))}
    </Document>
  );
};
