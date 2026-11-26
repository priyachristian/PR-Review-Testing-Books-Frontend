// React Imports
import { useCallback, useEffect, useRef, useState } from 'react';

// Third Party Imports
import { useParams, useSearchParams } from 'react-router-dom';

// Component Imports
import { buildGeneralLedgerExcelBase64, generalLedgerReportExcelFileName } from '@/features/reports/pages/generalLedger/pdf/GeneralLedgerReportExcel';

// Util Imports
import { generateSafeFileName, buildVariantFileName } from '@/utils/pdfname';
import { pageTypes } from '@/utils/constants';
import { blobToBase64, buildEWayBillQrText } from '@/utils/pdfUtils';

const QRCode = { toDataURL: async (...args) => (await import('qrcode')).default.toDataURL(...args) };

const QR_CODE_OPTIONS = { width: 200, margin: 1, errorCorrectionLevel: 'L' };

const EVENTS = {
  PAGE_READY: 'PDF_PAGE_READY',
  DOCUMENT_DATA: 'DOCUMENT_DATA',
  DOWNLOAD_SUCCESS: 'PDF_DOWNLOAD_SUCCESS',
  DOWNLOAD_FAILED: 'PDF_DOWNLOAD_FAILED',
};

const ID_FIELD_BY_PAGE_TYPE = {
  [pageTypes.QUOTE]: 'quoteId',
  [pageTypes.SALES_ORDER]: 'orderId',
  [pageTypes.DELIVERY_CHALLAN]: 'challanId',
  [pageTypes.INVOICE]: 'invoiceId',
  [pageTypes.CREDIT_NOTE]: 'creditNoteId',
  [pageTypes.CUSTOMER_ORDER]: 'customerOrderId',
  [pageTypes.PURCHASE_ORDER]: 'purchaseOrderId',
  [pageTypes.GRPO]: 'grpoOrderId',
  [pageTypes.BILLS]: 'billId',
  [pageTypes.DEBIT_NOTE]: 'debitNoteId',
  [pageTypes.EXPENSES]: 'expenseId',
};

const isServerPreviewRequest = () => {
  try {
    return new URLSearchParams(window.location.search).get('source') === 'server';
  } catch {
    return false;
  }
};

