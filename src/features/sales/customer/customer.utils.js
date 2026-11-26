import dayjs from 'dayjs';
import { getFinancialYearStartYear } from '@/utils/util';
import { BULK_CUSTOMER_VERIFY_ERROR } from '@/utils/constants';

export const ADDRESS_TYPES = ['billing', 'shipping'];

export const getFYParameterValue = date => {
  const startYear = getFinancialYearStartYear(date);
  if (startYear == null) return null;
  return `${startYear}-${String(startYear + 1).slice(-2)}`;
};

export const getFYPickerValue = fy => {
  if (!fy) return dayjs();
  const [startYear] = String(fy).split('-');
  const parsedYear = Number(startYear);
  if (!Number.isFinite(parsedYear)) return dayjs();
  return dayjs(`${parsedYear}-04-01`);
};

export const isCurrencyMissingError = error => error?.name === BULK_CUSTOMER_VERIFY_ERROR.CURRENCY_NOT_AVAILABLE;

export const isPaymentTermsMissingError = error => error?.name === BULK_CUSTOMER_VERIFY_ERROR.INVALID_PAYMENT_TERMS;

const LOCATION_ERROR_BY_ADDRESS = {
  billing: {
    country: [BULK_CUSTOMER_VERIFY_ERROR.BILLING_COUNTRY_NOT_FOUND, BULK_CUSTOMER_VERIFY_ERROR.BILLING_COUNTRY_REQUIRED],
    state: [BULK_CUSTOMER_VERIFY_ERROR.BILLING_STATE_NOT_FOUND, BULK_CUSTOMER_VERIFY_ERROR.BILLING_STATE_REQUIRED],
    city: [BULK_CUSTOMER_VERIFY_ERROR.BILLING_CITY_NOT_FOUND, BULK_CUSTOMER_VERIFY_ERROR.BILLING_CITY_REQUIRED],
  },
  shipping: {
    country: [BULK_CUSTOMER_VERIFY_ERROR.SHIPPING_COUNTRY_NOT_FOUND, BULK_CUSTOMER_VERIFY_ERROR.SHIPPING_COUNTRY_REQUIRED],
    state: [BULK_CUSTOMER_VERIFY_ERROR.SHIPPING_STATE_NOT_FOUND, BULK_CUSTOMER_VERIFY_ERROR.SHIPPING_STATE_REQUIRED],
    city: [BULK_CUSTOMER_VERIFY_ERROR.SHIPPING_CITY_NOT_FOUND, BULK_CUSTOMER_VERIFY_ERROR.SHIPPING_CITY_REQUIRED],
  },
};

const LOCATION_ERROR_NAMES = new Set(Object.values(LOCATION_ERROR_BY_ADDRESS).flatMap(errors => Object.values(errors).flat()));

export const isLocationMissingError = error => LOCATION_ERROR_NAMES.has(error?.name);

/** Resolves billing vs shipping from the verify error name. */
export const getAddressTypeFromLocationError = error => {
  const name = String(error?.name || '');
  if (name.startsWith('BILLING_')) return 'billing';
  if (name.startsWith('SHIPPING_')) return 'shipping';
  return null;
};

export const isLocationErrorForAddressType = (error, addressType) => isLocationMissingError(error) && getAddressTypeFromLocationError(error) === addressType;

/**
 * Highest-severity location fix level for an address type.
 * country → need Country + State + City; state → State + City; city → City only.
 */
export const getLocationFixLevel = (errors = [], addressType) => {
  const addressErrorNames = LOCATION_ERROR_BY_ADDRESS[addressType];
  if (!addressErrorNames) return null;

  const addressErrors = errors.filter(error => isLocationErrorForAddressType(error, addressType));
  if (!addressErrors.length) return null;

  if (addressErrors.some(error => addressErrorNames.country.includes(error?.name))) return 'country';
  if (addressErrors.some(error => addressErrorNames.state.includes(error?.name))) return 'state';
  if (addressErrors.some(error => addressErrorNames.city.includes(error?.name))) return 'city';
  return null;
};

