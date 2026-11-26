import React, { useEffect, useState } from 'react';
// qrcode is loaded on-demand (only when an e-invoice QR is needed)
const QRCode = { toDataURL: async (...args) => (await import('qrcode')).default.toDataURL(...args) };
import dayjs from 'dayjs';
import { PDFViewer, Document, Page, View, Text, StyleSheet, Image, Link } from '@react-pdf/renderer';

// Components
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';

// Hooks
import { useProfile } from '@/features/setting/profile/useProfile';

// Extras
import logo from '@/assets/images/ABSS-LOGO.png';
import { pageTypes, TRANSPORT_MODES } from 'utils/constants';
import { SUB_SUPPLY_TYPE_OPTIONS, SUPPLY_TYPE_OPTIONS } from '@/utils/dropdownEnums';
import {
  calculatediscountedValue,
  calculateItemQty,
  calculateItemRateForSplit,
  calculationForChargesTaxTable,
  checkIsPurchaseModule,
  buildTaxContext,
  getGroupedHsnData,
  isIGSTExists,
} from 'utils/services';
import { formatGstForDisplay, formatGstRateForTaxTable, formatGstHalfRateForTaxTable } from '@/utils/gstDisplay';
import { toDecimalString } from '@/utils/currency';
import { buildEWayBillQrText } from '@/utils/pdfUtils';
import { getItemUnitName } from '@/utils/itemLineUnit';

// const A4_WIDTH = 595.28;
const PAGE_PAD = 28;
const E_DOC_PAGE_PAD = 12;
const FOOTER_H = 44;
const BORDER_INSET = 6;
const BOTTOM_RESERVE = FOOTER_H + BORDER_INSET;

