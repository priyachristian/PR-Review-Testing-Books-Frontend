import * as Yup from 'yup';
import { RESTRICTION_DOCUMENT_LABELS } from '@/utils/constants';

export const contactPersonValidateSchema = Yup.object({
  firstName: Yup.string().trim().required('First Name is required'),
  lastName: Yup.string().trim().required('Last Name is required'),
  email: Yup.string().email('Invalid email format').optional(),
  department: Yup.string().optional(),
  authorityPower: Yup.string().optional(),
  mobileNo: Yup.string().matches(/^\d+$/, 'Mobile Number must contain only digits').required('Mobile Number is required'),
  workPhone: Yup.string().matches(/^\d*$/, 'Work Phone must contain only digits').optional(),
});

export const customerAddressValidateSchema = Yup.object({
  attention: Yup.string().nullable().notRequired(),
  billing: Yup.object({
    country: Yup.string().optional().nullable(),
    state: Yup.string().optional().nullable(),
    city: Yup.string().optional().nullable(),
    address: Yup.object({
      street1: Yup.string().optional().nullable(),
      street2: Yup.string().nullable().notRequired(),
    }),
    pinCode: Yup.string()
      .transform(value => (value === '' ? null : value))
      .nullable()
      .matches(/^\d+$/, { message: 'Pin code can only contain digits', excludeEmptyString: true }),
    faxNumber: Yup.string()
      .transform(value => (value === '' ? null : value))
      .nullable()
      .matches(/^\d+$/, {
        message: 'Fax number can only contain digits',
        excludeEmptyString: true,
      }),
    phone: Yup.string()
      .transform(value => (value === '' ? null : value))
      .nullable()
      .matches(/^\d+$/, {
        message: 'Phone number can only contain digits',
        excludeEmptyString: true,
      }),
  }),
  shipping: Yup.object({
    attention: Yup.string().nullable().notRequired(),
    country: Yup.string().optional().nullable(),
    state: Yup.string().optional().nullable(),
    city: Yup.string().optional().nullable(),
    address: Yup.object({
      street1: Yup.string().optional().nullable(),
      street2: Yup.string().nullable().notRequired(),
    }),
    pinCode: Yup.string()
      .transform(value => (value === '' ? null : value))
      .nullable()
      .matches(/^\d+$/, { message: 'Pin code can only contain digits', excludeEmptyString: true }),
    faxNumber: Yup.string()
      .transform(value => (value === '' ? null : value))
      .nullable()
      .matches(/^\d+$/, {
        message: 'Fax number can only contain digits',
        excludeEmptyString: true,
      }),
    phone: Yup.string()
      .transform(value => (value === '' ? null : value))
      .nullable()
      .matches(/^\d+$/, {
        message: 'Phone number can only contain digits',
        excludeEmptyString: true,
      }),
  }),
});

export const customerBranchValidateSchema = Yup.object({
  branch: Yup.array()
    .of(
      Yup.object({
        openingBalance: Yup.number().typeError('Opening balance be a number').nullable().notRequired(),
        currentBalance: Yup.number().typeError('Current balance be a number').nullable().notRequired(),
        creditLimit: Yup.number().typeError('Credit limit be a number').nullable().notRequired(),
        isActive: Yup.boolean().nullable().notRequired(),
        restrictedModule: Yup.array()
          .of(Yup.string().oneOf(Object.keys(RESTRICTION_DOCUMENT_LABELS)))
          .nullable()
          .notRequired(),
        paymentTermsId: Yup.string().nullable().notRequired(),
        restrictedPaymentTermsModule: Yup.array()
          .of(Yup.string().oneOf(['QUOTATION', 'SALES_ORDER', 'DELIVERY_CHALLAN', 'INVOICE', 'GRPO', 'PURCHASE_ORDER', 'BILL']))
          .nullable()
          .notRequired(),
      })
    )
    .notRequired(),
  creditLimit: Yup.number().typeError('Credit limit be a number').nullable().notRequired(),
});

