import { useState } from 'react';
import { Dropdown } from '@/components/AntDComponent';
import CustomButton from '@/components/ui/button/CustomButton';
import Icons from 'assets/icons/icon';
import { renderPdfToBlob } from '@/utils/loadReactPdf';
import { buildVariantFileName } from '@/utils/pdfname';
import { buildEWayBillQrText } from '@/utils/pdfUtils';
import { E_INVOICE_STATUS, E_WAY_BILL_STATUS } from '@/utils/constants';
import { useGstFeatures } from '../useGstFeatures';

const QR_OPTIONS = { width: 200, margin: 1, errorCorrectionLevel: 'L' };
const toQrDataUrl = async text => (text ? (await import('qrcode')).default.toDataURL(text, QR_OPTIONS) : null);

const downloadBlob = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

const printBlob = blob => {
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = URL.createObjectURL(blob);
  document.body.appendChild(iframe);
  iframe.onload = () => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
  };
};

/**
 * Download and Print buttons for a document that can carry an e-invoice and an e-way bill. Once either is active they
 * become menus offering the same variants as the invoice: the document alone, with the e-invoice, with the e-way bill,
 * the e-way bill alone, or both.
 *
 * - `renderPdf(flags)`: returns the ShowPDF element for { showEInvoice, showEWayBill, showInvoice, qrCodeUrl, eWayBillQrCodeUrl, isEinvoicingAvailable, isEwayBillingAvailable }.
 * - `fileName`: name of the plain document PDF; `documentNumber` names the variants (e.g. CN-0001_with_ewaybill.pdf).
 * - `allowEInvoice`: false for documents that only take an e-way bill (a debit note).
 */
const GstDocumentPdfActions = ({ document, renderPdf, fileName, documentNumber, documentLabel, allowEInvoice = true }) => {
  const { isEInvoicingAvailable, isOnlyEWayBillAvailable, isEWayBillAvailable } = useGstFeatures();
  const [busyAction, setBusyAction] = useState(null);

  const hasEInvoice = allowEInvoice && isEInvoicingAvailable && document?.eInvoice?.status === E_INVOICE_STATUS.ACT.value;
  const hasEWayBill = isEWayBillAvailable && document?.eWayBill?.status === E_WAY_BILL_STATUS.ACT.value;

  const variants = [
    { key: 'only-document', label: `Only ${documentLabel}`, flags: {} },
    hasEInvoice && { key: 'with-einvoice', label: 'With E-Invoice', flags: { showEInvoice: true } },
    hasEWayBill && { key: 'with-ewaybill', label: 'With E-Way Bill', flags: { showEWayBill: true } },
    hasEWayBill && { key: 'only-ewaybill', label: 'Only E-Way Bill', flags: { showEWayBill: true, showInvoice: false } },
    hasEInvoice && hasEWayBill && { key: 'with-both', label: 'With E-Way Bill and E-Invoice', flags: { showEInvoice: true, showEWayBill: true } },
  ].filter(Boolean);

  const buildBlob = async flags => {
    const [qrCodeUrl, eWayBillQrCodeUrl] = await Promise.all([
      flags.showEInvoice ? toQrDataUrl(document?.eInvoice?.signedQrCode) : null,
      flags.showEWayBill ? toQrDataUrl(buildEWayBillQrText(document)) : null,
    ]);
    return renderPdfToBlob(
      renderPdf({
        showEInvoice: false,
        showEWayBill: false,
        showInvoice: true,
        ...flags,
        qrCodeUrl,
        eWayBillQrCodeUrl,
        isEinvoicingAvailable: isEInvoicingAvailable && allowEInvoice,
        // Without the e-invoice flag the renderer needs this one to show the e-way bill page.
        isEwayBillingAvailable: allowEInvoice ? isOnlyEWayBillAvailable : isEWayBillAvailable,
      })
    );
  };

  const run = async (action, variant) => {
    setBusyAction(action);
    try {
      const blob = await buildBlob(variant.flags);
      if (action === 'print') {
        printBlob(blob);
        return;
      }
      downloadBlob(blob, variant.key === 'only-document' ? fileName : buildVariantFileName(documentNumber, variant.flags));
    } finally {
      setBusyAction(null);
    }
  };

  const actionButton = ({ action, label, icon }) => {
    const button = (
      <CustomButton
        type="default"
        icon={icon}
        loading={busyAction === action}
        disabled={Boolean(busyAction)}
        className="flex items-center"
        onClick={variants.length === 1 ? () => run(action, variants[0]) : undefined}
      >
        {label} {variants.length > 1 && <Icons.DownOutlined />}
      </CustomButton>
    );
    if (variants.length === 1) return button;
    return (
      <Dropdown
        menu={{ items: variants.map(variant => ({ key: variant.key, label: variant.label, onClick: () => run(action, variant) })), className: 'app-toolbar-dropdown' }}
        trigger={['hover']}
        placement="bottomRight"
      >
        {button}
      </Dropdown>
    );
  };

  return (
    <>
      {actionButton({ action: 'download', label: 'Download', icon: <Icons.DownloadOutlined className="mr-2" /> })}
      {actionButton({ action: 'print', label: 'Print', icon: <Icons.PrinterOutlined className="mr-2" /> })}
    </>
  );
};

export default GstDocumentPdfActions;
