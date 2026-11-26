import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

import { dateFormateForUi } from 'utils/services';
import { colorPalette } from '@/utils/theme';
import { S, ReportTitleBanner, CompanyHeader, PageBottomBar, buildPages } from './MatchingReportPdf';

const EXPIRED_CLR = colorPalette.warning[700];

const C = StyleSheet.create({
  colItem: { width: '52%', textAlign: 'left' },
  colMfg: { width: '20%', textAlign: 'center' },
  colReceived: { width: '14%', textAlign: 'right' },
  colExpired: { width: '14%', textAlign: 'right' },
});

const ExpiryTable = ({ pageItems, isLastPage, totals }) => (
  <View style={S.tableOuter}>
    <View style={S.tableWrap}>
      <View style={S.thead}>
        <Text style={[S.th, C.colItem]}>Item</Text>
        <Text style={[S.thCenter, C.colMfg]}>Mfg Date</Text>
        <Text style={[S.thRight, C.colReceived]}>Received</Text>
        <Text style={[S.thRight, C.colExpired]}>Expired</Text>
      </View>

      <View style={S.tableBody}>
        {pageItems.map((item, index) => (
          <View key={item?.id || index} style={[S.tr, index % 2 === 1 && S.trAlt]}>
            <Text style={[S.td, C.colItem]}>{[item?.series, item?.watt].filter(Boolean).join(' · ')}</Text>
            <Text style={[S.tdCenter, C.colMfg]}>{item?.expiredMfgDate ? dateFormateForUi(item.expiredMfgDate) : '-'}</Text>
            <Text style={[S.tdRight, C.colReceived]}>{item?.received ?? ''}</Text>
            <Text style={[S.tdRight, C.colExpired, S.tdBold, { color: EXPIRED_CLR }]}>{item?.expired ?? 0}</Text>
          </View>
        ))}

        {isLastPage && totals ? (
          <View style={[S.tr, S.totalRow]}>
            <Text style={[S.td, C.colItem, S.tdBold]}>Total</Text>
            <Text style={[S.tdCenter, C.colMfg]} />
            <Text style={[S.tdRight, C.colReceived, S.tdBold]}>{totals.received}</Text>
            <Text style={[S.tdRight, C.colExpired, S.tdBold, { color: EXPIRED_CLR }]}>{totals.expired}</Text>
          </View>
        ) : null}
      </View>
    </View>
  </View>
);

export const ExpiryReportPdf = ({ rej, items, totals, profile }) => {
  const pages = buildPages(items);

  return (
    <Document>
      {pages.map((pageItems, idx) => (
        <Page key={idx} size="A4" style={S.page}>
          <View style={S.outerBorder} fixed />
          <View style={S.pageContent} wrap={false}>
            {idx === 0 ? <ReportTitleBanner rej={rej} title="Warranty Expiry Report" /> : null}
            <CompanyHeader profile={profile} />
            <ExpiryTable pageItems={pageItems} isLastPage={idx === pages.length - 1} totals={totals} />
          </View>
          <PageBottomBar currentPage={idx + 1} totalPages={pages.length} />
        </Page>
      ))}
    </Document>
  );
};

export default ExpiryReportPdf;