export const otherDetailsValidateSchema = Yup.object({
  gstTreatment: Yup.string().required('Please select the GST treatment'),
  gstinUin: Yup.string().when('gstTreatment', {
    is: 'Registered Business Regular',
    then: schema => schema.matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'GST Number must be a valid format').required('Please enter the GST number'),
    otherwise: schema => schema.nullable().notRequired(),
  }),
  importExportCountry: Yup.string().when('gstTreatment', {
    is: 'Export',
    then: schema => schema.required('Please select the export country'),
    otherwise: schema => schema.notRequired().nullable(),
  }),
  importExportCode: Yup.string().when('gstTreatment', {
    is: 'Export',
    then: schema => schema.required('Please enter the import-export code'),
    otherwise: schema => schema.notRequired().nullable(),
  }),
  taxPreference: Yup.string()
    .transform(v => v || null)
    .oneOf(['Taxable', 'Tax Exempt', null])
    .nullable()
    .notRequired(),
  pan: Yup.string()
    .matches(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, {
      message: 'PAN Number must be a valid format',
      excludeEmptyString: true,
    })
    .nullable()
    .notRequired(),
  currency: Yup.string().trim().required('Please select currency'),
  priceList: Yup.string().nullable().notRequired(),
  includePriceListItemOnly: Yup.boolean().notRequired(),
  enablePortal: Yup.boolean().notRequired(),
  isCustomerPortalActivated: Yup.boolean().notRequired(),
  document: Yup.array().of(Yup.string()).nullable().notRequired(),
});

export const addBulkCustomerValidateSchema = Yup.object({
  firstname: Yup.string().required('First Name is required'),
  lastname: Yup.string().nullable(),
  businessPartnerType: Yup.string().required('Business Partner Type is required').oneOf(['Business', 'Individual'], "Business Partner Type must be either 'Business' or 'Individual'"),
  companyName: Yup.string().required('Company Name is required'),
  customerDisplayName: Yup.string().required('Customer Display Name is required'),
  bpEmail: Yup.string()
    .transform(value => (value === '' ? null : value))
    .email('Invalid email format')
    .nullable(),
  customerPhoneNumber: Yup.string().nullable(),
  currency: Yup.string()
    .trim()
    .transform(value => (value != null && value !== '' ? String(value).trim().toUpperCase() : value))
    .required('Currency is required'),
  gstTreatment: Yup.string()
    .required('GST Treatment is required')
    .oneOf(['Registered Business Regular', 'Unregistered Business Regular'], "GST Treatment must be either 'Registered Business Regular' or 'Unregistered Business Regular'"),
  gstinUin: Yup.string().when('gstTreatment', {
    is: 'Registered Business Regular',
    then: schema => schema.required('GSTIN is required for Registered Business Regular'),
    otherwise: schema => schema.nullable(),
  }),
  taxPreference: Yup.string().oneOf(['Taxable', 'Tax Exempt'], "Tax Preference must be either 'Taxable' or 'Tax Exempt'").nullable(),
  pan: Yup.string().nullable(),
  paymentTerms: Yup.string().nullable().notRequired(),
  billingAttention: Yup.string().nullable().notRequired(),
  billingCountry: Yup.string().nullable().notRequired(),
  billingStreet1: Yup.string().nullable().notRequired(),
  billingStreet2: Yup.string().nullable().notRequired(),
  billingCity: Yup.string().nullable().notRequired(),
  billingState: Yup.string().nullable().notRequired(),
  billingPinCode: Yup.string()
    .transform(value => (value === '' ? null : value))
    .nullable()
    .matches(/^\d+$/, { message: 'Billing pin code can only contain digits', excludeEmptyString: true })
    .notRequired(),
  billingPhone: Yup.string()
    .transform(value => (value === '' ? null : value))
    .nullable()
    .matches(/^\d+$/, { message: 'Billing phone can only contain digits', excludeEmptyString: true })
    .notRequired(),
  billingFaxNumber: Yup.string()
    .transform(value => (value === '' ? null : value))
    .nullable()
    .matches(/^\d+$/, { message: 'Billing fax number can only contain digits', excludeEmptyString: true })
    .notRequired(),
  shippingAttention: Yup.string().nullable().notRequired(),
  shippingCountry: Yup.string().nullable().notRequired(),
  shippingStreet1: Yup.string().nullable().notRequired(),
  shippingStreet2: Yup.string().nullable().notRequired(),
  shippingCity: Yup.string().nullable().notRequired(),
  shippingState: Yup.string().nullable().notRequired(),
  shippingPinCode: Yup.string()
    .transform(value => (value === '' ? null : value))
    .nullable()
    .matches(/^\d+$/, { message: 'Shipping pin code can only contain digits', excludeEmptyString: true })
    .notRequired(),
  shippingPhone: Yup.string()
    .transform(value => (value === '' ? null : value))
    .nullable()
    .matches(/^\d+$/, { message: 'Shipping phone can only contain digits', excludeEmptyString: true })
    .notRequired(),
  shippingFaxNumber: Yup.string()
    .transform(value => (value === '' ? null : value))
    .nullable()
    .matches(/^\d+$/, { message: 'Shipping fax number can only contain digits', excludeEmptyString: true })
    .notRequired(),
});

