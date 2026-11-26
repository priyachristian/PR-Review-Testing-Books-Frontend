import dayjs from 'dayjs';

const toEwbApiDate = value => (value ? dayjs(value).format('YYYY-MM-DD') : null);

const TRANSPORT_MODE_ROAD = '1';

// Formik initial values for the transport section shared by every e-way bill form.
export const EWB_TRANSPORT_INITIAL_VALUES = {
  transMode: null,
  distance: 0,
  vehNo: '',
  vehType: null,
  rrNo: '',
  rrDate: null,
  awbNo: '',
  awbDate: null,
  blNo: '',
  blDate: null,
  transporterId: '',
  transporterName: '',
};

// The standalone e-way bill API names the mode and transporter keys differently from the IRN-linked APIs.
export const buildEwbTransportDetails = (values, { standalone = false } = {}) => {
  const modeNum = Number(values.transMode);
  const transportMode = modeNum === 0 ? null : String(modeNum);

  return {
    ...(standalone ? { transportMode } : { TransMode: transportMode }),
    Distance: String(Number(values.distance || 0)),
    VehType: values.vehType,
    VehNo: values.vehNo,
    RRNo: values.rrNo,
    RRDate: toEwbApiDate(values.rrDate),
    AWBNo: values.awbNo,
    AWBDate: toEwbApiDate(values.awbDate),
    BLNo: values.blNo,
    BLDate: toEwbApiDate(values.blDate),
    ...(standalone ? { transporterId: values.transporterId, transporterName: values.transporterName } : { TransId: values.transporterId, TransName: values.transporterName }),
  };
};

export const toHsnRows = (items = []) =>
  items.map((item, index) => ({
    rowKey: index,
    itemId: item?._id || item?.itemId,
    itemNo: item?.itemNo,
    itemName: item?.itemName,
    hsnCode: item?.hsnCode || '',
    originalHsnCode: item?.hsnCode || '',
  }));

// Only rows the user actually changed are sent, so an untouched table changes nothing.
export const buildHsnUpdates = (rows = []) =>
  rows.filter(row => row.itemId && row.hsnCode?.trim() && row.hsnCode.trim() !== row.originalHsnCode).map(row => ({ itemId: row.itemId, hsn: row.hsnCode.trim() }));

/**
 * Formik initial values for the option fields, taken from the defaults the backend reports for the document.
 * `standalone` adds the supply defaults of the standalone e-way bill.
 */
export const buildOptionInitialValues = (documentOptions, { standalone = false } = {}) => {
  const defaults = documentOptions?.defaults || {};
  return {
    sellerTradeName: defaults.sellerTradeName || '',
    ecommerceGstin: '',
    poNumber: '',
    poDate: null,
    remarks: '',
    documentType: defaults.documentType || null,
    transDocNo: '',
    transDocDate: null,
    chargeHsn: (documentOptions?.additionalCharges || []).map(charge => charge.hsn || ''),
    // The document type decides what the standalone e-way bill opens on (e.g. an inward sales return for a credit note).
    ...(standalone && defaults.supplyType && { supplyType: defaults.supplyType, subSupplyType: defaults.subSupplyType, subSupplyDesc: defaults.subSupplyDesc || '' }),
  };
};

const changedOrUndefined = (value, initialValue) => {
  const trimmed = typeof value === 'string' ? value.trim() : value;
  return trimmed && trimmed !== initialValue ? trimmed : undefined;
};

const withoutUndefined = fields => Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined));

// Charge HSN choices common to both documents; unchanged defaults are left out. Addresses always come from the
// document itself, since its address decided the place of supply and the tax.
const buildChargeOptions = (values, initialValues) => {
  const additionalChargeHsn = (values.chargeHsn || []).map((hsn, index) => ({ index, hsn: hsn?.trim() })).filter(({ hsn, index }) => hsn && hsn !== initialValues.chargeHsn?.[index]);
  return { additionalChargeHsn: additionalChargeHsn.length ? additionalChargeHsn : undefined };
};

// Goods or service per line is not chosen here: the backend reads it from each item's master category.
export const buildEInvoiceOptions = (values, initialValues) =>
  withoutUndefined({
    ...buildChargeOptions(values, initialValues),
    sellerTradeName: changedOrUndefined(values.sellerTradeName, initialValues.sellerTradeName),
    ecommerceGstin: changedOrUndefined(values.ecommerceGstin, ''),
    poNumber: changedOrUndefined(values.poNumber, ''),
    poDate: values.poNumber?.trim() && values.poDate ? toEwbApiDate(values.poDate) : undefined,
    remarks: changedOrUndefined(values.remarks, ''),
  });

export const buildEWayBillOptions = (values, initialValues) => {
  const isRoad = values.transMode === TRANSPORT_MODE_ROAD;
  const transDocNo = isRoad ? changedOrUndefined(values.transDocNo, '') : undefined;

  return withoutUndefined({
    ...buildChargeOptions(values, initialValues),
    documentType: changedOrUndefined(values.documentType, initialValues.documentType),
    transDocNo,
    transDocDate: transDocNo && values.transDocDate ? toEwbApiDate(values.transDocDate) : undefined,
  });
};
