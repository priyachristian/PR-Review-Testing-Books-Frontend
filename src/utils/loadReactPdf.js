import { resolvePdfDocument } from '@/components/ui/common/ShowPDFLazy';
import { resolvePaymentPdfDocument } from '@/components/ui/common/PaymentPdfLazy';
import { resolveExpensePdfDocument } from '@/components/ui/common/ExpensePdfLazy';
import { getBaseCurrency } from '@/utils/currency';

/**
 * Lazy-load @react-pdf/renderer so it is not pulled into the initial bundle.
 */
export async function loadReactPdf() {
  return import('@react-pdf/renderer');
}

/**
 * The @smit9313/abss-pdf package keeps its own per-component base-currency store (default INR).
 * Sync every setter to the app's current base currency before rendering, so generated PDFs use
 * the company's currency instead of the INR default. Runs inside the lazy path to keep the
 * heavy package out of the initial bundle.
 */
export async function syncPdfPackageBaseCurrency() {
  const pkg = await import('@smit9313/abss-pdf');
  const currency = getBaseCurrency();
  pkg.setBaseCurrency?.(currency);
  pkg.setPaymentPdfBaseCurrency?.(currency);
  pkg.setGeneralLedgerReportBaseCurrency?.(currency);
  pkg.setExpensePdfBaseCurrency?.(currency);
  pkg.setManualJournalPdfBaseCurrency?.(currency);
  pkg.setCrmBaseCurrency?.(currency);
}

export async function renderPdfToBlob(document) {
  const { pdf } = await loadReactPdf();
  await syncPdfPackageBaseCurrency();
  const resolvedDocument = await resolveExpensePdfDocument(await resolvePaymentPdfDocument(await resolvePdfDocument(document)));
  return pdf(resolvedDocument).toBlob();
}
