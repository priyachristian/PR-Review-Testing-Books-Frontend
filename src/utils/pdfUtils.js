import dayjs from 'dayjs';
import { DEFAULT_CURRENCY, pageTypes } from '@/utils/constants';
import { formatAmount } from '@/utils/currency';

export const resolveProfile = profile => {
  if (!profile || typeof profile !== 'object') return profile;
  if (profile?.data && typeof profile.data === 'object' && profile?.name == null) {
    return profile.data;
  }
  return profile;
};

export const resolveDocumentCurrency = (data, profile) => ({
  ...DEFAULT_CURRENCY,
  ...resolveProfile(profile)?.baseCurrency,
  ...(data?.customerId?.currency || data?.vendorId?.currency),
  ...data?.currency,
});

export const formatPdfAmount = (amount, currencyConfig, showSymbol = true) => formatAmount(amount, showSymbol, { ...DEFAULT_CURRENCY, ...currencyConfig });

export const blobToBase64 = blob =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

export const buildEWayBillQrText = doc => {
  const eWayBill = doc?.eWayBill;
  if (!eWayBill?.eWayBillNo) return null;
  const dateStr = eWayBill?.eWayBillDate ? dayjs(eWayBill.eWayBillDate).format('DD/MM/YYYY HH:mm:ss') : '-';
  return `EWB No: ${eWayBill.eWayBillNo} | Date: ${dateStr} | TransporterId: ${eWayBill.transporterId || '-'}`;
};

const sameId = (left, right) => Boolean(left && right) && String(left) === String(right);

/** One-line address for e-way bill blocks; reads both company addresses and party addresses (street under `address`). */
export const formatEWayBillAddress = address => {
  const street1 = address?.address?.street1 || address?.street1;
  const street2 = address?.address?.street2 || address?.street2;
  const line = [street1, street2, address?.city, address?.state].filter(Boolean).join(', ');
  return `${line}${address?.pinCode ? ` - ${address.pinCode}` : ''}` || '-';
};

/**
 * Parties and places of a document's e-way bill, in the direction the goods move. Mirrors the backend:
 * - the party place is the address chosen on the document (`addressId`); a debit note's points to the company's own
 *   address, so its vendor receives at the billing address, which also decided its tax;
 * - a credit note is a sales return, so the customer dispatches and the company receives.
 * Returns { from, to } (name, gstin, state) and { dispatchFrom, shipTo } (addresses).
 */
export const getEWayBillMovement = ({ data, profile, pageType }) => {
  const isDebitNote = pageType === pageTypes.DEBIT_NOTE;
  const partyDetails = isDebitNote ? data?.vendorId : data?.customerId;
  const { billing, shipping, additionalShippingAddresses = [] } = partyDetails?.address || {};
  const documentAddress = isDebitNote ? billing : [billing, shipping, ...additionalShippingAddresses].find(address => sameId(address?._id, data?.addressId));
  const partyPlace = documentAddress || (data?.shippingAddress?.city ? data.shippingAddress : shipping);

  const company = { name: profile?.name, gstin: data?.companyGstin || profile?.gstNumber, state: profile?.address?.state };
  const party = { name: partyDetails?.companyName || partyDetails?.customerDisplayName, gstin: partyDetails?.otherDetails?.gstinUin, state: billing?.state };

  if (pageType === pageTypes.CREDIT_NOTE) {
    return { from: party, to: company, dispatchFrom: partyPlace, shipTo: profile?.address };
  }
  return { from: company, to: party, dispatchFrom: profile?.address, shipTo: partyPlace };
};
