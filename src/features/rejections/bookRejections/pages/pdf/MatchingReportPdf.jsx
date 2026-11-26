import { Document, Image, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

import abssBrandingLogo from '@/assets/images/ABSS-LOGO.png';
import { dateFormateForUi } from 'utils/services';
import { resolveProfile } from 'utils/pdfUtils';
import { colorPalette } from '@/utils/theme';

const ROWS_FIRST_PAGE = 28;
const ROWS_PER_PAGE = 34;

const BORDER = colorPalette.secondary[300];
const BORDER_DARK = colorPalette.secondary[400];
const LABEL_CLR = colorPalette.secondary[600];
const TEXT_CLR = colorPalette.secondary[900];
const ROW_ALT = colorPalette.secondary[100];
const WHITE = '#FFFFFF';
const GREEN = colorPalette.success[600];
const RED = colorPalette.error[600];

const PAGE_PAD = 28;
const FOOTER_H = 44;
const BORDER_INSET = 6;
const BOTTOM_RESERVE = FOOTER_H + BORDER_INSET;

export const S = StyleSheet.create({
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
  reportSubLine: { fontSize: 9, textAlign: 'center', color: LABEL_CLR },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 0.75,
    borderBottomColor: BORDER_DARK,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'flex-start', width: '100%', paddingRight: 8 },
  headerLeftText: { flex: 1, minWidth: 0, maxWidth: '100%' },
  companyLogo: { height: 36, width: 76, objectFit: 'contain', marginRight: 8, flexShrink: 0 },
  companyName: { fontSize: 11, fontWeight: 'bold', marginBottom: 3 },
  addrLine: { fontSize: 8, color: LABEL_CLR, marginBottom: 2, lineHeight: 1.35 },
  tableOuter: { flexDirection: 'column', marginTop: 4 },
  tableWrap: { flexDirection: 'column', borderWidth: 0.75, borderColor: BORDER_DARK },
  tableBody: { flexDirection: 'column' },
  thead: { flexDirection: 'row', backgroundColor: ROW_ALT, borderBottomWidth: 0.75, borderBottomColor: BORDER_DARK },
  th: { fontSize: 8, fontWeight: 'bold', paddingHorizontal: 4, paddingVertical: 5 },
  thRight: { fontSize: 8, fontWeight: 'bold', paddingHorizontal: 4, paddingVertical: 5, textAlign: 'right' },
  thCenter: { fontSize: 8, fontWeight: 'bold', paddingHorizontal: 4, paddingVertical: 5, textAlign: 'center' },
  tr: { flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: BORDER },
  trAlt: { backgroundColor: ROW_ALT },
  td: { fontSize: 8.5, paddingHorizontal: 4, paddingVertical: 3 },
  tdRight: { fontSize: 8.5, paddingHorizontal: 4, paddingVertical: 3, textAlign: 'right' },
  tdCenter: { fontSize: 8.5, paddingHorizontal: 4, paddingVertical: 3, textAlign: 'center' },
  tdBold: { fontWeight: 'bold' },
  colItem: { width: '46%', textAlign: 'left' },
  colBooked: { width: '14%', textAlign: 'right' },
  colReceived: { width: '14%', textAlign: 'right' },
  colDiff: { width: '13%', textAlign: 'right' },
  colStatus: { width: '13%', textAlign: 'center' },
  totalRow: { borderTopWidth: 0.75, borderTopColor: TEXT_CLR, backgroundColor: ROW_ALT },
  pageBottomBar: { position: 'absolute', left: PAGE_PAD, right: PAGE_PAD, bottom: 14, flexDirection: 'row', alignItems: 'center' },
  pagePagination: { position: 'absolute', left: 0, right: 0, bottom: 14, alignItems: 'center', justifyContent: 'center' },
  pagePaginationText: { fontSize: 9, color: LABEL_CLR, textAlign: 'center' },
  poweredByRow: { flexDirection: 'row', alignItems: 'center' },
  poweredByText: { fontSize: 7.5, color: LABEL_CLR, marginRight: 4 },
  abssBrandingLogo: { width: 62, objectFit: 'contain' },
});

export const ReportTitleBanner = ({ rej, title = 'Matching Report' }) => (
  <View style={S.reportTitleBlock} wrap={false}>
    <Text style={S.reportTitleMain}>
      {title} - {rej?.no || ''}
    </Text>
    <Text style={S.reportSubLine}>{[rej?.customer, [rej?.city, rej?.state].filter(Boolean).join(', ')].filter(Boolean).join(' · ')}</Text>
    <Text style={S.reportSubLine}>Generated on {dateFormateForUi(new Date())}</Text>
  </View>
);