export const customerMasterValidateSchema = (autoGenerate = true, enablePortal = false) =>
  Yup.object({
    customerNumber: autoGenerate ? Yup.string().notRequired() : Yup.string().trim().required('Please enter the customer number'),
    firstname: Yup.string().trim().required('Please enter the first name'),
    lastname: Yup.string().trim().nullable().notRequired(),
    businessPartnerType: Yup.string().required('Please select a business partner type'),
    companyName: Yup.string().trim().required('Please enter the company name'),
    customerDisplayName: Yup.string().trim().required('Please enter the customer display name'),
    bpEmail: enablePortal
      ? Yup.string()
          .email('Invalid email address')
          .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid email format, must be like 'demo@gmail.com'")
          .required('Email is required when portal is enabled')
      : Yup.string()
          .transform(value => (value === '' ? null : value))
          .email('Invalid email address')
          .matches(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, "Invalid email format, must be like 'demo@gmail.com'")
          .optional(),
    customerPhoneNumber: Yup.string().matches(/^\d+$/, 'Only contain digits').optional(),
    isCustomer: Yup.boolean(),
    isVendor: Yup.boolean(),
    branch: Yup.array()
      .of(
        Yup.object({
          openingBalance: Yup.number().typeError('Opening balance be a number').nullable().notRequired(),
          creditLimit: Yup.number().typeError('Credit limit be a number').nullable().notRequired(),
          restrictedModule: Yup.array()
            .of(Yup.string().oneOf(Object.keys(RESTRICTION_DOCUMENT_LABELS)))
            .nullable()
            .notRequired(),
          paymentTermsId: Yup.string().nullable().notRequired(),
          restrictedPaymentTermsModule: Yup.array()
            .of(Yup.string().oneOf(['QUOTATION', 'SALES_ORDER', 'DELIVERY_CHALLAN', 'INVOICE', 'GRPO', 'PURCHASE_ORDER', 'BILL']))
            .nullable()
            .notRequired(),
        })
      )
      .min(1, 'At least one branch is required'),
    creditLimit: Yup.number().typeError('Credit limit be a number').nullable().notRequired(),
    restrictedModule: Yup.array()
      .of(Yup.string().oneOf(Object.keys(RESTRICTION_DOCUMENT_LABELS)))
      .nullable()
      .notRequired(),
    paymentTermsId: Yup.string().nullable().notRequired(),
    restrictedPaymentTermsModule: Yup.array()
      .of(Yup.string().oneOf(['QUOTATION', 'SALES_ORDER', 'DELIVERY_CHALLAN', 'INVOICE', 'GRPO', 'PURCHASE_ORDER', 'BILL']))
      .nullable()
      .notRequired(),
    linked: Yup.boolean(),
    linkedId: Yup.string().when('linked', {
      is: true,
      then: schema => schema.required('Please select a Vendor/Customer name'),
      otherwise: schema => schema.optional(),
    }),
  }).test('at-least-one-checkbox', null, (values, { createError }) => {
    if (!values.isCustomer && !values.isVendor) {
      return createError({ path: 'roleError', message: 'Select at least one role' });
    }
    return true;
  });
