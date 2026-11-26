import { Document, Image, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

import abssBrandingLogo from '@/assets/images/ABSS-LOGO.png';
import { dateFormateForUi } from 'utils/services';
import { formatAmount } from '@/utils/currency';
import { resolveProfile } from 'utils/pdfUtils';
import { flattenAccountsForExport } from '../chartOfAccount.utils';

/** PDF point sizes — matched to Creditors Ledger report */
const getPdfParticularsFontSize = (text = '') => {
  const len = String(text).length;
  if (len <= 28) return 8;
  if (len <= 42) return 7.5;
  if (len <= 56) return 7;
  return 6.5;
};

const formatBalanceCell = (balance, isDebit) => {
  const amount = Number(balance) || 0;
  const side = isDebit ? 'Dr' : 'Cr';
  return `${formatAmount(amount, false)} ${side}`;
};

const RECORDS_FIRST_PAGE = 35;
const RECORDS_PER_PAGE = 40;

const BORDER = '#D1D5DB';
const BORDER_DARK = '#9CA3AF';
const LABEL_CLR = '#4B5563';
const TEXT_CLR = '#111827';
const ROW_ALT = '#F3F4F6';
const WHITE = '#FFFFFF';
const CATEGORY_BG = '#E5E7EB';

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
  trCategory: { backgroundColor: CATEGORY_BG },
  td: { fontSize: 8.5, paddingHorizontal: 4, paddingVertical: 3 },
  tdRight: { fontSize: 8.5, paddingHorizontal: 4, paddingVertical: 3, textAlign: 'right' },
  tdBold: { fontWeight: 'bold' },
  colName: { flex: 1, textAlign: 'left' },
  colCode: { width: 55, textAlign: 'left' },
  colBalance: { width: 90, textAlign: 'right' },
  colType: { width: 85, textAlign: 'left' },
  colParent: { width: 75, textAlign: 'left' },
  colStatus: { width: 50, textAlign: 'left' },
  poweredByRow: { flexDirection: 'row', alignItems: 'center' },
  poweredByText: { fontSize: 7.5, color: LABEL_CLR, marginRight: 4 },
  abssBrandingLogo: { width: 62, objectFit: 'contain' },
});

const buildExportRowsWithCategories = accountDrop => {
  const rows = [];

  (accountDrop || []).forEach(group => {
    const accounts = flattenAccountsForExport([group]);
    if (!accounts.length) return;

    rows.push({
      rowType: 'category',
      id: `category-${group.category}`,
      label: group.displayName || group.category || 'Accounts',
    });

    accounts.forEach(account => {
      rows.push({
        rowType: 'account',
        ...account,
      });
    });
  });

  return rows;
};

function buildPages(rows) {
  const recordList = Array.isArray(rows) ? rows : [];
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

const ReportTitleBanner = ({ startDate, endDate }) => {
  const range = resolveReportDateRange(startDate, endDate);

  return (
    <View style={S.reportTitleBlock} wrap={false}>
      <Text style={S.reportTitleMain}>Chart of Accounts</Text>
      {range ? <Text style={S.reportDateRange}>{range}</Text> : null}
    </View>
  );
};

const HeaderFirst = ({ profile }) => {
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

const AccountsTable = ({ pageData }) => {
  const { currentPage, totalPages, pageRecords, recordsPerPage } = pageData;

  return (
    <View style={S.tableOuter}>
      <View style={S.tableWrap}>
        <View style={S.thead}>
          <Text style={[S.th, S.colName]}>Account Name</Text>
          <Text style={[S.th, S.colCode]}>Code</Text>
          <Text style={[S.thRight, S.colBalance]}>Closing Balance</Text>
          <Text style={[S.th, S.colType]}>Account Type</Text>
          <Text style={[S.th, S.colParent]}>Parent</Text>
          <Text style={[S.th, S.colStatus]}>Status</Text>
        </View>

        <View style={S.tableBody}>
          <View style={S.dataRowsBlock}>
            {pageRecords.map((record, index) => {
              if (record.rowType === 'category') {
                return (
                  <View key={`${record.id}-${index}`} style={[S.tr, S.trCategory]} wrap={false}>
                    <Text style={[S.td, S.colName, S.tdBold]}>{record.label}</Text>
                    <Text style={[S.td, S.colCode]} />
                    <Text style={[S.tdRight, S.colBalance]} />
                    <Text style={[S.td, S.colType]} />
                    <Text style={[S.td, S.colParent]} />
                    <Text style={[S.td, S.colStatus]} />
                  </View>
                );
              }

              const alt = index % 2 === 1;
              const accountName = record.accountName || '';
              const particularsFontSize = getPdfParticularsFontSize(accountName);
              const indent = Math.max(0, record.indentLevel || 0) * 8;

              return (
                <View key={`${record.id}-${index}`} style={[S.tr, alt && S.trAlt]} wrap={false}>
                  <Text style={[S.td, S.colName, { fontSize: particularsFontSize, paddingLeft: 4 + indent }, record.hasChildren ? S.tdBold : null]}>{accountName || ''}</Text>
                  <Text style={[S.td, S.colCode]}>{record.accountCode || ''}</Text>
                  <Text style={[S.tdRight, S.colBalance]}>{formatBalanceCell(record.currentBalance, record.isDebit)}</Text>
                  <Text style={[S.td, S.colType]}>{record.categoryDisplayName || record.category || ''}</Text>
                  <Text style={[S.td, S.colParent]}>{record.parentAccountName || ''}</Text>
                  <Text style={[S.td, S.colStatus]}>{record.isActive ? 'Active' : 'Inactive'}</Text>
                </View>
              );
            })}
            {currentPage < totalPages
              ? Array.from({ length: Math.max(0, recordsPerPage - pageRecords.length) }).map((_, i) => (
                  <View key={`empty-${i}`} style={[S.tr, (pageRecords.length + i) % 2 === 1 && S.trAlt, S.emptyRow]}>
                    <Text style={[S.td, S.colName]}> </Text>
                    <Text style={[S.td, S.colCode]}> </Text>
                    <Text style={[S.tdRight, S.colBalance]}> </Text>
                    <Text style={[S.td, S.colType]}> </Text>
                    <Text style={[S.td, S.colParent]}> </Text>
                    <Text style={[S.td, S.colStatus]}> </Text>
                  </View>
                ))
              : null}
          </View>
        </View>
      </View>
    </View>
  );
};

export const chartOfAccountPdfFileName = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `Chart_of_Accounts_${year}${month}${day}.pdf`;
};

export const ChartOfAccountPdf = ({ accountDrop, profile, startDate, endDate }) => {
  const rows = buildExportRowsWithCategories(accountDrop);
  const { pages } = buildPages(rows);

  return (
    <Document>
      {pages.map((pageData, idx) => (
        <Page key={idx} size="A4" style={S.page}>
          <View style={S.outerBorder} fixed />
          <View style={S.pageContent} wrap={false}>
            {idx === 0 ? <ReportTitleBanner startDate={startDate} endDate={endDate} /> : null}
            <HeaderFirst profile={profile} />
            <AccountsTable pageData={pageData} />
          </View>
          <PageBottomBar currentPage={pageData.currentPage} totalPages={pageData.totalPages} />
        </Page>
      ))}
    </Document>
  );
};