export const CompanyHeader = ({ profile }) => {
  const company = resolveProfile(profile);
  const addressLine1 = [company?.address?.street1, company?.address?.street2, company?.address?.city].filter(Boolean).join(', ');
  const addressLine2 = [company?.address?.state, company?.address?.country].filter(Boolean).join(', ') + (company?.address?.pinCode ? ` - ${company.address.pinCode}` : '');

  return (
    <View wrap={false}>
      <View style={S.headerRow}>
        <View style={S.headerLeft}>
          {company?.companyLogo ? (
            <Image source={{ uri: company.companyLogo, headers: { Pragma: 'no-cache', 'Cache-Control': 'no-cache' }, method: 'GET', body: undefined }} style={S.companyLogo} />
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

export const PageBottomBar = ({ currentPage, totalPages }) => (
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

const diffOf = item => (item?.received || 0) - (item?.booked || 0);

export function buildPages(items) {
  const list = Array.isArray(items) ? items : [];
  const pages = [];
  let i = 0;
  while (i < Math.max(list.length, 1)) {
    const perPage = pages.length === 0 ? ROWS_FIRST_PAGE : ROWS_PER_PAGE;
    pages.push(list.slice(i, i + perPage));
    i += perPage;
  }
  return pages;
}

const MatchingTable = ({ pageItems, isLastPage, totals }) => (
  <View style={S.tableOuter}>
    <View style={S.tableWrap}>
      <View style={S.thead}>
        <Text style={[S.th, S.colItem]}>Item</Text>
        <Text style={[S.thRight, S.colBooked]}>Booked</Text>
        <Text style={[S.thRight, S.colReceived]}>Received</Text>
        <Text style={[S.thRight, S.colDiff]}>Difference</Text>
        <Text style={[S.thCenter, S.colStatus]}>Status</Text>
      </View>

      <View style={S.tableBody}>
        {pageItems.map((item, index) => {
          const d = diffOf(item);
          const alt = index % 2 === 1;
          const label = [item?.series, item?.watt].filter(Boolean).join(' · ');
          return (
            <View key={item?.id || index} style={[S.tr, alt && S.trAlt]}>
              <Text style={[S.td, S.colItem]}>{label}</Text>
              <Text style={[S.tdRight, S.colBooked]}>{item?.booked ?? ''}</Text>
              <Text style={[S.tdRight, S.colReceived]}>{item?.received ?? ''}</Text>
              <Text style={[S.tdRight, S.colDiff, S.tdBold, { color: d === 0 ? GREEN : RED }]}>{d > 0 ? `+${d}` : d}</Text>
              <Text style={[S.tdCenter, S.colStatus, S.tdBold, { color: d === 0 ? GREEN : RED }]}>{d === 0 ? 'Matched' : 'Mismatch'}</Text>
            </View>
          );
        })}

        {isLastPage && totals ? (
          <View style={[S.tr, S.totalRow]}>
            <Text style={[S.td, S.colItem, S.tdBold]}>Total</Text>
            <Text style={[S.tdRight, S.colBooked, S.tdBold]}>{totals.booked}</Text>
            <Text style={[S.tdRight, S.colReceived, S.tdBold]}>{totals.received}</Text>
            <Text style={[S.tdRight, S.colDiff, S.tdBold, { color: totals.diff === 0 ? GREEN : RED }]}>{totals.diff > 0 ? `+${totals.diff}` : totals.diff}</Text>
            <Text style={[S.tdCenter, S.colStatus]} />
          </View>
        ) : null}
      </View>
    </View>
  </View>
);

export const MatchingReportPdf = ({ rej, profile }) => {
  const items = Array.isArray(rej?.items) ? rej.items : [];
  const pages = buildPages(items);
  const totalPages = pages.length;
  const totals = items.reduce((acc, i) => ({ booked: acc.booked + (i?.booked || 0), received: acc.received + (i?.received || 0), diff: acc.diff + diffOf(i) }), { booked: 0, received: 0, diff: 0 });

  return (
    <Document>
      {pages.map((pageItems, idx) => (
        <Page key={idx} size="A4" style={S.page}>
          <View style={S.outerBorder} fixed />
          <View style={S.pageContent} wrap={false}>
            {idx === 0 ? <ReportTitleBanner rej={rej} /> : null}
            <CompanyHeader profile={profile} />
            <MatchingTable pageItems={pageItems} isLastPage={idx === totalPages - 1} totals={totals} />
          </View>
          <PageBottomBar currentPage={idx + 1} totalPages={totalPages} />
        </Page>
      ))}
    </Document>
  );
};

export default MatchingReportPdf;
