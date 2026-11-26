import { Document, Image, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

import abssBrandingLogo from '@/assets/images/ABSS-LOGO.png';
import { dateFormateForUi } from 'utils/services';
import { formatAmount } from '@/utils/currency';
import { resolveProfile } from 'utils/pdfUtils';

/** PDF point sizes — matched to Creditors Ledger report */
const getPdfParticularsFontSize = (text = '') => {
  const len = String(text).length;
  if (len <= 28) return 8;
  if (len <= 42) return 7.5;
  if (len <= 56) return 7;
  return 6.5;
};

const formatAmountCell = val => {
  if (val == null || val === '' || Number(val) === 0) return '';
  return formatAmount(val, false);
};

const RECORDS_FIRST_PAGE = 30;
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
    width: '50%',
    paddingRight: 8,
  },
  headerRight: {
    width: '50%',
    alignItems: 'flex-end',
    paddingLeft: 8,
  },
  companyLogo: { height: 36, width: 76, objectFit: 'contain', marginRight: 8 },
  companyName: { fontSize: 11, fontWeight: 'bold', marginBottom: 3 },
  addrLine: { fontSize: 8, color: LABEL_CLR, marginBottom: 2 },
  accountName: { fontSize: 11, fontWeight: 'bold', marginBottom: 3, textAlign: 'right' },
  accountMeta: { fontSize: 8, color: LABEL_CLR, marginBottom: 2, textAlign: 'right' },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 0.75,
    borderBottomColor: BORDER_DARK,
  },
  metaItem: {
    width: '25%',
    paddingRight: 6,
    marginBottom: 4,
  },
  metaLabel: { fontSize: 7.5, color: LABEL_CLR, marginBottom: 2 },
  metaValue: { fontSize: 8.5, fontWeight: 'bold', color: TEXT_CLR },
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
  colDate: { width: 68, textAlign: 'left' },
  colDoc: { width: 78, textAlign: 'left' },
  colDetails: { flex: 1, textAlign: 'left' },
  colType: { width: 78, textAlign: 'left' },
  colBranch: { width: 62, textAlign: 'left' },
  colAmount: { width: 72, textAlign: 'right' },
  poweredByRow: { flexDirection: 'row', alignItems: 'center' },
  poweredByText: { fontSize: 7.5, color: LABEL_CLR, marginRight: 4 },
  abssBrandingLogo: { width: 62, objectFit: 'contain' },
});

function buildPages(entries) {
  const recordList = Array.isArray(entries) ? entries : [];
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

function resolveReportDateRange(startDate, endDate) {
  if (startDate && endDate) {
    return `From ${dateFormateForUi(startDate)} To ${dateFormateForUi(endDate)}`;
  }
  return '';
}

const ReportTitleBanner = ({ account, startDate, endDate }) => {
  const range = resolveReportDateRange(startDate, endDate);

  return (
    <View style={S.reportTitleBlock} wrap={false}>
      <Text style={S.reportTitleMain}>Account Ledger</Text>
      {account?.accountName ? <Text style={S.reportDateRange}>{account.accountName}</Text> : null}
      {range ? <Text style={S.reportDateRange}>{range}</Text> : null}
    </View>
  );
};

const HeaderFirst = ({ profile, account }) => {
  const company = resolveProfile(profile);
  const addressLine1 = [company?.address?.street1, company?.address?.city].filter(Boolean).join(', ');
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
          <View>
            {company?.name ? <Text style={S.companyName}>{company.name}</Text> : null}
            {addressLine1 ? <Text style={S.addrLine}>{addressLine1}</Text> : null}
            {addressLine2 ? <Text style={S.addrLine}>{addressLine2}</Text> : null}
          </View>
        </View>
        <View style={S.headerRight}>
          {account?.accountName ? <Text style={S.accountName}>{account.accountName}</Text> : null}
          {account?.accountCode ? <Text style={S.accountMeta}>Code: {account.accountCode}</Text> : null}
          {account?.categoryDisplayName ? <Text style={S.accountMeta}>{account.categoryDisplayName}</Text> : null}
        </View>
      </View>
    </View>
  );
};

