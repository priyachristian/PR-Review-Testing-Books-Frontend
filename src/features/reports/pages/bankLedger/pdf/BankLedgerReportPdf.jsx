import { Document, Image, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

import abssBrandingLogo from '@/assets/images/ABSS-LOGO.png';
import { dateFormateForUi } from 'utils/services';
import { formatAmount } from '@/utils/currency';

const RECORDS_FIRST_PAGE = 37;
const RECORDS_PER_PAGE = 42;

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
  bankLine: { fontSize: 11, fontWeight: 'bold', marginBottom: 3, textAlign: 'right' },
  bankAccountLine: { fontSize: 8, color: LABEL_CLR, marginBottom: 2, textAlign: 'right' },
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
  th: { fontSize: 7.5, fontWeight: 'bold', paddingHorizontal: 3, paddingVertical: 5 },
  tr: { flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: BORDER },
  trAlt: { backgroundColor: ROW_ALT },
  td: { fontSize: 8, paddingHorizontal: 3, paddingVertical: 3 },
  tdBold: { fontWeight: 'bold' },
  colDate: { width: '11%', textAlign: 'center' },
  colCustomer: { width: '22%', textAlign: 'left' },
  colEffect: { width: '9%', textAlign: 'left' },
  colDocument: { width: '18%', textAlign: 'left' },
  colDocNo: { width: '12%', textAlign: 'left' },
  colAmount: { width: '13%', textAlign: 'right' },
  colBalance: { width: '15%', textAlign: 'right' },
  poweredByRow: { flexDirection: 'row', alignItems: 'center' },
  poweredByText: { fontSize: 7.5, color: LABEL_CLR, marginRight: 4 },
  abssBrandingLogo: { width: 62, objectFit: 'contain' },
});

const formatAmountCellPdfLines = (val, isAbs = false, maxChars = 14, bankCurrency = null) => {
  const str = val == null || val === '' ? '' : formatAmount(isAbs ? Math.abs(val) : val, false, bankCurrency);
  if (!str || str.length <= maxChars) return str;
  const i = str.indexOf(',', Math.floor(str.length / 2));
  return i > -1 ? `${str.slice(0, i + 1)}\n${str.slice(i + 1)}` : str;
};

const formatAmountCell = (record, bankCurrency) => {
  if (record?.isBalanceRow) return '';
  const { amount, effectType } = record;
  const prefix = effectType === 'OUT' ? '-' : effectType === 'IN' ? '+' : '';
  return `${prefix}${formatAmountCellPdfLines(amount ?? 0, false, 14, bankCurrency)}`;
};

function buildTableRows(records, openingBalance, closingBalance) {
  const recordList = Array.isArray(records) ? records : [];
  if (!recordList.length) return [];

  return [
    { isBalanceRow: true, label: 'Opening Balance', availableBalance: openingBalance ?? 0 },
    ...recordList,
    { isBalanceRow: true, label: 'Closing Balance', availableBalance: closingBalance ?? 0 },
  ];
}

function buildPages(records, openingBalance, closingBalance) {
  const allRows = buildTableRows(records, openingBalance, closingBalance);
  const len = allRows.length;

  const pages = [];
  let i = 0;
  let currentPage = 1;

  while (i < Math.max(len, 1)) {
    const recordsPerPage = currentPage === 1 ? RECORDS_FIRST_PAGE : RECORDS_PER_PAGE;
    const pageRecords = allRows.slice(i, i + recordsPerPage);
    pages.push({ currentPage, totalPages: 0, pageRecords, recordsPerPage });
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
      <Text style={S.reportTitleMain}>Bank Ledger</Text>
      {range ? <Text style={S.reportDateRange}>{range}</Text> : null}
    </View>
  );
};