/** Error names resolved after a successful location fix for one address type. */
export const getLocationErrorNamesClearedByFix = (addressType, fixLevel) => {
  const addressErrorNames = LOCATION_ERROR_BY_ADDRESS[addressType];
  if (!addressErrorNames) return [];

  if (fixLevel === 'country') return [...addressErrorNames.country, ...addressErrorNames.state, ...addressErrorNames.city];
  if (fixLevel === 'state') return [...addressErrorNames.state, ...addressErrorNames.city];
  return [...addressErrorNames.city];
};

/** Errors remaining after a successful location fix for one address type. */
export const getLocationErrorsClearedByFix = (errors = [], addressType, fixLevel) => {
  const clearNames = new Set(getLocationErrorNamesClearedByFix(addressType, fixLevel));
  if (!clearNames.size) return errors;
  return errors.filter(error => !clearNames.has(error?.name));
};

export const isVerifyErrorResolved = (record, errorName) => (record?.resolvedErrorNames || []).includes(errorName);

export const getUnresolvedVerifyErrors = (record = {}) => {
  const resolvedErrorNames = new Set(record.resolvedErrorNames || []);
  return (record.errors || []).filter(error => !resolvedErrorNames.has(error?.name));
};

export const withResolvedVerifyErrors = (record, errorNames = []) => ({
  ...record,
  resolvedErrorNames: [...new Set([...(record.resolvedErrorNames || []), ...errorNames])],
});

export const applyCurrencyFix = (record, currencyCode) =>
  withResolvedVerifyErrors(
    {
      ...record,
      otherDetails: {
        ...(record.otherDetails || {}),
        currency: currencyCode,
      },
    },
    [BULK_CUSTOMER_VERIFY_ERROR.CURRENCY_NOT_AVAILABLE]
  );

export const applyPaymentTermsFix = (record, paymentTerms) => withResolvedVerifyErrors({ ...record, paymentTerms }, [BULK_CUSTOMER_VERIFY_ERROR.INVALID_PAYMENT_TERMS]);

export const applyLocationFix = (record, addressType, fixLevel, locationValues) => {
  const currentAddress = record.address?.[addressType] || {};
  return withResolvedVerifyErrors(
    {
      ...record,
      address: {
        ...(record.address || {}),
        [addressType]: {
          ...currentAddress,
          country: locationValues.country,
          state: locationValues.state,
          city: locationValues.city,
          address: currentAddress.address || { street1: '', street2: '' },
        },
      },
    },
    getLocationErrorNamesClearedByFix(addressType, fixLevel)
  );
};

export const getResolvedSelectValue = (record, errorName, value) => (isVerifyErrorResolved(record, errorName) ? value : undefined);

export const isLocationFixResolved = (record, addressType, fixLevel) => getLocationErrorNamesClearedByFix(addressType, fixLevel).some(name => isVerifyErrorResolved(record, name));

/** Valid records for preview/import, without removing assign dropdowns on Step 3. */
export const getEffectiveVerifyRecords = verifyRecord => {
  if (!verifyRecord) {
    return {
      totalRecords: 0,
      validRecords: [],
      invalidRecords: [],
      validRecordsCount: 0,
      invalidRecordsCount: 0,
    };
  }

  const resolvedRecords = [];
  const stillInvalidRecords = [];

  (verifyRecord.invalidRecords ?? []).forEach(record => {
    const unresolvedErrors = getUnresolvedVerifyErrors(record);
    if (unresolvedErrors.length === 0) {
      const validRecord = { ...record };
      delete validRecord.errors;
      delete validRecord.resolvedErrorNames;
      resolvedRecords.push(validRecord);
    } else {
      stillInvalidRecords.push({ ...record, errors: unresolvedErrors });
    }
  });

  const validRecords = [...(verifyRecord.validRecords ?? []), ...resolvedRecords];

  return {
    ...verifyRecord,
    validRecords,
    invalidRecords: stillInvalidRecords,
    validRecordsCount: validRecords.length,
    invalidRecordsCount: stillInvalidRecords.length,
  };
};

