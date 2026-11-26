import { Document, Image, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

import abssBrandingLogo from '@/assets/images/ABSS-LOGO.png';
import { dateFormateForUi } from 'utils/services';
import { formatAmount } from '@/utils/currency';
import { resolveProfile } from 'utils/pdfUtils';

const RECORDS_FIRST_PAGE = 40;
const RECORDS_PER_PAGE = 46;

const BORDER = '#D1D5DB';
const BORDER_DARK = '#9CA3AF';
const LABEL_CLR = '#4B5563';
const TEXT_CLR = '#111827';
const ROW_ALT = '#F3F4F6';
const WHITE = '#FFFFFF';

const formatAmountCellPdfLines = (val, isAbs = false, maxChars = 14) => {
  const str = val == null || val === '' ? '' : formatAmount(isAbs ? Math.abs(val) : val, false);
  if (!str || str.length <= maxChars) return str;
  const i = str.indexOf(',', Math.floor(str.length / 2));
  return i > -1 ? `${str.slice(0, i + 1)}\n${str.slice(i + 1)}` : str;
};

const PAGE_PAD = 18;
const FOOTER_H = 30;
const BORDER_INSET = 4;
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
    marginBottom: 4,
    paddingBottom: 4,
    borderBottomWidth: 0.75,
    borderBottomColor: BORDER_DARK,
  },
  reportTitleMain: { fontSize: 12, fontWeight: 'bold', textAlign: 'center', marginBottom: 2 },
  reportDateRange: { fontSize: 9, textAlign: 'center', color: LABEL_CLR },
  pageBottomBar: {
    position: 'absolute',
    left: PAGE_PAD,
    right: PAGE_PAD,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tableOuter: {
    flexDirection: 'column',
    marginTop: 2,
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
    minHeight: 11,
  },
  totalsBlock: {
    paddingTop: 2,
    backgroundColor: WHITE,
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
    marginBottom: 5,
    paddingBottom: 5,
    borderBottomWidth: 0.75,
    borderBottomColor: BORDER_DARK,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '50%',
    paddingRight: 6,
  },
  headerLeftText: {
    flex: 1,
    minWidth: 0,
    maxWidth: '100%',
  },
  headerRight: {
    width: '50%',
    alignItems: 'flex-end',
    paddingLeft: 6,
  },
  companyLogo: { height: 30, width: 64, objectFit: 'contain', marginRight: 6, flexShrink: 0 },
  companyName: { fontSize: 11, fontWeight: 'bold', marginBottom: 1 },
  addrLine: { fontSize: 8, color: LABEL_CLR, marginBottom: 1, lineHeight: 1.35 },
  custName: { fontSize: 11, fontWeight: 'bold', marginBottom: 1, textAlign: 'right' },
  custLine: { fontSize: 8, color: LABEL_CLR, marginBottom: 1, textAlign: 'right', lineHeight: 1.35 },
  pagePagination: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pagePaginationText: { fontSize: 9, color: LABEL_CLR, textAlign: 'center' },
  thead: { flexDirection: 'row', backgroundColor: ROW_ALT, borderBottomWidth: 0.75, borderBottomColor: BORDER_DARK },
  th: { fontSize: 8, fontWeight: 'bold', paddingHorizontal: 3, paddingVertical: 3 },
  tr: { flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: BORDER },
  trAlt: { backgroundColor: ROW_ALT },
  td: { fontSize: 8.5, paddingHorizontal: 3, paddingVertical: 2 },
  tdBold: { fontWeight: 'bold' },
  colDate: { width: '11%', textAlign: 'center' },
  colPart: { width: '28%', textAlign: 'left' },
  colVchT: { width: '14%', textAlign: 'left' },
  colVchN: { width: '12%', textAlign: 'left' },
  colDr: { width: '12%', textAlign: 'right' },
  colCr: { width: '12%', textAlign: 'right' },
  colBal: { width: '11%', textAlign: 'right' },
  spacer: { height: 6 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexShrink: 0,
    backgroundColor: ROW_ALT,
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderBottomWidth: 0.75,
    borderBottomColor: BORDER_DARK,
  },
  summaryCol: { alignItems: 'flex-end', marginLeft: 14 },
  summaryLabel: { fontSize: 7.5, color: LABEL_CLR },
  summaryValue: { fontSize: 9, fontWeight: 'bold' },
  totalTop: { borderTopWidth: 0.75, borderTopColor: TEXT_CLR, paddingTop: 2 },
  poweredByRow: { flexDirection: 'row', alignItems: 'center' },
  poweredByText: { fontSize: 7.5, color: LABEL_CLR, marginRight: 4 },
  abssBrandingLogo: { width: 54, objectFit: 'contain' },
});

