import { createElement, lazy, Suspense } from 'react';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';

const ExpensePDFComponent = lazy(() => import('@smit9313/abss-pdf').then(m => ({ default: m.ExpensePDF })));

export function ExpensePDF(props) {
  return (
    <Suspense fallback={<CustomLoader />}>
      <ExpensePDFComponent {...props} />
    </Suspense>
  );
}

export async function resolveExpensePdfDocument(document) {
  if (document?.type === ExpensePDF) {
    const { ExpensePDF: ExpensePDFDocument } = await import('@smit9313/abss-pdf');
    return createElement(ExpensePDFDocument, document.props);
  }
  return document;
}
