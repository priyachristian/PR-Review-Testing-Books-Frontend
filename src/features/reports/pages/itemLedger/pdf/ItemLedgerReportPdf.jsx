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
  itemName: { fontSize: 11, fontWeight: 'bold', marginBottom: 1, textAlign: 'right' },
  itemLine: { fontSize: 8, color: LABEL_CLR, marginBottom: 1, textAlign: 'right', lineHeight: 1.35 },
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
  colDate: { width: '14%', textAlign: 'center' },
  colEffect: { width: '10%', textAlign: 'center' },
  colPosting: { width: '28%', textAlign: 'left' },
  colDocNo: { width: '16%', textAlign: 'left' },
  colQty: { width: '14%', textAlign: 'right' },
  colQtyBal: { width: '18%', textAlign: 'right' },
  poweredByRow: { flexDirection: 'row', alignItems: 'center' },
  poweredByText: { fontSize: 7.5, color: LABEL_CLR, marginRight: 4 },
  abssBrandingLogo: { width: 54, objectFit: 'contain' },
});

const formatAmountCellPdfLines = (val, maxChars = 14) => {
  const str = val == null || val === '' ? '' : typeof val === 'number' ? val.toLocaleString() : String(val);
  if (!str || str.length <= maxChars) return str;
  const i = str.indexOf(',', Math.floor(str.length / 2));
  return i > -1 ? `${str.slice(0, i + 1)}\n${str.slice(i + 1)}` : str;
};

const formatQty = value => {
  if (value == null || value === '') return '';
  const num = Number(value);
  if (Number.isNaN(num)) return formatAmountCellPdfLines(value);
  return formatAmountCellPdfLines(num);
};

const formatQtyCell = record => {
  if (record?.isBalanceRow) return '';
  const qty = record?.quantity || 0;
  const effect = record?.effectType;
  const prefix = qty === 0 ? '' : effect === 'IN' ? '+' : '';
  return `${prefix}${formatQty(qty)}`;
};