const DocumentPdfPreview = () => {
  const { documentId } = useParams();
  const [searchParams] = useSearchParams();
  const isServerSource = searchParams.get('source') === 'server' || isServerPreviewRequest();
  const [pdfData, setPdfData] = useState(null);
  const [status, setStatus] = useState('waiting');
  const [errorMessage, setErrorMessage] = useState('');
  const hasGeneratedRef = useRef(false);

  const applyDocumentData = useCallback(data => {
    if (!data || data.event !== EVENTS.DOCUMENT_DATA) return;
    setPdfData({ document: data.document, profile: data.profile, pageType: data.pageType, format: data.format, fileName: data.fileName });
  }, []);

  const postToReactNative = useCallback(
    (event, payload = {}) => {
      window.ReactNativeWebView?.postMessage(JSON.stringify({ event, documentId, ...payload }));
    },
    [documentId]
  );

  useEffect(() => {
    if (!window.ReactNativeWebView && !isServerSource) {
      setStatus('error');
      setErrorMessage('This page must be opened inside the mobile app.');
      return undefined;
    }

    const handleMessage = e => {
      try {
        const data = JSON.parse(e.data);
        if (data.event === EVENTS.DOCUMENT_DATA) {
          setPdfData({
            document: data.document,
            profile: data.profile,
            pageType: data.pageType,
            format: data.format,
            fileName: data.fileName,
            showEInvoice: data.showEInvoice,
            showEWayBill: data.showEWayBill,
            showInvoice: data.showInvoice,
            isEinvoicingAvailable: data.isEinvoicingAvailable,
            isEwayBillingAvailable: data.isEwayBillingAvailable,
            qrCodeUrl: data.qrCodeUrl,
          });
        }
      } catch {
        // Ignore unrelated window messages.
      }
    };

    window.addEventListener('message', handleMessage);
    document.addEventListener('message', handleMessage);

    if (isServerSource) {
      window.__ABSS_PDF_PREVIEW_APP__ = true;
      window.__ABSS_PDF_RESULT__ = null;
      window.__ABSS_PDF_ERROR__ = null;
      // Direct inject is more reliable than postMessage under Puppeteer.
      window.__ABSS_INJECT_DOCUMENT_DATA__ = payload => {
        applyDocumentData(typeof payload === 'string' ? JSON.parse(payload) : payload);
      };
      window.__ABSS_PDF_READY__ = true;
    } else {
      postToReactNative(EVENTS.PAGE_READY);
    }

    return () => {
      window.removeEventListener('message', handleMessage);
      document.removeEventListener('message', handleMessage);
      if (isServerSource) {
        window.__ABSS_PDF_READY__ = false;
        delete window.__ABSS_INJECT_DOCUMENT_DATA__;
      }
    };
  }, [applyDocumentData, isServerSource, postToReactNative]);

  useEffect(() => {
    if (hasGeneratedRef.current || !pdfData) return;

    const {
      document: doc,
      profile,
      pageType,
      format,
      fileName: requestedFileName,
      showEInvoice: showEInvoiceFlag,
      showEWayBill: showEWayBillFlag,
      showInvoice: showInvoiceFlag,
      isEinvoicingAvailable: isEinvoicingAvailableFlag,
      isEwayBillingAvailable: isEwayBillingAvailableFlag,
      qrCodeUrl: qrCodeUrlFromHost,
    } = pdfData;
    if (!doc) {
      setStatus('error');
      setErrorMessage('Document data was not received.');
      if (isServerSource) {
        window.__ABSS_PDF_ERROR__ = 'Document data was not received';
      }
      postToReactNative(EVENTS.DOWNLOAD_FAILED, { reason: 'Document data was not received' });
      return;
    }

    hasGeneratedRef.current = true;
    setStatus('generating');

    (async () => {
      try {
        const isProduction = pageType === pageTypes.PRODUCTION;
        const isExpense = pageType === pageTypes.EXPENSES;
        const isPayment = pageType === pageTypes.PAYMENT;
        const isGeneralLedger = pageType === pageTypes.GENERAL_LEDGER;
        const isExcelExport = format === 'xlsx' && isGeneralLedger;
        const isManualJournal = pageType === pageTypes.MANUAL_JOURNAL;
        const [{ pdf }, pdfPkg, { generalLedgerReportPdfFileName }] = await Promise.all([
          import('@react-pdf/renderer'),
          import('@smit9313/abss-pdf'),
          import('@/features/reports/pages/generalLedger/pdf/GeneralLedgerReportPdf'),
        ]);
        const { ShowPDF, ProductionOrderDetailPdf, productionOrderPdfFileName, ExpensePDF, PaymentPdf, paymentPdfFileName, GeneralLedgerReportPdf, ManualJournalDetailPdf, manualJournalPdfFileName } =
          pdfPkg;

        // The abss-pdf package keeps its own per-component base-currency store (default INR).
        // Sync it from the injected profile's base currency so PDFs use the company's currency.
        // (PaymentPdf self-resolves currency from the profile prop, so it works regardless.)
        const pdfBaseCurrency = profile?.baseCurrency;
        if (pdfBaseCurrency) {
          pdfPkg.setBaseCurrency?.(pdfBaseCurrency);
          pdfPkg.setPaymentPdfBaseCurrency?.(pdfBaseCurrency);
          pdfPkg.setGeneralLedgerReportBaseCurrency?.(pdfBaseCurrency);
          pdfPkg.setExpensePdfBaseCurrency?.(pdfBaseCurrency);
          pdfPkg.setManualJournalPdfBaseCurrency?.(pdfBaseCurrency);
          pdfPkg.setCrmBaseCurrency?.(pdfBaseCurrency);
        }
        let blob;
        let fileName;
        let base64;

        if (isExcelExport) {
          base64 = await buildGeneralLedgerExcelBase64(doc || {});
          fileName = requestedFileName || generalLedgerReportExcelFileName(doc);
        } else if (isProduction) {
          blob = await pdf(<ProductionOrderDetailPdf data={doc} profile={profile} />).toBlob();
          fileName = productionOrderPdfFileName(doc);
        } else if (isPayment) {
          blob = await pdf(<PaymentPdf data={doc} profile={profile} variant={doc?.variant || 'received'} />).toBlob();
          fileName = paymentPdfFileName(doc, doc?.variant || 'received');
        } else if (isGeneralLedger) {
          blob = await pdf(
            <GeneralLedgerReportPdf records={doc?.records} profile={profile} selectedCustomer={doc?.selectedCustomer} reports={doc?.reports} startDate={doc?.startDate} endDate={doc?.endDate} />
          ).toBlob();
          fileName = requestedFileName || generalLedgerReportPdfFileName(doc);
        } else if (isManualJournal) {
          blob = await pdf(<ManualJournalDetailPdf journal={doc} profile={profile} />).toBlob();
          fileName = manualJournalPdfFileName(doc);
        } else if (isExpense) {
          blob = await pdf(<ExpensePDF data={doc} profile={profile} />).toBlob();
          fileName = generateSafeFileName(doc, ID_FIELD_BY_PAGE_TYPE[pageType] || 'quoteId');
        } else {
          const hasEInvoiceData = Boolean(doc?.eInvoice?.irn || doc?.eInvoice?.signedQrCode);

          const isEinvoicingAvailable = isEinvoicingAvailableFlag ?? hasEInvoiceData;
          const isEwayBillingAvailable = isEwayBillingAvailableFlag ?? false;
          const showEInvoice = showEInvoiceFlag ?? hasEInvoiceData;
          const showEWayBill = showEWayBillFlag ?? false;
          const showInvoice = showInvoiceFlag ?? true;

          let qrCodeUrl = qrCodeUrlFromHost || null;
          if (showEInvoice && !qrCodeUrl && doc?.eInvoice?.signedQrCode) {
            try {
              qrCodeUrl = await QRCode.toDataURL(doc.eInvoice.signedQrCode, QR_CODE_OPTIONS);
            } catch (qrErr) {
              console.error('Failed to generate e-invoice QR code:', qrErr);
            }
          }

          let eWayBillQrCodeUrl = null;
          if (showEWayBill) {
            const qrText = buildEWayBillQrText(doc);
            if (qrText) {
              try {
                eWayBillQrCodeUrl = await QRCode.toDataURL(qrText, QR_CODE_OPTIONS);
              } catch (qrErr) {
                console.error('Failed to generate e-way-bill QR code:', qrErr);
              }
            }
          }

          blob = await pdf(
            <ShowPDF
              data={doc}
              billingAddress={doc?.customerId?.address?.billing}
              shippingAddress={doc?.shippingAddress}
              profile={profile}
              pageType={pageType || pageTypes.QUOTE}
              isEinvoicingAvailable={isEinvoicingAvailable}
              isEwayBillingAvailable={isEwayBillingAvailable}
              showEInvoice={showEInvoice}
              showEWayBill={showEWayBill}
              showInvoice={showInvoice}
              qrCodeUrl={qrCodeUrl}
              eWayBillQrCodeUrl={eWayBillQrCodeUrl}
            />
          ).toBlob();

          const idField = ID_FIELD_BY_PAGE_TYPE[pageType];
          fileName = requestedFileName || (pageType === pageTypes.INVOICE ? buildVariantFileName(doc?.[idField], { showEInvoice, showEWayBill }) : generateSafeFileName(doc, idField));
        }

        if (!base64) {
          base64 = await blobToBase64(blob);
        }

        setStatus('done');
        if (isServerSource) {
          window.__ABSS_PDF_RESULT__ = { fileName, base64 };
          window.__ABSS_PDF_ERROR__ = null;
        }
        postToReactNative(EVENTS.DOWNLOAD_SUCCESS, { fileName, base64 });
      } catch (err) {
        const reason = err?.message || 'Failed to generate PDF.';
        setStatus('error');
        setErrorMessage(reason);
        if (isServerSource) {
          window.__ABSS_PDF_ERROR__ = reason;
          window.__ABSS_PDF_RESULT__ = null;
        }
        postToReactNative(EVENTS.DOWNLOAD_FAILED, { reason });
      }
    })();
  }, [pdfData, postToReactNative, isServerSource]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center px-4">
        {status === 'waiting' && <p className="text-gray-600">Waiting for document data...</p>}
        {status === 'generating' && <p className="text-gray-600">Generating PDF...</p>}
        {status === 'done' && <p className="text-green-600 font-medium">PDF downloaded successfully.</p>}
        {status === 'error' && <p className="text-red-600 font-medium">{errorMessage}</p>}
      </div>
    </div>
  );
};

export default DocumentPdfPreview;
