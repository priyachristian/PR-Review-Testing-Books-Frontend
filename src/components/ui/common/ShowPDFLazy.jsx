import { createElement, lazy, Suspense } from 'react';
import CustomLoader from '@/components/feedback/pageLoader/CustomLoader';

const resolvePackageExport = (mod, exportName) => mod?.[exportName] || mod?.default?.[exportName];

const ShowPDFComponent = lazy(() =>
  import('@smit9313/abss-pdf').then(m => {
    const Comp = resolvePackageExport(m, 'ShowPDF');
    if (!Comp) throw new Error('ShowPDF export is missing from @smit9313/abss-pdf');
    return { default: Comp };
  })
);

const MultiShowPDFComponent = lazy(() =>
  import('@smit9313/abss-pdf').then(m => {
    const Comp = resolvePackageExport(m, 'MultiShowPDF');
    if (!Comp) throw new Error('MultiShowPDF export is missing from @smit9313/abss-pdf');
    return { default: Comp };
  })
);

export function ShowPDF(props) {
  return (
    <Suspense fallback={<CustomLoader />}>
      <ShowPDFComponent {...props} />
    </Suspense>
  );
}

export function MultiShowPDF(props) {
  return (
    <Suspense fallback={<CustomLoader />}>
      <MultiShowPDFComponent {...props} />
    </Suspense>
  );
}

/**
 * PDFDownloadLink / pdf() need a real @react-pdf Document tree — not the Suspense wrapper above.
 */
export async function resolvePdfDocument(document) {
  if (!document?.type) return document;

  const pkg = await import('@smit9313/abss-pdf');
  const ShowPDFDocument = resolvePackageExport(pkg, 'ShowPDF');
  const MultiShowPDFDocument = resolvePackageExport(pkg, 'MultiShowPDF');

  if (document.type === ShowPDF || document.type === ShowPDFDocument) {
    if (!ShowPDFDocument) throw new Error('ShowPDF export is missing from @smit9313/abss-pdf');
    return createElement(ShowPDFDocument, document.props);
  }

  if (document.type === MultiShowPDF || document.type === MultiShowPDFDocument) {
    if (!MultiShowPDFDocument) throw new Error('MultiShowPDF export is missing from @smit9313/abss-pdf');
    return createElement(MultiShowPDFDocument, document.props);
  }

  return document;
}
