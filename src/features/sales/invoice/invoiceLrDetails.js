import dayjs from 'dayjs';

const clean = value => (typeof value === 'string' ? value.trim() : '');

const formatDate = value => (value && dayjs(value).isValid() ? dayjs(value).format('DD/MM/YYYY') : '');

export const getInvoiceLrDetails = invoice => {
  const dispatch = invoice?.dispatchDetails;
  const eWayBill = invoice?.eWayBill;
  const trackingNumber = dispatch?.transportCourier?.transportType === 'Courier' ? '' : clean(dispatch?.transportCourier?.trackingNumber);
  const transporterName = clean(dispatch?.transportCourier?.transportId?.name) || clean(eWayBill?.transporterName);
  const vehicleNo = clean(eWayBill?.vehicleNumber) || clean(dispatch?.truckLoad?.truckNumber) || clean(dispatch?.selfDelivery?.vehicleNumber);

  const documentNumber = [eWayBill?.transDocNo, eWayBill?.railwayReceiptNumber, eWayBill?.airwayBillNumber, eWayBill?.seawayBillNumber]
    .map(clean)
    .find(value => value && value !== clean(invoice?.invoiceId));

  const lrNo = trackingNumber || documentNumber || '';

  let lrDate = '';
  if (trackingNumber) {
    lrDate = formatDate(dispatch?.goodsBookingDate);
  } else if (documentNumber) {
    lrDate = formatDate(eWayBill?.railwayReceiptDate || eWayBill?.airwayBillDate || eWayBill?.seawayBillDate);
  }

  return {
    lrNo,
    lrDate,
    transporterName,
    vehicleNo,
    dispatchMode: clean(dispatch?.dispatchMode),
  };
};
