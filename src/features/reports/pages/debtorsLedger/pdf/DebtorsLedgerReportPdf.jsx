import { Document, Image, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

import abssBrandingLogo from '@/assets/images/ABSS-LOGO.png';
import { dateFormateForUi } from 'utils/services';
import { formatAmount } from '@/utils/currency';

/** PDF point sizes — smaller than screen CSS sizes from getFontSizeFromText */
const getPdfParticularsFontSize = (text = '') => {
  const len = String(text).length;
  if (len <= 28) return 8;
  if (len <= 42) return 7.5;
  if (len <= 56) return 7;
  return 6.5;
};

const formatAmountCellPdfLines = (val, isAbs = false, maxChars = 14) => {
  const str = val == null || val === '' ? '' : formatAmount(isAbs ? Math.abs(val) : val, false);
  if (!str || str.length <= maxChars) return str;
  const i = str.indexOf(',', Math.floor(str.length / 2));
  return i > -1 ? `${str.slice(0, i + 1)}\n${str.slice(i + 1)}` : str;
};

const RECORDS_FIRST_PAGE = 35;
const RECORDS_PER_PAGE = 40;

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
  pageContent: {
    flexDirection: 'column',
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
  pageBottomBar: {
    position: 'absolute',
    left: PAGE_PAD,
    right: PAGE_PAD,
    bottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableOuter: {
    flexDirection: 'column',
    marginTop: 4,
  },
  tableWrap: {
    flexDirection: 'column',
    borderWidth: 0.75,
    borderColor: BORDER_DARK,
  },
  tableBody: {
    flexDirection: 'column',
  },
  dataRowsBlock: {
    flexDirection: 'column',
  },
  emptyRow: {
    minHeight: 14,
  },
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
    width: '40%',
    paddingRight: 8,
  },
  headerRight: {
    width: '60%',
    alignItems: 'flex-end',
    paddingLeft: 8,
  },
  companyLogo: { height: 36, width: 76, objectFit: 'contain', marginRight: 8 },
  companyName: { fontSize: 11, fontWeight: 'bold', marginBottom: 3 },
  addrLine: { fontSize: 8, color: LABEL_CLR, marginBottom: 2 },
  pagePagination: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pagePaginationText: { fontSize: 9, color: LABEL_CLR, textAlign: 'center' },
  thead: { flexDirection: 'row', backgroundColor: ROW_ALT, borderBottomWidth: 0.75, borderBottomColor: BORDER_DARK },
  th: { fontSize: 8, fontWeight: 'bold', paddingHorizontal: 4, paddingVertical: 5 },
  thRight: { fontSize: 8, fontWeight: 'bold', paddingHorizontal: 4, paddingVertical: 5, textAlign: 'right' },
  tr: { flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: BORDER },
  trAlt: { backgroundColor: ROW_ALT },
  td: { fontSize: 8.5, paddingHorizontal: 4, paddingVertical: 3 },
  tdRight: { fontSize: 8.5, paddingHorizontal: 4, paddingVertical: 3, textAlign: 'right' },
  tdBold: { fontWeight: 'bold' },
  colParticulars: { flex: 1, textAlign: 'left' },
  colAmount: { width: 90, textAlign: 'right' },
  colParticularsSplit: { flex: 1, textAlign: 'left' },
  colAmountSplit: { width: 72, textAlign: 'right' },
  poweredByRow: { flexDirection: 'row', alignItems: 'center' },
  poweredByText: { fontSize: 7.5, color: LABEL_CLR, marginRight: 4 },
  abssBrandingLogo: { width: 62, objectFit: 'contain' },
});

/** Debtors: netPayable > 0 → Debit, netPayable < 0 → Credit */
const sumPageAmounts = records => {
  let debit = 0;
  let credit = 0;
  let splitDebit = 0;
  let splitCredit = 0;

  (records || []).forEach(x => {
    if (x?.netPayable < 0) {
      credit += x?.netPayable || 0;
    } else {
      debit += x?.netPayable || 0;
    }
    if (x?.splitNetPayable < 0) {
      splitCredit += x?.splitNetPayable || 0;
    } else {
      splitDebit += x?.splitNetPayable || 0;
    }
  });

  return { debit, credit, splitDebit, splitCredit };
};

