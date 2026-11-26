import { createElement, useEffect, useMemo, useState } from 'react';
import { ShowPDF } from './ShowPDFLazy';
import { PaymentPdf } from './PaymentPdfLazy';
import { ExpensePDF } from './ExpensePdfLazy';

/**
 * Drop-in replacement for @react-pdf/renderer PDFDownloadLink — loads the library on mount.
 */
export function PDFDownloadLink(props) {
  const { document, ...rest } = props;
  const [modules, setModules] = useState(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([import('@react-pdf/renderer'), import('@smit9313/abss-pdf')]).then(([reactPdf, viewer]) => {
      if (!cancelled) {
        setModules({ Link: reactPdf.PDFDownloadLink, ShowPDF: viewer.ShowPDF, PaymentPdf: viewer.PaymentPdf, ExpensePDF: viewer.ExpensePDF });
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const resolvedDocument = useMemo(() => {
    if (!modules || !document) return null;
    if (document.type === ShowPDF) {
      return createElement(modules.ShowPDF, document.props);
    }
    if (document.type === PaymentPdf) {
      return createElement(modules.PaymentPdf, document.props);
    }
    if (document.type === ExpensePDF) {
      return createElement(modules.ExpensePDF, document.props);
    }
    return document;
  }, [modules, document]);

  if (!modules || !resolvedDocument) {
    return typeof rest.children === 'function' ? rest.children({ loading: true }) : null;
  }

  return <modules.Link {...rest} document={resolvedDocument} />;
}
