import { createElement, lazy, Suspense } from 'react';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';

const PaymentPdfComponent = lazy(() => import('@smit9313/abss-pdf').then(m => ({ default: m.PaymentPdf })));

export function PaymentPdf(props) {
  return (
    <Suspense fallback={<CustomLoader />}>
      <PaymentPdfComponent {...props} />
    </Suspense>
  );
}

export async function resolvePaymentPdfDocument(document) {
  if (document?.type === PaymentPdf) {
    const { PaymentPdf: PaymentPdfDocument } = await import('@smit9313/abss-pdf');
    return createElement(PaymentPdfDocument, document.props);
  }
  return document;
}
