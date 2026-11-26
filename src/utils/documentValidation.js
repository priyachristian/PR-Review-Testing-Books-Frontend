export const DOCUMENT_TOTAL_MIN_MESSAGE = 'Please ensure that the total amount is greater than or equal to zero.';

export const getDocumentTotalAmount = values => {
  const rawTotal = values?.isSplit ? values?.subTotal : values?.total;
  const total = parseFloat(rawTotal ?? 0);
  return Number.isFinite(total) ? total : 0;
};

export const validateDocumentTotalBeforeSave = values => {
  return getDocumentTotalAmount(values) >= 0;
};
