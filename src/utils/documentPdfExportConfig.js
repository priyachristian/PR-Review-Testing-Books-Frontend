/**
 * Keep in sync with BE config/documentPdfExport.config.js
 * All list PDF exports use the async backend job (no client-side MultiShowPDF).
 */
export const DOCUMENT_PDF_EXPORT_CONFIG = {
  /** Hard max for async jobs (BE enforced) */
  ASYNC_HARD_MAX: 500,
  /** Poll interval for GET /document-exports/:jobId */
  POLL_INTERVAL_MS: 2500,
  ERROR_CODES: {
    EXPORT_LIMIT_EXCEEDED: 'EXPORT_LIMIT_EXCEEDED',
    EXPORT_JOB_IN_PROGRESS: 'EXPORT_JOB_IN_PROGRESS',
    EXPORT_JOB_NOT_RETRYABLE: 'EXPORT_JOB_NOT_RETRYABLE',
  },
};