export const formatVerifyErrors = (errors = []) =>
  errors
    .map(error => (typeof error === 'string' ? error : error?.message))
    .filter(Boolean)
    .join(', ');

const buildAddressBlock = (item, prefix) => ({
  address: {
    street1: item[`${prefix}Street1`] ?? '',
    street2: item[`${prefix}Street2`] ?? '',
  },
  attention: item[`${prefix}Attention`] ?? '',
  country: item[`${prefix}Country`] ?? '',
  city: item[`${prefix}City`] ?? '',
  state: item[`${prefix}State`] ?? '',
  pinCode: item[`${prefix}PinCode`] ?? '',
  phone: item[`${prefix}Phone`] ?? '',
  faxNumber: item[`${prefix}FaxNumber`] ?? '',
});

/** Builds bulk create payload matching backend bulk customer Joi schema. */
export const buildBulkCustomerImportPayload = (item, { isVendor = false }) => ({
  bpPrimaryContactName: {
    firstName: item.firstname,
    lastName: item.lastname,
  },
  businessPartnerType: item.businessPartnerType,
  Role: {
    isCustomer: !isVendor,
    isVendor,
  },
  companyName: item.companyName,
  customerDisplayName: item.customerDisplayName,
  bpEmail: item.bpEmail,
  customerPhoneNumber: item.customerPhoneNumber,
  paymentTerms: item.paymentTerms || null,
  address: {
    billing: buildAddressBlock(item, 'billing'),
    shipping: buildAddressBlock(item, 'shipping'),
  },
  otherDetails: {
    gstTreatment: item.gstTreatment,
    gstinUin: item.gstinUin,
    taxPreference: item.taxPreference,
    pan: item.pan,
    currency: item.currency || null,
  },
});

/** Flattens API verify/bulk customer shape for import preview table columns. */
export const flattenVerifyRecordForPreview = record => ({
  firstname: record.bpPrimaryContactName?.firstName,
  lastname: record.bpPrimaryContactName?.lastName,
  businessPartnerType: record.businessPartnerType,
  companyName: record.companyName,
  customerDisplayName: record.customerDisplayName,
  bpEmail: record.bpEmail,
  customerPhoneNumber: record.customerPhoneNumber,
  gstTreatment: record.otherDetails?.gstTreatment,
  gstinUin: record.otherDetails?.gstinUin,
  taxPreference: record.otherDetails?.taxPreference,
  pan: record.otherDetails?.pan,
  currency: record.otherDetails?.currency ?? record.Currency ?? record.currencyCode,
  paymentTerms: record.paymentTerms,
  billingAttention: record.address?.billing?.attention,
  billingCountry: record.address?.billing?.country,
  billingStreet1: record.address?.billing?.address?.street1,
  billingStreet2: record.address?.billing?.address?.street2,
  billingCity: record.address?.billing?.city,
  billingState: record.address?.billing?.state,
  billingPinCode: record.address?.billing?.pinCode,
  billingPhone: record.address?.billing?.phone,
  billingFaxNumber: record.address?.billing?.faxNumber,
  shippingAttention: record.address?.shipping?.attention,
  shippingCountry: record.address?.shipping?.country,
  shippingStreet1: record.address?.shipping?.address?.street1,
  shippingStreet2: record.address?.shipping?.address?.street2,
  shippingCity: record.address?.shipping?.city,
  shippingState: record.address?.shipping?.state,
  shippingPinCode: record.address?.shipping?.pinCode,
  shippingPhone: record.address?.shipping?.phone,
  shippingFaxNumber: record.address?.shipping?.faxNumber,
});

export const buildBusinessPartnerTeamBody = values => {
  const body = {
    firstName: values.firstName?.trim(),
    lastName: values.lastName?.trim(),
    mobileNo: String(values.mobileNo ?? '').trim(),
  };
  const email = values.email?.trim();
  const workPhone = String(values.workPhone ?? '').trim();
  const department = values.department?.trim();
  const authorityPower = values.authorityPower?.trim();
  if (email) body.email = email;
  if (workPhone) body.workPhone = workPhone;
  if (department) body.department = department;
  if (authorityPower) body.authorityPower = authorityPower;
  return body;
};