function buildPages(records, openingBalance) {
  const recordList = Array.isArray(records) ? records : [];
  const len = recordList.length;

  const pages = [];
  let i = 0;
  let currentPage = 1;

  while (i < Math.max(len, 1)) {
    const recordsPerPage = currentPage === 1 ? RECORDS_FIRST_PAGE : RECORDS_PER_PAGE;
    const pageRecords = recordList.slice(i, i + recordsPerPage);

    const broughtForward = i === 0 ? (openingBalance ?? 0) : (recordList[i - 1]?.QuantityBalance ?? openingBalance ?? 0);
    const lastRecord = pageRecords[pageRecords.length - 1];
    const carriedForward = lastRecord ? (lastRecord.QuantityBalance ?? broughtForward) : broughtForward;

    pages.push({ currentPage, totalPages: 0, pageRecords, recordsPerPage, broughtForward, carriedForward });

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
      <Text style={S.reportTitleMain}>Item Ledger</Text>
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

const HeaderFirst = ({ profile, selectedItemName, selectedItemSku }) => {
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
        {selectedItemName ? (
          <View style={S.headerRight}>
            <Text style={S.itemName}>{selectedItemName}</Text>
            {selectedItemSku ? <Text style={S.itemLine}>Item No: {selectedItemSku}</Text> : null}
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

const BalanceRow = ({ label, value }) => (
  <View style={[S.tr, S.trAlt]} wrap={false}>
    <Text style={[S.td, S.colDate]} />
    <Text style={[S.td, S.colEffect]} />
    <Text style={[S.td, S.colPosting, S.tdBold]}>{label}</Text>
    <Text style={[S.td, S.colDocNo]} />
    <Text style={[S.td, S.colQty]} />
    <Text style={[S.td, S.colQtyBal, S.tdBold]}>{formatQty(value)}</Text>
  </View>
);

const LedgerTable = ({ pageData, openingBalance, closingBalance }) => {
  const { currentPage, totalPages, pageRecords, recordsPerPage, broughtForward, carriedForward } = pageData;
  const isLastPage = currentPage === totalPages;

  return (
    <View style={S.tableOuter}>
      <View style={S.tableWrap}>
        <View style={S.thead}>
          <Text style={[S.th, S.colDate]}>Date</Text>
          <Text style={[S.th, S.colEffect]}>Effect</Text>
          <Text style={[S.th, S.colPosting]}>Posting Document</Text>
          <Text style={[S.th, S.colDocNo]}>Doc No</Text>
          <Text style={[S.th, S.colQty]}>QTY</Text>
          <Text style={[S.th, S.colQtyBal]}>QTY Balance</Text>
        </View>

        <View style={S.tableBody}>
          {currentPage === 1 ? <BalanceRow label="Opening Quantity" value={openingBalance ?? 0} /> : <BalanceRow label="Brought Forward" value={broughtForward} />}

          <View style={S.dataRowsBlock}>
            {pageRecords.map((record, index) => {
              const alt = index % 2 === 1;
              const date = dateFormateForUi(record?.date);
              const prevDate = index === 0 ? '' : dateFormateForUi(pageRecords[index - 1]?.date);

              return (
                <View key={`${record?.date}-${index}-${record?.refNo}`} style={[S.tr, alt && S.trAlt]}>
                  <Text style={[S.td, S.colDate]}>{date !== prevDate ? date : ''}</Text>
                  <Text style={[S.td, S.colEffect]}>{record?.effectType || ''}</Text>
                  <Text style={[S.td, S.colPosting]}>{record?.referenceType || ''}</Text>
                  <Text style={[S.td, S.colDocNo]}>{record?.refNo || ''}</Text>
                  <Text style={[S.td, S.colQty]}>{formatQtyCell(record)}</Text>
                  <Text style={[S.td, S.colQtyBal]}>{formatQty(record?.QuantityBalance)}</Text>
                </View>
              );
            })}
            {!isLastPage
              ? Array.from({ length: Math.max(0, recordsPerPage - pageRecords.length) }).map((_, i) => (
                  <View key={`empty-${i}`} style={[S.tr, (pageRecords.length + i) % 2 === 1 && S.trAlt, S.emptyRow]}>
                    <Text style={[S.td, S.colDate]}> </Text>
                    <Text style={[S.td, S.colEffect]}> </Text>
                    <Text style={[S.td, S.colPosting]}> </Text>
                    <Text style={[S.td, S.colDocNo]}> </Text>
                    <Text style={[S.td, S.colQty]}> </Text>
                    <Text style={[S.td, S.colQtyBal]}> </Text>
                  </View>
                ))
              : null}
          </View>

          {isLastPage ? <BalanceRow label="Closing Quantity" value={closingBalance ?? 0} /> : <BalanceRow label="Carried Forward" value={carriedForward} />}
        </View>
      </View>
    </View>
  );
};

export const ItemLedgerReportPdf = ({ records, profile, selectedItemName = '', selectedItemSku = '', startDate, endDate, openingBalance, closingBalance }) => {
  const { pages } = buildPages(records, openingBalance);

  return (
    <Document>
      {pages.map((pageData, idx) => (
        <Page key={idx} size="A4" style={S.page}>
          <View style={S.outerBorder} fixed />
          <View style={S.pageContent} wrap={false}>
            {idx === 0 ? <ReportTitleBanner startDate={startDate} endDate={endDate} records={records} /> : null}
            <HeaderFirst profile={profile} selectedItemName={selectedItemName} selectedItemSku={selectedItemSku} />
            <LedgerTable pageData={pageData} openingBalance={openingBalance} closingBalance={closingBalance} />
          </View>
          <PageBottomBar currentPage={pageData.currentPage} totalPages={pageData.totalPages} />
        </Page>
      ))}
    </Document>
  );
};