function buildPages(records) {
  const recordList = Array.isArray(records) ? records : [];
  const totals = sumPageAmounts(recordList);
  const len = recordList.length;

  const pages = [];
  let i = 0;
  let currentPage = 1;

  while (i < Math.max(len, 1)) {
    const recordsPerPage = currentPage === 1 ? RECORDS_FIRST_PAGE : RECORDS_PER_PAGE;
    const pageRecords = recordList.slice(i, i + recordsPerPage);
    pages.push({
      currentPage,
      totalPages: 0,
      pageRecords,
      recordsPerPage,
      totals,
      isLastPage: false,
    });
    i += recordsPerPage;
    currentPage += 1;
  }

  const totalPages = pages.length;
  pages.forEach((page, index) => {
    page.totalPages = totalPages;
    page.isLastPage = index === totalPages - 1;
  });

  return { pages };
}

const formatDebitCell = (value, isSplit = false) => (value ? formatAmountCellPdfLines(value, false, isSplit ? 11 : 14) : '');
const formatCreditCell = (value, isSplit = false) => (value ? formatAmountCellPdfLines(Math.abs(value), true, isSplit ? 11 : 14) : '');

function resolveReportDateRange(startDate, endDate) {
  if (startDate && endDate) {
    return `From ${dateFormateForUi(startDate)} To ${dateFormateForUi(endDate)}`;
  }
  return '';
}

const ReportTitleBanner = ({ startDate, endDate }) => {
  const range = resolveReportDateRange(startDate, endDate);

  return (
    <View style={S.reportTitleBlock} wrap={false}>
      <Text style={S.reportTitleMain}>Debtors Ledger</Text>
      {range ? <Text style={S.reportDateRange}>{range}</Text> : null}
    </View>
  );
};

const HeaderFirst = ({ profile }) => (
  <View wrap={false}>
    <View style={S.headerRow}>
      <View style={S.headerLeft}>
        {profile?.companyLogo ? (
          <Image
            source={{
              uri: profile.companyLogo,
              headers: { Pragma: 'no-cache', 'Cache-Control': 'no-cache' },
              method: 'GET',
              body: undefined,
            }}
            style={S.companyLogo}
          />
        ) : null}
        <View>
          {profile?.name ? <Text style={S.companyName}>{profile.name}</Text> : null}
          <Text style={S.addrLine}>{[profile?.address?.street1, profile?.address?.city].filter(Boolean).join(', ')}</Text>
          <Text style={S.addrLine}>
            {[profile?.address?.state, profile?.address?.country].filter(Boolean).join(', ')}
            {profile?.address?.pinCode ? ` - ${profile.address.pinCode}` : ''}
          </Text>
        </View>
      </View>
    </View>
  </View>
);

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

