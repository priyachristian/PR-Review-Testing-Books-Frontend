import { GST_RATE_OPTIONS } from '@/utils/dropdownEnums';

const GST_IMPORT_VALUES = GST_RATE_OPTIONS.map(option => option.value);

/** Normalize GST values from spreadsheet labels (e.g. "5% GST") to stored values (e.g. "5"). */
export const parseGstImportValue = value => {
  if (value == null || value === '') return value;

  const str = String(value).trim().toLowerCase();

  for (const option of GST_RATE_OPTIONS) {
    const label = option.label.toLowerCase();
    if (str === option.value || str === label) {
      return option.value;
    }
    if (str.includes(`${option.value}%`) || str.startsWith(`${option.value} `)) {
      return option.value;
    }
  }

  if (str.includes('none')) return 'none';
  if (str.includes('exempt')) return 'exempted';

  const percentMatch = str.match(/(\d+(?:\.\d+)?)\s*%/);
  if (percentMatch && GST_IMPORT_VALUES.includes(percentMatch[1])) {
    return percentMatch[1];
  }

  return String(value).trim();
};

/** Returns numeric rate for calculations (0 for none/exempted to avoid NaN). */
export const getGstNumericRate = gst => {
  if (gst == null || gst === '') return 0;
  const s = String(gst).trim().toLowerCase();
  if (s === 'none' || s === 'exempted') return 0;
  const num = parseFloat(gst);
  return Number.isFinite(num) ? num : 0;
};

/** Format for Tax Rate column: None/Exempted without %, numeric with %. */
export const formatGstForDisplay = gst => {
  if (gst == null || gst === '') return '0%';
  const s = String(gst).trim().toLowerCase();
  if (s === 'none') return 'None';
  if (s === 'exempted') return 'Exempted';
  const num = parseFloat(gst);
  return Number.isFinite(num) ? `${num}%` : String(gst);
};

/** Format for "Rate: X%" in tax breakdown; use 0 for none/exempted to avoid NaN. */
export const formatGstRateForTaxTable = gst => {
  const rate = getGstNumericRate(gst);
  return rate === 0 && gst != null && String(gst).trim().toLowerCase() !== '0' ? formatGstForDisplay(gst) : `${rate}%`;
};

/** Half rate for CGST/SGST display. None/Exempted → no %; numeric → (rate/2)%. */
export const formatGstHalfRateForTaxTable = gst => {
  const rate = getGstNumericRate(gst);
  if (rate === 0 && gst != null) {
    const s = String(gst).trim().toLowerCase();
    if (s === 'none') return 'None';
    if (s === 'exempted') return 'Exempted';
  }
  return `${rate / 2}%`;
};
