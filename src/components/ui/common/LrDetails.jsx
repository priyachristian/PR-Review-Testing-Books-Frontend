import dayjs from 'dayjs';
import DisplayUploadedDocuments from '@/components/dataDisplay/statCard/DisplayUploadedDocuments';
import { E_WAY_BILL_STATUS, TRANSPORT_MODES } from '@/utils/constants';
import DetailField from './DetailField';

const formatDate = value => (value && dayjs(value).isValid() ? dayjs(value).format('DD/MM/YYYY') : '');
const hasValue = value => value !== null && value !== undefined && String(value).trim() !== '';

const FieldGrid = ({ fields }) => (
  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
    {fields.map(field =>
      field.children ? (
        <DetailField key={field.label} label={field.label} truncate={false}>
          {field.children}
        </DetailField>
      ) : (
        <DetailField key={field.label} label={field.label} value={field.value} truncate={field.truncate !== false} />
      )
    )}
  </div>
);

const Section = ({ title, children }) => (
  <div className="my-container container-spacing">
    <p className="font-bold text-lg mb-3">{title}</p>
    {children}
  </div>
);

const LrDetails = ({ details, dispatch, eWayBill }) => {
  const transport = dispatch?.transportCourier;
  const truck = dispatch?.truckLoad;
  const selfDelivery = dispatch?.selfDelivery;
  const isCourier = transport?.transportType === 'Courier';
  const vehicleType = eWayBill?.vehicleType === 'R' ? 'Regular' : eWayBill?.vehicleType === 'O' ? 'ODC' : eWayBill?.vehicleType;
  const trackingLink = transport?.trackingLink;
  const attachments = [
    { label: 'Booking Copy', files: transport?.bookingCopyImage },
    { label: 'Truck & Goods Image', files: truck?.truck_goodsImage },
    { label: 'Vehicle & Goods Image', files: selfDelivery?.vehicle_goodsImage },
  ].filter(({ files }) => (Array.isArray(files) ? files.length > 0 : Boolean(files)));

  const lrFields = [
    { label: 'LR No', value: details?.lrNo },
    { label: 'LR Date', value: details?.lrDate },
    { label: 'Transporter', value: details?.transporterName },
    { label: 'Vehicle No', value: details?.vehicleNo },
    { label: 'Dispatch Mode', value: details?.dispatchMode || dispatch?.dispatchMode },
    { label: 'Goods Booking Date', value: formatDate(dispatch?.goodsBookingDate) },
    { label: 'Approx Delivery Date', value: formatDate(dispatch?.approxDeliveryDate) },
    { label: 'Transport Type', value: transport?.transportType },
    { label: 'Tracking Number', value: isCourier ? transport?.trackingNumber : '' },
    trackingLink && /^https?:\/\//i.test(trackingLink)
      ? {
          label: 'Tracking Link',
          children: (
            <a href={trackingLink} target="_blank" rel="noreferrer" className="text-[13px] font-medium text-[#1e293b] break-all underline">
              {trackingLink}
            </a>
          ),
        }
      : { label: 'Tracking Link', value: trackingLink },
    { label: 'Truck Name & Type', value: truck?.truckName },
    { label: 'Truck Number', value: truck?.truckNumber && truck.truckNumber !== details?.vehicleNo ? truck.truckNumber : '' },
    { label: 'Driver Name', value: truck?.driverName || selfDelivery?.driverName },
    { label: 'Driver Contact', value: truck?.driverContact || selfDelivery?.driverContact },
    { label: 'Delivery/Pickup Boy', value: selfDelivery?.deliveryBoyName },
  ].filter(field => field.children || hasValue(field.value));

  const eWayFields = [
    { label: 'Transport Mode', value: TRANSPORT_MODES[eWayBill?.transportMode] || '' },
    { label: 'Transport Distance (KM)', value: eWayBill?.distance },
    { label: 'E-Way Bill No', value: eWayBill?.eWayBillNo },
    { label: 'E-Way Bill Date', value: formatDate(eWayBill?.eWayBillDate) },
    { label: 'E-Way Bill Status', value: E_WAY_BILL_STATUS[eWayBill?.status]?.label || eWayBill?.status },
    { label: 'Transporter GSTIN', value: eWayBill?.transporterId },
    { label: 'Transport Document Type', value: eWayBill?.transDocType },
    { label: 'Transport Document No', value: eWayBill?.transDocNo },
    { label: 'Railway Receipt Number', value: eWayBill?.railwayReceiptNumber },
    { label: 'Railway Receipt Date', value: formatDate(eWayBill?.railwayReceiptDate) },
    { label: 'Airway Bill Number', value: eWayBill?.airwayBillNumber },
    { label: 'Airway Bill Date', value: formatDate(eWayBill?.airwayBillDate) },
    { label: 'Bill of Lading Number', value: eWayBill?.seawayBillNumber },
    { label: 'Bill of Lading Date', value: formatDate(eWayBill?.seawayBillDate) },
    { label: 'Vehicle Type', value: vehicleType },
  ].filter(field => hasValue(field.value));

  const hasDetails = lrFields.length > 0 || eWayFields.length > 0 || attachments.length > 0;

  if (!hasDetails) {
    return (
      <Section title="LR Details">
        <p className="text-sm text-gray-500">No LR details have been added for this invoice.</p>
      </Section>
    );
  }

  return (
    <div className="space-y-4">
      {lrFields.length > 0 && (
        <Section title="LR Details">
          <FieldGrid fields={lrFields} />
        </Section>
      )}

      {eWayFields.length > 0 && (
        <Section title="E-Way Bill">
          <FieldGrid fields={eWayFields} />
        </Section>
      )}

      {attachments.length > 0 && (
        <Section title="Attachments">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-3">
            {attachments.map(attachment => (
              <DetailField key={attachment.label} label={attachment.label} truncate={false}>
                <DisplayUploadedDocuments fileArray={attachment.files} bordered={false} />
              </DetailField>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
};

export default LrDetails;