const HeaderFirst = ({ profile, selectedBankName, accountNumber }) => (
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
      <View style={S.headerRight}>
        {selectedBankName ? <Text style={S.bankLine}>{selectedBankName}</Text> : null}
        {accountNumber ? <Text style={S.bankAccountLine}>{accountNumber}</Text> : null}
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

const LedgerTable = ({ pageData, bankCurrency }) => {
  const { currentPage, totalPages, pageRecords, recordsPerPage } = pageData;

  return (
    <View style={S.tableOuter}>
      <View style={S.tableWrap}>
        <View style={S.thead}>
          <Text style={[S.th, S.colDate]}>Bank Date</Text>
          <Text style={[S.th, S.colCustomer]}>Transaction Details</Text>
          <Text style={[S.th, S.colEffect]}>Effect</Text>
          <Text style={[S.th, S.colDocument]}>Document</Text>
          <Text style={[S.th, S.colDocNo]}>Document No</Text>
          <Text style={[S.th, S.colAmount]}>Amount</Text>
          <Text style={[S.th, S.colBalance]}>Available Balance</Text>
        </View>

        <View style={S.tableBody}>
          <View style={S.dataRowsBlock}>
            {pageRecords.map((record, index) => {
              const alt = index % 2 === 1;

              if (record.isBalanceRow) {
                return (
                  <View key={`balance-${record.label}-${index}`} style={[S.tr, alt && S.trAlt]} wrap={false}>
                    <Text style={[S.td, S.colDate]} />
                    <Text style={[S.td, S.colCustomer, S.tdBold]}>{record.label}</Text>
                    <Text style={[S.td, S.colEffect]} />
                    <Text style={[S.td, S.colDocument]} />
                    <Text style={[S.td, S.colDocNo]} />
                    <Text style={[S.td, S.colAmount]} />
                    <Text style={[S.td, S.colBalance, S.tdBold]}>{formatAmountCellPdfLines(record.availableBalance, false, 14, bankCurrency)}</Text>
                  </View>
                );
              }

              const date = dateFormateForUi(record?.date);
              const prevDate = index === 0 ? '' : dateFormateForUi(pageRecords[index - 1]?.date);

              return (
                <View key={`${record?.date}-${index}-${record?.documentNo}`} style={[S.tr, alt && S.trAlt]} wrap={false}>
                  <Text style={[S.td, S.colDate]}>{date !== prevDate ? date : ''}</Text>
                  <Text style={[S.td, S.colCustomer]}>{record?.partyName || record?.narration || '-'}</Text>
                  <Text style={[S.td, S.colEffect]}>{record?.effectType || '-'}</Text>
                  <Text style={[S.td, S.colDocument]}>{record?.referenceType || '-'}</Text>
                  <Text style={[S.td, S.colDocNo]}>{record?.documentNo || '-'}</Text>
                  <Text style={[S.td, S.colAmount]}>{formatAmountCell(record, bankCurrency)}</Text>
                  <Text style={[S.td, S.colBalance]}>{formatAmountCellPdfLines(record?.availableBalance, false, 14, bankCurrency)}</Text>
                </View>
              );
            })}
            {currentPage < totalPages
              ? Array.from({ length: Math.max(0, recordsPerPage - pageRecords.length) }).map((_, i) => (
                  <View key={`empty-${i}`} style={[S.tr, (pageRecords.length + i) % 2 === 1 && S.trAlt, S.emptyRow]}>
                    <Text style={[S.td, S.colDate]}> </Text>
                    <Text style={[S.td, S.colCustomer]}> </Text>
                    <Text style={[S.td, S.colEffect]}> </Text>
                    <Text style={[S.td, S.colDocument]}> </Text>
                    <Text style={[S.td, S.colDocNo]}> </Text>
                    <Text style={[S.td, S.colAmount]}> </Text>
                    <Text style={[S.td, S.colBalance]}> </Text>
                  </View>
                ))
              : null}
          </View>
        </View>
      </View>
    </View>
  );
};

export const BankLedgerReportPdf = ({ records, profile, selectedBankName, accountNumber = '', startDate, endDate, openingBalance, closingBalance, bankCurrency = null }) => {
  const { pages } = buildPages(records, openingBalance, closingBalance);

  return (
    <Document>
      {pages.map((pageData, idx) => (
        <Page key={idx} size="A4" style={S.page}>
          <View style={S.outerBorder} fixed />
          <View style={S.pageContent} wrap={false}>
            {idx === 0 ? <ReportTitleBanner startDate={startDate} endDate={endDate} records={records} /> : null}
            <HeaderFirst profile={profile} selectedBankName={selectedBankName} accountNumber={accountNumber} />
            <LedgerTable pageData={pageData} bankCurrency={bankCurrency} />
          </View>
          <PageBottomBar currentPage={pageData.currentPage} totalPages={pageData.totalPages} />
        </Page>
      ))}
    </Document>
  );
};
