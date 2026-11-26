import { Document, Image, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

import abssBrandingLogo from '@/assets/images/ABSS-LOGO.png';
import { dateFormateForUi } from 'utils/services';
import { colorPalette } from '@/utils/theme';
import { PRODUCTION_MODULE_METHOD_LABEL } from '@/utils/constants';

/* ─── Design tokens ───────────────────────────────────────────── */
const PRIMARY = colorPalette.primary[500];
const PRIMARY_SOFT = colorPalette.primary[50];
const BORDER = colorPalette.neutral[200];
const BORDER_DARK = colorPalette.neutral[400];
const LABEL_CLR = colorPalette.neutral[600];
const TEXT_CLR = colorPalette.neutral[900];
const HEADING_CLR = colorPalette.neutral[900];
const ROW_ALT = colorPalette.neutral[100];
const WHITE = '#ffffff';

const PAGE_PAD = 28;
const FOOTER_H = 44;

/* ─── Styles ──────────────────────────────────────────────────── */
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

  /* ── Outer border ── */
  outerBorder: {
    position: 'absolute',
    top: PAGE_PAD - 6,
    left: PAGE_PAD - 6,
    right: PAGE_PAD - 6,
    bottom: FOOTER_H + 6,
    borderWidth: 0.75,
    borderColor: BORDER_DARK,
    borderStyle: 'solid',
  },

  /* ── Header ── */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 0.75,
    borderBottomColor: BORDER_DARK,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  companyLogo: {
    height: 36,
    width: 76,
    objectFit: 'contain',
  },
  companyName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: TEXT_CLR,
    marginBottom: 3,
  },
  companySubLine: {
    fontSize: 7.5,
    color: LABEL_CLR,
    marginBottom: 3,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  docTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: TEXT_CLR,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  orderBadge: {
    backgroundColor: PRIMARY_SOFT,
    borderWidth: 1,
    borderColor: PRIMARY,
    borderRadius: 2,
    paddingHorizontal: 9,
    paddingVertical: 3,
    alignSelf: 'flex-end',
  },
  orderBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: PRIMARY,
  },

  /* ── Created By meta line ── */
  createdByRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  createdByLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: LABEL_CLR,
    marginRight: 4,
  },
  createdByValue: {
    fontSize: 8.5,
    color: TEXT_CLR,
  },

  /* ── Section label ── */
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: HEADING_CLR,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginRight: 8,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: BORDER,
  },

  /* ── Info grid ── */
  infoGrid: {
    flexDirection: 'row',
    borderWidth: 0.75,
    borderColor: BORDER_DARK,
    marginBottom: 14,
  },
  infoCol: {
    flex: 1,
  },
  infoColDivider: {
    width: 0.75,
    backgroundColor: BORDER_DARK,
  },
  infoRow: {
    flexDirection: 'row',
    minHeight: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  infoRowAlt: {
    backgroundColor: ROW_ALT,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    width: '30%',
    paddingHorizontal: 7,
    paddingVertical: 4,
    fontSize: 8,
    fontWeight: 'bold',
    color: LABEL_CLR,
    borderRightWidth: 0.5,
    borderRightColor: BORDER,
    justifyContent: 'center',
  },
  infoValue: {
    flex: 1,
    paddingHorizontal: 7,
    paddingVertical: 4,
    fontSize: 8.5,
    color: TEXT_CLR,
    justifyContent: 'center',
  },

  /* ── Raw materials table ── */
  tableWrap: {
    borderWidth: 0.75,
    borderColor: BORDER_DARK,
    marginBottom: 12,
  },
  tableHead: {
    flexDirection: 'row',
    backgroundColor: ROW_ALT,
    borderBottomWidth: 0.75,
    borderBottomColor: BORDER_DARK,
  },
  tableHeadCell: {
    fontSize: 8,
    fontWeight: 'bold',
    color: HEADING_CLR,
  },
  tableRow: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    borderTopColor: BORDER,
  },
  tableRowAlt: {
    backgroundColor: ROW_ALT,
  },
  tableCell: {
    fontSize: 8.5,
    color: TEXT_CLR,
  },
  colItem: {
    width: '58%',
    alignSelf: 'stretch',
    justifyContent: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRightWidth: 0.75,
    borderRightColor: BORDER_DARK,
  },
  colQty: {
    width: '21%',
    alignSelf: 'stretch',
    justifyContent: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRightWidth: 0.75,
    borderRightColor: BORDER_DARK,
  },
  colIssued: {
    width: '21%',
    alignSelf: 'stretch',
    justifyContent: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 5,
  },

  /* ── Footer ── */
  footer: {
    position: 'absolute',
    left: PAGE_PAD - 6,
    right: PAGE_PAD - 6,
    bottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: BORDER_DARK,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 7.5,
    color: LABEL_CLR,
  },
  abssBrandingLogo: {
    width: 62,
    marginLeft: 3,
  },
  footerRight: {
    fontSize: 7.5,
    color: LABEL_CLR,
  },
});

/* ─── Helpers ─────────────────────────────────────────────────── */
const formatWorkerNames = list =>
  Array.isArray(list) && list.length > 0
    ? list
        .map(w => w?.workerName)
        .filter(Boolean)
        .join(', ') || 'N/A'
    : 'N/A';

/* ─── Reusable section heading ────────────────────────────────── */
const SectionHeading = ({ title }) => (
  <View style={S.sectionRow}>
    <Text style={S.sectionLabel}>{title}</Text>
    <View style={S.sectionLine} />
  </View>
);

/* ─── Info row component ──────────────────────────────────────── */
const InfoRow = ({ label, value, alt = false, last = false }) => (
  <View style={[S.infoRow, alt && S.infoRowAlt, last && S.infoRowLast]} wrap={false}>
    <View style={S.infoLabel}>
      <Text>{label}</Text>
    </View>
    <View style={S.infoValue}>
      <Text>{value || '-'}</Text>
    </View>
  </View>
);

