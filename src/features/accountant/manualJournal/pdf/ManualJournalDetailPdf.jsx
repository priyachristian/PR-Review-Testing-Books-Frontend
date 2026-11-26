import { Document, Image, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

import abssBrandingLogo from '@/assets/images/ABSS-LOGO.png';
import { REPORTING_METHODS } from '@/utils/constants';
import { resolveProfile } from 'utils/pdfUtils';
import { dateFormateForUi } from 'utils/services';
import { formatAmount } from '@/utils/currency';

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
  reportSubtitle: { fontSize: 9, textAlign: 'center', color: LABEL_CLR },
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
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 0.75,
    borderBottomColor: BORDER_DARK,
  },
  metaItem: {
    width: '33.33%',
    paddingRight: 8,
    marginBottom: 6,
  },
  metaItemWide: {
    width: '66.66%',
    paddingRight: 8,
    marginBottom: 6,
  },
  metaLabel: { fontSize: 7.5, color: LABEL_CLR, marginBottom: 2 },
  metaValue: { fontSize: 8.5, fontWeight: 'bold', color: TEXT_CLR },
  tableOuter: { flexDirection: 'column', marginTop: 4 },
  tableWrap: { flexDirection: 'column', borderWidth: 0.75, borderColor: BORDER_DARK },
  tableBody: { flexDirection: 'column' },
  thead: { flexDirection: 'row', backgroundColor: ROW_ALT, borderBottomWidth: 0.75, borderBottomColor: BORDER_DARK },
  th: { fontSize: 8, fontWeight: 'bold', paddingHorizontal: 4, paddingVertical: 5 },
  thRight: { fontSize: 8, fontWeight: 'bold', paddingHorizontal: 4, paddingVertical: 5, textAlign: 'right' },
  tr: { flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: BORDER },
  trAlt: { backgroundColor: ROW_ALT },
  td: { fontSize: 8.5, paddingHorizontal: 4, paddingVertical: 3 },
  tdRight: { fontSize: 8.5, paddingHorizontal: 4, paddingVertical: 3, textAlign: 'right' },
  tdBold: { fontWeight: 'bold' },
  colAccount: { width: '26%', textAlign: 'left' },
  colDesc: { width: '22%', textAlign: 'left' },
  colContact: { width: '22%', textAlign: 'left' },
  colDr: { width: '15%', textAlign: 'right' },
  colCr: { width: '15%', textAlign: 'right' },
  totalRow: { borderTopWidth: 0.75, borderTopColor: TEXT_CLR, backgroundColor: ROW_ALT },
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

const getReportingMethodLabel = value => REPORTING_METHODS.find(method => method.value === value)?.label || '-';

const getContactName = entry => entry?.businessAccountLedgerMaster?.customerDisplayName || entry?.businessAccountLedgerMaster?.personName || '';

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

const ReportTitleBanner = ({ journal }) => (
  <View style={S.reportTitleBlock} wrap={false}>
    <Text style={S.reportTitleMain}>Manual Journal</Text>
    <Text style={S.reportSubtitle}>{journal?.manualJournalId || '-'}</Text>
  </View>
);

const JournalMeta = ({ journal }) => (
  <View style={S.metaGrid} wrap={false}>
    <View style={S.metaItem}>
      <Text style={S.metaLabel}>Date</Text>
      <Text style={S.metaValue}>{journal?.date ? dateFormateForUi(journal.date) : '-'}</Text>
    </View>
    <View style={S.metaItem}>
      <Text style={S.metaLabel}>Reporting Method</Text>
      <Text style={S.metaValue}>{getReportingMethodLabel(journal?.reportingMethod)}</Text>
    </View>
    <View style={S.metaItem}>
      <Text style={S.metaLabel}>Currency</Text>
      <Text style={S.metaValue}>{journal?.currency || '-'}</Text>
    </View>
    <View style={S.metaItem}>
      <Text style={S.metaLabel}>Division</Text>
      <Text style={S.metaValue}>{journal?.divisionName || '-'}</Text>
    </View>
    <View style={S.metaItem}>
      <Text style={S.metaLabel}>Branch</Text>
      <Text style={S.metaValue}>{journal?.branchName || '-'}</Text>
    </View>
    <View style={S.metaItem}>
      <Text style={S.metaLabel}>Warehouse</Text>
      <Text style={S.metaValue}>{journal?.warehouseName || '-'}</Text>
    </View>
    <View style={S.metaItem}>
      <Text style={S.metaLabel}>Notes</Text>
      <Text style={S.metaValue}>{journal?.notes || '-'}</Text>
    </View>
    <View style={S.metaItem}>
      <Text style={S.metaLabel}>Created By</Text>
      <Text style={S.metaValue}>{journal?.addedBy || '-'}</Text>
    </View>
  </View>
);

