import { useState } from 'react';
import { Tooltip } from '@/components/AntDComponent';
import CustomButton from '@/components/ui/button/CustomButton';
import { E_INVOICE_STATUS, E_WAY_BILL_STATUS, GST_DOCUMENT_CANCEL_MODE, GST_DOCUMENT_GENERATE_MODE } from '@/utils/constants';
import GenerateGstDocumentModal from './GenerateGstDocumentModal';
import CancelGstDocumentModal from './CancelGstDocumentModal';
import { useGstDocumentActions } from '../useGstDocumentActions';
import { useGstFeatures } from '../useGstFeatures';

/**
 * E-invoice and e-way bill buttons, status and modals for a document detail page of any module.
 *
 * - `basePath`: the module's API base (e.g. 'creditNote'); the backend mounts the e-document routes under it.
 * - `allowEInvoice`: false for documents that only take an e-way bill (e.g. a debit note).
 * - `contextItems`: [{ label, value }] shown at the top of the modals (document number, party).
 * - `canGenerate`: the caller's permission and status check (edit right, not view-only, not draft/cancelled).
 */
const GstDocumentPanel = ({ basePath, documentId, document, documentLabel, contextItems = [], allowEInvoice = true, canGenerate = false, onChanged }) => {
  const { isEInvoicingAvailable, isEWayBillAvailable } = useGstFeatures();

  const [generateMode, setGenerateMode] = useState(null);
  const [cancelMode, setCancelMode] = useState(null);
  const actions = useGstDocumentActions({ basePath, documentId, onChanged });

  const eInvoice = document?.eInvoice;
  const eWayBill = document?.eWayBill;
  const hasActiveIrn = eInvoice?.status === E_INVOICE_STATUS?.ACT?.value;
  const hasCancelledIrn = eInvoice?.status === E_INVOICE_STATUS?.CNL?.value;
  const hasActiveEWayBill = eWayBill?.status === E_WAY_BILL_STATUS?.ACT?.value;

  const showEInvoice = allowEInvoice && isEInvoicingAvailable;
  if (!documentId || (!showEInvoice && !isEWayBillAvailable)) return null;

  const generateActions = {
    [GST_DOCUMENT_GENERATE_MODE.E_INVOICE]: actions.generateEInvoice,
    [GST_DOCUMENT_GENERATE_MODE.E_WAY_BILL]: actions.generateEWayBill,
  };

  const handleGenerate = async payload => {
    await generateActions[generateMode](payload);
    setGenerateMode(null);
  };

  const handleCancel = async cancelPayload => {
    await (cancelMode === GST_DOCUMENT_CANCEL_MODE.E_INVOICE ? actions.cancelEInvoice(cancelPayload) : actions.cancelEWayBill(cancelPayload));
    setCancelMode(null);
  };

  const button = ({ label, onClick, danger = false, disabledReason }) => (
    <Tooltip placement="left" title={disabledReason}>
      <span className="block w-full">
        <CustomButton type={danger ? 'default' : 'primary'} danger={danger} className="px-4 py-2 w-full" disabled={Boolean(disabledReason)} onClick={onClick}>
          {label}
        </CustomButton>
      </span>
    </Tooltip>
  );

  const noAccessReason = canGenerate ? null : `Not available for this ${documentLabel.toLowerCase()} in its current status or with your permissions.`;

  return (
    <>
      {showEInvoice &&
        !hasActiveIrn &&
        button({
          label: 'Generate E-Invoice',
          onClick: () => setGenerateMode(GST_DOCUMENT_GENERATE_MODE.E_INVOICE),
          disabledReason: hasCancelledIrn
            ? `This ${documentLabel.toLowerCase()}'s e-invoice (IRN) was already generated and cancelled. As per GST rules, a new IRN cannot be generated for the same number.`
            : noAccessReason,
        })}
      {showEInvoice && hasActiveIrn && button({ label: 'Cancel E-Invoice', danger: true, onClick: () => setCancelMode(GST_DOCUMENT_CANCEL_MODE.E_INVOICE), disabledReason: noAccessReason })}

      {isEWayBillAvailable && !hasActiveEWayBill && button({ label: 'Generate E-Way Bill', onClick: () => setGenerateMode(GST_DOCUMENT_GENERATE_MODE.E_WAY_BILL), disabledReason: noAccessReason })}
      {isEWayBillAvailable &&
        hasActiveEWayBill &&
        button({ label: 'Cancel E-Way Bill', danger: true, onClick: () => setCancelMode(GST_DOCUMENT_CANCEL_MODE.E_WAY_BILL), disabledReason: noAccessReason })}

      {hasActiveIrn && <p className="text-xs text-gray-600 break-all">IRN: {eInvoice.irn}</p>}

      <GenerateGstDocumentModal
        mode={generateMode}
        onClose={() => setGenerateMode(null)}
        onSubmit={handleGenerate}
        loading={Boolean(actions.loadingAction)}
        items={document?.items}
        documentLabel={documentLabel.toLowerCase()}
        hasActiveEWayBill={hasActiveEWayBill}
        allowEWayBillWithEInvoice={false}
        contextItems={contextItems}
        loadOptions={actions.loadOptions}
        onFetchGstinDetails={actions.fetchTransporterName}
        fetchGstinLoading={actions.fetchGstinLoading}
      />
      <CancelGstDocumentModal mode={cancelMode} onClose={() => setCancelMode(null)} onSubmit={handleCancel} loading={Boolean(actions.loadingAction)} />
    </>
  );
};

export default GstDocumentPanel;