function buildPages(records, reports) {
  const recordList = Array.isArray(records) ? records : [];
  const len = recordList.length;

  let totalDebit = recordList.reduce((sum, r) => sum + (r.debit || 0), 0);
  let totalCredit = recordList.reduce((sum, r) => sum + (r.credit || 0), 0);
  if (reports?.openingBalanceType === 'DR') {
    totalDebit += reports?.openingBalance || 0;
  } else {
    totalCredit += reports?.openingBalance || 0;
  }
  const balanceWithOpeningAmount = totalDebit > totalCredit ? totalDebit : totalCredit;
  const finalBalance = balanceWithOpeningAmount || 0;

  const pages = [];
  let i = 0;
  let currentPage = 1;

  while (i < Math.max(len, 1)) {
    const recordsPerPage = currentPage === 1 ? RECORDS_FIRST_PAGE : RECORDS_PER_PAGE;
    const prevPageRecords = recordList.slice(0, i);
    const pageRecords = recordList.slice(i, i + recordsPerPage);

    let pageTotalDebit = pageRecords.reduce((sum, r) => sum + (r.debit || 0), 0);
    let pageTotalCredit = pageRecords.reduce((sum, r) => sum + (r.credit || 0), 0);
    if (reports?.openingBalanceType === 'DR') {
      pageTotalDebit += reports?.openingBalance || 0;
    } else {
      pageTotalCredit += reports?.openingBalance || 0;
    }

    let prevPageTotalDebit = 0;
    let prevPageTotalCredit = 0;
    if (currentPage > 1) {
      prevPageTotalDebit = prevPageRecords.reduce((sum, r) => sum + (r.debit || 0), 0);
      prevPageTotalCredit = prevPageRecords.reduce((sum, r) => sum + (r.credit || 0), 0);
      pageTotalDebit += prevPageTotalDebit || 0;
      pageTotalCredit += prevPageTotalCredit || 0;
      if (reports?.openingBalanceType === 'DR') {
        prevPageTotalDebit += reports?.openingBalance || 0;
      } else {
        prevPageTotalCredit += reports?.openingBalance || 0;
      }
    }

    pages.push({
      currentPage,
      totalPages: 0,
      pageRecords,
      recordsPerPage,
      prevPageTotalDebit,
      prevPageTotalCredit,
      pageTotalDebit,
      pageTotalCredit,
      finalBalance,
    });

    i += recordsPerPage;
    currentPage += 1;
  }

  const totalPages = pages.length;
  pages.forEach(page => {
    page.totalPages = totalPages;
  });

  return { pages };
}

function resolveReportDateRange(startDate, endDate, records) {
  if (startDate && endDate) {
    return `From ${dateFormateForUi(startDate)} To ${dateFormateForUi(endDate)}`;
  }

  const sorted = [...(Array.isArray(records) ? records : [])].filter(r => r?.date).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (!sorted.length) return '';

  return `From ${dateFormateForUi(sorted[0].date)} To ${dateFormateForUi(sorted[sorted.length - 1].date)}`;
}

const ReportTitleBanner = ({ startDate, endDate, records }) => {
  const range = resolveReportDateRange(startDate, endDate, records);

  return (
    <View style={S.reportTitleBlock} wrap={false}>
      <Text style={S.reportTitleMain}>General Ledger</Text>
      {range ? <Text style={S.reportDateRange}>{range}</Text> : null}
    </View>
  );
};

const buildRegionLine = (state, country, pinCode) => {
  const region = [state, country].filter(Boolean).join(', ');
  return region ? `${region}${pinCode ? ` - ${pinCode}` : ''}` : pinCode ? `- ${pinCode}` : '';
};