const JournalEntriesTable = ({ journal }) => {
  const entries = Array.isArray(journal?.journalEntries) ? journal.journalEntries : [];

  return (
    <View style={S.tableOuter}>
      <View style={S.tableWrap}>
        <View style={S.thead}>
          <Text style={[S.th, S.colAccount]}>Account</Text>
          <Text style={[S.th, S.colDesc]}>Description</Text>
          <Text style={[S.th, S.colContact]}>Contact</Text>
          <Text style={[S.thRight, S.colDr]}>Debit</Text>
          <Text style={[S.thRight, S.colCr]}>Credit</Text>
        </View>

        <View style={S.tableBody}>
          {entries.map((entry, index) => {
            const alt = index % 2 === 1;
            return (
              <View key={`entry-${index}`} style={[S.tr, alt && S.trAlt]} wrap={false}>
                <Text style={[S.td, S.colAccount]}>{entry?.account?.accountName || '-'}</Text>
                <Text style={[S.td, S.colDesc]}>{entry?.description || ''}</Text>
                <Text style={[S.td, S.colContact]}>{getContactName(entry)}</Text>
                <Text style={[S.tdRight, S.colDr]}>{entry?.debits ? formatAmount(entry.debits, false) : '-'}</Text>
                <Text style={[S.tdRight, S.colCr]}>{entry?.credits ? formatAmount(entry.credits, false) : '-'}</Text>
              </View>
            );
          })}

          <View style={[S.tr, S.totalRow]} wrap={false}>
            <Text style={[S.td, S.colAccount, S.tdBold, { textAlign: 'right', paddingRight: 8 }]}>Total</Text>
            <Text style={[S.td, S.colDesc]} />
            <Text style={[S.td, S.colContact]} />
            <Text style={[S.tdRight, S.colDr, S.tdBold]}>{formatAmount(journal?.totalDebits || 0, false)}</Text>
            <Text style={[S.tdRight, S.colCr, S.tdBold]}>{formatAmount(journal?.totalCredits || 0, false)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const PageBottomBar = () => (
  <>
    <View style={S.pageBottomBar} fixed>
      <View style={S.poweredByRow}>
        <Text style={S.poweredByText}>Powered by:</Text>
        <Image src={abssBrandingLogo} style={S.abssBrandingLogo} />
      </View>
    </View>
    <View style={S.pagePagination} fixed>
      <Text style={S.pagePaginationText} wrap={false} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </View>
  </>
);

export const manualJournalPdfFileName = journal => {
  const id = (journal?.manualJournalId || journal?.id || 'manual-journal').toString();
  return `${id.replace(/[^\w.-]+/g, '_')}.pdf`;
};

export const ManualJournalDetailPdf = ({ journal, profile }) => {
  if (!journal) return null;

  return (
    <Document>
      <Page size="A4" style={S.page}>
        <View style={S.outerBorder} fixed />
        <View style={S.pageContent}>
          <ReportTitleBanner journal={journal} />
          <CompanyHeader profile={profile} />
          <JournalMeta journal={journal} />
          <JournalEntriesTable journal={journal} />
        </View>
        <PageBottomBar />
      </Page>
    </Document>
  );
};
