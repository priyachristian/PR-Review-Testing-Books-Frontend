import { Document, Font, Image, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

import abssBrandingLogo from '@/assets/images/ABSS-LOGO.png';
import notoSansRegular from '@/assets/fonts/NotoSans-Regular.ttf';
import notoSansBold from '@/assets/fonts/NotoSans-Bold.ttf';
import { PAYMENT_MADE_STATUS, PAYMENT_RECEIVED_STATUS, PAYMENT_MODES } from '@/utils/constants';
import { resolveProfile, resolveDocumentCurrency, formatPdfAmount } from 'utils/pdfUtils';
import { dateFormateForUi } from 'utils/services';

Font.register({
  family: 'NotoSans',
  fonts: [
    { src: notoSansRegular, fontWeight: 400 },
    { src: notoSansBold, fontWeight: 700 },
  ],
});

const BORDER = '#D1D5DB';
const BORDER_DARK = '#000000';
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
  headerLeft: { flexDirection: 'row', alignItems: 'flex-start', width: '100%', paddingRight: 8 },
  headerLeftText: { flex: 1, minWidth: 0, maxWidth: '100%' },
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
  metaItem: { width: '33.33%', paddingRight: 8, marginBottom: 6 },
  metaItemWide: { width: '100%', paddingRight: 8, marginBottom: 6 },
  metaLabel: { fontSize: 7.5, color: LABEL_CLR, marginBottom: 2 },
  metaValue: { fontSize: 8.5, fontWeight: 'bold', color: TEXT_CLR },
  amountText: { fontFamily: 'NotoSans', fontSize: 8.5, fontWeight: 'bold', color: TEXT_CLR },
  sectionTitle: { fontSize: 9, fontWeight: 'bold', marginBottom: 6, marginTop: 4 },
  tableOuter: { flexDirection: 'column', marginTop: 4 },
  tableWrap: { flexDirection: 'column', borderWidth: 0.75, borderColor: BORDER_DARK },
  thead: { flexDirection: 'row', backgroundColor: ROW_ALT, borderBottomWidth: 0.75, borderBottomColor: BORDER_DARK },
  th: { fontSize: 7.5, fontWeight: 'bold', paddingHorizontal: 3, paddingVertical: 5 },
  thRight: { fontSize: 7.5, fontWeight: 'bold', paddingHorizontal: 3, paddingVertical: 5, textAlign: 'right' },
  tr: { flexDirection: 'row', borderTopWidth: 0.5, borderTopColor: BORDER },
  trAlt: { backgroundColor: ROW_ALT },
  td: { fontSize: 8, paddingHorizontal: 3, paddingVertical: 3 },
  tdRight: { fontSize: 8, paddingHorizontal: 3, paddingVertical: 3, textAlign: 'right' },
  amountCell: { fontFamily: 'NotoSans', fontSize: 8, paddingHorizontal: 3, paddingVertical: 3, textAlign: 'right' },
  tdSub: { fontSize: 7, color: LABEL_CLR, marginTop: 1 },
  colDoc: { width: '18%' },
  colDate: { width: '14%' },
  colApplied: { width: '14%' },
  colAmount: { width: '18%' },
  colDue: { width: '18%' },
  colPayment: { width: '18%' },
  pageBottomBar: { position: 'absolute', left: PAGE_PAD, right: PAGE_PAD, bottom: 14, flexDirection: 'row', alignItems: 'center' },
  pagePagination: { position: 'absolute', left: 0, right: 0, bottom: 14, alignItems: 'center', justifyContent: 'center' },
  pagePaginationText: { fontSize: 9, color: LABEL_CLR, textAlign: 'center' },
  poweredByRow: { flexDirection: 'row', alignItems: 'center' },
  poweredByText: { fontSize: 7.5, color: LABEL_CLR, marginRight: 4 },
  abssBrandingLogo: { width: 62, objectFit: 'contain' },
});