const buildAddressLines = address => {
  if (!address) return { line1: '', line2: '' };

  const line1 = [address?.street1, address?.street2, address?.city].filter(Boolean).join(', ');
  const line2 = buildRegionLine(address?.state, address?.country, address?.pinCode);

  return { line1, line2 };
};

const buildBillingAddressLines = billing => {
  if (!billing) return { line1: '', line2: '' };

  const street = billing?.address?.street1 || billing?.street1 || '';
  const street2 = billing?.address?.street2 || billing?.street2 || '';
  const city = billing?.city || '';
  const line1 = [street, street2, city].filter(Boolean).join(', ');
  const line2 = buildRegionLine(billing?.state, billing?.country, billing?.pinCode);

  return { line1, line2 };
};

const HeaderFirst = ({ profile, selectedCustomer }) => {
  const company = resolveProfile(profile);
  const companyAddress = buildAddressLines(company?.address);
  const billing = selectedCustomer?.address?.billing;
  const customerAddress = buildBillingAddressLines(billing);
  const customerName = selectedCustomer?.companyName || selectedCustomer?.customerDisplayName || '';

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
            {companyAddress.line1 ? <Text style={S.addrLine}>{companyAddress.line1}</Text> : null}
            {companyAddress.line2 ? <Text style={S.addrLine}>{companyAddress.line2}</Text> : null}
          </View>
        </View>
        {selectedCustomer ? (
          <View style={S.headerRight}>
            {customerName ? <Text style={S.custName}>{customerName}</Text> : null}
            {customerAddress.line1 ? <Text style={S.custLine}>{customerAddress.line1}</Text> : null}
            {customerAddress.line2 ? <Text style={S.custLine}>{customerAddress.line2}</Text> : null}
          </View>
        ) : null}
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

const LedgerSummary = ({ reports }) => {
  if (reports?.totalDebit == null && reports?.totalCredit == null && reports?.closingBalance == null) {
    return null;
  }

  const closingBalanceText = reports?.closingBalance != null ? `${formatAmountCellPdfLines(reports.closingBalance)}${reports?.closingBalanceType ? ` ${reports.closingBalanceType}` : ''}` : '-';

  return (
    <View style={S.summaryRow}>
      <View style={[S.summaryCol, { marginLeft: 0 }]}>
        <Text style={S.summaryLabel}>Total Debit</Text>
        <Text style={S.summaryValue}>{reports?.totalDebit != null ? formatAmountCellPdfLines(reports.totalDebit) : '-'}</Text>
      </View>
      <View style={S.summaryCol}>
        <Text style={S.summaryLabel}>Total Credit</Text>
        <Text style={S.summaryValue}>{reports?.totalCredit != null ? formatAmountCellPdfLines(reports.totalCredit) : '-'}</Text>
      </View>
      <View style={S.summaryCol}>
        <Text style={S.summaryLabel}>Closing Balance</Text>
        <Text style={S.summaryValue}>{closingBalanceText}</Text>
      </View>
    </View>
  );
};

const LedgerTable = ({ pageData, reports, startDate }) => {
  const { currentPage, totalPages, pageRecords, recordsPerPage, prevPageTotalDebit, prevPageTotalCredit, pageTotalDebit, pageTotalCredit, finalBalance } = pageData;

  return (
    <>
      <View style={S.tableOuter}>
        <View style={S.tableWrap}>
          {currentPage === 1 ? <LedgerSummary reports={reports} /> : null}
          <View style={S.thead}>
            <Text style={[S.th, S.colDate]}>Date</Text>
            <Text style={[S.th, S.colPart]}>Particulars</Text>
            <Text style={[S.th, S.colVchT]}>Vch Type</Text>
            <Text style={[S.th, S.colVchN]}>Vch No</Text>
            <Text style={[S.th, S.colDr]}>Debit</Text>
            <Text style={[S.th, S.colCr]}>Credit</Text>
            <Text style={[S.th, S.colBal]}>Balance</Text>
          </View>

          <View style={S.tableBody}>
            {reports?.openingBalance && currentPage === 1 ? (
              <View style={[S.tr, S.trAlt]} wrap={false}>
                <Text style={[S.td, S.colDate, S.tdBold]}>{startDate ? dateFormateForUi(startDate) : ''}</Text>
                <Text style={[S.td, S.colPart, S.tdBold]}>Opening Balance</Text>
                <Text style={[S.td, S.colVchT]} />
                <Text style={[S.td, S.colVchN]} />
                <Text style={[S.td, S.colDr, S.tdBold]}>{reports?.openingBalanceType === 'DR' ? formatAmountCellPdfLines(reports.openingBalance) : ''}</Text>
                <Text style={[S.td, S.colCr, S.tdBold]}>{reports?.openingBalanceType === 'CR' ? formatAmountCellPdfLines(reports.openingBalance) : ''}</Text>
                <Text style={[S.td, S.colBal, S.tdBold]}>{reports?.balance ? formatAmountCellPdfLines(reports.balance) : ''}</Text>
              </View>
            ) : null}

            {currentPage > 1 ? (
              <View style={S.tr} wrap={false}>
                <Text style={[S.td, S.colDate]} />
                <Text style={[S.td, S.colPart, S.tdBold]}>Brought Forward</Text>
                <Text style={[S.td, S.colVchT]} />
                <Text style={[S.td, S.colVchN]} />
                <Text style={[S.td, S.colDr, S.tdBold]}>{prevPageTotalDebit ? formatAmountCellPdfLines(prevPageTotalDebit) : ''}</Text>
                <Text style={[S.td, S.colCr, S.tdBold]}>{prevPageTotalCredit ? formatAmountCellPdfLines(prevPageTotalCredit) : ''}</Text>
                <Text style={[S.td, S.colBal]} />
              </View>
            ) : null}

            <View style={S.dataRowsBlock}>
              {pageRecords.map((record, index) => {
                const date = dateFormateForUi(record?.date);
                const prevDate = index === 0 ? '' : dateFormateForUi(pageRecords[index - 1]?.date);
                const alt = index % 2 === 1;
                return (
                  <View key={`${record?.date}-${index}-${record?.vchNo}`} style={[S.tr, alt && S.trAlt]} wrap={false}>
                    <Text style={[S.td, S.colDate]}>{date !== prevDate ? date : ''}</Text>
                    <Text style={[S.td, S.colPart]}>{record?.description || ''}</Text>
                    <Text style={[S.td, S.colVchT]}>{record?.vchType || ''}</Text>
                    <Text style={[S.td, S.colVchN]}>{record?.vchNo || ''}</Text>
                    <Text style={[S.td, S.colDr]}>{record?.debit ? formatAmountCellPdfLines(record.debit) : ''}</Text>
                    <Text style={[S.td, S.colCr]}>{record?.credit ? formatAmountCellPdfLines(record.credit) : ''}</Text>
                    <Text style={[S.td, S.colBal]}>{record?.balance ? formatAmountCellPdfLines(record.balance) : ''}</Text>
                  </View>
                );
              })}
              {currentPage < totalPages
                ? Array.from({ length: Math.max(0, recordsPerPage - pageRecords.length) }).map((_, i) => (
                    <View key={`empty-${i}`} style={[S.tr, (pageRecords.length + i) % 2 === 1 && S.trAlt, S.emptyRow]}>
                      <Text style={[S.td, S.colDate]}> </Text>
                      <Text style={[S.td, S.colPart]}> </Text>
                      <Text style={[S.td, S.colVchT]}> </Text>
                      <Text style={[S.td, S.colVchN]}> </Text>
                      <Text style={[S.td, S.colDr]}> </Text>
                      <Text style={[S.td, S.colCr]}> </Text>
                      <Text style={[S.td, S.colBal]}> </Text>
                    </View>
                  ))
                : null}
            </View>

            {currentPage < totalPages ? (
              <View style={S.totalsBlock}>
                <View style={S.tr} wrap={false}>
                  <Text style={[S.td, S.colDate]}> </Text>
                  <Text style={[S.td, S.colPart, S.tdBold]} wrap={false}>
                    Carried Over
                  </Text>
                  <Text style={[S.td, S.colVchT]}> </Text>
                  <Text style={[S.td, S.colVchN]}> </Text>
                  <Text style={[S.td, S.colDr, S.tdBold, S.totalTop]} wrap={false}>
                    {pageTotalDebit ? formatAmountCellPdfLines(pageTotalDebit) : ''}
                  </Text>
                  <Text style={[S.td, S.colCr, S.tdBold, S.totalTop]} wrap={false}>
                    {pageTotalCredit ? formatAmountCellPdfLines(pageTotalCredit) : ''}
                  </Text>
                  <Text style={[S.td, S.colBal]}> </Text>
                </View>
              </View>
            ) : null}

            {currentPage === totalPages ? (
              <View style={S.totalsBlock}>
                <View style={S.tr} wrap={false}>
                  <Text style={[S.td, S.colDate]}> </Text>
                  <Text style={[S.td, S.colPart]}> </Text>
                  <Text style={[S.td, S.colVchT]}> </Text>
                  <Text style={[S.td, S.colVchN]}> </Text>
                  <Text style={[S.td, S.colDr, S.tdBold, S.totalTop]} wrap={false}>
                    {reports?.totalDebit ? formatAmountCellPdfLines(reports.totalDebit) : ''}
                  </Text>
                  <Text style={[S.td, S.colCr, S.tdBold, S.totalTop]} wrap={false}>
                    {reports?.totalCredit ? formatAmountCellPdfLines(reports.totalCredit) : ''}
                  </Text>
                  <Text style={[S.td, S.colBal]}> </Text>
                </View>
                <View style={[S.tr, S.trAlt]} wrap={false}>
                  <Text style={[S.td, S.colDate]}> </Text>
                  <Text style={[S.td, S.colPart, S.tdBold]} wrap={false}>
                    Closing Balance
                  </Text>
                  <Text style={[S.td, S.colVchT]}> </Text>
                  <Text style={[S.td, S.colVchN]}> </Text>
                  <Text style={[S.td, S.colDr, S.tdBold]} wrap={false}>
                    {reports?.closingBalanceType === 'DR' ? '' : formatAmountCellPdfLines(reports?.closingBalance)}
                  </Text>
                  <Text style={[S.td, S.colCr, S.tdBold]} wrap={false}>
                    {reports?.closingBalanceType === 'CR' ? '' : formatAmountCellPdfLines(reports?.closingBalance)}
                  </Text>
                  <Text style={[S.td, S.colBal]}> </Text>
                </View>
                <View style={S.tr} wrap={false}>
                  <Text style={[S.td, S.colDate]}> </Text>
                  <Text style={[S.td, S.colPart]}> </Text>
                  <Text style={[S.td, S.colVchT]}> </Text>
                  <Text style={[S.td, S.colVchN]}> </Text>
                  <Text style={[S.td, S.colDr, S.tdBold]} wrap={false}>
                    {formatAmountCellPdfLines(finalBalance)}
                  </Text>
                  <Text style={[S.td, S.colCr, S.tdBold]} wrap={false}>
                    {formatAmountCellPdfLines(finalBalance)}
                  </Text>
                  <Text style={[S.td, S.colBal]}> </Text>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </>
  );
};

export const generalLedgerReportPdfFileName = ({ selectedCustomer } = {}) => {
  const today = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

  const entity = selectedCustomer?.companyName || selectedCustomer?.customerDisplayName || '';
  const entitySanitized = entity.replace(/[^a-zA-Z0-9]/g, '_');

  return entitySanitized ? `general_ledger_${entitySanitized}_${dateStr}.pdf` : `general_ledger_${dateStr}.pdf`;
};

export const GeneralLedgerReportPdf = ({ records, profile, selectedCustomer, reports, startDate, endDate }) => {
  const { pages } = buildPages(records, reports || {});

  return (
    <Document>
      {pages.map((pageData, idx) => (
        <Page key={idx} size="A4" style={S.page}>
          <View style={S.outerBorder} fixed />
          <View style={S.pageContent} wrap={false}>
            {idx === 0 ? <ReportTitleBanner startDate={startDate} endDate={endDate} records={records} /> : null}
            <HeaderFirst profile={profile} selectedCustomer={selectedCustomer} />
            <LedgerTable pageData={pageData} reports={reports} startDate={startDate} />
          </View>
          <PageBottomBar currentPage={pageData.currentPage} totalPages={pageData.totalPages} />
        </Page>
      ))}
    </Document>
  );
};
