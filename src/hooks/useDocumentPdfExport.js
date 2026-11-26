import { useCallback, useState } from 'react';
import { useAuth } from 'hooks/useAuth';
import { createDocumentPdfExport, triggerBrowserPdfDownload } from '@/features/common/documentExport/documentExport.service';
import { buildListPdfExportFilters } from '@/utils/multiDocumentPdfExport';

const normalizeFiltersForApi = (raw = {}) => {
  const filters = { ...raw };
  if (filters.division && !filters.divisionId) {
    filters.divisionId = filters.division;
    delete filters.division;
  }
  if (filters.branch && !filters.branchId) {
    filters.branchId = filters.branch;
    delete filters.branch;
  }
  return filters;
};

const useDocumentPdfExport = ({ defaultFileName, filterKeys = [], moduleType }) => {
  const { companyId } = useAuth();
  const [pdfExportLoading, setPdfExportLoading] = useState(false);

  const handlePdfExport = useCallback(
    async ({ fileName, format } = {}) => {
      if (!moduleType) {
        throw new Error('PDF export moduleType is required');
      }
      if (!companyId) {
        throw new Error('Company is required for PDF export');
      }

      setPdfExportLoading(true);

      try {
        const filters = normalizeFiltersForApi(buildListPdfExportFilters(filterKeys));
        const pdfVariant = format === 'eInvoice' || format === 'eWayBill' || format === 'eInvoiceAndEWayBill' ? format : 'document';
        const created = await createDocumentPdfExport({
          moduleType,
          filters,
          fileName: fileName || defaultFileName,
          pdfVariant,
        });
        const jobId = created?.data?.jobId;
        const downloadToken = created?.data?.downloadToken;
        const totalCount = created?.data?.totalCount || 0;

        if (!jobId || !downloadToken) {
          throw new Error('Export job or download token was not created');
        }

        triggerBrowserPdfDownload({
          jobId,
          token: downloadToken,
          companyId,
        });

        return {
          background: true,
          async: true,
          jobId,
          totalCount,
          downloadStarted: true,
        };
      } finally {
        setPdfExportLoading(false);
      }
    },
    [moduleType, filterKeys, defaultFileName, companyId]
  );

  return {
    pdfExportLoading,
    handlePdfExport,
  };
};

export default useDocumentPdfExport;