const LedgerTable = ({ pageData, isSplitSessionActive }) => {
  const { currentPage, totalPages, pageRecords, recordsPerPage, totals, isLastPage } = pageData;

  const colPart = isSplitSessionActive ? S.colParticularsSplit : S.colParticulars;
  const colAmt = isSplitSessionActive ? S.colAmountSplit : S.colAmount;
  const maxChars = isSplitSessionActive ? 11 : 14;

  return (
    <View style={S.tableOuter}>
      <View style={S.tableWrap}>
        <View style={S.thead}>
          <Text style={[S.th, colPart]}>Particulars</Text>
          <Text style={[S.thRight, colAmt]}>Debit</Text>
          <Text style={[S.thRight, colAmt]}>Credit</Text>
          {isSplitSessionActive ? (
            <>
              <Text style={[S.thRight, colAmt]}>Split Debit</Text>
              <Text style={[S.thRight, colAmt]}>Split Credit</Text>
            </>
          ) : null}
        </View>

        <View style={S.tableBody}>
          <View style={S.dataRowsBlock}>
            {pageRecords.map((record, index) => {
              const alt = index % 2 === 1;
              const customerName = record?.customerDisplayName || '';
              const particularsFontSize = getPdfParticularsFontSize(customerName);

              const debitStr = record?.netPayable > 0 ? formatAmountCellPdfLines(record.netPayable, false, maxChars) : '';
              const creditStr = record?.netPayable < 0 ? formatAmountCellPdfLines(record.netPayable, true, maxChars) : '';
              const splitDebitStr = isSplitSessionActive && record?.splitNetPayable > 0 ? formatAmountCellPdfLines(record.splitNetPayable, false, maxChars) : '';
              const splitCreditStr = isSplitSessionActive && record?.splitNetPayable < 0 ? formatAmountCellPdfLines(record.splitNetPayable, true, maxChars) : '';

              return (
                <View key={`${record?.customerId}-${index}`} style={[S.tr, alt && S.trAlt]} wrap={false}>
                  <Text style={[S.td, colPart, { fontSize: particularsFontSize }]}>{customerName}</Text>
                  <Text style={[S.tdRight, colAmt]}>{debitStr}</Text>
                  <Text style={[S.tdRight, colAmt]}>{creditStr}</Text>
                  {isSplitSessionActive ? (
                    <>
                      <Text style={[S.tdRight, colAmt]}>{splitDebitStr}</Text>
                      <Text style={[S.tdRight, colAmt]}>{splitCreditStr}</Text>
                    </>
                  ) : null}
                </View>
              );
            })}
            {currentPage < totalPages
              ? Array.from({ length: Math.max(0, recordsPerPage - pageRecords.length) }).map((_, i) => (
                  <View key={`empty-${i}`} style={[S.tr, (pageRecords.length + i) % 2 === 1 && S.trAlt, S.emptyRow]}>
                    <Text style={[S.td, colPart]}> </Text>
                    <Text style={[S.tdRight, colAmt]}> </Text>
                    <Text style={[S.tdRight, colAmt]}> </Text>
                    {isSplitSessionActive ? (
                      <>
                        <Text style={[S.tdRight, colAmt]}> </Text>
                        <Text style={[S.tdRight, colAmt]}> </Text>
                      </>
                    ) : null}
                  </View>
                ))
              : null}
            {isLastPage ? (
              <View style={[S.tr, pageRecords.length % 2 === 1 && S.trAlt]} wrap={false}>
                <Text style={[S.td, colPart, S.tdBold]}>Grand Total</Text>
                <Text style={[S.tdRight, colAmt, S.tdBold]}>{formatDebitCell(totals.debit, isSplitSessionActive)}</Text>
                <Text style={[S.tdRight, colAmt, S.tdBold]}>{formatCreditCell(totals.credit, isSplitSessionActive)}</Text>
                {isSplitSessionActive ? (
                  <>
                    <Text style={[S.tdRight, colAmt, S.tdBold]}>{formatDebitCell(totals.splitDebit, isSplitSessionActive)}</Text>
                    <Text style={[S.tdRight, colAmt, S.tdBold]}>{formatCreditCell(totals.splitCredit, isSplitSessionActive)}</Text>
                  </>
                ) : null}
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
};

export const DebtorsLedgerReportPdf = ({ records, profile, isSplitSessionActive = false, startDate, endDate }) => {
  const { pages } = buildPages(records);

  return (
    <Document>
      {pages.map((pageData, idx) => (
        <Page key={idx} size="A4" style={S.page}>
          <View style={S.outerBorder} fixed />
          <View style={S.pageContent} wrap={false}>
            {idx === 0 ? <ReportTitleBanner startDate={startDate} endDate={endDate} /> : null}
            <HeaderFirst profile={profile} />
            <LedgerTable pageData={pageData} isSplitSessionActive={isSplitSessionActive} />
          </View>
          <PageBottomBar currentPage={pageData.currentPage} totalPages={pageData.totalPages} />
        </Page>
      ))}
    </Document>
  );
};