const formatEnumKey = key => {
  if (!key) return '-';
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const getPartyName = (data, variant) => (variant === 'made' ? data?.vendorId?.customerDisplayName : data?.customerId?.customerDisplayName) || '-';

const getDocId = (data, variant) => (variant === 'made' ? data?.paymentMadeId : data?.paymentReceivedId) || '-';

const getAmount = (data, variant) => (variant === 'made' ? data?.paymentMade : data?.amountReceived) || 0;

const getStatusLabel = (data, variant) => {
  const status = data?.status;
  const map = variant === 'made' ? PAYMENT_MADE_STATUS : PAYMENT_RECEIVED_STATUS;
  return map?.[status] || status || '-';
};

const buildLineItems = (data, variant) => {
  const lines = [];

  (data?.openingBalanceTransactions || []).forEach(ob => {
    const t = ob.openingBalanceTransaction || {};
    lines.push({
      docNo: ob.transactionNo || t.transactionNo || '-',
      docDate: t.date,
      appliedDate: ob.appliedDate,
      docAmount: t.amount,
      amountDue: t.remainingAmount,
      payment: ob.amountApplied,
      isOpeningBalance: true,
    });
  });

  if (variant === 'made') {
    (data?.bills || []).forEach(row => {
      lines.push({
        docNo: row?.billNo || '-',
        docDate: row?.billId?.billDate,
        appliedDate: row?.appliedDate,
        docAmount: row?.billId?.total,
        amountDue: row?.billId?.balanceAmount,
        payment: row?.amountApplied,
      });
    });
  } else {
    (data?.invoices || []).forEach(row => {
      lines.push({
        docNo: row?.invoiceNo || '-',
        docDate: row?.invoiceId?.invoiceDate,
        appliedDate: row?.appliedDate,
        docAmount: row?.invoiceId?.total,
        amountDue: row?.invoiceId?.balanceAmount,
        payment: row?.amountApplied,
      });
    });
  }

  return lines;
};

export const paymentPdfFileName = (data, variant) => {
  const id = getDocId(data, variant)
    .toString()
    .replace(/[^\w.-]+/g, '_');
  const party = getPartyName(data, variant)
    .replace(/[^a-zA-Z0-9\s]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 50)
    .replace(/^_|_$/g, '');
  return `${id}_${party || 'Party'}.pdf`;
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

const PaymentMeta = ({ data, variant, currency }) => {
  const isCheque = data?.paymentMode === PAYMENT_MODES.CHEQUE;

  return (
    <View style={S.metaGrid} wrap={false}>
      <View style={S.metaItem}>
        <Text style={S.metaLabel}>Party Name</Text>
        <Text style={S.metaValue}>{getPartyName(data, variant)}</Text>
      </View>
      <View style={S.metaItem}>
        <Text style={S.metaLabel}>Payment Date</Text>
        <Text style={S.metaValue}>{data?.paymentDate ? dateFormateForUi(data.paymentDate) : '-'}</Text>
      </View>
      <View style={S.metaItem}>
        <Text style={S.metaLabel}>{variant === 'made' ? 'Amount Paid' : 'Amount Received'}</Text>
        <Text style={[S.metaValue, S.amountText]}>{formatPdfAmount(getAmount(data, variant), currency)}</Text>
      </View>
      <View style={S.metaItem}>
        <Text style={S.metaLabel}>Payment Mode</Text>
        <Text style={S.metaValue}>{formatEnumKey(data?.paymentMode)}</Text>
      </View>
      <View style={S.metaItem}>
        <Text style={S.metaLabel}>Status</Text>
        <Text style={S.metaValue}>{getStatusLabel(data, variant)}</Text>
      </View>
      {data?.paidThroughAccountId || data?.depositToAccountId ? (
        <View style={S.metaItem}>
          <Text style={S.metaLabel}>{data?.paidThroughAccountId ? 'Paid Through' : 'Deposit To'}</Text>
          <Text style={S.metaValue}>{(data?.paidThroughAccountId || data?.depositToAccountId)?.accountName || '-'}</Text>
        </View>
      ) : null}
      {data?.taxDeducted && data?.tdsAccountId ? (
        <View style={S.metaItem}>
          <Text style={S.metaLabel}>TDS</Text>
          <Text style={S.metaValue}>
            {formatPdfAmount(
              (data?.invoices || []).reduce((sum, row) => sum + (Number(row?.tdsAmount) || 0), 0),
              currency
            )}
          </Text>
        </View>
      ) : null}
      {data?.reference ? (
        <View style={S.metaItem}>
          <Text style={S.metaLabel}>Reference</Text>
          <Text style={S.metaValue}>{data.reference}</Text>
        </View>
      ) : null}
      {isCheque ? (
        <>
          <View style={S.metaItem}>
            <Text style={S.metaLabel}>Cheque Status</Text>
            <Text style={S.metaValue}>{formatEnumKey(data?.chequeStatus)}</Text>
          </View>
          {variant === 'made' ? (
            <View style={S.metaItem}>
              <Text style={S.metaLabel}>PDC Cheque Date</Text>
              <Text style={S.metaValue}>{data?.pdcChequeDate ? dateFormateForUi(data.pdcChequeDate) : '-'}</Text>
            </View>
          ) : (
            <>
              <View style={S.metaItem}>
                <Text style={S.metaLabel}>Deposit Date</Text>
                <Text style={S.metaValue}>{data?.depositDate ? dateFormateForUi(data.depositDate) : '-'}</Text>
              </View>
              <View style={S.metaItem}>
                <Text style={S.metaLabel}>Clearing Date</Text>
                <Text style={S.metaValue}>{data?.clearingDate ? dateFormateForUi(data.clearingDate) : '-'}</Text>
              </View>
            </>
          )}
        </>
      ) : null}
      {data?.notes ? (
        <View style={S.metaItemWide}>
          <Text style={S.metaLabel}>Notes</Text>
          <Text style={S.metaValue}>{data.notes}</Text>
        </View>
      ) : null}
    </View>
  );
};

const ApplicationsTable = ({ data, variant, currency }) => {
  const lines = buildLineItems(data, variant);
  const docLabel = variant === 'made' ? 'Bill ID' : 'Invoice ID';
  const amountLabel = variant === 'made' ? 'Bill Amount' : 'Invoice Amount';
  const emptyLabel = variant === 'made' ? 'No bill or opening balance applications' : 'No invoice or opening balance applications';

  return (
    <View style={S.tableOuter}>
      <Text style={S.sectionTitle}>{variant === 'made' ? 'Bill Details' : 'Invoice Details'}</Text>
      <View style={S.tableWrap}>
        <View style={S.thead}>
          <Text style={[S.th, S.colDoc]}>{docLabel}</Text>
          <Text style={[S.th, S.colDate]}>{variant === 'made' ? 'Bill Date' : 'Invoice Date'}</Text>
          <Text style={[S.th, S.colApplied]}>Applied Date</Text>
          <Text style={[S.thRight, S.colAmount]}>{amountLabel}</Text>
          <Text style={[S.thRight, S.colDue]}>Amount Due</Text>
          <Text style={[S.thRight, S.colPayment]}>Payment</Text>
        </View>
        {lines.length === 0 ? (
          <View style={S.tr} wrap={false}>
            <Text style={[S.td, { width: '100%', textAlign: 'center', paddingVertical: 8 }]}>{emptyLabel}</Text>
          </View>
        ) : (
          lines.map((line, index) => (
            <View key={`line-${index}`} style={[S.tr, index % 2 === 1 && S.trAlt]} wrap={false}>
              <View style={[S.td, S.colDoc]}>
                <Text>{line.docNo}</Text>
                {line.isOpeningBalance ? <Text style={S.tdSub}>(Opening balance)</Text> : null}
              </View>
              <Text style={[S.td, S.colDate]}>{line.docDate ? dateFormateForUi(line.docDate) : '-'}</Text>
              <Text style={[S.td, S.colApplied]}>{line.appliedDate ? dateFormateForUi(line.appliedDate) : '-'}</Text>
              <Text style={[S.amountCell, S.colAmount]}>{line.docAmount != null ? formatPdfAmount(line.docAmount, currency) : '-'}</Text>
              <Text style={[S.amountCell, S.colDue]}>{line.amountDue != null ? formatPdfAmount(line.amountDue, currency) : '-'}</Text>
              <Text style={[S.amountCell, S.colPayment]}>{formatPdfAmount(line.payment || 0, currency)}</Text>
            </View>
          ))
        )}
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

const PaymentDetailPdf = ({ data, profile, variant = 'received' }) => {
  if (!data) return null;

  const title = variant === 'made' ? 'Payment Made' : 'Payment Received';
  const currency = resolveDocumentCurrency(data, profile);

  return (
    <Document>
      <Page size="A4" style={S.page}>
        <View style={S.outerBorder} fixed />
        <View style={S.pageContent}>
          <View style={S.reportTitleBlock} wrap={false}>
            <Text style={S.reportTitleMain}>{title}</Text>
            <Text style={S.reportSubtitle}>{getDocId(data, variant)}</Text>
          </View>
          <CompanyHeader profile={profile} />
          <PaymentMeta data={data} variant={variant} currency={currency} />
          <ApplicationsTable data={data} variant={variant} currency={currency} />
        </View>
        <PageBottomBar />
      </Page>
    </Document>
  );
};

export default PaymentDetailPdf;