const breakLongPdfWord = word => {
  if (!word || word.length <= 6) return [word];
  return word.match(/.{1,4}/g) || [word];
};

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    backgroundColor: '#ffffff',
    paddingTop: PAGE_PAD,
    paddingLeft: PAGE_PAD,
    paddingRight: PAGE_PAD,
    paddingBottom: PAGE_PAD + FOOTER_H,
  },
  outerBorder: {
    position: 'absolute',
    top: PAGE_PAD - BORDER_INSET,
    left: PAGE_PAD - BORDER_INSET,
    right: PAGE_PAD - BORDER_INSET,
    bottom: BOTTOM_RESERVE,
    borderWidth: 0.75,
    borderColor: '#000000',
    borderStyle: 'solid',
  },
  container: {
    flexGrow: 1,
  },
  eDocPage: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    backgroundColor: '#ffffff',
    paddingTop: E_DOC_PAGE_PAD,
    paddingLeft: PAGE_PAD,
    paddingRight: PAGE_PAD,
    paddingBottom: E_DOC_PAGE_PAD + FOOTER_H,
  },
  eDocOuterBorder: {
    position: 'absolute',
    top: E_DOC_PAGE_PAD - BORDER_INSET,
    left: PAGE_PAD - BORDER_INSET,
    right: PAGE_PAD - BORDER_INSET,
    bottom: BOTTOM_RESERVE,
    borderWidth: 0.75,
    borderColor: '#000000',
    borderStyle: 'solid',
  },
  header: {
    // padding: 10,
    // paddingHorizontal: 10,
    paddingTop: 5,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    // paddingBottom: 5,
    gap: 10,
  },
  headerLeft: {
    width: '45%',
  },
  headerRight: {
    width: '45%',
    textAlign: 'right',
  },
  companyLogo: {
    alignSelf: 'flex-end',
    marginBottom: 5,
  },
  mainTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 40,
    marginBottom: 8,
    paddingTop: 5,
    borderTop: '1px solid black',
    borderBottom: '1px dashed black',
  },
  headerRow: {
    flexDirection: 'row',
    padding: 2,
    fontSize: 9,
    color: '#222222',
  },
  headerLabel: {
    width: '40%',
    fontWeight: 'bold',
  },
  headerValue: {
    width: '60%',
    textAlign: 'left',
  },
  headerText: {
    fontSize: 9,
    marginBottom: 2,
    lineHeight: 1.3,
    color: '#222222',
  },
  addressTest: {
    fontSize: 8,
    marginBottom: 2,
    lineHeight: 1.3,
    color: '#222222',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  companyName: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 9,
    marginBottom: 2,
    lineHeight: 1.3,
  },
  addressSection: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 8,
  },
  addressBox: {
    flex: 1,
    borderBottom: '1px solid #ccc',
    borderLeft: '1px solid #ccc',
  },
  innerAddressBox: {
    padding: 4,
  },
  addressTitle: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontSize: 10,
    fontWeight: 'heavy',
    marginBottom: 4,
    color: 'black',
    borderBottom: '1px solid #ccc',
    borderTop: '1px solid #ccc',
  },
  table: {
    marginBottom: 8,
  },
  tableHeader: {
    backgroundColor: '#f5f5f5',
    borderTop: '1px solid #ccc',
    borderBottom: '1px solid #ccc',
    padding: 4,
    fontSize: 9,
    fontWeight: 'bold',
    borderLeft: '1px solid #ccc',
  },
  tableCell: {
    padding: 4,
    borderBottom: '1px solid #ccc',
    fontSize: 8,
    color: '#222222',
    borderLeft: '1px solid #ccc',
  },
  tableCellWrap: {
    lineHeight: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  totalContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    fontSize: 7,
  },
  totalsSection: {
    marginLeft: 'auto',
    width: '35%',
    marginBottom: 5,
    border: '1px solid #ccc',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid #ccc',
    paddingVertical: 3.5,
    paddingHorizontal: 5,
    fontSize: 8.5,
  },
  documentTotal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3.5,
    paddingHorizontal: 5,
    color: 'black',
    fontSize: 8.5,
  },
  totalLabel: {
    width: '45%',
    fontWeight: 'bold',
    lineHeight: 1.2,
    fontSize: 8.5,
    minWidth: 0,
    flexShrink: 1,
  },
  totalValue: {
    width: '55%',
    textAlign: 'right',
    lineHeight: 1.2,
    fontSize: 8.5,
    minWidth: 0,
    flexShrink: 1,
  },
  documentTotalLabel: {
    width: '45%',
    fontWeight: 'bold',
    lineHeight: 1.2,
    fontSize: 8.5,
    minWidth: 0,
    flexShrink: 1,
  },
  documentTotalValue: {
    width: '55%',
    textAlign: 'right',
    fontWeight: 'bold',
    lineHeight: 1.2,
    fontSize: 8.5,
    minWidth: 0,
    flexShrink: 1,
  },
  bankSection: {
    paddingTop: 5,
  },
  bankTable: {
    border: '0.3px solid #222222',
    marginBottom: 8,
  },
  bankHeader: {
    fontSize: 8,
    backgroundColor: '#f5f5f5',
    padding: 4,
    fontWeight: 'bold',
    borderTop: '1px solid #ccc',
  },
  bankTableCell: {
    padding: 4,
    borderBottom: '1px solid #ccc',
    fontSize: 8,
    color: '#222222',
  },
  footer: {
    // padding: 10,
    paddingTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  termsSection: {
    width: '60%',
  },
  termsFont: {
    fontSize: 7,
    marginBottom: 2,
    lineHeight: 1.3,
    color: '#222222',
  },
  signatureSection: {
    width: '30%',
    alignItems: 'center',
  },
  signatureImage: {
    height: 40,
    // marginVertical: 3,
    justifyContent: 'center',
  },
  amountInWords: {
    marginTop: 10,
    fontStyle: 'italic',
    fontSize: 9,
  },
  footerBranding: {
    position: 'absolute',
    bottom: 14,
    left: PAGE_PAD,
    right: PAGE_PAD,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerBrandingLogo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerBrandingPageNumber: {
    fontSize: 9,
    color: '#666666',
  },
  poweredByText: {
    color: '#666666',
    marginRight: 4,
    fontSize: 8,
  },
  brandingLogo: {
    width: 80,
  },
  taxCalculationBox: {
    width: '60%',
    // margin: "0 20",
    marginRight: 45,
    marginBottom: 5,
  },
  taxCalcHeader: {
    backgroundColor: '#f3f4f6',
    padding: 4,
    fontWeight: 'bold',
    fontSize: 9,
    textAlign: 'center',
    borderRight: '1px solid #d1d5db',
    borderBottom: '1px solid #d1d5db',
  },
  taxCalcHeaderSub: {
    backgroundColor: '#f9fafb',
    padding: 4,
    fontWeight: 'bold',
    fontSize: 8,
    textAlign: 'center',
    borderRight: '1px solid #d1d5db',
    borderBottom: '1px solid #d1d5db',
  },
  taxCalcCell: {
    padding: 4,
    fontSize: 8,
    borderRight: '1px solid #d1d5db',
    borderBottom: '1px solid #d1d5db',
    lineHeight: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  taxCalcCellRight: {
    textAlign: 'right',
  },
  taxCalcCellCenter: {
    textAlign: 'center',
  },
  taxCalcSplitWrapper: {
    flexDirection: 'row',
    borderRight: '1px solid #d1d5db',
    borderBottom: '1px solid #d1d5db',
  },
  taxCalcSplitHalf: {
    width: '50%',
    padding: 4,
    fontSize: 8,
    lineHeight: 1,
    minWidth: 0,
    flexShrink: 1,
  },
  taxCalcSplitHalfDivider: {
    borderRight: '1px solid #d1d5db',
  },
  taxCalcTotal: {
    backgroundColor: '#f3f4f6',
    padding: 4,
    fontWeight: 'bold',
    fontSize: 8,
    borderRight: '1px solid #d1d5db',
    borderBottom: '1px solid #d1d5db',
    lineHeight: 1,
    minWidth: 0,
    flexShrink: 1,
  },
});

const EInvoiceTopSection = ({ data, qrCodeUrl }) => {
  return (
    <View
      style={{
        marginBottom: 6,
      }}
      wrap={false}
    >
      {/* Header */}
      <Text
        style={{
          fontSize: 10,
          fontWeight: 'bold',
          marginBottom: 6,
          borderBottom: '0.5px dotted #000',
          paddingBottom: 3,
          textTransform: 'uppercase',
        }}
      >
        E-INVOICE DETAILS
      </Text>

      {/* Main Row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ width: '90%' }}>
          <View style={{ flexDirection: 'row', marginBottom: 3 }}>
            <Text style={{ width: '15%', fontWeight: 'bold' }}>IRN :</Text>
            <Text style={{ width: '85%' }}>{data?.eInvoice?.irn || '-'}</Text>
          </View>

          <View style={{ flexDirection: 'row', marginBottom: 3 }}>
            <Text style={{ width: '15%', fontWeight: 'bold' }}>Ack No :</Text>
            <Text style={{ width: '85%' }}>{data?.eInvoice?.ackNo || '-'}</Text>
          </View>

          <View style={{ flexDirection: 'row', marginBottom: 3 }}>
            <Text style={{ width: '15%', fontWeight: 'bold' }}>Ack Date :</Text>
            <Text style={{ width: '85%' }}>{data?.eInvoice?.ackDate ? dayjs(data?.eInvoice?.ackDate).format('DD/MM/YYYY hh:mm:ss A') : '-'}</Text>
          </View>

          <View style={{ flexDirection: 'row', marginBottom: 3 }}>
            <Text style={{ width: '15%', fontWeight: 'bold' }}>Status :</Text>
            <Text style={{ width: '85%' }}>{data?.eInvoice?.status || '-'}</Text>
          </View>

          <Text
            style={{
              fontSize: 8,
              fontStyle: 'italic',
              color: '#333',
              marginTop: 4,
            }}
          >
            This is a digitally signed e-Invoice generated under GST.
          </Text>
        </View>

        {/* QR Code */}
        {qrCodeUrl && (
          <View style={{ width: '30%', alignItems: 'flex-end' }}>
            <Image src={qrCodeUrl} style={{ width: 90, height: 90, border: '0.5px solid #000' }} />
            <Text style={{ fontSize: 8, marginTop: 2 }}>
              Verify at{' '}
              <Link src="https://einvoice.gst.gov.in" style={{ color: '#0056b3' }}>
                einvoice.gst.gov.in
              </Link>
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const EWayBillFullSection = ({ data, qrCodeUrl, profile, totals, isIGST }) => {
  if (!data?.eWayBill) return null;

  return (
    <View
      style={{
        padding: 0,
        fontSize: 9,
        color: '#111',
      }}
    >
      {/* HEADER */}
      <View
        wrap={false}
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '1px solid #ccc',
        }}
      >
        {/* LEFT INFO */}
        <View style={{ width: '68%' }}>
          <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#000', marginBottom: 3 }}>e-Way Bill</Text>
          <Text>Doc No : {data?.invoiceId || '-'}</Text>
          <Text>Date : {dayjs(data?.invoiceDate).format('DD/MM/YYYY')}</Text>
          {data?.eInvoice?.irn && (
            <>
              <Text>IRN : {data?.eInvoice?.irn}</Text>
              <Text>Ack No : {data?.eInvoice?.ackNo}</Text>
              <Text>Ack Date : {data?.eInvoice?.ackDate ? dayjs(data?.eInvoice?.ackDate).format('DD/MM/YYYY') : '-'}</Text>
            </>
          )}
        </View>

        {/* QR CODE */}
        {qrCodeUrl && (
          <View style={{ alignItems: 'flex-end' }}>
            <Image
              src={qrCodeUrl}
              style={{
                width: 90,
                height: 90,
                border: '1px solid #ccc',
              }}
            />
          </View>
        )}
      </View>

      {/* 1. E-Way Bill Details */}
      <Section title="1. E-Way Bill Details">
        <Row
          left={[
            ['e-Way Bill No', data?.eWayBill?.eWayBillNo],
            ['Mode', TRANSPORT_MODES[data?.eWayBill?.transportMode] || '-'],
            ['Generated By', data?.companyGstin || profile?.gstNumber || '-'],
            ['Status', data?.eWayBill?.status || 'Active'],
          ]}
          right={[
            ['Generated Date', data?.eWayBill?.eWayBillDate ? dayjs(data?.eWayBill?.eWayBillDate).format('DD-MMM-YY hh:mm A') : '-'],
            ['Valid Upto', data?.eWayBill?.eWayBillExpiryDate ? dayjs(data?.eWayBill?.eWayBillExpiryDate).format('DD-MMM-YY hh:mm A') : '-'],
            [
              'Supply Type',
              `${data?.eWayBill?.supplyType ? SUPPLY_TYPE_OPTIONS.find(option => option.value === data?.eWayBill?.supplyType)?.label : '-'}-${data?.eWayBill?.subSupplyType ? SUB_SUPPLY_TYPE_OPTIONS.find(option => option.value === data?.eWayBill?.subSupplyType)?.label : '-'}`,
            ],
            ['Approx Distance', data?.eWayBill?.distance ? `${data?.eWayBill?.distance} KM` : '-'],
          ]}
        />
      </Section>

      {/* 2. Address Details */}
      <Section title="2. Address Details">
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <AddressCard heading="From" name={profile?.name} gst={data?.companyGstin || profile?.gstNumber} address={`${profile?.address?.state || ''}`} />
          <AddressCard heading="To" name={data?.customerId?.companyName} gst={data?.customerId?.otherDetails?.gstinUin} address={`${data?.customerId?.address?.shipping?.state || ''}`} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
          <AddressCard
            heading="Dispatch From"
            name=""
            gst=""
            address={`${profile?.address?.street1 || ''}, ${profile?.address?.city || ''}, ${profile?.address?.state || ''}-${profile?.address?.pinCode || ''}`}
          />
          <AddressCard
            heading="Ship To"
            name=""
            gst=""
            address={`${data?.customerId?.address?.shipping?.address?.street1 || ''}, ${data?.customerId?.address?.shipping?.city || ''}, ${data?.customerId?.address?.shipping?.state || ''}-${
              data?.customerId?.address?.shipping?.pinCode || ''
            }`}
          />
        </View>
      </Section>

      {/* 3. Goods Details */}
      <Section title="3. Goods Details">
        <GoodsTable items={data?.items} totals={totals || {}} isIGST={isIGST} />
      </Section>

      {/* 4. Transportation Details */}
      <View wrap={false}>
        <Section title="4. Transportation Details">
          <Row
            left={[
              ['Transporter ID', data?.eWayBill?.transporterId || '-'],
              ['Transporter Name', data?.eWayBill?.transporterName || '-'],
            ]}
          />
        </Section>

        {/* 5. Vehicle Details */}
        <Section title="5. Vehicle Details" last>
          {data?.eWayBill?.transportMode === '1' && <Row left={[['Vehicle No', data?.eWayBill?.vehicleNumber || '-']]} right={[['Vehicle Type', data?.eWayBill?.vehicleType || '-']]} last />}

          {data?.eWayBill?.transportMode === '2' && (
            <Row
              left={[['Railway Receipt (RR) Number', data?.eWayBill?.railwayReceiptNumber || '-']]}
              right={[['RR Date', dayjs(data?.eWayBill?.railwayReceiptDate).format('DD/MM/YYYY') || '-']]}
              last
            />
          )}

          {data?.eWayBill?.transportMode === '3' && (
            <Row left={[['Airway Bill (AWB) Number', data?.eWayBill?.airwayBillNumber || '-']]} right={[['AWB Date', dayjs(data?.eWayBill?.airwayBillDate).format('DD/MM/YYYY') || '-']]} last />
          )}

          {data?.eWayBill?.transportMode === '4' && (
            <Row left={[['Bill of Lading (BL) Number', data?.eWayBill?.seawayBillNumber || '-']]} right={[['BL Date', dayjs(data?.eWayBill?.seawayBillDate).format('DD/MM/YYYY') || '-']]} last />
          )}
        </Section>
      </View>
    </View>
  );
};

const DispatchDetailsSection = ({ dispatch }) => {
  if (!dispatch) return null;

  const dispatchMode = dispatch?.dispatchMode;
  const commonFields = [
    ['Dispatch Mode', dispatchMode || '-'],
    ['Goods Booking Date', dispatch?.goodsBookingDate ? dayjs(dispatch.goodsBookingDate).format('DD/MM/YYYY') : '-'],
    ['Approx Delivery Date', dispatch?.approxDeliveryDate ? dayjs(dispatch.approxDeliveryDate).format('DD/MM/YYYY') : '-'],
  ];

  let modeFields = [];
  if (dispatchMode === 'Transport & Courier Service') {
    modeFields = [
      ['Transport Type', dispatch?.transportCourier?.transportType || '-'],
      ['Transport & Courier', dispatch?.transportCourier?.transportId?.name || '-'],
      ['Tracking Number', dispatch?.transportCourier?.trackingNumber || '-'],
      ['Tracking Link', dispatch?.transportCourier?.trackingLink || '-'],
    ];
  } else if (dispatchMode === 'Full Truck Load') {
    modeFields = [
      ['Truck Name & Type', dispatch?.truckLoad?.truckName || '-'],
      ['Truck Number', dispatch?.truckLoad?.truckNumber || '-'],
      ['Driver Name', dispatch?.truckLoad?.driverName || '-'],
      ['Driver Contact', dispatch?.truckLoad?.driverContact || '-'],
    ];
  } else if (dispatchMode === 'OurSelf Delivery' || dispatchMode === 'Pickup By Customer') {
    modeFields = [
      ['Delivery/Pickup Boy Name', dispatch?.selfDelivery?.deliveryBoyName || '-'],
      ['Vehicle Number', dispatch?.selfDelivery?.vehicleNumber || '-'],
      ['Driver Name', dispatch?.selfDelivery?.driverName || '-'],
      ['Driver Contact', dispatch?.selfDelivery?.driverContact || '-'],
    ];
  }

  const allFields = [...commonFields, ...modeFields];
  const half = Math.ceil(allFields.length / 2);

  return (
    <View style={{ marginTop: 5, marginBottom: 8, border: '1px solid #ccc' }}>
      {/* Header bar: same gray fill + bold uppercase title treatment as the Bank Details table header */}
      <View style={{ backgroundColor: '#f5f5f5', borderBottom: '1px solid #ccc', paddingVertical: 4, paddingHorizontal: 8 }}>
        <Text style={{ fontSize: 10, fontWeight: 'heavy', color: 'black' }}>Dispatch Information</Text>
      </View>
      <View style={{ padding: 6, fontSize: 9, color: '#222222' }}>
        <Row left={allFields.slice(0, half)} right={allFields.slice(half)} last gap={4} />
      </View>
    </View>
  );
};

/* ---------- Subcomponents ---------- */
const Section = ({ title, children, last = false }) => {
  const hasChildren = React.Children.toArray(children).length > 0;
  return (
    <View
      style={{
        marginTop: 5,
        paddingBottom: last ? 0 : 5,
        ...(!last ? { borderBottom: '0.5px solid #ddd' } : {}),
      }}
    >
      <Text
        style={{
          fontSize: 10,
          fontWeight: 'bold',
          color: '#000',
          marginBottom: !hasChildren && last ? 0 : 4,
        }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
};

const Field = ({ label, value, last = false, gap = 2 }) => (
  <Text style={{ marginBottom: last ? 0 : gap }}>
    <Text style={{ fontWeight: 'bold' }}>{label}: </Text>
    {value || '-'}
  </Text>
);

const Row = ({ left = [], right = [], last = false, gap = 2 }) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: last ? 0 : gap }}>
    <View style={{ width: '48%' }}>
      {left.map(([label, value], i) => (
        <Field key={i} label={label} value={value} last={i === left.length - 1} gap={gap} />
      ))}
    </View>
    <View style={{ width: '48%' }}>
      {right.map(([label, value], i) => (
        <Field key={i} label={label} value={value} last={i === right.length - 1} gap={gap} />
      ))}
    </View>
  </View>
);

const AddressCard = ({ heading, name, gst, address }) => (
  <View
    style={{
      width: '48%',
      border: '0.5px solid #ccc',
      borderRadius: 3,
      backgroundColor: '#fafafa',
    }}
  >
    <Text
      style={{
        backgroundColor: '#f5f5f5',
        borderBottom: '0.5px solid #ccc',
        paddingVertical: 3,
        paddingHorizontal: 5,
        fontWeight: 'bold',
        fontSize: 9,
      }}
    >
      {heading}
    </Text>
    <View style={{ padding: 5 }}>
      {name && <Text>{name}</Text>}
      {gst && <Text>GSTIN: {gst}</Text>}
      {address && <Text>{address}</Text>}
    </View>
  </View>
);

const GoodsTable = ({ items = [], totals = {}, isIGST }) => {
  return (
    <View>
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: '#f5f5f5',
          borderBottom: '0.5px solid #ccc',
          paddingVertical: 3,
        }}
      >
        <Text style={{ width: '20%', paddingLeft: 3, fontWeight: 'bold' }}>HSN Code</Text>
        <Text style={{ width: '40%', fontWeight: 'bold' }}>Product Name & Desc</Text>
        <Text style={{ width: '15%', textAlign: 'right', fontWeight: 'bold' }}>Quantity</Text>
        <Text style={{ width: '15%', textAlign: 'right', fontWeight: 'bold' }}>Taxable Amt</Text>
        <Text style={{ width: '10%', textAlign: 'right', fontWeight: 'bold' }}>Tax Rate (%)</Text>
      </View>

      {items.map((item, i) => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            borderBottom: '0.5px solid #eee',
            paddingVertical: 2,
          }}
        >
          <Text style={{ width: '20%', paddingLeft: 3 }}>{item?.hsnCode || '-'}</Text>
          <Text style={{ width: '40%' }}>{item?.itemName}</Text>
          <Text style={{ width: '15%', textAlign: 'right' }}>
            {item?.quantity}
            {getItemUnitName(item) ? <Text style={{ fontSize: 6, color: '#666666' }}> {getItemUnitName(item)}</Text> : null}
          </Text>
          <Text style={{ width: '15%', textAlign: 'right' }}>{toDecimalString(item?.amount)}</Text>
          <Text style={{ width: '10%', textAlign: 'right' }}>{formatGstForDisplay(item?.gst)}</Text>
        </View>
      ))}

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          borderTop: '0.5px solid #ccc',
          paddingTop: 3,
          marginTop: 3,
          gap: 30,
          marginBottom: 10,
        }}
      >
        <Text style={{ fontWeight: 'bold' }}>Total Taxable Amt : {toDecimalString(totals?.totalTaxablevalue) || '0.00'}</Text>
        <Text style={{ fontWeight: 'bold' }}>
          Other Amt :{' '}
          {totals?.otherAmount.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
          }) || '0.00'}
        </Text>
        <Text style={{ fontWeight: 'bold' }}>Total Inv Amt : {toDecimalString(totals?.total) || '0.00'}</Text>
      </View>
      {isIGST ? (
        <Text style={{ fontWeight: 'bold' }}>IGST Amt : {toDecimalString(totals?.igst) || '0.00'}</Text>
      ) : (
        <>
          <Text style={{ fontWeight: 'bold' }}>
            CGST Amt : {toDecimalString(totals?.cgst) || '0.00'} SGST Amt : {toDecimalString(totals?.sgst) || '0.00'}
          </Text>
        </>
      )}
    </View>
  );
};