export const getBusinessPartnerTeamMemberDetails = person =>
  person
    ? {
        firstName: person?.firstName,
        lastName: person?.lastName,
        mobileNo: person?.mobileNo,
        email: person?.email,
        workPhone: person?.workPhone,
        department: person?.department,
        authorityPower: person?.authorityPower,
      }
    : null;

export const getCustomerDocumentDetails = (customer, isVendorPage) =>
  customer
    ? {
        ...(isVendorPage
          ? { vendorNumber: customer.customerNumber, vendorDisplayName: customer.customerDisplayName }
          : { customerNumber: customer.customerNumber, customerDisplayName: customer.customerDisplayName }),
        companyName: customer.companyName,
        status: customer.isActive ? 'Active' : 'Inactive',
      }
    : null;

export const isCustomerLinkedToVendor = customer => Boolean(customer?.isLinkedToVendor || customer?.vendorId);

export const isVendorLinkedToCustomer = vendor => Boolean(vendor?.isLinkedToVendor || vendor?.customerId);

const buildPartnerCopyPayload = (sourceData, sourceId, { asVendor }) => {
  if (!sourceData) return null;

  const restOtherDetails = { ...(sourceData.otherDetails || {}) };
  delete restOtherDetails.priceList;
  delete restOtherDetails.includePriceListItemOnly;
  delete restOtherDetails.enablePortal;
  delete restOtherDetails.isCustomerPortalActivated;

  const documentUrls = Array.isArray(sourceData.otherDetails?.document) ? sourceData.otherDetails.document.filter(doc => typeof doc === 'string') : [];

  return {
    formValues: {
      firstname: sourceData?.bpPrimaryContactName?.firstName || '',
      lastname: sourceData?.bpPrimaryContactName?.lastName || '',
      businessPartnerType: sourceData?.businessPartnerType || 'Business',
      companyName: sourceData?.companyName || '',
      customerDisplayName: sourceData?.customerDisplayName || '',
      bpEmail: sourceData?.bpEmail || '',
      customerPhoneNumber: sourceData?.customerPhoneNumber || '',
      companyLogo: typeof sourceData?.companyLogo === 'string' ? sourceData.companyLogo : null,
      isCustomer: !asVendor,
      isVendor: asVendor,
      linked: true,
      linkedId: sourceId || sourceData?.id || sourceData?._id || '',
      remarks: sourceData?.remarks || '',
    },
    otherDetails: {
      ...restOtherDetails,
      document: documentUrls,
      priceList: null,
      includePriceListItemOnly: false,
      enablePortal: false,
    },
    address: sourceData?.address || null,
    businessPartnerTeam: sourceData?.businessPartnerTeam || [],
    branchSettings: {
      useBranchCreditLimit: false,
      creditLimit: 0,
      restrictedModule: [],
      useBranchPaymentTerms: false,
      paymentTerms: null,
      restrictedPaymentTermsModule: [],
    },
    mapBranchRow: (b, index) => ({
      key: index,
      branchId: b?.branchId?.id || b?.branchId?._id || b?.branchId || b?.id || '',
      branchName: b?.branchId?.name || b?.name || b?.branchName || '',
      divisionId: b?.divisionId?._id || b?.divisionId?.id || b?.divisionId || '',
      divisionName: b?.divisionName || b?.divisionId?.name || '',
      branchCode: b?.branchCode || b?.code || '',
      openingBalance: '',
      initialOpeningBalance: 0,
      currentBalance: 0,
      creditLimit: 0,
      isSplitBalance: false,
      isActive: b?.isActive || false,
      restrictedModule: [],
      paymentTerms: null,
      restrictedPaymentTermsModule: [],
    }),
  };
};

export const buildVendorCopyFromCustomer = (customerData, sourceCustomerId) => buildPartnerCopyPayload(customerData, sourceCustomerId, { asVendor: true });

export const buildCustomerCopyFromVendor = (vendorData, sourceVendorId) => buildPartnerCopyPayload(vendorData, sourceVendorId, { asVendor: false });