/* ─── Main component ──────────────────────────────────────────── */
export const ProductionOrderDetailPdf = ({ data, profile }) => {
  if (!data) return null;

  const submittedFgPcs = `${(data?.totalFgRejectedQty || 0) + (data?.totalFgSubmittedQty || 0)} pcs`;
  const printDate = dateFormateForUi(new Date().toISOString());

  const leftFields = [
    { label: 'PO No', value: data?.productionOrderCode || 'N/A' },
    { label: 'SO No', value: data?.salesOrderId?.orderId || 'N/A' },
    { label: 'Item No', value: data?.itemId?.itemNo },
    { label: 'Item Name', value: data?.itemId?.itemName },
    { label: 'Quantity', value: data?.quantity != null ? `${data.quantity} pcs` : '-' },
    { label: 'Method', value: PRODUCTION_MODULE_METHOD_LABEL[data.productionManageMethod] },
    { label: 'Production Date', value: dateFormateForUi(data?.productionDate) },
  ];

  const rightFields = [
    { label: 'Status', value: data?.status },
    { label: 'Raw Material WH', value: data?.inStockWarehouseId?.name },
    { label: 'Production WH', value: data?.productionWarehouseId?.name },
    { label: 'Finished Goods WH', value: data?.inventoryInwarehouseId?.name },
    { label: 'Submitted Qty', value: submittedFgPcs },
    { label: 'Man Power', value: formatWorkerNames(data?.manPower_inventoryTransfer) },
    { label: 'Production Owner', value: formatWorkerNames(data?.productionOwner) },
  ];

  return (
    <Document>
      <Page size="A4" style={S.page}>
        {/* Outer decorative border */}
        <View style={S.outerBorder} fixed />

        {/* ── Header ── */}
        <View style={S.header}>
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
              {profile?.address?.city || profile?.address?.state ? <Text style={S.companySubLine}>{[profile.address.city, profile.address.state].filter(Boolean).join(', ')}</Text> : null}
              {profile?.contactPhone ? <Text style={S.companySubLine}>Tel: {profile.contactPhone}</Text> : null}
              {profile?.gstNumber ? <Text style={S.companySubLine}>GSTIN: {profile.gstNumber}</Text> : null}
            </View>
          </View>

          <View style={S.headerRight}>
            <Text style={S.docTitle}>PRODUCTION ORDER</Text>
            <View style={S.orderBadge}>
              <Text style={S.orderBadgeText}>{data?.productionOrderCode || 'N/A'}</Text>
            </View>
            <View style={S.createdByRow}>
              <Text style={S.createdByLabel}>Created By:</Text>
              <Text style={S.createdByValue}>{data?.createdBy?.name || '-'}</Text>
            </View>
          </View>
        </View>

        {/* ── Order Details section ── */}
        <SectionHeading title="Order Details" />
        <View style={S.infoGrid}>
          {/* Left column */}
          <View style={S.infoCol}>
            {leftFields.map((f, i) => (
              <InfoRow key={f.label} label={f.label} value={f.value} alt={i % 2 === 1} last={i === leftFields.length - 1} />
            ))}
          </View>

          {/* Divider */}
          <View style={S.infoColDivider} />

          {/* Right column */}
          <View style={S.infoCol}>
            {rightFields.map((f, i) => (
              <InfoRow key={f.label} label={f.label} value={f.value} alt={i % 2 === 1} last={i === rightFields.length - 1} />
            ))}
          </View>
        </View>

        {/* ── Raw Materials table ── */}
        {data?.rawMaterials?.length ? (
          <>
            <SectionHeading title="Raw Materials" />
            <View style={S.tableWrap}>
              {/* Table head */}
              <View style={S.tableHead}>
                <View style={S.colItem}>
                  <Text style={S.tableHeadCell}>Item Name</Text>
                </View>
                <View style={S.colQty}>
                  <Text style={[S.tableHeadCell, { textAlign: 'right' }]}>Per Item Qty</Text>
                </View>
                <View style={S.colIssued}>
                  <Text style={[S.tableHeadCell, { textAlign: 'right' }]}>Issued Qty</Text>
                </View>
              </View>

              {/* Table rows */}
              {data.rawMaterials.map((m, i) => (
                <View key={i} style={[S.tableRow, i % 2 === 1 && S.tableRowAlt]} wrap={false}>
                  <View style={S.colItem}>
                    <Text style={S.tableCell}>{m?.rawMaterialId?.itemName || '-'}</Text>
                  </View>
                  <View style={S.colQty}>
                    <Text style={[S.tableCell, { textAlign: 'right' }]}>{m?.perItemRequiredUnit != null ? `${m.perItemRequiredUnit} pcs` : '-'}</Text>
                  </View>
                  <View style={S.colIssued}>
                    <Text style={[S.tableCell, { textAlign: 'right' }]}>{m?.productionOrderRequiredUnit != null ? `${m.productionOrderRequiredUnit} pcs` : '-'}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {/* ── Footer ── */}
        <View style={S.footer} fixed>
          <View style={S.footerLeft}>
            <Text style={S.footerText}>Powered by</Text>
            <Image src={abssBrandingLogo} style={S.abssBrandingLogo} />
          </View>
          <Text style={S.footerRight}>Printed: {printDate}</Text>
        </View>
      </Page>
    </Document>
  );
};

export const productionOrderPdfFileName = order => {
  const code = (order?.productionOrderCode || order?.id || 'production-order').toString();
  const safe = code.replace(/[^\w.-]+/g, '_');
  return `${safe}.pdf`;
};
