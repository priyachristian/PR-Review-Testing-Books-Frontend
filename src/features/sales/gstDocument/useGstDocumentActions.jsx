import { useCallback, useState } from 'react';
import Toast from '@/components/ui/common/Toast';
import { invoiceService } from '@/features/sales/invoice/invoice.service';
import { gstDocumentService } from './gstDocument.service';

const GSTIN_LOOKUP_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9]Z[0-9A-Z]$/;

/**
 * E-invoice / e-way bill actions for one document of any module. Each action toasts the outcome and rejects on
 * failure, which keeps the shared modals open. `onChanged` runs after a successful action (e.g. to refetch).
 */
export const useGstDocumentActions = ({ basePath, documentId, onChanged }) => {
  const [loadingAction, setLoadingAction] = useState(null);
  const [fetchGstinLoading, setFetchGstinLoading] = useState(false);

  const run = useCallback(
    async (action, call) => {
      setLoadingAction(action);
      try {
        const result = await call();
        Toast.success(result?.message || 'Done');
        await onChanged?.();
        return result;
      } catch (error) {
        Toast.error(error?.message || 'Something went wrong');
        throw error;
      } finally {
        setLoadingAction(null);
      }
    },
    [onChanged]
  );

  const generateEInvoice = useCallback(payload => run('generateEInvoice', () => gstDocumentService.generateEInvoice({ basePath, documentId, ...payload })), [basePath, documentId, run]);

  const generateEWayBill = useCallback(payload => run('generateEWayBill', () => gstDocumentService.generateEWayBill({ basePath, documentId, ...payload })), [basePath, documentId, run]);

  const cancelEInvoice = useCallback(cancelPayload => run('cancelEInvoice', () => gstDocumentService.cancelEInvoice({ basePath, documentId, cancelPayload })), [basePath, documentId, run]);

  const cancelEWayBill = useCallback(cancelPayload => run('cancelEWayBill', () => gstDocumentService.cancelEWayBill({ basePath, documentId, cancelPayload })), [basePath, documentId, run]);

  const loadOptions = useCallback(async () => (await gstDocumentService.getOptions({ basePath, documentId }))?.data, [basePath, documentId]);

  // Fills the transporter name from the GSTIN, same lookup the invoice uses.
  const fetchTransporterName = useCallback(async gstin => {
    if (!gstin || !GSTIN_LOOKUP_REGEX.test(gstin.toUpperCase())) return { error: gstin ? 'Invalid GSTIN format' : null, name: null };
    setFetchGstinLoading(true);
    try {
      const response = await invoiceService.fetchGstinDetails({ gstin });
      const details = response?.data?.data;
      return { error: null, name: details?.TradeName || details?.tradeName || null };
    } catch (error) {
      return { error: typeof error === 'string' ? error : error?.message || 'Failed to fetch transporter details', name: null };
    } finally {
      setFetchGstinLoading(false);
    }
  }, []);

  return {
    loadingAction,
    fetchGstinLoading,
    generateEInvoice,
    generateEWayBill,
    cancelEInvoice,
    cancelEWayBill,
    loadOptions,
    fetchTransporterName,
  };
};
