import { useAuth } from 'hooks/useAuth';
import { ADDITIONAL_FEATURES } from '@/utils/constants';

/** Which GST documents the company's plan allows: e-invoice (with e-way bill), or e-way bill only. */
export const useGstFeatures = () => {
  const { signin } = useAuth();
  const applicableFeature = signin?.company?.applicableFeature;
  const isEInvoicingAvailable = applicableFeature === ADDITIONAL_FEATURES?.E_INVOICE_AND_E_WAY_BILL;
  const isOnlyEWayBillAvailable = applicableFeature === ADDITIONAL_FEATURES?.ONLY_E_WAY_BILL;
  return { isEInvoicingAvailable, isOnlyEWayBillAvailable, isEWayBillAvailable: isEInvoicingAvailable || isOnlyEWayBillAvailable };
};

/** Excel and document PDF, plus e-invoice / e-way bill choices the company plan allows. */
export const gstPdfExportFormats = ({ allowEInvoice = false, isEInvoicingAvailable = false, isEWayBillAvailable = false } = {}) => [
  'xlsx',
  'pdf',
  ...(allowEInvoice && isEInvoicingAvailable ? ['eInvoice'] : []),
  ...(isEWayBillAvailable ? ['eWayBill'] : []),
  ...(allowEInvoice && isEInvoicingAvailable ? ['eInvoiceAndEWayBill'] : []),
];
