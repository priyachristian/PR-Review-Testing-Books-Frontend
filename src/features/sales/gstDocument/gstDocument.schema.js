import dayjs from 'dayjs';
import * as Yup from 'yup';

export const eWayBillSchema = Yup.object().shape({
  transMode: Yup.string().nullable().optional().oneOf(['1', '2', '3', '4'], 'Select valid Transport Mode (1-4).'),

  distance: Yup.number()
    .typeError('Distance must be a number.')
    .min(0, 'Distance must be between 0 and 4000 KM.')
    .max(4000, 'Distance must be between 0 and 4000 KM.')
    .required('Distance is required.'),

  transporterId: Yup.string()
    .nullable()
    .when('transMode', {
      is: mode => !mode, // No transport mode
      then: schema =>
        schema
          .required('Transporter ID (GSTIN) is required when Transport Mode is not provided.')
          .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid Transporter GSTIN format.'),
      otherwise: schema => schema.notRequired().matches(/^$|^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid Transporter GSTIN format.'),
    }),

  transporterName: Yup.string()
    .nullable()
    .when('transMode', {
      is: mode => !mode,
      then: schema => schema.required('Transporter Name is required when Transport Mode is not provided.'),
      otherwise: schema => schema.notRequired(),
    }),

  vehNo: Yup.string()
    .nullable()
    .when('transMode', {
      is: '1', // Road
      then: schema =>
        schema.required('Vehicle Number is required for Road transport.').matches(/^[A-Z]{2}\d{1,2}[A-Z]{1,2}\d{1,4}$/, 'Enter valid vehicle number (e.g. MH12AB1234, no spaces or dashes).'),
      otherwise: schema => schema.strip(), // remove irrelevant fields
    }),

  vehType: Yup.string()
    .nullable()
    .when('transMode', {
      is: '1',
      then: schema => schema.required('Vehicle Type is required for Road transport.').oneOf(['R', 'O'], "Select 'R' (Regular) or 'O' (ODC) for Vehicle Type."),
      otherwise: schema => schema.strip(),
    }),

  rrNo: Yup.string()
    .nullable()
    .when('transMode', {
      is: '2',
      then: schema => schema.required('Railway Receipt Number is required for Rail transport.').matches(/^[A-Za-z0-9/-]{1,20}$/, 'Enter a valid RR number (max 20 chars, letters/numbers only).'),
      otherwise: schema => schema.strip(),
    }),

  rrDate: Yup.date()
    .nullable()
    .when('transMode', {
      is: '2',
      then: schema => schema.required('RR Date is required for Rail transport.').test('not-in-future', 'RR Date cannot be in the future.', value => !value || !dayjs(value).isAfter(dayjs(), 'day')),
      otherwise: schema => schema.strip(),
    }),

  awbNo: Yup.string()
    .nullable()
    .when('transMode', {
      is: '3',
      then: schema => schema.required('Airway Bill Number is required for Air transport.').matches(/^[A-Za-z0-9/-]{1,20}$/, 'Enter a valid AWB number (max 20 chars).'),
      otherwise: schema => schema.strip(),
    }),

  awbDate: Yup.date()
    .nullable()
    .when('transMode', {
      is: '3',
      then: schema => schema.required('AWB Date is required for Air transport.').test('not-in-future', 'AWB Date cannot be in the future.', value => !value || !dayjs(value).isAfter(dayjs(), 'day')),
      otherwise: schema => schema.strip(),
    }),

  blNo: Yup.string()
    .nullable()
    .when('transMode', {
      is: '4',
      then: schema => schema.required('Bill of Lading Number is required for Ship transport.').matches(/^[A-Za-z0-9/-]{1,20}$/, 'Enter a valid BL number (max 20 chars).'),
      otherwise: schema => schema.strip(),
    }),

  blDate: Yup.date()
    .nullable()
    .when('transMode', {
      is: '4',
      then: schema => schema.required('BL Date is required for Ship transport.').test('not-in-future', 'BL Date cannot be in the future.', value => !value || !dayjs(value).isAfter(dayjs(), 'day')),
      otherwise: schema => schema.strip(),
    }),
});

export const generateEInvoiceSchema = Yup.object().shape({
  withEwb: Yup.boolean().required('Select a valid option.'),

  transMode: Yup.string()
    .nullable()
    .oneOf(['1', '2', '3', '4'], 'Select valid Transport Mode (1-4).')
    .when('withEwb', {
      is: true,
      then: schema => schema.optional(),
      otherwise: schema => schema.strip(),
    }),
  distance: Yup.number()
    .typeError('Distance must be a number.')
    .min(0, 'Distance must be between 0 and 4000 KM.')
    .max(4000, 'Distance must be between 0 and 4000 KM.')
    .when('withEwb', {
      is: true,
      then: schema => schema.required('Distance is required.'),
      otherwise: schema => schema.strip(),
    }),

  transporterId: Yup.string()
    .nullable()
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid Transporter GSTIN format.')
    .when(['withEwb', 'transMode'], {
      is: (withEwb, transMode) => withEwb && !transMode,
      then: schema => schema.required('Transporter ID (GSTIN) is required when Transport Mode is not provided.'),
      otherwise: schema => schema.notRequired(),
    }),

  transporterName: Yup.string()
    .nullable()
    .when(['withEwb', 'transMode'], {
      is: (withEwb, transMode) => withEwb && !transMode,
      then: schema => schema.required('Transporter Name is required when Transport Mode is not provided.'),
      otherwise: schema => schema.notRequired(),
    }),

  vehNo: Yup.string().when(['withEwb', 'transMode'], {
    is: (withEwb, transMode) => withEwb && transMode === '1',
    then: schema =>
      schema.required('Vehicle Number is required for Road transport.').matches(/^[A-Z]{2}\d{1,2}[A-Z]{1,2}\d{1,4}$/, 'Enter valid vehicle number (e.g. MH12AB1234, no spaces or dashes).'),
    otherwise: schema => schema.strip(),
  }),

  vehType: Yup.string().when(['withEwb', 'transMode'], {
    is: (withEwb, transMode) => withEwb && transMode === '1',
    then: schema => schema.required('Vehicle Type is required for Road transport.').oneOf(['R', 'O'], "Select 'R' (Regular) or 'O' (ODC)."),
    otherwise: schema => schema.strip(),
  }),

  rrNo: Yup.string().when(['withEwb', 'transMode'], {
    is: (withEwb, transMode) => withEwb && transMode === '2',
    then: schema => schema.required('Railway Receipt Number is required for Rail transport.'),
    otherwise: schema => schema.strip(),
  }),

  rrDate: Yup.date().when(['withEwb', 'transMode'], {
    is: (withEwb, transMode) => withEwb && transMode === '2',
    then: schema => schema.required('RR Date is required for Rail transport.'),
    otherwise: schema => schema.strip(),
  }),

  awbNo: Yup.string().when(['withEwb', 'transMode'], {
    is: (withEwb, transMode) => withEwb && transMode === '3',
    then: schema => schema.required('Airway Bill Number is required for Air transport.'),
    otherwise: schema => schema.strip(),
  }),

  awbDate: Yup.date().when(['withEwb', 'transMode'], {
    is: (withEwb, transMode) => withEwb && transMode === '3',
    then: schema => schema.required('AWB Date is required for Air transport.'),
    otherwise: schema => schema.strip(),
  }),

  blNo: Yup.string().when(['withEwb', 'transMode'], {
    is: (withEwb, transMode) => withEwb && transMode === '4',
    then: schema => schema.required('Bill of Lading Number is required for Ship transport.'),
    otherwise: schema => schema.strip(),
  }),

  blDate: Yup.date().when(['withEwb', 'transMode'], {
    is: (withEwb, transMode) => withEwb && transMode === '4',
    then: schema => schema.required('BL Date is required for Ship transport.'),
    otherwise: schema => schema.strip(),
  }),
});

export const cancelEInvoiceSchema = Yup.object().shape({
  cancelReason: Yup.string().required('Select a valid reason.'),
  cancelRemark: Yup.string().when('cancelReason', {
    is: cancelReason => cancelReason === '4',
    then: schema => schema.required('Remark is required.'),
    otherwise: schema => schema.strip(),
  }),
});

export const cancelEWayBillSchema = Yup.object().shape({
  cancelReason: Yup.string().required('Select a valid reason.'),
});

export const onlyEwayBillSchema = Yup.object().shape({
  supplyType: Yup.string().required('Supply Type is required.').oneOf(['O', 'I'], "Select 'O' (Outward) or 'I' (Inward) for Supply Type."),

  subSupplyType: Yup.string().required('Sub Supply Type is required.').oneOf(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'], 'Select a valid Sub Supply Type (1-12).'),

  subSupplyDesc: Yup.string().when('subSupplyType', {
    is: '8',
    then: schema => schema.required('Sub Supply Description is required when Sub Supply Type is 8.'),
    otherwise: schema => schema.strip(),
  }),

  transMode: Yup.string().nullable().optional().oneOf(['1', '2', '3', '4'], 'Select valid Transport Mode (1-4).'),

  distance: Yup.number()
    .typeError('Distance must be a number.')
    .min(0, 'Distance must be between 0 and 4000 KM.')
    .max(4000, 'Distance must be between 0 and 4000 KM.')
    .required('Distance is required.'),

  transporterId: Yup.string()
    .nullable()
    .when('transMode', {
      is: mode => !mode, // No transport mode
      then: schema =>
        schema
          .required('Transporter ID (GSTIN) is required when Transport Mode is not provided.')
          .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid Transporter GSTIN format.'),
      otherwise: schema => schema.notRequired().matches(/^$|^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid Transporter GSTIN format.'),
    }),

  transporterName: Yup.string()
    .nullable()
    .when('transMode', {
      is: mode => !mode,
      then: schema => schema.required('Transporter Name is required when Transport Mode is not provided.'),
      otherwise: schema => schema.notRequired(),
    }),

  vehNo: Yup.string()
    .nullable()
    .when('transMode', {
      is: '1', // Road
      then: schema =>
        schema.required('Vehicle Number is required for Road transport.').matches(/^[A-Z]{2}\d{1,2}[A-Z]{1,2}\d{1,4}$/, 'Enter valid vehicle number (e.g. MH12AB1234, no spaces or dashes).'),
      otherwise: schema => schema.strip(),
    }),

  vehType: Yup.string()
    .nullable()
    .when('transMode', {
      is: '1',
      then: schema => schema.required('Vehicle Type is required for Road transport.').oneOf(['R', 'O'], "Select 'R' (Regular) or 'O' (ODC) for Vehicle Type."),
      otherwise: schema => schema.strip(),
    }),

  rrNo: Yup.string()
    .nullable()
    .when('transMode', {
      is: '2',
      then: schema => schema.required('Railway Receipt Number is required for Rail transport.').matches(/^[A-Za-z0-9/-]{1,20}$/, 'Enter a valid RR number (max 20 chars, letters/numbers only).'),
      otherwise: schema => schema.strip(),
    }),

  rrDate: Yup.date()
    .nullable()
    .when('transMode', {
      is: '2',
      then: schema => schema.required('RR Date is required for Rail transport.').test('not-in-future', 'RR Date cannot be in the future.', value => !value || !dayjs(value).isAfter(dayjs(), 'day')),
      otherwise: schema => schema.strip(),
    }),

  awbNo: Yup.string()
    .nullable()
    .when('transMode', {
      is: '3',
      then: schema => schema.required('Airway Bill Number is required for Air transport.').matches(/^[A-Za-z0-9/-]{1,20}$/, 'Enter a valid AWB number (max 20 chars).'),
      otherwise: schema => schema.strip(),
    }),

  awbDate: Yup.date()
    .nullable()
    .when('transMode', {
      is: '3',
      then: schema => schema.required('AWB Date is required for Air transport.').test('not-in-future', 'AWB Date cannot be in the future.', value => !value || !dayjs(value).isAfter(dayjs(), 'day')),
      otherwise: schema => schema.strip(),
    }),

  blNo: Yup.string()
    .nullable()
    .when('transMode', {
      is: '4',
      then: schema => schema.required('Bill of Lading Number is required for Ship transport.').matches(/^[A-Za-z0-9/-]{1,20}$/, 'Enter a valid BL number (max 20 chars).'),
      otherwise: schema => schema.strip(),
    }),

  blDate: Yup.date()
    .nullable()
    .when('transMode', {
      is: '4',
      then: schema => schema.required('BL Date is required for Ship transport.').test('not-in-future', 'BL Date cannot be in the future.', value => !value || !dayjs(value).isAfter(dayjs(), 'day')),
      otherwise: schema => schema.strip(),
    }),
});

// ---- Optional fields the generate modal offers on top of the forms above. Empty values are always valid.
const OPTIONAL_GSTIN_REGEX = /^$|^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const OPTIONAL_HSN_REGEX = /^$|^(\d{4}|\d{6}|\d{8})$/;

const optionalText = (label, { min = 3, max = 100 } = {}) =>
  Yup.string()
    .nullable()
    .max(max, `${label} must not exceed ${max} characters.`)
    .test('min-when-filled', `${label} must be at least ${min} characters.`, value => !value?.trim() || value.trim().length >= min);

const partyOptionShape = {
  chargeHsn: Yup.array().of(Yup.string().nullable().matches(OPTIONAL_HSN_REGEX, 'HSN must be 4, 6 or 8 digits.')),
};

export const eInvoiceOptionsSchema = Yup.object().shape({
  ...partyOptionShape,
  ecommerceGstin: Yup.string().nullable().matches(OPTIONAL_GSTIN_REGEX, 'Invalid E-Commerce GSTIN format.'),
  sellerTradeName: optionalText('Seller Trade Name'),
  poNumber: optionalText('PO Number', { min: 1, max: 16 }),
  remarks: optionalText('Remarks'),
});

export const eWayBillOptionsSchema = Yup.object().shape({
  ...partyOptionShape,
  transDocNo: optionalText('Transport Document Number', { min: 1, max: 15 }),
});
