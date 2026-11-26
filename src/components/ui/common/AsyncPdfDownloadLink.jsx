import { useEffect, useState } from 'react';
import { PDFDownloadLink } from './PdfDownloadLinkLazy';

/**
 * Renders PDFDownloadLink after dynamically loading the PDF document module.
 * @param {() => Promise<{ document: React.ReactElement, fileName?: string }>} loadDocument
 */
export function AsyncPdfDownloadLink({ loadDocument, fileName, children, ...linkProps }) {
  const [document, setDocument] = useState(null);
  const [resolvedFileName, setResolvedFileName] = useState(fileName);

  useEffect(() => {
    let active = true;

    loadDocument().then(({ document: doc, fileName: name }) => {
      if (!active) return;
      setDocument(doc);
      if (name) setResolvedFileName(name);
    });

    return () => {
      active = false;
    };
  }, [loadDocument]);

  if (!document) {
    return typeof children === 'function' ? children({ loading: true }) : null;
  }

  return (
    <PDFDownloadLink document={document} fileName={resolvedFileName} {...linkProps}>
      {children}
    </PDFDownloadLink>
  );
}
