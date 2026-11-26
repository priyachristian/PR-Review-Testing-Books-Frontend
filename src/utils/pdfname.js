export const generateSafeFileName = (data, idField = 'quoteId') => {
  const id = data?.[idField] || 'NO-ID';
  const customerName = data?.customerId?.customerDisplayName || 'Customer';

  const cleanName = customerName
    .replace(/[^a-zA-Z0-9\s]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 50)
    .replace(/^_|_$/g, '');

  return `${id}_${cleanName}.pdf`;
};

export const buildVariantFileName = (idValue, { showEInvoice, showEWayBill } = {}) => {
  let suffix = '';
  if (showEWayBill && showEInvoice) suffix = '_complete';
  else if (showEWayBill) suffix = '_with_ewaybill';
  else if (showEInvoice) suffix = '_with_einvoice';
  return `${idValue || 'NO-ID'}${suffix}.pdf`;
};
