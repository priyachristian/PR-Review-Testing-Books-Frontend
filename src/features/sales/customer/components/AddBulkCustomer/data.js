export const BULK_CUSTOMER_ACCEPTED_EXTENSIONS = ['.csv', '.xlsx', '.xls'];
export const BULK_CUSTOMER_ACCEPT_LABEL = 'CSV, XLSX, and XLS';
export const BULK_CUSTOMER_MAX_FILE_SIZE = 2 * 1024 * 1024;

export const customerMappingFields = [
  { id: 'firstname', label: 'First Name', required: true },
  { id: 'lastname', label: 'Last Name' },
  { id: 'businessPartnerType', label: 'Business Partner Type', required: true },
  { id: 'companyName', label: 'Company Name', required: true },
  { id: 'customerDisplayName', label: 'Customer Display Name', required: true },
  { id: 'bpEmail', label: 'Email' },
  { id: 'customerPhoneNumber', label: 'Customer Phone Number' },
  { id: 'gstTreatment', label: 'GST Treatment', required: true },
  { id: 'gstinUin', label: 'GSTIN NO' },
  { id: 'taxPreference', label: 'Tax Preference' },
  { id: 'pan', label: 'PAN' },
  { id: 'currency', label: 'Currency' },
  { id: 'paymentTerms', label: 'Payment Terms' },
  { id: 'billingAttention', label: 'Billing Attention' },
  { id: 'billingCountry', label: 'Billing Country' },
  { id: 'billingStreet1', label: 'Billing Street1' },
  { id: 'billingStreet2', label: 'Billing Street2' },
  { id: 'billingCity', label: 'Billing City' },
  { id: 'billingState', label: 'Billing State' },
  { id: 'billingPinCode', label: 'Billing Pin Code' },
  { id: 'billingPhone', label: 'Billing Phone' },
  { id: 'billingFaxNumber', label: 'Billing Fax Number' },
  { id: 'shippingAttention', label: 'Shipping Attention' },
  { id: 'shippingCountry', label: 'Shipping Country' },
  { id: 'shippingStreet1', label: 'Shipping Street1' },
  { id: 'shippingStreet2', label: 'Shipping Street2' },
  { id: 'shippingCity', label: 'Shipping City' },
  { id: 'shippingState', label: 'Shipping State' },
  { id: 'shippingPinCode', label: 'Shipping Pin Code' },
  { id: 'shippingPhone', label: 'Shipping Phone' },
  { id: 'shippingFaxNumber', label: 'Shipping Fax Number' },
];

const VENDOR_FIELD_OVERRIDES = {
  customerDisplayName: { label: 'Vendor Display Name', aliases: ['Vendor Display Name'] },
  customerPhoneNumber: { label: 'Vendor Phone Number', aliases: ['Vendor Phone Number'] },
};

export const getPartnerMappingFields = (isVendor = false) => {
  if (!isVendor) return customerMappingFields;

  return customerMappingFields.map(field => ({
    ...field,
    ...(VENDOR_FIELD_OVERRIDES[field.id] || {}),
  }));
};

const SAMPLE_ADDRESS_AND_PAYMENT = {
  'Payment Terms': 'Net 30',
  'Billing Attention': 'Test',
  'Billing Country': 'India',
  'Billing Street1': 'Nikol',
  'Billing Street2': 'Odhav',
  'Billing City': 'Ahmedabad',
  'Billing State': 'Gujarat',
  'Billing Pin Code': '382350',
  'Billing Phone': '123456789876',
  'Billing Fax Number': '45435435',
  'Shipping Attention': 'Test',
  'Shipping Country': 'India',
  'Shipping Street1': 'Nikol',
  'Shipping Street2': 'Odhav',
  'Shipping City': 'Ahmedabad',
  'Shipping State': 'Gujarat',
  'Shipping Pin Code': '382350',
  'Shipping Phone': '123456789876',
  'Shipping Fax Number': '45435435',
};