const generateQRCode = async text => {
  try {
    if (!text) return null;
    const qrDataUrl = await QRCode.toDataURL(text, {
      width: 300,
      margin: 4,
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
      rendererOpts: {
        quality: 1,
      },
    });
    return qrDataUrl;
  } catch (err) {
    console.error('QR generation failed:', err);
    return null;
  }
};

const ShowPDFComponent = ({
  data,
  billingAddress,
  shippingAddress,
  profile,
  pageType,
  qrCodeUrl: qrCodeUrlProp = null,
  eWayBillQrCodeUrl: eWayBillQrCodeUrlProp = null,
  isEinvoicingAvailable = false,
  isEwayBillingAvailable = false,
  showEInvoice = false,
  showEWayBill = false,
  showInvoice = true,
  includeDispatchDetails = false,
}) => {
  let customerDetails = data?.customerId || data?.customer;
  const isPurchaseModule = checkIsPurchaseModule(pageType);
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [eWayBillQrUrl, setEWayBillQrUrl] = useState(null);

  useEffect(() => {
    if (!qrCodeUrlProp && data?.eInvoice?.signedQrCode) {
      (async () => {
        const url = await generateQRCode(data.eInvoice.signedQrCode);
        setQrCodeUrl(() => url);
      })();
    }
    if (!eWayBillQrCodeUrlProp && data?.eWayBill?.eWayBillNo) {
      (async () => {
        const qrText = buildEWayBillQrText(data);

        const qrUrl = eWayBillQrCodeUrlProp || (await generateQRCode(qrText));
        setEWayBillQrUrl(qrUrl);
      })();
    }
  }, [data?.eInvoice?.signedQrCode, qrCodeUrlProp]);

  const finalQrCodeUrl = qrCodeUrlProp || qrCodeUrl;
  const finalEWayBillQrCodeUrl = eWayBillQrCodeUrlProp || eWayBillQrUrl;

  let header = 'Quotation',
    numberTitle = 'SQ No',
    numberId = 'quoteId',
    dateTitle = 'Date',
    date = 'quoteDate',
    refTitle = 'Cust.';

  if (pageType === pageTypes?.PURCHASE_ORDER || pageType === pageTypes?.GRPO || pageType === pageTypes?.BILLS) {
    customerDetails = data?.vendor;
    date = 'date';
    refTitle = 'Vendor';
  }

  if (pageType === pageTypes?.SALES_ORDER) {
    header = 'Sales Order';
    numberTitle = 'SO No';
    numberId = 'orderId';
    date = 'orderDate';
  } else if (pageType === pageTypes?.DELIVERY_CHALLAN) {
    header = 'Delivery Challan';
    numberTitle = 'Delivery Challan No';
    numberId = 'challanId';
    date = 'challanDate';
  } else if (pageType === pageTypes?.INVOICE) {
    header = 'Tax Invoice';
    numberTitle = 'Invoice No';
    numberId = 'invoiceId';
    date = 'invoiceDate';
  } else if (pageType === pageTypes?.CREDIT_NOTE) {
    header = 'Credit Note';
    numberTitle = 'Credit Note No';
    numberId = 'creditNoteId';
    date = 'creditNoteDate';
  } else if (pageType === pageTypes?.PURCHASE_ORDER) {
    header = 'Purchase Order';
    dateTitle = 'Delivery Date';
    numberTitle = 'Purchase Order No';
    numberId = 'purchaseOrderId';
  } else if (pageType === pageTypes?.GRPO) {
    header = 'GRPO';
    dateTitle = 'Delivery Date';
    numberTitle = 'GRPO No';
    numberId = 'grpoOrderId';
  } else if (pageType === pageTypes?.BILLS) {
    header = 'Bill';
    numberTitle = 'Bill No';
    numberId = 'billId';
    dateTitle = 'Bill Date';
    date = 'billDate';
  } else if (pageType === pageTypes?.DEBIT_NOTE) {
    header = 'Debit Note';
    numberTitle = 'Debit Note No';
    numberId = 'debitNoteId';
    customerDetails = data?.vendorId;
    date = 'debitNoteDate';
    refTitle = 'Vendor';
  } else if (pageType === pageTypes?.EXPENSES) {
    header = 'Expenses';
    numberTitle = 'Expenses No';
    numberId = 'expenseId';
    date = 'date';
  } else if (pageType === pageTypes?.CUSTOMER_ORDER) {
    header = 'Customer Order';
    numberTitle = 'CO No';
    numberId = 'customerOrderId';
    date = 'createdAt';
  } else if (pageType === pageTypes?.RECURRING_BILL) {
    header = 'Bill';
    date = 'nextExecutionDate';
    customerDetails = data?.vendor;
    refTitle = 'Vendor';
  } else if (pageType === pageTypes?.RECURRING_INVOICE) {
    header = 'Invoice';
    date = 'nextExecutionDate';
  }

  const showDueDate = [pageTypes?.INVOICE, pageTypes?.BILLS].includes(pageType);

  const showItemDiscountColumn =
    data?.appliesTo === 'ITEM' &&
    !data?.isSplit &&
    data?.items?.some(item => {
      const discountValue = parseFloat(item?.discountConfig?.discountValue);
      return !isNaN(discountValue) && discountValue > 0;
    });

  const formatItemDiscount = discountConfig => {
    const discountValue = parseFloat(discountConfig?.discountValue);
    if (isNaN(discountValue) || discountValue <= 0) return '';
    return discountConfig?.discountType === 'PERCENTAGE' ? `${discountValue}%` : `${data?.currency?.symbol}${discountValue}`;
  };

  const groupedHsnData = getGroupedHsnData(data);
  const itemsSubTotal = data?.items?.reduce((sum, item) => sum + parseFloat(item?.amount || 0), 0) || 0;

  let valueForChargeTaxTable = calculationForChargesTaxTable(data?.additionalCharges);
  const hsnTaxableTotal = groupedHsnData.reduce((sum, item) => sum + item.taxableValue, 0) + (Number(valueForChargeTaxTable?.amount) || 0);
  const totalCalculations = {
    subTotal: Number(data?.subTotal || 0),
    totalTax: Number(data?.totalTax || 0),
    totalTaxablevalue: Number(data?.totalTaxablevalue || data?.subTotal || 0),
    total: Number(data?.total || data?.amount || 0),
    roundOffAmount: Number(data?.roundOffAmount || 0),
    igst: Number(data?.igst || 0),
    cgst: Number(data?.cgst || 0),
    sgst: Number(data?.sgst || 0),
  };
  const isIGST = isIGSTExists(buildTaxContext(profile, customerDetails, data?.vendorId || data?.vendor ? customerDetails?.address?.billing?.state || '' : shippingAddress?.state));

  const narrationText = data?.customerNotes || data?.notes || data?.narration || '';
  const showEWayBillSection = (isEinvoicingAvailable || isEwayBillingAvailable) && showEWayBill && data?.eWayBill;
  const showDispatchSection = pageType === pageTypes?.INVOICE && includeDispatchDetails && !!data?.dispatchDetails;
  const eWayBillTotals = {
    otherAmount: data?.isRoundOff && data?.roundOffAmount !== 0 ? data?.roundOffAmount : 0,
    total: Math.round(totalCalculations?.total) || 0,
    totalTaxablevalue: totalCalculations?.totalTaxablevalue || 0,
    totalTax: totalCalculations?.totalTax || 0,
    igst: totalCalculations?.igst || 0,
    cgst: totalCalculations?.cgst || 0,
    sgst: totalCalculations?.sgst || 0,
  };

  const footerBranding = (
    <View style={styles.footerBranding} fixed>
      <View style={styles.footerBrandingLogo}>
        <Text style={styles.poweredByText}>Powered by</Text>
        <Image src={logo} style={styles.brandingLogo} />
      </View>
      <Text style={styles.footerBrandingPageNumber} render={({ pageNumber, totalPages }) => (totalPages > 1 ? `Page ${pageNumber} of ${totalPages}` : '')} />
    </View>
  );

  return (
    <Document>
      {(showInvoice || !showEWayBillSection) && (
        <Page size="A4" style={styles.page} wrap>
          <View style={styles.outerBorder} fixed />

          {/* Main Container */}
          <View style={styles.container}>
            <>
              <View>
                {isEinvoicingAvailable && showEInvoice && <EInvoiceTopSection data={data} qrCodeUrl={finalQrCodeUrl} />}
                {/* Header Section */}
                <View style={styles.header}>
                  <View style={styles.headerLeft}>
                    <Text style={[styles.mainTitle, isEinvoicingAvailable && showEInvoice && { marginTop: 6 }]}>{header}</Text>
                    {pageType !== pageTypes?.RECURRING_BILL && pageType !== pageTypes?.RECURRING_INVOICE && (
                      <View style={styles.headerRow}>
                        <Text style={styles.headerLabel}>{`${numberTitle}`}</Text>
                        <Text style={styles.headerValue}>: {data?.[numberId] || '-'}</Text>
                      </View>
                    )}
                    <View style={styles.headerRow}>
                      <Text style={styles.headerLabel}>{`${refTitle} No`}</Text>
                      <Text style={styles.headerValue}>: {customerDetails?.customerNumber || customerDetails?.businessAccountLedgerMasterId || '-'}</Text>
                    </View>
                    <View style={styles.headerRow}>
                      <Text style={styles.headerLabel}>{`${refTitle} Name`}</Text>
                      <Text style={styles.headerValue}>: {customerDetails?.customerDisplayName || customerDetails?.personName || '-'}</Text>
                    </View>
                    {(customerDetails?.otherDetails?.gstinUin || customerDetails?.otherDetails?.registeredBusinessValue || customerDetails?.otherDetails?.pan) && !data?.isSplit && (
                      <View style={styles.headerRow}>
                        <Text style={styles.headerLabel}>{customerDetails?.otherDetails?.gstinUin || customerDetails?.otherDetails?.registeredBusinessValue ? 'GST No' : 'PAN No'}</Text>
                        <Text style={styles.headerValue}>
                          :{' '}
                          {customerDetails?.otherDetails?.gstinUin || customerDetails?.otherDetails?.registeredBusinessValue
                            ? customerDetails?.otherDetails?.gstinUin || customerDetails?.otherDetails?.registeredBusinessValue
                            : customerDetails?.otherDetails?.pan || '-'}
                        </Text>
                      </View>
                    )}
                    {data?.[date] && (
                      <View style={styles.headerRow}>
                        <Text style={styles.headerLabel}>{dateTitle}</Text>
                        <Text style={styles.headerValue}>: {data?.[date] ? new Date(data?.[date]).toLocaleDateString('en-GB') : '-'}</Text>
                      </View>
                    )}
                    {showDueDate && data?.dueDate && (
                      <View style={styles.headerRow}>
                        <Text style={styles.headerLabel}>Due Date</Text>
                        <Text style={styles.headerValue}>: {new Date(data?.dueDate).toLocaleDateString('en-GB')}</Text>
                      </View>
                    )}
                    <View style={styles.headerRow}>
                      <Text style={styles.headerLabel}>{`${refTitle} Contact No`}</Text>
                      <Text style={styles.headerValue}>: {customerDetails?.customerPhoneNumber || customerDetails?.phoneNo || '-'}</Text>
                    </View>
                  </View>
                  <View style={styles.headerRight}>
                    <View style={styles.companyLogo}>
                      {(data?.companyLogo || profile?.companyLogo) && (
                        <Image
                          source={{
                            uri: data?.companyLogo || profile?.companyLogo,
                            headers: { Pragma: 'no-cache', 'Cache-Control': 'no-cache' },
                            method: 'GET',
                            body: undefined,
                          }}
                          style={{ height: 40 }}
                        />
                      )}
                    </View>
                    <Text style={styles.companyName}>{profile?.name}</Text>
                    <Text style={styles.headerText}>{profile?.address?.street1}</Text>
                    <Text style={styles.headerText}>{profile?.address?.street2}</Text>
                    <Text style={styles.headerText}>
                      {profile?.address?.city}, {profile?.address?.state}, {profile?.address?.country} - {profile?.address?.pinCode}
                    </Text>
                    {(data?.companyGstin || profile?.gstNumber) && !data?.isSplit && <Text style={styles.headerText}>GSTIN : {data?.companyGstin || profile?.gstNumber}</Text>}
                    {profile?.panNumber && !data?.isSplit && <Text style={styles.headerText}>PAN No: {profile?.panNumber}</Text>}
                    {profile?.contactPhone && <Text style={styles.headerText}>Contact No: {profile?.contactPhone}</Text>}
                    {pageType !== pageTypes?.CUSTOMER_ORDER && <Text style={styles.headerText}>Branch Name: {data?.branchName || '-'}</Text>}
                  </View>
                </View>

                {/* Address Section */}
                <View style={styles.addressSection}>
                  <View style={styles.addressBox}>
                    <Text style={styles.addressTitle}>{isPurchaseModule ? 'Bill From' : 'Bill To'}</Text>
                    <View style={styles.innerAddressBox}>
                      <Text style={styles.subtitle}>{customerDetails?.companyName}</Text>
                      <Text style={styles.addressTest}>{billingAddress?.address?.street1}</Text>
                      <Text style={styles.addressTest}>{billingAddress?.address?.street2}</Text>
                      <Text style={styles.addressTest}>
                        {billingAddress?.city} - {billingAddress?.pinCode}
                      </Text>
                      <Text style={styles.addressTest}>
                        {billingAddress?.state}, {billingAddress?.country}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.addressBox}>
                    <Text style={styles.addressTitle}>Ship To</Text>
                    <View style={styles.innerAddressBox}>
                      <Text style={styles.subtitle}>{isPurchaseModule ? data?.customerDisplayName || profile?.name : customerDetails?.companyName}</Text>
                      {(shippingAddress?.address?.street1 || shippingAddress?.street1) && <Text style={styles.addressTest}>{shippingAddress?.address?.street1 || shippingAddress?.street1}</Text>}
                      {(shippingAddress?.address?.street2 || shippingAddress?.street2) && <Text style={styles.addressTest}>{shippingAddress?.address?.street2 || shippingAddress?.street2}</Text>}
                      <Text style={styles.addressTest}>
                        {shippingAddress?.city} - {shippingAddress?.pinCode}
                      </Text>
                      {customerDetails?.address?.shipping?.state && customerDetails?.address?.shipping?.country && (
                        <Text style={styles.addressTest}>
                          {shippingAddress?.state}, {shippingAddress?.country}
                        </Text>
                      )}
                    </View>
                  </View>
                  <View style={[styles.addressBox, { borderRight: '1px solid #ccc' }]}>
                    <Text style={styles.addressTitle}>Other Information</Text>
                    <View style={styles.innerAddressBox}>
                      {data?.reference && <Text style={styles.addressTest}>Reference: {data?.reference}</Text>}
                      {data?.batchNo && pageType != pageTypes.PURCHASE_ORDER && <Text style={styles.addressTest}>Batch No: {data?.batchNo}</Text>}
                      {data?.referenceNumber && <Text style={styles.addressTest}>Reference Number: {data?.referenceNumber}</Text>}
                      {data?.paymentTermsId?.name && <Text style={styles.addressTest}>Payment Terms: {data?.paymentTermsId?.name}</Text>}
                      {data?.eWayBill?.eWayBillNo && <Text style={styles.addressTest}>E-Way Bill No: {data?.eWayBill?.eWayBillNo}</Text>}
                      {data?.eWayBill?.transportMode && <Text style={styles.addressTest}>Mode: {TRANSPORT_MODES[data?.eWayBill?.transportMode] || '-'}</Text>}
                      {data?.eWayBill?.vehicleNumber && <Text style={styles.addressTest}>Vehicle No: {data?.eWayBill?.vehicleNumber}</Text>}
                    </View>
                  </View>
                </View>
              </View>
              <View
                fixed
                render={({ pageNumber }) => {
                  return (
                    pageNumber > 1 && (
                      <View
                        style={{
                          marginTop: 10,
                          marginBottom: 10,
                          flexDirection: 'row',
                          justifyContent: 'flex-end',
                          alignItems: 'center',
                        }}
                      >
                        <View style={styles.companyLogo}>
                          {(data?.companyLogo || profile?.companyLogo) && (
                            <Image
                              style={{ height: 40 }}
                              source={{
                                uri: data?.companyLogo || profile?.companyLogo,
                                headers: { Pragma: 'no-cache', 'Cache-Control': 'no-cache' },
                                method: 'GET',
                                body: undefined,
                              }}
                            />
                          )}
                        </View>
                      </View>
                    )
                  );
                }}
              />

              {/* Items Table */}
              <View style={styles.table}>
                <View style={{ flexDirection: 'row' }} fixed>
                  <Text style={[styles.tableHeader, { width: '4%' }]}>#</Text>
                  <Text style={[styles.tableHeader, styles.tableCellWrap, { width: '10%' }]}>Item Code</Text>
                  <Text style={[styles.tableHeader, styles.tableCellWrap, { width: '35%' }]}>Description</Text>
                  <Text style={[styles.tableHeader, styles.tableCellWrap, { width: '9%' }]}>HSN/SAC</Text>
                  <Text style={[styles.tableHeader, { width: '10%' }]}>Qty</Text>
                  <Text style={[styles.tableHeader, styles.tableCellWrap, { width: '10%' }]}>Unit Price</Text>
                  {showItemDiscountColumn && <Text style={[styles.tableHeader, styles.tableCellWrap, { width: '10%' }]}>Discount</Text>}
                  {!data?.isSplit && <Text style={[styles.tableHeader, styles.tableCellWrap, { width: '10%' }]}>Tax Rate(%)</Text>}
                  <Text
                    style={[
                      styles.tableHeader,
                      styles.tableCellWrap,
                      {
                        width: `${!data?.isSplit ? '14%' : '24%'}`,
                        borderRight: '1px solid #ccc',
                      },
                    ]}
                  >
                    Amount
                  </Text>
                </View>
                {data?.items?.map((item, index) => {
                  let itemRateForSplitDoc = data?.isSplit ? calculateItemRateForSplit(item) || 0 : 0;
                  return (
                    <View key={index} style={{ flexDirection: 'row' }} wrap={false}>
                      <Text style={[styles.tableCell, { width: '4%' }]}>{index + 1}</Text>
                      <Text style={[styles.tableCell, styles.tableCellWrap, { width: '10%' }]} hyphenationCallback={breakLongPdfWord}>
                        {item?.itemNo}
                      </Text>
                      <Text style={[styles.tableCell, styles.tableCellWrap, { width: '35%' }]} hyphenationCallback={breakLongPdfWord}>
                        {item?.itemName}
                        {item?.description && (
                          <Text style={{ fontSize: 7, color: '#666666' }} hyphenationCallback={breakLongPdfWord}>
                            {'\n'}({item?.description})
                          </Text>
                        )}
                      </Text>
                      <Text style={[styles.tableCell, styles.tableCellWrap, { width: '9%' }]} hyphenationCallback={breakLongPdfWord}>
                        {item?.hsnCode || 'N/A'}
                      </Text>
                      <Text style={[styles.tableCell, styles.tableCellWrap, { width: '10%' }]} hyphenationCallback={breakLongPdfWord}>
                        {item?.quantity}
                        {getItemUnitName(item) ? (
                          <Text style={{ fontSize: 7, color: '#666666', lineHeight: 1.35 }}>
                            {'\n'}
                            {getItemUnitName(item)}
                          </Text>
                        ) : null}
                      </Text>
                      <Text style={[styles.tableCell, styles.tableCellWrap, { width: '10%' }]} hyphenationCallback={breakLongPdfWord}>
                        {data?.isSplit ? itemRateForSplitDoc : item?.rate}
                      </Text>
                      {showItemDiscountColumn && (
                        <Text style={[styles.tableCell, styles.tableCellWrap, { width: '10%' }]} hyphenationCallback={breakLongPdfWord}>
                          {formatItemDiscount(item?.discountConfig)}
                        </Text>
                      )}
                      {!data?.isSplit && (
                        <Text style={[styles.tableCell, styles.tableCellWrap, { width: '10%' }]} hyphenationCallback={breakLongPdfWord}>
                          {formatGstForDisplay(item?.gst)}
                        </Text>
                      )}
                      <Text
                        style={[
                          styles.tableCell,
                          styles.tableCellWrap,
                          {
                            width: `${!data?.isSplit ? '14%' : '24%'}`,
                            borderRight: '1px solid #ccc',
                          },
                        ]}
                        hyphenationCallback={breakLongPdfWord}
                      >
                        {data?.isSplit ? itemRateForSplitDoc * item?.quantity : item?.amount ? toDecimalString(item?.amount) : ''}
                      </Text>
                    </View>
                  );
                })}
                <View style={{ flexDirection: 'row' }}>
                  <Text style={[styles.tableCell, { width: '4%' }]}></Text>
                  <Text style={[styles.tableCell, { width: '10%' }]}></Text>
                  <Text style={[styles.tableCell, { width: '35%' }]}></Text>
                  <Text style={[styles.tableCell, { width: '9%' }]}></Text>
                  <Text style={[styles.tableCell, styles.tableCellWrap, { width: '10%' }]} hyphenationCallback={breakLongPdfWord}>
                    {calculateItemQty(data?.items)}
                  </Text>
                  <Text style={[styles.tableCell, { width: '10%' }]}></Text>
                  {showItemDiscountColumn && <Text style={[styles.tableCell, { width: '10%' }]}></Text>}
                  {!data?.isSplit && <Text style={[styles.tableCell, { width: '10%' }]}></Text>}
                  <Text
                    style={[
                      styles.tableCell,
                      {
                        width: `${!data?.isSplit ? '14%' : '24%'}`,
                        borderRight: '1px solid #ccc',
                      },
                    ]}
                  ></Text>
                </View>
              </View>

              <View style={styles.totalContainer}>
                {/* Tax Calculation Box */}
                {!data?.isSplit && (
                  <View style={styles.taxCalculationBox}>
                    <View
                      style={{
                        flexDirection: 'row',
                        borderLeft: '1px solid #d1d5db',
                        borderRight: '1px solid #d1d5db',
                        borderTop: '1px solid #d1d5db',
                      }}
                      fixed
                      wrap={false}
                    >
                      {isIGST ? (
                        <>
                          <Text style={[styles.taxCalcHeader, { width: '15%', borderLeft: 'none' }]}>HSN/SAC</Text>
                          <Text style={[styles.taxCalcHeader, { width: '10%' }]}>Qty</Text>
                          <Text style={[styles.taxCalcHeader, { width: '17%' }]}>Taxable value</Text>
                          <Text style={[styles.taxCalcHeader, { width: '38%' }]}>IGST Tax</Text>
                          <Text style={[styles.taxCalcHeader, { width: '20%', borderRight: 'none' }]}>Total Tax Amount</Text>
                        </>
                      ) : (
                        <>
                          <Text style={[styles.taxCalcHeader, { width: '14%', borderLeft: 'none' }]}>HSN/SAC</Text>
                          <Text style={[styles.taxCalcHeader, { width: '9%' }]}>Qty</Text>
                          <Text style={[styles.taxCalcHeader, { width: '17%' }]}>Taxable value</Text>
                          <Text style={[styles.taxCalcHeader, { width: '22%' }]}>CGST Tax</Text>
                          <Text style={[styles.taxCalcHeader, { width: '22%' }]}>SGST Tax</Text>
                          <Text style={[styles.taxCalcHeader, { width: '16%', borderRight: 'none' }]}>Total Tax Amount</Text>
                        </>
                      )}
                    </View>

                    {/* Sub-header row (Rate / Amount) */}
                    <View
                      style={{
                        flexDirection: 'row',
                        borderLeft: '1px solid #d1d5db',
                        borderRight: '1px solid #d1d5db',
                      }}
                      fixed
                      wrap={false}
                    >
                      {isIGST ? (
                        <>
                          <Text style={[styles.taxCalcHeaderSub, { width: '15%', borderLeft: 'none' }]} />
                          <Text style={[styles.taxCalcHeaderSub, { width: '10%' }]} />
                          <Text style={[styles.taxCalcHeaderSub, { width: '17%' }]} />
                          <Text style={[styles.taxCalcHeaderSub, { width: '19%' }]}>Rate</Text>
                          <Text style={[styles.taxCalcHeaderSub, { width: '19%' }]}>Amount</Text>
                          <Text style={[styles.taxCalcHeaderSub, { width: '20%', borderRight: 'none' }]} />
                        </>
                      ) : (
                        <>
                          <Text style={[styles.taxCalcHeaderSub, { width: '14%', borderLeft: 'none' }]} />
                          <Text style={[styles.taxCalcHeaderSub, { width: '9%' }]} />
                          <Text style={[styles.taxCalcHeaderSub, { width: '17%' }]} />
                          <Text style={[styles.taxCalcHeaderSub, { width: '11%' }]}>Rate</Text>
                          <Text style={[styles.taxCalcHeaderSub, { width: '11%' }]}>Amount</Text>
                          <Text style={[styles.taxCalcHeaderSub, { width: '11%' }]}>Rate</Text>
                          <Text style={[styles.taxCalcHeaderSub, { width: '11%' }]}>Amount</Text>
                          <Text style={[styles.taxCalcHeaderSub, { width: '16%', borderRight: 'none' }]} />
                        </>
                      )}
                    </View>

                    {groupedHsnData?.map((item, index) => {
                      const rowQty = calculateItemQty(item?.items);
                      const rowQtyDisplay = rowQty ? rowQty : '';
                      return (
                        <View
                          key={index}
                          style={{
                            flexDirection: 'row',
                            borderLeft: '1px solid #d1d5db',
                            borderRight: '1px solid #d1d5db',
                          }}
                          wrap={false}
                        >
                          {isIGST ? (
                            <>
                              <Text style={[styles.taxCalcCell, { width: '15%', borderLeft: 'none' }]}>{item?.hsnCode || '-'}</Text>
                              <Text style={[styles.taxCalcCell, styles.taxCalcCellRight, { width: '10%' }]} hyphenationCallback={breakLongPdfWord}>
                                {rowQtyDisplay}
                              </Text>
                              <Text style={[styles.taxCalcCell, styles.taxCalcCellRight, { width: '17%' }]} hyphenationCallback={breakLongPdfWord}>
                                {toDecimalString(Number(item?.taxableValue) || 0)}
                              </Text>
                              <View style={[styles.taxCalcSplitWrapper, { width: '38%' }]}>
                                <Text style={[styles.taxCalcSplitHalf, styles.taxCalcSplitHalfDivider, styles.taxCalcCellCenter]}>{formatGstRateForTaxTable(item?.gst)}</Text>
                                <Text style={[styles.taxCalcSplitHalf, styles.taxCalcCellRight]} hyphenationCallback={breakLongPdfWord}>
                                  {toDecimalString(Number(item?.taxAmount) || 0)}
                                </Text>
                              </View>
                              <Text style={[styles.taxCalcCell, styles.taxCalcCellRight, { width: '20%', borderRight: 'none' }]} hyphenationCallback={breakLongPdfWord}>
                                {toDecimalString(Number(item?.taxAmount) || 0)}
                              </Text>
                            </>
                          ) : (
                            <>
                              <Text style={[styles.taxCalcCell, { width: '14%', borderLeft: 'none' }]}>{item?.hsnCode || '-'}</Text>
                              <Text style={[styles.taxCalcCell, styles.taxCalcCellRight, { width: '9%' }]} hyphenationCallback={breakLongPdfWord}>
                                {rowQtyDisplay}
                              </Text>
                              <Text style={[styles.taxCalcCell, styles.taxCalcCellRight, { width: '17%' }]} hyphenationCallback={breakLongPdfWord}>
                                {toDecimalString(Number(item?.taxableValue) || 0)}
                              </Text>
                              <View style={[styles.taxCalcSplitWrapper, { width: '22%' }]}>
                                <Text style={[styles.taxCalcSplitHalf, styles.taxCalcSplitHalfDivider, styles.taxCalcCellCenter]}>{formatGstHalfRateForTaxTable(item?.gst)}</Text>
                                <Text style={[styles.taxCalcSplitHalf, styles.taxCalcCellRight]} hyphenationCallback={breakLongPdfWord}>
                                  {toDecimalString((Number(item?.taxAmount) || 0) / 2)}
                                </Text>
                              </View>
                              <View style={[styles.taxCalcSplitWrapper, { width: '22%' }]}>
                                <Text style={[styles.taxCalcSplitHalf, styles.taxCalcSplitHalfDivider, styles.taxCalcCellCenter]}>{formatGstHalfRateForTaxTable(item?.gst)}</Text>
                                <Text style={[styles.taxCalcSplitHalf, styles.taxCalcCellRight]} hyphenationCallback={breakLongPdfWord}>
                                  {toDecimalString((Number(item?.taxAmount) || 0) / 2)}
                                </Text>
                              </View>
                              <Text style={[styles.taxCalcCell, styles.taxCalcCellRight, { width: '16%', borderRight: 'none' }]} hyphenationCallback={breakLongPdfWord}>
                                {toDecimalString(Number(item?.taxAmount) || 0)}
                              </Text>
                            </>
                          )}
                        </View>
                      );
                    })}

                    {valueForChargeTaxTable?.amount > 0 && (
                      <View
                        style={{
                          flexDirection: 'row',
                          borderLeft: '1px solid #d1d5db',
                          borderRight: '1px solid #d1d5db',
                        }}
                      >
                        {isIGST ? (
                          <>
                            <Text style={[styles.taxCalcCell, { width: '15%', borderLeft: 'none' }]}>{valueForChargeTaxTable?.hsnCode || '-'}</Text>
                            <Text style={[styles.taxCalcCell, styles.taxCalcCellRight, { width: '10%' }]} />
                            <Text style={[styles.taxCalcCell, styles.taxCalcCellRight, { width: '17%' }]} hyphenationCallback={breakLongPdfWord}>
                              {toDecimalString(valueForChargeTaxTable?.amount)}
                            </Text>
                            <View style={[styles.taxCalcSplitWrapper, { width: '38%' }]}>
                              <Text style={[styles.taxCalcSplitHalf, styles.taxCalcSplitHalfDivider, styles.taxCalcCellCenter]}>{formatGstRateForTaxTable(valueForChargeTaxTable?.gst)}</Text>
                              <Text style={[styles.taxCalcSplitHalf, styles.taxCalcCellRight]} hyphenationCallback={breakLongPdfWord}>
                                {toDecimalString(Number(valueForChargeTaxTable?.taxAmount) || 0)}
                              </Text>
                            </View>
                            <Text style={[styles.taxCalcCell, styles.taxCalcCellRight, { width: '20%', borderRight: 'none' }]} hyphenationCallback={breakLongPdfWord}>
                              {toDecimalString(Number(valueForChargeTaxTable?.taxAmount) || 0)}
                            </Text>
                          </>
                        ) : (
                          <>
                            <Text style={[styles.taxCalcCell, { width: '14%', borderLeft: 'none' }]}>{valueForChargeTaxTable?.hsnCode || '-'}</Text>
                            <Text style={[styles.taxCalcCell, styles.taxCalcCellRight, { width: '9%' }]} />
                            <Text style={[styles.taxCalcCell, styles.taxCalcCellRight, { width: '17%' }]} hyphenationCallback={breakLongPdfWord}>
                              {toDecimalString(valueForChargeTaxTable?.amount)}
                            </Text>
                            <View style={[styles.taxCalcSplitWrapper, { width: '22%' }]}>
                              <Text style={[styles.taxCalcSplitHalf, styles.taxCalcSplitHalfDivider, styles.taxCalcCellCenter]}>{formatGstHalfRateForTaxTable(valueForChargeTaxTable?.gst)}</Text>
                              <Text style={[styles.taxCalcSplitHalf, styles.taxCalcCellRight]} hyphenationCallback={breakLongPdfWord}>
                                {toDecimalString((Number(valueForChargeTaxTable?.taxAmount) || 0) / 2)}
                              </Text>
                            </View>
                            <View style={[styles.taxCalcSplitWrapper, { width: '22%' }]}>
                              <Text style={[styles.taxCalcSplitHalf, styles.taxCalcSplitHalfDivider, styles.taxCalcCellCenter]}>{formatGstHalfRateForTaxTable(valueForChargeTaxTable?.gst)}</Text>
                              <Text style={[styles.taxCalcSplitHalf, styles.taxCalcCellRight]} hyphenationCallback={breakLongPdfWord}>
                                {toDecimalString((Number(valueForChargeTaxTable?.taxAmount) || 0) / 2)}
                              </Text>
                            </View>
                            <Text style={[styles.taxCalcCell, styles.taxCalcCellRight, { width: '16%', borderRight: 'none' }]} hyphenationCallback={breakLongPdfWord}>
                              {toDecimalString(Number(valueForChargeTaxTable?.taxAmount) || 0)}
                            </Text>
                          </>
                        )}
                      </View>
                    )}

                    <View
                      style={{
                        flexDirection: 'row',
                        borderLeft: '1px solid #d1d5db',
                        borderRight: '1px solid #d1d5db',
                      }}
                    >
                      {isIGST ? (
                        <>
                          <Text style={[styles.taxCalcTotal, { width: '15%', borderLeft: 'none' }]}>Total</Text>
                          <Text style={[styles.taxCalcTotal, styles.taxCalcCellRight, { width: '10%' }]} hyphenationCallback={breakLongPdfWord}>
                            {calculateItemQty(data?.items)}
                          </Text>
                          <Text style={[styles.taxCalcTotal, styles.taxCalcCellRight, { width: '17%' }]} hyphenationCallback={breakLongPdfWord}>
                            {toDecimalString(hsnTaxableTotal)}
                          </Text>
                          <Text style={[styles.taxCalcTotal, styles.taxCalcCellRight, { width: '38%' }]} hyphenationCallback={breakLongPdfWord}>
                            {toDecimalString(totalCalculations?.igst)}
                          </Text>
                          <Text style={[styles.taxCalcTotal, styles.taxCalcCellRight, { width: '20%', borderRight: 'none' }]} hyphenationCallback={breakLongPdfWord}>
                            {toDecimalString(totalCalculations?.totalTax)}
                          </Text>
                        </>
                      ) : (
                        <>
                          <Text style={[styles.taxCalcTotal, { width: '14%', borderLeft: 'none' }]}>Total</Text>
                          <Text style={[styles.taxCalcTotal, styles.taxCalcCellRight, { width: '9%' }]} hyphenationCallback={breakLongPdfWord}>
                            {calculateItemQty(data?.items)}
                          </Text>
                          <Text style={[styles.taxCalcTotal, styles.taxCalcCellRight, { width: '17%' }]} hyphenationCallback={breakLongPdfWord}>
                            {toDecimalString(hsnTaxableTotal)}
                          </Text>
                          <Text style={[styles.taxCalcTotal, styles.taxCalcCellRight, { width: '11%' }]}>{/* rate col blank */}</Text>
                          <Text style={[styles.taxCalcTotal, styles.taxCalcCellRight, { width: '11%' }]} hyphenationCallback={breakLongPdfWord}>
                            {toDecimalString(totalCalculations?.cgst)}
                          </Text>
                          <Text style={[styles.taxCalcTotal, styles.taxCalcCellRight, { width: '11%' }]}>{/* rate col blank */}</Text>
                          <Text style={[styles.taxCalcTotal, styles.taxCalcCellRight, { width: '11%' }]} hyphenationCallback={breakLongPdfWord}>
                            {toDecimalString(totalCalculations?.sgst)}
                          </Text>
                          <Text style={[styles.taxCalcTotal, styles.taxCalcCellRight, { width: '16%', borderRight: 'none' }]} hyphenationCallback={breakLongPdfWord}>
                            {toDecimalString(totalCalculations?.totalTax)}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                )}

                {/* Totals Section */}
                <View style={styles.totalsSection}>
                  {!data?.isSplit && (
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel} hyphenationCallback={breakLongPdfWord}>
                        Basic Amount
                      </Text>
                      <Text style={styles.totalValue} hyphenationCallback={breakLongPdfWord}>
                        {toDecimalString(itemsSubTotal)}
                      </Text>
                    </View>
                  )}
                  {data?.appliesTo === 'TRANSACTION' && !data?.isSplit && data?.discountConfig?.discountValue && data?.discountConfig?.discountValue > 0 && (
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel} hyphenationCallback={breakLongPdfWord}>
                        {`Discount (${data?.discountConfig?.discountValue}${data?.discountConfig?.discountType === 'PERCENTAGE' ? '%' : data?.currency?.symbol})`}
                      </Text>
                      <Text style={styles.totalValue} hyphenationCallback={breakLongPdfWord}>
                        {calculatediscountedValue(data?.items, data?.discountConfig?.discountType, data?.discountConfig?.discountValue)}
                      </Text>
                    </View>
                  )}
                  {data?.additionalCharges?.map(item => {
                    return (
                      <View style={styles.totalRow} key={item?.name}>
                        <Text style={styles.totalLabel} hyphenationCallback={breakLongPdfWord}>
                          {`${item?.name} ${item?.taxRate ? `@${item?.taxRate}%` : ''}`}
                        </Text>
                        <Text style={styles.totalValue} hyphenationCallback={breakLongPdfWord}>
                          {toDecimalString(parseFloat(item?.amount || 0))}
                        </Text>
                      </View>
                    );
                  })}
                  {!data?.isSplit ? (
                    isIGST ? (
                      <View style={styles.totalRow}>
                        <Text style={styles.totalLabel} hyphenationCallback={breakLongPdfWord}>
                          IGST
                        </Text>
                        <Text style={styles.totalValue} hyphenationCallback={breakLongPdfWord}>
                          {toDecimalString(totalCalculations?.igst)}
                        </Text>
                      </View>
                    ) : (
                      <>
                        <View style={styles.totalRow}>
                          <Text style={styles.totalLabel} hyphenationCallback={breakLongPdfWord}>
                            CGST
                          </Text>
                          <Text style={styles.totalValue} hyphenationCallback={breakLongPdfWord}>
                            {toDecimalString(totalCalculations?.cgst)}
                          </Text>
                        </View>
                        <View style={styles.totalRow}>
                          <Text style={styles.totalLabel} hyphenationCallback={breakLongPdfWord}>
                            SGST
                          </Text>
                          <Text style={styles.totalValue} hyphenationCallback={breakLongPdfWord}>
                            {toDecimalString(totalCalculations?.sgst)}
                          </Text>
                        </View>
                      </>
                    )
                  ) : null}
                  {!data?.isSplit && (
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel} hyphenationCallback={breakLongPdfWord}>
                        Total Tax
                      </Text>
                      <Text style={styles.totalValue} hyphenationCallback={breakLongPdfWord}>
                        {toDecimalString(totalCalculations?.totalTax)}
                      </Text>
                    </View>
                  )}
                  {!data?.isSplit && data?.tax?.taxId && (
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel} hyphenationCallback={breakLongPdfWord}>
                        {`${data.tax.type} ${data.tax.paymentCode} (${data.tax.rate}%)`}
                      </Text>
                      <Text style={styles.totalValue} hyphenationCallback={breakLongPdfWord}>
                        {`${data.tax.type === 'TDS' ? '- ' : '+ '}${toDecimalString(data.tax.amount)}`}
                      </Text>
                    </View>
                  )}
                  {data?.isRoundOff && data?.roundOffAmount !== 0 && (
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel} hyphenationCallback={breakLongPdfWord}>
                        Rounding
                      </Text>
                      <Text style={styles.totalValue} hyphenationCallback={breakLongPdfWord}>
                        {toDecimalString(data?.roundOffAmount)}
                      </Text>
                    </View>
                  )}

                  <View style={styles.documentTotal}>
                    <Text style={styles.documentTotalLabel} hyphenationCallback={breakLongPdfWord}>
                      Document Total
                    </Text>
                    <Text style={styles.documentTotalValue} hyphenationCallback={breakLongPdfWord}>
                      {toDecimalString(data?.total || data?.amount)}
                    </Text>
                  </View>
                </View>
              </View>

              <View wrap={false}>
                {/* Bank Details */}
                {pageType !== pageTypes?.CUSTOMER_ORDER && !data?.isSplit && data?.bankAccountId?.accountName && (
                  <View style={styles.bankSection}>
                    <View style={styles.bankTable}>
                      <View
                        style={{
                          borderRight: '1px solid #ccc',
                          borderLeft: '1px solid #ccc',
                          flexDirection: 'row',
                        }}
                      >
                        <Text style={[styles.bankHeader, { width: '20%' }]}>Bank Name</Text>
                        <Text style={[styles.bankHeader, { width: '20%' }]}>Account Code</Text>
                        <Text style={[styles.bankHeader, { width: '20%' }]}>IFSC No</Text>
                        <Text style={[styles.bankHeader, { width: '20%' }]}>Account Name</Text>
                        <Text style={[styles.bankHeader, { width: '20%' }]}>Account No</Text>
                      </View>
                      <View
                        style={{
                          flexDirection: 'row',
                          borderRight: '1px solid #ccc',
                          borderLeft: '1px solid #ccc',
                        }}
                      >
                        <Text style={[styles.bankTableCell, { width: '20%' }]}>{data?.bankAccountId?.bankName}</Text>
                        <Text style={[styles.bankTableCell, { width: '20%' }]}>{data?.bankAccountId?.accountCode}</Text>
                        <Text style={[styles.bankTableCell, { width: '20%' }]}>{data?.bankAccountId?.ifsc}</Text>
                        <Text style={[styles.bankTableCell, { width: '20%' }]}>{data?.bankAccountId?.accountName}</Text>
                        <Text style={[styles.bankTableCell, { width: '20%' }]}>{data?.bankAccountId?.accountNumber}</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Footer Section */}
                {narrationText ? (
                  <View style={styles.footer}>
                    <View style={styles.termsSection}>
                      <Text style={[styles.subtitle, { fontWeight: 'bold' }]}>Narration</Text>
                      <Text style={styles.termsFont}>{narrationText}</Text>
                    </View>
                  </View>
                ) : null}
                {showDispatchSection && <DispatchDetailsSection dispatch={data?.dispatchDetails} />}
                {pageType !== pageTypes?.CUSTOMER_ORDER && (
                  <View style={styles.footer}>
                    <View style={styles.termsSection}>
                      <Text style={[styles.subtitle, { fontWeight: 'bold' }]}>Terms & Conditions:</Text>
                      {/* {profile?.quoteConfig?.terms?.map((term, index) => (
                                        <Text style={styles.termsFont} key={index}>• {term}</Text>
                                        ))} */}
                      <Text style={styles.termsFont}>{data?.termsAndConditions}</Text>
                    </View>
                    <View style={styles.signatureSection}>
                      <Text style={styles.subtitle}>For {profile?.name}</Text>
                      {data?.authorizedSignature && (
                        <Image
                          source={{
                            uri: data?.authorizedSignature,
                            headers: { Pragma: 'no-cache', 'Cache-Control': 'no-cache' },
                            method: 'GET',
                            body: undefined,
                          }}
                          style={styles.signatureImage}
                        />
                      )}
                      <Text style={styles.subtitle}>Authorized Signatory</Text>
                    </View>
                  </View>
                )}
              </View>
            </>
          </View>

          {footerBranding}
        </Page>
      )}
      {showEWayBillSection && (
        <Page size="A4" style={styles.page} wrap>
          <View style={styles.outerBorder} fixed />
          <View style={styles.container}>
            <EWayBillFullSection data={data} qrCodeUrl={finalEWayBillQrCodeUrl} profile={profile} totals={eWayBillTotals} isIGST={isIGST} />
          </View>
          {footerBranding}
        </Page>
      )}
    </Document>
  );
};

export const ShowPDF = React.memo(ShowPDFComponent);

const PDFViewerGeneral = ({ generalData, pageType, title }) => {
  const { loading, profile, getProfile } = useProfile();

  useEffect(() => {
    const controller = new AbortController();

    getProfile({ signal: controller.signal });

    return () => controller.abort();
  }, []);

  return (
    <div className="w-full">
      {loading ? (
        <div className="flex justify-center items-center h-80">
          <span>
            <CustomLoader />
          </span>
        </div>
      ) : (
        <PDFViewer width="100%" height="800px">
          <ShowPDF
            data={generalData}
            titles={title}
            billingAddress={generalData?.vendor?.address?.billing}
            shippingAddress={generalData?.vendor?.address?.shipping}
            profile={profile}
            pageType={pageType}
          />
        </PDFViewer>
      )}
    </div>
  );
};

export default PDFViewerGeneral;