const AccountSummary = ({ account }) => {
  if (!account) return null;

  const closingLabel = `${formatAmount(account.closingBalance ?? 0, false)} ${account.isDebit ? 'Dr' : 'Cr'}`;

  return (
    <View style={S.metaGrid} wrap={false}>
      <View style={S.metaItem}>
        <Text style={S.metaLabel}>Opening Balance</Text>
        <Text style={S.metaValue}>{formatAmount(account.openingBalance ?? 0, false)}</Text>
      </View>
      <View style={S.metaItem}>
        <Text style={S.metaLabel}>Closing Balance</Text>
        <Text style={S.metaValue}>{closingLabel}</Text>
      </View>
      <View style={S.metaItem}>
        <Text style={S.metaLabel}>Total Debit</Text>
        <Text style={S.metaValue}>{formatAmount(account.totalDebit ?? 0, false)}</Text>
      </View>
      <View style={S.metaItem}>
        <Text style={S.metaLabel}>Total Credit</Text>
        <Text style={S.metaValue}>{formatAmount(account.totalCredit ?? 0, false)}</Text>
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

const LedgerTable = ({ pageData, account }) => {
  const { currentPage, totalPages, pageRecords, recordsPerPage, isLastPage } = pageData;

  return (
    <View style={S.tableOuter}>
      <View style={S.tableWrap}>
        <View style={S.thead}>
          <Text style={[S.th, S.colDate]}>Date</Text>
          <Text style={[S.th, S.colDoc]}>Document No.</Text>
          <Text style={[S.th, S.colDetails]}>Transaction Details</Text>
          <Text style={[S.th, S.colType]}>Type</Text>
          <Text style={[S.th, S.colBranch]}>Branch</Text>
          <Text style={[S.thRight, S.colAmount]}>Debit</Text>
          <Text style={[S.thRight, S.colAmount]}>Credit</Text>
        </View>

        <View style={S.tableBody}>
          <View style={S.dataRowsBlock}>
            {pageRecords.map((record, index) => {
              const alt = index % 2 === 1;
              const details = record?.partyName || record?.narration || '';
              const particularsFontSize = getPdfParticularsFontSize(details);

              return (
                <View key={`${record?.id || index}`} style={[S.tr, alt && S.trAlt]} wrap={false}>
                  <Text style={[S.td, S.colDate]}>{record?.date ? dateFormateForUi(record.date) : ''}</Text>
                  <Text style={[S.td, S.colDoc]}>{record?.documentNo || ''}</Text>
                  <Text style={[S.td, S.colDetails, { fontSize: particularsFontSize }]}>{details}</Text>
                  <Text style={[S.td, S.colType]}>{record?.type || ''}</Text>
                  <Text style={[S.td, S.colBranch]}>{record?.branchName || ''}</Text>
                  <Text style={[S.tdRight, S.colAmount]}>{formatAmountCell(record?.debit)}</Text>
                  <Text style={[S.tdRight, S.colAmount]}>{formatAmountCell(record?.credit)}</Text>
                </View>
              );
            })}

            {currentPage < totalPages
              ? Array.from({ length: Math.max(0, recordsPerPage - pageRecords.length) }).map((_, i) => (
                  <View key={`empty-${i}`} style={[S.tr, (pageRecords.length + i) % 2 === 1 && S.trAlt, S.emptyRow]}>
                    <Text style={[S.td, S.colDate]}> </Text>
                    <Text style={[S.td, S.colDoc]}> </Text>
                    <Text style={[S.td, S.colDetails]}> </Text>
                    <Text style={[S.td, S.colType]}> </Text>
                    <Text style={[S.td, S.colBranch]}> </Text>
                    <Text style={[S.tdRight, S.colAmount]}> </Text>
                    <Text style={[S.tdRight, S.colAmount]}> </Text>
                  </View>
                ))
              : null}

            {isLastPage && account ? (
              <View style={[S.tr, pageRecords.length % 2 === 1 && S.trAlt]} wrap={false}>
                <Text style={[S.td, S.colDate]} />
                <Text style={[S.td, S.colDoc]} />
                <Text style={[S.td, S.colDetails, S.tdBold]}>Total</Text>
                <Text style={[S.td, S.colType]} />
                <Text style={[S.td, S.colBranch]} />
                <Text style={[S.tdRight, S.colAmount, S.tdBold]}>{formatAmount(account.totalDebit ?? 0, false)}</Text>
                <Text style={[S.tdRight, S.colAmount, S.tdBold]}>{formatAmount(account.totalCredit ?? 0, false)}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
};

export const AccountLedgerPdf = ({ account, entries, profile, startDate, endDate }) => {
  const { pages } = buildPages(entries);

  return (
    <Document>
      {pages.map((pageData, idx) => (
        <Page key={idx} size="A4" style={S.page}>
          <View style={S.outerBorder} fixed />
          <View style={S.pageContent} wrap={false}>
            {idx === 0 ? <ReportTitleBanner account={account} startDate={startDate} endDate={endDate} /> : null}
            <HeaderFirst profile={profile} account={account} />
            {idx === 0 ? <AccountSummary account={account} /> : null}
            <LedgerTable pageData={pageData} account={account} />
          </View>
          <PageBottomBar currentPage={pageData.currentPage} totalPages={pageData.totalPages} />
        </Page>
      ))}
    </Document>
  );
};