export const bulkCustomerSampleData = [
  {
    'First Name': 'Rajesh',
    'Last Name': 'Sharma',
    'Business Partner Type': 'Business',
    'Company Name': 'Sharma Industrial Supplies Pvt Ltd',
    'Customer Display Name': 'Sharma Industrial Supplies',
    Email: 'rajesh@sharmaindustrial.com',
    'Customer Phone Number': '9876543210',
    'GST Treatment': 'Registered Business Regular',
    'GSTIN NO': '27AABCS1429B1ZV',
    'Tax Preference': 'Taxable',
    PAN: 'AABCS1429B',
    Currency: 'INR',
    ...SAMPLE_ADDRESS_AND_PAYMENT,
  },
  {
    'First Name': 'Priya',
    'Last Name': 'Mehta',
    'Business Partner Type': 'Individual',
    'Company Name': 'Mehta Consulting Services',
    'Customer Display Name': 'Priya Mehta',
    Email: 'priya.mehta@gmail.com',
    'Customer Phone Number': '9123456780',
    'GST Treatment': 'Unregistered Business Regular',
    'GSTIN NO': '',
    'Tax Preference': 'Tax Exempt',
    PAN: 'BCPPM1234A',
    Currency: 'INR',
    ...SAMPLE_ADDRESS_AND_PAYMENT,
  },
  {
    'First Name': 'Amit',
    'Last Name': 'Patel',
    'Business Partner Type': 'Business',
    'Company Name': 'Patel Engineering Works',
    'Customer Display Name': 'Patel Engineering Works',
    Email: 'amit@patelengg.in',
    'Customer Phone Number': '9988776655',
    'GST Treatment': 'Registered Business Regular',
    'GSTIN NO': '24AAACP1234F1Z5',
    'Tax Preference': 'Taxable',
    PAN: 'AAACP1234F',
    Currency: 'INR',
    ...SAMPLE_ADDRESS_AND_PAYMENT,
  },
];

export const bulkVendorSampleData = [
  {
    'First Name': 'Suresh',
    'Last Name': 'Kumar',
    'Business Partner Type': 'Business',
    'Company Name': 'Kumar Raw Materials Pvt Ltd',
    'Vendor Display Name': 'Kumar Raw Materials',
    Email: 'suresh@kumarrm.com',
    'Vendor Phone Number': '9876501234',
    'GST Treatment': 'Registered Business Regular',
    'GSTIN NO': '29AABCK1234M1Z8',
    'Tax Preference': 'Taxable',
    PAN: 'AABCK1234M',
    Currency: 'INR',
    ...SAMPLE_ADDRESS_AND_PAYMENT,
  },
  {
    'First Name': 'Neha',
    'Last Name': 'Desai',
    'Business Partner Type': 'Business',
    'Company Name': 'Desai Logistics Services',
    'Vendor Display Name': 'Desai Logistics Services',
    Email: 'neha@desailogistics.in',
    'Vendor Phone Number': '9123405678',
    'GST Treatment': 'Registered Business Regular',
    'GSTIN NO': '24AABCD5678E1Z3',
    'Tax Preference': 'Taxable',
    PAN: 'AABCD5678E',
    Currency: 'INR',
    ...SAMPLE_ADDRESS_AND_PAYMENT,
  },
  {
    'First Name': 'Vikram',
    'Last Name': 'Singh',
    'Business Partner Type': 'Individual',
    'Company Name': 'Singh Tooling Works',
    'Vendor Display Name': 'Singh Tooling Works',
    Email: 'vikram.singh@gmail.com',
    'Vendor Phone Number': '9988007766',
    'GST Treatment': 'Unregistered Business Regular',
    'GSTIN NO': '',
    'Tax Preference': 'Tax Exempt',
    PAN: 'BCPPS4321K',
    Currency: 'INR',
    ...SAMPLE_ADDRESS_AND_PAYMENT,
  },
];

const CUSTOMER_SAMPLE_FILE_CONFIG = {
  csv: { fileName: 'Customers_Sample.csv', bookType: 'csv', sheetName: 'Customers' },
  xlsx: { fileName: 'Customers_Sample.xlsx', bookType: 'xlsx', sheetName: 'Customers' },
  xls: { fileName: 'Customers_Sample.xls', bookType: 'xls', sheetName: 'Customers' },
};

const VENDOR_SAMPLE_FILE_CONFIG = {
  csv: { fileName: 'Vendors_Sample.csv', bookType: 'csv', sheetName: 'Vendors' },
  xlsx: { fileName: 'Vendors_Sample.xlsx', bookType: 'xlsx', sheetName: 'Vendors' },
  xls: { fileName: 'Vendors_Sample.xls', bookType: 'xls', sheetName: 'Vendors' },
};

export const downloadBulkPartnerSampleFile = async (format, isVendor = false) => {
  const XLSX = await import('xlsx');
  const configMap = isVendor ? VENDOR_SAMPLE_FILE_CONFIG : CUSTOMER_SAMPLE_FILE_CONFIG;
  const config = configMap[format] || configMap.csv;
  const sampleData = isVendor ? bulkVendorSampleData : bulkCustomerSampleData;
  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, config.sheetName);
  XLSX.writeFile(workbook, config.fileName, { bookType: config.bookType });
};

/** @deprecated use downloadBulkPartnerSampleFile */
export const downloadBulkCustomerSampleFile = format => downloadBulkPartnerSampleFile(format, false);
