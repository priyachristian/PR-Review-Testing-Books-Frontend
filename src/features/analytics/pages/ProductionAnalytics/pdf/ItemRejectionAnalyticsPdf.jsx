import { Document, Image, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

import abssBrandingLogo from '@/assets/images/ABSS-LOGO.png';
import { dateFormateForUi } from 'utils/services';
import { resolveProfile } from 'utils/pdfUtils';

const RECORDS_FIRST_PAGE = 40;
const RECORDS_PER_PAGE = 46;

const BORDER = '#D1D5DB';
const BORDER_DARK = '#9CA3AF';
const LABEL_CLR = '#4B5563';
const TEXT_CLR = '#111827';
const ROW_ALT = '#F3F4F6';
const WHITE = '#FFFFFF';

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
  pageContent: { flexDirection: 'column' },
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
    width: '100%',
    paddingRight: 6,
  },
  headerLeftText: { flex: 1, minWidth: 0, maxWidth: '100%' },
  companyLogo: { height: 30, width: 64, objectFit: 'contain', marginRight: 6, flexShrink: 0 },
  companyName: { fontSize: 11, fontWeight: 'bold', marginBottom: 1 },
  addrLine: { fontSize: 8, color: LABEL_CLR, marginBottom: 1, lineHeight: 1.35 },
  pagePagination: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pagePaginationText: { fontSize: 9, color: LABEL_CLR, textAlign: 'center' },
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
  tableOuter: { flexDirection: 'column', marginTop: 2 },
  tableWrap: { flexDirection: 'column', borderWidth: 0.75, borderColor: BORDER_DARK },
  thead: { flexDirection: 'row', backgroundColor: ROW_ALT, borderBottomWidth: 0.75, borderBottomColor: BORDER_DARK },
  th: { fontSize: 8, fontWeight: 'bold', paddingHorizontal: 3, paddingVertical: 3 },
  tr: { flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: BORDER },
  trAlt: { backgroundColor: ROW_ALT },
  td: { fontSize: 8.5, paddingHorizontal: 3, paddingVertical: 2 },
  colItemNo: { width: '11%' },
  colItemName: { width: '46%' },
  colOrderCount: { width: '14%', textAlign: 'right' },
  colItemTotal: { width: '14%', textAlign: 'right' },
  colPct: { width: '15%', textAlign: 'right' },
  poweredByRow: { flexDirection: 'row', alignItems: 'center' },
  poweredByText: { fontSize: 7.5, color: LABEL_CLR, marginRight: 4 },
  abssBrandingLogo: { width: 54, objectFit: 'contain' },
});

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

function resolveReportDateRange(startDate, endDate) {
  if (startDate && endDate) {
    return `From ${dateFormateForUi(startDate)} To ${dateFormateForUi(endDate)}`;
  }
  if (startDate) return `From ${dateFormateForUi(startDate)}`;
  if (endDate) return `To ${dateFormateForUi(endDate)}`;
  return '';
}

function buildPages(records) {
  const recordList = Array.isArray(records) ? records : [];
  const len = recordList.length;
  const pages = [];
  let i = 0;
  let currentPage = 1;

  while (i < Math.max(len, 1)) {
    const recordsPerPage = currentPage === 1 ? RECORDS_FIRST_PAGE : RECORDS_PER_PAGE;
    pages.push({
      currentPage,
      totalPages: 0,
      pageRecords: recordList.slice(i, i + recordsPerPage),
    });
    i += recordsPerPage;
    currentPage += 1;
  }

  const totalPages = pages.length;
  pages.forEach(page => {
    page.totalPages = totalPages;
  });

  return pages;
}

const ReportTitleBanner = ({ startDate, endDate }) => {
  const dateRange = resolveReportDateRange(startDate, endDate);
  return (
    <View style={S.reportTitleBlock}>
      <Text style={S.reportTitleMain}>Item Rejection Analytics</Text>
      {dateRange ? <Text style={S.reportDateRange}>{dateRange}</Text> : null}
    </View>
  );
};

const HeaderFirst = ({ profile }) => {
  const company = resolveProfile(profile);
  const companyAddress = buildAddressLines(company?.address);

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
      </View>
    </View>
  );
};

const SummaryBlock = ({ summary }) => {
  if (!summary) return null;

  const items = [
    { label: 'Production Orders', value: summary?.totalProductionOrders ?? 0 },
    { label: 'FG Rejected Qty', value: summary?.totalFgRejectedQty ?? 0 },
    { label: 'RM Rejected Qty', value: summary?.totalRawMaterialRejectedQty ?? 0 },
    { label: 'Total Rejected Qty', value: summary?.totalRejectedQty ?? 0 },
    { label: 'Overall Rejection %', value: `${summary?.overallRejectionPercentage ?? 0}%` },
  ];

  return (
    <View style={S.summaryRow} wrap={false}>
      {items.map(item => (
        <View key={item.label} style={S.summaryCol}>
          <Text style={S.summaryLabel}>{item.label}</Text>
          <Text style={S.summaryValue}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
};

const DataTable = ({ pageData, summary, isFirstPage }) => {
  const { pageRecords } = pageData;

  return (
    <View style={S.tableOuter}>
      <View style={S.tableWrap}>
        {isFirstPage ? <SummaryBlock summary={summary} /> : null}
        <View style={S.thead} wrap={false}>
          <Text style={[S.th, S.colItemNo]}>Item#</Text>
          <Text style={[S.th, S.colItemName]}>Item Name</Text>
          <Text style={[S.th, S.colOrderCount]}>Order Count</Text>
          <Text style={[S.th, S.colItemTotal]}>Rejected Qty</Text>
          <Text style={[S.th, S.colPct]}>Rej. %</Text>
        </View>
        {pageRecords.map((record, index) => {
          const alt = index % 2 === 1;
          return (
            <View key={`${record?.itemNo}-${index}`} style={[S.tr, alt && S.trAlt]} wrap={false}>
              <Text style={[S.td, S.colItemNo]}>{record?.itemNo || ''}</Text>
              <Text style={[S.td, S.colItemName]}>{record?.itemName || ''}</Text>
              <Text style={[S.td, S.colOrderCount]}>{record?.orderCount ?? 0}</Text>
              <Text style={[S.td, S.colItemTotal]}>{record?.totalRejectedQty ?? 0}</Text>
              <Text style={[S.td, S.colPct]}>{record?.rejectionPercentage != null ? `${record.rejectionPercentage}%` : ''}</Text>
            </View>
          );
        })}
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

export const ItemRejectionAnalyticsPdf = ({ records, profile, summary, startDate, endDate }) => {
  const pages = buildPages(records);

  return (
    <Document>
      {pages.map((pageData, idx) => (
        <Page key={idx} size="A4" style={S.page}>
          <View style={S.outerBorder} fixed />
          <View style={S.pageContent} wrap={false}>
            {idx === 0 ? <ReportTitleBanner startDate={startDate} endDate={endDate} /> : null}
            {idx === 0 ? <HeaderFirst profile={profile} /> : null}
            <DataTable pageData={pageData} summary={summary} isFirstPage={idx === 0} />
          </View>
          <PageBottomBar currentPage={pageData.currentPage} totalPages={pageData.totalPages} />
        </Page>
      ))}
    </Document>
  );
};
